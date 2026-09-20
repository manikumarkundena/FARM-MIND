"""FARM-MIND V2 agent entry point."""

import logging
from typing import Dict, Any, Optional

from agent.actions import ActionPlan
from agent.state import GameState
from agent.strategy_v2 import FarmMindV2Strategy

logger = logging.getLogger("farm_mind_v2")

_strategy_v2 = FarmMindV2Strategy()


def farm_mind_v2_agent(
    observation: Dict[str, Any],
    configuration: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    try:
        state = GameState.from_observation(observation)
        return _strategy_v2.decide(state).to_dict()
    except Exception as exc:
        logger.error("FARM-MIND V2 exception: %s", exc, exc_info=True)
        return ActionPlan.make_pass().to_dict()


def get_v2_decision_history() -> list:
    return list(_strategy_v2.decision_history)


def reset_v2_strategy() -> None:
    global _strategy_v2
    _strategy_v2 = FarmMindV2Strategy()
