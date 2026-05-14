import { apiFetch } from './apiFetch';

export interface CompanyBenefit {
  id: string;
  benefit_type: string;
  benefit_name: string;
  benefit_description?: string;
  employee_count: number;
}

export interface CompanyDepartment {
  id: string;
  department_name: string;
  job_openings: number;
  avg_salary_min?: number;
  avg_salary_max?: number;
}

export interface EmployeeSalary {
  id: string;
  job_title: string;
  experience_min: number;
  experience_max: number;
  salary_min: number;
  salary_max: number;
  submission_count: number;
  location: string;
}

export interface CompanyReviewBreakdown {
  work_life_rating: number;
  salary_rating: number;
  culture_rating: number;
  growth_rating: number;
  security_rating: number;
  skill_development_rating: number;
}

export interface SimilarCompany {
  id: string;
  name: string;
  logo_url?: string;
  industry: string;
  similarity_score: number;
}

export interface EnhancedCompanyData {
  // Basic company info
  id: string;
  name: string;
  industry: string;
  description: string;
  company_type: string;
  founded_year: number;
  tagline?: string;
  logo_url?: string;
  cover_photo_url?: string;
  website?: string;
  headquarters?: string;
  employees: string;
  
  // Enhanced fields
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  additional_locations?: string[];
  verification_status?: string;
  
  // Dynamic metrics
  avg_rating: number;
  review_count: number;
  follower_count: number;
  total_jobs: number;
  
  // Related data
  benefits: CompanyBenefit[];
  departments: CompanyDepartment[];
  salaries: EmployeeSalary[];
  review_breakdown: CompanyReviewBreakdown;
  similar_companies: SimilarCompany[];
}

class CompanyDataService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || '/api';
  }

  // Get enhanced company profile with all dynamic data
  async getEnhancedCompanyProfile(companyId: string): Promise<EnhancedCompanyData> {
    try {
      const response = await apiFetch(`${this.baseUrl}/companies/${encodeURIComponent(companyId)}/enhanced`);
      return response;
    } catch (error) {
      console.error('Error fetching enhanced company profile:', error);
      throw error;
    }
  }

  // Get company benefits
  async getCompanyBenefits(companyId: string): Promise<CompanyBenefit[]> {
    try {
      const response = await apiFetch(`${this.baseUrl}/companies/${encodeURIComponent(companyId)}/benefits`);
      return response.benefits || [];
    } catch (error) {
      console.error('Error fetching company benefits:', error);
      return [];
    }
  }

  // Get company departments with job openings
  async getCompanyDepartments(companyId: string): Promise<CompanyDepartment[]> {
    try {
      const response = await apiFetch(`${this.baseUrl}/companies/${encodeURIComponent(companyId)}/departments`);
      return response.departments || [];
    } catch (error) {
      console.error('Error fetching company departments:', error);
      return [];
    }
  }

  // Get salary data for company
  async getCompanySalaries(companyId: string): Promise<EmployeeSalary[]> {
    try {
      const response = await apiFetch(`${this.baseUrl}/companies/${encodeURIComponent(companyId)}/salaries`);
      return response.salaries || [];
    } catch (error) {
      console.error('Error fetching company salaries:', error);
      return [];
    }
  }

  // Get review breakdown by categories
  async getReviewBreakdown(companyId: string): Promise<CompanyReviewBreakdown> {
    try {
      const response = await apiFetch(`${this.baseUrl}/companies/${encodeURIComponent(companyId)}/review-breakdown`);
      return response.breakdown || {
        work_life_rating: 0,
        salary_rating: 0,
        culture_rating: 0,
        growth_rating: 0,
        security_rating: 0,
        skill_development_rating: 0
      };
    } catch (error) {
      console.error('Error fetching review breakdown:', error);
      return {
        work_life_rating: 0,
        salary_rating: 0,
        culture_rating: 0,
        growth_rating: 0,
        security_rating: 0,
        skill_development_rating: 0
      };
    }
  }

  // Get similar companies
  async getSimilarCompanies(companyId: string): Promise<SimilarCompany[]> {
    try {
      const response = await apiFetch(`${this.baseUrl}/companies/${encodeURIComponent(companyId)}/similar`);
      return response.similar_companies || [];
    } catch (error) {
      console.error('Error fetching similar companies:', error);
      return [];
    }
  }

  // Follow/Unfollow company
  async toggleFollowCompany(companyId: string, userEmail: string, action: 'follow' | 'unfollow'): Promise<{ success: boolean; follower_count: number }> {
    try {
      const response = await apiFetch(`${this.baseUrl}/companies/${encodeURIComponent(companyId)}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail })
      });
      return response;
    } catch (error) {
      console.error(`Error ${action}ing company:`, error);
      throw error;
    }
  }

  // Submit employee salary data
  async submitSalaryData(companyId: string, salaryData: {
    job_title: string;
    experience_years: number;
    salary: number;
    location: string;
    user_email: string;
  }): Promise<{ success: boolean }> {
    try {
      const response = await apiFetch(`${this.baseUrl}/companies/${encodeURIComponent(companyId)}/salary-submission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salaryData)
      });
      return response;
    } catch (error) {
      console.error('Error submitting salary data:', error);
      throw error;
    }
  }

  // Submit company benefit feedback
  async submitBenefitFeedback(companyId: string, benefitData: {
    benefit_type: string;
    benefit_name: string;
    user_email: string;
    has_benefit: boolean;
  }): Promise<{ success: boolean }> {
    try {
      const response = await apiFetch(`${this.baseUrl}/companies/${encodeURIComponent(companyId)}/benefit-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(benefitData)
      });
      return response;
    } catch (error) {
      console.error('Error submitting benefit feedback:', error);
      throw error;
    }
  }
}

export const companyDataService = new CompanyDataService();