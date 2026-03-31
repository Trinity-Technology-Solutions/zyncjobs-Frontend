import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface TokenHandlerProps {
  onLogin: (userData: {name: string, type: 'candidate' | 'employer' | 'admin', email?: string}) => void;
  onNavigate: (page: string) => void;
}

type MismatchInfo = {
  actualRole: string;
  intendedPortal: string;
  correctPortal: string;
  correctRoute: string;
};

const isEmployerRole = (role: string) =>
  ['employer', 'recruiter', 'company'].includes(role?.toLowerCase?.() ?? '');

const TokenHandler: React.FC<TokenHandlerProps> = ({ onLogin, onNavigate }) => {
  const [mismatch, setMismatch] = useState<MismatchInfo | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    // 'portal' is set by the Google button: 'candidate' or 'employer'
    const intendedPortal = (urlParams.get('portal') || urlParams.get('type') || 'candidate') as string;

    if (!token) return;

    localStorage.setItem('token', token);
    localStorage.setItem('accessToken', token);

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      fetch(`${import.meta.env.VITE_API_URL || '/api'}/users/${payload.userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(userData => {
          const userRole = (userData.role || userData.userType || 'candidate') as string;
          const displayName =
            userData.name && userData.name !== 'User'
              ? userData.name
              : userData.email?.split('@')[0] || 'User';

          const accountIsEmployer = isEmployerRole(userRole);
          const portalIsEmployer = intendedPortal === 'employer';

          // Role mismatch: employer account tried candidate portal, or vice-versa
          if (accountIsEmployer !== portalIsEmployer) {
            window.history.replaceState({}, document.title, window.location.pathname);
            // Clear tokens — don't log them in
            localStorage.removeItem('token');
            localStorage.removeItem('accessToken');
            setMismatch({
              actualRole: accountIsEmployer ? 'Employer' : 'Candidate',
              intendedPortal: portalIsEmployer ? 'Employer' : 'Candidate',
              correctPortal: accountIsEmployer ? 'Employer Login' : 'Candidate Login',
              correctRoute: accountIsEmployer ? 'employer-login' : 'login',
            });
            return;
          }

          const userObj = { ...userData, userType: userRole, name: displayName };
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
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      onNavigate('login');
    }
  }, [onLogin, onNavigate]);

  if (mismatch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Wrong Login Portal</h2>
          <p className="text-gray-600 text-sm mb-6">
            This Google account is registered as a{' '}
            <strong>{mismatch.actualRole}</strong> account. You tried signing in
            through the <strong>{mismatch.intendedPortal}</strong> portal.
            <br /><br />
            Please use <strong>{mismatch.correctPortal}</strong> to continue.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => onNavigate(mismatch.correctRoute)}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              Go to {mismatch.correctPortal}
            </button>
            <button
              onClick={() => onNavigate('home')}
              className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-medium text-sm"
            >
              Back to Home
            </button>
          </div>
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
