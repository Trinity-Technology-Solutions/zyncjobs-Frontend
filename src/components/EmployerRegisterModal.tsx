import React, { useState } from 'react';
import { X, Building, User, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { authAPI } from '../api/auth';
import CompanyAutocomplete from './CompanyAutocomplete';

interface EmployerRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
  onLogin: (userData: {name: string, type: 'candidate' | 'employer', email?: string}) => void;
}

const EmployerRegisterModal: React.FC<EmployerRegisterModalProps> = ({ isOpen, onClose, onNavigate, onLogin }) => {
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });

  if (!isOpen) return null;

  const validatePassword = (pwd: string) => {
    const feedback = [];
    let score = 0;

    if (pwd.length >= 8) score++; else feedback.push('At least 8 characters');
    if (/[A-Z]/.test(pwd)) score++; else feedback.push('One uppercase letter');
    if (/[a-z]/.test(pwd)) score++; else feedback.push('One lowercase letter');
    if (/\d/.test(pwd)) score++; else feedback.push('One number');
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++; else feedback.push('One special character');

    return { score, feedback };
  };

  const handleCompanySelect = (name: string, companyData?: any) => {
    if (companyData) {
      setCompanyName(companyData.name);
      if (companyData.domain) {
        setCompanyLogo(`https://logo.clearbit.com/${companyData.domain}`);
        setCompanyWebsite(companyData.website || `https://${companyData.domain}`);
      }
    } else {
      setCompanyName(name);
    }
  };

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd);
    setPasswordStrength(validatePassword(pwd));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const strength = validatePassword(password);
    if (strength.score < 4) {
      setError('Password must meet all security requirements');
      setLoading(false);
      return;
    }

    try {
      console.log('Registration data:', {
        email,
        name: contactPersonName,
        userType: 'employer',
        company: companyName,
        companyLogo,
        companyWebsite
      });
      
      const response = await authAPI.register({
        email,
        password,
        name: contactPersonName,
        userType: 'employer',
        company: companyName,
        companyLogo,
        companyWebsite
      });
      
      console.log('Registration response:', response);
      
      setSuccess('Employer account created successfully! Logging you in...');
      
      // Auto-login after successful registration
      setTimeout(async () => {
        try {
          const loginResponse = await authAPI.login({ email, password });
          console.log('Auto-login response:', loginResponse);
          
          // Store user data in localStorage
          localStorage.setItem('user', JSON.stringify(loginResponse.user));
          
          // Use consistent name from backend - prioritize name field, fallback to company or email
          const displayName = loginResponse.user.name || loginResponse.user.companyName || loginResponse.user.company || loginResponse.user.fullName || loginResponse.user.email.split('@')[0];
          
          // Call onLogin
          onLogin({ 
            name: displayName, 
            type: 'employer',
            email: loginResponse.user.email
          });
          
          // Close modal and navigate to dashboard
          onClose();
          onNavigate('dashboard');
        } catch (loginErr) {
          console.error('Auto-login failed:', loginErr);
          // Fallback to manual login
          onClose();
          onNavigate('employer-login');
        }
      }, 1500);
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 p-2">
              <img 
                src="/images/trinity-tech-logo.svg" 
                alt="Trinity Technology" 
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-600 text-sm">Join to find top talent</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <CompanyAutocomplete
                value={companyName}
                onChange={(name, data) => {
                  if (data) {
                    handleCompanySelect(name, data);
                  } else {
                    setCompanyName(name);
                  }
                }}
                placeholder="Search company (e.g., Google, Microsoft)..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
              {companyLogo && (
                <div className="mt-2 flex items-center space-x-2 text-xs text-green-600">
                  <img 
                    src={companyLogo} 
                    alt="Company logo" 
                    className="w-6 h-6 rounded object-cover" 
                    onError={(e) => {
                      console.log('Logo failed to load:', companyLogo);
                      // Don't hide the element, just show a fallback
                      (e.target as HTMLImageElement).src = '/images/trinity-tech-logo.svg';
                    }} 
                  />
                  <span>✓ Company verified</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={contactPersonName}
                  onChange={(e) => setContactPersonName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  placeholder="Enter contact person name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  placeholder="Enter company email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  placeholder="Create a password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all ${
                          passwordStrength.score <= 2 ? 'bg-red-500' :
                          passwordStrength.score === 3 ? 'bg-yellow-500' :
                          passwordStrength.score === 4 ? 'bg-green-400' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.score <= 2 ? 'text-red-500' :
                      passwordStrength.score === 3 ? 'text-yellow-500' :
                      passwordStrength.score === 4 ? 'text-green-400' :
                      'text-green-500'
                    }`}>
                      {passwordStrength.score <= 2 ? 'Weak' :
                       passwordStrength.score === 3 ? 'Fair' :
                       passwordStrength.score === 4 ? 'Good' :
                       'Strong'}
                    </span>
                  </div>
                  
                  {passwordStrength.feedback.length > 0 && (
                    <div className="text-xs text-gray-600">
                      <p className="font-medium mb-1">Required:</p>
                      <div className="grid grid-cols-1 gap-1">
                        {passwordStrength.feedback.map((item, index) => (
                          <div key={index} className="flex items-center space-x-1">
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {passwordStrength.score === 5 && (
                    <div className="flex items-center space-x-1 text-green-600 text-xs">
                      <CheckCircle className="w-3 h-3" />
                      <span>Strong password!</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  placeholder="Confirm your password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || passwordStrength.score < 4}
              className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-4">
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
                window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google?userType=employer`;
              }}
              className="mt-3 w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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

          <div className="mt-4 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <button
                onClick={() => {
                  onClose();
                  onNavigate('employer-login');
                }}
                className="text-green-600 hover:text-green-700 font-semibold"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerRegisterModal;