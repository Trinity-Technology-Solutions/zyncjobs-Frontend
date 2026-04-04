import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Eye, ArrowLeft, Calendar } from 'lucide-react';
import Header from '../components/Header';
import { API_ENDPOINTS } from '../config/env';

interface Props { onNavigate: (page: string) => void; user?: any; onLogout?: () => void; }

const SearchAppearancesPage: React.FC<Props> = ({ onNavigate, user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [totalAppearances, setTotalAppearances] = useState(0);
  const [thisWeek, setThisWeek] = useState(0);
  const [profileViews, setProfileViews] = useState(0);
  const [topKeywords, setTopKeywords] = useState<string[]>([]);
  const [appearances, setAppearances] = useState<any[]>([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      const email = u.email; if (!email) return;

      const [summaryRes, detailRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.BASE_URL}/analytics/profile/${encodeURIComponent(email)}?userType=candidate`),
        fetch(`${API_ENDPOINTS.BASE_URL}/analytics/search-appearances/${encodeURIComponent(email)}`)
      ]);

      if (summaryRes.ok) {
        const s = await summaryRes.json();
        setTotalAppearances(s.searchAppearances || 0);
        setProfileViews(s.profileViews || 0);
      }
      if (detailRes.ok) {
        const d = await detailRes.json();
        if (d && !Array.isArray(d)) {
          setThisWeek(d.thisWeek || 0);
          setTopKeywords(d.topKeywords || []);
          setAppearances(d.appearances || []);
        } else {
          setAppearances(Array.isArray(d) ? d : []);
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fmt = (ts: string) => {
    const d = new Date(ts), diff = Date.now() - d.getTime();
    const m = Math.floor(diff/60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(diff/3600000);
    if (h < 24) return `${h}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Search Appearances</h1>
          <p className="text-gray-500 mt-1">Track how often your profile appears in employer searches</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Appearances', value: totalAppearances, icon: Search, color: 'blue' },
            { label: 'This Week', value: thisWeek, icon: TrendingUp, color: 'green' },
            { label: 'Profile Views', value: profileViews, icon: Eye, color: 'purple' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`bg-white rounded-xl border border-${color}-100 p-5 shadow-sm`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 text-${color}-600`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Top Keywords */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Top Search Keywords</h2>
            <p className="text-xs text-gray-500 mt-0.5">Keywords employers used when your profile appeared</p>
          </div>
          <div className="p-6">
            {topKeywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {topKeywords.map((kw, i) => (
                  <span key={i} className="px-3 py-1.5 bg-blue-600 text-white rounded-full text-sm font-medium">{kw}</span>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No keyword data yet. Appears as employers search for candidates matching your profile.</p>
            )}
          </div>
        </div>

        {/* Appearances List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Appearances</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{appearances.length} records</span>
          </div>
          {appearances.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {appearances.map((item, idx) => (
                <div key={item.id || idx} className="px-6 py-4 hover:bg-blue-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Search className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {item.metadata?.searchQuery ? `Appeared for "${item.metadata.searchQuery}"` : 'Profile appeared in search'}
                      </p>
                      {item.metadata?.company && <p className="text-xs text-gray-500 mt-0.5">by {item.metadata.company}</p>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                      <Calendar className="w-3 h-3" />
                      {fmt(item.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">No appearances yet</h3>
              <p className="text-sm text-gray-500 mb-4">Complete your profile with skills and keywords to appear in employer searches</p>
              <button onClick={() => onNavigate('dashboard')} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                Optimize Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchAppearancesPage;
