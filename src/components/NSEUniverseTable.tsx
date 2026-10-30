import React, { useState } from 'react';
import { StockQuote, StockOpportunity } from '../types/stock';
import { Search, Filter, TrendingUp, TrendingDown, Sparkles, ArrowUpDown } from 'lucide-react';

interface NSEUniverseTableProps {
  stocks: StockQuote[];
  onAnalyzeStock: (symbol: string) => void;
  analyzingSymbol?: string | null;
}

export const NSEUniverseTable: React.FC<NSEUniverseTableProps> = ({
  stocks,
  onAnalyzeStock,
  analyzingSymbol
}) => {
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'volumeMultiple' | 'deliveryPercent' | 'changePercent' | 'rsi14'>('volumeMultiple');

  const sectors = ['ALL', ...Array.from(new Set(stocks.map(s => s.sector)))];

  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
                          stock.name.toLowerCase().includes(search.toLowerCase());
    const matchesSector = selectedSector === 'ALL' || stock.sector === selectedSector;
    return matchesSearch && matchesSector;
  }).sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number));

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Search & Sector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            NSE Equities Screener Universe
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {filteredStocks.length} Stocks
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time multi-factor technical matrix tracked by the LangGraph intelligence scanner.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search ticker (e.g. TRENT, BEL)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-48 sm:w-60"
            />
          </div>

          {/* Sector Filter */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            {sectors.map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="volumeMultiple">Sort: Volume Multiple</option>
            <option value="deliveryPercent">Sort: Delivery %</option>
            <option value="changePercent">Sort: 1D % Change</option>
            <option value="rsi14">Sort: RSI (14)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3">Symbol & Name</th>
              <th className="py-2.5 px-3">Sector</th>
              <th className="py-2.5 px-3 text-right">CMP (₹)</th>
              <th className="py-2.5 px-3 text-right">1D %</th>
              <th className="py-2.5 px-3 text-right">20 EMA</th>
              <th className="py-2.5 px-3 text-right">50 EMA</th>
              <th className="py-2.5 px-3 text-right">RSI(14)</th>
              <th className="py-2.5 px-3 text-right">Vol Mult</th>
              <th className="py-2.5 px-3 text-right">Delivery %</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredStocks.map((stock) => {
              const isUp = stock.changePercent >= 0;
              const isAnalyzing = analyzingSymbol === stock.symbol;

              return (
                <tr key={stock.symbol} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-white text-xs">{stock.symbol}</div>
                    <div className="text-[10px] text-slate-400 font-sans truncate max-w-[140px]">{stock.name}</div>
                  </td>

                  <td className="py-3 px-3 text-slate-300 font-sans text-xs">
                    {stock.sector}
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-white">
                    ₹{stock.cmp.toLocaleString('en-IN')}
                  </td>

                  <td className={`py-3 px-3 text-right font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isUp ? '+' : ''}{stock.changePercent}%
                  </td>

                  <td className="py-3 px-3 text-right text-cyan-400">
                    ₹{stock.ema20}
                  </td>

                  <td className="py-3 px-3 text-right text-amber-400">
                    ₹{stock.ema50}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                      stock.rsi14 >= 60 ? 'bg-emerald-950 text-emerald-300' :
                      stock.rsi14 <= 45 ? 'bg-rose-950 text-rose-300' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {stock.rsi14}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right font-bold">
                    <span className={stock.volumeMultiple >= 1.8 ? 'text-emerald-400' : 'text-slate-300'}>
                      {stock.volumeMultiple}x
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right font-semibold text-slate-200">
                    {stock.deliveryPercent}%
                  </td>

                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onAnalyzeStock(stock.symbol)}
                      disabled={isAnalyzing}
                      className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-sans font-semibold transition-colors flex items-center gap-1 mx-auto disabled:opacity-50"
                    >
                      <Sparkles className="w-3 h-3" />
                      {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
