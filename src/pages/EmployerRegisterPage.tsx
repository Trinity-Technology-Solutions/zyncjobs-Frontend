import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ArrowLeft, Search, BarChart2, Shield, Zap } from 'lucide-react';
import { API_ENDPOINTS } from '../config/env';
import { authAPI } from '../api/auth';
import Header from '../components/Header';
import { generateEmployerId } from '../utils/employerIdUtils';

const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  const existingToast = document.getElementById('toast');
  if (existingToast) existingToast.remove();
  const toast = document.createElement('div');
  toast.id = 'toast';
  const colors = { success: 'bg-green-500 text-white', error: 'bg-red-500 text-white', warning: 'bg-yellow-500 text-white', info: 'bg-blue-500 text-white' };
  toast.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full ${colors[type]}`;
  toast.innerHTML = `<div class="flex items-center"><span>${message}</span><button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">×</button></div>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.remove('translate-x-full'), 100);
  setTimeout(() => toast.remove(), 4000);
};

interface EmployerRegisterPageProps {
  onNavigate: (page: string) => void;
  onLogin: (userData: { name: string; type: 'candidate' | 'employer' | 'admin'; email?: string }) => void;
}

const EmployerRegisterPage: React.FC<EmployerRegisterPageProps> = ({ onNavigate }) => {
  useEffect(() => {
    if (localStorage.getItem('user')) onNavigate('dashboard');
  }, []);

  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', companyName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [companySuggestions, setCompanySuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fallbackCompanies = [
    { id: 1,   name: 'Zoho',                           domain: 'zoho.com',        logoUrl: 'https://img.logo.dev/zoho.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
    { id: 2,   name: 'TCS',                            domain: 'tcs.com',         logoUrl: 'https://img.logo.dev/tcs.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
    { id: 3,   name: 'Infosys',                        domain: 'infosys.com',     logoUrl: 'https://img.logo.dev/infosys.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
    { id: 10,  name: 'Google',                         domain: 'google.com',      logoUrl: 'https://img.logo.dev/google.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
    { id: 9,   name: 'Microsoft',                      domain: 'microsoft.com',   logoUrl: 'https://img.logo.dev/microsoft.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
    { id: 101, name: 'Trinity Technology Solutions LLC', domain: 'trinitetech.com', logoUrl: 'https://img.logo.dev/trinitetech.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80&retina=true' },
  ];

  const handleCompanyNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, companyName: value });
    if (value.trim().length >= 1) {
      try {
        const response = await fetch(`${API_ENDPOINTS.COMPANIES}?search=${encodeURIComponent(value)}`);
        if (response.ok) {
          const data = await response.json();
          setCompanySuggestions(data.slice(0, 8));
        } else {
          setCompanySuggestions(fallbackCompanies.filter(c => c.name.toLowerCase().includes(value.toLowerCase())).slice(0, 8));
        }
        setShowSuggestions(true);
      } catch {
        const filtered = fallbackCompanies.filter(c => c.name.toLowerCase().includes(value.toLowerCase())).slice(0, 8);
        setCompanySuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      }
    } else {
      setShowSuggestions(false);
      setCompanyLogo('');
    }
  };

  const selectCompany = (company: any) => {
    setFormData({ ...formData, companyName: company.name });
    setCompanyLogo(company.logoUrl || company.logo);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    if (formData.password !== formData.confirmPassword) {
      const msg = 'Passwords do not match';
      setError(msg); showToast(msg, 'error'); setLoading(false); return;
    }
    if (formData.password.length < 6) {
      const msg = 'Password must be at least 6 characters long';
      setError(msg); showToast(msg, 'error'); setLoading(false); return;
    }
    try {
      const employerId = generateEmployerId();
      const response = await authAPI.register({
        email: formData.email, password: formData.password, name: formData.name,
        companyName: formData.companyName, companyLogo, userType: 'employer', employerId,
      });
      const isVerified = response.verificationStatus === 'verified';
      const msg = isVerified
        ? '✅ Account created and verified! Redirecting to sign in...'
        : '⏳ Account created! Pending admin verification. You will be notified once approved.';
      setSuccess(msg);
      showToast(msg, isVerified ? 'success' : 'warning');
      if (response.user) {
        if (!response.user.employerId) response.user.employerId = employerId;
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      setFormData({ name: '', email: '', password: '', confirmPassword: '', companyName: '' });
      setTimeout(() => onNavigate('employer-login'), isVerified ? 2000 : 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onNavigate={onNavigate} />

      <div className="flex flex-1">

        {/* LEFT PANEL */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-white">
          <div className="absolute top-10 left-10 w-80 h-80 rounded-full bg-orange-100 opacity-40" />
          <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-blue-100 opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-orange-50 opacity-60" />

          <div className="relative z-10 flex flex-col px-16 py-8 w-full justify-start gap-6">
            <button onClick={() => onNavigate('home')} className="flex items-center gap-2 text-orange-500 hover:text-orange-700 transition-colors w-fit">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Home</span>
            </button>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-orange-50 text-orange-600 border border-orange-200">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                Employer Portal
              </div>
              <h1 className="text-4xl font-bold leading-tight mb-3 text-gray-900">
                Build Your<br />
                <span className="text-orange-500">Dream Team</span>
              </h1>
              <p className="text-gray-500 text-base mb-6">
                Create your employer account and start connecting with top talent across the globe.
              </p>
              <div className="space-y-3">
                {[
                  { icon: Search,    text: 'AI-Powered Candidate Search',   color: 'text-blue-600',   bg: 'bg-blue-50' },
                  { icon: BarChart2, text: 'Advanced Analytics & Insights', color: 'text-orange-500', bg: 'bg-orange-50' },
                  { icon: Zap,       text: 'Instant Job Posting',           color: 'text-blue-600',   bg: 'bg-blue-50' },
                  { icon: Shield,    text: 'Verified Candidate Profiles',   color: 'text-orange-500', bg: 'bg-orange-50' },
                ].map(({ icon: Icon, text, color, bg }) => (
                  <div key={text} className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <span className="text-gray-700 text-sm font-medium">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[['10K+', 'Companies', 'text-orange-500'], ['500K+', 'Candidates', 'text-blue-600'], ['48hr', 'Avg. Hire Time', 'text-orange-500']].map(([num, label, clr]) => (
                <div key={label} className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className={`text-2xl font-bold ${clr}`}>{num}</div>
                  <div className="text-gray-500 text-xs mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12">
          <div className="w-full max-w-md">
            <button onClick={() => onNavigate('home')} className="lg:hidden flex items-center gap-2 text-orange-500 hover:text-orange-700 mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Home</span>
            </button>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="mb-7">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-orange-50 text-orange-600 border border-orange-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                  Employer Portal
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Create Employer Account</h2>
                <p className="text-gray-500 mt-1 text-sm">Start hiring top talent today</p>
              </div>

              {error && (
                <div className="mb-5 flex items-start space-x-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <span className="text-red-500 text-xs mt-0.5">⚠</span>
                  <span className="text-red-600 text-sm">{error}</span>
                </div>
              )}
              {success && (
                <div className="mb-5 flex items-start space-x-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <span className="text-green-500 text-xs mt-0.5">✓</span>
                  <span className="text-green-600 text-sm">{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input
                    type="text" name="name" value={formData.name} onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                    placeholder="Enter your full name" required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
                  <div className="relative">
                    <input
                      type="text" name="companyName" value={formData.companyName}
                      onChange={handleCompanyNameChange}
                      onFocus={() => formData.companyName.length >= 1 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                      placeholder="Enter your company name" required
                    />
                    {showSuggestions && companySuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {companySuggestions.map((company) => (
                          <button
                            key={company.id} type="button" onMouseDown={() => selectCompany(company)}
                            className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b last:border-b-0 transition-colors flex items-center space-x-3"
                          >
                            <div className="bg-gray-100 w-8 h-8 rounded flex items-center justify-center p-1 flex-shrink-0">
                              <img src={company.logoUrl || company.logo} alt={company.name} className="w-full h-full object-contain"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{company.name}</div>
                              <div className="text-xs text-gray-500">{company.domain}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Email</label>
                  <input
                    type="email" name="email" value={formData.email} onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                    placeholder="Enter company email" autoComplete="off" required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                      className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                      placeholder="Create a password" autoComplete="new-password" required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                      className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                      placeholder="Confirm your password" autoComplete="new-password" required
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm bg-orange-500 hover:bg-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : 'Create Employer Account'}
                </button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or continue with</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (localStorage.getItem('user')) { showToast('You are already logged in!', 'warning'); return; }
                  window.location.href = `${import.meta.env.VITE_API_URL || '/api'}/auth/google/employer`;
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <p className="text-center text-sm text-gray-500 mt-6">
                Already have an account?{' '}
                <button onClick={() => onNavigate('employer-login')} className="font-semibold text-orange-500 hover:text-orange-600">
                  Sign in
                </button>
              </p>
              <p className="text-center text-xs text-gray-400 mt-3">
                Looking for a job?{' '}
                <button onClick={() => onNavigate('login')} className="font-medium text-blue-500 hover:text-blue-700 underline">
                  Job seeker login
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
