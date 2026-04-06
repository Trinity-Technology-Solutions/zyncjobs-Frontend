import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Search, TrendingUp, Eye, RefreshCw, Zap, Clock, User } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import Header from '../components/Header';
import { API_ENDPOINTS } from '../config/env';

interface Props { onNavigate: (page: string) => void; user?: any; onLogout?: () => void; }

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(diff / 86400000);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const SearchAppearancesPage: React.FC<Props> = ({ onNavigate, user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [thisWeek, setThisWeek] = useState(0);
  const [profileViews, setProfileViews] = useState(0);
  const [topKeywords, setTopKeywords] = useState<{ kw: string; count: number }[]>([]);
  const [appearances, setAppearances] = useState<any[]>([]);
  const [liveIndicator, setLiveIndicator] = useState(false);

  const userEmail = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}').email || user?.email || ''; } catch { return user?.email || ''; } })();

  const fetchData = useCallback(async () => {
    if (!userEmail) return;
    try {
      const [summaryRes, detailRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.BASE_URL}/analytics/profile/${encodeURIComponent(userEmail)}?userType=candidate`),
        fetch(`${API_ENDPOINTS.BASE_URL}/analytics/search-appearances/${encodeURIComponent(userEmail)}`),
      ]);

      if (detailRes.ok) {
        const d = await detailRes.json();
        const allAppearances = d.appearances || [];
        setAppearances(allAppearances);
        setThisWeek(d.thisWeek || 0);

        // Build keyword frequency map with counts
        const kwMap: Record<string, number> = {};
        allAppearances.forEach((a: any) => {
          const kw = a.metadata?.searchQuery || a.metadata?.keyword || '';
          if (kw && kw.length >= 3) kwMap[kw] = (kwMap[kw] || 0) + 1;
        });
        const sorted = Object.entries(kwMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([kw, count]) => ({ kw, count }));
        setTopKeywords(sorted);
        setTotal(allAppearances.length);
      }

      if (summaryRes.ok) {
        const s = await summaryRes.json();
        if (s.searchAppearances > 0) setTotal(s.searchAppearances);
        setProfileViews(s.profileViews || 0);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [userEmail]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!userEmail) return;
    const socketUrl = (import.meta.env.VITE_API_URL || '/api').replace('/api', '');
    const socket: Socket = io(socketUrl, { transports: ['websocket', 'polling'] });
    socket.on(`analytics_update:${userEmail}`, ({ eventType }: { eventType: string }) => {
      if (eventType === 'search_appearance' || eventType === 'profile_view') {
        setLiveIndicator(true);
        fetchData();
        setTimeout(() => setLiveIndicator(false), 3000);
      }
    });
    const handleRefresh = () => fetchData();
    window.addEventListener('analyticsRefresh', handleRefresh);
    return () => { socket.disconnect(); window.removeEventListener('analyticsRefresh', handleRefresh); };
  }, [userEmail, fetchData]);

  // Group appearances by date for timeline
  const grouped = appearances.reduce((acc: Record<string, any[]>, item) => {
    const date = formatDate(item.createdAt);
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  const STAT_CARDS = [
    { label: 'Total Appearances', value: total,       icon: Search,    gradient: 'from-blue-500 to-blue-600',   text: 'text-blue-700',   desc: 'Times your profile appeared in search' },
    { label: 'This Week',         value: thisWeek,    icon: TrendingUp, gradient: 'from-green-500 to-green-600', text: 'text-green-700',  desc: 'Appearances in the last 7 days' },
    { label: 'Profile Views',     value: profileViews, icon: Eye,       gradient: 'from-purple-500 to-purple-600', text: 'text-purple-700', desc: 'Recruiters who viewed your profile' },
  ];

  return (
    <div className="min-h-screen bg-[#f3f2f0]">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <div className="max-w-4xl mx-auto px-4 py-6">

        <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm mb-5 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Dashboard
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Search Appearances</h1>
            <p className="text-sm text-gray-500 mt-0.5">How recruiters are finding your profile</p>
          </div>
          <div className="flex items-center gap-2">
            {liveIndicator && (
              <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live
              </span>
            )}
            <button onClick={fetchData} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-white transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {STAT_CARDS.map(({ label, value, icon: Icon, gradient, text, desc }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-sm`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className={`text-2xl font-bold ${text}`}>{loading ? '—' : value}</p>
              <p className="text-xs font-semibold text-gray-700 mt-0.5">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">{desc}</p>
            </div>
          ))}
        </div>

        {/* What is Search Appearance info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">How Search Appearances work</p>
            <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
              Every time a recruiter searches for candidates and your profile appears in the results, it counts as a Search Appearance.
              Add more skills and keywords to your profile to appear in more searches.
            </p>
          </div>
        </div>

        {/* Top Keywords */}
        {!loading && topKeywords.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-5">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">🔍 Top Search Keywords</h2>
              <p className="text-xs text-gray-500 mt-0.5">Recruiters searched these terms and found your profile</p>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap gap-2">
                {topKeywords.map(({ kw, count }, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5">
                    <Search className="w-3 h-3 text-blue-500" />
                    <span className="text-sm font-medium text-blue-700">{kw}</span>
                    <span className="text-xs bg-blue-600 text-white rounded-full px-1.5 py-0.5 font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">📋 Appearance History</h2>
              <p className="text-xs text-gray-500 mt-0.5">When recruiters found your profile</p>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full font-medium">
              {loading ? '…' : `${appearances.length} total`}
            </span>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 bg-gray-200 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : appearances.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">No appearances yet</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-xs mx-auto">
                Add skills like "React", "Python", "Node.js" to your profile so recruiters can find you
              </p>
              <button onClick={() => onNavigate('dashboard')} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                Add Skills to Profile
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {Object.entries(grouped).map(([date, items]) => (
                <div key={date}>
                  {/* Date header */}
                  <div className="px-5 py-2 bg-gray-50 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500">{date}</span>
                    <span className="text-xs text-gray-400">· {items.length} appearance{items.length > 1 ? 's' : ''}</span>
                  </div>

                  {/* Items for this date */}
                  {items.map((item: any, idx: number) => {
                    const kw = item.metadata?.searchQuery || item.metadata?.keyword || '';
                    const hasKeyword = kw && kw.length >= 3;

                    return (
                      <div key={item.id || idx} className="px-5 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3">
                        {/* Icon */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${hasKeyword ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          {hasKeyword ? <Search className="w-4 h-4 text-blue-600" /> : <User className="w-4 h-4 text-gray-500" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {hasKeyword ? (
                            <>
                              <p className="text-sm font-medium text-gray-900">
                                A recruiter searched <span className="text-blue-600 font-semibold">"{kw}"</span> and found your profile
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">Your profile matched this search query</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-gray-900">Your profile appeared in a recruiter search</p>
                              <p className="text-xs text-gray-400 mt-0.5">No specific keyword recorded</p>
                            </>
                          )}
                        </div>

                        {/* Time */}
                        <span className="text-xs text-gray-400 flex-shrink-0 font-medium">{timeAgo(item.createdAt)}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchAppearancesPage;
