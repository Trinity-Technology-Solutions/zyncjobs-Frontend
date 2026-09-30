import React, { useState, useEffect, useMemo } from 'react';
import { Briefcase, MessageSquare, FileText, Bookmark, Settings, Trash2, LogOut, Bell, Users, UserPlus, MapPin, Mail, TrendingUp, BarChart2, Search, Calendar, Clock, Video, Sparkles, Shield, RefreshCw, AlertTriangle, Flame, PartyPopper, Link2, X } from 'lucide-react';
import CandidateProfileView from './CandidateProfileView';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { API_ENDPOINTS } from '../config/constants';
import config from '../config/env';
import { io } from 'socket.io-client';
import BackButton from '../components/BackButton';
import AutoRejectionSettings from '../components/AutoRejectionSettings';
import { apiFetch } from '../api/apiFetch';
import CandidateCredentialing from '../components/CandidateCredentialing';
import ScheduleInterviewModal from '../components/ScheduleInterviewModal';
import { tokenStorage } from '../utils/tokenStorage';
import ResumeModal from '../components/ResumeModal';
import NotificationService, { Notification } from '../services/notificationService';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast, ToastType } from '../hooks/useToast';
import NotificationComponent from '../components/Notification';
import JobRefreshButton from '../components/JobRefreshButton';
import BulkJobRefresh from '../components/BulkJobRefresh';
import ProfileCompletionPopup from '../components/ProfileCompletionPopup';
import AutocompleteCombobox from '../components/AutocompleteCombobox';
import { calculateEmployerProfileCompletion } from '../utils/logoUtils';
import { scoreCandidate, mergeCandidateSkills } from '../utils/candidateScoring';
import { formatInterviewDate, formatInterviewTime } from '../utils/interviewScheduleUtils';

// Module-level cache: job IDs confirmed missing from the DB — never re-fetch these
const _missingJobIds = new Set<string>();
const DISMISSED_NOTIFS_KEY = 'employer_dismissed_notif_ids';
const CLEARED_ALL_KEY = 'employer_notif_cleared_at';

// ── Match score for application cards — same chain as Candidate Ranking:
//    stored AI score → backend hybrid-score → local fallback (shared util) ──
const getApplicantMatchScore = (app: any, matchScores: Record<string, number | null>): number | null => {
  const cached = matchScores[String(app._id || app.id)];
  if (cached !== undefined) return cached;
  const score = app.aiAnalysis?.overallScore || app.aiScore || 0;
  return score > 0 ? Math.min(100, Math.round(score)) : null;
};

const matchScoreClasses = (score: number | null) => {
  if (score === null) return 'bg-gray-100 text-gray-500 border-gray-200';
  if (score >= 70) return 'bg-slate-100 text-[#1e3a8a] border-slate-200';
  if (score >= 40) return 'bg-slate-50 text-slate-700 border-slate-200';
  return 'bg-slate-50 text-slate-600 border-slate-200';
};

interface EmployerDashboardPageProps {
  user?: any;
  onNavigate: (page: string, params?: any) => void;
  onLogout?: () => void;
}

const EmployerDashboardPage: React.FC<EmployerDashboardPageProps> = ({ onNavigate, onLogout }) => {
  const { toast, showToast, hideToast } = useToast();
  const [confirm, setConfirm] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>(
    { isOpen: false, title: '', message: '', onConfirm: () => {} }
  );
  const openConfirm = (title: string, message: string, onConfirm: () => void) =>
    setConfirm({ isOpen: true, title, message, onConfirm });
  const closeConfirm = () => setConfirm(c => ({ ...c, isOpen: false }));

  const [user, setUser] = useState<any>(null);
  const [employerName, setEmployerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  // Authoritative company record from backend (same source Edit Profile uses) so profile
  // completion reflects saved data immediately after login, not stale registration fields.
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  // Role-based access: Owner = full, Recruiter = post+manage, Viewer = read-only
  const [teamRole, setTeamRole] = useState<'Owner' | 'Recruiter' | 'Viewer' | null>(null);
  // null = original owner (no teamRole set) = full access
  const isOwner = !teamRole || teamRole === 'Owner';
  const isRecruiter = teamRole === 'Recruiter';
  const isViewer = teamRole === 'Viewer';
  const canPostJobs = isOwner || isRecruiter;
  const canManageApplications = isOwner || isRecruiter;
  const canInviteMembers = isOwner;
  const canViewAnalytics = true; // all roles
  const canAccessTeam = isOwner;
  const canAccessSettings = isOwner;
  const canAccessCredentialing = isOwner;
  const canAccessAIRejection = isOwner;
  const canAccessSavedCandidates = isOwner || isRecruiter;
  const canAccessCandidateRanking = isOwner || isRecruiter;
  const canAccessAIRecruiter = isOwner || isRecruiter;
  const canDeleteRecords = isOwner || isRecruiter;
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);

  // Enriched applications with candidate skills for consistent scoring
  const [enrichedApps, setEnrichedApps] = useState<any[]>([]);

  // Match scores for application cards — same chain as Candidate Ranking:
  const [matchScores, setMatchScores] = useState<Record<string, number | null>>({});
  const matchScoreCache = React.useRef<Record<string, number | null>>({});

  // Enrich applications with the same structure as Candidate Ranking
  useEffect(() => {
    if (!applications.length) return;
    
    const enriched = applications.map(app => ({
      ...app,
      candidateSkills: mergeCandidateSkills(app),
      candidateExperience: app.candidateProfile?.experience || app.candidateProfile?.yearsExperience || app.experience || 'Not specified',
      candidateEducation: app.candidateProfile?.education || 'Not specified',
      candidateLocation: app.candidateProfile?.location || '',
      candidateJobTitle: app.candidateProfile?.jobTitle || app.candidateProfile?.title || app.currentJobTitle || '',
    }));
    
    setEnrichedApps(enriched);
  }, [applications]);

  // Calculate all scores immediately when enriched apps or jobs change
  useEffect(() => {
    if (!enrichedApps.length || !jobs.length) return;

    const calculateScores = async () => {
      const newScores: Record<string, number | null> = {};
      const promises = enrichedApps.map(async (app) => {
        const id = String(app._id || app.id);
        try {
          const s = await scoreCandidate(app, jobs);
          newScores[id] = s;
        } catch {
          newScores[id] = null;
        }
      });

      await Promise.all(promises);
      matchScoreCache.current = { ...matchScoreCache.current, ...newScores };
      setMatchScores({ ...matchScoreCache.current });
    };

    calculateScores();
  }, [enrichedApps, jobs]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const getDismissedIds = (): Set<string> => {
    try { return new Set(JSON.parse(localStorage.getItem(DISMISSED_NOTIFS_KEY) || '[]')); } catch { return new Set(); }
  };
  const getNotifClearedAt = (): number => parseInt(localStorage.getItem(CLEARED_ALL_KEY) || '0', 10);
  const filterNotifications = (list: Notification[]): Notification[] => {
    const clearedAt = getNotifClearedAt();
    const dismissed = getDismissedIds();
    return list.filter(n => !dismissed.has(n.id) && new Date(n.createdAt).getTime() > clearedAt);
  };
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingSaved, setRefreshingSaved] = useState(false);
  const [activeMenu, setActiveMenu] = useState(() => sessionStorage.getItem('employer_active_menu') || 'dashboard');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [savedCandidates, setSavedCandidates] = useState<any[]>([]);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [selectedResumeAppId, setSelectedResumeAppId] = useState<string | null>(null);
  const [selectedResumeUrl, setSelectedResumeUrl] = useState<string | null>(null);
  const [selectedResumeCandidateName, setSelectedResumeCandidateName] = useState<string | null>(null);
  const [selectedResumeCandidateEmail, setSelectedResumeCandidateEmail] = useState<string | null>(null);
  const [appFilterJob, setAppFilterJob] = useState('all');
  const [appFilterStatus, setAppFilterStatus] = useState('all');
  const [appSearch, setAppSearch] = useState('');
  const [viewingCandidateId, setViewingCandidateId] = useState<string | null>(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [closingJobId, setClosingJobId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState({
    newApplications: true,
    interviewConfirmations: true,
    jobPostingUpdates: true,
    weeklySummary: false
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  const getToken = () => tokenStorage.getAccess();

  // Ensure logout always redirects to employer login
  useEffect(() => { localStorage.setItem('lastUserType', 'employer'); }, []);



  useEffect(() => {
    const token = getToken();
    if (token) {
      fetch(`${API_ENDPOINTS.SAVED_CANDIDATES}`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.ok ? res.json() : [])
        .then(data => setSavedCandidates(Array.isArray(data) ? data : data.savedCandidates || []))
        .catch(() => setSavedCandidates([]));
    }

    const handleCandidateSaved = () => {
      const t = getToken();
      if (t) {
        fetch(`${API_ENDPOINTS.SAVED_CANDIDATES}`, { headers: { 'Authorization': `Bearer ${t}` } })
          .then(res => res.ok ? res.json() : [])
          .then(data => setSavedCandidates(Array.isArray(data) ? data : data.savedCandidates || []))
          .catch(() => {});
      }
    };

    window.addEventListener('candidateSaved', handleCandidateSaved as EventListener);
    return () => window.removeEventListener('candidateSaved', handleCandidateSaved as EventListener);
  }, []);

  // Persist active menu to sessionStorage on every change
  useEffect(() => { sessionStorage.setItem('employer_active_menu', activeMenu); }, [activeMenu]);

  // Deep-link from email or navigation: /dashboard#interviews opens Interviews tab
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['dashboard', 'applications', 'interviews', 'saved-candidates', 'alerts', 'team', 'auto-rejection', 'credentialing'].includes(hash)) {
        setActiveMenu(hash);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    if (activeMenu === 'saved-candidates') {
      const token = getToken();
      if (token) {
        fetch(`${API_ENDPOINTS.SAVED_CANDIDATES}`, { headers: { 'Authorization': `Bearer ${token}` } })
          .then(res => res.ok ? res.json() : [])
          .then(data => setSavedCandidates(Array.isArray(data) ? data : data.savedCandidates || []))
          .catch(() => setSavedCandidates([]));
      }
    }
  }, [activeMenu]);

  useEffect(() => {
    // Fetch dynamic notifications using the notification service
    const fetchNotifications = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          const userEmail = parsedUser.email;
          
          const dynamicNotifications = await NotificationService.fetchNotifications(userEmail);
          setNotifications(filterNotifications(dynamicNotifications));
        }
      } catch (error) {
        console.error('Error fetching dynamic notifications:', error);
        // Fallback to creating notifications from activity if API fails
        createFallbackNotifications();
      }
    };
    
    const createFallbackNotifications = () => {
      // Use the notification service to create fallback notifications
      const fallbackNotifications = NotificationService.createFallbackNotifications(applications, interviews, jobs);
      setNotifications(filterNotifications(fallbackNotifications));
    };
    
    // Initial fetch
    fetchNotifications();
    
    // Set up real-time updates - fetch every 30 seconds
    const notificationInterval = setInterval(fetchNotifications, 30000);

    // Real-time: re-fetch when the backend pushes the existing notification event
    let notificationSocket: any = null;
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        const userId = parsedUser.id || parsedUser._id || parsedUser.userId;
        if (userId) {
          notificationSocket = io(config.SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: false,
            timeout: 3000,
          });
          notificationSocket.on(`notification_update:${userId}`, fetchNotifications);
          notificationSocket.on('connect_error', () => { notificationSocket?.disconnect(); });
        }
      }
    } catch { /* socket optional — refresh still works via polling */ }
    
    return () => {
      clearInterval(notificationInterval);
      if (notificationSocket) notificationSocket.disconnect();
    };
  }, []); // Run once on mount only

  // Fetch saved alert preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/user-preferences`);
        if (!res.ok) return;
        const data = await res.json();
        const np = data.notificationPreferences;
        if (np) {
          setPrefs({
            newApplications: np.newApplications ?? true,
            interviewConfirmations: np.interviewConfirmations ?? true,
            jobPostingUpdates: np.jobPostingUpdates ?? true,
            weeklySummary: np.weeklySummary ?? false,
          });
        }
      } catch { /* preferences are optional */ }
    };
    fetchPreferences();
  }, []);

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      // Check if we have a valid (non-expired) access token and refresh if needed
      let accessToken = tokenStorage.getAccess();
      if (accessToken) {
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            accessToken = null;
          }
        } catch {
          accessToken = null;
        }
      }
      if (!accessToken) {
        const refreshToken = tokenStorage.getRefresh();
        if (refreshToken) {
          try {
            const refreshRes = await fetch(`${API_ENDPOINTS.BASE_URL}/users/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            });
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              if (refreshData.accessToken) {
                tokenStorage.setAccess(refreshData.accessToken);
                accessToken = refreshData.accessToken;
              }
            }
          } catch { /* refresh failed */ }
        }
      }
      if (!accessToken) {
        showToast('Session expired. Please refresh the page and log in again.', 'error');
        return;
      }

      const res = await fetch(`${API_ENDPOINTS.BASE_URL}/user-preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          notificationPreferences: {
            newApplications: prefs.newApplications,
            interviewConfirmations: prefs.interviewConfirmations,
            jobPostingUpdates: prefs.jobPostingUpdates,
            weeklySummary: prefs.weeklySummary,
          }
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Failed to save preferences');
      }
      showToast('Preferences saved successfully', 'success');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to save preferences. Please try again.',
        'error'
      );
    } finally {
      setSavingPrefs(false);
    }
  };

  const closeJob = async (jobId: string) => {
    if (!jobId) return;
    openConfirm(
      'Close Job',
      'Are you sure you want to close this job posting? This will stop new applications from being accepted.',
      async () => {
        closeConfirm();
        setClosingJobId(jobId);
        try {
          const response = await apiFetch(`${API_ENDPOINTS.BASE_URL}/jobs/${jobId}/close`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'closed' })
          });

          if (response.ok) {
            setJobs(prev => prev.map(job => (job._id || job.id) === jobId ? { ...job, status: 'closed' } : job));
            showToast('Job closed successfully.', 'success');
          } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.error || 'Failed to close job');
          }
        } catch (error) {
          console.error('Error closing job:', error);
          showToast(error instanceof Error ? error.message : 'Failed to close job. Please try again.', 'error');
        } finally {
          setClosingJobId(null);
        }
      }
    );
  };

  useEffect(() => {
    // Prefer the user prop from App.tsx (React state) as primary source of truth.
    // Fall back to localStorage only when prop is not available.
    const sourceData = user || (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
    if (sourceData && Object.keys(sourceData).length > 0) {
      setJobs([]);
      setApplications([]);
      setInterviews([]);
      setDashboardStats(null);
      setRecentActivity([]);
      
      setUser(sourceData);
      setEmployerName(sourceData.name || 'Employer');
      fetchCompanyProfileData(sourceData);
      // Live fetch team role from backend on every load
      const _ue = sourceData.email;
      if (_ue) {
        fetch(`${import.meta.env.VITE_API_URL || '/api'}/team/check?memberEmail=${encodeURIComponent(_ue)}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data?.hasInvite && data.role) {
              const liveRole = data.role as 'Owner' | 'Recruiter' | 'Viewer';
              setTeamRole(liveRole);
              // data.employerId = owner's email/id used to identify the team
              const resolvedOwner = data.employerId || _ue;
              setOwnerEmailState(resolvedOwner);
              const _s = JSON.parse(localStorage.getItem('user') || '{}');
              _s.teamRole = liveRole;
              _s.employerOwnerId = resolvedOwner;
              _s.ownerEmail = resolvedOwner;
              localStorage.setItem('user', JSON.stringify(_s));
              // Pass ownerEmail so fetchDashboardData uses owner's data
              fetchDashboardData({ ...sourceData, employerOwnerId: resolvedOwner, ownerEmail: resolvedOwner, teamRole: liveRole });
              fetchCompanyProfileData({ ...sourceData, ownerEmail: resolvedOwner });
            } else {
              setTeamRole('Owner');
              setOwnerEmailState(_ue);
              // Owner — fetch with own email
              fetchDashboardData({ ...sourceData, employerOwnerId: null, ownerEmail: _ue });
              fetchCompanyProfileData({ ...sourceData, ownerEmail: _ue });
            }
          })
          .catch(() => {
            if (sourceData.teamRole) setTeamRole(sourceData.teamRole as 'Owner' | 'Recruiter' | 'Viewer');
            const fallbackOwner = sourceData.employerOwnerId || _ue;
            setOwnerEmailState(fallbackOwner);
            fetchDashboardData({ ...sourceData, employerOwnerId: sourceData.employerOwnerId || null });
          });
      }
      // Fix: Use actual company name from registration, not generic 'Company'
      // For team members, prefer the owner's companyName stored in their profile
      const actualCompanyName = sourceData.companyName || sourceData.ownerCompanyName || sourceData.company || sourceData.organizationName || 'Company';
      setCompanyName(actualCompanyName);
      setCompanyLogo(sourceData.companyLogo || '');
      
      // Check if profile completion popup should be shown
      // Only show for FIRST TIME after registration (not on subsequent visits)
      const hasCompletedProfile = sourceData.industry && 
                                 sourceData.companySize && 
                                 sourceData.headquarters && 
                                 sourceData.companyDescription &&
                                 sourceData.companyWebsite &&
                                 sourceData.tagline;
      
      const hasSeenPopup = localStorage.getItem('hasSeenProfilePopup');
      const isFirstVisit = sessionStorage.getItem('isFirstVisitAfterRegistration'); // Only for current session
      
      // Show popup ONLY if:
      // 1. Profile is not complete AND
      // 2. This is their first visit after registration (session flag exists) AND
      // 3. They haven't seen the popup before
      if (!hasCompletedProfile && isFirstVisit && !hasSeenPopup) {
        // Show popup after a short delay to let dashboard load
        setTimeout(() => {
          setShowProfilePopup(true);
        }, 1500);
        
        // Clear the first visit flag so popup won't show on page refresh
        sessionStorage.removeItem('isFirstVisitAfterRegistration');
      }
      
      // NOTE: fetchDashboardData is already called inside the /team/check .then() block above
      // Do NOT call it again here — that causes team members to see 0 data
    }
    
    // Listen for alerts navigation event from header
    const handleShowAlerts = () => setActiveMenu('alerts');
    const handleShowApplications = () => setActiveMenu('applications');
    
    window.addEventListener('showAlerts', handleShowAlerts);
    window.addEventListener('showApplications', handleShowApplications);
    
    return () => {
      window.removeEventListener('showAlerts', handleShowAlerts);
      window.removeEventListener('showApplications', handleShowApplications);
    };
  }, []);

  // Sync user state when App.tsx updates the user (session restore, etc.)
  useEffect(() => {
    const syncUser = () => {
      const raw = localStorage.getItem('user');
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        setUser(parsed);
        setEmployerName(parsed.name || 'Employer');
        const actualCompanyName = parsed.companyName || parsed.ownerCompanyName || parsed.company || parsed.organizationName || 'Company';
        setCompanyName(actualCompanyName);
        setCompanyLogo(parsed.companyLogo || '');
        fetchCompanyProfileData(parsed);
      } catch { /* ignore */ }
    };

    window.addEventListener('zync:user-updated', syncUser);
    window.addEventListener('storage', syncUser);
    return () => {
      window.removeEventListener('zync:user-updated', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  // Fetch the authoritative company record from the backend (same endpoint Edit Profile
  // uses) so the dashboard shows the same up-to-date completion percentage immediately
  // after login, without requiring a manual Save. Non-critical: falls back to user fields.
  const fetchCompanyProfileData = async (userData: any) => {
    try {
      const ownerEmail = userData?.ownerEmail || userData?.employerOwnerId || userData?.employerEmail || userData?.email;
      if (!ownerEmail) return;
      const domain = ownerEmail.split('@')[1]?.toLowerCase();
      if (!domain) return;
      const res = await apiFetch(`${API_ENDPOINTS.COMPANIES}/by-domain/${encodeURIComponent(domain)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data && (data.name || data.companyName)) {
        setCompanyProfile(data);
      }
    } catch {
      // non-critical: keep existing completion source
    }
  };

  const profileCompletion = useMemo(() => {
    if (!user) return 0;
    return calculateEmployerProfileCompletion({ ...user, ...companyProfile });
  }, [user, companyProfile]);

  // Add effect to refresh data when component becomes visible
  useEffect(() => {
    let lastRefresh = 0;
    const handleVisibilityChange = () => {
      const now = Date.now();
      if (!document.hidden && user && now - lastRefresh > 300000) {
        lastRefresh = now;
        fetchDashboardData(user);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  // Add effect to refresh data when returning to dashboard
  useEffect(() => {
    const handleFocus = () => {}; // removed aggressive refetch
    
    const handleJobDeleted = (e: Event) => { 
      console.log('🗑️ Dashboard: Job deleted event received', (e as CustomEvent).detail);
      if (user) {
        // Immediately update local state to remove the deleted job
        const deletedJobId = (e as CustomEvent).detail?.jobId;
        if (deletedJobId) {
          setJobs(prev => prev.filter(job => (job.id || job._id) !== deletedJobId));
          console.log('📊 Dashboard: Removed job from local state:', deletedJobId);
        }
        // Then fetch fresh data from server
        fetchDashboardData(user);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('jobDeleted', handleJobDeleted as EventListener);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('jobDeleted', handleJobDeleted as EventListener);
    };
  }, [user]);

  const fetchDashboardData = async (userData: any) => {
    // Guard: don't fetch if no auth token — avoids 401 spam on mount
    if (!tokenStorage.getAccess() && !tokenStorage.getRefresh()) return;
    try {
      setError(null);
      const userId = userData.id || userData._id || userData.userId;
      // For team members: use the owner's employerId to fetch owner's data
      const ownerEmployerId = userData.employerId; // set by backend when team member is created
      const userEmail = userData.email;
      // ownerEmail: for team members this is the owner's email; for owners it's their own email
      const userName = userData.name || userData.fullName;
      // For team members, use the owner's email/company to load shared company data
      const ownerEmail = userData.ownerEmail || userData.employerOwnerId || userData.employerEmail || userEmail;
      
      let employerJobs = [];
      let employerApps = [];
      let dashboardStats = { activeJobs: 0, applications: 0, interviews: 0, hired: 0 };
      let recentActivity = [];
      
      // Fetch Jobs — use employer/email endpoint for precise server-side filtering
      try {
        const jobsRes = await apiFetch(`${API_ENDPOINTS.BASE_URL}/jobs/employer/email/${encodeURIComponent(ownerEmail)}`);
        if (jobsRes.ok) {
          const allJobs = await jobsRes.json();
          const myEmployerId = userData.employerId;
          employerJobs = Array.isArray(allJobs) ? allJobs.filter((job: any) => {
            const email = ownerEmail?.toLowerCase().trim();
            const selfEmail = userEmail?.toLowerCase().trim();
            // Match by owner email or self email
            const matchesEmail = job.postedBy?.toLowerCase().trim() === email || 
                                 job.employerEmail?.toLowerCase().trim() === email ||
                                 job.postedBy?.toLowerCase().trim() === selfEmail || 
                                 job.employerEmail?.toLowerCase().trim() === selfEmail;
            // Match by employerId (owner's ID stored on team member)
            const matchesEmployerId = ownerEmployerId && (
              job.employerId === ownerEmployerId ||
              job.postedByEmployerId === ownerEmployerId
            );
            // Also match by myEmployerId from stored user
            const matchesMyEmployerId = myEmployerId && (
              job.employerId === myEmployerId ||
              job.postedByEmployerId === myEmployerId
            );
            return matchesEmail || matchesEmployerId || matchesMyEmployerId;
          }) : [];
          setJobs(employerJobs);
          dashboardStats.activeJobs = employerJobs.length;
        } else {
          if (jobsRes.status === 500) setError('Server error while loading jobs. Please try again later.');
          else setError(`Failed to load jobs: ${jobsRes.status} ${jobsRes.statusText}`);
          setJobs([]);
        }
      } catch (error) {
        console.error('Jobs API network error:', error);
        setError('Network error while loading jobs.');
        setJobs([]);
      }

      // Fetch Applications — server-side filtered by ownerEmail
      try {
        const appsRes = await apiFetch(`${API_ENDPOINTS.APPLICATIONS}?employerEmail=${encodeURIComponent(ownerEmail)}`);
        if (appsRes.ok) {
          const response = await appsRes.json();
          const allApps = response.applications || response || [];
          // Enrich with job titles
          const appsWithJobDetails = await Promise.all(
            allApps.map(async (app: any) => {
              const appJobId = app.jobId?.id || app.jobId?._id || app.jobId;
              // Skip enrichment if jobId missing, non-string, already has title, or known 404
              if (appJobId && typeof appJobId === 'string' && appJobId !== 'undefined' && !app.jobTitle && !_missingJobIds.has(appJobId)) {
                try {
                  const jobRes = await apiFetch(`${API_ENDPOINTS.JOBS}/${appJobId}`);
                  if (jobRes.ok) {
                    const jobData = await jobRes.json();
                    return { ...app, jobTitle: jobData.jobTitle || jobData.title || 'Job Position' };
                  }
                  _missingJobIds.add(appJobId);
                } catch { /* non-critical */ }
              }
              return app;
            })
          );
          employerApps = appsWithJobDetails;
          setApplications(employerApps);
          dashboardStats.applications = employerApps.length;
        } else {
          setApplications([]);
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
        setApplications([]);
      }

      // Fetch Interviews (non-critical, fail silently)
      try {
        // Use the available employer ID — prefer ownerEmployerId, fallback to userId
        const interviewEmployerId = ownerEmployerId || userId || '';
        const interviewsRes = await apiFetch(`${API_ENDPOINTS.BASE_URL}/interviews?employerId=${encodeURIComponent(interviewEmployerId)}&employerEmail=${encodeURIComponent(ownerEmail || '')}`);
        if (interviewsRes.ok) {
          const interviewsData = await interviewsRes.json();
          const interviewsArray = Array.isArray(interviewsData) ? interviewsData : [];
          
          // Fetch job details for each interview
          const interviewsWithJobDetails = await Promise.all(
            interviewsArray.map(async (interview: any) => {
              try {
                const jobId = interview.jobId?.id || interview.jobId?._id || interview.jobId;
                if (jobId && typeof jobId === 'string') {
                  const jobRes = await apiFetch(`${API_ENDPOINTS.JOBS}/${jobId}`);
                  if (jobRes.ok) {
                    const jobData = await jobRes.json();
                    return { ...interview, jobTitle: jobData.jobTitle || jobData.title || 'Interview' };
                  }
                }
              } catch (e) {
                console.log('Failed to fetch job for interview:', interview._id);
              }
              return interview;
            })
          );
          
          setInterviews(interviewsWithJobDetails);
          dashboardStats.interviews = interviewsWithJobDetails.length;
        } else {
          setInterviews([]);
        }
      } catch (err) {
        console.error('Error fetching interviews:', err);
        setInterviews([]);
      }

      // Fetch Dashboard Stats (non-critical, fail silently)
      try {
        const myCompanyForStats = userData.companyName || userData.company || '';
        const statsRes = await apiFetch(`${API_ENDPOINTS.BASE_URL}/dashboard/stats?employerId=${encodeURIComponent(userId || '')}&employerEmail=${encodeURIComponent(ownerEmail || '')}&userName=${encodeURIComponent(userName || '')}&companyName=${encodeURIComponent(myCompanyForStats)}`);
        if (statsRes.ok) {
          const stats = await statsRes.json();
          dashboardStats = { ...dashboardStats, ...stats };
        }
      } catch {
        // non-critical use locally computed stats
      }
      setDashboardStats(dashboardStats);

      // Fetch Recent Activity (non-critical, fail silently)
      try {
        const activityRes = await apiFetch(`${API_ENDPOINTS.BASE_URL}/dashboard/recent-activity?employerId=${encodeURIComponent(userId || '')}&employerEmail=${encodeURIComponent(ownerEmail || '')}&userName=${encodeURIComponent(userName || '')}`);
        if (activityRes.ok) {
          const activity = await activityRes.json();
          recentActivity = activity;
        }
      } catch {
        // non-critical fallback to local activity below
      }
      
      // If no activity from API, create from local jobs
      if (recentActivity.length === 0 && employerJobs.length > 0) {
        recentActivity = employerJobs.slice(0, 3).map((job: any) => ({
          type: 'job',
          message: 'Job posted successfully',
          time: '1 day ago',
          details: { jobTitle: job.jobTitle || job.title }
        }));
      }
      setRecentActivity(recentActivity);
      
    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
      setError('Some dashboard data could not be loaded. Please refresh the page.');
      // Set fallback empty states
      setApplications([]);
      setJobs([]);
      setInterviews([]);
      setDashboardStats({ activeJobs: 0, applications: 0, interviews: 0, hired: 0 });
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };


  const getDisplayLogo = () => {
    if (companyLogo && companyLogo.trim() !== '') return companyLogo;

    const isTrinity = user?.email?.includes('@trinitetech') || user?.email?.includes('trinity') ||
                     companyName?.toLowerCase().includes('trinity') || employerName?.toLowerCase().includes('trinity');
    if (isTrinity) return '/images/trinity-logo.webp';

    const isInypeople = companyName?.toLowerCase().includes('inypeople') || companyName?.toLowerCase().includes('iny people') ||
                       employerName?.toLowerCase().includes('inypeople') || employerName?.toLowerCase().includes('iny people');
    if (isInypeople) return '/images/company-logos/inypeople-logo.png';

    const isNambikkai = companyName?.toLowerCase().includes('nambikkai') || employerName?.toLowerCase().includes('nambikkai');
    if (isNambikkai) return '/images/company-logos/nambikkai-logo.png';

    const API_BASE = (typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_URL || '/api' : '/api');
    const domainMap: Record<string, string> = {
      zoho: 'zoho.com', tcs: 'tcs.com', infosys: 'infosys.com', wipro: 'wipro.com',
      google: 'google.com', microsoft: 'microsoft.com', amazon: 'amazon.com',
      accenture: 'accenture.com', cognizant: 'cognizant.com', hcl: 'hcltech.com',
      oracle: 'oracle.com', ibm: 'ibm.com', capgemini: 'capgemini.com',
    };
    const n = (companyName || '').toLowerCase();
    for (const [key, domain] of Object.entries(domainMap)) {
      if (n.includes(key)) return `${API_BASE}/logo-proxy?domain=${encodeURIComponent(domain)}`;
    }

    if (user?.email?.includes('@')) {
      const emailDomain = user.email.split('@')[1];
      if (emailDomain && !['gmail.com','yahoo.com','outlook.com','hotmail.com'].includes(emailDomain)) {
        return `${API_BASE}/logo-proxy?domain=${encodeURIComponent(emailDomain)}`;
      }
    }

    const displayName = companyName && companyName !== 'Company' ? companyName : employerName;
    const initials = displayName.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2);
    return `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="32" fill="#1d4ed8"/>
        <text x="32" y="40" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="20" font-weight="bold">${initials}</text>
      </svg>`
    )}`;
  };


  // ── Analytics helpers ──────────────────────────────────────────────
  const analyticsRange = useMemo(() => {
    // Last 7 days labels
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    });
  }, []);

  const applicationsOverTime = useMemo(() => {
    return analyticsRange.map((label, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
      const count = applications.filter(a => {
        const date = new Date(a.createdAt || a.appliedAt || a.updatedAt);
        return date.getFullYear() === y && date.getMonth() === m && date.getDate() === day;
      }).length;
      return { date: label, applications: count };
    });
  }, [applications, analyticsRange]);

  const statusBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    applications.forEach(a => {
      const s = a.status || 'pending';
      // Normalize 'applied' and 'pending' as same display
      const display = s === 'applied' ? 'Pending' : s.charAt(0).toUpperCase() + s.slice(1);
      map[display] = (map[display] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [applications]);

  const [chartFilterJobId, setChartFilterJobId] = useState<string>('tab:top');
  const [barsAnimated, setBarsAnimated] = useState(false);

  // ── Job Performance Score (ATS-style) ──────────────────────────────
  const jobPerformanceStats = useMemo(() => {
    const now = Date.now();
    return jobs.map(j => {
      const jId = String(j.id || j._id || '');
      const jobApps = applications.filter(a => {
        const aJobId = typeof a.jobId === 'object' ? String(a.jobId?._id || a.jobId?.id || '') : String(a.jobId || '');
        return aJobId === jId;
      });
      const appCount = jobApps.length;
      const shortlisted = jobApps.filter(a => ['shortlisted','hired'].includes(a.status)).length;
      const interviewCount = interviews.filter(i => {
        const iJobId = typeof i.jobId === 'object' ? String(i.jobId?._id || i.jobId?.id || '') : String(i.jobId || '');
        return iJobId === jId;
      }).length;
      const profileViews = j.views || j.profileViews || 0;
      const score = (appCount * 40) + (profileViews * 20) + (shortlisted * 25) + (interviewCount * 15);
      const target = j.targetApplications || 20;
      const progressPct = Math.min(Math.round((appCount / target) * 100), 100);
      const postedDaysAgo = j.createdAt ? Math.floor((now - new Date(j.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const title = j.jobTitle || j.title || 'Job';
      return { id: jId, title, appCount, shortlisted, interviewCount, score, target, progressPct, postedDaysAgo, jobData: j };
    });
  }, [jobs, applications, interviews]);

  useEffect(() => {
    if (jobPerformanceStats.length === 0) return;
    setBarsAnimated(false);
    const t = setTimeout(() => setBarsAnimated(true), 60);
    return () => clearTimeout(t);
  }, [jobPerformanceStats]);

  const PIE_COLORS = ['#2563eb', '#60a5fa', '#93c5fd', '#1e3a8a', '#64748b', '#cbd5e1'];
  
  // ── Calculate dynamic percentage changes (last 30 days vs previous 30 days) ──
  const calculatePercentageChange = (currentData: any[]) => {
    const now = new Date();
    const last30days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last60days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const currentCount = currentData.filter(item => {
      const date = new Date(item.createdAt || item.appliedAt || item.updatedAt || now);
      return date >= last30days;
    }).length;

    const previousCount = currentData.filter(item => {
      const date = new Date(item.createdAt || item.appliedAt || item.updatedAt || now);
      return date >= last60days && date < last30days;
    }).length;

    if (previousCount === 0) return currentCount > 0 ? '+100%' : '0%';
    const change = ((currentCount - previousCount) / previousCount) * 100;
    return `${change >= 0 ? '+' : ''}${Math.round(change)}%`;
  };

  // Calculate dynamic percentages for each metric
  const jobsPercentage = useMemo(() => calculatePercentageChange(jobs), [jobs]);
  const applicationsPercentage = useMemo(() => calculatePercentageChange(applications), [applications]);
  const interviewsPercentage = useMemo(() => {
    const interviewed = applications.filter(a => ['interviewed','hired'].includes(a.status));
    return calculatePercentageChange(interviewed);
  }, [applications]);
  const hiredPercentage = useMemo(() => {
    const hired = applications.filter(a => a.status === 'hired');
    return calculatePercentageChange(hired);
  }, [applications]);
  // ────────────────────────────────────────────────────────────────────

  const stats = [
    { 
      label: 'Active Jobs', 
      value: dashboardStats?.activeJobs?.toString() || '0', 
      icon: Briefcase, 
      percentage: jobsPercentage
    },
    { 
      label: 'Applications', 
      value: dashboardStats?.applications?.toString() || '0', 
      icon: Users, 
      percentage: applicationsPercentage
    },
    { 
      label: 'Interviews', 
      value: dashboardStats?.interviews?.toString() || '0', 
      icon: MessageSquare, 
      percentage: interviewsPercentage
    },
    { 
      label: 'Hired', 
      value: dashboardStats?.hired?.toString() || '0', 
      icon: UserPlus, 
      percentage: hiredPercentage
    }
  ];

  const [headerHeight, setHeaderHeight] = React.useState(0);

  React.useLayoutEffect(() => {
    const measure = () => {
      const header = document.querySelector('header');
      if (header) setHeaderHeight(header.getBoundingClientRect().height);
    };
    measure();
    const t = setTimeout(measure, 50);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); };
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [_ownerEmailState, setOwnerEmailState] = useState<string>('');
  const [accessDeniedModal, setAccessDeniedModal] = useState<{ show: boolean; feature: string; requiredRole: string }>({ show: false, feature: '', requiredRole: '' });

  // Guard function: show popup if role doesn't have access
  const withRoleCheck = (feature: string, requiredRole: 'Owner' | 'Recruiter', action: () => void) => {
    if (isOwner) { action(); return; }
    if (requiredRole === 'Recruiter' && isRecruiter) { action(); return; }
    setAccessDeniedModal({ show: true, feature, requiredRole });
  };

  const renderNavigationCard = (isMobile = false) => {
    const displayName = companyName && companyName !== 'Company' ? companyName :
      user?.email?.includes('@trinitetech') ? 'Trinity Technology Solutions' :
      user?.email?.includes('@') ? user.email.split('@')[1].split('.')[0].charAt(0).toUpperCase() + user.email.split('@')[1].split('.')[0].slice(1) :
      'Company';

    const navItems = [
      { key: 'dashboard',        label: 'Dashboard',         icon: <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>, action: () => setActiveMenu('dashboard'), show: true },
      { key: 'job-management',   label: 'Job Management',    icon: <Briefcase className="w-[18px] h-[18px] flex-shrink-0" />, action: () => withRoleCheck('Job Management', 'Recruiter', () => onNavigate('job-management')), external: true, show: true },
      { key: 'ranking',          label: 'Candidate Ranking', icon: <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, action: () => withRoleCheck('Candidate Ranking', 'Recruiter', () => onNavigate('candidate-ranking')), external: true, show: true },
      { key: 'ai-recruiter',     label: 'AI Recruiter',      icon: <Sparkles className="w-[18px] h-[18px] flex-shrink-0" />, action: () => withRoleCheck('AI Recruiter', 'Recruiter', () => onNavigate('ai-recruiter')), external: true, show: true },
      { key: 'applications',     label: 'Applications',      icon: <Users className="w-[18px] h-[18px] flex-shrink-0" />, action: () => withRoleCheck('Applications', 'Recruiter', () => setActiveMenu('applications')), badge: applications.length || null, show: true },
      { key: 'interviews',       label: 'Interviews',        icon: <MessageSquare className="w-[18px] h-[18px] flex-shrink-0" />, action: () => withRoleCheck('Interviews', 'Recruiter', () => setActiveMenu('interviews')), badge: interviews.length || null, show: true },
      { key: 'posted-jobs',      label: 'Posted Jobs',       icon: <Briefcase className="w-[18px] h-[18px] flex-shrink-0" />, action: () => withRoleCheck('Posted Jobs', 'Recruiter', () => onNavigate('my-jobs')), external: true, badge: jobs.length || null, show: true },
      { key: 'ats-dashboard',    label: 'Recruiter Analytics', icon: <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>, action: () => withRoleCheck('Recruiter Analytics', 'Recruiter', () => onNavigate('ats-dashboard')), external: true, show: true },
      { key: 'team',             label: 'Team',              icon: <Users className="w-[18px] h-[18px] flex-shrink-0" />, action: () => withRoleCheck('Team Management', 'Owner', () => setActiveMenu('team')), show: true },
      { key: 'auto-rejection',   label: 'AI Rejection',      icon: <Settings className="w-[18px] h-[18px] flex-shrink-0" />, action: () => withRoleCheck('AI Auto-Rejection', 'Owner', () => setActiveMenu('auto-rejection')), show: true },
      { key: 'candidate-search', label: 'Search Candidates', icon: <Search className="w-[18px] h-[18px] flex-shrink-0" />, action: () => withRoleCheck('Search Candidates', 'Recruiter', () => onNavigate('candidate-search')), external: true, show: true },
      { key: 'saved-candidates', label: 'Saved Candidates',  icon: <Bookmark className="w-[18px] h-[18px] flex-shrink-0" />, action: () => withRoleCheck('Saved Candidates', 'Recruiter', () => setActiveMenu('saved-candidates')), show: true },
      { key: 'credentialing',    label: 'Credentialing',     icon: <Shield className="w-[18px] h-[18px] flex-shrink-0" />, action: () => withRoleCheck('Credentialing', 'Owner', () => setActiveMenu('credentialing')), show: true },
      { key: 'settings',         label: 'Account Settings',  icon: <Settings className="w-[18px] h-[18px] flex-shrink-0" />, action: () => withRoleCheck('Account Settings', 'Owner', () => onNavigate('settings')), external: true, show: true },
    ];

    return (
      <div className={`bg-white rounded-lg shadow-sm border border-[#e2e8f0] overflow-hidden flex flex-col ${isMobile ? 'h-full' : ''}`}>
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 border-b border-[#e2e8f0] bg-white flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-[#1e3a8a] uppercase tracking-wider flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[#2563eb]" />
            Employer Menu
          </h3>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Company Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-[#f8fafc] border-b border-[#e2e8f0]">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-lg bg-white flex items-center justify-center border border-[#e2e8f0] shadow-sm overflow-hidden p-1">
                <img
                  src={getDisplayLogo()}
                  alt={companyName || employerName}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    const name = companyName || employerName;
                    if ((name.toLowerCase().includes('trinity') || 
                         user?.email?.includes('trinity') || 
                         user?.email?.includes('@trinitetech')) && 
                        !img.src.includes('trinity-logo')) {
                      img.src = img.src.includes('trinity-logo.webp') ? '/images/company-logos/trinity-logo.png' : '/images/trinity-logo.webp';
                      return;
                    }
                    if (name.toLowerCase().includes('nambikkai') && !img.src.includes('nambikkai-logo.png')) {
                      img.src = '/images/company-logos/nambikkai-logo.png';
                      return;
                    }
                    const initials = name.split(' ').map((word: string) => word.charAt(0)).join('').toUpperCase().substring(0, 2);
                    const fallbackUrl = `data:image/svg+xml,${encodeURIComponent(
                      `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#1e3a8a"/><text x="32" y="40" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="20" font-weight="bold">${initials}</text></svg>`
                    )}`;
                    if (img.src !== fallbackUrl) img.src = fallbackUrl;
                  }}
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#1e3a8a] text-sm leading-tight truncate">{employerName}</p>
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5 leading-snug">
                {displayName}
              </p>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border mt-1 ${
                teamRole === 'Owner' || !teamRole ? 'bg-slate-100 text-[#1e3a8a] border-slate-200' :
                teamRole === 'Recruiter' ? 'bg-slate-50 text-[#1e3a8a] border-slate-200' :
                'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {teamRole === 'Owner' || !teamRole ? 'Admin / Owner' : teamRole}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Strength bar */}
        <div className="px-4 sm:px-5 py-3 bg-[#f8fafc] border-b border-[#e2e8f0]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-700 font-semibold tracking-wide">
              Profile Strength
            </span>
            <span className="text-xs font-bold text-[#2563eb] bg-[#eff6ff] border border-[#bfdbfe] px-2 py-0.5 rounded-full">
              {profileCompletion}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${
                profileCompletion >= 80 ? 'bg-[#2563eb]' :
                profileCompletion >= 50 ? 'bg-[#2563eb]' : 'bg-slate-400'
              }`}
              style={{ width: `${profileCompletion}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            {profileCompletion < 50
              ? 'Add company details to stand out'
              : profileCompletion < 80
                ? 'Almost there! Complete profile'
                : 'Great company profile!'}
          </p>
        </div>

        {/* Nav list */}
        <nav className="p-2.5 space-y-1 flex-1 overflow-y-auto">
          {navItems.filter(item => item.show).map(item => {
            const isActive = activeMenu === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  item.action();
                  if (isMobile) setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-left font-medium text-sm group ${
                  isActive
                    ? 'bg-[#2563eb] text-white shadow-sm font-semibold'
                    : 'text-slate-700 hover:bg-[#eff6ff] hover:text-[#1e3a8a]'
                }`}
              >
                <span className={`flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-[#2563eb]'}`}>
                  {item.icon}
                </span>
                <span className="leading-tight flex-1 truncate">{item.label}</span>
                {item.badge ? (
                  <span className={`flex-shrink-0 min-w-[20px] h-[20px] px-1.5 rounded-full font-bold flex items-center justify-center text-[10px] ${
                    isActive ? 'bg-white text-[#2563eb]' : 'bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]'
                  }`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}

          {/* Delete Account */}
          <button
            onClick={() => {
              if (isMobile) setSidebarOpen(false);
              if (!isOwner) { setAccessDeniedModal({ show: true, feature: 'Delete Account', requiredRole: 'Owner' }); return; }
              openConfirm(
                'Delete Account',
                'This will permanently delete your account, all posted jobs, applications, and data. This cannot be undone. Are you sure?',
                async () => {
                  closeConfirm();
                  try {
                    const userId = user.id || user._id;
                    if (!userId) { showToast('Could not identify user. Please log in again.', 'error'); return; }
                    const token = getToken();
                    const res = await apiFetch(`${import.meta.env.VITE_API_URL || '/api'}/users/${encodeURIComponent(userId)}`, {
                      method: 'DELETE',
                    });
                    if (res.ok) {
                      localStorage.clear();
                      sessionStorage.clear();
                      showToast('Account deleted successfully. Redirecting...', 'success');
                      setTimeout(() => { if (onLogout) onLogout(); onNavigate('home'); }, 1500);
                    } else {
                      const err = await res.json().catch(() => ({}));
                      showToast(err.error || 'Failed to delete account. Please try again.', 'error');
                    }
                  } catch {
                    showToast('Network error. Please try again.', 'error');
                  }
                }
              );
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors text-left text-xs font-medium mt-1"
          >
            <Trash2 className="w-4 h-4 flex-shrink-0" />
            <span>Delete Account</span>
          </button>
        </nav>

        {/* Logout Button */}
        <div className="p-2.5 border-t border-[#e2e8f0] bg-white mt-auto">
          <button
            onClick={() => {
              if (isMobile) setSidebarOpen(false);
              if (onLogout) { onLogout(); } else { localStorage.removeItem('user'); onNavigate('home'); }
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:text-[#1e3a8a] hover:bg-slate-50 transition-colors font-semibold text-xs sm:text-sm"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    );
  };

  if (viewingCandidateId) {
    return (
      <div className="fixed inset-0 z-[9999] overflow-y-auto bg-white">
        <CandidateProfileView
          candidateId={viewingCandidateId}
          onNavigate={onNavigate}
          onBack={() => setViewingCandidateId(null)}
          onLogout={onLogout}
        />
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-[#f8fafc] font-['IBM_Plex_Sans'] text-slate-800">
      {/* Error Display */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded z-50 max-w-xs sm:max-w-md text-sm shadow-md">
          <div className="flex items-start">
            <span className="mr-2 mt-0.5 text-sm">⚠️</span>
            <div className="flex-1">
              <div className="font-medium text-sm">Dashboard Loading Issue</div>
              <div className="text-xs sm:text-sm mt-1">{error}</div>
            </div>
            <button onClick={() => setError(null)} className="ml-2 sm:ml-4 text-red-500 hover:text-red-700 font-bold text-lg leading-none">&times;</button>
          </div>
        </div>
      )}

      {/* Top Dashboard Header Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3.5 sm:pt-4 pb-0">
        <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm px-3.5 sm:px-5 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3.5 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <BackButton
                fallback="/"
                text="Back to Home"
                className="!w-9 !h-9 !border !border-slate-200 hover:!border-slate-300 !bg-slate-50 hover:!bg-slate-100 !text-slate-600 hover:!text-[#1e3a8a] !shadow-sm !rounded-lg transition-all flex items-center justify-center flex-shrink-0"
              />
            </div>
            <div className="h-7 w-px bg-[#e2e8f0] hidden sm:block flex-shrink-0" />
            
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#1e3a8a] shadow-sm transition-colors flex items-center justify-center flex-shrink-0"
              aria-label="Open employer navigation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Page / Section Title & Subtitle */}
            <div className="min-w-0 flex-1 pr-2">
              <h1 className="text-base sm:text-[17px] lg:text-xl font-bold text-[#1e3a8a] tracking-tight leading-tight">
                {activeMenu === 'dashboard' ? (
                  <>
                    <span className="sm:hidden">Dashboard</span>
                    <span className="hidden sm:inline">Employer Dashboard</span>
                  </>
                ) :
                 activeMenu === 'applications' ? 'Applications' :
                 activeMenu === 'interviews' ? 'Interviews' :
                 activeMenu === 'saved-candidates' ? (
                   <>
                     <span className="sm:hidden">Saved</span>
                     <span className="hidden sm:inline">Saved Candidates</span>
                   </>
                 ) :
                 activeMenu === 'alerts' ? (
                   <>
                     <span className="sm:hidden">Alerts</span>
                     <span className="hidden sm:inline">Alerts & Notifications</span>
                   </>
                 ) :
                 activeMenu === 'team' ? (
                   <>
                     <span className="sm:hidden">Team</span>
                     <span className="hidden sm:inline">Team Management</span>
                   </>
                 ) :
                 activeMenu === 'auto-rejection' ? (
                   <>
                     <span className="sm:hidden">Auto-Reject</span>
                     <span className="hidden sm:inline">AI Auto-Rejection</span>
                   </>
                 ) :
                 activeMenu === 'credentialing' ? 'Credentialing' : 'Dashboard'}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 truncate">
                {activeMenu === 'dashboard' && employerName ? (
                  <>
                    <span className="truncate">
                      Welcome back, <strong className="font-semibold text-slate-700">{employerName}</strong>
                    </span>
                    <span className="text-slate-300 hidden lg:inline">·</span>
                    <span className="text-slate-500 hidden lg:inline truncate">Hiring pipeline and workspace overview</span>
                  </>
                ) : (
                  <span className="truncate">
                    {activeMenu === 'applications' ? 'Review and manage candidate applications across your postings' :
                     activeMenu === 'interviews' ? 'Scheduled candidate interviews and timeline' :
                     activeMenu === 'saved-candidates' ? 'Candidates bookmarked for open and future positions' :
                     activeMenu === 'alerts' ? 'Candidate updates, interview alerts, and system notifications' :
                     activeMenu === 'team' ? 'Manage your recruitment team members and access permissions' :
                     activeMenu === 'auto-rejection' ? 'Configure criteria-based automated applicant screening' :
                     activeMenu === 'credentialing' ? 'Candidate credentialing and background checks' :
                     'Hiring workspace overview'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t border-slate-100 sm:border-0 justify-end">
            {/* Complete Profile Button */}
            <button
              onClick={() => {
                if (!isOwner) { setAccessDeniedModal({ show: true, feature: 'Edit Profile', requiredRole: 'Owner' }); return; }
                onNavigate('employer-complete-profile');
              }}
              className="flex-1 sm:flex-none h-9 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-[#1e3a8a] px-3 sm:px-3.5 rounded-lg font-medium text-xs sm:text-sm shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
              title="Complete your company profile"
              aria-label="Edit Profile"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit Profile</span>
            </button>

            {/* Post Job Button */}
            {canPostJobs ? (
              <button
                onClick={() => onNavigate('job-posting-selection')}
                className="flex-1 sm:flex-none h-9 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-3.5 sm:px-4 rounded-md font-semibold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                title="Post a new job"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Post Job</span>
              </button>
            ) : (
              <span className="flex-1 sm:flex-none h-9 bg-slate-100 text-slate-400 px-3.5 rounded-lg text-xs border border-slate-200 flex items-center justify-center cursor-not-allowed" title="View only access — cannot post jobs">
                View Only
              </span>
            )}

            {/* Notification Bell */}
            <button
              onClick={async () => {
                setShowNotifications(!showNotifications);
                if (!showNotifications && user?.email) {
                  try {
                    const fresh = await NotificationService.fetchNotifications(user.email);
                    setNotifications(filterNotifications(fresh));
                  } catch (e) { console.error('Bell fetch error:', e); }
                }
              }}
              className="relative w-9 h-9 bg-white border border-slate-200 hover:border-slate-300 rounded-lg shadow-sm text-slate-600 hover:text-[#1e3a8a] transition-colors flex items-center justify-center flex-shrink-0"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#2563eb] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Col 1 is Navigation Card, Col 2-4 is Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3.5 sm:pt-4 pb-8 sm:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 lg:gap-6 items-start">
          {/* Desktop Navigation Column */}
          <div className="hidden lg:block lg:col-span-1 sticky top-4">
            {renderNavigationCard(false)}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 min-w-0">
          {activeMenu === 'dashboard' ? (
            <>
              {isViewer && (
                <div className="mb-4 flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs sm:text-sm">
                  <span className="text-base">👁️</span>
                  <span>You have <strong>View Only</strong> access. Contact the Owner to request additional permissions.</span>
                </div>
              )}

              {/* Profile Completion Alert Banner (Only shown if completion < 100%) */}
              {user && profileCompletion < 100 && (
                <div className="mb-5 bg-white border border-[#e2e8f0] rounded-lg p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all">
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 text-[#1e3a8a] flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                      <Shield className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs sm:text-sm font-semibold text-[#1e3a8a]">
                          Complete your company profile
                        </p>
                        <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                          {profileCompletion}% completed
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Complete your profile to increase candidate trust, boost job visibility, and unlock verified status.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('employer-complete-profile')}
                    className="flex-shrink-0 inline-flex items-center justify-center px-3.5 py-2 text-xs font-semibold rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-sm transition-colors whitespace-nowrap self-start sm:self-center"
                  >
                    Complete Profile &rarr;
                  </button>
                </div>
              )}

              {/* ── Stat Cards ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
                {stats.map((stat, index) => {
                  const isPositive = !stat.percentage.startsWith('-');
                  const numericPct = parseInt(stat.percentage.replace(/[^0-9-]/g, '')) || 0;
                  const clampedPct = Math.min(Math.abs(numericPct), 100);
                  const isNumericPct = stat.percentage.includes('%');
                  const radius = 18;
                  const circumference = 2 * Math.PI * radius;
                  const fillRatio = isNumericPct ? clampedPct / 100 : 0.6;
                  const strokeDash = fillRatio * circumference;
                  const numVal = parseInt(stat.value) || 0;
                  const displayVal = numVal >= 1000 ? `${(numVal/1000).toFixed(1)}K` : stat.value;
                  const StatIcon = stat.icon;

                  return (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-4 sm:p-5 shadow-sm border border-[#e2e8f0] hover:border-[#bfdbfe] hover:shadow-sm transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-slate-500 text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate">
                          {stat.label}
                        </p>
                        <div className="w-8 h-8 rounded-lg bg-[#eff6ff] border border-[#dbeafe] flex items-center justify-center flex-shrink-0">
                          <StatIcon className="w-4 h-4 text-[#2563eb]" />
                        </div>
                      </div>
                      <div className="flex items-end justify-between gap-2 mt-1">
                        <div className="min-w-0">
                          <h3 className="text-2xl sm:text-3xl font-bold text-[#1e3a8a] leading-none mb-1.5 truncate">
                            {displayVal}
                          </h3>
                          <p className="text-[11px] sm:text-xs font-medium truncate flex items-center gap-1" style={{ color: isPositive ? (numericPct > 0 ? '#2563eb' : '#64748b') : '#64748b' }}>
                            {isNumericPct ? (
                              <>
                                <span>{isPositive ? '▲' : '▼'}</span>
                                <span>{Math.abs(numericPct)}%</span>
                                <span className="text-slate-400 font-normal">this month</span>
                              </>
                            ) : (
                              <span>{stat.percentage}</span>
                            )}
                          </p>
                        </div>
                        {/* Mini Circular Progress */}
                          <div className="relative flex-shrink-0">
                          <svg width="38" height="38" viewBox="0 0 46 46">
                            <circle cx="23" cy="23" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
                            <circle
                              cx="23" cy="23" r={radius} fill="none" stroke="#2563eb" strokeWidth="3.5"
                              strokeDasharray={`${strokeDash} ${circumference}`} strokeLinecap="round" transform="rotate(-90 23 23)"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-slate-700">
                              {isNumericPct ? `${numericPct}%` : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Recruitment Analytics (ATS Job Performance) ── */}
              {(() => {
                const activeTab = chartFilterJobId.startsWith('tab:') ? chartFilterJobId.replace('tab:', '') : 'top';
                const needsAttention = jobPerformanceStats.filter(j => j.appCount === 0 && j.postedDaysAgo >= 5);
                const topPerforming = [...jobPerformanceStats].sort((a, b) => b.score - a.score).slice(0, 10);
                const mostApplied = [...jobPerformanceStats].sort((a, b) => b.appCount - a.appCount).slice(0, 10);
                const recentlyPosted = [...jobPerformanceStats].sort((a, b) => a.postedDaysAgo - b.postedDaysAgo).slice(0, 10);

                const tabData: Record<string, typeof jobPerformanceStats> = {
                  top: topPerforming,
                  applied: mostApplied,
                  recent: recentlyPosted,
                  attention: needsAttention,
                };
                const visibleJobs = tabData[activeTab] || topPerforming;

                const getBarColor = (pct: number, appCount: number, postedDaysAgo: number) => {
                  if (pct >= 80) return { bar: '#2563eb', label: 'Hot Job', labelCls: 'text-[#1e3a8a] bg-slate-100 border-slate-200', icon: Flame };
                  if (pct >= 40) return { bar: '#64748b', label: 'Growing', labelCls: 'text-slate-700 bg-slate-50 border-slate-200', icon: null };
                  if (appCount === 0 && postedDaysAgo < 5) return { bar: '#64748b', label: null, labelCls: '', icon: null };
                  if (appCount === 0 && postedDaysAgo >= 5) return { bar: '#64748b', label: 'Needs Boost', labelCls: 'text-slate-700 bg-slate-50 border-slate-200', icon: AlertTriangle };
                  return { bar: '#64748b', label: 'Needs Boost', labelCls: 'text-slate-700 bg-slate-50 border-slate-200', icon: AlertTriangle };
                };

                const tabs = [
                  { key: 'top',       label: 'Top Performing', count: topPerforming.length },
                  { key: 'applied',   label: 'Most Applied',   count: mostApplied.length },
                  { key: 'recent',    label: 'Recently Posted',count: recentlyPosted.length },
                  { key: 'attention', label: 'Needs Attention', count: needsAttention.length, red: true },
                ];

                return (
                  <div className="bg-white rounded-lg shadow-sm border border-[#e2e8f0] mb-5 overflow-hidden">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-white gap-3">
                      <div>
                        <h2 className="text-sm sm:text-base font-bold text-[#1e3a8a]">Job Performance Score</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{companyName} · Applications overview</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {jobs.length > 0 && (
                          <BulkJobRefresh
                            selectedJobIds={jobs.map(j => j.id || j._id).filter(Boolean)}
                            selectedJobs={jobs.map(j => ({ id: j.id || j._id, title: j.jobTitle || j.title, refreshCount: j.refreshCount || 0, lastRefreshedAt: j.lastRefreshedAt }))}
                            userPlan={user?.plan || 'free'}
                            onRefreshComplete={() => { if (user) fetchDashboardData(user); }}
                            className="text-xs px-3 py-1.5"
                          />
                        )}
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex overflow-x-auto border-b border-slate-200 px-4 gap-1 pt-1.5 bg-slate-50/50">
                      {tabs.map(t => (
                        <button key={t.key} onClick={() => setChartFilterJobId(`tab:${t.key}`)}
                          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                            activeTab === t.key
                              ? 'border-[#2563eb] text-[#2563eb] font-bold'
                              : 'border-transparent text-[#64748b] hover:text-[#1e3a8a]'
                          }`}>
                          {t.label}
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            activeTab === t.key
                              ? 'bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]'
                              : 'bg-slate-100 text-[#64748b]'
                          }`}>{t.count}</span>
                        </button>
                      ))}
                    </div>

                    {/* Job Cards */}
                    <div className="p-4 sm:p-5">
                      {visibleJobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                          {activeTab === 'attention' ? (
                            <>
                              <PartyPopper className="w-8 h-8 mb-2 text-slate-500" />
                              <p className="text-xs font-medium text-slate-600">All jobs are getting applications!</p>
                            </>
                          ) : (
                            <>
                              <BarChart2 className="w-8 h-8 mb-2 text-slate-300" />
                              <p className="text-xs font-medium text-slate-500">No data yet</p>
                            </>
                          )}
                        </div>
                      ) : activeTab === 'attention' ? (
                        /* Needs Attention */
                        <div className="space-y-3">
                          {visibleJobs.map(job => (
                            <div key={job.id} className="flex items-center justify-between bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900 truncate">{job.title}</p>
                                <p className="text-xs text-[#1e3a8a] mt-0.5">0 Applications · Posted {job.postedDaysAgo} day{job.postedDaysAgo !== 1 ? 's' : ''} ago</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                {job.jobData && (
                                  <JobRefreshButton
                                    jobId={job.jobData.id || job.jobData._id}
                                    jobTitle={job.jobData.jobTitle || job.jobData.title}
                                    refreshCount={job.jobData.refreshCount || 0}
                                    lastRefreshedAt={job.jobData.lastRefreshedAt}
                                    userPlan={user?.plan || 'free'}
                                    onRefreshSuccess={() => { if (user) fetchDashboardData(user); }}
                                    className="text-[10px] px-2 py-1"
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Performance Card Layout */
                        <div className="space-y-3 sm:space-y-4">
                          {visibleJobs.map((job, idx) => {
                            const status = getBarColor(job.progressPct, job.appCount, job.postedDaysAgo);
                            const { bar, label, labelCls } = status;
                            return (
                              <div key={job.id} className="border border-[#e2e8f0] rounded-lg p-3.5 sm:p-4 hover:border-[#bfdbfe] hover:shadow-sm transition-all bg-white">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-bold text-slate-400">#{idx + 1}</span>
                                      <p className="text-sm font-bold text-[#1e3a8a] truncate">{job.title}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 sm:gap-3 mt-1.5">
                                      <span className="text-xs text-slate-500 font-medium">{job.appCount} / {job.target} Applications</span>
                                      <span className="text-xs text-slate-700 font-semibold">{job.shortlisted} Shortlisted</span>
                                      <span className="text-xs text-slate-700 font-semibold">{job.interviewCount} Interviews</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    {label && (
                                      <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${labelCls}`}>
                                        {status.icon && (
                                          <status.icon className="w-3 h-3 mr-1" />
                                        )}
                                        {label}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {/* Progress bar */}
                                <div className="flex items-center gap-2.5">
                                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-700"
                                      style={{ width: barsAnimated ? `${Math.max(job.progressPct, 3)}%` : '0%', background: bar }} />
                                  </div>
                                  <span className="text-xs font-bold tabular-nums" style={{ color: bar, minWidth: 36 }}>{job.progressPct}%</span>
                                  {job.jobData && (
                                    <JobRefreshButton
                                      jobId={job.jobData.id || job.jobData._id}
                                      jobTitle={job.jobData.jobTitle || job.jobData.title}
                                      refreshCount={job.jobData.refreshCount || 0}
                                      lastRefreshedAt={job.jobData.lastRefreshedAt}
                                      userPlan={user?.plan || 'free'}
                                      onRefreshSuccess={() => { if (user) fetchDashboardData(user); }}
                                      className="text-[10px] px-1.5 py-0.5"
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ── Row 1: Charts ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 mb-5">
                {/* Area chart */}
                <div className="bg-white rounded-lg p-5 shadow-sm border border-[#e2e8f0] hover:border-[#bfdbfe] transition-all flex flex-col">
                  <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
                    <div>
                      <h2 className="text-xs sm:text-sm font-bold text-[#1e3a8a] uppercase tracking-wider">Applications Received</h2>
                      <p className="text-[11px] text-slate-400 mt-0.5">Last 7 days</p>
                    </div>
                <div className="w-7 h-7 rounded-lg bg-[#eff6ff] border border-[#dbeafe] text-[#2563eb] flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                  {applications.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-slate-400 text-xs">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={applicationsOverTime} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.18} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="applications" stroke="#2563eb" fill="url(#appGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                  </div>
                </div>

                {/* Status Donut */}
                <div className="bg-white rounded-lg p-5 shadow-sm border border-[#e2e8f0] hover:border-[#bfdbfe] transition-all flex flex-col">
                  <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
                    <div>
                      <h2 className="text-xs sm:text-sm font-bold text-[#1e3a8a] uppercase tracking-wider">Status Breakdown</h2>
                      <p className="text-[11px] text-slate-400 mt-0.5">All applications</p>
                    </div>
                <div className="w-7 h-7 rounded-lg bg-[#eff6ff] border border-[#dbeafe] text-[#2563eb] flex items-center justify-center">
                      <BarChart2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                  {statusBreakdown.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-slate-400 text-xs">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={190}>
                      <PieChart>
                        <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value">
                          {statusBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  </div>
                </div>

                {/* Acquisitions */}
                <div className="bg-white rounded-lg p-5 shadow-sm border border-[#e2e8f0] hover:border-[#bfdbfe] transition-all flex flex-col">
                  <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
                    <div>
                      <h2 className="text-xs sm:text-sm font-bold text-[#1e3a8a] uppercase tracking-wider">Acquisitions</h2>
                      <p className="text-[11px] text-slate-400 mt-0.5">Stage breakdown</p>
                    </div>
                    <span className="text-[10px] text-slate-600 font-semibold bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">This Month</span>
                  </div>
                  <div className="flex-1">
                  {(() => {
                    const total = applications.length || 1;
                    const acq = [
                      { label:'Applications', count: applications.length, color:'#2563eb' },
                      { label:'Shortlisted',  count: applications.filter(a=>['shortlisted','hired'].includes(a.status)).length, color:'#2563eb' },
                      { label:'On-hold',      count: applications.filter(a=>a.status==='reviewed').length, color:'#64748b' },
                      { label:'Rejected',     count: applications.filter(a=>a.status==='rejected').length, color:'#64748b' },
                    ];
                    return (
                      <>
                        <div className="flex h-2 rounded-full overflow-hidden mb-4 bg-slate-100">
                          {acq.map((s,i) => <div key={i} style={{width:`${(s.count/total)*100}%`,background:s.color}} />)}
                        </div>
                        <div className="space-y-2.5">
                          {acq.map((s,i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:s.color}}></span>
                                <span className="text-slate-600 font-medium">{s.label}</span>
                              </div>
                              <span className="font-bold text-[#1e3a8a]">
                                {applications.length > 0 ? `${Math.round((s.count/total)*100)}%` : '0%'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                  </div>
                </div>
              </div>

              {/* ── Row 2: Bottom Cards (New Applicants & Recent Activity) ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-6">
                {/* New Applicants */}
                <div className="bg-white rounded-lg p-5 shadow-sm border border-[#e2e8f0] hover:border-[#bfdbfe] transition-all">
                  <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
                    <h2 className="text-xs sm:text-sm font-bold text-[#1e3a8a] uppercase tracking-wider">New Applicants</h2>
                    <span className="text-[10px] text-[#1e3a8a] font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">Last 7 days</span>
                  </div>
                  {applications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">No applicants yet</p>
                  ) : (
                    <div className="space-y-3">
                      {enrichedApps.slice(0, 5).map((app, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[#1e3a8a] bg-slate-100 border border-slate-200 text-xs font-bold">
                            {(app.candidateName || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[#1e3a8a] truncate">{app.candidateName || 'Candidate'}</p>
                            <p className="text-[11px] text-slate-500 truncate">{(app.jobTitle || 'a position').substring(0, 24)}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${matchScoreClasses(getApplicantMatchScore(app, matchScores))}`}
                            title="AI Match Score">
                            {getApplicantMatchScore(app, matchScores) === null ? '—' : `${getApplicantMatchScore(app, matchScores)}%`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg p-5 shadow-sm border border-[#e2e8f0] hover:border-[#bfdbfe] transition-all">
                  <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
                    <h2 className="text-xs sm:text-sm font-bold text-[#1e3a8a] uppercase tracking-wider">Recent Activity</h2>
                  </div>
                  {loading ? (
                    <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1e3a8a]"></div></div>
                  ) : recentActivity.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">No recent activity</p>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start gap-2.5 pb-2.5 border-b border-slate-100 last:border-0">
                          <div className="w-2 h-2 rounded-full bg-[#2563eb] mt-1.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-800">{activity.message}</p>
                            {activity.details?.jobTitle && <p className="text-[11px] text-slate-400 truncate">{activity.details.jobTitle}</p>}
                          </div>
                          <span className="text-[11px] text-slate-400 whitespace-nowrap">{activity.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </>
          ) : activeMenu === 'applications' ? (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a8a]">Applications</h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Review and manage all candidate applications across your postings
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                  {(() => {
                    const filtered = applications.filter(a => {
                      const jobMatch = appFilterJob === 'all' || (a.jobTitle || '') === appFilterJob || (a.jobId?._id || a.jobId) === appFilterJob;
                      const statusMatch = appFilterStatus === 'all' || a.status === appFilterStatus;
                      const searchMatch = !appSearch || (a.candidateName || '').toLowerCase().includes(appSearch.toLowerCase()) || (a.candidateEmail || '').toLowerCase().includes(appSearch.toLowerCase());
                      return jobMatch && statusMatch && searchMatch;
                    });
                    return `${filtered.length} of ${applications.length} applications`;
                  })()}
                </span>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-[#e2e8f0] mb-5 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex-1 focus-within:border-[#2563eb] focus-within:bg-white transition-colors">
                  <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by candidate name or email..."
                    value={appSearch}
                    onChange={e => setAppSearch(e.target.value)}
                    className="bg-transparent text-xs sm:text-sm text-slate-800 outline-none w-full placeholder-slate-400"
                  />
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <AutocompleteCombobox
                    value={appFilterJob === 'all' ? '' : appFilterJob}
                    onChange={(val) => setAppFilterJob(val || 'all')}
                    options={[
                      { value: 'all', label: 'All Jobs' },
                      ...jobs.map(job => {
                        const jobTitle = job.jobTitle || job.title;
                        const count = applications.filter(a => a.jobTitle === jobTitle || (a.jobId?._id || a.jobId) === (job._id || job.id)).length;
                        return { value: jobTitle, label: `${jobTitle} (${count})` };
                      })
                    ]}
                    placeholder="All Jobs"
                    className="text-xs sm:text-sm min-w-[140px] flex-1 sm:flex-none"
                  />
                  <AutocompleteCombobox
                    value={appFilterStatus === 'all' ? '' : appFilterStatus}
                    onChange={(val) => setAppFilterStatus(val || 'all')}
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'reviewed', label: 'Reviewed' },
                      { value: 'shortlisted', label: 'Shortlisted' },
                      { value: 'rejected', label: 'Rejected' },
                      { value: 'hired', label: 'Hired' }
                    ]}
                    placeholder="All Status"
                    className="text-xs sm:text-sm min-w-[130px] flex-1 sm:flex-none"
                  />
                  {(appFilterJob !== 'all' || appFilterStatus !== 'all' || appSearch) && (
                    <button
                      onClick={() => { setAppFilterJob('all'); setAppFilterStatus('all'); setAppSearch(''); }}
                      className="text-xs text-red-600 hover:text-red-700 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a]"></div>
                </div>
              ) : applications.length === 0 ? (
                <div className="bg-white rounded-lg border border-[#e2e8f0] p-12 text-center shadow-sm">
                  <Users className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base sm:text-lg font-bold text-[#1e3a8a] mb-1">No applications yet</h3>
                  <p className="text-xs sm:text-sm text-slate-500">Applications will appear here when candidates apply to your jobs.</p>
                </div>
              ) : (() => {
                const filtered = applications.filter(a => {
                  const jobMatch = appFilterJob === 'all' || (a.jobTitle || '') === appFilterJob || (a.jobId?._id || a.jobId) === appFilterJob;
                  const statusMatch = appFilterStatus === 'all' || a.status === appFilterStatus;
                  const searchMatch = !appSearch || (a.candidateName || '').toLowerCase().includes(appSearch.toLowerCase()) || (a.candidateEmail || '').toLowerCase().includes(appSearch.toLowerCase());
                  return jobMatch && statusMatch && searchMatch;
                });
                return filtered.length === 0 ? (
                  <div className="bg-white rounded-lg border border-[#e2e8f0] p-12 text-center shadow-sm">
                    <Users className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 font-medium">No applications match your filters.</p>
                  </div>
                ) : (
                <div className="space-y-3.5">
                  {filtered.map((application) => (
                    <div key={application._id || application.id} className="bg-white border border-[#e2e8f0] rounded-lg p-4 sm:p-5 shadow-sm hover:border-[#bfdbfe] transition-all duration-200">
                      {/* Mobile: stacked layout | Desktop: side-by-side */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Candidate info */}
                        <div className="flex-1 min-w-0">
                          {/* Avatar + name row */}
                          <div className="flex items-start gap-2.5 sm:gap-3 mb-2">
                            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-[#1e3a8a] font-bold text-base sm:text-lg">{application.candidateName?.charAt(0).toUpperCase() || 'C'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm sm:text-base font-bold text-[#1e3a8a] leading-tight">{application.candidateName || application.candidateEmail}</h3>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${matchScoreClasses(getApplicantMatchScore(application, matchScores))}`}
                                  title="AI Match Score">
                                  {getApplicantMatchScore(application, matchScores) === null ? '—' : `${getApplicantMatchScore(application, matchScores)}%`}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 font-semibold flex items-center gap-1 mt-0.5 leading-snug">
                                <Briefcase className="w-3 h-3 flex-shrink-0 text-slate-500" />
                                <span>Applied for: {application.jobTitle || 'Job Position'}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2.5">
                            <span className="text-xs text-slate-500 break-all">{application.candidateEmail}</span>
                            <span className="text-xs text-slate-400">· Applied: {new Date(application.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          {application.coverLetter && application.coverLetter !== 'No cover letter' && (
                            <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg mb-3 border-l-2 border-[#1e3a8a]">
                              <strong className="text-slate-800">Cover Letter:</strong> {application.coverLetter.length > 100 ? `${application.coverLetter.substring(0, 100)}...` : application.coverLetter}
                            </div>
                          )}
                          {application.candidateEmail ? (
                            <button
                              onClick={() => {
                                setSelectedResumeAppId(application._id || application.id || null);
                                setSelectedResumeUrl(application.resumeUrl || null);
                                setSelectedResumeCandidateName(application.candidateName || null);
                                setSelectedResumeCandidateEmail(application.candidateEmail || null);
                                setShowResumeModal(true);
                              }}
                              className="text-[#2563eb] hover:text-[#1d4ed8] text-xs font-semibold inline-flex items-center gap-1.5 bg-[#eff6ff] hover:bg-blue-100 border border-[#bfdbfe] px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              View Resume
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs bg-slate-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Not available</span>
                          )}
                        </div>

                        {/* Action buttons: on mobile - status full width on its own row, then 3 buttons in a row; on desktop - vertical column */}
                        <div className="flex flex-col gap-2 sm:flex-shrink-0 sm:items-stretch sm:min-w-[140px]">
                          {canManageApplications ? (
                            <AutocompleteCombobox
                              value={application.status}
                              onChange={async (newStatus) => {
                                const appId = application._id || application.id;
                                try {
                                  const response = await apiFetch(`${API_ENDPOINTS.APPLICATIONS}/${appId}/status`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: newStatus }),
                                  });
                                  if (response.ok) {
                                    setApplications(prev => prev.map(app => (app._id || app.id) === appId ? { ...app, status: newStatus } : app));
                                    const msgs: Record<string, string> = { pending: 'Marked as pending', reviewed: 'Marked as reviewed', shortlisted: 'Candidate shortlisted!', rejected: 'Application rejected', hired: 'Candidate hired!' };
                                    showToast(msgs[newStatus] || 'Status updated', 'success');
                                  } else { throw new Error(); }
                                } catch {
                                  showToast('Failed to update status. Please try again.', 'error');
                                }
                              }}
                              options={[
                                { value: 'pending', label: 'Pending' },
                                { value: 'reviewed', label: 'Reviewed' },
                                { value: 'shortlisted', label: 'Shortlisted' },
                                { value: 'rejected', label: 'Rejected' },
                                { value: 'hired', label: 'Hired' }
                              ]}
                              placeholder="Select status"
                              className="w-full text-xs"
                            />
                          ) : (
                            <span className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 text-slate-400 text-center capitalize">{application.status}</span>
                          )}
                          {/* Action buttons */}
                          <div className="flex flex-row sm:flex-col gap-2">
                            <button
                              onClick={() => {
                                const cid = application.candidateEmail || application.candidateId || application.userId || application.candidateUserId || '';
                                if (!cid) { showToast('Candidate profile not available.', 'info'); return; }
                                sessionStorage.setItem('viewCandidateId', String(cid));
                                sessionStorage.setItem('viewCandidateData', JSON.stringify({ name: application.candidateName || '', email: application.candidateEmail || '', phone: application.candidatePhone || '', skills: application.candidateSkills || application.skills || [] }));
                                setViewingCandidateId(String(cid));
                              }}
                              className="flex-1 sm:flex-none sm:w-full bg-white border border-slate-200 text-[#1e3a8a] hover:bg-slate-50 px-2.5 py-2 rounded-lg font-semibold transition-colors text-xs whitespace-nowrap shadow-sm text-center"
                            >
                              View Profile
                            </button>
                            {application.status !== 'rejected' && canManageApplications && (
                              <button
                                onClick={() => { setSelectedApplication(application); setShowScheduleModal(true); }}
                                className="flex-1 sm:flex-none sm:w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-2.5 py-2 rounded-lg font-semibold transition-colors text-xs whitespace-nowrap shadow-sm text-center"
                              >
                                Schedule
                              </button>
                            )}
                            {application.status !== 'rejected' && canManageApplications && (
                              <button
                                onClick={async () => {
                                  const appId = application._id || application.id;
                                  try {
                                    const response = await apiFetch(`${API_ENDPOINTS.APPLICATIONS}/${appId}/status`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'rejected' }),
                                    });
                                    if (response.ok) {
                                      setApplications(prev => prev.map(app => (app._id || app.id) === appId ? { ...app, status: 'rejected' } : app));
                                      // Send rejection email to candidate
                                      try {
                                        await apiFetch(`${API_ENDPOINTS.BASE_URL}/email/send`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            to: application.candidateEmail,
                                            subject: `Application Update - ${application.jobTitle || 'Job Position'} at ${companyName}`,
                                            type: 'application_rejected',
                                            data: {
                                              candidateName: application.candidateName || 'Applicant',
                                              jobTitle: application.jobTitle || 'Job Position',
                                              companyName,
                                            },
                                          }),
                                        });
                                      } catch { /* email failure is non-critical */ }
                                      showToast('Application rejected & email sent to candidate', 'success');
                                    } else { throw new Error(); }
                                  } catch { showToast('Failed to reject application.', 'error'); }
                                }}
                                className="flex-1 sm:flex-none sm:w-full border border-red-200 text-red-600 hover:bg-red-50 px-2.5 py-2 rounded-lg font-semibold transition-colors text-xs whitespace-nowrap text-center"
                              >
                                Reject
                              </button>
                            )}
                            {application.status === 'rejected' && (
                              <span className="flex-1 sm:flex-none sm:w-full text-center px-2 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                                Rejected
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                );
              })()
            }
            </>
          ) : activeMenu === 'interviews' ? (
            <>
              <div className="mb-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a8a]">Interviews</h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      {interviews.length === 0 ? 'No interviews scheduled' : 
                       interviews.length === 1 ? '1 interview scheduled' : 
                       `${interviews.length} interviews scheduled`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManageApplications && (
                      <button
                        onClick={() => {
                          const eligible = applications.filter(a => a.status === 'pending' || a.status === 'shortlisted');
                          if (eligible.length > 0) {
                            setSelectedApplication(eligible[0]);
                          }
                          setShowScheduleModal(true);
                        }}
                        className="inline-flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-3.5 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors shadow-sm whitespace-nowrap"
                      >
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        Schedule Interview
                      </button>
                    )}
                    <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                      Schedule Management
                    </span>
                  </div>
                </div>
              </div>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a]"></div>
                </div>
              ) : interviews.length === 0 ? (
                <div className="bg-white rounded-lg border border-[#e2e8f0] p-12 text-center shadow-sm">
                  <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base sm:text-lg font-bold text-[#1e3a8a] mb-1">No Interviews Scheduled</h3>
                  <p className="text-xs sm:text-sm text-slate-500">Interview schedules will appear here when candidates book or accept interviews.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {interviews.map((interview) => (
                    <div key={interview._id} className="bg-white border border-[#e2e8f0] rounded-lg p-4 sm:p-5 shadow-sm hover:border-[#bfdbfe] transition-all duration-200">
                      <div className="flex flex-col lg:flex-row items-start gap-4">
                        <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-[#1e3a8a] font-bold text-sm sm:text-base">
                              {interview.candidateName?.charAt(0).toUpperCase() || 'C'}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2">
                              <div className="min-w-0">
                                <h3 className="text-base sm:text-lg font-bold text-[#1e3a8a] mb-0.5 truncate">
                                  {interview.candidateName || 'Candidate'}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 font-semibold flex items-center gap-1">
                                  <Briefcase className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                                  <span className="truncate">{interview.jobTitle || 'Interview'}</span>
                                </p>
                              </div>
                              <span className={`flex-shrink-0 self-start px-2.5 py-1 rounded-full text-xs font-semibold ${
                                interview.status === 'scheduled' ? 'bg-slate-50 text-[#1e3a8a] border border-slate-200' :
                                interview.status === 'accepted' ? 'bg-slate-100 text-[#1e3a8a] border border-slate-200' :
                                interview.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                                interview.status === 'completed' ? 'bg-slate-50 text-slate-700 border border-slate-200' :
                                interview.status === 'cancelled' ? 'bg-red-50 text-red-700 border border-red-200' :
                                'bg-slate-50 text-slate-600 border border-slate-200'
                              }`}>
                                {interview.status?.charAt(0).toUpperCase() + interview.status?.slice(1) || 'Scheduled'}
                              </span>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                                <span className="truncate">{formatInterviewDate(interview)}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                                <span>{formatInterviewTime(interview)}</span>
                              </span>
                              <span className="truncate text-slate-400">· {interview.candidateEmail}</span>
                            </div>

                            {interview.meetingLink && (
                              <div className="mb-3 inline-flex flex-wrap items-center gap-2">
                                <a
                                  href={`${API_ENDPOINTS.BASE_URL}/meetings/interview/${interview._id}/host`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                                >
                                  <Video className="w-3.5 h-3.5" />
                                  <span>Start Meeting</span>
                                </a>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${API_ENDPOINTS.BASE_URL}/meetings/interview/${interview._id}/join`);
                                    showToast('Candidate join link copied!', 'success');
                                  }}
                                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 px-3.5 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                                  title="Copy candidate join link"
                                >
                                  <Link2 className="w-3.5 h-3.5" />
                                  <span>Copy Candidate Link</span>
                                </button>
                              </div>
                            )}

                            {interview.notes && (
                              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border-l-2 border-[#1e3a8a]">
                                <strong className="text-slate-800">Notes:</strong> {interview.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 w-full lg:w-auto lg:flex-shrink-0 lg:min-w-[140px]">
                          {canManageApplications ? (<AutocompleteCombobox
                            value={interview.status || 'scheduled'}
                            onChange={async (newStatus) => {
                              try {
                                const response = await apiFetch(`${API_ENDPOINTS.BASE_URL}/interviews/${interview._id}/status`, {
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
                                  showToast('Interview status updated!', 'success');
                                } else {
                                  throw new Error('Failed to update status');
                                }
                              } catch (error) {
                                console.error('Error updating interview status:', error);
                                showToast('Failed to update interview status. Please try again.', 'error');
                              }
                            }}
                            options={[
                              { value: 'scheduled', label: 'Scheduled' },
                              { value: 'accepted', label: 'Accepted' },
                              { value: 'rejected', label: 'Declined' },
                              { value: 'completed', label: 'Completed' },
                              { value: 'cancelled', label: 'Cancelled' }
                            ]}
                            placeholder="Select status"
                            className="px-3 py-2 text-xs"
                          />) : (<span className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 text-slate-400 capitalize text-center">{interview.status || 'scheduled'}</span>)}
                          {canDeleteRecords && (<button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openConfirm(
                                'Delete Interview', 
                                'Are you sure you want to delete this interview? This action cannot be undone.', 
                                async () => {
                                  try {
                                    const response = await fetch(`${API_ENDPOINTS.BASE_URL}/interviews/${interview._id}`, {
                                      method: 'DELETE',
                                      headers: { 'Content-Type': 'application/json' },
                                    });
                                    if (response.ok) {
                                      setInterviews(prev => prev.filter(int => int._id !== interview._id));
                                      showToast('Interview deleted successfully!', 'success');
                                    } else {
                                      showToast('Failed to delete interview', 'error');
                                    }
                                  } catch {
                                    showToast('Network error. Please try again.', 'error');
                                  } finally {
                                    closeConfirm();
                                  }
                                }
                              );
                              }}
                              className="flex-shrink-0 lg:w-full min-h-[38px] inline-flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg font-semibold transition-colors text-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Schedule Interview Modal */}
              {showScheduleModal && selectedApplication && (
                <ScheduleInterviewModal
                  application={selectedApplication}
                  existingRounds={
                    interviews
                      .filter(i => i.candidateEmail === selectedApplication.candidateEmail && i.jobTitle === selectedApplication.jobTitle)
                      .map(i => i.round)
                      .filter(Boolean)
                  }
                  onClose={() => {
                    setShowScheduleModal(false);
                    setSelectedApplication(null);
                  }}
                  onSuccess={() => {
                    setShowScheduleModal(false);
                    setSelectedApplication(null);
                    // Refresh interviews after successful scheduling
                    const _u = user || JSON.parse(localStorage.getItem('user') || '{}');
                    const _ownerId = _u.employerOwnerId || _u.ownerEmail || _u.id || _u._id || '';
                    const _ownerEmail = _u.ownerEmail || _u.employerOwnerId || _u.email || '';
                    fetch(`${API_ENDPOINTS.BASE_URL}/interviews?employerId=${encodeURIComponent(_ownerId)}&employerEmail=${encodeURIComponent(_ownerEmail)}`)
                      .then(res => res.json())
                      .then(data => {
                        const interviewsArray = Array.isArray(data) ? data : [];
                        setInterviews(interviewsArray);
                      })
                      .catch(() => {});
                  }}
                />
              )}

            </>
          ) : activeMenu === 'saved-candidates' ? (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a8a]">Saved Candidates</h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Talent you bookmarked for current or future opportunities
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (refreshingSaved) return;
                    setRefreshingSaved(true);
                    try {
                      const token = getToken();
                      if (!token) return;
                      const res = await fetch(`${API_ENDPOINTS.SAVED_CANDIDATES}`, { headers: { 'Authorization': `Bearer ${token}` } });
                      const data = await (res.ok ? res.json() : []);
                      const candidates = Array.isArray(data) ? data : data.savedCandidates || [];
                      setSavedCandidates(candidates);
                      showToast(`Refreshed! Found ${candidates.length} saved candidates.`, 'success');
                    } catch {
                      showToast('Failed to refresh saved candidates.', 'error');
                    } finally {
                      setRefreshingSaved(false);
                    }
                  }}
                  disabled={refreshingSaved}
                  className={`bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 shadow-sm transition-colors ${refreshingSaved ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshingSaved ? 'animate-spin text-[#1e3a8a]' : ''}`} />
                  {refreshingSaved ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              
              {savedCandidates.length === 0 ? (
                <div className="bg-white rounded-lg border border-[#e2e8f0] p-12 text-center shadow-sm">
                  <Bookmark className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base sm:text-lg font-bold text-[#1e3a8a] mb-1">No Saved Candidates</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mb-5">Save candidates from the candidate search to organize them here.</p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => onNavigate('candidate-search')}
                      className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-5 py-2.5 rounded-lg font-semibold text-xs sm:text-sm shadow-sm transition-colors"
                    >
                      Search Candidates
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {savedCandidates.map((candidate) => {
                    const name = candidate.candidateName || candidate.fullName || candidate.name || 'Candidate';
                    const title = candidate.candidateTitle || candidate.title || '';
                    const location = candidate.candidateLocation || candidate.location || '';
                    const experience = candidate.candidateExperience || candidate.experience || '';
                    const email = candidate.candidateEmail || candidate.email || '';
                    const skills: string[] = (() => {
                      const raw = candidate.candidateSkills || candidate.skills;
                      if (!raw) return [];
                      if (Array.isArray(raw)) return raw;
                      try { return JSON.parse(raw); } catch { return raw.split(',').map((s: string) => s.trim()).filter(Boolean); }
                    })();
                    const photo = candidate.candidateProfilePicture || candidate.profilePhoto || '';
                    return (
                    <div key={candidate._id || candidate.id} className="bg-white border border-[#e2e8f0] rounded-lg p-4 sm:p-5 shadow-sm hover:border-[#bfdbfe] transition-all duration-200">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {photo ? (
                            <img src={photo} alt={name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border border-slate-200 shadow-sm"
                              onError={(e) => {
                                const initials = (name || '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                                (e.target as HTMLImageElement).src = `data:image/svg+xml,${encodeURIComponent(
                                  `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="#1e3a8a" rx="32"/><text x="32" y="42" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">${initials}</text></svg>`
                                )}`;
                              }} />
                          ) : (
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-[#1e3a8a] font-bold text-xl shadow-sm">
                              {name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          {/* Name + Applied Job badge */}
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-base sm:text-lg font-bold text-[#1e3a8a]">{name}</h3>
                            {candidate.appliedJobTitle && (
                              <span className="text-xs font-semibold text-[#1e3a8a] bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Briefcase className="w-3 h-3 text-slate-500" />
                                {candidate.appliedJobTitle}
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          {title && <p className="text-xs sm:text-sm font-medium text-slate-600 mb-2">{title}</p>}

                          {/* Meta row */}
                          <div className="flex flex-wrap gap-2 mb-2.5">
                            {location && (
                              <span className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                                <MapPin className="w-3 h-3 text-slate-400" />{location}
                              </span>
                            )}
                            {experience && (
                              <span className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                                <Briefcase className="w-3 h-3 text-slate-400" />{experience}
                              </span>
                            )}
                            {email && (
                              <span className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                                <Mail className="w-3 h-3 text-slate-400" />{email}
                              </span>
                            )}
                          </div>

                          {/* Skills */}
                          {skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {skills.slice(0, 8).map((skill, i) => (
                                <span key={i} className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full font-medium">{skill}</span>
                              ))}
                              {skills.length > 8 && (
                                <span className="text-xs text-slate-400 px-1 py-0.5">+{skills.length - 8} more</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto flex-shrink-0">
                          <button
                            onClick={() => { if (email) window.location.href = `mailto:${email}`; }}
                            className="flex-1 sm:flex-none bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Contact</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openConfirm(
                                'Remove Candidate', 
                                'Remove this candidate from your saved list? This action cannot be undone.', 
                                async () => {
                                  try {
                                    const token = getToken();
                                    const recordId = candidate.id || candidate._id;
                                    const candidateId = candidate.candidateId;
                                    const response = await fetch(`${API_ENDPOINTS.SAVED_CANDIDATES}/${candidateId}`, {
                                      method: 'DELETE',
                                      headers: { 'Authorization': `Bearer ${token}` }
                                    });
                                    if (response.ok) {
                                      setSavedCandidates(prev => prev.filter(c => (c.id || c._id) !== recordId));
                                      showToast('Candidate removed from saved list!', 'success');
                                    } else {
                                      showToast('Failed to remove candidate. Please try again.', 'error');
                                    }
                                  } catch (error) {
                                    console.error('Remove error:', error);
                                    showToast('Failed to remove candidate. Please try again.', 'error');
                                  }
                                  closeConfirm();
                                }
                              );
                            }}
                            className="flex-1 sm:flex-none border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-semibold transition-colors text-xs sm:text-sm text-center"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : activeMenu === 'alerts' ? (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a8a]">Alerts & Notifications</h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Stay updated on candidates, interviews, and team activities
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (refreshing || !user?.email) return;
                    setRefreshing(true);
                    try {
                      const dynamicNotifications = await NotificationService.fetchNotifications(user.email);
                      setNotifications(filterNotifications(dynamicNotifications));
                      showToast('Notifications are up to date.', 'success');
                    } catch (error) {
                      showToast('Failed to refresh notifications. Please try again.', 'error');
                    } finally {
                      setRefreshing(false);
                    }
                  }}
                  disabled={refreshing}
                  className={`flex items-center gap-2 text-xs sm:text-sm bg-white border border-slate-200 px-3.5 py-2 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm ${
                    refreshing ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#1e3a8a]' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              
              <div className="space-y-3.5">
                {notifications.length === 0 ? (
                  <div className="bg-white rounded-lg border border-[#e2e8f0] p-12 text-center shadow-sm">
                    <Bell className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base sm:text-lg font-bold text-[#1e3a8a] mb-1">No Alerts</h3>
                    <p className="text-xs sm:text-sm text-slate-500">You're all caught up! New alerts and notifications will appear here.</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.id} className="bg-white border border-[#e2e8f0] rounded-lg p-4 sm:p-5 shadow-sm hover:border-[#bfdbfe] transition-all duration-200">
                      <div className="flex items-start space-x-3.5">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-base flex-shrink-0">
                          {NotificationService.getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="text-sm font-bold text-[#1e3a8a]">{notification.title}</h3>
                            <span className="text-xs text-slate-400 whitespace-nowrap ml-4">{NotificationService.formatTime(notification.time)}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 mb-3">{notification.message}</p>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                if (notification.type === 'application') {
                                  const candidateName = notification.data?.candidateName || notification.data?.candidateEmail || '';
                                  if (candidateName) setAppSearch(candidateName);
                                  setActiveMenu('applications');
                                } else if (notification.type === 'interview' || notification.type === 'interview_accepted' || notification.type === 'interview_declined') {
                                  setActiveMenu('interviews');
                                } else if (notification.type === 'job') {
                                  onNavigate('my-jobs');
                                }
                              }}
                              className="text-xs font-semibold text-[#2563eb] border border-[#bfdbfe] px-3 py-1.5 rounded-md hover:bg-[#eff6ff] transition-colors shadow-sm"
                            >
                              View Details
                            </button>
                            <button 
                              onClick={() => {
                                setNotifications(prev => prev.filter(n => n.id !== notification.id));
                                const dismissed = getDismissedIds();
                                dismissed.add(notification.id);
                                localStorage.setItem(DISMISSED_NOTIFS_KEY, JSON.stringify([...dismissed]));
                              }}
                              className="text-xs font-medium text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Alert Settings */}
              <div className="mt-6 bg-white rounded-lg p-5 sm:p-6 shadow-sm border border-[#e2e8f0]">
                <h2 className="text-base sm:text-lg font-bold text-[#1e3a8a] mb-3">Alert Preferences</h2>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 cursor-pointer text-xs sm:text-sm">
                    <input
                      type="checkbox"
                      checked={prefs.newApplications}
                      onChange={e => setPrefs(p => ({ ...p, newApplications: e.target.checked }))}
                      className="rounded border-slate-300 text-[#1e3a8a] focus:ring-[#2563eb]"
                    />
                    <span className="text-slate-700">New job applications</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer text-xs sm:text-sm">
                    <input
                      type="checkbox"
                      checked={prefs.interviewConfirmations}
                      onChange={e => setPrefs(p => ({ ...p, interviewConfirmations: e.target.checked }))}
                      className="rounded border-slate-300 text-[#1e3a8a] focus:ring-[#2563eb]"
                    />
                    <span className="text-slate-700">Interview confirmations</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer text-xs sm:text-sm">
                    <input
                      type="checkbox"
                      checked={prefs.jobPostingUpdates}
                      onChange={e => setPrefs(p => ({ ...p, jobPostingUpdates: e.target.checked }))}
                      className="rounded border-slate-300 text-[#1e3a8a] focus:ring-[#2563eb]"
                    />
                    <span className="text-slate-700">Job posting updates</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer text-xs sm:text-sm">
                    <input
                      type="checkbox"
                      checked={prefs.weeklySummary}
                      onChange={e => setPrefs(p => ({ ...p, weeklySummary: e.target.checked }))}
                      className="rounded border-slate-300 text-[#1e3a8a] focus:ring-[#2563eb]"
                    />
                    <span className="text-slate-700">Weekly summary reports</span>
                  </label>
                </div>
                <button
                  onClick={handleSavePreferences}
                  disabled={savingPrefs}
                  className={`mt-4 px-5 py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-sm ${
                    savingPrefs
                      ? 'bg-slate-400 text-white cursor-not-allowed'
                      : 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]'
                  }`}
                >
                  {savingPrefs && (
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {savingPrefs ? 'Saving…' : 'Save Preferences'}
                </button>
              </div>
            </>
          ) : activeMenu === 'team' ? (
            <TeamSection
              employerEmail={user?.employerOwnerId || user?.ownerEmail || user?.email}
              currentUserEmail={user?.email}
              companyName={companyName}
              showToast={showToast}
              canInvite={canInviteMembers}
            />
          ) : activeMenu === 'auto-rejection' ? (
            <>
              <div className="mb-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a8a]">AI Auto-Rejection</h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Configure intelligent filtering to automatically screen applications
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full text-xs font-semibold">
                      🤖 Smart Filtering
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-[#e2e8f0]">
                <AutoRejectionSettings onSave={(settings) => console.log('Settings saved:', settings)} />
              </div>
            </>
          ) : activeMenu === 'credentialing' ? (
            canAccessCredentialing
              ? <CandidateCredentialing employerEmail={user?.email || ''} showToast={showToast} />
              : <AccessDenied role={teamRole} />
          ) : null}
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 max-w-[310px] w-full bg-white shadow-2xl z-50 overflow-y-auto">
            {renderNavigationCard(true)}
          </div>
        </div>
      )}

      {/* Notification Slide-in Drawer (same as candidate page) */}
      {showNotifications && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowNotifications(false)}
          />
          <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-3">
                {notifications.length > 0 && (
                  <button
                    onClick={() => {
                      setNotifications([]);
                      localStorage.setItem(DISMISSED_NOTIFS_KEY, '[]');
                      localStorage.setItem(CLEARED_ALL_KEY, Date.now().toString());
                    }}
                    className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="h-full overflow-y-auto pb-20">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No notifications yet</p>
                  <p className="text-sm">New alerts will appear here</p>
                </div>
              ) : (
                <>
                  <div className="p-3 text-sm text-gray-500 border-b bg-gray-50">Recent</div>
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setShowNotifications(false);
                        if (notification.type === 'application') setActiveMenu('applications');
                        else if (notification.type === 'interview' || notification.type === 'interview_accepted' || notification.type === 'interview_declined') setActiveMenu('interviews');
                        else if (notification.type === 'job') onNavigate('my-jobs');
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${
                          NotificationService.getNotificationColor(notification.type)
                        }`}>
                          {NotificationService.getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-1">{notification.title}</h4>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{notification.message}</p>
                          <span className="text-xs text-gray-400">{NotificationService.formatTime(notification.time)}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNotifications(prev => prev.filter(n => n.id !== notification.id));
                            const dismissed = getDismissedIds();
                            dismissed.add(notification.id);
                            localStorage.setItem(DISMISSED_NOTIFS_KEY, JSON.stringify([...dismissed]));
                          }}
                          className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 text-lg leading-none ml-2"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-4 py-3">
              <button
                onClick={() => { setShowNotifications(false); setActiveMenu('alerts'); }}
                className="w-full text-center text-xs sm:text-sm text-[#2563eb] hover:text-[#1d4ed8] font-semibold transition-colors"
              >
                View all alerts &rarr;
              </button>
            </div>
          </div>
        </>
      )}

      {/* Resume Modal */}
      <ResumeModal
        applicationId={selectedResumeAppId}
        isOpen={showResumeModal}
        onClose={() => { setShowResumeModal(false); setSelectedResumeAppId(null); setSelectedResumeUrl(null); setSelectedResumeCandidateName(null); setSelectedResumeCandidateEmail(null); }}
        resumeUrl={selectedResumeUrl || undefined}
        candidateName={selectedResumeCandidateName || undefined}
        candidateEmail={selectedResumeCandidateEmail || undefined}
      />

      {/* Toast notification */}
      <NotificationComponent
        type={toast.type}
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={closeConfirm}
      />

      {/* Schedule Interview Modal */}
      {showScheduleModal && selectedApplication && (
        <ScheduleInterviewModal
          application={selectedApplication}
          existingRounds={interviews
            .filter(i => (i.applicationId === (selectedApplication._id || selectedApplication.id)))
            .map(i => i.round)
            .filter(Boolean)}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedApplication(null);
          }}
          onSuccess={() => {
            // Re-fetch interviews specifically after scheduling
            const userData = localStorage.getItem('user');
            if (userData) {
              const u = JSON.parse(userData);
              const ownerId = u.employerOwnerId || u.ownerEmail || u.id || u._id || '';
              const ownerEmail = u.ownerEmail || u.employerOwnerId || u.email || '';
              fetch(`${API_ENDPOINTS.BASE_URL}/interviews?employerId=${encodeURIComponent(ownerId)}&employerEmail=${encodeURIComponent(ownerEmail)}`)
                .then(r => r.ok ? r.json() : [])
                .then((data: any[]) => {
                  setInterviews(Array.isArray(data) ? data : []);
                  setActiveMenu('interviews');
                })
                .catch(() => {});
            }
            fetchDashboardData(user);
          }}
        />
      )}

      {/* Access Denied Modal */}
      {accessDeniedModal.show && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4" onClick={() => setAccessDeniedModal({ show: false, feature: '', requiredRole: '' })}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[#1e3a8a] mb-2">Access Restricted</h2>
              <p className="text-slate-500 text-sm mb-1">
                <span className="font-semibold text-[#1e3a8a]">{accessDeniedModal.feature}</span> requires
              </p>
              <p className="text-slate-500 text-sm mb-4">
                <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                  accessDeniedModal.requiredRole === 'Owner' ? 'bg-slate-100 text-[#1e3a8a]' : 'bg-slate-100 text-slate-700'
                }`}>{accessDeniedModal.requiredRole}</span> access or higher.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mb-5 w-full">
                <p className="text-slate-700 text-xs">
                  Your current role is <span className={`font-bold px-1.5 py-0.5 rounded-full ${
                    teamRole === 'Recruiter' ? 'bg-slate-100 text-slate-700' : 'bg-slate-100 text-slate-600'
                  }`}>{teamRole}</span>. Contact the Owner to request access.
                </p>
              </div>
              <button
                onClick={() => setAccessDeniedModal({ show: false, feature: '', requiredRole: '' })}
                className="w-full bg-[#2563eb] text-white py-2.5 rounded-lg font-semibold hover:bg-[#1d4ed8] transition-colors shadow-sm text-sm"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Completion Popup */}
      <ProfileCompletionPopup
        isOpen={showProfilePopup}
        onClose={() => {
          setShowProfilePopup(false);
          localStorage.setItem('hasSeenProfilePopup', 'true');
          // Also clear session flag to prevent showing on refresh
          sessionStorage.removeItem('isFirstVisitAfterRegistration');
        }}
        onCompleteProfile={() => {
          setShowProfilePopup(false);
          localStorage.setItem('hasSeenProfilePopup', 'true');
          // Clear session flag
          sessionStorage.removeItem('isFirstVisitAfterRegistration');
          onNavigate('employer-complete-profile');
        }}
        userInfo={{
          name: employerName,
          email: user?.email,
          companyName: companyName,
          industry: user?.industry,
          companySize: user?.companySize,
          headquarters: user?.headquarters,
          companyDescription: user?.companyDescription,
          companyWebsite: user?.companyWebsite,
          tagline: user?.tagline
        }}
      />
    </div>
  );
};


// ── Access Denied Component ──────────────────────────────────────────
const AccessDenied: React.FC<{ role: string | null }> = ({ role }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
      <span className="text-4xl">🔒</span>
    </div>
    <h2 className="text-xl font-bold text-[#1e3a8a] mb-2">Access Restricted</h2>
    <p className="text-slate-500 text-sm max-w-xs">
      Your <span className="font-semibold text-[#1e3a8a]">{role}</span> role does not have permission to access this section.
      Please contact the Owner to request access.
    </p>
  </div>
);

// ── Team Section Component ──────────────────────────────────────────────

type TeamRole = 'Owner' | 'Recruiter' | 'Viewer';
interface TeamMember { id: string; memberEmail: string; memberName: string; role: TeamRole; status: 'active' | 'pending'; createdAt: string; }

const ROLE_PERMISSIONS: Record<TeamRole, string[]> = {
  Owner: ['Post Jobs', 'Manage Applications', 'Invite Members', 'Remove Members', 'Change Roles', 'View Analytics'],
  Recruiter: ['Post Jobs', 'Manage Applications', 'View Analytics'],
  Viewer: ['View Analytics'],
};

const TeamSection: React.FC<{ employerEmail: string; currentUserEmail?: string; companyName: string; showToast: (message: string, type?: ToastType) => void; canInvite?: boolean }> = ({ employerEmail, currentUserEmail, companyName, showToast, canInvite = true }) => {
  // currentUserEmail = logged-in user's own email (for "You" label)
  // employerEmail = owner's email (used to query the team API)
  const API_BASE = import.meta.env.VITE_API_URL || '/api';
  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<TeamRole>('Recruiter');
  const [inviteName, setInviteName] = React.useState('');
  const [invitePassword, setInvitePassword] = React.useState('');
  const [showInvitePw, setShowInvitePw] = React.useState(false);
  const [showInvite, setShowInvite] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<TeamRole | null>(null);
  const [inviteSent, setInviteSent] = React.useState(false);
  const [inviting, setInviting] = React.useState(false);
  const [inviteError, setInviteError] = React.useState('');
  const [inviteToken, setInviteToken] = React.useState('');
  const [inviteCredentials, setInviteCredentials] = React.useState<{ email: string; password: string; role: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = React.useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const closeConfirm = () => setConfirmDialog(c => ({ ...c, isOpen: false }));

  // Generate a secure random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const fetchMembers = React.useCallback(async () => {
    try {
      const res = await apiFetch(`${API_BASE}/team?employerId=${encodeURIComponent(employerEmail)}`);
      if (res.ok) {
        const data = await res.json();
        // Only auto-create Owner record if the current user IS the owner
        const isOwner = !currentUserEmail || currentUserEmail === employerEmail;
        const hasOwner = data.some((m: TeamMember) => m.memberEmail === employerEmail && m.role === 'Owner');
        if (!hasOwner && isOwner) {
          await apiFetch(`${API_BASE}/team`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employerId: employerEmail, memberEmail: employerEmail, memberName: 'You (Owner)', role: 'Owner', status: 'active' })
          });
          const res2 = await apiFetch(`${API_BASE}/team?employerId=${encodeURIComponent(employerEmail)}`);
          if (res2.ok) setMembers(await res2.json());
          else setMembers([{ id: '1', memberEmail: employerEmail, memberName: 'You (Owner)', role: 'Owner', status: 'active', createdAt: new Date().toISOString() }]);
        } else {
          setMembers(
  [...data].sort((a, b) => {
    if (a.role === 'Owner') return -1;
    if (b.role === 'Owner') return 1;
    return a.memberName.localeCompare(b.memberName);
  })
);
        }
      } else {
        console.error('Team API error:', res.status, res.statusText);
        setMembers([{ id: '1', memberEmail: employerEmail, memberName: 'You (Owner)', role: 'Owner', status: 'active', createdAt: new Date().toISOString() }]);
      }
    } catch (e) { 
      console.error('Team fetch error:', e);
      setMembers([{ id: '1', memberEmail: employerEmail, memberName: 'You (Owner)', role: 'Owner', status: 'active', createdAt: new Date().toISOString() }]);
    }
    finally { setLoading(false); }
  }, [employerEmail, currentUserEmail, API_BASE]);

  React.useEffect(() => { fetchMembers(); }, [fetchMembers]);

  // Auto-refresh every 15s while there are pending invites
  React.useEffect(() => {
    const hasPending = members.some(m => m.status === 'pending');
    if (!hasPending) return;
    const interval = setInterval(fetchMembers, 15000);
    return () => clearInterval(interval);
  }, [members, fetchMembers]);

  const handleInvite = async () => {
    setInviteError('');
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) { setInviteError('Enter a valid email address.'); return; }
    if (!invitePassword.trim() || invitePassword.length < 8) { setInviteError('Password must be at least 8 characters.'); return; }
    if (members.find(m => m.memberEmail === inviteEmail.trim())) { setInviteError('This email is already in the team.'); return; }
    setInviting(true);
    try {
      const res = await apiFetch(`${API_BASE}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employerId: employerEmail,
          memberEmail: inviteEmail.trim(),
          memberName: inviteName.trim() || inviteEmail.split('@')[0],
          role: inviteRole,
          password: invitePassword,
          companyName,
          emailType: 'credentials',
          loginUrl: `${window.location.origin}/employer-login`,
          inviteBaseUrl: `${window.location.origin}/team/accept`
        })
      });
      if (res.ok) {
        const result = await res.json();
        setInviteToken(result.token || result.inviteToken || result.data?.token || '');
        setInviteCredentials({ email: inviteEmail.trim(), password: invitePassword, role: inviteRole });
        await fetchMembers();
        setInviteSent(true);
      } else {
        const err = await res.json();
        setInviteError(err.error || 'Failed to invite. Please try again.');
      }
    } catch { setInviteError('Network error. Please try again.'); }
    finally { setInviting(false); }
  };

  const handleCloseInvite = () => {
    setShowInvite(false);
    setInviteSent(false);
    setInviteEmail('');
    setInviteName('');
    setInviteRole('Recruiter');
    setInviteToken('');
    setInvitePassword('');
    setInviteCredentials(null);
    setInviteError('');
  };

  const handleRoleChange = async (id: string, role: TeamRole) => {
    try {
      const res = await apiFetch(`${API_BASE}/team/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (res.ok) { await fetchMembers(); showToast('Role updated', 'success'); }
    } catch { showToast('Failed to update role', 'error'); }
  };

  const handleRemove = async (id: string) => {
    try {
      const res = await apiFetch(`${API_BASE}/team/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== id));
        showToast('Member removed successfully', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Failed to remove member', 'error');
      }
    } catch {
      showToast('Network error. Failed to remove member.', 'error');
    }
  };

  const roleColors: Record<TeamRole, string> = {
    Owner: 'bg-slate-100 text-[#1e3a8a] border-slate-200',
    Recruiter: 'bg-slate-50 text-slate-700 border-slate-200',
    Viewer: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a]"></div></div>;

  return (
    <>
      <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={closeConfirm} />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a8a]">Team Management</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5 truncate">{companyName} · {members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {members.some(m => m.status === 'pending') && (
            <button onClick={fetchMembers}
              className="flex items-center justify-center gap-1.5 text-xs border border-slate-200 bg-white text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm min-h-[36px] sm:min-h-[38px]">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          )}
          {canInvite ? (
            <button onClick={() => setShowInvite(true)}
              className="flex items-center justify-center gap-2 bg-[#2563eb] text-white px-4 py-2 rounded-lg hover:bg-[#1d4ed8] transition-colors font-semibold text-xs sm:text-sm shadow-sm min-h-[36px] sm:min-h-[38px]">
              <UserPlus className="w-4 h-4" /> 
              <span>Invite Member</span>
            </button>
          ) : (
            <span className="flex items-center justify-center gap-2 bg-slate-100 text-slate-400 px-4 py-2 rounded-lg text-xs sm:text-sm border border-slate-200 cursor-not-allowed min-h-[36px] sm:min-h-[38px]" title="Only Owners can invite members">
              <UserPlus className="w-4 h-4" /> 
              <span>Invite Member</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-5">
        {(Object.entries(ROLE_PERMISSIONS) as [TeamRole, string[]][]).map(([role, perms]) => (
          <div key={role} onClick={() => setSelectedRole(selectedRole === role ? null : role)}
            className={`bg-white rounded-lg p-3.5 sm:p-4 border border-[#e2e8f0] cursor-pointer transition-all shadow-sm ${
              selectedRole === role ? 'border-[#2563eb] shadow-sm ring-1 ring-[#2563eb]' : 'border-slate-200 hover:border-slate-300'
            }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${roleColors[role]}`}>{role}</span>
              <span className="text-xs text-slate-400">{members.filter(m => m.role === role).length} member{members.filter(m => m.role === role).length !== 1 ? 's' : ''}</span>
            </div>
            <ul className="space-y-1">
              {perms.map(p => <li key={p} className="text-xs text-slate-600 flex items-center gap-1.5"><span className="text-[#1e3a8a] font-bold flex-shrink-0">✓</span><span className="truncate">{p}</span></li>)}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Owner Section ── */}
      {(() => {
        const owner = members.find(m => m.role === 'Owner');
        if (!owner) return null;
        return (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-xs font-bold text-[#1e3a8a] uppercase tracking-wider">Owner</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="bg-white border border-[#e2e8f0] rounded-lg p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:border-[#bfdbfe] transition-all">
              <div className="w-11 h-11 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-[#1e3a8a] font-bold text-base flex-shrink-0">
                {owner.memberName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1e3a8a] text-sm truncate">{owner.memberName}</p>
                <p className="text-xs text-slate-500 truncate">{owner.memberEmail}</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold text-center ${
                  owner.status === 'pending' ? 'bg-slate-50 text-slate-700 border-slate-200' : 
                  owner.status === 'active' ? 'bg-slate-100 text-[#1e3a8a] border-slate-200' :
                  roleColors[owner.role]
                }`}>
                  {owner.status === 'pending' ? '⏳ Pending' : owner.status === 'active' ? '✅ Active' : owner.status || 'Active'}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold text-center ${roleColors[owner.role]}`}>
                  {owner.role}
                </span>
                {owner.memberEmail !== (currentUserEmail || employerEmail) ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <AutocompleteCombobox value={owner.role} onChange={(val) => handleRoleChange(owner.id, val as TeamRole)}
                      options={[
                        { value: 'Recruiter', label: 'Recruiter' },
                        { value: 'Viewer', label: 'Viewer' },
                        { value: 'Owner', label: 'Owner' }
                      ]}
                      placeholder="Select role"
                      className="text-xs min-w-[100px]"
                    />
                    <button onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to remove this team member?')) {
                        await handleRemove(owner.id);
                      }
                    }}
                      className="text-red-600 hover:text-red-700 text-xs border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap">
                      Remove
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic text-center sm:text-left px-2">You</span>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Team Members Section ── */}
      {(() => {
        const teamMembers = members.filter(m => m.role !== 'Owner');
        return (
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Team Members</span>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{teamMembers.length}</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            {teamMembers.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UserPlus className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-[#1e3a8a]">No team members yet</p>
                <p className="text-xs text-slate-400 mt-1">Invite recruiters or viewers to collaborate on hiring</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {teamMembers.map(member => (
                    <div key={member.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 hover:bg-slate-50/60 transition-colors">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[#1e3a8a] font-bold text-xs sm:text-sm flex-shrink-0">
                        {member.memberName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-[#1e3a8a] text-sm truncate">{member.memberName}</p>
                          {member.memberEmail === currentUserEmail && (
                            <span className="text-[10px] font-semibold text-[#1e3a8a] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">You</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{member.memberEmail}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold text-center ${
                          member.status === 'pending' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                          'bg-slate-100 text-[#1e3a8a] border-slate-200'
                        }`}>
                          {member.status === 'pending' ? '⏳ Pending' : '✅ Active'}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold text-center ${roleColors[member.role]}`}>
                          {member.role}
                        </span>
                        {member.memberEmail !== (currentUserEmail || employerEmail) ? (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <AutocompleteCombobox value={member.role} onChange={(val) => handleRoleChange(member.id, val as TeamRole)}
                              options={[
                                { value: 'Recruiter', label: 'Recruiter' },
                                { value: 'Viewer', label: 'Viewer' },
                                { value: 'Owner', label: 'Owner' }
                              ]}
                              placeholder="Select role"
                              className="text-xs min-w-[100px]"
                            />
                            <button onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (window.confirm('Are you sure you want to remove this team member?')) {
                                await handleRemove(member.id);
                              }
                            }}
                              className="text-red-600 hover:text-red-700 text-xs border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap">
                              Remove
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic text-center sm:text-left px-2">You</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-sm sm:max-w-md p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h3 className="text-base sm:text-lg font-bold text-[#1e3a8a]">
                {inviteSent ? '✅ Invite Sent!' : 'Invite Team Member'}
              </h3>
              <button onClick={handleCloseInvite} className="text-slate-400 hover:text-slate-600 text-xl p-1 leading-none">&times;</button>
            </div>

            {inviteSent && inviteCredentials ? (
              <div className="py-2">
                <div className="flex flex-col items-center mb-5">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2.5">
                    <span className="text-2xl">🎉</span>
                  </div>
                  <h4 className="font-bold text-[#1e3a8a] text-base">Member Added!</h4>
                  <p className="text-slate-500 text-xs mt-1 text-center">Share these credentials securely with the team member.</p>
                </div>

                {/* Credential Card */}
                <div className="bg-[#2563eb] rounded-xl p-4 mb-4 shadow-sm text-white">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-bold text-xs uppercase tracking-wider">🔐 Login Credentials</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">{inviteCredentials.role}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-white/10 rounded-lg px-3 py-2">
                      <p className="text-slate-300 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Login URL</p>
                      <p className="text-white text-xs font-mono">{window.location.origin}/employer-login</p>
                    </div>
                    <div className="bg-white/10 rounded-lg px-3 py-2">
                      <p className="text-slate-300 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Email</p>
                      <p className="text-white text-xs sm:text-sm font-mono">{inviteCredentials.email}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg px-3 py-2">
                      <p className="text-slate-300 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Password</p>
                      <p className="text-white text-xs sm:text-sm font-mono">{inviteCredentials.password}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg px-3 py-2">
                      <p className="text-slate-300 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Access Level</p>
                      <p className="text-slate-200 text-xs">{ROLE_PERMISSIONS[inviteCredentials.role as TeamRole].join(' · ')}</p>
                    </div>
                  </div>
                </div>

                {/* Copy All button */}
                <button
                  onClick={() => {
                    const text = `ZyncJobs Team Login\nURL: ${window.location.origin}/employer-login\nEmail: ${inviteCredentials.email}\nPassword: ${inviteCredentials.password}\nRole: ${inviteCredentials.role}\nAccess: ${ROLE_PERMISSIONS[inviteCredentials.role as TeamRole].join(', ')}`;
                    navigator.clipboard.writeText(text);
                    showToast('Credentials copied to clipboard!', 'success');
                  }}
                  className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors mb-3 flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Copy All Credentials
                </button>

                <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-4 text-center">
                  ⚠️ Share these credentials privately. The member should change their password after first login.
                </p>

                <div className="flex gap-3">
                  <button onClick={handleCloseInvite} className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-50 transition-colors">Done</button>
                  <button onClick={() => { setInviteSent(false); setInviteCredentials(null); setInviteEmail(''); setInviteName(''); setInvitePassword(''); }} className="flex-1 bg-[#2563eb] text-white py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#1d4ed8] transition-colors">Invite Another</button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Name</label>
                    <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)}
                      placeholder="John Doe" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                    <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                      placeholder="recruiter@company.com" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none"
                      onKeyDown={e => e.key === 'Enter' && handleInvite()} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                    <AutocompleteCombobox value={inviteRole} onChange={(val) => setInviteRole(val as TeamRole)}
                      options={[
                        { value: 'Recruiter', label: 'Recruiter — Can post jobs & manage applications' },
                        { value: 'Viewer', label: 'Viewer — View only access' },
                        { value: 'Owner', label: 'Owner — Full access' }
                      ]}
                      placeholder="Select role"
                      className="w-full text-xs"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">Login Password *</label>
                      <button type="button" onClick={() => setInvitePassword(generatePassword())}
                        className="text-xs text-[#2563eb] hover:text-[#1d4ed8] font-semibold border border-[#e2e8f0] px-2 py-0.5 rounded-md hover:bg-[#eff6ff] transition-colors">
                        ✨ Auto-generate
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showInvitePw ? 'text' : 'password'}
                        value={invitePassword}
                        onChange={e => setInvitePassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-10 text-xs sm:text-sm focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none font-mono"
                      />
                      <button type="button" onClick={() => setShowInvitePw(!showInvitePw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showInvitePw
                          ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                          : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        }
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Member will use this password to login at the Employer Login page.</p>
                  </div>
                  {/* Role permissions preview */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-xs text-slate-700 font-semibold mb-1.5">This person will be able to:</p>
                    <ul className="space-y-1">
                      {ROLE_PERMISSIONS[inviteRole].map(p => (
                        <li key={p} className="text-xs text-slate-600 flex items-center gap-1.5">
                          <span className="text-[#1e3a8a] font-bold flex-shrink-0">✓</span>
                          <span className="truncate">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {inviteError && (
                  <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{inviteError}</span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <button onClick={handleCloseInvite}
                    className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
                  <button onClick={handleInvite} disabled={inviting || !inviteEmail.trim() || invitePassword.length < 8}
                    className="flex-1 bg-[#2563eb] text-white py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                    {inviting ? 'Creating...' : 'Create & Send Credentials'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default EmployerDashboardPage;
