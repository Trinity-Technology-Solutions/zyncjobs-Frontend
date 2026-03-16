import React, { useState, useEffect, lazy, Suspense, startTransition } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import APITest from './components/APITest';
import Header from './components/Header';
import NewHero from './components/NewHero';
import JobCategories from './components/JobCategories';
import LatestJobs from './components/LatestJobs';
import HowItWorks from './components/HowItWorks';
import TalentedPeople from './components/TalentedPeople';
import CallToAction from './components/CallToAction';
import Footer from './components/Footer';
import OfflineIndicator from './components/OfflineIndicator';
import ChatWidget from './components/ChatWidget';
import Notification from './components/Notification';
import MobileNavigation from './components/MobileNavigation';
import BackButton from './components/BackButton';
import JobAlertsManager from './components/JobAlertsManager';
import localStorageMigration from './services/localStorageMigration';
import { initializeEmployerIdCounter } from './utils/employerIdUtils';
const LoginPage = lazy(() => import('./pages/LoginPage'));
const LoginModal = lazy(() => import('./components/LoginModal'));
const RegisterModal = lazy(() => import('./components/RegisterModal'));
const EmployerLoginPage = lazy(() => import('./pages/EmployerLoginPage'));
const EmployerLoginModal = lazy(() => import('./components/EmployerLoginModal'));
const RoleSelectionModal = lazy(() => import('./components/RoleSelectionModal'));
const RoleSelectionPage = lazy(() => import('./pages/RoleSelectionPage'));
const CandidateRegisterPage = lazy(() => import('./pages/CandidateRegisterPage'));
const EmployerRegisterPage = lazy(() => import('./pages/EmployerRegisterPage'));
const EmployersPage = lazy(() => import('./pages/EmployersPage'));
const JobListingsPage = lazy(() => import('./pages/JobListingsPage'));
const CompanyJobsPage = lazy(() => import('./pages/CompanyJobsPage'));
const CompaniesPage = lazy(() => import('./pages/CompaniesPage'));
const CompanyDetailsPage = lazy(() => import('./pages/CompanyDetailsPage'));
const JobHuntingPage = lazy(() => import('./pages/JobHuntingPage'));
const ResumeTemplatesPage = lazy(() => import('./pages/ResumeTemplatesPage'));
const ResumeEditorPage = lazy(() => import('./pages/ResumeEditorPage'));
const ResumeReadyPage = lazy(() => import('./pages/ResumeReadyPage'));
const AIResumeBuilderPage = lazy(() => import('./pages/AIResumeBuilderPage'));
const ResumeViewerPage = lazy(() => import('./pages/ResumeViewerPage'));
const InterviewTipsPage = lazy(() => import('./pages/InterviewTipsPage'));
const CareerAdvicePage = lazy(() => import('./pages/CareerAdvicePage'));
const CareerCoachPage = lazy(() => import('./pages/CareerCoachPage'));
const CareerInsightsHubPage = lazy(() => import('./pages/CareerInsightsHubPage'));
const SalaryReportPage = lazy(() => import('./pages/SalaryReportPage'));
const CandidateSearchPage = lazy(() => import('./pages/CandidateSearchPage'));
const JobPostingPage = lazy(() => import('./pages/JobPostingPage'));
const JobPostingSelectionPage = lazy(() => import('./pages/JobPostingSelectionPage'));
const JobParsingPage = lazy(() => import('./pages/JobParsingPage'));
const JobDetailPage = lazy(() => import('./pages/JobDetailPage'));
const SkillDetailPage = lazy(() => import('./pages/SkillDetailPage'));
const CareerResources = lazy(() => import('./components/CareerResources'));
const CandidateDashboardPage = lazy(() => import('./pages/CandidateDashboardPage'));
const EmployerDashboardPage = lazy(() => import('./pages/EmployerDashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const SearchEngine = lazy(() => import('./components/SearchEngine'));
const CompanyProfilePage = lazy(() => import('./pages/CompanyProfilePage'));
const CompanyViewPage = lazy(() => import('./pages/CompanyViewPage'));
const CandidateProfileView = lazy(() => import('./pages/CandidateProfileView'));
const JobApplicationPage = lazy(() => import('./pages/JobApplicationPage'));
const DailyJobsPage = lazy(() => import('./pages/DailyJobsPage'));
const JobRolePage = lazy(() => import('./pages/JobRolePage'));
const HireTalentPage = lazy(() => import('./pages/HireTalentPage'));
const JobManagementPage = lazy(() => import('./pages/JobManagementPage'));
const CandidateResponseDetailPage = lazy(() => import('./pages/CandidateResponseDetailPageNew'));
const CandidateReviewPage = lazy(() => import('./pages/CandidateReviewPage'));
const RecruiterActionsPage = lazy(() => import('./pages/RecruiterActionsPage'));
const SearchAppearancesPage = lazy(() => import('./pages/SearchAppearancesPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const MyJobsPage = lazy(() => import('./pages/MyJobsPage'));
const MyApplicationsPage = lazy(() => import('./pages/MyApplicationsPage'));
const ResumeParserPage = lazy(() => import('./pages/ResumeParserPage'));
const CompanyTestPage = lazy(() => import('./pages/CompanyTestPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const ResumeModerationDashboard = lazy(() => import('./pages/ResumeModerationDashboard'));
const JobModerationDashboard = lazy(() => import('./pages/JobModerationDashboard'));
const ResumeUploadWithModeration = lazy(() => import('./components/ResumeUploadWithModeration'));
const AIScoringDemoPage = lazy(() => import('./pages/AIScoringDemoPage'));
const ApplicationManagementPage = lazy(() => import('./pages/ApplicationManagementPage'));
const EmployerProfilePage = lazy(() => import('./pages/EmployerProfilePage'));
const MeetingTest = lazy(() => import('./components/MeetingTest'));
const SkillAssessment = lazy(() => import('./components/SkillAssessment'));
const SkillAssessmentPage = lazy(() => import('./pages/SkillAssessmentPage'));
const AssessmentReviewPage = lazy(() => import('./pages/AssessmentReviewPage'));
const InterviewScheduling = lazy(() => import('./components/InterviewScheduling'));
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const CandidateInterviewsPage = lazy(() => import('./pages/CandidateInterviewsPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const WhyZyncJobsPage = lazy(() => import('./pages/WhyZyncJobsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const HelpCenterPage = lazy(() => import('./pages/HelpCenterPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const AccessibilityPage = lazy(() => import('./pages/AccessibilityPage'));
const ResumeHelpPage = lazy(() => import('./pages/ResumeHelpPage'));
const JobShareTestPage = lazy(() => import('./pages/JobShareTestPage'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);



function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTopic, setCurrentTopic] = useState('');
  const [currentData, setCurrentData] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEmployerLoginModal, setShowEmployerLoginModal] = useState(false);
  const [showRoleSelectionModal, setShowRoleSelectionModal] = useState(false);
  const [showCandidateRegisterModal, setShowCandidateRegisterModal] = useState(false);
  const [showEmployerRegisterModal, setShowEmployerRegisterModal] = useState(false);
  const [user, setUser] = useState<{name: string, type: 'candidate' | 'employer' | 'admin', email?: string} | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    isVisible: boolean;
  }>({ type: 'info', message: '', isVisible: false });

  // Initialize user from localStorage on app start
  useEffect(() => {
    // Initialize employer ID counter
    initializeEmployerIdCounter();
    
    // Disable PWA for now to prevent fetch errors
    // PWAManager.registerServiceWorker();
    // PWAManager.requestNotificationPermission();
    
    // Check for OAuth callback token first
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      // Handle OAuth callback - don't load from localStorage yet
      return;
    }
    
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        // Check for admin user first
        let userType: 'candidate' | 'employer' | 'admin' = 'candidate';
        if (userData.userType === 'admin' || userData.email === 'admin@zyncjobs.com' || userData.fullName === 'ZyncJobs Admin') {
          userType = 'admin';
        } else if (userData.userType === 'employer') {
          userType = 'employer';
        } else {
          userType = 'candidate';
        }
        
        // Standardize name display - always use the name field from backend
        const displayName = userData.name || userData.fullName || userData.email?.split('@')[0] || 'User';
        setUser({
          name: displayName,
          type: userType,
          email: userData.email
        });
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('user');
      }
    }
    
    // URL-based navigation is now handled by React Router
  }, []);

  // Handle URL-based job detail navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('id');
    
    if (jobId && location.pathname === '/job-detail') {
      // Set the job ID in currentData for the job detail page
      setCurrentData({ jobId });
    }
  }, [location.pathname, location.search]);

  const handleNavigation = (page: string, params?: any) => {
    console.log('🚀 Navigation called:', page, params);
    
    startTransition(() => {
      // Close any open modals when navigating to actual pages
      setShowLoginModal(false);
      setShowRegisterModal(false);
      setShowEmployerLoginModal(false);
      setShowRoleSelectionModal(false);
      setShowCandidateRegisterModal(false);
      setShowEmployerRegisterModal(false);
      
      if (params) {
        console.log('📊 Setting params:', params);
        if (typeof params === 'string') {
          setCurrentTopic(params);
        } else {
          setCurrentData(params);
          // Store job data in localStorage for job-detail navigation
          if (page === 'job-detail' && params.jobData) {
            console.log('💾 Storing job data in localStorage:', params.jobData);
            localStorage.setItem('selectedJob', JSON.stringify({
              _id: params.jobData._id,
              jobTitle: params.jobData.jobTitle || params.jobData.title,
              company: params.jobData.company,
              location: params.jobData.location,
              description: params.jobData.description,
              salary: params.jobData.salary,
              type: params.jobData.jobType || params.jobData.type,
              jobData: params.jobData
            }));
          }
        }
      } else {
        console.log('❌ No params provided, clearing currentData');
        // Clear currentData if no params provided
        setCurrentData(null);
      }
      
      // Handle assessment review navigation
      if (page === 'assessment-review' && params?.assessmentId) {
        navigate(`/assessment-review/${params.assessmentId}`);
      } else if (page === 'job-detail' && (params?.jobId || params?.jobData?._id)) {
        const id = params?.jobId || params?.jobData?._id;
        navigate(`/job-detail?id=${id}`);
      } else {
        // Navigate using React Router
        navigate(`/${page === 'home' ? '' : page}`);
      }
    });
    
    // Scroll to top when navigating
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const closeModals = () => {
    setShowLoginModal(false);
    setShowRegisterModal(false);
    setShowEmployerLoginModal(false);
    setShowRoleSelectionModal(false);
    setShowCandidateRegisterModal(false);
    setShowEmployerRegisterModal(false);
  };

  const handleLogin = (userData: {name: string, type: 'candidate' | 'employer' | 'admin', email?: string}) => {
    // Store consistent user data in localStorage
    const userToStore = {
      name: userData.name,
      fullName: userData.name, // Keep both for compatibility
      email: userData.email,
      userType: userData.type
    };
    localStorage.setItem('user', JSON.stringify(userToStore));
    setUser(userData);
    closeModals();
    
    // Run localStorage migration for logged-in user
    if (userData.email) {
      const token = localStorage.getItem('token');
      if (token) {
        localStorageMigration.setToken(token);
        // Run migration in background
        setTimeout(() => {
          localStorageMigration.runFullMigration().catch(console.error);
        }, 1000);
      }
    }
  };

  // Check for OAuth callback token
  const urlParams = new URLSearchParams(window.location.search);
  const oauthToken = urlParams.get('token');
  
  if (oauthToken) {
    return <TokenHandler onLogin={handleLogin} onNavigate={handleNavigation} />;
  }

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.clear(); // Clear everything
    navigate('/');
  };

  const handleRoleSelection = (role: 'candidate' | 'employer') => {
    setShowRoleSelectionModal(false);
    if (role === 'candidate') {
      navigate('/candidate-register');
    } else {
      navigate('/employer-register');
    }
  };

  const handleBackNavigation = () => {
    navigate(-1);
  };



  const currentPage = location.pathname.slice(1) || 'home';

  if (currentPage === 'employers') {
    return <Suspense fallback={<LoadingFallback />}><EmployersPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} /></Suspense>;
  }

  if (currentPage === 'job-listings') {
    return <Suspense fallback={<LoadingFallback />}><JobListingsPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} searchParams={currentData} /></Suspense>;
  }

  if (currentPage === 'company-details') {
    return <Suspense fallback={<LoadingFallback />}><CompanyDetailsPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} /></Suspense>;
  }

  if (currentPage === 'companies') {
    return <Suspense fallback={<LoadingFallback />}><CompaniesPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} /></Suspense>;
  }

  if (currentPage === 'company-jobs') {
    return <Suspense fallback={<LoadingFallback />}><CompanyJobsPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} companyName={currentData?.companyName} /></Suspense>;
  }

  if (currentPage === 'employer-profile') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <div className="min-h-screen bg-white">
          <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
          <EmployerProfilePage 
            onNavigate={handleNavigation} 
            employerId={currentData?.employerId}
            employerData={currentData?.employerData}
          />
          <Footer onNavigate={handleNavigation} />
        </div>
      </Suspense>
    );
  }



  if (currentPage === 'job-hunting') {
    return <Suspense fallback={<LoadingFallback />}><JobHuntingPage onNavigate={handleNavigation} /></Suspense>;
  }

  if (currentPage === 'interview-tips') {
    return <Suspense fallback={<LoadingFallback />}><InterviewTipsPage onNavigate={handleNavigation} /></Suspense>;
  }

  if (currentPage === 'career-advice') {
    return <Suspense fallback={<LoadingFallback />}><CareerAdvicePage onNavigate={handleNavigation} topic={currentTopic} /></Suspense>;
  }

  if (currentPage === 'career-coach') {
    return <Suspense fallback={<LoadingFallback />}><CareerCoachPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} /></Suspense>;
  }

  if (currentPage === 'career-insights-hub') {
    return <Suspense fallback={<LoadingFallback />}><CareerInsightsHubPage onNavigate={handleNavigation} /></Suspense>;
  }

  if (currentPage === 'salary-report') {
    return <Suspense fallback={<LoadingFallback />}><SalaryReportPage onNavigate={handleNavigation} /></Suspense>;
  }



  if (currentPage === 'job-detail') {
    // On refresh, currentData is null — read jobId directly from URL
    const urlParams = new URLSearchParams(location.search);
    const urlJobId = urlParams.get('id');
    const jobId = urlJobId ||
      (typeof currentData?.jobId === 'string' ? currentData.jobId :
        (currentData?.jobId?._id || currentData?.jobId?.id ||
         currentData?.jobData?.id || currentData?.jobData?._id));
    console.log('🔍 App.tsx - job-detail navigation:');
    console.log('📊 currentData:', currentData);
    console.log('🆔 jobId:', jobId);
    console.log('📝 jobData:', currentData?.jobData);
    
    return (
      <Suspense fallback={<LoadingFallback />}>
        <div className="min-h-screen bg-white">
          <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
          <JobDetailPage 
            onNavigate={handleNavigation} 
            jobTitle={typeof currentData?.jobTitle === 'string' ? currentData.jobTitle : currentTopic}
            jobId={jobId}
            companyName={currentData?.companyName}
            jobData={currentData?.jobData}
            user={user as any}
            onLogout={handleLogout}
          />
          <Footer onNavigate={handleNavigation} />
        </div>
      </Suspense>
    );
  }

  if (currentPage === 'skill-detail') {
    return <Suspense fallback={<LoadingFallback />}><SkillDetailPage onNavigate={handleNavigation} skillName={currentTopic} /></Suspense>;
  }

  if (currentPage === 'career-resources') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <div className="min-h-screen bg-white">
          <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
          <CareerResources />
          <Footer onNavigate={handleNavigation} />
          <BackButton onClick={handleBackNavigation} />
        </div>
      </Suspense>
    );
  }

  if (currentPage === 'dashboard') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Notification
          type={notification.type}
          message={notification.message}
          isVisible={notification.isVisible}
          onClose={() => setNotification({ ...notification, isVisible: false })}
        />
        {user?.type === 'admin' ? (
          <AdminDashboardPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
        ) : (
          <div className="min-h-screen bg-white">
            <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
            {user?.type === 'employer' ? (
              <EmployerDashboardPage onNavigate={handleNavigation} onLogout={handleLogout} />
            ) : (
              <CandidateDashboardPage onNavigate={handleNavigation} />
            )}
            <Footer onNavigate={handleNavigation} />
          </div>
        )}
      </Suspense>
    );
  }

  if (currentPage === 'search') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <div className="min-h-screen bg-white">
          <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
          <SearchEngine />
          <Footer onNavigate={handleNavigation} />
        </div>
      </Suspense>
    );
  }

  if (currentPage === 'company-profile') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <div className="min-h-screen bg-white">
          <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
          <CompanyProfilePage onNavigate={handleNavigation} companyName={currentData?.companyName} />
          <Footer onNavigate={handleNavigation} />
        </div>
      </Suspense>
    );
  }

  if (currentPage === 'company-view') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <CompanyViewPage 
          onNavigate={handleNavigation} 
          companyName={currentData?.companyName}
          user={user as any}
          onLogout={handleLogout}
        />
      </Suspense>
    );
  }

  if (currentPage === 'candidate-profile-view') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <CandidateProfileView 
          candidateId={currentData?.candidateId}
          onNavigate={handleNavigation}
          onBack={handleBackNavigation}
        />
      </Suspense>
    );
  }

  if (currentPage === 'job-application') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <JobApplicationPage 
          onNavigate={handleNavigation} 
          jobId={currentData?.jobId}
          jobData={currentData?.jobData}
        />
      </Suspense>
    );
  }

  if (currentPage === 'daily-jobs') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <div className="min-h-screen bg-white">
          <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
          <DailyJobsPage onNavigate={handleNavigation} />
          <Footer onNavigate={handleNavigation} />
        </div>
      </Suspense>
    );
  }

  if (currentPage === 'job-role') {
    return <Suspense fallback={<LoadingFallback />}><JobRolePage onNavigate={handleNavigation} jobTitle={currentTopic} /></Suspense>;
  }

  if (currentPage === 'job-posting-selection') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <div className="min-h-screen bg-white">
          <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
          <JobPostingSelectionPage onNavigate={handleNavigation} user={user as any} />
        </div>
      </Suspense>
    );
  }

  if (currentPage === 'job-parsing') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <div className="min-h-screen bg-white">
          <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
          <JobParsingPage onNavigate={handleNavigation} user={user as any} />
        </div>
      </Suspense>
    );
  }

  if (currentPage === 'job-posting') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <div className="min-h-screen bg-white">
          <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
          <JobPostingPage 
            onNavigate={handleNavigation} 
            user={user as any} 
            onLogout={handleLogout}
            mode={currentData?.mode}
            parsedData={currentData?.parsedData}
          />
        </div>
      </Suspense>
    );
  }

  if (currentPage === 'candidate-search') {
    return <Suspense fallback={<LoadingFallback />}><CandidateSearchPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} /></Suspense>;
  }

  if (currentPage === 'hire-talent') {
    return <Suspense fallback={<LoadingFallback />}><HireTalentPage onNavigate={handleNavigation} /></Suspense>;
  }

  if (currentPage === 'job-management') {
    return <Suspense fallback={<LoadingFallback />}><JobManagementPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} /></Suspense>;
  }

  if (currentPage === 'candidate-response-detail') {
    return <Suspense fallback={<LoadingFallback />}><CandidateResponseDetailPage onNavigate={handleNavigation} applicationId={currentData?.application} /></Suspense>;
  }

  if (currentPage === 'candidate-review') {
    return <Suspense fallback={<LoadingFallback />}><CandidateReviewPage onNavigate={handleNavigation} jobId={currentData?.jobId} /></Suspense>;
  }

  if (currentPage === 'recruiter-actions') {
    return <Suspense fallback={<LoadingFallback />}><RecruiterActionsPage onNavigate={handleNavigation} /></Suspense>;
  }

  if (currentPage === 'search-appearances') {
    return <Suspense fallback={<LoadingFallback />}><SearchAppearancesPage onNavigate={handleNavigation} /></Suspense>;
  }

  if (currentPage === 'application-management') {
    return <Suspense fallback={<LoadingFallback />}><ApplicationManagementPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} /></Suspense>;
  }

  if (currentPage === 'resume-editor') {
    return <Suspense fallback={<LoadingFallback />}><ResumeEditorPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} template={currentTopic} /></Suspense>;
  }

  if (currentPage.startsWith('resume-view/')) {
    const template = currentPage.split('/')[1];
    return <Suspense fallback={<LoadingFallback />}><ResumeViewerPage template={template} /></Suspense>;
  }

  if (currentPage === 'ai-resume-builder') {
    return <Suspense fallback={<LoadingFallback />}><AIResumeBuilderPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} /></Suspense>;
  }

  if (currentPage === 'resume-templates') {
    return <Suspense fallback={<LoadingFallback />}><ResumeTemplatesPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} /></Suspense>;
  }

  if (currentPage === 'resume-ready') {
    return <Suspense fallback={<LoadingFallback />}><ResumeReadyPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} /></Suspense>;
  }

















  if (currentPage === 'settings') {
    if (!user) {
      // Not logged in, redirect to role selection page
      navigate('/role-selection');
      return null;
    }
    return (
      <div className="min-h-screen bg-white">
        <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
        <SettingsPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
        <Footer onNavigate={handleNavigation} />
      </div>
    );
  }

  if (currentPage === 'my-jobs') {
    if (!user) {
      // Not logged in, redirect to role selection page
      navigate('/role-selection');
      return null;
    }
    return (
      <>
        <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
        <MyJobsPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
      </>
    );
  }

  if (currentPage === 'my-applications') {
    if (!user) {
      navigate('/role-selection');
      return null;
    }
    return <MyApplicationsPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />;
  }

  if (currentPage === 'alerts') {
    if (!user) {
      navigate('/role-selection');
      return null;
    }
    return (
      <>
        <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Job Alerts</h1>
            <Suspense fallback={<LoadingFallback />}>
              <JobAlertsManager user={user as any} />
            </Suspense>
          </div>
        </div>
        <Footer onNavigate={handleNavigation} />
      </>
    );
  }

  if (currentPage === 'resume-parser') {
    return <ResumeParserPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />;
  }

  if (currentPage === 'company-test') {
    return <CompanyTestPage onNavigate={handleNavigation} />;
  }

  if (currentPage === 'forgot-password') {
    return <ForgotPasswordPage onNavigate={handleNavigation} />;
  }

  if (currentPage.startsWith('reset-password/')) {
    const token = currentPage.split('/')[1];
    return <ResetPasswordPage onNavigate={handleNavigation} token={token} />;
  }

  if (currentPage === 'resume-moderation') {
    return (
      <div className="min-h-screen bg-white">
        <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
        <ResumeModerationDashboard />
        <Footer onNavigate={handleNavigation} />
      </div>
    );
  }

  if (currentPage === 'job-moderation') {
    return (
      <div className="min-h-screen bg-white">
        <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
        <JobModerationDashboard />
        <Footer onNavigate={handleNavigation} />
      </div>
    );
  }

  if (currentPage === 'resume-upload') {
    return (
      <div className="min-h-screen bg-white">
        <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-3xl font-bold mb-6">Upload Resume</h1>
          <ResumeUploadWithModeration 
            userId={user?.name || '1'} 
            onUploadComplete={(result) => {
              setNotification({
                type: result.resume.status === 'approved' ? 'success' : 'info',
                message: result.message,
                isVisible: true
              });
            }}
          />
        </div>
        <Footer onNavigate={handleNavigation} />
      </div>
    );
  }

  if (currentPage === 'ai-scoring-demo') {
    return (
      <div className="min-h-screen bg-white">
        <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
        <AIScoringDemoPage onNavigate={handleNavigation} />
        <Footer onNavigate={handleNavigation} />
      </div>
    );
  }

  if (currentPage === 'pricing') {
    return <PricingPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />;
  }

  if (currentPage === 'features') {
    return <FeaturesPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />;
  }

  if (currentPage === 'skill-assessment') {
    return <SkillAssessmentPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />;
  }

  if (currentPage.startsWith('assessment-review/')) {
    const assessmentId = currentPage.split('/')[1];
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AssessmentReviewPage 
          assessmentId={assessmentId} 
          onNavigate={handleNavigation} 
          user={user as any}
        />
      </Suspense>
    );
  }

  if (currentPage === 'skill-assessments') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
        <SkillAssessment />
        <Footer onNavigate={handleNavigation} />
        <MobileNavigation onNavigate={handleNavigation} currentPage={currentPage} />
      </div>
    );
  }

  if (currentPage === 'meeting-test') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
        <div className="py-8">
          <MeetingTest />
        </div>
        <Footer onNavigate={handleNavigation} />
      </div>
    );
  }

  if (currentPage === 'interviews') {
    if (!user) {
      navigate('/role-selection');
      return null;
    }
    return user.type === 'candidate' ? (
      <Suspense fallback={<LoadingFallback />}>
        <CandidateInterviewsPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
      </Suspense>
    ) : (
      <div className="min-h-screen bg-gray-50">
        <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
        <InterviewScheduling />
        <Footer onNavigate={handleNavigation} />
        <MobileNavigation onNavigate={handleNavigation} currentPage={currentPage} />
      </div>
    );
  }

  if (currentPage === 'login') {
    return <Suspense fallback={<LoadingFallback />}><LoginPage onNavigate={handleNavigation} onLogin={handleLogin} /></Suspense>;
  }

  if (currentPage === 'employer-login') {
    return <Suspense fallback={<LoadingFallback />}><EmployerLoginPage onNavigate={handleNavigation} onLogin={handleLogin} onShowNotification={(notif) => setNotification({...notif, isVisible: true})} /></Suspense>;
  }

  if (currentPage === 'candidate-register') {
    return <Suspense fallback={<LoadingFallback />}><CandidateRegisterPage onNavigate={handleNavigation} /></Suspense>;
  }

  if (currentPage === 'role-selection') {
    return <Suspense fallback={<LoadingFallback />}><RoleSelectionPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} /></Suspense>;
  }

  if (currentPage === 'employer-register') {
    return <Suspense fallback={<LoadingFallback />}><EmployerRegisterPage onNavigate={handleNavigation} onLogin={handleLogin} /></Suspense>;
  }

  if (currentPage === 'about') {
    return <Suspense fallback={<LoadingFallback />}><AboutPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} /></Suspense>;
  }

  if (currentPage === 'why-zyncjobs') {
    return <Suspense fallback={<LoadingFallback />}><WhyZyncJobsPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} /></Suspense>;
  }

  if (currentPage === 'contact') {
    return <Suspense fallback={<LoadingFallback />}><ContactPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} /></Suspense>;
  }

  if (currentPage === 'help') {
    return <Suspense fallback={<LoadingFallback />}><HelpCenterPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} /></Suspense>;
  }

  if (currentPage === 'terms') {
    return <Suspense fallback={<LoadingFallback />}><TermsPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} /></Suspense>;
  }

  if (currentPage === 'privacy') {
    return <Suspense fallback={<LoadingFallback />}><PrivacyPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} /></Suspense>;
  }

  if (currentPage === 'accessibility') {
    return <Suspense fallback={<LoadingFallback />}><AccessibilityPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} /></Suspense>;
  }

  if (currentPage === 'resume-help') {
    return <Suspense fallback={<LoadingFallback />}><ResumeHelpPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} /></Suspense>;
  }

  if (currentPage === 'job-share-test') {
    return <Suspense fallback={<LoadingFallback />}><JobShareTestPage /></Suspense>;
  }

  return (
    <>
      <APITest />
      <OfflineIndicator />
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification({ ...notification, isVisible: false })}
      />
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen bg-white">
            <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
            <NewHero onNavigate={handleNavigation} user={user as any} />
            <LatestJobs onNavigate={handleNavigation} />
            <HowItWorks onNavigate={handleNavigation} />
            <JobCategories onNavigate={handleNavigation} />
            <TalentedPeople onNavigate={handleNavigation} />
            <CallToAction onNavigate={handleNavigation} />
            <Footer onNavigate={handleNavigation} />
            <ChatWidget />
            <MobileNavigation onNavigate={handleNavigation} currentPage="home" />
          </div>
        } />
        
        {/* Reset Password with URL param */}
        <Route path="/reset-password/:token" element={
          <Suspense fallback={<LoadingFallback />}>
            <ResetPasswordPage onNavigate={handleNavigation} />
          </Suspense>
        } />
        
        {/* Resume Viewer with URL param */}
        <Route path="/resume-view/:template" element={
          <Suspense fallback={<LoadingFallback />}>
            <ResumeViewerPage />
          </Suspense>
        } />
        
        {/* Catch all other routes - render based on currentPage */}
        <Route path="*" element={<>{/* Existing page rendering logic */}</>} />
      </Routes>
      
      {/* Modals */}
      <Suspense fallback={null}>
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={closeModals} 
          onNavigate={handleNavigation}
          onLogin={handleLogin}
        />
        <RegisterModal 
          isOpen={showRegisterModal} 
          onClose={closeModals} 
          onNavigate={handleNavigation} 
        />
        <EmployerLoginModal 
          isOpen={showEmployerLoginModal} 
          onClose={closeModals} 
          onNavigate={handleNavigation}
          onLogin={handleLogin}
          onShowNotification={(notif) => setNotification({...notif, isVisible: true})}
        />
        <RoleSelectionModal 
          isOpen={showRoleSelectionModal} 
          onClose={closeModals} 
          onSelectRole={handleRoleSelection} 
        />
      </Suspense>
    </>
  );
}

export default App;
