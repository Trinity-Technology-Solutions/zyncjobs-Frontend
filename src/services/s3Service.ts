import { API_ENDPOINTS } from '../config/env';

export interface S3UploadResponse {
  success: boolean;
  fileUrl?: string;
  error?: string;
}

export class S3Service {
  private static getAuthHeaders() {
    const token = sessionStorage.getItem('adminToken') || 
                  sessionStorage.getItem('accessToken') || 
                  localStorage.getItem('accessToken');
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  static async uploadResumeToS3(file: File): Promise<S3UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/upload/resume`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: formData
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Upload failed' };
      }

      return { 
        success: true, 
        fileUrl: result.fileUrl || result.file?.url 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  static async uploadTalentResumeToS3(file: File): Promise<S3UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/upload/talent-resume`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: formData
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Upload failed' };
      }

      return { 
        success: true, 
        fileUrl: result.fileUrl || result.file?.url 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }
}