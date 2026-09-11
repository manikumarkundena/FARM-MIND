"""FARM-MIND V1 Dynamic Economic Evaluation Engine.

Provides transparent scoring for crop selection, land allocation, and labor valuation.
Replaces fixed scripts with real-time lifecycle ROI calculations.
"""
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Any

from agent.config import CROP_DATA, TOTAL_DAYS, TURNS_PER_DAY


@dataclass
class CropScore:
    """Quantitative economic score for a candidate crop."""
    crop_name: str
    seed_cost: float
    maturity_days: int
    expected_yield: int
    current_market_price: float
    expected_revenue: float
    net_profit: float
    profit_per_day: float
    labor_actions_per_cycle: int
    is_viable_for_season: bool
    reason: str


class EconomicEngine:
    """Evaluates crop portfolio opportunities dynamically from game state."""

    def __init__(self):
        self.crop_specs = CROP_DATA

    def score_crop(
        self,
        crop_name: str,
        current_day: int,
        market_prices: Dict[str, float],
        available_cash: float
    ) -> CropScore:
        """Evaluate a specific crop given current simulation state."""
        info = self.crop_specs.get(crop_name)
        if not info:
            return CropScore(
                crop_name=crop_name, seed_cost=999, maturity_days=99,
                expected_yield=0, current_market_price=0, expected_revenue=0,
                net_profit=-999, profit_per_day=-999, labor_actions_per_cycle=99,
                is_viable_for_season=False, reason="Unknown crop"
            )

        seed_cost = float(info["seed"])
        days_left = max(0, TOTAL_DAYS - current_day)
        market_price = float(market_prices.get(crop_name, 20.0))
        ongoing = info.get("ongoing", False)

        if available_cash < seed_cost:
            return CropScore(
                crop_name=crop_name, seed_cost=seed_cost, maturity_days=info["max_yield_day"],
                expected_yield=0, current_market_price=market_price, expected_revenue=0,
                net_profit=-seed_cost, profit_per_day=-seed_cost, labor_actions_per_cycle=0,
                is_viable_for_season=False, reason="Insufficient funds"
            )

        if not ongoing:
            maturity = info["max_yield_day"]
            if days_left < maturity:
                return CropScore(
                    crop_name=crop_name, seed_cost=seed_cost, maturity_days=maturity,
                    expected_yield=0, current_market_price=market_price, expected_revenue=0,
                    net_profit=-seed_cost, profit_per_day=-seed_cost, labor_actions_per_cycle=0,
                    is_viable_for_season=False,
                    reason=f"Insufficient season time ({days_left}d left < {maturity}d maturity)"
                )

            expected_yield = info["max_yield"]
            expected_rev = expected_yield * market_price
            net_profit = expected_rev - seed_cost
            profit_per_day = net_profit / maturity
            labor_actions = maturity + 2  # daily waters + plant + harvest

            return CropScore(
                crop_name=crop_name,
                seed_cost=seed_cost,
                maturity_days=maturity,
                expected_yield=expected_yield,
                current_market_price=market_price,
                expected_revenue=expected_rev,
                net_profit=net_profit,
                profit_per_day=round(profit_per_day, 2),
                labor_actions_per_cycle=labor_actions,
                is_viable_for_season=True,
                reason=f"Viable non-ongoing. Est profit ${net_profit:.0f} over {maturity}d (${profit_per_day:.1f}/d)"
            )
        else:
            # Ongoing crop (TOMATO, STRAWBERRY)
            first_yield = info["first_yield_day"]
            interval = info["interval"]
            max_yield = info["max_yield"]

            if days_left < first_yield:
                return CropScore(
                    crop_name=crop_name, seed_cost=seed_cost, maturity_days=first_yield,
                    expected_yield=0, current_market_price=market_price, expected_revenue=0,
                    net_profit=-seed_cost, profit_per_day=-seed_cost, labor_actions_per_cycle=0,
                    is_viable_for_season=False,
                    reason=f"Insufficient season time for first yield ({days_left}d left < {first_yield}d)"
                )

            # Calculate how many harvest intervals fit in remaining days
            days_after_first = days_left - first_yield
            num_yields = min(max_yield, 1 + (days_after_first // interval))
            expected_rev = num_yields * market_price
            net_profit = expected_rev - seed_cost
            active_days = first_yield + (num_yields - 1) * interval
            profit_per_day = net_profit / max(1, active_days)
            labor_actions = active_days + 1 + num_yields

            return CropScore(
                crop_name=crop_name,
                seed_cost=seed_cost,
                maturity_days=first_yield,
                expected_yield=num_yields,
                current_market_price=market_price,
                expected_revenue=expected_rev,
                net_profit=net_profit,
                profit_per_day=round(profit_per_day, 2),
                labor_actions_per_cycle=labor_actions,
                is_viable_for_season=True,
                reason=f"Ongoing crop. {num_yields} yields est ${net_profit:.0f} (${profit_per_day:.1f}/d)"
            )

    def rank_crops(
        self,
        current_day: int,
        market_prices: Dict[str, float],
        available_cash: float
    ) -> List[CropScore]:
        """Rank all candidate crops by expected profit per day."""
        candidates = ["MELON", "CARROT", "WHEAT", "TOMATO", "STRAWBERRY"]
        scores = [
            self.score_crop(c, current_day, market_prices, available_cash)
            for c in candidates
        ]
        # Filter viable and sort descending by profit_per_day
        scores.sort(key=lambda s: (s.is_viable_for_season, s.profit_per_day), reverse=True)
        return scores

    def best_crop(
        self,
        current_day: int,
        market_prices: Dict[str, float],
        available_cash: float
    ) -> Optional[CropScore]:
        """Return the highest ranked viable crop for planting right now."""
        ranked = self.rank_crops(current_day, market_prices, available_cash)
        if ranked and ranked[0].is_viable_for_season and ranked[0].net_profit > 0:
            return ranked[0]
        return None
