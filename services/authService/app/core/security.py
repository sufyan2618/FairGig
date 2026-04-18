from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def _build_token(
    *,
    subject: str,
    role: str,
    token_type: str,
    secret: str,
    expires_delta: timedelta,
) -> tuple[str, datetime, str]:
    now = datetime.now(UTC)
    expires_at = now + expires_delta
    jti = str(uuid4())
    payload = {
        "sub": subject,
        "role": role,
        "type": token_type,
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, secret, algorithm=settings.JWT_ALGORITHM)
    return token, expires_at, jti


def create_access_token(*, user_id: str, role: str) -> tuple[str, datetime, str]:
    return _build_token(
        subject=user_id,
        role=role,
        token_type="access",
        secret=settings.ACCESS_TOKEN_SECRET,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(*, user_id: str, role: str) -> tuple[str, datetime, str]:
    return _build_token(
        subject=user_id,
        role=role,
        token_type="refresh",
        secret=settings.REFRESH_TOKEN_SECRET,
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.ACCESS_TOKEN_SECRET, algorithms=[settings.JWT_ALGORITHM])


def decode_refresh_token(token: str) -> dict:
    return jwt.decode(token, settings.REFRESH_TOKEN_SECRET, algorithms=[settings.JWT_ALGORITHM])


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_numeric_otp(length: int) -> str:
    if length <= 0:
        raise ValueError("OTP length must be greater than 0")
    max_value = 10**length
    otp_int = secrets.randbelow(max_value)
    return f"{otp_int:0{length}d}"


def hash_otp(user_id: str, otp_code: str) -> str:
    digest = hmac.new(
        key=settings.OTP_HASH_SECRET.encode("utf-8"),
        msg=f"{user_id}:{otp_code}".encode("utf-8"),
        digestmod=hashlib.sha256,
    )
    return digest.hexdigest()


def verify_otp_hash(*, user_id: str, otp_code: str, expected_hash: str) -> bool:
    generated_hash = hash_otp(user_id=user_id, otp_code=otp_code)
    return hmac.compare_digest(generated_hash, expected_hash)
