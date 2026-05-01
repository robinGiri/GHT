import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ght_shop.db")

# SQLite needs check_same_thread=False; Postgres needs no extra args
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables. Uses Alembic if available, falls back to metadata.create_all."""
    from backend.models import product, order  # noqa: F401 — register models
    try:
        from alembic.config import Config
        from alembic import command
        alembic_cfg = Config(str(Path(__file__).resolve().parent.parent / "alembic.ini"))
        command.upgrade(alembic_cfg, "head")
    except Exception:
        Base.metadata.create_all(bind=engine)
