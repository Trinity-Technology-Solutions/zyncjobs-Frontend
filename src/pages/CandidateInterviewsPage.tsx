import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, MapPin, Building, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { API_ENDPOINTS } from '../config/env';
import BackButton from '../components/BackButton';

interface Interview {
  _id: string;
  jobId: {
    _id: string;
    jobTitle: string;
    company: string;
  };
  candidateEmail: string;
  candidateName: string;
  interviewDate: string;
  interviewTime: string;
  interviewType: 'video' | 'in-person' | 'phone';
  meetingLink?: string;
  location?: string;
  interviewerName?: string;
  interviewerEmail?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  createdAt: string;
}

interface CandidateInterviewsPageProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

const CandidateInterviewsPage: React.FC<CandidateInterviewsPageProps> = ({ onNavigate, user }) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    fetchInterviews();
  }, [user]);

  const fetchInterviews = async () => {
    if (!user?.email) {
      console.log('CandidateInterviews: No user email found');
      setLoading(false);
      return;
    }

    try {
      console.log('CandidateInterviews: Fetching interviews for:', user.email);
      const url = `${API_ENDPOINTS.BASE_URL}/interviews/candidate/${encodeURIComponent(user.email)}`;
      console.log('CandidateInterviews: API URL:', url);
      
      const response = await fetch(url);
      console.log('CandidateInterviews: Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('CandidateInterviews: Received data:', data);
        console.log('CandidateInterviews: Number of interviews:', data.length);
        setInterviews(data);
      } else {
        console.error('CandidateInterviews: API error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('CandidateInterviews: Error details:', errorText);
      }
    } catch (error) {
      console.error('CandidateInterviews: Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'rescheduled': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5 text-blue-600" />;
      case 'in-person': return <MapPin className="w-5 h-5 text-green-600" />;
      case 'phone': return <User className="w-5 h-5 text-purple-600" />;
      default: return <Video className="w-5 h-5 text-gray-600" />;
    }
  };

  const filteredInterviews = interviews.filter(interview => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return interview.status === 'scheduled' || interview.status === 'rescheduled';
    if (filter === 'completed') return interview.status === 'completed';
    if (filter === 'cancelled') return interview.status === 'cancelled';
    return true;
  });

  const upcomingCount = interviews.filter(i => i.status === 'scheduled' || i.status === 'rescheduled').length;
  const completedCount = interviews.filter(i => i.status === 'completed').length;
  const cancelledCount = interviews.filter(i => i.status === 'cancelled').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BackButton 
                onClick={() => onNavigate('dashboard')}
                text="Back to Dashboard"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
              />
              <div className="text-2xl">📅</div>
              <h1 className="text-2xl font-bold text-gray-900">My Interviews</h1>
            </div>
            <button
              onClick={fetchInterviews}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-lg shadow-sm border card-hover">
            <div className="text-2xl font-bold text-gray-900">{interviews.length}</div>
            <div className="text-sm text-gray-600">Total Interviews</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg shadow-sm border border-blue-200 card-hover">
            <div className="text-2xl font-bold text-blue-600">{upcomingCount}</div>
            <div className="text-sm text-gray-600">Upcoming</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg shadow-sm border border-green-200 card-hover">
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-lg shadow-sm border border-red-200 card-hover">
            <div className="text-2xl font-bold text-red-600">{cancelledCount}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-sm border mb-6 card-hover">
          <div className="p-4 border-b">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {[
                { key: 'all', label: 'All', count: interviews.length },
                { key: 'upcoming', label: 'Upcoming', count: upcomingCount },
                { key: 'completed', label: 'Completed', count: completedCount },
                { key: 'cancelled', label: 'Cancelled', count: cancelledCount }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    filter === tab.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* Interviews List */}
          <div className="p-6">
            {filteredInterviews.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filter === 'all' ? 'No interviews scheduled' : `No ${filter} interviews`}
                </h3>
                <p className="text-gray-600">
                  {filter === 'all' 
                    ? 'Interviews scheduled by employers will appear here'
                    : `You don't have any ${filter} interviews at the moment`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInterviews.map((interview) => (
                  <div key={interview._id} className="bg-gradient-to-br from-white to-blue-50 border border-gray-200 rounded-lg p-6 card-hover shimmer-effect">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Company Logo */}
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                          <Building className="w-6 h-6 text-blue-600" />
                        </div>
                        
                        {/* Interview Details */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-lg text-gray-900">
                              {interview.jobId?.jobTitle || 'Job Title'}
                            </h3>
                            <div className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border ${getStatusColor(interview.status)} animate-pulse`}>
                              {getStatusIcon(interview.status)}
                              <span className="ml-2">{interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center space-x-2">
                              <Building className="w-4 h-4" />
                              <span className="font-medium">{interview.jobId?.company || 'Company'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getInterviewTypeIcon(interview.interviewType)}
                              <span className="capitalize">{interview.interviewType} Interview</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(interview.interviewDate).toLocaleDateString('en-IN', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              })}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>{interview.interviewTime}</span>
                            </div>
                          </div>

                          {/* Interviewer Info */}
                          {interview.interviewerName && (
                            <div className="mb-3 text-sm text-gray-600">
                              <span className="font-medium">Interviewer:</span> {interview.interviewerName}
                              {interview.interviewerEmail && ` (${interview.interviewerEmail})`}
                            </div>
                          )}

                          {/* Location or Meeting Link */}
                          {interview.interviewType === 'video' && interview.meetingLink && (
                            <div className="mb-3">
                              <a 
                                href={interview.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
                              >
                                <Video className="w-4 h-4" />
                                <span>Join Video Call</span>
                              </a>
                            </div>
                          )}

                          {interview.interviewType === 'in-person' && interview.location && (
                            <div className="mb-3 text-sm text-gray-600">
                              <div className="flex items-start space-x-2">
                                <MapPin className="w-4 h-4 mt-0.5" />
                                <span>{interview.location}</span>
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {interview.notes && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-sm text-gray-600 mb-1">
                                <span className="font-medium">Notes:</span>
                              </div>
                              <p className="text-sm text-gray-700">{interview.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2">
                        <button 
                          onClick={() => onNavigate(`job-detail/${interview.jobId?._id}`)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          View Job
                        </button>
                        {interview.status === 'scheduled' && interview.interviewType === 'video' && interview.meetingLink && (
                          <a
                            href={interview.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors text-center"
                          >
                            Join Now
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Bottom Info */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        Scheduled on {new Date(interview.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateInterviewsPage;

