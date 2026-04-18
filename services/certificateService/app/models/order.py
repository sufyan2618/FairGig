import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class OrderStatus(str, enum.Enum):
	PENDING = "pending"
	CONFIRMED = "confirmed"
	CANCELLED = "cancelled"


class CartItem(Base):
	__tablename__ = "cart_items"
	__table_args__ = (UniqueConstraint("user_id", "product_id", name="uq_cart_user_product"),)

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	user_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
	user_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
	product_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
	product_title: Mapped[str] = mapped_column(String(255), nullable=False)
	product_slug: Mapped[str] = mapped_column(String(255), nullable=False)
	unit_price: Mapped[int] = mapped_column(Integer, nullable=False)
	quantity: Mapped[int] = mapped_column(Integer, nullable=False)
	image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
	updated_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True),
		server_default=func.now(),
		onupdate=func.now(),
		nullable=False,
	)


class Order(Base):
	__tablename__ = "orders"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	user_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
	user_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
	status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus, name="order_status"), default=OrderStatus.PENDING, nullable=False)
	total_amount: Mapped[int] = mapped_column(Integer, nullable=False)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
	updated_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True),
		server_default=func.now(),
		onupdate=func.now(),
		nullable=False,
	)

	items: Mapped[list["OrderItem"]] = relationship(
		"OrderItem",
		back_populates="order",
		cascade="all, delete-orphan",
		lazy="selectin",
	)


class OrderItem(Base):
	__tablename__ = "order_items"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True, nullable=False)
	product_id: Mapped[int] = mapped_column(Integer, nullable=False)
	product_title: Mapped[str] = mapped_column(String(255), nullable=False)
	product_slug: Mapped[str] = mapped_column(String(255), nullable=False)
	unit_price: Mapped[int] = mapped_column(Integer, nullable=False)
	quantity: Mapped[int] = mapped_column(Integer, nullable=False)
	image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

	order: Mapped[Order] = relationship("Order", back_populates="items")
