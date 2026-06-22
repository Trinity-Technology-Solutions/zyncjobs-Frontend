
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

import DirectMessage from '../components/DirectMessage';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CandidateProfileView from './CandidateProfileView';

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

function scoreAgainstJob(candSkills: string[], job: Job): { score: number; matched: string[]; missing: string[] } {
  const jobSkills: string[] = Array.isArray(job.skills) ? job.skills : [];
  const matched: string[] = [];
  const missing: string[] = [];

  for (const js of jobSkills) {
    const lower = js.toLowerCase().trim();
    if (!lower) continue;
    const hit = candSkills.some(cs => cs.includes(lower) || lower.includes(cs));
    (hit ? matched : missing).push(js);
  }

  const skillPct = jobSkills.length > 0 ? (matched.length / jobSkills.length) * 70 : 0;
  return { score: Math.round(skillPct), matched, missing };
}

function computeAIScore(candidate: Candidate, selectedJob: Job | null, allJobs: Job[]): ScoreResult {
  const candSkills = (candidate.skills ?? []).map(s => s.toLowerCase().trim()).filter(Boolean);

  // Profile completeness bonus (up to 30 pts)
  const profileFields = ['experience', 'location', 'profileSummary', 'education'] as const;
  const completeness = profileFields.filter(f => {
    const v = candidate[f];
    return v && (Array.isArray(v) ? v.length > 0 : String(v).trim().length > 0);
  }).length / profileFields.length * 30;

  // Score against a specific job
  if (selectedJob) {
    const { score, matched, missing } = scoreAgainstJob(candSkills, selectedJob);
    const total = Math.round(score + completeness);
    return {
      aiScore: total,
      matchedSkills: matched,
      missingSkills: missing,
      fitLabel: fitLabelFor(total),
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
    const total = Math.round(best.score + completeness);
    return {
      aiScore: total,
      matchedSkills: best.matched,
      missingSkills: best.missing,
      fitLabel: fitLabelFor(total),
      bestJob: best.job,
    };
  }

  // Absolute fallback: profile completeness only
  const total = Math.round(completeness * (100 / 30)); // rescale to 0-100
  return { aiScore: total, matchedSkills: [], missingSkills: [], fitLabel: fitLabelFor(total), bestJob: null };
}

function fitLabelFor(score: number): Candidate['fitLabel'] {
  if (score >= 75) return 'Excellent';
  if (score >= 50) return 'Good';
  if (score >= 30) return 'Fair';
  return 'Low';
}

// ── Normalise raw API data into a Candidate ───────────────────

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000').replace('/api', '');

function normaliseCandidate(raw: Record<string, unknown>): Candidate {
  // Profile photo
  const rawPhoto = String(raw.profilePhoto ?? raw.photo ?? raw.avatar ?? raw.image ?? '');
  let profilePhoto = '';
  if (rawPhoto) {
    profilePhoto = rawPhoto.startsWith('http') || rawPhoto.startsWith('data:')
      ? rawPhoto
      : `${API_BASE}${rawPhoto.startsWith('/') ? rawPhoto : `/${rawPhoto}`}`;
  }

  // Resume URL
  const resumeRaw = raw.resume as Record<string, string> | string | undefined;
  const resumeUrl = String(
    raw.resumeUrl ??
    (resumeRaw && typeof resumeRaw === 'object'
      ? resumeRaw.url ?? resumeRaw.fileUrl ?? (resumeRaw.filename ? `${API_ENDPOINTS.BASE_URL}/uploads/${resumeRaw.filename}` : '')
      : resumeRaw)
    ?? ''
  );

  // Skills
  const rawSkills = raw.skills ?? raw.skillSet ?? raw.skill_set ?? raw.keySkills ?? raw.tags ?? [];
  let skills: string[] = [];
  if (Array.isArray(rawSkills)) {
    skills = rawSkills.map(s => (typeof s === 'object' && s !== null ? String((s as Record<string, unknown>).name ?? s) : String(s))).filter(Boolean);
  } else if (typeof rawSkills === 'string' && rawSkills.trim()) {
    try { skills = rawSkills.trim().startsWith('[') ? (JSON.parse(rawSkills) as unknown[]).map(String) : rawSkills.split(',').map(s => s.trim()); }
    catch { skills = rawSkills.split(',').map(s => s.trim()); }
  }

  return {
    ...(raw as unknown as Candidate),
    _id: String(raw._id ?? raw.id ?? ''),
    profilePhoto,
    resumeUrl,
    skills: skills.filter(Boolean),
  };
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

/** Fetch all candidates once and cache. */
function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState('');

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const endpoints = [
      `${API_ENDPOINTS.BASE_URL}/users?role=candidate`,
      `${API_ENDPOINTS.BASE_URL}/profiles`,
      `${API_ENDPOINTS.BASE_URL}/candidates`,
    ];

    let raw: Record<string, unknown>[] = [];
    for (const url of endpoints) {
      try {
        const res = await apiFetch(url);
        if (!res.ok) continue;
        const data = await res.json() as unknown;
        const arr = Array.isArray(data) ? data : ((data as Record<string, unknown>).candidates ?? (data as Record<string, unknown>).profiles ?? (data as Record<string, unknown>).users ?? []) as unknown[];
        if ((arr as unknown[]).length > 0) { raw = arr as Record<string, unknown>[]; break; }
      } catch { /* try next endpoint */ }
    }

    const EXCLUDED_ROLES = new Set(['employer', 'admin', 'super_admin']);
    const normalised = raw
      .filter(c => !EXCLUDED_ROLES.has(String(c.userType ?? c.type ?? c.role ?? '')))
      .map(normaliseCandidate);

    setCandidates(normalised);
    setLastRefreshed(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    setLoading(false);
  }, []);

  // Fetch once on mount, then every 60 s
  useEffect(() => { fetch_(); }, [fetch_]);
  useEffect(() => {
    const id = setInterval(fetch_, 60_000);
    return () => clearInterval(id);
  }, [fetch_]);

  return { candidates, loading, lastRefreshed, refetch: fetch_ };
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
  const { candidates, loading, refetch } = useCandidates();
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

  // ── Load autocomplete lists ────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [sr, lr] = await Promise.all([
          apiFetch(`${API_ENDPOINTS.BASE_URL}/autocomplete/skills`),
          apiFetch(`${API_ENDPOINTS.BASE_URL}/autocomplete/locations`),
        ]);
        if (sr.ok) { const d = await sr.json() as unknown; setAllSkills(Array.isArray(d) ? d as string[] : ((d as Record<string, unknown>).skills ?? []) as string[]); }
        if (lr.ok) { const d = await lr.json() as unknown; setAllLocations(Array.isArray(d) ? d as string[] : ((d as Record<string, unknown>).locations ?? []) as string[]); }
      } catch { /* autocomplete is non-critical */ }
    })();
  }, []);

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

  // ── Filtered + scored + sorted candidates ──────────────────
  const scoredCandidates = useMemo<(Candidate & Required<ScoreResult>)[]>(() => {
    const q = dSearch.toLowerCase().trim();

    const filtered = candidates.filter(c => {
      const blob = candidateBlob(c);
      const skills = (c.skills ?? []).map(s => s.toLowerCase());

      // Text search
      if (q && !blob.includes(q)) return false;

      // Boolean search
      if (dBoolean.trim() && !matchesBoolean(dBoolean, blob)) return false;

      // Skills multi-select (candidate must have at least one selected skill)
      if (filters.skills.length > 0 &&
        !filters.skills.some(sq => skills.some(s => s.includes(sq.toLowerCase()) || sq.toLowerCase().includes(s))))
        return false;

      // Location multi-select
      if (filters.locations.length > 0 &&
        !filters.locations.some(lq => (c.location ?? '').toLowerCase().includes(lq.toLowerCase())))
        return false;

      // Designation
      if (filters.designations.length > 0) {
        const t = (c.jobTitle ?? c.title ?? '').toLowerCase();
        if (!filters.designations.some(d => t.includes(d.toLowerCase()))) return false;
      }

      // Experience range
      const exp = c.experienceYears ?? toExpYears(c.experience);
      if (exp < filters.expMin || exp > filters.expMax) return false;

      // CTC range (skip candidates with unreadable CTC only if a non-default range is set)
      if (filters.ctcMin > 0 || filters.ctcMax < 100) {
        const ctc = toCTCinLPA(c.expectedCTC ?? c.salary);
        if (ctc === -1 || ctc < filters.ctcMin || ctc > filters.ctcMax) return false;
      }

      // Notice period
      if (filters.noticePeriods.length > 0) {
        const avail = (c.noticePeriod ?? c.availability ?? '').toLowerCase();
        if (!filters.noticePeriods.some(n => avail.includes(n.toLowerCase()))) return false;
      }

      // Relocation
      if (filters.relocationOnly && !c.openToRelocation) return false;

      // Ex-companies
      if (filters.exCompanies.length > 0) {
        const empText = [
          ...(c.workHistory ?? []).map(w => w.company ?? w.employer ?? ''),
          typeof c.employment === 'object' ? JSON.stringify(c.employment) : String(c.employment ?? ''),
        ].join(' ').toLowerCase();
        if (!filters.exCompanies.some(tc => empText.includes(tc.toLowerCase()))) return false;
      }

      return true;
    });

    // Score every filtered candidate
    const withScores = filtered.map(c => {
      const result = computeAIScore(c, selectedJob, employerJobs);
      return { ...c, ...result } as Candidate & Required<ScoreResult>;
    });

    // Sort
    if (sortBy === 'ai_score') return [...withScores].sort((a, b) => b.aiScore - a.aiScore);
    if (sortBy === 'skills') return [...withScores].sort((a, b) => b.matchedSkills.length - a.matchedSkills.length);
    return [...withScores].sort((a, b) =>
      (a.fullName ?? a.name ?? '').localeCompare(b.fullName ?? b.name ?? '')
    );
  }, [candidates, dSearch, dBoolean, filters, selectedJob, employerJobs, sortBy]);

  // Batch analytics whenever scored results change
  useEffect(() => {
    const q = [filters.search, ...filters.skills, ...filters.locations].filter(Boolean).join(' ');
    trackSearch(scoredCandidates, q);
  }, [scoredCandidates, trackSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ────────────────────────────────────────────────
  const getName = (c: Candidate) => c.fullName ?? c.name ?? 'Anonymous';
  const getLocation = (c: Candidate) => c.location ?? 'Location not specified';
  const getAvatar = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase() || 'NA';

  const handleViewProfile = useCallback((c: Candidate) => {
    const id = c.email ?? c._id;
    if (!id) return;
    if (c.email) {
      apiFetch(`${API_ENDPOINTS.BASE_URL}/analytics-tracking/track/profile-view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: c._id, email: c.email, viewedBy: user?.email ?? 'employer' }),
      }).catch(() => { });
    }
    sessionStorage.setItem('viewCandidateId', id);
    sessionStorage.setItem('viewCandidateData', JSON.stringify({
      name: getName(c), email: c.email ?? '', skills: c.skills ?? [], resumeUrl: c.resumeUrl ?? '',
    }));
    setViewingCandidateId(id);
  }, [user?.email]);

  const handleSaveCandidate = useCallback((c: Candidate) => {
    if (!token) {
      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Please login to save candidates' } }));
      return;
    }
    const payload = {
      candidateId: c._id,
      fullName: getName(c),
      name: getName(c),
      title: c.title ?? c.jobTitle ?? 'Professional',
      location: getLocation(c),
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
  const excellentCount = scoredCandidates.filter(c => c.aiScore >= 70).length;
  const goodCount = scoredCandidates.filter(c => c.aiScore >= 50 && c.aiScore < 70).length;
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
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      {/* ── Hero / search panel ─────────────────────────── */}
      <div className="relative bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 text-white">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='25' cy='25' r='20' fill='%23fff' fill-opacity='.4'/%3E%3C/svg%3E")`, backgroundSize: '50px 50px' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            {/* Title */}
            <div className="flex justify-center mb-4">
              <div className="flex -space-x-2">
                {[Users, Star, Code].map((Icon, i) => (
                  <div key={i} className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                ))}
              </div>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold mb-3 drop-shadow-lg">Find Top Talent That Hits Different</h1>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">Browse verified professionals and find perfect candidates for your team.</p>

            {/* Stats row */}
            <div className="flex justify-center gap-8 mb-8 text-sm">
              {[
                { icon: Target, label: 'Quality Talent Pool' },
                { icon: CheckCircle, label: 'Verified Profiles' },
                { icon: Bot, label: 'AI-Powered Matching' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  <span className="font-medium hidden sm:inline">{label}</span>
                </div>
              ))}
            </div>

            {/* ── Search box ─── */}
            <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-sm rounded-2xl p-4 border border-white/30 shadow-lg">
              <div className="flex flex-col gap-3">

                {/* Boolean search */}
                <div className="relative">
                  <Bot className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 w-4 h-4 pointer-events-none" />
                  <input
                    type="text"
                    placeholder='Boolean: ("Backend" OR "Full Stack") AND NOT "Intern"'
                    value={filters.booleanQuery}
                    onChange={e => set('booleanQuery', e.target.value)}
                    className="w-full pl-10 pr-16 py-2.5 border border-purple-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm bg-purple-50/50 focus:ring-2 focus:ring-purple-400 focus:outline-none"
                  />
                  {filters.booleanQuery && (
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium px-1.5 py-0.5 rounded ${boolSyntaxOk ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                      {boolSyntaxOk ? 'valid' : 'syntax error'}
                    </span>
                  )}
                </div>

                {/* Keyword search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by name, title, email…"
                    value={filters.search}
                    onChange={e => set('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Skills + Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <Code className="absolute left-3 top-3 text-gray-400 w-4 h-4 pointer-events-none z-10" />
                    <TagInput
                      icon={null}
                      tags={filters.skills}
                      onRemove={i => removeTag('skills', i)}
                      onAdd={v => { addTag('skills', v); setSkillInput(''); }}
                      inputValue={skillInput}
                      onInputChange={setSkillInput}
                      suggestions={skillSuggestions}
                      showSuggestions={showSkillSug}
                      onShowSuggestions={setShowSkillSug}
                      placeholder="Skills (e.g. Python)"
                      tagClass="bg-blue-100 text-blue-700"
                      SuggestionIcon={Code}
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4 pointer-events-none z-10" />
                    <TagInput
                      icon={null}
                      tags={filters.locations}
                      onRemove={i => removeTag('locations', i)}
                      onAdd={v => { addTag('locations', v); setLocationInput(''); }}
                      inputValue={locationInput}
                      onInputChange={setLocationInput}
                      suggestions={locationSuggestions}
                      showSuggestions={showLocSug}
                      onShowSuggestions={setShowLocSug}
                      placeholder="Location (e.g. Mumbai)"
                      tagClass="bg-green-100 text-green-700"
                      SuggestionIcon={MapPin}
                    />
                  </div>
                </div>

                {/* Exp, CTC, Designation, Ex-company */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Experience */}
                  <div className="relative">
                    <label className="absolute -top-1.5 left-3 bg-white px-1 text-[10px] font-semibold text-indigo-500 z-10">Exp (yrs)</label>
                    <div className="flex border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400">
                      <input type="number" min={0} max={30} placeholder="Min"
                        value={filters.expMin || ''}
                        onChange={e => set('expMin', Math.min(+(e.target.value) || 0, filters.expMax))}
                        className="w-1/2 px-2 py-2.5 text-sm text-gray-900 outline-none border-r border-gray-200 text-center" />
                      <input type="number" min={0} max={30} placeholder="Max"
                        value={filters.expMax === 30 ? '' : filters.expMax}
                        onChange={e => set('expMax', Math.max(+(e.target.value) || 30, filters.expMin))}
                        className="w-1/2 px-2 py-2.5 text-sm text-gray-900 outline-none text-center" />
                    </div>
                  </div>

                  {/* CTC */}
                  <div className="relative">
                    <label className="absolute -top-1.5 left-3 bg-white px-1 text-[10px] font-semibold text-indigo-500 z-10">CTC (LPA)</label>
                    <div className="flex border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400">
                      <input type="number" min={0} max={200} placeholder="Min"
                        value={filters.ctcMin || ''}
                        onChange={e => set('ctcMin', Math.min(+(e.target.value) || 0, filters.ctcMax))}
                        className="w-1/2 px-2 py-2.5 text-sm text-gray-900 outline-none border-r border-gray-200 text-center" />
                      <input type="number" min={0} max={200} placeholder="Max"
                        value={filters.ctcMax === 100 ? '' : filters.ctcMax}
                        onChange={e => set('ctcMax', Math.max(+(e.target.value) || 100, filters.ctcMin))}
                        className="w-1/2 px-2 py-2.5 text-sm text-gray-900 outline-none text-center" />
                    </div>
                  </div>

                  {/* Designation */}
                  <div className="relative">
                    <label className="absolute -top-1.5 left-3 bg-white px-1 text-[10px] font-semibold text-indigo-500 z-10">Designation</label>
                    <div className="flex items-center border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-indigo-400">
                      <Briefcase className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                      <input type="text" placeholder="e.g. Engineer"
                        value={designationInput}
                        onChange={e => setDesignationInput(e.target.value)}
                        onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && designationInput.trim()) { e.preventDefault(); addTag('designations', designationInput.trim()); setDesignationInput(''); } }}
                        className="flex-1 px-2 py-2.5 text-sm text-gray-900 outline-none bg-transparent" />
                      {designationInput && (
                        <button onMouseDown={() => { addTag('designations', designationInput.trim()); setDesignationInput(''); }} className="mr-2 text-indigo-600 text-xs font-bold">+</button>
                      )}
                    </div>
                  </div>

                  {/* Ex-company */}
                  <div className="relative">
                    <label className="absolute -top-1.5 left-3 bg-white px-1 text-[10px] font-semibold text-indigo-500 z-10">Ex-Company</label>
                    <div className="flex items-center border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-indigo-400">
                      <Building2 className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                      <input type="text" placeholder="e.g. Infosys"
                        value={companyInput}
                        onChange={e => setCompanyInput(e.target.value)}
                        onKeyDown={e => { if ((e.key === 'Enter' || e.key === ',') && companyInput.trim()) { e.preventDefault(); addTag('exCompanies', companyInput.trim()); setCompanyInput(''); } }}
                        className="flex-1 px-2 py-2.5 text-sm text-gray-900 outline-none bg-transparent" />
                      {companyInput && (
                        <button onMouseDown={() => { addTag('exCompanies', companyInput.trim()); setCompanyInput(''); }} className="mr-2 text-indigo-600 text-xs font-bold">+</button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notice period + Relocation */}
                <div className="flex flex-wrap items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {NOTICE_OPTIONS.map(n => (
                    <button key={n} type="button"
                      onClick={() => set('noticePeriods', filters.noticePeriods.includes(n) ? filters.noticePeriods.filter(x => x !== n) : [...filters.noticePeriods, n])}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${filters.noticePeriods.includes(n) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400'}`}
                    >{n}</button>
                  ))}
                  <button type="button"
                    onClick={() => set('relocationOnly', !filters.relocationOnly)}
                    className={`ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${filters.relocationOnly ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'}`}
                  >
                    <MapPin className="w-3 h-3" /> Open to Relocation
                  </button>
                </div>

                {/* Active filter chips (designations + companies) */}
                {(filters.designations.length > 0 || filters.exCompanies.length > 0) && (
                  <div className="flex flex-wrap gap-1.5">
                    {filters.designations.map(d => (
                      <span key={d} className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">
                        {d}<button onClick={() => set('designations', filters.designations.filter(x => x !== d))}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                    {filters.exCompanies.map(tc => (
                      <span key={tc} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                        {tc}<button onClick={() => set('exCompanies', filters.exCompanies.filter(x => x !== tc))}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button onClick={refetch}
                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md transition-colors">
                    <Search className="w-4 h-4" /> Search
                  </button>
                  <button onClick={clearFilters}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm hover:border-red-400 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" /> Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Results panel ────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* AI Insights bar */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-3 sm:p-4 mb-4 text-white">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-300" />
              <span className="font-semibold text-sm">AI Talent Insights</span>
            </div>

            {/* Job selector */}
            <div className="relative flex-1 w-full lg:min-w-[200px]">
              <button onClick={() => setShowJobDropdown(v => !v)}
                className="w-full flex items-center justify-between bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg px-3 py-2 text-sm font-medium transition-colors">
                <span className="flex items-center gap-2 truncate">
                  <Briefcase className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{selectedJob ? (selectedJob.jobTitle ?? selectedJob.title) : 'Select a job to rank candidates'}</span>
                </span>
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              </button>
              {showJobDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-52 overflow-y-auto">
                  <button onClick={() => { setSelectedJob(null); setShowJobDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 border-b">
                    Profile completeness (no job)
                  </button>
                  {employerJobs.length === 0
                    ? <div className="px-3 py-3 text-sm text-gray-400">No jobs posted yet</div>
                    : employerJobs.map(j => (
                      <button key={j._id} onClick={() => { setSelectedJob(j); setShowJobDropdown(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 border-b last:border-0 ${selectedJob?._id === j._id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'}`}>
                        <div className="font-medium truncate">{j.jobTitle}</div>
                        <div className="text-xs text-gray-400 truncate">{j.company} · {j.location}</div>
                      </button>
                    ))
                  }
                </div>
              )}
            </div>

            {/* Sort buttons */}
            <div className="flex items-center gap-2">
              <span className="text-white/70 text-xs">Sort:</span>
              {(['ai_score', 'skills', 'name'] as const).map(s => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 transition-colors ${sortBy === s ? 'bg-white text-indigo-700' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                  {s === 'ai_score' ? <><Bot className="w-3.5 h-3.5" />AI Score</>
                    : s === 'skills' ? <><Target className="w-3.5 h-3.5" />Skills</>
                      : <><Users className="w-3.5 h-3.5" />Name</>}
                </button>
              ))}
            </div>

            {/* Summary */}
            <div className="text-xs text-white/80 lg:ml-auto">
              {excellentCount} excellent · {goodCount} good fits
            </div>
          </div>
        </div>

        {/* Count bar */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200 mb-6">
          {loading
            ? <div className="flex items-center gap-2 text-gray-700 text-sm"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" /><span>Loading candidates…</span></div>
            : <div className="text-gray-700">
              <span className="text-blue-600 font-bold">{scoredCandidates.length}</span>
              <span className="text-gray-600"> candidate{scoredCandidates.length !== 1 ? 's' : ''} found</span>
              {filters.search && <span className="text-gray-500"> matching "{filters.search}"</span>}
              {filters.skills.length > 0 && <span className="text-gray-500"> with {filters.skills.join(', ')}</span>}
              {filters.locations.length > 0 && <span className="text-gray-500"> in {filters.locations.join(', ')}</span>}
              {debouncing && <span className="inline-flex items-center gap-1 ml-2 text-amber-500 text-xs"><span className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-500" />updating…</span>}
            </div>
          }
        </div>

        {/* ── Candidate grid ─── */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading candidates…</p>
          </div>
        ) : scoredCandidates.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 border border-gray-200 inline-block">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No candidates found</h3>
              <p className="text-gray-500 mb-6 max-w-sm">
                {(filters.search || filters.skills.length > 0 || filters.locations.length > 0)
                  ? 'Try adjusting your filters.'
                  : 'No candidates are currently registered.'}
              </p>
              <button onClick={clearFilters}
                className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors">
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {scoredCandidates.map(candidate => {
              const score = candidate.aiScore;
              const fitLabel = candidate.fitLabel ?? 'Low';
              const fit = FIT_CONFIG[fitLabel];
              const scoreBarColor = score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-blue-500' : score >= 30 ? 'bg-amber-500' : 'bg-red-400';
              const matchJob = selectedJob ?? candidate._bestJob;

              return (
                <div key={candidate._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">

                  {/* Card header */}
                  <div className="p-4 md:p-5 flex items-start gap-3 md:gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden shadow">
                      {candidate.profilePhoto ? (
                        <>
                          <img src={candidate.profilePhoto} alt={getName(candidate)}
                            className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          <span className="absolute">{getAvatar(getName(candidate))}</span>
                        </>
                      ) : getAvatar(getName(candidate))}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight truncate">{getName(candidate)}</h3>
                          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{candidate.jobTitle ?? candidate.title ?? 'Professional'}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5 text-[11px] leading-tight">
                            <span className="flex items-center gap-1 text-gray-500 bg-gray-50 border border-gray-100 rounded-md px-2 py-0.5">
                              <MapPin className="w-3 h-3 text-blue-400" />
                              <span className="truncate max-w-[100px]">{getLocation(candidate)}</span>
                            </span>
                            {(candidate.experience || candidate.experienceYears != null) && (
                              <span className="flex items-center gap-1 text-orange-700 bg-orange-50 border border-orange-100 rounded-md px-2 py-0.5">
                                <Clock className="w-3 h-3 text-orange-400" />
                                {candidate.experience ?? `${candidate.experienceYears} yrs`}
                              </span>
                            )}
                            {(candidate.expectedCTC ?? candidate.salary) && (
                              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-0.5">
                                <DollarSign className="w-3 h-3 text-emerald-500" />
                                {String(candidate.expectedCTC ?? candidate.salary)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Score ring */}
                        <div className="flex flex-col items-center flex-shrink-0">
                          <ScoreRing score={score} />
                          <span className={`mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${fit.bg} ${fit.text} whitespace-nowrap`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${fit.dot}`} />
                            {fitLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mx-4 md:mx-5 border-t border-gray-100" />

                  {/* Skills */}
                  <div className="px-4 md:px-5 py-3 flex-grow">
                    <div className="flex flex-wrap gap-1.5">
                      {(candidate.skills ?? []).slice(0, 5).map((skill, idx) => {
                        const matched = candidate.matchedSkills?.map(s => s.toLowerCase()).includes(skill.toLowerCase());
                        return (
                          <span key={idx} className={`text-xs px-2.5 py-1 rounded-full font-medium ${matched ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                            {matched && '✓ '}{skill}
                          </span>
                        );
                      })}
                      {(candidate.skills?.length ?? 0) > 5 && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">+{(candidate.skills?.length ?? 0) - 5}</span>
                      )}
                    </div>
                  </div>

                  {/* Match bar */}
                  {matchJob && (
                    <div className="px-4 md:px-5 pb-3">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-600 truncate">
                            Match — <span className="text-indigo-600">{matchJob.jobTitle ?? matchJob.title}</span>
                          </span>
                          <span className="text-xs font-bold text-gray-700 ml-2">{score}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                          <div className={`h-1.5 rounded-full ${scoreBarColor}`} style={{ width: `${score}%` }} />
                        </div>
                        <div className="flex gap-3 text-xs">
                          {(candidate.matchedSkills?.length ?? 0) > 0 && <span className="text-emerald-600 font-medium">✓ {candidate.matchedSkills!.length} matched</span>}
                          {(candidate.missingSkills?.length ?? 0) > 0 && <span className="text-red-500 font-medium">✗ {candidate.missingSkills!.length} missing</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="px-4 md:px-5 pb-5 flex gap-2 mt-auto">
                    <button onClick={() => handleViewProfile(candidate)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                      View Profile
                    </button>

                    <div className="relative" data-contact-menu>
                      <button
                        onClick={() => setOpenContactMenu(openContactMenu === candidate._id ? null : candidate._id)}
                        className="flex items-center gap-1.5 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700 text-sm font-semibold px-3 py-2.5 rounded-xl transition-colors">
                        <Mail className="w-4 h-4" />
                        Contact
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openContactMenu === candidate._id ? 'rotate-180' : ''}`} />
                      </button>

                      {openContactMenu === candidate._id && (
                        <div className="absolute bottom-full right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 mb-1 w-48 overflow-hidden">
                          <button onClick={() => { setMessageCandidate(candidate); setOpenContactMenu(null); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2 border-b">
                            <MessageCircle className="w-4 h-4 text-gray-400" /> Send Message
                          </button>
                          <button onClick={() => {
                            navigator.clipboard.writeText(candidate.email ?? '');
                            window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Email copied!' } }));
                            setOpenContactMenu(null);
                          }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2 border-b">
                            <Copy className="w-4 h-4 text-gray-400" /> Copy Email
                          </button>
                          <button onClick={() => { handleSaveCandidate(candidate); setOpenContactMenu(null); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2">
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

      {/* Direct message modal */}
      {messageCandidate && (
        <DirectMessage
          candidateId={messageCandidate._id}
          candidateName={getName(messageCandidate)}
          candidateEmail={messageCandidate.email ?? ''}
          employerId={currentUser.id ?? ''}
          employerName={currentUser.name ?? currentUser.fullName ?? ''}
          onClose={() => setMessageCandidate(null)}
        />
      )}
    </div>
  );
};

export default CandidateSearchPage;