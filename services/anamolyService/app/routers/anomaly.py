from fastapi import APIRouter

from app.core.config import settings
from app.dependencies import PrincipalDep
from app.schemas.anomaly import DetectResponse, EarningsHistoryPayload
from app.services.anomaly_detection import detect_anomalies

router = APIRouter()


@router.get("/health")
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": settings.SERVICE_NAME,
        "version": settings.SERVICE_VERSION,
    }


@router.post("/detect", response_model=DetectResponse)
def detect(payload: EarningsHistoryPayload, _principal: PrincipalDep) -> DetectResponse:
    return detect_anomalies(payload)


@router.get("/schema")
def get_payload_schema() -> dict:
    return EarningsHistoryPayload.model_json_schema()
