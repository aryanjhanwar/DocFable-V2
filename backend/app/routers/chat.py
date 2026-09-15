"""
app/routers/chat.py
────────────────────
POST /api/chat — SSE streaming endpoint with automatic model fallback.

If the primary OpenRouter model is rate-limited (429), the backend
automatically retries with the next model in the fallback list,
transparent to the user.

SSE event format:
    data: {"type": "start",  "mode": "...", "filename": "..."}\n\n
    data: {"type": "delta",  "content": "..."}\n\n
    data: {"type": "done"}\n\n
    data: {"type": "error",  "message": "..."}\n\n
"""

import json
import logging
from typing import AsyncGenerator

import httpx
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.config import get_settings
from app.store import document_store
from app.utils.prompt_builder import build_prompt

logger = logging.getLogger(__name__)

router = APIRouter()

# ─── Timeouts ─────────────────────────────────────────────────────────────────
_TIMEOUT = httpx.Timeout(connect=15.0, read=90.0, write=30.0, pool=5.0)

# ─── Free model fallback list ─────────────────────────────────────────────────
# If the primary model (from .env) is rate-limited, we try these in order.
_FREE_FALLBACK_MODELS = [
    "google/gemma-4-31b-it:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "nvidia/nemotron-3.5-lightning:free",
    "liquid/lfm-2.5-2.6b:free",
]


# ─── Request schema ───────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    sessionId:   str
    mode:        str = "chat"
    question:    str = ""
    summaryType: str = "executive"
    quizType:    str = "mcq"
    count:       int = 10


# ─── SSE helpers ──────────────────────────────────────────────────────────────

def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


def _temperature(mode: str) -> float:
    return 0.3 if mode in ("quiz", "flashcards") else 0.7


# ─── Single-model OpenRouter stream attempt ───────────────────────────────────

class RateLimitError(Exception):
    pass

class AuthError(Exception):
    pass


async def _try_openrouter_model(
    model: str,
    messages: list[dict],
    temperature: float,
) -> AsyncGenerator[str, None]:
    """
    Attempt to stream from a single OpenRouter model.
    Raises RateLimitError on 429, AuthError on 401, RuntimeError on other failures.
    """
    settings = get_settings()

    payload = {
        "model":       model,
        "messages":    messages,
        "stream":      True,
        "temperature": temperature,
        "max_tokens":  4096,
    }

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type":  "application/json",
        "HTTP-Referer":  settings.frontend_url,
        "X-Title":       "DocFable",
    }

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        async with client.stream(
            "POST",
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
        ) as resp:
            # ── Handle non-200 before streaming ───────────────────────────────
            if resp.status_code == 429:
                body = await resp.aread()
                raise RateLimitError(body.decode()[:200])
            if resp.status_code == 401:
                body = await resp.aread()
                raise AuthError(body.decode()[:200])
            if resp.status_code != 200:
                body = await resp.aread()
                body_str = body.decode()[:300]
                # Treat model-unavailable as a rate-limit so we fall through
                if "unavailable" in body_str.lower() or resp.status_code == 404:
                    raise RateLimitError(body_str)
                raise RuntimeError(f"OpenRouter {resp.status_code}: {body_str}")

            # ── Stream SSE chunks ──────────────────────────────────────────────
            buffer = ""
            async for raw_chunk in resp.aiter_text():
                buffer += raw_chunk
                lines = buffer.split("\n")
                buffer = lines.pop()

                for line in lines:
                    stripped = line.strip()
                    if not stripped or stripped == "data: [DONE]":
                        continue
                    if not stripped.startswith("data: "):
                        continue
                    try:
                        chunk_json = json.loads(stripped[6:])
                        content = (
                            chunk_json.get("choices", [{}])[0]
                            .get("delta", {})
                            .get("content")
                        )
                        if content:
                            yield _sse({"type": "delta", "content": content})
                    except (json.JSONDecodeError, IndexError):
                        pass


# ─── OpenRouter stream WITH automatic fallback ────────────────────────────────

async def _stream_openrouter(
    prompt: dict[str, str], mode: str
) -> AsyncGenerator[str, None]:
    settings = get_settings()
    temperature = _temperature(mode)

    messages: list[dict] = []
    if prompt.get("system"):
        messages.append({"role": "system", "content": prompt["system"]})
    messages.append({"role": "user", "content": prompt["user"]})

    # Build candidate list: primary from .env first, then fallbacks (deduped)
    primary = settings.openrouter_model
    candidates = [primary] + [m for m in _FREE_FALLBACK_MODELS if m != primary]

    last_error: Exception = RuntimeError("No models available")

    for model in candidates:
        try:
            logger.info("[Chat] mode=%s  model=%s  trying…", mode, model)
            async for chunk in _try_openrouter_model(model, messages, temperature):
                yield chunk
            logger.info("[Chat] mode=%s  model=%s  ✓ done", mode, model)
            return  # success — stop trying fallbacks
        except RateLimitError as e:
            logger.warning("[Chat] model=%s rate-limited, trying next…  (%s)", model, str(e)[:80])
            last_error = e
            continue
        except AuthError as e:
            # Bad API key — no point trying other models
            raise RuntimeError(
                "🔑 Invalid OpenRouter API key. Check OPENROUTER_API_KEY in your .env file."
            ) from e
        except httpx.ReadTimeout:
            logger.warning("[Chat] model=%s timed out, trying next…", model)
            last_error = httpx.ReadTimeout("timeout")
            continue
        except Exception as e:
            logger.warning("[Chat] model=%s error: %s — trying next…", model, e)
            last_error = e
            continue

    # All models exhausted
    raise RuntimeError(
        f"⚠️ All free AI models are currently rate-limited. "
        f"Please wait 1–2 minutes and try again. (Last error: {last_error})"
    )


# ─── Gemini stream ────────────────────────────────────────────────────────────

async def _stream_gemini(
    prompt: dict[str, str], mode: str
) -> AsyncGenerator[str, None]:
    import asyncio
    import google.generativeai as genai

    settings = get_settings()
    genai.configure(api_key=settings.gemini_api_key)

    model = genai.GenerativeModel(
        model_name=settings.gemini_model,
        system_instruction=prompt.get("system", ""),
        generation_config={
            "temperature":       _temperature(mode),
            "max_output_tokens": 4096,
        },
    )

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None, lambda: model.generate_content(prompt["user"], stream=True)
    )

    for chunk in result:
        text = getattr(chunk, "text", "") or ""
        if text:
            yield _sse({"type": "delta", "content": text})


# ─── Main SSE generator ───────────────────────────────────────────────────────

async def _chat_generator(req: ChatRequest) -> AsyncGenerator[str, None]:
    settings = get_settings()

    doc = document_store.get(req.sessionId)
    if doc is None:
        yield _sse({
            "type":    "error",
            "message": "Session not found or expired. Please re-upload your PDF.",
        })
        return

    if not settings.has_openrouter and not settings.has_gemini:
        yield _sse({
            "type":    "error",
            "message": (
                "No AI API key configured. Add OPENROUTER_API_KEY or "
                "GEMINI_API_KEY to your backend .env file."
            ),
        })
        return

    prompt = build_prompt(
        req.mode,
        doc.text,
        question=req.question,
        summary_type=req.summaryType,
        quiz_type=req.quizType,
        count=req.count,
    )

    yield _sse({"type": "start", "mode": req.mode, "filename": doc.filename})

    try:
        openrouter_all_failed = False

        if settings.has_openrouter:
            try:
                async for chunk in _stream_openrouter(prompt, req.mode):
                    yield chunk
                yield _sse({"type": "done"})
                return  # OpenRouter succeeded
            except RuntimeError as exc:
                if "rate-limited" in str(exc).lower():
                    logger.warning(
                        "[Chat] All OpenRouter models rate-limited → falling back to Gemini"
                    )
                    openrouter_all_failed = True
                else:
                    raise  # auth error, connect error, etc.

        # ── Gemini: primary (no OR key) or final fallback (all OR rate-limited) ──
        if settings.has_gemini:
            if openrouter_all_failed:
                logger.info("[Chat] Gemini fallback  model=%s", settings.gemini_model)
            else:
                logger.info("[Chat] Gemini primary  model=%s", settings.gemini_model)
            async for chunk in _stream_gemini(prompt, req.mode):
                yield chunk
            yield _sse({"type": "done"})
        elif openrouter_all_failed:
            yield _sse({
                "type":    "error",
                "message": (
                    "⚠️ All free AI models are currently busy. "
                    "Please wait 1–2 minutes and try again."
                ),
            })

    except httpx.ConnectError:
        yield _sse({
            "type":    "error",
            "message": "🔌 Could not connect to OpenRouter. Check your internet connection.",
        })
    except Exception as exc:
        logger.error("[Chat] Unhandled error (mode=%s): %s", req.mode, exc)
        yield _sse({"type": "error", "message": str(exc)})


# ─── Route ────────────────────────────────────────────────────────────────────

@router.post("/chat")
async def chat(req: ChatRequest) -> StreamingResponse:
    return StreamingResponse(
        _chat_generator(req),
        media_type="text/event-stream",
        headers={
            "Cache-Control":     "no-cache",
            "Connection":        "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
