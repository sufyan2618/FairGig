from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from services.authService.app.models.user import OrderStatus


class CartItemCreate(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(default=1, ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1)


class CartItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    user_email: str | None = None
    product_id: int
    product_title: str
    product_slug: str
    unit_price: int
    quantity: int
    image_url: str | None = None
    created_at: datetime
    updated_at: datetime


class CartResponse(BaseModel):
    items: list[CartItemResponse]
    total_amount: int


class OrderCreate(BaseModel):
    notes: str | None = None


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int
    product_id: int
    product_title: str
    product_slug: str
    unit_price: int
    quantity: int
    image_url: str | None = None
    created_at: datetime


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    user_email: str | None = None
    status: OrderStatus
    total_amount: int
    items: list[OrderItemResponse]
    created_at: datetime
    updated_at: datetime


class OrderListResponse(BaseModel):
    orders: list[OrderResponse]


class MessageResponse(BaseModel):
    success: bool
    message: str
