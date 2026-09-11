"""FARM-MIND Main Agent Interface for Kaggle Kaggriculture.

Exposes the agent entry function compatible with kaggle-environments.
"""
import logging
from typing import Dict, Any, Optional

from agent.actions import ActionPlan
from agent.state import GameState
from agent.strategy import FarmMindV0Strategy

logger = logging.getLogger("farm_mind")

# Singleton or re-instantiable strategy instance
_strategy = FarmMindV0Strategy()


def farm_mind_agent(observation: Dict[str, Any], configuration: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Autonomous agent entry point for Kaggriculture simulation.
    
    Args:
        observation: Raw environment state dictionary.
        configuration: Simulation configuration dictionary.
        
    Returns:
        Structured action dictionary {"farmer": [...], "hands": [...], "market": [...]}.
    """
    try:
        # Parse state abstraction
        state = GameState.from_observation(observation)

        # Plan action via autonomous strategy
        plan = _strategy.decide(state)

        return plan.to_dict()

    except Exception as e:
        logger.error(f"FARM-MIND exception during step: {e}", exc_info=True)
        # Safe fallback: PASS without corrupting state or crashing episode
        return ActionPlan.make_pass().to_dict()
