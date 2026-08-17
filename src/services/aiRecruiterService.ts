/// <reference types="vite/client" />

/**
 * aiRecruiterService — structured AI recruiter endpoints.
 * Talks to the ZyncJobs AI service (Python /recruitment-ai):
 *   POST /ai/recruiter/search          — candidate sourcing by criteria
 *   POST /ai/recruiter/candidates/rank — rank candidates against a job
 *   POST /ai/recruiter/shortlist       — shortlist recommendation
 */

const AI_BASE = import.meta.env.VITE_AI_API_URL || '/recruitment-ai';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;
let cachedTokenKey: string = '';

async function getToken(): Promise<string> {
  let email: string | null = null;
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    email = u.email || u.userEmail || u.username || null;
  } catch { /* ignore */ }
  const key = `employer:${email || ''}`;
  if (cachedToken && cachedTokenKey === key && Date.now() < tokenExpiry) return cachedToken;
  const res = await fetch(`${AI_BASE}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: email || 'ai_user', role: 'employer', email }),
  });
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
  const data = await res.json();
  cachedToken = data.access_token;
  cachedTokenKey = key;
  tokenExpiry = Date.now() + 55 * 60 * 1000;
  return cachedToken!;
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const token = await getToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(`${AI_BASE}${path}`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export interface RecruiterCandidate {
  id?: string;
  name: string;
  role?: string;
  skills: string[];
  matchScore?: number | null;
  atsScore?: number | null;
  location?: string;
  experience?: string;
  missingSkills: string[];
  summary?: string;
  email?: string;
}

export interface RecruiterSearchResult {
  success: boolean;
  candidates: RecruiterCandidate[];
  totalCount: number;
  query: string;
  error?: string | null;
}

const pick = (raw: any, keys: string[]): any => {
  for (const k of keys) {
    const v = raw?.[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
};

export function normalizeCandidate(raw: any): RecruiterCandidate | null {
  if (!raw || typeof raw !== 'object') return null;
  const name = pick(raw, ['name', 'fullName', 'candidate_name', 'candidateName']) as string | undefined;
  if (!name) return null;

  const skillsRaw = pick(raw, ['skills', 'skillTags', 'top_skills', 'skills_summary']);
  const skills: string[] = Array.isArray(skillsRaw)
    ? skillsRaw.map((s: any) => (typeof s === 'string' ? s : s?.name || s?.skill || '')).filter(Boolean)
    : typeof skillsRaw === 'string'
      ? skillsRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

  const missingRaw = pick(raw, ['missingSkills', 'missing_skills', 'missing']);
  const missingSkills: string[] = Array.isArray(missingRaw)
    ? missingRaw.map((s: any) => (typeof s === 'string' ? s : s?.name || s?.skill || '')).filter(Boolean)
    : typeof missingRaw === 'string'
      ? missingRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

  const toScore = (v: any): number | null | undefined => {
    if (v === undefined || v === null || v === '') return undefined;
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? Math.min(Math.max(n, 0), 100) : undefined;
  };

  return {
    id: pick(raw, ['id', '_id', 'userId', 'candidateId']) as string | undefined,
    name,
    role: pick(raw, ['title', 'role', 'jobTitle', 'designation', 'currentRole', 'headline']) as string | undefined,
    skills: skills.slice(0, 8),
    matchScore: toScore(pick(raw, ['overallScore', 'matchScore', 'score', 'fit_score', 'match_score'])),
    atsScore: toScore(pick(raw, ['aiScore', 'atsScore', 'ats_score'])),
    location: pick(raw, ['location', 'city', 'currentLocation']) as string | undefined,
    experience: pick(raw, ['experience', 'experienceRange', 'yearsExperience', 'experience_years', 'experienceLevel']) as string | undefined,
    missingSkills: missingSkills.slice(0, 4),
    summary: pick(raw, ['summary', 'profile_summary', 'description', 'headline_summary']) as string | undefined,
    email: pick(raw, ['email', 'userEmail']) as string | undefined,
  };
}

export async function searchCandidates(criteria: string, filters?: Record<string, unknown>): Promise<RecruiterSearchResult> {
  const data = await post<any>('/ai/recruiter/search', { criteria, filters: filters || {} });
  const list = Array.isArray(data?.candidates) ? data.candidates : [];
  return {
    success: !!data?.success && data.error == null,
    candidates: list.map(normalizeCandidate).filter(Boolean) as RecruiterCandidate[],
    totalCount: Number(data?.total_count || list.length),
    query: data?.query || criteria,
    error: data?.error || null,
  };
}

export async function rankCandidates(
  jobDescription: string,
  candidates: Record<string, unknown>[]
): Promise<{ success: boolean; ranked: RecruiterCandidate[]; error?: string | null }> {
  const data = await post<any>('/ai/recruiter/candidates/rank', {
    job_description: jobDescription,
    candidates: candidates || [],
  });
  const list = Array.isArray(data?.ranked_candidates) ? data.ranked_candidates : [];
  return {
    success: !!data?.success && data.error == null,
    ranked: list.map(normalizeCandidate).filter(Boolean) as RecruiterCandidate[],
    error: data?.error || null,
  };
}

export async function shortlistCandidates(criteria: string, filters?: Record<string, unknown>): Promise<RecruiterSearchResult> {
  const data = await post<any>('/ai/recruiter/shortlist', { criteria, filters: filters || {} });
  const list = Array.isArray(data?.candidates) ? data.candidates : [];
  return {
    success: !!data?.success && data.error == null,
    candidates: list.map(normalizeCandidate).filter(Boolean) as RecruiterCandidate[],
    totalCount: Number(data?.total_count || list.length),
    query: data?.query || criteria,
    error: data?.error || null,
  };
}