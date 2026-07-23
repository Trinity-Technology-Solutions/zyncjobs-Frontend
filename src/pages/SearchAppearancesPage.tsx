import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, TrendingUp, Eye, RefreshCw, Zap, Clock, User,
  BarChart2, ChevronDown, ChevronUp, Sparkles, ArrowUpRight,
} from 'lucide-react';
import BackButton from '../components/BackButton';
import { io, Socket } from 'socket.io-client';
import Header from '../components/Header';
import { API_ENDPOINTS, config } from '../config/env';

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
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Keyword pill colors cycling
const KW_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
];

const SearchAppearancesPage: React.FC<Props> = ({ onNavigate, user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [thisWeek, setThisWeek] = useState(0);
  const [profileViews, setProfileViews] = useState(0);
  const [topKeywords, setTopKeywords] = useState<{ kw: string; count: number }[]>([]);
  const [appearances, setAppearances] = useState<any[]>([]);
  const [liveIndicator, setLiveIndicator] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const ITEMS_PER_DATE = 5;

  const userEmail = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}').email || user?.email || ''; }
    catch { return user?.email || ''; }
  })();

  // Store allAppearances in a ref so summaryRes block can access it
  const allAppearancesRef = React.useRef<any[]>([]);

  const fetchData = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const [summaryRes, detailRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.BASE_URL}/analytics/profile/${encodeURIComponent(userEmail)}?userType=candidate`),
        fetch(`${API_ENDPOINTS.BASE_URL}/analytics/search-appearances/${encodeURIComponent(userEmail)}`),
      ]);

      if (detailRes.ok) {
        const d = await detailRes.json();
        const all = d.appearances || [];
        allAppearancesRef.current = all;
        setAppearances(all);
        setThisWeek(d.thisWeek || 0);

        const kwMap: Record<string, number> = {};
        all.forEach((a: any) => {
          const kw = a.metadata?.searchQuery || a.metadata?.keyword || '';
          if (kw && kw.length >= 2) kwMap[kw] = (kwMap[kw] || 0) + 1;
        });
        setTopKeywords(
          Object.entries(kwMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([kw, count]) => ({ kw, count }))
        );
        setTotal(all.length);
      }

      if (summaryRes.ok) {
        const s = await summaryRes.json();
        setTotal(Math.max(allAppearancesRef.current.length, s.searchAppearances || 0));
        setProfileViews(s.profileViews || 0);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [userEmail]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!userEmail) return;
    const socket: Socket = io(config.SOCKET_URL, { transports: ['websocket', 'polling'] });
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

  // Group by date
  const grouped = appearances.reduce((acc: Record<string, any[]>, item) => {
    const date = formatDate(item.createdAt);
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  // Max count for bar chart
  const maxKwCount = topKeywords[0]?.count || 1;

  // Trend: compare this week vs last week
  const lastWeekCount = (() => {
    const now = Date.now();
    return appearances.filter(a => {
      const t = new Date(a.createdAt).getTime();
      return t >= now - 14 * 86400000 && t < now - 7 * 86400000;
    }).length;
  })();
  const trendUp = thisWeek >= lastWeekCount;
  const trendPct = lastWeekCount === 0 ? (thisWeek > 0 ? 100 : 0) : Math.round(((thisWeek - lastWeekCount) / lastWeekCount) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <BackButton onClick={() => onNavigate('dashboard')} className="mb-4 sm:mb-5" />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <Search className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Search Appearances</h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 ml-10">Track how recruiters are discovering your profile</p>
          </div>
          <div className="flex items-center gap-2">
            {liveIndicator && (
              <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live
              </span>
            )}
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 bg-white border border-gray-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-all shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
          {/* Total Appearances */}
          <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded-full hidden sm:block">Total</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">{loading ? '—' : total}</p>
            <p className="text-xs font-semibold text-gray-700 mt-0.5">Appearances</p>
            <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">In search results</p>
          </div>

          {/* This Week */}
          <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-sm">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              {!loading && (
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full hidden sm:flex items-center gap-0.5 ${trendUp ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
                  <ArrowUpRight className={`w-3 h-3 ${!trendUp ? 'rotate-180' : ''}`} />
                  {Math.abs(trendPct)}%
                </span>
              )}
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-600">{loading ? '—' : thisWeek}</p>
            <p className="text-xs font-semibold text-gray-700 mt-0.5">This Week</p>
            <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">Last 7 days</p>
          </div>

          {/* Profile Views */}
          <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <span className="text-xs text-violet-600 font-semibold bg-violet-50 px-1.5 py-0.5 rounded-full hidden sm:block">Views</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-violet-600">{loading ? '—' : profileViews}</p>
            <p className="text-xs font-semibold text-gray-700 mt-0.5">Profile Views</p>
            <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">Recruiters visited</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-3 sm:p-4 mb-4 sm:mb-5 flex items-start gap-3 shadow-sm">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-white">Boost your visibility</p>
            <p className="text-xs text-blue-100 mt-0.5 leading-relaxed">
              Every time a recruiter searches and your profile appears, it's counted here. Add more skills like React, Python, Node.js to appear in more searches.
            </p>
          </div>
          <button
            onClick={() => {
              onNavigate('dashboard');
              // signal dashboard to open skills modal
              sessionStorage.setItem('openModal', 'skills');
            }}
            className="ml-auto flex-shrink-0 text-xs bg-white text-blue-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            Add Skills
          </button>
        </div>

        {/* Top Keywords — Bar Chart Style */}
        {!loading && topKeywords.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4 sm:mb-5 overflow-hidden">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-500" />
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">Top Search Keywords</h2>
                <p className="text-xs text-gray-400 mt-0.5">Recruiters searched these terms and found you</p>
              </div>
            </div>
            <div className="p-4 sm:p-5 space-y-2.5">
              {topKeywords.map(({ kw, count }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 min-w-[80px] text-center ${KW_COLORS[i % KW_COLORS.length]}`}>
                    {kw}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                      style={{ width: `${(count / maxKwCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-600 w-6 text-right flex-shrink-0">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Appearance Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">Appearance History</h2>
                <p className="text-xs text-gray-400 mt-0.5">When recruiters found your profile</p>
              </div>
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-semibold">
              {loading ? '…' : `${appearances.length} total`}
            </span>
          </div>

          {loading ? (
            <div className="p-4 sm:p-5 space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 bg-gray-200 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="h-2.5 bg-gray-200 rounded w-12" />
                </div>
              ))}
            </div>
          ) : appearances.length === 0 ? (
            <div className="py-12 sm:py-16 text-center px-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1 text-base">No appearances yet</h3>
              <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
                Add skills like "React", "Python", "Node.js" to your profile so recruiters can find you in searches.
              </p>
              <button
                onClick={() => {
                  sessionStorage.setItem('openModal', 'skills');
                  onNavigate('dashboard');
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
              >
                Complete Your Profile
              </button>
            </div>
          ) : (
            <div>
              {Object.entries(grouped).map(([date, items]) => {
                const isExpanded = expandedDates[date];
                const visible = isExpanded ? items : items.slice(0, ITEMS_PER_DATE);
                const remaining = items.length - ITEMS_PER_DATE;

                return (
                  <div key={date}>
                    {/* Date header */}
                    <div className="px-4 sm:px-5 py-2 bg-gradient-to-r from-gray-50 to-slate-50 border-y border-gray-100 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                      <span className="text-xs font-bold text-gray-600">{date}</span>
                      <span className="text-xs text-gray-400 ml-auto">{items.length} appearance{items.length !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Items */}
                    <div className="divide-y divide-gray-50">
                      {visible.map((item: any, idx: number) => {
                        const kw = item.metadata?.searchQuery || item.metadata?.keyword || '';
                        const hasKeyword = kw && kw.length >= 2;
                        const colorClass = KW_COLORS[idx % KW_COLORS.length];

                        return (
                          <div key={item.id || idx} className="px-4 sm:px-5 py-3 hover:bg-blue-50/40 transition-colors flex items-start gap-3">
                            {/* Icon */}
                            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${hasKeyword ? 'bg-blue-100' : 'bg-gray-100'}`}>
                              {hasKeyword
                                ? <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                                : <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                              }
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs sm:text-sm text-gray-700">
                                  {hasKeyword ? 'Recruiter searched' : 'Your profile appeared in a search'}
                                </span>
                                {hasKeyword && (
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>
                                    {kw}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                <span className="text-xs text-gray-400">
                                  {hasKeyword ? 'Your profile matched this query' : 'No specific keyword recorded'}
                                </span>
                              </div>
                            </div>

                            {/* Time */}
                            <span className="text-xs text-gray-400 font-medium whitespace-nowrap flex-shrink-0 mt-0.5">
                              {timeAgo(item.createdAt)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Expand / Collapse */}
                    {items.length > ITEMS_PER_DATE && (
                      <button
                        onClick={() => setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }))}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-blue-600 hover:text-blue-800 font-semibold hover:bg-blue-50 transition-colors border-t border-gray-50"
                      >
                        {isExpanded
                          ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                          : <><ChevronDown className="w-3.5 h-3.5" /> View {remaining} more</>
                        }
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchAppearancesPage;
