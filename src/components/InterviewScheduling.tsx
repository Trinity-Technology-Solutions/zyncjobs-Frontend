import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Phone, MapPin, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import BackButton from './BackButton';
import AutocompleteCombobox from './AutocompleteCombobox';
import { API_ENDPOINTS } from '../config/env';
import { getAuthHeaders, getApiHeaders } from '../utils/authUtils';
import { apiFetch } from '../api/apiFetch';
import { tokenStorage } from '../utils/tokenStorage';

const InterviewScheduling = () => {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    scheduledDate: '',
    duration: 60,
    type: 'video',
    meetingLink: '',
    location: '',
    notes: '',
    candidateEmail: ''
  });

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const response = await apiFetch(`${API_ENDPOINTS.INTERVIEWS}/my-interviews`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setInterviews(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch interviews:', response.status);
        setInterviews([]);
        if (refresh) window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Failed to refresh interviews. Please try again.' } }));
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
      setInterviews([]);
      if (refresh) window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Network error while refreshing interviews.' } }));
    } finally {
      if (refresh) setRefreshing(false);
    }
  };

  const fetchAvailableSlots = async (date: string) => {
    try {
      const response = await apiFetch(`${API_ENDPOINTS.INTERVIEWS}/available-slots?date=${date}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch slots:', response.status);
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      setAvailableSlots([]);
    }
  };

  const scheduleInterview = async () => {
    try {
      const response = await apiFetch(`${API_ENDPOINTS.INTERVIEWS}/schedule`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          ...formData,
          jobId: selectedApplication?.jobId,
          candidateId: selectedApplication?.candidateId,
          candidateEmail: selectedApplication?.candidateId?.email || formData.candidateEmail,
          applicationId: selectedApplication?._id
        })
      });
      
      if (response.ok) {
        setShowScheduleModal(false);
        fetchInterviews();
        setFormData({
          scheduledDate: '',
          duration: 60,
          type: 'video',
          meetingLink: '',
          location: '',
          notes: '',
          candidateEmail: ''
        });
      }
    } catch (error) {
      console.error('Error scheduling interview:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const generateZoomLink = async () => {
    try {
      const response = await apiFetch(`${API_ENDPOINTS.MEETINGS}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenStorage.getAccess() || ''}`
        },
        body: JSON.stringify({
          platform: 'zoom',
          topic: 'Interview Meeting',
          start_time: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(formData.scheduledDate)
            ? new Date(formData.scheduledDate + ':00').toISOString()
            : new Date(formData.scheduledDate).toISOString(),
          duration: formData.duration,
          description: 'Interview meeting scheduled via ZyncJobs'
        })
      });
      const result = await response.json();
      if (result.success && result.meeting?.join_url) {
        setFormData({ ...formData, meetingLink: result.meeting.join_url });
        window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Zoom meeting created successfully!' } }));
      } else {
        window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Error: ' + (result.error || result.message) } }));
      }
    } catch (error) {
      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Error creating Zoom meeting: ' + (error instanceof Error ? error.message : 'Unknown error') } }));
    }
  };

  const confirmInterview = async (interviewId: string) => {
    try {
      await apiFetch(`${API_ENDPOINTS.INTERVIEWS}/${interviewId}/confirm`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      fetchInterviews();
    } catch (error) {
      console.error('Error confirming interview:', error);
    }
  };

  const rescheduleInterview = async (interviewId: string, newDate: Date) => {
    try {
      await apiFetch(`${API_ENDPOINTS.INTERVIEWS}/${interviewId}/reschedule`, {
        method: 'PATCH',
        headers: getApiHeaders(),
        body: JSON.stringify({ scheduledDate: newDate.toISOString() })
      });
      fetchInterviews();
    } catch (error) {
      console.error('Error rescheduling interview:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      rescheduled: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      video: <Video size={16} />,
      phone: <Phone size={16} />,
      'in-person': <MapPin size={16} />
    };
    return icons[type] || <Video size={16} />;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <BackButton 
          onClick={() => window.history.back()}
          text="Back"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
        />
      </div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Interview Scheduling</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchInterviews(true)}
            disabled={refreshing}
            className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Schedule Interview
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {interviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No interviews scheduled yet.</p>
          </div>
        ) : (
          interviews.map((interview) => (
            <div key={interview._id} className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{interview.jobId?.title}</h3>
                  <p className="text-gray-600">{interview.jobId?.company}</p>
                  <p className="text-sm text-gray-500">
                    Candidate: {interview.candidateId?.name}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(interview.status)}`}>
                  {interview.status}
                </span>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center text-gray-600">
                  <Calendar size={16} className="mr-2" />
                  {new Date(interview.scheduledDate).toLocaleDateString()}
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock size={16} className="mr-2" />
                  {new Date(interview.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-center text-gray-600">
                  {getTypeIcon(interview.type)}
                  <span className="ml-2 capitalize">{interview.type}</span>
                </div>
              </div>

              {interview.meetingLink && (
                <div className="mb-4">
                  <a
                    href={`${API_ENDPOINTS.BASE_URL}/meetings/interview/${interview._id || interview.id}/join`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Join Meeting
                  </a>
                </div>
              )}

              {interview.notes && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">{interview.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    {interview.candidateConfirmed ? (
                      <CheckCircle size={16} className="text-green-600 mr-1" />
                    ) : (
                      <XCircle size={16} className="text-red-600 mr-1" />
                    )}
                    <span className="text-sm">Candidate</span>
                  </div>
                  <div className="flex items-center">
                    {interview.employerConfirmed ? (
                      <CheckCircle size={16} className="text-green-600 mr-1" />
                    ) : (
                      <XCircle size={16} className="text-red-600 mr-1" />
                    )}
                    <span className="text-sm">Employer</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {interview.status === 'scheduled' && (
                    <button
                      onClick={() => confirmInterview(interview._id)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Confirm
                    </button>
                  )}
                  <button
                    onClick={() => rescheduleInterview(interview._id, new Date())}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Reschedule
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Schedule Interview</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="interview-datetime" className="block text-sm font-medium mb-1">Date & Time</label>
                <input
                  id="interview-datetime"
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => {
                    setFormData({ ...formData, scheduledDate: e.target.value });
                    if (e.target.value) {
                      fetchAvailableSlots(e.target.value.split('T')[0]);
                    }
                  }}
                  className="w-full p-2 border rounded-lg"
                  aria-label="Select interview date and time"
                />
              </div>

              <div>
                <label htmlFor="interview-duration" className="block text-sm font-medium mb-1">Duration (minutes)</label>
                <AutocompleteCombobox
                  label="Duration (minutes)"
                  value={String(formData.duration)}
                  onChange={(val) => setFormData({ ...formData, duration: parseInt(val) })}
                  options={[
                    { value: '30', label: '30 minutes' },
                    { value: '60', label: '1 hour' },
                    { value: '90', label: '1.5 hours' },
                    { value: '120', label: '2 hours' },
                  ]}
                  placeholder="Select duration"
                />
              </div>

              <div>
                <label htmlFor="interview-type" className="block text-sm font-medium mb-1">Type</label>
                <AutocompleteCombobox
                  label="Type"
                  value={formData.type}
                  onChange={(val) => setFormData({ ...formData, type: val })}
                  options={[
                    { value: 'video', label: 'Video Call' },
                    { value: 'phone', label: 'Phone Call' },
                    { value: 'in-person', label: 'In Person' },
                  ]}
                  placeholder="Select interview type"
                />
              </div>

              {formData.type === 'video' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Meeting Link</label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={generateZoomLink}
                      className="w-full flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition-colors shadow-sm"
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 14.432c-.054.288-.288.432-.576.432H7.008c-.288 0-.522-.144-.576-.432L6.24 9.568c-.054-.288.09-.568.378-.568h10.764c.288 0 .432.28.378.568l-.192 4.864z"/>
                      </svg>
                      Generate Zoom Link
                    </button>
                    <p className="text-xs text-gray-500">Or paste your own meeting link below</p>
                    <input
                      type="url"
                      value={formData.meetingLink}
                      onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                      placeholder="Paste your Zoom meeting link here..."
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </div>
              )}

              {formData.type === 'in-person' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Office address..."
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional information..."
                  className="w-full p-2 border rounded-lg h-20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Candidate Email</label>
                <input
                  type="email"
                  value={formData.candidateEmail}
                  onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })}
                  placeholder="candidate@example.com"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={scheduleInterview}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewScheduling;
