from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.rate_limiter import enforce_rate_limit, get_client_ip
from app.core.redis_client import close_redis
from app.routers.auth import router as auth_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield
    await close_redis()


app = FastAPI(
    title=settings.APP_NAME,
    description="Authentication and authorization service for FairGig",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def api_rate_limit_middleware(request: Request, call_next):
    if request.url.path.startswith(settings.API_PREFIX) and request.url.path != f"{settings.API_PREFIX}/health":
        rate_limit_key = f"rate_limit:api:{get_client_ip(request)}:{request.url.path}"
        try:
            await enforce_rate_limit(
                key=rate_limit_key,
                limit=settings.API_RATE_LIMIT_MAX_REQUESTS,
                window_seconds=settings.API_RATE_LIMIT_WINDOW_SECONDS,
            )
        except HTTPException as exc:
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail},
                headers=exc.headers,
            )

    return await call_next(request)


app.include_router(auth_router, prefix=settings.API_PREFIX)


@app.get(f"{settings.API_PREFIX}/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy", "service": "auth-service"}
