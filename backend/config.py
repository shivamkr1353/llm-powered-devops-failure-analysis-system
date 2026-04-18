import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


def _parse_csv_env(name: str, default: list[str]) -> list[str]:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default

    return [item.strip() for item in raw_value.split(",") if item.strip()]


def _parse_int_env(name: str, default: int) -> int:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default

    try:
        return int(raw_value)
    except ValueError:
        return default


def _parse_bool_env(name: str, default: bool) -> bool:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default

    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    environment: str
    gemini_api_key: str | None
    gemini_model: str
    cors_origins: list[str]
    max_log_chars: int
    rate_limit_requests: int
    rate_limit_window_seconds: int
    serve_frontend: bool
    frontend_dist_dir: Path


@lru_cache
def get_settings() -> Settings:
    backend_dir = Path(__file__).resolve().parent
    frontend_dist_dir = backend_dir.parent / "frontend" / "dist"
    environment = os.getenv("ENVIRONMENT", "development").strip().lower() or "development"

    default_origins = ["http://localhost:5173"] if environment == "development" else []

    return Settings(
        environment=environment,
        gemini_api_key=os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY"),
        gemini_model=(
            os.getenv("GEMINI_MODEL")
            or os.getenv("OPENAI_MODEL")
            or "gemini-3.1-flash-lite-preview"
        ).strip()
        or "gemini-3.1-flash-lite-preview",
        cors_origins=_parse_csv_env("CORS_ORIGINS", default_origins),
        max_log_chars=max(1000, _parse_int_env("MAX_LOG_CHARS", 20000)),
        rate_limit_requests=max(1, _parse_int_env("RATE_LIMIT_REQUESTS", 10)),
        rate_limit_window_seconds=max(1, _parse_int_env("RATE_LIMIT_WINDOW_SECONDS", 60)),
        serve_frontend=_parse_bool_env("SERVE_FRONTEND", True),
        frontend_dist_dir=frontend_dist_dir,
    )
