from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class LineItemIn(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int
    type: str


class CheckoutSessionCreate(BaseModel):
    line_items: List[LineItemIn]
    customer_name: str
    customer_email: str
    has_physical: bool = False


class CheckoutSessionOut(BaseModel):
    url: str


class OrderItemOut(BaseModel):
    product_id: str
    product_name: str
    product_type: str
    quantity: int
    price_at_purchase: float

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: int
    stripe_session_id: str
    customer_email: str
    customer_name: Optional[str] = None
    shipping_address: Optional[Any] = None
    status: str
    total_amount: float
    has_digital: int
    has_physical: int
    created_at: datetime
    fulfilled_at: Optional[datetime] = None
    items: List[OrderItemOut] = []

    model_config = {"from_attributes": True}


class OrderStatusUpdate(BaseModel):
    status: str
