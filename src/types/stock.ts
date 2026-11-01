export interface StockQuote {
  symbol: string;
  name: string;
  sector: string;
  cmp: number; // Current Market Price (₹)
  change: number; // ₹ change
  changePercent: number; // % change
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  avgVolume20D: number;
  volumeMultiple: number; // Volume / AvgVolume
  deliveryPercent: number; // % of volume marked for delivery
  rsi14: number;
  ema20: number;
  ema50: number;
  ema200: number;
  high52W: number;
  low52W: number;
  distanceFrom52WHigh: number; // % below 52W High
  atr14: number; // Average True Range (volatility)
  beta: number;
  marketCapCr: number; // Market Cap in ₹ Crores
  peRatio: number;
  sparkline: number[]; // 14-day closing prices
}

export interface MarketIndexData {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
  advanceCount?: number;
  declineCount?: number;
}

export interface SectorPerformance {
  sector: string;
  changePercent: number;
  trend: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
  leaders: string[];
  momentumScore: number; // 0 - 100
}

export type MarketRegimeType = 
  | 'BULLISH_TREND' 
  | 'MOMENTUM_EXPANSION' 
  | 'RANGE_BOUND_CONSOLIDATION' 
  | 'VOLATILE_PULLBACK' 
  | 'DEFENSIVE_DISTRIBUTION';

export interface MarketRegimeState {
  regime: MarketRegimeType;
  niftyTrend: 'UPTREND' | 'SIDEWAYS' | 'DOWNTREND';
  nifty50Value: number;
  nifty50ChangePct: number;
  bankNiftyValue: number;
  bankNiftyChangePct: number;
  indiaVix: number;
  vixStatus: 'COMPLACENT' | 'NORMAL' | 'ELEVATED' | 'EXTREME';
  fiiNetCr: number; // Net FII buy/sell in ₹ Cr
  diiNetCr: number; // Net DII buy/sell in ₹ Cr
  marketBreadthRatio: number; // Advances / Declines
  bias: 'Aggressive Long' | 'Selective Long' | 'Capital Preservation / Cash' | 'Hedging Recommended';
  regimeRationale: string;
}

export interface TargetScenario {
  t1: number; // Conservative Target (₹)
  t1GainPct: number;
  t1Rationale: string;
  t2: number; // Extended Target (₹)
  t2GainPct: number;
  t2Rationale: string;
  hardStopLoss: number; // ₹
  stopLossLossPct: number;
  trailingStopRule: string;
  riskRewardRatio: string; // e.g., "1 : 2.6"
}

export type InvestmentHorizon = 'SWING' | 'SHORT_TERM' | 'LONG_TERM';

export interface StockOpportunity {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  cmp: number;
  changePercent: number;
  setupType: 'Momentum Breakout' | 'EMA 20 Pullback / Dip' | 'Cup & Handle Retest' | 'High Delivery Accumulation' | 'S/R Flip Swing' | 'Squeeze Breakout' | 'Long Term Compounding Base';
  horizon: InvestmentHorizon; // 'SWING' (1-2 weeks), 'SHORT_TERM' (1-3 months), 'LONG_TERM' (6-18+ months)
  
  // Mandatory Brief fields
  selectionReason: string; // Why the stock was selected
  entryConditions: string[]; // Potential entry conditions / triggers
  targetsAndStopLoss: TargetScenario; // Target and stop-loss scenarios
  holdingPeriod: string; // Expected holding period (e.g. 3-7 trading days)
  risksAndInvalidations: string[]; // Risks and invalidation conditions
  confidencePercent: number; // e.g. 88
  confidenceGrade: 'HIGH' | 'MODERATE_HIGH' | 'SELECTIVE';
  supportingEvidence: string[]; // Supporting evidence points
  
  // Technical footprint
  technicalBadges: string[];
  suggestedQtyFor1LakhCapital: number;
  chartData: {
    dates: string[];
    prices: number[];
    ema20: number[];
    ema50: number[];
    volumes: number[];
  };
  generatedAt: string;
}

export interface LangGraphNodeTrace {
  nodeId: string;
  nodeName: string;
  description: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
  inputSummary?: Record<string, any>;
  outputSummary?: Record<string, any>;
  statePatch?: Record<string, any>;
  logs: string[];
}

export interface LangGraphAgentState {
  scanId: string;
  mode: 'BALANCED' | 'MOMENTUM_BREAKOUT' | 'EMA_PULLBACK' | 'HIGH_DELIVERY';
  horizon?: InvestmentHorizon;
  marketRegime?: MarketRegimeState;
  sectorPerformances?: SectorPerformance[];
  screenedCandidates?: StockQuote[];
  deepTechnicalEvaluations?: {
    symbol: string;
    passed: boolean;
    setupType: string;
    score: number;
    notes: string;
  }[];
  riskEvaluations?: {
    symbol: string;
    slPrice: number;
    riskScore: number;
    invalidationTrigger: string;
  }[];
  finalShortlist: StockOpportunity[];
  graphTraces: LangGraphNodeTrace[];
  currentRunningNode?: string;
  status: 'IDLE' | 'SCANNING' | 'COMPLETED' | 'ERROR';
  totalDurationMs?: number;
  llmReasoningModel?: string;
  logs: string[];
}

export interface LiveQuote {
  symbol: string;
  name: string;
  sector: string;
  cmp: number;
  previousClose: number;
  change: number;
  changePercent: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  avgVolume20D: number;
  deliveryPercent: number;
  tickDirection: 'UP' | 'DOWN' | 'EQUAL';
  lastUpdated: string;
  source: 'NSE Live Feed' | 'NSE Market Stream';
  marketStatus: 'OPEN' | 'CLOSED' | 'PRE_MARKET';
}

export interface MarketStatusInfo {
  status: 'OPEN' | 'CLOSED' | 'PRE_MARKET';
  label: string;
  istTime: string;
}

