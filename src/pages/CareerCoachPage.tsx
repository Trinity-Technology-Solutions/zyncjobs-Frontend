import React, { useState, useRef, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import RoleGuard from '../components/RoleGuard';
import {
  User, RefreshCw, Zap, TrendingUp,
  Target, BookOpen, Briefcase, Award, ChevronRight,
  Plus, MessageSquare, BarChart2, Map, Star, Paperclip, Mic, MicOff,
  Navigation, FileText, DollarSign, Volume2, Pin, Clock, Sparkles,
  GraduationCap, Rocket, CheckCircle2, Circle, ArrowRight, Image as ImageIcon,
} from 'lucide-react';
import BackButton from '../components/BackButton';
import { getCached, setCached, cacheKey } from '../services/aiCache';
import { sendAIMessageStream, buildUserContext } from '../services/aiChatService';

interface Props {
  onNavigate?: (page: string, data?: any) => void;
  user?: { name: string; type: 'candidate' | 'employer' | 'admin' } | null;
  onLogout?: () => void;
}

interface MessageAttachment {
  name: string;
  type: string;
  size?: number;
  previewUrl?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachment?: MessageAttachment;
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
  pinned: boolean;
  createdAt: number;
}

interface UploadedFile {
  file: File;
  name: string;
  type: string;
  size: number;
  previewUrl?: string;
}

function createThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve('');
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxDim = 400;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      } else {
        resolve('');
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('');
    };
    img.src = url;
  });
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileTypeLabel(filename: string, mimeType: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf' || mimeType?.includes('pdf')) return 'PDF Document';
  if (ext === 'docx' || ext === 'doc' || mimeType?.includes('word')) return 'Word Document';
  if (ext === 'txt' || mimeType?.includes('text')) return 'Text File';
  if (mimeType?.startsWith('image/')) return 'Image File';
  return ext ? `${ext.toUpperCase()} File` : 'Document';
}

function extractSkills(text: string): string[] {
  const sectionPattern = /(?:technical skills?|skills?|core competencies?|key skills?|technologies|tech stack)[:\s]*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,}\n|\n\n[A-Z]|$)/i;
  const skillSection = text.match(sectionPattern)?.[1] || '';
  const skills: string[] = [];
  skillSection.split('\n').forEach(line => {
    const afterColon = line.includes(':') ? line.split(':').slice(1).join(':') : line;
    afterColon.split(/[,|•]/).map(s => s.replace(/^[•\-*\s]+/, '').trim())
      .filter(s => s.length > 1 && s.length < 40 && !/^(and|the|with|for|in|of|to|a|an)$/i.test(s))
      .forEach(s => skills.push(s));
  });
  return [...new Set(skills)].filter(Boolean).slice(0, 20);
}

function extractName(text: string): string {
  const firstLine = text.split('\n').find(l => l.trim().length > 2 && l.trim().length < 50);
  return firstLine?.trim() || '';
}

function extractEmail(text: string): string {
  return text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || '';
}

function extractSummary(text: string): string {
  return text.match(/(?:professional summary|summary|objective)[:\s]*([\s\S]{50,500}?)(?:\n(?:WORK|EDUCATION|SKILLS|INTERNSHIP|PUBLICATION|PROJECT|COMPETITION|CERTIFICATION|SOFT|TOOLS)|$)/i)?.[1]?.trim().replace(/\s+/g, ' ') || '';
}

function extractExperience(text: string): Array<{ title: string; company: string }> {
  const expSection = text.match(/work experience[\s\S]*?(?=\n(?:INTERNSHIP|EDUCATION|SKILLS|PUBLICATION|PROJECT|COMPETITION|CERTIFICATION|SOFT|TOOLS)|$)/i)?.[0] || '';
  const results: Array<{ title: string; company: string }> = [];
  const matches = [...expSection.matchAll(/^([A-Z][A-Za-z\s]+?)\n([A-Za-z][\w\s,&]+?)(?:\s*\|)/gm)];
  matches.slice(0, 3).forEach(m => results.push({ title: m[1].trim(), company: m[2].trim() }));
  if (results.length === 0) {
    const fallback = [...expSection.matchAll(/(?:^|\n)(Backend Developer|Frontend Developer|Full Stack|Software Engineer|Developer|Engineer|Intern|Lead|Manager)[^\n]*/gi)];
    fallback.slice(0, 2).forEach(m => results.push({ title: m[1].trim(), company: '' }));
  }
  return results;
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

const SYSTEM_PROMPT = `You are ZyncJobs AI Career Mentor — a personalized expert career advisor. The candidate's full profile (name, current role, target role, skills, ATS score, missing skills, experience) is included in every message. You MUST use this profile data to give specific, personalized answers. NEVER respond with generic feature descriptions. NEVER say "use Skill Gap Analysis" or "visit Career Roadmap" as the answer — instead, PERFORM the analysis yourself and give the actual answer. For skill gaps: list the candidate's current skills vs missing skills. For career paths: generate actual step-by-step roadmap with timelines. For salary: give specific advice based on their role and skills. For resume: analyze their actual ATS score and give specific improvements. NEVER mention other job sites. Be direct, data-driven, and mentor-like. Use bullet points. Max 3-4 paragraphs.`;

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

  const saveSessions = (s: Session[]) => {
    try {
      const cleaned = s.map(session => ({
        ...session,
        messages: session.messages.map(m => {
          if (m.attachment?.previewUrl && m.attachment.previewUrl.length > 50000) {
            const { previewUrl, ...restAttachment } = m.attachment;
            return { ...m, attachment: restAttachment };
          }
          return m;
        })
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    } catch (e) {
      console.warn('Failed to save career coach sessions to localStorage:', e);
    }
  };

  const makeSession = (msgs: Message[]): Session => {
    const userMsg = msgs.find(m => m.role === 'user');
    const title = userMsg?.content?.slice(0, 32) || userMsg?.attachment?.name || 'New chat';
    return {
      id: Date.now().toString(),
      title,
      messages: msgs,
      pinned: false,
      createdAt: Date.now(),
    };
  };

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
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [userCtx, setUserCtx] = useState<Record<string, unknown>>(() => buildUserContext());
  const chatRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  // track current session id so we can update it in place
  const activeIdRef = useRef<string>(sessions[0]?.id || '');
  const pendingCtxRef = useRef<Record<string, unknown> | null>(null);

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
      const userMsg = messages.find(m => m.role === 'user');
      const title = userMsg?.content?.slice(0, 32) || userMsg?.attachment?.name || updated[idx].title;
      updated[idx] = {
        ...updated[idx],
        messages,
        title,
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
    setUploadedFile(null);
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

  const sendMessage = useCallback(async (text: string, attachmentOverride?: MessageAttachment, ctxOverride?: Record<string, unknown>) => {
    const attachment = attachmentOverride !== undefined ? attachmentOverride : (uploadedFile ? {
      name: uploadedFile.name,
      type: uploadedFile.type,
      size: uploadedFile.size,
      previewUrl: uploadedFile.previewUrl,
    } : undefined);

    const trimmed = text.trim();
    if ((!trimmed && !attachment) || loading) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const userMsg: Message = {
      role: 'user',
      content: trimmed,
      attachment: attachment,
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setUploadedFile(null);
    setLoading(true);

    const activeCtx = ctxOverride || pendingCtxRef.current || userCtx;
    pendingCtxRef.current = null;

    let promptForLLM = trimmed;
    if (!promptForLLM && attachment) {
      const isImg = attachment.type.startsWith('image/');
      promptForLLM = isImg
        ? `[Uploaded image: ${attachment.name}] Please review this image and provide career advice and insights based on it.`
        : `[Uploaded document: ${attachment.name}] Please review my uploaded resume/document and provide detailed career guidance and ATS analysis.`;
    } else if (promptForLLM && attachment) {
      promptForLLM = `${trimmed}\n\n[Attached File: ${attachment.name}]`;
    }

    const key = cacheKey('career-mentor', promptForLLM, JSON.stringify(activeCtx).slice(0, 100));
    const cached = getCached<string>(key);
    if (cached) {
      setMessages(prev => [...prev, { role: 'assistant', content: cached }]);
      setLoading(false);
      speakText(cached);
      return;
    }

    try {
      let full = '';
      const apiMessages = updated.map((m, idx) => {
        if (idx === updated.length - 1 && m.role === 'user') {
          return { role: m.role, content: promptForLLM };
        }
        return { role: m.role, content: m.content || '[Attached File]' };
      });

      await sendAIMessageStream(apiMessages, SYSTEM_PROMPT, (chunk) => {
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
      }, abortRef.current.signal, activeCtx);

      if (full) { setCached(key, full); speakText(full); }
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      const fallback = getFallback(promptForLLM || 'resume', activeCtx);
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
  }, [messages, loading, userCtx, speakerEnabled, uploadedFile]);

  const handleSend = () => {
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const isImage = file.type.startsWith('image/');
    const isText = file.type === 'text/plain';
    const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isDocx = file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    let previewUrl: string | undefined;
    if (isImage) {
      try {
        previewUrl = await createThumbnail(file);
      } catch {
        previewUrl = undefined;
      }
    }

    setUploadedFile({
      file,
      name: file.name,
      type: file.type || (isPDF ? 'application/pdf' : isDocx ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'file'),
      size: file.size,
      previewUrl,
    });

    let freshCtx: Record<string, unknown> | undefined;
    try {
      let content = '';
      if (isImage) {
        try {
          const Tesseract = await import('tesseract.js');
          const imageUrl = previewUrl || URL.createObjectURL(file);
          const { data } = await Tesseract.recognize(imageUrl, 'eng');
          content = data.text.slice(0, 5000);
          if (!previewUrl) URL.revokeObjectURL(imageUrl);
        } catch {
          content = `Uploaded image: ${file.name}`;
        }
      } else if (isText) {
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
      } else if (isDocx) {
        const arrayBuffer = await file.arrayBuffer();
        const mammoth = await import('mammoth');
        const { value } = await mammoth.extractRawText({ arrayBuffer });
        content = value.slice(0, 5000);
      } else {
        content = `Uploaded document: ${file.name}`;
      }

      const skills = extractSkills(content);
      const name = extractName(content);
      const email = extractEmail(content);
      const summary = extractSummary(content);
      const experience = extractExperience(content);
      const hasContact = !!email;
      const hasSummary = !!summary;
      const hasExperience = experience.length > 0;
      const hasEducation = /education|b\.tech|bachelor|master|degree|cgpa/i.test(content);
      const hasPublications = /publication|conference|springer|journal/i.test(content);
      const hasCertifications = /certification|certified|udemy|coursera|nptel|ibm/i.test(content);

      let score = 30;
      if (skills.length >= 8) score += 20;
      else if (skills.length >= 4) score += 12;
      else if (skills.length > 0) score += 6;
      if (hasContact) score += 10;
      if (hasSummary) score += 12;
      if (hasExperience) score += 12;
      if (hasEducation) score += 8;
      if (hasPublications) score += 5;
      if (hasCertifications) score += 3;
      const atsScore = Math.min(score, 100);

      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        u.skills = skills.length > 0 ? skills : u.skills;
        u.profileSummary = summary || u.profileSummary;
        u.name = name || u.name;
        u.email = email || u.email;
        u.jobTitle = experience.length > 0 ? experience[0].title : u.jobTitle;
        if (skills.length > 0) delete u.missingSkills;
        u.atsScore = atsScore;
        localStorage.setItem('user', JSON.stringify(u));
        freshCtx = buildUserContext();
        setUserCtx(freshCtx);
      } catch { /* silent */ }

      const resumeSummary = [
        name ? `Name: ${name}` : '',
        experience.length > 0 ? `Current Role: ${experience[0].title}${experience[0].company ? ` at ${experience[0].company}` : ''}` : '',
        skills.length > 0 ? `Extracted Skills: ${skills.join(', ')}` : '',
        `ATS Score: ${atsScore}%`,
        `\n--- FULL DOCUMENT TEXT ---\n${content.slice(0, 3000)}`,
      ].filter(Boolean).join('\n');

      const ctxWithResume = { ...(freshCtx || userCtx), resume_text: resumeSummary, current_role: experience[0]?.title || (freshCtx || userCtx).current_role };
      pendingCtxRef.current = ctxWithResume;
    } catch {
      pendingCtxRef.current = freshCtx || userCtx;
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
                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed space-y-2 ${msg.role === 'assistant' ? 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm' : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm shadow-md'}`}>
                          {msg.attachment && (
                            <div className="mb-2">
                              {msg.attachment.previewUrl || msg.attachment.type?.startsWith('image/') ? (
                                <div className="space-y-1.5 my-1">
                                  {msg.attachment.previewUrl && (
                                    <div className="inline-block max-w-sm rounded-xl overflow-hidden border border-white/25 shadow-sm bg-black/25 p-1">
                                      <img
                                        src={msg.attachment.previewUrl}
                                        alt={msg.attachment.name}
                                        className="max-h-64 max-w-full w-auto h-auto object-contain rounded-lg mx-auto block"
                                      />
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1.5 text-[11px] text-white/80 font-medium px-0.5">
                                    <Paperclip className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate max-w-[200px]">{msg.attachment.name}</span>
                                    {msg.attachment.size ? <span className="opacity-75">• {formatFileSize(msg.attachment.size)}</span> : null}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 bg-white/15 backdrop-blur-md border border-white/20 p-2.5 rounded-xl text-white">
                                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 shadow-xs">
                                    <FileText className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-[260px]">
                                      {msg.attachment.name}
                                    </p>
                                    <p className="text-[10px] text-white/70">
                                      {getFileTypeLabel(msg.attachment.name, msg.attachment.type)}
                                      {msg.attachment.size ? ` • ${formatFileSize(msg.attachment.size)}` : ''}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {msg.content ? renderContent(msg.content) : null}
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
                    <div className="px-3 pt-2.5 pb-1 flex items-center">
                      {uploadedFile.previewUrl || uploadedFile.type?.startsWith('image/') ? (
                        <div className="relative group flex items-center gap-3 bg-violet-50/90 border border-violet-200 p-2 pr-3 rounded-xl shadow-xs">
                          {uploadedFile.previewUrl ? (
                            <div className="w-12 h-12 rounded-lg bg-white border border-violet-200/80 flex items-center justify-center overflow-hidden p-0.5 flex-shrink-0 shadow-xs">
                              <img
                                src={uploadedFile.previewUrl}
                                alt={uploadedFile.name}
                                className="max-w-full max-h-full object-contain mx-auto my-auto rounded-md"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-violet-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                              <Paperclip className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-gray-800 truncate max-w-[180px] sm:max-w-[260px]">
                              {uploadedFile.name}
                            </p>
                            <p className="text-[10px] text-violet-600 font-medium">
                              Image • {formatFileSize(uploadedFile.size)}
                            </p>
                          </div>
                          <button
                            onClick={() => setUploadedFile(null)}
                            title="Remove attachment"
                            className="w-5 h-5 rounded-full bg-violet-200/70 hover:bg-red-500 hover:text-white text-violet-700 flex items-center justify-center text-xs font-bold transition-all ml-1"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="relative group flex items-center gap-3 bg-violet-50/90 border border-violet-200 p-2 pr-3 rounded-xl shadow-xs">
                          <div className="w-11 h-11 rounded-lg bg-violet-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-gray-800 truncate max-w-[180px] sm:max-w-[260px]">
                              {uploadedFile.name}
                            </p>
                            <p className="text-[10px] text-violet-600 font-medium">
                              {getFileTypeLabel(uploadedFile.name, uploadedFile.type)} • {formatFileSize(uploadedFile.size)}
                            </p>
                          </div>
                          <button
                            onClick={() => setUploadedFile(null)}
                            title="Remove attachment"
                            className="w-5 h-5 rounded-full bg-violet-200/70 hover:bg-red-500 hover:text-white text-violet-700 flex items-center justify-center text-xs font-bold transition-all ml-1"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-end gap-1.5 px-3 py-2.5">
                    <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp,image/*" className="hidden" onChange={handleFileUpload} />
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
                    <button onClick={handleSend} disabled={(!input.trim() && !uploadedFile) || loading}
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
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Career Readiness</p>
                  {(() => { const done = [!!currentRole,!!targetRole,skills.length>0,!!atsScore].filter(Boolean).length; const pct = Math.round(done/4*100); return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pct===100?'text-emerald-600 bg-emerald-50':pct>=50?'text-violet-600 bg-violet-50':'text-amber-600 bg-amber-50'}`}>{pct}% complete</span>; })()}
                </div>
                <div className="space-y-1.5">
                  {[
                    {label:'Current role set',done:!!currentRole,detail:currentRole},
                    {label:'Target role set',done:!!targetRole,detail:targetRole},
                    {label:'Skills on profile',done:skills.length>0,detail:skills.length>0?`${skills.length} skills`:null},
                    {label:'Resume analyzed',done:!!atsScore,detail:atsScore?`ATS ${atsScore}%`:null},
                  ].map((item,i)=>(
                    <div key={i} className="flex items-center gap-2">
                      {item.done?<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0"/>:<Circle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0"/>}
                      <span className={`text-[12px] flex-1 truncate ${item.done?'text-gray-700':'text-gray-400'}`}>{item.label}</span>
                      {item.detail&&<span className="text-[10px] text-gray-400 truncate max-w-[80px]">{item.detail}</span>}
                    </div>
                  ))}
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
  const role = ctx.current_role as string || 'your current role';
  const target = ctx.target_role as string || 'your target role';
  const skills = (ctx.skills as string[]) || [];
  const missing = (ctx.missing_skills as string[]) || [];
  const ats = ctx.ats_score as number | null;
  const exp = ctx.experience_years as string || '';

  if (t.includes('salary') || t.includes('pay') || t.includes('lpa') || t.includes('compensation')) {
    const salaryTips = skills.length > 0
      ? `Your skills in **${skills.slice(0, 3).join(', ')}** are in demand — leverage them in negotiations.`
      : 'Build in-demand skills to strengthen your salary negotiation position.';
    return `**Salary Growth Strategy for ${role}:**\n\n• ${salaryTips}\n• Get certified in your top 1-2 skills to justify a 20-30% raise\n• Switch companies every 2-3 years — external hires typically earn 15-20% more than internal promotions\n• Target companies hiring for **${target}** roles — they pay a premium for your exact skill set\n• Quantify your impact in interviews: "Reduced deployment time by 40%", "Increased revenue by ₹X"\n• Negotiate total compensation: base + bonus + equity + benefits`;
  }

  if (t.includes('skill') || t.includes('learn') || t.includes('missing') || t.includes('gap')) {
    const hasSkills = skills.length > 0;
    const hasMissing = missing.length > 0;
    let reply = `**Skill Gap Analysis — ${role} → ${target}:**\n\n`;
    if (hasSkills) reply += `✓ Skills you already have: **${skills.slice(0, 5).join(', ')}**\n\n`;
    if (hasMissing) {
      reply += `○ Skills to acquire for **${target}**:\n${missing.slice(0, 5).map(s => `- ${s}`).join('\n')}\n\n`;
      reply += `**Priority order:** Start with ${missing[0]}${missing[1] ? ` then ${missing[1]}` : ''} — these appear most in ${target} job descriptions.\n\n`;
    } else {
      reply += `○ Common skills needed for **${target}**: System Design, Cloud (AWS/GCP), Docker, CI/CD, TypeScript\n\n`;
    }
    reply += `**Learning path:** Dedicate 1-2 hours/day. Most skills take 4-8 weeks to reach job-ready level.`;
    return reply;
  }

  if (t.includes('resume') || t.includes('cv') || t.includes('ats')) {
    const scoreMsg = ats ? `Your current ATS score is **${ats}%** — ` : '';
    const improvement = ats && ats < 60 ? 'needs significant improvement' : ats && ats < 80 ? 'good but can be optimized' : 'well optimized';
    return `**Resume Analysis${ats ? ` (ATS: ${ats}%)` : ''}:**\n\n${scoreMsg}${ats ? improvement + '.\n\n' : ''}• Add quantified achievements: "Reduced load time by 40%", "Led team of 5 engineers"\n• Include keywords from **${target}** job descriptions: ${skills.slice(0, 3).join(', ')}${missing.length > 0 ? ', ' + missing.slice(0, 2).join(', ') : ''}\n• Use strong action verbs: Built, Architected, Led, Optimized, Delivered\n• Keep to 1 page if under 5 years experience${exp ? ` (you have ${exp} years)` : ''}\n• Add a skills section with your top 8-10 technical skills prominently`;
  }

  if (t.includes('interview') || t.includes('prepare') || t.includes('preparation')) {
    const skillContext = skills.length > 0 ? skills.slice(0, 2).join(' and ') : 'your core skills';
    return `**Interview Preparation for ${target}:**\n\n• **Technical round:** Expect questions on ${skillContext}${missing.length > 0 ? ` and possibly ${missing[0]}` : ''}\n• **System design:** Practice designing scalable systems — common for ${target} roles\n• **Behavioral (STAR method):** Prepare 3-5 stories from your ${role} experience\n  - Situation → Task → Action → Result\n• **Questions to ask them:** "What does success look like in 90 days?", "What's the tech stack?"\n• **Salary negotiation:** Research market rates for ${target} in ${ctx.location || 'your city'} before the final round`;
  }

  if (t.includes('career') || t.includes('path') || t.includes('roadmap') || t.includes('plan') || t.includes('switch')) {
    const step1Skills = missing.slice(0, 2).join(', ') || 'advanced skills for your target role';
    return `**Career Roadmap: ${role} → ${target}**\n\n**Phase 1: Skill Building (0-3 months)**\n• You already have: ${skills.slice(0, 3).join(', ') || 'foundational skills'}\n• Add: ${step1Skills}\n• Complete 1 certification relevant to ${target}\n\n**Phase 2: Portfolio & Visibility (3-6 months)**\n• Build 2-3 projects showcasing ${target} skills\n• Contribute to open source or write 2-3 technical articles\n• Update your resume and LinkedIn with new skills\n\n**Phase 3: Active Job Search (6-9 months)**\n• Apply to ${target} roles — target 5-10 applications/week\n• Prepare for technical + system design interviews\n• Negotiate salary based on your new skill set\n\n💡 Estimated timeline: 6-9 months with consistent effort.`;
  }

  if (t.includes('job') || t.includes('match') || t.includes('recommend') || t.includes('find')) {
    return `**Job Matching for your profile:**\n\n• Your skills (${skills.slice(0, 4).join(', ') || 'on your profile'}) match **${target}** roles\n• Focus on companies that list these exact skills in their JDs\n• Apply to roles where you match 70%+ of requirements — don't wait for 100%\n• Tailor your resume for each application: mirror the job description keywords\n• Best time to apply: Tuesday-Thursday mornings get the most recruiter attention\n\nSearch for **${target}** roles on ZyncJobs filtered by your location${ctx.location ? ` (${ctx.location})` : ''}.`;
  }

  return `**Career Guidance for ${role} → ${target}:**\n\n${skills.length > 0 ? `Your current skills: ${skills.slice(0, 4).join(', ')}\n\n` : ''}I can help you with:\n• Skill gap analysis — what to learn next\n• Career roadmap — step-by-step plan with timelines\n• Resume optimization — improve your ATS score${ats ? ` (currently ${ats}%)` : ''}\n• Interview preparation — role-specific questions\n• Salary negotiation — how to get paid what you're worth\n\nWhat would you like to focus on?`;
}
