# ── Stage 1: Build frontend ──────────────────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

# ── Stage 2: Python backend ─────────────────────────────────────────────────
FROM python:3.10-slim AS backend
WORKDIR /app

# System deps for psycopg2 and general use
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend ./backend
COPY alembic.ini ./alembic.ini

# Copy built frontend into static serving directory
COPY --from=frontend-build /app/dist ./static
COPY public/maps ./public/maps

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

EXPOSE 8000

# Run migrations then start server
CMD ["sh", "-c", "alembic upgrade head && uvicorn backend.main:app --host 0.0.0.0 --port 8000"]
