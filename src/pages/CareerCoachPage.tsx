import React, { useState, useRef, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import RoleGuard from '../components/RoleGuard';
import {
  User, RefreshCw, Zap, TrendingUp,
  Target, BookOpen, Briefcase, Award, ChevronRight,
  Plus, MessageSquare, BarChart2, Map, Star, Paperclip, Mic, MicOff,
  Navigation, FileText, DollarSign, Volume2, Pin, Clock, Sparkles,
  GraduationCap, Rocket, CheckCircle2, Circle, ArrowRight,
} from 'lucide-react';
import BackButton from '../components/BackButton';
import { getCached, setCached, cacheKey } from '../services/aiCache';
import { sendAIMessageStream, buildUserContext } from '../services/aiChatService';
import { executeResumeAI } from '../services/resumeAIClient';

interface Props {
  onNavigate?: (page: string, data?: any) => void;
  user?: { name: string; type: 'candidate' | 'employer' | 'admin' } | null;
  onLogout?: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
  pinned: boolean;
  createdAt: number;
}

// Welcome screen quick-start cards (shown when no messages)
const STARTER_CARDS = [
  { icon: <Target className="w-5 h-5" />, label: 'Plan my career path', color: 'from-violet-500 to-indigo-500' },
  { icon: <FileText className="w-5 h-5" />, label: 'Review my resume & ATS score', color: 'from-blue-500 to-cyan-500' },
  { icon: <BookOpen className="w-5 h-5" />, label: 'What skills am I missing?', color: 'from-emerald-500 to-teal-500' },
  { icon: <Award className="w-5 h-5" />, label: 'Interview preparation tips', color: 'from-orange-500 to-amber-500' },
  { icon: <TrendingUp className="w-5 h-5" />, label: 'How to increase my salary?', color: 'from-pink-500 to-rose-500' },
  { icon: <Map className="w-5 h-5" />, label: 'Build my career roadmap', color: 'from-purple-500 to-violet-500' },
];

// Bottom input quick chips
const QUICK_ACTIONS = [
  { icon: <Target className="w-3.5 h-3.5" />, label: 'Plan my career path' },
  { icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'How to increase my salary?' },
  { icon: <BookOpen className="w-3.5 h-3.5" />, label: 'What skills am I missing?' },
  { icon: <Briefcase className="w-3.5 h-3.5" />, label: 'Improve my resume' },
  { icon: <Award className="w-3.5 h-3.5" />, label: 'Interview preparation' },
];

// After each AI response — contextual follow-up suggestions
const FOLLOWUP_ACTIONS = [
  { icon: <Map className="w-3 h-3" />, label: 'Generate Roadmap', msg: 'Generate a detailed career roadmap for me' },
  { icon: <FileText className="w-3 h-3" />, label: 'Improve Resume', msg: 'How can I improve my resume?' },
  { icon: <Briefcase className="w-3 h-3" />, label: 'Find Jobs', msg: 'Find matching jobs for my profile' },
  { icon: <Award className="w-3 h-3" />, label: 'Interview Questions', msg: 'Give me interview questions for my target role' },
  { icon: <BookOpen className="w-3 h-3" />, label: 'Learning Resources', msg: 'Suggest learning resources for my missing skills' },
];

const LEFT_CATEGORIES = [
  { icon: <Navigation className="w-4 h-4" />, label: 'Career Planning', msg: 'Plan my career path' },
  { icon: <FileText className="w-4 h-4" />, label: 'Resume Review', msg: 'Review my resume and ATS score' },
  { icon: <GraduationCap className="w-4 h-4" />, label: 'Interview Prep', msg: 'Help me prepare for interviews' },
  { icon: <DollarSign className="w-4 h-4" />, label: 'Salary Advice', msg: 'How to increase my salary?' },
  { icon: <BarChart2 className="w-4 h-4" />, label: 'Skill Gap', page: 'skill-gap-analysis' },
  { icon: <Map className="w-4 h-4" />, label: 'Career Roadmap', page: 'career-roadmap' },
  { icon: <Briefcase className="w-4 h-4" />, label: 'Job Matches', page: 'job-listings' },
  { icon: <Rocket className="w-4 h-4" />, label: 'Switch Career', msg: 'Help me switch to a new career field' },
  { icon: <Star className="w-4 h-4" />, label: 'ATS Check', msg: 'Check my resume ATS score and fix issues' },
];

const RIGHT_QUICK_NAV = [
  { icon: <Map className="w-3.5 h-3.5" />, label: 'Career Roadmap', page: 'career-roadmap', color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { icon: <BarChart2 className="w-3.5 h-3.5" />, label: 'Skill Gap Analysis', page: 'skill-gap-analysis', color: 'text-purple-600 bg-purple-50 border-purple-100' },
  { icon: <Star className="w-3.5 h-3.5" />, label: 'Skill Assessment', page: 'skill-assessment', color: 'text-orange-600 bg-orange-50 border-orange-100' },
  { icon: <Briefcase className="w-3.5 h-3.5" />, label: 'Job Recommendations', page: 'job-listings', color: 'text-green-600 bg-green-50 border-green-100' },
];

function renderContent(text: string) {
  if (!text) return null;
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      result.push(<ul key={`ul-${result.length}`} className="space-y-1 my-1">{listItems}</ul>);
      listItems = [];
    }
  };

  const parseBold = (line: string) =>
    line.split(/\*\*(.*?)\*\*/g).map((p, j) => j % 2 === 1 ? <strong key={j} className="font-semibold text-gray-900">{p}</strong> : p);

  lines.forEach((line, i) => {
    if (line.startsWith('- ') || line.startsWith('• ')) {
      listItems.push(
        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
          <span>{parseBold(line.replace(/^[-•]\s/, ''))}</span>
        </li>
      );
    } else if (line.startsWith('✓ ') || line.startsWith('○ ')) {
      const done = line.startsWith('✓');
      flushList();
      result.push(
        <div key={i} className="flex items-center gap-2 py-1">
          {done
            ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            : <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />}
          <span className={`text-sm ${done ? 'text-gray-500 line-through' : 'text-gray-800 font-medium'}`}>
            {parseBold(line.replace(/^[✓○]\s/, ''))}
          </span>
        </div>
      );
    } else if (line.trim() === '') {
      flushList();
      result.push(<div key={i} className="h-1" />);
    } else {
      flushList();
      result.push(<p key={i} className="text-sm text-gray-800 leading-relaxed">{parseBold(line)}</p>);
    }
  });
  flushList();
  return result;
}

function buildWelcomeMessage(ctx: Record<string, unknown>, firstName: string): string {
  const name = firstName !== 'there' ? firstName : (ctx.user_name as string || 'there');
  const role = ctx.current_role as string;
  const target = ctx.target_role as string;
  const skills = (ctx.skills as string[]) || [];
  const ats = ctx.ats_score as number | null;
  const missing = (ctx.missing_skills as string[]) || [];
  const lines: string[] = [`Welcome back, ${name}!`];
  if (role) lines.push(`\nI can see you're currently a **${role}**.`);
  if (target) lines.push(`Your target role is **${target}**.`);
  if (skills.length > 0) lines.push(`\nYou have **${skills.length} skills** on your profile: ${skills.slice(0, 4).join(', ')}${skills.length > 4 ? '...' : ''}.`);
  if (ats) lines.push(`Your resume ATS score is **${ats}%**.`);
  if (missing.length > 0) lines.push(`\nYou're missing: **${missing.slice(0, 3).join(', ')}** — key skills for your target role.`);
  if (!role && !target && skills.length === 0) {
    lines.push(`\nI'm your personal AI Career Mentor. I can help you:`);
    lines.push(`\n- Plan your career path\n- Identify skill gaps\n- Improve your resume\n- Prepare for interviews\n- Understand salary expectations`);
    lines.push(`\nWhat would you like to work on today?`);
  } else {
    lines.push(`\nWhat would you like to focus on today?`);
  }
  return lines.join('\n');
}

const SYSTEM_PROMPT = `You are ZyncJobs AI Career Mentor — a personalized, expert career advisor for the ZyncJobs platform. You ALREADY know the candidate's profile (skills, role, ATS score, goals). Give specific, data-driven advice using ONLY ZyncJobs features and jobs. NEVER mention other job sites (LinkedIn, Indeed, Glassdoor, Naukri, Monster, etc.). Direct users to ZyncJobs tools: Resume Builder, Skill Gap Analysis, Career Roadmap, Interview Tips, Job Recommendations, and the jobs posted on ZyncJobs. Be direct, encouraging, and mentor-like. Use bullet points. Max 3-4 short paragraphs.`;

function groupSessionsByDate(sessions: Session[]): { label: string; items: Session[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const weekAgo = today - 7 * 86400000;
  const monthAgo = today - 30 * 86400000;
  const groups: Record<string, Session[]> = { Today: [], Yesterday: [], 'Last 7 Days': [], 'Last Month': [], Older: [] };
  sessions.forEach(s => {
    const t = s.createdAt;
    if (t >= today) groups['Today'].push(s);
    else if (t >= yesterday) groups['Yesterday'].push(s);
    else if (t >= weekAgo) groups['Last 7 Days'].push(s);
    else if (t >= monthAgo) groups['Last Month'].push(s);
    else groups['Older'].push(s);
  });
  return Object.entries(groups).filter(([_, v]) => v.length > 0).map(([label, items]) => ({ label, items }));
}

export default function CareerCoachPage({ onNavigate, user, onLogout }: Props) {
  const firstName = user?.name?.split(' ')[0] || 'there';
  const STORAGE_KEY = 'career-coach-sessions-v2';

  const loadSessions = (): Session[] => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  };

  const saveSessions = (s: Session[]) =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));

  const makeSession = (msgs: Message[]): Session => ({
    id: Date.now().toString(),
    title: msgs.find(m => m.role === 'user')?.content.slice(0, 32) || 'New chat',
    messages: msgs,
    pinned: false,
    createdAt: Date.now(),
  });

  const [sessions, setSessions] = useState<Session[]>(() => loadSessions());
  const [activeId, setActiveId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = loadSessions();
    if (saved.length > 0) { return saved[0].messages; }
    return [];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; type: string } | null>(null);
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [userCtx, setUserCtx] = useState<Record<string, unknown>>(() => buildUserContext());
  const chatRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  // track current session id so we can update it in place
  const activeIdRef = useRef<string>(sessions[0]?.id || '');

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    const saved = loadSessions();
    if (saved.length === 0) {
      const welcome: Message[] = [{ role: 'assistant', content: buildWelcomeMessage(userCtx, firstName) }];
      const s = makeSession(welcome);
      setSessions([s]);
      saveSessions([s]);
      setActiveId(s.id);
      activeIdRef.current = s.id;
      setMessages(welcome);
    } else {
      setActiveId(saved[0].id);
      activeIdRef.current = saved[0].id;
    }
  }, []);

  // Persist messages into the active session whenever messages change
  useEffect(() => {
    if (messages.length === 0 || !activeIdRef.current) return;
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === activeIdRef.current);
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        messages,
        title: messages.find(m => m.role === 'user')?.content.slice(0, 32) || updated[idx].title,
      };
      saveSessions(updated);
      return updated;
    });
  }, [messages]);

  const resetChat = () => {
    abortRef.current?.abort();
    window.speechSynthesis?.cancel();
    const welcome: Message[] = [{ role: 'assistant', content: buildWelcomeMessage(userCtx, firstName) }];
    const s = makeSession(welcome);
    setSessions(prev => {
      const updated = [s, ...prev.slice(0, 9)];
      saveSessions(updated);
      return updated;
    });
    setActiveId(s.id);
    activeIdRef.current = s.id;
    setMessages(welcome);
    setInput('');
  };

  const loadSession = (s: Session) => {
    window.speechSynthesis?.cancel();
    setActiveId(s.id);
    activeIdRef.current = s.id;
    setMessages(s.messages);
  };

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, pinned: !s.pinned } : s);
      saveSessions(updated);
      return updated;
    });
  };

  const speakText = (text: string) => {
    if (!speakerEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const plain = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/^[-•]\s/gm, '').trim();
    if (!plain) return;
    const utt = new SpeechSynthesisUtterance(plain);
    utt.rate = 1.05;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const userMsg: Message = { role: 'user', content: trimmed };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setUploadedFile(null);
    setLoading(true);
    const key = cacheKey('career-mentor', trimmed, JSON.stringify(userCtx).slice(0, 100));
    const cached = getCached<string>(key);
    if (cached) {
      setMessages(prev => [...prev, { role: 'assistant', content: cached }]);
      setLoading(false);
      speakText(cached);
      return;
    }
    try {
      let full = '';
      await sendAIMessageStream(updated, SYSTEM_PROMPT, (chunk) => {
        full += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            const u = [...prev];
            u[u.length - 1] = { role: 'assistant', content: full };
            return u;
          }
          return [...prev, { role: 'assistant', content: full }];
        });
      }, abortRef.current.signal, userCtx);
      if (full) { setCached(key, full); speakText(full); }
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      const fallback = getFallback(trimmed, userCtx);
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && !last.content) {
          const u = [...prev];
          u[u.length - 1] = { role: 'assistant', content: fallback };
          return u;
        }
        return [...prev, { role: 'assistant', content: fallback }];
      });
      speakText(fallback);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, userCtx, speakerEnabled]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const isImage = file.type.startsWith('image/');
    const isText = file.type === 'text/plain';
    const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    setUploadedFile({ name: file.name, type: file.type });
    if (isImage) {
      sendMessage(`I've uploaded a screenshot (${file.name}). Please analyze it and give me career guidance based on what you see.`);
      return;
    }
    // Parse resume files — extract text, call AI, update localStorage + right panel
    try {
      let content = '';
      if (isText) {
        content = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve((ev.target?.result as string || '').slice(0, 5000));
          reader.readAsText(file);
        });
      } else if (isPDF) {
        const url = URL.createObjectURL(file);
        try {
          const { readPdf } = await import('../lib/parse-resume-from-pdf/read-pdf');
          const textItems = await readPdf(url);
          content = textItems.map(t => t.text).join('\n').slice(0, 5000);
        } finally { URL.revokeObjectURL(url); }
      } else {
        content = `Resume file: ${file.name}`;
      }
      // Parse with AI
      const parsed = await executeResumeAI({ section: 'resume', action: 'parse', content });
      const result = (parsed.result || parsed) as any;
      // Update localStorage user key
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        if (result.skills) u.skills = result.skills;
        if (result.summary) u.profileSummary = result.summary;
        if (result.personalInfo?.name) u.name = result.personalInfo.name;
        if (result.personalInfo?.email) u.email = result.personalInfo.email;
        if (Array.isArray(result.experience) && result.experience.length > 0) {
          u.jobTitle = result.experience[0].title || u.jobTitle;
        }
        localStorage.setItem('user', JSON.stringify(u));
        setUserCtx(buildUserContext());
      } catch { /* silent */ }
      sendMessage(`I've uploaded my resume (${file.name}) and parsed it. Please review my profile and give me career guidance.`);
    } catch {
      sendMessage(`I've uploaded my resume (${file.name}). Please review it and give me detailed feedback.`);
    }
  };

  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Voice not supported in this browser.'); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + t);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  };

  const skills = (userCtx.skills as string[]) || [];
  const missingSkills = (userCtx.missing_skills as string[]) || [];
  const atsScore = userCtx.ats_score ? Number(userCtx.ats_score) : null;
  const currentRole = userCtx.current_role ? String(userCtx.current_role) : '';
  const targetRole = userCtx.target_role ? String(userCtx.target_role) : '';

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
      {/* ChatGPT-style 3-column layout: each column scrolls independently, input pinned bottom */}
      <div className="h-screen flex flex-col bg-[#fafafa]">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

        <div className="flex flex-1 min-h-0">

          {/* Mobile sidebar toggle — hidden when sidebar is open */}
          {!showLeftSidebar && (
            <button onClick={() => setShowLeftSidebar(true)}
              className="md:hidden fixed top-20 left-3 z-40 w-9 h-9 bg-[#0f0f0f] text-white rounded-xl flex items-center justify-center shadow-lg border border-white/10">
              <MessageSquare className="w-4 h-4" />
            </button>
          )}

          {/* Mobile overlay backdrop */}
          {showLeftSidebar && (
            <div onClick={() => setShowLeftSidebar(false)} className="md:hidden fixed inset-0 z-30 bg-black/40" />
          )}

          {/* LEFT SIDEBAR — ChatGPT-style, hidden on mobile unless toggled */}
          <aside className={`${showLeftSidebar ? 'fixed left-0 top-0 bottom-0 z-40 w-72' : 'hidden'} md:flex md:flex-shrink-0 md:w-[220px] bg-[#0f0f0f] border-r border-white/5 text-white flex-col min-h-0`}>
            <div className="flex-shrink-0 p-3 border-b border-white/5">
              <button onClick={resetChat} className="w-full flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-sm font-medium px-3 py-2.5 rounded-xl transition-all">
                <Plus className="w-4 h-4" /> New Chat
              </button>
            </div>
            {/* Topics + Pinned — fixed (no scroll) */}
            <div className="flex-shrink-0 px-2 pt-3 pb-1 space-y-1">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest px-2 mb-1.5">Topics</p>
                {LEFT_CATEGORIES.map((c, i) => (
                  <button key={i} onClick={() => c.msg ? sendMessage(c.msg) : c.page ? onNavigate?.(c.page) : undefined}
                    className="w-full flex items-center gap-2.5 text-[13px] text-gray-400 hover:text-white hover:bg-white/[0.08] px-2 py-1.5 rounded-lg transition-all text-left">
                    <span className="text-gray-500">{c.icon}</span> {c.label}
                  </button>
                ))}
              </div>
              <div className="border-t border-white/5 mx-2" />
              {sessions.filter(s => s.pinned).length > 0 && (
                <div className="space-y-0.5">
                  {sessions.filter(s => s.pinned).map(s => (
                    <button key={s.id} onClick={() => loadSession(s)}
                      className={`w-full group flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] transition-all text-left mb-0.5 ${s.id === activeId ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white hover:bg-white/[0.08]'}`}>
                      <Star className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                      <span className="truncate flex-1">{s.title}</span>
                      <span onClick={(e) => togglePin(s.id, e)} className="opacity-0 group-hover:opacity-100 text-yellow-400 hover:text-yellow-300 transition-opacity text-[10px] px-1" title="Unpin">✕</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Recent — independently scrollable */}
            <div className="flex-1 min-h-0 flex flex-col px-2 pb-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest px-2 mb-1.5 flex items-center gap-1 flex-shrink-0">
                <Clock className="w-2.5 h-2.5" /> Recent
              </p>
              <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 scrollbar-thin-dark">
                {sessions.filter(s => !s.pinned).length === 0 ? (
                  <p className="text-xs text-gray-600 px-2 py-1">No recent chats</p>
                ) : (
                  groupSessionsByDate(sessions.filter(s => !s.pinned)).map(group => (
                    <div key={group.label}>
                      <p className="text-[11px] text-gray-600 font-medium px-2 py-1 sticky top-0 bg-[#0f0f0f]">{group.label}</p>
                      {group.items.map(s => (
                        <button key={s.id} onClick={() => loadSession(s)}
                          className={`w-full group flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] transition-all text-left mb-0.5 ${s.id === activeId ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white hover:bg-white/[0.08]'}`}>
                          <MessageSquare className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate flex-1">{s.title}</span>
                          <span onClick={(e) => togglePin(s.id, e)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-yellow-400 transition-opacity" title="Pin this chat"><Pin className="w-3 h-3" /></span>
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>

          {/* CENTER PANEL — full-height, proper scrollbar at right edge */}
          <div className="flex-1 flex flex-col min-h-0 bg-white">
            {/* Sticky chat header — full-width background, centered content */}
            <div className="flex-shrink-0 bg-white border-b border-gray-100">
              <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-3">
                <BackButton className="mb-2" />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-sm font-bold text-gray-900 leading-tight truncate">AI Career Coach</h1>
                      <p className="text-[11px] text-gray-400 truncate">Personalized to your profile</p>
                    </div>
                  </div>
                  <button onClick={resetChat} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg transition-all flex-shrink-0">
                    <RefreshCw className="w-3 h-3" /> New Chat
                  </button>
                </div>
                {(currentRole || skills.length > 0) && (
                  <div className="hidden sm:flex flex-wrap gap-1.5 mt-2">
                    {currentRole && <span className="text-[11px] bg-gray-50 border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full font-medium flex items-center gap-1"><Briefcase className="w-3 h-3 text-blue-500" /> {currentRole}</span>}
                    {targetRole && <span className="text-[11px] bg-gray-50 border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full font-medium flex items-center gap-1"><Target className="w-3 h-3 text-violet-500" /> → {targetRole}</span>}
                    {atsScore && <span className="text-[11px] bg-gray-50 border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full font-medium flex items-center gap-1"><BarChart2 className="w-3 h-3 text-green-500" /> ATS {atsScore}%</span>}
                    {skills.length > 0 && <span className="text-[11px] bg-gray-50 border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full font-medium flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" /> {skills.length} skills</span>}
                  </div>
                )}
              </div>
            </div>
            {/* Scrollable messages — full-width container, scrollbar at right edge */}
            <div ref={chatRef} className="flex-1 overflow-y-auto min-h-0 scrollbar-thin bg-[#fafafa]">
              <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-4 space-y-4">
                {messages.length <= 1 && messages[0]?.role === 'assistant' && (
                  <div className="flex flex-col items-center justify-center min-h-[260px] sm:min-h-[360px]">
                    <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-200 mb-4">
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">How can I help you today?</h2>
                    <p className="text-sm text-gray-400 mb-6">Your AI Career Coach — ask anything about your career</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
                      {STARTER_CARDS.map((card, i) => (
                        <button key={i} onClick={() => sendMessage(card.label)}
                          className="flex items-center gap-3 bg-white border border-gray-200 hover:border-violet-300 hover:shadow-md rounded-2xl px-4 py-3 text-left transition-all group">
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center flex-shrink-0 text-white`}>{card.icon}</div>
                          <span className="text-[13px] font-medium text-gray-700 group-hover:text-gray-900 leading-tight">{card.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isInitialWelcome = messages.length <= 1 && i === 0 && msg.role === 'assistant';
                  if (isInitialWelcome) return null;
                  return (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === 'assistant' ? 'bg-gradient-to-br from-violet-500 to-indigo-600' : 'bg-gradient-to-br from-gray-700 to-gray-800'}`}>
                      {msg.role === 'assistant' ? <Sparkles className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className="flex flex-col gap-2 max-w-[720px]">
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed space-y-1.5 ${msg.role === 'assistant' ? 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm' : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm shadow-md'}`}>
                        {renderContent(msg.content)}
                      </div>
                      {msg.role === 'assistant' && i === messages.length - 1 && msg.content && !loading && (
                        <div className="flex flex-wrap gap-1">
                          {FOLLOWUP_ACTIONS.slice(0, 3).map((a, fi) => (
                            <button key={fi} onClick={() => sendMessage(a.msg)}
                              className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-violet-700 bg-white hover:bg-violet-50 border border-gray-200 hover:border-violet-300 px-2.5 py-1 rounded-full transition-all">
                              {a.icon} {a.label}
                            </button>
                          ))}
                          {FOLLOWUP_ACTIONS.slice(0, 2).map((a, fi) => (
                            <button key={fi} onClick={() => sendMessage(a.msg)}
                              className="sm:hidden flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-violet-700 bg-white hover:bg-violet-50 border border-gray-200 hover:border-violet-300 px-2 py-1 rounded-full transition-all">
                              {a.icon} {a.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
                {loading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                      <div className="flex gap-1.5 items-center">
                        {[0, 150, 300].map(d => (<span key={d} className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Fixed input — full-width background, centered content */}
            <div className="flex-shrink-0 bg-white border-t border-gray-100">
              <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-3">
                <div className="bg-white rounded-xl shadow-lg shadow-black/5 border border-gray-200 overflow-hidden">
                  {uploadedFile && (
                    <div className="flex items-center gap-2 px-3 pt-2.5">
                      <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-medium px-2.5 py-1 rounded-full">
                        <Paperclip className="w-3 h-3" /> <span className="max-w-[120px] sm:max-w-[160px] truncate">{uploadedFile.name}</span>
                        <button onClick={() => setUploadedFile(null)} className="ml-1 text-violet-400 hover:text-violet-700">×</button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-end gap-1.5 px-3 py-2.5">
                    <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,image/*" className="hidden" onChange={handleFileUpload} />
                    <button onClick={() => fileInputRef.current?.click()} title="Upload resume or image" className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all flex-shrink-0"><Paperclip className="w-4 h-4" /></button>
                    <button onClick={toggleVoice} title={isListening ? 'Stop listening' : 'Voice input'} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all flex-shrink-0 ${isListening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-gray-400 hover:text-violet-600 hover:bg-violet-50'}`}>{isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}</button>
                    <button onClick={() => { if (isSpeaking) { window.speechSynthesis?.cancel(); setIsSpeaking(false); } setSpeakerEnabled(p => !p); }}
                      title={speakerEnabled ? 'Speaker on — click to mute' : 'Speaker off — click to enable'}
                      className={`flex w-8 h-8 items-center justify-center rounded-lg transition-all flex-shrink-0 ${speakerEnabled ? 'text-violet-600 bg-violet-50' : 'text-gray-400 hover:text-violet-600 hover:bg-violet-50'}`}>
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                      placeholder={isListening ? '🎤 Listening...' : 'Ask anything about your career...'} rows={1}
                      className="flex-1 resize-none outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent py-2 min-h-[40px]"
                      style={{ lineHeight: '1.5', maxHeight: '120px' }}
                      onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px'; }} />
                    <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
                      className="w-9 h-9 bg-violet-600 hover:bg-violet-700 rounded-lg flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0 shadow-sm">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 pb-2.5 flex-wrap border-t border-gray-50 pt-2">
                    {QUICK_ACTIONS.slice(0, 3).map((action, i) => (
                      <button key={i} onClick={() => sendMessage(action.label)}
                        className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full transition-colors">
                        {action.icon} {action.label}
                      </button>
                    ))}
                    {QUICK_ACTIONS.slice(0, 2).map((action, i) => (
                      <button key={i} onClick={() => sendMessage(action.label)}
                        className="sm:hidden flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2 py-1 rounded-full transition-colors">
                        {action.icon} {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR — 340px, no bottom scrollbar */}
          <aside className="hidden lg:flex w-[340px] flex-shrink-0 flex-col bg-white border-l border-gray-100 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin">
            <div className="flex-shrink-0 p-4 border-b border-gray-100">
              <h3 className="text-[13px] font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center"><BarChart2 className="w-3 h-3 text-white" /></div>
                Live Career Insights
              </h3>
            </div>
            <div className="flex-1 p-3 space-y-3">
              <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-4 border border-violet-100">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Resume ATS Score</p>
                  <span className="text-[10px] text-violet-500 font-semibold bg-violet-100 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                    {atsScore ? (atsScore >= 80 ? 'Excellent' : atsScore >= 60 ? 'Good' : 'Needs Work') : 'No data'}
                  </span>
                </div>
                <div className="flex items-end gap-1.5">
                  <span className={`text-3xl font-bold ${atsScore ? 'text-violet-700' : 'text-gray-300'}`}>{atsScore ?? '—'}</span>
                  {atsScore && <span className="text-sm text-gray-400 mb-1">/100</span>}
                </div>
                {atsScore !== null && atsScore !== undefined ? (
                  <div className="mt-2.5 h-2 bg-violet-100 rounded-full overflow-hidden">
                    <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${atsScore}%`, background: atsScore >= 80 ? '#10b981' : atsScore >= 60 ? '#8b5cf6' : '#f59e0b' }} />
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 mt-2">Upload a resume in chat to analyze</p>
                )}
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-2">Career Readiness</p>
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 flex-shrink-0">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="22" fill="none" stroke="#f3f4f6" strokeWidth="5" />
                      {atsScore && <circle cx="28" cy="28" r="22" fill="none" stroke="#8b5cf6" strokeWidth="5" strokeDasharray={`${2 * Math.PI * 22}`} strokeDashoffset={`${2 * Math.PI * 22 * (1 - Math.min(atsScore, 100) / 100)}`} strokeLinecap="round" />}
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center text-[13px] font-bold ${atsScore ? 'text-violet-700' : 'text-gray-300'}`}>{atsScore ? `${Math.round(atsScore * 0.9)}%` : '—'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{targetRole || 'No target role'}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">{currentRole || 'Complete your profile'}</p>
                    {skills.length > 0 && <p className="text-[11px] text-emerald-600 mt-1 font-medium">{skills.length} skills on profile</p>}
                  </div>
                </div>
              </div>
              {skills.length > 0 ? (
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-2">Your Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {skills.slice(0, 8).map((s, i) => (<span key={i} className="text-[10px] bg-white text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium truncate max-w-full">{s}</span>))}
                    {skills.length > 8 && <span className="text-[11px] text-blue-400 flex-shrink-0">+{skills.length - 8} more</span>}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-2">Your Skills</p>
                  <p className="text-[11px] text-gray-400">Upload a resume to extract skills</p>
                </div>
              )}
              {missingSkills.length > 0 && (
                <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-2">Skill Gaps</p>
                  <div className="flex flex-wrap gap-1">{missingSkills.slice(0, 6).map((s, i) => (<span key={i} className="text-[10px] bg-white text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-medium truncate max-w-full">{s}</span>))}</div>
                </div>
              )}
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide px-0.5">Navigate</p>
                {RIGHT_QUICK_NAV.map((item, i) => (
                  <button key={i} onClick={() => onNavigate?.(item.page)} className={`w-full flex items-center gap-2 text-[12px] font-medium px-3 py-2 rounded-xl border transition-all hover:shadow-sm ${item.color}`}>
                    {item.icon} {item.label} <ChevronRight className="w-3 h-3 ml-auto opacity-60 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </aside>

        </div>


      </div>
    </RoleGuard>
  );
}

function getFallback(q: string, ctx: Record<string, unknown>): string {
  const t = q.toLowerCase();
  const role = ctx.current_role as string || 'your role';
  const target = ctx.target_role as string || 'your target role';
  const skills = (ctx.skills as string[]) || [];
  const missing = (ctx.missing_skills as string[]) || [];
  if (t.includes('salary') || t.includes('pay') || t.includes('lpa'))
    return `Based on your profile as a **${role}**:\n\n• Check salary insights on ZyncJobs for ${role} roles\n• Your current skills (${skills.slice(0, 3).join(', ')}) are in demand on ZyncJobs\n• To increase salary, focus on: AWS, Docker, System Design\n• Build 2-3 production projects to justify a higher package\n\nBrowse jobs on ZyncJobs to see real salary ranges.`;
  if (t.includes('skill') || t.includes('learn') || t.includes('missing')) {
    const gaps = missing.length > 0 ? missing.slice(0, 4).join(', ') : 'Docker, AWS, System Design';
    return `Based on your profile targeting **${target}**:\n\n• Missing skills: **${gaps}**\n• You already have: ${skills.slice(0, 3).join(', ')}\n• Priority: Learn the top 2-3 missing skills first\n• Use ZyncJobs Skill Gap Analysis for a detailed breakdown and learning resources\n\nCheck ZyncJobs for ${target} roles to see skill requirements.`;
  }
  if (t.includes('resume') || t.includes('cv') || t.includes('ats')) {
    const ats = ctx.ats_score as number;
    return `${ats ? `Your ATS score is **${ats}%**.` : 'Resume tips for you:'}\n\n• Add quantified achievements: "Reduced load time by 40%"\n• Include keywords from job descriptions\n• Use action verbs: Built, Led, Designed, Optimized\n• Keep it to 1 page if under 5 years experience\n\nUse Resume Builder to optimize your resume for ZyncJobs applications.`;
  }
  if (t.includes('interview'))
    return `Interview prep for **${target}**:\n\n• Research the company — products, culture, recent news\n• Use STAR method for behavioral questions\n• Prepare 3-5 stories from your experience with ${skills.slice(0, 2).join(' and ')}\n• Practice system design if targeting senior roles\n\nUse ZyncJobs Interview Tips for role-specific practice questions.`;
  if (t.includes('career') || t.includes('path') || t.includes('roadmap'))
    return `Career path from **${role}** to **${target}**:\n\n• Build 3 production projects showcasing your target skills\n• Get 1-2 relevant certifications\n• Contribute to open source or write technical blogs\n• Apply to jobs on ZyncJobs with tailored resumes\n\nUse ZyncJobs Career Roadmap for a step-by-step plan.`;
  return `I'm your personal career mentor on ZyncJobs. Based on your profile (${role} → ${target}), I can help with:\n\n• Career planning and roadmaps\n• Skill gap analysis\n• Resume and ATS optimization\n• Interview preparation\n• Salary negotiation\n\nWhat specific area would you like to focus on?`;
}
