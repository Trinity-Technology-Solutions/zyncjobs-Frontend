import React, { useState, useEffect } from 'react';
import { Shield, Download, Trash2, ToggleLeft, ToggleRight, Loader } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import { gdprAPI } from '../api/gdpr';
import { accountAPI } from '../api/account';

interface PrivacySettingsPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const DEFAULT_SETTINGS = {
  storeResume: true,
  allowEmployerView: true,
  receiveJobAlerts: true,
  allowAIRecommendations: true,
};

type SettingsKey = keyof typeof DEFAULT_SETTINGS;

const TOGGLES: { key: SettingsKey; label: string; desc: string }[] = [
  { key: 'storeResume',           label: 'Store my resume',                desc: 'Allow ZyncJobs to securely store your resume for job matching.' },
  { key: 'allowEmployerView',     label: 'Allow employers to view profile', desc: 'Employers can discover and view your profile in search results.' },
  { key: 'receiveJobAlerts',      label: 'Receive job alerts',             desc: 'Get email notifications about new matching job opportunities.' },
  { key: 'allowAIRecommendations',label: 'Allow AI-based recommendations', desc: 'Your resume data may be processed by AI to improve job recommendations.' },
];

const PrivacySettingsPage: React.FC<PrivacySettingsPageProps> = ({ onNavigate, user: propUser, onLogout }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const userId = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.id || u._id || u.userId || u.email || '';
    } catch { return ''; }
  })();

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    gdprAPI.getPrivacySettings(userId)
      .then(data => setSettings({ ...DEFAULT_SETTINGS, ...data }))
      .catch(() => {/* use defaults */})
      .finally(() => setLoading(false));
  }, [userId]);

  const toggle = async (key: SettingsKey) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    setSaving(true);
    try {
      await gdprAPI.updatePrivacySettings(userId, updated);
      setMsg({ text: 'Settings saved.', ok: true });
    } catch {
      setSettings(settings); // revert
      setMsg({ text: 'Failed to save. Please try again.', ok: false });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await gdprAPI.downloadMyData(userId);
      setMsg({ text: 'Your data download has started.', ok: true });
    } catch {
      setMsg({ text: 'Failed to download data. Please try again.', ok: false });
    } finally {
      setDownloading(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await (window as any).confirmAsync(
      'This will permanently delete your account, resume, and all data. This cannot be undone. Continue?'
    );
    if (!confirmed) return;
    const result = await gdprAPI.requestDeletion(userId);
    if (result.success) {
      accountAPI.clearUserData();
      if (onLogout) onLogout();
      setTimeout(() => onNavigate('home'), 1500);
    } else {
      setMsg({ text: result.message, ok: false });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onNavigate={onNavigate} user={propUser} onLogout={onLogout} />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <BackButton onClick={() => onNavigate('settings')} text="Back to Settings" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 mb-6 transition-colors" />

        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Privacy Settings</h1>
        </div>

        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.text}
          </div>
        )}

        {/* Toggles */}
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 mb-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader className="w-5 h-5 animate-spin mr-2" /> Loading settings…
            </div>
          ) : (
            TOGGLES.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between px-5 py-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => toggle(key)}
                  disabled={saving}
                  className="flex-shrink-0 text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
                  aria-label={`Toggle ${label}`}
                >
                  {settings[key]
                    ? <ToggleRight className="w-8 h-8" />
                    : <ToggleLeft className="w-8 h-8 text-gray-400" />}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Data actions */}
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {/* Download */}
          <div className="flex items-center justify-between px-5 py-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Download My Data</p>
              <p className="text-xs text-gray-500 mt-0.5">Get a copy of your profile, resume, and applications (GDPR portability).</p>
            </div>
            <button
              onClick={handleDownload}
              disabled={downloading || !userId}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
            >
              {downloading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download
            </button>
          </div>

          {/* Delete account */}
          <div className="flex items-center justify-between px-5 py-4 gap-4">
            <div>
              <p className="text-sm font-medium text-red-700">Delete My Account</p>
              <p className="text-xs text-gray-500 mt-0.5">Permanently removes your account, resume, and all associated data.</p>
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={!userId}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-6 text-center">
          For data requests or questions, contact{' '}
          <a href="mailto:privacy@zyncjobs.com" className="text-blue-500 hover:underline">privacy@zyncjobs.com</a>
        </p>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default PrivacySettingsPage;
