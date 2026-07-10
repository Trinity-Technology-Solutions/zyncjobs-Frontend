import React, { useState, useEffect, useRef } from 'react';
import { X, Download, ExternalLink, RefreshCw } from 'lucide-react';
import {
  getResumeByApplicationId,
  getResumeByEmail,
  downloadResumeByApplicationId,
  downloadResumeFromUrl,
} from '../services/resumeService';

interface ResumeModalProps {
  applicationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  resumeUrl?: string;
  candidateName?: string;
  candidateEmail?: string;
}

const ResumeModal: React.FC<ResumeModalProps> = ({
  applicationId,
  isOpen,
  onClose,
  resumeUrl: directResumeUrl,
  candidateName: directCandidateName,
  candidateEmail,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevBlobUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    // Revoke previous blob URL to free memory
    if (prevBlobUrl.current) {
      URL.revokeObjectURL(prevBlobUrl.current);
      prevBlobUrl.current = null;
    }
    setBlobUrl(null);
    setPresignedUrl(null);
    setError(null);
    setCandidateName(directCandidateName || '');
    fetchAndRenderResume();
  }, [isOpen, applicationId, candidateEmail]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
    };
  }, []);

  const fetchAndRenderResume = async () => {
    setLoading(true);
    setError(null);

    try {
      let rawUrl: string | null = null;

      // Step 1: get presigned URL from backend
      if (applicationId) {
        const result = await getResumeByApplicationId(applicationId);
        if (result.presignedUrl) {
          rawUrl = result.presignedUrl;
          if (result.candidateName) setCandidateName(prev => prev || result.candidateName!);
        }
      }

      if (!rawUrl && candidateEmail) {
        const result = await getResumeByEmail(candidateEmail);
        if (result.presignedUrl) rawUrl = result.presignedUrl;
      }

      // Fallback to direct S3 URL from application data
      if (!rawUrl && directResumeUrl && directResumeUrl !== 'resume_from_quick_apply') {
        rawUrl = directResumeUrl;
      }

      if (!rawUrl) {
        setError('Resume not found. The candidate may not have uploaded a resume yet.');
        return;
      }

      setPresignedUrl(rawUrl);

      const isBackendStream = rawUrl.startsWith('/') || rawUrl.includes('localhost') || rawUrl.includes(window.location.hostname);

      if (isBackendStream) {
        try {
          const res = await fetch(rawUrl, { mode: 'cors', credentials: 'omit' });
          if (!res.ok) throw new Error('fetch failed');
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('text/plain') || contentType.includes('application/json')) {
            const text = await res.text();
            const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
            prevBlobUrl.current = url;
            setBlobUrl(url);
          } else {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            prevBlobUrl.current = url;
            setBlobUrl(url);
          }
        } catch {
          setBlobUrl(rawUrl);
        }
      } else {
        try {
          const res = await fetch(rawUrl, { mode: 'cors', credentials: 'omit' });
          if (!res.ok) throw new Error('fetch failed');
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('text/plain') || contentType.includes('application/json')) {
            const text = await res.text();
            const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
            prevBlobUrl.current = url;
            setBlobUrl(url);
          } else {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            prevBlobUrl.current = url;
            setBlobUrl(url);
          }
        } catch {
          setBlobUrl(rawUrl);
        }
      }
    } catch {
      setError('Failed to load resume. Please try downloading it instead.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!presignedUrl) return;
    setDownloading(true);
    try {
      if (applicationId) {
        await downloadResumeByApplicationId(applicationId, candidateName);
      } else {
        await downloadResumeFromUrl(presignedUrl, candidateName);
      }
    } catch {
      window.open(presignedUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col"
        style={{ maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {candidateName ? `Resume — ${candidateName}` : 'Resume Viewer'}
            </h2>
            {candidateEmail && (
              <p className="text-xs text-gray-400 mt-0.5">{candidateEmail}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden p-4 min-h-0">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <p className="text-sm">Loading resume...</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 bg-red-50 rounded-xl p-6 border border-red-100">
              <span className="text-5xl">📄</span>
              <p className="font-medium text-red-700 text-center">{error}</p>
              <button
                onClick={fetchAndRenderResume}
                className="flex items-center gap-2 text-sm text-blue-600 border border-blue-300 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          )}

          {!loading && !error && blobUrl && (
            <iframe
              key={blobUrl}
              src={blobUrl}
              title={`Resume - ${candidateName || 'Candidate'}`}
              className="w-full rounded-lg border border-gray-200 bg-gray-50"
              style={{ height: 'calc(92vh - 170px)', minHeight: '480px' }}
            />
          )}

          {!loading && !error && !blobUrl && (
            <div className="flex flex-col items-center justify-center h-64 gap-2 bg-gray-50 rounded-xl p-6 border border-gray-100">
              <span className="text-5xl">📄</span>
              <p className="font-medium text-gray-700">No resume available</p>
              <p className="text-sm text-gray-500 text-center">
                {candidateName ? `${candidateName} has` : 'This candidate has'} not uploaded a resume yet.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-200 justify-end flex-shrink-0">
          {presignedUrl && (
            <>
              <button
                onClick={() => window.open(blobUrl || presignedUrl!, '_blank')}
                className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Open in new tab
              </button>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {downloading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {downloading ? 'Downloading...' : 'Download'}
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
