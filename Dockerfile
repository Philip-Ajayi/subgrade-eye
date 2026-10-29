# -----------------------------------------------------------
# STAGE 1: Build the React / Vite Frontend
# -----------------------------------------------------------
    FROM node:20-alpine AS frontend-builder
    WORKDIR /frontend
    
    # Build argument for API URL if custom backend URL is desired
    ARG VITE_API_URL
    ENV VITE_API_URL=${VITE_API_URL}
    
    # Cache dependencies
    COPY frontend/package*.json frontend/.npmrc* ./
    RUN npm install --legacy-peer-deps
    
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
    CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]