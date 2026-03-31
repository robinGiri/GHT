from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from backend.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True)          # e.g. "NP103", "BOOK-001"
    type = Column(String, nullable=False)           # digital_map | physical_book | donation
    sku = Column(String, nullable=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    stripe_price_id = Column(String, nullable=True)
    active = Column(Boolean, default=True)
    map_code = Column(String, nullable=True)        # NP101 etc.
    scale = Column(String, nullable=True)
    region = Column(String, nullable=True)
    region_tag = Column(String, nullable=True)
    file_url = Column(Text, nullable=True)          # admin sets secure download URL
    file_label = Column(String, nullable=True)
    badge = Column(String, nullable=True)
    updated_year = Column(String, nullable=True)
    stock_quantity = Column(Integer, nullable=True)  # None = unlimited (digital)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
