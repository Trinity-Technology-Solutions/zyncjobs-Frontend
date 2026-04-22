import React, { useState, useEffect } from 'react';
import { ChevronRight, Briefcase, MapPin, IndianRupee, Bookmark, Clock, Search, Filter, RefreshCw } from 'lucide-react';
import { getId } from '../utils/getId';
import { decodeHtmlEntities, formatDate, formatSalary, formatJobDescription } from '../utils/textUtils';
import { getSafeCompanyLogo } from '../utils/logoUtils';
import { API_ENDPOINTS } from '../config/env';
import { tokenStorage } from '../utils/tokenStorage';
import BackButton from '../components/BackButton';
import EmptyState from '../components/EmptyState';


interface MyJobsPageProps {
  onNavigate: (page: string, data?: any) => void;
  user?: any;
  onLogout?: () => void;
}

const MyJobsPage: React.FC<MyJobsPageProps> = ({ onNavigate, user, onLogout }) => {
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string; show: boolean }>({ type: 'success', message: '', show: false });
  const [activeTab, setActiveTab] = useState(user?.type === 'employer' ? 'Posted Jobs' : 'Saved');
  const [refreshing, setRefreshing] = useState(false);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message, show: true });
    setTimeout(() => setNotification(n => ({ ...n, show: false })), 3000);
  };
  const [showExpiredJobs, setShowExpiredJobs] = useState(false);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [postedJobs, setPostedJobs] = useState<any[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<any[]>([]);
  const [employerApplications, setEmployerApplications] = useState<any[]>([]);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyLogos, setCompanyLogos] = useState<Record<string, string>>({});

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
        const name = (j.company || j.companyName || '').toLowerCase();
        const logo = j.companyLogo || j.logoUrl || '';
        if (name && logo && !map[name]) map[name] = logo;
      });
      setCompanyLogos(map);
    } catch {}
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreJobs, setHasMoreJobs] = useState(true);
  const jobsPerPage = 6;

  useEffect(() => {
    if (user?.type === 'candidate') {
      const userKey = `savedJobDetails_${user.name || 'user'}`;
      const savedJobDetails = localStorage.getItem(userKey);
      if (savedJobDetails) {
        const jobs = JSON.parse(savedJobDetails);
        setSavedJobs(jobs);
        fetchCompanyLogos(jobs);
      }
      fetchAppliedJobs();
    } else if (user?.type === 'employer') {
      fetchPostedJobs();
      fetchAllJobs();
      fetchEmployerApplications();
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (activeTab === 'Applied' && user?.type === 'candidate') {
      fetchAppliedJobs();
    }
  }, [activeTab]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTab === 'Applied' && user?.type === 'candidate') {
      interval = setInterval(() => {
        fetchAppliedJobs();
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, user]);

  const fetchPostedJobs = async (page = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      const token = tokenStorage.getAccess() || '';
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      // Use dedicated employer email endpoint — returns ALL jobs, no limit
      const email = encodeURIComponent(user?.email || '');
      const response = await fetch(`${API_ENDPOINTS.JOBS}/employer/email/${email}`, { headers });
      if (response.ok) {
        const jobs: any[] = await response.json();
        const sorted = jobs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPostedJobs(sorted);
        setHasMoreJobs(false); // all jobs loaded at once
      }
    } catch (error) {
      console.error('Error fetching posted jobs:', error);
    } finally {
      if (!append) setLoading(false);
    }
  };

  const fetchAllJobs = async () => {
    try {
      const jobsResponse = await fetch(API_ENDPOINTS.JOBS);
      if (jobsResponse.ok) {
        const jobs = await jobsResponse.json();
        setAllJobs(jobs);
        setFilteredJobs(jobs.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchAppliedJobs = async () => {
    const userEmail = user?.email;
    
    if (!userEmail) {
      console.warn('fetchAppliedJobs: no user email');
      return;
    }
    
    try {
      const token = tokenStorage.getAccess() || '';
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}/candidate/${encodeURIComponent(userEmail)}`, { headers });
      if (response.ok) {
        const applications = await response.json();
        setAppliedJobs(applications);
      } else {
        console.error('fetchAppliedJobs failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching applied jobs:', error);
    }
  };

  const fetchEmployerApplications = async () => {
    try {
      console.log('Fetching applications for employer:', user?.email);
      
      // First get all jobs posted by this employer
      const jobsResponse = await fetch(API_ENDPOINTS.JOBS);
      if (!jobsResponse.ok) {
        console.error('Failed to fetch jobs');
        return;
      }
      
      const allJobs = await jobsResponse.json();
      const employerJobs = allJobs.filter((job: any) => 
        job.postedBy === user?.email || job.employerEmail === user?.email
      );
      const employerJobIds = employerJobs.map((job: any) => getId(job));
      
      console.log('Employer jobs:', employerJobIds.length);
      
      if (employerJobIds.length === 0) {
        setEmployerApplications([]);
        return;
      }
      
      // Then get applications for those jobs
      const applicationsPromises = employerJobIds.map((jobId: any) => 
        fetch(`${API_ENDPOINTS.APPLICATIONS}/job/${jobId}`)
      );
      
      const applicationsResponses = await Promise.all(applicationsPromises);
      const allApplications = [];
      
      for (let i = 0; i < applicationsResponses.length; i++) {
        if (applicationsResponses[i].ok) {
          const jobApplications = await applicationsResponses[i].json();
          const job = employerJobs[i];
          allApplications.push(...jobApplications.map((app: any) => ({
            ...app,
            jobTitle: app.jobTitle || job?.jobTitle || job?.title || '',
            jobDescription: app.jobDescription || job?.jobDescription || job?.description || ''
          })));
        }
      }
      
      console.log('Total applications found:', allApplications.length);
      setEmployerApplications(allApplications);
      
    } catch (error) {
      console.error('Error fetching employer applications:', error);
      setEmployerApplications([]);
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}/${applicationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        setEmployerApplications(prev => 
          prev.map(app => 
            app._id === applicationId ? { ...app, status: newStatus } : app
          )
        );
      }
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const deleteJob = async (jobId: string) => {
    const ok = await (window as any).confirmAsync('Are you sure you want to delete this job posting?');
    if (!ok) return;
    
    try {
      const response = await fetch(`${API_ENDPOINTS.JOBS}/${jobId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setPostedJobs(prev => prev.filter(job => (job._id || job.id) !== jobId));
        showNotification('Job deleted successfully!');
        window.dispatchEvent(new CustomEvent('jobDeleted', { detail: { jobId } }));
      } else {
        showNotification('Failed to delete job. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      showNotification('Error deleting job. Please try again.', 'error');
    }
  };

  const handleRemoveSavedJob = (jobId: string) => {
    const updatedJobs = savedJobs.filter(job => (job._id || job.id) !== jobId);
    setSavedJobs(updatedJobs);
    
    const userKey = `savedJobDetails_${user?.name || 'user'}`;
    const userJobIdsKey = `savedJobs_${user?.name || 'user'}`;
    
    localStorage.setItem(userKey, JSON.stringify(updatedJobs));
    
    const savedJobIds = JSON.parse(localStorage.getItem(userJobIdsKey) || '[]');
    const updatedJobIds = savedJobIds.filter((id: string) => id !== jobId);
    localStorage.setItem(userJobIdsKey, JSON.stringify(updatedJobIds));
  };

  const handleSearch = () => {
    let filtered = allJobs;
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(job => 
        job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (locationQuery.trim()) {
      filtered = filtered.filter(job => 
        job.location?.toLowerCase().includes(locationQuery.toLowerCase())
      );
    }
    
    setFilteredJobs(filtered);
  };

  const handleSaveJob = (job: any) => {
    console.log('Save job:', job);
  };

  const handleLoadMorePostedJobs = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchPostedJobs(nextPage, true);
  };

  const renderJobCard = (job: any, showActions: boolean = true, actionType: string = 'default') => {
    const jobKey = getId(job) || `job-${Math.random()}`;
    return (
    <div key={jobKey} className="border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 transition-all bg-white relative overflow-hidden group">
      {/* Gradient accent bar - left corner only */}
      <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-l-xl"></div>
      
      <div className="flex items-start justify-between gap-4">
        {/* Left: Logo + Content */}
        <div className="flex gap-4 flex-1 min-w-0">
          {/* Company Logo */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center bg-white">
              <img
                src={companyLogos[(job.company || job.companyName || '').toLowerCase()] || getSafeCompanyLogo(job)}
                alt={`${job.company || job.companyName} logo`}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  const name = job.company || job.companyName || '';
                  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
                  img.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="#3B82F6" rx="6"/><text x="16" y="21" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">${initials}</text></svg>`)}`;
                }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Company name + Date */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-600 font-bold text-sm uppercase tracking-wide">{job.company}</span>
              <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                {formatDate(job.createdAt)}
              </span>
            </div>

            {/* Job Title */}
            <h3 className="text-lg font-bold text-gray-900 hover:text-blue-600 cursor-pointer mb-3 line-clamp-2">
              {job.jobTitle || job.title}
            </h3>
            
            {/* Tags row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-md">
                <MapPin className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-xs font-medium text-gray-700">{job.location}</span>
              </div>
              {formatSalary(job.salary) && (
                <div className="flex items-center gap-1 bg-green-50 px-2.5 py-1 rounded-md">
                  <IndianRupee className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs font-semibold text-green-700">{formatSalary(job.salary)}</span>
                </div>
              )}
              <div className="flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-md">
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">{job.type}</span>
              </div>
              {job.positionId && actionType === 'posted' && (
                <div className="flex items-center gap-1 bg-purple-50 px-2.5 py-1 rounded-md">
                  <span className="text-xs font-semibold text-purple-600">PID: {job.positionId}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {(job.jobDescription || job.description) && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border-l-3 border-blue-500">
                <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">
                  {(() => {
                    const desc = job.jobDescription || job.description || '';
                    const plain = formatJobDescription(desc);
                    return plain.length > 150 ? `${plain.substring(0, 150)}...` : plain;
                  })()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Action Buttons */}
        {showActions && (
          <div className="flex flex-col gap-2 flex-shrink-0">
            {actionType === 'posted' && (
              <>
                <button 
                  onClick={() => {
                    const jobId = getId(job);
                    if (jobId) {
                      onNavigate('job-detail', { jobId, jobData: job });
                    }
                  }}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg text-sm"
                >
                  View Job
                </button>
                <button 
                  onClick={() => deleteJob(getId(job))}
                  className="bg-red-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-red-700 transition-all shadow-md hover:shadow-lg text-sm"
                >
                  Delete Job
                </button>
              </>
            )}
            {actionType === 'saved' && (
              <>
                <button 
                  onClick={() => handleRemoveSavedJob(getId(job))}
                  className="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-all text-sm font-medium"
                >
                  Remove
                </button>
                <button 
                  onClick={() => {
                    localStorage.setItem('selectedJob', JSON.stringify(job));
                    onNavigate('job-application');
                  }}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md text-sm"
                >
                  Apply Now
                </button>
              </>
            )}
            {actionType === 'default' && (
              <button 
                onClick={() => onNavigate('job-detail', { jobId: getId(job) })}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md text-sm"
              >
                View Job
              </button>
            )}
          </div>
        )}
      </div>
    </div>
    );
  };

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #f0f4ff 0%, #f8f0ff 50%, #fff0f6 100%)'}}>
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {notification.message}
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm px-6 lg:px-8 py-8">
          <BackButton onClick={() => window.history.back()} text="Back" className="mb-6" />

          <div className="flex items-center justify-between mb-8">
            <div className="flex space-x-1">
              {user?.type === 'employer' ? (
                <>
                  <button
                    onClick={() => setActiveTab('Posted Jobs')}
                    className={`px-6 py-2 rounded-full font-medium transition-colors ${
                      activeTab === 'Posted Jobs'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Posted Jobs
                  </button>
                  <button
                    onClick={() => setActiveTab('Applications')}
                    className={`px-6 py-2 rounded-full font-medium transition-colors ${
                      activeTab === 'Applications'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Applications ({employerApplications.length})
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveTab('Saved')}
                    className={`px-6 py-2 rounded-full font-medium transition-colors ${
                      activeTab === 'Saved'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Saved
                  </button>
                  <button
                    onClick={() => setActiveTab('Applied')}
                    className={`px-6 py-2 rounded-full font-medium transition-colors ${
                      activeTab === 'Applied'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Applied
                  </button>
                </>
              )}
            </div>
            
            {user?.type === 'candidate' && (
              <button
                onClick={() => onNavigate('job-listings', { tab: 'recommended' })}
                className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 font-medium"
              >
                <span>View Recommended Jobs</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {user?.type === 'employer' && (activeTab === 'Search Jobs') && (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <div className="flex flex-col lg:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Job title, skill, company, keyword"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Location (ex. Denver, remote)"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
                  title="Search jobs"
                  aria-label="Search jobs"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                  <Filter className="w-4 h-4" />
                  <span>All filters</span>
                </button>
                <p className="text-gray-600 text-sm">
                  {filteredJobs.length} results (0 new)
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              {activeTab} {activeTab === 'Applications' ? '' : ''}
            </h2>
              
            {activeTab === 'Applied' && (
              <button
                onClick={async () => {
                  setRefreshing(true);
                  await fetchAppliedJobs();
                  setRefreshing(false);
                }}
                className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                title="Refresh applications"
                aria-label="Refresh applications"
                disabled={refreshing}
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
            
            {activeTab === 'Saved' && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">Show expired jobs</span>
                <button
                  onClick={() => setShowExpiredJobs(!showExpiredJobs)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showExpiredJobs ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  aria-label="Toggle show expired jobs"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showExpiredJobs ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  ></span>
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {user?.type === 'employer' && activeTab === 'Posted Jobs' && (
                <>
                  {postedJobs.length > 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {postedJobs.map((job) => {
                        const k = getId(job) || `posted-${Math.random()}`;
                        return <React.Fragment key={k}>{renderJobCard(job, true, 'posted')}</React.Fragment>;
                      })}
                      {hasMoreJobs && (
                        <div className="text-center py-6">
                          <button
                            onClick={handleLoadMorePostedJobs}
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                          >
                            Load More Jobs
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Briefcase className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Posted Jobs Yet</h3>
                      <p className="text-gray-500 mb-6">
                        Start posting jobs to attract top talent to your company.
                      </p>
                      <button
                        onClick={() => onNavigate('job-posting-selection')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium flex items-center space-x-2 mx-auto transition-colors"
                      >
                        <span>Post Your First Job</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}

              {user?.type === 'employer' && activeTab === 'Applications' && (
                <div className="space-y-4">
                  {employerApplications.length > 0 ? (
                    employerApplications.map((application) => (
                      <div key={application._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-gray-300 transition-all bg-white">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex-1">
                            <div className="flex items-start mb-4">
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="text-xl font-bold text-gray-900">
                                    {application.candidateName || application.candidateEmail || 'Candidate'}
                                  </h3>
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    application.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                                    application.status === 'reviewed' ? 'bg-yellow-100 text-yellow-800' :
                                    application.status === 'shortlisted' ? 'bg-green-100 text-green-800' :
                                    application.status === 'interviewed' ? 'bg-purple-100 text-purple-800' :
                                    application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    application.status === 'hired' ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {application.status === 'pending' ? 'Applied' : application.status ? application.status.charAt(0).toUpperCase() + application.status.slice(1) : 'Applied'}
                                  </span>
                                </div>
                                {application.jobTitle && (
                                  <p className="text-base text-blue-700 font-semibold flex items-center gap-1 mb-2">
                                    <span>💼</span>
                                    {application.jobTitle}
                                  </p>
                                )}
                                <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-lg inline-flex">
                                  <span>📅</span>
                                  <span className="text-sm font-medium text-gray-700">
                                    Applied on: {formatDate(application.createdAt || application.appliedAt)}
                                  </span>
                                </div>
                                {application.jobDescription && (
                                  <div className="mt-3 bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                      <span className="font-semibold text-blue-900">Job Description: </span>
                                      {(application.jobDescription.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*\*([^*]+)\*/g, '$1')).length > 200 ? `${application.jobDescription.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*\*([^*]+)\*/g, '$1').substring(0, 200)}...` : application.jobDescription.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*\*([^*]+)\*/g, '$1')}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 lg:mt-0 lg:ml-6">
                            <button 
                              onClick={() => { const jobId = application.jobId ? (typeof application.jobId === 'string' ? application.jobId : (application.jobId?._id || application.jobId?.id)) : ''; if (jobId) sessionStorage.setItem('selectedJobId', jobId); sessionStorage.setItem('selectedJobTitle', application.jobTitle || application.jobId?.jobTitle || application.jobId?.title || 'Job Position'); onNavigate('application-management'); }}
                              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md min-w-[140px]"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16">
                      <Briefcase className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
                      <p className="text-gray-500 mb-6">
                        Applications will appear here when candidates apply to your jobs.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {user?.type === 'candidate' && activeTab === 'Saved' && (
                savedJobs.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {savedJobs.map((job) => {
                    const k = getId(job) || `saved-${Math.random()}`;
                    return <React.Fragment key={k}>{renderJobCard(job, true, 'saved')}</React.Fragment>;
                  })}
                  </div>
                ) : (
                  <EmptyState
                    title="Jobs saved by you"
                    description="No saved jobs! Tap on save icon against a job to save it"
                    buttonText="Search jobs"
                    onButtonClick={() => onNavigate('job-listings')}
                    icon="jobs"
                  />
                )
              )}

              {user?.type === 'candidate' && activeTab === 'Applied' && (
                appliedJobs.length > 0 ? (
                  <div className="space-y-4">
                    {appliedJobs.map((application) => (
                      <div key={application._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-gray-300 transition-all bg-white">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex-1">
                            <div className="mb-4">
                              {/* Company logo + name row */}
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center bg-white">
                                  <img
                                    src={companyLogos[(application.jobId?.company || application.jobId?.companyName || '').toLowerCase()] || getSafeCompanyLogo(application.jobId || {})}
                                    alt={`${application.jobId?.company || 'Company'} logo`}
                                    className="w-8 h-8 object-contain"
                                    onError={(e) => {
                                      const img = e.target as HTMLImageElement;
                                      const name = application.jobId?.company || application.jobId?.companyName || '';
                                      const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || 'C';
                                      img.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="#3B82F6" rx="6"/><text x="16" y="21" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">${initials}</text></svg>`)}`;
                                    }}
                                  />
                                </div>
                                <span className="text-blue-600 font-semibold text-base">{application.jobId?.company || application.jobId?.companyName}</span>
                              </div>

                              {/* Job title + status */}
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer">
                                  {application.jobTitle || application.jobId?.jobTitle || application.jobId?.title || application.jobId?.company || 'Application'}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ml-3 flex-shrink-0 ${
                                  application.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                                  application.status === 'reviewed' ? 'bg-yellow-100 text-yellow-800' :
                                  application.status === 'shortlisted' ? 'bg-green-100 text-green-800' :
                                  application.status === 'interviewed' ? 'bg-purple-100 text-purple-800' :
                                  application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  application.status === 'hired' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {application.status === 'pending' ? 'Applied' : application.status ? application.status.charAt(0).toUpperCase() + application.status.slice(1) : 'Applied'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-lg inline-flex mb-3">
                                <span>📅</span>
                                <span className="text-sm font-medium text-gray-700">
                                  Applied on: {formatDate(application.createdAt || application.appliedAt)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-lg">
                                <MapPin className="w-4 h-4 text-gray-600" />
                                <span className="text-sm font-medium text-gray-700">{application.jobId?.location || 'Remote'}</span>
                              </div>
                              {formatSalary(application.jobId?.salary) && (
                                <div className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-lg">
                                  <IndianRupee className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-semibold text-green-700">{formatSalary(application.jobId?.salary)}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-lg">
                                <Briefcase className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-700">{application.jobId?.type || 'Full-time'}</span>
                              </div>
                            </div>

                            {application.jobId?.jobDescription && (
                              <div className="mb-3 bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  <span className="font-semibold text-blue-900">Job Description: </span>
                                  {(application.jobId.jobDescription.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*\*([^*]+)\*/g, '$1')).length > 200 ? `${application.jobId.jobDescription.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*\*([^*]+)\*/g, '$1').substring(0, 200)}...` : application.jobId.jobDescription.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*\*([^*]+)\*/g, '$1')}
                                </p>
                              </div>
                            )}

                            {application.coverLetter && application.coverLetter !== 'No cover letter' && (
                              <div className="mb-4 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                                <h4 className="font-semibold text-blue-900 mb-2 text-sm">Your Cover Letter:</h4>
                                <p className="text-gray-700 text-sm leading-relaxed">
                                  {application.coverLetter.length > 150 
                                    ? `${application.coverLetter.substring(0, 150)}...` 
                                    : application.coverLetter}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col space-y-2">
                            <button 
                              onClick={() => {
                                const jobId = application.jobId
                                  ? (typeof application.jobId === 'string' ? application.jobId : (application.jobId?._id || application.jobId?.id))
                                  : (application.jobObjectId || application.jobRef);
                                if (jobId) {
                                  onNavigate('job-detail', { jobId });
                                } else {
                                  showNotification('Job details are no longer available.', 'error');
                                }
                              }}
                              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md min-w-[140px]"
                            >
                              View Job
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No applications yet"
                    description="Start applying to jobs to see your applications here"
                    buttonText="Search jobs"
                    onButtonClick={() => onNavigate('job-listings')}
                    icon="applications"
                  />
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyJobsPage;
