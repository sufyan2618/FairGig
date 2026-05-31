from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from prometheus_fastapi_instrumentator import Instrumentator, metrics

from app.core.config import settings
from app.core.logging_config import RequestLoggingMiddleware, setup_logging
from app.routers.anomaly import router as anomaly_router

logger = setup_logging("anomaly-service")

app = FastAPI(
    title="FairGig Anomaly Detection Service",
    description=(
        "Stateless FastAPI service for in-memory anomaly detection on gig worker "
        "earnings histories using Pandas, NumPy, and SciPy."
    ),
    version=settings.SERVICE_VERSION,
)

resource = Resource.create({"service.name": "anomaly-service"})
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
Instrumentator(
    should_group_status_codes=True,
    should_ignore_untemplated=True,
    should_group_untemplated=True,
    excluded_handlers=[],
).add(
    metrics.info(
        metric_name="fastapi_app_info",
        metric_doc="FastAPI application information",
        app_name="anomaly-service",
    )
).instrument(app).expose(app)

app.add_middleware(RequestLoggingMiddleware, service_name="anomaly-service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(anomaly_router, prefix=settings.API_PREFIX, tags=["anomaly"])

logger.info("anomaly-service ready", extra={"event": "service_start"})


@app.get("/api/health", tags=["system"])
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": settings.SERVICE_NAME,
        "version": settings.SERVICE_VERSION,
    }
