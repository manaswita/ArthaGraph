import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle2,
  Info, 
  Layers, 
  Activity, 
  Flame, 
  ArrowDownCircle, 
  Truck, 
  HelpCircle,
  Clock,
  Calendar,
  ChevronDown, 
  ChevronUp
} from 'lucide-react';

export const AgentGuideTab: React.FC = () => {
  const [openSetup, setOpenSetup] = useState<string | null>('balanced');

  const setups = [
    {
      id: 'balanced',
      name: '1. Balanced Multi-Factor (Recommended)',
      tag: 'All-Round Swing Quality',
      color: 'blue',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Layers,
      summary: 'The primary institutional screener that seeks harmony across trend, momentum, institutional volume, and smart money delivery.',
      criteria: [
        'Trend Alignment: CMP is trading comfortably above the rising 20 EMA, and 20 EMA > 50 EMA (confirmed structural uptrend).',
        'Momentum Zone: RSI (14) between 52 and 72 (strong bullish momentum without being overbought or divergent).',
        'Volume or Delivery Support: Either Volume Multiplier >= 1.5x average OR Delivery % >= 50% (strong hands accumulating).',
        'Market Alignment: Favors stocks in sectors outperforming benchmark Nifty 50.'
      ],
      idealFor: 'Consistently profitable swing trades with balanced risk and steady 4–8 day holding cycles.'
    },
    {
      id: 'breakouts',
      name: '2. Volume Breakouts (Momentum Expansion)',
      tag: 'Fast Aggressive Moves',
      color: 'emerald',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: Flame,
      summary: 'Detects stocks experiencing an explosive volume surge near all-time or 52-week highs, indicating institutional aggressive buying.',
      criteria: [
        'Massive Volume Surge: Current volume is at least 1.8x to 2.5x+ of the 20-day average volume.',
        'Proximity to Highs: Distance from 52-Week High is within 5% to 10% (tight consolidation before breakout).',
        'High RSI Velocity: RSI (14) above 58, indicating aggressive buyers in control.',
        'Price Expansion: Clean expansion candle closing in the top 20% of the daily high-low range.'
      ],
      idealFor: 'Traders looking for fast 3–5 day momentum expansions that can quickly reach Target 1 and Target 2.'
    },
    {
      id: 'dips',
      name: '3. 20 EMA Dips (Pullback Buyers)',
      tag: 'Discount Low-Risk Entries',
      color: 'amber',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: ArrowDownCircle,
      summary: 'Identifies strong high-performing stocks that have temporarily pulled back to their 20-Day Exponential Moving Average (20 EMA), offering a low-risk entry "on sale".',
      criteria: [
        'Uptrend Intact: The stock is in a recognized medium-term uptrend (20 EMA > 50 EMA > 200 EMA).',
        'The "Sweet Spot" Dip: Current price is within 2% to 3.5% of the rising 20 EMA.',
        'Controlled Selling: Volume on the pullback is lower than the previous up-volume (healthy digestion, not distribution).',
        'Reversal Trigger: Formation of a hammer, green bullish engulfing, or reversal candle near the 20 EMA support.'
      ],
      idealFor: 'Conservative swing traders who hate chasing high prices and prefer tight stop-losses with high reward-to-risk (1:2.5+).'
    },
    {
      id: 'delivery',
      name: '4. High Delivery (Smart Money Accumulation)',
      tag: 'Institutional Safe Hands',
      color: 'purple',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: Truck,
      summary: 'Tracks genuine institutional purchases where shares are taken into Demat accounts for long-term holding rather than intraday speculation.',
      criteria: [
        'Delivery Spike: Delivery % is at least 58% to 70%+ of total traded volume.',
        'Delivery Multiplier: Total delivery quantity is substantially higher than the 10-day average delivery volume.',
        'Absence of Speculation: Intraday churn is low; buyers are holding positions overnight.',
        'Trend Support: CMP remains above major exponential moving averages.'
      ],
      idealFor: 'Positional and high-conviction swing traders who want to ride alongside mutual funds, FIIs, and DIIs.'
    }
  ];

  const horizons = [
    {
      id: 'SWING',
      icon: '⚡',
      name: 'Swing Trading',
      timeframe: '3 – 8 Trading Days',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      summary: 'Captures short-term momentum expansions and 20 EMA mean-reversions with strict risk management.',
      targets: 'T1: +6% to +9% | T2: +10% to +14%',
      stopLoss: '1.5x ATR (Tight stop below 20 EMA or swing low)',
      trailingRule: 'Once Target 1 is hit, revise stop-loss to entry price (breakeven) and trail daily lows under 9 EMA.',
      suitability: 'Active swing traders seeking swift capital rotation and compounding across volatile weekly cycles.'
    },
    {
      id: 'SHORT_TERM',
      icon: '📈',
      name: 'Short Term Positional',
      timeframe: '4 – 12 Weeks (1 – 3 Months)',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      summary: 'Rides sustained multi-week sectoral trend waves and cup-and-handle continuations backed by 50 EMA support.',
      targets: 'T1: +12% to +18% | T2: +20% to +28%',
      stopLoss: '2.2x ATR (Anchored comfortably below rising 50 EMA)',
      trailingRule: 'Once Target 1 is achieved, trail stop-loss under previous swing low and 20-Day EMA on daily close.',
      suitability: 'Positional traders and working professionals who want sizeable trending gains without intraday stress.'
    },
    {
      id: 'LONG_TERM',
      icon: '💎',
      name: 'Long Term Compounding',
      timeframe: '6 – 18+ Months',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      summary: 'High-conviction compounding in market leaders with massive delivery accumulation (>60%) anchored above the 200 EMA.',
      targets: 'T1: +35% to +45% | T2: +60% to +85%+',
      stopLoss: '3.5x ATR (Cushioned 4% below rising 200 EMA / 50-Week EMA)',
      trailingRule: 'Quarterly review; trail stop-loss under the rising 200-Day EMA as the long-term wealth thesis matures.',
      suitability: 'Wealth builders and serious investors targeting multi-bagger upside with minimal portfolio turnover.'
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* 1. NEW DEDICATED SECTION: The 3 Investment Horizons */}
      <div className="bg-white border border-blue-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 font-mono">
              Horizon Methodology
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              The 3 Investment Horizons: Swing vs Short Term vs Long Term
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Selecting your investment horizon automatically recalibrates the screening engine, stop-loss distance, and target roadmaps:
            </p>
          </div>
        </div>

        {/* 3 Horizon Detailed Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {horizons.map((h) => (
            <div 
              key={h.id}
              className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                    <span className="text-base">{h.icon}</span>
                    <span>{h.name}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${h.badgeColor}`}>
                    {h.timeframe}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {h.summary}
                </p>
              </div>

              <div className="space-y-1.5 text-[11px] pt-2 border-t border-blue-100">
                <div className="text-slate-700">
                  <b className="text-slate-900 font-mono">Targets:</b> {h.targets}
                </div>
                <div className="text-slate-700">
                  <b className="text-slate-900 font-mono">Stop-Loss:</b> {h.stopLoss}
                </div>
                <div className="text-slate-700">
                  <b className="text-slate-900 font-mono">Trailing Rule:</b> {h.trailingRule}
                </div>
                <div className="p-2 bg-white rounded-lg border border-blue-100 font-medium text-blue-900 mt-1">
                  🎯 <strong>Suitability:</strong> {h.suitability}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Comparative Matrix */}
        <div className="overflow-x-auto rounded-xl border border-blue-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-blue-50/70 border-b border-blue-100 text-slate-700 font-mono text-[11px] uppercase">
              <tr>
                <th className="p-3">Horizon Option</th>
                <th className="p-3">Holding Period</th>
                <th className="p-3">Stop-Loss Formula</th>
                <th className="p-3">Target Multipliers</th>
                <th className="p-3">Key Technical Anchor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50 text-slate-700 font-sans">
              <tr className="hover:bg-blue-50/30">
                <td className="p-3 font-bold text-emerald-800 flex items-center gap-1.5">
                  <span>⚡</span> Swing
                </td>
                <td className="p-3 font-mono">3–8 Days</td>
                <td className="p-3 font-mono">1.5 × ATR (Tight)</td>
                <td className="p-3 font-mono text-emerald-700 font-semibold">+6% / +12%</td>
                <td className="p-3">20 EMA & Volume (1.8x+)</td>
              </tr>
              <tr className="hover:bg-blue-50/30">
                <td className="p-3 font-bold text-amber-800 flex items-center gap-1.5">
                  <span>📈</span> Short Term
                </td>
                <td className="p-3 font-mono">4–12 Weeks</td>
                <td className="p-3 font-mono">2.2 × ATR / 50 EMA</td>
                <td className="p-3 font-mono text-amber-700 font-semibold">+12% / +25%</td>
                <td className="p-3">50 EMA & Sector Rotation</td>
              </tr>
              <tr className="hover:bg-blue-50/30">
                <td className="p-3 font-bold text-purple-800 flex items-center gap-1.5">
                  <span>💎</span> Long Term
                </td>
                <td className="p-3 font-mono">6–18+ Months</td>
                <td className="p-3 font-mono">3.5 × ATR / 200 EMA</td>
                <td className="p-3 font-mono text-purple-700 font-semibold">+35% / +70%+</td>
                <td className="p-3">200 EMA & Delivery (&gt;60%)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Core Explanation Section: The 4 Scan Setups */}
      <div className="bg-white border border-blue-100 rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="flex items-start gap-3.5 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 font-mono">
              Strategy Glossary
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              What Are the 4 Scan Setups?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              The agent provides 4 quantitative strategies to scan the NSE universe according to your trading style. Here is what each setup means in plain English:
            </p>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {setups.map((s) => {
            const Icon = s.icon;
            const isSelected = openSetup === s.id;
            return (
              <div 
                key={s.id}
                onClick={() => setOpenSetup(s.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-blue-50/60 border-blue-300 shadow-sm' 
                    : 'bg-white border-blue-100 hover:border-blue-200 hover:bg-slate-50/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {s.name}
                    </h3>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.badgeColor}`}>
                    {s.tag}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mt-2">
                  {s.summary}
                </p>

                <div className="mt-3.5 pt-3 border-t border-blue-100 space-y-1.5 text-xs">
                  <span className="text-[11px] font-bold text-slate-700 uppercase block font-mono">
                    Key Quantitative Rules:
                  </span>
                  {s.criteria.map((c, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-slate-600 text-[11px]">
                      <span className="text-blue-600 font-bold shrink-0">•</span>
                      <span>{c}</span>
                    </div>
                  ))}
                  <div className="mt-2 text-[11px] font-semibold text-blue-900 bg-white p-2 rounded-lg border border-blue-100">
                    🎯 Best suited for: {s.idealFor}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Guide to the 3 Tabs */}
      <div className="bg-white border border-blue-100 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900">
            Guide to the 3 Application Tabs
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 text-xs">
          {/* Tab 1 */}
          <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-100 space-y-1.5">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center font-mono">1</span>
              Tab 1: Daily Stock Shortlist
            </h4>
            <p className="text-slate-700">
              Your primary daily workspace. Displays the top 4 to 6 shortlisted NSE stocks complete with Why Selected, Entry conditions, Target 1, Target 2, hard ATR stop-loss, holding period, and the trade sizing calculator.
            </p>
          </div>

          {/* Tab 2 */}
          <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-100 space-y-1.5">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center font-mono">2</span>
              Tab 2: Technical Architecture & Dev Guide
            </h4>
            <p className="text-slate-700">
              Developer and quant reference. Features the interactive 7-node LangGraph Directed Acyclic Graph (DAG), execution latencies, input/output inspectors, and complete source code in TypeScript (@langchain/langgraph) and Python.
            </p>
          </div>

          {/* Tab 3 */}
          <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-100 space-y-1.5">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center font-mono">3</span>
              Tab 3: Agent Guide & Methodology (Current Tab)
            </h4>
            <p className="text-slate-700">
              The full explanation of the 4 scan setups (Balanced, Volume Breakouts, 20 EMA Dips, High Delivery), trading discipline rules (1:2+ R:R, gap-up caveats), and how the agent operates.
            </p>
          </div>
        </div>

        {/* README Quick Notice */}
        <div className="mt-4 p-3.5 bg-blue-100/60 rounded-xl border border-blue-200 text-xs text-blue-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-900 font-mono">📄 README.md Available:</span>
            <span>Complete Functional and Technical documentation has been generated in the project root.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
