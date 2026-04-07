import React, { useState, useEffect, useRef } from 'react';
import { Building, Phone, Globe, MapPin, ChevronRight, CheckCircle2, Users, Briefcase, ArrowLeft } from 'lucide-react';
import { API_ENDPOINTS } from '../config/env';

interface Props {
  onNavigate: (page: string) => void;
  user?: any;
}

const EmployerCompleteProfilePage: React.FC<Props> = ({ onNavigate, user }) => {
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [step, setStep] = useState(1);
  const suggestRef = useRef<HTMLDivElement>(null);

  // Fetch company logo from job listings (same logic as JobListingsPage)
  const fetchCompanyLogoFromJobs = async (name: string) => {
    if (!name.trim()) return;
    try {
      const res = await fetch(`${API_ENDPOINTS.COMPANIES}?search=${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = await res.json();
        const companies: any[] = Array.isArray(data) ? data : (data.companies || data.data || []);
        const match = companies.find((c: any) =>
          (c.name || c.companyName || '').toLowerCase().includes(name.toLowerCase())
        );
        if (match) {
          const logo = match.logo || match.logoUrl || match.imageUrl || match.image || '';
          if (logo) { setCompanyLogo(logo); return; }
        }
      }
    } catch {}
    // Fallback: logo.dev API
    const domain = guessDomain(name);
    if (domain) setCompanyLogo(`https://img.logo.dev/${domain}?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80`);
  };

  const guessDomain = (name: string): string => {
    const n = name.toLowerCase().trim();
    const map: Record<string, string> = {
      zoho: 'zoho.com', tcs: 'tcs.com', infosys: 'infosys.com', wipro: 'wipro.com',
      google: 'google.com', microsoft: 'microsoft.com', amazon: 'amazon.com',
      accenture: 'accenture.com', cognizant: 'cognizant.com', hcl: 'hcltech.com',
      oracle: 'oracle.com', ibm: 'ibm.com', capgemini: 'capgemini.com',
      deloitte: 'deloitte.com', pwc: 'pwc.com', kpmg: 'kpmg.com',
      trinity: 'trinitetech.com',
    };
    for (const [key, domain] of Object.entries(map)) {
      if (n.includes(key)) return domain;
    }
    const clean = n.replace(/[^a-z0-9]/g, '');
    return clean.length > 2 ? `${clean}.com` : '';
  };

  const handleCompanyChange = async (val: string) => {
    setCompanyName(val);
    setCompanyLogo('');
    if (val.trim().length < 1) { setSuggestions([]); setShowSuggestions(false); return; }
    try {
      const res = await fetch(`${API_ENDPOINTS.COMPANIES}?search=${encodeURIComponent(val)}`);
      if (res.ok) {
        const data = await res.json();
        const list: any[] = Array.isArray(data) ? data : (data.companies || data.data || []);
        setSuggestions(list.slice(0, 6));
        setShowSuggestions(list.length > 0);
      }
    } catch { setSuggestions([]); setShowSuggestions(false); }
  };

  const selectCompany = (c: any) => {
    const name = c.name || c.companyName || '';
    setCompanyName(name);
    const logo = c.logo || c.logoUrl || c.imageUrl || c.image || '';
    if (logo) setCompanyLogo(logo);
    else fetchCompanyLogoFromJobs(name);
    setShowSuggestions(false);
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSkip = () => {
    if (!companyName.trim()) {
      setError('Company name is required. Please fill in your company name before proceeding.');
      return;
    }
    onNavigate('dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) { setError('Company name is required'); return; }
    setLoading(true);
    setError('');
    try {
      const stored = localStorage.getItem('user');
      const userData = stored ? JSON.parse(stored) : {};
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/profile/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          email: userData.email,
          userId: userData.id || userData._id,
          companyName, phone, location,
          companyWebsite: website,
          companyLogo,
          userType: 'employer',
        }),
      });

      if (res.ok) {
        const updated = { ...userData, company: companyName, companyName, companyLogo, phone, location };
        localStorage.setItem('user', JSON.stringify(updated));
        onNavigate('dashboard');
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || 'Failed to save. Please try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const userName = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}').name?.split(' ')[0] || 'there'; } catch { return 'there'; }
  })();

  const logoInitials = companyName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 flex items-center justify-center p-4">

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600 rounded-full opacity-5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl flex rounded-3xl overflow-hidden shadow-2xl">

        {/* LEFT PANEL */}
        <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-b from-blue-600 to-indigo-700 p-10 flex-col justify-between">
          <div>
            <div className="flex items-center mb-10">
              <img
                src="/images/zyncjobs-logo.png"
                alt="ZyncJobs"
                className="h-20 w-auto"
              />
            </div>

            <h2 className="text-3xl font-bold text-white leading-tight mb-3">
              Welcome aboard,<br />
              <span className="text-blue-200">{userName}! 👋</span>
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed mb-8">
              You're just one step away from accessing your employer dashboard and connecting with top talent.
            </p>

            <div className="space-y-4">
              {[
                { icon: Users, title: 'Access Top Talent', desc: 'Browse thousands of verified candidates' },
                { icon: Briefcase, title: 'Post Jobs Instantly', desc: 'AI-powered job posting in minutes' },
                { icon: CheckCircle2, title: 'Smart Matching', desc: 'Get matched with the right candidates' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 bg-white/10 rounded-xl p-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{title}</p>
                    <p className="text-blue-200 text-xs mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-8">
            {[['10K+', 'Companies'], ['500K+', 'Candidates'], ['48hr', 'Avg. Hire']].map(([num, label]) => (
              <div key={label} className="text-center bg-white/10 rounded-xl p-3">
                <div className="text-xl font-bold text-white">{num}</div>
                <div className="text-blue-200 text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 bg-white p-8 lg:p-10 flex flex-col justify-center">

          {/* Back button */}
          <button
            type="button"
            onClick={() => {
              // Clear session so user can choose a different Google account
              localStorage.removeItem('token');
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              sessionStorage.clear();
              // Redirect to Google OAuth employer login to pick a different account
              const apiUrl = import.meta.env.VITE_API_URL || '/api';
              window.location.href = `${apiUrl}/auth/google/employer?prompt=select_account`;
            }}
            className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-medium text-blue-600">Google Sign-in</span>
            </div>
            <div className="flex-1 h-px bg-blue-200" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">2</span>
              </div>
              <span className="text-xs font-medium text-blue-600">Company Details</span>
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-xs font-bold">3</span>
              </div>
              <span className="text-xs font-medium text-gray-400">Dashboard</span>
            </div>
          </div>

          {/* Company logo preview */}
          <div className="flex items-center gap-5 mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl border-2 border-white bg-white flex items-center justify-center overflow-hidden shadow-md">
                {companyLogo ? (
                  <img
                    src={companyLogo}
                    alt="Company logo"
                    className="w-full h-full object-contain p-2"
                    onError={() => setCompanyLogo('')}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-white font-black text-2xl tracking-tight">{logoInitials}</span>
                  </div>
                )}
              </div>
              {companyName && (
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Complete Your Profile</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {companyName ? (
                  <span>Setting up <span className="font-semibold text-blue-600">{companyName}</span></span>
                ) : 'Tell us about your company to get started'}
              </p>
              {!companyName && (
                <p className="text-xs text-blue-500 mt-1.5 font-medium">Logo preview will appear here ✨</p>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <span className="text-red-500 text-sm">⚠</span>
              <span className="text-red-600 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Company Name with autocomplete */}
            <div ref={suggestRef} className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Company Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={companyName}
                  onChange={e => handleCompanyChange(e.target.value)}
                  onBlur={() => { setTimeout(() => setShowSuggestions(false), 150); if (companyName) fetchCompanyLogoFromJobs(companyName); }}
                  placeholder="e.g. Zoho, Infosys, TCS..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
                  required
                />
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  {suggestions.map((c: any, i: number) => {
                    const logo = c.logo || c.logoUrl || c.imageUrl || c.image || '';
                    const name = c.name || c.companyName || '';
                    const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                    return (
                      <button
                        key={i} type="button" onMouseDown={() => selectCompany(c)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors border-b last:border-b-0"
                      >
                        <div className="w-9 h-9 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {logo ? (
                            <img src={logo} alt={name} className="w-full h-full object-contain p-0.5"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center rounded-lg">
                              <span className="text-white text-xs font-bold">{initials}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-gray-900">{name}</p>
                          {c.location && <p className="text-xs text-gray-400">{c.location}</p>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Two-column row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text" value={location} onChange={e => setLocation(e.target.value)}
                    placeholder="Chennai, India"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Website</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url" value={website} onChange={e => setWebsite(e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
              ) : (
                <> Complete Setup & Go to Dashboard <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <button
            type="button" onClick={handleSkip}
            className="w-full text-center text-gray-400 text-sm hover:text-gray-600 transition-colors mt-4"
          >
            Skip for now — I'll complete this later
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployerCompleteProfilePage;
