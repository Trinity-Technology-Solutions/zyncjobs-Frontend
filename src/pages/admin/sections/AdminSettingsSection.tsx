import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle, CheckCircle, Settings, ToggleLeft, ToggleRight, Server, Image, Shield } from 'lucide-react';
import { API_ENDPOINTS } from '../../../config/env';
import { tokenStorage } from '../../../utils/tokenStorage';
import { apiFetch } from '../../../api/apiFetch';

function authHeaders() {
  const token = tokenStorage.getAdmin() || tokenStorage.getAccess();
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function authFetch(url: string, options: RequestInit = {}) {
  const res = await apiFetch(url, { ...options, headers: { ...authHeaders(), ...(options.headers as any || {}) } });
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

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireSpecial: boolean;
  expiryDays: number;
  historyCount: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
}

const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecial: true,
  expiryDays: 90,
  historyCount: 5,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
};

const DEFAULT: AppSettings = {
  maintenanceMode: false, allowRegistrations: true,
  requireEmailVerification: false, jobAutoApprove: false,
  maxJobsPerEmployer: 10,
};

export default function AdminSettingsSection({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT);
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy>(DEFAULT_PASSWORD_POLICY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [health, setHealth] = useState<any>(null);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwStatus, setPwStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [logoFetching, setLogoFetching] = useState(false);
  const [logoStatus, setLogoStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [policySaving, setPolicySaving] = useState(false);
  const [policyStatus, setPolicyStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [settingsRes, healthRes, policyRes] = await Promise.allSettled([
          authFetch(API_ENDPOINTS.ADMIN_SETTINGS),
          authFetch(API_ENDPOINTS.ADMIN_SYSTEM_HEALTH),
          authFetch(`${API_ENDPOINTS.ADMIN_SETTINGS}/password-policy`),
        ]);
        if (settingsRes.status === 'fulfilled') setSettings({ ...DEFAULT, ...settingsRes.value });
        if (healthRes.status === 'fulfilled') setHealth(healthRes.value);
        if (policyRes.status === 'fulfilled') setPasswordPolicy({ ...DEFAULT_PASSWORD_POLICY, ...policyRes.value });
      } catch (e: any) {
        if (e.message === '401') onUnauthorized();
      } finally { setLoading(false); }
    };
    load();
  }, [onUnauthorized]);

  const savePasswordPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setPolicySaving(true);
    setPolicyStatus(null);
    try {
      await authFetch(`${API_ENDPOINTS.ADMIN_SETTINGS}/password-policy`, {
        method: 'PUT',
        body: JSON.stringify(passwordPolicy),
      });
      setPolicyStatus({ type: 'success', text: 'Password policy saved.' });
    } catch {
      setPolicyStatus({ type: 'error', text: 'Failed to save password policy.' });
    } finally {
      setPolicySaving(false);
    }
  };

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

  const bulkFetchLogos = async () => {
    setLogoFetching(true);
    setLogoStatus(null);
    try {
      const API = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${API}/admin/bulk-fetch-logos`, { method: 'POST' });
      const data = await res.json();
      setLogoStatus({ type: 'success', text: `Updated ${data.updated} of ${data.total} companies with logos.` });
    } catch {
      setLogoStatus({ type: 'error', text: 'Failed to fetch logos.' });
    } finally {
      setLogoFetching(false);
    }
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

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2"><Settings className="w-5 h-5 text-purple-400" />App Configuration</h2>
        <p className="text-xs text-gray-500 mb-5">General platform settings</p>
        {status && (
          <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm mb-4 ${status.type === 'success' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
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

      {/* Bulk Logo Fetch */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-1 flex items-center gap-2"><Image className="w-4 h-4 text-purple-400" />Company Logos</h2>
        <p className="text-xs text-gray-500 mb-4">Auto-fetch logos for all companies missing a logo using their email domain</p>
        {logoStatus && (
          <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm mb-4 ${logoStatus.type === 'success' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
            {logoStatus.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {logoStatus.text}
          </div>
        )}
        <button onClick={bulkFetchLogos} disabled={logoFetching}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
          <RefreshCw className={`w-4 h-4 ${logoFetching ? 'animate-spin' : ''}`} />
          {logoFetching ? 'Fetching...' : 'Bulk Fetch Company Logos'}
        </button>
      </div>

      {/* Password Policy */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2"><Shield className="w-5 h-5 text-purple-400" />Password Policy</h2>
        <p className="text-xs text-gray-500 mb-5">Configure password complexity, expiry, and account lockout rules</p>
        {policyStatus && (
          <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm mb-4 ${policyStatus.type === 'success' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
            {policyStatus.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {policyStatus.text}
          </div>
        )}
        <form onSubmit={savePasswordPolicy} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Min Password Length</label>
              <input type="number" min={4} max={64} value={passwordPolicy.minLength}
                onChange={e => setPasswordPolicy(p => ({ ...p, minLength: Number(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Password Expiry (days)</label>
              <input type="number" min={0} max={365} value={passwordPolicy.expiryDays}
                onChange={e => setPasswordPolicy(p => ({ ...p, expiryDays: Number(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Password History (count)</label>
              <input type="number" min={0} max={24} value={passwordPolicy.historyCount}
                onChange={e => setPasswordPolicy(p => ({ ...p, historyCount: Number(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Max Login Attempts (hackcount)</label>
              <input type="number" min={1} max={20} value={passwordPolicy.maxLoginAttempts}
                onChange={e => setPasswordPolicy(p => ({ ...p, maxLoginAttempts: Number(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Lockout Duration (minutes)</label>
              <input type="number" min={1} max={1440} value={passwordPolicy.lockoutDurationMinutes}
                onChange={e => setPasswordPolicy(p => ({ ...p, lockoutDurationMinutes: Number(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Complexity Requirements</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([
                { field: 'requireUppercase', label: 'Uppercase (A-Z)' },
                { field: 'requireLowercase', label: 'Lowercase (a-z)' },
                { field: 'requireDigit', label: 'Digit (0-9)' },
                { field: 'requireSpecial', label: 'Special (!@#$%)' },
              ] as const).map(({ field, label }) => (
                <label key={field} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2.5 cursor-pointer">
                  <input type="checkbox" checked={passwordPolicy[field]}
                    onChange={e => setPasswordPolicy(p => ({ ...p, [field]: e.target.checked }))}
                    className="rounded border-gray-600 text-purple-500 focus:ring-purple-500" />
                  <span className="text-sm text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" disabled={policySaving}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
            <Save className="w-4 h-4" />{policySaving ? 'Saving...' : 'Save Password Policy'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Change Admin Password</h2>
        {pwStatus && (
          <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm mb-4 ${pwStatus.type === 'success' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
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
