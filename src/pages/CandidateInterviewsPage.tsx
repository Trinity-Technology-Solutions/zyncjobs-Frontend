import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Video, MapPin, Building, Phone, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { API_ENDPOINTS } from '../config/env';
import { apiFetch } from '../api/apiFetch';
import BackButton from '../components/BackButton';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AutocompleteCombobox from '../components/AutocompleteCombobox';
import { getSafeCompanyLogo } from '../utils/logoUtils';
import { formatInterviewDate, formatInterviewTime, getInterviewJoinUrl, parseDateValue } from '../utils/interviewScheduleUtils';

interface Interview {
  _id: string;
  jobId: { _id: string; jobTitle: string; company: string };
  candidateEmail: string;
  candidateName: string;
  round?: string;
  jobTitle?: string;
  interviewDate: string;
  interviewTime: string;
  interviewType: 'video' | 'in-person' | 'phone';
  meetingLink?: string;
  location?: string;
  interviewerName?: string;
  interviewerEmail?: string;
  status: 'scheduled' | 'accepted' | 'rejected' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  createdAt: string;
}

interface CandidateInterviewsPageProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

const getCountdown = (dateStr: string, timeStr: string): string => {
  try {
    if (!dateStr || !timeStr) return '';
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!timeMatch) return '';
    const target = parseDateValue(dateStr);
    if (!target) return '';
    target.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), 0, 0);
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return 'Started';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (d > 0) return `in ${d}d ${h}h`;
    if (h > 0) return `in ${h}h ${m}m`;
    if (m <= 5) return `in ${m}m 🔥`;
    return `in ${m}m`;
  } catch { return ''; }
};

const CandidateInterviewsPage: React.FC<CandidateInterviewsPageProps> = ({ onNavigate, user, onLogout }) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled' | 'accepted' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [, setTick] = useState(0);
  const [companyLogos, setCompanyLogos] = useState<Record<string, string>>({});
  const [responding, setResponding] = useState<string | null>(null);

  // Tick every 30s to refresh countdowns
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const fetchInterviews = useCallback(async (refresh = false) => {
    if (!user?.email) { setLoading(false); return; }
    if (refresh) setRefreshing(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.BASE_URL}/interviews/candidate/${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        setInterviews(data);
        fetchCompanyLogos(data);
      } else {
        if (refresh) window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Failed to refresh interviews. Please try again.' } }));
      }
    } catch {
      if (refresh) window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Network error while refreshing interviews.' } }));
    } finally {
      setLoading(false);
      if (refresh) setRefreshing(false);
    }
  }, [user]);

  const fetchCompanyLogos = async (interviewList: Interview[]) => {
    try {
      const res = await fetch(API_ENDPOINTS.COMPANIES);
      if (!res.ok) return;
      const data = await res.json();
      const companies: any[] = Array.isArray(data) ? data : (data.companies || data.data || []);
      const map: Record<string, string> = {};
      companies.forEach((c: any) => {
        const name = (c.name || c.companyName || '').toLowerCase();
        const logo = c.logo || c.logoUrl || c.imageUrl || c.image || '';
        if (name && logo) map[name] = logo;
      });
      interviewList.forEach((i: Interview) => {
        const name = (i.jobId?.company || '').toLowerCase();
        const logo = (i as any).companyLogo || '';
        if (name && logo && !map[name]) map[name] = logo;
      });
      setCompanyLogos(map);
    } catch { /* silent */ }
  };

  const respondToInterview = async (interviewId: string, action: 'accept' | 'reject') => {
    if (!user?.email) return;
    setResponding(interviewId);
    try {
      const res = await fetch(`${API_ENDPOINTS.BASE_URL}/interviews/${interviewId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, candidateEmail: user.email })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: data.error || `Failed to ${action} interview.`, type: 'error' } }));
        return;
      }
      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: action === 'accept' ? 'Interview accepted!' : 'Interview declined.', type: 'success' } }));
      fetchInterviews(true);
    } catch {
      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Network error. Please try again.', type: 'error' } }));
    } finally {
      setResponding(null);
    }
  };

  // Handle interview token from email link after login
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const interviewToken = searchParams.get('interview_token');
    const interviewAction = searchParams.get('interview_action');
    if (interviewToken && interviewAction && ['accept', 'reject'].includes(interviewAction)) {
      const handleAutoRespond = async () => {
        setResponding('auto');
        try {
          const res = await fetch(`${API_ENDPOINTS.BASE_URL}/interviews/respond`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: interviewToken, action: interviewAction })
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: data.error || `Failed to ${interviewAction} interview.`, type: 'error' } }));
          } else {
            window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: interviewAction === 'accept' ? 'Interview accepted!' : 'Interview declined.', type: 'success' } }));
          }
          fetchInterviews(true);
        } catch {
          window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Network error. Please try again.', type: 'error' } }));
        } finally {
          setResponding(null);
        }
      };
      handleAutoRespond();
      // Clean up URL params after handling
      const url = new URL(window.location.href);
      url.searchParams.delete('interview_token');
      url.searchParams.delete('interview_action');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, fetchInterviews]);

  useEffect(() => { fetchInterviews(); }, [fetchInterviews]);

  const statusConfig: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode; pulse?: boolean }> = {
    scheduled:   { label: 'Scheduled',   bg: 'bg-blue-50',   text: 'text-blue-700',  icon: <Clock className="w-3 h-3" />, pulse: true },
    accepted:    { label: 'Accepted',    bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <CheckCircle className="w-3 h-3" /> },
    rejected:    { label: 'Declined',    bg: 'bg-red-50',    text: 'text-red-700',   icon: <XCircle className="w-3 h-3" /> },
    completed:   { label: 'Completed',   bg: 'bg-green-50',  text: 'text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
    cancelled:   { label: 'Cancelled',   bg: 'bg-red-50',    text: 'text-red-700',   icon: <XCircle className="w-3 h-3" /> },
    rescheduled: { label: 'Rescheduled', bg: 'bg-yellow-50', text: 'text-yellow-700',icon: <AlertCircle className="w-3 h-3" /> },
  };

  const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    video:      { icon: <Video className="w-4 h-4" />,    label: 'Video',      color: 'text-blue-600' },
    'in-person':{ icon: <MapPin className="w-4 h-4" />,   label: 'In-Person',  color: 'text-green-600' },
    phone:      { icon: <Phone className="w-4 h-4" />,    label: 'Phone',      color: 'text-purple-600' },
  };

  const filtered = interviews.filter(i => {
    const matchFilter =
      filter === 'all' ? true :
      filter === 'upcoming' ? (i.status === 'scheduled' || i.status === 'rescheduled') :
      i.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (i.jobId?.jobTitle || i.jobTitle || '').toLowerCase().includes(q) ||
      (i.jobId?.company || '').toLowerCase().includes(q) ||
      (i.round || '').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const upcomingCount  = interviews.filter(i => i.status === 'scheduled' || i.status === 'rescheduled').length;
  const acceptedCount  = interviews.filter(i => i.status === 'accepted').length;
  const rejectedCount  = interviews.filter(i => i.status === 'rejected').length;
  const completedCount = interviews.filter(i => i.status === 'completed').length;
  const cancelledCount = interviews.filter(i => i.status === 'cancelled').length;

  const statCards = [
    { label: 'Total',     value: interviews.length, color: 'text-gray-900',  bg: 'bg-white',        border: 'border-gray-200' },
    { label: 'Upcoming',  value: upcomingCount,      color: 'text-blue-600',  bg: 'bg-blue-50',      border: 'border-blue-200' },
    { label: 'Accepted',  value: acceptedCount,      color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'Declined',  value: rejectedCount,      color: 'text-red-600',   bg: 'bg-red-50',       border: 'border-red-200' },
    { label: 'Completed', value: completedCount,     color: 'text-green-600', bg: 'bg-green-50',     border: 'border-green-200' },
    { label: 'Cancelled', value: cancelledCount,     color: 'text-red-600',   bg: 'bg-red-50',       border: 'border-red-200' },
  ];

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading interviews...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Header onNavigate={onNavigate} user={user ? { name: user.name, type: user.type } : null} onLogout={onLogout} />

      <div className="flex-1">
        {/* Page Header */}
        <div className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BackButton onClick={() => onNavigate('dashboard')} text="Back" className="text-sm text-gray-500 hover:text-gray-700 transition-colors" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Interviews</h1>
                <p className="text-xs text-gray-400 mt-0.5">{interviews.length} total · {upcomingCount} upcoming</p>
              </div>
            </div>
            <button
              onClick={() => fetchInterviews(true)}
              disabled={refreshing}
              className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">

          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {statCards.map(s => (
              <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-md duration-200`}>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search + Filter Bar */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <AutocompleteCombobox
                value={search}
                onChange={setSearch}
                options={[]}
                allowCustom
                placeholder="Search by job title, company, round..."
              />
            </div>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {(['all', 'upcoming', 'accepted', 'rejected', 'completed', 'cancelled'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                    filter === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Interview Cards */}
          {filtered.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No {filter !== 'all' ? filter : ''} interviews found</p>
              <p className="text-gray-400 text-sm mt-1">
                {search ? 'Try a different search term' : 'Interviews scheduled by employers will appear here'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(interview => {
                const sc = statusConfig[interview.status] || statusConfig.scheduled;
                const tc = typeConfig[interview.interviewType] || typeConfig.video;
                const isUpcoming = interview.status === 'scheduled' || interview.status === 'rescheduled';
                const countdown = isUpcoming ? getCountdown(interview.interviewDate || '', interview.interviewTime || '') : '';
                const isHot = countdown.includes('🔥');
                const joinUrl = getInterviewJoinUrl(interview);
                const companyName = interview.jobId?.company || '';
                const logoSrc = companyLogos[companyName.toLowerCase()] || getSafeCompanyLogo({ company: companyName });
                const companyInitial = companyName.charAt(0).toUpperCase() || 'C';

                return (
                  <div
                    key={interview._id}
                    className={`bg-white border rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                      isHot ? 'border-orange-300 shadow-orange-100' : 'border-gray-200'
                    }`}
                  >
                    {/* Top strip for ongoing */}
                    {isHot && (
                      <div className="h-1 bg-gradient-to-r from-orange-400 to-red-500" />
                    )}

                    <div className="p-5">
                      {/* Row 1: Logo + Title + Status */}
                      <div className="flex items-start gap-4">
                        {/* Company Logo */}
                        <div className="w-12 h-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
                          <img
                            src={logoSrc}
                            alt={companyName}
                            className="w-10 h-10 object-contain"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              const initials = companyName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || companyInitial;
                              img.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="#2563EB" rx="8"/><text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">${initials}</text></svg>`)}`;
                            }}
                          />
                        </div>

                        {/* Title + Company + Date */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <h3 className="text-[18px] font-semibold text-gray-900 leading-tight">
                                {interview.jobId?.jobTitle || interview.jobTitle || 'Job Title'}
                              </h3>
                              <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                                <Building className="w-3.5 h-3.5" />
                                {interview.jobId?.company || 'Company'}
                              </p>
                            </div>

                            {/* Status Badge */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {countdown && (
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                  isHot ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'
                                }`}>
                                  {countdown}
                                </span>
                              )}
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text} ${sc.pulse ? 'animate-pulse' : ''}`}>
                                {sc.icon}
                                {interview.status === 'scheduled' && interview.round
                                  ? `${interview.round} Round`
                                  : sc.label}
                              </span>
                            </div>
                          </div>

                          {/* Date + Time row */}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              {formatInterviewDate(interview)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              {formatInterviewTime(interview)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-100 my-3" />

                      {/* Row 2: Type + Round + Interviewer */}
                      <div className="flex items-center gap-3 flex-wrap text-sm">
                        <span className={`flex items-center gap-1.5 font-medium ${tc.color}`}>
                          {tc.icon} {tc.label} Interview
                        </span>
                        {interview.round && (
                          <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                            {interview.round} Round
                          </span>
                        )}
                        {interview.interviewerName && (
                          <span className="text-gray-400 text-xs">
                            with <span className="text-gray-600 font-medium">{interview.interviewerName}</span>
                          </span>
                        )}
                        {interview.location && interview.interviewType === 'in-person' && (
                          <span className="flex items-center gap-1 text-gray-400 text-xs">
                            <MapPin className="w-3 h-3" /> {interview.location}
                          </span>
                        )}
                      </div>

                      {/* Notes */}
                      {interview.notes && (
                        <div className="mt-3 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600 border-l-2 border-gray-300">
                          {interview.notes}
                        </div>
                      )}

                      {/* Divider */}
                      <div className="border-t border-gray-100 mt-4 pt-3 flex items-center justify-between gap-3">
                        <span className="text-xs text-gray-400">
                          Scheduled on {interview.createdAt ? new Date(interview.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </span>

                        {/* CTA Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onNavigate(`job-detail/${interview.jobId?._id}`)}
                            className="border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                          >
                            View Job
                          </button>

                          {isUpcoming && (
                            <>
                              <button
                                onClick={() => respondToInterview(interview._id, 'accept')}
                                disabled={responding === interview._id}
                                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm px-3 py-2 rounded-lg transition-colors font-medium shadow-sm"
                              >
                                {responding === interview._id ? (
                                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                                    <path d="M12 2a10 10 0 0 1 10 10" />
                                  </svg>
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                Accept
                              </button>
                              <button
                                onClick={() => respondToInterview(interview._id, 'reject')}
                                disabled={responding === interview._id}
                                className="flex items-center gap-1.5 border-2 border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded-lg font-medium transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                                Decline
                              </button>
                            </>
                          )}

                          {(isUpcoming || interview.status === 'accepted') && joinUrl && (
                            <a
                              href={`${API_ENDPOINTS.BASE_URL}/meetings/interview/${interview._id}/join`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-all font-semibold shadow-sm hover:shadow-md active:scale-95"
                            >
                              <Video className="w-4 h-4" /> Join Interview
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer onNavigate={onNavigate} user={user ? { name: user.name, type: user.type } : null} />
    </div>
  );
};

export default CandidateInterviewsPage;
