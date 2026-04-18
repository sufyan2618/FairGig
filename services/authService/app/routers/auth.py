from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rate_limiter import get_client_ip
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import (
    AuthWithUserResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    IntrospectResponse,
    LoginRequest,
    LogoutRequest,
    RefreshTokenRequest,
    RegisterRequest,
    RegisterResponse,
    ResendEmailOtpRequest,
    ResetPasswordRequest,
    UpdateProfileRequest,
    VerifyEmailOtpRequest,
)
from app.schemas.common import MessageResponse
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> RegisterResponse:
    auth_service = AuthService(db)
    user = await auth_service.register_user(
        full_name=payload.full_name,
        email=payload.email,
        password=payload.password,
        role=payload.role,
    )
    return RegisterResponse(
        message="Registration successful. Please verify your email with the OTP sent.",
        user=UserResponse.model_validate(user),
    )


@router.post("/verify-email-otp", response_model=MessageResponse)
async def verify_email_otp(
    payload: VerifyEmailOtpRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    auth_service = AuthService(db)
    await auth_service.verify_email_otp(email=payload.email, otp_code=payload.otp_code)
    return MessageResponse(message="Email verified successfully.")


@router.post("/resend-email-otp", response_model=MessageResponse)
async def resend_email_otp(
    payload: ResendEmailOtpRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    auth_service = AuthService(db)
    await auth_service.resend_email_otp(email=payload.email)
    return MessageResponse(message="OTP sent successfully.")


@router.post("/login", response_model=AuthWithUserResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> AuthWithUserResponse:
    auth_service = AuthService(db)
    token_response, user = await auth_service.login(
        email=payload.email,
        password=payload.password,
        ip_address=get_client_ip(request),
    )
    return AuthWithUserResponse(tokens=token_response, user=UserResponse.model_validate(user))


@router.post("/refresh", response_model=AuthWithUserResponse)
async def refresh_tokens(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> AuthWithUserResponse:
    auth_service = AuthService(db)
    token_response, user = await auth_service.refresh_tokens(refresh_token=payload.refresh_token)
    return AuthWithUserResponse(tokens=token_response, user=UserResponse.model_validate(user))


@router.post("/logout", response_model=MessageResponse)
async def logout(
    payload: LogoutRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    auth_service = AuthService(db)
    await auth_service.logout(refresh_token=payload.refresh_token)
    return MessageResponse(message="Logged out successfully.")


@router.post("/logout-current", response_model=MessageResponse)
async def logout_current(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    auth_service = AuthService(db)
    await auth_service.logout_current_user(user=current_user)
    return MessageResponse(message="Logged out successfully.")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    auth_service = AuthService(db)
    await auth_service.forgot_password(email=payload.email)
    return MessageResponse(message="If the account exists, a reset OTP has been sent.")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    auth_service = AuthService(db)
    await auth_service.reset_password(
        email=payload.email,
        otp_code=payload.otp_code,
        new_password=payload.new_password,
    )
    return MessageResponse(message="Password reset successfully.")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_me(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    auth_service = AuthService(db)
    user = await auth_service.update_profile(user=current_user, full_name=payload.full_name)
    return UserResponse.model_validate(user)


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    auth_service = AuthService(db)
    await auth_service.change_password(
        user=current_user,
        current_password=payload.current_password,
        new_password=payload.new_password,
    )
    return MessageResponse(message="Password updated successfully.")


@router.get("/introspect", response_model=IntrospectResponse)
async def introspect(
    response: Response,
    current_user: User = Depends(get_current_user),
) -> IntrospectResponse:
    response.headers["X-User-Id"] = str(current_user.id)
    response.headers["X-User-Name"] = current_user.full_name
    response.headers["X-User-Email"] = current_user.email
    response.headers["X-User-Role"] = current_user.role.value
    return IntrospectResponse(
        user_id=str(current_user.id),
        full_name=current_user.full_name,
        email=current_user.email,
        role=current_user.role,
    )
