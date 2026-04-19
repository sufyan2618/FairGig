from fastapi import APIRouter

from app.core.config import settings
from app.dependencies import PrincipalDep, WorkerPrincipalDep
from app.schemas.anomaly import ChatRequest, ChatResponse, DetectResponse, EarningsHistoryPayload
from app.services.anomaly_detection import detect_anomalies
from app.services.earnings_chatbot import answer_worker_question

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


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest, _principal: WorkerPrincipalDep) -> ChatResponse:
    return await answer_worker_question(
        question=payload.question,
        earnings_context=payload.earnings_context,
        anomalies_context=payload.anomalies_context,
        conversation_history=payload.conversation_history,
    )


@router.get("/schema")
def get_payload_schema() -> dict:
    return EarningsHistoryPayload.model_json_schema()
