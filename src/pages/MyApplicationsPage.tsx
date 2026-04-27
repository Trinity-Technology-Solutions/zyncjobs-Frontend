import React, { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '../config/env';
import { ArrowLeft, Clock, CheckCircle, XCircle, Eye, AlertCircle, Briefcase, MapPin, Calendar, X, MessageSquare, Bell } from 'lucide-react';
import { getCompanyLogo } from '../utils/logoUtils';
import { getId } from '../utils/getId';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import EmptyState from '../components/EmptyState';
import ApplicationTimeline from '../components/ApplicationTimeline';
import Notification from '../components/Notification';

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
  const [showTimeline, setShowTimeline] = useState<string | null>(null);
  const [withdrawingApp, setWithdrawingApp] = useState<string | null>(null);
  const [withdrawalReason, setWithdrawalReason] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreApplications, setHasMoreApplications] = useState(true);
  const applicationsPerPage = 10;
  const [toast, setToast] = useState<{ type: 'success' | 'info' | 'error'; message: string; isVisible: boolean }>({ type: 'info', message: '', isVisible: false });
  const prevStatusesRef = useRef<Record<string, string>>({});
  const isFirstLoadRef = useRef(true);
  const [scheduledAppIds, setScheduledAppIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMyApplications();
  }, [user]);

  useEffect(() => {
    fetchMyApplications();
  }, [filter]);

  // Auto-refresh every 30s to detect status changes
  useEffect(() => {
    const interval = setInterval(() => fetchMyApplications(), 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchMyApplications = async (page = 1, append = false) => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      if (!append) setLoading(true);
      
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', applicationsPerPage.toString());
      
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/applications/candidate/${user.email}?${params}`);
      if (response.ok) {
        const data = await response.json();
        
        if (!isFirstLoadRef.current && !append) {
          // Detect status changes
          const prev = prevStatusesRef.current;
          const changed = data.filter((app: Application) => prev[app._id] && prev[app._id] !== app.status);
          if (changed.length > 0) {
            const app = changed[0];
            // ai_rejected is internal — never notify candidate, wait for employer to confirm
            if (app.status === 'ai_rejected') return;
            const statusLabels: Record<string, string> = {
              reviewed: 'is being reviewed',
              shortlisted: '— you have been shortlisted! 🎉',
              hired: '— you got the job! 🎊',
              rejected: 'was not selected',
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

        if (append) {
          setApplications(prev => [...prev, ...data]);
        } else {
          setApplications(data);
        }
        
        setHasMoreApplications(data.length === applicationsPerPage);

        // Fetch interview status for each application
        const ids: string[] = data.map((a: Application) => a._id).filter(Boolean);
        const settled = await Promise.all(
          ids.map(async (id: string) => {
            try {
              const r = await fetch(`${API_ENDPOINTS.BASE_URL}/interviews/application/${id}`);
              if (r.ok) {
                const d = await r.json();
                return (Array.isArray(d) ? d.length > 0 : !!d?._id) ? id : null;
              }
            } catch {}
            return null;
          })
        );
        const scheduled = new Set<string>(settled.filter(Boolean) as string[]);
        setScheduledAppIds(prev => append ? new Set([...prev, ...scheduled]) : scheduled);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      if (!append) setLoading(false);
    }
  };

  const handleLoadMoreApplications = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchMyApplications(nextPage, true);
  };

  const handleEditApplication = (appId: string, currentCoverLetter: string) => {
    setEditingApp(appId);
    setEditCoverLetter(currentCoverLetter || '');
  };

  const handleSaveApplication = async (appId: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/applications/${appId}`, {
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
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/applications/${appId}/withdraw`, {
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
      const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}/${application._id}/status`, {
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
  const toDisplay = (s: string) => s === 'ai_rejected' ? 'applied' : s;

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
    filter === 'all' || toDisplay(app.status) === filter
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <Notification
        type={toast.type}
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={() => setToast(t => ({ ...t, isVisible: false }))}
      />
      
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium mb-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-2xl">📊</div>
            <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          </div>
          <button
            onClick={() => {
              console.log('MyApplications: Manual refresh clicked');
              fetchMyApplications();
            }}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm"
          >
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          {[
            { label: 'Total Applied', value: statusCounts.all, color: 'text-gray-900', border: 'border-gray-200', icon: <Briefcase className="w-5 h-5 text-gray-400" /> },
            { label: 'Applied', value: statusCounts.applied, color: 'text-blue-600', border: 'border-blue-200', icon: <Clock className="w-5 h-5 text-blue-400" /> },
            { label: 'Reviewed', value: statusCounts.reviewed, color: 'text-yellow-600', border: 'border-yellow-200', icon: <Eye className="w-5 h-5 text-yellow-400" /> },
            { label: 'Shortlisted', value: statusCounts.shortlisted, color: 'text-green-600', border: 'border-green-200', icon: <CheckCircle className="w-5 h-5 text-green-400" /> },
            { label: 'Rejected', value: statusCounts.rejected, color: 'text-red-600', border: 'border-red-200', icon: <XCircle className="w-5 h-5 text-red-400" /> },
            { label: 'Hired', value: statusCounts.hired, color: 'text-purple-600', border: 'border-purple-200', icon: <CheckCircle className="w-5 h-5 text-purple-400" /> },
          ].map((stat) => (
            <div key={stat.label} className={`p-4 rounded-xl bg-white shadow-md hover:shadow-xl transition-all border ${stat.border}`}>
              <div className="flex justify-between items-center mb-2">
                <p className="text-gray-500 text-xs font-medium">{stat.label}</p>
                {stat.icon}
              </div>
              <h2 className={`text-2xl font-bold ${stat.color}`}>{stat.value}</h2>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-4 border-b">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All', active: 'bg-gray-800 text-white', inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
                { key: 'applied', label: 'Applied', active: 'bg-blue-600 text-white', inactive: 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600' },
                { key: 'reviewed', label: 'Reviewed', active: 'bg-yellow-500 text-white', inactive: 'bg-gray-100 text-gray-600 hover:bg-yellow-50 hover:text-yellow-600' },
                { key: 'shortlisted', label: 'Shortlisted', active: 'bg-green-600 text-white', inactive: 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600' },
                { key: 'rejected', label: 'Rejected', active: 'bg-red-500 text-white', inactive: 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600' },
                { key: 'hired', label: 'Hired', active: 'bg-purple-600 text-white', inactive: 'bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-600' },
                { key: 'withdrawn', label: 'Withdrawn', active: 'bg-gray-500 text-white', inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${filter === f.key ? f.active : f.inactive}`}
                >
                  {f.label} ({statusCounts[f.key as keyof typeof statusCounts]})
                </button>
              ))}
            </div>
          </div>

          {/* Applications List */}
          <div className="p-6">
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredApplications.length} applications
            </div>
            
            <div className="space-y-4">
              {filteredApplications.length === 0 ? (
                <EmptyState
                  title={filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
                  description={filter === 'all' 
                    ? 'Start applying to jobs to see your applications here'
                    : `You don't have any ${filter} applications at the moment`
                  }
                  buttonText="Browse Jobs"
                  onButtonClick={() => onNavigate('job-listings')}
                  icon="applications"
                />
              ) : (
                filteredApplications.map((application) => (
                  application && application.jobId ? (
                  <div key={application._id} className="bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all border border-gray-100">
                    <div className="flex items-start justify-between">
                      {/* Left side - Job info */}
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="flex-1">
                          {/* Company logo + name row */}
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-blue-50 border border-blue-100">
                              <img 
                                src={getCompanyLogo(application.jobId?.company || '')} 
                                alt={`${application.jobId?.company || 'Company'} Logo`} 
                                className="w-10 h-10 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  const company = application.jobId?.company || 'Company';
                                  const initials = company.split(' ').map((n: string) => n[0]).join('').toUpperCase();
                                  target.style.display = 'none';
                                  const fb = document.createElement('div');
                                  fb.className = 'w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-semibold text-xs';
                                  fb.textContent = initials;
                                  target.parentElement!.appendChild(fb);
                                }}
                              />
                            </div>
                            <span className="font-semibold text-blue-700 text-base">{application.jobId?.company || 'Company Not Available'}</span>
                          </div>

                          {/* Job title + status */}
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-lg text-gray-900">
                              {application.jobId?.jobTitle || 'Job Title Not Available'}
                            </h3>
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(application.status)}`}>
                              {getStatusIcon(application.status)}
                              <span className="ml-2">{toDisplay(application.status).charAt(0).toUpperCase() + toDisplay(application.status).slice(1)}</span>
                            </div>
                            {scheduledAppIds.has(application._id) && (
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                                <Calendar className="w-3.5 h-3.5 mr-1" />
                                Interview Scheduled
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mb-3">
                            {application.jobId?.location && (
                              <div className="flex items-center space-x-1 bg-gray-100 px-3 py-1 rounded-lg">
                                <MapPin className="w-4 h-4 text-gray-600" />
                                <span className="text-gray-700 font-medium">{application.jobId.location}</span>
                              </div>
                            )}
                            {application.isQuickApply && (
                              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-lg">
                                ⚡ Quick Apply
                              </span>
                            )}
                          </div>
                          
                          {application.jobId?.jobDescription && (
                            <div className="mb-3 bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                              <p className="text-sm text-gray-700 leading-relaxed font-medium">
                                <span className="font-semibold text-blue-900">Job Description: </span>
                                {application.jobId.jobDescription.substring(0, 300)}{application.jobId.jobDescription.length > 300 ? '...' : ''}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            {application.jobId?.salary && (
                              <div className="flex items-center space-x-1 bg-green-50 px-3 py-1.5 rounded-lg">
                                <span className="text-green-600 font-bold">💰</span>
                                <span className="text-green-700 font-semibold text-sm">
                                  {typeof application.jobId.salary === 'object' 
                                    ? `₹${application.jobId.salary.min || ''}-${application.jobId.salary.max || ''}` 
                                    : application.jobId.salary
                                  }
                                </span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1 bg-gray-100 px-3 py-1 rounded-lg">
                              <Calendar className="w-4 h-4 text-gray-600" />
                              <span className="text-gray-700 text-sm font-medium">Applied {new Date(application.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                          </div>
                          
                          {application.jobId?.skills && application.jobId.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {application.jobId.skills.slice(0, 5).map((skill: string, idx: number) => (
                                <span key={idx} className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                  {skill}
                                </span>
                              ))}
                              {application.jobId.skills.length > 5 && (
                                <span className="text-xs text-gray-500 px-2 py-1 font-medium">+{application.jobId.skills.length - 5} more</span>
                              )}
                            </div>
                          )}
                          
                          {/* Progress bar */}
                          {(() => {
                            const steps = ['applied','reviewed','shortlisted','hired'];
                            const displayStatus = toDisplay(application.status);
                            const idx = steps.indexOf(displayStatus);
                            const pct = idx >= 0 ? Math.round(((idx + 1) / steps.length) * 100) : 0;
                            const barColor = displayStatus === 'rejected' ? 'bg-red-500' : displayStatus === 'hired' ? 'bg-purple-500' : 'bg-green-500';
                            return displayStatus !== 'withdrawn' ? (
                              <div className="mb-3">
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                  <span>Progress</span><span>{pct}%</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full">
                                  <div className={`h-1.5 ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-300 mt-1">
                                  {steps.map(s => <span key={s} className={displayStatus === s ? 'text-blue-500 font-semibold' : ''}>{s.charAt(0).toUpperCase()+s.slice(1)}</span>)}
                                </div>
                              </div>
                            ) : null;
                          })()}

                          {/* Status message */}
                          <div className="mb-3">
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Status:</span> {getStatusMessage(application.status)}
                            </div>
                          </div>
                          
                          {/* Cover Letter */}
                          {application.coverLetter && (
                            <div className="mb-4">
                              {editingApp === application._id ? (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Edit Cover Letter:</label>
                                  <textarea
                                    value={editCoverLetter}
                                    onChange={(e) => setEditCoverLetter(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                    rows={4}
                                    maxLength={1000}
                                  />
                                  <div className="flex justify-end space-x-2 mt-2">
                                    <button
                                      onClick={handleCancelEdit}
                                      className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleSaveApplication(application._id)}
                                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="text-sm text-gray-600 mb-2">
                                        <span className="font-medium">Application Method:</span>
                                      </div>
                                      <p className="text-sm text-gray-700">
                                        {application.isQuickApply 
                                          ? "Professional application submitted with resume and profile details"
                                          : application.coverLetter.length > 150 
                                            ? `${application.coverLetter.substring(0, 150)}...`
                                            : application.coverLetter
                                        }
                                      </p>
                                    </div>
                                    {application.status === 'applied' && !application.isQuickApply && (
                                      <button
                                        onClick={() => handleEditApplication(application._id, application.coverLetter || '')}
                                        className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                      >
                                        Edit
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Right side - Actions */}
                      <div className="flex flex-col items-end space-y-3">
                        {/* Action buttons */}
                        <div className="flex flex-col space-y-2">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => onNavigate('job-detail', { jobId: getId(application.jobId) || (typeof application.jobId === 'string' ? application.jobId : ''), jobData: application.jobId })}
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                              View Job
                            </button>
                          </div>
                          
                          {(application.status === 'applied' || application.status === 'ai_rejected') && (
                            <button
                              onClick={() => setWithdrawingApp(application._id)}
                              className="flex items-center justify-center space-x-1 px-3 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              <span>Withdraw</span>
                            </button>
                          )}
                          
                          {scheduledAppIds.has(application._id) && (
                            <button
                              onClick={() => onNavigate('candidate-interviews')}
                              className="flex items-center justify-center space-x-1 px-3 py-2 border border-indigo-300 text-indigo-600 text-sm rounded-lg hover:bg-indigo-50 transition-colors"
                            >
                              <Calendar className="w-4 h-4" />
                              <span>View Interview</span>
                            </button>
                          )}
                          
                          {application.status === 'withdrawn' && (
                            <button
                              onClick={() => handleReapply(application)}
                              className="flex items-center justify-center space-x-1 px-3 py-2 border border-green-300 text-green-600 text-sm rounded-lg hover:bg-green-50 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Reapply</span>
                            </button>
                          )}
                        </div>
                        

                      </div>
                    </div>
                    
                    {/* Timeline */}
                    {showTimeline === application._id && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <ApplicationTimeline 
                          applicationId={application._id}
                          currentStatus={application.status}
                        />
                      </div>
                    )}
                    
                    {/* Bottom section with additional info */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div>
                          {application.withdrawnAt && application.withdrawalReason && (
                            <span className="text-red-600">
                              Withdrawn: {application.withdrawalReason}
                            </span>
                          )}
                        </div>
                        <div className="text-xs">
                          Last updated {new Date(application.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  ) : null
                ))
              )}
            </div>
            
            {filteredApplications.length > 0 && hasMoreApplications && (
              <div className="flex justify-center py-6">
                <button
                  onClick={handleLoadMoreApplications}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Load More Applications
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {applications.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => onNavigate('job-listings')}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center">
                  <Briefcase className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <h4 className="font-medium">Apply to More Jobs</h4>
                    <p className="text-sm text-gray-600">Browse and apply to new opportunities</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => onNavigate('dashboard')}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-medium">Improve Profile</h4>
                    <p className="text-sm text-gray-600">Complete your profile to get better matches</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
      
      <Footer onNavigate={onNavigate} user={user} />

      {/* Withdrawal Modal */}
      {withdrawingApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Withdraw Application</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to withdraw this application? This action cannot be undone.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for withdrawal *
              </label>
              <select
                value={withdrawalReason}
                onChange={(e) => setWithdrawalReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a reason</option>
                <option value="Found another opportunity">Found another opportunity</option>
                <option value="No longer interested">No longer interested</option>
                <option value="Company concerns">Company concerns</option>
                <option value="Salary expectations not met">Salary expectations not met</option>
                <option value="Location issues">Location issues</option>
                <option value="Personal reasons">Personal reasons</option>
                <option value="Other">Other</option>
              </select>
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
