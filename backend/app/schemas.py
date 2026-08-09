from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from app.models import PlanType, ConversionStatus


# ── Auth ──────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    email: str
    username: str
    plan: PlanType
    credits_remaining: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Conversion ────────────────────────────────────────

class ConversionResponse(BaseModel):
    id: int
    original_filename: str
    original_size: int
    output_size: int | None
    status: ConversionStatus
    status_message: str | None
    pages_count: int | None
    has_images: bool
    has_tables: bool
    is_scanned: bool
    ocr_used: bool
    translation_lang: str | None
    conversion_time_seconds: float | None
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class ConversionListResponse(BaseModel):
    conversions: list[ConversionResponse]
    total: int
    page: int
    per_page: int


class ConversionUploadResponse(BaseModel):
    id: int
    message: str
    status: ConversionStatus
    original_filename: str


# ── Batch ─────────────────────────────────────────────

class BatchItemResponse(BaseModel):
    id: int
    filename: str
    status: ConversionStatus
    conversion_id: int | None
    output_size: int | None

    model_config = {"from_attributes": True}


class BatchUploadResponse(BaseModel):
    id: int
    message: str
    total_files: int
    status: ConversionStatus


class BatchStatusResponse(BaseModel):
    id: int
    status: ConversionStatus
    total_files: int
    completed_files: int
    failed_files: int
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class BatchDetailResponse(BaseModel):
    id: int
    status: ConversionStatus
    total_files: int
    completed_files: int
    failed_files: int
    created_at: datetime
    completed_at: datetime | None
    items: list[BatchItemResponse]

    model_config = {"from_attributes": True}


# ── General ───────────────────────────────────────────

class ErrorResponse(BaseModel):
    detail: str


class HealthResponse(BaseModel):
    status: str
    version: str
