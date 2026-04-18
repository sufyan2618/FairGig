from __future__ import annotations

from datetime import datetime, timedelta, timezone

import httpx
import jwt

from app.core.cache import grievance_cache
from app.core.config import get_jwt_secret, settings
from app.schemas.analytics import GrievanceOverview


def _service_token() -> str:
	jwt_secret = get_jwt_secret()
	if not jwt_secret:
		return ""

	payload = {
		"sub": "analytics-service",
		"role": "advocate",
		"type": "access",
		"iat": int(datetime.now(timezone.utc).timestamp()),
		"exp": int((datetime.now(timezone.utc) + timedelta(minutes=10)).timestamp()),
	}
	return jwt.encode(payload, jwt_secret, algorithm=settings.JWT_ALGORITHM)


def fetch_grievance_overview(date_from: str, date_to: str) -> GrievanceOverview:
	cache_key = f"grievance_overview:{date_from}:{date_to}"
	cached = grievance_cache.get(cache_key)
	if cached is not None:
		return cached

	if not get_jwt_secret():
		result = GrievanceOverview()
		grievance_cache.set(cache_key, result, settings.GRIEVANCE_CACHE_TTL_SECONDS)
		return result

	token = _service_token()
	headers = {"Authorization": f"Bearer {token}"}

	top_categories_url = f"{settings.GRIEVANCE_SERVICE_URL}/analytics/top-categories"
	by_platform_url = (
		f"{settings.GRIEVANCE_SERVICE_URL}/analytics/by-platform"
		f"?date_from={date_from}&date_to={date_to}"
	)

	try:
		with httpx.Client(timeout=settings.GRIEVANCE_TIMEOUT_SECONDS) as client:
			top_categories_response = client.get(top_categories_url, headers=headers)
			top_categories_response.raise_for_status()
			by_platform_response = client.get(by_platform_url, headers=headers)
			by_platform_response.raise_for_status()

		top_categories = top_categories_response.json()
		by_platform = by_platform_response.json()

		total_grievances_this_week = int(
			sum(int(item.get("count", 0)) for item in top_categories if isinstance(item, dict))
		)

		most_complained_platform = None
		if isinstance(by_platform, list) and by_platform:
			ranked = sorted(
				by_platform,
				key=lambda item: int(item.get("total", 0)) if isinstance(item, dict) else 0,
				reverse=True,
			)
			best = ranked[0] if ranked else None
			if isinstance(best, dict):
				most_complained_platform = best.get("platform")

		result = GrievanceOverview(
			total_grievances_this_week=total_grievances_this_week,
			most_complained_platform=most_complained_platform,
		)
	except Exception:
		result = GrievanceOverview()

	grievance_cache.set(cache_key, result, settings.GRIEVANCE_CACHE_TTL_SECONDS)
	return result
