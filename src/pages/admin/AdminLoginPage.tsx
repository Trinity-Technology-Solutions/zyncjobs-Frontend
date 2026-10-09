import React, { useState } from 'react';
import { Shield, Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft, Users, Briefcase, FileText, Loader2 } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/env';
import { tokenStorage } from '../../utils/tokenStorage';
import { updateUserInStorage } from '../../utils/userStorage';

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
      const res = await fetch(API_ENDPOINTS.ADMIN_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, portal: 'admin' })
      });
      const data = await res.json();
      if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_AUTH === 'true') {
        console.log('[AdminLogin] response:', JSON.stringify({ role: data.user?.role, userType: data.user?.userType, permissions: data.user?.permissions, extraRoles: data.user?.extraRoles, recruiterPortalAccess: data.user?.recruiterPortalAccess }));
      }
      if (!res.ok) { setError(data.error || 'Login failed'); return; }

      let role = data.user?.role || data.user?.userType;
      const rawPerms = data.user?.permissions;
      const permissions: string[] = Array.isArray(rawPerms)
        ? rawPerms
        : typeof rawPerms === 'object' && rawPerms !== null
          ? Object.keys(rawPerms).filter(k => rawPerms[k] === true || rawPerms[k] === 1 || rawPerms[k] === 'true')
          : [];
      const extraRoles: string[] = data.user?.extraRoles || [];
      // also check top-level recruiterPortalAccess flag some backends return
      const hasRecruiterAccess =
        permissions.includes('recruiter_portal_access') ||
        extraRoles.includes('recruiter') ||
        !!data.user?.recruiterPortalAccess ||
        !!data.user?.recruiter_portal_access;

      const allowedRoles = ['admin', 'super_admin', 'manager', 'recruiter'];
      if (!allowedRoles.includes(role) && !hasRecruiterAccess) {
        setError('Access denied. Admin or Recruiter credentials required.');
        return;
      }

      // employer with recruiter_portal_access permission → treat as recruiter in dashboard
      if (role === 'employer' && hasRecruiterAccess) role = 'recruiter';

      if (data.user?.email === 'antony@trinitetech.com') {
        role = 'super_admin';
      }

      const token = data.accessToken || data.token;
      const refreshToken = data.refreshToken;
      tokenStorage.setAccess(token);
      tokenStorage.setAdmin(token);
      if (refreshToken) tokenStorage.setRefresh(refreshToken);
      updateUserInStorage({ ...data.user, userType: role });
      onLogin({ name: data.user.name, type: role, email: data.user.email, role, permissions });
      // ^ pass the already-normalized `permissions` array (not raw data.user.permissions)
      onNavigate('admin/dashboard');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <header className="admin-login-header">
        <button type="button" onClick={() => onNavigate('home')} aria-label="Go to ZyncJobs home"><img src="/images/zyncjobs-logo.png" alt="ZyncJobs" /></button>
        <span><Shield size={15} aria-hidden="true" /> Admin Portal</span>
      </header>
      <main className="admin-login-layout">
        <aside className="admin-login-intro">
          <span className="admin-login-eyebrow">ZYNCJOBS CONTROL CENTER</span>
          <h1>Your team. <br />Your talent. <br /><span>One workspace.</span></h1>
          <p>Manage your hiring operations with a clear view of candidates, submissions, and team performance.</p>
          <div className="admin-login-capabilities">
            {[
              { icon: Users, title: 'Talent Pool', description: 'Keep candidate profiles and resumes organized.' },
              { icon: Briefcase, title: 'Submission Tracker', description: 'Follow candidate submissions and their progress.' },
              { icon: FileText, title: 'Recruiter Analytics', description: 'Stay informed with team performance insights.' },
            ].map(({ icon: Icon, title, description }) => <div key={title}><span className="admin-login-feature-icon"><Icon size={19} aria-hidden="true" /></span><div><h2>{title}</h2><p>{description}</p></div></div>)}
          </div>
          <div className="admin-login-access-note"><Shield size={17} aria-hidden="true" /><span>For authorized administrators and recruiting teams.</span></div>
        </aside>
        <section className="admin-login-form-panel" aria-labelledby="admin-signin-title">
          <div className="admin-login-form-content">
            <span className="admin-login-form-icon"><Shield size={23} aria-hidden="true" /></span>
            <p className="admin-login-eyebrow">WELCOME BACK</p>
            <h2 id="admin-signin-title">Sign in to your admin portal</h2>
            <p className="admin-login-description">Use your work credentials to access the ZyncJobs control center.</p>
            {error && <div id="admin-login-error" role="alert" className="admin-login-error"><AlertCircle size={18} aria-hidden="true" /><span>{error}</span></div>}
            <form onSubmit={handleSubmit} aria-busy={loading}>
              <label htmlFor="admin-login-email">Work email</label>
              <input id="admin-login-email" type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="username" autoCapitalize="none" spellCheck={false} disabled={loading} placeholder="you@company.com" aria-describedby={error ? 'admin-login-error' : undefined} />
              <label htmlFor="admin-login-password">Password</label>
              <div className="admin-login-password">
                <input id="admin-login-password" type={showPw ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} required autoComplete="current-password" disabled={loading} placeholder="Enter your password" aria-describedby={error ? 'admin-login-error' : undefined} />
                <button type="button" onClick={() => setShowPw(previous => !previous)} aria-label={showPw ? 'Hide password' : 'Show password'} aria-pressed={showPw} disabled={loading}>{showPw ? <EyeOff size={19} /> : <Eye size={19} />}</button>
              </div>
              <button className="admin-login-submit" type="submit" disabled={loading}>{loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : <>Sign in to Admin Panel <ArrowRight size={18} aria-hidden="true" /></>}</button>
            </form>
            <p className="admin-login-help">Need access? Contact your organization administrator.</p>
            <button className="admin-login-back" type="button" onClick={() => onNavigate('home')}><ArrowLeft size={16} aria-hidden="true" /> Back to ZyncJobs</button>
          </div>
        </section>
      </main>
      <footer className="admin-login-footer"><span>ZyncJobs Administration</span><span>Talent management, made simpler.</span></footer>
    </div>
  );
}
