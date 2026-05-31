from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.core.database import async_engine
from app.core.logging_config import RequestLoggingMiddleware, get_logger, setup_logging
from app.core.rate_limiter import enforce_rate_limit, get_client_ip
from app.core.redis_client import close_redis
from app.routers.auth import router as auth_router

logger = setup_logging("auth-service")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger.info("auth-service starting", extra={"event": "service_start"})
    yield
    await close_redis()
    logger.info("auth-service stopped", extra={"event": "service_stop"})


app = FastAPI(
    title=settings.APP_NAME,
    description="Authentication and authorization service for FairGig",
    version="1.0.0",
    lifespan=lifespan,
)

resource = Resource.create({"service.name": "auth-service"})
provider = TracerProvider(resource=resource)
provider.add_span_processor(
    BatchSpanProcessor(
        OTLPSpanExporter(
            endpoint="http://alloy.monitoring.svc.cluster.local:4317",
            insecure=True,
        )
    )
)
trace.set_tracer_provider(provider)

FastAPIInstrumentor.instrument_app(app)
SQLAlchemyInstrumentor().instrument(engine=async_engine.sync_engine)
Instrumentator().instrument(app).expose(app)

app.add_middleware(RequestLoggingMiddleware, service_name="auth-service")
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
            get_logger("auth-service.rate_limit").warning(
                "rate limit exceeded",
                extra={
                    "event": "rate_limit_exceeded",
                    "path": request.url.path,
                    "client_ip": get_client_ip(request),
                },
            )
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
