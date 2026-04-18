from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserRole(str, enum.Enum):
	WORKER = "worker"
	VERIFIER = "verifier"
	ADVOCATE = "advocate"


class User(Base):
	__tablename__ = "users"

	id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
	email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
	full_name: Mapped[str] = mapped_column(String(120), nullable=False)
	password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
	role: Mapped[UserRole] = mapped_column(
		Enum(UserRole, name="user_role", native_enum=True),
		nullable=False,
		default=UserRole.WORKER,
	)
	is_email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
	is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
	last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
	updated_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True),
		server_default=func.now(),
		onupdate=func.now(),
		nullable=False,
	)

	otp_codes = relationship("OtpCode", back_populates="user", cascade="all, delete-orphan")
	refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
