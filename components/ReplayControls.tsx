"use client";

import {
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from "lucide-react";

interface ReplayControlsProps {
  step: number;
  totalSteps: number;
  playing: boolean;
  speed: number;
  onPlayPause: () => void;
  onStepChange: (step: number) => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

export default function ReplayControls({
  step,
  totalSteps,
  playing,
  speed,
  onPlayPause,
  onStepChange,
  onReset,
  onSpeedChange,
}: ReplayControlsProps) {
  const maxStep = Math.max(0, totalSteps - 1);

  const currentDay = Math.floor(step / 24);
  const currentHour = step % 24;

  return (
    <div className="replay-controls">
      <div className="replay-header">
        <div>
          <span className="replay-kicker">RECORDED RUN</span>

          <div className="replay-position">
            <strong>
              STEP {step.toLocaleString()}
            </strong>

            <span>
              / {maxStep.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="replay-time">
          <strong>
            DAY {currentDay}
          </strong>

          <span>
            HOUR {currentHour}
          </span>
        </div>
      </div>

      <div className="replay-timeline">
        <input
          type="range"
          min={0}
          max={maxStep}
          value={step}
          onChange={(event) =>
            onStepChange(Number(event.target.value))
          }
        />

        <div className="timeline-labels">
          <span>0</span>
          <span>180</span>
          <span>360</span>
          <span>540</span>
          <span>{maxStep}</span>
        </div>
      </div>

      <div className="replay-bottom">
        <div className="replay-buttons">
          <button
            type="button"
            onClick={() =>
              onStepChange(Math.max(0, step - 1))
            }
            aria-label="Previous step"
          >
            <SkipBack size={16} />
          </button>

          <button
            type="button"
            className="replay-play"
            onClick={onPlayPause}
            aria-label={
              playing ? "Pause replay" : "Play replay"
            }
          >
            {playing ? (
              <Pause size={17} />
            ) : (
              <Play size={17} />
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              onStepChange(
                Math.min(maxStep, step + 1),
              )
            }
            aria-label="Next step"
          >
            <SkipForward size={16} />
          </button>

          <button
            type="button"
            onClick={onReset}
            aria-label="Reset replay"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        <div className="replay-speed">
          <span>SPEED</span>

          {[0.5, 1, 2, 4].map((value) => (
            <button
              key={value}
              type="button"
              className={
                speed === value
                  ? "speed-active"
                  : ""
              }
              onClick={() =>
                onSpeedChange(value)
              }
            >
              {value}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}