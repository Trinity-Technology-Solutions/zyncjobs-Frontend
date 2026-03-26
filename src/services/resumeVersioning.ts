/**
 * Resume Versioning Service
 * Saves/loads multiple resume versions per user in localStorage
 */

export interface ResumeVersion {
  id: string;
  name: string;
  template: string;
  data: any;
  savedAt: string; // ISO string
  industry?: string;
}

const KEY = (email: string) => `resumeVersions_${email}`;

export function getVersions(email: string): ResumeVersion[] {
  try {
    return JSON.parse(localStorage.getItem(KEY(email)) || '[]');
  } catch {
    return [];
  }
}

export function saveVersion(email: string, version: Omit<ResumeVersion, 'id' | 'savedAt'>): ResumeVersion {
  const versions = getVersions(email);
  const newVersion: ResumeVersion = {
    ...version,
    id: `rv_${Date.now()}`,
    savedAt: new Date().toISOString(),
  };
  // Keep max 10 versions
  const updated = [newVersion, ...versions].slice(0, 10);
  localStorage.setItem(KEY(email), JSON.stringify(updated));
  return newVersion;
}

export function deleteVersion(email: string, id: string): void {
  const versions = getVersions(email).filter(v => v.id !== id);
  localStorage.setItem(KEY(email), JSON.stringify(versions));
}

export function updateVersionName(email: string, id: string, name: string): void {
  const versions = getVersions(email).map(v => v.id === id ? { ...v, name } : v);
  localStorage.setItem(KEY(email), JSON.stringify(versions));
}

export function formatSavedAt(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
