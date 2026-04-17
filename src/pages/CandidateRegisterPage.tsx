import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ArrowLeft, Briefcase, TrendingUp, Award, Users } from 'lucide-react';
import { API_ENDPOINTS } from '../config/env';
import { authAPI } from '../api/auth';
import Header from '../components/Header';

const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  const existingToast = document.getElementById('toast');
  if (existingToast) existingToast.remove();
  const toast = document.createElement('div');
  toast.id = 'toast';
  const colors = { success: 'bg-green-500 text-white', error: 'bg-red-500 text-white', warning: 'bg-yellow-500 text-white', info: 'bg-blue-500 text-white' };
  toast.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full ${colors[type]}`;
  const wrapper = document.createElement('div');
  wrapper.className = 'flex items-center';
  const span = document.createElement('span');
  span.textContent = message;
  const btn = document.createElement('button');
  btn.className = 'ml-4 text-white hover:text-gray-200';
  btn.textContent = '×';
  btn.addEventListener('click', () => toast.remove());
  wrapper.appendChild(span);
  wrapper.appendChild(btn);
  toast.appendChild(wrapper);
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.remove('translate-x-full'), 100);
  setTimeout(() => toast.remove(), 4000);
};

interface CandidateRegisterPageProps {
  onNavigate: (page: string) => void;
}

const CandidateRegisterPage: React.FC<CandidateRegisterPageProps> = ({ onNavigate }) => {
  useEffect(() => {
    if (localStorage.getItem('user')) onNavigate('dashboard');
  }, []);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', otp: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOTP = async () => {
    if (!formData.name.trim()) { setError('Please enter your full name.'); showToast('Please enter your full name.', 'error'); return; }
    if (!formData.email.trim()) { setError('Please enter your email.'); showToast('Please enter your email.', 'error'); return; }
    setError('');
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.OTP_SEND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, name: formData.name, userType: 'candidate' })
      });
      const data = await response.json();
      if (response.ok) {
        setOtpSent(true);
        setStep(2);
        setResendTimer(60);
        showToast('Verification code sent to your email', 'success');
      } else {
        setError(data.error || 'Failed to send verification code');
        showToast(data.error || 'Failed to send verification code', 'error');
      }
    } catch (err) {
      setError('Failed to send verification code');
      showToast('Failed to send verification code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setError('Please enter the 6-digit code');
      showToast('Please enter the 6-digit code', 'error');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(API_ENDPOINTS.OTP_VERIFY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: formData.otp })
      });
      const data = await response.json();
      if (response.ok && data.verified) {
        setOtpVerified(true);
        setStep(3);
        showToast('Email verified successfully!', 'success');
      } else {
        setError(data.error || 'Invalid verification code');
        showToast(data.error || 'Invalid verification code', 'error');
      }
    } catch (err) {
      setError('Verification failed');
      showToast('Verification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.OTP_RESEND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, name: formData.name, userType: 'candidate' })
      });
      const data = await response.json();
      if (response.ok) {
        setResendTimer(60);
        showToast('New code sent to your email', 'success');
      } else {
        showToast(data.error || 'Failed to resend code', 'error');
      }
    } catch (err) {
      showToast('Failed to resend code', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpVerified) {
      setError('Please verify your email first');
      showToast('Please verify your email first', 'error');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      showToast('Passwords do not match', 'error');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (!agreedToTerms) {
      setError('Please agree to the Terms & Conditions');
      showToast('Please agree to the Terms & Conditions', 'error');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        userType: 'candidate'
      });
      showToast('✅ Account created successfully! Redirecting to login...', 'success');
      setTimeout(() => onNavigate('login'), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onNavigate={onNavigate} />

      <div className="flex flex-1">
        {/* LEFT PANEL */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-white">
          <div className="absolute top-10 left-10 w-80 h-80 rounded-full bg-blue-100 opacity-40" />
          <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-orange-100 opacity-50" />

          <div className="relative z-10 flex flex-col px-16 py-8 w-full justify-start gap-6">
            <button onClick={() => onNavigate('home')} className="flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors w-fit">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Home</span>
            </button>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-blue-50 text-blue-600 border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                Job Seeker Portal
              </div>
              <h1 className="text-4xl font-bold leading-tight mb-3 text-gray-900">
                Find Your<br />
                <span className="text-blue-500">Dream Job</span>
              </h1>
              <p className="text-gray-500 text-base mb-6">
                Create your account and start your career journey today.
              </p>
              <div className="space-y-3">
                {[
                  { icon: Briefcase, text: 'Access Thousands of Jobs', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { icon: TrendingUp, text: 'AI-Powered Job Matching', color: 'text-orange-500', bg: 'bg-orange-50' },
                  { icon: Award, text: 'Build Professional Profile', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { icon: Users, text: 'Connect with Top Companies', color: 'text-orange-500', bg: 'bg-orange-50' },
                ].map(({ icon: Icon, text, color, bg }) => (
                  <div key={text} className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <span className="text-gray-700 text-sm font-medium">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[['50K+', 'Active Jobs', 'text-blue-500'], ['100K+', 'Job Seekers', 'text-orange-500'], ['5K+', 'Companies', 'text-blue-500']].map(([num, label, clr]) => (
                <div key={label} className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className={`text-2xl font-bold ${clr}`}>{num}</div>
                  <div className="text-gray-500 text-xs mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12">
          <div className="w-full max-w-md">
            <button onClick={() => onNavigate('home')} className="lg:hidden flex items-center gap-2 text-blue-500 hover:text-blue-700 mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Home</span>
            </button>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              {/* Step Indicator */}
              <div className="flex items-center justify-between mb-6">
                {['Basic Info', 'Verify Email', 'Password'].map((label, i) => {
                  const num = i + 1;
                  const isActive = step === num;
                  const isDone = step > num;
                  return (
                    <React.Fragment key={label}>
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                          isDone ? 'bg-green-500 text-white' : isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {isDone ? '✓' : num}
                        </div>
                        <span className={`text-xs font-medium ${isActive ? 'text-blue-500' : isDone ? 'text-green-500' : 'text-gray-400'}`}>{label}</span>
                      </div>
                      {i < 2 && <div className={`flex-1 h-0.5 mx-2 mb-4 transition-all ${step > i + 1 ? 'bg-green-400' : 'bg-gray-200'}`} />}
                    </React.Fragment>
                  );
                })}
              </div>

              <div className="mb-5">
                <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                <p className="text-gray-500 text-sm mt-1">Start your career journey</p>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <span className="text-red-500 text-xs mt-0.5">⚠</span>
                  <span className="text-red-600 text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* STEP 1 - Basic Info */}
                {step === 1 && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                      <input
                        type="text" name="name" value={formData.name} onChange={handleChange}
                        className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 focus:bg-white transition"
                        placeholder="Enter your full name" required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                      <input
                        type="email" name="email" value={formData.email} onChange={handleChange}
                        className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 focus:bg-white transition"
                        placeholder="Enter your email" required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={loading}
                      className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Sending...' : 'Continue →'}
                    </button>
                  </>
                )}

                {/* STEP 2 - OTP Verification */}
                {step === 2 && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Verification Code</label>
                      <p className="text-xs text-gray-500 mb-2">Enter the 6-digit code sent to {formData.email}</p>
                      <input
                        type="text"
                        name="otp"
                        value={formData.otp}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setFormData({ ...formData, otp: value });
                        }}
                        className="w-full h-14 px-4 border border-gray-200 rounded-xl text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 focus:bg-white transition"
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyOTP}
                      disabled={loading || formData.otp.length !== 6}
                      className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Verifying...' : 'Verify Email'}
                    </button>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={resendTimer > 0 || loading}
                        className="text-sm text-blue-500 hover:text-blue-600 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setStep(1); setError(''); setFormData({ ...formData, otp: '' }); }}
                      className="w-full h-11 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 transition-all"
                    >
                      ← Back
                    </button>
                  </>
                )}

                {/* STEP 3 - Password */}
                {step === 3 && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                          className="w-full h-11 px-4 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 focus:bg-white transition"
                          placeholder="Create a password" required
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                          className="w-full h-11 px-4 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 focus:bg-white transition"
                          placeholder="Confirm your password" required
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${agreedToTerms ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                      <input
                        type="checkbox" id="terms-candidate" checked={agreedToTerms}
                        onChange={e => setAgreedToTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-blue-500 cursor-pointer flex-shrink-0"
                      />
                      <label htmlFor="terms-candidate" className="text-xs text-gray-600 cursor-pointer leading-relaxed select-none">
                        I agree to ZyncJobs'{' '}
                        <button type="button" onClick={() => onNavigate('terms')} className="text-blue-500 hover:text-blue-700 underline font-semibold">Terms & Conditions</button>
                        {' '}and{' '}
                        <button type="button" onClick={() => onNavigate('privacy')} className="text-blue-500 hover:text-blue-700 underline font-semibold">Privacy Policy</button>.
                      </label>
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !agreedToTerms || !otpVerified}
                      className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setStep(2); setError(''); }}
                      className="w-full h-11 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 transition-all"
                    >
                      ← Back
                    </button>
                  </>
                )}
              </form>

              <div className="my-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or continue with</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <button
                type="button"
                onClick={() => { window.location.href = `${import.meta.env.VITE_API_URL || '/api'}/auth/google/candidate`; }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <p className="text-center text-sm text-gray-500 mt-6">
                Already have an account?{' '}
                <button onClick={() => onNavigate('login')} className="font-semibold text-blue-500 hover:text-blue-600">
                  Sign in
                </button>
              </p>
              <p className="text-center text-xs text-gray-400 mt-3">
                Looking to hire?{' '}
                <button onClick={() => onNavigate('employer-register')} className="font-medium text-orange-500 hover:text-orange-700 underline">
                  Employer registration
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateRegisterPage;
