import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Minimize2, Plus, Search, FileText, Compass, Mic, Briefcase, Info } from 'lucide-react';

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

const BOT_AVATAR = '/zync-favicon-logo.svg';

const AI_BASE = import.meta.env.VITE_AI_API_URL || '/recruitment-ai';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hi there! I'm ZyncBot, your career assistant. Ask me anything about jobs, resumes, or interview tips!", sender: 'bot' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const sessionId = useRef(`chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const newChat = () => {
    setMessages([{ text: "Hi there! I'm ZyncBot, your career assistant. Ask me anything about jobs, resumes, or interview tips!", sender: 'bot' }]);
    sessionId.current = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    setInputValue('');
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const getToken = async (): Promise<string> => {
    const res = await fetch(`${AI_BASE}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'chat_user', role: 'candidate' }),
    });
    if (!res.ok) throw new Error('auth failed');
    const data = await res.json();
    return data.access_token;
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    setIsLoading(true);
    setMessages(prev => [...prev, { text: '', sender: 'bot' }]);

    try {
      const token = await getToken();
      const res = await fetch(`${AI_BASE}/ai/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          query: userMessage,
          session_id: sessionId.current,
          context: {
            systemPrompt: 'You are ZyncBot, a career assistant for ZyncJobs platform. Help users with job search, resume building, career advice, interview prep, and platform guidance. Answer naturally and conversationally.',
            history: messages.slice(-6).map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
          },
          user_role: 'candidate',
        }),
      });
      if (!res.ok) throw new Error('ai error');
      const data = await res.json();
      const r = data.result;
      const intent = data.intent || '';
      let rawReply: string;
      if (!r) {
        rawReply = "I can help you with job search, resume building, interview prep, and career advice! Could you try asking in a different way?";
      } else if (r.error) {
        rawReply = "I can help you with job search, resume building, career advice, interview prep, and using the ZyncJobs platform. Could you please rephrase your question?";
      } else if (r.reply) {
        rawReply = r.reply;
      } else if (r.advice) {
        rawReply = r.advice;
      } else if (intent === 'RESUME_BUILDER' && r.summary) {
        rawReply = `Here's a resume outline for you:\n\n**Summary:** ${r.summary}\n\n**Key Skills:** ${[...(r.skills_formatted?.technical || []), ...(r.skills_formatted?.soft || [])].slice(0, 6).join(', ')}\n\n**ATS Keywords:** ${(r.ats_keywords || []).slice(0, 5).join(', ')}\n\nHead to the Resume Builder page to build your full resume!`;
      } else if (r.career_path && Array.isArray(r.career_path)) {
        rawReply = `Career path ready! ${r.career_path.length} steps mapped out. ${r.advice || ''} Visit the Career Roadmap page for the full plan.`;
      } else if (r.questions && Array.isArray(r.questions)) {
        rawReply = `I've prepared ${r.questions.length} questions for you! Head to the Skill Assessment page to take the full test.`;
      } else if (r.missing_skills) {
        rawReply = `Skill gap analysis complete! Missing skills: ${(r.missing_skills || []).slice(0, 4).join(', ')}. Visit the Skill Gap Analysis page for details.`;
      } else if (r.roadmap) {
        rawReply = typeof r.roadmap === 'string' ? r.roadmap : 'Roadmap generated! Visit the Career Roadmap page for full details.';
      } else if (r.search_strategy) {
        rawReply = r.search_strategy;
      } else if (r.job_description) {
        rawReply = r.job_description;
      } else if (typeof r === 'string') {
        rawReply = r;
      } else {
        rawReply = 'I processed your request! For detailed results, visit the relevant page in ZyncJobs.';
      }
      const reply = rawReply.replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '').trim();
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { text: reply, sender: 'bot' };
        return updated;
      });
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { text: "Sorry, I'm having trouble connecting right now. Please try again shortly.", sender: 'bot' };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickReplies = [
    { label: 'Resume tips', icon: <FileText className="w-3 h-3" /> },
    { label: 'Interview prep', icon: <Mic className="w-3 h-3" /> },
    { label: 'How to find jobs', icon: <Search className="w-3 h-3" /> },
    { label: 'Salary tips', icon: <Briefcase className="w-3 h-3" /> },
  ];

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => { setIsOpen(true); setIsMinimized(false); }}
          className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white pl-3 pr-4 py-3 rounded-full shadow-2xl transition-all duration-200 hover:scale-105"
        >
          <img src={BOT_AVATAR} alt="ZyncBot" className="w-6 h-6 rounded-full bg-white p-0.5" />
          <span className="text-sm font-semibold">Chat with ZyncBot</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-[9999] flex flex-col rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-200"
          style={{ width: '380px', height: isMinimized ? '64px' : '560px', background: '#fff' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}>
            <div className="relative">
              <img src={BOT_AVATAR} alt="ZyncBot" className="w-9 h-9 rounded-full bg-white p-1" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight">ZyncBot</p>
              <p className="text-blue-200 text-xs">ZyncJobs Career Assistant · Online</p>
            </div>
            <button
              type="button"
              onClick={newChat}
              title="New Chat"
              className="text-blue-200 hover:text-white transition-colors p-1"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsMinimized(m => !m)}
              title={isMinimized ? 'Expand' : 'Minimize'}
              className="text-blue-200 hover:text-white transition-colors p-1"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              title="Close"
              className="text-blue-200 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ background: '#f8fafc' }}>
                {messages.map((msg, i) => (
                  <div key={i} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'bot' && (
                      <img src={BOT_AVATAR} alt="bot" className="w-6 h-6 rounded-full bg-white border border-gray-200 p-0.5 flex-shrink-0 mb-0.5" />
                    )}
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {msg.text || (isLoading && i === messages.length - 1 ? (
                        <span className="flex gap-1 items-center py-0.5">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      ) : '')}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Quick Replies */}
              {messages.length <= 1 && (
                <div className="px-4 pb-2 flex flex-wrap gap-2" style={{ background: '#f8fafc' }}>
                  {quickReplies.map(q => (
                    <button
                      key={q.label}
                      type="button"
                      onClick={() => { setInputValue(q.label); inputRef.current?.focus(); }}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-blue-200 text-blue-600 bg-white hover:bg-blue-50 transition-colors"
                    >
                      {q.icon}{q.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-3 py-3 border-t border-gray-100 flex gap-2 bg-white flex-shrink-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Footer */}
              <div className="text-center py-1.5 bg-white border-t border-gray-50">
                <p className="text-xs text-gray-400">Powered by <span className="text-blue-500 font-medium">ZyncJobs AI</span></p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatWidget;
