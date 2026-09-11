"""Performance and evaluation metrics calculation for Kaggriculture episodes."""
import math
from typing import List, Dict, Any

def compute_summary_metrics(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Compute aggregate statistics from a list of match results."""
    if not results:
        return {
            "matches": 0,
            "win_rate_p0": 0.0,
            "win_rate_p1": 0.0,
            "tie_rate": 0.0,
            "mean_reward_p0": 0.0,
            "mean_reward_p1": 0.0,
            "mean_profit_p0": 0.0,
            "mean_profit_p1": 0.0,
            "mean_duration_sec": 0.0
        }

    n = len(results)
    p0_wins = 0
    p1_wins = 0
    ties = 0

    p0_rewards = []
    p1_rewards = []
    durations = []

    for r in results:
        rew0 = r["p0_reward"]
        rew1 = r["p1_reward"]
        p0_rewards.append(rew0)
        p1_rewards.append(rew1)
        durations.append(r.get("duration_sec", 0.0))

        if rew0 > rew1:
            p0_wins += 1
        elif rew1 > rew0:
            p1_wins += 1
        else:
            ties += 1

    def mean(vals: List[float]) -> float:
        return sum(vals) / len(vals) if vals else 0.0

    def median(vals: List[float]) -> float:
        if not vals:
            return 0.0
        sorted_vals = sorted(vals)
        mid = len(sorted_vals) // 2
        if len(sorted_vals) % 2 == 1:
            return float(sorted_vals[mid])
        return float((sorted_vals[mid - 1] + sorted_vals[mid]) / 2.0)

    def stdev(vals: List[float]) -> float:
        if len(vals) < 2:
            return 0.0
        m = mean(vals)
        var = sum((x - m) ** 2 for x in vals) / (len(vals) - 1)
        return math.sqrt(var)

    p0_profits = [r - 3000.0 for r in p0_rewards]
    p1_profits = [r - 3000.0 for r in p1_rewards]

    return {
        "matches": n,
        "p0_wins": p0_wins,
        "p1_wins": p1_wins,
        "ties": ties,
        "win_rate_p0": round(p0_wins / n, 4),
        "win_rate_p1": round(p1_wins / n, 4),
        "tie_rate": round(ties / n, 4),
        "mean_reward_p0": round(mean(p0_rewards), 2),
        "median_reward_p0": round(median(p0_rewards), 2),
        "stdev_reward_p0": round(stdev(p0_rewards), 2),
        "min_reward_p0": round(min(p0_rewards), 2) if p0_rewards else 0.0,
        "max_reward_p0": round(max(p0_rewards), 2) if p0_rewards else 0.0,
        "mean_reward_p1": round(mean(p1_rewards), 2),
        "median_reward_p1": round(median(p1_rewards), 2),
        "stdev_reward_p1": round(stdev(p1_rewards), 2),
        "min_reward_p1": round(min(p1_rewards), 2) if p1_rewards else 0.0,
        "max_reward_p1": round(max(p1_rewards), 2) if p1_rewards else 0.0,
        "mean_profit_p0": round(mean(p0_profits), 2),
        "median_profit_p0": round(median(p0_profits), 2),
        "min_profit_p0": round(min(p0_profits), 2) if p0_profits else 0.0,
        "max_profit_p0": round(max(p0_profits), 2) if p0_profits else 0.0,
        "mean_profit_p1": round(mean(p1_profits), 2),
        "median_profit_p1": round(median(p1_profits), 2),
        "min_profit_p1": round(min(p1_profits), 2) if p1_profits else 0.0,
        "max_profit_p1": round(max(p1_profits), 2) if p1_profits else 0.0,
        "mean_duration_sec": round(mean(durations), 3),
        "total_duration_sec": round(sum(durations), 3),
        "invalid_actions": 0
    }
