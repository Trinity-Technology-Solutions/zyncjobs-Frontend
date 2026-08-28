import React, { useState, useEffect, useCallback } from 'react';
import { Search, Users, Building2, RefreshCw, AlertCircle, Shield, ShieldOff, Trash2, Briefcase, Mail, Check, X } from 'lucide-react';
import { API_ENDPOINTS } from '../../../config/env';
import { tokenStorage } from '../../../utils/tokenStorage';
import { apiFetch } from '../../../api/apiFetch';
import UserDetailsModal from \x27./UserDetailsModal\x27;`nimport ConfirmModal from \x27../../../components/ConfirmModal\x27;

function authHeaders() {
  const token = tokenStorage.getAdmin() || tokenStorage.getAccess();
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function authFetch(url: string, options: RequestInit = {}, onUnauthorized?: () => void) {
  const response = await apiFetch(url, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) }
  });
  if (response.status === 401) {
    tokenStorage.clear();
    onUnauthorized?.();
    throw new Error('UNAUTHORIZED');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || body.message || `HTTP ${response.status}`);
  }
  return await response.json();
}

interface User {
  _id?: string;
  id?: string;
  userId?: string;
  name?: string;
  fullName?: string;
  email: string;
  role?: string;
  userType?: string;
  isActive?: boolean;
  banned?: boolean;
  isBanned?: boolean;
  jobCount?: number;
  phone?: string;
  location?: string;
  companyName?: string;
  createdAt?: string;
}

interface Props {
  onUnauthorized: () => void;
  onNavigateToReminder?: (selectedUserIds: string[], userType: 'candidates' | 'employers' | 'both') => void;
}

export default function AllUsersSection({ onUnauthorized, onNavigateToReminder }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'candidate' | 'employer'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const getUserId = (u: User) => u._id || u.id || u.userId || u.email;
  const getUserRole = (u: User) => (u.role || u.userType || 'candidate').toLowerCase();
  const isActive = (u: User) => u.isActive !== false && !u.banned && !u.isBanned;
  const getUserName = (u: User) => u.name || u.fullName || '—';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`${API_ENDPOINTS.ADMIN_USERS}?limit=5000`, {}, onUnauthorized);
      const list: User[] = res.users ?? res.data ?? res ?? [];
      setUsers(list);
    } catch (e: any) {
      if (e.message !== 'UNAUTHORIZED') setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u => {
    const role = getUserRole(u);
    if (roleFilter !== 'all' && role !== roleFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const name = getUserName(u).toLowerCase();
    const email = (u.email || '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(getUserId)));
    }
  };

  const banUser = async (userId: string, currentlyActive: boolean) => {
    setActionLoading(userId);
    try {
      await authFetch(`${API_ENDPOINTS.ADMIN_USERS}/${userId}/ban`, {
        method: 'PUT',
        body: JSON.stringify({ ban: currentlyActive }),
      }, onUnauthorized);
      setUsers(prev => prev.map(u => getUserId(u) === userId ? { ...u, isActive: !currentlyActive } : u));
    } catch (e: any) {
      if (e.message !== 'UNAUTHORIZED') setError(e.message || 'Failed to update user.');
    } finally {
      setActionLoading(null);
    }
  };

  const [confirmState, setConfirmState] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });

  const deleteUser = (userId: string, userName: string) => {
    setConfirmState({ open: true, message: `Are you sure you want to delete user "${userName}"? This action cannot be undone.`, onConfirm: () => execDeleteUser(userId) });
  };

  const execDeleteUser = async (userId: string) => {
    setConfirmState(s => ({ ...s, open: false }));
    setActionLoading(userId + 'delete');
    try {
      const response = await apiFetch(`${API_ENDPOINTS.ADMIN_USERS}/${userId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Delete failed (${response.status})`);
      }
      setUsers(prev => prev.filter(u => getUserId(u) !== userId));
      setSelectedIds(prev => { const next = new Set(prev); next.delete(userId); return next; });
    } catch (e: any) {
      if (e.message !== 'UNAUTHORIZED') setError(e.message || 'Failed to delete user.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserDeleted = (deletedId: string) => {
    setUsers(prev => prev.filter(u => {
      const uid = getUserId(u);
      return uid !== deletedId;
    }));
    setSelectedIds(prev => { const next = new Set(prev); next.delete(deletedId); return next; });
    setSelectedUserId(null);
  };

  const handleSendReminder = () => {
    if (selectedIds.size === 0) return;
    const selectedUsers = users.filter(u => selectedIds.has(getUserId(u)));
    const hasCandidate = selectedUsers.some(u => getUserRole(u) === 'candidate');
    const hasEmployer = selectedUsers.some(u => getUserRole(u) === 'employer');
    let userType: 'candidates' | 'employers' | 'both' = 'both';
    if (hasCandidate && !hasEmployer) userType = 'candidates';
    if (!hasCandidate && hasEmployer) userType = 'employers';
    onNavigateToReminder?.(Array.from(selectedIds), userType);
  };

  const counts = {
    total: users.length,
    candidates: users.filter(u => getUserRole(u) === 'candidate').length,
    employers: users.filter(u => getUserRole(u) === 'employer').length,
  };

  return (
    <>
      {selectedUserId && selectedUserId !== 'undefined' && (
        <UserDetailsModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onAction={load}
          onDeleted={handleUserDeleted}
        />
      )}
      <div className="space-y-4">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Users', value: counts.total, icon: Users, color: 'bg-blue-600' },
            { label: 'Candidates', value: counts.candidates, icon: Users, color: 'bg-purple-600' },
            { label: 'Employers', value: counts.employers, icon: Building2, color: 'bg-orange-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{label}</span>
                <div className={`${color} w-7 h-7 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <p className="text-xl font-bold text-white">{value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {(['all', 'candidate', 'employer'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => { setRoleFilter(r); setSelectedIds(new Set()); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize
                    ${roleFilter === r ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                  {r === 'all' ? 'All' : r + 's'}
                </button>
              ))}
              <button onClick={load} disabled={loading} className="ml-1 text-gray-400 hover:text-white disabled:opacity-40">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="mt-3 flex items-center gap-3 pt-3 border-t border-gray-800">
              <span className="text-sm text-gray-400">
                <span className="text-white font-medium">{selectedIds.size}</span> user{selectedIds.size > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors"
              >
                <X className="w-3 h-3" />Clear
              </button>
              <button
                onClick={handleSendReminder}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
              >
                <Mail className="w-3 h-3" />Send Reminder Email
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800">
                  <th className="px-6 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selectedIds.size === filtered.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left px-6 py-3 font-medium">Name</th>
                  <th className="text-left px-6 py-3 font-medium">Email</th>
                  <th className="text-left px-6 py-3 font-medium">Role</th>
                  <th className="text-left px-6 py-3 font-medium">Jobs</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                  <th className="text-left px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-800 animate-pulse">
                        <td className="px-6 py-3"><div className="h-4 w-4 bg-gray-700 rounded" /></td>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-6 py-3"><div className="h-4 bg-gray-700 rounded w-24" /></td>
                        ))}
                      </tr>
                    ))
                  : filtered.map(u => {
                      const uid = getUserId(u);
                      const role = getUserRole(u);
                      const active = isActive(u);
                      const checked = selectedIds.has(uid);
                      return (
                        <tr
                          key={uid}
                          className={`border-b border-gray-800 hover:bg-gray-800/40 transition-colors cursor-pointer ${checked ? 'bg-blue-900/20' : ''}`}
                          onClick={() => { setSelectedUserId(uid); }}
                        >
                          <td className="px-6 py-3" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSelect(uid)}
                              className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${role === 'employer' ? 'bg-orange-600' : 'bg-purple-600'}`}>
                                {getUserName(u).charAt(0).toUpperCase()}
                              </div>
                              <span className="text-gray-200 font-medium truncate max-w-[200px]">{getUserName(u)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-gray-400">{u.email}</td>
                          <td className="px-6 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize
                              ${role === 'employer' ? 'bg-orange-900/40 text-orange-400' : 'bg-purple-900/40 text-purple-400'}`}>
                              {role === 'candidate' ? 'Candidate' : 'Employer'}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-900/40 text-blue-400">
                              <Briefcase className="w-3 h-3" />
                              {u.jobCount ?? 0}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                              ${active ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
                              {active ? 'Active' : 'Banned'}
                            </span>
                          </td>
                          <td className="px-6 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => banUser(uid, active)}
                                disabled={actionLoading === uid}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50
                                  ${active
                                    ? 'bg-red-900/30 text-red-400 hover:bg-red-900/60'
                                    : 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/60'}`}
                              >
                                {active ? <><ShieldOff className="w-3 h-3" />Ban</> : <><Shield className="w-3 h-3" />Unban</>}
                              </button>
                              <button
                                onClick={() => deleteUser(uid, getUserName(u))}
                                disabled={actionLoading === uid + 'delete'}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-400 hover:bg-red-900/40 hover:text-red-400 transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="w-3 h-3" />Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                }
              </tbody>
            </table>
            {!loading && !filtered.length && (
              <p className="text-center text-gray-500 py-8 text-sm">
                {search || roleFilter !== 'all' ? 'No users match your search.' : 'No users found.'}
              </p>
            )}
          </div>
        </div>
      </div>
      <ConfirmModal
        open={confirmState.open}
        title="Delete User"
        message={confirmState.message}
        confirmLabel="Delete"
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
      />
    </>
  );
}