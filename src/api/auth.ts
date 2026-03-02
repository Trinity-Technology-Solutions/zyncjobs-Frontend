import { API_ENDPOINTS } from '../config/env';

const API_BASE_URL = API_ENDPOINTS.USERS.replace('/users', ''); // Get base API URL

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
}

export interface User {
  id: string;
  email: string;
  userType: 'jobseeker' | 'employer';
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
}

export const authAPI = {
  async register(userData: RegisterData): Promise<{ id: string; message: string; userType: string; user?: any; accessToken?: string; refreshToken?: string }> {
    console.log('Calling register API:', API_ENDPOINTS.REGISTER);
    console.log('Register data:', { ...userData, password: '***' });
    
    const response = await fetch(API_ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    console.log('Register response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Register error response:', errorText);
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: 'Registration failed' };
      }
      throw new Error(error.error || 'User already exists with this email');
    }

    const result = await response.json();
    console.log('Register success:', result);
    
    // Store tokens if provided
    if (result.accessToken) {
      localStorage.setItem('accessToken', result.accessToken);
    }
    if (result.refreshToken) {
      localStorage.setItem('refreshToken', result.refreshToken);
    }
    
    return result;
  },

  async login(loginData: LoginData): Promise<{ message: string; user: User; accessToken?: string; refreshToken?: string }> {
    console.log('Calling login API:', API_ENDPOINTS.LOGIN);
    console.log('Login data:', { email: loginData.email, password: '***' });
    
    const response = await fetch(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    console.log('Login response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Login error response:', errorText);
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: 'Invalid login data' };
      }
      throw new Error(error.error || 'Invalid login data');
    }

    const result = await response.json();
    console.log('Login success:', result);
    
    // Store tokens if provided
    if (result.accessToken) {
      localStorage.setItem('accessToken', result.accessToken);
    }
    if (result.refreshToken) {
      localStorage.setItem('refreshToken', result.refreshToken);
    }
    
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