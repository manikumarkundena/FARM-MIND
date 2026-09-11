"""FARM-MIND V1 Dynamic Autonomous Strategy.

Features:
- Dynamic multi-crop economic scoring via EconomicEngine
- 7-tile balanced agricultural cluster
- Empirical market intelligence and price-aware liquidation
- Transparent telemetry capturing action, reason, priority, and expected value
"""
from typing import List, Tuple, Optional, Dict, Any

from agent.actions import ActionPlan
from agent.config import (
    CROP_DATA,
    TOTAL_DAYS,
    SHED_ACCESS_TILES,
    TURNS_PER_DAY
)
from agent.economy import EconomicEngine, CropScore
from agent.market import MarketTracker
from agent.planner import get_next_move
from agent.state import GameState, TileState


class FarmMindV1Strategy:
    """FARM-MIND V1 Autonomous Economic Strategy."""

    def __init__(self):
        self.economy = EconomicEngine()
        self.market_tracker = MarketTracker()

        # 7-tile contiguous cluster in unlocked NW quadrant (x: 0..4, y: 0..4):
        # (4,4) is shed access. All others are within 1-2 steps of shed.
        self.cluster_tiles: List[Tuple[int, int]] = [
            (4, 4),
            (3, 4),
            (4, 3),
            (3, 3),
            (2, 4),
            (4, 2),
            (2, 3),
        ]

        # Real-time telemetry for Decision Inspector
        self.last_decision_telemetry: Dict[str, Any] = {
            "action": "PASS",
            "reason": "Initializing",
            "priority": 1,
            "expected_value": 0.0,
            "target_tile": None,
            "target_crop": "MELON",
            "objective": "Farm Startup"
        }
        self.decision_history: List[Dict[str, Any]] = []

    def decide(self, state: GameState) -> ActionPlan:
        """Evaluate full game state, execute economic optimization, and return ActionPlan."""
        if state.step == 0:
            self.decision_history = []

        # 0. Update market tracking
        self.market_tracker.update_prices(state.market_prices)

        action = ActionPlan.make_pass()

        # 1. Evaluate crop portfolio economics
        best_crop_score = self.economy.best_crop(state.day, state.market_prices, state.money)
        target_crop = best_crop_score.crop_name if best_crop_score else "CARROT"

        # 2. Market Orders (Selling and Seed Purchasing)
        self._plan_market_orders(state, action, best_crop_score)

        # 3. Farmer Physical Action
        self._plan_farmer_action(state, action, best_crop_score, target_crop)

        # Record decision telemetry
        target_tile, _ = self._select_next_cluster_task(state, best_crop_score, target_crop)
        if state.day >= 27:
            objective = "Terminal Liquidation"
        elif state.day < 12:
            objective = "High-ROI Cluster Expansion (Melon)"
        else:
            objective = "Active Production & Cultivation"

        self.last_decision_telemetry["target_tile"] = target_tile
        self.last_decision_telemetry["target_crop"] = target_crop
        self.last_decision_telemetry["objective"] = objective
        self.last_decision_telemetry["step"] = state.step
        self.last_decision_telemetry["day"] = state.day
        self.last_decision_telemetry["hour"] = state.hour

        self.decision_history.append(dict(self.last_decision_telemetry))

        return action

    def _plan_market_orders(
        self,
        state: GameState,
        action: ActionPlan,
        best_crop_score: Optional[CropScore]
    ) -> None:
        """Execute price-aware liquidation and dynamic seed replenishment."""
        days_left = max(0, TOTAL_DAYS - state.day)

        # A. Evaluate selling for each crop in shed
        for crop_name, count in list(state.shed.items()):
            if count > 0:
                cur_price = state.market_prices.get(crop_name, 20.0)
                should_sell, reason = self.market_tracker.evaluate_sell_decision(
                    crop=crop_name,
                    current_price=cur_price,
                    shed_quantity=sum(state.shed.values()),
                    days_remaining=days_left
                )
                if should_sell:
                    sell_amount = min(count, 10)
                    action.add_market_action("SELL", crop_name, sell_amount)

        # B. Dynamic seed replenishment based on economic feasibility
        if not best_crop_score or not best_crop_score.is_viable_for_season:
            return

        chosen_crop = best_crop_score.crop_name
        seed_cost = best_crop_score.seed_cost
        current_seeds = state.seeds.get(chosen_crop, 0)

        # Count available empty / harvest-ready cluster tiles
        tiles_needing_seed = 0
        for tx, ty in self.cluster_tiles:
            t = state.get_tile(tx, ty)
            if t:
                if t.is_empty or t.is_weed or t.is_mature(state.day):
                    tiles_needing_seed += 1

        seed_deficit = max(0, tiles_needing_seed - current_seeds)
        if seed_deficit > 0 and state.money >= seed_cost:
            affordable = int(state.money // seed_cost)
            buy_count = min(seed_deficit, affordable, 3)
            if buy_count > 0:
                action.add_market_action("BUY_SEED", chosen_crop, buy_count)

    def _plan_farmer_action(
        self,
        state: GameState,
        action: ActionPlan,
        best_crop_score: Optional[CropScore],
        target_crop: str
    ) -> None:
        """Physical task execution using economic ranking and spatial priority."""
        fx, fy = state.farmer_pos
        curr_tile = state.get_tile(fx, fy)
        days_left = max(0, TOTAL_DAYS - state.day)

        # 1. Harvest mature crop at current tile (Immediate top priority)
        if curr_tile and curr_tile.is_mature(state.day):
            action.farmer = ["HARVEST"]
            crop_name = curr_tile.crop or "CROP"
            val = curr_tile.yield_units * state.market_prices.get(crop_name, 20)
            self.last_decision_telemetry = {
                "action": "HARVEST",
                "reason": f"Harvesting mature {crop_name} (yield: {curr_tile.yield_units})",
                "priority": 5,
                "expected_value": float(val)
            }
            return

        # 2. Water unwatered plant at current tile (Life preservation)
        if curr_tile and curr_tile.is_plant and not curr_tile.watered_today:
            action.farmer = ["WATER"]
            self.last_decision_telemetry = {
                "action": "WATER",
                "reason": f"Watering living {curr_tile.crop} to sustain growth and prevent death",
                "priority": 4,
                "expected_value": 25.0
            }
            return

        # 3. Clear weeds on current tile
        if curr_tile and curr_tile.is_weed:
            action.farmer = ["CLEAR"]
            self.last_decision_telemetry = {
                "action": "CLEAR",
                "reason": "Removing weed obstruction to reclaim fertile tile",
                "priority": 3,
                "expected_value": 15.0
            }
            return

        # 4. Drop carried goods at shed
        if state.is_shed_accessible() and sum(state.carried_inventory.values()) > 0:
            action.farmer = ["DROP"]
            total_items = sum(state.carried_inventory.values())
            self.last_decision_telemetry = {
                "action": "DROP",
                "reason": f"Depositing {total_items} harvested units into shed for liquidation",
                "priority": 4,
                "expected_value": 50.0
            }
            return

        # 5. Plant seed on current tile if empty and viable
        if (
            curr_tile
            and curr_tile.is_empty
            and (fx, fy) in self.cluster_tiles
            and best_crop_score
            and best_crop_score.is_viable_for_season
            and state.seeds.get(target_crop, 0) > 0
        ):
            action.farmer = ["PLANT", target_crop]
            self.last_decision_telemetry = {
                "action": f"PLANT {target_crop}",
                "reason": f"Economically optimal planting: {best_crop_score.reason}",
                "priority": 3,
                "expected_value": float(best_crop_score.net_profit)
            }
            return

        # --- NAVIGATION ---
        target_tile, target_reason = self._select_next_cluster_task(state, best_crop_score, target_crop)

        if target_tile and target_tile != (fx, fy):
            next_move = get_next_move((fx, fy), target_tile, state)
            if next_move:
                action.farmer = [next_move]
                self.last_decision_telemetry = {
                    "action": next_move,
                    "reason": f"Moving {next_move} toward {target_tile}: {target_reason}",
                    "priority": 2,
                    "expected_value": 10.0
                }
                return

        # Fallback: Return to shed if carrying items
        if sum(state.carried_inventory.values()) > 0 and (fx, fy) not in SHED_ACCESS_TILES:
            shed_move = get_next_move((fx, fy), (4, 4), state)
            if shed_move:
                action.farmer = [shed_move]
                self.last_decision_telemetry = {
                    "action": shed_move,
                    "reason": "Returning to shed to unload carried inventory",
                    "priority": 3,
                    "expected_value": 20.0
                }
                return

        # Reposition to (4, 4) if idle
        if (fx, fy) != (4, 4):
            center_move = get_next_move((fx, fy), (4, 4), state)
            if center_move:
                action.farmer = [center_move]
                self.last_decision_telemetry = {
                    "action": center_move,
                    "reason": "Repositioning to central shed node during turn lull",
                    "priority": 1,
                    "expected_value": 0.0
                }
                return

        action.farmer = ["PASS"]
        self.last_decision_telemetry = {
            "action": "PASS",
            "reason": "All active cluster tasks satisfied for this hour",
            "priority": 1,
            "expected_value": 0.0
        }

    def _select_next_cluster_task(
        self,
        state: GameState,
        best_crop_score: Optional[CropScore],
        target_crop: str
    ) -> Tuple[Optional[Tuple[int, int]], str]:
        """Select destination cluster tile with highest urgency."""
        fx, fy = state.farmer_pos

        # Priority 1: Mature plants
        mature = [
            p for p in self.cluster_tiles
            if (t := state.get_tile(p[0], p[1])) and t.is_mature(state.day)
        ]
        if mature:
            closest = min(mature, key=lambda p: abs(p[0] - fx) + abs(p[1] - fy))
            return closest, "Harvesting mature crop"

        # Priority 2: Unwatered plants
        unwatered = [
            p for p in self.cluster_tiles
            if (t := state.get_tile(p[0], p[1])) and t.is_plant and not t.watered_today
        ]
        if unwatered:
            closest = min(unwatered, key=lambda p: abs(p[0] - fx) + abs(p[1] - fy))
            return closest, "Daily watering routine"

        # Priority 3: Weeds
        weeds = [
            p for p in self.cluster_tiles
            if (t := state.get_tile(p[0], p[1])) and t.is_weed
        ]
        if weeds:
            closest = min(weeds, key=lambda p: abs(p[0] - fx) + abs(p[1] - fy))
            return closest, "Clearing weed"

        # Priority 4: Empty cluster tiles (if viable seed exists)
        if best_crop_score and best_crop_score.is_viable_for_season and state.seeds.get(target_crop, 0) > 0:
            empty = [
                p for p in self.cluster_tiles
                if (t := state.get_tile(p[0], p[1])) and t.is_empty
            ]
            if empty:
                closest = min(empty, key=lambda p: abs(p[0] - fx) + abs(p[1] - fy))
                return closest, f"Planting new {target_crop}"

        return None, "No cluster tasks pending"
