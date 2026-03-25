import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle, CheckCircle, Settings, ToggleLeft, ToggleRight, Server } from 'lucide-react';
import { API_ENDPOINTS } from '../../../config/env';

function authHeaders() {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function authFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, { ...options, headers: { ...authHeaders(), ...(options.headers as any || {}) } });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

interface AppSettings {
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  requireEmailVerification: boolean;
  jobAutoApprove: boolean;
  maxJobsPerEmployer: number;
}

const DEFAULT: AppSettings = {
  maintenanceMode: false, allowRegistrations: true,
  requireEmailVerification: false, jobAutoApprove: false,
  maxJobsPerEmployer: 10,
};

export default function AdminSettingsSection({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [health, setHealth] = useState<any>(null);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwStatus, setPwStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [settingsRes, healthRes] = await Promise.allSettled([
          authFetch(API_ENDPOINTS.ADMIN_SETTINGS),
          authFetch(API_ENDPOINTS.ADMIN_SYSTEM_HEALTH),
        ]);
        if (settingsRes.status === 'fulfilled') setSettings({ ...DEFAULT, ...settingsRes.value });
        if (healthRes.status === 'fulfilled') setHealth(healthRes.value);
      } catch (e: any) {
        if (e.message === '401') onUnauthorized();
      } finally { setLoading(false); }
    };
    load();
  }, [onUnauthorized]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await authFetch(API_ENDPOINTS.ADMIN_SETTINGS, { method: 'PUT', body: JSON.stringify(settings) });
      setStatus({ type: 'success', text: 'Settings saved successfully.' });
    } catch { setStatus({ type: 'error', text: 'Failed to save settings.' }); }
    finally { setSaving(false); }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { setPwStatus({ type: 'error', text: 'Passwords do not match.' }); return; }
    setPwLoading(true);
    setPwStatus(null);
    try {
      await authFetch(`${API_ENDPOINTS.ADMIN_USERS}/me/password`, {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }),
      });
      setPwStatus({ type: 'success', text: 'Password updated.' });
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch { setPwStatus({ type: 'error', text: 'Failed. Check current password.' }); }
    finally { setPwLoading(false); }
  };

  const Toggle = ({ field }: { field: keyof AppSettings }) => (
    <button type="button" onClick={() => setSettings(s => ({ ...s, [field]: !s[field] }))}
      className={`flex items-center gap-1.5 text-sm transition-colors ${settings[field] ? 'text-purple-400' : 'text-gray-500'}`}>
      {settings[field] ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
      {settings[field] ? 'On' : 'Off'}
    </button>
  );

  if (loading) return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 p-6 animate-pulse space-y-3">
          <div className="h-5 bg-gray-800 rounded w-32" />
          <div className="h-4 bg-gray-800 rounded w-full" />
          <div className="h-4 bg-gray-800 rounded w-3/4" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4 max-w-2xl">
      {/* System Health */}
      {health && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Server className="w-4 h-4 text-purple-400" />System Health</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Database', val: health.database || 'unknown' },
              { label: 'Memory', val: health.memory || '—' },
              { label: 'Uptime', val: health.uptime ? `${Math.floor(health.uptime / 3600)}h` : '—' },
              { label: 'Status', val: health.status || 'ok' },
            ].map(({ label, val }) => (
              <div key={label} className="bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className={`text-sm font-semibold capitalize ${val === 'ok' || val === 'connected' ? 'text-emerald-400' : 'text-gray-300'}`}>{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* App Settings */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2"><Settings className="w-5 h-5 text-purple-400" />App Configuration</h2>
        <p className="text-xs text-gray-500 mb-5">General platform settings</p>

        {status && (
          <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm mb-4
            ${status.type === 'success' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
            {status.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {status.text}
          </div>
        )}

        <form onSubmit={save} className="space-y-5">
          <div className="w-full sm:w-1/2">
            <label className="block text-xs text-gray-400 mb-1">Max Jobs Per Employer</label>
            <input type="number" value={settings.maxJobsPerEmployer}
              onChange={e => setSettings(s => ({ ...s, maxJobsPerEmployer: Number(e.target.value) }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>

          {/* Feature Toggles */}
          <div className="space-y-3">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Feature Toggles</p>
            {([
              { field: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Block all non-admin access' },
              { field: 'allowRegistrations', label: 'Allow Registrations', desc: 'New users can sign up' },
              { field: 'requireEmailVerification', label: 'Email Verification', desc: 'Require email verify on signup' },
              { field: 'jobAutoApprove', label: 'Auto-Approve Jobs', desc: 'Skip manual job moderation' },
            ] as const).map(({ field, label, desc }) => (
              <div key={field} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm text-gray-200">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <Toggle field={field} />
              </div>
            ))}
          </div>

          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
            <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Change Admin Password</h2>

        {pwStatus && (
          <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm mb-4
            ${pwStatus.type === 'success' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
            <AlertCircle className="w-4 h-4 shrink-0" />{pwStatus.text}
          </div>
        )}

        <form onSubmit={changePassword} className="space-y-4">
          {(['current', 'newPw', 'confirm'] as const).map(field => (
            <div key={field}>
              <label className="block text-xs text-gray-400 mb-1">
                {field === 'current' ? 'Current Password' : field === 'newPw' ? 'New Password' : 'Confirm New Password'}
              </label>
              <input type="password" value={pwForm[field]} onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))} required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          ))}
          <button type="submit" disabled={pwLoading}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
            {pwLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
