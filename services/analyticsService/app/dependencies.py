from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from jwt import DecodeError, ExpiredSignatureError, InvalidTokenError
import jwt
from pydantic import BaseModel, ConfigDict

from app.core.config import get_jwt_secret, settings


class Principal(BaseModel):
	model_config = ConfigDict(strict=True)

	user_id: str
	role: str


def get_current_principal(
	authorization: Annotated[str | None, Header(alias="Authorization")] = None,
) -> Principal:
	if not authorization or not authorization.startswith("Bearer "):
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Missing or invalid Bearer token.",
		)

	token = authorization.removeprefix("Bearer ").strip()
	if not token:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Missing Bearer token value.",
		)

	jwt_secret = get_jwt_secret()
	if not jwt_secret:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail="JWT secret is not configured.",
		)

	try:
		decoded = jwt.decode(token, jwt_secret, algorithms=[settings.JWT_ALGORITHM])
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

	role = decoded.get("role")
	user_id = decoded.get("sub") or decoded.get("user_id") or decoded.get("id")

	if not isinstance(role, str):
		raise HTTPException(
			status_code=status.HTTP_403_FORBIDDEN,
			detail="Invalid role in token.",
		)

	if not isinstance(user_id, str):
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Invalid token subject.",
		)

	token_type = decoded.get("type")
	if isinstance(token_type, str) and token_type != "access":
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Only access tokens are allowed.",
		)

	return Principal(user_id=user_id, role=role)


def require_roles(*roles: str):
	def dependency(principal: Annotated[Principal, Depends(get_current_principal)]) -> Principal:
		if principal.role not in roles:
			raise HTTPException(
				status_code=status.HTTP_403_FORBIDDEN,
				detail="You do not have permission to access this endpoint.",
			)
		return principal

	return dependency
