import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Download, X, ChevronLeft, ChevronRight, MapPin,
  Briefcase, Mail, Phone, Building2, FileText, User, AlertCircle, Loader2, Upload
} from 'lucide-react';
import { API_ENDPOINTS } from '../../../config/env';
import { apiFetch } from '../../../api/apiFetch';

interface Props {
  onUnauthorized: () => void;
  onNavigateToTalentPool?: () => void;
}

interface SkillCount {
  name: string;
  count: number;
}

interface WorkExp {
  jobTitle?: string;
  company?: string;
  date?: string;
  descriptions?: string[];
}

interface Education {
  degree?: string;
  school?: string;
  date?: string;
  grade?: string;
}

interface Project {
  name?: string;
  description?: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  jobTitle: string;
  currentCompany: string;
  location: string;
  country: string;
  summary: string;
  skills: string[];
  totalExperience: number | null;
  workExperiences: WorkExp[];
  internships: WorkExp[];
  languages: string[];
  awards: string[];
  educations: Education[];
  projects: Project[];
  resumeUrl: string;
  resumeFile: string;
  resumeOriginalName: string;
  parserStatus: string;
  parserError: string;
  retryCount: number;
  addedDate: string | null;
}

interface SearchResponse {
  candidates: Candidate[];
  total: number;
  page: number;
  limit: number;
}

const EXPORT_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'location', label: 'Location' },
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'currentCompany', label: 'Current Company' },
  { key: 'skills', label: 'Skills' },
  { key: 'totalExperience', label: 'Experience (Years)' },
  { key: 'gender', label: 'Gender' },
  { key: 'dob', label: 'Date of Birth' },
  { key: 'summary', label: 'Summary' },
  { key: 'resumeUrl', label: 'Resume URL' }
];

const DEFAULT_EXPORT_FIELDS = ['name', 'phone', 'email', 'location', 'jobTitle', 'skills', 'totalExperience'];

const inputCls = "w-full bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none";
const btnPrimary = "flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const btnSecondary = "flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm font-medium rounded-lg transition-colors";
const card = "bg-gray-900 border border-gray-800 rounded-xl";

export default function RecruiterSearchSection({ onUnauthorized, onNavigateToTalentPool }: Props) {
  const [q, setQ] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [gender, setGender] = useState('');
  const [expMin, setExpMin] = useState('');
  const [expMax, setExpMax] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillOptions, setSkillOptions] = useState<SkillCount[]>([]);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const [profileCandidate, setProfileCandidate] = useState<Candidate | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFields, setExportFields] = useState<string[]>(DEFAULT_EXPORT_FIELDS);
  const [exporting, setExporting] = useState(false);
  const [processing, setProcessing] = useState<{ isProcessing: boolean; processed: number; total: number; success: number; failed: number; progress: number } | null>(null);

  const limit = 10;
  const searchSeq = useRef(0);

  const fetchSkills = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/admin/talent/skills`, { headers: {} });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.skills)) setSkillOptions(data.skills);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchSkills();
    const poll = async () => {
      try {
        const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/admin/talent/processing-status`, { headers: {} });
        if (!res.ok) return;
        const data = await res.json();
        if (data.isProcessing) {
          setProcessing(data);
        } else if (processing) {
          setProcessing(null);
        }
      } catch { /* ignore */ }
    };
    poll();
    const timer = setInterval(poll, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSearch = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    const seq = ++searchSeq.current;
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (jobTitle.trim()) params.set('jobTitle', jobTitle.trim());
    if (location.trim()) params.set('location', location.trim());
    if (gender) params.set('gender', gender);
    if (expMin) params.set('expMin', expMin);
    if (expMax) params.set('expMax', expMax);
    if (selectedSkills.length) params.set('skills', selectedSkills.join(','));
    params.set('page', String(targetPage));
    params.set('limit', String(limit));
    try {
      const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/admin/talent/search?${params.toString()}`, { headers: {} });
      if (res.status === 401) { onUnauthorized(); return; }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Search failed');
        return;
      }
      const data: SearchResponse = await res.json();
      if (seq !== searchSeq.current) return;
      setCandidates(data.candidates);
      setTotal(data.total);
      setPage(data.page);
      setSearched(true);
    } catch (err) {
      if (seq === searchSeq.current) setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      if (seq === searchSeq.current) setLoading(false);
    }
  }, [q, jobTitle, location, gender, expMin, expMax, selectedSkills, onUnauthorized]);

  const handleAddSkill = () => {
    const skill = skillInput.trim();
    if (!skill) return;
    if (!selectedSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
      setSelectedSkills([...selectedSkills, skill]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill));
  };

  const resetFilters = () => {
    setQ(''); setJobTitle(''); setLocation(''); setGender(''); setExpMin(''); setExpMax('');
    setSelectedSkills([]); setSkillInput('');
    setSearched(false);
    setCandidates([]);
    setTotal(0);
    setPage(1);
  };

  const handleExport = async () => {
    if (!exportFields.length) return;
    setExporting(true);
    setError(null);
    const filters: Record<string, string> = {};
    if (q.trim()) filters.q = q.trim();
    if (jobTitle.trim()) filters.jobTitle = jobTitle.trim();
    if (location.trim()) filters.location = location.trim();
    if (gender) filters.gender = gender;
    if (expMin) filters.expMin = expMin;
    if (expMax) filters.expMax = expMax;
    if (selectedSkills.length) filters.skills = selectedSkills.join(',');
    try {
      const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/admin/talent/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, fields: exportFields })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Export failed');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `recruiter-export-${date}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setExportOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const toggleExportField = (key: string) => {
    setExportFields(prev => prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-400" /> Recruiter Search
          </h2>
          <p className="text-sm text-gray-400 mt-1">Search across parsed candidates by title, skills and experience</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setExportOpen(true)} className={btnPrimary}>
            <Download size={15} /> Export CSV
          </button>
          <button onClick={onNavigateToTalentPool} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white text-sm font-medium rounded-lg shadow-lg hover:opacity-90 transition-opacity">
            <Upload size={15} /> Upload Resumes
          </button>
        </div>
      </div>

      {processing?.isProcessing && (
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap text-sm text-blue-300">
            <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Processing resumes...</span>
            <span>{processing.processed}/{processing.total} · {processing.success} ok · {processing.failed} failed</span>
          </div>
          <div className="h-1.5 bg-blue-900/50 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all" style={{ width: `${processing.progress}%` }} />
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div className={`${card} p-4 space-y-3`}>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') runSearch(1); }}
              placeholder="Search keyword — e.g. Java Developer, Spring Boot, AWS..."
              className={`${inputCls} pl-9`}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => runSearch(1)} disabled={loading} className={btnPrimary}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search size={16} />} Search
            </button>
            <button onClick={resetFilters} className={btnSecondary}>
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 items-end">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Job Title</label>
            <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Java Developer" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Chennai" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Gender</label>
            <select value={gender} onChange={e => setGender(e.target.value)} className={`${inputCls} appearance-none`}>
              <option value="">Any</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Experience Min (yrs)</label>
            <input type="number" min={0} value={expMin} onChange={e => setExpMin(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Experience Max (yrs)</label>
            <input type="number" min={0} value={expMax} onChange={e => setExpMax(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Skills (normalized)</label>
            <div className="flex gap-1">
              <input list="skill-suggestions" value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                placeholder="Add skill..."
                className={`${inputCls} flex-1 min-w-0`} />
              <button onClick={handleAddSkill} className="px-2.5 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-200 hover:bg-gray-600">+</button>
            </div>
            <datalist id="skill-suggestions">
              {skillOptions.map(s => <option key={s.name} value={s.name} />)}
            </datalist>
          </div>
        </div>

        {selectedSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedSkills.map(s => (
              <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs rounded-full">
                {s}
                <button onClick={() => handleRemoveSkill(s)} className="text-blue-400 hover:text-blue-200"><X size={12} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-sm text-red-300">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <div className="text-sm text-gray-400">
          <span className="font-semibold text-white">{total}</span> candidates found
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Searching...
        </div>
      ) : searched && candidates.length === 0 ? (
        <div className={`text-center py-16 text-gray-500 border border-dashed border-gray-800 rounded-xl`}>
          <User className="w-10 h-10 mx-auto mb-2 text-gray-600" />
          <p>No candidates match your search. Try removing some filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {candidates.map(c => (
            <div key={c.id} className={`${card} p-4 hover:border-gray-700 transition-colors`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-white truncate">{c.name || 'Unnamed candidate'}</h3>
                  <p className="text-sm text-blue-400 flex items-center gap-1 mt-0.5">
                    <Briefcase size={13} /> {c.jobTitle || 'Title not found'}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} /> {c.location || 'Location not found'}{c.country ? `, ${c.country}` : ''}
                  </p>
                  {c.currentCompany && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Building2 size={12} /> {c.currentCompany}
                    </p>
                  )}
                </div>
                {c.totalExperience !== null && c.totalExperience !== undefined && (
                  <span className="shrink-0 px-2.5 py-1 bg-emerald-900/40 border border-emerald-700/50 text-emerald-400 text-xs font-semibold rounded-full">
                    {c.totalExperience} yrs
                  </span>
                )}
              </div>

              {c.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {c.skills.slice(0, 8).map(s => (
                    <span key={s} className="px-2 py-0.5 bg-gray-800 text-gray-300 text-xs rounded">{s}</span>
                  ))}
                  {c.skills.length > 8 && (
                    <span className="px-2 py-0.5 text-xs text-gray-500">+{c.skills.length - 8} more</span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 mt-4">
                <button onClick={() => setProfileCandidate(c)}
                  className="flex-1 px-3 py-1.5 bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs font-medium rounded-lg hover:bg-blue-900/60">
                  View Profile
                </button>
                {c.resumeUrl && (
                  <a href={`${API_ENDPOINTS.BASE_URL}/admin/talent/resume/${c.id}`} target="_blank" rel="noopener noreferrer"
                    className="flex-1 px-3 py-1.5 bg-gray-800 border border-gray-700 text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-700 text-center flex items-center justify-center gap-1">
                    <FileText size={13} /> View Resume
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {searched && total > limit && (
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button onClick={() => runSearch(page - 1)} disabled={page <= 1}
            className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 disabled:opacity-40">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
          <button onClick={() => runSearch(page + 1)} disabled={page >= totalPages}
            className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 disabled:opacity-40">
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Profile modal */}
      {profileCandidate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setProfileCandidate(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between px-5 py-4 border-b border-gray-800">
              <div className="min-w-0">
                <h3 className="font-semibold text-white">{profileCandidate.name || 'Unnamed candidate'}</h3>
                <p className="text-sm text-blue-400">{profileCandidate.jobTitle || 'Title not found'}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-400">
                  {profileCandidate.location && <span className="flex items-center gap-1"><MapPin size={11} /> {profileCandidate.location}</span>}
                  {profileCandidate.email && <span className="flex items-center gap-1"><Mail size={11} /> {profileCandidate.email}</span>}
                  {profileCandidate.phone && <span className="flex items-center gap-1"><Phone size={11} /> {profileCandidate.phone}</span>}
                  {profileCandidate.gender && <span>{profileCandidate.gender}</span>}
                  {profileCandidate.dob && <span>DOB: {profileCandidate.dob}</span>}
                  {profileCandidate.totalExperience !== null && profileCandidate.totalExperience !== undefined && <span>{profileCandidate.totalExperience} yrs exp</span>}
                </div>
              </div>
              <button onClick={() => setProfileCandidate(null)} className="text-gray-400 hover:text-white shrink-0"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto p-5 space-y-5">
              {profileCandidate.summary && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Summary</h4>
                  <p className="text-sm text-gray-300">{profileCandidate.summary}</p>
                </div>
              )}
              {profileCandidate.skills.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {profileCandidate.skills.map(s => (
                      <span key={s} className="px-2 py-0.5 bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs rounded">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {profileCandidate.workExperiences.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Work Experience</h4>
                  <div className="space-y-3">
                    {profileCandidate.workExperiences.map((exp, i) => (
                      <div key={i} className="border-l-2 border-blue-700 pl-3">
                        <p className="text-sm font-medium text-gray-100">{exp.jobTitle || 'Role'}{exp.company ? ` · ${exp.company}` : ''}</p>
                        {exp.date && <p className="text-xs text-gray-500">{exp.date}</p>}
                        {exp.descriptions && exp.descriptions.length > 0 && (
                          <ul className="list-disc ml-4 mt-1 text-xs text-gray-400 space-y-0.5">
                            {exp.descriptions.slice(0, 5).map((d, j) => <li key={j}>{d}</li>)}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {profileCandidate.internships.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Internships</h4>
                  <div className="space-y-3">
                    {profileCandidate.internships.map((exp, i) => (
                      <div key={i} className="border-l-2 border-orange-700/70 pl-3">
                        <p className="text-sm font-medium text-gray-100">{exp.jobTitle || 'Role'}{exp.company ? ` · ${exp.company}` : ''}</p>
                        {exp.date && <p className="text-xs text-gray-500">{exp.date}</p>}
                        {exp.descriptions && exp.descriptions.length > 0 && (
                          <ul className="list-disc ml-4 mt-1 text-xs text-gray-400 space-y-0.5">
                            {exp.descriptions.slice(0, 5).map((d, j) => <li key={j}>{d}</li>)}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {profileCandidate.educations.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Education</h4>
                  <div className="space-y-1.5">
                    {profileCandidate.educations.map((edu, i) => (
                      <p key={i} className="text-sm text-gray-300">
                        {edu.degree}{edu.school ? ` — ${edu.school}` : ''}{edu.date ? ` (${edu.date})` : ''}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {profileCandidate.projects.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Projects</h4>
                  <div className="space-y-1.5">
                    {profileCandidate.projects.map((p, i) => (
                      <p key={i} className="text-sm text-gray-300"><span className="font-medium text-white">{p.name}</span>{p.description ? ` — ${p.description}` : ''}</p>
                    ))}
                  </div>
                </div>
              )}
              {profileCandidate.languages.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Languages</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {profileCandidate.languages.map(l => (
                      <span key={l} className="px-2 py-0.5 bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded">{l}</span>
                    ))}
                  </div>
                </div>
              )}
              {profileCandidate.awards.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Awards</h4>
                  <div className="space-y-1.5">
                    {profileCandidate.awards.map((a, i) => (
                      <p key={i} className="text-sm text-gray-300">• {a}</p>
                    ))}
                  </div>
                </div>
              )}
              {profileCandidate.resumeUrl && (
                <a href={`${API_ENDPOINTS.BASE_URL}/admin/talent/resume/${profileCandidate.id}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                  <FileText size={15} /> View Original Resume
                </a>
              )}
              {profileCandidate.parserError && (
                <div className="flex items-center gap-2 p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg text-xs text-amber-300">
                  <AlertCircle size={14} /> {profileCandidate.parserError} (retries: {profileCandidate.retryCount})
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export modal */}
      {exportOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setExportOpen(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
              <h3 className="font-semibold text-white flex items-center gap-2"><Download size={18} className="text-blue-400" /> Export CSV</h3>
              <button onClick={() => setExportOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto p-5">
              <p className="text-sm text-gray-400 mb-3">Select fields to include in the export ({total} matching candidates):</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {EXPORT_FIELDS.map(f => (
                  <label key={f.key} className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm cursor-pointer ${exportFields.includes(f.key) ? 'border-blue-600 bg-blue-900/30' : 'border-gray-700 bg-gray-800/50'}`}>
                    <input type="checkbox" checked={exportFields.includes(f.key)} onChange={() => toggleExportField(f.key)} className="accent-blue-500" />
                    <span className="text-gray-200">{f.label}</span>
                  </label>
                ))}
              </div>
              {error && (
                <div className="flex items-center gap-2 mt-3 p-2.5 bg-red-900/30 border border-red-700/50 rounded-lg text-xs text-red-300">
                  <AlertCircle size={13} /> {error}
                </div>
              )}
              <div className="flex gap-2 mt-5">
                <button onClick={handleExport} disabled={!exportFields.length || exporting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download size={15} />} Download CSV
                </button>
                <button onClick={() => setExportOpen(false)} className={btnSecondary}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}