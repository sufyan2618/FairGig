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

    SERVICE_NAME: str = Field(default="anomaly-detection")
    SERVICE_VERSION: str = Field(default="1.0.0")
    PORT: int = Field(default=8002)
    API_PREFIX: str = Field(default="/api/anomaly")

    ACCESS_TOKEN_SECRET: str = Field(default="")
    JWT_ALGORITHM: str = Field(default="HS256")
    INTERNAL_SERVICE_API_KEY: str = Field(default="fairgig-internal-dev-key")
    ALLOW_OPEN_DETECT: bool = Field(default=False)

    ALLOWED_CORS_ORIGINS: Annotated[list[str], NoDecode] = Field(
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
