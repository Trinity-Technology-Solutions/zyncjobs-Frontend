import { apiFetch } from './apiFetch';
import { config } from '../config/env';
import { tokenStorage } from '../utils/tokenStorage';

const API = config.API_URL;

export interface AccountAPIResponse {
  success: boolean;
  message: string;
  error?: string;
}

export type DeleteAccountResponse = AccountAPIResponse;

export const accountAPI = {
  async getMe(): Promise<any | null> {
    try {
      const token = tokenStorage.getAccess();
      if (!token) return null;

      // Decode user info from JWT payload (avoids /users/me UUID issue)
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload || payload.exp * 1000 < Date.now()) return null;

      // JWT uses 'userId' field (not 'id' or 'sub')
      const userId = payload.userId || payload.id || payload._id || payload.sub;
      if (userId) {
        const res = await apiFetch(`${API}/users/${userId}`);
        if (res.ok) return res.json();
      }

      // Fallback: return what we have from token payload
      return {
        id: payload.userId || payload.id || payload._id || payload.sub,
        email: payload.email,
        name: payload.name,
        userType: payload.userType || payload.role || 'candidate',
        role: payload.role || payload.userType || 'candidate',
      };
    } catch {
      return null;
    }
  },

  async deleteAccount(): Promise<DeleteAccountResponse> {
    try {
      const res = await apiFetch(`${API}/users/me`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      return {
        success: res.ok,
        message: res.ok ? 'Account deleted successfully' : (data.error || `Server error: ${res.status}`),
      };
    } catch (error) {
      return { success: false, message: 'Network error occurred', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async changeEmail(newEmail: string): Promise<AccountAPIResponse> {
    try {
      const res = await apiFetch(`${API}/users/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail }),
      });
      if (res.ok) return { success: true, message: 'Email updated successfully!' };
      const data = await res.json().catch(() => ({}));
      return { success: false, message: data.error || `Server error: ${res.status}` };
    } catch (error) {
      return { success: false, message: 'Network error occurred', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<AccountAPIResponse> {
    try {
      const res = await apiFetch(`${API}/users/me/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) return { success: true, message: 'Password updated successfully!' };
      const data = await res.json().catch(() => ({}));
      return { success: false, message: data.error || `Server error: ${res.status}` };
    } catch (error) {
      return { success: false, message: 'Network error occurred', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  clearUserData(): void {
    tokenStorage.clear();
    sessionStorage.clear();
  },
};
