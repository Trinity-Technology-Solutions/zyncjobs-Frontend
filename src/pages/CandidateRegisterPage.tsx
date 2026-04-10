import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ArrowLeft, Briefcase, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { authAPI } from '../api/auth';
import Header from '../components/Header';
import LinkedInConnect, { type LinkedInProfile } from '../components/LinkedInConnect';

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

interface CandidateRegisterPageProps {
  onNavigate: (page: string) => void;
}

const CandidateRegisterPage: React.FC<CandidateRegisterPageProps> = ({ onNavigate }) => {
  useEffect(() => {
    if (localStorage.getItem('user')) onNavigate('dashboard');
  }, []);

  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    if (!agreedToTerms) {
      const msg = 'Please agree to the Terms & Conditions to continue';
      setError(msg); showToast(msg, 'error'); setLoading(false); return;
    }
    try {
      await authAPI.register({ email: formData.email, password: formData.password, name: formData.name, userType: 'candidate' });
      const msg = 'Account created successfully! You can now sign in.';
      setSuccess(msg);
      showToast(msg, 'success');
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      setTimeout(() => onNavigate('login'), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      if (msg.includes('already exists')) {
        setError('This email is already registered. Please sign in instead.');
        showToast('This email is already registered. Please sign in instead.', 'warning');
        setTimeout(async () => {
          const yes = await (window as any).confirmAsync('This email is already registered. Would you like to sign in instead?');
          if (yes) onNavigate('login');
        }, 500);
      } else {
        setError(msg);
        showToast(msg, 'error');
      }
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
          <div className="absolute top-10 right-10 w-80 h-80 rounded-full bg-blue-100 opacity-40" />
          <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-orange-100 opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-50 opacity-60" />

          <div className="relative z-10 flex flex-col px-16 py-8 w-full justify-start gap-6">
            <button onClick={() => onNavigate('home')} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors w-fit">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Home</span>
            </button>

            <div>
              <h1 className="text-4xl font-bold leading-tight mb-3 text-gray-900">
                Start Your <span className="text-blue-600">Career Journey</span>
              </h1>
              <p className="text-gray-500 text-base mb-6">
                Join thousands of candidates and connect with top employers across the globe.
              </p>
              <div className="space-y-3">
                {[
                  { icon: Briefcase,   text: '50,000+ Active Job Listings', color: 'text-blue-600',   bg: 'bg-blue-50' },
                  { icon: Users,       text: 'Top Companies Hiring Now',    color: 'text-orange-500', bg: 'bg-orange-50' },
                  { icon: TrendingUp,  text: 'AI-Powered Job Matching',     color: 'text-blue-600',   bg: 'bg-blue-50' },
                  { icon: CheckCircle, text: 'One-Click Easy Apply',        color: 'text-orange-500', bg: 'bg-orange-50' },
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

            {/* Lottie Animation */}
            <div className="flex justify-center items-center my-4">
              <dotlottie-wc 
                src="https://lottie.host/9c22dcff-4c93-48d8-b9ed-92f46ea5608f/wBQ6dCH7VB.lottie" 
                style={{width: '350px', height: '350px'}} 
                autoplay 
                loop
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[['2M+', 'Job Seekers', 'text-blue-600'], ['50K+', 'Companies', 'text-orange-500'], ['95%', 'Success Rate', 'text-blue-600']].map(([num, label, clr]) => (
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
            <button onClick={() => onNavigate('home')} className="lg:hidden flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Home</span>
            </button>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
                <p className="text-gray-500 mt-1 text-sm">Join the ZyncJobs network as a candidate</p>
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Enter your full name" required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email" name="email" value={formData.email} onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Enter your email" autoComplete="off" required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                      className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                      className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Confirm your password" autoComplete="new-password" required
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit" disabled={loading || !agreedToTerms}
                  className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 ${
                    agreedToTerms && !loading
                      ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-sm hover:shadow-md'
                      : 'bg-gray-300 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
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
                  if (!agreedToTerms) { showToast('Please agree to the Terms & Conditions before continuing.', 'error'); return; }
                  window.location.href = `${import.meta.env.VITE_API_URL || '/api'}/auth/google/candidate`;
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

              <LinkedInConnect
                mode="modal"
                className="w-full mt-2"
                onImport={(profile: LinkedInProfile) => {
                  if (!agreedToTerms) { showToast('Please agree to the Terms & Conditions before continuing.', 'error'); return; }
                  setFormData(prev => ({
                    ...prev,
                    name: profile.name || prev.name,
                    email: profile.email || prev.email,
                  }));
                  showToast('LinkedIn profile imported! Review your details and complete registration.', 'success');
                }}
              />

              <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors mt-4 ${agreedToTerms ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                <input
                  type="checkbox" id="terms-candidate" checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-blue-600 cursor-pointer flex-shrink-0"
                />
                <label htmlFor="terms-candidate" className="text-xs text-gray-600 cursor-pointer leading-relaxed select-none">
                  By creating an account, I agree to ZyncJobs'{' '}
                  <button type="button" onClick={() => onNavigate('terms')} className="text-blue-600 hover:text-blue-800 underline font-semibold">Terms & Conditions</button>
                  {' '}and{' '}
                  <button type="button" onClick={() => onNavigate('privacy')} className="text-blue-600 hover:text-blue-800 underline font-semibold">Privacy Policy</button>.
                </label>
              </div>

              <p className="text-center text-sm text-gray-500 mt-6">
                Already have an account?{' '}
                <button onClick={() => onNavigate('login')} className="font-semibold text-blue-600 hover:text-blue-700">
                  Sign in
                </button>
              </p>
              <p className="text-center text-xs text-gray-400 mt-3">
                Are you an employer?{' '}
                <button onClick={() => onNavigate('employer-register')} className="font-medium text-orange-500 hover:text-orange-600 underline">
                  Register your company
                </button>
              </p>
            </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default CandidateRegisterPage;
