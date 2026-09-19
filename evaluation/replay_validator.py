"""
FARM-MIND Replay Validator.

Validates that:
1. Environment actions are aligned with telemetry.
2. Decision steps map correctly to action steps.
3. Target tiles/crops are internally consistent.
4. Replay contains the expected number of steps.
5. Initial-state telemetry is handled explicitly.

This validator is intentionally conservative.
It validates the replay structure rather than claiming that
the strategy itself is optimal.
"""

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List, Optional


DIRECTION_ACTIONS = {
    "NORTH",
    "SOUTH",
    "EAST",
    "WEST",
}

PHYSICAL_ACTIONS = {
    "PASS",
    "NORTH",
    "SOUTH",
    "EAST",
    "WEST",
    "WATER",
    "HARVEST",
    "PLANT",
    "CLEAR",
    "DROP",
}

MARKET_ONLY_ALLOWED = {
    "PASS",
}


def load_replay(path: str) -> Dict[str, Any]:
    """
    Load replay JSON while handling common Windows encodings.

    Supports:
    - UTF-8
    - UTF-8 with BOM
    - UTF-16 LE/BE
    """

    with open(path, "rb") as file:
        raw = file.read()

    # UTF-16 LE / BE BOM
    if raw.startswith(b"\xff\xfe") or raw.startswith(b"\xfe\xff"):
        text = raw.decode("utf-16")

    # UTF-8 BOM
    elif raw.startswith(b"\xef\xbb\xbf"):
        text = raw.decode("utf-8-sig")

    # Normal UTF-8
    else:
        text = raw.decode("utf-8")

    return json.loads(text)


def normalize_action(action: Any) -> str:
    """
    Normalize action values into strings.

    Examples:
        ["WATER"]       -> WATER
        ["PLANT","MELON"] -> PLANT MELON
        "WATER"         -> WATER
        None            -> PASS
    """

    if action is None:
        return "PASS"

    if isinstance(action, str):
        return action

    if isinstance(action, list):

        if not action:
            return "PASS"

        return " ".join(
            str(part)
            for part in action
        )

    return str(action)


def get_telemetry(
    snapshot: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Return telemetry dictionary if present."""

    telemetry = snapshot.get(
        "telemetry"
    )

    if not isinstance(
        telemetry,
        dict,
    ):
        return None

    return telemetry


def validate_step_alignment(
    history: List[Dict[str, Any]],
) -> List[str]:
    """
    Validate replay-step ↔ telemetry-step alignment.

    Expected structure after the new runner:

        snapshot.action_step == snapshot.step

        telemetry.step == snapshot.decision_step

        decision_step == action_step - 1

    Step 0 is special and may contain INITIAL_STATE.
    """

    errors: List[str] = []

    for index, snapshot in enumerate(history):

        step = snapshot.get(
            "step"
        )

        if step is None:
            errors.append(
                f"history[{index}] missing step"
            )
            continue

        action_step = snapshot.get(
            "action_step"
        )

        decision_step = snapshot.get(
            "decision_step"
        )

        telemetry = get_telemetry(
            snapshot
        )

        # ----------------------------------------------------------
        # Step 0
        # ----------------------------------------------------------

        if step == 0:

            if telemetry:

                telemetry_action = normalize_action(
                    telemetry.get("action")
                )

                if telemetry_action not in {
                    "INITIAL_STATE",
                    "PASS",
                }:

                    errors.append(
                        "step 0 has unexpected "
                        f"telemetry action: "
                        f"{telemetry_action}"
                    )

            continue

        # ----------------------------------------------------------
        # Action step
        # ----------------------------------------------------------

        if (
            action_step is not None
            and action_step != step
        ):

            errors.append(
                f"step {step}: "
                f"action_step={action_step}"
            )

        # ----------------------------------------------------------
        # Telemetry alignment
        # ----------------------------------------------------------

        if telemetry is None:

            errors.append(
                f"step {step}: missing telemetry"
            )

            continue

        telemetry_step = telemetry.get(
            "step"
        )

        if (
            telemetry_step is not None
            and decision_step is not None
            and telemetry_step != decision_step
        ):

            errors.append(
                f"step {step}: "
                f"telemetry.step={telemetry_step}, "
                f"decision_step={decision_step}"
            )

        if (
            decision_step is not None
            and decision_step != step - 1
        ):

            errors.append(
                f"step {step}: "
                f"decision_step={decision_step}, "
                f"expected={step - 1}"
            )

    return errors


def validate_action_alignment(
    history: List[Dict[str, Any]],
) -> List[str]:
    """
    Validate physical action ↔ telemetry action.

    Market-only decisions are allowed to have:

        environment action = PASS
        market_orders != []
        telemetry action = PASS

    This is intentional because market orders are represented
    separately from farmer actions.
    """

    errors: List[str] = []

    for snapshot in history:

        step = snapshot.get(
            "step",
            "?",
        )

        if step == 0:
            continue

        environment_action = normalize_action(
            snapshot.get("action")
        )

        telemetry = get_telemetry(
            snapshot
        )

        if telemetry is None:
            continue

        telemetry_action = normalize_action(
            telemetry.get("action")
        )

        market_orders = snapshot.get(
            "market_orders",
            [],
        )

        # ----------------------------------------------------------
        # Physical action
        # ----------------------------------------------------------

        if (
            environment_action
            != telemetry_action
        ):

            # Allow a telemetry action to describe a movement/action
            # only when it is a valid physical action.
            #
            # We do NOT silently accept arbitrary mismatches.

            if not (
                environment_action == "PASS"
                and telemetry_action == "PASS"
                and market_orders
            ):

                errors.append(
                    f"step {step}: "
                    f"environment action="
                    f"{environment_action!r}, "
                    f"telemetry action="
                    f"{telemetry_action!r}"
                )

    return errors


def validate_target_consistency(
    history: List[Dict[str, Any]],
) -> List[str]:
    """
    Validate action-specific target metadata.

    WATER:
        target_tile should match farmer position.

    HARVEST:
        target_tile should match farmer position.

    PLANT:
        target_tile should match farmer position.

    Navigation:
        target_tile should exist.

    PASS:
        target tile may be None.
    """

    errors: List[str] = []

    for snapshot in history:

        step = snapshot.get(
            "step",
            "?",
        )

        if step == 0:
            continue

        telemetry = get_telemetry(
            snapshot
        )

        if telemetry is None:
            continue

        action = normalize_action(
            telemetry.get("action")
        )

        target_tile = telemetry.get(
            "target_tile"
        )

        target_crop = telemetry.get(
            "target_crop"
        )

        farmer_position = snapshot.get(
            "p0_pos"
        )

        # ----------------------------------------------------------
        # Validate tile shape
        # ----------------------------------------------------------

        if target_tile is not None:

            if (
                not isinstance(
                    target_tile,
                    list,
                )
                or len(target_tile) != 2
                or not all(
                    isinstance(value, int)
                    for value in target_tile
                )
            ):

                errors.append(
                    f"step {step}: "
                    f"invalid target_tile="
                    f"{target_tile!r}"
                )

        # ----------------------------------------------------------
        # WATER
        # ----------------------------------------------------------

        if action == "WATER":

            if target_tile is None:

                errors.append(
                    f"step {step}: WATER "
                    "has no target_tile"
                )

            if (
                farmer_position is not None
                and target_tile is not None
                and target_tile != farmer_position
            ):

                errors.append(
                    f"step {step}: WATER "
                    f"target={target_tile}, "
                    f"farmer={farmer_position}"
                )

            if not target_crop:

                errors.append(
                    f"step {step}: WATER "
                    "has no target_crop"
                )

        # ----------------------------------------------------------
        # HARVEST
        # ----------------------------------------------------------

        elif action == "HARVEST":

            if target_tile is None:

                errors.append(
                    f"step {step}: HARVEST "
                    "has no target_tile"
                )

            if (
                farmer_position is not None
                and target_tile is not None
                and target_tile != farmer_position
            ):

                errors.append(
                    f"step {step}: HARVEST "
                    f"target={target_tile}, "
                    f"farmer={farmer_position}"
                )

            if not target_crop:

                errors.append(
                    f"step {step}: HARVEST "
                    "has no target_crop"
                )

        # ----------------------------------------------------------
        # PLANT
        # ----------------------------------------------------------

        elif action.startswith(
            "PLANT "
        ):

            planted_crop = action.split(
                " ",
                1,
            )[1]

            if target_tile is None:

                errors.append(
                    f"step {step}: PLANT "
                    "has no target_tile"
                )

            if (
                farmer_position is not None
                and target_tile is not None
                and target_tile != farmer_position
            ):

                errors.append(
                    f"step {step}: PLANT "
                    f"target={target_tile}, "
                    f"farmer={farmer_position}"
                )

            if target_crop != planted_crop:

                errors.append(
                    f"step {step}: PLANT crop "
                    f"action={planted_crop}, "
                    f"target_crop={target_crop}"
                )

        # ----------------------------------------------------------
        # Navigation
        # ----------------------------------------------------------

        elif action in DIRECTION_ACTIONS:

            if target_tile is None:

                errors.append(
                    f"step {step}: navigation "
                    f"{action} has no target_tile"
                )

    return errors


def validate_replay(
    replay: Dict[str, Any],
) -> Dict[str, Any]:
    """Run all replay integrity checks."""

    history = replay.get(
        "history",
        [],
    )

    if not isinstance(
        history,
        list,
    ):

        raise ValueError(
            "Replay history is not a list."
        )

    expected_steps = replay.get(
        "steps_run"
    )

    alignment_errors = (
        validate_step_alignment(
            history
        )
    )

    action_errors = (
        validate_action_alignment(
            history
        )
    )

    target_errors = (
        validate_target_consistency(
            history
        )
    )

    errors = (
        alignment_errors
        + action_errors
        + target_errors
    )

    return {
        "history_length": len(history),
        "expected_steps": expected_steps,
        "step_count_ok": (
            expected_steps is None
            or len(history) == expected_steps
        ),
        "alignment_errors": alignment_errors,
        "action_errors": action_errors,
        "target_errors": target_errors,
        "total_errors": len(errors),
        "valid": (
            len(errors) == 0
            and (
                expected_steps is None
                or len(history) == expected_steps
            )
        ),
    }


def print_report(
    result: Dict[str, Any],
) -> None:
    """Print a readable validation report."""

    print()
    print("=" * 64)
    print("FARM-MIND REPLAY VALIDATION")
    print("=" * 64)

    print()

    print(
        f"History steps        : "
        f"{result['history_length']}"
    )

    print(
        f"Expected steps       : "
        f"{result['expected_steps']}"
    )

    print()

    print(
        "Step count            : "
        + (
            "PASS"
            if result["step_count_ok"]
            else "FAIL"
        )
    )

    print(
        "Telemetry alignment   : "
        + (
            "PASS"
            if not result["alignment_errors"]
            else "FAIL"
        )
    )

    print(
        "Action alignment      : "
        + (
            "PASS"
            if not result["action_errors"]
            else "FAIL"
        )
    )

    print(
        "Target consistency    : "
        + (
            "PASS"
            if not result["target_errors"]
            else "FAIL"
        )
    )

    print()

    print(
        f"Total validation errors: "
        f"{result['total_errors']}"
    )

    print()

    if result["valid"]:

        print(
            "RESULT: REPLAY INTEGRITY VERIFIED"
        )

    else:

        print(
            "RESULT: REPLAY VALIDATION FAILED"
        )

        print()

        all_errors = (
            result["alignment_errors"]
            + result["action_errors"]
            + result["target_errors"]
        )

        # Avoid flooding the terminal.
        for error in all_errors[:50]:
            print(
                f"  - {error}"
            )

        if len(all_errors) > 50:
            print(
                f"  ... and "
                f"{len(all_errors) - 50} more errors"
            )

    print()
    print("=" * 64)
    print()


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Validate a FARM-MIND replay."
        )
    )

    parser.add_argument(
        "replay",
        help="Path to replay JSON",
    )

    parser.add_argument(
        "--json",
        action="store_true",
        help="Print machine-readable JSON",
    )

    args = parser.parse_args()

    replay = load_replay(
        args.replay
    )

    result = validate_replay(
        replay
    )

    if args.json:

        print(
            json.dumps(
                result,
                indent=2,
            )
        )

    else:

        print_report(
            result
        )

    raise SystemExit(
        0 if result["valid"] else 1
    )


if __name__ == "__main__":
    main()