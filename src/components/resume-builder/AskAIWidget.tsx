import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader2, Sparkles, X, Zap } from 'lucide-react';
import { executeAI } from '../../services/aiChatService';

const QUICK_ACTIONS = [
  'Make it one page',
  'More professional tone',
  'Add metrics to bullets',
  'Highlight leadership',
  'Rewrite for Google style',
  'Shorten everything',
];

export default function AskAIWidget({ onClose, resumeContext }: { onClose: () => void; resumeContext?: string }) {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: 'assistant', content: 'Hi! Ask me anything about your resume — I can rewrite, improve, or suggest changes.' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || sending) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setSending(true);
    try {
      const ctx = resumeContext || 'resume builder user';
      const data = await executeAI(`resume edit: ${text}`, { systemPrompt: `You are a resume expert assistant. The user is editing their resume. ${ctx}`, maxTokens: 600 });
      const reply = extractChatReply(data);
      setMessages(prev => [...prev, { role: 'assistant', content: reply || 'Done! Review the changes above.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Got it! Try a different request.' }]);
    } finally { setSending(false); }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-bold">Ask AI</span>
            </div>
            <button onClick={() => setOpen(false)} className="p-0.5 hover:bg-white/20 rounded"><X className="w-4 h-4" /></button>
          </div>
          <div className="h-64 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : ''}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                  m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-md' : 'bg-gray-100 text-gray-800 rounded-tl-md'
                }`}>{m.content}</div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-2 text-sm text-gray-400">
                <Loader2 className="w-3 h-3 animate-spin mt-1" /> Working...
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {QUICK_ACTIONS.map(a => (
              <button key={a} onClick={() => send(a)} disabled={sending}
                className="text-[10px] px-2 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors">
                {a}
              </button>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send(input); }}
              placeholder="Ask anything..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button onClick={() => send(input)} disabled={!input.trim() || sending}
              className="px-3 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-40">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {!open && (
        <button onClick={() => setOpen(true)}
          className="w-12 h-12 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 flex items-center justify-center">
          <MessageSquare className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

function extractChatReply(data: any): string {
  const r = data?.result;
  if (!r) return '';
  if (typeof r === 'string') return r;
  if (r.reply) return r.reply;
  if (r.result && typeof r.result === 'string') return r.result;
  return '';
}
