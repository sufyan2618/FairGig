from __future__ import annotations

import asyncio
import logging
import re
from collections import Counter

from fastapi import HTTPException, status
from openai import APIConnectionError, APIStatusError, APITimeoutError, OpenAI, RateLimitError

from app.core.config import settings
from app.schemas.anomaly import ChatAnomalyFlag, ChatHistoryMessage, ChatResponse, ShiftSummary


logger = logging.getLogger("uvicorn.error")


def is_urdu(text: str) -> bool:
    return any("\u0600" <= char <= "\u06FF" for char in text)


def _truncate_to_three_sentences(text: str) -> str:
    cleaned = " ".join(text.strip().split())
    if not cleaned:
        return cleaned

    sentence_chunks = [chunk.strip() for chunk in re.split(r"(?<=[.!?؟۔])\s+", cleaned) if chunk.strip()]
    if len(sentence_chunks) <= 3:
        return cleaned

    return " ".join(sentence_chunks[:3]).strip()


def _format_pkr(amount: int) -> str:
    return f"PKR {amount:,}"


def build_local_fallback_answer(
    *,
    question: str,
    earnings_context: ShiftSummary,
    anomalies_context: list[ChatAnomalyFlag],
) -> str:
    question_lower = question.lower()
    anomaly_count = len(anomalies_context)
    top_platform = ""

    if anomalies_context:
        platform_counts = Counter(anomaly.platform for anomaly in anomalies_context)
        top_platform = platform_counts.most_common(1)[0][0]

    avg_net_per_shift = (
        earnings_context.total_net_pkr // earnings_context.total_shifts
        if earnings_context.total_shifts > 0
        else 0
    )

    if is_urdu(question):
        if "کم" in question or "drop" in question_lower:
            if anomaly_count > 0:
                return (
                    f"{earnings_context.date_from} se {earnings_context.date_to} tak data ke mutabiq aap ki net earning "
                    f"{_format_pkr(earnings_context.total_net_pkr)} rahi, aur {anomaly_count} anomaly flags mili hain. "
                    f"Sab se zyada flags {top_platform} par nazar aayi hain, is wajah se monthly income drop lag sakta hai."
                )
            return (
                f"{earnings_context.date_from} se {earnings_context.date_to} tak net earning "
                f"{_format_pkr(earnings_context.total_net_pkr)} hai aur koi anomaly detect nahi hui. "
                "Income drop ka clear signal is dataset me nazar nahi aa raha."
            )

        return (
            f"Aap ne {earnings_context.total_shifts} shifts me total net {_format_pkr(earnings_context.total_net_pkr)} kamaya "
            f"(avg {_format_pkr(avg_net_per_shift)} per shift). "
            f"Detected anomalies: {anomaly_count}."
        )

    if any(keyword in question_lower for keyword in ["drop", "down", "decrease", "decline"]):
        if anomaly_count > 0:
            return (
                f"From {earnings_context.date_from} to {earnings_context.date_to}, your net earnings are "
                f"{_format_pkr(earnings_context.total_net_pkr)} across {earnings_context.total_shifts} shifts. "
                f"I found {anomaly_count} anomaly flags, with the highest concentration on {top_platform}, which is the most likely reason for the drop."
            )

        return (
            f"From {earnings_context.date_from} to {earnings_context.date_to}, your net earnings are "
            f"{_format_pkr(earnings_context.total_net_pkr)} across {earnings_context.total_shifts} shifts. "
            "No anomalies were detected, so this dataset does not show a clear abnormal income drop."
        )

    return (
        f"You worked {earnings_context.total_shifts} shifts and received total net {_format_pkr(earnings_context.total_net_pkr)} "
        f"(about {_format_pkr(avg_net_per_shift)} per shift). "
        f"Detected anomalies: {anomaly_count}."
    )


def build_system_prompt(earnings: ShiftSummary, anomalies: list[ChatAnomalyFlag]) -> str:
    if anomalies:
        anomaly_text = "\n".join(
            [
                f"- {anomaly.date} ({anomaly.platform}): {anomaly.explanation} [Severity: {anomaly.severity}]"
                for anomaly in anomalies
            ]
        )
    else:
        anomaly_text = "No anomalies detected in recent earnings."

    platforms_text = ", ".join(earnings.platforms_worked) if earnings.platforms_worked else "No platform data provided"

    return f"""You are FairGig's worker assistant — a helpful, friendly AI that explains \
    gig worker earnings data in plain simple language. Workers may be non-tech-savvy \
    riders or delivery workers. Always answer in the same language and style the worker uses \
    (English, Urdu, or Roman Urdu). Keep answers under 3 sentences. Be honest and empathetic. \
    Never make up data. Only use the data provided below.\n\n\
WORKER EARNINGS SUMMARY:\n\
- Date Range: {earnings.date_from} to {earnings.date_to}\n\
- Total Shifts: {earnings.total_shifts}\n\
- Total Gross Earned: PKR {earnings.total_gross_pkr:,}\n\
- Total Net Received: PKR {earnings.total_net_pkr:,}\n\
- Average Monthly Net: PKR {earnings.avg_monthly_net_pkr:,}\n\
- Platforms Used: {platforms_text}\n\n\
DETECTED ANOMALIES IN RECENT EARNINGS:\n\
{anomaly_text}\n\n\
Answer the worker's question using only the above data. If you cannot answer \
from this data, say so honestly. Do not hallucinate numbers or facts."""


async def call_openai(
    *,
    question: str,
    system_prompt: str,
    history: list[ChatHistoryMessage],
) -> str:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenAI API key is not configured.",
        )

    messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]

    for history_item in history[-6:]:
        messages.append({"role": history_item.role, "content": history_item.content})
    messages.append({"role": "user", "content": question})

    def _send_request() -> str:
        client = OpenAI(api_key=settings.OPENAI_API_KEY, timeout=float(settings.OPENAI_TIMEOUT_SECONDS))
        completion = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=300,
        )

        single_response_content = completion.choices[0].message.content
        if isinstance(single_response_content, str) and single_response_content.strip():
            return single_response_content.strip()

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenAI returned an empty response.",
        )

    try:
        content = await asyncio.wait_for(asyncio.to_thread(_send_request), timeout=float(settings.OPENAI_TIMEOUT_SECONDS))
    except RateLimitError as exc:
        logger.error("OpenAI rate limit error: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenAI rate limit exceeded.",
        ) from exc
    except APIStatusError as exc:
        status_code_text = getattr(exc, "status_code", "unknown")
        detail = f"OpenAI API status error ({status_code_text})."
        logger.error("OpenAI API status error: status=%s body=%s", status_code_text, getattr(exc, "body", None))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail,
        ) from exc
    except APITimeoutError as exc:
        logger.error("OpenAI API timeout error: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenAI API timeout.",
        ) from exc
    except APIConnectionError as exc:
        logger.error("OpenAI API connection error: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenAI API connection error.",
        ) from exc
    except TimeoutError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenAI request timed out.",
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001 - translating all upstream failures to safe fallback path.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"OpenAI unavailable: {str(exc)}",
        ) from exc

    if not isinstance(content, str) or not content.strip():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenAI returned an empty response.",
        )

    return _truncate_to_three_sentences(content)


async def answer_worker_question(
    *,
    question: str,
    earnings_context: ShiftSummary,
    anomalies_context: list[ChatAnomalyFlag],
    conversation_history: list[ChatHistoryMessage],
) -> ChatResponse:
    question_trimmed = question.strip()
    if not question_trimmed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question cannot be empty.")

    if len(question_trimmed) > 500:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question too long. Max 500 characters.")

    system_prompt = build_system_prompt(earnings=earnings_context, anomalies=anomalies_context)
    fallback_used = False
    fallback_reason: str | None = None

    try:
        answer = await call_openai(
            question=question_trimmed,
            system_prompt=system_prompt,
            history=conversation_history,
        )
    except HTTPException as exc:
        fallback_used = True
        fallback_reason = str(exc.detail)
        logger.error(
            "OpenAI call failed; using local fallback answer. reason=%s model=%s",
            fallback_reason,
            settings.OPENAI_MODEL,
        )
        answer = build_local_fallback_answer(
            question=question_trimmed,
            earnings_context=earnings_context,
            anomalies_context=anomalies_context,
        )

    return ChatResponse(
        answer=answer,
        language="ur" if is_urdu(question_trimmed) else "en",
        model_used=settings.OPENAI_MODEL,
        fallback_used=fallback_used,
        fallback_reason=fallback_reason,
    )
