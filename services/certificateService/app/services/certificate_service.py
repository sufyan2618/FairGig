from __future__ import annotations

import hashlib
from collections import defaultdict
from datetime import date, datetime, timezone
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.core.config import settings
from app.schemas.certificate import (
    CertificateDirectRequest,
    PlatformBreakdownItem,
    TotalsSummary,
    VerifiedShift,
)


def _parse_iso_date(value: str | None, field_name: str) -> date | None:
    if value is None:
        return None

    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} must be in YYYY-MM-DD format",
        ) from exc


def _format_currency(amount: float) -> str:
    return f"PKR {amount:,.2f}"


def _mask_worker_id(worker_id: str) -> str:
    if len(worker_id) <= 8:
        return worker_id
    return f"{worker_id[:4]}...{worker_id[-4:]}"


def _build_certificate_id(worker_id: str, date_from: str | None, date_to: str | None) -> str:
    seed = f"{worker_id}:{date_from or 'na'}:{date_to or 'na'}:{datetime.now(timezone.utc).isoformat()}"
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:12].upper()
    return f"FG-CERT-{digest}"


def _period_label(date_from: str | None, date_to: str | None) -> str:
    if date_from and date_to:
        return f"{date_from} to {date_to}"
    if date_from:
        return f"From {date_from}"
    if date_to:
        return f"Until {date_to}"
    return "All verified records available"


def _derive_totals(shifts: list[VerifiedShift]) -> TotalsSummary:
    total_gross = sum(item.gross_earned for item in shifts)
    total_deductions = sum(item.deductions for item in shifts)
    total_net = sum(item.net_received for item in shifts)
    return TotalsSummary(
        total_gross=round(total_gross, 2),
        total_deductions=round(total_deductions, 2),
        total_net=round(total_net, 2),
    )


def _derive_platform_breakdown(shifts: list[VerifiedShift]) -> list[PlatformBreakdownItem]:
    grouped: dict[str, dict[str, float]] = defaultdict(
        lambda: {
            "total_gross": 0.0,
            "total_deductions": 0.0,
            "total_net": 0.0,
            "shifts_count": 0.0,
        }
    )

    for item in shifts:
        bucket = grouped[item.platform]
        bucket["total_gross"] += item.gross_earned
        bucket["total_deductions"] += item.deductions
        bucket["total_net"] += item.net_received
        bucket["shifts_count"] += 1

    breakdown = [
        PlatformBreakdownItem(
            platform=platform,
            total_gross=round(values["total_gross"], 2),
            total_deductions=round(values["total_deductions"], 2),
            total_net=round(values["total_net"], 2),
            shifts_count=int(values["shifts_count"]),
        )
        for platform, values in grouped.items()
    ]
    breakdown.sort(key=lambda item: item.platform.lower())
    return breakdown


def _normalize_shift_row(row: dict[str, Any]) -> VerifiedShift:
    return VerifiedShift(
        id=str(row.get("id", "")),
        platform=str(row.get("platform", "")),
        date=str(row.get("date", "")),
        hours_worked=float(row.get("hours_worked", 0)),
        gross_earned=float(row.get("gross_earned", 0)),
        deductions=float(row.get("deductions", 0)),
        net_received=float(row.get("net_received", 0)),
        verification_status=str(row.get("verification_status", "verified")),
    )


async def fetch_verified_summary(
    worker_id: str,
    date_from: str | None,
    date_to: str | None,
) -> CertificateDirectRequest:
    if not settings.INTERNAL_SERVICE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="INTERNAL_SERVICE_API_KEY is not configured.",
        )

    params: dict[str, str] = {}
    if date_from:
        params["date_from"] = date_from
    if date_to:
        params["date_to"] = date_to

    url = f"{settings.EARNINGS_SERVICE_URL}/shifts/summary/{worker_id}"
    headers = {"X-Service-Api-Key": settings.INTERNAL_SERVICE_API_KEY}

    try:
        async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS) as client:
            response = await client.get(url, params=params, headers=headers)
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to reach Earnings service.",
        ) from exc

    if response.status_code >= 500:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Earnings service returned server error.",
        )

    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Earnings service rejected certificate summary request.",
        )

    payload = response.json()
    shifts_raw = payload.get("verified_shifts")
    if not isinstance(shifts_raw, list) or len(shifts_raw) == 0:
        total_shifts_in_range = payload.get("total_shifts_in_range")
        status_breakdown = payload.get("status_breakdown")

        if isinstance(total_shifts_in_range, int) and total_shifts_in_range > 0 and isinstance(status_breakdown, dict):
            non_verified_statuses = [
                str(status_name)
                for status_name, count in status_breakdown.items()
                if str(status_name) != "verified" and isinstance(count, int) and count > 0
            ]

            if len(non_verified_statuses) > 0:
                human_readable_statuses = ", ".join(sorted(non_verified_statuses))
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "You have logged shifts in this date range, but none are verified yet. "
                        f"Current statuses: {human_readable_statuses}. "
                        "Please wait for verifier approval before generating certificate."
                    ),
                )

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No verified shifts found for the requested certificate range.",
        )

    shifts = [_normalize_shift_row(item) for item in shifts_raw if isinstance(item, dict)]
    if len(shifts) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No valid verified shifts available for certificate generation.",
        )

    totals_data = payload.get("totals") if isinstance(payload.get("totals"), dict) else None
    totals = (
        TotalsSummary(
            total_gross=float(totals_data.get("total_gross", 0)),
            total_deductions=float(totals_data.get("total_deductions", 0)),
            total_net=float(totals_data.get("total_net", 0)),
        )
        if totals_data
        else None
    )

    breakdown_data = payload.get("per_platform_breakdown")
    breakdown = None
    if isinstance(breakdown_data, list):
        parsed_items = [
            PlatformBreakdownItem(
                platform=str(item.get("platform", "")),
                total_gross=float(item.get("total_gross", 0)),
                total_deductions=float(item.get("total_deductions", 0)),
                total_net=float(item.get("total_net", 0)),
                shifts_count=int(item.get("shifts_count", 0)),
            )
            for item in breakdown_data
            if isinstance(item, dict)
        ]
        breakdown = parsed_items if parsed_items else None

    return CertificateDirectRequest(
        worker_id=worker_id,
        date_from=date_from,
        date_to=date_to,
        totals=totals,
        per_platform_breakdown=breakdown,
        verified_shifts=shifts,
    )


def build_certificate_context(
    worker_id: str,
    worker_name: str | None,
    worker_email: str | None,
    date_from: str | None,
    date_to: str | None,
    shifts: list[VerifiedShift],
    totals: TotalsSummary | None,
    breakdown: list[PlatformBreakdownItem] | None,
) -> dict[str, Any]:
    _parse_iso_date(date_from, "date_from")
    _parse_iso_date(date_to, "date_to")

    effective_totals = totals or _derive_totals(shifts)
    effective_breakdown = breakdown or _derive_platform_breakdown(shifts)

    sorted_shifts = sorted(shifts, key=lambda item: item.date, reverse=True)

    return {
        "certificate_id": _build_certificate_id(worker_id, date_from, date_to),
        "issued_on": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "worker_name": worker_name or "Worker",
        "worker_email": worker_email,
        "worker_id_masked": _mask_worker_id(worker_id),
        "period_label": _period_label(date_from, date_to),
        "summary": {
            "total_shifts": len(sorted_shifts),
            "total_gross": _format_currency(effective_totals.total_gross),
            "total_deductions": _format_currency(effective_totals.total_deductions),
            "total_net": _format_currency(effective_totals.total_net),
        },
        "per_platform_breakdown": [
            {
                "platform": item.platform,
                "shifts_count": item.shifts_count,
                "total_gross": _format_currency(item.total_gross),
                "total_deductions": _format_currency(item.total_deductions),
                "total_net": _format_currency(item.total_net),
            }
            for item in effective_breakdown
        ],
        "verified_shifts": [
            {
                "id": item.id,
                "date": item.date,
                "platform": item.platform,
                "hours_worked": f"{item.hours_worked:.2f}",
                "gross_earned": _format_currency(item.gross_earned),
                "deductions": _format_currency(item.deductions),
                "net_received": _format_currency(item.net_received),
            }
            for item in sorted_shifts
        ],
        "declaration": (
            "This certificate is generated by FairGig from verified earning records only. "
            "It is intended for third-party income verification use cases such as rental "
            "agreements or basic financial screening."
        ),
    }
