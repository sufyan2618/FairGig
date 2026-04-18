from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, field_validator


class HealthResponse(BaseModel):
    model_config = ConfigDict(strict=True)

    status: str
    service: str
    mode: str


class VerifiedShift(BaseModel):
    model_config = ConfigDict(strict=True)

    id: str
    platform: str
    date: str
    hours_worked: float = Field(gt=0)
    gross_earned: float = Field(ge=0)
    deductions: float = Field(ge=0)
    net_received: float
    verification_status: str = Field(default="verified")

    @field_validator("verification_status")
    @classmethod
    def validate_verified(cls, value: str) -> str:
        if value != "verified":
            raise ValueError("Only verified shifts can be used for certificate rendering")
        return value


class TotalsSummary(BaseModel):
    model_config = ConfigDict(strict=True)

    total_gross: float = Field(ge=0)
    total_deductions: float = Field(ge=0)
    total_net: float = Field(ge=0)


class PlatformBreakdownItem(BaseModel):
    model_config = ConfigDict(strict=True)

    platform: str
    total_gross: float = Field(ge=0)
    total_deductions: float = Field(ge=0)
    total_net: float = Field(ge=0)
    shifts_count: int = Field(ge=0)


class CertificateDirectRequest(BaseModel):
    model_config = ConfigDict(strict=True)

    worker_id: str
    worker_name: str | None = None
    worker_email: str | None = None
    date_from: str | None = None
    date_to: str | None = None
    totals: TotalsSummary | None = None
    per_platform_breakdown: list[PlatformBreakdownItem] | None = None
    verified_shifts: list[VerifiedShift] = Field(min_length=1)
