"""FARM-MIND V2 demand-aware economic engine.

V2 hypothesis:
Use the current market state plus observed town demand to prefer crops whose
future sales are more resilient, rather than ranking only by current price.

This remains a transparent heuristic; it is not a predictive model.
"""

from typing import Dict, Optional

from agent.economy import EconomicEngine, CropScore


class DemandAwareEconomicEngine(EconomicEngine):
    SHOP_DEMAND = {
        "BAKERY": {"WHEAT"},
        "PIZZA_SHOP": {"WHEAT", "TOMATO"},
        "BRUNCH_SPOT": {"WHEAT", "STRAWBERRY"},
        "YARN_STORE": set(),
        "ICE_CREAM_SHOP": {"WHEAT", "STRAWBERRY"},
        "PET_CAFE": {"CARROT"},
        "SMOOTHIE_SHOP": {"STRAWBERRY"},
        "FARMERS_MARKET": {"WHEAT", "CARROT", "TOMATO", "STRAWBERRY"},
    }

    def __init__(self):
        super().__init__()
        self.market_inventory: Dict[str, float] = {}
        self.unlocked_shops = []

    def set_context(self, state) -> None:
        self.market_inventory = dict(state.market_inventory)
        self.unlocked_shops = list(state.town_unlocked_shops)

    def _demand_instances(self, crop: str) -> int:
        # Every crop has town-center demand; shop demand is additional.
        return 1 + sum(
            1
            for shop in self.unlocked_shops
            if crop in self.SHOP_DEMAND.get(shop, set())
        )

    def _resilience_multiplier(self, crop: str, current_price: float) -> float:
        base = float(self.crop_specs[crop].get("base_price", 0))
        # The official environment exposes market inventory around I0=10,000.
        # Use a bounded signal so this adjustment cannot dominate economics.
        inventory = float(self.market_inventory.get(crop, 10000.0))
        scarcity = max(-1.0, min(1.0, (10000.0 - inventory) / 1000.0))

        demand = self._demand_instances(crop)
        demand_signal = min(4, demand) * 0.025
        scarcity_signal = scarcity * 0.025

        # Current price remains the primary signal; demand only nudges ranking.
        return 1.0 + demand_signal + scarcity_signal

    def rank_crops(self, current_day, market_prices, available_cash):
        base_scores = [
            self.score_crop(c, current_day, market_prices, available_cash)
            for c in ["MELON", "CARROT", "WHEAT", "TOMATO", "STRAWBERRY"]
        ]

        adjusted = []
        for score in base_scores:
            if not score.is_viable_for_season:
                adjusted.append((score, score.profit_per_day))
                continue

            multiplier = self._resilience_multiplier(
                score.crop_name,
                score.current_market_price,
            )
            adjusted.append((score, score.profit_per_day * multiplier))

        adjusted.sort(
            key=lambda item: (item[0].is_viable_for_season, item[1]),
            reverse=True,
        )

        return [score for score, _ in adjusted]

    def best_crop(
        self,
        current_day: int,
        market_prices: Dict[str, float],
        available_cash: float,
    ) -> Optional[CropScore]:
        ranked = self.rank_crops(current_day, market_prices, available_cash)
        if ranked and ranked[0].is_viable_for_season and ranked[0].net_profit > 0:
            return ranked[0]
        return None
