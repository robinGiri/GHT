"""Shared rate limiter — disabled in test/mock mode."""
import os
from slowapi import Limiter
from slowapi.util import get_remote_address

STRIPE_MOCK = os.getenv("STRIPE_MOCK", "false").lower() in ("true", "1", "yes")

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["60/minute"],
    enabled=not STRIPE_MOCK,
)
