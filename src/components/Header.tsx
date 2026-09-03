import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Search, User, Building, ChevronDown, Settings } from 'lucide-react';
import { GlassFilter } from './ui/liquid-glass';
import JobAlertBadge from './JobAlertBadge';
import { useJobAlertStore } from '../hooks/useJobAlertStore';
import { io } from 'socket.io-client';
import { API_ENDPOINTS, config } from '../config/env';
import { useSiteSettings } from '../store/useSiteSettings';
import { useNavigation, CAREER_RESOURCE_URLS } from '../store/useNavigation';
import { isEmployerPagePath } from '../utils/rolePermissions';
import { strapiAPI } from '../api/strapi';
import { apiFetch } from '../api/apiFetch';
import MobileHamburgerMenu from './MobileHamburgerMenu';


interface HeaderProps {
  onNavigate?: (page: string, data?: any) => void;
  user?: {name: string, type: 'candidate' | 'employer' | 'admin' | 'super_admin' | 'manager' | 'recruiter', email?: string} | null;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, user, onLogout }) => {
  const { unreadCount: alertUnread } = useJobAlertStore(user?.type === 'candidate' ? user?.email : undefined);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCareerDropdownOpen, setIsCareerDropdownOpen] = useState(false);
  const [profileMetrics, setProfileMetrics] = useState({ jobsPosted: 0, applicationsReceived: 0, searchAppearances: 0, recruiterActions: 0 });
  const [, setNotifications] = useState<any[]>([]);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [displayName, setDisplayName] = useState((user as any)?.fullName || user?.name || '');
  const [isScrolled, setIsScrolled] = useState(true); // Default to light header
  const dropdownRef = useRef<HTMLDivElement>(null);
  const careerDropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const currentPath = location.pathname;

  const isJobSeekerAuthPage = currentPath === '/login' || currentPath === '/role-selection' || currentPath === '/candidate-register';

  // Employer context = employer logged in OR on an employer-facing page
  const isEmployerContext = user?.type === 'employer' || isEmployerPagePath(currentPath);

  // Show Job Seeker links everywhere EXCEPT on Job Seeker Auth pages
  const showJobSeekerLinks = !isJobSeekerAuthPage;

  // Secret typed sequence to reveal admin login
  useEffect(() => {
    const secret = import.meta.env.VITE_ADMIN_SECRET || '';
    let buffer = '';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.key || e.key.length > 1) return;
      buffer += e.key.toLowerCase();
      if (buffer.length > secret.length) buffer = buffer.slice(-secret.length);
      if (buffer === secret) {
        setAdminUnlocked(true);
        setIsDropdownOpen(true);
        buffer = '';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { data: siteSettings, fetchSiteSettings } = useSiteSettings();
  const { items: navItems, fetchNavigation } = useNavigation();

  useEffect(() => {
    fetchNavigation();
    fetchSiteSettings();
  }, []);

  // Sync display name from user prop and localStorage
  useEffect(() => {
    const updateName = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        const name = stored.fullName || stored.name || (user as any)?.fullName || user?.name || stored.email?.split('@')[0] || 'User';
        setDisplayName(name);
      } catch {
        setDisplayName((user as any)?.fullName || user?.name || 'User');
      }
    };
    
    updateName();
    
    const handleUserUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.name) setDisplayName(detail.fullName || detail.name);
      else updateName();
    };
    
    window.addEventListener('zync:user-updated', handleUserUpdate);
    return () => window.removeEventListener('zync:user-updated', handleUserUpdate);
  }, [user]);

  const handleLoginClick = () => {
    setIsDropdownOpen(false);
    if (onNavigate) {
      onNavigate('login');
    }
  };

  const handleRegisterClick = () => {
    setIsDropdownOpen(false);
    if (onNavigate) {
      onNavigate(isEmployerContext ? 'employer-register' : 'candidate-register');
    }
  };

  const handleEmployerPageClick = () => {
    setIsDropdownOpen(false);
    if (onNavigate) {
      onNavigate('employers');
    }
  };

  const handleFindJobsClick = () => {
    if (onNavigate) {
      // Check if user is an employer
      if (user?.type === 'employer') {
        // Employer should go to candidate search
        onNavigate('candidate-search');
      } else {
        // Anyone can browse job listings without login
        onNavigate('job-listings');
      }
    }
  };

  const handleCompaniesClick = () => {
    if (onNavigate) {
      // Anyone can browse companies without login
      onNavigate('companies');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (careerDropdownRef.current && !careerDropdownRef.current.contains(event.target as Node)) {
        setIsCareerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    const handleScroll = () => {
      // Use standard scroll detection for the header glass effect
      // We keep it 'light' (isScrolled = true) by default for the new design
      const scrolled = window.scrollY > 20;
      
      let isOverDark = false;
      const headerCenterY = 40;
      const darkSections = document.querySelectorAll('[data-theme="dark"]');
      darkSections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= headerCenterY && rect.bottom >= headerCenterY) {
          isOverDark = true;
        }
      });

      // If we are over a dark section, switch to dark header (isScrolled = false)
      // Otherwise, stay light (isScrolled = true)
      setIsScrolled(!isOverDark);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    handleScroll();
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const fetchProfileMetrics = async () => {
      if (!user) return;
      try {
        const userEmail = user.email || (user as any).email;
        if (!userEmail) return;

        if (user.type === 'employer') {
          // For team members, use owner's email to show company-wide stats
          const ownerEmail = (user as any).employerOwnerId || userEmail;
          const [jobsRes, appsRes] = await Promise.all([
            apiFetch(`${API_ENDPOINTS.BASE_URL}/jobs/employer/email/${encodeURIComponent(ownerEmail)}`),
            apiFetch(`${API_ENDPOINTS.APPLICATIONS}?employerEmail=${encodeURIComponent(ownerEmail)}`),
          ]);
          let jobsPosted = 0;
          let applicationsReceived = 0;
          if (jobsRes.ok) {
            const d = await jobsRes.json();
            jobsPosted = (Array.isArray(d) ? d : d.jobs || []).length;
          }
          if (appsRes.ok) {
            const d = await appsRes.json();
            applicationsReceived = (Array.isArray(d) ? d : d.applications || []).length;
          }
          setProfileMetrics(prev => ({ ...prev, jobsPosted, applicationsReceived }));
        } else {
          // Fetch real analytics from backend
          const analyticsRes = await apiFetch(`${API_ENDPOINTS.BASE_URL}/analytics/profile/${encodeURIComponent(userEmail)}?userType=candidate`);
          if (analyticsRes.ok) {
            const data = await analyticsRes.json();
            setProfileMetrics(prev => ({
              ...prev,
              recruiterActions: data.recruiterActions || 0,
              searchAppearances: data.searchAppearances || 0,
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching profile metrics:', error);
      }
    };
    
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        const userEmail = user.email || (user as any).email;
        if (!userEmail) return;

        if (user.type === 'employer') {
              // Fetch employer notifications
              const [appsRes, jobsRes, interviewsRes] = await Promise.all([
                apiFetch(API_ENDPOINTS.APPLICATIONS),
                apiFetch(API_ENDPOINTS.JOBS),
                apiFetch(`${API_ENDPOINTS.BASE_URL}/interviews?employerEmail=${encodeURIComponent(userEmail)}`)
              ]);
              
              const realNotifications: Array<{id: string; type: string; title: string; message: string; time: string}> = [];
              
              if (appsRes.ok) {
                const appsData = await appsRes.json();
                const allApps = appsData.applications || appsData || [];
                const employerApps = allApps.filter((app: any) => app.employerEmail === userEmail);
                employerApps.slice(0, 3).forEach((app: any): void => {
                  realNotifications.push({ id: `app_${app._id || app.id}`, type: 'application', title: 'New application received', message: `${app.candidateName || app.candidateEmail} applied for a position`, time: new Date(app.createdAt).toLocaleDateString() || '1d ago' });
                });
              }
              if (interviewsRes.ok) {
                const interviewsData = await interviewsRes.json();
                const interviews = Array.isArray(interviewsData) ? interviewsData : [];
                interviews.slice(0, 2).forEach((interview: any): void => {
                  realNotifications.push({ id: `interview_${interview._id}`, type: 'interview', title: 'Interview scheduled', message: `Interview with ${interview.candidateName || 'candidate'} scheduled`, time: new Date(interview.date).toLocaleDateString() || '1d ago' });
                });
              }
              if (jobsRes.ok) {
                const jobsData = await jobsRes.json();
                const allJobs = Array.isArray(jobsData) ? jobsData : [];
                allJobs.filter((job: any) => job.postedBy === userEmail).slice(0, 2).forEach((job: any) => {
                  realNotifications.push({ id: `job_${job._id || job.id}`, type: 'job', title: 'Job posting active', message: `Your ${job.jobTitle || job.title} position is live`, time: new Date(job.createdAt || job.datePosted).toLocaleDateString() || '2d ago' });
                });
              }
              setNotifications(realNotifications);
        } else {
          setNotifications([]);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      }
    };
    
    fetchProfileMetrics();
    fetchNotifications();
    
    // Socket.io real-time analytics — only connect if backend is reachable
    let socket: any = null;
    if (user?.type === 'candidate' || user?.type !== 'employer') {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          const userEmail = parsedUser.email;
          if (userEmail) {
            const backendUrl = config.SOCKET_URL;
            socket = io(backendUrl, {
              transports: ['websocket', 'polling'],
              reconnection: false,
              timeout: 3000,
            });
            socket.on('connect', () => {});
            socket.on('connect_error', () => { socket.disconnect(); });
            socket.on(`analytics_update:${userEmail}`, () => { fetchProfileMetrics(); });
          }
        }
      } catch { /* socket unavailable in dev — safe to ignore */ }
    }

    // Listen for manual analytics refresh event
    const handleAnalyticsRefresh = () => fetchProfileMetrics();
    window.addEventListener('analyticsRefresh', handleAnalyticsRefresh);
    
    // Listen for job deletion events to refresh metrics
    const handleJobDeleted = () => {
      console.log('Job deleted event received in Header, refreshing metrics...');
      fetchProfileMetrics();
      fetchNotifications();
    };
    
    const handleWindowFocus = () => {
      fetchProfileMetrics();
      fetchNotifications();
    };
    
    window.addEventListener('jobDeleted', handleJobDeleted);
    window.addEventListener('focus', handleWindowFocus);
    
    // Set up periodic refresh for notifications
    const notificationInterval = setInterval(fetchNotifications, 60000); // Refresh every minute
    const metricsInterval = setInterval(fetchProfileMetrics, 30000); // Refresh metrics every 30s
    
    return () => {
      if (socket) socket.disconnect();
      window.removeEventListener('analyticsRefresh', handleAnalyticsRefresh);
      window.removeEventListener('jobDeleted', handleJobDeleted);
      window.removeEventListener('focus', handleWindowFocus);
      clearInterval(notificationInterval);
      clearInterval(metricsInterval);
    };
  }, [user]);

  const navTextClass = isScrolled 
    ? 'text-gray-900 hover:text-blue-600' 
    : 'text-white/90 hover:text-white';

  return (
    <>
      <GlassFilter />
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={isScrolled ? {
          backdropFilter: 'blur(24px) saturate(200%) brightness(1.1)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(1.1)',
          background: 'rgba(255, 255, 255, 0.45)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.6)',
        } : {
          backdropFilter: 'blur(24px) saturate(200%) brightness(1.1)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(1.1)',
          background: 'rgba(20, 20, 25, 0.7)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
      >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 sm:py-4">
          <div className="flex-shrink-0">
            <button 
              onClick={() => onNavigate && onNavigate('home')}
              className="flex items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              aria-label="Go to ZyncJobs home"
            >
              <img 
                src={siteSettings?.siteLogo?.url ? strapiAPI.getImageUrl(siteSettings.siteLogo.url) : '/images/zyncjobs-logo.png'} 
                alt={siteSettings?.siteTitle || 'ZyncJobs'} 
                className="h-10 sm:h-12 lg:h-16 w-auto"
              />
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-4 xl:space-x-8 flex-1 justify-start ml-4 xl:ml-8" aria-label="Main navigation">
            {isEmployerContext ? (
              <>
                <button
                  onClick={() => onNavigate && onNavigate('candidate-search')}
                  className="text-gray-900 hover:text-gray-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                >
                  Candidate Search
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('my-jobs')}
                  className="text-gray-900 hover:text-gray-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                >
                  Posted Jobs
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('job-posting-selection')}
                  className="text-gray-900 hover:text-gray-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                >
                  Post a Job
                </button>
              </>
            ) : (
              <>
            {navItems.length > 0 ? (
              navItems
                .filter(item => !CAREER_RESOURCE_URLS.has(item.url))
                .map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate && onNavigate(item.url)}
                  className={`${navTextClass} font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-1 rounded`}
                >
                  {item.label}
                </button>
              ))
            ) : (
              <>
                <button onClick={handleFindJobsClick} className={`${navTextClass} font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded`}>
                  {user?.type === 'employer' ? 'Candidate Search' : 'Job Search'}
                </button>
                <button onClick={handleCompaniesClick} className={`${navTextClass} font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded`}>
                  Companies
                </button>
              </>
            )}

            {user?.type === 'employer' ? (
              <button
                onClick={() => onNavigate && onNavigate('my-jobs')}
                className={`${navTextClass} font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded`}
              >
                Posted Jobs
              </button>
            ) : (
              <div className="relative" ref={careerDropdownRef}>
                <button 
                  onClick={() => setIsCareerDropdownOpen(!isCareerDropdownOpen)}
                  className={`flex items-center space-x-1 ${navTextClass} font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded`}
                  aria-expanded={isCareerDropdownOpen}
                  aria-haspopup="true"
                >
                  <span>Career Resources</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isCareerDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isCareerDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50" role="menu">
                    <button 
                      onClick={() => { setIsCareerDropdownOpen(false); onNavigate && onNavigate('resume-studio'); }}
                      className="flex items-center w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors focus:outline-none focus:bg-blue-50"
                      role="menuitem"
                    >
                      <svg className="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Resume Studio
                    </button>
                    <button 
                      onClick={() => { setIsCareerDropdownOpen(false); onNavigate && onNavigate('interview-tips'); }}
                      className="flex items-center w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors focus:outline-none focus:bg-blue-50"
                      role="menuitem"
                    >
                      <svg className="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Interview Preparation
                    </button>
                    <button 
                      onClick={() => { setIsCareerDropdownOpen(false); onNavigate && onNavigate('career-coach'); }}
                      className="flex items-center w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors focus:outline-none focus:bg-blue-50"
                      role="menuitem"
                    >
                      <svg className="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Career Guidance
                    </button>
                    <button 
                      onClick={() => { setIsCareerDropdownOpen(false); onNavigate && onNavigate('skill-assessment'); }}
                      className="flex items-center w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors focus:outline-none focus:bg-blue-50"
                      role="menuitem"
                    >
                      <svg className="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Skill Check
                    </button>
                  </div>
                )}
              </div>
            )}
            <button 
              onClick={() => {
                if (user) {
                  if (user.type === 'employer') {
                    onNavigate && onNavigate('job-posting-selection');
                  } else {
                    onNavigate && onNavigate('my-jobs');
                  }
                } else {
                  onNavigate && onNavigate(isEmployerContext ? 'employer-register' : 'candidate-register');
                }
              }}
              className={`${navTextClass} font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded`}
            >
              {user?.type === 'employer' ? 'Job Posting' : 'My Jobs'}
            </button>
              </>
            )}

          </nav>

          {/* Right side items */}
          <div className="hidden lg:flex items-center space-x-2 xl:space-x-4 ml-auto">

            {/* For Employers Button - only when not logged in and outside employer context */}
            {!isEmployerContext && !user ? (
              <button 
                onClick={handleEmployerPageClick}
                className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                title="Go to employer page"
              >
                For Employers
              </button>
            ) : null}

            {/* Login/Register Dropdown */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center space-x-2 ${navTextClass} transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full`}
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                  aria-label="User profile menu"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Slide-out Panel */}
                {isDropdownOpen && (
                  <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                    
                    {/* Panel */}
                    <div className="fixed top-[72px] right-0 h-[calc(100%-72px)] w-full sm:w-96 bg-white shadow-xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
                      {/* Header */}
                      <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
                        <button 
                          onClick={() => setIsDropdownOpen(false)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Close profile panel"
                          aria-label="Close profile panel"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-h-0 p-6 overflow-y-auto pb-20">
                        {/* User Info */}
                        <div className="flex items-center space-x-4 mb-8">
                          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              {displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">{displayName}</p>
                            <p className="text-sm text-gray-600 capitalize">{user.type}</p>
                          </div>
                        </div>
                        
                        {/* Profile Performance */}
                        <div className="mb-6 bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-semibold text-gray-900">Your profile performance</h3>
                            <span className="text-xs text-gray-500">Last 90 days</span>
                          </div>
                          <div className="flex gap-3">
                            {user.type === 'employer' ? (
                              <>
                                <div className="flex-1 text-center bg-white rounded-lg p-2">
                                  <div className="text-xl font-bold text-gray-900">{profileMetrics.jobsPosted}</div>
                                  <div className="text-xs text-gray-600">Jobs Posted</div>
                                  <button 
                                    onClick={() => {
                                      setIsDropdownOpen(false);
                                      onNavigate && onNavigate('my-jobs');
                                    }}
                                    className="text-blue-600 text-xs hover:underline font-medium"
                                  >
                                    View all
                                  </button>
                                </div>
                                <div className="flex-1 text-center bg-white rounded-lg p-2">
                                  <div className="text-xl font-bold text-gray-900">{profileMetrics.applicationsReceived}</div>
                                  <div className="text-xs text-gray-600">Applications Received</div>
                                  <button 
                                    onClick={() => {
                                      setIsDropdownOpen(false);
                                      onNavigate && onNavigate('dashboard');
                                      // Trigger applications section after navigation
                                      setTimeout(() => {
                                        const event = new CustomEvent('showApplications');
                                        window.dispatchEvent(event);
                                      }, 100);
                                    }}
                                    className="text-blue-600 text-xs hover:underline font-medium"
                                  >
                                    View all
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex-1 text-center bg-white rounded-lg p-2">
                                  <div className="text-xl font-bold text-gray-900">{profileMetrics.recruiterActions}</div>
                                <div className="text-xs text-gray-600">Recruiter Actions</div>
                                  <button 
                                    onClick={() => {
                                      setIsDropdownOpen(false);
                                      onNavigate && onNavigate('recruiter-actions');
                                    }}
                                    className="text-blue-600 text-xs hover:underline font-medium"
                                  >
                                    View all
                                  </button>
                                </div>
                                <div className="flex-1 text-center bg-white rounded-lg p-2">
                                  <div className="text-xl font-bold text-gray-900">{profileMetrics.searchAppearances}</div>
                                  <div className="text-xs text-gray-600">Search Appearances</div>
                                  <button 
                                    onClick={() => {
                                      setIsDropdownOpen(false);
                                      onNavigate && onNavigate('search-appearances');
                                    }}
                                    className="text-blue-600 text-xs hover:underline font-medium"
                                  >
                                    View all
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Menu Items */}
                        <div className="space-y-2">
                          <button 
                            onClick={() => {
                              setIsDropdownOpen(false);
                              onNavigate && onNavigate('dashboard');
                            }} 
                            className="flex items-center w-full text-left px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <User className="w-5 h-5 mr-3 text-gray-500" />
                            View & Update Profile
                          </button>

                          {(user.type === 'admin' || user.type === 'super_admin') && (
                            <button
                              onClick={() => {
                                setIsDropdownOpen(false);
                                onNavigate && onNavigate('admin/dashboard');
                              }}
                              className="flex items-center w-full text-left px-3 py-3 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors font-medium"
                            >
                              <Settings className="w-5 h-5 mr-3 text-purple-500" />
                              Admin Dashboard
                            </button>
                          )}
                          
                          {user?.name === 'ZyncJobs Admin' && (
                            <>
                              <button 
                                onClick={() => {
                                  setIsDropdownOpen(false);
                                  onNavigate && onNavigate('job-moderation');
                                }} 
                                className="flex items-center w-full text-left px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <Settings className="w-5 h-5 mr-3 text-gray-500" />
                                Job Moderation
                              </button>
                              <button 
                                onClick={() => {
                                  setIsDropdownOpen(false);
                                  onNavigate && onNavigate('resume-moderation');
                                }} 
                                className="flex items-center w-full text-left px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <Settings className="w-5 h-5 mr-3 text-gray-500" />
                                Resume Moderation
                              </button>
                            </>
                          )}
                          
                          {user.type !== 'employer' && (
                            <button 
                              onClick={() => {
                                setIsDropdownOpen(false);
                                onNavigate && onNavigate('job-listings', { tab: 'recommended' });
                              }} 
                              className="flex items-center w-full text-left px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Search className="w-5 h-5 mr-3 text-gray-500" />
                              Recommended Jobs
                            </button>
                          )}
                          
                          <button 
                            onClick={() => {
                              setIsDropdownOpen(false);
                              if (user.type === 'employer') {
                                onNavigate && onNavigate('job-posting-selection');
                              } else {
                                onNavigate && onNavigate('my-jobs');
                              }
                            }} 
                            className="flex items-center w-full text-left px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Building className="w-5 h-5 mr-3 text-gray-500" />
                            {user.type === 'employer' ? 'Job Posting' : 'My Jobs'}
                          </button>
                          
                          <button 
                            onClick={() => {
                              setIsDropdownOpen(false);
                              if (user.type === 'employer') {
                                onNavigate && onNavigate('dashboard');
                                setTimeout(() => window.dispatchEvent(new CustomEvent('showAlerts')), 100);
                              } else {
                                onNavigate && onNavigate('alerts');
                              }
                            }} 
                            className="flex items-center w-full text-left px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h5m5 0v6" />
                            </svg>
                            <span className="flex-1">Alerts</span>
                            <JobAlertBadge count={alertUnread} />
                          </button>
                          
                          <hr className="my-3" />
                          
                          <button 
                            onClick={() => {
                              setIsDropdownOpen(false);
                              onNavigate && onNavigate('settings');
                            }} 
                            className="flex items-center w-full text-left px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Settings
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => {
                              setIsDropdownOpen(false);
                              onLogout?.();
                            }} 
                            className="flex items-center w-full text-left px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : isEmployerContext ? (
              <>
                {currentPath !== '/employer-login' && (
                  <button 
                    onClick={() => { setIsDropdownOpen(false); onNavigate && onNavigate('employer-login'); }}
                    className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  >
                    Employer Login
                  </button>
                )}
                <button 
                  onClick={() => { setIsDropdownOpen(false); onNavigate && onNavigate('employer-register'); }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors shadow-sm"
                >
                  {currentPath === '/employer-login' ? 'Register' : 'Create Account'}
                </button>
              </>
            ) : isJobSeekerAuthPage ? (
              <>
                {currentPath !== '/candidate-register' && currentPath !== '/role-selection' && (
                  <button 
                    onClick={() => { setIsDropdownOpen(false); onNavigate && onNavigate('candidate-register'); }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors shadow-sm"
                  >
                    Register
                  </button>
                )}
                {(currentPath === '/candidate-register' || currentPath === '/role-selection') && (
                  <button 
                    onClick={() => { setIsDropdownOpen(false); onNavigate && onNavigate('login'); }}
                    className="px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  >
                    Login
                  </button>
                )}
              </>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center space-x-1 ${navTextClass} transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded`}
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                >
                  <span>Login/Register</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50" role="menu">
                    {showJobSeekerLinks && (
                      <>
                        <p className="px-4 py-1 text-xs text-gray-400 uppercase tracking-wide">Job Seeker</p>
                        <button onClick={handleLoginClick} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors focus:outline-none focus:bg-blue-50" role="menuitem">
                          Login
                        </button>
                        <button onClick={handleRegisterClick} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors focus:outline-none focus:bg-blue-50" role="menuitem">
                          Register
                        </button>
                      </>
                    )}
                    
                    {showJobSeekerLinks && adminUnlocked && <hr className="my-1" />}
                    
                    {adminUnlocked && (
                      <button
                        onClick={() => { setIsDropdownOpen(false); setAdminUnlocked(false); onNavigate && onNavigate('admin/login'); }}
                        className="block w-full text-left px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors rounded-b-lg flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Admin Portal
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex-shrink-0">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative p-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              type="button"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span className={`block h-0.5 w-6 bg-current transform transition-all duration-300 ease-out ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                <span className={`block h-0.5 w-6 bg-current transform transition-all duration-300 ease-out mt-1.5 ${isMenuOpen ? 'opacity-0 scale-0' : ''}`} />
                <span className={`block h-0.5 w-6 bg-current transform transition-all duration-300 ease-out mt-1.5 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>

    <div className="h-16 sm:h-20 lg:h-24 shrink-0" aria-hidden="true" />

    {/* Mobile Hamburger Menu */}
    <MobileHamburgerMenu 
      isOpen={isMenuOpen}
      onClose={() => setIsMenuOpen(false)}
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={user}
      siteSettings={siteSettings || undefined}
      alertUnreadCount={alertUnread}
    />
    </>
  );
};

export default Header;
