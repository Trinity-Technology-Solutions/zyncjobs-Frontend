import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, Search, User, Building, ChevronDown, Settings } from 'lucide-react';
import { API_ENDPOINTS } from '../config/env';
import { useSiteSettings } from '../store/useSiteSettings';
import { useNavigation } from '../store/useNavigation';
import { strapiAPI } from '../api/strapi';
import { tokenStorage } from '../utils/tokenStorage';


interface HeaderProps {
  onNavigate?: (page: string) => void;
  user?: {name: string, type: 'candidate' | 'employer' | 'admin' | 'super_admin'} | null;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCareerDropdownOpen, setIsCareerDropdownOpen] = useState(false);
  const [profileMetrics, setProfileMetrics] = useState({ jobsPosted: 0, applicationsReceived: 0, searchAppearances: 0, recruiterActions: 0 });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const careerDropdownRef = useRef<HTMLDivElement>(null);

  // Secret typed sequence to reveal admin login
  useEffect(() => {
    const secret = 'zyncadmin';
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
    console.log('Header - siteSettings:', siteSettings);
    console.log('Header - logo URL:', siteSettings?.siteLogo?.url);
  }, [siteSettings]);

  useEffect(() => {
    fetchNavigation();
    fetchSiteSettings();
  }, []);

  const handleLoginClick = () => {
    setIsDropdownOpen(false);
    if (onNavigate) {
      onNavigate('login');
    }
  };

  const handleRegisterClick = () => {
    setIsDropdownOpen(false);
    if (onNavigate) {
      onNavigate('role-selection');
    }
  };

  const handleEmployerLoginClick = () => {
    setIsDropdownOpen(false);
    if (onNavigate) {
      onNavigate('employer-login');
    }
  };

  const handleEmployersClick = () => {
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

  const handleCareerResourcesClick = () => {
    if (onNavigate) {
      if (user?.type === 'employer') return; // employers cannot access career resources
      if (user) {
        onNavigate('career-resources');
      } else {
        onNavigate('register');
      }
    }
  };





  useEffect(() => {
    fetchSiteSettings();
  }, []);

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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchProfileMetrics = async () => {
      if (!user) return;
      try {
        // Use user prop directly — don't rely on localStorage which may be stale
        const userEmail = (user as any).email || (() => { try { return JSON.parse(localStorage.getItem('user') || '{}').email; } catch { return ''; } })();
        if (!userEmail) return;

        if (user.type === 'employer') {
          const token = tokenStorage.getAccess();
          const headers: any = token ? { 'Authorization': `Bearer ${token}` } : {};
          const [jobsRes, appsRes] = await Promise.all([
            fetch(`${API_ENDPOINTS.JOBS}?limit=1000`, { headers }),
            fetch(`${API_ENDPOINTS.APPLICATIONS}`, { headers }),
          ]);
          let jobsPosted = 0;
          let applicationsReceived = 0;
          if (jobsRes.ok) {
            const d = await jobsRes.json();
            const allJobs = Array.isArray(d) ? d : d.jobs || [];
            jobsPosted = allJobs.filter((j: any) =>
              j.postedBy === userEmail || j.employerEmail === userEmail
            ).length;
          }
          if (appsRes.ok) {
            const d = await appsRes.json();
            const allApps = Array.isArray(d) ? d : d.applications || [];
            applicationsReceived = allApps.filter((a: any) =>
              a.employerEmail === userEmail
            ).length;
          }
          setProfileMetrics(prev => ({ ...prev, jobsPosted, applicationsReceived }));
        } else {
          // Fetch real analytics from backend
          const analyticsRes = await fetch(`${API_ENDPOINTS.BASE_URL}/analytics/profile/${encodeURIComponent(userEmail)}?userType=candidate`);
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
        const userEmail = (user as any).email || (() => { try { return JSON.parse(localStorage.getItem('user') || '{}').email; } catch { return ''; } })();
        if (!userEmail) return;

        if (user.type === 'employer') {
              // Fetch employer notifications
              const [appsRes, jobsRes, interviewsRes] = await Promise.all([
                fetch(API_ENDPOINTS.APPLICATIONS),
                fetch(API_ENDPOINTS.JOBS),
                fetch(`${API_ENDPOINTS.BASE_URL}/interviews?employerEmail=${encodeURIComponent(userEmail)}`)
              ]);
              
              const realNotifications: Array<{id: string; type: string; title: string; message: string; time: string}> = [];
              
              if (appsRes.ok) {
                const appsData = await appsRes.json();
                const allApps = appsData.applications || appsData || [];
                const employerApps = allApps.filter((app: any) => app.employerEmail === userEmail);
                employerApps.slice(0, 3).forEach((app: any) => {
                  realNotifications.push({ id: `app_${app._id || app.id}`, type: 'application', title: 'New application received', message: `${app.candidateName || app.candidateEmail} applied for a position`, time: new Date(app.createdAt).toLocaleDateString() || '1d ago' });
                });
              }
              if (interviewsRes.ok) {
                const interviews = Array.isArray(await interviewsRes.json()) ? await interviewsRes.clone().json() : [];
                interviews.slice(0, 2).forEach((interview: any) => {
                  realNotifications.push({ id: `interview_${interview._id}`, type: 'interview', title: 'Interview scheduled', message: `Interview with ${interview.candidateName || 'candidate'} scheduled`, time: new Date(interview.date).toLocaleDateString() || '1d ago' });
                });
              }
              if (jobsRes.ok) {
                const allJobs = Array.isArray(await jobsRes.json()) ? await jobsRes.clone().json() : [];
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
    
    // Socket.io real-time analytics update for candidates
    let socket: any = null;
    if (user?.type === 'candidate' || user?.type !== 'employer') {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          const userEmail = parsedUser.email;
          if (userEmail) {
            const socketUrl = (import.meta.env.VITE_API_URL || '/api').replace('/api', '');
            socket = io(socketUrl, { transports: ['websocket', 'polling'] });
            socket.on(`analytics_update:${userEmail}`, () => {
              fetchProfileMetrics();
            });
          }
        }
      } catch { /* ignore */ }
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

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="w-full pl-6 pr-10 sm:pl-8 sm:pr-12">
        <div className="flex items-center justify-between py-4">
          <div className="flex-shrink-0">
            <button 
              onClick={() => onNavigate && onNavigate('home')}
              className="flex items-center cursor-pointer"
            >
              <img 
                src={siteSettings?.siteLogo?.url ? strapiAPI.getImageUrl(siteSettings.siteLogo.url) : '/images/zyncjobs-logo.png'} 
                alt={siteSettings?.siteTitle || 'ZyncJobs'} 
                className="h-16 w-auto"
              />
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 flex-1 justify-start ml-8">
            {navItems.length > 0 ? (
              navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate && onNavigate(item.url)}
                  className="text-gray-900 hover:text-gray-600 font-medium transition-colors"
                >
                  {item.label}
                </button>
              ))
            ) : (
              <>
                <button onClick={handleFindJobsClick} className="text-gray-900 hover:text-gray-600 font-medium transition-colors">
                  {user?.type === 'employer' ? 'Candidate Search' : 'Job Search'}
                </button>
                <button onClick={handleCompaniesClick} className="text-gray-900 hover:text-gray-600 font-medium transition-colors">
                  Companies
                </button>
              </>
            )}

            {user?.type === 'employer' ? (
              <button
                onClick={() => onNavigate && onNavigate('my-jobs')}
                className="text-gray-900 hover:text-gray-600 font-medium transition-colors"
              >
                Posted Jobs
              </button>
            ) : (
              <div className="relative" ref={careerDropdownRef}>
                <button 
                  onClick={() => setIsCareerDropdownOpen(!isCareerDropdownOpen)}
                  className="flex items-center space-x-1 text-gray-900 hover:text-gray-600 font-medium transition-colors"
                >
                  <span>Career Resources</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isCareerDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isCareerDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <button 
                      onClick={() => { setIsCareerDropdownOpen(false); onNavigate && onNavigate('resume-studio'); }}
                      className="flex items-center w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Resume Studio
                    </button>
                    <button 
                      onClick={() => { setIsCareerDropdownOpen(false); onNavigate && onNavigate('interview-tips'); }}
                      className="flex items-center w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Interview Preparation
                    </button>
                    <button 
                      onClick={() => { setIsCareerDropdownOpen(false); onNavigate && onNavigate('career-coach'); }}
                      className="flex items-center w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Career Guidance
                    </button>
                    <button 
                      onClick={() => { setIsCareerDropdownOpen(false); onNavigate && onNavigate('skill-assessment'); }}
                      className="flex items-center w-full text-left px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
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
                  onNavigate && onNavigate('role-selection');
                }
              }}
              className="text-gray-900 hover:text-gray-600 font-medium transition-colors"
            >
              {user?.type === 'employer' ? 'Job Posting' : 'My Jobs'}
            </button>

          </nav>

          {/* Right side items */}
          <div className="hidden md:flex items-center space-x-4 ml-auto">

            {/* Login/Register Dropdown */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 text-gray-900 hover:text-gray-600 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
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
                    <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
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
                      <div className="p-6 overflow-y-auto h-full pb-20">
                        {/* User Info */}
                        <div className="flex items-center space-x-4 mb-8">
                          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">{user.name}</p>
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
                                onNavigate && onNavigate('job-matches');
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
                                // For employers, go to dashboard and show alerts section
                                onNavigate && onNavigate('dashboard');
                                // Trigger alerts section after navigation
                                setTimeout(() => {
                                  const event = new CustomEvent('showAlerts');
                                  window.dispatchEvent(event);
                                }, 100);
                              } else {
                                // For candidates, go to alerts page
                                onNavigate && onNavigate('alerts');
                              }
                            }} 
                            className="flex items-center w-full text-left px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h5m5 0v6" />
                            </svg>
                            Alerts
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
                            onClick={() => {
                              setIsDropdownOpen(false);
                              onLogout && onLogout();
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
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-1 text-gray-900 hover:text-gray-600 transition-colors"
                >
                  <span>Login/Register</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <p className="px-4 py-1 text-xs text-gray-400 uppercase tracking-wide">Job Seeker</p>
                    <button onClick={handleLoginClick} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                      Login
                    </button>
                    <button onClick={handleRegisterClick} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                      Register
                    </button>
                    <hr className="my-1" />
                    <p className="px-4 py-1 text-xs text-gray-400 uppercase tracking-wide">Employer</p>
                    <button onClick={handleEmployerLoginClick} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                      For Employers / Post Jobs
                    </button>
                    <hr className="my-1" />
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
          <div className="md:hidden flex-shrink-0">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-900 hover:text-gray-600 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-white">
            <div className="space-y-1">
              <button onClick={() => { handleFindJobsClick(); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2.5 text-gray-800 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium">
                {user?.type === 'employer' ? 'Candidate Search' : 'Job Search'}
              </button>
              <button onClick={() => { handleCompaniesClick(); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2.5 text-gray-800 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium">
                Companies
              </button>
              {user?.type !== 'employer' && (
                <>
                  <p className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Career Resources</p>
                  <button onClick={() => { onNavigate && onNavigate('resume-studio'); setIsMenuOpen(false); }} className="flex items-center w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-sm">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Resume Studio
                  </button>
                  <button onClick={() => { onNavigate && onNavigate('interview-tips'); setIsMenuOpen(false); }} className="flex items-center w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-sm">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Interview Prep
                  </button>
                  <button onClick={() => { onNavigate && onNavigate('career-coach'); setIsMenuOpen(false); }} className="flex items-center w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-sm">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Career Guidance
                  </button>
                  <button onClick={() => { onNavigate && onNavigate('skill-assessment'); setIsMenuOpen(false); }} className="flex items-center w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-sm">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Skill Check
                  </button>
                </>
              )}
              {user?.type === 'employer' && (
                <button onClick={() => { onNavigate && onNavigate('my-jobs'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2.5 text-gray-800 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium">Posted Jobs</button>
              )}
              <button onClick={() => { if (user) { onNavigate && onNavigate(user.type === 'employer' ? 'job-posting-selection' : 'my-jobs'); } else { onNavigate && onNavigate('role-selection'); } setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2.5 text-gray-800 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium">
                {user?.type === 'employer' ? 'Job Posting' : 'My Jobs'}
              </button>
              <div className="pt-3 border-t border-gray-200 mt-2">
                {user ? (
                  <>
                    <button onClick={() => { onNavigate && onNavigate('dashboard'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2.5 text-gray-800 hover:bg-blue-50 rounded-lg font-medium">👤 My Profile</button>
                    <button onClick={() => { onNavigate && onNavigate('settings'); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2.5 text-gray-800 hover:bg-blue-50 rounded-lg font-medium">⚙️ Settings</button>
                    <button onClick={() => { onLogout && onLogout(); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg font-medium">🚪 Logout</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { handleLoginClick(); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2.5 text-blue-600 hover:bg-blue-50 rounded-lg font-medium">Login</button>
                    <button onClick={() => { handleRegisterClick(); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2.5 text-gray-800 hover:bg-blue-50 rounded-lg font-medium">Register</button>
                    <button onClick={() => { handleEmployerLoginClick(); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2.5 text-gray-800 hover:bg-blue-50 rounded-lg font-medium">For Employers</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
