#!/usr/bin/env bash
set -e

echo "=== [SubGrade-Eye] Production Environment Setup ==="

# Check requirements
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required but not installed. Aborting." >&2; exit 1; }

echo "Building and launching SubGrade-Eye containers..."
docker compose down -v --remove-orphans || true
docker compose build --no-cache
docker compose up -d

echo ""
echo "=== SubGrade-Eye deployed successfully! ==="
echo "Web Operations Console: http://localhost:3000"
echo "FastAPI Documentation:  http://localhost:8000/docs"
echo "Healthcheck Endpoint:   http://localhost:8000/api/v1/health"
