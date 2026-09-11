"""FARM-MIND Agent Configuration & Environmental Constants.

Values are grounded directly in kaggle-environments==1.32.7 kaggriculture implementation.
"""
from typing import Dict, Any, Set, Tuple

BOARD_SIZE: int = 10
QUADRANT_SIZE: int = 5
TURNS_PER_DAY: int = 24
TOTAL_DAYS: int = 30
TOTAL_STEPS: int = 720
INITIAL_CASH: float = 3000.0
SHED_CAPACITY: int = 100

# Compass directions mapped to coordinate deltas (dx, dy)
# In board coordinates, (x, y) where x is column [0..9] and y is row [0..9]
DIRECTIONS: Dict[str, Tuple[int, int]] = {
    "NORTH": (0, -1),
    "SOUTH": (0, 1),
    "EAST": (1, 0),
    "WEST": (-1, 0),
}

# Central shed access tiles for 10x10 board
SHED_ACCESS_TILES: Set[Tuple[int, int]] = {
    (4, 4), (5, 4), (4, 5), (5, 5)
}

# Starting NW quadrant bounds [x_min, x_max, y_min, y_max]
NW_BOUNDS: Tuple[int, int, int, int] = (0, 4, 0, 4)

# Official Crop parameters from Kaggriculture
CROP_DATA: Dict[str, Dict[str, Any]] = {
    "WHEAT": {
        "seed": 10,
        "first_yield_day": 2,
        "max_yield_day": 4,
        "interval": 0,
        "max_yield": 6,
        "ongoing": False,
    },
    "CARROT": {
        "seed": 20,
        "first_yield_day": 2,
        "max_yield_day": 3,
        "interval": 0,
        "max_yield": 4,
        "ongoing": False,
    },
    "TOMATO": {
        "seed": 50,
        "first_yield_day": 8,
        "max_yield_day": 8,
        "interval": 1,
        "max_yield": 4,
        "ongoing": True,
    },
    "STRAWBERRY": {
        "seed": 100,
        "first_yield_day": 10,
        "max_yield_day": 10,
        "interval": 2,
        "max_yield": 4,
        "ongoing": True,
    },
    "MELON": {
        "seed": 80,
        "first_yield_day": 10,
        "max_yield_day": 12,
        "interval": 0,
        "max_yield": 6,
        "ongoing": False,
    },
}
