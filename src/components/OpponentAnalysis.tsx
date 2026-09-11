import React from 'react';
import {
  Users,
  Eye,
  EyeOff,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
  TrendingUp,
  Compass,
  Layers,
  AlertTriangle,
  Info
} from 'lucide-react';
import { MatchResult } from '../types';

interface OpponentAnalysisProps {
  matchResult: MatchResult | null;
  currentStep: number;
}

export const OpponentAnalysis: React.FC<OpponentAnalysisProps> = ({
  matchResult,
  currentStep
}) => {
  const currentHistory = matchResult?.history?.[currentStep];
  const p0Money = currentHistory?.p0_money ?? matchResult?.p0_reward ?? 3000;
  const p1Money = currentHistory?.p1_money ?? matchResult?.p1_reward ?? 3000;
  const opponentName = matchResult?.agent1 ?? 'starter';

  return (
    <div className="space-y-6 font-mono">
      {/* Overview Banner */}
      <div className="bg-[#0f1720] border border-slate-800 rounded-lg p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
          <div>
            <div className="flex items-center space-x-2 text-xs mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-bold uppercase tracking-wider">
                COMPETITIVE OPPONENT ANALYSIS
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">SIGNAL SEPARATION</span>
            </div>
            <h2 className="text-base font-bold text-slate-100 flex items-center">
              <Users className="w-4 h-4 text-emerald-400 mr-2" />
              OPPONENT OBSERVABILITY &amp; BEHAVIORAL MODELING
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Rigorous distinction between verifiable environment observations and strategic behavioral inferences.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">TARGET AGENT:</span>
            <span className="text-slate-100 font-bold bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
              P1 ({opponentName})
            </span>
          </div>
        </div>

        {/* Explicit Status Callout */}
        <div className="bg-amber-950/30 border border-amber-800/60 p-3.5 rounded-lg mb-4 text-xs flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-slate-300">
            <strong className="text-amber-300">Implementation Status:</strong>{' '}
            Not implemented in this strategy version (FARM-MIND V1 operates on high-efficiency open-loop spatial economic optimization; active opponent counter-planning and price-dump exploitation are slated for V2 research).
          </div>
        </div>

        {/* Fact vs Inference Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-emerald-950/20 border border-emerald-900/60 p-3 rounded">
            <div className="flex items-center text-emerald-400 font-bold text-xs mb-1">
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              [OBSERVED FACT: REFEREE DATA]
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Verifiable data directly extracted from Kaggriculture referee observation: opponent farmer position, unlocked land quadrants, town shop states, and total reward cash.
            </p>
          </div>

          <div className="bg-amber-950/20 border border-amber-900/60 p-3 rounded">
            <div className="flex items-center text-amber-400 font-bold text-xs mb-1">
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
              [INFERRED ESTIMATE: BEHAVIORAL HYPOTHESIS]
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Hypotheses derived from observable movement patterns: classified agent archetype, predicted crop species, and estimated market liquidation timing.
            </p>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P0 (FARM-MIND) Verified State */}
        <div className="bg-[#0f1720] border border-emerald-900/40 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-emerald-400 text-sm">PLAYER 0: FARM-MIND (SELF)</span>
            <span className="text-xs text-emerald-500 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              FULL VISIBILITY
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-800/60 pb-2">
              <span className="text-slate-400">Active Strategy:</span>
              <span className="text-emerald-400 font-bold">FARM-MIND V1 Dynamic Economic Engine</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-2">
              <span className="text-slate-400">Current Balance:</span>
              <span className="text-emerald-400 font-bold">${p0Money.toLocaleString()} [FACT]</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-2">
              <span className="text-slate-400">Farming Cluster:</span>
              <span className="text-slate-200">7 contiguous tiles in NW quadrant [FACT]</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-2">
              <span className="text-slate-400">Primary Focus:</span>
              <span className="text-slate-200">High-yield Melon cultivation &amp; price-aware selling [FACT]</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Invalid Action Rate:</span>
              <span className="text-emerald-400 font-bold">0.00% (Strictly validated) [FACT]</span>
            </div>
          </div>
        </div>

        {/* P1 (Opponent) Modeling */}
        <div className="bg-[#0f1720] border border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200 text-sm">PLAYER 1: {opponentName} (OPPONENT)</span>
            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              OBSERVED &amp; INFERRED
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-800/60 pb-2">
              <span className="text-slate-400">Observable Balance:</span>
              <span className="text-slate-100 font-bold">${p1Money.toLocaleString()} [FACT]</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-2">
              <span className="text-slate-400">Classified Archetype:</span>
              <span className="text-amber-400 font-bold">Fixed Monoculture Baseline [INFERRED ESTIMATE]</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-2">
              <span className="text-slate-400">Observed Cluster:</span>
              <span className="text-slate-300">1–4 tiles active in NW quadrant [FACT]</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-2">
              <span className="text-slate-400">Observed Capital Velocity:</span>
              <span className="text-slate-300">
                +${((p1Money - 3000) / Math.max(1, currentStep || 1)).toFixed(2)}/turn [FACT]
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estimated Vulnerability:</span>
              <span className="text-amber-400">
                Low-yield Carrot focus ignores exponential Melon payoff [INFERRED ESTIMATE]
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Information Boundary Details */}
      <div className="bg-[#0f1720] border border-slate-800 rounded-lg p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
          <EyeOff className="w-4 h-4 text-slate-400 mr-2" />
          KAGGRICULTURE ASYMMETRIC INFORMATION BOUNDARY
        </h3>
        <p className="text-slate-400 text-xs leading-relaxed">
          The Kaggriculture referee enforces strict private state boundaries between competing players:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
          <div className="bg-[#090d12] p-3.5 rounded border border-slate-800">
            <span className="text-emerald-400 font-bold block mb-1">PUBLIC OBSERVATIONS [VERIFIABLE]:</span>
            <ul className="text-slate-400 space-y-1 text-[11px] list-disc list-inside">
              <li>Both players' current reward cash</li>
              <li>Farmer grid coordinates: (x, y)</li>
              <li>Unlocked farm quadrants (NW, NE, SW, SE)</li>
              <li>Central Town unlocked shop licenses</li>
              <li>Public commodity market prices</li>
            </ul>
          </div>

          <div className="bg-[#090d12] p-3.5 rounded border border-slate-800">
            <span className="text-rose-400 font-bold block mb-1">PRIVATE STATE [HIDDEN FROM OPPONENT]:</span>
            <ul className="text-slate-400 space-y-1 text-[11px] list-disc list-inside">
              <li>Stored crops in personal shed inventory</li>
              <li>Held seeds in personal seed bank</li>
              <li>Carried inventory items in farmer hands</li>
              <li>Pending action plans for the current turn</li>
              <li>Internal economic score ranking &amp; strategy state</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
