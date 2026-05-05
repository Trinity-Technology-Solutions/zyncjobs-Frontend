import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../api/apiFetch';
import { Upload, Users, UserX, Mail, ChevronRight } from 'lucide-react';

const getToken = () =>
  sessionStorage.getItem('adminToken') ||
  sessionStorage.getItem('accessToken') ||
  localStorage.getItem('accessToken') || '';

type SubPage = 'upload' | 'extracted' | 'internal' | 'email';

interface Props {
  onUnauthorized: () => void;
}

export default function TalentPoolSection({ onUnauthorized }: Props) {
  const [subPage, setSubPage] = useState<SubPage>('upload');

  const tabs: { id: SubPage; label: string; icon: React.ElementType }[] = [
    { id: 'upload',    label: 'Upload Resumes',       icon: Upload },
    { id: 'extracted', label: 'Extracted Candidates', icon: Users },
    { id: 'internal',  label: 'Internal Candidates',  icon: UserX },
    { id: 'email',     label: 'Bulk Email',           icon: Mail },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Talent Pool / Resume Bank</h2>
        <p className="text-sm text-gray-400 mt-1">Upload resumes, extract candidate details, and send bulk invitations.</p>
      </div>

      {/* Sub Nav */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSubPage(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              subPage === id
                ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-lg'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {subPage === id && <ChevronRight className="w-3 h-3" />}
          </button>
        ))}
      </div>

      {/* Sub Pages */}
      {subPage === 'upload'    && <UploadPage />}
      {subPage === 'extracted' && <ExtractedPage />}
      {subPage === 'internal'  && <InternalPage />}
      {subPage === 'email'     && <BulkEmailPage />}
    </div>
  );
}

/* ─── 1. Upload Page ─────────────────────────────────────────── */
function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const allowedExt = ['.pdf', '.doc', '.docx', '.txt'];
    const filtered = Array.from(incoming).filter(f =>
      allowed.includes(f.type) || allowedExt.some(ext => f.name.toLowerCase().endsWith(ext))
    );
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...filtered.filter(f => !names.has(f.name))];
    });
    setDone(false); setProgress(0); setResults([]); setErrors(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const [results, setResults] = useState<any[]>([]);
  const [errors, setErrors] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const folderRef = React.useRef<HTMLInputElement>(null);
  const CHUNK = 10;

  // Set webkitdirectory on folder input after mount (can't set via JSX)
  useEffect(() => {
    if (folderRef.current) {
      folderRef.current.setAttribute('webkitdirectory', '');
      folderRef.current.setAttribute('directory', '');
    }
  }, []);

  const handleProcess = async () => {
    if (!files.length) return;
    setUploading(true);
    setProgress(0);
    setDone(false);
    setResults([]);
    setErrors(0);
    setCurrentChunk(0);
    setTotalChunks(0);

    const token = getToken();
    const chunkList: File[][] = [];
    for (let i = 0; i < files.length; i += CHUNK) chunkList.push(files.slice(i, i + CHUNK));
    const total = chunkList.length;
    setTotalChunks(total);
    const allResults: any[] = [];
    let errCount = 0;
    for (let i = 0; i < chunkList.length; i++) {
      setCurrentChunk(i + 1);
      const fd = new FormData();
      chunkList[i].forEach(f => fd.append('resumes', f));
      try {
        const res = await apiFetch('/api/admin/talent/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
        const data = await res.json();
        if (res.ok) {
          allResults.push(...(data.results || []));
          errCount += (data.results || []).filter((r: any) => r.status === 'error').length;
        } else {
          chunkList[i].forEach(f => allResults.push({ file: f.name, status: 'error', error: data.error || 'Failed' }));
          errCount += chunkList[i].length;
        }
      } catch {
        chunkList[i].forEach(f => allResults.push({ file: f.name, status: 'error', error: 'Network error' }));
        errCount += chunkList[i].length;
      }
      setProgress(Math.round(((i + 1) / total) * 100));
      setResults([...allResults]);
      setErrors(errCount);
    }
    setUploading(false);
    setDone(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Files Selected', val: files.length },
          { label: 'Processed',      val: done ? results.filter((r:any) => r.status === 'ok').length : 0 },
          { label: 'Errors',         val: errors },
        ].map(({ label, val }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{val}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
          dragging ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 bg-gray-900 hover:border-gray-500'
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <p className="text-white font-semibold text-lg">{dragging ? 'Drop files here!' : 'Drag & Drop Resumes Here'}</p>
        <p className="text-gray-400 text-sm mt-2">or click to browse — PDF, DOC, DOCX, TXT supported</p>
        <p className="text-gray-600 text-xs mt-1">Supports bulk upload — select 1500+ files at once</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={e => { addFiles(e.target.files); if (e.target) e.target.value = ''; }}
        />
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            📄 Select Files (PDF/DOC/DOCX)
          </button>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); folderRef.current?.click(); }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            📂 Select Folder
          </button>
        </div>
        <input
          ref={folderRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={e => { addFiles(e.target.files); if (e.target) e.target.value = ''; }}
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
            <p className="text-sm font-semibold text-gray-200">{files.length} file(s) selected</p>
            <button onClick={() => { setFiles([]); setDone(false); setProgress(0); }}
              className="text-xs text-red-400 hover:text-red-300">Clear all</button>
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-gray-800">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-red-900/40 rounded flex items-center justify-center shrink-0">
                    <span className="text-red-400 text-[10px] font-bold">
                      {f.name.toLowerCase().endsWith('.pdf') ? 'PDF' : f.name.toLowerCase().endsWith('.docx') ? 'DOCX' : f.name.toLowerCase().endsWith('.doc') ? 'DOC' : 'TXT'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-300 truncate max-w-xs">{f.name}</span>
                </div>
                <span className="text-xs text-gray-500">{(f.size / 1024).toFixed(0)} KB</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Chunk {currentChunk}/{totalChunks} — {Math.min(currentChunk * CHUNK, files.length)} of {files.length} files...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div className="bg-gradient-to-r from-blue-600 to-orange-500 h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-600">Uploading {CHUNK} files per batch — AI parsing each resume...</p>
        </div>
      )}

      {done && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-700/50 text-emerald-400 rounded-xl px-4 py-3 text-sm">
            ✅ {results.filter((r:any) => r.status === 'ok').length} resumes parsed. {errors > 0 ? `${errors} failed.` : ''} Go to "Extracted Candidates" tab.
          </div>
          {results.filter((r:any) => r.status === 'error').length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 max-h-32 overflow-y-auto">
              {results.filter((r:any) => r.status === 'error').map((r:any, i:number) => (
                <p key={i} className="text-xs text-red-400">{r.file}: {r.error}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Process Button */}
      <button
        onClick={handleProcess}
        disabled={!files.length || uploading}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-orange-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Upload className="w-5 h-5" />
        {uploading
          ? `Processing chunk ${currentChunk}/${totalChunks} — ${progress}%`
          : `Process ${files.length} Resume(s)`
        }
      </button>
    </div>
  );
}

/* ─── 2. Extracted Candidates Page ──────────────────────────── */
function ExtractedPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewResume, setViewResume] = useState<any | null>(null);

  // Load from backend API
  useEffect(() => {
    setLoading(true);
    const token = getToken();
    fetch('/api/admin/talent/candidates', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setCandidates(d.candidates || []))
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = candidates.filter(c =>
    !search ||
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.skills || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleAll = () =>
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(c => c.id)));

  const deleteCandidate = async (id: string) => {
    const token = getToken();
    await apiFetch(`/api/admin/talent/candidates/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setCandidates(prev => prev.filter(c => c.id !== id));
  };

  const moveToInternal = () => {
    // Just select them — they are already in backend. Navigate user to email tab.
    alert(`${selected.size} candidate(s) selected. Go to Bulk Email tab to send emails.`);
    setSelected(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Extracted', val: candidates.length, color: 'text-blue-400' },
          { label: 'Parsed OK',       val: candidates.filter(c => c.status === 'Parsed').length, color: 'text-emerald-400' },
          { label: 'Errors',          val: candidates.filter(c => c.status === 'Error').length,  color: 'text-red-400' },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{val}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search by name, email, skills..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {selected.size > 0 && (
          <button
            onClick={moveToInternal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <UserX className="w-4 h-4" />
            Move {selected.size} to Internal Pool
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800 bg-gray-800/50">
                <th className="px-4 py-3">
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll} className="accent-blue-500" />
                </th>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Phone</th>
                <th className="text-left px-4 py-3 font-medium">Skills</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-800 animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-gray-500 py-10 text-sm">No candidates found.</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className={`border-b border-gray-800 hover:bg-gray-800/40 transition-colors ${selected.has(c.id) ? 'bg-blue-900/10' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} className="accent-blue-500" />
                  </td>
                  <td className="px-4 py-3 text-gray-200 font-medium">{c.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{c.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {(c.skills || '').split(',').slice(0, 3).map((s: string) => s.trim()).filter(Boolean).map((s: string) => (
                        <span key={s} className="px-2 py-0.5 bg-blue-900/40 text-blue-300 text-xs rounded-full">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.status === 'Parsed' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'
                    }`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewResume(c)}
                        className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors">View</button>
                      <button onClick={() => deleteCandidate(c.id)}
                        className="text-xs px-2 py-1 bg-red-900/30 hover:bg-red-900/60 text-red-400 rounded transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Resume Modal */}
      {viewResume && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="font-semibold text-white">Candidate Details</h3>
              <button onClick={() => setViewResume(null)} className="text-gray-400 hover:text-white text-xl">×</button>
            </div>
            <div className="p-6 space-y-3">
              {[['Name', viewResume.name], ['Email', viewResume.email], ['Phone', viewResume.phone],
                ['Skills', viewResume.skills], ['Experience', viewResume.experience], ['Job Title', viewResume.jobTitle]
              ].map(([label, val]) => (
                <div key={label} className="flex gap-3">
                  <span className="text-gray-500 text-sm w-24 shrink-0">{label}</span>
                  <span className="text-gray-200 text-sm">{val || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



/* ─── 3. Internal Candidates Page ───────────────────────────── */
function InternalPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewCandidate, setViewCandidate] = useState<any | null>(null);

  useEffect(() => {
    setLoading(true);
    const token = getToken();
    fetch('/api/admin/talent/candidates', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setCandidates(d.candidates || []))
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = candidates.filter(c =>
    !search ||
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  const toggleSelect = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleAll = () =>
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(c => c.id)));

  const deleteCandidate = async (id: string) => {
    const token = getToken();
    await apiFetch(`/api/admin/talent/candidates/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setCandidates(prev => prev.filter(c => c.id !== id));
  };

  const markEmailSent = (id: string) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, emailStatus: 'Sent', emailSentAt: new Date().toISOString() } : c));
  };

  const sendToEmailPage = () => {
    const sel = candidates.filter(c => selected.has(c.id));
    localStorage.setItem('talentPool_emailQueue', JSON.stringify(sel.map(c => c.id)));
    alert(`${sel.length} candidate(s) queued. Go to Bulk Email tab.`);
  };

  return (
    <div className="space-y-4">
      {/* Notice Banner */}
      <div className="flex items-start gap-3 bg-amber-900/20 border border-amber-700/40 rounded-xl px-5 py-4">
        <span className="text-amber-400 text-lg mt-0.5">⚠️</span>
        <div>
          <p className="text-amber-300 font-semibold text-sm">Internal Talent Pool — Not Registered Users</p>
          <p className="text-amber-400/70 text-xs mt-1">
            These candidates have not registered on ZyncJobs. Emails will be sent as an invitation only.
            Do not display these profiles publicly.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Candidates', val: candidates.length,                                          color: 'text-blue-400'    },
          { label: 'Emails Sent',      val: candidates.filter(c => c.emailStatus === 'Sent').length,    color: 'text-emerald-400' },
          { label: 'Not Sent',         val: candidates.filter(c => c.emailStatus !== 'Sent').length,    color: 'text-orange-400'  },
          { label: 'Selected',         val: selected.size,                                              color: 'text-purple-400'  },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{val}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search by name, email, phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {selected.size > 0 && (
          <button
            onClick={sendToEmailPage}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            <Mail className="w-4 h-4" />
            Queue {selected.size} for Bulk Email
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800 bg-gray-800/50">
                <th className="px-4 py-3">
                  <input type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="accent-blue-500" />
                </th>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Phone</th>
                <th className="text-left px-4 py-3 font-medium">Added Date</th>
                <th className="text-left px-4 py-3 font-medium">Email Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-800 animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-10 text-sm">
                    No internal candidates yet. Move candidates from Extracted tab.
                  </td>
                </tr>
              ) : filtered.map(c => (
                <tr key={c.id}
                  className={`border-b border-gray-800 hover:bg-gray-800/40 transition-colors ${
                    selected.has(c.id) ? 'bg-blue-900/10' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(c.id)}
                      onChange={() => toggleSelect(c.id)} className="accent-blue-500" />
                  </td>
                  <td className="px-4 py-3 text-gray-200 font-medium">{c.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {c.addedDate ? new Date(c.addedDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.emailStatus === 'Sent'
                        ? 'bg-emerald-900/40 text-emerald-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {c.emailStatus || 'Not Sent'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewCandidate(c)}
                        className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors">
                        View
                      </button>
                      {c.emailStatus !== 'Sent' && (
                        <button onClick={() => markEmailSent(c.id)}
                          className="text-xs px-2 py-1 bg-blue-900/30 hover:bg-blue-900/60 text-blue-400 rounded transition-colors">
                          Mark Sent
                        </button>
                      )}
                      <button onClick={() => deleteCandidate(c.id)}
                        className="text-xs px-2 py-1 bg-red-900/30 hover:bg-red-900/60 text-red-400 rounded transition-colors">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {viewCandidate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="font-semibold text-white">Candidate Details</h3>
              <button onClick={() => setViewCandidate(null)} className="text-gray-400 hover:text-white text-xl">×</button>
            </div>
            <div className="p-6 space-y-3">
              {[
                ['Name',         viewCandidate.name],
                ['Email',        viewCandidate.email],
                ['Phone',        viewCandidate.phone],
                ['Skills',       viewCandidate.skills],
                ['Experience',   viewCandidate.experience],
                ['Job Title',    viewCandidate.jobTitle],
                ['Added Date',   viewCandidate.addedDate ? new Date(viewCandidate.addedDate).toLocaleString() : '—'],
                ['Email Status', viewCandidate.emailStatus || 'Not Sent'],
                ['Email Sent',   viewCandidate.emailSentAt ? new Date(viewCandidate.emailSentAt).toLocaleString() : '—'],
              ].map(([label, val]) => (
                <div key={label} className="flex gap-3">
                  <span className="text-gray-500 text-sm w-28 shrink-0">{label}</span>
                  <span className="text-gray-200 text-sm break-all">{val || '—'}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5">
              <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg px-4 py-2">
                <p className="text-amber-400 text-xs">⚠️ Not a registered ZyncJobs user — invitation only</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



/* ─── 4. Bulk Email Page ───────────────────────────────────────── */
function BulkEmailPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [template, setTemplate] = useState('invite');
  const [batchSize, setBatchSize] = useState(100);
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [done, setDone] = useState(false);
  const [preview, setPreview] = useState(false);
  const [search, setSearch] = useState('');

  const TEMPLATE_PREVIEWS: Record<string, { subject: string; body: string }> = {
    invite: {
      subject: 'You\'re Invited to Join ZyncJobs — Your Next Career Move Starts Here',
      body: `Dear [Name],

I hope this message finds you well.

We recently came across your profile and were genuinely impressed by your background and professional experience. We believe you could be a strong fit for exciting opportunities currently available on our platform.

ZyncJobs is a next-generation career platform designed to connect talented professionals like yourself with top employers across industries. Our AI-powered matching engine ensures you are presented with roles that align with your skills, experience, and career aspirations — saving you time and maximising your chances of landing the right opportunity.

What ZyncJobs offers you:
  • Personalised job recommendations based on your profile
  • Direct access to verified employers and hiring managers
  • One-click applications with your uploaded resume
  • Real-time application tracking and status updates
  • Career resources, salary insights, and interview tips

We would love to have you on board. Getting started takes less than 2 minutes.

👉 Create Your Free Profile: https://zyncjobs.com/register

Should you have any questions or require assistance, please do not hesitate to reach out to our team at support@zyncjobs.com.

We look forward to supporting your career journey.

Warm regards,

The ZyncJobs Talent Team
ZyncJobs — Your Smart Career Platform
https://zyncjobs.com  |  support@zyncjobs.com`,
    },
    followup: {
      subject: 'Following Up — Exclusive Opportunities Waiting for You on ZyncJobs',
      body: `Dear [Name],

I wanted to follow up on our earlier invitation to join ZyncJobs.

We understand that your time is valuable, and we want to assure you that registering on ZyncJobs is completely free and takes only a couple of minutes. Since our last message, several new positions have been added that closely match your professional profile.

Here is a quick reminder of what awaits you:
  • Curated job matches tailored to your skills and experience
  • Opportunities with leading companies actively hiring right now
  • A streamlined application process — no lengthy forms
  • Full visibility into your application pipeline

Thousands of professionals have already taken the next step in their careers through ZyncJobs. We would be delighted to help you do the same.

👉 Join ZyncJobs Today: https://zyncjobs.com/register

If you have already registered, simply log in to explore the latest openings:
🔗 https://zyncjobs.com/login

For any queries, our support team is available at support@zyncjobs.com.

Best regards,

The ZyncJobs Talent Team
ZyncJobs — Your Smart Career Platform
https://zyncjobs.com  |  support@zyncjobs.com`,
    },
    jobs: {
      subject: 'New Job Openings Matching Your Profile — Act Now Before They\'re Filled',
      body: `Dear [Name],

We have identified several new job openings on ZyncJobs that closely match your skills and professional background.

These positions are with reputable employers who are actively seeking candidates with your level of expertise. Roles are filling quickly, and we encourage you to review them at your earliest convenience.

To view all matching opportunities and submit your application:

👉 Explore Jobs on ZyncJobs: https://zyncjobs.com/register

Once registered, your profile will be automatically matched against hundreds of live vacancies, and you will receive personalised alerts whenever a new relevant role is posted.

Why act now?
  • High-demand roles close fast — early applicants have a significant advantage
  • Employers on ZyncJobs are actively reviewing profiles this week
  • Your resume is already in our system — registration takes under 2 minutes

We are committed to helping you find a role that truly fits your ambitions.

For assistance, contact us at support@zyncjobs.com.

Kind regards,

The ZyncJobs Talent Team
ZyncJobs — Your Smart Career Platform
https://zyncjobs.com  |  support@zyncjobs.com`,
    },
  };

  useEffect(() => {
    const token = getToken();
    const queuedIds: string[] = (() => { try { return JSON.parse(localStorage.getItem('talentPool_emailQueue') || '[]'); } catch { return []; } })();
    fetch('/api/admin/talent/candidates', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const all = (d.candidates || []).map((c: any) => ({
          ...c,
          name: typeof c.name === 'object' ? (c.name?.name || c.name?.first || '') : c.name,
        }));
        setCandidates(all);
        // Pre-select queued ids if any, else select all with email
        const ids = queuedIds.length > 0 ? queuedIds : all.filter((c:any) => c.email).map((c:any) => c.id);
        setSelected(new Set(ids));
      })
      .catch(() => setCandidates([]));
  }, []);

  const filtered = candidates.filter(c =>
    !search ||
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleAll = () =>
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(c => c.id)));

  const selectedList = candidates.filter(c => selected.has(c.id));

  const handleSend = async () => {
    if (!selectedList.length) return;
    setSending(true);
    setDone(false);
    setSentCount(0);
    const token = getToken();
    const batches = Math.ceil(selectedList.length / batchSize);
    setTotalBatches(batches);

    for (let i = 0; i < batches; i++) {
      setCurrentBatch(i + 1);
      const batch = selectedList.slice(i * batchSize, (i + 1) * batchSize);
      try {
        const res = await apiFetch('/api/admin/talent/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ candidateIds: batch.map((c:any) => c.id), template, batchSize: batch.length })
        });
        const data = await res.json();
        setSentCount(prev => prev + (data.sent || 0));
        // Update local email status
        setCandidates(prev => prev.map(c =>
          batch.find((b:any) => b.id === c.id) ? { ...c, emailStatus: 'Sent', emailSentAt: new Date().toISOString() } : c
        ));
      } catch {
        // continue next batch
      }
      // 2 min delay between batches (120000ms), skip last
      if (i < batches - 1) await new Promise(r => setTimeout(r, 120000));
    }
    setSending(false);
    setDone(true);
  };

  const progress = selectedList.length > 0 ? Math.round((sentCount / selectedList.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Candidates', val: candidates.length,   color: 'text-blue-400'    },
          { label: 'Selected',         val: selected.size,        color: 'text-purple-400'  },
          { label: 'Sent This Session',val: sentCount,            color: 'text-emerald-400' },
          { label: 'Remaining',        val: Math.max(0, selected.size - sentCount), color: 'text-orange-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.val}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
            <p className="text-sm font-semibold text-gray-200">Select Recipients</p>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
            />
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-800/50">
                <tr className="text-gray-400 border-b border-gray-800">
                  <th className="px-4 py-2">
                    <input type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleAll} className="accent-blue-500" />
                  </th>
                  <th className="text-left px-4 py-2 font-medium">Name</th>
                  <th className="text-left px-4 py-2 font-medium">Email</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-gray-500 py-8 text-sm">No candidates loaded.</td></tr>
                ) : filtered.map(c => (
                  <tr key={c.id} className={`border-b border-gray-800 hover:bg-gray-800/40 transition-colors ${
                    selected.has(c.id) ? 'bg-blue-900/10' : ''
                  }`}>
                    <td className="px-4 py-2">
                      <input type="checkbox" checked={selected.has(c.id)}
                        onChange={() => toggleSelect(c.id)} className="accent-blue-500" />
                    </td>
                    <td className="px-4 py-2 text-gray-200">{c.name || '—'}</td>
                    <td className="px-4 py-2 text-gray-400 text-xs">{c.email || '—'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.emailStatus === 'Sent' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-gray-700 text-gray-400'
                      }`}>{c.emailStatus || 'Not Sent'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-200">Email Template</p>
            <select
              value={template}
              onChange={e => setTemplate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="invite">Invitation to Join ZyncJobs</option>
              <option value="followup">Follow-Up — Exclusive Opportunities</option>
              <option value="jobs">New Job Openings Matching Your Profile</option>
            </select>
            <div className="text-xs text-gray-400 bg-gray-800 rounded-lg px-3 py-2">
              <p className="font-medium text-gray-300 mb-1">Subject:</p>
              <p>{TEMPLATE_PREVIEWS[template].subject}</p>
            </div>
            <button
              onClick={() => setPreview(true)}
              className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
            >
              👁 Preview Email
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-200">Batch Settings</p>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Emails per batch</label>
              <select
                value={batchSize}
                onChange={e => setBatchSize(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={50}>50 per batch</option>
                <option value={100}>100 per batch</option>
                <option value={200}>200 per batch</option>
              </select>
            </div>
            <div className="text-xs text-gray-500 bg-gray-800/50 rounded-lg px-3 py-2 space-y-1">
              <p>📦 {Math.ceil(selectedList.length / batchSize)} batch(es) for {selectedList.length} recipients</p>
              <p>⏱ ~2 min delay between batches</p>
              <p>📧 Safe limit: 500 emails/day</p>
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={sending || !selectedList.length || done}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-orange-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            {sending ? `Sending batch ${currentBatch}/${totalBatches}...` : done ? '✅ All Sent!' : `Send to ${selectedList.length} Candidates`}
          </button>
        </div>
      </div>

      {(sending || done) && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300 font-medium">
              {done ? '✅ Sending complete!' : `Batch ${currentBatch} of ${totalBatches} — sending...`}
            </span>
            <span className="text-gray-400">{sentCount} / {selectedList.length} sent ({progress}%)</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-600 to-orange-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {sending && (
            <p className="text-xs text-gray-500">⏳ 2 minute delay between batches to stay within email limits.</p>
          )}
          {done && (
            <p className="text-xs text-emerald-400">All emails sent successfully. Check Internal Candidates tab for updated status.</p>
          )}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreview(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Email Preview</h3>
              <button onClick={() => setPreview(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            {/* Email mockup */}
            <div className="p-6">
              {/* Email client chrome */}
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {/* Subject bar */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">Subject</p>
                  <p className="text-gray-800 text-sm font-semibold">{TEMPLATE_PREVIEWS[template].subject}</p>
                </div>

                {/* Email body */}
                <div className="bg-white px-8 py-8">
                  {/* Logo inside email body — top center */}
                  <div className="flex justify-center mb-6 pb-6 border-b border-gray-100">
                    <img src="/images/zyncjobs-logo.png" alt="ZyncJobs" className="h-12 object-contain" />
                  </div>

                  <pre className="text-gray-700 text-sm whitespace-pre-wrap font-sans leading-7">{TEMPLATE_PREVIEWS[template].body}</pre>

                  {/* CTA button */}
                  <div className="mt-8 text-center">
                    <a
                      href="https://zyncjobs.com/register"
                      className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-orange-500 text-white text-sm font-semibold rounded-lg"
                    >
                      Get Started on ZyncJobs →
                    </a>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-950 px-8 py-5 text-center space-y-2">
                  <img src="/images/zyncjobs-logo.png" alt="ZyncJobs" className="h-7 object-contain mx-auto opacity-60" />
                  <p className="text-gray-500 text-xs">© {new Date().getFullYear()} ZyncJobs. All rights reserved.</p>
                  <p className="text-gray-600 text-xs">
                    <a href="https://zyncjobs.com" className="text-blue-400 hover:underline">zyncjobs.com</a>
                    {' · '}
                    <a href="mailto:support@zyncjobs.com" className="text-blue-400 hover:underline">support@zyncjobs.com</a>
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-4 text-center">💡 [Name] will be replaced with each candidate's actual name before sending.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
