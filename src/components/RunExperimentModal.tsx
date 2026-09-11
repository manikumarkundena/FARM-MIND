import React, { useState } from 'react';
import {
  Play,
  X,
  Cpu,
  FlaskConical,
  Dice5,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface RunExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunMatch: (p0: string, p1: string, seed: number, steps: number) => void;
  isRunning: boolean;
}

export const RunExperimentModal: React.FC<RunExperimentModalProps> = ({
  isOpen,
  onClose,
  onRunMatch,
  isRunning
}) => {
  const [p0Agent, setP0Agent] = useState<string>('FARM-MIND-V1');
  const [p1Agent, setP1Agent] = useState<string>('starter');
  const [seed, setSeed] = useState<number>(42);
  const [steps, setSteps] = useState<number>(720);

  if (!isOpen) return null;

  const handleRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 9000) + 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRunMatch(p0Agent, p1Agent, seed, steps);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-mono">
      <div className="bg-[#0f1720] border border-slate-800 rounded-lg max-w-md w-full p-6 shadow-2xl space-y-5 text-xs relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <FlaskConical className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm">RUN EXPERIMENT SIMULATION</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Player 0 Agent Selection */}
          <div className="space-y-1.5">
            <label className="text-slate-400 text-[11px] block">
              PLAYER 0 AGENT (SELF):
            </label>
            <select
              value={p0Agent}
              onChange={(e) => setP0Agent(e.target.value)}
              className="w-full bg-[#090d12] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
            >
              <option value="FARM-MIND-V1">FARM-MIND-V1 (Dynamic ROI Engine - Active)</option>
              <option value="FARM-MIND-V0">FARM-MIND-V0 (Fixed Monoculture Baseline)</option>
              <option value="starter">Official Starter Agent</option>
            </select>
          </div>

          {/* Player 1 Opponent Selection */}
          <div className="space-y-1.5">
            <label className="text-slate-400 text-[11px] block">
              PLAYER 1 OPPONENT:
            </label>
            <select
              value={p1Agent}
              onChange={(e) => setP1Agent(e.target.value)}
              className="w-full bg-[#090d12] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
            >
              <option value="starter">Official Starter Baseline</option>
              <option value="FARM-MIND-V0">FARM-MIND-V0 (Heuristic Baseline)</option>
              <option value="FARM-MIND-V1">FARM-MIND-V1 (Self-Play Symmetry)</option>
              <option value="pass">Pass Agent (Idle Benchmark)</option>
              <option value="random">Random Action Agent</option>
            </select>
          </div>

          {/* Simulation Seed */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-slate-400 text-[11px]">
                DETERMINISTIC SEED:
              </label>
              <button
                type="button"
                onClick={handleRandomSeed}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center"
              >
                <Dice5 className="w-3 h-3 mr-1" /> Randomize
              </button>
            </div>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value, 10) || 1)}
              className="w-full bg-[#090d12] border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs"
            />
          </div>

          {/* Horizon Length */}
          <div className="space-y-1.5">
            <label className="text-slate-400 text-[11px] block">
              HORIZON LENGTH (TURNS):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSteps(720)}
                className={`p-2 rounded border text-center transition cursor-pointer ${
                  steps === 720
                    ? 'bg-emerald-950 border-emerald-700 text-emerald-300 font-bold'
                    : 'bg-[#090d12] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                720 Turns (30 Days)
              </button>
              <button
                type="button"
                onClick={() => setSteps(120)}
                className={`p-2 rounded border text-center transition cursor-pointer ${
                  steps === 120
                    ? 'bg-emerald-950 border-emerald-700 text-emerald-300 font-bold'
                    : 'bg-[#090d12] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                120 Turns (5 Days Fast)
              </button>
            </div>
          </div>

          {/* Execution Time Notice */}
          <div className="bg-[#090d12] p-3 rounded border border-slate-800 text-slate-400 text-[11px] leading-relaxed">
            <span className="text-slate-300 font-bold block mb-0.5">Execution Guarantee:</span>
            Runs on native Kaggriculture v1.32.7 engine. Turn latency ~0.31 ms ensures completion in under 3.5 seconds.
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRunning}
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded transition flex items-center cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 mr-1.5 fill-slate-950" />
              START RUN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
