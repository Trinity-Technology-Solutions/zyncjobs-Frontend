import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams, useSearchParams } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import GlobalAlert from './components/GlobalAlert';
import NewHero from './components/NewHero';
import OfflineIndicator from './components/OfflineIndicator';
import Notification from './components/Notification';
import ChatWidget from './components/ChatWidget';
import JobAlertsManager from './components/JobAlertsManager';
import AuthGuard from './components/AuthGuard';
import TokenHandler from './components/TokenHandler';
import ErrorBoundary from './components/ErrorBoundary';
import CookieConsentBanner from './components/CookieConsentBanner';
import SEOHead from './components/SEOHead';
// Lazy-load below-fold home page sections
const JobCategories = lazy(() => import('./components/JobCategories'));
const LatestJobs = lazy(() => import('./components/LatestJobs'));
const HowItWorks = lazy(() => import('./components/HowItWorks'));
const TalentedPeople = lazy(() => import('./components/TalentedPeople'));
const CallToAction = lazy(() => import('./components/CallToAction'));
const CompanyCarousel = lazy(() => import('./components/CompanyCarousel'));
import localStorageMigration from './services/localStorageMigration';
import { initializeEmployerIdCounter } from './utils/employerIdUtils';
import { accountAPI } from './api/account';
import { tokenStorage } from './utils/tokenStorage';
import { mergeUserToStorage, updateUserInStorage } from './utils/userStorage';
import { getPendingLogoutRole, setPendingLogoutRole, clearPendingLogoutRole } from './utils/logoutState';
import { useAnalytics } from './hooks/useAnalytics';
import { useSavedJobsStore } from './store/useSavedJobsStore';
import './utils/extensionErrorHandler'; // Initialize extension error handling
// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const LoginModal = lazy(() => import('./components/LoginModal'));
const RegisterModal = lazy(() => import('./components/RegisterModal'));
const PasswordExpiredModal = lazy(() => import('./components/PasswordExpiredModal'));
const AccountLockedModal = lazy(() => import('./components/AccountLockedModal'));
const EmployerLoginPage = lazy(() => import('./pages/EmployerLoginPage'));

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
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const BulkJobImportPage = lazy(() => import('./pages/BulkJobImportPage'));
const EmailVerificationPage = lazy(() => import('./pages/EmailVerificationPage'));
const MyAlertsPage = lazy(() => import('./pages/MyAlertsPage'));
const JobAlertNotificationsPage = lazy(() => import('./pages/JobAlertNotificationsPage'));
const InterviewInvitePage = lazy(() => import('./pages/InterviewInvitePage'));
const ATSDashboard = lazy(() => import('./pages/ATSDashboard'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
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

type UserType = { name: string; type: 'candidate' | 'employer' | 'admin' | 'super_admin' | 'manager' | 'recruiter'; email?: string };

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

// Dashboard route wrapper — detects intended role from URL for correct login redirect
const DashboardRoute: React.FC<{ 
  user: any; 
  userLoading: boolean; 
  nav: any; 
  notification: any; 
  setNotification: any;
  handleNavigation: any;
  handleLogout: any;
}> = ({ user, userLoading, nav, notification, setNotification, handleNavigation, handleLogout }) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const hash = location.hash.replace('#', '');
  
  // Determine intended role from query param, hash, or referrer
  // Employer contexts: #interviews, #applications, #team, ?role=employer
  const employerHashes = ['interviews', 'applications', 'saved-candidates', 'alerts', 'team', 'auto-rejection', 'credentialing'];
  const intendedRole = searchParams.get('role') || (employerHashes.includes(hash) ? 'employer' : 'candidate');
  const redirectTo = intendedRole === 'employer' ? '/employer-login' : '/login';

  return (
    <AuthGuard user={user} userLoading={userLoading} redirectTo={redirectTo}>
      <Notification {...notification} onClose={() => setNotification(n => ({ ...n, isVisible: false }))} />
      {user?.type === 'admin' || user?.type === 'super_admin' || user?.type === 'recruiter' ? (
        <Navigate to="/admin/dashboard" replace />
      ) : user?.type === 'employer' ? (
        <>
          <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
          <EmployerDashboardPage user={user as any} onNavigate={handleNavigation} onLogout={handleLogout} />
        </>
      ) : (
        <WithLayout {...nav}><CandidateDashboardPage user={user as any} onNavigate={handleNavigation} /></WithLayout>
      )}
    </AuthGuard>
  );
};

function MaintenancePage({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center px-6">
        <div className="text-6xl mb-6">🛠️</div>
        <h1 className="text-3xl font-bold text-white mb-3">Under Maintenance</h1>
        <p className="text-gray-400 mb-6">We're making some improvements. Please check back soon.</p>
        <button onClick={onRetry} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
          Try Again
        </button>
      </div>
    </div>
  );
}

// One-time cache bust — runs synchronously before first render so it never causes a re-render
; (() => {
  const APP_VERSION = '2.1.0';
  if (localStorage.getItem('app_version') !== APP_VERSION) {
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('accessToken');
    localStorage.setItem('app_version', APP_VERSION);
  }
})();

// Synchronously read user from localStorage BEFORE first render — eliminates flicker
function getInitialUser(): UserType | null {
  try {
    // If user explicitly logged out, never restore from localStorage
    if (localStorage.getItem('zync:logged_out') === '1') return null;
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    if (!stored.email || (!stored.userType && !stored.role)) return null;
    const rawType = stored.userType || stored.role || 'candidate';
    let type: UserType['type'] = 'candidate';
    if (rawType === 'employer') type = 'employer';
    else if (rawType === 'admin') type = 'admin';
    else if (rawType === 'super_admin') type = 'super_admin';
    else if (rawType === 'manager') type = 'manager';
    else if (rawType === 'recruiter') type = 'recruiter';
    return {
      name: stored.fullName || stored.name || stored.email.split('@')[0] || 'User',
      type,
      email: stored.email,
      ...(stored.teamRole && { teamRole: stored.teamRole }),
      ...(stored.employerOwnerId && { employerOwnerId: stored.employerOwnerId }),
      ...(stored.employerId && { employerId: stored.employerId }),
    } as any;
  } catch { return null; }
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const analytics = useAnalytics();
  const [maintenance, setMaintenance] = useState(false);
  const fetchSavedJobs = useSavedJobsStore(s => s.fetchSavedJobs);
  const resetSavedJobs = useSavedJobsStore(s => s.reset);

  const [user, setUser] = useState<UserType | null>(getInitialUser);
  const loginTimestamp = React.useRef<number>(0);
  // If we already have user from localStorage and no refresh token, skip loading state
  const [userLoading, setUserLoading] = useState(() => {
    const hasRefreshToken = !!tokenStorage.getRefresh();
    const hasAccessToken = !!tokenStorage.getAccess();
    // Only show loading if we have tokens that need verification
    return hasRefreshToken || hasAccessToken;
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const [passwordExpired, setPasswordExpired] = useState(false);
  const [expiredUserData, setExpiredUserData] = useState<any>(null);
  const [accountLocked, setAccountLocked] = useState(false);
  const [lockoutData, setLockoutData] = useState<{ lockoutMinutes: number; email: string }>({ lockoutMinutes: 15, email: '' });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    isVisible: boolean;
  }>({ type: 'info', message: '', isVisible: false });

  // ALL hooks must be declared before any early returns
  const closeModals = useCallback(() => {
    setShowLoginModal(false);
    setShowRegisterModal(false);
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
    if (page === 'dashboard') { navigate('/dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (page === 'my-applications') { navigate('/my-applications'); return; }
    if (page === 'bulk-job-import') { navigate('/bulk-job-import'); return; }
    if (page === 'job-alert-notifications') { navigate('/job-alert-notifications'); return; }
    const target = `/${page}`;
    if (currentPath !== target) { navigate(target); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ type, message, isVisible: true });
  }, []);

  const handleLogout = useCallback(() => {
    resetSavedJobs();

    // Read ALL sources BEFORE clearing anything
    let userType: string | null | undefined = user?.type;

    if (!userType || userType === 'candidate') {
      userType = localStorage.getItem('lastUserType') || userType;
    }

    if (!userType) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        userType = storedUser.userType || storedUser.role || storedUser.type;
      } catch { }
    }

    if (!userType) {
      try {
        const token = tokenStorage.getAccess();
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userType = payload.userType || payload.role;
        }
      } catch { }
    }

    // Remember the role BEFORE clearing so a subsequent forced logout
    // (zync:logout from a 401) or any AuthGuard redirect still goes to the
    // correct login page — logout is idempotent.
    setPendingLogoutRole(userType);

    // Clear storage AFTER reading userType
    setUser(null);
    tokenStorage.clear();
    sessionStorage.clear();
    localStorage.removeItem('user');
    localStorage.removeItem('lastUserType');
    // Mark explicit logout so restoreSession skips cookie-based re-auth on next refresh
    localStorage.setItem('zync:logged_out', '1');

    if (userType === 'employer') navigate('/employer-login');
    else if (userType === 'admin' || userType === 'super_admin' || userType === 'recruiter') navigate('/admin/login');
    else navigate('/login');
  }, [navigate, user?.type]);

  const handleLogin = useCallback((userData: UserType & { id?: string; _id?: string; role?: string; userType?: string; passwordExpired?: boolean; daysSinceChange?: number; tempToken?: string }) => {
    // Check if password is expired
    if (userData.passwordExpired) {
      // Store temp token for password change
      if (userData.tempToken) {
        tokenStorage.setAccess(userData.tempToken);
      }
      setPasswordExpired(true);
      setExpiredUserData(userData);
      return;
    }
    
    loginTimestamp.current = Date.now();
    setUser(userData);
    closeModals();
    // Clear the explicit-logout flag so future refreshes restore the session
    localStorage.removeItem('zync:logged_out');
    // Fetch saved jobs once after login
    setTimeout(() => fetchSavedJobs(), 500);

    // Store user type separately for reliable logout redirection
    const userType = userData.type || userData.userType || userData.role || 'candidate';
    localStorage.setItem('lastUserType', userType);
    // Fresh session — clear any remembered role from a previous logout
    clearPendingLogoutRole();

    // If NOT a team member, clear employerOwnerId to prevent stale cross-account data
    const isTeamMember = !!(userData as any).teamRole;
    if (!isTeamMember) {
      try {
        const existing = JSON.parse(localStorage.getItem('user') || '{}');
        delete existing.employerOwnerId;
        delete existing.ownerEmail;
        localStorage.setItem('user', JSON.stringify(existing));
      } catch { /* ignore */ }
    }

    // Persist user to localStorage — MERGE with existing data so fields like
    // companyName, companyLogo, employerId set by login pages are not lost
    mergeUserToStorage({
      ...userData,
      userType: userData.type,
      role: userData.role || userData.type,
    });
    const token = tokenStorage.getAccess();
    if (token && (userData.type === 'candidate' || userData.type === 'employer')) {
      localStorageMigration.setToken(token);
      setTimeout(() => localStorageMigration.runFullMigration().catch(console.error), 1000);
    }
  }, [closeModals]);

  const handlePasswordChange = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '/api';
      const userId = expiredUserData?.user?.id || expiredUserData?.user?._id;
      
      if (!userId) {
        throw new Error('User ID not found');
      }

      const res = await fetch(`${API_BASE}/users/${userId}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenStorage.getAccess()}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to change password');
      }
      
      // Password changed successfully - now do normal login
      setPasswordExpired(false);
      const userData = expiredUserData.user;
      const userType = userData.userType || userData.role || 'candidate';
      let type: UserType['type'] = 'candidate';
      if (userType === 'employer') type = 'employer';
      else if (userType === 'admin') type = 'admin';
      else if (userType === 'super_admin') type = 'super_admin';
      else if (userType === 'manager') type = 'manager';
      else if (userType === 'recruiter') type = 'recruiter';
      
      // Generate new tokens after password change
      const loginRes = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: userData.email, 
          password: newPassword,
          portal: type === 'employer' ? 'employer' : type === 'admin' || type === 'super_admin' ? 'admin' : 'candidate'
        })
      });
      
      if (loginRes.ok) {
        const loginData = await loginRes.json();
        if (loginData.accessToken) tokenStorage.setAccess(loginData.accessToken);
        if (loginData.refreshToken) tokenStorage.setRefresh(loginData.refreshToken);
        
        setUser({ name: userData.name || userData.email.split('@')[0], type, email: userData.email });
        showNotification('Password updated successfully!', 'success');
        navigate('/dashboard');
      } else {
        throw new Error('Failed to login after password change');
      }
    } catch (error: any) {
      throw error;
    }
  }, [expiredUserData, navigate, showNotification]);

  useEffect(() => {
    initializeEmployerIdCounter();
    const handleForceLogout = () => {
      // Read ALL sources BEFORE clearing anything — the remembered role from a
      // manual logout takes priority, since manual logout already wiped storage.
      let userType: string | null | undefined = getPendingLogoutRole() || localStorage.getItem('lastUserType');

      if (!userType) {
        try {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          userType = storedUser.userType || storedUser.role || storedUser.type;
        } catch { }
      }

      if (!userType) {
        try {
          const token = tokenStorage.getAccess();
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userType = payload.userType || payload.role;
          }
        } catch { }
      }

      // Remember the role BEFORE clearing so AuthGuard redirects go to the
      // correct login page for forced logouts too.
      setPendingLogoutRole(userType);

      // Clear user state immediately
      setUser(null);
      useSavedJobsStore.getState().reset();

      // Clear all storage
      tokenStorage.clear();
      sessionStorage.clear();
      localStorage.removeItem('user');
      localStorage.removeItem('lastUserType');
      localStorage.setItem('zync:logged_out', '1');

      if (userType === 'employer') navigate('/employer-login');
      else if (userType === 'admin' || userType === 'super_admin' || userType === 'recruiter') navigate('/admin/login');
      else navigate('/login');
    };
    window.addEventListener('zync:logout', handleForceLogout);
    const handleAccountLocked = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setLockoutData({ lockoutMinutes: detail.lockoutMinutes || 15, email: detail.email || '' });
      setAccountLocked(true);
    };
    window.addEventListener('zync:account-locked', handleAccountLocked);

    // IMMEDIATELY clear httpOnly cookie if on admin accept invite page
    // This runs synchronously before restoreSession
    if (window.location.pathname.startsWith('/admin/accept-invite')) {
      console.log('🔑 Admin invite page detected - clearing httpOnly cookie immediately');
      fetch(`${import.meta.env.VITE_API_URL || '/api'}/users/logout`, {
        method: 'POST',
        credentials: 'include'
      }).catch(() => {});
    }

    const restoreSession = async () => {
      // Skip session restoration on admin accept invite page to prevent
      // httpOnly cookie from re-authenticating as candidate
      if (window.location.pathname.startsWith('/admin/accept-invite')) {
        console.log('🔑 Skipping session restore on admin invite page');
        setUserLoading(false);
        return;
      }
      
      // If the user explicitly logged out, do NOT re-authenticate via cookie.

      // Clean up any base64 images stored in localStorage
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          let cleaned = false;
          if (parsed.profilePhoto?.startsWith('data:')) { parsed.profilePhoto = ''; cleaned = true; }
          if (parsed.coverPhoto?.startsWith('data:')) { parsed.coverPhoto = ''; cleaned = true; }
          if (cleaned) updateUserInStorage(parsed);
        }
      } catch { /* silent */ }

      // user is already set synchronously from getInitialUser()
      // Now just verify/refresh the token in the background
      let token = tokenStorage.getAccess();

      if (!token) {
        const refreshToken = tokenStorage.getRefresh();
        try {
          // Try the httpOnly refreshToken cookie too (no stored token needed).
          const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/users/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: refreshToken ? JSON.stringify({ refreshToken }) : JSON.stringify({}),
            credentials: 'include',
          });
          if (res.ok) {
            const data = await res.json();
            tokenStorage.setAccess(data.accessToken);
            if (data.refreshToken) tokenStorage.setRefresh(data.refreshToken);
            token = data.accessToken;
          } else {
            if (!refreshToken) { setUserLoading(false); return; }
            tokenStorage.clear();
            setUser(null);
            setUserLoading(false);
            return;
          }
        } catch {
          setUserLoading(false);
          return;
        }
      }

      // Fetch saved jobs for already-logged-in session restore
      fetchSavedJobs();

      // Verify token silently — only update state if data actually changed
      try {
        const userData = await accountAPI.getMe();
        if (!userData) {
          tokenStorage.clear();
          setUser(null);
        } else {
          let userType: UserType['type'] = 'candidate';
          const rawType = userData.userType || userData.role || '';
          // If user logged in as employer (stored in lastUserType), preserve that
          // even if DB role is super_admin/admin (dual-role account)
          const lastUserType = localStorage.getItem('lastUserType');
          const resolvedRawType = (lastUserType === 'employer' && (rawType === 'super_admin' || rawType === 'admin') && (userData.companyName || userData.company || userData.employerId))
            ? 'employer'
            : lastUserType === 'recruiter' && ['super_admin', 'admin', 'manager'].includes(rawType)
              ? 'recruiter'
              : rawType;
          if (resolvedRawType === 'employer') userType = 'employer';
          else if (resolvedRawType === 'admin') userType = 'admin';
          else if (resolvedRawType === 'super_admin') userType = 'super_admin';
          else if (resolvedRawType === 'manager') userType = 'manager';
          else if (resolvedRawType === 'recruiter') userType = 'recruiter';
          const stored = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
          // Only update if type or email changed to avoid unnecessary re-render
          const freshName = userData.name || userData.fullName || userData.email?.split('@')[0] || 'User';
          // Skip overwriting user if a login just happened in the last 5 seconds
          if (Date.now() - loginTimestamp.current < 5000) {
            setUserLoading(false);
            return;
          }
          setUser(prev => {
            if (prev?.type === userType && prev?.email === userData.email && prev?.name === freshName) return prev;
            return {
              name: freshName,
              type: userType,
              email: userData.email,
              ...(stored.teamRole && { teamRole: stored.teamRole }),
              ...(stored.employerOwnerId && { employerOwnerId: stored.employerOwnerId }),
              ...((stored.ownerEmail || stored.employerOwnerId) && { ownerEmail: stored.ownerEmail || stored.employerOwnerId }),
              ...(stored.employerId && { employerId: stored.employerId }),
            } as any;
          });
          // Keep localStorage in sync with the verified DB name
          try {
            const ls = JSON.parse(localStorage.getItem('user') || '{}');
            // Only update name if it's explicitly different AND we didn't just login
            if (ls.name !== freshName && Date.now() - loginTimestamp.current >= 5000) {
              updateUserInStorage({ ...ls, name: freshName });
            }
          } catch { /* ignore */ }
        }
      } catch {
        tokenStorage.clear();
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    };

    restoreSession();
    return () => {
      window.removeEventListener('zync:logout', handleForceLogout);
      window.removeEventListener('zync:account-locked', handleAccountLocked);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  useEffect(() => {
    const orig = window.fetch;
    window.fetch = async (...args) => {
      try {
        const res = await orig(...args);
        if (res.status === 503) {
          const clone = res.clone();
          try { const data = await clone.json(); if (data.maintenance) setMaintenance(true); } catch { }
        }
        return res;
      } catch (err) {
        throw err;
      }
    };
    // Do not restore on unmount — App lives for the entire session
  }, []);


  if (userLoading) {
    const waitForSessionPaths = [
      '/login', '/employer-login',
      '/dashboard', '/settings', '/my-jobs', '/my-applications', '/employer-profile',
      '/job-posting', '/job-management', '/candidate-search', '/resume-builder', '/resume-studio',
      '/resume-score', '/resume-parser', '/skill-assessment', '/career-coach', '/career-roadmap',
      '/job-application', '/candidate-messages', '/interviews', '/alerts', '/job-alert-notifications', '/privacy-settings',
      '/application-management', '/candidate-profile-view', '/candidate-ranking', '/ai-recruiter', '/skill-gap-analysis',
      '/recruiter-actions', '/search-appearances',
      '/job-parsing', '/job-posting-selection', '/candidate-review', '/job-matches', '/recommended-jobs',
      '/bulk-job-import',
      '/admin/dashboard', '/admin/login'];
    if (waitForSessionPaths.some(p => location.pathname.startsWith(p))) {
      return <LoadingFallback />;
    }
  }

  if (maintenance && !location.pathname.startsWith('/admin')) {
    const handleRetry = async () => {
      try { const res = await fetch('/api/jobs?limit=1'); if (res.ok) setMaintenance(false); } catch { }
    };
    return <MaintenancePage onRetry={handleRetry} />;
  }

  // Handle OAuth callback (skip admin invite pages — they use token param too)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('token') && !location.pathname.startsWith('/admin/accept-invite')) {
    return <TokenHandler onLogin={handleLogin} onNavigate={handleNavigation} />;
  }

  const nav = { onNavigate: handleNavigation, user: user as any, onLogout: handleLogout, userLoading };

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:font-medium">Skip to main content</a>
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
        <main id="main-content">
          <Routes>
            {/* -- Public home -- */}
            <Route path="/" element={
              user?.type === 'employer' ? (
                <EmployersPage {...nav} />
              ) : (
              <div className="min-h-screen bg-white overflow-x-clip">
                <Header {...nav} />
                <NewHero onNavigate={handleNavigation} user={user as any} />
                <CompanyCarousel />
                <LatestJobs onNavigate={handleNavigation} />
                <HowItWorks onNavigate={handleNavigation} />
                <JobCategories onNavigate={handleNavigation} />
                <TalentedPeople onNavigate={handleNavigation} />
                <CallToAction onNavigate={handleNavigation} />
                <Footer onNavigate={handleNavigation} user={user as any} />
                <ChatWidget />
              </div>
              )
            } />

            <Route path="/candidate-messages" element={
              <AuthGuard user={user} userLoading={userLoading} allowedRoles={['candidate']}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                  <div style={{ flexShrink: 0 }}>
                    <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
                  </div>
                  <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
                    <CandidateMessagesPage onNavigate={handleNavigation} />
                  </div>
                </div>
              </AuthGuard>
            } />

            {/* -- Auth -- */}
            <Route path="/login" element={
              userLoading
                ? <LoadingFallback />
                : user
                  ? <Navigate to="/dashboard" replace />
                  : <LoginPage onNavigate={handleNavigation} onLogin={handleLogin} />
            } />
            <Route path="/employer-login" element={
              userLoading
                ? <LoadingFallback />
                : user
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
            <Route path="/role-selection" element={<Navigate to="/candidate-register" replace />} />
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
            <Route path="/verify-email" element={
              <AuthGuard user={user}>
                <EmailVerificationPage onNavigate={handleNavigation} user={user as any} />
              </AuthGuard>
            } />
            <Route path="/accessibility" element={<AccessibilityPage {...nav} />} />
            <Route path="/resume-help" element={<ResumeHelpPage {...nav} />} />

            {/* -- Protected: any logged-in user -- */}
            <Route path="/dashboard" element={
              userLoading ? <LoadingFallback /> :
                <DashboardRoute user={user} userLoading={userLoading} nav={nav} notification={notification} setNotification={setNotification} handleNavigation={handleNavigation} handleLogout={handleLogout} />
            } />

            <Route path="/ats-dashboard" element={
              <AuthGuard user={user} userLoading={userLoading}>
                <ATSDashboard onNavigate={handleNavigation} />
              </AuthGuard>
            } />

            <Route path="/candidate-messages" element={
              <AuthGuard user={user} userLoading={userLoading}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                  <div style={{ flexShrink: 0 }}>
                    <Header onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
                  </div>
                  <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
                    <CandidateMessagesPage onNavigate={handleNavigation} />
                  </div>
                </div>
              </AuthGuard>
            } />

            <Route path="/settings" element={
              <AuthGuard user={user} userLoading={userLoading} allowedRoles={['candidate', 'employer']}>
                <WithLayout {...nav}><SettingsPage {...nav} onUserUpdate={setUser} /></WithLayout>
              </AuthGuard>
            } />

            <Route path="/my-jobs" element={
              <AuthGuard user={user} userLoading={userLoading} allowedRoles={['employer']}>
                <>
                  <Header {...nav} />
                  <MyJobsPage {...nav} />
                </>
              </AuthGuard>
            } />

            <Route path="/job-refresh-management" element={
              <AuthGuard user={user} userLoading={userLoading} allowedRoles={['employer']}>
                <JobRefreshManagementPage {...nav} onUserUpdate={setUser} />
              </AuthGuard>
            } />

            <Route path="/my-applications" element={
              <AuthGuard user={user} userLoading={userLoading} allowedRoles={['candidate']}>
                <MyApplicationsPage {...nav} />
              </AuthGuard>
            } />

            <Route path="/alerts" element={
              <AuthGuard user={user} allowedRoles={['candidate']}>
                <MyAlertsPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
              </AuthGuard>
            } />

            <Route path="/job-alert-notifications" element={
              <AuthGuard user={user} allowedRoles={['candidate']}>
                <JobAlertNotificationsPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
              </AuthGuard>
            } />

            <Route path="/interviews" element={
              <AuthGuard user={user} userLoading={userLoading} allowedRoles={['candidate']}>
                <CandidateInterviewsPage {...nav} />
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
                      onSave={() => { }}
                    />
                  </div>
                </WithLayout>
              </AuthGuard>
            } />

            <Route path="/candidate-ranking" element={
              <CandidateRankingPage onNavigate={nav.onNavigate} user={user} onLogout={handleLogout} />
            } />

            <Route path="/ai-recruiter" element={
              <AIRecruiterAssistant onNavigate={nav.onNavigate} onLogout={handleLogout} user={user} />
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
                <WithLayout {...nav}>
                  <ResumeBuilderPage {...nav} />
                </WithLayout>
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


            <Route path="/bulk-job-import" element={
              <AuthGuard user={user} userLoading={userLoading} allowedRoles={['employer', 'admin']}>
                <BulkJobImportPage onNavigate={handleNavigation} user={user as any} />
              </AuthGuard>
            } />

            {/* -- Protected: employer only -- */}
            <Route path="/job-posting" element={
              <AuthGuard user={user} userLoading={userLoading} allowedRoles={['employer', 'admin']}><WithLayout {...nav}><JobPostingPage {...nav} mode={location.state?.mode || (() => { try { const s = JSON.parse(sessionStorage.getItem('parsedJobData') || '{}'); if (s?.parsedData) { sessionStorage.removeItem('parsedJobData'); return s.mode; } return undefined; } catch { return undefined; } })()} parsedData={location.state?.parsedData || (() => { try { const s = JSON.parse(sessionStorage.getItem('parsedJobData') || '{}'); return s?.parsedData || undefined; } catch { return undefined; } })()} /></WithLayout></AuthGuard>
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

            <Route path="/analytics" element={
              <AuthGuard user={user} userLoading={userLoading} allowedRoles={['employer', 'admin']}>
                <AnalyticsPage onNavigate={handleNavigation} user={user as any} onLogout={handleLogout} />
              </AuthGuard>
            } />

            <Route path="/application-management" element={
              <AuthGuard user={user} userLoading={userLoading} allowedRoles={['employer', 'admin']}>
                <ApplicationManagementPage {...nav} onLogout={handleLogout} />
              </AuthGuard>
            } />

            <Route path="/employer-profile" element={<Navigate to="/dashboard" replace />} />

            {/* -- Admin Accept Invite (Public Route) -- */}
            <Route path="/admin/accept-invite" element={
              <AdminAcceptInvitePage
                onNavigate={handleNavigation}
                onLogin={handleLogin}
                onLogout={handleLogout}
              />
            } />

            {/* -- Admin Routes -- */}
            <Route path="/admin/login" element={
              user && (user.type === 'admin' || user.type === 'super_admin' || user.type === 'recruiter')
                ? <Navigate to="/admin/dashboard" replace />
                : <AdminLoginPage onLogin={u => {
                  handleLogin(u);
                  handleNavigation('admin/dashboard');
                }} onNavigate={handleNavigation} />
            } />

            <Route path="/admin/dashboard" element={
              <AuthGuard user={user} userLoading={userLoading} allowedRoles={['admin', 'super_admin', 'manager', 'recruiter']}>
                <AdminDashboardPage
                  user={{ name: user?.name || 'Admin', email: user?.email, role: user?.type }}
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

            {/* -- Interview invite (public) -- */}
            <Route path="/interview-invite" element={
              <InterviewInvitePage onNavigate={handleNavigation} />
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
                          <div className="text-5xl mb-2">🧭</div>
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
        </main>
      </Suspense>

      {/* Global modals */}
      <Suspense fallback={null}>
        <LoginModal isOpen={showLoginModal} onClose={closeModals} onNavigate={handleNavigation} onLogin={handleLogin} />
        <RegisterModal isOpen={showRegisterModal} onClose={closeModals} onNavigate={handleNavigation} />
        
        {passwordExpired && expiredUserData && (
          <PasswordExpiredModal
            isOpen={passwordExpired}
            daysSinceChange={expiredUserData.daysSinceChange || 0}
            onPasswordChange={handlePasswordChange}
            onLogout={handleLogout}
          />
        )}
        <AccountLockedModal
          isOpen={accountLocked}
          lockoutMinutes={lockoutData.lockoutMinutes}
          onClose={() => setAccountLocked(false)}
          onContactSupport={() => {
            setAccountLocked(false);
            handleNavigation('contact');
          }}
        />
      </Suspense>
    </>
  );
}

export default App;


