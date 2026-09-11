"""FARM-MIND Action Abstraction Layer.

Defines typed actions for the Farmer and Market, providing safe validation
and serialization into the official Kaggriculture JSON format.
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import List, Any, Dict, Optional, Union


class FarmerActionType(str, Enum):
    PASS = "PASS"
    NORTH = "NORTH"
    SOUTH = "SOUTH"
    EAST = "EAST"
    WEST = "WEST"
    WATER = "WATER"
    HARVEST = "HARVEST"
    PLANT = "PLANT"
    CLEAR = "CLEAR"
    DROP = "DROP"


class MarketActionType(str, Enum):
    BUY_SEED = "BUY_SEED"
    SELL = "SELL"
    EXPAND = "EXPAND"
    HIRE_HAND = "HIRE_HAND"
    FIRE_HAND = "FIRE_HAND"
    BUY_STRUCTURE = "BUY_STRUCTURE"


@dataclass
class ActionPlan:
    """Complete turn action plan for a player in Kaggriculture."""
    farmer: List[Any] = field(default_factory=lambda: ["PASS"])
    hands: List[List[Any]] = field(default_factory=list)
    market: List[List[Any]] = field(default_factory=list)

    @classmethod
    def make_pass(cls) -> "ActionPlan":
        """Create a default PASS action."""
        return cls(farmer=["PASS"], hands=[], market=[])

    @classmethod
    def make_move(cls, direction: str) -> "ActionPlan":
        """Create a move action (NORTH, SOUTH, EAST, WEST)."""
        clean_dir = direction.upper()
        if clean_dir not in ("NORTH", "SOUTH", "EAST", "WEST"):
            clean_dir = "PASS"
        return cls(farmer=[clean_dir], hands=[], market=[])

    @classmethod
    def make_plant(cls, crop: str) -> "ActionPlan":
        """Create a PLANT crop action."""
        return cls(farmer=["PLANT", crop.upper()], hands=[], market=[])

    @classmethod
    def make_water(cls) -> "ActionPlan":
        """Create a WATER action."""
        return cls(farmer=["WATER"], hands=[], market=[])

    @classmethod
    def make_harvest(cls) -> "ActionPlan":
        """Create a HARVEST action."""
        return cls(farmer=["HARVEST"], hands=[], market=[])

    @classmethod
    def make_drop(cls) -> "ActionPlan":
        """Create a DROP action to store carried goods into the central shed."""
        return cls(farmer=["DROP"], hands=[], market=[])

    def add_market_action(self, action_type: str, item_or_target: str, count: int = 1) -> None:
        """Append a market order (BUY_SEED, SELL, etc.)."""
        if count > 0:
            self.market.append([action_type.upper(), item_or_target.upper(), int(count)])

    def to_dict(self) -> Dict[str, Any]:
        """Serialize into the exact dictionary schema expected by Kaggriculture."""
        return {
            "farmer": list(self.farmer),
            "hands": [list(h) for h in self.hands],
            "market": [list(m) for m in self.market]
        }
