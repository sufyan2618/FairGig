import json
import os

from pydantic import ConfigDict, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = ConfigDict(
        extra="ignore",
        env_file=f".env.{os.getenv('ENVIRONMENT', 'development')}",
        env_file_encoding="utf-8",
    )

    APP_NAME: str = Field(default="FairGig Auth Service")
    API_PREFIX: str = Field(default="/api")
    ENVIRONMENT: str = Field(default="development")

    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/fairgig_auth"
    )
    REDIS_URL: str = Field(default="redis://localhost:6379/0")

    ACCESS_TOKEN_SECRET: str = Field(default="change-access-token-secret")
    REFRESH_TOKEN_SECRET: str = Field(default="change-refresh-token-secret")
    OTP_HASH_SECRET: str = Field(default="change-otp-hash-secret")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=14)

    OTP_EXPIRE_MINUTES: int = Field(default=10)
    OTP_LENGTH: int = Field(default=6)
    OTP_VERIFY_MAX_ATTEMPTS: int = Field(default=5)

    BREVO_BASE_URL: str = Field(default="https://api.brevo.com/v3")
    BREVO_API_KEY: str = Field(default="")
    BREVO_SENDER_EMAIL: str = Field(default="no-reply@fairgig.app")
    BREVO_SENDER_NAME: str = Field(default="FairGig")

    API_RATE_LIMIT_WINDOW_SECONDS: int = Field(default=60)
    API_RATE_LIMIT_MAX_REQUESTS: int = Field(default=120)
    EMAIL_SEND_RATE_LIMIT_WINDOW_SECONDS: int = Field(default=3600)
    EMAIL_SEND_RATE_LIMIT_MAX_REQUESTS: int = Field(default=5)
    LOGIN_RATE_LIMIT_WINDOW_SECONDS: int = Field(default=300)
    LOGIN_RATE_LIMIT_MAX_REQUESTS: int = Field(default=10)

    ALLOWED_CORS_ORIGINS: str = Field(default="http://localhost:5173,http://localhost:8080")

    @property
    def allowed_cors_origins(self) -> list[str]:
        raw_value = self.ALLOWED_CORS_ORIGINS.strip()
        if not raw_value:
            return ["http://localhost:5173", "http://localhost:8080"]
        if raw_value.startswith("["):
            try:
                parsed = json.loads(raw_value)
                if isinstance(parsed, list):
                    return [str(origin).strip() for origin in parsed if str(origin).strip()]
            except json.JSONDecodeError:
                return ["http://localhost:5173", "http://localhost:8080"]
        return [origin.strip() for origin in raw_value.split(",") if origin.strip()]


settings = Settings()
