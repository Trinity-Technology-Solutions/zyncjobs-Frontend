import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, RefreshCw, AlertCircle, Building2, ExternalLink, Trash2 } from 'lucide-react';
import { API_ENDPOINTS } from '../../../config/env';
import { tokenStorage } from '../../../utils/tokenStorage';
import { apiFetch } from '../../../api/apiFetch';
import AutocompleteCombobox from '../../../components/AutocompleteCombobox';

function authHeaders() {
  const token = tokenStorage.getAdmin() || tokenStorage.getAccess();
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function authFetch(url: string, options: RequestInit = {}) {
  const res = await apiFetch(url, { ...options, headers: { ...authHeaders(), ...(options.headers as any || {}) } });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

const GENERIC_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com', 'aol.com', 'protonmail.com', 'ymail.com'];
const isGenericEmail = (email: string) => GENERIC_DOMAINS.includes(email?.split('@')[1]?.toLowerCase() || '');

export default function VerificationsSection({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [filter, setFilter] = useState('pending');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`${API_ENDPOINTS.BASE_URL}/admin/verifications?status=${filter}`);
      const all: any[] = res.verifications ?? res.data ?? res ?? [];
      // Show ALL pending verifications - both generic emails AND corporate emails that need manual review
      // Only filter out already auto-verified companies (those with verified=true status)
      setVerifications(all);
    } catch (e: any) {
      if (e.message === '401') { onUnauthorized(); return; }
      setError('Failed to load verifications.');
    } finally { setLoading(false); }
  }, [filter, onUnauthorized]);

  useEffect(() => { load(); }, [load]);

  const decide = async (id: string, action: 'approve' | 'reject', note = '') => {
    setActionLoading(id + action);
    try {
      const response = await authFetch(`${API_ENDPOINTS.BASE_URL}/admin/verifications/${id}/${action}`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      });
      
      // If approved, add company to database/JSON
      if (action === 'approve') {
        const verification = verifications.find(v => (v._id || v.id) === id);
        if (verification) {
          try {
            // Add approved company to companies database
            await authFetch(`${API_ENDPOINTS.COMPANIES}`, {
              method: 'POST',
              body: JSON.stringify({
                name: verification.companyName || verification.company,
                domain: verification.email.split('@')[1],
                logo: '',
                website: `https://${verification.email.split('@')[1]}`,
                industry: verification.industry || 'Technology',
                verified: true,
                approvedBy: 'admin',
                approvedAt: new Date().toISOString(),
                createdAt: new Date().toISOString()
              })
            });
            console.log('✅ Company added to database:', verification.companyName);
          } catch (dbError) {
            console.error('❌ Failed to add company to database:', dbError);
          }
        }
      }
      
      setVerifications(prev => prev.filter(v => (v._id || v.id) !== id));
    } catch { 
      setError(`Failed to ${action}.`); 
    } finally { 
      setActionLoading(''); 
    }
  };

  const deleteVerification = async (id: string, companyName: string) => {
    const confirmed = confirm(`Are you sure you want to delete verification for "${companyName}"? This action cannot be undone.`);
    if (!confirmed) return;
    
    setActionLoading(id + 'delete');
    try {
      await authFetch(`${API_ENDPOINTS.BASE_URL}/admin/verifications/${id}`, {
        method: 'DELETE',
      });
      setVerifications(prev => prev.filter(v => (v._id || v.id) !== id));
    } catch { setError('Failed to delete verification.'); }
    finally { setActionLoading(''); }
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Employer Verifications</h2>
          <AutocompleteCombobox
            value={filter}
            onChange={(val) => setFilter(val)}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
            placeholder="Select status..."
            className="text-xs"
          />
        </div>
        <button onClick={load} disabled={loading} className="text-gray-400 hover:text-white disabled:opacity-40">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 bg-red-900/30 border border-red-700/50 text-red-300 rounded-lg px-4 py-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      <div className="divide-y divide-gray-800">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-6 py-4 animate-pulse flex gap-4">
              <div className="w-10 h-10 bg-gray-800 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-800 rounded w-40" />
                <div className="h-3 bg-gray-800 rounded w-60" />
              </div>
            </div>
          ))
        ) : verifications.length === 0 ? (
          <p className="text-center text-gray-500 py-10 text-sm">No {filter} verifications.</p>
        ) : verifications.map(v => {
          const id = v._id || v.id;
          return (
            <div key={id} className="px-6 py-4 hover:bg-gray-800/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-200">{v.companyName || v.company || '—'}</p>
                      {!isGenericEmail(v.email) && (
                        <span className="text-xs bg-purple-900/40 text-purple-400 px-2 py-0.5 rounded-full">
                          🆕 New Company
                        </span>
                      )}
                      {isGenericEmail(v.email) ? (
                        <span className="text-xs bg-yellow-900/40 text-yellow-400 px-2 py-0.5 rounded-full">Personal Email</span>
                      ) : (
                        <span className="text-xs bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded-full">Corporate Email</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{v.employerName || v.name} · {v.email}</p>
                    {v.phone && <p className="text-xs text-gray-500 mt-0.5">📞 {v.phone}</p>}
                    {v.location && <p className="text-xs text-gray-500">📍 {v.location}</p>}

                    {/* GST Verification Info */}
                    {v.gstNumber && (
                      <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border ${
                        v.gstVerification?.verified
                          ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-300'
                          : 'bg-yellow-900/30 border-yellow-700/50 text-yellow-300'
                      }`}>
                        {v.gstVerification?.verified ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5" />
                        )}
                        <span>
                          GST: <strong>{v.gstNumber}</strong>
                          {v.gstVerification?.verified && v.gstVerification.legalName && (
                            <> · {v.gstVerification.legalName}</>
                          )}
                          {v.gstVerification?.verified
                            ? ' — ✅ Surepass Verified'
                            : ' — ⚠️ Not verified'}
                        </span>
                      </div>
                    )}

                    {v.website && (
                      <a href={v.website} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 mt-1">
                        <ExternalLink className="w-3 h-3" />{v.website}
                      </a>
                    )}
                    <p className="text-xs text-gray-600 mt-1">
                      Submitted {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>

                {filter === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => decide(id, 'approve')} disabled={!!actionLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/60 transition-colors disabled:opacity-50">
                      <CheckCircle className="w-3.5 h-3.5" />Approve
                    </button>
                    <button onClick={() => decide(id, 'reject')} disabled={!!actionLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-900/30 text-red-400 hover:bg-red-900/60 transition-colors disabled:opacity-50">
                      <XCircle className="w-3.5 h-3.5" />Reject
                    </button>
                    <button onClick={() => deleteVerification(id, v.companyName || v.company || 'Unknown Company')} disabled={actionLoading === id + 'delete'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-400 hover:bg-red-900/40 hover:text-red-400 transition-colors disabled:opacity-50">
                      <Trash2 className="w-3.5 h-3.5" />Delete
                    </button>
                  </div>
                )}

                {filter !== 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize
                      ${filter === 'approved' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
                      {filter}
                    </span>
                    <button onClick={() => deleteVerification(id, v.companyName || v.company || 'Unknown Company')} disabled={actionLoading === id + 'delete'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-400 hover:bg-red-900/40 hover:text-red-400 transition-colors disabled:opacity-50">
                      <Trash2 className="w-3.5 h-3.5" />Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
