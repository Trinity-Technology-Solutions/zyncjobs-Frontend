import React, { useState } from 'react';
import { Eye, EyeOff, Building } from 'lucide-react';
import { authAPI } from '../api/auth';
import Header from '../components/Header';

interface EmployerLoginPageProps {
  onNavigate: (page: string, data?: any) => void;
  onLogin: (userData: {name: string, type: 'candidate' | 'employer'}) => void;
  onShowNotification?: (notification: {type: 'success' | 'error' | 'info', message: string}) => void;
}

const EmployerLoginPage: React.FC<EmployerLoginPageProps> = ({ onNavigate, onLogin, onShowNotification }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Use consistent name from backend - prioritize name field, fallback to company or email
      const displayName = response.user.name || response.user.companyName || response.user.company || response.user.fullName || response.user.email.split('@')[0];
      
      onLogin({ 
        name: displayName, 
        type: 'employer',
        email: response.user.email
      });
      
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
    <div className="min-h-screen bg-gray-100">
      <Header onNavigate={onNavigate} />

      <div className="flex items-center justify-center py-16 px-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="bg-red-600 text-white w-16 h-16 rounded flex items-center justify-center mx-auto mb-6 font-bold text-2xl">
              Z
            </div>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-sm text-teal-600 hover:text-teal-700 flex items-center space-x-1 ml-auto"
                >
                  <span>Show Password</span>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Access Dashboard'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => onNavigate('forgot-password')}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Forgot Password?
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
                className="text-teal-600 hover:text-teal-700 font-semibold"
              >
                Sign up
              </button>
            </p>
            <p className="text-gray-600">
              Looking for a job?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="text-teal-600 hover:text-teal-700 font-medium"
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