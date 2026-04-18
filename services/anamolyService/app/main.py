from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers.anomaly import router as anomaly_router

app = FastAPI(
    title="FairGig Anomaly Detection Service",
    description=(
        "Stateless FastAPI service for in-memory anomaly detection on gig worker "
        "earnings histories using Pandas, NumPy, and SciPy."
    ),
    version=settings.SERVICE_VERSION,
)

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
