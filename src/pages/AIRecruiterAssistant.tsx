import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Sparkles, Briefcase, Users, FileText, Zap, Target, MessageSquare, ChevronRight, RotateCcw, ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '../config/env';
import { API_ENDPOINTS } from '../config/constants';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface AIRecruiterAssistantProps {
  onNavigate?: (page: string, data?: any) => void;
  user?: any;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SYSTEM_PROMPT = `You are ZyncJobs AI Recruiter Assistant — an expert recruitment automation assistant for employers and HR teams.

You help recruiters with:
- Analyzing candidate profiles and ranking them for job fit
- Optimizing job postings for better candidate attraction
- Generating interview questions tailored to specific roles
- Suggesting screening criteria and evaluation frameworks
- Automating repetitive recruitment tasks
- Providing hiring market insights and salary benchmarks
- Writing offer letters, rejection emails, and follow-up messages
- Creating job descriptions from scratch
- Advising on employer branding and candidate experience

Keep responses concise, professional, and actionable. Use bullet points for lists. Focus on practical recruitment advice.`;

const QUICK_ACTIONS = [
  { icon: FileText, label: 'Optimize Job Posting', desc: 'Improve your JD for better reach', prompt: 'Help me optimize my job posting to attract better candidates. What key elements should I include?', color: 'from-blue-500 to-blue-600' },
  { icon: Users, label: 'Analyze Candidate', desc: 'Evaluate & rank applicants', prompt: 'How should I evaluate and rank candidates for a software engineer role? What criteria matter most?', color: 'from-violet-500 to-violet-600' },
  { icon: MessageSquare, label: 'Interview Questions', desc: 'Generate role-specific questions', prompt: 'Generate 10 strong interview questions for a Senior React Developer position including technical and behavioral questions.', color: 'from-emerald-500 to-emerald-600' },
  { icon: Zap, label: 'Screening Criteria', desc: 'Set smart filters & red flags', prompt: 'What are the best screening criteria and red flags to watch for when hiring a full-stack developer?', color: 'from-amber-500 to-amber-600' },
  { icon: Target, label: 'Write Job Description', desc: 'Create compelling JDs instantly', prompt: 'Write a compelling job description for a Data Analyst role at a mid-size tech company with 3-5 years experience required.', color: 'from-pink-500 to-pink-600' },
  { icon: Briefcase, label: 'Rejection Email', desc: 'Professional candidate emails', prompt: 'Write a professional and empathetic rejection email template for candidates who were not selected after the interview stage.', color: 'from-rose-500 to-rose-600' },
];

const getFallback = (input: string): string => {
  const q = input.toLowerCase();
  if (q.includes('job') && (q.includes('post') || q.includes('description') || q.includes('optim')))
    return `Here's how to optimize your job posting:\n\n• **Clear job title** — Use standard titles (e.g., "Senior React Developer" not "Rockstar Coder")\n• **Compelling summary** — 2-3 sentences on role impact and team\n• **Specific requirements** — Separate "must-have" from "nice-to-have"\n• **Salary range** — Posts with salary get 30% more applications\n• **Company culture** — Mention work style, benefits, growth opportunities\n• **Clear apply process** — Tell candidates exactly what to expect\n\nWant me to write a specific job description for you?`;
  if (q.includes('interview') && q.includes('question'))
    return `Strong interview questions by category:\n\n**Technical:**\n• Describe your experience with [specific tech stack]\n• Walk me through how you'd architect [specific system]\n• How do you handle [specific technical challenge]?\n\n**Behavioral (STAR format):**\n• Tell me about a time you missed a deadline — what happened?\n• Describe a conflict with a teammate and how you resolved it\n• Give an example of a project you're most proud of\n\n**Culture fit:**\n• What does your ideal work environment look like?\n• How do you stay updated with industry trends?\n• Where do you see yourself in 3 years?\n\nWant questions tailored to a specific role?`;
  if (q.includes('screen') || q.includes('criteria') || q.includes('evaluat'))
    return `Candidate screening framework:\n\n**Must-have criteria:**\n• Core technical skills match (60% weight)\n• Years of relevant experience\n• Education/certification requirements\n\n**Good-to-have:**\n• Industry domain knowledge\n• Portfolio/GitHub/work samples\n• Communication skills in cover letter\n\n**Red flags to watch:**\n• Frequent job hopping (< 1 year per role without reason)\n• Vague answers about past responsibilities\n• No questions asked during interview\n• Inconsistencies between resume and LinkedIn\n\nWhat role are you screening for? I can give specific criteria.`;
  if (q.includes('reject') || q.includes('email') || q.includes('template'))
    return `Professional rejection email template:\n\n---\nSubject: Your Application at [Company] — Update\n\nDear [Candidate Name],\n\nThank you for taking the time to interview with us for the [Role] position. We genuinely appreciated learning about your background and experience.\n\nAfter careful consideration, we've decided to move forward with another candidate whose experience more closely aligns with our current needs.\n\nWe were impressed by [specific positive] and encourage you to apply for future openings.\n\nWarm regards,\n[Your Name]\n---\n\nWant me to customize this for a specific stage?`;
  if (q.includes('salary') || q.includes('benchmark') || q.includes('pay'))
    return `Salary benchmarking tips:\n\n• **Use multiple sources** — Glassdoor, LinkedIn Salary, AmbitionBox\n• **Factor in location** — Bangalore/Mumbai command 20-30% premium\n• **Consider total comp** — base + bonus + equity + benefits\n\n**India tech salary ranges (2024):**\n• Junior Dev (0-2 yrs): ₹4-8 LPA\n• Mid Dev (2-5 yrs): ₹8-18 LPA\n• Senior Dev (5-8 yrs): ₹18-35 LPA\n• Lead/Architect (8+ yrs): ₹35-60 LPA\n\nWhat role and location are you benchmarking for?`;
  return `I can help you with that! Here are some key recruitment best practices:\n\n• **Speed matters** — Top candidates are off the market in 10 days\n• **Clear communication** — Update candidates at every stage\n• **Structured interviews** — Use consistent questions for fair comparison\n• **Data-driven decisions** — Track time-to-hire, offer acceptance rate\n\nCould you share more details about your specific challenge?`;
};

const AIRecruiterAssistant: React.FC<AIRecruiterAssistantProps> = ({ onNavigate, user }) => {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `Hello${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! 👋 I'm your **AI Recruiter Assistant**.\n\nI can help you streamline your hiring process — from writing job descriptions to evaluating candidates and automating communications.\n\nSelect a quick action below or type your question to get started.`,
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [jobContext, setJobContext] = useState<any[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.JOBS);
        if (res.ok) {
          const all = await res.json();
          const mine = all.filter((j: any) =>
            j.postedBy?.toLowerCase() === user?.email?.toLowerCase() ||
            j.employerEmail?.toLowerCase() === user?.email?.toLowerCase()
          );
          setJobContext(mine.slice(0, 5));
        }
      } catch {}
    };
    if (user?.email) loadJobs();
  }, [user]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg: Message = { role: 'user', content: trimmed, timestamp: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);
    const jobContextStr = jobContext.length > 0
      ? `\n\nEmployer context — Active jobs: ${jobContext.map(j => j.jobTitle || j.title).join(', ')}`
      : '';
    try {
      const res = await fetch(`${API_BASE_URL}/ai-suggestions/career-coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.map(m => ({ role: m.role, content: m.content })),
          systemPrompt: SYSTEM_PROMPT + jobContextStr,
        }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const reply = data.reply || data.message || data.content || data.text || data.answer || '';
      if (!reply) throw new Error('Empty response');
      setMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: getFallback(trimmed), timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const resetChat = () => {
    setMessages([{
      role: 'assistant',
      content: `Hello${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! 👋 I'm your AI Recruiter Assistant. What would you like to work on today?`,
      timestamp: new Date(),
    }]);
  };

  const formatTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header onNavigate={onNavigate} user={user} />

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate?.('employer-dashboard')}
              className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors mr-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">AI Recruiter Assistant</h1>
              <p className="text-blue-300 text-sm mt-0.5">Powered by AI · Automate your hiring workflow</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {jobContext.length > 0 && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full border border-white/20">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs text-white/80">{jobContext.length} job{jobContext.length > 1 ? 's' : ''} in context</span>
              </div>
            )}
            <button
              onClick={resetChat}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur px-4 py-2 rounded-xl border border-white/20 text-sm text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> New Chat
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-6 flex gap-6" style={{ minHeight: 0 }}>

        {/* Left Sidebar — Quick Actions */}
        <div className="w-64 flex-shrink-0 hidden lg:block">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-6">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Actions</p>
            </div>
            <div className="p-2 space-y-1">
              {QUICK_ACTIONS.map((action, i) => {
                const Icon = action.icon;
                return (
                  <button
                    key={i}
                    onClick={() => sendMessage(action.prompt)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{action.label}</p>
                      <p className="text-xs text-gray-400 truncate">{action.desc}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0" style={{ height: 'calc(100vh - 280px)' }}>

          {/* Mobile Quick Actions */}
          {messages.length <= 1 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 lg:hidden flex-shrink-0">
              {QUICK_ACTIONS.map((action, i) => {
                const Icon = action.icon;
                return (
                  <button
                    key={i}
                    onClick={() => sendMessage(action.prompt)}
                    className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-left hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-700 truncate">{action.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Chat Messages */}
          <div ref={chatRef} className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-y-auto p-5 space-y-5 mb-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm ${
                  msg.role === 'assistant'
                    ? 'bg-gradient-to-br from-blue-500 to-violet-600'
                    : 'bg-gradient-to-br from-gray-600 to-gray-700'
                }`}>
                  {msg.role === 'assistant'
                    ? <Sparkles className="w-4 h-4 text-white" />
                    : <User className="w-4 h-4 text-white" />
                  }
                </div>

                {/* Bubble */}
                <div className={`max-w-[75%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                    msg.role === 'assistant'
                      ? 'bg-gray-50 text-gray-800 rounded-tl-sm border border-gray-100'
                      : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-xs text-gray-400 px-1">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                  <div className="flex gap-1.5 items-center h-5">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 flex-shrink-0">
            <div className="flex gap-3 items-end">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about candidates, job postings, interview questions..."
                rows={1}
                className="flex-1 resize-none outline-none text-sm text-gray-800 placeholder-gray-400 max-h-32 py-1 px-1"
                style={{ lineHeight: '1.6' }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="w-10 h-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex-shrink-0 shadow-sm"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 px-1">Press Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default AIRecruiterAssistant;
