import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/env';
import { Bookmark, BookmarkCheck, MapPin, Briefcase } from 'lucide-react';
import localStorageMigration from '../services/localStorageMigration';
import { formatSalary } from '../utils/textUtils';
import { getSafeCompanyLogo } from '../utils/logoUtils';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary?: string | { min: number; max: number; currency: string; period?: string };
  skills: string[];
  description: string;
  requirements: string[];
  type?: string;
}

interface RecommendedJobsProps {
  resumeSkills: Array<{ skill: string }>;
  location: string;
  user?: any;
  onNavigate?: (page: string) => void;
}

const RecommendedJobs: React.FC<RecommendedJobsProps> = ({ resumeSkills, location, user, onNavigate }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [companyLogos, setCompanyLogos] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState({
    salaryRange: '',
    jobType: ''
  });
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  // Helper function to get numeric salary for filtering
  const getNumericSalary = (salary: string | { min: number; max: number; currency: string; period?: string } | undefined): number => {
    if (!salary) return 0;
    
    if (typeof salary === 'string') {
      return parseInt(salary.replace(/[^0-9]/g, '') || '0');
    }
    
    if (typeof salary === 'object' && salary.min) {
      return salary.min;
    }
    
    return 0;
  };

  useEffect(() => {
    fetchMatchingJobs();
    if (user?.email) {
      loadSavedJobsFromBackend();
    } else {
      const userJobIdsKey = `savedJobs_${user?.name || 'user'}`;
      const localIds: string[] = JSON.parse(localStorage.getItem(userJobIdsKey) || '[]');
      setSavedJobs(localIds);
    }
  }, [resumeSkills, location, user]);

  // Apply filters whenever jobs or filters change
  useEffect(() => {
    let filtered = [...jobs];

    // Filter by salary range
    if (filters.salaryRange) {
      filtered = filtered.filter(job => {
        if (!job.salary) return false;
        const salary = getNumericSalary(job.salary);
        
        if (filters.salaryRange === '0-50k') return salary <= 50000;
        if (filters.salaryRange === '50k-100k') return salary >= 50000 && salary <= 100000;
        if (filters.salaryRange === '100k-150k') return salary >= 100000 && salary <= 150000;
        if (filters.salaryRange === '150k+') return salary >= 150000;
        return true;
      });
    }

    // Filter by job type
    if (filters.jobType) {
      filtered = filtered.filter(job => job.type === filters.jobType);
    }

    setFilteredJobs(filtered);
  }, [jobs, filters]);

  const loadSavedJobsFromBackend = async () => {
    const userName = user?.name || 'user';
    const userJobIdsKey = `savedJobs_${userName}`;
    const localIds: string[] = JSON.parse(localStorage.getItem(userJobIdsKey) || '[]');
    try {
      const backendIds = await localStorageMigration.getSavedRecommendedJobs();
      setSavedJobs(Array.from(new Set([...backendIds, ...localIds])));
    } catch {
      setSavedJobs(localIds);
    }
  };

  const syncToMyJobs = (job: any, jobId: string, remove: boolean) => {
    const userName = user?.name || 'user';
    const userKey = `savedJobDetails_${userName}`;
    const userJobIdsKey = `savedJobs_${userName}`;
    const existing: any[] = JSON.parse(localStorage.getItem(userKey) || '[]');
    const existingIds: string[] = JSON.parse(localStorage.getItem(userJobIdsKey) || '[]');

    if (remove) {
      localStorage.setItem(userKey, JSON.stringify(existing.filter((j: any) => (j._id || j.id) !== jobId)));
      localStorage.setItem(userJobIdsKey, JSON.stringify(existingIds.filter(id => id !== jobId)));
    } else {
      if (!existingIds.includes(jobId)) {
        localStorage.setItem(userKey, JSON.stringify([...existing, job]));
        localStorage.setItem(userJobIdsKey, JSON.stringify([...existingIds, jobId]));
      }
    }
  };

  const handleSaveJob = (jobId: string) => {
    const isAlreadySaved = savedJobs.includes(jobId);
    const job = jobs.find((j: any) => (j._id || j.id) === jobId);

    if (isAlreadySaved) {
      setSavedJobs(prev => prev.filter(id => id !== jobId));
      if (job) syncToMyJobs(job, jobId, true);
      if (user?.email) localStorageMigration.removeSavedRecommendedJob(jobId).catch(() => {});
    } else {
      if (job) {
        setSavedJobs(prev => [...prev, jobId]);
        syncToMyJobs(job, jobId, false);
        if (user?.email) localStorageMigration.saveRecommendedJob(job).catch(() => {});
      }
    }
  };

  const handleApplyNow = (job: any) => {
    const jobId = job._id || job.id;
    localStorage.setItem('selectedJob', JSON.stringify(job));
    if (onNavigate) {
      if (jobId) {
        onNavigate(`job-detail/${jobId}`);
      } else {
        onNavigate('job-detail');
      }
    }
  };

  const fetchMatchingJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try real semantic matching first if user is logged in
      const storedUser = localStorage.getItem('user');
      const userId = storedUser ? JSON.parse(storedUser)?.id : null;

      if (userId) {
        const res = await fetch(`${API_ENDPOINTS.BASE_URL}/match/recommendations/${userId}?limit=10`);
        if (res.ok) {
          const data = await res.json();
          const matched = Array.isArray(data.jobs) ? data.jobs : [];
          if (matched.length > 0) {
            setJobs(matched.map((j: any) => ({ ...j, matchPercentage: j.matchScore })));
            setLoading(false);
            return;
          }
        }
      }

      // Fallback: skill-based or recent jobs
      if (resumeSkills && resumeSkills.length > 0) {
        const skillNames = resumeSkills.map(s => s.skill.toLowerCase()).filter(s => s);
        if (skillNames.length === 0) { fetchAllRecentJobs(); return; }

        // Use semantic text match
        const res = await fetch(`${API_ENDPOINTS.BASE_URL}/match/jobs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: skillNames.join(' '), limit: 10 })
        });
        if (res.ok) {
          const data = await res.json();
          const matches = Array.isArray(data.matches) ? data.matches : [];
          if (matches.length > 0) {
            setJobs(matches.map((j: any) => ({ ...j, matchPercentage: j.matchScore })));
            setLoading(false);
            return;
          }
        }
        fetchAllRecentJobs();
      } else {
        fetchAllRecentJobs();
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      fetchAllRecentJobs();
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRecentJobs = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/jobs?limit=10&sort=-createdAt`);
      if (response.ok) {
        const allJobs = await response.json();
        const jobsArray = Array.isArray(allJobs) ? allJobs : [];
        const sliced = jobsArray.slice(0, 5);
        setJobs(sliced);
        fetchCompanyLogos(sliced);
      } else {
        setError('Failed to load job recommendations');
        setJobs([]);
      }
    } catch {
      setError('Error loading job recommendations');
      setJobs([]);
    }
  };

  // Exact same logic as JobListingsPage
  const fetchCompanyLogos = async (jobList: any[]) => {
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
      jobList.forEach((j: any) => {
        const name = (j.company || '').toLowerCase();
        const logo = j.companyLogo || j.logoUrl || '';
        if (name && logo && !map[name]) map[name] = logo;
      });
      setCompanyLogos(map);
    } catch {}
  };
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="relative bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-200 rounded-l-xl" />
            <div className="pl-5 pr-5 pt-5 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div className="h-4 bg-gray-200 rounded w-36" />
              </div>
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="flex gap-2 mb-3">
                <div className="h-7 bg-gray-200 rounded-full w-24" />
                <div className="h-7 bg-gray-200 rounded-full w-20" />
                <div className="h-7 bg-gray-200 rounded-full w-28" />
              </div>
              <div className="h-10 bg-gray-100 rounded-lg mb-3" />
              <div className="flex gap-2">
                <div className="h-10 bg-gray-200 rounded-xl flex-1" />
                <div className="h-10 bg-gray-200 rounded-xl w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800">{error}</p>
      </div>
    );
  }

  if (jobs.length === 0 && !loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No jobs available at the moment.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <select
              value={filters.salaryRange}
              onChange={(e) => setFilters(prev => ({ ...prev, salaryRange: e.target.value }))}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">All Salaries</option>
              <option value="0-50k">₹0 - ₹50k</option>
              <option value="50k-100k">₹50k - ₹100k</option>
              <option value="100k-150k">₹100k - ₹150k</option>
              <option value="150k+">₹150k+</option>
            </select>
          </div>
          <div className="flex-1">
            <select
              value={filters.jobType}
              onChange={(e) => setFilters(prev => ({ ...prev, jobType: e.target.value }))}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
              <option value="Remote">Remote</option>
            </select>
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">Showing {filteredJobs.length} of {jobs.length} jobs</span>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No jobs match your filters.</p>
          </div>
        ) : (
          filteredJobs.map((job: any) => {
            const jobId = job._id || job.id;
            const isSaved = savedJobs.includes(jobId);
            const title = job.title || job.jobTitle || 'Position';
            const company = job.company || job.companyName || 'Company';
            const loc = job.location || 'Location';
            const salary = formatSalary(job.salary);
            const skills: string[] = job.skills || [];
            const jobType = Array.isArray(job.jobType) ? job.jobType[0] : job.type || job.jobType || '';
            const desc = (job.description || job.jobDescription || '').replace(/<[^>]*>/g, '');
            const isNew = job.createdAt && (Date.now() - new Date(job.createdAt).getTime()) < 48 * 3600000;
            const postedAgo = job.createdAt ? (() => {
              const diff = Date.now() - new Date(job.createdAt).getTime();
              const h = Math.floor(diff / 3600000);
              return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
            })() : '';

            return (
              <div key={jobId} className="relative bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all overflow-hidden group">

                {/* Blue left border strip */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600" />

                <div className="pl-4 pr-4 pt-4 pb-3">

                  {/* Row 1: Logo + Company name — left | Applied/Save/ViewDetails — right */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Company logo + name */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center bg-white">
                          <img
                            src={companyLogos[(company).toLowerCase()] || getSafeCompanyLogo(job)}
                            alt={`${company} logo`}
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              const container = img.parentElement;
                              if (container) {
                                // Hide the image
                                img.style.display = 'none';
                                // Add LinkedIn-style building icon
                                container.innerHTML = `
                                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="4" y="6" width="16" height="16" rx="2" ry="2" fill="#F3F4F6" stroke="#D1D5DB"/>
                                    <rect x="6" y="8" width="2" height="2" fill="#9CA3AF"/>
                                    <rect x="10" y="8" width="2" height="2" fill="#9CA3AF"/>
                                    <rect x="14" y="8" width="2" height="2" fill="#9CA3AF"/>
                                    <rect x="6" y="12" width="2" height="2" fill="#9CA3AF"/>
                                    <rect x="10" y="12" width="2" height="2" fill="#9CA3AF"/>
                                    <rect x="14" y="12" width="2" height="2" fill="#9CA3AF"/>
                                    <rect x="6" y="16" width="2" height="2" fill="#9CA3AF"/>
                                    <rect x="10" y="16" width="2" height="2" fill="#9CA3AF"/>
                                    <rect x="14" y="16" width="2" height="2" fill="#9CA3AF"/>
                                    <rect x="8" y="2" width="8" height="4" rx="1" fill="#E5E7EB" stroke="#D1D5DB"/>
                                  </svg>
                                `;
                                container.classList.add('bg-gray-50');
                              }
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-blue-600 truncate">{company}</span>
                      </div>

                      {/* Job title */}
                      <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors mb-2 leading-tight">
                        {title}
                      </h4>

                      {/* Tags row */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                          <MapPin className="w-3 h-3" />{loc}
                        </span>
                        {salary && (
                          <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">{salary}</span>
                        )}
                        {jobType && (
                          <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                            <Briefcase className="w-3 h-3" />{jobType}
                          </span>
                        )}
                        {postedAgo && <span className="text-xs text-gray-400">{postedAgo}</span>}
                        {isNew && <span className="text-xs font-bold bg-green-500 text-white px-2 py-0.5 rounded-full">NEW</span>}
                      </div>

                      {/* Description */}
                      {desc && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed border-l-2 border-blue-400 pl-2.5">
                          {desc.substring(0, 150)}...
                        </p>
                      )}

                      {/* Skills */}
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {skills.slice(0, 4).map((skill: string, idx: number) => (
                            <span key={idx} className={`text-xs px-2.5 py-0.5 rounded border ${
                              job.matchingSkills?.includes(skill.toLowerCase())
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>{skill}</span>
                          ))}
                          {skills.length > 4 && <span className="text-xs text-gray-400">+{skills.length - 4} more</span>}
                        </div>
                      )}
                    </div>

                    {/* Right side buttons — stacked like job search page */}
                    <div className="flex flex-col gap-2 flex-shrink-0 min-w-[120px]">
                      {job.matchPercentage > 0 && (
                        <span className="text-xs font-bold bg-green-100 text-green-700 border border-green-200 px-2 py-1 rounded-full text-center">
                          {job.matchPercentage}% Match
                        </span>
                      )}
                      <button onClick={() => handleSaveJob(jobId)}
                        className={`flex items-center justify-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                          isSaved
                            ? 'bg-blue-50 border-blue-200 text-blue-600'
                            : 'border-gray-300 text-gray-600 hover:border-gray-400 bg-white'
                        }`}>
                        {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                        {isSaved ? 'Saved' : 'Save'}
                      </button>
                      <button onClick={() => handleApplyNow(job)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors shadow-sm w-full">
                        View Details
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecommendedJobs;
