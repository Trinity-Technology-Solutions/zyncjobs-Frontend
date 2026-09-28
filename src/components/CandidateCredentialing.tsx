import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle, Clock, XCircle, User, FileText, IndianRupee, Shield,
  RefreshCw, Plus, Trash2, ChevronLeft, ChevronRight, Printer,
  DollarSign, Edit2, Check, X
} from 'lucide-react';
import { API_ENDPOINTS } from '../config/env';
import { apiFetch } from '../api/apiFetch';

// ── Types ──────────────────────────────────────────────────────────────────
interface CredentialedCandidate {
  id: string;
  _id: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  verificationStatus: 'verified' | 'pending' | 'rejected';
  onboardingStatus: 'completed' | 'in-progress' | 'not-started';
  billingRate: number;
  totalHours: number;
  taxRate: number;
  currency: string;
  createdAt: string;
}

interface Invoice {
  invoiceNumber: string;
  date: string;
  rate: number;
  hours: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  amount: number;
  currency: string;
  candidateName: string;
  jobTitle: string;
  status: 'paid' | 'unpaid' | 'void';
  notes: string;
}

interface TimesheetEntry {
  week: string;
  monday: number; tuesday: number; wednesday: number;
  thursday: number; friday: number; saturday: number; sunday: number;
}

interface CandidateCredentialingProps {
  employerEmail: string;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
const CURRENCIES = ['INR','USD','EUR','GBP','AED','SGD'];
const CURRENCY_SYMBOLS: Record<string, string> = { INR:'₹', USD:'$', EUR:'€', GBP:'£', AED:'د.إ', SGD:'S$' };

const getWeekStart = (offset = 0) => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 1 + offset * 7);
  return start.toISOString().split('T')[0];
};

const formatCurrency = (amount: number, currency: string) =>
  `${CURRENCY_SYMBOLS[currency] || currency}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Number Input ───────────────────────────────────────────────────────────
const NumberInput: React.FC<{
  value: number; onChange: (v: number) => void;
  min?: number; max?: number; className?: string; placeholder?: string;
}> = ({ value, onChange, min, max, className, placeholder }) => {
  const [text, setText] = useState(value !== 0 ? String(value) : '');
  useEffect(() => { setText(value !== 0 ? String(value) : ''); }, [value]);
  return (
    <input type="number" min={min} max={max} placeholder={placeholder} value={text}
      onChange={e => {
        setText(e.target.value);
        const num = e.target.value === '' ? 0 : Number(e.target.value);
        if (Number.isFinite(num)) onChange(num);
      }}
      className={className}
    />
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
const CandidateCredentialing: React.FC<CandidateCredentialingProps> = ({ employerEmail, showToast }) => {
  const [candidates, setCandidates] = useState<CredentialedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'onboarding' | 'timesheets' | 'billing'>('overview');

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_ENDPOINTS.CREDENTIALING}?employerEmail=${encodeURIComponent(employerEmail)}`);
      if (res.ok) setCandidates(await res.json());
      else setCandidates([]);
    } catch { setCandidates([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCredentials(); }, [employerEmail]);

  const getId = (c: any) => c.id || c._id;

  const updateVerification = async (id: string, status: 'verified' | 'pending' | 'rejected') => {
    try {
      const res = await apiFetch(`${API_ENDPOINTS.CREDENTIALING}/${id}/verify`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus: status }),
      });
      if (res.ok) {
        setCandidates(prev => prev.map(c => getId(c) === id ? { ...c, verificationStatus: status } : c));
        showToast(`Candidate ${status}!`, 'success');
      }
    } catch { showToast('Failed to update', 'error'); }
  };

  const verified = candidates.filter(c => c.verificationStatus === 'verified');
  const pending = candidates.filter(c => c.verificationStatus === 'pending');

  const tabs = [
    { key: 'overview', label: 'Overview', icon: <Shield className="w-4 h-4" /> },
    { key: 'onboarding', label: 'Onboarding', icon: <User className="w-4 h-4" /> },
    { key: 'timesheets', label: 'Timesheets', icon: <Clock className="w-4 h-4" /> },
    { key: 'billing', label: 'Billing', icon: <IndianRupee className="w-4 h-4" /> },
  ];

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Candidate Credentialing</h1>
          <p className="text-gray-500 mt-1 text-sm">Verify, onboard and manage trusted candidates</p>
        </div>
        <button onClick={fetchCredentials}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
        {[
          { icon: <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />, count: verified.length, label: 'Verified', bg: 'bg-green-50 border-green-200', text: 'text-green-700', sub: 'text-green-600' },
          { icon: <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 flex-shrink-0" />, count: pending.length, label: 'Pending', bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', sub: 'text-yellow-600' },
          { icon: <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />, count: candidates.length, label: 'Total', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', sub: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3`}>
            {s.icon}
            <div>
              <p className={`text-xl sm:text-2xl font-bold ${s.text}`}>{s.count}</p>
              <p className={`text-xs sm:text-sm ${s.sub}`}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 border-b border-gray-200">
        <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'none' } as React.CSSProperties}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors flex-shrink-0 whitespace-nowrap ${
                activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <OverviewTab candidates={candidates} onVerify={updateVerification} onRefresh={fetchCredentials} employerEmail={employerEmail} showToast={showToast} getId={getId} />
      )}
      {activeTab === 'onboarding' && <OnboardingTab candidates={verified} showToast={showToast} />}
      {activeTab === 'timesheets' && <TimesheetsTab candidates={verified} showToast={showToast} />}
      {activeTab === 'billing' && <BillingTab candidates={verified} showToast={showToast} />}
    </div>
  );
};

export default CandidateCredentialing;

// ── Overview Tab ───────────────────────────────────────────────────────────
const OverviewTab: React.FC<{
  candidates: CredentialedCandidate[];
  onVerify: (id: string, status: 'verified' | 'pending' | 'rejected') => void;
  onRefresh: () => void;
  employerEmail: string;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  getId: (c: any) => string;
}> = ({ candidates, onVerify, onRefresh, employerEmail, showToast, getId }) => {
  const [hiredApps, setHiredApps] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  useEffect(() => {
    setLoadingApps(true);
    apiFetch(`${API_ENDPOINTS.CREDENTIALING}/eligible?employerEmail=${encodeURIComponent(employerEmail)}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setHiredApps(Array.isArray(data) ? data : []))
      .catch(() => setHiredApps([]))
      .finally(() => setLoadingApps(false));
  }, [employerEmail]);

  const addToCredentialing = async (app: any) => {
    try {
      const res = await apiFetch(API_ENDPOINTS.CREDENTIALING, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employerEmail,
          candidateName: app.candidateName,
          candidateEmail: app.candidateEmail,
          jobTitle: app.jobTitle || 'Position',
          applicationId: app._id || app.id,
        }),
      });
      if (res.ok) { showToast('Candidate added to credentialing!', 'success'); onRefresh(); }
      else { const d = await res.json().catch(() => ({})); showToast(d.error || 'Failed to add', 'error'); }
    } catch { showToast('Network error', 'error'); }
  };

  const removeCandidate = async (id: string) => {
    if (!confirm('Remove this candidate from credentialing?')) return;
    try {
      const res = await apiFetch(`${API_ENDPOINTS.CREDENTIALING}/${id}`, { method: 'DELETE' });
      if (res.ok) { showToast('Candidate removed', 'success'); onRefresh(); }
    } catch { showToast('Network error', 'error'); }
  };

  const statusBadge = (status: string) => {
    if (status === 'verified') return <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" />Verified</span>;
    if (status === 'rejected') return <span className="flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" />Rejected</span>;
    return <span className="flex items-center gap-1 text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" />Pending</span>;
  };

  const onboardingBadge = (status: string) => {
    if (status === 'completed') return <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Onboarded</span>;
    if (status === 'in-progress') return <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">In Progress</span>;
    return <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Not Started</span>;
  };

  return (
    <div className="space-y-6">
      {(loadingApps || hiredApps.length > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="text-sm font-bold text-blue-800 mb-3">🎯 Hired Candidates — Add to Credentialing</h3>
          {loadingApps ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" /> : (
            <div className="space-y-2">
              {hiredApps.map((app, i) => (
                <div key={app._id || app.id || i} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-blue-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{app.candidateName}</p>
                    <p className="text-xs text-gray-500">{app.candidateEmail} · {app.jobTitle || 'Position'}</p>
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
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                    {c.candidateName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{c.candidateName}</p>
                    <p className="text-xs text-gray-500">{c.candidateEmail} · {c.jobTitle}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {onboardingBadge(c.onboardingStatus)}
                      {c.totalHours > 0 && <span className="text-xs text-gray-500">{c.totalHours}h logged</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {statusBadge(c.verificationStatus)}
                  {c.verificationStatus !== 'verified' && (
                    <button onClick={() => onVerify(getId(c), 'verified')} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors">✓ Verify</button>
                  )}
                  {c.verificationStatus === 'verified' && (
                    <button onClick={() => onVerify(getId(c), 'pending')} className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg hover:bg-yellow-200 transition-colors">↩ Revert</button>
                  )}
                  {c.verificationStatus !== 'rejected' && (
                    <button onClick={() => onVerify(getId(c), 'rejected')} className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors">✗ Reject</button>
                  )}
                  <button onClick={() => removeCandidate(getId(c))} className="text-xs bg-gray-100 text-gray-500 px-2 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Onboarding Tab ─────────────────────────────────────────────────────────
const DEFAULT_CHECKLIST = [
  'Offer Letter Signed','ID Proof Submitted','Address Proof Submitted',
  'Bank Details Submitted','NDA Signed','Background Check Completed',
  'Equipment Assigned','System Access Granted',
];

const OnboardingTab: React.FC<{
  candidates: CredentialedCandidate[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}> = ({ candidates, showToast }) => {
  const [data, setData] = useState<Record<string, { completedItems: string[]; checklistItems: string[] }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [editingItems, setEditingItems] = useState<string | null>(null);
  const [newItem, setNewItem] = useState('');

  const fetchOnboarding = async () => {
    const results: Record<string, { completedItems: string[]; checklistItems: string[] }> = {};
    await Promise.all(candidates.map(async c => {
      const id = c.id || c._id;
      try {
        const res = await apiFetch(`${API_ENDPOINTS.CREDENTIALING}/${id}/onboarding`);
        if (res.ok) {
          const d = await res.json();
          results[id] = { completedItems: d.completedItems || [], checklistItems: d.checklistItems || DEFAULT_CHECKLIST };
        } else results[id] = { completedItems: [], checklistItems: DEFAULT_CHECKLIST };
      } catch { results[id] = { completedItems: [], checklistItems: DEFAULT_CHECKLIST }; }
    }));
    setData(results);
  };

  useEffect(() => { if (candidates.length > 0) fetchOnboarding(); }, [candidates]);

  const toggleItem = (id: string, item: string) => {
    setData(prev => {
      const current = prev[id]?.completedItems || [];
      return { ...prev, [id]: { ...prev[id], completedItems: current.includes(item) ? current.filter(i => i !== item) : [...current, item] } };
    });
  };

  const saveChecklist = async (id: string) => {
    setSaving(id);
    try {
      const res = await apiFetch(`${API_ENDPOINTS.CREDENTIALING}/${id}/onboarding`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedItems: data[id]?.completedItems || [] }),
      });
      if (res.ok) showToast('Onboarding checklist saved!', 'success');
      else showToast('Failed to save', 'error');
    } catch { showToast('Network error', 'error'); }
    finally { setSaving(null); }
  };

  const saveChecklistItems = async (id: string) => {
    try {
      const res = await apiFetch(`${API_ENDPOINTS.CREDENTIALING}/${id}/checklist-items`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: data[id]?.checklistItems || [] }),
      });
      if (res.ok) { showToast('Checklist items updated!', 'success'); setEditingItems(null); }
      else showToast('Failed to update items', 'error');
    } catch { showToast('Network error', 'error'); }
  };

  const addItem = (id: string) => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    setData(prev => ({ ...prev, [id]: { ...prev[id], checklistItems: [...(prev[id]?.checklistItems || []), trimmed] } }));
    setNewItem('');
  };

  const removeItem = (id: string, item: string) => {
    setData(prev => ({
      ...prev,
      [id]: {
        completedItems: (prev[id]?.completedItems || []).filter(i => i !== item),
        checklistItems: (prev[id]?.checklistItems || []).filter(i => i !== item),
      }
    }));
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
        const id = c.id || c._id;
        const d = data[id] || { completedItems: [], checklistItems: DEFAULT_CHECKLIST };
        const pct = d.checklistItems.length > 0 ? Math.round((d.completedItems.length / d.checklistItems.length) * 100) : 0;
        const isEditing = editingItems === id;
        return (
          <div key={id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900">{c.candidateName}</p>
                <p className="text-xs text-gray-500">{c.jobTitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-600">{pct}%</p>
                  <p className="text-xs text-gray-400">{d.completedItems.length}/{d.checklistItems.length} done</p>
                </div>
                <button onClick={() => setEditingItems(isEditing ? null : id)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${isEditing ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => saveChecklist(id)} disabled={saving === id}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {saving === id ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
              <div className={`h-2 rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
            </div>

            {isEditing ? (
              <div className="space-y-2 mb-3">
                <p className="text-xs font-semibold text-gray-600">Edit Checklist Items</p>
                {d.checklistItems.map(item => (
                  <div key={item} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                    <span className="text-sm text-gray-700 flex-1">{item}</span>
                    <button onClick={() => removeItem(id, item)} className="text-red-400 hover:text-red-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input value={newItem} onChange={e => setNewItem(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addItem(id)}
                    placeholder="Add new item..." className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  <button onClick={() => addItem(id)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button onClick={() => saveChecklistItems(id)} className="text-xs bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 transition-colors">
                  <Check className="w-3.5 h-3.5 inline mr-1" />Save Items
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {d.checklistItems.map(item => (
                  <label key={item} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                    <input type="checkbox" checked={d.completedItems.includes(item)} onChange={() => toggleItem(id, item)}
                      className="rounded border-gray-300 text-blue-600" />
                    <span className={`text-sm ${d.completedItems.includes(item) ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Timesheets Tab ─────────────────────────────────────────────────────────
const TimesheetsTab: React.FC<{
  candidates: CredentialedCandidate[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}> = ({ candidates, showToast }) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [timesheets, setTimesheets] = useState<Record<string, TimesheetEntry>>({});
  const [allSheets, setAllSheets] = useState<Record<string, TimesheetEntry[]>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const currentWeek = getWeekStart(weekOffset);

  const fetchTimesheets = async (week: string) => {
    const results: Record<string, TimesheetEntry> = {};
    await Promise.all(candidates.map(async c => {
      const id = c.id || c._id;
      try {
        const res = await apiFetch(`${API_ENDPOINTS.CREDENTIALING}/${id}/timesheets?week=${week}`);
        results[id] = res.ok ? await res.json() : { week, monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 };
      } catch { results[id] = { week, monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 }; }
    }));
    setTimesheets(results);
  };

  const fetchAllSheets = async (id: string) => {
    try {
      const res = await apiFetch(`${API_ENDPOINTS.CREDENTIALING}/${id}/timesheets/all`);
      if (res.ok) {
        const data = await res.json();
        setAllSheets(prev => ({ ...prev, [id]: data }));
      }
    } catch {}
  };

  useEffect(() => { if (candidates.length > 0) fetchTimesheets(currentWeek); }, [candidates, weekOffset]);

  const updateHours = (id: string, day: string, value: number) => {
    setTimesheets(prev => ({ ...prev, [id]: { ...prev[id], [day]: value } }));
  };

  const saveTimesheet = async (id: string) => {
    setSaving(id);
    try {
      const payload = timesheets[id] || { week: currentWeek, monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 };
      const res = await apiFetch(`${API_ENDPOINTS.CREDENTIALING}/${id}/timesheets`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, week: currentWeek }),
      });
      if (res.ok) {
        const d = await res.json();
        showToast(`Timesheet saved! Total: ${d.totalHours}h across all weeks`, 'success');
        fetchTimesheets(currentWeek);
      } else showToast('Failed to save timesheet', 'error');
    } catch { showToast('Network error', 'error'); }
    finally { setSaving(null); }
  };

  const weekTotal = (entry: TimesheetEntry) => DAYS.reduce((s, d) => s + (Number((entry as any)[d]) || 0), 0);

  const weekLabel = (weekStr: string) => {
    const d = new Date(weekStr);
    const end = new Date(d); end.setDate(d.getDate() + 6);
    return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  if (candidates.length === 0) return (
    <div className="text-center py-16">
      <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500">No verified candidates for timesheets yet.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
        <button onClick={() => setWeekOffset(o => o - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">{weekLabel(currentWeek)}</p>
          {weekOffset === 0 && <p className="text-xs text-blue-600">Current Week</p>}
          {weekOffset < 0 && <p className="text-xs text-gray-400">{Math.abs(weekOffset)} week{Math.abs(weekOffset) > 1 ? 's' : ''} ago</p>}
          {weekOffset > 0 && <p className="text-xs text-orange-500">Future week</p>}
        </div>
        <div className="flex items-center gap-1">
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-xs text-blue-600 hover:underline px-2">Today</button>
          )}
          <button onClick={() => setWeekOffset(o => o + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {candidates.map(c => {
        const id = c.id || c._id;
        const entry = timesheets[id] || { week: currentWeek, monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 };
        const total = weekTotal(entry);
        const history = allSheets[id] || [];
        return (
          <div key={id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-gray-900">{c.candidateName}</p>
                <p className="text-xs text-gray-500">{c.jobTitle} · <span className="text-blue-600 font-medium">{c.totalHours}h total logged</span></p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-blue-600">{total}h this week</span>
                <button onClick={() => { setShowHistory(showHistory === id ? null : id); if (showHistory !== id) fetchAllSheets(id); }}
                  className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                  {showHistory === id ? 'Hide' : 'History'}
                </button>
                <button onClick={() => saveTimesheet(id)} disabled={saving === id}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {saving === id ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-3">
              {DAYS.map(day => (
                <div key={day} className="text-center">
                  <p className="text-xs text-gray-500 mb-1 capitalize">{day.slice(0, 3)}</p>
                  <NumberInput value={(entry as any)[day] || 0} onChange={v => updateHours(id, day, v)}
                    min={0} max={24} placeholder="0"
                    className="w-full text-center border border-gray-200 rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              ))}
            </div>

            {/* Weekly total bar */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min((total / 40) * 100, 100)}%` }} />
              </div>
              <span>{total}/40h</span>
            </div>

            {/* History */}
            {showHistory === id && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-600 mb-2">All Weeks History</p>
                {history.length === 0 ? (
                  <p className="text-xs text-gray-400">No history yet.</p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {[...history].sort((a, b) => b.week.localeCompare(a.week)).map(s => (
                      <div key={s.week} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-gray-600">{weekLabel(s.week)}</span>
                        <span className="font-semibold text-blue-600">{weekTotal(s)}h</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Billing Tab ────────────────────────────────────────────────────────────
const BillingTab: React.FC<{
  candidates: CredentialedCandidate[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}> = ({ candidates, showToast }) => {
  const [billingData, setBillingData] = useState<Record<string, {
    rate: number; hours: number; taxRate: number; currency: string; invoices: Invoice[];
  }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const printRef = useRef<HTMLDivElement>(null);

  const fetchBilling = async () => {
    const results: Record<string, any> = {};
    await Promise.all(candidates.map(async c => {
      const id = c.id || c._id;
      try {
        const res = await apiFetch(`${API_ENDPOINTS.CREDENTIALING}/${id}/billing`);
        if (res.ok) {
          const d = await res.json();
          results[id] = { rate: d.rate || 0, hours: d.hours || 0, taxRate: d.taxRate || 0, currency: d.currency || 'INR', invoices: Array.isArray(d.invoices) ? d.invoices : [] };
        } else results[id] = { rate: 0, hours: 0, taxRate: 0, currency: 'INR', invoices: [] };
      } catch { results[id] = { rate: 0, hours: 0, taxRate: 0, currency: 'INR', invoices: [] }; }
    }));
    setBillingData(results);
  };

  useEffect(() => { if (candidates.length > 0) fetchBilling(); }, [candidates]);

  const saveBilling = async (id: string) => {
    setSaving(id);
    try {
      const b = billingData[id] || { rate: 0, hours: 0, taxRate: 0, currency: 'INR', invoices: [] };
      const res = await apiFetch(`${API_ENDPOINTS.CREDENTIALING}/${id}/billing`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate: b.rate, hours: b.hours, taxRate: b.taxRate, currency: b.currency }),
      });
      if (res.ok) { showToast('Billing saved!', 'success'); await fetchBilling(); }
      else showToast('Failed to save billing', 'error');
    } catch { showToast('Network error', 'error'); }
    finally { setSaving(null); }
  };

  const generateInvoice = async (id: string) => {
    const b = billingData[id];
    if (!b?.rate || !b?.hours) { showToast('Set Hourly Rate and Total Hours first.', 'error'); return; }
    setGenerating(id);
    // Auto-save billing before generating invoice so fields persist after fetchBilling()
    await apiFetch(`${API_ENDPOINTS.CREDENTIALING}/${id}/billing`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rate: b.rate, hours: b.hours, taxRate: b.taxRate, currency: b.currency }),
    }).catch(() => {});
    try {
      const res = await apiFetch(`${API_ENDPOINTS.CREDENTIALING}/${id}/billing/invoice`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate: b.rate, hours: b.hours, taxRate: b.taxRate, currency: b.currency, notes: notes[id] || '' }),
      });
      if (res.ok) {
        const d = await res.json();
        setBillingData(prev => ({ ...prev, [id]: { ...prev[id], invoices: Array.isArray(d.invoices) ? d.invoices : [d.invoice, ...(prev[id]?.invoices || [])] } }));
        showToast('Invoice generated!', 'success');
        setNotes(prev => ({ ...prev, [id]: '' }));
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(`Failed: ${d.error || 'Unknown error'}`, 'error');
      }
    } catch { showToast('Network error', 'error'); }
    finally { setGenerating(null); }
  };

  const updateInvoiceStatus = async (candidateId: string, invoiceNumber: string, status: 'paid' | 'unpaid' | 'void') => {
    try {
      const res = await apiFetch(`${API_ENDPOINTS.CREDENTIALING}/${candidateId}/billing/invoice/${invoiceNumber}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const d = await res.json();
        setBillingData(prev => ({ ...prev, [candidateId]: { ...prev[candidateId], invoices: d.invoices } }));
        showToast(`Invoice marked as ${status}`, 'success');
      }
    } catch { showToast('Network error', 'error'); }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Invoice</title><style>
      body{font-family:Arial,sans-serif;padding:40px;color:#111}
      .header{display:flex;justify-content:space-between;margin-bottom:32px}
      h1{font-size:28px;color:#1d4ed8}
      table{width:100%;border-collapse:collapse;margin:24px 0}
      th{background:#f3f4f6;padding:10px;text-align:left;font-size:13px}
      td{padding:10px;border-bottom:1px solid #e5e7eb;font-size:13px}
      .total-row td{font-weight:bold;font-size:15px;border-top:2px solid #111}
      .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600}
      .paid{background:#dcfce7;color:#166534}.unpaid{background:#fef9c3;color:#854d0e}.void{background:#f3f4f6;color:#6b7280}
      @media print{button{display:none}}
    </style></head><body>${printRef.current.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 300);
  };

  const invoiceStatusBadge = (status: string) => {
    if (status === 'paid') return <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Paid</span>;
    if (status === 'void') return <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Void</span>;
    return <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Unpaid</span>;
  };

  if (candidates.length === 0) return (
    <div className="text-center py-16">
      <IndianRupee className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500">No verified candidates for billing yet.</p>
    </div>
  );

  const totalBilling = candidates.reduce((sum, c) => {
    const b = billingData[c.id || c._id];
    if (!b) return sum;
    const sub = b.rate * b.hours;
    return sum + sub + sub * (b.taxRate / 100);
  }, 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white">
        <p className="text-sm opacity-80">Total Billing (incl. tax)</p>
        <p className="text-3xl font-bold mt-1">₹{totalBilling.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        <p className="text-xs opacity-70 mt-1">{candidates.length} verified candidate{candidates.length !== 1 ? 's' : ''}</p>
      </div>

      {candidates.map(c => {
        const id = c.id || c._id;
        const b = billingData[id] || { rate: 0, hours: 0, taxRate: 0, currency: 'INR', invoices: [] };
        const subtotal = b.rate * b.hours;
        const taxAmt = subtotal * (b.taxRate / 100);
        const total = subtotal + taxAmt;
        const sym = CURRENCY_SYMBOLS[b.currency] || b.currency;
        return (
          <div key={id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <p className="font-semibold text-gray-900">{c.candidateName}</p>
                <p className="text-xs text-gray-500">{c.jobTitle}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => saveBilling(id)} disabled={saving === id}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {saving === id ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => generateInvoice(id)} disabled={generating === id}
                  className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                  {generating === id ? 'Generating...' : 'Generate Invoice'}
                </button>
              </div>
            </div>

            {/* Billing fields */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Currency</label>
                <select value={b.currency} onChange={e => setBillingData(prev => ({ ...prev, [id]: { ...prev[id], currency: e.target.value } }))}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500">
                  {CURRENCIES.map(cur => <option key={cur} value={cur}>{cur}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hourly Rate ({sym})</label>
                <NumberInput value={b.rate} onChange={v => setBillingData(prev => ({ ...prev, [id]: { ...prev[id], rate: v } }))}
                  min={0} placeholder="0" className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Total Hours <span className="text-blue-500 text-xs">(from timesheets)</span></label>
                <NumberInput value={b.hours} onChange={v => setBillingData(prev => ({ ...prev, [id]: { ...prev[id], hours: v } }))}
                  min={0} placeholder="0" className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tax / GST (%)</label>
                <NumberInput value={b.taxRate} onChange={v => setBillingData(prev => ({ ...prev, [id]: { ...prev[id], taxRate: v } }))}
                  min={0} max={100} placeholder="0" className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Amount summary */}
            <div className="bg-gray-50 rounded-xl p-3 mb-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-gray-500">Subtotal</p>
                <p className="text-sm font-bold text-gray-800">{sym}{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tax ({b.taxRate}%)</p>
                <p className="text-sm font-bold text-orange-600">{sym}{taxAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-sm font-bold text-green-700">{sym}{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            {/* Notes for next invoice */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Invoice Notes (optional)</label>
              <input value={notes[id] || ''} onChange={e => setNotes(prev => ({ ...prev, [id]: e.target.value }))}
                placeholder="e.g. Payment due in 30 days..."
                className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>

            {/* Invoices list */}
            {b.invoices.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Invoices ({b.invoices.length})</p>
                <div className="space-y-2">
                  {b.invoices.map((inv, i) => (
                    <div key={inv.invoiceNumber || i} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-800">{inv.invoiceNumber}</p>
                          <p className="text-xs text-gray-500">{inv.date ? new Date(inv.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                          {inv.notes && <p className="text-xs text-gray-400 italic mt-0.5">{inv.notes}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{inv.hours}h @ {CURRENCY_SYMBOLS[inv.currency] || inv.currency}{inv.rate}/hr</p>
                          {inv.taxRate > 0 && <p className="text-xs text-orange-500">+{inv.taxRate}% tax</p>}
                          <p className="text-sm font-bold text-green-700">{formatCurrency(inv.amount, inv.currency)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {invoiceStatusBadge(inv.status)}
                          {inv.status !== 'paid' && inv.status !== 'void' && (
                            <button onClick={() => updateInvoiceStatus(id, inv.invoiceNumber, 'paid')}
                              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 transition-colors">Mark Paid</button>
                          )}
                          {inv.status !== 'void' && (
                            <button onClick={() => updateInvoiceStatus(id, inv.invoiceNumber, 'void')}
                              className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg hover:bg-gray-200 transition-colors">Void</button>
                          )}
                          <button onClick={() => { setPrintInvoice(inv); setTimeout(handlePrint, 100); }}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-200 transition-colors">
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Hidden print template */}
      {printInvoice && (
        <div ref={printRef} style={{ display: 'none' }}>
          <div className="header">
            <div><h1>INVOICE</h1><p style={{ color: '#6b7280', fontSize: 13 }}>{printInvoice.invoiceNumber}</p></div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 13 }}>Date: {new Date(printInvoice.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <span className={`badge ${printInvoice.status}`}>{printInvoice.status.toUpperCase()}</span>
            </div>
          </div>
          <table>
            <thead><tr><th>Candidate</th><th>Role</th><th>Hours</th><th>Rate</th><th>Amount</th></tr></thead>
            <tbody>
              <tr>
                <td>{printInvoice.candidateName}</td>
                <td>{printInvoice.jobTitle}</td>
                <td>{printInvoice.hours}h</td>
                <td>{formatCurrency(printInvoice.rate, printInvoice.currency)}/hr</td>
                <td>{formatCurrency(printInvoice.subtotal, printInvoice.currency)}</td>
              </tr>
              {printInvoice.taxRate > 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'right' }}>Tax ({printInvoice.taxRate}%)</td><td>{formatCurrency(printInvoice.taxAmount, printInvoice.currency)}</td></tr>
              )}
              <tr className="total-row"><td colSpan={4} style={{ textAlign: 'right' }}>TOTAL</td><td>{formatCurrency(printInvoice.amount, printInvoice.currency)}</td></tr>
            </tbody>
          </table>
          {printInvoice.notes && <p style={{ fontSize: 13, color: '#6b7280', marginTop: 16 }}>Notes: {printInvoice.notes}</p>}
        </div>
      )}
    </div>
  );
};
