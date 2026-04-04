import React, { useState, useRef, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RoleGuard from '../components/RoleGuard';
import { Send, Mic, Search, MoreHorizontal, Zap, RefreshCw, Bot, User, TrendingUp, MessageCircle } from 'lucide-react';
import { API_BASE_URL } from '../config/env';

interface CareerCoachPageProps {
  onNavigate?: (page: string, data?: any) => void;
  user?: { name: string; type: 'candidate' | 'employer' | 'admin' } | null;
  onLogout?: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const FEATURE_CARDS = [
  { icon: '🧱', title: 'Plan your career path, get skill gap analysis, and set clear milestones — all in sync.', tag: 'Career Planning', highlight: false },
  { icon: '🤝', title: 'Stay connected, share ideas, and align goals effortlessly. Boost your productivity with AI Coach', tag: 'Collaborate with Team', highlight: true },
  { icon: '📅', title: 'Organize your time efficiently, set clear priorities, and stay focused', tag: 'Planning', highlight: false },
];

const QUICK_ACTIONS = [
  { icon: <Search className="w-3.5 h-3.5" />, label: 'Plan my career' },
  { icon: <User className="w-3.5 h-3.5" />, label: 'Improve resume' },
  { icon: <MessageCircle className="w-3.5 h-3.5" />, label: 'Interview prep' },
  { icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Salary tips' },
  { icon: <MoreHorizontal className="w-3.5 h-3.5" />, label: 'Skill gaps' },
];

const SYSTEM_PROMPT = `You are ZyncJobs AI Career Coach — a friendly, expert career advisor. Give concise, actionable advice on career planning, resume writing, interview prep, skill gaps, salary negotiation, and job search. Keep responses clear and encouraging. Use bullet points. Max 3-4 short paragraphs.`;

function renderContent(text: string) {
  return text.split('\n').map((line, i) => {
    const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    if (line.startsWith('• ') || line.startsWith('- '))
      return <li key={i} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: bold.replace(/^[•\-]\s/, '') }} />;
    if (bold.trim() === '') return <br key={i} />;
    return <p key={i} dangerouslySetInnerHTML={{ __html: bold }} />;
  });
}

const CareerCoachPage: React.FC<CareerCoachPageProps> = ({ onNavigate, user, onLogout }) => {
  const firstName = user?.name?.split(' ')[0] || 'there';
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  const resetChat = () => { setMessages([]); setChatStarted(false); setInput(''); };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    if (!chatStarted) setChatStarted(true);
    const userMsg: Message = { role: 'user', content: trimmed };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ai-suggestions/career-coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated.map(m => ({ role: m.role, content: m.content })), systemPrompt: SYSTEM_PROMPT }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.message || data.content || getFallback(trimmed) }]);
      } else throw new Error();
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: getFallback(trimmed) }]);
    } finally { setLoading(false); }
  };

  const getFallback = (q: string): string => {
    const t = q.toLowerCase();
    if (t.includes('resume') || t.includes('cv'))
      return `Here are key resume tips:\n\n• **Use ATS keywords** from the job description\n• **Quantify achievements** — "Increased sales by 30%"\n• **Keep it 1 page** for under 5 years experience\n• **Use action verbs** — Built, Led, Designed, Optimized\n\nWant me to review specific sections?`;
    if (t.includes('interview'))
      return `Interview preparation tips:\n\n• **Research the company** — products, culture, recent news\n• **Use STAR method** for behavioral questions\n• **Prepare 3-5 stories** from your experience\n• **Practice out loud** — record yourself\n\nWant mock interview questions for a specific role?`;
    if (t.includes('skill'))
      return `Skill gap analysis:\n\n• **Find 5-10 job descriptions** for your target role\n• **Compare with your current skills** — identify gaps\n• **Prioritize** — focus on skills in 70%+ of postings\n• **Free resources** — Coursera, YouTube, official docs\n\nWhat role are you targeting?`;
    return `Great question! Here's my advice:\n\n• Be specific about your goal\n• Break it into small actionable steps\n• Track your progress weekly\n\nCould you share more details? I can give more targeted advice!`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <RoleGuard
      userRole={user?.type || 'candidate'}
      requiredFeature="career-coach"
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
            <Zap className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
            <p className="text-gray-500 mb-6">Career coaching is only available to job seekers.</p>
            <button onClick={() => onNavigate?.('home')} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 font-medium">Go Home</button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0fdf4 100%)' }}>
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

        <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-6 py-8" style={{ minHeight: 0 }}>

          {/* Home screen */}
          {!chatStarted && (
            <>
              <div className="flex items-start justify-between mb-10">
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 leading-tight mb-1">Hi {firstName}, Ready to</h1>
                  <h1 className="text-4xl font-bold text-gray-800 leading-tight">Achieve Great Things?</h1>
                </div>
                <div className="relative flex-shrink-0 mr-8">
                  <div className="relative">
                    <div className="w-28 h-28 bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex gap-3">
                          <div className="w-4 h-4 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50" />
                          <div className="w-4 h-4 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50" />
                        </div>
                        <div className="w-8 h-2 bg-cyan-400/60 rounded-full mt-1" />
                      </div>
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-4 bg-gray-600 rounded-full">
                        <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full -mt-1 -ml-0.5 shadow-lg shadow-cyan-400/50" />
                      </div>
                    </div>
                    <div className="absolute -left-4 top-8 w-4 h-10 bg-gray-700 rounded-full" />
                    <div className="absolute -right-4 top-8 w-4 h-10 bg-gray-700 rounded-full" />
                    <div className="absolute -top-2 -right-28 bg-white rounded-2xl px-3 py-2 shadow-lg border border-gray-100 text-xs font-medium text-gray-700 whitespace-nowrap">
                      Hey there! 👋<br />Need a boost?
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-10">
                {FEATURE_CARDS.map((card, i) => (
                  <div key={i}
                    className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 ${card.highlight ? 'ring-2 ring-violet-200' : ''} hover:shadow-md transition-shadow cursor-pointer`}
                    onClick={() => sendMessage(card.tag)}>
                    <div className="text-3xl mb-4">{card.icon}</div>
                    <p className="text-gray-700 text-sm leading-relaxed mb-4 font-medium">{card.title}</p>
                    <span className="text-xs text-gray-400 font-medium">{card.tag}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Chat screen */}
          {chatStarted && (
            <div className="flex-1 flex flex-col mb-4" style={{ minHeight: 0 }}>
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <h2 className="text-sm font-semibold text-gray-500">Career Coach</h2>
                <button
                  onClick={resetChat}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:shadow-sm transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                  New Chat
                </button>
              </div>
              <div ref={chatRef} className="flex-1 overflow-y-auto space-y-4 px-2" style={{ minHeight: 0 }}>
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${msg.role === 'assistant' ? 'bg-gradient-to-br from-violet-500 to-indigo-600' : 'bg-gray-700'}`}>
                      {msg.role === 'assistant' ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
                    </div>
                    <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed space-y-1 ${msg.role === 'assistant' ? 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm' : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm shadow-md'}`}>
                      {renderContent(msg.content)}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                      <div className="flex gap-1.5">
                        {[0, 150, 300].map(d => <span key={d} className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Input — always visible */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex-shrink-0">
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-50">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Zap className="w-3.5 h-3.5 text-violet-400" />
                Unlock more with Pro Plan
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <Bot className="w-2 h-2 text-white" />
                </div>
                Powered by Assistant v2.6
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3">
              <span className="text-gray-300 text-lg font-light">+</span>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Example : "Explain quantum computing in simple terms"'
                rows={1}
                className="flex-1 resize-none outline-none text-sm text-gray-700 placeholder-gray-300 bg-transparent"
                style={{ lineHeight: '1.6' }}
              />
              <Mic className="w-4 h-4 text-gray-300 flex-shrink-0 cursor-pointer hover:text-gray-500" />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <div className="flex items-center gap-2 px-5 pb-4 flex-wrap">
              {QUICK_ACTIONS.map((action, i) => (
                <button key={i} onClick={() => sendMessage(action.label)}
                  className="flex items-center gap-1.5 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-full hover:bg-gray-700 transition-colors font-medium">
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        <Footer onNavigate={onNavigate} />
      </div>
    </RoleGuard>
  );
};

export default CareerCoachPage;
