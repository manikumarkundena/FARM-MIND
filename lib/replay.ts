export type ReplayPlant = {
  x: number;
  y: number;
  kind: string;
  crop?: string | null;
  yield_units?: number;
  age?: number;
  mature?: boolean;
  watered?: boolean;
};

export type ReplayTelemetry = {
  action: string;
  reason?: string;
  priority?: number;
  expected_value?: number;
  target_tile?: [number, number] | null;
  target_crop?: string | null;
  objective?: string;
  step?: number;
  day?: number;
  hour?: number;
  decision_step?: number;
  action_step?: number;
  telemetry_available?: boolean;
};

export type ReplaySnapshot = {
  step: number;
  day: number;
  hour: number;

  p0_money: number;
  p1_money: number;

  p0_pos: [number, number];
  p1_pos: [number, number];

  action: string;

  market_orders?: (string | number)[][];
  event?: string | null;

  plants?: ReplayPlant[];

  shed?: Record<string, number>;
  seeds?: Record<string, number>;
  market_prices?: Record<string, number>;

  telemetry?: ReplayTelemetry;
};

export type ReplayDocument = {
  metadata?: Record<string, unknown>;
  history: ReplaySnapshot[];
  [key: string]: unknown;
};

/*
 * Compatibility aliases
 *
 * The UI uses "ReplayStep" and "PlantSnapshot"
 * while the replay parser uses "ReplaySnapshot"
 * and "ReplayPlant".
 */
export type ReplayStep = ReplaySnapshot;
export type PlantSnapshot = ReplayPlant;
export type ReplayData = ReplayDocument;

export async function loadReplay(
  path = "/replay_test.json",
): Promise<ReplayDocument> {
  const response = await fetch(path, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Replay request failed: ${response.status}`,
    );
  }

  const data =
    (await response.json()) as ReplayDocument;

  if (
    !Array.isArray(data.history) ||
    data.history.length === 0
  ) {
    throw new Error(
      "Replay does not contain a non-empty history array.",
    );
  }

  return data;
}