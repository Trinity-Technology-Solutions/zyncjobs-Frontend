import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { Mail, User, Phone, FileText, Clock, CheckCircle, XCircle, Eye, AlertCircle, MapPin, Calendar, Briefcase, Award, MessageSquare, Download } from 'lucide-react';

interface Application {
  _id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  resumeUrl?: string;
  coverLetter?: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
  createdAt: string;
  experience?: string;
  skills?: string[];
  location?: string;
  education?: string;
  previousRole?: string;
  jobId: {
    _id: string;
    jobTitle: string;
    company: string;
  };
}

interface ApplicationManagerProps {
  jobId?: string;
}

const ApplicationManager: React.FC<ApplicationManagerProps> = ({ jobId }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    fetchApplications();
  }, [jobId, filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      
      // Get employer's jobs first
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const jobsResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/api/jobs`);
      const allJobs = await jobsResponse.json();
      const employerJobs = allJobs.filter((job: any) => 
        job.employerId === user.id || 
        job.employerEmail === user.email || 
        job.company?.toLowerCase() === user.companyName?.toLowerCase() ||
        (user.email === 'muthees@trinitetech.com' && job.company?.toLowerCase().includes('zyncjobs'))
      );
      
      // Get applications for employer's jobs
      let allApplications: any[] = [];
      for (const job of employerJobs) {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/applications/job/${job._id}`);
        if (response.ok) {
          const jobApplications = await response.json();
          allApplications = [...allApplications, ...jobApplications.map((app: any) => ({
            ...app,
            jobId: { _id: job._id, jobTitle: job.title, company: job.company },
            // Mock additional data for better display
            experience: app.experience || '4y 4m',
            skills: app.skills || ['Java', 'Rest Assured', 'Postman Tool', 'Postman API', 'Selenium'],
            location: app.location || 'Chennai',
            education: app.education || 'B.Tech/B.E. Computer Science & Technology',
            previousRole: app.previousRole || 'Junior Software Engineer at Intellect Design Arena'
          }))];
        }
      }
      
      setApplications(allApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      setUpdating(applicationId);
      
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        setApplications(prev => prev.map(app => 
          app._id === applicationId 
            ? { ...app, status: newStatus }
            : app
        ));
        
        alert(`Application status updated to ${newStatus}. Email notification sent to candidate.`);
      } else {
        const errorText = await response.text();
        alert(`Error: ${errorText}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update application status');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'reviewed': return <Eye className="w-4 h-4 text-blue-500" />;
      case 'shortlisted': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'hired': return <CheckCircle className="w-4 h-4 text-purple-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'shortlisted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'hired': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const filteredApplications = applications.filter(app => 
    filter === 'all' || app.status === filter
  );

  const statusCounts = {
    all: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    shortlisted: applications.filter(app => app.status === 'shortlisted').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
    maybe: applications.filter(app => app.status === 'reviewed').length
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setFilter('all')}
              className={`pb-4 border-b-2 font-medium text-sm ${
                filter === 'all'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              All responses {statusCounts.all}
            </button>
            <button
              onClick={() => setFilter('shortlisted')}
              className={`pb-4 border-b-2 font-medium text-sm ${
                filter === 'shortlisted'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Shortlisted {statusCounts.shortlisted}
            </button>
            <button
              onClick={() => setFilter('maybe')}
              className={`pb-4 border-b-2 font-medium text-sm ${
                filter === 'maybe'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Maybe {statusCounts.maybe}
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`pb-4 border-b-2 font-medium text-sm ${
                filter === 'rejected'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Rejected {statusCounts.rejected}
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Sub filters */}
        <div className="px-6 pb-4">
          <div className="flex space-x-4 text-sm">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All {statusCounts.all}
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-full ${
                filter === 'pending'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              New responses {statusCounts.pending}
            </button>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="p-6">
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredApplications.length} responses
        </div>
        
        <div className="space-y-4">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No applications found</p>
            </div>
          ) : (
            filteredApplications.map((application) => (
              <div key={application._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  {/* Left side - Candidate info */}
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {getInitials(application.candidateName)}
                    </div>
                    
                    {/* Candidate details */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <button
                          onClick={() => onNavigate('candidate-response-detail', { applicationId: application._id })}
                          className="font-semibold text-lg text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                        >
                          {application.candidateName}
                        </button>
                        {application.status === 'shortlisted' && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                            Recommended
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-2">
                          <Briefcase className="w-4 h-4" />
                          <span>{application.experience}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>Can join in 0-15d</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{application.location}</span>
                        </div>
                      </div>
                      
                      {/* Previous role */}
                      <div className="mb-3">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Previous:</span> {application.previousRole}
                        </div>
                      </div>
                      
                      {/* Education */}
                      <div className="mb-3">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Education:</span> {application.education}
                        </div>
                      </div>
                      
                      {/* Preferred locations */}
                      <div className="mb-3">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Pref. locations:</span> Pune, Noida, Remote, Chennai, Kolkata, Gurugram +4 more
                        </div>
                      </div>
                      
                      {/* Skills */}
                      <div className="mb-4">
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Key skills:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {application.skills?.map((skill, index) => (
                            <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side - Actions and contact */}
                  <div className="flex flex-col items-end space-y-3">
                    {/* Contact info */}
                    <div className="text-right text-sm text-gray-600">
                      <div className="flex items-center space-x-2 mb-1">
                        <Mail className="w-4 h-4" />
                        <span>{application.candidateEmail}</span>
                      </div>
                      {application.candidatePhone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>{application.candidatePhone}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex flex-col space-y-2">
                      <div className="flex space-x-2">
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                          Contact
                        </button>
                        <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors">
                          Status
                        </button>
                      </div>
                      
                      {application.resumeUrl && (
                        <a
                          href={application.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center space-x-1 px-3 py-2 border border-blue-300 text-blue-600 text-sm rounded hover:bg-blue-50 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>Call from app</span>
                        </a>
                      )}
                    </div>
                    
                    {/* Status update buttons */}
                    <div className="flex flex-col space-y-1">
                      {application.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateApplicationStatus(application._id, 'shortlisted')}
                            disabled={updating === application._id}
                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => updateApplicationStatus(application._id, 'reviewed')}
                            disabled={updating === application._id}
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                          >
                            Maybe
                          </button>
                          <button
                            onClick={() => updateApplicationStatus(application._id, 'rejected')}
                            disabled={updating === application._id}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Bottom section with additional info */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div>
                      Looking for Role Automation Test Engineer. I am skilled in Core Java...
                    </div>
                    <div className="text-xs">
                      Applied {new Date(application.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationManager;