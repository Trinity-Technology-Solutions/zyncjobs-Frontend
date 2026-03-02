import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { ArrowLeft, Clock, CheckCircle, XCircle, Eye, AlertCircle, Briefcase, MapPin, Calendar, X, MessageSquare } from 'lucide-react';
import BackButton from '../components/BackButton';
import ApplicationTimeline from '../components/ApplicationTimeline';

interface Application {
  _id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  coverLetter?: string;
  status: 'applied' | 'reviewed' | 'shortlisted' | 'hired' | 'rejected' | 'withdrawn';
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
  };
}

interface MyApplicationsPageProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

const MyApplicationsPage: React.FC<MyApplicationsPageProps> = ({ onNavigate, user }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [editCoverLetter, setEditCoverLetter] = useState<string>('');
  const [showTimeline, setShowTimeline] = useState<string | null>(null);
  const [withdrawingApp, setWithdrawingApp] = useState<string | null>(null);
  const [withdrawalReason, setWithdrawalReason] = useState<string>('');

  useEffect(() => {
    fetchMyApplications();
  }, [user]);

  useEffect(() => {
    fetchMyApplications();
  }, [filter]);

  const fetchMyApplications = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/applications/candidate/${user.email}`);
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditApplication = (appId: string, currentCoverLetter: string) => {
    setEditingApp(appId);
    setEditCoverLetter(currentCoverLetter || '');
  };

  const handleSaveApplication = async (appId: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/applications/${appId}`, {
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
        alert('Application updated successfully!');
      } else {
        alert('Failed to update application');
      }
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Failed to update application');
    }
  };

  const handleCancelEdit = () => {
    setEditingApp(null);
    setEditCoverLetter('');
  };

  const handleWithdrawApplication = async (appId: string) => {
    if (!withdrawalReason.trim()) {
      alert('Please provide a reason for withdrawal');
      return;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/applications/${appId}/withdraw`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: withdrawalReason })
      });

      if (response.ok) {
        await fetchMyApplications();
        setWithdrawingApp(null);
        setWithdrawalReason('');
        alert('Application withdrawn successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to withdraw application');
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
      alert('Failed to withdraw application');
    }
  };

  const handleReapply = async (application: Application) => {
    try {
      if (!application.candidateEmail) {
        alert('Candidate email not found. Please try again.');
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
        alert('Successfully reapplied to the job!');
      } else {
        const errorText = await response.text();
        console.error('Reapply error:', errorText);
        alert('Failed to reapply. Please try again.');
      }
    } catch (error) {
      console.error('Error reapplying:', error);
      alert('Failed to reapply. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
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
    switch (status) {
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
    switch (status) {
      case 'applied': return 'Your application has been submitted';
      case 'reviewed': return 'Application is being reviewed by employer';
      case 'shortlisted': return 'Congratulations! You\'ve been shortlisted';
      case 'hired': return 'Congratulations! You got the job';
      case 'rejected': return 'Application was not selected';
      case 'withdrawn': return 'நீங்கள் இந்த விண்ணப்பத்தை திரும்பப் பெற்றுள்ளீர்கள்';
      default: return 'Status unknown';
    }
  };

  const filteredApplications = applications.filter(app => 
    filter === 'all' || app.status === filter
  );

  const statusCounts = {
    all: applications.length,
    applied: applications.filter(app => app.status === 'applied').length,
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
      {/* Top Navigation Header */}
      <div className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="bg-red-600 px-4 py-2 rounded font-bold text-lg">
                ZyncJobs
              </div>
              <nav className="flex space-x-6">
                <button onClick={() => onNavigate('job-listings')} className="hover:text-gray-300">Job Search</button>
                <button onClick={() => onNavigate('companies')} className="hover:text-gray-300">Companies</button>
                <button className="hover:text-gray-300">Career Resources</button>
                <button className="hover:text-gray-300">My Jobs</button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="hover:text-gray-300">For Employers</button>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <button 
              onClick={() => onNavigate('dashboard')}
              className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm"
            >
              Profile
            </button>
            <button 
              className="py-4 px-1 border-b-2 border-red-500 text-gray-900 font-medium text-sm"
            >
              My Applications
            </button>
            <button 
              className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm"
            >
              Alerts
            </button>
          </div>
        </div>
      </div>
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <BackButton 
              onClick={() => onNavigate('dashboard')}
              text="Back to Dashboard"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
            />
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
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-gray-900">{statusCounts.all}</div>
            <div className="text-sm text-gray-600">Total Applied</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.applied}</div>
            <div className="text-sm text-gray-600">Applied</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.reviewed}</div>
            <div className="text-sm text-gray-600">Reviewed</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-green-600">{statusCounts.shortlisted}</div>
            <div className="text-sm text-gray-600">Shortlisted</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-purple-600">{statusCounts.hired}</div>
            <div className="text-sm text-gray-600">Hired</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-4 border-b">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {['all', 'applied', 'reviewed', 'shortlisted', 'rejected', 'hired', 'withdrawn'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    filter === status
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status as keyof typeof statusCounts]})
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
                <div className="text-center py-12 text-gray-500">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {filter === 'all' 
                      ? 'Start applying to jobs to see your applications here'
                      : `You don't have any ${filter} applications at the moment`
                    }
                  </p>
                  <button
                    onClick={() => onNavigate('job-listings')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Jobs
                  </button>
                </div>
              ) : (
                filteredApplications.map((application) => (
                  application && application.jobId ? (
                  <div key={application._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      {/* Left side - Job info */}
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Trinity Logo */}
                        <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden bg-white border border-gray-200">
                          <img 
                            src="/images/trinity-logo.webp" 
                            alt="Trinity Logo" 
                            className="w-10 h-10 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = '<div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">T</div>';
                            }}
                          />
                        </div>
                        
                        {/* Job details */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-lg text-gray-900">
                              {application.jobId?.jobTitle || 'Job Title Not Available'}
                            </h3>
                            <div className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border ${
                              application.status === 'applied' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                              application.status === 'reviewed' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                              application.status === 'shortlisted' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                              application.status === 'hired' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                              application.status === 'rejected' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                              'bg-gray-50 text-gray-700 border-gray-200'
                            }`}>
                              {getStatusIcon(application.status)}
                              <span className="ml-2">{application.status.charAt(0).toUpperCase() + application.status.slice(1)}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center space-x-2">
                              <Briefcase className="w-4 h-4" />
                              <span className="font-medium">{application.jobId?.company || 'Company Not Available'}</span>
                            </div>
                            {application.jobId?.location && (
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4" />
                                <span>{application.jobId.location}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4" />
                              <span>Applied {new Date(application.createdAt).toLocaleDateString()}</span>
                            </div>
                            {application.isQuickApply && (
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                  Quick Apply
                                </span>
                              </div>
                            )}
                          </div>
                          
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
                              onClick={() => onNavigate(`job-detail/${application.jobId?._id}`)}
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                            >
                              View Job
                            </button>
                            <button 
                              onClick={() => {
                                const userData = JSON.parse(localStorage.getItem('user') || '{}');
                                if (userData.resume) {
                                  let resumeUrl = '';
                                  if (userData.resume.filename) {
                                    resumeUrl = `${API_ENDPOINTS.BASE_URL}/uploads/${userData.resume.filename}`;
                                  } else if (userData.resume.url) {
                                    resumeUrl = userData.resume.url.startsWith('http') ? userData.resume.url : `${API_ENDPOINTS.BASE_URL}${userData.resume.url}`;
                                  }
                                  if (resumeUrl) {
                                    window.open(resumeUrl, '_blank');
                                  } else {
                                    alert('Resume not found');
                                  }
                                } else {
                                  alert('No resume available');
                                }
                              }}
                              className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors flex items-center"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Resume
                            </button>
                          </div>
                          
                          {application.status === 'applied' && (
                            <button
                              onClick={() => setWithdrawingApp(application._id)}
                              className="flex items-center justify-center space-x-1 px-3 py-2 border border-red-300 text-red-600 text-sm rounded hover:bg-red-50 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              <span>Withdraw</span>
                            </button>
                          )}
                          
                          {application.status === 'withdrawn' && (
                            <button
                              onClick={() => handleReapply(application)}
                              className="flex items-center justify-center space-x-1 px-3 py-2 border border-green-300 text-green-600 text-sm rounded hover:bg-green-50 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Reapply</span>
                            </button>
                          )}
                        </div>
                        
                        {/* Timeline button */}
                        <button
                          onClick={() => setShowTimeline(showTimeline === application._id ? null : application._id)}
                          className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Timeline</span>
                        </button>
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
                onClick={() => onNavigate('candidate-profile')}
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