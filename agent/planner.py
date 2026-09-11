"""FARM-MIND Pathfinding and Navigation Planner.

Provides BFS pathfinding across the farm grid, safely navigating around
locked quadrants and boundary limits.
"""
from collections import deque
from typing import List, Optional, Tuple, Set

from agent.config import BOARD_SIZE, DIRECTIONS
from agent.state import GameState


def find_path(
    start: Tuple[int, int],
    target: Tuple[int, int],
    state: GameState,
    allowed_tiles: Optional[Set[Tuple[int, int]]] = None
) -> Optional[List[str]]:
    """Compute the shortest path of compass directions from start to target.
    
    Uses Breadth-First Search (BFS) on the grid. Avoids locked quadrant tiles.
    """
    if start == target:
        return []

    queue = deque([(start[0], start[1], [])])
    visited: Set[Tuple[int, int]] = {start}

    while queue:
        x, y, path = queue.popleft()

        for direction, (dx, dy) in DIRECTIONS.items():
            nx, ny = x + dx, y + dy

            if not (0 <= nx < BOARD_SIZE and 0 <= ny < BOARD_SIZE):
                continue

            neighbor = (nx, ny)
            if neighbor in visited:
                continue

            # Check if neighbor tile is locked
            tile = state.get_tile(nx, ny)
            if tile and tile.is_locked:
                continue

            # Optional restriction to allowed sub-area
            if allowed_tiles is not None and neighbor not in allowed_tiles and neighbor != target:
                continue

            new_path = path + [direction]
            if neighbor == target:
                return new_path

            visited.add(neighbor)
            queue.append((nx, ny, new_path))

    return None


def get_next_move(
    start: Tuple[int, int],
    target: Tuple[int, int],
    state: GameState
) -> Optional[str]:
    """Return the single next compass direction to move towards target."""
    path = find_path(start, target, state)
    if path and len(path) > 0:
        return path[0]
    return None
