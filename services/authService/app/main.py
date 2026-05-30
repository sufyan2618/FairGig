from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import sys 
import logging
from app.core.config import settings
from app.core.rate_limiter import enforce_rate_limit, get_client_ip
from app.core.redis_client import close_redis
from app.routers.auth import router as auth_router
import json
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.sdk.resources import Resource
from prometheus_fastapi_instrumentator import Instrumentator
from app.core.database import async_engine

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

# Structured JSON logging — Loki can parse and label these fields
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log = {
            "time": self.formatTime(record),
            "level": record.levelname,
            "service": "auth-service",   # change per service
            "message": record.getMessage(),
        }
        # Attach trace_id if inside an active span — links logs to traces
        span = trace.get_current_span()
        if span.is_recording():
            ctx = span.get_span_context()
            log["trace_id"] = format(ctx.trace_id, "032x")
            log["span_id"] = format(ctx.span_id, "016x")
        return json.dumps(log)


handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(JSONFormatter())

logging.basicConfig(
    level=logging.INFO,
    handlers=[handler]
)

resource = Resource.create({"service.name": "auth-service"})  
provider = TracerProvider(resource=resource)
provider.add_span_processor(
    BatchSpanProcessor(
        OTLPSpanExporter(
            endpoint="http://alloy.monitoring.svc.cluster.local:4317",
            insecure=True
        )
    )
)
trace.set_tracer_provider(provider)

# Auto-instrument FastAPI and SQLAlchemy — zero manual span code needed
FastAPIInstrumentor.instrument_app(app)
SQLAlchemyInstrumentor().instrument(engine=async_engine.sync_engine)  

Instrumentator().instrument(app).expose(app)



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
