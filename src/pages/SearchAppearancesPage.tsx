import React, { useState, useEffect, useCallback } from 'react';
import { Search, TrendingUp, Eye, RefreshCw, Zap, Clock, User } from 'lucide-react';
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
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const ITEMS_PER_DATE = 3;

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
        // Use the detailed count if it's higher than summary count
        const detailedCount = allAppearances.length;
        const summaryCount = s.searchAppearances || 0;
        setTotal(Math.max(detailedCount, summaryCount));
        setProfileViews(s.profileViews || 0);
      } else {
        // Fallback to detailed count if summary fails
        setTotal(allAppearances.length);
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

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">

        <BackButton onClick={() => onNavigate('dashboard')} className="mb-4 sm:mb-5" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 mb-4 sm:mb-5">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Search Appearances</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">How recruiters are finding your profile</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {liveIndicator && (
              <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold bg-green-50 border border-green-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full whitespace-nowrap">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse flex-shrink-0" /> Live
              </span>
            )}
            <button onClick={fetchData} className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-white transition-all flex-shrink-0">
              <RefreshCw className="w-4 h-4 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
          {STAT_CARDS.map(({ label, value, icon: Icon, gradient, text, desc }) => (
            <div key={label} className="bg-white rounded-lg sm:rounded-xl border border-gray-100 p-2.5 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-2 sm:mb-3 shadow-sm flex-shrink-0`}>
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <p className={`text-xl sm:text-2xl font-bold ${text}`}>{loading ? '—' : value}</p>
              <p className="text-xs font-semibold text-gray-700 mt-0.5 sm:mt-1 leading-tight">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5 sm:mt-1 leading-tight hidden sm:block">{desc}</p>
            </div>
          ))}
        </div>

        {/* What is Search Appearance info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-5 flex items-start gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-blue-900">How Search Appearances work</p>
            <p className="text-xs text-blue-700 mt-0.5 sm:mt-1 leading-relaxed">
              Every time a recruiter searches for candidates and your profile appears in the results, it counts as a Search Appearance.
              Add more skills and keywords to your profile to appear in more searches.
            </p>
          </div>
        </div>

        {/* Top Keywords */}
        {!loading && topKeywords.length > 0 && (
          <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm mb-4 sm:mb-5">
            <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-xs sm:text-sm">🔍 Top Search Keywords</h2>
              <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">Recruiters searched these terms and found your profile</p>
            </div>
            <div className="p-3 sm:p-5">
              <div className="flex flex-wrap gap-2 sm:gap-2">
                {topKeywords.map(({ kw, count }, i) => (
                  <div key={i} className="flex items-center gap-1 sm:gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm">
                    <Search className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    <span className="font-medium text-blue-700 truncate">{kw}</span>
                    <span className="text-xs bg-blue-600 text-white rounded-full px-1.5 py-0.5 font-bold flex-shrink-0">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm">
          <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-start sm:items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 text-xs sm:text-sm">📋 Appearance History</h2>
              <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">When recruiters found your profile</p>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full font-medium flex-shrink-0">
              {loading ? '…' : `${appearances.length}`}
            </span>
          </div>

          {loading ? (
            <div className="p-3 sm:p-5 space-y-2 sm:space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-2 sm:gap-3 animate-pulse">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-200 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1 sm:space-y-1.5">
                    <div className="h-2.5 sm:h-3 bg-gray-200 rounded w-2/3" />
                    <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : appearances.length === 0 ? (
            <div className="p-6 sm:p-12 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Search className="w-7 h-7 sm:w-8 sm:h-8 text-gray-300" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-0.5 sm:mb-1 text-sm">No appearances yet</h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 max-w-xs mx-auto">
                Add skills like "React", "Python", "Node.js" to your profile so recruiters can find you
              </p>
              <button onClick={() => onNavigate('dashboard')} className="bg-blue-600 text-white px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700">
                Add Skills to Profile
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {Object.entries(grouped).map(([date, items]) => {
                const isExpanded = expandedDates[date];
                const visible = isExpanded ? items : items.slice(0, ITEMS_PER_DATE);
                const remaining = items.length - ITEMS_PER_DATE;

                // Deduplicate: group consecutive identical entries
                const deduped: { item: any; count: number }[] = [];
                visible.forEach((item: any) => {
                  const kw = item.metadata?.searchQuery || item.metadata?.keyword || '';
                  const last = deduped[deduped.length - 1];
                  const lastKw = last?.item.metadata?.searchQuery || last?.item.metadata?.keyword || '';
                  if (last && lastKw === kw) {
                    last.count++;
                  } else {
                    deduped.push({ item, count: 1 });
                  }
                });

                return (
                  <div key={date}>
                    {/* Date header */}
                    <div className="px-3 sm:px-5 py-1.5 sm:py-2 bg-gray-50 flex items-center gap-1.5 sm:gap-2">
                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-gray-500 truncate">{date}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">· {items.length}</span>
                    </div>

                    {/* Items */}
                    {deduped.map(({ item, count }, idx) => {
                      const kw = item.metadata?.searchQuery || item.metadata?.keyword || '';
                      const hasKeyword = kw && kw.length >= 3;
                      return (
                        <div key={item.id || idx} className="px-3 sm:px-5 py-2 sm:py-3 hover:bg-blue-50 transition-colors flex items-start gap-2 sm:gap-3">
                          <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${hasKeyword ? 'bg-blue-100' : 'bg-gray-100'}`}>
                            {hasKeyword ? <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" /> : <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            {hasKeyword ? (
                              <p className="text-xs sm:text-sm font-medium text-gray-900 break-words">
                                A recruiter searched <span className="text-blue-600 font-semibold">"{kw}"</span> and found your profile
                              </p>
                            ) : (
                              <p className="text-xs sm:text-sm font-medium text-gray-900">Your profile appeared in a recruiter search</p>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5">
                              {hasKeyword ? 'Matched this search query' : 'No specific keyword recorded'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 text-xs">
                            {count > 1 && (
                              <span className="text-xs bg-blue-600 text-white rounded-full px-1.5 py-0.5 font-bold">×{count}</span>
                            )}
                            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{timeAgo(item.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* View More / Less */}
                    {items.length > ITEMS_PER_DATE && (
                      <div className="px-3 sm:px-5 py-1.5 sm:py-2 border-t border-gray-50">
                        <button
                          onClick={() => setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }))}
                          className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors"
                        >
                          {isExpanded ? (
                            <>▲ Show less</>
                          ) : (
                            <>▼ View {remaining} more appearance{remaining > 1 ? 's' : ''}</>
                          )}
                        </button>
                      </div>
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
