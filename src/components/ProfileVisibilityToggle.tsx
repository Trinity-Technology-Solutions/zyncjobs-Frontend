import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Users, Briefcase, CheckCircle } from 'lucide-react';
import { API_ENDPOINTS } from '../config/env';

interface ProfileVisibilityToggleProps {
  userEmail: string;
  onSave?: (data: { openToWork: boolean; visibilityStatus: string; profileVisibility: string }) => void;
  compact?: boolean;
}

const VISIBILITY_OPTIONS = [
  { value: 'actively-looking', label: 'Actively Looking', desc: 'Recruiters can see you are actively job hunting', color: 'bg-green-500', textColor: 'text-green-700', bg: 'bg-green-50 border-green-300' },
  { value: 'passively-looking', label: 'Open to Opportunities', desc: 'Open to hear about roles but not actively searching', color: 'bg-blue-500', textColor: 'text-blue-700', bg: 'bg-blue-50 border-blue-300' },
  { value: 'not-looking', label: 'Not Looking', desc: 'Not interested in new opportunities right now', color: 'bg-gray-400', textColor: 'text-gray-600', bg: 'bg-gray-50 border-gray-300' },
];

const PROFILE_VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', desc: 'Everyone can see your profile', icon: <Eye className="w-4 h-4" /> },
  { value: 'recruiters-only', label: 'Recruiters Only', desc: 'Only verified recruiters can see your profile', icon: <Users className="w-4 h-4" /> },
  { value: 'private', label: 'Private', desc: 'Your profile is hidden from search', icon: <EyeOff className="w-4 h-4" /> },
];

const ProfileVisibilityToggle: React.FC<ProfileVisibilityToggleProps> = ({ userEmail, onSave, compact = false }) => {
  const [openToWork, setOpenToWork] = useState(false);
  const [visibilityStatus, setVisibilityStatus] = useState('passively-looking');
  const [profileVisibility, setProfileVisibility] = useState('public');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVisibility = async () => {
      try {
        const res = await fetch(`${API_ENDPOINTS.PROFILE}/${encodeURIComponent(userEmail)}`);
        if (res.ok) {
          const data = await res.json();
          setOpenToWork(data.openToWork ?? false);
          setVisibilityStatus(data.visibilityStatus ?? 'passively-looking');
          setProfileVisibility(data.profileVisibility ?? 'public');
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    if (userEmail) fetchVisibility();
  }, [userEmail]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.PROFILE}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, openToWork, visibilityStatus, profileVisibility }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        onSave?.({ openToWork, visibilityStatus, profileVisibility });
        // Update localStorage
        try {
          const stored = localStorage.getItem('user');
          if (stored) {
            const u = JSON.parse(stored);
            localStorage.setItem('user', JSON.stringify({ ...u, openToWork, visibilityStatus, profileVisibility }));
          }
        } catch { /* silent */ }
      }
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const currentStatus = VISIBILITY_OPTIONS.find(o => o.value === visibilityStatus);

  if (loading) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl" />;

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Profile Visibility</h3>
          <button onClick={handleSave} disabled={saving} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex-shrink-0">
            {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save'}
          </button>
        </div>
        {/* Open to Work toggle */}
        <div className="flex items-center gap-2 mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
          <Briefcase className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span className="text-sm font-medium text-green-800 flex-1">Open to Work</span>
          <button
            onClick={() => setOpenToWork(!openToWork)}
            className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors overflow-hidden ${openToWork ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${openToWork ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
        {/* Status select */}
        <select
          value={visibilityStatus}
          onChange={e => setVisibilityStatus(e.target.value)}
          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500"
        >
          {VISIBILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Visibility</h1>
        <p className="text-gray-500 text-sm mt-1">Control who can see your profile and your job search status</p>
      </div>

      {/* Open to Work Banner */}
      <div className={`rounded-2xl p-5 border-2 transition-all ${openToWork ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${openToWork ? 'bg-green-500' : 'bg-gray-300'}`}>
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Open to Work</p>
              <p className="text-xs text-gray-500">{openToWork ? 'Recruiters can see you are looking for jobs' : 'Hidden from recruiters'}</p>
            </div>
          </div>
          <button
            onClick={() => setOpenToWork(!openToWork)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${openToWork ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${openToWork ? 'translate-x-8' : 'translate-x-1'}`} />
          </button>
        </div>
        {openToWork && (
          <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-100 px-3 py-1.5 rounded-lg">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>A green "Open to Work" badge will appear on your profile photo</span>
          </div>
        )}
      </div>

      {/* Job Search Status */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Job Search Status</h3>
        <div className="space-y-3">
          {VISIBILITY_OPTIONS.map(opt => (
            <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${visibilityStatus === opt.value ? opt.bg : 'border-gray-100 hover:border-gray-200'}`}>
              <input type="radio" name="visibilityStatus" value={opt.value} checked={visibilityStatus === opt.value} onChange={() => setVisibilityStatus(opt.value)} className="sr-only" />
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${opt.color}`} />
              <div className="flex-1">
                <p className={`text-sm font-semibold ${visibilityStatus === opt.value ? opt.textColor : 'text-gray-700'}`}>{opt.label}</p>
                <p className="text-xs text-gray-500">{opt.desc}</p>
              </div>
              {visibilityStatus === opt.value && <CheckCircle className={`w-4 h-4 ${opt.textColor}`} />}
            </label>
          ))}
        </div>
      </div>

      {/* Profile Visibility */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Who Can See Your Profile</h3>
        <div className="space-y-3">
          {PROFILE_VISIBILITY_OPTIONS.map(opt => (
            <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${profileVisibility === opt.value ? 'bg-blue-50 border-blue-300' : 'border-gray-100 hover:border-gray-200'}`}>
              <input type="radio" name="profileVisibility" value={opt.value} checked={profileVisibility === opt.value} onChange={() => setProfileVisibility(opt.value)} className="sr-only" />
              <span className={`flex-shrink-0 ${profileVisibility === opt.value ? 'text-blue-600' : 'text-gray-400'}`}>{opt.icon}</span>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${profileVisibility === opt.value ? 'text-blue-700' : 'text-gray-700'}`}>{opt.label}</p>
                <p className="text-xs text-gray-500">{opt.desc}</p>
              </div>
              {profileVisibility === opt.value && <CheckCircle className="w-4 h-4 text-blue-600" />}
            </label>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saved ? <><CheckCircle className="w-5 h-5" /> Saved!</> : saving ? 'Saving...' : 'Save Visibility Settings'}
      </button>
    </div>
  );
};

export default ProfileVisibilityToggle;
