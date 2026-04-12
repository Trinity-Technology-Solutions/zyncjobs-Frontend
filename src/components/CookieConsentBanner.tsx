import React, { useState, useEffect } from 'react';
import { Cookie, X, Settings } from 'lucide-react';
import { gdprAPI } from '../api/gdpr';

interface CookieConsentBannerProps {
  onNavigate?: (page: string) => void;
}

const LS_KEY = 'zync_cookie_consent';

const isLoggedIn = () => {
  try {
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('token') || localStorage.getItem('accessToken');
    return !!(u && t);
  } catch { return false; }
};

const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onNavigate }) => {
  const [visible, setVisible]         = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [prefs, setPrefs]             = useState({ analytics: true, marketing: false });
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    const check = async () => {
      // 1. If logged in → check backend first
      if (isLoggedIn()) {
        const remote = await gdprAPI.getCookieConsent();
        if (remote?.found) {
          // Already saved in DB — sync to localStorage and hide banner
          localStorage.setItem(LS_KEY, JSON.stringify({
            necessary: remote.necessary,
            analytics: remote.analytics,
            marketing: remote.marketing,
            savedAt:   remote.savedAt,
          }));
          return; // don't show banner
        }
      }

      // 2. Check localStorage fallback
      const local = localStorage.getItem(LS_KEY);
      if (local) return; // already consented on this device

      // 3. Show banner after short delay
      setTimeout(() => setVisible(true), 800);
    };

    check();
  }, []);

  const save = async (choice: 'all' | 'necessary' | 'custom') => {
    const consent = {
      necessary: true,
      analytics: choice === 'all' || (choice === 'custom' && prefs.analytics),
      marketing: choice === 'all' || (choice === 'custom' && prefs.marketing),
      savedAt:   new Date().toISOString(),
    };

    // Always save to localStorage (works for guests + offline)
    localStorage.setItem(LS_KEY, JSON.stringify(consent));

    // If logged in → also save to backend DB
    if (isLoggedIn()) {
      setSaving(true);
      try {
        await gdprAPI.saveCookieConsent(consent);
      } catch {
        // silent fail — localStorage already saved
      } finally {
        setSaving(false);
      }
    }

    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl text-white overflow-hidden">

        {!showDetails ? (
          /* ── Simple banner ── */
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5">
            <Cookie className="w-6 h-6 text-orange-400 shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200 leading-relaxed">
                We use cookies to improve your experience, analyse site usage, and assist with job matching.{' '}
                <button onClick={() => onNavigate?.('privacy')} className="text-blue-400 hover:underline">
                  Privacy Policy
                </button>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                onClick={() => setShowDetails(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Settings className="w-3 h-3" /> Customise
              </button>
              <button
                onClick={() => save('necessary')}
                disabled={saving}
                className="px-3 py-2 text-xs text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Necessary only
              </button>
              <button
                onClick={() => save('all')}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Accept all'}
              </button>
            </div>
            <button
              onClick={() => save('necessary')}
              className="absolute top-3 right-3 sm:static text-gray-500 hover:text-gray-300"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        ) : (
          /* ── Detailed preferences ── */
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Cookie className="w-4 h-4 text-orange-400" /> Cookie Preferences
              </h3>
              <button onClick={() => setShowDetails(false)} className="text-gray-500 hover:text-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Necessary — always on */}
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-200">Necessary</p>
                  <p className="text-xs text-gray-500 mt-0.5">Login sessions, security tokens. Cannot be disabled.</p>
                </div>
                <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-not-allowed opacity-70">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-200">Analytics</p>
                  <p className="text-xs text-gray-500 mt-0.5">Helps us understand how you use ZyncJobs to improve features.</p>
                </div>
                <button
                  onClick={() => setPrefs(p => ({ ...p, analytics: !p.analytics }))}
                  className={`w-10 h-5 rounded-full relative transition-colors ${prefs.analytics ? 'bg-blue-600' : 'bg-gray-600'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${prefs.analytics ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-200">Marketing</p>
                  <p className="text-xs text-gray-500 mt-0.5">Personalised job recommendations and relevant communications.</p>
                </div>
                <button
                  onClick={() => setPrefs(p => ({ ...p, marketing: !p.marketing }))}
                  className={`w-10 h-5 rounded-full relative transition-colors ${prefs.marketing ? 'bg-blue-600' : 'bg-gray-600'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${prefs.marketing ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => save('custom')}
                disabled={saving}
                className="flex-1 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save preferences'}
              </button>
              <button
                onClick={() => save('all')}
                disabled={saving}
                className="flex-1 py-2 text-sm font-semibold border border-gray-600 hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-50"
              >
                Accept all
              </button>
            </div>

            {isLoggedIn() && (
              <p className="text-xs text-gray-500 text-center">
                ✓ Your preference will be saved to your account across all devices.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieConsentBanner;
