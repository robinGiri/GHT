"""Secure download endpoint for purchased digital maps.

Issues time-limited download tokens tied to a paid order.
"""
import os
import hmac
import hashlib
import time
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.order import Order, OrderItem
from backend import BUNDLE_MAP_IDS

router = APIRouter()

# Secret for signing download tokens (falls back to a default for dev)
_DOWNLOAD_SECRET = os.getenv("DOWNLOAD_SECRET", "ght-download-secret-dev-only")
# Tokens valid for 24 hours
_TOKEN_TTL = 86400

MAPS_DIR = Path(__file__).resolve().parent.parent.parent / "public" / "maps"


def _sign_token(order_id: int, product_id: str, expires: int) -> str:
    """Create HMAC-SHA256 token for a download link."""
    msg = f"{order_id}:{product_id}:{expires}"
    return hmac.new(_DOWNLOAD_SECRET.encode(), msg.encode(), hashlib.sha256).hexdigest()


def generate_download_url(order_id: int, product_id: str) -> str:
    """Build a signed download URL for a product in an order."""
    expires = int(time.time()) + _TOKEN_TTL
    token = _sign_token(order_id, product_id, expires)
    return f"/api/download/{order_id}/{product_id}?expires={expires}&token={token}"


@router.get("/download/{order_id}/{product_id}")
def download_file(
    order_id: int,
    product_id: str,
    expires: int = 0,
    token: str = "",
    db: Session = Depends(get_db),
):
    # Verify token
    expected = _sign_token(order_id, product_id, expires)
    if not hmac.compare_digest(token, expected):
        raise HTTPException(status_code=403, detail="Invalid download token")

    # Check expiry
    if time.time() > expires:
        raise HTTPException(status_code=403, detail="Download link has expired")

    # Verify order exists and is paid (generic error to prevent enumeration)
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order or order.status not in ("paid", "fulfilled", "shipped"):
        raise HTTPException(status_code=403, detail="Access denied")

    # Verify product was part of this order (direct or via bundle)
    item = (
        db.query(OrderItem)
        .filter(OrderItem.order_id == order_id, OrderItem.product_id == product_id)
        .first()
    )
    if not item:
        # Check if this map is covered by a bundle purchase
        bundle_item = (
            db.query(OrderItem)
            .filter(OrderItem.order_id == order_id, OrderItem.product_id == "BUNDLE-ALL")
            .first()
        )
        bundle_maps = set(BUNDLE_MAP_IDS)
        if not bundle_item or product_id not in bundle_maps:
            raise HTTPException(status_code=403, detail="Access denied")

    # Resolve file path and guard against path traversal
    file_path = (MAPS_DIR / f"{product_id}.pdf").resolve()
    if not file_path.is_relative_to(MAPS_DIR.resolve()):  # pragma: no cover - defensive
        raise HTTPException(status_code=403, detail="Access denied")
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not available yet")

    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=f"GHT-{product_id}-map.pdf",
    )
