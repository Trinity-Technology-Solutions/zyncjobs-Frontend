import React, { useState, useEffect, useMemo } from 'react';
import { Upload, Users, UserX, Mail, ChevronRight, Copy } from 'lucide-react';
import { API_ENDPOINTS } from '../../../config/env';
import { S3Service } from '../../../services/s3Service';
import { apiFetch } from '../../../api/apiFetch';
import AutocompleteCombobox from '../../../components/AutocompleteCombobox';

const getToken = () =>
  sessionStorage.getItem('adminToken') ||
  sessionStorage.getItem('accessToken') ||
  localStorage.getItem('accessToken') ||
  localStorage.getItem('adminToken') || '';

type SubPage = 'upload' | 'extracted' | 'internal' | 'email';

interface Props {
  onUnauthorized: () => void;
}

export default function TalentPoolSection({ onUnauthorized: _onUnauthorized }: Props) {
  const [subPage, setSubPage] = useState<SubPage>('upload');
  const [lastUploadAt, setLastUploadAt] = useState(0);
  const [globalProcessingStatus, setGlobalProcessingStatus] = useState<{
    isProcessing: boolean;
    status: string;
    progress: number;
  }>({ isProcessing: false, status: '', progress: 0 });

  // Check for global processing status
  useEffect(() => {
    const checkGlobalProcessing = async () => {
      const token = getToken();
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/resume/processing-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setGlobalProcessingStatus({
            isProcessing: data.isProcessing || false,
            status: data.status || '',
            progress: data.progress || 0
          });
        }
      } catch (error) {
        console.error('Error checking global processing status:', error);
      }
    };
    
    checkGlobalProcessing();
    
    // Poll every 5 seconds for global status
    const interval = setInterval(checkGlobalProcessing, 5000);
    return () => clearInterval(interval);
  }, []);

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

      {/* Global Processing Status Banner */}
      {globalProcessingStatus.isProcessing && (
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-700/50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <p className="text-blue-300 font-semibold text-sm flex items-center gap-2">
                  🚀 Resume Processing Active
                  <span className="px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded-full text-xs">
                    {globalProcessingStatus.progress}%
                  </span>
                </p>
                <p className="text-blue-400/70 text-xs">{globalProcessingStatus.status}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-blue-300 text-xs">Processing continues in background</p>
              <p className="text-blue-400/60 text-xs">Safe to navigate between sections</p>
            </div>
          </div>
          <div className="w-full bg-blue-900/50 rounded-full h-1.5 mt-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${globalProcessingStatus.progress}%` }}
            />
          </div>
        </div>
      )}
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

      {/* Sub Pages — keep all mounted to preserve state */}
      <div className={subPage === 'upload'    ? '' : 'hidden'}><UploadPage onUploadDone={() => setLastUploadAt(Date.now())} /></div>
      <div className={subPage === 'extracted' ? '' : 'hidden'}><ExtractedPage lastUploadAt={lastUploadAt} /></div>
      <div className={subPage === 'internal'  ? '' : 'hidden'}><InternalPage /></div>
      <div className={subPage === 'email'     ? '' : 'hidden'}><BulkEmailPage /></div>
    </div>
  );
}

const PROCESSING_KEY = 'talentPool_processing';

interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  status: string;
  currentChunk: number;
  totalChunks: number;
  processed: number;
  errors: number;
  done: boolean;
  savedAt: number;
}

function saveProcessingState(state: Omit<ProcessingState, 'savedAt'>) {
  localStorage.setItem(PROCESSING_KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
}

function loadProcessingState(): ProcessingState | null {
  try {
    const raw = localStorage.getItem(PROCESSING_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.savedAt > 2 * 60 * 60 * 1000) {
      localStorage.removeItem(PROCESSING_KEY);
      return null;
    }
    return data;
  } catch { return null; }
}

/* ─── 1. Upload Page ─────────────────────────────────────────── */
function UploadPage({ onUploadDone }: { onUploadDone: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [backgroundProcessing, setBackgroundProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const allowedExt = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.webp'];
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
  const [failedFiles, setFailedFiles] = useState<File[]>([]);
  const [failedFileNames, setFailedFileNames] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('talentPool_failedNames') || '[]'); } catch { return []; }
  });
  const inputRef = React.useRef<HTMLInputElement>(null);
  const folderRef = React.useRef<HTMLInputElement>(null);
  const CHUNK = 10;
  // Set webkitdirectory on folder input after mount (can't set via JSX)
  useEffect(() => {
    if (folderRef.current) {
      folderRef.current.setAttribute('webkitdirectory', '');
      folderRef.current.setAttribute('directory', '');
      folderRef.current.setAttribute('multiple', '');
    }
  }, []);

  // Restore processing state from localStorage on mount
  useEffect(() => {
    const saved = loadProcessingState();
    if (!saved) return;
    setProgress(saved.progress || 0);
    setCurrentChunk(saved.currentChunk || 0);
    setTotalChunks(saved.totalChunks || 0);
    setErrors(saved.errors || 0);
    if (saved.done) {
      setDone(true);
      localStorage.removeItem(PROCESSING_KEY);
    } else if (saved.isProcessing) {
      // Was mid-processing when page was refreshed — show interrupted warning
      setBackgroundProcessing(true);
      setProcessingStatus(`⚠️ Processing was interrupted at chunk ${saved.currentChunk}/${saved.totalChunks}. ${saved.processed} resumes were saved before refresh.`);
    }
  }, []);


  const handleRetryFailed = () => {
    if (!failedFiles.length) return;
    setFiles(failedFiles);
    setFailedFiles([]);
    setFailedFileNames([]);
    localStorage.removeItem('talentPool_failedNames');
    setDone(false);
    setResults([]);
    setErrors(0);
    setProgress(0);
  };

  const handleProcess = async (filesToProcess = files) => {
    if (!filesToProcess.length) return;
    setUploading(true);
    setProgress(0);
    setDone(false);
    setResults([]);
    setErrors(0);
    setFailedFiles([]);
    setFailedFileNames([]);
    localStorage.removeItem('talentPool_failedNames');
    setCurrentChunk(0);
    setTotalChunks(0);

    const token = getToken();
    const chunkList: File[][] = [];
    for (let i = 0; i < filesToProcess.length; i += CHUNK) chunkList.push(filesToProcess.slice(i, i + CHUNK));
    const total = chunkList.length;
    setTotalChunks(total);
    const allResults: any[] = [];
    let errCount = 0;

    saveProcessingState({ isProcessing: true, done: false, progress: 0, status: 'Starting upload...', currentChunk: 0, totalChunks: total, processed: 0, errors: 0 });
    
    for (let i = 0; i < chunkList.length; i++) {
      setCurrentChunk(i + 1);
      const chunk = chunkList[i];
      
      // Track File objects that fail so we can retry them
      const chunkFailedFiles: File[] = [];

      // First upload each file to S3
      const s3UploadPromises = chunk.map(async (file) => {
        try {
          const s3Result = await S3Service.uploadTalentResumeToS3(file);
          if (s3Result.success && s3Result.fileUrl) {
            return { file, s3Url: s3Result.fileUrl, success: true };
          } else {
            return { file, error: s3Result.error || 'S3 upload failed', success: false };
          }
        } catch (error) {
          return { file, error: error instanceof Error ? error.message : 'S3 upload failed', success: false };
        }
      });
      
      const s3Results = await Promise.all(s3UploadPromises);
      
      // Process successful S3 uploads
      const successfulUploads = s3Results.filter(r => r.success);
      const failedUploads = s3Results.filter(r => !r.success);
      
      // Add failed uploads to results
      failedUploads.forEach(failed => {
        allResults.push({ file: failed.file.name, status: 'error', error: failed.error });
        chunkFailedFiles.push(failed.file);
        errCount++;
      });
      
      if (successfulUploads.length > 0) {
        // Send S3 URLs to backend for processing
        const fd = new FormData();
        successfulUploads.forEach(upload => {
          fd.append('resumeUrls', upload.s3Url ?? '');
          fd.append('fileNames', upload.file.name);
        });
        fd.append('source', 'admin_talent_pool');
        
        try {
          const res = await apiFetch(`${API_ENDPOINTS.RESUME_UPLOAD_BULK}`, { 
            method: 'POST', 
            headers: { Authorization: `Bearer ${token}` }, 
            body: fd 
          });
          const data = await res.json();
          
          if (res.ok) {
            allResults.push(...(data.results || []));
            const backendErrors = (data.results || []).filter((r: any) => r.status === 'error');
            errCount += backendErrors.length;
            backendErrors.forEach((r: any) => {
              const f = successfulUploads.find(u => u.file.name === r.file);
              if (f) chunkFailedFiles.push(f.file);
            });
          } else {
            successfulUploads.forEach(upload => {
              allResults.push({ file: upload.file.name, status: 'error', error: data.error || 'Processing failed' });
              chunkFailedFiles.push(upload.file);
              errCount++;
            });
          }
        } catch {
          successfulUploads.forEach(upload => {
            allResults.push({ file: upload.file.name, status: 'error', error: 'Network error' });
            chunkFailedFiles.push(upload.file);
            errCount++;
          });
        }
      }
      
      setFailedFiles(prev => [...prev, ...chunkFailedFiles]);
      const newFailedNames = [...failedFileNames, ...chunkFailedFiles.map(f => f.name)];
      setFailedFileNames(newFailedNames);
      localStorage.setItem('talentPool_failedNames', JSON.stringify(newFailedNames));
      const pct = Math.round(((i + 1) / total) * 100);
      const processedCount = allResults.filter((r: any) => r.status === 'ok').length;
      setProgress(pct);
      setResults([...allResults]);
      setErrors(errCount);
      saveProcessingState({
        isProcessing: i + 1 < total,
        done: false,
        progress: pct,
        status: `Processed chunk ${i + 1} of ${total} — ${processedCount} parsed`,
        currentChunk: i + 1,
        totalChunks: total,
        processed: processedCount,
        errors: errCount
      });
    }

    const finalProcessed = allResults.filter((r: any) => r.status === 'ok').length;
    saveProcessingState({ isProcessing: false, done: true, progress: 100, status: 'Complete', currentChunk: total, totalChunks: total, processed: finalProcessed, errors: errCount });
    setUploading(false);
    setDone(true);
    setBackgroundProcessing(false);
    onUploadDone();
  };

  return (
    <div className="space-y-6">
      {/* Background Processing Status */}
      {backgroundProcessing && (
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <p className="text-blue-300 font-semibold text-sm">Background Processing Active</p>
                <p className="text-blue-400/70 text-xs">{processingStatus}</p>
              </div>
            </div>
            <span className="text-blue-300 text-sm font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-blue-900/50 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-blue-400/60 text-xs mt-2">
            ⚡ Processing continues in background. You can navigate to other sections and return later.
          </p>
        </div>
      )}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Files Selected', val: files.length },
          { label: 'Processed',      val: (done || backgroundProcessing) ? (results.filter((r:any) => r.status === 'ok').length || loadProcessingState()?.processed || 0) : 0 },
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
        <p className="text-gray-400 text-sm mt-2">or click to browse — PDF, DOC, DOCX, TXT, JPG, JPEG, PNG, WEBP supported</p>
        <p className="text-gray-600 text-xs mt-1">Supports bulk upload — select 1500+ files at once</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={e => { addFiles(e.target.files); if (e.target) e.target.value = ''; }}
        />
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            📄 Select Files (PDF/DOC/DOCX/TXT/JPG/PNG)
          </button>
          <button
            type="button"
            onClick={e => { 
              e.stopPropagation(); 
              // Create a new input element for folder selection
              const folderInput = document.createElement('input');
              folderInput.type = 'file';
              folderInput.webkitdirectory = true;
              folderInput.multiple = true;
              folderInput.onchange = (event) => {
                const target = event.target as HTMLInputElement;
                addFiles(target.files);
              };
              folderInput.click();
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            📂 Select Folder
          </button>
        </div>
        <input
          ref={folderRef}
          type="file"
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
          <p className="text-xs text-gray-600">Uploading to S3 and parsing {CHUNK} files per batch — AI processing each resume...</p>
        </div>
      )}

      {/* Persistent failed files panel — survives refresh */}
      {!done && failedFileNames.length > 0 && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-red-400">⚠️ {failedFileNames.length} file(s) failed in last session</p>
            <button
              onClick={() => { setFailedFileNames([]); localStorage.removeItem('talentPool_failedNames'); }}
              className="text-xs text-gray-500 hover:text-gray-300">Dismiss</button>
          </div>
          <p className="text-xs text-gray-400">Re-select these files and upload again to retry:</p>
          <div className="max-h-24 overflow-y-auto space-y-0.5">
            {failedFileNames.slice(0, 20).map((name, i) => (
              <p key={i} className="text-xs text-red-400 truncate">• {name}</p>
            ))}
            {failedFileNames.length > 20 && <p className="text-xs text-gray-500">...and {failedFileNames.length - 20} more</p>}
          </div>
        </div>
      )}

      {done && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-700/50 text-emerald-400 rounded-xl px-4 py-3 text-sm">
            ✅ {results.filter((r:any) => r.status === 'ok').length} resumes parsed. {errors > 0 ? `${errors} failed.` : ''} Go to "Extracted Candidates" tab.
          </div>
          {failedFiles.length > 0 && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-red-400">⚠️ {failedFiles.length} file(s) failed to parse</p>
                <button
                  onClick={handleRetryFailed}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  Retry {failedFiles.length} Failed File(s)
                </button>
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1">
                {results.filter((r:any) => r.status === 'error').map((r:any, i:number) => (
                  <p key={i} className="text-xs text-red-400 truncate">• {r.file}: {r.error}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Process Button */}
      <button
        onClick={() => handleProcess()}
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
function ExtractedPage({ lastUploadAt }: { lastUploadAt: number }) {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Parsed' | 'Error'>('all');
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewResume, setViewResume] = useState<any | null>(null);
  const isProcessing = loadProcessingState()?.isProcessing ?? false;

  // Group duplicates by email (primary) or name+phone (fallback)
  const duplicateGroups = useMemo(() => {
    const emailMap = new Map<string, any[]>();
    const namePhoneMap = new Map<string, any[]>();
    candidates.forEach(c => {
      const email = (c.email || '').trim().toLowerCase();
      const namePhone = `${(c.name || '').trim().toLowerCase()}||${(c.phone || '').trim()}`;
      if (email) {
        if (!emailMap.has(email)) emailMap.set(email, []);
        emailMap.get(email)!.push(c);
      } else if ((c.name || '').trim() && (c.phone || '').trim()) {
        if (!namePhoneMap.has(namePhone)) namePhoneMap.set(namePhone, []);
        namePhoneMap.get(namePhone)!.push(c);
      }
    });
    const groups: any[][] = [];
    emailMap.forEach(g => { if (g.length > 1) groups.push(g); });
    namePhoneMap.forEach(g => { if (g.length > 1) groups.push(g); });
    return groups;
  }, [candidates]);

  const duplicateIds = useMemo(() => {
    // For each group keep the first (oldest), mark rest as duplicates
    const ids = new Set<string>();
    duplicateGroups.forEach(g => g.slice(1).forEach(c => ids.add(c.id)));
    return ids;
  }, [duplicateGroups]);

  const deleteSingleDuplicate = async (id: string) => {
    setDeletingIds(prev => new Set(prev).add(id));
    const token = getToken();
    await apiFetch(`${API_ENDPOINTS.RESUME_CANDIDATES}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setCandidates(prev => prev.filter(c => c.id !== id));
    setDeletingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const deleteAllDuplicates = async () => {
    if (!duplicateIds.size) return;
    if (!confirm(`Delete ${duplicateIds.size} duplicate entries? The first occurrence of each will be kept.`)) return;
    const token = getToken();
    setDeletingIds(new Set(duplicateIds));
    await Promise.all(Array.from(duplicateIds).map(id =>
      apiFetch(`${API_ENDPOINTS.RESUME_CANDIDATES}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    ));
    setCandidates(prev => prev.filter(c => !duplicateIds.has(c.id)));
    setDeletingIds(new Set());
  };

  const fetchCandidates = () => {
    apiFetch(`${API_ENDPOINTS.RESUME_CANDIDATES}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => setCandidates((Array.isArray(d) ? d : (d.candidates || [])).map((c: any) => ({ ...c, id: c.id || c._id }))))
      .catch((err) => console.error('ExtractedPage fetch error:', err))
      .finally(() => setLoading(false));
  };

  // Load on mount + re-fetch whenever a new upload completes
  useEffect(() => {
    setLoading(true);
    fetchCandidates();
  }, [lastUploadAt]);

  // Auto-poll every 8s while processing is active
  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(fetchCandidates, 8000);
    return () => clearInterval(interval);
  }, [isProcessing]);

  const filtered = candidates.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return !search ||
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.skills || '').toLowerCase().includes(search.toLowerCase());
  });

  const toggleSelect = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleAll = () =>
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(c => c.id)));

  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());

  const retryCandidate = async (c: any) => {
    setRetryingIds(prev => new Set(prev).add(c.id));
    const token = getToken();
    try {
      const res = await apiFetch(`${API_ENDPOINTS.RESUME_CANDIDATES}/${c.id}/retry`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.status === 'Parsed') {
        setCandidates(prev => prev.map(x => x.id === c.id ? { ...x, ...data } : x));
      }
    } catch { /* silent */ } finally {
      setRetryingIds(prev => { const s = new Set(prev); s.delete(c.id); return s; });
    }
  };

  const deleteCandidate = async (id: string) => {
    if (!confirm('Delete this candidate? This cannot be undone.')) return;
    const token = getToken();
    await apiFetch(`${API_ENDPOINTS.RESUME_CANDIDATES}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setCandidates(prev => prev.filter(c => c.id !== id));
  };

  const moveToInternal = () => {
    // Just select them — they are already in backend. Navigate user to email tab.
    alert(`${selected.size} candidate(s) selected. Go to Bulk Email tab to send emails.`);
    setSelected(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Processing active banner */}
      {isProcessing && (
        <div className="flex items-center gap-3 bg-blue-900/30 border border-blue-700/50 rounded-xl px-4 py-3">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
          <p className="text-blue-300 text-sm">Processing in progress — new candidates will appear automatically every 8 seconds.</p>
          <button onClick={fetchCandidates} className="ml-auto text-xs text-blue-400 hover:text-blue-300 underline">Refresh now</button>
        </div>
      )}
      {/* Duplicate Finder Panel */}
      {showDuplicates && (
        <div className="bg-gray-900 border border-orange-700/50 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-orange-700/30 bg-orange-900/20">
            <div className="flex items-center gap-2">
              <Copy className="w-4 h-4 text-orange-400" />
              <p className="text-sm font-semibold text-orange-300">
                {duplicateGroups.length === 0 ? 'No duplicates found ✅' : `${duplicateGroups.length} duplicate group(s) — ${duplicateIds.size} extra entries`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {duplicateIds.size > 0 && (
                <button
                  onClick={deleteAllDuplicates}
                  className="text-xs px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors"
                >
                  🗑️ Delete All {duplicateIds.size} Duplicates
                </button>
              )}
              <button onClick={() => setShowDuplicates(false)} className="text-gray-400 hover:text-white text-lg">×</button>
            </div>
          </div>
          {duplicateGroups.length > 0 && (
            <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
              {duplicateGroups.map((group, gi) => (
                <div key={gi} className="px-5 py-3 space-y-2">
                  <p className="text-xs text-orange-400 font-medium">
                    Group {gi + 1} — matched by: {(group[0].email || '').trim() ? 'email' : 'name + phone'}
                  </p>
                  {group.map((c, ci) => (
                    <div key={c.id} className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                      ci === 0 ? 'bg-emerald-900/20 border border-emerald-700/30' : 'bg-red-900/10 border border-red-700/20'
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          ci === 0 ? 'bg-emerald-800/50 text-emerald-300' : 'bg-red-800/50 text-red-300'
                        }`}>{ci === 0 ? 'Keep' : 'Duplicate'}</span>
                        <div>
                          <p className="text-sm text-gray-200">{c.name || '—'}</p>
                          <p className="text-xs text-gray-500">{c.email || '—'} · {c.phone || '—'}</p>
                        </div>
                      </div>
                      {ci !== 0 && (
                        <button
                          onClick={() => deleteSingleDuplicate(c.id)}
                          disabled={deletingIds.has(c.id)}
                          className="text-xs px-2 py-1 bg-red-900/40 hover:bg-red-900/70 text-red-400 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingIds.has(c.id) ? '...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Extracted', val: candidates.length,                                        color: 'text-blue-400',    filter: 'all'    as const },
          { label: 'Parsed OK',       val: candidates.filter(c => c.status === 'Parsed').length,     color: 'text-emerald-400', filter: 'Parsed' as const },
          { label: 'Errors',          val: candidates.filter(c => c.status === 'Error').length,      color: 'text-red-400',     filter: 'Error'  as const },
        ].map(({ label, val, color, filter }) => (
          <button
            key={label}
            onClick={() => setStatusFilter(prev => prev === filter ? 'all' : filter)}
            className={`bg-gray-900 border rounded-xl p-4 text-center transition-all hover:border-gray-600 ${
              statusFilter === filter ? 'border-gray-500 ring-1 ring-gray-500' : 'border-gray-800'
            }`}
          >
            <p className={`text-2xl font-bold ${color}`}>{val}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
            {statusFilter === filter && filter !== 'all' && (
              <p className="text-xs text-gray-500 mt-1">click to clear filter</p>
            )}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <AutocompleteCombobox
            value={search}
            onChange={setSearch}
            options={[]}
            allowCustom
            placeholder="Search by name, email, skills..."
            className="bg-gray-800 border-gray-700 text-gray-200"
          />
        </div>
        <button
          onClick={() => setShowDuplicates(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            duplicateGroups.length > 0
              ? 'bg-orange-600/20 border border-orange-600/50 text-orange-300 hover:bg-orange-600/30'
              : 'bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600'
          }`}
        >
          <Copy className="w-4 h-4" />
          Find Duplicates {duplicateGroups.length > 0 && `(${duplicateGroups.length})`}
        </button>
        <button
          onClick={toggleAll}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {selected.size === filtered.length && filtered.length > 0 ? '☑️ Deselect All' : '☐ Select All'}
        </button>
        {selected.size > 0 && (
          <>
            <button
              onClick={moveToInternal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <UserX className="w-4 h-4" />
              Move {selected.size} to Internal Pool
            </button>
            <button
              onClick={async () => {
                if (!confirm(`Delete ${selected.size} selected candidate(s)? This cannot be undone.`)) return;
                const token = getToken();
                const ids = Array.from(selected);
                await Promise.all(ids.map(id => 
                  apiFetch(`${API_ENDPOINTS.RESUME_CANDIDATES}/${id}`, { 
                    method: 'DELETE', 
                    headers: { Authorization: `Bearer ${token}` } 
                  })
                ));
                setCandidates(prev => prev.filter(c => !selected.has(c.id)));
                setSelected(new Set());
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              🗑️ Delete {selected.size} Selected
            </button>
          </>
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
                <tr><td colSpan={7} className="text-center text-gray-500 py-10 text-sm">
                  {isProcessing ? '⏳ Parsing resumes... candidates will appear shortly.' : 'No candidates found.'}
                </td></tr>
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
                      {c.status === 'Error' && (
                        <button
                          onClick={() => retryCandidate(c)}
                          disabled={retryingIds.has(c.id)}
                          className="text-xs px-2 py-1 bg-orange-900/40 hover:bg-orange-900/70 text-orange-400 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {retryingIds.has(c.id) ? '...' : '↺ Retry'}
                        </button>
                      )}
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
    apiFetch(`${API_ENDPOINTS.RESUME_CANDIDATES}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => setCandidates((Array.isArray(d) ? d : (d.candidates || [])).map((c: any) => ({ ...c, id: c.id || c._id }))))
      .catch((err) => { console.error('InternalPage fetch error:', err); setCandidates([]); })
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
    if (!confirm('Delete this candidate? This cannot be undone.')) return;
    const token = getToken();
    await apiFetch(`${API_ENDPOINTS.RESUME_CANDIDATES}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
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
        <div className="flex-1 min-w-[200px]">
          <AutocompleteCombobox
            value={search}
            onChange={setSearch}
            options={[]}
            allowCustom
            placeholder="Search by name, email, phone..."
            className="bg-gray-800 border-gray-700 text-gray-200"
          />
        </div>
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



// Persist sent email IDs across sessions
const SENT_IDS_KEY = 'talentPool_sentEmailIds';
function loadSentIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SENT_IDS_KEY) || '[]')); } catch { return new Set(); }
}
function saveSentIds(ids: Set<string>) {
  localStorage.setItem(SENT_IDS_KEY, JSON.stringify(Array.from(ids)));
}

/* ─── 4. Bulk Email Page ───────────────────────────────────────── */
function BulkEmailPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [template, setTemplate] = useState('invite');
  const [batchSize, setBatchSize] = useState(200);
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [done, setDone] = useState(false);
  const [preview, setPreview] = useState(false);
  const [search, setSearch] = useState('');
  const [sentIds, setSentIds] = useState<Set<string>>(loadSentIds);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSentCount, setLastSentCount] = useState(0);
  const [testEmail, setTestEmail] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleTestSend = async () => {
    if (!testEmail.trim()) return;
    setTestSending(true);
    setTestResult(null);
    const token = getToken();
    try {
      const res = await apiFetch(`${API_ENDPOINTS.RESUME_EMAIL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ testEmail: testEmail.trim(), template })
      });
      const data = await res.json();
      setTestResult({ ok: res.ok, msg: res.ok ? `✅ Test email sent to ${testEmail.trim()}` : `❌ ${data.error || 'Failed to send'}` });
    } catch {
      setTestResult({ ok: false, msg: '❌ Network error — check backend connection' });
    }
    setTestSending(false);
  };

  const TEMPLATE_PREVIEWS: Record<string, { subject: string; previewHtml: string }> = {
    invite: {
      subject: "You're Personally Invited to Join ZyncJobs — Your Next Career Move Awaits",
      previewHtml: `
        <div style="padding:24px 28px;">
          <h2 style="color:#1F2937;font-size:18px;font-weight:700;margin:0 0 6px;">You have been hand-picked.</h2>
          <p style="color:#374151;font-size:13px;line-height:1.7;margin:0 0 16px;">Our team reviewed your background and believes you are a strong match for roles currently open on ZyncJobs. We are reaching out personally because we think you deserve better opportunities — and we can help you find them.</p>
          <div style="background:linear-gradient(135deg,#EEF2FF 0%,#F5F3FF 100%);border:1px solid #C7D2FE;border-radius:12px;padding:16px 18px;margin:0 0 16px;">
            <p style="color:#3730A3;font-size:13px;font-weight:700;margin:0 0 10px;display:flex;align-items:center;gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="#3730A3" stroke-width="2" fill="#3730A3"/></svg> Why ZyncJobs is different:</p>
            <p style="color:#374151;font-size:12px;margin:5px 0;display:flex;align-items:center;gap:6px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg> <strong>AI-powered matching</strong> — we surface roles that fit your exact skills, not just keywords</p>
            <p style="color:#374151;font-size:12px;margin:5px 0;display:flex;align-items:center;gap:6px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg> <strong>Verified employers only</strong> — every company on our platform is screened and active</p>
            <p style="color:#374151;font-size:12px;margin:5px 0;display:flex;align-items:center;gap:6px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg> <strong>One-click apply</strong> — your uploaded resume does the work, no re-filling forms</p>
            <p style="color:#374151;font-size:12px;margin:5px 0;display:flex;align-items:center;gap:6px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg> <strong>Real-time status updates</strong> — know exactly where your application stands at all times</p>
            <p style="color:#374151;font-size:12px;margin:5px 0;display:flex;align-items:center;gap:6px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg> <strong>Free for candidates</strong> — always, no hidden fees or premium tiers</p>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
            <tr>
              <td style="width:33%;padding:4px;vertical-align:top;"><div style="border:1.5px solid #D8DCF0;border-radius:12px;padding:12px 8px;text-align:center;"><p style="color:#1F2937;font-size:11px;font-weight:700;margin:0 0 3px;">Thousands of Jobs</p><p style="color:#6B7280;font-size:10px;margin:0;">Verified openings across tech, finance, healthcare, and more</p></div></td>
              <td style="width:33%;padding:4px;vertical-align:top;"><div style="border:1.5px solid #D8DCF0;border-radius:12px;padding:12px 8px;text-align:center;"><p style="color:#1F2937;font-size:11px;font-weight:700;margin:0 0 3px;">Smart AI Match</p><p style="color:#6B7280;font-size:10px;margin:0;">Personalised recommendations updated daily based on your profile</p></div></td>
              <td style="width:33%;padding:4px;vertical-align:top;"><div style="border:1.5px solid #D8DCF0;border-radius:12px;padding:12px 8px;text-align:center;"><p style="color:#1F2937;font-size:11px;font-weight:700;margin:0 0 3px;">Instant Apply</p><p style="color:#6B7280;font-size:10px;margin:0;">Upload once, apply everywhere with a single click</p></div></td>
            </tr>
          </table>
          <hr style="border:none;border-top:1px solid #ECEEF5;margin:16px 0;"/>
          <p style="color:#1F2937;font-size:13px;font-weight:700;margin:0 0 12px;">Get hired in 3 simple steps:</p>
          <div style="border-bottom:1px solid #F3F4F6;padding:8px 0;"><p style="color:#1F2937;font-size:12px;font-weight:700;margin:0;"><span style="background:#5C6BC8;color:#fff;border-radius:50%;width:22px;height:22px;display:inline-block;text-align:center;line-height:22px;font-size:11px;font-weight:700;margin-right:8px;">1</span>Create your free profile</p><p style="color:#6B7280;font-size:11px;margin:2px 0 0 30px;">Takes under 2 minutes — just your name, email, and resume</p></div>
          <div style="border-bottom:1px solid #F3F4F6;padding:8px 0;"><p style="color:#1F2937;font-size:12px;font-weight:700;margin:0;"><span style="background:#5C6BC8;color:#fff;border-radius:50%;width:22px;height:22px;display:inline-block;text-align:center;line-height:22px;font-size:11px;font-weight:700;margin-right:8px;">2</span>Let AI find your matches</p><p style="color:#6B7280;font-size:11px;margin:2px 0 0 30px;">Our engine scans thousands of live roles and ranks the best fits for you</p></div>
          <div style="padding:8px 0;"><p style="color:#1F2937;font-size:12px;font-weight:700;margin:0;"><span style="background:#5C6BC8;color:#fff;border-radius:50%;width:22px;height:22px;display:inline-block;text-align:center;line-height:22px;font-size:11px;font-weight:700;margin-right:8px;">3</span>Apply and track your progress</p><p style="color:#6B7280;font-size:11px;margin:2px 0 0 30px;">One click to apply, then watch your pipeline update in real time</p></div>
          <div style="text-align:center;margin:16px 0;">
            <a href="https://www.zyncjobs.com/candidate-register" style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#3D5568,#2C4455);color:#fff;font-size:14px;font-weight:800;border-radius:10px;text-decoration:none;">Claim Your Free Account Now</a>
          </div>
          <div style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:10px;padding:10px 14px;margin:0 0 16px;">
            <p style="color:#92400E;font-size:11px;margin:0;display:flex;align-items:center;gap:6px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#92400E" stroke-width="2"/><polyline points="12 6 12 12 16 14" stroke="#92400E" stroke-width="2" stroke-linecap="round"/></svg> <strong>Limited-time:</strong> Candidates who register this week get priority visibility to employers actively hiring right now.</p>
          </div>
          <hr style="border:none;border-top:1px solid #ECEEF5;margin:16px 0;"/>
          <div style="background:#F0F7FF;border-radius:10px;padding:12px 16px;"><p style="color:#1F2937;font-size:12px;font-weight:700;margin:0 0 3px;">Questions? We are here to help.</p><p style="color:#6B7280;font-size:12px;margin:0;">Reply to this email or reach us at Admin@zyncjobs.com</p></div>
        </div>`
    },
    followup: {
      subject: "Following Up — Exclusive Opportunities Waiting for You on ZyncJobs",
      previewHtml: `
        <div style="padding:24px 28px;">
          <p style="color:#1F2937;font-size:15px;font-weight:700;margin:0 0 12px;">Dear Candidate,</p>
          <p style="color:#374151;font-size:13px;line-height:1.7;margin:0 0 16px;">We noticed you have not joined ZyncJobs yet. Since our last message, several new positions have been added that closely match your profile.</p>
          <div style="background:#EEF2FF;border:1px solid #C7D2FE;border-radius:12px;padding:16px 18px;margin:0 0 16px;">
            <p style="color:#3730A3;font-size:13px;font-weight:700;margin:0 0 8px;">What is waiting for you:</p>
            <p style="color:#374151;font-size:12px;margin:5px 0;">✓ Curated job matches tailored to your skills</p>
            <p style="color:#374151;font-size:12px;margin:5px 0;">✓ Opportunities with companies actively hiring now</p>
            <p style="color:#374151;font-size:12px;margin:5px 0;">✓ Streamlined application process — no lengthy forms</p>
            <p style="color:#374151;font-size:12px;margin:5px 0;">✓ Full visibility into your application pipeline</p>
          </div>
          <hr style="border:none;border-top:1px solid #ECEEF5;margin:16px 0;"/>
          <div style="text-align:center;margin:0 0 16px;">
            <a href="https://www.zyncjobs.com/candidate-register" style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#3D5568,#2C4455);color:#fff;font-size:14px;font-weight:800;border-radius:10px;text-decoration:none;">Join Now — It's Free</a>
          </div>
          <div style="background:#F0F7FF;border-radius:10px;padding:12px 16px;"><p style="color:#1F2937;font-size:12px;font-weight:700;margin:0 0 3px;">Need help getting started?</p><p style="color:#6B7280;font-size:12px;margin:0;">Admin@zyncjobs.com</p></div>
        </div>`
    },
    jobs: {
      subject: "New Job Openings Matching Your Profile — Act Now Before They're Filled",
      previewHtml: `
        <div style="padding:24px 28px;">
          <p style="color:#1F2937;font-size:15px;font-weight:700;margin:0 0 12px;">Dear Candidate,</p>
          <p style="color:#374151;font-size:13px;line-height:1.7;margin:0 0 16px;">We have identified several new job openings on ZyncJobs that closely match your skills and professional background. Roles are filling quickly!</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
            <tr>
              <td style="width:33%;padding:4px;vertical-align:top;"><div style="border:1.5px solid #D8DCF0;border-radius:12px;padding:12px 8px;text-align:center;"><p style="color:#1F2937;font-size:11px;font-weight:700;margin:0 0 3px;">Hot Roles</p><p style="color:#6B7280;font-size:10px;margin:0;">High-demand positions closing fast</p></div></td>
              <td style="width:33%;padding:4px;vertical-align:top;"><div style="border:1.5px solid #D8DCF0;border-radius:12px;padding:12px 8px;text-align:center;"><p style="color:#1F2937;font-size:11px;font-weight:700;margin:0 0 3px;">Skill Match</p><p style="color:#6B7280;font-size:10px;margin:0;">Jobs matched to your exact experience</p></div></td>
              <td style="width:33%;padding:4px;vertical-align:top;"><div style="border:1.5px solid #D8DCF0;border-radius:12px;padding:12px 8px;text-align:center;"><p style="color:#1F2937;font-size:11px;font-weight:700;margin:0 0 3px;">Quick Apply</p><p style="color:#6B7280;font-size:10px;margin:0;">Apply in under 2 minutes</p></div></td>
            </tr>
          </table>
          <div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:12px;padding:14px 18px;margin:0 0 16px;">
            <p style="color:#92400E;font-size:12px;font-weight:700;margin:0 0 6px;">Why act now?</p>
            <p style="color:#78350F;font-size:12px;margin:4px 0;">• High-demand roles close fast — early applicants have a significant advantage</p>
            <p style="color:#78350F;font-size:12px;margin:4px 0;">• Employers are actively reviewing profiles this week</p>
            <p style="color:#78350F;font-size:12px;margin:4px 0;">• Registration takes under 2 minutes</p>
          </div>
          <hr style="border:none;border-top:1px solid #ECEEF5;margin:16px 0;"/>
          <div style="text-align:center;margin:0 0 16px;">
            <a href="https://www.zyncjobs.com/job-listings" style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#3D5568,#2C4455);color:#fff;font-size:14px;font-weight:800;border-radius:10px;text-decoration:none;">View Matching Jobs</a>
          </div>
          <div style="background:#F0F7FF;border-radius:10px;padding:12px 16px;"><p style="color:#1F2937;font-size:12px;font-weight:700;margin:0 0 3px;">Need help getting started?</p><p style="color:#6B7280;font-size:12px;margin:0;">Admin@zyncjobs.com</p></div>
        </div>`
    },
  };

  useEffect(() => {
    const queuedIds: string[] = (() => { try { return JSON.parse(localStorage.getItem('talentPool_emailQueue') || '[]'); } catch { return []; } })();
    const persistedSentIds = loadSentIds();
    apiFetch(`${API_ENDPOINTS.RESUME_CANDIDATES}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        const all = (Array.isArray(d) ? d : (d.candidates || [])).map((c: any) => ({
          ...c,
          id: c.id || c._id,
          name: typeof c.name === 'object' ? (c.name?.name || c.name?.first || '') : c.name,
        }));
        setCandidates(all);
        if (queuedIds.length > 0) {
          setSelected(new Set(queuedIds));
        } else {
          // Auto-select first batch of unsent candidates so button is ready
          const unsent = all.filter((c: any) => c.email && !persistedSentIds.has(c.id));
          setSelected(new Set(unsent.slice(0, batchSize).map((c: any) => c.id)));
        }
      })
      .catch(() => setCandidates([]));
    setSentIds(persistedSentIds);
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

  // Deduplicate selected list by email before sending
  const selectedList = useMemo(() => {
    const seen = new Set<string>();
    return candidates.filter(c => {
      if (!selected.has(c.id)) return false;
      const key = (c.email || '').trim().toLowerCase() || c.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [candidates, selected]);

  const selectNextBatch = (size: number) => {
    const unsent = candidates.filter(c => c.email && !sentIds.has(c.id));
    setSelected(new Set(unsent.slice(0, size).map(c => c.id)));
  };

  const handleBatchSizeChange = (newSize: number) => {
    setBatchSize(newSize);
    // Immediately re-select with new size
    const unsent = candidates.filter(c => c.email && !sentIds.has(c.id));
    setSelected(new Set(unsent.slice(0, newSize).map(c => c.id)));
  };

  const handleSend = async () => {
    if (!selectedList.length) return;
    setSending(true);
    setDone(false);
    setSentCount(0);
    const token = getToken();
    // Send all selected as one API call (backend handles batching)
    const batches = Math.ceil(selectedList.length / 50); // internal sub-batches of 50
    setTotalBatches(batches);
    let totalSent = 0;
    const newSentIds = new Set(sentIds);

    for (let i = 0; i < batches; i++) {
      setCurrentBatch(i + 1);
      const batch = selectedList.slice(i * 50, (i + 1) * 50);
      try {
        const res = await apiFetch(`${API_ENDPOINTS.RESUME_EMAIL}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ candidateIds: batch.map((c:any) => c.id), template, batchSize: batch.length })
        });
        const data = await res.json();
        const batchSent = data.sent || batch.length;
        totalSent += batchSent;
        setSentCount(prev => prev + batchSent);
        batch.forEach((c: any) => newSentIds.add(c.id));
        setCandidates(prev => prev.map(c =>
          batch.find((b:any) => b.id === c.id) ? { ...c, emailStatus: 'Sent', emailSentAt: new Date().toISOString() } : c
        ));
      } catch {
        // continue next batch
      }
      if (i < batches - 1) await new Promise(r => setTimeout(r, 2000));
    }
    setSentIds(newSentIds);
    saveSentIds(newSentIds);
    setSending(false);
    setDone(true);
    setLastSentCount(totalSent);
    setShowSuccessModal(true);
    setSelected(new Set()); // clear selection after send
  };

  const rawSelectedCount = candidates.filter(c => selected.has(c.id)).length;
  const dedupedCount = selectedList.length;
  const progress = dedupedCount > 0 ? Math.round((sentCount / dedupedCount) * 100) : 0;
  const unsentCandidates = candidates.filter(c => c.email && !sentIds.has(c.id));

  return (
    <div className="space-y-5">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-emerald-700/50 rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-xl font-bold text-white">Emails Sent Successfully!</h3>
            <p className="text-gray-400 text-sm">
              <span className="text-emerald-400 font-semibold text-lg">{lastSentCount}</span> emails delivered successfully.
            </p>
            <div className="bg-gray-800 rounded-xl px-4 py-3 text-left space-y-1">
              <p className="text-xs text-gray-400">📊 Total emailed so far: <span className="text-white font-semibold">{sentIds.size}</span></p>
              <p className="text-xs text-gray-400">📭 Remaining unsent: <span className="text-orange-400 font-semibold">{unsentCandidates.length}</span></p>
            </div>
            {unsentCandidates.length > 0 && (
              <button
                onClick={() => { setShowSuccessModal(false); selectNextBatch(batchSize); }}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-orange-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm"
              >
                Select Next {Math.min(batchSize, unsentCandidates.length)} Unsent Candidates
              </button>
            )}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {rawSelectedCount > dedupedCount && (
        <div className="flex items-center gap-3 bg-orange-900/20 border border-orange-700/40 rounded-xl px-4 py-3">
          <Copy className="w-4 h-4 text-orange-400 shrink-0" />
          <p className="text-orange-300 text-sm">
            <span className="font-semibold">{rawSelectedCount - dedupedCount} duplicate email(s) removed</span> from send list — {dedupedCount} unique recipients will receive the email.
          </p>
        </div>
      )}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Candidates',  val: candidates.length,        color: 'text-blue-400'    },
          { label: 'Already Emailed',   val: sentIds.size,             color: 'text-emerald-400' },
          { label: 'Unsent Remaining',  val: unsentCandidates.length,  color: 'text-orange-400'  },
          { label: 'Selected Now',      val: dedupedCount,             color: 'text-purple-400'  },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.val}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-200">Select Recipients</p>
              <button
                onClick={() => selectNextBatch(batchSize)}
                disabled={unsentCandidates.length === 0}
                className="flex items-center gap-1.5 px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-600/40 text-blue-300 text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Mail className="w-3 h-3" />
                Select Next {Math.min(batchSize, unsentCandidates.length)} Unsent
              </button>
            </div>
            <div className="w-44">
              <AutocompleteCombobox
                value={search}
                onChange={setSearch}
                options={[]}
                allowCustom
                placeholder="Search..."
                className="bg-gray-800 border-gray-700 text-gray-200"
              />
            </div>
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
                    sentIds.has(c.id) || c.emailStatus === 'Sent'
                      ? 'opacity-50'
                      : selected.has(c.id) ? 'bg-blue-900/10' : ''
                  }`}>
                    <td className="px-4 py-2">
                      <input type="checkbox" checked={selected.has(c.id)}
                        onChange={() => toggleSelect(c.id)} className="accent-blue-500" />
                    </td>
                    <td className="px-4 py-2 text-gray-200">{c.name || '—'}</td>
                    <td className="px-4 py-2 text-gray-400 text-xs">{c.email || '—'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        sentIds.has(c.id) || c.emailStatus === 'Sent'
                          ? 'bg-emerald-900/40 text-emerald-400'
                          : 'bg-gray-700 text-gray-400'
                      }`}>
                        {sentIds.has(c.id) || c.emailStatus === 'Sent' ? '✓ Sent' : 'Not Sent'}
                      </span>
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
            <AutocompleteCombobox
              value={template}
              onChange={(val) => setTemplate(val)}
              options={[
                { value: 'invite', label: 'Invitation to Join ZyncJobs' },
                { value: 'followup', label: 'Follow-Up — Exclusive Opportunities' },
                { value: 'jobs', label: 'New Job Openings Matching Your Profile' },
              ]}
              placeholder="Select template..."
            />
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
              <label className="text-xs text-gray-400 mb-1 block">Select batch size</label>
              <AutocompleteCombobox
                value={String(batchSize)}
                onChange={(val) => handleBatchSizeChange(Number(val))}
                options={[
                  { value: '50', label: '50 per batch' },
                  { value: '100', label: '100 per batch' },
                  { value: '200', label: '200 per batch' },
                  { value: '500', label: '500 per batch' },
                ]}
                placeholder="Select batch size..."
              />
            </div>
            <div className="text-xs text-gray-500 bg-gray-800/50 rounded-lg px-3 py-2 space-y-1">
              <p>📦 {selectedList.length} selected to send now</p>
              <p>📭 {unsentCandidates.length} total unsent remaining</p>
              <p>✅ {sentIds.size} already emailed (tracked)</p>
            </div>
          </div>

          <div className="bg-gray-900 border border-blue-800/40 rounded-xl p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-200">🧪 Send Test Email</p>
            <p className="text-xs text-gray-500">Send the selected template to any email to preview exactly how it looks in inbox.</p>
            <input
              type="email"
              placeholder="e.g. muthees@trinitetech.com"
              value={testEmail}
              onChange={e => { setTestEmail(e.target.value); setTestResult(null); }}
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {testResult && (
              <p className={`text-xs font-medium ${testResult.ok ? 'text-emerald-400' : 'text-red-400'}`}>{testResult.msg}</p>
            )}
            <button
              onClick={handleTestSend}
              disabled={testSending || !testEmail.trim()}
              className="w-full py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              {testSending ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>

          <button
            onClick={handleSend}
            disabled={sending || !selectedList.length}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-orange-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            {sending ? `Sending ${sentCount}/${dedupedCount}...` : `Send to ${selectedList.length} Candidates`}
          </button>
        </div>
      </div>

      {sending && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300 font-medium">Sending batch {currentBatch} of {totalBatches}...</span>
            <span className="text-gray-400">{sentCount} / {dedupedCount} sent ({progress}%)</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-600 to-orange-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">⏳ Sending emails — please keep this tab open.</p>
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

            <div className="p-4">
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {/* Subject bar */}
                <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">Subject</p>
                  <p className="text-gray-800 text-sm font-semibold">{TEMPLATE_PREVIEWS[template].subject}</p>
                </div>

                {/* ── NEW BRAND DESIGN EMAIL BODY ── */}
                {/* Outer bg */}
                <div style={{ background: '#E9EBF0', padding: '20px 12px' }}>
                  <div style={{ maxWidth: 620, margin: '0 auto', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>

                    {/* Header: blue gradient + logo + paper plane */}
                    <div style={{ background: 'linear-gradient(175deg,#5C6BC8 0%,#4A58B8 50%,#6878D0 100%)', borderRadius: '20px 20px 0 0' }}>
                      {/* Logo bar */}
                      <div style={{ padding: '14px 24px 0', textAlign: 'center' }}>
                        <img src="/images/zyncjobs-logo.png" alt="ZyncJobs" style={{ height: 36, objectFit: 'contain' }} />
                      </div>
                      {/* Hero text + plane */}
                      <div style={{ padding: '16px 28px 28px', textAlign: 'center', position: 'relative' }}>
                        <div style={{ paddingRight: 44 }}>
                          <p style={{ color: '#fff', fontSize: 18, fontWeight: 800, margin: '0 0 4px' }}>
                            {template === 'invite' ? 'Welcome to Zync Jobs' : template === 'followup' ? 'Still Looking for Your Next Role?' : 'New Jobs Matching Your Profile'}
                          </p>
                          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, margin: 0 }}>
                            {template === 'invite' ? 'Your Career Journey Starts here' : template === 'followup' ? 'New opportunities are waiting for you' : 'Act now before they are filled'}
                          </p>
                        </div>
                        {/* Paper plane SVG */}
                        <div style={{ position: 'absolute', right: 16, bottom: 16 }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ transform: 'rotate(-20deg)' }}>
                            <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        {/* Decorative circle */}
                        <div style={{ position: 'absolute', bottom: 8, right: 52, width: 32, height: 32, border: '2px solid rgba(255,255,255,0.2)', borderRadius: '50%', borderTopColor: 'transparent' }} />
                      </div>
                    </div>

                {/* White body — matches actual email */}
                    <div style={{ background: '#fff' }}
                      dangerouslySetInnerHTML={{ __html: TEMPLATE_PREVIEWS[template].previewHtml }}
                    />

                    {/* Footer: dark navy */}
                    <div style={{ background: '#1E2D5A', borderRadius: '0 0 20px 20px', padding: '18px 24px', textAlign: 'center' }}>
                      <div style={{ marginBottom: 10 }}>
                        <a href="https://zyncjobs.com" style={{ color: '#A0AABF', fontSize: 12, margin: '0 8px', textDecoration: 'none' }}>Home</a>
                        <a href="https://zyncjobs.com/job-listings" style={{ color: '#A0AABF', fontSize: 12, margin: '0 8px', textDecoration: 'none' }}>Jobs</a>
                        <a href="https://zyncjobs.com/privacy" style={{ color: '#A0AABF', fontSize: 12, margin: '0 8px', textDecoration: 'none' }}>Privacy</a>
                        <a href="mailto:Admin@zyncjobs.com" style={{ color: '#A0AABF', fontSize: 12, margin: '0 8px', textDecoration: 'none' }}>Support</a>
                      </div>
                      <div style={{ borderTop: '1px solid #2E3F6E', paddingTop: 12 }}>
                        <p style={{ color: '#6B7A9F', fontSize: 11, margin: '0 0 4px' }}>2026 ZyncJobs. All rights reserved.</p>
                        <p style={{ fontSize: 11, margin: 0 }}>
                          <span style={{ color: '#6B7A9F' }}>ZyncJobs · </span>
                          <a href="mailto:Admin@zyncjobs.com" style={{ color: '#7B8FD4', textDecoration: 'none' }}>Admin@zyncjobs.com</a>
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-3 text-center">All candidates receive the same email with "Dear Candidate" greeting.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
