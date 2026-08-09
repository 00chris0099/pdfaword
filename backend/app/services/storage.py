import uuid
import logging
from pathlib import Path
from app.config import settings

logger = logging.getLogger("pdfforge.storage")


def generate_file_id() -> str:
    return uuid.uuid4().hex[:12]


def get_upload_path(filename: str, conversion_id: int) -> Path:
    ext = Path(filename).suffix.lower()
    file_id = f"{conversion_id}_{generate_file_id()}"
    return settings.UPLOAD_DIR / f"{file_id}{ext}"


def get_output_path(original_filename: str) -> Path:
    stem = Path(original_filename).stem
    file_id = generate_file_id()
    return settings.OUTPUT_DIR / f"{stem}_{file_id}.docx"


def cleanup_old_files(max_age_hours: int = 24) -> int:
    import time
    now = time.time()
    removed = 0

    for directory in [settings.UPLOAD_DIR, settings.OUTPUT_DIR]:
        if not directory.exists():
            continue
        for f in directory.iterdir():
            if f.is_file():
                age_hours = (now - f.stat().st_mtime) / 3600
                if age_hours > max_age_hours:
                    f.unlink()
                    removed += 1
                    logger.debug(f"Cleaned up old file: {f.name}")

    return removed
