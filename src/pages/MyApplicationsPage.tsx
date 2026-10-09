import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_ENDPOINTS } from '../config/env';
import { Clock, CheckCircle, XCircle, Eye, AlertCircle, Briefcase, MapPin, Calendar, X, RefreshCw, Search, ChevronRight, ArrowLeft, BookOpen } from 'lucide-react';
import { getId } from '../utils/getId';
import Header from '../components/Header';
import CompanyLogo from '../components/CompanyLogo';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import AutocompleteCombobox from '../components/AutocompleteCombobox';
import ApplicationTimeline from '../components/ApplicationTimeline';
import Notification from '../components/Notification';
import { apiFetch } from '../api/apiFetch';
import { decodeHtmlEntities, formatSalary } from '../utils/textUtils';
import { stripHtmlTags } from '../utils/htmlUtils';

interface Application {
  _id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  coverLetter?: string;
  status: 'applied' | 'reviewed' | 'shortlisted' | 'hired' | 'rejected' | 'ai_rejected' | 'withdrawn';
  createdAt: string;
  isQuickApply?: boolean;
  withdrawnAt?: string;
  withdrawalReason?: string;
  timeline?: Array<{
    status: string;
    date: string;
    note: string;
    updatedBy: string;
  }>;
  jobId: {
    _id: string;
    jobTitle: string;
    company: string;
    location?: string;
    jobDescription?: string;
    salary?: any;
    skills?: string[];
    companyLogo?: string;
  };
}

interface MyApplicationsPageProps {
  onNavigate: (page: string, params?: any) => void;
  user: any;
  onLogout: () => void;
}

const MyApplicationsPage: React.FC<MyApplicationsPageProps> = ({ onNavigate, user, onLogout }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [editCoverLetter, setEditCoverLetter] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadError, setLoadError] = useState('');
  const [withdrawingApp, setWithdrawingApp] = useState<string | null>(null);
  const [withdrawalReason, setWithdrawalReason] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const applicationsPerPage = 10;
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'info' | 'error'; message: string; isVisible: boolean }>({ type: 'info', message: '', isVisible: false });
  const prevStatusesRef = useRef<Record<string, string>>({});
  const isFirstLoadRef = useRef(true);
  const [scheduledAppIds, setScheduledAppIds] = useState<Set<string>>(new Set());

  const candidateEmail = user?.email || '';
  const fetchVersion = useRef(0);
  const fetchMyApplications = useCallback(async () => {
    const version = ++fetchVersion.current;
    if (!candidateEmail) {
      setLoading(false);
      return;
    }

    try {
      if (isFirstLoadRef.current) setLoading(true);
      setLoadError('');
      
      const response = await apiFetch(`${API_ENDPOINTS.BASE_URL}/applications/candidate/${encodeURIComponent(candidateEmail)}`);
      if (response.ok) {
        const raw = await response.json();
        if (version !== fetchVersion.current) return;
        if (!Array.isArray(raw)) throw new Error('Unexpected application response.');
        const data: Application[] = raw.map(app => ({ ...app, _id: app._id || app.id }));
        
        if (!isFirstLoadRef.current) {
          // Detect status changes
          const prev = prevStatusesRef.current;
          const changed = data.filter((app: Application) => prev[app._id] && prev[app._id] !== app.status && app.status !== 'ai_rejected');
          if (changed.length > 0) {
            const app = changed[0];
            // ai_rejected is internal — never notify candidate, wait for employer to confirm
            const statusLabels: Record<string, string> = {
              reviewed: 'is being reviewed', shortlisted: '- you have been shortlisted!',
              hired: '- you got the job!', rejected: 'was not selected',
            };
            const label = statusLabels[app.status] || `updated to ${app.status}`;
            const isPositive = ['shortlisted', 'hired', 'reviewed'].includes(app.status);
            setToast({
              type: isPositive ? 'success' : 'info',
              message: `${app.jobId?.jobTitle || 'Application'} ${label}`,
              isVisible: true,
            });
          }
        }

        // Update stored statuses
        const newStatuses: Record<string, string> = {};
        data.forEach((app: Application) => { if (app._id) newStatuses[app._id] = app.status; });
        prevStatusesRef.current = newStatuses;
        isFirstLoadRef.current = false;

        setApplications(data);

        // Fetch interview status for each application
        const ids: string[] = data.map((a: Application) => a._id).filter(Boolean);
        const settled = await Promise.all(
          ids.map(async (id: string) => {
            try {
              const r = await apiFetch(`${API_ENDPOINTS.BASE_URL}/interviews/application/${id}`);
              if (r.ok) {
                const d = await r.json();
                return (Array.isArray(d) ? d.length > 0 : !!d?._id) ? id : null;
              }
            } catch { /* Interview activity is optional; application records remain visible. */ }
            return null;
          })
        );
        const scheduled = new Set<string>(settled.filter(Boolean) as string[]);
        if (version === fetchVersion.current) setScheduledAppIds(scheduled);
      } else { throw new Error('Unable to load your applications. Please retry.'); }
    } catch (error) {
      if (version !== fetchVersion.current) return;
      setLoadError(error instanceof Error ? error.message : 'Unable to load your applications.');
      console.error('Error fetching applications:', error);
    } finally {
      if (version === fetchVersion.current) setLoading(false);
    }
  }, [candidateEmail]);

  useEffect(() => {
    setApplications([]); setScheduledAppIds(new Set()); setSelectedId(null);
    setFilter('all'); setSearchQuery(''); setCurrentPage(1); setShowMobileDetails(false);
    prevStatusesRef.current = {}; isFirstLoadRef.current = true;
    void fetchMyApplications();
    const interval = setInterval(() => { void fetchMyApplications(); }, 30000);
    return () => { clearInterval(interval); fetchVersion.current++; };
  }, [fetchMyApplications]);
  useEffect(() => { setCurrentPage(1); setShowMobileDetails(false); }, [filter, searchQuery]);

  const handleLoadMoreApplications = () => setCurrentPage(page => page + 1);

  const handleEditApplication = (appId: string, currentCoverLetter: string) => {
    setEditingApp(appId);
    setEditCoverLetter(currentCoverLetter || '');
  };

  const handleSaveApplication = async (appId: string) => {
    try {
      const response = await apiFetch(`${API_ENDPOINTS.BASE_URL}/applications/${appId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coverLetter: editCoverLetter }),
      });

      if (response.ok) {
        // Update local state
        setApplications(prev => prev.map(app => 
          app._id === appId 
            ? { ...app, coverLetter: editCoverLetter }
            : app
        ));
        setEditingApp(null);
        setEditCoverLetter('');
        window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Application updated successfully!" } }));
      } else {
        window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Failed to update application" } }));
      }
    } catch (error) {
      console.error('Error updating application:', error);
      window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Failed to update application" } }));
    }
  };

  const handleCancelEdit = () => {
    setEditingApp(null);
    setEditCoverLetter('');
  };

  const handleWithdrawApplication = async (appId: string) => {
    if (!withdrawalReason.trim()) {
      window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Please provide a reason for withdrawal" } }));
      return;
    }

    try {
      const response = await apiFetch(`${API_ENDPOINTS.BASE_URL}/applications/${appId}/withdraw`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: withdrawalReason })
      });

      if (response.ok) {
        await fetchMyApplications();
        setWithdrawingApp(null);
        setWithdrawalReason('');
        window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Application withdrawn successfully" } }));
      } else {
        const error = await response.json();
        window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: String(error.error || 'Failed to withdraw application') } }));
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
      window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Failed to withdraw application" } }));
    }
  };

  const handleReapply = async (application: Application) => {
    try {
      if (!application.candidateEmail) {
        window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Candidate email not found. Please try again." } }));
        return;
      }

      // Update the application status back to applied using existing endpoint
      const response = await apiFetch(`${API_ENDPOINTS.APPLICATIONS}/${application._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'applied',
          note: 'Reapplied to position after withdrawal',
          updatedBy: application.candidateName
        })
      });

      if (response.ok) {
        await fetchMyApplications();
        window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Successfully reapplied to the job!" } }));
      } else {
        const errorText = await response.text();
        console.error('Reapply error:', errorText);
        window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Failed to reapply. Please try again." } }));
      }
    } catch (error) {
      console.error('Error reapplying:', error);
      window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Failed to reapply. Please try again." } }));
    }
  };

  // ai_rejected is INTERNAL employer state — candidate always sees it as "applied"
  const toDisplay = (s: string) => ['ai_rejected', 'pending'].includes(s) ? 'applied' : s;

  const getStatusIcon = (status: string) => {
    switch (toDisplay(status)) {
      case 'applied': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'reviewed': return <Eye className="w-4 h-4 text-yellow-500" />;
      case 'shortlisted': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'hired': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'withdrawn': return <X className="w-4 h-4 text-gray-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (toDisplay(status)) {
      case 'applied': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'shortlisted': return 'bg-green-100 text-green-800 border-green-200';
      case 'hired': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'withdrawn': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (toDisplay(status)) {
      case 'applied': return 'Your application has been submitted and is under review';
      case 'reviewed': return 'Application is being reviewed by employer';
      case 'shortlisted': return 'Congratulations! You\'ve been shortlisted';
      case 'hired': return 'Congratulations! You got the job';
      case 'rejected': return 'Application was not selected';
      case 'withdrawn': return 'You have withdrawn this application';
      default: return 'Status unknown';
    }
  };

  // ai_rejected counts as 'applied' for candidate view
  const filteredApplications = applications.filter(app =>
    (filter === 'all' || (filter === 'updates' ? ['reviewed', 'shortlisted', 'hired', 'rejected'].includes(toDisplay(app.status)) || scheduledAppIds.has(app._id) : toDisplay(app.status) === filter)) &&
    (!searchQuery.trim() || `${app.jobId?.jobTitle || ''} ${app.jobId?.company || ''}`.toLowerCase().includes(searchQuery.trim().toLowerCase()))
  );

  const statusCounts = {
    all: applications.length,
    applied: applications.filter(app => toDisplay(app.status) === 'applied').length,
    reviewed: applications.filter(app => app.status === 'reviewed').length,
    shortlisted: applications.filter(app => app.status === 'shortlisted').length,
    hired: applications.filter(app => app.status === 'hired').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
    withdrawn: applications.filter(app => app.status === 'withdrawn').length,
  };

  const visibleApplications = filteredApplications.slice(0, currentPage * applicationsPerPage);
  const selected = filteredApplications.find(app => app._id === selectedId) || filteredApplications[0];
  const updatesCount = applications.filter(app => ['reviewed', 'shortlisted', 'hired', 'rejected'].includes(toDisplay(app.status)) || scheduledAppIds.has(app._id)).length;
  const filters = [{ key: 'all', label: 'All applications', count: statusCounts.all }, { key: 'updates', label: 'Recruiter updates', count: updatesCount }, ...(['applied','reviewed','shortlisted','hired','rejected','withdrawn'] as const).map(key => ({ key, label: key.charAt(0).toUpperCase() + key.slice(1), count: statusCounts[key] }))];
  const dateLabel = (value: string) => { const date = new Date(value); return Number.isFinite(date.getTime()) ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date unavailable'; };

  return (
    <div className="candidate-applications-page min-h-screen">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <Notification type={toast.type} message={toast.message} isVisible={toast.isVisible} onClose={() => setToast(value => ({ ...value, isVisible: false }))} />
      <div className="candidate-applications-summary">
        <div className="portal-page-container candidate-applications-summary-inner">
          <div><BackButton fallback="/dashboard" /><h1>My Applications</h1><p>Follow your applications and stay up to date with recruiter activity.</p></div>
          <div className="candidate-applications-metrics"><div><strong>{statusCounts.all}</strong><span>Total<br />applications</span></div><div><strong>{updatesCount}</strong><span>Recruiter<br />updates</span></div><button type="button" onClick={async () => { if (refreshing) return; setRefreshing(true); try { await fetchMyApplications(); } finally { setRefreshing(false); } }} disabled={refreshing || loading} aria-label="Refresh applications"><RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} /></button></div>
        </div>
      </div>
      <main className="portal-page-container candidate-applications-main">
        {loadError && <div role="alert" className="candidate-applications-error"><AlertCircle size={18} />{loadError}<button type="button" onClick={() => void fetchMyApplications()}>Retry</button></div>}
        <div className="candidate-applications-workspace" data-mobile-detail={showMobileDetails}>
          <aside className="candidate-applications-list-panel" aria-label="Your applications">
            <div className="candidate-applications-list-controls">
              <div className="candidate-applications-filter-chips">{filters.filter(item => item.count > 0 || item.key === 'all' || item.key === 'updates').map(item => <button key={item.key} type="button" aria-pressed={filter === item.key} onClick={() => setFilter(item.key)}>{item.label} ({item.count})</button>)}</div>
              <label className="candidate-applications-search"><Search size={16} aria-hidden="true" /><input type="search" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search job or company" aria-label="Search applications by job or company" /></label>
            </div>
            <div className="candidate-applications-list">
              {loading && !applications.length ? <div role="status" className="candidate-applications-loading">Loading your applications...</div> : visibleApplications.length === 0 ? <div className="candidate-applications-empty"><Briefcase size={30} /><h2>{applications.length ? 'No matching applications' : 'Start your next opportunity'}</h2><p>{applications.length ? 'Try another status or search term.' : 'Your submitted job applications will appear here.'}</p><button type="button" onClick={() => applications.length ? (setFilter('all'), setSearchQuery('')) : onNavigate('job-listings')}>{applications.length ? 'Clear filters' : 'Find jobs'}</button></div> : visibleApplications.map(app => <div key={app._id} className="candidate-application-list-item" data-selected={selected?._id === app._id}>
                <button type="button" className="candidate-application-select" aria-pressed={selected?._id === app._id} onClick={() => { setSelectedId(app._id); setShowMobileDetails(true); }}>
                  <h2>{decodeHtmlEntities(app.jobId?.jobTitle) || 'Position unavailable'}</h2><p>{decodeHtmlEntities(app.jobId?.company) || 'Company unavailable'}</p>
                  <span className="candidate-application-list-location"><MapPin size={13} />{app.jobId?.location || 'Location not specified'}</span>
                  <div className="candidate-application-list-status"><span className={getStatusColor(app.status)}>{getStatusIcon(app.status)}{toDisplay(app.status).charAt(0).toUpperCase() + toDisplay(app.status).slice(1)}</span><time dateTime={app.createdAt}>{dateLabel(app.createdAt)}</time></div>
                  {scheduledAppIds.has(app._id) && <span className="candidate-application-interview-note"><Calendar size={13} /> Interview activity available</span>}
                </button>
                <div className="candidate-application-prep"><span>Prepare for your interview</span><button type="button" onClick={() => onNavigate('interview-tips')}><BookOpen size={14} /> Tips</button></div>
              </div>)}
              {visibleApplications.length < filteredApplications.length && <button type="button" onClick={handleLoadMoreApplications} className="candidate-applications-load-more">Load more applications</button>}
            </div>
          </aside>
          <section className="candidate-application-detail" aria-label="Selected application details">
            <button type="button" className="candidate-application-back-list" onClick={() => setShowMobileDetails(false)}><ArrowLeft size={16} /> All applications</button>
            {selected ? <>
              <div className="candidate-application-detail-heading"><div><h2>{decodeHtmlEntities(selected.jobId?.jobTitle) || 'Position unavailable'}</h2><p>{decodeHtmlEntities(selected.jobId?.company) || 'Company unavailable'}</p><button type="button" disabled={!getId(selected.jobId)} onClick={() => onNavigate('job-detail', { jobId: getId(selected.jobId), jobData: selected.jobId })}>View job details <ChevronRight size={14} /></button></div><CompanyLogo storedLogo={selected.jobId?.companyLogo} companyName={selected.jobId?.company || ''} size={48} /></div>
              <div className="candidate-application-detail-meta"><span><MapPin size={15} />{selected.jobId?.location || 'Location not specified'}</span><span><Calendar size={15} />Applied {dateLabel(selected.createdAt)}</span>{selected.jobId?.salary && <span>{formatSalary(selected.jobId.salary)}</span>}{selected.isQuickApply && <span>Quick Apply</span>}</div>
              <div className="candidate-application-current-status"><span className={getStatusColor(selected.status)}>{getStatusIcon(selected.status)}{toDisplay(selected.status).charAt(0).toUpperCase() + toDisplay(selected.status).slice(1)}</span><p>{getStatusMessage(selected.status)}</p></div>
              {scheduledAppIds.has(selected._id) && <div className="candidate-application-interview-banner"><Calendar size={20} /><div><strong>Interview activity available</strong><p>Check your interviews for the schedule and meeting details.</p></div><button type="button" onClick={() => onNavigate('interviews')}>View interviews</button></div>}
              <div className="candidate-application-section"><h3>Application activity</h3><ApplicationTimeline key={`${selected._id}-${selected.status}`} applicationId={selected._id} currentStatus={toDisplay(selected.status)} hideInternalStatuses /></div>
              {selected.jobId?.skills?.length ? <div className="candidate-application-section"><h3>Skills for this opportunity</h3><div className="candidate-application-skills">{selected.jobId.skills.map(skill => <span key={skill}>{skill}</span>)}</div></div> : null}
              {selected.jobId?.jobDescription && <div className="candidate-application-section"><h3>About this opportunity</h3><p className="candidate-application-description">{decodeHtmlEntities(stripHtmlTags(selected.jobId.jobDescription))}</p></div>}
              <div className="candidate-application-section"><h3>Your application</h3>
                {editingApp === selected._id ? <div className="candidate-application-cover-editor"><label htmlFor="application-cover-letter">Cover letter</label><textarea id="application-cover-letter" rows={6} maxLength={1000} value={editCoverLetter} onChange={event => setEditCoverLetter(event.target.value)} /><div><button type="button" onClick={handleCancelEdit}>Cancel</button><button type="button" onClick={() => void handleSaveApplication(selected._id)}>Save changes</button></div></div> : <><p className="candidate-application-description">{selected.isQuickApply ? 'Submitted using Quick Apply.' : selected.coverLetter || 'No cover letter added.'}</p>{toDisplay(selected.status) === 'applied' && !selected.isQuickApply && <button type="button" className="candidate-application-text-action" onClick={() => handleEditApplication(selected._id, selected.coverLetter || '')}>Edit cover letter</button>}</>}
                {selected.withdrawalReason && <p className="candidate-application-withdrawal-reason">Withdrawal reason: {selected.withdrawalReason}</p>}
              </div>
              <div className="candidate-application-detail-actions"><button type="button" onClick={() => onNavigate('job-listings')}>Browse more jobs</button><button type="button" onClick={() => onNavigate('dashboard')}>Improve profile</button>{['applied','reviewed','shortlisted'].includes(toDisplay(selected.status)) && <button type="button" className="candidate-application-withdraw" onClick={() => setWithdrawingApp(selected._id)}>Withdraw application</button>}{selected.status === 'withdrawn' && <button type="button" onClick={() => void handleReapply(selected)}>Reapply</button>}</div>
            </> : <div className="candidate-application-detail-placeholder"><Briefcase size={40} /><h2>Your application details</h2><p>Select an application to see its progress, job details and next steps.</p></div>}
          </section>
        </div>
      </main>
      <Footer onNavigate={onNavigate} user={user} />
      {/* Withdrawal Modal */}
      {withdrawingApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Withdraw Application</h3>
            <p className="text-gray-600 mb-4">
              Withdrawing will update the application status and record your reason.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for withdrawal *
              </label>
              <AutocompleteCombobox
                value={withdrawalReason}
                onChange={(val) => setWithdrawalReason(val)}
                options={[
                  { value: 'Found another opportunity', label: 'Found another opportunity' },
                  { value: 'No longer interested', label: 'No longer interested' },
                  { value: 'Company concerns', label: 'Company concerns' },
                  { value: 'Salary expectations not met', label: 'Salary expectations not met' },
                  { value: 'Location issues', label: 'Location issues' },
                  { value: 'Personal reasons', label: 'Personal reasons' },
                  { value: 'Other', label: 'Other' },
                ]}
                placeholder="Select a reason"
                required
                className="w-full"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setWithdrawingApp(null);
                  setWithdrawalReason('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleWithdrawApplication(withdrawingApp)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Withdraw Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplicationsPage;
