import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard, Users, Briefcase, Building2, BarChart2,
  Settings, LogOut, Menu, X, TrendingUp, UserCheck, FileText,
  Bell, RefreshCw, AlertCircle, CheckCircle, XCircle, Shield, ShieldOff,
  Mail, Activity, ChevronDown, User
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { API_ENDPOINTS } from '../../config/env';
import { tokenStorage } from '../../utils/tokenStorage';
import UserDetailsModal from './sections/UserDetailsModal';
import VerificationsSection from './sections/VerificationsSection';
import NotificationsSection from './sections/NotificationsSection';
import EmailControlSection from './sections/EmailControlSection';
import ActivityLogsSection from './sections/ActivityLogsSection';
import AdminSettingsSection from './sections/AdminSettingsSection';

interface Props {
  user: { name: string; email?: string };
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

interface OverviewStats {
  users: { total: number; totalCandidates: number; totalEmployers: number; newToday: number; newThisWeek: number; newThisMonth: number };
  jobs: { total: number; active: number; pending: number; newToday: number; newThisWeek: number; newThisMonth: number };
  applications: { total: number; newToday: number; newThisWeek: number; newThisMonth: number };
}

interface GrowthPoint {
  month: string;
  candidates: number;
  employers: number;
  jobs?: number;
  applications?: number;
}

interface QuickStat {
  topJobRole: string;
  topCompany: string;
  mostActiveUser: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  section: 'main' | 'users' | 'content' | 'communication' | 'system';
}

const navItems: NavItem[] = [
  { id: 'overview',      label: 'Overview',       icon: LayoutDashboard, section: 'main' },
  { id: 'admins',        label: 'Admins',          icon: Shield,          section: 'users' },
  { id: 'candidates',    label: 'Candidates',      icon: Users,           section: 'users' },
  { id: 'employers',     label: 'Employers',       icon: Building2,       section: 'users' },
  { id: 'verifications', label: 'Verifications',   icon: UserCheck,       section: 'users' },
  { id: 'jobs',          label: 'Jobs',            icon: Briefcase,       section: 'content' },
  { id: 'analytics',     label: 'Analytics',       icon: BarChart2,       section: 'content' },
  { id: 'reports',       label: 'Reports',         icon: TrendingUp,      section: 'content' },
  { id: 'notifications', label: 'Notifications',   icon: Bell,            section: 'communication' },
  { id: 'email',         label: 'Email Control',   icon: Mail,            section: 'communication' },
  { id: 'logs',          label: 'Activity Logs',   icon: Activity,        section: 'system' },
  { id: 'gdpr',          label: 'GDPR Dashboard',  icon: Shield,          section: 'system' },
  { id: 'settings',      label: 'Settings',        icon: Settings,        section: 'system' },
];

const sectionLabels: Record<string, string> = {
  users: 'User Management',
  content: 'Content',
  communication: 'Communication',
  system: 'System',
};

function authHeaders() {
  const token = tokenStorage.getAdmin() || tokenStorage.getAccess();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function authFetch(url: string, options: RequestInit = {}, onUnauthorized?: () => void) {
  const res = await fetch(url, { ...options, headers: { ...authHeaders(), ...(options.headers || {}) } });
  if (res.status === 401) {
    tokenStorage.clear();
    onUnauthorized?.();
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export default function AdminDashboardPage({ user, onNavigate, onLogout }: Props) {
  const [activeNav, setActiveNav] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [growth, setGrowth] = useState<GrowthPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [quickStats, setQuickStats] = useState<QuickStat>({ topJobRole: '—', topCompany: '—', mostActiveUser: '—' });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showBell, setShowBell] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState({ candidates: 0, employers: 0, verifications: 0 });
  const bellRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [ticker, setTicker] = useState(0);

  const handleUnauthorized = useCallback(() => {
    setError('Session expired. Logging out...');
    setTimeout(() => onLogout(), 1500);
  }, [onLogout]);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [overviewRes, growthRes, jobStatsRes, appStatsRes] = await Promise.allSettled([
        authFetch(API_ENDPOINTS.ADMIN_OVERVIEW, {}, handleUnauthorized),
        authFetch(API_ENDPOINTS.ADMIN_USER_GROWTH + '?days=30', {}, handleUnauthorized),
        authFetch(`${API_ENDPOINTS.BASE_URL}/admin/analytics/job-stats?days=30`, {}, handleUnauthorized),
        authFetch(`${API_ENDPOINTS.BASE_URL}/admin/analytics/application-stats?days=30`, {}, handleUnauthorized),
      ]);

      if (overviewRes.status === 'fulfilled') {
        const d = overviewRes.value;
        console.log('[Admin] overview data:', d);
        setStats({
          users:        d.users        ?? { total: 0, totalCandidates: 0, totalEmployers: 0, newToday: 0, newThisWeek: 0, newThisMonth: 0 },
          jobs:         d.jobs         ?? { total: 0, active: 0, pending: 0, newToday: 0, newThisWeek: 0, newThisMonth: 0 },
          applications: d.applications ?? { total: 0, newToday: 0, newThisWeek: 0, newThisMonth: 0 },
        });
      } else {
        console.error('[Admin] overview failed:', overviewRes.reason);
      }

      // Merge user growth + job stats + app stats by date
      const userGrowthData: any[] = growthRes.status === 'fulfilled' ? (growthRes.value ?? []) : [];
      const jobStatsData: any[] = jobStatsRes.status === 'fulfilled' ? (jobStatsRes.value ?? []) : [];
      const appStatsData: any[] = appStatsRes.status === 'fulfilled' ? (appStatsRes.value ?? []) : [];

      const merged = new Map<string, any>();
      userGrowthData.forEach(r => {
        const d = String(r.date).slice(0, 10);
        merged.set(d, { date: d, month: d.slice(5), candidates: r.candidates || 0, employers: r.employers || 0, jobs: 0, applications: 0 });
      });
      jobStatsData.forEach(r => {
        const d = String(r.date).slice(0, 10);
        const existing = merged.get(d) ?? { date: d, month: d.slice(5), candidates: 0, employers: 0, jobs: 0, applications: 0 };
        existing.jobs = (r.approved || 0) + (r.pending || 0);
        merged.set(d, existing);
      });
      appStatsData.forEach(r => {
        const d = String(r.date).slice(0, 10);
        const existing = merged.get(d) ?? { date: d, month: d.slice(5), candidates: 0, employers: 0, jobs: 0, applications: 0 };
        existing.applications = r.total || 0;
        merged.set(d, existing);
      });

      setGrowth(Array.from(merged.values()).sort((a, b) => a.date.localeCompare(b.date)));
      setLastUpdated(Date.now());

      // Quick stats from overview
      try {
        const qs = await authFetch(`${API_ENDPOINTS.BASE_URL}/admin/analytics/quick-stats`, {}, handleUnauthorized).catch(() => null);
        if (qs) setQuickStats(qs);
      } catch {}

      // Notifications
      try {
        const nRes = await authFetch(`${API_ENDPOINTS.BASE_URL}/admin/notifications?limit=5`, {}, handleUnauthorized).catch(() => null);
        if (nRes) setNotifications(nRes.notifications ?? nRes ?? []);
      } catch {}

      // Badge counts
      if (overviewRes.status === 'fulfilled') {
        const d = overviewRes.value;
        setBadgeCounts({
          candidates:    d.users?.totalCandidates ?? 0,
          employers:     d.users?.totalEmployers  ?? 0,
          verifications: d.jobs?.pending          ?? 0,
        });
      }
    } catch (e: any) {
      if (e.message !== 'UNAUTHORIZED') setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    loadOverview();
    const interval = setInterval(loadOverview, 30000);
    return () => clearInterval(interval);
  }, [loadOverview]);

  // Ticker for "Updated Xs ago" live update
  useEffect(() => {
    const t = setInterval(() => setTicker(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setShowBell(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    void ticker; // triggers re-render every second
    const diff = Math.floor((Date.now() - lastUpdated) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const statCards = stats ? [
    {
      label: 'Total Users', value: stats.users.total.toLocaleString(), icon: Users, color: 'bg-blue-600',
      breakdown: [
        { label: 'Candidates', val: stats.users.totalCandidates },
        { label: 'Employers',  val: stats.users.totalEmployers },
        { label: 'Today',      val: stats.users.newToday },
        { label: 'This Month', val: stats.users.newThisMonth },
      ]
    },
    {
      label: 'Total Jobs', value: stats.jobs.total.toLocaleString(), icon: Briefcase, color: 'bg-orange-500',
      breakdown: [
        { label: 'Active',   val: stats.jobs.active },
        { label: 'Pending',  val: stats.jobs.pending },
        { label: 'Today',    val: stats.jobs.newToday },
        { label: 'This Month', val: stats.jobs.newThisMonth },
      ]
    },
    {
      label: 'Applications', value: stats.applications.total.toLocaleString(), icon: FileText, color: 'bg-amber-500',
      breakdown: [
        { label: 'Today',      val: stats.applications.newToday },
        { label: 'This Week',  val: stats.applications.newThisWeek },
        { label: 'This Month', val: stats.applications.newThisMonth },
      ]
    },
  ] : [];

  const renderSection = () => {
    switch (activeNav) {
      case 'admins':        return <UsersSection role="admin" onUnauthorized={handleUnauthorized} />;
      case 'candidates':    return <UsersSection role="candidate" onUnauthorized={handleUnauthorized} />;
      case 'employers':     return <UsersSection role="employer" onUnauthorized={handleUnauthorized} />;
      case 'jobs':          return <JobsSection onUnauthorized={handleUnauthorized} />;
      case 'analytics':     return <AnalyticsSection growth={growth} stats={stats} />;
      case 'reports':       return <ReportsSection stats={stats} />;
      case 'verifications': return <VerificationsSection onUnauthorized={handleUnauthorized} />;
      case 'notifications': return <NotificationsSection onUnauthorized={handleUnauthorized} />;
      case 'email':         return <EmailControlSection onUnauthorized={handleUnauthorized} />;
      case 'logs':          return <ActivityLogsSection onUnauthorized={handleUnauthorized} />;
      case 'gdpr':          return <GdprDashboardSection onUnauthorized={handleUnauthorized} />;
      case 'settings':      return <AdminSettingsSection onUnauthorized={handleUnauthorized} />;
      default:              return <OverviewSection loading={loading} stats={stats} growth={growth} quickStats={quickStats} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-80 shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-2">Confirm Logout</h3>
            <p className="text-sm text-gray-400 mb-5">Are you sure you want to logout?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={() => { setShowLogoutConfirm(false); onLogout(); }}
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-gray-900 border-r border-orange-500/20 flex flex-col shrink-0`}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-orange-500/20">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-orange-500 rounded-lg flex items-center justify-center shrink-0">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          {sidebarOpen && <img src="/images/zyncjobs-logo.png" alt="ZyncJobs" className="h-10 object-contain" />}
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto admin-sidebar-scroll">
          {(() => {
            let lastSection = '';
            return navItems.map(({ id, label, icon: Icon, section }) => {
              const showDivider = sidebarOpen && section !== 'main' && section !== lastSection;
              lastSection = section;
              const badge = id === 'candidates' ? badgeCounts.candidates
                : id === 'employers' ? badgeCounts.employers
                : id === 'verifications' ? badgeCounts.verifications
                : id === 'notifications' ? notifications.length
                : 0;
              return (
                <React.Fragment key={id}>
                  {showDivider && (
                    <p className="px-3 pt-4 pb-1 text-xs font-semibold text-blue-400/70 uppercase tracking-wider">
                      {sectionLabels[section]}
                    </p>
                  )}
                  <button
                    onClick={() => setActiveNav(id)}
                    title={!sidebarOpen ? label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150
                      ${activeNav === id
                        ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-lg shadow-blue-900/40'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {sidebarOpen && (
                      <span className="flex-1 text-left">{label}</span>
                    )}
                    {sidebarOpen && badge > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
                        ${id === 'notifications' ? 'bg-red-500 text-white' : 'bg-blue-500/80 text-white'}`}>
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </button>
                </React.Fragment>
              );
            });
          })()}
        </nav>

        <div className="border-t border-orange-500/20 p-2">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-red-900/40 hover:text-red-400 transition-colors group"
          >
            <LogOut className="w-4 h-4 shrink-0 group-hover:text-red-400" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-gray-900 border-b border-orange-500/20 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(o => !o)} className="text-gray-400 hover:text-white">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-lg font-semibold capitalize">{activeNav}</h1>
            {lastUpdated && <span className="text-xs text-gray-500 ml-4">Updated {formatLastUpdated()}</span>}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadOverview} disabled={loading}
              className="text-gray-400 hover:text-white disabled:opacity-40 transition-colors" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Bell Dropdown */}
            <div className="relative" ref={bellRef}>
              <button onClick={() => setShowBell(o => !o)} className="relative text-gray-400 hover:text-white">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>
              {showBell && (
                <div className="absolute right-0 top-8 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-800 text-sm font-semibold text-gray-200">Notifications</div>
                  {notifications.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-6">No new notifications</p>
                  ) : notifications.slice(0, 5).map((n: any, i: number) => (
                    <div key={i} className="px-4 py-3 border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <p className="text-sm text-gray-200 truncate">{n.message || n.title || 'Notification'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Menu Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button onClick={() => setShowUserMenu(o => !o)} className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full flex items-center justify-center text-sm font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-gray-300 hidden sm:block">{user.name}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-10 w-44 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  <button onClick={() => { setShowUserMenu(false); setActiveNav('settings'); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 transition-colors">
                    <User className="w-4 h-4" />Profile
                  </button>
                  <button onClick={() => { setShowUserMenu(false); setActiveNav('settings'); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 transition-colors">
                    <Settings className="w-4 h-4" />Settings
                  </button>
                  <div className="border-t border-gray-800" />
                  <button onClick={() => { setShowUserMenu(false); onLogout(); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/30 transition-colors">
                    <LogOut className="w-4 h-4" />Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
          {renderSection()}
        </main>
      </div>
    </div>
  );
}

function OverviewSection({ loading, stats, growth, quickStats }: { loading: boolean; stats: OverviewStats | null; growth: GrowthPoint[]; quickStats: QuickStat }) {
  const cards = stats ? [
    {
      label: 'Total Users', value: stats.users.total.toLocaleString(), icon: Users, color: 'bg-blue-600',
      breakdown: [
        { label: 'Candidates', val: stats.users.totalCandidates },
        { label: 'Employers',  val: stats.users.totalEmployers },
        { label: 'Today',      val: stats.users.newToday },
        // Cap "This Month" to not exceed total
        { label: 'This Month', val: Math.min(stats.users.newThisMonth, stats.users.total) },
      ]
    },
    {
      label: 'Total Jobs', value: stats.jobs.total.toLocaleString(), icon: Briefcase, color: 'bg-orange-500',
      breakdown: [
        { label: 'Active',     val: stats.jobs.active },
        { label: 'Pending',    val: stats.jobs.pending },
        { label: 'Today',      val: stats.jobs.newToday },
        { label: 'This Month', val: Math.min(stats.jobs.newThisMonth, stats.jobs.total) },
      ]
    },
    {
      label: 'Applications', value: stats.applications.total.toLocaleString(), icon: FileText, color: 'bg-amber-500',
      breakdown: [
        { label: 'Today',      val: stats.applications.newToday },
        { label: 'This Week',  val: stats.applications.newThisWeek },
        { label: 'This Month', val: Math.min(stats.applications.newThisMonth, stats.applications.total) },
      ]
    },
  ] : [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.value} {p.dataKey.charAt(0).toUpperCase() + p.dataKey.slice(1)} on {label}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(loading || !stats)
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl p-5 border border-gray-800 animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-24 mb-3" />
                <div className="h-8 bg-gray-700 rounded w-20 mb-3" />
                <div className="grid grid-cols-2 gap-1">
                  {Array.from({ length: 4 }).map((_, j) => <div key={j} className="h-3 bg-gray-700 rounded" />)}
                </div>
              </div>
            ))
          : cards.map(({ label, value, icon: Icon, color, breakdown }) => (
              <div key={label} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">{label}</span>
                  <div className={`${color} w-9 h-9 rounded-lg flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold mb-3">{value}</p>
                <div className="grid grid-cols-2 gap-1">
                  {breakdown.map(({ label: bl, val }) => (
                    <div key={bl} className="flex justify-between text-xs">
                      <span className="text-gray-500">{bl}</span>
                      <span className="text-gray-300 font-medium">{val.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
        }
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-300 mb-1">Jobs & Applications Trend</h2>
          <p className="text-xs text-gray-500 mb-4">Blue = Jobs &nbsp;|&nbsp; Orange = Applications</p>
          {loading ? <div className="h-52 bg-gray-800 rounded-lg animate-pulse" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={growth}>
                <defs>
                  <linearGradient id="gJobs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tickFormatter={d => String(d).slice(5)} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Date', position: 'insideBottom', offset: -2, fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="jobs" stroke="#2563eb" fill="url(#gJobs)" strokeWidth={2} />
                <Area type="monotone" dataKey="applications" stroke="#f97316" fill="url(#gApps)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-300 mb-4">User Growth</h2>
            {loading ? <div className="h-36 bg-gray-800 rounded-lg animate-pulse" /> : (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={growth} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" tickFormatter={d => String(d).slice(5)} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="candidates" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="employers" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="border-t border-gray-800 pt-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Highlights</h3>
            {[
              { label: 'Top Job Role',     val: quickStats.topJobRole },
              { label: 'Top Company',      val: quickStats.topCompany },
              { label: 'Most Active User', val: quickStats.mostActiveUser },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{label}</span>
                <span className="text-xs font-medium text-gray-200 truncate max-w-[140px] text-right">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersSection({ role, onUnauthorized }: { role: 'admin' | 'candidate' | 'employer'; onUnauthorized: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const titleMap = { admin: 'Admins', candidate: 'Candidates', employer: 'Employers' };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`${API_ENDPOINTS.ADMIN_USERS}?role=${role}`, {}, onUnauthorized);
      setUsers(res.users ?? res.data ?? res ?? []);
    } catch (e: any) {
      if (e.message !== 'UNAUTHORIZED') setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized, role]);

  useEffect(() => { load(); }, [load]);

  const banUser = async (userId: string, isBanned: boolean) => {
    setActionLoading(userId);
    try {
      await authFetch(`${API_ENDPOINTS.ADMIN_USERS}/${userId}/ban`, {
        method: 'PUT',
        body: JSON.stringify({ ban: !isBanned }),
      }, onUnauthorized);
      setUsers(prev => prev.map(u => (u.id || u._id) === userId ? { ...u, isActive: isBanned } : u));
    } catch {
      setError('Failed to update user ban status.');
    } finally {
      setActionLoading(null);
    }
  };

  const changeRole = async (userId: string, newRole: string) => {
    setActionLoading(userId + newRole);
    try {
      await authFetch(`${API_ENDPOINTS.ADMIN_USERS}/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      }, onUnauthorized);
      setUsers(prev => prev.map(u => (u.id || u._id) === userId ? { ...u, role: newRole } : u));
    } catch {
      setError('Failed to update user role.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      {selectedUserId && (
        <UserDetailsModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} onAction={load} />
      )}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold">{titleMap[role]} Management</h2>
        <button onClick={load} disabled={loading} className="text-gray-400 hover:text-white disabled:opacity-40">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
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
              <th className="text-left px-6 py-3 font-medium">Name</th>
              <th className="text-left px-6 py-3 font-medium">Email</th>
              <th className="text-left px-6 py-3 font-medium">Role</th>
              <th className="text-left px-6 py-3 font-medium">Status</th>
              <th className="text-left px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-800 animate-pulse">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-3"><div className="h-4 bg-gray-700 rounded w-24" /></td>
                    ))}
                  </tr>
                ))
              : users.map(u => {
                  const role = u.role || u.userType || 'candidate';
                  const isBanned = u.banned || u.isBanned || false;
                  const id = u._id || u.id;
                  return (
                    <tr key={id} onClick={() => setSelectedUserId(id)} className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors cursor-pointer">
                      <td className="px-6 py-3 text-gray-200">{u.name || u.fullName || '—'}</td>
                      <td className="px-6 py-3 text-gray-400">{u.email}</td>
                      <td className="px-6 py-3">
                        {role === 'admin' || role === 'super_admin' ? (
                          <select
                            value={role}
                            disabled={!!actionLoading}
                            onChange={e => changeRole(id, e.target.value)}
                            className="bg-gray-800 border border-gray-700 text-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                            <option value="candidate">Candidate</option>
                            <option value="employer">Employer</option>
                          </select>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300 capitalize">{role}</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                          ${!u.isActive ? 'bg-red-900/40 text-red-400' : 'bg-emerald-900/40 text-emerald-400'}`}>
                          {!u.isActive ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-3" onClick={e => e.stopPropagation()}>
                        {role !== 'super_admin' && (
                          <button
                            onClick={() => banUser(id, !u.isActive)}
                            disabled={actionLoading === id}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50
                              ${!u.isActive
                                ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/60'
                                : 'bg-red-900/30 text-red-400 hover:bg-red-900/60'}`}
                          >
                            {!u.isActive ? <><Shield className="w-3 h-3" />Unban</> : <><ShieldOff className="w-3 h-3" />Ban</>}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
        {!loading && !users.length && (
          <p className="text-center text-gray-500 py-8 text-sm">No {titleMap[role].toLowerCase()} found.</p>
        )}
      </div>
    </div>
    </>
  );
}

function JobsSection({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [duplicates, setDuplicates] = useState<Set<string>>(new Set());

  const detectDuplicates = (jobList: any[]) => {
    const seen = new Map<string, string>();
    const dupeIds = new Set<string>();
    jobList.forEach(job => {
      const key = `${(job.title || job.jobTitle || '').toLowerCase().trim()}|${(job.company || '').toLowerCase().trim()}`;
      const id = job.id || job._id;
      if (seen.has(key)) {
        dupeIds.add(id);
        dupeIds.add(seen.get(key)!);
      } else {
        seen.set(key, id);
      }
    });
    setDuplicates(dupeIds);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`${API_ENDPOINTS.ADMIN_JOBS_PENDING}?status=${statusFilter}&limit=100`, {}, onUnauthorized);
      const list = res.jobs ?? res.data ?? res ?? [];
      setJobs(list);
      detectDuplicates(list);
    } catch (e: any) {
      if (e.message !== 'UNAUTHORIZED') setError('Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const updateJob = async (jobId: string, action: 'approve' | 'reject') => {
    setActionLoading(jobId + action);
    try {
      await authFetch(`${API_ENDPOINTS.BASE_URL}/admin/jobs/${jobId}/${action}`, { method: 'POST' }, onUnauthorized);
      setJobs(prev => prev.filter(j => (j.id || j._id) !== jobId));
    } catch {
      setError(`Failed to ${action} job.`);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteJob = async (jobId: string) => {
    const ok = await (window as any).confirmAsync('Delete this job posting permanently?');
    if (!ok) return;
    setActionLoading(jobId + 'delete');
    try {
      await authFetch(`${API_ENDPOINTS.JOBS}/${jobId}`, { method: 'DELETE' }, onUnauthorized);
      setJobs(prev => prev.filter(j => (j.id || j._id) !== jobId));
    } catch {
      setError('Failed to delete job.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Jobs</h2>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="flagged">Flagged</option>
          </select>
          {duplicates.size > 0 && (
            <span className="text-xs bg-amber-900/40 text-amber-400 px-2 py-0.5 rounded-full">
              {duplicates.size} duplicate{duplicates.size > 1 ? 's' : ''} detected
            </span>
          )}
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-800">
              <th className="text-left px-6 py-3 font-medium">Job Title</th>
              <th className="text-left px-6 py-3 font-medium">Company</th>
              <th className="text-left px-6 py-3 font-medium">Location</th>
              <th className="text-left px-6 py-3 font-medium">Posted</th>
              <th className="text-left px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-800 animate-pulse">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-3"><div className="h-4 bg-gray-700 rounded w-24" /></td>
                    ))}
                  </tr>
                ))
              : jobs.map(job => {
                  const id = job.id || job._id;
                  const posted = job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '—';
                  const isDupe = duplicates.has(id);
                  return (
                    <tr key={id} className={`border-b border-gray-800 hover:bg-gray-800/40 transition-colors ${isDupe ? 'bg-amber-950/20' : ''}`}>
                      <td className="px-6 py-3 text-gray-200 font-medium">
                        <div className="flex items-center gap-2">
                          {job.title || job.jobTitle || '—'}
                          {isDupe && <span className="text-xs bg-amber-900/40 text-amber-400 px-1.5 py-0.5 rounded">Duplicate</span>}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-gray-400">{job.company || job.companyName || '—'}</td>
                      <td className="px-6 py-3 text-gray-400">{job.location || '—'}</td>
                      <td className="px-6 py-3 text-gray-500">{posted}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          {statusFilter === 'pending' && (
                            <>
                              <button onClick={() => updateJob(id, 'approve')} disabled={!!actionLoading}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/60 transition-colors disabled:opacity-50">
                                <CheckCircle className="w-3 h-3" />Approve
                              </button>
                              <button onClick={() => updateJob(id, 'reject')} disabled={!!actionLoading}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-900/30 text-red-400 hover:bg-red-900/60 transition-colors disabled:opacity-50">
                                <XCircle className="w-3 h-3" />Reject
                              </button>
                            </>
                          )}
                          <button onClick={() => deleteJob(id)} disabled={actionLoading === id + 'delete'}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-400 hover:bg-red-900/40 hover:text-red-400 transition-colors disabled:opacity-50">
                            <XCircle className="w-3 h-3" />Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
        {!loading && !jobs.length && (
          <p className="text-center text-gray-500 py-8 text-sm">No {statusFilter} jobs.</p>
        )}
      </div>
    </div>
  );
}

function AnalyticsSection({ growth, stats }: { growth: GrowthPoint[]; stats: OverviewStats | null }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">User Growth (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={growth} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="candidates" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="employers" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Platform Overview</h2>
          {stats ? (
            <div className="space-y-3">
              {[
                { label: 'Total Candidates', val: stats.users.totalCandidates, color: 'bg-blue-600' },
                { label: 'Total Employers',  val: stats.users.totalEmployers,  color: 'bg-orange-500' },
                { label: 'Active Jobs',      val: stats.jobs.active,           color: 'bg-cyan-500' },
                { label: 'Pending Jobs',     val: stats.jobs.pending,          color: 'bg-amber-500' },
                { label: 'Total Applications', val: stats.applications.total,  color: 'bg-rose-500' },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${color}`} />
                    <span className="text-sm text-gray-400">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-200">{val.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500 text-sm">Loading...</p>}
        </div>
      </div>
    </div>
  );
}

function GdprDashboardSection({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [stats, setStats] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        authFetch(`${API_ENDPOINTS.ADMIN_USERS}/gdpr/stats`, {}, onUnauthorized),
        authFetch(`${API_ENDPOINTS.ADMIN_USERS}/gdpr/records?limit=50${filter !== 'all' ? `&status=${filter}` : ''}`, {}, onUnauthorized),
      ]);
      setStats(s);
      setRecords(r.records ?? []);
    } catch (e: any) {
      if (e.message !== 'UNAUTHORIZED') {}
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized, filter]);

  useEffect(() => { load(); }, [load]);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active:   'bg-emerald-900/40 text-emerald-400',
      reminded: 'bg-amber-900/40 text-amber-400',
      deleted:  'bg-red-900/40 text-red-400',
    };
    return map[status] || 'bg-gray-800 text-gray-400';
  };

  const statCards = stats ? [
    { label: 'Total Consent Records', val: stats.total,         color: 'bg-blue-600' },
    { label: 'Consent Given',         val: stats.consentGiven,  color: 'bg-emerald-600' },
    { label: '6-Month Inactive',      val: stats.inactive6m,    color: 'bg-amber-500' },
    { label: 'Reminders Sent',        val: stats.reminded,      color: 'bg-orange-500' },
    { label: 'Resumes Auto-Deleted',  val: stats.deleted,       color: 'bg-red-600' },
    { label: 'Deleted (Last 30d)',    val: stats.recentDeleted, color: 'bg-rose-700' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800 animate-pulse">
                <div className="h-3 bg-gray-700 rounded w-20 mb-2" />
                <div className="h-7 bg-gray-700 rounded w-12" />
              </div>
            ))
          : statCards.map(({ label, val, color }) => (
              <div key={label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-xs text-gray-500 mb-1 leading-tight">{label}</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-xl font-bold text-white">{val ?? 0}</span>
                </div>
              </div>
            ))
        }
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold">Consent Records</h2>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-1.5 text-xs focus:outline-none"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="reminded">Reminded</option>
              <option value="deleted">Deleted</option>
            </select>
            <button onClick={load} disabled={loading} className="text-gray-400 hover:text-white disabled:opacity-40">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="text-left px-6 py-3 font-medium">User</th>
                <th className="text-left px-6 py-3 font-medium">Consent Date</th>
                <th className="text-left px-6 py-3 font-medium">Last Active</th>
                <th className="text-left px-6 py-3 font-medium">Reminder Sent</th>
                <th className="text-left px-6 py-3 font-medium">Resume Status</th>
                <th className="text-left px-6 py-3 font-medium">AI Allowed</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-800 animate-pulse">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-3"><div className="h-4 bg-gray-700 rounded w-24" /></td>
                      ))}
                    </tr>
                  ))
                : records.map((r: any) => (
                    <tr key={r.id} className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
                      <td className="px-6 py-3">
                        <p className="text-gray-200 text-xs font-medium">{r.userName}</p>
                        <p className="text-gray-500 text-xs">{r.userEmail}</p>
                      </td>
                      <td className="px-6 py-3 text-gray-400 text-xs">
                        {r.consentDate ? new Date(r.consentDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-3 text-gray-400 text-xs">
                        {r.lastActiveAt ? new Date(r.lastActiveAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-3 text-gray-400 text-xs">
                        {r.reminderSentAt ? new Date(r.reminderSentAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge(r.resumeStatus)}`}>
                          {r.resumeStatus}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`text-xs font-medium ${r.allowAIRecommendations ? 'text-emerald-400' : 'text-red-400'}`}>
                          {r.allowAIRecommendations ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
          {!loading && !records.length && (
            <p className="text-center text-gray-500 py-8 text-sm">No GDPR records found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportsSection({ stats }: { stats: OverviewStats | null }) {
  const rows = stats ? [
    { metric: 'Total Users',        today: stats.users.newToday,        week: stats.users.newThisWeek,        month: stats.users.newThisMonth,        total: stats.users.total },
    { metric: 'Jobs Posted',        today: stats.jobs.newToday,         week: stats.jobs.newThisWeek,         month: stats.jobs.newThisMonth,         total: stats.jobs.total },
    { metric: 'Applications',       today: stats.applications.newToday, week: stats.applications.newThisWeek, month: stats.applications.newThisMonth, total: stats.applications.total },
    { metric: 'Active Jobs',        today: '-', week: '-', month: '-',  total: stats.jobs.active },
    { metric: 'Pending Moderation', today: '-', week: '-', month: '-',  total: stats.jobs.pending },
  ] : [];

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold">Platform Reports</h2>
        <p className="text-xs text-gray-500 mt-0.5">Summary of key metrics across time periods</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-800">
              <th className="text-left px-6 py-3 font-medium">Metric</th>
              <th className="text-right px-6 py-3 font-medium">Today</th>
              <th className="text-right px-6 py-3 font-medium">This Week</th>
              <th className="text-right px-6 py-3 font-medium">This Month</th>
              <th className="text-right px-6 py-3 font-medium">All Time</th>
            </tr>
          </thead>
          <tbody>
            {!stats ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-800 animate-pulse">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-6 py-3"><div className="h-4 bg-gray-700 rounded w-16 ml-auto" /></td>
                  ))}
                </tr>
              ))
            ) : rows.map(({ metric, today, week, month, total }) => (
              <tr key={metric} className="border-b border-gray-800 hover:bg-gray-800/40">
                <td className="px-6 py-3 text-gray-200 font-medium">{metric}</td>
                <td className="px-6 py-3 text-right text-gray-300">{typeof today === 'number' ? today.toLocaleString() : today}</td>
                <td className="px-6 py-3 text-right text-gray-300">{typeof week === 'number' ? week.toLocaleString() : week}</td>
                <td className="px-6 py-3 text-right text-gray-300">{typeof month === 'number' ? month.toLocaleString() : month}</td>
                <td className="px-6 py-3 text-right text-blue-400 font-semibold">{typeof total === 'number' ? total.toLocaleString() : total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


