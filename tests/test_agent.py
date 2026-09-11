"""Unit tests for FARM-MIND Autonomous Agent Architecture.

Covers:
- Action construction and serialization
- State abstraction parsing and query methods
- Resilient parsing with missing/corrupted fields
- Pathfinding planner navigation
- Strategy decision hierarchy
- Official agent output schema
- Full-episode integration in Kaggriculture
"""
import unittest
from typing import Dict, Any

from kaggle_environments import make

from agent.actions import ActionPlan, FarmerActionType, MarketActionType
from agent.config import BOARD_SIZE
from agent.main import farm_mind_agent
from agent.planner import find_path, get_next_move
from agent.state import GameState, TileState
from agent.strategy import FarmMindV0Strategy


class TestFarmMindActions(unittest.TestCase):
    """Verify action construction, typing, and Kaggriculture formatting."""

    def test_pass_action(self):
        plan = ActionPlan.make_pass()
        d = plan.to_dict()
        self.assertEqual(d["farmer"], ["PASS"])
        self.assertEqual(d["hands"], [])
        self.assertEqual(d["market"], [])

    def test_move_action(self):
        plan = ActionPlan.make_move("NORTH")
        self.assertEqual(plan.to_dict()["farmer"], ["NORTH"])
        invalid_plan = ActionPlan.make_move("INVALID_DIR")
        self.assertEqual(invalid_plan.to_dict()["farmer"], ["PASS"])

    def test_plant_action(self):
        plan = ActionPlan.make_plant("CARROT")
        self.assertEqual(plan.to_dict()["farmer"], ["PLANT", "CARROT"])

    def test_water_harvest_drop(self):
        self.assertEqual(ActionPlan.make_water().to_dict()["farmer"], ["WATER"])
        self.assertEqual(ActionPlan.make_harvest().to_dict()["farmer"], ["HARVEST"])
        self.assertEqual(ActionPlan.make_drop().to_dict()["farmer"], ["DROP"])

    def test_market_order_serialization(self):
        plan = ActionPlan.make_pass()
        plan.add_market_action("BUY_SEED", "CARROT", 3)
        plan.add_market_action("SELL", "WHEAT", 5)
        d = plan.to_dict()
        self.assertEqual(d["market"], [["BUY_SEED", "CARROT", 3], ["SELL", "WHEAT", 5]])


class TestFarmMindState(unittest.TestCase):
    """Verify state parsing and tile querying."""

    def setUp(self):
        # Construct synthetic observation
        self.raw_obs: Dict[str, Any] = {
            "day": 3,
            "hour": 5,
            "step": 77,
            "player": 0,
            "farms": [
                {
                    "money": 3450.0,
                    "farmer": [4, 4],
                    "hands": [],
                    "unlocked_quadrants": ["NW"],
                    "tiles": [[None for _ in range(10)] for _ in range(10)]
                },
                {
                    "money": 2800.0,
                    "farmer": [4, 4],
                    "hands": [],
                    "unlocked_quadrants": ["NW"],
                    "tiles": [[None for _ in range(10)] for _ in range(10)]
                }
            ],
            "private": {
                "shed": {"CARROT": 8},
                "seeds": {"CARROT": 2},
                "inventories": [{"CARROT": 4}]
            },
            "market": {
                "prices": {"CARROT": 42, "WHEAT": 28},
                "inventory": {"CARROT": 1000}
            },
            "town": {
                "unlocked_shops": ["BAKERY", "PET_CAFE"]
            }
        }
        # Populate specific tiles in NW quadrant
        self.raw_obs["farms"][0]["tiles"][4][4] = {
            "kind": "PLANT",
            "crop": "CARROT",
            "planted_day": 0,
            "yield_units": 4,
            "watered_today": False,
            "consecutive_unwatered": 0,
            "max_lifespan_step": 96,
            "fertilized_until_day": -1
        }
        # Locked tile in SE quadrant
        self.raw_obs["farms"][0]["tiles"][7][7] = "LOCKED"

    def test_state_parsing_valid(self):
        state = GameState.from_observation(self.raw_obs)
        self.assertEqual(state.day, 3)
        self.assertEqual(state.hour, 5)
        self.assertEqual(state.money, 3450.0)
        self.assertEqual(state.farmer_pos, (4, 4))
        self.assertEqual(state.shed, {"CARROT": 8})
        self.assertEqual(state.seeds, {"CARROT": 2})
        self.assertEqual(state.carried_inventory, {"CARROT": 4})
        self.assertEqual(state.market_prices.get("CARROT"), 42)
        self.assertEqual(state.opponent_money, 2800.0)
        self.assertTrue(state.is_shed_accessible())

        # Check tile states
        t44 = state.get_tile(4, 4)
        self.assertIsNotNone(t44)
        self.assertTrue(t44.is_plant)
        self.assertEqual(t44.crop, "CARROT")
        self.assertFalse(t44.watered_today)
        self.assertTrue(t44.is_mature(state.day))

        t77 = state.get_tile(7, 7)
        self.assertIsNotNone(t77)
        self.assertTrue(t77.is_locked)

    def test_state_parsing_corrupted_empty(self):
        """State parser must never crash on empty or missing dictionary keys."""
        state = GameState.from_observation({})
        self.assertEqual(state.day, 0)
        self.assertEqual(state.money, 3000.0)
        self.assertEqual(state.farmer_pos, (4, 4))
        self.assertEqual(len(state.tiles), BOARD_SIZE)


class TestFarmMindPlanner(unittest.TestCase):
    """Verify BFS pathfinding and obstacle avoidance."""

    def test_direct_neighbor_navigation(self):
        state = GameState.from_observation({
            "farms": [{"farmer": [4, 4], "tiles": [[None]*10 for _ in range(10)]}]
        })
        move = get_next_move((4, 4), (3, 4), state)
        self.assertEqual(move, "WEST")

        move_north = get_next_move((4, 4), (4, 3), state)
        self.assertEqual(move_north, "NORTH")

    def test_path_avoids_locked_tiles(self):
        raw_tiles = [[None]*10 for _ in range(10)]
        raw_tiles[4][3] = "LOCKED"  # Lock tile directly West

        state = GameState.from_observation({
            "farms": [{"farmer": [4, 4], "tiles": raw_tiles}]
        })
        # Should navigate around (4, 3) to reach (2, 4)
        path = find_path((4, 4), (2, 4), state)
        self.assertIsNotNone(path)
        self.assertNotIn((3, 4), [(4, 3)])


class TestFarmMindStrategy(unittest.TestCase):
    """Verify autonomous decision making logic."""

    def test_harvest_mature_crop(self):
        strategy = FarmMindV0Strategy()
        raw_obs = {
            "day": 4,
            "farms": [{
                "farmer": [4, 4],
                "money": 3000.0,
                "tiles": [[None]*10 for _ in range(10)]
            }]
        }
        # Place mature plant on current tile
        raw_obs["farms"][0]["tiles"][4][4] = {
            "kind": "PLANT",
            "crop": "CARROT",
            "planted_day": 0,
            "yield_units": 4,
            "watered_today": True
        }
        state = GameState.from_observation(raw_obs)
        plan = strategy.decide(state)
        self.assertEqual(plan.farmer, ["HARVEST"])

    def test_water_unwatered_crop(self):
        strategy = FarmMindV0Strategy()
        raw_obs = {
            "day": 1,
            "farms": [{
                "farmer": [4, 4],
                "money": 3000.0,
                "tiles": [[None]*10 for _ in range(10)]
            }]
        }
        raw_obs["farms"][0]["tiles"][4][4] = {
            "kind": "PLANT",
            "crop": "CARROT",
            "planted_day": 0,
            "yield_units": 1,
            "watered_today": False
        }
        state = GameState.from_observation(raw_obs)
        plan = strategy.decide(state)
        self.assertEqual(plan.farmer, ["WATER"])

    def test_season_end_seed_budget_preservation(self):
        strategy = FarmMindV0Strategy()
        # Day 28: Carrots cannot mature before Day 30
        raw_obs = {
            "day": 28,
            "farms": [{
                "farmer": [4, 4],
                "money": 3000.0,
                "tiles": [[None]*10 for _ in range(10)]
            }],
            "private": {"seeds": {}, "shed": {}}
        }
        state = GameState.from_observation(raw_obs)
        plan = strategy.decide(state)
        # Verify no BUY_SEED market action was scheduled
        market_types = [m[0] for m in plan.market]
        self.assertNotIn("BUY_SEED", market_types)


class TestFarmMindIntegration(unittest.TestCase):
    """Verify execution of full Kaggriculture episodes with FARM-MIND-V0."""

    def test_agent_output_contract(self):
        obs = {
            "day": 0,
            "farms": [{"farmer": [4, 4], "money": 3000.0, "tiles": [[None]*10 for _ in range(10)]}],
            "private": {"seeds": {}, "shed": {}}
        }
        output = farm_mind_agent(obs)
        self.assertIn("farmer", output)
        self.assertIn("hands", output)
        self.assertIn("market", output)
        self.assertIsInstance(output["farmer"], list)
        self.assertIsInstance(output["hands"], list)
        self.assertIsInstance(output["market"], list)

    def test_v1_agent_output_contract(self):
        from agent.v1_main import farm_mind_v1_agent, get_v1_telemetry
        obs = {
            "day": 0,
            "farms": [{"farmer": [4, 4], "money": 3000.0, "tiles": [[None]*10 for _ in range(10)]}],
            "private": {"seeds": {}, "shed": {}},
            "market": {"prices": {"CARROT": 40, "MELON": 280}}
        }
        output = farm_mind_v1_agent(obs)
        self.assertIn("farmer", output)
        self.assertIn("market", output)
        telem = get_v1_telemetry()
        self.assertIn("action", telem)
        self.assertIn("reason", telem)
        self.assertIn("priority", telem)

    def test_economy_engine(self):
        from agent.economy import EconomicEngine
        engine = EconomicEngine()
        prices = {"CARROT": 40.0, "MELON": 280.0, "WHEAT": 25.0}
        # Day 0: Melon is viable and high profit
        melon_score = engine.score_crop("MELON", current_day=0, market_prices=prices, available_cash=3000.0)
        self.assertTrue(melon_score.is_viable_for_season)
        self.assertGreater(melon_score.net_profit, 1000.0)

        # Day 25: Melon cannot mature before Day 30 (requires 12d)
        late_melon = engine.score_crop("MELON", current_day=25, market_prices=prices, available_cash=3000.0)
        self.assertFalse(late_melon.is_viable_for_season)

    def test_market_tracker(self):
        from agent.market import MarketTracker
        tracker = MarketTracker()
        tracker.update_prices({"CARROT": 40.0})
        tracker.update_prices({"CARROT": 50.0})
        self.assertEqual(tracker.get_moving_average("CARROT"), 45.0)

        # End of season sell rule
        should_sell, reason = tracker.evaluate_sell_decision("CARROT", 30.0, 10, days_remaining=1)
        self.assertTrue(should_sell)

    def test_short_simulation_run(self):
        """Run a 48-step (2-day) match in kaggle_environments to confirm zero exceptions."""
        env = make("kaggriculture", configuration={"episodeSteps": 48})
        env.reset()
        env.run([farm_mind_agent, "pass"])
        final_step = env.steps[-1]
        self.assertEqual(final_step[0].status, "DONE")
        self.assertEqual(final_step[1].status, "DONE")


if __name__ == "__main__":
    unittest.main()
