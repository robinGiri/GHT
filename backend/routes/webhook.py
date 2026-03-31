import os
import smtplib
import stripe
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.order import Order, OrderItem
from backend.models.product import Product

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)

router = APIRouter()


def send_email(to: str, subject: str, html: str):
    if not SMTP_USER or not SMTP_PASS:
        print(f"[EMAIL - not sent, SMTP not configured] To: {to} | Subject: {subject}")
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = FROM_EMAIL
        msg["To"] = to
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(FROM_EMAIL, to, msg.as_string())
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")


def build_digital_email(customer_name: str, items_with_urls: list) -> str:
    rows = ""
    for item_name, url in items_with_urls:
        if url:
            rows += f'<li><strong>{item_name}</strong> — <a href="{url}">Download map</a></li>'
        else:
            rows += f'<li><strong>{item_name}</strong> — Your map link will be sent separately by the GHT team.</li>'

    return f"""
    <html><body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1A3A3A;">
    <h1 style="color: #2D5F52;">Your GHT Map Downloads</h1>
    <p>Hi {customer_name or "there"},</p>
    <p>Thank you for your purchase! Here are your download links:</p>
    <ul>{rows}</ul>
    <p>Links are for personal use only. Please do not share or redistribute the files.</p>
    <hr/>
    <p style="color: #666; font-size: 12px;">Great Himalaya Trail Nepal — <a href="https://greathimalayatrail.com">greathimalayatrail.com</a></p>
    </body></html>
    """


def build_physical_email(customer_name: str, order_ref: str) -> str:
    return f"""
    <html><body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1A3A3A;">
    <h1 style="color: #2D5F52;">Book Order Confirmed</h1>
    <p>Hi {customer_name or "there"},</p>
    <p>Thank you! Your copy of <em>Nepal Trekking and the Great Himalaya Trail, 3rd Edition</em> has been ordered.</p>
    <p>We'll pack and ship it to the address you provided and send you a shipping notification.</p>
    <p style="color: #666; font-size: 12px;">Order reference: {order_ref}</p>
    <hr/>
    <p style="color: #666; font-size: 12px;">Great Himalaya Trail Nepal — <a href="https://greathimalayatrail.com">greathimalayatrail.com</a></p>
    </body></html>
    """


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    if WEBHOOK_SECRET:
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET)
        except stripe.errors.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
    else:
        # Allow unsigned events in development if no secret is configured
        import json
        event = json.loads(payload)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        session_id = session["id"]

        order = db.query(Order).filter(Order.stripe_session_id == session_id).first()
        if not order:
            return {"status": "order not found"}

        # Update order status and shipping address
        order.status = "paid"
        order.fulfilled_at = datetime.utcnow()
        if session.get("shipping_details"):
            order.shipping_address = session["shipping_details"]

        db.commit()

        customer_name = order.customer_name or session.get("metadata", {}).get("customer_name", "")
        customer_email = order.customer_email

        # Gather digital items and their file URLs
        digital_items = []
        has_physical = False
        for item in order.items:
            if item.product_type == "digital_map":
                product = db.query(Product).filter(Product.id == item.product_id).first()
                file_url = product.file_url if product else None
                digital_items.append((item.product_name, file_url))
            elif item.product_type == "physical_book":
                has_physical = True
                # Decrement stock
                product = db.query(Product).filter(Product.id == item.product_id).first()
                if product and product.stock_quantity is not None:
                    product.stock_quantity = max(0, product.stock_quantity - item.quantity)
                db.commit()

        if digital_items:
            html = build_digital_email(customer_name, digital_items)
            send_email(customer_email, "Your GHT Map Downloads", html)

        if has_physical:
            html = build_physical_email(customer_name, session_id)
            send_email(customer_email, "GHT Book Order Confirmed", html)
            # Notify admin
            if FROM_EMAIL:
                admin_html = f"<p>New book order from {customer_email}. Session: {session_id}</p>"
                send_email(FROM_EMAIL, f"[GHT Shop] Book Order — {customer_email}", admin_html)

    return {"status": "ok"}
