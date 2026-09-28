import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Briefcase, TrendingUp, Award, AlertCircle, CheckCircle2, Compass, Sparkles } from 'lucide-react';
import BackButton from '../components/BackButton';
import { API_ENDPOINTS } from '../config/env';
import { authAPI } from '../api/auth';
import { GOOGLE_AUTH_BASE } from '../config/env';
import Header from '../components/Header';
import analytics from '../services/analytics';

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
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] as string[] });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validatePassword = (pwd: string) => {
    const feedback: string[] = [];
    let score = 0;
    if (pwd.length >= 8) score++; else feedback.push('At least 8 characters');
    if (/[A-Z]/.test(pwd)) score++; else feedback.push('One uppercase letter');
    if (/[a-z]/.test(pwd)) score++; else feedback.push('One lowercase letter');
    if (/\d/.test(pwd)) score++; else feedback.push('One number');
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++; else feedback.push('One special character');
    return { score, feedback };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
    if (name === 'password') {
      setPasswordStrength(validatePassword(value));
    }
  };

  const handleSendOTP = async () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Name is required';
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) errs.email = 'Invalid email format';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    
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
        setFieldErrors({});
        showToast('Verification code sent to your email', 'success');
      } else {
        setError(data.error || 'Failed to send verification code');
        showToast(data.error || 'Failed to send verification code', 'error');
      }
    } catch (err) {
      setError('Failed to send verification code');
      setFieldErrors({});
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
    const errs: Record<string, string> = {};
    if (!formData.password) errs.password = 'Password is required';
    else {
      const strength = validatePassword(formData.password);
      if (strength.score < 4) errs.password = 'Must include 8+ characters, uppercase, lowercase, number, and special character';
    }
    if (!formData.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!agreedToTerms) errs.terms = 'Please agree to the Terms & Conditions';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        userType: 'candidate'
      });
      
      // Track successful registration
      analytics.userAnalytics.register('candidate');
      
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
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header onNavigate={onNavigate} />

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
        <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:gap-10">
        {/* Candidate career guide */}
        <aside className="relative overflow-hidden rounded-lg border border-[#dbeafe] bg-[#eff6ff] text-[#1e3a8a] lg:min-h-[700px]">
          <div className="absolute inset-x-0 top-0 h-2 bg-[#f97316]" />
          <div className="absolute -right-20 -top-16 h-56 w-56 rounded-full border-[28px] border-[#bfdbfe]" />
          <div className="relative flex h-full flex-col px-6 py-7 sm:px-9 lg:px-10 lg:py-10">
            <div className="flex items-center justify-between">
              <BackButton fallback="/" />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#bfdbfe] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#2563eb]">
                <Sparkles className="h-3.5 w-3.5" /> Candidate space
              </span>
            </div>

            <div className="mt-12 lg:mt-16">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2563eb]">Your next role starts here</p>
              <h1 className="mt-3 text-3xl font-bold leading-tight text-[#1e3a8a] sm:text-4xl">Build a profile employers want to meet.</h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-[#526780] sm:text-base">Join a career platform that keeps your search organised, personal, and moving forward.</p>
              <div className="mt-8 space-y-3.5">
                {[
                  { icon: Compass, text: 'Discover roles matched to your goals' },
                  { icon: TrendingUp, text: 'Get recommendations as you grow' },
                  { icon: Award, text: 'Showcase your skills with confidence' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#2563eb] shadow-sm">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-[#334e72]">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 border-t border-[#bfdbfe] pt-5">
              <div className="flex items-center gap-3 rounded-md bg-white/80 p-4 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff7ed] text-[#f97316]"><Briefcase className="h-5 w-5" /></div>
                <div><p className="text-sm font-semibold text-[#1e3a8a]">Profile-first applications</p><p className="mt-0.5 text-xs text-[#64748b]">Keep everything ready when a role clicks.</p></div>
              </div>
            </div>
          </div>
        </aside>

        {/* Registration workspace */}
        <section className="relative flex min-w-0 items-start justify-center overflow-hidden rounded-lg border border-[#e2e8f0] bg-white px-5 py-8 shadow-[0_18px_55px_-35px_rgba(30,64,175,0.32)] sm:px-9 sm:py-10 lg:px-12">
          <div className="absolute inset-x-0 top-0 h-1 bg-[#f97316]" />
          
          <div className="relative z-10 w-full max-w-lg">
            <div>
              {/* Step Indicator */}
              <div className="flex items-start justify-between mb-9">
                {['Basic Info', 'Verify Email', 'Password'].map((label, i) => {
                  const num = i + 1;
                  const isActive = step === num;
                  const isDone = step > num;
                  return (
                    <React.Fragment key={label}>
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                          isDone ? 'bg-[#2563eb] text-white' : isActive ? 'bg-[#1e40af] text-white shadow-sm' : 'bg-[#eff6ff] text-[#94a3b8]'
                        }`}>
                          {isDone ? '✓' : num}
                        </div>
                        <span className={`text-[11px] font-semibold whitespace-nowrap ${isActive ? 'text-[#1e40af]' : isDone ? 'text-[#2563eb]' : 'text-[#94a3b8]'}`}>{label}</span>
                      </div>
                      {i < 2 && <div className={`flex-1 h-px mx-2 mt-4 transition-all ${step > i + 1 ? 'bg-[#93c5fd]' : 'bg-[#e2e8f0]'}`} />}
                    </React.Fragment>
                  );
                })}
              </div>

              <div className="mb-7">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#2563eb]"><CheckCircle2 className="h-4 w-4" /> Free for job seekers</div>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#1e3a8a] sm:text-3xl">Create your candidate profile</h2>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">A few details now, then opportunities that fit you.</p>
              </div>

              {error && (
                <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <span className="text-red-500 text-xs mt-0.5">⚠</span>
                  <span className="text-red-600 text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* STEP 1 - Basic Info */}
                {step === 1 && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                      <div className="relative">
                        <input
                          type="text" name="name" value={formData.name} onChange={handleChange}
                          className={`w-full h-12 sm:h-14 px-4 pr-10 border rounded-md text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/25 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all duration-200 touch-manipulation ${fieldErrors.name ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                          placeholder="Enter your full name" required
                        />
                        {fieldErrors.name && <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />}
                      </div>
                      {fieldErrors.name && <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                      <div className="relative">
                        <input
                          type="email" name="email" value={formData.email} onChange={handleChange}
                          className={`w-full h-12 sm:h-14 px-4 pr-10 border rounded-md text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/25 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all duration-200 touch-manipulation ${fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                          placeholder="Enter your email" 
                          autoComplete="email"
                          inputMode="email"
                          required
                        />
                        {fieldErrors.email && <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />}
                      </div>
                      {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={loading}
                      className="w-full h-12 sm:h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md font-semibold text-sm sm:text-base shadow-sm shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px]"
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
                        className="w-full h-14 px-4 border border-slate-200 rounded-md text-center text-2xl font-bold tracking-widest text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400/25 focus:border-blue-500 bg-slate-50 focus:bg-white transition"
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyOTP}
                      disabled={loading || formData.otp.length !== 6}
                      className="w-full h-12 sm:h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md font-semibold text-sm sm:text-base shadow-sm shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px]"
                    >
                      {loading ? 'Verifying...' : 'Verify Email'}
                    </button>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={resendTimer > 0 || loading}
                        className="text-sm text-blue-600 hover:text-blue-700 font-semibold disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setStep(1); setError(''); setFormData({ ...formData, otp: '' }); }}
                      className="w-full h-12 sm:h-14 border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm sm:text-base hover:bg-slate-50 active:bg-slate-100 transition-all touch-manipulation min-h-[48px]"
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
                          className={`w-full h-12 sm:h-14 px-4 pr-14 border rounded-md text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/25 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all duration-200 touch-manipulation ${fieldErrors.password ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                          placeholder="Create a password" required
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-2 touch-manipulation">
                          {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                      {fieldErrors.password && <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>}
                      {formData.password && !fieldErrors.password && (
                        <div className="mt-2">
                          <div className="flex gap-1 mb-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div key={level} className={`h-1.5 flex-1 rounded-full transition-colors ${passwordStrength.score >= level ? 'bg-green-500' : 'bg-gray-200'}`} />
                            ))}
                          </div>
                          {passwordStrength.feedback.length > 0 && (
                            <ul className="text-xs text-gray-500 space-y-0.5">
                              {passwordStrength.feedback.map((msg, i) => (
                                <li key={i} className="flex items-center gap-1"><span className="text-red-400">●</span> {msg}</li>
                              ))}
                            </ul>
                          )}
                          {passwordStrength.score >= 4 && (
                            <p className="text-xs text-green-600 flex items-center gap-1 mt-1"><span>✓</span> Strong password</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                          className={`w-full h-12 sm:h-14 px-4 pr-14 border rounded-md text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/25 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all duration-200 touch-manipulation ${fieldErrors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                          placeholder="Confirm your password" required
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-2 touch-manipulation">
                          {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                      {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-500">{fieldErrors.confirmPassword}</p>}
                    </div>
                    <div className={`flex items-start gap-3 p-3.5 rounded-md border transition-colors ${agreedToTerms ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                      <input
                        type="checkbox" id="terms-candidate" checked={agreedToTerms}
                        onChange={e => setAgreedToTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-blue-600 cursor-pointer flex-shrink-0"
                      />
                      <label htmlFor="terms-candidate" className="text-xs text-gray-600 cursor-pointer leading-relaxed select-none">
                        I agree to ZyncJobs'{' '}
                        <button type="button" onClick={() => onNavigate('terms')} className="text-blue-600 hover:text-blue-700 underline font-semibold">Terms & Conditions</button>
                        {' '}and{' '}
                        <button type="button" onClick={() => onNavigate('privacy')} className="text-blue-600 hover:text-blue-700 underline font-semibold">Privacy Policy</button>.
                      </label>
                    </div>
                    <button type="submit" disabled={loading || !agreedToTerms || !otpVerified} className="w-full min-h-[48px] rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setStep(2); setError(''); }}
                      className="w-full h-12 sm:h-14 border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm sm:text-base hover:bg-slate-50 active:bg-slate-100 transition-all touch-manipulation min-h-[48px]"
                    >
                      ← Back
                    </button>
                  </>
                )}
              </form>

              <div className="my-6 sm:my-7 flex items-center gap-2 sm:gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs sm:text-sm text-slate-400 px-1 sm:px-2 whitespace-nowrap">or continue with</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Track Google OAuth attempt
                  analytics.trackEvent('oauth_attempt', 'registration', 'google_candidate');
                  sessionStorage.setItem('oauthIntent', 'register');
                  window.location.href = `${GOOGLE_AUTH_BASE}/api/auth/google/candidate`;
                }}
                className="w-full flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation min-h-[44px] sm:min-h-[48px]"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-xs sm:text-sm truncate">Continue with Google</span>
              </button>

              <div className="mt-4 sm:mt-6 lg:mt-8 space-y-2 sm:space-y-3">
                <div className="text-center">
                  <span className="text-xs sm:text-sm text-gray-500">Already have an account? </span>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onNavigate('login');
                    }} 
                    className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 active:text-blue-800 transition-colors touch-manipulation p-1 sm:p-2 -m-1 sm:-m-2 rounded underline"
                  >
                    Sign in
                  </button>
                </div>
                <div className="text-center">
                  <span className="text-xs text-gray-400">Looking to hire? </span>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onNavigate('employer-register');
                    }} 
                    className="text-xs font-medium text-orange-500 hover:text-orange-700 active:text-orange-800 underline transition-colors touch-manipulation p-1 sm:p-2 -m-1 sm:-m-2 rounded"
                  >
                    Employer registration
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
  );
};

export default CandidateRegisterPage;
