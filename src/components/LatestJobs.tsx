import React, { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '../config/constants';
import { getSafeCompanyLogo, getCompanyLogo, getLocalCompanyLogo } from '../utils/logoUtils';
import CompanyLogo from './CompanyLogo';
import { formatSalary, getPostingFreshness } from '../utils/textUtils';
import { formatJobDescription } from '../utils/htmlUtils';
import { ArrowRight, Briefcase, Sparkles } from 'lucide-react';
import { getId } from '../utils/getId';

interface LatestJobsProps {
  onNavigate?: (page: string, data?: any) => void;
  user?: any;
}

interface Job {
  id?: string;
  _id?: string;
  jobTitle: string;
  company: string;
  companyLogo?: string;
  location: string;
  jobType: string;
  description: string;
  postedBy?: string;
  salary: {
    min: number;
    max: number;
    currency: string;
    period?: string;
  };
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  createdAt: string;
  urgentNote?: string;
  skills?: string[] | string;
}

function getSkillLabels(skills: Job['skills']): string[] {
  const labels = Array.isArray(skills) ? skills : typeof skills === 'string' ? skills.split(',') : [];
  const unique = new Map<string, string>();
  for (const label of labels) {
    if (typeof label !== 'string' || !label.trim()) continue;
    const skill = label.trim();
    if (!unique.has(skill.toLowerCase())) unique.set(skill.toLowerCase(), skill);
  }
  return [...unique.values()];
}

const LatestJobs: React.FC<LatestJobsProps> = ({ onNavigate, user }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const latestJobsRef = useRef<HTMLElement>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const tracks = latestJobsRef.current?.querySelectorAll<HTMLElement>('[data-loop="true"] .latest-job-skills-track');
    if (!tracks?.length) return;

    const updateDuration = (track: HTMLElement) => {
      // The loop travels half the track because it contains two identical groups.
      const distance = track.getBoundingClientRect().width / 2;
      if (distance > 0) track.style.setProperty('--skill-loop-duration', `${distance / 18}s`);
    };
    const observer = new ResizeObserver(entries => {
      for (const { target } of entries) updateDuration(target as HTMLElement);
    });
    for (const track of tracks) {
      updateDuration(track);
      observer.observe(track);
    }
    return () => observer.disconnect();
  }, [jobs, loading]);
  const [companyLogos, setCompanyLogos] = useState<Record<string, string>>({});
  const [companyWebsites, setCompanyWebsites] = useState<Record<string, string>>({});

  const fetchCompanyLogos = async (jobList: Job[]) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.BASE_URL}/companies`);
      const logoMap: Record<string, string> = {};
      const websiteMap: Record<string, string> = {};

      // First, pull logos directly from job data
      jobList.forEach((j: any) => {
        const name = (j.company || '').toLowerCase();
        const logo = j.companyLogo || j.logoUrl || '';
        if (name && logo) logoMap[name] = logo;
      });

      // Then overlay with company API logos (only non-empty, don't overwrite job-level logos)
      if (res.ok) {
        const data = await res.json();
        const companies: any[] = Array.isArray(data) ? data : (data.companies || data.data || []);
        companies.forEach((c: any) => {
          const name = (c.name || c.companyName || '').toLowerCase();
          const logo = c.logo || c.logoUrl || c.imageUrl || c.image || '';
          if (name && logo && !logoMap[name]) logoMap[name] = logo;
          const site = c.website || c.companyWebsite || '';
          if (name && site && !websiteMap[name]) websiteMap[name] = site;
        });
      }

      setCompanyLogos(logoMap);
      setCompanyWebsites(websiteMap);
    } catch {}
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_ENDPOINTS.JOBS}/${jobId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setJobs(prev => prev.filter(job => getId(job) !== jobId));
        window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Job deleted successfully!" } }));
      } else {
        window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Failed to delete job. Please try again." } }));
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Error deleting job. Please try again." } }));
    }
  };

  useEffect(() => {
    fetchLatestJobs();
    
    // Listen for job posting events to refresh the list
    const handleJobPosted = () => {
      console.log('New job posted, refreshing latest jobs...');
      fetchLatestJobs();
    };
    
    window.addEventListener('jobPosted', handleJobPosted);
    
    return () => {
      window.removeEventListener('jobPosted', handleJobPosted);
    };
  }, []);

  const fetchLatestJobs = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.JOBS}?limit=6&sort=newest`);
      if (response.ok) {
        const data = await response.json();
        // Sort by lastRefreshedAt first (refreshed jobs bubble up), then createdAt
        const sortedJobs = data.sort((a: any, b: any) => {
          const aTime = Math.max(new Date(a.lastRefreshedAt || 0).getTime(), new Date(a.createdAt).getTime());
          const bTime = Math.max(new Date(b.lastRefreshedAt || 0).getTime(), new Date(b.createdAt).getTime());
          return bTime - aTime;
        });
        setJobs(sortedJobs.slice(0, 6));
        fetchCompanyLogos(sortedJobs.slice(0, 6));
      } else {
        console.error('Failed to fetch jobs');
        setJobs([]);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.log('Invalid date:', dateString);
      return 'Recently';
    }
    
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    console.log('Date calculation:', {
      dateString,
      date: date.toISOString(),
      now: now.toISOString(),
      diffInMinutes
    });
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    
    return 'Recently';
  };



  if (loading) {
    return (
      <div className="bg-white py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" role="status" aria-label="Loading latest jobs">
            {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-56 rounded-xl border border-slate-200 bg-slate-50 animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  const cards = jobs.map(job => ({ job, skills: getSkillLabels(job.skills) }));

  return (
    <section ref={latestJobsRef} className="home-latest-jobs py-10 sm:py-12 lg:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="home-section-heading">
          <div>
            <span className="home-kicker">YOUR NEXT OPPORTUNITY</span>
            <h2>Fresh opportunities. New possibilities.</h2>
            <p>Explore the latest roles posted on ZyncJobs.</p>
          </div>
          <button className="home-text-link" onClick={() => onNavigate?.('job-listings', { clearFilters: true })}>View all jobs <ArrowRight size={17} /></button>
        </div>
        
        {jobs.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-slate-200 bg-white">
            <Briefcase size={30} className="mx-auto mb-3 text-blue-500" />
            <h3 className="font-semibold text-slate-800 mb-2">Your next opportunity is on its way</h3>
            <p className="text-sm text-slate-500">New roles will appear here as employers post them.</p>
          </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {cards.map(({ job, skills }) => (
                <div key={getId(job)} className="portal-job-card min-w-0 bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center mb-4 min-w-0">
                      <div className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-lg border border-gray-200 flex items-center justify-center bg-white overflow-hidden mr-3 sm:mr-4">
                        <CompanyLogo
                          companyName={job.company || ''}
                          storedLogo={job.companyLogo || companyLogos[(job.company || '').toLowerCase()] || ''}
                          website={companyWebsites[(job.company || '').toLowerCase()]}
                          size={40}
                          className="rounded"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="latest-job-company-line">
                          <p className="text-slate-500 text-xs truncate">{job.company}</p>
                          {Date.parse(job.createdAt) <= Date.now() && getPostingFreshness(job.createdAt) === 'new' && (
                            <span className="latest-job-freshness"><Sparkles size={12} aria-hidden="true" /> New on ZyncJobs</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-slate-900 text-base truncate" title={job.jobTitle}>{job.jobTitle}</h3>
                        <div className="text-gray-500 text-xs mt-0.5 truncate">{job.location}</div>
                      </div>
                    </div>
                    
                    {job.urgentNote && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 mb-3">
                        <p className="text-xs sm:text-sm text-orange-700 font-medium line-clamp-2">{job.urgentNote}</p>
                      </div>
                    )}
                    <p className="text-gray-600 text-xs sm:text-sm mb-4 line-clamp-2 leading-relaxed">{formatJobDescription(job.description || '', 100)}</p>
                    {skills.length > 0 && (
                      <div className="latest-job-skills" data-loop={skills.length > 1}>
                        <div className="latest-job-skills-track">
                          <ul className="latest-job-skills-group" aria-label="Job skills">
                            {skills.map(skill => <li key={skill}>{skill}</li>)}
                          </ul>
                          {skills.length > 1 && (
                            <ul className="latest-job-skills-group latest-job-skills-copy" aria-hidden="true">
                              {skills.map(skill => <li key={skill}>{skill}</li>)}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3.5 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onNavigate && onNavigate('job-detail', { 
                            jobTitle: job.jobTitle, 
                            jobId: getId(job),
                            companyName: job.company,
                            jobData: job
                          })}
                          className="bg-blue-600 text-white px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          View Details
                        </button>
                        {user?.email === job.postedBy && (
                          <button
                            onClick={() => deleteJob(getId(job) || '')}
                            className="bg-red-600 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                          {job.salary ? formatSalary(job.salary, job.currency || job.salary?.currency) :
                           job.salaryMin && job.salaryMax ?
                           formatSalary({ min: job.salaryMin, max: job.salaryMax, currency: job.currency }) :
                           'Salary not specified'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs sm:text-sm text-gray-500 pt-1">
                      <span>{getTimeAgo(job.createdAt)}</span>
                      <span className="bg-blue-50 text-blue-700 font-medium px-2.5 py-1 rounded text-xs">{job.jobType}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
        )}
      </div>
      
    </section>
  );
};

export default LatestJobs;
