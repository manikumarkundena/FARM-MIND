import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Filter,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Trash2,
  ArrowRight,
  Search
} from 'lucide-react';
import { MatchResult, StepHistoryItem } from '../types';

interface SystemLogConsoleProps {
  matchResult: MatchResult | null;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isDocked?: boolean;
}

export const SystemLogConsole: React.FC<SystemLogConsoleProps> = ({
  matchResult,
  currentStep,
  setCurrentStep,
  isDocked = false
}) => {
  const [filter, setFilter] = useState<'ALL' | 'OBS' | 'ECON' | 'PLAN' | 'ACT' | 'ENV'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const history = matchResult?.history || [];

  // Generate structured logs for each step
  const logs: {
    step: number;
    day: number;
    hour: number;
    tag: 'OBS' | 'ECON' | 'PLAN' | 'ACT' | 'ENV';
    message: string;
    details?: string;
  }[] = [];

  history.forEach((item) => {
    const day = item.day;
    const hour = item.hour;
    const step = item.step;

    // [OBS] Log
    logs.push({
      step,
      day,
      hour,
      tag: 'OBS',
      message: `Grid state received: farmer pos [${item.p0_pos[0]}, ${item.p0_pos[1]}], cash: $${item.p0_money.toLocaleString()}, active plants: ${item.plants?.length || 0}`
    });

    // [ECON] Log
    if (item.telemetry?.expected_value !== undefined) {
      logs.push({
        step,
        day,
        hour,
        tag: 'ECON',
        message: `Continuous yield model: evaluated ROI for ${item.telemetry.target_crop || 'crops'}, expected value: $${item.telemetry.expected_value.toFixed(1)}`,
        details: item.telemetry.target_crop ? `Top recommendation: ${item.telemetry.target_crop}` : undefined
      });
    }

    // [PLAN] Log
    if (item.telemetry?.reason) {
      logs.push({
        step,
        day,
        hour,
        tag: 'PLAN',
        message: `Arbitration: priority tier ${item.telemetry.priority || 1}/5, target: (${item.telemetry.target_tile?.[0] ?? item.p0_pos[0]}, ${item.telemetry.target_tile?.[1] ?? item.p0_pos[1]})`,
        details: item.telemetry.reason
      });
    }

    // [ACT] Log
    logs.push({
      step,
      day,
      hour,
      tag: 'ACT',
      message: `Executed action '${item.action}'${item.market_orders?.length ? ` with ${item.market_orders.length} market orders` : ''}`,
      details: item.market_orders?.length ? JSON.stringify(item.market_orders) : undefined
    });

    // [ENV] Log (on major events)
    if (item.event) {
      logs.push({
        step,
        day,
        hour,
        tag: 'ENV',
        message: `Referee confirmed state transition: ${item.event} verified at hour ${hour}:00`
      });
    }
  });

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesTag = filter === 'ALL' || log.tag === filter;
    const matchesSearch =
      searchQuery === '' ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTag && matchesSearch;
  });

  // Auto-scroll to current turn if viewing
  useEffect(() => {
    const activeEl = document.getElementById(`log-step-${currentStep}`);
    if (activeEl && logContainerRef.current) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentStep]);

  if (!matchResult) {
    return (
      <div className="bg-[#0f1720] border border-slate-800 rounded-lg p-8 text-center text-slate-500 font-mono text-xs">
        No active telemetry stream for system console. Load a match to view logs.
      </div>
    );
  }

  const tagColors: Record<string, string> = {
    OBS: 'text-blue-400 bg-blue-950/60 border-blue-800',
    ECON: 'text-amber-400 bg-amber-950/60 border-amber-800',
    PLAN: 'text-cyan-400 bg-cyan-950/60 border-cyan-800',
    ACT: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
    ENV: 'text-purple-400 bg-purple-950/60 border-purple-800'
  };

  return (
    <div className={`bg-[#090d12] border border-slate-800 rounded-lg font-mono text-xs shadow-md overflow-hidden ${isDocked ? 'border-t-2 border-t-emerald-600' : ''}`}>
      {/* Console Header */}
      <div className="bg-[#0f1720] border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-200">FARM-MIND SYSTEM TELEMETRY CONSOLE</span>
          <span className="text-[10px] text-slate-500">
            ({filteredLogs.length} events logged)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Tag Filter Pills */}
          <div className="flex items-center space-x-1">
            {(['ALL', 'OBS', 'ECON', 'PLAN', 'ACT', 'ENV'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                  filter === t
                    ? 'bg-emerald-900 text-emerald-300 border border-emerald-700'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded pl-6 pr-2 py-0.5 text-[10px] text-slate-200 focus:outline-none focus:border-emerald-500 w-32 sm:w-44"
            />
          </div>

          {isDocked && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 text-slate-400 hover:text-slate-200"
            >
              {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Log Output Body */}
      {!isCollapsed && (
        <div
          ref={logContainerRef}
          className="h-80 overflow-y-auto p-3 space-y-1 select-text scrollbar-thin scrollbar-thumb-slate-800"
        >
          {filteredLogs.slice(0, 500).map((log, idx) => {
            const isCurrent = log.step === currentStep;
            return (
              <div
                key={idx}
                id={isCurrent ? `log-step-${log.step}` : undefined}
                onClick={() => setCurrentStep(log.step)}
                className={`px-2.5 py-1 rounded transition cursor-pointer flex flex-col sm:flex-row sm:items-baseline gap-1.5 ${
                  isCurrent
                    ? 'bg-emerald-950/40 border-l-2 border-emerald-400 text-emerald-200 font-semibold'
                    : 'hover:bg-slate-900/60 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-1.5 shrink-0 text-[10px]">
                  <span className="text-slate-500 w-12">T-{log.step}</span>
                  <span className="text-slate-600">D{log.day}:{log.hour.toString().padStart(2, '0')}</span>
                  <span className={`px-1.5 py-0.2 rounded font-bold border text-[9px] ${tagColors[log.tag]}`}>
                    [{log.tag}]
                  </span>
                </div>
                <div className="flex-1 text-[11px] truncate">
                  <span>{log.message}</span>
                  {log.details && (
                    <span className="text-slate-500 italic ml-2 truncate">
                      — "{log.details}"
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
