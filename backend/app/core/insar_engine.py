import numpy as np
from typing import List, Tuple

class InSAREngine:
    """
    Simulates and processes Sentinel-1 / European Ground Motion Service (EGMS)
    Persistent Scatterer (PS) interferometric geodetic vectors.
    """
    @staticmethod
    def project_los_to_vertical(v_los: float, incidence_angle_deg: float = 37.0) -> float:
        """
        Converts Line-Of-Sight (LOS) velocity to true vertical displacement velocity:
        v_vert = v_los / cos(incidence_angle)
        """
        rad = np.radians(incidence_angle_deg)
        return float(round(v_los / np.cos(rad), 2))

    @staticmethod
    def generate_historical_series(
        v_vert_annual: float,
        periods: int = 24,
        noise_std: float = 0.4
    ) -> Tuple[List[str], List[float]]:
        """
        Generates realistic 24-month Sentinel-1 displacement time series (12-day revisit cadence).
        """
        monthly_velocity = v_vert_annual / 12.0
        timestamps = []
        displacement = []
        current_disp = 0.0

        for m in range(periods):
            # Format as YYYY-MM
            year = 2024 + (m // 12)
            month = (m % 12) + 1
            timestamps.append(f"{year}-{month:02d}-15")

            # Non-linear seasonal settlement trend
            seasonal = 0.6 * np.sin(2 * np.pi * m / 12.0)
            step = monthly_velocity + seasonal + np.random.normal(0, noise_std * 0.2)
            current_disp += step
            displacement.append(float(round(current_disp, 2)))

        return timestamps, displacement
