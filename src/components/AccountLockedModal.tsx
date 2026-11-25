import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, X } from 'lucide-react';
import type { AccountLockoutError } from '../api/auth';

interface AccountLockedModalProps {
  lockout: AccountLockoutError;
  onClose: () => void;
  onResetPassword: () => void;
}

const R = 54;
const CIRC = 2 * Math.PI * R;

const AccountLockedModal: React.FC<AccountLockedModalProps> = ({
  lockout,
  onClose,
  onResetPassword,
}) => {
  const { deadline, lockoutMinutes } = lockout;
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (deadline === null) return;
    const update = () => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (currentTime >= deadline) clearInterval(interval);
    };
    const interval = setInterval(update, 1000);
    update();
    document.addEventListener('visibilitychange', update);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', update);
    };
  }, [deadline]);

  const remaining = deadline === null ? null : Math.max(0, Math.ceil((deadline - now) / 1000));
  const expired = remaining === 0;
  const minutes = Math.floor((remaining ?? 0) / 60);
  const seconds = (remaining ?? 0) % 60;
  const totalSeconds = lockoutMinutes === null ? 0 : lockoutMinutes * 60;
  const progress = totalSeconds > 0 ? Math.min(1, (remaining ?? 0) / totalSeconds) : 0;
  const dashOffset = CIRC * (1 - progress);

  const urgency = (remaining ?? Infinity) < 60 ? '#22c55e' : (remaining ?? Infinity) < 300 ? '#f59e0b' : '#ef4444';

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="account-lockout-title" className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="relative bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">

        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-red-200">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
              Security Alert
            </span>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5">

          {/* Lock icon + title */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-3">
              <Lock className="w-7 h-7 text-red-600" />
            </div>
            <h2 id="account-lockout-title" className="text-lg font-bold text-gray-900">{expired ? 'You can try signing in again' : 'Account Temporarily Locked'}</h2>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              {expired ? 'The reported lockout timer has ended.' : lockout.message}
            </p>
          </div>

          {/* Circular countdown */}
          {remaining !== null && <div className="flex flex-col items-center mb-5">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={R} fill="none" stroke="#f3f4f6" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r={R} fill="none"
                  stroke={urgency}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 1s linear, stroke 1s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold font-mono text-gray-900 tabular-nums">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
                <span className="text-xs text-gray-400 mt-0.5">remaining</span>
              </div>
            </div>
          </div>}

          {/* Info row */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {[
              { label: 'Lock Duration', value: lockoutMinutes === null ? 'Unavailable' : `${lockoutMinutes} min` },
              { label: 'Status', value: expired ? 'Try again' : 'Locked' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 text-center">
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-gray-800">{value}</p>
              </div>
            ))}
          </div>

          {/* Tip */}
          <p className="text-xs text-gray-400 text-center mb-4">
            If you've forgotten your password, request a reset link.
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              {expired ? 'Try Again' : 'Close'}
            </button>
            <button
              onClick={onResetPassword}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition"
            >
              <KeyRound className="w-4 h-4" />
              Reset Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountLockedModal;
