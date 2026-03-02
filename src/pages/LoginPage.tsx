import React, { useState } from 'react';
import { Search, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../api/auth';
import Header from '../components/Header';

interface LoginPageProps {
  onNavigate: (page: string, data?: any) => void;
  onLogin: (userData: {name: string, type: 'candidate' | 'employer'}) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onLogin }) => {
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
      console.log('🔐 Attempting login for:', email);
      const response = await authAPI.login({ email, password });
      
      if (response.user.userType === 'employer') {
        setError('This is an employer account. Please use "Employer Login" instead.');
        setLoading(false);
        return;
      }
      
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Use consistent name from backend - prioritize name field, fallback to fullName or email
      const displayName = response.user.name || response.user.fullName || response.user.email.split('@')[0];
      
      const userType = response.user.userType === 'employer' ? 'employer' : 'candidate';
      onLogin({ 
        name: displayName, 
        type: userType,
        email: response.user.email
      });
      
      // Check for pending job application
      const pendingApplication = localStorage.getItem('pendingJobApplication');
      if (pendingApplication) {
        const jobData = JSON.parse(pendingApplication);
        localStorage.removeItem('pendingJobApplication');
        // Store job data for application page
        localStorage.setItem('selectedJob', JSON.stringify(jobData));
        // Redirect to job application page
        onNavigate('job-application');
      } else {
        onNavigate('dashboard');
      }
      
    } catch (err) {
      console.error('❌ Login error:', err);
      let errorMessage = 'Login failed';
      
      if (err instanceof Error) {
        if (err.message.includes('Account not found')) {
          errorMessage = 'Account not found. Please register first.';
          // Show registration option
          setTimeout(() => {
            if (confirm('Account not found. Would you like to create a new account?')) {
              onNavigate('role-selection');
            }
          }, 1000);
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
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} />

      <div className="flex items-center justify-center py-16 px-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="bg-red-600 text-white w-16 h-16 rounded flex items-center justify-center mx-auto mb-6 font-bold text-2xl">
              Z
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome</h2>
            <p className="text-gray-600 text-center">
              Log in to continue
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Enter your email"
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
                  placeholder="Enter Password"
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
              {loading ? 'Signing In...' : 'Sign In'}
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
              Partner with us to help you hire top tech talent.
            </p>
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => {
                  console.log('Sign up button clicked in LoginPage');
                  console.log('Calling onNavigate with register');
                  onNavigate('register');
                }}
                className="text-teal-600 hover:text-teal-700 font-semibold"
              >
                Sign up
              </button>
            </p>
            
            {/* Quick registration hint */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 <strong>New user?</strong> Click "Sign up" to create your account with email: {email || 'your-email@example.com'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;