from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from prometheus_fastapi_instrumentator import Instrumentator, metrics

from app.core.config import settings
from app.core.database import analytics_engine, earnings_engine
from app.core.logging_config import RequestLoggingMiddleware, setup_logging
from app.routers.analytics import router as analytics_router

logger = setup_logging("analytics-service")

app = FastAPI(
    title="FairGig Analytics Service",
    description=(
        "Read-only analytics microservice for advocate KPIs and worker city-wide "
        "median comparisons. Uses SQLAlchemy Core and privacy-safe aggregations."
    ),
    version=settings.SERVICE_VERSION,
)

resource = Resource.create({"service.name": "analytics-service"})
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
SQLAlchemyInstrumentor().instrument(engine=analytics_engine)
SQLAlchemyInstrumentor().instrument(engine=earnings_engine)
Instrumentator(
    should_group_status_codes=True,
    should_ignore_untemplated=True,
    should_group_untemplated=True,
    excluded_handlers=[],
).add(
    metrics.default(
        custom_labels={"app_name": "analytics-service"},
    )
).instrument(app).expose(app)

app.add_middleware(RequestLoggingMiddleware, service_name="analytics-service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analytics_router, prefix=settings.API_PREFIX, tags=["analytics"])

logger.info("analytics-service ready", extra={"event": "service_start"})
