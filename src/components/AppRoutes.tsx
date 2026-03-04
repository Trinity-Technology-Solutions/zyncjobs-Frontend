import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './Header';
import NewHero from './NewHero';
import JobCategories from './JobCategories';
import LatestJobs from './LatestJobs';
import HowItWorks from './HowItWorks';
import TalentedPeople from './TalentedPeople';
import CallToAction from './CallToAction';
import Footer from './Footer';
import ChatWidget from './ChatWidget';
import MobileNavigation from './MobileNavigation';
import BackButton from './BackButton';

// Lazy load all pages
const LoginPage = lazy(() => import('../pages/LoginPage'));
const EmployerLoginPage = lazy(() => import('../pages/EmployerLoginPage'));
const RoleSelectionPage = lazy(() => import('../pages/RoleSelectionPage'));
const CandidateRegisterPage = lazy(() => import('../pages/CandidateRegisterPage'));
const EmployerRegisterPage = lazy(() => import('../pages/EmployerRegisterPage'));
const EmployersPage = lazy(() => import('../pages/EmployersPage'));
const JobListingsPage = lazy(() => import('../pages/JobListingsPage'));
const CompaniesPage = lazy(() => import('../pages/CompaniesPage'));
const JobHuntingPage = lazy(() => import('../pages/JobHuntingPage'));
const ResumeTemplatesPage = lazy(() => import('../pages/ResumeTemplatesPage'));
const ResumeEditorPage = lazy(() => import('../pages/ResumeEditorPage'));
const ResumeReadyPage = lazy(() => import('../pages/ResumeReadyPage'));
const AIResumeBuilderPage = lazy(() => import('../pages/AIResumeBuilderPage'));
const ResumeViewerPage = lazy(() => import('../pages/ResumeViewerPage'));
const InterviewTipsPage = lazy(() => import('../pages/InterviewTipsPage'));
const CareerAdvicePage = lazy(() => import('../pages/CareerAdvicePage'));
const CareerInsightsHubPage = lazy(() => import('../pages/CareerInsightsHubPage'));
const SalaryReportPage = lazy(() => import('../pages/SalaryReportPage'));
const CandidateSearchPage = lazy(() => import('../pages/CandidateSearchPage'));
const JobPostingPage = lazy(() => import('../pages/JobPostingPage'));
const JobPostingSelectionPage = lazy(() => import('../pages/JobPostingSelectionPage'));
const JobParsingPage = lazy(() => import('../pages/JobParsingPage'));
const JobDetailPage = lazy(() => import('../pages/JobDetailPage'));
const SkillDetailPage = lazy(() => import('../pages/SkillDetailPage'));
const CareerResources = lazy(() => import('./CareerResources'));
const CandidateDashboardPage = lazy(() => import('../pages/CandidateDashboardPage'));
const EmployerDashboardPage = lazy(() => import('../pages/EmployerDashboardPage'));
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage'));
const SearchEngine = lazy(() => import('./SearchEngine'));
const CompanyReviewsPage = lazy(() => import('../pages/CompanyReviewsPage'));
const CompanyProfilePage = lazy(() => import('../pages/CompanyProfilePage'));
const CompanyViewPage = lazy(() => import('../pages/CompanyViewPage'));
const CandidateProfileView = lazy(() => import('../pages/CandidateProfileView'));
const JobApplicationPage = lazy(() => import('../pages/JobApplicationPage'));
const DailyJobsPage = lazy(() => import('../pages/DailyJobsPage'));
const JobRolePage = lazy(() => import('../pages/JobRolePage'));
const HireTalentPage = lazy(() => import('../pages/HireTalentPage'));
const JobManagementPage = lazy(() => import('../pages/JobManagementPage'));
const CandidateResponseDetailPage = lazy(() => import('../pages/CandidateResponseDetailPageNew'));
const CandidateReviewPage = lazy(() => import('../pages/CandidateReviewPage'));
const RecruiterActionsPage = lazy(() => import('../pages/RecruiterActionsPage'));
const SearchAppearancesPage = lazy(() => import('../pages/SearchAppearancesPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const MyJobsPage = lazy(() => import('../pages/MyJobsPage'));
const MyApplicationsPage = lazy(() => import('../pages/MyApplicationsPage'));
const ResumeParserPage = lazy(() => import('../pages/ResumeParserPage'));
const CompanyTestPage = lazy(() => import('../pages/CompanyTestPage'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage'));
const ResumeModerationDashboard = lazy(() => import('../pages/ResumeModerationDashboard'));
const JobModerationDashboard = lazy(() => import('../pages/JobModerationDashboard'));
const AIScoringDemoPage = lazy(() => import('../pages/AIScoringDemoPage'));
const ApplicationManagementPage = lazy(() => import('../pages/ApplicationManagementPage'));
const EmployerProfilePage = lazy(() => import('../pages/EmployerProfilePage'));
const SkillAssessmentPage = lazy(() => import('../pages/SkillAssessmentPage'));
const FeaturesPage = lazy(() => import('../pages/FeaturesPage'));
const PricingPage = lazy(() => import('../pages/PricingPage'));
const CandidateInterviewsPage = lazy(() => import('../pages/CandidateInterviewsPage'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

interface AppRoutesProps {
  user: {name: string, type: 'candidate' | 'employer' | 'admin', email?: string} | null;
  onNavigate: (page: string, topic?: any) => void;
  onLogout: () => void;
  onLogin: (userData: {name: string, type: 'candidate' | 'employer' | 'admin', email?: string}) => void;
  currentData: any;
  currentTopic: string;
  handleBackNavigation: () => void;
  setNotification: (notif: any) => void;
}

export default function AppRoutes({ 
  user, 
  onNavigate, 
  onLogout, 
  onLogin,
  currentData,
  currentTopic,
  handleBackNavigation,
  setNotification
}: AppRoutesProps) {
  return (
    <Routes>
      {/* Home Page */}
      <Route path="/" element={
        <div className="min-h-screen bg-white">
          <Header onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
          <NewHero onNavigate={onNavigate} user={user as any} />
          <LatestJobs onNavigate={onNavigate} />
          <HowItWorks onNavigate={onNavigate} />
          <JobCategories onNavigate={onNavigate} />
          <TalentedPeople onNavigate={onNavigate} />
          <CallToAction onNavigate={onNavigate} />
          <Footer onNavigate={onNavigate} />
          <ChatWidget />
          <MobileNavigation onNavigate={onNavigate} currentPage="home" />
        </div>
      } />

      {/* Auth Pages */}
      <Route path="/login" element={
        <Suspense fallback={<LoadingFallback />}>
          <LoginPage onNavigate={onNavigate} onLogin={onLogin} />
        </Suspense>
      } />
      
      <Route path="/employer-login" element={
        <Suspense fallback={<LoadingFallback />}>
          <EmployerLoginPage onNavigate={onNavigate} onLogin={onLogin} onShowNotification={(notif) => setNotification({...notif, isVisible: true})} />
        </Suspense>
      } />
      
      <Route path="/role-selection" element={
        <Suspense fallback={<LoadingFallback />}>
          <RoleSelectionPage onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
        </Suspense>
      } />
      
      <Route path="/candidate-register" element={
        <Suspense fallback={<LoadingFallback />}>
          <CandidateRegisterPage onNavigate={onNavigate} onLogin={onLogin} />
        </Suspense>
      } />
      
      <Route path="/employer-register" element={
        <Suspense fallback={<LoadingFallback />}>
          <EmployerRegisterPage onNavigate={onNavigate} onLogin={onLogin} />
        </Suspense>
      } />

      <Route path="/forgot-password" element={
        <Suspense fallback={<LoadingFallback />}>
          <ForgotPasswordPage onNavigate={onNavigate} />
        </Suspense>
      } />

      <Route path="/reset-password/:token" element={
        <Suspense fallback={<LoadingFallback />}>
          <ResetPasswordPage onNavigate={onNavigate} />
        </Suspense>
      } />

      {/* Job Pages */}
      <Route path="/employers" element={
        <Suspense fallback={<LoadingFallback />}>
          <EmployersPage onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
        </Suspense>
      } />

      <Route path="/job-listings" element={
        <Suspense fallback={<LoadingFallback />}>
          <JobListingsPage onNavigate={onNavigate} user={user as any} onLogout={onLogout} searchParams={currentData} />
        </Suspense>
      } />

      <Route path="/companies" element={
        <Suspense fallback={<LoadingFallback />}>
          <CompaniesPage onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
        </Suspense>
      } />

      <Route path="/job-detail" element={
        <Suspense fallback={<LoadingFallback />}>
          <div className="min-h-screen bg-white">
            <Header onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
            <JobDetailPage 
              onNavigate={onNavigate} 
              jobTitle={currentData?.jobTitle || currentTopic}
              jobId={currentData?.jobId}
              companyName={currentData?.companyName}
              jobData={currentData?.jobData}
              user={user as any}
              onLogout={onLogout}
            />
            <Footer onNavigate={onNavigate} />
          </div>
        </Suspense>
      } />

      <Route path="/daily-jobs" element={
        <Suspense fallback={<LoadingFallback />}>
          <div className="min-h-screen bg-white">
            <Header onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
            <DailyJobsPage onNavigate={onNavigate} />
            <Footer onNavigate={onNavigate} />
          </div>
        </Suspense>
      } />

      {/* Dashboard */}
      <Route path="/dashboard" element={
        <Suspense fallback={<LoadingFallback />}>
          {user?.type === 'admin' ? (
            <AdminDashboardPage onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
          ) : (
            <div className="min-h-screen bg-white">
              <Header onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
              {user?.type === 'employer' ? (
                <EmployerDashboardPage onNavigate={onNavigate} onLogout={onLogout} />
              ) : (
                <CandidateDashboardPage onNavigate={onNavigate} />
              )}
              <Footer onNavigate={onNavigate} />
            </div>
          )}
        </Suspense>
      } />

      {/* Resume Pages */}
      <Route path="/resume-templates" element={
        <Suspense fallback={<LoadingFallback />}>
          <ResumeTemplatesPage onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
        </Suspense>
      } />

      <Route path="/resume-editor" element={
        <Suspense fallback={<LoadingFallback />}>
          <ResumeEditorPage onNavigate={onNavigate} user={user as any} onLogout={onLogout} template={currentTopic} />
        </Suspense>
      } />

      <Route path="/resume-view/:template" element={
        <Suspense fallback={<LoadingFallback />}>
          <ResumeViewerPage />
        </Suspense>
      } />

      <Route path="/ai-resume-builder" element={
        <Suspense fallback={<LoadingFallback />}>
          <AIResumeBuilderPage onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
        </Suspense>
      } />

      {/* Career Pages */}
      <Route path="/career-advice" element={
        <Suspense fallback={<LoadingFallback />}>
          <CareerAdvicePage onNavigate={onNavigate} topic={currentTopic} />
        </Suspense>
      } />

      <Route path="/career-insights-hub" element={
        <Suspense fallback={<LoadingFallback />}>
          <CareerInsightsHubPage onNavigate={onNavigate} />
        </Suspense>
      } />

      <Route path="/interview-tips" element={
        <Suspense fallback={<LoadingFallback />}>
          <InterviewTipsPage onNavigate={onNavigate} />
        </Suspense>
      } />

      {/* Settings & Profile */}
      <Route path="/settings" element={
        user ? (
          <div className="min-h-screen bg-white">
            <Header onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
            <SettingsPage onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
            <Footer onNavigate={onNavigate} />
          </div>
        ) : <Navigate to="/role-selection" replace />
      } />

      <Route path="/my-jobs" element={
        user ? (
          <>
            <Header onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
            <MyJobsPage onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
          </>
        ) : <Navigate to="/role-selection" replace />
      } />

      <Route path="/my-applications" element={
        user ? (
          <Suspense fallback={<LoadingFallback />}>
            <MyApplicationsPage onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
          </Suspense>
        ) : <Navigate to="/role-selection" replace />
      } />

      {/* Employer Pages */}
      <Route path="/job-posting-selection" element={
        <Suspense fallback={<LoadingFallback />}>
          <div className="min-h-screen bg-white">
            <Header onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
            <JobPostingSelectionPage onNavigate={onNavigate} user={user as any} />
          </div>
        </Suspense>
      } />

      <Route path="/job-posting" element={
        <Suspense fallback={<LoadingFallback />}>
          <div className="min-h-screen bg-white">
            <Header onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
            <JobPostingPage 
              onNavigate={onNavigate} 
              user={user as any} 
              onLogout={onLogout}
              mode={currentData?.mode}
              parsedData={currentData?.parsedData}
            />
          </div>
        </Suspense>
      } />

      <Route path="/candidate-search" element={
        <Suspense fallback={<LoadingFallback />}>
          <CandidateSearchPage onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
        </Suspense>
      } />

      <Route path="/job-management" element={
        <Suspense fallback={<LoadingFallback />}>
          <JobManagementPage onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
        </Suspense>
      } />

      {/* Features & Pricing */}
      <Route path="/features" element={
        <Suspense fallback={<LoadingFallback />}>
          <FeaturesPage onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
        </Suspense>
      } />

      <Route path="/pricing" element={
        <Suspense fallback={<LoadingFallback />}>
          <PricingPage onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
        </Suspense>
      } />

      {/* Skill Assessment */}
      <Route path="/skill-assessment" element={
        <Suspense fallback={<LoadingFallback />}>
          <SkillAssessmentPage onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
        </Suspense>
      } />

      {/* Interviews */}
      <Route path="/interviews" element={
        user ? (
          user.type === 'candidate' ? (
            <Suspense fallback={<LoadingFallback />}>
              <CandidateInterviewsPage onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
            </Suspense>
          ) : (
            <div className="min-h-screen bg-gray-50">
              <Header onNavigate={onNavigate} user={user as any} onLogout={onLogout} />
              <Footer onNavigate={onNavigate} />
              <MobileNavigation onNavigate={onNavigate} currentPage="interviews" />
            </div>
          )
        ) : <Navigate to="/role-selection" replace />
      } />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

