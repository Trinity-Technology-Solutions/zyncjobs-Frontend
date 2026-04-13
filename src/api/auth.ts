import { API_ENDPOINTS } from '../config/env';
import { tokenStorage } from '../utils/tokenStorage';


export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  userType: 'candidate' | 'employer';
  phone?: string;
  company?: string;
  companyName?: string;
  companyLogo?: string;
  companyWebsite?: string;
  location?: string;
  employerId?: string;
}

export interface User {
  name: string;
  id: string;
  email: string;
  userType: 'jobseeker' | 'employer';
  role?: string;
  fullName: string;
  phone?: string;
  company?: string;
  companyName?: string;
  companyLogo?: string;
  companyWebsite?: string;
  companySize?: string;
  industry?: string;
  skills?: string[];
  experience?: string;
  location?: string;
  employerId?: string;
}

export const authAPI = {
  async register(userData: RegisterData): Promise<{ id: string; message: string; userType: string; user?: any; accessToken?: string; refreshToken?: string; verificationStatus?: string }> {
    
    const response = await fetch(API_ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: 'Registration failed' };
      }
      throw new Error(error.error || 'An account with this email already exists. Please login instead.');
    }

    const result = await response.json();
    
    if (result.accessToken) tokenStorage.setAccess(result.accessToken);
    if (result.refreshToken) tokenStorage.setRefresh(result.refreshToken);
    return result;
  },

  async login(loginData: LoginData): Promise<{ message: string; user: User; accessToken?: string; refreshToken?: string }> {
    const response = await fetch(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let error;
      try { error = JSON.parse(errorText); } catch { error = { error: 'Login failed' }; }
      throw new Error(error.error || 'Incorrect email or password. Please try again.');
    }

    const result = await response.json();
    if (result.accessToken) tokenStorage.setAccess(result.accessToken);
    if (result.refreshToken) tokenStorage.setRefresh(result.refreshToken);
    return result;
  },

  async getUser(userId: string): Promise<User> {
    const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get user');
    }

    return response.json();
  }
};
