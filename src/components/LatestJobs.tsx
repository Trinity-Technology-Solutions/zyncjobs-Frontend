import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/constants';
import { getSafeCompanyLogo, getCompanyLogo } from '../utils/logoUtils';
import { formatSalary } from '../utils/textUtils';
import { formatJobDescription } from '../utils/htmlUtils';
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
}

const LatestJobs: React.FC<LatestJobsProps> = ({ onNavigate, user }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyLogos, setCompanyLogos] = useState<Record<string, string>>({});

  const fetchCompanyLogos = async (jobList: Job[]) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.BASE_URL}/companies`);
      const map: Record<string, string> = {};

      // First, pull logos directly from job data
      jobList.forEach((j: any) => {
        const name = (j.company || '').toLowerCase();
        const logo = j.companyLogo || j.logoUrl || '';
        if (name && logo) map[name] = logo;
      });

      // Then overlay with company API logos (only non-empty, don't overwrite job-level logos)
      if (res.ok) {
        const data = await res.json();
        const companies: any[] = Array.isArray(data) ? data : (data.companies || data.data || []);
        companies.forEach((c: any) => {
          const name = (c.name || c.companyName || '').toLowerCase();
          const logo = c.logo || c.logoUrl || c.imageUrl || c.image || '';
          if (name && logo && !map[name]) map[name] = logo;
        });
      }

      setCompanyLogos(map);
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
        // Ensure jobs are sorted by creation date (newest first)
        const sortedJobs = data.sort((a: { createdAt: string | number | Date; }, b: { createdAt: string | number | Date; }) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setJobs(sortedJobs);
        fetchCompanyLogos(sortedJobs);
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
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading latest jobs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-10 lg:mb-12 text-center">
          <div className="inline-block bg-blue-50 text-blue-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            Latest Jobs
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Recent Job Openings
          </h2>
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto px-4">
            Discover the latest opportunities from verified employers, updated in real-time.
          </p>
        </div>
        
        {jobs.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-600 text-sm sm:text-base">No jobs posted yet. Be the first to post a job!</p>
          </div>
        ) : (
          <>
            {/* Job Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-6 mb-8 sm:mb-10 lg:mb-12">
              {jobs.map((job) => (
                <div key={getId(job)} className="bg-white rounded-lg p-4 sm:p-8 lg:p-10 shadow-sm border border-gray-200 hover:shadow-md transition-shadow min-h-[200px] sm:min-h-[300px] lg:min-h-[320px] flex flex-col">
                  {/* Mobile Layout */}
                  <div className="block sm:hidden">
                    {/* Company Info - Mobile */}
                    <div className="flex items-start mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          <img 
                            src={getCompanyLogo(job.company || '') || companyLogos[(job.company || '').toLowerCase()] || getSafeCompanyLogo(job) || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company || 'C')}&size=40&background=3b82f6&color=ffffff&bold=true&format=png`} 
                            alt={`${job.company} logo`}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.onerror = null;
                              img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company || 'C')}&size=40&background=3b82f6&color=ffffff&bold=true&format=png`;
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm">{job.company}</h3>
                          <p className="text-gray-600 text-sm font-medium">{job.jobTitle}</p>
                          <p className="text-gray-500 text-sm">{job.location}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Description - Mobile */}
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2 flex-1">
                      {formatJobDescription(job.description || 'A Software Developer designs, codes, tests, and maintains software applications, collaborating with teams to deliver high-quality solutions...', 100)}
                    </p>
                    
                    {/* Footer with Button, Salary, Time and Job Type - Mobile */}
                    <div className="flex items-center justify-between mt-auto">
                      <button
                        onClick={() => onNavigate && onNavigate('job-detail', { 
                          jobTitle: job.jobTitle, 
                          jobId: getId(job),
                          companyName: job.company,
                          jobData: job
                        })}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </button>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-bold text-gray-900">
                          ₹{job.salary ? formatSalary(job.salary).replace('INR ', '').replace('₹', '') : 
                             job.salaryMin && job.salaryMax ? 
                             `${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}` : 
                             '2L - 5L'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-500">{getTimeAgo(job.createdAt)}</span>
                      <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
                        {job.jobType || 'Full-time'}
                      </span>
                    </div>
                  </div>

                  {/* Desktop/Tablet Layout */}
                  <div className="hidden sm:block">
                    {/* Company Info - Desktop */}
                    <div className="flex items-start mb-4 lg:mb-5">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          <img 
                            src={getCompanyLogo(job.company || '') || companyLogos[(job.company || '').toLowerCase()] || getSafeCompanyLogo(job) || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company || 'C')}&size=48&background=3b82f6&color=ffffff&bold=true&format=png`} 
                            alt={`${job.company} logo`}
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.onerror = null;
                              img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company || 'C')}&size=48&background=3b82f6&color=ffffff&bold=true&format=png`;
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm lg:text-base truncate">{job.company}</h3>
                          <p className="text-gray-600 text-sm font-medium truncate">{job.jobTitle}</p>
                          <p className="text-gray-500 text-sm truncate">{job.location}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Description - Desktop */}
                    <p className="text-gray-600 text-sm mb-5 lg:mb-6 leading-relaxed line-clamp-3 flex-1">
                      {formatJobDescription(job.description || 'We are looking for a skilled professional to join our team. This role offers excellent opportunities for growth and development...', 120)}
                    </p>
                    
                    {/* Footer with Button and Salary - Desktop */}
                    <div className="flex items-center justify-between mt-auto mb-2">
                      <button
                        onClick={() => onNavigate && onNavigate('job-detail', { 
                          jobTitle: job.jobTitle, 
                          jobId: getId(job),
                          companyName: job.company,
                          jobData: job
                        })}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex-shrink-0"
                      >
                        View Details
                      </button>
                      <span className="font-bold text-gray-900 text-sm">
                        ₹{job.salary ? formatSalary(job.salary).replace('INR ', '').replace('₹', '') : 
                           job.salaryMin && job.salaryMax ? 
                           `${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}` : 
                           '2L - 5L'}
                      </span>
                    </div>
                    
                    {/* Time and Job Type - Desktop */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{getTimeAgo(job.createdAt)}</span>
                      <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
                        {job.jobType || 'Full-time'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Delete button for job owner */}
                  {user?.email === job.postedBy && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => deleteJob(getId(job) || '')}
                        className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Load More Button */}
            <div className="text-center">
              <button
                onClick={() => onNavigate && onNavigate('job-listings')}
                className="bg-blue-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-blue-700 transition-colors"
              >
                Load More
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LatestJobs;