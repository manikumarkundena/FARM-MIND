"use client";

import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  GitBranch,
  Play,
} from "lucide-react";

import FarmScene from "@/components/FarmScene";
import SimulationLab from "@/components/SimulationLab";

export default function Home() {
  return (
    <main className="fm-site">

      {/* =====================================================
          NAVIGATION
          ===================================================== */}

      <header className="fm-nav">
        <a href="#" className="fm-brand">
          <span className="fm-brand-mark">FM</span>
          <span>FARM-MIND</span>
        </a>

        <nav className="fm-nav-links">
          <a href="#simulation">Simulation</a>
          <a href="#architecture">Architecture</a>
          <a href="#evolution">Evolution</a>
        </nav>

        <a
          href="#simulation"
          className="fm-nav-action"
        >
          EXPLORE
          <ArrowUpRight size={13} />
        </a>
      </header>


      {/* =====================================================
          HERO
          ===================================================== */}

      <section className="fm-hero">

        <div className="fm-hero-grid" />

        <motion.div
          className="fm-hero-copy"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="fm-eyebrow">
            AUTONOMOUS FARMING AGENT
          </div>

          <h1>
            FARM
            <span>MIND</span>
          </h1>

          <p className="fm-hero-description">
            An autonomous agent that manages resources,
            cultivates crops, navigates the environment,
            and adapts its decisions to market conditions.
          </p>

          <div className="fm-hero-actions">
            <a
              href="#simulation"
              className="fm-primary-action"
            >
              <Play size={13} fill="currentColor" />
              EXPLORE SIMULATION
            </a>

            <a
              href="#architecture"
              className="fm-secondary-action"
            >
              VIEW ARCHITECTURE
              <ArrowDownRight size={13} />
            </a>
          </div>
        </motion.div>


        {/* ===================================================
            WORLD PREVIEW
            =================================================== */}

        <motion.div
          className="fm-world"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 1.1,
            delay: 0.15,
          }}
        >
          <div className="fm-world-label">
  <span>SIMULATION ENVIRONMENT</span>
  <strong>KAGGRICULTURE</strong>
</div>

<div className="fm-world-canvas">
  <FarmScene replayStep={null} />
</div>

          <div className="fm-world-meta">

            <div>
              <span>BOARD</span>
              <strong>10 × 10</strong>
            </div>

            <div>
              <span>HORIZON</span>
              <strong>720 TURNS</strong>
            </div>

            <div>
              <span>AGENT</span>
              <strong>FARM-MIND V1</strong>
            </div>

          </div>
        </motion.div>

      </section>


      {/* =====================================================
          CAPABILITY STRIP
          ===================================================== */}

      <section className="fm-capabilities">

        <div className="fm-section-index">
          01 / CAPABILITIES
        </div>

        <div className="fm-capability-list">

          <div className="fm-capability">
            <span>01</span>

            <div>
              <strong>STATE PARSING</strong>

              <p>
                Converts environment observations into
                structured game state.
              </p>
            </div>
          </div>


          <div className="fm-capability">
            <span>02</span>

            <div>
              <strong>ECONOMIC SCORING</strong>

              <p>
                Evaluates crop choices using cost,
                yield, revenue and remaining time.
              </p>
            </div>
          </div>


          <div className="fm-capability">
            <span>03</span>

            <div>
              <strong>PATH PLANNING</strong>

              <p>
                Uses grid-based navigation to reach
                productive targets.
              </p>
            </div>
          </div>


          <div className="fm-capability">
            <span>04</span>

            <div>
              <strong>MARKET DECISIONS</strong>

              <p>
                Tracks market prices and applies
                explicit selling rules.
              </p>
            </div>
          </div>

        </div>

      </section>


      {/* =====================================================
          REAL SIMULATION LAB
          ===================================================== */}

      <SimulationLab />


      {/* =====================================================
          ARCHITECTURE
          ===================================================== */}

      <section
        id="architecture"
        className="fm-section fm-architecture"
      >

        <div className="fm-section-heading">

          <div className="fm-section-index">
            03 / ARCHITECTURE
          </div>

          <div>
            <h2>
              From observation
              <br />
              to action.
            </h2>

            <p>
              The agent separates state representation,
              economic evaluation, planning and execution
              instead of embedding all behaviour in one loop.
            </p>
          </div>

        </div>


        <div className="fm-pipeline">

          <PipelineNode
            number="01"
            title="OBSERVE"
            description="Parse the environment into GameState."
          />

          <PipelineArrow />

          <PipelineNode
            number="02"
            title="EVALUATE"
            description="Score viable crops and market conditions."
          />

          <PipelineArrow />

          <PipelineNode
            number="03"
            title="PLAN"
            description="Select targets and calculate routes."
          />

          <PipelineArrow />

          <PipelineNode
            number="04"
            title="ACT"
            description="Return an environment-compatible action."
          />

        </div>

      </section>


      {/* =====================================================
          EVOLUTION
          ===================================================== */}

      <section
        id="evolution"
        className="fm-section fm-evolution"
      >

        <div className="fm-section-heading">

          <div className="fm-section-index">
            04 / EVOLUTION
          </div>

          <div>
            <h2>
              Strategy changes
              <br />
              are measured.
            </h2>

            <p>
              FARM-MIND maintains versioned strategies and
              evaluates them through seeded experiments rather
              than treating every change as an improvement.
            </p>
          </div>

        </div>


        <div className="fm-version-grid">

          <article className="fm-version-card">

            <div className="fm-version-top">
              <span>VERSION 0</span>
              <span>BASELINE</span>
            </div>

            <h3>Fixed-crop heuristic</h3>

            <ul>
              <li>Fixed carrot strategy</li>
              <li>4-tile production cluster</li>
              <li>Deterministic task priority</li>
            </ul>

          </article>


          <div className="fm-version-transition">
            <ArrowUpRight size={20} />
          </div>


          <article className="fm-version-card fm-version-current">

            <div className="fm-version-top">
              <span>VERSION 1</span>
              <span className="fm-current">
                CURRENT
              </span>
            </div>

            <h3>Economic strategy</h3>

            <ul>
              <li>Dynamic crop scoring</li>
              <li>Expanded production cluster</li>
              <li>Market-aware selling</li>
            </ul>

          </article>

        </div>


        <div className="fm-evidence-note">

          <GitBranch size={15} />

          <span>
            Strategy versions are evaluated through the
            project&apos;s experiment runner and recorded
            benchmark data.
          </span>

        </div>

      </section>


      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="fm-footer">

        <div>
          <span className="fm-footer-brand">
            FARM-MIND
          </span>

          <p>
            Autonomous farming agent for simulated
            agricultural environments.
          </p>
        </div>


        <div className="fm-footer-links">

          <a href="#simulation">
            Simulation
          </a>

          <a href="#architecture">
            Architecture
          </a>

          <a href="#evolution">
            Evolution
          </a>

          <a
            href="https://github.com/manikumarkundena/FARM-MIND"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>

        </div>

      </footer>

    </main>
  );
}


/* =========================================================
   PIPELINE NODE
   ========================================================= */

function PipelineNode({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="fm-pipeline-node">

      <span>{number}</span>

      <h3>{title}</h3>

      <p>{description}</p>

    </div>
  );
}


/* =========================================================
   PIPELINE ARROW
   ========================================================= */

function PipelineArrow() {
  return (
    <div className="fm-pipeline-arrow">
      <ArrowUpRight size={17} />
    </div>
  );
}