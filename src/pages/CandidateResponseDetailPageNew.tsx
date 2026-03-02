import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import { API_ENDPOINTS } from '../config/api';
import { API_ENDPOINTS as ENV_API } from '../config/env';

interface CandidateResponseDetailPageProps {
  onNavigate: (page: string, data?: any) => void;
  applicationId?: string;
  user?: any;
  onLogout?: () => void;
}

const CandidateResponseDetailPage: React.FC<CandidateResponseDetailPageProps> = ({ 
  onNavigate, 
  applicationId, 
  user, 
  onLogout 
}) => {
  const [status, setStatus] = useState('pending');
  const [comment, setComment] = useState('');
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchApplicationData();
    
    // Debug user data
    console.log('User prop in CandidateResponseDetailPage:', user);
    const storedUser = localStorage.getItem('user');
    console.log('Stored user in localStorage:', storedUser);
  }, []);

  const fetchApplicationData = async () => {
    try {
      setLoading(true);
      const jobId = sessionStorage.getItem('selectedJobId');
      
      if (!jobId) {
        console.error('No job ID found');
        return;
      }

      // Fetch applications for this job
      const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}/job/${jobId}`);
      if (response.ok) {
        const fetchedApplications = await response.json();
        setApplications(fetchedApplications);
        
        // If we have applications, set the first one as the current candidate
        if (fetchedApplications.length > 0) {
          const firstApp = fetchedApplications[0];
          
          // Fetch candidate profile data
          let candidateProfile = null;
          if (firstApp.candidateId) {
            try {
              const userResponse = await fetch(`${API_ENDPOINTS.USERS}/${firstApp.candidateId}`);
              if (userResponse.ok) {
                candidateProfile = await userResponse.json();
              }
            } catch (error) {
              console.error('Error fetching candidate profile:', error);
            }
          }
          
          setCandidate({
            _id: firstApp._id,
            candidateName: firstApp.candidateName,
            candidateEmail: firstApp.candidateEmail,
            candidatePhone: firstApp.candidatePhone || candidateProfile?.phone || 'Not provided',
            experience: candidateProfile?.yearsExperience || 'Not specified',
            salary: candidateProfile?.salary || 'Not specified',
            expectedSalary: 'Not specified',
            location: candidateProfile?.location || 'Not specified',
            canJoinIn: candidateProfile?.availability || 'Not specified',
            status: firstApp.status,
            recommended: false,
            appliedDate: firstApp.createdAt || firstApp.appliedDate,
            jobTitle: sessionStorage.getItem('selectedJobTitle') || 'Job Position',
            company: sessionStorage.getItem('selectedJobCompany') || 'Company',
            previousRole: candidateProfile?.experience || candidateProfile?.workExperience || 'Not specified',
            education: candidateProfile?.education || 'Not specified',
            prefLocations: candidateProfile?.location ? [candidateProfile.location] : ['Not specified'],
            keySkills: candidateProfile?.skills || [],
            coverLetter: firstApp.coverLetter || 'No cover letter provided',
            resume: firstApp.resumeUrl || candidateProfile?.resume?.url || candidateProfile?.resume?.filename || 'No resume attached',
            resumeData: firstApp.resumeData || candidateProfile?.resume || null,
            department: 'Not specified',
            role: candidateProfile?.title || candidateProfile?.jobTitle || 'Not specified',
            industry: 'Not specified',
            highestDegree: candidateProfile?.education || 'Not specified'
          });
          setStatus(firstApp.status);
        }
      }
    } catch (error) {
      console.error('Error fetching application data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!candidate) return;
    
    try {
      const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}/${candidate._id}/status`, {
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
      
      if (response.ok) {
        setStatus(newStatus);
        setCandidate((prev: any) => ({ ...prev, status: newStatus }));
        console.log('Status updated to:', newStatus);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleContact = () => {
    if (!candidate) {
      console.error('No candidate data available');
      return;
    }

    const subject = `Application Status Update - ${candidate.jobTitle} at ${candidate.company}`;
    const statusText = status === 'shortlisted' ? 'shortlisted for the next round' : 
                      status === 'reviewed' ? 'under review' :
                      status === 'rejected' ? 'not selected for this position' :
                      'received and being processed';
    
    const body = `Dear ${candidate.candidateName},

Thank you for your interest in the ${candidate.jobTitle} position at ${candidate.company}.

Your application has been ${statusText}.

${status === 'shortlisted' ? 'We would like to schedule an interview with you. Please reply with your availability for the next few days.' : 
  status === 'reviewed' ? 'We are currently reviewing your application and will get back to you soon.' :
  status === 'rejected' ? 'While your profile is impressive, we have decided to move forward with other candidates for this particular role. We encourage you to apply for future openings that match your skills.' :
  'We will review your application and update you on the next steps soon.'}

Best regards,
Hiring Team
${candidate.company}`;

    const mailtoLink = `mailto:${candidate.candidateEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    console.log('Opening email with:', mailtoLink);
    window.location.href = mailtoLink;
  };

  // Filter applications based on active filter
  const filteredApplications = activeFilter === 'all' 
    ? applications 
    : applications.filter(app => app.status === activeFilter);

  // Get current candidate based on filtered applications
  const getCurrentCandidate = () => {
    if (filteredApplications.length === 0) return null;
    return filteredApplications[0]; // Show first application from filtered list
  };

  const currentCandidate = getCurrentCandidate();

  const getStatusColor = (currentStatus: string) => {
    switch (currentStatus) {
      case 'shortlisted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Status Filters */}
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeFilter === 'all' 
                    ? 'text-red-600 border-red-600' 
                    : 'text-gray-500 hover:text-gray-700 border-transparent'
                }`}
              >
                All responses {applications.length}
              </button>
              <button 
                onClick={() => setActiveFilter('shortlisted')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeFilter === 'shortlisted' 
                    ? 'text-red-600 border-red-600' 
                    : 'text-gray-500 hover:text-gray-700 border-transparent'
                }`}
              >
                Shortlisted {applications.filter(app => app.status === 'shortlisted').length}
              </button>
              <button 
                onClick={() => setActiveFilter('reviewed')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeFilter === 'reviewed' 
                    ? 'text-red-600 border-red-600' 
                    : 'text-gray-500 hover:text-gray-700 border-transparent'
                }`}
              >
                Maybe {applications.filter(app => app.status === 'reviewed').length}
              </button>
              <button 
                onClick={() => setActiveFilter('rejected')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeFilter === 'rejected' 
                    ? 'text-red-600 border-red-600' 
                    : 'text-gray-500 hover:text-gray-700 border-transparent'
                }`}
              >
                Rejected {applications.filter(app => app.status === 'rejected').length}
              </button>
            </div>

            {/* Right: View Options */}
            <div className="flex items-center space-x-2">
              <button 
                className="p-2 text-blue-600 bg-blue-50 rounded"
                title="Grid view"
                aria-label="Grid view"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </button>
              <button 
                className="p-2 text-gray-400 hover:text-gray-600 rounded"
                title="List view"
                aria-label="List view"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => console.log('All applications filter')}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full font-medium hover:bg-blue-200"
              >
                All {applications.length}
              </button>
              <button 
                onClick={() => console.log('New responses filter')}
                className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full font-medium hover:bg-green-200"
              >
                New responses {applications.length}
              </button>
              <button 
                onClick={() => console.log('Not viewed filter')}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
              >
                Not viewed {applications.length}
              </button>
              <button 
                onClick={() => console.log('Action pending filter')}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
              >
                Action pending {applications.length}
              </button>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Showing {filteredApplications.length} responses</span>
              <div className="flex items-center space-x-2">
                <span>Sort by:</span>
                <select 
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  title="Sort options"
                  aria-label="Sort by"
                >
                  <option>Relevance</option>
                  <option>Date</option>
                  <option>Experience</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <span>Show:</span>
                <select 
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  title="Items per page"
                  aria-label="Items per page"
                >
                  <option>40</option>
                  <option>20</option>
                  <option>60</option>
                </select>
              </div>
              <span>Page 1 of 1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                className="mr-2"
                title="Select all candidates"
                aria-label="Select all candidates"
              />
              <span className="text-sm text-gray-600">Select all</span>
            </label>
            <button 
              onClick={() => console.log('Shortlist selected candidates')}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <span>✓</span>
              <span>Shortlist</span>
            </button>
            <button 
              onClick={() => console.log('Reject selected candidates')}
              className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-800"
            >
              <span>✗</span>
              <span>Reject</span>
            </button>
            <button 
              onClick={() => console.log('Send assessment to selected candidates')}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
            >
              <span>📋</span>
              <span>Send assessment</span>
            </button>
            <button 
              onClick={() => candidate?.candidateEmail && (window.location.href = `mailto:${candidate.candidateEmail}`)}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
            >
              <span>✉️</span>
              <span>Email</span>
            </button>
            <button 
              onClick={() => console.log('Download candidate data')}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
            >
              <span>⬇️</span>
              <span>Download</span>
            </button>
            <button 
              onClick={() => console.log('Delete selected candidates')}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
            >
              <span>🗑️</span>
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading candidate details...</p>
          </div>
        ) : !currentCandidate ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {activeFilter === 'all' 
                ? 'No candidate data found' 
                : `No ${activeFilter} applications found`
              }
            </p>
            <button 
              onClick={() => onNavigate('application-management')}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              ← Back to Application Management
            </button>
          </div>
        ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            {/* Left: Candidate Info */}
            <div className="flex items-start space-x-4 flex-1">
              <input 
                type="checkbox" 
                className="mt-2"
                title="Select candidate"
                aria-label="Select candidate"
              />
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {currentCandidate.candidateName?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                    
                    {/* Candidate Details */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{currentCandidate.candidateName}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(currentCandidate.status)}`}>
                          {currentCandidate.status?.charAt(0).toUpperCase() + currentCandidate.status?.slice(1)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <span>💼 {currentCandidate.experience || 'Not specified'}</span>
                        <span>💰 {currentCandidate.salary || 'Not specified'}</span>
                        <span>📍 {currentCandidate.location || 'Not specified'}</span>
                        <span>⏰ Can join in {currentCandidate.canJoinIn || 'Not specified'}</span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">Applied:</span>
                          <span className="ml-2 text-gray-900">{new Date(currentCandidate.createdAt || currentCandidate.appliedDate).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Email:</span>
                          <span className="ml-2 text-gray-900">{currentCandidate.candidateEmail}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <span className="ml-2 text-gray-900">{currentCandidate.candidatePhone || 'Not provided'}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-sm text-gray-700">
                        <span className="text-gray-500">Cover Letter:</span>
                        <div className="mt-1">{currentCandidate.coverLetter || 'Applied using Quick Apply with saved resume'}</div>
                      </div>
                      
                      <div className="mt-3 text-sm text-gray-700">
                        <span className="text-gray-500">Resume:</span>
                        <div className="mt-1">
                          {currentCandidate.resumeUrl || currentCandidate.resumeData ? (
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => {
                                  const resumeData = currentCandidate.resumeData;
                                  const resumeUrl = currentCandidate.resumeUrl;
                                  
                                  // Try different resume access methods
                                  if (resumeData?.url && resumeData.url.startsWith('http')) {
                                    window.open(resumeData.url, '_blank');
                                  } else if (resumeUrl && resumeUrl.startsWith('http')) {
                                    window.open(resumeUrl, '_blank');
                                  } else if (resumeData?.filename) {
                                    // Try to construct URL from filename
                                    const fileUrl = `${ENV_API.BASE_URL}/uploads/${resumeData.filename}`;
                                    window.open(fileUrl, '_blank');
                                  } else {
                                    // Show resume information
                                    const resumeName = resumeData?.name || resumeData?.filename || resumeUrl || 'Resume';
                                    const uploadDate = resumeData?.uploadDate ? new Date(resumeData.uploadDate).toLocaleDateString() : 'Unknown';
                                    const status = resumeData?.status || 'Available';
                                    
                                    alert(`Resume Information:\n\nName: ${resumeName}\nUpload Date: ${uploadDate}\nStatus: ${status}\n\nNote: Resume was uploaded by candidate during application process.`);
                                  }
                                }}
                                className="text-blue-600 hover:text-blue-800 underline cursor-pointer flex items-center space-x-1"
                              >
                                <span>📄</span>
                                <span>View Resume</span>
                              </button>
                              <span className="text-gray-500 text-xs">
                                ({currentCandidate.resumeData?.name || currentCandidate.resumeUrl || 'Resume file'})
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500">No resume attached</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right: Actions */}
                  <div className="flex flex-col items-end space-y-3">
                    <button 
                      onClick={() => currentCandidate?.candidateEmail && (window.location.href = `mailto:${currentCandidate.candidateEmail}`)}
                      className="text-gray-400 hover:text-gray-600 p-2 rounded hover:bg-gray-100"
                      title="Send email to candidate"
                    >
                      ✉️
                    </button>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-2">
                        <button 
                          onClick={() => {
                            if (!currentCandidate) return;
                            const subject = `Application Status Update - ${sessionStorage.getItem('selectedJobTitle')} at ${sessionStorage.getItem('selectedJobCompany')}`;
                            const body = `Dear ${currentCandidate.candidateName},\n\nThank you for your application. We will review it and get back to you soon.\n\nBest regards,\nHiring Team`;
                            window.location.href = `mailto:${currentCandidate.candidateEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                          }}
                          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                        >
                          📧 Send Email
                        </button>
                        <select
                          value={currentCandidate.status}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            handleStatusUpdate(newStatus);
                            // Update the current candidate status locally
                            setApplications(prev => 
                              prev.map(app => 
                                app._id === currentCandidate._id 
                                  ? { ...app, status: newStatus } 
                                  : app
                              )
                            );
                          }}
                          className="border border-gray-300 rounded px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                          title="Application status"
                          aria-label="Change application status"
                        >
                          <option value="pending">Pending</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="reviewed">Maybe</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      
                      <button 
                        onClick={() => currentCandidate?.candidatePhone ? window.open(`tel:${currentCandidate.candidatePhone}`) : alert('Phone number not available')}
                        className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer bg-blue-50 px-3 py-1 rounded"
                      >
                        📱 Call from app →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Back Button */}
        <div className="mt-6">
          <BackButton 
            onClick={() => onNavigate('application-management')}
            text="Back to Application Management"
          />
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default CandidateResponseDetailPage;