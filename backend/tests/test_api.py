import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_corridor_summary():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/corridor/summary")
        assert res.status_code == 200
        data = res.json()
        assert data["corridor_id"] == "CORR-RHINE-VALLEY-01"
        assert len(data["segments"]) > 0
        assert data["critical_segments_count"] >= 1

@pytest.mark.asyncio
async def test_simulation_forecast():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "chainage_km": 42.700,
            "excess_precipitation_mm": 50.0,
            "days_forecast": 60
        }
        res = await client.post("/api/v1/simulation/forecast", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["projected_time_to_tsr_days"] < data["baseline_time_to_tsr_days"]
        assert data["projected_sfi"] >= data["baseline_sfi"]

@pytest.mark.asyncio
async def test_workorder_generation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "segment_id": "RHN-SEC-042700",
            "chainage_km": 42.700,
            "inspector_notes": "Ground verification scheduled"
        }
        res = await client.post("/api/v1/workorder/generate", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "WO-SUBEYE" in data["work_order_id"]
        assert data["ibm_maximo_payload"]["wonum"] == data["work_order_id"]
        assert len(data["sap_pm_payload"]["operations"]) == 3
