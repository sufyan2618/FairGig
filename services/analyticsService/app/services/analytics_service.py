from __future__ import annotations

from datetime import date, datetime, timezone

import pandas as pd

from app.core.cache import analytics_cache, platforms_cache
from app.core.config import settings
from app.core.database import fetch_all, fetch_one
from app.schemas.analytics import (
    CommissionTrendPeriod,
    CommissionTrendPlatform,
    CommissionTrendsResponse,
    IncomeDistributionResponse,
    IncomeDistributionZone,
    OverviewKpisResponse,
    PlatformSummaryItem,
    PlatformSummaryResponse,
    PlatformsResponse,
    VulnerabilityFlagsResponse,
    VulnerabilityWorker,
    WorkerMedianResponse,
)
from app.services.grievance_client import fetch_grievance_overview
from app.utils.dates import month_label, parse_month_label, previous_month, week_bounds_utc
from app.utils.hashing import worker_reference


def get_worker_median(category: str, city_zone: str, month: str | None) -> WorkerMedianResponse:
    month_start = parse_month_label(month)
    cache_key = f"worker_median:{category}:{city_zone}:{month_label(month_start)}"
    cached = analytics_cache.get(cache_key)
    if cached is not None:
        return cached

    query = """
    WITH worker_monthly AS (
        SELECT worker_id, SUM(net_received)::numeric AS total_net
        FROM shift_logs
        WHERE verification_status = 'verified'
          AND deleted_at IS NULL
          AND worker_category = :category
          AND city_zone = :city_zone
          AND date_trunc('month', shift_date::timestamp) = date_trunc('month', CAST(:month_start AS date))
        GROUP BY worker_id
    )
    SELECT
      COUNT(*)::int AS cohort_size,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY total_net) AS median_net_earned_pkr
    FROM worker_monthly
    """

    row = fetch_one(
        query,
        {
            "category": category,
            "city_zone": city_zone,
            "month_start": month_start,
        },
    ) or {"cohort_size": 0, "median_net_earned_pkr": None}

    cohort_size = int(row.get("cohort_size") or 0)
    median_value = row.get("median_net_earned_pkr")

    if cohort_size < settings.MIN_COHORT_SIZE:
        response = WorkerMedianResponse(
            category=category,
            city_zone=city_zone,
            month=month_label(month_start),
            median_net_earned_pkr=None,
            cohort_size=cohort_size,
            suppressed=True,
            message=(
                "Not enough data in this zone to compute a median without risking "
                "individual identification."
            ),
        )
    else:
        response = WorkerMedianResponse(
            category=category,
            city_zone=city_zone,
            month=month_label(month_start),
            median_net_earned_pkr=round(float(median_value or 0), 2),
            cohort_size=cohort_size,
            suppressed=False,
        )

    analytics_cache.set(cache_key, response, settings.CACHE_TTL_SECONDS)
    return response


def get_commission_trends(
    period: str,
    platform: str | None,
    date_from: date | None,
    date_to: date | None,
) -> CommissionTrendsResponse:
    cache_key = f"commission_trends:{period}:{platform}:{date_from}:{date_to}"
    cached = analytics_cache.get(cache_key)
    if cached is not None:
        return cached

    period_expr = "date_trunc('week', shift_date::timestamp)" if period == "weekly" else "date_trunc('month', shift_date::timestamp)"

    query = f"""
    SELECT
      platform,
      {period_expr} AS period_start,
      AVG((platform_deductions::numeric / NULLIF(gross_earned, 0)) * 100) AS avg_commission_rate,
      COUNT(*)::int AS sample_count
    FROM shift_logs
    WHERE verification_status = 'verified'
      AND deleted_at IS NULL
      AND (:platform IS NULL OR platform = :platform)
    AND (:date_from IS NULL OR shift_date >= CAST(:date_from AS date))
    AND (:date_to IS NULL OR shift_date <= CAST(:date_to AS date))
    GROUP BY platform, period_start
    ORDER BY platform, period_start
    """

    rows = fetch_all(
        query,
        {
            "platform": platform,
            "date_from": date_from,
            "date_to": date_to,
        },
    )

    if not rows:
        response = CommissionTrendsResponse(period=period, data=[])
        analytics_cache.set(cache_key, response, settings.CACHE_TTL_SECONDS)
        return response

    frame = pd.DataFrame(rows)
    frame["period_start"] = pd.to_datetime(frame["period_start"])
    frame["label"] = (
        frame["period_start"].dt.strftime("%G-W%V")
        if period == "weekly"
        else frame["period_start"].dt.strftime("%Y-%m")
    )

    grouped: list[CommissionTrendPlatform] = []
    for platform_name, subset in frame.groupby("platform"):
        periods = [
            CommissionTrendPeriod(
                label=str(item["label"]),
                avg_commission_rate=round(float(item["avg_commission_rate"] or 0), 2),
                sample_count=int(item["sample_count"] or 0),
            )
            for _, item in subset.sort_values("period_start").iterrows()
        ]
        grouped.append(CommissionTrendPlatform(platform=str(platform_name), periods=periods))

    response = CommissionTrendsResponse(period=period, data=grouped)
    analytics_cache.set(cache_key, response, settings.CACHE_TTL_SECONDS)
    return response


def get_income_distribution(month: str | None, category: str | None) -> IncomeDistributionResponse:
    month_start = parse_month_label(month)
    cache_key = f"income_distribution:{month_label(month_start)}:{category}"
    cached = analytics_cache.get(cache_key)
    if cached is not None:
        return cached

    query = """
    WITH worker_monthly AS (
      SELECT city_zone, worker_id, SUM(net_received)::numeric AS total_net
      FROM shift_logs
      WHERE verification_status = 'verified'
        AND deleted_at IS NULL
        AND date_trunc('month', shift_date::timestamp) = date_trunc('month', CAST(:month_start AS date))
        AND (:category IS NULL OR worker_category = :category)
      GROUP BY city_zone, worker_id
    )
    SELECT city_zone, worker_id, total_net
    FROM worker_monthly
    WHERE city_zone IS NOT NULL
    """

    rows = fetch_all(query, {"month_start": month_start, "category": category})

    if not rows:
        response = IncomeDistributionResponse(month=month_label(month_start), zones=[])
        analytics_cache.set(cache_key, response, settings.CACHE_TTL_SECONDS)
        return response

    frame = pd.DataFrame(rows)
    zones: list[IncomeDistributionZone] = []

    for zone_name, subset in frame.groupby("city_zone"):
        cohort_size = int(subset["worker_id"].nunique())

        if cohort_size < settings.MIN_COHORT_SIZE:
            zones.append(
                IncomeDistributionZone(
                    city_zone=str(zone_name),
                    cohort_size=cohort_size,
                    suppressed=True,
                    median_net_pkr=None,
                    p25_net_pkr=None,
                    p75_net_pkr=None,
                    message="Not enough data in this zone to compute distribution safely.",
                )
            )
            continue

        zones.append(
            IncomeDistributionZone(
                city_zone=str(zone_name),
                cohort_size=cohort_size,
                suppressed=False,
                median_net_pkr=round(float(subset["total_net"].median()), 2),
                p25_net_pkr=round(float(subset["total_net"].quantile(0.25)), 2),
                p75_net_pkr=round(float(subset["total_net"].quantile(0.75)), 2),
            )
        )

    zones.sort(key=lambda item: item.city_zone)
    response = IncomeDistributionResponse(month=month_label(month_start), zones=zones)
    analytics_cache.set(cache_key, response, settings.CACHE_TTL_SECONDS)
    return response


def get_vulnerability_flags(
    month: str | None,
    min_drop_percent: float,
    category: str | None,
    city_zone: str | None,
    page: int,
    limit: int,
) -> VulnerabilityFlagsResponse:
    month_start = parse_month_label(month)
    previous_start = previous_month(month_start)
    offset = (page - 1) * limit

    cache_key = (
        f"vulnerability:{month_label(month_start)}:{min_drop_percent}:"
        f"{category}:{city_zone}:{page}:{limit}"
    )
    cached = analytics_cache.get(cache_key)
    if cached is not None:
        return cached

    base_cte = """
    WITH monthly AS (
      SELECT
        worker_id,
        platform,
        COALESCE(worker_category, 'other') AS category,
        COALESCE(city_zone, 'unknown') AS city_zone,
        date_trunc('month', shift_date::timestamp)::date AS month_start,
        SUM(net_received)::numeric AS total_net
      FROM shift_logs
      WHERE verification_status = 'verified'
        AND deleted_at IS NULL
      GROUP BY worker_id, platform, category, city_zone, month_start
    ),
    joined AS (
      SELECT
        c.worker_id,
        c.platform,
        c.category,
        c.city_zone,
        p.total_net AS prev_month_net_pkr,
        c.total_net AS current_month_net_pkr,
        ROUND(((p.total_net - c.total_net) / NULLIF(p.total_net, 0)) * 100, 2) AS drop_percent
      FROM monthly c
      JOIN monthly p
        ON p.worker_id = c.worker_id
       AND p.platform = c.platform
            WHERE c.month_start = CAST(:current_month AS date)
                AND p.month_start = CAST(:previous_month AS date)
        AND p.total_net > 0
        AND (:category IS NULL OR c.category = :category)
        AND (:city_zone IS NULL OR c.city_zone = :city_zone)
    )
    """

    total_query = base_cte + "SELECT COUNT(*)::int AS total_flagged FROM joined WHERE drop_percent >= :threshold"
    total_row = fetch_one(
        total_query,
        {
            "current_month": month_start,
            "previous_month": previous_start,
            "threshold": min_drop_percent,
            "category": category,
            "city_zone": city_zone,
        },
    ) or {"total_flagged": 0}

    data_query = (
        base_cte
        + """
        SELECT *
        FROM joined
        WHERE drop_percent >= :threshold
        ORDER BY drop_percent DESC
        LIMIT :limit OFFSET :offset
        """
    )

    rows = fetch_all(
        data_query,
        {
            "current_month": month_start,
            "previous_month": previous_start,
            "threshold": min_drop_percent,
            "category": category,
            "city_zone": city_zone,
            "limit": limit,
            "offset": offset,
        },
    )

    workers = [
        VulnerabilityWorker(
            worker_ref=worker_reference(str(row["worker_id"]), settings.WORKER_REF_SALT),
            category=str(row["category"]),
            city_zone=str(row["city_zone"]),
            platform=str(row["platform"]),
            prev_month_net_pkr=round(float(row["prev_month_net_pkr"] or 0), 2),
            current_month_net_pkr=round(float(row["current_month_net_pkr"] or 0), 2),
            drop_percent=round(float(row["drop_percent"] or 0), 2),
            severity="high" if float(row["drop_percent"] or 0) >= 40 else "medium",
        )
        for row in rows
    ]

    response = VulnerabilityFlagsResponse(
        month=month_label(month_start),
        threshold_percent=min_drop_percent,
        total_flagged=int(total_row["total_flagged"] or 0),
        workers=workers,
    )
    analytics_cache.set(cache_key, response, settings.CACHE_TTL_SECONDS)
    return response


def get_platform_summary(date_from: date | None, date_to: date | None) -> PlatformSummaryResponse:
    cache_key = f"platform_summary:{date_from}:{date_to}"
    cached = analytics_cache.get(cache_key)
    if cached is not None:
        return cached

    query = """
    SELECT
      platform,
      COUNT(DISTINCT worker_id)::int AS total_workers,
      AVG(net_received)::numeric AS avg_net_earned_pkr,
      AVG((platform_deductions::numeric / NULLIF(gross_earned, 0)) * 100) AS avg_commission_rate,
      COUNT(*)::int AS total_shifts
    FROM shift_logs
    WHERE verification_status = 'verified'
      AND deleted_at IS NULL
    AND (:date_from IS NULL OR shift_date >= CAST(:date_from AS date))
    AND (:date_to IS NULL OR shift_date <= CAST(:date_to AS date))
    GROUP BY platform
    ORDER BY platform
    """

    rows = fetch_all(query, {"date_from": date_from, "date_to": date_to})
    response = PlatformSummaryResponse(
        platforms=[
            PlatformSummaryItem(
                platform=str(row["platform"]),
                total_workers=int(row["total_workers"] or 0),
                avg_net_earned_pkr=round(float(row["avg_net_earned_pkr"] or 0), 2),
                avg_commission_rate=round(float(row["avg_commission_rate"] or 0), 2),
                total_shifts=int(row["total_shifts"] or 0),
            )
            for row in rows
        ]
    )
    analytics_cache.set(cache_key, response, settings.CACHE_TTL_SECONDS)
    return response


def get_overview_kpis() -> OverviewKpisResponse:
    now = datetime.now(timezone.utc)
    month_start = date(now.year, now.month, 1)
    week_start, week_end = week_bounds_utc(now)

    cache_key = f"overview:{month_label(month_start)}:{week_start}:{week_end}"
    cached = analytics_cache.get(cache_key)
    if cached is not None:
        return cached

    active_workers_row = fetch_one(
        """
        SELECT COUNT(DISTINCT worker_id)::int AS total_active_workers
        FROM shift_logs
        WHERE deleted_at IS NULL
        """
    ) or {"total_active_workers": 0}

    month_earnings_row = fetch_one(
        """
        SELECT COALESCE(SUM(net_received), 0)::numeric AS total_verified_earnings_this_month_pkr
        FROM shift_logs
        WHERE verification_status = 'verified'
          AND deleted_at IS NULL
          AND date_trunc('month', shift_date::timestamp) = date_trunc('month', CAST(:month_start AS date))
        """,
        {"month_start": month_start},
    ) or {"total_verified_earnings_this_month_pkr": 0}

    vulnerability_count_row = fetch_one(
        """
        WITH monthly AS (
          SELECT
            worker_id,
            platform,
            date_trunc('month', shift_date::timestamp)::date AS month_start,
            SUM(net_received)::numeric AS total_net
          FROM shift_logs
          WHERE verification_status = 'verified' AND deleted_at IS NULL
          GROUP BY worker_id, platform, month_start
        )
        SELECT COUNT(*)::int AS total_vulnerability_flags_this_month
        FROM monthly c
        JOIN monthly p ON p.worker_id = c.worker_id AND p.platform = c.platform
                WHERE c.month_start = CAST(:current_month AS date)
                    AND p.month_start = CAST(:previous_month AS date)
          AND p.total_net > 0
          AND ((p.total_net - c.total_net) / NULLIF(p.total_net, 0)) * 100 >= 20
        """,
        {
            "current_month": month_start,
            "previous_month": previous_month(month_start),
        },
    ) or {"total_vulnerability_flags_this_month": 0}

    grievance_overview = fetch_grievance_overview(
        date_from=week_start.isoformat(),
        date_to=week_end.isoformat(),
    )

    response = OverviewKpisResponse(
        total_active_workers=int(active_workers_row["total_active_workers"] or 0),
        total_verified_earnings_this_month_pkr=round(
            float(month_earnings_row["total_verified_earnings_this_month_pkr"] or 0), 2
        ),
        total_grievances_this_week=int(grievance_overview.total_grievances_this_week),
        total_vulnerability_flags_this_month=int(
            vulnerability_count_row["total_vulnerability_flags_this_month"] or 0
        ),
        most_complained_platform=grievance_overview.most_complained_platform,
    )

    analytics_cache.set(cache_key, response, settings.CACHE_TTL_SECONDS)
    return response


def get_platforms() -> PlatformsResponse:
    cache_key = "platforms"
    cached = platforms_cache.get(cache_key)
    if cached is not None:
        return cached

    rows = fetch_all(
        """
        SELECT DISTINCT platform
        FROM shift_logs
        WHERE deleted_at IS NULL
        ORDER BY platform
        """
    )

    response = PlatformsResponse(platforms=[str(row["platform"]) for row in rows])
    platforms_cache.set(cache_key, response, settings.PLATFORMS_CACHE_TTL_SECONDS)
    return response
