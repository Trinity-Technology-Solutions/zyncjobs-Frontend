import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Briefcase, Users, TrendingUp, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';
import Header from '../components/Header';

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

  useEffect(() => {
                                // Clear any stale error on mount
    setError('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.login({ email, password });
      if (response.user.userType === 'employer') {
        setError('This is an employer account. Please use "Employer Login" instead.');
        setLoading(false);
        return;
      }
      localStorage.setItem('user', JSON.stringify(response.user));
      const displayName = response.user.name || response.user.fullName || response.user.email.split('@')[0];
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
    } catch (err) {
      let errorMessage = 'Login failed';
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
          {/* Light decorative blobs like hero page */}
          <div className="absolute top-10 right-10 w-80 h-80 rounded-full bg-blue-100 opacity-40" />
          <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-orange-100 opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-50 opacity-60" />

          <div className="relative z-10 flex flex-col justify-between px-16 py-12 w-full">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Home</span>
            </button>

            <div>
              <h1 className="text-4xl font-bold leading-tight mb-4 text-gray-900">
                Find Your <span className="text-blue-600">Dream Job</span>
              </h1>
              <p className="text-gray-500 text-base mb-10">
                Connect with top employers and land the role you deserve.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Briefcase,   text: '50,000+ Active Job Listings', color: 'text-blue-600',   bg: 'bg-blue-50' },
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

            <div className="grid grid-cols-3 gap-4">
              {[['2M+', 'Job Seekers', 'text-blue-600'], ['50K+', 'Companies', 'text-orange-500'], ['95%', 'Success Rate', 'text-blue-600']].map(([num, label, clr]) => (
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
            <button
              onClick={() => onNavigate('home')}
              className="lg:hidden flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Home</span>
            </button>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                <p className="text-gray-500 mt-1 text-sm">Sign in to your candidate account</p>
              </div>

              {error && (
                <div className="mb-5 flex items-start space-x-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <span className="text-red-500 text-xs mt-0.5">⚠</span>
                  <span className="text-red-600 text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Enter your email"
                    autoComplete="off"
                    readOnly={emailReadOnly}
                    onFocus={() => setEmailReadOnly(false)}
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <button type="button" onClick={() => onNavigate('forgot-password')} className="text-xs font-medium text-blue-600 hover:text-blue-800">
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Enter your password"
                      autoComplete="new-password"
                      readOnly={passwordReadOnly}
                      onFocus={() => setPasswordReadOnly(false)}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm bg-blue-600 hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or continue with</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <button
                type="button"
                onClick={() => {
                  window.location.href = `${import.meta.env.VITE_API_URL || '/api'}/auth/google/candidate?portal=candidate`;
                }}
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

              <button
                type="button"
                onClick={() => {
                  window.location.href = `${import.meta.env.VITE_API_URL || '/api'}/auth/linkedin/candidate`;
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mt-3"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A66C2">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                Continue with LinkedIn
              </button>

              <p className="text-center text-sm text-gray-500 mt-6">
                Don't have an account?{' '}
                <button onClick={() => onNavigate('role-selection')} className="font-semibold text-orange-500 hover:text-orange-600">
                  Sign up free
                </button>
              </p>
              <p className="text-center text-xs text-gray-400 mt-3">
                Are you an employer?{' '}
                <button onClick={() => onNavigate('employer-login')} className="font-medium text-blue-500 hover:text-blue-700 underline">
                  Employer Login
                </button>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
