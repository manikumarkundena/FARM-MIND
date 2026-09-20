"""Run isolated V2 tournaments against the existing baselines.

Uses the same seeds as the recorded V1 benchmarks so the comparison is
directly reproducible.
"""

import json

from agent.v1_main import farm_mind_v1_agent, reset_v1_strategy
from agent.v2_main import farm_mind_v2_agent, reset_v2_strategy
from agent.main import farm_mind_agent
from evaluation.runner import run_single_episode
from evaluation.metrics import compute_summary_metrics


def run_pair(agent0, reset0, agent1, reset1, base_seed=500, episodes=10):
    matches = []
    for i in range(episodes):
        reset0()
        reset1()
        matches.append(
            run_single_episode(
                agent0,
                agent1,
                seed=base_seed + i,
                episode_steps=720,
            )
        )
    return compute_summary_metrics(matches), matches


def main():
    results = {}

    metrics, _ = run_pair(
        farm_mind_v2_agent, reset_v2_strategy,
        "starter", lambda: None,
    )
    results["V2_vs_starter"] = metrics

    metrics, _ = run_pair(
        farm_mind_v2_agent, reset_v2_strategy,
        farm_mind_v1_agent, reset_v1_strategy,
    )
    results["V2_vs_V1"] = metrics

    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
