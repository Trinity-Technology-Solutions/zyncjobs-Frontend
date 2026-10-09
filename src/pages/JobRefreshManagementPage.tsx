import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, CheckSquare, AlertCircle, TrendingUp, MapPin, Eye, Users, BarChart3, Zap } from 'lucide-react';
import { API_ENDPOINTS } from '../config/env';
import BackButton from '../components/BackButton';
import JobRefreshButton from '../components/JobRefreshButton';
import BulkJobRefresh from '../components/BulkJobRefresh';
import RefreshStatusIndicator from '../components/RefreshStatusIndicator';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface Job {
  id: string;
  _id?: string;
  jobTitle: string;
  title?: string;
  company: string;
  location: string;
  createdAt: string;
  refreshCount?: number;
  lastRefreshedAt?: string;
  isActive?: boolean;
  status: string;
  applicationCount?: number;
  salary?: any;
  type?: string;
}

interface JobRefreshManagementPageProps {
  onNavigate: (page: string, params?: any) => void;
  user: { name: string; type: 'candidate' | 'employer'; email?: string; plan?: string } | null;
  onLogout: () => void;
  userLoading?: boolean;
  onUserUpdate?: React.Dispatch<React.SetStateAction<any>>;
}

const JobRefreshManagementPage: React.FC<JobRefreshManagementPageProps> = ({ 
  onNavigate, 
  user, 
  onLogout,
  onUserUpdate 
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [refreshStats, setRefreshStats] = useState({
    totalJobs: 0,
    totalRefreshes: 0,
    availableRefreshes: 0,
    refreshesRemaining: 0,
  });

  useEffect(() => {
    fetchEmployerJobs();
    fetchRefreshAnalytics();
  }, []);

  const fetchEmployerJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/jobs/employer/email/${encodeURIComponent(user?.email || '')}`);
      if (response.ok) {
        const employerJobs = await response.json();
        // Sort by updatedAt descending so refreshed jobs appear at top
        employerJobs.sort((a: any, b: any) =>
          new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
        );
        setJobs(employerJobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };


  const fetchRefreshAnalytics = async () => {
    try {
      const res = await fetch(
        `${API_ENDPOINTS.BASE_URL}/jobs/refresh/analytics?employerEmail=${encodeURIComponent(user?.email || '')}&userPlan=free`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.analytics) {
          const a = data.analytics;
          const totalJobs = a.totalJobs ?? 0;
          const totalRefreshes = a.totalRefreshes ?? 0;
          const maxAllowed = totalJobs * (a.planLimits?.maxRefreshes ?? 3);
          setRefreshStats({
            totalJobs,
            totalRefreshes,
            availableRefreshes: a.availableRefreshes ?? 0,
            refreshesRemaining: Math.max(0, maxAllowed - totalRefreshes),
          });
        }
      }
    } catch (err) {
      console.error('Error fetching refresh analytics:', err);
    }
  };

  const activeJobs = jobs.filter(j => j.isActive || j.status === 'active' || j.status === 'Active');


  const handleJobSelect = (jobId: string) => {
    if (selectedJobs.includes(jobId)) {
      setSelectedJobs(prev => prev.filter(id => id !== jobId));
    } else {
      setSelectedJobs(prev => [...prev, jobId]);
    }
  };

  const getCompanyLogo = (companyName: string) => {
    if (!companyName) return '/images/default-company.png';
    
    const name = companyName.toLowerCase();
    if (name.includes('trinity')) return '/images/company-logos/trinity-logo.png';
    if (name.includes('nambikkai')) return '/images/company-logos/nambikkai-logo.png';
    
    // Generate initials fallback
    const initials = companyName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
    
    return `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <rect width="48" height="48" fill="#3B82F6" rx="8"/>
        <text x="24" y="30" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">${initials}</text>
      </svg>`
    )}`;
  };

  const formatSalary = (salary: any) => {
    if (!salary) return null;
    if (typeof salary === 'string') return salary;
    const CURRENCY_SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', SAR: 'ر.س', SGD: 'S$', MYR: 'RM', THB: '฿', PHP: '₱', IDR: 'Rp', VND: '₫', KRW: '₩', JPY: '¥', CNY: '¥', TWD: 'NT$', HKD: 'HK$', CAD: 'C$', AUD: 'A$', NZD: 'NZ$', CHF: 'Fr', SEK: 'kr', NOK: 'kr', DKK: 'kr', PLN: 'zł', TRY: '₺', ZAR: 'R', BRL: 'R$', MXN: '$', NGN: '₦', KES: 'KSh', EGP: 'E£' };
    const sym = CURRENCY_SYMBOLS[salary.currency] || (salary.currency || '₹');
    if (salary.min && salary.max) {
      if (salary.min === salary.max) return `${sym}${salary.min}L`;
      return `${sym}${salary.min}L - ${sym}${salary.max}L`;
    }
    if (salary.min) return `${sym}${salary.min}L+`;
    if (salary.max) return `Up to ${sym}${salary.max}L`;
    return null;
  };

  const getJobTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'full-time': return 'bg-green-100 text-green-800';
      case 'part-time': return 'bg-blue-100 text-blue-800';
      case 'contract': return 'bg-purple-100 text-purple-800';
      case 'internship': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canRefreshJob = (job: Job) => {
    const refreshCount = job.refreshCount || 0;
    const lastRefreshed = job.lastRefreshedAt;
    
    // Free plan: 3 refreshes, 7 days cooldown
    if (refreshCount >= 3) return false;
    
    if (lastRefreshed) {
      const daysSince = Math.floor(
        (Date.now() - new Date(lastRefreshed).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince < 7) return false;
    }
    
    return true;
  };

  const refreshableJobs = activeJobs.filter(canRefreshJob);
  const nonRefreshableJobs = activeJobs.filter(job => !canRefreshJob(job));

  const orderedJobs = [...refreshableJobs, ...nonRefreshableJobs];
  const totalPages = Math.max(1, Math.ceil(orderedJobs.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const pageJobs = orderedJobs.slice((activePage - 1) * pageSize, activePage * pageSize);
  const pageRefreshableJobs = pageJobs.filter(canRefreshJob);
  const pageUnavailableJobs = pageJobs.filter(job => !canRefreshJob(job));
  const changePage = (page: number) => {
    setCurrentPage(page);
    setSelectedJobs([]);
    document.getElementById('refresh-jobs-list')?.scrollIntoView({block:'start', behavior:'smooth'});
  };
  const isAllRefreshableSelected = pageRefreshableJobs.length > 0 && pageRefreshableJobs.every(job => selectedJobs.includes(job.id || job._id!));

  const handleSelectAll = () => {
    if (isAllRefreshableSelected) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(pageRefreshableJobs.map(job => job.id || job._id!));
    }
  };

  return (
    <div className="job-refresh-page min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <div className="portal-page-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="job-refresh-heading flex items-center gap-4 mb-4 sm:mb-6">
          <BackButton 
            fallback="/my-jobs"
            className=""
          />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Job Refresh Center</h1>
            <p className="text-gray-600 text-sm sm:text-base">Manage refresh eligibility and keep active job postings up to date.</p>
          </div>
        </div>

        <section className="job-refresh-guide" aria-label="How job refresh works">
          <svg viewBox="0 0 180 150" role="img" aria-label="Zync assistant refreshing a job card">
            <circle cx="90" cy="75" r="67" fill="#e6edff" />
            <rect x="80" y="27" width="82" height="97" rx="12" fill="white" stroke="#b8cbed" strokeWidth="2" />
            <rect x="94" y="43" width="49" height="6" rx="3" fill="#c4d2eb" /><rect x="94" y="57" width="35" height="5" rx="2" fill="#e0e7f3" />
            <path d="M112 79a15 15 0 1 1-9 13m9-13v12h-12" fill="none" stroke="#245be0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="24" y="53" width="64" height="51" rx="17" fill="#245be0" /><rect x="33" y="62" width="46" height="32" rx="10" fill="#183452" />
            <circle cx="46" cy="75" r="4" fill="white" /><circle cx="66" cy="75" r="4" fill="white" /><path d="M48 86h15" stroke="#a9dfff" strokeWidth="3" strokeLinecap="round" />
            <path d="M56 53V43" stroke="#245be0" strokeWidth="4" /><circle cx="56" cy="40" r="5" fill="#7cb3ff" />
            <rect x="37" y="108" width="38" height="23" rx="9" fill="#a8c3ff" /><path d="M25 113l-9 11m65-11 10 9" stroke="#245be0" strokeWidth="7" strokeLinecap="round" />
          </svg>
          <div><h2>Give an active job a fresh update</h2><p>Choose an eligible job and use Refresh, or select several jobs to refresh them together. Check each job's refresh status before you continue.</p><span>Current free-plan limits: 3 refreshes per job, with 7 days between refreshes.</span></div>
        </section>

        {/* Free Plan & Upgrade - TODO: enable after complete structure is built */}
        {/* <div className="mb-8">
          <div className="flex items-center justify-end gap-3">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Free Plan</span>
              </div>
            </div>
            <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm">
              Upgrade to Pro
            </button>
          </div>
        </div> */}

        {/* Enhanced Stats Cards */}
        <div className="job-refresh-summary grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Card 1 — Total refreshes done across all jobs */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-200 px-2 py-1 rounded-full">Used</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 mb-1">{refreshStats.totalRefreshes}</p>
            <p className="text-sm text-blue-700">Refreshes Used</p>
          </div>

          {/* Card 2 — Remaining quota: (totalJobs × 3) - totalRefreshes */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-200 px-2 py-1 rounded-full">Remaining</span>
            </div>
            <p className="text-2xl font-bold text-green-900 mb-1">{refreshStats.refreshesRemaining}</p>
            <p className="text-sm text-green-700">Refreshes Remaining</p>
          </div>

          {/* Card 3 — Jobs eligible to refresh right now */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-purple-600 bg-purple-200 px-2 py-1 rounded-full">Ready</span>
            </div>
            <p className="text-2xl font-bold text-purple-900 mb-1">{refreshStats.availableRefreshes}</p>
            <p className="text-sm text-purple-700">Jobs Ready to Refresh</p>
          </div>

          {/* Card 4 — Total active jobs from backend */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-orange-600 bg-orange-200 px-2 py-1 rounded-full">Total</span>
            </div>
            <p className="text-2xl font-bold text-orange-900 mb-1">{refreshStats.totalJobs}</p>
            <p className="text-sm text-orange-700">Active Jobs</p>
          </div>
        </div>

        {/* Bulk Actions */}
        {refreshableJobs.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={isAllRefreshableSelected}
                    onChange={handleSelectAll}
                    className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Select eligible jobs on this page</span>
                </label>
                <span className="text-sm text-gray-500">
                  {selectedJobs.filter(id => pageRefreshableJobs.some(j => (j.id || j._id!) === id)).length} of {pageRefreshableJobs.length} selected
                </span>
              </div>
              
              <BulkJobRefresh
                selectedJobIds={selectedJobs}
                selectedJobs={refreshableJobs.filter(job => selectedJobs.includes(job.id || job._id!)).map(job => ({
                  id: job.id || job._id!,
                  title: job.jobTitle || job.title || 'Job Position',
                  refreshCount: job.refreshCount || 0,
                  lastRefreshedAt: job.lastRefreshedAt
                }))}
                userPlan="free"
                onRefreshComplete={() => {
                  fetchEmployerJobs();
                  fetchRefreshAnalytics();
                  setSelectedJobs([]);
                }}
              />
            </div>
          </div>
        )}

        <div id="refresh-jobs-list" />
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Refreshable Jobs */}
            {pageRefreshableJobs.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-green-600" />
                  Available for Refresh ({refreshableJobs.length})
                </h2>
                <div className="space-y-4">
                  {pageRefreshableJobs.map((job) => {
                    const jobId = job.id || job._id!;
                    const salary = formatSalary(job.salary);
                    return (
                      <div key={jobId} className="portal-job-card portal-job-card-framed employer-job-card group relative bg-white rounded-2xl border border-gray-200 hover:border-green-300 hover:shadow-xl transition-all duration-300 overflow-hidden">
                        {/* Success Header */}
                        <div className="h-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500"></div>
                        
                        <div className="p-6">
                          {/* Header Section */}
                          <div className="flex items-start gap-4 mb-4">
                            {/* Checkbox */}
                            <div className="flex-shrink-0 pt-1">
                              <input
                                type="checkbox"
                                checked={selectedJobs.includes(jobId)}
                                onChange={() => handleJobSelect(jobId)}
                                className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </div>
                            
                            {/* Company Logo */}
                            <div className="flex-shrink-0">
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 flex items-center justify-center shadow-sm">
                                <img
                                  src={getCompanyLogo(job.company)}
                                  alt={`${job.company || 'Company'} logo`}
                                  className="w-10 h-10 object-contain"
                                  onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    const initials = (job.company || 'C').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                                    img.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#10b981"/><text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">${initials}</text></svg>`)}`;
                                  }}
                                />
                              </div>
                            </div>
                            
                            {/* Company Info & Date */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-bold text-green-600 uppercase tracking-wider">{job.company || 'Unknown Company'}</h4>
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                  Posted {new Date(job.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              
                              {/* Job Title */}
                              <h3 
                                onClick={() => onNavigate('job-detail', { jobId })}
                                className="text-xl font-bold text-gray-900 hover:text-green-600 cursor-pointer mb-3 line-clamp-2 leading-tight"
                              >
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
                            
                            {salary && (
                              <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                                <span className="text-sm font-semibold text-green-700">{salary}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
                              <span className="text-sm font-medium text-blue-700">{job.type || 'Full-time'}</span>
                            </div>
                          </div>

                          {/* Status Badges */}
                          <div className="flex items-center gap-3 mb-4">
                            <span className="inline-flex items-center gap-1.5 text-sm bg-green-100 text-green-800 px-3 py-1.5 rounded-full font-medium border border-green-200">
                              <CheckSquare className="w-4 h-4" />
                              Ready to Refresh
                            </span>
                            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                              {job.refreshCount || 0}/3 refreshes used
                            </span>
                            {job.applicationCount && (
                              <div className="flex items-center gap-1.5 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                                <Users className="w-4 h-4" />
                                <span>{job.applicationCount} applications</span>
                              </div>
                            )}
                          </div>
                          
                          <RefreshStatusIndicator
                            refreshCount={job.refreshCount}
                            lastRefreshedAt={job.lastRefreshedAt}
                            maxRefreshes={3}
                            className="mb-4"
                          />
                          
                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-2">
                            <JobRefreshButton
                              jobId={jobId}
                              jobTitle={job.jobTitle || job.title || 'Job Position'}
                              refreshCount={job.refreshCount || 0}
                              lastRefreshedAt={job.lastRefreshedAt}
                              userPlan="free"
                              onRefreshSuccess={() => {
                                fetchEmployerJobs();
                                fetchRefreshAnalytics();
                              }}
                              className="flex-1 text-sm"
                            />
                            <button
                              onClick={() => onNavigate('job-detail', { jobId: jobId })}
                              className="px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-100 hover:border-gray-300 transition-all text-sm flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Non-Refreshable Jobs */}
            {pageUnavailableJobs.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  In Cooldown or Limit Reached ({nonRefreshableJobs.length})
                </h2>
                <div className="space-y-4">
                  {pageUnavailableJobs.map((job) => {
                    const jobId = job.id || job._id!;
                    const refreshCount = job.refreshCount || 0;
                    const isLimitReached = refreshCount >= 3;
                    const salary = formatSalary(job.salary);
                    
                    return (
                      <div key={jobId} className="portal-job-card portal-job-card-framed employer-job-card employer-job-card-inactive group relative bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden opacity-75">
                        {/* Warning Header */}
                        <div className="h-2 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500"></div>
                        
                        <div className="p-6">
                          {/* Header Section */}
                          <div className="flex items-start gap-4 mb-4">
                            {/* Company Logo */}
                            <div className="flex-shrink-0">
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 flex items-center justify-center shadow-sm">
                                <img
                                  src={getCompanyLogo(job.company)}
                                  alt={`${job.company || 'Company'} logo`}
                                  className="w-10 h-10 object-contain opacity-60"
                                  onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    const initials = (job.company || 'C').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                                    img.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#6B7280"/><text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">${initials}</text></svg>`)}`;
                                  }}
                                />
                              </div>
                            </div>
                            
                            {/* Company Info & Date */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{job.company || 'Unknown Company'}</h4>
                                <span className="text-xs font-medium text-gray-400 bg-gray-200 px-3 py-1 rounded-full">
                                  Posted {new Date(job.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              
                              {/* Job Title */}
                              <h3 className="text-xl font-bold text-gray-700 mb-3 line-clamp-2 leading-tight">
                                {job.jobTitle || job.title}
                              </h3>
                            </div>
                          </div>
                          
                          {/* Job Details Tags */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            <div className="flex items-center gap-1.5 bg-gray-200 border border-gray-300 px-3 py-1.5 rounded-lg">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-600">{job.location}</span>
                            </div>
                            
                            {salary && (
                              <div className="flex items-center gap-1.5 bg-gray-200 border border-gray-300 px-3 py-1.5 rounded-lg">
                                <span className="text-sm font-semibold text-gray-600">{salary}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1.5 bg-gray-200 border border-gray-300 px-3 py-1.5 rounded-lg">
                              <span className="text-sm font-medium text-gray-600">{job.type || 'Full-time'}</span>
                            </div>
                          </div>

                          {/* Status Badges */}
                          <div className="flex items-center gap-3 mb-4">
                            {isLimitReached ? (
                              <span className="inline-flex items-center gap-1.5 text-sm bg-red-100 text-red-800 px-3 py-1.5 rounded-full font-medium border border-red-200">
                                <AlertCircle className="w-4 h-4" />
                                Refresh Limit Reached
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-sm bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full font-medium border border-orange-200">
                                <Clock className="w-4 h-4" />
                                In Cooldown Period
                              </span>
                            )}
                            <span className="text-sm text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                              {refreshCount}/3 refreshes used
                            </span>
                            {job.applicationCount && (
                              <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-200 px-3 py-1 rounded-full border border-gray-300">
                                <Users className="w-4 h-4" />
                                <span>{job.applicationCount} applications</span>
                              </div>
                            )}
                          </div>
                          
                          <RefreshStatusIndicator
                            refreshCount={job.refreshCount}
                            lastRefreshedAt={job.lastRefreshedAt}
                            maxRefreshes={3}
                            className="mb-4"
                          />
                          
                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-2">
                            <button
                              disabled
                              className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-500 rounded-xl cursor-not-allowed text-sm font-medium"
                            >
                              {isLimitReached ? 'Limit Reached' : 'In Cooldown'}
                            </button>
                            <button 
                              onClick={() => onNavigate('job-detail', { jobId })}
                              className="px-4 py-2.5 bg-gray-200 border border-gray-300 text-gray-500 rounded-xl font-medium hover:bg-gray-300 transition-all text-sm flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {orderedJobs.length > 0 && <nav className="job-management-pagination" aria-label="Refresh job pages">
              <span>Showing {(activePage - 1) * pageSize + 1}-{Math.min(activePage * pageSize, orderedJobs.length)} of {orderedJobs.length} jobs</span>
              <div><button disabled={activePage === 1} onClick={() => changePage(activePage - 1)}>Previous</button><span aria-live="polite">Page {activePage} of {totalPages}</span><button disabled={activePage === totalPages} onClick={() => changePage(activePage + 1)}>Next</button></div>
            </nav>}
            {jobs.length === 0 && (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <RefreshCw className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No Jobs to Refresh</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    Start posting jobs to unlock the power of strategic refreshes and boost your visibility to top candidates.
                  </p>
                  <button
                    onClick={() => onNavigate('job-posting-selection')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Post Your First Job
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default JobRefreshManagementPage;