import React, { useState } from 'react';
import { Eye, EyeOff, Search, BarChart2, Shield, AlertTriangle, KeyRound } from 'lucide-react';
import { authAPI } from '../api/auth';
import Header from '../components/Header';
import BackButton from '../components/BackButton';
import { generateEmployerId } from '../utils/employerIdUtils';
import WorkButton from '../components/animata/button/work-button';
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
      const displayName = response.user.fullName || response.user.name || response.user.companyName || response.user.company || response.user.email.split('@')[0];
      
      // Immediately update localStorage with the correct name BEFORE calling onLogin
      updateUserInStorage({ ...userToStore, name: displayName });
      
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
      let errorMessage = errData?.error || (err instanceof Error ? err.message : 'Login failed');
      
      // Handle account lockout (HTTP 423)
      if ((err as any)?.response?.status === 423 || errorMessage.includes('locked') || errorMessage.includes('too many')) {
        errorMessage = '🔒 Account temporarily locked due to multiple failed login attempts. Please try again in 15 minutes or reset your password.';
      }
      
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
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-[#f7f4ef]">
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

      <div className="flex flex-1 lg:min-h-[calc(100vh-97px)]">

        {/* LEFT PANEL */}
        <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-[#fffaf2] border-r border-[#eadfce]">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full border-[28px] border-orange-100/70" />
          <div className="absolute -bottom-32 -right-28 w-[30rem] h-[30rem] rounded-full border-[40px] border-blue-100/60" />
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(135deg, transparent 0 49%, rgba(16,42,67,0.05) 49% 50%, transparent 50% 100%)', backgroundSize: '34px 34px' }} />

          <div className="relative z-10 flex flex-col justify-between px-12 xl:px-16 py-10 xl:py-12 w-full">
            <BackButton fallback="/" />
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] mb-5 text-[#102a43]">
                <span className="w-8 h-px bg-orange-500" />
                For employers
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold leading-[1.08] tracking-tight mb-5 text-[#102a43]">
                Welcome back<br />
                <span className="text-orange-500">to your workspace.</span>
              </h1>
              <p className="text-[#526579] text-base leading-7 max-w-md mb-9">
                Sign in to manage your hiring pipeline, connect with candidates, and keep your team moving forward.
              </p>
              <div className="space-y-3.5">
                {[
                  { icon: Search, text: 'Find relevant candidates faster', color: 'text-[#102a43]', bg: 'bg-blue-100/70' },
                  { icon: BarChart2, text: 'Keep your hiring work organized', color: 'text-orange-600', bg: 'bg-orange-100/80' },
                  { icon: Shield, text: 'Hire with verified profiles', color: 'text-[#102a43]', bg: 'bg-blue-100/70' },
                ].map(({ icon: Icon, text, color, bg }) => (
                  <div key={text} className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                      <Icon className={`w-[18px] h-[18px] ${color}`} />
                    </div>
                    <span className="text-[#263e55] text-sm font-semibold">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 flex items-center gap-3 text-xs text-[#526579]">
              <div className="flex -space-x-2">
                <span className="w-8 h-8 rounded-full bg-[#102a43] border-2 border-[#fffaf2] flex items-center justify-center text-white"><Search className="w-3.5 h-3.5" /></span>
                <span className="w-8 h-8 rounded-full bg-orange-500 border-2 border-[#fffaf2] flex items-center justify-center text-white"><Shield className="w-3.5 h-3.5" /></span>
              </div>
              <span>Trusted tools for growing teams</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-[55%] flex items-center justify-center bg-[#f7f4ef] px-4 sm:px-8 lg:px-12 py-8 sm:py-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-50 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#d8d0c3 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
          
          <div className="relative z-10 w-full max-w-xl">
            <div className="bg-white border border-[#e8e0d5] rounded-[1.25rem] shadow-[0_24px_70px_-36px_rgba(16,42,67,0.5)] p-5 sm:p-8 lg:p-10">
              <div className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Sign in to your employer account</h2>
                <p className="text-gray-500 text-sm mt-1">Manage your hiring pipeline from one focused workspace</p>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 sm:h-14 px-4 border border-gray-200 rounded-xl text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 focus:bg-white transition-all duration-200 touch-manipulation"
                    placeholder="Enter company email"
                    autoComplete="email"
                    inputMode="email"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Password</label>
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
                      className="w-full h-12 sm:h-14 px-4 pr-12 sm:pr-14 border border-gray-200 rounded-xl text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 focus:bg-white transition-all duration-200 touch-manipulation"
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

                <WorkButton
                  type="submit"
                  disabled={loading}
                  text={loading ? 'Signing In...' : 'Access Dashboard'}
                  className="w-full"
                />
              </form>

              <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 border-t border-[#eee8df] pt-5 sm:pt-6">
                <div className="text-center">
                  <span className="text-xs sm:text-sm text-gray-500">Don't have an account? </span>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
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
