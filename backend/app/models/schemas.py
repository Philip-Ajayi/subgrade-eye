from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class InSARDataPoint(BaseModel):
    scatterer_id: str
    latitude: float
    longitude: float
    chainage_km: float
    v_los_mm_year: float
    v_vert_mm_year: float
    coherence: float
    historical_displacement_mm: List[float]
    timestamps: List[str]

class VisionEvidence(BaseModel):
    frame_id: str
    chainage_km: float
    fouled_ballast_ratio: float = Field(..., ge=0.0, le=1.0)
    standing_water_ratio: float = Field(..., ge=0.0, le=1.0)
    miou_score: float = Field(..., ge=0.0, le=1.0)
    anomaly_detected: bool
    detected_classes: List[str]

class TrackSegment(BaseModel):
    segment_id: str
    corridor_name: str
    chainage_km: float
    start_km: float
    end_km: float
    latitude: float
    longitude: float
    insar_point: InSARDataPoint
    vision_evidence: VisionEvidence
    sfi_score: float = Field(..., ge=0.0, le=10.0)
    risk_level: str  # NORMAL, WARNING, CRITICAL
    time_to_tsr_days: int
    recommended_action: str

class CorridorSummary(BaseModel):
    corridor_id: str
    corridor_name: str
    total_length_km: float
    start_km: float
    end_km: float
    total_segments: int
    critical_segments_count: int
    warning_segments_count: int
    normal_segments_count: int
    segments: List[TrackSegment]

class SimulationRequest(BaseModel):
    chainage_km: float
    excess_precipitation_mm: float = Field(..., ge=0.0, le=200.0)
    days_forecast: int = Field(default=90, ge=7, le=365)

class SimulationResponse(BaseModel):
    chainage_km: float
    excess_precipitation_mm: float
    baseline_sfi: float
    projected_sfi: float
    baseline_time_to_tsr_days: int
    projected_time_to_tsr_days: int
    settlement_acceleration_factor: float
    degradation_timeline_days: List[int]
    cumulative_settlement_projected_mm: List[float]
    critical_threshold_mm: float

class WorkOrderRequest(BaseModel):
    segment_id: str
    chainage_km: float
    inspector_notes: Optional[str] = "Automated cross-modal detection confirmed by maintenance superintendence."
    priority: Optional[str] = "HIGH"

class IBMWorkOrderPayload(BaseModel):
    wonum: str
    description: str
    assetnum: str
    siteid: str
    worktype: str
    status: str
    failurecode: str
    schedstart: str
    schedfinish: str
    estdur: float
    glaccount: str
    custom_fields: Dict[str, Any]

class SAPWorkOrderPayload(BaseModel):
    order_type: str
    order_id: str
    short_text: str
    funct_loc: str
    priority: str
    plant: str
    planner_group: str
    operations: List[Dict[str, Any]]

class WorkOrderResponse(BaseModel):
    work_order_id: str
    created_at: str
    status: str
    chainage_window: str
    segment_id: str
    sfi_score: float
    diagnosis: str
    recommended_remediation: str
    ibm_maximo_payload: IBMWorkOrderPayload
    sap_pm_payload: SAPWorkOrderPayload
