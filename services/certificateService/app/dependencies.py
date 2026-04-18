from fastapi import Header, HTTPException, status
from pydantic import BaseModel


class CurrentUser(BaseModel):
	user_id: str
	email: str | None = None
	role: str | None = None


def get_current_user(
	x_user_id: str | None = Header(default=None, alias="X-User-Id"),
	x_user_email: str | None = Header(default=None, alias="X-User-Email"),
	x_user_role: str | None = Header(default=None, alias="X-User-Role"),
) -> CurrentUser:
	if not x_user_id:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Unauthorized: missing user context",
		)

	return CurrentUser(user_id=x_user_id, email=x_user_email, role=x_user_role)
