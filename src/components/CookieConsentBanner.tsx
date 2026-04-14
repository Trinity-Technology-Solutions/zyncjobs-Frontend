import { tokenStorage } from '../utils/tokenStorage';
import React, { useState, useEffect } from 'react';
import { Cookie, X, Settings, CheckCircle } from 'lucide-react';
import { gdprAPI, CookieConsent } from '../api/gdpr';

interface Props {
  onNavigate?: (page: string) => void;
}

// Only used for guests (no account = no DB to save to)
const GUEST_KEY = 'zync_cookie_consent_guest';

const isLoggedIn = () => !!tokenStorage.getAccess();

const COOKIE_CATEGORIES: {
  key: keyof Omit<CookieConsent, 'necessary'>;
  label: string;
  desc: string;
  defaultOn: boolean;
}[] = [
  {
    key: 'analytics',
    label: 'Analytics',
    desc: 'Helps us understand how you use ZyncJobs to improve features.',
    defaultOn: true,
  },
  {
    key: 'marketing',
    label: 'Marketing',
    desc: 'Personalised job recommendations and relevant communications.',
    defaultOn: false,
  },
];

const CookieConsentBanner: React.FC<Props> = ({ onNavigate }) => {
  const [visible, setVisible]         = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [saved, setSaved]             = useState(false);
  const [saving, setSaving]           = useState(false);
  const [prefs, setPrefs]             = useState<Omit<CookieConsent, 'necessary'>>({
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    const check = async () => {
      if (isLoggedIn()) {
        // DB is source of truth for logged-in users
        const remote = await gdprAPI.getCookieConsent();
        if (remote?.found) return; // already consented — hide banner
      } else {
        // Guests: check localStorage
        if (localStorage.getItem(GUEST_KEY)) return;
      }
      setTimeout(() => setVisible(true), 800);
    };
    check();
  }, []);

  const buildConsent = (choice: 'all' | 'necessary' | 'custom'): CookieConsent => ({
    necessary: true,
    analytics: choice === 'all' || (choice === 'custom' && prefs.analytics),
    marketing: choice === 'all' || (choice === 'custom' && prefs.marketing),
  });

  const save = async (choice: 'all' | 'necessary' | 'custom') => {
    const consent = buildConsent(choice);
    setSaving(true);
    try {
      if (isLoggedIn()) {
        await gdprAPI.saveCookieConsent(consent);
      } else {
        localStorage.setItem(GUEST_KEY, JSON.stringify({ ...consent, savedAt: new Date().toISOString() }));
      }
      setSaved(true);
      setTimeout(() => setVisible(false), 1200);
    } catch {
      // On failure still dismiss — don't block the user
      setVisible(false);
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl text-white overflow-hidden">

        {/* ── Saved confirmation ── */}
        {saved ? (
          <div className="flex items-center gap-3 p-5 text-green-400">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">Preferences saved. Thank you!</p>
          </div>

        ) : !showDetails ? (
          /* ── Simple banner ── */
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 relative">
            <Cookie className="w-6 h-6 text-orange-400 shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200 leading-relaxed">
                We use cookies to improve your experience, analyse site usage, and assist with job matching.{' '}
                <button
                  onClick={() => onNavigate?.('privacy')}
                  className="text-blue-400 hover:underline"
                >
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
              aria-label="Dismiss"
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

              {COOKIE_CATEGORIES.map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-200">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => setPrefs(p => ({ ...p, [key]: !p[key] }))}
                    className={`w-10 h-5 rounded-full relative transition-colors ${prefs[key] ? 'bg-blue-600' : 'bg-gray-600'}`}
                    aria-label={`Toggle ${label}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${prefs[key] ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
              ))}
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
                ✓ Saved to your account — applies across all your devices.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieConsentBanner;
