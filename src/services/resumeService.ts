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
  // /api/resume/presigned streams the PDF directly — return it as the stream URL for iframe
  return { presignedUrl: `${API_BASE}/resume/presigned?email=${encodeURIComponent(email)}` };
};

export const downloadResumeByApplicationId = async (
  applicationId: string,
  candidateName: string = 'candidate'
): Promise<void> => {
  const res = await apiFetch(`${API_BASE}/resume-viewer/download/${applicationId}`);
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
  const text = blob.type.includes('text/plain') || blob.type.includes('json') || blob.type.includes('xml')
    ? blob.text?.() ?? ''
    : '';

  const finalBlob = text
    ? new Blob([text], { type: 'text/plain;charset=utf-8' })
    : new Blob([blob], { type: blob.type || 'application/octet-stream' });

  const blobUrl = URL.createObjectURL(finalBlob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = `${candidateName.replace(/\s+/g, '_')}_resume.${text ? 'txt' : 'pdf'}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}
