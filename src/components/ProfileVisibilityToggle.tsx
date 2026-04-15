import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Users, Briefcase, CheckCircle } from 'lucide-react';
import { API_ENDPOINTS } from '../config/env';
import { apiFetch } from '../api/apiFetch';

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

const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className={`relative flex-shrink-0 w-11 h-6 rounded-full border-2 transition-colors duration-200 focus:outline-none ${
      on ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'
    }`}
  >
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md border border-gray-200 transition-transform duration-200 ${
      on ? 'translate-x-5' : 'translate-x-0'
    }`} />
  </button>
);

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
        const res = await apiFetch(`${API_ENDPOINTS.PROFILE}/${encodeURIComponent(userEmail)}`);
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

  const save = async (patch: Partial<{ openToWork: boolean; visibilityStatus: string; profileVisibility: string }>) => {
    setSaving(true);
    const payload = {
      openToWork: patch.openToWork ?? openToWork,
      visibilityStatus: patch.visibilityStatus ?? visibilityStatus,
      profileVisibility: patch.profileVisibility ?? profileVisibility,
    };
    try {
      const res = await apiFetch(`${API_ENDPOINTS.PROFILE}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, ...payload }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        onSave?.(payload);
        try {
          const stored = localStorage.getItem('user');
          if (stored) {
            const parsed = JSON.parse(stored);
            localStorage.setItem('user', JSON.stringify({ ...parsed, ...payload }));
            // Dispatch event so dashboard re-reads user from localStorage
            window.dispatchEvent(new Event('storage'));
          }
        } catch { /* silent */ }
      }
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const toggleOpenToWork = () => {
    const next = !openToWork;
    setOpenToWork(next);
    save({ openToWork: next });
  };

  const changeVisibility = (val: string) => {
    setVisibilityStatus(val);
    save({ visibilityStatus: val });
  };

  const changeProfileVisibility = (val: string) => {
    setProfileVisibility(val);
    save({ profileVisibility: val });
  };

  if (loading) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl" />;

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Profile Visibility</h3>
          {saving && <span className="text-xs text-gray-400">Saving...</span>}
          {saved && <span className="text-xs text-green-600 font-medium">✓ Saved</span>}
        </div>
        {/* Open to Work toggle */}
        <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
          <Briefcase className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span className="text-sm font-medium text-green-800 flex-1">Open to Work</span>
          <Toggle on={openToWork} onToggle={toggleOpenToWork} />
        </div>
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
          {/* Large toggle for full page */}
          <button
            onClick={toggleOpenToWork}
            className={`relative w-14 h-7 rounded-full border-2 transition-colors duration-300 focus:outline-none ${
              openToWork ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md border border-gray-200 transition-transform duration-300 ${
              openToWork ? 'translate-x-7' : 'translate-x-0'
            }`} />
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
              <input type="radio" name="visibilityStatus" value={opt.value} checked={visibilityStatus === opt.value}
                onChange={() => changeVisibility(opt.value)} className="sr-only" />
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
              <input type="radio" name="profileVisibility" value={opt.value} checked={profileVisibility === opt.value}
                onChange={() => changeProfileVisibility(opt.value)} className="sr-only" />
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

      {/* Save status indicator */}
      <div className="flex items-center justify-center gap-2 text-sm">
        {saving && <span className="text-gray-400">Saving changes...</span>}
        {saved && <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Changes saved!</span>}
        {!saving && !saved && <span className="text-gray-400 text-xs">Changes save automatically</span>}
      </div>
    </div>
  );
};

export default ProfileVisibilityToggle;
