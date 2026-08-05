import React, { useState, useEffect } from 'react';
import { ChevronRight, Briefcase, MapPin, Bookmark, Clock, Search, Filter, RefreshCw } from 'lucide-react';
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
import { useSavedJobsStore } from '../store/useSavedJobsStore';

function useRefresh(fn: () => Promise<void>) {
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const trigger = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setError(null);
    try {
      await fn();
    } catch {
      setError('Refresh failed. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };
  return { refreshing, error, trigger };
}

interface MyJobsPageProps {
  onNavigate: (page: string, data?: any) => void;
  user?: any;
  onLogout?: () => void;
}

const MyJobsPage: React.FC<MyJobsPageProps> = ({ onNavigate, user, onLogout }) => {
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string; show: boolean }>({ type: 'success', message: '', show: false });
  const [activeTab, setActiveTab] = useState(user?.type === 'employer' ? 'Posted Jobs' : 'Saved');

  // Global saved jobs store
  const savedJobIds = useSavedJobsStore(s => s.savedJobIds);
  const unsaveJobGlobal = useSavedJobsStore(s => s.unsaveJob);
  const fetchSavedJobsFromStore = useSavedJobsStore(s => s.fetchSavedJobs);

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
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [postedJobsPage, setPostedJobsPage] = useState(1);
  const [applicationsPage, setApplicationsPage] = useState(1);
  const JOBS_PER_PAGE = 10;
  const APPS_PER_PAGE = 10;
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

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

  useEffect(() => {
    if (user?.type === 'candidate') {
      loadSavedJobs();
      fetchAppliedJobs();
    } else if (user?.type === 'employer') {
      fetchPostedJobs();
      fetchAllJobs();
      fetchEmployerApplications();
    }
    setLoading(false);
  }, [user]);

  const loadSavedJobs = () => {
    const ids = Array.from(useSavedJobsStore.getState().savedJobIds);
    if (ids.length === 0) {
      setSavedJobs([]);
      return;
    }
    fetchJobDetailsByIds(ids);
  };

  const fetchJobDetailsByIds = async (jobIds: string[]) => {
    try {
      const jobPromises = jobIds.map(async (id) => {
        try {
          const response = await fetch(`${API_ENDPOINTS.JOBS}/${id}`);
          if (response.ok) return await response.json();
        } catch { }
        return null;
      });
      const jobs = (await Promise.all(jobPromises)).filter(Boolean);
      if (jobs.length > 0) {
        setSavedJobs(jobs);
        fetchCompanyLogos(jobs);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
    }
  };

  // Re-sync saved job details when the set of saved IDs changes
  const savedJobIdsSize = savedJobIds.size;
  useEffect(() => {
    if (user?.type === 'candidate') {
      const ids = Array.from(savedJobIds);
      if (ids.length === 0) {
        setSavedJobs([]);
      } else {
        fetchJobDetailsByIds(ids);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedJobIdsSize]);

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
      const ownerEmail = getEffectiveEmployerEmail();
      const email = encodeURIComponent(ownerEmail);
      console.log('Fetching posted jobs for email:', email);
      
      const response = await apiFetch(`${API_ENDPOINTS.JOBS}/employer/email/${email}`);
      console.log('Posted jobs response status:', response.status);
      
      if (response.ok) {
        const jobs: any[] = await response.json();
        console.log('Fetched posted jobs count:', jobs.length);
        
        const sorted = jobs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPostedJobs(sorted);
        setPostedJobsPage(1);
        fetchCompanyLogos(sorted);
        
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

  const refreshSaved = useRefresh(async () => {
    await fetchSavedJobsFromStore();
    const ids = Array.from(useSavedJobsStore.getState().savedJobIds);
    if (ids.length === 0) { setSavedJobs([]); return; }
    await fetchJobDetailsByIds(ids);
  });

  const refreshApplied = useRefresh(fetchAppliedJobs);

  const fetchEmployerApplications = async () => {
    try {
      const ownerEmail = getEffectiveEmployerEmail();
      console.log('Fetching applications for employer:', ownerEmail);
      
      const jobsResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/jobs/employer/email/${encodeURIComponent(ownerEmail)}`);
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

  const deleteJob = (jobId: string) => {
    if (!jobId) { 
      console.error('Delete job called with invalid ID:', jobId);
      showNotification('Invalid job ID.', 'error'); 
      return; 
    }
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Job Post',
      message: 'Are you sure you want to delete this job posting? This action cannot be undone.',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        performDeleteJob(jobId);
      }
    });
  };

  const performDeleteJob = async (jobId: string) => {
    console.log('Attempting to delete job with ID:', jobId);
    
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
        console.log('✅ DELETE response OK - Job deleted successfully');
        
        // Immediately update state for instant UI feedback
        setPostedJobs(prev => {
          const updated = prev.filter(job => getId(job) !== jobId);
          console.log('📊 Immediate state update: removed job, count:', prev.length, '->', updated.length);
          return updated;
        });
        
        showNotification('Job deleted successfully!');
        window.dispatchEvent(new CustomEvent('jobDeleted', { detail: { jobId } }));
        
        // Verify deletion after 2 seconds
        setTimeout(async () => {
          console.log('🔄 Verifying deletion by re-fetching...');
          const ownerEmail = getEffectiveEmployerEmail();
          const verifyResponse = await apiFetch(`${API_ENDPOINTS.JOBS}/employer/email/${encodeURIComponent(ownerEmail)}`);
          
          if (verifyResponse.ok) {
            const jobs = await verifyResponse.json();
            const stillExists = jobs.some((j: any) => getId(j) === jobId);
            
            if (stillExists) {
              console.error('❌ BACKEND ISSUE: Job still exists after delete! JobId:', jobId);
              showNotification('⚠️ Warning: Job may not be deleted from database. Contact support.', 'error');
              // Force remove from UI anyway
              setPostedJobs(jobs.filter((j: any) => getId(j) !== jobId));
            } else {
              console.log('✅ Verified: Job successfully deleted from backend');
              setPostedJobs(jobs);
            }
          }
        }, 2000);
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
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Selected Jobs',
      message: `Are you sure you want to delete ${selectedJobs.length} selected job${selectedJobs.length > 1 ? 's' : ''}? This action cannot be undone.`,
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        performBulkDelete();
      }
    });
  };

  const performBulkDelete = async () => {
    
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
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Saved Job',
      message: 'Are you sure you want to remove this job from your saved list?',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        unsaveJobGlobal(jobId);
        // Keep local savedJobs list in sync for the UI display
        setSavedJobs(prev => prev.filter((job: any) => (job._id || job.id) !== jobId));
      }
    });
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
                    {formatSalary(job.salary, job.currency || job.salary?.currency) && (
                      <div className="flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-lg">
                        <span className="text-sm font-semibold text-green-700">{formatSalary(job.salary, job.currency || job.salary?.currency)}</span>
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
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {formatDate(job.createdAt)}
              </span>
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
          {formatSalary(job.salary, job.currency || job.salary?.currency) && (
            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
              <span className="text-sm font-semibold text-green-700">{formatSalary(job.salary, job.currency || job.salary?.currency)}</span>
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
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #f0f4ff 0%, #f8f0ff 50%, #fff0f6 100%)'}}>
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
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
                    className={`px-4 sm:px-6 py-2 rounded-full font-medium transition-colors text-sm sm:text-base ${
                      activeTab === 'Posted Jobs'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Posted Jobs
                  </button>
                  <button
                    onClick={() => setActiveTab('Applications')}
                    className={`px-3 sm:px-6 py-2 rounded-full font-medium transition-colors text-sm sm:text-base ${
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
                    className={`px-4 sm:px-6 py-2 rounded-full font-medium transition-colors text-sm sm:text-base ${
                      activeTab === 'Saved'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Saved
                  </button>
                  <button
                    onClick={() => setActiveTab('Applied')}
                    className={`px-4 sm:px-6 py-2 rounded-full font-medium transition-colors text-sm sm:text-base ${
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
              <>
                {refreshApplied.error && (
                  <span className="text-xs text-red-500 mr-2">{refreshApplied.error}</span>
                )}
                <button
                  onClick={refreshApplied.trigger}
                  className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh applications"
                  aria-label="Refresh applications"
                  disabled={refreshApplied.refreshing}
                >
                  <RefreshCw className={`w-5 h-5 ${refreshApplied.refreshing ? 'animate-spin' : ''}`} />
                </button>
              </>
            )}
            
              {user?.type === 'candidate' && activeTab === 'Saved' && (
                <>
                  <div className="flex items-center space-x-3">
                    {refreshSaved.error && (
                      <span className="text-xs text-red-500">{refreshSaved.error}</span>
                    )}
                    <button
                      onClick={refreshSaved.trigger}
                      disabled={refreshSaved.refreshing}
                      className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Refresh saved jobs"
                      aria-label="Refresh saved jobs"
                    >
                      <RefreshCw className={`w-5 h-5 ${refreshSaved.refreshing ? 'animate-spin' : ''}`} />
                    </button>
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
                                bulkDeleteJobs();
                              }}
                              disabled={selectedJobs.length === 0}
                              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                selectedJobs.length === 0
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
                      
                      <div className="space-y-4">
                        {postedJobs.slice((postedJobsPage - 1) * JOBS_PER_PAGE, postedJobsPage * JOBS_PER_PAGE).map((job) => {
                          const jobId = getId(job);
                          const k = jobId || `posted-${Math.random()}`;
                          return (
                            <React.Fragment key={k}>
                              {renderJobCard(job, true, 'posted', true)}
                            </React.Fragment>
                          );
                        })}
                      </div>
                      {postedJobs.length > JOBS_PER_PAGE && (
                        <div className="flex items-center justify-center gap-2 pt-6">
                          <button onClick={() => setPostedJobsPage(p => Math.max(1, p - 1))} disabled={postedJobsPage === 1} className="px-3 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-50">&#8592; Prev</button>
                          {Array.from({ length: Math.ceil(postedJobs.length / JOBS_PER_PAGE) }, (_, i) => i + 1).map(page => (
                            <button key={page} onClick={() => setPostedJobsPage(page)} className={`w-9 h-9 rounded-lg text-sm font-medium ${postedJobsPage === page ? 'bg-blue-600 text-white' : 'border hover:bg-gray-50'}`}>{page}</button>
                          ))}
                          <button onClick={() => setPostedJobsPage(p => Math.min(Math.ceil(postedJobs.length / JOBS_PER_PAGE), p + 1))} disabled={postedJobsPage === Math.ceil(postedJobs.length / JOBS_PER_PAGE)} className="px-3 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-50">Next &#8594;</button>
                        </div>
                      )}
                    </>
                    ) : (
                      user?.teamRole === 'Viewer' ? (
                        <div className="text-center py-16">
                          <Briefcase className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Posted Jobs</h3>
                          <p className="text-gray-500 mb-6">
                            You have view-only access. Only recruiters with posting permissions can create and manage jobs.
                          </p>
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
                      )
                    )}
                </>
              )}

              {user?.type === 'employer' && activeTab === 'Applications' && (
                <div className="space-y-4">
                  {employerApplications.length > 0 ? (
                    <>
                    {employerApplications.slice((applicationsPage - 1) * APPS_PER_PAGE, applicationsPage * APPS_PER_PAGE).map((application) => (
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
                                    <Briefcase className="w-4 h-4" />
                                    {application.jobTitle}
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
                            <button 
                              onClick={() => { const jobId = application.jobId ? (typeof application.jobId === 'string' ? application.jobId : (application.jobId?._id || application.jobId?.id)) : ''; if (jobId) sessionStorage.setItem('selectedJobId', jobId); sessionStorage.setItem('selectedJobTitle', application.jobTitle || application.jobId?.jobTitle || application.jobId?.title || 'Job Position'); onNavigate('application-management'); }}
                              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md min-w-[140px]"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {employerApplications.length > APPS_PER_PAGE && (
                      <div className="flex items-center justify-center gap-2 pt-4">
                        <button onClick={() => setApplicationsPage(p => Math.max(1, p - 1))} disabled={applicationsPage === 1} className="px-3 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-50">&#8592; Prev</button>
                        {Array.from({ length: Math.ceil(employerApplications.length / APPS_PER_PAGE) }, (_, i) => i + 1).map(page => (
                          <button key={page} onClick={() => setApplicationsPage(page)} className={`w-9 h-9 rounded-lg text-sm font-medium ${applicationsPage === page ? 'bg-blue-600 text-white' : 'border hover:bg-gray-50'}`}>{page}</button>
                        ))}
                        <button onClick={() => setApplicationsPage(p => Math.min(Math.ceil(employerApplications.length / APPS_PER_PAGE), p + 1))} disabled={applicationsPage === Math.ceil(employerApplications.length / APPS_PER_PAGE)} className="px-3 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-50">Next &#8594;</button>
                      </div>
                    )}
                    </>
                  ) : (
                    user?.teamRole === 'Viewer' ? (
                      <div className="text-center py-16">
                        <Briefcase className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications</h3>
                        <p className="text-gray-500 mb-6">
                          You have view-only access. Applications will appear only for jobs you are authorized to manage.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <Briefcase className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
                        <p className="text-gray-500 mb-6">
                          Applications will appear here when candidates apply to your jobs.
                        </p>
                      </div>
                    )
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
                              {formatSalary(application.jobId?.salary, application.jobId?.currency || application.jobId?.salary?.currency) && (
                                <div className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-lg">
                                  <span className="text-sm font-semibold text-green-700">{formatSalary(application.jobId?.salary, application.jobId?.currency || application.jobId?.salary?.currency)}</span>
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
