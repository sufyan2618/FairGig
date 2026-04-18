from __future__ import annotations

import calendar
from dataclasses import dataclass

import numpy as np
import pandas as pd
from scipy.stats import zscore

from app.schemas.anomaly import AnomalyItem, DetectResponse, EarningsHistoryPayload

# Judges may ask to tune these live. Keep them as explicit top-level constants.
Z_THRESHOLD = 2.0
INCOME_DROP_THRESHOLD = 0.20
HOURLY_IQR_MULTIPLIER = 1.5


@dataclass(slots=True)
class DetectionContext:
    worker_id: str | None
    frame: pd.DataFrame


def _to_frame(payload: EarningsHistoryPayload) -> pd.DataFrame:
    rows = [
        {
            "shift_id": shift.shift_id,
            "date": shift.date,
            "platform": shift.platform,
            "hours_worked": float(shift.hours_worked),
            "gross_earned": int(shift.gross_earned),
            "platform_deductions": int(shift.platform_deductions),
            "net_received": int(shift.net_received),
        }
        for shift in payload.shifts
    ]

    frame = pd.DataFrame(rows)
    if frame.empty:
        return frame

    frame["date"] = pd.to_datetime(frame["date"], format="%Y-%m-%d")
    frame = frame.sort_values("date", ascending=True).reset_index(drop=True)
    frame["deduction_rate"] = (frame["platform_deductions"] / frame["gross_earned"]) * 100.0
    frame["hourly_rate"] = frame["net_received"] / frame["hours_worked"]
    return frame


def _severity_from_z(z_value: float) -> str:
    return "high" if abs(z_value) > 3.0 else "medium"


def _severity_from_drop(drop_pct: float) -> str:
    return "high" if drop_pct > 40.0 else "medium"


def _build_insufficient_data_response(worker_id: str | None, total_shifts: int) -> DetectResponse:
    return DetectResponse(
        worker_id=worker_id,
        total_shifts_analyzed=total_shifts,
        anomalies_found=0,
        anomalies=[],
        summary=(
            "Not enough shift data to perform statistical analysis. "
            "Please log at least 5 shifts to enable anomaly detection."
        ),
    )


def _run_deduction_rate_pass(context: DetectionContext) -> list[AnomalyItem]:
    anomalies: list[AnomalyItem] = []
    if context.frame.empty:
        return anomalies

    grouped = context.frame.groupby("platform", dropna=False)

    for platform, group in grouped:
        if len(group) < 2:
            continue

        rates = group["deduction_rate"].to_numpy(dtype=float)
        std = float(np.std(rates))
        if np.isclose(std, 0.0):
            continue

        z_values = zscore(rates)
        mean_rate = float(np.mean(rates))

        for idx, z_val in enumerate(z_values):
            z_abs = abs(float(z_val))
            if np.isnan(z_val) or round(z_abs, 2) < Z_THRESHOLD:
                continue

            row = group.iloc[idx]
            current_rate = float(row["deduction_rate"])
            anomalies.append(
                AnomalyItem(
                    shift_id=str(row["shift_id"]),
                    date=str(pd.Timestamp(row["date"]).date()),
                    platform=str(platform),
                    anomaly_type="unusual_deduction_rate",
                    severity=_severity_from_z(float(z_val)),
                    metric_value=round(current_rate, 2),
                    expected_value=round(mean_rate, 2),
                    explanation=(
                        f"{platform} deducted {current_rate:.1f}% of your gross on "
                        f"{pd.Timestamp(row['date']).date()}. Your usual deduction rate "
                        f"is around {mean_rate:.1f}%. This is {z_abs:.2f} "
                        f"standard deviations from your average."
                    ),
                )
            )

    return anomalies


def _run_income_drop_pass(context: DetectionContext) -> list[AnomalyItem]:
    anomalies: list[AnomalyItem] = []
    if context.frame.empty:
        return anomalies

    monthly = (
        context.frame.assign(month=context.frame["date"].dt.to_period("M"))
        .groupby("month", as_index=False)["net_received"]
        .sum()
        .sort_values("month")
    )

    if len(monthly) < 2:
        return anomalies

    for idx in range(1, len(monthly)):
        current = monthly.iloc[idx]
        previous = monthly.iloc[idx - 1]

        previous_total = float(previous["net_received"])
        if previous_total <= 0:
            continue

        current_total = float(current["net_received"])
        pct_change = ((current_total - previous_total) / previous_total) * 100.0
        drop_pct = abs(pct_change)

        if pct_change >= 0 or drop_pct <= INCOME_DROP_THRESHOLD * 100:
            continue

        current_month = current["month"]
        previous_month = previous["month"]
        current_date = pd.Period(current_month, freq="M").to_timestamp(how="start").date()

        anomalies.append(
            AnomalyItem(
                shift_id=f"month_{current_month}",
                date=str(current_date),
                platform="all_platforms",
                anomaly_type="sudden_income_drop",
                severity=_severity_from_drop(drop_pct),
                metric_value=round(drop_pct, 2),
                expected_value=round(INCOME_DROP_THRESHOLD * 100, 2),
                explanation=(
                    f"Your net earnings in {calendar.month_name[current_month.month]} "
                    f"dropped by {drop_pct:.1f}% compared to "
                    f"{calendar.month_name[previous_month.month]} "
                    f"({int(previous_total)} PKR to {int(current_total)} PKR)."
                ),
            )
        )

    return anomalies


def _run_hourly_rate_pass(context: DetectionContext) -> list[AnomalyItem]:
    anomalies: list[AnomalyItem] = []
    if context.frame.empty or len(context.frame) < 4:
        return anomalies

    rates = context.frame["hourly_rate"].to_numpy(dtype=float)
    q1 = float(np.percentile(rates, 25))
    q3 = float(np.percentile(rates, 75))
    iqr = q3 - q1

    if np.isclose(iqr, 0.0):
        return anomalies

    lower_bound = q1 - (HOURLY_IQR_MULTIPLIER * iqr)
    upper_bound = q3 + (HOURLY_IQR_MULTIPLIER * iqr)
    expected_rate = float(np.median(rates))

    for _, row in context.frame.iterrows():
        hourly_rate = float(row["hourly_rate"])

        if hourly_rate < lower_bound:
            anomalies.append(
                AnomalyItem(
                    shift_id=str(row["shift_id"]),
                    date=str(pd.Timestamp(row["date"]).date()),
                    platform=str(row["platform"]),
                    anomaly_type="unusual_hourly_rate_low",
                    severity="high" if hourly_rate < (lower_bound * 0.5) else "medium",
                    metric_value=round(hourly_rate, 2),
                    expected_value=round(expected_rate, 2),
                    explanation=(
                        f"Your effective hourly rate on {pd.Timestamp(row['date']).date()} "
                        f"was PKR {hourly_rate:.2f}/hr, which is well below your typical "
                        f"PKR {expected_rate:.2f}/hr."
                    ),
                )
            )
        elif hourly_rate > upper_bound:
            anomalies.append(
                AnomalyItem(
                    shift_id=str(row["shift_id"]),
                    date=str(pd.Timestamp(row["date"]).date()),
                    platform=str(row["platform"]),
                    anomaly_type="unusual_hourly_rate_high",
                    severity="low",
                    metric_value=round(hourly_rate, 2),
                    expected_value=round(expected_rate, 2),
                    explanation=(
                        f"Your effective hourly rate on {pd.Timestamp(row['date']).date()} "
                        f"was PKR {hourly_rate:.2f}/hr, which is above your usual "
                        f"PKR {expected_rate:.2f}/hr. This may reflect a favorable shift."
                    ),
                )
            )

    return anomalies


def detect_anomalies(payload: EarningsHistoryPayload) -> DetectResponse:
    total_shifts = len(payload.shifts)
    if total_shifts < 5:
        return _build_insufficient_data_response(payload.worker_id, total_shifts)

    frame = _to_frame(payload)
    context = DetectionContext(worker_id=payload.worker_id, frame=frame)

    anomalies: list[AnomalyItem] = []
    anomalies.extend(_run_deduction_rate_pass(context))
    anomalies.extend(_run_income_drop_pass(context))
    anomalies.extend(_run_hourly_rate_pass(context))

    if anomalies:
        summary = (
            f"Detected {len(anomalies)} anomaly flag(s) across deduction rates, "
            "income trends, and hourly earnings."
        )
    else:
        summary = "No statistically unusual patterns were detected in the submitted shifts."

    return DetectResponse(
        worker_id=payload.worker_id,
        total_shifts_analyzed=total_shifts,
        anomalies_found=len(anomalies),
        anomalies=anomalies,
        summary=summary,
    )
