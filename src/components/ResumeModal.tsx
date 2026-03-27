import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ResumeModalProps {
  applicationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  resumeUrl?: string;
  candidateName?: string;
  candidateEmail?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const buildFullUrl = (fileUrl: string) => {
  if (!fileUrl || fileUrl === 'resume_from_quick_apply') return null;
  if (fileUrl.startsWith('http')) {
    try {
      const url = new URL(fileUrl);
      // Keep absolute URL if it's an external host, otherwise use backend base
      if (url.hostname !== window.location.hostname) return fileUrl;
      return `${API_BASE_URL.replace('/api', '')}${url.pathname}${url.search}`;
    } catch {
      return fileUrl;
    }
  }
  const path = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
  // Route /uploads through the backend base URL to avoid frontend router catching it
  if (path.startsWith('/uploads')) {
    return `${API_BASE_URL.replace('/api', '')}${path}`;
  }
  return path;
};

const ResumeModal: React.FC<ResumeModalProps> = ({
  applicationId, isOpen, onClose,
  resumeUrl: directResumeUrl,
  candidateName: directCandidateName,
  candidateEmail
}) => {
  const [resumeFileUrl, setResumeFileUrl] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noResume, setNoResume] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setResumeFileUrl(null);
    setError(null);
    setNoResume(false);
    setCandidateName(directCandidateName || '');

    const resolved = directResumeUrl ? buildFullUrl(directResumeUrl) : null;
    if (resolved) {
      setResumeFileUrl(resolved);
    } else if (candidateEmail) {
      fetchFromProfile(candidateEmail);
    } else if (applicationId) {
      fetchFromApi(applicationId);
    } else {
      setNoResume(true);
    }
  }, [isOpen, applicationId, directResumeUrl, candidateEmail]);

  const fetchFromProfile = async (email: string) => {
    setLoading(true);
    try {
      // Try users endpoint first (has full resume data)
      const res = await fetch(`${API_BASE_URL}/users?email=${encodeURIComponent(email)}`);
      let data: any = null;
      if (res.ok) {
        const users = await res.json();
        data = Array.isArray(users) ? users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase()) : users;
      }
      // Fallback to profile endpoint
      if (!data) {
        const profileRes = await fetch(`${API_BASE_URL}/profile/${encodeURIComponent(email)}`);
        if (profileRes.ok) data = await profileRes.json();
      }
      if (!data) throw new Error('User not found');

      console.log('User resume data:', JSON.stringify({ resume: data.resume, resumeUrl: data.resumeUrl }, null, 2));
      if (data.name || data.fullName) setCandidateName(prev => prev || data.name || data.fullName);

      const resume = data.resume || data.user?.resume;
      let fileUrl: string | null = null;

      if (resume?.url) {
        fileUrl = buildFullUrl(resume.url);
      } else if (resume?.fileUrl) {
        fileUrl = buildFullUrl(resume.fileUrl);
      } else if (resume?.filename) {
        fileUrl = buildFullUrl(`/uploads/${resume.filename}`);
      } else if (resume?.path) {
        fileUrl = buildFullUrl(resume.path);
      } else if (data.resumeUrl) {
        fileUrl = buildFullUrl(data.resumeUrl);
      } else if (resume?.name) {
        fileUrl = buildFullUrl(`/uploads/${resume.name}`);
      }

      console.log('Resolved fileUrl:', fileUrl);

      if (fileUrl) {
        // Verify the file actually exists
        try {
          const check = await fetch(fileUrl, { method: 'HEAD' });
          if (check.ok) {
            setResumeFileUrl(fileUrl);
          } else {
            setNoResume(true);
          }
        } catch {
          setResumeFileUrl(fileUrl); // try anyway in iframe
        }
      } else {
        setNoResume(true);
      }
    } catch (e) {
      console.error('fetchFromProfile error:', e);
      if (applicationId) await fetchFromApi(applicationId);
      else setNoResume(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchFromApi = async (appId: string) => {
    // resume-viewer endpoint doesn't exist — skip it, just mark no resume
    setNoResume(true);
  };

  const handleDownload = () => {
    if (!resumeFileUrl) return;
    const a = document.createElement('a');
    a.href = resumeFileUrl;
    a.download = 'resume.pdf';
    a.target = '_blank';
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">{candidateName ? `Resume - ${candidateName}` : 'Resume'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-6">
          {loading && <div className="text-center py-8 text-gray-600">Loading resume...</div>}
          {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error}</div>}

          {!loading && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {resumeFileUrl ? (
                <>
                  <iframe
                    src={`${resumeFileUrl}#toolbar=0&navpanes=0&view=FitH`}
                    width="100%"
                    height="600"
                    title="Resume"
                    style={{ minHeight: '600px' }}
                    onError={() => window.open(resumeFileUrl, '_blank')}
                  />
                  <div className="p-2 bg-gray-50 border-t text-center">
                    <button
                      onClick={() => window.open(resumeFileUrl, '_blank')}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      🔗 Can't see the PDF? Open in new tab
                    </button>
                  </div>
                </>
              ) : noResume || (!loading && !error) ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-gray-50 p-6">
                  <span className="text-4xl mb-3">📄</span>
                  <p className="font-medium text-gray-700">Resume not accessible</p>
                  <p className="text-sm mt-2 text-center text-gray-500">
                    {candidateName ? `Ask ${candidateName} to` : 'The candidate needs to'} re-upload their resume from their profile page to make it viewable.
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200 justify-end">
          <button
            onClick={handleDownload}
            disabled={!resumeFileUrl}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📥 Download Resume
          </button>
          <button onClick={onClose} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeModal;
