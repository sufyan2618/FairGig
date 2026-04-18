import json
from typing import Annotated

from pydantic import ConfigDict, Field, field_validator
from pydantic_settings import BaseSettings, NoDecode


class Settings(BaseSettings):
    model_config = ConfigDict(
        extra="ignore",
        env_file=".env.development",
        env_file_encoding="utf-8",
    )

    SERVICE_NAME: str = Field(default="analytics-service")
    SERVICE_VERSION: str = Field(default="1.0.0")
    PORT: int = Field(default=8003)
    API_PREFIX: str = Field(default="/api/analytics")

    DATABASE_URL: str = Field(default="postgresql+asyncpg://postgres:postgres@localhost:5432/fairgig_analytics")
    EARNINGS_DATABASE_URL: str = Field(default="postgresql+asyncpg://postgres:postgres@localhost:5432/fairgig_earnings")
    JWT_SECRET: str = Field(default="")
    ACCESS_TOKEN_SECRET: str = Field(default="")
    JWT_ALGORITHM: str = Field(default="HS256")

    CACHE_TTL_SECONDS: int = Field(default=900)
    PLATFORMS_CACHE_TTL_SECONDS: int = Field(default=1800)
    GRIEVANCE_CACHE_TTL_SECONDS: int = Field(default=300)
    MIN_COHORT_SIZE: int = Field(default=5)
    WORKER_REF_SALT: str = Field(default="fairgig-worker-ref-salt")

    GRIEVANCE_SERVICE_URL: str = Field(default="http://localhost:3002/api/grievances")
    GRIEVANCE_TIMEOUT_SECONDS: float = Field(default=5.0)

    CORS_ORIGINS: Annotated[list[str], NoDecode] = Field(
        default=["http://localhost:5173", "http://localhost:8080"]
    )

    @field_validator("CORS_ORIGINS", mode="before")
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


def get_jwt_secret() -> str:
    return settings.JWT_SECRET or settings.ACCESS_TOKEN_SECRET
