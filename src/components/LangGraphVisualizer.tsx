import React, { useState } from 'react';
import { LangGraphNodeTrace } from '../types/stock';
import { 
  GitBranch, 
  Play, 
  CheckCircle2, 
  Clock, 
  Terminal, 
  ChevronRight, 
  Activity, 
  Sparkles, 
  Cpu, 
  FileText, 
  ShieldCheck, 
  Filter, 
  Layers, 
  BarChart2, 
  Info
} from 'lucide-react';

interface LangGraphVisualizerProps {
  traces: LangGraphNodeTrace[];
  isScanning: boolean;
  totalDurationMs?: number;
  logs: string[];
  onTriggerScan: () => void;
}

interface NodeDefinition {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
}

const GRAPH_NODES: NodeDefinition[] = [
  {
    id: 'market_regime_node',
    label: 'Market Regime Node',
    icon: Activity,
    tag: 'Macro & VIX'
  },
  {
    id: 'sector_momentum_node',
    label: 'Sector Momentum Node',
    icon: Layers,
    tag: 'Relative Strength'
  },
  {
    id: 'nse_screener_node',
    label: 'NSE Screener Node',
    icon: Filter,
    tag: 'Volume & Delivery Filter'
  },
  {
    id: 'deep_technical_node',
    label: 'Deep Technical Node',
    icon: BarChart2,
    tag: 'Structure & Patterns'
  },
  {
    id: 'risk_invalidation_node',
    label: 'Risk & Invalidation Node',
    icon: ShieldCheck,
    tag: 'Stop-Loss & R:R'
  },
  {
    id: 'gemini_synthesis_node',
    label: 'Gemini Synthesis Node',
    icon: Sparkles,
    tag: 'gemini-3.8-flash'
  },
  {
    id: 'daily_shortlist_node',
    label: 'Daily Output Compiler',
    icon: FileText,
    tag: 'Actionable Briefing'
  }
];

export const LangGraphVisualizer: React.FC<LangGraphVisualizerProps> = ({
  traces,
  isScanning,
  totalDurationMs,
  logs,
  onTriggerScan
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('gemini_synthesis_node');

  const selectedTrace = traces.find(t => t.nodeId === selectedNodeId);

  return (
    <div className="space-y-5">
      {/* Visualizer Header */}
      <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                LangGraph State Machine Pipeline
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  StateGraph DAG
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Autonomous node-based execution loop with state mutation and Gemini synthesis.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {totalDurationMs && !isScanning && (
            <div className="text-xs font-mono text-slate-600 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Latency: <span className="text-blue-900 font-bold">{totalDurationMs} ms</span>
            </div>
          )}

          <button
            onClick={onTriggerScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Executing Graph Run...' : 'Re-run LangGraph Pipeline'}
          </button>
        </div>
      </div>

      {/* Main Graph Canvas */}
      <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-blue-100">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2 font-mono">
            <Cpu className="w-4 h-4 text-blue-600" />
            Interactive Node Topology (Click any node to inspect state payload)
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Completed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Running
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-300"></span> Pending
            </span>
          </div>
        </div>

        {/* Nodes and Edges Flow */}
        <div className="flex items-center gap-2 py-4 min-w-[900px] overflow-x-auto">
          {/* START */}
          <div className="flex flex-col items-center">
            <div className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-300 text-[11px] font-mono font-bold text-slate-700">
              __START__
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-1">Init State</span>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />

          {/* Graph Nodes */}
          {GRAPH_NODES.map((node, index) => {
            const trace = traces.find(t => t.nodeId === node.id);
            const isCompleted = !!trace && trace.status === 'COMPLETED';
            const isSelected = selectedNodeId === node.id;
            const Icon = node.icon;

            return (
              <React.Fragment key={node.id}>
                <div
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`relative flex flex-col p-3 rounded-xl border transition-all cursor-pointer select-none shrink-0 w-44 ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 shadow-md ring-2 ring-blue-200 z-10'
                      : isCompleted
                      ? 'bg-white border-blue-200 hover:border-blue-400'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                      Step {index + 1}
                    </span>
                    {isCompleted ? (
                      <span className="flex items-center text-[10px] text-emerald-700 font-mono font-semibold">
                        <CheckCircle2 className="w-3 h-3 mr-0.5 text-emerald-600" />
                        {trace.durationMs ? `${trace.durationMs}ms` : 'done'}
                      </span>
                    ) : isScanning ? (
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">idle</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <div className={`p-1.5 rounded-lg ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 leading-tight">
                      {node.label}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono truncate mt-1">
                    {node.tag}
                  </div>
                </div>

                {index < GRAPH_NODES.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                )}
              </React.Fragment>
            );
          })}

          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />

          {/* END */}
          <div className="flex flex-col items-center">
            <div className="px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-[11px] font-mono font-bold text-emerald-800">
              __END__
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-1">Shortlist</span>
          </div>
        </div>
      </div>

      {/* Node Inspector & Logs Dual Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Node Inspector Drawer */}
        <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Node State Inspector:{' '}
                <span className="text-blue-700 font-mono">
                  {selectedNodeId || 'Select a node'}
                </span>
              </h3>
            </div>
            {selectedTrace && (
              <span className="text-xs font-mono text-slate-500">
                Duration: <strong className="text-slate-800">{selectedTrace.durationMs}ms</strong>
              </span>
            )}
          </div>

          {selectedTrace ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-600 font-semibold block mb-1">Node Objective:</span>
                <p className="text-slate-800 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                  {selectedTrace.description}
                </p>
              </div>

              {selectedTrace.inputSummary && (
                <div>
                  <span className="text-slate-600 font-semibold block mb-1">State Input Summary:</span>
                  <pre className="bg-slate-900 text-cyan-300 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(selectedTrace.inputSummary, null, 2)}
                  </pre>
                </div>
              )}

              {selectedTrace.outputSummary && (
                <div>
                  <span className="text-slate-600 font-semibold block mb-1">State Mutation & Output:</span>
                  <pre className="bg-slate-900 text-emerald-300 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(selectedTrace.outputSummary, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <span className="text-slate-600 font-semibold block mb-1">Node Execution Logs:</span>
                <div className="bg-slate-900 text-slate-200 p-2.5 rounded-lg space-y-1 font-mono text-[11px]">
                  {selectedTrace.logs.map((log, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">›</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              Click any node in the graph pipeline above to inspect its live state and calculations.
            </div>
          )}
        </div>

        {/* Global Agent Execution Terminal Logs */}
        <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                LangGraph Runtime Event Stream
              </h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
              Event Stream
            </span>
          </div>

          <div className="flex-1 bg-slate-900 rounded-xl p-3.5 font-mono text-[11px] space-y-1.5 overflow-y-auto max-h-[360px]">
            {logs.length === 0 ? (
              <div className="text-slate-500 py-4 text-center">No logs generated yet. Click re-run.</div>
            ) : (
              logs.map((l, idx) => (
                <div key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-500 select-none">{String(idx + 1).padStart(2, '0')}</span>
                  <span className={
                    l.includes('PASS') ? 'text-emerald-400' :
                    l.includes('EVAL') ? 'text-cyan-300' :
                    l.includes('Synthesizing') ? 'text-purple-300' :
                    l.includes('error') ? 'text-rose-400' :
                    'text-slate-200'
                  }>
                    {l}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 font-mono">
            <span>Graph Checkpoint: In-Memory State Annotation</span>
            <span className="text-emerald-600 font-bold">Status: Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
