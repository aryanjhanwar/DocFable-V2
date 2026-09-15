"""
app/store.py
────────────
Thread-safe in-memory document store.

Each session entry:
    {
        "text":        str,
        "filename":    str,
        "page_count":  int,
        "word_count":  int,
        "uploaded_at": float,   # time.time()
    }

Sessions expire after 2 hours. A background daemon thread sweeps every 30 min.
"""

import logging
import threading
import time
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)

_TTL_SECONDS = 2 * 60 * 60        # 2 hours
_SWEEP_INTERVAL = 30 * 60         # 30 minutes


@dataclass
class DocumentEntry:
    text: str
    filename: str
    page_count: int
    word_count: int
    uploaded_at: float = field(default_factory=time.time)


class DocumentStore:
    """Thread-safe session store with automatic TTL eviction."""

    def __init__(self) -> None:
        self._store: dict[str, DocumentEntry] = {}
        self._lock = threading.Lock()

    # ── Public API ────────────────────────────────────────────────────────────

    def set(self, session_id: str, entry: DocumentEntry) -> None:
        with self._lock:
            self._store[session_id] = entry

    def get(self, session_id: str) -> Optional[DocumentEntry]:
        with self._lock:
            return self._store.get(session_id)

    def delete(self, session_id: str) -> None:
        with self._lock:
            self._store.pop(session_id, None)

    # ── Cleanup ───────────────────────────────────────────────────────────────

    def _sweep(self) -> None:
        """Remove sessions older than TTL."""
        now = time.time()
        with self._lock:
            expired = [
                sid
                for sid, entry in self._store.items()
                if now - entry.uploaded_at > _TTL_SECONDS
            ]
            for sid in expired:
                del self._store[sid]
        if expired:
            logger.info("[Store] Evicted %d expired session(s)", len(expired))

    def start_cleanup_thread(self) -> None:
        """Spawn a daemon thread that periodically sweeps the store."""

        def _loop() -> None:
            while True:
                time.sleep(_SWEEP_INTERVAL)
                try:
                    self._sweep()
                except Exception:
                    logger.exception("[Store] Sweep error")

        t = threading.Thread(target=_loop, daemon=True, name="store-cleanup")
        t.start()
        logger.info("[Store] Cleanup thread started (interval=%ds)", _SWEEP_INTERVAL)


# ── Singleton ─────────────────────────────────────────────────────────────────
document_store = DocumentStore()
