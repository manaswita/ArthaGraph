import React, { useState, useEffect } from 'react';
import { 
  StockOpportunity, 
  MarketRegimeState, 
  MarketIndexData, 
  SectorPerformance, 
  LangGraphNodeTrace,
  StockQuote,
  InvestmentHorizon
} from './types/stock';
import { MarketRegimeBanner } from './components/MarketRegimeBanner';
import { StockCard } from './components/StockCard';
import { TechArchitectureTab } from './components/TechArchitectureTab';
import { AgentGuideTab } from './components/AgentGuideTab';
import { LiveNseDashboard } from './components/LiveNseDashboard';
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
  Clock,
  TrendingUp,
  X,
  Radio,
  Target
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

export const HORIZON_DEFINITIONS: Record<InvestmentHorizon, {
  label: string;
  icon: string;
  timeframe: string;
  desc: string;
  targetRange: string;
  stopDistance: string;
  badgeClass: string;
}> = {
  SWING: {
    label: 'Swing',
    icon: '⚡',
    timeframe: '3–8 Days',
    desc: 'Rapid momentum expansion and 20 EMA pullbacks. Tight 1.5x ATR stops to capture explosive 6%–12% moves.',
    targetRange: '+6% to +14%',
    stopDistance: '1.5x ATR',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  SHORT_TERM: {
    label: 'Short Term',
    icon: '📈',
    timeframe: '1–3 Months',
    desc: 'Positional trend continuation riding sectoral leadership and 50 EMA support for 12%–25% compounding gains.',
    targetRange: '+12% to +25%',
    stopDistance: '2.2x ATR / 50 EMA',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  LONG_TERM: {
    label: 'Long Term',
    icon: '💎',
    timeframe: '6–18+ Months',
    desc: 'High-conviction structural compounders backed by >55-65% delivery accumulation and anchored above rising 200 EMA.',
    targetRange: '+35% to +70%+',
    stopDistance: '3.5x ATR / 200 EMA',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200'
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'shortlist' | 'live_tracker' | 'architecture' | 'guide'>('shortlist');
  
  const [shortlist, setShortlist] = useState<StockOpportunity[]>([]);
  const [regime, setRegime] = useState<MarketRegimeState | null>(null);
  const [indices, setIndices] = useState<MarketIndexData[]>([]);
  const [sectors, setSectors] = useState<SectorPerformance[]>([]);
  const [allStocks, setAllStocks] = useState<StockQuote[]>([]);
  const [graphTraces, setGraphTraces] = useState<LangGraphNodeTrace[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Horizon and Mode States
  const [selectedHorizon, setSelectedHorizon] = useState<InvestmentHorizon>('SWING');
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

  // Auto-refresh interval (5 minutes, or manual)
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [nextRefreshSec, setNextRefreshSec] = useState<number>(300);

  useEffect(() => {
    fetchMarketRegime();
    fetchStocksUniverse();
    executeScan('BALANCED', 'SWING');
  }, []);

  // 5-minute background refresh timer for market data & shortlist
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setNextRefreshSec((prev) => {
        if (prev <= 1) {
          fetchMarketRegime();
          executeScan(scanMode, selectedHorizon);
          return 300; // Reset to 5 minutes
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, scanMode, selectedHorizon]);

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

  const executeScan = async (mode = scanMode, horizon = selectedHorizon) => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/run-langgraph-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, horizon })
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
        body: JSON.stringify({ 
          setupType: selectedHorizon === 'LONG_TERM' ? 'Long Term Compounding Base' : 'Momentum Breakout',
          horizon: selectedHorizon
        })
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
    let content = `INDIAN STOCK MARKET INTELLIGENCE - DAILY SHORTLIST\nHorizon: ${selectedHorizon} (${HORIZON_DEFINITIONS[selectedHorizon].timeframe})\nGenerated: ${new Date().toLocaleString('en-IN')}\n\n`;
    shortlist.forEach((s, i) => {
      content += `[${i + 1}] ${s.symbol} (${s.name}) - ₹${s.cmp}\n`;
      content += `Horizon: ${s.horizon || selectedHorizon} | Setup: ${s.setupType}\n`;
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

        {/* 2. THE 4 NAVIGATION TABS */}
        <div className="max-w-5xl mx-auto mt-2 pt-2 border-t border-blue-100 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Tab 1: Recommended Stocks (First & Default) */}
            <button
              onClick={() => setActiveTab('shortlist')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'shortlist'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-900 hover:bg-blue-50/80 border border-transparent'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended Stocks</span>
              {shortlist.length > 0 && (
                <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'shortlist' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'
                }`}>
                  {shortlist.length}
                </span>
              )}
            </button>

            {/* Tab 2: Track the reccomendations */}
            <button
              onClick={() => setActiveTab('live_tracker')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'live_tracker'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-900 hover:bg-blue-50/80 border border-transparent'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${activeTab === 'live_tracker' ? 'text-white' : 'text-blue-600'}`} />
              <span>Track the reccomendations</span>
              <span className="flex h-2 w-2 relative ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </button>

            {/* Tab 3: Technical Architecture & Dev Guide */}
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

            {/* Tab 4: Agent Guide & Methodology */}
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

        {/* TAB 0: LIVE NSE TARGET TRACKER DASHBOARD */}
        {activeTab === 'live_tracker' && (
          <div className="animate-fade-in">
            <LiveNseDashboard
              recommendedStocks={shortlist.filter(s => !s.horizon || s.horizon === selectedHorizon).length > 0 
                ? shortlist.filter(s => !s.horizon || s.horizon === selectedHorizon) 
                : shortlist
              }
              allUniverseStocks={allStocks}
              selectedHorizon={selectedHorizon}
              onSelectHorizon={(h) => {
                setSelectedHorizon(h);
                executeScan(scanMode, h);
              }}
              onOpenCalculator={(stock) => setCalculatorStock(stock)}
              onOpenChat={(symbol) => setIsChatOpen(true)}
              onTriggerScan={() => executeScan(scanMode, selectedHorizon)}
            />
          </div>
        )}

        {/* TAB 1: DAILY STOCK SHORTLIST */}
        {activeTab === 'shortlist' && (() => {
          const displayedStocks = shortlist.filter(s => !s.horizon || s.horizon === selectedHorizon);
          const activeList = displayedStocks.length > 0 ? displayedStocks : shortlist;

          return (
            <div className="space-y-5 animate-fade-in">
              {/* 3 INVESTMENT HORIZON SELECTION BAR */}
              <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 font-mono flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Investment Horizon:
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                      Select your holding timeframe to tune stops, targets & stock selection
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    Active: {HORIZON_DEFINITIONS[selectedHorizon].label} ({HORIZON_DEFINITIONS[selectedHorizon].timeframe})
                  </span>
                </div>

                {/* The 3 Interactive Horizon Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['SWING', 'SHORT_TERM', 'LONG_TERM'] as InvestmentHorizon[]).map((hKey) => {
                    const h = HORIZON_DEFINITIONS[hKey];
                    const isSelected = selectedHorizon === hKey;
                    return (
                      <button
                        key={hKey}
                        onClick={() => {
                          setSelectedHorizon(hKey);
                          executeScan(scanMode, hKey);
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                          isSelected
                            ? hKey === 'LONG_TERM'
                              ? 'bg-purple-50/90 border-purple-400 shadow-xs ring-2 ring-purple-300/60'
                              : hKey === 'SHORT_TERM'
                              ? 'bg-amber-50/90 border-amber-400 shadow-xs ring-2 ring-amber-300/60'
                              : 'bg-emerald-50/90 border-emerald-400 shadow-xs ring-2 ring-emerald-300/60'
                            : 'bg-slate-50/60 border-blue-100 hover:border-blue-200 hover:bg-blue-50/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2 font-extrabold text-sm text-slate-900">
                            <span className="text-base">{h.icon}</span>
                            <span>{h.label}</span>
                          </div>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            isSelected
                              ? 'bg-white text-slate-900 border-slate-300 shadow-2xs'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {h.timeframe}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {h.desc}
                        </p>
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-mono">
                          <span className="text-slate-500">Targets: <b className="text-slate-800">{h.targetRange}</b></span>
                          <span className="text-slate-500">SL: <b className="text-slate-800">{h.stopDistance}</b></span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter & Quick Ticker Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white border border-blue-100 rounded-2xl shadow-xs">
                {/* Presets with Quick Info Tooltip trigger */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-slate-600 font-bold mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-blue-600" /> Strategy:
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
                        executeScan(p.id as any, selectedHorizon);
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
                      placeholder={`Analyze stock for ${HORIZON_DEFINITIONS[selectedHorizon].label} (e.g. BEL)...`}
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
                  <span className="font-bold text-blue-900">Active Scan:</span>
                  <span className="font-semibold underline decoration-blue-400">
                    {HORIZON_DEFINITIONS[selectedHorizon].label} ({HORIZON_DEFINITIONS[selectedHorizon].timeframe})
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-semibold">
                    {STRATEGY_DEFINITIONS[scanMode].title}
                  </span>
                  <span className="text-slate-600 hidden md:inline">— {STRATEGY_DEFINITIONS[scanMode].desc}</span>
                </div>
                <button
                  onClick={() => setShowStrategyModal(true)}
                  className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                >
                  Learn more about setups & horizons →
                </button>
              </div>

              {/* Shortlist Counter & Refresh Notice */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 px-1 gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">
                    {HORIZON_DEFINITIONS[selectedHorizon].label} Shortlisted Opportunities:
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono text-[11px] font-bold border border-blue-200">
                    {activeList.length} Stocks Matching
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
              {isScanning && activeList.length === 0 ? (
                <div className="bg-white border border-blue-100 rounded-2xl p-12 text-center space-y-3 shadow-xs">
                  <RefreshCw className="w-7 h-7 text-blue-600 animate-spin mx-auto" />
                  <div className="text-sm font-bold text-slate-900">
                    Scanning NSE Universe for {HORIZON_DEFINITIONS[selectedHorizon].label} Setups...
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Computing {HORIZON_DEFINITIONS[selectedHorizon].timeframe} targets, dynamic stop-loss, and institutional thesis with Gemini AI.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {activeList.map((stock) => (
                    <StockCard
                      key={stock.id}
                      stock={stock}
                      onOpenCalculator={(s) => setCalculatorStock(s)}
                      onAskAi={() => setIsChatOpen(true)}
                      onTrackLive={() => setActiveTab('live_tracker')}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })()}

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
                    Setups & Investment Horizons Guide
                  </h3>
                  <p className="text-xs text-slate-500">
                    How the Agent calibrates holding periods, stops, targets, and stock filters
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
              {/* The 3 Horizons Overview */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-blue-200">
                <span className="text-[10px] font-mono uppercase font-bold text-blue-800 block mb-1">
                  ⏱️ The 3 Investment Horizons Explained
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                  <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                    <span className="font-bold text-emerald-800 text-xs flex items-center gap-1">
                      ⚡ Swing (3–8 Days)
                    </span>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Tight 1.5x ATR stops under 20 EMA. Aims for rapid 6%–14% tactical impulse moves.
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-amber-200">
                    <span className="font-bold text-amber-800 text-xs flex items-center gap-1">
                      📈 Short Term (1–3 Months)
                    </span>
                    <p className="text-[11px] text-slate-600 mt-1">
                      2.2x ATR stops anchored below 50 EMA. Captures 12%–25% multi-week sectoral trend continuation.
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-purple-200">
                    <span className="font-bold text-purple-800 text-xs flex items-center gap-1">
                      💎 Long Term (6–18+ Months)
                    </span>
                    <p className="text-[11px] text-slate-600 mt-1">
                      3.5x ATR stops anchored under 200 EMA. Targets 35%–70%+ structural wealth compounding.
                    </p>
                  </div>
                </div>
              </div>
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
