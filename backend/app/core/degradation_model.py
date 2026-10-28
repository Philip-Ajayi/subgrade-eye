import numpy as np
from typing import Tuple, List

class DegradationModel:
    """
    Coupled Cross-Modal Geotechnical Degradation Engine:
    Integrates InSAR vertical settlement, cab-vision ballast fouling, and excess precipitation.
    """
    CRITICAL_SETTLEMENT_MM = 25.0  # Slow Order threshold

    @classmethod
    def compute_subgrade_failure_index(
        cls,
        v_vert_mm_year: float,
        fdr: float,
        wdr: float
    ) -> float:
        """
        Calculates normalized Subgrade Failure Index (SFI) [0 to 10.0].
        Weights:
        - InSAR vertical rate (45%)
        - Fouled Ballast Mud Pumping (35%)
        - Drainage ditch water accumulation (20%)
        """
        # Geodetic component: 0 mm/yr -> 0, -15 mm/yr -> 10
        geodetic_subscore = np.clip((abs(min(0.0, v_vert_mm_year)) / 15.0) * 10.0, 0.0, 10.0)

        # Optical component: FDR of 0.5 -> 10.0
        ballast_subscore = np.clip((fdr / 0.50) * 10.0, 0.0, 10.0)

        # Drainage component: WDR of 0.35 -> 10.0
        water_subscore = np.clip((wdr / 0.35) * 10.0, 0.0, 10.0)

        sfi = (0.45 * geodetic_subscore) + (0.35 * ballast_subscore) + (0.20 * water_subscore)
        return float(round(np.clip(sfi, 0.0, 10.0), 2))

    @classmethod
    def calculate_time_to_tsr(
        cls,
        current_cumulative_settlement_mm: float,
        v_vert_mm_year: float,
        fdr: float,
        excess_precipitation_mm: float = 0.0
    ) -> Tuple[int, float]:
        """
        Computes remaining days until mandatory Temporary Speed Restriction (TSR).
        """
        baseline_rate_daily = abs(min(-0.1, v_vert_mm_year)) / 365.25

        # Water saturation acceleration factor
        # Higher FDR means higher susceptibility to pore pressure spikes
        alpha = 1.8  # Precipitation sensitivity coefficient
        beta = 2.4   # Mud slurry saturation coefficient

        rain_factor = 1.0 + (alpha * (excess_precipitation_mm / 100.0) * (1.0 + beta * fdr))
        effective_daily_settlement = baseline_rate_daily * rain_factor

        remaining_margin_mm = max(0.5, cls.CRITICAL_SETTLEMENT_MM - abs(current_cumulative_settlement_mm))
        days = int(np.floor(remaining_margin_mm / effective_daily_settlement))

        return max(1, days), float(round(rain_factor, 2))

    @classmethod
    def simulate_projection(
        cls,
        current_settlement_mm: float,
        v_vert_mm_year: float,
        fdr: float,
        excess_precipitation_mm: float,
        days_forecast: int = 90
    ) -> Tuple[List[int], List[float]]:
        """
        Generates forward-looking daily settlement trajectory under rain scenario.
        """
        _, acceleration = cls.calculate_time_to_tsr(current_settlement_mm, v_vert_mm_year, fdr, excess_precipitation_mm)
        daily_rate = (abs(min(-0.1, v_vert_mm_year)) / 365.25) * acceleration

        days = list(range(0, days_forecast + 1, 5))
        trajectory = []

        curr = abs(current_settlement_mm)
        for d in days:
            trajectory.append(float(round(curr + (d * daily_rate), 2)))

        return days, trajectory
