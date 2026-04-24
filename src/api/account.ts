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
  getUserIdFromStorage(): string | null {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || user._id || null;
      }
      return null;
    } catch {
      return null;
    }
  },

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

  async deleteAccount(userId: string): Promise<DeleteAccountResponse> {
    try {
      const token = tokenStorage.getAccess();
      const res = await fetch(`${API}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json().catch(() => ({}));
      return {
        success: res.ok,
        message: res.ok ? 'Account deleted successfully' : (data.error || `Server error: ${res.status}`),
      };
    } catch (error) {
      return { success: false, message: 'Network error occurred', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async changeEmail(userId: string, newEmail: string): Promise<AccountAPIResponse> {
    try {
      const token = tokenStorage.getAccess();
      const res = await fetch(`${API}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: newEmail }),
      });
      if (res.ok) return { success: true, message: 'Email updated successfully!' };
      const data = await res.json().catch(() => ({}));
      return { success: false, message: data.error || `Server error: ${res.status}` };
    } catch (error) {
      return { success: false, message: 'Network error occurred', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<AccountAPIResponse> {
    try {
      const url = `${API}/users/${userId}/password`;
      console.log('🔐 Calling password update:', url);
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      console.log('🔐 Password update response status:', res.status);
      if (res.ok) return { success: true, message: 'Password updated successfully!' };
      const data = await res.json().catch(() => ({}));
      return { success: false, message: data.error || `Server error: ${res.status}` };
    } catch (error) {
      return { success: false, message: 'Network error occurred', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  clearUserData(): void {
    localStorage.removeItem('user');
    tokenStorage.clear();
    sessionStorage.clear();
  },
};
