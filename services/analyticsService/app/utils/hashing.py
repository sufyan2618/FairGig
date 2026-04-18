from __future__ import annotations

import hashlib


def worker_reference(worker_id: str, salt: str) -> str:
    digest = hashlib.sha256(f"{salt}:{worker_id}".encode("utf-8")).hexdigest()[:10].upper()
    return f"WRK-{digest}"
