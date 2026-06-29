import React, { useState } from 'react';
import { Mail, AlertCircle, CheckCircle, RefreshCw, X } from 'lucide-react';
import { apiFetch } from '../api/apiFetch';
import { API_ENDPOINTS } from '../config/env';

interface VerifyEmailBannerProps {
  email: string;
  verificationStatus?: string;
  onVerified?: () => void;
  onDismiss?: () => void;
}

const VerifyEmailBanner: React.FC<VerifyEmailBannerProps> = ({
  email,
  verificationStatus,
  onVerified,
  onDismiss,
}) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || verificationStatus === 'verified') return null;

  const handleResend = async () => {
    setSending(true);
    setError('');
    try {
      const res = await apiFetch(API_ENDPOINTS.OTP_SEND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'email_verification' }),
      });
      if (!res.ok) throw new Error('Failed to send verification email');
      setSent(true);
      setTimeout(() => setSent(false), 60000);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {verificationStatus === 'verified' ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800">
            {verificationStatus === 'pending_admin'
              ? 'Verification pending approval'
              : 'Verify your email address'}
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            {verificationStatus === 'pending_admin'
              ? 'Your account is awaiting admin verification. You will be notified once verified.'
              : `Please verify ${email} to access all features.`}
          </p>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          {verificationStatus !== 'pending_admin' && (
            <div className="mt-2">
              {sent ? (
                <span className="text-xs text-green-600 font-medium">Verification email sent! Check your inbox.</span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={sending}
                  className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${sending ? 'animate-spin' : ''}`} />
                  {sending ? 'Sending...' : 'Resend verification email'}
                </button>
              )}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={() => { setDismissed(true); onDismiss(); }}
            className="flex-shrink-0 text-amber-400 hover:text-amber-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailBanner;
