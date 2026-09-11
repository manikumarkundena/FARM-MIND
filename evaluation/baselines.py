"""FARM-MIND Evaluation Suite - Baseline Agents."""
import random
from typing import Dict, Any, List

def pass_agent(obs: Dict[str, Any]) -> Dict[str, Any]:
    """Agent that passes all turns."""
    return {"farmer": ["PASS"], "hands": [], "market": []}

def random_agent(obs: Dict[str, Any]) -> Dict[str, Any]:
    """Baseline agent performing random exploration."""
    rng = random.Random()
    farms = obs.get("farms", [])
    player = obs.get("player", 0)
    private = obs.get("private", {}) or {}
    farm = farms[player] if farms and player < len(farms) else None
    if farm is None:
        return {"farmer": ["PASS"], "hands": [], "market": []}

    farmer_ops = ["NORTH", "SOUTH", "EAST", "WEST", "WATER", "HARVEST", "PASS"]
    market: List[List[Any]] = []
    seeds = private.get("seeds", {})
    crops = ["WHEAT", "CARROT", "TOMATO", "STRAWBERRY", "MELON"]
    crop_seeds = {"WHEAT": 10, "CARROT": 20, "TOMATO": 50, "STRAWBERRY": 100, "MELON": 80}
    affordable = [c for c in crops if crop_seeds[c] <= farm["money"]]
    if affordable and rng.random() < 0.1:
        market.append(["BUY_SEED", rng.choice(affordable), 1])

    available_seeds = [c for c, n in seeds.items() if n > 0]
    if available_seeds and rng.random() < 0.3:
        farmer = ["PLANT", rng.choice(available_seeds)]
    else:
        farmer = [rng.choice(farmer_ops)]

    hands_actions = [[rng.choice(farmer_ops)] for _ in farm.get("hands", [])]
    return {"farmer": farmer, "hands": hands_actions, "market": market}

def starter_agent(obs: Dict[str, Any]) -> Dict[str, Any]:
    """Deterministic single-tile Carrot cycle baseline."""
    farms = obs.get("farms", [])
    player = obs.get("player", 0)
    private = obs.get("private", {}) or {}
    if not farms or player >= len(farms):
        return {"farmer": ["PASS"], "hands": [], "market": []}

    farm = farms[player]
    fx, fy = farm["farmer"]
    tile = farm["tiles"][fy][fx]
    day = obs.get("day", 0)
    seeds = private.get("seeds", {})
    shed = private.get("shed", {})
    market: List[List[Any]] = []

    if shed.get("CARROT", 0) > 0:
        market.append(["SELL", "CARROT", shed["CARROT"]])
    if seeds.get("CARROT", 0) == 0 and farm["money"] >= 20:
        market.append(["BUY_SEED", "CARROT", 1])

    farmer = ["PASS"]
    if tile is None and seeds.get("CARROT", 0) > 0:
        farmer = ["PLANT", "CARROT"]
    elif isinstance(tile, dict) and tile.get("kind") == "PLANT" and tile["crop"] == "CARROT":
        age = day - tile["planted_day"]
        if age >= 3:  # Carrot max_yield_day
            farmer = ["HARVEST"]
        elif not tile["watered_today"]:
            farmer = ["WATER"]

    return {"farmer": farmer, "hands": [], "market": market}

BASELINES = {
    "pass": pass_agent,
    "random": random_agent,
    "starter": starter_agent
}
