from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "CertiBatch"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"

    # Database
    DATABASE_URL: str = "sqlite:///./certibatch.db"

    # Storage paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    STORAGE_DIR: Path = BASE_DIR / "storage" / "certificates"
    REPORTS_DIR: Path = BASE_DIR / "storage" / "reports"

    # Verification and frontend configuration
    FRONTEND_URL: str = "http://localhost:5173"
    BASE_VERIFY_URL: str = "http://localhost:5173/verify"

    # Safety limits
    MAX_BATCH_SIZE: int = 500

    # CORS configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()

# Ensure storage directories exist
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
