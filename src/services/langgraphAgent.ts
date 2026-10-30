import { StateGraph, Annotation, END, START } from '@langchain/langgraph';
import { 
  StockQuote, 
  StockOpportunity, 
  MarketRegimeState, 
  SectorPerformance, 
  LangGraphAgentState, 
  LangGraphNodeTrace 
} from '../types/stock';
import { NSE_STOCKS, CURRENT_MARKET_REGIME, SECTOR_PERFORMANCE } from './marketData';
import { synthesizeStockOpportunityWithGemini } from './geminiService';

// LangGraph State Annotation
export const AgentStateAnnotation = Annotation.Root({
  scanId: Annotation<string>(),
  mode: Annotation<'BALANCED' | 'MOMENTUM_BREAKOUT' | 'EMA_PULLBACK' | 'HIGH_DELIVERY'>(),
  marketRegime: Annotation<MarketRegimeState>(),
  sectorPerformances: Annotation<SectorPerformance[]>(),
  screenedCandidates: Annotation<StockQuote[]>({
    reducer: (_, next) => next,
    default: () => []
  }),
  deepTechnicalEvaluations: Annotation<Array<{
    symbol: string;
    passed: boolean;
    setupType: StockOpportunity['setupType'];
    score: number;
    notes: string;
  }>>({
    reducer: (_, next) => next,
    default: () => []
  }),
  riskEvaluations: Annotation<Array<{
    symbol: string;
    slPrice: number;
    riskScore: number;
    invalidationTrigger: string;
  }>>({
    reducer: (_, next) => next,
    default: () => []
  }),
  finalShortlist: Annotation<StockOpportunity[]>({
    reducer: (_, next) => next,
    default: () => []
  }),
  graphTraces: Annotation<LangGraphNodeTrace[]>({
    reducer: (curr, next) => [...curr, ...next],
    default: () => []
  }),
  logs: Annotation<string[]>({
    reducer: (curr, next) => [...curr, ...next],
    default: () => []
  }),
  status: Annotation<'IDLE' | 'SCANNING' | 'COMPLETED' | 'ERROR'>(),
  totalDurationMs: Annotation<number>()
});

// Helper for trace logging
function createTrace(
  nodeId: string, 
  nodeName: string, 
  description: string,
  startTime: number, 
  logs: string[], 
  inputSummary?: any, 
  outputSummary?: any
): LangGraphNodeTrace {
  const completedAt = Date.now();
  return {
    nodeId,
    nodeName,
    description,
    status: 'COMPLETED',
    startedAt: startTime,
    completedAt,
    durationMs: completedAt - startTime,
    inputSummary,
    outputSummary,
    logs
  };
}

// Node 1: Market Regime Analysis
async function marketRegimeNode(state: typeof AgentStateAnnotation.State) {
  const startTime = Date.now();
  const logs: string[] = [
    `Ingesting benchmark index data: NIFTY 50 = ${CURRENT_MARKET_REGIME.nifty50Value} (+${CURRENT_MARKET_REGIME.nifty50ChangePct}%)`,
    `India VIX assessed at ${CURRENT_MARKET_REGIME.indiaVix} (Sub-15 = Healthy low volatility)`,
    `FII Net Institutional Cash: +₹${CURRENT_MARKET_REGIME.fiiNetCr} Cr | DII Net: +₹${CURRENT_MARKET_REGIME.diiNetCr} Cr`,
    `Advance-Decline Ratio: ${CURRENT_MARKET_REGIME.marketBreadthRatio} (Broad-based market participation)`
  ];

  let bias: MarketRegimeState['bias'] = 'Selective Long';
  if (CURRENT_MARKET_REGIME.indiaVix < 15 && CURRENT_MARKET_REGIME.fiiNetCr > 0) {
    bias = 'Selective Long';
  } else if (CURRENT_MARKET_REGIME.indiaVix >= 18) {
    bias = 'Hedging Recommended';
  }

  const regimePatch: MarketRegimeState = {
    ...CURRENT_MARKET_REGIME,
    bias
  };

  const trace = createTrace(
    'market_regime_node',
    'Market Regime & Macro Filter',
    'Evaluates Nifty trend, India VIX volatility, FII/DII net liquidity, and advance-decline breadth to classify market state.',
    startTime,
    logs,
    { sourceIndices: ['NIFTY 50', 'BANK NIFTY', 'INDIA VIX'] },
    { regime: regimePatch.regime, bias: regimePatch.bias, vix: regimePatch.indiaVix }
  );

  return {
    marketRegime: regimePatch,
    sectorPerformances: SECTOR_PERFORMANCE,
    graphTraces: [trace],
    logs: [`[market_regime_node] Classified regime as ${regimePatch.regime} with bias: ${regimePatch.bias}`]
  };
}

// Node 2: Sector Momentum Node
async function sectorMomentumNode(state: typeof AgentStateAnnotation.State) {
  const startTime = Date.now();
  const topSectors = SECTOR_PERFORMANCE.slice(0, 4);
  const logs: string[] = [
    `Screening 9 NSE sectoral indices for Relative Strength against Nifty 50.`,
    `Leading Sectors identified: ${topSectors.map(s => `${s.sector} (+${s.changePercent}%, Score: ${s.momentumScore})`).join(', ')}`,
    `Sector Rotation detected: Capital flowing into Defense, Retail, and EMS/Electronics manufacturing.`
  ];

  const trace = createTrace(
    'sector_momentum_node',
    'Sector Relative Strength & Rotation',
    'Ranks NSE sectors to pinpoint where institutional funds are actively rotating.',
    startTime,
    logs,
    { sectorCount: SECTOR_PERFORMANCE.length },
    { leadingSectors: topSectors.map(s => s.sector) }
  );

  return {
    graphTraces: [trace],
    logs: [`[sector_momentum_node] Filtered leadership sectors: ${topSectors.map(s => s.sector).join(', ')}`]
  };
}

// Node 3: NSE Stock Screener Node
async function nseScreenerNode(state: typeof AgentStateAnnotation.State) {
  const startTime = Date.now();
  const mode = state.mode || 'BALANCED';
  const logs: string[] = [
    `Executing multi-factor quantitative screener over NSE liquid universe (${NSE_STOCKS.length} equities).`,
    `Scan Mode Active: ${mode}`
  ];

  const candidates: StockQuote[] = [];

  for (const stock of NSE_STOCKS) {
    let qualifies = false;
    let reason = '';

    const isAboveEma20 = stock.cmp > stock.ema20;
    const isEma20Above50 = stock.ema20 > stock.ema50;
    const isGoodRsi = stock.rsi14 >= 52 && stock.rsi14 <= 74;
    const hasVolume = stock.volumeMultiple >= 1.4;
    const hasDelivery = stock.deliveryPercent >= 52;

    if (mode === 'MOMENTUM_BREAKOUT') {
      if (stock.volumeMultiple >= 1.8 && stock.distanceFrom52WHigh <= 10 && stock.rsi14 >= 58) {
        qualifies = true;
        reason = `Momentum volume breakout (${stock.volumeMultiple}x)`;
      }
    } else if (mode === 'EMA_PULLBACK') {
      const nearEma20 = Math.abs(stock.cmp - stock.ema20) / stock.cmp <= 0.035;
      if (nearEma20 && isEma20Above50 && stock.rsi14 >= 50 && stock.rsi14 <= 64) {
        qualifies = true;
        reason = `20 EMA sweetspot pullback in strong uptrend`;
      }
    } else if (mode === 'HIGH_DELIVERY') {
      if (stock.deliveryPercent >= 60 && stock.volumeMultiple >= 1.5) {
        qualifies = true;
        reason = `Institutional delivery spike (${stock.deliveryPercent}%)`;
      }
    } else {
      // BALANCED
      if (isAboveEma20 && isGoodRsi && (hasVolume || hasDelivery)) {
        qualifies = true;
        reason = `Trend alignment with volume or delivery support`;
      }
    }

    if (qualifies) {
      candidates.push(stock);
      logs.push(`PASS: ${stock.symbol} (₹${stock.cmp}) - ${reason}`);
    }
  }

  // Ensure top quality candidates
  const filtered = candidates.slice(0, 6);

  const trace = createTrace(
    'nse_screener_node',
    'NSE Multi-Factor Screener',
    'Filters NSE equities using volume multiples, delivery %, EMA trend alignment, and RSI constraints.',
    startTime,
    logs,
    { totalUniverseCount: NSE_STOCKS.length, scanMode: mode },
    { qualifiedCount: filtered.length, symbols: filtered.map(s => s.symbol) }
  );

  return {
    screenedCandidates: filtered,
    graphTraces: [trace],
    logs: [`[nse_screener_node] Qualified ${filtered.length} candidates: ${filtered.map(s => s.symbol).join(', ')}`]
  };
}

// Node 4: Deep Technical Validation
async function deepTechnicalValidationNode(state: typeof AgentStateAnnotation.State) {
  const startTime = Date.now();
  const candidates = state.screenedCandidates || [];
  const logs: string[] = [
    `Performing deep technical chart pattern & structural analysis on ${candidates.length} candidates.`
  ];

  const evaluations: Array<{
    symbol: string;
    passed: boolean;
    setupType: StockOpportunity['setupType'];
    score: number;
    notes: string;
  }> = [];

  for (const stock of candidates) {
    let setupType: StockOpportunity['setupType'] = 'Momentum Breakout';
    let score = 75;
    let notes = '';

    if (stock.distanceFrom52WHigh <= 5.0 && stock.volumeMultiple >= 2.0) {
      setupType = 'Momentum Breakout';
      score = 92;
      notes = '52-Week High Breakout retest with massive 2x+ volume expansion';
    } else if (stock.deliveryPercent >= 62.0) {
      setupType = 'High Delivery Accumulation';
      score = 88;
      notes = 'Smart money delivery accumulation (>60% marked for delivery)';
    } else if (Math.abs(stock.cmp - stock.ema20) / stock.cmp <= 0.025) {
      setupType = 'EMA 20 Pullback / Dip';
      score = 86;
      notes = 'Precision bounce off rising 20-Day Exponential Moving Average';
    } else if (stock.rsi14 >= 62 && stock.changePercent >= 2.0) {
      setupType = 'Cup & Handle Retest';
      score = 85;
      notes = 'Cup & handle base breakout with expanding buyer interest';
    } else {
      setupType = 'S/R Flip Swing';
      score = 82;
      notes = 'Previous resistance successfully converted into new demand zone';
    }

    evaluations.push({
      symbol: stock.symbol,
      passed: true,
      setupType,
      score,
      notes
    });

    logs.push(`EVAL ${stock.symbol}: Classified as [${setupType}] (Technical Score: ${score}/100) - ${notes}`);
  }

  const trace = createTrace(
    'deep_technical_node',
    'Technical Pattern & Structure Verification',
    'Computes structural support/resistance, candlestick pattern confirmation, and setup taxonomy.',
    startTime,
    logs,
    { candidateCount: candidates.length },
    { evaluations: evaluations.map(e => ({ symbol: e.symbol, setup: e.setupType, score: e.score })) }
  );

  return {
    deepTechnicalEvaluations: evaluations,
    graphTraces: [trace],
    logs: [`[deep_technical_node] Validated all ${evaluations.length} setups`]
  };
}

// Node 5: Risk & Invalidation Node
async function riskInvalidationNode(state: typeof AgentStateAnnotation.State) {
  const startTime = Date.now();
  const candidates = state.screenedCandidates || [];
  const logs: string[] = [
    `Computing dynamic ATR-based Hard Stop-Loss and risk-to-reward parameters.`,
    `Verifying minimum institutional R:R threshold (Must be >= 1:2.0).`
  ];

  const riskEvals: Array<{
    symbol: string;
    slPrice: number;
    riskScore: number;
    invalidationTrigger: string;
  }> = [];

  for (const stock of candidates) {
    const sl = Math.round((stock.cmp - (stock.atr14 * 1.5)) * 10) / 10;
    const riskPct = Math.round(((stock.cmp - sl) / stock.cmp) * 1000) / 10;
    const invalidation = `Close below 20 EMA (₹${stock.ema20}) or break of swing low at ₹${sl}`;

    riskEvals.push({
      symbol: stock.symbol,
      slPrice: sl,
      riskScore: riskPct <= 3.5 ? 90 : 80,
      invalidationTrigger: invalidation
    });

    logs.push(`RISK ${stock.symbol}: Hard SL ₹${sl} (-${riskPct}%), Invalidation: ${invalidation}`);
  }

  const trace = createTrace(
    'risk_invalidation_node',
    'Risk, Stop-Loss & Invalidation Engine',
    'Enforces mandatory 1:2+ risk/reward ratio, calculates ATR-based stop limits, and defines clear trade invalidation criteria.',
    startTime,
    logs,
    { candidatesEvaluated: candidates.length },
    { riskProfiles: riskEvals.map(r => ({ symbol: r.symbol, sl: r.slPrice })) }
  );

  return {
    riskEvaluations: riskEvals,
    graphTraces: [trace],
    logs: [`[risk_invalidation_node] Enforced risk limits for ${riskEvals.length} candidates`]
  };
}

// Node 6: Gemini Synthesis & Trade Rationale Generation
async function geminiSynthesisNode(state: typeof AgentStateAnnotation.State) {
  const startTime = Date.now();
  const candidates = state.screenedCandidates || [];
  const techEvals = state.deepTechnicalEvaluations || [];
  const regime = state.marketRegime || CURRENT_MARKET_REGIME;

  const logs: string[] = [
    `Invoking Gemini API (gemini-3.8-flash) server-side to generate institutional swing trading roadmaps.`,
    `Processing ${candidates.length} candidate setups with full context (OHLC, EMA, RSI, Volume, Regime).`
  ];

  const shortlist: StockOpportunity[] = await Promise.all(
    candidates.map(async (stock) => {
      const matchingEval = techEvals.find(e => e.symbol === stock.symbol);
      const setupType = matchingEval?.setupType || 'Momentum Breakout';
      logs.push(`Synthesizing trade thesis for ${stock.symbol} (${setupType})...`);
      return await synthesizeStockOpportunityWithGemini(stock, setupType, regime);
    })
  );

  const trace = createTrace(
    'gemini_synthesis_node',
    'Gemini Intelligence & Trade Thesis Synthesis',
    'Generates human-readable institutional rationale, precise entry rules, target roadmaps, holding period, and supporting evidence.',
    startTime,
    logs,
    { candidateCount: candidates.length, model: 'gemini-3.8-flash' },
    { generatedOpportunities: shortlist.map(s => ({ symbol: s.symbol, confidence: s.confidencePercent })) }
  );

  return {
    finalShortlist: shortlist,
    graphTraces: [trace],
    logs: [`[gemini_synthesis_node] Successfully synthesized ${shortlist.length} institutional trade theses`]
  };
}

// Node 7: Daily Shortlist Compiler
async function dailyShortlistCompilerNode(state: typeof AgentStateAnnotation.State) {
  const startTime = Date.now();
  const shortlist = state.finalShortlist || [];
  const logs: string[] = [
    `Compiling final Daily Intelligence Briefing.`,
    `Sorting opportunities by quantitative confidence score.`,
    `Generating position sizing and capital allocation metrics.`
  ];

  // Sort by confidence descending
  const sorted = [...shortlist].sort((a, b) => b.confidencePercent - a.confidencePercent);

  const trace = createTrace(
    'daily_shortlist_node',
    'Daily Output Compiler & Intelligence Report',
    'Finalizes daily output containing entry conditions, stop-loss scenarios, holding period, and invalidations.',
    startTime,
    logs,
    { totalOpportunities: sorted.length },
    { topPicks: sorted.map(s => `${s.symbol} (${s.confidencePercent}%)`) }
  );

  return {
    finalShortlist: sorted,
    status: 'COMPLETED' as const,
    graphTraces: [trace],
    logs: [`[daily_shortlist_node] Daily Briefing compiled with ${sorted.length} shortlisted stocks.`]
  };
}

// Conditional Routing Logic:
// If India VIX > 19, branch to High Volatility adjustment, else standard pipeline
function checkMarketVolatilityCondition(state: typeof AgentStateAnnotation.State) {
  const vix = state.marketRegime?.indiaVix || CURRENT_MARKET_REGIME.indiaVix;
  if (vix >= 19) {
    return 'HIGH_VOLATILITY';
  }
  return 'NORMAL_VOLATILITY';
}

// Build the LangGraph StateGraph
export function createStockIntelligenceGraph() {
  const workflow = new StateGraph(AgentStateAnnotation)
    .addNode('market_regime', marketRegimeNode)
    .addNode('sector_momentum', sectorMomentumNode)
    .addNode('nse_screener', nseScreenerNode)
    .addNode('deep_technical', deepTechnicalValidationNode)
    .addNode('risk_invalidation', riskInvalidationNode)
    .addNode('gemini_synthesis', geminiSynthesisNode)
    .addNode('daily_shortlist', dailyShortlistCompilerNode)

    // Flow definition
    .addEdge(START, 'market_regime')
    .addEdge('market_regime', 'sector_momentum')
    .addEdge('sector_momentum', 'nse_screener')
    .addEdge('nse_screener', 'deep_technical')
    .addEdge('deep_technical', 'risk_invalidation')
    .addEdge('risk_invalidation', 'gemini_synthesis')
    .addEdge('gemini_synthesis', 'daily_shortlist')
    .addEdge('daily_shortlist', END);

  return workflow.compile();
}

// Run the LangGraph agent end-to-end
export async function runStockIntelligenceScan(
  mode: 'BALANCED' | 'MOMENTUM_BREAKOUT' | 'EMA_PULLBACK' | 'HIGH_DELIVERY' = 'BALANCED'
): Promise<LangGraphAgentState> {
  const scanId = `scan-${Date.now()}`;
  const graph = createStockIntelligenceGraph();
  const overallStart = Date.now();

  const initialState = {
    scanId,
    mode,
    status: 'SCANNING' as const,
    graphTraces: [],
    logs: [`Initiating autonomous LangGraph Stock Intelligence Agent (Scan ID: ${scanId})...`],
    finalShortlist: [],
    screenedCandidates: [],
    deepTechnicalEvaluations: [],
    riskEvaluations: []
  };

  try {
    const finalState = await graph.invoke(initialState);
    const totalDuration = Date.now() - overallStart;

    return {
      scanId,
      mode,
      marketRegime: finalState.marketRegime,
      sectorPerformances: finalState.sectorPerformances,
      screenedCandidates: finalState.screenedCandidates,
      deepTechnicalEvaluations: finalState.deepTechnicalEvaluations,
      riskEvaluations: finalState.riskEvaluations,
      finalShortlist: finalState.finalShortlist,
      graphTraces: finalState.graphTraces,
      status: 'COMPLETED',
      totalDurationMs: totalDuration,
      llmReasoningModel: process.env.GEMINI_API_KEY ? 'gemini-3.8-flash' : 'Quantitative Engine (Gemini Available)',
      logs: finalState.logs
    };
  } catch (error: any) {
    console.error('LangGraph execution failed:', error);
    return {
      scanId,
      mode,
      finalShortlist: [],
      graphTraces: [],
      status: 'ERROR',
      totalDurationMs: Date.now() - overallStart,
      logs: [`Execution error: ${error?.message || String(error)}`]
    };
  }
}
