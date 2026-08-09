import enum
from datetime import datetime
from sqlalchemy import String, Integer, Float, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class PlanType(str, enum.Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class ConversionStatus(str, enum.Enum):
    PENDING = "pending"
    ANALYZING = "analyzing"
    OCR_PROCESSING = "ocr_processing"
    CONVERTING = "converting"
    TRANSLATING = "translating"
    COMPLETED = "completed"
    FAILED = "failed"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    plan: Mapped[PlanType] = mapped_column(Enum(PlanType), default=PlanType.FREE)
    credits_remaining: Mapped[int] = mapped_column(Integer, default=5)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    conversions: Mapped[list["Conversion"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    batch_jobs: Mapped[list["BatchJob"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Conversion(Base):
    __tablename__ = "conversions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    original_size: Mapped[int] = mapped_column(Integer, nullable=False)  # bytes
    output_size: Mapped[int | None] = mapped_column(Integer, nullable=True)  # bytes
    status: Mapped[ConversionStatus] = mapped_column(Enum(ConversionStatus), default=ConversionStatus.PENDING)
    status_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    pages_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    has_images: Mapped[bool] = mapped_column(Boolean, default=False)
    has_tables: Mapped[bool] = mapped_column(Boolean, default=False)
    is_scanned: Mapped[bool] = mapped_column(Boolean, default=False)
    ocr_used: Mapped[bool] = mapped_column(Boolean, default=False)
    translation_lang: Mapped[str | None] = mapped_column(String(10), nullable=True)
    file_path_pdf: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_path_docx: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    conversion_time_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="conversions")


class BatchJob(Base):
    __tablename__ = "batch_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    status: Mapped[ConversionStatus] = mapped_column(Enum(ConversionStatus), default=ConversionStatus.PENDING)
    total_files: Mapped[int] = mapped_column(Integer, default=0)
    completed_files: Mapped[int] = mapped_column(Integer, default=0)
    failed_files: Mapped[int] = mapped_column(Integer, default=0)
    translation_lang: Mapped[str | None] = mapped_column(String(10), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="batch_jobs")
    items: Mapped[list["BatchItem"]] = relationship(back_populates="batch_job", cascade="all, delete-orphan")


class BatchItem(Base):
    __tablename__ = "batch_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    batch_id: Mapped[int] = mapped_column(Integer, ForeignKey("batch_jobs.id"), nullable=False)
    conversion_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("conversions.id"), nullable=True)
    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[ConversionStatus] = mapped_column(Enum(ConversionStatus), default=ConversionStatus.PENDING)

    batch_job: Mapped["BatchJob"] = relationship(back_populates="items")
