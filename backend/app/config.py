"""
app/config.py
─────────────
Application settings loaded from environment variables / .env file.
Uses pydantic-settings for validation and type coercion.
"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ─── AI Providers ─────────────────────────────────────────────────────────
    openrouter_api_key: str = Field(default="", alias="OPENROUTER_API_KEY")
    openrouter_model: str = Field(
        default="google/gemma-4-31b-it:free", alias="OPENROUTER_MODEL"
    )

    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-3.5-flash-lite", alias="GEMINI_MODEL")

    # ─── Server ───────────────────────────────────────────────────────────────
    port: int = Field(default=5000, alias="PORT")
    frontend_url: str = Field(default="http://localhost:5173", alias="FRONTEND_URL")
    environment: str = Field(default="development", alias="ENVIRONMENT")

    # ─── Computed helpers ─────────────────────────────────────────────────────
    @property
    def has_openrouter(self) -> bool:
        return bool(
            self.openrouter_api_key
            and self.openrouter_api_key != "your_openrouter_key_here"
        )

    @property
    def has_gemini(self) -> bool:
        return bool(
            self.gemini_api_key
            and self.gemini_api_key != "your_gemini_api_key_here"
        )


@lru_cache
def get_settings() -> Settings:
    """Return a cached singleton Settings instance."""
    return Settings()


def reload_settings() -> Settings:
    """Bust the cache and reload settings from .env (used after .env changes)."""
    get_settings.cache_clear()
    return get_settings()
