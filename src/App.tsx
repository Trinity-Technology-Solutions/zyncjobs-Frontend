import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams, useSearchParams } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import GlobalAlert from './components/GlobalAlert';
import NewHero from './components/NewHero';
import JobCategories from './components/JobCategories';
import LatestJobs from './components/LatestJobs';
import HowItWorks from './components/HowItWorks';
import TalentedPeople from './components/TalentedPeople';
import CallToAction from './components/CallToAction';
import OfflineIndicator from './components/OfflineIndicator';
import Notification from './components/Notification';
import ChatWidget from './components/ChatWidget';
import JobAlertsManager from './components/JobAlertsManager';
import AuthGuard from './components/AuthGuard';
import TokenHandler from './components/TokenHandler';
import ErrorBoundary from './components/ErrorBoundary';
import CookieConsentBanner from './components/CookieConsentBanner';
import SEOHead from './components/SEOHead';
import localStorageMigration from './services/localStorageMigration';
import { initializeEmployerIdCounter } from './utils/employerIdUtils';
import { accountAPI } from './api/account';
import { tokenStorage } from './utils/tokenStorage';
import { useAnalytics } from './hooks/useAnalytics';
import './utils/extensionErrorHandler'; // Initialize extension error handling
import './utils/mobileDebugger'; // Initialize mobile debugging
// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const LoginModal = lazy(() => import('./components/LoginModal'));
const RegisterModal = lazy(() => import('./components/RegisterModal'));
const EmployerLoginPage = lazy(() => import('./pages/EmployerLoginPage'));
const RoleSelectionModal = lazy(() => import('./components/RoleSelectionModal'));
const RoleSelectionPage = lazy(() => import('./pages/RoleSelectionPage'));
const CandidateRegisterPage = lazy(() => import('./pages/CandidateRegisterPage'));
const EmployerRegisterPage = lazy(() => import('./pages/EmployerRegisterPage'));
const EmployerCompleteProfilePage = lazy(() => import('./pages/EmployerCompleteProfilePage'));
const EmployersPage = lazy(() => import('./pages/EmployersPage'));

const JobListingsPage = lazy(() => import('./pages/JobListingsPage'));
const JobDetailPage = lazy(() => import('./pages/JobDetailPage'));
const CompaniesPage = lazy(() => import('./pages/CompaniesPage'));
const CompanyDetailsPage = lazy(() => import('./pages/CompanyDetailsPage'));

const InterviewTipsPage = lazy(() => import('./pages/InterviewTipsPage'));
const CareerCoachPage = lazy(() => import('./pages/CareerCoachPage'));
const CandidateRankingPage = lazy(() => import('./pages/CandidateRankingPage'));
const AIRecruiterAssistant = lazy(() => import('./pages/AIRecruiterAssistant'));
const CandidateSearchPage = lazy(() => import('./pages/CandidateSearchPage'));
const JobPostingPage = lazy(() => import('./pages/JobPostingPage'));
const JobPostingSelectionPage = lazy(() => import('./pages/JobPostingSelectionPage'));
const JobParsingPage = lazy(() => import('./pages/JobParsingPage'));
const CandidateDashboardPage = lazy(() => import('./pages/CandidateDashboardPage'));
const CandidateMessagesPage = lazy(() => import('./pages/CandidateMessagesPage'));
const EmployerDashboardPage = lazy(() => import('./pages/EmployerDashboardPage'));
const JobApplicationPage = lazy(() => import('./pages/JobApplicationPage'));
const JobManagementPage = lazy(() => import('./pages/JobManagementPage'));
const CandidateReviewPage = lazy(() => import('./pages/CandidateReviewPage'));
const RecruiterActionsPage = lazy(() => import('./pages/RecruiterActionsPage'));
const SearchAppearancesPage = lazy(() => import('./pages/SearchAppearancesPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const MyJobsPage = lazy(() => import('./pages/MyJobsPage'));
const JobRefreshManagementPage = lazy(() => import('./pages/JobRefreshManagementPage'));
const MyApplicationsPage = lazy(() => import('./pages/MyApplicationsPage'));
const ResumeParserPage = lazy(() => import('./pages/ResumeParserPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const ApplicationManagementPage = lazy(() => import('./pages/ApplicationManagementPage'));
const MeetingTest = lazy(() => import('./components/MeetingTest'));
const SkillAssessmentPage = lazy(() => import('./pages/SkillAssessmentPage'));
const AssessmentReviewPage = lazy(() => import('./pages/AssessmentReviewPage'));
const InterviewScheduling = lazy(() => import('./components/InterviewScheduling'));
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'));
const CandidateInterviewsPage = lazy(() => import('./pages/CandidateInterviewsPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const WhyZyncJobsPage = lazy(() => import('./pages/WhyZyncJobsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const HelpCenterPage = lazy(() => import('./pages/HelpCenterPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const AccessibilityPage = lazy(() => import('./pages/AccessibilityPage'));
const ResumeHelpPage = lazy(() => import('./pages/ResumeHelpPage'));
const ResumeBuilderPage = lazy(() => import('./pages/ResumeBuilderPage'));
const ResumeStudioPage = lazy(() => import('./pages/ResumeStudioPage'));
const ResumeScorePage = lazy(() => import('./pages/ResumeScorePage'));
const SkillGapAnalysisPage = lazy(() => import('./pages/SkillGapAnalysisPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminAcceptInvitePage = lazy(() => import('./pages/admin/AdminAcceptInvitePage'));
const RecommendedJobs = lazy(() => import('./components/RecommendedJobs'));
const JobRecommendationsPage = lazy(() => import('./pages/JobRecommendationsPage'));
const CareerRoadmapPage = lazy(() => import('./pages/CareerRoadmapPage'));
const SalaryInsightsPage = lazy(() => import('./pages/SalaryInsightsPage'));
const ProfileVisibilityToggle = lazy(() => import('./components/ProfileVisibilityToggle'));
const PrivacySettingsPage = lazy(() => import('./pages/PrivacySettingsPage'));
const TeamAcceptPage = lazy(() => import('./pages/TeamAcceptPage'));
const CandidateProfileView = lazy(() => import('./pages/CandidateProfileView'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Reads candidateId from live URL search params so it's always fresh
const CandidateProfileViewWrapper: React.FC<{
  onNavigate: (page: string, params?: any) => void;
  navigate: (path: string) => void;
}> = ({ onNavigate, navigate }) => {
  const [searchParams] = useSearchParams();
  const candidateId = searchParams.get('id') || sessionStorage.getItem('viewCandidateId') || '';
  const handleBack = () => {
    const src = sessionStorage.getItem('profileViewSource') || 'application-management';
    sessionStorage.removeItem('profileViewSource');
    navigate(src === 'candidate-search' ? '/candidate-search' : '/application-management');
  };
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CandidateProfileView candidateId={candidateId} onNavigate={onNavigate} onBack={handleBack} />
    </Suspense>
  );
};

type UserType = { name: string; type: 'candidate' | 'employer' | 'admin' | 'super_admin'; email?: string };

// Shared layout wrapper for pages that need Header + Footer
const WithLayout: React.FC<{
  user: UserType | null;
  onNavigate: (page: string, data?: any) => void;
  onLogout: () => void;
  children: React.ReactNode;
}> = ({ user, onNavigate, onLogout, children }) => (
  <div className="min-h-screen bg-white flex flex-col">
    <Header onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
    <div className="flex-1">{children}</div>
    <Footer onNavigate={onNavigate} user={user as any} />
  </div>
);

const AssessmentReviewPageWrapper: React.FC<{
  onNavigate: (page: string, data?: any) => void;
  user: any;
}> = ({ onNavigate, user }) => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  return <AssessmentReviewPage onNavigate={onNavigate} user={user} assessmentId={assessmentId || ''} />;
};

function MaintenancePage({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center px-6">
        <div className="text-6xl mb-6">??</div>
        <h1 className="text-3xl font-bold text-white mb-3">Under Maintenance</h1>
        <p className="text-gray-400 mb-6">We're making some improvements. Please check back soon.</p>
        <button onClick={onRetry} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
          Try Again
        </button>
      </div>
    </div>
  );
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const analytics = useAnalytics(); // Initialize analytics
  const [maintenance, setMaintenance] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showRoleSelectionModal, setShowRoleSelectionModal] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    isVisible: boolean;
  }>({ type: 'info', message: '', isVisible: false });

  // ALL hooks must be declared before any early returns
  const closeModals = useCallback(() => {
    setShowLoginModal(false);
    setShowRegisterModal(false);
    setShowRoleSelectionModal(false);
  }, []);

  const handleNavigation = useCallback((page: string, params?: any) => {
    const currentPath = window.location.pathname;
    if (page === 'home') { if (currentPath !== '/') navigate('/'); return; }
    if (page === 'job-listings' && params?.tab) { navigate(`/job-listings?tab=${params.tab}`); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (page === 'job-listings') {
      const qp = new URLSearchParams();
      if (params?.searchTerm) qp.set('q', params.searchTerm);
      if (params?.location) qp.set('location', params.location);
      if (params?.category) qp.set('category', params.category);
      const qs = qp.toString();
      navigate(`/job-listings${qs ? `?${qs}` : ''}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (page === 'job-posting' && params?.parsedData) {
      navigate('/job-posting', { state: { mode: params.mode || 'parse', parsedData: params.parsedData } });
      return;
    }
    if (page === 'assessment-review' && params?.assessmentId) { navigate(`/assessment-review/${params.assessmentId}`); return; }
    if (page === 'candidate-messages') { navigate('/candidate-messages'); return; }
    if (page === 'candidate-profile-view') {
      const cid = params?.candidateId || sessionStorage.getItem('viewCandidateId') || '';
      navigate(`/candidate-profile-view${cid ? `?id=${encodeURIComponent(cid)}` : ''}`);
      return;
    }
    if (page === 'job-detail' && params?.jobId) { navigate(`/job-detail?id=${params.jobId}`); return; }
    if (page.startsWith('job-detail/')) { const id = page.replace('job-detail/', ''); navigate(`/job-detail?id=${id}`); return; }
    if (page === 'privacy-settings') { navigate('/privacy-settings'); return; }
    if (page === 'login') { navigate('/login'); return; }
    if (page === 'dashboard') { navigate('/dashboard'); return; }
    if (page === 'my-applications') { navigate('/my-applications'); return; }
    const target = `/${page}`;
    if (currentPath !== target) { navigate(target); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ type, message, isVisible: true });
  }, []);

  const handleLogout = useCallback(() => {
    // Get user type from multiple sources to ensure we have it
    let userType = localStorage.getItem('lastUserType') || user?.type;
    
    // Fallback: try to get from localStorage user object if lastUserType is not available
    if (!userType) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        userType = storedUser.userType || storedUser.role || storedUser.type;
      } catch {
        // ignore parsing errors
      }
    }
    
    // Fallback: try to get from token payload
    if (!userType) {
      try {
        const token = tokenStorage.getAccess();
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userType = payload.userType || payload.role;
        }
      } catch {
        // ignore token parsing errors
      }
    }
    
    console.log('🚪 Logout - User type detected:', userType);
    
    // Clear user state immediately
    setUser(null);
    
    // Clear all storage
    tokenStorage.clear();
    sessionStorage.clear();
    localStorage.removeItem('user');
    localStorage.removeItem('lastUserType');
    
    // Small delay to ensure state is cleared before navigation
    setTimeout(() => {
      // Navigate based on user type
      if (userType === 'employer') {
        console.log('🚪 Redirecting employer to /employer-login');
        window.location.href = '/employer-login'; // Force full page navigation
      } else if (userType === 'admin' || userType === 'super_admin') {
        console.log('🚪 Redirecting admin to /admin/login');
        window.location.href = '/admin/login'; // Force full page navigation
      } else {
        // Candidate or unknown user type
        console.log('🚪 Redirecting candidate to /login');
        window.location.href = '/login'; // Force full page navigation
      }
    }, 50); // Small delay to ensure state update
  }, [navigate, user?.type]);

  const handleLogin = useCallback((userData: UserType & { id?: string; _id?: string; role?: string; userType?: string }) => {
    setUser(userData);
    closeModals();
    
    // Store user type separately for reliable logout redirection
    const userType = userData.type || userData.userType || userData.role || 'candidate';
    localStorage.setItem('lastUserType', userType);
    
    // Persist user to localStorage for fast restore on refresh
    localStorage.setItem('user', JSON.stringify({
      ...userData,
      userType: userData.type,
      role: userData.type,
    }));
    const token = tokenStorage.getAccess();
    if (token && (userData.type === 'candidate' || userData.type === 'employer')) {
      localStorageMigration.setToken(token);
      setTimeout(() => localStorageMigration.runFullMigration().catch(console.error), 1000);
    }
  }, [closeModals]);

  const handleRoleSelection = useCallback((role: 'candidate' | 'employer') => {
    closeModals();
    navigate(role === 'candidate' ? '/candidate-register' : '/employer-register');
  }, [closeModals, navigate]);

  useEffect(() => {
    initializeEmployerIdCounter();
    const handleForceLogout = () => {
      // Get user type from multiple sources to ensure we have it
      let userType = localStorage.getItem('lastUserType') || user?.type;
      
      // Fallback: try to get from localStorage user object if lastUserType is not available
      if (!userType) {
        try {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          userType = storedUser.userType || storedUser.role || storedUser.type;
        } catch {
          // ignore parsing errors
        }
      }
      
      // Fallback: try to get from token payload
      if (!userType) {
        try {
          const token = tokenStorage.getAccess();
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userType = payload.userType || payload.role;
          }
        } catch {
          // ignore token parsing errors
        }
      }
      
      console.log('🚪 Force logout - User type detected:', userType);
      
      // Clear user state immediately
      setUser(null);
      
      // Clear all storage
      tokenStorage.clear();
      sessionStorage.clear();
      localStorage.removeItem('lastUserType');
      
      // Small delay to ensure state is cleared before navigation
      setTimeout(() => {
        // Navigate based on user type
        if (userType === 'employer') {
          console.log('🚪 Force redirecting employer to /employer-login');
          window.location.href = '/employer-login'; // Force full page navigation
        } else if (userType === 'admin' || userType === 'super_admin') {
          console.log('🚪 Force redirecting admin to /admin/login');
          window.location.href = '/admin/login'; // Force full page navigation
        } else {
          // Candidate or unknown user type
          console.log('🚪 Force redirecting candidate to /login');
          window.location.href = '/login'; // Force full page navigation
        }
      }, 50); // Small delay to ensure state update
    };
    window.addEventListener('zync:logout', handleForceLogout);

    const restoreSession = async () => {
      // Clean up any base64 images stored in localStorage (they cause quota errors)
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          let cleaned = false;
          if (parsed.profilePhoto?.startsWith('data:')) { parsed.profilePhoto = ''; cleaned = true; }
          if (parsed.coverPhoto?.startsWith('data:')) { parsed.coverPhoto = ''; cleaned = true; }
          if (cleaned) localStorage.setItem('user', JSON.stringify(parsed));
        }
      } catch { /* silent */ }
      // Fast restore: use localStorage user data immediately to prevent wrong dashboard flash
      const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
      if (storedUser.email && (storedUser.userType || storedUser.role)) {
        const rawType = storedUser.userType || storedUser.role || 'candidate';
        let fastType: UserType['type'] = 'candidate';
        if (rawType === 'employer') fastType = 'employer';
        else if (rawType === 'admin') fastType = 'admin';
        else if (rawType === 'super_admin') fastType = 'super_admin';
        setUser({ name: storedUser.name || storedUser.email?.split('@')[0] || 'User', type: fastType, email: storedUser.email });
      }

      let token = tokenStorage.getAccess();

      // No access token in sessionStorage (e.g. after page refresh)
      // Try to silently restore using refreshToken from localStorage
      if (!token) {
        const refreshToken = tokenStorage.getRefresh();
        if (!refreshToken) { setUserLoading(false); return; }
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/users/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          if (res.ok) {
            const data = await res.json();
            tokenStorage.setAccess(data.accessToken);
            if (data.refreshToken) tokenStorage.setRefresh(data.refreshToken);
            token = data.accessToken;
            // If refresh response includes user role, restore immediately
            if (data.user?.role || data.user?.userType) {
              const rawType = data.user.role || data.user.userType || 'candidate';
              let userType: UserType['type'] = 'candidate';
              if (rawType === 'employer') userType = 'employer';
              else if (rawType === 'admin') userType = 'admin';
              else if (rawType === 'super_admin') userType = 'super_admin';
              // Store for getMe() to confirm, but set early to prevent wrong dashboard
              const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
              if (storedUser.email) {
                setUser({ name: storedUser.name || storedUser.email?.split('@')[0] || 'User', type: userType, email: storedUser.email });
              }
            }
          } else {
            // Refresh token expired/invalid — clear and stay logged out
            tokenStorage.clear();
            setUserLoading(false);
            return;
          }
        } catch {
          setUserLoading(false);
          return;
        }
      }

      // Now fetch user with valid token
      try {
        const userData = await accountAPI.getMe();
        if (!userData) {
          tokenStorage.clear();
          setUser(null);
        } else {
          let userType: UserType['type'] = 'candidate';
          const rawType = userData.userType || userData.role || '';
          if (rawType === 'employer') userType = 'employer';
          else if (rawType === 'admin') userType = 'admin';
          else if (rawType === 'super_admin') userType = 'super_admin';
          setUser({ name: userData.name || userData.fullName || userData.email?.split('@')[0] || 'User', type: userType, email: userData.email });
        }
      } catch {
        tokenStorage.clear();
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    };

    restoreSession();
    return () => window.removeEventListener('zync:logout', handleForceLogout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  useEffect(() => {
    const orig = window.fetch;
    window.fetch = async (...args) => {
      const res = await orig(...args);
      if (res.status === 503) {
        const clone = res.clone();
        try { const data = await clone.json(); if (data.maintenance) setMaintenance(true); } catch {}
      }
      return res;
    };
    return () => { window.fetch = orig; };
  }, []);

  // Early returns AFTER all hooks
  // Check if this is an admin invite activation - bypass all other logic
  if (location.pathname === '/admin/accept-invite') {
    console.log('🔑 Admin invite activation detected, bypassing user checks');
    return (
      <>
        <GlobalAlert />
        <SEOHead />
        <OfflineIndicator />
        <Suspense fallback={<LoadingFallback />}>
          <AdminAcceptInvitePage
            onNavigate={handleNavigation}
            onLogin={handleLogin}
          />
        </Suspense>
      </>
    );
  }
  
  // Always show loader for protected routes until session is fully restored
  if (userLoading) {
    const protectedPaths = ['/dashboard', '/settings', '/my-jobs', '/my-applications', '/employer-profile',
      '/job-posting', '/job-management', '/candidate-search', '/resume-builder', '/resume-studio',
      '/resume-score', '/resume-parser', '/skill-assessment', '/career-coach', '/career-roadmap',
      '/job-application', '/candidate-messages', '/interviews', '/alerts', '/privacy-settings',
      '/application-management', '/candidate-profile-view', '/candidate-ranking', '/ai-recruiter', '/skill-gap-analysis',
      '/recruiter-actions', '/search-appearances',
      '/job-parsing', '/job-posting-selection', '/candidate-review', '/job-matches', '/recommended-jobs',
      '/admin/dashboard', '/admin/login'];
    if (protectedPaths.some(p => location.pathname.startsWith(p))) {
      return <LoadingFallback />;
    }
  }

  if (maintenance && !location.pathname.startsWith('/admin')) {
    const handleRetry = async () => {
      try { const res = await fetch('/api/jobs?limit=1'); if (res.ok) setMaintenance(false); } catch {}
    };
    return <MaintenancePage onRetry={handleRetry} />;
  }

  // Handle OAuth callback
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('token')) {
    return <TokenHandler onLogin={handleLogin} onNavigate={handleNavigation} />;
  }

  const nav = { onNavigate: handleNavigation, user: user as any, onLogout: handleLogout, userLoading };

  return (
    <>
      <GlobalAlert />
      <SEOHead />
      <OfflineIndicator />
      <CookieConsentBanner onNavigate={handleNavigation} />
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification(n => ({ ...n, isVisible: false }))}
      />

      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* -- Public home -- */}
          <Route path="/" element={
            <div className="min-h-screen bg-white overflow-x-hidden">
              <Header {...nav} />
              <NewHero onNavigate={handleNavigation} user={user as any} />
              <LatestJobs onNavigate={handleNavigation} />
              <HowItWorks onNavigate={handleNavigation} />
              <JobCategories onNavigate={handleNavigation} />
              <TalentedPeople onNavigate={handleNavigation} />
              <CallToAction onNavigate={handleNavigation} />
              <Footer onNavigate={handleNavigation} user={user as any} />
              <ChatWidget />
            </div>
          } />

          {/* -- Auth -- */}
          <Route path="/login" element={
            (user && !userLoading)
              ? <Navigate to="/dashboard" replace />
              : <LoginPage onNavigate={handleNavigation} onLogin={handleLogin} />
          } />
          <Route path="/employer-login" element={
            (user && !userLoading)
              ? <Navigate to="/dashboard" replace />
              : <EmployerLoginPage onNavigate={handleNavigation} onLogin={handleLogin}
                  onShowNotification={n => showNotification(n.message, n.type)} />
          } />
          <Route path="/candidate-register" element={<CandidateRegisterPage onNavigate={handleNavigation} />} />
          <Route path="/employer-register" element={<EmployerRegisterPage onNavigate={handleNavigation} onLogin={handleLogin} />} />
          <Route path="/employer-complete-profile" element={
            <AuthGuard user={user} userLoading={userLoading} allowedRoles={['employer']}>
              <EmployerCompleteProfilePage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
            </AuthGuard>
          } />
          <Route path="/role-selection" element={<RoleSelectionPage {...nav} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage onNavigate={handleNavigation} />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage onNavigate={handleNavigation} />} />

          {/* -- Public browsing -- */}
          <Route path="/job-listings" element={<JobListingsPage {...nav} searchParams={undefined} />} />
          <Route path="/job-detail" element={<WithLayout {...nav}><JobDetailPage onNavigate={handleNavigation} user={user as any} /></WithLayout>} />
          <Route path="/jobs/:slug" element={<WithLayout {...nav}><JobDetailPage onNavigate={handleNavigation} user={user as any} /></WithLayout>} />
          <Route path="/companies" element={<CompaniesPage {...nav} />} />
          <Route path="/company-details" element={<CompanyDetailsPage {...nav} />} />
          <Route path="/company-jobs" element={<Navigate to="/companies" replace />} />
          <Route path="/company-profile" element={<Navigate to="/dashboard" replace />} />
          <Route path="/company-view" element={<Navigate to="/companies" replace />} />
          <Route path="/employers" element={<EmployersPage {...nav} />} />

          <Route path="/job-hunting" element={<Navigate to="/job-listings" replace />} />
          <Route path="/job-role" element={<Navigate to="/job-listings" replace />} />
          <Route path="/interview-tips" element={<InterviewTipsPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />} />
          <Route path="/skill-detail" element={<Navigate to="/job-listings" replace />} />
          <Route path="/search" element={<Navigate to="/job-listings" replace />} />
          <Route path="/features" element={<FeaturesPage {...nav} />} />
          <Route path="/about" element={<AboutPage {...nav} />} />
          <Route path="/why-zyncjobs" element={<WhyZyncJobsPage {...nav} />} />
          <Route path="/contact" element={<ContactPage {...nav} />} />
          <Route path="/help" element={<HelpCenterPage {...nav} />} />
          <Route path="/terms" element={<TermsPage {...nav} />} />
          <Route path="/privacy" element={<PrivacyPage {...nav} />} />
          <Route path="/privacy-settings" element={
            <AuthGuard user={user}>
              <PrivacySettingsPage {...nav} />
            </AuthGuard>
          } />
          <Route path="/accessibility" element={<AccessibilityPage {...nav} />} />
          <Route path="/resume-help" element={<ResumeHelpPage {...nav} />} />

          {/* -- Protected: any logged-in user -- */}
          <Route path="/dashboard" element={
            <AuthGuard user={user} userLoading={userLoading}>
              <Notification {...notification} onClose={() => setNotification(n => ({ ...n, isVisible: false }))} />
              {userLoading ? null : user?.type === 'admin' || user?.type === 'super_admin' ? (
                <Navigate to="/admin/dashboard" replace />
              ) : user?.type === 'employer' ? (
                <>
                  <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
                  <EmployerDashboardPage onNavigate={handleNavigation} onLogout={handleLogout} />
                </>
              ) : (
                <WithLayout {...nav}><CandidateDashboardPage onNavigate={handleNavigation} /></WithLayout>
              )}
            </AuthGuard>
          } />

          <Route path="/candidate-messages" element={
            <AuthGuard user={user} userLoading={userLoading}>
              <div style={{display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden'}}>
                <div style={{flexShrink:0}}>
                  <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
                </div>
                <div style={{flex:1, minHeight:0, overflow:'hidden', display:'flex'}}>
                  <CandidateMessagesPage onNavigate={handleNavigation} />
                </div>
              </div>
            </AuthGuard>
          } />

          <Route path="/settings" element={
            <AuthGuard user={user} userLoading={userLoading}>
              <WithLayout {...nav}><SettingsPage {...nav} /></WithLayout>
            </AuthGuard>
          } />

          <Route path="/my-jobs" element={
            <AuthGuard user={user} userLoading={userLoading}>
              <>
                <Header {...nav} />
                <MyJobsPage {...nav} />
              </>
            </AuthGuard>
          } />

          <Route path="/job-refresh-management" element={
            <AuthGuard user={user} userLoading={userLoading} allowedRoles={['employer']}>
              <JobRefreshManagementPage {...nav} />
            </AuthGuard>
          } />

          <Route path="/my-applications" element={
            <AuthGuard user={user} userLoading={userLoading}>
              <MyApplicationsPage {...nav} />
            </AuthGuard>
          } />

          <Route path="/alerts" element={
            <AuthGuard user={user}>
              <>
                <Header {...nav} />
                <div className="min-h-screen bg-gray-50 py-8">
                  <div className="max-w-4xl mx-auto px-4">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Job Alerts</h1>
                    <JobAlertsManager user={user as any} />
                  </div>
                </div>
                <Footer onNavigate={handleNavigation} user={user as any} />
              </>
            </AuthGuard>
          } />

          <Route path="/interviews" element={
            <AuthGuard user={user} userLoading={userLoading}>
              {userLoading ? null : user?.type === 'candidate' ? (
                <CandidateInterviewsPage {...nav} />
              ) : (
                <WithLayout {...nav}><InterviewScheduling /></WithLayout>
              )}
            </AuthGuard>
          } />

          <Route path="/career-coach" element={
            <AuthGuard user={user} allowedRoles={['candidate']}>
              <CareerCoachPage {...nav} />
            </AuthGuard>
          } />

          <Route path="/career-roadmap" element={
            <AuthGuard user={user} allowedRoles={['candidate']}>
              <CareerRoadmapPage {...nav} />
            </AuthGuard>
          } />

          <Route path="/salary-insights" element={
            <WithLayout {...nav}>
              <div className="max-w-4xl mx-auto px-4 py-8">
                <SalaryInsightsPage onNavigate={handleNavigation} />
              </div>
            </WithLayout>
          } />

          <Route path="/profile-visibility" element={
            <AuthGuard user={user} allowedRoles={['candidate']}>
              <WithLayout {...nav}>
                <div className="max-w-2xl mx-auto px-4 py-8">
                  <ProfileVisibilityToggle
                    userEmail={user?.email || ''}
                    onSave={() => {}}
                  />
                </div>
              </WithLayout>
            </AuthGuard>
          } />

          <Route path="/candidate-ranking" element={
            <CandidateRankingPage onNavigate={nav.onNavigate} user={user} />
          } />

          <Route path="/ai-recruiter" element={
            <AIRecruiterAssistant onNavigate={nav.onNavigate} user={user} />
          } />

          <Route path="/skill-gap-analysis" element={
            <AuthGuard user={user} allowedRoles={['candidate']}>
              <SkillGapAnalysisPage {...nav} />
            </AuthGuard>
          } />

          <Route path="/skill-assessment" element={
            <AuthGuard user={user} allowedRoles={['candidate']}>
              <SkillAssessmentPage {...nav} />
            </AuthGuard>
          } />

          <Route path="/assessment-review/:assessmentId" element={
            <AuthGuard user={user} allowedRoles={['candidate']}>
              <AssessmentReviewPageWrapper onNavigate={handleNavigation} user={user as any} />
            </AuthGuard>
          } />

          <Route path="/resume-builder" element={
            <AuthGuard user={user} userLoading={userLoading}>
              <ResumeBuilderPage {...nav} />
            </AuthGuard>
          } />

          <Route path="/resume-studio" element={
            <AuthGuard user={user} allowedRoles={['candidate']}>
              <ResumeStudioPage {...nav} />
            </AuthGuard>
          } />

          <Route path="/resume-score" element={
            <AuthGuard user={user} allowedRoles={['candidate']}>
              <ResumeScorePage {...nav} />
            </AuthGuard>
          } />

          <Route path="/resume-parser" element={
            <AuthGuard user={user} allowedRoles={['candidate']}>
              <ResumeParserPage {...nav} />
            </AuthGuard>
          } />

          <Route path="/resume-upload" element={<Navigate to="/resume-builder" replace />} />

          <Route path="/job-application" element={
            <AuthGuard user={user} userLoading={userLoading}>
              <JobApplicationPage onNavigate={handleNavigation} />
            </AuthGuard>
          } />


          <Route path="/candidate-profile-view" element={
            <AuthGuard user={user} userLoading={userLoading} allowedRoles={['employer', 'admin']}>
              <CandidateProfileViewWrapper onNavigate={handleNavigation} navigate={navigate} />
            </AuthGuard>
          } />

          {/* -- Protected: employer only -- */}
          <Route path="/job-posting" element={
            <AuthGuard user={user} userLoading={userLoading} allowedRoles={['employer', 'admin']}><WithLayout {...nav}><JobPostingPage {...nav} mode={location.state?.mode || (()=>{try{const s=JSON.parse(sessionStorage.getItem('parsedJobData')||'{}');if(s?.parsedData){sessionStorage.removeItem('parsedJobData');return s.mode;}return undefined;}catch{return undefined;}})()} parsedData={location.state?.parsedData || (()=>{try{const s=JSON.parse(sessionStorage.getItem('parsedJobData')||'{}');return s?.parsedData||undefined;}catch{return undefined;}})()} /></WithLayout></AuthGuard>
          } />

          <Route path="/job-posting-selection" element={
            <AuthGuard user={user} userLoading={userLoading} allowedRoles={['employer', 'admin']}>
              <WithLayout {...nav}>
                <JobPostingSelectionPage onNavigate={handleNavigation} user={user as any} />
              </WithLayout>
            </AuthGuard>
          } />

          <Route path="/job-parsing" element={
            <AuthGuard user={user} userLoading={userLoading} allowedRoles={['employer', 'admin']}>
              <WithLayout {...nav}>
                <JobParsingPage onNavigate={handleNavigation} user={user as any} />
              </WithLayout>
            </AuthGuard>
          } />

          <Route path="/job-management" element={
            <AuthGuard user={user} userLoading={userLoading} allowedRoles={['employer', 'admin']}>
              <JobManagementPage {...nav} />
            </AuthGuard>
          } />

          <Route path="/candidate-search" element={
            <AuthGuard user={user} userLoading={userLoading} allowedRoles={['employer', 'admin']}>
              <CandidateSearchPage {...nav} />
            </AuthGuard>
          } />

          <Route path="/candidate-review" element={
            <AuthGuard user={user} userLoading={userLoading} allowedRoles={['employer', 'admin']}>
              <CandidateReviewPage onNavigate={handleNavigation} jobId="" />
            </AuthGuard>
          } />

          <Route path="/recruiter-actions" element={
            <AuthGuard user={user}>
              <RecruiterActionsPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
            </AuthGuard>
          } />

          <Route path="/search-appearances" element={
            <AuthGuard user={user}>
              <SearchAppearancesPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
            </AuthGuard>
          } />

          <Route path="/application-management" element={
            <AuthGuard user={user} userLoading={userLoading} allowedRoles={['employer', 'admin']}>
              <ApplicationManagementPage {...nav} />
            </AuthGuard>
          } />

          <Route path="/employer-profile" element={<Navigate to="/dashboard" replace />} />

          {/* -- Admin Accept Invite (Public Route) -- */}
          <Route path="/admin/accept-invite" element={
            (() => {
              console.log('🔑 Admin accept invite route accessed');
              return (
                <AdminAcceptInvitePage
                  onNavigate={handleNavigation}
                  onLogin={handleLogin}
                />
              );
            })()
          } />

          {/* -- Admin Routes -- */}
          <Route path="/admin/login" element={
            user && (user.type === 'admin' || user.type === 'super_admin')
              ? <Navigate to="/admin/dashboard" replace />
              : <AdminLoginPage onLogin={u => {
                  handleLogin(u);
                  handleNavigation('admin/dashboard');
                }} onNavigate={handleNavigation} />
          } />

          <Route path="/admin/dashboard" element={
            <AuthGuard user={user} userLoading={userLoading} allowedRoles={['admin', 'super_admin']}>
              <AdminDashboardPage
                user={{ name: user?.name || 'Admin', email: user?.email }}
                onNavigate={handleNavigation}
                onLogout={handleLogout}
              />
            </AuthGuard>
          } />

          {/* -- Misc -- */}
          <Route path="/meeting-test" element={
            <WithLayout {...nav}><MeetingTest /></WithLayout>
          } />

          <Route path="/recommended-jobs" element={
            <AuthGuard user={user} allowedRoles={['candidate']}>
              <WithLayout {...nav}>
                <div className="max-w-4xl mx-auto px-4 py-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-6">Recommended Jobs for You</h1>
                  <RecommendedJobs
                    resumeSkills={[]}
                    location={user?.email ? '' : ''}
                    user={user as any}
                    onNavigate={handleNavigation}
                  />
                </div>
              </WithLayout>
            </AuthGuard>
          } />

          <Route path="/job-matches" element={
            <AuthGuard user={user} allowedRoles={['candidate']}>
              <JobRecommendationsPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
            </AuthGuard>
          } />

          {/* -- Team invite magic link -- */}
          <Route path="/team/accept" element={
            <TeamAcceptPage
              onNavigate={handleNavigation}
              onLogin={(userData, token) => {
                tokenStorage.setAccess(token);
                const userType = userData.role === 'employer' ? 'employer' : 'candidate';
                handleLogin({ ...userData, type: userType as any });
              }}
            />
          } />

          {/* -- Redirects for old paths -- */}
          <Route path="/employer-dashboard" element={<Navigate to="/dashboard" replace />} />

          {/* -- 404 -- */}
          <Route path="*" element={
            <WithLayout {...nav}>
              <div className="min-h-[80vh] flex items-center justify-center px-4">
                <div className="text-center max-w-lg">
                  <div className="relative mb-8">
                    <div className="text-[120px] font-black text-gray-100 leading-none select-none">404</div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white px-4">
                        <div className="text-5xl mb-2">??</div>
                      </div>
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-3">Page Not Found</h1>
                  <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <button
                      onClick={() => navigate('/')}
                      className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      ?? Go Home
                    </button>
                    <button
                      onClick={() => navigate('/job-listings')}
                      className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                      ?? Browse Jobs
                    </button>
                    <button
                      onClick={() => window.history.back()}
                      className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                      ? Go Back
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-8">If you think this is a mistake, <button onClick={() => navigate('/contact')} className="text-blue-500 hover:underline">contact support</button></p>
                </div>
              </div>
            </WithLayout>
          } />
        </Routes>
      </Suspense>

      {/* Global modals */}
      <Suspense fallback={null}>
        <LoginModal isOpen={showLoginModal} onClose={closeModals} onNavigate={handleNavigation} onLogin={handleLogin} />
        <RegisterModal isOpen={showRegisterModal} onClose={closeModals} onNavigate={handleNavigation} />
        <RoleSelectionModal isOpen={showRoleSelectionModal} onClose={closeModals} onSelectRole={handleRoleSelection} />
      </Suspense>
    </>
  );
}

export default App;


