import React, { useState, useEffect } from 'react';
import { CheckCircle, Loader, AlertCircle, X } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface LinkedInProfile {
  name: string;
  email: string;
  headline: string;
  location: string;
  profilePhoto: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    startYear: string;
    endYear: string;
  }>;
  summary: string;
}

interface LinkedInConnectProps {
  onImport: (profile: LinkedInProfile) => void;
  onClose?: () => void;
  /** 'button' = inline button only, 'modal' = shows preview modal after import */
  mode?: 'button' | 'modal';
  className?: string;
}

// ── LinkedIn SVG icon ──────────────────────────────────────────────────────────
const LinkedInIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

// ── Preview modal ──────────────────────────────────────────────────────────────
const ImportPreviewModal: React.FC<{
  profile: LinkedInProfile;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ profile, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Import from LinkedIn</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile header */}
        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl mb-5">
          {profile.profilePhoto ? (
            <img src={profile.profilePhoto} alt={profile.name} className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-xl">
              {profile.name?.[0] || 'L'}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{profile.name}</p>
            <p className="text-sm text-gray-600">{profile.headline}</p>
            <p className="text-xs text-gray-400">{profile.location}</p>
          </div>
        </div>

        {/* What will be imported */}
        <p className="text-sm font-medium text-gray-700 mb-3">The following will be imported into your profile:</p>
        <div className="space-y-2 mb-6">
          {[
            { label: 'Name', value: profile.name },
            { label: 'Email', value: profile.email },
            { label: 'Location', value: profile.location },
            { label: 'Summary', value: profile.summary ? `${profile.summary.slice(0, 80)}...` : null },
            { label: 'Skills', value: profile.skills.length > 0 ? `${profile.skills.slice(0, 5).join(', ')}${profile.skills.length > 5 ? ` +${profile.skills.length - 5} more` : ''}` : null },
            { label: 'Experience', value: profile.experience.length > 0 ? `${profile.experience.length} position(s)` : null },
            { label: 'Education', value: profile.education.length > 0 ? `${profile.education.length} entry(s)` : null },
          ].filter(item => item.value).map(item => (
            <div key={item.label} className="flex items-start gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-500 w-20 flex-shrink-0">{item.label}:</span>
              <span className="text-gray-800">{item.value}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 mb-5">
          Existing profile data will be merged. LinkedIn data takes priority where both exist.
        </p>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-[#0A66C2] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#004182] flex items-center justify-center gap-2"
          >
            <LinkedInIcon />
            Import Profile
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
const LinkedInConnect: React.FC<LinkedInConnectProps> = ({
  onImport,
  onClose,
  mode = 'modal',
  className = '',
}) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'preview' | 'success' | 'error'>('idle');
  const [profile, setProfile] = useState<LinkedInProfile | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle OAuth callback — LinkedIn redirects back with ?token=...&linkedin=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const isLinkedin = params.get('linkedin');
    if (!token || !isLinkedin) return;

    // Clean URL immediately
    window.history.replaceState({}, document.title, window.location.pathname);
    fetchLinkedInProfile(token);
  }, []);

  const initiateOAuth = () => {
    setStatus('loading');
    // Backend handles the LinkedIn OAuth redirect
    window.location.href = `${API_BASE}/auth/linkedin/candidate`;
  };

  const fetchLinkedInProfile = async (token: string) => {
    setStatus('loading');
    try {
      const res = await fetch(`${API_BASE}/auth/linkedin/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch LinkedIn profile');
      const data: LinkedInProfile = await res.json();
      setProfile(data);
      setStatus(mode === 'modal' ? 'preview' : 'success');
      if (mode === 'button') onImport(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'LinkedIn import failed');
      setStatus('error');
    }
  };

  const handleConfirm = () => {
    if (profile) {
      onImport(profile);
      setStatus('success');
    }
  };

  if (status === 'success') {
    return (
      <div className={`flex items-center gap-2 text-green-600 text-sm font-medium ${className}`}>
        <CheckCircle className="w-4 h-4" />
        LinkedIn profile imported!
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={initiateOAuth}
        disabled={status === 'loading'}
        className={`flex items-center justify-center gap-2 px-4 py-2.5 border border-[#0A66C2] text-[#0A66C2] rounded-xl text-sm font-medium hover:bg-[#0A66C2] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {status === 'loading' ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <LinkedInIcon />
        )}
        {status === 'loading' ? 'Connecting...' : 'Import from LinkedIn'}
      </button>

      {status === 'error' && (
        <div className="flex items-center gap-2 text-red-600 text-xs mt-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {errorMsg}
        </div>
      )}

      {status === 'preview' && profile && (
        <ImportPreviewModal
          profile={profile}
          onConfirm={handleConfirm}
          onCancel={() => { setStatus('idle'); onClose?.(); }}
        />
      )}
    </>
  );
};

export default LinkedInConnect;
export type { LinkedInProfile };
