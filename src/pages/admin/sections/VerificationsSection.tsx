import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, RefreshCw, AlertCircle, Building2, ExternalLink } from 'lucide-react';
import { API_ENDPOINTS } from '../../../config/env';
import { tokenStorage } from '../../../utils/tokenStorage';

function authHeaders() {
  const token = tokenStorage.getAdmin() || tokenStorage.getAccess();
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function authFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, { ...options, headers: { ...authHeaders(), ...(options.headers as any || {}) } });
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
      // Only show personal/generic email accounts for admin verification
      // Company domain emails are auto-verified and should not appear here
      setVerifications(filter === 'pending' ? all.filter(v => isGenericEmail(v.email)) : all);
    } catch (e: any) {
      if (e.message === '401') { onUnauthorized(); return; }
      setError('Failed to load verifications.');
    } finally { setLoading(false); }
  }, [filter, onUnauthorized]);

  useEffect(() => { load(); }, [load]);

  const decide = async (id: string, action: 'approve' | 'reject', note = '') => {
    setActionLoading(id + action);
    try {
      await authFetch(`${API_ENDPOINTS.BASE_URL}/admin/verifications/${id}/${action}`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      });
      setVerifications(prev => prev.filter(v => (v._id || v.id) !== id));
    } catch { setError(`Failed to ${action}.`); }
    finally { setActionLoading(''); }
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Employer Verifications</h2>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500">
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
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
                    <p className="font-medium text-gray-200">{v.companyName || v.company || '—'}</p>
                    <p className="text-sm text-gray-400">{v.employerName || v.name} · {v.email}</p>
                    {v.phone && <p className="text-xs text-gray-500 mt-0.5">📞 {v.phone}</p>}
                    {v.location && <p className="text-xs text-gray-500">📍 {v.location}</p>}
                    {v.website && (
                      <a href={v.website} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 mt-1">
                        <ExternalLink className="w-3 h-3" />{v.website}
                      </a>
                    )}
                    {v.documents?.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {v.documents.map((doc: string, i: number) => (
                          <a key={i} href={doc} target="_blank" rel="noreferrer"
                            className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded hover:bg-gray-700">
                            Doc {i + 1}
                          </a>
                        ))}
                      </div>
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
                  </div>
                )}

                {filter !== 'pending' && (
                  <span className={`text-xs px-2 py-1 rounded-full capitalize shrink-0
                    ${filter === 'approved' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
                    {filter}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
