import React, { useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, Building, Building2 } from 'lucide-react';
import { authAPI } from '../api/auth';
import Header from '../components/Header';

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
  toast.innerHTML = `
    <div class="flex items-center">
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">×</button>
    </div>
  `;
  
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.remove('translate-x-full'), 100);
  setTimeout(() => toast.remove(), 4000);
};

interface EmployerRegisterPageProps {
  onNavigate: (page: string) => void;
  onLogin: (userData: {name: string, type: 'candidate' | 'employer' | 'admin', email?: string}) => void;
}

const EmployerRegisterPage: React.FC<EmployerRegisterPageProps> = ({ onNavigate, onLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [companySuggestions, setCompanySuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      const errorMsg = 'Passwords do not match';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      const errorMsg = 'Password must be at least 6 characters long';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        companyName: formData.companyName,
        companyLogo: companyLogo,
        userType: 'employer'
      });
      
      const successMsg = 'Employer account created successfully! You can now sign in.';
      setSuccess(successMsg);
      showToast(successMsg, 'success');
      
      // Clear form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        companyName: ''
      });
      
      // Redirect to sign-in page after 2 seconds
      setTimeout(() => {
        onNavigate('employer-login');
      }, 2000);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getCompanyLogo = (companyName: string) => {
    const company = companyName.toLowerCase();
    if (company.includes('google')) {
      return 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png';
    }
    if (company.includes('microsoft')) {
      return 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b?ver=5c31';
    }
    return '/images/trinity-tech-logo.svg';
  };

  const handleCompanyNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, companyName: value });
    
    if (value.trim().length >= 1) {
      try {
        // Try API first
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/companies?search=${encodeURIComponent(value)}`);
        
        if (response.ok) {
          const data = await response.json();
          setCompanySuggestions(data.slice(0, 8));
          setShowSuggestions(true);
        } else {
          // Fallback to local data if API fails
          const companies = [
            { id: 1, name: 'Zoho', domain: 'zoho.com', logoUrl: 'https://img.logo.dev/zoho.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
            { id: 2, name: 'TCS', domain: 'tcs.com', logoUrl: 'https://img.logo.dev/tcs.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
            { id: 3, name: 'Infosys', domain: 'infosys.com', logoUrl: 'https://img.logo.dev/infosys.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
            { id: 10, name: 'Google', domain: 'google.com', logoUrl: 'https://img.logo.dev/google.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
            { id: 9, name: 'Microsoft', domain: 'microsoft.com', logoUrl: 'https://img.logo.dev/microsoft.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
            { id: 101, name: 'Trinity Technology Solutions LLC', domain: 'trinitetech.com', logoUrl: 'https://img.logo.dev/trinitetech.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80&retina=true' }
          ];
          
          const filtered = companies.filter(company => 
            company.name.toLowerCase().includes(value.toLowerCase())
          ).slice(0, 8);
          
          setCompanySuggestions(filtered);
          setShowSuggestions(filtered.length > 0);
        }
      } catch (error) {
        console.error('Company search failed:', error);
        // Fallback to local data
        const companies = [
          { id: 1, name: 'Zoho', domain: 'zoho.com', logoUrl: 'https://img.logo.dev/zoho.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
          { id: 2, name: 'TCS', domain: 'tcs.com', logoUrl: 'https://img.logo.dev/tcs.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
          { id: 3, name: 'Infosys', domain: 'infosys.com', logoUrl: 'https://img.logo.dev/infosys.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
          { id: 10, name: 'Google', domain: 'google.com', logoUrl: 'https://img.logo.dev/google.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
          { id: 9, name: 'Microsoft', domain: 'microsoft.com', logoUrl: 'https://img.logo.dev/microsoft.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
          { id: 101, name: 'Trinity Technology Solutions LLC', domain: 'trinitetech.com', logoUrl: 'https://img.logo.dev/trinitetech.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80&retina=true' }
        ];
        
        const filtered = companies.filter(company => 
          company.name.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 8);
        
        setCompanySuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      }
    } else {
      setShowSuggestions(false);
      setCompanyLogo('');
    }
  };

  const selectCompany = (company: any) => {
    console.log('Selected company:', company);
    setFormData({ ...formData, companyName: company.name });
    setCompanyLogo(company.logoUrl || company.logo);
    setShowSuggestions(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} />
      <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to home
        </button>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Join ZyncJobs as Employer</h2>
            <p className="text-gray-600">Start hiring top talent today</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleCompanyNameChange}
                  onFocus={() => formData.companyName.length >= 1 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your company name"
                  required
                />
                {showSuggestions && companySuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {companySuggestions.map((company) => (
                      <button
                        key={company.id}
                        type="button"
                        onMouseDown={() => selectCompany(company)}
                        className="w-full text-left px-4 py-3 hover:bg-green-50 border-b last:border-b-0 transition-colors flex items-center space-x-3"
                      >
                        <div className="bg-blue-100 w-8 h-8 rounded flex items-center justify-center p-1 flex-shrink-0">
                          <img 
                            src={company.logoUrl || company.logo} 
                            alt={`${company.name} logo`} 
                            className="w-full h-full object-contain"
                            crossOrigin="anonymous"
                            onLoad={() => console.log('Logo loaded:', company.name)}
                            onError={(e) => {
                              console.log('Logo failed:', company.name, e.currentTarget.src);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{company.name}</div>
                          <div className="text-xs text-gray-500">{company.domain}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your email"
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Confirm your password"
                  required
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
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Employer Account'}
            </button>
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
              type="button"
              onClick={() => {
                window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google/employer`;
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

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => onNavigate('employer-login')}
                className="text-red-600 hover:text-red-700 font-semibold"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default EmployerRegisterPage;