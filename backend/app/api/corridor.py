from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.schemas import CorridorSummary, TrackSegment
from app.data.seed_data import RHINE_CORRIDOR_DATA

router = APIRouter(prefix="/corridor", tags=["Corridor"])

@router.get("/summary", response_model=CorridorSummary)
async def get_corridor_summary():
    """Returns high-level corridor overview and all georeferenced segments."""
    critical = sum(1 for s in RHINE_CORRIDOR_DATA if s.risk_level == "CRITICAL")
    warning = sum(1 for s in RHINE_CORRIDOR_DATA if s.risk_level == "WARNING")
    normal = sum(1 for s in RHINE_CORRIDOR_DATA if s.risk_level == "NORMAL")

    return CorridorSummary(
        corridor_id="CORR-RHINE-VALLEY-01",
        corridor_name="Rhine Valley Mainline (DB Netz Route 3710)",
        total_length_km=14.0,
        start_km=38.000,
        end_km=52.000,
        total_segments=len(RHINE_CORRIDOR_DATA),
        critical_segments_count=critical,
        warning_segments_count=warning,
        normal_segments_count=normal,
        segments=RHINE_CORRIDOR_DATA
    )

@router.get("/segment/{chainage_km}", response_model=TrackSegment)
async def get_segment_by_chainage(chainage_km: float):
    """Snaps to the closest 50-meter segment for an exact chainage."""
    closest = min(RHINE_CORRIDOR_DATA, key=lambda s: abs(s.chainage_km - chainage_km))
    if abs(closest.chainage_km - chainage_km) > 0.100:
        raise HTTPException(status_code=404, detail="Track segment outside monitored corridor")
    return closest

@router.get("/anomalies", response_model=List[TrackSegment])
async def get_anomalies(min_sfi: float = Query(4.0, ge=0.0, le=10.0)):
    """Returns all track segments with SFI score above threshold."""
    return [s for s in RHINE_CORRIDOR_DATA if s.sfi_score >= min_sfi]
