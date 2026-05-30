from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers.anomaly import router as anomaly_router
import logging
import sys 
import logging
import json
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import Resource
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI(
    title="FairGig Anomaly Detection Service",
    description=(
        "Stateless FastAPI service for in-memory anomaly detection on gig worker "
        "earnings histories using Pandas, NumPy, and SciPy."
    ),
    version=settings.SERVICE_VERSION,
)


class JSONFormatter(logging.Formatter):
    def format(self, record):
        log = {
            "time": self.formatTime(record),
            "level": record.levelname,
            "service": "anomaly-service",   # change per service
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

resource = Resource.create({"service.name": "anomaly-service"})  
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


FastAPIInstrumentor.instrument_app(app)

Instrumentator().instrument(app).expose(app)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(anomaly_router, prefix=settings.API_PREFIX, tags=["anomaly"])


@app.get("/api/health", tags=["system"])
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": settings.SERVICE_NAME,
        "version": settings.SERVICE_VERSION,
    }
