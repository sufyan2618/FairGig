import json
import os

from pydantic import ConfigDict, Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = ConfigDict(
        extra="ignore",
        env_file=f".env.{os.getenv('ENVIRONMENT', 'development')}",
        env_file_encoding="utf-8",
    )

    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/ecommerce_orders"
    )
    SECRET_KEY: str = Field(default="change-this-secret")
    SERVER_URL: str = Field(default="http://localhost:8000")
    PRODUCT_SERVICE_URL: str = Field(default="http://localhost:3000/api")
    ALLOWED_CORS_ORIGINS: list[str] = Field(
        default=["http://localhost:5173", "http://localhost:8080"]
    )

    @field_validator("ALLOWED_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: object) -> list[str]:
        if value is None or value == "":
            return ["http://localhost:5173", "http://localhost:8080"]
        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                return ["http://localhost:5173", "http://localhost:8080"]
            if stripped.startswith("["):
                return json.loads(stripped)
            return [origin.strip() for origin in stripped.split(",") if origin.strip()]
        if isinstance(value, list):
            return value
        return ["http://localhost:5173", "http://localhost:8080"]


settings = Settings()
