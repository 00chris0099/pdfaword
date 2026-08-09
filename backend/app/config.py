from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    APP_NAME: str = "PDFForge"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # JWT
    SECRET_KEY: str = "pdfforge-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 52560000  # 100 years

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/pdfforge.db"

    # File Storage
    UPLOAD_DIR: Path = Path("./data/uploads")
    OUTPUT_DIR: Path = Path("./data/outputs")
    MAX_FILE_SIZE_MB: int = 100

    # Conversion
    MAX_CONCURRENT_CONVERSIONS: int = 3
    OCR_DPI: int = 300

    # Plans
    FREE_CREDITS: int = 5
    FREE_MAX_PAGES: int = 20
    PRO_CREDITS: int = 100
    PRO_MAX_PAGES: int = 500
    ENTERPRISE_CREDITS: int = -1  # unlimited
    ENTERPRISE_MAX_PAGES: int = -1  # unlimited

    # CORS
    CORS_ORIGINS: list[str] = ["*"]

    model_config = {"env_file": ".env", "extra": "ignore"}

    def ensure_dirs(self):
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        self.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


settings = Settings()
settings.ensure_dirs()
