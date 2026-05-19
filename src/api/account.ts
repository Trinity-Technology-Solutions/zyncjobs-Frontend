import { apiFetch } from './apiFetch';
import { config, API_ENDPOINTS } from '../config/env';
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

      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload || payload.exp * 1000 < Date.now()) return null;

      // Try API first, fall back to JWT payload on any error
      const userId = payload.userId || payload.id || payload._id || payload.sub;
      if (userId) {
        try {
          const res = await apiFetch(`${API}/users/${userId}`);
          if (res.ok) return res.json();
        } catch { /* fall through to payload */ }
      }

      return {
        id: userId,
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
      // Use the proper GDPR delete endpoint
      const res = await apiFetch(API_ENDPOINTS.GDPR_DELETE_ACCOUNT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userId,
          confirmDeletion: true,
          reason: 'User requested account deletion'
        })
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (res.ok) {
        return {
          success: true,
          message: data.message || 'Account deleted successfully'
        };
      } else {
        return {
          success: false,
          message: data.error || data.message || `Server error: ${res.status}`,
          error: data.error
        };
      }
    } catch (error) {
      console.error('Account deletion error:', error);
      return { 
        success: false, 
        message: 'Network error occurred', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  async exportUserData(userId: string): Promise<any> {
    try {
      const res = await apiFetch(API_ENDPOINTS.GDPR_DOWNLOAD_DATA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId })
      });
      
      if (res.ok) {
        return await res.json();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${res.status}`);
      }
    } catch (error) {
      console.error('Data export error:', error);
      throw error;
    }
  },

  async changeEmail(userId: string, newEmail: string): Promise<AccountAPIResponse> {
    try {
      const res = await apiFetch(`${API}/users/${userId}`, {
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

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<AccountAPIResponse> {
    try {
      const res = await apiFetch(`${API}/users/${userId}/password`, {
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
    // Clear main user data
    localStorage.removeItem('user');
    localStorage.removeItem('lastUserType');
    
    // Clear tokens
    tokenStorage.clear();
    
    // Clear session storage
    sessionStorage.clear();
    
    // Clear all authentication-related items
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authToken');
    
    // Clear privacy settings
    localStorage.removeItem('zync_privacy_settings');
    localStorage.removeItem('zync_employer_privacy_settings');
    
    // Clear any saved job data (try common patterns)
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('savedJob') || key.includes('zync_') || key.startsWith('user_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  },

  clearAllUserData(): void {
    // More aggressive clearing for account deletion
    this.clearUserData();
    
    // Clear all localStorage items that might be user-related
    const allKeys = Object.keys(localStorage);
    const userRelatedKeys = allKeys.filter(key => 
      key.includes('user') || 
      key.includes('savedJob') || 
      key.includes('zync') || 
      key.includes('candidate') || 
      key.includes('employer') || 
      key.includes('profile') || 
      key.includes('application') || 
      key.includes('job') ||
      key.includes('auth') ||
      key.includes('token')
    );
    
    userRelatedKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn('Could not remove localStorage key:', key);
      }
    });
    
    // Force clear session storage again
    try {
      sessionStorage.clear();
    } catch (e) {
      console.warn('Could not clear sessionStorage');
    }
  },
};
