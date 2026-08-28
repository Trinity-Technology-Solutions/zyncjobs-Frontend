import { useState, useEffect, useCallback } from 'react';
import {
  Search, Download, X, ChevronLeft, ChevronRight, Building2,
  FileText, User, AlertCircle, Loader2, Check, CheckSquare, Square,
  Send, Building, FileSpreadsheet, Eye, Trash2, RotateCcw,
  Zap, Brain, ArrowRight, ArrowLeft, Minus
} from 'lucide-react';
import { API_ENDPOINTS } from '../../../config/env';
import { apiFetch } from '../../../api/apiFetch';

interface Props {
  onUnauthorized: () => void;
}

interface SubmissionBatch {
  batchId: string;
  clientName: string;
  jobTitle: string;
  candidateCount: number;
  status: string;
  submittedAt: string;
  shortlistedCount: number;
  rejectedCount: number;
}

interface CandidateSubmission {
  candidateId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  jobTitle: string;
  skills: string[];
  experience: string | number;
  status: string;
  submittedAt: string;
  shortlistedAt: string | null;
  rejectedAt: string | null;
}

interface BatchDetail {
  batch: {
    batchId: string;
    clientName: string;
    jobTitle: string;
    candidateCount: number;
    status: string;
    submittedAt: string;
    notes: string;
  };
  candidates: CandidateSubmission[];
}

const inputCls = "w-full bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none";
const btnPrimary = "flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const btnSecondary = "flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm font-medium rounded-lg transition-colors";
const card = "bg-gray-900 border border-gray-800 rounded-xl";

export default function SubmissionsSection({ onUnauthorized }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [batches, setBatches] = useState<SubmissionBatch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedBatch, setSelectedBatch] = useState<BatchDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Smart Import
  const [smartImportOpen, setSmartImportOpen] = useState(false);
  const [smartImportBatchId, setSmartImportBatchId] = useState('');
  const [smartImportFile, setSmartImportFile] = useState<File | null>(null);
  const [smartImportLoading, setSmartImportLoading] = useState(false);
  const [smartImportMatches, setSmartImportMatches] = useState<any[]>([]);
  const [smartImportConfirming, setSmartImportConfirming] = useState(false);

  const limit = 20;

  const fetchBatches = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (search.trim()) params.set('clientName', search.trim());
    if (statusFilter) params.set('status', statusFilter);
    params.set('page', String(targetPage));
    params.set('limit', String(limit));
    try {
      const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/submissions?${params.toString()}`, { headers: {} });
      if (res.status === 401) { onUnauthorized(); return; }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to fetch submissions');
        return;
      }
      const data = await res.json();
      setBatches(data.batches);
      setTotal(data.total);
      setPage(data.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, onUnauthorized]);

  useEffect(() => { fetchBatches(1); }, [fetchBatches]);

  const handleViewBatch = async (batchId: string) => {
    setDetailLoading(true);
    try {
      const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/submissions/${batchId}`, { headers: {} });
      if (res.status === 401) { onUnauthorized(); return; }
      if (!res.ok) throw new Error('Batch not found');
      const data = await res.json();
      setSelectedBatch(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load batch');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => setSelectedBatch(null);

  const handleExportBatch = async (batchId: string) => {
    setExporting(true);
    try {
      const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/submissions/generate-csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId })
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `submission_${batchId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleImportShortlist = async (batchId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/submissions/import-shortlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csvText: text })
        });
        if (!res.ok) throw new Error('Import failed');
        const data = await res.json();
        alert(`Shortlist imported: ${data.shortlisted} shortlisted, ${data.rejected} rejected, ${data.notFound} not found`);
        if (selectedBatch?.batch.batchId === batchId) {
          handleViewBatch(batchId);
        }
        fetchBatches(page);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Import failed');
      }
    };
    input.click();
  };

  // Smart Import handlers
  const handleOpenSmartImport = (batchId: string) => {
    setSmartImportBatchId(batchId);
    setSmartImportFile(null);
    setSmartImportMatches([]);
    setSmartImportOpen(true);
  };

  const handleSmartImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSmartImportFile(file);
  };

  const handleAnalyzeSmartImport = async () => {
    if (!smartImportFile) { setError('Select a CSV file'); return; }
    setSmartImportLoading(true);
    setError(null);
    try {
      const text = await smartImportFile.text();
      const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/submissions/smart-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: smartImportBatchId, csvText: text })
      });
      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setSmartImportMatches(data.matches);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setSmartImportLoading(false);
    }
  };

  const handleConfirmSmartImport = async () => {
    const toConfirm = smartImportMatches.filter(m => m.action === 'confirm');
    if (!toConfirm.length) { setError('No matches selected for confirm'); return; }
    
    setSmartImportConfirming(true);
    try {
      const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/submissions/confirm-smart-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: smartImportBatchId, matches: toConfirm })
      });
      if (!res.ok) throw new Error('Confirm failed');
      const data = await res.json();
      alert(`Smart import confirmed: ${data.shortlisted} shortlisted, ${data.rejected} rejected`);
      setSmartImportOpen(false);
      setSmartImportMatches([]);
      if (selectedBatch?.batch.batchId === smartImportBatchId) {
        handleViewBatch(smartImportBatchId);
      }
      fetchBatches(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Confirm failed');
    } finally {
      setSmartImportConfirming(false);
    }
  };

  const toggleMatchAction = (index: number) => {
    setSmartImportMatches(prev => prev.map((m, i) => 
      i === index ? { ...m, action: m.action === 'confirm' ? 'review' : 'confirm' } : m
    ));
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 95) return 'text-emerald-400';
    if (conf >= 85) return 'text-blue-400';
    if (conf >= 70) return 'text-amber-400';
    return 'text-red-400';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shortlisted': return 'text-emerald-400 bg-emerald-900/30 border-emerald-700/50';
      case 'rejected': return 'text-red-400 bg-red-900/30 border-red-700/50';
      case 'submitted': return 'text-blue-400 bg-blue-900/30 border-blue-700/50';
      default: return 'text-gray-400 bg-gray-800 border-gray-700';
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Submissions
          </h2>
          <p className="text-sm text-gray-400 mt-1">Track candidate submissions to clients</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-sm text-red-300">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Filters */}
      <div className={`${card} p-4 space-y-3`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') fetchBatches(1); }}
              placeholder="Search client name..."
              className={`${inputCls} pl-9`}
            />
          </div>
          <div className="w-48">
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`${inputCls} appearance-none`}>
              <option value="">All</option>
              <option value="Submitted">Submitted</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <button onClick={() => fetchBatches(1)} disabled={loading} className={btnPrimary}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search size={16} />} Search
          </button>
        </div>
      </div>

      {/* Batches List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-16 text-gray-500 border border-dashed border-gray-800 rounded-xl">
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 text-gray-600" />
          <p>No submissions found. Create one from Recruiter Search.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map(b => (
            <div key={b.batchId} className={`${card} p-4 hover:border-gray-700 transition-colors`}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{b.clientName}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${getStatusColor(b.status)}`}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-sm text-blue-400 mt-0.5">{b.jobTitle || 'No job title'}</p>
                  <div className="flex flex-wrap gap-4 mt-1 text-xs text-gray-400">
                    <span><FileSpreadsheet size={11} className="inline mr-1" /> {b.candidateCount} candidates</span>
                    <span><Check size={11} className="inline mr-1 text-emerald-400" /> {b.shortlistedCount} shortlisted</span>
                    <span><X size={11} className="inline mr-1 text-red-400" /> {b.rejectedCount} rejected</span>
                    <span><Building size={11} className="inline mr-1" /> {new Date(b.submittedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleViewBatch(b.batchId)} className="px-3 py-1.5 bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs font-medium rounded-lg hover:bg-blue-900/60">
                    <Eye size={13} className="mr-1" /> View
                  </button>
                  <button onClick={() => handleExportBatch(b.batchId)} disabled={exporting} className="px-3 py-1.5 bg-gray-800 border border-gray-700 text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50">
                    <Download size={13} className="mr-1" /> CSV
                  </button>
                  <button onClick={() => handleImportShortlist(b.batchId)} className="px-3 py-1.5 bg-emerald-900/40 border border-emerald-700/50 text-emerald-300 text-xs font-medium rounded-lg hover:bg-emerald-900/60">
                    <RotateCcw size={13} className="mr-1" /> Import
                  </button>
                  <button onClick={() => handleOpenSmartImport(b.batchId)} className="px-3 py-1.5 bg-purple-900/40 border border-purple-700/50 text-purple-300 text-xs font-medium rounded-lg hover:bg-purple-900/60">
                    <Brain size={13} className="mr-1" /> Smart
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button onClick={() => fetchBatches(page - 1)} disabled={page <= 1}
                className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
              <button onClick={() => fetchBatches(page + 1)} disabled={page >= totalPages}
                className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Batch Detail Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={handleCloseDetail}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
              <div className="min-w-0">
                <h3 className="font-semibold text-white">{selectedBatch.batch.clientName}</h3>
                <p className="text-sm text-blue-400">{selectedBatch.batch.jobTitle || 'No job title'}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-400">
                  <span><FileSpreadsheet size={11} className="inline mr-1" /> Batch: {selectedBatch.batch.batchId}</span>
                  <span><User size={11} className="inline mr-1" /> {selectedBatch.batch.candidateCount} candidates</span>
                  <span><Check size={11} className="inline mr-1 text-emerald-400" /> {selectedBatch.batch.shortlistedCount} shortlisted</span>
                  <span><X size={11} className="inline mr-1 text-red-400" /> {selectedBatch.batch.rejectedCount} rejected</span>
                </div>
              </div>
              <button onClick={handleCloseDetail} className="text-gray-400 hover:text-white shrink-0"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto p-5 space-y-3 max-h-[60vh]">
              {detailLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading candidates...
                </div>
              ) : selectedBatch.candidates.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No candidates in this batch</p>
              ) : (
                <div className="space-y-2">
                  {selectedBatch.candidates.map(c => (
                    <div key={c.candidateId} className={`${card} p-3`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-white truncate">{c.name || 'Unnamed'}</h4>
                            <span className={`px-2 py-0.5 text-xs rounded-full border ${getStatusColor(c.status)}`}>
                              {c.status}
                            </span>
                          </div>
                          <p className="text-sm text-blue-400 mt-0.5">{c.jobTitle || 'No title'}</p>
                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><Mail size={11} /> {c.email}</span>
                            <span className="flex items-center gap-1"><Phone size={11} /> {c.phone}</span>
                            <span className="flex items-center gap-1"><Building size={11} /> {c.location}</span>
                          </div>
                          {c.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {c.skills.slice(0, 5).map(s => (
                                <span key={s} className="px-1.5 py-0.5 bg-gray-800 text-gray-300 text-xs rounded">{s}</span>
                              ))}
                              {c.skills.length > 5 && <span className="px-1.5 py-0.5 text-xs text-gray-500">+{c.skills.length - 5}</span>}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {c.shortlistedAt && (
                            <span className="text-xs text-emerald-400 flex items-center gap-1">
                              <Check size={11} /> {new Date(c.shortlistedAt).toLocaleDateString()}
                            </span>
                          )}
                          {c.rejectedAt && (
                            <span className="text-xs text-red-400 flex items-center gap-1">
                              <X size={11} /> {new Date(c.rejectedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Smart Import Modal */}
      {smartImportOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => { setSmartImportOpen(false); setSmartImportMatches([]); setSmartImportFile(null); }}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
              <h3 className="font-semibold text-white flex items-center gap-2"><Brain size={18} className="text-purple-400" /> Smart Import Shortlist</h3>
              <button onClick={() => { setSmartImportOpen(false); setSmartImportMatches([]); setSmartImportFile(null); }} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              {smartImportMatches.length === 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                    <label className="block text-xs text-gray-400 mb-2">Upload Client Shortlist CSV</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleSmartImportFileChange}
                      className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                    <p className="text-xs text-gray-500 mt-2">CSV should have columns: Name, Email, Phone, Status (and optionally Client ID)</p>
                  </div>
                  <button onClick={handleAnalyzeSmartImport} disabled={!smartImportFile || smartImportLoading}
                    className="w-full px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {smartImportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain size={15} />} Analyze & Match
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">{smartImportMatches.length} rows analyzed</span>
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-0.5 bg-emerald-900/30 text-emerald-400 rounded">
                        {smartImportMatches.filter(m => m.action === 'auto').length} Auto
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-amber-900/30 text-amber-400 rounded">
                        {smartImportMatches.filter(m => m.action === 'review').length} Review
                      </span>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {smartImportMatches.map((m, i) => (
                      <div key={i} className={`${card} p-3 ${m.action === 'confirm' ? 'border-emerald-600/50 bg-emerald-900/10' : ''}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={m.action === 'confirm'}
                                onChange={() => toggleMatchAction(i)}
                                className="w-4 h-4 accent-emerald-500 border-gray-600 rounded"
                              />
                              <span className={`px-2 py-0.5 text-xs rounded-full border ${getConfidenceColor(m.confidence)}`}>
                                {m.confidence}% ({m.matchType})
                              </span>
                              <span className="text-xs text-gray-500">{m.clientRow.clientId || 'N/A'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
                              <div className="flex items-center gap-1 text-gray-500"><span className="font-medium text-gray-300">Client:</span> {m.clientRow.name}</div>
                              <div className="flex items-center gap-1 text-gray-500"><span className="font-medium text-gray-300">Status:</span> {m.clientRow.status}</div>
                              <div className="flex items-center gap-1 text-gray-500"><span className="font-medium text-gray-300">Email:</span> {m.clientRow.email}</div>
                              <div className="flex items-center gap-1 text-gray-500"><span className="font-medium text-gray-300">Phone:</span> {m.clientRow.phone}</div>
                            </div>
                            {m.matchedCandidate && (
                              <div className="mt-1 pt-1 border-t border-gray-700 grid grid-cols-2 gap-1 text-xs">
                                <div className="flex items-center gap-1 text-emerald-400"><span className="font-medium text-gray-300">Matched:</span> {m.matchedCandidate.name}</div>
                                <div className="flex items-center gap-1 text-emerald-400"><span className="font-medium text-gray-300">Email:</span> {m.matchedCandidate.email}</div>
                                <div className="flex items-center gap-1 text-emerald-400"><span className="font-medium text-gray-300">Phone:</span> {m.matchedCandidate.phone}</div>
                                <div className="flex items-center gap-1 text-emerald-400"><span className="font-medium text-gray-300">ID:</span> {m.matchedCandidate.candidateId}</div>
                              </div>
                            )}
                            {!m.matchedCandidate && (
                              <div className="mt-1 pt-1 border-t border-gray-700 text-xs text-red-400">No match found - manual review needed</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button onClick={handleConfirmSmartImport} disabled={smartImportConfirming || !smartImportMatches.some(m => m.action === 'confirm')}
                      className="flex-1 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                      {smartImportConfirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={15} />} Confirm & Apply
                    </button>
                    <button onClick={() => { setSmartImportOpen(false); setSmartImportMatches([]); setSmartImportFile(null); }} className={btnSecondary}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}