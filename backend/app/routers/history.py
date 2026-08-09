from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import User, Conversion
from app.schemas import ConversionResponse, ConversionListResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=ConversionListResponse)
async def get_history(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Count total
    count_result = await db.execute(
        select(func.count(Conversion.id)).where(Conversion.user_id == user.id)
    )
    total = count_result.scalar()

    # Fetch page
    offset = (page - 1) * per_page
    result = await db.execute(
        select(Conversion)
        .where(Conversion.user_id == user.id)
        .order_by(Conversion.created_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    conversions = result.scalars().all()

    return ConversionListResponse(
        conversions=[ConversionResponse.model_validate(c) for c in conversions],
        total=total,
        page=page,
        per_page=per_page,
    )
