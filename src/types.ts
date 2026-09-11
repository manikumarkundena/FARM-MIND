export interface TilePlant {
  x: number;
  y: number;
  kind: 'PLANT' | 'WEED' | 'STRUCTURE' | string;
  crop?: string | null;
  yield_units: number;
  watered: boolean;
  age: number;
  mature: boolean;
}

export interface DecisionTelemetry {
  action: string;
  reason: string;
  priority: number;
  expected_value: number;
  target_tile?: [number, number] | null;
  target_crop?: string;
  objective?: string;
  step?: number;
  day?: number;
  hour?: number;
  market_orders?: any[];
}

export interface StepHistoryItem {
  step: number;
  day: number;
  hour: number;
  p0_money: number;
  p1_money: number;
  p0_pos: [number, number];
  p1_pos?: [number, number];
  action: string;
  market_orders: any[];
  event?: 'SALE' | 'PURCHASE' | 'PLANT' | 'HARVEST' | 'DROP' | 'WATER' | null;
  plants: TilePlant[];
  shed: Record<string, number>;
  seeds: Record<string, number>;
  market_prices: Record<string, number>;
  telemetry?: DecisionTelemetry;
}

export interface MatchResult {
  agent0: string;
  agent1: string;
  seed: number;
  steps_run: number;
  duration_sec: number;
  p0_reward: number;
  p1_reward: number;
  p0_profit: number;
  p1_profit: number;
  winner: number;
  final_market_prices: Record<string, number>;
  unlocked_shops: string[];
  p0_farmer?: [number, number];
  p0_tiles?: any[][];
  p0_shed?: Record<string, number>;
  p0_seeds?: Record<string, number>;
  history?: StepHistoryItem[];
}

export interface ExperimentMetrics {
  matches: number;
  p0_wins: number;
  p1_wins: number;
  ties: number;
  win_rate_p0: number;
  win_rate_p1: number;
  tie_rate?: number;
  mean_reward_p0: number;
  median_reward_p0: number;
  stdev_reward_p0: number;
  min_reward_p0: number;
  max_reward_p0: number;
  mean_reward_p1: number;
  median_reward_p1?: number;
  stdev_reward_p1: number;
  min_reward_p1?: number;
  max_reward_p1?: number;
  mean_profit_p0: number;
  median_profit_p0?: number;
  min_profit_p0?: number;
  max_profit_p0?: number;
  mean_profit_p1: number;
  median_profit_p1?: number;
  min_profit_p1?: number;
  max_profit_p1?: number;
  mean_duration_sec: number;
  total_duration_sec?: number;
  invalid_actions: number;
}

export interface ExperimentRecord {
  id: string;
  timestamp: string;
  strategy_version: string;
  opponent: string;
  episodes: number;
  base_seed: number;
  seed_range: string;
  metrics: ExperimentMetrics;
  runtime_sec: number;
  notes: string;
  config: Record<string, any>;
}

export interface CropSpec {
  name: string;
  seedCost: number;
  firstHarvestDay: number;
  maxYieldDay: number;
  ongoing: boolean;
  interval: number;
  maxYield: number;
  basePrice: number;
  color: string;
  badgeBg: string;
  badgeBorder: string;
}
