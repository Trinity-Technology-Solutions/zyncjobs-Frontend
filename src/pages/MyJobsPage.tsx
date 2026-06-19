import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Briefcase, MapPin, IndianRupee, Bookmark, Clock, Search, Filter, RefreshCw } from 'lucide-react';
import { getId } from '../utils/getId';
import { decodeHtmlEntities, formatDate, formatSalary, formatJobDescription } from '../utils/textUtils';
import { getSafeCompanyLogo } from '../utils/logoUtils';
import { API_ENDPOINTS } from '../config/env';
import { apiFetch } from '../api/apiFetch';
import BackButton from '../components/BackButton';
import EmptyState from '../components/EmptyState';
import JobRefreshButton from '../components/JobRefreshButton';
import BulkJobRefresh from '../components/BulkJobRefresh';
import ConfirmDialog from '../components/ConfirmDialog';
import { getEffectiveEmployerEmail } from '../utils/employerIdUtils';


interface MyJobsPageProps {
  onNavigate: (page: string, data?: any) => void;
  user?: any;
  onLogout?: () => void;
}

const MyJobsPage: React.FC<MyJobsPageProps> = ({ onNavigate, user, onLogout }) => {
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string; show: boolean }>({ type: 'success', message: '', show: false });
  const [activeTab, setActiveTab] = useState(user?.type === 'employer' ? 'Posted Jobs' : 'Saved');
  const [assignedJobs, setAssignedJobs] = useState<any[]>([]);
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
  const [postedJobsCurrentPage, setPostedJobsCurrentPage] = useState(1);
  const [appsCurrentPage, setAppsCurrentPage] = useState(1);
  const [postedJobsPerPage, setPostedJobsPerPage] = useState(5);
  const [appsPerPage, setAppsPerPage] = useState(5);
  const [assignedJobsCurrentPage, setAssignedJobsCurrentPage] = useState(1);
  const [assignedJobsPerPage, setAssignedJobsPerPage] = useState(5);
  const [companyLogos, setCompanyLogos] = useState<Record<string, string>>({});
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  useEffect(() => {
    setPostedJobsCurrentPage(1);
    setAppsCurrentPage(1);
    setAssignedJobsCurrentPage(1);
  }, [activeTab]);

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
    } catch { }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreJobs, setHasMoreJobs] = useState(true);
  const jobsPerPage = 6;

  useEffect(() => {
    if (user?.type === 'candidate') {
      loadSavedJobs();
      fetchAppliedJobs();
    } else if (user?.type === 'employer') {
      fetchPostedJobs();
      fetchAllJobs();
      fetchEmployerApplications();
      fetchAssignedJobs();
    }
    setLoading(false);

    // Listen for saved jobs updates from other components
    const handleSavedJobsUpdate = () => {
      console.log('Received saved jobs update event');
      if (user?.type === 'candidate') {
        loadSavedJobs();
      }
    };

    window.addEventListener('zync:savedJobsUpdated', handleSavedJobsUpdate);

    return () => {
      window.removeEventListener('zync:savedJobsUpdated', handleSavedJobsUpdate);
    };
  }, [user]);

  const loadSavedJobs = () => {
    // Get user email from localStorage user object for consistency
    const userData = (() => { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}'); } catch { return {}; } })();
    const userKey = userData?.email || user?.name || 'user';
    const detailsKey = `savedJobDetails_${userKey}`;
    const idsKey = `savedJobs_${userKey}`;

    try {
      const savedDetails = localStorage.getItem(detailsKey);
      if (savedDetails) {
        const jobs = JSON.parse(savedDetails);
        if (Array.isArray(jobs) && jobs.length > 0) {
          const seen = new Set<string>();
          const unique = jobs.filter((j: any) => {
            const id = j._id || j.id;
            if (!id || seen.has(id)) return false;
            seen.add(id);
            return true;
          });
          setSavedJobs(unique);
          if (unique.length > 0) fetchCompanyLogos(unique);
          return;
        }
      }
      // Fallback: load from IDs and fetch full details
      const savedIds = localStorage.getItem(idsKey);
      if (savedIds) {
        const ids = JSON.parse(savedIds);
        if (Array.isArray(ids) && ids.length > 0) {
          fetchJobDetailsByIds(ids);
        }
      }
    } catch (error) {
      console.error('Error loading saved jobs:', error);
    }
  };

  const fetchJobDetailsByIds = async (jobIds: string[]) => {
    console.log('Fetching job details for IDs:', jobIds);
    try {
      const jobPromises = jobIds.map(async (id) => {
        try {
          const response = await fetch(`${API_ENDPOINTS.JOBS}/${id}`);
          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          console.error(`Error fetching job ${id}:`, error);
        }
        return null;
      });

      const jobs = (await Promise.all(jobPromises)).filter(Boolean);
      console.log('Fetched job details:', jobs.length);

      if (jobs.length > 0) {
        setSavedJobs(jobs);
        fetchCompanyLogos(jobs);

        // Update localStorage with full job details
        const userData = (() => { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}'); } catch { return {}; } })();
        const userKey = userData?.email || user?.name || 'user';
        const detailsKey = `savedJobDetails_${userKey}`;
        localStorage.setItem(detailsKey, JSON.stringify(jobs));
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
    }
  };

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
      const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
      const userEmail = storedUser.email || user?.email || '';
      console.log('Fetching posted jobs for email:', userEmail);

      const response = await apiFetch(`${API_ENDPOINTS.JOBS}/employer/email/${encodeURIComponent(userEmail)}`);
      console.log('Posted jobs response status:', response.status);

      if (response.ok) {
        const jobs: any[] = await response.json();
        console.log('Fetched posted jobs count:', jobs.length);

        const sorted = jobs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPostedJobs(sorted);
        setHasMoreJobs(false); // all jobs loaded at once

        console.log('Posted jobs updated in state:', sorted.length);
      } else {
        console.error('Failed to fetch posted jobs:', response.status);
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
      const response = await apiFetch(`${API_ENDPOINTS.APPLICATIONS}/candidate/${encodeURIComponent(userEmail)}`);
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

  const fetchAssignedJobs = async () => {
    try {
      const userData = (() => { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}'); } catch { return {}; } })();
      const userEmail = userData.email || user?.email || '';
      console.log('Fetching assigned jobs for email:', userEmail);

      let url = `${API_ENDPOINTS.BASE_URL}/jobs/employer/email/${encodeURIComponent(userEmail)}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const jobs = await res.json();

      // Filter for non-empty assignedTo as a secondary measure
      let assigned = jobs.filter((j: any) => j.assignedTo && j.assignedTo !== 'N/A' && j.assignedTo !== '');

      // Safety recruiter-specific filter
      if (userData.teamRole === 'Recruiter' && userEmail) {
        assigned = assigned.filter((j: any) => j.assignedTo?.toLowerCase().trim() === userEmail.toLowerCase().trim());
      }

      setAssignedJobs(assigned);
    } catch (error) {
      console.error('Error fetching assigned jobs:', error);
    }
  };

  const fetchEmployerApplications = async () => {
    try {
      const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
      const userEmail = storedUser.email || user?.email || '';
      console.log('Fetching applications for employer:', userEmail);

      const jobsResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/jobs/employer/email/${encodeURIComponent(userEmail)}`);
      if (!jobsResponse.ok) {
        console.error('Failed to fetch jobs');
        return;
      }

      const employerJobs = await jobsResponse.json();
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
            jobCode: app.jobCode || job?.jobCode || (job?.positionId ? `TTS/26/${job.positionId.toString().padStart(4, '0')}` : null),
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

  const updateJobStatus = async (jobId: string, newStatus: string) => {
    try {
      const isActive = newStatus === 'active';
      const response = await apiFetch(`${API_ENDPOINTS.JOBS}/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, isActive })
      });

      if (!response.ok) throw new Error('Failed to update job status');

      showNotification(`Job status updated to ${newStatus}`, 'success');
      
      setPostedJobs(prev => prev.map(job => 
        getId(job) === jobId ? { ...job, status: newStatus, isActive } : job
      ));
      setFilteredJobs(prev => prev.map(job => 
        getId(job) === jobId ? { ...job, status: newStatus, isActive } : job
      ));
    } catch (error) {
      console.error('Error updating job status:', error);
      showNotification('Failed to update job status', 'error');
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!jobId) {
      console.error('Delete job called with invalid ID:', jobId);
      showNotification('Invalid job ID.', 'error');
      return;
    }

    console.log('Attempting to delete job with ID:', jobId);

    const ok = await (window as any).confirmAsync('Are you sure you want to delete this job posting?');
    if (!ok) return;

    try {
      // Check if user is authenticated
      const { tokenStorage } = await import('../utils/tokenStorage');
      const accessToken = tokenStorage.getAccess();

      if (!accessToken) {
        showNotification('Please log in again to delete jobs.', 'error');
        if (onLogout) onLogout();
        return;
      }

      console.log('Making DELETE request to:', `${API_ENDPOINTS.JOBS}/${jobId}`);

      // Use apiFetch which automatically handles authentication
      const response = await apiFetch(`${API_ENDPOINTS.JOBS}/${jobId}`, {
        method: 'DELETE'
      });

      console.log('Delete response status:', response.status);

      if (response.ok) {
        console.log('Job deleted successfully, updating state');
        setPostedJobs(prev => {
          const updated = prev.filter(job => getId(job) !== jobId);
          console.log('Updated posted jobs count:', updated.length);
          return updated;
        });
        showNotification('Job deleted successfully!');

        setTimeout(() => {
          console.log('Refreshing jobs list after delete');
          fetchPostedJobs();
        }, 1000);

        window.dispatchEvent(new CustomEvent('jobDeleted', { detail: { jobId } }));
      } else if (response.status === 401) {
        showNotification('Session expired. Please log in again.', 'error');
        if (onLogout) onLogout();
      } else {
        const errorText = await response.text();
        console.error('Delete failed with response:', errorText);

        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        showNotification(errorData.message || errorData.error || `Failed to delete job (${response.status}). Please try again.`, 'error');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      showNotification('Error deleting job. Please try again.', 'error');
    }
  };

  const bulkDeleteJobs = async () => {
    if (selectedJobs.length === 0) {
      showNotification('Please select jobs to delete', 'error');
      return;
    }

    const ok = await (window as any).confirmAsync(`Delete ${selectedJobs.length} selected job(s)?`);
    if (!ok) return;

    try {
      // Check authentication
      const { tokenStorage } = await import('../utils/tokenStorage');
      const accessToken = tokenStorage.getAccess();

      if (!accessToken) {
        showNotification('Please log in again to delete jobs.', 'error');
        if (onLogout) onLogout();
        return;
      }

      // Use apiFetch which automatically handles authentication
      await Promise.all(selectedJobs.map(jobId =>
        apiFetch(`${API_ENDPOINTS.JOBS}/${jobId}`, {
          method: 'DELETE'
        })
      ));

      setPostedJobs(prev => prev.filter(job => !selectedJobs.includes(getId(job))));
      setSelectedJobs([]);
      showNotification(`${selectedJobs.length} job(s) deleted successfully!`);
    } catch (error) {
      console.error('Bulk delete error:', error);
      showNotification('Error deleting jobs. Please try again.', 'error');
    }
  };

  const handleRemoveSavedJob = (jobId: string) => {
    const updatedJobs = savedJobs.filter((job: any) => getId(job) !== jobId);
    setSavedJobs(updatedJobs);

    // Get user email from localStorage user object for consistency
    const userData = (() => { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}'); } catch { return {}; } })();
    const userKey = userData?.email || user?.name || 'user';
    const detailsKey = `savedJobDetails_${userKey}`;
    const idsKey = `savedJobs_${userKey}`;

    localStorage.setItem(detailsKey, JSON.stringify(updatedJobs));
    try {
      const ids = JSON.parse(localStorage.getItem(idsKey) || '[]');
      localStorage.setItem(idsKey, JSON.stringify(ids.filter((id: string) => id !== jobId)));
    } catch { /* ignore */ }
    // Notify dashboard to sync bookmark state
    window.dispatchEvent(new CustomEvent('zync:savedJobsUpdated', { detail: { removedId: jobId } }));
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
    // Saving from MyJobsPage is handled via handleRemoveSavedJob for the saved tab
    // This stub is kept for the renderJobCard signature compatibility
  };

  const handleLoadMorePostedJobs = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchPostedJobs(nextPage, true);
  };

  const renderJobCard = (job: any, showActions: boolean = true, actionType: string = 'default', showCheckbox: boolean = false) => {
    const jobKey = getId(job) || `job-${Math.random()}`;
    const jobId = getId(job);

    // Saved jobs use the same card layout as the job search page
    if (actionType === 'saved') {
      return (
        <div key={jobKey} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md hover:border-gray-300 transition-all bg-white">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center bg-white">
                      <img
                        src={companyLogos[(job.company || job.companyName || '').toLowerCase()] || getSafeCompanyLogo(job)}
                        alt={`${job.company || job.companyName} logo`}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          const name = job.company || job.companyName || '';
                          if (name.toLowerCase().includes('nambikkai')) {
                            img.src = '/images/company-logos/nambikkai-logo.png';
                          } else if (name.toLowerCase().includes('trinity')) {
                            img.src = '/images/trinity-logo.webp';
                          } else {
                            const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
                            img.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="#3B82F6" rx="6"/><text x="16" y="21" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">${initials}</text></svg>`)}`;
                          }
                        }}
                      />
                    </div>
                    <span className="text-blue-600 font-semibold text-base">{job.company || job.companyName}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer mb-1">
                    {job.jobTitle || job.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    {job.location && (
                      <div className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-lg">
                        <MapPin className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">{job.location}</span>
                      </div>
                    )}
                    {formatSalary(job.salary) && (
                      <div className="flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-lg">
                        <span className="text-sm font-semibold text-green-700">{formatSalary(job.salary)}</span>
                      </div>
                    )}
                    {job.type && (
                      <div className="flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">{job.type}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-lg">
                      <span className="text-xs font-medium text-purple-600">{formatDate(job.createdAt)}</span>
                    </div>
                  </div>
                  {(job.jobDescription || job.description) && (
                    <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                        {(() => { const desc = job.jobDescription || job.description || ''; const plain = formatJobDescription(desc); return plain.length > 180 ? `${plain.substring(0, 180)}...` : plain; })()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {showActions && (
              <div className="flex flex-row sm:flex-col items-stretch gap-2 sm:ml-4 sm:min-w-[130px] w-full sm:w-auto">
                <button
                  onClick={() => handleRemoveSavedJob(getId(job))}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium h-10"
                >
                  Remove
                </button>
                <button
                  onClick={() => {
                    const jobId = getId(job);
                    if (jobId) {
                      onNavigate('job-detail', { jobId, jobData: job });
                    }
                  }}
                  className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm text-center h-10"
                >
                  Apply Now
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div key={jobKey} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 overflow-hidden">
        {/* Gradient Header */}
        <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

        {/* Checkbox for selection */}
        {showCheckbox && (
          <div className="absolute top-4 left-4 z-10">
            <input
              type="checkbox"
              checked={selectedJobs.includes(jobId)}
              onChange={() => {
                if (selectedJobs.includes(jobId)) {
                  setSelectedJobs(prev => prev.filter(id => id !== jobId));
                } else {
                  setSelectedJobs(prev => [...prev, jobId]);
                }
              }}
              className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500 bg-white shadow-sm"
            />
          </div>
        )}

        <div className="p-6 pt-8">
          {/* Header Section */}
          <div className="flex items-start gap-4 mb-4">
            {/* Company Logo */}
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 flex items-center justify-center shadow-sm">
                <img
                  src={companyLogos[(job.company || job.companyName || '').toLowerCase()] || getSafeCompanyLogo(job)}
                  alt={`${job.company || job.companyName} logo`}
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    const name = job.company || job.companyName || '';
                    if (name.toLowerCase().includes('nambikkai')) {
                      img.src = '/images/company-logos/nambikkai-logo.png';
                    } else if (name.toLowerCase().includes('trinity')) {
                      img.src = '/images/trinity-logo.webp';
                    } else {
                      const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
                      img.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#3B82F6"/><text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">${initials}</text></svg>`)}`;
                    }
                  }}
                />
              </div>
            </div>

            {/* Company Info & Date */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider">{job.company}</h4>
                <div className="flex items-center gap-2">
                  {actionType === 'posted' && (
                    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={job.status || (job.isActive ? 'active' : 'closed')}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          const jobId = getId(job);
                          if (jobId) updateJobStatus(jobId, newStatus);
                        }}
                        className={`text-sm font-semibold pl-8 pr-8 py-1.5 rounded-lg border-2 cursor-pointer appearance-none outline-none transition-colors ${
                          job.status === 'closed' || (!job.isActive && job.status !== 'hold')
                            ? 'bg-red-50 border-red-500 text-red-700 hover:bg-red-100 focus:border-red-600 focus:ring-1 focus:ring-red-500'
                            : job.status === 'hold'
                            ? 'bg-orange-50 border-orange-400 text-orange-800 hover:bg-orange-100 focus:border-orange-500 focus:ring-1 focus:ring-orange-500'
                            : 'bg-green-50 border-green-500 text-green-700 hover:bg-green-100 focus:border-green-600 focus:ring-1 focus:ring-green-500'
                        }`}
                      >
                        <option value="active" className="bg-white text-gray-900">Active</option>
                        <option value="hold" className="bg-white text-gray-900">Hold</option>
                        <option value="closed" className="bg-white text-gray-900">Closed</option>
                      </select>
                      {/* Colored Dot overlay */}
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className={`w-2 h-2 rounded-full ${
                          job.status === 'closed' || (!job.isActive && job.status !== 'hold')
                            ? 'bg-red-500'
                            : job.status === 'hold'
                            ? 'bg-orange-500'
                            : 'bg-green-500'
                        }`}></span>
                      </div>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  )}
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {formatDate(job.createdAt)}
                  </span>
                </div>
              </div>

              {/* Job Title */}
              <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer mb-3 line-clamp-2 leading-tight">
                {job.jobTitle || job.title}
              </h3>
            </div>
          </div>

          {/* Job Details Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
              <MapPin className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">{job.location}</span>
            </div>
            {formatSalary(job.salary) && (
              <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                <IndianRupee className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">{formatSalary(job.salary)}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">{job.type}</span>
            </div>
            {job.positionId && actionType === 'posted' && (
              <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg">
                <span className="text-sm font-semibold text-purple-600">PID: {job.positionId}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {(job.jobDescription || job.description) && (
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200 p-4 rounded-xl mb-4">
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                {(() => {
                  const desc = job.jobDescription || job.description || '';
                  const plain = formatJobDescription(desc);
                  return plain.length > 180 ? `${plain.substring(0, 180)}...` : plain;
                })()}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="flex gap-2 pt-2">
              {actionType === 'posted' && (
                <>
                  <button
                    onClick={() => {
                      const jobId = getId(job);
                      if (jobId) {
                        onNavigate('job-detail', { jobId, jobData: job });
                      }
                    }}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-1"
                  >
                    <span>View Details</span>
                  </button>
                  <button
                    onClick={() => deleteJob(getId(job))}
                    className="px-3 py-2 bg-white border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 hover:border-red-400 transition-colors text-sm flex items-center justify-center"
                  >
                    Delete
                  </button>
                </>
              )}
              {actionType === 'default' && (
                <button
                  onClick={() => onNavigate('job-detail', { jobId: getId(job) })}
                  className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                >
                  View Details
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #f8f0ff 50%, #fff0f6 100%)' }}>
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
          {notification.message}
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <BackButton onClick={() => onNavigate('dashboard')} text="Back to Dashboard" className="mb-4 sm:mb-6" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3">
            <div className="flex flex-wrap gap-1">
              {user?.type === 'employer' ? (
                <>
                  <button
                    onClick={() => setActiveTab('Posted Jobs')}
                    className={`px-4 sm:px-6 py-2 rounded-full font-medium transition-colors text-sm sm:text-base ${activeTab === 'Posted Jobs'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    Posted Jobs
                  </button>
                  <button
                    onClick={() => setActiveTab('Applications')}
                    className={`px-3 sm:px-6 py-2 rounded-full font-medium transition-colors text-sm sm:text-base ${activeTab === 'Applications'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    Applications ({employerApplications.length})
                  </button>
                  <button
                    onClick={() => { setActiveTab('Assigned To'); fetchAssignedJobs(); }}
                    className={`px-3 sm:px-6 py-2 rounded-full font-medium transition-colors text-sm sm:text-base ${activeTab === 'Assigned To'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    Assigned To ({assignedJobs.length})
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveTab('Saved')}
                    className={`px-4 sm:px-6 py-2 rounded-full font-medium transition-colors text-sm sm:text-base ${activeTab === 'Saved'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    Saved
                  </button>
                  <button
                    onClick={() => setActiveTab('Applied')}
                    className={`px-4 sm:px-6 py-2 rounded-full font-medium transition-colors text-sm sm:text-base ${activeTab === 'Applied'
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
                className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 font-medium text-sm sm:text-base"
              >
                <span className="hidden sm:inline">View Recommended Jobs</span>
                <span className="sm:hidden">Recommended</span>
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

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
              {activeTab}
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

            {user?.type === 'candidate' && activeTab === 'Saved' && (
              <>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      console.log('Manual refresh of saved jobs');
                      loadSavedJobs();
                    }}
                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Refresh saved jobs"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-600">Show expired jobs</span>
                  <button
                    onClick={() => setShowExpiredJobs(!showExpiredJobs)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showExpiredJobs ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    aria-label="Toggle show expired jobs"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showExpiredJobs ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    ></span>
                  </button>
                </div>
              </>
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
                    <>
                      {/* Bulk Actions Bar */}
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                        <div className="flex flex-wrap items-center gap-4">
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedJobs.length === postedJobs.length && postedJobs.length > 0}
                              onChange={() => {
                                if (selectedJobs.length === postedJobs.length) {
                                  setSelectedJobs([]);
                                } else {
                                  setSelectedJobs(postedJobs.map(job => getId(job)).filter(Boolean));
                                }
                              }}
                              className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Select All</span>
                          </label>

                          <span className="text-sm text-gray-500">
                            {selectedJobs.length} of {postedJobs.length} jobs selected
                          </span>

                          <div className="flex gap-3 ml-auto">
                            <BulkJobRefresh
                              selectedJobIds={selectedJobs}
                              selectedJobs={postedJobs.filter(job => selectedJobs.includes(getId(job))).map(job => ({
                                id: getId(job),
                                title: job.jobTitle || job.title,
                                refreshCount: job.refreshCount || 0,
                                lastRefreshedAt: job.lastRefreshedAt
                              }))}
                              userPlan={(user as any)?.plan || 'free'}
                              onRefreshComplete={() => {
                                fetchPostedJobs();
                                setSelectedJobs([]);
                              }}
                              className="text-sm"
                            />

                            <button
                              onClick={async () => {
                                if (selectedJobs.length === 0) {
                                  showNotification('Please select jobs to delete', 'error');
                                  return;
                                }

                                const confirmed = await (window as any).confirmAsync(
                                  `Are you sure you want to delete ${selectedJobs.length} selected job${selectedJobs.length > 1 ? 's' : ''}? This action cannot be undone.`
                                );

                                if (!confirmed) return;

                                try {
                                  console.log('Deleting selected jobs:', selectedJobs);

                                  // Check authentication
                                  const { tokenStorage } = await import('../utils/tokenStorage');
                                  const accessToken = tokenStorage.getAccess();

                                  if (!accessToken) {
                                    showNotification('Please log in again to delete jobs.', 'error');
                                    if (onLogout) onLogout();
                                    return;
                                  }

                                  // Delete jobs one by one
                                  const deletePromises = selectedJobs.map(jobId =>
                                    apiFetch(`${API_ENDPOINTS.JOBS}/${jobId}`, { method: 'DELETE' })
                                  );

                                  const results = await Promise.allSettled(deletePromises);

                                  const successCount = results.filter(result =>
                                    result.status === 'fulfilled' && result.value.ok
                                  ).length;

                                  const failCount = results.length - successCount;

                                  if (successCount > 0) {
                                    // Remove successfully deleted jobs from state
                                    setPostedJobs(prev => prev.filter(job => !selectedJobs.includes(getId(job))));
                                    setSelectedJobs([]);

                                    // Dispatch events for dashboard sync
                                    selectedJobs.forEach(jobId => {
                                      window.dispatchEvent(new CustomEvent('jobDeleted', { detail: { jobId } }));
                                    });

                                    if (failCount === 0) {
                                      showNotification(`Successfully deleted ${successCount} job${successCount > 1 ? 's' : ''}!`);
                                    } else {
                                      showNotification(`Deleted ${successCount} job${successCount > 1 ? 's' : ''}, ${failCount} failed.`, 'error');
                                    }

                                    // Refresh the jobs list
                                    setTimeout(() => {
                                      fetchPostedJobs();
                                    }, 1000);
                                  } else {
                                    showNotification('Failed to delete selected jobs. Please try again.', 'error');
                                  }
                                } catch (error) {
                                  console.error('Error deleting jobs:', error);
                                  showNotification('Error deleting jobs. Please try again.', 'error');
                                }
                              }}
                              disabled={selectedJobs.length === 0}
                              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${selectedJobs.length === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-red-600 text-white hover:bg-red-700'
                                }`}
                            >
                              Delete Selected ({selectedJobs.length})
                            </button>

                            <button
                              onClick={() => onNavigate('job-refresh-management')}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                            >
                              <RefreshCw className="w-4 h-4" />
                              Manage Refreshes
                            </button>
                          </div>
                        </div>
                      </div>

                      {(() => {
                        const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
                        const userEmail = storedUser.email || user?.email || '';
                        const isRecruiter = storedUser.teamRole === 'Recruiter';
                        const filteredList = isRecruiter 
                          ? postedJobs.filter((j: any) => 
                              (j.postedBy?.toLowerCase().trim() === userEmail.toLowerCase().trim() ||
                               j.employerEmail?.toLowerCase().trim() === userEmail.toLowerCase().trim())
                            )
                          : postedJobs;

                        const totalPages = Math.ceil(filteredList.length / postedJobsPerPage);
                        const startIndex = (postedJobsCurrentPage - 1) * postedJobsPerPage;
                        const paginatedList = filteredList.slice(startIndex, startIndex + postedJobsPerPage);

                        return (
                          <div className="space-y-4">
                            {paginatedList.map((job) => {
                              const jobId = getId(job);
                              const k = jobId || `posted-${Math.random()}`;
                              return (
                                <React.Fragment key={k}>
                                  {renderJobCard(job, true, 'posted', true)}
                                </React.Fragment>
                              );
                            })}

                             {/* Pagination Controls */}
                             {filteredList.length > 0 && (
                               <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 border-t border-gray-200 bg-white rounded-b-xl shadow-sm mt-6">
                                 <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                                   <span>Show</span>
                                   <select
                                     value={postedJobsPerPage}
                                     onChange={(e) => {
                                       setPostedJobsPerPage(Number(e.target.value));
                                       setPostedJobsCurrentPage(1);
                                     }}
                                     className="bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium cursor-pointer"
                                   >
                                     <option value={5}>5</option>
                                     <option value={10}>10</option>
                                     <option value={20}>20</option>
                                     <option value={50}>50</option>
                                   </select>
                                   <span>entries</span>
                                   <span className="mx-2 text-gray-300">|</span>
                                   <span>Showing {filteredList.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + postedJobsPerPage, filteredList.length)} of {filteredList.length} entries</span>
                                 </div>

                                 <div className="flex items-center gap-2">
                                   <button
                                     onClick={() => setPostedJobsCurrentPage(prev => Math.max(prev - 1, 1))}
                                     disabled={postedJobsCurrentPage === 1}
                                     className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                     title="Previous Page"
                                   >
                                     <ChevronLeft className="w-4 h-4" />
                                   </button>
                                   
                                   <div className="flex items-center gap-1.5 px-2">
                                     <span className="text-sm text-gray-600">Page</span>
                                     <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">{postedJobsCurrentPage}</span>
                                     <span className="text-sm text-gray-400">/</span>
                                     <span className="text-sm font-medium text-gray-700">{totalPages || 1}</span>
                                   </div>

                                   <button
                                     onClick={() => setPostedJobsCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                     disabled={postedJobsCurrentPage === totalPages || totalPages === 0}
                                     className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                     title="Next Page"
                                   >
                                     <ChevronRight className="w-4 h-4" />
                                   </button>
                                 </div>
                               </div>
                             )}
                          </div>
                        );
                      })()}
                    </>
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

              {user?.type === 'employer' && activeTab === 'Assigned To' && (
                <div className="space-y-4">
                  {assignedJobs.length > 0 ? (
                    (() => {
                      const totalPages = Math.ceil(assignedJobs.length / assignedJobsPerPage);
                      const startIndex = (assignedJobsCurrentPage - 1) * assignedJobsPerPage;
                      const paginatedAssigned = assignedJobs.slice(startIndex, startIndex + assignedJobsPerPage);

                      return (
                        <>
                          {paginatedAssigned.map((job) => {
                            const jobId = getId(job);
                            return (
                              <div key={jobId || Math.random()} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all">
                                <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                                <div className="p-5">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 flex items-center justify-center flex-shrink-0">
                                        <img
                                          src={companyLogos[(job.company || job.companyName || '').toLowerCase()] || getSafeCompanyLogo(job)}
                                          alt="logo"
                                          className="w-9 h-9 object-contain"
                                          onError={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            const name = job.company || job.companyName || '';
                                            const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || 'J';
                                            img.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="18" fill="#3B82F6"/><text x="18" y="24" text-anchor="middle" fill="white" font-family="Arial" font-size="13" font-weight="bold">${initials}</text></svg>`)}`;
                                          }}
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-0.5">{job.company || job.companyName}</p>
                                        <h3 className="text-base font-bold text-gray-900 truncate">{job.jobTitle || job.title}</h3>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                          {job.location && (
                                            <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                                              <MapPin className="w-3 h-3" />{job.location}
                                            </span>
                                          )}
                                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                                            {formatDate(job.createdAt)}
                                          </span>
                                          {job.positionId && (
                                            <span className="text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-1 rounded-lg">
                                              PID: {job.positionId}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    {/* Assigned To badge */}
                                    <div className="flex-shrink-0 text-right">
                                      <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                          <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        <span className="text-xs font-bold text-indigo-700">{job.assignedTo}</span>
                                      </div>
                                      <p className="text-xs text-gray-400 mt-1">Assigned Recruiter</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                                    <button
                                      onClick={() => jobId && onNavigate('job-detail', { jobId, jobData: job })}
                                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                                    >
                                      View Details
                                    </button>
                                    <button
                                      onClick={() => deleteJob(jobId)}
                                      className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* Pagination Controls */}
                          {assignedJobs.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 border-t border-gray-200 bg-white rounded-b-xl shadow-sm mt-6">
                              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                                <span>Show</span>
                                <select
                                  value={assignedJobsPerPage}
                                  onChange={(e) => {
                                    setAssignedJobsPerPage(Number(e.target.value));
                                    setAssignedJobsCurrentPage(1);
                                  }}
                                  className="bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium cursor-pointer"
                                >
                                  <option value={5}>5</option>
                                  <option value={10}>10</option>
                                  <option value={20}>20</option>
                                  <option value={50}>50</option>
                                </select>
                                <span>entries</span>
                                <span className="mx-2 text-gray-300">|</span>
                                <span>Showing {assignedJobs.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + assignedJobsPerPage, assignedJobs.length)} of {assignedJobs.length} entries</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setAssignedJobsCurrentPage(prev => Math.max(prev - 1, 1))}
                                  disabled={assignedJobsCurrentPage === 1}
                                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  title="Previous Page"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                
                                <div className="flex items-center gap-1.5 px-2">
                                  <span className="text-sm text-gray-600">Page</span>
                                  <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">{assignedJobsCurrentPage}</span>
                                  <span className="text-sm text-gray-400">/</span>
                                  <span className="text-sm font-medium text-gray-700">{totalPages || 1}</span>
                                </div>

                                <button
                                  onClick={() => setAssignedJobsCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                  disabled={assignedJobsCurrentPage === totalPages || totalPages === 0}
                                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  title="Next Page"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()
                  ) : (
                    <div className="text-center py-16">
                      <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Assigned Jobs</h3>
                      <p className="text-gray-500">Jobs assigned to recruiters will appear here.</p>
                    </div>
                  )}
                </div>
              )}

              {user?.type === 'employer' && activeTab === 'Applications' && (
                <div className="space-y-4">
                  {employerApplications.length > 0 ? (
                    (() => {
                      const totalPages = Math.ceil(employerApplications.length / appsPerPage);
                      const startIndex = (appsCurrentPage - 1) * appsPerPage;
                      const paginatedApps = employerApplications.slice(startIndex, startIndex + appsPerPage);

                      return (
                        <>
                          {paginatedApps.map((application) => (
                            <div key={application._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-gray-300 transition-all bg-white">
                              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                                <div className="flex-1">
                                  <div className="flex items-start mb-4">
                                    <div className="flex-1">
                                      <div className="flex items-start justify-between mb-2">
                                        <h3 className="text-xl font-bold text-gray-900">
                                          {application.candidateName || application.candidateEmail || 'Candidate'}
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${application.status === 'pending' ? 'bg-blue-100 text-blue-800' :
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
                                          <Briefcase className="w-4 h-4" />
                                          {application.jobTitle} {application.jobCode ? `(${application.jobCode})` : ''}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-lg inline-flex">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">
                                          Applied on: {formatDate(application.createdAt || application.appliedAt)}
                                        </span>
                                      </div>
                                      {application.jobDescription && (
                                        <div className="mt-3 bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                                          <p className="text-sm text-gray-700 leading-relaxed">
                                            <span className="font-semibold text-blue-900">Job Description: </span>
                                            {(() => { const plain = formatJobDescription(application.jobDescription); return plain.length > 200 ? `${plain.substring(0, 200)}...` : plain; })()}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-4 lg:mt-0 lg:ml-6">
                                  <div className="flex flex-col gap-2">
                                    <button
                                      onClick={() => {
                                        const jobId = application.jobId ? (typeof application.jobId === 'string' ? application.jobId : (application.jobId?._id || application.jobId?.id)) : '';
                                        if (jobId) {
                                          onNavigate('job-detail', { jobId });
                                        } else {
                                          showNotification('Job details are no longer available.', 'error');
                                        }
                                      }}
                                      className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-md min-w-[140px]"
                                    >
                                      View Job Details
                                    </button>
                                    <button
                                      onClick={() => { const jobId = application.jobId ? (typeof application.jobId === 'string' ? application.jobId : (application.jobId?._id || application.jobId?.id)) : ''; if (jobId) sessionStorage.setItem('selectedJobId', jobId); sessionStorage.setItem('selectedJobTitle', application.jobTitle || application.jobId?.jobTitle || application.jobId?.title || 'Job Position'); onNavigate('application-management'); }}
                                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md min-w-[140px]"
                                    >
                                      View Details
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                           {/* Pagination Controls */}
                           {employerApplications.length > 0 && (
                             <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 border-t border-gray-200 bg-white rounded-b-xl shadow-sm mt-6">
                               <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                                 <span>Show</span>
                                 <select
                                   value={appsPerPage}
                                   onChange={(e) => {
                                     setAppsPerPage(Number(e.target.value));
                                     setAppsCurrentPage(1);
                                   }}
                                   className="bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium cursor-pointer"
                                 >
                                   <option value={5}>5</option>
                                   <option value={10}>10</option>
                                   <option value={20}>20</option>
                                   <option value={50}>50</option>
                                 </select>
                                 <span>entries</span>
                                 <span className="mx-2 text-gray-300">|</span>
                                 <span>Showing {employerApplications.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + appsPerPage, employerApplications.length)} of {employerApplications.length} entries</span>
                               </div>

                               <div className="flex items-center gap-2">
                                 <button
                                   onClick={() => setAppsCurrentPage(prev => Math.max(prev - 1, 1))}
                                   disabled={appsCurrentPage === 1}
                                   className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                   title="Previous Page"
                                 >
                                   <ChevronLeft className="w-4 h-4" />
                                 </button>
                                 
                                 <div className="flex items-center gap-1.5 px-2">
                                   <span className="text-sm text-gray-600">Page</span>
                                   <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">{appsCurrentPage}</span>
                                   <span className="text-sm text-gray-400">/</span>
                                   <span className="text-sm font-medium text-gray-700">{totalPages || 1}</span>
                                 </div>

                                 <button
                                   onClick={() => setAppsCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                   disabled={appsCurrentPage === totalPages || totalPages === 0}
                                   className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                   title="Next Page"
                                 >
                                   <ChevronRight className="w-4 h-4" />
                                 </button>
                               </div>
                             </div>
                           )}
                        </>
                      );
                    })()
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
                <>
                  {savedJobs.length > 0 ? (
                    <>
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <strong>{savedJobs.length}</strong> job{savedJobs.length !== 1 ? 's' : ''} saved
                        </p>
                      </div>
                      <div className="space-y-4">
                        {savedJobs.map((job) => {
                          const k = getId(job) || `saved-${Math.random()}`;
                          return <React.Fragment key={k}>{renderJobCard(job, true, 'saved', false)}</React.Fragment>;
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-700">
                          No saved jobs found. Jobs you save will appear here.
                        </p>
                      </div>
                      <EmptyState
                        title="Jobs saved by you"
                        description="No saved jobs! Tap on save icon against a job to save it"
                        buttonText="Search jobs"
                        onButtonClick={() => onNavigate('job-listings')}
                        icon="jobs"
                      />
                    </>
                  )}
                </>
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
                                      if (name.toLowerCase().includes('nambikkai')) {
                                        img.src = '/images/company-logos/nambikkai-logo.png';
                                      } else if (name.toLowerCase().includes('trinity')) {
                                        img.src = '/images/trinity-logo.webp';
                                      } else {
                                        const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || 'C';
                                        img.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="#3B82F6" rx="6"/><text x="16" y="21" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">${initials}</text></svg>`)}`;
                                      }
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
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ml-3 flex-shrink-0 ${application.status === 'pending' ? 'bg-blue-100 text-blue-800' :
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
                                <Clock className="w-4 h-4 text-gray-500" />
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
                                  {(() => { const plain = formatJobDescription(application.jobId.jobDescription); return plain.length > 200 ? `${plain.substring(0, 200)}...` : plain; })()}
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

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default MyJobsPage;
