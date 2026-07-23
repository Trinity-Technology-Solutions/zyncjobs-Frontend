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
  await triggerDownload(blob, candidateName);
};

export const downloadResumeFromUrl = async (
  url: string,
  candidateName: string = 'candidate'
): Promise<void> => {
  try {
    const res = await apiFetch(url);
    if (!res.ok) throw new Error('Download failed');
    await triggerDownload(await res.blob(), candidateName);
  } catch (error) {
    console.error('downloadResumeFromUrl error:', error);
  }
};

export const downloadResumeByEmail = async (
  email: string,
  candidateName: string = 'candidate'
): Promise<void> => {
  const url = `${API_BASE}/resume/proxy-download?email=${encodeURIComponent(email)}`;
  const res = await apiFetch(url);
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  await triggerDownload(blob, candidateName);
};

async function triggerDownload(blob: Blob, candidateName: string) {
  const isText = blob.type.includes('text/plain') || blob.type.includes('json') || blob.type.includes('xml');
  const text = isText && blob.text ? await blob.text() : '';

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
