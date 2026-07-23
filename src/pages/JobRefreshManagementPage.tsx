import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, CheckSquare, AlertCircle, TrendingUp, Calendar, MapPin, Briefcase, Building2, Eye, Users, BarChart3, Zap } from 'lucide-react';
import { API_ENDPOINTS } from '../config/env';
import { tokenStorage } from '../utils/tokenStorage';
import { getId } from '../utils/getId';
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
  const [refreshStats, setRefreshStats] = useState({
    totalRefreshes: 0,
    remainingRefreshes: 0,
    nextRefreshDate: null as string | null
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
      const response = await fetch(
        `${API_ENDPOINTS.BASE_URL}/jobs/refresh/analytics?employerEmail=${encodeURIComponent(user?.email || '')}&userPlan=free`
      );
      if (response.ok) {
        const analytics = await response.json();
        setRefreshStats(analytics);
      }
    } catch (error) {
      console.error('Error fetching refresh analytics:', error);
    }
  };



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

  const refreshableJobs = jobs.filter(canRefreshJob);
  const nonRefreshableJobs = jobs.filter(job => !canRefreshJob(job));

  const isAllRefreshableSelected = refreshableJobs.length > 0 && refreshableJobs.every(job => selectedJobs.includes(job.id || job._id!));

  const handleSelectAll = () => {
    if (isAllRefreshableSelected) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(refreshableJobs.map(job => job.id || job._id!));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center gap-4 mb-4 sm:mb-6">
          <BackButton 
            onClick={() => onNavigate('my-jobs')}
            className=""
          />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Job Refresh Center</h1>
            <p className="text-gray-600 text-sm sm:text-base">Boost your job visibility and attract top talent</p>
          </div>
        </div>
        <div className="mb-8">
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
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-200 px-2 py-1 rounded-full">Total</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 mb-1">{refreshStats.totalRefreshes}</p>
            <p className="text-sm text-blue-700">Refreshes Used</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-200 px-2 py-1 rounded-full">Available</span>
            </div>
            <p className="text-2xl font-bold text-green-900 mb-1">{refreshStats.remainingRefreshes}</p>
            <p className="text-sm text-green-700">Refreshes Left</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-purple-600 bg-purple-200 px-2 py-1 rounded-full">Ready</span>
            </div>
            <p className="text-2xl font-bold text-purple-900 mb-1">{refreshableJobs.length}</p>
            <p className="text-sm text-purple-700">Jobs Ready</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-orange-600 bg-orange-200 px-2 py-1 rounded-full">Total</span>
            </div>
            <p className="text-2xl font-bold text-orange-900 mb-1">{jobs.length}</p>
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
                  <span className="text-sm font-medium text-gray-700">Select All Refreshable Jobs</span>
                </label>
                <span className="text-sm text-gray-500">
                  {selectedJobs.filter(id => refreshableJobs.some(j => (j.id || j._id!) === id)).length} of {refreshableJobs.length} selected
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

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Refreshable Jobs */}
            {refreshableJobs.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-green-600" />
                  Available for Refresh ({refreshableJobs.length})
                </h2>
                <div className="space-y-4">
                  {refreshableJobs.map((job) => {
                    const jobId = job.id || job._id!;
                    const salary = formatSalary(job.salary);
                    return (
                      <div key={jobId} className="group relative bg-white rounded-2xl border border-gray-200 hover:border-green-300 hover:shadow-xl transition-all duration-300 overflow-hidden">
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
            {nonRefreshableJobs.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  In Cooldown or Limit Reached ({nonRefreshableJobs.length})
                </h2>
                <div className="space-y-4">
                  {nonRefreshableJobs.map((job) => {
                    const jobId = job.id || job._id!;
                    const refreshCount = job.refreshCount || 0;
                    const isLimitReached = refreshCount >= 3;
                    const salary = formatSalary(job.salary);
                    
                    return (
                      <div key={jobId} className="group relative bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden opacity-75">
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