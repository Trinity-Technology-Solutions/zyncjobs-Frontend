import { apiFetch } from '../api/apiFetch';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface ResumeResponse {
  presignedUrl?: string;
  downloadUrl?: string;
  candidateName?: string;
  error?: string;
}

export const getResumeByApplicationId = async (applicationId: string): Promise<ResumeResponse> => {
  try {
    const res = await apiFetch(`${API_BASE}/applications/${applicationId}/resume`);
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

export const getResumeByEmail = async (email: string): Promise<ResumeResponse> => {
  // Return the stream URL directly — ResumeModal will blob-fetch it for inline viewing
  return { presignedUrl: `${API_BASE}/resume/presigned?email=${encodeURIComponent(email)}` };
};

export const downloadResumeByApplicationId = async (
  applicationId: string,
  candidateName: string = 'candidate'
): Promise<void> => {
  const res = await apiFetch(`${API_BASE}/applications/${applicationId}/resume/download`);
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  triggerDownload(blob, candidateName);
};

export const downloadResumeFromUrl = async (
  url: string,
  candidateName: string = 'candidate'
): Promise<void> => {
  try {
    const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (!res.ok) throw new Error('Download failed');
    triggerDownload(await res.blob(), candidateName);
  } catch {
    window.open(url, '_blank');
  }
};

function triggerDownload(blob: Blob, candidateName: string) {
  const ext = blob.type.includes('pdf') ? 'pdf' : 'docx';
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = `${candidateName.replace(/\s+/g, '_')}_resume.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}
