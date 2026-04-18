from __future__ import annotations

from typing import Any

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class AnalyticsBase(DeclarativeBase):
    pass


ANALYTICS_SYNC_DATABASE_URL = settings.DATABASE_URL.replace("+asyncpg", "+psycopg2")
EARNINGS_SYNC_DATABASE_URL = settings.EARNINGS_DATABASE_URL.replace("+asyncpg", "+psycopg2")

analytics_engine = create_engine(
    ANALYTICS_SYNC_DATABASE_URL,
    pool_pre_ping=True,
    future=True,
)

earnings_engine = create_engine(
    EARNINGS_SYNC_DATABASE_URL,
    pool_pre_ping=True,
    future=True,
)


def db_health() -> str:
    try:
        with analytics_engine.connect() as analytics_connection:
            analytics_connection.execute(text("SELECT 1"))

        with earnings_engine.connect() as earnings_connection:
            earnings_connection.execute(text("SELECT 1"))

        return "connected"
    except Exception:
        return "disconnected"


def fetch_all(query: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    with earnings_engine.connect() as connection:
        result = connection.execute(text(query), params or {})
        return [dict(row._mapping) for row in result]


def fetch_one(query: str, params: dict[str, Any] | None = None) -> dict[str, Any] | None:
    with earnings_engine.connect() as connection:
        result = connection.execute(text(query), params or {})
        row = result.first()
        if not row:
            return None
        return dict(row._mapping)