import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Video, CheckCircle, XCircle, Loader, Download, ExternalLink, Building, User, AlertCircle, Lock } from 'lucide-react';

interface InterviewData {
  _id: string;
  jobTitle: string;
  company: string;
  candidateName: string;
  candidateEmail: string;
  scheduledDate: string;
  duration: number;
  type: 'phone' | 'video' | 'in-person';
  meetingLink?: string;
  location?: string;
  notes?: string;
  interviewer?: string;
  round?: string;
  status: string;
  responded: boolean;
}

type Step = 'loading' | 'error' | 'invite' | 'accepted' | 'declined';

const API = import.meta.env.VITE_API_URL || '/api';

const InterviewInvitePage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('loading');
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError({ message: 'This invitation link is missing a token. Please ask the recruiter to resend the invitation.', code: 'invalid' });
      setStep('error');
      return;
    }

    const fetchInvite = async () => {
      try {
        const res = await fetch(`${API}/interviews/invite-info/${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          const code = data.code || 'error';
          const message = data.error || 'Failed to load interview details.';
          setError({ message, code });
          setStep('error');
          return;
        }

        if (data.data.responded) {
          setError({ message: 'You have already responded to this interview invitation.', code: 'responded' });
          setStep('error');
          return;
        }

        setInterview(data.data);
        setStep('invite');
      } catch {
        setError({ message: 'Network error. Please try again.' });
        setStep('error');
      }
    };

    fetchInvite();
  }, [token]);

  const handleActionClick = (action: 'accept' | 'reject') => {
    // Check if user is logged in by looking for token in localStorage
    const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    
    if (!accessToken || !userData) {
      // Not logged in - redirect to login with return URL
      const returnUrl = `/interviews?interview_token=${encodeURIComponent(token || '')}&interview_action=${action}`;
      navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // Logged in - proceed with accept/decline
    respond(action);
  };

  const respond = async (action: 'accept' | 'reject') => {
    if (!interview || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/interviews/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: data.error || `Failed to ${action} interview.`, type: 'error' } }));
        return;
      }
      setStep(action === 'accept' ? 'accepted' : 'declined');
      window.dispatchEvent(new CustomEvent('zync:alert', {
        detail: { message: action === 'accept' ? 'Interview accepted!' : 'Interview declined.', type: 'success' }
      }));
    } catch {
      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Network error. Please try again.', type: 'error' } }));
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    video:      { icon: <Video className="w-4 h-4" />,    label: 'Video Call',      color: 'text-blue-600' },
    phone:      { icon: <User className="w-4 h-4" />,     label: 'Phone Call',      color: 'text-purple-600' },
    'in-person':{ icon: <MapPin className="w-4 h-4" />,   label: 'In Person',       color: 'text-green-600' },
  };

  const generateICS = () => {
    if (!interview) return;
    const start = new Date(interview.scheduledDate);
    const end = new Date(start.getTime() + (interview.duration || 60) * 60000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const safe = (s: string) => (s || '').replace(/[\\;,]/g, m => `\\${m}`).replace(/\n/g, '\\n');
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ZyncJobs//Interview//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${interview._id}@zyncjobs.com`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${safe(`Interview - ${interview.jobTitle} at ${interview.company}`)}`,
      `DESCRIPTION:${safe(`Interview for ${interview.jobTitle} at ${interview.company}. ${interview.round ? `Round: ${interview.round}. ` : ''}${interview.type === 'video' && interview.meetingLink ? `Join: ${interview.meetingLink}` : ''}${interview.notes ? ` Notes: ${interview.notes}` : ''}`)}`,
      interview.location ? `LOCATION:${safe(interview.location)}` : '',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([lines], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-${interview.jobTitle.replace(/\s+/g, '-')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const googleCalendarUrl = () => {
    if (!interview) return '#';
    const start = new Date(interview.scheduledDate);
    const end = new Date(start.getTime() + (interview.duration || 60) * 60000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const title = encodeURIComponent(`Interview - ${interview.jobTitle} at ${interview.company}`);
    const details = encodeURIComponent(`Interview for ${interview.jobTitle} at ${interview.company}. ${interview.round ? `Round: ${interview.round}. ` : ''}${interview.type === 'video' && interview.meetingLink ? `Join: ${interview.meetingLink}` : ''}${interview.notes ? ` Notes: ${interview.notes}` : ''}`);
    const location = interview.location ? encodeURIComponent(interview.location) : '';
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}&location=${location}`;
  };

  const typeInfo = typeConfig[interview?.type] || typeConfig.video;

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Loading interview details…</h2>
          <p className="text-gray-500 mt-2 text-sm">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    const alreadyResponded = error?.code === 'responded';
    const expired = error?.code === 'expired';
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-100">
            {expired ? (
              <AlertCircle className="w-8 h-8 text-red-500" />
            ) : alreadyResponded ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {alreadyResponded ? 'Already Responded' : expired ? 'Link Expired' : 'Invalid Link'}
          </h2>
          <p className="text-gray-600 text-sm mb-6">{error?.message}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => onNavigate('job-listings')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-colors"
            >
              Browse Jobs
            </button>
            <button
              onClick={() => onNavigate('home')}
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'accepted' || step === 'declined') {
    const isAccepted = step === 'accepted';
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: isAccepted ? '#D1FAE5' : '#FEF2F2' }}>
            {isAccepted ? (
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isAccepted ? 'Interview Accepted! 🎉' : 'Interview Declined'}
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            {isAccepted
              ? `You have accepted the interview for <strong>${interview?.jobTitle}</strong> at <strong>${interview?.company}</strong>.`
              : `You have declined the interview for <strong>${interview?.jobTitle}</strong> at <strong>${interview?.company}</strong>.`}
          </p>

          {isAccepted && interview && (
            <>
              {interview.meetingLink && (
                <a
                  href={interview.meetingLink.startsWith('http') ? interview.meetingLink : `https://${interview.meetingLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors mb-3"
                >
                  <Video className="w-4 h-4" /> Join Video Interview
                </a>
              )}

              <div className="flex flex-col gap-2 mb-4">
                <button
                  onClick={generateICS}
                  className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" /> Add to Calendar (.ics)
                </button>
                <a
                  href={googleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Add to Google Calendar
                </a>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 mb-4 text-left">
                <p className="text-xs font-semibold text-indigo-700 mb-1">🔑 Track in your dashboard</p>
                <p className="text-xs text-indigo-600">
                  Login to ZyncJobs to manage this interview and see all your upcoming interviews.
                </p>
              </div>
            </>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => onNavigate(isAccepted ? 'interviews' : 'job-listings')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-colors"
            >
              {isAccepted ? 'Go to My Interviews' : 'Browse More Jobs'}
            </button>
            <button
              onClick={() => onNavigate('home')}
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!interview) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📅</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Interview Invitation</h1>
          <p className="text-gray-500 text-sm mt-1">Review the details and confirm your availability</p>
        </div>

        {/* Company / Job */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl border border-indigo-200 bg-white flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-indigo-600">
                {interview.company.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">{interview.jobTitle}</h2>
              <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                <Building className="w-3.5 h-3.5" /> {interview.company}
              </p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Date</p>
              <p className="font-medium text-gray-900">{formatDate(interview.scheduledDate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Time</p>
              <p className="font-medium text-gray-900">
                {formatTime(interview.scheduledDate)} · {interview.duration} min
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
              {typeInfo.icon}
            </div>
            <div>
              <p className="text-xs text-gray-500">Type</p>
              <p className={`font-medium ${typeInfo.color}`}>{typeInfo.label}</p>
            </div>
          </div>

          {interview.round && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                <span className="text-sm font-bold">{interview.round[0]}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Round</p>
                <p className="font-medium text-gray-900">{interview.round} Round</p>
              </div>
            </div>
          )}

          {interview.interviewer && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Interviewer</p>
                <p className="font-medium text-gray-900">{interview.interviewer}</p>
              </div>
            </div>
          )}

          {interview.location && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="font-medium text-gray-900">{interview.location}</p>
              </div>
            </div>
          )}

          {interview.notes && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-semibold text-amber-800 mb-1">Notes from interviewer</p>
              <p className="text-sm text-amber-900">{interview.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-100 pt-6">
          <p className="text-center text-sm text-gray-500 mb-4">
            Please confirm your availability for this interview
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleActionClick('accept')}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-xl font-semibold text-base transition-colors shadow-sm"
            >
              {submitting ? (
                <>
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Accept Interview
                </>
              )}
            </button>

            <button
              onClick={() => handleActionClick('reject')}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 border-2 border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3.5 rounded-xl font-semibold text-base transition-colors"
            >
              <XCircle className="w-5 h-5" />
              Decline Interview
            </button>

            <button
              onClick={generateICS}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-xl font-medium text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Add to Calendar (.ics)
            </button>

            <a
              href={googleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-xl font-medium text-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Add to Google Calendar
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Sent via ZyncJobs · Questions? Contact the recruiter directly.
        </p>
      </div>
    </div>
  );
};

export default InterviewInvitePage;