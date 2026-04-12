import { config } from '../config/env';

const API = config.API_URL;

const authHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const gdprAPI = {
  /** Record consent at registration */
  async recordConsent(userId: string, consentTypes: string[]): Promise<void> {
    await fetch(`${API}/gdpr/consent`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ userId, consentTypes, consentDate: new Date().toISOString() }),
    });
  },

  /** Get current privacy settings */
  async getPrivacySettings(userId: string) {
    const res = await fetch(`${API}/gdpr/privacy-settings/${encodeURIComponent(userId)}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch privacy settings');
    return res.json();
  },

  /** Update privacy settings */
  async updatePrivacySettings(userId: string, settings: Record<string, boolean>) {
    const res = await fetch(`${API}/gdpr/privacy-settings/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update privacy settings');
    return res.json();
  },

  /** Download all user data (GDPR portability) */
  async downloadMyData(userId: string): Promise<void> {
    const res = await fetch(`${API}/gdpr/download-data/${encodeURIComponent(userId)}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to download data');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-zyncjobs-data.json';
    a.click();
    URL.revokeObjectURL(url);
  },

  /** Request account + data deletion */
  async requestDeletion(userId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API}/gdpr/delete-account/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    return { success: res.ok, message: data.message || (res.ok ? 'Account deleted' : 'Deletion failed') };
  },

  /** Save cookie consent to backend (logged-in users only) */
  async saveCookieConsent(prefs: { necessary: boolean; analytics: boolean; marketing: boolean }): Promise<void> {
    await fetch(`${API}/gdpr/cookie-consent`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(prefs),
    });
  },

  /** Get saved cookie consent from backend (logged-in users only) */
  async getCookieConsent(): Promise<{ found: boolean; necessary?: boolean; analytics?: boolean; marketing?: boolean; savedAt?: string } | null> {
    try {
      const res = await fetch(`${API}/gdpr/cookie-consent`, { headers: authHeaders() });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },
};
