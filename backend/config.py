import os
import json
import logging
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("docshield.config")

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "storage" / "uploads"
PROCESSED_DIR = BASE_DIR / "storage" / "processed"
HEATMAP_DIR = BASE_DIR / "storage" / "heatmaps"
DEMO_DIR = BASE_DIR / "storage" / "demo_data"

for d in [UPLOAD_DIR, PROCESSED_DIR, HEATMAP_DIR, DEMO_DIR]:
    d.mkdir(parents=True, exist_ok=True)


def _get_secret_key() -> str:
    env_mode = os.getenv("ENVIRONMENT", "development").lower()
    secret = os.getenv("SECRET_KEY", "").strip()
    if not secret:
        if env_mode == "production":
            raise RuntimeError("CRITICAL SECURITY ERROR: SECRET_KEY must be set in production.")
        # Explicit development-only fallback with warning
        logger.warning(
            "Running with development-only fallback key. Set SECRET_KEY before deploying to production."
        )
        return "dev-only-secret-key-replace-in-production-docshield-2026"
    return secret


def _get_cors_origins() -> list[str]:
    default_dev_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    raw_env = os.getenv("CORS_ORIGINS", "").strip()
    if not raw_env:
        return default_dev_origins

    try:
        parsed = json.loads(raw_env)
        if isinstance(parsed, list):
            return [str(item).strip() for item in parsed if item]
    except Exception:
        pass

    origins = [item.strip() for item in raw_env.split(",") if item.strip()]
    return origins if origins else default_dev_origins


class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True, extra="ignore")

    PROJECT_NAME: str = "DocShield AI - Identity & Document Screening System"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    SECRET_KEY: str = _get_secret_key()
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'docshield.db'}")
    CORS_ORIGINS: list[str] = _get_cors_origins()
    MAX_UPLOAD_SIZE_MB: int = 20
    ALLOWED_EXTENSIONS: set[str] = {"png", "jpg", "jpeg", "webp", "tiff", "pdf"}


settings = Settings()
