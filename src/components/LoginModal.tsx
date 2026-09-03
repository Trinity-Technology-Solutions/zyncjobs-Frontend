import React, { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { authAPI } from '../api/auth';
import { GOOGLE_AUTH_BASE } from '../config/env';
import { FormLoading } from './LoadingStates';
import { updateUserInStorage } from '../utils/userStorage';
import WorkButton from './animata/button/work-button';

// Toast notification function
const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  const existingToast = document.getElementById('toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
  
  const colors = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white'
  };
  
  toast.className += ` ${colors[type]}`;

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

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
  onLogin: (userData: {name: string, type: 'candidate' | 'employer' | 'admin', email?: string}) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onNavigate, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  if (!isOpen) return null;

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

    console.log('Attempting login with:', { email });

    try {
      const response = await authAPI.login({ email, password });
      console.log('Login successful:', response);
      
      // Check if account is deleted or suspended
      const accountStatus = response.user.status as string | undefined;
      if (accountStatus === 'deleted') {
        setError('This account has been permanently deleted. You cannot log in.');
        showToast('This account has been deleted.', 'error');
        setLoading(false);
        return;
      }
      
      if (accountStatus === 'suspended') {
        setError('This account has been suspended. Please contact support.');
        showToast('This account is suspended.', 'error');
        setLoading(false);
        return;
      }
      
      // Check if this is an employer account - REJECT if so
      const apiUserType = response.user.userType as string;
      if (apiUserType === 'employer' || apiUserType === 'recruiter') {
        setError('This is an employer account. Please use "Employer Login" instead.');
        setLoading(false);
        return;
      }
      
      // Store user data in localStorage
      updateUserInStorage(response.user);
      
      // Use consistent name from backend - prioritize name field, fallback to fullName or email
      const displayName = response.user.fullName || response.user.name || response.user.email.split('@')[0];
      
      // Show success toast
      showToast(`Welcome back, ${displayName}!`, 'success');
      
      // Call onLogin with user data
      console.log('Raw API response userType:', response.user.userType);
      const userType: 'candidate' | 'employer' = (apiUserType === 'employer' || apiUserType === 'recruiter') ? 'employer' : 'candidate';
      console.log('Mapped user type for app:', userType);
      onLogin({ 
        name: displayName, 
        type: userType,
        email: response.user.email
      });
      
      // Always go to dashboard after login
      onNavigate('dashboard');
      
      // Clear any pending job role
      sessionStorage.removeItem('pendingJobRole');
      
      onClose();
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      setFieldErrors({});
      if (err.locked) {
        onClose();
        const event = new CustomEvent('zync:account-locked', {
          detail: { lockoutMinutes: err.lockoutMinutes || 15, email }
        });
        window.dispatchEvent(event);
        return;
      }
      if (err.remainingAttempts !== undefined) {
        setRemainingAttempts(err.remainingAttempts);
      }
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          aria-label="Close login modal"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 relative">
          {loading && <FormLoading message="Authenticating..." />}
          <div className="text-center mb-8">
            <img src="/images/zyncjobs-logo.png" alt="ZyncJobs" className="h-10 mx-auto mb-4 object-contain" />
            <h2 id="login-modal-title" className="text-3xl font-bold text-gray-900 mb-2">Welcome</h2>
            <p className="text-gray-600">Log in to continue</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <p>{error}</p>
              {remainingAttempts !== null && remainingAttempts <= 3 && (
                <p className="text-xs mt-1 font-medium">{remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining before account lockout.</p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${fieldErrors.email ? 'text-red-400' : 'text-gray-400'}`} aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' })); }}
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
                {fieldErrors.email && <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />}
              </div>
              {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative flex items-center">
                <Lock className={`absolute left-3 w-5 h-5 pointer-events-none ${fieldErrors.password ? 'text-red-400' : 'text-gray-400'}`} aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' })); }}
                  className={`w-full h-12 pl-10 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="Enter Password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 flex items-center justify-center h-full text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (localStorage.getItem('user')) {
                  showToast('You are already logged in!', 'warning');
                  return;
                }
                window.location.href = `${GOOGLE_AUTH_BASE}/api/auth/google/candidate?portal=candidate`;
              }}
              className="mt-4 w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="mt-6 flex flex-col items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onNavigate('forgot-password');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Forgot Password?
            </button>
            <button
              onClick={() => {
                onClose();
                onNavigate('verify-email');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Verify Email
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-4">
              Partner with us to help you hire top tech talent.
            </p>

            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => {
                  onClose();
                  onNavigate('candidate-register');
                }}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;

