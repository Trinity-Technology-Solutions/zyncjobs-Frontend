import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Users, RefreshCw, Eye, TrendingUp, MapPin, Building2, Sparkles } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import Header from '../components/Header';
import { API_ENDPOINTS } from '../config/env';

interface Props { onNavigate: (page: string) => void; user?: any; onLogout?: () => void; }
type FilterKey = 'all' | 'profile_viewed' | 'job_invite';

const FILTERS = [
  { key: 'all' as FilterKey,            label: 'All Actions',   icon: TrendingUp, active: 'bg-blue-600 text-white border-blue-600',     inactive: 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600' },
  { key: 'profile_viewed' as FilterKey, label: 'Profile Viewed', icon: Eye,       active: 'bg-purple-600 text-white border-purple-600',  inactive: 'bg-white text-gray-600 border-gray-200 hover:border-purple-400 hover:text-purple-600' },
  { key: 'job_invite' as FilterKey,     label: 'Job Invite',    icon: Sparkles,   active: 'bg-emerald-600 text-white border-emerald-600', inactive: 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-600' },
];

const STAT_CARDS = [
  { key: 'all',           label: 'Total Actions',  icon: TrendingUp, gradient: 'from-blue-500 to-blue-600',      text: 'text-blue-700' },
  { key: 'profile_viewed', label: 'Profile Viewed', icon: Eye,       gradient: 'from-purple-500 to-purple-600',  text: 'text-purple-700' },
  { key: 'job_invite',    label: 'Job Invites',    icon: Sparkles,   gradient: 'from-emerald-500 to-emerald-600', text: 'text-emerald-700' },
];

const ACTION_CONFIG: Record<string, { text: string; color: string; bg: string; border: string; dot: string; strip: string }> = {
  profile_viewed: { text: 'Profile Viewed', color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-200',  dot: 'bg-purple-500',  strip: 'bg-purple-500' },
  job_invite:     { text: '✨ Job Invite',  color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', strip: 'bg-emerald-500' },
  nvite_sent:     { text: '✨ Job Invite',  color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', strip: 'bg-emerald-500' },
  contact_viewed: { text: 'Profile Viewed', color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-200',  dot: 'bg-purple-500',  strip: 'bg-purple-500' },
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(diff / 86400000);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
}

function Avatar({ name, picture }: { name: string; picture?: string | null }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  const palettes = [
    'from-violet-500 to-purple-600', 'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',  'from-orange-500 to-amber-600',
    'from-rose-500 to-pink-600',     'from-indigo-500 to-blue-600',
  ];
  const fallbackGradient = palettes[initial.charCodeAt(0) % palettes.length];
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || '?')}&size=56&background=6366f1&color=ffffff&bold=true`;

  if (picture && picture.trim()) {
    const src = picture.startsWith('http') ? picture : `${(import.meta.env.VITE_API_URL || '/api').replace('/api', '')}${picture}`;
    return (
      <img
        src={src}
        alt={name}
        className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-md flex-shrink-0"
        onError={(e) => {
          const img = e.target as HTMLImageElement;
          img.onerror = null;
          img.src = fallbackAvatar;
        }}
      />
    );
  }
  return (
    <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl text-white bg-gradient-to-br shadow-md flex-shrink-0 ${fallbackGradient}`}>
      {initial}
    </div>
  );
}

const RecruiterActionsPage: React.FC<Props> = ({ onNavigate, user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [actions, setActions] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({ all: 0, profile_viewed: 0, job_invite: 0 });
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [liveIndicator, setLiveIndicator] = useState(false);

  const userEmail = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}').email || user?.email || ''; } catch { return user?.email || ''; } })();

  const fetchData = useCallback(async (filter: FilterKey = activeFilter) => {
    if (!userEmail) return;
    try {
      const apiFilter = filter === 'job_invite' ? 'nvite_sent' : filter;
      const res = await fetch(`${API_ENDPOINTS.BASE_URL}/analytics/recruiter-actions/${encodeURIComponent(userEmail)}?filter=${apiFilter}`);
      if (res.ok) {
        const data = await res.json();
        const raw = data.counts || {};
        // Normalize: map nvite_sent → job_invite, exclude contact_viewed
        const normalized = (data.actions || [])
          .filter((a: any) => a.action !== 'contact_viewed')
          .map((a: any) => ({ ...a, action: a.action === 'nvite_sent' ? 'job_invite' : a.action }));
        setActions(normalized);
        setCounts({
          all: Math.max(0, (raw.all || 0) - (raw.contact_viewed || 0)),
          profile_viewed: raw.profile_viewed || 0,
          job_invite: raw.nvite_sent || 0,
        });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [userEmail, activeFilter]);

  useEffect(() => { fetchData(activeFilter); }, [activeFilter]);

  useEffect(() => {
    if (!userEmail) return;
    const socketUrl = (import.meta.env.VITE_API_URL || '/api').replace('/api', '');
    const socket: Socket = io(socketUrl, { transports: ['websocket', 'polling'] });
    socket.on(`analytics_update:${userEmail}`, ({ eventType }: { eventType: string }) => {
      if (eventType === 'recruiter_action') {
        setLiveIndicator(true);
        fetchData(activeFilter);
        setTimeout(() => setLiveIndicator(false), 3000);
      }
    });
    return () => { socket.disconnect(); };
  }, [userEmail, activeFilter, fetchData]);

  const filtered = activeFilter === 'all' ? actions : actions.filter(a => a.action === activeFilter);

  return (
    <div className="min-h-screen bg-[#f3f2f0]">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <div className="max-w-5xl mx-auto px-4 py-6">

        <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm mb-5 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recruiter Actions</h1>
            <p className="text-sm text-gray-500 mt-0.5">See who's been engaging with your profile</p>
          </div>
          <div className="flex items-center gap-2">
            {liveIndicator && (
              <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live
              </span>
            )}
            <button onClick={() => fetchData(activeFilter)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-white transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stat Cards — 3 only */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {STAT_CARDS.map(({ key, label, icon: Icon, gradient, text }) => (
            <div key={key} onClick={() => setActiveFilter(key as FilterKey)}
              className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${activeFilter === key ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-100'}`}>
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-2 shadow-sm`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className={`text-2xl font-bold ${text}`}>{loading ? '—' : counts[key] ?? 0}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Main Panel */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Filter Tabs */}
          <div className="px-5 pt-4 pb-3 border-b border-gray-100">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(({ key, label, icon: Icon, active, inactive }) => (
                <button key={key} onClick={() => setActiveFilter(key)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${activeFilter === key ? active : inactive}`}>
                  <Icon className="w-3 h-3" />
                  {label}
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${activeFilter === key ? 'bg-white bg-opacity-30' : 'bg-gray-100 text-gray-500'}`}>
                    {counts[key] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Cards */}
          <div className="p-5">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="rounded-xl border border-gray-100 p-4 animate-pulse bg-gray-50 h-36" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">No recruiter actions yet</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto mb-5">Complete your profile to attract recruiter attention</p>
                <button onClick={() => onNavigate('dashboard')} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                  Improve Profile
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map((item, idx) => {
                  const r = item.recruiter || {};
                  const cfg = ACTION_CONFIG[item.action] || ACTION_CONFIG['profile_viewed'];
                  const skills: string[] = (r.skills || []).filter(Boolean);
                  const hasCompany = !!r.company;
                  const hasLocation = !!r.location;

                  return (
                    <div key={item.id || idx} className="relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition-all group">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.strip}`} />

                      <div className="pl-4 pr-4 pt-4 pb-3">
                        <div className="flex items-start gap-3 mb-3">
                          <Avatar name={r.name || 'R'} picture={r.profilePicture || r.photo || r.avatar || r.picture || null} />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm truncate group-hover:text-blue-700 transition-colors">
                              {r.name || 'Recruiter'}
                            </p>
                            {(r.title || hasCompany) && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {r.title && hasCompany ? `${r.title} at ${r.company}` : hasCompany ? r.company : r.title}
                              </p>
                            )}
                            {hasLocation && (
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                <span className="text-xs text-blue-600 font-medium">{r.location}</span>
                              </div>
                            )}
                            {hasCompany && (
                              <div className="flex items-center gap-1 mt-1">
                                <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <span className="text-xs text-gray-500 truncate">{r.company}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {skills.slice(0, 4).map((s, i) => (
                              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">{s}</span>
                            ))}
                            {skills.length > 4 && <span className="text-xs text-gray-400">+{skills.length - 4}</span>}
                          </div>
                        )}

                        <div className={`flex items-center justify-between pt-2.5 border-t ${cfg.border} border-opacity-50`}>
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.text}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">{timeAgo(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterActionsPage;
