from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.config import settings
from app.core.database import db_health
from app.core.logging_config import get_logger
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
logger = get_logger(__name__)


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
    principal: Principal = Depends(require_roles("worker")),
) -> WorkerMedianResponse:
    logger.info(
        "worker median requested",
        extra={
            "event": "worker_median",
            "user_id": principal.user_id,
            "category": category,
            "city_zone": city_zone,
            "month": month,
        },
    )
    try:
        result = get_worker_median(category=category, city_zone=city_zone, month=month)
        logger.info(
            "worker median computed",
            extra={
                "event": "worker_median_success",
                "user_id": principal.user_id,
                "cohort_size": result.cohort_size,
            },
        )
        return result
    except ValueError as exc:
        logger.warning(
            "worker median validation failed",
            extra={"event": "worker_median_error", "user_id": principal.user_id, "error": str(exc)},
        )
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/advocate/commission-trends", response_model=CommissionTrendsResponse)
def commission_trends(
    platform: str | None = Query(default=None),
    period: str = Query(default="monthly", pattern=r"^(weekly|monthly)$"),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    principal: Principal = Depends(require_roles("advocate")),
) -> CommissionTrendsResponse:
    logger.info(
        "commission trends requested",
        extra={
            "event": "commission_trends",
            "user_id": principal.user_id,
            "platform": platform,
            "period": period,
        },
    )
    parsed_from = _parse_date(date_from, "date_from")
    parsed_to = _parse_date(date_to, "date_to")
    result = get_commission_trends(period=period, platform=platform, date_from=parsed_from, date_to=parsed_to)
    logger.info(
        "commission trends computed",
        extra={"event": "commission_trends_success", "user_id": principal.user_id, "period": period},
    )
    return result


@router.get("/advocate/income-distribution", response_model=IncomeDistributionResponse)
def income_distribution(
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    category: str | None = Query(default=None),
    principal: Principal = Depends(require_roles("advocate")),
) -> IncomeDistributionResponse:
    logger.info(
        "income distribution requested",
        extra={"event": "income_distribution", "user_id": principal.user_id, "month": month, "category": category},
    )
    try:
        result = get_income_distribution(month=month, category=category)
        logger.info(
            "income distribution computed",
            extra={"event": "income_distribution_success", "user_id": principal.user_id},
        )
        return result
    except ValueError as exc:
        logger.warning(
            "income distribution validation failed",
            extra={"event": "income_distribution_error", "user_id": principal.user_id, "error": str(exc)},
        )
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/advocate/vulnerability-flags", response_model=VulnerabilityFlagsResponse)
def vulnerability_flags(
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    min_drop_percent: float = Query(default=20, ge=1, le=100),
    category: str | None = Query(default=None),
    city_zone: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    principal: Principal = Depends(require_roles("advocate")),
) -> VulnerabilityFlagsResponse:
    logger.info(
        "vulnerability flags requested",
        extra={
            "event": "vulnerability_flags",
            "user_id": principal.user_id,
            "month": month,
            "min_drop_percent": min_drop_percent,
            "page": page,
        },
    )
    try:
        result = get_vulnerability_flags(
            month=month,
            min_drop_percent=min_drop_percent,
            category=category,
            city_zone=city_zone,
            page=page,
            limit=limit,
        )
        logger.info(
            "vulnerability flags computed",
            extra={
                "event": "vulnerability_flags_success",
                "user_id": principal.user_id,
                "total_flagged": result.total_flagged,
            },
        )
        return result
    except ValueError as exc:
        logger.warning(
            "vulnerability flags validation failed",
            extra={"event": "vulnerability_flags_error", "user_id": principal.user_id, "error": str(exc)},
        )
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/advocate/platform-summary", response_model=PlatformSummaryResponse)
def platform_summary(
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    principal: Principal = Depends(require_roles("advocate")),
) -> PlatformSummaryResponse:
    logger.info(
        "platform summary requested",
        extra={"event": "platform_summary", "user_id": principal.user_id},
    )
    parsed_from = _parse_date(date_from, "date_from")
    parsed_to = _parse_date(date_to, "date_to")
    result = get_platform_summary(date_from=parsed_from, date_to=parsed_to)
    logger.info(
        "platform summary computed",
        extra={"event": "platform_summary_success", "user_id": principal.user_id},
    )
    return result


@router.get("/advocate/overview-kpis", response_model=OverviewKpisResponse)
def overview_kpis(principal: Principal = Depends(require_roles("advocate"))) -> OverviewKpisResponse:
    logger.info("overview kpis requested", extra={"event": "overview_kpis", "user_id": principal.user_id})
    result = get_overview_kpis()
    logger.info("overview kpis computed", extra={"event": "overview_kpis_success", "user_id": principal.user_id})
    return result


@router.get("/platforms", response_model=PlatformsResponse)
def platforms(principal: Principal = Depends(require_roles("worker", "advocate"))) -> PlatformsResponse:
    logger.info("platforms list requested", extra={"event": "platforms", "user_id": principal.user_id})
    result = get_platforms()
    logger.info(
        "platforms list returned",
        extra={"event": "platforms_success", "user_id": principal.user_id, "count": len(result.platforms)},
    )
    return result
