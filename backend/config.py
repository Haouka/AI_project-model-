import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "storage" / "uploads"
PROCESSED_DIR = BASE_DIR / "storage" / "processed"
HEATMAP_DIR = BASE_DIR / "storage" / "heatmaps"
DEMO_DIR = BASE_DIR / "storage" / "demo_data"

for d in [UPLOAD_DIR, PROCESSED_DIR, HEATMAP_DIR, DEMO_DIR]:
    d.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    PROJECT_NAME: str = "DocShield AI - Identity & Document Screening System"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secure-jwt-secret-key-docshield-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'docshield.db'}")
    CORS_ORIGINS: list[str] = ["*"]
    MAX_UPLOAD_SIZE_MB: int = 20
    ALLOWED_EXTENSIONS: set[str] = {"png", "jpg", "jpeg", "webp", "tiff", "pdf"}

    class Config:
        case_sensitive = True

settings = Settings()
