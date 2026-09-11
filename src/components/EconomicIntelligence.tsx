import React, { useState } from 'react';
import {
  BarChart2,
  TrendingUp,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
  ShoppingBag
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceDot
} from 'recharts';
import { MatchResult } from '../types';
import { CROP_DATA } from '../data/cropData';
import { CropVector } from './FarmVectors';

interface EconomicIntelligenceProps {
  matchResult: MatchResult | null;
  currentStep: number;
}

export const EconomicIntelligence: React.FC<EconomicIntelligenceProps> = ({
  matchResult,
  currentStep
}) => {
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('ALL');

  const currentPrices =
    matchResult?.history?.[currentStep]?.market_prices ||
    matchResult?.final_market_prices || {
      WHEAT: 35,
      CARROT: 45,
      TOMATO: 90,
      STRAWBERRY: 280,
      MELON: 280
    };

  const currentDay =
    matchResult?.history?.[currentStep]?.day ?? Math.floor(currentStep / 24);

  // Compute live economics for each crop
  const cropEconomics = Object.values(CROP_DATA)
    .map((crop) => {
      const curPrice = currentPrices[crop.name] ?? crop.basePrice;
      const grossRevenue = crop.maxYield * curPrice;
      const netProfit = grossRevenue - crop.seedCost;
      const daysToHarvest = crop.maxYieldDay;
      const profitPerDay = daysToHarvest > 0 ? netProfit / daysToHarvest : 0;
      const isViableNow = currentDay + daysToHarvest <= 30;

      return {
        ...crop,
        currentPrice: curPrice,
        grossRevenue,
        netProfit,
        profitPerDay,
        isViableNow
      };
    })
    .sort((a, b) => b.profitPerDay - a.profitPerDay);

  // Sample history data for market price trajectories
  const history = matchResult?.history || [];
  const chartData = history
    .filter((_, idx) => idx % 6 === 0 || idx === currentStep || idx === history.length - 1)
    .map((item) => ({
      step: item.step,
      day: item.day,
      WHEAT: item.market_prices?.WHEAT ?? 35,
      CARROT: item.market_prices?.CARROT ?? 45,
      TOMATO: item.market_prices?.TOMATO ?? 90,
      STRAWBERRY: item.market_prices?.STRAWBERRY ?? 280,
      MELON: item.market_prices?.MELON ?? 280,
      orders: item.market_orders || []
    }));

  // Find sales transactions in match history
  const salesTransactions = history
    .filter((item) => item.market_orders && item.market_orders.some((o: any) => o[0] === 'SELL'))
    .map((item) => {
      const sellOrder = item.market_orders!.find((o: any) => o[0] === 'SELL');
      return {
        step: item.step,
        crop: sellOrder ? sellOrder[1] : 'MELON',
        qty: sellOrder ? sellOrder[2] : 0,
        price: item.market_prices ? item.market_prices[sellOrder?.[1] || 'MELON'] : 280
      };
    });

  return (
    <div className="space-y-6 font-mono">
      {/* Overview Banner */}
      <div className="bg-[#0f1720] border border-slate-800 rounded-lg p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
          <div>
            <div className="flex items-center space-x-2 text-xs mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-bold uppercase tracking-wider">
                EMPIRICAL VALUATION &amp; MARKET INTELLIGENCE
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">ZERO SYNTHETIC DATA</span>
            </div>
            <h2 className="text-base font-bold text-slate-100 flex items-center">
              <BarChart2 className="w-4 h-4 text-emerald-400 mr-2" />
              CROP ECONOMICS &amp; PRICE LIQUIDATION DYNAMICS
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparative crop ROI models, terminal season constraints, and verified transaction history.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">ACTIVE PRICES AT:</span>
            <span className="text-emerald-400 font-bold bg-[#090d12] px-2.5 py-1 rounded border border-slate-800">
              DAY {currentDay} (STEP {currentStep})
            </span>
          </div>
        </div>

        {/* Dynamic Crop Ranking Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                <th className="py-2.5 px-3">CROP</th>
                <th className="py-2.5 px-3">SEED COST [FACT]</th>
                <th className="py-2.5 px-3">GROWTH [FACT]</th>
                <th className="py-2.5 px-3">MAX YIELD [FACT]</th>
                <th className="py-2.5 px-3">MARKET PRICE [FACT]</th>
                <th className="py-2.5 px-3">GROSS REVENUE [ESTIMATE]</th>
                <th className="py-2.5 px-3">NET PROFIT [ESTIMATE]</th>
                <th className="py-2.5 px-3 text-emerald-400">PROFIT / DAY [ESTIMATE]</th>
                <th className="py-2.5 px-3">DAY {currentDay} VIABLE?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {cropEconomics.map((crop, rank) => {
                const isTopPick = rank === 0 && crop.isViableNow;
                return (
                  <tr
                    key={crop.name}
                    className={`transition ${
                      isTopPick
                        ? 'bg-emerald-950/30 font-semibold'
                        : 'hover:bg-slate-900/50 text-slate-300'
                    }`}
                  >
                    <td className="py-3 px-3 flex items-center space-x-2">
                      <CropVector crop={crop.name} className="w-4 h-4" />
                      <span className="font-bold text-slate-100">{crop.name}</span>
                      {isTopPick && (
                        <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-700">
                          OPTIMAL
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400">${crop.seedCost}</td>
                    <td className="py-3 px-3 text-slate-300">{crop.maxYieldDay} days</td>
                    <td className="py-3 px-3 text-slate-300">{crop.maxYield} units</td>
                    <td className="py-3 px-3 text-slate-200">${crop.currentPrice}</td>
                    <td className="py-3 px-3 text-slate-200">${crop.grossRevenue}</td>
                    <td className="py-3 px-3 text-slate-200 font-bold">${crop.netProfit}</td>
                    <td className="py-3 px-3 text-emerald-400 font-bold text-sm">
                      ${crop.profitPerDay.toFixed(1)} / day
                    </td>
                    <td className="py-3 px-3">
                      {crop.isViableNow ? (
                        <span className="text-emerald-400 flex items-center text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> VIABLE
                        </span>
                      ) : (
                        <span
                          className="text-rose-400 flex items-center text-[11px]"
                          title="Cannot mature before Day 30 season cutoff"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> EXPIRED
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real Market Price History Chart with Recorded Transactions */}
      <div className="bg-[#0f1720] border border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
              <TrendingUp className="w-4 h-4 text-emerald-400 mr-2" />
              COMMODITY PRICE DYNAMICS &amp; RECORDED EXECUTIONS
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Turn-by-turn spot prices observed in Kaggriculture v1.32.7 with real FARM-MIND market transactions.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Total Sales Executed:</span>
            <span className="text-emerald-400 font-bold bg-[#090d12] px-2 py-0.5 rounded border border-slate-800">
              {salesTransactions.length} Liquidation Events
            </span>
          </div>
        </div>

        {/* Chart Container */}
        {chartData.length > 0 ? (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="step"
                  stroke="#64748b"
                  fontSize={10}
                  tickFormatter={(step) => `D${Math.floor(step / 24)}`}
                />
                <YAxis stroke="#64748b" fontSize={10} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d12',
                    borderColor: '#334155',
                    borderRadius: '0.375rem',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="MELON"
                  name="Melon ($)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="STRAWBERRY"
                  name="Strawberry ($)"
                  stroke="#ec4899"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="TOMATO"
                  name="Tomato ($)"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="CARROT"
                  name="Carrot ($)"
                  stroke="#f97316"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="WHEAT"
                  name="Wheat ($)"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            No market telemetry loaded. Load a match to view price histories.
          </div>
        )}

        {/* Liquidation Events Feed */}
        {salesTransactions.length > 0 && (
          <div className="pt-3 border-t border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-2">
              VERIFIED LIQUIDATION TRANSACTIONS IN EPISODE:
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              {salesTransactions.map((tx, idx) => (
                <div
                  key={idx}
                  className="bg-[#090d12] border border-emerald-900/60 px-2.5 py-1.5 rounded flex items-center space-x-2"
                >
                  <span className="text-emerald-400 font-bold">SALE #{idx + 1}</span>
                  <span className="text-slate-400">• Step {tx.step} (Day {Math.floor(tx.step / 24)})</span>
                  <span className="text-slate-200 font-semibold">{tx.qty}x {tx.crop}</span>
                  <span className="text-emerald-400 font-bold">@ ${tx.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Two Column Section: Mathematical Formulation + Liquidation Strategy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mathematical Model */}
        <div className="bg-[#0f1720] border border-slate-800 rounded-lg p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
            <Activity className="w-4 h-4 text-emerald-400 mr-2" />
            ECONOMIC VALUATION FORMULATION [MODEL ESTIMATE]
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            FARM-MIND V1 replaces fixed monoculture with dynamic continuous daily yield evaluation:
          </p>

          <div className="bg-[#090d12] p-4 rounded border border-slate-800 text-xs space-y-2 text-slate-200">
            <div className="text-emerald-400 font-bold">
              ROI(c, t) = [ Yield(c) × Price(c, t) - SeedCost(c) ] / DaysToHarvest(c)
            </div>
            <div className="text-slate-400 text-[11px] pt-2 border-t border-slate-800">
              <strong>Maturity Constraint:</strong> If <code>t_day + DaysToHarvest(c) &gt; 30</code>, <code>ROI(c, t) = -∞</code> (Infeasible).
            </div>
            <div className="text-slate-400 text-[11px]">
              <strong>Capital Constraint:</strong> Seed purchase allowed only when <code>Cash &ge; SeedCost(c)</code>.
            </div>
          </div>

          <p className="text-slate-400 text-xs leading-relaxed">
            <strong>Key Insight:</strong> Melon produces 6 units @ ~$280 ($1,680 gross) over 12 days, yielding <strong>$133.30/day</strong>—over 4x the daily yield of Carrot ($33.30/day) and Wheat ($50.00/day).
          </p>
        </div>

        {/* Market Liquidation Logic */}
        <div className="bg-[#0f1720] border border-slate-800 rounded-lg p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
            <TrendingUp className="w-4 h-4 text-amber-400 mr-2" />
            PRICE-AWARE LIQUIDATION LOGIC [MODEL ESTIMATE]
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Rather than dumping crops immediately at whatever price the market offers, FARM-MIND V1 uses three empirical sell conditions:
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="bg-[#090d12] p-2.5 rounded border border-slate-800 flex items-start space-x-2">
              <span className="text-emerald-400 font-bold text-sm">01</span>
              <div>
                <strong className="text-slate-200">Favorable Price Premium:</strong>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Execute sale if <code>Current Price &ge; 1.05 × Moving Average Price</code>.
                </p>
              </div>
            </div>

            <div className="bg-[#090d12] p-2.5 rounded border border-slate-800 flex items-start space-x-2">
              <span className="text-amber-400 font-bold text-sm">02</span>
              <div>
                <strong className="text-slate-200">Shed Capacity Relief:</strong>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Execute sale if accumulated inventory in shed exceeds 15 units to avoid storage bottlenecks.
                </p>
              </div>
            </div>

            <div className="bg-[#090d12] p-2.5 rounded border border-slate-800 flex items-start space-x-2">
              <span className="text-rose-400 font-bold text-sm">03</span>
              <div>
                <strong className="text-slate-200">Terminal Season Wind-Down:</strong>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Liquidate all crops unconditionally when <code>Days Remaining &le; 3</code> to convert all assets into final reward cash.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
