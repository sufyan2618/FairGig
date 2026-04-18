from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ShiftRecord(BaseModel):
    model_config = ConfigDict(strict=True)

    shift_id: str = Field(min_length=1, max_length=120)
    date: str = Field(min_length=10, max_length=10)
    platform: str = Field(min_length=1, max_length=80)
    hours_worked: float | int = Field(gt=0, lt=24)
    gross_earned: int = Field(gt=0)
    platform_deductions: int = Field(ge=0)
    net_received: int

    @model_validator(mode="after")
    def validate_consistency(self) -> "ShiftRecord":
        try:
            date.fromisoformat(self.date)
        except ValueError as exc:
            raise ValueError("date must be a valid ISO date in YYYY-MM-DD format") from exc

        expected = self.gross_earned - self.platform_deductions
        if abs(self.net_received - expected) > 5:
            raise ValueError(
                "net_received must equal gross_earned - platform_deductions "
                "within +/-5 PKR tolerance"
            )

        return self


class EarningsHistoryPayload(BaseModel):
    model_config = ConfigDict(strict=True)

    worker_id: str | None = Field(default=None, max_length=120)
    shifts: list[ShiftRecord] = Field(default_factory=list)


class AnomalyItem(BaseModel):
    model_config = ConfigDict(strict=True)

    shift_id: str
    date: str
    platform: str
    anomaly_type: str
    severity: Literal["low", "medium", "high"]
    metric_value: float
    expected_value: float
    explanation: str


class DetectResponse(BaseModel):
    model_config = ConfigDict(strict=True)

    worker_id: str | None
    total_shifts_analyzed: int
    anomalies_found: int
    anomalies: list[AnomalyItem]
    summary: str
