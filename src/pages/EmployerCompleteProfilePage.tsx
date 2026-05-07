import React, { useState, useEffect } from 'react';
import { Building2, Check, AlertTriangle, Shield, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import { apiFetch } from '../api/apiFetch';

interface Props {
  onNavigate: (page: string) => void;
}

const EmployerCompleteProfilePage: React.FC<Props> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    companySize: '',
    headquarters: '',
    description: '',
    companyWebsite: ''
  });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [domainStatus, setDomainStatus] = useState<'idle' | 'verified' | 'corporate' | 'pending' | 'blocked'>('idle');
  const [blockedCompany, setBlockedCompany] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    const user = JSON.parse(stored);
    const savedCompanyName = user.companyName || user.company || '';
    if (savedCompanyName) {
      setFormData(prev => ({ ...prev, companyName: prev.companyName || savedCompanyName }));
    }
  }, []);

  const verifyDomain = async (email: string, companyName: string) => {
    if (!email || !companyName) return;
    setVerifying(true);
    setDomainStatus('idle');
    setError('');
    try {
      const API = import.meta.env.VITE_API_URL || '/api';
      const stored = localStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : {};
      const emailDomain = email.split('@')[1]?.toLowerCase();
      const generic = ['gmail.com','yahoo.com','outlook.com','hotmail.com','icloud.com','live.com'];
      if (emailDomain && !generic.includes(emailDomain)) {
        const checkRes = await fetch(`${API}/team/check?memberEmail=${encodeURIComponent(email)}`);
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (!checkData.hasInvite) {
            const domainCheckRes = await fetch(`${API}/users/check-domain?domain=${encodeURIComponent(emailDomain)}`);
            if (domainCheckRes.ok) {
              const domainData = await domainCheckRes.json();
              if (domainData.exists && domainData.email !== user.email) {
                setBlockedCompany(domainData.companyName || emailDomain);
                setDomainStatus('blocked');
                setVerifying(false);
                return;
              }
            }
          }
        }
      }
      const res = await fetch(`${API}/companies/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, companyName })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.verificationMethod === 'company_database') setDomainStatus('verified');
        else if (data.verificationMethod === 'domain_check') setDomainStatus('corporate');
        else setDomainStatus('pending');
      } else setDomainStatus('pending');
    } catch { setDomainStatus('pending'); }
    finally { setVerifying(false); }
  };

  const handleCompanyNameBlur = () => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    const user = JSON.parse(stored);
    if (formData.companyName.trim()) verifyDomain(user.email, formData.companyName);
  };

  const handleSubmit = async () => {
    if (!formData.companyName.trim()) { setError('Company name is required'); return; }
    if (!formData.industry) { setError('Industry is required'); return; }
    if (!formData.companySize) { setError('Company size is required'); return; }
    if (domainStatus === 'blocked') { setError(`${blockedCompany} already has an account. Ask admin to invite you.`); return; }
    setLoading(true);
    setError('');
    try {
      const stored = localStorage.getItem('user');
      if (!stored) { onNavigate('employer-login'); return; }
      const user = JSON.parse(stored);
      const API = import.meta.env.VITE_API_URL || '/api';
      const domain = user.email?.split('@')[1] || '';
      await fetch(`${API}/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.companyName, domain, industry: formData.industry,
          size: formData.companySize, location: formData.headquarters,
          website: formData.companyWebsite, description: formData.description,
          employerEmail: user.email
        })
      });
      const userId = user.id || user._id;
      if (userId) {
        await apiFetch(`${API}/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email, companyName: formData.companyName, company: formData.companyName,
            industry: formData.industry, companySize: formData.companySize,
            headquarters: formData.headquarters, companyWebsite: formData.companyWebsite,
            companyDescription: formData.description
          })
        });
      }
      localStorage.setItem('user', JSON.stringify({
        ...user, companyName: formData.companyName, company: formData.companyName,
        industry: formData.industry, companySize: formData.companySize,
        headquarters: formData.headquarters, companyWebsite: formData.companyWebsite
      }));
      onNavigate('dashboard');
    } catch { setError('Failed to save profile. Please try again.'); }
    finally { setLoading(false); }
  };

  const domainStatusUI = () => {
    if (verifying) return (
      <div className="flex items-center gap-2 text-orange-500 text-sm mt-2">
        <div className="w-3.5 h-3.5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        <span className="font-medium">Verifying domain...</span>
      </div>
    );
    if (domainStatus === 'blocked') return (
      <div className="flex items-center gap-2 text-red-600 text-sm mt-2 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span><strong>{blockedCompany}</strong> already registered. Ask admin to invite you.</span>
      </div>
    );
    if (domainStatus === 'verified') return (
      <div className="flex items-center gap-2 text-green-600 text-sm mt-2 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
        <Check className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium">Domain verified successfully!</span>
      </div>
    );
    if (domainStatus === 'corporate') return (
      <div className="flex items-center gap-2 text-blue-600 text-sm mt-2 bg-blue-50 rounded-lg px-3 py-2 border border-blue-200">
        <Shield className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium">Corporate domain detected!</span>
      </div>
    );
    return null;
  };

  const inputCls = "w-full px-4 py-3 rounded-xl text-base text-gray-800 placeholder-gray-400 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 focus:bg-white hover:border-gray-300 transition-all duration-200";
  const selectCls = `${inputCls} appearance-none cursor-pointer`;
  const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5";

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <Header onNavigate={onNavigate} />

      {/* Corner decorative circles — like login page */}
      <div className="fixed top-16 right-0 w-80 h-80 rounded-full bg-orange-100 opacity-60 -translate-y-1/4 translate-x-1/4 pointer-events-none" />
      <div className="fixed top-16 right-0 w-52 h-52 rounded-full bg-orange-50 opacity-80 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 rounded-full bg-blue-100 opacity-50 translate-y-1/4 -translate-x-1/4 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-60 h-60 rounded-full bg-blue-50 opacity-70 translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-10">

        {/* Back button */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium mb-6 transition-colors duration-200 group"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center group-hover:bg-orange-50 group-hover:border-orange-300 transition-all duration-200">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Dashboard
        </button>

        {/* Card */}
        <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

          {/* Orange top accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400" />

          {/* Subtle card inner tint */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top center, rgba(249,115,22,0.04) 0%, transparent 50%)' }} />

          {/* Decorative circle inside card top-right */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-orange-100 opacity-40 pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-blue-100 opacity-30 pointer-events-none" />

          <div className="relative z-10 p-8">

            {/* Header */}
            <div className="text-center mb-8">
              <div className="relative inline-block mb-5">
                <div className="absolute inset-0 rounded-2xl blur-xl opacity-40 bg-orange-400" />
                <div className="relative p-4 rounded-2xl shadow-lg bg-gradient-to-br from-orange-500 to-orange-600">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Edit Your{' '}
                <span className="text-orange-500">Company Profile</span>
              </h1>
              <p className="text-gray-500 text-base">Add your company details to start hiring</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="h-px w-14 bg-gradient-to-r from-transparent to-orange-300" />
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                <div className="h-px w-14 bg-gradient-to-l from-transparent to-orange-300" />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-red-600 text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-5">
              {/* Company Name */}
              <div>
                <label className={labelCls}>Company Name *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={e => setFormData(p => ({ ...p, companyName: e.target.value }))}
                  onBlur={handleCompanyNameBlur}
                  placeholder="e.g. Trinity Technology Solutions"
                  className={inputCls}
                />
                {domainStatusUI()}
              </div>

              {/* Industry + Size */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Industry *</label>
                  <div className="relative">
                    <select value={formData.industry} onChange={e => setFormData(p => ({ ...p, industry: e.target.value }))} className={selectCls}>
                      <option value="">Select Industry</option>
                      <option>Information Technology</option>
                      <option>Healthcare</option>
                      <option>Finance & Banking</option>
                      <option>Education</option>
                      <option>Manufacturing</option>
                      <option>Retail</option>
                      <option>Media & Entertainment</option>
                      <option>Other</option>
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Company Size *</label>
                  <div className="relative">
                    <select value={formData.companySize} onChange={e => setFormData(p => ({ ...p, companySize: e.target.value }))} className={selectCls}>
                      <option value="">Select Size</option>
                      <option>1-10 employees</option>
                      <option>11-50 employees</option>
                      <option>51-200 employees</option>
                      <option>201-500 employees</option>
                      <option>500+ employees</option>
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Headquarters */}
              <div>
                <label className={labelCls}>Headquarters</label>
                <input type="text" value={formData.headquarters} onChange={e => setFormData(p => ({ ...p, headquarters: e.target.value }))} placeholder="Chennai, Tamil Nadu, India" className={inputCls} />
              </div>

              {/* Website */}
              <div>
                <label className={labelCls}>Company Website</label>
                <input type="url" value={formData.companyWebsite} onChange={e => setFormData(p => ({ ...p, companyWebsite: e.target.value }))} placeholder="https://yourcompany.com" className={inputCls} />
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>Company Description</label>
                <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={3}
                  placeholder="Tell candidates about your company..."
                  className={`${inputCls} resize-none`} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
              <button onClick={() => onNavigate('dashboard')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                Skip for now
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !formData.companyName || !formData.industry || !formData.companySize || domainStatus === 'blocked'}
                className="group relative flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg hover:shadow-orange-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative z-10">{loading ? 'Saving...' : 'Save Profile'}</span>
                {loading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin relative z-10" />
                  : <Check className="w-4 h-4 relative z-10" />
                }
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerCompleteProfilePage;
