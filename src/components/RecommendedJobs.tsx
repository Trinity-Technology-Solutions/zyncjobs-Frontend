import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/env';
import { computeMatchBreakdown } from '../utils/matchScore';
import { Bookmark, BookmarkCheck, MapPin, Briefcase, Lightbulb, BarChart3, Flame, CheckCircle } from 'lucide-react';
import { formatSalary } from '../utils/textUtils';
import CompanyLogo from './CompanyLogo';
import { formatJobDescription } from '../utils/htmlUtils';
import { useSavedJobsStore } from '../store/useSavedJobsStore';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary?: string | { min: number; max: number; currency: string; period?: string };
  salaryMin?: number | string;
  salaryMax?: number | string;
  skills: string[];
  description: string;
  requirements: string[];
  type?: string;
  jobType?: string | string[];
  matchPercentage?: number;
  createdAt?: string;
}

interface RecommendedJobsProps {
  resumeSkills: Array<{ skill: string }>;
  location: string;
  user?: any;
  onNavigate?: (page: string) => void;
}

const RecommendedJobs: React.FC<RecommendedJobsProps> = ({ resumeSkills, location, user, onNavigate }) => {
  // Guest users should not see personalized recommendations
  if (!user?.email) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-10 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lightbulb className="w-8 h-8 text-blue-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Personalized Job Recommendations</h3>
        <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
          Log in to get job recommendations tailored to your skills, experience, and preferences.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => onNavigate?.('login')}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
          >
            Log In
          </button>
          <button
            onClick={() => onNavigate?.('job-listings')}
            className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
          >
            Browse All Jobs
          </button>
        </div>
      </div>
    );
  }
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const savedJobIds = useSavedJobsStore(s => s.savedJobIds);
  const saveJobGlobal = useSavedJobsStore(s => s.saveJob);
  const unsaveJobGlobal = useSavedJobsStore(s => s.unsaveJob);
  const [companyLogos, setCompanyLogos] = useState<Record<string, string>>({});
  const [companyWebsites, setCompanyWebsites] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState({
    salaryRange: '',
    jobType: ''
  });
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);

  // Returns salary in LPA (Lakhs Per Annum) for consistent comparison
  const getSalaryInLPA = (job: any): number => {
    // Try salaryMin / salaryMax fields first
    const raw = job.salaryMin ?? (typeof job.salary === 'object' ? job.salary?.min : null);
    if (raw != null) {
      const n = Number(raw);
      if (!isNaN(n) && n > 0) {
        // If value > 100000 it's in rupees — convert to LPA
        return n > 100000 ? n / 100000 : n;
      }
    }
    // Try salary string
    const s = typeof job.salary === 'string' ? job.salary : '';
    if (s) {
      const nums = s.replace(/,/g, '').match(/\d+(\.\d+)?/g);
      if (nums && nums.length > 0) {
        let n = parseFloat(nums[0]);
        if (s.toLowerCase().includes('lpa') || s.toLowerCase().includes('lakh')) return n;
        if (s.toLowerCase().includes('k')) return (n * 1000) / 100000;
        if (n > 100000) return n / 100000; // raw rupees
        return n;
      }
    }
    return 0;
  };

  useEffect(() => {
    fetchMatchingJobs();
  }, [resumeSkills, location, user]);

  // Apply filters whenever jobs or filters change
  useEffect(() => {
    let filtered = [...jobs];

    if (filters.salaryRange) {
      filtered = filtered.filter(job => {
        const lpa = getSalaryInLPA(job);
        if (lpa === 0) return true; // no salary data — include by default
        switch (filters.salaryRange) {
          case '0-5':   return lpa <= 5;
          case '5-15':  return lpa >= 5 && lpa <= 15;
          case '15-30': return lpa >= 15 && lpa <= 30;
          case '30+':   return lpa >= 30;
          default:      return true;
        }
      });
    }

    if (filters.jobType) {
      filtered = filtered.filter(job => {
        const t = job.type || job.jobType;
        const arr: string[] = Array.isArray(t) ? t : t ? [String(t)] : [];
        return arr.some(v => v.toLowerCase().includes(filters.jobType.toLowerCase()));
      });
    }

    setFilteredJobs(filtered);
  }, [jobs, filters]);

  const handleSaveJob = (jobId: string) => {
    const isAlreadySaved = savedJobIds.has(jobId);
    const job = jobs.find((j: any) => (j._id || j.id) === jobId);
    if (isAlreadySaved) {
      unsaveJobGlobal(jobId);
    } else if (job) {
      saveJobGlobal(jobId, job);
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
              setJobs(matched.map((j: any) => {
                // Use backend-calculated match score if available, otherwise fallback
                const backendScore = j.matchPercentage || j.overall || j.score || j.matchedScore || null;
                if (backendScore !== null && !isNaN(backendScore)) {
                  return { ...j, matchPercentage: backendScore };
                }
                // Fallback: if backend didn't calculate, use our computation
                const jobData = { ...j, title: j.title || j.jobTitle || '', skills: Array.isArray(j.skills) ? j.skills : [] };
                const { overall } = computeMatchBreakdown(jobData);
                return { ...j, matchPercentage: overall };
              }));
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
            setJobs(matches.map((j: any) => {
              const jobData = { ...j, title: j.title || j.jobTitle || '', skills: Array.isArray(j.skills) ? j.skills : [] };
              const { overall } = computeMatchBreakdown(jobData);
              return { ...j, matchPercentage: overall };
            }));
            setLoading(false);
            return;
          }
        }
        fetchAllRecentJobs();
      } else {
        // Logged-in user with no skills yet — show latest jobs as fallback
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
      const logoMap: Record<string, string> = {};
      const websiteMap: Record<string, string> = {};
      companies.forEach((c: any) => {
        const name = (c.name || c.companyName || '').toLowerCase();
        const logo = c.logo || c.logoUrl || c.imageUrl || c.image || '';
        if (name && logo) logoMap[name] = logo;
        const site = c.website || c.companyWebsite || '';
        if (name && site) websiteMap[name] = site;
      });
      jobList.forEach((j: any) => {
        const name = (j.company || '').toLowerCase();
        const logo = j.companyLogo || j.logoUrl || '';
        if (name && logo && !logoMap[name]) logoMap[name] = logo;
      });
      setCompanyLogos(logoMap);
      setCompanyWebsites(websiteMap);
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
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {resumeSkills && resumeSkills.length > 0 ? 'Recommended Jobs for You' : 'Latest Jobs'}
            </h2>
            <p className="text-sm text-gray-600">
              {resumeSkills && resumeSkills.length > 0
                ? 'Based on your skills and preferences • Updated daily'
                : 'Most recently posted jobs • Update your profile for personalized recommendations'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{jobs.length}</div>
            <div className="text-xs text-gray-500">Jobs Found</div>
          </div>
        </div>
      </div>

      {/* Skills Match Summary */}
      {resumeSkills && resumeSkills.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Skills Profile</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {resumeSkills.slice(0, 8).map((skillObj, idx) => (
              <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {skillObj.skill}
              </span>
            ))}
            {resumeSkills.length > 8 && (
              <span className="text-sm text-gray-500">+{resumeSkills.length - 8} more skills</span>
            )}
          </div>
          <p className="text-sm text-gray-600">
            We're matching jobs based on these skills from your profile. Update your skills to get better recommendations.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Filter Jobs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
            <select
              value={filters.salaryRange}
              onChange={(e) => setFilters(prev => ({ ...prev, salaryRange: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">All Salaries</option>
              <option value="0-5">Under 5 LPA</option>
              <option value="5-15">5 – 15 LPA</option>
              <option value="15-30">15 – 30 LPA</option>
              <option value="30+">30+ LPA</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
            <select
              value={filters.jobType}
              onChange={(e) => setFilters(prev => ({ ...prev, jobType: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="full">Full-time</option>
              <option value="part">Part-time</option>
              <option value="contract">Contract</option>
              <option value="intern">Internship</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters({ salaryRange: '', jobType: '' })}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Clear Filters
                </button>
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-700 font-medium">
                  {filteredJobs.length} of {jobs.length} jobs
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-3 -mx-1">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300 mx-1">
            <p className="text-gray-500">No jobs match your filters.</p>
          </div>
        ) : (
          filteredJobs.map((job: any) => {
            const jobId = job._id || job.id;
            const isSaved = savedJobIds.has(jobId);
            const title = job.title || job.jobTitle || 'Position';
            const company = job.company || job.companyName || 'Company';
            const loc = job.location || 'Location';
            const salary = formatSalary(job.salary, job.currency || job.salary?.currency);
            const skills: string[] = job.skills || [];
            const jobType = Array.isArray(job.jobType) ? job.jobType[0] : job.type || job.jobType || '';
            const desc = (() => {
              const rawDesc = job.description || job.jobDescription || '';
              const formatted = formatJobDescription(rawDesc, 200);
              // Remove HTML tags showing as text and Job Summary headings
              return formatted
                .replace(/<h[1-6]>Job Summary<\/h[1-6]>\s*<p>/gi, '') // Remove <h3>Job Summary</h3> <p>
                .replace(/<h[1-6]>Job Summary<\/h[1-6]>/gi, '') // Remove <h3>Job Summary</h3>
                .replace(/<h[1-6]>Summary<\/h[1-6]>\s*<p>/gi, '') // Remove <h3>Summary</h3> <p>
                .replace(/<h[1-6]>Summary<\/h[1-6]>/gi, '') // Remove <h3>Summary</h3>
                .replace(/Job\s*Summary[:\s]*/gi, '') // Job Summary with optional colon/spaces
                .replace(/Summary[:\s]*/gi, '') // Summary with optional colon/spaces
                .replace(/^[\s\n]*Job[\s\n]+Summary[\s\n:]*/gi, '') // Multi-line Job Summary
                .replace(/[\s\n]*Job[\s\n]+Summary[\s\n:]*/gi, ' ') // Job Summary anywhere
                .replace(/^[\s\n]*Summary[\s\n:]*/gi, '') // Summary at start
                .replace(/[\s\n]*Summary[\s\n:]*/gi, ' ') // Summary anywhere
                .replace(/^[\s\n]*Overview[\s\n:]*/gi, '') // Also remove Overview
                .replace(/[\s\n]*Overview[\s\n:]*/gi, ' ') // Overview anywhere
                .replace(/^[\s\n]*Description[\s\n:]*/gi, '') // Also remove Description
                .replace(/[\s\n]*Description[\s\n:]*/gi, ' ') // Description anywhere
                .replace(/^[\s\n]*About[\s\n]+the[\s\n]+role[\s\n:]*/gi, '') // About the role
                .replace(/[\s\n]*About[\s\n]+the[\s\n]+role[\s\n:]*/gi, ' ') // About the role anywhere
                .replace(/^[\s\n]*Role[\s\n]+Description[\s\n:]*/gi, '') // Role Description
                .replace(/[\s\n]*Role[\s\n]+Description[\s\n:]*/gi, ' ') // Role Description anywhere
                .replace(/^[\s\n]*Position[\s\n]+Summary[\s\n:]*/gi, '') // Position Summary
                .replace(/[\s\n]*Position[\s\n]+Summary[\s\n:]*/gi, ' ') // Position Summary anywhere
                .replace(/\s+/g, ' ') // Clean up multiple spaces
                .trim();
            })();
            const isNew = job.createdAt && (Date.now() - new Date(job.createdAt).getTime()) < 48 * 3600000;
            const postedAgo = job.createdAt ? (() => {
              const diff = Date.now() - new Date(job.createdAt).getTime();
              const h = Math.floor(diff / 3600000);
              return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
            })() : '';

            return (
              <div key={jobId} className="relative bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all overflow-hidden group mx-1">

                {/* Blue left border strip */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600" />

                <div className="pl-4 pr-4 pt-3 pb-2">

                  {/* Row 1: Logo + Company name — left | Applied/Save/ViewDetails — right */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 pr-2">
                      {/* Company logo + name */}
                      <div className="flex items-center gap-3 mb-1.5">
                        <CompanyLogo
                          companyName={company}
                          storedLogo={companyLogos[company.toLowerCase()]}
                          website={companyWebsites[company.toLowerCase()]}
                          size={40}
                          className="rounded-lg border border-gray-200"
                        />
                        <span className="text-sm font-semibold text-blue-600 truncate">{company}</span>
                      </div>

                      {/* Job title */}
                      <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors mb-2 leading-tight">
                        {title}
                      </h4>

                      {/* Tags row */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                          <MapPin className="w-3 h-3" />{loc}
                        </span>
                        {salary && (
                          <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">{salary}</span>
                        )}
                        {jobType && (
                          <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                            <Briefcase className="w-3 h-3" />{jobType}
                          </span>
                        )}
                        {postedAgo && <span className="text-xs text-gray-400">{postedAgo}</span>}
                        {isNew && <span className="text-xs font-bold bg-green-500 text-white px-2 py-1 rounded-full">NEW</span>}
                      </div>

                      {/* Description */}
                      {desc && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed border-l-2 border-blue-400 pl-3">
                          {desc}
                        </p>
                      )}

                      {/* Skills */}
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {skills.slice(0, 4).map((skill: string, idx: number) => (
                            <span key={idx} className={`text-xs px-3 py-1 rounded border ${
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
                    <div className="flex flex-col gap-2 flex-shrink-0 min-w-[110px]">
                      {job.matchPercentage > 0 && (
                        <span className="text-xs font-bold bg-green-100 text-green-700 border border-green-200 px-2 py-1 rounded-full text-center">
                          {job.matchPercentage}% Match
                        </span>
                      )}
                      <button onClick={() => handleSaveJob(jobId)}
                        className={`flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                          isSaved
                            ? 'bg-blue-50 border-blue-200 text-blue-600'
                            : 'border-gray-300 text-gray-600 hover:border-gray-400 bg-white'
                        }`}>
                        {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                        {isSaved ? 'Saved' : 'Save'}
                      </button>
                      <button onClick={() => handleApplyNow(job)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm w-full">
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

      {/* Job Search Tips */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Job Search Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
              <span className="text-sm text-gray-700">Update your profile regularly to get better job matches</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
              <span className="text-sm text-gray-700">Add relevant skills and certifications to your resume</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
              <span className="text-sm text-gray-700">Save interesting jobs to apply later</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
              <span className="text-sm text-gray-700">Apply within 24-48 hours for better response rates</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
              <span className="text-sm text-gray-700">Customize your cover letter for each application</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
              <span className="text-sm text-gray-700">Follow up on applications after a week</span>
            </div>
          </div>
        </div>
      </div>

      {/* Job Market Insights */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          Job Market Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{jobs.length}</div>
            <div className="text-sm text-gray-600">Active Jobs</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round((filteredJobs.filter(j => (j.matchPercentage ?? 0) > 70).length / Math.max(filteredJobs.length, 1)) * 100)}%
            </div>
            <div className="text-sm text-gray-600">High Match Rate</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {filteredJobs.filter(j => j.createdAt && (Date.now() - new Date(j.createdAt).getTime()) < 48 * 3600000).length}
            </div>
            <div className="text-sm text-gray-600">New This Week</div>
          </div>
        </div>
      </div>

      {/* Popular Skills Section */}
      {resumeSkills && resumeSkills.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Trending Skills in Your Field
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'React', 'Node.js', 'Python', 'AWS', 'Docker', 'Kubernetes', 'TypeScript', 'MongoDB',
              'PostgreSQL', 'Redis', 'GraphQL', 'Next.js', 'Vue.js', 'Angular', 'Spring Boot', 'Django'
            ].slice(0, 12).map((skill, idx) => {
              const isUserSkill = resumeSkills.some(s => s.skill.toLowerCase().includes(skill.toLowerCase()));
              return (
                <div key={idx} className={`p-2 rounded-lg text-center text-sm ${
                  isUserSkill 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                  {skill}
                  {isUserSkill && <CheckCircle className="w-3 h-3 ml-1 text-green-600" />}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            <CheckCircle className="w-3 h-3 text-green-600" /> Skills you have • Gray skills are trending in the market
          </p>
        </div>
      )}
    </div>
  );
};

export default RecommendedJobs;
