import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.dependencies import CurrentUser, get_current_user
from app.models.order import CartItem, Order, OrderItem
from app.schemas.order import (
	CartItemCreate,
	CartItemUpdate,
	CartResponse,
	MessageResponse,
	OrderCreate,
	OrderListResponse,
	OrderResponse,
)

router = APIRouter()


async def fetch_product(product_id: int) -> dict:
	url = f"{settings.PRODUCT_SERVICE_URL}/products/{product_id}"
	async with httpx.AsyncClient(timeout=10.0) as client:
		response = await client.get(url)

	if response.status_code == status.HTTP_404_NOT_FOUND:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

	if response.status_code >= 400:
		raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Unable to verify product")

	payload = response.json()
	product = payload.get("data")
	if not product:
		raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Invalid product response")

	return product


async def build_cart_response(db: AsyncSession, user_id: str) -> CartResponse:
	result = await db.execute(
		select(CartItem)
		.where(CartItem.user_id == user_id)
		.order_by(CartItem.created_at.desc())
	)
	items = result.scalars().all()
	total_amount = sum(item.unit_price * item.quantity for item in items)
	return CartResponse(items=items, total_amount=total_amount)


@router.get("/cart", response_model=CartResponse)
async def get_cart(
	current_user: CurrentUser = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
) -> CartResponse:
	return await build_cart_response(db, current_user.user_id)


@router.post("/cart/items", response_model=CartResponse, status_code=status.HTTP_201_CREATED)
async def add_to_cart(
	payload: CartItemCreate,
	current_user: CurrentUser = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
) -> CartResponse:
	product = await fetch_product(payload.product_id)

	available_quantity = int(product.get("quantity", 0))
	if payload.quantity > available_quantity:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Requested quantity exceeds available stock",
		)

	existing_result = await db.execute(
		select(CartItem).where(
			CartItem.user_id == current_user.user_id,
			CartItem.product_id == payload.product_id,
		)
	)
	existing_item = existing_result.scalar_one_or_none()

	if existing_item:
		new_quantity = existing_item.quantity + payload.quantity
		if new_quantity > available_quantity:
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail="Total quantity in cart exceeds available stock",
			)
		existing_item.quantity = new_quantity
		existing_item.unit_price = int(product.get("price", existing_item.unit_price))
		existing_item.product_title = str(product.get("title", existing_item.product_title))
		existing_item.product_slug = str(product.get("slug", existing_item.product_slug))
		existing_item.image_url = product.get("imageUrl")
	else:
		db.add(
			CartItem(
				user_id=current_user.user_id,
				user_email=current_user.email,
				product_id=payload.product_id,
				product_title=str(product.get("title")),
				product_slug=str(product.get("slug")),
				unit_price=int(product.get("price", 0)),
				quantity=payload.quantity,
				image_url=product.get("imageUrl"),
			)
		)

	await db.commit()
	return await build_cart_response(db, current_user.user_id)


@router.patch("/cart/items/{product_id}", response_model=CartResponse)
async def update_cart_item_quantity(
	product_id: int,
	payload: CartItemUpdate,
	current_user: CurrentUser = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
) -> CartResponse:
	product = await fetch_product(product_id)
	available_quantity = int(product.get("quantity", 0))

	if payload.quantity > available_quantity:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Requested quantity exceeds available stock",
		)

	result = await db.execute(
		select(CartItem).where(
			CartItem.user_id == current_user.user_id,
			CartItem.product_id == product_id,
		)
	)
	item = result.scalar_one_or_none()
	if not item:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

	item.quantity = payload.quantity
	item.unit_price = int(product.get("price", item.unit_price))
	item.product_title = str(product.get("title", item.product_title))
	item.product_slug = str(product.get("slug", item.product_slug))
	item.image_url = product.get("imageUrl")

	await db.commit()
	return await build_cart_response(db, current_user.user_id)


@router.delete("/cart/items/{product_id}", response_model=CartResponse)
async def remove_cart_item(
	product_id: int,
	current_user: CurrentUser = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
) -> CartResponse:
	result = await db.execute(
		select(CartItem).where(
			CartItem.user_id == current_user.user_id,
			CartItem.product_id == product_id,
		)
	)
	item = result.scalar_one_or_none()
	if not item:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

	await db.delete(item)
	await db.commit()

	return await build_cart_response(db, current_user.user_id)


@router.delete("/cart", response_model=MessageResponse)
async def clear_cart(
	current_user: CurrentUser = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
) -> MessageResponse:
	await db.execute(delete(CartItem).where(CartItem.user_id == current_user.user_id))
	await db.commit()
	return MessageResponse(success=True, message="Cart cleared")


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def place_order(
	_payload: OrderCreate,
	current_user: CurrentUser = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
) -> OrderResponse:
	cart_result = await db.execute(select(CartItem).where(CartItem.user_id == current_user.user_id))
	cart_items = cart_result.scalars().all()

	if not cart_items:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

	total_amount = 0
	for item in cart_items:
		product = await fetch_product(item.product_id)
		available_quantity = int(product.get("quantity", 0))
		if item.quantity > available_quantity:
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail=f"Insufficient stock for product id {item.product_id}",
			)
		item.unit_price = int(product.get("price", item.unit_price))
		item.product_title = str(product.get("title", item.product_title))
		item.product_slug = str(product.get("slug", item.product_slug))
		item.image_url = product.get("imageUrl")
		total_amount += item.unit_price * item.quantity

	order = Order(
		user_id=current_user.user_id,
		user_email=current_user.email,
		total_amount=total_amount,
	)
	db.add(order)
	await db.flush()

	for item in cart_items:
		db.add(
			OrderItem(
				order_id=order.id,
				product_id=item.product_id,
				product_title=item.product_title,
				product_slug=item.product_slug,
				unit_price=item.unit_price,
				quantity=item.quantity,
				image_url=item.image_url,
			)
		)

	await db.execute(delete(CartItem).where(CartItem.user_id == current_user.user_id))
	await db.commit()

	order_result = await db.execute(
		select(Order)
		.where(Order.id == order.id, Order.user_id == current_user.user_id)
		.options(selectinload(Order.items))
	)
	created_order = order_result.scalar_one()
	return created_order


@router.get("/orders/me", response_model=OrderListResponse)
async def get_my_orders(
	current_user: CurrentUser = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
) -> OrderListResponse:
	result = await db.execute(
		select(Order)
		.where(Order.user_id == current_user.user_id)
		.options(selectinload(Order.items))
		.order_by(Order.created_at.desc())
	)
	orders = result.scalars().all()
	return OrderListResponse(orders=orders)


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order_by_id(
	order_id: int,
	current_user: CurrentUser = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
) -> OrderResponse:
	result = await db.execute(
		select(Order)
		.where(Order.id == order_id, Order.user_id == current_user.user_id)
		.options(selectinload(Order.items))
	)
	order = result.scalar_one_or_none()
	if not order:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

	return order
