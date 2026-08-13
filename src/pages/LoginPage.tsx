import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Briefcase, Users, TrendingUp, CheckCircle, Zap, Target, Lock, AlertCircle } from 'lucide-react';
import BackButton from '../components/BackButton';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';
import Header from '../components/Header';
import analytics from '../services/analytics';
import { updateUserInStorage } from '../utils/userStorage';

interface LoginPageProps {
  onNavigate: (page: string, data?: any) => void;
  onLogin: (userData: { name: string; type: 'candidate' | 'employer' | 'admin'; email?: string }) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailReadOnly, setEmailReadOnly] = useState(true);
  const [passwordReadOnly, setPasswordReadOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
                                // Clear any stale error on mount
    setError('');
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
      if (err.response?.status === 423 || err.message?.includes('locked')) {
        errorMessage = '🔒 Account temporarily locked due to multiple failed login attempts. Please try again in 15 minutes or reset your password.';
        setError(errorMessage);
        setFieldErrors({});
        setLoading(false);
        return;
      }
      
      if (err instanceof Error) {
        if (err.message.includes('Account not found')) {
          errorMessage = 'Account not found. Please register first.';
          setTimeout(async () => {
            const yes = await (window as any).confirmAsync('Account not found. Would you like to create a new account?');
            if (yes) onNavigate('role-selection');
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
    <div className="min-h-screen flex flex-col">
      <Header onNavigate={onNavigate} />

      <div className="flex flex-1 flex-col lg:flex-row">

        {/* LEFT PANEL */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-white">
          {/* Light decorative blobs like hero page */}
          <div className="absolute top-10 right-10 w-80 h-80 rounded-full bg-blue-100 opacity-40" />
          <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-orange-100 opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-50 opacity-60" />

          <div className="relative z-10 flex flex-col justify-between px-16 py-12 w-full">
            <BackButton fallback="/" />

            <div>
              <h1 className="text-4xl font-bold leading-tight mb-4 text-gray-900">
                Find Your <span className="text-blue-600">Dream Job</span>
              </h1>
              <p className="text-gray-500 text-base mb-10">
                Connect with top employers and land the role you deserve.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Briefcase,   text: 'Jobs across Engineering, MBA, Arts & more', color: 'text-blue-600',   bg: 'bg-blue-50' },
                  { icon: Users,       text: 'Top Companies Hiring Now',    color: 'text-orange-500', bg: 'bg-orange-50' },
                  { icon: TrendingUp,  text: 'AI-Powered Job Matching',     color: 'text-blue-600',   bg: 'bg-blue-50' },
                  { icon: CheckCircle, text: 'One-Click Easy Apply',        color: 'text-orange-500', bg: 'bg-orange-50' },
                ].map(({ icon: Icon, text, color, bg }) => (
                  <div key={text} className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bg}`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <span className="text-gray-700 text-sm font-medium">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 mt-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Instant Access</div>
                  <div className="text-gray-500 text-xs mt-1">Start applying to jobs immediately</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-50 border border-orange-100">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Smart Matching</div>
                  <div className="text-gray-500 text-xs mt-1">AI finds roles perfect for you</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Secure & Private</div>
                  <div className="text-gray-500 text-xs mt-1">Your data is always protected</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-4 sm:px-6 py-8 sm:py-12 relative overflow-hidden min-h-screen lg:min-h-0">
          {/* Decorative Blobs */}
          <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-blue-100 opacity-15 pointer-events-none" />
          <div className="absolute bottom-20 left-10 w-64 h-64 rounded-full bg-orange-100 opacity-15 pointer-events-none" />
          
          <div className="w-full max-w-sm sm:max-w-md">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 lg:p-8">
              <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Welcome back</h2>
                <p className="text-gray-500 mt-1 text-sm">Sign in to your candidate account</p>
              </div>

              {error && (
                <div className="mb-5 flex items-start space-x-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <span className="text-red-500 text-xs mt-0.5">⚠</span>
                  <span className="text-red-600 text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" autoComplete="off">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' })); }}
                      className={`w-full px-3 sm:px-4 py-3 sm:py-4 pr-10 border rounded-lg sm:rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white touch-manipulation ${fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
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
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <button type="button" onClick={() => onNavigate('forgot-password')} className="text-xs font-medium text-blue-600 hover:text-blue-800">
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' })); }}
                      className={`w-full h-12 sm:h-14 px-3 sm:px-4 pr-12 sm:pr-14 border rounded-lg sm:rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white touch-manipulation ${fieldErrors.password ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 sm:py-4 rounded-lg sm:rounded-xl text-white font-semibold text-sm sm:text-base bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px]"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>

              <div className="my-4 sm:my-6 flex items-center gap-2 sm:gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs sm:text-sm text-gray-400 px-1 sm:px-2 whitespace-nowrap">or continue with</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Google login clicked');
                  // Track Google OAuth attempt
                  analytics.trackEvent('oauth_attempt', 'login', 'google_candidate');
                  const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/api$/, '');
                  window.location.href = `${base}/api/auth/google/candidate?portal=candidate`;
                }}
                className="w-full flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4 border border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation min-h-[44px] sm:min-h-[48px]"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-xs sm:text-sm truncate">Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('LinkedIn login clicked');
                  // Track LinkedIn OAuth attempt
                  analytics.trackEvent('oauth_attempt', 'login', 'linkedin_candidate');
                  const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/api$/, '');
                  window.location.href = `${base}/api/auth/linkedin/candidate`;
                }}
                className="w-full flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4 border border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors mt-2 sm:mt-3 touch-manipulation min-h-[44px] sm:min-h-[48px]"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 24 24" fill="#0A66C2">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="text-xs sm:text-sm truncate">Continue with LinkedIn</span>
              </button>

              <div className="mt-4 sm:mt-6 lg:mt-8 space-y-2 sm:space-y-3">
                <div className="text-center">
                  <span className="text-xs sm:text-sm text-gray-500">Don't have an account? </span>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Navigating to role-selection');
                      onNavigate('role-selection');
                    }} 
                    className="text-xs sm:text-sm font-semibold text-orange-500 hover:text-orange-600 active:text-orange-700 transition-colors touch-manipulation p-1 sm:p-2 -m-1 sm:-m-2 rounded underline"
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
                      console.log('Navigating to employer-login');
                      onNavigate('employer-login');
                    }} 
                    className="text-xs font-medium text-blue-500 hover:text-blue-700 active:text-blue-800 underline transition-colors touch-manipulation p-1 sm:p-2 -m-1 sm:-m-2 rounded"
                  >
                    Employer Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;