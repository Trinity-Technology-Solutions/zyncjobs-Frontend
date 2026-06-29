import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, AlertCircle, RefreshCw, ArrowLeft, Shield } from 'lucide-react';
import { apiFetch } from '../api/apiFetch';
import { API_ENDPOINTS } from '../config/env';

interface EmailVerificationPageProps {
  onNavigate: (page: string) => void;
  user?: { email: string; name?: string };
}

const EmailVerificationPage: React.FC<EmailVerificationPageProps> = ({ onNavigate, user }) => {
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'send' | 'verify' | 'done'>('send');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown(r => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const handleSendOtp = async () => {
    if (!email.trim()) { setError('Enter your email address'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(API_ENDPOINTS.OTP_SEND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), type: 'email_verification' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send OTP');
      }
      setStep('verify');
      setMessage('A 6-digit OTP has been sent to your email.');
      setResendCooldown(30);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(API_ENDPOINTS.OTP_RESEND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), type: 'email_verification' }),
      });
      if (!res.ok) throw new Error('Failed to resend OTP');
      setMessage('A new OTP has been sent.');
      setResendCooldown(30);
    } catch (err: any) {
      setError(err.message || 'Failed to resend');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) { setError('Enter the complete 6-digit code'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(API_ENDPOINTS.OTP_VERIFY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: code, type: 'email_verification' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Invalid or expired OTP');
      }
      setStep('done');
      setMessage('Your email has been verified successfully!');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        {step !== 'done' && (
          <button
            onClick={() => step === 'verify' ? setStep('send') : onNavigate('settings')}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}

        <div className="text-center mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            step === 'done' ? 'bg-green-100' : 'bg-blue-100'
          }`}>
            {step === 'done' ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <Mail className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'send' ? 'Verify Your Email' :
             step === 'verify' ? 'Enter Verification Code' : 'Email Verified!'}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {step === 'send' ? 'Enter your email address to receive a verification code.' :
             step === 'verify' ? `Enter the 6-digit code sent to ${email}` :
             'Your email has been verified successfully.'}
          </p>
        </div>

        {message && step !== 'done' && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {step === 'send' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSendOtp}
              disabled={loading || !email.trim()}
              className="w-full h-12 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className="w-12 h-14 text-center text-lg font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoComplete="one-time-code"
                />
              ))}
            </div>
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.join('').length !== 6}
              className="w-full h-12 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
            <div className="text-center">
              <button
                onClick={handleResendOtp}
                disabled={loading || resendCooldown > 0}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mx-auto disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
              <p className="text-green-800 font-medium">Your email has been verified.</p>
              <p className="text-green-600 text-sm mt-1">You now have full access to all features.</p>
            </div>
            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full h-12 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {step !== 'done' && (
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-2 text-xs text-blue-800">
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>We take your security seriously. Email verification helps protect your account from unauthorized access.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;
