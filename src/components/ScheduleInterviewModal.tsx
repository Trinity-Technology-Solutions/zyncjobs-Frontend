import React, { useState, useEffect } from 'react';
import { Video, X, Calendar, Clock, User, FileText, MapPin, ExternalLink } from 'lucide-react';
import AutocompleteCombobox from './AutocompleteCombobox';

interface ScheduleInterviewModalProps {
  application: any;
  existingRounds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

const ROUND_ORDER = ['HR', 'Technical', 'Managerial', 'Final'];

const DURATION_OPTIONS = [
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
];

const TYPE_OPTIONS = [
  { value: 'video', label: 'Video Call (Zoom)' },
  { value: 'googlemeet', label: 'Google Meet' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'in-person', label: 'In Person' },
];

const inputClass =
  'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const selectClass =
  'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-8';

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
  const [meetLoading, setMeetLoading] = useState(false);
  const [meetGenerated, setMeetGenerated] = useState(false);
  const [meetFallback, setMeetFallback] = useState(false);
  const [meetPlatform, setMeetPlatform] = useState<'zoom' | 'googlemeet'>('zoom');
  const [error, setError] = useState('');
  const [minDateTime, setMinDateTime] = useState('');

  useEffect(() => {
    const nextRound = ROUND_ORDER.find(r => !existingRounds.includes(r)) || 'HR';
    setFormData(prev => ({ ...prev, round: nextRound }));
  }, [existingRounds]);

  // datetime-local min in LOCAL time (toISOString().slice(0,16) is UTC and can be off by a day)
  useEffect(() => {
    setMinDateTime(toLocalDateTimeInput(new Date()));
  }, []);

  const zyncAlert = (msg: string) =>
    window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: msg } }));

  const isDuplicateRound = existingRounds.includes(formData.round);

  const getEmployerIdentity = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const employerId = user.employerOwnerId || user.id || user._id || user.employerId || application.employerId || '';
    const employerEmail = user.ownerEmail || user.employerEmail || user.email || application.employerEmail || '';
    return { user, employerId, employerEmail };
  };

  // Keep the wall-clock time the employer picked (datetime-local value is already local).
  // Converting to UTC ISO here caused the stored interview time to shift after creation.
  const scheduledStart = () => formData.scheduledDate || '';

  const generateMeetingLink = async (platform: 'zoom' | 'googlemeet') => {
    if (!formData.scheduledDate) {
      setError(`Please set a date & time first before generating a ${platform === 'zoom' ? 'Zoom' : 'Google Meet'} link`);
      return;
    }
    setMeetLoading(true);
    setMeetPlatform(platform);
    setError('');
    setMeetFallback(false);
    try {
      const { employerId, employerEmail } = getEmployerIdentity();

      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/meetings/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          topic: `Interview - ${application.candidateName} (${formData.round} Round)`,
          start_time: scheduledStart(),
          duration: formData.duration,
          description: `${formData.round} round interview via ZyncJobs`,
          employerId,
          employerEmail,
          candidateEmail: application.candidateEmail,
          candidateName: application.candidateName,
          require_admission: true
        })
      });

      const result = await res.json();
      const joinUrl = result.meeting?.join_url || result.meeting?.joinUrl || result.meeting?.meetLink || result.meeting?.hangoutLink;
      if (result.success && joinUrl) {
        if (isMeetingLinkForPlatform(platform, joinUrl)) {
          setFormData(prev => ({ ...prev, meetingLink: joinUrl }));
          setMeetGenerated(true);
          setMeetFallback(!!result.fallback);
        } else {
          // Backend returned a fallback link from another provider (e.g. Jitsi)
          // because the Zoom/Google account is not connected. Do NOT store it as
          // a Google Meet / Zoom link — the interview must use the real provider.
          setError(platform === 'googlemeet'
            ? 'A real Google Meet link could not be created because no Google account is connected. The server offered a generic video link instead. Please connect your Google account, or paste a valid meet.google.com link manually.'
            : 'A real Zoom link could not be created because the Zoom account is not configured on the server. Please configure Zoom credentials, or paste a valid zoom.us link manually.');
        }
      } else {
        setError(`Failed to create ${platform === 'zoom' ? 'Zoom' : 'Google Meet'} meeting: ` + (result.error || result.message || 'Unknown error'));
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setMeetLoading(false);
    }
  };

  const scheduleInterview = async () => {
    if (!formData.scheduledDate) { setError('Please select a date and time'); return; }
    if (isDuplicateRound) { setError(`${formData.round} round is already scheduled`); return; }

    setLoading(true);
    setError('');
    try {
      const { employerId, employerEmail } = getEmployerIdentity();
      const payload = {
        applicationId: application._id,
        candidateEmail: application.candidateEmail,
        candidateName: application.candidateName,
        employerId,
        employerEmail,
        jobId: application.jobId?._id || application.jobId,
        round: formData.round,
        interviewer: formData.interviewer,
        scheduledDate: scheduledStart(),
        duration: formData.duration,
        // backend enum expects 'video' for video calls; map 'googlemeet' to 'video'
        type: formData.type === 'googlemeet' ? 'video' : formData.type,
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
              className={inputClass} />
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Calendar size={14} className="inline mr-1" />Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledDate}
              onChange={e => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
              min={minDateTime}
              className={`${inputClass} [color-scheme:light]`}
            />
            {formData.scheduledDate && (
              <p className="text-xs text-green-600 mt-1.5 font-medium">
                ✓ {formatLocalDateTime(formData.scheduledDate)}
              </p>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Clock size={14} className="inline mr-1" />Duration
            </label>
            <AutocompleteCombobox
              label="Duration"
              value={String(formData.duration)}
              onChange={(val) => setFormData(prev => ({ ...prev, duration: parseInt(val) }))}
              options={[
                { value: '30', label: '30 minutes' },
                { value: '60', label: '1 hour' },
                { value: '90', label: '1.5 hours' },
                { value: '120', label: '2 hours' },
              ]}
              placeholder="Select duration"
            />
          </div>

          {/* Interview Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Interview Type</label>
            <AutocompleteCombobox
              label="Interview Type"
              value={formData.type}
              onChange={(val) => setFormData(prev => ({ ...prev, type: val, meetingLink: '' }))}
              options={[
                { value: 'video', label: 'Video Call (Zoom)' },
                { value: 'googlemeet', label: 'Google Meet' },
                { value: 'phone', label: 'Phone Call' },
                { value: 'in-person', label: 'In Person' },
              ]}
              placeholder="Select interview type"
            />
          </div>

          {/* Meeting Link */}
          {(formData.type === 'video' || formData.type === 'googlemeet') && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Video size={14} className="inline mr-1" />Meeting Link
              </label>
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => generateMeetingLink('zoom')} disabled={meetLoading}
                  className="flex-1 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                  {meetLoading && meetPlatform === 'zoom' ? (
                    <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>Creating...</>
                  ) : (
                    <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 14.432c-.054.288-.288.432-.576.432H7.008c-.288 0-.522-.144-.576-.432L6.24 9.568c-.054-.288.09-.568.378-.568h10.764c.288 0 .432.28.378.568l-.192 4.864z"/></svg>Zoom</>
                  )}
                </button>
                <button type="button" onClick={() => generateMeetingLink('googlemeet')} disabled={meetLoading}
                  className="flex-1 px-3 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                  {meetLoading && meetPlatform === 'googlemeet' ? (
                    <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>Creating...</>
                  ) : (
                    <><svg className="w-4 h-4" viewBox="0 0 48 48"><path d="M44 24c0-1.3-.1-2.5-.3-3.7H24v7h11.3c-.5 2.6-2 4.8-4.2 6.3v5.2h6.8C41.5 35.3 44 30 44 24z" fill="#4285F4"/><path d="M24 44c5.6 0 10.3-1.9 13.8-5.1l-6.8-5.2c-1.9 1.3-4.3 2-7 2-5.4 0-9.9-3.6-11.5-8.5H5.4v5.4C8.9 39.9 16 44 24 44z" fill="#34A853"/><path d="M12.5 27.2c-.4-1.3-.7-2.7-.7-4.2s.2-2.9.7-4.2v-5.4H5.4C3.9 16.6 3 20.2 3 24s.9 7.4 2.4 10.6l7.1-5.4z" fill="#FBBC05"/><path d="M24 10.3c3 0 5.7 1 7.8 3l5.8-5.8C34.3 4.2 29.5 2 24 2 16 2 8.9 6.1 5.4 13.4l7.1 5.4c1.6-4.9 6.1-8.5 11.5-8.5z" fill="#EA4335"/></svg>Google Meet</>
                  )}
                </button>
              </div>

              {meetGenerated && !meetFallback && (
                <p className="text-xs text-green-600 font-medium mb-2">✓ {meetPlatform === 'zoom' ? 'Zoom' : 'Google Meet'} link created successfully</p>
              )}
              {meetGenerated && meetFallback && (
                <p className="text-xs text-amber-700 font-medium mb-2">⚠ The video provider returned a fallback link — please verify it opens the right meeting, or paste a link manually.</p>
              )}

              <input type="url" value={formData.meetingLink}
                onChange={e => { setFormData(prev => ({ ...prev, meetingLink: e.target.value })); setMeetGenerated(false); }}
                placeholder="Or paste any meeting link here..."
                className={inputClass} />
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
                className={inputClass} />
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
              className={`${inputClass} h-20 resize-none`} />
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