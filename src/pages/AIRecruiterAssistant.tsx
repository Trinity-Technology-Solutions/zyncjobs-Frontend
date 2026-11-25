import EmployerFeatureGuide from '../components/EmployerFeatureGuide';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, User, Sparkles, Briefcase, Users, FileText, Zap, Target, MessageSquare, ChevronRight, RotateCcw, CheckCircle2 } from 'lucide-react';
import { API_ENDPOINTS } from '../config/constants';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { apiFetch } from '../api/apiFetch';
import { getApplicationJobId, getId } from '../utils/getId';
import { getEffectiveEmployerEmail } from '../utils/employerIdUtils';
import { formatSalary } from '../utils/textUtils';
import { mergeCandidateSkills } from '../utils/candidateScoring';
import { sendAIMessageStream } from '../services/aiChatService';
import { searchCandidates, type RecruiterCandidate } from '../services/aiRecruiterService';
import { useTypewriter } from '../hooks/useTypewriter';

const AI_BASE = import.meta.env.VITE_AI_API_URL || '/recruitment-ai';

interface AIRecruiterAssistantProps {
  onNavigate?: (page: string, data?: any) => void;
  onLogout?: () => void;
  user?: any;
}


type ApplicantResult = RecruiterCandidate & {
  applicationId?: string;
  postingId?: string;
  postingTitle?: string;
  applicationStatus?: string;
  matchedRequired?: string[];
  matchedPreferred?: string[];
  additionalSkills?: string[];
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  candidates?: ApplicantResult[];
}

const cleanReply = (reply: string) => reply.replace(/^#{1,6}\s+/gm, '').replace(/^\s*---+\s*$/gm, '').replace(/\*\*([^*]+)\*\*/g, '$1');

function rankPostingApplicants(job: any, applications: any[]): ApplicantResult[] {
  const key = (skill: string) => skill.trim().toLowerCase().replace(/^(react|vue|node)\.?js$/, '$1');
  const labels = (value: unknown): string[] => Array.isArray(value)
    ? [...new Map(value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map(item => [key(item), item.trim()])).values()]
    : [];
  const required = labels(job.skills);
  const requiredKeys = new Set(required.map(key));
  const preferred = labels(job.goodToHaveSkills).filter(skill => !requiredKeys.has(key(skill)));
  const preferredKeys = new Set(preferred.map(key));
  return applications.filter(app => getApplicationJobId(app.jobId) === getId(job)).map(app => {
    const skills = labels(mergeCandidateSkills({ skills: app.skills || app.candidateSkills, candidateProfile: app.candidateProfile, parsedResume: app.parsedResume, resumeData: app.resumeData }));
    const keys = new Set(skills.map(key));
    const matchedRequired = required.filter(skill => keys.has(key(skill)));
    return {
      applicationId: getId(app),
      postingId: getId(job),
      postingTitle: job.jobTitle || job.title,
      applicationStatus: app.status,
      name: app.candidateName || app.candidateProfile?.name || 'Applicant',
      experience: [app.yearsExperience, app.candidateExperience, app.candidateProfile?.experience].find(value => typeof value === 'string' && value.trim()) || (typeof app.yearsExperience === 'number' ? `${app.yearsExperience} years` : undefined),
      skills,
      matchScore: required.length && skills.length ? Math.round(100 * matchedRequired.length / required.length) : null,
      matchedRequired,
      matchedPreferred: preferred.filter(skill => keys.has(key(skill))),
      missingSkills: skills.length ? required.filter(skill => !keys.has(key(skill))) : [],
      additionalSkills: skills.filter(skill => !requiredKeys.has(key(skill)) && !preferredKeys.has(key(skill))),
    };
  }).sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1) || b.matchedPreferred.length - a.matchedPreferred.length);
}

const SYSTEM_PROMPT = `You are ZyncJobs AI Recruiter Assistant — an expert recruitment automation assistant for employers and HR teams on ZyncJobs.

Treat unavailable facts as unknown. Never invent employer or applicant facts, scores, or salary. If no posting is selected, ask the recruiter to select one before reviewing a specific role. Use plain text and short bullet lists.

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
  if (/\b(rank|score|evaluate|compare|best fit|best candidates?|top candidates?|who should i (?:interview|hire)|analy[sz]e (?:a |this |my )?candidate)\b/.test(q)) return 'rank';
  if (/\b(source|find|search|look for|fetch|hire)\b/.test(q)) return 'source';
  return null;
};

function postingReview(job: any): string {
  const list = (skills: unknown) => Array.isArray(skills) && skills.length ? skills.join(', ') : 'Not available';
  const salary = job.salary || ((job.salaryMin || job.salaryMax) ? { min: job.salaryMin, max: job.salaryMax } : null);
  const hasDescription = Boolean((job.jobDescription || job.description || '').trim());
  const postedSalary = formatSalary(salary, job.currency || job.salary?.currency) || 'Not available';
  const missing = [
    ...(!hasDescription ? ['job description'] : []),
    ...(!job.skills?.length ? ['required skills'] : []),
    ...(!job.experienceRange && !job.experience ? ['experience requirement'] : []),
    ...(!job.location ? ['location'] : []),
    ...(postedSalary === 'Not available' ? ['posted salary'] : []),
  ];
  return [
    job.jobTitle || job.title || 'Selected posting',
    `Required skills: ${list(job.skills)}`,
    `Preferred skills: ${list(job.goodToHaveSkills)}`,
    `Experience requirement: ${job.experienceRange || job.experience || 'Not available'}`,
    `Location: ${job.location || 'Not available'}`,
    `Posted salary: ${postedSalary}`,
    `Job type: ${Array.isArray(job.jobType) ? list(job.jobType) : job.jobType || job.type || 'Not available'}`,
    missing.length ? `Review before publishing: ${missing.join(', ')}.` : 'Core posting fields are present. Check that the responsibilities and qualifications are specific to the role.',
  ].join('\n');
}

const AIRecruiterAssistant: React.FC<AIRecruiterAssistantProps> = ({ onNavigate, onLogout, user }) => {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `Hello${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! 👋 I'm your **AI Recruiter Assistant**.\n\nI can help you streamline your hiring process — from writing job descriptions to evaluating candidates and automating communications.\n\nSelect a quick action below or type your question to get started.`,
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [jobsError, setJobsError] = useState(false);
  const selectedJob = jobs.find(job => getId(job) === selectedJobId);
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
    if (!user?.email) return;
    const controller = new AbortController();
    const ownerEmail = getEffectiveEmployerEmail() || user.email;
    apiFetch(`${API_ENDPOINTS.JOBS}/employer/email/${encodeURIComponent(ownerEmail)}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Could not load postings');
        const data = await response.json();
        if (!controller.signal.aborted) {
          setJobs((Array.isArray(data) ? data : data.jobs || []).filter((job: any) => getId(job)));
          setJobsError(false);
        }
      })
      .catch(() => { if (!controller.signal.aborted) setJobsError(true); });
    return () => controller.abort();
  }, [user?.email]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  const shortlistCandidate = useCallback(async (candidate: ApplicantResult) => {
    if (!candidate.applicationId) return;
    try {
      const response = await apiFetch(`${API_ENDPOINTS.APPLICATIONS}/${encodeURIComponent(candidate.applicationId)}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'shortlisted' }),
      });
      if (!response.ok) throw new Error('Shortlist failed');
      setShortlistedIds(prev => [...new Set([...prev, candidate.applicationId!])]);
      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: `${candidate.name} shortlisted.` } }));
    } catch {
      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Could not shortlist the application.' } }));
    }
  }, []);

  const loadPostingApplicants = useCallback(async (job: any, signal: AbortSignal) => {
    const response = await apiFetch(`${API_ENDPOINTS.APPLICATIONS}/job/${encodeURIComponent(getId(job))}`, { signal: signal });
    if (!response.ok) throw new Error('Could not load applications');
    const data = await response.json();
    const applications = Array.isArray(data) ? data : data.applications;
    if (!Array.isArray(applications)) throw new Error('Invalid applications response');
    const candidates = rankPostingApplicants(job, applications);
    const title = job.jobTitle || job.title;
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: candidates.length
        ? `${title}: ${candidates.length} applicant${candidates.length === 1 ? '' : 's'}, ordered by required skill coverage. Use the evidence below to decide who to review.`
        : `No applications found for ${title}.`,
      candidates, timestamp: new Date(),
    }]);
  }, []);

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
    
    const intent = detectRecruiterIntent(trimmed);
    if (intent) {
      try {
        if (intent === 'source') {
          const result = await searchCandidates(trimmed);
          if (!result.success) throw new Error('Candidate sourcing failed');
          setMessages(prev => [...prev, {
            role: 'assistant', content: `Talent pool results: ${result.candidates.length} candidates shown.`,
            candidates: result.candidates, timestamp: new Date(),
          }]);
        } else if (!selectedJob) {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Select a job posting first so I can review its applicants.', timestamp: new Date() }]);
        } else {
          await loadPostingApplicants(selectedJob, abortRef.current.signal);
        }
      } catch {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Could not load recruitment data. Please try again.', timestamp: new Date() }]);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (/\b(?:jd|job description|posting|salary|ctc|compensation)\b/i.test(trimmed) && /\b(?:good|review|optim\w*|analy[sz]e|audit|missing|salary|ctc|compensation)\b/i.test(trimmed)) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: selectedJob ? postingReview(selectedJob) : 'Select a job posting to review its actual details.',
        timestamp: new Date(),
      }]);
      setLoading(false);
      return;
    }

    const jobContext = selectedJob ? [selectedJob] : [];
    // Try AI service first for contextual responses
    let aiResponseSuccessful = false;
    
    try {
      setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date() }]);
      let full = '';
      await sendAIMessageStream(
        updated.map(m => ({ role: m.role, content: m.content })),
        SYSTEM_PROMPT + (selectedJob ? `\n\nSelected posting:\n${postingReview(selectedJob)}\n\nJob description:\n${String(selectedJob.jobDescription || selectedJob.description || '').slice(0, 8000)}` : ''),
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
      aiResponseSuccessful = Boolean(full);
    } catch (e: any) {
      if (e?.name === 'AbortError') { setLoading(false); return; }
      if (e?.message === 'AI agent unavailable') {
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
      const fallbackResponse = 'The AI response is unavailable. Try again, or select a posting and ask to review its JD or rank its applicants.';
      setMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0 && updated[updated.length - 1].role === 'assistant' && updated[updated.length - 1].content === '') {
          updated.pop();
        }
        updated.push({ role: 'assistant', content: fallbackResponse, timestamp: new Date() });
        return updated;
      });
    }
    setLoading(false);
  }, [messages, loading, selectedJob, loadPostingApplicants, user]);

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

  const selectPosting = async (jobId: string) => {
    setSelectedJobId(jobId);
    resetChat();
    const job = jobs.find(posting => getId(posting) === jobId);
    if (!job) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      await loadPostingApplicants(job, controller.signal);
    } catch {
      if (!controller.signal.aborted) setMessages(prev => [...prev, {
        role: 'assistant', content: 'Could not load applicants for this posting. Select Rank Candidates to retry.', timestamp: new Date(),
      }]);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  const formatTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

return (
    <div className="employer-content-page min-h-screen bg-slate-50 flex flex-col">
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

        <div className="portal-page-container relative max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-9">
          <div className="recruiter-banner-layout">
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
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.35rem] xl:text-[2.6rem] font-extrabold tracking-[-0.02em] leading-[1.15] flex items-center gap-2">
                  AI Recruiter Assistant
                  <span className="hidden sm:inline-flex text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-blue-500/30 to-violet-500/30 border border-white/20 text-blue-200 rounded-full px-2 py-0.5">Beta</span>
                </h1>
                <p className="text-blue-300/90 text-sm sm:text-base leading-relaxed mt-0.5 max-w-2xl">Agentic AI talent sourcing · screening · ranked shortlists</p>
              </div>
            </div>
            <div className="recruiter-banner-actions">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-2.5 sm:px-3 py-1.5 rounded-full border border-white/20 flex-1 sm:flex-none">
                <span className={`w-2 h-2 rounded-full ${aiOnline === null ? 'bg-amber-400 animate-pulse' : aiOnline ? 'bg-emerald-400' : 'bg-red-400'} shadow-[0_0_8px_rgba(52,211,153,0.8)]`} />
                <span className="text-xs text-white/80 font-medium truncate">
                  {aiOnline === null ? 'Connecting to AI engine…' : aiOnline ? 'AI Engine Online' : 'AI Engine Offline'}
                </span>
              </div>
              <button
                onClick={resetChat}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur px-3 sm:px-4 py-2 rounded-xl border border-white/20 text-sm text-white transition-all hover:scale-[1.02] active:scale-95 flex-shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Chat</span>
              </button>
            </div>
              <label className="recruiter-posting-picker">
                Job posting
                <select value={selectedJobId} disabled={loading} onChange={event => void selectPosting(event.target.value)}
                  className="recruiter-posting-select">
                  <option value="">{jobsError ? 'Could not load postings' : 'Select a posting'}</option>
                  {jobs.map(job => <option key={getId(job)} value={getId(job)}>{job.jobTitle || job.title}{job.location ? ` / ${job.location}` : ''}</option>)}
                </select>
              </label>
          </div>
        </div>
        {/* Gradient divider */}
        <div className="relative h-px bg-gradient-to-r from-transparent via-blue-500/70 to-transparent" />
      </div>

      <div className="recruiter-feature-workspace portal-page-container flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 flex gap-4 sm:gap-6" style={{ minHeight: 0 }}>

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
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">Applicant ranking uses the selected posting and works even when AI chat is offline.</p>
            </div>
          </div>
        </div>

        <EmployerFeatureGuide feature="recruiter" />
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
                <div className={`min-w-0 flex flex-col gap-1 ${msg.role === 'user' ? 'max-w-[85%] items-end' : msg.candidates?.length ? 'flex-1 items-start' : 'max-w-[85%] sm:max-w-[75%] items-start'}`}>
                  <div className={`px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                    msg.role === 'assistant'
                      ? 'bg-gradient-to-br from-gray-50 to-white text-gray-800 rounded-tl-sm border border-gray-100'
                      : 'bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-tr-sm shadow-md'
                  }`}>
                    {msg.role === 'assistant' ? cleanReply(i === messages.length - 1 && isTyping ? streamingText : msg.content) : msg.content}
                    {i === messages.length - 1 && msg.role === 'assistant' && isTyping && (
                      <span className="inline-block w-1 h-4 bg-blue-400 animate-pulse ml-0.5 align-middle" />
                    )}
                  </div>

                  {msg.role === 'assistant' && msg.candidates && msg.candidates.length > 0 && (
                    <div className="w-full grid grid-cols-1 gap-3 mt-2">
                      {msg.candidates.map((c, ci) => (
                        <div key={`${c.name}-${ci}`} style={{ animationDelay: `${ci * 70}ms` }} className="zync-pop-in min-w-0 bg-white border border-gray-200 rounded-xl p-4 shadow-sm [overflow-wrap:anywhere]">
                          <div className="flex items-start gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm ring-2 ring-violet-100">
                              <span className="text-xs font-bold text-white">
                                {(c.name.split(' ').map(p => p[0]).join('') || '?').slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-base font-semibold text-gray-900">{c.name}</p>
                              {c.role && <p className="text-sm text-gray-600">{c.role}</p>}
                              {(c.location || c.experience) && (
                                <p className="text-xs text-gray-400 truncate">
                                  {[c.location, c.experience].filter(Boolean).join(' · ')}
                                </p>
                              )}
                            </div>
                          </div>
                          {c.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {c.skills.slice(0, 4).map(s => (
                                <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-xs font-medium">{s}</span>
                              ))}
                              {c.skills.length > 4 && <span className="text-[10px] text-gray-400 self-center">+{c.skills.length - 4}</span>}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            {c.matchScore != null && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[10px] font-semibold">
                                <CheckCircle2 className="w-3 h-3" /> {c.applicationId ? 'Required skills' : 'Match'} {c.matchScore}%
                              </span>
                            )}
                            {c.atsScore != null && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-md text-[10px] font-semibold">
                                <Sparkles className="w-3 h-3" /> ATS {c.atsScore}
                              </span>
                            )}
                          </div>
                          {(c.applicationId || c.missingSkills.length > 0) && (
                            <details className="mt-3 border-t border-gray-100 pt-2 text-sm text-slate-700">
                              <summary className="cursor-pointer font-medium text-blue-700">Skill details</summary>
                              <div className="mt-2 space-y-2">
                                {c.missingSkills.length > 0 && (
                                  <p className="text-amber-800">Missing{c.applicationId ? ' required' : ''}: {c.missingSkills.join(', ')}</p>
                                )}
                                {c.applicationId && (
                                  <>
                                    <p>Matched required: {c.matchedRequired?.join(', ') || 'None verified'}</p>
                                    {c.matchScore == null && <p>Required skill coverage unavailable. Check the posting and applicant skill data.</p>}
                                    <p>Matched preferred: {c.matchedPreferred?.join(', ') || 'None verified'}</p>
                                    <p>Additional skills: {c.additionalSkills?.join(', ') || 'None recorded'}</p>
                                  </>
                                )}
                              </div>
                            </details>
                          )}
                          {c.applicationId && (
                            <p className="mt-2 text-xs text-slate-600">Status: {shortlistedIds.includes(c.applicationId) ? 'shortlisted' : c.applicationStatus || 'Not available'}</p>
                          )}
                          <div className="flex gap-1.5 mt-2">
                            {c.applicationId && !['rejected', 'withdrawn', 'hired', 'interviewed'].includes(c.applicationStatus || '') && <button
                              onClick={() => shortlistCandidate(c)}
                              disabled={(c.applicationStatus === 'shortlisted' || shortlistedIds.includes(c.applicationId || ''))}
                              className={`flex-1 text-xs font-semibold rounded-lg py-1.5 transition-colors disabled:cursor-default ${
                                (c.applicationStatus === 'shortlisted' || shortlistedIds.includes(c.applicationId || ''))
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              {(c.applicationStatus === 'shortlisted' || shortlistedIds.includes(c.applicationId || '')) ? '✓ Shortlisted' : 'Shortlist'}
                            </button>}
                            <button
                              onClick={() => c.postingId
                                ? onNavigate?.('dashboard', { applicationJobId: c.postingId, applicationJobTitle: c.postingTitle })
                                : onNavigate?.('candidate-search')}
                              className="flex-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg py-1.5 transition-colors"
                            >
                              {c.postingId ? 'View applications' : 'Candidate Search'}
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
