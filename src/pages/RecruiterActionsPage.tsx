import React, { useState, useEffect } from 'react';
import { ArrowLeft, Briefcase, CheckCircle, XCircle, Clock, Eye, Star, Calendar, TrendingUp, Users } from 'lucide-react';
import Header from '../components/Header';
import { API_ENDPOINTS } from '../config/env';

interface Props { onNavigate: (page: string) => void; user?: any; onLogout?: () => void; }

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  applied:     { label: 'Applied',     color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',   icon: <Clock className="w-4 h-4 text-blue-600" /> },
  reviewed:    { label: 'Reviewed',    color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', icon: <Eye className="w-4 h-4 text-yellow-600" /> },
  shortlisted: { label: 'Shortlisted', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: <Star className="w-4 h-4 text-purple-600" /> },
  interview:   { label: 'Interview',   color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', icon: <Users className="w-4 h-4 text-indigo-600" /> },
  hired:       { label: 'Hired',       color: 'text-green-700',  bg: 'bg-green-50 border-green-200',  icon: <CheckCircle className="w-4 h-4 text-green-600" /> },
  rejected:    { label: 'Rejected',    color: 'text-red-700',    bg: 'bg-red-50 border-red-200',      icon: <XCircle className="w-4 h-4 text-red-600" /> },
  withdrawn:   { label: 'Withdrawn',   color: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200',    icon: <XCircle className="w-4 h-4 text-gray-400" /> },
};

const RecruiterActionsPage: React.FC<Props> = ({ onNavigate, user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [recruiterEvents, setRecruiterEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, reviewed: 0, shortlisted: 0, hired: 0 });
  const [activeTab, setActiveTab] = useState<'applications' | 'events'>('applications');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      const email = u.email; if (!email) return;

      const [appsRes, eventsRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.BASE_URL}/applications/candidate/${encodeURIComponent(email)}`),
        fetch(`${API_ENDPOINTS.BASE_URL}/analytics/recruiter-actions/${encodeURIComponent(email)}`)
      ]);

      if (appsRes.ok) {
        const data = await appsRes.json();
        const apps = Array.isArray(data) ? data : data.applications || [];
        setApplications(apps);
        setStats({
          total: apps.length,
          reviewed: apps.filter((a: any) => ['reviewed', 'shortlisted', 'interview', 'hired'].includes(a.status)).length,
          shortlisted: apps.filter((a: any) => ['shortlisted', 'interview'].includes(a.status)).length,
          hired: apps.filter((a: any) => a.status === 'hired').length,
        });
      }
      if (eventsRes.ok) {
        const ev = await eventsRes.json();
        setRecruiterEvents(Array.isArray(ev) ? ev : []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fmt = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatus = (status: string) => statusConfig[status] || statusConfig['applied'];

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <div className="max-w-4xl mx-auto px-4 py-8">

        <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Recruiter Actions</h1>
          <p className="text-gray-500 mt-1">Track recruiter activity on your applications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Applied', value: stats.total, icon: Briefcase, color: 'blue' },
            { label: 'Reviewed', value: stats.reviewed, icon: Eye, color: 'yellow' },
            { label: 'Shortlisted', value: stats.shortlisted, icon: Star, color: 'purple' },
            { label: 'Hired', value: stats.hired, icon: CheckCircle, color: 'green' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
              <div className={`w-9 h-9 bg-${color}-100 rounded-lg flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`w-5 h-5 text-${color}-600`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          {(['applications', 'events'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab === 'applications' ? 'Applications' : 'Recruiter Events'}
            </button>
          ))}
        </div>

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Your Applications</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{applications.length} total</span>
            </div>
            {applications.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {applications.map((app, idx) => {
                  const s = getStatus(app.status);
                  return (
                    <div key={app._id || app.id || idx} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                            {(app.company || app.companyName || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{app.jobTitle || app.title || 'Position'}</p>
                            <p className="text-sm text-gray-500">{app.company || app.companyName || 'Company'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">Applied {fmt(app.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold flex-shrink-0 ${s.bg} ${s.color}`}>
                          {s.icon}
                          {s.label}
                        </div>
                      </div>
                      {app.status !== 'applied' && (
                        <div className="mt-3 ml-13 pl-13">
                          <div className="flex items-center gap-2 ml-13">
                            <TrendingUp className="w-3.5 h-3.5 text-gray-400 ml-13" />
                            <span className="text-xs text-gray-500 ml-13">
                              {app.status === 'reviewed' && 'A recruiter has reviewed your application'}
                              {app.status === 'shortlisted' && '🎉 You have been shortlisted!'}
                              {app.status === 'interview' && '📅 Interview scheduled — check your email'}
                              {app.status === 'hired' && '🎊 Congratulations! You have been hired'}
                              {app.status === 'rejected' && 'Application was not selected this time'}
                              {app.status === 'withdrawn' && 'You withdrew this application'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">No applications yet</h3>
                <p className="text-sm text-gray-500 mb-4">Start applying to jobs to track recruiter actions</p>
                <button onClick={() => onNavigate('job-listings')} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                  Browse Jobs
                </button>
              </div>
            )}
          </div>
        )}

        {/* Recruiter Events Tab */}
        {activeTab === 'events' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recruiter Activity</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{recruiterEvents.length} events</span>
            </div>
            {recruiterEvents.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {recruiterEvents.map((ev, idx) => (
                  <div key={ev.id || idx} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {ev.metadata?.action ? `Recruiter action: ${ev.metadata.action}` : 'Recruiter viewed your profile'}
                        </p>
                        {ev.metadata?.company && <p className="text-xs text-gray-500 mt-0.5">by {ev.metadata.company}</p>}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                        <Calendar className="w-3 h-3" />
                        {fmt(ev.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">No recruiter events yet</h3>
                <p className="text-sm text-gray-500">Recruiter activity will appear here as they interact with your profile</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default RecruiterActionsPage;
