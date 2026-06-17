import React, { useState, useEffect, useMemo } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors, DragOverlay, useDroppable, useDraggable } from '@dnd-kit/core';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ScheduleInterviewModal from '../components/ScheduleInterviewModal';
import ResumeModal from '../components/ResumeModal';
import { API_ENDPOINTS } from '../config/env';
import { Zap, X, CheckCircle, XCircle, MinusCircle, Search, Download } from 'lucide-react';
import CandidateProfileView from './CandidateProfileView';
import ConfirmDialog from '../components/ConfirmDialog';
import BackButton from '../components/BackButton';

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

function KanbanCard({ application, onViewResume, onScheduleInterview, onViewProfile, onDelete, isViewer }: any) {
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
        {!isViewer && (<>
        <span className="text-gray-300 text-xs">·</span>
        <button onClick={() => onScheduleInterview(application)} className="text-xs text-emerald-600 hover:text-emerald-800 font-medium px-1.5 py-0.5 rounded hover:bg-emerald-50">
          Interview
        </button>
        <span className="text-gray-300 text-xs">·</span>
        <button onClick={() => onDelete(appId)} className="text-xs text-red-500 hover:text-red-700 font-medium px-1.5 py-0.5 rounded hover:bg-red-50">
          Delete
        </button>
        </>)}
      </div>
    </div>
  );
}

function KanbanColumn({ col, cards, onViewResume, onScheduleInterview, onViewProfile, onDelete, isViewer }: any) {
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
              isViewer={isViewer}
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
  const [viewingCandidateId, setViewingCandidateId] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [selectedResumeApp, setSelectedResumeApp] = useState<any>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobSkills, setJobSkills] = useState<string[]>([]);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [aiPreview, setAiPreview] = useState<{ app: any; score: number; newStatus: string; recommendation?: string; aiSummary?: string; breakdown?: any }[] | null>(null);
  const [aiRunning, setAiRunning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [interviewRounds, setInterviewRounds] = useState<Record<string, any[]>>({});
  const isViewer = (user?.teamRole === 'Viewer') || false; 

  const [confirm, setConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (jobId) {
      fetchApplications();
      fetch(`${API_ENDPOINTS.JOBS}/${jobId}`)
        .then(r => r.ok ? r.json() : null)
        .then(job => {
          if (job?.skills) setJobSkills(job.skills);
          if (job?.jobDescription) setJobDescription(job.jobDescription);
          else if (job?.description) setJobDescription(job.description);
        })
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

  const deleteApplication = (id: string) => {
    setConfirm({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    const id = confirm.id;
    setConfirm({ isOpen: false, id: null });
    if (!id) return;
    try {
      const res = await fetch(`${API_ENDPOINTS.APPLICATIONS}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setApplications(prev => prev.filter(app => (app.id || app._id) !== id));
    } catch { setError('Failed to delete application'); }
  };

  const normalizeSkillArray = (skills: any): string[] => {
    if (!Array.isArray(skills)) return [];
    return skills.map((skill: any) => String(skill || '').trim().toLowerCase()).filter(Boolean);
  };

  const profileCompletenessScore = (app: any) => {
    const checks = [
      !!app.candidateName,
      !!app.candidateEmail,
      !!app.candidatePhone,
      !!app.resumeUrl,
      !!app.candidateExperience,
      !!app.candidateEducation,
      Array.isArray(app.skills) && app.skills.length > 0,
    ];
    const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
    return score;
  };

  const buildCandidateResumeText = (app: any) => {
    const skills = normalizeSkillArray(app.skills || app.candidateSkills || []);
    const details = [
      app.candidateName ? `Name: ${app.candidateName}` : null,
      app.candidateEmail ? `Email: ${app.candidateEmail}` : null,
      app.candidatePhone ? `Phone: ${app.candidatePhone}` : null,
      app.candidateExperience ? `Experience: ${app.candidateExperience}` : null,
      app.candidateEducation ? `Education: ${app.candidateEducation}` : null,
      skills.length ? `Skills: ${skills.join(', ')}` : null,
      app.resumeUrl ? `Resume: ${app.resumeUrl}` : null,
    ].filter(Boolean);
    return details.join('\n');
  };

  const computeScore = (app: any, skills: string[]) => {
    const candidateSkills = normalizeSkillArray(app.skills || app.candidateSkills || []);
    if (!skills.length) return profileCompletenessScore(app);
    const normalizedJobSkills = normalizeSkillArray(skills);
    const matched = normalizedJobSkills.filter(js => candidateSkills.some(cs => cs.includes(js) || js.includes(cs))).length;
    return Math.round((matched / Math.max(normalizedJobSkills.length, 1)) * 100);
  };

  const runAIShortlist = async () => {
    if (!applications.length) return;
    setAiRunning(true);

    let skills = jobSkills;
    if (!skills.length && jobId) {
      try {
        const r = await fetch(`${API_ENDPOINTS.JOBS}/${jobId}`);
        const j = r.ok ? await r.json() : null;
        skills = j?.skills || [];
        if (skills.length) setJobSkills(skills);
        if (j?.jobDescription) setJobDescription(j.jobDescription);
        else if (j?.description) setJobDescription(j.description);
      } catch {
        skills = jobSkills;
      }
    }

    const jobDesc = jobDescription || `Job skills: ${skills.join(', ')}`;
    const preview = await Promise.all(applications.map(async (app: any) => {
      let score = computeScore(app, skills);
      let recommendation: string | undefined;
      let aiSummary: string | undefined;
      let breakdown: any;

      try {
        const response = await fetch(`${API_ENDPOINTS.AI_FLOW_SCORE_CANDIDATE}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobDescription: jobDesc,
            candidateResume: buildCandidateResumeText(app),
            jobId,
            candidateId: app.candidateId || app.id || app._id,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (typeof data.overallScore === 'number') {
            score = data.overallScore;
            recommendation = data.recommendation;
            aiSummary = data.aiSummary;
            breakdown = data.breakdown;
          }
        }
      } catch (error) {
        console.error('AI Auto-Shortlist preview failed', error);
      }

      const newStatus = score >= 50 ? 'shortlisted' : score < 30 ? 'rejected' : 'reviewed';
      return { app, score, newStatus, recommendation, aiSummary, breakdown };
    }));

    setAiPreview(preview);
    setAiRunning(false);
  };

  const confirmAIShortlist = async () => {
    if (!aiPreview) return;
    setAiRunning(true);
    await Promise.all(aiPreview.map(({ app, newStatus }) => updateStatus(app.id || app._id, newStatus === 'rejected' ? 'ai_rejected' : newStatus)));
    setAiPreview(null); setAiRunning(false);
  };

  const downloadAllResumes = async () => {
    if (!filtered.length) { alert('No applications available.'); return; }
    if (!jobId) { alert('No job selected.'); return; }
    setBulkDownloading(true);
    try {
      const jobTitle = sessionStorage.getItem('selectedJobTitle') || 'job';
      const url = `${API_ENDPOINTS.APPLICATIONS}/job/${jobId}/bulk-download-resumes`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'No resumes available to download.');
        return;
      }
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${jobTitle.replace(/\s+/g, '_')}_resumes.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (e) {
      alert('Failed to download resumes. Please try again.');
    } finally {
      setBulkDownloading(false);
    }
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

  useEffect(() => {
    const storedJobId = sessionStorage.getItem('selectedJobId');
    setJobId(storedJobId);
  }, []);

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (isViewer) return;
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
    setViewingCandidateId(cid);
  };

  const onViewResume = (application: any) => {
    setSelectedApplicationId(application.id || application._id || null);
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
      {viewingCandidateId && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-white">
          <CandidateProfileView
            candidateId={viewingCandidateId}
            onNavigate={onNavigate}
            onBack={() => setViewingCandidateId(null)}
          />
        </div>
      )}
      {!viewingCandidateId && (<>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <div style={{marginLeft: '0px', marginRight: '40px', marginTop: '16px', marginBottom: '24px', padding: '24px'}}>
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <BackButton onClick={() => onNavigate('job-management')} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {sessionStorage.getItem('selectedJobTitle') || 'Applications'} — Pipeline
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">{filtered.length} of {applications.length} candidates</p>
            </div>
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
                  {bulkDownloading ? 'Preparing ZIP...' : 'Download Resumes'}
                </button>
                <button
                  onClick={runAIShortlist}
                  disabled={aiRunning}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Zap className="w-4 h-4 text-yellow-300" />
                  {aiRunning ? 'Generating AI Preview...' : 'AI Auto-Shortlist'}
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
                  isViewer={isViewer}
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

      <ConfirmDialog
        isOpen={confirm.isOpen}
        title="Delete Application"
        message="Delete this application? This action cannot be undone."
        confirmLabel="OK"
        onConfirm={confirmDelete}
        onCancel={() => setConfirm({ isOpen: false, id: null })}
      />
      </>)}
    </div>
  );
};

export default ApplicationManagementPage;
