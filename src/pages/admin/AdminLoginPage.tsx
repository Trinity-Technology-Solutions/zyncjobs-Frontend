import React, { useState } from 'react';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/env';

interface Props {
  onLogin: (user: any) => void;
  onNavigate: (page: string) => void;
}

export default function AdminLoginPage({ onLogin, onNavigate }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); return; }

      const role = data.user?.role || data.user?.userType;
      if (role !== 'admin' && role !== 'super_admin') {
        setError('Access denied. Admin credentials required.');
        return;
      }

      const token = data.accessToken || data.token;
      localStorage.setItem('accessToken', token);
      localStorage.setItem('adminToken', token);
      localStorage.setItem('user', JSON.stringify({ ...data.user, userType: role }));
      onLogin({ name: data.user.name, type: role, email: data.user.email });
      onNavigate('admin/dashboard');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-orange-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/images/zyncjobs-logo.png" alt="ZyncJobs" className="h-14 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white">Admin Portal</h1>
          <p className="text-orange-300 mt-1">ZyncJobs Control Center</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-orange-500/30">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 text-red-200 rounded-lg px-4 py-3 mb-6 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-orange-200 mb-1.5">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@zyncjobs.com"
                className="w-full bg-white/10 border border-orange-500/30 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-orange-200 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-orange-500/30 rounded-lg px-4 py-3 pr-12 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-300 hover:text-white">
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-blue-600 hover:from-orange-600 hover:to-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In to Admin Panel'}
            </button>
          </form>

          <p className="text-center text-orange-400/60 text-sm mt-6">
            <button onClick={() => onNavigate('home')} className="hover:text-orange-300 transition-colors">
              ← Back to ZyncJobs
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
