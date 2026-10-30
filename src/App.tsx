import React, { useState, useEffect } from 'react';
import { 
  StockOpportunity, 
  MarketRegimeState, 
  MarketIndexData, 
  SectorPerformance, 
  LangGraphNodeTrace,
  StockQuote
} from './types/stock';
import { MarketRegimeBanner } from './components/MarketRegimeBanner';
import { StockCard } from './components/StockCard';
import { TechArchitectureTab } from './components/TechArchitectureTab';
import { AgentGuideTab } from './components/AgentGuideTab';
import { PositionCalculatorModal } from './components/PositionCalculatorModal';
import { AgentChatDrawer } from './components/AgentChatDrawer';
import { 
  Sparkles, 
  RefreshCw, 
  Download, 
  MessageSquare, 
  Search, 
  Info, 
  Cpu,
  BookOpen,
  Filter,
  HelpCircle,
  X
} from 'lucide-react';

export const STRATEGY_DEFINITIONS = {
  BALANCED: {
    title: 'Balanced Multi-Factor',
    desc: 'Harmonizes trend (20/50 EMA), momentum (RSI 52-72), volume (1.5x+), and smart money delivery. Offers the highest win-rate for steady swing trades.'
  },
  MOMENTUM_BREAKOUT: {
    title: 'Volume Breakouts',
    desc: 'Explosive volume surge (1.8x to 2.5x+) near 52-week highs. Best for capturing fast momentum expansions over 3-5 days.'
  },
  EMA_PULLBACK: {
    title: '20 EMA Dips (Pullback)',
    desc: 'Buys high-performing stocks that have temporarily dipped to test their rising 20 EMA line. High reward-to-risk entry at support.'
  },
  HIGH_DELIVERY: {
    title: 'High Delivery Accumulation',
    desc: 'Filters stocks with >55-65% delivery volume, representing shares transferred into Demat accounts for holding by institutions.'
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'shortlist' | 'architecture' | 'guide'>('shortlist');
  
  const [shortlist, setShortlist] = useState<StockOpportunity[]>([]);
  const [regime, setRegime] = useState<MarketRegimeState | null>(null);
  const [indices, setIndices] = useState<MarketIndexData[]>([]);
  const [sectors, setSectors] = useState<SectorPerformance[]>([]);
  const [allStocks, setAllStocks] = useState<StockQuote[]>([]);
  const [graphTraces, setGraphTraces] = useState<LangGraphNodeTrace[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  
  const [scanMode, setScanMode] = useState<'BALANCED' | 'MOMENTUM_BREAKOUT' | 'EMA_PULLBACK' | 'HIGH_DELIVERY'>('BALANCED');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [totalDurationMs, setTotalDurationMs] = useState<number | undefined>(undefined);
  const [lastScanTime, setLastScanTime] = useState<string>('');
  
  // Modals & Chat
  const [calculatorStock, setCalculatorStock] = useState<StockOpportunity | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [showStrategyModal, setShowStrategyModal] = useState<boolean>(false);

  // Quick ticker search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Auto-refresh interval (5 minutes for swing trading, or manual)
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [nextRefreshSec, setNextRefreshSec] = useState<number>(300);

  useEffect(() => {
    fetchMarketRegime();
    fetchStocksUniverse();
    executeScan('BALANCED');
  }, []);

  // 5-minute background refresh timer for market data & shortlist
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setNextRefreshSec((prev) => {
        if (prev <= 1) {
          fetchMarketRegime();
          executeScan(scanMode);
          return 300; // Reset to 5 minutes
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, scanMode]);

  const fetchMarketRegime = async () => {
    try {
      const res = await fetch('/api/market-regime');
      if (res.ok) {
        const data = await res.json();
        setRegime(data.regime);
        setIndices(data.indices);
        setSectors(data.sectors);
      }
    } catch (e) {
      console.warn('Using client state for regime:', e);
    }
  };

  const fetchStocksUniverse = async () => {
    try {
      const res = await fetch('/api/stocks');
      if (res.ok) {
        const data = await res.json();
        setAllStocks(data.stocks || []);
      }
    } catch (e) {
      console.warn('Failed to fetch stock universe:', e);
    }
  };

  const executeScan = async (mode = scanMode) => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/run-langgraph-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });

      if (res.ok) {
        const data = await res.json();
        setShortlist(data.finalShortlist || []);
        setGraphTraces(data.graphTraces || []);
        setLogs(data.logs || []);
        setTotalDurationMs(data.totalDurationMs);
        setLastScanTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        if (data.marketRegime) setRegime(data.marketRegime);
      }
    } catch (err: any) {
      console.error('Scan failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSearchStock = async (symbol: string) => {
    if (!symbol.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/analyze-stock/${symbol.trim().toUpperCase()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setupType: 'Momentum Breakout' })
      });

      if (res.ok) {
        const opp: StockOpportunity = await res.json();
        setShortlist(prev => [opp, ...prev.filter(p => p.symbol !== opp.symbol)]);
        setSearchQuery('');
        setActiveTab('shortlist');
      } else {
        alert(`Stock "${symbol.toUpperCase()}" not found in top NSE active watchlist. Try: TRENT, BEL, HAL, DIXON, ICICIBANK, POLYCAB`);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const downloadBriefing = () => {
    if (!shortlist.length) return;
    let content = `INDIAN STOCK MARKET INTELLIGENCE - DAILY SHORTLIST\nGenerated: ${new Date().toLocaleString('en-IN')}\n\n`;
    shortlist.forEach((s, i) => {
      content += `[${i + 1}] ${s.symbol} (${s.name}) - ₹${s.cmp}\n`;
      content += `Why Selected: ${s.selectionReason}\n`;
      content += `Entry: ${s.entryConditions.join(' | ')}\n`;
      content += `Target 1: ₹${s.targetsAndStopLoss.t1} (+${s.targetsAndStopLoss.t1GainPct}%) | Target 2: ₹${s.targetsAndStopLoss.t2} (+${s.targetsAndStopLoss.t2GainPct}%)\n`;
      content += `Hard SL: ₹${s.targetsAndStopLoss.hardStopLoss} (-${s.targetsAndStopLoss.stopLossLossPct}%)\n`;
      content += `Holding Period: ${s.holdingPeriod}\n`;
      content += `Invalidation: ${s.risksAndInvalidations.join('; ')}\n`;
      content += `Confidence: ${s.confidencePercent}% (${s.confidenceGrade})\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Indian-Stock-Intelligence-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#f1f7fd] text-slate-800 flex flex-col font-sans">
      {/* 1. Header: Light Blue, Crisp & Polished */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-blue-100 px-4 sm:px-6 py-3.5 shadow-2xs">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Market Candlestick Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center p-2 shadow-2xs">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2">
                {/* Candlestick 1 */}
                <line x1="5" y1="3" x2="5" y2="21" stroke="#94a3b8" strokeWidth="1.5" />
                <rect x="3" y="7" width="4" height="9" rx="1" fill="#2563eb" stroke="#2563eb" strokeWidth="0.5" />
                {/* Candlestick 2 */}
                <line x1="12" y1="4" x2="12" y2="20" stroke="#94a3b8" strokeWidth="1.5" />
                <rect x="10" y="5" width="4" height="12" rx="1" fill="#0284c7" stroke="#0284c7" strokeWidth="0.5" />
                {/* Candlestick 3 (Higher High) */}
                <line x1="19" y1="2" x2="19" y2="18" stroke="#94a3b8" strokeWidth="1.5" />
                <rect x="17" y="3" width="4" height="8" rx="1" fill="#10b981" stroke="#10b981" strokeWidth="0.5" />
              </svg>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                  Indian Stock Market Intelligence
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-blue-100 text-blue-800 border border-blue-200 font-semibold">
                    NSE Agent
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Autonomous Swing Trading Roadmaps • Entry, Targets & Stop-Loss
              </p>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-2">
            {/* Ask AI Follow-up Button */}
            <button
              onClick={() => setIsChatOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-100" />
              <span>Ask AI Follow-up</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>

            {/* Re-Scan Button */}
            <button
              onClick={() => executeScan(scanMode)}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-900 text-xs font-semibold rounded-xl border border-blue-200 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
              title="Refresh stock scan"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">{isScanning ? 'Scanning...' : 'Re-Scan'}</span>
            </button>

            {/* Download */}
            <button
              onClick={downloadBriefing}
              disabled={shortlist.length === 0}
              className="p-1.5 bg-white hover:bg-blue-50 text-slate-600 hover:text-slate-900 rounded-xl border border-blue-200 transition-colors cursor-pointer shadow-2xs"
              title="Download Shortlist (TXT)"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. THE 3 LIGHT BLUE TABS */}
        <div className="max-w-5xl mx-auto mt-2 pt-2 border-t border-blue-100 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Tab 1: Daily Stock Shortlist */}
            <button
              onClick={() => setActiveTab('shortlist')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'shortlist'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-900 hover:bg-blue-50/80 border border-transparent'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Daily Stock Shortlist</span>
              {shortlist.length > 0 && (
                <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'shortlist' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'
                }`}>
                  {shortlist.length}
                </span>
              )}
            </button>

            {/* Tab 2: Technical Architecture & Dev Guide */}
            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'architecture'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-900 hover:bg-blue-50/80 border border-transparent'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Technical Architecture & Dev Guide</span>
            </button>

            {/* Tab 3: Agent Guide & Methodology */}
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'guide'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-900 hover:bg-blue-50/80 border border-transparent'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Agent Guide & Methodology</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-blue-800 font-semibold hidden sm:block">
            LangGraph + Gemini 3.8
          </div>
        </div>
      </header>

      {/* 3. Main Body */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex-1 space-y-6 w-full">
        {/* Soft Market Mood Banner */}
        {regime && (
          <MarketRegimeBanner
            regime={regime}
            indices={indices}
            sectors={sectors}
          />
        )}

        {/* TAB 1: DAILY STOCK SHORTLIST */}
        {activeTab === 'shortlist' && (
          <div className="space-y-5 animate-fade-in">
            {/* Filter & Quick Ticker Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white border border-blue-100 rounded-2xl shadow-xs">
              {/* Presets with Quick Info Tooltip trigger */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-600 font-bold mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-blue-600" /> Scan Setup:
                </span>
                {[
                  { id: 'BALANCED', label: 'Balanced' },
                  { id: 'MOMENTUM_BREAKOUT', label: 'Volume Breakouts' },
                  { id: 'EMA_PULLBACK', label: '20 EMA Dips' },
                  { id: 'HIGH_DELIVERY', label: 'High Delivery' },
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setScanMode(p.id as any);
                      executeScan(p.id as any);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      scanMode === p.id
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-blue-50/80 text-blue-900 hover:bg-blue-100 border border-blue-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}

                {/* Explainer trigger */}
                <button
                  onClick={() => setShowStrategyModal(true)}
                  className="p-1 rounded-full text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors ml-1 cursor-pointer"
                  title="What do Balanced, Volume Breakouts, 20 EMA Dips, and High Delivery mean?"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>

              {/* On-Demand Stock Analyzer Box */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-blue-600" />
                  <input
                    type="text"
                    placeholder="Analyze any stock (e.g. BEL, HAL)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearchStock(searchQuery);
                    }}
                    title="Type any NSE stock symbol to generate an on-demand AI trading plan"
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-blue-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white uppercase font-mono shadow-2xs"
                  />
                </div>
                {searchQuery ? (
                  <button
                    onClick={() => handleSearchStock(searchQuery)}
                    disabled={isSearching}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 shadow-2xs"
                  >
                    {isSearching ? 'Analyzing...' : 'Analyze'}
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 hidden xl:inline">
                    (On-Demand AI)
                  </span>
                )}
              </div>
            </div>

            {/* Active Setup Info Banner */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-950 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-900">Current Strategy:</span>
                <span className="font-semibold underline decoration-blue-400">
                  {STRATEGY_DEFINITIONS[scanMode].title}
                </span>
                <span className="text-slate-600 hidden md:inline">— {STRATEGY_DEFINITIONS[scanMode].desc}</span>
              </div>
              <button
                onClick={() => setShowStrategyModal(true)}
                className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
              >
                Learn more about the 4 setups →
              </button>
            </div>

            {/* Shortlist Counter & Refresh Notice */}
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 px-1 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Today&apos;s Shortlisted Opportunities:</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono text-[11px] font-bold border border-blue-200">
                  {shortlist.length} Stocks Selected
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Auto-Refresh Status Pill */}
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 font-mono text-[11px]">
                  <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                  <span className="text-slate-600">Auto-refresh:</span>
                  <button 
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className="font-bold text-blue-700 hover:underline cursor-pointer"
                    title="Toggle 5-minute auto-refresh"
                  >
                    {autoRefresh ? `${Math.floor(nextRefreshSec / 60)}m ${nextRefreshSec % 60}s` : 'Paused'}
                  </button>
                </div>

                {lastScanTime && (
                  <span className="font-mono text-slate-500 text-[11px] hidden sm:inline">
                    Updated: {lastScanTime} IST
                  </span>
                )}
              </div>
            </div>

            {/* Shortlist Cards */}
            {isScanning && shortlist.length === 0 ? (
              <div className="bg-white border border-blue-100 rounded-2xl p-12 text-center space-y-3 shadow-xs">
                <RefreshCw className="w-7 h-7 text-blue-600 animate-spin mx-auto" />
                <div className="text-sm font-bold text-slate-900">Agent Scanning NSE Stock Universe...</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Evaluating 20 EMA pullbacks, volume breakouts, and computing exact stop-losses and targets.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {shortlist.map((stock) => (
                  <StockCard
                    key={stock.id}
                    stock={stock}
                    onOpenCalculator={(s) => setCalculatorStock(s)}
                    onAskAi={() => setIsChatOpen(true)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TECHNICAL ARCHITECTURE & DEV GUIDE */}
        {activeTab === 'architecture' && (
          <TechArchitectureTab
            traces={graphTraces}
            isScanning={isScanning}
            totalDurationMs={totalDurationMs}
            logs={logs}
            onTriggerScan={() => executeScan(scanMode)}
          />
        )}

        {/* TAB 3: AGENT GUIDE & METHODOLOGY (Explains what the agent does and the 4 setups) */}
        {activeTab === 'guide' && (
          <AgentGuideTab />
        )}
      </main>

      {/* STRATEGY EXPLAINER MODAL (Explains Balanced, Volume Breakouts, 20 EMA Dips, High Delivery) */}
      {showStrategyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white border border-blue-200 rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    What Are the 4 Scan Setups in Indian Stock Market Intelligence?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Understanding the quantitative criteria behind each strategy
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStrategyModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700">
              {/* 1. Balanced */}
              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-900 text-sm mb-1 flex items-center gap-1.5">
                  1. Balanced Multi-Factor (Recommended)
                </h4>
                <p className="leading-relaxed">
                  <strong>What it is:</strong> A composite institutional filter that looks for stocks where trend, momentum, volume, and delivery are in complete harmony.
                </p>
                <p className="mt-1 text-slate-600">
                  • <strong>Rules:</strong> Price trading above both rising 20 EMA and 50 EMA, RSI (14) between 52–72 (healthy bull zone), and positive institutional participation.
                </p>
                <p className="mt-1 text-blue-800 font-semibold">
                  🎯 Best for: General swing trading with the highest consistency and win-rate over 4–8 day holding cycles.
                </p>
              </div>

              {/* 2. Volume Breakouts */}
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200">
                <h4 className="font-bold text-emerald-900 text-sm mb-1 flex items-center gap-1.5">
                  2. Volume Breakouts (Momentum Expansion)
                </h4>
                <p className="leading-relaxed">
                  <strong>What it is:</strong> Identifies stocks breaking out of multi-week bases or near 52-week highs with massive volume spikes.
                </p>
                <p className="mt-1 text-slate-600">
                  • <strong>Rules:</strong> Volume surging to 1.8x to 2.5x+ of the 20-day average, within 5–10% of 52-week highs, and RSI &gt; 58 indicating aggressive buyers in control.
                </p>
                <p className="mt-1 text-emerald-800 font-semibold">
                  🎯 Best for: Fast aggressive momentum moves (3–5 days) that reach Target 1 and Target 2 quickly.
                </p>
              </div>

              {/* 3. 20 EMA Dips */}
              <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200">
                <h4 className="font-bold text-amber-900 text-sm mb-1 flex items-center gap-1.5">
                  3. 20 EMA Dips (Pullback to 20-Day Exponential Moving Average)
                </h4>
                <p className="leading-relaxed">
                  <strong>What it is:</strong> For traders who prefer to &quot;buy the dip&quot; rather than chasing price. Finds stocks in proven uptrends that temporarily pulled back to their rising 20 EMA support line.
                </p>
                <p className="mt-1 text-slate-600">
                  • <strong>Rules:</strong> 20 EMA &gt; 50 EMA &gt; 200 EMA uptrend, price within 2%–3.5% of the 20 EMA, low volume on the pullback (healthy digestion, not heavy selling), and a reversal confirmation candle.
                </p>
                <p className="mt-1 text-amber-900 font-semibold">
                  🎯 Best for: Conservative swing entries with tight stop-losses and exceptional risk-to-reward ratios (1:2.5+).
                </p>
              </div>

              {/* 4. High Delivery */}
              <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-200">
                <h4 className="font-bold text-purple-900 text-sm mb-1 flex items-center gap-1.5">
                  4. High Delivery (Smart Money Accumulation)
                </h4>
                <p className="leading-relaxed">
                  <strong>What it is:</strong> In India (NSE), delivery percentage represents shares bought to hold overnight in demat accounts (genuine ownership) rather than intraday speculative churn.
                </p>
                <p className="mt-1 text-slate-600">
                  • <strong>Rules:</strong> Delivery % &gt; 55% to 70%+, rising stock price, and high total delivery quantity compared to the 10-day average.
                </p>
                <p className="mt-1 text-purple-900 font-semibold">
                  🎯 Best for: Riding alongside institutional &quot;smart money&quot; (FIIs, DIIs, Mutual Funds) with high safety.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowStrategyModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Close Glossary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. AI Chat Follow-up Drawer */}
      <AgentChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        shortlist={shortlist}
        regime={regime}
      />

      {/* 5. Position Sizing Calculator Modal */}
      {calculatorStock && (
        <PositionCalculatorModal
          stock={calculatorStock}
          onClose={() => setCalculatorStock(null)}
        />
      )}

      {/* 6. Footer */}
      <footer className="border-t border-blue-100 bg-white py-4 px-4 text-center text-xs text-slate-500 mt-12 shadow-2xs">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>Indian Stock Market Intelligence • Autonomous NSE Equities Agent</span>
          <span className="text-[11px] text-slate-400">Built with LangGraph & Gemini 3.8 Flash</span>
        </div>
      </footer>
    </div>
  );
}
