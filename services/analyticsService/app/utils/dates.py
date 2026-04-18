from __future__ import annotations

from datetime import date, datetime, timedelta, timezone


def parse_month_label(month: str | None) -> date:
    if not month:
        today = datetime.now(timezone.utc).date()
        return date(today.year, today.month, 1)

    try:
        parsed = datetime.strptime(month, "%Y-%m").date()
    except ValueError as exc:
        raise ValueError("month must be in YYYY-MM format") from exc

    return date(parsed.year, parsed.month, 1)


def month_label(month_start: date) -> str:
    return month_start.strftime("%Y-%m")


def previous_month(month_start: date) -> date:
    if month_start.month == 1:
        return date(month_start.year - 1, 12, 1)
    return date(month_start.year, month_start.month - 1, 1)


def week_bounds_utc(now: datetime | None = None) -> tuple[date, date]:
    reference = now or datetime.now(timezone.utc)
    weekday = reference.weekday()
    week_start = (reference - timedelta(days=weekday)).date()
    week_end = week_start + timedelta(days=6)
    return week_start, week_end
