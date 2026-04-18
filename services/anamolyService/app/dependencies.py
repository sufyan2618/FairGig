from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from pydantic import BaseModel, ConfigDict

from app.core.config import settings
from app.core.security import decode_bearer_token


class CurrentPrincipal(BaseModel):
	model_config = ConfigDict(strict=True)

	subject: str | None = None
	role: str | None = None
	is_internal_service: bool = False
	auth_mode: str


def get_request_principal(
	authorization: Annotated[str | None, Header(alias="Authorization")] = None,
	internal_api_key: Annotated[str | None, Header(alias="X-Service-Api-Key")] = None,
) -> CurrentPrincipal:
	if internal_api_key and internal_api_key == settings.INTERNAL_SERVICE_API_KEY:
		return CurrentPrincipal(auth_mode="internal_key", is_internal_service=True)

	if authorization and authorization.startswith("Bearer "):
		token = authorization.removeprefix("Bearer ").strip()
		if not token:
			raise HTTPException(
				status_code=status.HTTP_401_UNAUTHORIZED,
				detail="Missing Bearer token value.",
			)
		token_payload = decode_bearer_token(token)
		return CurrentPrincipal(
			subject=token_payload.subject,
			role=token_payload.role,
			is_internal_service=False,
			auth_mode="bearer",
		)

	if settings.ALLOW_OPEN_DETECT:
		return CurrentPrincipal(auth_mode="open", is_internal_service=False)

	raise HTTPException(
		status_code=status.HTTP_401_UNAUTHORIZED,
		detail="Authentication is required via Bearer token or internal API key.",
	)


PrincipalDep = Annotated[CurrentPrincipal, Depends(get_request_principal)]
