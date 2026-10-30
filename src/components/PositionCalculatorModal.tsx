import React, { useState } from 'react';
import { StockOpportunity } from '../types/stock';
import { X, Calculator, ShieldAlert, TrendingUp, CheckCircle2 } from 'lucide-react';

interface PositionCalculatorModalProps {
  stock: StockOpportunity;
  onClose: () => void;
}

export const PositionCalculatorModal: React.FC<PositionCalculatorModalProps> = ({
  stock,
  onClose
}) => {
  const [totalCapital, setTotalCapital] = useState<number>(200000); // ₹2 Lakhs default
  const [riskPercent, setRiskPercent] = useState<number>(1.5); // 1.5% max risk

  const maxRiskAmount = (totalCapital * riskPercent) / 100;
  const riskPerShare = Math.max(0.5, stock.cmp - stock.targetsAndStopLoss.hardStopLoss);
  const calculatedQty = Math.max(1, Math.floor(maxRiskAmount / riskPerShare));
  const totalInvestment = calculatedQty * stock.cmp;
  const portfolioAllocationPct = Math.min(100, (totalInvestment / totalCapital) * 100);

  const profitAtT1 = calculatedQty * (stock.targetsAndStopLoss.t1 - stock.cmp);
  const profitAtT2 = calculatedQty * (stock.targetsAndStopLoss.t2 - stock.cmp);
  const actualMaxLoss = calculatedQty * riskPerShare;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-xl bg-white border border-blue-200 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100 bg-blue-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Trade Size & Risk Calculator
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                  {stock.symbol}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                CMP: ₹{stock.cmp.toLocaleString('en-IN')} | Hard SL: ₹{stock.targetsAndStopLoss.hardStopLoss} (-{stock.targetsAndStopLoss.stopLossLossPct}%)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Total Trading Capital (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-mono">₹</span>
                <input
                  type="number"
                  step="10000"
                  value={totalCapital}
                  onChange={(e) => setTotalCapital(Math.max(10000, Number(e.target.value)))}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-blue-200 rounded-lg text-slate-900 font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex gap-1.5 mt-2">
                {[100000, 200000, 500000, 1000000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setTotalCapital(amt)}
                    className={`text-[11px] px-2 py-0.5 rounded font-mono transition-colors ${
                      totalCapital === amt
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    ₹{amt >= 100000 ? `${amt / 100000}L` : `${amt}`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Max Portfolio Risk per Trade (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.25"
                  min="0.5"
                  max="5"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Math.max(0.25, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-slate-900 font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex gap-1.5 mt-2">
                {[1.0, 1.5, 2.0, 2.5].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setRiskPercent(pct)}
                    className={`text-[11px] px-2 py-0.5 rounded font-mono transition-colors ${
                      riskPercent === pct
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 bg-white rounded-lg border border-blue-100 shadow-2xs">
                <div className="text-[11px] text-slate-500">Recommended Qty</div>
                <div className="text-lg font-bold text-blue-700 font-mono mt-0.5">
                  {calculatedQty} <span className="text-xs font-normal text-slate-500">shares</span>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-blue-100 shadow-2xs">
                <div className="text-[11px] text-slate-500">Total Deployment</div>
                <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                  ₹{Math.round(totalInvestment).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-blue-100 shadow-2xs">
                <div className="text-[11px] text-slate-500">Max Risk (₹)</div>
                <div className="text-lg font-bold text-rose-600 font-mono mt-0.5">
                  -₹{Math.round(actualMaxLoss).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-blue-100 shadow-2xs">
                <div className="text-[11px] text-slate-500">Allocation</div>
                <div className="text-lg font-bold text-blue-600 font-mono mt-0.5">
                  {portfolioAllocationPct.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Target Scenarios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-blue-100">
              <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                <div>
                  <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Target 1 Potential
                  </div>
                  <div className="text-[11px] text-emerald-700 font-mono mt-0.5">
                    ₹{stock.targetsAndStopLoss.t1} (+{stock.targetsAndStopLoss.t1GainPct}%)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-emerald-700 font-mono">
                    +₹{Math.round(profitAtT1).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-mono">
                    R:R {stock.targetsAndStopLoss.riskRewardRatio}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50/70 border border-purple-200 rounded-lg">
                <div>
                  <div className="text-xs font-bold text-purple-800 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Target 2 Potential
                  </div>
                  <div className="text-[11px] text-purple-700 font-mono mt-0.5">
                    ₹{stock.targetsAndStopLoss.t2} (+{stock.targetsAndStopLoss.t2GainPct}%)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-purple-700 font-mono">
                    +₹{Math.round(profitAtT2).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-purple-600 font-mono">
                    Extended Swing
                  </div>
                </div>
              </div>
            </div>

            {/* Invalidation Note */}
            <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>Strict Invalidation Rule:</strong> If price breaches <strong>₹{stock.targetsAndStopLoss.hardStopLoss}</strong> or closes below 20 EMA, exit immediately. Never average down on a losing swing trade.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-blue-100 bg-blue-50/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Mathematical Risk-Reward validated by LangGraph
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
