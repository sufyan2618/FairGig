from fastapi import HTTPException, status
from jwt import DecodeError, ExpiredSignatureError, InvalidTokenError
import jwt
from pydantic import BaseModel, ConfigDict

from app.core.config import settings


class TokenPayload(BaseModel):
    model_config = ConfigDict(strict=True)

    subject: str
    role: str | None = None


def decode_bearer_token(token: str) -> TokenPayload:
    if not settings.ACCESS_TOKEN_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ACCESS_TOKEN_SECRET is not configured.",
        )

    try:
        decoded = jwt.decode(
            token,
            settings.ACCESS_TOKEN_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token has expired.",
        ) from exc
    except (InvalidTokenError, DecodeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token.",
        ) from exc

    subject = decoded.get("sub")
    if not isinstance(subject, str) or not subject.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload must include a valid subject.",
        )

    token_type = decoded.get("type")
    if isinstance(token_type, str) and token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Only access tokens are accepted.",
        )

    role = decoded.get("role")
    if role is not None and not isinstance(role, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token role claim.",
        )

    return TokenPayload(subject=subject, role=role)
