import React, { useState, useEffect, useMemo } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors, DragOverlay, useDroppable, useDraggable } from '@dnd-kit/core';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import ScheduleInterviewModal from '../components/ScheduleInterviewModal';
import ResumeModal from '../components/ResumeModal';
import { API_ENDPOINTS } from '../config/env';
import { Zap, X, CheckCircle, XCircle, MinusCircle, Search, Download } from 'lucide-react';

interface ApplicationManagementPageProps {
  onNavigate: (page: string, data?: any) => void;
  user?: any;
  onLogout?: () => void;
}

const COLUMNS = [
  { id: 'pending',     label: 'Applied',     color: '#6366f1', light: '#eef2ff', border: '#c7d2fe' },
  { id: 'reviewed',   label: 'Screening',   color: '#f59e0b', light: '#fffbeb', border: '#fde68a' },
  { id: 'shortlisted',label: 'Shortlisted', color: '#10b981', light: '#ecfdf5', border: '#a7f3d0' },
  { id: 'interviewed',label: 'Interview',   color: '#3b82f6', light: '#eff6ff', border: '#bfdbfe' },
  { id: 'hired',      label: 'Hired',       color: '#8b5cf6', light: '#f5f3ff', border: '#ddd6fe' },
  { id: 'rejected',   label: 'Rejected',    color: '#ef4444', light: '#fef2f2', border: '#fecaca' },
];

function KanbanCard({ application, onViewResume, onScheduleInterview, onViewProfile, onDelete }: any) {
  const appId = application.id || application._id;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: appId });
  const style = transform ? { transform: `translate(${transform.x}px,${transform.y}px)`, zIndex: 999, opacity: 0.95 } : undefined;
  const name = application.candidateName || 'Candidate';
  const initials = name.charAt(0).toUpperCase();
  const avatarColors = ['#6366f1','#10b981','#f59e0b','#3b82f6','#8b5cf6','#ef4444','#06b6d4'];
  const avatarColor = avatarColors[name.charCodeAt(0) % avatarColors.length];
  const appliedDate = application.appliedDate || application.createdAt;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white rounded-xl border border-gray-200 p-3 cursor-grab active:cursor-grabbing select-none transition-shadow ${isDragging ? 'shadow-2xl ring-2 ring-blue-400 opacity-90' : 'hover:shadow-md'}`}
    >
      <div className="flex items-center gap-2 mb-2">
        {application.candidateProfilePicture ? (
          <img src={application.candidateProfilePicture} alt={name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: avatarColor }}>
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
          <p className="text-xs text-gray-400 truncate">{application.jobTitle || 'Position'}</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 truncate mb-1">{application.candidateEmail}</p>
      {appliedDate && (
        <p className="text-xs text-gray-300 mb-3">
          {new Date(appliedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </p>
      )}
      {/* Action buttons — stop drag propagation */}
      <div className="flex flex-wrap gap-1" onPointerDown={e => e.stopPropagation()}>
        <button onClick={() => onViewProfile(application)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-1.5 py-0.5 rounded hover:bg-indigo-50">
          Profile
        </button>
        <span className="text-gray-300 text-xs">·</span>
        <button onClick={() => onViewResume(application)} className="text-xs text-blue-600 hover:text-blue-800 font-medium px-1.5 py-0.5 rounded hover:bg-blue-50">
          Resume
        </button>
        <span className="text-gray-300 text-xs">·</span>
        <button onClick={() => onScheduleInterview(application)} className="text-xs text-emerald-600 hover:text-emerald-800 font-medium px-1.5 py-0.5 rounded hover:bg-emerald-50">
          Interview
        </button>
        <span className="text-gray-300 text-xs">·</span>
        <button onClick={() => onDelete(appId)} className="text-xs text-red-500 hover:text-red-700 font-medium px-1.5 py-0.5 rounded hover:bg-red-50">
          Delete
        </button>
      </div>
    </div>
  );
}

function KanbanColumn({ col, cards, onViewResume, onScheduleInterview, onViewProfile, onDelete }: any) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div className="flex flex-col flex-shrink-0" style={{ width: 230 }}>
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: col.color }} />
        <span className="text-sm font-semibold text-gray-700">{col.label}</span>
        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: col.light, color: col.color, border: `1px solid ${col.border}` }}>
          {cards.length}
        </span>
      </div>
      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex-1 rounded-xl p-2 space-y-2 transition-all min-h-[480px]"
        style={{
          background: isOver ? '#dbeafe' : col.light,
          border: `1.5px solid ${isOver ? '#93c5fd' : col.border}`,
          boxShadow: isOver ? '0 0 0 2px #93c5fd' : undefined,
        }}
      >
        {cards.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-xs text-gray-400 italic">
            Drop here
          </div>
        ) : (
          cards.map((app: any) => (
            <KanbanCard
              key={app.id || app._id}
              application={app}
              onViewResume={onViewResume}
              onScheduleInterview={onScheduleInterview}
              onViewProfile={onViewProfile}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

const ApplicationManagementPage: React.FC<ApplicationManagementPageProps> = ({ onNavigate, user, onLogout }) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [selectedResumeApp, setSelectedResumeApp] = useState<any>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobSkills, setJobSkills] = useState<string[]>([]);
  const [aiPreview, setAiPreview] = useState<{ app: any; score: number; newStatus: string }[] | null>(null);
  const [aiRunning, setAiRunning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [interviewRounds, setInterviewRounds] = useState<Record<string, any[]>>({});

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    const storedJobId = sessionStorage.getItem('selectedJobId');
    setJobId(storedJobId);
  }, []);

  useEffect(() => {
    if (jobId) {
      fetchApplications();
      fetch(`${API_ENDPOINTS.JOBS}/${jobId}`)
        .then(r => r.ok ? r.json() : null)
        .then(job => { if (job?.skills) setJobSkills(job.skills); })
        .catch(() => {});
    }
  }, [jobId]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      if (!jobId || jobId === 'undefined' || jobId === 'null') {
        setApplications([]); setError('No job selected.'); setLoading(false); return;
      }
      const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}/job/${jobId}`);
      if (!response.ok) throw new Error('Failed to fetch applications');
      const fetched = await response.json();

      const withDetails = await Promise.all(fetched.map(async (app: any) => {
        try {
          const appJobId = app.jobId?.id || app.jobId?._id || app.jobId;
          if (!appJobId) return { ...app, jobTitle: 'Unknown Position', appliedDate: app.createdAt };
          const jobRes = await fetch(`${API_ENDPOINTS.JOBS}/${appJobId}`);
          const jobData = jobRes.ok ? await jobRes.json() : null;
          return { ...app, jobTitle: jobData?.jobTitle || jobData?.title || 'Unknown Position', appliedDate: app.createdAt };
        } catch { return { ...app, jobTitle: 'Unknown Position', appliedDate: app.createdAt }; }
      }));

      setApplications(withDetails);
      setError(null);

      // Fetch interview rounds
      const roundsMap: Record<string, any[]> = {};
      await Promise.all(withDetails.map(async (a: any) => {
        const id = a.id || a._id;
        try {
          const r = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/interviews/application/${id}`);
          roundsMap[id] = r.ok ? await r.json() : [];
        } catch { roundsMap[id] = []; }
      }));
      setInterviewRounds(roundsMap);
    } catch { setError('Failed to load applications'); setApplications([]); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.APPLICATIONS}/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, updatedBy: user?.name || 'Employer' }),
      });
      if (!res.ok) throw new Error();
      setApplications(prev => prev.map(app => (app.id || app._id) === id ? { ...app, status: newStatus } : app));
    } catch { setError('Failed to update status'); }
  };

  const deleteApplication = async (id: string) => {
    if (!window.confirm('Delete this application?')) return;
    try {
      const res = await fetch(`${API_ENDPOINTS.APPLICATIONS}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setApplications(prev => prev.filter(app => (app.id || app._id) !== id));
    } catch { setError('Failed to delete application'); }
  };

  const computeScore = (app: any, skills: string[]) => {
    if (!skills.length) return 50;
    const cs = (app.skills || []).map((s: string) => s.toLowerCase());
    const matched = skills.filter(js => cs.some((c: string) => c.includes(js.toLowerCase()) || js.toLowerCase().includes(c))).length;
    return Math.round((matched / skills.length) * 100);
  };

  const runAIShortlist = async () => {
    let skills = jobSkills;
    if (!skills.length && jobId) {
      try { const r = await fetch(`${API_ENDPOINTS.JOBS}/${jobId}`); const j = r.ok ? await r.json() : null; skills = j?.skills || []; if (skills.length) setJobSkills(skills); } catch {}
    }
    setAiPreview(applications.map(app => {
      const score = computeScore(app, skills);
      return { app, score, newStatus: score >= 50 ? 'shortlisted' : score < 30 ? 'rejected' : 'reviewed' };
    }));
  };

  const confirmAIShortlist = async () => {
    if (!aiPreview) return;
    setAiRunning(true);
    await Promise.all(aiPreview.map(({ app, newStatus }) => updateStatus(app.id || app._id, newStatus === 'rejected' ? 'ai_rejected' : newStatus)));
    setAiPreview(null); setAiRunning(false);
  };

  const downloadAllResumes = async () => {
    const appsWithResume = filtered.filter(app => app.resumeUrl && app.resumeUrl !== 'resume_from_quick_apply');
    if (!appsWithResume.length) { alert('No resumes available.'); return; }
    setBulkDownloading(true);
    for (const app of appsWithResume) {
      const url = app.resumeUrl.startsWith('http') ? app.resumeUrl : `${import.meta.env.VITE_API_URL || '/api'}/${app.resumeUrl.replace(/^\//, '')}`;
      const a = document.createElement('a'); a.href = url; a.download = `${(app.candidateName || 'candidate').replace(/\s+/g, '_')}_resume.pdf`; a.target = '_blank';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      await new Promise(r => setTimeout(r, 600));
    }
    setBulkDownloading(false);
  };

  const filtered = useMemo(() =>
    applications.filter(app =>
      !searchQuery ||
      (app.candidateName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.candidateEmail || '').toLowerCase().includes(searchQuery.toLowerCase())
    ), [applications, searchQuery]);

  const getColCards = (colId: string) => filtered.filter(a => {
    const s = a.status || 'pending';
    if (colId === 'pending') return s === 'pending' || s === 'applied';
    return s === colId;
  });

  const activeApp = activeId ? applications.find(a => (a.id || a._id) === activeId) : null;

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const newStatus = String(over.id);
    const app = applications.find(a => (a.id || a._id) === String(active.id));
    if (!app) return;
    const cur = app.status === 'applied' ? 'pending' : app.status;
    if (cur !== newStatus) updateStatus(String(active.id), newStatus);
  };

  const onViewProfile = (application: any) => {
    const cid = application.candidateEmail || application.candidateId || '';
    if (!cid) { alert('No candidate info found.'); return; }
    sessionStorage.setItem('viewCandidateData', JSON.stringify({ name: application.candidateName, email: application.candidateEmail, phone: application.candidatePhone, skills: application.skills || [] }));
    onNavigate('candidate-profile-view', { candidateId: cid });
  };

  const onViewResume = (application: any) => {
    setSelectedApplicationId(application.id || application._id);
    setSelectedResumeApp(application);
    setShowResumeModal(true);
  };

  const onScheduleInterview = (application: any) => {
    setSelectedApplication({ ...application, _id: application.id || application._id });
    setShowScheduleModal(true);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <div style={{marginLeft: '0px', marginRight: '40px', marginTop: '16px', marginBottom: '24px', padding: '24px'}}>
        <BackButton onClick={() => onNavigate('job-management')} text="Back to Job Management" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 mb-4" />

        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {sessionStorage.getItem('selectedJobTitle') || 'Applications'} — Pipeline
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{filtered.length} of {applications.length} candidates</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search candidate..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="text-sm outline-none w-40 placeholder-gray-400"
              />
            </div>
            {applications.length > 0 && (
              <>
                <button
                  onClick={downloadAllResumes}
                  disabled={bulkDownloading}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  {bulkDownloading ? 'Downloading...' : 'Download Resumes'}
                </button>
                <button
                  onClick={runAIShortlist}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700"
                >
                  <Zap className="w-4 h-4 text-yellow-300" />
                  AI Auto-Shortlist
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        {/* Kanban Board */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        {applications.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Yet</h3>
            <p className="text-gray-500 mb-4">Applications will appear here when candidates apply.</p>
            <button onClick={fetchApplications} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">Refresh</button>
          </div>
        ) : (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-6" style={{ minHeight: 560 }}>
              {COLUMNS.map(col => (
                <KanbanColumn
                  key={col.id}
                  col={col}
                  cards={getColCards(col.id)}
                  onViewResume={onViewResume}
                  onScheduleInterview={onScheduleInterview}
                  onViewProfile={onViewProfile}
                  onDelete={deleteApplication}
                />
              ))}
            </div>
            <DragOverlay>
              {activeApp ? (
                <div className="bg-white rounded-xl border-2 border-blue-400 p-3 shadow-2xl w-56 opacity-95">
                  <p className="text-sm font-semibold text-gray-900">{activeApp.candidateName || 'Candidate'}</p>
                  <p className="text-xs text-gray-400">{activeApp.jobTitle || 'Position'}</p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
        </div>{/* end kanban container */}
      </div>{/* end white container */}

<<<<<<< Updated upstream
      {/* AI Preview Modal */}
=======
                      {/* Left: Candidate Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 text-sm">{application.candidateName}</span>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            application.status === 'rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                            application.status === 'ai_rejected' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                            application.status === 'shortlisted' ? 'bg-green-100 text-green-700 border border-green-200' :
                            application.status === 'reviewed' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                            application.status === 'accepted' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                            'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            {application.status === 'ai_rejected' ? '🤖 AI Rejected' : isRejected ? '❌ ' + application.status : application.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mb-0.5">{application.candidateEmail}</div>
                        {application.candidatePhone && (
                          <div className="text-xs text-gray-400 mb-0.5">📞 {application.candidatePhone}</div>
                        )}
                        <div className="text-xs text-gray-400">
                          {application.jobTitle} · Applied {new Date(application.appliedDate).toLocaleDateString()}
                        </div>

                        {/* Interview Rounds — only for non-rejected */}
                        {!isRejected && rounds.length > 0 && (
                          <div className="mt-2">
                            <button
                              onClick={() => setExpandedAppId(expandedAppId === appId ? null : appId)}
                              className="text-xs text-blue-600 hover:underline font-medium"
                            >
                              📅 {rounds.length} Round{rounds.length > 1 ? 's' : ''} {expandedAppId === appId ? '▲' : '▼'}
                            </button>
                            {expandedAppId === appId && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {rounds.map((iv: any) => (
                                  <div key={iv.id} className="flex items-center gap-1 bg-gray-50 border rounded px-2 py-1">
                                    <span className="font-semibold text-gray-700 text-xs">{iv.round}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                      iv.status === 'completed' ? 'bg-green-100 text-green-700' :
                                      iv.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                      'bg-gray-100 text-gray-600'
                                    }`}>{iv.status}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                      iv.result === 'Pass' ? 'bg-emerald-100 text-emerald-700' :
                                      iv.result === 'Fail' ? 'bg-red-100 text-red-700' :
                                      'bg-yellow-100 text-yellow-700'
                                    }`}>{iv.result || 'Pending'}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-col gap-2 shrink-0 min-w-[160px]">
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => {
                            const app = application;
                            const cid = app.candidateEmail || app.candidateId || '';
                            if (!cid) { alert('No candidate email found for this application.'); return; }
                            sessionStorage.setItem('viewCandidateId', String(cid));
                            sessionStorage.setItem('viewCandidateData', JSON.stringify({
                              name: app.candidateName,
                              email: app.candidateEmail,
                              phone: app.candidatePhone,
                              skills: app.skills || app.candidateSkills || [],
                            }));
                            onNavigate('candidate-profile-view', { candidateId: String(cid) });
                          }}
                            className="text-indigo-600 border border-indigo-200 px-2 py-1 rounded text-xs hover:bg-indigo-50"
                          >
                            👤 Profile
                          </button>
                          <button
                            onClick={() => { setSelectedApplicationId(appId); setShowResumeModal(true); }}
                            className="text-blue-600 border border-blue-200 px-2 py-1 rounded text-xs hover:bg-blue-50"
                          >
                            📄 Resume
                          </button>

                          {/* Rejected: Contact only. Others: Schedule Round */}
                          {isRejected ? (
                            <a
                              href={`mailto:${application.candidateEmail}?subject=Regarding your application for ${application.jobTitle}`}
                              className="text-orange-600 border border-orange-200 px-2 py-1 rounded text-xs hover:bg-orange-50"
                            >
                              ✉️ Contact
                            </a>
                          ) : (
                            <button
                              onClick={() => { setSelectedApplication({ ...application, _id: appId }); setShowScheduleModal(true); }}
                              className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                            >
                              + Round
                            </button>
                          )}

                          <button
                            onClick={() => deleteApplication(appId)}
                            className="text-red-500 border border-red-200 px-2 py-1 rounded text-xs hover:bg-red-50"
                          >
                            🗑️
                          </button>
                        </div>

                        {application.status === 'ai_rejected' ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => updateApplicationStatus(appId, 'rejected')}
                              className="flex-1 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 font-semibold"
                            >
                              ✅ Confirm Reject
                            </button>
                            <button
                              onClick={() => updateApplicationStatus(appId, 'reviewed')}
                              className="flex-1 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 font-semibold"
                            >
                              ↩️ Override
                            </button>
                          </div>
                        ) : (
                          <select
                            value={application.status}
                            onChange={(e) => updateApplicationStatus(appId, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 w-full"
                            aria-label={`Update status for ${application.candidateName}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : filteredApplications.length === 0 && applications.length > 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No applications match your search.</p>
              <button onClick={() => { setSearchQuery(''); setStatusFilter('all'); }} className="mt-3 text-blue-600 text-sm hover:underline">Clear filters</button>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Found</h3>
              <p className="text-gray-500 mb-4">
                {error 
                  ? 'Unable to load applications from database. Check your backend connection.' 
                  : 'Applications will appear here when candidates apply to your jobs.'}
              </p>
              <button
                onClick={fetchApplications}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Shortlist Preview Modal */}
>>>>>>> Stashed changes
      {aiPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-indigo-600" /><h3 className="text-lg font-bold text-gray-900">AI Shortlist Preview</h3></div>
              <button onClick={() => setAiPreview(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 bg-indigo-50 border-b text-sm text-indigo-700">
              {jobSkills.length > 0 ? <>Scoring against <strong>{jobSkills.length} skills</strong>: {jobSkills.slice(0,5).join(', ')}{jobSkills.length > 5 ? ` +${jobSkills.length-5} more` : ''}</> : 'No job skills found — using profile completeness'}
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {aiPreview.map(({ app, score, newStatus }) => (
                <div key={app.id || app._id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border">
                  <div><div className="font-medium text-gray-900 text-sm">{app.candidateName}</div><div className="text-xs text-gray-400">{app.candidateEmail}</div></div>
                  <div className="flex items-center gap-3">
                    <div className="text-right"><div className="text-xs text-gray-500">Score</div><div className={`font-bold text-sm ${score >= 50 ? 'text-emerald-600' : score >= 30 ? 'text-amber-600' : 'text-red-500'}`}>{score}%</div></div>
                    <div className={`flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${newStatus === 'shortlisted' ? 'bg-emerald-100 text-emerald-700' : newStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {newStatus === 'shortlisted' ? <CheckCircle className="w-3.5 h-3.5" /> : newStatus === 'rejected' ? <XCircle className="w-3.5 h-3.5" /> : <MinusCircle className="w-3.5 h-3.5" />}
                      {newStatus}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex items-center justify-between gap-3">
              <div className="text-xs text-gray-500">✅ {aiPreview.filter(p => p.newStatus === 'shortlisted').length} shortlisted &nbsp; 🔶 {aiPreview.filter(p => p.newStatus === 'reviewed').length} reviewed &nbsp; ❌ {aiPreview.filter(p => p.newStatus === 'rejected').length} rejected</div>
              <div className="flex gap-2">
                <button onClick={() => setAiPreview(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button onClick={confirmAIShortlist} disabled={aiRunning} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
                  {aiRunning ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Applying...</> : 'Confirm & Apply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ResumeModal
        applicationId={selectedApplicationId}
        isOpen={showResumeModal}
        onClose={() => { setShowResumeModal(false); setSelectedApplicationId(null); setSelectedResumeApp(null); }}
        resumeUrl={selectedResumeApp?.resumeUrl}
        candidateName={selectedResumeApp?.candidateName}
        candidateEmail={selectedResumeApp?.candidateEmail}
      />

      {showScheduleModal && selectedApplication && (
        <ScheduleInterviewModal
          application={selectedApplication}
          existingRounds={(interviewRounds[selectedApplication._id] || []).map((iv: any) => iv.round)}
          onClose={() => { setShowScheduleModal(false); setSelectedApplication(null); }}
          onSuccess={() => fetchApplications()}
        />
      )}

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default ApplicationManagementPage;
