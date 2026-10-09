import { useState, useEffect, useCallback } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import {
  TrendingUp, RefreshCw, Users, CheckCircle2, XCircle,
  FileText, Target, Layers, ArrowUpRight, ArrowDownRight, Minus,
  Award, Activity, BarChart2, PieChart as PieIcon, Download, X, Calendar,
} from 'lucide-react';
import { API_ENDPOINTS } from '../../../config/env';
import { apiFetch } from '../../../api/apiFetch';

import type { TrackerNavigationFilters } from './SubmissionTrackerSection';

interface Props { onUnauthorized: () => void; userRole?: string; onOpenTracker?: (filters: TrackerNavigationFilters) => void; }

interface Analytics {
  totals: {
    total: string; shortlisted: string; submitted: string;
    rejected: string; feedback: string; duplicate: string;
    screening: string; not_relevant: string;
    unique_candidates: string; recruiters: string;
  };
  statusBreakdown: { status: string; count: string }[];
  recruiterStats: { name: string; total: string; shortlisted: string; submitted: string; rejected: string; feedback: string; duplicate: string; screening: string; not_relevant: string; today_count: string }[];
  dailyTrend: { date: string; count: string }[];
}

interface DrillRow {
  sub_id: string; candidate_name: string; job_role: string;
  company: string; status: string; date: string; source: string;
}

type DateRange = 'all' | 'week' | 'month' | 'custom';

const STATUS_COLORS: Record<string, string> = {
  Submitted: '#3b82f6', Shortlisted: '#10b981', Rejected: '#ef4444',
  Feedback: '#f97316', Duplicate: '#eab308', Screening: '#8b5cf6', 'Not Relevant': '#6b7280',
};

function getDateRange(range: DateRange, customFrom: string, customTo: string): { from: string; to: string } | null {
  const today = new Date().toISOString().slice(0, 10);
  if (range === 'week') {
    const d = new Date(); d.setDate(d.getDate() - 6);
    return { from: d.toISOString().slice(0, 10), to: today };
  }
  if (range === 'month') {
    const d = new Date(); d.setDate(d.getDate() - 29);
    return { from: d.toISOString().slice(0, 10), to: today };
  }
  if (range === 'custom' && customFrom && customTo) return { from: customFrom, to: customTo };
  return null;
}

function exportCSV(rows: DrillRow[], recruiterName: string) {
  const headers = ['Sub ID', 'Candidate', 'Job Role', 'Company', 'Status', 'Date', 'Source'];
  const lines = [headers.join(','), ...rows.map(r =>
    [r.sub_id, r.candidate_name, r.job_role, r.company, r.status, r.date, r.source]
      .map(v => `"${(v || '').replace(/"/g, '""')}"`)
      .join(',')
  )];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${recruiterName.replace(/\s+/g, '_')}_submissions.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportAnalyticsCSV(data: Analytics, range: DateRange) {
  const label = range === 'week' ? 'This_Week' : range === 'month' ? 'This_Month' : range === 'custom' ? 'Custom' : 'All_Time';
  const lines = [
    '"Metric","Value"',
    `"Total Submissions","${data.totals.total}"`,
    `"Shortlisted","${data.totals.shortlisted}"`,
    `"Submitted","${data.totals.submitted}"`,
    `"Rejected","${data.totals.rejected}"`,
    `"Unique Candidates","${data.totals.unique_candidates}"`,
    '',
    '"Recruiter","Total","Submitted","Shortlisted","Rejected","Today"',
    ...data.recruiterStats.map(r =>
      `"${r.name}","${r.total}","${r.submitted}","${r.shortlisted}","${r.rejected}","${r.today_count}"`
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tracker_analytics_${label}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-950 border border-gray-700/60 rounded-xl px-4 py-3 shadow-2xl text-xs">
      <p className="text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-300">{p.name}:</span>
          <span className="text-white font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

function KpiCard({ label, value, icon: Icon, gradient, trend }: {
  label: string; value: string | number;
  icon: any; gradient: string; trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="relative bg-gray-900 border border-gray-800 rounded-xl p-4 overflow-hidden group hover:border-gray-700 transition-all duration-200">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${gradient}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
            trend === 'up' ? 'bg-emerald-900/40 text-emerald-400' :
            trend === 'down' ? 'bg-red-900/40 text-red-400' :
            'bg-gray-800 text-gray-400'
          }`}>
            {trend === 'up' ? <ArrowUpRight size={10} /> : trend === 'down' ? <ArrowDownRight size={10} /> : <Minus size={10} />}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white tracking-tight leading-none mb-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-xs text-gray-400 leading-tight">{label}</p>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
        <Icon className="w-4 h-4 text-blue-400" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function DrillDownModal({ recruiterName, dateParams, onClose }: {
  recruiterName: string;
  dateParams: { from: string; to: string } | null;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<DrillRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (dateParams?.from) params.set('from', dateParams.from);
    if (dateParams?.to) params.set('to', dateParams.to);
    const url = `${API_ENDPOINTS.TRACKER_RECRUITER_ANALYTICS}/${encodeURIComponent(recruiterName)}?${params}`;
    apiFetch(url).then(r => r.json()).then(d => setRows(Array.isArray(d) ? d : [])).catch(() => setRows([])).finally(() => setLoading(false));
  }, [recruiterName, dateParams]);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              <span className="text-white text-sm font-bold">{recruiterName[0]?.toUpperCase()}</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{recruiterName}</h3>
              <p className="text-xs text-gray-500">{rows.length} submissions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportCSV(rows, recruiterName)}
              disabled={loading || rows.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors disabled:opacity-40"
            >
              <Download size={12} /> Export CSV
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-6 h-6 text-gray-600 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <FileText className="w-10 h-10 text-gray-700" />
              <p className="text-gray-500 text-sm">No submissions found</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-900">
                <tr className="border-b border-gray-800">
                  {['Sub ID', 'Candidate', 'Job Role', 'Company', 'Status', 'Date', 'Source'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-800/40 transition-colors">
                    <td className="py-3 px-4 text-blue-400 font-mono">{r.sub_id || '—'}</td>
                    <td className="py-3 px-4 text-white font-medium">{r.candidate_name || '—'}</td>
                    <td className="py-3 px-4 text-gray-300">{r.job_role || '—'}</td>
                    <td className="py-3 px-4 text-gray-400">{r.company || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{ backgroundColor: `${STATUS_COLORS[r.status] || '#6b7280'}20`, color: STATUS_COLORS[r.status] || '#9ca3af' }}>
                        {r.status || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400">{r.date || '—'}</td>
                    <td className="py-3 px-4 text-gray-500">{r.source || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrackerAnalyticsSection({ onUnauthorized, userRole, onOpenTracker }: Props) {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [drillRecruiter, setDrillRecruiter] = useState<string | null>(null);

  const load = useCallback(async (range: DateRange = dateRange, cf = customFrom, ct = customTo) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      const dates = getDateRange(range, cf, ct);
      if (dates?.from) params.set('from', dates.from);
      if (dates?.to) params.set('to', dates.to);
      const url = `${API_ENDPOINTS.TRACKER_ANALYTICS}?${params}`;
      const res = await apiFetch(url);
      if (res.status === 401) { onUnauthorized(); return; }
      if (res.status === 403) throw new Error('ACCESS_DENIED');
      if (!res.ok) throw new Error('Failed to load analytics');
      setData(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [onUnauthorized, dateRange, customFrom, customTo]);

  useEffect(() => { void load(); }, [load]);

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const dateParams = getDateRange(dateRange, customFrom, customTo);

  if (loading) return (
    <div className="space-y-5 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => <div key={i} className="bg-gray-900 rounded-2xl h-24 border border-gray-800" />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-gray-900 rounded-2xl h-72 border border-gray-800" />)}
      </div>
    </div>
  );

  if (error === 'ACCESS_DENIED') return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-14 h-14 bg-red-900/30 rounded-2xl flex items-center justify-center">
        <XCircle className="w-7 h-7 text-red-400" />
      </div>
      <p className="text-white font-semibold text-base">Access Denied</p>
      <p className="text-gray-400 text-sm">You don't have permission to view analytics.</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-14 h-14 bg-red-900/30 rounded-2xl flex items-center justify-center">
        <XCircle className="w-7 h-7 text-red-400" />
      </div>
      <p className="text-gray-400 text-sm">{error}</p>
      <button onClick={() => load()} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-xl transition-colors">
        <RefreshCw size={13} /> Retry
      </button>
    </div>
  );

  if (!data) return null;

  const { totals, statusBreakdown, recruiterStats, dailyTrend } = data;
  const total = Number(totals.total || 0);
  const shortlisted = Number(totals.shortlisted || 0);
  const submitted = Number(totals.submitted || 0);
  const rejected = Number(totals.rejected || 0);
  const feedback = Number(totals.feedback || 0);
  const duplicate = Number(totals.duplicate || 0);
  const screening = Number(totals.screening || 0);
  const notRelevant = Number(totals.not_relevant || 0);
  const conversionRate = total > 0 ? ((shortlisted / total) * 100).toFixed(1) : '0';

  const kpis = [
    { label: 'Total Submissions', value: total, icon: Layers, gradient: 'bg-gradient-to-br from-blue-600 to-blue-700', trend: 'up' as const },
    { label: 'Shortlisted', value: shortlisted, icon: CheckCircle2, gradient: 'bg-gradient-to-br from-emerald-600 to-emerald-700', trend: 'up' as const },
    { label: 'Submitted', value: submitted, icon: TrendingUp, gradient: 'bg-gradient-to-br from-indigo-600 to-indigo-700', trend: 'neutral' as const },
    { label: 'Feedback', value: feedback, icon: Activity, gradient: 'bg-gradient-to-br from-orange-500 to-orange-600', trend: 'neutral' as const },
    { label: 'Screening', value: screening, icon: FileText, gradient: 'bg-gradient-to-br from-purple-600 to-purple-700', trend: 'neutral' as const },
    { label: 'Duplicate', value: duplicate, icon: Layers, gradient: 'bg-gradient-to-br from-yellow-500 to-yellow-600', trend: 'neutral' as const },
    { label: 'Not Relevant', value: notRelevant, icon: Minus, gradient: 'bg-gradient-to-br from-gray-600 to-gray-700', trend: 'neutral' as const },
    { label: 'Rejected', value: rejected, icon: XCircle, gradient: 'bg-gradient-to-br from-red-600 to-red-700', trend: 'down' as const },
    { label: 'Unique Candidates', value: Number(totals.unique_candidates || 0), icon: Users, gradient: 'bg-gradient-to-br from-purple-600 to-purple-700', trend: 'up' as const },
    { label: 'Conversion Rate', value: `${conversionRate}%`, icon: Target, gradient: 'bg-gradient-to-br from-orange-500 to-orange-600', trend: Number(conversionRate) > 20 ? 'up' as const : 'neutral' as const },
  ];

  const pieData = statusBreakdown.filter(s => s.status && Number(s.count) > 0)
    .map(s => ({ name: s.status, value: Number(s.count) }));

  const trendData = dailyTrend.map(d => ({ date: d.date?.slice(5) || '', count: Number(d.count) }));

  const RANGE_BTNS: { id: DateRange; label: string }[] = [
    { id: 'all', label: 'All Time' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="space-y-6">
      {drillRecruiter && (
        <DrillDownModal
          recruiterName={drillRecruiter}
          dateParams={dateParams}
          onClose={() => setDrillRecruiter(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Tracker Analytics</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {isAdmin ? 'Full team performance & submission insights' : 'Your personal submission performance'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Range Filter */}
          <div className="flex items-center bg-gray-800 border border-gray-700 rounded-xl p-1 gap-1">
            {RANGE_BTNS.map(btn => (
              <button key={btn.id}
                onClick={() => { setDateRange(btn.id); if (btn.id !== 'custom') load(btn.id); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  dateRange === btn.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}>
                {btn.id === 'custom' && <Calendar size={11} />}
                {btn.label}
              </button>
            ))}
          </div>
          {/* Custom date inputs */}
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1.5" />
              <span className="text-gray-500 text-xs">to</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1.5" />
              <button onClick={() => load('custom', customFrom, customTo)}
                disabled={!customFrom || !customTo}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors disabled:opacity-40">
                Apply
              </button>
            </div>
          )}
          {/* Export CSV */}
          <button onClick={() => exportAnalyticsCSV(data, dateRange)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs font-medium rounded-xl transition-colors">
            <Download size={13} /> Export CSV
          </button>
          <button onClick={() => load()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs font-medium rounded-xl transition-colors">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {kpis.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Row 1: Trend + Status Pie */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <SectionHeader icon={Activity} title="Daily Submission Trend" subtitle="Activity over selected period" />
          {trendData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <BarChart2 className="w-10 h-10 text-gray-700" />
              <p className="text-gray-500 text-sm">No trend data available yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="Submissions" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gBlue)" dot={false} activeDot={{ r: 5, fill: '#3b82f6', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <SectionHeader icon={PieIcon} title="Status Breakdown" />
          {pieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <PieIcon className="w-10 h-10 text-gray-700" />
              <p className="text-gray-500 text-sm">No status data yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {pieData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[pieData[i].name] || '#6b7280'} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#030712', border: '1px solid #374151', borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {pieData.map(entry => (
                  <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[entry.name] || '#6b7280' }} />
                      <span className="text-xs text-gray-400 truncate max-w-[90px]">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-800 rounded-full h-1">
                        <div className="h-1 rounded-full" style={{ width: `${total > 0 ? (entry.value / total) * 100 : 0}%`, backgroundColor: STATUS_COLORS[entry.name] || '#6b7280' }} />
                      </div>
                      <span className="text-xs font-semibold text-white w-6 text-right">{entry.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Recruiter table — admin only */}
      {isAdmin && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <SectionHeader icon={Award} title="Recruiter Performance" subtitle="Click a row to see submissions" />
          {recruiterStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Users className="w-10 h-10 text-gray-700" />
              <p className="text-gray-500 text-sm">No recruiter data yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-2.5 px-2 text-gray-500 font-medium w-8">#</th>
                    <th className="text-left py-2.5 px-2 text-gray-500 font-medium">Recruiter</th>
                    <th className="text-center py-2.5 px-2 text-gray-500 font-medium">Total</th>
                    <th className="text-center py-2.5 px-2 text-gray-500 font-medium">Submitted</th>
                    <th className="text-center py-2.5 px-2 text-gray-500 font-medium">Shortlisted</th>
                    <th className="text-center py-2.5 px-2 text-gray-500 font-medium">Feedback</th>
                    <th className="text-center py-2.5 px-2 text-gray-500 font-medium">Screening</th>
                    <th className="text-center py-2.5 px-2 text-gray-500 font-medium">Duplicate</th>
                    <th className="text-center py-2.5 px-2 text-gray-500 font-medium">Not Relevant</th>
                    <th className="text-center py-2.5 px-2 text-gray-500 font-medium">Rejected</th>
                    <th className="text-center py-2.5 px-2 text-gray-500 font-medium">Today</th>
                    <th className="text-left py-2.5 px-2 text-gray-500 font-medium">Conversion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {recruiterStats.map((r, i) => {
                    const recruiterName = r.name?.trim();
                    const displayName = recruiterName && recruiterName !== '?' ? recruiterName : '_';
                    const rate = Number(r.total) > 0 ? Math.round((Number(r.shortlisted) / Number(r.total)) * 100) : 0;
                    const rankCls = i === 0 ? 'text-yellow-400 bg-yellow-900/30' : i === 1 ? 'text-gray-300 bg-gray-700/50' : i === 2 ? 'text-orange-400 bg-orange-900/30' : 'text-gray-500 bg-gray-800/50';
                    return (
                      <tr key={i} onClick={() => setDrillRecruiter(r.name)}
                        className="hover:bg-gray-800/40 transition-colors cursor-pointer group">
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-bold ${rankCls}`}>{i + 1}</span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shrink-0">
                              <span className="text-white text-[11px] font-bold">{displayName[0].toUpperCase()}</span>
                            </div>
                            <span className="text-white font-medium truncate max-w-[90px] group-hover:text-blue-400 transition-colors">{displayName}</span>
                          </div>
                        </td>
                        {([
                          { key: 'total', label: 'Total', status: undefined, color: 'text-blue-400' },
                          { key: 'submitted', label: 'Submitted', status: 'Submitted', color: 'text-indigo-400' },
                          { key: 'shortlisted', label: 'Shortlisted', status: 'Shortlisted', color: 'text-emerald-400' },
                          { key: 'feedback', label: 'Feedback', status: 'Feedback', color: 'text-orange-400' },
                          { key: 'screening', label: 'Screening', status: 'Screening', color: 'text-purple-400' },
                          { key: 'duplicate', label: 'Duplicate', status: 'Duplicate', color: 'text-yellow-400' },
                          { key: 'not_relevant', label: 'Not Relevant', status: 'Not Relevant', color: 'text-gray-400' },
                          { key: 'rejected', label: 'Rejected', status: 'Rejected', color: 'text-red-400' },
                          { key: 'today_count', label: 'Today', status: undefined, color: 'text-blue-400' },
                        ] as const).map(column => <td key={column.key} className="py-3 px-2 text-center">
                          <button type="button" className={`${column.color} font-semibold rounded px-2 py-1 hover:bg-gray-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400`} aria-label={`View ${column.label} submissions for ${displayName}`} onClick={event => {
                            event.stopPropagation();
                            const dates = getDateRange(dateRange, customFrom, customTo);
                            onOpenTracker?.({ recruiter: r.name ?? null, status: column.status, from: dates?.from, to: dates?.to, today: column.key === 'today_count' ? new Date().toISOString().slice(0, 10) : undefined });
                          }}>{r[column.key] || 0}</button>
                        </td>)}
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-800 rounded-full h-1.5 min-w-[40px]">
                              <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${Math.min(rate, 100)}%` }} />
                            </div>
                            <span className="text-gray-300 font-semibold w-8 text-right shrink-0">{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
