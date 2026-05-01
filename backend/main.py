import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

load_dotenv(Path(__file__).resolve().parent / ".env")

from backend.database import create_tables
from backend.routes import products, checkout, webhook, admin, chat, download
from backend.seed import seed_products
from backend.limiter import limiter

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    seed_products()
    yield


app = FastAPI(title="GHT Shop API", version="1.0.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — restrict methods to what we actually use
allowed_origins = list({FRONTEND_URL, "http://localhost:5173", "http://localhost:5174"})
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Admin-Key", "Stripe-Signature"],
)

app.include_router(products.router, prefix="/api")
app.include_router(checkout.router, prefix="/api")
app.include_router(webhook.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(download.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}


# Serve built frontend in production (when static/ directory exists)
_static_dir = Path(__file__).resolve().parent.parent / "static"
if _static_dir.is_dir():
    app.mount("/", StaticFiles(directory=str(_static_dir), html=True), name="static")
