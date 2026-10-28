import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config import settings
from app.api import corridor, simulation, workorder

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Cross-Modal Satellite InSAR Geodesy & Cab-Vision Subgrade Forensics Engine"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(corridor.router, prefix="/api/v1")
app.include_router(simulation.router, prefix="/api/v1")
app.include_router(workorder.router, prefix="/api/v1")

@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }

# -------------------------------------------------------------------------
# Static File & Single Page Application (SPA) Serving for Production
# -------------------------------------------------------------------------
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")

if os.path.exists(static_dir):
    # Mount Vite static assets (JS, CSS, SVGs)
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # Catch-all route to serve index.html for React Router / SPA fallback
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        target_path = os.path.join(static_dir, full_path)
        if full_path and os.path.isfile(target_path):
            return FileResponse(target_path)
        return FileResponse(os.path.join(static_dir, "index.html"))
