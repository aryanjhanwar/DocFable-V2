"""
app/utils/pdf_parser.py
────────────────────────
PDF text extraction with a two-attempt fallback strategy, mirroring
the Node.js pdf-parse lenient parser.

Attempt 1 — pypdf  (fast, pure-Python, handles most PDFs)
Attempt 2 — pdfminer.six  (more tolerant of malformed / linearized PDFs)

Returns a dict: { text, num_pages }
Raises PdfParseError when both attempts fail.
"""

import io
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# ─── Error type ───────────────────────────────────────────────────────────────

class PdfParseError(Exception):
    """Raised when PDF cannot be extracted by any method."""

    def __init__(self, message: str, original: str = "") -> None:
        super().__init__(message)
        self.original = original


# ─── Result ───────────────────────────────────────────────────────────────────

@dataclass
class PdfResult:
    text: str
    num_pages: int


# ─── Attempt 1: pypdf ─────────────────────────────────────────────────────────

def _parse_with_pypdf(data: bytes) -> PdfResult:
    from pypdf import PdfReader  # local import keeps startup lean

    reader = PdfReader(io.BytesIO(data))
    pages: list[str] = []
    for page in reader.pages:
        extracted = page.extract_text() or ""
        pages.append(extracted)
    return PdfResult(text="\n".join(pages), num_pages=len(reader.pages))


# ─── Attempt 2: pdfminer.six ─────────────────────────────────────────────────

def _parse_with_pdfminer(data: bytes) -> PdfResult:
    from pdfminer.high_level import extract_text_to_fp, extract_pages
    from pdfminer.layout import LAParams

    out = io.StringIO()
    extract_text_to_fp(
        io.BytesIO(data),
        out,
        laparams=LAParams(),
        output_type="text",
        codec="utf-8",
    )
    text = out.getvalue()

    # Count pages
    num_pages = sum(1 for _ in extract_pages(io.BytesIO(data)))
    return PdfResult(text=text, num_pages=num_pages)


# ─── Public interface ─────────────────────────────────────────────────────────

def parse_pdf(data: bytes) -> PdfResult:
    """
    Extract text and page count from a PDF byte buffer.

    Tries pypdf first; falls back to pdfminer.six on common structural errors.
    Raises PdfParseError if both attempts fail.
    """
    try:
        result = _parse_with_pypdf(data)
        logger.debug("[PDF] Parsed with pypdf (%d pages)", result.num_pages)
        return result
    except Exception as first_err:
        msg = str(first_err).lower()
        known_issues = (
            "xref",
            "startxref",
            "formaterror",
            "unexpectedtoken",
            "bad xref",
            "invalid xref",
            "eoferror",
            "could not find",
        )
        if not any(kw in msg for kw in known_issues):
            # Not a structural error — re-raise immediately
            raise PdfParseError(
                "PDF could not be parsed. It may be encrypted, corrupted, "
                "or in an unsupported format.",
                original=str(first_err),
            ) from first_err

        logger.warning(
            "[PDF] pypdf failed ('%s'), retrying with pdfminer …", first_err
        )

    try:
        result = _parse_with_pdfminer(data)
        logger.debug(
            "[PDF] Parsed with pdfminer (%d pages)", result.num_pages
        )
        return result
    except Exception as second_err:
        raise PdfParseError(
            "PDF could not be parsed. It may be encrypted, corrupted, "
            "or in an unsupported format.",
            original=str(second_err),
        ) from second_err
