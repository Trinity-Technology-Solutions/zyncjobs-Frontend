import React, { useState, useEffect } from 'react';
import { ChevronRight, Briefcase, MapPin, DollarSign, Bookmark, Clock, Search, Filter } from 'lucide-react';
import { decodeHtmlEntities, formatDate, formatSalary, formatJobDescription } from '../utils/textUtils';
import { getCompanyLogo } from '../utils/logoUtils';
import { API_ENDPOINTS } from '../config/env';
import BackButton from '../components/BackButton';

interface MyJobsPageProps {
  onNavigate: (page: string, data?: any) => void;
  user?: any;
  onLogout?: () => void;
}

const MyJobsPage: React.FC<MyJobsPageProps> = ({ onNavigate, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState(user?.type === 'employer' ? 'Posted Jobs' : 'Saved');
  const [showExpiredJobs, setShowExpiredJobs] = useState(false);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [postedJobs, setPostedJobs] = useState<any[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<any[]>([]);
  const [employerApplications, setEmployerApplications] = useState<any[]>([]);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyLogos, setCompanyLogos] = useState<{ [key: string]: string }>({});
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
        setSavedJobs(JSON.parse(savedJobDetails));
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
      
      const response = await fetch(`${API_ENDPOINTS.JOBS}?page=${page}&limit=${jobsPerPage}`);
      if (response.ok) {
        const allJobs = await response.json();
        const employerJobs = allJobs.filter((job: any) => 
          job.postedBy === user?.email
        ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        console.log('Filtering jobs for user:', user?.email, 'Found:', employerJobs.length);
        
        if (append) {
          setPostedJobs(prev => [...prev, ...employerJobs]);
        } else {
          setPostedJobs(employerJobs);
        }
        
        setHasMoreJobs(employerJobs.length === jobsPerPage);
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
    
    if (!userEmail) return;
    
    try {
      const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}/candidate/${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const applications = await response.json();
        setAppliedJobs(applications);
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
      const employerJobs = allJobs.filter((job: any) => job.postedBy === user?.email);
      const employerJobIds = employerJobs.map((job: any) => job._id);
      
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
      
      for (const response of applicationsResponses) {
        if (response.ok) {
          const jobApplications = await response.json();
          allApplications.push(...jobApplications);
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
    if (!confirm('Are you sure you want to delete this job posting?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_ENDPOINTS.JOBS}/${jobId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setPostedJobs(prev => prev.filter(job => (job._id || job.id) !== jobId));
        alert('Job deleted successfully!');
      } else {
        alert('Failed to delete job. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Error deleting job. Please try again.');
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

  const renderJobCard = (job: any, showActions: boolean = true, actionType: string = 'default') => (
    <div key={job._id || job.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <div className="flex items-start mb-4">
            <div className="flex-shrink-0 w-12 h-12 mr-4">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center p-2">
                <img 
                  src={getCompanyLogo(job.company)}
                  alt={`${job.company} logo`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/zync-logo.svg';
                  }}
                />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                  {job.jobTitle || job.title}
                </h3>
                <span className="text-sm text-gray-500 ml-4">
                  {formatDate(job.createdAt)}
                </span>
              </div>
              <p className="text-lg text-blue-600 font-medium mb-2">{job.company}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4" />
              <span>{formatSalary(job.salary)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Briefcase className="w-4 h-4" />
              <span>{job.type}</span>
            </div>
          </div>

          <p className="text-gray-600 mb-4">
            {job.description && job.description.length > 150 
              ? `${formatJobDescription(job.description.substring(0, 150), typeof job.salary === 'object' ? job.salary.currency : undefined)}...` 
              : formatJobDescription(job.description || '', typeof job.salary === 'object' ? job.salary.currency : undefined)}
          </p>
        </div>

        {showActions && (
          <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-3">
            {actionType === 'posted' && (
              <>
                <button 
                  onClick={() => onNavigate('job-detail', { jobId: job._id || job.id, jobData: job })}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors min-w-[120px]"
                >
                  View Job
                </button>
                <button 
                  onClick={() => deleteJob(job._id || job.id)}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors min-w-[120px]"
                >
                  Delete Job
                </button>
              </>
            )}
            {actionType === 'saved' && (
              <>
                <button 
                  onClick={() => handleRemoveSavedJob(job._id || job.id)}
                  className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors min-w-[100px]"
                >
                  <span>Remove</span>
                </button>
                <button 
                  onClick={() => {
                    localStorage.setItem('selectedJob', JSON.stringify(job));
                    onNavigate('job-application');
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors min-w-[120px]"
                >
                  Apply Now
                </button>
              </>
            )}
            {actionType === 'default' && (
              <button 
                onClick={() => onNavigate('job-detail', { jobId: job._id || job.id })}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors min-w-[120px]"
              >
                View Job
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <BackButton 
              onClick={() => onNavigate('dashboard')}
              text="Back to Dashboard"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
            />
          </div>
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
                onClick={() => onNavigate('job-listings')}
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
                onClick={() => fetchAppliedJobs()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
              >
                Refresh
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
                    <div className="space-y-4">
                      {postedJobs.map((job) => renderJobCard(job, true, 'posted'))}
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
                      <div key={application._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex-1">
                            <div className="flex items-start mb-4">
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="text-xl font-semibold text-gray-900">
                                    {application.candidateName || application.candidateEmail || 'Candidate'}
                                  </h3>
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                    application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {application.status || 'pending'}
                                  </span>
                                </div>
                                <p className="text-lg text-blue-600 font-medium mb-2">{application.jobTitle || 'Job Position'}</p>
                                <p className="text-sm text-gray-500">
                                  Applied on: {formatDate(application.createdAt || application.appliedAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 lg:mt-0 lg:ml-6">
                            <button 
                              onClick={() => onNavigate('candidate-response-detail', { application })}
                              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
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

              {user?.type === 'candidate' && activeTab === 'Saved' && savedJobs.length > 0 && (
                <div className="space-y-4">
                  {savedJobs.map((job) => renderJobCard(job, true, 'saved'))}
                </div>
              )}

              {user?.type === 'candidate' && activeTab === 'Applied' && appliedJobs.length > 0 && (
                <div className="space-y-4">
                  {appliedJobs.map((application) => (
                    <div key={application._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                          <div className="flex items-start mb-4">
                            <div className="flex-shrink-0 w-12 h-12 mr-4">
                              <div className="w-12 h-12 rounded border border-gray-200 flex items-center justify-center bg-white">
                                <img 
                                  src={getCompanyLogo(application.jobId?.company || '')}
                                  alt={`${application.jobId?.company || 'Company'} logo`}
                                  className="w-10 h-10 object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/images/zync-logo.svg';
                                  }}
                                />
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                                  {application.jobTitle || application.jobId?.jobTitle || application.jobId?.title || 'Job Position'}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                  application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {application.status || 'pending'}
                                </span>
                              </div>
                              <p className="text-lg text-blue-600 font-medium mb-2">{application.jobId?.company}</p>
                              <p className="text-sm text-gray-500">
                                Applied on: {formatDate(application.createdAt || application.appliedAt)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{application.jobId?.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4" />
                              <span>{formatSalary(application.jobId?.salary)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Briefcase className="w-4 h-4" />
                              <span>{application.jobId?.type}</span>
                            </div>
                          </div>

                          {application.coverLetter && (
                            <div className="mb-4">
                              <h4 className="font-medium text-gray-900 mb-2">Your Cover Letter:</h4>
                              <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">
                                {application.coverLetter.length > 150 
                                  ? `${application.coverLetter.substring(0, 150)}...` 
                                  : application.coverLetter}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-3">
                          <button 
                            onClick={() => onNavigate('job-detail', { jobId: application.jobId?._id || application.jobId })}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors min-w-[120px]"
                          >
                            View Job
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {((user?.type === 'candidate' && activeTab === 'Saved' && savedJobs.length === 0) ||
                (user?.type === 'candidate' && activeTab === 'Applied' && appliedJobs.length === 0) ||
                (user?.type === 'employer' && activeTab === 'Posted Jobs' && postedJobs.length === 0) ||
                (user?.type === 'employer' && activeTab === 'Applications' && employerApplications.length === 0)) && (
                <div></div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyJobsPage;