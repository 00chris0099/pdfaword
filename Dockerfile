# ============================================
# Stage 1: Build Next.js frontend (static)
# ============================================
FROM node:22-alpine AS frontend-builder

WORKDIR /build/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .

# Static export for nginx — API calls use relative paths (/api/*)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=
RUN npm run build

# ============================================
# Stage 2: Python backend
# ============================================
FROM python:3.12-slim AS backend-builder

WORKDIR /build/backend

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

COPY backend/ .

# ============================================
# Stage 3: Final image — nginx + uvicorn
# ============================================
FROM python:3.12-slim

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    supervisor \
    libgl1 \
    libglib2.0-0t64 \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy Python deps from builder
COPY --from=backend-builder /install /usr/local

# Copy backend app
COPY --from=backend-builder /build/backend /app/backend

# Copy frontend static build
COPY --from=frontend-builder /build/frontend/out /app/frontend

# Copy configs
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create data dirs
RUN mkdir -p /app/backend/data/uploads /app/backend/data/outputs /var/log/supervisor

# Remove default nginx config that conflicts
RUN rm -f /etc/nginx/sites-enabled/default

EXPOSE 80

CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
