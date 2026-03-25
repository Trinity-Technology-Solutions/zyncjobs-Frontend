import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle, Activity, Search, Filter } from 'lucide-react';
import { API_ENDPOINTS } from '../../../config/env';

function authHeaders() {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

const ACTION_COLORS: Record<string, string> = {
  login: 'bg-blue-900/40 text-blue-400',
  logout: 'bg-gray-800 text-gray-400',
  ban: 'bg-red-900/40 text-red-400',
  unban: 'bg-emerald-900/40 text-emerald-400',
  delete: 'bg-red-900/60 text-red-300',
  approve: 'bg-emerald-900/40 text-emerald-400',
  reject: 'bg-amber-900/40 text-amber-400',
  create: 'bg-purple-900/40 text-purple-400',
  update: 'bg-cyan-900/40 text-cyan-400',
};

export default function ActivityLogsSection({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(p), limit: '50' });
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (search) params.set('search', search);
      const res = await fetch(`${API_ENDPOINTS.ADMIN_AUDIT}?${params}`, { headers: authHeaders() });
      if (res.status === 401) { onUnauthorized(); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      const list = data.logs ?? data.data ?? data ?? [];
      setLogs(p === 1 ? list : prev => [...prev, ...list]);
      setHasMore(list.length === 50);
      setPage(p);
    } catch { setError('Failed to load activity logs.'); }
    finally { setLoading(false); }
  }, [actionFilter, search, onUnauthorized]);

  useEffect(() => { load(1); }, [load]);

  const getActionColor = (action: string) => {
    const key = Object.keys(ACTION_COLORS).find(k => action?.toLowerCase().includes(k));
    return key ? ACTION_COLORS[key] : 'bg-gray-800 text-gray-400';
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Activity className="w-5 h-5 text-purple-400" />Activity Logs</h2>
          <button onClick={() => load(1)} disabled={loading} className="text-gray-400 hover:text-white disabled:opacity-40">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by user, action..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500">
            <option value="all">All Actions</option>
            <option value="login">Login</option>
            <option value="ban">Ban/Unban</option>
            <option value="delete">Delete</option>
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
            <option value="create">Create</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 bg-red-900/30 border border-red-700/50 text-red-300 rounded-lg px-4 py-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-800">
              <th className="text-left px-6 py-3 font-medium">Action</th>
              <th className="text-left px-6 py-3 font-medium">Admin</th>
              <th className="text-left px-6 py-3 font-medium">Target</th>
              <th className="text-left px-6 py-3 font-medium">Details</th>
              <th className="text-left px-6 py-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading && logs.length === 0 ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-800 animate-pulse">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-6 py-3"><div className="h-4 bg-gray-800 rounded w-24" /></td>
                  ))}
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-gray-500 py-10 text-sm">No activity logs found.</td></tr>
            ) : logs.map((log, i) => (
              <tr key={log._id || log.id || i} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getActionColor(log.action)}`}>
                    {log.action || '—'}
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-300">{log.adminName || log.performedBy || '—'}</td>
                <td className="px-6 py-3 text-gray-400">{log.targetName || log.target || '—'}</td>
                <td className="px-6 py-3 text-gray-500 max-w-xs truncate">{log.details || log.description || '—'}</td>
                <td className="px-6 py-3 text-gray-600 text-xs whitespace-nowrap">
                  {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="px-6 py-4 border-t border-gray-800">
          <button onClick={() => load(page + 1)} disabled={loading}
            className="text-sm text-purple-400 hover:text-purple-300 disabled:opacity-40 transition-colors">
            {loading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
