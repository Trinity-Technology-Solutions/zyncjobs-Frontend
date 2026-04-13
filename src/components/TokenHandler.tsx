import React, { useEffect, useState } from 'react';
import { ArrowRight, Home, ShieldAlert, UserCircle2, Briefcase, Zap } from 'lucide-react';
import { tokenStorage } from '../utils/tokenStorage';

interface TokenHandlerProps {
  onLogin: (userData: {name: string, type: 'candidate' | 'employer' | 'admin', email?: string}) => void;
  onNavigate: (page: string) => void;
}

type MismatchInfo = {
  actualRole: string;
  intendedPortal: string;
  correctPortal: string;
  correctRoute: string;
  isNewUser?: boolean;
};

const isEmployerRole = (role: string) =>
  ['employer', 'recruiter', 'company'].includes(role?.toLowerCase?.() ?? '');

const TokenHandler: React.FC<TokenHandlerProps> = ({ onLogin, onNavigate }) => {
  const [mismatch, setMismatch] = useState<MismatchInfo | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const intendedPortal = (urlParams.get('portal') || urlParams.get('type') || 'candidate') as string;
    const isLinkedinImport = urlParams.get('linkedin') === '1';
    // accountRole is now sent directly from backend — the actual DB role of the user
    const accountRoleFromUrl = urlParams.get('accountRole') || '';
    const isNewUserFromUrl = urlParams.get('isNewUser') === 'true';

    if (!token) return;
    if (isLinkedinImport && !token) return;

    tokenStorage.setAccess(token);

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      fetch(`${import.meta.env.VITE_API_URL || '/api'}/users/${payload.userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(userData => {
          // Use accountRole from URL if available (most reliable), fallback to DB
          const userRole = (accountRoleFromUrl || userData.role || userData.userType || 'candidate') as string;
          const displayName =
            userData.name && userData.name !== 'User'
              ? userData.name
              : userData.email?.split('@')[0] || 'User';

          const accountIsEmployer = isEmployerRole(userRole);
          const portalIsEmployer = intendedPortal === 'employer';
          // isNewUser: trust URL param (set by backend at creation time)
          const isNewUser = isNewUserFromUrl;

          // Mismatch: account role doesn't match the portal they used
          if (accountIsEmployer !== portalIsEmployer) {
            // If new user with wrong portal — delete the wrongly created account
            if (isNewUser) {
              fetch(`${import.meta.env.VITE_API_URL || '/api'}/users/${userData._id || userData.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              }).catch(() => {});
            }

            tokenStorage.clear();
            window.history.replaceState({}, document.title, window.location.pathname);
            setMismatch({
              actualRole: accountIsEmployer ? 'Employer' : 'Candidate',
              intendedPortal: portalIsEmployer ? 'Employer' : 'Candidate',
              correctPortal: accountIsEmployer ? 'Employer Login' : 'Candidate Login',
              correctRoute: accountIsEmployer ? 'employer-login' : 'login',
              isNewUser,
            });
            return;
          }

          const userObj = { ...userData, userType: userRole, role: userRole, name: displayName };
          localStorage.setItem('user', JSON.stringify(userObj));
          onLogin({ name: displayName, type: userRole as 'candidate' | 'employer' | 'admin', email: userData.email });
          window.history.replaceState({}, document.title, window.location.pathname);

          if (accountIsEmployer && !userData.company && !userData.companyName) {
            onNavigate('employer-register-complete');
          } else {
            onNavigate('dashboard');
          }
        })
        .catch(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          onNavigate('login');
        });
    } catch {
          tokenStorage.clear();
      onNavigate('login');
    }
  }, [onLogin, onNavigate]);

  const isEmployerCorrect = mismatch?.correctRoute === 'employer-login';

  if (mismatch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-500 rounded-full opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-indigo-500 rounded-full opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600 rounded-full opacity-5 blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                Zync<span className="text-blue-400">Jobs</span>
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Compact header */}
            <div className="bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 px-6 pt-6 pb-7 text-center relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.12),_transparent)] pointer-events-none" />
              <div className="relative inline-flex mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
                  <ShieldAlert className="w-6 h-6 text-white" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow">
                  <span className="text-yellow-900 text-[10px] font-black">!</span>
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-0.5">Wrong Login Portal</h2>
              <p className="text-orange-100 text-[10px] font-semibold uppercase tracking-[0.15em]">Account Mismatch Detected</p>
            </div>

            {/* Body */}
            <div className="px-6 pt-5 pb-6">

              {/* Role comparison — compact */}
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                  <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-1.5">
                    {(!mismatch.isNewUser && mismatch.actualRole === 'Employer')
                      ? <Briefcase className="w-4 h-4 text-blue-600" />
                      : <UserCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[9px] font-semibold text-blue-400 uppercase tracking-wider">Your Account</p>
                  <p className="text-xs font-bold text-blue-700 mt-0.5">
                    {mismatch.isNewUser ? mismatch.intendedPortal : mismatch.actualRole}
                  </p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                  <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-1.5">
                    {mismatch.intendedPortal === 'Employer'
                      ? <Briefcase className="w-4 h-4 text-red-500" />
                      : <UserCircle2 className="w-4 h-4 text-red-500" />}
                  </div>
                  <p className="text-[9px] font-semibold text-red-400 uppercase tracking-wider">Portal Used</p>
                  <p className="text-xs font-bold text-red-600 mt-0.5">{mismatch.intendedPortal}</p>
                </div>
              </div>

              {/* Info message — compact */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-5">
                <p className="text-gray-500 text-xs leading-relaxed text-center">
                  {mismatch.isNewUser
                    ? <>Account doesn't match the <span className="font-semibold text-gray-700">{mismatch.intendedPortal}</span> portal. Use the correct portal below.</>
                    : <>Registered as <span className="font-semibold text-blue-600">{mismatch.actualRole}</span>. Please use <span className="font-semibold text-green-600">{mismatch.correctPortal}</span> to continue.</>
                  }
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => onNavigate(mismatch.correctRoute)}
                  className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md shadow-blue-500/25 hover:-translate-y-0.5"
                >
                  {isEmployerCorrect ? <Briefcase className="w-4 h-4" /> : <UserCircle2 className="w-4 h-4" />}
                  Go to {mismatch.correctPortal}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => onNavigate('home')}
                  className="w-full flex items-center justify-center gap-2 text-gray-500 py-2.5 rounded-xl font-semibold text-sm hover:text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all duration-200"
                >
                  <Home className="w-3.5 h-3.5" /> Back to Home
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-blue-300/50 text-xs mt-5">
            Need help?{' '}
            <a href="mailto:support@zyncjobs.com" className="text-blue-300/80 hover:text-blue-200 underline underline-offset-2 transition-colors">
              support@zyncjobs.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Completing Google sign in...</p>
      </div>
    </div>
  );
};

export default TokenHandler;
