"""FARM-MIND State Abstraction Layer.

Parses raw Kaggriculture environment observations into typed, validated,
and queryable game state representations.
"""
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Tuple

from agent.config import BOARD_SIZE, CROP_DATA, SHED_ACCESS_TILES, TURNS_PER_DAY


@dataclass
class TileState:
    """Structured representation of a single grid tile on the farm."""
    x: int
    y: int
    raw: Any
    is_locked: bool = False
    is_empty: bool = False
    is_weed: bool = False
    is_plant: bool = False
    is_structure: bool = False
    crop: Optional[str] = None
    planted_day: int = -1
    yield_units: int = 0
    watered_today: bool = False
    consecutive_unwatered: int = 0
    fertilized_until_day: int = -1

    @classmethod
    def from_raw(cls, x: int, y: int, raw_value: Any, current_day: int = 0) -> "TileState":
        if raw_value == "LOCKED":
            return cls(x=x, y=y, raw=raw_value, is_locked=True)
        if raw_value is None:
            return cls(x=x, y=y, raw=raw_value, is_empty=True)
        if isinstance(raw_value, dict):
            kind = raw_value.get("kind", "")
            if kind == "WEED":
                return cls(x=x, y=y, raw=raw_value, is_weed=True)
            if kind == "PLANT":
                crop = raw_value.get("crop")
                planted_day = raw_value.get("planted_day", 0)
                yield_units = raw_value.get("yield_units", 0)
                watered = raw_value.get("watered_today", False)
                unwatered = raw_value.get("consecutive_unwatered", 0)
                fert = raw_value.get("fertilized_until_day", -1)
                return cls(
                    x=x,
                    y=y,
                    raw=raw_value,
                    is_plant=True,
                    crop=crop,
                    planted_day=planted_day,
                    yield_units=yield_units,
                    watered_today=watered,
                    consecutive_unwatered=unwatered,
                    fertilized_until_day=fert
                )
            if kind in ("COOP", "PASTURE"):
                return cls(x=x, y=y, raw=raw_value, is_structure=True)
        return cls(x=x, y=y, raw=raw_value, is_empty=True)

    def is_mature(self, current_day: int) -> bool:
        """Determines if this crop has reached its harvestable window."""
        if not self.is_plant or not self.crop:
            return False
        cd = CROP_DATA.get(self.crop)
        if not cd:
            return False
        age = current_day - self.planted_day
        if cd["ongoing"]:
            return self.yield_units > 0
        # For non-ongoing crops, harvest when plant reaches max_yield_day
        return age >= cd["max_yield_day"]


@dataclass
class GameState:
    """Complete parsed observation for FARM-MIND decision making."""
    day: int = 0
    hour: int = 0
    step: int = 0
    player_id: int = 0
    money: float = 3000.0
    farmer_pos: Tuple[int, int] = (4, 4)
    hands_pos: List[Tuple[int, int]] = field(default_factory=list)
    unlocked_quadrants: List[str] = field(default_factory=lambda: ["NW"])
    tiles: List[List[TileState]] = field(default_factory=list)
    shed: Dict[str, int] = field(default_factory=dict)
    carried_inventory: Dict[str, int] = field(default_factory=dict)
    seeds: Dict[str, int] = field(default_factory=dict)
    market_prices: Dict[str, int] = field(default_factory=dict)
    market_inventory: Dict[str, int] = field(default_factory=dict)
    town_unlocked_shops: List[str] = field(default_factory=list)
    # Opponent public state
    opponent_money: float = 3000.0
    opponent_farmer_pos: Tuple[int, int] = (4, 4)
    opponent_unlocked_quadrants: List[str] = field(default_factory=list)

    @classmethod
    def from_observation(cls, obs: Dict[str, Any]) -> "GameState":
        """Parse the official raw observation dictionary safely."""
        day = int(obs.get("day", 0))
        hour = int(obs.get("hour", 0))
        step = int(obs.get("step", day * TURNS_PER_DAY + hour))
        player_id = int(obs.get("player", 0))

        farms = obs.get("farms", [])
        my_farm = farms[player_id] if farms and player_id < len(farms) else {}
        opp_id = 1 - player_id
        opp_farm = farms[opp_id] if farms and opp_id < len(farms) else {}

        money = float(my_farm.get("money", 3000.0))
        raw_farmer = my_farm.get("farmer", [4, 4])
        farmer_pos = (int(raw_farmer[0]), int(raw_farmer[1]))

        raw_hands = my_farm.get("hands", [])
        hands_pos = [(int(h[0]), int(h[1])) for h in raw_hands]

        unlocked_quads = list(my_farm.get("unlocked_quadrants", ["NW"]))

        # Parse 10x10 tiles grid
        raw_tiles = my_farm.get("tiles", [])
        tiles: List[List[TileState]] = []
        for y in range(BOARD_SIZE):
            row: List[TileState] = []
            for x in range(BOARD_SIZE):
                raw_val = None
                if y < len(raw_tiles) and x < len(raw_tiles[y]):
                    raw_val = raw_tiles[y][x]
                row.append(TileState.from_raw(x, y, raw_val, current_day=day))
            tiles.append(row)

        private = obs.get("private", {}) or {}
        shed = {k: int(v) for k, v in private.get("shed", {}).items() if int(v) > 0}
        seeds = {k: int(v) for k, v in private.get("seeds", {}).items() if int(v) > 0}
        
        inventories = private.get("inventories", [])
        carried = {}
        if inventories and len(inventories) > 0:
            carried = {k: int(v) for k, v in inventories[0].items() if int(v) > 0}

        market = obs.get("market", {}) or {}
        market_prices = {k: int(v) for k, v in market.get("prices", {}).items()}
        market_inventory = {k: int(v) for k, v in market.get("inventory", {}).items()}

        town = obs.get("town", {}) or {}
        unlocked_shops = list(town.get("unlocked_shops", []))

        # Opponent public state
        opp_money = float(opp_farm.get("money", 3000.0))
        raw_opp_farmer = opp_farm.get("farmer", [4, 4])
        opp_farmer_pos = (int(raw_opp_farmer[0]), int(raw_opp_farmer[1]))
        opp_quads = list(opp_farm.get("unlocked_quadrants", ["NW"]))

        return cls(
            day=day,
            hour=hour,
            step=step,
            player_id=player_id,
            money=money,
            farmer_pos=farmer_pos,
            hands_pos=hands_pos,
            unlocked_quadrants=unlocked_quads,
            tiles=tiles,
            shed=shed,
            carried_inventory=carried,
            seeds=seeds,
            market_prices=market_prices,
            market_inventory=market_inventory,
            town_unlocked_shops=unlocked_shops,
            opponent_money=opp_money,
            opponent_farmer_pos=opp_farmer_pos,
            opponent_unlocked_quadrants=opp_quads
        )

    def get_tile(self, x: int, y: int) -> Optional[TileState]:
        """Safely fetch tile at coordinate."""
        if 0 <= x < BOARD_SIZE and 0 <= y < BOARD_SIZE and y < len(self.tiles) and x < len(self.tiles[y]):
            return self.tiles[y][x]
        return None

    def is_shed_accessible(self) -> bool:
        """True if the farmer is currently standing on a central shed access tile."""
        return self.farmer_pos in SHED_ACCESS_TILES

    def get_unlocked_empty_tiles(self) -> List[Tuple[int, int]]:
        """Return coordinates of all unlocked, walkable empty tiles."""
        res = []
        for y in range(BOARD_SIZE):
            for x in range(BOARD_SIZE):
                t = self.get_tile(x, y)
                if t and t.is_empty:
                    res.append((x, y))
        return res

    def get_mature_plants(self) -> List[Tuple[int, int]]:
        """Return coordinates of all plants ready for harvest."""
        res = []
        for y in range(BOARD_SIZE):
            for x in range(BOARD_SIZE):
                t = self.get_tile(x, y)
                if t and t.is_mature(self.day):
                    res.append((x, y))
        return res

    def get_unwatered_plants(self) -> List[Tuple[int, int]]:
        """Return coordinates of all living plants that still require water today."""
        res = []
        for y in range(BOARD_SIZE):
            for x in range(BOARD_SIZE):
                t = self.get_tile(x, y)
                if t and t.is_plant and not t.watered_today:
                    res.append((x, y))
        return res
