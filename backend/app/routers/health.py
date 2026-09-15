"""
app/routers/health.py
──────────────────────
GET /api/health
"""

from datetime import datetime, timezone

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.config import get_settings

router = APIRouter()


@router.get("/health")
def health_check() -> JSONResponse:
    settings = get_settings()
    return JSONResponse(
        {
            "status": "ok",
            "service": "DocFable Backend",
            "version": "2.0.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "model": settings.gemini_model,
            "framework": "FastAPI",
        }
    )
