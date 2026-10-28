import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException
from app.models.schemas import WorkOrderRequest, WorkOrderResponse, IBMWorkOrderPayload, SAPWorkOrderPayload
from app.data.seed_data import RHINE_CORRIDOR_DATA

router = APIRouter(prefix="/workorder", tags=["Enterprise Dispatch"])

@router.post("/generate", response_model=WorkOrderResponse)
async def generate_preventive_work_order(req: WorkOrderRequest):
    """
    Synthesizes and exports a production-grade maintenance work order
    formatted directly for IBM Maximo and SAP Plant Maintenance (PM).
    """
    segment = min(RHINE_CORRIDOR_DATA, key=lambda s: abs(s.chainage_km - req.chainage_km))

    order_id = f"WO-SUBEYE-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{int(req.chainage_km*10):04d}"
    now_utc = datetime.now(timezone.utc)
    target_start = (now_utc + timedelta(days=3)).strftime("%Y-%m-%dT08:00:00Z")
    target_finish = (now_utc + timedelta(days=5)).strftime("%Y-%m-%dT17:00:00Z")

    start_m = int(segment.chainage_km * 1000) - 75
    end_m = int(segment.chainage_km * 1000) + 75
    chainage_window = f"KM {start_m/1000.0:.3f} to KM {end_m/1000.0:.3f}"

    diagnosis = (
        f"Active subgrade subsidence ({segment.insar_point.v_vert_mm_year} mm/yr) "
        f"compounded by severe ballast mud-pumping ({int(segment.vision_evidence.fouled_ballast_ratio*100)}% fouling) "
        f"and blocked shoulder drainage ({int(segment.vision_evidence.standing_water_ratio*100)}% water ponding)."
    )

    remediation = (
        "High-output ballast undercutting (depth: 350mm), geosynthetic geotextile membrane installation, "
        "laser-guided track tamping with dynamic stabilization, and high-pressure culvert ditch jetting."
    )

    # IBM Maximo Work Order payload (REST API / Integration Framework standard)
    ibm_payload = IBMWorkOrderPayload(
        wonum=order_id,
        description=f"SUBGRADE-EYE: Preventative Trackbed Stabilization - {chainage_window}",
        assetnum=f"TRK-LINE-3710-KM{int(segment.chainage_km)}",
        siteid="DB_NETZ_CENTRAL",
        worktype="PREV",
        status="WAPPR",
        failurecode="SUBGRADE_PUMP",
        schedstart=target_start,
        schedfinish=target_finish,
        estdur=32.0,
        glaccount="6410-RAIL-GEO-MAINT",
        custom_fields={
            "subgrade_failure_index": segment.sfi_score,
            "insar_v_vert_mm_yr": segment.insar_point.v_vert_mm_year,
            "insar_coherence": segment.insar_point.coherence,
            "fouled_ballast_ratio": segment.vision_evidence.fouled_ballast_ratio,
            "standing_water_ratio": segment.vision_evidence.standing_water_ratio,
            "days_to_slow_order": segment.time_to_tsr_days,
            "human_notes": req.inspector_notes
        }
    )

    # SAP Plant Maintenance (PM) payload (BAPI_ALM_ORDER_MAINTAIN standard)
    sap_payload = SAPWorkOrderPayload(
        order_type="PM02",
        order_id=order_id,
        short_text=f"Subgrade Remediation {chainage_window}",
        funct_loc=f"DE-DB-NETZ-RV-{int(segment.chainage_km)}",
        priority="1",
        plant="1040",
        planner_group="GEO",
        operations=[
            {
                "activity": "0010",
                "control_key": "PM01",
                "description": "Ballast undercutting & silt removal",
                "duration_normal": 16.0,
                "work_center": "TRACK_HEAVY"
            },
            {
                "activity": "0020",
                "control_key": "PM01",
                "description": "Geotextile placement & fresh ballast tamping",
                "duration_normal": 10.0,
                "work_center": "TAMP_CREW"
            },
            {
                "activity": "0030",
                "control_key": "PM01",
                "description": "Flushing culverts & shoulder ditch profiling",
                "duration_normal": 6.0,
                "work_center": "DRAIN_JET"
            }
        ]
    )

    return WorkOrderResponse(
        work_order_id=order_id,
        created_at=now_utc.isoformat(),
        status="PENDING_SUPERINTENDENT_APPROVAL",
        chainage_window=chainage_window,
        segment_id=segment.segment_id,
        sfi_score=segment.sfi_score,
        diagnosis=diagnosis,
        recommended_remediation=remediation,
        ibm_maximo_payload=ibm_payload,
        sap_pm_payload=sap_payload
    )
