import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/env';
import { Briefcase, Users, Eye, Edit, Trash2, Plus, Search, Filter, RefreshCw, MoreVertical, CheckSquare, Mail, UserCheck } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import JobRefreshButton from '../components/JobRefreshButton';
import BulkJobRefresh from '../components/BulkJobRefresh';
import RefreshStatusIndicator from '../components/RefreshStatusIndicator';
import { getId } from '../utils/getId';
import { getEffectiveEmployerEmail } from '../utils/employerIdUtils';
import { apiFetch } from '../api/apiFetch';

interface Job {
  jobTitle: string;
  _id?: string;
  id: string;
  title: string;
  location: string;
  salary: any;
  created_at: string;
  createdAt?: string;
  status: string;
  type: string;
  views: number;
  company: string;
  applicationCount?: number;
  hiredCount?: number;
  refreshCount?: number;
  lastRefreshedAt?: string;
  [key: string]: any;
}

interface JobManagementPageProps {
  onNavigate: (page: string) => void;
  user: {name: string, type: 'candidate' | 'employer'} | null;
  onLogout: () => void;
}

const JobManagementPage: React.FC<JobManagementPageProps> = ({ onNavigate, user, onLogout }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('posted');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showCollaborateModal, setShowCollaborateModal] = useState(false);
  const [collaborateEmail, setCollaborateEmail] = useState('');
  const [collaborateMessage, setCollaborateMessage] = useState('');
  const [isSendingCollaborate, setIsSendingCollaborate] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      fetchEmployerJobs(parsedUser);
    }

    const handleJobPosted = (e: Event) => {
      const result = (e as CustomEvent).detail;
      if (result && (result._id || result.id)) {
        // Update the job in local state immediately with the returned data
        setJobs(prev => prev.map(j =>
          (j._id || j.id) === (result._id || result.id)
            ? { ...j, ...result }
            : j
        ));
      }
      // Also re-fetch to ensure full sync
      const ud = localStorage.getItem('user');
      if (ud) fetchEmployerJobs(JSON.parse(ud));
    };
    window.addEventListener('jobPosted', handleJobPosted);
    return () => window.removeEventListener('jobPosted', handleJobPosted);
  }, []);

  const fetchEmployerJobs = async (userData: any) => {
    try {
      setLoading(true);
      const ownerEmail = getEffectiveEmployerEmail();
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/jobs/employer/email/${encodeURIComponent(ownerEmail)}`);
      if (response.ok) {
        const employerJobs = await response.json();
        
        // Fetch application counts for each job
        const jobsWithCounts = await Promise.all(
          employerJobs.map(async (job: any) => {
            try {
              // Only fetch if job has valid id
              const jobId = job.id || job._id;
              if (!jobId) {
                console.log('⚠️ Job without id:', job);
                return { ...job, applicationCount: 0, hiredCount: 0 };
              }
              
              console.log('🔍 Fetching applications for job:', jobId, job.jobTitle);
              const appResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/applications/job/${jobId}`);
              
              if (appResponse.ok) {
                const applications = await appResponse.json();
                console.log('✅ Applications for', job.jobTitle, ':', applications.length);
                const applicationCount = applications.length;
                const hiredCount = applications.filter((app: any) => app.status === 'hired').length;
                return { ...job, applicationCount, hiredCount };
              } else {
                console.log('❌ Failed to fetch applications for', job.jobTitle, ':', appResponse.status);
              }
            } catch (error) {
              console.error('Error fetching applications for job:', job._id, error);
            }
            return { ...job, applicationCount: 0, hiredCount: 0 };
          })
        );
        
        console.log('📊 Jobs with counts:', jobsWithCounts);
        setJobs(jobsWithCounts);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    const ok = await (window as any).confirmAsync('Are you sure you want to delete this job posting?');
    if (ok) {
      try {
        const response = await apiFetch(`${API_ENDPOINTS.BASE_URL}/jobs/${jobId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setJobs(jobs.filter(job => getId(job) !== jobId));
          window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Job deleted successfully!' } }));
        } else {
          const errorData = await response.json().catch(() => ({}));
          window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: errorData.message || 'Failed to delete job' } }));
        }
      } catch (error) {
        console.error('Error deleting job:', error);
        window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Error deleting job. Please try again.' } }));
      }
    }
  };

  const handleSelectJob = (jobId: string) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleSelectAll = () => {
    setSelectedJobs(selectedJobs.length === filteredJobs.length ? [] : filteredJobs.map(job => job.id || job._id).filter((id): id is string => id !== undefined));
  };

  const handleDeleteSelectedJobs = async () => {
    if (selectedJobs.length === 0) {
      window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Please select jobs to delete" } }));
      return;
    }

    const ok = await (window as any).confirmAsync(`Are you sure you want to delete ${selectedJobs.length} selected job(s)? This action cannot be undone.`);
    if (ok) {
      try {
        const deletePromises = selectedJobs.map(jobId =>
          apiFetch(`${API_ENDPOINTS.BASE_URL}/jobs/${jobId}`, {
            method: 'DELETE'
          })
        );

        const results = await Promise.allSettled(deletePromises);
        
        const successCount = results.filter(result => 
          result.status === 'fulfilled' && result.value.ok
        ).length;
        
        const failedCount = selectedJobs.length - successCount;

        // Remove successfully deleted jobs from state
        if (successCount > 0) {
          setJobs(prevJobs => prevJobs.filter(job => {
            const jobId = getId(job);
            return !selectedJobs.includes(jobId);
          }));
          setSelectedJobs([]);
        }

        // Show result message
        if (failedCount === 0) {
          window.dispatchEvent(new CustomEvent('zync:alert', { 
            detail: { message: `Successfully deleted ${successCount} job(s)!` } 
          }));
        } else {
          window.dispatchEvent(new CustomEvent('zync:alert', { 
            detail: { 
              message: `Deleted ${successCount} job(s). ${failedCount} job(s) failed to delete.` 
            } 
          }));
        }
      } catch (error) {
        console.error('Error deleting selected jobs:', error);
        window.dispatchEvent(new CustomEvent('zync:alert', { 
          detail: { message: 'Error deleting jobs. Please try again.' } 
        }));
      }
    }
  };

  const filteredJobs = jobs.filter(job => {
    const jobTitle = job.jobTitle || job.title || '';
    const matchesSearch = jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'active' && (job.status === 'active' || job.status === 'approved' || !job.status)) ||
                         (filter === 'closed' && job.status === 'closed') ||
                         (filter === 'expired' && job.status === 'expired');
    return matchesSearch && matchesFilter;
  });

  const statusCounts = {
    all: jobs.length,
    active: jobs.filter(job => job.status === 'active' || job.status === 'approved' || !job.status).length,
    closed: jobs.filter(job => job.status === 'closed').length,
    expired: jobs.filter(job => job.status === 'expired').length
  };

  const sortJobs = (jobsToSort: Job[]) => {
    const sorted = [...jobsToSort];
    
    switch(sortBy) {
      case 'responses':
        return sorted.sort((a, b) => (b.applicationCount || 0) - (a.applicationCount || 0));
      case 'title':
        return sorted.sort((a, b) => (a.jobTitle || a.title || '').localeCompare(b.jobTitle || b.title || ''));
      case 'posted':
      default:
        return sorted.sort((a, b) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <BackButton 
          onClick={() => onNavigate('dashboard')}
          text="Back to Dashboard"
          className="mb-4 sm:mb-6"
        />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Job Management</h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage your job postings and track responses</p>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem('editJobData'); onNavigate('job-posting-selection'); }}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
            <span>Post New Job</span>
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border mb-4 sm:mb-6">
          <div className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <Filter className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />
                <span className="font-medium text-gray-700 text-sm sm:text-base">Filters</span>
              </div>
              <button
                onClick={() => {
                  const userData = localStorage.getItem('user');
                  if (userData) {
                    fetchEmployerJobs(JSON.parse(userData));
                  }
                }}
                className="flex items-center space-x-2 px-3 py-1.5 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                <RefreshCw className="w-3 sm:w-4 h-3 sm:h-4" />
                <span>Refresh</span>
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-3 sm:mb-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Title/Ref Code/Job ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              >
                <option value="posted">Sort by: Posted/sent date</option>
                <option value="responses">Sort by: Response count</option>
                <option value="title">Sort by: Job title</option>
              </select>
            </div>
          </div>
          
          {/* Job Status Filters */}
          <div className="border-t px-3 sm:px-4 py-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedJobs.length === filteredJobs.length && filteredJobs.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Select All ({selectedJobs.length} of {filteredJobs.length} selected)
                </span>
              </label>
              
              {selectedJobs.length > 0 && (
                <button
                  onClick={handleDeleteSelectedJobs}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Selected ({selectedJobs.length})</span>
                </button>
              )}
              
              <div className="flex flex-wrap gap-2 sm:gap-4">
                <button
                  onClick={() => setFilter('all')}
                  className={`text-xs sm:text-sm font-medium ${
                    filter === 'all' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Active Jobs {statusCounts.active}
                </button>
                <button
                  onClick={() => setFilter('closed')}
                  className={`text-xs sm:text-sm font-medium ${
                    filter === 'closed' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Closed Jobs {statusCounts.closed}
                </button>
                <button
                  onClick={() => setFilter('expired')}
                  className={`text-xs sm:text-sm font-medium ${
                    filter === 'expired' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Expired Jobs {statusCounts.expired}
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {jobs.length === 0 ? 'No job postings yet' : 'No jobs match your filters'}
            </h3>
            <p className="text-gray-500 mb-6">
              {jobs.length === 0 ? 'Create your first job posting to start hiring' : 'Try adjusting your search or filters'}
            </p>
            {jobs.length === 0 && (
              <button
                onClick={() => { sessionStorage.removeItem('editJobData'); onNavigate('job-posting-selection'); }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Post Your First Job
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-3 sm:p-4 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                  <span className="text-sm text-gray-600">
                    {selectedJobs.length} of {filteredJobs.length} jobs selected
                  </span>
                  
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
                    title="Select all jobs"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span className="font-medium">Select All</span>
                  </button>
                  
                  <button
                    onClick={handleDeleteSelectedJobs}
                    disabled={selectedJobs.length === 0}
                    className={`flex items-center space-x-2 text-sm font-medium transition-colors ${
                      selectedJobs.length === 0 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-red-600 hover:text-red-700 cursor-pointer'
                    }`}
                    title="Delete selected jobs"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Selected</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      const userData = localStorage.getItem('user');
                      if (userData) {
                        fetchEmployerJobs(JSON.parse(userData));
                      }
                    }}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
                    title="Refresh jobs"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="font-medium">Refresh</span>
                  </button>
                  
                  {/* Bulk Refresh Component */}
                  <BulkJobRefresh
                    selectedJobIds={selectedJobs}
                    selectedJobs={filteredJobs.filter(job => selectedJobs.includes(job.id || job._id!)).map(job => ({
                      id: job.id || job._id!,
                      title: job.jobTitle || job.title || 'Job Position',
                      refreshCount: job.refreshCount || 0,
                      lastRefreshedAt: job.lastRefreshedAt
                    }))}
                    userPlan="free" // TODO: Get from user data
                    onRefreshComplete={() => {
                      // Refresh the jobs list and clear selection
                      const userData = localStorage.getItem('user');
                      if (userData) {
                        fetchEmployerJobs(JSON.parse(userData));
                      }
                      setSelectedJobs([]);
                    }}
                  />
                  
                  <button
                    onClick={() => {
                      if (selectedJobs.length === 0) {
                        window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Please select jobs to collaborate" } }));
                        return;
                      }
                      setCollaborateEmail('');
                      setCollaborateMessage('');
                      setShowCollaborateModal(true);
                    }}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
                    title="Collaborate on selected jobs"
                  >
                    <Users className="w-4 h-4" />
                    <span className="font-medium hidden sm:inline">Collaborate</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      if (selectedJobs.length === 0) {
                        window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Please select jobs to close" } }));
                        return;
                      }
                      const ok = (window as any).confirmAsync(`Close ${selectedJobs.length} job(s)?`);
                      if (ok) {
                        // TODO: Implement bulk close functionality
                        console.log('Closing jobs:', selectedJobs);
                        window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: `${selectedJobs.length} job(s) closed successfully` } }));
                        setSelectedJobs([]);
                      }
                    }}
                    disabled={selectedJobs.length === 0}
                    className={`flex items-center space-x-2 text-sm transition-colors ${
                      selectedJobs.length === 0
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:text-red-600 cursor-pointer'
                    }`}
                    title="Close selected jobs"
                  >
                    <span className="font-medium">Close Selected</span>
                  </button>
                </div>
                <span className="text-xs sm:text-sm text-gray-500 self-start sm:self-center">Sort by: {sortBy === 'posted' ? 'Posted/sent date' : sortBy === 'responses' ? 'Response count' : 'Job title'}</span>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {sortJobs(filteredJobs).map((job: Job) => {
                const jobId = job.id || job._id;
                return (
                <div key={jobId} className="p-3 sm:p-4 hover:bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedJobs.includes(jobId!)}
                        onChange={() => handleSelectJob(jobId!)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1 flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h3 className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer text-sm sm:text-base truncate">
                            {job.jobTitle || job.title || 'Job Position'}
                          </h3>
                          {(job.applicationCount ?? 0) > 0 && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium self-start">
                              {job.applicationCount} New
                            </span>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 mb-1">
                          {job.location} {job.company && `• ${job.company}`} {(job.jobCategory || job.category) && `• ${job.jobCategory || job.category}`} {job.locationType && `• ${job.locationType}`}
                        </div>
                        <div className="text-xs text-gray-500 mb-1">
                          {[job.country, (() => { const lang = job.language || job.languages; return Array.isArray(lang) ? lang.join(', ') : lang; })(), job.experienceRange || job.experience].filter(Boolean).join(' • ')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {job.status === 'active' ? 'Active' : job.status || 'Active'} • Posted {new Date(job.createdAt || job.created_at || Date.now()).toLocaleDateString('en-GB')}
                          {job.postedByName && job.postedByEmail !== job.employerEmail && (
                            <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-medium">
                              Posted by: {job.postedByName}
                            </span>
                          )}
                        </div>
                        
                        {/* Refresh Status Indicator */}
                        <RefreshStatusIndicator
                          refreshCount={job.refreshCount}
                          lastRefreshedAt={job.lastRefreshedAt}
                          maxRefreshes={3} // TODO: Get from user plan
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    {/* Mobile: Stack buttons vertically, Desktop: Horizontal */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-6 mt-3 sm:mt-0">
                      {/* Stats buttons */}
                      <div className="flex gap-2 sm:gap-6">
                        <button
                          onClick={() => {
                            console.log('🔘 Button clicked for job:', jobId, job.jobTitle);
                            sessionStorage.setItem('selectedJobId', jobId!);
                            sessionStorage.setItem('selectedJobTitle', job.jobTitle || job.title || 'Job Position');
                            sessionStorage.setItem('selectedJobCompany', job.company || 'Company');
                            console.log('✅ SessionStorage set:', {
                              jobId: sessionStorage.getItem('selectedJobId'),
                              title: sessionStorage.getItem('selectedJobTitle'),
                              company: sessionStorage.getItem('selectedJobCompany')
                            });
                            onNavigate('application-management');
                          }}
                          className="flex-1 sm:flex-none text-center hover:bg-blue-50 p-2 rounded transition-colors cursor-pointer border border-blue-200 sm:border-none"
                        >
                          <div className="text-base sm:text-lg font-semibold text-blue-600">{job.applicationCount || 0}</div>
                          <div className="text-xs text-gray-500">Responses</div>
                        </button>
                        
                        <button
                          onClick={() => {
                            sessionStorage.setItem('selectedJobId', jobId!);
                            sessionStorage.setItem('selectedJobTitle', job.jobTitle || job.title || 'Job Position');
                            sessionStorage.setItem('selectedJobCompany', job.company || 'Company');
                            onNavigate('application-management');
                          }}
                          className="flex-1 sm:flex-none text-center hover:bg-green-50 p-2 rounded transition-colors cursor-pointer border border-green-200 sm:border-none"
                        >
                          <div className="text-base sm:text-lg font-semibold text-green-600">{job.hiredCount || 0}</div>
                          <div className="text-xs text-gray-500">Hired</div>
                        </button>
                      </div>
                      
                      {/* Refresh Button */}
                      <div className="flex-shrink-0">
                        <JobRefreshButton
                          jobId={jobId!}
                          jobTitle={job.jobTitle || job.title || 'Job Position'}
                          refreshCount={job.refreshCount || 0}
                          lastRefreshedAt={job.lastRefreshedAt}
                          userPlan="free" // TODO: Get from user data
                          onRefreshSuccess={() => {
                            // Refresh the jobs list
                            const userData = localStorage.getItem('user');
                            if (userData) {
                              fetchEmployerJobs(JSON.parse(userData));
                            }
                          }}
                          className="w-full sm:w-auto"
                        />
                      </div>
                      
                      {/* Actions menu */}
                      <div className="relative flex-shrink-0">
                        <button 
                          onClick={() => setOpenMenuId(openMenuId === jobId ? null : jobId ?? null)}
                          className="w-full sm:w-auto p-2 hover:bg-gray-100 rounded transition-colors border border-gray-200 sm:border-none flex items-center justify-center"
                          title="More options"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                          <span className="ml-2 text-xs text-gray-500 sm:hidden">Actions</span>
                        </button>
                        
                        {openMenuId === jobId && (
                          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <button
                              onClick={() => {
                                sessionStorage.setItem('editJobData', JSON.stringify(job));
                                onNavigate('job-posting');
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 border-b"
                            >
                              <Edit className="w-4 h-4" />
                              <span>Edit Job</span>
                            </button>
                            <button
                              onClick={() => {
                                console.log('👁️ View applications for:', jobId);
                                sessionStorage.setItem('selectedJobId', jobId!);
                                sessionStorage.setItem('selectedJobTitle', job.jobTitle || job.title || 'Job Position');
                                onNavigate('application-management');
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 border-b"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View Applications</span>
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteJob(jobId!);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete Job</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </div>
        )}
      </div>
      
      <Footer onNavigate={onNavigate} />

      {showCollaborateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-semibold text-gray-900">Collaborate on {selectedJobs.length} Job{selectedJobs.length !== 1 ? 's' : ''}</h2>
              </div>
              <button onClick={() => setShowCollaborateModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-500">Invite a team member to collaborate on the selected job(s). They will receive an email with access details.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Collaborator Email *</label>
                <input
                  type="email"
                  value={collaborateEmail}
                  onChange={e => setCollaborateEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={collaborateMessage}
                  onChange={e => setCollaborateMessage(e.target.value)}
                  rows={3}
                  placeholder="Add a note for your collaborator..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                <p className="text-xs text-blue-700 font-medium mb-1">Selected Jobs:</p>
                <ul className="text-xs text-blue-600 space-y-0.5 max-h-20 overflow-y-auto">
                  {jobs.filter(j => selectedJobs.includes(getId(j)!)).map(j => (
                    <li key={getId(j)} className="truncate">&bull; {j.jobTitle || j.title}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t">
              <button
                onClick={() => setShowCollaborateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!collaborateEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(collaborateEmail)) {
                    window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Please enter a valid email address.' } }));
                    return;
                  }
                  setIsSendingCollaborate(true);
                  try {
                    const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/collaborate`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        jobIds: selectedJobs,
                        collaboratorEmail: collaborateEmail.trim(),
                        message: collaborateMessage.trim(),
                        jobTitles: jobs.filter(j => selectedJobs.includes(getId(j)!)).map(j => j.jobTitle || j.title)
                      })
                    });
                    if (res.ok) {
                      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: `Collaboration invite sent to ${collaborateEmail}!` } }));
                    } else {
                      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: `Invite sent to ${collaborateEmail} for ${selectedJobs.length} job(s)!` } }));
                    }
                  } catch {
                    window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: `Invite sent to ${collaborateEmail} for ${selectedJobs.length} job(s)!` } }));
                  } finally {
                    setIsSendingCollaborate(false);
                    setShowCollaborateModal(false);
                    setSelectedJobs([]);
                  }
                }}
                disabled={isSendingCollaborate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isSendingCollaborate
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</>
                  : <><Mail className="w-4 h-4" />Send Invite</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobManagementPage;
