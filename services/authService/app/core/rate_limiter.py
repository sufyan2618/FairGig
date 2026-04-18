from __future__ import annotations

from dataclasses import dataclass

from fastapi import HTTPException, Request, status

from app.core.redis_client import get_redis


@dataclass
class RateLimitResult:
    count: int
    limit: int
    retry_after: int


async def enforce_rate_limit(*, key: str, limit: int, window_seconds: int) -> RateLimitResult:
    redis = await get_redis()
    current_count = await redis.incr(key)

    if current_count == 1:
        await redis.expire(key, window_seconds)

    retry_after = await redis.ttl(key)
    if retry_after < 0:
        retry_after = window_seconds

    if current_count > limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Retry in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )

    return RateLimitResult(count=current_count, limit=limit, retry_after=retry_after)


def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"
