import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, User, FileText, IndianRupee, Shield } from 'lucide-react';
import { API_ENDPOINTS } from '../config/env';

interface CredentialedCandidate {
  _id: string;
  id: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  verificationStatus: 'verified' | 'pending' | 'rejected';
  onboardingStatus: 'completed' | 'in-progress' | 'not-started';
  billingRate: number;
  totalHours: number;
  createdAt: string;
}

interface CandidateCredentialingProps {
  employerEmail: string;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const CandidateCredentialing: React.FC<CandidateCredentialingProps> = ({ employerEmail, showToast }) => {
  const [candidates, setCandidates] = useState<CredentialedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'onboarding' | 'timesheets' | 'billing'>('overview');

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.CREDENTIALING}?employerEmail=${encodeURIComponent(employerEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setCandidates(Array.isArray(data) ? data : []);
      } else {
        setCandidates([]);
      }
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, [employerEmail]);

  const getId = (c: any) => c.id || c._id;

  const updateVerification = async (id: string, status: 'verified' | 'pending' | 'rejected') => {
    try {
      const res = await fetch(`${API_ENDPOINTS.CREDENTIALING}/${id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus: status }),
      });
      if (res.ok) {
        setCandidates(prev => prev.map(c => (c.id || c._id) === id ? { ...c, verificationStatus: status } : c));
        showToast(`Candidate ${status} successfully!`, 'success');
      }
    } catch {
      showToast('Failed to update verification', 'error');
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: <Shield className="w-4 h-4" /> },
    { key: 'onboarding', label: 'Onboarding', icon: <User className="w-4 h-4" /> },
    { key: 'timesheets', label: 'Timesheets', icon: <Clock className="w-4 h-4" /> },
    { key: 'billing', label: 'Billing', icon: <IndianRupee className="w-4 h-4" /> },
  ];

  const verified = candidates.filter(c => c.verificationStatus === 'verified');
  const pending = candidates.filter(c => c.verificationStatus === 'pending');

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Candidate Credentialing</h1>
        <p className="text-gray-500 mt-1 text-sm">Verify, onboard and manage trusted candidates</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-green-600" />
          <div>
            <p className="text-2xl font-bold text-green-700">{verified.length}</p>
            <p className="text-sm text-green-600">Verified</p>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <Clock className="w-8 h-8 text-yellow-600" />
          <div>
            <p className="text-2xl font-bold text-yellow-700">{pending.length}</p>
            <p className="text-sm text-yellow-600">Pending</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-600" />
          <div>
            <p className="text-2xl font-bold text-blue-700">{candidates.length}</p>
            <p className="text-sm text-blue-600">Total</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <OverviewTab candidates={candidates} onVerify={(id, status) => updateVerification(id, status)} onRefresh={fetchCredentials} employerEmail={employerEmail} showToast={showToast} getId={getId} />
      )}

      {/* Onboarding Tab */}
      {activeTab === 'onboarding' && (
        <OnboardingTab candidates={verified} showToast={showToast} />
      )}

      {/* Timesheets Tab */}
      {activeTab === 'timesheets' && (
        <TimesheetsTab candidates={verified} showToast={showToast} />
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <BillingTab candidates={verified} showToast={showToast} />
      )}
    </div>
  );
};

export default CandidateCredentialing;

// ── Overview Tab ──────────────────────────────────────────────────────────
interface OverviewTabProps {
  candidates: CredentialedCandidate[];
  onVerify: (id: string, status: 'verified' | 'pending' | 'rejected') => void;
  onRefresh: () => void;
  employerEmail: string;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  getId: (c: any) => string;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ candidates, onVerify, onRefresh, employerEmail, showToast, getId }) => {
  const [hiredApps, setHiredApps] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  useEffect(() => {
    const fetchHired = async () => {
      setLoadingApps(true);
      try {
        const res = await fetch(`${API_ENDPOINTS.CREDENTIALING}/eligible?employerEmail=${encodeURIComponent(employerEmail)}`);
        if (res.ok) {
          const data = await res.json();
          setHiredApps(Array.isArray(data) ? data : []);
        }
      } catch {
        setHiredApps([]);
      } finally {
        setLoadingApps(false);
      }
    };
    fetchHired();
  }, [employerEmail]);

  const addToCredentialing = async (app: any) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.CREDENTIALING}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employerEmail,
          candidateName: app.candidateName,
          candidateEmail: app.candidateEmail,
          jobTitle: app.jobTitle || 'Position',
          applicationId: app._id || app.id,
          verificationStatus: 'pending',
          onboardingStatus: 'not-started',
          billingRate: 0,
          totalHours: 0,
        }),
      });
      if (res.ok) {
        showToast('Candidate added to credentialing!', 'success');
        onRefresh();
      } else {
        showToast('Failed to add candidate', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'verified') return <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" />Verified</span>;
    if (status === 'rejected') return <span className="flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" />Rejected</span>;
    return <span className="flex items-center gap-1 text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" />Pending</span>;
  };

  return (
    <div className="space-y-6">
      {hiredApps.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-blue-800 mb-3">🎯 Hired Candidates — Add to Credentialing</h3>
          {loadingApps ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          ) : (
            <div className="space-y-2">
              {hiredApps.map((app, i) => (
                <div key={app._id || app.id || i} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-blue-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{app.candidateName}</p>
                    <p className="text-xs text-gray-500">{app.jobTitle || 'Position'}</p>
                  </div>
                  <button onClick={() => addToCredentialing(app)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">+ Add</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {candidates.length === 0 ? (
        <div className="text-center py-16">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Credentialed Candidates</h3>
          <p className="text-gray-500 text-sm">Hired candidates will appear above to add for credentialing.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map(c => (
            <div key={getId(c)} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                    {c.candidateName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{c.candidateName}</p>
                    <p className="text-xs text-gray-500">{c.candidateEmail} · {c.jobTitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {statusBadge(c.verificationStatus)}
                  {c.verificationStatus !== 'verified' && (
                    <button onClick={() => onVerify(getId(c), 'verified')} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors">✓ Verify</button>
                  )}
                  {c.verificationStatus !== 'rejected' && (
                    <button onClick={() => onVerify(getId(c), 'rejected')} className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors">✗ Reject</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Onboarding Tab ──────────────────────────────────────────────────────────
const ONBOARDING_CHECKLIST = [
  'Offer Letter Signed',
  'ID Proof Submitted',
  'Address Proof Submitted',
  'Bank Details Submitted',
  'NDA Signed',
  'Background Check Completed',
  'Equipment Assigned',
  'System Access Granted',
];

interface OnboardingTabProps {
  candidates: CredentialedCandidate[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const OnboardingTab: React.FC<OnboardingTabProps> = ({ candidates, showToast }) => {
  const [checklists, setChecklists] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const fetchChecklists = async () => {
      const results: Record<string, string[]> = {};
      await Promise.all(
        candidates.map(async (c) => {
          try {
            const res = await fetch(`${API_ENDPOINTS.CREDENTIALING}/${c.id || c._id}/onboarding`);
            if (res.ok) {
              const data = await res.json();
              results[c._id] = data.completedItems || [];
            } else {
              results[c._id] = [];
            }
          } catch {
            results[c._id] = [];
          }
        })
      );
      setChecklists(results);
    };
    if (candidates.length > 0) fetchChecklists();
  }, [candidates]);

  const toggleItem = (candidateId: string, item: string) => {
    setChecklists(prev => {
      const current = prev[candidateId] || [];
      const updated = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
      return { ...prev, [candidateId]: updated };
    });
  };

  const saveChecklist = async (candidateId: string) => {
    setSaving(candidateId);
    try {
      const res = await fetch(`${API_ENDPOINTS.CREDENTIALING}/${candidateId}/onboarding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedItems: checklists[candidateId] || [] }),
      });
      if (res.ok) {
        showToast('Onboarding checklist saved!', 'success');
      } else {
        showToast('Failed to save checklist', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSaving(null);
    }
  };

  if (candidates.length === 0) return (
    <div className="text-center py-16">
      <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500">No verified candidates for onboarding yet.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {candidates.map(c => {
        const completed = checklists[c._id] || [];
        const pct = Math.round((completed.length / ONBOARDING_CHECKLIST.length) * 100);
        return (
          <div key={c._id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-gray-900">{c.candidateName}</p>
                <p className="text-xs text-gray-500">{c.jobTitle}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-600">{pct}%</p>
                  <p className="text-xs text-gray-400">Complete</p>
                </div>
                <button
                  onClick={() => saveChecklist(c._id)}
                  disabled={saving === c._id}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving === c._id ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ONBOARDING_CHECKLIST.map(item => (
                <label key={item} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={completed.includes(item)}
                    onChange={() => toggleItem(c._id, item)}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className={`text-sm ${completed.includes(item) ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Timesheets Tab ──────────────────────────────────────────────────────────
interface TimesheetEntry {
  week: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

interface TimesheetsTabProps {
  candidates: CredentialedCandidate[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const getWeekLabel = () => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 1);
  return start.toISOString().split('T')[0];
};

const TimesheetsTab: React.FC<TimesheetsTabProps> = ({ candidates, showToast }) => {
  const [timesheets, setTimesheets] = useState<Record<string, TimesheetEntry>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const currentWeek = getWeekLabel();

  useEffect(() => {
    const fetchTimesheets = async () => {
      const results: Record<string, TimesheetEntry> = {};
      await Promise.all(
        candidates.map(async (c) => {
          try {
            const res = await fetch(`${API_ENDPOINTS.CREDENTIALING}/${c.id || c._id}/timesheets?week=${currentWeek}`);
            if (res.ok) {
              const data = await res.json();
              results[c._id] = data || { week: currentWeek, monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 };
            } else {
              results[c._id] = { week: currentWeek, monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 };
            }
          } catch {
            results[c._id] = { week: currentWeek, monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 };
          }
        })
      );
      setTimesheets(results);
    };
    if (candidates.length > 0) fetchTimesheets();
  }, [candidates]);

  const updateHours = (candidateId: string, day: string, value: number) => {
    setTimesheets(prev => ({
      ...prev,
      [candidateId]: { ...prev[candidateId], [day]: value },
    }));
  };

  const saveTimesheet = async (candidateId: string) => {
    setSaving(candidateId);
    try {
      const res = await fetch(`${API_ENDPOINTS.CREDENTIALING}/${candidateId}/timesheets`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(timesheets[candidateId]),
      });
      if (res.ok) {
        showToast('Timesheet saved!', 'success');
      } else {
        showToast('Failed to save timesheet', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSaving(null);
    }
  };

  const totalHours = (entry: TimesheetEntry) =>
    DAYS.reduce((sum, d) => sum + (Number((entry as any)[d]) || 0), 0);

  if (candidates.length === 0) return (
    <div className="text-center py-16">
      <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500">No verified candidates for timesheets yet.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Week of: <span className="font-semibold text-gray-700">{currentWeek}</span></p>
      {candidates.map(c => {
        const entry = timesheets[c._id] || { week: currentWeek, monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 };
        const total = totalHours(entry);
        return (
          <div key={c._id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-gray-900">{c.candidateName}</p>
                <p className="text-xs text-gray-500">{c.jobTitle}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-blue-600">{total}h total</span>
                <button
                  onClick={() => saveTimesheet(c._id)}
                  disabled={saving === c._id}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving === c._id ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map(day => (
                <div key={day} className="text-center">
                  <p className="text-xs text-gray-500 mb-1 capitalize">{day.slice(0, 3)}</p>
                  <input
                    type="number"
                    min={0}
                    max={24}
                    value={(entry as any)[day] || 0}
                    onChange={e => updateHours(c._id, day, Number(e.target.value))}
                    className="w-full text-center border border-gray-200 rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Billing Tab ──────────────────────────────────────────────────────────
interface BillingTabProps {
  candidates: CredentialedCandidate[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const BillingTab: React.FC<BillingTabProps> = ({ candidates, showToast }) => {
  const [billingData, setBillingData] = useState<Record<string, { rate: number; hours: number; invoices: any[] }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const fetchBilling = async () => {
      const results: Record<string, { rate: number; hours: number; invoices: any[] }> = {};
      await Promise.all(
        candidates.map(async (c) => {
          try {
            const res = await fetch(`${API_ENDPOINTS.CREDENTIALING}/${c.id || c._id}/billing`);
            if (res.ok) {
              const data = await res.json();
              results[c._id] = { rate: data.rate || 0, hours: data.hours || 0, invoices: data.invoices || [] };
            } else {
              results[c._id] = { rate: 0, hours: 0, invoices: [] };
            }
          } catch {
            results[c._id] = { rate: 0, hours: 0, invoices: [] };
          }
        })
      );
      setBillingData(results);
    };
    if (candidates.length > 0) fetchBilling();
  }, [candidates]);

  const saveBilling = async (candidateId: string) => {
    setSaving(candidateId);
    try {
      const res = await fetch(`${API_ENDPOINTS.CREDENTIALING}/${candidateId}/billing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billingData[candidateId]),
      });
      if (res.ok) {
        showToast('Billing details saved!', 'success');
      } else {
        showToast('Failed to save billing', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSaving(null);
    }
  };

  const generateInvoice = async (candidateId: string) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.CREDENTIALING}/${candidateId}/billing/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billingData[candidateId]),
      });
      if (res.ok) {
        const invoice = await res.json();
        setBillingData(prev => ({
          ...prev,
          [candidateId]: {
            ...prev[candidateId],
            invoices: [invoice, ...(prev[candidateId]?.invoices || [])],
          },
        }));
        showToast('Invoice generated!', 'success');
      } else {
        showToast('Failed to generate invoice', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  if (candidates.length === 0) return (
    <div className="text-center py-16">
      <IndianRupee className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500">No verified candidates for billing yet.</p>
    </div>
  );

  const totalBilling = candidates.reduce((sum, c) => {
    const b = billingData[c._id];
    return sum + (b ? b.rate * b.hours : 0);
  }, 0);

  return (
    <div className="space-y-4">
      {/* Total summary */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white">
        <p className="text-sm opacity-80">Total Billing This Month</p>
        <p className="text-3xl font-bold mt-1">₹{totalBilling.toLocaleString('en-IN')}</p>
        <p className="text-xs opacity-70 mt-1">{candidates.length} verified candidate{candidates.length !== 1 ? 's' : ''}</p>
      </div>

      {candidates.map(c => {
        const b = billingData[c._id] || { rate: 0, hours: 0, invoices: [] };
        const total = b.rate * b.hours;
        return (
          <div key={c._id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-gray-900">{c.candidateName}</p>
                <p className="text-xs text-gray-500">{c.jobTitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => saveBilling(c._id)}
                  disabled={saving === c._id}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving === c._id ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => generateInvoice(c._id)}
                  className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Generate Invoice
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hourly Rate (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={b.rate}
                  onChange={e => setBillingData(prev => ({ ...prev, [c._id]: { ...prev[c._id], rate: Number(e.target.value) } }))}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Total Hours</label>
                <input
                  type="number"
                  min={0}
                  value={b.hours}
                  onChange={e => setBillingData(prev => ({ ...prev, [c._id]: { ...prev[c._id], hours: Number(e.target.value) } }))}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Total Amount</label>
                <div className="w-full border border-gray-100 bg-gray-50 rounded-lg p-2 text-sm font-bold text-green-700">
                  ₹{total.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {b.invoices.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Past Invoices</p>
                <div className="space-y-1">
                  {b.invoices.slice(0, 3).map((inv: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-gray-600">Invoice #{inv.invoiceNumber || i + 1}</span>
                      <span className="text-gray-500">{inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : ''}</span>
                      <span className="font-semibold text-green-700">₹{(inv.amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
