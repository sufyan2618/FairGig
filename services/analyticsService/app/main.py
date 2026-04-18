import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers.order import router as order_router

load_dotenv(f".env.{os.getenv('ENVIRONMENT', 'development')}")

app = FastAPI(
    title="Order Service",
    description="Ecommerce cart and order management service",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(order_router, prefix="/api")


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy", "service": "order-service"}
