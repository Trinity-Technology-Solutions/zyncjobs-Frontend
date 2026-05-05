/**
 * Company Profile API Service
 * Handles company profile CRUD operations
 */

import { API_ENDPOINTS } from '../config/env';
import { apiFetch } from './apiFetch';

export interface CompanyProfileData {
  description: string;
  industry: string;
  companySize: string;
  foundedYear: string;
  headquarters: string;
  website: string;
  phone: string;
  tagline: string;
  benefits: string[];
  locations: string[];
  socialLinks: {
    linkedin: string;
    twitter: string;
    facebook: string;
  };
}

export interface CompanyProfileResponse {
  success: boolean;
  profile?: CompanyProfileData & { id: string; logoUrl?: string };
  error?: string;
}

class CompanyProfileAPI {
  private getAuthHeaders() {
    return { 'Content-Type': 'application/json' };
  }

  /**
   * Get company profile
   */
  async getProfile(companyId: string): Promise<CompanyProfileResponse> {
    try {
      const response = await apiFetch(`${API_ENDPOINTS.COMPANIES}/${companyId}/profile`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return { success: true, profile: data.profile };
    } catch (error) {
      console.error('Get profile error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch profile' 
      };
    }
  }

  async updateProfile(companyId: string, profileData: CompanyProfileData): Promise<CompanyProfileResponse> {
    try {
      const response = await apiFetch(`${API_ENDPOINTS.COMPANIES}/${companyId}/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { success: true, profile: data.profile };
    } catch (error) {
      console.error('Update profile error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update profile' 
      };
    }
  }

  async uploadLogo(companyId: string, logoFile: File): Promise<{ success: boolean; logoUrl?: string; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);

      const response = await apiFetch(`${API_ENDPOINTS.COMPANIES}/${companyId}/upload-logo`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { success: true, logoUrl: data.logoUrl };
    } catch (error) {
      console.error('Upload logo error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload logo' 
      };
    }
  }

  async uploadCoverImage(companyId: string, coverFile: File): Promise<{ success: boolean; coverUrl?: string; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('cover', coverFile);

      const response = await apiFetch(`${API_ENDPOINTS.COMPANIES}/${companyId}/upload-cover`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { success: true, coverUrl: data.coverUrl };
    } catch (error) {
      console.error('Upload cover error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload cover image' 
      };
    }
  }

  async getCompletionStatus(companyId: string): Promise<{ 
    success: boolean; 
    completionPercentage?: number; 
    missingFields?: string[];
    error?: string;
  }> {
    try {
      const response = await apiFetch(`${API_ENDPOINTS.COMPANIES}/${companyId}/completion-status`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return { 
        success: true, 
        completionPercentage: data.completionPercentage,
        missingFields: data.missingFields 
      };
    } catch (error) {
      console.error('Get completion status error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch completion status' 
      };
    }
  }

  async markProfileCompleted(companyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiFetch(`${API_ENDPOINTS.COMPANIES}/${companyId}/mark-completed`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Mark completed error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to mark profile as completed' 
      };
    }
  }
}

export const companyProfileAPI = new CompanyProfileAPI();