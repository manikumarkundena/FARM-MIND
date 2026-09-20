"""FARM-MIND V2 demand-aware strategy.

V2 preserves the validated V1 execution policy and changes only the economic
crop-ranking signal. This isolates the experiment variable.
"""

from agent.strategy_v1 import FarmMindV1Strategy
from agent.economy_v2 import DemandAwareEconomicEngine


class FarmMindV2Strategy(FarmMindV1Strategy):
    """V1 execution + demand-aware economic ranking."""

    def __init__(self):
        super().__init__()
        self.economy = DemandAwareEconomicEngine()

    def decide(self, state):
        self.economy.set_context(state)
        return super().decide(state)
