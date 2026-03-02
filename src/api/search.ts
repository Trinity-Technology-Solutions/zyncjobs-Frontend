import { API_ENDPOINTS } from '../config/env';

const API_BASE_URL = API_ENDPOINTS.BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Types
export interface Job {
  _id?: string;
  jobTitle: string;
  company: string;
  location: string;
  jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance' | 'Internship';
  salary?: string;
  description: string;
  requirements?: string[];
  skills?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// API functions
export const searchAPI = async (query?: string, location?: string): Promise<Job[]> => {
  try {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (location) params.append('location', location);
    
    const response = await fetch(`${API_BASE_URL}/search?${params}`);
    if (!response.ok) throw new Error('Search failed');
    
    return await response.json();
  } catch (error) {
    console.error('Search API error:', error);
    return [];
  }
};

export const getJobs = async (page = 1, limit = 10, filters?: { location?: string; jobType?: string; search?: string }) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    
    const response = await fetch(`${API_BASE_URL}/jobs?${params}`);
    if (!response.ok) throw new Error('Failed to fetch jobs');
    
    return await response.json();
  } catch (error) {
    console.error('Get jobs error:', error);
    return { jobs: [], total: 0, totalPages: 0, currentPage: 1 };
  }
};

export const getJob = async (jobId: string): Promise<Job | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
    if (!response.ok) throw new Error('Failed to fetch job');
    
    return await response.json();
  } catch (error) {
    console.error('Get job error:', error);
    return null;
  }
};

export const createJob = async (jobData: Omit<Job, '_id' | 'createdAt' | 'updatedAt'>): Promise<Job> => {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create job');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Create job error:', error);
    throw error;
  }
};

export const testConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/test`);
    return await response.json();
  } catch (error) {
    console.error('Connection test error:', error);
    return { status: 'error', message: 'Failed to connect to backend' };
  }
};

export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    return { status: 'error', message: 'Backend not available' };
  }
};

export const registerUser = async (userData: {
  name: string;
  email: string;
  password: string;
  userType: 'candidate' | 'employer';
  phone?: string;
  company?: string;
  location?: string;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};