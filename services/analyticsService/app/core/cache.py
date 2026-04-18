from __future__ import annotations

import threading
import time
from typing import Any


class TtlCache:
    def __init__(self) -> None:
        self._store: dict[str, tuple[float, Any]] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Any | None:
        now = time.time()
        with self._lock:
            item = self._store.get(key)
            if not item:
                return None
            expires_at, value = item
            if expires_at <= now:
                self._store.pop(key, None)
                return None
            return value

    def set(self, key: str, value: Any, ttl_seconds: int) -> Any:
        expires_at = time.time() + ttl_seconds
        with self._lock:
            self._store[key] = (expires_at, value)
        return value


analytics_cache = TtlCache()
grievance_cache = TtlCache()
platforms_cache = TtlCache()
