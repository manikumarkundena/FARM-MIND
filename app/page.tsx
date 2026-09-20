"use client";

import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  GitBranch,
  Play,
  Leaf,
} from "lucide-react";

import FarmScene from "@/components/FarmScene";
import SimulationLab from "@/components/SimulationLab";
import EvolutionLab from "@/components/EvolutionLab";

export default function Home() {
  return (
    <main className="fm-site">

      {/* =====================================================
          NAVIGATION
          ===================================================== */}

      <header className="fm-nav">
        <a href="#" className="fm-brand">
          <span className="fm-brand-mark"><Leaf size={17} strokeWidth={2.2} /></span>
          <span>FARM-MIND</span>
        </a>

        <nav className="fm-nav-links">
          <a href="#simulation">Simulation</a>
          <a href="#architecture">Architecture</a>
          <a href="#evolution">Evolution</a>
        </nav>

        <div className="fm-nav-actions">
          <a
            href="https://github.com/manikumarkundena/FARM-MIND"
            target="_blank"
            rel="noreferrer"
            className="fm-nav-action"
          >
            VIEW ON GITHUB
            <GitBranch size={13} />
          </a>
          <a
            href="https://www.kaggle.com/competitions/kaggriculture"
            target="_blank"
            rel="noreferrer"
            className="fm-nav-kaggle"
          >
            PLAY ON KAGGLE ↗
          </a>
        </div>
      </header>


      {/* =====================================================
          CINEMATIC HERO
          ===================================================== */}

      <section className="fm-hero">
        <div className="fm-hero-world">
          <video
            className="fm-hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          >
            <source src="/hero-farm.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="fm-hero-atmosphere" />

        <motion.div
          className="fm-hero-copy"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85 }}
        >
          <div className="fm-eyebrow">
            AUTONOMOUS FARMING AGENT
          </div>

          <h1>
            FARM<span>-MIND</span>
          </h1>

          <p className="fm-hero-tagline">
            Smarter farms.
            <br />
            <em>Brighter tomorrows.</em>
          </p>

          <p className="fm-hero-description">
            An inspectable autonomous agent that manages resources,
            cultivates crops, navigates a simulated environment,
            and adapts decisions to market conditions inside Kaggriculture.
          </p>

          <div className="fm-hero-actions">
            <a href="#simulation" className="fm-primary-action">
              <Play size={13} fill="currentColor" />
              EXPLORE SIMULATION
            </a>

            <a href="#architecture" className="fm-secondary-action">
              VIEW ARCHITECTURE
              <ArrowDownRight size={13} />
            </a>
          </div>
        </motion.div>

        <motion.div
          className="fm-agent-card"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="fm-agent-card-top">
            <span>◈ CURRENT AGENT</span>
            <strong>FARM-MIND V1</strong>
            <b>SUBMITTED</b>
          </div>

          <div className="fm-agent-card-grid">
            <div>
              <span>ENVIRONMENT</span>
              <strong>KAGGRICULTURE</strong>
            </div>
            <div>
              <span>BOARD</span>
              <strong>10 × 10</strong>
            </div>
            <div>
              <span>HORIZON</span>
              <strong>720 TURNS</strong>
            </div>
            <div>
              <span>STRATEGY</span>
              <strong>ECONOMIC</strong>
            </div>
          </div>

          <a href="#evolution">
            VIEW RECORDED EXPERIMENTS <ArrowUpRight size={13} />
          </a>
        </motion.div>

        <div className="fm-hero-stats">
          <div>
            <strong>10 × 10</strong>
            <span>GRID WORLD</span>
          </div>
          <div>
            <strong>720</strong>
            <span>TURNS / EPISODE</span>
          </div>
          <div>
            <strong>V1</strong>
            <span>VALIDATED STRATEGY</span>
          </div>
          <div>
            <strong>3</strong>
            <span>RECORDED EXPERIMENTS</span>
          </div>
        </div>

        <div className="fm-scroll-cue">
          <span>↓</span>
          SCROLL TO EXPLORE
        </div>

        <div className="fm-hero-signature">
          <span>OBSERVE → EVALUATE → PLAN → ACT</span>
        </div>
      </section>


      {/* =====================================================
          BENCHMARK STRIP
          ===================================================== */}

      <section className="fm-benchmark-strip" aria-label="Recorded benchmark results">
        <div className="fm-benchmark-item">
          <strong>10 / 10</strong>
          <span>WINS VS STARTER · V1</span>
        </div>
        <div className="fm-benchmark-item">
          <strong>22,954</strong>
          <span>MEAN FINAL CASH · V1</span>
        </div>
        <div className="fm-benchmark-item">
          <strong>0</strong>
          <span>INVALID ACTIONS · RECORDED RUNS</span>
        </div>
        <div className="fm-benchmark-item">
          <strong>720</strong>
          <span>TURNS / EPISODE</span>
        </div>
        <div className="fm-benchmark-note">RECORDED LOCAL EXPERIMENTS · 10 SEEDED EPISODES</div>
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

      <section id="evolution" className="fm-section fm-evolution">
        <div className="fm-section-heading">
          <div className="fm-section-index">04 / EVOLUTION</div>
          <div>
            <h2>Strategy changes<br />are measured.</h2>
            <p>FARM-MIND maintains versioned strategies and evaluates them through seeded experiments rather than treating every change as an improvement.</p>
          </div>
        </div>
        <EvolutionLab />
      </section>


      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="fm-footer">
        <div className="fm-footer-identity">
          <div className="fm-footer-brand-row">
            <span className="fm-footer-brand-mark"><Leaf size={15} /></span>
            <span className="fm-footer-brand">FARM-MIND</span>
          </div>
          <p>Built by <strong>Manikumar Kundena</strong>.</p>
          <small>Inspectable autonomous agents for simulated environments.</small>
        </div>

        <div className="fm-footer-nav">
          <span>EXPLORE</span>
          <a href="#simulation">Simulation</a>
          <a href="#architecture">Architecture</a>
          <a href="#evolution">Evolution</a>
        </div>

        <div className="fm-footer-nav">
          <span>PROJECT</span>
          <a href="https://github.com/manikumarkundena/FARM-MIND" target="_blank" rel="noreferrer">GitHub ↗</a>
          <a href="https://www.kaggle.com/competitions/kaggriculture" target="_blank" rel="noreferrer">Kaggriculture ↗</a>
          <a href="https://manikumarkundena.vercel.app" target="_blank" rel="noreferrer">Portfolio ↗</a>
        </div>

        <div className="fm-footer-connect">
          <span>LET'S CONNECT</span>
          <a href="https://manikumarkundena.vercel.app" target="_blank" rel="noreferrer">manikumarkundena.vercel.app ↗</a>
          <p>Code · Simulate · Learn · Grow</p>
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