"""FARM-MIND Match and Tournament Runner."""
import argparse
import json
import sys
import time
from typing import Dict, Any, List, Optional
from kaggle_environments import make

from evaluation.baselines import BASELINES
from evaluation.metrics import compute_summary_metrics
from agent.main import farm_mind_agent
from agent.v1_main import farm_mind_v1_agent, reset_v1_strategy, get_v1_decision_history
from agent.state import TileState

AGENTS_REGISTRY: Dict[str, Any] = {
    **BASELINES,
    "FARM-MIND-V0": farm_mind_agent,
    "farm-mind-v0": farm_mind_agent,
    "farm_mind_v0": farm_mind_agent,
    "FARM-MIND-V1": farm_mind_v1_agent,
    "farm-mind-v1": farm_mind_v1_agent,
    "farm_mind_v1": farm_mind_v1_agent
}

def run_single_episode(
    agent0_name: str,
    agent1_name: str,
    seed: Optional[int] = None,
    episode_steps: int = 720,
    capture_snapshots: bool = False,
    snapshot_interval: int = 1
) -> Dict[str, Any]:
    """Execute a single head-to-head match between two named agents."""
    agents_pool = dict(AGENTS_REGISTRY)
    # Check if agent0/agent1 are in baselines or custom paths
    a0 = agents_pool.get(agent0_name, agent0_name)
    a1 = agents_pool.get(agent1_name, agent1_name)

    config: Dict[str, Any] = {"episodeSteps": episode_steps}
    if seed is not None:
        config["seed"] = seed

    env = make("kaggriculture", configuration=config)

    # Reset strategy state if applicable
    if a0 == farm_mind_v1_agent:
        reset_v1_strategy()

    start_time = time.time()

    # Run episode
    env.reset()
    env.run([a0, a1])
    duration = time.time() - start_time

    final_step = env.steps[-1]
    p0_state = final_step[0]
    p1_state = final_step[1]

    obs = p0_state.observation
    farms = obs.get("farms", [{}, {}])
    market = obs.get("market", {})
    town = obs.get("town", {})

    p0_reward = float(p0_state.reward if p0_state.reward is not None else (farms[0].get("money", 0.0) if len(farms) > 0 else 0.0))
    p1_reward = float(p1_state.reward if p1_state.reward is not None else (farms[1].get("money", 0.0) if len(farms) > 1 else 0.0))

    v1_telem_list = get_v1_decision_history() if a0 == farm_mind_v1_agent else []

    history: List[Dict[str, Any]] = []
    if capture_snapshots:
        interval = max(1, snapshot_interval)
        for idx in range(0, len(env.steps), interval):
            step_record = env.steps[idx]
            s_obs = step_record[0].observation
            s_farms = s_obs.get("farms", [])
            day = s_obs.get("day", idx // 24)
            hour = s_obs.get("hour", idx % 24)

            p0_tiles = s_farms[0].get("tiles", []) if len(s_farms) > 0 else []
            plants: List[Dict[str, Any]] = []
            for y in range(len(p0_tiles)):
                for x in range(len(p0_tiles[y])):
                    raw_t = p0_tiles[y][x]
                    if isinstance(raw_t, dict):
                        ts = TileState.from_raw(x, y, raw_t, day)
                        plants.append({
                            "x": x,
                            "y": y,
                            "kind": "WEED" if ts.is_weed else ("PLANT" if ts.is_plant else "STRUCTURE"),
                            "crop": ts.crop,
                            "yield_units": ts.yield_units,
                            "watered": ts.watered_today,
                            "age": max(0, day - ts.planted_day) if ts.planted_day >= 0 else 0,
                            "mature": ts.is_mature(day)
                        })

            p0_act = step_record[0].action or {}
            farmer_act = p0_act.get("farmer") or ["PASS"]
            market_act = p0_act.get("market") or []
            act_str = " ".join(farmer_act)

            event = None
            if any(m[0] == "SELL" for m in market_act):
                event = "SALE"
            elif any(m[0] == "BUY_SEED" for m in market_act):
                event = "PURCHASE"
            elif "PLANT" in act_str:
                event = "PLANT"
            elif "HARVEST" in act_str:
                event = "HARVEST"
            elif "DROP" in act_str:
                event = "DROP"
            elif "WATER" in act_str:
                event = "WATER"

            telemetry = v1_telem_list[idx] if idx < len(v1_telem_list) else {
                "action": act_str,
                "reason": f"Agent {agent0_name} routine action",
                "priority": 1,
                "expected_value": 0.0,
                "objective": "Standard Execution"
            }

            history.append({
                "step": idx,
                "day": day,
                "hour": hour,
                "p0_money": s_farms[0].get("money", 0.0) if len(s_farms) > 0 else 0.0,
                "p1_money": s_farms[1].get("money", 0.0) if len(s_farms) > 1 else 0.0,
                "p0_pos": s_farms[0].get("farmer", [4, 4]) if len(s_farms) > 0 else [4, 4],
                "p1_pos": s_farms[1].get("farmer", [4, 4]) if len(s_farms) > 1 else [4, 4],
                "action": act_str,
                "market_orders": market_act,
                "event": event,
                "plants": plants,
                "shed": dict(s_obs.get("private", {}).get("shed", {})),
                "seeds": dict(s_obs.get("private", {}).get("seeds", {})),
                "market_prices": dict(s_obs.get("market", {}).get("prices", {})),
                "telemetry": telemetry
            })


    return {
        "agent0": agent0_name,
        "agent1": agent1_name,
        "seed": seed,
        "steps_run": len(env.steps),
        "duration_sec": round(duration, 3),
        "p0_status": p0_state.status,
        "p1_status": p1_state.status,
        "p0_reward": p0_reward,
        "p1_reward": p1_reward,
        "p0_profit": round(p0_reward - 3000.0, 2),
        "p1_profit": round(p1_reward - 3000.0, 2),
        "winner": 0 if p0_reward > p1_reward else (1 if p1_reward > p0_reward else -1),
        "final_market_prices": dict(market.get("prices", {})),
        "unlocked_shops": list(town.get("unlocked_shops", [])),
        "p0_farmer": farms[0].get("farmer", [4, 4]) if len(farms) > 0 else [4, 4],
        "p0_tiles": farms[0].get("tiles", []) if len(farms) > 0 else [],
        "p0_shed": obs.get("private", {}).get("shed", {}),
        "p0_seeds": obs.get("private", {}).get("seeds", {}),
        "history": history
    }

def run_tournament(
    agent0_name: str,
    agent1_name: str,
    episodes: int = 5,
    base_seed: int = 100,
    episode_steps: int = 720
) -> Dict[str, Any]:
    """Run multiple seeded episodes and aggregate benchmark metrics."""
    matches = []
    for i in range(episodes):
        seed = base_seed + i
        result = run_single_episode(agent0_name, agent1_name, seed=seed, episode_steps=episode_steps)
        matches.append(result)

    metrics = compute_summary_metrics(matches)
    return {
        "agent0": agent0_name,
        "agent1": agent1_name,
        "episodes": episodes,
        "base_seed": base_seed,
        "metrics": metrics,
        "matches": matches
    }

def main():
    parser = argparse.ArgumentParser(description="FARM-MIND Match & Tournament Runner")
    parser.add_argument("--p0", default="FARM-MIND-V0", help="Player 0 agent (FARM-MIND-V0, starter, random, pass)")
    parser.add_argument("--p1", default="starter", help="Player 1 agent (FARM-MIND-V0, starter, random, pass)")
    parser.add_argument("--episodes", type=int, default=1, help="Number of episodes to execute")
    parser.add_argument("--seed", type=int, default=42, help="Starting random seed")
    parser.add_argument("--steps", type=int, default=720, help="Episode steps (default 720)")
    parser.add_argument("--snapshots", action="store_true", help="Capture progress telemetry snapshots")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON only")

    args = parser.parse_args()

    if args.episodes == 1:
        res = run_single_episode(args.p0, args.p1, seed=args.seed, episode_steps=args.steps, capture_snapshots=args.snapshots)
        if args.json:
            print(json.dumps(res))
        else:
            print(f"Match Finished in {res['duration_sec']}s")
            print(f"P0 ({args.p0}): Reward={res['p0_reward']}, Profit=${res['p0_profit']}")
            print(f"P1 ({args.p1}): Reward={res['p1_reward']}, Profit=${res['p1_profit']}")
            winner_str = "Tie" if res["winner"] == -1 else f"Player {res['winner']} ({args.p0 if res['winner'] == 0 else args.p1})"
            print(f"Winner: {winner_str}")
    else:
        tourney = run_tournament(args.p0, args.p1, episodes=args.episodes, base_seed=args.seed, episode_steps=args.steps)
        if args.json:
            print(json.dumps(tourney))
        else:
            m = tourney["metrics"]
            print(f"Tournament Finished ({args.episodes} episodes)")
            print(f"P0 ({args.p0}) Win Rate: {m['win_rate_p0']*100:.1f}%, Mean Reward: ${m['mean_reward_p0']}")
            print(f"P1 ({args.p1}) Win Rate: {m['win_rate_p1']*100:.1f}%, Mean Reward: ${m['mean_reward_p1']}")
            print(f"Tie Rate: {m['tie_rate']*100:.1f}%")

if __name__ == "__main__":
    main()
