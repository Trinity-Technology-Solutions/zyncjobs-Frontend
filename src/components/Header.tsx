import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  X, Search, User, Building, ChevronDown, Settings, 
  FileText, Sparkles, Bell, LogOut, ChevronRight, Briefcase, PlusCircle, LayoutDashboard,
  PanelRight, PanelRightClose,
  Video, Compass, CheckSquare
} from 'lucide-react';
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
  const [userEmail, setUserEmail] = useState<string>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      return stored.email || user?.email || (user as any)?.email || '';
    } catch {
      return user?.email || (user as any)?.email || '';
    }
  });
  const [profilePhoto, setProfilePhoto] = useState<string>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      return stored.profilePhoto || (user as any)?.profilePhoto || '';
    } catch {
      return '';
    }
  });
  const [isScrolled] = useState(true); // Default to light header
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const careerDropdownRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const currentPath = location.pathname;

  // Keep --header-h CSS custom property accurately synced with the actual header height
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.getBoundingClientRect().height;
        if (height > 0) {
          document.documentElement.style.setProperty('--header-h', `${Math.round(height)}px`);
          document.documentElement.style.setProperty('--header-offset', '0px');
        }
      }
    };
    updateHeaderHeight();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateHeaderHeight) : null;
    if (ro && headerRef.current) ro.observe(headerRef.current);
    window.addEventListener('resize', updateHeaderHeight);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

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

  // Sync display name, photo, and email from user prop and localStorage
  useEffect(() => {
    const updateUserData = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        const name = stored.fullName || stored.name || (user as any)?.fullName || user?.name || stored.email?.split('@')[0] || 'User';
        setDisplayName(name);
        const photo = stored.profilePhoto || (user as any)?.profilePhoto || '';
        setProfilePhoto(photo);
        const email = stored.email || user?.email || (user as any)?.email || '';
        setUserEmail(email);
      } catch {
        setDisplayName((user as any)?.fullName || user?.name || 'User');
        setProfilePhoto((user as any)?.profilePhoto || '');
        setUserEmail(user?.email || (user as any)?.email || '');
      }
    };
    
    updateUserData();
    
    const handleUserUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.name || detail?.fullName) setDisplayName(detail.fullName || detail.name);
      if (detail?.profilePhoto !== undefined) setProfilePhoto(detail.profilePhoto || '');
      if (detail?.email) setUserEmail(detail.email);
      updateUserData();
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
      const target = event.target as Node;
      if (panelRef.current && panelRef.current.contains(target)) {
        return;
      }
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }
      if (mobileDropdownRef.current && mobileDropdownRef.current.contains(target)) {
        return;
      }
      setIsDropdownOpen(false);
      if (careerDropdownRef.current && !careerDropdownRef.current.contains(target)) {
        setIsCareerDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
        setIsCareerDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Lock body scroll when profile drawer is open
  useEffect(() => {
    if (isDropdownOpen && user) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isDropdownOpen, user]);

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

  const isPathActive = (target: string): boolean => {
    if (target === 'job-listings' || target === '/job-listings') {
      return currentPath === '/job-listings' || currentPath.startsWith('/job-detail') || currentPath.startsWith('/jobs');
    }
    if (target === 'companies' || target === '/companies') {
      return currentPath === '/companies' || currentPath.startsWith('/company');
    }
    if (target === 'career-resources') {
      return ['/resume-studio', '/interview-tips', '/career-coach', '/skill-assessment'].some(p => currentPath.startsWith(p));
    }
    if (target === 'my-jobs' || target === '/my-jobs') {
      return currentPath === '/my-jobs';
    }
    if (target === 'candidate-search' || target === '/candidate-search') {
      return currentPath === '/candidate-search';
    }
    if (target === 'job-posting-selection' || target === '/job-posting-selection') {
      return currentPath.startsWith('/job-posting') || currentPath === '/job-parsing';
    }
    if (target.startsWith('/')) {
      return currentPath === target;
    }
    return currentPath === `/${target}`;
  };

  const getNavLinkClass = (target: string): string => {
    const active = isPathActive(target);
    return `h-10 px-3.5 xl:px-4 rounded-lg text-[15px] xl:text-[15.5px] font-medium tracking-[-0.01em] transition-colors cursor-pointer inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 select-none ${
      active
        ? 'text-blue-600 font-semibold bg-blue-50/70'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
    }`;
  };


  const getInitials = (name: string): string => {
    if (!name) return 'U';
    const clean = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const firstName = displayName.trim().split(/\s+/)[0] || 'User';

  const renderProfileDrawer = () => {
    if (!user) return null;

    return (
      <>
        {/* Backdrop overlay */}
        <div 
          className={`fixed inset-0 z-[9998] bg-slate-950/45 backdrop-blur-[2px] transition-opacity duration-300 ease-out ${
            isDropdownOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsDropdownOpen(false)}
          aria-hidden="true"
        />

        {/* Slide-in Panel from Right Edge */}
        <div
          ref={panelRef}
          className={`fixed top-0 right-0 bottom-0 h-full w-full sm:w-[420px] max-w-full bg-white z-[9999] shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
            isDropdownOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="User Profile"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/95 backdrop-blur flex-shrink-0">
            <div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight">Account Profile</h2>
              <p className="text-xs text-gray-500">Manage your profile & preferences</p>
            </div>
            <button
              onClick={() => setIsDropdownOpen(false)}
              className="p-2 -mr-1 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close profile drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {/* User Identity Hero Section */}
            <div className="p-6 bg-gradient-to-br from-blue-50/50 via-slate-50/30 to-white">
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  {profilePhoto ? (
                    <img 
                      src={profilePhoto} 
                      alt={displayName} 
                      className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 flex items-center justify-center text-white font-bold text-xl ring-4 ring-white shadow-md tracking-wider">
                      {getInitials(displayName)}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white ring-2 ring-emerald-400/20" title="Online" />
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <h3 className="font-bold text-gray-900 text-lg truncate leading-tight">
                    {displayName}
                  </h3>
                  {userEmail && (
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {userEmail}
                    </p>
                  )}
                  <div className="mt-2.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
                      <span className="truncate">
                        {user.type === 'employer' ? 'Employer Account' : 'Job Seeker • Open to Work'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* View & Update Profile Button */}
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  onNavigate && onNavigate('dashboard');
                }}
                className="w-full mt-5 py-2.5 px-4 text-xs sm:text-sm font-semibold text-blue-700 bg-white hover:bg-blue-50/80 border border-blue-200/80 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 group hover:shadow-sm"
              >
                <span>View & Edit Profile</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform text-blue-600" />
              </button>
            </div>

            {/* Profile Performance Section (Last 90 Days) */}
            <div className="p-6 bg-gray-50/40">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Profile Performance</h4>
                <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">Last 90 days</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {user.type === 'employer' ? (
                  <>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onNavigate && onNavigate('my-jobs');
                      }}
                      className="text-left p-3.5 rounded-2xl bg-white border border-gray-200/80 hover:border-blue-300 hover:bg-blue-50/30 transition-all group shadow-xs"
                    >
                      <div className="text-2xl font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {profileMetrics.jobsPosted}
                      </div>
                      <div className="text-xs font-medium text-gray-600 mt-1">Jobs Posted</div>
                      <div className="text-[11px] text-blue-600 font-semibold mt-2 flex items-center gap-1 group-hover:underline">
                        <span>View all</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onNavigate && onNavigate('dashboard');
                        setTimeout(() => {
                          const event = new CustomEvent('showApplications');
                          window.dispatchEvent(event);
                        }, 100);
                      }}
                      className="text-left p-3.5 rounded-2xl bg-white border border-gray-200/80 hover:border-blue-300 hover:bg-blue-50/30 transition-all group shadow-xs"
                    >
                      <div className="text-2xl font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {profileMetrics.applicationsReceived}
                      </div>
                      <div className="text-xs font-medium text-gray-600 mt-1">Applications</div>
                      <div className="text-[11px] text-blue-600 font-semibold mt-2 flex items-center gap-1 group-hover:underline">
                        <span>Review</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onNavigate && onNavigate('recruiter-actions');
                      }}
                      className="text-left p-3.5 rounded-2xl bg-white border border-gray-200/80 hover:border-blue-300 hover:bg-blue-50/30 transition-all group shadow-xs"
                    >
                      <div className="text-2xl font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {profileMetrics.recruiterActions}
                      </div>
                      <div className="text-xs font-medium text-gray-600 mt-1">Recruiter Actions</div>
                      <div className="text-[11px] text-blue-600 font-semibold mt-2 flex items-center gap-1 group-hover:underline">
                        <span>View activity</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onNavigate && onNavigate('search-appearances');
                      }}
                      className="text-left p-3.5 rounded-2xl bg-white border border-gray-200/80 hover:border-blue-300 hover:bg-blue-50/30 transition-all group shadow-xs"
                    >
                      <div className="text-2xl font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {profileMetrics.searchAppearances}
                      </div>
                      <div className="text-xs font-medium text-gray-600 mt-1">Search Views</div>
                      <div className="text-[11px] text-blue-600 font-semibold mt-2 flex items-center gap-1 group-hover:underline">
                        <span>View insights</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Navigation Menu Section */}
            <div className="p-4 sm:p-6 space-y-1">
              <div className="px-3 pb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                {user.type === 'employer' ? 'Recruitment Hub' : 'Career Hub'}
              </div>

              {user.type === 'employer' ? (
                <>
                  <button
                    onClick={() => { setIsDropdownOpen(false); onNavigate && onNavigate('dashboard'); }}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 transition-all group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <LayoutDashboard className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Dashboard</div>
                        <div className="text-xs text-gray-500">Overview & activity stats</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button
                    onClick={() => { setIsDropdownOpen(false); onNavigate && onNavigate('my-jobs'); }}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 transition-all group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Posted Jobs</div>
                        <div className="text-xs text-gray-500">Manage active openings & applications</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button
                    onClick={() => { setIsDropdownOpen(false); onNavigate && onNavigate('job-posting-selection'); }}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 transition-all group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <PlusCircle className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Post a Job</div>
                        <div className="text-xs text-gray-500">Publish a new job requirement</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button
                    onClick={() => { setIsDropdownOpen(false); onNavigate && onNavigate('candidate-search'); }}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 transition-all group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Search className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Candidate Search</div>
                        <div className="text-xs text-gray-500">Browse and filter top talent</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setIsDropdownOpen(false); onNavigate && onNavigate('dashboard'); }}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 transition-all group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <LayoutDashboard className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Dashboard</div>
                        <div className="text-xs text-gray-500">Activity overview & profile status</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button
                    onClick={() => { setIsDropdownOpen(false); onNavigate && onNavigate('my-applications'); }}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 transition-all group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">My Applications</div>
                        <div className="text-xs text-gray-500">Track application statuses</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button
                    onClick={() => { setIsDropdownOpen(false); onNavigate && onNavigate('resume-studio'); }}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 transition-all group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Resume Studio</span>
                          <span className="px-1.5 py-0.5 text-[10px] font-bold text-purple-700 bg-purple-100 rounded-md tracking-wider">AI</span>
                        </div>
                        <div className="text-xs text-gray-500">AI resume builder & analyzer</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button
                    onClick={() => { setIsDropdownOpen(false); onNavigate && onNavigate('alerts'); }}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 transition-all group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Job Alerts</span>
                          {alertUnread > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white min-w-[18px] text-center">
                              {alertUnread}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">Custom match notifications</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </>
              )}
            </div>

            {/* Account Settings Section */}
            <div className="p-4 sm:p-6 space-y-1">
              <div className="px-3 pb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Preferences
              </div>

              <button
                onClick={() => { setIsDropdownOpen(false); onNavigate && onNavigate('settings'); }}
                className="w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 transition-all group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Account Settings</div>
                    <div className="text-xs text-gray-500">Security, notifications & privacy</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex-shrink-0">
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                onLogout && onLogout();
              }}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-white hover:bg-red-50 hover:text-red-700 border border-red-200/80 hover:border-red-300 shadow-xs transition-all"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <header
        ref={headerRef}
        className="zync-site-header w-full relative z-40 bg-white border-b border-gray-200/90 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] transition-colors"
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex min-h-[70px] sm:min-h-[74px] lg:min-h-[78px] xl:min-h-[80px] py-2 sm:py-2.5 items-center justify-between gap-4">
            
            {/* Left Zone: Brand Logo (Enlarged) */}
            <div className="flex items-center flex-shrink-0">
              <button 
                onClick={() => onNavigate && onNavigate('home')}
                className="flex items-center cursor-pointer hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md"
                aria-label="Go to ZyncJobs home"
              >
                <img 
                  src={siteSettings?.siteLogo?.url ? strapiAPI.getImageUrl(siteSettings.siteLogo.url) : '/images/zyncjobs-logo.png'} 
                  alt={siteSettings?.siteTitle || 'ZyncJobs'} 
                  className="h-10 sm:h-11 lg:h-12 xl:h-[50px] w-auto object-contain"
                />
              </button>
            </div>

            {/* Middle Zone: Desktop Navigation Links (Increased font size & generous breathing room) */}
            <nav className="hidden lg:flex min-w-0 items-center gap-1 xl:gap-2 flex-1 justify-start ml-8 xl:ml-12 2xl:ml-14" aria-label="Main navigation">
              {isEmployerContext ? (
                <>
                  <button
                    onClick={() => onNavigate && onNavigate('candidate-search')}
                    className={getNavLinkClass('candidate-search')}
                  >
                    Candidate Search
                  </button>
                  <button
                    onClick={() => onNavigate && onNavigate('my-jobs')}
                    className={getNavLinkClass('my-jobs')}
                  >
                    Posted Jobs
                  </button>
                  <button
                    onClick={() => onNavigate && onNavigate('job-posting-selection')}
                    className={getNavLinkClass('job-posting-selection')}
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
                          className={getNavLinkClass(item.url)}
                        >
                          {item.label}
                        </button>
                      ))
                  ) : (
                    <>
                      <button 
                        onClick={handleFindJobsClick} 
                        className={getNavLinkClass('job-listings')}
                      >
                        {user?.type === 'employer' ? 'Candidate Search' : 'Find Jobs'}
                      </button>
                      <button 
                        onClick={handleCompaniesClick} 
                        className={getNavLinkClass('companies')}
                      >
                        Companies
                      </button>
                    </>
                  )}

                  {user?.type === 'employer' ? (
                    <button
                      onClick={() => onNavigate && onNavigate('my-jobs')}
                      className={getNavLinkClass('my-jobs')}
                    >
                      Posted Jobs
                    </button>
                  ) : (
                    <div className="relative" ref={careerDropdownRef}>
                      <button 
                        onClick={() => {
                          const next = !isCareerDropdownOpen;
                          setIsCareerDropdownOpen(next);
                          if (next) setIsDropdownOpen(false);
                        }}
                        className={`h-10 px-3.5 xl:px-4 rounded-lg text-[15px] xl:text-[15.5px] font-medium tracking-[-0.01em] transition-colors cursor-pointer inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                          isCareerDropdownOpen || isPathActive('career-resources')
                            ? 'text-blue-600 font-semibold bg-blue-50/70'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                        aria-expanded={isCareerDropdownOpen}
                        aria-haspopup="true"
                      >
                        <span>Career Resources</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${isCareerDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
                      </button>

                      {isCareerDropdownOpen && (
                        <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200/90 py-1.5 z-50 animate-in fade-in-50 duration-100" role="menu">
                          <button 
                            onClick={() => { setIsCareerDropdownOpen(false); onNavigate && onNavigate('resume-studio'); }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors group cursor-pointer"
                            role="menuitem"
                          >
                            <FileText className="w-4.5 h-4.5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-[14.5px] font-medium text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                                <span>Resume Studio</span>
                                <span className="px-1.5 py-0.2 text-[10px] font-semibold text-blue-600 bg-blue-50 rounded">AI</span>
                              </div>
                              <div className="text-xs text-gray-500 font-normal truncate">ATS analyzer & builder</div>
                            </div>
                          </button>

                          <button 
                            onClick={() => { setIsCareerDropdownOpen(false); onNavigate && onNavigate('interview-tips'); }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors group cursor-pointer"
                            role="menuitem"
                          >
                            <Video className="w-4.5 h-4.5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-[14.5px] font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Interview Preparation</div>
                              <div className="text-xs text-gray-500 font-normal truncate">Practice questions & tips</div>
                            </div>
                          </button>

                          <button 
                            onClick={() => { setIsCareerDropdownOpen(false); onNavigate && onNavigate('career-coach'); }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors group cursor-pointer"
                            role="menuitem"
                          >
                            <Compass className="w-4.5 h-4.5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-[14.5px] font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Career Guidance</div>
                              <div className="text-xs text-gray-500 font-normal truncate">Role advice & pathways</div>
                            </div>
                          </button>

                          <button 
                            onClick={() => { setIsCareerDropdownOpen(false); onNavigate && onNavigate('skill-assessment'); }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors group cursor-pointer"
                            role="menuitem"
                          >
                            <CheckSquare className="w-4.5 h-4.5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-[14.5px] font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Skill Assessment</div>
                              <div className="text-xs text-gray-500 font-normal truncate">Evaluate & test skills</div>
                            </div>
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
                    className={getNavLinkClass(user?.type === 'employer' ? 'job-posting-selection' : 'my-jobs')}
                  >
                    {user?.type === 'employer' ? 'Job Posting' : 'My Jobs'}
                  </button>
                </>
              )}
            </nav>

            {/* Right Zone: Utility Actions & User Menu (Increased proportion) */}
            <div className="hidden lg:flex items-center gap-3 xl:gap-3.5 ml-auto flex-shrink-0">
              
              {/* For Employers Button */}
              {!isEmployerContext && !user ? (
                <button 
                  onClick={handleEmployerPageClick}
                  className="h-10 px-4 inline-flex items-center justify-center text-[14.5px] xl:text-[15px] font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100/70 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  title="Hiring talent? Go to employer portal"
                >
                  For Employers
                </button>
              ) : null}

              {/* Login / Register Dropdown or Profile Trigger */}
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`h-10 group flex items-center gap-2.5 pl-1.5 pr-3.5 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                      isDropdownOpen 
                        ? 'border-blue-400 bg-blue-50/50 text-blue-700' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="true"
                    aria-label="User profile menu"
                  >
                    <div className="relative flex-shrink-0">
                      {profilePhoto ? (
                        <img 
                          src={profilePhoto} 
                          alt={displayName} 
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm">
                          {getInitials(displayName)}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                    </div>

                    <span className="text-[14.5px] font-medium max-w-[130px] truncate leading-none text-gray-800">
                      {firstName}
                    </span>

                    {isDropdownOpen ? (
                      <PanelRightClose className="w-4.5 h-4.5 text-blue-600 transition-colors flex-shrink-0" />
                    ) : (
                      <PanelRight className="w-4.5 h-4.5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
                    )}
                  </button>
                </div>
              ) : isEmployerContext ? (
                <div className="flex items-center gap-2.5">
                  {currentPath !== '/employer-login' && (
                    <button 
                      onClick={() => { setIsDropdownOpen(false); onNavigate && onNavigate('employer-login'); }}
                      className="h-10 px-4 inline-flex items-center justify-center text-[14.5px] font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                    >
                      Employer Login
                    </button>
                  )}
                  <button 
                    onClick={() => { setIsDropdownOpen(false); onNavigate && onNavigate('employer-register'); }}
                    className="h-10 px-5 inline-flex items-center justify-center text-[14.5px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    {currentPath === '/employer-login' ? 'Register' : 'Create Account'}
                  </button>
                </div>
              ) : isJobSeekerAuthPage ? (
                <div className="flex items-center gap-2.5">
                  {currentPath !== '/candidate-register' && currentPath !== '/role-selection' && (
                    <button 
                      onClick={() => { setIsDropdownOpen(false); onNavigate && onNavigate('candidate-register'); }}
                      className="h-10 px-5 inline-flex items-center justify-center text-[14.5px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                    >
                      Register
                    </button>
                  )}
                  {(currentPath === '/candidate-register' || currentPath === '/role-selection') && (
                    <button 
                      onClick={() => { setIsDropdownOpen(false); onNavigate && onNavigate('login'); }}
                      className="h-10 px-4 inline-flex items-center justify-center text-[14.5px] font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                    >
                      Login
                    </button>
                  )}
                </div>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => {
                      const next = !isDropdownOpen;
                      setIsDropdownOpen(next);
                      if (next) setIsCareerDropdownOpen(false);
                    }}
                    className={`h-10 inline-flex items-center gap-2 px-3.5 xl:px-4 text-[14.5px] xl:text-[15px] font-medium rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 border shadow-2xs ${
                      isDropdownOpen
                        ? 'bg-blue-50/50 text-blue-600 border-blue-400'
                        : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border-gray-300'
                    }`}
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="true"
                  >
                    <User className="w-4.5 h-4.5 text-gray-400" />
                    <span>Login / Register</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${isDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200/90 py-1.5 z-50 animate-in fade-in-50 duration-100" role="menu">
                      {showJobSeekerLinks && (
                        <>
                          <div className="px-4 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Job Seeker</div>
                          
                          <button 
                            onClick={handleLoginClick} 
                            className="w-full flex items-center justify-between px-4 py-2 text-[14.5px] text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                            role="menuitem"
                          >
                            <span>Login</span>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </button>

                          <button 
                            onClick={handleRegisterClick} 
                            className="w-full flex items-center justify-between px-4 py-2 text-[14.5px] text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 font-medium transition-colors cursor-pointer"
                            role="menuitem"
                          >
                            <span>Register</span>
                            <ChevronRight className="w-4 h-4 text-blue-500" />
                          </button>
                        </>
                      )}
                      
                      {showJobSeekerLinks && adminUnlocked && <hr className="my-1 border-gray-100" />}
                      
                      {adminUnlocked && (
                        <button
                          onClick={() => { setIsDropdownOpen(false); setAdminUnlocked(false); onNavigate && onNavigate('admin/login'); }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                        >
                          <Settings className="w-4 h-4 text-purple-600" />
                          <span>Admin Portal</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile & Tablet Toggle (Proportionally sized) */}
            <div className="lg:hidden flex items-center gap-2.5 flex-shrink-0">
              {user && (
                <div className="relative" ref={mobileDropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`relative p-0.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                      isDropdownOpen ? 'ring-2 ring-blue-600' : 'hover:ring-1 hover:ring-gray-300'
                    }`}
                    aria-label="User profile menu"
                    aria-expanded={isDropdownOpen}
                  >
                    <div className="relative flex-shrink-0">
                      {profilePhoto ? (
                        <img 
                          src={profilePhoto} 
                          alt={displayName} 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-xs">
                          {getInitials(displayName)}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                    </div>
                  </button>
                </div>
              )}

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-10 h-10 inline-flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
                type="button"
              >
                <div className="w-5 h-5 flex flex-col justify-center items-center">
                  <span className={`block h-0.5 w-5 bg-current transform transition-all duration-200 ease-out ${isMenuOpen ? 'rotate-45 translate-y-1' : ''}`} />
                  <span className={`block h-0.5 w-5 bg-current transform transition-all duration-200 ease-out mt-1 ${isMenuOpen ? 'opacity-0 scale-0' : ''}`} />
                  <span className={`block h-0.5 w-5 bg-current transform transition-all duration-200 ease-out mt-1 ${isMenuOpen ? '-rotate-45 -translate-y-1' : ''}`} />
                </div>
              </button>
            </div>

          </div>
        </div>
      </header>

    {renderProfileDrawer()}
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
