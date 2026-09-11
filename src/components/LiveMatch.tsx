import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  FastForward,
  Compass,
  DollarSign,
  TrendingUp,
  Info,
  Calendar,
  Clock,
  Zap,
  ShieldCheck,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { MatchResult, StepHistoryItem, TilePlant } from '../types';
import {
  CropVector,
  FarmerVector,
  ShedVector,
  WaterDropletVector,
  MatureStarVector,
  LockedTileVector
} from './FarmVectors';

interface LiveMatchProps {
  matchResult: MatchResult | null;
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  onRunMatch: (p0: string, p1: string, seed: number, steps: number) => void;
  isRunning: boolean;
  onLoadRecorded: () => void;
}

export const LiveMatch: React.FC<LiveMatchProps> = ({
  matchResult,
  currentStep,
  setCurrentStep,
  onRunMatch,
  isRunning,
  onLoadRecorded
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(5);
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>({ x: 4, y: 4 });
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);

  const history = matchResult?.history || [];
  const maxSteps = history.length > 0 ? history.length : (matchResult?.steps_run || 720);
  const currentHistory: StepHistoryItem | undefined = history[currentStep];

  // Playback timer loop
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && maxSteps > 1) {
      const delay = Math.max(25, Math.floor(1000 / playbackSpeed));
      interval = setInterval(() => {
        setCurrentStep((prev: number) => {
          if (prev >= maxSteps - 1) {
            setIsPlaying(false);
            return maxSteps - 1;
          }
          return prev + 1;
        });
      }, delay);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, maxSteps, playbackSpeed, setCurrentStep]);

  // Stepping controls
  const handleStepBack = () => {
    setIsPlaying(false);
    setCurrentStep(Math.max(0, currentStep - 1));
  };

  const handleStepNext = () => {
    setIsPlaying(false);
    setCurrentStep(Math.min(maxSteps - 1, currentStep + 1));
  };

  const handleDayJump = (deltaDays: number) => {
    setIsPlaying(false);
    const newStep = Math.max(0, Math.min(maxSteps - 1, currentStep + deltaDays * 24));
    setCurrentStep(newStep);
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPlaying(false);
    setCurrentStep(parseInt(e.target.value, 10));
  };

  // Jump to specific event type in telemetry
  const jumpToEvent = (eventType: string) => {
    if (!history.length) return;
    setIsPlaying(false);
    // Find next step with this event
    let foundIndex = -1;
    for (let i = currentStep + 1; i < history.length; i++) {
      if (history[i]?.event === eventType) {
        foundIndex = i;
        break;
      }
    }
    // If not found after, wrap from beginning
    if (foundIndex === -1) {
      for (let i = 0; i <= currentStep; i++) {
        if (history[i]?.event === eventType) {
          foundIndex = i;
          break;
        }
      }
    }
    if (foundIndex !== -1) {
      setCurrentStep(foundIndex);
    }
  };

  // Farmer pos and plants map for current step
  const farmerPos: [number, number] = currentHistory?.p0_pos || matchResult?.p0_farmer || [4, 4];
  const activePlantsMap = new Map<string, TilePlant>();
  if (currentHistory?.plants) {
    for (const p of currentHistory.plants) {
      activePlantsMap.set(`${p.x},${p.y}`, p);
    }
  }

  // Active inspected tile (hovered takes preview precedence, otherwise selected)
  const inspectedCoords = hoveredTile || selectedTile;
  const inspectedPlant = inspectedCoords ? activePlantsMap.get(`${inspectedCoords.x},${inspectedCoords.y}`) : null;
  const isShedTile = inspectedCoords
    ? inspectedCoords.x >= 4 && inspectedCoords.x <= 5 && inspectedCoords.y >= 4 && inspectedCoords.y <= 5
    : false;
  const isNWQuad = inspectedCoords ? inspectedCoords.x <= 4 && inspectedCoords.y <= 4 : false;

  // Empty state handling
  if (!matchResult) {
    return (
      <div className="bg-[#0f1720] border border-slate-800 rounded-lg p-12 text-center max-w-xl mx-auto shadow-sm font-mono">
        <Compass className="w-12 h-12 text-emerald-500/60 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-100">No Live Episode Loaded</h3>
        <p className="text-slate-400 text-xs mt-2 leading-relaxed">
          Load the verified benchmark match (Seed 42) or execute a tournament match to visualize the 10×10 agricultural simulation and turn-by-turn agent decisions.
        </p>
        <button
          onClick={onLoadRecorded}
          disabled={isRunning}
          className="mt-5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-md shadow-sm transition inline-flex items-center cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 mr-1.5 fill-slate-950" />
          LOAD BENCHMARK MATCH (SEED 42)
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-mono">
      {/* Simulation Replay Controller Bar */}
      <div className="bg-[#0f1720] border border-slate-800 rounded-lg p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Playback Transport Buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => { setIsPlaying(false); setCurrentStep(0); }}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 transition"
              title="Reset to Turn 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleStepBack}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 transition"
              title="Previous Step"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3 py-1.5 rounded font-bold text-xs flex items-center transition cursor-pointer ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 mr-1 fill-slate-950" /> PAUSE
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-1 fill-slate-950" /> PLAY
                </>
              )}
            </button>

            <button
              onClick={handleStepNext}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 transition"
              title="Next Step"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <span className="text-slate-700 mx-1">|</span>

            {/* Day Jump */}
            <button
              onClick={() => handleDayJump(-1)}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded border border-slate-700 text-[10px] transition"
            >
              -1 DAY
            </button>
            <button
              onClick={() => handleDayJump(1)}
              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded border border-slate-700 text-[10px] transition"
            >
              +1 DAY
            </button>
          </div>

          {/* Turn, Day, Hour Counter Readout */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 text-[11px]">TURN</span>
              <span className="text-emerald-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {currentStep} / {maxSteps - 1}
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 text-[11px]">DAY</span>
              <span className="text-slate-200 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {currentHistory?.day ?? Math.floor(currentStep / 24)} / 30
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 text-[11px]">HOUR</span>
              <span className="text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {currentHistory?.hour ?? currentStep % 24}:00
              </span>
            </div>

            {/* Active Event Flag */}
            {currentHistory?.event && (
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                  currentHistory.event === 'SALE'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                    : currentHistory.event === 'PLANT'
                    ? 'bg-blue-950 text-blue-400 border border-blue-700'
                    : currentHistory.event === 'HARVEST'
                    ? 'bg-amber-950 text-amber-400 border border-amber-700'
                    : currentHistory.event === 'DROP'
                    ? 'bg-purple-950 text-purple-400 border border-purple-700'
                    : 'bg-cyan-950 text-cyan-400 border border-cyan-700'
                }`}
              >
                ★ {currentHistory.event}
              </span>
            )}
          </div>

          {/* Speed Selection */}
          <div className="flex items-center space-x-1 text-xs">
            <span className="text-slate-500 text-[10px] mr-1">SPEED:</span>
            {[1, 5, 20].map((s) => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                  playbackSpeed === s
                    ? 'bg-emerald-900 text-emerald-300 font-bold border border-emerald-700'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Turn Slider with Day Ticks */}
        <div className="pt-1">
          <input
            type="range"
            min={0}
            max={maxSteps - 1}
            value={currentStep}
            onChange={handleScrub}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
          />
          <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1 px-1">
            <span>D0</span>
            <span>D5</span>
            <span>D10</span>
            <span>D15</span>
            <span>D20</span>
            <span>D25</span>
            <span>D30</span>
          </div>
        </div>

        {/* Event Quick-Jump Strip */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80 text-[11px]">
          <span className="text-slate-500 text-[10px] mr-1 flex items-center">
            <Filter className="w-3 h-3 mr-1" /> JUMP TO EVENT:
          </span>
          {[
            { id: 'PLANT', label: 'PLANT', color: 'hover:border-blue-500 text-blue-400' },
            { id: 'WATER', label: 'WATER', color: 'hover:border-cyan-500 text-cyan-400' },
            { id: 'HARVEST', label: 'HARVEST', color: 'hover:border-amber-500 text-amber-400' },
            { id: 'DROP', label: 'DROP (SHED)', color: 'hover:border-purple-500 text-purple-400' },
            { id: 'SALE', label: 'SALE (MARKET)', color: 'hover:border-emerald-500 text-emerald-400' },
            { id: 'PURCHASE', label: 'BUY (SEEDS)', color: 'hover:border-rose-500 text-rose-400' },
          ].map((ev) => (
            <button
              key={ev.id}
              onClick={() => jumpToEvent(ev.id)}
              className={`px-2 py-0.5 bg-slate-900/90 rounded border border-slate-800 text-[10px] transition ${ev.color}`}
            >
              {ev.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Simulation View: 10×10 Grid + Agent Brain Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 10×10 Spatial Farm Grid (7 cols) */}
        <div className="lg:col-span-7 bg-[#0f1720] border border-slate-800 rounded-lg p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-200">10×10 SPATIAL ARENA</span>
              <span className="text-slate-500">|</span>
              <span className="text-emerald-400 text-[11px]">[ENVIRONMENT FACT]</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-400 text-[11px]">
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20 border border-emerald-500 mr-1" />
                Active Cluster (NW)
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-900/40 border border-amber-700 mr-1" />
                Central Shed
              </span>
            </div>
          </div>

          {/* Grid Canvas */}
          <div className="bg-[#090d12] p-3 rounded-lg border border-slate-800/80 inline-block w-full max-w-xl mx-auto">
            {/* Column Headers (X: 0..9) */}
            <div className="grid grid-cols-10 gap-1 mb-1 text-center text-[10px] text-slate-500">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i}>{i}</div>
              ))}
            </div>

            {/* 10 Rows (Y: 0..9) */}
            <div className="space-y-1">
              {Array.from({ length: 10 }).map((_, y) => (
                <div key={y} className="flex items-center gap-1">
                  {/* Row Header */}
                  <span className="w-3 text-[10px] text-slate-500 text-right pr-1">
                    {y}
                  </span>

                  {/* 10 Cells in Row */}
                  <div className="grid grid-cols-10 gap-1 flex-1">
                    {Array.from({ length: 10 }).map((_, x) => {
                      const isFarmer = farmerPos[0] === x && farmerPos[1] === y;
                      const plant = activePlantsMap.get(`${x},${y}`);
                      const isShed = x >= 4 && x <= 5 && y >= 4 && y <= 5;
                      const isNW = x <= 4 && y <= 4;
                      const isTarget =
                        currentHistory?.telemetry?.target_tile?.[0] === x &&
                        currentHistory?.telemetry?.target_tile?.[1] === y;
                      const isSelected = selectedTile?.x === x && selectedTile?.y === y;

                      // Background styling
                      let bgClass = 'bg-slate-900/60 border-slate-800/70 hover:border-slate-600';
                      if (isShed) {
                        bgClass = 'bg-amber-950/25 border-amber-800/40 hover:border-amber-600';
                      } else if (isNW) {
                        bgClass = 'bg-emerald-950/20 border-emerald-900/40 hover:border-emerald-700';
                      } else {
                        // Locked Quadrants (NE, SW, SE)
                        bgClass = 'bg-slate-950/80 border-slate-900/90 text-slate-600';
                      }

                      if (plant?.watered) {
                        bgClass += ' ring-1 ring-cyan-900/50 bg-cyan-950/20';
                      }

                      if (plant?.mature) {
                        bgClass = 'bg-emerald-900/30 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.25)]';
                      }

                      return (
                        <button
                          key={x}
                          type="button"
                          onClick={() => setSelectedTile({ x, y })}
                          onMouseEnter={() => setHoveredTile({ x, y })}
                          onMouseLeave={() => setHoveredTile(null)}
                          className={`relative aspect-square rounded border flex flex-col items-center justify-center p-0.5 transition cursor-pointer select-none ${bgClass} ${
                            isSelected ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-[#090d12]' : ''
                          } ${isTarget ? 'outline-dashed outline-1 outline-amber-400 animate-pulse' : ''}`}
                        >
                          {/* Locked Quadrant Marker */}
                          {!isNW && !isShed && (
                            <div className="opacity-40">
                              <LockedTileVector className="w-3 h-3" />
                            </div>
                          )}

                          {/* Central Shed Depot Graphic */}
                          {isShed && !plant && !isFarmer && (
                            <div className="flex flex-col items-center">
                              <ShedVector className="w-5 h-5 sm:w-6 sm:h-6 opacity-80" />
                            </div>
                          )}

                          {/* Plant Vector Visual */}
                          {plant && (
                            <div className="relative flex flex-col items-center justify-center w-full h-full">
                              <CropVector
                                crop={plant.crop || plant.kind}
                                stage={plant.mature ? 'mature' : plant.age > 2 ? 'growing' : 'sprout'}
                                className="w-4 h-4 sm:w-5 sm:h-5"
                              />

                              {/* Soil hydration badge */}
                              {plant.watered && (
                                <div className="absolute top-0 right-0">
                                  <WaterDropletVector className="w-2.5 h-2.5" />
                                </div>
                              )}

                              {/* Maturity star */}
                              {plant.mature && (
                                <div className="absolute top-0 left-0">
                                  <MatureStarVector className="w-2.5 h-2.5" />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Farmer Vector Icon */}
                          {isFarmer && (
                            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                              <FarmerVector className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Coordinates and Grid Meta */}
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
              <span>
                Inspected Tile: ({inspectedCoords?.x}, {inspectedCoords?.y}){' '}
                {isShedTile ? '[CENTRAL SHED]' : isNWQuad ? '[UNLOCKED NW CLUSTER]' : '[LOCKED EXPANSION QUADRANT]'}
              </span>
              <span>Farmer: [{farmerPos[0]}, {farmerPos[1]}]</span>
            </div>
          </div>

          {/* Hover / Selected Tile Details Inspector Card */}
          {inspectedCoords && (
            <div className="mt-4 bg-[#090d12] border border-slate-800 rounded-md p-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="text-emerald-400 font-bold">
                  TILE STATE AUDIT: ({inspectedCoords.x}, {inspectedCoords.y})
                </span>
                <span className="text-slate-500 text-[11px]">
                  Manhattan Distance to Shed: {Math.max(0, Math.min(Math.abs(inspectedCoords.x - 4), Math.abs(inspectedCoords.x - 5)) + Math.min(Math.abs(inspectedCoords.y - 4), Math.abs(inspectedCoords.y - 5)))} moves
                </span>
              </div>

              {inspectedPlant ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">CROP SPECIES</span>
                    <span className="font-bold text-slate-100 flex items-center gap-1.5">
                      <CropVector crop={inspectedPlant.crop || inspectedPlant.kind} className="w-3.5 h-3.5" />
                      {inspectedPlant.crop || inspectedPlant.kind}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">AGE / GROWTH</span>
                    <span>Day {inspectedPlant.age}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">SOIL HYDRATION</span>
                    <span className={inspectedPlant.watered ? "text-cyan-400 font-bold" : "text-amber-400"}>
                      {inspectedPlant.watered ? "HYDRATED (Watered)" : "DRY (Needs Water)"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">MATURITY STATUS</span>
                    <span className={inspectedPlant.mature ? "text-emerald-400 font-bold" : "text-slate-400"}>
                      {inspectedPlant.mature ? "MATURE (Harvestable)" : "Growing"}
                    </span>
                  </div>
                </div>
              ) : isShedTile ? (
                <p className="text-amber-400/90 text-xs">
                  Central Shed (Depot Zone): Accessible at (4,4), (4,5), (5,4), (5,5). Enables crop drop-off and market sales.
                </p>
              ) : isNWQuad ? (
                <p className="text-slate-400 text-xs">
                  Active NW quadrant tile. Empty fertile soil available for planting.
                </p>
              ) : (
                <p className="text-slate-500 text-xs">
                  Locked expansion quadrant. Accessible once land purchase is unlocked in later strategy stages.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Real-Time Telemetry & Agent Decision (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Autonomous Brain Contract at this exact turn */}
          <div className="bg-[#0f1720] border border-slate-800 rounded-lg p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-200">AUTONOMOUS DECISION</span>
                <span className="text-emerald-400 text-[10px] bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                  REAL TELEMETRY
                </span>
              </div>
              <span className="text-xs text-slate-400">TURN {currentStep}</span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Physical Action */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">PHYSICAL ACTION:</span>
                <span className="font-bold text-sm bg-[#090d12] px-3 py-1 rounded border border-slate-700 text-emerald-400 shadow-sm">
                  {currentHistory?.action || matchResult?.history?.[0]?.action || 'PASS'}
                </span>
              </div>

              {/* Market Orders */}
              {currentHistory?.market_orders && currentHistory.market_orders.length > 0 && (
                <div className="bg-[#090d12] p-2.5 rounded border border-slate-800">
                  <span className="text-slate-400 text-[11px] block mb-1">MARKET EXECUTION:</span>
                  <div className="space-y-1">
                    {currentHistory.market_orders.map((m: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center font-semibold">
                        <span className={m[0] === 'SELL' ? 'text-emerald-400' : 'text-amber-400'}>
                          {m[0]} {m[1]}
                        </span>
                        <span className="text-slate-400 text-xs">qty: {m[2]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exact Telemetry Reasoning */}
              <div className="bg-[#090d12] p-3 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase tracking-wider block mb-1">
                  REASONING JUSTIFICATION [TELEMETRY]:
                </span>
                <p className="text-slate-200 text-xs leading-relaxed italic">
                  "{currentHistory?.telemetry?.reason || 'Agent evaluating cluster priorities and crop lifecycle constraints.'}"
                </p>
              </div>

              {/* Priority & Expected Value */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-[#090d12] p-2.5 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">PRIORITY TIER</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${((currentHistory?.telemetry?.priority || 1) / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-slate-200 font-bold text-xs">
                      {currentHistory?.telemetry?.priority || 1} / 5
                    </span>
                  </div>
                </div>

                <div className="bg-[#090d12] p-2.5 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">EXPECTED VALUE</span>
                  <span className="text-emerald-400 font-bold text-sm block mt-0.5">
                    ${currentHistory?.telemetry?.expected_value?.toFixed(1) || '0.0'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Capital Comparison at this Turn */}
          <div className="bg-[#0f1720] border border-slate-800 rounded-lg p-4 shadow-sm text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200">CAPITAL BALANCE</span>
              <span className="text-slate-500 text-[11px]">[ENVIRONMENT FACT]</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-950/20 border border-emerald-900/50 p-3 rounded">
                <span className="text-slate-400 block text-[10px]">P0 ({matchResult.agent0})</span>
                <span className="text-xl font-bold text-emerald-400 mt-1 block">
                  ${(currentHistory?.p0_money ?? matchResult.p0_reward).toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-500 block mt-1">
                  Profit: +${((currentHistory?.p0_money ?? matchResult.p0_reward) - 3000).toLocaleString()}
                </span>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-3 rounded">
                <span className="text-slate-400 block text-[10px]">P1 ({matchResult.agent1})</span>
                <span className="text-xl font-bold text-slate-300 mt-1 block">
                  ${(currentHistory?.p1_money ?? matchResult.p1_reward).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Profit: +${((currentHistory?.p1_money ?? matchResult.p1_reward) - 3000).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Stored Assets & Seed Bank */}
          <div className="bg-[#0f1720] border border-slate-800 rounded-lg p-4 shadow-sm text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200">STORAGE & SEED BANK</span>
              <span className="text-slate-400 text-[11px]">Shed Inventory</span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-slate-500 text-[10px] block mb-1">SHED COMMODITIES:</span>
                <div className="flex flex-wrap gap-1.5">
                  {currentHistory?.shed &&
                  Object.entries(currentHistory.shed).filter(([_, count]) => count > 0).length > 0 ? (
                    Object.entries(currentHistory.shed)
                      .filter(([_, count]) => count > 0)
                      .map(([crop, count]) => (
                        <span key={crop} className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-slate-200 text-[11px] font-semibold flex items-center gap-1">
                          <CropVector crop={crop} className="w-3 h-3" />
                          {crop}: <strong className="text-emerald-400">{count}</strong>
                        </span>
                      ))
                  ) : (
                    <span className="text-slate-500 text-xs italic">Shed is empty</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60">
                <span className="text-slate-500 text-[10px] block mb-1">SEEDS IN RESERVE:</span>
                <div className="flex flex-wrap gap-1.5">
                  {currentHistory?.seeds &&
                  Object.entries(currentHistory.seeds).filter(([_, count]) => count > 0).length > 0 ? (
                    Object.entries(currentHistory.seeds)
                      .filter(([_, count]) => count > 0)
                      .map(([crop, count]) => (
                        <span key={crop} className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-slate-200 text-[11px] font-semibold flex items-center gap-1">
                          <CropVector crop={crop} className="w-3 h-3" />
                          {crop} seed: <strong className="text-amber-400">{count}</strong>
                        </span>
                      ))
                  ) : (
                    <span className="text-slate-500 text-xs italic">Zero seeds in bank</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
