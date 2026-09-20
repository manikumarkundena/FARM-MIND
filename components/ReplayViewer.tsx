"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from "lucide-react";
import type { ReplayDocument, ReplaySnapshot } from "@/lib/replay";

const SPEEDS = [1, 2, 5, 10];

function money(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function actionLabel(action: string) {
  return action.replaceAll("_", " ");
}

function cellState(snapshot: ReplaySnapshot, x: number, y: number) {
  const plant = snapshot.plants?.find((p) => p.x === x && p.y === y);
  const farmer = snapshot.p0_pos?.[0] === x && snapshot.p0_pos?.[1] === y;
  const opponent = snapshot.p1_pos?.[0] === x && snapshot.p1_pos?.[1] === y;

  return { plant, farmer, opponent };
}

export default function ReplayViewer({ replay }: { replay: ReplayDocument }) {
  const history = replay.history;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);

  const frame = history[index];

  useEffect(() => {
    if (!playing) return;

    const delay = Math.max(50, 900 / speed);
    const timer = window.setInterval(() => {
      setIndex((current) => {
        if (current >= history.length - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, delay);

    return () => window.clearInterval(timer);
  }, [playing, speed, history.length]);

  const telemetry = frame.telemetry;
  const target = telemetry?.target_tile;
  const cropPrices = useMemo(
    () => Object.entries(frame.market_prices ?? {}).slice(0, 6),
    [frame.market_prices],
  );

  const jump = (delta: number) => {
    setIndex((current) =>
      Math.max(0, Math.min(history.length - 1, current + delta)),
    );
  };

  return (
    <section className="fm-replay">
      <div className="fm-replay-top">
        <div>
          <div className="fm-kicker">RECORDED MATCH</div>
          <h2>Watch the agent make real decisions.</h2>
          <p>
            This viewer is driven directly by the validated 720-turn replay.
            The frame, action and telemetry all come from the recorded run.
          </p>
        </div>

        <div className="fm-replay-clock">
          <strong>
            DAY {frame.day + 1} · {String(frame.hour).padStart(2, "0")}:00
          </strong>
          <span>
            TURN {frame.step} / {history.length - 1}
          </span>
        </div>
      </div>

      <div className="fm-replay-controls">
        <button onClick={() => setIndex(0)} aria-label="First turn">
          <SkipBack size={17} />
        </button>
        <button onClick={() => jump(-10)} aria-label="Back ten turns">
          <ChevronLeft size={18} />
        </button>
        <button
          className="fm-play"
          onClick={() => setPlaying((value) => !value)}
          aria-label={playing ? "Pause replay" : "Play replay"}
        >
          {playing ? <Pause size={17} /> : <Play size={17} />}
          {playing ? "PAUSE" : "PLAY"}
        </button>
        <button onClick={() => jump(10)} aria-label="Forward ten turns">
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => setIndex(history.length - 1)}
          aria-label="Last turn"
        >
          <SkipForward size={17} />
        </button>

        <div className="fm-speed">
          {SPEEDS.map((value) => (
            <button
              key={value}
              className={speed === value ? "active" : ""}
              onClick={() => setSpeed(value)}
            >
              {value}×
            </button>
          ))}
        </div>

        <input
          className="fm-timeline"
          type="range"
          min={0}
          max={history.length - 1}
          value={index}
          onChange={(event) => {
            setPlaying(false);
            setIndex(Number(event.target.value));
          }}
        />
      </div>

      <div className="fm-replay-grid">
        <div className="fm-field-panel">
          <div className="fm-panel-title">
            <span>10 × 10 ENVIRONMENT</span>
            <span>TURN {frame.step}</span>
          </div>

          <div className="fm-field">
            {Array.from({ length: 100 }, (_, cell) => {
              const x = cell % 10;
              const y = Math.floor(cell / 10);
              const { plant, farmer, opponent } = cellState(frame, x, y);
              const isTarget = target?.[0] === x && target?.[1] === y;

              return (
                <div
                  key={`${x}-${y}`}
                  className={[
                    "fm-tile",
                    plant?.kind === "WEED" ? "weed" : "",
                    plant?.kind === "PLANT" ? "planted" : "",
                    plant?.mature ? "mature" : "",
                    farmer ? "farmer" : "",
                    opponent ? "opponent" : "",
                    isTarget ? "target" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  title={`(${x}, ${y})`}
                >
                  {farmer && <span className="fm-agent-dot" />}
                  {!farmer && opponent && <span className="fm-opponent-dot" />}
                  {!farmer && !opponent && plant?.kind === "WEED" && (
                    <span className="fm-weed">×</span>
                  )}
                  {!farmer &&
                    !opponent &&
                    plant?.kind === "PLANT" &&
                    (plant.crop === "MELON" ? "●" : "•")}
                </div>
              );
            })}
          </div>

          <div className="fm-field-legend">
            <span><i className="agent" /> FARM-MIND</span>
            <span><i className="crop" /> CROP</span>
            <span><i className="mature" /> MATURE</span>
            <span><i className="target" /> TARGET</span>
          </div>
        </div>

        <aside className="fm-inspector">
          <div className="fm-panel-title">
            <span>DECISION INSPECTOR</span>
            <span className="verified">VERIFIED</span>
          </div>

          <div className="fm-decision-action">
            <span>ACTION</span>
            <strong>{actionLabel(frame.action)}</strong>
          </div>

          <dl className="fm-decision-list">
            <div>
              <dt>Reason</dt>
              <dd>{telemetry?.reason ?? "No telemetry recorded."}</dd>
            </div>
            <div>
              <dt>Target</dt>
              <dd>
                {target ? `(${target[0]}, ${target[1]})` : "—"}
              </dd>
            </div>
            <div>
              <dt>Crop</dt>
              <dd>{telemetry?.target_crop ?? "—"}</dd>
            </div>
            <div>
              <dt>Priority</dt>
              <dd>{telemetry?.priority ?? "—"}</dd>
            </div>
            <div>
              <dt>Estimated value</dt>
              <dd>
                {typeof telemetry?.expected_value === "number"
                  ? money(telemetry.expected_value)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Objective</dt>
              <dd>{telemetry?.objective ?? "—"}</dd>
            </div>
          </dl>

          <div className="fm-inspector-rule" />

          <div className="fm-capital-row">
            <div>
              <span>FARM-MIND CASH</span>
              <strong>{money(frame.p0_money)}</strong>
            </div>
            <div>
              <span>OPPONENT CASH</span>
              <strong>{money(frame.p1_money)}</strong>
            </div>
          </div>

          <div className="fm-market">
            <div className="fm-small-title">OBSERVED MARKET</div>
            {cropPrices.map(([crop, price]) => (
              <div className="fm-market-row" key={crop}>
                <span>{crop}</span>
                <strong>{money(price)}</strong>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="fm-replay-footer">
        <span>
          Farmer position: ({frame.p0_pos?.[0]}, {frame.p0_pos?.[1]})
        </span>
        <span>
          Event: {frame.event || "NONE"}
        </span>
        <button
          onClick={() => {
            setPlaying(false);
            setIndex(0);
          }}
        >
          <RotateCcw size={14} />
          RESET
        </button>
      </div>
    </section>
  );
}
