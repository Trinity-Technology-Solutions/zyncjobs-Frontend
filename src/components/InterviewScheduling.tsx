import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Phone, MapPin, CheckCircle, XCircle } from 'lucide-react';
import BackButton from './BackButton';
import { API_ENDPOINTS } from '../config/env';

const InterviewScheduling = () => {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    scheduledDate: '',
    duration: 60,
    type: 'video',
    meetingLink: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.INTERVIEWS}/my-interviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInterviews(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch interviews:', response.status);
        setInterviews([]);
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
      setInterviews([]);
    }
  };

  const fetchAvailableSlots = async (date: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.INTERVIEWS}/available-slots?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` }
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
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.INTERVIEWS}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          jobId: selectedApplication?.jobId,
          candidateId: selectedApplication?.candidateId,
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
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error scheduling interview:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const generateZoomLink = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.MEETINGS}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          platform: 'zoom',
          topic: 'Interview Meeting',
          start_time: formData.scheduledDate,
          duration: formData.duration,
          description: 'Interview meeting scheduled via ZyncJobs'
        })
      });
      
      const result = await response.json();
      if (result.success) {
        const meetingLink = result.meeting.join_url || result.meeting.joinUrl;
        setFormData({ ...formData, meetingLink });
        alert('Zoom meeting created successfully!');
      } else {
        alert('Error: ' + (result.error || result.message));
      }
    } catch (error) {
      alert('Error creating Zoom meeting: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const generateGoogleMeetLink = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.MEETINGS}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          platform: 'googlemeet',
          topic: 'Interview Meeting',
          start_time: formData.scheduledDate,
          duration: formData.duration,
          description: 'Interview meeting scheduled via ZyncJobs'
        })
      });
      
      const result = await response.json();
      if (result.success) {
        const meetingLink = result.meeting.join_url || result.meeting.meetLink;
        setFormData({ ...formData, meetingLink });
        alert('Google Meet created successfully!');
      } else {
        alert('Error: ' + (result.error || result.message));
      }
    } catch (error) {
      alert('Error creating Google Meet: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const confirmInterview = async (interviewId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_ENDPOINTS.INTERVIEWS}/${interviewId}/confirm`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchInterviews();
    } catch (error) {
      console.error('Error confirming interview:', error);
    }
  };

  const rescheduleInterview = async (interviewId: string, newDate: Date) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_ENDPOINTS.INTERVIEWS}/${interviewId}/reschedule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ scheduledDate: newDate })
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
        <button
          onClick={() => setShowScheduleModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Schedule Interview
        </button>
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
                    href={interview.meetingLink}
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
                <select
                  id="interview-duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                  aria-label="Select interview duration"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              <div>
                <label htmlFor="interview-type" className="block text-sm font-medium mb-1">Type</label>
                <select
                  id="interview-type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  aria-label="Select interview type"
                >
                  <option value="video">Video Call</option>
                  <option value="phone">Phone Call</option>
                  <option value="in-person">In Person</option>
                </select>
              </div>

              {formData.type === 'video' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Meeting Link</label>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => generateZoomLink()}
                        className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 14.432c-.054.288-.288.432-.576.432H7.008c-.288 0-.522-.144-.576-.432L6.24 9.568c-.054-.288.09-.568.378-.568h10.764c.288 0 .432.28.378.568l-.192 4.864z"/>
                        </svg>
                        Open Zoom
                      </button>
                      <button
                        type="button"
                        onClick={() => generateGoogleMeetLink()}
                        className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.4 16.2H6.6c-.33 0-.6-.27-.6-.6V8.4c0-.33.27-.6.6-.6h10.8c.33 0 .6.27.6.6v7.2c0 .33-.27.6-.6.6z"/>
                        </svg>
                        Create Meet
                      </button>
                    </div>
                    <input
                      type="url"
                      value={formData.meetingLink}
                      onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                      placeholder="Or paste meeting link here..."
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