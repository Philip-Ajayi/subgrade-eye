from fastapi import APIRouter, HTTPException
from app.models.schemas import SimulationRequest, SimulationResponse
from app.core.degradation_model import DegradationModel
from app.data.seed_data import RHINE_CORRIDOR_DATA

router = APIRouter(prefix="/simulation", tags=["Degradation Simulation"])

@router.post("/forecast", response_model=SimulationResponse)
async def run_precipitation_scenario(req: SimulationRequest):
    """
    Simulates excess seasonal precipitation on the chosen chainage,
    re-computing the accelerated settlement slope and remaining days to slow order.
    """
    segment = min(RHINE_CORRIDOR_DATA, key=lambda s: abs(s.chainage_km - req.chainage_km))

    current_cum_disp = segment.insar_point.historical_displacement_mm[-1]
    v_vert = segment.insar_point.v_vert_mm_year
    fdr = segment.vision_evidence.fouled_ballast_ratio

    # Baseline calculations
    base_days, _ = DegradationModel.calculate_time_to_tsr(
        current_cum_disp, v_vert, fdr, excess_precipitation_mm=0.0
    )

    # Projected rainfall scenario calculations
    proj_days, accel = DegradationModel.calculate_time_to_tsr(
        current_cum_disp, v_vert, fdr, excess_precipitation_mm=req.excess_precipitation_mm
    )

    # Dynamic SFI elevation under rain saturation
    sfi_rain_increase = min(3.5, (req.excess_precipitation_mm / 60.0) * (1.2 + 2.0 * fdr))
    proj_sfi = min(10.0, round(segment.sfi_score + sfi_rain_increase, 2))

    timeline_days, cum_trajectory = DegradationModel.simulate_projection(
        current_cum_disp, v_vert, fdr, req.excess_precipitation_mm, days_forecast=req.days_forecast
    )

    return SimulationResponse(
        chainage_km=segment.chainage_km,
        excess_precipitation_mm=req.excess_precipitation_mm,
        baseline_sfi=segment.sfi_score,
        projected_sfi=proj_sfi,
        baseline_time_to_tsr_days=base_days,
        projected_time_to_tsr_days=proj_days,
        settlement_acceleration_factor=accel,
        degradation_timeline_days=timeline_days,
        cumulative_settlement_projected_mm=cum_trajectory,
        critical_threshold_mm=DegradationModel.CRITICAL_SETTLEMENT_MM
    )
