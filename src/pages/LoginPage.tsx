import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, TrendingUp, AlertCircle, CheckCircle2, Compass, ShieldCheck, Sparkles } from 'lucide-react';
import BackButton from '../components/BackButton';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';
import Header from '../components/Header';
import WorkButton from '../components/animata/button/work-button';
import analytics from '../services/analytics';
import { updateUserInStorage } from '../utils/userStorage';
import AccountLockedModal from '../components/AccountLockedModal';

interface LoginPageProps {
  onNavigate: (page: string, data?: any) => void;
  onLogin: (userData: { name: string; type: 'candidate' | 'employer' | 'admin'; email?: string }) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [lockedMinutes, setLockedMinutes] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get('error');
    const oauthReason = params.get('reason');
    if (oauthError) {
      if (oauthError === 'oauth_failed') {
        setError(oauthReason ? `Google sign-in failed: ${decodeURIComponent(oauthReason)}` : 'Google sign-in was unsuccessful. Please try again or sign in with your email.');
      } else if (oauthError === 'access_denied') {
        setError('Google sign-in was cancelled.');
      } else {
        setError(`Authentication error: ${oauthReason ? decodeURIComponent(oauthReason) : oauthError}`);
      }
    } else {
      setError('');
    }
  }, []);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Invalid email format';
    if (!password) errs.password = 'Password is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      if ((response.user.userType as string) === 'employer') {
        setError('This is an employer account. Please use "Employer Login" instead.');
        setLoading(false);
        return;
      }
      
      // Track successful login
      analytics.userAnalytics.login('candidate');

      // Fetch full profile from DB and merge so saved data survives logout/login
      let fullUser = { ...response.user };
      try {
        const API_BASE = import.meta.env.VITE_API_URL || '/api';
        const profileRes = await fetch(`${API_BASE}/profile/${encodeURIComponent(response.user.email)}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData && typeof profileData === 'object') {
            fullUser = { ...response.user, ...profileData, email: response.user.email, id: response.user.id };
          }
        }
      } catch { /* silent — use auth response as fallback */ }

      const displayName = fullUser.fullName || fullUser.name || response.user.fullName || response.user.name || response.user.email.split('@')[0];
      
      // Immediately update localStorage with the correct name BEFORE calling onLogin
      updateUserInStorage({ ...fullUser, name: displayName });
      
      const userType = response.user.userType === 'employer' ? 'employer' : 'candidate';
      onLogin({ name: displayName, type: userType, email: response.user.email, id: response.user.id } as any);
      // Navigate after onLogin updates App state
      const pendingApplication = localStorage.getItem('pendingJobApplication');
      if (pendingApplication) {
        const jobData = JSON.parse(pendingApplication);
        localStorage.removeItem('pendingJobApplication');
        localStorage.setItem('selectedJob', JSON.stringify(jobData));
        navigate('/job-application', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      let errorMessage = 'Login failed';
      
      // Handle account lockout (HTTP 423)
      if (err.locked || err.response?.status === 423 || err.message?.includes('locked')) {
        setLockedUntil(err.lockedUntil || null);
        setLockedMinutes(err.lockoutMinutes || 15);
        setLoading(false);
        return;
      }
      
      if (err instanceof Error) {
        if (err.message.includes('Account not found')) {
          errorMessage = 'Account not found. Please register first.';
          setTimeout(async () => {
            const yes = await (window as any).confirmAsync('Account not found. Would you like to create a new account?');
            if (yes) onNavigate('candidate-register');
          }, 500);
        } else if (err.message.includes('Invalid password')) {
          errorMessage = 'Incorrect password. Please try again or reset your password.';
        } else if (err.message.includes('Account is inactive')) {
          errorMessage = 'Account is inactive. Please contact support.';
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
      setFieldErrors({});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header onNavigate={onNavigate} />

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
        <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:gap-10">
          <aside className="relative overflow-hidden rounded-lg border border-[#dbeafe] bg-[#eff6ff] text-[#1e3a8a] lg:min-h-[650px]">
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
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2563eb]">Welcome back</p>
                <h1 className="mt-3 text-3xl font-bold leading-tight text-[#1e3a8a] sm:text-4xl">Pick up where your career left off.</h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-[#526780] sm:text-base">Your next opportunity is closer when your search, profile, and applications are all in one place.</p>
                <div className="mt-8 space-y-3.5">
                  {[
                    { icon: Compass, text: 'Explore roles matched to your goals' },
                    { icon: TrendingUp, text: 'Keep your job search moving forward' },
                    { icon: CheckCircle2, text: 'Apply quickly with your profile ready' },
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

              <div className="mt-auto border-t border-[#bfdbfe] pt-5">
                <div className="flex items-center gap-3 rounded-md bg-white/80 p-4 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff7ed] text-[#f97316]"><ShieldCheck className="h-5 w-5" /></div>
                  <div><p className="text-sm font-semibold text-[#1e3a8a]">A secure place for your next move</p><p className="mt-0.5 text-xs text-[#64748b]">Your candidate account stays yours.</p></div>
                </div>
              </div>
            </div>
          </aside>

          <section className="relative flex min-w-0 items-center justify-center overflow-hidden rounded-lg border border-[#e2e8f0] bg-white px-5 py-8 shadow-[0_18px_55px_-35px_rgba(30,64,175,0.32)] sm:px-9 sm:py-10 lg:min-h-[650px] lg:px-12">
            <div className="absolute inset-x-0 top-0 h-1 bg-[#f97316]" />
            <div className="relative z-10 w-full max-w-lg">
              <div className="mb-7">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#2563eb]"><CheckCircle2 className="h-4 w-4" /> Free for job seekers</div>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#1e3a8a] sm:text-3xl">Sign in to your candidate profile</h2>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">Access your saved jobs, applications, and personalised recommendations.</p>
              </div>

              {error && (
                <div className="mb-5 flex items-start space-x-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <span className="text-red-500 text-xs mt-0.5">⚠</span>
                  <span className="text-red-600 text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' })); }}
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

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Password</label>
                    <button type="button" onClick={() => onNavigate('forgot-password')} className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' })); }}
                      className={`w-full h-12 sm:h-14 px-4 pr-14 border rounded-md text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/25 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all duration-200 touch-manipulation ${fieldErrors.password ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 sm:right-4 flex items-center justify-center h-full text-gray-400 hover:text-gray-600 transition-colors touch-manipulation p-2"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>}
                </div>

                <WorkButton
                  type="submit"
                  disabled={loading}
                  text={loading ? 'Signing In...' : 'Sign In'}
                  className="w-full"
                />
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 px-2 whitespace-nowrap">or continue with</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Track Google OAuth attempt
                  analytics.trackEvent('oauth_attempt', 'login', 'google_candidate');
                  const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/api$/, '');
                  window.location.href = `${base}/api/auth/google/candidate?portal=candidate`;
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-md text-sm font-semibold text-gray-700 hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation min-h-[48px]"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="truncate">Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Track LinkedIn OAuth attempt
                  analytics.trackEvent('oauth_attempt', 'login', 'linkedin_candidate');
                  const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/api$/, '');
                  window.location.href = `${base}/api/auth/linkedin/candidate`;
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-md text-sm font-semibold text-gray-700 hover:bg-slate-50 active:bg-slate-100 transition-colors mt-3 touch-manipulation min-h-[48px]"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="#0A66C2">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="truncate">Continue with LinkedIn</span>
              </button>

              <div className="mt-8 space-y-3">
                <div className="text-center">
                  <span className="text-sm text-gray-500">Don't have an account? </span>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onNavigate('candidate-register');
                    }} 
                    className="text-sm font-semibold text-orange-500 hover:text-orange-600 active:text-orange-700 transition-colors touch-manipulation p-1 -m-1 rounded underline"
                  >
                    Sign up free
                  </button>
                </div>
                <div className="text-center">
                  <span className="text-xs text-gray-400">Are you an employer? </span>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onNavigate('employer-login');
                    }} 
                    className="text-xs font-semibold text-blue-500 hover:text-blue-700 active:text-blue-800 underline transition-colors touch-manipulation p-1 -m-1 rounded"
                  >
                    Employer Login
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;