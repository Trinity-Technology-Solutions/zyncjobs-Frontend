import React, { useState, useEffect } from 'react';
import { LayoutDashboard, User, Briefcase, MessageSquare, FileText, Bookmark, CreditCard, Settings, Trash2, LogOut, Search, Bell, Plus, MoreVertical, Users, Eye, Edit, UserPlus, FileSearch, Folder, MapPin, Mail } from 'lucide-react';
import { API_ENDPOINTS } from '../config/constants';
import { decodeHtmlEntities, formatDate, formatSalary } from '../utils/textUtils';
import BackButton from '../components/BackButton';
import AutoRejectionSettings from '../components/AutoRejectionSettings';
import ScheduleInterviewModal from '../components/ScheduleInterviewModal';
import NotificationService, { Notification } from '../services/notificationService';

interface EmployerDashboardPageProps {
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

const EmployerDashboardPage: React.FC<EmployerDashboardPageProps> = ({ onNavigate, onLogout }) => {
  const [user, setUser] = useState<any>(null);
  const [employerName, setEmployerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [savedCandidates, setSavedCandidates] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_ENDPOINTS.SAVED_CANDIDATES}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const candidates = Array.isArray(data) ? data : data.savedCandidates || [];
        setSavedCandidates(candidates);
      })
      .catch(err => {
        console.error('Error fetching saved candidates:', err);
        setSavedCandidates([]);
      });
    }
    
    // Listen for candidate saved events
    const handleCandidateSaved = (event: CustomEvent) => {
      console.log('Candidate saved event received:', event.detail);
      // Refresh saved candidates list
      if (token) {
        fetch(`${API_ENDPOINTS.SAVED_CANDIDATES}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          const candidates = Array.isArray(data) ? data : data.savedCandidates || [];
          setSavedCandidates(candidates);
        })
        .catch(err => {
          console.error('Error refreshing saved candidates:', err);
        });
      }
    };
    
    window.addEventListener('candidateSaved', handleCandidateSaved as EventListener);
    
    return () => {
      window.removeEventListener('candidateSaved', handleCandidateSaved as EventListener);
    };
  }, []);

  useEffect(() => {
    if (activeMenu === 'saved-candidates') {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Fetching saved candidates for active menu...');
        fetch(`${API_ENDPOINTS.SAVED_CANDIDATES}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(res => {
          console.log('Saved candidates response:', res.status);
          return res.ok ? res.json() : [];
        })
        .then(data => {
          console.log('Saved candidates data:', data);
          const candidates = Array.isArray(data) ? data : data.savedCandidates || [];
          setSavedCandidates(candidates);
        })
        .catch(err => {
          console.error('Error fetching saved candidates:', err);
          setSavedCandidates([]);
        });
      }
    }
  }, [activeMenu]);

  useEffect(() => {
    // Fetch dynamic notifications using the notification service
    const fetchNotifications = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          const userEmail = parsedUser.email;
          
          console.log('Fetching dynamic notifications for:', userEmail);
          
          // Use the notification service to fetch dynamic notifications
          const dynamicNotifications = await NotificationService.fetchNotifications(userEmail);
          console.log('Dynamic notifications received:', dynamicNotifications);
          setNotifications(dynamicNotifications);
        }
      } catch (error) {
        console.error('Error fetching dynamic notifications:', error);
        // Fallback to creating notifications from activity if API fails
        createFallbackNotifications();
      }
    };
    
    const createFallbackNotifications = () => {
      // Use the notification service to create fallback notifications
      const fallbackNotifications = NotificationService.createFallbackNotifications(
        applications, 
        interviews, 
        jobs
      );
      
      console.log('Using fallback notifications:', fallbackNotifications.length);
      setNotifications(fallbackNotifications);
    };
    
    // Initial fetch
    fetchNotifications();
    
    // Set up real-time updates - fetch every 30 seconds
    const notificationInterval = setInterval(fetchNotifications, 30000);
    
    return () => {
      clearInterval(notificationInterval);
    };
  }, [applications, interviews, jobs]); // Depend on real data

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      console.log('Dashboard - User data:', parsedUser);
      
      // Force clear any cached state that might interfere
      setJobs([]);
      setApplications([]);
      setInterviews([]);
      setDashboardStats(null);
      setRecentActivity([]);
      
      setUser(parsedUser);
      setEmployerName(parsedUser.name || 'Employer');
      // Fix: Use actual company name from registration, not generic 'Company'
      const actualCompanyName = parsedUser.companyName || parsedUser.company || parsedUser.organizationName || 'Company';
      setCompanyName(actualCompanyName);
      setCompanyLogo(parsedUser.companyLogo || '');
      setCompanyWebsite(parsedUser.companyWebsite || '');
      
      // Fetch company domain from companies.json
      fetchCompanyDomain(actualCompanyName);
      
      fetchDashboardData(parsedUser);
    }
    
    // Listen for alerts navigation event from header
    const handleShowAlerts = () => {
      console.log('Show alerts event received');
      setActiveMenu('alerts');
    };
    
    // Listen for applications navigation event from header
    const handleShowApplications = () => {
      console.log('Show applications event received');
      setActiveMenu('applications');
    };
    
    window.addEventListener('showAlerts', handleShowAlerts);
    window.addEventListener('showApplications', handleShowApplications);
    
    return () => {
      window.removeEventListener('showAlerts', handleShowAlerts);
      window.removeEventListener('showApplications', handleShowApplications);
    };
  }, []);

  const fetchCompanyDomain = async (companyName: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/companies`);
      if (response.ok) {
        const companies = await response.json();
        console.log('Companies loaded:', companies.length);
        
        // Try exact match first
        let company = companies.find((c: any) => 
          c.name.toLowerCase() === companyName.toLowerCase()
        );
        
        // If no exact match, try partial match
        if (!company) {
          company = companies.find((c: any) => 
            c.name.toLowerCase().includes(companyName.toLowerCase()) ||
            companyName.toLowerCase().includes(c.name.toLowerCase())
          );
        }
        
        if (company) {
          console.log('Found company:', company.name, 'domain:', company.domain);
          setCompanyDomain(company.domain);
        } else {
          console.log('Company not found in database:', companyName);
        }
      } else {
        console.warn('Companies API returned error:', response.status);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  // Add effect to refresh data when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('Dashboard became visible, refreshing data...');
        fetchDashboardData(user);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  // Add effect to refresh data when returning to dashboard
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        console.log('Window focused, refreshing dashboard data...');
        fetchDashboardData(user);
      }
    };
    
    const handleJobDeleted = () => {
      if (user) {
        console.log('Job deleted event received, refreshing dashboard data...');
        fetchDashboardData(user);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('jobDeleted', handleJobDeleted);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('jobDeleted', handleJobDeleted);
    };
  }, [user]);

  const fetchDashboardData = async (userData: any) => {
    try {
      setError(null);
      console.log('Fetching dashboard data for user:', userData);
      
      // Get user ID - try different possible fields
      const userId = userData.id || userData._id || userData.userId;
      const userEmail = userData.email;
      const userName = userData.name || userData.fullName;
      
      console.log('Using userId:', userId, 'userEmail:', userEmail, 'userName:', userName);
      
      // Fetch data with individual error handling for each endpoint
      let employerJobs = [];
      let employerApps = [];
      let dashboardStats = { activeJobs: 0, applications: 0, interviews: 0, hired: 0 };
      let recentActivity = [];
      
      // Fetch Jobs
      try {
        console.log('Fetching jobs from:', API_ENDPOINTS.JOBS);
        const jobsRes = await fetch(API_ENDPOINTS.JOBS);
        if (jobsRes.ok) {
          const allJobs = await jobsRes.json();
          console.log('Dashboard - All jobs:', allJobs.length);
          employerJobs = Array.isArray(allJobs) ? allJobs.filter((job: any) => {
            const matchesEmail = job.postedBy === userEmail;
            console.log(`Job: ${job.jobTitle} at ${job.company}, matchesEmail: ${matchesEmail}`);
            return matchesEmail;
          }) : [];
          console.log('Dashboard - Filtered employer jobs:', employerJobs.length);
          setJobs(employerJobs);
          dashboardStats.activeJobs = employerJobs.length;
        } else {
          const errorText = await jobsRes.text().catch(() => 'Unknown error');
          console.error('Jobs API returned error:', jobsRes.status, jobsRes.statusText);
          console.error('Jobs API error details:', errorText);
          
          // Set more specific error message based on status code
          if (jobsRes.status === 500) {
            setError('Server error while loading jobs. The backend server may be experiencing issues. Please try again later or contact support.');
          } else if (jobsRes.status === 404) {
            setError('Jobs API endpoint not found. Please check if the server is properly configured.');
          } else {
            setError(`Failed to load jobs: ${jobsRes.status} ${jobsRes.statusText}`);
          }
          setJobs([]);
        }
      } catch (error) {
        console.error('Jobs API network error:', error);
        setError('Network error while loading jobs. Please check your internet connection and try again.');
        setJobs([]);
      }

      // Fetch Applications
      try {
        const appsRes = await fetch(API_ENDPOINTS.APPLICATIONS);
        if (appsRes.ok) {
          const response = await appsRes.json();
          const allApps = response.applications || response || [];
          console.log('Dashboard - All applications:', allApps.length);
          
          // Fetch job details for each application
          const appsWithJobDetails = await Promise.all(
            allApps.map(async (app: any) => {
              try {
                const appJobId = app.jobId?.id || app.jobId?._id || app.jobId;
                console.log('Processing application:', app.candidateName, 'jobId:', appJobId);
                
                if (appJobId && typeof appJobId === 'string' && appJobId !== 'undefined') {
                  const jobRes = await fetch(`${API_ENDPOINTS.JOBS}/${appJobId}`);
                  if (jobRes.ok) {
                    const jobData = await jobRes.json();
                    console.log('Fetched job data for', appJobId, ':', jobData.jobTitle || jobData.title);
                    return { ...app, jobTitle: jobData.jobTitle || jobData.title || 'Job Position' };
                  } else {
                    console.log('Job fetch failed for', appJobId, ':', jobRes.status);
                  }
                } else {
                  console.log('No valid jobId for application:', app.candidateName);
                }
              } catch (e) {
                console.log('Failed to fetch job for application:', app._id || app.id, e);
              }
              return app;
            })
          );
          
          employerApps = Array.isArray(appsWithJobDetails) ? appsWithJobDetails.filter((app: any) => {
            const matchesEmail = app.employerEmail === userEmail;
            console.log(`App: ${app.candidateName}, matchesEmail: ${matchesEmail}`);
            return matchesEmail;
          }) : [];
          console.log('Dashboard - Filtered employer applications:', employerApps.length);
          setApplications(employerApps);
          dashboardStats.applications = employerApps.length;
        } else {
          console.warn('Applications API returned error:', appsRes.status);
          setApplications([]);
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
        setApplications([]);
      }

      // Fetch Interviews (with error handling)
      try {
        const interviewsRes = await fetch(`${API_ENDPOINTS.BASE_URL}/interviews?employerId=${encodeURIComponent(userId || '')}&employerEmail=${encodeURIComponent(userEmail || '')}`);
        if (interviewsRes.ok) {
          const interviewsData = await interviewsRes.json();
          const interviewsArray = Array.isArray(interviewsData) ? interviewsData : [];
          const now = new Date();
          
          // Fetch job details for each interview
          const interviewsWithJobDetails = await Promise.all(
            interviewsArray.map(async (interview: any) => {
              try {
                const jobId = interview.jobId?.id || interview.jobId?._id || interview.jobId;
                if (jobId && typeof jobId === 'string') {
                  const jobRes = await fetch(`${API_ENDPOINTS.JOBS}/${jobId}`);
                  if (jobRes.ok) {
                    const jobData = await jobRes.json();
                    return { ...interview, jobTitle: jobData.jobTitle || jobData.title || 'Interview' };
                  }
                }
              } catch (e) {
                console.log('Failed to fetch job for interview:', interview._id);
              }
              return interview;
            })
          );
          
          // Filter out past interviews and completed/cancelled status interviews
          const filteredInterviews = interviewsWithJobDetails.filter((interview: any) => {
            const interviewDate = new Date(interview.date);
            const isPast = interviewDate < now;
            const isCompletedOrCancelled = interview.status === 'completed' || interview.status === 'cancelled';
            return !isPast && !isCompletedOrCancelled;
          });
          
          setInterviews(filteredInterviews);
          dashboardStats.interviews = filteredInterviews.length;
        } else {
          console.warn('Interviews API returned error:', interviewsRes.status);
          setInterviews([]);
        }
      } catch (error) {
        console.error('Error fetching interviews:', error);
        setInterviews([]);
      }

      // Fetch Dashboard Stats (with error handling)
      try {
        const statsRes = await fetch(`${API_ENDPOINTS.BASE_URL}/dashboard/stats?employerId=${encodeURIComponent(userId || '')}&employerEmail=${encodeURIComponent(userEmail || '')}&userName=${encodeURIComponent(userName || '')}`);
        if (statsRes.ok) {
          const stats = await statsRes.json();
          dashboardStats = { ...dashboardStats, ...stats };
        } else {
          console.warn('Stats API returned error:', statsRes.status);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
      setDashboardStats(dashboardStats);

      // Fetch Recent Activity (with error handling)
      try {
        const activityRes = await fetch(`${API_ENDPOINTS.BASE_URL}/dashboard/recent-activity?employerId=${encodeURIComponent(userId || '')}&employerEmail=${encodeURIComponent(userEmail || '')}&userName=${encodeURIComponent(userName || '')}`);
        if (activityRes.ok) {
          const activity = await activityRes.json();
          recentActivity = activity;
        } else {
          console.warn('Activity API returned error:', activityRes.status);
        }
      } catch (error) {
        console.error('Error fetching activity:', error);
      }
      
      // If no activity from API, create from local jobs
      if (recentActivity.length === 0 && employerJobs.length > 0) {
        recentActivity = employerJobs.slice(0, 3).map(job => ({
          type: 'job',
          message: 'Job posted successfully',
          time: '1 day ago',
          details: { jobTitle: job.jobTitle || job.title }
        }));
      }
      setRecentActivity(recentActivity);
      
    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
      setError('Some dashboard data could not be loaded. Please refresh the page.');
      // Set fallback empty states
      setApplications([]);
      setJobs([]);
      setInterviews([]);
      setDashboardStats({ activeJobs: 0, applications: 0, interviews: 0, hired: 0 });
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackLogo = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=6366f1&color=ffffff&bold=true`;
  };

  const getDisplayLogo = () => {
    console.log('getDisplayLogo - companyLogo:', companyLogo);
    console.log('getDisplayLogo - companyName:', companyName);
    console.log('getDisplayLogo - user email:', user?.email);
    
    // Check if user is from Trinity Technology Solutions
    if (user?.email && user.email.includes('@trinitetech')) {
      console.log('Using Trinity logo for trinitetech employee');
      // Try Trinity logo with fallback
      const trinityLogo = '/images/company-logos/trinity-logo.png';
      return trinityLogo;
    }
    
    // First try to use company logo from user data
    if (companyLogo && companyLogo.trim() !== '' && !companyLogo.includes('clearbit.com') && !companyLogo.includes('gstatic.com')) {
      console.log('Using stored company logo:', companyLogo);
      return companyLogo;
    }
    
    // Try to get logo from company name using Clearbit
    if (companyName && companyName.trim() !== '' && companyName !== 'Company') {
      const companyDomain = companyName.toLowerCase().replace(/\s+/g, '') + '.com';
      console.log('Trying Clearbit logo for:', companyDomain);
      return `https://logo.clearbit.com/${companyDomain}`;
    }
    
    // Try to extract company name from email domain
    if (user?.email && user.email.includes('@')) {
      const emailDomain = user.email.split('@')[1];
      if (emailDomain && !emailDomain.includes('gmail') && !emailDomain.includes('yahoo') && !emailDomain.includes('outlook')) {
        console.log('Trying Clearbit logo for email domain:', emailDomain);
        return `https://logo.clearbit.com/${emailDomain}`;
      }
    }
    
    // Fallback to avatar with company name or employer name
    const displayName = companyName && companyName !== 'Company' ? companyName : employerName;
    console.log('Using fallback avatar for:', displayName);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=128&background=6366f1&color=ffffff&bold=true`;
  };

  const getJobCompanyLogo = (job: any) => {
    const company = job.company || job.companyName || companyName;
    
    if (job.companyLogo && !job.companyLogo.includes('clearbit.com') && !job.companyLogo.includes('gstatic.com')) {
      return job.companyLogo;
    }
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&size=40&background=6366f1&color=ffffff&bold=true`;
  };

  const stats = [
    { 
      label: 'Active Jobs', 
      value: dashboardStats?.activeJobs?.toString() || '0', 
      icon: Briefcase, 
      color: 'text-blue-600' 
    },
    { 
      label: 'Applications', 
      value: dashboardStats?.applications?.toString() || '0', 
      icon: FileText, 
      color: 'text-green-600' 
    },
    { 
      label: 'Interviews', 
      value: dashboardStats?.interviews?.toString() || '0', 
      icon: Users, 
      color: 'text-orange-600' 
    },
    { 
      label: 'Hired', 
      value: dashboardStats?.hired?.toString() || '0', 
      icon: UserPlus, 
      color: 'text-purple-600' 
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto flex min-h-screen bg-gray-50">
      {/* Error Display */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 max-w-md">
          <div className="flex items-start">
            <span className="mr-2 mt-0.5">⚠️</span>
            <div className="flex-1">
              <div className="font-medium">Dashboard Loading Issue</div>
              <div className="text-sm mt-1">{error}</div>
              <div className="text-xs mt-2 text-red-600">Some features may not work properly. Please refresh the page or contact support if the issue persists.</div>
            </div>
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-red-500 hover:text-red-700 font-bold text-lg leading-none"
              title="Close error message"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        {/* User Profile */}
        <div className="p-6 border-b border-gray-200">
          <BackButton 
            onClick={() => window.history.back()}
            text="Back"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors mb-4"
          />
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={getDisplayLogo()}
                alt={companyName || employerName}
                className="w-16 h-16 rounded-full object-cover border-2 border-blue-200 shadow-md"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  console.log('Logo failed to load:', img.src);
                  console.log('Using fallback avatar');
                  const displayName = companyName || employerName;
                  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=128&background=6366f1&color=ffffff&bold=true`;
                  
                  // Prevent infinite loop by checking if we're already using fallback
                  if (img.src !== fallbackUrl) {
                    img.src = fallbackUrl;
                  }
                }}
              />
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-base">{employerName}</p>
              <p className="text-sm text-gray-600 font-medium">
                {companyName && companyName !== 'Company' ? companyName : 
                 user?.email?.includes('@trinitetech') ? 'Trinity Technology Solutions' :
                 user?.email?.includes('@') ? user.email.split('@')[1].split('.')[0].charAt(0).toUpperCase() + user.email.split('@')[1].split('.')[0].slice(1) :
                 'Company'}
              </p>
              {/* Display Employer ID */}
              {user?.employerId && (
                <p className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded mt-1">
                  EID: {user.employerId}
                </p>
              )}
              {companyDomain && (
                <a 
                  href={`https://${companyDomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700 block truncate mt-1"
                >
                  {companyDomain}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveMenu('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeMenu === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </button>
          
          <button
            onClick={() => onNavigate('settings')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="font-medium">My Profile</span>
          </button>

          <button
            onClick={() => setActiveMenu('applications')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeMenu === 'applications' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Applications</span>
            {applications.length > 0 && (
              <span className="ml-auto bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {applications.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveMenu('interviews')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeMenu === 'interviews' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Interviews</span>
            {interviews.length > 0 && (
              <span className="ml-auto bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {interviews.length}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate('my-jobs')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Briefcase className="w-5 h-5" />
            <span className="font-medium">Posted Jobs</span>
            {jobs.length > 0 && (
              <span className="ml-auto bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {jobs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate('job-posting-selection')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Submit Job</span>
          </button>

          <button
            onClick={() => setActiveMenu('auto-rejection')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeMenu === 'auto-rejection' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">AI Rejection</span>
          </button>

          <button
            onClick={() => onNavigate('candidate-search')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Search className="w-5 h-5" />
            <span className="font-medium">Search Candidates</span>
          </button>

          <button
            onClick={() => setActiveMenu('saved-candidates')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeMenu === 'saved-candidates' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Bookmark className="w-5 h-5" />
            <span className="font-medium">Saved Candidates</span>
          </button>

          <button
            onClick={() => setActiveMenu('alerts')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeMenu === 'alerts' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span className="font-medium">Alerts</span>
            {notifications.length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {notifications.length}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate('settings')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Account Settings</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Once you delete your account, there is no going back. Please be certain.')) {
                console.log('Delete account feature coming soon');
              }
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            <span className="font-medium">Delete Account</span>
          </button>
        </nav>



        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => {
              if (onLogout) {
                onLogout();
              } else {
                localStorage.removeItem('user');
                onNavigate('home');
              }
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search here.."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4 ml-6">
              <button
                onClick={() => onNavigate('job-posting-selection')}
                className="bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-800 transition-colors"
              >
                Post a Job
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-8">
          {activeMenu === 'dashboard' ? (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Employer Dashboard</h1>
                <p className="text-gray-600 mt-2">Manage your jobs and candidates</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={`text-3xl font-bold mb-1 ${stat.color}`}>{stat.value}</h3>
                        <p className="text-gray-500 text-sm">{stat.label}</p>
                      </div>
                      <div className="bg-gray-50 rounded-full p-3">
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Profile Performance Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Your profile performance</h2>
                <p className="text-sm text-gray-600 mb-4">Last 90 days</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Jobs Posted */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900">Jobs Posted</h3>
                      <button 
                        onClick={() => onNavigate('my-jobs')}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                      >
                        View all
                      </button>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{jobs.length}</div>
                    <p className="text-sm text-gray-500">Active job postings on the platform</p>
                  </div>
                  
                  {/* Applications Received */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900">Applications Received</h3>
                      <button 
                        onClick={() => setActiveMenu('applications')}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                      >
                        View all
                      </button>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{applications.length}</div>
                    <p className="text-sm text-gray-500">Total applications from candidates</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => onNavigate('job-posting-selection')}
                      className="w-full flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
                    >
                      <Plus className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900">Post New Job</span>
                    </button>
                    
                    <button
                      onClick={() => onNavigate('job-management')}
                      className="w-full flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"
                    >
                      <Briefcase className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-gray-900">Job Management</span>
                    </button>
                    
                    <button
                      onClick={() => onNavigate('candidate-search')}
                      className="w-full flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"
                    >
                      <Search className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-gray-900">Search Candidates</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveMenu('applications')}
                      className="w-full flex items-center space-x-3 p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors text-left"
                    >
                      <Folder className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-gray-900">Manage Applications</span>
                    </button>
                    
                    <button
                      onClick={() => onNavigate('interviews')}
                      className="w-full flex items-center space-x-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left"
                    >
                      <MessageSquare className="w-5 h-5 text-orange-600" />
                      <span className="font-medium text-gray-900">Schedule Interview</span>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
                  
                  <div className="space-y-4">
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      </div>
                    ) : recentActivity.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 text-sm">No recent activity</p>
                      </div>
                    ) : (
                      recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-b-0">
                          <div className="flex-1">
                            <p className="text-gray-900 font-medium text-sm">{activity.message}</p>
                            {activity.details && (
                              <p className="text-gray-600 text-xs mt-1">
                                {activity.details.candidateName && `${activity.details.candidateName} - `}
                                {activity.details.jobTitle}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 ml-4">{activity.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : activeMenu === 'applications' ? (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Applications</h1>
              
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No posted jobs</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your search criteria.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div key={application._id || application.id} className="border-2 border-blue-200 rounded-xl p-6 hover:shadow-glow hover:border-blue-400 hover:scale-[1.01] transition-all duration-300 bg-gradient-to-br from-white via-blue-50 to-cyan-50 card-hover shimmer-effect">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-xl">
                              {application.candidateName?.charAt(0).toUpperCase() || 'C'}
                            </span>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                  {application.candidateName || application.candidateEmail}
                                </h3>
                                <p className="text-base text-blue-700 font-semibold flex items-center gap-1">
                                  <span>💼</span>
                                  Applied for: {application.jobTitle || 'Job Position'}
                                </p>
                              </div>
                              <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse ${
                                application.status === 'applied' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                                application.status === 'reviewed' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
                                application.status === 'shortlisted' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                                application.status === 'hired' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                                application.status === 'rejected' ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' :
                                'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                              }`}>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                              <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-lg">
                                <span>📧</span>
                                <span className="text-sm font-medium text-blue-900">{application.candidateEmail}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-lg">
                                <span>📅</span>
                                <span className="text-sm font-medium text-gray-700">Applied: {new Date(application.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </div>
                            </div>

                            {application.coverLetter && application.coverLetter !== 'No cover letter' && (
                              <div className="text-sm text-gray-700 bg-gradient-to-r from-blue-50 to-cyan-50 p-3 rounded-lg mb-3 border-l-4 border-blue-500 shadow-sm">
                                <strong className="text-blue-900">Cover Letter:</strong> {application.coverLetter.length > 150 ? 
                                  `${application.coverLetter.substring(0, 150)}...` : 
                                  application.coverLetter
                                }
                              </div>
                            )}

                            {application.resumeUrl ? (
                              <div className="mb-3">
                                <button
                                  onClick={async () => {
                                    try {
                                      const appId = application._id || application.id;
                                      const PLACEHOLDERS = ['resume_from_quick_apply', 'resume_from_profile', 'resume_uploaded'];
                                      const isPlaceholder = PLACEHOLDERS.includes(application.resumeUrl) || !application.resumeUrl.includes('/');

                                      if (isPlaceholder) {
                                        // Use resume-viewer API to get the real file
                                        const serverBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
                                        const res = await fetch(`${API_ENDPOINTS.BASE_URL}/resume-viewer/${appId}`);
                                        if (res.ok) {
                                          const data = await res.json();
                                          const fileUrl = data.resume?.fileUrl;
                                          if (fileUrl) {
                                            const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${serverBase}${fileUrl}`;
                                            window.open(fullUrl, '_blank', 'noopener,noreferrer');
                                          } else {
                                            alert('No resume file found for this candidate.');
                                          }
                                        } else {
                                          alert('No resume file found. The candidate may not have uploaded one.');
                                        }
                                        return;
                                      }

                                      // Real file path — build correct URL (strip /api prefix for static files)
                                      const serverBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
                                      let resumeUrl = application.resumeUrl;
                                      if (resumeUrl.startsWith('http')) {
                                        // already absolute
                                      } else if (resumeUrl.startsWith('/uploads/')) {
                                        resumeUrl = `${serverBase}${resumeUrl}`;
                                      } else if (resumeUrl.startsWith('/')) {
                                        resumeUrl = `${serverBase}${resumeUrl}`;
                                      } else {
                                        resumeUrl = `${serverBase}/uploads/resumes/${resumeUrl}`;
                                      }

                                      window.open(resumeUrl, '_blank', 'noopener,noreferrer');
                                    } catch (error) {
                                      console.error('Resume open error:', error);
                                      alert('Unable to open resume. Please try again.');
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-semibold inline-flex items-center space-x-1 bg-blue-100 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors"
                                >
                                  <span>📄</span>
                                  <span>View Resume</span>
                                </button>
                              </div>
                            ) : (
                              <div className="mb-3">
                                <span className="text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-lg">📄 Resume not available</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="ml-6 flex flex-col space-y-2">
                          <select
                            value={application.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              const appId = application._id || application.id;
                              try {
                                const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}/${appId}/status`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: newStatus }),
                                });
                                
                                if (response.ok) {
                                  setApplications(prev => 
                                    prev.map(app => 
                                      (app._id || app.id) === appId ? { ...app, status: newStatus } : app
                                    )
                                  );
                                  
                                  const statusMessage = {
                                    'pending': 'Application marked as pending',
                                    'reviewed': 'Application marked as reviewed',
                                    'shortlisted': 'Candidate shortlisted successfully!',
                                    'rejected': 'Application rejected',
                                    'hired': 'Candidate hired successfully!'
                                  }[newStatus] || 'Status updated';
                                  
                                  alert(statusMessage);
                                } else {
                                  throw new Error(`Failed to update status: ${response.status}`);
                                }
                              } catch (error) {
                                console.error('Error updating status:', error);
                                alert('Failed to update application status. Please try again.');
                                e.target.value = application.status;
                              }
                            }}
                            className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                            title="Update application status"
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="rejected">Rejected</option>
                            <option value="hired">Hired</option>
                          </select>
                          <button 
                            onClick={() => {
                              setSelectedApplication(application);
                              setShowScheduleModal(true);
                            }}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors text-sm shadow-md"
                          >
                            Schedule Interview
                          </button>
                          <button 
                            onClick={() => onNavigate('candidate-profile-view')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm shadow-md"
                          >
                            View Profile
                          </button>
                          <button 
                            onClick={() => {
                              const appId = application._id || application.id;
                              if (!window.confirm('Are you sure you want to delete this application?')) {
                                return;
                              }
                              fetch(`${API_ENDPOINTS.APPLICATIONS}/${appId}`, {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                              }).then(res => {
                                if (res.ok) {
                                  setApplications(prev => prev.filter(app => (app._id || app.id) !== appId));
                                  alert('Application deleted successfully!');
                                } else {
                                  alert('Failed to delete application');
                                }
                              }).catch(err => {
                                console.error('Error deleting application:', err);
                                alert('Failed to delete application');
                              });
                            }}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm shadow-md"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : activeMenu === 'interviews' ? (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Scheduled Interviews</h1>
              
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
              ) : interviews.length === 0 ? (
                <div className="text-center py-16">
                  <MessageSquare className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Interviews Scheduled</h3>
                  <p className="text-gray-600 mb-6">Interview schedules will appear here when candidates book interviews.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {interviews.map((interview) => (
                    <div key={interview._id} className="border-2 border-purple-200 rounded-xl p-6 hover:shadow-glow hover:border-purple-400 hover:scale-[1.01] transition-all duration-300 bg-gradient-to-br from-white via-purple-50 to-pink-50 card-hover shimmer-effect">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-xl">
                              {interview.candidateName?.charAt(0).toUpperCase() || 'C'}
                            </span>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                  {interview.candidateName || 'Candidate'}
                                </h3>
                                <p className="text-base text-purple-700 font-semibold flex items-center gap-1">
                                  <span>💼</span>
                                  {interview.jobTitle || 'Interview'}
                                </p>
                              </div>
                              <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse ${
                                interview.status === 'scheduled' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                                interview.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                                interview.status === 'cancelled' ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' :
                                'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                              }`}>
                                {interview.status?.charAt(0).toUpperCase() + interview.status?.slice(1) || 'Scheduled'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                              <div className="flex items-center gap-1 bg-purple-50 px-3 py-1 rounded-lg">
                                <span>📅</span>
                                <span className="text-sm font-semibold text-purple-900">{new Date(interview.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-lg">
                                <span>🕒</span>
                                <span className="text-sm font-semibold text-blue-900">{interview.time}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-lg">
                                <span>📧</span>
                                <span className="text-sm font-medium text-gray-700">{interview.candidateEmail}</span>
                              </div>
                            </div>

                            {interview.meetingLink && (
                              <div className="mb-3">
                                <a
                                  href={interview.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm font-semibold inline-flex items-center space-x-1 bg-blue-100 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors"
                                >
                                  <span>🔗</span>
                                  <span>Join Meeting</span>
                                </a>
                              </div>
                            )}

                            {interview.notes && (
                              <div className="text-sm text-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border-l-4 border-purple-500 shadow-sm">
                                <strong className="text-purple-900">Notes:</strong> {interview.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="ml-6 flex flex-col space-y-2">
                          <select
                            value={interview.status || 'scheduled'}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              try {
                                const response = await fetch(`${API_ENDPOINTS.BASE_URL}/interviews/${interview._id}/status`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: newStatus }),
                                });
                                
                                if (response.ok) {
                                  setInterviews(prev => 
                                    prev.map(int => 
                                      int._id === interview._id ? { ...int, status: newStatus } : int
                                    )
                                  );
                                  alert('Interview status updated successfully!');
                                } else {
                                  throw new Error('Failed to update status');
                                }
                              } catch (error) {
                                console.error('Error updating interview status:', error);
                                alert('Failed to update interview status. Please try again.');
                                e.target.value = interview.status || 'scheduled';
                              }
                            }}
                            className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                            title="Update interview status"
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <button 
                            onClick={() => {
                              if (!window.confirm('Are you sure you want to delete this interview?')) {
                                return;
                              }
                              fetch(`${API_ENDPOINTS.BASE_URL}/interviews/${interview._id}`, {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                              }).then(res => {
                                if (res.ok) {
                                  setInterviews(prev => prev.filter(int => int._id !== interview._id));
                                  alert('Interview deleted successfully!');
                                } else {
                                  alert('Failed to delete interview');
                                }
                              }).catch(err => {
                                console.error('Error deleting interview:', err);
                                alert('Failed to delete interview');
                              });
                            }}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm shadow-md"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : activeMenu === 'saved-candidates' ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Saved Candidates</h1>
                <button
                  onClick={() => {
                    const token = localStorage.getItem('token');
                    if (token) {
                      console.log('Manual refresh of saved candidates...');
                      fetch(`${API_ENDPOINTS.SAVED_CANDIDATES}`, {
                        headers: {
                          'Authorization': `Bearer ${token}`
                        }
                      })
                      .then(res => {
                        console.log('Manual refresh response:', res.status);
                        return res.ok ? res.json() : [];
                      })
                      .then(data => {
                        console.log('Manual refresh data:', data);
                        const candidates = Array.isArray(data) ? data : data.savedCandidates || [];
                        setSavedCandidates(candidates);
                        alert(`Refreshed! Found ${candidates.length} saved candidates.`);
                      })
                      .catch(err => {
                        console.error('Error refreshing saved candidates:', err);
                        alert('Failed to refresh saved candidates.');
                      });
                    }
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
              
              {savedCandidates.length === 0 ? (
                  <div className="text-center py-16">
                    <Bookmark className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Saved Candidates</h3>
                    <p className="text-gray-600 mb-6">Save candidates from the candidate search to view them here.</p>
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={() => onNavigate('candidate-search')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Search Candidates
                      </button>
                      <button
                        onClick={() => {
                          const token = localStorage.getItem('token');
                          console.log('Debug info:', {
                            hasToken: !!token,
                            tokenLength: token?.length,
                            apiEndpoint: API_ENDPOINTS.SAVED_CANDIDATES,
                            user: user
                          });
                          alert('Check console for debug information');
                        }}
                        className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Debug Info
                      </button>
                    </div>
                  </div>
              ) : (
                <div className="space-y-4">
                  {savedCandidates.map((candidate) => (
                    <div key={candidate._id} className="border-2 border-green-200 rounded-xl p-6 hover:shadow-lg hover:border-green-400 transition-all duration-300 bg-gradient-to-br from-white via-green-50 to-emerald-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-md text-white font-bold text-xl">
                            {candidate.fullName?.charAt(0).toUpperCase() || candidate.name?.charAt(0).toUpperCase() || 'C'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {candidate.companyLogo && (
                                <img
                                  src={candidate.companyLogo}
                                  alt={candidate.companyName}
                                  className="w-6 h-6 rounded-full object-cover"
                                  onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.companyName || 'Company')}&size=24&background=6366f1&color=ffffff&bold=true`;
                                  }}
                                />
                              )}
                              <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {candidate.companyName || 'Company'}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{candidate.fullName || candidate.name}</h3>
                            <p className="text-base text-green-700 font-semibold mb-2">{candidate.title}</p>
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-lg">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm font-medium text-green-900">{candidate.location}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">{candidate.experience}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-6 flex flex-col space-y-2">
                          <button onClick={() => candidate.email && (window.location.href = `mailto:${candidate.email}`)} className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-2 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-800 transition-colors text-sm">
                            <Mail className="w-4 h-4 inline mr-1" />
                            Contact
                          </button>
                          <button onClick={() => {
                            const token = localStorage.getItem('token');
                            fetch(`${API_ENDPOINTS.SAVED_CANDIDATES}/${candidate._id}`, {
                              method: 'DELETE',
                              headers: {
                                'Authorization': `Bearer ${token}`
                              }
                            })
                            .then(res => {
                              if (res.ok) {
                                setSavedCandidates(prev => prev.filter(c => c._id !== candidate._id));
                                alert('Candidate removed from saved list!');
                              } else {
                                throw new Error('Failed to remove candidate');
                              }
                            })
                            .catch(err => {
                              console.error('Error removing candidate:', err);
                              alert('Failed to remove candidate. Please try again.');
                            });
                          }} className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : activeMenu === 'alerts' ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Alerts & Notifications</h1>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const userData = localStorage.getItem('user');
                        if (userData) {
                          const parsedUser = JSON.parse(userData);
                          const userEmail = parsedUser.email;
                          
                          console.log('Manual refresh of notifications...');
                          const dynamicNotifications = await NotificationService.fetchNotifications(userEmail);
                          setNotifications(dynamicNotifications);
                          alert(`Refreshed! Found ${dynamicNotifications.length} notifications.`);
                        }
                      } catch (error) {
                        console.error('Error refreshing notifications:', error);
                        alert('Failed to refresh notifications. Please try again.');
                      }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const userData = localStorage.getItem('user');
                        if (userData) {
                          const parsedUser = JSON.parse(userData);
                          const userEmail = parsedUser.email;
                          
                          console.log('Testing notifications API...');
                          const testResult = await NotificationService.testNotifications(userEmail);
                          console.log('Test result:', testResult);
                          alert(`Test completed! Check console for details. Scheduler status: ${testResult.schedulerStatus?.isRunning ? 'Active' : 'Inactive'}`);
                          
                          // Refresh notifications after test
                          const dynamicNotifications = await NotificationService.fetchNotifications(userEmail);
                          setNotifications(dynamicNotifications);
                        }
                      } catch (error) {
                        console.error('Error testing notifications:', error);
                        alert('Test failed. Check console for details.');
                      }
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Test API
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-16">
                    <Bell className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Alerts</h3>
                    <p className="text-gray-600 mb-6">You're all caught up! New alerts will appear here.</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.id} className="border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-400 transition-all duration-300 bg-gradient-to-br from-white via-blue-50 to-cyan-50">
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-semibold ${
                          NotificationService.getNotificationColor(notification.type)
                        }`}>
                          {NotificationService.getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{notification.title}</h3>
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-4">{NotificationService.formatTime(notification.time)}</span>
                          </div>
                          <p className="text-gray-700 mb-3">{notification.message}</p>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                // Navigate to relevant section based on notification type
                                if (notification.type === 'application') {
                                  setActiveMenu('applications');
                                } else if (notification.type === 'interview') {
                                  setActiveMenu('interviews');
                                } else if (notification.type === 'job') {
                                  onNavigate('my-jobs');
                                }
                              }}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                              View Details
                            </button>
                            <button 
                              onClick={() => {
                                setNotifications(prev => prev.filter(n => n.id !== notification.id));
                              }}
                              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Alert Settings */}
              <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Alert Preferences</h2>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-gray-700">New job applications</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-gray-700">Interview confirmations</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-gray-700">Job posting updates</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-gray-700">Weekly summary reports</span>
                  </label>
                </div>
                <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Save Preferences
                </button>
              </div>
            </>
          ) : activeMenu === 'auto-rejection' ? (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">AI Auto-Rejection Settings</h1>
              <AutoRejectionSettings onSave={(settings) => console.log('Settings saved:', settings)} />
            </>
          ) : null}
        </div>
      </div>
      </div>

      {/* Schedule Interview Modal */}
      {showScheduleModal && selectedApplication && (
        <ScheduleInterviewModal
          application={selectedApplication}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedApplication(null);
          }}
          onSuccess={() => {
            fetchDashboardData(user);
          }}
        />
      )}
    </div>
  );
};

export default EmployerDashboardPage;
