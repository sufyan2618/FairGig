from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.config import settings
from app.core.database import db_health
from app.dependencies import Principal, require_roles
from app.schemas.analytics import (
    CommissionTrendsResponse,
    HealthResponse,
    IncomeDistributionResponse,
    OverviewKpisResponse,
    PlatformSummaryResponse,
    PlatformsResponse,
    VulnerabilityFlagsResponse,
    WorkerMedianResponse,
)
from app.services.analytics_service import (
    get_commission_trends,
    get_income_distribution,
    get_overview_kpis,
    get_platform_summary,
    get_platforms,
    get_vulnerability_flags,
    get_worker_median,
)

router = APIRouter()


def _parse_date(value: str | None, field_name: str) -> date | None:
    if value is None:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"{field_name} must be in YYYY-MM-DD format") from exc


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.SERVICE_NAME,
        db=db_health(),
    )


@router.get("/worker/median", response_model=WorkerMedianResponse)
def worker_median(
    category: str = Query(..., min_length=1),
    city_zone: str = Query(..., min_length=1),
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    _principal: Principal = Depends(require_roles("worker")),
) -> WorkerMedianResponse:
    try:
        return get_worker_median(category=category, city_zone=city_zone, month=month)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/advocate/commission-trends", response_model=CommissionTrendsResponse)
def commission_trends(
    platform: str | None = Query(default=None),
    period: str = Query(default="monthly", pattern=r"^(weekly|monthly)$"),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    _principal: Principal = Depends(require_roles("advocate")),
) -> CommissionTrendsResponse:
    parsed_from = _parse_date(date_from, "date_from")
    parsed_to = _parse_date(date_to, "date_to")
    return get_commission_trends(period=period, platform=platform, date_from=parsed_from, date_to=parsed_to)


@router.get("/advocate/income-distribution", response_model=IncomeDistributionResponse)
def income_distribution(
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    category: str | None = Query(default=None),
    _principal: Principal = Depends(require_roles("advocate")),
) -> IncomeDistributionResponse:
    try:
        return get_income_distribution(month=month, category=category)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/advocate/vulnerability-flags", response_model=VulnerabilityFlagsResponse)
def vulnerability_flags(
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    min_drop_percent: float = Query(default=20, ge=1, le=100),
    category: str | None = Query(default=None),
    city_zone: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    _principal: Principal = Depends(require_roles("advocate")),
) -> VulnerabilityFlagsResponse:
    try:
        return get_vulnerability_flags(
            month=month,
            min_drop_percent=min_drop_percent,
            category=category,
            city_zone=city_zone,
            page=page,
            limit=limit,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/advocate/platform-summary", response_model=PlatformSummaryResponse)
def platform_summary(
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    _principal: Principal = Depends(require_roles("advocate")),
) -> PlatformSummaryResponse:
    parsed_from = _parse_date(date_from, "date_from")
    parsed_to = _parse_date(date_to, "date_to")
    return get_platform_summary(date_from=parsed_from, date_to=parsed_to)


@router.get("/advocate/overview-kpis", response_model=OverviewKpisResponse)
def overview_kpis(_principal: Principal = Depends(require_roles("advocate"))) -> OverviewKpisResponse:
    return get_overview_kpis()


@router.get("/platforms", response_model=PlatformsResponse)
def platforms(_principal: Principal = Depends(require_roles("worker", "advocate"))) -> PlatformsResponse:
    return get_platforms()
