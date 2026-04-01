import React, { useState, useRef, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RoleGuard from '../components/RoleGuard';
import { Send, Bot, User, Sparkles, RefreshCw, Brain, Target, TrendingUp, BookOpen, DollarSign, Users, BarChart3, ChevronRight, Zap } from 'lucide-react';
import { API_BASE_URL } from '../config/env';
import { AgentType } from '../services/multiAgentCareerCoachingSystem';

interface CareerCoachPageProps {
  onNavigate?: (page: string, data?: any) => void;
  user?: { name: string; type: 'candidate' | 'employer' | 'admin' } | null;
  onLogout?: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  agentType?: AgentType;
}

const AGENTS = [
  { id: 'career-planner', icon: Target, label: 'Career Planner', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  { id: 'skill-advisor', icon: Brain, label: 'Skill Advisor', color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
  { id: 'interview-coach', icon: Users, label: 'Interview Coach', color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  { id: 'resume-expert', icon: BookOpen, label: 'Resume Expert', color: 'from-orange-500 to-amber-600', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  { id: 'salary-negotiator', icon: DollarSign, label: 'Salary Coach', color: 'from-teal-500 to-cyan-600', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
  { id: 'industry-analyst', icon: BarChart3, label: 'Industry Analyst', color: 'from-indigo-500 to-blue-700', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
];

const QUICK_PROMPTS = [
  { text: 'Plan my career path', agent: 'career-planner' as AgentType },
  { text: 'Improve my resume', agent: 'resume-expert' as AgentType },
  { text: 'Prepare for interviews', agent: 'interview-coach' as AgentType },
  { text: 'Identify skill gaps', agent: 'skill-advisor' as AgentType },
  { text: 'Negotiate my salary', agent: 'salary-negotiator' as AgentType },
  { text: 'Analyze my industry', agent: 'industry-analyst' as AgentType },
];

const SYSTEM_PROMPT = `You are ZyncJobs AI Career Coach — a friendly, expert career advisor helping job seekers in India and globally. You give concise, actionable advice on career path planning, resume writing, interview preparation, skill gap analysis, salary negotiation, and job search strategies. Keep responses clear, practical, and encouraging. Use bullet points for lists. Max 3-4 short paragraphs per response.`;

function renderContent(text: string) {
  return text.split('\n').map((line, i) => {
    const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    if (line.startsWith('• ') || line.startsWith('- ')) {
      return <li key={i} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: bold.replace(/^[•\-]\s/, '') }} />;
    }
    if (bold.trim() === '') return <br key={i} />;
    return <p key={i} dangerouslySetInnerHTML={{ __html: bold }} />;
  });
}

const CareerCoachPage: React.FC<CareerCoachPageProps> = ({ onNavigate, user, onLogout }) => {
  const firstName = user?.name?.split(' ')[0] || '';
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `Hi${firstName ? ` ${firstName}` : ''}! 👋 I'm your AI Career Coach. I can help you with career planning, resume tips, interview prep, skill gaps, salary negotiation, and more.\n\nWhat would you like to work on today?`,
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg: Message = { role: 'user', content: trimmed };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(`${API_BASE_URL}/ai-suggestions/career-coach`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.map(m => ({ role: m.role, content: m.content })),
          systemPrompt: SYSTEM_PROMPT,
        }),
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        const reply = data.reply || data.message || data.content || '';
        setMessages(prev => [...prev, { role: 'assistant', content: reply || getFallback(trimmed) }]);
      } else throw new Error();
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: getFallback(trimmed) }]);
    } finally {
      setLoading(false);
    }
  };

  const getFallback = (q: string): string => {
    const t = q.toLowerCase();
    if (t.includes('resume') || t.includes('cv'))
      return `Here are key resume tips:\n\n• **Use ATS keywords** from the job description — match exact phrases\n• **Quantify achievements** — "Increased sales by 30%" beats "Improved sales"\n• **Keep it 1 page** for under 5 years experience, 2 pages max otherwise\n• **Use action verbs** — Built, Led, Designed, Optimized, Delivered\n• **Tailor each resume** to the specific job role\n\nWant me to review specific sections of your resume?`;
    if (t.includes('interview'))
      return `Interview preparation tips:\n\n• **Research the company** — products, culture, recent news\n• **Use STAR method** for behavioral questions (Situation, Task, Action, Result)\n• **Prepare 3-5 stories** from your experience that show impact\n• **Practice out loud** — record yourself or use a mirror\n• **Prepare questions to ask** — shows genuine interest\n\nWant mock interview questions for a specific role?`;
    if (t.includes('skill') || t.includes('learn'))
      return `Skill gap analysis approach:\n\n• **Find 5-10 job descriptions** for your target role and list required skills\n• **Compare with your current skills** — identify gaps\n• **Prioritize** — focus on skills mentioned in 70%+ of job postings\n• **Free resources** — freeCodeCamp, Coursera, YouTube, official docs\n• **Build projects** — practical experience beats certificates alone\n\nWhat role are you targeting? I can give specific skill recommendations.`;
    if (t.includes('salary') || t.includes('negotiate'))
      return `Salary negotiation tips:\n\n• **Research market rates** — Glassdoor, LinkedIn Salary, AmbitionBox (India)\n• **Never give a number first** — ask "What's the budgeted range for this role?"\n• **Anchor high** — start 15-20% above your target\n• **Negotiate the full package** — base, bonus, equity, WFH, learning budget\n• **Get it in writing** before resigning from current job\n\nWhat's your current situation — fresher, experienced, or switching fields?`;
    if (t.includes('career') || t.includes('path') || t.includes('plan'))
      return `Career path planning steps:\n\n• **Define your 3-year goal** — what role/title do you want?\n• **Work backwards** — what skills/experience does that role need?\n• **Set 90-day milestones** — small, measurable steps\n• **Build in public** — GitHub, LinkedIn posts, side projects\n• **Find a mentor** in your target field\n\nWhat's your current role and where do you want to be in 3 years?`;
    return `Great question! Here's my advice:\n\n• Be specific about your goal — clarity leads to better results\n• Break it into small actionable steps\n• Track your progress weekly\n• Don't hesitate to ask for help or mentorship\n\nCould you share more details about your situation? I can give more targeted advice!`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const resetChat = () => {
    setMessages([{ role: 'assistant', content: `Hi${firstName ? ` ${firstName}` : ''}! 👋 I'm your AI Career Coach. What would you like to work on today?` }]);
    setActiveAgent(null);
  };

  const activeAgentConfig = AGENTS.find(a => a.id === activeAgent);

  return (
    <RoleGuard
      userRole={user?.type || 'candidate'}
      requiredFeature="career-coach"
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
            <p className="text-gray-500 mb-6">Career coaching is only available to job seekers.</p>
            <button onClick={() => onNavigate?.('home')} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium">
              Go Home
            </button>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex flex-col">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

        <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 flex flex-col gap-4">

          {/* Hero Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-6 shadow-xl">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
            </div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">AI Career Coach</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-blue-100 text-sm font-medium">Online · Powered by ZyncJobs AI</span>
                  </div>
                </div>
              </div>
              <button
                onClick={resetChat}
                className="flex items-center gap-2 text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-xl transition-all duration-200 backdrop-blur-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                New Chat
              </button>
            </div>
          </div>

          {/* Agent Selector */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {AGENTS.map(agent => {
              const Icon = agent.icon;
              const isActive = activeAgent === agent.id;
              return (
                <button
                  key={agent.id}
                  onClick={() => setActiveAgent(isActive ? null : agent.id)}
                  className={`group flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                    isActive
                      ? `${agent.bg} ${agent.border} shadow-md scale-105`
                      : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm hover:scale-102'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className={`text-xs font-medium leading-tight text-center ${isActive ? agent.text : 'text-gray-600'}`}>
                    {agent.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Chat Container */}
          <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden" style={{ minHeight: 0, height: 'calc(100vh - 420px)', maxHeight: '520px' }}>
            {/* Active agent banner */}
            {activeAgentConfig && (
              <div className={`flex items-center gap-2 px-4 py-2.5 ${activeAgentConfig.bg} border-b ${activeAgentConfig.border}`}>
                <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${activeAgentConfig.color} flex items-center justify-center`}>
                  <activeAgentConfig.icon className="w-3 h-3 text-white" />
                </div>
                <span className={`text-xs font-semibold ${activeAgentConfig.text}`}>Chatting with {activeAgentConfig.label}</span>
                <button onClick={() => setActiveAgent(null)} className={`ml-auto text-xs ${activeAgentConfig.text} opacity-60 hover:opacity-100`}>✕</button>
              </div>
            )}

            {/* Messages */}
            <div ref={chatRef} className="flex-1 overflow-y-auto p-5 space-y-5">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}>
                  <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm ${
                    msg.role === 'assistant'
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                      : 'bg-gradient-to-br from-gray-600 to-gray-700'
                  }`}>
                    {msg.role === 'assistant'
                      ? <Bot className="w-4.5 h-4.5 text-white" />
                      : <User className="w-4.5 h-4.5 text-white" />
                    }
                  </div>
                  <div className={`max-w-[76%] px-4 py-3 rounded-2xl text-sm leading-relaxed space-y-1 ${
                    msg.role === 'assistant'
                      ? 'bg-gray-50 text-gray-800 rounded-tl-sm border border-gray-100 shadow-sm'
                      : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-sm shadow-md'
                  }`}>
                    {renderContent(msg.content)}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm">
                    <div className="flex gap-1.5 items-center">
                      {[0, 150, 300].map(delay => (
                        <span key={delay} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            {messages.length <= 1 && (
              <div className="px-5 pb-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {QUICK_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p.text)}
                    className="group flex items-center justify-between text-left text-xs px-3 py-2.5 bg-gradient-to-r from-gray-50 to-blue-50/50 border border-gray-200 rounded-xl hover:border-blue-300 hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 text-gray-700 font-medium shadow-sm hover:shadow"
                  >
                    <span>{p.text}</span>
                    <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-blue-500 flex-shrink-0 ml-1 transition-colors" />
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="px-4 pb-4">
              <div className="flex gap-2 items-end bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-400 focus-within:bg-white transition-all duration-200 shadow-sm">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={activeAgentConfig ? `Ask your ${activeAgentConfig.label}...` : 'Ask me anything about your career...'}
                  rows={1}
                  className="flex-1 resize-none outline-none text-sm text-gray-800 placeholder-gray-400 max-h-28 py-0.5 bg-transparent"
                  style={{ lineHeight: '1.6' }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-center text-xs text-gray-400 mt-2">Enter to send · Shift+Enter for new line</p>
            </div>
          </div>
        </div>

        <Footer onNavigate={onNavigate} />
      </div>
    </RoleGuard>
  );
};

export default CareerCoachPage;
