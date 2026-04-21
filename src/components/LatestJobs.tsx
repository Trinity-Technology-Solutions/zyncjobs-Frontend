import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/constants';
import { getSafeCompanyLogo } from '../utils/logoUtils';
import { formatSalary } from '../utils/textUtils';
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
      if (!res.ok) return;
      const data = await res.json();
      const companies: any[] = Array.isArray(data) ? data : (data.companies || data.data || []);
      const map: Record<string, string> = {};
      companies.forEach((c: any) => {
        const name = (c.name || c.companyName || '').toLowerCase();
        const logo = c.logo || c.logoUrl || c.imageUrl || c.image || '';
        if (name && logo) map[name] = logo;
      });
      // Also check job.companyLogo field directly
      jobList.forEach((j: any) => {
        const name = (j.company || '').toLowerCase();
        const logo = j.companyLogo || j.logoUrl || '';
        if (name && logo && !map[name]) map[name] = logo;
      });
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
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          {/* Label Badge */}
          <span className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-4">
            Latest Jobs
          </span>

          {/* Heading */}
          <h2 className="text-4xl font-semibold tracking-tight text-gray-900 mb-3">
            Recent Job Openings
          </h2>

          {/* Subtitle */}
          <p className="text-gray-500 text-base max-w-xl">
            Discover the latest opportunities from verified employers, updated in real-time.
          </p>
        </div>
        
        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No jobs posted yet. Be the first to post a job!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {jobs.map((job) => (
                <div key={getId(job)} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center bg-white overflow-hidden mr-4">
                        <img 
                          src={companyLogos[(job.company || '').toLowerCase()] || getSafeCompanyLogo(job)} 
                          alt={`${job.company} logo`}
                          className="w-10 h-10 object-contain"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            const container = img.parentElement;
                            if (container) {
                              // Hide the image
                              img.style.display = 'none';
                              // Add LinkedIn-style building icon
                              container.innerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
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
                      <div>
                        <h5 className="font-semibold text-gray-900">{job.company}</h5>
                        <span className="text-gray-600 text-sm">{job.jobTitle}</span>
                        <div className="text-gray-500 text-xs mt-1">{job.location}</div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.description}</p>
                    
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onNavigate && onNavigate('job-detail', { 
                            jobTitle: job.jobTitle, 
                            jobId: getId(job),
                            companyName: job.company,
                            jobData: job
                          })}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </button>
                        {user?.email === job.postedBy && (
                          <button
                            onClick={() => deleteJob(getId(job) || '')}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-gray-900 text-sm">
                          {job.salary ? formatSalary(job.salary) : 
                           job.salaryMin && job.salaryMax ? 
                           `${job.currency || 'INR'} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}` : 
                           'Salary not specified'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>{getTimeAgo(job.createdAt)}</span>
                      <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded">{job.jobType}</span>
                    </div>
                  </div>
                ))}
            </div>
            
            <div className="text-center">
              <button
                onClick={() => onNavigate && onNavigate('job-listings')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
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
