import React, { useState, useEffect } from 'react';
import { Video, X } from 'lucide-react';

interface ScheduleInterviewModalProps {
  application: any;
  existingRounds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

const ROUND_ORDER = ['HR', 'Technical', 'Managerial', 'Final'];

const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  application, existingRounds, onClose, onSuccess
}) => {
  const [formData, setFormData] = useState({
    round: 'HR',
    scheduledDate: '',
    duration: 60,
    type: 'video',
    meetingLink: '',
    location: '',
    notes: '',
    interviewer: ''
  });
  const [loading, setLoading] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [error, setError] = useState('');

  // Auto-select next available round
  useEffect(() => {
    const nextRound = ROUND_ORDER.find(r => !existingRounds.includes(r)) || 'HR';
    setFormData(prev => ({ ...prev, round: nextRound }));
  }, [existingRounds]);

  const zyncAlert = (msg: string) =>
    window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: msg } }));

  const isDuplicateRound = existingRounds.includes(formData.round);

  const scheduleInterview = async () => {
    if (!formData.scheduledDate) { setError('Please select a date and time'); return; }
    if (isDuplicateRound) { setError(`${formData.round} round is already scheduled`); return; }

    setLoading(true);
    setError('');
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const employerId = user.id || user._id || application.employerId || user.email;

      const payload = {
        applicationId: application._id,
        candidateEmail: application.candidateEmail,
        candidateName: application.candidateName,
        employerId,
        jobId: application.jobId?._id || application.jobId,
        round: formData.round,
        scheduledDate: formData.scheduledDate,
        duration: formData.duration,
        type: formData.type,
        meetingLink: formData.meetingLink,
        location: formData.location,
        notes: formData.notes,
        interviewer: formData.interviewer
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/interviews/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (response.ok && result.success) {
        zyncAlert(`${formData.round} round scheduled successfully! Email sent to candidate.`);
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Failed to schedule interview');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const generateGoogleMeetLink = async () => {
    if (!formData.scheduledDate) { zyncAlert('Please select a date and time first'); return; }
    setGeneratingLink(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/meetings/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'googlemeet',
          topic: `${formData.round} Interview - ${application.jobId?.jobTitle || application.jobId?.title}`,
          start_time: formData.scheduledDate,
          duration: formData.duration
        })
      });
      const result = await res.json();
      if (result.success && result.meeting?.meetLink) {
        setFormData(prev => ({ ...prev, meetingLink: result.meeting.meetLink }));
        window.open(result.meeting.meetLink, '_blank');
      } else {
        zyncAlert('Failed to generate Google Meet link');
      }
    } catch { zyncAlert('Error generating Meet link'); }
    finally { setGeneratingLink(false); }
  };

  const generateZoomLink = async () => {
    if (!formData.scheduledDate) { zyncAlert('Please select a date and time first'); return; }
    setGeneratingLink(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/meetings/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'zoom',
          topic: `${formData.round} Interview - ${application.jobId?.jobTitle || application.jobId?.title}`,
          start_time: formData.scheduledDate,
          duration: formData.duration
        })
      });
      const result = await res.json();
      if (result.success && result.meeting?.join_url) {
        setFormData(prev => ({ ...prev, meetingLink: result.meeting.join_url }));
      } else {
        zyncAlert('Failed to generate Zoom link');
      }
    } catch { zyncAlert('Error generating Zoom link'); }
    finally { setGeneratingLink(false); }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Schedule Interview Round</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" title="Close">
            <X size={24} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Candidate: <span className="font-medium">{application.candidateName}</span></p>
          <p className="text-sm text-gray-600">Position: <span className="font-medium">{application.jobId?.jobTitle || application.jobId?.title}</span></p>
          {existingRounds.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Scheduled rounds: <span className="font-medium">{existingRounds.join(', ')}</span>
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        <div className="space-y-4">
          {/* Round Selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Interview Round</label>
            <div className="grid grid-cols-4 gap-2">
              {ROUND_ORDER.map(round => {
                const isScheduled = existingRounds.includes(round);
                const isSelected = formData.round === round;
                return (
                  <button
                    key={round}
                    type="button"
                    disabled={isScheduled}
                    onClick={() => setFormData(prev => ({ ...prev, round }))}
                    className={`py-2 px-1 rounded-lg text-xs font-semibold border transition-all ${
                      isScheduled
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                        : isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {round}
                    {isScheduled && <span className="block text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Interviewer Name</label>
            <input
              type="text"
              value={formData.interviewer}
              onChange={e => setFormData(prev => ({ ...prev, interviewer: e.target.value }))}
              placeholder="e.g. John Smith"
              className="w-full p-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date & Time</label>
            <input
              type="datetime-local"
              value={formData.scheduledDate}
              onChange={e => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
              className="w-full p-2 border rounded-lg"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Duration</label>
            <select
              value={formData.duration}
              onChange={e => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className="w-full p-2 border rounded-lg"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Interview Type</label>
            <select
              value={formData.type}
              onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full p-2 border rounded-lg"
            >
              <option value="video">Video Call</option>
              <option value="phone">Phone Call</option>
              <option value="in-person">In Person</option>
            </select>
          </div>

          {formData.type === 'video' && (
            <div>
              <label className="block text-sm font-medium mb-2">Meeting Link</label>
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={generateZoomLink} disabled={generatingLink}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
                  <Video size={14} className="mr-1" />
                  {generatingLink ? '...' : 'Zoom'}
                </button>
                <button type="button" onClick={generateGoogleMeetLink} disabled={generatingLink}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg text-sm disabled:opacity-50">
                  <Video size={14} className="mr-1" />
                  {generatingLink ? '...' : 'GMeet'}
                </button>
              </div>
              <input type="url" value={formData.meetingLink}
                onChange={e => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                placeholder="Or paste meeting link..."
                className="w-full p-2 border rounded-lg text-sm" />
            </div>
          )}

          {formData.type === 'in-person' && (
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input type="text" value={formData.location}
                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Office address..."
                className="w-full p-2 border rounded-lg" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
            <textarea value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional information for the candidate..."
              className="w-full p-2 border rounded-lg h-16 text-sm" />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button onClick={onClose} disabled={loading}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={scheduleInterview} disabled={loading || isDuplicateRound}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Scheduling...' : `Schedule ${formData.round} Round`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleInterviewModal;
