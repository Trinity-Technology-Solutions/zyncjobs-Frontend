import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Search, BarChart2, Shield, Zap, CheckCircle, Clock, Target, FileText, X, AlertTriangle, ArrowRight, ArrowLeft, Building2, AlertCircle } from 'lucide-react';
import BackButton from '../components/BackButton';
import { API_ENDPOINTS } from '../config/env';
import { authAPI } from '../api/auth';
import Header from '../components/Header';
import { generateEmployerId } from '../utils/employerIdUtils';
import { EnhancedCompanyVerificationService as CompanyVerificationService, type DomainVerificationResult, type CompanyProfile } from '../services/enhancedCompanyVerificationService';
import { updateUserInStorage } from '../utils/userStorage';

const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  const existingToast = document.getElementById('toast');
  if (existingToast) existingToast.remove();
  const toast = document.createElement('div');
  toast.id = 'toast';
  const colors = { success: 'bg-green-500 text-white', error: 'bg-red-500 text-white', warning: 'bg-yellow-500 text-white', info: 'bg-blue-500 text-white' };
  toast.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full ${colors[type]}`;
  const wrapper = document.createElement('div');
  wrapper.className = 'flex items-center gap-3';
  const span = document.createElement('span');
  span.textContent = message;
  const btn = document.createElement('button');
  btn.className = 'ml-4 text-white hover:text-gray-200 flex items-center justify-center';
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
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
    // Handle Google OAuth invite-only block redirect - check this FIRST before dashboard redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('blocked') === '1') {
      const cName = params.get('company') || 'This company';
      setError(`COMPANY_EXISTS:${cName}`);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    if (localStorage.getItem('user')) onNavigate('dashboard');
  }, []);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', companyName: '', otp: '', gstNumber: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [companySuggestions, setCompanySuggestions] = useState<CompanyProfile[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [gstLoading, setGstLoading] = useState(false);
  const [gstVerification, setGstVerification] = useState<{ verified: boolean; legalName?: string; tradeName?: string; status?: string; state?: string } | null>(null);

  const [domainVerification, setDomainVerification] = useState<DomainVerificationResult | null>(null);
  const [selectedCompanyProfile, setSelectedCompanyProfile] = useState<CompanyProfile | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [showVerificationDetails, setShowVerificationDetails] = useState(false);

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToDeclaration, setAgreedToDeclaration] = useState(false);
  const [gstMismatch, setGstMismatch] = useState<{ typed: string; gst: string } | null>(null);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] as string[] });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validatePassword = (pwd: string) => {
    const feedback: string[] = [];
    let score = 0;
    if (pwd.length >= 8) score++; else feedback.push('At least 8 characters');
    if (/[A-Z]/.test(pwd)) score++; else feedback.push('One uppercase letter');
    if (/[a-z]/.test(pwd)) score++; else feedback.push('One lowercase letter');
    if (/\d/.test(pwd)) score++; else feedback.push('One number');
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++; else feedback.push('One special character');
    return { score, feedback };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
    if (name === 'password') {
      setPasswordStrength(validatePassword(value));
    }
  };

  const handleCompanyNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, companyName: value });
    setCompanyLogo('');
    setSelectedCompanyProfile(null);
    setDomainVerification(null);

    if (value.trim().length >= 2) {
      try {
        const suggestions = await CompanyVerificationService.getCompanySuggestions(value);
        setCompanySuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch (error) {
        console.error('Error fetching company suggestions:', error);
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const selectCompany = (company: CompanyProfile) => {
    setFormData({ ...formData, companyName: company.name });
    setCompanyLogo(company.logo || '');
    setSelectedCompanyProfile(company);
    setShowSuggestions(false);

    if (company.verified) {
      setDomainVerification({
        isValid: true,
        isCompanyDomain: true,
        companyProfile: company,
        verificationMethod: 'company_database',
        message: 'Company found in database and verified'
      });
    }
  };

  const handleDomainVerification = async () => {
    if (!formData.email.trim() || !formData.companyName.trim()) {
      setError('Please enter both company name and email');
      return;
    }
    setVerificationLoading(true);
    setError('');
    try {
      const result = await CompanyVerificationService.verifyCompanyDomain(formData.email, formData.companyName);
      setDomainVerification(result);
      if (result.companyProfile) {
        setSelectedCompanyProfile(result.companyProfile);
        setCompanyLogo(result.companyProfile.logo || '');
      }
    } catch (error) {
      setError('Domain verification failed. Please try again.');
      showToast('Domain verification failed', 'error');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleGSTVerification = async () => {
    const gst = formData.gstNumber.trim().toUpperCase();
    if (!gst) { setError('Please enter your GST number.'); return; }
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gst)) { setError('Invalid GST number format. Example: 22AAAAA0000A1Z5'); return; }

    setGstLoading(true);
    setError('');
    setGstVerification(null);
    try {
      const res = await fetch(`${API_ENDPOINTS.BASE_URL}/verify/gst`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gstin: gst }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const d = data.data || {};
        const tradeName = d.trade_name || d.tradeName || '';
        const legalName = d.legal_name || d.legalName || '';
        setGstVerification({
          verified: true,
          legalName,
          tradeName,
          status: d.gstin_status || d.status || 'Active',
          state: d.state || '',
        });
        const autoName = tradeName || legalName;
        const typedName = formData.companyName.trim();
        if (autoName) {
          if (typedName && typedName.toLowerCase() !== autoName.toLowerCase()) {
            setGstMismatch({ typed: typedName, gst: autoName });
          } else {
            setGstMismatch(null);
          }
          setFormData(prev => ({ ...prev, companyName: autoName }));
        }
      } else {
        setGstVerification({ verified: false });
        setError(data.message || 'Invalid GST Number. Please check and try again.');
      }
    } catch {
      setGstVerification({ verified: false });
      setError('GST verification service unavailable. Please try again later.');
    } finally {
      setGstLoading(false);
    }
  };

  const handleStep1Next = async () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Name is required';
    if (!formData.companyName.trim()) errs.companyName = 'Company name is required';
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) errs.email = 'Invalid email format';
    // GST is optional — verification can be done later, leave the validation logic commented out
    // if (!formData.gstNumber.trim()) errs.gstNumber = 'GST number is required';
    // else if (!gstVerification) errs.gstNumber = 'Please verify your GST number';
    // else if (!gstVerification.verified) errs.gstNumber = 'GST verification failed';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setError('');
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.OTP_SEND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim(), name: formData.name.trim(), userType: 'employer' })
      });
      const data = await response.json();
      if (response.ok) {
        setOtpSent(true);
        setStep(2);
        setResendTimer(60);
        showToast('Verification code sent to your email', 'success');
      } else {
        setError(data.error || 'Failed to send verification code');
        showToast(data.error || 'Failed to send verification code', 'error');
      }
    } catch (err) {
      setError('Failed to send verification code');
      setFieldErrors({});
      showToast('Failed to send verification code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (formData.otp.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(API_ENDPOINTS.OTP_VERIFY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: formData.otp })
      });
      const data = await response.json();
      if (response.ok && data.verified) {
        setOtpVerified(true);
        setError('');
        setStep(3);
        showToast('Email verified successfully!', 'success');
      } else {
        setError(data.error || 'Invalid verification code');
        showToast(data.error || 'Invalid verification code', 'error');
      }
    } catch (err) {
      setError('Verification failed');
      showToast('Verification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.OTP_RESEND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, name: formData.name, userType: 'employer' })
      });
      const data = await response.json();
      if (response.ok) {
        setResendTimer(60);
        showToast('New code sent to your email', 'success');
      } else {
        showToast(data.error || 'Failed to resend code', 'error');
      }
    } catch (err) {
      showToast('Failed to resend code', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!formData.password) errs.password = 'Password is required';
    else {
      const strength = validatePassword(formData.password);
      if (strength.score < 4) errs.password = 'Must include 8+ characters, uppercase, lowercase, number, and special character';
    }
    if (!formData.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!agreedToTerms) errs.terms = 'Please agree to the Terms & Conditions';
    if (!agreedToDeclaration) errs.declaration = 'Please agree to the Employer Declaration';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    setError('');
    try {
      const employerId = generateEmployerId();
      const registrationData: any = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        companyName: formData.companyName,
        companyLogo,
        userType: 'employer' as const,
        employerId,
        gstNumber: formData.gstNumber.trim().toUpperCase(),
      };
      if (gstVerification?.verified) registrationData.gstVerification = gstVerification;
      if (domainVerification) registrationData.domainVerification = domainVerification;
      if (selectedCompanyProfile) registrationData.companyProfile = selectedCompanyProfile;

      const response = await authAPI.register(registrationData);

      setSuccess('Registration successful! Your account is pending admin verification. You will receive an email once approved.');
      showToast('Registration submitted! Awaiting admin approval.', 'info');

      // Do NOT navigate to dashboard - account is pending
      setTimeout(() => onNavigate('employer-login'), 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      if (msg.includes('already has an account') || msg.includes('COMPANY_ALREADY_EXISTS') || msg.includes('already registered') || msg.includes('already exists')) {
        const companyMatch = msg.match(/^(.+?) already has an account/);
        const cName = companyMatch ? companyMatch[1] : formData.companyName || 'Your company';
        setError(`COMPANY_EXISTS:${cName}`);
        showToast('Company already registered - joining as team member', 'warning');
      } else {
        setError(msg);
        showToast(msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header onNavigate={onNavigate} />

      <div className="flex flex-1">

        {/* LEFT PANEL */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-white">
          <div className="absolute top-10 left-10 w-80 h-80 rounded-full bg-orange-100 opacity-40" />
          <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-blue-100 opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-orange-50 opacity-60" />

          <div className="relative z-10 flex flex-col justify-between px-16 py-12 w-full">
            <BackButton fallback="/" />

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-orange-50 text-orange-600 border border-orange-200">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                Employer Portal
              </div>
              <h1 className="text-4xl font-bold leading-tight mb-4 text-gray-900">
                Build Your<br />
                <span className="text-orange-500">Dream Team</span>
              </h1>
              <p className="text-gray-500 text-base mb-10">
                Create your employer account and start connecting with top talent.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Search,    text: 'AI-Powered Candidate Search',   color: 'text-blue-600',   bg: 'bg-blue-50' },
                  { icon: BarChart2, text: 'Advanced Analytics & Insights', color: 'text-orange-500', bg: 'bg-orange-50' },
                  { icon: Zap,       text: 'Instant Job Posting',           color: 'text-blue-600',   bg: 'bg-blue-50' },
                  { icon: Shield,    text: 'Verified Candidate Profiles',   color: 'text-orange-500', bg: 'bg-orange-50' },
                ].map(({ icon: Icon, text, color, bg }) => (
                  <div key={text} className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bg}`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <span className="text-gray-700 text-sm font-medium">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 mt-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-50 border border-orange-100">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <BarChart2 className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Quick Posting</div>
                  <div className="text-gray-500 text-xs mt-1">Post jobs in under 2 minutes</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Smart Shortlists</div>
                  <div className="text-gray-500 text-xs mt-1">AI matches best candidates</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-50 border border-orange-100">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Instant Collaboration</div>
                  <div className="text-gray-500 text-xs mt-1">Work with your team seamlessly</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12 relative overflow-hidden">
          <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-orange-100 opacity-15 pointer-events-none" />
          <div className="absolute bottom-20 left-10 w-64 h-64 rounded-full bg-blue-100 opacity-15 pointer-events-none" />

          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8">

              {/* Step Indicator */}
              <div className="flex items-center justify-between mb-6">
                {['Company & GST', 'Verify Email', 'Security'].map((label, i) => {
                  const num = i + 1;
                  const isActive = step === num;
                  const isDone = step > num;
                  return (
                    <React.Fragment key={label}>
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                          isDone ? 'bg-green-500 text-white' : isActive ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {isDone ? <CheckCircle className="w-4 h-4" /> : num}
                        </div>
                        <span className={`text-xs font-medium ${isActive ? 'text-orange-500' : isDone ? 'text-green-500' : 'text-gray-400'}`}>{label}</span>
                      </div>
                      {i < 2 && <div className={`flex-1 h-0.5 mx-2 mb-4 transition-all ${step > i + 1 ? 'bg-green-400' : 'bg-gray-200'}`} />}
                    </React.Fragment>
                  );
                })}
              </div>

              {gstMismatch && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-amber-800 text-sm font-semibold">Company name mismatch</p>
                      <p className="text-amber-700 text-xs mt-0.5">
                        You entered <span className="font-semibold line-through">{gstMismatch.typed}</span>, but your GST is registered under <span className="font-semibold">{gstMismatch.gst}</span>. The company name has been updated to match GST records.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && !error.startsWith('COMPANY_EXISTS:') && (
                <div className="mb-4 flex flex-col gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-red-600 text-sm whitespace-pre-line">{error}</span>
                  </div>
                  {error.includes('Team Management') && (
                    <button
                      type="button"
                      onClick={() => onNavigate('employer-login')}
                      className="self-start mt-1 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                    >
                      Go to Login instead <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {error.startsWith('COMPANY_EXISTS:') && (() => {
                const cName = error.replace('COMPANY_EXISTS:', '');
                return (
                  <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-orange-500 flex-shrink-0" />
                      <p className="font-semibold text-gray-900 text-sm leading-tight">
                        <span className="text-orange-600">{cName}</span> is already on ZyncJobs
                      </p>
                    </div>
                    <p className="text-gray-500 text-xs mb-3">Choose how you'd like to proceed:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onNavigate('employer-login')}
                        className="h-9 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1"
                      >
                        Login <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setError('');
                          setLoading(true);
                          try {
                            const employerId = generateEmployerId();
                            const response = await authAPI.register({
                              email: formData.email,
                              password: formData.password || 'TempPass@123',
                              name: formData.name,
                              companyName: formData.companyName,
                              companyLogo,
                              userType: 'employer' as const,
                              employerId,
                              isTeamMember: true,
                              domainVerification,
                              companyProfile: selectedCompanyProfile
                            });
                            if (response.user) updateUserInStorage(response.user);
                            sessionStorage.setItem('isFirstVisitAfterRegistration', 'true');
                            setSuccess('Registered as team member! Redirecting...');
                            setTimeout(() => onNavigate('dashboard'), 1500);
                          } catch (e2) {
                            setError((e2 instanceof Error ? e2.message : 'Registration failed'));
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading || !formData.password}
                        className="h-9 border border-orange-400 text-orange-600 hover:bg-orange-50 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                      >
                        {loading ? 'Joining...' : 'Join as Team Member'}
                      </button>
                    </div>
                    {!formData.password && (
                      <p className="text-xs text-amber-700 mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Complete Step 3 first to join as team member.
                      </p>
                    )}
                  </div>
                );
              })()}

              {success && (
                <div className="mb-4 flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
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
                      <div className="relative">
                        <input type="text" name="name" value={formData.name} onChange={handleChange}
                          className={`w-full h-12 sm:h-14 px-4 pr-10 border rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 focus:bg-white transition-all duration-200 touch-manipulation ${fieldErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                          placeholder="Enter your full name" />
                        {fieldErrors.name && <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />}
                      </div>
                      {fieldErrors.name && <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>}
                    </div>

                    {/* GST Number */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        GST Number <span className="text-xs text-gray-400 font-normal">(optional)</span>
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            name="gstNumber"
                            value={formData.gstNumber}
                            onChange={(e) => {
                              setFormData({ ...formData, gstNumber: e.target.value.toUpperCase(), companyName: '' });
                              setGstVerification(null);
                              setCompanyLogo('');
                              setGstMismatch(null);
                              if (fieldErrors.gstNumber) setFieldErrors(prev => ({ ...prev, gstNumber: '' }));
                            }}
                            className={`w-full h-12 px-4 pr-10 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 focus:bg-white uppercase tracking-wider ${fieldErrors.gstNumber ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                            placeholder="e.g. 22AAAAA0000A1Z5"
                            maxLength={15}
                          />
                          {fieldErrors.gstNumber && <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />}
                        </div>
                        <button
                          type="button"
                          onClick={handleGSTVerification}
                          disabled={gstLoading || !formData.gstNumber.trim()}
                          className="h-12 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                        >
                          {gstLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                          {gstLoading ? 'Verifying...' : 'Verify GST'}
                        </button>
                    </div>
                    {fieldErrors.gstNumber && <p className="mt-1 text-xs text-red-500">{fieldErrors.gstNumber}</p>}
                    {gstVerification?.verified && !fieldErrors.gstNumber && (
                      <div className="mt-2 p-3 rounded-lg border bg-green-50 border-green-200 text-green-700 flex items-center gap-2 text-sm font-medium">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        GST Verified - Company details filled automatically
                      </div>
                    )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Name</label>
                      <div className="relative">
                        {companyLogo && (
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded overflow-hidden z-10">
                            <img src={companyLogo} alt="" className="w-full h-full object-contain" onError={() => setCompanyLogo('')} />
                          </div>
                        )}
                        {gstVerification?.verified && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </div>
                        )}
                        <input type="text" name="companyName" value={formData.companyName}
                          onChange={handleCompanyNameChange}
                          onFocus={() => !gstVerification?.verified && formData.companyName.length >= 2 && setShowSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                          readOnly={!!gstVerification?.verified}
                          className={`w-full h-12 sm:h-14 border rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 transition-all duration-200 touch-manipulation ${
                            gstVerification?.verified
                              ? 'border-green-200 bg-green-50 text-gray-700 cursor-not-allowed focus:ring-green-300 pr-10'
                              : 'border-gray-200 bg-gray-50 focus:bg-white focus:ring-orange-400'
                          } ${companyLogo ? 'pl-10' : 'px-4'}`}
                          placeholder="Enter company name" />
                        {showSuggestions && !gstVerification?.verified && companySuggestions.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                            {companySuggestions.map((company) => (
                              <button key={company.id} type="button" onMouseDown={() => selectCompany(company)}
                                className="w-full text-left px-4 py-2.5 hover:bg-orange-50 border-b last:border-b-0 flex items-center gap-3">
                                <div className="bg-gray-100 w-7 h-7 rounded flex items-center justify-center p-1 flex-shrink-0">
                                  <img src={company.logo} alt={company.name} className="w-full h-full object-contain"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 text-sm">{company.name}</span>
                                    {company.verified && <CheckCircle className="w-4 h-4 text-green-500" />}
                                  </div>
                                  <div className="text-xs text-gray-400">{company.domain}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {gstVerification?.verified && (
                        <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Company name set from GST data
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Email</label>
                      <div className="relative">
                        <input type="email" name="email" value={formData.email} onChange={handleChange}
                          className={`w-full h-12 sm:h-14 px-4 pr-12 border rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 focus:bg-white transition-all duration-200 touch-manipulation ${fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                          placeholder="Enter company email"
                          autoComplete="email"
                          inputMode="email" />
                        {formData.email && formData.companyName && (
                          <button
                            type="button"
                            onClick={handleDomainVerification}
                            disabled={verificationLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-orange-500 hover:text-orange-600 disabled:opacity-50"
                            title="Verify domain"
                          >
                            {verificationLoading ? (
                              <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Shield className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                      {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}

                      {domainVerification && (
                        <div className={`mt-2 p-3 rounded-lg border text-sm ${
                          domainVerification.verificationMethod === 'company_database' ? 'bg-green-50 border-green-200 text-green-700' :
                          domainVerification.verificationMethod === 'domain_check' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                          'bg-yellow-50 border-yellow-200 text-yellow-700'
                        }`}>
                          <div className="flex items-start gap-2">
                            {domainVerification.verificationMethod === 'company_database' ? (
                              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            ) : domainVerification.verificationMethod === 'domain_check' ? (
                              <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <div className="font-medium mb-1">
                                {domainVerification.verificationMethod === 'company_database' ? 'Email Verified' :
                                 domainVerification.verificationMethod === 'domain_check' ? 'Corporate Email' :
                                 'Verification Pending'}
                              </div>
                              <div className="text-xs opacity-90">
                                {domainVerification.verificationMethod === 'company_database'
                                  ? ''
                                  : domainVerification.verificationMethod === 'domain_check'
                                  ? 'Corporate email detected. Your account will be verified after registration.'
                                  : 'Manual verification required. Our team will review your application.'}
                              </div>
                              {domainVerification.companyProfile && (
                                <button
                                  type="button"
                                  onClick={() => setShowVerificationDetails(!showVerificationDetails)}
                                  className="text-xs underline mt-1 hover:no-underline"
                                >
                                  {showVerificationDetails ? 'Hide' : 'Show'} company details
                                </button>
                              )}
                            </div>
                          </div>

                          {showVerificationDetails && domainVerification.companyProfile && (
                            <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div><strong>Domain:</strong> {domainVerification.companyProfile.domain}</div>
                                {domainVerification.companyProfile.industry && (
                                  <div><strong>Industry:</strong> {domainVerification.companyProfile.industry}</div>
                                )}
                                {domainVerification.companyProfile.size && (
                                  <div><strong>Size:</strong> {domainVerification.companyProfile.size}</div>
                                )}
                                {domainVerification.companyProfile.website && (
                                  <div><strong>Website:</strong> {domainVerification.companyProfile.website}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <button type="button" onClick={handleStep1Next}
                      disabled={loading || verificationLoading}
                      className="w-full h-12 sm:h-14 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-xl font-semibold text-sm sm:text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px] flex items-center justify-center gap-2">
                      {loading ? 'Sending...' : <><span>Continue</span><ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </div>

                  <div className="mt-3 sm:mt-4 lg:mt-6">
                    <div className="text-center">
                      <span className="text-xs sm:text-sm text-gray-500">Already have an account? </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onNavigate('employer-login');
                        }}
                        className="text-xs sm:text-sm font-semibold text-orange-500 hover:text-orange-600 active:text-orange-700 transition-colors touch-manipulation p-1 sm:p-2 -m-1 sm:-m-2 rounded underline"
                      >
                        Sign in
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 - OTP Verification */}
              {step === 2 && (
                <div>
                  <div className="mb-5">
                    <h2 className="text-xl font-bold text-gray-900">Verify Your Email</h2>
                    <p className="text-gray-500 text-sm mt-1">Enter the 6-digit code sent to {formData.email}</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Verification Code</label>
                      <input
                        type="text"
                        name="otp"
                        value={formData.otp}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setFormData({ ...formData, otp: value });
                        }}
                        className="w-full h-14 sm:h-16 px-4 border border-gray-200 rounded-xl text-center text-xl sm:text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 focus:bg-white transition-all duration-200 touch-manipulation"
                        placeholder="000000"
                        maxLength={6}
                        inputMode="numeric"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyOTP}
                      disabled={loading || formData.otp.length !== 6}
                      className="w-full h-12 sm:h-14 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-xl font-semibold text-sm sm:text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px]"
                    >
                      {loading ? 'Verifying...' : 'Verify Email'}
                    </button>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={resendTimer > 0 || loading}
                        className="text-sm text-orange-500 hover:text-orange-600 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setStep(1); setError(''); setSuccess(''); setFormData({ ...formData, otp: '' }); }}
                      className="w-full h-11 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3 - Password */}
              {step === 3 && (
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
                          className={`w-full h-12 sm:h-14 px-4 pr-14 border rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 focus:bg-white transition-all duration-200 touch-manipulation ${fieldErrors.password ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                          placeholder="Create a password" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-2 touch-manipulation">
                          {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                      {fieldErrors.password && <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>}
                      {formData.password && !fieldErrors.password && (
                        <div className="mt-2">
                          <div className="flex gap-1 mb-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div key={level} className={`h-1.5 flex-1 rounded-full transition-colors ${passwordStrength.score >= level ? 'bg-green-500' : 'bg-gray-200'}`} />
                            ))}
                          </div>
                          {passwordStrength.feedback.length > 0 && (
                            <ul className="text-xs text-gray-500 space-y-0.5">
                              {passwordStrength.feedback.map((msg, i) => (
                                <li key={i} className="flex items-center gap-1"><span className="text-red-400">●</span> {msg}</li>
                              ))}
                            </ul>
                          )}
                          {passwordStrength.score >= 4 && (
                            <p className="text-xs text-green-600 flex items-center gap-1 mt-1"><span>✓</span> Strong password</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                      <div className="relative">
                        <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                          className={`w-full h-12 sm:h-14 px-4 pr-14 border rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 focus:bg-white transition-all duration-200 touch-manipulation ${fieldErrors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                          placeholder="Confirm your password" required />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-2 touch-manipulation">
                          {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                      {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-500">{fieldErrors.confirmPassword}</p>}
                    </div>
                    <div className="space-y-2">
                      <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${fieldErrors.terms ? 'border-red-500 bg-red-50' : agreedToTerms ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                        <input type="checkbox" id="terms-employer" checked={agreedToTerms} onChange={e => { setAgreedToTerms(e.target.checked); if (fieldErrors.terms) setFieldErrors(prev => ({ ...prev, terms: '' })); }}
                          className="mt-0.5 w-4 h-4 accent-orange-500 cursor-pointer flex-shrink-0" />
                        <label htmlFor="terms-employer" className="text-xs text-gray-600 cursor-pointer leading-relaxed select-none">
                          I agree to ZyncJobs'{' '}
                          <button type="button" onClick={() => onNavigate('terms')} className="text-orange-500 hover:text-orange-700 underline font-semibold">Terms & Conditions</button>
                          {' '}and{' '}
                          <button type="button" onClick={() => onNavigate('privacy')} className="text-orange-500 hover:text-orange-700 underline font-semibold">Privacy Policy</button>.
                        </label>
                      </div>
                      {fieldErrors.terms && <p className="text-xs text-red-500 mt-1">{fieldErrors.terms}</p>}
                      <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${fieldErrors.declaration ? 'border-red-500 bg-red-50' : agreedToDeclaration ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                        <input type="checkbox" id="declaration-employer" checked={agreedToDeclaration} onChange={e => { setAgreedToDeclaration(e.target.checked); if (fieldErrors.declaration) setFieldErrors(prev => ({ ...prev, declaration: '' })); }}
                          className="mt-0.5 w-4 h-4 accent-orange-500 cursor-pointer flex-shrink-0" />
                        <label htmlFor="declaration-employer" className="text-xs text-gray-600 cursor-pointer leading-relaxed select-none">
                          I am an authorized representative of this company and agree to the{' '}
                          <button type="button" onClick={() => window.open('/terms#employer-declaration', '_blank')} className="text-orange-500 hover:text-orange-700 underline font-semibold">Employer Declaration</button>
                          {' '}- including posting accurate jobs and lawful use of candidate data.
                        </label>
                      </div>
                      {fieldErrors.declaration && <p className="text-xs text-red-500 mt-1">{fieldErrors.declaration}</p>}
                    </div>

                    <button type="submit" disabled={loading || !agreedToTerms || !agreedToDeclaration}
                      className="w-full h-12 sm:h-14 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-xl font-semibold text-sm sm:text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px]">
                      {loading ? 'Creating Account...' : 'Create Employer Account'}
                    </button>
                    <button type="button" onClick={() => { setStep(2); setError(''); }}
                      className="w-full h-11 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerRegisterPage;
