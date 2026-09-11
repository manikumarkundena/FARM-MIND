import React from 'react';
import {
  LayoutDashboard,
  Play,
  Cpu,
  TrendingUp,
  BarChart2,
  Users,
  FlaskConical,
  Layers,
  Terminal,
  Zap,
  ShieldCheck,
  Plus,
  Compass,
  Menu,
  X,
  Clock,
  Sparkles
} from 'lucide-react';
import { MatchResult } from '../types';

export type TabId =
  | 'command'
  | 'live'
  | 'decision'
  | 'experiments'
  | 'economics'
  | 'opponent'
  | 'trajectory'
  | 'architecture'
  | 'logs';

interface NavigationProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  matchResult: MatchResult | null;
  currentStep: number;
  isRunning: boolean;
  onOpenRunModal: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

interface NavItem {
  id: TabId;
  label: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRIMARY_NAV: NavItem[] = [
  { id: 'command', label: 'Command Center', icon: LayoutDashboard },
  { id: 'live', label: 'Live Match Arena', icon: Play },
  { id: 'decision', label: 'Decision Inspector', badge: 'Signature', icon: Cpu },
  { id: 'experiments', label: 'Experiment Lab', icon: FlaskConical },
  { id: 'economics', label: 'Economic Intelligence', icon: BarChart2 },
  { id: 'opponent', label: 'Opponent Analysis', icon: Users },
];

const SECONDARY_NAV: NavItem[] = [
  { id: 'trajectory', label: 'Capital Trajectory', icon: TrendingUp },
  { id: 'architecture', label: 'System Architecture', icon: Layers },
  { id: 'logs', label: 'Telemetry Console', icon: Terminal },
];

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  matchResult,
  currentStep,
  isRunning,
  onOpenRunModal,
  isMobileOpen,
  setIsMobileOpen
}) => {
  const renderNavList = (items: NavItem[]) => (
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setIsMobileOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-mono transition cursor-pointer ${
              isActive
                ? 'bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-800/80 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className="truncate">{item.label}</span>
            </div>
            {item.badge && (
              <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-900/60 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-700/60">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full p-4 font-mono text-xs">
      {/* Brand Platform Header */}
      <div className="border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="font-bold text-base tracking-tight text-slate-100">
              FARM<span className="text-emerald-400">-MIND</span>
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
            V1 DYNAMIC
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1 leading-tight">
          Kaggriculture Autonomous Agent Research Platform
        </p>
      </div>

      {/* Primary Action Button */}
      <button
        onClick={() => {
          onOpenRunModal();
          setIsMobileOpen(false);
        }}
        disabled={isRunning}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-2 px-3 rounded-md shadow-sm transition flex items-center justify-center space-x-1.5 mb-5 cursor-pointer disabled:opacity-50"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>RUN EXPERIMENT</span>
      </button>

      {/* Navigation Sections */}
      <div className="flex-1 space-y-5 overflow-y-auto pr-1">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-2 block mb-1.5">
            RESEARCH &amp; ARENA
          </span>
          {renderNavList(PRIMARY_NAV)}
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-2 block mb-1.5">
            SYSTEM &amp; TELEMETRY
          </span>
          {renderNavList(SECONDARY_NAV)}
        </div>
      </div>

      {/* Environment & Telemetry Status Footer */}
      <div className="pt-4 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-400">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-[10px]">SIMULATOR</span>
          <span className="text-emerald-400 font-bold">v1.32.7 Ready</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-[10px]">TURN LATENCY</span>
          <span className="text-slate-300">0.31 ms / 1000 ms</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-[10px]">INVALID ACTIONS</span>
          <span className="text-emerald-400 font-bold">0.00%</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#090d12] border-r border-slate-800/90 h-screen sticky top-0 shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Menu */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        >
          <div
            className="w-72 bg-[#090d12] border-r border-slate-800 h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 flex justify-end">
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
