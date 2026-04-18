from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from app.core.config import settings
from app.core.database import service_mode
from app.dependencies import Principal, require_worker
from app.schemas.certificate import CertificateDirectRequest, HealthResponse
from app.services.certificate_service import build_certificate_context, fetch_verified_summary

router = APIRouter()
templates = Jinja2Templates(directory=settings.TEMPLATE_DIR)


def _validate_iso_date(value: str | None, field_name: str) -> str | None:
    if value is None:
        return None

    try:
        date.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} must be in YYYY-MM-DD format",
        ) from exc

    return value


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.SERVICE_NAME,
        mode=service_mode(),
    )


@router.get("/render", response_class=HTMLResponse)
async def render_certificate_from_earnings(
    request: Request,
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    principal: Principal = Depends(require_worker),
) -> HTMLResponse:
    date_from_value = _validate_iso_date(date_from, "date_from")
    date_to_value = _validate_iso_date(date_to, "date_to")

    summary = await fetch_verified_summary(
        worker_id=principal.user_id,
        date_from=date_from_value,
        date_to=date_to_value,
    )

    context = build_certificate_context(
        worker_id=principal.user_id,
        worker_name=principal.full_name,
        worker_email=principal.email,
        date_from=summary.date_from,
        date_to=summary.date_to,
        shifts=summary.verified_shifts,
        totals=summary.totals,
        breakdown=summary.per_platform_breakdown,
    )

    return templates.TemplateResponse(
        request=request,
        name="income_certificate.html",
        context=context,
    )


@router.post("/render/direct", response_class=HTMLResponse)
async def render_certificate_from_payload(
    request: Request,
    payload: CertificateDirectRequest,
    principal: Principal = Depends(require_worker),
) -> HTMLResponse:
    if payload.worker_id != principal.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Workers can generate certificate for their own verified data only.",
        )

    context = build_certificate_context(
        worker_id=payload.worker_id,
        worker_name=payload.worker_name or principal.full_name,
        worker_email=payload.worker_email or principal.email,
        date_from=_validate_iso_date(payload.date_from, "date_from"),
        date_to=_validate_iso_date(payload.date_to, "date_to"),
        shifts=payload.verified_shifts,
        totals=payload.totals,
        breakdown=payload.per_platform_breakdown,
    )

    return templates.TemplateResponse(
        request=request,
        name="income_certificate.html",
        context=context,
    )
