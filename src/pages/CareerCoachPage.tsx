import React, { useState, useRef, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RoleGuard from '../components/RoleGuard';
import { Send, Bot, User, Sparkles, RefreshCw, Brain, Target, TrendingUp, BookOpen, DollarSign, Users, BarChart3 } from 'lucide-react';
import { API_BASE_URL } from '../config/env';
import { multiAgentCareerCoachingSystem, AgentType, UserProfile } from '../services/multiAgentCareerCoachingSystem';
import { comprehensiveAnalyticsSystem } from '../services/comprehensiveAnalyticsSystem';

interface CareerCoachPageProps {
  onNavigate?: (page: string, data?: any) => void;
  user?: { name: string; type: 'candidate' | 'employer' | 'admin' } | null;
  onLogout?: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  agentType?: AgentType;
  recommendations?: any[];
  followUpActions?: any[];
}

const AGENT_CONFIGS = {
  'career-planner': { icon: Target, color: 'blue', name: 'Career Planner' },
  'skill-advisor': { icon: Brain, color: 'purple', name: 'Skill Advisor' },
  'interview-coach': { icon: Users, color: 'green', name: 'Interview Coach' },
  'resume-expert': { icon: BookOpen, color: 'orange', name: 'Resume Expert' },
  'salary-negotiator': { icon: DollarSign, color: 'emerald', name: 'Salary Coach' },
  'networking-guide': { icon: Users, color: 'pink', name: 'Networking Guide' },
  'industry-analyst': { icon: BarChart3, color: 'indigo', name: 'Industry Analyst' }
};

const QUICK_PROMPTS = [
  { text: '🎯 Plan my career path', agent: 'career-planner' as AgentType },
  { text: '📄 Improve my resume', agent: 'resume-expert' as AgentType },
  { text: '💬 Prepare for interviews', agent: 'interview-coach' as AgentType },
  { text: '📈 Identify skill gaps', agent: 'skill-advisor' as AgentType },
  { text: '💰 Negotiate salary', agent: 'salary-negotiator' as AgentType },
  { text: '🔗 Build my network', agent: 'networking-guide' as AgentType },
];

const SYSTEM_PROMPT = `You are ZyncJobs AI Career Coach — a friendly, expert career advisor helping job seekers in India and globally. You give concise, actionable advice on:
- Career path planning & goal setting
- Resume writing & ATS optimization
- Interview preparation (technical & HR)
- Skill gap analysis & learning resources
- Salary negotiation
- Job search strategies
- LinkedIn & personal branding

Keep responses clear, practical, and encouraging. Use bullet points for lists. Max 3-4 short paragraphs per response.`;

const CareerCoachPage: React.FC<CareerCoachPageProps> = ({ onNavigate, user, onLogout }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! 👋 I'm your AI Career Coach. I can help you with career planning, resume tips, interview prep, skill gaps, and more.\n\nWhat would you like to work on today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
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
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          systemPrompt: SYSTEM_PROMPT,
        }),
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const reply = data.reply || data.message || data.content || '';
        setMessages(prev => [...prev, { role: 'assistant', content: reply || getFallbackResponse(trimmed) }]);
      } else {
        throw new Error('API failed');
      }
    } catch {
      // Fallback smart responses
      const fallback = getFallbackResponse(trimmed);
      setMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackResponse = (input: string): string => {
    const q = input.toLowerCase();
    if (q.includes('resume') || q.includes('cv'))
      return `Here are key resume tips:\n\n• **Use ATS keywords** from the job description — match exact phrases\n• **Quantify achievements** — "Increased sales by 30%" beats "Improved sales"\n• **Keep it 1 page** for under 5 years experience, 2 pages max otherwise\n• **Use action verbs** — Built, Led, Designed, Optimized, Delivered\n• **Tailor each resume** to the specific job role\n\nWant me to review specific sections of your resume?`;
    if (q.includes('interview'))
      return `Interview preparation tips:\n\n• **Research the company** — products, culture, recent news\n• **Use STAR method** for behavioral questions (Situation, Task, Action, Result)\n• **Prepare 3-5 stories** from your experience that show impact\n• **Practice out loud** — record yourself or use a mirror\n• **Prepare questions to ask** — shows genuine interest\n\nCommon questions to prep: "Tell me about yourself", "Why this company?", "Your biggest challenge?"\n\nWant mock interview questions for a specific role?`;
    if (q.includes('skill') || q.includes('learn'))
      return `Skill gap analysis approach:\n\n• **Find 5-10 job descriptions** for your target role and list required skills\n• **Compare with your current skills** — identify gaps\n• **Prioritize** — focus on skills mentioned in 70%+ of job postings\n• **Free resources** — freeCodeCamp, Coursera, YouTube, official docs\n• **Build projects** — practical experience beats certificates alone\n\nWhat role are you targeting? I can give specific skill recommendations.`;
    if (q.includes('salary') || q.includes('negotiate'))
      return `Salary negotiation tips:\n\n• **Research market rates** — Glassdoor, LinkedIn Salary, AmbitionBox (India)\n• **Never give a number first** — ask "What's the budgeted range for this role?"\n• **Anchor high** — start 15-20% above your target\n• **Negotiate the full package** — base, bonus, equity, WFH, learning budget\n• **Get it in writing** before resigning from current job\n\nWhat's your current situation — fresher, experienced, or switching fields?`;
    if (q.includes('career') || q.includes('path') || q.includes('plan'))
      return `Career path planning steps:\n\n• **Define your 3-year goal** — what role/title do you want?\n• **Work backwards** — what skills/experience does that role need?\n• **Set 90-day milestones** — small, measurable steps\n• **Build in public** — GitHub, LinkedIn posts, side projects\n• **Find a mentor** in your target field\n\nWhat's your current role and where do you want to be in 3 years?`;
    return `Great question! Here's my advice:\n\n• Be specific about your goal — clarity leads to better results\n• Break it into small actionable steps\n• Track your progress weekly\n• Don't hesitate to ask for help or mentorship\n\nCould you share more details about your situation? I can give more targeted advice!`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const resetChat = () => {
    setMessages([{
      role: 'assistant',
      content: `Hi${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! 👋 I'm your AI Career Coach. What would you like to work on today?`,
    }]);
  };

  return (
    <RoleGuard
      userRole={user?.type || 'candidate'}
      requiredFeature="career-coach"
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>
            <p className="text-gray-600 mb-6">Career coaching is only available to job seekers.</p>
            <button onClick={() => onNavigate && onNavigate('home')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Go Home
            </button>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

        <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 160px)', minHeight: 0 }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">AI Career Coach</h1>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                  Online — ready to help
                </p>
              </div>
            </div>
            <button
              onClick={resetChat}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              New chat
            </button>
          </div>

          {/* Chat area */}
          <div ref={chatContainerRef} className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-y-auto p-4 space-y-4 mb-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                  msg.role === 'assistant'
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                    : 'bg-gray-200'
                }`}>
                  {msg.role === 'assistant'
                    ? <Bot className="w-4 h-4 text-white" />
                    : <User className="w-4 h-4 text-gray-600" />
                  }
                </div>
                <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'assistant'
                    ? 'bg-gray-50 text-gray-800 rounded-tl-sm border border-gray-100'
                    : 'bg-blue-600 text-white rounded-tr-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />          </div>

          {/* Quick prompts — show only at start */}
          {messages.length <= 1 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {QUICK_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(p)}
                  className="text-left text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-700 truncate"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 items-end bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm focus-within:border-blue-400 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your career..."
              rows={1}
              className="flex-1 resize-none outline-none text-sm text-gray-800 placeholder-gray-400 max-h-32 py-1"
              style={{ lineHeight: '1.5' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">Press Enter to send · Shift+Enter for new line</p>
        </div>

        <Footer onNavigate={onNavigate} />
      </div>
    </RoleGuard>
  );
};

export default CareerCoachPage;
