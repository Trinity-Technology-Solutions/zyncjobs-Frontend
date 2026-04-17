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

interface EmployerRegisterPageProps {
  onNavigate: (page: string) => void;
  onLogin: (userData: { name: string; type: 'candidate' | 'employer' | 'admin'; email?: string }) => void;
}

const EmployerRegisterPage: React.FC<EmployerRegisterPageProps> = ({ onNavigate }) => {
  useEffect(() => {
    if (localStorage.getItem('user')) onNavigate('dashboard');
  }, []);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', companyName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [companySuggestions, setCompanySuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToDeclaration, setAgreedToDeclaration] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fallbackCompanies = [
    { id: 1,   name: 'Zoho',                             domain: 'zoho.com',        logoUrl: 'https://img.logo.dev/zoho.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
    { id: 2,   name: 'TCS',                              domain: 'tcs.com',         logoUrl: 'https://img.logo.dev/tcs.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
    { id: 3,   name: 'Infosys',                          domain: 'infosys.com',     logoUrl: 'https://img.logo.dev/infosys.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
    { id: 10,  name: 'Google',                           domain: 'google.com',      logoUrl: 'https://img.logo.dev/google.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
    { id: 9,   name: 'Microsoft',                        domain: 'microsoft.com',   logoUrl: 'https://img.logo.dev/microsoft.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
    { id: 101, name: 'Trinity Technology Solutions LLC', domain: 'trinitetech.com', logoUrl: 'https://img.logo.dev/trinitetech.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80&retina=true' },
  ];

  const handleCompanyNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, companyName: value });
    setCompanyLogo('');
    if (value.trim().length >= 1) {
      try {
        const response = await fetch(`${API_ENDPOINTS.COMPANIES}?search=${encodeURIComponent(value)}`);
        if (response.ok) {
          const data = await response.json();
          const list: any[] = Array.isArray(data) ? data : (data.companies || data.data || []);
          setCompanySuggestions(list.slice(0, 6));
          const exact = list.find((c: any) => (c.name || c.companyName || '').toLowerCase() === value.toLowerCase());
          if (exact) { const logo = exact.logo || exact.logoUrl || ''; if (logo) setCompanyLogo(logo); }
        } else {
          setCompanySuggestions(fallbackCompanies.filter(c => c.name.toLowerCase().includes(value.toLowerCase())).slice(0, 6));
        }
        setShowSuggestions(true);
      } catch {
        const filtered = fallbackCompanies.filter(c => c.name.toLowerCase().includes(value.toLowerCase())).slice(0, 6);
        setCompanySuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const selectCompany = (company: any) => {
    setFormData({ ...formData, companyName: company.name });
    setCompanyLogo(company.logoUrl || company.logo || '');
    setShowSuggestions(false);
  };

  const handleStep1Next = () => {
    if (!formData.name.trim()) { setError('Please enter your full name.'); return; }
    if (!formData.companyName.trim()) { setError('Please enter your company name.'); return; }
    if (!formData.email.trim()) { setError('Please enter your company email.'); return; }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    try {
      const employerId = generateEmployerId();
      const response = await authAPI.register({
        email: formData.email, password: formData.password, name: formData.name,
        companyName: formData.companyName, companyLogo, userType: 'employer', employerId,
      });
      // Backend decides: company domain → auto verified, gmail/yahoo/etc. → pending admin
      const isVerified = response.verificationStatus === 'verified';
      const msg = isVerified
        ? '✅ Account created! Your company email was verified automatically. Redirecting to sign in...'
        : '⏳ Account created! Since you used a personal email (gmail/yahoo/etc.), your account is pending admin verification.';
      setSuccess(msg);
      showToast(msg, isVerified ? 'success' : 'warning');
      if (response.user) {
        if (!response.user.employerId) response.user.employerId = employerId;
        localStorage.setItem('user', JSON.stringify(response.user));
      }
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
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header onNavigate={onNavigate} />

      <div className="flex flex-1">
        <div className="flex w-full">

          {/* LEFT PANEL */}
          <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-10 relative bg-white sticky top-0 h-screen">
            <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-orange-50 opacity-60 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-blue-50 opacity-50 translate-x-1/3 translate-y-1/3" />

            <div className="relative z-10 w-full max-w-md flex flex-col gap-6">
              <button onClick={() => onNavigate('home')} className="flex items-center gap-2 text-orange-500 hover:text-orange-700 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Home</span>
              </button>

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-orange-50 text-orange-600 border border-orange-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                  Employer Portal
                </div>
                <h1 className="text-3xl font-bold leading-tight mb-3 text-gray-900">
                  Build Your<br />
                  <span className="text-orange-500">Dream Team</span>
                </h1>
                <p className="text-gray-500 text-sm mb-4">
                  Create your employer account and start connecting with top talent.
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

              <div className="grid grid-cols-3 gap-3">
                {[['10K+', 'Companies', 'text-orange-500'], ['500K+', 'Candidates', 'text-blue-600'], ['48hr', 'Avg. Hire', 'text-orange-500']].map(([num, label, clr]) => (
                  <div key={label} className="text-center p-2 rounded-xl bg-gray-50 border border-gray-100">
                    <div className={`text-lg font-bold ${clr}`}>{num}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL — form */}
          <div className="w-full lg:w-1/2 flex items-start justify-center px-8 py-6 bg-white border-l border-gray-100">
            <div className="w-full max-w-md">

              {/* Mobile back button */}
              <button onClick={() => onNavigate('home')} className="lg:hidden flex items-center gap-2 text-orange-500 hover:text-orange-700 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Home</span>
              </button>

              <div className="bg-white rounded-2xl shadow-xl p-8">

              {/* Step Indicator */}
              <div className="flex items-center justify-between mb-6">
                {['Company Info', 'Security'].map((label, i) => {
                  const num = i + 1;
                  const isActive = step === num;
                  const isDone = step > num;
                  return (
                    <React.Fragment key={label}>
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                          isDone ? 'bg-green-500 text-white' : isActive ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {isDone ? '✓' : num}
                        </div>
                        <span className={`text-xs font-medium ${isActive ? 'text-orange-500' : isDone ? 'text-green-500' : 'text-gray-400'}`}>{label}</span>
                      </div>
                      {i === 0 && <div className={`flex-1 h-0.5 mx-2 mb-4 transition-all ${step > 1 ? 'bg-green-400' : 'bg-gray-200'}`} />}
                    </React.Fragment>
                  );
                })}
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <span className="text-red-500 text-xs mt-0.5">⚠</span>
                  <span className="text-red-600 text-sm">{error}</span>
                </div>
              )}
              {success && (
                <div className="mb-4 flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <span className="text-green-500 text-xs mt-0.5">✓</span>
                  <span className="text-green-600 text-sm">{success}</span>
                </div>
              )}

              {/* STEP 1 */}
              {step === 1 && (
                <div>
                  <div className="mb-5">
                    <h2 className="text-xl font-bold text-gray-900">Create Employer Account</h2>
                    <p className="text-gray-500 text-sm mt-1">Start hiring top talent today</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                      <input type="text" name="name" value={formData.name} onChange={handleChange}
                        className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 focus:bg-white transition"
                        placeholder="Enter your full name" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Name</label>
                      <div className="relative">
                        {companyLogo && (
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded overflow-hidden z-10">
                            <img src={companyLogo} alt="" className="w-full h-full object-contain" onError={() => setCompanyLogo('')} />
                          </div>
                        )}
                        <input type="text" name="companyName" value={formData.companyName}
                          onChange={handleCompanyNameChange}
                          onFocus={() => formData.companyName.length >= 1 && setShowSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                          className={`w-full h-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 focus:bg-white transition ${companyLogo ? 'pl-10 pr-4' : 'px-4'}`}
                          placeholder="Enter company name" />
                        {showSuggestions && companySuggestions.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                            {companySuggestions.map((company) => (
                              <button key={company.id} type="button" onMouseDown={() => selectCompany(company)}
                                className="w-full text-left px-4 py-2.5 hover:bg-orange-50 border-b last:border-b-0 flex items-center gap-3">
                                <div className="bg-gray-100 w-7 h-7 rounded flex items-center justify-center p-1 flex-shrink-0">
                                  <img src={company.logoUrl || company.logo} alt={company.name} className="w-full h-full object-contain"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">{company.name}</div>
                                  <div className="text-xs text-gray-400">{company.domain}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Email</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange}
                        className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 focus:bg-white transition"
                        placeholder="Enter company email" />
                    </div>
                    <button type="button" onClick={handleStep1Next}
                      className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition-all">
                      Continue →
                    </button>
                  </div>

                  <div className="my-4 flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400">OR</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  <button type="button"
                    onClick={() => { window.location.href = `${import.meta.env.VITE_API_URL || '/api'}/auth/google/employer`; }}
                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </button>
                  <p className="text-center text-sm text-gray-500 mt-4">
                    Already have an account?{' '}
                    <button onClick={() => onNavigate('employer-login')} className="font-semibold text-orange-500 hover:text-orange-600">Sign in</button>
                  </p>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <form onSubmit={handleSubmit}>
                  <div className="mb-5">
                    <h2 className="text-xl font-bold text-gray-900">Set Your Password</h2>
                    <p className="text-gray-500 text-sm mt-1">Almost there! Secure your account</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                      <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                          className="w-full h-11 px-4 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 focus:bg-white transition"
                          placeholder="Create a password" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                      <div className="relative">
                        <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                          className="w-full h-11 px-4 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 focus:bg-white transition"
                          placeholder="Confirm your password" required />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${agreedToTerms ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                        <input type="checkbox" id="terms-employer" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)}
                          className="mt-0.5 w-4 h-4 accent-orange-500 cursor-pointer flex-shrink-0" />
                        <label htmlFor="terms-employer" className="text-xs text-gray-600 cursor-pointer leading-relaxed select-none">
                          I agree to ZyncJobs'{' '}
                          <button type="button" onClick={() => onNavigate('terms')} className="text-orange-500 hover:text-orange-700 underline font-semibold">Terms & Conditions</button>
                          {' '}and{' '}
                          <button type="button" onClick={() => onNavigate('privacy')} className="text-orange-500 hover:text-orange-700 underline font-semibold">Privacy Policy</button>.
                        </label>
                      </div>
                      <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${agreedToDeclaration ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                        <input type="checkbox" id="declaration-employer" checked={agreedToDeclaration} onChange={e => setAgreedToDeclaration(e.target.checked)}
                          className="mt-0.5 w-4 h-4 accent-orange-500 cursor-pointer flex-shrink-0" />
                        <label htmlFor="declaration-employer" className="text-xs text-gray-600 cursor-pointer leading-relaxed select-none">
                          I am an authorized representative of this company and agree to the{' '}
                          <button type="button" onClick={() => window.open('/terms#employer-declaration', '_blank')} className="text-orange-500 hover:text-orange-700 underline font-semibold">Employer Declaration</button>
                          {' '}— including posting accurate jobs and lawful use of candidate data.
                        </label>
                      </div>
                    </div>

                    <button type="submit" disabled={loading || !agreedToTerms || !agreedToDeclaration}
                      className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      {loading ? 'Creating Account...' : 'Create Employer Account'}
                    </button>
                    <button type="button" onClick={() => { setStep(1); setError(''); }}
                      className="w-full h-11 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 transition-all">
                      ← Back
                    </button>
                  </div>
                </form>
              )}

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EmployerRegisterPage;
