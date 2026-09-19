"""FARM-MIND Match and Tournament Runner."""

import argparse
import json
import time
from typing import Dict, Any, List, Optional

from kaggle_environments import make

from evaluation.baselines import BASELINES
from evaluation.metrics import compute_summary_metrics
from agent.main import farm_mind_agent
from agent.v1_main import (
    farm_mind_v1_agent,
    reset_v1_strategy,
    get_v1_decision_history,
)
from agent.state import TileState


AGENTS_REGISTRY: Dict[str, Any] = {
    **BASELINES,

    "FARM-MIND-V0": farm_mind_agent,
    "farm-mind-v0": farm_mind_agent,
    "farm_mind_v0": farm_mind_agent,

    "FARM-MIND-V1": farm_mind_v1_agent,
    "farm-mind-v1": farm_mind_v1_agent,
    "farm_mind_v1": farm_mind_v1_agent,
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _safe_farmer_action(step_record: Any) -> List[str]:
    """Extract farmer actions safely from a Kaggriculture step."""
    try:
        action = step_record[0].action or {}
        farmer = action.get("farmer") or ["PASS"]

        if isinstance(farmer, list):
            return farmer

        return [str(farmer)]

    except Exception:
        return ["PASS"]


def _safe_market_action(step_record: Any) -> List[Any]:
    """Extract market actions safely from a Kaggriculture step."""
    try:
        action = step_record[0].action or {}
        market = action.get("market") or []

        if isinstance(market, list):
            return market

        return []

    except Exception:
        return []


def _action_to_string(farmer_action: List[str]) -> str:
    """Convert farmer action representation to a readable string."""
    if not farmer_action:
        return "PASS"

    return " ".join(str(action) for action in farmer_action)


def _detect_event(
    farmer_action: List[str],
    market_action: List[Any],
) -> Optional[str]:
    """
    Infer a compact replay event from the actual environment action.

    This is intentionally descriptive rather than claiming that the event
    represents an internal agent thought process.
    """

    # Market events first because market actions may accompany PASS.
    for market_order in market_action:
        if not isinstance(market_order, (list, tuple)) or not market_order:
            continue

        order_type = str(market_order[0])

        if order_type == "SELL":
            return "SALE"

        if order_type == "BUY_SEED":
            return "PURCHASE"

        if order_type == "BUY_PRODUCT":
            return "PURCHASE"

        if order_type == "BUY_ANIMAL":
            return "PURCHASE"

        if order_type == "EXPAND":
            return "LAND_EXPANSION"

        if order_type == "HIRE":
            return "HIRE"

        if order_type == "FIRE":
            return "FIRE"

    action_string = _action_to_string(farmer_action)

    if "PLANT" in action_string:
        return "PLANT"

    if "HARVEST" in action_string:
        return "HARVEST"

    if "WATER" in action_string:
        return "WATER"

    if "DROP" in action_string:
        return "DROP"

    if "CLEAR" in action_string:
        return "CLEAR"

    if "FERTILIZE" in action_string:
        return "FERTILIZE"

    if "BUILD" in action_string:
        return "BUILD"

    return None


def _extract_plants(
    tiles: List[List[Any]],
    day: int,
) -> List[Dict[str, Any]]:
    """Convert raw Kaggriculture tiles into replay-friendly plant records."""

    plants: List[Dict[str, Any]] = []

    for y in range(len(tiles)):
        row = tiles[y]

        if not isinstance(row, list):
            continue

        for x in range(len(row)):
            raw_tile = row[x]

            if not isinstance(raw_tile, dict):
                continue

            try:
                tile_state = TileState.from_raw(
                    x,
                    y,
                    raw_tile,
                    day,
                )

                if tile_state.is_weed:
                    kind = "WEED"
                elif tile_state.is_plant:
                    kind = "PLANT"
                elif tile_state.is_structure:
                    kind = "STRUCTURE"
                else:
                    kind = "EMPTY"

                age = (
                    max(0, day - tile_state.planted_day)
                    if tile_state.planted_day >= 0
                    else 0
                )

                plants.append(
                    {
                        "x": x,
                        "y": y,
                        "kind": kind,
                        "crop": tile_state.crop,
                        "yield_units": tile_state.yield_units,
                        "watered": tile_state.watered_today,
                        "age": age,
                        "mature": tile_state.is_mature(day),
                    }
                )

            except Exception:
                # A malformed tile should not destroy an entire replay.
                continue

    return plants


def _fallback_telemetry(
    agent_name: str,
    action_string: str,
    action_step: int,
) -> Dict[str, Any]:
    """Create transparent fallback telemetry when no agent trace exists."""

    return {
        "action": action_string,
        "reason": f"Agent {agent_name} routine action",
        "priority": 1,
        "expected_value": 0.0,
        "target_tile": None,
        "target_crop": None,
        "objective": "Standard Execution",
        "decision_step": None,
        "action_step": action_step,
        "telemetry_available": False,
    }


def _align_telemetry(
    telemetry_history: List[Dict[str, Any]],
    environment_step: int,
    agent_name: str,
) -> Dict[str, Any]:
    """
    Align FARM-MIND decision telemetry with the environment transition.

    Important contract:

        telemetry[N]
              |
              | decision made from state N
              v
        environment action at step N+1

    Therefore environment snapshot N+1 displays telemetry N.

    Snapshot 0 is the initial environment state and has no preceding
    FARM-MIND decision.
    """

    if environment_step == 0:
        return {
            "action": "INITIAL_STATE",
            "reason": "Initial environment state before FARM-MIND decision loop",
            "priority": 0,
            "expected_value": 0.0,
            "target_tile": None,
            "target_crop": None,
            "objective": "Initialization",
            "decision_step": None,
            "action_step": 0,
            "telemetry_available": False,
        }

    decision_step = environment_step - 1

    if 0 <= decision_step < len(telemetry_history):
        raw = dict(telemetry_history[decision_step])

        return {
            **raw,
            "decision_step": decision_step,
            "action_step": environment_step,
            "telemetry_available": True,
        }

    return _fallback_telemetry(
        agent_name=agent_name,
        action_string="UNKNOWN",
        action_step=environment_step,
    )


# ---------------------------------------------------------------------------
# Single episode
# ---------------------------------------------------------------------------

def run_single_episode(
    agent0_name: str,
    agent1_name: str,
    seed: Optional[int] = None,
    episode_steps: int = 720,
    capture_snapshots: bool = False,
    snapshot_interval: int = 1,
) -> Dict[str, Any]:
    """Execute a single head-to-head match between two named agents."""

    agents_pool = dict(AGENTS_REGISTRY)

    a0 = agents_pool.get(agent0_name, agent0_name)
    a1 = agents_pool.get(agent1_name, agent1_name)

    config: Dict[str, Any] = {
        "episodeSteps": episode_steps
    }

    if seed is not None:
        config["seed"] = seed

    env = make(
        "kaggriculture",
        configuration=config,
    )

    # Reset stateful strategy before a new FARM-MIND V1 episode.
    if a0 == farm_mind_v1_agent:
        reset_v1_strategy()

    start_time = time.time()

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

    p0_reward = float(
        p0_state.reward
        if p0_state.reward is not None
        else (
            farms[0].get("money", 0.0)
            if len(farms) > 0
            else 0.0
        )
    )

    p1_reward = float(
        p1_state.reward
        if p1_state.reward is not None
        else (
            farms[1].get("money", 0.0)
            if len(farms) > 1
            else 0.0
        )
    )

    # ---------------------------------------------------------------
    # Retrieve actual FARM-MIND decision telemetry.
    # ---------------------------------------------------------------

    v1_telem_list = (
        get_v1_decision_history()
        if a0 == farm_mind_v1_agent
        else []
    )

    history: List[Dict[str, Any]] = []

    # ---------------------------------------------------------------
    # Replay snapshot capture
    # ---------------------------------------------------------------

    if capture_snapshots:

        interval = max(1, snapshot_interval)

        for idx in range(
            0,
            len(env.steps),
            interval,
        ):

            step_record = env.steps[idx]

            s_obs = step_record[0].observation

            s_farms = s_obs.get("farms", [])

            day = int(
                s_obs.get(
                    "day",
                    idx // 24,
                )
            )

            hour = int(
                s_obs.get(
                    "hour",
                    idx % 24,
                )
            )

            # -------------------------------------------------------
            # FARM STATE
            # -------------------------------------------------------

            p0_farm = (
                s_farms[0]
                if len(s_farms) > 0
                else {}
            )

            p1_farm = (
                s_farms[1]
                if len(s_farms) > 1
                else {}
            )

            p0_tiles = p0_farm.get(
                "tiles",
                [],
            )

            plants = _extract_plants(
                p0_tiles,
                day,
            )

            # -------------------------------------------------------
            # ACTUAL ENVIRONMENT ACTION
            # -------------------------------------------------------

            farmer_action = _safe_farmer_action(
                step_record
            )

            market_action = _safe_market_action(
                step_record
            )

            action_string = _action_to_string(
                farmer_action
            )

            event = _detect_event(
                farmer_action,
                market_action,
            )

            # -------------------------------------------------------
            # TELEMETRY ALIGNMENT
            # -------------------------------------------------------

            telemetry = _align_telemetry(
                telemetry_history=v1_telem_list,
                environment_step=idx,
                agent_name=agent0_name,
            )

            # -------------------------------------------------------
            # PRIVATE STATE
            # -------------------------------------------------------

            private_state = s_obs.get(
                "private",
                {},
            )

            shed = dict(
                private_state.get(
                    "shed",
                    {},
                )
            )

            seeds = dict(
                private_state.get(
                    "seeds",
                    {},
                )
            )

            market_prices = dict(
                s_obs.get(
                    "market",
                    {}
                ).get(
                    "prices",
                    {}
                )
            )

            # -------------------------------------------------------
            # SNAPSHOT
            # -------------------------------------------------------

            snapshot = {
                "step": idx,
                "day": day,
                "hour": hour,

                "p0_money": p0_farm.get(
                    "money",
                    0.0,
                ),

                "p1_money": p1_farm.get(
                    "money",
                    0.0,
                ),

                "p0_pos": p0_farm.get(
                    "farmer",
                    [4, 4],
                ),

                "p1_pos": p1_farm.get(
                    "farmer",
                    [4, 4],
                ),

                # Actual environment action.
                "action": action_string,

                # Actual market action.
                "market_orders": market_action,

                # Descriptive event inferred from actual action.
                "event": event,

                # Parsed farm state.
                "plants": plants,

                # Private FARM-MIND state.
                "shed": shed,
                "seeds": seeds,

                # Market state visible to the player.
                "market_prices": market_prices,

                # Decision telemetry that produced this transition.
                "telemetry": telemetry,
            }

            history.append(snapshot)

    # ---------------------------------------------------------------
    # Final result
    # ---------------------------------------------------------------

    return {
        "agent0": agent0_name,
        "agent1": agent1_name,

        "seed": seed,

        "steps_run": len(env.steps),

        "duration_sec": round(
            duration,
            3,
        ),

        "p0_status": p0_state.status,
        "p1_status": p1_state.status,

        "p0_reward": p0_reward,
        "p1_reward": p1_reward,

        "p0_profit": round(
            p0_reward - 3000.0,
            2,
        ),

        "p1_profit": round(
            p1_reward - 3000.0,
            2,
        ),

        "winner": (
            0
            if p0_reward > p1_reward
            else (
                1
                if p1_reward > p0_reward
                else -1
            )
        ),

        "final_market_prices": dict(
            market.get(
                "prices",
                {}
            )
        ),

        "unlocked_shops": list(
            town.get(
                "unlocked_shops",
                []
            )
        ),

        "p0_farmer": (
            farms[0].get(
                "farmer",
                [4, 4],
            )
            if len(farms) > 0
            else [4, 4]
        ),

        "p0_tiles": (
            farms[0].get(
                "tiles",
                []
            )
            if len(farms) > 0
            else []
        ),

        "p0_shed": obs.get(
            "private",
            {}
        ).get(
            "shed",
            {}
        ),

        "p0_seeds": obs.get(
            "private",
            {}
        ).get(
            "seeds",
            {}
        ),

        "history": history,
    }


# ---------------------------------------------------------------------------
# Tournament
# ---------------------------------------------------------------------------

def run_tournament(
    agent0_name: str,
    agent1_name: str,
    episodes: int = 5,
    base_seed: int = 100,
    episode_steps: int = 720,
) -> Dict[str, Any]:
    """Run multiple seeded episodes and aggregate benchmark metrics."""

    matches = []

    for i in range(episodes):

        seed = base_seed + i

        result = run_single_episode(
            agent0_name,
            agent1_name,
            seed=seed,
            episode_steps=episode_steps,
        )

        matches.append(result)

    metrics = compute_summary_metrics(
        matches
    )

    return {
        "agent0": agent0_name,
        "agent1": agent1_name,
        "episodes": episodes,
        "base_seed": base_seed,
        "metrics": metrics,
        "matches": matches,
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():

    parser = argparse.ArgumentParser(
        description="FARM-MIND Match & Tournament Runner"
    )

    parser.add_argument(
        "--p0",
        default="FARM-MIND-V0",
        help="Player 0 agent (FARM-MIND-V0, FARM-MIND-V1, starter, random, pass)",
    )

    parser.add_argument(
        "--p1",
        default="starter",
        help="Player 1 agent (FARM-MIND-V0, FARM-MIND-V1, starter, random, pass)",
    )

    parser.add_argument(
        "--episodes",
        type=int,
        default=1,
        help="Number of episodes to execute",
    )

    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Starting random seed",
    )

    parser.add_argument(
        "--steps",
        type=int,
        default=720,
        help="Episode steps (default 720)",
    )

    parser.add_argument(
        "--snapshots",
        action="store_true",
        help="Capture progress telemetry snapshots",
    )

    parser.add_argument(
        "--json",
        action="store_true",
        help="Output machine-readable JSON only",
    )

    args = parser.parse_args()

    # ---------------------------------------------------------------
    # Single match
    # ---------------------------------------------------------------

    if args.episodes == 1:

        result = run_single_episode(
            args.p0,
            args.p1,
            seed=args.seed,
            episode_steps=args.steps,
            capture_snapshots=args.snapshots,
        )

        if args.json:

            print(
                json.dumps(
                    result,
                    default=str,
                )
            )

        else:

            print(
                f"Match Finished in "
                f"{result['duration_sec']}s"
            )

            print(
                f"P0 ({args.p0}): "
                f"Reward={result['p0_reward']}, "
                f"Profit=${result['p0_profit']}"
            )

            print(
                f"P1 ({args.p1}): "
                f"Reward={result['p1_reward']}, "
                f"Profit=${result['p1_profit']}"
            )

            winner_str = (
                "Tie"
                if result["winner"] == -1
                else (
                    f"Player {result['winner']} "
                    f"("
                    f"{args.p0 if result['winner'] == 0 else args.p1}"
                    f")"
                )
            )

            print(
                f"Winner: {winner_str}"
            )

    # ---------------------------------------------------------------
    # Tournament
    # ---------------------------------------------------------------

    else:

        tournament = run_tournament(
            args.p0,
            args.p1,
            episodes=args.episodes,
            base_seed=args.seed,
            episode_steps=args.steps,
        )

        if args.json:

            print(
                json.dumps(
                    tournament,
                    default=str,
                )
            )

        else:

            metrics = tournament["metrics"]

            print(
                f"Tournament Finished "
                f"({args.episodes} episodes)"
            )

            print(
                f"P0 ({args.p0}) Win Rate: "
                f"{metrics['win_rate_p0'] * 100:.1f}%, "
                f"Mean Reward: "
                f"${metrics['mean_reward_p0']}"
            )

            print(
                f"P1 ({args.p1}) Win Rate: "
                f"{metrics['win_rate_p1'] * 100:.1f}%, "
                f"Mean Reward: "
                f"${metrics['mean_reward_p1']}"
            )

            print(
                f"Tie Rate: "
                f"{metrics['tie_rate'] * 100:.1f}%"
            )
def main():
    parser = argparse.ArgumentParser(
        description="FARM-MIND evaluation runner"
    )

    parser.add_argument(
        "--p0",
        default="FARM-MIND-V1",
    )

    parser.add_argument(
        "--p1",
        default="starter",
    )

    parser.add_argument(
        "--episodes",
        type=int,
        default=1,
    )

    parser.add_argument(
        "--seed",
        type=int,
        default=42,
    )

    parser.add_argument(
        "--steps",
        type=int,
        default=720,
    )

    parser.add_argument(
        "--snapshots",
        action="store_true",
    )

    parser.add_argument(
        "--snapshot-interval",
        type=int,
        default=1,
    )

    parser.add_argument(
        "--json",
        action="store_true",
    )

    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Write JSON results directly to a UTF-8 file",
    )

    args = parser.parse_args()

    # ---------------------------------------------------------
    # Single replay mode
    # ---------------------------------------------------------
    if args.snapshots:

        result = run_single_episode(
            agent0_name=args.p0,
            agent1_name=args.p1,
            seed=args.seed,
            episode_steps=args.steps,
            capture_snapshots=True,
            snapshot_interval=args.snapshot_interval,
        )

        if args.output:
            with open(
                args.output,
                "w",
                encoding="utf-8",
                newline="\n",
            ) as f:
                json.dump(
                    result,
                    f,
                    indent=2,
                    ensure_ascii=False,
                    default=str,
                )

            print(
                f"Replay written to {args.output}"
            )

        elif args.json:
            print(
                json.dumps(
                    result,
                    indent=2,
                    ensure_ascii=False,
                    default=str,
                )
            )

        else:
            print(
                f"Episode finished: "
                f"{args.p0} vs {args.p1}"
            )
            print(
                f"Steps: {result.get('steps_run')}"
            )

        return

    # ---------------------------------------------------------
    # Tournament mode
    # ---------------------------------------------------------

    tournament = run_tournament(
        args.p0,
        args.p1,
        episodes=args.episodes,
        base_seed=args.seed,
        episode_steps=args.steps,
    )

    if args.output:

        with open(
            args.output,
            "w",
            encoding="utf-8",
            newline="\n",
        ) as f:
            json.dump(
                tournament,
                f,
                indent=2,
                ensure_ascii=False,
                default=str,
            )

        print(
            f"Results written to {args.output}"
        )

        return

    if args.json:

        print(
            json.dumps(
                tournament,
                default=str,
            )
        )

        return

    metrics = tournament["metrics"]

    print(
        f"Tournament Finished "
        f"({args.episodes} episodes)"
    )

    print(
        f"P0 ({args.p0}) Win Rate: "
        f"{metrics['win_rate_p0'] * 100:.1f}%, "
        f"Mean Reward: "
        f"${metrics['mean_reward_p0']}"
    )

    print(
        f"P1 ({args.p1}) Win Rate: "
        f"{metrics['win_rate_p1'] * 100:.1f}%, "
        f"Mean Reward: "
        f"${metrics['mean_reward_p1']}"
    )

    print(
        f"Tie Rate: "
        f"{metrics['tie_rate'] * 100:.1f}%"
    )


if __name__ == "__main__":
    main()