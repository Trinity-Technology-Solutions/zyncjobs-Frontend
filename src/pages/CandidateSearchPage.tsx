
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  Search, MapPin, Star, Users, Code, Mail, Briefcase, Zap,
  ChevronDown, MessageCircle, Copy, Target, CheckCircle, Bot,
  Building2, Clock, X, DollarSign,
} from 'lucide-react';

import { API_ENDPOINTS } from '../config/env';
import { tokenStorage } from '../utils/tokenStorage';
import { apiFetch } from '../api/apiFetch';
import { searchAccuracy } from '../utils/searchAccuracy';
import { skillsMatch, normalizeSkill } from '../utils/matchScore';

import DirectMessage from '../components/DirectMessage';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CandidateProfileView from './CandidateProfileView';
import AutocompleteCombobox from '../components/AutocompleteCombobox';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface Candidate {
  _id: string;
  name?: string;
  fullName?: string;
  title?: string;
  jobTitle?: string;
  location?: string;
  skills?: string[];
  experience?: string | number;
  experienceYears?: number;
  expectedCTC?: string | number;
  salary?: string | number;
  availability?: string;
  noticePeriod?: string;
  openToRelocation?: boolean;
  email?: string;
  profilePhoto?: string;
  profileSummary?: string;
  education?: string;
  languages?: string;
  employment?: unknown;
  workHistory?: { company?: string; employer?: string }[];
  certifications?: unknown;
  resumeUrl?: string;
  // computed after scoring
  aiScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  fitLabel?: 'Excellent' | 'Good' | 'Fair' | 'Low';
  _bestJob?: Job | null;
}

interface Job {
  _id: string;
  jobTitle?: string;
  title?: string;
  company?: string;
  location?: string;
  skills?: string[];
  postedBy?: string;
  employerEmail?: string;
  createdBy?: string;
  userId?: string;
}

interface Filters {
  search: string;
  booleanQuery: string;
  skills: string[];
  locations: string[];
  designations: string[];
  expMin: number;
  expMax: number;
  ctcMin: number;
  ctcMax: number;
  noticePeriods: string[];
  relocationOnly: boolean;
  exCompanies: string[];
}

interface CandidateSearchPageProps {
  onNavigate: (page: string, params?: unknown) => void;
  user?: { name: string; type: 'candidate' | 'employer' | 'admin' | 'super_admin'; email?: string; id?: string; fullName?: string; companyName?: string; company?: string; companyLogo?: string };
  onLogout?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const NOTICE_OPTIONS = ['Immediate', '15 Days', '1 Month', '2 Months', '3 Months'] as const;

const POPULAR_SKILLS = ['JavaScript', 'Python', 'React', 'Java', 'Node.js', 'Angular', 'SQL', 'HTML', 'CSS', 'AWS'];
const POPULAR_LOCATIONS = ['Remote', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Gurgaon', 'Noida', 'Kolkata'];

const FIT_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  Excellent: { bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Good: { bg: 'bg-blue-50 border border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  Fair: { bg: 'bg-amber-50 border border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  Low: { bg: 'bg-red-50 border border-red-200', text: 'text-red-600', dot: 'bg-red-500' },
};

// ─────────────────────────────────────────────────────────────
// Pure helpers  (no React, fully testable)
// ─────────────────────────────────────────────────────────────

/** Parse any experience value into a plain number (years). */
function toExpYears(raw: string | number | undefined): number {
  if (raw == null || raw === '') return 0;
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

/**
 * Parse any CTC/salary value into LPA.
 * Returns -1 when the value is unreadable (so we can skip the filter).
 * Heuristic: if the raw number is ≥ 100 000 we assume it's stored in rupees
 * (e.g. 1 200 000 → 12 LPA). Between 1 000–99 999 we treat it as thousands
 * (e.g. 1 200 → 12 LPA). Below 1 000 we treat it as LPA already.
 */
function toCTCinLPA(raw: string | number | undefined): number {
  if (raw == null || raw === '') return -1;
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^0-9.]/g, ''));
  if (isNaN(n)) return -1;
  if (n >= 100_000) return n / 100_000;
  if (n >= 1_000) return n / 100;
  return n;
}

/** Build a single searchable text blob from a candidate record. */
function candidateBlob(c: Candidate): string {
  return [
    c.fullName, c.name, c.jobTitle, c.title,
    c.profileSummary, c.location,
    ...(c.skills ?? []),
    ...(c.workHistory ?? []).map(w => w.company ?? w.employer ?? ''),
    typeof c.employment === 'object'
      ? JSON.stringify(c.employment)
      : String(c.employment ?? ''),
  ].filter(Boolean).join(' ').toLowerCase();
}

// ── Boolean query parser ───────────────────────────────────────

type BoolNode =
  | { type: 'TERM'; value: string }
  | { type: 'AND'; left: BoolNode; right: BoolNode }
  | { type: 'OR'; left: BoolNode; right: BoolNode }
  | { type: 'NOT'; operand: BoolNode };

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < input.length) {
    if (' \t'.includes(input[i])) { i++; continue; }
    if (input[i] === '(') { tokens.push('('); i++; continue; }
    if (input[i] === ')') { tokens.push(')'); i++; continue; }
    if (input[i] === '"') {
      let j = i + 1;
      while (j < input.length && input[j] !== '"') j++;
      tokens.push(input.slice(i + 1, j));
      i = j + 1;
      continue;
    }
    let j = i;
    while (j < input.length && !' \t()"'.includes(input[j])) j++;
    tokens.push(input.slice(i, j));
    i = j;
  }
  return tokens.filter(Boolean);
}

function parseBooleanQuery(raw: string): BoolNode | null {
  const tokens = tokenize(raw);
  if (!tokens.length) return null;
  let pos = 0;

  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  function parseExpr(): BoolNode { return parseOr(); }
  function parseOr(): BoolNode {
    let left = parseAnd();
    while (peek() === 'OR') { consume(); left = { type: 'OR', left, right: parseAnd() }; }
    return left;
  }
  function parseAnd(): BoolNode {
    let left = parseNot();
    while (peek() === 'AND') { consume(); left = { type: 'AND', left, right: parseNot() }; }
    return left;
  }
  function parseNot(): BoolNode {
    if (peek() === 'NOT') { consume(); return { type: 'NOT', operand: parsePrimary() }; }
    return parsePrimary();
  }
  function parsePrimary(): BoolNode {
    if (peek() === '(') {
      consume();
      const node = parseExpr();
      if (peek() === ')') consume();
      return node;
    }
    return { type: 'TERM', value: (consume() ?? '').toLowerCase() };
  }

  try { return parseExpr(); } catch { return null; }
}

function evalBoolNode(node: BoolNode, text: string): boolean {
  switch (node.type) {
    case 'TERM': return text.includes(node.value);
    case 'AND': return evalBoolNode(node.left, text) && evalBoolNode(node.right, text);
    case 'OR': return evalBoolNode(node.left, text) || evalBoolNode(node.right, text);
    case 'NOT': return !evalBoolNode(node.operand, text);
  }
}

function matchesBoolean(query: string, blob: string): boolean {
  const node = parseBooleanQuery(query);
  return node ? evalBoolNode(node, blob) : true;
}

// ── AI scoring ────────────────────────────────────────────────

interface ScoreResult {
  aiScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  fitLabel: Candidate['fitLabel'];
  bestJob: Job | null;
}

/** Deduplicate skills by normalized key, preserving first-seen original casing and ignoring empties. */
function dedupeSkills(list: any): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  (Array.isArray(list) ? list : []).forEach(s => {
    const key = normalizeSkill(String(s || ''));
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(String(s).trim());
  });
  return out;
}

function scoreAgainstJob(candSkills: string[], job: Job): { score: number; matched: string[]; missing: string[] } {
  // Normalize both sides (trim, lowercase, de-dupe, drop empty values) before comparing.
  const jobSkills = dedupeSkills(job.skills);
  const candSkillSet = dedupeSkills(candSkills);
  const matched: string[] = [];
  const missing: string[] = [];

  for (const js of jobSkills) {
    // Shared boundary-safe matcher (no substring false positives like "java"→"javascript")
    const hit = candSkillSet.some(cs => skillsMatch(cs, js));
    (hit ? matched : missing).push(js);
  }

  const skillPct = jobSkills.length > 0 ? (matched.length / jobSkills.length) * 100 : 0;
  return { score: Math.round(skillPct), matched, missing };
}

function fitLabelFor(score: number): Candidate['fitLabel'] {
  return score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : score >= 30 ? 'Fair' : 'Low';
}

function computeAIScore(candidate: Candidate, selectedJob: Job | null, allJobs: Job[]): ScoreResult {
  const candSkills = (candidate.skills ?? []).map(s => s.toLowerCase().trim()).filter(Boolean);

  // Score against a specific job
  if (selectedJob) {
    const { score, matched, missing } = scoreAgainstJob(candSkills, selectedJob);
    return {
      aiScore: score,
      matchedSkills: matched,
      missingSkills: missing,
      fitLabel: fitLabelFor(score),
      bestJob: selectedJob,
    };
  }

  // No job selected — find the best match across all jobs
  if (allJobs.length > 0) {
    let best = { score: 0, matched: [] as string[], missing: [] as string[], job: allJobs[0] };
    for (const j of allJobs) {
      const { score, matched, missing } = scoreAgainstJob(candSkills, j);
      if (score > best.score) best = { score, matched, missing, job: j };
    }
    return { aiScore: best.score, matchedSkills: best.matched, missingSkills: best.missing, fitLabel: fitLabelFor(best.score), bestJob: best.job };
  }

  // No jobs to match against — no skill overlap to measure
  return { aiScore: 0, matchedSkills: [], missingSkills: [], fitLabel: 'Low', bestJob: null };
}

// ─────────────────────────────────────────────────────────────
// Custom hooks
// ─────────────────────────────────────────────────────────────

/** Debounce any value by `delay` ms. */
function useDebounce<T>(value: T, delay = 150): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function getCandidateDomain(candidate: Candidate): string {
  const title = (candidate.jobTitle || candidate.title || '').toLowerCase();
  const skills = (candidate.skills || []).map(s => String(s || '').toLowerCase().trim());

  if (title.includes('frontend') || title.includes('react') || title.includes('ui') || title.includes('web') || skills.includes('react') || skills.includes('frontend') || skills.includes('vue') || skills.includes('angular') || skills.includes('html') || skills.includes('css')) {
    return 'Frontend Engineering';
  }
  if (title.includes('backend') || title.includes('node') || title.includes('java') || title.includes('python') || title.includes('sql') || skills.includes('node') || skills.includes('backend') || skills.includes('express') || skills.includes('spring boot') || skills.includes('django')) {
    return 'Backend Engineering';
  }
  if (title.includes('full stack') || title.includes('fullstack') || skills.includes('fullstack') || skills.includes('full stack')) {
    return 'Fullstack Engineering';
  }
  if (title.includes('mobile') || title.includes('android') || title.includes('ios') || title.includes('flutter') || skills.includes('android') || skills.includes('ios') || skills.includes('flutter') || skills.includes('react native')) {
    return 'Mobile Engineering';
  }
  if (title.includes('data') || title.includes('ml') || title.includes('ai') || title.includes('machine learning') || title.includes('analyst') || (skills.includes('python') && (skills.includes('sql') || skills.includes('pandas') || skills.includes('numpy')))) {
    return 'Data Science / Analytics';
  }
  if (title.includes('devops') || title.includes('cloud') || title.includes('aws') || title.includes('sysadmin') || skills.includes('aws') || skills.includes('docker') || skills.includes('kubernetes') || skills.includes('jenkins')) {
    return 'DevOps / Cloud';
  }
  if (title.includes('qa') || title.includes('test') || title.includes('quality') || title.includes('automation') || skills.includes('selenium') || skills.includes('cypress') || skills.includes('playwright') || skills.includes('qa')) {
    return 'QA / Testing';
  }
  if (title.includes('product') || title.includes('pm') || title.includes('manager')) {
    return 'Product Management';
  }
  if (title.includes('design') || title.includes('ux') || title.includes('ui/ux') || title.includes('graphic') || skills.includes('figma') || skills.includes('photoshop') || skills.includes('illustrator')) {
    return 'Design';
  }
  if (title.includes('hr') || title.includes('human resource') || title.includes('recruiter') || skills.includes('recruiting') || skills.includes('hr')) {
    return 'HR / Recruiting';
  }
  return 'General';
}

function getTop8DiverseCandidates(candidates: Candidate[]): Candidate[] {
  const groups: Record<string, Candidate[]> = {};
  candidates.forEach(c => {
    const domain = getCandidateDomain(c);
    if (!groups[domain]) groups[domain] = [];
    groups[domain].push(c);
  });

  const selected: Candidate[] = [];
  const domainKeys = Object.keys(groups);

  // Sort domains by the highest AI score of their top candidate
  domainKeys.sort((a, b) => {
    const scoreA = groups[a][0]?.aiScore ?? 0;
    const scoreB = groups[b][0]?.aiScore ?? 0;
    return scoreB - scoreA;
  });

  let index = 0;
  while (selected.length < 8 && selected.length < candidates.length) {
    let addedAny = false;
    for (const domain of domainKeys) {
      if (groups[domain].length > index) {
        selected.push(groups[domain][index]);
        addedAny = true;
        if (selected.length === 8) break;
      }
    }
    if (!addedAny) break;
    index++;
  }
  return selected;
}

/** Fetch employer jobs once. */
function useEmployerJobs(userEmail?: string) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    apiFetch(String(API_ENDPOINTS.JOBS))
      .then(r => r.ok ? r.json() as Promise<unknown> : Promise.resolve([]))
      .then(data => {
        const all: Job[] = Array.isArray(data) ? data as Job[] : ((data as Record<string, unknown>).jobs ?? []) as Job[];
        let use: Job[];
        if (!userEmail) {
          use = all;
        } else {
          const email = userEmail.toLowerCase();
          const mine = all.filter(j =>
            [j.postedBy, j.employerEmail, j.createdBy, j.userId].some(f => f?.toLowerCase() === email)
          );
          use = mine.length > 0 ? mine : all;
        }
        setJobs(use);
        setSelectedJob(prev => prev && use.some(j => j._id === prev._id) ? prev : (use[0] ?? null));
      })
      .catch(() => { });
  }, [userEmail]);

  return { jobs, selectedJob, setSelectedJob };
}

/** Batch-send search-appearance analytics (one call instead of N). */
function useSearchAnalytics() {
  const pendingRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const track = useCallback((candidates: Candidate[], query: string) => {
    if (!query || candidates.length === 0) return;
    candidates.forEach(c => { if (c.email) pendingRef.current.add(c.email); });

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const emails = [...pendingRef.current];
      pendingRef.current.clear();
      if (!emails.length) return;
      try {
        await apiFetch(`${API_ENDPOINTS.BASE_URL}/analytics-tracking/track/search-appearances`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emails, searchQuery: query }),
        });
      } catch { /* non-critical */ }
    }, 2_000);
  }, []);

  return track;
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

interface TagInputProps {
  icon: React.ReactNode;
  tags: string[];
  onRemove: (i: number) => void;
  onAdd: (v: string) => void;
  inputValue: string;
  onInputChange: (v: string) => void;
  suggestions: string[];
  showSuggestions: boolean;
  onShowSuggestions: (v: boolean) => void;
  placeholder: string;
  tagClass: string;
  SuggestionIcon: React.ElementType;
}

const TagInput: React.FC<TagInputProps> = ({
  icon, tags, onRemove, onAdd, inputValue, onInputChange,
  suggestions, showSuggestions, onShowSuggestions,
  placeholder, tagClass, SuggestionIcon,
}) => (
  <div className="relative">
    {icon}
    <div className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 bg-white min-h-[42px] flex flex-wrap items-center gap-1">
      {tags.map((t, i) => (
        <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${tagClass}`}>
          {t}
          <button type="button" onClick={() => onRemove(i)}><X className="w-3 h-3" /></button>
        </span>
      ))}
      <input
        type="text"
        placeholder={tags.length === 0 ? placeholder : `Add more…`}
        value={inputValue}
        onChange={e => onInputChange(e.target.value)}
        onKeyDown={e => {
          if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
            e.preventDefault();
            onAdd(inputValue.trim());
          }
          if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) onRemove(tags.length - 1);
        }}
        onFocus={() => onShowSuggestions(true)}
        onBlur={() => setTimeout(() => onShowSuggestions(false), 150)}
        className="flex-1 min-w-[120px] outline-none text-sm text-gray-900 bg-transparent"
      />
    </div>
    {showSuggestions && suggestions.length > 0 && (
      <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-y-auto max-h-40">
        {suggestions.map((s, i) => (
          <button key={i} type="button"
            onMouseDown={() => { onAdd(s); onShowSuggestions(false); }}
            className="w-full text-left px-4 py-2.5 hover:bg-blue-50 hover:text-blue-700 text-sm text-gray-800 border-b border-gray-100 last:border-0 flex items-center gap-2"
          >
            <SuggestionIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />{s}
          </button>
        ))}
      </div>
    )}
  </div>
);

interface ScoreRingProps { score: number }
const ScoreRing: React.FC<ScoreRingProps> = ({ score }) => {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#3b82f6' : score >= 30 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative w-12 h-12">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
        <circle cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${(score / 100) * 94.2} 94.2`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">{score}%</span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

const CandidateSearchPage: React.FC<CandidateSearchPageProps> = ({ onNavigate, user, onLogout }) => {

  // ── Navigation state ───────────────────────────────────────
  const [viewingCandidateId, setViewingCandidateId] = useState<string | null>(null);
  const [messageCandidate, setMessageCandidate] = useState<Candidate | null>(null);

  // ── Data ───────────────────────────────────────────────────
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    const endpoints = [
      `${API_ENDPOINTS.BASE_URL}/users?role=candidate`,
      `${API_ENDPOINTS.BASE_URL}/profiles`,
      `${API_ENDPOINTS.BASE_URL}/candidates`,
    ];
    for (const url of endpoints) {
      try {
        const res = await apiFetch(url);
        if (res.ok) {
          const data = await res.json();
          const arr: any[] = Array.isArray(data) ? data : data.candidates || data.profiles || data.users || [];
          if (arr.length > 0) {
            const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace('/api', '');
            const mapped: Candidate[] = arr
              .filter((c: any) => !['employer', 'admin', 'super_admin'].includes(c.userType || c.type || c.role || ''))
              .map((c: any) => {
                const rawPhoto = c.profilePhoto || c.profilePicture || c.photo || c.avatar || c.image || '';
                const profilePhoto = rawPhoto
                  ? (rawPhoto.startsWith('http') || rawPhoto.startsWith('data:') ? rawPhoto : `${BASE}${rawPhoto.startsWith('/') ? rawPhoto : '/' + rawPhoto}`)
                  : '';
                const resumeUrl = c.resumeUrl || (c.resume && typeof c.resume === 'object' ? (c.resume.url || c.resume.fileUrl || '') : c.resume) || '';
                const rawSkills = c.skills || c.skillSet || c.keySkills || c.tags || [];
                const skills: string[] = Array.isArray(rawSkills)
                  ? rawSkills.map((s: any) => typeof s === 'object' ? s.name || String(s) : String(s)).filter(Boolean)
                  : typeof rawSkills === 'string' ? rawSkills.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
                return { ...c, _id: c._id || c.id, profilePhoto, resumeUrl, skills };
              });
            setCandidates(mapped);
            break;
          }
        }
      } catch { }
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);
  const { jobs: employerJobs, selectedJob, setSelectedJob } = useEmployerJobs(user?.email);
  const trackSearch = useSearchAnalytics();
  const token = tokenStorage.getAccess() ?? tokenStorage.getAdmin();

  // currentUser from localStorage — read once, stable ref
  const currentUser = useMemo(
    () => JSON.parse(localStorage.getItem('user') ?? '{}') as Record<string, string>,
    []
  );

  // ── Filter state ───────────────────────────────────────────
  const [filters, setFilters] = useState<Filters>({
    search: '', booleanQuery: '',
    skills: [], locations: [], designations: [], exCompanies: [],
    expMin: 0, expMax: 30,
    ctcMin: 0, ctcMax: 100,
    noticePeriods: [], relocationOnly: false,
  });

  const set = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters(prev => ({ ...prev, [key]: value })), []);

  const clearFilters = useCallback(() => setFilters({
    search: '', booleanQuery: '',
    skills: [], locations: [], designations: [], exCompanies: [],
    expMin: 0, expMax: 30, ctcMin: 0, ctcMax: 100,
    noticePeriods: [], relocationOnly: false,
  }), []);

  // ── Debounced text inputs ──────────────────────────────────
  const dSearch = useDebounce(filters.search, 300);
  const dBoolean = useDebounce(filters.booleanQuery, 400);

  // ── JSX-compatible aliases (bridge filters object → bare names) ──
  const booleanQuery = filters.booleanQuery;
  const setBooleanQuery = (v: string) => set('booleanQuery', v);
  const searchTerm = filters.search;
  const setSearchTerm = (v: string) => set('search', v);
  const selectedSkills = filters.skills;
  const setSelectedSkills = (updater: string[] | ((prev: string[]) => string[])) => {
    set('skills', typeof updater === 'function' ? updater(filters.skills) : updater);
  };
  const selectedLocations = filters.locations;
  const setSelectedLocations = (updater: string[] | ((prev: string[]) => string[])) => {
    set('locations', typeof updater === 'function' ? updater(filters.locations) : updater);
  };
  const expRange: [number, number] = [filters.expMin, filters.expMax];
  const setExpRange = ([min, max]: [number, number]) => { set('expMin', min); set('expMax', max); };
  const salaryRange: [number, number] = [filters.ctcMin, filters.ctcMax];
  const setSalaryRange = ([min, max]: [number, number]) => { set('ctcMin', min); set('ctcMax', max); };
  const designations = filters.designations;
  const setDesignations = (updater: string[] | ((prev: string[]) => string[])) => {
    set('designations', typeof updater === 'function' ? updater(filters.designations) : updater);
  };
  const targetCompanies = filters.exCompanies;
  const setTargetCompanies = (updater: string[] | ((prev: string[]) => string[])) => {
    set('exCompanies', typeof updater === 'function' ? updater(filters.exCompanies) : updater);
  };
  const noticePeriod = filters.noticePeriods;
  const setNoticePeriod = (updater: string[] | ((prev: string[]) => string[])) => {
    set('noticePeriods', typeof updater === 'function' ? updater(filters.noticePeriods) : updater);
  };
  const relocationOnly = filters.relocationOnly;
  const setRelocationOnly = (updater: boolean | ((prev: boolean) => boolean)) => {
    set('relocationOnly', typeof updater === 'function' ? updater(filters.relocationOnly) : updater);
  };

  const experienceFilter = '';
  const availabilityFilter = '';
  const setExperienceFilter = (..._args: any[]) => {};
  const setAvailabilityFilter = (..._args: any[]) => {};

  // ── Tag input UI state ─────────────────────────────────────
  const [skillInput, setSkillInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [designationInput, setDesignationInput] = useState('');
  const [companyInput, setCompanyInput] = useState('');

  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>(POPULAR_SKILLS);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>(POPULAR_LOCATIONS);
  const [showSkillSug, setShowSkillSug] = useState(false);
  const [showLocSug, setShowLocSug] = useState(false);

  // ── UI state ───────────────────────────────────────────────
  const [sortBy, setSortBy] = useState<'ai_score' | 'name' | 'skills'>('ai_score');
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [openContactMenu, setOpenContactMenu] = useState<string | null>(null);
  const debouncing = filters.search !== dSearch || filters.booleanQuery !== dBoolean;

  // Close contact menu on outside click
  useEffect(() => {
    if (!openContactMenu) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-contact-menu]')) setOpenContactMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openContactMenu]);

  // Update skill suggestions when input changes
  useEffect(() => {
    if (skillInput.length >= 1) {
      setSkillSuggestions(
        searchAccuracy.getAccurateMatches(skillInput, allSkills.filter(s => !filters.skills.includes(s)), 'skill')
          .slice(0, 12).map((m: { item: string }) => m.item)
      );
    } else {
      setSkillSuggestions(POPULAR_SKILLS.filter(s => !filters.skills.includes(s)));
    }
  }, [skillInput, allSkills, filters.skills]);

  // Update location suggestions when input changes
  useEffect(() => {
    if (locationInput.length >= 1) {
      setLocationSuggestions(
        searchAccuracy.getLocationMatches(locationInput, allLocations.filter(l => !filters.locations.includes(l))).slice(0, 12)
      );
    } else {
      setLocationSuggestions(POPULAR_LOCATIONS.filter(l => !filters.locations.includes(l)));
    }
  }, [locationInput, allLocations, filters.locations]);

  const scoredCandidates = useMemo(() => {
    try {
      const q = dSearch.toLowerCase().trim();
      const loggedInEmail = (currentUser?.email || user?.email || '').toLowerCase();

      const filtered = candidates.filter((c: Candidate) => {
        if (loggedInEmail && c.email && c.email.toLowerCase() === loggedInEmail) return false;

        const blob = candidateBlob(c);
        const skills = (c.skills ?? []).map((s: string) => s.toLowerCase());

        if (q && !blob.includes(q)) return false;
        if (dBoolean.trim() && !matchesBoolean(dBoolean, blob)) return false;

        if (filters.skills.length > 0 &&
          !filters.skills.some(sq => skills.some(s => s.includes(sq.toLowerCase()) || sq.toLowerCase().includes(s))))
          return false;

        if (filters.locations.length > 0 &&
          !filters.locations.some(lq => (c.location ?? '').toLowerCase().includes(lq.toLowerCase())))
          return false;

        if (filters.designations.length > 0) {
          const t = (c.jobTitle ?? c.title ?? '').toLowerCase();
          if (!filters.designations.some(d => t.includes(d.toLowerCase()))) return false;
        }

        const exp = toExpYears(c.experience ?? c.experienceYears);
        if (exp < filters.expMin || exp > filters.expMax) return false;

        const ctc = toCTCinLPA(c.expectedCTC ?? c.salary);
        if (ctc !== -1 && (ctc < filters.ctcMin || ctc > filters.ctcMax)) return false;

        if (filters.noticePeriods.length > 0) {
          const np = (c.noticePeriod ?? c.availability ?? '').toLowerCase();
          if (!filters.noticePeriods.some(n => np.includes(n.toLowerCase()))) return false;
        }

        if (filters.relocationOnly && !c.openToRelocation) return false;

        if (filters.exCompanies.length > 0) {
          const empText = [
            ...(c.workHistory ?? []).map((w) => (w as any).company ?? (w as any).employer ?? ''),
            typeof c.employment === 'object' ? JSON.stringify(c.employment) : String(c.employment ?? ''),
          ].join(' ').toLowerCase();
          if (!filters.exCompanies.some(tc => empText.includes(tc.toLowerCase()))) return false;
        }

        return true;
      });

      const withScores = filtered.map((c: Candidate) => {
        const result = computeAIScore(c, selectedJob, employerJobs);
        return { ...c, ...result, _bestJob: result.bestJob } as Candidate & Required<ScoreResult>;
      });

      const isNoFilterApplied =
        !filters.search.trim() && !filters.booleanQuery.trim() &&
        filters.skills.length === 0 && filters.locations.length === 0 &&
        filters.designations.length === 0 && filters.exCompanies.length === 0 &&
        filters.expMin === 0 && filters.expMax === 30 &&
        filters.ctcMin === 0 && filters.ctcMax === 100 &&
        filters.noticePeriods.length === 0 && !filters.relocationOnly;

      const processed = isNoFilterApplied ? getTop8DiverseCandidates(withScores) : withScores;

      if (sortBy === 'ai_score') return [...processed].sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0));
      if (sortBy === 'skills') return [...processed].sort((a, b) => (b.matchedSkills?.length ?? 0) - (a.matchedSkills?.length ?? 0));
      return [...processed].sort((a, b) =>
        (a.fullName ?? a.name ?? '').localeCompare(b.fullName ?? b.name ?? '')
      );
    } catch {
      return candidates;
    }
  }, [candidates, dSearch, dBoolean, filters, selectedJob, employerJobs, sortBy, currentUser, user]);

  useEffect(() => {
    const loadSkillsAndLocations = async () => {
      try {
        const skillsResponse = await apiFetch(`${API_ENDPOINTS.BASE_URL}/autocomplete/skills`);
        if (skillsResponse.ok) {
          const skillsData = await skillsResponse.json();
          setAllSkills(Array.isArray(skillsData) ? skillsData : skillsData.skills || []);
        }
        const locationsResponse = await apiFetch(`${API_ENDPOINTS.BASE_URL}/autocomplete/locations`);
        if (locationsResponse.ok) {
          const locationsData = await locationsResponse.json();
          setAllLocations(Array.isArray(locationsData) ? locationsData : locationsData.locations || []);
        }
      } catch { }
    };
    loadSkillsAndLocations();
  }, []);

  const getCandidateSkills = (candidate: Candidate) => candidate.skills ?? [];
  const getCandidateName = (c: Candidate) => c.fullName ?? c.name ?? c.email ?? 'Unknown';
  const getCandidateLocation = (c: Candidate) => c.location ?? (c as any).city ?? (c as any).address ?? '';
  const getAvatar = (name: string) => name.charAt(0).toUpperCase();

  const handleViewProfile = useCallback((candidate: Candidate) => {
    const cid = candidate.email || candidate._id || '';
    if (!cid) return;
    if (candidate.email) {
      apiFetch(`${API_ENDPOINTS.BASE_URL}/analytics-tracking/track/profile-view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: candidate._id, email: candidate.email, viewedBy: user?.email ?? 'employer' }),
      }).catch(() => { });
    }
    sessionStorage.setItem('viewCandidateId', cid);
    sessionStorage.setItem('viewCandidateData', JSON.stringify({
      name: candidate.fullName ?? candidate.name ?? '', email: candidate.email ?? '', skills: candidate.skills ?? [], resumeUrl: candidate.resumeUrl ?? '',
    }));
    setViewingCandidateId(cid);
  }, [user?.email]);

  const handleSaveCandidate = useCallback((c: Candidate) => {
    if (!token) {
      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Please login to save candidates' } }));
      return;
    }
    const payload = {
      candidateId: c._id,
      fullName: c.fullName ?? c.name ?? '',
      name: c.fullName ?? c.name ?? '',
      title: c.title ?? c.jobTitle ?? 'Professional',
      location: c.location ?? '',
      experience: c.experience ?? '',
      email: c.email ?? '',
      skills: c.skills ?? [],
      profilePhoto: c.profilePhoto ?? '',
      companyName: currentUser.companyName ?? currentUser.company ?? '',
      companyLogo: currentUser.companyLogo ?? '',
      appliedJobTitle: selectedJob?.jobTitle ?? selectedJob?.title ?? '',
      appliedJobId: selectedJob?._id ?? null,
    };

    fetch(String(API_ENDPOINTS.SAVED_CANDIDATES), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }).then(async res => {
      if (res.status === 409) {
        // Already saved — unsave it
        const list = await apiFetch(String(API_ENDPOINTS.SAVED_CANDIDATES), { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() as Promise<unknown> : Promise.resolve([]))
          .then(data => (Array.isArray(data) ? data : ((data as Record<string, unknown>).savedCandidates ?? [])) as Record<string, unknown>[])
          .catch(() => [] as Record<string, unknown>[]);
        const record = list.find(r => r.candidateId === c._id || r.candidateEmail === c.email);
        if (record) {
          await fetch(`${String(API_ENDPOINTS.SAVED_CANDIDATES)}/${String(record._id ?? record.id)}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
          });
          window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Candidate removed from saved list.' } }));
          window.dispatchEvent(new CustomEvent('candidateSaved'));
        }
        return;
      }
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Candidate saved!' } }));
        window.dispatchEvent(new CustomEvent('candidateSaved', { detail: payload }));
      } else {
        window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Failed to save. Please try again.' } }));
      }
    }).catch(() => {
      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Network error. Please try again.' } }));
    });
  }, [token, selectedJob, currentUser]);

  // ── Derived stats ──────────────────────────────────────────
  const boolSyntaxOk = !filters.booleanQuery || Boolean(parseBooleanQuery(filters.booleanQuery));

  // ── Tag helpers ────────────────────────────────────────────
  const addTag = (key: 'skills' | 'locations' | 'designations' | 'exCompanies', val: string) => {
    if (!val) return;
    setFilters(prev => {
      if (prev[key].includes(val)) return prev;
      return { ...prev, [key]: [...prev[key], val] };
    });
  };
  const removeTag = (key: 'skills' | 'locations' | 'designations' | 'exCompanies', i: number) =>
    setFilters(prev => ({ ...prev, [key]: prev[key].filter((_, idx) => idx !== i) }));

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  if (viewingCandidateId) {
    return (
      <div className="fixed inset-0 z-[9999] overflow-y-auto bg-white">
        <CandidateProfileView
          candidateId={viewingCandidateId}
          onNavigate={onNavigate}
          onBack={() => setViewingCandidateId(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {viewingCandidateId && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-white">
          <CandidateProfileView
            candidateId={viewingCandidateId}
            onNavigate={onNavigate}
            onBack={() => setViewingCandidateId(null)}
          />
        </div>
      )}
      {!viewingCandidateId && (
        <><Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

          {/* Hero Header Section */}
          <div className="relative bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 text-white">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M25 25m-20 0a20 20 0 1 1 40 0a20 20 0 1 1 -40 0'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '50px 50px'
              }}></div>
            </div>

            {/* Floating Elements */}
            <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse hidden sm:block"></div>
            <div className="absolute top-20 right-20 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000 hidden lg:block"></div>
            <div className="absolute bottom-10 left-1/4 w-16 h-16 bg-white/10 rounded-full blur-lg animate-pulse delay-500 hidden md:block"></div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
              <div className="text-center">
                {/* Talent Icons */}
                <div className="flex justify-center items-center mb-4 sm:mb-6">
                  <div className="flex -space-x-2">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                      <Users className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                    </div>
                    <div className="w-10 sm:w-12 h-10 sm:h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                      <Star className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                    </div>
                    <div className="w-10 sm:w-12 h-10 sm:h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                      <Code className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                    </div>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                  <span>Find Top Talent That Hits Different</span>
                  <Target className="w-6 sm:w-8 h-6 sm:h-8" />
                </h1>
                <p className="text-base sm:text-lg text-white/90 mb-4 sm:mb-6 max-w-2xl mx-auto drop-shadow flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                  <span>Browse our pool of verified professionals and find the perfect candidates for your team</span>
                  <Users className="w-4 sm:w-5 h-4 sm:h-5" />
                </p>

                {/* Stats */}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 mb-6 sm:mb-8">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-2">
                      <Target className="w-5 sm:w-6 h-5 sm:h-6" />
                      Quality
                    </div>
                    <div className="text-white/80 text-sm">Talent Pool</div>
                  </div>
                  <div className="w-8 sm:w-px h-px sm:h-8 bg-white/30"></div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 sm:w-6 h-5 sm:h-6" />
                      Verified
                    </div>
                    <div className="text-white/80 text-sm">Profiles</div>
                  </div>
                  <div className="w-8 sm:w-px h-px sm:h-8 bg-white/30"></div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-2">
                      <Bot className="w-5 sm:w-6 h-5 sm:h-6" />
                      AI-Powered
                    </div>
                    <div className="text-white/80 text-sm">Matching</div>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="max-w-4xl mx-auto">
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/30 shadow-lg">
                    <div className="flex flex-col gap-3">
                      {/* Boolean search bar */}
                      <div className="relative">
                        <Bot className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 w-4 h-4 z-10" />
                        <input
                          type="text"
                          value={booleanQuery}
                          onChange={e => setBooleanQuery(e.target.value)}
                          placeholder='Boolean search: ("Backend" OR "Full Stack") AND NOT "Intern"'
                          className="w-full pl-9 pr-16 py-2.5 border border-purple-200 bg-purple-50/50 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400/30 focus:border-purple-300"
                        />
                        {booleanQuery && (
                          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium px-1.5 py-0.5 rounded z-10 ${parseBooleanQuery(booleanQuery) ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                            {parseBooleanQuery(booleanQuery) ? 'valid' : 'syntax'}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          placeholder="Search candidates by name, title, email…"
                          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="relative">
                          <Code className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <div className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg sm:rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent bg-white min-h-[42px] flex flex-wrap items-center gap-1">
                            {selectedSkills.map((skill, index) => (
                              <span key={index} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                                {skill}
                                <button
                                  type="button"
                                  onClick={() => setSelectedSkills((prev: any[]) => prev.filter((_: any, i: any) => i !== index))}
                                  className="hover:bg-blue-200 rounded-full p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                            <input
                              type="text"
                              placeholder={selectedSkills.length === 0 ? "Skills (e.g., Python)" : "Add more skills..."}
                              value={skillInput}
                              onChange={(e) => {
                                setSkillInput(e.target.value);
                                if (e.target.value.length >= 1) {
                                  const filtered = searchAccuracy.getAccurateMatches(
                                    e.target.value,
                                    allSkills.filter(s => !selectedSkills.includes(s)),
                                    'skill'
                                  ).slice(0, 12).map(m => m.item);
                                  setSkillSuggestions(filtered);
                                  setShowSkillSug(true);
                                } else {
                                  const popularSkills = ['JavaScript', 'Python', 'React', 'Java', 'Node.js', 'Angular', 'SQL', 'HTML', 'CSS', 'AWS'].filter(s => !selectedSkills.includes(s));
                                  setSkillSuggestions(popularSkills);
                                  setShowSkillSug(true);
                                }
                              }}
                              onKeyDown={(e) => {
                                if ((e.key === 'Enter' || e.key === ',') && skillInput.trim()) {
                                  e.preventDefault();
                                  const newSkill = skillInput.trim();
                                  if (!selectedSkills.includes(newSkill)) {
                                    setSelectedSkills((prev: any) => [...prev, newSkill]);
                                  }
                                  setSkillInput('');
                                  setShowSkillSug(false);
                                } else if (e.key === 'Backspace' && skillInput === '' && selectedSkills.length > 0) {
                                  setSelectedSkills(prev => prev.slice(0, -1));
                                }
                              }}
                              onFocus={() => {
                                if (skillInput) {
                                  const filtered = searchAccuracy.getAccurateMatches(
                                    skillInput,
                                    allSkills.filter(s => !selectedSkills.includes(s)),
                                    'skill'
                                  ).slice(0, 12).map(m => m.item);
                                  setSkillSuggestions(filtered);
                                } else {
                                  const popularSkills = ['JavaScript', 'Python', 'React', 'Java', 'Node.js', 'Angular', 'SQL', 'HTML', 'CSS', 'AWS'].filter(s => !selectedSkills.includes(s));
                                  setSkillSuggestions(popularSkills);
                                }
                                setShowSkillSug(true);
                              }}
                              onBlur={() => setTimeout(() => setShowSkillSug(false), 150)}
                              className="flex-1 min-w-[120px] outline-none text-sm text-gray-900 bg-transparent"
                            />
                          </div>
                          {showSkillSug && skillSuggestions.length > 0 && (
                            <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-xl overflow-hidden" style={{ maxHeight: '152px' }}>
                              <div className="overflow-y-auto" style={{ maxHeight: '152px' }}>
                                {skillSuggestions.map((skill, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onMouseDown={() => {
                                      if (!selectedSkills.includes(skill)) {
                                        setSelectedSkills((prev: any) => [...prev, skill]);
                                      }
                                      setSkillInput('');
                                      setShowSkillSug(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 hover:text-blue-700 text-sm text-gray-800 font-medium transition-colors border-b border-gray-100 last:border-b-0"
                                  >
                                    <span className="flex items-center gap-2">
                                      <Code className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                      {skill}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <div className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg sm:rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent bg-white min-h-[42px] flex flex-wrap items-center gap-1">
                            {selectedLocations.map((location, index) => (
                              <span key={index} className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                                {location}
                                <button
                                  type="button"
                                  onClick={() => setSelectedLocations((prev: any[]) => prev.filter((_: any, i: any) => i !== index))}
                                  className="hover:bg-green-200 rounded-full p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                            <input
                              type="text"
                              placeholder={selectedLocations.length === 0 ? "Location (e.g., Mumbai)" : "Add more locations..."}
                              value={locationInput}
                              onChange={(e) => {
                                setLocationInput(e.target.value);
                                if (e.target.value.length >= 1) {
                                  const filtered = searchAccuracy.getLocationMatches(
                                    e.target.value,
                                    allLocations.filter(l => !selectedLocations.includes(l))
                                  ).slice(0, 12);
                                  setLocationSuggestions(filtered);
                                  setShowLocSug(true);
                                } else {
                                  const popularLocations = ['Remote', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Gurgaon', 'Noida', 'Kolkata'].filter(l => !selectedLocations.includes(l));
                                  setLocationSuggestions(popularLocations);
                                  setShowLocSug(true);
                                }
                              }}
                              onKeyDown={(e) => {
                                if ((e.key === 'Enter' || e.key === ',') && locationInput.trim()) {
                                  e.preventDefault();
                                  const newLocation = locationInput.trim();
                                  if (!selectedLocations.includes(newLocation)) {
                                    setSelectedLocations((prev: any) => [...prev, newLocation]);
                                  }
                                  setLocationInput('');
                                  setShowLocSug(false);
                                } else if (e.key === 'Backspace' && locationInput === '' && selectedLocations.length > 0) {
                                  setSelectedLocations(prev => prev.slice(0, -1));
                                }
                              }}
                              onFocus={() => {
                                if (locationInput) {
                                  const filtered = searchAccuracy.getLocationMatches(
                                    locationInput,
                                    allLocations.filter(l => !selectedLocations.includes(l))
                                  ).slice(0, 12);
                                  setLocationSuggestions(filtered);
                                } else {
                                  const popularLocations = ['Remote', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Gurgaon', 'Noida', 'Kolkata'].filter(l => !selectedLocations.includes(l));
                                  setLocationSuggestions(popularLocations);
                                }
                                setShowLocSug(true);
                              }}
                              onBlur={() => setTimeout(() => setShowLocSug(false), 150)}
                              className="flex-1 min-w-[120px] outline-none text-sm text-gray-900 bg-transparent"
                            />
                          </div>
                          {showLocSug && locationSuggestions.length > 0 && (
                            <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-xl overflow-hidden" style={{ maxHeight: '152px' }}>
                              <div className="overflow-y-auto" style={{ maxHeight: '152px' }}>
                                {locationSuggestions.map((location, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onMouseDown={() => {
                                      if (!selectedLocations.includes(location)) {
                                        setSelectedLocations((prev: any) => [...prev, location]);
                                      }
                                      setLocationInput('');
                                      setShowLocSug(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 hover:text-blue-700 text-sm text-gray-800 font-medium transition-colors border-b border-gray-100 last:border-b-0"
                                  >
                                    <span className="flex items-center gap-2">
                                      <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                      {location}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Row 3: Experience, Salary, Designation, Companies */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* Experience Range */}
                        <div className="relative">
                          <label className="absolute -top-1.5 left-3 bg-white px-1 text-[10px] font-semibold text-indigo-500 z-10">Exp (yrs)</label>
                          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400">
                            <input
                              type="number" min={0} max={30} placeholder="Min"
                              value={expRange[0] === 0 ? '' : expRange[0]}
                              onChange={e => setExpRange([Math.min(+e.target.value || 0, expRange[1]), expRange[1]])}
                              className="w-1/2 px-2 py-2.5 text-sm text-gray-900 outline-none border-r border-gray-200 text-center"
                            />
                            <input
                              type="number" min={0} max={30} placeholder="Max"
                              value={expRange[1] === 30 ? '' : expRange[1]}
                              onChange={e => setExpRange([expRange[0], Math.max(+e.target.value || 30, expRange[0])])}
                              className="w-1/2 px-2 py-2.5 text-sm text-gray-900 outline-none text-center"
                            />
                          </div>
                        </div>

                        {/* Salary / CTC Range */}
                        <div className="relative">
                          <label className="absolute -top-1.5 left-3 bg-white px-1 text-[10px] font-semibold text-indigo-500 z-10">CTC (LPA)</label>
                          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400">
                            <input
                              type="number" min={0} max={200} placeholder="Min"
                              value={salaryRange[0] === 0 ? '' : salaryRange[0]}
                              onChange={e => setSalaryRange([Math.min(+e.target.value || 0, salaryRange[1]), salaryRange[1]])}
                              className="w-1/2 px-2 py-2.5 text-sm text-gray-900 outline-none border-r border-gray-200 text-center"
                            />
                            <input
                              type="number" min={0} max={200} placeholder="Max"
                              value={salaryRange[1] === 100 ? '' : salaryRange[1]}
                              onChange={e => setSalaryRange([salaryRange[0], Math.max(+e.target.value || 100, salaryRange[0])])}
                              className="w-1/2 px-2 py-2.5 text-sm text-gray-900 outline-none text-center"
                            />
                          </div>
                        </div>

                        {/* Designation */}
                        <div className="relative pt-2">
                          <label className="absolute -top-1.5 left-3 bg-white px-1 text-[10px] font-semibold text-indigo-500 z-10">Designation</label>
                          <input
                            type="text"
                            value={designationInput}
                            onChange={e => setDesignationInput(e.target.value)}
                            onKeyDown={e => {
                              if ((e.key === 'Enter' || e.key === ',') && designationInput.trim()) {
                                e.preventDefault();
                                if (!designations.includes(designationInput.trim())) setDesignations((d: any) => [...d, designationInput.trim()]);
                                setDesignationInput('');
                              }
                            }}
                            placeholder="e.g. Engineer"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                          />
                        </div>

                        {/* Ex-Company */}
                        <div className="relative pt-2">
                          <label className="absolute -top-1.5 left-3 bg-white px-1 text-[10px] font-semibold text-indigo-500 z-10">Ex-Company</label>
                          <input
                            type="text"
                            value={companyInput}
                            onChange={e => setCompanyInput(e.target.value)}
                            onKeyDown={e => {
                              if ((e.key === 'Enter' || e.key === ',') && companyInput.trim()) {
                                e.preventDefault();
                                if (!targetCompanies.includes(companyInput.trim())) setTargetCompanies((c: any) => [...c, companyInput.trim()]);
                                setCompanyInput('');
                              }
                            }}
                            placeholder="e.g. Infosys"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                          />
                        </div>
                      </div>

                      {/* Row 4: Notice Period chips + Relocation toggle */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        {NOTICE_OPTIONS.map(n => (
                          <button
                            key={n}
                            onClick={() => setNoticePeriod((prev: string[]) => prev.includes(n) ? prev.filter((x: string) => x !== n) : [...prev, n])}
                            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${noticePeriod.includes(n) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400'
                              }`}
                          >{n}</button>
                        ))}
                        <button
                          onClick={() => setRelocationOnly((v: any) => !v)}
                          className={`ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${relocationOnly ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                            }`}
                        >
                          <MapPin className="w-3 h-3" /> Open to Relocation
                        </button>
                      </div>

                      {/* Active filter tags */}
                      {(designations.length > 0 || targetCompanies.length > 0) && (
                        <div className="flex flex-wrap gap-1.5">
                          {designations.map((d, i) => (
                            <span key={i} className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">
                              {d}<button onClick={() => setDesignations((ds: any[]) => ds.filter((_x: any, idx: number) => idx !== i))}><X className="w-3 h-3" /></button>
                            </span>
                          ))}
                          {targetCompanies.map((tc, i) => (
                            <span key={i} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                              {tc}<button onClick={() => setTargetCompanies((cs: any[]) => cs.filter((_x: any, idx: number) => idx !== i))}><X className="w-3 h-3" /></button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button onClick={() => fetchCandidates()} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-md">
                          <Search className="w-4 h-4" />
                          <span>Search</span>
                        </button>
                        <button
                          onClick={() => { setDesignations([]); setExpRange([0, 30]); setSalaryRange([0, 100]); setNoticePeriod([]); setRelocationOnly(false); setTargetCompanies([]); setBooleanQuery(''); setSearchTerm(''); setSelectedSkills([]); setSkillInput(''); setSelectedLocations([]); setLocationInput(''); }}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg sm:rounded-xl border border-gray-300 text-gray-600 text-sm hover:border-red-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" /> Clear
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

            <div className="mb-4 sm:mb-6">
              {/* AI Insights Bar */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 text-white">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-300" />
                    <span className="font-semibold text-sm">AI Talent Insights</span>
                  </div>
                  {/* Job Selector */}
                  <div className="relative flex-1 w-full lg:min-w-[200px]">
                    <button
                      onClick={() => setShowJobDropdown(!showJobDropdown)}
                      className="w-full flex items-center justify-between bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Briefcase className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{selectedJob ? selectedJob.jobTitle : 'Select a job to rank candidates'}</span>
                      </span>
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    </button>
                    {showJobDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-52 overflow-y-auto">
                        <button
                          onClick={() => { setSelectedJob(null); setShowJobDropdown(false); }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 border-b"
                        >
                          Profile completeness score (no job)
                        </button>
                        {employerJobs.length === 0 ? (
                          <div className="px-3 py-3 text-sm text-gray-400">No jobs posted yet</div>
                        ) : (
                          employerJobs.map(job => (
                            <button
                              key={job._id}
                              onClick={() => { setSelectedJob(job); setShowJobDropdown(false); }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 border-b last:border-0 ${selectedJob?._id === job._id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
                                }`}
                            >
                              <div className="font-medium truncate">{job.jobTitle}</div>
                              <div className="text-xs text-gray-400 truncate">{job.company} · {job.location}</div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {/* Sort */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto">
                    <span className="text-white/70 text-xs">Sort:</span>
                    <div className="flex flex-wrap gap-2">
                      {(['ai_score', 'skills', 'name'] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => setSortBy(s)}
                          className={`text-xs px-2 sm:px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5 ${sortBy === s ? 'bg-white text-indigo-700' : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                        >
                          {s === 'ai_score' ? (
                            <><Bot className="w-3.5 h-3.5" /> <span className="hidden sm:inline">AI Score</span><span className="sm:hidden">AI</span></>
                          ) : s === 'skills' ? (
                            <><Target className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Skills</span><span className="sm:hidden">Skills</span></>
                          ) : (
                            <><Users className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Name</span><span className="sm:hidden">Name</span></>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Summary */}
                  <div className="text-xs text-white/80 w-full lg:w-auto lg:ml-auto">
                    <span className="block sm:inline">{scoredCandidates.filter((c: Candidate) => (c.aiScore ?? 0) >= 70).length} excellent matches</span>
                    <span className="hidden sm:inline"> · </span>
                    <span className="block sm:inline">{scoredCandidates.filter((c: Candidate) => (c.aiScore ?? 0) >= 50 && (c.aiScore ?? 0) < 70).length} good fits</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200">
                <div className="text-gray-700 font-medium text-base sm:text-lg">
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm sm:text-base text-gray-700">Searching candidates...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                      {(!searchTerm.trim() &&
                        !booleanQuery.trim() &&
                        selectedSkills.length === 0 &&
                        selectedLocations.length === 0 &&
                        !experienceFilter &&
                        !availabilityFilter &&
                        designations.length === 0 &&
                        expRange[0] === 0 && expRange[1] === 30 &&
                        salaryRange[0] === 0 && salaryRange[1] === 100 &&
                        noticePeriod.length === 0 &&
                        !relocationOnly &&
                        targetCompanies.length === 0) ? (
                        <div>
                          <span className="text-indigo-600 font-bold">Top {scoredCandidates.length} Candidates</span>
                          <span className="text-gray-600"> across different domains (Recommended)</span>
                        </div>
                      ) : (
                        <>
                          <div>
                            <span className="text-blue-600 font-bold">{scoredCandidates.length}</span>
                            <span className="text-gray-600"> candidate{scoredCandidates.length !== 1 ? 's' : ''} found</span>
                          </div>
                          {(searchTerm || selectedSkills.length > 0 || selectedLocations.length > 0) && (
                            <span className="text-sm sm:text-base text-gray-500 sm:ml-2">
                              {searchTerm && ` matching "${searchTerm}"`}
                              {selectedSkills.length > 0 && ` with ${selectedSkills.join(", ")} skills`}
                              {selectedLocations.length > 0 && ` in ${selectedLocations.join(", ")}`}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
                <p className="text-gray-500 text-lg">Loading candidates...</p>
              </div>
            ) : scoredCandidates.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 border border-gray-200">
                  <Users className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">No candidates found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {(searchTerm || selectedSkills.length > 0 || selectedLocations.length > 0)
                      ? 'No candidates match your current search criteria. Try adjusting your filters.'
                      : 'No candidates are currently registered.'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedSkills([]);
                        setSkillInput('');
                        setSelectedLocations([]);
                        setLocationInput('');
                        setExperienceFilter('');
                        setAvailabilityFilter('');
                        setBooleanQuery('');
                        setDesignations([]);
                        setExpRange([0, 30]);
                        setSalaryRange([0, 100]);
                        setNoticePeriod([]);
                        setRelocationOnly(false);
                        setTargetCompanies([]);
                      }}
                      className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
                {scoredCandidates.map((candidate: Candidate) => {
                  const score = candidate.aiScore ?? 0;
                  const fitLabel = candidate.fitLabel ?? 'Low';
                  const fitConfig: Record<string, { bg: string; text: string; dot: string }> = {
                    Excellent: { bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
                    Good: { bg: 'bg-blue-50 border border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
                    Fair: { bg: 'bg-amber-50 border border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
                    Low: { bg: 'bg-red-50 border border-red-200', text: 'text-red-600', dot: 'bg-red-500' },
                  };
                  const scoreBarColor = score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-blue-500' : score >= 30 ? 'bg-amber-500' : 'bg-red-400';
                  const fit = fitConfig[fitLabel];
                  return (
                    <div key={candidate._id} className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">
                      {/* Top section */}
                      <div className="p-3 sm:p-4 md:p-5 flex items-start gap-2 sm:gap-3 md:gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0 overflow-hidden shadow">
                          {candidate.profilePhoto ? (
                            <img
                              src={candidate.profilePhoto}
                              alt={getCandidateName(candidate)}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                (target.nextElementSibling as HTMLElement).style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full flex items-center justify-center text-white font-bold text-lg ${candidate.profilePhoto ? 'hidden' : 'flex'}`}
                            style={{ display: candidate.profilePhoto ? 'none' : 'flex' }}
                          >
                            {getAvatar(getCandidateName(candidate))}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight truncate">{getCandidateName(candidate)}</h3>
                              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{candidate.jobTitle || candidate.title || 'Professional'}</p>
                              <p className="text-xs text-gray-400 mt-0.5 sm:mt-1 flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{getCandidateLocation(candidate)}</span>
                              </p>
                            </div>
                            {/* AI Score */}
                            <div className="flex flex-col items-center flex-shrink-0">
                              <div className="relative w-10 h-10 sm:w-12 sm:h-12">
                                <svg className="w-10 h-10 sm:w-12 sm:h-12 -rotate-90" viewBox="0 0 36 36">
                                  <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                                  <circle cx="18" cy="18" r="15" fill="none"
                                    stroke={score >= 75 ? '#10b981' : score >= 50 ? '#3b82f6' : score >= 30 ? '#f59e0b' : '#ef4444'}
                                    strokeWidth="3"
                                    strokeDasharray={`${(score / 100) * 94.2} 94.2`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">{score}%</span>
                              </div>
                              <span className={`mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${fit.bg} ${fit.text} text-xs whitespace-nowrap`}>
                                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${fit.dot}`}></span>
                                {fitLabel}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="mx-3 sm:mx-4 md:mx-5 border-t border-gray-100" />

                      {/* Skills */}
                      <div className="px-3 sm:px-4 md:px-5 py-2 sm:py-3 md:py-3 flex-grow">
                        <div className="flex flex-wrap gap-1 sm:gap-1.5">
                          {getCandidateSkills(candidate).slice(0, 5).map((skill, idx) => {
                            const isMatched = candidate.matchedSkills?.map((s: string) => s.toLowerCase()).includes(skill.toLowerCase());
                            return (
                              <span key={idx} className={`text-xs px-2.5 py-1 rounded-full font-medium ${isMatched ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {isMatched && <span className="mr-0.5">✓</span>}{skill}
                              </span>
                            );
                          })}
                          {getCandidateSkills(candidate).length > 5 && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">+{getCandidateSkills(candidate).length - 5}</span>
                          )}
                        </div>
                      </div>

                      {/* AI Match bar — always show */}
                      {(() => {
                        const matchJob = selectedJob || (candidate as any)._bestJob;
                        if (!matchJob) return null;
                        return (
                          <div className="px-3 sm:px-4 md:px-5 pb-3">
                            <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                <span className="text-xs font-semibold text-gray-600">Match — <span className="text-indigo-600">{matchJob.jobTitle || matchJob.title}</span></span>
                                <span className="text-xs font-bold text-gray-700">{score}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                                <div className={`h-1.5 rounded-full ${scoreBarColor}`} style={{ width: `${score}%` }} />
                              </div>
                              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 text-xs">
                                {(candidate.matchedSkills?.length ?? 0) > 0 && (
                                  <span className="text-emerald-600 font-medium">✓ {candidate.matchedSkills!.length} matched</span>
                                )}
                                {getCandidateSkills(candidate).length > 0 && (candidate.missingSkills?.length ?? 0) > 0 && (
                                  <span className="text-red-500 font-medium">✗ {candidate.missingSkills!.length} missing</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Actions */}
                      <div className="px-3 sm:px-4 md:px-5 pb-5 flex flex-col sm:flex-row gap-2 mt-auto">
                        <button
                          onClick={() => handleViewProfile(candidate)}
                          className="w-full sm:flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                        >
                          View Profile
                        </button>

                        <div className="relative w-full sm:w-auto" data-contact-menu>
                          <button
                            onClick={() => setOpenContactMenu(openContactMenu === candidate._id ? null : candidate._id)}
                            className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-1.5 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                          >
                            <Mail className="w-4 h-4" />
                            Contact
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openContactMenu === candidate._id ? 'rotate-180' : ''}`} />
                          </button>
                          {openContactMenu === candidate._id && (
                            <div className="absolute bottom-full right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 mb-1 w-full sm:w-48 overflow-hidden">
                              <button onClick={() => { setMessageCandidate(candidate); setOpenContactMenu(null); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2 border-b">
                                <MessageCircle className="w-4 h-4 text-gray-400" /> Send Message
                              </button>
                              <button onClick={() => { navigator.clipboard.writeText(candidate.email || ''); window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Email copied!" } })); setOpenContactMenu(null); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2 border-b">
                                <Copy className="w-4 h-4 text-gray-400" /> Copy Email
                              </button>
                              <button onClick={() => {
                                const userData = JSON.parse(localStorage.getItem('user') || '{}');
                                if (!token) { window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Please login to save candidates" } })); setOpenContactMenu(null); return; }
                                const payload = {
                                  candidateId: candidate._id,
                                  fullName: getCandidateName(candidate),
                                  name: getCandidateName(candidate),
                                  title: candidate.title || candidate.jobTitle || 'Professional',
                                  location: getCandidateLocation(candidate),
                                  experience: candidate.experience || '',
                                  email: candidate.email || '',
                                  skills: getCandidateSkills(candidate),
                                  profilePhoto: candidate.profilePhoto || '',
                                  companyName: userData.companyName || userData.company || '',
                                  companyLogo: userData.companyLogo || '',
                                  appliedJobTitle: selectedJob ? (selectedJob.jobTitle || selectedJob.title || '') : '',
                                  appliedJobId: selectedJob ? (selectedJob._id || null) : null,
                                };
                                fetch(`${API_ENDPOINTS.SAVED_CANDIDATES}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) })
                                  .then(async res => {
                                    if (res.status === 409) {
                                      // Already saved — find the record and remove it
                                      const existing = await apiFetch(`${API_ENDPOINTS.SAVED_CANDIDATES}`, { headers: { 'Authorization': `Bearer ${token}` } })
                                        .then(r => r.ok ? r.json() : [])
                                        .then(data => {
                                          const list = Array.isArray(data) ? data : data.savedCandidates || [];
                                          return list.find((c: any) => c.candidateId === candidate._id || c.candidateEmail === candidate.email);
                                        })
                                        .catch(() => null);
                                      if (existing) {
                                        const recordId = existing._id || existing.id;
                                        fetch(`${API_ENDPOINTS.SAVED_CANDIDATES}/${recordId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
                                          .then(r => { if (r.ok) { window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Candidate removed from saved list!" } })); window.dispatchEvent(new CustomEvent('candidateSaved')); } else { window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Could not remove candidate." } })); } })
                                          .catch(() => window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Could not remove candidate." } })));
                                      } else {
                                        window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Candidate is already saved." } }));
                                      }
                                      return;
                                    }
                                    if (res.ok) { window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Candidate saved successfully!" } })); window.dispatchEvent(new CustomEvent('candidateSaved', { detail: payload })); }
                                    else { const t = await res.text(); console.error('Save failed:', t); window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Failed to save candidate. Please try again." } })); }
                                  })
                                  .catch(err => { console.error('Save error:', err); window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Network error. Please try again." } })); });
                                setOpenContactMenu(null);
                              }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2">
                                <Star className="w-4 h-4 text-gray-400" /> Save Candidate
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}


          </div>

          <Footer onNavigate={onNavigate} />
        </>
      )}

      {/* Direct message modal */}
      {messageCandidate && (
        <DirectMessage
          candidateId={messageCandidate._id}
          candidateName={messageCandidate.fullName ?? messageCandidate.name ?? ''}
          candidateEmail={messageCandidate.email ?? ''}
          employerId={currentUser.id ?? ''}
          onClose={() => setMessageCandidate(null)}
        />
      )}
    </div>
  );
};

export default CandidateSearchPage;
