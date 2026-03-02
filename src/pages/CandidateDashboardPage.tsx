import React, { useState, useEffect } from 'react';
import { Camera, ChevronDown, Info, TrendingUp, Star, Edit, FileText, Search, Bell, MessageSquare, Plus, X } from 'lucide-react';
import Notification from '../components/Notification';
import BackButton from '../components/BackButton';
import ProfilePhotoEditor from '../components/ProfilePhotoEditor';
import JobAlertsManager from '../components/JobAlertsManager';
import MistralJobRecommendations from '../components/MistralJobRecommendations';
import { API_ENDPOINTS } from '../config/env';

interface CandidateDashboardPageProps {
  onNavigate: (page: string) => void;
}

const CandidateDashboardPage: React.FC<CandidateDashboardPageProps> = ({ onNavigate }) => {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Profile');
  const [completionPercentage, setCompletionPercentage] = useState(40);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    isVisible: boolean;
  }>({ type: 'success', message: '', isVisible: false });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>({});

  const fetchActivityInsights = async (userId: string) => {
    setLoadingActivity(true);
    try {
      // Fetch real analytics data from backend
      const analyticsRes = await fetch(`${API_ENDPOINTS.BASE_URL}/api/analytics/profile/${encodeURIComponent(user?.email || userId)}`);
      const recentActivityRes = await fetch(`${API_ENDPOINTS.BASE_URL}/api/analytics/recent-activity/${encodeURIComponent(user?.email || userId)}`);
      
      let realData = {
        profileViews: 0,
        searchAppearances: 0,
        applicationsSent: 0,
        recruiterActions: 0,
        recentActivity: [] as Array<{
          type: string;
          company: string;
          message: string;
          time: string;
          icon: string;
        }>
      };

      // Get analytics data from database
      if (analyticsRes.ok) {
        const analytics = await analyticsRes.json();
        realData.profileViews = analytics.profileViews || 0;
        realData.searchAppearances = analytics.searchAppearances || 0;
        realData.applicationsSent = analytics.applicationsSent || 0;
        realData.recruiterActions = analytics.recruiterActions || 0;
      }

      // Get recent activity from database
      if (recentActivityRes.ok) {
        const activities = await recentActivityRes.json();
        if (Array.isArray(activities) && activities.length > 0) {
          realData.recentActivity = activities;
        }
      }

      // Add default activity if no activities found
      if (realData.recentActivity.length === 0) {
        realData.recentActivity = [
          {
            type: 'profile_setup',
            company: 'ZyncJobs',
            message: 'Profile created successfully',
            time: 'Recently',
            icon: '👤'
          }
        ];
      }

      setActivityData(realData);
      
    } catch (error) {
      console.error('Error fetching activity insights:', error);
      // Fallback data
      setActivityData({
        profileViews: 0,
        searchAppearances: 0,
        applicationsSent: 0,
        recruiterActions: 0,
        recentActivity: [
          {
            type: 'info',
            company: 'ZyncJobs',
            message: 'Complete your profile to start tracking activity',
            time: 'Now',
            icon: '📊'
          }
        ]
      });
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    const loadUserProfile = async () => {
      const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          
          // Fetch fresh data from database
          try {
            const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/${parsedUser.email}`);
            if (response.ok) {
              const profileData = await response.json();
              console.log('Dashboard - Fetched profile data:', {
                hasInternships: !!profileData.internships,
                hasLanguages: !!profileData.languages,
                hasEmployment: !!profileData.employment,
                internships: profileData.internships,
                languages: profileData.languages
              });
              // Merge database data with localStorage data, prioritizing database data
              const updatedUser = { 
                ...parsedUser, 
                ...profileData,
                // Ensure all comprehensive fields are included
                profilePhoto: profileData.profilePhoto || parsedUser.profilePhoto || '',
                profileFrame: profileData.profileFrame || parsedUser.profileFrame || 'none',
                profileSummary: profileData.profileSummary || parsedUser.profileSummary || '',
                employment: profileData.employment || parsedUser.employment || '',
                projects: profileData.projects || parsedUser.projects || '',
                internships: profileData.internships || parsedUser.internships || '',
                languages: profileData.languages || parsedUser.languages || '',
                awards: profileData.awards || parsedUser.awards || '',
                clubsCommittees: profileData.clubsCommittees || parsedUser.clubsCommittees || '',
                competitiveExams: profileData.competitiveExams || parsedUser.competitiveExams || '',
                academicAchievements: profileData.academicAchievements || parsedUser.academicAchievements || '',
                companyName: profileData.companyName || parsedUser.companyName || '',
                roleTitle: profileData.roleTitle || parsedUser.roleTitle || '',
                gender: profileData.gender || parsedUser.gender || '',
                birthday: profileData.birthday || parsedUser.birthday || '',
                resume: profileData.resume || parsedUser.resume || null
              };
              setUser(updatedUser);
              // Update localStorage with fresh data
              localStorage.setItem('user', JSON.stringify(updatedUser));
              calculateProfileCompletion(updatedUser);
            } else {
              setUser(parsedUser);
              calculateProfileCompletion(parsedUser);
            }
          } catch (error) {
            console.error('Error fetching profile from database:', error);
            setUser(parsedUser);
            calculateProfileCompletion(parsedUser);
          }
          
          fetchNotifications(parsedUser.email);
          // Fetch activity insights when Activity tab is active
          if (activeTab === 'Activity') {
            fetchActivityInsights(parsedUser.email);
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          setUser(null);
        }
      }
      setLoading(false);
    };
    
    loadUserProfile();
  }, [activeTab]);

  const fetchNotifications = async (userId: string) => {
    try {
      // Fallback to job notifications directly
      const jobsResponse = await fetch(`${API_ENDPOINTS.JOBS}?limit=5`);
      if (jobsResponse.ok) {
        const jobs = await jobsResponse.json();
        const jobNotifications = jobs.map((job: any, index: number) => ({
          id: job._id || index,
          type: 'job',
          company: job.company || 'Company',
          title: `New job: ${job.jobTitle || job.title}`,
          message: `${job.company} is hiring for ${job.jobTitle || job.title} in ${job.location}`,
          actionText: 'View Job',
          time: new Date(job.createdAt).toLocaleDateString() === new Date().toLocaleDateString() ? 
                `${Math.floor(Math.random() * 12) + 1}h ago` : 
                `${Math.floor(Math.random() * 7) + 1}d ago`,
          jobId: job._id
        }));
        setNotifications(jobNotifications);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };

  const calculateProfileCompletion = (userData: any) => {
    let completed = 0;
    const fields = [
      'name', 'email', 'phone', 'location', 'gender', 'birthday',
      'profilePhoto', 'profileSummary', 'skills', 'languages',
      'education', 'employment', 'projects', 'resume'
    ];
    
    fields.forEach(field => {
      if (userData[field]) {
        if (Array.isArray(userData[field]) && userData[field].length > 0) {
          completed += 1;
        } else if (typeof userData[field] === 'string' && userData[field].trim()) {
          completed += 1;
        } else if (typeof userData[field] === 'object' && userData[field] !== null) {
          completed += 1;
        }
      }
    });
    
    const percentage = Math.round((completed / fields.length) * 100);
    setCompletionPercentage(percentage);
  };

  return (
    <>
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification({ ...notification, isVisible: false })}
      />
      <div className="min-h-screen bg-gray-50 font-['IBM_Plex_Sans']">
        {/* Tab Navigation */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-8">
              <BackButton 
                onClick={() => onNavigate && onNavigate('home')}
                text="Back to Home"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors py-4 font-['IBM_Plex_Sans']"
              />
              <button 
                onClick={() => setActiveTab('Profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm font-['IBM_Plex_Sans'] ${
                  activeTab === 'Profile' 
                    ? 'border-black text-gray-900' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                View & Edit
              </button>
              <button 
                onClick={() => {
                  setActiveTab('Activity');
                  if (user && !activityData) {
                    fetchActivityInsights(user.email);
                  }
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm font-['IBM_Plex_Sans'] ${
                  activeTab === 'Activity' 
                    ? 'border-black text-gray-900' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Activity insights
              </button>
            </div>
          </div>
        </div>

        {/* Notification Bell - Fixed Position */}
        <div className="fixed top-20 right-4 z-50">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 bg-white rounded-full shadow-lg border text-gray-600 hover:text-gray-800 transition-colors"
            aria-label="View notifications"
            title="View notifications"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-xs">
                {notifications.length}
              </span>
            )}
          </button>
          
          {/* Simple Alert Popup */}
          {notifications.length > 0 && !showNotifications && (
            <div className="absolute top-12 right-0 w-64 bg-white rounded-lg shadow-lg border p-3 animate-pulse">
              <p className="text-sm text-gray-700">
                You have {notifications.length} new job notifications
              </p>
              <p className="text-xs text-gray-500 mt-1">Click bell to view details</p>
            </div>
          )}
        </div>

        {/* Notifications Sidebar */}
        {showNotifications && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowNotifications(false)}
            />
            
            {/* Sidebar */}
            <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close notifications"
                  title="Close notifications"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="h-full overflow-y-auto pb-20">
                {notifications.length > 0 ? (
                  <>
                    <div className="p-3 text-sm text-gray-500 border-b bg-gray-50">Today</div>
                    {notifications.map((notification, index) => (
                      <div key={index} className="p-4 border-b hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                            notification.company === 'Wipro' ? 'bg-orange-500' : 
                            notification.company === 'Swiggy' ? 'bg-red-500' : 
                            notification.company === 'Zoho' ? 'bg-blue-500' : 'bg-gray-500'
                          }`}>
                            {notification.company?.charAt(0) || 'N'}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{notification.title}</h4>
                            <p className="text-sm text-gray-600 mb-3">{notification.message}</p>
                            {notification.actionText && (
                              <button 
                                onClick={() => {
                                  if (notification.actionText === 'View Jobs' || notification.actionText === 'View Job') {
                                    setShowNotifications(false);
                                    onNavigate('job-listings');
                                  } else if (notification.jobId) {
                                    setShowNotifications(false);
                                    onNavigate('job-listings');
                                  }
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 border border-blue-600 rounded-lg"
                              >
                                {notification.actionText}
                              </button>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">{notification.time}</span>
                        </div>
                      </div>
                    ))}
                    
                    {notifications.length > 3 && (
                      <>
                        <div className="p-3 text-sm text-gray-500 border-b bg-gray-50">Earlier</div>
                        <div className="p-4 border-b hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold bg-green-500">
                              T
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-1">Profile viewed by Trinity Tech</h4>
                              <p className="text-sm text-gray-600 mb-3">Your profile was viewed by a recruiter</p>
                            </div>
                            <span className="text-xs text-gray-400">2d ago</span>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No notifications yet</p>
                    <p className="text-sm">We'll notify you when there's something new</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'Profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Sidebar - Quick Actions */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button 
                      onClick={() => onNavigate('job-listings')}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Search className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-700">Browse All Jobs</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                      <Star className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-700">Company Reviews</span>
                    </button>
                    <button 
                      onClick={() => onNavigate('skill-assessment')}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-700">Take Skill Assessment</span>
                    </button>
                    <button 
                      onClick={() => onNavigate('my-applications')}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-700">My Applications</span>
                    </button>
                    <button 
                      onClick={() => onNavigate('candidate-profile')}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-700">Update Profile</span>
                    </button>
                    <button 
                      onClick={() => onNavigate('settings')}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-700">Settings</span>
                    </button>
                  </div>
                </div>

                {/* Skill Assessments Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4">Skill Assessments</h3>
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="w-8 h-8 text-blue-600" />
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2">Take New Assessment</h4>
                      <p className="text-sm text-gray-600 mb-4">Test your skills and showcase your expertise</p>
                      <button 
                        onClick={() => onNavigate('skill-assessment')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Start Assessment
                      </button>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">My Assessments</h4>
                      <p className="text-sm text-gray-500">No assessments completed yet</p>
                    </div>
                  </div>
                </div>

                {/* AI Job Recommendations */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🤖</span>
                    <h3 className="text-lg font-semibold text-gray-900">AI Job Suggestions</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">Senior React Developer</h4>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">95% Match</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">Perfect match for your React and JavaScript skills</p>
                      <div className="flex flex-wrap gap-1">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">React</span>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">JavaScript</span>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Node.js</span>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">Full Stack Developer</h4>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">88% Match</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">Your frontend and backend skills make you ideal</p>
                      <div className="flex flex-wrap gap-1">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">React</span>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Node.js</span>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">Frontend Engineer</h4>
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">85% Match</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">Strong foundation in modern frontend technologies</p>
                      <div className="flex flex-wrap gap-1">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">React</span>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">JavaScript</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-lg">💼</span>
                      <span className="text-sm">Live Job Postings</span>
                    </h4>
                    <div className="space-y-3">
                      <div className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <h5 className="font-medium text-gray-900 text-sm">Software Engineer</h5>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">60% Match</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">Zoho • Remote - India</p>
                        <p className="text-xs text-green-600 font-medium mb-2">₹50,000 - ₹80,000</p>
                        <div className="flex gap-1 mb-2">
                          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">JavaScript</span>
                          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">Python</span>
                        </div>
                        <div className="flex gap-2">
                          <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Apply</button>
                          <button className="text-xs text-blue-600 hover:text-blue-800">View Details</button>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <h5 className="font-medium text-gray-900 text-sm">Full Stack Developer</h5>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">60% Match</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">Trinity Technology • Chennai</p>
                        <p className="text-xs text-green-600 font-medium mb-2">₹50,000 - ₹80,000</p>
                        <div className="flex gap-1 mb-2">
                          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">Communication</span>
                          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">Problem Solving</span>
                        </div>
                        <div className="flex gap-2">
                          <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Apply</button>
                          <button className="text-xs text-blue-600 hover:text-blue-800">View Details</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-3">
                {/* Profile Header Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-start space-x-6">
                    {/* Profile Picture with Progress Ring */}
                    <div className="relative">
                      <div className="relative w-24 h-24">
                        {/* Progress Ring */}
                        <svg className="w-24 h-24 transform -rotate-90 absolute" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="2"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="2"
                            strokeDasharray={`${completionPercentage}, 100`}
                          />
                        </svg>
                        {/* Profile Photo */}
                        <div className="absolute inset-2">
                          {user?.profilePhoto ? (
                            <img 
                              src={user.profilePhoto} 
                              alt="Profile" 
                              className="w-full h-full rounded-full object-cover cursor-pointer"
                              onClick={() => setShowPhotoEditor(true)}
                            />
                          ) : (
                            <div 
                              className="w-full h-full bg-gray-400 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer hover:bg-gray-500 transition-colors text-xs"
                              onClick={() => setShowPhotoEditor(true)}
                            >
                              Add photo
                            </div>
                          )}
                        </div>
                        {/* Percentage */}
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                          <span className="text-xs font-semibold text-red-600 bg-white px-1 rounded">{completionPercentage}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h1 className="text-2xl font-semibold text-gray-900">
                              {user?.name || user?.fullName || 'Add your name'}
                            </h1>
                            <Edit 
                              onClick={() => {
                                setActiveModal('personalDetails');
                                setModalData({
                                  name: user?.name || '',
                                  gender: user?.gender || '',
                                  birthday: user?.birthday || '',
                                  location: user?.location || '',
                                  phone: user?.phone || ''
                                });
                              }}
                              className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-600" 
                            />
                          </div>
                          <p className="text-gray-600 mb-2">
                            {user?.title || user?.jobTitle || 'Add your job title'}
                          </p>
                          <p className="text-gray-500 text-sm mb-3">
                            {user?.education || user?.degree || 'Add your education'}
                          </p>
                          
                          {/* Contact Info */}
                          <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{user?.location || 'Add location'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span>{user?.phone || 'Add phone'}</span>
                              {user?.phone && <span className="text-green-500">✓</span>}
                            </div>
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span>{user?.email ? `${user.email.substring(0, 15)}...` : 'Add email'}</span>
                              {user?.email && <span className="text-green-500">✓</span>}
                            </div>
                          </div>
                          
                          {/* Action Links */}
                          <div className="flex items-center space-x-4 text-sm">
                            <button 
                              onClick={() => {
                                setActiveModal('personalDetails');
                                setModalData({
                                  name: user?.name || '',
                                  gender: user?.gender || '',
                                  birthday: user?.birthday || '',
                                  location: user?.location || '',
                                  phone: user?.phone || ''
                                });
                              }}
                              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span>{user?.gender || 'Add Gender'}</span>
                            </button>
                            <button 
                              onClick={() => {
                                setActiveModal('personalDetails');
                                setModalData({
                                  name: user?.name || '',
                                  gender: user?.gender || '',
                                  birthday: user?.birthday || '',
                                  location: user?.location || '',
                                  phone: user?.phone || ''
                                });
                              }}
                              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-6h8" />
                              </svg>
                              <span>{user?.birthday || 'Add birthday'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Your career preferences */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Your career preferences</h2>
                    <button 
                      onClick={() => {
                        setActiveModal('careerPreferences');
                        setModalData(user?.careerPreferences || {});
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Add
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Preferred job type</p>
                      {user?.careerPreferences?.lookingFor && user.careerPreferences.lookingFor.length > 0 ? (
                        <p className="text-gray-900">{user.careerPreferences.lookingFor.join(', ')}</p>
                      ) : (
                        <button 
                          onClick={() => {
                            setActiveModal('careerPreferences');
                            setModalData(user?.careerPreferences || {});
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Add desired job type
                        </button>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Availability to work</p>
                      {user?.careerPreferences?.availability ? (
                        <p className="text-gray-900">{user.careerPreferences.availability}</p>
                      ) : (
                        <button 
                          onClick={() => {
                            setActiveModal('careerPreferences');
                            setModalData(user?.careerPreferences || {});
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Add work availability
                        </button>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Preferred location</p>
                      {user?.careerPreferences?.locations && user.careerPreferences.locations.length > 0 ? (
                        <p className="text-gray-900">{user.careerPreferences.locations.join(', ')}</p>
                      ) : (
                        <button 
                          onClick={() => {
                            setActiveModal('careerPreferences');
                            setModalData(user?.careerPreferences || {});
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Add preferred work location
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Education Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Education</h2>
                    <button 
                      onClick={() => {
                        setActiveModal('educationCollege');
                        setModalData(user?.educationCollege || {});
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="border-b border-gray-100 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {user?.educationCollege && typeof user.educationCollege === 'object' ? (
                            <>
                              <h3 className="font-semibold text-gray-900">{user.educationCollege.degree || 'Degree'} from {user.educationCollege.college || 'College'}</h3>
                              <p className="text-gray-500 text-sm">{user.educationCollege.courseType || 'Full Time'} • {user.educationCollege.percentage || 'N/A'} • Graduated in {user.educationCollege.passingYear || 'Year'}</p>
                            </>
                          ) : (
                            <>
                              <h3 className="font-semibold text-gray-900">{user?.degree || 'Bachelor of Technology / Bachelor of Engineering (B.Tech/B.E.)'} from {user?.college || 'Your College'}</h3>
                              <p className="text-gray-500 text-sm">Graduated in {user?.graduationYear || '2025'}, {user?.courseType || 'Full Time'}</p>
                            </>
                          )}
                        </div>
                        <Edit 
                          onClick={() => {
                            setActiveModal('educationCollege');
                            setModalData(user?.educationCollege || {});
                          }}
                          className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-600" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {user?.educationClass12 && typeof user.educationClass12 === 'object' ? (
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-gray-700 font-medium">Class XII - {user.educationClass12.board}</p>
                            <p className="text-gray-500 text-sm">{user.educationClass12.percentage}% • {user.educationClass12.medium} Medium • Passed in {user.educationClass12.passingYear}</p>
                          </div>
                          <Edit 
                            onClick={() => {
                              setActiveModal('educationClass12');
                              setModalData(user?.educationClass12 || {});
                            }}
                            className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-600" 
                          />
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={() => {
                              setActiveModal('educationClass12');
                              setModalData({});
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium block"
                          >
                            Add Class XII Details
                          </button>
                          <p className="text-gray-500 text-xs">Scored Percentage, Passed out in Passing Year</p>
                        </>
                      )}
                    </div>
                    <div className="space-y-2">
                      {user?.educationClass10 && typeof user.educationClass10 === 'object' ? (
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-gray-700 font-medium">Class X - {user.educationClass10.board}</p>
                            <p className="text-gray-500 text-sm">{user.educationClass10.percentage}% • {user.educationClass10.medium} Medium • Passed in {user.educationClass10.passingYear}</p>
                          </div>
                          <Edit 
                            onClick={() => {
                              setActiveModal('educationClass10');
                              setModalData(user?.educationClass10 || {});
                            }}
                            className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-600" 
                          />
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={() => {
                              setActiveModal('educationClass10');
                              setModalData({});
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium block"
                          >
                            Add Class X Details
                          </button>
                          <p className="text-gray-500 text-xs">Scored Percentage, Passed out in Passing Year</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Key Skills Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                      <span>Key skills</span>
                      <Edit 
                        onClick={() => {
                          setActiveModal('skills');
                          setModalData(user?.skills || []);
                        }}
                        className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-600" 
                      />
                    </h2>
                  </div>
                  {user?.skills && user.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">Python</span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">Python Software Developer</span>
                    </div>
                  )}
                </div>

                {/* Languages Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Languages</h2>
                    <button 
                      onClick={() => {
                        setActiveModal('languages');
                        setModalData(user?.languages || '');
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {user?.languages && user.languages.length > 0 ? 'Edit' : 'Add'}
                    </button>
                  </div>
                  {user?.languages && user.languages.length > 0 ? (
                    <p className="text-gray-700">{Array.isArray(user.languages) ? user.languages.join(', ') : user.languages}</p>
                  ) : (
                    <p className="text-gray-500">Talk about the languages that you can speak, read or write</p>
                  )}
                </div>

                {/* Profile Summary Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Profile Summary</h2>
                    <button 
                      onClick={() => {
                        setActiveModal('profileSummary');
                        setModalData(user?.profileSummary || '');
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {user?.profileSummary && user.profileSummary.trim() ? 'Edit' : 'Add'}
                    </button>
                  </div>
                  {user?.profileSummary && user.profileSummary.trim() ? (
                    <p className="text-gray-700">{user.profileSummary}</p>
                  ) : (
                    <p className="text-gray-500">Your Profile Summary should mention the highlights of your career and education, what your professional interests are, and what kind of a career you are looking for. Write a meaningful summary of more than 50 characters.</p>
                  )}
                </div>

                {/* Employment Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Employment</h2>
                    <button 
                      onClick={() => {
                        setActiveModal('employment');
                        setModalData(user?.employment || {});
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {user?.employment && typeof user.employment === 'object' && user.employment.companyName ? 'Edit' : 'Add'}
                    </button>
                  </div>
                  {user?.employment && typeof user.employment === 'object' && user.employment.companyName ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{user.employment.designation} at {user.employment.companyName}</h3>
                          <p className="text-gray-500 text-sm">
                            {user.employment.startMonth} {user.employment.startYear} - {user.employment.currentlyWorking ? 'Present' : `${user.employment.endMonth} ${user.employment.endYear}`}
                            {user.employment.experienceYears || user.employment.experienceMonths ? ` • ${user.employment.experienceYears || 0} years ${user.employment.experienceMonths || 0} months` : ''}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700">{user.employment.description}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Talk about the company you worked at, your designation and describe what all you did there</p>
                  )}
                </div>

                {/* Projects Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
                    <button 
                      onClick={() => {
                        setActiveModal('projects');
                        setModalData(user?.projects || {});
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {user?.projects && typeof user.projects === 'object' && user.projects.projectName ? 'Edit' : 'Add'}
                    </button>
                  </div>
                  {user?.projects && typeof user.projects === 'object' && user.projects.projectName ? (
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.projects.projectName}</h3>
                      <p className="text-gray-700 mb-2">{user.projects.description}</p>
                      {user.projects.skills && <p className="text-gray-600 text-sm mb-1"><span className="font-medium">Skills:</span> {user.projects.skills}</p>}
                      {user.projects.projectUrl && <a href={user.projects.projectUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">{user.projects.projectUrl}</a>}
                    </div>
                  ) : (
                    <p className="text-gray-500">Talk about your projects that made you proud and contributed to your learnings</p>
                  )}
                </div>

                {/* Internships Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Internships</h2>
                    <button 
                      onClick={() => {
                        setActiveModal('internships');
                        setModalData(user?.internships || {});
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {user?.internships && typeof user.internships === 'object' && user.internships.companyName ? 'Edit' : 'Add'}
                    </button>
                  </div>
                  {user?.internships && typeof user.internships === 'object' && user.internships.companyName ? (
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.internships.companyName}</h3>
                      <p className="text-gray-500 text-sm mb-2">{user.internships.startMonth} {user.internships.startYear} - {user.internships.endMonth} {user.internships.endYear}</p>
                      <p className="text-gray-700 mb-2">{user.internships.description}</p>
                      {user.internships.skills && <p className="text-gray-600 text-sm"><span className="font-medium">Skills:</span> {user.internships.skills}</p>}
                    </div>
                  ) : (
                    <p className="text-gray-500">Talk about the company you interned at, what projects you undertook and what special skills you learned</p>
                  )}
                </div>

                {/* Accomplishments Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Accomplishments</h2>
                  </div>
                  <div className="space-y-4">
                        {/* Certifications */}
                    <div className="border-b border-gray-100 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">Certifications</h3>
                        <button 
                          onClick={() => {
                            setActiveModal('certifications');
                            setModalData(user?.certifications || {});
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          {user?.certifications && typeof user.certifications === 'object' && user.certifications.certificationName ? 'Edit' : 'Add'}
                        </button>
                      </div>
                      {user?.certifications && typeof user.certifications === 'object' && user.certifications.certificationName ? (
                        <div>
                          <p className="text-gray-900 font-medium">{user.certifications.certificationName}</p>
                          {user.certifications.completionId && <p className="text-gray-600 text-sm">ID: {user.certifications.completionId}</p>}
                          <p className="text-gray-500 text-sm">
                            {user.certifications.startMonth} {user.certifications.startYear} - {user.certifications.noExpiry ? 'No Expiry' : `${user.certifications.endMonth} ${user.certifications.endYear}`}
                          </p>
                          {user.certifications.certificationUrl && <a href={user.certifications.certificationUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">{user.certifications.certificationUrl}</a>}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Talk about any certified courses that you completed</p>
                      )}
                    </div>

                    {/* Awards */}
                    <div className="border-b border-gray-100 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">Awards</h3>
                        <button 
                          onClick={() => {
                            setActiveModal('awards');
                            setModalData(user?.awards || '');
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          {user?.awards && user.awards.trim() ? 'Edit' : 'Add'}
                        </button>
                      </div>
                      {user?.awards && user.awards.trim() ? (
                        <p className="text-gray-700 whitespace-pre-line">{user.awards}</p>
                      ) : (
                        <p className="text-gray-500 text-sm">Talk about any special recognitions that you received that makes you proud</p>
                      )}
                    </div>

                    {/* Club & committees */}
                    <div className="border-b border-gray-100 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">Club & committees</h3>
                        <button 
                          onClick={() => {
                            setActiveModal('clubsCommittees');
                            setModalData(user?.clubsCommittees || {});
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          {user?.clubsCommittees && typeof user.clubsCommittees === 'object' && user.clubsCommittees.clubName ? 'Edit' : 'Add'}
                        </button>
                      </div>
                      {user?.clubsCommittees && typeof user.clubsCommittees === 'object' && user.clubsCommittees.clubName ? (
                        <div>
                          <p className="text-gray-900 font-medium">{user.clubsCommittees.designation} at {user.clubsCommittees.clubName}</p>
                          <p className="text-gray-500 text-sm">
                            {user.clubsCommittees.startMonth} {user.clubsCommittees.startYear} - {user.clubsCommittees.currentlyWorking ? 'Present' : `${user.clubsCommittees.endMonth} ${user.clubsCommittees.endYear}`}
                            {user.clubsCommittees.associatedEducation && ` • ${user.clubsCommittees.associatedEducation}`}
                          </p>
                          <p className="text-gray-700 text-sm mt-1">{user.clubsCommittees.description}</p>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Add details of position of responsibilities that you have held</p>
                      )}
                    </div>

                    {/* Competitive exams */}
                    <div className="border-b border-gray-100 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">Competitive exams</h3>
                        <button 
                          onClick={() => {
                            setActiveModal('competitiveExams');
                            setModalData(user?.competitiveExams || {});
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          {user?.competitiveExams && typeof user.competitiveExams === 'object' && user.competitiveExams.examName ? 'Edit' : 'Add'}
                        </button>
                      </div>
                      {user?.competitiveExams && typeof user.competitiveExams === 'object' && user.competitiveExams.examName ? (
                        <p className="text-gray-700">{user.competitiveExams.examName}</p>
                      ) : (
                        <p className="text-gray-500 text-sm">Talk about any competitive exam that you appeared for and the rank received</p>
                      )}
                    </div>

                    {/* Academic achievements */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">Academic achievements</h3>
                        <button 
                          onClick={() => {
                            setActiveModal('academicAchievements');
                            setModalData(user?.academicAchievements || '');
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          {user?.academicAchievements && user.academicAchievements.trim() ? 'Edit' : 'Add'}
                        </button>
                      </div>
                      {user?.academicAchievements && user.academicAchievements.trim() ? (
                        <p className="text-gray-700 whitespace-pre-line">{user.academicAchievements}</p>
                      ) : (
                        <p className="text-gray-500 text-sm">Talk about any academic achievement whether in college or school that deserves a mention</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resume Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Resume</h2>
                  </div>
                  <p className="text-gray-500 mb-4">Your resume is the first impression you make on potential employers. Craft it carefully to secure your desired job or internship.</p>
                  {user?.resume ? (
                    <div className="border border-gray-300 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{user.resume.name || 'Resume.pdf'}</p>
                          <p className="text-sm text-gray-500">Uploaded on {user.resume.uploadDate || 'Recently'}</p>
                        </div>
                        <input
                          type="file"
                          id="resume-update"
                          accept=".doc,.docx,.rtf,.pdf"
                          className="hidden"
                          onChange={async (e) => {
                            console.log('Resume update triggered');
                            const file = e.target.files?.[0];
                            console.log('Selected file:', file);
                            if (file && file.size <= 2 * 1024 * 1024) {
                              console.log('File valid, saving...');
                              const resumeData = {
                                name: file.name,
                                size: file.size,
                                uploadDate: new Date().toLocaleDateString()
                              };
                              const updatedUser = { ...user, resume: resumeData };
                              setUser(updatedUser);
                              localStorage.setItem('user', JSON.stringify(updatedUser));
                              calculateProfileCompletion(updatedUser);
                              try {
                                await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/save`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ email: user?.email, resume: resumeData })
                                });
                                setNotification({
                                  type: 'success',
                                  message: 'Resume updated successfully!',
                                  isVisible: true
                                });
                              } catch (error) {
                                console.error('Error saving resume:', error);
                                setNotification({
                                  type: 'error',
                                  message: 'Failed to save resume',
                                  isVisible: true
                                });
                              }
                            } else if (file && file.size > 2 * 1024 * 1024) {
                              setNotification({
                                type: 'error',
                                message: 'File size must be less than 2MB',
                                isVisible: true
                              });
                            }
                          }}
                        />
                        <button 
                          onClick={() => document.getElementById('resume-update')?.click()}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <input
                        type="file"
                        id="resume-upload"
                        accept=".doc,.docx,.rtf,.pdf"
                        className="hidden"
                        onChange={async (e) => {
                          console.log('Resume upload triggered');
                          const file = e.target.files?.[0];
                          console.log('Selected file:', file);
                          if (file && file.size <= 2 * 1024 * 1024) {
                            console.log('File valid, saving...');
                            const resumeData = {
                              name: file.name,
                              size: file.size,
                              uploadDate: new Date().toLocaleDateString()
                            };
                            const updatedUser = { ...user, resume: resumeData };
                            setUser(updatedUser);
                            localStorage.setItem('user', JSON.stringify(updatedUser));
                            calculateProfileCompletion(updatedUser);
                            try {
                              await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/save`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: user?.email, resume: resumeData })
                              });
                              setNotification({
                                type: 'success',
                                message: 'Resume uploaded successfully!',
                                isVisible: true
                              });
                            } catch (error) {
                              console.error('Error saving resume:', error);
                              setNotification({
                                type: 'error',
                                message: 'Failed to save resume',
                                isVisible: true
                              });
                            }
                          } else if (file && file.size > 2 * 1024 * 1024) {
                            setNotification({
                              type: 'error',
                              message: 'File size must be less than 2MB',
                              isVisible: true
                            });
                          }
                        }}
                      />
                      <button 
                        onClick={() => document.getElementById('resume-upload')?.click()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Upload resume
                      </button>
                      <p className="text-gray-500 text-sm mt-2">Supported formats: doc, docx, rtf, pdf, up to 2MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Activity' && (
            <div className="space-y-6">
              {loadingActivity ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading activity insights...</span>
                  </div>
                </div>
              ) : activityData ? (
                <>
                  {/* Activity Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-lg">👁️</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Profile Views</p>
                          <p className="text-2xl font-bold text-gray-900">{activityData.profileViews}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <span className="text-lg">🔍</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Search Appearances</p>
                          <p className="text-2xl font-bold text-gray-900">{activityData.searchAppearances}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <span className="text-lg">📝</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Applications Sent</p>
                          <p className="text-2xl font-bold text-gray-900">{activityData.applicationsSent}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <span className="text-lg">💼</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Recruiter Actions</p>
                          <p className="text-2xl font-bold text-gray-900">{activityData.recruiterActions}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                      {activityData.recentActivity.map((activity: any, index: number) => (
                        <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            <span className="text-2xl">{activity.icon}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{activity.company} • {activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Activity Chart Placeholder */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity Trends</h2>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-4xl mb-4 block">📈</span>
                        <p className="text-gray-600">Activity chart will be implemented here</p>
                        <p className="text-sm text-gray-500 mt-2">Track your profile performance over time</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="text-center py-8">
                    <span className="text-4xl mb-4 block">📈</span>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">No Activity Data</h2>
                    <p className="text-gray-500">Start applying to jobs to see your activity insights</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <ProfilePhotoEditor
        isOpen={showPhotoEditor}
        onClose={() => setShowPhotoEditor(false)}
        onSave={async (photo, frame) => {
          const updatedUser = { ...user, profilePhoto: photo, profileFrame: frame || 'none' };
          setUser(updatedUser);
          
          // Save to localStorage
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Save to database
          try {
            const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/save`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user?.id || user?._id || user?.email,
                email: user?.email,
                profilePhoto: photo,
                profileFrame: frame || 'none'
              })
            });
            
            if (response.ok) {
              console.log('Profile photo saved to database successfully');
            } else {
              console.warn('Failed to save profile photo to database');
            }
          } catch (error) {
            console.error('Error saving profile photo to database:', error);
          }
          
          setNotification({
            type: 'success',
            message: 'Profile photo updated successfully!',
            isVisible: true
          });
        }}
        currentPhoto={user?.profilePhoto}
        currentFrame={user?.profileFrame || 'none'}
      />

      {/* Personal Details Modal */}
      {activeModal === 'personalDetails' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">All about you</h2>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block font-medium mb-2">Full name</label>
                  <input
                    type="text"
                    value={modalData.name || ''}
                    onChange={(e) => setModalData({...modalData, name: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Gender</label>
                  <div className="flex gap-3">
                    {['Male', 'Female', 'Transgender'].map(g => (
                      <button
                        key={g}
                        onClick={() => setModalData({...modalData, gender: g})}
                        className={`px-6 py-2 border rounded-full ${modalData.gender === g ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-2">Date of birth (DD/MM/YYYY)</label>
                  <input
                    type="date"
                    value={modalData.birthday || ''}
                    onChange={(e) => setModalData({...modalData, birthday: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Current location</label>
                  <input
                    type="text"
                    value={modalData.location || ''}
                    onChange={(e) => setModalData({...modalData, location: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter your location"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Phone number</label>
                  <input
                    type="tel"
                    value={modalData.phone || ''}
                    onChange={(e) => setModalData({...modalData, phone: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setActiveModal(null)} className="text-blue-600 px-6 py-2">Cancel</button>
                <button
                  onClick={async () => {
                    const updatedUser = { ...user, ...modalData };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    calculateProfileCompletion(updatedUser);
                    try {
                      await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user?.email, ...modalData })
                      });
                    } catch (error) {
                      console.error('Error saving:', error);
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Career Preferences Modal */}
      {activeModal === 'careerPreferences' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Career preferences</h2>
                  <p className="text-gray-600">Tell us your preferences for your next job & we will send you most relevant recommendations</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block font-medium mb-3">Looking for</label>
                  <div className="flex gap-3">
                    {['Internships', 'Jobs'].map(type => (
                      <button 
                        key={type} 
                        onClick={() => {
                          const current = modalData.lookingFor || [];
                          setModalData({...modalData, lookingFor: current.includes(type) ? current.filter((t: string) => t !== type) : [...current, type]});
                        }}
                        className={`px-4 py-2 border rounded-full ${(modalData.lookingFor || []).includes(type) ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-3">Availability to work</label>
                  <div className="flex flex-wrap gap-3">
                    {['15 Days or less', '1 Month', '2 Months', '3 Months', 'More than 3 Months'].map(time => (
                      <button 
                        key={time} 
                        onClick={() => setModalData({...modalData, availability: time})}
                        className={`px-4 py-2 border rounded-full ${modalData.availability === time ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-3">Preferred work location(s)</label>
                  <select 
                    className="w-full p-3 border rounded-lg mb-3"
                    onChange={(e) => {
                      if (e.target.value && !(modalData.locations || []).includes(e.target.value)) {
                        setModalData({...modalData, locations: [...(modalData.locations || []), e.target.value]});
                      }
                    }}
                  >
                    <option>Select from the list</option>
                    <option>Bengaluru</option>
                    <option>Delhi / NCR</option>
                    <option>Mumbai</option>
                    <option>Hyderabad</option>
                    <option>Pune</option>
                  </select>
                  <div className="flex gap-2 flex-wrap">
                    {(modalData.locations || []).map((loc: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-2">
                        {loc}
                        <button onClick={() => setModalData({...modalData, locations: modalData.locations.filter((_: string, i: number) => i !== idx)})}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setActiveModal(null)} className="text-blue-600 px-6 py-2">I'll add this later</button>
                <button
                  onClick={async () => {
                    const updatedUser = { ...user, careerPreferences: modalData };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    calculateProfileCompletion(updatedUser);
                    try {
                      await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user?.email, careerPreferences: modalData })
                      });
                    } catch (error) {
                      console.error('Error saving:', error);
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Skills Modal */}
      {activeModal === 'skills' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Key skills</h2>
                  <p className="text-gray-600">Recruiters look for candidates with specific keyskills. Add them here to appear in searches.</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="border rounded-lg p-4 mb-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  {(Array.isArray(modalData) ? modalData : []).map((skill: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-2">
                      {skill}
                      <button onClick={() => setModalData(modalData.filter((_: any, i: number) => i !== idx))}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Enter your key skills"
                  className="w-full p-2 border-0 focus:outline-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      setModalData([...(Array.isArray(modalData) ? modalData : []), e.currentTarget.value]);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setActiveModal(null)} className="text-blue-600 px-6 py-2">Cancel</button>
                <button
                  onClick={async () => {
                    const updatedUser = { ...user, skills: modalData };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    calculateProfileCompletion(updatedUser);
                    try {
                      await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user?.email, skills: modalData })
                      });
                    } catch (error) {
                      console.error('Error saving:', error);
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Languages Modal */}
      {activeModal === 'languages' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Languages known</h2>
                  <p className="text-gray-600">Strengthen your resume by letting recruiters know you can communicate in multiple languages</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="mb-6">
                <label className="block font-medium mb-3">Language</label>
                <select 
                  className="w-full p-3 border rounded-lg mb-4"
                  onChange={(e) => {
                    if (e.target.value) {
                      const current = typeof modalData === 'string' ? modalData.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
                      if (!current.includes(e.target.value)) {
                        setModalData([...current, e.target.value].join(', '));
                      }
                    }
                  }}
                >
                  <option>Select Language</option>
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Tamil</option>
                  <option>Telugu</option>
                  <option>Kannada</option>
                  <option>Malayalam</option>
                </select>
                <div className="flex gap-2 flex-wrap">
                  {(typeof modalData === 'string' ? modalData.split(',').map((s: string) => s.trim()).filter(Boolean) : []).map((lang: string, idx: number) => (
                    <span key={idx} className="px-4 py-2 bg-gray-100 rounded-full text-sm flex items-center gap-2">
                      {lang}
                      <button onClick={() => {
                        const langs = modalData.split(',').map((s: string) => s.trim()).filter(Boolean);
                        setModalData(langs.filter((_: string, i: number) => i !== idx).join(', '));
                      }}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setActiveModal(null)} className="text-blue-600 px-6 py-2">Cancel</button>
                <button
                  onClick={async () => {
                    const updatedUser = { ...user, languages: modalData };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    try {
                      await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user?.email, languages: modalData })
                      });
                    } catch (error) {
                      console.error('Error saving:', error);
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Education Modal */}
      {activeModal === 'education' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Education</h2>
                  <p className="text-gray-600">Add your educational qualifications</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <textarea
                  value={modalData}
                  onChange={(e) => setModalData(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  rows={6}
                  placeholder="Enter your education details"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setActiveModal(null)} className="text-blue-600 px-6 py-2">Cancel</button>
                <button
                  onClick={async () => {
                    const field = activeModal;
                    const updatedUser = { ...user, [field]: modalData };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    try {
                      await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user?.email, [field]: modalData })
                      });
                    } catch (error) {
                      console.error('Error saving:', error);
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Summary Modal */}
      {activeModal === 'profileSummary' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Profile Summary</h2>
                  <p className="text-gray-600">Write a meaningful summary of more than 50 characters</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <textarea
                  value={modalData}
                  onChange={(e) => setModalData(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  rows={6}
                  placeholder="Your Profile Summary should mention the highlights of your career and education..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setActiveModal(null)} className="text-blue-600 px-6 py-2">Cancel</button>
                <button
                  onClick={async () => {
                    const updatedUser = { ...user, profileSummary: modalData };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    try {
                      await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user?.email, profileSummary: modalData })
                      });
                    } catch (error) {
                      console.error('Error saving:', error);
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employment Modal */}
      {activeModal === 'employment' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Employment details</h2>
                  <p className="text-gray-600">Adding roles & companies you have worked with help employers understand your background</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">Total work experience</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={modalData.experienceYears || ''}
                      onChange={(e) => setModalData({...modalData, experienceYears: e.target.value})}
                      className="p-3 border rounded-lg"
                      placeholder="Years"
                    />
                    <input
                      type="text"
                      value={modalData.experienceMonths || ''}
                      onChange={(e) => setModalData({...modalData, experienceMonths: e.target.value})}
                      className="p-3 border rounded-lg"
                      placeholder="Months"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-2">Company name</label>
                  <input
                    type="text"
                    value={modalData.companyName || ''}
                    onChange={(e) => setModalData({...modalData, companyName: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter the name of the company you worked at"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Designation</label>
                  <input
                    type="text"
                    value={modalData.designation || ''}
                    onChange={(e) => setModalData({...modalData, designation: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter the designation you held"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Working since</label>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={modalData.startMonth || ''}
                      onChange={(e) => setModalData({...modalData, startMonth: e.target.value})}
                      className="p-3 border rounded-lg"
                    >
                      <option value="">Month</option>
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m}>{m}</option>)}
                    </select>
                    <input
                      type="text"
                      value={modalData.startYear || ''}
                      onChange={(e) => setModalData({...modalData, startYear: e.target.value})}
                      className="p-3 border rounded-lg"
                      placeholder="Year"
                    />
                  </div>
                  <p className="text-center text-gray-500 text-sm my-2">to</p>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={modalData.endMonth || ''}
                      onChange={(e) => setModalData({...modalData, endMonth: e.target.value})}
                      className="p-3 border rounded-lg"
                      disabled={modalData.currentlyWorking}
                    >
                      <option value="">Month</option>
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m}>{m}</option>)}
                    </select>
                    <input
                      type="text"
                      value={modalData.endYear || ''}
                      onChange={(e) => setModalData({...modalData, endYear: e.target.value})}
                      className="p-3 border rounded-lg"
                      placeholder="Year"
                      disabled={modalData.currentlyWorking}
                    />
                  </div>
                  <label className="flex items-center mt-3">
                    <input
                      type="checkbox"
                      checked={modalData.currentlyWorking || false}
                      onChange={(e) => setModalData({...modalData, currentlyWorking: e.target.checked, endMonth: '', endYear: ''})}
                      className="mr-2"
                    />
                    <span className="text-sm">I currently work here</span>
                  </label>
                </div>
                <div>
                  <label className="block font-medium mb-2">Describe what you did at work</label>
                  <textarea
                    value={modalData.description || ''}
                    onChange={(e) => setModalData({...modalData, description: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    rows={5}
                    maxLength={4000}
                    placeholder="Enter the responsibilities you held, anything you accomplished or learned while serving in your full time job"
                  />
                  <p className="text-xs text-gray-500 text-right">{(modalData.description || '').length}/4000</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setActiveModal(null)} className="text-blue-600 px-6 py-2">Cancel</button>
                <button
                  onClick={async () => {
                    const updatedUser = { ...user, employment: modalData };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    try {
                      await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user?.email, employment: modalData })
                      });
                    } catch (error) {
                      console.error('Error saving:', error);
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects Modal */}
      {activeModal === 'projects' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Projects</h2>
                  <p className="text-gray-600">Talk about your projects that made you proud</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">Project name</label>
                  <input
                    type="text"
                    value={modalData.projectName || ''}
                    onChange={(e) => setModalData({...modalData, projectName: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter the name of the project you undertook"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Describe what you did at internship</label>
                  <textarea
                    value={modalData.description || ''}
                    onChange={(e) => setModalData({...modalData, description: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    rows={4}
                    maxLength={1000}
                    placeholder="Enter the responsibilities you held, anything you accomplished or learned while serving in your internship"
                  />
                  <p className="text-xs text-gray-500 text-right">{(modalData.description || '').length}/1000</p>
                </div>
                <div>
                  <label className="block font-medium mb-2">Key skills (optional)</label>
                  <input
                    type="text"
                    value={modalData.skills || ''}
                    onChange={(e) => setModalData({...modalData, skills: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter the skills you used in this role"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Project URL (optional)</label>
                  <input
                    type="text"
                    value={modalData.projectUrl || ''}
                    onChange={(e) => setModalData({...modalData, projectUrl: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter the website link of the project"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setActiveModal(null)} className="text-blue-600 px-6 py-2">Cancel</button>
                <button
                  onClick={async () => {
                    const updatedUser = { ...user, projects: modalData };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    try {
                      await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user?.email, projects: modalData })
                      });
                    } catch (error) {
                      console.error('Error saving:', error);
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Internships Modal */}
      {activeModal === 'internships' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Internships</h2>
                  <p className="text-gray-600">Show your professional learnings</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">Company name</label>
                  <input
                    type="text"
                    value={modalData.companyName || ''}
                    onChange={(e) => setModalData({...modalData, companyName: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter the name of the company"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Internship duration</label>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={modalData.startMonth || ''}
                      onChange={(e) => setModalData({...modalData, startMonth: e.target.value})}
                      className="p-3 border rounded-lg"
                    >
                      <option value="">Month</option>
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m}>{m}</option>)}
                    </select>
                    <input
                      type="text"
                      value={modalData.startYear || ''}
                      onChange={(e) => setModalData({...modalData, startYear: e.target.value})}
                      className="p-3 border rounded-lg"
                      placeholder="Year"
                    />
                  </div>
                  <p className="text-center text-gray-500 text-sm my-2">to</p>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={modalData.endMonth || ''}
                      onChange={(e) => setModalData({...modalData, endMonth: e.target.value})}
                      className="p-3 border rounded-lg"
                    >
                      <option value="">Month</option>
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m}>{m}</option>)}
                    </select>
                    <input
                      type="text"
                      value={modalData.endYear || ''}
                      onChange={(e) => setModalData({...modalData, endYear: e.target.value})}
                      className="p-3 border rounded-lg"
                      placeholder="Year"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-2">Describe what you did at internship</label>
                  <textarea
                    value={modalData.description || ''}
                    onChange={(e) => setModalData({...modalData, description: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    rows={4}
                    maxLength={1000}
                    placeholder="Enter the responsibilities you held, anything you accomplished or learned while serving in your internship"
                  />
                  <p className="text-xs text-gray-500 text-right">{(modalData.description || '').length}/1000</p>
                </div>
                <div>
                  <label className="block font-medium mb-2">Key skills (optional)</label>
                  <input
                    type="text"
                    value={modalData.skills || ''}
                    onChange={(e) => setModalData({...modalData, skills: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter the skills you used in this role"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setActiveModal(null)} className="text-blue-600 px-6 py-2">Cancel</button>
                <button
                  onClick={async () => {
                    const updatedUser = { ...user, internships: modalData };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    try {
                      await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user?.email, internships: modalData })
                      });
                    } catch (error) {
                      console.error('Error saving:', error);
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certifications Modal */}
      {activeModal === 'certifications' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Certification</h2>
                  <p className="text-gray-600">Add details of your certification. You can add up to 10 in your profile.</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">Certification name</label>
                  <input
                    type="text"
                    value={modalData.certificationName || ''}
                    onChange={(e) => setModalData({...modalData, certificationName: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Please enter your certification name"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Certification completion ID</label>
                  <input
                    type="text"
                    value={modalData.completionId || ''}
                    onChange={(e) => setModalData({...modalData, completionId: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Please mention your course completion ID"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Certification URL</label>
                  <input
                    type="text"
                    value={modalData.certificationUrl || ''}
                    onChange={(e) => setModalData({...modalData, certificationUrl: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Please mention your completion URL"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Certification validity</label>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={modalData.startMonth || ''}
                      onChange={(e) => setModalData({...modalData, startMonth: e.target.value})}
                      className="p-3 border rounded-lg"
                    >
                      <option value="">Month</option>
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m}>{m}</option>)}
                    </select>
                    <input
                      type="text"
                      value={modalData.startYear || ''}
                      onChange={(e) => setModalData({...modalData, startYear: e.target.value})}
                      className="p-3 border rounded-lg"
                      placeholder="Year"
                    />
                  </div>
                  <p className="text-center text-gray-500 text-sm my-2">to</p>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={modalData.endMonth || ''}
                      onChange={(e) => setModalData({...modalData, endMonth: e.target.value})}
                      className="p-3 border rounded-lg"
                      disabled={modalData.noExpiry}
                    >
                      <option value="">Month</option>
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m}>{m}</option>)}
                    </select>
                    <input
                      type="text"
                      value={modalData.endYear || ''}
                      onChange={(e) => setModalData({...modalData, endYear: e.target.value})}
                      className="p-3 border rounded-lg"
                      placeholder="Year"
                      disabled={modalData.noExpiry}
                    />
                  </div>
                  <label className="flex items-center mt-3">
                    <input
                      type="checkbox"
                      checked={modalData.noExpiry || false}
                      onChange={(e) => setModalData({...modalData, noExpiry: e.target.checked, endMonth: '', endYear: ''})}
                      className="mr-2"
                    />
                    <span className="text-sm">This certification does not expire</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setActiveModal(null)} className="text-blue-600 px-6 py-2">Cancel</button>
                <button
                  onClick={async () => {
                    const updatedUser = { ...user, certifications: modalData };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    calculateProfileCompletion(updatedUser);
                    try {
                      await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user?.email, certifications: modalData })
                      });
                    } catch (error) {
                      console.error('Error saving:', error);
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Awards Modal */}
      {activeModal === 'awards' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Awards</h2>
                  <p className="text-gray-600">Talk about any special recognitions that you received</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
              </div>
              <textarea value={modalData} onChange={(e) => setModalData(e.target.value)} className="w-full p-3 border rounded-lg" rows={6} placeholder="Enter your awards" />
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setActiveModal(null)} className="text-blue-600 px-6 py-2">Cancel</button>
                <button
                  onClick={async () => {
                    const updatedUser = { ...user, awards: modalData };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    calculateProfileCompletion(updatedUser);
                    try {
                      await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user?.email, awards: modalData })
                      });
                    } catch (error) {
                      console.error('Error saving:', error);
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Club & Committees Modal */}
      {activeModal === 'clubsCommittees' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Club & committees</h2>
                  <p className="text-gray-600">Showcase your leadership skills by adding position of responsibilities that you have held</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">Club or committee name</label>
                  <input
                    type="text"
                    value={modalData.clubName || ''}
                    onChange={(e) => setModalData({...modalData, clubName: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Eg. E-Cell"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Designation/Position of responsibility</label>
                  <input
                    type="text"
                    value={modalData.designation || ''}
                    onChange={(e) => setModalData({...modalData, designation: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="Eg. Head boy"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Associate with education (optional)</label>
                  <select
                    value={modalData.associatedEducation || ''}
                    onChange={(e) => setModalData({...modalData, associatedEducation: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">Select an option</option>
                    <option>College</option>
                    <option>School</option>
                    <option>University</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-2">Duration</label>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={modalData.startMonth || ''}
                      onChange={(e) => setModalData({...modalData, startMonth: e.target.value})}
                      className="p-3 border rounded-lg"
                    >
                      <option value="">Month</option>
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m}>{m}</option>)}
                    </select>
                    <input
                      type="text"
                      value={modalData.startYear || ''}
                      onChange={(e) => setModalData({...modalData, startYear: e.target.value})}
                      className="p-3 border rounded-lg"
                      placeholder="Year"
                    />
                  </div>
                  <p className="text-center text-gray-500 text-sm my-2">to</p>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={modalData.endMonth || ''}
                      onChange={(e) => setModalData({...modalData, endMonth: e.target.value})}
                      className="p-3 border rounded-lg"
                      disabled={modalData.currentlyWorking}
                    >
                      <option value="">Month</option>
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m}>{m}</option>)}
                    </select>
                    <input
                      type="text"
                      value={modalData.endYear || ''}
                      onChange={(e) => setModalData({...modalData, endYear: e.target.value})}
                      className="p-3 border rounded-lg"
                      placeholder="Year"
                      disabled={modalData.currentlyWorking}
                    />
                  </div>
                  <label className="flex items-center mt-3">
                    <input
                      type="checkbox"
                      checked={modalData.currentlyWorking || false}
                      onChange={(e) => setModalData({...modalData, currentlyWorking: e.target.checked, endMonth: '', endYear: ''})}
                      className="mr-2"
                    />
                    <span className="text-sm">I am currently working in this role</span>
                  </label>
                </div>
                <div>
                  <label className="block font-medium mb-2">Description</label>
                  <textarea
                    value={modalData.description || ''}
                    onChange={(e) => setModalData({...modalData, description: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    rows={4}
                    maxLength={1000}
                    placeholder="Describe your responsibilities and experiences at this position"
                  />
                  <p className="text-xs text-gray-500 text-right">{(modalData.description || '').length}/1000</p>
                </div>
                <div>
                  <label className="block font-medium mb-2">Media (optional)</label>
                  <p className="text-xs text-gray-500 mb-2">Add media to support your work</p>
                  <input
                    type="file"
                    accept=".doc,.docx,.pdf,.rtf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && file.size <= 2 * 1024 * 1024) {
                        setModalData({...modalData, mediaFile: file.name});
                      }
                    }}
                    className="w-full p-3 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Supported format: DOC, DOCx, PDF, RTF, PNG, JPG | Maximum file size: 2 MB</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setActiveModal(null)} className="text-blue-600 px-6 py-2">Cancel</button>
                <button
                  onClick={async () => {
                    const updatedUser = { ...user, clubsCommittees: modalData };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    calculateProfileCompletion(updatedUser);
                    try {
                      await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user?.email, clubsCommittees: modalData })
                      });
                    } catch (error) {
                      console.error('Error saving:', error);
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Competitive Exams Modal */}
      {activeModal === 'competitiveExams' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Competitive exams</h2>
                  <p className="text-gray-600">Add details of competitive exams you have taken to enhance your profile.</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">Competitive exam</label>
                  <select
                    value={modalData.examName || ''}
                    onChange={(e) => setModalData({...modalData, examName: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">Select Exam</option>
                    <option>TOEFL</option>
                    <option>GMAT</option>
                    <option>GRE</option>
                    <option>SAT</option>
                    <option>IELTS</option>
                    <option>CAT</option>
                    <option>GATE</option>
                    <option>JEE</option>
                    <option>NEET</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setActiveModal(null)} className="text-blue-600 px-6 py-2">Cancel</button>
                <button
                  onClick={async () => {
                    const updatedUser = { ...user, competitiveExams: modalData };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    calculateProfileCompletion(updatedUser);
                    try {
                      await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user?.email, competitiveExams: modalData })
                      });
                    } catch (error) {
                      console.error('Error saving:', error);
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Academic Achievements Modal */}
      {activeModal === 'academicAchievements' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Academic achievements</h2>
                  <p className="text-gray-600">Talk about any academic achievement whether in college or school that deserves a mention</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
              </div>
              <textarea value={modalData} onChange={(e) => setModalData(e.target.value)} className="w-full p-3 border rounded-lg" rows={6} placeholder="Enter your academic achievements" />
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setActiveModal(null)} className="text-blue-600 px-6 py-2">Cancel</button>
                <button
                  onClick={async () => {
                    const updatedUser = { ...user, academicAchievements: modalData };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    calculateProfileCompletion(updatedUser);
                    try {
                      await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user?.email, academicAchievements: modalData })
                      });
                    } catch (error) {
                      console.error('Error saving:', error);
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Education College Modal */}
      {activeModal === 'educationCollege' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">College/University Education</h2>
                  <p className="text-gray-600">Adding your educational details help recruiters know your value as a potential candidate</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">Degree/Course</label>
                  <input
                    type="text"
                    value={modalData.degree || ''}
                    onChange={(e) => setModalData({...modalData, degree: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="e.g., B.Tech in Computer Science"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">College/University Name</label>
                  <input
                    type="text"
                    value={modalData.college || ''}
                    onChange={(e) => setModalData({...modalData, college: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="e.g., ABC College of Engineering"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Course Type</label>
                  <select
                    value={modalData.courseType || ''}
                    onChange={(e) => setModalData({...modalData, courseType: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">Select Course Type</option>
                    <option>Full Time</option>
                    <option>Part Time</option>
                    <option>Distance Learning</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-2">Percentage/CGPA</label>
                  <input
                    type="text"
                    value={modalData.percentage || ''}
                    onChange={(e) => setModalData({...modalData, percentage: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="e.g., 85% or 8.5 CGPA"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Passing Year</label>
                  <input
                    type="text"
                    value={modalData.passingYear || ''}
                    onChange={(e) => setModalData({...modalData, passingYear: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="YYYY"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setActiveModal(null)} className="text-blue-600 px-6 py-2">Cancel</button>
                <button
                  onClick={async () => {
                    const updatedUser = { ...user, educationCollege: modalData };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    calculateProfileCompletion(updatedUser);
                    try {
                      await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user?.email, educationCollege: modalData })
                      });
                    } catch (error) {
                      console.error('Error saving:', error);
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Education Class 12 Modal */}
      {activeModal === 'educationClass12' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Class XII Details</h2>
                  <p className="text-gray-600">Adding your educational details help recruiters know your value as a potential candidate</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">Examination board</label>
                  <select
                    value={modalData.board || ''}
                    onChange={(e) => setModalData({...modalData, board: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">Select Board Name</option>
                    <option>CBSE</option>
                    <option>ICSE</option>
                    <option>State Board</option>
                    <option>IB</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-2">Medium of study</label>
                  <select
                    value={modalData.medium || ''}
                    onChange={(e) => setModalData({...modalData, medium: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">Select Medium</option>
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Tamil</option>
                    <option>Telugu</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-2">Percentage</label>
                  <input
                    type="text"
                    value={modalData.percentage || ''}
                    onChange={(e) => setModalData({...modalData, percentage: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="e.g. 95"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Passing year</label>
                  <input
                    type="text"
                    value={modalData.passingYear || ''}
                    onChange={(e) => setModalData({...modalData, passingYear: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="YYYY"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setActiveModal(null)} className="text-blue-600 px-6 py-2">Cancel</button>
                <button
                  onClick={async () => {
                    const updatedUser = { ...user, educationClass12: modalData };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    calculateProfileCompletion(updatedUser);
                    try {
                      await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user?.email, educationClass12: modalData })
                      });
                    } catch (error) {
                      console.error('Error saving:', error);
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Education Class 10 Modal */}
      {activeModal === 'educationClass10' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Class X Details</h2>
                  <p className="text-gray-600">Adding your educational details help recruiters know your value as a potential candidate</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">Examination board</label>
                  <select
                    value={modalData.board || ''}
                    onChange={(e) => setModalData({...modalData, board: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">Select Board Name</option>
                    <option>CBSE</option>
                    <option>ICSE</option>
                    <option>State Board</option>
                    <option>IB</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-2">Medium of study</label>
                  <select
                    value={modalData.medium || ''}
                    onChange={(e) => setModalData({...modalData, medium: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">Select Medium</option>
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Tamil</option>
                    <option>Telugu</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-2">Percentage</label>
                  <input
                    type="text"
                    value={modalData.percentage || ''}
                    onChange={(e) => setModalData({...modalData, percentage: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="e.g. 95"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Passing year</label>
                  <input
                    type="text"
                    value={modalData.passingYear || ''}
                    onChange={(e) => setModalData({...modalData, passingYear: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                    placeholder="YYYY"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setActiveModal(null)} className="text-blue-600 px-6 py-2">Cancel</button>
                <button
                  onClick={async () => {
                    const updatedUser = { ...user, educationClass10: modalData };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    calculateProfileCompletion(updatedUser);
                    try {
                      await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user?.email, educationClass10: modalData })
                      });
                    } catch (error) {
                      console.error('Error saving:', error);
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CandidateDashboardPage;
