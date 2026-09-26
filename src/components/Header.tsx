import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  X, Search, User, Building, ChevronDown, Settings, 
  FileText, Sparkles, Bell, LogOut, ChevronRight, Briefcase, PlusCircle, LayoutDashboard,
  PanelRight, PanelRightClose 
} from 'lucide-react';
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
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
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
  const [isScrolled, setIsScrolled] = useState(true); // Default to light header
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const careerDropdownRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
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
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 20) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY.current + 2) {
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY.current - 2) {
        setIsHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;

      // Use standard scroll detection for the header glass effect
      // We keep it 'light' (isScrolled = true) by default for the new design
      const scrolled = currentScrollY > 20;
      
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
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
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
      <GlassFilter />
      <header
        className="zync-site-header fixed top-0 left-0 right-0 z-50 bg-transparent px-2 pt-2 sm:px-4 sm:pt-3 transition-transform duration-300 ease-in-out"
        style={{ transform: isHeaderVisible ? 'translateY(0)' : 'translateY(-100%)' }}
      >
      <div
        className="mx-auto w-full max-w-[1440px] rounded-2xl border transition-all duration-300"
        style={isScrolled ? {
          backdropFilter: 'blur(18px) saturate(150%)',
          WebkitBackdropFilter: 'blur(18px) saturate(150%)',
          background: 'rgba(255, 255, 255, 0.88)',
          borderColor: 'transparent',
          boxShadow: 'none',
        } : {
          backdropFilter: 'blur(18px) saturate(150%)',
          WebkitBackdropFilter: 'blur(18px) saturate(150%)',
          background: 'rgba(20, 20, 25, 0.82)',
          borderColor: 'transparent',
          boxShadow: 'none',
        }}
      >
      <div className="w-full px-4 sm:px-6 lg:px-7">
        <div className="flex min-h-[64px] items-center justify-between gap-3 py-2.5 sm:min-h-[68px] sm:gap-4">
          <div className="flex-shrink-0">
            <button 
              onClick={() => onNavigate && onNavigate('home')}
              className="flex items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              aria-label="Go to ZyncJobs home"
            >
              <img 
                src={siteSettings?.siteLogo?.url ? strapiAPI.getImageUrl(siteSettings.siteLogo.url) : '/images/zyncjobs-logo.png'} 
                alt={siteSettings?.siteTitle || 'ZyncJobs'} 
                className="h-11 sm:h-12 lg:h-[52px] w-auto object-contain"
              />
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex min-w-0 items-center gap-4 xl:gap-6 flex-1 justify-start ml-2 xl:ml-6 text-[15px] 2xl:text-base" aria-label="Main navigation">
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
                  <ChevronDown className={`w-5 h-5 transition-transform ${isCareerDropdownOpen ? 'rotate-180' : ''}`} />
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
          <div className="hidden lg:flex items-center gap-2 xl:gap-3 ml-auto text-[15px] 2xl:text-base">

            {/* For Employers Button - only when not logged in and outside employer context */}
            {!isEmployerContext && !user ? (
              <button 
                onClick={handleEmployerPageClick}
                className="px-5 py-2.5 text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded whitespace-nowrap"
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
                  className={`group flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    isDropdownOpen 
                      ? isScrolled
                        ? 'bg-blue-50/90 text-blue-700 shadow-sm border border-blue-200/80 ring-2 ring-blue-500/20' 
                        : 'bg-white/20 text-white border border-white/30 ring-2 ring-white/30'
                      : isScrolled
                        ? 'hover:bg-gray-100/80 border border-transparent hover:border-gray-200/70 text-gray-700'
                        : 'hover:bg-white/10 border border-transparent text-white'
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
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-white shadow-sm tracking-wide">
                        {getInitials(displayName)}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white ring-1 ring-emerald-400/20" />
                  </div>

                  <span className={`text-base font-semibold max-w-[140px] truncate leading-none ${isScrolled ? 'text-gray-800' : 'text-white'}`}>
                    {firstName}
                  </span>

                  {isDropdownOpen ? (
                    <PanelRightClose className={`w-5 h-5 transition-colors duration-200 flex-shrink-0 ${
                      isScrolled ? 'text-blue-600' : 'text-white'
                    }`} />
                  ) : (
                    <PanelRight className={`w-5 h-5 transition-colors duration-200 flex-shrink-0 ${
                      isScrolled ? 'text-gray-400 group-hover:text-blue-600' : 'text-white/70 group-hover:text-white'
                    }`} />
                  )}
                </button>
              </div>
            ) : isEmployerContext ? (
              <>
                {currentPath !== '/employer-login' && (
                  <button 
                    onClick={() => { setIsDropdownOpen(false); onNavigate && onNavigate('employer-login'); }}
                    className="px-5 py-2.5 text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  >
                    Employer Login
                  </button>
                )}
                <button 
                  onClick={() => { setIsDropdownOpen(false); onNavigate && onNavigate('employer-register'); }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors shadow-sm"
                >
                  {currentPath === '/employer-login' ? 'Register' : 'Create Account'}
                </button>
              </>
            ) : isJobSeekerAuthPage ? (
              <>
                {currentPath !== '/candidate-register' && currentPath !== '/role-selection' && (
                  <button 
                    onClick={() => { setIsDropdownOpen(false); onNavigate && onNavigate('candidate-register'); }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors shadow-sm"
                  >
                    Register
                  </button>
                )}
                {(currentPath === '/candidate-register' || currentPath === '/role-selection') && (
                  <button 
                    onClick={() => { setIsDropdownOpen(false); onNavigate && onNavigate('login'); }}
                    className="px-5 py-2.5 text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
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
                  <ChevronDown className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
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

          {/* Mobile menu and profile buttons */}
          <div className="lg:hidden flex items-center gap-2 flex-shrink-0">
            {user && (
              <div className="relative" ref={mobileDropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`relative p-0.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    isDropdownOpen ? 'ring-2 ring-blue-600' : 'hover:ring-2 hover:ring-gray-300'
                  }`}
                  aria-label="User profile menu"
                  aria-expanded={isDropdownOpen}
                >
                  <div className="relative flex-shrink-0">
                    {profilePhoto ? (
                    <img 
                      src={profilePhoto} 
                      alt={displayName} 
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-white shadow-sm tracking-wide">
                        {getInitials(displayName)}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white ring-1 ring-emerald-400/20" />
                  </div>
                </button>
              </div>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative p-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              type="button"
            >
              <div className="w-7 h-7 flex flex-col justify-center items-center">
                <span className={`block h-0.5 w-7 bg-current transform transition-all duration-300 ease-out ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                <span className={`block h-0.5 w-7 bg-current transform transition-all duration-300 ease-out mt-1.5 ${isMenuOpen ? 'opacity-0 scale-0' : ''}`} />
                <span className={`block h-0.5 w-7 bg-current transform transition-all duration-300 ease-out mt-1.5 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
              </div>
            </button>
          </div>
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
