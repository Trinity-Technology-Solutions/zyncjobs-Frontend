import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/env';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import localStorageMigration from '../services/localStorageMigration';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  skills: string[];
  description: string;
  requirements: string[];
  type?: string;
}

interface RecommendedJobsProps {
  resumeSkills: Array<{ skill: string }>;
  location: string;
  user?: any;
}

const RecommendedJobs: React.FC<RecommendedJobsProps> = ({ resumeSkills, location, user }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    salaryRange: '',
    jobType: ''
  });
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);

  useEffect(() => {
    fetchMatchingJobs();
    // Load saved jobs from backend if user is logged in
    if (user?.email) {
      loadSavedJobsFromBackend();
    } else {
      // Load from localStorage for non-logged users
      const saved = localStorage.getItem('savedRecommendedJobs');
      if (saved) {
        setSavedJobs(JSON.parse(saved));
      }
    }
  }, [resumeSkills, location, user]);

  // Apply filters whenever jobs or filters change
  useEffect(() => {
    let filtered = [...jobs];

    // Filter by salary range
    if (filters.salaryRange) {
      filtered = filtered.filter(job => {
        if (!job.salary) return false;
        const salary = parseInt(job.salary.replace(/[^0-9]/g, '') || '0');
        
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
    try {
      const savedJobIds = await localStorageMigration.getSavedRecommendedJobs();
      setSavedJobs(savedJobIds);
    } catch (error) {
      console.error('Error loading saved jobs from backend:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem('savedRecommendedJobs');
      if (saved) {
        setSavedJobs(JSON.parse(saved));
      }
    }
  };

  const handleSaveJob = async (jobId: string) => {
    const isAlreadySaved = savedJobs.includes(jobId);
    
    if (user?.email) {
      // Use backend API for logged-in users
      try {
        if (isAlreadySaved) {
          const success = await localStorageMigration.removeSavedRecommendedJob(jobId);
          if (success) {
            setSavedJobs(prev => prev.filter(id => id !== jobId));
          }
        } else {
          const job = jobs.find(j => j._id === jobId);
          if (job) {
            const success = await localStorageMigration.saveRecommendedJob(job);
            if (success) {
              setSavedJobs(prev => [...prev, jobId]);
            }
          }
        }
      } catch (error) {
        console.error('Error saving job to backend:', error);
        // Fallback to localStorage
        handleLocalStorageSave(jobId, isAlreadySaved);
      }
    } else {
      // Use localStorage for non-logged users
      handleLocalStorageSave(jobId, isAlreadySaved);
    }
  };

  const handleLocalStorageSave = (jobId: string, isAlreadySaved: boolean) => {
    const updatedSavedJobs = isAlreadySaved
      ? savedJobs.filter(id => id !== jobId)
      : [...savedJobs, jobId];
    
    setSavedJobs(updatedSavedJobs);
    localStorage.setItem('savedRecommendedJobs', JSON.stringify(updatedSavedJobs));
  };

  const handleApplyNow = (job: any) => {
    // Store job data for application page
    localStorage.setItem('selectedJob', JSON.stringify(job));
    console.log('Applying for job:', job.title);
    alert(`Redirecting to application for ${job.title}...`);
  };

  const fetchMatchingJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // If resume skills exist, fetch skill-based recommendations
      if (resumeSkills && resumeSkills.length > 0) {
        const skillNames = resumeSkills.map(s => s.skill.toLowerCase()).filter(s => s);
        
        if (skillNames.length === 0) {
          fetchAllRecentJobs();
          return;
        }
        
        const skillQuery = skillNames.join(',');
        const locationQuery = location ? `&location=${encodeURIComponent(location)}` : '';
        
        console.log('🔍 Fetching recommended jobs with skills:', skillQuery);
        
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/jobs?skills=${encodeURIComponent(skillQuery)}${locationQuery}`);
        
        if (response.ok) {
          const allJobs = await response.json();
          
          if (!Array.isArray(allJobs)) {
            fetchAllRecentJobs();
            return;
          }
          
          // Calculate match percentage for each job
          const jobsWithMatch = allJobs.map((job: Job) => {
            const jobSkills = (job.skills || []).map(s => s.toLowerCase());
            const matchingSkills = skillNames.filter(skill => 
              jobSkills.some(jobSkill => jobSkill.includes(skill) || skill.includes(jobSkill))
            );
            const matchPercentage = skillNames.length > 0 
              ? Math.round((matchingSkills.length / skillNames.length) * 100)
              : 0;
            
            return {
              ...job,
              matchPercentage,
              matchingSkills
            };
          });
          
          // Sort by match percentage and take top 5
          const sortedJobs = jobsWithMatch
            .filter((job: any) => job.matchPercentage > 0)
            .sort((a: any, b: any) => b.matchPercentage - a.matchPercentage)
            .slice(0, 5);
          
          console.log('✅ Recommended jobs found:', sortedJobs.length);
          
          if (sortedJobs.length > 0) {
            setJobs(sortedJobs);
          } else {
            // If no skill matches, show recent jobs
            fetchAllRecentJobs();
          }
        } else {
          console.error('Failed to fetch jobs:', response.status);
          fetchAllRecentJobs();
        }
      } else {
        // No resume skills, fetch all recent jobs
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
      console.log('📋 Fetching all recent jobs...');
      
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/jobs?limit=10&sort=-createdAt`);
      
      if (response.ok) {
        const allJobs = await response.json();
        const jobsArray = Array.isArray(allJobs) ? allJobs : [];
        
        console.log('✅ Recent jobs found:', jobsArray.length);
        setJobs(jobsArray.slice(0, 5));
      } else {
        console.error('Failed to fetch recent jobs:', response.status);
        setError('Failed to load job recommendations');
        setJobs([]);
      }
    } catch (error) {
      console.error('Error fetching recent jobs:', error);
      setError('Error loading job recommendations');
      setJobs([]);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
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
      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Salary Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
            <select
              value={filters.salaryRange}
              onChange={(e) => setFilters(prev => ({ ...prev, salaryRange: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">All Salaries</option>
              <option value="0-50k">$0 - $50k</option>
              <option value="50k-100k">$50k - $100k</option>
              <option value="100k-150k">$100k - $150k</option>
              <option value="150k+">$150k+</option>
            </select>
          </div>

          {/* Job Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
            <select
              value={filters.jobType}
              onChange={(e) => setFilters(prev => ({ ...prev, jobType: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
              <option value="Remote">Remote</option>
            </select>
          </div>
        </div>
        
        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredJobs.length} of {jobs.length} jobs
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No jobs match your filters. Try adjusting them.</p>
          </div>
        ) : (
          filteredJobs.map((job: any) => (
            <div key={job._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-lg">{job.title || job.jobTitle}</h4>
                  <p className="text-blue-600 font-medium">{job.company}</p>
                  <p className="text-sm text-gray-500">{job.location}</p>
                </div>
                <div className="text-right">
                  {job.matchPercentage && (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      {job.matchPercentage}% Match
                    </span>
                  )}
                  {job.salary && (
                    <p className="text-sm text-gray-600 mt-2 font-semibold">{job.salary}</p>
                  )}
                </div>
              </div>
              
              {job.type && (
                <div className="mb-2">
                  <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                    {job.type}
                  </span>
                </div>
              )}
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{job.description}</p>
              
              {job.skills && job.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 mb-4">
                  {job.skills.slice(0, 4).map((skill: string, idx: number) => (
                    <span 
                      key={idx} 
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        job.matchingSkills?.includes(skill.toLowerCase()) 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {skill}
                    </span>
                  ))}
                  {job.skills.length > 4 && (
                    <span className="text-xs text-gray-500 px-2 py-1">+{job.skills.length - 4} more</span>
                  )}
                </div>
              )}
              
              <div className="mt-4 flex gap-2 flex-wrap">
                <button 
                  onClick={() => handleApplyNow(job)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors font-medium flex-1 min-w-[140px]"
                >
                  Apply Now
                </button>
                <button 
                  onClick={() => handleSaveJob(job._id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border-2 flex items-center gap-2 ${
                    savedJobs.includes(job._id)
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {savedJobs.includes(job._id) ? (
                    <>
                      <BookmarkCheck className="w-4 h-4" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecommendedJobs;
