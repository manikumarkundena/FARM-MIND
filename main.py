"""Kaggriculture submission entry point for FARM-MIND V1."""

from agent.v1_main import farm_mind_v1_agent, reset_v1_strategy


def agent(observation, configuration=None):
    """Return the next FARM-MIND action for Kaggriculture."""
    # A Kaggriculture process may execute more than one episode. Reset all
    # strategy state at the beginning of each new episode.
    if observation.get("day") == 0 and observation.get("hour") == 0:
        reset_v1_strategy()

    return farm_mind_v1_agent(observation, configuration)
