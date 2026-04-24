import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, MapPin, Briefcase, FileText, Shield, ShieldOff, Trash2, ExternalLink, Layers } from 'lucide-react';
import { API_ENDPOINTS } from '../../../config/env';
import { tokenStorage } from '../../../utils/tokenStorage';

function authHeaders() {
  const token = tokenStorage.getAdmin() || tokenStorage.getAccess();
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

interface Props {
  userId: string;
  onClose: () => void;
  onAction: () => void;
  onDeleted?: (deletedId: string) => void;
}

export default function UserDetailsModal({ userId, onClose, onAction, onDeleted }: Props) {
  const [user, setUser] = useState<any>(null);
  const [appliedJobs, setAppliedJobs] = useState<any[]>([]);
  const [postedJobs, setPostedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_ENDPOINTS.ADMIN_USERS}/${userId}`, { headers: authHeaders() });
        const data = await res.json();
        const userData = data.user ?? data;
        setUser(userData);
        setAppliedJobs(data.applications ?? []);
        // Fetch posted jobs if employer
        const role = userData?.role || userData?.userType;
        if (role === 'employer') {
          try {
            const jobsRes = await fetch(`${API_ENDPOINTS.ADMIN_USERS}/${userId}/jobs`, { headers: authHeaders() });
            if (jobsRes.ok) {
              const jobsData = await jobsRes.json();
              setPostedJobs(jobsData.jobs ?? jobsData ?? []);
            } else {
              // fallback: filter by employerId
              const fallback = await fetch(`${API_ENDPOINTS.JOBS}?employerId=${userId}&limit=100`, { headers: authHeaders() });
              if (fallback.ok) {
                const fd = await fallback.json();
                setPostedJobs(fd.jobs ?? fd ?? []);
              }
            }
          } catch { /* silently ignore */ }
        }
      } catch {
        setError('Failed to load user details.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const banToggle = async () => {
    setActionLoading('ban');
    try {
      await fetch(`${API_ENDPOINTS.ADMIN_USERS}/${userId}/ban`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ ban: user?.isActive }),
      });
      setUser((u: any) => ({ ...u, isActive: !u.isActive }));
      onAction();
    } catch { setError('Action failed.'); }
    finally { setActionLoading(''); }
  };

  const deleteUser = async () => {
    const ok = await (window as any).confirmAsync('Permanently delete this user? This cannot be undone.');
    if (!ok) return;
    setActionLoading('delete');
    try {
      const res = await fetch(`${API_ENDPOINTS.ADMIN_USERS}/${userId}`, { method: 'DELETE', headers: authHeaders() });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || body.message || `Delete failed (${res.status})`);
      onDeleted ? onDeleted(userId) : (onAction(), onClose());
    } catch (e: any) { setError(e.message || 'Delete failed.'); }
    finally { setActionLoading(''); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900">
          <h2 className="text-lg font-semibold">User Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-4 bg-gray-800 rounded w-3/4" />)}
          </div>
        ) : error ? (
          <p className="p-6 text-red-400 text-sm">{error}</p>
        ) : user && (
          <div className="p-6 space-y-6">
            {/* Profile */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-2xl font-bold">
                {(user.name || user.fullName || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-semibold">{user.name || user.fullName || '—'}</p>
                <p className="text-sm text-gray-400 capitalize">{user.role || user.userType}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${user.isActive ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
                  {user.isActive ? 'Active' : 'Banned'}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                { icon: Mail, label: user.email },
                { icon: Phone, label: user.phone || user.phoneNumber || 'No phone' },
                { icon: MapPin, label: user.location || user.city || 'No location' },
                { icon: Briefcase, label: user.companyName || user.currentRole || 'N/A' },
              ].map(({ icon: Icon, label }, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-400">
                  <Icon className="w-4 h-4 shrink-0 text-gray-600" />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Resume */}
            {user.resumeUrl && (
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2"><FileText className="w-4 h-4" />Resume</p>
                <a href={user.resumeUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 text-sm">
                  <ExternalLink className="w-3.5 h-3.5" />View Resume
                </a>
              </div>
            )}

            {/* Posted Jobs (employer) */}
            {postedJobs.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4" />Posted Jobs ({postedJobs.length})
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {postedJobs.map((job: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 text-sm">
                      <span className="text-gray-300 truncate max-w-[60%]">{job.title || job.jobTitle || 'Job'}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize shrink-0
                        ${job.status === 'approved' ? 'bg-emerald-900/40 text-emerald-400' :
                          job.status === 'rejected' ? 'bg-red-900/40 text-red-400' :
                          'bg-amber-900/40 text-amber-400'}`}>
                        {job.status || 'pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Applied Jobs */}
            {appliedJobs.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-300 mb-2">Applied Jobs ({appliedJobs.length})</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {appliedJobs.map((app: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 text-sm">
                      <span className="text-gray-300">{app.jobTitle || app.title || 'Job'}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize
                        ${app.status === 'accepted' ? 'bg-emerald-900/40 text-emerald-400' :
                          app.status === 'rejected' ? 'bg-red-900/40 text-red-400' :
                          'bg-gray-700 text-gray-400'}`}>
                        {app.status || 'pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-800">
              <button onClick={banToggle} disabled={!!actionLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50
                  ${user.isActive ? 'bg-red-900/30 text-red-400 hover:bg-red-900/60' : 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/60'}`}>
                {user.isActive ? <><ShieldOff className="w-4 h-4" />Ban User</> : <><Shield className="w-4 h-4" />Unban User</>}
              </button>
              <button onClick={deleteUser} disabled={!!actionLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-900/30 text-red-400 hover:bg-red-900/60 transition-colors disabled:opacity-50">
                <Trash2 className="w-4 h-4" />Delete User
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
