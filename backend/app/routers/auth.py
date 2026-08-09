import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import User, PlanType
from app.schemas import UserRegister, UserLogin, TokenResponse, UserOut
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])

ADMIN_SECRET = "pdfforge-admin-secret-2026"


class AdminUpgradeRequest(BaseModel):
    email: str
    secret: str


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    try:
        # Check existing email
        result = await db.execute(select(User).where(User.email == data.email))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="El email ya está registrado")

        # Check existing username
        result = await db.execute(select(User).where(User.username == data.username))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="El username ya está en uso")

        user = User(
            email=data.email,
            username=data.username,
            password_hash=hash_password(data.password),
            plan=PlanType.FREE,
            credits_remaining=settings.FREE_CREDITS,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        token = create_access_token(user.id)
        return TokenResponse(
            access_token=token,
            user=UserOut.model_validate(user),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Register error")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Cuenta desactivada")

    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user=UserOut.model_validate(user),
    )


@router.get("/me", response_model=UserOut)
async def get_me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)


@router.post("/admin/upgrade")
async def admin_upgrade(data: AdminUpgradeRequest, db: AsyncSession = Depends(get_db)):
    if data.secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Clave secreta incorrecta")

    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.plan = PlanType.ENTERPRISE
    user.credits_remaining = -1
    await db.commit()

    return {"message": f"Usuario {user.email} upgradeado a Enterprise (ilimitado)"}
