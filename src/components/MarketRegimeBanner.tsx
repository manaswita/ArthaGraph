import React, { useState } from 'react';
import { MarketRegimeState, MarketIndexData, SectorPerformance } from '../types/stock';
import { TrendingUp, HelpCircle, ChevronDown, ChevronUp, Layers, DollarSign } from 'lucide-react';

interface MarketRegimeBannerProps {
  regime: MarketRegimeState;
  indices: MarketIndexData[];
  sectors: SectorPerformance[];
}

export const MarketRegimeBanner: React.FC<MarketRegimeBannerProps> = ({
  regime,
  indices,
  sectors
}) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const nifty = indices.find(i => i.symbol === 'NIFTY') || { value: 24482, changePercent: 0.69 };
  const vix = indices.find(i => i.symbol === 'INDIAVIX') || { value: 13.82 };
  const bankNifty = indices.find(i => i.symbol === 'BANKNIFTY') || { value: 52140, changePercent: 0.8 };
  const totalNetInflow = regime.fiiNetCr + regime.diiNetCr;

  return (
    <div className="bg-white border border-blue-100 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Soft Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 font-mono">
                Market Environment: Bullish Trend
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                {regime.bias}
              </span>
            </div>
            
            <div className="text-xs sm:text-sm font-medium text-slate-700 mt-1 flex flex-wrap items-center gap-2 sm:gap-3.5">
              <span>Nifty 50: <strong className="font-mono text-slate-900">{nifty.value.toLocaleString('en-IN')}</strong> <span className="text-emerald-600 text-xs font-mono font-semibold">(+{nifty.changePercent}%)</span></span>
              <span className="text-slate-300">•</span>
              <span>Bank Nifty: <strong className="font-mono text-slate-900">{bankNifty.value.toLocaleString('en-IN')}</strong> <span className="text-emerald-600 text-xs font-mono font-semibold">(+{bankNifty.changePercent}%)</span></span>
              <span className="text-slate-300">•</span>
              <span>India VIX: <strong className="font-mono text-blue-700">{vix.value}</strong> <span className="text-[11px] text-slate-500">(Low Volatility)</span></span>
              <span className="text-slate-300">•</span>
              <span>FII+DII Cash: <strong className="font-mono text-emerald-700">+₹{totalNetInflow.toLocaleString('en-IN')} Cr</strong></span>
            </div>
          </div>
        </div>

        {/* Explain Universe / Regime trigger */}
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-800 px-3 py-1.5 rounded-lg bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>About NSE Universe</span>
          {showExplanation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Expandable Explanation */}
      {showExplanation && (
        <div className="mt-3.5 pt-3.5 border-t border-blue-100 text-xs text-slate-600 space-y-2 animate-fade-in">
          <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
            <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              What is the NSE Equities Screener Universe?
            </h4>
            <p className="text-slate-700 leading-relaxed">
              <strong>NSE (National Stock Exchange)</strong> is India&apos;s premier stock exchange. The <strong>&quot;NSE Universe&quot;</strong> refers to our curated watchlist of the top ~80 most actively traded, liquid Indian stocks (including Nifty 50 companies like Reliance and ICICI Bank, as well as fast-growing midcap leaders like Trent and Dixon).
            </p>
            <p className="text-slate-600 mt-1.5">
              Every morning, our LangGraph agent scans all these stocks, filters out illiquid or downtrending names, and shortlists only the <strong>top 4 to 6 stocks</strong> showing the strongest breakout momentum, healthy volume, and high reward-to-risk setups.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
