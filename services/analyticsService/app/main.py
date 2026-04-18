from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers.analytics import router as analytics_router

app = FastAPI(
    title="FairGig Analytics Service",
    description=(
        "Read-only analytics microservice for advocate KPIs and worker city-wide "
        "median comparisons. Uses SQLAlchemy Core and privacy-safe aggregations."
    ),
    version=settings.SERVICE_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analytics_router, prefix=settings.API_PREFIX, tags=["analytics"])
