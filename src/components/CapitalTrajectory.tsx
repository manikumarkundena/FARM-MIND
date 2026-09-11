import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Award,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { MatchResult } from '../types';

interface CapitalTrajectoryProps {
  matchResult: MatchResult | null;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

export const CapitalTrajectory: React.FC<CapitalTrajectoryProps> = ({
  matchResult,
  currentStep,
  setCurrentStep
}) => {
  if (!matchResult || !matchResult.history || matchResult.history.length === 0) {
    return (
      <div className="bg-[#0f1720] border border-slate-800 rounded-lg p-12 text-center max-w-xl mx-auto shadow-sm">
        <TrendingUp className="w-12 h-12 text-emerald-500/60 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-100 font-mono">No Capital Trajectory Available</h3>
        <p className="text-slate-400 text-xs mt-2 font-mono">
          Execute a match or load the recorded benchmark in the "Live Match" tab to visualize turn-by-turn capital accumulation.
        </p>
      </div>
    );
  }

  // Build sampled data for smooth chart rendering (every 4th step or all steps if < 720)
  const chartData = matchResult.history.filter((_, idx) => idx % 3 === 0 || idx === currentStep || idx === matchResult.history!.length - 1).map((item) => ({
    step: item.step,
    day: item.day,
    hour: item.hour,
    p0: Math.round(item.p0_money),
    p1: Math.round(item.p1_money),
    event: item.event
  }));

  const p0Final = matchResult.p0_reward;
  const p1Final = matchResult.p1_reward;
  const p0Profit = matchResult.p0_profit;
  const p1Profit = matchResult.p1_profit;
  const multiplier = p1Profit > 0 ? (p0Profit / p1Profit).toFixed(1) : 'N/A';
  const efficiency = (p0Profit / matchResult.steps_run).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="bg-[#0f1720] border border-emerald-900/50 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>FARM-MIND FINAL CASH</span>
            <span className="text-emerald-400 text-[10px] bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
              P0
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            ${p0Final.toLocaleString()}
          </div>
          <div className="text-xs text-emerald-500 mt-1 flex items-center">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            Profit: +${p0Profit.toLocaleString()}
          </div>
        </div>

        <div className="bg-[#0f1720] border border-slate-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>OPPONENT FINAL CASH</span>
            <span className="text-slate-400 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">
              P1 ({matchResult.agent1})
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-200">
            ${p1Final.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Profit: +${p1Profit.toLocaleString()}
          </div>
        </div>

        <div className="bg-[#0f1720] border border-slate-800 p-4 rounded-lg shadow-sm">
          <div className="text-xs text-slate-400 mb-1">PROFIT MULTIPLIER</div>
          <div className="text-2xl font-bold text-amber-400">
            {multiplier}x
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Relative alpha over baseline
          </div>
        </div>

        <div className="bg-[#0f1720] border border-slate-800 p-4 rounded-lg shadow-sm">
          <div className="text-xs text-slate-400 mb-1">ACTION EFFICIENCY</div>
          <div className="text-2xl font-bold text-cyan-400">
            ${efficiency} / turn
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Net cash generated per step
          </div>
        </div>
      </div>

      {/* Main Trajectory Chart */}
      <div className="bg-[#0f1720] border border-slate-800 rounded-lg p-5 shadow-sm font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center">
              <TrendingUp className="w-4 h-4 text-emerald-400 mr-2" />
              CAPITAL TRAJECTORY ACROSS 720 EPISODE TURNS
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparative liquid cash accumulation curve between FARM-MIND (P0) and Opponent (P1).
            </p>
          </div>
          <div className="text-xs text-slate-400">
            Current Scrubber: <strong className="text-emerald-400">Turn {currentStep}</strong>
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              onClick={(e) => {
                if (e && e.activePayload && e.activePayload.length > 0) {
                  const s = e.activePayload[0].payload.step;
                  if (typeof s === 'number') setCurrentStep(s);
                }
              }}
              margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="step"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(val) => `T${val} (D${Math.floor(val / 24)})`}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                domain={[2000, 'auto']}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#090d12] border border-slate-700 p-3 rounded shadow-xl text-xs font-mono">
                        <div className="text-slate-400 border-b border-slate-800 pb-1 mb-1.5 font-bold">
                          TURN {label} • DAY {data.day} (HOUR {data.hour}:00)
                        </div>
                        <div className="text-emerald-400 font-bold">
                          FARM-MIND: ${data.p0.toLocaleString()}
                        </div>
                        <div className="text-slate-300">
                          Opponent: ${data.p1.toLocaleString()}
                        </div>
                        {data.event && (
                          <div className="text-amber-400 text-[10px] mt-1 pt-1 border-t border-slate-800">
                            ★ Event: {data.event}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              />
              <ReferenceLine
                x={currentStep}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{ value: 'CURRENT TURN', fill: '#10b981', fontSize: 10, position: 'insideTop' }}
              />
              <ReferenceLine
                y={3000}
                stroke="#475569"
                strokeDasharray="2 2"
                label={{ value: 'STARTING CAPITAL ($3k)', fill: '#64748b', fontSize: 9, position: 'insideBottomLeft' }}
              />
              <Line
                type="monotone"
                dataKey="p0"
                name={`FARM-MIND (${matchResult.agent0})`}
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#10b981' }}
              />
              <Line
                type="monotone"
                dataKey="p1"
                name={`Opponent (${matchResult.agent1})`}
                stroke="#94a3b8"
                strokeWidth={1.8}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{ r: 4, fill: '#94a3b8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Milestone Annotation Timeline */}
        <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px] mb-1">DAYS 0–4 (TURNS 0–96)</span>
            <h4 className="font-bold text-slate-200">Melon Cluster Capitalization</h4>
            <p className="text-slate-400 text-[11px] mt-1">
              Seeds planted across 7 contiguous tiles. Cash temporarily drops from $3,000 to ~$2,440 as working capital is invested.
            </p>
          </div>

          <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px] mb-1">DAYS 10–12 (TURNS 240–288)</span>
            <h4 className="font-bold text-slate-200">First Melon Liquidation</h4>
            <p className="text-slate-400 text-[11px] mt-1">
              Initial batch of 6-unit Melon crops matures. Price-aware sales trigger, propelling capital past $10,000.
            </p>
          </div>

          <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px] mb-1">DAYS 13–24 (TURNS 312–576)</span>
            <h4 className="font-bold text-slate-200">Compounding Second Harvest</h4>
            <p className="text-slate-400 text-[11px] mt-1">
              Reinvested cluster completes secondary growth cycle. Capital accelerates steeply beyond $18,000.
            </p>
          </div>

          <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px] mb-1">DAYS 27–30 (TURNS 648–720)</span>
            <h4 className="font-bold text-slate-200">Terminal Season Wind-Down</h4>
            <p className="text-slate-400 text-[11px] mt-1">
              Seed purchases automatically halt when growth days exceed remaining time. All shed inventory liquidated to reach ~$22,846.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
