import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import settings, BASE_DIR, UPLOAD_DIR, PROCESSED_DIR, HEATMAP_DIR, DEMO_DIR
from backend.database.db import Base, engine, SessionLocal
from backend.api.auth import router as auth_router, seed_default_users
from backend.api.cases import router as cases_router
from backend.api.evidence import router as evidence_router
from backend.api.rules_api import router as rules_router
from backend.api.audit_api import router as audit_router
from backend.api.analytics_api import router as analytics_router
from backend.api.demo_api import router as demo_router
from backend.services.demo_generator import generate_demo_documents


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    Base.metadata.create_all(bind=engine)
    # Seed default user accounts
    db = SessionLocal()
    try:
        seed_default_users(db)
        # Pre-generate synthetic demo assets
        generate_demo_documents()
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Assisted Identity & Document Screening Platform API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static file routes for images and heatmaps
app.mount("/api/v1/storage/documents", StaticFiles(directory=str(UPLOAD_DIR)), name="documents")
app.mount("/api/v1/storage/heatmaps", StaticFiles(directory=str(HEATMAP_DIR)), name="heatmaps")
app.mount("/api/v1/storage/processed", StaticFiles(directory=str(PROCESSED_DIR)), name="processed")
app.mount("/api/v1/storage/demo", StaticFiles(directory=str(DEMO_DIR)), name="demo")

# Include API routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(cases_router, prefix=settings.API_V1_STR)
app.include_router(evidence_router, prefix=settings.API_V1_STR)
app.include_router(rules_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(demo_router, prefix=settings.API_V1_STR)


@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "reference_date": "2026-09-19",
    }


# Mount built frontend SPA if available
frontend_dist = BASE_DIR / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
