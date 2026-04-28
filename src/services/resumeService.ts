/**
 * Resume Service
 * Handles fetching presigned S3 URLs from backend for secure resume access
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface ResumeResponse {
  presignedUrl?: string;
  downloadUrl?: string;
  candidateName?: string;
  error?: string;
}

/**
 * Get presigned URL for viewing resume by application ID
 * Backend endpoint: GET /api/applications/:id/resume
 * Returns: { presignedUrl, downloadUrl?, candidateName? }
 */
export const getResumeByApplicationId = async (applicationId: string): Promise<ResumeResponse> => {
  try {
    const res = await fetch(`${API_BASE}/applications/${applicationId}/resume`);
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Failed to fetch resume' }));
      return { error: error.error || error.message || 'Resume not found' };
    }
    return await res.json();
  } catch (error) {
    console.error('getResumeByApplicationId error:', error);
    return { error: 'Network error while fetching resume' };
  }
};

/**
 * Get presigned URL for viewing resume by candidate email
 * Backend endpoint: GET /api/resume/presigned?email=...
 * Returns: { presignedUrl, downloadUrl? }
 */
export const getResumeByEmail = async (email: string): Promise<ResumeResponse> => {
  try {
    const res = await fetch(`${API_BASE}/resume/presigned?email=${encodeURIComponent(email)}`);
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Failed to fetch resume' }));
      return { error: error.error || error.message || 'Resume not found' };
    }
    return await res.json();
  } catch (error) {
    console.error('getResumeByEmail error:', error);
    return { error: 'Network error while fetching resume' };
  }
};

/**
 * Download resume as blob via backend proxy
 * Backend endpoint: GET /api/applications/:id/resume/download
 * Streams S3 file through backend to avoid exposing S3 URLs
 */
export const downloadResumeByApplicationId = async (
  applicationId: string,
  candidateName: string = 'candidate'
): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE}/applications/${applicationId}/resume/download`);
    if (!res.ok) throw new Error('Download failed');
    
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${candidateName.replace(/\s+/g, '_')}_resume.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (error) {
    console.error('downloadResumeByApplicationId error:', error);
    throw error;
  }
};

/**
 * Download resume from presigned URL (fallback)
 */
export const downloadResumeFromUrl = async (
  url: string,
  candidateName: string = 'candidate'
): Promise<void> => {
  try {
    const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (!res.ok) throw new Error('Download failed');
    
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${candidateName.replace(/\s+/g, '_')}_resume.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (error) {
    console.error('downloadResumeFromUrl error:', error);
    // Last resort: open in new tab
    window.open(url, '_blank');
  }
};
