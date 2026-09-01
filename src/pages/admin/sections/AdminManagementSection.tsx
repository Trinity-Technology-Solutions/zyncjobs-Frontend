import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, UserPlus, RefreshCw, AlertCircle, CheckCircle, 
  Mail, User, Crown, Settings, Trash2, Eye, EyeOff 
} from 'lucide-react';
import { API_ENDPOINTS } from '../../../config/env';
import { tokenStorage } from '../../../utils/tokenStorage';
import { apiFetch } from '../../../api/apiFetch';
import { isSuperAdmin, getRoleDisplayName } from '../../../utils/rolePermissions';
import ConfirmModal from '../../../components/ConfirmModal';
import AutocompleteCombobox from '../../../components/AutocompleteCombobox';
import { debugAdminFlow, debugInviteEmail } from '../../../utils/adminDebug';

function authHeaders() {
  // Try admin token first, then access token
  const adminToken = tokenStorage.getAdmin();
  const accessToken = tokenStorage.getAccess();
  const token = adminToken || accessToken;
  
  console.log('🔑 Auth headers - Admin token exists:', !!adminToken);
  console.log('🔑 Auth headers - Access token exists:', !!accessToken);
  console.log('🔑 Auth headers - Using token:', !!token);
  
  return { 
    'Content-Type': 'application/json', 
    ...(token ? { Authorization: `Bearer ${token}` } : {}) 
  };
}

async function authFetch(url: string, options: RequestInit = {}, onUnauthorized?: () => void) {
  const res = await apiFetch(url, { ...options, headers: { ...authHeaders(), ...(options.headers || {}) } });
  if (res.status === 401) {
    tokenStorage.clear();
    onUnauthorized?.();
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

interface Admin {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'recruiter';
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface AddAdminForm {
  name: string;
  email: string;
  role: 'admin' | 'super_admin' | 'recruiter';
}

export default function AdminManagementSection({ 
  onUnauthorized, 
  currentUser 
}: { 
  onUnauthorized: () => void;
  currentUser: { email: string; name: string; role?: string };
}) {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<AddAdminForm>({
    name: '', email: '', role: 'admin'
  });
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState<{ adminId: string; adminName: string } | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const isCurrentUserSuperAdmin = isSuperAdmin(currentUser.email) || 
                                   isSuperAdmin((currentUser as any).role || '') ||
                                   (currentUser as any).type === 'super_admin' ||
                                   currentUser.role === 'super_admin';

  console.log('🔍 Admin Management Access Check:');
  console.log('- currentUser:', currentUser);
  console.log('- currentUser.email:', currentUser.email);
  console.log('- currentUser.role:', (currentUser as any).role);
  console.log('- currentUser.type:', (currentUser as any).type);
  console.log('- isCurrentUserSuperAdmin:', isCurrentUserSuperAdmin);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [adminRes, superRes] = await Promise.allSettled([
        authFetch(`${API_ENDPOINTS.ADMIN_USERS}?role=admin`, {}, onUnauthorized),
        authFetch(`${API_ENDPOINTS.ADMIN_USERS}?role=super_admin`, {}, onUnauthorized),
      ]);
      const admins: Admin[] = adminRes.status === 'fulfilled' ? (adminRes.value.users ?? adminRes.value.data ?? adminRes.value ?? []) : [];
      const superAdmins: Admin[] = superRes.status === 'fulfilled' ? (superRes.value.users ?? superRes.value.data ?? superRes.value ?? []) : [];
      const seen = new Set<string>();
      const merged = [...admins, ...superAdmins].filter(u => {
        const id = (u._id || u.id) ?? '';
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      setAdmins(merged);
    } catch (e: any) {
      if (e.message !== 'UNAUTHORIZED') {
        setError('Failed to load admin users.');
      }
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const addAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.email.trim()) {
      setError('Name and email are required.');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(addForm.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    
    // Check if email already exists in current admin list
    const emailExists = admins.some(admin => 
      admin.email.toLowerCase() === addForm.email.trim().toLowerCase()
    );
    if (emailExists) {
      setError('An admin with this email already exists in the system.');
      return;
    }
    
    setActionLoading('add');
    setError('');
    setSuccess('');
    
    console.log('📧 Sending admin invite:', {
      name: addForm.name.trim(),
      email: addForm.email.trim().toLowerCase(),
      role: addForm.role,
      endpoint: API_ENDPOINTS.ADMIN_INVITE
    });
    
    const headers = authHeaders();
    console.log('📧 Request headers:', { ...headers, Authorization: headers.Authorization ? 'Bearer ***' : 'none' });
    
    try {
      const response = await apiFetch(`${API_ENDPOINTS.ADMIN_INVITE}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: addForm.name.trim(),
          email: addForm.email.trim().toLowerCase(),
          role: addForm.role
        })
      });
      
      console.log('📧 Invite response status:', response.status);
      
      if (!response.ok) {
        let errorData: any = {};
        let errorText = '';
        try {
          const clonedResponse = response.clone();
          errorText = await clonedResponse.text();
          console.error('📧 Invite raw error response:', errorText);
          errorData = JSON.parse(errorText);
        } catch {
          console.error('📧 Invite error response is not valid JSON');
        }
        console.error('📧 Invite parsed error:', errorData);
        
        if (response.status === 409) {
          throw new Error('An admin with this email already exists. Please use a different email address.');
        } else if (response.status === 400) {
          throw new Error(errorData.message || errorData.error || 'Invalid request. Please check the form data.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to invite administrators.');
        } else {
          const message = errorData.message || errorData.error || errorText || `Server error (${response.status}). Please try again.`;
          throw new Error(message);
        }
      }
      
      console.log('🎉 Invite sent successfully!');
      setSuccess(`Invitation sent to ${addForm.email}! They'll receive an email to set their password.`);
      setAddForm({ name: '', email: '', role: 'admin' });
      setShowAddForm(false);
      // Refresh the admin list to show any updates
      loadAdmins();
    } catch (error: any) {
      console.error('🚨 Invite error:', error);
      setError(error.message || 'Failed to send invite. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const updateAdminRole = async (adminId: string, newRole: 'admin' | 'super_admin' | 'recruiter') => {
    setActionLoading(adminId + 'role');
    setError('');
    setSuccess('');

    try {
      await authFetch(`${API_ENDPOINTS.ADMIN_USERS}/${adminId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      }, onUnauthorized);

      setAdmins(prev => prev.map(admin => 
        (admin._id || admin.id) === adminId ? { ...admin, role: newRole } : admin
      ));
      setSuccess('Admin role updated successfully!');
    } catch (error) {
      setError('Failed to update admin role.');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleAdminStatus = async (adminId: string, currentStatus: boolean) => {
    setActionLoading(adminId + 'status');
    setError('');
    setSuccess('');

    try {
      await authFetch(`${API_ENDPOINTS.ADMIN_USERS}/${adminId}/ban`, {
        method: 'PUT',
        body: JSON.stringify({ ban: currentStatus })
      }, onUnauthorized);

      setAdmins(prev => prev.map(admin => 
        (admin._id || admin.id) === adminId ? { ...admin, isActive: !currentStatus } : admin
      ));
      setSuccess(`Admin ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
    } catch (error) {
      setError('Failed to update admin status.');
    } finally {
      setActionLoading(null);
    }
  };

const [confirmState, setConfirmState] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });

  const deleteAdmin = (adminId: string, adminName: string) => {
    setConfirmState({ open: true, message: `Are you sure you want to delete admin "${adminName}"? This action cannot be undone.`, onConfirm: () => execDeleteAdmin(adminId) });
  };

  const execDeleteAdmin = async (adminId: string) => {
    setConfirmState(s => ({ ...s, open: false }));
    setActionLoading(adminId + 'delete');
    setError('');
    setSuccess('');

    try {
      const response = await apiFetch(`${API_ENDPOINTS.ADMIN_USERS}/${adminId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Delete failed (${response.status})`);
      }

      // Remove from UI immediately
      setAdmins(prev => prev.filter(admin => (admin._id || admin.id) !== adminId));
      setSuccess(`Admin ${adminName} deleted successfully!`);
    } catch (error: any) {
      console.error('Delete admin error:', error);
      setError(error.message || 'Failed to delete admin.');
    } finally {
      setActionLoading(null);
    }
  };

  const resetPassword = async (adminId: string, adminName: string) => {
    setResetPasswordData({ adminId, adminName });
    setNewPasswordInput('');
    setShowResetPasswordModal(true);
  };

  const handleResetPasswordSubmit = async () => {
    if (!resetPasswordData) return;
    
    if (!newPasswordInput || newPasswordInput.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setActionLoading(resetPasswordData.adminId + 'password');
    setError('');
    setSuccess('');
    setShowResetPasswordModal(false);

    try {
      await authFetch(`${API_ENDPOINTS.ADMIN_USERS}/${resetPasswordData.adminId}/reset-password`, {
        method: 'PUT',
        body: JSON.stringify({ newPassword: newPasswordInput })
      }, onUnauthorized);

      setSuccess(`Password reset successfully for ${resetPasswordData.adminName}!`);
      setResetPasswordData(null);
      setNewPasswordInput('');
    } catch (error) {
      setError('Failed to reset password.');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isCurrentUserSuperAdmin) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
        <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-200 mb-2">Access Denied</h2>
        <p className="text-gray-400">Only Super Administrators can manage admin accounts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reset Password Modal */}
      {showResetPasswordModal && resetPasswordData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Reset Password</h3>
            <p className="text-sm text-gray-400 mb-4">Enter new password for {resetPasswordData.adminName}</p>
            <div onSubmit={(e) => { e.preventDefault(); handleResetPasswordSubmit(); }}>
              <input
                type="text"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                placeholder="Enter new password (min 6 chars)"
                style={{ WebkitTextSecurity: 'disc' } as React.CSSProperties}
                autoComplete="off"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowResetPasswordModal(false); setResetPasswordData(null); setNewPasswordInput(''); }}
                  className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetPasswordSubmit}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-yellow-400" />
            <div>
              <h2 className="text-xl font-semibold text-gray-200">Admin Management</h2>
              <p className="text-sm text-gray-400">Manage administrator accounts and permissions</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Admin
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 text-red-300 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-green-900/30 border border-green-700/50 text-green-300 rounded-lg px-4 py-3 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Add Admin Form */}
      {showAddForm && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Add New Administrator</h3>
          <form onSubmit={addAdmin} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Admin full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="admin@example.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
              <AutocompleteCombobox
                value={addForm.role}
                onChange={(val) => setAddForm(prev => ({ ...prev, role: val as 'admin' | 'super_admin' | 'recruiter' }))}
                options={[
                  { value: 'admin', label: 'Administrator' },
                  { value: 'recruiter', label: 'Recruiter (Talent Pool & Submissions)' },
                  { value: 'super_admin', label: 'Super Administrator' },
                ]}
                placeholder="Select role..."
              />
            </div>
            <p className="text-xs text-gray-400">An invitation email will be sent. They'll set their own password via the link.</p>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={actionLoading === 'add'}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                {actionLoading === 'add' ? 'Sending...' : 'Send Invite'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admins List */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-gray-200">Administrator Accounts</h3>
          <button
            onClick={loadAdmins}
            disabled={loading}
            className="text-gray-400 hover:text-white disabled:opacity-40 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="text-left px-6 py-3 font-medium">Admin</th>
                <th className="text-left px-6 py-3 font-medium">Role</th>
                <th className="text-left px-6 py-3 font-medium">Status</th>
                <th className="text-left px-6 py-3 font-medium">Last Login</th>
                <th className="text-left px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-800 animate-pulse">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-700 rounded w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No administrators found.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => {
                  const adminId = (admin._id || admin.id) ?? '';
                  const isCurrentUser = admin.email === currentUser.email;
                  const isSuperAdminUser = admin.role === 'super_admin';
                  
                  return (
                    <tr key={adminId} className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {admin.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-gray-200 font-medium">
                              {admin.name}
                              {isCurrentUser && <span className="text-blue-400 text-xs ml-2">(You)</span>}
                            </p>
                            <p className="text-gray-400 text-xs">{admin.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isCurrentUser ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isSuperAdminUser 
                              ? 'bg-yellow-900/40 text-yellow-400' 
                              : 'bg-blue-900/40 text-blue-400'
                          }`}>
                            {getRoleDisplayName(admin.role)}
                          </span>
                        ) : (
                          <AutocompleteCombobox
                            value={admin.role}
                            onChange={(val) => updateAdminRole(adminId!, val as 'admin' | 'super_admin')}
                            disabled={!!actionLoading}
                            options={[
                              { value: 'admin', label: 'Administrator' },
                              { value: 'super_admin', label: 'Super Administrator' },
                            ]}
                            placeholder="Select role..."
                            className="text-xs"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          admin.isActive 
                            ? 'bg-emerald-900/40 text-emerald-400' 
                            : 'bg-red-900/40 text-red-400'
                        }`}>
                          {admin.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {admin.lastLoginAt 
                          ? new Date(admin.lastLoginAt).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {!isCurrentUser && (
                            <>
                              <button
                                onClick={() => toggleAdminStatus(adminId!, admin.isActive)}
                                disabled={actionLoading === adminId + 'status'}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                                  admin.isActive
                                    ? 'bg-red-900/30 text-red-400 hover:bg-red-900/60'
                                    : 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/60'
                                }`}
                              >
                                {admin.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              
                              <button
                                onClick={() => resetPassword(adminId!, admin.name)}
                                disabled={actionLoading === adminId + 'password'}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-900/30 text-blue-400 hover:bg-blue-900/60 transition-colors disabled:opacity-50"
                              >
                                <Settings className="w-3 h-3" />
                                Reset Password
                              </button>
                              
                              <button
                                onClick={() => deleteAdmin(adminId!, admin.name)}
                                disabled={actionLoading === adminId + 'delete'}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-900/30 text-red-400 hover:bg-red-900/60 transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
      <ConfirmModal
        open={confirmState.open}
        title="Delete Admin"
        message={confirmState.message}
        confirmLabel="Delete"
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
      />
      <ConfirmModal
        open={confirmState.open}
        title="Delete Admin"
        message={confirmState.message}
        confirmLabel="Delete"
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
      />
  );
}