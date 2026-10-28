# -----------------------------------------------------------
# STAGE 1: Build the React / Vite Frontend
# -----------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend

# Cache dependencies
COPY frontend/package*.json ./
RUN npm install

# Build static bundle to /frontend/dist
COPY frontend/ ./
RUN npm run build

# -----------------------------------------------------------
# STAGE 2: Python / FastAPI Backend & Static Asset Host
# -----------------------------------------------------------
FROM python:3.11-slim
WORKDIR /app

# Install lightweight dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install backend Python packages
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy FastAPI backend code
COPY backend/ ./

# Copy compiled React static bundle into /app/static
COPY --from=frontend-builder /frontend/dist ./static

# Configure production environment
ENV HOST=0.0.0.0
ENV ENVIRONMENT=production

# Render assigns a dynamic port via the $PORT environment variable.
# We use sh -c to ensure $PORT is evaluated at startup.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
