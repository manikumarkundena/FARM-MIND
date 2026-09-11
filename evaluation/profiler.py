"""FARM-MIND Diagnostic Profiler & Telemetry Engine.

Tracks detailed agent behavior:
- Action type distribution (MOVE, WATER, HARVEST, PLANT, DROP, CLEAR, PASS)
- Idle time vs productive labor
- Movement overhead
- Harvest counts and crop yields
- Stranded seeds / capital at season end
- Market selling price efficiency (sale price vs daily market peak)
"""
import sys
from typing import Dict, Any, List
from kaggle_environments import make

sys.path.insert(0, ".")

from agent.main import farm_mind_agent
from agent.v1_main import farm_mind_v1_agent
from evaluation.baselines import BASELINES


def profile_agent_episode(agent_func=farm_mind_agent, opponent="starter", seed=42, steps=720) -> Dict[str, Any]:
    """Execute an episode and extract fine-grained behavioral telemetry."""
    env = make("kaggriculture", configuration={"seed": seed, "episodeSteps": steps})
    env.reset()
    
    agents = [agent_func, BASELINES.get(opponent, opponent)]
    
    # Telemetry accumulators
    action_counts = {
        "MOVE": 0,
        "WATER": 0,
        "HARVEST": 0,
        "PLANT": 0,
        "DROP": 0,
        "CLEAR": 0,
        "PASS": 0,
        "OTHER": 0
    }
    daily_actions = [0 for _ in range(30)]
    daily_idle = [0 for _ in range(30)]
    harvests = 0
    total_yield = 0
    weeds_cleared = 0
    sales_executed = 0
    total_sales_revenue = 0.0
    sale_prices_achieved: List[float] = []
    daily_market_prices: Dict[str, List[float]] = {}
    
    for step_idx in range(steps - 1):
        if env.done:
            break
            
        step_rec = env.steps[-1]
        obs0 = step_rec[0].observation
        day = obs0.get("day", step_idx // 24)
        market = obs0.get("market", {})
        prices = market.get("prices", {})
        
        for crop, pr in prices.items():
            if crop not in daily_market_prices:
                daily_market_prices[crop] = []
            daily_market_prices[crop].append(pr)
            
        # Call agent
        agent_action = agent_func(obs0, env.configuration)
        f_act = agent_action.get("farmer", ["PASS"])
        act_verb = f_act[0] if f_act else "PASS"
        
        if act_verb in ("NORTH", "SOUTH", "EAST", "WEST"):
            action_counts["MOVE"] += 1
            if day < 30:
                daily_actions[day] += 1
        elif act_verb in action_counts:
            action_counts[act_verb] += 1
            if act_verb == "PASS":
                if day < 30:
                    daily_idle[day] += 1
            else:
                if day < 30:
                    daily_actions[day] += 1
            if act_verb == "HARVEST":
                harvests += 1
            elif act_verb == "CLEAR":
                weeds_cleared += 1
        else:
            action_counts["OTHER"] += 1
            
        # Market actions
        m_acts = agent_action.get("market", [])
        for m in m_acts:
            if isinstance(m, list) and len(m) >= 3 and m[0] == "SELL":
                crop_name = m[1]
                count = m[2]
                unit_price = prices.get(crop_name, 1)
                sales_executed += 1
                total_sales_revenue += unit_price * count
                sale_prices_achieved.append(unit_price)

        # Step environment
        env.step([agent_action, BASELINES["starter"](step_rec[1].observation)])

    # Final observation analysis
    final_obs = env.steps[-1][0].observation
    p0_farm = final_obs["farms"][0]
    p0_private = final_obs.get("private", {})
    final_cash = p0_farm.get("money", 0.0)
    stranded_seeds = dict(p0_private.get("seeds", {}))
    stranded_seed_val = sum(
        stranded_seeds.get(c, 0) * (20 if c == "CARROT" else 10)
        for c in stranded_seeds
    )
    
    total_turns = sum(action_counts.values())
    idle_fraction = (action_counts["PASS"] / total_turns) if total_turns > 0 else 0.0
    move_fraction = (action_counts["MOVE"] / total_turns) if total_turns > 0 else 0.0
    productive_fraction = 1.0 - idle_fraction - move_fraction
    
    avg_sale_price = (sum(sale_prices_achieved) / len(sale_prices_achieved)) if sale_prices_achieved else 0.0
    
    return {
        "final_cash": final_cash,
        "profit": final_cash - 3000.0,
        "total_turns": total_turns,
        "action_counts": action_counts,
        "idle_fraction": round(idle_fraction, 4),
        "move_fraction": round(move_fraction, 4),
        "productive_fraction": round(productive_fraction, 4),
        "harvest_count": harvests,
        "weeds_cleared": weeds_cleared,
        "sales_orders_sent": sales_executed,
        "total_sales_revenue": total_sales_revenue,
        "avg_sale_price_achieved": round(avg_sale_price, 2),
        "stranded_seeds": stranded_seeds,
        "stranded_seed_capital": stranded_seed_val,
        "avg_daily_actions": round(sum(daily_actions) / max(1, len(daily_actions)), 2),
        "avg_daily_idle_turns": round(sum(daily_idle) / max(1, len(daily_idle)), 2)
    }


if __name__ == "__main__":
    import json
    import argparse

    parser = argparse.ArgumentParser(description="Profile FARM-MIND agent episode telemetry")
    parser.add_argument("--agent", type=str, default="V1", choices=["V0", "V1"])
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    agent_fn = farm_mind_v1_agent if args.agent == "V1" else farm_mind_agent
    telemetry = profile_agent_episode(agent_func=agent_fn, seed=args.seed)
    print(json.dumps(telemetry, indent=2))
