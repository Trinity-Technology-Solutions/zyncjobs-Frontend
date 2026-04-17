import React, { useEffect, useState } from 'react';
import { matchAPI } from '../services/matchAPI';
import { MatchBreakdownModal } from '../components/match/MatchBreakdownModal';
import { MatchScoreBadge } from '../components/match/MatchScoreBadge';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getSafeCompanyLogo } from '../utils/logoUtils';
import { API_ENDPOINTS } from '../config/env';
import { computeMatchBreakdown, normalizeSkill, getUserProfile } from '../utils/matchScore';

interface Props {
  onNavigate?: (page: string, data?: any) => void;
  user?: any;
  onLogout?: () => void;
}

export const JobRecommendationsPage: React.FC<Props> = ({ onNavigate, user, onLogout }) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'match' | 'recent'>('match');
  const [breakdownJob, setBreakdownJob] = useState<any | null>(null);
  const [companyLogos, setCompanyLogos] = useState<Record<string, string>>({});

  const userId = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return String(u.id || u._id || u.email || '1');
    } catch { return '1'; }
  })();

  const userName = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}').name || 'there';
    } catch { return 'there'; }
  })();

  const getUserSkills = (): string[] => {
    try {
      const profile = getUserProfile();
      const raw = profile.skills || profile.keySkills || [];
      return Array.isArray(raw)
        ? raw.map((s: any) => String(s || '').toLowerCase().trim()).filter(Boolean)
        : [];
    } catch { return []; }
  };

  // Removed calcLocalMatchScore — now using computeMatchBreakdown from shared utility

  useEffect(() => { loadRecommendations(); fetchCompanyLogos(); }, []);

  useEffect(() => {
    let result = [...jobs];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.skills.some((s: string) => s.toLowerCase().includes(q))
      );
    }
    if (sortBy === 'match') result.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    setFiltered(result);
  }, [jobs, search, sortBy]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await matchAPI.getRecommendations(userId, 20);
      const raw = Array.isArray(data?.jobs) ? data.jobs : [];
      const normalized = raw.map((j: any) => {
        const jobSkills = Array.isArray(j.skills) ? j.skills : [];
        const jobData = { ...j, title: j.title || j.jobTitle || '', skills: jobSkills };
        // Always use the same weighted formula as the modal
        const { overall } = computeMatchBreakdown(jobData);
        return {
          ...j,
          id: j.id || j._id || '',
          title: j.title || j.jobTitle || '',
          company: j.company || '',
          location: j.location || '',
          salary: j.salary || null,
          salaryMin: j.salaryMin || null,
          salaryMax: j.salaryMax || null,
          type: j.type || j.workType || j.jobType || '',
          skills: jobSkills,
          matchScore: overall,
          description: j.description || '',
          createdAt: j.createdAt || '',
        };
      });
      setJobs(normalized);
    } catch (err: any) {
      setError(err?.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyLogos = async () => {
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
      setCompanyLogos(map);
    } catch {}
  };

  const getLogoSrc = (job: any) =>
    companyLogos[(job.company || '').toLowerCase()] ||
    job.companyLogo || job.logoUrl ||
    getSafeCompanyLogo(job);

  const formatSalary = (job: any) => {
    if (job.salaryMin && job.salaryMax) return `₹${Number(job.salaryMin).toLocaleString()} – ₹${Number(job.salaryMax).toLocaleString()}`;
    if (job.salary) {
      if (typeof job.salary === 'object') return `₹${job.salary.min || ''} – ₹${job.salary.max || ''}`;
      return String(job.salary);
    }
    return null;
  };

  const avgScore = jobs.length ? Math.round(jobs.reduce((s, j) => s + (j.matchScore || 0), 0) / jobs.length) : 0;
  const topMatches = jobs.filter(j => (j.matchScore || 0) >= 70).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <div className="px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => onNavigate?.('dashboard')}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            Back to Dashboard
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> AI Powered
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> Personalized
                </span>
              </div>
              <h1 style={{ fontSize: '34px', fontWeight: 700, letterSpacing: '-0.5px' }} className="text-gray-900">
                <span className="text-gray-900">AI</span>
                <span className="text-blue-600"> Job Matches</span>
              </h1>
              <p style={{ fontSize: '16px', color: '#6B7280', maxWidth: '600px' }} className="mt-2">
                Personalized job recommendations based on your skills, experience, and preferences.
              </p>
            </div>
            {!loading && jobs.length > 0 && (
              <div className="flex gap-4 flex-shrink-0">
                <div className="text-center px-5 py-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{jobs.length}</div>
                  <div className="text-xs text-gray-500">Matches Found</div>
                </div>
                <div className="text-center px-5 py-3 bg-green-50 border border-green-100 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{topMatches}</div>
                  <div className="text-xs text-gray-500">Strong Matches</div>
                </div>
                <div className="text-center px-5 py-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <div className="text-2xl font-bold text-indigo-600">{avgScore}%</div>
                  <div className="text-xs text-gray-500">Avg. Match Score</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 w-full flex-1">

        {/* Search & Sort Bar */}
        {!loading && !error && jobs.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by title, company, skill..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">Sort by:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="match">Best Match</option>
                <option value="recent">Most Recent</option>
              </select>
            </div>
            <div className="text-sm text-gray-500 flex items-center whitespace-nowrap">
              <span className="font-semibold text-gray-800">{filtered.length}</span>&nbsp;results
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-700 font-medium text-lg">Finding your perfect matches...</p>
            <p className="text-gray-400 text-sm mt-1">Analyzing your profile against thousands of jobs</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-white border border-red-200 rounded-xl p-8 text-center shadow-sm">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h3 className="text-gray-900 font-semibold text-lg mb-1">Could not load recommendations</h3>
            <p className="text-gray-500 text-sm mb-5">{error}</p>
            <button onClick={loadRecommendations} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors">
              Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && jobs.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-gray-900 font-semibold text-lg mb-2">No recommendations yet</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">Complete your profile with skills, experience, and preferences to unlock personalized job matches.</p>
            <button onClick={() => onNavigate?.('dashboard')} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors">
              Complete Your Profile
            </button>
          </div>
        )}

        {/* No search results */}
        {!loading && !error && jobs.length > 0 && filtered.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
            <p className="text-gray-600 font-medium mb-2">No jobs match your search</p>
            <button onClick={() => setSearch('')} className="text-blue-600 text-sm hover:underline">Clear search</button>
          </div>
        )}

        {/* Job Cards */}
        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map((job) => {
              const salary = formatSalary(job);
              const isStrong = (job.matchScore || 0) >= 70;
              return (
                <div key={job.id || job.title} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  {/* Top accent bar for strong matches */}
                  {isStrong && <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-500" />}

                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      {/* Left: Job Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-3">
                          {/* Company Logo */}
                          <div className="w-11 h-11 rounded-lg border border-gray-200 bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <img
                              src={getLogoSrc(job)}
                              alt={`${job.company} logo`}
                              className="w-9 h-9 object-contain"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                const name = job.company || '';
                                const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
                                img.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><rect width="36" height="36" fill="#3B82F6" rx="6"/><text x="18" y="24" text-anchor="middle" fill="white" font-family="Arial" font-size="13" font-weight="bold">${initials}</text></svg>`)}`;
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 leading-tight truncate">{job.title}</h3>
                            <p className="text-gray-600 text-sm font-medium">{job.company}</p>
                          </div>
                        </div>

                        {/* Meta tags */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {job.location && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              {String(job.location)}
                            </span>
                          )}
                          {job.type && (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                              {String(job.type)}
                            </span>
                          )}
                          {salary && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full font-medium">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {salary}
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        {job.description && (
                          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{job.description}</p>
                        )}

                        {/* Skills */}
                        {job.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {job.skills.slice(0, 5).map((skill: string, i: number) => {
                              const userSkills = getUserSkills();
                              const isMatched = userSkills.some(us => us.includes(normalizeSkill(skill)) || normalizeSkill(skill).includes(us));
                              return (
                                <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium ${
                                  isMatched ? 'bg-green-100 text-green-700' : 'bg-indigo-50 text-indigo-700'
                                }`}>
                                  {isMatched && (
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                                  )}
                                  {String(skill)}
                                </span>
                              );
                            })}
                            {job.skills.length > 5 && (
                              <span className="text-xs text-gray-400 px-2 py-0.5">+{job.skills.length - 5} more</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Score + Actions */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-4 flex-shrink-0">
                        <MatchScoreBadge score={job.matchScore || 0} size="lg" />
                        <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => setBreakdownJob(job)}
                            className="flex-1 sm:flex-none text-sm border-2 border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 font-semibold transition-colors whitespace-nowrap"
                          >
                            View Match
                          </button>
                          <button
                            onClick={() => {
                              if (job.id) {
                                localStorage.setItem('selectedJob', JSON.stringify(job));
                                onNavigate?.(`job-detail/${job.id}`);
                              }
                            }}
                            className="flex-1 sm:flex-none text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition-colors whitespace-nowrap"
                          >
                            Apply Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom CTA */}
        {!loading && !error && jobs.length > 0 && (
          <div className="mt-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white text-center">
            <h3 className="text-lg font-bold mb-1">Want even better matches?</h3>
            <p className="text-blue-100 text-sm mb-4">Complete your profile with more skills and experience to improve your match scores.</p>
            <button
              onClick={() => onNavigate?.('dashboard')}
              className="bg-white text-blue-600 px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors"
            >
              Update My Profile
            </button>
          </div>
        )}
      </div>

      <Footer onNavigate={onNavigate} user={user} />

      {/* Match Breakdown Modal */}
      {breakdownJob && (
        <MatchBreakdownModal
          job={breakdownJob}
          isOpen={true}
          onClose={() => setBreakdownJob(null)}
        />
      )}
    </div>
  );
};

export default JobRecommendationsPage;
