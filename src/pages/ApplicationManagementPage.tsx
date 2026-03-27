import React, { useState, useEffect, useMemo } from 'react';
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

const ApplicationManagementPage: React.FC<ApplicationManagementPageProps> = ({ 
  onNavigate, 
  user, 
  onLogout 
}) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobSkills, setJobSkills] = useState<string[]>([]);
  const [aiPreview, setAiPreview] = useState<{ app: any; score: number; newStatus: string }[] | null>(null);
  const [aiRunning, setAiRunning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [interviewRounds, setInterviewRounds] = useState<Record<string, any[]>>({});
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [bulkDownloading, setBulkDownloading] = useState(false);

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const matchesSearch = !searchQuery ||
        (app.candidateName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.candidateEmail || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  useEffect(() => {
    // Get jobId from sessionStorage
    const storedJobId = sessionStorage.getItem('selectedJobId');
    console.log('📋 SessionStorage jobId:', storedJobId);
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

  const computeScore = (app: any, skills: string[]): number => {
    if (!skills.length) return 50;
    const candSkills: string[] = (app.skills || []).map((s: string) => s.toLowerCase());
    const matched = skills.filter(js =>
      candSkills.some(cs => cs.includes(js.toLowerCase()) || js.toLowerCase().includes(cs))
    ).length;
    return Math.round((matched / skills.length) * 100);
  };

  const runAIShortlist = async () => {
    let skills = jobSkills;
    if (!skills.length && jobId) {
      try {
        const r = await fetch(`${API_ENDPOINTS.JOBS}/${jobId}`);
        const job = r.ok ? await r.json() : null;
        skills = job?.skills || [];
        if (skills.length) setJobSkills(skills);
      } catch {}
    }
    const preview = applications.map(app => {
      const score = computeScore(app, skills);
      const newStatus = score >= 50 ? 'shortlisted' : score < 30 ? 'rejected' : 'reviewed';
      return { app, score, newStatus };
    });
    setAiPreview(preview);
  };

  const confirmAIShortlist = async () => {
    if (!aiPreview) return;
    setAiRunning(true);
    await Promise.all(
      aiPreview.map(({ app, newStatus }) =>
        updateApplicationStatus(app.id || app._id, newStatus === 'rejected' ? 'ai_rejected' : newStatus)
      )
    );
    setAiPreview(null);
    setAiRunning(false);
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      
      console.log('📋 Fetching applications for jobId:', jobId);
      
      if (!jobId || jobId === 'undefined' || jobId === 'null') {
        console.error('❌ Invalid jobId:', jobId);
        setApplications([]);
        setError('No job selected. Please select a job from Job Management.');
        setLoading(false);
        return;
      }
      
      console.log('🔍 Calling API:', `${API_ENDPOINTS.APPLICATIONS}/job/${jobId}`);
      
      // Fetch applications from API
      const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}/job/${jobId}`);
      
      if (!response.ok) {
        console.error('❌ API Error:', response.status, response.statusText);
        throw new Error('Failed to fetch applications');
      }
      
      const fetchedApplications = await response.json();
      console.log('✅ Applications fetched:', fetchedApplications.length);
      
      // Transform applications to include job details
      const applicationsWithJobDetails = await Promise.all(
        fetchedApplications.map(async (app: any) => {
          try {
            // Use id or _id for Sequelize/MongoDB compatibility
            const appJobId = app.jobId?.id || app.jobId?._id || app.jobId;
            if (!appJobId) {
              console.log('⚠️ Application without jobId:', app);
              return {
                ...app,
                jobTitle: 'Unknown Position',
                company: 'Unknown Company',
                appliedDate: app.createdAt || app.appliedDate
              };
            }
            
            console.log('🔍 Fetching job details for:', appJobId);
            const jobResponse = await fetch(`${API_ENDPOINTS.JOBS}/${appJobId}`);
            const jobData = jobResponse.ok ? await jobResponse.json() : null;
            
            console.log('✅ Job data:', jobData);
            
            return {
              ...app,
              jobTitle: jobData?.jobTitle || jobData?.title || 'Unknown Position',
              company: jobData?.company || 'Unknown Company',
              appliedDate: app.createdAt || app.appliedDate
            };
          } catch (error) {
            console.error('Error fetching job details:', error);
            return {
              ...app,
              jobTitle: 'Unknown Position',
              company: 'Unknown Company',
              appliedDate: app.createdAt || app.appliedDate
            };
          }
        })
      );
      
      setApplications(applicationsWithJobDetails);
      setError(null);

      // Fetch interview rounds for each application
      const ids = applicationsWithJobDetails.map((a: any) => a.id || a._id).filter(Boolean);
      const roundsMap: Record<string, any[]> = {};
      await Promise.all(
        ids.map(async (id: string) => {
          try {
            const r = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/interviews/application/${id}`);
            if (r.ok) roundsMap[id] = await r.json();
            else roundsMap[id] = [];
          } catch { roundsMap[id] = []; }
        })
      );
      setInterviewRounds(roundsMap);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError('Failed to load applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          note: `Status updated to ${newStatus}`,
          updatedBy: user?.name || 'Employer'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update application status');
      }
      
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          (app.id || app._id) === id ? { ...app, status: newStatus } : app
        )
      );
    } catch (error) {
      console.error('Error updating application status:', error);
      setError('Failed to update application status');
    }
  };

  const deleteApplication = async (id: string) => {
    const ok = await (window as any).confirmAsync('Are you sure you want to delete this application?');
    if (!ok) return;
    try {
      const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete application');
      }
      
      // Update local state
      setApplications(prev => prev.filter(app => (app.id || app._id) !== id));
    } catch (error) {
      console.error('Error deleting application:', error);
      setError('Failed to delete application');
    }
  };

  const downloadAllResumes = async () => {
    const appsWithResume = filteredApplications.filter(app => app.resumeUrl && app.resumeUrl !== 'resume_from_quick_apply');
    if (!appsWithResume.length) {
      alert('No resumes available for the current filtered applicants.');
      return;
    }
    setBulkDownloading(true);
    for (let i = 0; i < appsWithResume.length; i++) {
      const app = appsWithResume[i];
      const url = app.resumeUrl.startsWith('http') ? app.resumeUrl : `${import.meta.env.VITE_API_URL || '/api'}/${app.resumeUrl.replace(/^\//, '')}`;
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(app.candidateName || 'candidate').replace(/\s+/g, '_')}_resume.pdf`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Small delay to avoid browser blocking multiple downloads
      await new Promise(r => setTimeout(r, 600));
    }
    setBulkDownloading(false);
  };

  const getStatusColor = (status: string) => {
    return 'bg-gray-100 text-gray-700 border border-gray-300';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
        <div className="max-w-6xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <Footer onNavigate={onNavigate} user={user} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <div className="max-w-6xl mx-auto p-6">
        <BackButton 
          onClick={() => onNavigate && onNavigate('job-management')}
          text="Back to Job Management"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors mb-6"
        />
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Applications for {sessionStorage.getItem('selectedJobTitle') || 'Job Position'}
            </h1>
            <p className="text-gray-600">
              Manage applications for this specific job position at {sessionStorage.getItem('selectedJobCompany') || 'Company'}
            </p>
          </div>
          {applications.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={downloadAllResumes}
                disabled={bulkDownloading}
                className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-all shadow-md whitespace-nowrap disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                {bulkDownloading ? 'Downloading...' : `Download All Resumes (${filteredApplications.filter(a => a.resumeUrl && a.resumeUrl !== 'resume_from_quick_apply').length})`}
              </button>
              <button
                onClick={runAIShortlist}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md whitespace-nowrap"
              >
                <Zap className="w-4 h-4 text-yellow-300" />
                AI Auto-Shortlist
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Applications</h3>
            <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Pending</h3>
            <p className="text-2xl font-bold text-gray-700">
              {applications.filter(app => app.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Reviewed</h3>
            <p className="text-2xl font-bold text-gray-700">
              {applications.filter(app => app.status === 'reviewed').length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Shortlisted</h3>
            <p className="text-2xl font-bold text-gray-700">
              {applications.filter(app => app.status === 'shortlisted').length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Accepted</h3>
            <p className="text-2xl font-bold text-gray-700">
              {applications.filter(app => app.status === 'accepted').length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">AI Rejected</h3>
            <p className="text-2xl font-bold text-orange-600">
              {applications.filter(app => app.status === 'ai_rejected').length}
            </p>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Applications for {sessionStorage.getItem('selectedJobTitle') || 'This Job'}</h2>
              <p className="text-sm text-gray-600 mt-1">Showing {filteredApplications.length} of {applications.length} applications</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="accepted">Accepted</option>
                <option value="ai_rejected">AI Rejected</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          
          {applications.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredApplications.map((application) => {
                const appId = application.id || application._id;
                const rounds = interviewRounds[appId] || [];
                const isRejected = application.status === 'rejected';
                return (
                  <div key={appId} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">

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
                            onClick={() => { sessionStorage.setItem('viewCandidateId', application.candidateEmail || ''); onNavigate('candidate-profile-view'); }}
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
      {aiPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-gray-900">AI Shortlist Preview</h3>
              </div>
              <button onClick={() => setAiPreview(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 bg-indigo-50 border-b text-sm text-indigo-700">
              {jobSkills.length > 0
                ? <>Scoring against <strong>{jobSkills.length} job skills</strong>: {jobSkills.slice(0, 5).join(', ')}{jobSkills.length > 5 ? ` +${jobSkills.length - 5} more` : ''}</>
                : 'No job skills found — using profile completeness score'}
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {aiPreview.map(({ app, score, newStatus }) => (
                <div key={app.id || app._id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{app.candidateName}</div>
                    <div className="text-xs text-gray-400">{app.candidateEmail}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-gray-500">AI Score</div>
                      <div className={`font-bold text-sm ${
                        score >= 50 ? 'text-emerald-600' : score >= 30 ? 'text-amber-600' : 'text-red-500'
                      }`}>{score}%</div>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${
                      newStatus === 'shortlisted' ? 'bg-emerald-100 text-emerald-700' :
                      newStatus === 'rejected'    ? 'bg-red-100 text-red-700' :
                                                   'bg-amber-100 text-amber-700'
                    }`}>
                      {newStatus === 'shortlisted' ? <CheckCircle className="w-3.5 h-3.5" /> :
                       newStatus === 'rejected'    ? <XCircle className="w-3.5 h-3.5" /> :
                                                    <MinusCircle className="w-3.5 h-3.5" />}
                      {newStatus}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex items-center justify-between gap-3">
              <div className="text-xs text-gray-500">
                ✅ {aiPreview.filter(p => p.newStatus === 'shortlisted').length} shortlisted &nbsp;
                🔶 {aiPreview.filter(p => p.newStatus === 'reviewed').length} reviewed &nbsp;
                ❌ {aiPreview.filter(p => p.newStatus === 'rejected').length} rejected
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAiPreview(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button
                  onClick={confirmAIShortlist}
                  disabled={aiRunning}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2"
                >
                  {aiRunning ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Applying...</> : 'Confirm & Apply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resume Modal */}
      <ResumeModal
        applicationId={selectedApplicationId}
        isOpen={showResumeModal}
        onClose={() => {
          setShowResumeModal(false);
          setSelectedApplicationId(null);
        }}
      />

      {showScheduleModal && selectedApplication && (
        <ScheduleInterviewModal
          application={selectedApplication}
          existingRounds={(interviewRounds[selectedApplication._id] || []).map((iv: any) => iv.round)}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedApplication(null);
          }}
          onSuccess={() => fetchApplications()}
        />
      )}

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default ApplicationManagementPage;
