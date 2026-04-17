import React, { useState, useEffect } from 'react';
import { Video, X, Calendar, Clock, User, FileText, MapPin } from 'lucide-react';

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
  const [zoomGenerated, setZoomGenerated] = useState(false);
  const [meetingPassword, setMeetingPassword] = useState('');
  const [error, setError] = useState('');
  const [tempDate, setTempDate] = useState('');
  const [tempTime, setTempTime] = useState('');

  useEffect(() => {
    const nextRound = ROUND_ORDER.find(r => !existingRounds.includes(r)) || 'HR';
    setFormData(prev => ({ ...prev, round: nextRound }));
  }, [existingRounds]);

  const zyncAlert = (msg: string) =>
    window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: msg } }));

  const isDuplicateRound = existingRounds.includes(formData.round);

  const generateZoomLink = async () => {
    if (!formData.scheduledDate) { zyncAlert('Please select a date and time first'); return; }
    setGeneratingLink(true);
    setZoomGenerated(false);
    setMeetingPassword('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/meetings/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'zoom',
          topic: `${formData.round} Interview - ${application.jobId?.jobTitle || application.jobId?.title || 'Position'}`,
          start_time: formData.scheduledDate,
          duration: formData.duration
        })
      });
      const result = await res.json();
      if (result.success && result.meeting?.join_url) {
        setFormData(prev => ({ ...prev, meetingLink: result.meeting.join_url }));
        setMeetingPassword(result.meeting.password || '');
        setZoomGenerated(true);
      } else {
        zyncAlert('Failed to generate Zoom link. Please try again.');
      }
    } catch {
      zyncAlert('Error generating Zoom link. Please check your connection.');
    } finally {
      setGeneratingLink(false);
    }
  };

  const scheduleInterview = async () => {
    if (!formData.scheduledDate) { setError('Please select a date and time'); return; }
    if (isDuplicateRound) { setError(`${formData.round} round is already scheduled`); return; }

    setLoading(true);
    setError('');
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const payload = {
        applicationId: application._id,
        candidateEmail: application.candidateEmail,
        candidateName: application.candidateName,
        employerId: user.id || user._id || application.employerId || user.email,
        employerEmail: user.email || application.employerEmail || '',
        jobId: application.jobId?._id || application.jobId,
        round: formData.round,
        interviewer: formData.interviewer,
        scheduledDate: formData.scheduledDate,
        duration: formData.duration,
        type: formData.type,
        meetingLink: formData.meetingLink,
        location: formData.location,
        notes: formData.notes
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/interviews/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (response.ok && result.success) {
        zyncAlert(`${formData.round} round scheduled! Email sent to candidate.`);
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

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Schedule Interview</h2>
            <p className="text-sm text-gray-500 mt-0.5">{application.candidateName} · {application.jobId?.jobTitle || application.jobId?.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
          )}

          {/* Round Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Interview Round</label>
            <div className="grid grid-cols-4 gap-2">
              {ROUND_ORDER.map(round => {
                const isScheduled = existingRounds.includes(round);
                const isSelected = formData.round === round;
                return (
                  <button key={round} type="button" disabled={isScheduled}
                    onClick={() => setFormData(prev => ({ ...prev, round }))}
                    className={`py-2.5 px-1 rounded-xl text-xs font-semibold border-2 transition-all ${
                      isScheduled
                        ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through'
                        : isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                    }`}>
                    {round}
                    {isScheduled && <span className="block text-xs mt-0.5">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interviewer */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <User size={14} className="inline mr-1" />Interviewer Name
            </label>
            <input type="text" value={formData.interviewer}
              onChange={e => setFormData(prev => ({ ...prev, interviewer: e.target.value }))}
              placeholder="e.g. John Smith"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Calendar size={14} className="inline mr-1" />Date & Time
            </label>
            <div className="flex gap-2">
              <input type="date" value={tempDate} onChange={e => setTempDate(e.target.value)}
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={new Date().toISOString().slice(0, 10)} />
              <input type="time" value={tempTime} onChange={e => setTempTime(e.target.value)}
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button"
                onClick={() => { if (tempDate && tempTime) setFormData(prev => ({ ...prev, scheduledDate: `${tempDate}T${tempTime}` })); }}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                Set
              </button>
            </div>
            {formData.scheduledDate && (
              <p className="text-xs text-green-600 mt-1.5 font-medium">
                ✓ {new Date(formData.scheduledDate).toLocaleString()}
              </p>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Clock size={14} className="inline mr-1" />Duration
            </label>
            <select value={formData.duration}
              onChange={e => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          {/* Interview Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Interview Type</label>
            <select value={formData.type}
              onChange={e => setFormData(prev => ({ ...prev, type: e.target.value, meetingLink: '' }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="video">Video Call (Zoom)</option>
              <option value="phone">Phone Call</option>
              <option value="in-person">In Person</option>
            </select>
          </div>

          {/* Zoom Meeting Link */}
          {formData.type === 'video' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Video size={14} className="inline mr-1" />Zoom Meeting Link
              </label>
              <button type="button" onClick={generateZoomLink} disabled={generatingLink}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-semibold transition-colors mb-2">
                {generatingLink ? 'Generating...' : 'Generate Zoom Meeting Link'}
              </button>

              {zoomGenerated && (
                <p className="text-xs text-green-600 font-medium mb-2">
                  ✓ Zoom meeting created{meetingPassword && <span className="text-gray-500"> · Password: <span className="font-mono">{meetingPassword}</span></span>}
                </p>
              )}

              <input type="url" value={formData.meetingLink}
                onChange={e => { setFormData(prev => ({ ...prev, meetingLink: e.target.value })); setZoomGenerated(false); setMeetingPassword(''); }}
                placeholder="Or paste Zoom link manually..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}

          {/* Location for in-person */}
          {formData.type === 'in-person' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin size={14} className="inline mr-1" />Location
              </label>
              <input type="text" value={formData.location}
                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Office address..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FileText size={14} className="inline mr-1" />Notes (Optional)
            </label>
            <textarea value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional information for the candidate..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} disabled={loading}
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
            Cancel
          </button>
          <button onClick={scheduleInterview} disabled={loading || isDuplicateRound}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
            {loading ? 'Scheduling...' : `Schedule ${formData.round} Round`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleInterviewModal;
