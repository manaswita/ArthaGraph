import React, { useState } from 'react';
import { StockOpportunity } from '../types/stock';
import { InteractiveStockChart } from './InteractiveStockChart';
import { 
  Target, 
  Clock, 
  Sparkles, 
  Copy, 
  Calculator, 
  ChevronDown, 
  ChevronUp, 
  BarChart2, 
  Check,
  AlertTriangle,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

interface StockCardProps {
  stock: StockOpportunity;
  onOpenCalculator: (stock: StockOpportunity) => void;
  onAskAi?: (stock: StockOpportunity) => void;
}

export const StockCard: React.FC<StockCardProps> = ({ stock, onOpenCalculator, onAskAi }) => {
  const [showChart, setShowChart] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyTradePlan = () => {
    const text = `
🎯 INDIAN STOCK MARKET INTELLIGENCE: ${stock.symbol} (${stock.name})
Sector: ${stock.sector} | CMP: ₹${stock.cmp} (${stock.changePercent > 0 ? '+' : ''}${stock.changePercent}%)
Horizon: ${stock.horizon || 'SWING'} | Confidence: ${stock.confidencePercent}% | Setup: ${stock.setupType}

📌 WHY SELECTED:
${stock.selectionReason}

⚡ ENTRY CONDITIONS:
${stock.entryConditions.map((c, i) => `${i + 1}. ${c}`).join('\n')}

🎯 TARGETS & STOP-LOSS:
• Target 1: ₹${stock.targetsAndStopLoss.t1} (+${stock.targetsAndStopLoss.t1GainPct}%)
• Target 2: ₹${stock.targetsAndStopLoss.t2} (+${stock.targetsAndStopLoss.t2GainPct}%)
• Hard Stop-Loss: ₹${stock.targetsAndStopLoss.hardStopLoss} (-${stock.targetsAndStopLoss.stopLossLossPct}%)
• Trailing Stop: ${stock.targetsAndStopLoss.trailingStopRule}
• Risk/Reward: ${stock.targetsAndStopLoss.riskRewardRatio}

⏳ EXPECTED HOLDING PERIOD:
${stock.holdingPeriod}

⚠️ RISKS & INVALIDATIONS:
${stock.risksAndInvalidations.map(r => `• ${r}`).join('\n')}

🔍 SUPPORTING EVIDENCE:
${stock.supportingEvidence.map(e => `✓ ${e}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white border border-blue-100 rounded-2xl p-5 sm:p-6 shadow-xs hover:border-blue-300 hover:shadow-md transition-all duration-200">
      {/* 1. Header: Ticker, Name, Price, and Confidence */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-900 text-sm font-mono">
            {stock.symbol.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {stock.symbol}
              </h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {stock.setupType}
              </span>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                stock.horizon === 'LONG_TERM'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : stock.horizon === 'SHORT_TERM'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {stock.horizon === 'LONG_TERM' ? '💎 Long Term' : stock.horizon === 'SHORT_TERM' ? '📈 Short Term' : '⚡ Swing'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {stock.name} • <span className="text-slate-700 font-medium">{stock.sector}</span>
            </p>
          </div>
        </div>

        {/* Current Price & Confidence */}
        <div className="flex items-center gap-4 text-right">
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">
              ₹{stock.cmp.toLocaleString('en-IN')}
            </div>
            <div className={`text-xs font-mono font-bold flex items-center justify-end gap-1 ${
              stock.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              <TrendingUp className="w-3.5 h-3.5" />
              {stock.changePercent > 0 ? '+' : ''}{stock.changePercent}% Today
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block font-mono">Confidence</span>
            <span className="text-sm font-bold text-blue-800 font-mono flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              {stock.confidencePercent}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Visual Price Roadmap Ladder (Stop-Loss ➔ CMP ➔ Target 1 ➔ Target 2) */}
      <div className="my-4 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-600 mb-2 flex items-center justify-between font-mono">
          <span>Action Price Roadmap</span>
          <span className="text-blue-800 font-bold">R:R {stock.targetsAndStopLoss.riskRewardRatio}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          {/* Stop Loss */}
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200">
            <span className="text-[10px] text-red-700 block font-bold uppercase">Stop-Loss (Hard)</span>
            <span className="text-sm font-bold text-red-900 font-mono mt-0.5 block">
              ₹{stock.targetsAndStopLoss.hardStopLoss}
            </span>
            <span className="text-[10px] text-red-600 font-mono font-medium">
              -{stock.targetsAndStopLoss.stopLossLossPct}% risk
            </span>
          </div>

          {/* Current / Entry Price */}
          <div className="p-2.5 rounded-lg bg-blue-100/70 border border-blue-200">
            <span className="text-[10px] text-blue-800 block font-bold uppercase">Entry Zone / CMP</span>
            <span className="text-sm font-bold text-blue-950 font-mono mt-0.5 block">
              ₹{stock.cmp.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-blue-700 font-medium">
              Buy Trigger
            </span>
          </div>

          {/* Target 1 */}
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] text-emerald-800 block font-bold uppercase">Target 1 (Primary)</span>
            <span className="text-sm font-bold text-emerald-900 font-mono mt-0.5 block">
              ₹{stock.targetsAndStopLoss.t1}
            </span>
            <span className="text-[10px] text-emerald-700 font-mono font-semibold">
              +{stock.targetsAndStopLoss.t1GainPct}% gain
            </span>
          </div>

          {/* Target 2 */}
          <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200">
            <span className="text-[10px] text-purple-800 block font-bold uppercase">Target 2 (Extended)</span>
            <span className="text-sm font-bold text-purple-900 font-mono mt-0.5 block">
              ₹{stock.targetsAndStopLoss.t2}
            </span>
            <span className="text-[10px] text-purple-700 font-mono font-semibold">
              +{stock.targetsAndStopLoss.t2GainPct}% gain
            </span>
          </div>
        </div>
      </div>

      {/* 3. Why the stock was selected */}
      <div className="mt-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-1 flex items-center gap-1.5 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Why This Stock Was Selected
        </h4>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-blue-50/30 p-3 rounded-xl border border-blue-100">
          {stock.selectionReason}
        </p>
      </div>

      {/* 4. Potential Entry Conditions */}
      <div className="mt-3.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 mb-1.5 flex items-center gap-1.5 font-mono">
          <Target className="w-3.5 h-3.5 text-blue-600" />
          Potential Entry Conditions (How to Buy)
        </h4>
        <div className="space-y-1.5">
          {stock.entryConditions.map((cond, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-white p-2 rounded-lg border border-blue-100">
              <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 font-mono font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>{cond}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Holding Period & Invalidation in Clean Two-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3.5">
        {/* Holding Period */}
        <div className="p-3 bg-white rounded-xl border border-blue-100">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 mb-1 font-mono">
            <Clock className="w-3.5 h-3.5" />
            Expected Holding Period
          </div>
          <div className="text-sm font-bold text-slate-900 font-mono">
            {stock.holdingPeriod}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Trailing SL: {stock.targetsAndStopLoss.trailingStopRule}
          </div>
        </div>

        {/* Risks & Invalidation */}
        <div className="p-3 bg-white rounded-xl border border-blue-100">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-700 mb-1 font-mono">
            <AlertTriangle className="w-3.5 h-3.5" />
            Risks & Invalidation (When to Exit)
          </div>
          <ul className="text-xs text-slate-600 space-y-1">
            {stock.risksAndInvalidations.map((risk, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-rose-600 font-bold">•</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 6. Supporting Evidence Badges */}
      <div className="mt-3.5 pt-3 border-t border-blue-100">
        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 font-mono">
          Supporting Technical & Institutional Evidence:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {stock.supportingEvidence.map((ev, i) => (
            <span
              key={i}
              className="text-xs px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-100 flex items-center gap-1 font-medium"
            >
              <Check className="w-3 h-3 text-emerald-600 shrink-0" />
              {ev}
            </span>
          ))}
        </div>
      </div>

      {/* Collapsible Chart */}
      {showChart && (
        <div className="mt-4 pt-4 border-t border-blue-100 animate-fade-in">
          <InteractiveStockChart
            symbol={stock.symbol}
            cmp={stock.cmp}
            targetsAndSL={stock.targetsAndStopLoss}
            chartData={stock.chartData}
          />
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3.5 border-t border-blue-100">
        <button
          onClick={() => setShowChart(!showChart)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-blue-700 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
        >
          <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
          {showChart ? 'Hide Chart' : 'Show Price Chart'}
          {showChart ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {onAskAi && (
            <button
              onClick={() => onAskAi(stock)}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-800 hover:text-blue-900 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              Ask AI About {stock.symbol}
            </button>
          )}

          <button
            onClick={() => onOpenCalculator(stock)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-blue-600" />
            Size Position
          </button>

          <button
            onClick={copyTradePlan}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Plan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
