# 🌾 FARM-MIND

> **An inspectable autonomous farming agent for Kaggriculture — built to simulate, understand, measure, and evolve decision-making systems.**

<p align="center">
  <a href="https://manikumarkundena.vercel.app">Portfolio</a> ·
  <a href="https://github.com/manikumarkundena/FARM-MIND">GitHub</a> ·
  <a href="https://www.kaggle.com/competitions/kaggriculture">Kaggriculture</a>
</p>

<p align="center"><strong>Observe → Evaluate → Plan → Act → Measure</strong></p>

---

## 🧠 What is FARM-MIND?

FARM-MIND is an autonomous decision-making agent built for **Kaggle's Kaggriculture** farming simulation.

Instead of hard-coding one long sequence of farming actions, the agent repeatedly observes the environment, evaluates economics and market conditions, plans movement, executes an action, and records telemetry for replay.

### The core loop

~~~text
OBSERVE → EVALUATE → PLAN → ACT → RECORD → REPEAT
~~~

> **V1 is intentionally transparent and heuristic.** It does not claim reinforcement learning, deep learning, predictive ML, or LLM-based decision-making.

---

# ⚡ Project at a glance

| | FARM-MIND V1 |
|---|---|
| Environment | Kaggriculture |
| Board | 10 × 10 |
| Horizon | 720 turns / 30 days |
| Strategy | Economic + rule-based |
| Navigation | BFS |
| Market model | Observed rolling prices + explicit sell rules |
| Production | 7-tile contiguous cluster |
| Agent runtime | Python |
| Research UI | Next.js + React + Three.js |
| Current state | **V1 submitted to Kaggriculture** |

---

# 🏗️ Architecture

FARM-MIND separates **state representation, economics, planning, strategy, execution, and inspection**.

~~~text
                    KAGGRICULTURE
                         │
                         │ observation
                         ▼
                 ┌─────────────────┐
                 │   GameState     │
                 │ observation     │
                 │ parser          │
                 └────────┬────────┘
                          │
          ┌───────────────┼────────────────┐
          ▼               ▼                ▼
   ┌────────────┐  ┌──────────────┐  ┌──────────────┐
   │   Market   │  │   Economy    │  │    Planner   │
   │  Tracker   │  │    Engine    │  │     BFS      │
   │ prices +   │  │ crop score + │  │ grid route + │
   │ sell rules │  │ viability    │  │ next step    │
   └─────┬──────┘  └──────┬───────┘  └──────┬───────┘
         └─────────────────┼─────────────────┘
                           ▼
                 ┌──────────────────┐
                 │ FarmMindV1       │
                 │ Strategy         │
                 │ priorities +     │
                 │ action selection │
                 └────────┬─────────┘
                          ▼
                    ┌────────────┐
                    │ ActionPlan │
                    └─────┬──────┘
                          ▼
                    KAGGRICULTURE
                          │
                          ▼
                    next observation
~~~

---

# 🌱 V1 strategy

V1 is the first FARM-MIND version with dynamic economic behaviour.

### Production
- **7-tile contiguous production cluster** around the starting shed.
- Dynamic crop selection instead of fixed monoculture.
- Crop scoring considers seed cost, expected yield, observed market price, expected revenue, estimated profit, maturity and remaining horizon.

### Market behaviour
MarketTracker maintains observed price history and applies explicit selling rules based on season timing, shed capacity, inventory and recent observed prices.

This is **rule-based market adaptation**, not a predictive price model.

### Navigation
The planner uses **Breadth-First Search (BFS)** over the grid to find a valid next movement direction toward the current target.

### Execution safety
- Environment-compatible ActionPlan
- Deterministic decision flow
- Safe PASS fallback for unexpected runtime failures
- Per-turn telemetry aligned with the action returned to the simulator

---

# 🔬 Research & inspection layer

The frontend is an inspection layer around recorded experiment and replay data — not a fake live dashboard.

### SIMULATE
Inspect a recorded **720-turn** episode through an interactive farm visualization.

### UNDERSTAND
Follow **Observe → Evaluate → Plan → Act** and inspect action-level decision telemetry.

### EVOLVE
Compare recorded V0 and V1 experiments using identical seeded episode ranges.

---

# 📊 Recorded benchmark evidence

Experiments were run on seeds **500–509**.

| Experiment | Episodes | Recorded result | Invalid actions |
|---|---:|---:|---:|
| V0 vs Starter | 10 | 10/10 wins · mean final cash **4,655.6** | 0 |
| V1 vs Starter | 10 | 10/10 wins · mean final cash **22,954.1** | 0 |
| V1 vs V0 | 10 | 10/10 wins · mean final cash **22,811.1** | 0 |

These are **recorded local benchmark observations**, not guarantees for the live Kaggriculture leaderboard.

---

# 🧪 Replay integrity

A recorded 720-turn replay was validated with:

~~~text
Step count          PASS
Telemetry alignment PASS
Action alignment    PASS
Target consistency  PASS
Total errors        0
~~~

The validator checks that replay telemetry corresponds to the action that generated the following environment state.

Implementation: evaluation/replay_validator.py

---

# 🛠️ Technology stack

## Agent / simulation
- **Python 3.12**
- **Kaggle Environments**
- kaggle-environments==1.32.7
- Typed Python modules / dataclasses
- BFS path planning
- Deterministic heuristic decision-making

## Decision modules

~~~text
agent/
├── state.py          → observation → GameState
├── economy.py        → crop economic scoring
├── market.py         → price history + selling rules
├── planner.py        → BFS navigation
├── strategy_v1.py    → V1 decision policy
├── actions.py        → ActionPlan + action types
├── config.py         → environment / strategy constants
└── v1_main.py        → runtime agent
~~~

## Research interface
- **Next.js 16**
- **React 19**
- **TypeScript**
- **Three.js**
- **React Three Fiber**
- **@react-three/drei**
- **Framer Motion**
- **Recharts**
- **Lucide React**
- Responsive CSS visual system

The frontend provides replay, telemetry inspection, architecture visualization and experiment comparison. The Kaggle submission itself contains only the lightweight Python runtime.

---

# 📁 Repository structure

~~~text
FARM-MIND/
│
├── main.py                         # Kaggriculture V1 entry point
├── requirements.txt                # Python runtime dependency
│
├── agent/                          # Autonomous decision core
│   ├── actions.py
│   ├── config.py
│   ├── economy.py
│   ├── market.py
│   ├── planner.py
│   ├── state.py
│   ├── strategy.py                 # V0 baseline
│   ├── strategy_v1.py              # V1 strategy
│   └── v1_main.py
│
├── evaluation/                     # Simulation + replay validation
├── experiments/                    # Recorded benchmark metadata
├── app/                            # Next.js App Router
├── components/                     # 3D scene, replay, inspector, evolution
├── hooks/                          # Replay hooks
├── lib/                            # Frontend data helpers
└── public/
    ├── replay_test.json
    └── experiments.json
~~~

---

# 🚀 Run FARM-MIND locally

## Python agent

### Windows PowerShell

~~~powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
~~~

### Run a complete 720-turn local episode

~~~powershell
python -c "from kaggle_environments import make; env=make('kaggriculture', configuration={'episodeSteps':720}, debug=True); env.run(['main.py','random']); print([(s.reward,s.status) for s in env.steps[-1]])"
~~~

A successful run finishes with both agents in DONE status.

## Research interface

~~~bash
npm install
npm run dev
~~~

Production build:

~~~bash
npm run build
npm start
~~~

---

# 📦 Kaggriculture submission

The competition runtime is intentionally smaller than the research repository.

The clean submission contains:

~~~text
main.py
requirements.txt
agent/
~~~

with main.py at the archive root.

Before submission, V1 was tested from an **isolated clean package** for a complete 720-turn episode. The final archive was farm-mind-v1.tar.gz.

Submission command:

~~~bash
kaggle competitions submit kaggriculture -f farm-mind-v1.tar.gz -m "FARM-MIND V1"
~~~

**Current state:** V1 has been uploaded to Kaggriculture. The last observed Kaggle CLI status was PENDING while validation was being processed.

---

# 🗓️ Competition timeline

At the time of the V1 submission:

- **Entry deadline:** September 23, 2026 — 11:59 PM UTC
- **Team merger deadline:** September 23, 2026 — 11:59 PM UTC
- **Final submission deadline:** September 30, 2026 — 11:59 PM UTC

Official competition information:

https://www.kaggle.com/competitions/kaggriculture

---

# 🎯 Design principles

### Inspectable over opaque
Expose state, objective, action and reason instead of presenting a black-box “AI score”.

### Evidence over hype
Benchmark recorded runs and keep seeds, opponents and results explicit.

### Deterministic where possible
Use identical seeds when comparing strategy versions.

### Research layer ≠ competition runtime
Keep the Kaggle agent lightweight while the Next.js interface provides replay and analysis.

### Strategy changes must earn their place
A new strategy version should replace the current candidate only after independent benchmarking and validation.

---

# 🧭 Roadmap

- [x] Kaggriculture V0 baseline
- [x] V1 economic strategy
- [x] Market-aware selling rules
- [x] BFS navigation
- [x] Decision telemetry
- [x] 720-turn replay
- [x] Replay integrity validator
- [x] Seeded V0/V1 experiments
- [x] Interactive 3D research interface
- [x] Clean V1 submission package
- [x] Kaggriculture V1 submission
- [ ] Kaggle validation result
- [ ] V2 benchmark and comparison
- [ ] Further strategy iterations based on measured evidence

---

# 👨‍💻 Author

**Manikumar Kundena**

Computer Science & Engineering · Siddaganga Institute of Technology

🌐 **Portfolio:** https://manikumarkundena.vercel.app  
💻 **GitHub:** https://github.com/manikumarkundena/FARM-MIND  
🏆 **Kaggriculture:** https://www.kaggle.com/competitions/kaggriculture

---

<p align="center">
  <strong>FARM-MIND</strong><br/>
  <sub>Observe the environment. Evaluate the economics. Plan the action. Measure the result.</sub>
</p>
