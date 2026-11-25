import { API_ENDPOINTS } from '../config/env';
import { tokenStorage } from '../utils/tokenStorage';


export interface LoginData {
  email: string;
  password: string;
  portal?: 'candidate' | 'employer';
}

export class AccountLockoutError extends Error {
  constructor(
    message: string,
    readonly lockoutMinutes: number | null,
    readonly deadline: number | null,
  ) {
    super(message);
    this.name = 'AccountLockoutError';
  }
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
  isTeamMember?: boolean;
  gstNumber?: string;
  gstVerification?: {
    verified: boolean;
    legalName?: string;
    tradeName?: string;
    status?: string;
    state?: string;
  } | null;
  // New company verification fields
  domainVerification?: {
    isValid: boolean;
    isCompanyDomain: boolean;
    verificationMethod: string;
    companyProfile?: any;
  } | null;
  companyProfile?: {
    id?: string;
    name: string;
    domain: string;
    logo?: string;
    website?: string;
    industry?: string;
    size?: string;
    verified?: boolean;
  } | null;
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
  // Account status field
  status?: 'active' | 'suspended' | 'deleted';
  // New verification fields
  verificationStatus?: 'pending' | 'pending_admin' | 'verified' | 'rejected';
  companyDomain?: string;
  companyProfile?: {
    id?: string;
    name: string;
    domain: string;
    logo?: string;
    website?: string;
    industry?: string;
    size?: string;
    verified?: boolean;
  };
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
      // Pass the full message for invite-only check
      throw new Error(error.message || error.error || 'An account with this email already exists. Please login instead.');
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
      const error = await response.json().catch(() => ({})) || {};
      if (response.status === 423) {
        const now = Date.now();
        const lockedUntil = Date.parse(error.lockedUntil);
        const serverTime = Date.parse(response.headers.get('Date') || '');
        const deadline = typeof error.remainingSeconds === 'number' && Number.isFinite(error.remainingSeconds)
          ? now + Math.max(0, error.remainingSeconds) * 1000
          : Number.isFinite(lockedUntil)
            ? Number.isFinite(serverTime) ? now + (lockedUntil - serverTime) : lockedUntil
            : null;
        const duration = Number(error.lockoutMinutes);
        throw new AccountLockoutError(
          error.error || 'Account is temporarily locked due to too many failed attempts.',
          Number.isFinite(duration) && duration > 0 ? duration : null,
          deadline,
        );
      }
      const fallback = response.status === 429
        ? 'Too many login requests. Please wait and try again.'
        : 'Incorrect email or password. Please try again.';
      throw Object.assign(new Error(error.error || fallback), {
        remainingAttempts: error.attemptsRemaining ?? error.remainingAttempts,
        response: { status: response.status, data: error },
      });
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
