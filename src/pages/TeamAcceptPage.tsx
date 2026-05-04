import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, Eye, EyeOff } from 'lucide-react';

interface Props {
  onNavigate: (page: string, data?: any) => void;
  onLogin: (user: any, token: string) => void;
}

type Step = 'loading' | 'set-password' | 'success' | 'error';

const TeamAcceptPage: React.FC<Props> = ({ onNavigate, onLogin }) => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>('loading');
  const [error, setError] = useState('');
  const [invite, setInvite] = useState<{ name: string; email: string; role: string; companyName: string } | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const API = import.meta.env.VITE_API_URL || '/api';
  const token = searchParams.get('token');

  // Step 1 — validate token, get invite details
  useEffect(() => {
    if (!token) {
      setError('This invitation link is missing a token. Please ask the employer to resend the invite or copy the link again.');
      setStep('error');
      return;
    }

    fetch(`${API}/team/invite-info/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setInvite({
            name: data.memberName || data.email?.split('@')[0] || 'Team Member',
            email: data.memberEmail || data.email,
            role: data.role || 'Recruiter',
            companyName: data.companyName || 'your company',
          });
          // If member already has an account, skip password step
          if (data.hasAccount) {
            acceptInvite(token);
          } else {
            setStep('set-password');
          }
        } else {
          setError(data.error || 'Invalid or expired invitation link.');
          setStep('error');
        }
      })
      .catch(() => { setError('Network error. Please try again.'); setStep('error'); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Accept invite (for users who already have an account)
  const acceptInvite = (tok: string) => {
    fetch(`${API}/team/accept/${tok}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('user', JSON.stringify(data.user));
          onLogin(data.user, data.accessToken);
          setInvite(prev => prev ? { ...prev, role: data.user?.teamRole || prev.role } : prev);
          setStep('success');
          setTimeout(() => onNavigate('dashboard'), 2000);
        } else {
          setError(data.error || 'Failed to accept invitation.');
          setStep('error');
        }
      })
      .catch(() => { setError('Network error. Please try again.'); setStep('error'); });
  };

  // Step 2 — set password and activate account
  const handleSetPassword = async () => {
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/team/accept/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user, data.accessToken);
        setStep('success');
        setTimeout(() => onNavigate('dashboard'), 2000);
      } else {
        setError(data.error || 'Failed to activate account.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">

        {/* Loading */}
        {step === 'loading' && (
          <>
            <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">Verifying your invitation…</h2>
            <p className="text-gray-500 mt-2 text-sm">Please wait a moment.</p>
          </>
        )}

        {/* Set Password */}
        {step === 'set-password' && invite && (
          <>
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👋</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">You're invited!</h2>
            <p className="text-gray-500 text-sm mb-1">
              <span className="font-medium text-gray-700">{invite.companyName}</span> invited you as a{' '}
              <span className={`font-semibold ${
                invite.role === 'Owner' ? 'text-blue-600' :
                invite.role === 'Recruiter' ? 'text-orange-600' : 'text-gray-600'
              }`}>{invite.role}</span>
            </p>
            <p className="text-xs text-gray-400 mb-6">{invite.email}</p>

            <div className="text-left space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Set your password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  onKeyDown={e => e.key === 'Enter' && handleSetPassword()}
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                onClick={handleSetPassword}
                disabled={submitting || !password || !confirm}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-semibold text-sm transition-colors"
              >
                {submitting ? 'Activating account…' : 'Activate Account & Join Team'}
              </button>
            </div>

            {/* Role permissions preview */}
            <div className="mt-6 bg-gray-50 rounded-xl p-4 text-left">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your access as {invite.role}</p>
              <ul className="space-y-1">
                {(invite.role === 'Owner'
                  ? ['Post Jobs', 'Manage Applications', 'Invite Members', 'Remove Members', 'View Analytics']
                  : invite.role === 'Recruiter'
                  ? ['Post Jobs', 'Manage Applications', 'View Analytics']
                  : ['View Analytics']
                ).map(p => (
                  <li key={p} className="text-xs text-gray-600 flex items-center gap-1.5">
                    <span className="text-green-500">✓</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Success */}
        {step === 'success' && invite && (
          <>
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You're in! 🎉</h2>
            <p className="text-gray-600 text-sm mb-1">
              Welcome to <span className="font-semibold">{invite.companyName}</span>
            </p>
            <p className="text-gray-500 text-sm mb-4">
              You've joined as a <span className="font-semibold text-blue-600">{invite.role}</span>
            </p>
            <p className="text-gray-400 text-xs">Redirecting to dashboard…</p>
            <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full animate-[progress_2s_linear_forwards]" style={{ width: '100%', animation: 'none', transition: 'width 2s linear' }} />
            </div>
          </>
        )}

        {/* Error */}
        {step === 'error' && (
          <>
            <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Failed</h2>
            <p className="text-gray-600 text-sm mb-6">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={() => onNavigate('employer-login')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
              >
                Go to Login
              </button>
              <button
                onClick={() => onNavigate('home')}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Home
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default TeamAcceptPage;
