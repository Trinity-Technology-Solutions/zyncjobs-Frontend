import { API_ENDPOINTS } from '../config/env';

export interface AccountAPIResponse {
  success: boolean;
  message: string;
  error?: string;
}

export type DeleteAccountResponse = AccountAPIResponse;

export const accountAPI = {
  /**
   * Delete user account with proper authentication and error handling
   */
  async deleteAccount(userId: string): Promise<DeleteAccountResponse> {
    try {
      // Get authentication token
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('accessToken') || 
                   localStorage.getItem('authToken');
      
      // Determine API URL with fallbacks
      const apiUrl = import.meta.env.VITE_API_URL || 
                    window.location.origin + '/api' || 
                    '/api';
      
      console.log('🌐 Using API URL:', apiUrl);
      console.log('🔑 Using token:', token ? 'Present' : 'Not found');
      console.log('🆔 Deleting user ID:', userId);
      
      // Prepare headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add authentication if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Make delete request
      const response = await fetch(`${apiUrl}/users/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers,
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Handle response
      let responseData;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }
      } catch (parseError) {
        console.warn('⚠️ Could not parse response:', parseError);
        responseData = 'Could not parse response';
      }
      
      console.log('📡 Response data:', responseData);
      
      if (response.ok) {
        return {
          success: true,
          message: 'Account deleted successfully from server'
        };
      } else {
        return {
          success: false,
          message: `Server error: ${response.status}`,
          error: typeof responseData === 'string' ? responseData : responseData?.error || 'Unknown error'
        };
      }
      
    } catch (error) {
      console.error('❌ Delete account error:', error);
      return {
        success: false,
        message: 'Network error occurred',
        error: error instanceof Error ? error.message : 'Unknown network error'
      };
    }
  },

  async changeEmail(userId: string, newEmail: string): Promise<AccountAPIResponse> {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiUrl}/users/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email: newEmail }),
      });
      if (response.ok) {
        return { success: true, message: 'Email updated successfully!' };
      }
      const data = await response.json().catch(() => ({}));
      return { success: false, message: data.error || `Server error: ${response.status}` };
    } catch (error) {
      return { success: false, message: 'Network error occurred', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<AccountAPIResponse> {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiUrl}/users/${encodeURIComponent(userId)}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (response.ok) {
        return { success: true, message: 'Password updated successfully!' };
      }
      const data = await response.json().catch(() => ({}));
      return { success: false, message: data.error || `Server error: ${response.status}` };
    } catch (error) {
      return { success: false, message: 'Network error occurred', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Extract user ID from localStorage with multiple fallbacks
   */
  getUserIdFromStorage(): string | null {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        console.warn('⚠️ No user data in localStorage');
        return null;
      }
      
      const parsedUser = JSON.parse(userData);
      console.log('👤 Parsed user data:', parsedUser);
      
      // Try multiple possible user ID fields
      const userId = parsedUser.id || 
                    parsedUser._id || 
                    parsedUser.userId || 
                    parsedUser.email;
      
      if (!userId) {
        console.error('❌ No user ID found in any expected field');
        return null;
      }
      
      console.log('🆔 Extracted user ID:', userId);
      return userId;
      
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
      return null;
    }
  },

  /**
   * Clear all user data from localStorage
   */
  clearUserData(): void {
    console.log('🧹 Clearing all user data from localStorage...');
    
    // Remove specific items first
    const itemsToRemove = [
      'user',
      'token',
      'accessToken',
      'refreshToken',
      'authToken',
      'selectedJob',
      'companyLogo',
      'companyName',
      'employerName',
      'userType',
      'dashboardStats',
      'recentActivity'
    ];
    
    itemsToRemove.forEach(item => {
      localStorage.removeItem(item);
    });
    
    // Clear everything as fallback
    localStorage.clear();
    
    // Clear session storage as well
    sessionStorage.clear();
    
    console.log('✅ User data cleared');
  }
};