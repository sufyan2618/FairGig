from __future__ import annotations

import json
import logging
import os
import sys
import time
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from opentelemetry import trace
from opentelemetry.instrumentation.logging import LoggingInstrumentor
from starlette.middleware.base import BaseHTTPMiddleware

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

_RESERVED_LOG_RECORD_KEYS = frozenset(
    vars(logging.LogRecord("", 0, "", 0, "", (), None)).keys()
)


class JSONFormatter(logging.Formatter):
    def __init__(self, service_name: str) -> None:
        super().__init__()
        self.service_name = service_name

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, object] = {
            "time": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "service": self.service_name,
            "logger": record.name,
            "message": record.getMessage(),
        }

        span = trace.get_current_span()
        if span.is_recording():
            ctx = span.get_span_context()
            payload["trace_id"] = format(ctx.trace_id, "032x")
            payload["span_id"] = format(ctx.span_id, "016x")

        for key, value in record.__dict__.items():
            if key not in _RESERVED_LOG_RECORD_KEYS and key != "message":
                payload[key] = value

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, default=str)


def setup_logging(service_name: str) -> logging.Logger:
    root = logging.getLogger()
    root.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter(service_name))

    root.setLevel(getattr(logging, LOG_LEVEL, logging.INFO))
    root.addHandler(handler)

    LoggingInstrumentor().instrument(set_logging_format=False)

    return logging.getLogger(service_name)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: object, *, service_name: str) -> None:
        super().__init__(app)
        self.logger = logging.getLogger(f"{service_name}.access")

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        if request.url.path in {"/metrics", "/api/health", "/health"}:
            return await call_next(request)

        start = time.perf_counter()
        client_ip = request.client.host if request.client else "unknown"

        try:
            response = await call_next(request)
        except Exception:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            self.logger.exception(
                "request failed",
                extra={
                    "event": "http_request",
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                    "client_ip": client_ip,
                },
            )
            raise

        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        log_level = logging.WARNING if response.status_code >= 400 else logging.INFO

        self.logger.log(
            log_level,
            "request completed",
            extra={
                "event": "http_request",
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "client_ip": client_ip,
            },
        )

        return response
