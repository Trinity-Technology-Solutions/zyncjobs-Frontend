import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, Loader2, AlertCircle, Trash2, Plus,
  FileText, ChevronDown, RefreshCw, Download
} from 'lucide-react';
import { API_ENDPOINTS } from '../../../config/env';
import { apiFetch } from '../../../api/apiFetch';
import {
  enqueueTrackerResumeUpload,
  subscribeToTrackerUploads,
} from '../../../services/submissionTrackerUploadService';

interface Props {
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
}

const STATUSES = ['', 'Submitted', 'Feedback', 'Shortlisted', 'Rejected', 'Duplicate', 'Screening', 'Not Relevant'];

const STATUS_COLORS: Record<string, string> = {
  Submitted:     'bg-blue-900/40 text-blue-300 border-blue-700/50',
  Feedback:      'bg-orange-900/40 text-orange-300 border-orange-700/50',
  Shortlisted:   'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  Rejected:      'bg-red-900/40 text-red-300 border-red-700/50',
  Duplicate:     'bg-yellow-900/40 text-yellow-300 border-yellow-700/50',
  Screening:     'bg-purple-900/40 text-purple-300 border-purple-700/50',
  'Not Relevant':'bg-gray-800 text-gray-400 border-gray-700',
};

const inputCls = 'bg-transparent text-gray-200 text-xs w-full outline-none placeholder-gray-600 px-1 py-0.5';
const cellCls = 'px-2 py-1.5 border-r border-gray-800 last:border-r-0';

export default function SubmissionTrackerSection({ onUnauthorized, recruiterName = '' }: Props) {
  const [rows, setRows] = useState<TrackerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Debounced save row to backend
  const saveRow = useCallback((row: TrackerRow) => {
    apiFetch(`${API_ENDPOINTS.TRACKER_ROWS}/${row.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
    }).then(res => { if (res.status === 401) onUnauthorized(); });
  }, [onUnauthorized]);

  const updateRow = (id: string, field: keyof TrackerRow, value: string) => {
    setRows(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, [field]: value } : r);
      const row = updated.find(r => r.id === id)!;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveRow(row), 600);
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
        setRows(prev => prev.filter(r => r.id !== id).map((r, i) => ({ ...r, sno: i + 1 })));
      }
    } catch {
      setError('Failed to delete row.');
    }
  };

  const handleResumeUpload = useCallback(async (files: FileList) => {
    if (!files.length) return;
    setError(null);
    enqueueTrackerResumeUpload(Array.from(files), recruiterName, onUnauthorized);
  }, [recruiterName, onUnauthorized]);

  const exportCSV = () => {
    const headers = ['SNO', 'Date', 'Client/HR', 'Skill/Role', 'Candidate Name', 'Contact Number', 'Email ID', 'Recruiter Name', 'Status'];
    const csvRows = filtered.map(r =>
      [r.sno, r.date, r.clientName, r.skillRole, r.candidateName, r.phone, r.email, r.recruiterName, r.status]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
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

  const filtered = rows.filter(r => {
    const matchClient = !clientFilter || r.clientName.toLowerCase().includes(clientFilter.toLowerCase());
    const matchDate = !dateFilter || r.date === dateFilter;
    return matchClient && matchDate;
  });

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
          <button onClick={exportCSV} disabled={!rows.length}
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input value={clientFilter} onChange={e => setClientFilter(e.target.value)}
          placeholder="Filter by client..."
          className="bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500 w-44" />
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500" />
        {(clientFilter || dateFilter) && (
          <button onClick={() => { setClientFilter(''); setDateFilter(''); }}
            className="text-xs text-gray-400 hover:text-white px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg transition-colors">
            <RefreshCw size={12} />
          </button>
        )}
        <span className="text-xs text-gray-500 self-center">{filtered.length} rows</span>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/60">
                {['SNO', 'Date', 'Client/HR', 'Skill / Role', 'Candidate Name', 'Contact', 'Email ID', 'Recruiter', 'Status', ''].map(h => (
                  <th key={h} className="px-2 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide border-r border-gray-800 last:border-r-0 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-500">
                    <Loader2 className="w-6 h-6 mx-auto animate-spin text-gray-600" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                    <p>No entries yet. Upload resumes or add a row manually.</p>
                  </td>
                </tr>
              ) : filtered.map(row => (
                <tr key={row.id} className="hover:bg-gray-800/30 transition-colors group">
                  <td className={`${cellCls} w-10 text-gray-500 text-center`}>{row.sno}</td>
                  <td className={`${cellCls} w-28`}>
                    <input type="date" value={row.date} onChange={e => updateRow(row.id, 'date', e.target.value)}
                      className={inputCls} />
                  </td>
                  <td className={`${cellCls} min-w-[110px]`}>
                    <input value={row.clientName} onChange={e => updateRow(row.id, 'clientName', e.target.value)}
                      placeholder="Client name" className={inputCls} />
                  </td>
                  <td className={`${cellCls} min-w-[120px]`}>
                    <input value={row.skillRole} onChange={e => updateRow(row.id, 'skillRole', e.target.value)}
                      placeholder="Role / Skill" className={inputCls} />
                  </td>
                  <td className={`${cellCls} min-w-[130px]`}>
                    <input value={row.candidateName} onChange={e => updateRow(row.id, 'candidateName', e.target.value)}
                      placeholder="Full name" className={inputCls} />
                    {row.resumeFile && (
                      <p className="text-[10px] text-gray-600 truncate max-w-[120px]" title={row.resumeFile}>
                        📄 {row.resumeFile}
                      </p>
                    )}
                  </td>
                  <td className={`${cellCls} min-w-[110px]`}>
                    <input value={row.phone} onChange={e => updateRow(row.id, 'phone', e.target.value)}
                      placeholder="Phone" className={inputCls} />
                  </td>
                  <td className={`${cellCls} min-w-[150px]`}>
                    <input value={row.email} onChange={e => updateRow(row.id, 'email', e.target.value)}
                      placeholder="Email" className={inputCls} />
                  </td>
                  <td className={`${cellCls} min-w-[100px]`}>
                    <input value={row.recruiterName} onChange={e => updateRow(row.id, 'recruiterName', e.target.value)}
                      placeholder="Recruiter" className={inputCls} />
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
