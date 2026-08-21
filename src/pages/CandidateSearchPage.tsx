
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  Search, MapPin, Star, Users, Code, Mail, Briefcase, Zap,
  ChevronDown, ChevronUp, MessageCircle, Copy, Target, CheckCircle, Bot,
  Clock, X, DollarSign, Sparkles, BadgeCheck,
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
  visibilityStatus?: string;
  openToWork?: boolean;
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

/** Coerce a value (bool, number, or string like 'true'/'1') to a boolean, first defined value wins. */
function firstBool(...vals: unknown[]): boolean | undefined {
  for (const v of vals) {
    if (v === true || v === 'true' || v === 1 || v === '1') return true;
    if (v === false || v === 'false' || v === 0 || v === '0') return false;
  }
  return undefined;
}

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
  // job.skills may be undefined/null if the backend omits the field — treat as empty.
  const rawJobSkills: string[] = Array.isArray(job.skills)
    ? job.skills.map((s: any) => (typeof s === 'object' ? s.name || String(s) : String(s)).trim()).filter(Boolean)
    : [];
  const jobSkills = dedupeSkills(rawJobSkills);
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

function computeAIScore(candidate: Candidate, selectedJob: Job | null, allJobs: Job[], filterSkills: string[] = []): ScoreResult {
  const candSkills = (candidate.skills ?? []).map(s => s.toLowerCase().trim()).filter(Boolean);

  // Score against a specific job
  if (selectedJob) {
    const jobHasSkills = Array.isArray(selectedJob.skills) && selectedJob.skills.length > 0;
    if (jobHasSkills) {
      const { score, matched, missing } = scoreAgainstJob(candSkills, selectedJob);
      return { aiScore: score, matchedSkills: matched, missingSkills: missing, fitLabel: fitLabelFor(score), bestJob: selectedJob };
    }
    // Job has no skills in DB — score against the employer's active skill filter instead
    if (filterSkills.length > 0) {
      const fakeJob: Job = { _id: selectedJob._id, jobTitle: selectedJob.jobTitle, title: selectedJob.title, skills: filterSkills };
      const { score, matched, missing } = scoreAgainstJob(candSkills, fakeJob);
      return { aiScore: score, matchedSkills: matched, missingSkills: missing, fitLabel: fitLabelFor(score), bestJob: selectedJob };
    }
    // No job skills and no filter skills — score 0
    return { aiScore: 0, matchedSkills: [], missingSkills: [], fitLabel: 'Low', bestJob: selectedJob };
  }

  // No job selected — find the best match across all jobs with skills, else use filterSkills
  const jobsWithSkills = allJobs.filter(j => Array.isArray(j.skills) && j.skills.length > 0);
  if (jobsWithSkills.length > 0) {
    let best = { score: 0, matched: [] as string[], missing: [] as string[], job: jobsWithSkills[0] };
    for (const j of jobsWithSkills) {
      const { score, matched, missing } = scoreAgainstJob(candSkills, j);
      if (score > best.score) best = { score, matched, missing, job: j };
    }
    return { aiScore: best.score, matchedSkills: best.matched, missingSkills: best.missing, fitLabel: fitLabelFor(best.score), bestJob: best.job };
  }

  // No jobs with skills — use active filter skills if any
  if (filterSkills.length > 0) {
    const fakeJob: Job = { _id: 'filter', skills: filterSkills };
    const { score, matched, missing } = scoreAgainstJob(candSkills, fakeJob);
    return { aiScore: score, matchedSkills: matched, missingSkills: missing, fitLabel: fitLabelFor(score), bestJob: null };
  }

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
    // Fetch with skills field explicitly requested
    apiFetch(`${String(API_ENDPOINTS.JOBS)}?fields=_id,jobTitle,title,company,location,skills,postedBy,employerEmail,createdBy,userId`)
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

interface ScoreRingProps { score: number; size?: number }
const ScoreRing: React.FC<ScoreRingProps> = ({ score, size = 48 }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(t);
  }, []);
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#3b82f6' : score >= 30 ? '#f59e0b' : '#ef4444';
  const C = 2 * Math.PI * 15;
  const offset = C * (1 - Math.min(100, Math.max(0, score)) / 100);
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="-rotate-90" style={{ width: size, height: size }}>
        <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3.5" />
        <circle
          cx="18" cy="18" r="15" fill="none"
          stroke={color} strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={mounted ? offset : C}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.15s' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-gray-800">{score}%</span>
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
                let profilePhoto = '';
                if (rawPhoto) {
                  if (rawPhoto.startsWith('http') || rawPhoto.startsWith('data:')) {
                    profilePhoto = rawPhoto;
                  } else {
                    // Ensure a single leading slash before joining with BASE
                    const path = rawPhoto.startsWith('/') ? rawPhoto : '/' + rawPhoto;
                    profilePhoto = BASE ? `${BASE}${path}` : path;
                  }
                }
                const resumeUrl = c.resumeUrl || (c.resume && typeof c.resume === 'object' ? (c.resume.url || c.resume.fileUrl || '') : c.resume) || '';
                const rawSkills = c.skills || c.skillSet || c.keySkills || c.tags || [];
                const skills: string[] = Array.isArray(rawSkills)
                  ? rawSkills.map((s: any) => typeof s === 'object' ? s.name || String(s) : String(s)).filter(Boolean)
                  : typeof rawSkills === 'string' ? rawSkills.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
                return { ...c, _id: c._id || c.id, profilePhoto, resumeUrl, skills,
                  openToWork: firstBool(c.openToWork, c.isOpenToWork, c.open_to_work),
                  visibilityStatus: c.visibilityStatus ?? c.jobSearchStatus ?? undefined,
                };
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
  const [showBoolean, setShowBoolean] = useState(false);
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
        const result = computeAIScore(c, selectedJob, employerJobs, filters.skills);
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
      openToWork: firstBool(candidate.openToWork),
      visibilityStatus: candidate.visibilityStatus,
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
          onBack={() => { setViewingCandidateId(null); fetchCandidates(); }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FF]">
      {viewingCandidateId && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-white">
          <CandidateProfileView
            candidateId={viewingCandidateId}
            onNavigate={onNavigate}
            onBack={() => { setViewingCandidateId(null); fetchCandidates(); }}
          />
        </div>
      )}
      {!viewingCandidateId && (
        <><Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

          <style>{`
            @keyframes cand-fade-up { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
            .cand-fade-1 { animation: cand-fade-up .6s cubic-bezier(.22,1,.36,1) .05s both; }
            .cand-fade-2 { animation: cand-fade-up .6s cubic-bezier(.22,1,.36,1) .15s both; }
            .cand-fade-3 { animation: cand-fade-up .6s cubic-bezier(.22,1,.36,1) .25s both; }
            .cand-fade-4 { animation: cand-fade-up .7s cubic-bezier(.22,1,.36,1) .35s both; }
            @keyframes cand-orb-a { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-25px) scale(1.08); } }
            @keyframes cand-orb-b { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-25px,30px) scale(1.05); } }
            @keyframes cand-orb-c { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(15px,20px) scale(1.1); } }
            .cand-orb-1 { animation: cand-orb-a 14s ease-in-out infinite; }
            .cand-orb-2 { animation: cand-orb-b 17s ease-in-out infinite; }
            .cand-orb-3 { animation: cand-orb-c 20s ease-in-out infinite; }
            @keyframes cand-grid-pan { from { background-position: 0 0; } to { background-position: 44px 44px; } }
            .cand-grid { background-image: linear-gradient(to right, rgba(59,130,246,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,130,246,.06) 1px, transparent 1px); background-size: 44px 44px; animation: cand-grid-pan 30s linear infinite; }
            @keyframes cand-gradient-x { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
            .cand-gradient { background-size: 200% auto; animation: cand-gradient-x 6s ease infinite; }
            @keyframes cand-matchbar { from { width: 0%; } }
            .cand-matchbar { animation: cand-matchbar 1.1s cubic-bezier(.22,1,.36,1) .2s both; }
            @keyframes cand-shine { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }
            .cand-shine::after { content: ''; position: absolute; top: 0; bottom: 0; width: 40%; background: linear-gradient(105deg, transparent, rgba(255,255,255,.4), transparent); transform: translateX(-100%); animation: cand-shine 3.5s ease-in-out infinite; }
          `}</style>

          {/* Hero Header Section */}
          <div className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 via-white to-white">
            <div className="absolute inset-0 cand-grid" />
            <div className="cand-orb-1 absolute -top-24 -left-24 w-96 h-96 bg-blue-400/25 rounded-full blur-3xl" />
            <div className="cand-orb-2 absolute top-1/4 -right-24 w-[26rem] h-[26rem] bg-violet-400/20 rounded-full blur-3xl" />
            <div className="cand-orb-3 absolute -bottom-24 left-1/3 w-80 h-80 bg-cyan-400/15 rounded-full blur-3xl" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-14 sm:pb-20">
              <div className="text-center max-w-3xl mx-auto">
                <span className="cand-fade-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest shadow-sm mb-6">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  AI-Powered Candidate Sourcing
                </span>
                <h1 className="cand-fade-2 text-3xl sm:text-5xl lg:text-[3.6rem] font-extrabold text-gray-900 leading-[1.08] tracking-[-0.02em] mb-5">
                  Discover Top Talent,{' '}
                  <span className="cand-gradient text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-violet-600 to-orange-500">
                    decoded by AI
                  </span>
                </h1>
                <p className="cand-fade-3 text-base sm:text-lg text-gray-500 leading-relaxed mb-8 max-w-2xl mx-auto">
                  Search a verified pool of professionals by skills, experience, salary and availability — with an AI match score on every profile.
                </p>

                {/* Stats */}
                <div className="cand-fade-3 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-8">
                  <span className="inline-flex items-center gap-2 bg-white/85 backdrop-blur-md border border-gray-200/80 rounded-full pl-2.5 pr-4 py-1.5 text-sm text-gray-700 shadow-sm">
                    <span className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center"><Target className="w-3.5 h-3.5 text-blue-600" /></span>
                    Quality talent pool
                  </span>
                  <span className="inline-flex items-center gap-2 bg-white/85 backdrop-blur-md border border-gray-200/80 rounded-full pl-2.5 pr-4 py-1.5 text-sm text-gray-700 shadow-sm">
                    <span className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /></span>
                    Verified profiles
                  </span>
                  <span className="inline-flex items-center gap-2 bg-white/85 backdrop-blur-md border border-gray-200/80 rounded-full pl-2.5 pr-4 py-1.5 text-sm text-gray-700 shadow-sm">
                    <span className="w-7 h-7 rounded-full bg-violet-50 flex items-center justify-center"><Bot className="w-3.5 h-3.5 text-violet-600" /></span>
                    AI match on every profile
                  </span>
                </div>

                {/* Search Bar */}
                <div className="cand-fade-4 max-w-4xl mx-auto">
                  <div className="bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl shadow-blue-900/10 ring-1 ring-gray-200/80">
                    <div className="flex flex-col gap-3">
                      {/* Boolean search — collapsible */}
                      <button
                        type="button"
                        onClick={() => setShowBoolean(v => !v)}
                        className="self-start inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        Boolean Search
                        {showBoolean ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      {showBoolean && (
                        <div className="relative zync-pop-in">
                          <Bot className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4 z-10" />
                          <AutocompleteCombobox
                            value={booleanQuery}
                            onChange={setBooleanQuery}
                            options={[]}
                            allowCustom
                            placeholder='Boolean search: ("Backend" OR "Full Stack") AND NOT "Intern"'
                            className="pl-8 border-purple-200 bg-purple-50/40"
                          />
                          {booleanQuery && (
                            <span className={`absolute right-10 top-1/2 -translate-y-1/2 text-xs font-medium px-1.5 py-0.5 rounded z-10 ${parseBooleanQuery(booleanQuery) ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                              {parseBooleanQuery(booleanQuery) ? 'valid' : 'syntax'}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                          <AutocompleteCombobox
                            value={searchTerm}
                            onChange={setSearchTerm}
                            options={[]}
                            allowCustom
                            placeholder="Search candidates by name, title, email…"
                            className="pl-11 border-gray-200 bg-gray-50/60"
                          />
                        </div>
                        <button
                          onClick={() => fetchCandidates()}
                          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <Search className="w-4 h-4" />
                          <span>Search</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Skills</label>
                          <div className="relative">
                          <Code className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <div className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-400 bg-gray-50/50 focus-within:bg-white min-h-[42px] flex flex-wrap items-center gap-1.5 transition-all">
                            {selectedSkills.map((skill, index) => (
                              <span key={index} className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">
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
                            <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl shadow-blue-900/10 overflow-hidden zync-pop-in" style={{ maxHeight: '152px' }}>
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
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Location</label>
                          <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <div className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-400 bg-gray-50/50 focus-within:bg-white min-h-[42px] flex flex-wrap items-center gap-1.5 transition-all">
                            {selectedLocations.map((location, index) => (
                              <span key={index} className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium">
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
                            <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl shadow-blue-900/10 overflow-hidden zync-pop-in" style={{ maxHeight: '152px' }}>
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
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Designation</label>
                          <AutocompleteCombobox
                            value={designationInput}
                            onChange={v => {
                              if (v && !designations.includes(v)) setDesignations((d: any) => [...d, v]);
                              setDesignationInput('');
                            }}
                            options={[]}
                            allowCustom
                            placeholder="e.g. Engineer"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Ex-Company</label>
                          <AutocompleteCombobox
                            value={companyInput}
                            onChange={v => {
                              if (v && !targetCompanies.includes(v)) setTargetCompanies((c: any) => [...c, v]);
                              setCompanyInput('');
                            }}
                            options={[]}
                            allowCustom
                            placeholder="e.g. Infosys"
                          />
                        </div>
                      </div>
                      {/* Row 3: Exp, CTC, Notice + Relocation */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {/* Experience Range */}
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Exp (yrs)</label>
                          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-400 bg-gray-50/50 transition-all">
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
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">CTC (LPA)</label>
                          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-400 bg-gray-50/50 transition-all">
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

                        {/* Notice Period + Relocation */}
                        <div className="sm:col-span-2 lg:col-span-1">
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Notice Period</label>
                          <div className="flex flex-wrap items-center gap-1.5 border border-gray-200 rounded-xl bg-gray-50/50 p-2 min-h-[42px] transition-all">
                            <Clock className="w-3.5 h-3.5 text-gray-400 ml-1 flex-shrink-0" />
                            {NOTICE_OPTIONS.map(n => (
                              <button
                                key={n}
                                onClick={() => setNoticePeriod((prev: string[]) => prev.includes(n) ? prev.filter((x: string) => x !== n) : [...prev, n])}
                                className={`text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all ${noticePeriod.includes(n) ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                                  }`}
                              >{n}</button>
                            ))}
                            <button
                              onClick={() => setRelocationOnly((v: any) => !v)}
                              className={`ml-auto flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all ${relocationOnly ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50'
                                }`}
                            >
                              <MapPin className="w-3 h-3" /> Relocation
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Active filter tags */}
                      {(designations.length > 0 || targetCompanies.length > 0) && (
                        <div className="flex flex-wrap gap-1.5">
                          {designations.map((d, i) => (
                            <span key={i} className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">
                              {d}<button onClick={() => setDesignations((ds: any[]) => ds.filter((_x: any, idx: number) => idx !== i))}><X className="w-3 h-3" /></button>
                            </span>
                          ))}
                          {targetCompanies.map((tc, i) => (
                            <span key={i} className="inline-flex items-center gap-1 bg-violet-50 border border-violet-100 text-violet-700 text-xs px-2.5 py-1 rounded-full font-medium">
                              {tc}<button onClick={() => setTargetCompanies((cs: any[]) => cs.filter((_x: any, idx: number) => idx !== i))}><X className="w-3 h-3" /></button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-end">
                        <button
                          onClick={() => { setDesignations([]); setExpRange([0, 30]); setSalaryRange([0, 100]); setNoticePeriod([]); setRelocationOnly(false); setTargetCompanies([]); setBooleanQuery(''); setSearchTerm(''); setSelectedSkills([]); setSkillInput(''); setSelectedLocations([]); setLocationInput(''); }}
                          className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-600 text-sm font-semibold hover:border-red-400 hover:text-red-500 hover:bg-red-50 transition-all"
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
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl px-4 sm:px-5 py-3.5 border border-gray-200/80 shadow-sm flex items-center gap-3">
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5">
                    <div className="flex items-start gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 animate-pulse" />
                      <div className="flex-1 space-y-2.5">
                        <div className="h-4 w-2/3 bg-gray-100 rounded-lg animate-pulse" />
                        <div className="h-3 w-1/2 bg-gray-100 rounded-lg animate-pulse" />
                        <div className="h-3 w-1/3 bg-gray-100 rounded-lg animate-pulse" />
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse" />
                    </div>
                    <div className="mt-5 flex gap-1.5">
                      {[0, 1, 2, 3].map(k => (
                        <div key={k} className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
                      ))}
                    </div>
                    <div className="mt-5 h-16 bg-gray-100 rounded-xl animate-pulse" />
                    <div className="mt-5 flex gap-2.5">
                      <div className="h-10 flex-1 bg-gray-100 rounded-xl animate-pulse" />
                      <div className="h-10 w-28 bg-gray-100 rounded-xl animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : scoredCandidates.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white rounded-3xl p-10 sm:p-12 border border-gray-200/80 shadow-sm max-w-xl mx-auto">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 text-blue-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No candidates found</h3>
                  <p className="text-gray-600 mb-7 max-w-md mx-auto">
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
                      className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white px-7 py-3 rounded-xl font-semibold shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5"
                    >
                      <X className="w-4 h-4" /> Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {scoredCandidates.map((candidate: Candidate, cardIdx: number) => {
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
                  const expYears = toExpYears(candidate.experience ?? candidate.experienceYears);
                  const ctcLpa = toCTCinLPA(candidate.expectedCTC ?? candidate.salary);
                  const noticeP = candidate.noticePeriod ?? candidate.availability ?? '';
                  const isOpenToWork = firstBool(candidate.openToWork);
                  return (
                    <div
                      key={candidate._id}
                      className="zync-pop-in group relative bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-xl hover:shadow-blue-900/10 hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                      style={{ animationDelay: `${Math.min(cardIdx * 70, 420)}ms` }}
                    >
                      {/* Top accent */}
                      <div className={`h-1 flex-shrink-0 bg-gradient-to-r ${score >= 75 ? 'from-emerald-400 to-emerald-500' : score >= 50 ? 'from-blue-500 to-violet-500' : score >= 30 ? 'from-amber-400 to-orange-400' : 'from-gray-300 to-gray-400'}`} />

                      {/* Header */}
                      <div className="p-5 pb-4 flex items-start gap-3.5">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-xl overflow-hidden shadow-lg shadow-blue-600/20 ring-2 ring-white">
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
                              className={`w-full h-full items-center justify-center ${candidate.profilePhoto ? 'hidden' : 'flex'}`}
                              style={{ display: candidate.profilePhoto ? 'none' : 'flex' }}
                            >
                              {getAvatar(getCandidateName(candidate))}
                            </div>
                          </div>
                          {isOpenToWork && (
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white">
                              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping" />
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <h3 className="text-[15px] font-bold text-gray-900 leading-tight truncate">{getCandidateName(candidate)}</h3>
                            <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          </div>
                          <p className="text-[13px] text-gray-500 mt-0.5 truncate">{candidate.jobTitle || candidate.title || 'Professional'}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-gray-500">
                            <span className="inline-flex items-center gap-1 min-w-0">
                              <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{getCandidateLocation(candidate) || 'Location not set'}</span>
                            </span>
                            {expYears > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <Briefcase className="w-3 h-3 text-gray-400" />{expYears} yrs
                              </span>
                            )}
                            {ctcLpa > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <DollarSign className="w-3 h-3 text-gray-400" />{ctcLpa} LPA
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {isOpenToWork && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Open to Work
                              </span>
                            )}
                            {noticeP && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5">
                                <Clock className="w-3 h-3" /> {noticeP}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* AI score */}
                        <div className="flex flex-col items-center flex-shrink-0 gap-1.5">
                          <ScoreRing score={score} size={50} />
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${fit.bg} ${fit.text}`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${fit.dot}`}></span>
                            {fitLabel}
                          </span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="mx-5 border-t border-gray-100" />

                      {/* Skills */}
                      <div className="px-5 py-4 flex-grow">
                        <div className="flex flex-wrap gap-1.5">
                          {getCandidateSkills(candidate).slice(0, 6).map((skill, idx) => {
                            const isMatched = candidate.matchedSkills?.map((s: string) => s.toLowerCase()).includes(skill.toLowerCase());
                            return (
                              <span key={idx} className={`text-[11px] px-2.5 py-1 rounded-full font-medium border transition-colors ${isMatched ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-600 group-hover:bg-gray-100'
                                }`}>
                                {isMatched && <span className="mr-0.5">✓</span>}{skill}
                              </span>
                            );
                          })}
                          {getCandidateSkills(candidate).length > 6 && (
                            <span className="text-[11px] px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-400 font-medium">+{getCandidateSkills(candidate).length - 6} more</span>
                          )}
                        </div>
                      </div>

                      {/* AI Match bar — always show */}
                      {(() => {
                        const matchJob = selectedJob || (candidate as any)._bestJob;
                        if (!matchJob) return null;
                        return (
                          <div className="px-5 pb-4">
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100/60 border border-gray-100 rounded-xl p-3.5">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[11px] font-semibold text-gray-600 truncate flex items-center gap-1.5">
                                  <Zap className="w-3 h-3 text-violet-500 flex-shrink-0" />
                                  AI Match — <span className="text-blue-700 truncate">{matchJob.jobTitle || matchJob.title}</span>
                                </span>
                                <span className="text-[13px] font-extrabold text-gray-800 flex-shrink-0">{score}%</span>
                              </div>
                              <div className="w-full bg-gray-200/80 rounded-full h-1.5 overflow-hidden">
                                <div className={`h-1.5 rounded-full ${scoreBarColor} cand-matchbar`} style={{ width: `${score}%` }} />
                              </div>
                              <div className="mt-2 flex items-center gap-3 text-[11px] font-medium">
                                {(candidate.matchedSkills?.length ?? 0) > 0 && (
                                  <span className="text-emerald-600">✓ {candidate.matchedSkills!.length} matched</span>
                                )}
                                {getCandidateSkills(candidate).length > 0 && (candidate.missingSkills?.length ?? 0) > 0 && (
                                  <span className="text-red-500">✗ {candidate.missingSkills!.length} missing</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Actions */}
                      <div className="px-5 pt-4 pb-5 border-t border-gray-100 flex flex-col sm:flex-row gap-2.5 mt-auto">
                        <button
                          onClick={() => handleViewProfile(candidate)}
                          className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-sm font-semibold py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all hover:shadow-lg hover:-translate-y-0.5"
                        >
                          View Profile
                        </button>

                        <div className="relative w-full sm:w-auto" data-contact-menu>
                          <button
                            onClick={() => setOpenContactMenu(openContactMenu === candidate._id ? null : candidate._id)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                          >
                            <Mail className="w-4 h-4" />
                            Contact
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openContactMenu === candidate._id ? 'rotate-180' : ''}`} />
                          </button>
                          {openContactMenu === candidate._id && (
                            <div className="absolute bottom-full right-0 bg-white border border-gray-200 rounded-xl shadow-2xl shadow-blue-900/10 z-50 mb-1 w-full sm:w-48 overflow-hidden zync-pop-in">
                              <button onClick={() => { setMessageCandidate(candidate); setOpenContactMenu(null); }} className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm flex items-center gap-2 border-b">
                                <MessageCircle className="w-4 h-4 text-gray-400" /> Send Message
                              </button>
                              <button onClick={() => { navigator.clipboard.writeText(candidate.email || ''); window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Email copied!" } })); setOpenContactMenu(null); }} className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm flex items-center gap-2 border-b">
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
                              }} className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm flex items-center gap-2">
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
