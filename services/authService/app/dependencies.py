from __future__ import annotations

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
	credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
	db: AsyncSession = Depends(get_db),
) -> User:
	if not credentials or credentials.scheme.lower() != "bearer":
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Missing access token.",
		)

	try:
		payload = decode_access_token(credentials.credentials)
	except jwt.ExpiredSignatureError as exc:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Access token has expired.",
		) from exc
	except jwt.InvalidTokenError as exc:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Invalid access token.",
		) from exc

	if payload.get("type") != "access":
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Invalid access token.",
		)

	user_id = payload.get("sub")
	if not user_id:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Invalid access token.",
		)

	result = await db.execute(select(User).where(User.id == user_id, User.is_active.is_(True)))
	user = result.scalar_one_or_none()
	if not user:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="User not found or inactive.",
		)

	return user


def require_roles(*allowed_roles: UserRole):
	async def role_dependency(current_user: User = Depends(get_current_user)) -> User:
		if current_user.role not in allowed_roles:
			raise HTTPException(
				status_code=status.HTTP_403_FORBIDDEN,
				detail="You do not have access to this resource.",
			)
		return current_user

	return role_dependency
