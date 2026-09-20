# FARM-MIND

> An inspectable autonomous-agent research platform built around Kaggriculture.

FARM-MIND is a decision-making agent and replay workspace for the Kaggriculture farming simulation. The core agent observes game state, evaluates crop economics and market conditions, plans movement with BFS, chooses an action, and records decision telemetry for replay and analysis.

## What FARM-MIND demonstrates

- **Autonomous decision loop** — observation → economic evaluation → planning → action.
- **Dynamic crop economics** — crop selection uses seed cost, expected yield, market price, season timing, and estimated profit.
- **Empirical market logic** — rolling observed prices support price-aware liquidation rules.
- **BFS navigation** — movement targets are converted into valid next-step directions.
- **Decision telemetry** — each turn records action, reason, target tile, target crop, priority, objective, and market orders.
- **Replay integrity** — recorded 720-turn runs are checked for step, telemetry, action, and target consistency.
- **Experiment-driven development** — V0 and V1 are benchmarked on identical seed ranges.

The strategy is intentionally transparent and heuristic. FARM-MIND does **not** claim reinforcement learning, deep learning, or LLM-based decision making in the current V1 implementation.

## Kaggriculture

Kaggriculture is a two-player, turn-based farming simulation. A season contains **30 days × 24 turns = 720 turns**. Agents compete by maximizing money held at the end of the season.

The official competition requires a root-level `main.py` exposing an `agent` function. Multi-file submissions can be bundled as a `.tar.gz` with `main.py` at the root.

### Competition timeline

- Entry deadline: **September 23, 2026, 11:59 PM UTC**
- Team merger deadline: **September 23, 2026, 11:59 PM UTC**
- Final submission deadline: **September 30, 2026, 11:59 PM UTC**
- Post-deadline games / final evaluation: approximately October 1–15, 2026

Official timeline and submission rules:
https://www.kaggle.com/competitions/kaggriculture/overview/citation

## Agent architecture

`text
Kaggriculture observation
        │
        ▼
   GameState parser
        │
        ├── MarketTracker → rolling observed prices
        ├── EconomicEngine → crop scoring / viability
        └── BFS Planner → next movement step
        │
        ▼
   FarmMindV1Strategy
        │
        ├── market orders
        └── farmer action
        │
        ▼
      ActionPlan
        │
        ▼
   Kaggriculture engine
        │
        ▼
   next observation
`

## V1 strategy

FARM-MIND V1 uses:

- a contiguous **7-tile production cluster** around the starting shed;
- dynamic crop scoring rather than a fixed monoculture;
- price-aware selling based on observed rolling market history;
- harvest / water / clear / deposit priorities;
- BFS navigation toward the next physical task;
- deterministic fallback to `PASS` if an unexpected runtime error occurs;
- per-turn telemetry aligned with the action returned to the simulator.

Telemetry is descriptive: it records the strategy's selected rule and target. It should not be interpreted as proof that a decision is globally optimal.

## Recorded benchmark evidence

The repository contains recorded 10-episode experiments using seeds **500–509**:

| Experiment | Episodes | Recorded result |
|---|---:|---|
| V0 vs starter | 10 | 10/10 wins; mean final cash 4,655.6 |
| V1 vs starter | 10 | 10/10 wins; mean final cash 22,954.1 |
| V1 vs V0 | 10 | 10/10 wins; mean final cash 22,811.1 |

All three recorded experiments reported **0 invalid actions**.

These are benchmark observations from the specified seeds and opponent configurations, not guarantees for the live competition.

## Replay validation

The current recorded replay has been validated against the 720-turn contract:

`text
Step count          PASS
Telemetry alignment PASS
Action alignment    PASS
Target consistency  PASS
Total errors        0
`

Validation code lives in:

`evaluation/replay_validator.py`

## Repository structure

`text
FARM-MIND/
├── main.py                    # Kaggle submission entry point (V1)
├── agent/
│   ├── actions.py             # ActionPlan and action types
│   ├── config.py              # Environment / strategy constants
│   ├── economy.py             # Crop economic scoring
│   ├── market.py              # Observed-price tracking and sell rules
│   ├── planner.py             # BFS navigation
│   ├── state.py               # Kaggriculture observation parser
│   ├── strategy.py            # V0 baseline
│   ├── strategy_v1.py         # V1 strategy
│   └── v1_main.py             # V1 runtime entry point
├── evaluation/                # Local simulation + replay validation
├── experiments/               # Recorded benchmark metadata
├── components/                # Next.js research interface
├── app/                       # Next.js App Router
├── hooks/                     # Frontend replay hooks
├── lib/                       # Frontend data helpers
├── public/
│   ├── replay_test.json       # Recorded replay for the UI
│   └── experiments.json       # Experiment data for the UI
├── requirements.txt           # kaggle-environments pin
└── package.json
`

## Local setup

### Python agent environment

`bash
python -m venv .venv
# Windows PowerShell:
.\\.venv\\Scripts\\Activate.ps1

pip install -r requirements.txt
`

The project currently pins:

`text
kaggle-environments==1.32.7
`

### Verify the agent

Run a full 720-turn local episode:

`bash
python -c "from kaggle_environments import make; env=make('kaggriculture', configuration={'episodeSteps':720}, debug=True); env.run(['main.py','random']); print([(i,s.reward,s.status) for i,s in enumerate(env.steps[-1])])"
`

### Frontend

`bash
npm install
npm run dev
`

Production build:

`bash
npm run build
`

The interface focuses on three research experiences:

1. **SIMULATE** — inspect a recorded farm run.
2. **UNDERSTAND** — inspect action-level decision telemetry.
3. **EVOLVE** — compare recorded strategy experiments.

The frontend is intentionally based on recorded/verified data; it does not present an unimplemented live backend as if it exists.

## Kaggle submission

The root `main.py` delegates to the validated V1 agent.

For a multi-file submission, create a clean archive containing the runtime files and `main.py` at the archive root. Do not include `node_modules`, `.next`, `.git`, local virtual environments, screenshots, or development-only files.

Example:

`bash
tar -czf farm-mind-v1.tar.gz main.py agent requirements.txt
`

Then submit:

`bash
kaggle competitions submit kaggriculture -f farm-mind-v1.tar.gz -m "FARM-MIND V1"
`

After submission, check the validation episode and submission status.

## Design principles

**Inspectable over opaque** — expose what the agent observed and selected.

**Evidence over claims** — benchmark recorded runs instead of inventing performance claims.

**Deterministic where possible** — compare strategy changes using the same seed ranges.

**Small runtime, rich research layer** — the Kaggle submission contains the decision core; the Next.js interface is the inspection and communication layer.

## Status

FARM-MIND V1 is the current submission candidate. V2 experiments should only replace V1 after they are independently benchmarked and validated against the same environment.
