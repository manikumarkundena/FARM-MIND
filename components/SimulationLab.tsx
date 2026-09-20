"use client";

import { useEffect, useState } from "react";

import { useReplay } from "@/hooks/useReplay";
import ReplayControls from "@/components/ReplayControls";
import DecisionInspector from "@/components/DecisionInspector";
import FarmScene from "@/components/FarmScene";

export default function SimulationLab() {
  const {
    currentStep,
    stepIndex,
    setStepIndex,
    loading,
    error,
    totalSteps,
  } = useReplay();

  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!playing || totalSteps <= 1) {
      return;
    }

    const intervalMs =
      1000 / speed;

    const timer = window.setInterval(() => {
      setStepIndex(Math.min(totalSteps - 1, stepIndex + 1));
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    playing,
    speed,
    stepIndex,
    totalSteps,
    setStepIndex,
  ]);

  useEffect(() => {
    if (
      playing &&
      totalSteps > 0 &&
      stepIndex >= totalSteps - 1
    ) {
      setPlaying(false);
    }
  }, [
    playing,
    stepIndex,
    totalSteps,
  ]);

  if (loading) {
    return (
      <section className="simulation-lab">
        <div className="simulation-loading">
          Loading recorded environment...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="simulation-lab">
        <div className="simulation-error">
          <strong>
            Replay unavailable
          </strong>

          <span>
            {error}
          </span>
        </div>
      </section>
    );
  }

  return (
    <section
      id="simulation"
      className="simulation-lab"
    >
      <div className="simulation-heading">
        <div>
          <span className="section-kicker">
            SIMULATE
          </span>

          <h2>
            Observe FARM-MIND inside the environment.
          </h2>

          <p>
            Replay a recorded Kaggriculture episode
            frame-by-frame and inspect the state,
            action, market activity and decision
            telemetry produced by FARM-MIND V1.
          </p>
        </div>

        <div className="simulation-run-meta">
          <span>FARM-MIND V1</span>
          <span>STARTER</span>
          <span>SEED 42</span>
          <span>720 STEPS</span>
        </div>
      </div>

      <div className="simulation-layout">
        <div className="simulation-world">
  <div className="simulation-world-canvas">
    <FarmScene replayStep={currentStep} />
  </div>

          {currentStep && (
            <div className="world-overlay">
              <div>
                <span>ENVIRONMENT</span>
                <strong>
                  KAGGRICULTURE
                </strong>
              </div>

              <div>
                <span>STEP</span>
                <strong>
                  {currentStep.step}
                </strong>
              </div>

              <div>
                <span>DAY / HOUR</span>
                <strong>
                  {currentStep.day} /{" "}
                  {currentStep.hour}
                </strong>
              </div>
            </div>
          )}
        </div>

        <DecisionInspector
          frame={currentStep}
        />
      </div>

      <ReplayControls
        step={stepIndex}
        totalSteps={totalSteps}
        playing={playing}
        speed={speed}
        onPlayPause={() =>
          setPlaying((value) => !value)
        }
        onStepChange={setStepIndex}
        onReset={() => {
          setPlaying(false);
          setStepIndex(0);
        }}
        onSpeedChange={setSpeed}
      />
    </section>
  );
}