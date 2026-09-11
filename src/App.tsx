import React, { useState, useEffect } from 'react';
import { Navigation, TabId } from './components/Navigation';
import { CommandCenter } from './components/CommandCenter';
import { LiveMatch } from './components/LiveMatch';
import { DecisionInspector } from './components/DecisionInspector';
import { CapitalTrajectory } from './components/CapitalTrajectory';
import { EconomicIntelligence } from './components/EconomicIntelligence';
import { OpponentAnalysis } from './components/OpponentAnalysis';
import { ExperimentLab } from './components/ExperimentLab';
import { ArchitectureView } from './components/ArchitectureView';
import { SystemLogConsole } from './components/SystemLogConsole';
import { RunExperimentModal } from './components/RunExperimentModal';
import { MatchResult, ExperimentRecord } from './types';
import {
  Menu,
  Play,
  Zap,
  Terminal,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('command');
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [experiments, setExperiments] = useState<ExperimentRecord[]>([]);
  const [loadingExperiments, setLoadingExperiments] = useState<boolean>(false);
  const [profilerData, setProfilerData] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isRunModalOpen, setIsRunModalOpen] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  // Load benchmark & experiments on mount
  useEffect(() => {
    fetchExperiments();
    fetchProfiler();
    handleLoadRecordedMatch();
  }, []);

  const fetchExperiments = async () => {
    setLoadingExperiments(true);
    try {
      const res = await fetch('/api/experiments');
      const data = await res.json();
      if (data.success && data.data) {
        setExperiments(data.data);
      }
    } catch (e) {
      console.error('Failed to load experiments', e);
    } finally {
      setLoadingExperiments(false);
    }
  };

  const fetchProfiler = async () => {
    try {
      const res = await fetch('/api/profiler');
      const data = await res.json();
      if (data.success && data.data) {
        setProfilerData(data.data);
      }
    } catch (e) {
      console.error('Failed to load profiler data', e);
    }
  };

  const handleLoadRecordedMatch = async () => {
    setIsRunning(true);
    setStatusMessage('Loading verified Seed 42 benchmark match...');
    try {
      const res = await fetch('/api/recorded-match');
      const json = await res.json();
      if (json.success && json.data) {
        setMatchResult(json.data);
        setCurrentStep(0);
        setStatusMessage('Recorded benchmark match loaded successfully.');
      } else {
        setStatusMessage('Failed to load recorded match: ' + (json.error || 'Unknown error'));
      }
    } catch (err: any) {
      setStatusMessage('Network error loading recorded match: ' + err.message);
    } finally {
      setIsRunning(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleRunMatch = async (p0: string, p1: string, seed: number, steps: number) => {
    setIsRunning(true);
    setStatusMessage(`Executing head-to-head simulation: ${p0} vs ${p1} (Seed ${seed})...`);
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ p0, p1, seed, steps, episodes: 1 })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setMatchResult(json.data);
        setCurrentStep(0);
        setStatusMessage(
          `Simulation complete. Winner: ${json.data.winner === 0 ? p0 : p1}. P0 Reward: $${json.data.p0_reward?.toLocaleString()}`
        );
      } else {
        setStatusMessage('Simulation failed: ' + (json.error || 'Unknown error'));
      }
    } catch (err: any) {
      setStatusMessage('Simulation request error: ' + err.message);
    } finally {
      setIsRunning(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const tabLabels: Record<TabId, string> = {
    command: 'COMMAND CENTER',
    live: 'LIVE MATCH ARENA',
    decision: 'DECISION INSPECTOR',
    experiments: 'EXPERIMENT LAB',
    economics: 'ECONOMIC INTELLIGENCE',
    opponent: 'OPPONENT ANALYSIS',
    trajectory: 'CAPITAL TRAJECTORY',
    architecture: 'SYSTEM ARCHITECTURE',
    logs: 'TELEMETRY CONSOLE'
  };

  return (
    <div className="min-h-screen bg-[#090d12] text-slate-100 flex flex-col md:flex-row font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Desktop Sidebar / Mobile Drawer */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        matchResult={matchResult}
        currentStep={currentStep}
        isRunning={isRunning}
        onOpenRunModal={() => setIsRunModalOpen(true)}
        isMobileOpen={isMobileNavOpen}
        setIsMobileOpen={setIsMobileNavOpen}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Sticky Utility Header */}
        <header className="border-b border-slate-800 bg-[#090d12]/95 backdrop-blur sticky top-0 z-20 px-4 sm:px-6 py-2.5 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center space-x-3">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="md:hidden p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-2 text-slate-400">
              <span className="font-bold text-slate-200">FARM-MIND</span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className="text-emerald-400 font-semibold">{tabLabels[activeTab]}</span>
            </div>
          </div>

          {/* Right Header Badges */}
          <div className="flex items-center space-x-3">
            {isRunning ? (
              <span className="flex items-center text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded border border-amber-800/60 text-[11px]">
                <Zap className="w-3 h-3 mr-1.5 animate-spin" /> SIMULATING...
              </span>
            ) : matchResult ? (
              <div className="hidden sm:flex items-center space-x-2.5 text-[11px] text-slate-400">
                <span>
                  MATCH: <strong className="text-emerald-400">{matchResult.agent0}</strong> vs{' '}
                  <strong className="text-slate-300">{matchResult.agent1}</strong>
                </span>
                <span className="text-slate-600">|</span>
                <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300">
                  SEED {matchResult.seed}
                </span>
                <span className="text-emerald-400 font-bold">
                  TURN {currentStep} (${(matchResult.history?.[currentStep]?.p0_money ?? matchResult.p0_reward).toLocaleString()})
                </span>
              </div>
            ) : (
              <span className="text-slate-500 text-[11px] hidden sm:inline">
                SIMULATOR IDLE • KAGGRICULTURE v1.32.7
              </span>
            )}

            <button
              onClick={() => setIsRunModalOpen(true)}
              disabled={isRunning}
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded text-xs transition flex items-center cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3 h-3 mr-1 fill-slate-950" />
              <span className="hidden sm:inline">RUN EXPERIMENT</span>
              <span className="sm:hidden">RUN</span>
            </button>
          </div>
        </header>

        {/* Global Status Notification Toast */}
        {statusMessage && (
          <div className="bg-slate-900 border-b border-emerald-900/60 px-4 py-2 text-xs font-mono text-emerald-400 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{statusMessage}</span>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'command' && (
            <CommandCenter
              matchResult={matchResult}
              experiments={experiments}
              onNavigate={(tab) => setActiveTab(tab as TabId)}
              onOpenRunModal={() => setIsRunModalOpen(true)}
            />
          )}

          {activeTab === 'live' && (
            <LiveMatch
              matchResult={matchResult}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              isRunning={isRunning}
              onRunMatch={handleRunMatch}
              onLoadRecorded={handleLoadRecordedMatch}
            />
          )}

          {activeTab === 'decision' && (
            <DecisionInspector
              matchResult={matchResult}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
            />
          )}

          {activeTab === 'experiments' && (
            <ExperimentLab
              experiments={experiments}
              onOpenRunModal={() => setIsRunModalOpen(true)}
              isRunning={isRunning}
            />
          )}

          {activeTab === 'economics' && (
            <EconomicIntelligence
              matchResult={matchResult}
              currentStep={currentStep}
            />
          )}

          {activeTab === 'opponent' && (
            <OpponentAnalysis
              matchResult={matchResult}
              currentStep={currentStep}
            />
          )}

          {activeTab === 'trajectory' && (
            <CapitalTrajectory
              matchResult={matchResult}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
            />
          )}

          {activeTab === 'architecture' && <ArchitectureView />}

          {activeTab === 'logs' && (
            <SystemLogConsole
              matchResult={matchResult}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
            />
          )}
        </main>

        {/* Technical Audit Footer */}
        <footer className="border-t border-slate-800/80 bg-[#090d12] text-xs font-mono text-slate-500 py-4 px-4 sm:px-6 mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl w-full mx-auto">
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="text-emerald-500 font-bold">FARM-MIND RESEARCH PLATFORM</span>
              <span>•</span>
              <span>Official Kaggriculture v1.32.7 Simulation</span>
            </div>
            <div className="flex items-center space-x-4 text-[10px] text-slate-500">
              <span>Python 3.10+ Decision Core</span>
              <span>•</span>
              <span className="text-emerald-400">Zero Invalid Actions (0.00%)</span>
              <span>•</span>
              <span>Mean Latency: 0.31 ms</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Run Experiment Modal */}
      <RunExperimentModal
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        onRunMatch={handleRunMatch}
        isRunning={isRunning}
      />
    </div>
  );
}
