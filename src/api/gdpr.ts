import { apiFetch } from './apiFetch';
import { config } from '../config/env';

const API = config.API_URL;

// ── Types ──────────────────────────────────────────────────────────────────

export interface PrivacySettings {
  storeResume: boolean;
  allowEmployerView: boolean;
  receiveJobAlerts: boolean;
  allowAIRecommendations: boolean;
}

export interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface CookieConsentResponse extends CookieConsent {
  found: boolean;
  savedAt?: string;
}

export interface ConsentRecord {
  consentTypes: string[];
  consentDate: string;
}

export interface DeletionResult {
  success: boolean;
  message: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const json = (body: unknown): RequestInit => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

async function parseJSON<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || `Request failed (${res.status})`);
  return data as T;
}

// ── API ────────────────────────────────────────────────────────────────────

export const gdprAPI = {

  /**
   * Record initial consent at registration.
   * consentTypes e.g. ['terms', 'privacy', 'marketing']
   */
  async recordConsent(consentTypes: string[]): Promise<void> {
    await apiFetch(`${API}/gdpr/consent`, {
      method: 'POST',
      ...json({ consentTypes, consentDate: new Date().toISOString() }),
    });
  },

  /**
   * Fetch the logged-in user's privacy settings from DB.
   */
  async getPrivacySettings(): Promise<PrivacySettings> {
    const res = await apiFetch(`${API}/gdpr/privacy-settings`);
    return parseJSON<PrivacySettings>(res);
  },

  /**
   * Persist updated privacy settings to DB.
   */
  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    const res = await apiFetch(`${API}/gdpr/privacy-settings`, {
      method: 'PUT',
      ...json(settings),
    });
    return parseJSON<PrivacySettings>(res);
  },

  /**
   * GDPR Article 20 — data portability.
   * Triggers a JSON file download of all user data.
   */
  async downloadMyData(): Promise<void> {
    const res = await apiFetch(`${API}/gdpr/download-data`);
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zyncjobs-my-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * GDPR Article 17 — right to erasure.
   * Permanently deletes the account and all associated data.
   */
  async requestDeletion(): Promise<DeletionResult> {
    const res = await apiFetch(`${API}/gdpr/delete-account`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    return {
      success: res.ok,
      message: data?.message || (res.ok ? 'Account deleted successfully.' : 'Deletion failed. Please try again.'),
    };
  },

  /**
   * Save cookie consent preferences to DB (logged-in users).
   */
  async saveCookieConsent(prefs: CookieConsent): Promise<void> {
    const res = await apiFetch(`${API}/gdpr/cookie-consent`, {
      method: 'POST',
      ...json(prefs),
    });
    if (!res.ok) throw new Error(`Failed to save cookie consent (${res.status})`);
  },

  /**
   * Fetch saved cookie consent from DB (logged-in users).
   * Returns null on any error so callers can fall back gracefully.
   */
  async getCookieConsent(): Promise<CookieConsentResponse | null> {
    try {
      const res = await apiFetch(`${API}/gdpr/cookie-consent`);
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  /**
   * Withdraw a specific consent type (e.g. 'marketing').
   */
  async withdrawConsent(consentType: string): Promise<void> {
    const res = await apiFetch(`${API}/gdpr/consent/${encodeURIComponent(consentType)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to withdraw consent (${res.status})`);
  },

  /**
   * Fetch the full consent audit log for the logged-in user.
   */
  async getConsentHistory(): Promise<ConsentRecord[]> {
    const res = await apiFetch(`${API}/gdpr/consent/history`);
    return parseJSON<ConsentRecord[]>(res);
  },
};
