import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, Eye, EyeOff } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/env';
import { tokenStorage } from '../../utils/tokenStorage';
import { debugAdminFlow } from '../../utils/adminDebug';

type Step = 'loading' | 'set-password' | 'success' | 'error';

interface Props {
  onNavigate: (page: string) => void;
  onLogin: (user: any) => void;
}

const AdminAcceptInvitePage: React.FC<Props> = ({ onNavigate, onLogin }) => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>('loading');
  const [error, setError] = useState('');
  const [invite, setInvite] = useState<{ name: string; email: string; role: string } | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const token = searchParams.get('token');

  // Clear any existing user session when accessing admin invite
  useEffect(() => {
    console.log('🔑 Admin invite page loaded, clearing any existing session...');
    
    // Clear any existing user data to prevent conflicts
    localStorage.removeItem('user');
    localStorage.removeItem('lastUserType');
    tokenStorage.clear();
    sessionStorage.clear();
    
    console.log('🔑 Existing session cleared');
  }, []);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. Please ask the super admin to resend the invite.');
      setStep('error');
      return;
    }
    
    console.log('🔑 Verifying invitation token:', token);
    console.log('🔑 API Base URL:', API_ENDPOINTS.BASE_URL);
    
    const verifyUrl = `${API_ENDPOINTS.BASE_URL}/admin/users/accept-invite/info/${token}`;
    console.log('🔑 Verification URL:', verifyUrl);
    
    fetch(verifyUrl)
      .then(r => {
        console.log('🔑 Verification response status:', r.status);
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}`);
        }
        return r.json();
      })
      .then(data => {
        console.log('🔑 Verification response data:', data);
        if (data.success) {
          setInvite({ name: data.name, email: data.email, role: data.role || 'admin' });
          setStep('set-password');
        } else {
          setError(data.error || 'Invalid or expired invitation link.');
          setStep('error');
        }
      })
      .catch((err) => { 
        console.error('🔑 Verification error:', err);
        setError(`Network error: ${err.message}. Please check if the backend is running.`); 
        setStep('error'); 
      });
  }, [token]);

  const handleSetPassword = async () => {
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setError('');
    setSubmitting(true);
    
    console.log('🔑 Starting admin activation process...');
    
    try {
      const res = await fetch(`${API_ENDPOINTS.BASE_URL}/admin/users/accept-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      
      console.log('🔑 Activation response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('🔑 Activation failed:', errorText);
        throw new Error(`Activation failed: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('🔑 Activation response data:', data);
      
      if (data.success) {
        console.log('🔑 Activation successful, setting up admin user...');
        
        // Clear any existing user data first
        console.log('🔑 Clearing existing user data...');
        localStorage.removeItem('user');
        localStorage.removeItem('lastUserType');
        tokenStorage.clear();
        
        // Set tokens - use both access and admin tokens for admin users
        console.log('🔑 Setting tokens...');
        tokenStorage.setAccess(data.accessToken);
        tokenStorage.setAdmin(data.accessToken); // Also set as admin token
        if (data.refreshToken) {
          tokenStorage.setRefresh(data.refreshToken);
        }
        
        // Ensure proper admin user type is set
        const userRole = data.user.role || 'admin';
        const adminUser = {
          ...data.user,
          type: userRole === 'super_admin' ? 'super_admin' : 'admin',
          userType: userRole === 'super_admin' ? 'super_admin' : 'admin',
          role: userRole,
          id: data.user._id || data.user.id,
          name: data.user.name || data.user.fullName || data.user.email?.split('@')[0] || 'Admin'
        };
        
        console.log('🔑 Final admin user object:', adminUser);
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(adminUser));
        localStorage.setItem('lastUserType', adminUser.type);
        
        // Verify storage immediately
        const storedUser = localStorage.getItem('user');
        const storedUserType = localStorage.getItem('lastUserType');
        console.log('🔍 Verification - Stored user:', storedUser);
        console.log('🔍 Verification - Stored userType:', storedUserType);
        
        // Call onLogin to update app state
        console.log('🔑 Calling onLogin...');
        onLogin(adminUser);
        
        setStep('success');
        
        // Debug info
        debugAdminFlow();
        
        // Wait longer to ensure all state is set before redirect
        setTimeout(() => {
          console.log('🎯 Redirecting to admin dashboard...');
          // Clear any candidate/employer specific data that might interfere
          sessionStorage.clear();
          
          // Force a complete page reload to ensure clean state
          window.location.replace('/admin/dashboard');
        }, 2500);
      } else {
        console.error('🔑 Activation failed:', data.error);
        setError(data.error || 'Failed to activate account.');
      }
    } catch (error: any) {
      console.error('🔑 Activation error:', error);
      setError(error.message || 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {step !== 'loading' && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-6">
              <img src="/images/zyncjobs-logo.png" alt="ZyncJobs" className="h-16 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
            <p className="text-blue-200">ZyncJobs Control Center</p>
          </div>
        )}

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-blue-200/50 shadow-2xl">
          {step === 'loading' && (
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Verifying invitation…</h2>
              <p className="text-gray-600 text-sm">Please wait a moment.</p>
            </div>
          )}

          {step === 'set-password' && invite && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin Invitation</h2>
                <p className="text-gray-600 text-sm mb-1">
                  You've been invited as a{' '}
                  <span className="font-semibold text-blue-600 capitalize">{invite.role.replace('_', ' ')}</span>
                </p>
                <p className="text-xs text-gray-500 mb-2">{invite.email}</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                </div>
              )}

              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSetPassword(); }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Set your password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 pr-12 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm password</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    onKeyDown={e => e.key === 'Enter' && handleSetPassword()}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !password || !confirm}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Activating…
                    </div>
                  ) : (
                    'Activate Admin Account'
                  )}
                </button>
              </form>
            </>
          )}

          {step === 'success' && invite && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Account Activated! 🎉</h2>
              <p className="text-gray-600 text-sm mb-6">
                Welcome, <span className="font-semibold text-gray-800">{invite.name}</span>. Redirecting to dashboard…
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-2000 ease-out" style={{ width: '100%' }} />
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Invitation Failed</h2>
              <p className="text-gray-600 text-sm mb-6">{error}</p>
              <button
                onClick={() => onNavigate('admin/login')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Go to Admin Login
              </button>
            </div>
          )}

          {step !== 'loading' && (
            <p className="text-center text-gray-500 text-sm mt-6">
              <button onClick={() => onNavigate('home')} className="hover:text-blue-600 transition-colors">
                ← Back to ZyncJobs
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAcceptInvitePage;
