from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt
from fastapi import HTTPException, status
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.rate_limiter import enforce_rate_limit
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    generate_numeric_otp,
    hash_otp,
    hash_password,
    hash_refresh_token,
    verify_otp_hash,
    verify_password,
)
from app.models.otp_code import OtpCode, OtpPurpose
from app.models.refresh_token import RefreshToken
from app.models.user import User, UserRole
from app.schemas.auth import TokenResponse
from app.services.email_service import BrevoEmailService


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.email_service = BrevoEmailService()

    async def register_user(self, *, full_name: str, email: str, password: str, role: UserRole) -> User:
        normalized_email = email.lower().strip()
        existing_user = await self._get_user_by_email(normalized_email)

        if existing_user and existing_user.is_email_verified:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )

        password_hash = hash_password(password)

        if existing_user:
            existing_user.full_name = full_name
            existing_user.password_hash = password_hash
            existing_user.role = role
            existing_user.is_active = True
            user = existing_user
        else:
            user = User(
                email=normalized_email,
                full_name=full_name,
                password_hash=password_hash,
                role=role,
            )
            self.db.add(user)
            await self.db.flush()

        await self._send_user_otp(user=user, purpose=OtpPurpose.EMAIL_VERIFICATION)
        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def verify_email_otp(self, *, email: str, otp_code: str) -> None:
        user = await self._get_user_by_email_or_400(email)
        if user.is_email_verified:
            return

        otp_record = await self._get_latest_active_otp(user_id=user.id, purpose=OtpPurpose.EMAIL_VERIFICATION)
        await self._validate_and_consume_otp(user=user, otp_code=otp_code, otp_record=otp_record)

        user.is_email_verified = True
        await self.db.commit()

    async def resend_email_otp(self, *, email: str) -> None:
        user = await self._get_user_by_email_or_400(email)
        if user.is_email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already verified.",
            )

        await self._send_user_otp(user=user, purpose=OtpPurpose.EMAIL_VERIFICATION)
        await self.db.commit()

    async def login(self, *, email: str, password: str, ip_address: str) -> tuple[TokenResponse, User]:
        await enforce_rate_limit(
            key=f"rate_limit:auth:login:ip:{ip_address}",
            limit=settings.LOGIN_RATE_LIMIT_MAX_REQUESTS,
            window_seconds=settings.LOGIN_RATE_LIMIT_WINDOW_SECONDS,
        )
        await enforce_rate_limit(
            key=f"rate_limit:auth:login:email:{email}",
            limit=settings.LOGIN_RATE_LIMIT_MAX_REQUESTS,
            window_seconds=settings.LOGIN_RATE_LIMIT_WINDOW_SECONDS,
        )

        user = await self._get_user_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is disabled.",
            )

        if not user.is_email_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email is not verified.",
            )

        token_response = await self._issue_tokens(user)
        user.last_login_at = datetime.now(UTC)
        await self.db.commit()

        return token_response, user

    async def refresh_tokens(self, *, refresh_token: str) -> tuple[TokenResponse, User]:
        try:
            payload = decode_refresh_token(refresh_token)
        except jwt.ExpiredSignatureError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired.",
            ) from exc
        except jwt.InvalidTokenError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            ) from exc

        token_type = payload.get("type")
        user_id = payload.get("sub")
        jti = payload.get("jti")

        if token_type != "refresh" or not user_id or not jti:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            )

        try:
            parsed_user_id = UUID(str(user_id))
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            ) from exc

        token_hash = hash_refresh_token(refresh_token)
        token_result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.jti == str(jti),
                RefreshToken.user_id == parsed_user_id,
            )
        )
        refresh_record = token_result.scalar_one_or_none()

        now = datetime.now(UTC)
        if (
            not refresh_record
            or refresh_record.revoked_at is not None
            or refresh_record.token_hash != token_hash
            or refresh_record.expires_at <= now
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token is invalid or revoked.",
            )

        user_result = await self.db.execute(select(User).where(User.id == parsed_user_id, User.is_active.is_(True)))
        user = user_result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User is not active.",
            )

        refresh_record.revoked_at = now
        token_response = await self._issue_tokens(user)
        await self.db.commit()

        return token_response, user

    async def logout(self, *, refresh_token: str) -> None:
        try:
            payload = decode_refresh_token(refresh_token)
        except jwt.InvalidTokenError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            ) from exc

        jti = payload.get("jti")
        user_id = payload.get("sub")

        if not jti or not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            )

        try:
            parsed_user_id = UUID(str(user_id))
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            ) from exc

        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.jti == str(jti),
                RefreshToken.user_id == parsed_user_id,
                RefreshToken.revoked_at.is_(None),
            )
        )
        refresh_record = result.scalar_one_or_none()
        if refresh_record:
            refresh_record.revoked_at = datetime.now(UTC)
            await self.db.commit()

    async def forgot_password(self, *, email: str) -> None:
        user = await self._get_user_by_email(email)
        if not user or not user.is_active or not user.is_email_verified:
            return

        await self._send_user_otp(user=user, purpose=OtpPurpose.PASSWORD_RESET)
        await self.db.commit()

    async def reset_password(self, *, email: str, otp_code: str, new_password: str) -> None:
        user = await self._get_user_by_email_or_400(email)
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is disabled.",
            )

        otp_record = await self._get_latest_active_otp(user_id=user.id, purpose=OtpPurpose.PASSWORD_RESET)
        await self._validate_and_consume_otp(user=user, otp_code=otp_code, otp_record=otp_record)

        user.password_hash = hash_password(new_password)
        await self.db.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=datetime.now(UTC))
        )
        await self.db.commit()

    async def _issue_tokens(self, user: User) -> TokenResponse:
        access_token, _access_expires_at, _access_jti = create_access_token(
            user_id=str(user.id),
            role=user.role.value,
        )
        refresh_token, refresh_expires_at, refresh_jti = create_refresh_token(
            user_id=str(user.id),
            role=user.role.value,
        )

        self.db.add(
            RefreshToken(
                user_id=user.id,
                jti=refresh_jti,
                token_hash=hash_refresh_token(refresh_token),
                expires_at=refresh_expires_at,
            )
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def _send_user_otp(self, *, user: User, purpose: OtpPurpose) -> None:
        await enforce_rate_limit(
            key=f"rate_limit:auth:email:{purpose.value}:{user.email}",
            limit=settings.EMAIL_SEND_RATE_LIMIT_MAX_REQUESTS,
            window_seconds=settings.EMAIL_SEND_RATE_LIMIT_WINDOW_SECONDS,
        )

        await self.db.execute(
            delete(OtpCode).where(
                OtpCode.user_id == user.id,
                OtpCode.purpose == purpose,
                OtpCode.consumed_at.is_(None),
            )
        )

        otp_code = generate_numeric_otp(settings.OTP_LENGTH)
        expires_at = datetime.now(UTC) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

        self.db.add(
            OtpCode(
                user_id=user.id,
                purpose=purpose,
                code_hash=hash_otp(str(user.id), otp_code),
                expires_at=expires_at,
            )
        )

        await self.email_service.send_otp_email(
            recipient_email=user.email,
            recipient_name=user.full_name,
            otp_code=otp_code,
            purpose=purpose,
        )

    async def _validate_and_consume_otp(self, *, user: User, otp_code: str, otp_record: OtpCode | None) -> None:
        if not otp_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP code is invalid or expired.",
            )

        now = datetime.now(UTC)
        if otp_record.expires_at <= now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP code has expired.",
            )

        if otp_record.attempts >= settings.OTP_VERIFY_MAX_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many invalid OTP attempts. Request a new OTP.",
            )

        if not verify_otp_hash(user_id=str(user.id), otp_code=otp_code, expected_hash=otp_record.code_hash):
            otp_record.attempts += 1
            await self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP code is invalid or expired.",
            )

        otp_record.consumed_at = now

    async def _get_user_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email.lower().strip()))
        return result.scalar_one_or_none()

    async def _get_user_by_email_or_400(self, email: str) -> User:
        user = await self._get_user_by_email(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid request.",
            )
        return user

    async def _get_latest_active_otp(self, *, user_id: UUID, purpose: OtpPurpose) -> OtpCode | None:
        result = await self.db.execute(
            select(OtpCode)
            .where(
                OtpCode.user_id == user_id,
                OtpCode.purpose == purpose,
                OtpCode.consumed_at.is_(None),
            )
            .order_by(OtpCode.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()
