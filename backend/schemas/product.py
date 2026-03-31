from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProductOut(BaseModel):
    id: str
    type: str
    sku: Optional[str] = None
    name: str
    description: Optional[str] = None
    price: float
    active: bool
    map_code: Optional[str] = None
    scale: Optional[str] = None
    region: Optional[str] = None
    region_tag: Optional[str] = None
    file_label: Optional[str] = None
    badge: Optional[str] = None
    updated_year: Optional[str] = None
    stock_quantity: Optional[int] = None
    has_file_url: bool = False  # true if file_url is set (don't expose the URL publicly)
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    id: str
    type: str
    sku: Optional[str] = None
    name: str
    description: Optional[str] = None
    price: float
    active: bool = True
    map_code: Optional[str] = None
    scale: Optional[str] = None
    region: Optional[str] = None
    region_tag: Optional[str] = None
    file_url: Optional[str] = None
    file_label: Optional[str] = None
    badge: Optional[str] = None
    updated_year: Optional[str] = None
    stock_quantity: Optional[int] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    active: Optional[bool] = None
    file_url: Optional[str] = None
    file_label: Optional[str] = None
    badge: Optional[str] = None
    updated_year: Optional[str] = None
    stock_quantity: Optional[int] = None
    stripe_price_id: Optional[str] = None
