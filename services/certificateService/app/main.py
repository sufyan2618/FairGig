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
from app.routers.certificate import router as certificate_router

logger = setup_logging("certificate-service")

app = FastAPI(
    title="FairGig Certificate Renderer Service",
    description=(
        "Stateless renderer that generates print-friendly income certificate HTML "
        "from verified earnings data."
    ),
    version=settings.SERVICE_VERSION,
)

resource = Resource.create({"service.name": "certificate-service"})
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
        app_name="certificate-service",
    )
).instrument(app).expose(app)

app.add_middleware(RequestLoggingMiddleware, service_name="certificate-service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(certificate_router, prefix=settings.API_PREFIX, tags=["certificate"])

logger.info("certificate-service ready", extra={"event": "service_start"})
