"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, FlaskConical, ShieldCheck } from "lucide-react";

type Experiment = {
  id: string;
  strategy_version: string;
  opponent: string;
  episodes: number;
  seed_range: string;
  metrics: {
    mean_reward_p0: number;
    median_reward_p0: number;
    stdev_reward_p0: number;
    mean_profit_p0: number;
    invalid_actions: number;
  };
  notes: string;
  config: Record<string, string | number>;
};

const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export default function EvolutionLab() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/experiments.json", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Experiment data unavailable");
        return r.json();
      })
      .then(setExperiments)
      .catch((e) => setError(e.message));
  }, []);

  const v0 = experiments.find((e) => e.strategy_version === "FARM-MIND-V0");
  const v1Starter = experiments.find(
    (e) => e.strategy_version === "FARM-MIND-V1" && e.opponent === "starter"
  );
  const v1V0 = experiments.find(
    (e) => e.strategy_version === "FARM-MIND-V1" && e.opponent === "FARM-MIND-V0"
  );

  if (error) {
    return <div className="fm-evolution-data-error">{error}</div>;
  }

  if (!experiments.length) {
    return <div className="fm-evolution-data-loading">LOADING RECORDED EXPERIMENTS...</div>;
  }

  const cards = [v0, v1Starter, v1V0].filter(Boolean) as Experiment[];

  return (
    <div className="fm-evolution-lab">
      <div className="fm-lineage">
        <div className="fm-lineage-node">
          <span>V0 / BASELINE</span>
          <strong>Fixed heuristic</strong>
          <small>4 tiles · CARROT · immediate selling</small>
        </div>
        <div className="fm-lineage-arrow"><ArrowUpRight size={18} /></div>
        <div className="fm-lineage-node fm-lineage-current">
          <span>V1 / RECORDED</span>
          <strong>Economic strategy</strong>
          <small>7 tiles · dynamic crop scoring · price-aware selling</small>
        </div>
      </div>

      <div className="fm-experiment-intro">
        <div>
          <span className="section-kicker">RECORDED BENCHMARKS</span>
          <h3>Changes are tested against seeded runs.</h3>
        </div>
        <p>All three records below use 10 episodes over seeds 500–509. Values shown are the recorded experiment metrics.</p>
      </div>

      <div className="fm-experiment-grid">
        {cards.map((experiment) => {
          const m = experiment.metrics;
          return (
            <article className="fm-experiment-card" key={experiment.id}>
              <div className="fm-experiment-card-top">
                <span><FlaskConical size={13} /> {experiment.strategy_version}</span>
                <span>{experiment.opponent}</span>
              </div>
              <h4>{experiment.strategy_version === "FARM-MIND-V0" ? "Baseline benchmark" : experiment.opponent === "starter" ? "Economic strategy benchmark" : "Head-to-head benchmark"}</h4>
              <div className="fm-metric-hero">
                <span>MEAN FINAL CASH</span>
                <strong>{money(m.mean_reward_p0)}</strong>
              </div>
              <div className="fm-metric-row">
                <div><span>MEAN PROFIT</span><strong>{money(m.mean_profit_p0)}</strong></div>
                <div><span>MEDIAN CASH</span><strong>{money(m.median_reward_p0)}</strong></div>
                <div><span>STD DEV</span><strong>{money(m.stdev_reward_p0)}</strong></div>
              </div>
              <div className="fm-experiment-meta">
                <span>{experiment.episodes} EPISODES</span>
                <span>SEEDS {experiment.seed_range}</span>
                <span><ShieldCheck size={11} /> {m.invalid_actions} INVALID</span>
              </div>
              <p className="fm-experiment-note">{experiment.notes}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
