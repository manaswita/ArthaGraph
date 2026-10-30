import React, { useState } from 'react';
import { Code, Copy, Check } from 'lucide-react';

export const LangGraphCodeViewer: React.FC = () => {
  const [lang, setLang] = useState<'ts' | 'python'>('ts');
  const [copied, setCopied] = useState(false);

  const tsCode = `import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import { GoogleGenAI } from "@google/genai";

// 1. Define State Annotation
export const AgentStateAnnotation = Annotation.Root({
  scanId: Annotation<string>(),
  mode: Annotation<"BALANCED" | "MOMENTUM_BREAKOUT" | "EMA_PULLBACK">(),
  marketRegime: Annotation<MarketRegimeState>(),
  screenedCandidates: Annotation<StockQuote[]>({
    reducer: (_, next) => next,
    default: () => []
  }),
  deepTechnicalEvaluations: Annotation<Array<TechnicalEval>>({
    reducer: (_, next) => next,
    default: () => []
  }),
  riskEvaluations: Annotation<Array<RiskEval>>({
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
  })
});

// 2. Define Graph Nodes
async function marketRegimeNode(state) {
  // Evaluates Nifty 50, Bank Nifty, India VIX, and FII/DII Net Flows
  return { marketRegime: computedRegime, graphTraces: [trace] };
}

async function sectorMomentumNode(state) {
  // Ranks 9 NSE Sectoral Indices for Relative Strength & Capital Rotation
  return { sectorPerformances: topSectors, graphTraces: [trace] };
}

async function nseScreenerNode(state) {
  // Scans liquid NSE stocks: Volume >= 1.5x, Delivery% > 50%, 20 EMA > 50 EMA
  return { screenedCandidates: filtered, graphTraces: [trace] };
}

async function deepTechnicalNode(state) {
  // Pattern detection: 52W High Breakout, 20 EMA Bounce, Cup & Handle
  return { deepTechnicalEvaluations: evals, graphTraces: [trace] };
}

async function riskInvalidationNode(state) {
  // ATR-based Stop-Loss (1.5x ATR), enforces R:R >= 1:2.0, invalidation triggers
  return { riskEvaluations: riskProfiles, graphTraces: [trace] };
}

async function geminiSynthesisNode(state) {
  // Server-side Gemini API (gemini-3.8-flash) generates institutional thesis
  const shortlist = await Promise.all(
    state.screenedCandidates.map(stock => synthesizeWithGemini(stock, state.marketRegime))
  );
  return { finalShortlist: shortlist, graphTraces: [trace] };
}

// 3. Assemble and Compile StateGraph
export function createStockIntelligenceGraph() {
  return new StateGraph(AgentStateAnnotation)
    .addNode("market_regime", marketRegimeNode)
    .addNode("sector_momentum", sectorMomentumNode)
    .addNode("nse_screener", nseScreenerNode)
    .addNode("deep_technical", deepTechnicalNode)
    .addNode("risk_invalidation", riskInvalidationNode)
    .addNode("gemini_synthesis", geminiSynthesisNode)
    .addNode("daily_shortlist", dailyShortlistCompilerNode)

    // Directed Edges
    .addEdge(START, "market_regime")
    .addEdge("market_regime", "sector_momentum")
    .addEdge("sector_momentum", "nse_screener")
    .addEdge("nse_screener", "deep_technical")
    .addEdge("deep_technical", "risk_invalidation")
    .addEdge("risk_invalidation", "gemini_synthesis")
    .addEdge("gemini_synthesis", "daily_shortlist")
    .addEdge("daily_shortlist", END)
    .compile();
}`;

  const pythonCode = `from typing import Annotated, TypedDict, List
from langgraph.graph import StateGraph, START, END
from google import genai

class AgentState(TypedDict):
    scan_id: str
    market_regime: dict
    screened_candidates: list[dict]
    deep_technical_evaluations: list[dict]
    risk_evaluations: list[dict]
    final_shortlist: list[dict]
    graph_traces: list[dict]

def market_regime_node(state: AgentState):
    """Analyzes Nifty 50, India VIX, FII/DII net flows."""
    vix = fetch_india_vix()
    fii_net = fetch_fii_dii_cash()
    regime = classify_regime(vix, fii_net)
    return {"market_regime": regime}

def nse_screener_node(state: AgentState):
    """Quantitative filters: Volume > 1.8x, Delivery% > 55%, Above 20 EMA."""
    candidates = run_nse_multivariate_scan()
    return {"screened_candidates": candidates}

def risk_invalidation_node(state: AgentState):
    """Calculates 1.5x ATR hard stop-loss and strict invalidation triggers."""
    risk_profiles = calculate_atr_risk_limits(state["screened_candidates"])
    return {"risk_evaluations": risk_profiles}

def gemini_synthesis_node(state: AgentState):
    """Calls Gemini (gemini-3.8-flash) for institutional thesis & triggers."""
    ai = genai.Client()
    shortlist = []
    for stock in state["screened_candidates"]:
        response = ai.models.generate_content(
            model="gemini-3.8-flash",
            contents=build_prompt(stock, state["market_regime"])
        )
        shortlist.append(parse_trade_plan(response.text))
    return {"final_shortlist": shortlist}

# Build LangGraph
workflow = StateGraph(AgentState)
workflow.add_node("market_regime", market_regime_node)
workflow.add_node("nse_screener", nse_screener_node)
workflow.add_node("risk_invalidation", risk_invalidation_node)
workflow.add_node("gemini_synthesis", gemini_synthesis_node)

workflow.add_edge(START, "market_regime")
workflow.add_edge("market_regime", "nse_screener")
workflow.add_edge("nse_screener", "risk_invalidation")
workflow.add_edge("risk_invalidation", "gemini_synthesis")
workflow.add_edge("gemini_synthesis", END)

app = workflow.compile()
`;

  const copyCode = () => {
    navigator.clipboard.writeText(lang === 'ts' ? tsCode : pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-blue-100 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-blue-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              LangGraph StateGraph Implementation Architecture
            </h2>
            <p className="text-xs text-slate-500">
              Inspect the exact state machine definitions, node functions, and deterministic edge wiring.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-blue-50 p-1 border border-blue-200">
            <button
              onClick={() => setLang('ts')}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                lang === 'ts' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-blue-900'
              }`}
            >
              TypeScript (@langchain/langgraph)
            </button>
            <button
              onClick={() => setLang('python')}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                lang === 'python' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-blue-900'
              }`}
            >
              Python (langgraph)
            </button>
          </div>

          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold border border-blue-200 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-blue-600" />}
            {copied ? 'Copied' : 'Copy Code'}
          </button>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-blue-100 bg-slate-900">
        <div className="px-4 py-2 border-b border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>{lang === 'ts' ? 'src/services/langgraphAgent.ts' : 'agent_workflow.py'}</span>
          <span>StateGraph Cyclic Multi-Agent Engine</span>
        </div>
        <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed max-h-[500px]">
          {lang === 'ts' ? tsCode : pythonCode}
        </pre>
      </div>
    </div>
  );
};
