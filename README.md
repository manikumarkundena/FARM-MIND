# FARM-MIND

> A research-grade simulation and decision-inspection platform for autonomous agricultural agents.

FARM-MIND turns an agent-versus-agent Kaggriculture simulation into an inspectable research workspace. Instead of treating a simulation as a black box, the platform exposes the match, decisions, economic state, opponent behaviour, experiments, capital trajectory, architecture, and telemetry in one interface.

## Why FARM-MIND?

Autonomous agents are easiest to evaluate when you can see **what they decided, why they decided it, and what happened afterward**.

FARM-MIND is built around that idea: run a deterministic benchmark, inspect the decision trace, study the economic consequences, compare opponents, and use experiments to investigate agent behaviour.

## What You Can Explore

- **Command Center** — high-level view of the current simulation and research state.
- **Live Match Arena** — step through a recorded match or run a new head-to-head simulation.
- **Decision Inspector** — inspect the agent's decision process at individual turns.
- **Experiment Lab** — browse recorded experiments and launch new runs.
- **Economic Intelligence** — examine the financial/economic state produced by the simulation.
- **Opponent Analysis** — investigate behaviour from the opposing agent.
- **Capital Trajectory** — follow capital and reward evolution through the match.
- **System Architecture** — inspect how the research platform is structured.
- **Telemetry Console** — inspect simulation logs and runtime information.

## Research Workflow

```text
Configure agents + seed
        ↓
Run deterministic simulation
        ↓
Capture match history
        ↓
Inspect decisions + economic state
        ↓
Compare opponent behaviour
        ↓
Record experiment
        ↓
Analyze trajectory + telemetry
```

The UI loads recorded experiments and benchmark data through the application API and can execute a new head-to-head run with configurable agents, seed, steps, and episode count.

## Architecture

```text
┌──────────────────────────────────────────────┐
│                 FARM-MIND UI                 │
│                                              │
│ Command Center • Live Match • Inspector      │
│ Experiments • Economics • Opponent Analysis  │
│ Trajectory • Architecture • Telemetry        │
└──────────────────────┬───────────────────────┘
                       │ HTTP API
                       ▼
┌──────────────────────────────────────────────┐
│              Simulation / API Layer          │
│                                              │
│ Match execution • Recorded matches           │
│ Experiments • Profiler / telemetry           │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
              Kaggriculture engine
```

The frontend is organized around focused research views rather than a single dashboard. The main application coordinates navigation, simulation state, recorded match data, experiment records, profiler data, and API calls.

## Tech Stack

### Frontend

- React + TypeScript
- Vite
- Tailwind CSS
- Lucide React
- Recharts

### Runtime / API integration

- Python 3.10+ decision core
- HTTP API endpoints for simulations, experiments, recorded matches, and profiler data

## Getting Started

### Prerequisites

- Node.js
- Python 3.10+
- The repository's backend/API environment configured for the simulation engine

### Install frontend dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

The frontend expects the API endpoints used by the application, including:

```text
GET  /api/experiments
GET  /api/profiler
GET  /api/recorded-match
POST /api/run
```

For a production build:

```bash
npm run build
```

## Running an Experiment

From the **Run Experiment** flow, select the two agents, choose a seed and number of steps, and execute the simulation.

FARM-MIND then surfaces the resulting match through the research views so that the run can be examined beyond the final reward.

For reproducible analysis, the application supports deterministic seeded matches and includes a recorded benchmark match for inspection.

## Project Structure

```text
src/
├── components/
│   ├── CommandCenter.tsx
│   ├── LiveMatch.tsx
│   ├── DecisionInspector.tsx
│   ├── ExperimentLab.tsx
│   ├── EconomicIntelligence.tsx
│   ├── OpponentAnalysis.tsx
│   ├── CapitalTrajectory.tsx
│   ├── ArchitectureView.tsx
│   ├── SystemLogConsole.tsx
│   └── ...
├── hooks/
│   └── simulation / data hooks
├── types.ts
└── App.tsx
```

The component boundaries intentionally mirror the questions a researcher asks while evaluating an autonomous agent: **what happened, what was decided, why did it happen, how did the opponent respond, and what was the economic outcome?**

## Design Principles

**Inspectable over opaque** — expose intermediate state instead of only showing a final score.

**Deterministic where possible** — seeded runs make behaviour easier to reproduce and compare.

**Experiment-driven** — simulation runs should become evidence that can be revisited and compared.

**Decision-first analysis** — rewards matter, but the path taken to reach them matters too.

## Current Benchmark Signals

The interface exposes benchmark metadata such as the simulation seed, turn-level capital, reward information, invalid-action rate, and measured latency when those values are available from the simulation record.

These values should be interpreted as **results of a particular benchmark/run**, not universal claims about every possible configuration.

## Status

FARM-MIND is an active research/prototyping platform focused on making autonomous-agent simulation behaviour easier to run, inspect, and communicate.

## License

No license is currently specified in the repository. Check the repository before using or redistributing the project.
