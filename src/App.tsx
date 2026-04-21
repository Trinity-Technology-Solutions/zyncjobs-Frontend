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
import ChatWidget from './components/ChatWidget';
import Notification from './components/Notification';
import MobileNavigation from './components/MobileNavigation';
import JobAlertsManager from './components/JobAlertsManager';
import AuthGuard from './components/AuthGuard';
import TokenHandler from './components/TokenHandler';
import ErrorBoundary from './components/ErrorBoundary';
import CookieConsentBanner from './components/CookieConsentBanner';
import localStorageMigration from './services/localStorageMigration';
import { initializeEmployerIdCounter } from './utils/employerIdUtils';
import { accountAPI } from './api/account';
import { tokenStorage } from './utils/tokenStorage';
import { useAnalytics } from './hooks/useAnalytics';
// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const LoginModal = lazy(() => import('./components/LoginModal'));
const RegisterModal = lazy(() => import('./components/RegisterModal'));
const EmployerLoginPage = lazy(() => import('./pages/EmployerLoginPage'));
const EmployerLoginModal = lazy(() => import('./components/EmployerLoginModal'));
const RoleSelectionModal = lazy(() => import('./components/RoleSelectionModal'));
const RoleSelectionPage = lazy(() => import('./pages/RoleSelectionPage'));
const CandidateRegisterPage = lazy(() => import('./pages/CandidateRegisterPage'));
const EmployerRegisterPage = lazy(() => import('./pages/EmployerRegisterPage'));
const EmployerCompleteProfilePage = lazy(() => import('./pages/EmployerCompleteProfilePage'));
const EmployersPage = lazy(() => import('./pages/EmployersPage'));
const JobListingsPage = lazy(() => import('./pages/JobListingsPage'));
const CompanyJobsPage = lazy(() => import('./pages/CompanyJobsPage'));
const CompaniesPage = lazy(() => import('./pages/CompaniesPage'));
const CompanyDetailsPage = lazy(() => import('./pages/CompanyDetailsPage'));
const JobHuntingPage = lazy(() => import('./pages/JobHuntingPage'));

const InterviewTipsPage = lazy(() => import('./pages/InterviewTipsPage'));
const CareerCoachPage = lazy(() => import('./pages/CareerCoachPage'));
const CandidateRankingPage = lazy(() => import('./pages/CandidateRankingPage'));
const AIRecruiterAssistant = lazy(() => import('./pages/AIRecruiterAssistant'));
const CandidateSearchPage = lazy(() => import('./pages/CandidateSearchPage'));
const JobPostingPage = lazy(() => import('./pages/JobPostingPage'));
const JobPostingSelectionPage = lazy(() => import('./pages/JobPostingSelectionPage'));
const JobParsingPage = lazy(() => import('./pages/JobParsingPage'));
const JobDetailPage = lazy(() => import('./pages/JobDetailPage'));
const SkillDetailPage = lazy(() => import('./pages/SkillDetailPage'));
const CandidateDashboardPage = lazy(() => import('./pages/CandidateDashboardPage'));
const CandidateMessagesPage = lazy(() => import('./pages/CandidateMessagesPage'));
const EmployerDashboardPage = lazy(() => import('./pages/EmployerDashboardPage'));
const SearchEngine = lazy(() => import('./components/SearchEngine'));
const CompanyProfilePage = lazy(() => import('./pages/CompanyProfilePage'));
const CompanyViewPage = lazy(() => import('./pages/CompanyViewPage'));
const JobApplicationPage = lazy(() => import('./pages/JobApplicationPage'));
const JobRolePage = lazy(() => import('./pages/JobRolePage'));
const JobManagementPage = lazy(() => import('./pages/JobManagementPage'));
const CandidateReviewPage = lazy(() => import('./pages/CandidateReviewPage'));
const RecruiterActionsPage = lazy(() => import('./pages/RecruiterActionsPage'));
const SearchAppearancesPage = lazy(() => import('./pages/SearchAppearancesPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const MyJobsPage = lazy(() => import('./pages/MyJobsPage'));
const MyApplicationsPage = lazy(() => import('./pages/MyApplicationsPage'));
const ResumeParserPage = lazy(() => import('./pages/ResumeParserPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const ResumeUploadWithModeration = lazy(() => import('./components/ResumeUploadWithModeration'));
const ApplicationManagementPage = lazy(() => import('./pages/ApplicationManagementPage'));
const EmployerProfilePage = lazy(() => import('./pages/EmployerProfilePage'));
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
const CandidateProfileView = lazy(() => import('./pages/CandidateProfileView'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const RecommendedJobs = lazy(() => import('./components/RecommendedJobs'));
const JobRecommendationsPage = lazy(() => import('./pages/JobRecommendationsPage'));
const CareerRoadmapPage = lazy(() => import('./pages/CareerRoadmapPage'));
const SalaryInsightsPage = lazy(() => import('./pages/SalaryInsightsPage'));
const ProfileVisibilityToggle = lazy(() => import('./components/ProfileVisibilityToggle'));
const PrivacySettingsPage = lazy(() => import('./pages/PrivacySettingsPage'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

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

// Wrapper that reads ?id= reactively from URL for CandidateProfileView
const CandidateProfileViewWrapper: React.FC<{
  onNavigate: (page: string, data?: any) => void;
  onBack: () => void;
}> = ({ onNavigate, onBack }) => {
  const [searchParams] = useSearchParams();
  const candidateId = searchParams.get('id') || sessionStorage.getItem('viewCandidateId') || '';
  return <CandidateProfileView candidateId={candidateId} onNavigate={onNavigate} onBack={onBack} />;
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
  const [showEmployerLoginModal, setShowEmployerLoginModal] = useState(false);
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
    setShowEmployerLoginModal(false);
    setShowRoleSelectionModal(false);
  }, []);

  const handleNavigation = useCallback((page: string, params?: any) => {
    const currentPath = window.location.pathname;
    if (page === 'home') { if (currentPath !== '/') navigate('/'); return; }
    if (page.startsWith('job-detail/')) {
      const jobId = page.split('/')[1];
      const cached = (() => { try { return JSON.parse(localStorage.getItem('selectedJob') || '{}'); } catch { return {}; } })();
      const slug = cached?.slug && (cached?._id === jobId || cached?.id === jobId) ? cached.slug : null;
      const target = slug ? `/jobs/${slug}` : `/job-detail?id=${jobId}`;
      if (currentPath !== target.split('?')[0]) navigate(target);
      return;
    }
    if (page === 'job-listings' && params?.tab) { navigate(`/job-listings?tab=${params.tab}`); return; }
    if (page === 'job-listings') {
      const qp = new URLSearchParams();
      if (params?.searchTerm) qp.set('q', params.searchTerm);
      if (params?.location) qp.set('location', params.location);
      if (params?.category) qp.set('category', params.category);
      const qs = qp.toString();
      navigate(`/job-listings${qs ? `?${qs}` : ''}`);
      return;
    }
    if (page === 'job-detail') {
      const id = params?.jobId || params?.jobData?._id || params?.jobData?.id;
      const slug = params?.jobData?.slug || params?.slug;
      if (params?.jobData) localStorage.setItem('selectedJob', JSON.stringify(params.jobData));
      if (slug) { navigate(`/jobs/${slug}`); return; }
      navigate(id ? `/job-detail?id=${id}` : '/job-detail');
      return;
    }
    if (page === 'job-posting' && params?.parsedData) {
      navigate('/job-posting', { state: { mode: params.mode || 'parse', parsedData: params.parsedData } });
      return;
    }
    if (page === 'assessment-review' && params?.assessmentId) { navigate(`/assessment-review/${params.assessmentId}`); return; }
    if (page === 'candidate-profile-view') {
      const cid = params?.candidateId || '';
      if (cid) { sessionStorage.setItem('viewCandidateId', cid); navigate(`/candidate-profile-view?id=${encodeURIComponent(cid)}`); }
      else { const stored = sessionStorage.getItem('viewCandidateId') || ''; navigate(stored ? `/candidate-profile-view?id=${encodeURIComponent(stored)}` : '/candidate-profile-view'); }
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    if (page === 'candidate-messages') { navigate('/candidate-messages'); return; }
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
    setUser(null);
    tokenStorage.clear();
    sessionStorage.clear();
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  }, [navigate]);

  const handleLogin = useCallback((userData: UserType & { id?: string; _id?: string; role?: string; userType?: string }) => {
    setUser(userData);
    closeModals();
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
      setUser(null);
      tokenStorage.clear();
      sessionStorage.clear();
      navigate('/', { replace: true });
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
          const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/token/refresh`, {
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
  // Always show loader for protected routes until session is fully restored
  if (userLoading) {
    const protectedPaths = ['/dashboard', '/settings', '/my-jobs', '/my-applications', '/employer-profile',
      '/job-posting', '/job-management', '/candidate-search', '/resume-builder', '/resume-studio',
      '/resume-score', '/resume-parser', '/skill-assessment', '/career-coach', '/career-roadmap',
      '/job-application', '/candidate-messages', '/interviews', '/alerts', '/privacy-settings',
      '/application-management', '/candidate-ranking', '/ai-recruiter', '/skill-gap-analysis',
      '/candidate-profile-view', '/recruiter-actions', '/search-appearances', '/resume-upload',
      '/job-parsing', '/job-posting-selection', '/candidate-review', '/job-matches', '/recommended-jobs',
      '/admin'];
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
            <div className="min-h-screen bg-white">
              <Header {...nav} />
              <NewHero onNavigate={handleNavigation} user={user as any} />
              <LatestJobs onNavigate={handleNavigation} />
              <HowItWorks onNavigate={handleNavigation} />
              <JobCategories onNavigate={handleNavigation} />
              <TalentedPeople onNavigate={handleNavigation} />
              <CallToAction onNavigate={handleNavigation} />
              <Footer onNavigate={handleNavigation} user={user as any} />
              <ChatWidget />
              <MobileNavigation onNavigate={handleNavigation} currentPage="home" />
            </div>
          } />

          {/* -- Auth -- */}
          <Route path="/login" element={
            user
              ? <Navigate to="/dashboard" replace />
              : <LoginPage onNavigate={handleNavigation} onLogin={handleLogin} />
          } />
          <Route path="/employer-login" element={
            user
              ? <Navigate to="/dashboard" replace />
              : <EmployerLoginPage onNavigate={handleNavigation} onLogin={handleLogin}
                  onShowNotification={n => showNotification(n.message, n.type)} />
          } />
          <Route path="/candidate-register" element={<CandidateRegisterPage onNavigate={handleNavigation} />} />
          <Route path="/employer-register" element={<EmployerRegisterPage onNavigate={handleNavigation} onLogin={handleLogin} />} />
          <Route path="/employer-register-complete" element={<EmployerCompleteProfilePage onNavigate={handleNavigation} user={user as any} />} />
          <Route path="/role-selection" element={<RoleSelectionPage {...nav} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage onNavigate={handleNavigation} />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage onNavigate={handleNavigation} />} />

          {/* -- Public browsing -- */}
          <Route path="/job-listings" element={<JobListingsPage {...nav} searchParams={undefined} />} />
          <Route path="/job-detail" element={
            <WithLayout {...nav}>
              <JobDetailPage {...nav} jobTitle="" jobId={new URLSearchParams(location.search).get('id') || ''} />
            </WithLayout>
          } />
          {/* SEO-friendly job URL: /jobs/:slug */}
          <Route path="/jobs/:slug" element={
            <WithLayout {...nav}>
              <JobDetailPage {...nav} jobTitle="" jobId={''} />
            </WithLayout>
          } />
          <Route path="/companies" element={<CompaniesPage {...nav} />} />
          <Route path="/company-details" element={<CompanyDetailsPage {...nav} />} />
          <Route path="/company-jobs" element={<CompanyJobsPage {...nav} companyName="" />} />
          <Route path="/company-profile" element={
            <WithLayout {...nav}><CompanyProfilePage onNavigate={handleNavigation} /></WithLayout>
          } />
          <Route path="/company-view" element={<CompanyViewPage {...nav} companyName="" />} />
          <Route path="/employers" element={<EmployersPage {...nav} />} />
          <Route path="/job-hunting" element={<JobHuntingPage onNavigate={handleNavigation} />} />
          <Route path="/job-role" element={<JobRolePage onNavigate={handleNavigation} jobTitle="" />} />
          <Route path="/interview-tips" element={<InterviewTipsPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />} />
          <Route path="/skill-detail" element={<SkillDetailPage onNavigate={handleNavigation} skillName="" />} />
          <Route path="/search" element={
            <WithLayout {...nav}><SearchEngine /></WithLayout>
          } />
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
              {userLoading ? null : user?.type === 'employer' ? (
                <>
                  <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
                  <EmployerDashboardPage onNavigate={handleNavigation} onLogout={handleLogout} />
                </>
              ) : user?.type === 'admin' || user?.type === 'super_admin' ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <WithLayout {...nav}><CandidateDashboardPage onNavigate={handleNavigation} /></WithLayout>
              )}
            </AuthGuard>
          } />

          <Route path="/candidate-messages" element={
            <AuthGuard user={user} userLoading={userLoading}>
              <div className="flex flex-col" style={{height: '100dvh'}}>
                <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
                <div className="flex-1 min-h-0 overflow-hidden">
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

          <Route path="/resume-upload" element={
            <AuthGuard user={user}>
              <WithLayout {...nav}>
                <div className="max-w-4xl mx-auto p-6">
                  <h1 className="text-3xl font-bold mb-6">Upload Resume</h1>
                  <ResumeUploadWithModeration
                    userId={user?.name || '1'}
                    onUploadComplete={result => showNotification(result.message,
                      result.resume.status === 'approved' ? 'success' : 'info')}
                  />
                </div>
              </WithLayout>
            </AuthGuard>
          } />

          <Route path="/job-application" element={
            <AuthGuard user={user} userLoading={userLoading}>
              <JobApplicationPage onNavigate={handleNavigation} />
            </AuthGuard>
          } />


          <Route path="/candidate-profile-view" element={
            <AuthGuard user={user} userLoading={userLoading}>
              <ErrorBoundary fallback={
                <div className="min-h-[60vh] flex items-center justify-center">
                  <div className="text-center bg-white rounded-xl p-8 shadow-sm border max-w-sm mx-4">
                    <div className="text-4xl mb-4">👤</div>
                    <h3 className="font-semibold text-gray-900 mb-2">Profile Not Available</h3>
                    <p className="text-sm text-gray-500 mb-4">This candidate hasn't set up their profile yet.</p>
                    <button onClick={() => window.history.back()} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Go Back</button>
                  </div>
                </div>
              }>
                <CandidateProfileViewWrapper onNavigate={handleNavigation} onBack={() => window.history.back()} />
              </ErrorBoundary>
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

          <Route path="/employer-profile" element={
            <AuthGuard user={user} userLoading={userLoading} allowedRoles={['employer', 'admin']}>
              <WithLayout {...nav}>
                <EmployerProfilePage onNavigate={handleNavigation} />
              </WithLayout>
            </AuthGuard>
          } />

          {/* -- Admin -- */}
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
        <EmployerLoginModal
          isOpen={showEmployerLoginModal} onClose={closeModals}
          onNavigate={handleNavigation} onLogin={handleLogin}
          onShowNotification={n => showNotification(n.message, n.type)}
        />
        <RoleSelectionModal isOpen={showRoleSelectionModal} onClose={closeModals} onSelectRole={handleRoleSelection} />
      </Suspense>
    </>
  );
}

export default App;


