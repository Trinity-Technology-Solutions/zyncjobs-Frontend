import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Search, BarChart2, Shield, Zap, Settings, AlertTriangle, KeyRound } from 'lucide-react';
import BackButton from '../components/BackButton';
import { authAPI } from '../api/auth';
import { GOOGLE_AUTH_BASE } from '../config/env';
import Header from '../components/Header';
import { generateEmployerId } from '../utils/employerIdUtils';
import { updateUserInStorage } from '../utils/userStorage';

interface EmployerLoginPageProps {
  onNavigate: (page: string, data?: any) => void;
  onLogin: (userData: { name: string; type: 'candidate' | 'employer' | 'admin'; email?: string }) => void;
  onShowNotification?: (notification: { type: 'success' | 'error' | 'info'; message: string }) => void;
}

const EmployerLoginPage: React.FC<EmployerLoginPageProps> = ({ onNavigate, onLogin, onShowNotification }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestReset, setSuggestReset] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPw, setConfirmNewPw] = useState('');
  const [changePwLoading, setChangePwLoading] = useState(false);
  const [changePwMsg, setChangePwMsg] = useState('');
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  const API_BASE = import.meta.env.VITE_API_URL || '/api';



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuggestReset(false);
    try {
      const response = await authAPI.login({ email, password, portal: 'employer' } as any);
      const userType = response.user.userType || response.user.role;
      const isTeamMember = !!(response.user as any).teamRole;

      if (userType !== 'employer' && !isTeamMember) {
        setError('This is a candidate account. Please use regular "Login" instead.');
        setLoading(false);
        return;
      }

      const verificationStatus = (response.user as any).verificationStatus;

      // Block pending employers - requires admin verification
      if (!isTeamMember && verificationStatus === 'pending') {
        setError('Your employer account is pending admin verification. Please wait for approval before logging in.');
        setLoading(false);
        return;
      }

      if (!isTeamMember && verificationStatus === 'rejected') {
        setError('Your employer account verification was rejected. Please contact support.');
        setLoading(false);
        return;
      }

      if (!response.user.employerId) response.user.employerId = generateEmployerId();
      // For team members: store ownerEmail so dashboard fetches owner's data
      const userToStore = {
        ...response.user,
        ownerEmail: (response.user as any).ownerEmail || (isTeamMember ? response.user.employerId : null)
      };
      updateUserInStorage(userToStore);
      const displayName = response.user.name || response.user.companyName || response.user.company || response.user.fullName || response.user.email.split('@')[0];
      onLogin({ name: displayName, type: 'employer', email: response.user.email, id: response.user.id } as any);

      // If team member — show change password prompt before navigating
      if (isTeamMember) {
        setLoggedInUser(response.user);
        setShowChangePw(true);
        setLoading(false);
        return;
      }

      onNavigate('dashboard');
      if (onShowNotification) onShowNotification({ type: 'success', message: 'Welcome back! Login successful.' });
    } catch (err) {
      const errData = (err as any)?.response?.data || err;
      const errorMessage = errData?.error || (err instanceof Error ? err.message : 'Login failed');
      setError(errorMessage);
      if (errData?.suggestReset) setSuggestReset(true);
      if (onShowNotification) onShowNotification({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { setChangePwMsg('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmNewPw) { setChangePwMsg('Passwords do not match.'); return; }
    setChangePwLoading(true);
    setChangePwMsg('');
    try {
      const userId = loggedInUser?.id || loggedInUser?._id;
      const res = await fetch(`${API_BASE}/users/${userId}/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });
      if (res.ok) {
        onNavigate('dashboard');
        if (onShowNotification) onShowNotification({ type: 'success', message: 'Password updated! Welcome to your dashboard.' });
      } else {
        setChangePwMsg('Failed to update password. You can change it later in Settings.');
      }
    } catch {
      setChangePwMsg('Network error. You can change it later in Settings.');
    } finally {
      setChangePwLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onNavigate={onNavigate} />

      {/* Change Password Modal for team members after first login */}
      {showChangePw && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-7 h-7 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Set Your Password</h2>
              <p className="text-gray-500 text-sm mt-1">You're logged in! Set a personal password to secure your account.</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input type="password" value={confirmNewPw} onChange={e => setConfirmNewPw(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  onKeyDown={e => e.key === 'Enter' && handleChangePassword()} />
              </div>
              {changePwMsg && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{changePwMsg}</p>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { onNavigate('dashboard'); if (onShowNotification) onShowNotification({ type: 'success', message: 'Welcome! You can change your password later in Settings.' }); }}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50">Skip for now</button>
              <button onClick={handleChangePassword} disabled={changePwLoading || !newPassword || !confirmNewPw}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {changePwLoading ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1">

        {/* LEFT PANEL */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-white">
          {/* Light decorative blobs like hero page */}
          <div className="absolute top-10 left-10 w-80 h-80 rounded-full bg-orange-100 opacity-40" />
          <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-blue-100 opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-orange-50 opacity-60" />

          <div className="relative z-10 flex flex-col justify-between px-16 py-12 w-full">
            <BackButton onClick={() => onNavigate('home')} />

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6 bg-orange-50 text-orange-600 border border-orange-200">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                Employer Portal
              </div>
              <h1 className="text-4xl font-bold leading-tight mb-4 text-gray-900">
                Hire Top Talent<br />
                <span className="text-orange-500">Faster &amp; Smarter</span>
              </h1>
              <p className="text-gray-500 text-base mb-10">
                Access your hiring dashboard and find the perfect candidates for your team.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Search,    text: 'AI-Powered Candidate Search',        color: 'text-blue-600',   bg: 'bg-blue-50' },
                  { icon: BarChart2, text: 'Hire Across All Fields & Industries', color: 'text-orange-500', bg: 'bg-orange-50' },
                  { icon: Zap,       text: 'Post Jobs in Under 2 Minutes',        color: 'text-blue-600',   bg: 'bg-blue-50' },
                  { icon: Shield,    text: 'Screened & Verified Profiles',        color: 'text-orange-500', bg: 'bg-orange-50' },
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
              <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-50 border border-orange-100">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Search className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">AI Search</div>
                  <div className="text-gray-500 text-xs mt-1">Find top candidates instantly</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <BarChart2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Advanced Analytics</div>
                  <div className="text-gray-500 text-xs mt-1">Track hiring metrics in detail</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-50 border border-orange-100">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Settings className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Workflow Automation</div>
                  <div className="text-gray-500 text-xs mt-1">Automate your hiring process</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-4 sm:px-6 py-8 sm:py-12 relative overflow-hidden">
          {/* Decorative Blobs */}
          <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-orange-100 opacity-15 pointer-events-none" />
          <div className="absolute bottom-20 left-10 w-64 h-64 rounded-full bg-blue-100 opacity-15 pointer-events-none" />
          
          <div className="w-full max-w-sm sm:max-w-md">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 lg:p-8">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-orange-50 text-orange-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                  Employer Portal
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Access Your Dashboard</h2>
                <p className="text-gray-500 mt-1 text-sm">Sign in to manage your hiring pipeline</p>
              </div>

              {error && (
                <div className="mb-5 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-red-600 text-sm">{error}</span>
                  </div>
                  {suggestReset && (
                    <button
                      type="button"
                      onClick={() => onNavigate('forgot-password')}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700 underline"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Reset your password
                    </button>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 sm:py-4 border border-gray-200 rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 bg-white touch-manipulation"
                    placeholder="Enter company email"
                    autoComplete="email"
                    inputMode="email"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <button type="button" onClick={() => onNavigate('forgot-password')}
                      className={`text-xs font-semibold transition-all ${
                        suggestReset
                          ? 'text-orange-600 underline animate-pulse'
                          : 'text-orange-500 hover:text-orange-700'
                      }`}>
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 sm:h-14 px-4 pr-12 sm:pr-14 border border-gray-200 rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 bg-white touch-manipulation"
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
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 sm:py-4 rounded-xl text-white font-semibold text-sm sm:text-base bg-orange-500 hover:bg-orange-600 active:bg-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px]"
                >
                  {loading ? 'Signing In...' : 'Access Dashboard'}
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
                  console.log('Google employer login clicked');
                  if (localStorage.getItem('user')) { alert('You are already logged in!'); return; }
                  window.location.href = `${GOOGLE_AUTH_BASE}/api/auth/google/employer?portal=employer`;
                }}
                className="w-full flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation min-h-[44px] sm:min-h-[48px]"
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
                  <span className="text-xs sm:text-sm text-gray-500">Don't have an account? </span>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Navigating to employer-register');
                      onNavigate('employer-register');
                    }} 
                    className="text-xs sm:text-sm font-semibold text-orange-500 hover:text-orange-600 active:text-orange-700 transition-colors touch-manipulation p-1 sm:p-2 -m-1 sm:-m-2 rounded underline"
                  >
                    Register your company
                  </button>
                </div>
                <div className="text-center">
                  <span className="text-xs text-gray-400">Looking for a job? </span>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Navigating to login');
                      onNavigate('login');
                    }} 
                    className="text-xs font-medium text-blue-500 hover:text-blue-700 active:text-blue-800 underline transition-colors touch-manipulation p-1 sm:p-2 -m-1 sm:-m-2 rounded"
                  >
                    Job seeker login
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

export default EmployerLoginPage;
