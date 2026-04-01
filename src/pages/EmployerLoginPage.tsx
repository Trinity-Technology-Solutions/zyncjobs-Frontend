import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Building } from 'lucide-react';
import { authAPI } from '../api/auth';
import Header from '../components/Header';
import { generateEmployerId } from '../utils/employerIdUtils';

interface EmployerLoginPageProps {
  onNavigate: (page: string, data?: any) => void;
  onLogin: (userData: {name: string, type: 'candidate' | 'employer' | 'admin', email?: string}) => void;
  onShowNotification?: (notification: {type: 'success' | 'error' | 'info', message: string}) => void;
}

const EmployerLoginPage: React.FC<EmployerLoginPageProps> = ({ onNavigate, onLogin, onShowNotification }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (localStorage.getItem('user')) onNavigate('dashboard');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login({ email, password });
      
      if (response.user.userType !== 'employer' && response.user.role !== 'employer') {
        setError('This is a candidate account. Please use regular "Login" instead.');
        setLoading(false);
        return;
      }
      
      // Assign employer ID if not present
      if (!response.user.employerId) {
        response.user.employerId = generateEmployerId();
      }
      
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Use consistent name from backend - prioritize name field, fallback to company or email
      const displayName = response.user.name || response.user.companyName || response.user.company || response.user.fullName || response.user.email.split('@')[0];
      
      onLogin({ 
        name: displayName, 
        type: 'employer',
        email: response.user.email,
        id: response.user.id,
      } as any);
      
      onNavigate('dashboard');
      
      if (onShowNotification) {
        onShowNotification({
          type: 'success',
          message: 'Welcome back! Login successful.'
        });
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      
      if (onShowNotification) {
        onShowNotification({
          type: 'error',
          message: errorMessage
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} />

      <div className="flex items-center justify-center py-16 px-4">
        <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-lg w-full max-w-md p-8 card-hover">
          <div className="text-center mb-8">
            <img src="/images/zyncjobs-logo.png" alt="ZyncJobs" className="h-12 mx-auto mb-6 object-contain" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Employer Portal</h2>
            <p className="text-gray-600 text-center">
              Access your hiring dashboard
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-center space-x-2 text-red-600">
              <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">!</span>
              </div>
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter company email"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1 ml-auto"
                >
                  <span>Show Password</span>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Access Dashboard'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => onNavigate('forgot-password')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Forgot Password?
            </button>
          </div>

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
              type="button"
              onClick={() => {
                if (localStorage.getItem('user')) {
                  alert('You are already logged in!');
                  return;
                }
                window.location.href = `${import.meta.env.VITE_API_URL || '/api'}/auth/google/employer?portal=employer`;
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

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-4">
              Don't have an account?{' '}
              <button
                onClick={() => {
                  console.log('Sign up button clicked in EmployerLoginPage');
                  onNavigate('employer-register');
                }}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign up
              </button>
            </p>
            <p className="text-gray-600">
              Looking for a job?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Job seeker login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerLoginPage;
