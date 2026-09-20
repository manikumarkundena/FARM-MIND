"""Kaggriculture submission entry point for FARM-MIND V1."""

from agent.v1_main import farm_mind_v1_agent


def agent(observation, configuration=None):
    """Return the next FARM-MIND action for Kaggriculture."""
    return farm_mind_v1_agent(observation, configuration)
