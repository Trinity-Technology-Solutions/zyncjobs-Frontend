import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Phone, Download, MessageSquare, Share, Trash2, MessageCircle, FileText, MapPin, Calendar, Briefcase, GraduationCap, DollarSign, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

interface CandidateResponseDetailPageProps {
  onNavigate: (page: string, data?: any) => void;
  applicationId?: string;
}

const CandidateResponseDetailPage: React.FC<CandidateResponseDetailPageProps> = ({ onNavigate, applicationId }) => {
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    if (applicationId) {
      fetchApplicationDetails();
    }
  }, [applicationId]);

  const fetchApplicationDetails = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/applications/${applicationId}`);
      if (response.ok) {
        const data = await response.json();
        setApplication(data);
        setStatus(data.status || 'pending');
      }
    } catch (error) {
      console.error('Error fetching application details:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        setStatus(newStatus);
        setApplication(prev => ({ ...prev, status: newStatus }));
        alert(`Application ${newStatus} successfully!`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleEmailContact = () => {
    const subject = `Regarding your application for ${application.jobId?.jobTitle || 'Position'}`;
    const body = `Hi ${application.candidateName},\n\nThank you for your interest in the ${application.jobId?.jobTitle || 'position'} role.\n\nBest regards`;
    window.open(`mailto:${application.candidateEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handlePhoneContact = () => {
    if (application.candidatePhone) {
      window.open(`tel:${application.candidatePhone}`);
    } else {
      alert('Phone number not available');
    }
  };

  const handleWhatsAppContact = () => {
    if (application.candidatePhone) {
      const message = `Hi ${application.candidateName}, regarding your application for ${application.jobId?.jobTitle || 'position'}`;
      window.open(`https://wa.me/${application.candidatePhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`);
    } else {
      alert('Phone number not available for WhatsApp');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Application not found</h2>
          <button
            onClick={() => onNavigate('job-management')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Job Management
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <button
              onClick={() => onNavigate('job-management')}
              className="flex items-center text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              All Jobs
            </button>
            <span>›</span>
            <button
              onClick={() => onNavigate('job-management')}
              className="text-blue-600 hover:text-blue-700"
            >
              {application.jobId?.jobTitle || 'Job Title'}
            </button>
            <span>›</span>
            <span className="text-gray-900">{application.candidateName}</span>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => updateStatus('shortlisted')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  status === 'shortlisted'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                Shortlist
              </button>
              <button
                onClick={() => updateStatus('reviewed')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  status === 'reviewed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                Maybe
              </button>
              <button
                onClick={() => updateStatus('rejected')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  status === 'rejected'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                Reject
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button 
                onClick={handleEmailContact}
                className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded"
                title="Send Email"
              >
                <Mail className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded">
                <Share className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded">
                <Download className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded">
                <Trash2 className="w-4 h-4" />
              </button>
              <button 
                onClick={handleWhatsAppContact}
                className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded"
                title="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded">
                <FileText className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900">
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Candidate Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Candidate Header */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {getInitials(application.candidateName)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{application.candidateName}</h1>
                    {status === 'shortlisted' && (
                      <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4">
                    Looking for Role Automation Test Engineer. I am skilled in Core Java, Selenium, WebDriver, JUnit, TestNG, Page Object Model, BDD Cucumber, Data Driven Framework, Hybrid Framework, Git, GitLab, Jira, Appium, Rest assured, Swagger
                  </p>
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => setShowContactModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Contact
                    </button>
                    <select
                      value={status}
                      onChange={(e) => updateStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pending">Status</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="rejected">Rejected</option>
                      <option value="hired">Hired</option>
                    </select>
                  </div>
                </div>
              </div>

              {application.resumeUrl && (
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={() => window.open(application.resumeUrl, '_blank')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Resume
                  </button>
                </div>
              )}

              <div className="mt-4 pt-4 border-t flex items-center space-x-4">
                <button 
                  onClick={() => setShowContactModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Contact
                </button>
                <button 
                  onClick={handlePhoneContact}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Call from app →
                </button>
              </div>
            </div>

            {/* Candidate Details */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Candidate Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600">Current Location:</label>
                    <p className="font-medium text-gray-900">Chennai</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-600">Preferred Locations:</label>
                    <p className="font-medium text-gray-900">Pune, Noida, Remote, Chennai, Kolkata, Gurugram +5 more</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-600">Department:</label>
                    <p className="font-medium text-gray-900">Engineering - Software & QA</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-600">Role:</label>
                    <p className="font-medium text-gray-900">Automation Test Engineer</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-600">Industry:</label>
                    <p className="font-medium text-gray-900">Software Product</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600">Experience:</label>
                    <p className="font-medium text-gray-900">4 years 4 months</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-600">Current Salary:</label>
                    <p className="font-medium text-gray-900">₹ 5 lac(s)</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-600">Expected Salary:</label>
                    <p className="font-medium text-gray-900">₹ 8 lac(s)</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-600">Highest Degree:</label>
                    <p className="font-medium text-gray-900">B.Tech/B.E.</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-600">Available to join in:</label>
                    <p className="font-medium text-gray-900">15 Days or less</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <label className="text-sm text-gray-600">Key Skills:</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Appium', 'Rest Assured', 'Postman Tool', 'Postman API', 'Selenium', 'Java', 'Integration Testing', 'Regression Testing', 'Test Data Management', 'Selenium WebDriver', 'Maven', 'Testing', 'JUnit', 'XPath', 'Cucumber', 'Page Object Model', 'Data Driven Framework', 'Automation Testing', 'BDD Framework', 'POM'].map((skill, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Comments */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Comments</h3>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Type your comment here"
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Add Comment
              </button>
            </div>

            {/* Application Info */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Application Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Applied:</span>
                  <span className="font-medium">{new Date(application.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    status === 'shortlisted' ? 'text-green-600' :
                    status === 'rejected' ? 'text-red-600' :
                    status === 'reviewed' ? 'text-blue-600' :
                    'text-yellow-600'
                  }`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{application.candidateEmail}</span>
                </div>
                {application.candidatePhone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{application.candidatePhone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Contact {application.candidateName}</h3>
            <div className="space-y-3">
              <button
                onClick={() => { handleEmailContact(); setShowContactModal(false); }}
                className="w-full flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Mail className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">Send Email</div>
                  <div className="text-sm text-gray-600">{application.candidateEmail}</div>
                </div>
              </button>
              
              {application.candidatePhone && (
                <>
                  <button
                    onClick={() => { handlePhoneContact(); setShowContactModal(false); }}
                    className="w-full flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Phone className="w-5 h-5 text-green-600" />
                    <div className="text-left">
                      <div className="font-medium">Call</div>
                      <div className="text-sm text-gray-600">{application.candidatePhone}</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => { handleWhatsAppContact(); setShowContactModal(false); }}
                    className="w-full flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <div className="text-left">
                      <div className="font-medium">WhatsApp</div>
                      <div className="text-sm text-gray-600">{application.candidatePhone}</div>
                    </div>
                  </button>
                </>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowContactModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateResponseDetailPage;