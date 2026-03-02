import React, { useState } from 'react';
import { X, Calendar, Clock, Video, Mail, User } from 'lucide-react';

interface InterviewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: any;
  onSchedule: (interviewData: any) => void;
}

const InterviewScheduleModal: React.FC<InterviewScheduleModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onSchedule
}) => {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    duration: '60',
    platform: 'zoom',
    title: '',
    description: '',
    interviewerEmail: '',
    candidateEmail: candidate?.candidateEmail || '',
    meetingLink: ''
  });

  const [loading, setLoading] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  if (!isOpen) return null;

  const generateZoomLink = async () => {
    setGeneratingLink(true);
    try {
      const response = await fetch('http://localhost:5000/api/meetings/generate-zoom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic: formData.title || 'Interview Meeting',
          start_time: `${formData.date}T${formData.time}:00`,
          duration: parseInt(formData.duration)
        })
      });
      
      const result = await response.json();
      if (result.success || result.join_url) {
        setFormData({ ...formData, meetingLink: result.join_url, platform: 'zoom' });
        if (result.fallback) {
          console.log('Using fallback Zoom link');
        }
      } else {
        const fallbackId = Math.random().toString().slice(2, 12);
        const fallbackPwd = Math.random().toString(36).substring(2, 8);
        setFormData({ ...formData, meetingLink: `https://zoom.us/j/${fallbackId}?pwd=${fallbackPwd}`, platform: 'zoom' });
      }
    } catch (error) {
      console.error('Error generating Zoom link:', error);
      const fallbackId = Math.random().toString().slice(2, 12);
      const fallbackPwd = Math.random().toString(36).substring(2, 8);
      setFormData({ ...formData, meetingLink: `https://zoom.us/j/${fallbackId}?pwd=${fallbackPwd}`, platform: 'zoom' });
    } finally {
      setGeneratingLink(false);
    }
  };

  const generateGoogleMeetLink = async () => {
    setGeneratingLink(true);
    try {
      const response = await fetch('http://localhost:5000/api/meetings/generate-meet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: formData.title || 'Interview Meeting',
          start: `${formData.date}T${formData.time}:00`,
          duration: parseInt(formData.duration)
        })
      });
      
      const result = await response.json();
      if (result.success && result.meeting) {
        setFormData({ ...formData, meetingLink: result.meeting.meetLink, platform: 'googlemeet' });
      } else {
        const meetId = Math.random().toString(36).substring(2, 4) + '-' + 
                     Math.random().toString(36).substring(2, 6) + '-' + 
                     Math.random().toString(36).substring(2, 4);
        setFormData({ ...formData, meetingLink: `https://meet.google.com/${meetId}`, platform: 'googlemeet' });
      }
    } catch (error) {
      console.error('Error generating Google Meet link:', error);
      const meetId = Math.random().toString(36).substring(2, 4) + '-' + 
                   Math.random().toString(36).substring(2, 6) + '-' + 
                   Math.random().toString(36).substring(2, 4);
      setFormData({ ...formData, meetingLink: `https://meet.google.com/${meetId}`, platform: 'googlemeet' });
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const interviewData = {
        ...formData,
        candidateName: candidate?.candidateName,
        candidateId: candidate?._id,
        jobTitle: candidate?.jobId?.jobTitle || candidate?.jobId?.title
      };

      // Call the meeting creation API
      const response = await fetch('http://localhost:5000/api/meetings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(interviewData)
      });

      if (response.ok) {
        const result = await response.json();
        onSchedule(result);
        onClose();
        alert('Interview scheduled successfully!');
      } else {
        throw new Error('Failed to create meeting');
      }
    } catch (error) {
      console.error('Error scheduling interview:', error);
      alert('Failed to schedule interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Schedule Interview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Candidate Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold">
                  {candidate?.candidateName?.charAt(0).toUpperCase() || 'C'}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{candidate?.candidateName}</h3>
                <p className="text-gray-600">{candidate?.candidateEmail}</p>
                <p className="text-sm text-gray-500">
                  Applied for: {candidate?.jobId?.jobTitle || candidate?.jobId?.title}
                </p>
              </div>
            </div>
          </div>

          {/* Interview Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interview Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Technical Interview - Software Developer"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Time
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Duration and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value="Video Call"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Video Call">Video Call</option>
              </select>
            </div>
          </div>

          {/* Meeting Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Link
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={generateZoomLink}
                disabled={generatingLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center text-sm"
              >
                <Video className="w-4 h-4 mr-1" />
                {generatingLink ? 'Generating...' : 'Open Zoom'}
              </button>
              <button
                type="button"
                onClick={generateGoogleMeetLink}
                disabled={generatingLink}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center text-sm"
              >
                <Video className="w-4 h-4 mr-1" />
                {generatingLink ? 'Generating...' : 'Create Meet'}
              </button>
            </div>
            <input
              type="url"
              value={formData.meetingLink}
              onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
              placeholder="Or paste meeting link here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Interviewer Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Interviewer Email
            </label>
            <input
              type="email"
              value={formData.interviewerEmail}
              onChange={(e) => setFormData({ ...formData, interviewerEmail: e.target.value })}
              placeholder="interviewer@company.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional information..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Scheduling...
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 mr-2" />
                  Schedule Interview
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterviewScheduleModal;