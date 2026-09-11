"""FARM-MIND V0 Autonomous Strategy Engine.

Implements state-driven decision making, multi-tile crop clustering,
pathfinding-guided farming routines, and terminal-season economic preservation.
"""
from typing import List, Tuple, Optional, Dict, Any

from agent.actions import ActionPlan
from agent.config import (
    CROP_DATA,
    TOTAL_DAYS,
    SHED_ACCESS_TILES,
    TURNS_PER_DAY
)
from agent.planner import get_next_move
from agent.state import GameState, TileState


class FarmMindV0Strategy:
    """FARM-MIND V0 Autonomous Planning Strategy."""

    def __init__(self, primary_crop: str = "CARROT"):
        self.primary_crop = primary_crop
        # 4-tile compact farming cluster in the unlocked NW quadrant:
        # (4, 4) is shed-access; (3, 4), (4, 3), (3, 3) are immediately adjacent.
        self.cluster_tiles: List[Tuple[int, int]] = [
            (4, 4),
            (3, 4),
            (4, 3),
            (3, 3),
        ]

    def decide(self, state: GameState) -> ActionPlan:
        """Evaluate observation and return an optimal ActionPlan."""
        action = ActionPlan.make_pass()

        # 1. MARKET ORDERS (Independent of farmer physical action)
        self._plan_market_orders(state, action)

        # 2. FARMER PHYSICAL ACTION
        self._plan_farmer_action(state, action)

        return action

    def _plan_market_orders(self, state: GameState, action: ActionPlan) -> None:
        """Sell harvested crops in the shed and strategically purchase needed seeds."""
        # A. Sell all items stored in the shed
        for crop_name, count in list(state.shed.items()):
            if count > 0:
                # Sell up to 10 units per turn (maxMarketOrdersPerTurn safe limit)
                sell_amount = min(count, 10)
                action.add_market_action("SELL", crop_name, sell_amount)

        # B. Strategic seed purchasing
        crop_info = CROP_DATA.get(self.primary_crop, {})
        max_yield_day = crop_info.get("max_yield_day", 3)
        seed_cost = crop_info.get("seed", 20)

        # Economic rule: Stop buying seeds when crops cannot mature before season end
        days_remaining = TOTAL_DAYS - state.day
        if days_remaining < max_yield_day:
            return

        # Calculate seed deficit across cluster tiles
        current_seeds = state.seeds.get(self.primary_crop, 0)
        
        # Count cluster tiles that are currently empty or mature (soon to be empty)
        tiles_needing_seed = 0
        for tx, ty in self.cluster_tiles:
            tile = state.get_tile(tx, ty)
            if tile:
                if tile.is_empty or tile.is_weed:
                    tiles_needing_seed += 1
                elif tile.is_mature(state.day):
                    tiles_needing_seed += 1

        # Buy seeds if we have fewer seeds than needed tiles, and cash is available
        needed = max(0, tiles_needing_seed - current_seeds)
        if needed > 0 and state.money >= seed_cost:
            # Buy what we need, capped at what we can afford and 4 max per turn
            affordable = int(state.money // seed_cost)
            buy_count = min(needed, affordable, 4)
            if buy_count > 0:
                action.add_market_action("BUY_SEED", self.primary_crop, buy_count)

    def _plan_farmer_action(self, state: GameState, action: ActionPlan) -> None:
        """Hierarchical decision tree for physical farmer actions."""
        fx, fy = state.farmer_pos
        curr_tile = state.get_tile(fx, fy)
        crop_info = CROP_DATA.get(self.primary_crop, {})
        max_yield_day = crop_info.get("max_yield_day", 3)
        can_still_mature = (TOTAL_DAYS - state.day) >= max_yield_day

        # --- STEP 1: IMMEDIATE TILE ACTIONS ---

        # 1. Harvest mature crop at current tile
        if curr_tile and curr_tile.is_mature(state.day):
            action.farmer = ["HARVEST"]
            return

        # 2. Water unwatered plant at current tile
        if curr_tile and curr_tile.is_plant and not curr_tile.watered_today:
            action.farmer = ["WATER"]
            return

        # 3. Clear weeds on current tile
        if curr_tile and curr_tile.is_weed:
            action.farmer = ["CLEAR"]
            return

        # 4. Drop carried inventory into shed if at shed-access tile
        if state.is_shed_accessible() and sum(state.carried_inventory.values()) > 0:
            action.farmer = ["DROP"]
            return

        # 5. Plant seed if current tile is empty, part of cluster, and we have seeds
        if (
            curr_tile
            and curr_tile.is_empty
            and (fx, fy) in self.cluster_tiles
            and state.seeds.get(self.primary_crop, 0) > 0
            and can_still_mature
        ):
            action.farmer = ["PLANT", self.primary_crop]
            return

        # --- STEP 2: NAVIGATION TOWARDS NEXT TASK ---

        target_tile = self._select_next_target_tile(state, can_still_mature)

        if target_tile and target_tile != (fx, fy):
            next_move = get_next_move((fx, fy), target_tile, state)
            if next_move:
                action.farmer = [next_move]
                return

        # --- STEP 3: IDLE FALLBACK ---
        # If carrying items and not at shed, walk to shed access (4, 4)
        if sum(state.carried_inventory.values()) > 0 and (fx, fy) not in SHED_ACCESS_TILES:
            shed_move = get_next_move((fx, fy), (4, 4), state)
            if shed_move:
                action.farmer = [shed_move]
                return

        # If completely idle, position at central shed access tile (4, 4)
        if (fx, fy) != (4, 4):
            center_move = get_next_move((fx, fy), (4, 4), state)
            if center_move:
                action.farmer = [center_move]
                return

        # Pass turn
        action.farmer = ["PASS"]

    def _select_next_target_tile(
        self,
        state: GameState,
        can_still_mature: bool
    ) -> Optional[Tuple[int, int]]:
        """Identify highest-priority cluster tile requiring farmer intervention."""
        fx, fy = state.farmer_pos

        # Priority 1: Mature plants needing immediate harvest
        mature_tiles = [
            pos for pos in self.cluster_tiles
            if (t := state.get_tile(pos[0], pos[1])) and t.is_mature(state.day)
        ]
        if mature_tiles:
            return min(mature_tiles, key=lambda p: abs(p[0] - fx) + abs(p[1] - fy))

        # Priority 2: Living plants needing water today
        unwatered_tiles = [
            pos for pos in self.cluster_tiles
            if (t := state.get_tile(pos[0], pos[1])) and t.is_plant and not t.watered_today
        ]
        if unwatered_tiles:
            return min(unwatered_tiles, key=lambda p: abs(p[0] - fx) + abs(p[1] - fy))

        # Priority 3: Weeds needing clearing
        weed_tiles = [
            pos for pos in self.cluster_tiles
            if (t := state.get_tile(pos[0], pos[1])) and t.is_weed
        ]
        if weed_tiles:
            return min(weed_tiles, key=lambda p: abs(p[0] - fx) + abs(p[1] - fy))

        # Priority 4: Empty cluster tiles to plant (if seeds available and season allows)
        if can_still_mature and state.seeds.get(self.primary_crop, 0) > 0:
            empty_tiles = [
                pos for pos in self.cluster_tiles
                if (t := state.get_tile(pos[0], pos[1])) and t.is_empty
            ]
            if empty_tiles:
                return min(empty_tiles, key=lambda p: abs(p[0] - fx) + abs(p[1] - fy))

        return None
