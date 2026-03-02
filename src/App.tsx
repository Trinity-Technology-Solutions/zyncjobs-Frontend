import React, { useState, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import APITest from './components/APITest';
import Header from './components/Header';
import NewHero from './components/NewHero';
import JobCategories from './components/JobCategories';
import LatestJobs from './components/LatestJobs';
import HowItWorks from './components/HowItWorks';
import TalentedPeople from './components/TalentedPeople';
import CallToAction from './components/CallToAction';
import Footer from './components/Footer';
import PWAInstallButton from './components/PWAInstallButton';
import OfflineIndicator from './components/OfflineIndicator';
import { PWAManager } from './utils/pwa';
import LoginPage from './pages/LoginPage';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import EmployerLoginPage from './pages/EmployerLoginPage';
import EmployerLoginModal from './components/EmployerLoginModal';
import RoleSelectionModal from './components/RoleSelectionModal';
import RoleSelectionPage from './pages/RoleSelectionPage';
import CandidateRegisterPage from './pages/CandidateRegisterPage';
import EmployerRegisterPage from './pages/EmployerRegisterPage';
import EmployersPage from './pages/EmployersPage';
import JobListingsPage from './pages/JobListingsPage';
import CompaniesPage from './pages/CompaniesPage';
import JobHuntingPage from './pages/JobHuntingPage';
import TokenHandler from './components/TokenHandler';

import ResumeTemplatesPage from './pages/ResumeTemplatesPage';
import ResumeEditorPage from './pages/ResumeEditorPage';
import ResumeReadyPage from './pages/ResumeReadyPage';
import AIResumeBuilderPage from './pages/AIResumeBuilderPage';
import ResumeViewerPage from './pages/ResumeViewerPage';
import InterviewTipsPage from './pages/InterviewTipsPage';
import CareerAdvicePage from './pages/CareerAdvicePage';
import CareerInsightsHubPage from './pages/CareerInsightsHubPage';
import SalaryReportPage from './pages/SalaryReportPage';
import CandidateSearchPage from './pages/CandidateSearchPage';
import JobPostingPage from './pages/JobPostingPage';
import JobPostingSelectionPage from './pages/JobPostingSelectionPage';
import JobParsingPage from './pages/JobParsingPage';
import JobDetailPage from './pages/JobDetailPage';
import SkillDetailPage from './pages/SkillDetailPage';
import CareerResources from './components/CareerResources';
import CandidateDashboardPage from './pages/CandidateDashboardPage';
import EmployerDashboardPage from './pages/EmployerDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import SearchEngine from './components/SearchEngine';
import BackButton from './components/BackButton';
import CompanyReviewsPage from './pages/CompanyReviewsPage';
import CompanyProfilePage from './pages/CompanyProfilePage';
import CompanyViewPage from './pages/CompanyViewPage';
import CandidateProfileView from './pages/CandidateProfileView';
import JobApplicationPage from './pages/JobApplicationPage';
import DailyJobsPage from './pages/DailyJobsPage';
import JobRolePage from './pages/JobRolePage';
import HireTalentPage from './pages/HireTalentPage';
import JobManagementPage from './pages/JobManagementPage';
import CandidateResponseDetailPage from './pages/CandidateResponseDetailPageNew';
import CandidateReviewPage from './pages/CandidateReviewPage';
import RecruiterActionsPage from './pages/RecruiterActionsPage';
import SearchAppearancesPage from './pages/SearchAppearancesPage';

import SettingsPage from './pages/SettingsPage';
import MyJobsPage from './pages/MyJobsPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import ResumeParserPage from './pages/ResumeParserPage';
import CompanyTestPage from './pages/CompanyTestPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ResumeModerationDashboard from './pages/ResumeModerationDashboard';
import JobModerationDashboard from './pages/JobModerationDashboard';
import ResumeUploadWithModeration from './components/ResumeUploadWithModeration';
import AIScoringDemoPage from './pages/AIScoringDemoPage';
import ApplicationManagementPage from './pages/ApplicationManagementPage';

import EmployerProfilePage from './pages/EmployerProfilePage';

import MeetingTest from './components/MeetingTest';
import ChatWidget from './components/ChatWidget';
import Notification from './components/Notification';
import MobileNavigation from './components/MobileNavigation';
import SkillAssessment from './components/SkillAssessment';
import SkillAssessmentPage from './pages/SkillAssessmentPage';
import InterviewScheduling from './components/InterviewScheduling';
import FeaturesPage from './pages/FeaturesPage';
import PricingPage from './pages/PricingPage';



function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [currentTopic, setCurrentTopic] = useState('');
  const [currentData, setCurrentData] = useState<any>(null);
  const [navigationHistory, setNavigationHistory] = useState<string[]>(['home']);
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
        console.log('Loading user from localStorage:', userData);
        console.log('Raw userType from localStorage:', userData.userType);
        // Check for admin user first
        let userType: 'candidate' | 'employer' | 'admin' = 'candidate';
        if (userData.userType === 'admin' || userData.email === 'admin@zyncjobs.com' || userData.fullName === 'ZyncJobs Admin') {
          userType = 'admin';
        } else if (userData.userType === 'employer') {
          userType = 'employer';
        } else {
          userType = 'candidate';
        }
        
        console.log('Mapped user type:', userType);
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
    
    // Handle URL-based navigation (for reset password links and resume viewer)
    const path = window.location.pathname;
    if (path.startsWith('/reset-password/')) {
      const token = path.split('/')[2];
      if (token) {
        setCurrentPage(`reset-password/${token}`);
      }
    } else if (path.startsWith('/resume-view/')) {
      const template = path.split('/')[2];
      if (template) {
        setCurrentPage(`resume-view/${template}`);
      }
    }
  }, []);

  // Force update document title
  useEffect(() => {
    document.title = 'ZyncJobs - AI Skills. Bigger Chances. Better Jobs';
  }, []);

  const handleNavigation = (page: string, topic?: string) => {
    console.log('Navigation called:', page, topic);
    console.log('Current page before navigation:', currentPage);
    
    // Handle reset password with token
    if (page.startsWith('reset-password/')) {
      setCurrentPage(page);
      return;
    }
    
    // Close any open modals when navigating to actual pages
    setShowLoginModal(false);
    setShowRegisterModal(false);
    setShowEmployerLoginModal(false);
    setShowRoleSelectionModal(false);
    setShowCandidateRegisterModal(false);
    setShowEmployerRegisterModal(false);
    
    // Add to navigation history
    if (page !== currentPage) {
      setNavigationHistory(prev => [...prev, page]);
    }
    
    setCurrentPage(page);
    if (topic) {
      setCurrentTopic(topic);
    }
    if (typeof topic === 'object') {
      setCurrentData(topic);
    }
    
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
  };

  // Check for OAuth callback token
  const urlParams = new URLSearchParams(window.location.search);
  const oauthToken = urlParams.get('token');
  
  if (oauthToken) {
    return <TokenHandler onLogin={handleLogin} onNavigate={handleNavigation} />;
  }

  const handleLogout = () => {
    console.log('🚪 App.tsx handleLogout called');
    console.log('👤 Current user before logout:', user);
    
    setUser(null);
    localStorage.removeItem('user');
    localStorage.clear(); // Clear everything
    setCurrentPage('home');
    setNavigationHistory(['home']); // Reset navigation history
    
    console.log('✅ App.tsx logout complete - user set to null, navigated to home');
  };

  const handleRoleSelection = (role: 'candidate' | 'employer') => {
    // This function is now handled by the RoleSelectionPage component
    // Keep for backward compatibility with any remaining modal usage
    setShowRoleSelectionModal(false);
    if (role === 'candidate') {
      setCurrentPage('candidate-register');
    } else {
      setCurrentPage('employer-register');
    }
  };

  const handleBackNavigation = () => {
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop(); // Remove current page
      const previousPage = newHistory[newHistory.length - 1];
      setNavigationHistory(newHistory);
      setCurrentPage(previousPage);
    } else {
      setCurrentPage('home');
    }
  };



  if (currentPage === 'employers') {
    return <EmployersPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />;
  }

  if (currentPage === 'job-listings') {
    return <JobListingsPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} searchParams={currentData} />;
  }

  if (currentPage === 'companies') {
    return <CompaniesPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />;
  }

  if (currentPage === 'company-reviews') {
    return (
      <div className="min-h-screen bg-white">
        <CompanyReviewsPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
      </div>
    );
  }

  if (currentPage === 'employer-profile') {
    return (
      <div className="min-h-screen bg-white">
        <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
        <EmployerProfilePage 
          onNavigate={handleNavigation} 
          employerId={currentData?.employerId}
          employerData={currentData?.employerData}
        />
        <Footer onNavigate={handleNavigation} />
      </div>
    );
  }



  if (currentPage === 'job-hunting') {
    return <JobHuntingPage onNavigate={handleNavigation} />;
  }



  if (currentPage === 'interview-tips') {
    return <InterviewTipsPage onNavigate={handleNavigation} />;
  }

  if (currentPage === 'career-advice') {
    return <CareerAdvicePage onNavigate={handleNavigation} topic={currentTopic} />;
  }

  if (currentPage === 'career-insights-hub') {
    return <CareerInsightsHubPage onNavigate={handleNavigation} />;
  }

  if (currentPage === 'salary-report') {
    return <SalaryReportPage onNavigate={handleNavigation} />;
  }



  if (currentPage === 'job-detail') {
    return (
      <div className="min-h-screen bg-white">
        <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
        <JobDetailPage 
          onNavigate={handleNavigation} 
          jobTitle={currentData?.jobTitle || currentTopic}
          jobId={currentData?.jobId}
          companyName={currentData?.companyName}
          jobData={currentData?.jobData}
          user={user as any}
          onLogout={handleLogout}
        />
        <Footer onNavigate={handleNavigation} />
      </div>
    );
  }

  if (currentPage === 'skill-detail') {
    return <SkillDetailPage onNavigate={handleNavigation} skillName={currentTopic} />;
  }

  if (currentPage === 'career-resources') {
    return (
      <div className="min-h-screen bg-white">
        <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
        <CareerResources />
        <Footer onNavigate={handleNavigation} />
        <BackButton onClick={handleBackNavigation} />
      </div>
    );
  }

  if (currentPage === 'dashboard') {
    console.log('Dashboard - User type:', user?.type, 'Full user:', user);
    return (
      <>
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
      </>
    );
  }

  if (currentPage === 'search') {
    return (
      <div className="min-h-screen bg-white">
        <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
        <SearchEngine />
        <Footer onNavigate={handleNavigation} />
      </div>
    );
  }

  if (currentPage === 'company-profile') {
    return (
      <div className="min-h-screen bg-white">
        <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
        <CompanyProfilePage onNavigate={handleNavigation} companyName={currentData?.companyName} />
        <Footer onNavigate={handleNavigation} />
      </div>
    );
  }

  if (currentPage === 'company-view') {
    return (
      <CompanyViewPage 
        onNavigate={handleNavigation} 
        companyName={currentData?.companyName}
        user={user as any}
        onLogout={handleLogout}
      />
    );
  }

  if (currentPage === 'candidate-profile-view') {
    return (
      <CandidateProfileView 
        candidateId={currentData?.candidateId}
        onNavigate={handleNavigation}
        onBack={handleBackNavigation}
      />
    );
  }

  if (currentPage === 'job-application') {
    return (
      <JobApplicationPage 
        onNavigate={handleNavigation} 
        jobId={currentData?.jobId}
        jobData={currentData?.jobData}
      />
    );
  }

  if (currentPage === 'daily-jobs') {
    return (
      <div className="min-h-screen bg-white">
        <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
        <DailyJobsPage onNavigate={handleNavigation} />
        <Footer onNavigate={handleNavigation} />
      </div>
    );
  }



  if (currentPage === 'job-role') {
    return <JobRolePage onNavigate={handleNavigation} jobTitle={currentTopic} />;
  }

  if (currentPage === 'job-posting-selection') {
    return (
      <div className="min-h-screen bg-white">
        <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
        <JobPostingSelectionPage onNavigate={handleNavigation} user={user as any} />
      </div>
    );
  }

  if (currentPage === 'job-parsing') {
    return (
      <div className="min-h-screen bg-white">
        <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
        <JobParsingPage onNavigate={handleNavigation} user={user as any} />
      </div>
    );
  }

  if (currentPage === 'job-posting') {
    return (
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
    );
  }

  if (currentPage === 'candidate-search') {
    return <CandidateSearchPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />;
  }

  if (currentPage === 'hire-talent') {
    return <HireTalentPage onNavigate={handleNavigation} />;
  }

  if (currentPage === 'job-management') {
    return <JobManagementPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />;
  }

  if (currentPage === 'candidate-response-detail') {
    return <CandidateResponseDetailPage onNavigate={handleNavigation} applicationId={currentData?.application} />;
  }

  if (currentPage === 'candidate-review') {
    return <CandidateReviewPage onNavigate={handleNavigation} jobId={currentData?.jobId} />;
  }

  if (currentPage === 'recruiter-actions') {
    return <RecruiterActionsPage onNavigate={handleNavigation} />;
  }

  if (currentPage === 'search-appearances') {
    return <SearchAppearancesPage onNavigate={handleNavigation} />;
  }

  if (currentPage === 'application-management') {
    return <ApplicationManagementPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />;
  }



  if (currentPage === 'resume-editor') {
    return <ResumeEditorPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} template={currentTopic} />;
  }

  if (currentPage.startsWith('resume-view/')) {
    const template = currentPage.split('/')[1];
    return <ResumeViewerPage template={template} />;
  }



  if (currentPage === 'ai-resume-builder') {
    console.log('Rendering AI Resume Builder page');
    return <AIResumeBuilderPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />;
  }

  if (currentPage === 'resume-templates') {
    return <ResumeTemplatesPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />;
  }

  if (currentPage === 'resume-ready') {
    return <ResumeReadyPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />;
  }

















  if (currentPage === 'settings') {
    if (!user) {
      // Not logged in, redirect to role selection page
      setCurrentPage('role-selection');
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
      setCurrentPage('role-selection');
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
      setCurrentPage('role-selection');
      return null;
    }
    return <MyApplicationsPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />;
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
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
        <InterviewScheduling />
        <Footer onNavigate={handleNavigation} />
        <MobileNavigation onNavigate={handleNavigation} currentPage={currentPage} />
      </div>
    );
  }

  if (currentPage === 'login') {
    return <LoginPage onNavigate={handleNavigation} onLogin={handleLogin} />;
  }

  if (currentPage === 'employer-login') {
    return <EmployerLoginPage onNavigate={handleNavigation} onLogin={handleLogin} onShowNotification={(notif) => setNotification({...notif, isVisible: true})} />;
  }

  if (currentPage === 'candidate-register') {
    return <CandidateRegisterPage onNavigate={handleNavigation} onLogin={handleLogin} />;
  }

  if (currentPage === 'role-selection') {
    return <RoleSelectionPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />;
  }

  if (currentPage === 'employer-register') {
    return <EmployerRegisterPage onNavigate={handleNavigation} onLogin={handleLogin} />;
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
      <MobileNavigation onNavigate={handleNavigation} currentPage={currentPage} />
      {/* <PWAInstallButton /> */}
      
      {/* Modals */}
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
      </div>
    </>
  );
}

export default App;