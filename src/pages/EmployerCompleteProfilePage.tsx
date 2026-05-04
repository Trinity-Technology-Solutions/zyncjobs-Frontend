import React, { useState, useEffect } from 'react';
import { Building2, Check, Shield, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import Header from '../components/Header';
import { API_ENDPOINTS } from '../config/env';

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

  // Pre-fill companyName from user email domain if corporate
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    const user = JSON.parse(stored);
    const domain = user.email?.split('@')[1];
    const generic = ['gmail.com','yahoo.com','outlook.com','hotmail.com','icloud.com','live.com'];
    if (domain && !generic.includes(domain)) {
      // Pre-fill company name from domain
      const guessed = domain.split('.')[0];
      setFormData(prev => ({
        ...prev,
        companyName: prev.companyName || (guessed.charAt(0).toUpperCase() + guessed.slice(1))
      }));
      // Auto verify domain
      verifyDomain(user.email, guessed);
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

      // 1. Invite-only check via team/check endpoint
      if (emailDomain && !generic.includes(emailDomain)) {
        const checkRes = await fetch(`${API}/team/check?memberEmail=${encodeURIComponent(email)}`);
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          // No invite — check if domain already taken
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

      // 2. Domain verification using existing /api/companies/verify
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
      } else {
        setDomainStatus('pending');
      }
    } catch {
      setDomainStatus('pending');
    } finally {
      setVerifying(false);
    }
  };

  const handleCompanyNameBlur = () => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    const user = JSON.parse(stored);
    if (formData.companyName.trim()) {
      verifyDomain(user.email, formData.companyName);
    }
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
      const token = localStorage.getItem('accessToken') || '';
      const domain = user.email?.split('@')[1] || '';

      // 1. Save to Companies table (visible on Companies page)
      await fetch(`${API}/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.companyName,
          domain,
          industry: formData.industry,
          size: formData.companySize,
          location: formData.headquarters,
          website: formData.companyWebsite,
          description: formData.description,
          employerEmail: user.email,
          verified: domainStatus === 'verified'
        })
      });

      // 2. Update User record with company details (dashboard uses this)
      const userId = user.id || user._id;
      if (userId) {
        await fetch(`${API}/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            email: user.email,
            companyName: formData.companyName,
            company: formData.companyName,
            industry: formData.industry,
            companySize: formData.companySize,
            headquarters: formData.headquarters,
            companyWebsite: formData.companyWebsite,
            companyDescription: formData.description
          })
        });
      }

      // 3. Update localStorage so dashboard reflects immediately
      const updatedUser = {
        ...user,
        companyName: formData.companyName,
        company: formData.companyName,
        industry: formData.industry,
        companySize: formData.companySize,
        headquarters: formData.headquarters,
        companyWebsite: formData.companyWebsite
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      onNavigate('dashboard');
    } catch {
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const domainStatusUI = () => {
    if (verifying) return (
      <div className="flex items-center gap-2 text-blue-600 text-xs mt-1.5">
        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        Verifying domain...
      </div>
    );
    if (domainStatus === 'verified') return (
      <div className="flex items-center gap-1.5 text-green-600 text-xs mt-1.5">
        <CheckCircle className="w-3.5 h-3.5" /> Company verified in database
      </div>
    );
    if (domainStatus === 'corporate') return (
      <div className="flex items-center gap-1.5 text-blue-600 text-xs mt-1.5">
        <Shield className="w-3.5 h-3.5" /> Corporate email detected — will be verified
      </div>
    );
    if (domainStatus === 'pending') return (
      <div className="flex items-center gap-1.5 text-yellow-600 text-xs mt-1.5">
        <Clock className="w-3.5 h-3.5" /> Pending admin verification
      </div>
    );
    if (domainStatus === 'blocked') return (
      <div className="flex items-center gap-1.5 text-red-600 text-xs mt-1.5">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span><strong>{blockedCompany}</strong> already registered. Ask admin to invite you.</span>
      </div>
    );
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} />

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <Building2 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Company Profile</h1>
            <p className="text-gray-500 text-sm">Add your company details to start hiring</p>
          </div>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* Company Name + Domain Verify */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Name *</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={e => setFormData(p => ({ ...p, companyName: e.target.value }))}
                onBlur={handleCompanyNameBlur}
                placeholder="e.g. Trinity Technology Solutions"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {domainStatusUI()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Industry *</label>
                <select
                  value={formData.industry}
                  onChange={e => setFormData(p => ({ ...p, industry: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
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
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Size *</label>
                <select
                  value={formData.companySize}
                  onChange={e => setFormData(p => ({ ...p, companySize: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Size</option>
                  <option>1-10 employees</option>
                  <option>11-50 employees</option>
                  <option>51-200 employees</option>
                  <option>201-500 employees</option>
                  <option>500+ employees</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Headquarters</label>
              <input
                type="text"
                value={formData.headquarters}
                onChange={e => setFormData(p => ({ ...p, headquarters: e.target.value }))}
                placeholder="Chennai, Tamil Nadu, India"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Website</label>
              <input
                type="url"
                value={formData.companyWebsite}
                onChange={e => setFormData(p => ({ ...p, companyWebsite: e.target.value }))}
                placeholder="https://yourcompany.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder="Tell candidates about your company..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Skip for now
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.companyName || !formData.industry || !formData.companySize || domainStatus === 'blocked'}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Complete Profile'}
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerCompleteProfilePage;
