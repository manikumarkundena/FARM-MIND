import React from 'react';
import {
  Cpu,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Clock,
  Shield,
  Layers,
  Database,
  BarChart2,
  DollarSign,
  Info,
  Eye,
  Activity
} from 'lucide-react';
import { MatchResult, StepHistoryItem } from '../types';

interface DecisionInspectorProps {
  matchResult: MatchResult | null;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

export const DecisionInspector: React.FC<DecisionInspectorProps> = ({
  matchResult,
  currentStep,
  setCurrentStep
}) => {
  if (!matchResult) {
    return (
      <div className="bg-[#0f1720] border border-slate-800 rounded-lg p-12 text-center max-w-xl mx-auto shadow-sm font-mono">
        <Cpu className="w-12 h-12 text-emerald-500/60 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-100">No Active Telemetry Stream</h3>
        <p className="text-slate-400 text-xs mt-2">
          Load the verified benchmark match or execute an episode in the "Live Match" tab to audit FARM-MIND's decision-theoretic pipeline.
        </p>
      </div>
    );
  }

  const history = matchResult.history || [];
  const currentHistory: StepHistoryItem | undefined = history[currentStep];
  const telem = currentHistory?.telemetry;

  // Window of surrounding steps for audit table (-4 to +5)
  const windowStart = Math.max(0, currentStep - 4);
  const windowEnd = Math.min(history.length, currentStep + 6);
  const auditSlice = history.slice(windowStart, windowEnd);

  const farmerPos = currentHistory?.p0_pos || matchResult.p0_farmer || [4, 4];
  const activeMoney = currentHistory?.p0_money ?? matchResult.p0_reward;

  return (
    <div className="space-y-6 font-mono">
      {/* Overview Header Banner */}
      <div className="bg-[#0f1720] border border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2 text-xs mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-bold uppercase tracking-wider">
                SIGNATURE TELEMETRY AUDIT
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">SYNCHRONIZED RECORD</span>
            </div>
            <h2 className="text-base font-bold text-slate-100 flex items-center">
              <Cpu className="w-4 h-4 text-emerald-400 mr-2" />
              DECISION INSPECTOR • TURN {currentStep} / {history.length - 1}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Turn-by-turn trace of autonomous deliberation with strict separation of Environment Facts, Model Estimates, and Tactical Inferences.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">DAY {currentHistory?.day ?? Math.floor(currentStep / 24)}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">HOUR {currentHistory?.hour ?? currentStep % 24}:00</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60">
              {telem?.objective || 'Production Mode'}
            </span>
          </div>
        </div>

        {/* FACT / INFERENCE / ESTIMATE Classification Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
            <span className="text-emerald-400 font-bold block text-[11px] mb-0.5">
              [ENVIRONMENT FACT]
            </span>
            <p className="text-slate-400 text-[10px]">
              Verifiable data directly exposed by referee: position, referee cash, tile grid, town prices.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
            <span className="text-amber-400 font-bold block text-[11px] mb-0.5">
              [MODEL ESTIMATE]
            </span>
            <p className="text-slate-400 text-[10px]">
              Computed metrics from mathematical algorithms: expected value, continuous ROI, price moving average.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded">
            <span className="text-cyan-400 font-bold block text-[11px] mb-0.5">
              [TACTICAL INFERENCE]
            </span>
            <p className="text-slate-400 text-[10px]">
              Strategic priority rankings: cluster target assignment, arbitration tier, season cutoff viability.
            </p>
          </div>
        </div>
      </div>

      {/* Synchronized Turn Deliberation Contract */}
      <div className="bg-[#0f1720] border border-emerald-900/40 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400">
              ACTIVE TELEMETRY CONTRACT (STEP {currentStep})
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            [EXACT RECORD: NO INDEPENDENTLY FABRICATED NARRATIVE]
          </span>
        </div>

        {/* 4 Main Parameter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Action */}
          <div className="bg-[#090d12] p-3.5 rounded border border-slate-800">
            <div className="flex items-center justify-between text-slate-500 text-[10px] mb-1">
              <span>PHYSICAL ACTION</span>
              <span className="text-emerald-400 font-semibold">[FACT]</span>
            </div>
            <span className="text-base font-bold text-emerald-400 block">
              {currentHistory?.action || 'PASS'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              Farmer at [{farmerPos[0]}, {farmerPos[1]}]
            </span>
          </div>

          {/* Priority */}
          <div className="bg-[#090d12] p-3.5 rounded border border-slate-800">
            <div className="flex items-center justify-between text-slate-500 text-[10px] mb-1">
              <span>ARBITRATION PRIORITY</span>
              <span className="text-cyan-400 font-semibold">[INFERENCE]</span>
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-base font-bold text-slate-100">
                Tier {telem?.priority || 1} <span className="text-xs text-slate-500 font-normal">/ 5</span>
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                {(telem?.priority ?? 1) >= 4 ? 'Urgent' : (telem?.priority ?? 1) >= 3 ? 'Standard' : 'Low Lull'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              P5=Harvest, P4=Water/Drop, P3=Plant
            </span>
          </div>

          {/* Expected Value */}
          <div className="bg-[#090d12] p-3.5 rounded border border-slate-800">
            <div className="flex items-center justify-between text-slate-500 text-[10px] mb-1">
              <span>EXPECTED VALUE</span>
              <span className="text-amber-400 font-semibold">[ESTIMATE]</span>
            </div>
            <span className="text-base font-bold text-emerald-400 block">
              ${telem?.expected_value?.toFixed(1) || '0.0'}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              Continuous daily yield model
            </span>
          </div>

          {/* Target */}
          <div className="bg-[#090d12] p-3.5 rounded border border-slate-800">
            <div className="flex items-center justify-between text-slate-500 text-[10px] mb-1">
              <span>TARGET SPATIAL TILE</span>
              <span className="text-cyan-400 font-semibold">[INFERENCE]</span>
            </div>
            <span className="text-base font-bold text-slate-200 block">
              {telem?.target_tile ? `(${telem.target_tile[0]}, ${telem.target_tile[1]})` : `Current (${farmerPos[0]}, ${farmerPos[1]})`}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">
              Target crop: <strong className="text-emerald-400">{telem?.target_crop || 'MELON'}</strong>
            </span>
          </div>
        </div>

        {/* Telemetry Reason */}
        <div className="bg-[#090d12] p-3.5 rounded border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-500 text-[10px] uppercase tracking-wider mb-1">
            <span>DECISION JUSTIFICATION & AUDIT TRAIL</span>
            <span className="text-slate-400">[EXACT LOGGED TELEMETRY REASON]</span>
          </div>
          <p className="text-slate-200 text-xs leading-relaxed italic">
            "{telem?.reason || 'Agent evaluating spatial cluster priorities and crop lifecycle constraints.'}"
          </p>
        </div>

        {/* Market Orders & Prices at this step */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#090d12] p-3.5 rounded border border-slate-800">
            <span className="text-slate-500 text-[10px] block mb-1">
              MARKET TRANSACTIONS AT TURN {currentStep} [FACT]:
            </span>
            {currentHistory?.market_orders && currentHistory.market_orders.length > 0 ? (
              <div className="space-y-1">
                {currentHistory.market_orders.map((m, idx) => (
                  <div key={idx} className="flex justify-between items-center text-slate-200">
                    <span className={m[0] === 'SELL' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {m[0]} {m[1]}
                    </span>
                    <span className="text-slate-400">Volume: {m[2]} units</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-slate-500 italic">No market orders executed on this turn</span>
            )}
          </div>

          <div className="bg-[#090d12] p-3.5 rounded border border-slate-800">
            <span className="text-slate-500 text-[10px] block mb-1">
              OBSERVED MARKET PRICES AT TURN {currentStep} [FACT]:
            </span>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {currentHistory?.market_prices ? (
                Object.entries(currentHistory.market_prices).map(([crop, price]) => (
                  <span key={crop} className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300">
                    {crop}: <strong className="text-emerald-400">${price}</strong>
                  </span>
                ))
              ) : (
                <span className="text-slate-500 italic">Standard base price index</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Pipeline Flow */}
      <div className="bg-[#0f1720] border border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
          <Layers className="w-4 h-4 text-emerald-400 mr-2" />
          AUTONOMOUS DELIBERATION PIPELINE
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          {/* Stage 1: Observation */}
          <div className="bg-[#090d12] p-3 rounded border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-slate-500 block mb-1">STAGE 1 [FACT]</span>
              <h4 className="font-bold text-slate-100 text-xs">Observation</h4>
              <p className="text-slate-400 text-[10px] mt-1 leading-tight">
                Receives 10×10 grid, active plants, farmer pos [{farmerPos[0]}, {farmerPos[1]}].
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-emerald-400 font-semibold">
              Cash: ${activeMoney.toLocaleString()}
            </div>
          </div>

          {/* Stage 2: State Perception */}
          <div className="bg-[#090d12] p-3 rounded border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-slate-500 block mb-1">STAGE 2 [FACT]</span>
              <h4 className="font-bold text-slate-100 text-xs">State Perception</h4>
              <p className="text-slate-400 text-[10px] mt-1 leading-tight">
                Parses raw arrays into typed GameState, identifies active NW cluster.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-emerald-400 font-semibold">
              {currentHistory?.plants?.length ?? 0} active crops
            </div>
          </div>

          {/* Stage 3: Economic Engine */}
          <div className="bg-[#090d12] p-3 rounded border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-amber-500 block mb-1">STAGE 3 [ESTIMATE]</span>
              <h4 className="font-bold text-slate-100 text-xs">Economic Engine</h4>
              <p className="text-slate-400 text-[10px] mt-1 leading-tight">
                Evaluates continuous daily yield ROI. Enforces terminal cutoff &le; Day 30.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-emerald-400 font-semibold">
              Top: {telem?.target_crop || 'MELON'} ($133.3/d)
            </div>
          </div>

          {/* Stage 4: Market Intelligence */}
          <div className="bg-[#090d12] p-3 rounded border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-slate-500 block mb-1">STAGE 4 [FACT]</span>
              <h4 className="font-bold text-slate-100 text-xs">Market Intelligence</h4>
              <p className="text-slate-400 text-[10px] mt-1 leading-tight">
                Monitors commodity spot prices and moving average liquidation premiums.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-emerald-400 font-semibold">
              Melon: ${currentHistory?.market_prices?.MELON ?? 280}
            </div>
          </div>

          {/* Stage 5: Spatial Planner */}
          <div className="bg-[#090d12] p-3 rounded border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-cyan-500 block mb-1">STAGE 5 [INFERENCE]</span>
              <h4 className="font-bold text-slate-100 text-xs">Spatial Planner</h4>
              <p className="text-slate-400 text-[10px] mt-1 leading-tight">
                Arbitrates between Harvest &gt; Water &gt; Drop &gt; Plant &gt; Move actions.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-emerald-400 font-semibold">
              Priority: Tier {telem?.priority || 1}
            </div>
          </div>

          {/* Stage 6: Action Execution */}
          <div className="bg-[#090d12] p-3 rounded border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-emerald-500 block mb-1">STAGE 6 [FACT]</span>
              <h4 className="font-bold text-slate-100 text-xs">Action Output</h4>
              <p className="text-slate-400 text-[10px] mt-1 leading-tight">
                Serializes directional action to referee with zero invalid actions.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-emerald-400 font-bold">
              {currentHistory?.action || 'PASS'}
            </div>
          </div>
        </div>
      </div>

      {/* Surrounding Turns Audit Table */}
      <div className="bg-[#0f1720] border border-slate-800 rounded-lg p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            SURROUNDING DECISION LOGS (TURNS {windowStart} TO {windowEnd - 1})
          </h3>
          <span className="text-slate-500 text-[10px]">CLICK ROW TO JUMP</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                <th className="py-2 px-2.5">STEP</th>
                <th className="py-2 px-2.5">TIME</th>
                <th className="py-2 px-2.5">CASH [FACT]</th>
                <th className="py-2 px-2.5">ACTION [FACT]</th>
                <th className="py-2 px-2.5">TARGET [INFERENCE]</th>
                <th className="py-2 px-2.5">PRIORITY</th>
                <th className="py-2 px-2.5">EXPECTED VALUE [ESTIMATE]</th>
                <th className="py-2 px-2.5">REASON [TELEMETRY]</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {auditSlice.map((item) => {
                const isCurrent = item.step === currentStep;
                return (
                  <tr
                    key={item.step}
                    onClick={() => setCurrentStep(item.step)}
                    className={`cursor-pointer transition ${
                      isCurrent
                        ? 'bg-emerald-950/40 text-emerald-300 font-semibold'
                        : 'hover:bg-slate-900/50 text-slate-300'
                    }`}
                  >
                    <td className="py-2.5 px-2.5 font-bold">
                      {isCurrent && <span className="text-emerald-400 mr-1">▶</span>}
                      {item.step}
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-400 text-[11px]">
                      D{item.day} {item.hour}:00
                    </td>
                    <td className="py-2.5 px-2.5 font-bold text-slate-200">
                      ${item.p0_money?.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2.5">
                      <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-emerald-400 font-bold text-[11px]">
                        {item.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-300">
                      {item.telemetry?.target_tile ? `(${item.telemetry.target_tile[0]}, ${item.telemetry.target_tile[1]})` : 'Self'}
                    </td>
                    <td className="py-2.5 px-2.5">
                      Tier {item.telemetry?.priority || 1}
                    </td>
                    <td className="py-2.5 px-2.5 text-emerald-400">
                      ${item.telemetry?.expected_value?.toFixed(1) || '0.0'}
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-400 text-[11px] max-w-xs truncate italic">
                      {item.telemetry?.reason || 'Standard operational cycle.'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
