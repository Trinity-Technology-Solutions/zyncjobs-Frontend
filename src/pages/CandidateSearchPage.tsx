
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search, MapPin, Star, Users, Code, Mail, Briefcase,
  ChevronDown, MessageCircle, Copy, Clock, X, DollarSign, BadgeCheck,
  Sparkles, Target, CheckCircle, Bot,
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
}

interface Filters {
  search: string;
  skills: string[];
  locations: string[];
  expMin: number;
  expMax: number;
  ctcMin: number;
  ctcMax: number;
  noticePeriods: string[];
}

interface CandidateSearchPageProps {
  onNavigate: (page: string, params?: unknown) => void;
  user?: { name: string; type: 'candidate' | 'employer' | 'admin' | 'super_admin'; email?: string; id?: string; fullName?: string; companyName?: string; company?: string; companyLogo?: string };
  onLogout?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const POPULAR_SKILLS = ['JavaScript', 'Python', 'React', 'Java', 'Node.js', 'Angular', 'SQL', 'HTML', 'CSS', 'AWS'];
const POPULAR_LOCATIONS = ['Remote', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Gurgaon', 'Noida', 'Kolkata'];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function firstBool(...vals: unknown[]): boolean | undefined {
  for (const v of vals) {
    if (v === true || v === 'true' || v === 1 || v === '1') return true;
    if (v === false || v === 'false' || v === 0 || v === '0') return false;
  }
  return undefined;
}

function toExpYears(raw: string | number | undefined): number {
  if (raw == null || raw === '') return 0;
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

function toCTCinLPA(raw: string | number | undefined): number {
  if (raw == null || raw === '') return -1;
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^0-9.]/g, ''));
  if (isNaN(n)) return -1;
  if (n >= 100_000) return n / 100_000;
  if (n >= 1_000) return n / 100;
  return n;
}

function candidateBlob(c: Candidate): string {
  return [
    c.fullName, c.name, c.jobTitle, c.title,
    c.profileSummary, c.location,
    ...(c.skills ?? []),
    ...(c.workHistory ?? []).map(w => w.company ?? w.employer ?? ''),
    typeof c.employment === 'object' ? JSON.stringify(c.employment) : String(c.employment ?? ''),
  ].filter(Boolean).join(' ').toLowerCase();
}

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function useSearchAnalytics() {
  const pendingRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const track = useCallback((candidates: Candidate[], query: string) => {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery || cleanQuery.length < 2 || candidates.length === 0) return;
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
          body: JSON.stringify({ emails, searchQuery: cleanQuery }),
        });
        window.dispatchEvent(new CustomEvent('analyticsRefresh'));
      } catch { }
    }, 1_000);
  }, []);
  return track;
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

const CandidateSearchPage: React.FC<CandidateSearchPageProps> = ({ onNavigate, user, onLogout }) => {
  const [viewingCandidateId, setViewingCandidateId] = useState<string | null>(null);
  const [messageCandidate, setMessageCandidate] = useState<Candidate | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [openContactMenu, setOpenContactMenu] = useState<string | null>(null);

  const token = tokenStorage.getAccess() ?? tokenStorage.getAdmin();
  const currentUser = useMemo(() => JSON.parse(localStorage.getItem('user') ?? '{}') as Record<string, string>, []);
  const trackSearch = useSearchAnalytics();

  const [filters, setFilters] = useState<Filters>({
    search: '', skills: [], locations: [],
    expMin: 0, expMax: 30, ctcMin: 0, ctcMax: 100, noticePeriods: [],
  });

  const dSearch = useDebounce(filters.search, 300);

  const [skillInput, setSkillInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>(POPULAR_SKILLS);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>(POPULAR_LOCATIONS);
  const [showSkillSug, setShowSkillSug] = useState(false);
  const [showLocSug, setShowLocSug] = useState(false);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    const endpoints = [
      `${API_ENDPOINTS.BASE_URL}/profiles`,
      `${API_ENDPOINTS.BASE_URL}/candidates`,
      `${API_ENDPOINTS.BASE_URL}/users?role=candidate`,
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
                    const path = rawPhoto.startsWith('/') ? rawPhoto : '/' + rawPhoto;
                    profilePhoto = BASE ? `${BASE}${path}` : path;
                  }
                }
                const resumeUrl = c.resumeUrl || (c.resume && typeof c.resume === 'object' ? (c.resume.url || c.resume.fileUrl || '') : c.resume) || '';
                const rawSkills = c.skills || c.skillSet || c.keySkills || c.tags || [];
                const skills: string[] = Array.isArray(rawSkills)
                  ? rawSkills.map((s: any) => typeof s === 'object' ? s.name || String(s) : String(s)).filter(Boolean)
                  : typeof rawSkills === 'string' ? rawSkills.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
                return {
                  ...c, _id: c._id || c.id, profilePhoto, resumeUrl, skills,
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

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const sr = await apiFetch(`${API_ENDPOINTS.BASE_URL}/autocomplete/skills`);
        if (sr.ok) { const d = await sr.json(); setAllSkills(Array.isArray(d) ? d : d.skills || []); }
        const lr = await apiFetch(`${API_ENDPOINTS.BASE_URL}/autocomplete/locations`);
        if (lr.ok) { const d = await lr.json(); setAllLocations(Array.isArray(d) ? d : d.locations || []); }
      } catch { }
    };
    loadMeta();
  }, []);

  useEffect(() => {
    if (!openContactMenu) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-contact-menu]')) setOpenContactMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openContactMenu]);

  const filteredCandidates = useMemo(() => {
    const q = dSearch.toLowerCase().trim();
    const loggedInEmail = (currentUser?.email || user?.email || '').toLowerCase();
    return candidates.filter(c => {
      if (loggedInEmail && c.email && c.email.toLowerCase() === loggedInEmail) return false;
      const blob = candidateBlob(c);
      const skills = (c.skills ?? []).map(s => s.toLowerCase());
      if (q && !blob.includes(q)) return false;
      if (filters.skills.length > 0 &&
        !filters.skills.some(sq => skills.some(s => s.includes(sq.toLowerCase()) || sq.toLowerCase().includes(s))))
        return false;
      if (filters.locations.length > 0 &&
        !filters.locations.some(lq => (c.location ?? '').toLowerCase().includes(lq.toLowerCase())))
        return false;
      const exp = toExpYears(c.experience ?? c.experienceYears);
      if (exp > 0 && (exp < filters.expMin || exp > filters.expMax)) return false;
      const ctc = toCTCinLPA(c.expectedCTC ?? c.salary);
      if (ctc !== -1 && (ctc < filters.ctcMin || ctc > filters.ctcMax)) return false;
      if (filters.noticePeriods.length > 0) {
        const np = (c.noticePeriod ?? c.availability ?? '').toLowerCase();
        if (!filters.noticePeriods.some(n => np.includes(n.toLowerCase()))) return false;
      }
      return true;
    });
  }, [candidates, dSearch, filters, currentUser, user]);

  useEffect(() => {
    if (loading || filteredCandidates.length === 0) return;
    const q = dSearch.trim();
    const queryToTrack = q.length >= 2 ? q : filters.skills.length > 0 ? filters.skills.join(', ') : filters.locations.length > 0 ? filters.locations.join(', ') : '';
    if (queryToTrack.length >= 2) trackSearch(filteredCandidates, queryToTrack);
  }, [filteredCandidates, dSearch, filters.skills, filters.locations, loading, trackSearch]);

  const getCandidateName = (c: Candidate) => c.fullName ?? c.name ?? c.email ?? 'Unknown';
  const getCandidateLocation = (c: Candidate) => c.location ?? (c as any).city ?? '';
  const getAvatar = (name: string) => name.charAt(0).toUpperCase();

  const handleViewProfile = useCallback((candidate: Candidate) => {
    const cid = candidate.email || candidate._id || '';
    if (!cid) return;
    const targetEmail = candidate.email || (cid.includes('@') ? cid : '');
    if (targetEmail) {
      apiFetch(`${API_ENDPOINTS.BASE_URL}/analytics-tracking/track/profile-view`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: candidate._id, email: targetEmail, viewedBy: user?.email ?? 'employer' }),
      }).then(() => window.dispatchEvent(new CustomEvent('analyticsRefresh'))).catch(() => { });
    }
    sessionStorage.setItem('viewCandidateId', cid);
    sessionStorage.setItem('viewCandidateData', JSON.stringify({
      name: candidate.fullName ?? candidate.name ?? '', email: targetEmail,
      skills: candidate.skills ?? [], resumeUrl: candidate.resumeUrl ?? '',
      openToWork: firstBool(candidate.openToWork), visibilityStatus: candidate.visibilityStatus,
    }));
    setViewingCandidateId(cid);
  }, [user?.email]);

  const addSkill = (s: string) => {
    if (!s || filters.skills.includes(s)) return;
    setFilters(p => ({ ...p, skills: [...p.skills, s] }));
    setSkillInput(''); setShowSkillSug(false);
  };
  const removeSkill = (i: number) => setFilters(p => ({ ...p, skills: p.skills.filter((_, idx) => idx !== i) }));

  const addLocation = (l: string) => {
    if (!l || filters.locations.includes(l)) return;
    setFilters(p => ({ ...p, locations: [...p.locations, l] }));
    setLocationInput(''); setShowLocSug(false);
  };
  const removeLocation = (i: number) => setFilters(p => ({ ...p, locations: p.locations.filter((_, idx) => idx !== i) }));

  const clearAll = () => {
    setFilters({ search: '', skills: [], locations: [], expMin: 0, expMax: 30, ctcMin: 0, ctcMax: 100, noticePeriods: [] });
    setSkillInput(''); setLocationInput('');
  };

  const isFiltered = filters.search.trim() || filters.skills.length > 0 || filters.locations.length > 0;

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
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <style>{`
        @keyframes cand-fade-up { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .cand-fade-1 { animation: cand-fade-up .6s cubic-bezier(.22,1,.36,1) .05s both; }
        .cand-fade-2 { animation: cand-fade-up .6s cubic-bezier(.22,1,.36,1) .15s both; }
        .cand-fade-3 { animation: cand-fade-up .6s cubic-bezier(.22,1,.36,1) .25s both; }
        .cand-fade-4 { animation: cand-fade-up .7s cubic-bezier(.22,1,.36,1) .35s both; }
        @keyframes cand-gradient-x { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .cand-gradient { background-size: 200% auto; animation: cand-gradient-x 6s ease infinite; }
      `}</style>

      {/* Hero Header */}
      <div className="relative bg-white border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-6 sm:pb-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="cand-fade-1 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/80 backdrop-blur-md border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest shadow-sm mb-3">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              AI-Powered Candidate Sourcing
            </span>
            <h1 className="cand-fade-2 text-2xl sm:text-3xl md:text-4xl lg:text-[2.35rem] xl:text-[2.6rem] font-extrabold text-gray-900 leading-[1.15] tracking-[-0.02em] mb-2.5">
              Discover Top Talent,{' '}
              <span className="cand-gradient text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-violet-600 to-orange-500">
                decoded by AI
              </span>
            </h1>
            <p className="cand-fade-3 text-sm sm:text-base text-gray-500 leading-relaxed mb-4 max-w-2xl mx-auto px-4">
              Search a verified pool of professionals by skills, experience, salary and availability.
            </p>
            <div className="cand-fade-3 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mb-6">
              <span className="inline-flex items-center gap-1.5 bg-white/85 border border-gray-200/80 rounded-full pl-2 pr-3 py-1 text-xs text-gray-700 shadow-sm">
                <span className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center"><Target className="w-3 h-3 text-blue-600" /></span>
                Quality talent pool
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/85 border border-gray-200/80 rounded-full pl-2 pr-3 py-1 text-xs text-gray-700 shadow-sm">
                <span className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center"><CheckCircle className="w-3 h-3 text-emerald-500" /></span>
                Verified profiles
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/85 border border-gray-200/80 rounded-full pl-2 pr-3 py-1 text-xs text-gray-700 shadow-sm">
                <span className="w-5 h-5 rounded-full bg-violet-50 flex items-center justify-center"><Bot className="w-3 h-3 text-violet-600" /></span>
                AI match on every profile
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Keyword */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                value={filters.search}
                onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
                placeholder="Search by name, title, skill…"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Skills */}
            <div className="relative md:w-72">
              <Code className="absolute left-3 top-3 text-gray-400 w-4 h-4 pointer-events-none z-10" />
              <div className="w-full pl-9 pr-2 py-1.5 border border-gray-300 rounded-lg min-h-[42px] flex flex-wrap items-center gap-1 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 bg-white">
                {filters.skills.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-2 py-0.5 rounded font-medium">
                    {s}<button type="button" onClick={() => removeSkill(i)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={filters.skills.length === 0 ? 'Skills (e.g. React)' : '+ add'}
                  value={skillInput}
                  onChange={e => {
                    setSkillInput(e.target.value);
                    setSkillSuggestions(e.target.value.length >= 1
                      ? searchAccuracy.getAccurateMatches(e.target.value, allSkills.filter(s => !filters.skills.includes(s)), 'skill').slice(0, 10).map((m: any) => m.item)
                      : POPULAR_SKILLS.filter(s => !filters.skills.includes(s)));
                    setShowSkillSug(true);
                  }}
                  onKeyDown={e => {
                    if ((e.key === 'Enter' || e.key === ',') && skillInput.trim()) { e.preventDefault(); addSkill(skillInput.trim()); }
                    if (e.key === 'Backspace' && skillInput === '' && filters.skills.length > 0) removeSkill(filters.skills.length - 1);
                  }}
                  onFocus={() => { setSkillSuggestions(skillInput ? searchAccuracy.getAccurateMatches(skillInput, allSkills.filter(s => !filters.skills.includes(s)), 'skill').slice(0, 10).map((m: any) => m.item) : POPULAR_SKILLS.filter(s => !filters.skills.includes(s))); setShowSkillSug(true); }}
                  onBlur={() => setTimeout(() => setShowSkillSug(false), 150)}
                  className="flex-1 min-w-[80px] outline-none text-sm bg-transparent placeholder:text-gray-400"
                />
              </div>
              {showSkillSug && skillSuggestions.length > 0 && (
                <div className="absolute z-[9999] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {skillSuggestions.map((s, i) => (
                    <button key={i} type="button" onMouseDown={() => addSkill(s)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 border-b border-gray-100 last:border-0">
                      <Code className="w-3 h-3 text-gray-400" />{s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Location */}
            <div className="relative md:w-60">
              <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4 pointer-events-none z-10" />
              <div className="w-full pl-9 pr-2 py-1.5 border border-gray-300 rounded-lg min-h-[42px] flex flex-wrap items-center gap-1 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 bg-white">
                {filters.locations.map((l, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-2 py-0.5 rounded font-medium">
                    {l}<button type="button" onClick={() => removeLocation(i)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={filters.locations.length === 0 ? 'Location' : '+ add'}
                  value={locationInput}
                  onChange={e => {
                    setLocationInput(e.target.value);
                    setLocationSuggestions(e.target.value.length >= 1
                      ? searchAccuracy.getLocationMatches(e.target.value, allLocations.filter(l => !filters.locations.includes(l))).slice(0, 10)
                      : POPULAR_LOCATIONS.filter(l => !filters.locations.includes(l)));
                    setShowLocSug(true);
                  }}
                  onKeyDown={e => {
                    if ((e.key === 'Enter' || e.key === ',') && locationInput.trim()) { e.preventDefault(); addLocation(locationInput.trim()); }
                    if (e.key === 'Backspace' && locationInput === '' && filters.locations.length > 0) removeLocation(filters.locations.length - 1);
                  }}
                  onFocus={() => { setLocationSuggestions(locationInput ? searchAccuracy.getLocationMatches(locationInput, allLocations.filter(l => !filters.locations.includes(l))).slice(0, 10) : POPULAR_LOCATIONS.filter(l => !filters.locations.includes(l))); setShowLocSug(true); }}
                  onBlur={() => setTimeout(() => setShowLocSug(false), 150)}
                  className="flex-1 min-w-[80px] outline-none text-sm bg-transparent placeholder:text-gray-400"
                />
              </div>
              {showLocSug && locationSuggestions.length > 0 && (
                <div className="absolute z-[9999] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {locationSuggestions.map((l, i) => (
                    <button key={i} type="button" onMouseDown={() => addLocation(l)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 border-b border-gray-100 last:border-0">
                      <MapPin className="w-3 h-3 text-gray-400" />{l}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Result count + clear */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            {loading ? 'Searching…' : (
              <>
                <span className="font-semibold text-gray-900">{filteredCandidates.length}</span>
                {' candidate'}{filteredCandidates.length !== 1 ? 's' : ''} found
                {filters.skills.length > 0 && <span className="text-blue-600"> · {filters.skills.join(', ')}</span>}
                {filters.locations.length > 0 && <span className="text-emerald-600"> · {filters.locations.join(', ')}</span>}
              </>
            )}
          </p>
          {isFiltered && (
            <button onClick={clearAll} className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors">
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 bg-gray-100 rounded" />
                    <div className="h-3 w-1/2 bg-gray-100 rounded" />
                    <div className="h-3 w-1/3 bg-gray-100 rounded" />
                  </div>
                </div>
                <div className="mt-4 flex gap-1.5">
                  {[0,1,2,3].map(k => <div key={k} className="h-6 w-16 bg-gray-100 rounded-full" />)}
                </div>
                <div className="mt-4 flex gap-2">
                  <div className="h-9 flex-1 bg-gray-100 rounded-lg" />
                  <div className="h-9 w-24 bg-gray-100 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates found</h3>
            <p className="text-gray-500 text-sm mb-5">
              {isFiltered ? 'Try adjusting your filters.' : 'No candidates are currently registered.'}
            </p>
            {isFiltered && (
              <button onClick={clearAll} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
                <X className="w-4 h-4" /> Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCandidates.map((candidate, cardIdx) => {
              const expYears = toExpYears(candidate.experience ?? candidate.experienceYears);
              const ctcLpa = toCTCinLPA(candidate.expectedCTC ?? candidate.salary);
              const noticeP = candidate.noticePeriod ?? candidate.availability ?? '';
              const isOpenToWork = firstBool(candidate.openToWork);
              const candidateSkills = candidate.skills ?? [];
              const filterSkillsLower = filters.skills.map(s => s.toLowerCase());
              return (
                <div
                  key={candidate._id}
                  className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col"
                  style={{ animationDelay: `${Math.min(cardIdx * 50, 300)}ms` }}
                >
                  <div className="p-5 flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                        {candidate.profilePhoto ? (
                          <img src={candidate.profilePhoto} alt={getCandidateName(candidate)} className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : getAvatar(getCandidateName(candidate))}
                      </div>
                      {isOpenToWork && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <h3 className="text-sm font-bold text-gray-900 truncate">{getCandidateName(candidate)}</h3>
                        <BadgeCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{candidate.jobTitle || candidate.title || 'Professional'}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="truncate">{getCandidateLocation(candidate) || 'Location not set'}</span>
                        </span>
                        {expYears > 0 && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-gray-400" />{expYears} yrs
                          </span>
                        )}
                        {ctcLpa > 0 && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-gray-400" />{ctcLpa} LPA
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {isOpenToWork && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                            Open to Work
                          </span>
                        )}
                        {noticeP && (
                          <span className="text-[10px] text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />{noticeP}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="px-5 pb-4">
                    {candidateSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {candidateSkills.slice(0, 6).map((skill, idx) => {
                          const matched = filterSkillsLower.length > 0 && filterSkillsLower.some(fs => skill.toLowerCase().includes(fs) || fs.includes(skill.toLowerCase()));
                          return (
                            <span key={idx} className={`text-[11px] px-2.5 py-1 rounded-full font-medium border ${matched ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                              {matched && <span className="mr-0.5">✓</span>}{skill}
                            </span>
                          );
                        })}
                        {candidateSkills.length > 6 && (
                          <span className="text-[11px] px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-400">+{candidateSkills.length - 6}</span>
                        )}
                      </div>
                    ) : candidate.profileSummary ? (
                      <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">{candidate.profileSummary}</p>
                    ) : (
                      <span className="text-[11px] text-gray-300 italic">No skills listed</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-5 pb-5 mt-auto flex gap-2 border-t border-gray-100 pt-4">
                    <button
                      onClick={() => handleViewProfile(candidate)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                    >
                      View Profile
                    </button>
                    <div className="relative" data-contact-menu>
                      <button
                        onClick={() => setOpenContactMenu(openContactMenu === candidate._id ? null : candidate._id)}
                        className="inline-flex items-center gap-1.5 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        Contact
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openContactMenu === candidate._id ? 'rotate-180' : ''}`} />
                      </button>
                      {openContactMenu === candidate._id && (
                        <div className="absolute bottom-full right-0 mb-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                          <button onClick={() => { setMessageCandidate(candidate); setOpenContactMenu(null); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm flex items-center gap-2 border-b">
                            <MessageCircle className="w-4 h-4 text-gray-400" /> Send Message
                          </button>
                          <button onClick={() => { navigator.clipboard.writeText(candidate.email || ''); window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Email copied!' } })); setOpenContactMenu(null); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm flex items-center gap-2 border-b">
                            <Copy className="w-4 h-4 text-gray-400" /> Copy Email
                          </button>
                          <button onClick={() => {
                            if (!token) { window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Please login to save candidates' } })); setOpenContactMenu(null); return; }
                            const payload = {
                              candidateId: candidate._id, fullName: getCandidateName(candidate), name: getCandidateName(candidate),
                              title: candidate.title || candidate.jobTitle || 'Professional', location: getCandidateLocation(candidate),
                              experience: candidate.experience || '', email: candidate.email || '', skills: candidateSkills,
                              profilePhoto: candidate.profilePhoto || '', companyName: currentUser.companyName || currentUser.company || '',
                              companyLogo: currentUser.companyLogo || '', appliedJobTitle: '', appliedJobId: null,
                            };
                            fetch(String(API_ENDPOINTS.SAVED_CANDIDATES), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
                              .then(async res => {
                                if (res.status === 409) { window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Candidate already saved.' } })); return; }
                                if (res.ok) { window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Candidate saved!' } })); window.dispatchEvent(new CustomEvent('candidateSaved', { detail: payload })); }
                                else { window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Failed to save.' } })); }
                              }).catch(() => window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Network error.' } })));
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
