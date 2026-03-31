import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface TokenHandlerProps {
  onLogin: (userData: { name: string; type: 'candidate' | 'employer' | 'admin'; email?: string }) => void;
  onNavigate: (page: string) => void;
}

type MismatchInfo = {
  actualRole: string;
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

    if (!token) return;

    // Read intended portal set before Google redirect — localStorage survives full-page redirects
    const intendedPortal = localStorage.getItem('googleAuthPortal') || 'candidate';
    localStorage.removeItem('googleAuthPortal');

    // Decode JWT payload immediately
    let payload: any = {};
    try {
      payload = JSON.parse(atob(token.split('.')[1]));
    } catch {
      onNavigate('login');
      return;
    }

    const tokenRole = (payload.userType || payload.role || payload.type || '') as string;
    const accountIsEmployer = isEmployerRole(tokenRole);
    const portalIsEmployer = intendedPortal === 'employer';

    // Block immediately if JWT role doesn't match the portal
    if (tokenRole && accountIsEmployer !== portalIsEmployer) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setMismatch({
        actualRole: accountIsEmployer ? 'Employer' : 'Candidate',
        correctPortal: accountIsEmployer ? 'Employer Login' : 'Candidate Login',
        correctRoute: accountIsEmployer ? 'employer-login' : 'login',
      });
      return;
    }

    // Role matches — store token and fetch full user profile
    localStorage.setItem('token', token);
    localStorage.setItem('accessToken', token);

    fetch(`${import.meta.env.VITE_API_URL || '/api'}/users/${payload.userId || payload.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(userData => {
        const userRole = (userData.role || userData.userType || tokenRole || 'candidate') as string;
        const accountIsEmployerFinal = isEmployerRole(userRole);

        // Double-check with actual DB role
        if (accountIsEmployerFinal !== portalIsEmployer) {
          window.history.replaceState({}, document.title, window.location.pathname);
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
          setMismatch({
            actualRole: accountIsEmployerFinal ? 'Employer' : 'Candidate',
            correctPortal: accountIsEmployerFinal ? 'Employer Login' : 'Candidate Login',
            correctRoute: accountIsEmployerFinal ? 'employer-login' : 'login',
          });
          return;
        }

        const displayName =
          userData.name && userData.name !== 'User'
            ? userData.name
            : userData.email?.split('@')[0] || 'User';

        const userObj = { ...userData, userType: userRole, name: displayName };
        localStorage.setItem('user', JSON.stringify(userObj));
        onLogin({ name: displayName, type: userRole as 'candidate' | 'employer' | 'admin', email: userData.email });
        window.history.replaceState({}, document.title, window.location.pathname);

        if (accountIsEmployerFinal && !userData.company && !userData.companyName) {
          onNavigate('employer-register-complete');
        } else {
          onNavigate('dashboard');
        }
      })
      .catch(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
        onNavigate('login');
      });
  }, [onLogin, onNavigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Completing Google sign in...</p>
      </div>

      {/* Role mismatch popup — same style as EmployerLoginModal wrongRolePopup */}
      {mismatch && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Account Already Registered
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              This Google account is already registered as a{' '}
              <strong>{mismatch.actualRole}</strong> account and cannot be used
              to access this portal.
              <br /><br />
              Please use <strong>{mismatch.correctPortal}</strong> to continue.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => onNavigate('home')}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => onNavigate(mismatch.correctRoute)}
                className="flex-1 bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 text-sm font-medium"
              >
                Go to {mismatch.correctPortal}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenHandler;
