import numpy as np
from app.models.schemas import TrackSegment, InSARDataPoint, VisionEvidence
from app.core.insar_engine import InSAREngine
from app.core.vision_engine import VisionEngine
from app.core.degradation_model import DegradationModel

def generate_rhine_valley_corridor() -> list[TrackSegment]:
    """
    Generates high-density georeferenced dataset for Rhine Valley Line (KM 38.000 to 52.000).
    Features ground truth anomaly centered at KM 42.700.
    """
    segments = []

    # Corridor bounds: Rhine Valley Boppard to St. Goar
    base_lat = 50.2310
    base_lon = 7.5840

    # 50-meter step intervals over 14 kilometers (280 segments)
    chainages = np.arange(38.000, 52.000, 0.050)

    for idx, km in enumerate(chainages):
        km_rounded = float(round(km, 3))
        seg_id = f"RHN-SEC-{int(km_rounded*1000):06d}"

        # Spatial coordinate step along rail heading (~155 degrees azimuth)
        delta = (km_rounded - 38.0) * 0.009
        lat = float(round(base_lat - delta * 0.9, 6))
        lon = float(round(base_lon + delta * 0.4, 6))

        # Check proximity to primary anomaly KM 42.700 (and secondary at 48.200)
        dist_to_primary = abs(km_rounded - 42.700)
        dist_to_secondary = abs(km_rounded - 48.200)

        if dist_to_primary < 0.250:
            # Critical mud-pumping and subsidence anomaly
            intensity = np.exp(- (dist_to_primary ** 2) / 0.015)
            v_vert = -14.2 * intensity - 1.2
            v_los = v_vert * 0.798
            coherence = 0.84
            fdr = 0.44 * intensity + 0.04
            wdr = 0.31 * intensity + 0.02
        elif dist_to_secondary < 0.150:
            # Secondary warning zone
            intensity = np.exp(- (dist_to_secondary ** 2) / 0.008)
            v_vert = -7.5 * intensity - 0.8
            v_los = v_vert * 0.798
            coherence = 0.76
            fdr = 0.22 * intensity + 0.03
            wdr = 0.16 * intensity + 0.01
        else:
            # Stable baseline subgrade
            v_vert = float(np.random.normal(-1.1, 0.4))
            v_los = v_vert * 0.798
            coherence = float(round(np.random.uniform(0.70, 0.92), 2))
            fdr = float(round(np.random.uniform(0.01, 0.05), 3))
            wdr = float(round(np.random.uniform(0.00, 0.04), 3))

        v_vert_final = float(round(v_vert, 2))
        v_los_final = float(round(v_los, 2))

        # Generate 24-month Sentinel-1 displacement series
        timestamps, displacement = InSAREngine.generate_historical_series(v_vert_final, periods=24)
        latest_cum_disp = displacement[-1]

        # Vision metrics
        vision_dict = VisionEngine.evaluate_frame_metrics(fdr, wdr)
        vision_obj = VisionEvidence(
            frame_id=f"FRAME-CAM1-{int(km_rounded*1000)}",
            chainage_km=km_rounded,
            fouled_ballast_ratio=vision_dict["fouled_ballast_ratio"],
            standing_water_ratio=vision_dict["standing_water_ratio"],
            miou_score=vision_dict["miou_score"],
            anomaly_detected=vision_dict["anomaly_detected"],
            detected_classes=vision_dict["detected_classes"]
        )

        insar_obj = InSARDataPoint(
            scatterer_id=f"PS-S1-EU-{int(lat*1000)}_{int(lon*1000)}",
            latitude=lat,
            longitude=lon,
            chainage_km=km_rounded,
            v_los_mm_year=v_los_final,
            v_vert_mm_year=v_vert_final,
            coherence=coherence,
            historical_displacement_mm=displacement,
            timestamps=timestamps
        )

        # Cross-modal Failure Index
        sfi = DegradationModel.compute_subgrade_failure_index(
            v_vert_final,
            vision_obj.fouled_ballast_ratio,
            vision_obj.standing_water_ratio
        )

        # Remaining days to speed restriction
        days_to_tsr, _ = DegradationModel.calculate_time_to_tsr(
            latest_cum_disp,
            v_vert_final,
            vision_obj.fouled_ballast_ratio,
            excess_precipitation_mm=0.0
        )

        # Determine risk level and action
        if sfi >= 7.0:
            risk = "CRITICAL"
            action = "Emergency Trackbed Undercutting & Culvert Clearing Required"
        elif sfi >= 4.0:
            risk = "WARNING"
            action = "Scheduled Tamping & Ditch Inspection within 30 Days"
        else:
            risk = "NORMAL"
            action = "Nominal Monitoring (Next Routine Inspection: 180 Days)"

        segment = TrackSegment(
            segment_id=seg_id,
            corridor_name="Rhine Valley Mainline (DB Netz Route 3710)",
            chainage_km=km_rounded,
            start_km=km_rounded,
            end_km=float(round(km_rounded + 0.050, 3)),
            latitude=lat,
            longitude=lon,
            insar_point=insar_obj,
            vision_evidence=vision_obj,
            sfi_score=sfi,
            risk_level=risk,
            time_to_tsr_days=days_to_tsr,
            recommended_action=action
        )
        segments.append(segment)

    return segments

# Singleton in-memory corridor dataset
RHINE_CORRIDOR_DATA = generate_rhine_valley_corridor()
