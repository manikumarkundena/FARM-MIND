"""FARM-MIND V1 Agent Entry Point."""
import logging
from typing import Dict, Any, Optional

from agent.actions import ActionPlan
from agent.state import GameState
from agent.strategy_v1 import FarmMindV1Strategy

logger = logging.getLogger("farm_mind_v1")

_strategy_v1 = FarmMindV1Strategy()


def farm_mind_v1_agent(observation: Dict[str, Any], configuration: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Autonomous agent entry point for FARM-MIND V1 in Kaggriculture."""
    try:
        state = GameState.from_observation(observation)
        if state.step == 0:
            reset_v1_strategy()
        plan = _strategy_v1.decide(state)
        return plan.to_dict()
    except Exception as e:
        logger.error(f"FARM-MIND V1 exception: {e}", exc_info=True)
        return ActionPlan.make_pass().to_dict()


def get_v1_telemetry() -> Dict[str, Any]:
    """Return latest decision inspection telemetry."""
    return _strategy_v1.last_decision_telemetry


def get_v1_decision_history() -> list:
    """Return complete sequence of decision inspection telemetry for current episode."""
    return list(_strategy_v1.decision_history)


def reset_v1_strategy() -> None:
    """Reset strategy internal state before a new episode."""
    global _strategy_v1
    _strategy_v1 = FarmMindV1Strategy()

