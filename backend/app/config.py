import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel

# Load .env from project root
load_dotenv(Path(__file__).resolve().parents[2] / ".env")


class Settings(BaseModel):
    env: str = os.getenv("APP_ENV", "local")
    api_host: str = os.getenv("API_HOST", "0.0.0.0")
    api_port: int = int(os.getenv("API_PORT", "8000"))

    database_url: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./app.db",  # can be swapped to Postgres in production
    )

    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")

    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")
    google_client_secret: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    google_redirect_uri: str = os.getenv(
        "GOOGLE_REDIRECT_URI",
        "http://localhost:8000/api/oauth/google/callback",
    )

    notion_client_id: str = os.getenv("NOTION_CLIENT_ID", "")
    notion_client_secret: str = os.getenv("NOTION_CLIENT_SECRET", "")
    notion_redirect_uri: str = os.getenv(
        "NOTION_REDIRECT_URI",
        "http://localhost:8000/api/oauth/notion/callback",
    )

    todoist_client_id: str = os.getenv("TODOIST_CLIENT_ID", "")
    todoist_client_secret: str = os.getenv("TODOIST_CLIENT_SECRET", "")
    todoist_redirect_uri: str = os.getenv(
        "TODOIST_REDIRECT_URI",
        "http://localhost:8000/api/oauth/todoist/callback",
    )

    # security
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "change-me-in-prod")
    jwt_algorithm: str = "HS256"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()


