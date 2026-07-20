import { apiFetch } from './apiFetch';
import { API_ENDPOINTS } from '../config/env';

const BASE = API_ENDPOINTS.BASE_URL;

export interface AlertCriteria {
  keywords: string[];
  skills: string[];
  location: string;
  country: string;
  experienceLevel: string;
  salaryMin?: number;
  salaryMax?: number;
  workType: string[];
  category: string;
}

export interface JobAlert {
  _id: string;
  alertName: string;
  criteria: AlertCriteria;
  frequency: 'instant' | 'daily' | 'weekly';
  isActive: boolean;
  totalJobsSent: number;
  lastSent?: string;
  lastMatched?: string;
  createdAt: string;
}

export interface AlertNotification {
  _id: string;
  alertId: string;
  alertName: string;
  jobId: string;
  jobTitle: string;
  company: string;
  companyLogo?: string;
  location: string;
  salary?: { min?: number; max?: number; currency?: string; period?: string };
  matchedSkills: string[];
  matchedKeywords: string[];
  postedAt: string;
  status: 'unread' | 'read' | 'dismissed';
  createdAt: string;
}

// ── Transform helpers ─────────────────────────────────────────────────────────
// Backend returns flat fields; frontend expects nested `criteria` object.

function fromBackendAlert(be: any): JobAlert {
  return {
    _id: be.id ?? be._id,
    alertName: be.alertName ?? '',
    criteria: {
      keywords: Array.isArray(be.keywords) ? be.keywords : [],
      skills: [],
      location: be.location ?? '',
      country: be.country ?? '',
      experienceLevel: be.experienceLevel ?? '',
      salaryMin: be.salaryMin ?? undefined,
      salaryMax: undefined,
      workType: be.workSetting ? [be.workSetting] : [],
      category: be.jobCategory ?? '',
    },
    frequency: be.frequency ?? 'daily',
    isActive: be.isActive ?? true,
    totalJobsSent: be.totalJobsSent ?? 0,
    lastSent: be.lastSent ?? undefined,
    lastMatched: be.lastMatched ?? undefined,
    createdAt: be.createdAt ?? new Date().toISOString(),
  };
}

function toBackendAlert(fe: Partial<JobAlert> & { userEmail?: string }): Record<string, any> {
  const body: Record<string, any> = {};
  if (fe.alertName !== undefined) body.alertName = fe.alertName;
  if (fe.criteria) {
    const c = fe.criteria;
    if (c.keywords) body.keywords = c.keywords;
    if (c.location !== undefined) body.location = c.location;
    if (c.country !== undefined) body.country = c.country;
    if (c.experienceLevel !== undefined) body.experienceLevel = c.experienceLevel;
    if (c.salaryMin !== undefined) body.salaryMin = c.salaryMin;
    if (c.workType?.length) body.workSetting = c.workType[0];
    if (c.category !== undefined) body.jobCategory = c.category;
  }
  if (fe.frequency !== undefined) body.frequency = fe.frequency;
  if (fe.isActive !== undefined) body.isActive = fe.isActive;
  if (fe.userEmail !== undefined) body.email = fe.userEmail;
  return body;
}

async function req<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await apiFetch(url, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? err.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Alerts ────────────────────────────────────────────────────────────────────

export const alertsAPI = {
  list: async (userEmail: string): Promise<JobAlert[]> => {
    const data = await req<any[]>(`${BASE}/job-alerts/user/${encodeURIComponent(userEmail)}`);
    return (Array.isArray(data) ? data : []).map(fromBackendAlert);
  },

  create: async (payload: { userEmail: string } & Record<string, any>): Promise<JobAlert> => {
    const body = toBackendAlert(payload);
    body.email = payload.userEmail;
    const data = await req<any>(`${BASE}/job-alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return fromBackendAlert(data.jobAlert ?? data);
  },

  update: async (id: string, payload: Partial<JobAlert>): Promise<JobAlert> => {
    const body = toBackendAlert(payload);
    const data = await req<any>(`${BASE}/job-alerts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return fromBackendAlert(data.jobAlert ?? data);
  },

  remove: (id: string) =>
    apiFetch(`${BASE}/job-alerts/${id}`, { method: 'DELETE' }),

  pause: (id: string) =>
    apiFetch(`${BASE}/job-alerts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    }),

  resume: (id: string) =>
    apiFetch(`${BASE}/job-alerts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: true }),
    }),
};

// ── Transform helpers ─────────────────────────────────────────────────────────

function fromBackendNotification(be: any): AlertNotification {
  return {
    _id: be.id ?? be._id,
    alertId: be.alertId ?? '',
    alertName: be.alertName ?? '',
    jobId: be.jobId ?? '',
    jobTitle: be.job?.jobTitle ?? be.jobTitle ?? '',
    company: be.job?.company ?? be.company ?? '',
    companyLogo: be.job?.companyLogo ?? be.companyLogo ?? undefined,
    location: be.job?.location ?? be.location ?? '',
    salary: be.job?.salaryMin
      ? { min: be.job.salaryMin, max: be.job.salaryMax ?? undefined, currency: be.job.currency ?? undefined, period: 'yearly' }
      : undefined,
    matchedSkills: be.matchedKeywords?.slice() ?? [],
    matchedKeywords: be.matchedKeywords?.slice() ?? [],
    postedAt: be.job?.createdAt ?? be.createdAt ?? new Date().toISOString(),
    status: be.status ?? 'unread',
    createdAt: be.createdAt ?? new Date().toISOString(),
  };
}

// ── Notifications ─────────────────────────────────────────────────────────────

export const alertNotifAPI = {
  list: async (userEmail: string): Promise<AlertNotification[]> => {
    const raw = await req<any>(`${BASE}/job-alerts/notifications/${encodeURIComponent(userEmail)}`);
    const list: any[] = Array.isArray(raw) ? raw : raw?.notifications ?? [];
    return list.map(fromBackendNotification);
  },

  unreadCount: async (userEmail: string): Promise<{ count: number }> => {
    const raw = await req<any>(`${BASE}/job-alerts/notifications/${encodeURIComponent(userEmail)}/unread-count`);
    return { count: raw.unreadCount ?? raw.count ?? 0 };
  },

  markRead: (id: string) =>
    apiFetch(`${BASE}/job-alerts/notifications/${id}/read`, { method: 'PUT' }),

  markAllRead: (userEmail: string) =>
    apiFetch(
      `${BASE}/job-alerts/notifications/${encodeURIComponent(userEmail)}/read-all`,
      { method: 'PUT' }
    ),

  dismiss: (id: string) =>
    apiFetch(`${BASE}/job-alerts/notifications/${id}/dismiss`, { method: 'PUT' }),
};
