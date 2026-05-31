from fastapi import APIRouter

from app.core.config import settings
from app.core.logging_config import get_logger
from app.dependencies import PrincipalDep, WorkerPrincipalDep
from app.schemas.anomaly import ChatRequest, ChatResponse, DetectResponse, EarningsHistoryPayload
from app.services.anomaly_detection import detect_anomalies
from app.services.earnings_chatbot import answer_worker_question

router = APIRouter()
logger = get_logger(__name__)


@router.get("/health")
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": settings.SERVICE_NAME,
        "version": settings.SERVICE_VERSION,
    }


@router.post("/detect", response_model=DetectResponse)
def detect(payload: EarningsHistoryPayload, principal: PrincipalDep) -> DetectResponse:
    logger.info(
        "anomaly detection requested",
        extra={
            "event": "detect_anomalies",
            "user_id": principal.subject,
            "shift_count": len(payload.shifts),
        },
    )
    result = detect_anomalies(payload)
    logger.info(
        "anomaly detection completed",
        extra={
            "event": "detect_anomalies_success",
            "user_id": principal.subject,
            "anomaly_count": len(result.anomalies),
        },
    )
    return result


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest, principal: WorkerPrincipalDep) -> ChatResponse:
    logger.info(
        "earnings chat requested",
        extra={
            "event": "earnings_chat",
            "user_id": principal.subject,
            "question_length": len(payload.question),
            "history_length": len(payload.conversation_history),
        },
    )
    result = await answer_worker_question(
        question=payload.question,
        earnings_context=payload.earnings_context,
        anomalies_context=payload.anomalies_context,
        conversation_history=payload.conversation_history,
    )
    logger.info(
        "earnings chat completed",
        extra={"event": "earnings_chat_success", "user_id": principal.user_id},
    )
    return result


@router.get("/schema")
def get_payload_schema() -> dict:
    logger.info("payload schema requested", extra={"event": "get_schema"})
    return EarningsHistoryPayload.model_json_schema()
