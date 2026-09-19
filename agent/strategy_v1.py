"""
FARM-MIND V1 Dynamic Autonomous Strategy.

Features:
- Dynamic multi-crop economic scoring via EconomicEngine
- 7-tile balanced agricultural cluster
- Empirical market intelligence and price-aware liquidation
- Transparent decision telemetry
- Action-specific target tracking
- Replay-safe decision metadata
"""

from typing import List, Tuple, Optional, Dict, Any

from agent.actions import ActionPlan
from agent.config import (
    TOTAL_DAYS,
    SHED_ACCESS_TILES,
    TURNS_PER_DAY,
)
from agent.economy import EconomicEngine, CropScore
from agent.market import MarketTracker
from agent.planner import get_next_move
from agent.state import GameState


class FarmMindV1Strategy:
    """FARM-MIND V1 Autonomous Economic Strategy.

    Telemetry contract:
    - target_tile is the physical destination for movement actions.
    - target_tile is the current farmer tile for physical tile actions
      such as WATER, HARVEST, CLEAR, PLANT, and DROP.
    - target_tile is None for PASS.
    - target_crop describes the crop directly involved in the action, or
      the economic crop being considered when the action has no crop target.
    - market_orders mirrors the market portion of the returned ActionPlan.
    """

    def __init__(self):
        self.economy = EconomicEngine()
        self.market_tracker = MarketTracker()

        # 7-tile contiguous cluster in unlocked NW quadrant.
        #
        # (4,4) is a shed-access tile.
        # Remaining tiles are kept close to the shed to reduce
        # navigation overhead and simplify the production loop.
        self.cluster_tiles: List[Tuple[int, int]] = [
            (4, 4),
            (3, 4),
            (4, 3),
            (3, 3),
            (2, 4),
            (4, 2),
            (2, 3),
        ]

        # Latest decision telemetry.
        #
        # IMPORTANT:
        # target_tile / target_crop describe the action actually
        # selected by the strategy, not merely the globally
        # preferred economic crop.
        self.last_decision_telemetry: Dict[str, Any] = {
            "action": "PASS",
            "reason": "Initializing",
            "priority": 1,
            "expected_value": 0.0,
            "target_tile": None,
            "target_crop": "MELON",
            "objective": "Farm Startup",
            "step": 0,
            "day": 0,
            "hour": 0,
        }

        # Full decision sequence for replay / analysis.
        self.decision_history: List[Dict[str, Any]] = []

    # ------------------------------------------------------------------
    # TELEMETRY HELPERS
    # ------------------------------------------------------------------

    def _reset_telemetry(
        self,
        state: GameState,
        target_crop: Optional[str],
    ) -> None:
        """Start each decision with a fresh, truthful telemetry record.

        A strategy object lives across many turns. Resetting the record before
        planning prevents a previous turn's action/target from leaking into
        the current replay if a later planner branch does not overwrite it.
        """
        self.last_decision_telemetry = {
            "action": "PASS",
            "reason": "No immediate physical task selected",
            "priority": 1,
            "expected_value": 0.0,
            "target_tile": None,
            "target_crop": target_crop,
            "objective": "Planning",
            "step": state.step,
            "day": state.day,
            "hour": state.hour,
        }

    def _finalize_telemetry(
        self,
        state: GameState,
        objective: str,
        action: ActionPlan,
    ) -> None:
        """Attach shared metadata without changing action-specific targets."""
        telemetry = self.last_decision_telemetry

        telemetry["objective"] = objective
        telemetry["step"] = state.step
        telemetry["day"] = state.day
        telemetry["hour"] = state.hour

        # Keep market decisions inspectable without confusing them with the
        # physical farmer action used by the replay validator.
        try:
            action_dict = action.to_dict()
            telemetry["market_orders"] = action_dict.get("market", [])
        except Exception:
            telemetry["market_orders"] = []

        # Defensive normalization for replay consumers.
        if "target_tile" not in telemetry:
            telemetry["target_tile"] = None
        if "target_crop" not in telemetry:
            telemetry["target_crop"] = None

        # Store a copy so future mutations do not modify history.
        self.decision_history.append(dict(telemetry))

    # ------------------------------------------------------------------
    # MAIN DECISION LOOP
    # ------------------------------------------------------------------

    def decide(self, state: GameState) -> ActionPlan:
        """
        Evaluate the current game state and produce the next action.

        Telemetry is intentionally attached to the actual action
        selected by the strategy.

        The important invariant is:

            decision telemetry
                ↓
            action returned
                ↓
            environment executes action

        Therefore telemetry must never be overwritten afterward
        with unrelated global economic state.
        """

        if state.step == 0:
            self.decision_history = []

        # --------------------------------------------------------------
        # 0. Update market history
        # --------------------------------------------------------------

        self.market_tracker.update_prices(state.market_prices)

        # --------------------------------------------------------------
        # 1. Evaluate current crop economics
        # --------------------------------------------------------------

        best_crop_score = self.economy.best_crop(
            state.day,
            state.market_prices,
            state.money,
        )

        target_crop = (
            best_crop_score.crop_name
            if best_crop_score
            else "CARROT"
        )

        # --------------------------------------------------------------
        # 2. Create a fresh telemetry record for this decision
        # --------------------------------------------------------------

        self._reset_telemetry(
            state,
            target_crop,
        )

        action = ActionPlan.make_pass()

        # --------------------------------------------------------------
        # 3. Plan market orders
        # --------------------------------------------------------------

        self._plan_market_orders(
            state,
            action,
            best_crop_score,
        )

        # --------------------------------------------------------------
        # 4. Plan physical farmer action
        # --------------------------------------------------------------

        self._plan_farmer_action(
            state,
            action,
            best_crop_score,
            target_crop,
        )

        # --------------------------------------------------------------
        # 5. Add shared decision metadata
        # --------------------------------------------------------------

        if state.day >= 27:
            objective = "Terminal Liquidation"
        elif state.day < 12:
            objective = f"Cluster Expansion — {target_crop}"
        else:
            objective = f"Active Production — {target_crop}"

        # IMPORTANT:
        # Do not overwrite target_tile / target_crop here. Those fields
        # describe the action selected by _plan_farmer_action.
        self._finalize_telemetry(
            state,
            objective,
            action,
        )

        return action

    # ------------------------------------------------------------------
    # MARKET PLANNING
    # ------------------------------------------------------------------

    def _plan_market_orders(
        self,
        state: GameState,
        action: ActionPlan,
        best_crop_score: Optional[CropScore],
    ) -> None:
        """Execute price-aware liquidation and seed replenishment."""

        days_left = max(
            0,
            TOTAL_DAYS - state.day,
        )

        # --------------------------------------------------------------
        # A. Evaluate selling decisions
        # --------------------------------------------------------------

        for crop_name, count in list(state.shed.items()):

            if count <= 0:
                continue

            current_price = state.market_prices.get(
                crop_name,
                20.0,
            )

            should_sell, _reason = (
                self.market_tracker.evaluate_sell_decision(
                    crop=crop_name,
                    current_price=current_price,
                    shed_quantity=sum(state.shed.values()),
                    days_remaining=days_left,
                )
            )

            if should_sell:

                sell_amount = min(
                    count,
                    10,
                )

                action.add_market_action(
                    "SELL",
                    crop_name,
                    sell_amount,
                )

        # --------------------------------------------------------------
        # B. Dynamic seed replenishment
        # --------------------------------------------------------------

        if (
            not best_crop_score
            or not best_crop_score.is_viable_for_season
        ):
            return

        chosen_crop = best_crop_score.crop_name
        seed_cost = best_crop_score.seed_cost

        current_seeds = state.seeds.get(
            chosen_crop,
            0,
        )

        # Count cluster tiles that could accept a new seed.
        tiles_needing_seed = 0

        for tx, ty in self.cluster_tiles:

            tile = state.get_tile(
                tx,
                ty,
            )

            if tile:
                if (
                    tile.is_empty
                    or tile.is_weed
                    or tile.is_mature(state.day)
                ):
                    tiles_needing_seed += 1

        seed_deficit = max(
            0,
            tiles_needing_seed - current_seeds,
        )

        if (
            seed_deficit > 0
            and state.money >= seed_cost
        ):

            affordable = int(
                state.money // seed_cost
            )

            buy_count = min(
                seed_deficit,
                affordable,
                3,
            )

            if buy_count > 0:

                action.add_market_action(
                    "BUY_SEED",
                    chosen_crop,
                    buy_count,
                )

    # ------------------------------------------------------------------
    # PHYSICAL FARMER ACTION
    # ------------------------------------------------------------------

    def _plan_farmer_action(
        self,
        state: GameState,
        action: ActionPlan,
        best_crop_score: Optional[CropScore],
        target_crop: str,
    ) -> None:
        """Select and annotate the farmer's physical action."""

        fx, fy = state.farmer_pos

        current_tile = state.get_tile(
            fx,
            fy,
        )

        # --------------------------------------------------------------
        # Priority 5 — Harvest
        # --------------------------------------------------------------

        if (
            current_tile
            and current_tile.is_mature(state.day)
        ):

            action.farmer = [
                "HARVEST"
            ]

            crop_name = (
                current_tile.crop
                or "CROP"
            )

            value = (
                current_tile.yield_units
                * state.market_prices.get(
                    crop_name,
                    20,
                )
            )

            self.last_decision_telemetry = {
                "action": "HARVEST",
                "reason": (
                    f"Harvesting mature {crop_name} "
                    f"(yield: {current_tile.yield_units})"
                ),
                "priority": 5,
                "expected_value": float(value),
                "target_tile": [fx, fy],
                "target_crop": crop_name,
            }

            return

        # --------------------------------------------------------------
        # Priority 4 — Water
        # --------------------------------------------------------------

        if (
            current_tile
            and current_tile.is_plant
            and not current_tile.watered_today
        ):

            action.farmer = [
                "WATER"
            ]

            crop_name = (
                current_tile.crop
                or "UNKNOWN"
            )

            self.last_decision_telemetry = {
                "action": "WATER",
                "reason": (
                    f"Watering living {crop_name} "
                    "to sustain growth and prevent death"
                ),
                "priority": 4,
                "expected_value": 25.0,
                "target_tile": [fx, fy],
                "target_crop": crop_name,
            }

            return

        # --------------------------------------------------------------
        # Priority 3 — Clear weed
        # --------------------------------------------------------------

        if (
            current_tile
            and current_tile.is_weed
        ):

            action.farmer = [
                "CLEAR"
            ]

            self.last_decision_telemetry = {
                "action": "CLEAR",
                "reason": (
                    "Removing weed obstruction "
                    "to reclaim fertile tile"
                ),
                "priority": 3,
                "expected_value": 15.0,
                "target_tile": [fx, fy],
                "target_crop": None,
            }

            return

        # --------------------------------------------------------------
        # Priority 4 — Drop harvested inventory
        # --------------------------------------------------------------

        carried_units = sum(
            state.carried_inventory.values()
        )

        if (
            state.is_shed_accessible()
            and carried_units > 0
        ):

            action.farmer = [
                "DROP"
            ]

            self.last_decision_telemetry = {
                "action": "DROP",
                "reason": (
                    f"Depositing {carried_units} "
                    "harvested units into shed "
                    "for liquidation"
                ),
                "priority": 4,
                "expected_value": 50.0,
                "target_tile": [fx, fy],
                "target_crop": None,
            }

            return

        # --------------------------------------------------------------
        # Priority 3 — Plant
        # --------------------------------------------------------------

        if (
            current_tile
            and current_tile.is_empty
            and (fx, fy) in self.cluster_tiles
            and best_crop_score
            and best_crop_score.is_viable_for_season
            and state.seeds.get(
                target_crop,
                0,
            ) > 0
        ):

            action.farmer = [
                "PLANT",
                target_crop,
            ]

            self.last_decision_telemetry = {
                "action": f"PLANT {target_crop}",
                "reason": (
                    "Economically optimal planting: "
                    f"{best_crop_score.reason}"
                ),
                "priority": 3,
                "expected_value": float(
                    best_crop_score.net_profit
                ),
                "target_tile": [fx, fy],
                "target_crop": target_crop,
            }

            return

        # --------------------------------------------------------------
        # Return to shed before starting another remote task
        # --------------------------------------------------------------
        #
        # Once harvested inventory is being carried, prioritize getting it
        # back to the shed. The previous ordering could continue navigating
        # around the cluster while carrying goods, which increased exposure
        # to shed-capacity pressure and made the decision trace harder to
        # explain.

        if (
            carried_units > 0
            and (fx, fy) not in SHED_ACCESS_TILES
        ):

            shed_target = (4, 4)

            shed_move = get_next_move(
                (fx, fy),
                shed_target,
                state,
            )

            if shed_move:

                action.farmer = [
                    shed_move
                ]

                self.last_decision_telemetry = {
                    "action": shed_move,
                    "reason": (
                        "Returning to shed "
                        "to unload carried inventory"
                    ),
                    "priority": 3,
                    "expected_value": 20.0,
                    "target_tile": list(shed_target),
                    "target_crop": None,
                }

                return

        # --------------------------------------------------------------
        # Navigation
        # --------------------------------------------------------------

        target_tile, target_reason = (
            self._select_next_cluster_task(
                state,
                best_crop_score,
                target_crop,
            )
        )

        if (
            target_tile
            and target_tile != (fx, fy)
        ):

            next_move = get_next_move(
                (fx, fy),
                target_tile,
                state,
            )

            if next_move:

                action.farmer = [
                    next_move
                ]

                # Resolve the crop at the destination if possible.
                target_tile_state = state.get_tile(
                    target_tile[0],
                    target_tile[1],
                )

                destination_crop = (
                    target_tile_state.crop
                    if target_tile_state
                    else None
                )

                # For an empty destination, the economic target
                # crop is the relevant crop.
                if destination_crop is None:
                    destination_crop = target_crop

                self.last_decision_telemetry = {
                    "action": next_move,
                    "reason": (
                        f"Moving {next_move} toward "
                        f"{target_tile}: {target_reason}"
                    ),
                    "priority": 2,
                    "expected_value": 10.0,
                    "target_tile": list(target_tile),
                    "target_crop": destination_crop,
                }

                return

        # --------------------------------------------------------------
        # Reposition to shed
        # --------------------------------------------------------------

        if (fx, fy) != (4, 4):

            center_target = (4, 4)

            center_move = get_next_move(
                (fx, fy),
                center_target,
                state,
            )

            if center_move:

                action.farmer = [
                    center_move
                ]

                self.last_decision_telemetry = {
                    "action": center_move,
                    "reason": (
                        "Repositioning to central "
                        "shed node during turn lull"
                    ),
                    "priority": 1,
                    "expected_value": 0.0,
                    "target_tile": list(
                        center_target
                    ),
                    "target_crop": None,
                }

                return

        # --------------------------------------------------------------
        # PASS
        # --------------------------------------------------------------

        action.farmer = [
            "PASS"
        ]

        self.last_decision_telemetry = {
            "action": "PASS",
            "reason": (
                "All active cluster tasks "
                "satisfied for this hour"
            ),
            "priority": 1,
            "expected_value": 0.0,
            "target_tile": None,
            "target_crop": target_crop,
        }

    # ------------------------------------------------------------------
    # TARGET SELECTION
    # ------------------------------------------------------------------

    def _select_next_cluster_task(
        self,
        state: GameState,
        best_crop_score: Optional[CropScore],
        target_crop: str,
    ) -> Tuple[
        Optional[Tuple[int, int]],
        str,
    ]:
        """
        Select the highest-priority cluster destination.

        Priority:
        1. Mature crops
        2. Unwatered crops
        3. Weeds
        4. Empty planting tiles
        """

        fx, fy = state.farmer_pos

        # --------------------------------------------------------------
        # Priority 1 — Mature crops
        # --------------------------------------------------------------

        mature = [
            position
            for position in self.cluster_tiles
            if (
                (tile := state.get_tile(
                    position[0],
                    position[1],
                ))
                and tile.is_mature(state.day)
            )
        ]

        if mature:

            closest = min(
                mature,
                key=lambda position:
                    abs(position[0] - fx)
                    + abs(position[1] - fy),
            )

            return (
                closest,
                "Harvesting mature crop",
            )

        # --------------------------------------------------------------
        # Priority 2 — Unwatered plants
        # --------------------------------------------------------------

        unwatered = [
            position
            for position in self.cluster_tiles
            if (
                (tile := state.get_tile(
                    position[0],
                    position[1],
                ))
                and tile.is_plant
                and not tile.watered_today
            )
        ]

        if unwatered:

            closest = min(
                unwatered,
                key=lambda position:
                    abs(position[0] - fx)
                    + abs(position[1] - fy),
            )

            return (
                closest,
                "Daily watering routine",
            )

        # --------------------------------------------------------------
        # Priority 3 — Weeds
        # --------------------------------------------------------------

        weeds = [
            position
            for position in self.cluster_tiles
            if (
                (tile := state.get_tile(
                    position[0],
                    position[1],
                ))
                and tile.is_weed
            )
        ]

        if weeds:

            closest = min(
                weeds,
                key=lambda position:
                    abs(position[0] - fx)
                    + abs(position[1] - fy),
            )

            return (
                closest,
                "Clearing weed",
            )

        # --------------------------------------------------------------
        # Priority 4 — Empty planting tiles
        # --------------------------------------------------------------

        if (
            best_crop_score
            and best_crop_score.is_viable_for_season
            and state.seeds.get(
                target_crop,
                0,
            ) > 0
        ):

            empty = [
                position
                for position in self.cluster_tiles
                if (
                    (tile := state.get_tile(
                        position[0],
                        position[1],
                    ))
                    and tile.is_empty
                )
            ]

            if empty:

                closest = min(
                    empty,
                    key=lambda position:
                        abs(position[0] - fx)
                        + abs(position[1] - fy),
                )

                return (
                    closest,
                    f"Planting new {target_crop}",
                )

        return (
            None,
            "No cluster tasks pending",
        )