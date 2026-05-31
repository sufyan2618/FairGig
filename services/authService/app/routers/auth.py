from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.logging_config import get_logger
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
logger = get_logger(__name__)


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> RegisterResponse:
    logger.info(
        "user registration requested",
        extra={"event": "register", "email": payload.email.lower().strip(), "role": payload.role.value},
    )
    auth_service = AuthService(db)
    user = await auth_service.register_user(
        full_name=payload.full_name,
        email=payload.email,
        password=payload.password,
        role=payload.role,
    )
    logger.info(
        "user registered",
        extra={"event": "register_success", "user_id": str(user.id), "role": user.role.value},
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
    logger.info("email otp verification requested", extra={"event": "verify_email_otp", "email": payload.email})
    auth_service = AuthService(db)
    await auth_service.verify_email_otp(email=payload.email, otp_code=payload.otp_code)
    logger.info("email verified", extra={"event": "verify_email_otp_success", "email": payload.email})
    return MessageResponse(message="Email verified successfully.")


@router.post("/resend-email-otp", response_model=MessageResponse)
async def resend_email_otp(
    payload: ResendEmailOtpRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    logger.info("email otp resend requested", extra={"event": "resend_email_otp", "email": payload.email})
    auth_service = AuthService(db)
    await auth_service.resend_email_otp(email=payload.email)
    logger.info("email otp resent", extra={"event": "resend_email_otp_success", "email": payload.email})
    return MessageResponse(message="OTP sent successfully.")


@router.post("/login", response_model=AuthWithUserResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> AuthWithUserResponse:
    client_ip = get_client_ip(request)
    logger.info(
        "login requested",
        extra={"event": "login", "email": payload.email.lower().strip(), "client_ip": client_ip},
    )
    auth_service = AuthService(db)
    token_response, user = await auth_service.login(
        email=payload.email,
        password=payload.password,
        ip_address=client_ip,
    )
    logger.info(
        "login successful",
        extra={"event": "login_success", "user_id": str(user.id), "role": user.role.value, "client_ip": client_ip},
    )
    return AuthWithUserResponse(tokens=token_response, user=UserResponse.model_validate(user))


@router.post("/refresh", response_model=AuthWithUserResponse)
async def refresh_tokens(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> AuthWithUserResponse:
    logger.info("token refresh requested", extra={"event": "refresh_token"})
    auth_service = AuthService(db)
    token_response, user = await auth_service.refresh_tokens(refresh_token=payload.refresh_token)
    logger.info(
        "token refresh successful",
        extra={"event": "refresh_token_success", "user_id": str(user.id), "role": user.role.value},
    )
    return AuthWithUserResponse(tokens=token_response, user=UserResponse.model_validate(user))


@router.post("/logout", response_model=MessageResponse)
async def logout(
    payload: LogoutRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    logger.info("logout requested", extra={"event": "logout"})
    auth_service = AuthService(db)
    await auth_service.logout(refresh_token=payload.refresh_token)
    logger.info("logout successful", extra={"event": "logout_success"})
    return MessageResponse(message="Logged out successfully.")


@router.post("/logout-current", response_model=MessageResponse)
async def logout_current(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    logger.info(
        "current session logout requested",
        extra={"event": "logout_current", "user_id": str(current_user.id)},
    )
    auth_service = AuthService(db)
    await auth_service.logout_current_user(user=current_user)
    logger.info(
        "current session logout successful",
        extra={"event": "logout_current_success", "user_id": str(current_user.id)},
    )
    return MessageResponse(message="Logged out successfully.")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    logger.info("forgot password requested", extra={"event": "forgot_password", "email": payload.email})
    auth_service = AuthService(db)
    await auth_service.forgot_password(email=payload.email)
    logger.info("forgot password otp dispatched", extra={"event": "forgot_password_success", "email": payload.email})
    return MessageResponse(message="If the account exists, a reset OTP has been sent.")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    logger.info("password reset requested", extra={"event": "reset_password", "email": payload.email})
    auth_service = AuthService(db)
    await auth_service.reset_password(
        email=payload.email,
        otp_code=payload.otp_code,
        new_password=payload.new_password,
    )
    logger.info("password reset successful", extra={"event": "reset_password_success", "email": payload.email})
    return MessageResponse(message="Password reset successfully.")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    logger.info("profile fetched", extra={"event": "get_profile", "user_id": str(current_user.id)})
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_me(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    logger.info(
        "profile update requested",
        extra={"event": "update_profile", "user_id": str(current_user.id)},
    )
    auth_service = AuthService(db)
    user = await auth_service.update_profile(user=current_user, full_name=payload.full_name)
    logger.info(
        "profile updated",
        extra={"event": "update_profile_success", "user_id": str(user.id)},
    )
    return UserResponse.model_validate(user)


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    logger.info(
        "password change requested",
        extra={"event": "change_password", "user_id": str(current_user.id)},
    )
    auth_service = AuthService(db)
    await auth_service.change_password(
        user=current_user,
        current_password=payload.current_password,
        new_password=payload.new_password,
    )
    logger.info(
        "password changed",
        extra={"event": "change_password_success", "user_id": str(current_user.id)},
    )
    return MessageResponse(message="Password updated successfully.")


@router.get("/introspect", response_model=IntrospectResponse)
async def introspect(
    response: Response,
    current_user: User = Depends(get_current_user),
) -> IntrospectResponse:
    logger.info(
        "token introspection",
        extra={"event": "introspect", "user_id": str(current_user.id), "role": current_user.role.value},
    )
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
