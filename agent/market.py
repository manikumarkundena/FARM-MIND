"""FARM-MIND Empirical Market Intelligence Engine.

Tracks real-time price movements, price statistics, and computes
price-aware liquidation decisions to avoid selling into depressed troughs.
"""
from typing import Dict, List, Tuple


class MarketTracker:
    """Tracks observed price history and assesses selling opportunities."""

    def __init__(self, window_size: int = 48):
        self.window_size = window_size
        self.price_history: Dict[str, List[float]] = {}

    def update_prices(self, prices: Dict[str, float]) -> None:
        """Record current tick's market prices into rolling historical buffers."""
        for crop, price in prices.items():
            if crop not in self.price_history:
                self.price_history[crop] = []
            self.price_history[crop].append(float(price))
            if len(self.price_history[crop]) > self.window_size:
                self.price_history[crop].pop(0)

    def get_moving_average(self, crop: str) -> float:
        """Compute rolling average price for a crop."""
        history = self.price_history.get(crop, [])
        if not history:
            return 20.0
        return sum(history) / len(history)

    def evaluate_sell_decision(
        self,
        crop: str,
        current_price: float,
        shed_quantity: int,
        days_remaining: int
    ) -> Tuple[bool, str]:
        """Determine if liquidating current shed stock is economically justified."""
        # Rule 1: Final 2 days of season: absolute liquidation required for terminal score
        if days_remaining <= 2:
            return True, f"Season-end clearance ({days_remaining}d left) at ${current_price:.0f}"

        # Rule 2: Shed near capacity (>= 80 / 100): must sell to avoid deposit drops
        if shed_quantity >= 80:
            return True, f"Shed capacity safeguard ({shed_quantity}/100 units) at ${current_price:.0f}"

        # Rule 3: Check moving average
        m_avg = self.get_moving_average(crop)

        # Severe price trough check: if price is heavily below baseline and shed is healthy, hold
        if current_price < 20.0 and m_avg > 25.0 and shed_quantity < 30 and days_remaining > 5:
            return False, f"Holding: Depressed price ${current_price:.0f} vs avg ${m_avg:.1f}"

        # Favorable or average price
        if current_price >= m_avg:
            return True, f"Favorable price ${current_price:.0f} >= avg ${m_avg:.1f}"

        # Acceptable baseline price
        return True, f"Standard market liquidation at ${current_price:.0f}"
