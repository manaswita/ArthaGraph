import React, { useState, useRef, useEffect } from 'react';
import { StockOpportunity, MarketRegimeState } from '../types/stock';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  TrendingUp, 
  HelpCircle,
  RefreshCw
} from 'lucide-react';

interface AgentChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  shortlist: StockOpportunity[];
  regime: MarketRegimeState | null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

const SUGGESTED_QUESTIONS = [
  "What is the difference between Balanced and Volume Breakouts?",
  "How does 20 EMA Dip buying work?",
  "Why is High Delivery % so important in Indian stocks?",
  "Should I buy BEL if it opens with a 2% gap-up tomorrow?",
  "How should I trail my stop-loss once Target 1 is hit?"
];

export const AgentChatDrawer: React.FC<AgentChatDrawerProps> = ({
  isOpen,
  onClose,
  shortlist,
  regime
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hello! I am **Indian Stock Market Intelligence AI**, your trading assistant. 

I have full visibility into today's **${shortlist.length} shortlisted NSE stocks**, their calculated entry zones, targets, stop-losses, and our 4 scan setups (**Balanced, Volume Breakouts, 20 EMA Dips, High Delivery**).

Ask me any questions about setups, entry triggers, stop-loss trailing, or specific stocks!`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          context: {
            shortlist,
            regime: regime || undefined
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const modelMsg: ChatMessage = {
          id: `model-${Date.now()}`,
          role: 'model',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, modelMsg]);
      } else {
        throw new Error('Failed to fetch response');
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: 'Sorry, I encountered an issue processing your query. In general, remember to never chase gap-ups > 1.8% and always honor the hard stop-loss!',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-white border-l border-blue-200 shadow-2xl flex flex-col h-full animate-slide-left">
        {/* Header */}
        <div className="px-5 py-4 border-b border-blue-100 bg-blue-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Market Intelligence AI Follow-up
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-mono font-medium">
                  Gemini 3.8
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Ask about setups, entry triggers, stop-loss rules & stocks
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

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 space-y-1.5 shadow-2xs ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white border border-blue-100 text-slate-800 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">
                    {m.text}
                  </div>
                  <div className={`text-[10px] text-right font-mono ${
                    isUser ? 'text-blue-100' : 'text-slate-400'
                  }`}>
                    {m.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-blue-800 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 text-xs justify-start">
              <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white border border-blue-100 rounded-2xl rounded-tl-none p-3.5 text-slate-500 text-xs flex items-center gap-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                AI is analyzing market thesis...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Questions */}
        <div className="px-4 py-2 border-t border-blue-100 bg-white">
          <div className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 flex items-center gap-1 font-mono">
            <HelpCircle className="w-3 h-3 text-blue-600" /> Suggested Questions:
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={loading}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 whitespace-nowrap transition-colors cursor-pointer shrink-0 font-medium"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-blue-100 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask a follow-up question (e.g. entry zone for BEL)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 bg-slate-50 border border-blue-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-[10px] text-slate-400 text-center mt-2">
            AI responses grounded in current NSE market data & LangGraph analysis.
          </div>
        </div>
      </div>
    </div>
  );
};
