from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers.analytics import router as analytics_router
import logging
import json
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.sdk.resources import Resource
from prometheus_fastapi_instrumentator import Instrumentator
from app.core.database import analytics_engine, earnings_engine

app = FastAPI(
    title="FairGig Analytics Service",
    description=(
        "Read-only analytics microservice for advocate KPIs and worker city-wide "
        "median comparisons. Uses SQLAlchemy Core and privacy-safe aggregations."
    ),
    version=settings.SERVICE_VERSION,
)

# Structured JSON logging — Loki can parse and label these fields
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log = {
            "time": self.formatTime(record),
            "level": record.levelname,
            "service": "analytics-service",   # change per service
            "message": record.getMessage(),
        }
        # Attach trace_id if inside an active span — links logs to traces
        span = trace.get_current_span()
        if span.is_recording():
            ctx = span.get_span_context()
            log["trace_id"] = format(ctx.trace_id, "032x")
            log["span_id"] = format(ctx.span_id, "016x")
        return json.dumps(log)

logging.getLogger().handlers[0].setFormatter(JSONFormatter())

# OpenTelemetry setup — sends traces to Alloy → Tempo
resource = Resource.create({"service.name": "analytics-service"})  # change per service
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
SQLAlchemyInstrumentor().instrument(engine=analytics_engine)  # pass your DB engine
SQLAlchemyInstrumentor().instrument(engine=earnings_engine)  # pass your DB engine

# Expose /metrics endpoint for Prometheus scraping
Instrumentator().instrument(app).expose(app)



app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analytics_router, prefix=settings.API_PREFIX, tags=["analytics"])
