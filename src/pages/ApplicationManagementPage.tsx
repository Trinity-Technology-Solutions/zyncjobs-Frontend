import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import ScheduleInterviewModal from '../components/ScheduleInterviewModal';
import { API_ENDPOINTS } from '../config/api';

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

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      
      // Get the specific job ID from sessionStorage (set by JobManagementPage)
      const jobId = sessionStorage.getItem('selectedJobId');
      
      if (!jobId) {
        setApplications([]);
        setError('No job selected');
        return;
      }
      
      // Fetch applications from API
      const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}/job/${jobId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      
      const fetchedApplications = await response.json();
      
      // Transform applications to include job details
      const applicationsWithJobDetails = await Promise.all(
        fetchedApplications.map(async (app: any) => {
          try {
            const jobResponse = await fetch(`${API_ENDPOINTS.JOBS}/${app.jobId}`);
            const jobData = jobResponse.ok ? await jobResponse.json() : null;
            
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
          app._id === id ? { ...app, status: newStatus } : app
        )
      );
    } catch (error) {
      console.error('Error updating application status:', error);
      setError('Failed to update application status');
    }
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
        <Footer onNavigate={onNavigate} />
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Applications for {sessionStorage.getItem('selectedJobTitle') || 'Job Position'}
          </h1>
          <p className="text-gray-600">
            Manage applications for this specific job position at {sessionStorage.getItem('selectedJobCompany') || 'Company'}
          </p>
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
        </div>

        {/* Applications Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Applications for {sessionStorage.getItem('selectedJobTitle') || 'This Job'}</h2>
            <p className="text-sm text-gray-600 mt-1">Showing {applications.length} applications for this position only</p>
          </div>
          
          {applications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((application) => (
                    <tr key={application._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {application.candidateName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.candidateEmail}
                          </div>
                          {application.candidatePhone && (
                            <div className="text-sm text-gray-500">
                              {application.candidatePhone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{application.jobTitle}</div>
                        <div className="text-sm text-gray-500">{application.company}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(application.appliedDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                          {application.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onNavigate('candidate-response-detail', { application })}
                            className="text-gray-700 hover:text-gray-900 border border-gray-300 px-3 py-1 rounded text-xs hover:bg-gray-50 transition-colors"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => {
                              setSelectedApplication(application);
                              setShowScheduleModal(true);
                            }}
                            className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
                          >
                            Schedule Interview
                          </button>
                          <select
                            value={application.status}
                            onChange={(e) => updateApplicationStatus(application._id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                            aria-label={`Update status for ${application.candidateName}'s application`}
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      {/* Schedule Interview Modal */}
      {showScheduleModal && selectedApplication && (
        <ScheduleInterviewModal
          application={selectedApplication}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedApplication(null);
          }}
          onSuccess={() => {
            fetchApplications();
          }}
        />
      )}

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default ApplicationManagementPage;