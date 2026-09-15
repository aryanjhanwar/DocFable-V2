"""
app/main.py
────────────
FastAPI application factory.

Registers:
  - CORS middleware (same origin list as old Express server)
  - /api/health
  - /api/upload  (POST + GET /{session_id})
  - /api/chat    (POST, SSE stream)

Lifespan:
  - Starts the document-store cleanup daemon on startup
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.store import document_store
from app.routers import health, upload, chat

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("")
    logger.info("🚀 DocFable Backend (FastAPI) starting …")
    logger.info("   Model (Gemini):     %s", settings.gemini_model)
    logger.info("   Model (OpenRouter): %s", settings.openrouter_model)
    logger.info("   OpenRouter key:     %s", "✓ set" if settings.has_openrouter else "✗ missing")
    logger.info("   Gemini key:         %s", "✓ set" if settings.has_gemini  else "✗ missing")
    logger.info("   CORS origin:        %s", settings.frontend_url)
    logger.info("")

    document_store.start_cleanup_thread()
    yield
    logger.info("DocFable Backend shutting down.")


# ─── App ──────────────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="DocFable Backend",
        description="AI-powered PDF analysis API",
        version="2.0.0",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    origins = list(
        {
            settings.frontend_url,
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:4173",
        }
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────────────────────────
    app.include_router(health.router, prefix="/api")
    app.include_router(upload.router, prefix="/api")
    app.include_router(chat.router,   prefix="/api")

    # ── Global 404 handler ────────────────────────────────────────────────────
    @app.exception_handler(404)
    async def not_found(_: Request, exc):  # noqa: ANN001
        return JSONResponse(status_code=404, content={"error": "Route not found"})

    # ── Global exception handler ──────────────────────────────────────────────
    @app.exception_handler(Exception)
    async def unhandled(_: Request, exc: Exception):
        logger.exception("[Error] Unhandled exception")
        return JSONResponse(
            status_code=500,
            content={"error": str(exc) or "Internal server error"},
        )

    return app


app = create_app()
