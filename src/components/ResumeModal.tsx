import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

interface ResumeModalProps {
  applicationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  resumeUrl?: string;
  candidateName?: string;
  candidateEmail?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const ResumeModal: React.FC<ResumeModalProps> = ({
  applicationId,
  isOpen,
  onClose,
  resumeUrl: directResumeUrl,
  candidateName: directCandidateName,
  candidateEmail,
}) => {
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setViewerUrl(null);
    setDownloadUrl(null);
    setError(null);
    setCandidateName(directCandidateName || '');
    resolveResume();
  }, [isOpen, applicationId, directResumeUrl, candidateEmail]);

  const resolveResume = async () => {
    setLoading(true);
    try {
      // Step 1: Try GET /api/applications/:id/resume — backend proxies S3 and returns presigned URL
      if (applicationId) {
        const res = await fetch(`${API_BASE}/applications/${applicationId}/resume`);
        if (res.ok) {
          const data = await res.json();
          // Backend returns { presignedUrl, downloadUrl, candidateName? }
          if (data.presignedUrl || data.url || data.resumeUrl) {
            const url = data.presignedUrl || data.url || data.resumeUrl;
            setViewerUrl(url);
            setDownloadUrl(data.downloadUrl || url);
            if (data.candidateName) setCandidateName(prev => prev || data.candidateName);
            return;
          }
        }
      }

      // Step 2: Try GET /api/resume/presigned?email=... — returns presigned URL for candidate's latest resume
      if (candidateEmail) {
        const res = await fetch(`${API_BASE}/resume/presigned?email=${encodeURIComponent(candidateEmail)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.presignedUrl || data.url) {
            const url = data.presignedUrl || data.url;
            setViewerUrl(url);
            setDownloadUrl(data.downloadUrl || url);
            return;
          }
        }
      }

      // Step 3: If directResumeUrl is already a presigned S3 URL (has X-Amz-Signature) use it directly
      if (directResumeUrl && directResumeUrl !== 'resume_from_quick_apply') {
        if (directResumeUrl.startsWith('http')) {
          setViewerUrl(directResumeUrl);
          setDownloadUrl(directResumeUrl);
          return;
        }
        // Relative path — prefix with API base origin
        const fullUrl = `${API_BASE}${directResumeUrl.startsWith('/') ? '' : '/'}${directResumeUrl}`;
        setViewerUrl(fullUrl);
        setDownloadUrl(fullUrl);
        return;
      }

      setError('Resume not found. The candidate may not have uploaded a resume yet.');
    } catch (e) {
      console.error('ResumeModal resolveResume error:', e);
      setError('Failed to load resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!downloadUrl) return;
    try {
      // Use backend download proxy: GET /api/applications/:id/resume/download
      const proxyDownload = applicationId
        ? `${API_BASE}/applications/${applicationId}/resume/download`
        : downloadUrl;

      const res = await fetch(proxyDownload);
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${(candidateName || 'candidate').replace(/\s+/g, '_')}_resume.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } else {
        // Fallback: open in new tab
        window.open(downloadUrl, '_blank');
      }
    } catch {
      window.open(downloadUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {candidateName ? `Resume — ${candidateName}` : 'Resume Viewer'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden p-4">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <p className="text-sm">Loading resume...</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 bg-red-50 rounded-lg p-6">
              <span className="text-4xl">📄</span>
              <p className="font-medium text-red-700">{error}</p>
              <button
                onClick={resolveResume}
                className="text-sm text-blue-600 border border-blue-300 px-4 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && viewerUrl && (
            <iframe
              src={viewerUrl}
              title="Resume"
              className="w-full rounded-lg border border-gray-200"
              style={{ height: 'calc(90vh - 160px)', minHeight: '500px' }}
            />
          )}

          {!loading && !error && !viewerUrl && (
            <div className="flex flex-col items-center justify-center h-64 gap-2 bg-gray-50 rounded-lg p-6">
              <span className="text-4xl">📄</span>
              <p className="font-medium text-gray-700">Resume not available</p>
              <p className="text-sm text-gray-500 text-center">
                {candidateName ? `${candidateName} has` : 'The candidate has'} not uploaded a resume yet.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-200 justify-end flex-shrink-0">
          {viewerUrl && (
            <>
              <button
                onClick={() => window.open(viewerUrl, '_blank')}
                className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Open in new tab
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeModal;
