import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/constants';
import { getCompanyLogo } from '../utils/logoUtils';
import { formatSalary } from '../utils/textUtils';

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

  const deleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_ENDPOINTS.JOBS}/${jobId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setJobs(prev => prev.filter(job => (job._id || job.id) !== jobId));
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
                <div key={job._id || job.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center mb-4">
                      <div className="bg-blue-100 w-16 h-16 rounded-lg flex items-center justify-center p-2 mr-4">
                        <img 
                          src={job.company.toLowerCase().includes('trinity') ? '/images/company-logos/trinity-logo.png' : getCompanyLogo(job.company)} 
                          alt={`${job.company} logo`}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            console.log('Logo failed to load:', target.src, 'for company:', job.company);
                            
                            // Special handling for Trinity - use custom SVG logo
                            if (job.company.toLowerCase().includes('trinity')) {
                              target.src = `data:image/svg+xml,${encodeURIComponent(`
                                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
                                  <rect width="64" height="64" fill="#4F46E5" rx="8"/>
                                  <text x="32" y="25" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">Trinity</text>
                                  <text x="32" y="45" text-anchor="middle" fill="white" font-family="Arial" font-size="8">Technology</text>
                                </svg>
                              `)}`;
                              return;
                            }
                            
                            // Create letter avatar as fallback for other companies
                            const initials = job.company.split(' ').map(n => n[0]).join('').toUpperCase();
                            target.src = `data:image/svg+xml,${encodeURIComponent(`
                              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
                                <rect width="64" height="64" fill="#3B82F6" rx="8"/>
                                <text x="32" y="40" text-anchor="middle" fill="white" font-family="Arial" font-size="20" font-weight="bold">${initials}</text>
                              </svg>
                            `)}`;
                          }}
                        />
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900">{job.company}, {job.location}</h5>
                        <span className="text-gray-600 text-sm">{job.jobTitle}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.description}</p>
                    
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onNavigate && onNavigate('job-detail', { 
                            jobTitle: job.jobTitle, 
                            jobId: job._id || job.id,
                            companyName: job.company,
                            jobData: job
                          })}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </button>
                        {user?.email === job.postedBy && (
                          <button
                            onClick={() => deleteJob(job._id || job.id || '')}
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
