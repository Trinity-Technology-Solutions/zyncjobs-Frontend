import { API_ENDPOINTS } from '../config/env';
import { apiFetch } from '../api/apiFetch';

export interface ResumeValidationResult {
  hasResume: boolean;
  resumeUrl?: string;
  resumeFileName?: string;
  message?: string;
}

/**
 * Validates if user has uploaded a resume
 * @param userEmail - User's email address
 * @returns Promise<ResumeValidationResult>
 */
export const validateUserResume = async (userEmail: string): Promise<ResumeValidationResult> => {
  if (!userEmail) {
    return {
      hasResume: false,
      message: 'User email is required for resume validation'
    };
  }

  try {
    // Fetch user profile to check for resume
    const profileRes = await apiFetch(`${API_ENDPOINTS.BASE_URL}/profile/${encodeURIComponent(userEmail)}`);
    
    if (!profileRes.ok) {
      return {
        hasResume: false,
        message: 'Unable to fetch user profile'
      };
    }

    const profileData = await profileRes.json();
    const resume = profileData.resume;
    
    // Check multiple possible resume URL fields
    const resumeUrl = profileData.resumeUrl 
      || resume?.url 
      || resume?.fileUrl 
      || resume?.path;

    if (!resumeUrl) {
      return {
        hasResume: false,
        message: 'No resume found. Please upload your resume in your profile before applying for jobs.'
      };
    }

    // Get resume filename
    const resumeFileName = resume?.name 
      || resume?.filename 
      || resume?.originalName
      || (resumeUrl ? resumeUrl.split('/').pop() : 'Resume');

    return {
      hasResume: true,
      resumeUrl,
      resumeFileName,
      message: 'Resume found and ready for application'
    };

  } catch (error) {
    console.error('Resume validation error:', error);
    return {
      hasResume: false,
      message: 'Error checking resume status. Please try again.'
    };
  }
};

/**
 * Shows appropriate alert message for resume validation
 * @param result - Resume validation result
 * @param redirectToDashboard - Whether to redirect to dashboard for resume upload
 */
export const handleResumeValidationAlert = (
  result: ResumeValidationResult, 
  redirectToDashboard: boolean = true
) => {
  if (!result.hasResume) {
    const message = result.message || 'Resume required to apply for jobs';
    
    // Show alert and then redirect after user acknowledges
    window.dispatchEvent(new CustomEvent('zync:alert', { 
      detail: { 
        message: `📄 ${message} Please upload your resume in your profile to continue.`
      } 
    }));
    
    // Redirect to dashboard after a short delay if requested
    if (redirectToDashboard) {
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    }
  }
};

/**
 * Quick validation for localStorage user data
 * @param userData - User data from localStorage
 * @returns boolean indicating if resume exists
 */
export const quickResumeCheck = (userData: any): boolean => {
  if (!userData) return false;
  
  const resume = userData.resume;
  const resumeUrl = userData.resumeUrl 
    || resume?.url 
    || resume?.fileUrl 
    || resume?.path;
    
  return !!resumeUrl;
};