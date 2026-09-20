"use client";

import { useEffect, useMemo, useState } from "react";
import { loadReplay } from "@/lib/replay";

type ReplayData = Awaited<ReturnType<typeof loadReplay>>;
type ReplayStep = ReplayData["history"][number];

export function useReplay() {
  const [replay, setReplay] = useState<ReplayData | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await loadReplay();

        if (cancelled) return;

        setReplay(data);
        setStepIndex(0);
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load replay",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentStep: ReplayStep | null = useMemo(() => {
    if (!replay) return null;

    return replay.history[stepIndex] ?? null;
  }, [replay, stepIndex]);

  function goToStep(step: number) {
    if (!replay) return;

    const maxStep = replay.history.length - 1;

    setStepIndex(
      Math.max(
        0,
        Math.min(step, maxStep),
      ),
    );
  }

  return {
    replay,
    currentStep,
    stepIndex,
    setStepIndex: goToStep,
    loading,
    error,
    totalSteps: replay?.history.length ?? 0,
  };
}