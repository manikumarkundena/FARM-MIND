"""FARM-MIND Versioned Experiment Framework.

Logs and archives all comparative benchmark experiments with:
- strategy version
- seed range
- opponent
- number of episodes
- win rate
- mean/median/stdev final cash
- mean profit
- runtime
- configuration details
- experimental observations & hypotheses
"""
import os
import json
import time
from typing import Dict, Any, Optional
from datetime import datetime

from evaluation.runner import run_tournament

EXPERIMENTS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "experiments", "experiments.json")


def log_experiment(
    strategy_version: str,
    opponent: str,
    episodes: int,
    base_seed: int,
    notes: str,
    config: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Execute a controlled tournament and record it to the permanent experiment log."""
    print(f"Running experiment: {strategy_version} vs {opponent} ({episodes} eps, seed {base_seed})...")
    start = time.time()
    tournament_result = run_tournament(
        agent0_name=strategy_version,
        agent1_name=opponent,
        episodes=episodes,
        base_seed=base_seed
    )
    elapsed = time.time() - start

    record = {
        "id": f"EXP-{int(time.time())}",
        "timestamp": datetime.utcnow().isoformat(),
        "strategy_version": strategy_version,
        "opponent": opponent,
        "episodes": episodes,
        "base_seed": base_seed,
        "seed_range": f"{base_seed}..{base_seed + episodes - 1}",
        "metrics": tournament_result["metrics"],
        "runtime_sec": round(elapsed, 2),
        "notes": notes,
        "config": config or {}
    }

    os.makedirs(os.path.dirname(EXPERIMENTS_FILE), exist_ok=True)
    existing = []
    if os.path.exists(EXPERIMENTS_FILE):
        try:
            with open(EXPERIMENTS_FILE, "r") as f:
                existing = json.load(f)
        except Exception:
            existing = []

    existing.append(record)
    with open(EXPERIMENTS_FILE, "w") as f:
        json.dump(existing, f, indent=2)

    print(f"Logged experiment {record['id']}: Win Rate {record['metrics']['win_rate_p0']*100:.1f}%, Mean Cash ${record['metrics']['mean_reward_p0']}")
    return record


def get_all_experiments() -> list:
    """Retrieve all logged experiments."""
    if not os.path.exists(EXPERIMENTS_FILE):
        return []
    try:
        with open(EXPERIMENTS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []


if __name__ == "__main__":
    # Log baseline V0 vs starter
    log_experiment(
        strategy_version="FARM-MIND-V0",
        opponent="starter",
        episodes=10,
        base_seed=500,
        notes="V0 baseline: 4-tile fixed cluster, monoculture Carrot, immediate liquidation.",
        config={"tiles": 4, "crop": "CARROT", "selling": "IMMEDIATE"}
    )
    # Log V1 vs starter
    log_experiment(
        strategy_version="FARM-MIND-V1",
        opponent="starter",
        episodes=10,
        base_seed=500,
        notes="V1 economic: 7-tile cluster, dynamic crop scoring (Melon/Carrot), price-aware selling.",
        config={"tiles": 7, "crop": "DYNAMIC", "selling": "PRICE_AWARE"}
    )
    # Log Head-to-Head: V1 vs V0
    log_experiment(
        strategy_version="FARM-MIND-V1",
        opponent="FARM-MIND-V0",
        episodes=10,
        base_seed=500,
        notes="Head-to-head tournament: V1 dynamic economic strategy vs V0 fixed heuristic.",
        config={"comparison": "V1_vs_V0"}
    )
