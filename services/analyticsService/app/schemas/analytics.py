from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    model_config = ConfigDict(strict=True)

    status: str
    service: str
    db: str


class WorkerMedianResponse(BaseModel):
    model_config = ConfigDict(strict=True)

    category: str
    city_zone: str
    month: str
    median_net_earned_pkr: float | None
    cohort_size: int
    suppressed: bool
    message: str | None = None


class CommissionTrendPeriod(BaseModel):
    model_config = ConfigDict(strict=True)

    label: str
    avg_commission_rate: float
    sample_count: int


class CommissionTrendPlatform(BaseModel):
    model_config = ConfigDict(strict=True)

    platform: str
    periods: list[CommissionTrendPeriod]


class CommissionTrendsResponse(BaseModel):
    model_config = ConfigDict(strict=True)

    period: str
    data: list[CommissionTrendPlatform]


class IncomeDistributionZone(BaseModel):
    model_config = ConfigDict(strict=True)

    city_zone: str
    cohort_size: int
    suppressed: bool
    median_net_pkr: float | None
    p25_net_pkr: float | None
    p75_net_pkr: float | None
    message: str | None = None


class IncomeDistributionResponse(BaseModel):
    model_config = ConfigDict(strict=True)

    month: str
    zones: list[IncomeDistributionZone]


class VulnerabilityWorker(BaseModel):
    model_config = ConfigDict(strict=True)

    worker_ref: str
    category: str
    city_zone: str
    platform: str
    prev_month_net_pkr: float
    current_month_net_pkr: float
    drop_percent: float
    severity: str


class VulnerabilityFlagsResponse(BaseModel):
    model_config = ConfigDict(strict=True)

    month: str
    threshold_percent: float
    total_flagged: int
    workers: list[VulnerabilityWorker]


class PlatformSummaryItem(BaseModel):
    model_config = ConfigDict(strict=True)

    platform: str
    total_workers: int
    avg_net_earned_pkr: float
    avg_commission_rate: float
    total_shifts: int


class PlatformSummaryResponse(BaseModel):
    model_config = ConfigDict(strict=True)

    platforms: list[PlatformSummaryItem]


class OverviewKpisResponse(BaseModel):
    model_config = ConfigDict(strict=True)

    total_active_workers: int
    total_verified_earnings_this_month_pkr: float
    total_grievances_this_week: int
    total_vulnerability_flags_this_month: int
    most_complained_platform: str | None


class PlatformsResponse(BaseModel):
    model_config = ConfigDict(strict=True)

    platforms: list[str]


class GrievanceOverview(BaseModel):
    model_config = ConfigDict(strict=True)

    total_grievances_this_week: int = Field(default=0)
    most_complained_platform: str | None = None
