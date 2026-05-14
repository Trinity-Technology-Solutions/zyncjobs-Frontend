import React, { useState, useEffect } from 'react';
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
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useGoogleViewer, setUseGoogleViewer] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setPresignedUrl(null);
    setError(null);
    setUseGoogleViewer(false);
    setCandidateName(directCandidateName || '');
    fetchPresignedUrl();
  }, [isOpen, applicationId, candidateEmail]);

  const fetchPresignedUrl = async () => {
    setLoading(true);
    setError(null);
    setUseGoogleViewer(false);

    try {
      if (applicationId) {
        const result = await getResumeByApplicationId(applicationId);
        if (result.presignedUrl) {
          setPresignedUrl(result.presignedUrl);
          if (result.candidateName) setCandidateName(prev => prev || result.candidateName!);
          return;
        }
      }

      if (candidateEmail) {
        const result = await getResumeByEmail(candidateEmail);
        if (result.presignedUrl) {
          setPresignedUrl(result.presignedUrl);
          return;
        }
      }

      if (directResumeUrl && directResumeUrl !== 'resume_from_quick_apply' && directResumeUrl.startsWith('http')) {
        setPresignedUrl(directResumeUrl);
        return;
      }

      setError('Resume not found. The candidate may not have uploaded a resume yet.');
    } catch {
      setError('Failed to load resume. Please try again.');
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

  // Determine viewer URL — use Google Docs viewer for PDFs to avoid S3 iframe CORS issues
  const isPdf = presignedUrl && (
    presignedUrl.toLowerCase().includes('.pdf') ||
    presignedUrl.toLowerCase().includes('content-type=application%2Fpdf')
  );
  const viewerUrl = presignedUrl
    ? useGoogleViewer || isPdf
      ? `https://docs.google.com/viewer?url=${encodeURIComponent(presignedUrl)}&embedded=true`
      : presignedUrl
    : null;

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
          <div className="flex items-center gap-2">
            {presignedUrl && (
              <button
                onClick={() => setUseGoogleViewer(v => !v)}
                className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                title="Switch viewer if resume doesn't display"
              >
                {useGoogleViewer ? 'Direct View' : 'Google Viewer'}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden p-4 min-h-0">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <p className="text-sm">Fetching resume from S3...</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 bg-red-50 rounded-xl p-6 border border-red-100">
              <span className="text-5xl">📄</span>
              <p className="font-medium text-red-700 text-center">{error}</p>
              <button
                onClick={fetchPresignedUrl}
                className="flex items-center gap-2 text-sm text-blue-600 border border-blue-300 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          )}

          {!loading && !error && viewerUrl && (
            <iframe
              key={viewerUrl}
              src={viewerUrl}
              title={`Resume - ${candidateName || 'Candidate'}`}
              className="w-full rounded-lg border border-gray-200 bg-gray-50"
              style={{ height: 'calc(92vh - 170px)', minHeight: '480px' }}
              onError={() => {
                // If direct iframe fails, switch to Google Docs viewer
                if (!useGoogleViewer) setUseGoogleViewer(true);
              }}
            />
          )}

          {!loading && !error && !presignedUrl && (
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
                onClick={() => window.open(presignedUrl, '_blank')}
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
