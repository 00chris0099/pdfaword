import uuid
import logging
from pathlib import Path
from datetime import datetime
from sqlalchemy import select
from app.database import async_session
from app.models import BatchJob, BatchItem, Conversion, ConversionStatus
from app.config import settings
from app.services.converter import run_conversion

logger = logging.getLogger("pdfforge.batch")


async def create_batch(
    user_id: int,
    file_paths: list[Path],
    original_names: list[str],
    translate_to: str | None = None,
) -> BatchJob:
    async with async_session() as db:
        batch = BatchJob(
            user_id=user_id,
            status=ConversionStatus.PENDING,
            total_files=len(file_paths),
            translation_lang=translate_to,
        )
        db.add(batch)
        await db.commit()
        await db.refresh(batch)

        for pdf_path, name in zip(file_paths, original_names):
            # Create conversion record
            conversion = Conversion(
                user_id=user_id,
                original_filename=name,
                original_size=pdf_path.stat().st_size,
                status=ConversionStatus.PENDING,
                file_path_pdf=str(pdf_path),
                translation_lang=translate_to,
            )
            db.add(conversion)
            await db.commit()
            await db.refresh(conversion)

            # Create batch item
            item = BatchItem(
                batch_id=batch.id,
                conversion_id=conversion.id,
                filename=name,
                status=ConversionStatus.PENDING,
            )
            db.add(item)

        await db.commit()
        logger.info(f"Batch {batch.id} created with {len(file_paths)} files")
        return batch


async def process_batch(batch_id: int):
    import asyncio
    from app.services.converter import run_conversion

    async with async_session() as db:
        result = await db.execute(
            select(BatchItem).where(BatchItem.batch_id == batch_id)
        )
        items = result.scalars().all()

        batch_result = await db.execute(select(BatchJob).where(BatchJob.id == batch_id))
        batch = batch_result.scalar_one_or_none()
        if batch:
            batch.status = ConversionStatus.CONVERTING
            await db.commit()

    # Process items with concurrency limit
    semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_CONVERSIONS)

    async def process_item(item: BatchItem):
        async with semaphore:
            try:
                await run_conversion(item.conversion_id)
                async with async_session() as db:
                    item_result = await db.execute(
                        select(BatchItem).where(BatchItem.id == item.id)
                    )
                    db_item = item_result.scalar_one_or_none()
                    if db_item:
                        db_item.status = ConversionStatus.COMPLETED
                        await db.commit()
            except Exception as e:
                logger.exception(f"Batch item {item.id} failed: {e}")
                async with async_session() as db:
                    item_result = await db.execute(
                        select(BatchItem).where(BatchItem.id == item.id)
                    )
                    db_item = item_result.scalar_one_or_none()
                    if db_item:
                        db_item.status = ConversionStatus.FAILED
                        await db.commit()

    await asyncio.gather(*[process_item(item) for item in items])

    # Update batch status
    async with async_session() as db:
        batch_result = await db.execute(select(BatchJob).where(BatchJob.id == batch_id))
        batch = batch_result.scalar_one_or_none()
        if batch:
            items_result = await db.execute(
                select(BatchItem).where(BatchItem.batch_id == batch_id)
            )
            all_items = items_result.scalars().all()
            batch.completed_files = sum(1 for i in all_items if i.status == ConversionStatus.COMPLETED)
            batch.failed_files = sum(1 for i in all_items if i.status == ConversionStatus.FAILED)
            batch.status = ConversionStatus.COMPLETED
            batch.completed_at = datetime.utcnow()
            await db.commit()

    logger.info(f"Batch {batch_id} completed")
