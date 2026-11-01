import React, { useState, useEffect, useMemo } from 'react';
import { 
  StockOpportunity, 
  LiveQuote, 
  MarketStatusInfo, 
  InvestmentHorizon,
  StockQuote
} from '../types/stock';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Target, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  Flame, 
  SlidersHorizontal, 
  Calculator, 
  MessageSquare, 
  ArrowUpRight, 
  Layers, 
  Search, 
  Radio, 
  Eye, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Percent,
  Play,
  Pause,
  AlertCircle
} from 'lucide-react';

interface LiveNseDashboardProps {
  recommendedStocks: StockOpportunity[];
  allUniverseStocks: StockQuote[];
  selectedHorizon: InvestmentHorizon;
  onSelectHorizon: (h: InvestmentHorizon) => void;
  onOpenCalculator: (stock: StockOpportunity) => void;
  onOpenChat: (symbol: string) => void;
  onTriggerScan: () => void;
}

interface CustomUserPosition {
  entryPrice?: number;
  quantity?: number;
}

export const LiveNseDashboard: React.FC<LiveNseDashboardProps> = ({
  recommendedStocks,
  allUniverseStocks,
  selectedHorizon,
  onSelectHorizon,
  onOpenCalculator,
  onOpenChat,
  onTriggerScan
}) => {
  // Live Quotes State
  const [liveQuotes, setLiveQuotes] = useState<Record<string, LiveQuote>>({});
  const [marketInfo, setMarketInfo] = useState<MarketStatusInfo>({
    status: 'CLOSED',
    label: 'Checking NSE Session...',
    istTime: '--:--:-- IST'
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');
  
  // Auto-pulse streaming
  const [streamIntervalSec, setStreamIntervalSec] = useState<number>(5);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  
  // Flashing animation state for recent tick updates
  const [tickedSymbols, setTickedSymbols] = useState<Record<string, 'UP' | 'DOWN'>>({});

  // View preferences
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');
  const [proximityFilter, setProximityFilter] = useState<'ALL' | 'NEAR_T1' | 'T1_HIT' | 'T2_RUNNERS' | 'SAFE_SL'>('ALL');
  const [sortBy, setSortBy] = useState<'CLOSEST_T1' | 'GAIN_PCT' | 'CLOSEST_T2' | 'RISK_REWARD'>('CLOSEST_T1');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // User Custom Positions map: { [symbol]: { entryPrice, quantity } }
  const [userPositions, setUserPositions] = useState<Record<string, CustomUserPosition>>({});
  const [editingPositionSymbol, setEditingPositionSymbol] = useState<string | null>(null);
  const [tempEntryInput, setTempEntryInput] = useState<string>('');
  const [tempQtyInput, setTempQtyInput] = useState<string>('');

  // Fetch Live Quotes from backend
  const fetchLiveQuotes = async (force = false) => {
    try {
      setIsLoading(true);
      const symbolsToFetch = recommendedStocks.map(s => s.symbol).join(',');
      const url = `/api/live-quotes?symbols=${encodeURIComponent(symbolsToFetch)}${force ? '&force=true' : ''}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.quotes) {
          // Track tick changes for visual pulse
          const newTicks: Record<string, 'UP' | 'DOWN'> = {};
          Object.keys(data.quotes).forEach(sym => {
            const oldQuote = liveQuotes[sym];
            const newQuote = data.quotes[sym];
            if (oldQuote && newQuote && oldQuote.cmp !== newQuote.cmp) {
              newTicks[sym] = newQuote.cmp > oldQuote.cmp ? 'UP' : 'DOWN';
            }
          });

          setLiveQuotes(data.quotes);
          if (Object.keys(newTicks).length > 0) {
            setTickedSymbols(newTicks);
            setTimeout(() => setTickedSymbols({}), 1800);
          }
        }
        if (data.marketInfo) {
          setMarketInfo(data.marketInfo);
        }
        setLastRefreshedAt(new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST');
      }
    } catch (e) {
      console.warn('Failed to fetch live quotes:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchLiveQuotes(true);
  }, [recommendedStocks]);

  // Periodic live streaming loop
  useEffect(() => {
    if (!isStreaming || streamIntervalSec <= 0) return;

    const timer = setInterval(() => {
      fetchLiveQuotes(false);
    }, streamIntervalSec * 1000);

    return () => clearInterval(timer);
  }, [isStreaming, streamIntervalSec, recommendedStocks, liveQuotes]);

  // Manual interactive tick simulation for testing target approaches
  const handleSimulateTick = async (symbol: string, direction: 'UP' | 'DOWN') => {
    try {
      const res = await fetch('/api/live-quotes/tick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, direction })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.quote) {
          setLiveQuotes(prev => ({ ...prev, [symbol]: data.quote }));
          setTickedSymbols(prev => ({ ...prev, [symbol]: direction }));
          setTimeout(() => setTickedSymbols(prev => {
            const copy = { ...prev };
            delete copy[symbol];
            return copy;
          }), 1800);
        }
      }
    } catch (e) {
      console.error('Tick simulation error:', e);
    }
  };

  // Save custom user entry / qty
  const saveCustomPosition = (symbol: string) => {
    const entry = parseFloat(tempEntryInput);
    const qty = parseInt(tempQtyInput, 10);
    setUserPositions(prev => ({
      ...prev,
      [symbol]: {
        entryPrice: !isNaN(entry) && entry > 0 ? entry : undefined,
        quantity: !isNaN(qty) && qty > 0 ? qty : undefined
      }
    }));
    setEditingPositionSymbol(null);
  };

  // Compute live proximity metrics for an opportunity
  const getOpportunityLiveMetrics = (opp: StockOpportunity) => {
    const quote = liveQuotes[opp.symbol];
    const liveCmp = quote?.cmp || opp.cmp;
    const liveChange = quote?.change !== undefined ? quote.change : (opp.cmp * (opp.changePercent / 100));
    const liveChangePct = quote?.changePercent !== undefined ? quote.changePercent : opp.changePercent;
    
    // Baseline Entry: default to recommendation entry (opp.cmp) or user-entered entry
    const userPos = userPositions[opp.symbol];
    const entryPrice = userPos?.entryPrice || opp.cmp;
    const quantity = userPos?.quantity || 0;

    const t1 = opp.targetsAndStopLoss.t1;
    const t2 = opp.targetsAndStopLoss.t2;
    const sl = opp.targetsAndStopLoss.hardStopLoss;

    // Target 1 metrics
    const distanceT1Rs = Math.round((t1 - liveCmp) * 100) / 100;
    const distanceT1Pct = Math.round(((t1 - liveCmp) / liveCmp) * 10000) / 100;
    const totalT1Move = Math.max(1, t1 - entryPrice);
    const completedT1Move = liveCmp - entryPrice;
    const progressT1Pct = Math.min(100, Math.max(0, Math.round((completedT1Move / totalT1Move) * 100)));
    const isT1Hit = liveCmp >= t1;
    const isNearT1 = !isT1Hit && distanceT1Pct <= 2.0 && distanceT1Pct >= 0;

    // Target 2 metrics
    const distanceT2Rs = Math.round((t2 - liveCmp) * 100) / 100;
    const distanceT2Pct = Math.round(((t2 - liveCmp) / liveCmp) * 10000) / 100;
    const totalT2Move = Math.max(1, t2 - entryPrice);
    const completedT2Move = liveCmp - entryPrice;
    const progressT2Pct = Math.min(100, Math.max(0, Math.round((completedT2Move / totalT2Move) * 100)));
    const isT2Hit = liveCmp >= t2;
    const isNearT2 = !isT2Hit && distanceT2Pct <= 3.0 && distanceT2Pct >= 0;

    // Stop Loss Cushion
    const slCushionRs = Math.round((liveCmp - sl) * 100) / 100;
    const slCushionPct = Math.round(((liveCmp - sl) / liveCmp) * 10000) / 100;
    const isSLBreached = liveCmp <= sl;

    // Position P&L
    const openGainRs = Math.round((liveCmp - entryPrice) * 100) / 100;
    const openGainPct = Math.round(((liveCmp - entryPrice) / entryPrice) * 10000) / 100;
    const monetaryOpenPL = quantity > 0 ? Math.round(openGainRs * quantity) : null;
    const monetaryT1PL = quantity > 0 ? Math.round((t1 - entryPrice) * quantity) : null;
    const monetaryT2PL = quantity > 0 ? Math.round((t2 - entryPrice) * quantity) : null;
    const monetaryMaxRisk = quantity > 0 ? Math.round((entryPrice - sl) * quantity) : null;

    return {
      quote,
      liveCmp,
      liveChange,
      liveChangePct,
      entryPrice,
      quantity,
      t1,
      t2,
      sl,
      distanceT1Rs,
      distanceT1Pct,
      progressT1Pct,
      isT1Hit,
      isNearT1,
      distanceT2Rs,
      distanceT2Pct,
      progressT2Pct,
      isT2Hit,
      isNearT2,
      slCushionRs,
      slCushionPct,
      isSLBreached,
      openGainRs,
      openGainPct,
      monetaryOpenPL,
      monetaryT1PL,
      monetaryT2PL,
      monetaryMaxRisk
    };
  };

  // Filtered & Sorted items
  const processedOpportunities = useMemo(() => {
    let list = recommendedStocks.map(opp => {
      const metrics = getOpportunityLiveMetrics(opp);
      return { opp, metrics };
    });

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => 
        item.opp.symbol.toLowerCase().includes(q) || 
        item.opp.name.toLowerCase().includes(q) ||
        item.opp.sector.toLowerCase().includes(q)
      );
    }

    // Proximity filter
    if (proximityFilter === 'NEAR_T1') {
      list = list.filter(item => item.metrics.isNearT1);
    } else if (proximityFilter === 'T1_HIT') {
      list = list.filter(item => item.metrics.isT1Hit);
    } else if (proximityFilter === 'T2_RUNNERS') {
      list = list.filter(item => item.metrics.isT1Hit && !item.metrics.isT2Hit);
    } else if (proximityFilter === 'SAFE_SL') {
      list = list.filter(item => item.metrics.slCushionPct >= 3.0 && !item.metrics.isSLBreached);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'CLOSEST_T1') {
        // If hit, push to top or bottom? Let's sort by smallest distanceT1Pct
        return a.metrics.distanceT1Pct - b.metrics.distanceT1Pct;
      } else if (sortBy === 'GAIN_PCT') {
        return b.metrics.openGainPct - a.metrics.openGainPct;
      } else if (sortBy === 'CLOSEST_T2') {
        return a.metrics.distanceT2Pct - b.metrics.distanceT2Pct;
      } else if (sortBy === 'RISK_REWARD') {
        const rrA = parseFloat(a.opp.targetsAndStopLoss.riskRewardRatio.split(':')[1]) || 0;
        const rrB = parseFloat(b.opp.targetsAndStopLoss.riskRewardRatio.split(':')[1]) || 0;
        return rrB - rrA;
      }
      return 0;
    });

    return list;
  }, [recommendedStocks, liveQuotes, userPositions, searchQuery, proximityFilter, sortBy]);

  // Aggregate KPI summary stats
  const kpiStats = useMemo(() => {
    const total = recommendedStocks.length;
    if (total === 0) {
      return { total: 0, nearT1Count: 0, t1HitCount: 0, avgDistanceT1: 0, avgGainPct: 0 };
    }

    let nearT1Count = 0;
    let t1HitCount = 0;
    let sumDistanceT1 = 0;
    let sumGainPct = 0;

    recommendedStocks.forEach(opp => {
      const m = getOpportunityLiveMetrics(opp);
      if (m.isNearT1) nearT1Count++;
      if (m.isT1Hit) t1HitCount++;
      sumDistanceT1 += Math.max(0, m.distanceT1Pct);
      sumGainPct += m.openGainPct;
    });

    return {
      total,
      nearT1Count,
      t1HitCount,
      avgDistanceT1: Math.round((sumDistanceT1 / total) * 10) / 10,
      avgGainPct: Math.round((sumGainPct / total) * 10) / 10
    };
  }, [recommendedStocks, liveQuotes, userPositions]);

  return (
    <div className="space-y-6">
      {/* Live Market Bar & Streaming Controls */}
      <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Market Status & Connection */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <span className={`inline-block w-3.5 h-3.5 rounded-full ${
                marketInfo.status === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
              }`} />
              <span className={`absolute inline-block w-6 h-6 rounded-full opacity-30 ${
                marketInfo.status === 'OPEN' ? 'bg-emerald-400 animate-ping' : 'bg-blue-400'
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-blue-600" />
                  Track the reccomendations
                </h2>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  marketInfo.status === 'OPEN'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {marketInfo.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                <span>🕒 Last Live Tick: <strong className="text-slate-700">{lastRefreshedAt || marketInfo.istTime}</strong></span>
                <span>•</span>
                <span>Tracking <strong className="text-blue-700">{recommendedStocks.length} Recommended Stocks</strong></span>
              </p>
            </div>
          </div>

          {/* Controls: Stream Toggle, Interval, Sync Button */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Auto Stream Switch */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs">
              <button
                onClick={() => setIsStreaming(!isStreaming)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  isStreaming 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Toggle continuous live quotes polling"
              >
                {isStreaming ? <Play className="w-3 h-3 fill-white" /> : <Pause className="w-3 h-3" />}
                <span>{isStreaming ? 'Streaming' : 'Paused'}</span>
              </button>

              <select
                value={streamIntervalSec}
                onChange={(e) => setStreamIntervalSec(parseInt(e.target.value, 10))}
                disabled={!isStreaming}
                className="bg-transparent text-xs text-slate-700 px-2 py-1 outline-hidden font-medium cursor-pointer"
              >
                <option value={3}>3s Pulse</option>
                <option value={5}>5s Pulse</option>
                <option value={10}>10s Pulse</option>
                <option value={30}>30s Pulse</option>
              </select>
            </div>

            {/* Sync Now Button */}
            <button
              onClick={() => fetchLiveQuotes(true)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync Live NSE</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('CARDS')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  viewMode === 'CARDS' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                Cards View
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  viewMode === 'TABLE' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                Matrix View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        {/* Tracked Count */}
        <div className="bg-white border border-blue-100 rounded-xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Monitored</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            {kpiStats.total} <span className="text-xs font-normal text-slate-500">Picks</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
            {selectedHorizon.replace('_', ' ')} horizon
          </div>
        </div>

        {/* Near Target 1 */}
        <div className="bg-white border border-amber-200 rounded-xl p-3 sm:p-4 shadow-xs bg-linear-to-b from-amber-50/40 to-transparent">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-semibold">Near Target 1</span>
            <Flame className="w-4 h-4 text-amber-600 fill-amber-100" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-900">
            {kpiStats.nearT1Count}
          </div>
          <div className="text-[11px] text-amber-800 mt-0.5">
            Within &lt; 2.0% of T1
          </div>
        </div>

        {/* Target 1 Achieved */}
        <div className="bg-white border border-emerald-200 rounded-xl p-3 sm:p-4 shadow-xs bg-linear-to-b from-emerald-50/40 to-transparent">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-semibold">Target 1 Smashed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-900">
            {kpiStats.t1HitCount}
          </div>
          <div className="text-[11px] text-emerald-800 mt-0.5">
            Trail stop to cost!
          </div>
        </div>

        {/* Avg Distance to Target 1 */}
        <div className="bg-white border border-blue-100 rounded-xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Avg Distance to T1</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-blue-900">
            +{kpiStats.avgDistanceT1}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Remaining to first milestone
          </div>
        </div>

        {/* Average Basket Gain */}
        <div className="bg-white border border-blue-100 rounded-xl p-3 sm:p-4 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Basket Return</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className={`text-xl sm:text-2xl font-bold ${
            kpiStats.avgGainPct >= 0 ? 'text-emerald-700' : 'text-rose-600'
          }`}>
            {kpiStats.avgGainPct >= 0 ? '+' : ''}{kpiStats.avgGainPct}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Avg gain from recommendation
          </div>
        </div>
      </div>

      {/* Filter and Horizon Navigation */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-blue-200">
        {/* Horizon Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['SWING', 'SHORT_TERM', 'LONG_TERM'] as InvestmentHorizon[]).map((h) => {
            const isSelected = selectedHorizon === h;
            return (
              <button
                key={h}
                onClick={() => onSelectHorizon(h)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {h === 'SWING' && '⚡ Swing (3–8 Days)'}
                {h === 'SHORT_TERM' && '📈 Short Term (1–3 Months)'}
                {h === 'LONG_TERM' && '💎 Long Term (6–18+ Months)'}
              </button>
            );
          })}
        </div>

        {/* Proximity Filter & Sort Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setProximityFilter('ALL')}
              className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                proximityFilter === 'ALL' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setProximityFilter('NEAR_T1')}
              className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                proximityFilter === 'NEAR_T1' ? 'bg-amber-100 text-amber-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              🔥 Near T1
            </button>
            <button
              onClick={() => setProximityFilter('T1_HIT')}
              className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                proximityFilter === 'T1_HIT' ? 'bg-emerald-100 text-emerald-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              ✅ T1 Hit
            </button>
            <button
              onClick={() => setProximityFilter('T2_RUNNERS')}
              className={`px-2 py-0.5 rounded font-medium cursor-pointer ${
                proximityFilter === 'T2_RUNNERS' ? 'bg-purple-100 text-purple-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              ⭐ T2 Runners
            </button>
          </div>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-hidden font-medium cursor-pointer"
          >
            <option value="CLOSEST_T1">Sort: Closest to T1</option>
            <option value="GAIN_PCT">Sort: Highest Return %</option>
            <option value="CLOSEST_T2">Sort: Closest to T2</option>
            <option value="RISK_REWARD">Sort: Highest R:R</option>
          </select>
        </div>
      </div>

      {/* Main Content: Zero recommendations state */}
      {processedOpportunities.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-blue-300 p-10 text-center space-y-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Recommended Stocks Matching Filter</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try switching the filter to "All", or run a fresh multi-factor scan for the {selectedHorizon.replace('_', ' ')} horizon.
          </p>
          <div className="pt-2">
            <button
              onClick={onTriggerScan}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Run Intelligence Scan Now</span>
            </button>
          </div>
        </div>
      )}

      {/* CARDS VIEW */}
      {viewMode === 'CARDS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {processedOpportunities.map(({ opp, metrics }) => {
            const isTicking = tickedSymbols[opp.symbol];
            const isEditingPosition = editingPositionSymbol === opp.symbol;

            return (
              <div 
                key={opp.id || opp.symbol}
                className={`bg-white rounded-2xl border transition-all duration-300 shadow-xs hover:shadow-md overflow-hidden ${
                  metrics.isT2Hit 
                    ? 'border-purple-300 ring-1 ring-purple-200' 
                    : metrics.isT1Hit 
                      ? 'border-emerald-300 ring-1 ring-emerald-200' 
                      : metrics.isNearT1 
                        ? 'border-amber-300 ring-1 ring-amber-200' 
                        : 'border-blue-200 hover:border-blue-300'
                }`}
              >
                {/* Card Top Banner / Ticker Header */}
                <div className="p-5 border-b border-blue-50 bg-linear-to-r from-blue-50/40 via-white to-transparent">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-extrabold text-slate-900 tracking-tight font-mono">
                          {opp.symbol}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-semibold">
                          {opp.sector}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {opp.setupType}
                        </span>
                      </div>
                      <h4 className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">
                        {opp.name}
                      </h4>
                    </div>

                    {/* Proximity Milestone Badge */}
                    <div>
                      {metrics.isT2Hit ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                          🏆 Target 2 Smashed!
                        </span>
                      ) : metrics.isT1Hit ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          🎉 Target 1 Smashed!
                        </span>
                      ) : metrics.isNearT1 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                          🔥 {metrics.distanceT1Pct.toFixed(1)}% to Target 1!
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          🎯 Active Swing
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price Row: Big Live CMP & Change */}
                  <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3 pt-2">
                    <div className="flex items-baseline gap-3">
                      <div className={`text-2xl sm:text-3xl font-extrabold font-mono transition-colors duration-500 ${
                        isTicking === 'UP' 
                          ? 'text-emerald-600 bg-emerald-50 px-1 rounded' 
                          : isTicking === 'DOWN' 
                            ? 'text-rose-600 bg-rose-50 px-1 rounded' 
                            : 'text-slate-900'
                      }`}>
                        ₹{metrics.liveCmp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>

                      <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-md ${
                        metrics.liveChange >= 0 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {metrics.liveChange >= 0 ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                        <span>
                          {metrics.liveChange >= 0 ? '+' : ''}₹{metrics.liveChange.toFixed(2)} ({metrics.liveChangePct >= 0 ? '+' : ''}{metrics.liveChangePct.toFixed(2)}%)
                        </span>
                      </div>
                    </div>

                    {/* Entry Comparison */}
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500">
                        Entry: <strong className="text-slate-800">₹{metrics.entryPrice.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className={`text-xs font-semibold ${
                        metrics.openGainRs >= 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {metrics.openGainRs >= 0 ? '+' : ''}₹{metrics.openGainRs.toFixed(2)} ({metrics.openGainPct >= 0 ? '+' : ''}{metrics.openGainPct.toFixed(2)}%)
                      </div>
                    </div>
                  </div>

                  {/* Interactive Micro-Tick Simulator for User Testing */}
                  <div className="mt-3 flex items-center justify-between text-[11px] bg-slate-50/80 rounded-lg px-3 py-1.5 border border-slate-100">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Live Feed: {metrics.quote?.source || 'NSE Feed'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Simulate move:</span>
                      <button
                        onClick={() => handleSimulateTick(opp.symbol, 'UP')}
                        className="px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-mono font-bold transition-colors cursor-pointer"
                        title="Simulate +0.4% price rise towards target"
                      >
                        +0.4% ▲
                      </button>
                      <button
                        onClick={() => handleSimulateTick(opp.symbol, 'DOWN')}
                        className="px-1.5 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded font-mono font-bold transition-colors cursor-pointer"
                        title="Simulate -0.4% price dip"
                      >
                        -0.4% ▼
                      </button>
                    </div>
                  </div>
                </div>

                {/* TARGET 1 & TARGET 2 DETAIL PANELS */}
                <div className="p-5 space-y-4">
                  {/* TARGET 1 BOX */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    metrics.isT1Hit
                      ? 'bg-emerald-50/60 border-emerald-300'
                      : metrics.isNearT1
                        ? 'bg-amber-50/50 border-amber-300'
                        : 'bg-blue-50/30 border-blue-100'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                          metrics.isT1Hit ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                        }`}>
                          1
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          Target 1 (Conservative Milestone)
                        </span>
                      </div>
                      <span className="text-xs font-bold font-mono text-slate-900">
                        ₹{metrics.t1.toLocaleString('en-IN')} 
                        <span className="text-emerald-700 ml-1">
                          (+{opp.targetsAndStopLoss.t1GainPct}%)
                        </span>
                      </span>
                    </div>

                    {/* How close I am to Target 1 */}
                    <div className="grid grid-cols-2 gap-2 text-xs py-1.5 border-y border-blue-100/60 my-2">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Rupees to Target 1:</span>
                        <span className={`font-mono font-bold ${
                          metrics.isT1Hit ? 'text-emerald-700' : 'text-slate-800'
                        }`}>
                          {metrics.isT1Hit ? (
                            `🎉 Smashed by +₹${Math.abs(metrics.distanceT1Rs).toFixed(1)}`
                          ) : (
                            `₹${metrics.distanceT1Rs.toFixed(1)} to go`
                          )}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block text-[11px]">Distance Remaining:</span>
                        <span className={`font-mono font-bold ${
                          metrics.isT1Hit ? 'text-emerald-700' : metrics.isNearT1 ? 'text-amber-700 font-extrabold' : 'text-blue-700'
                        }`}>
                          {metrics.isT1Hit ? (
                            '100% Reached'
                          ) : (
                            `+${metrics.distanceT1Pct.toFixed(2)}% needed`
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar to Target 1 */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span>Journey from Entry (₹{metrics.entryPrice})</span>
                        <span className="font-semibold text-slate-700">{metrics.progressT1Pct}% Completed</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${
                            metrics.isT1Hit 
                              ? 'bg-emerald-500' 
                              : metrics.isNearT1 
                                ? 'bg-amber-500' 
                                : 'bg-blue-600'
                          }`}
                          style={{ width: `${metrics.progressT1Pct}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-2 italic flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{opp.targetsAndStopLoss.t1Rationale || 'Primary resistance & 2x ATR expansion level'}</span>
                    </p>
                  </div>

                  {/* TARGET 2 BOX */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    metrics.isT2Hit
                      ? 'bg-purple-50/60 border-purple-300'
                      : metrics.isT1Hit
                        ? 'bg-emerald-50/30 border-emerald-200'
                        : 'bg-slate-50/50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                          metrics.isT2Hit ? 'bg-purple-600 text-white' : 'bg-slate-700 text-white'
                        }`}>
                          2
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          Target 2 (Extended Trend Runner)
                        </span>
                      </div>
                      <span className="text-xs font-bold font-mono text-slate-900">
                        ₹{metrics.t2.toLocaleString('en-IN')} 
                        <span className="text-purple-700 ml-1">
                          (+{opp.targetsAndStopLoss.t2GainPct}%)
                        </span>
                      </span>
                    </div>

                    {/* How close I am to Target 2 */}
                    <div className="grid grid-cols-2 gap-2 text-xs py-1.5 border-y border-slate-200/60 my-2">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Rupees to Target 2:</span>
                        <span className={`font-mono font-bold ${
                          metrics.isT2Hit ? 'text-purple-700' : 'text-slate-800'
                        }`}>
                          {metrics.isT2Hit ? (
                            `🏆 Hit (+₹${Math.abs(metrics.distanceT2Rs).toFixed(1)})`
                          ) : (
                            `₹${metrics.distanceT2Rs.toFixed(1)} to go`
                          )}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block text-[11px]">Distance Remaining:</span>
                        <span className={`font-mono font-bold ${
                          metrics.isT2Hit ? 'text-purple-700' : 'text-slate-700'
                        }`}>
                          {metrics.isT2Hit ? (
                            '100% Reached'
                          ) : (
                            `+${metrics.distanceT2Pct.toFixed(2)}% needed`
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar to Target 2 */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span>Progress to T2</span>
                        <span className="font-semibold text-slate-700">{metrics.progressT2Pct}% Completed</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${
                            metrics.isT2Hit ? 'bg-purple-600' : 'bg-slate-600'
                          }`}
                          style={{ width: `${metrics.progressT2Pct}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-2 italic flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-600 shrink-0" />
                      <span>{opp.targetsAndStopLoss.t2Rationale || 'Extended momentum continuation target'}</span>
                    </p>
                  </div>

                  {/* STOP LOSS & SAFETY BUFFER */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-semibold text-slate-800">Hard Stop Loss: </span>
                        <span className="font-mono font-bold text-rose-700">₹{metrics.sl}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500">Safety Cushion: </span>
                      <strong className={`font-mono ${metrics.slCushionPct >= 3 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        +{metrics.slCushionPct.toFixed(1)}% safe
                      </strong>
                    </div>
                  </div>

                  {/* PERSONAL POSITION & P&L OVERRIDE */}
                  <div className="border border-blue-100 rounded-xl p-3 bg-blue-50/20">
                    {!isEditingPosition ? (
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          {metrics.quantity > 0 ? (
                            <div>
                              <span className="font-semibold text-slate-800">My Position: </span>
                              <span className="font-mono text-slate-700">{metrics.quantity} shares @ ₹{metrics.entryPrice}</span>
                              <div className="text-[11px] mt-0.5">
                                Current P&L: <strong className={`font-mono ${metrics.monetaryOpenPL! >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                  {metrics.monetaryOpenPL! >= 0 ? '+' : ''}₹{metrics.monetaryOpenPL?.toLocaleString('en-IN')}
                                </strong>
                                <span className="text-slate-400 mx-1.5">•</span>
                                T1 Profit: <strong className="font-mono text-emerald-800">+₹{metrics.monetaryT1PL?.toLocaleString('en-IN')}</strong>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">
                              Track personal trade (Quantity & Buy Price)
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setEditingPositionSymbol(opp.symbol);
                            setTempEntryInput(metrics.entryPrice.toString());
                            setTempQtyInput(metrics.quantity > 0 ? metrics.quantity.toString() : '50');
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          {metrics.quantity > 0 ? 'Edit Trade' : '+ Add My Trade'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1 text-xs">
                        <div className="flex items-center justify-between font-semibold text-slate-800">
                          <span>Set Actual Trade Details</span>
                          <button
                            onClick={() => setEditingPositionSymbol(null)}
                            className="text-slate-400 hover:text-slate-600 text-[11px]"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-slate-500 block">Buy Price (₹)</label>
                            <input
                              type="number"
                              value={tempEntryInput}
                              onChange={(e) => setTempEntryInput(e.target.value)}
                              className="w-full text-xs font-mono p-1.5 border border-slate-300 rounded-md outline-hidden focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-500 block">Quantity</label>
                            <input
                              type="number"
                              value={tempQtyInput}
                              onChange={(e) => setTempQtyInput(e.target.value)}
                              className="w-full text-xs font-mono p-1.5 border border-slate-300 rounded-md outline-hidden focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => saveCustomPosition(opp.symbol)}
                          className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Save & Compute Live P&L
                        </button>
                      </div>
                    )}
                  </div>

                  {/* BOTTOM ACTION BUTTONS */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onOpenCalculator(opp)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Size Position</span>
                    </button>
                    <button
                      onClick={() => onOpenChat(opp.symbol)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ask Agent</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MATRIX / TABLE VIEW */}
      {viewMode === 'TABLE' && (
        <div className="bg-white rounded-2xl border border-blue-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-blue-50/60 border-b border-blue-100 text-slate-700 font-bold">
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-3">Live CMP</th>
                  <th className="py-3 px-3">Entry</th>
                  <th className="py-3 px-3">Target 1 & Distance</th>
                  <th className="py-3 px-3">T1 Progress</th>
                  <th className="py-3 px-3">Target 2 & Distance</th>
                  <th className="py-3 px-3">Stop Loss</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50 font-mono">
                {processedOpportunities.map(({ opp, metrics }) => {
                  return (
                    <tr key={opp.symbol} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4 font-sans">
                        <div className="font-extrabold text-slate-900 font-mono">{opp.symbol}</div>
                        <div className="text-[11px] text-slate-500 font-normal truncate max-w-[140px]">{opp.name}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">₹{metrics.liveCmp.toFixed(2)}</div>
                        <div className={`text-[11px] font-semibold ${metrics.liveChange >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {metrics.liveChange >= 0 ? '+' : ''}{metrics.liveChangePct.toFixed(2)}%
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-700">
                        ₹{metrics.entryPrice.toFixed(2)}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">₹{metrics.t1.toFixed(2)}</div>
                        <div className={`text-[11px] font-semibold ${metrics.isT1Hit ? 'text-emerald-700' : 'text-blue-700'}`}>
                          {metrics.isT1Hit ? '✅ Hit!' : `+${metrics.distanceT1Pct.toFixed(2)}% needed`}
                        </div>
                      </td>

                      <td className="py-3 px-3 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${metrics.isT1Hit ? 'bg-emerald-500' : 'bg-blue-600'}`}
                              style={{ width: `${metrics.progressT1Pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-sans font-semibold text-slate-700">{metrics.progressT1Pct}%</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">₹{metrics.t2.toFixed(2)}</div>
                        <div className="text-[11px] text-slate-500">
                          {metrics.isT2Hit ? '🏆 Hit!' : `+${metrics.distanceT2Pct.toFixed(2)}%`}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-rose-700">₹{metrics.sl.toFixed(2)}</div>
                        <div className="text-[11px] text-emerald-700 font-semibold">
                          +{metrics.slCushionPct.toFixed(1)}% safe
                        </div>
                      </td>

                      <td className="py-3 px-3 font-sans">
                        {metrics.isT2Hit ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-800">
                            T2 Hit!
                          </span>
                        ) : metrics.isT1Hit ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                            T1 Hit!
                          </span>
                        ) : metrics.isNearT1 ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-900">
                            Near T1
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-50 text-blue-700">
                            Tracking
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenCalculator(opp)}
                            className="p-1.5 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                            title="Size Position"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenChat(opp.symbol)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Ask AI"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
