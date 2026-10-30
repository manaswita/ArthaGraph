import React, { useState } from 'react';
import { LangGraphNodeTrace } from '../types/stock';
import { LangGraphVisualizer } from './LangGraphVisualizer';
import { LangGraphCodeViewer } from './LangGraphCodeViewer';
import { 
  GitBranch, 
  Code, 
  Layers, 
  Cpu, 
  Server
} from 'lucide-react';

interface TechArchitectureTabProps {
  traces: LangGraphNodeTrace[];
  isScanning: boolean;
  totalDurationMs?: number;
  logs: string[];
  onTriggerScan: () => void;
}

export const TechArchitectureTab: React.FC<TechArchitectureTabProps> = ({
  traces,
  isScanning,
  totalDurationMs,
  logs,
  onTriggerScan
}) => {
  const [activeSubSection, setActiveSubSection] = useState<'pipeline' | 'code' | 'flow'>('pipeline');

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Overview Banner */}
      <div className="bg-white border border-blue-100 rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 font-mono">
                System Specification & Developer Reference
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
                Technical Architecture & Developer Guide
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mt-1.5 max-w-3xl">
                The intelligence system is built as a stateful <strong>Directed Acyclic Graph (DAG)</strong> using <strong>LangGraph</strong> and <strong>Gemini 3.8 Flash</strong>. Each step runs as a deterministic node that evaluates market conditions, mutates application state, and generates institutional trade plans.
              </p>
            </div>
          </div>
        </div>

        {/* Sub-navigation pills */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-blue-100">
          <button
            onClick={() => setActiveSubSection('pipeline')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubSection === 'pipeline'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-slate-700 hover:bg-blue-100'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            Interactive Node Topology & Latency
          </button>

          <button
            onClick={() => setActiveSubSection('code')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubSection === 'code'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-slate-700 hover:bg-blue-100'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            LangGraph Code (TypeScript & Python)
          </button>

          <button
            onClick={() => setActiveSubSection('flow')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubSection === 'flow'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-slate-700 hover:bg-blue-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Full-Stack API Design & Endpoints
          </button>
        </div>
      </div>

      {/* Sub-section 1: Interactive Node Topology */}
      {activeSubSection === 'pipeline' && (
        <div className="space-y-4 animate-fade-in">
          <LangGraphVisualizer
            traces={traces}
            isScanning={isScanning}
            totalDurationMs={totalDurationMs}
            logs={logs}
            onTriggerScan={onTriggerScan}
          />
        </div>
      )}

      {/* Sub-section 2: Code Viewer */}
      {activeSubSection === 'code' && (
        <div className="space-y-4 animate-fade-in">
          <LangGraphCodeViewer />
        </div>
      )}

      {/* Sub-section 3: Full-Stack Architecture Guide */}
      {activeSubSection === 'flow' && (
        <div className="bg-white border border-blue-100 rounded-2xl p-6 space-y-5 animate-fade-in text-xs">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-700" />
            <h3 className="text-base font-bold text-slate-900">
              Full-Stack System Architecture & API Endpoints
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
              <h4 className="font-bold text-blue-900 text-sm">Server-Side Backend (Node / Express / TypeScript)</h4>
              <p className="text-slate-600">
                Runs on <code className="text-blue-700 font-mono font-semibold">server.ts</code> with Vite middlewares mounted in dev and static HTML in production.
              </p>
              <ul className="text-slate-700 space-y-1.5 list-disc list-inside mt-2">
                <li><code className="text-blue-800 font-mono">GET /api/market-regime</code>: Returns live Nifty 50, India VIX, and FII/DII liquidity.</li>
                <li><code className="text-blue-800 font-mono">GET /api/stocks</code>: Full NSE watchlist with 20/50/200 EMAs and delivery %.</li>
                <li><code className="text-blue-800 font-mono">POST /api/run-langgraph-scan</code>: Executes compiled StateGraph end-to-end.</li>
                <li><code className="text-blue-800 font-mono">POST /api/chat</code>: Server-side Gemini 3.8 Flash endpoint for follow-up trading questions.</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
              <h4 className="font-bold text-blue-900 text-sm">Deterministic State Channels & Reducers</h4>
              <p className="text-slate-600">
                StateGraph uses immutable channel annotations to pass data between nodes:
              </p>
              <div className="p-2.5 bg-white rounded-lg border border-blue-100 font-mono text-[11px] text-blue-900 space-y-1">
                <div>• marketRegime: Channel&lt;MarketRegimeState&gt;</div>
                <div>• screenedCandidates: Channel&lt;StockQuote[]&gt;</div>
                <div>• riskEvaluations: Channel&lt;RiskProfile[]&gt;</div>
                <div>• finalShortlist: Channel&lt;StockOpportunity[]&gt;</div>
                <div>• graphTraces: Reducer&lt;LangGraphNodeTrace[]&gt;</div>
              </div>
            </div>
          </div>

          {/* Mathematical Formulations */}
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">Mathematical Formulations Used by the Agent</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700">
              <div className="p-2.5 bg-white rounded-lg border border-blue-100 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Hard Stop-Loss Rule</span>
                <code className="text-rose-600 font-mono text-xs block font-bold">SL = CMP - (1.5 × ATR₁₄)</code>
                <p className="text-[11px] text-slate-500 mt-1">Guarantees stop is placed outside standard 1-day volatility noise.</p>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-blue-100 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Target 1 Rule (Conservative)</span>
                <code className="text-emerald-700 font-mono text-xs block font-bold">T1 = CMP + (2.0 × RiskAmount)</code>
                <p className="text-[11px] text-slate-500 mt-1">Enforces minimum institutional 1:2.0 reward-to-risk.</p>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-blue-100 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Target 2 Rule (Extended)</span>
                <code className="text-purple-700 font-mono text-xs block font-bold">T2 = CMP + (3.4 × RiskAmount)</code>
                <p className="text-[11px] text-slate-500 mt-1">Measured-move swing target for runners with trailing stop.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
