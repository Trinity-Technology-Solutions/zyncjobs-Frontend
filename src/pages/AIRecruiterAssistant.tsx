import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, User, Sparkles, Briefcase, Users, FileText, Zap, Target, MessageSquare, ChevronRight, RotateCcw } from 'lucide-react';
import { API_ENDPOINTS } from '../config/constants';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getCached, setCached, cacheKey } from '../services/aiCache';
import { sendAIMessageStream } from '../services/aiChatService';
import { searchCandidates, rankCandidates, shortlistCandidates, type RecruiterCandidate } from '../services/aiRecruiterService';
import { useTypewriter } from '../hooks/useTypewriter';

const AI_BASE = import.meta.env.VITE_AI_API_URL || '/recruitment-ai';

interface AIRecruiterAssistantProps {
  onNavigate?: (page: string, data?: any) => void;
  onLogout?: () => void;
  user?: any;
}


interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  candidates?: RecruiterCandidate[];
}

const SYSTEM_PROMPT = `You are ZyncJobs AI Recruiter Assistant — an expert recruitment automation assistant for employers and HR teams on ZyncJobs.

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

NEVER mention other job sites (LinkedIn, Indeed, Glassdoor, Naukri, Monster, etc.). Focus ONLY on ZyncJobs platform and its features. Keep responses concise, professional, and actionable. Use bullet points for lists. Focus on practical recruitment advice.`;

const QUICK_ACTIONS = [
  { icon: FileText, label: 'Optimize Job Posting', desc: 'Improve your JD for better reach', prompt: 'Help me optimize my job posting to attract better candidates. What key elements should I include?', color: 'from-blue-500 to-blue-600' },
  { icon: Users, label: 'Analyze Candidate', desc: 'Evaluate & rank applicants', prompt: 'How should I evaluate and rank candidates for a software engineer role? What criteria matter most?', color: 'from-violet-500 to-violet-600' },
  { icon: MessageSquare, label: 'Interview Questions', desc: 'Generate role-specific questions', prompt: 'Generate 10 strong interview questions for a Senior React Developer position including technical and behavioral questions.', color: 'from-emerald-500 to-emerald-600' },
  { icon: Zap, label: 'Screening Criteria', desc: 'Set smart filters & red flags', prompt: 'What are the best screening criteria and red flags to watch for when hiring a full-stack developer?', color: 'from-amber-500 to-amber-600' },
  { icon: Target, label: 'Write Job Description', desc: 'Create compelling JDs instantly', prompt: 'Write a compelling job description for a Data Analyst role at a mid-size tech company with 3-5 years experience required.', color: 'from-pink-500 to-pink-600' },
  { icon: Briefcase, label: 'Rejection Email', desc: 'Professional candidate emails', prompt: 'Write a professional and empathetic rejection email template for candidates who were not selected after the interview stage.', color: 'from-rose-500 to-rose-600' },
  { icon: Users, label: 'Source Candidates', desc: 'Find candidates by criteria', prompt: 'Source candidates for a Senior Frontend Developer role with React and TypeScript', color: 'from-cyan-500 to-cyan-600' },
  { icon: Target, label: 'Rank Candidates', desc: 'Rank applicants by fit', prompt: 'Rank candidates for my open role', color: 'from-blue-500 to-indigo-600' },
  { icon: Zap, label: 'Shortlist Best Fit', desc: 'Get a shortlist recommendation', prompt: 'Shortlist the best candidates for my open roles', color: 'from-amber-500 to-orange-600' },
];

const detectRecruiterIntent = (text: string): 'source' | 'rank' | 'shortlist' | null => {
  const q = text.toLowerCase();
  if (/\b(short[- ]?list|short listing)\b/.test(q)) return 'shortlist';
  if (/\b(rank|score|evaluate|compare|best fit|best candidate|top candidate)\b/.test(q)) return 'rank';
  if (/\b(source|find|search|look for|fetch|hire)\b/.test(q)) return 'source';
  return null;
};

const getAdvancedFallbackWithContext = (input: string, jobs: any[], user: any): string => {
  const q = input.toLowerCase();
  const hasJobContext = jobs && jobs.length > 0;
  const userName = user?.name || user?.fullName || 'Recruiter';
  
  if (hasJobContext) {
    const jobTitles = jobs.map(j => j.jobTitle || j.title || '').filter(Boolean).join(', ');
    const relevantSkills = jobs.flatMap(j => {
      const skills = Array.isArray(j.skills) ? j.skills : [];
      return skills.slice(0, 4);
    }).filter(Boolean).join(', ');

    const screeningForRoles = jobs.map(j => {
      const title = j.jobTitle || j.title || 'role';
      const skills = Array.isArray(j.skills) ? j.skills.slice(0, 5).join(', ') : 'core skills';
      const exp = j.experienceRange || j.experienceLevel || 'relevant';
      const loc = j.location || 'your location';
      return `**${title}** (${loc})\n• Skills to verify: ${skills}\n• Experience: ${exp}\n• Assessment: technical/domain screening tailored to ${title}`;
    }).join('\n\n');

    if (q.includes('candidate') || q.includes('screen') || q.includes('evaluate')) {
      return `${userName}, here is a screening plan built from your active roles (${jobTitles}):\n\n${screeningForRoles}\n\n**Universal red flags:**\n• Skills claimed but not backed by experience\n• Employment gaps without explanation\n• Poor communication in cover letter or interview\n\nKey skill focus for your openings: ${relevantSkills}\n\nWould you like detailed scoring criteria for any of these roles?`;
    }

    if (q.includes('interview')) {
      return `${userName}, here are interview strategies tailored to your current openings (${jobTitles}):\n\n${screeningForRoles}\n\n**Recommended question structure:**\n• Role-specific technical questions around: ${relevantSkills}\n• Behavioral questions using the STAR format\n• Culture-fit and growth-orientation questions\n\nWould you like me to generate 10 ready-to-use questions for a specific role?`;
    }

    if (q.includes('job') && (q.includes('post') || q.includes('description') || q.includes('optim'))) {
      return `${userName}, here is how to optimize your active postings (${jobTitles}):\n\n**For each role:**\n• Lead with impact and team context\n• List must-have skills first: ${relevantSkills}\n• Add salary range — postings with salary get ~30% more applications\n• Include location, work mode, and growth path\n• Keep requirements realistic — separate "must-have" from "nice-to-have"\n\nWant me to rewrite the description for one of these roles?`;
    }

    if (q.includes('salary') || q.includes('benchmark') || q.includes('pay')) {
      return `${userName}, salary guidance for your active roles (${jobTitles}):\n\n• Use ZyncJobs salary insights for real-time, role-specific data\n• Adjust for location — metro cities command a 20-30% premium\n• Consider total comp: base + bonus + equity + benefits\n• Match ranges to the experience level in each posting\n\nSkills influencing pay in your roles: ${relevantSkills}\n\nTell me a specific role + location and I'll give a precise benchmark range.`;
    }

    if (q.includes('reject') || q.includes('email') || q.includes('template')) {
      return `${userName}, here is a rejection email template you can use for candidates in your ${jobTitles} pipeline:\n\nSubject: Application Update - [Role]\n\nDear [Candidate Name],\n\nThank you for interviewing for [Role] at [Company]. We appreciated learning about your background.\n\nAfter careful review, we have decided to move forward with another candidate whose experience more closely matches our current needs.\n\nWe were impressed by [specific positive] and encourage you to apply for future openings that fit your profile.\n\nWarm regards,\n${userName}\n\nWould you like this customized for a specific stage or candidate?`;
    }

    return `${userName}, I can work with your active job data (${jobTitles}). Ask me about screening candidates, interview questions, optimizing postings, salary benchmarks, or candidate emails — and I'll tailor the answer to your current roles.`;
  }

  if (q.includes('job') && (q.includes('post') || q.includes('description') || q.includes('optim')))
    return `Here's how to optimize your job posting:\n\n• **Clear job title** — Use standard titles (e.g., "Senior React Developer" not "Rockstar Coder")\n• **Compelling summary** — 2-3 sentences on role impact and team\n• **Specific requirements** — Separate "must-have" from "nice-to-have"\n• **Salary range** — Posts with salary get 30% more applications\n• **Company culture** — Mention work style, benefits, growth opportunities\n• **Clear apply process** — Tell candidates exactly what to expect\n\nWant me to write a specific job description for you?`;
  if (q.includes('interview') && q.includes('question'))
    return `Strong interview questions by category:\n\n**Technical:**\n• Describe your experience with [specific tech stack]\n• Walk me through how you'd architect [specific system]\n• How do you handle [specific technical challenge]?\n\n**Behavioral (STAR format):**\n• Tell me about a time you missed a deadline — what happened?\n• Describe a conflict with a teammate and how you resolved it\n• Give an example of a project you're most proud of\n\n**Culture fit:**\n• What does your ideal work environment look like?\n• How do you stay updated with industry trends?\n• Where do you see yourself in 3 years?\n\nWant questions tailored to a specific role?`;
  if (q.includes('screen') || q.includes('criteria') || q.includes('evaluat'))
    return `Candidate screening framework:\n\n**Must-have criteria:**\n• Core technical skills match (60% weight)\n• Years of relevant experience\n• Education/certification requirements\n\n**Good-to-have:**\n• Industry domain knowledge\n• Portfolio/GitHub/work samples\n• Communication skills in cover letter\n\n**Red flags to watch:**\n• Frequent job hopping (< 1 year per role without reason)\n• Vague answers about past responsibilities\n• No questions asked during interview\n• Inconsistencies between resume and LinkedIn\n\nWhat role are you screening for? I can give specific criteria.`;
  if (q.includes('reject') || q.includes('email') || q.includes('template'))
    return `Professional rejection email template:\n\n---\nSubject: Your Application at [Company] — Update\n\nDear [Candidate Name],\n\nThank you for taking the time to interview with us for the [Role] position. We genuinely appreciated learning about your background and experience.\n\nAfter careful consideration, we've decided to move forward with another candidate whose experience more closely aligns with our current needs.\n\nWe were impressed by [specific positive] and encourage you to apply for future openings.\n\nWarm regards,\n[Your Name]\n---\n\nWant me to customize this for a specific stage?`;
  if (q.includes('salary') || q.includes('benchmark') || q.includes('pay'))
    return `Salary benchmarking tips on ZyncJobs:\n\n• **Check ZyncJobs salary insights** for role-specific data\n• **Factor in location** — Bangalore/Mumbai command 20-30% premium\n• **Consider total comp** — base + bonus + equity + benefits\n\n**India tech salary ranges (2024):**\n• Junior Dev (0-2 yrs): ₹4-8 LPA\n• Mid Dev (2-5 yrs): ₹8-18 LPA\n• Senior Dev (5-8 yrs): ₹18-35 LPA\n• Lead/Architect (8+ yrs): ₹35-60 LPA\n\nWhat role and location are you benchmarking for?`;
  return `I can help you with that! Here are some key recruitment best practices:\n\n• **Speed matters** — Top candidates are off the market in 10 days\n• **Clear communication** — Update candidates at every stage\n• **Structured interviews** — Use consistent questions for fair comparison\n• **Data-driven decisions** — Track time-to-hire, offer acceptance rate\n\nCould you share more details about your specific challenge?`;
};

const AIRecruiterAssistant: React.FC<AIRecruiterAssistantProps> = ({ onNavigate, onLogout, user }) => {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `Hello${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! 👋 I'm your **AI Recruiter Assistant**.\n\nI can help you streamline your hiring process — from writing job descriptions to evaluating candidates and automating communications.\n\nSelect a quick action below or type your question to get started.`,
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [jobContext, setJobContext] = useState<any[]>([]);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
  const [aiOnline, setAiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    fetch(`${AI_BASE}/docs`, { signal: ctrl.signal })
      .then(r => setAiOnline(r.ok))
      .catch(() => setAiOnline(false))
      .finally(() => clearTimeout(timer));
    return () => { ctrl.abort(); clearTimeout(timer); };
  }, []);
  const chatRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { streamingText, isTyping } = useTypewriter();

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
      } catch { /* offline or backend unavailable */ }
    };
    if (user?.email) loadJobs();
  }, [user]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  const shortlistCandidate = useCallback(async (candidate: RecruiterCandidate) => {
    const job = jobContext[0];
    const jobId = job?._id || job?.id;
    if (!jobId) {
      window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Open a job first — shortlisting needs an active job" } }));
      return;
    }
    if (!candidate.id) {
      window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Candidate profile not found — open them in Candidate Search instead" } }));
      return;
    }
    try {
      await fetch(`${API_ENDPOINTS.BASE_URL}/employer/shortlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: candidate.id, jobId, notes: `Shortlisted via AI Recruiter Assistant for ${job.jobTitle || job.title || 'the role'}` }),
      });
      setShortlistedIds(prev => prev.includes(candidate.id!) ? prev : [...prev, candidate.id!]);
      window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: `${candidate.name} shortlisted for ${job.jobTitle || job.title || 'the role'}!` } }));
    } catch {
      window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Error shortlisting candidate" } }));
    }
  }, [jobContext]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const userMsg: Message = { role: 'user', content: trimmed, timestamp: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);
    
    // Check cache
    const key = cacheKey('recruiter', trimmed);
    const cached = getCached<string>(key);
    if (cached) {
      setMessages(prev => [...prev, { role: 'assistant', content: cached, timestamp: new Date() }]);
      setLoading(false);
      return;
    }

    // Structured recruiter actions — real AI service endpoints (sourcing, ranking, shortlisting)
    const intent = detectRecruiterIntent(trimmed);
    if (intent) {
      try {
        const cleaned = trimmed.replace(/\b(please|pls|source|find|search|short[- ]?list|rank|me|for|candidates?|candidate)\b/gi, ' ').replace(/\s+/g, ' ').trim();
        const firstJob = jobContext[0];
        const jobDesc = cleaned
          || (firstJob ? `${firstJob.jobTitle || firstJob.title || ''}${Array.isArray(firstJob.skills) && firstJob.skills.length ? ` — ${firstJob.skills.slice(0, 5).join(', ')}` : ''}`.trim() : '')
          || 'skilled professionals';
        let candidates: RecruiterCandidate[] = [];
        let summary = '';

        if (intent === 'source') {
          const r = await searchCandidates(jobDesc);
          candidates = r.candidates;
          summary = `🔎 **Sourced ${r.totalCount || candidates.length} matching candidate${(r.totalCount || candidates.length) === 1 ? '' : 's'}** from the talent pool for:\n"${jobDesc}"\n\nShowing the top ${candidates.length} below — tap a card to open Candidate Search.`;
        } else if (intent === 'rank') {
          const found = await searchCandidates(jobDesc);
          const r = await rankCandidates(jobDesc, found.candidates.map((c) => ({ ...c })));
          candidates = r.ranked;
          summary = `🏆 **Ranked ${candidates.length} candidates by fit** for:\n"${jobDesc}"\n\nSorted best-first by match score.`;
        } else {
          const r = await shortlistCandidates(jobDesc);
          candidates = r.candidates;
          summary = `✅ **Shortlist recommendation** for:\n"${jobDesc}"\n\n${candidates.length} candidate${candidates.length === 1 ? '' : 's'} made the cut — ranked by fit.`;
        }

        if (candidates.length > 0) {
          setCached(key, summary);
          setLoading(false);
          setMessages(prev => [...prev, { role: 'assistant', content: summary, candidates, timestamp: new Date() }]);
          return;
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError') console.warn('Structured recruiter action failed, falling back to chat:', e);
      }
    }

    // Try AI service first for contextual responses
    let aiResponseSuccessful = false;
    
    try {
      setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date() }]);
      setLoading(false);
      let full = '';
      await sendAIMessageStream(
        updated.map(m => ({ role: m.role, content: m.content })),
        SYSTEM_PROMPT + (jobContext.length > 0 ? `\n\nCurrent job context: ${jobContext.map(j => {
          const title = j.jobTitle || j.title || '';
          const skills = Array.isArray(j.skills) ? j.skills.slice(0, 3).join(', ') : '';
          const location = j.location || '';
          return `${title} (skills: ${skills}, location: ${location})`;
        }).join('; ')}` : ''),
        (chunk) => {
          full += chunk;
          setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: full, timestamp: new Date() }; return u; });
        },
        abortRef.current.signal,
        {
          ...(jobContext.length > 0 && { jobs_context: jobContext }),
          user_profile: user,
        }
      );
      if (full) {
        aiResponseSuccessful = true;
        setCached(key, full);
      }
    } catch (e: any) {
      if (e?.name === 'AbortError' || e?.message === 'AI agent unavailable') {
        // AI service not available or failed - use enhanced fallback
        aiResponseSuccessful = false;
      } else {
        // Unexpected error - fallback to enhanced fallback
        aiResponseSuccessful = false;
        console.error('AI service error:', e);
      }
    }

    // Enhanced fallback logic with better context handling
    if (!aiResponseSuccessful) {
      const fallbackResponse = getAdvancedFallbackWithContext(trimmed, jobContext, user);
      setMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0 && updated[updated.length - 1].role === 'assistant' && updated[updated.length - 1].content === '') {
          updated.pop();
        }
        updated.push({ role: 'assistant', content: fallbackResponse, timestamp: new Date() });
        return updated;
      });
    }
  }, [messages, loading, jobContext, user]);

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
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />


      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white overflow-hidden">
        {/* Animated glow orbs */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-500/25 rounded-full blur-3xl zync-float" />
        <div className="absolute -bottom-32 -right-16 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl zync-float-delayed" />
        <div className="absolute top-0 right-1/3 w-48 h-48 bg-cyan-400/10 rounded-full blur-2xl zync-float-slow" />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '42px 42px' }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-9">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => onNavigate?.('dashboard')}
                aria-label="Go back"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-white/70 bg-white/15 hover:bg-white/25 text-white shadow-sm hover:shadow-md hover:scale-105 transition-all backdrop-blur-sm flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              <div className="relative">
                <div className="absolute inset-0 bg-violet-500/50 rounded-xl sm:rounded-2xl blur-md zync-glow" />
                <div className="relative w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-blue-400 via-blue-500 to-violet-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-white/30">
                  <Sparkles className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
                  AI Recruiter Assistant
                  <span className="hidden sm:inline-flex text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-blue-500/30 to-violet-500/30 border border-white/20 text-blue-200 rounded-full px-2 py-0.5">Beta</span>
                </h1>
                <p className="text-blue-300/90 text-xs sm:text-sm mt-0.5">Agentic AI talent sourcing · screening · ranked shortlists</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-2.5 sm:px-3 py-1.5 rounded-full border border-white/20 flex-1 sm:flex-none">
                <span className={`w-2 h-2 rounded-full ${aiOnline === null ? 'bg-amber-400 animate-pulse' : aiOnline ? 'bg-emerald-400' : 'bg-red-400'} shadow-[0_0_8px_rgba(52,211,153,0.8)]`} />
                <span className="text-xs text-white/80 font-medium truncate">
                  {aiOnline === null ? 'Connecting to AI engine…' : aiOnline ? 'AI Engine Online' : 'AI Engine Offline'}
                </span>
              </div>
              {jobContext.length > 0 && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-2.5 sm:px-3 py-1.5 rounded-full border border-white/20 flex-1 sm:flex-none">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-xs text-white/80 font-medium truncate">{jobContext.length} job{jobContext.length > 1 ? 's' : ''} in context</span>
                </div>
              )}
              <button
                onClick={resetChat}
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur px-3 sm:px-4 py-2 rounded-xl border border-white/20 text-sm text-white transition-all hover:scale-[1.02] active:scale-95 flex-shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Chat</span>
              </button>
            </div>
          </div>
        </div>
        {/* Gradient divider */}
        <div className="relative h-px bg-gradient-to-r from-transparent via-blue-500/70 to-transparent" />
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 flex gap-4 sm:gap-6" style={{ minHeight: 0 }}>

        {/* Left Sidebar — Quick Actions */}
        <div className="w-56 sm:w-64 flex-shrink-0 hidden lg:block">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-lg shadow-blue-900/5 overflow-hidden sticky top-6">
            <div className="relative px-4 py-3 bg-gradient-to-r from-blue-600 via-blue-600 to-violet-600 text-white overflow-hidden">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full" />
              <p className="text-xs font-semibold uppercase tracking-wider relative">Quick Actions</p>
              <p className="text-[11px] text-blue-100/90 mt-0.5 relative">One-click hiring workflows</p>
            </div>
            <div className="p-2 space-y-1">
              {QUICK_ACTIONS.map((action, i) => {
                const Icon = action.icon;
                return (
                  <button
                    key={i}
                    onClick={() => sendMessage(action.prompt)}
                    className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2.5 rounded-lg sm:rounded-xl hover:bg-blue-50/70 hover:translate-x-0.5 transition-all text-left group"
                  >
                    <div className={`w-7 sm:w-8 h-7 sm:h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                      <Icon className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">{action.label}</p>
                      <p className="text-xs text-gray-400 truncate hidden sm:block">{action.desc}</p>
                    </div>
                    <ChevronRight className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 flex-shrink-0 transition-all" />
                  </button>
                );
              })}
            </div>
            <div className="px-3 py-3 border-t border-gray-100 bg-gray-50/80">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${aiOnline === null ? 'bg-amber-400 animate-pulse' : aiOnline ? 'bg-emerald-500' : 'bg-red-400'}`} />
                <p className="text-[11px] font-medium text-gray-600">AI Engine {aiOnline === null ? '…' : aiOnline ? 'Online' : 'Offline'}</p>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">Sourcing, ranking & shortlisting run on the live AI service.</p>
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
                    style={{ animationDelay: `${i * 60}ms` }}
                    className="zync-pop-in flex flex-col sm:flex-row items-center sm:items-start gap-2 px-2 sm:px-3 py-2.5 bg-white border border-gray-200 rounded-lg sm:rounded-xl text-center sm:text-left hover:border-blue-300 hover:bg-blue-50 hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <div className={`w-6 sm:w-7 h-6 sm:h-7 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <Icon className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-700 truncate">{action.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Chat Messages */}
          <div className="relative flex-1 bg-white rounded-2xl border border-gray-200/80 shadow-xl shadow-blue-900/5 overflow-hidden mb-3 flex flex-col min-h-0">
            <div className="h-1 bg-gradient-to-r from-blue-600 via-violet-500 to-blue-600 zync-gradient-anim flex-shrink-0" />
            <div ref={chatRef} className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 sm:space-y-5">
            {messages.map((msg, i) => (
              <div key={i} style={{ animationDelay: `${Math.min(i * 80, 400)}ms` }} className={`zync-msg-in flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-8 sm:w-9 h-8 sm:h-9 rounded-lg sm:rounded-xl flex-shrink-0 flex items-center justify-center shadow-md ${
                  msg.role === 'assistant'
                    ? 'bg-gradient-to-br from-blue-500 to-violet-600 ring-2 ring-violet-200/60'
                    : 'bg-gradient-to-br from-gray-600 to-gray-700 ring-2 ring-gray-200/60'
                }`}>
                  {msg.role === 'assistant'
                    ? <Sparkles className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-white" />
                    : <User className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-white" />
                  }
                </div>

                {/* Bubble */}
                <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                    msg.role === 'assistant'
                      ? 'bg-gradient-to-br from-gray-50 to-white text-gray-800 rounded-tl-sm border border-gray-100'
                      : 'bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-tr-sm shadow-md'
                  }`}>
                    {i === messages.length - 1 && msg.role === 'assistant' && isTyping ? streamingText : msg.content}
                    {i === messages.length - 1 && msg.role === 'assistant' && isTyping && (
                      <span className="inline-block w-1 h-4 bg-blue-400 animate-pulse ml-0.5 align-middle" />
                    )}
                  </div>

                  {msg.role === 'assistant' && msg.candidates && msg.candidates.length > 0 && (
                    <div className="w-full max-w-[85%] sm:max-w-[75%] grid gap-2 sm:grid-cols-2 mt-1">
                      {msg.candidates.map((c, ci) => (
                        <div key={`${c.name}-${ci}`} style={{ animationDelay: `${ci * 70}ms` }} className="zync-pop-in bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                          <div className="flex items-start gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm ring-2 ring-violet-100">
                              <span className="text-xs font-bold text-white">
                                {(c.name.split(' ').map(p => p[0]).join('') || '?').slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                              {c.role && <p className="text-xs text-gray-500 truncate">{c.role}</p>}
                              {(c.location || c.experience) && (
                                <p className="text-xs text-gray-400 truncate">
                                  {[c.location, c.experience].filter(Boolean).join(' · ')}
                                </p>
                              )}
                            </div>
                          </div>
                          {c.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {c.skills.slice(0, 4).map(s => (
                                <span key={s} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-[10px] font-medium">{s}</span>
                              ))}
                              {c.skills.length > 4 && <span className="text-[10px] text-gray-400 self-center">+{c.skills.length - 4}</span>}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {c.matchScore != null && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[10px] font-semibold">
                                <CheckCircle2 className="w-3 h-3" /> Match {c.matchScore}%
                              </span>
                            )}
                            {c.atsScore != null && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-md text-[10px] font-semibold">
                                <Sparkles className="w-3 h-3" /> ATS {c.atsScore}
                              </span>
                            )}
                          </div>
                          {c.missingSkills.length > 0 && (
                            <p className="text-[10px] text-amber-600 mt-1.5">Missing: {c.missingSkills.slice(0, 3).join(', ')}</p>
                          )}
                          <div className="flex gap-1.5 mt-2">
                            <button
                              onClick={() => shortlistCandidate(c)}
                              disabled={shortlistedIds.includes(c.id || '')}
                              className={`flex-1 text-xs font-semibold rounded-lg py-1.5 transition-colors disabled:cursor-default ${
                                shortlistedIds.includes(c.id || '')
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              {shortlistedIds.includes(c.id || '') ? '✓ Shortlisted' : 'Shortlist'}
                            </button>
                            <button
                              onClick={() => onNavigate?.('candidate-search')}
                              className="flex-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg py-1.5 transition-colors"
                            >
                              View Profile
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <span className="text-xs text-gray-400 px-1">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            ))}

            {loading && !isTyping && (
              <div className="zync-msg-in flex gap-2 sm:gap-3">
                <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-violet-200/60">
                  <Sparkles className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-white" />
                </div>
                <div className="bg-white border border-gray-100 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl rounded-tl-sm shadow-sm">
                  <div className="flex gap-1.5 items-center h-4 sm:h-5">
                    <span className="w-2 h-2 bg-blue-500 rounded-full zync-typing-dot" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-violet-500 rounded-full zync-typing-dot" style={{ animationDelay: '180ms' }} />
                    <span className="w-2 h-2 bg-blue-400 rounded-full zync-typing-dot" style={{ animationDelay: '360ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>

          {/* Input Box */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-lg shadow-blue-900/5 p-2 sm:p-3 flex-shrink-0 focus-within:ring-2 focus-within:ring-blue-500/25 focus-within:border-blue-300/60 transition-all">
            <div className="flex gap-2 sm:gap-3 items-end">
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
                className="w-9 sm:w-10 h-9 sm:h-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg sm:rounded-xl flex items-center justify-center hover:opacity-90 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all flex-shrink-0 shadow-md shadow-blue-600/25"
              >
                <Send className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-white" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <p className="text-xs text-gray-400">Press Enter to send · Shift+Enter for new line</p>
              <p className="text-[10px] text-gray-300 hidden sm:block">AI can make mistakes — verify important details</p>
            </div>
          </div>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default AIRecruiterAssistant;
