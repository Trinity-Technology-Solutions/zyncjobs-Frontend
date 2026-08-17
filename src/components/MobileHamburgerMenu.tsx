import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  X, 
  Search, 
  Building2, 
  FileText, 
  MessageCircle, 
  TrendingUp, 
  CheckCircle, 
  LogIn, 
  UserPlus, 
  Briefcase,
  ChevronRight,
  Sparkles,
  User,
  LogOut,
  Settings,
  Bell
} from 'lucide-react';
import JobAlertBadge from './JobAlertBadge';
import { getPendingLogoutRole } from '../utils/logoutState';
import { isEmployerPagePath } from '../utils/rolePermissions';

interface MobileHamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (page: string, data?: any) => void;
  onLogout?: () => void;
  user?: {name: string, type: 'candidate' | 'employer' | 'admin' | 'super_admin'} | null;
  siteSettings?: {
    siteLogo?: { url?: string };
    siteTitle?: string;
  };
  alertUnreadCount?: number;
}

const MobileHamburgerMenu: React.FC<MobileHamburgerMenuProps> = ({ 
  isOpen, 
  onClose, 
  onNavigate, 
  onLogout,
  user,
  siteSettings,
  alertUnreadCount = 0,
}) => {
  const [animateItems, setAnimateItems] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setAnimateItems(true), 150);
      return () => clearTimeout(timer);
    } else {
      setAnimateItems(false);
    }
  }, [isOpen]);

  const handleNavigation = (page: string, data?: any) => {
    onNavigate?.(page, data);
    onClose();
  };

  const isEmployer = user?.type === 'employer' || isEmployerPagePath(location.pathname);

  const menuItems = isEmployer ? [
    {
      icon: Search,
      label: 'Candidate Search',
      subtitle: 'Find & shortlist top talent',
      action: () => handleNavigation('candidate-search'),
      hasArrow: true,
      badge: 0,
    },
    {
      icon: Briefcase,
      label: 'Posted Jobs',
      subtitle: 'Manage your job postings',
      action: () => handleNavigation('my-jobs'),
      hasArrow: true,
      badge: 0,
    },
    {
      icon: Building2,
      label: 'Post a Job',
      subtitle: 'Create a new job posting',
      action: () => handleNavigation('job-posting-selection'),
      hasArrow: true,
      badge: 0,
    }
  ] : [
    {
      icon: Search,
      label: 'Job Search',
      subtitle: 'Find your dream job',
      action: () => handleNavigation('job-listings'),
      hasArrow: true,
      badge: 0,
    },
    {
      icon: Building2,
      label: 'Companies',
      subtitle: 'Explore top employers',
      action: () => handleNavigation('companies'),
      hasArrow: true,
      badge: 0,
    }
  ];

  const careerResources = [
    {
      icon: FileText,
      label: 'Resume Studio',
      subtitle: 'Create a professional resume',
      action: () => handleNavigation('resume-studio'),
      hasArrow: true
    },
    {
      icon: MessageCircle,
      label: 'Interview Prep',
      subtitle: 'Practice and get interview ready',
      action: () => handleNavigation('interview-tips'),
      hasArrow: true
    },
    {
      icon: TrendingUp,
      label: 'Career Guidance',
      subtitle: 'Explore career tips and advice',
      action: () => handleNavigation('career-coach'),
      hasArrow: true
    },
    {
      icon: CheckCircle,
      label: 'Skill Check',
      subtitle: 'Assess and improve your skills',
      action: () => handleNavigation('skill-assessment'),
      hasArrow: true
    }
  ];

  const handleLogout = () => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('employerToken');
      localStorage.removeItem('candidateToken');
      window.dispatchEvent(new CustomEvent('userLogout'));
      if (onLogout) onLogout();
      onClose();
      // The full reload would override React Router's navigation, so target
      // the correct login page using the remembered logout role.
      setTimeout(() => {
        const role = getPendingLogoutRole();
        if (role === 'employer') window.location.href = '/employer-login';
        else if (role === 'admin' || role === 'super_admin') window.location.href = '/admin/login';
        else window.location.href = '/login';
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      window.location.reload();
    }
  };

  const accountItems = user ? [
    {
      icon: User,
      label: 'Profile',
      subtitle: 'View and edit your profile',
      action: () => handleNavigation(user.type === 'employer' ? 'employer-profile' : 'dashboard'),
      hasArrow: true,
      badge: 0,
      isLogout: false,
    },
    {
      icon: user.type === 'employer' ? Briefcase : Search,
      label: user.type === 'employer' ? 'My Jobs' : 'My Applications',
      subtitle: user.type === 'employer' ? 'Manage your job postings' : 'Track your applications',
      action: () => handleNavigation(user.type === 'employer' ? 'my-jobs' : 'my-applications'),
      hasArrow: true,
      badge: 0,
      isLogout: false,
    },
    ...(user.type === 'candidate' ? [{
      icon: Bell,
      label: 'Job Alerts',
      subtitle: 'Manage your job alerts',
      action: () => handleNavigation('alerts'),
      hasArrow: true,
      badge: alertUnreadCount,
      isLogout: false,
    }] : []),
    {
      icon: Settings,
      label: 'Settings',
      subtitle: 'Account preferences',
      action: () => handleNavigation('settings'),
      hasArrow: true,
      badge: 0,
      isLogout: false,
    },
    {
      icon: LogOut,
      label: 'Logout',
      subtitle: 'Sign out of your account',
      action: handleLogout,
      hasArrow: false,
      badge: 0,
      isLogout: true,
    }
  ] : (() => {
    if (isEmployer) {
      return [
        { icon: LogIn, label: 'Employer Login', action: () => handleNavigation('employer-login'), hasArrow: true, badge: 0 },
        { icon: UserPlus, label: 'Create Employer Account', action: () => handleNavigation('employer-register'), hasArrow: true, badge: 0 },
      ];
    }
    const isJobSeekerAuthPage = location.pathname === '/login' || location.pathname === '/role-selection' || location.pathname === '/candidate-register';

    const links: Array<{
      icon: any;
      label: string;
      subtitle?: string;
      action: () => void;
      hasArrow: boolean;
      badge: number;
      isLogout?: boolean;
    }> = [];
    if (!isJobSeekerAuthPage) {
      links.push(
        { icon: LogIn, label: 'Login', action: () => handleNavigation('login'), hasArrow: true, badge: 0 },
        { icon: UserPlus, label: 'Register', action: () => handleNavigation('candidate-register'), hasArrow: true, badge: 0 }
      );
    }
    return links;
  })();

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 lg:hidden ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full w-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out lg:hidden flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center">
            <img 
              src={siteSettings?.siteLogo?.url || '/images/zyncjobs-logo.png'} 
              alt="ZYNC JOBS" 
              className="h-8 w-auto"
            />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            aria-label="Close menu"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden" 
          style={{ 
            maxHeight: 'calc(100vh - 88px)',
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth'
          }}
        >
          {/* User Greeting Section */}
          {user && (
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Hello, {user.name || 'User'}!</div>
                  <div className="text-sm text-gray-500 capitalize">{user.type} Account</div>
                </div>
              </div>
            </div>
          )}

          {/* Main Navigation */}
          <div className="px-6 py-6">
            <div className="space-y-3">
              {menuItems.map((item, index) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`group flex items-center justify-between w-full p-4 rounded-2xl bg-white hover:bg-blue-50 transition-all duration-200 transform ${
                    animateItems ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
                  }`}
                  style={{ 
                    transitionDelay: animateItems ? `${index * 50}ms` : '0ms',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                    border: '1px solid rgba(229, 231, 235, 0.3)'
                  }}
                >
                  <div className="flex items-center flex-1">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mr-4 group-hover:bg-blue-100 transition-colors duration-200 flex-shrink-0">
                      <item.icon className="w-7 h-7 text-blue-600" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-gray-900 text-base leading-tight">{item.label}</div>
                      <div className="text-sm text-gray-500 leading-tight mt-0.5">{item.subtitle}</div>
                    </div>
                  </div>
                  {item.hasArrow && (
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors duration-200 flex-shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Career Resources Section */}
          {!isEmployer && (
            <div className="px-6 py-4">
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
                  CAREER RESOURCES
                </h3>
              </div>
              <div className="space-y-3">
                {careerResources.map((item, index) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={`group flex items-center justify-between w-full p-4 rounded-2xl bg-white hover:bg-blue-50 transition-all duration-200 transform ${
                      animateItems ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
                    }`}
                    style={{ 
                      transitionDelay: animateItems ? `${(menuItems.length + index) * 50}ms` : '0ms',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                      border: '1px solid rgba(229, 231, 235, 0.3)'
                    }}
                  >
                    <div className="flex items-center flex-1">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mr-4 group-hover:bg-blue-100 transition-colors duration-200 flex-shrink-0">
                        <item.icon className="w-7 h-7 text-blue-600" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-gray-900 text-base leading-tight">{item.label}</div>
                        <div className="text-sm text-gray-500 leading-tight mt-0.5">{item.subtitle}</div>
                      </div>
                    </div>
                    {item.hasArrow && (
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors duration-200 flex-shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Account Section */}
          <div className="px-6 py-4">
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
                {user ? 'ACCOUNT' : 'GET STARTED'}
              </h3>
            </div>
            <div className="space-y-3">
              {accountItems.map((item, index) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`group flex items-center justify-between w-full p-4 rounded-2xl transition-all duration-200 transform ${
                    animateItems ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
                  } ${
                    item.isLogout 
                      ? 'bg-white hover:bg-red-50 border-red-100' 
                      : 'bg-white hover:bg-blue-50'
                  }`}
                  style={{ 
                    transitionDelay: animateItems ? `${(menuItems.length + (user && user.type !== 'employer' ? careerResources.length : 0) + index) * 50}ms` : '0ms',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                    border: item.isLogout ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(229, 231, 235, 0.3)'
                  }}
                >
                  <div className="flex items-center flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-colors duration-200 flex-shrink-0 ${
                      item.isLogout 
                        ? 'bg-red-50 group-hover:bg-red-100' 
                        : 'bg-blue-50 group-hover:bg-blue-100'
                    }`}>
                      <item.icon className={`w-7 h-7 ${item.isLogout ? 'text-red-600' : 'text-blue-600'}`} />
                    </div>
                    <div className="text-left flex-1">
                      <div className={`font-semibold text-base leading-tight ${item.isLogout ? 'text-red-900' : 'text-gray-900'}`}>
                        {item.label}
                      </div>
                      {item.subtitle && (
                        <div className="text-sm text-gray-500 leading-tight mt-0.5">{item.subtitle}</div>
                      )}
                    </div>
                    {item.badge > 0 && <JobAlertBadge count={item.badge} className="ml-2" />}
                  </div>
                  {item.hasArrow && (
                    <ChevronRight className={`w-5 h-5 transition-colors duration-200 flex-shrink-0 ml-2 ${
                      item.isLogout 
                        ? 'text-red-400 group-hover:text-red-600' 
                        : 'text-gray-400 group-hover:text-blue-600'
                    }`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Promotional Card */}
          <div className="px-6 py-4 pb-8">
            <div 
              className={`p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 transform transition-all duration-300 ${
                animateItems ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{ 
                transitionDelay: animateItems ? '400ms' : '0ms',
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.1)'
              }}
            >
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mr-4 flex-shrink-0">
                  <Briefcase className="w-7 h-7 text-blue-600" />
                </div>
                <div className="flex-1">
                  {isEmployer ? (
                    <>
                      <h4 className="font-bold text-gray-900 text-lg mb-2">Hire the right talent</h4>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        Post jobs and let AI shortlist the best candidates for you.
                      </p>
                      <button
                        onClick={() => handleNavigation('job-posting-selection')}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors duration-200"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Post a Job
                      </button>
                    </>
                  ) : (
                    <>
                      <h4 className="font-bold text-gray-900 text-lg mb-2">Find the right opportunity</h4>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        Explore thousands of jobs and grow your career with us.
                      </p>
                      <button
                        onClick={() => handleNavigation('job-listings')}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors duration-200"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Explore Jobs
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileHamburgerMenu;
