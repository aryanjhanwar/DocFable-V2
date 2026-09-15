"""
app/routers/upload.py
──────────────────────
POST /api/upload    — accept a PDF, parse text, store session
GET  /api/upload/{session_id}  — retrieve session metadata
"""

import re
import uuid
import logging

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.store import DocumentEntry, document_store
from app.utils.pdf_parser import PdfParseError, parse_pdf

logger = logging.getLogger(__name__)

router = APIRouter()

# ─── Constants ────────────────────────────────────────────────────────────────
MAX_FILE_SIZE = 20 * 1024 * 1024   # 20 MB
MAX_CHARS     = 300_000             # trim long docs before storing


# ─── POST /api/upload ─────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_pdf(pdf: UploadFile = File(...)) -> JSONResponse:
    # ── Validate content-type ─────────────────────────────────────────────────
    if pdf.content_type not in ("application/pdf", "application/octet-stream"):
        # Some browsers send octet-stream for .pdf — be lenient on content-type
        # but enforce the file extension
        if not (pdf.filename or "").lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400, detail="Only PDF files are supported"
            )

    # ── Read & size-check ─────────────────────────────────────────────────────
    data = await pdf.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the 20 MB limit ({len(data) / 1024 / 1024:.1f} MB received)",
        )
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="No PDF file provided")

    # ── Parse ─────────────────────────────────────────────────────────────────
    try:
        result = parse_pdf(data)
    except PdfParseError as exc:
        raise HTTPException(
            status_code=422,
            detail={"error": str(exc), "detail": exc.original},
        ) from exc
    except Exception as exc:
        logger.exception("[Upload] Unexpected parse error")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    # ── Validate extracted text ───────────────────────────────────────────────
    if not result.text or len(result.text.strip()) < 10:
        raise HTTPException(
            status_code=422,
            detail=(
                "Could not extract text from this PDF. "
                "It may be scanned or image-based."
            ),
        )

    # ── Trim to max chars ─────────────────────────────────────────────────────
    truncated = len(result.text) > MAX_CHARS
    text = (
        result.text[:MAX_CHARS] + "\n\n[Document truncated due to length]"
        if truncated
        else result.text
    )

    # ── Build session ─────────────────────────────────────────────────────────
    session_id = str(uuid.uuid4())
    word_count = len(re.split(r"\s+", text.strip()))

    document_store.set(
        session_id,
        DocumentEntry(
            text=text,
            filename=pdf.filename or "document.pdf",
            page_count=result.num_pages,
            word_count=word_count,
        ),
    )

    logger.info(
        "[Upload] session=%s  file='%s'  pages=%d  words=%d  truncated=%s",
        session_id,
        pdf.filename,
        result.num_pages,
        word_count,
        truncated,
    )

    return JSONResponse(
        {
            "sessionId":  session_id,
            "filename":   pdf.filename or "document.pdf",
            "pageCount":  result.num_pages,
            "wordCount":  word_count,
            "charCount":  len(text),
            "truncated":  truncated,
            "message":    "PDF uploaded and parsed successfully",
        }
    )


# ─── GET /api/upload/{session_id} ────────────────────────────────────────────

@router.get("/upload/{session_id}")
def get_session(session_id: str) -> JSONResponse:
    doc = document_store.get(session_id)
    if doc is None:
        raise HTTPException(
            status_code=404, detail="Session not found or expired"
        )
    return JSONResponse(
        {
            "filename":  doc.filename,
            "pageCount": doc.page_count,
            "wordCount": doc.word_count,
            "charCount": len(doc.text),
        }
    )
