import { tokenStorage } from '../utils/tokenStorage';
import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { gdprAPI, CookieConsent } from '../api/gdpr';

interface Props {
  onNavigate?: (page: string) => void;
}

const GUEST_KEY = 'zync_cookie_consent_guest';
const SEEN_KEY  = 'zync_cookie_seen';

const isLoggedIn = () => !!tokenStorage.getAccess();

const shouldShowBanner = (): boolean => {
  if (localStorage.getItem(GUEST_KEY)) return false;
  const seen = localStorage.getItem(SEEN_KEY);
  if (!seen) return true;
  try {
    const { dismissCount } = JSON.parse(seen);
    return dismissCount < 1;
  } catch { return true; }
};

const markSeen = (dismissed = false) => {
  try {
    const existing = localStorage.getItem(SEEN_KEY);
    const prev = existing ? JSON.parse(existing) : { dismissCount: 0 };
    localStorage.setItem(SEEN_KEY, JSON.stringify({
      dismissCount: dismissed ? (prev.dismissCount || 0) + 1 : prev.dismissCount || 0,
      firstSeen: prev.firstSeen || new Date().toISOString()
    }));
  } catch {}
};

const CookieConsentBanner: React.FC<Props> = ({ onNavigate }) => {
  const [visible, setVisible]         = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [prefs, setPrefs]             = useState<Omit<CookieConsent, 'necessary'>>({
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    const check = async () => {
      if (isLoggedIn()) {
        const remote = await gdprAPI.getCookieConsent();
        if (remote?.found) return;
      } else {
        if (!shouldShowBanner()) return;
      }
      setTimeout(() => { markSeen(); setVisible(true); }, 1000);
    };
    check();
  }, []);

  const save = async (choice: 'all' | 'necessary' | 'custom') => {
    const consent: CookieConsent = {
      necessary: true,
      analytics: choice === 'all' || (choice === 'custom' && prefs.analytics),
      marketing: choice === 'all' || (choice === 'custom' && prefs.marketing),
    };
    setSaving(true);
    try {
      if (isLoggedIn()) {
        await gdprAPI.saveCookieConsent(consent);
      } else {
        localStorage.setItem(GUEST_KEY, JSON.stringify({ ...consent, savedAt: new Date().toISOString() }));
      }
      setVisible(false);
    } catch {
      setVisible(false);
    } finally {
      setSaving(false);
    }
  };

  const dismiss = () => { markSeen(true); setVisible(false); };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 w-[340px] sm:w-[380px] animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🍪</span>
            <span className="text-sm font-semibold text-gray-900">Cookie Preferences</span>
          </div>
          <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            We use cookies to personalise content, improve your experience, and show relevant job matches.{' '}
            <button onClick={() => onNavigate?.('privacy')} className="text-blue-600 hover:underline font-medium">
              Learn more
            </button>
          </p>
        </div>

        {/* Expandable preferences — like Naukri */}
        {showDetails && (
          <div className="px-4 pb-3 space-y-2 border-t border-gray-100 pt-3">
            {/* Necessary */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-800">Strictly Necessary</p>
                <p className="text-[11px] text-gray-400">Required for the site to function</p>
              </div>
              <div className="w-9 h-5 bg-blue-600 rounded-full relative opacity-60 cursor-not-allowed shrink-0">
                <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
            {/* Analytics */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-800">Analytics</p>
                <p className="text-[11px] text-gray-400">Helps us improve ZyncJobs features</p>
              </div>
              <button
                onClick={() => setPrefs(p => ({ ...p, analytics: !p.analytics }))}
                className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${prefs.analytics ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${prefs.analytics ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
            {/* Marketing */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-800">Personalisation</p>
                <p className="text-[11px] text-gray-400">Tailored job recommendations</p>
              </div>
              <button
                onClick={() => setPrefs(p => ({ ...p, marketing: !p.marketing }))}
                className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${prefs.marketing ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${prefs.marketing ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        )}

        {/* Toggle details */}
        <button
          onClick={() => setShowDetails(v => !v)}
          className="w-full flex items-center justify-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 py-1.5 border-t border-gray-100 transition-colors"
        >
          {showDetails ? <><ChevronUp className="w-3 h-3" /> Hide options</> : <><ChevronDown className="w-3 h-3" /> Manage preferences</>}
        </button>

        {/* Action buttons — LinkedIn/Naukri style */}
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={() => save('necessary')}
            disabled={saving}
            className="flex-1 py-2 text-xs font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Reject all
          </button>
          {showDetails && (
            <button
              onClick={() => save('custom')}
              disabled={saving}
              className="flex-1 py-2 text-xs font-semibold text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              Save choices
            </button>
          )}
          <button
            onClick={() => save('all')}
            disabled={saving}
            className="flex-1 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Accept all'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CookieConsentBanner;
