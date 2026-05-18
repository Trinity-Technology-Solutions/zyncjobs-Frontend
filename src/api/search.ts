import { API_ENDPOINTS } from '../config/env';
import { searchAccuracy } from '../utils/searchAccuracy';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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

// Enhanced search with better accuracy
export const searchAPI = async (query?: string, location?: string): Promise<Job[]> => {
  try {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (location) params.append('location', location);
    
    const response = await fetch(`${API_BASE_URL}/search?${params}`);
    if (!response.ok) throw new Error('Search failed');
    
    const results = await response.json();
    
    // If we have search terms, enhance results with client-side accuracy scoring
    if (query && results.length > 0) {
      return enhanceSearchResults(results, query, location);
    }
    
    return results;
  } catch (error) {
    console.error('Search API error:', error);
    return [];
  }
};

// Enhanced search results with accuracy scoring
function enhanceSearchResults(jobs: Job[], query: string, location?: string): Job[] {
  return jobs
    .map(job => {
      let score = 0;
      const queryLower = query.toLowerCase();
      const jobTitleLower = job.jobTitle.toLowerCase();
      const companyLower = job.company.toLowerCase();
      const descriptionLower = job.description.toLowerCase();
      const skillsText = (job.skills || []).join(' ').toLowerCase();
      
      // Title matching (highest priority)
      if (jobTitleLower === queryLower) score += 100;
      else if (jobTitleLower.includes(queryLower)) score += 80;
      else if (queryLower.split(' ').some(word => jobTitleLower.includes(word))) score += 60;
      
      // Skills matching
      if (job.skills && job.skills.length > 0) {
        const skillMatches = searchAccuracy.getAccurateMatches(query, job.skills, 'skill');
        score += skillMatches.length * 15;
      }
      
      // Company matching
      if (companyLower.includes(queryLower)) score += 40;
      
      // Description matching
      if (descriptionLower.includes(queryLower)) score += 20;
      
      // Location matching (if provided)
      if (location && job.location) {
        const locationLower = job.location.toLowerCase();
        const searchLocationLower = location.toLowerCase();
        if (locationLower.includes(searchLocationLower)) score += 30;
      }
      
      return { ...job, searchScore: score };
    })
    .sort((a: any, b: any) => (b.searchScore || 0) - (a.searchScore || 0));
}

// Enhanced job search with filters and better accuracy
export const getJobs = async (page = 1, limit = 10, filters?: { 
  location?: string; 
  jobType?: string; 
  search?: string;
  skills?: string[];
  company?: string;
}) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (filters) {
      if (filters.location) params.append('location', filters.location);
      if (filters.jobType) params.append('jobType', filters.jobType);
      if (filters.search) params.append('search', filters.search);
      if (filters.company) params.append('company', filters.company);
      if (filters.skills && filters.skills.length > 0) {
        filters.skills.forEach(skill => params.append('skills', skill));
      }
    }
    
    const response = await fetch(`${API_BASE_URL}/jobs?${params}`);
    if (!response.ok) throw new Error('Failed to fetch jobs');
    
    const result = await response.json();
    
    // Enhance results with client-side accuracy if search term provided
    if (filters?.search && result.jobs && result.jobs.length > 0) {
      result.jobs = enhanceSearchResults(result.jobs, filters.search, filters.location);
    }
    
    return result;
  } catch (error) {
    console.error('Get jobs error:', error);
    return { jobs: [], total: 0, totalPages: 0, currentPage: 1 };
  }
};

// Auto-complete suggestions for search
export const getSearchSuggestions = async (query: string, type: 'job' | 'skill' | 'location' | 'company' = 'job'): Promise<string[]> => {
  try {
    if (!query || query.length < 1) {
      // Return popular suggestions based on type
      const popularSuggestions = {
        job: ['Software Engineer', 'Data Scientist', 'Product Manager', 'Frontend Developer', 'Backend Developer'],
        skill: ['JavaScript', 'Python', 'React', 'Java', 'SQL', 'HTML', 'CSS', 'Node.js'],
        location: ['Remote', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune'],
        company: ['Google', 'Microsoft', 'Amazon', 'TCS', 'Infosys', 'Wipro']
      };
      return popularSuggestions[type] || [];
    }
    
    // Try to get suggestions from API first
    const response = await fetch(`${API_BASE_URL}/autocomplete/${type}?q=${encodeURIComponent(query)}`);
    if (response.ok) {
      const suggestions = await response.json();
      return Array.isArray(suggestions) ? suggestions.slice(0, 10) : [];
    }
    
    // Fallback to client-side suggestions
    return getClientSideSuggestions(query, type);
  } catch (error) {
    console.error('Get suggestions error:', error);
    return getClientSideSuggestions(query, type);
  }
};

// Client-side fallback suggestions
function getClientSideSuggestions(query: string, type: string): string[] {
  const datasets = {
    job: [
      'Software Engineer', 'Data Scientist', 'Product Manager', 'Frontend Developer',
      'Backend Developer', 'Full Stack Developer', 'DevOps Engineer', 'UI/UX Designer',
      'Mobile Developer', 'React Developer', 'Python Developer', 'Java Developer',
      'Machine Learning Engineer', 'Cloud Engineer', 'Cybersecurity Analyst'
    ],
    skill: [
      'JavaScript', 'Python', 'React', 'Java', 'Node.js', 'Angular', 'Vue.js',
      'TypeScript', 'HTML', 'CSS', 'SQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes'
    ],
    location: [
      'Remote', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune',
      'Kolkata', 'Ahmedabad', 'Surat', 'New York', 'London', 'Singapore'
    ],
    company: [
      'Google', 'Microsoft', 'Amazon', 'Apple', 'Facebook', 'Netflix', 'Uber',
      'TCS', 'Infosys', 'Wipro', 'Accenture', 'IBM', 'Oracle', 'Flipkart'
    ]
  };
  
  const dataset = datasets[type as keyof typeof datasets] || [];
  return searchAccuracy.getAccurateMatches(query, dataset, type as any)
    .slice(0, 8)
    .map(m => m.item);
}

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
