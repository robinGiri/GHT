from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.database import get_db
from backend.models.product import Product
from backend.schemas.product import ProductOut

router = APIRouter()


def product_to_out(p: Product) -> ProductOut:
    return ProductOut(
        id=p.id,
        type=p.type,
        sku=p.sku,
        name=p.name,
        description=p.description,
        price=p.price,
        active=p.active,
        map_code=p.map_code,
        scale=p.scale,
        region=p.region,
        region_tag=p.region_tag,
        file_label=p.file_label,
        badge=p.badge,
        updated_year=p.updated_year,
        stock_quantity=p.stock_quantity,
        has_file_url=bool(p.file_url),
        created_at=p.created_at,
    )


@router.get("/products", response_model=List[ProductOut])
def list_products(
    type: Optional[str] = Query(None, description="Filter by type: digital_map, physical_book, donation"),
    db: Session = Depends(get_db),
):
    q = db.query(Product).filter(Product.active == True)  # noqa: E712
    if type:
        q = q.filter(Product.type == type)
    return [product_to_out(p) for p in q.order_by(Product.map_code.asc().nulls_last(), Product.name.asc()).all()]


@router.get("/products/{product_id}", response_model=ProductOut)
def get_product(product_id: str, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id, Product.active == True).first()  # noqa: E712
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_to_out(p)
