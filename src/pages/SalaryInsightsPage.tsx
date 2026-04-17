import React, { useState, useEffect } from 'react';
import { TrendingUp, Search, IndianRupee, BarChart2, Award, ArrowLeft } from 'lucide-react';
import { API_ENDPOINTS } from '../config/env';

interface SalaryInsightsProps {
  defaultTitle?: string;
  compact?: boolean;
  onNavigate?: (page: string) => void;
}

const fmt = (n: number) => n >= 100000
  ? `₹${(n / 100000).toFixed(1)}L`
  : `₹${n.toLocaleString('en-IN')}`;

const SalaryInsights: React.FC<SalaryInsightsProps> = ({ defaultTitle = '', compact = false, onNavigate }) => {
  const [search, setSearch] = useState(defaultTitle);
  const [data, setData] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    fetch(`${API_ENDPOINTS.SALARY_INSIGHTS}/market-overview`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setOverview(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (defaultTitle) fetchInsights(defaultTitle);
  }, [defaultTitle]);

  const fetchInsights = async (title: string) => {
    if (!title.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.SALARY_INSIGHTS}/by-title?title=${encodeURIComponent(title)}`);
      const d = await res.json();
      setData(d);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const levelColors: Record<string, string> = {
    Entry: 'bg-green-500',
    Mid: 'bg-blue-500',
    Senior: 'bg-purple-500',
    Lead: 'bg-orange-500',
  };

  const statusBadge = (status: string) => {
    if (status === 'above') return <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">↑ Above Market</span>;
    if (status === 'below') return <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">↓ Below Market</span>;
    return <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">✓ Market Rate</span>;
  };

  return (
    <div className={compact ? '' : 'max-w-4xl mx-auto'}>
      {!compact && (
        <div className="mb-6">
          {onNavigate && (
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          )}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full">
                <TrendingUp className="w-3 h-3" /> AI Powered
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full">
                <BarChart2 className="w-3 h-3" /> Real-time Data
              </span>
            </div>
            <h1 style={{ fontSize: '34px', fontWeight: 700, letterSpacing: '-0.5px' }} className="text-gray-900">
              <span className="text-gray-900">AI</span>
              <span className="text-blue-600"> Salary Insights</span>
            </h1>
            <p style={{ fontSize: '16px', color: '#6B7280', maxWidth: '600px' }} className="mt-2">
              Explore real-time market salary data and get AI-powered compensation insights for any job role.
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchInsights(search)}
            placeholder="Search job title (e.g. Software Developer)"
            className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
          />
        </div>
        <button
          onClick={() => fetchInsights(search)}
          disabled={loading}
          className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Results */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!loading && searched && data && !data.found && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <BarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No salary data found for <strong>{data.title}</strong></p>
          <p className="text-xs text-gray-400 mt-1">Try a different job title</p>
        </div>
      )}

      {!loading && data?.found && (
        <div className="space-y-4">
          {/* Main salary card */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
            <p className="text-sm opacity-80 mb-1">{data.title} · {data.totalJobs} jobs analyzed</p>
            <div className="flex items-end gap-4">
              <div>
                <p className="text-xs opacity-70">Average Salary</p>
                <p className="text-4xl font-bold">{fmt(data.avgSalary)}</p>
              </div>
              <div className="flex gap-6 mb-1">
                <div>
                  <p className="text-xs opacity-70">Min</p>
                  <p className="text-lg font-semibold">{fmt(data.marketMin)}</p>
                </div>
                <div>
                  <p className="text-xs opacity-70">Max</p>
                  <p className="text-lg font-semibold">{fmt(data.marketMax)}</p>
                </div>
              </div>
            </div>
            {/* Salary bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs opacity-70 mb-1">
                <span>{fmt(data.marketMin)}</span>
                <span>Market Range</span>
                <span>{fmt(data.marketMax)}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${Math.min(((data.avgSalary - data.marketMin) / (data.marketMax - data.marketMin)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* By Experience Level */}
          {Object.keys(data.byLevel).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" /> Salary by Experience Level
              </h3>
              <div className="space-y-3">
                {Object.entries(data.byLevel).map(([level, info]: [string, any]) => {
                  const pct = Math.round(((info.avg - data.marketMin) / (data.marketMax - data.marketMin)) * 100);
                  return (
                    <div key={level}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-700 font-medium">{level}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{info.count} jobs</span>
                          <span className="text-sm font-bold text-gray-900">{fmt(info.avg)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${levelColors[level] || 'bg-blue-500'}`} style={{ width: `${Math.max(pct, 5)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Paying Companies */}
          {data.topCompanies?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-500" /> Top Paying Companies
              </h3>
              <div className="space-y-2">
                {data.topCompanies.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <span className="text-sm text-gray-800 font-medium">{c.company}</span>
                    </div>
                    <span className="text-sm font-bold text-green-700">{fmt(c.avg)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Market Overview - Top Roles */}
      {!searched && overview?.topRoles?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-600" /> Top Paying Roles in Market
          </h3>
          <div className="space-y-3">
            {overview.topRoles.map((r: any, i: number) => {
              const maxAvg = overview.topRoles[0]?.avg || 1;
              const pct = Math.round((r.avg / maxAvg) * 100);
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <button
                      onClick={() => { setSearch(r.title); fetchInsights(r.title); }}
                      className="text-sm text-blue-600 hover:underline font-medium text-left"
                    >
                      {r.title}
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{r.count} jobs</span>
                      <span className="text-sm font-bold text-gray-900">{fmt(r.avg)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryInsights;
