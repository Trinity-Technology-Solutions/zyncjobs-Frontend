import React, { useState, useEffect } from 'react';
import { LayoutDashboard, User, Briefcase, MessageSquare, FileText, Bookmark, CreditCard, Settings, Trash2, LogOut, Search, Bell, Plus, MoreVertical, Users, Eye, Edit, UserPlus, FileSearch, Folder } from 'lucide-react';
import { API_ENDPOINTS } from '../config/constants';
import { decodeHtmlEntities, formatDate, formatSalary } from '../utils/textUtils';
import BackButton from '../components/BackButton';
import AutoRejectionSettings from '../components/AutoRejectionSettings';
import ScheduleInterviewModal from '../components/ScheduleInterviewModal';

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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  useEffect(() => {
    // Mock employer notifications
    setNotifications([
      {
        id: 1,
        type: 'application',
        title: 'New application received',
        message: 'John Doe applied for Software Engineer position',
        time: '2h ago'
      },
      {
        id: 2,
        type: 'interview',
        title: 'Interview scheduled',
        message: 'Interview with Sarah Smith scheduled for tomorrow',
        time: '1d ago'
      },
      {
        id: 3,
        type: 'job',
        title: 'Job posting approved',
        message: 'Your React Developer job posting is now live',
        time: '2d ago'
      }
    ]);
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      console.log('Dashboard - User data:', parsedUser);
      setUser(parsedUser);
      setEmployerName(parsedUser.name || 'Employer');
      setCompanyName(parsedUser.company || parsedUser.companyName || 'Company');
      setCompanyLogo(parsedUser.companyLogo || '');
      setCompanyWebsite(parsedUser.companyWebsite || '');
      
      // Fetch company domain from companies.json
      fetchCompanyDomain(parsedUser.company || parsedUser.companyName || 'Company');
      
      fetchDashboardData(parsedUser);
    }
  }, []);

  const fetchCompanyDomain = async (companyName: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/companies`);
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

  const fetchDashboardData = async (userData: any) => {
    try {
      setError(null);
      console.log('Fetching dashboard data for user:', userData);
      
      // Get user ID - try different possible fields
      const userId = userData.id || userData._id || userData.userId;
      const userEmail = userData.email;
      const userName = userData.name || userData.fullName;
      
      console.log('Using userId:', userId, 'userEmail:', userEmail, 'userName:', userName);
      
      const [jobsRes, appsRes, interviewsRes, statsRes, activityRes] = await Promise.all([
        fetch(API_ENDPOINTS.JOBS),
        fetch(API_ENDPOINTS.APPLICATIONS),
        fetch(`${API_ENDPOINTS.BASE_URL}/api/interviews?employerId=${userId || ''}&employerEmail=${userEmail || ''}`),
        fetch(`${API_ENDPOINTS.BASE_URL}/api/dashboard/stats?employerId=${userId || ''}&employerEmail=${userEmail || ''}&userName=${userName || ''}`),
        fetch(`${API_ENDPOINTS.BASE_URL}/api/dashboard/recent-activity?employerId=${userId || ''}&employerEmail=${userEmail || ''}&userName=${userName || ''}`)
      ]);

      if (!jobsRes.ok) {
        throw new Error(`Jobs API error: ${jobsRes.status}`);
      }

      let employerJobs = [];
      let employerApps = [];

      if (jobsRes.ok) {
        const allJobs = await jobsRes.json();
        console.log('Dashboard - All jobs:', allJobs.length);
        console.log('Dashboard - User data for filtering:', userData);
        employerJobs = Array.isArray(allJobs) ? allJobs.filter((job: any) => {
          const matchesEmail = job.postedBy === userEmail;
          console.log(`Job: ${job.jobTitle} at ${job.company}, matchesEmail: ${matchesEmail}`);
          return matchesEmail;
        }) : [];
        console.log('Dashboard - Filtered employer jobs:', employerJobs.length);
        setJobs(employerJobs);
      }

      if (appsRes.ok) {
        try {
          const response = await appsRes.json();
          const allApps = response.applications || response || [];
          console.log('Dashboard - All applications:', allApps.length);
          employerApps = Array.isArray(allApps) ? allApps.filter((app: any) => {
            const matchesEmail = app.employerEmail === userEmail;
            console.log(`App: ${app.candidateName}, matchesEmail: ${matchesEmail}`);
            return matchesEmail;
          }) : [];
          console.log('Dashboard - Filtered employer applications:', employerApps.length);
          setApplications(employerApps);
        } catch (jsonError) {
          console.error('Error parsing applications JSON:', jsonError);
          setApplications([]);
        }
      } else {
        console.log('Applications API not available or returned error');
        setApplications([]);
      }

      // Fetch interviews
      if (interviewsRes.ok) {
        try {
          const interviewsData = await interviewsRes.json();
          setInterviews(Array.isArray(interviewsData) ? interviewsData : []);
        } catch (e) {
          console.log('Interviews API failed');
          setInterviews([]);
        }
      } else {
        setInterviews([]);
      }

      // Fetch dashboard stats - use local job count if API fails
      let dashboardStats = { activeJobs: employerJobs.length, applications: employerApps.length, interviews: 0, hired: 0 };
      if (statsRes.ok) {
        try {
          const stats = await statsRes.json();
          dashboardStats = { ...dashboardStats, ...stats };
        } catch (e) {
          console.log('Stats API failed, using local count');
        }
      }
      setDashboardStats(dashboardStats);

      // Fetch recent activity - use local job data if API fails
      let recentActivity = [];
      if (activityRes.ok) {
        try {
          const activity = await activityRes.json();
          recentActivity = activity;
        } catch (e) {
          console.log('Activity API failed, using local data');
        }
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
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
      setApplications([]);
      setJobs([]);
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
      return '/images/company-logos/trinity-logo.png';
    }
    
    // First try to use company logo from user data
    if (companyLogo && companyLogo.trim() !== '' && !companyLogo.includes('clearbit.com') && !companyLogo.includes('gstatic.com')) {
      console.log('Using stored company logo:', companyLogo);
      return companyLogo;
    }
    
    // Try to get logo from company name using Clearbit
    if (companyName && companyName.trim() !== '') {
      const companyDomain = companyName.toLowerCase().replace(/\s+/g, '') + '.com';
      console.log('Trying Clearbit logo for:', companyDomain);
      return `https://logo.clearbit.com/${companyDomain}`;
    }
    
    // Fallback to avatar with company name or employer name
    const displayName = companyName || employerName;
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
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <div className="flex items-center">
            <span className="mr-2">⚠️</span>
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
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
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  console.log('Logo failed to load, using fallback');
                  const displayName = companyName || employerName;
                  img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=128&background=6366f1&color=ffffff&bold=true`;
                }}
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">{employerName}</p>
              <p className="text-xs text-gray-500">{companyName}</p>
              {companyDomain && (
                <a 
                  href={`https://${companyDomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700 block truncate"
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
            <Bookmark className="w-5 h-5" />
            <span className="font-medium">Save Candidate</span>
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
        <div className="bg-white border-b border-gray-200 px-8 py-4">
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
              <button type="button" aria-label="Notifications" className="relative p-2 text-gray-600 hover:text-gray-900" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
                    <div className="p-4 border-b flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                      <button 
                        type="button"
                        onClick={() => setShowNotifications(false)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Close notifications"
                        aria-label="Close notifications"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="h-full overflow-y-auto pb-20">
                      <div className="p-3 text-sm text-gray-500 border-b bg-gray-50">Today</div>
                      {notifications.map((notification) => (
                        <div key={notification.id} className="p-4 border-b hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-start space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                              notification.type === 'application' ? 'bg-blue-500' : 
                              notification.type === 'interview' ? 'bg-green-500' : 'bg-purple-500'
                            }`}>
                              {notification.type === 'application' ? 'A' : 
                               notification.type === 'interview' ? 'I' : 'J'}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-1">{notification.title}</h4>
                              <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                              <span className="text-xs text-gray-400">{notification.time}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
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
                    <div key={application._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {application.candidateName?.charAt(0).toUpperCase() || 'C'}
                            </span>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-xl font-semibold text-gray-900">
                                  {application.candidateName || application.candidateEmail}
                                </h3>
                                <p className="text-lg text-gray-700 font-medium">
                                  Applied for: {application.jobId?.jobTitle || application.jobId?.title}
                                </p>
                              </div>
                              <span className="px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-700 border border-gray-300">
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              <span>📧 {application.candidateEmail}</span>
                              <span>📅 Applied: {new Date(application.createdAt).toLocaleDateString()}</span>
                            </div>

                            {application.coverLetter && application.coverLetter !== 'No cover letter' && (
                              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mb-3">
                                <strong>Cover Letter:</strong> {application.coverLetter.length > 150 ? 
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
                                      let resumeUrl = application.resumeUrl;
                                      
                                      // Handle different URL formats
                                      if (!resumeUrl.startsWith('http')) {
                                        resumeUrl = resumeUrl.startsWith('/') 
                                          ? `${API_ENDPOINTS.BASE_URL}${resumeUrl}`
                                          : `${API_ENDPOINTS.BASE_URL}/uploads/${resumeUrl}`;
                                      }
                                      
                                      console.log('Attempting to open resume:', resumeUrl);
                                      
                                      // Test if file exists with better error handling
                                      try {
                                        const testResponse = await fetch(resumeUrl, { 
                                          method: 'HEAD',
                                          mode: 'cors'
                                        });
                                        
                                        if (testResponse.ok) {
                                          // Open in new tab with proper handling
                                          const newWindow = window.open(resumeUrl, '_blank', 'noopener,noreferrer');
                                          if (!newWindow) {
                                            // Fallback if popup blocked
                                            window.location.href = resumeUrl;
                                          }
                                        } else {
                                          throw new Error(`File not accessible: ${testResponse.status}`);
                                        }
                                      } catch (fetchError) {
                                        console.error('Resume fetch error:', fetchError);
                                        // Try direct download as fallback
                                        const link = document.createElement('a');
                                        link.href = resumeUrl;
                                        link.download = `resume_${application.candidateName || 'candidate'}.pdf`;
                                        link.target = '_blank';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      }
                                    } catch (error) {
                                      console.error('Resume open error:', error);
                                      alert('Unable to open resume. The file may have been moved or deleted. Please ask the candidate to re-upload their resume.');
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center space-x-1 bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                  <span>📄</span>
                                  <span>View Resume</span>
                                </button>
                              </div>
                            ) : (
                              <div className="mb-3">
                                <span className="text-gray-500 text-sm">📄 Resume not available</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="ml-6 flex flex-col space-y-2">
                          <select
                            value={application.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              try {
                                const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}/${application._id}/status`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: newStatus }),
                                });
                                
                                if (response.ok) {
                                  // Update local state immediately
                                  setApplications(prev => 
                                    prev.map(app => 
                                      app._id === application._id ? { ...app, status: newStatus } : app
                                    )
                                  );
                                  
                                  // Show success message
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
                                // Reset select to original value
                                e.target.value = application.status;
                              }
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors text-sm"
                          >
                            Schedule Interview
                          </button>
                          <button 
                            onClick={() => onNavigate('candidate-profile')}
                            className="bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-sm"
                          >
                            View Profile
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
                    <div key={interview._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {interview.candidateName?.charAt(0).toUpperCase() || 'C'}
                            </span>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-xl font-semibold text-gray-900">
                                  {interview.candidateName || 'Candidate'}
                                </h3>
                                <p className="text-lg text-blue-600 font-medium">
                                  {interview.jobTitle || 'Interview'}
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                interview.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                interview.status === 'completed' ? 'bg-green-100 text-green-800' :
                                interview.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {interview.status?.charAt(0).toUpperCase() + interview.status?.slice(1) || 'Scheduled'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              <span>📅 {new Date(interview.date).toLocaleDateString()}</span>
                              <span>🕒 {interview.time}</span>
                              <span>📧 {interview.candidateEmail}</span>
                            </div>

                            {interview.meetingLink && (
                              <div className="mb-3">
                                <a
                                  href={interview.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center space-x-1 bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                  <span>🔗</span>
                                  <span>Join Meeting</span>
                                </a>
                              </div>
                            )}

                            {interview.notes && (
                              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                <strong>Notes:</strong> {interview.notes}
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
                                const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/interviews/${interview._id}/status`, {
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
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            title="Update interview status"
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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