import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, Loader2, AlertCircle, Trash2, Plus,
  FileText, ChevronDown, Download
} from 'lucide-react';
import { API_ENDPOINTS } from '../../../config/env';
import { apiFetch } from '../../../api/apiFetch';
import {
  enqueueTrackerResumeUpload,
  subscribeToTrackerUploads,
} from '../../../services/submissionTrackerUploadService';

export interface TrackerNavigationFilters {
  recruiter: string | null;
  status?: string;
  from?: string;
  to?: string;
  today?: string;
}

interface Props {
  initialFilters?: TrackerNavigationFilters | null;
  onClearNavigationFilters?: () => void;
  onUnauthorized: () => void;
  recruiterName?: string;
}

interface TrackerRow {
  id: string;
  sno: number;
  date: string;
  clientName: string;
  skillRole: string;
  candidateName: string;
  phone: string;
  email: string;
  recruiterName: string;
  status: string;
  resumeFile?: string;
  talentCandidateId?: string;
  source: string;
  submittedDate: string;
  interviewDate: string;
  subId: string;
}

const STATUSES = ['', 'Submitted', 'Feedback', 'Shortlisted', 'Rejected', 'Duplicate', 'Screening', 'Not Relevant'];

const SOURCES = ['', 'LinkedIn', 'Naukri', 'Indeed', 'Monster', 'Shine', 'TimesJobs', 'ZipRecruiter', 'Glassdoor', 'Foundit', 'Hirist', 'Internshala', 'Referral', 'Internal DB', 'Walk-in', 'Other'];

const SEARCH_COLUMNS = [
  ['subId', 'Submission ID'], ['date', 'Date'], ['clientName', 'Client/HR'],
  ['skillRole', 'Skill / Role'], ['candidateName', 'Candidate Name'], ['phone', 'Contact'],
  ['email', 'Email ID'], ['recruiterName', 'Recruiter'], ['source', 'Source'],
  ['submittedDate', 'Submitted Date'], ['interviewDate', 'Interview Date'], ['status', 'Status'],
] as const;
type SearchColumn = typeof SEARCH_COLUMNS[number][0];
type DateColumn = 'date' | 'submittedDate' | 'interviewDate';
const DATE_COLUMNS: { key: DateColumn; label: string }[] = [
  { key: 'date', label: 'Date' }, { key: 'submittedDate', label: 'Submitted Date' },
  { key: 'interviewDate', label: 'Interview Date' },
];
const filterInputCls = 'bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500';

const STATUS_COLORS: Record<string, string> = {
  Submitted:     'bg-blue-900/40 text-blue-300 border-blue-700/50',
  Feedback:      'bg-orange-900/40 text-orange-300 border-orange-700/50',
  Shortlisted:   'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  Rejected:      'bg-red-900/40 text-red-300 border-red-700/50',
  Duplicate:     'bg-yellow-900/40 text-yellow-300 border-yellow-700/50',
  Screening:     'bg-purple-900/40 text-purple-300 border-purple-700/50',
  'Not Relevant':'bg-gray-800 text-gray-400 border-gray-700',
};

const SOURCE_COLORS: Record<string, string> = {
  LinkedIn:     'bg-blue-900/40 text-blue-300 border-blue-700/50',
  Naukri:       'bg-orange-900/40 text-orange-300 border-orange-700/50',
  Indeed:       'bg-purple-900/40 text-purple-300 border-purple-700/50',
  Monster:      'bg-violet-900/40 text-violet-300 border-violet-700/50',
  Shine:        'bg-cyan-900/40 text-cyan-300 border-cyan-700/50',
  TimesJobs:    'bg-red-900/40 text-red-300 border-red-700/50',
  ZipRecruiter: 'bg-green-900/40 text-green-300 border-green-700/50',
  Glassdoor:    'bg-teal-900/40 text-teal-300 border-teal-700/50',
  Foundit:      'bg-pink-900/40 text-pink-300 border-pink-700/50',
  Hirist:       'bg-indigo-900/40 text-indigo-300 border-indigo-700/50',
  Internshala:  'bg-lime-900/40 text-lime-300 border-lime-700/50',
  Referral:     'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  'Internal DB':'bg-gray-800 text-gray-300 border-gray-700',
  'Walk-in':    'bg-yellow-900/40 text-yellow-300 border-yellow-700/50',
  Other:        'bg-gray-800 text-gray-400 border-gray-700',
};

const inputCls = 'bg-transparent text-gray-200 text-xs w-full outline-none placeholder-gray-600 px-1 py-0.5';
const cellCls = 'px-2 py-1.5 border-r border-gray-800 last:border-r-0';

// Display yyyy-mm-dd as dd-mm-yyyy in the date input
function toDisplay(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}-${m}-${y}` : iso;
}
// Parse dd-mm-yyyy back to yyyy-mm-dd for storage
function toISO(display: string) {
  if (!display) return '';
  const [d, m, y] = display.split('-');
  return d && m && y ? `${y}-${m}-${d}` : display;
}

export default function SubmissionTrackerSection({ onUnauthorized, recruiterName = '', initialFilters, onClearNavigationFilters }: Props) {
  const [rows, setRows] = useState<TrackerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState('');
  const [fromDate, setFromDate] = useState(toDisplay(initialFilters?.from || ''));
  const [toDate, setToDate] = useState(toDisplay(initialFilters?.to || ''));
  const [dateRangeError, setDateRangeError] = useState('');
  const [appliedDateRange, setAppliedDateRange] = useState<{ from: string; to: string; column: DateColumn }>({ from: initialFilters?.from || '', to: initialFilters?.to || '', column: 'date' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchColumn, setSearchColumn] = useState<SearchColumn | 'all'>('all');
  const [dateColumn, setDateColumn] = useState<DateColumn>('date');
  const [statusFilter, setStatusFilter] = useState(initialFilters?.status || '');
  const [recruiterExact, setRecruiterExact] = useState<string | null | undefined>(initialFilters ? initialFilters.recruiter : undefined);
  const [todayExact, setTodayExact] = useState(initialFilters?.today || '');
  const [sourceFilter, setSourceFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSaves = useRef(new Map<string, { timer: ReturnType<typeof setTimeout>; row: TrackerRow }>());

  const loadRows = useCallback(async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.TRACKER_ROWS);
      if (res.status === 401) { onUnauthorized(); return; }
      if (res.ok) setRows(await res.json());
    } catch {
      setError('Failed to load tracker data.');
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => { void loadRows(); }, [loadRows]);

  useEffect(() => subscribeToTrackerUploads(status => {
    setUploading(status.active);
    if (status.error) setError(status.error);
    if (!status.active && status.total > 0) void loadRows();
  }), [loadRows]);

  const saveRow = useCallback(async (row: TrackerRow) => {
    try {
      const response = await apiFetch(`${API_ENDPOINTS.TRACKER_ROWS}/${row.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(row),
      });
      if (response.status === 401) { onUnauthorized(); return; }
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error || 'Failed to save submission.');
        await loadRows();
      }
    } catch { setError('Failed to save submission. Please retry your edit.'); }
  }, [onUnauthorized, loadRows]);

  useEffect(() => {
    const refresh = () => { void loadRows(); };
    window.addEventListener('zync:tracker-updated', refresh);
    return () => window.removeEventListener('zync:tracker-updated', refresh);
  }, [loadRows]);

  useEffect(() => {
    const pending = pendingSaves.current;
    return () => {
      pending.forEach(({ timer, row }) => { clearTimeout(timer); void saveRow(row); });
      pending.clear();
    };
  }, [saveRow]);

  const updateRow = (id: string, field: keyof TrackerRow, value: string) => {
    setRows(prev => {
      const updated = prev.map(row => row.id === id ? { ...row, [field]: value } : row);
      const row = updated.find(item => item.id === id)!;
      const pending = pendingSaves.current.get(id);
      if (pending) clearTimeout(pending.timer);
      const timer = setTimeout(() => { pendingSaves.current.delete(id); void saveRow(row); }, 600);
      pendingSaves.current.set(id, { timer, row });
      return updated;
    });
  };

  const addBlankRow = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const newRow = {
      date: today,
      clientName: '',
      skillRole: '',
      candidateName: '',
      phone: '',
      email: '',
      recruiterName,
      status: '',
      resumeFile: '',
      source: '',
      submittedDate: today,
      interviewDate: '',
      subId: '',
    };
    try {
      const res = await apiFetch(API_ENDPOINTS.TRACKER_ROWS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRow),
      });
      if (res.status === 401) { onUnauthorized(); return; }
      if (res.ok) {
        const created: TrackerRow = await res.json();
        setRows(prev => [...prev, created]);
      }
    } catch {
      setError('Failed to add row.');
    }
  };

  const deleteRow = async (id: string) => {
    try {
      const res = await apiFetch(`${API_ENDPOINTS.TRACKER_ROWS}/${id}`, { method: 'DELETE' });
      if (res.status === 401) { onUnauthorized(); return; }
      if (res.ok) {
        const pending = pendingSaves.current.get(id);
        if (pending) clearTimeout(pending.timer);
        pendingSaves.current.delete(id);
        setRows(prev => prev.filter(r => r.id !== id).map((r, i) => ({ ...r, sno: i + 1 })));
      }
    } catch {
      setError('Failed to delete row.');
    }
  };

  const downloadStoredResume = async (row: TrackerRow) => {
    try {
      const response = await apiFetch(`${API_ENDPOINTS.TRACKER_ROWS}/${row.id}/resume`);
      if (response.status === 401) { onUnauthorized(); return; }
      if (!response.ok) throw new Error('Unable to download the original resume.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = (row.resumeFile || '').split('/').pop()?.split('?')[0] || `${row.candidateName}-resume`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to download resume.'); }
  };

  const handleResumeUpload = useCallback(async (files: FileList) => {
    if (!files.length) return;
    setError(null);
    enqueueTrackerResumeUpload(Array.from(files), recruiterName, onUnauthorized);
  }, [recruiterName, onUnauthorized]);

  const exportCSV = () => {
    const headers = ['SNO', 'Sub ID', 'Date', 'Client/HR', 'Skill/Role', 'Candidate Name', 'Contact Number', 'Email ID', 'Recruiter Name', 'Source', 'Submitted Date', 'Interview Date', 'Status'];
    const csvRows = filtered.map(r =>
      [r.sno, r.subId, r.date, r.clientName, r.skillRole, r.candidateName, r.phone, r.email, r.recruiterName, r.source, r.submittedDate, r.interviewDate, r.status]
        .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submission_tracker_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const availableStatuses = [...new Set([...STATUSES, ...rows.map(row => row.status).filter(Boolean)])];
  const availableSources = [...new Set([...SOURCES, ...rows.map(row => row.source).filter(Boolean)])];
  const hasFilters = Boolean(recruiterExact !== undefined || todayExact || searchQuery.trim() || clientFilter.trim() || fromDate.trim() || toDate.trim() || appliedDateRange.from || appliedDateRange.to || statusFilter || sourceFilter);
  const terms = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = rows.filter(row => {
    const columns: readonly SearchColumn[] = searchColumn === 'all' ? SEARCH_COLUMNS.map(([key]) => key) : [searchColumn];
    const values = columns.flatMap(key => {
      const value = String(row[key] ?? '').toLowerCase();
      if (DATE_COLUMNS.some(column => column.key === key)) return [value, toDisplay(value), toDisplay(value).replaceAll('-', '/')];
      return [value];
    });
    const matchesSearch = terms.every(term => values.some(value => value.includes(term)) || (
      (searchColumn === 'all' || searchColumn === 'phone') && /^[+()\d.-]+$/.test(term) && term.replace(/\D/g, '').length >= 3 &&
      String(row.phone || '').replace(/\D/g, '').includes(term.replace(/\D/g, ''))
    ));
    return matchesSearch &&
      (recruiterExact === undefined || row.recruiterName === recruiterExact) &&
      (!todayExact || row.date === todayExact) &&
      (!clientFilter.trim() || String(row.clientName || '').toLowerCase().includes(clientFilter.trim().toLowerCase())) &&
      ((!appliedDateRange.from && !appliedDateRange.to) || (
        Boolean(row[appliedDateRange.column]) &&
        (!appliedDateRange.from || row[appliedDateRange.column] >= appliedDateRange.from) &&
        (!appliedDateRange.to || row[appliedDateRange.column] <= appliedDateRange.to)
      )) &&
      (!statusFilter || row.status === statusFilter) &&
      (!sourceFilter || row.source === sourceFilter);
  });
  const applyDateRange = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parseDate = (value: string) => {
      if (!value.trim()) return '';
      if (!/^\d{2}-\d{2}-\d{4}$/.test(value.trim())) return null;
      const iso = toISO(value.trim());
      const parsed = new Date(`${iso}T00:00:00Z`);
      return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === iso ? iso : null;
    };
    const from = parseDate(fromDate), to = parseDate(toDate);
    if (from === null || to === null) { setDateRangeError('Enter valid dates in dd-mm-yyyy format.'); return; }
    if (from && to && from > to) { setDateRangeError('From Date must be on or before To Date.'); return; }
    setDateRangeError('');
    setAppliedDateRange({ from, to, column: dateColumn });
  };
  const textColumnWidth = (key: keyof TrackerRow, minimum: number) => Math.max(minimum, ...filtered.map(row => String(row[key] ?? '').length * 9 + 48));
  const columnWidths = [
    56, textColumnWidth('subId', 210), 140, textColumnWidth('clientName', 220),
    textColumnWidth('skillRole', 300), textColumnWidth('candidateName', 280),
    textColumnWidth('phone', 200), textColumnWidth('email', 340), textColumnWidth('recruiterName', 200),
    180, 160, 160, 180, 56,
  ];
  const clearFilters = () => {
    setRecruiterExact(undefined); setTodayExact(''); onClearNavigationFilters?.();
    setSearchQuery(''); setSearchColumn('all'); setClientFilter(''); setFromDate(''); setToDate(''); setDateRangeError('');
    setAppliedDateRange({ from: '', to: '', column: 'date' });
    setDateColumn('date'); setStatusFilter(''); setSourceFilter('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" /> Submission Tracker
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Track daily candidate submissions to clients</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportCSV} disabled={!filtered.length}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-gray-700 text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors">
            <Download size={13} /> Export CSV
          </button>
          <button onClick={addBlankRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-gray-700 text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors">
            <Plus size={13} /> Add Row
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors">
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            Upload Resumes
          </button>
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" multiple className="hidden"
            onChange={e => e.target.files && handleResumeUpload(e.target.files)} />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-sm text-red-300">
          <AlertCircle size={14} className="shrink-0" /> {error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-900/30 border border-emerald-700/50 rounded-lg text-sm text-emerald-300">
          ✓ {successMsg}
        </div>
      )}

      {recruiterExact !== undefined && <div className="flex flex-wrap items-center gap-3 rounded-lg border border-blue-800 bg-blue-950/30 p-3 text-sm text-blue-200"><span>Recruiter: {recruiterExact?.trim() || '_'}{todayExact ? ` | Today: ${toDisplay(todayExact)}` : ''}</span><button type="button" onClick={clearFilters} className="text-xs underline">Clear analytics filters</button></div>}

      {/* All column search plus combinable exact filters */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-3" role="search" aria-label="Search Submission Tracker">
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="text-xs text-gray-400 sm:w-44">Search in
            <select value={searchColumn} onChange={event => setSearchColumn(event.target.value as SearchColumn | 'all')} className={`${filterInputCls} w-full mt-1`}>
              <option value="all">All columns</option>
              {SEARCH_COLUMNS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-400 flex-1">Search submissions
            <input type="search" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search ID, candidate, contact, email, recruiter, skill?" className={`${filterInputCls} w-full mt-1`} />
          </label>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-gray-400">Client/HR
            <input value={clientFilter} onChange={event => setClientFilter(event.target.value)} placeholder="All clients" className={`${filterInputCls} block mt-1 w-44`} />
          </label>
          <form onSubmit={applyDateRange} className="flex flex-wrap items-end gap-3" aria-label="Filter by date range" noValidate>
            <label className="text-xs text-gray-400">Date field
              <select value={dateColumn} onChange={event => setDateColumn(event.target.value as DateColumn)} className={`${filterInputCls} block mt-1`}>
                {DATE_COLUMNS.map(column => <option key={column.key} value={column.key}>{column.label}</option>)}
              </select>
            </label>
            <label className="text-xs text-gray-400">From Date
              <input type="text" inputMode="numeric" placeholder="dd-mm-yyyy" maxLength={10} value={fromDate} onChange={event => { setFromDate(event.target.value); setDateRangeError(''); }} aria-invalid={Boolean(dateRangeError)} aria-describedby={dateRangeError ? 'tracker-date-range-error' : undefined} className={`${filterInputCls} block mt-1 w-36`} />
            </label>
            <label className="text-xs text-gray-400">To Date
              <input type="text" inputMode="numeric" placeholder="dd-mm-yyyy" maxLength={10} value={toDate} onChange={event => { setToDate(event.target.value); setDateRangeError(''); }} aria-invalid={Boolean(dateRangeError)} aria-describedby={dateRangeError ? 'tracker-date-range-error' : undefined} className={`${filterInputCls} block mt-1 w-36`} />
            </label>
            <button type="submit" className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-2">Apply Filter</button>
          </form>
          <label className="text-xs text-gray-400">Status
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className={`${filterInputCls} block mt-1`}>
              {availableStatuses.map(status => <option key={status} value={status}>{status || 'All statuses'}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-400">Source
            <select value={sourceFilter} onChange={event => setSourceFilter(event.target.value)} className={`${filterInputCls} block mt-1`}>
              {availableSources.map(source => <option key={source} value={source}>{source || 'All sources'}</option>)}
            </select>
          </label>
          {hasFilters && <button type="button" onClick={clearFilters} className={`${filterInputCls} hover:text-white`}>Clear filters</button>}
          <span role="status" className="text-xs text-gray-400 pb-2">{filtered.length} of {rows.length} submissions</span>
        </div>
      </div>

      {dateRangeError && <p id="tracker-date-range-error" role="alert" className="text-sm text-red-300">{dateRangeError}</p>}
      {(appliedDateRange.from || appliedDateRange.to) && <p className="text-xs text-gray-400">Applied {DATE_COLUMNS.find(column => column.key === appliedDateRange.column)?.label} range: {appliedDateRange.from ? toDisplay(appliedDateRange.from) : 'Any start date'} to {appliedDateRange.to ? toDisplay(appliedDateRange.to) : 'Any end date'} (inclusive)</p>}

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="tracker-table-scroll" role="region" aria-label="Submission records. Scroll horizontally to view all columns." tabIndex={0}>
          <table className="tracker-readable-table text-xs" style={{ width: columnWidths.reduce((sum, width) => sum + width, 0), tableLayout: 'fixed' }}>
            <colgroup>{columnWidths.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/60">
                {['SNO', 'Sub ID', 'Date', 'Client/HR', 'Skill / Role', 'Candidate Name', 'Contact', 'Email ID', 'Recruiter', 'Source', 'Submitted Date', 'Interview Date', 'Status', ''].map(h => (
                  <th key={h} className="px-2 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide border-r border-gray-800 last:border-r-0 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={14} className="text-center py-12 text-gray-500">
                    <Loader2 className="w-6 h-6 mx-auto animate-spin text-gray-600" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={14} className="text-center py-12 text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                    <p>{rows.length ? 'No submissions match your search or filters.' : 'No entries yet. Upload resumes or add a row manually.'}</p>
                    {hasFilters && <button type="button" onClick={clearFilters} className="mt-3 text-blue-400 hover:text-blue-300">Clear filters</button>}
                  </td>
                </tr>
              ) : filtered.map(row => (
                <tr key={row.id} className="hover:bg-gray-800/30 transition-colors group">
                  <td className={`${cellCls} w-10 text-gray-500 text-center`}>{row.sno}</td>
                  <td className={`${cellCls} min-w-[110px]`}>
                    <span className="text-[11px] text-blue-400 font-mono px-1">{row.subId || '—'}</span>
                  </td>
                  <td className={`${cellCls} w-28`}>
                    <input
                      type="text"
                      value={toDisplay(row.date)}
                      onChange={e => updateRow(row.id, 'date', toISO(e.target.value))}
                      placeholder="dd-mm-yyyy"
                      maxLength={10}
                      className={inputCls}
                    />
                  </td>
                  <td className={`${cellCls} min-w-[110px]`}>
                    <input title={row.clientName || ''} aria-label={`Edit clientName for ${row.candidateName || 'candidate'}`} value={row.clientName} onChange={e => updateRow(row.id, 'clientName', e.target.value)}
                      placeholder="Client name" className={inputCls} />
                  </td>
                  <td className={`${cellCls} min-w-[120px]`}>
                    <input title={row.skillRole || ''} aria-label={`Edit skillRole for ${row.candidateName || 'candidate'}`} value={row.skillRole} onChange={e => updateRow(row.id, 'skillRole', e.target.value)}
                      placeholder="Role / Skill" className={inputCls} />
                  </td>
                  <td className={`${cellCls} min-w-[130px]`}>
                    <input title={row.candidateName || ''} aria-label={`Edit candidateName for ${row.candidateName || 'candidate'}`} value={row.candidateName} onChange={e => updateRow(row.id, 'candidateName', e.target.value)}
                      placeholder="Full name" className={inputCls} />
                    {row.talentCandidateId && <button type="button" onClick={() => void downloadStoredResume(row)} className="text-[11px] text-blue-400 hover:text-blue-300">Download original resume</button>}
                    {row.resumeFile && (
                      <p className="text-[10px] text-gray-600 break-all whitespace-normal" title={row.resumeFile}>
                        📄 {row.resumeFile}
                      </p>
                    )}
                  </td>
                  <td className={`${cellCls} min-w-[110px]`}>
                    <input title={row.phone || ''} aria-label={`Edit phone for ${row.candidateName || 'candidate'}`} value={row.phone} onChange={e => updateRow(row.id, 'phone', e.target.value)}
                      placeholder="Phone" className={inputCls} />
                  </td>
                  <td className={`${cellCls} min-w-[150px]`}>
                    <input title={row.email || ''} aria-label={`Edit email for ${row.candidateName || 'candidate'}`} value={row.email} onChange={e => updateRow(row.id, 'email', e.target.value)}
                      placeholder="Email" className={inputCls} />
                  </td>
                  <td className={`${cellCls} min-w-[100px]`}>
                    <span className="text-gray-300" title="Automatically set when created; cannot be edited">{row.recruiterName?.trim() && row.recruiterName.trim() !== '?' ? row.recruiterName : '_'}</span>
                  </td>
                  <td className={`${cellCls} w-32`}>
                    <div className="relative">
                      <select
                        value={row.source || ''}
                        onChange={e => updateRow(row.id, 'source', e.target.value)}
                        className={`w-full text-xs rounded-md border px-2 py-1 pr-6 appearance-none outline-none cursor-pointer bg-gray-900 transition-colors ${
                          row.source ? SOURCE_COLORS[row.source] || 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-800 text-gray-500 border-gray-700'
                        }`}
                      >
                        {SOURCES.map(s => (
                          <option key={s} value={s} className="bg-gray-900 text-gray-200">{s || '— Source —'}</option>
                        ))}
                      </select>
                      <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </td>
                  <td className={`${cellCls} w-28`}>
                    <span className="text-gray-300 whitespace-nowrap" title="Automatically set when created; cannot be edited">{row.submittedDate?.trim() && row.submittedDate.trim() !== '?' ? toDisplay(row.submittedDate) : '_'}</span>
                  </td>
                  <td className={`${cellCls} w-28`}>
                    <input
                      type="text"
                      value={toDisplay(row.interviewDate || '')}
                      onChange={e => updateRow(row.id, 'interviewDate', toISO(e.target.value))}
                      placeholder="dd-mm-yyyy"
                      maxLength={10}
                      className={inputCls}
                    />
                  </td>
                  <td className={`${cellCls} w-36`}>
                    <div className="relative">
                      <select
                        value={row.status}
                        onChange={e => updateRow(row.id, 'status', e.target.value)}
                        className={`w-full text-xs rounded-md border px-2 py-1 pr-6 appearance-none outline-none cursor-pointer bg-gray-900 transition-colors ${
                          row.status ? STATUS_COLORS[row.status] || 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-800 text-gray-500 border-gray-700'
                        }`}
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s} className="bg-gray-900 text-gray-200">{s || '— Select —'}</option>
                        ))}
                      </select>
                      <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </td>
                  <td className={`${cellCls} w-8`}>
                    <button onClick={() => deleteRow(row.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-0.5 rounded">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
