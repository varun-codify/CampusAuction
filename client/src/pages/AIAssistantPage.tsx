import React, { useState } from 'react';
import { api } from '../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolData?: any;
}

export const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your **Campus Auction AI Assistant**. I can evaluate fair student market prices, explain anti-sniping and campus handover rules, or help you locate active hostel equipment.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.sendAIMessage(text);
      const assistantMsg: Message = {
        role: 'assistant',
        content: res.reply,
        toolData: res.toolData,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message || 'Failed to process request.'}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 h-[calc(100vh-120px)]">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-amber-500 text-2xl font-variation-fill">auto_awesome</span>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Campus AI Assistant
          </h1>
        </div>
        <p className="text-sm text-slate-500">
          Powered by controlled backend tools. Ask about market pricing, fair-play anti-sniping, or current campus items.
        </p>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm overflow-y-auto flex flex-col gap-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-3 max-w-2xl ${m.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                m.role === 'user' ? 'bg-primary text-white' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {m.role === 'user' ? 'You' : <span className="material-symbols-outlined text-base">smart_toy</span>}
            </div>

            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                m.role === 'user'
                  ? 'bg-primary text-white rounded-tr-none'
                  : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic self-start bg-slate-50 p-3 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            <span>Evaluating campus tools &amp; marketplace ledger...</span>
          </div>
        )}
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">Quick Prompts:</span>
        {[
          'Explain the 30-sec anti-sniping rule',
          'Estimate price for a used Hero mountain cycle',
          'Find scientific calculators ending today',
          'How does the 4-digit PIN handover work?',
        ].map((chip) => (
          <button
            key={chip}
            onClick={() => handleSend(chip)}
            className="text-xs bg-indigo-50 hover:bg-indigo-100 text-primary px-3 py-1.5 rounded-full font-semibold transition-colors border border-indigo-100"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about campus auctions, pricing, or fair-play policies..."
          className="flex-1 px-4 py-2 text-sm text-slate-900 bg-transparent focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
        >
          <span>Send</span>
          <span className="material-symbols-outlined text-sm">send</span>
        </button>
      </form>
    </div>
  );
};
