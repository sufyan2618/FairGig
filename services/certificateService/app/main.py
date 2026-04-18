from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers.certificate import router as certificate_router

app = FastAPI(
    title="FairGig Certificate Renderer Service",
    description=(
        "Stateless renderer that generates print-friendly income certificate HTML "
        "from verified earnings data."
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

app.include_router(certificate_router, prefix=settings.API_PREFIX, tags=["certificate"])
