import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, Search, User, Building, ChevronDown, Settings } from 'lucide-react';
import { API_ENDPOINTS } from '../config/env';

interface HeaderProps {
  onNavigate?: (page: string) => void;
  user?: {name: string, type: 'candidate' | 'employer' | 'admin'} | null;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isCareerDropdownOpen, setIsCareerDropdownOpen] = useState(false);
  const [profileMetrics, setProfileMetrics] = useState({ jobsPosted: 0, applicationsReceived: 0, searchAppearances: 0, recruiterActions: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const careerDropdownRef = useRef<HTMLDivElement>(null);

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
      // Check if user is logged in
      if (user) {
        // User is logged in, go directly to career resources
        onNavigate('career-resources');
      } else {
        // User not logged in, show registration flow
        onNavigate('register');
      }
    }
  };





  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setIsMegaMenuOpen(false);
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
      if (user) {
        try {
          // Get user data from localStorage to get email
          const userData = localStorage.getItem('user');
          if (userData) {
            const parsedUser = JSON.parse(userData);
            const userEmail = parsedUser.email || parsedUser.id;
            
            console.log('Fetching analytics for:', userEmail, 'type:', user.type);
            
            const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/analytics/profile/${encodeURIComponent(userEmail)}?userType=${user.type}`);
            
            if (response.ok) {
              const contentType = response.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                console.log('Analytics data received:', data);
                setProfileMetrics(data);
              } else {
                console.warn('Analytics API returned non-JSON response');
                // Set default values if API returns HTML
                setProfileMetrics({ jobsPosted: 0, applicationsReceived: 0, searchAppearances: 0, recruiterActions: 0 });
              }
            } else {
              console.error('Analytics API error:', response.status);
              setProfileMetrics({ jobsPosted: 0, applicationsReceived: 0, searchAppearances: 0, recruiterActions: 0 });
            }
          }
        } catch (error) {
          console.error('Error fetching profile metrics:', error);
          // Set default values on error
          setProfileMetrics({ jobsPosted: 0, applicationsReceived: 0, searchAppearances: 0, recruiterActions: 0 });
        }
      }
    };
    fetchProfileMetrics();
  }, [user]);

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex-shrink-0">
            <button 
              onClick={() => onNavigate && onNavigate('home')}
              className="flex items-center cursor-pointer"
            >
              <img 
                src="/images/zyncjobs-logo.png" 
                alt="ZyncJobs" 
                className="h-20 w-auto"
              />
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 flex-1 justify-start ml-8">
            <button onClick={handleFindJobsClick} className="text-gray-900 hover:text-gray-600 font-medium transition-colors">
              {user?.type === 'employer' ? 'Candidate Search' : 'Job Search'}
            </button>
            <button onClick={handleCompaniesClick} className="text-gray-900 hover:text-gray-600 font-medium transition-colors">
              Companies
            </button>
            {user?.type !== 'employer' && (
              <button onClick={() => onNavigate && onNavigate('company-reviews')} className="text-gray-900 hover:text-gray-600 font-medium transition-colors">
                Company Reviews
              </button>
            )}

            <div className="relative" ref={careerDropdownRef}>
              <button 
                onClick={() => setIsCareerDropdownOpen(!isCareerDropdownOpen)}
                className="flex items-center space-x-1 text-gray-900 hover:text-gray-600 font-medium transition-colors"
              >
                <span>Career Resources</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isCareerDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCareerDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 z-50">
                  {user?.type === 'employer' ? (
                    // Employer Resources
                    <>
                      <button 
                        onClick={() => {
                          setIsCareerDropdownOpen(false);
                          onNavigate && onNavigate('resume-parser');
                        }}
                        className="block w-full text-left px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        Resume Parser Tool
                      </button>
                      <button 
                        onClick={() => {
                          setIsCareerDropdownOpen(false);
                          onNavigate && onNavigate('salary-report');
                        }}
                        className="block w-full text-left px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        Salary Benchmarking
                      </button>
                    </>
                  ) : (
                    // Candidate Resources
                    <>
                      <button 
                        onClick={() => {
                          setIsCareerDropdownOpen(false);
                          onNavigate && onNavigate('resume-templates');
                        }}
                        className="block w-full text-left px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        Resume Builder
                      </button>
                      <button 
                        onClick={() => {
                          setIsCareerDropdownOpen(false);
                          onNavigate && onNavigate('skill-assessment');
                        }}
                        className="block w-full text-left px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        Skill Assessments
                      </button>
                      <button 
                        onClick={() => {
                          setIsCareerDropdownOpen(false);
                          onNavigate && onNavigate('interviews');
                        }}
                        className="block w-full text-left px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        Interview Scheduling
                      </button>
                      <button 
                        onClick={() => {
                          setIsCareerDropdownOpen(false);
                          onNavigate && onNavigate('career-advice');
                        }}
                        className="block w-full text-left px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        Career Coach Agent
                      </button>
                      <button 
                        onClick={() => {
                          setIsCareerDropdownOpen(false);
                          onNavigate && onNavigate('salary-report');
                        }}
                        className="block w-full text-left px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        Salary Benchmarking
                      </button>
                      <button 
                        onClick={() => {
                          setIsCareerDropdownOpen(false);
                          onNavigate && onNavigate('resume-parser');
                        }}
                        className="block w-full text-left px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        Resume Parser Tool
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
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
          <div className="hidden md:flex items-center space-x-6 ml-auto">
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
                                onNavigate && onNavigate('job-listings');
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
                              onNavigate && onNavigate('alerts');
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
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button onClick={handleLoginClick} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                      Login
                    </button>
                    <button onClick={handleRegisterClick} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                      Register
                    </button>
                    <button onClick={handleEmployerLoginClick} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                      Employer Login
                    </button>
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
          <div className="md:hidden py-4 border-t border-gray-600">
            <div className="space-y-4">
              <button onClick={handleFindJobsClick} className="block text-left text-white hover:text-gray-300 font-medium">
                {user?.type === 'employer' ? 'Candidate Search' : 'Job Search'}
              </button>
              <button onClick={handleCompaniesClick} className="block text-left text-white hover:text-gray-300 font-medium">
                Companies
              </button>
              <button onClick={() => onNavigate && onNavigate('skill-assessment')} className="block text-left text-white hover:text-gray-300 font-medium">
                Skill Assessments
              </button>
              {user?.type !== 'employer' && (
                <button onClick={() => onNavigate && onNavigate('company-reviews')} className="block text-left text-white hover:text-gray-300 font-medium">
                  Company Reviews
                </button>
              )}
              <div className="space-y-2">
                <p className="text-white font-medium">Career Resources</p>
                <div className="pl-4 space-y-2">
                  <button 
                    onClick={() => onNavigate && onNavigate('resume-templates')}
                    className="block text-left text-gray-300 hover:text-white text-sm"
                  >
                    Resume Builder
                  </button>
                  <button 
                    onClick={() => onNavigate && onNavigate('career-advice')}
                    className="block text-left text-gray-300 hover:text-white text-sm"
                  >
                    Career Coach Agent
                  </button>
                  <button 
                    onClick={() => onNavigate && onNavigate('skill-gap-analysis')}
                    className="block text-left text-gray-300 hover:text-white text-sm"
                  >
                    Skill Gap Analysis
                  </button>
                  <button 
                    onClick={() => onNavigate && onNavigate('career-roadmap')}
                    className="block text-left text-gray-300 hover:text-white text-sm"
                  >
                    Career Roadmap Generator
                  </button>
                  <button 
                    onClick={() => onNavigate && onNavigate('interview-simulation')}
                    className="block text-left text-gray-300 hover:text-white text-sm"
                  >
                    Interview Simulation
                  </button>
                  <button 
                    onClick={() => onNavigate && onNavigate('salary-report')}
                    className="block text-left text-gray-300 hover:text-white text-sm"
                  >
                    Salary Benchmarking Tool
                  </button>
                  <button 
                    onClick={() => onNavigate && onNavigate('learning-path')}
                    className="block text-left text-gray-300 hover:text-white text-sm"
                  >
                    Learning Path Generator
                  </button>
                  <button 
                    onClick={() => onNavigate && onNavigate('resume-parser')}
                    className="block text-left text-gray-300 hover:text-white text-sm"
                  >
                    Resume Parser Tool
                  </button>
                </div>
              </div>
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
                className="block text-left text-white hover:text-gray-300 font-medium"
              >
                {user?.type === 'employer' ? 'Job Posting' : 'My Jobs'}
              </button>
              <div className="pt-4 border-t border-gray-600 space-y-3">
                <button className="flex items-center space-x-2 text-white hover:text-gray-300 font-medium">
                  <User className="w-4 h-4" />
                  <span>Login/Register</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;