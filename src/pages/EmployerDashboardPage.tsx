import React, { useState, useEffect, useMemo } from 'react';
import { Briefcase, MessageSquare, FileText, Bookmark, Settings, Trash2, LogOut, Bell, Users, UserPlus, MapPin, Mail, TrendingUp, BarChart2, Search, Calendar, Clock, Video, Sparkles, Shield } from 'lucide-react';
import CandidateProfileView from './CandidateProfileView';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { API_ENDPOINTS } from '../config/constants';
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

// Module-level cache: job IDs confirmed missing from the DB — never re-fetch these
const _missingJobIds = new Set<string>();

interface EmployerDashboardPageProps {
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
  const [interviews, setInterviews] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeMenu, setActiveMenu] = useState('dashboard');
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
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [viewingCandidateId, setViewingCandidateId] = useState<string | null>(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  const getToken = () => tokenStorage.getAccess();

  // Fetch recent conversations for sidebar Messages panel
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) return;
        const { id, _id } = JSON.parse(userData);
        const userId = id || _id;
        if (!userId) return;
        const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/messages?candidateId=${encodeURIComponent(userId)}`);
        if (!res.ok) return;
        const convos = await res.json();
        // Enrich each conversation with the other party's info
        const enriched = await Promise.all(
          convos.slice(0, 4).filter((c: any) => c.lastMessage).map(async (c: any) => {
            const msg = c.lastMessage;
            const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
            try {
              const uRes = await apiFetch(`${API_ENDPOINTS.BASE_URL}/users/${otherId}`);
              const uData = (uRes.ok) ? await uRes.json() : {};
              return {
                ...c,
                otherName: uData.name || uData.fullName || 'Candidate',
                otherPhoto: uData.profilePicture || uData.photo || '',
                preview: msg.message?.substring(0, 40) || ''
              };
            } catch { return { ...c, otherName: 'Candidate', otherPhoto: '', preview: msg.message?.substring(0,40)||'' }; }
          })
        );
        setRecentMessages(enriched);
      } catch (e) { console.error('Messages fetch error:', e); }
    };
    fetchMessages();
  }, []);

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
          setNotifications(dynamicNotifications);
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
      setNotifications(fallbackNotifications);
    };
    
    // Initial fetch
    fetchNotifications();
    
    // Set up real-time updates - fetch every 30 seconds
    const notificationInterval = setInterval(fetchNotifications, 30000);
    
    return () => {
      clearInterval(notificationInterval);
    };
  }, []); // Run once on mount only

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setJobs([]);
      setApplications([]);
      setInterviews([]);
      setDashboardStats(null);
      setRecentActivity([]);
      
      setUser(parsedUser);
      setEmployerName(parsedUser.name || 'Employer');
      // Live fetch team role from backend on every load
      const _ue = parsedUser.email;
      if (_ue) {
        fetch(`${import.meta.env.VITE_API_URL || '/api'}/team/check?memberEmail=${encodeURIComponent(_ue)}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data?.hasInvite && data.role) {
              const liveRole = data.role as 'Owner' | 'Recruiter' | 'Viewer';
              setTeamRole(liveRole);
              const resolvedOwner = data.employerId || _ue;
              setOwnerEmailState(resolvedOwner);
              const _s = JSON.parse(localStorage.getItem('user') || '{}');
              _s.teamRole = liveRole;
              _s.employerOwnerId = resolvedOwner;
              localStorage.setItem('user', JSON.stringify(_s));
              fetchDashboardData({ ...parsedUser, employerOwnerId: resolvedOwner, teamRole: liveRole });
            } else {
              setTeamRole('Owner');
              setOwnerEmailState(_ue);
              // Owner — fetch with own email
              fetchDashboardData({ ...parsedUser, employerOwnerId: null });
            }
          })
          .catch(() => {
            if (parsedUser.teamRole) setTeamRole(parsedUser.teamRole as 'Owner' | 'Recruiter' | 'Viewer');
            const fallbackOwner = parsedUser.employerOwnerId || _ue;
            setOwnerEmailState(fallbackOwner);
            fetchDashboardData({ ...parsedUser, employerOwnerId: parsedUser.employerOwnerId || null });
          });
      }
      // Fix: Use actual company name from registration, not generic 'Company'
      // For team members, prefer the owner's companyName stored in their profile
      const actualCompanyName = parsedUser.companyName || parsedUser.ownerCompanyName || parsedUser.company || parsedUser.organizationName || 'Company';
      setCompanyName(actualCompanyName);
      setCompanyLogo(parsedUser.companyLogo || '');
      
      // Check if profile completion popup should be shown
      // Only show for FIRST TIME after registration (not on subsequent visits)
      const hasCompletedProfile = parsedUser.industry && 
                                 parsedUser.companySize && 
                                 parsedUser.headquarters && 
                                 parsedUser.companyDescription &&
                                 parsedUser.companyWebsite &&
                                 parsedUser.tagline;
      
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
      
      // For team members: fetch data using the owner's employerId so they see the owner's jobs/apps
      fetchDashboardData(parsedUser);
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
    
    const handleJobDeleted = () => { if (user) fetchDashboardData(user); };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('jobDeleted', handleJobDeleted);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('jobDeleted', handleJobDeleted);
    };
  }, [user]);

  const fetchDashboardData = async (userData: any) => {
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
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          const myEmployerId = storedUser.employerId;
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
                  const jobRes = await fetch(`${API_ENDPOINTS.JOBS}/${appJobId}`);
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
        // Only send employerId if it's a valid non-numeric ID (UUID/ObjectId)
        const isValidId = (id: any) => id && typeof id === 'string' && !/^\d+$/.test(id);
        const interviewEmployerId = isValidId(ownerEmployerId) ? ownerEmployerId : isValidId(userId) ? userId : '';
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
      } catch {
        setInterviews([]);
      }

      // Fetch Dashboard Stats (non-critical, fail silently)
      try {
        const storedUserForStats = JSON.parse(localStorage.getItem('user') || '{}');
        const myCompanyForStats = storedUserForStats.companyName || storedUserForStats.company || '';
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

    const domainMap: Record<string, string> = {
      zoho: 'zoho.com', tcs: 'tcs.com', infosys: 'infosys.com', wipro: 'wipro.com',
      google: 'google.com', microsoft: 'microsoft.com', amazon: 'amazon.com',
      accenture: 'accenture.com', cognizant: 'cognizant.com', hcl: 'hcltech.com',
      oracle: 'oracle.com', ibm: 'ibm.com', capgemini: 'capgemini.com',
    };
    const n = (companyName || '').toLowerCase();
    for (const [key, domain] of Object.entries(domainMap)) {
      if (n.includes(key)) return `https://img.logo.dev/${domain}?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80`;
    }

    if (user?.email?.includes('@')) {
      const emailDomain = user.email.split('@')[1];
      if (emailDomain && !['gmail.com','yahoo.com','outlook.com','hotmail.com'].includes(emailDomain)) {
        return `https://img.logo.dev/${emailDomain}?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80`;
      }
    }

    const displayName = companyName && companyName !== 'Company' ? companyName : employerName;
    const initials = displayName.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2);
    return `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="32" fill="#1e40af"/>
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


  const PIE_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];
  
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
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      percentage: jobsPercentage
    },
    { 
      label: 'Applications', 
      value: dashboardStats?.applications?.toString() || '0', 
      icon: FileText, 
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      percentage: applicationsPercentage
    },
    { 
      label: 'Interviews', 
      value: dashboardStats?.interviews?.toString() || '0', 
      icon: Users, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      percentage: interviewsPercentage
    },
    { 
      label: 'Hired', 
      value: dashboardStats?.hired?.toString() || '0', 
      icon: UserPlus, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
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
    // Retry after a tick in case header isn't in DOM yet on first render
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

  if (viewingCandidateId) {
    return (
      <div className="fixed inset-0 z-[9999] overflow-y-auto bg-white">
        <CandidateProfileView
          candidateId={viewingCandidateId}
          onNavigate={onNavigate}
          onBack={() => setViewingCandidateId(null)}
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 flex" style={{height: `calc(100vh - ${headerHeight}px)`, overflow: 'hidden', scrollBehavior: 'smooth'}}>
      {/* Error Display */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded z-50 max-w-xs sm:max-w-md text-sm">
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

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" style={{top: `${headerHeight}px`}} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — fixed height, independent scroll */}
      <div className={`employer-sidebar flex flex-col flex-shrink-0 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 transition-transform duration-300 z-40 fixed left-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} style={{top: `${headerHeight}px`, width: '300px', height: `calc(100vh - ${headerHeight}px)`, overflowY: 'auto', overflowX: 'hidden', scrollBehavior: 'smooth'}}>
            {/* Profile header - Enhanced */}
            <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b border-blue-700">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-white flex items-center justify-center border-2 border-white shadow-md overflow-hidden">
                    <img src={getDisplayLogo()} alt={companyName || employerName}
                      className="w-10 sm:w-14 h-10 sm:h-14 object-contain"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        const displayName = companyName || employerName;
                        if ((displayName.toLowerCase().includes('trinity') || 
                             user?.email?.includes('trinity') || 
                             user?.email?.includes('@trinitetech')) && 
                            !img.src.includes('trinity-logo')) {
                          if (!img.src.includes('trinity-logo.webp')) {
                            img.src = '/images/trinity-logo.webp';
                          } else {
                            img.src = '/images/company-logos/trinity-logo.png';
                          }
                          return;
                        }
                        if (displayName.toLowerCase().includes('nambikkai') && !img.src.includes('nambikkai-logo.png')) {
                          img.src = '/images/company-logos/nambikkai-logo.png';
                          return;
                        }
                        const initials = displayName.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2);
                        const fallbackUrl = `data:image/svg+xml,${encodeURIComponent(
                          `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#1e40af"/><text x="32" y="40" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="20" font-weight="bold">${initials}</text></svg>`
                        )}`;
                        if (img.src !== fallbackUrl) img.src = fallbackUrl;
                      }}
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm sm:text-base leading-tight">{employerName}</p>
                  <p className="text-xs sm:text-sm text-white leading-snug mt-0.5 font-medium" style={{wordBreak:'break-word', whiteSpace:'normal'}}>
                    {companyName && companyName !== 'Company' ? companyName :
                     user?.email?.includes('@trinitetech') ? 'Trinity Technology Solutions' :
                     user?.email?.includes('@') ? user.email.split('@')[1].split('.')[0].charAt(0).toUpperCase() + user.email.split('@')[1].split('.')[0].slice(1) :
                     'Company'}
                  </p>
                </div>
                {/* Close button — mobile only */}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden flex-shrink-0 text-white/70 hover:text-white p-1 rounded-lg hover:bg-blue-700/50 transition-colors"
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages + Activity panel - Enhanced Card Style */}
            <div className="px-3 sm:px-4 py-3 sm:py-4 mx-2 sm:mx-3 mt-3 sm:mt-4 bg-gradient-to-br from-blue-600/80 to-blue-700/70 rounded-xl border-2 border-blue-400/80 backdrop-blur-sm shadow-lg">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">💬 Messages</span>
                <button onClick={() => onNavigate('candidate-messages')} className="text-white hover:text-blue-100 transition-colors">
                  <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
              {recentMessages.length === 0 ? (
                <p className="text-xs sm:text-sm text-white text-center py-2">No messages yet</p>
              ) : (
                <div className="space-y-1.5 sm:space-y-2">
                  {recentMessages.map((c, i) => (
                    <div key={i} onClick={() => onNavigate('candidate-messages')} className="flex items-center gap-2 cursor-pointer hover:bg-blue-500/40 rounded-lg p-1.5 sm:p-2 transition-all duration-200 border border-transparent hover:border-blue-300/60">
                      {c.otherPhoto ? (
                        <img src={c.otherPhoto} alt={c.otherName} className="w-6 sm:w-8 h-6 sm:h-8 rounded-full object-cover flex-shrink-0 border-2 border-blue-300/60" />
                      ) : (
                        <div className="w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {c.otherName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-white truncate">{c.otherName}</p>
                        <p className="text-xs text-white truncate">{c.preview}...</p>
                      </div>
                      {c.unreadCount > 0 && (
                        <span className="bg-blue-400 text-white text-xs w-4 sm:w-5 h-4 sm:h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[9px] sm:text-[10px]">{c.unreadCount}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Role badge for team members */}
            {teamRole && (
              <div className="mx-3 mt-2 px-3 py-2 rounded-lg bg-blue-700/50 border border-blue-500/50 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-500/60 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-blue-300 font-medium leading-none mb-0.5">Role</p>
                  <p className="text-sm font-bold text-white leading-none">{teamRole === 'Owner' ? 'Admin' : teamRole}</p>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                  teamRole === 'Owner' ? 'bg-emerald-400/30 text-emerald-300 border border-emerald-400/40' :
                  teamRole === 'Recruiter' ? 'bg-orange-400/30 text-orange-300 border border-orange-400/40' :
                  'bg-gray-400/30 text-gray-300 border border-gray-400/40'
                }`}>Active</span>
              </div>
            )}

            {/* Navigation */}
            <nav className="py-4 flex flex-col px-3 space-y-1">
              {([
                { key: 'dashboard',        label: 'Dashboard',         icon: <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>, action: () => setActiveMenu('dashboard'), show: true },
                { key: 'job-management',   label: 'Job Management',    icon: <Briefcase className="w-[18px] h-[18px] flex-shrink-0" />, action: () => withRoleCheck('Job Management', 'Recruiter', () => onNavigate('job-management')), external: true, show: true },
                { key: 'ranking',          label: 'Candidate Ranking', icon: <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, action: () => withRoleCheck('Candidate Ranking', 'Recruiter', () => onNavigate('candidate-ranking')), external: true, show: true },
                { key: 'ai-recruiter',     label: 'AI Recruiter',      icon: <Sparkles className="w-[18px] h-[18px] flex-shrink-0" />, action: () => withRoleCheck('AI Recruiter', 'Recruiter', () => onNavigate('ai-recruiter')), external: true, show: true },
                { key: 'applications',     label: 'Applications',      icon: <Users className="w-[18px] h-[18px] flex-shrink-0" />, action: () => withRoleCheck('Applications', 'Recruiter', () => setActiveMenu('applications')), badge: applications.length || null, show: true },
                { key: 'interviews',       label: 'Interviews',        icon: <MessageSquare className="w-[18px] h-[18px] flex-shrink-0" />, action: () => withRoleCheck('Interviews', 'Recruiter', () => setActiveMenu('interviews')), badge: interviews.length || null, show: true },
                { key: 'posted-jobs',      label: 'Posted Jobs',       icon: <Briefcase className="w-[18px] h-[18px] flex-shrink-0" />, action: () => withRoleCheck('Posted Jobs', 'Recruiter', () => onNavigate('my-jobs')), external: true, badge: jobs.length || null, show: true },
                { key: 'analytics',        label: 'Analytics',         icon: <TrendingUp className="w-[18px] h-[18px] flex-shrink-0" />, action: () => onNavigate('analytics'), external: true, show: true },
                { key: 'team',             label: 'Team',              icon: <Users className="w-[18px] h-[18px] flex-shrink-0" />, action: () => withRoleCheck('Team Management', 'Owner', () => setActiveMenu('team')), show: true },
                { key: 'auto-rejection',   label: 'AI Rejection',      icon: <Settings className="w-[18px] h-[18px] flex-shrink-0" />, action: () => withRoleCheck('AI Auto-Rejection', 'Owner', () => setActiveMenu('auto-rejection')), show: true },
                { key: 'candidate-search', label: 'Search Candidates', icon: <Search className="w-[18px] h-[18px] flex-shrink-0" />, action: () => withRoleCheck('Search Candidates', 'Recruiter', () => onNavigate('candidate-search')), external: true, show: true },
                { key: 'saved-candidates', label: 'Saved Candidates',  icon: <Bookmark className="w-[18px] h-[18px] flex-shrink-0" />, action: () => withRoleCheck('Saved Candidates', 'Recruiter', () => setActiveMenu('saved-candidates')), show: true },
                { key: 'credentialing',    label: 'Credentialing',     icon: <Shield className="w-[18px] h-[18px] flex-shrink-0" />, action: () => withRoleCheck('Credentialing', 'Owner', () => setActiveMenu('credentialing')), show: true },
                { key: 'settings',         label: 'Account Settings',  icon: <Settings className="w-[18px] h-[18px] flex-shrink-0" />, action: () => withRoleCheck('Account Settings', 'Owner', () => onNavigate('settings')), external: true, show: true },
              ] as { key: string; label: string; icon: React.ReactNode; action: () => void; external?: boolean; badge?: number | null; badgeRed?: boolean; show: boolean }[]).filter(item => item.show).map(item => {
                const isActive = activeMenu === item.key;
                return (
                  <button key={item.key} onClick={item.action}
                    style={{ fontSize: '15px' }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left font-medium ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-lg shadow-blue-400/40'
                        : 'text-white hover:bg-blue-700/60 hover:text-white'
                    }`}
                  >
                    <span className={`flex-shrink-0 text-lg ${isActive ? 'text-white' : 'text-blue-200'}`}>{item.icon}</span>
                    <span className="leading-tight flex-1 truncate" style={{ fontSize: '15px' }}>{item.label}</span>
                    {item.badge ? (
                      <span style={{ fontSize: '11px' }} className={`flex-shrink-0 min-w-[20px] h-[20px] px-1 rounded-full font-bold flex items-center justify-center ${
                        item.badgeRed ? 'bg-red-500 text-white' : 'bg-emerald-400 text-slate-900'
                      }`}>{item.badge}</span>
                    ) : null}
                  </button>
                );
              })}

              {/* Delete Account */}
              <button onClick={() => openConfirm(
                'Delete Account',
                'This will permanently delete your account, all posted jobs, applications, and data. This cannot be undone. Are you sure?',
                async () => {
                  closeConfirm();
                  try {
                    const stored = localStorage.getItem('user');
                    const userData = stored ? JSON.parse(stored) : {};
                    const userId = userData.id || userData._id;
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
              )}
                style={{ fontSize: '15px' }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all duration-200 text-left mt-2">
                <Trash2 className="w-[18px] h-[18px] flex-shrink-0" />
                <span style={{ fontSize: '15px' }}>Delete Account</span>
              </button>
            </nav>

            {/* Logout Button */}
            <div className="px-3 py-4 border-t border-blue-700 mt-auto" style={{paddingBottom: '32px', marginBottom: '0'}}>
              <button
                onClick={() => {
                  if (onLogout) { onLogout(); } else { localStorage.removeItem('user'); onNavigate('home'); }
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white hover:bg-blue-700/50 hover:text-white transition-all duration-200 font-medium"
              >
                <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
                <span style={{ fontSize: '15px' }}>Logout</span>
              </button>
            </div>
      </div>

      {/* Main Content — offset by sidebar width on desktop, independent scroll */}
      <div className="flex-1 bg-gray-50 min-w-0 overflow-y-auto lg:pl-[300px]" style={{height: '100%', scrollBehavior: 'smooth'}}>
{/* Top bar with Back Button */}
        <div className="flex items-center justify-between gap-2 py-3 px-3 sm:px-4 lg:px-6">
          <div className="flex items-center gap-2">
            {/* Inline static menu toggle — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex-shrink-0 bg-blue-700 text-white p-2 rounded-lg"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <BackButton
              onClick={() => onNavigate('home')}
              text="Back to Home"
              className="hidden lg:flex"
            />
            <h1 className="lg:hidden text-lg font-bold text-gray-900 truncate">Dashboard</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Complete Profile Button */}
            <button
              onClick={() => onNavigate('employer-complete-profile')}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-colors text-xs shadow-lg flex items-center gap-1"
              title="Complete your company profile"
            >
              <span className="hidden sm:inline">Edit Profile</span>
              <span className="sm:hidden">Edit</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            
            {/* Post Job Button */}
            {canPostJobs ? (
              <button
                onClick={() => onNavigate('job-posting-selection')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-2 py-1.5 sm:px-5 sm:py-2 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-colors text-xs shadow-lg"
                title="Post a new job"
              >
                <span className="hidden sm:inline">Post Job</span>
                <span className="sm:hidden">Post</span>
              </button>
            ) : (
              <span className="bg-gray-100 text-gray-400 px-2 py-1.5 sm:px-5 sm:py-2 rounded-lg text-xs border border-gray-200 cursor-not-allowed" title="View only access — cannot post jobs">
                <span className="hidden sm:inline">View Only</span>
                <span className="sm:hidden">View</span>
              </span>
            )}
            
            {/* Notification Bell - Moved to right side */}
            <div className="relative">
              <button
                onClick={async () => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) {
                    try {
                      const userData = localStorage.getItem('user');
                      if (userData) {
                        const { email } = JSON.parse(userData);
                        const fresh = await NotificationService.fetchNotifications(email);
                        setNotifications(fresh);
                      }
                    } catch (e) { console.error('Bell fetch error:', e); }
                  }
                }}
                className="relative p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center font-bold text-[9px] sm:text-[10px]">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>


        {/* Dashboard Content */}
        <div className="pt-0 pb-2 flex-1 min-w-0">
          <div className="px-3 sm:px-4 lg:px-6">
          {activeMenu === 'dashboard' ? (
            <>
              <div className="mb-4 sm:mb-6">
                <h1 className="hidden lg:block text-2xl sm:text-3xl font-bold text-gray-900">Employer Dashboard</h1>
                <p className="text-gray-500 mt-1 text-sm">Welcome back, {employerName} here's your hiring overview</p>
                {isViewer && (
                  <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-lg text-sm">
                    <span className="text-base">👁️</span>
                    <span>You have <strong>View Only</strong> access. Contact the Owner to request additional permissions.</span>
                  </div>
                )}
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl sm:rounded-2xl shadow-md border-2 border-gray-200 p-3 sm:p-4 lg:p-6">

              {/* ── Stat Cards ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
                {stats.map((stat, index) => {
                  const isPositive = !stat.percentage.startsWith('-');
                  const numericPct = parseInt(stat.percentage.replace(/[^0-9-]/g, '')) || 0;
                  const clampedPct = Math.min(Math.abs(numericPct), 100);
                  const isNumericPct = stat.percentage.includes('%');
                  const radius = 24;
                  const circumference = 2 * Math.PI * radius;
                  const fillRatio = isNumericPct ? clampedPct / 100 : 0.6;
                  const strokeDash = fillRatio * circumference;
                  const ringColors = ['#3b82f6','#06b6d4','#f59e0b','#10b981'];
                  const ringColor = isPositive ? ringColors[index] : '#ef4444';
                  const numVal = parseInt(stat.value) || 0;
                  const displayVal = numVal >= 1000 ? `${(numVal/1000).toFixed(1)}K` : stat.value;
                  const borderColors = ['border-t-blue-500','border-t-cyan-500','border-t-amber-500','border-t-emerald-500'];
                  const bgGradients = ['from-blue-50 to-white','from-cyan-50 to-white','from-amber-50 to-white','from-emerald-50 to-white'];
                  return (
                    <div key={index} className={`bg-gradient-to-br ${bgGradients[index]} rounded-xl sm:rounded-2xl px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5 shadow-md border-2 border-gray-100 border-t-4 ${borderColors[index]} hover:shadow-lg hover:border-gray-200 transition-all duration-300`}>
                      <p className="text-gray-400 text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-2 sm:mb-3 truncate">{stat.label}</p>
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xl sm:text-2xl lg:text-4xl font-bold text-gray-900 leading-none mb-1 truncate">{displayVal}</h3>
                          <p className="text-[10px] sm:text-xs font-medium truncate" style={{ color: isPositive ? ringColor : '#ef4444' }}>
                            {isNumericPct ? `${isPositive ? "▲" : "▼"} ${Math.abs(numericPct)}%` : stat.percentage.replace(' this month', '')}
                          </p>
                        </div>
                        <div className="relative flex-shrink-0 ml-2">
                          <svg width="40" height="40" viewBox="0 0 60 60" className="sm:w-12 sm:h-12 lg:w-15 lg:h-15">
                            <circle cx="30" cy="30" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="5" />
                            <circle cx="30" cy="30" r={radius} fill="none" stroke={ringColor} strokeWidth="5"
                              strokeDasharray={`${strokeDash} ${circumference}`} strokeLinecap="round" transform="rotate(-90 30 30)" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[8px] sm:text-[10px] lg:text-xs font-bold" style={{ color: ringColor }}>
                              {isNumericPct ? `${isPositive ? '+' : ''}${numericPct}%` : stat.percentage.replace(' this month', '')}
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
                  if (pct >= 80) return { bar: '#10b981', label: '🔥 Hot Job', labelCls: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
                  if (pct >= 40) return { bar: '#f59e0b', label: '📈 Growing', labelCls: 'text-amber-600 bg-amber-50 border-amber-200' };
                  if (appCount === 0 && postedDaysAgo < 5) return { bar: '#d1d5db', label: null, labelCls: '' };
                  if (appCount === 0 && postedDaysAgo >= 5) return { bar: '#ef4444', label: '⚠️ Needs Boost', labelCls: 'text-red-500 bg-red-50 border-red-200' };
                  return { bar: '#ef4444', label: '⚠️ Needs Boost', labelCls: 'text-red-500 bg-red-50 border-red-200' };
                };

                const tabs = [
                  { key: 'top',       label: 'Top Performing', count: topPerforming.length },
                  { key: 'applied',   label: 'Most Applied',   count: mostApplied.length },
                  { key: 'recent',    label: 'Recently Posted',count: recentlyPosted.length },
                  { key: 'attention', label: 'Needs Attention', count: needsAttention.length, red: true },
                ];

                return (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-5 overflow-hidden">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 gap-3">
                      <div>
                        <h2 className="text-base font-bold text-gray-900">Job Performance Score</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{companyName} · Applications overview</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {jobs.length > 0 && (
                          <BulkJobRefresh
                            selectedJobIds={jobs.map(j => j.id || j._id).filter(Boolean)}
                            selectedJobs={jobs.map(j => ({ id: j.id || j._id, title: j.jobTitle || j.title, refreshCount: j.refreshCount || 0, lastRefreshedAt: j.lastRefreshedAt }))}
                            userPlan="free"
                            onRefreshComplete={() => { if (user) fetchDashboardData(user); }}
                            className="text-xs px-3 py-2"
                          />
                        )}
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex overflow-x-auto border-b border-gray-100 px-4 gap-1 pt-2">
                      {tabs.map(t => (
                        <button key={t.key} onClick={() => setChartFilterJobId(`tab:${t.key}`)}
                          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                            activeTab === t.key
                              ? t.red ? 'border-red-500 text-red-600' : 'border-blue-600 text-blue-700'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}>
                          {t.label}
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            activeTab === t.key
                              ? t.red ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>{t.count}</span>
                        </button>
                      ))}
                    </div>

                    {/* Job Cards */}
                    <div className="px-6 py-4">
                      {visibleJobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                          <BarChart2 className="w-8 h-8 mb-2 text-gray-300" />
                          <p className="text-xs">{activeTab === 'attention' ? '🎉 All jobs are getting applications!' : 'No data yet'}</p>
                        </div>
                      ) : activeTab === 'attention' ? (
                        /* Needs Attention: special card layout */
                        <div className="space-y-3">
                          {visibleJobs.map(job => (
                            <div key={job.id} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
                                <p className="text-xs text-red-500 mt-0.5">0 Applications · Posted {job.postedDaysAgo} day{job.postedDaysAgo !== 1 ? 's' : ''} ago</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                {job.jobData && (
                                  <JobRefreshButton
                                    jobId={job.jobData.id || job.jobData._id}
                                    jobTitle={job.jobData.jobTitle || job.jobData.title}
                                    refreshCount={job.jobData.refreshCount || 0}
                                    lastRefreshedAt={job.jobData.lastRefreshedAt}
                                    userPlan="free"
                                    onRefreshSuccess={() => { if (user) fetchDashboardData(user); }}
                                    className="text-[10px] px-2 py-1"
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Top/Applied/Recent: performance card layout */
                        <div className="space-y-4">
                          {visibleJobs.map((job, idx) => {
                            const { bar, label, labelCls } = getBarColor(job.progressPct, job.appCount, job.postedDaysAgo);
                            return (
                              <div key={job.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-bold text-gray-400">#{idx + 1}</span>
                                      <p className="text-sm font-bold text-gray-900 truncate">{job.title}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-1.5">
                                      <span className="text-xs text-gray-500">{job.appCount} / {job.target} Applications</span>
                                      <span className="text-xs text-cyan-600">{job.shortlisted} Shortlisted</span>
                                      <span className="text-xs text-purple-600">{job.interviewCount} Interviews</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    {label && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${labelCls}`}>{label}</span>}
                                  </div>
                                </div>
                                {/* Progress bar */}
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-500"
                                      style={{ width: `${Math.max(job.progressPct, 3)}%`, background: bar }} />
                                  </div>
                                  <span className="text-[11px] font-bold tabular-nums" style={{ color: bar, minWidth: 36 }}>{job.progressPct}%</span>
                                  {job.jobData && (
                                    <JobRefreshButton
                                      jobId={job.jobData.id || job.jobData._id}
                                      jobTitle={job.jobData.jobTitle || job.jobData.title}
                                      refreshCount={job.jobData.refreshCount || 0}
                                      lastRefreshedAt={job.jobData.lastRefreshedAt}
                                      userPlan="free"
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
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 mb-4 sm:mb-5">
                {/* Area chart */}
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 shadow-md border-2 border-blue-100 hover:shadow-lg transition-all duration-300 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Applications Received</h2>
                      <p className="text-xs text-gray-400 mt-0.5">Last 7 days</p>
                    </div>
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-h-0">
                  {applications.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={applicationsOverTime} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="applications" stroke="#8b5cf6" fill="url(#appGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                  </div>
                </div>

                {/* Status Donut */}
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 shadow-md border-2 border-purple-100 hover:shadow-lg transition-all duration-300 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Status Breakdown</h2>
                      <p className="text-xs text-gray-400 mt-0.5">All applications</p>
                    </div>
                    <BarChart2 className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="flex-1 min-h-0">
                  {statusBreakdown.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                          {statusBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend iconSize={9} wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  </div>
                </div>

                {/* Acquisitions */}
                <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-6 shadow-md border-2 border-indigo-100 hover:shadow-lg transition-all duration-300 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-gray-900">Acquisitions</h2>
                    <span className="text-xs text-violet-500 font-semibold bg-violet-50 px-2 py-0.5 rounded-full">This Month</span>
                  </div>
                  <div className="flex-1">
                  {(() => {
                    const total = applications.length || 1;
                    const acq = [
                      { label:'Applications', count: applications.length, color:'#8b5cf6' },
                      { label:'Shortlisted',  count: applications.filter(a=>['shortlisted','hired'].includes(a.status)).length, color:'#06b6d4' },
                      { label:'On-hold',      count: applications.filter(a=>a.status==='reviewed').length, color:'#f59e0b' },
                      { label:'Rejected',     count: applications.filter(a=>a.status==='rejected').length, color:'#ef4444' },
                    ];
                    return (
                      <>
                        <div className="flex h-2.5 rounded-full overflow-hidden mb-4">
                          {acq.map((s,i) => <div key={i} style={{width:`${(s.count/total)*100}%`,background:s.color}} />)}
                        </div>
                        <div className="space-y-3">
                          {acq.map((s,i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:s.color}}></span>
                                <span className="text-xs text-gray-600">{s.label}</span>
                              </div>
                              <span className="text-xs font-bold text-gray-800">
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

              {/* ── Row 2: Bottom Cards ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
                {/* New Applicants */}
                <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-6 shadow-md border-2 border-green-100 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-gray-900">New Applicants</h2>
                    <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">Today</span>
                  </div>
                  {applications.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-8">No applicants yet</p>
                  ) : (
                    <div className="space-y-3">
                      {applications.slice(0,5).map((app,i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                            style={{background: PIE_COLORS[i % PIE_COLORS.length]}}>
                            {(app.candidateName||'C').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate">{app.candidateName||'Candidate'}</p>
                            <p className="text-xs text-gray-400 truncate">{(app.jobTitle||'a position').substring(0,24)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-6 shadow-md border-2 border-orange-100 hover:shadow-lg transition-all duration-300">
                  <h2 className="text-sm font-bold text-gray-900 mb-4">Recent Activity</h2>
                  {loading ? (
                    <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600"></div></div>
                  ) : recentActivity.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-8">No recent activity</p>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0">
                          <div className="w-2 h-2 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800">{activity.message}</p>
                            {activity.details?.jobTitle && <p className="text-xs text-gray-400 truncate">{activity.details.jobTitle}</p>}
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">{activity.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              </div>{/* end white container */}

            </>
          ) : activeMenu === 'applications' ? (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Applications</h1>
                <span className="text-sm text-gray-500">
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
              <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 mb-6 flex flex-col gap-2">
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search candidate..."
                    value={appSearch}
                    onChange={e => setAppSearch(e.target.value)}
                    className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder-gray-400"
                  />
                </div>
                <div className="flex flex-row gap-2">
                  <select
                    value={appFilterJob}
                    onChange={e => setAppFilterJob(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-white flex-1 min-w-0"
                  >
                    <option value="all">All Jobs</option>
                    {jobs.map(job => {
                      const jobTitle = job.jobTitle || job.title;
                      const count = applications.filter(a => a.jobTitle === jobTitle || (a.jobId?._id || a.jobId) === (job._id || job.id)).length;
                      return (
                        <option key={job._id || job.id} value={jobTitle}>{jobTitle} ({count})</option>
                      );
                    })}
                  </select>
                  <select
                    value={appFilterStatus}
                    onChange={e => setAppFilterStatus(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-white flex-1 min-w-0"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="rejected">Rejected</option>
                    <option value="hired">Hired</option>
                  </select>
                  {(appFilterJob !== 'all' || appFilterStatus !== 'all' || appSearch) && (
                    <button
                      onClick={() => { setAppFilterJob('all'); setAppFilterStatus('all'); setAppSearch(''); }}
                      className="text-sm text-red-500 hover:text-red-700 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications yet</h3>
                  <p className="text-gray-600 mb-6">Applications will appear here when candidates apply.</p>
                </div>
              ) : (() => {
                const filtered = applications.filter(a => {
                  const jobMatch = appFilterJob === 'all' || (a.jobTitle || '') === appFilterJob || (a.jobId?._id || a.jobId) === appFilterJob;
                  const statusMatch = appFilterStatus === 'all' || a.status === appFilterStatus;
                  const searchMatch = !appSearch || (a.candidateName || '').toLowerCase().includes(appSearch.toLowerCase()) || (a.candidateEmail || '').toLowerCase().includes(appSearch.toLowerCase());
                  return jobMatch && statusMatch && searchMatch;
                });
                return filtered.length === 0 ? (
                  <div className="text-center py-16">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No applications match your filters.</p>
                  </div>
                ) : (
                <div className="space-y-4">
                  {filtered.map((application) => (
                    <div key={application._id || application.id} className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 hover:shadow-md transition-shadow duration-200">
                      {/* Mobile: stacked layout | Desktop: side-by-side */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Candidate info */}
                        <div className="flex-1 min-w-0">
                          {/* Avatar + name row */}
                          <div className="flex items-start gap-2 sm:gap-3 mb-2">
                            <div className="hidden sm:flex w-12 h-12 bg-gray-100 rounded-full items-center justify-center flex-shrink-0">
                              <span className="text-gray-600 font-bold text-lg">{application.candidateName?.charAt(0).toUpperCase() || 'C'}</span>
                            </div>
                            <div className="flex sm:hidden w-8 h-8 bg-gray-100 rounded-full items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-gray-600 font-bold text-sm">{application.candidateName?.charAt(0).toUpperCase() || 'C'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">{application.candidateName || application.candidateEmail}</h3>
                              <p className="text-xs text-blue-700 font-semibold flex items-start gap-1 mt-0.5 leading-snug">
                                <Briefcase className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                <span>Applied for: {application.jobTitle || 'Job Position'}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2">
                            <span className="text-xs text-gray-500 break-all">{application.candidateEmail}</span>
                            <span className="text-xs text-gray-400">Applied: {new Date(application.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          {application.coverLetter && application.coverLetter !== 'No cover letter' && (
                            <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg mb-3 border-l-2 border-gray-300">
                              <strong className="text-gray-700">Cover Letter:</strong> {application.coverLetter.length > 100 ? `${application.coverLetter.substring(0, 100)}...` : application.coverLetter}
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
                              className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 bg-blue-100 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              View Resume
                            </button>
                          ) : (
                            <span className="text-gray-500 text-xs bg-gray-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Not available</span>
                          )}
                        </div>

                        {/* Action buttons: on mobile - status full width on its own row, then 3 buttons in a row; on desktop - vertical column */}
                        <div className="flex flex-col gap-2 sm:flex-shrink-0 sm:items-stretch sm:min-w-[140px]">
                          {canManageApplications ? (
                            <select
                              value={application.status}
                              onChange={async (e) => {
                                const newStatus = e.target.value;
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
                                  e.target.value = application.status;
                                }
                              }}
                              className="w-full px-2 py-1.5 sm:px-3 sm:py-2 border-2 border-gray-300 rounded-lg text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white cursor-pointer"
                            >
                              <option value="pending">Pending</option>
                              <option value="reviewed">Reviewed</option>
                              <option value="shortlisted">Shortlisted</option>
                              <option value="rejected">Rejected</option>
                              <option value="hired">Hired</option>
                            </select>
                          ) : (
                            <span className="w-full px-2 py-1.5 border-2 border-gray-100 rounded-lg text-xs font-semibold bg-gray-50 text-gray-400 text-center capitalize">{application.status}</span>
                          )}
                          {/* 3 action buttons in a row on mobile, stacked on desktop */}
                          <div className="flex flex-row sm:flex-col gap-2">
                            <button
                              onClick={() => {
                                const cid = application.candidateEmail || application.candidateId || application.userId || application.candidateUserId || '';
                                if (!cid) { showToast('Candidate profile not available.', 'info'); return; }
                                sessionStorage.setItem('viewCandidateId', String(cid));
                                sessionStorage.setItem('viewCandidateData', JSON.stringify({ name: application.candidateName || '', email: application.candidateEmail || '', phone: application.candidatePhone || '', skills: application.candidateSkills || application.skills || [] }));
                                setViewingCandidateId(String(cid));
                              }}
                              className="flex-1 sm:flex-none sm:w-full bg-blue-600 text-white px-2 py-1.5 sm:px-3 sm:py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
                            >
                              View Profile
                            </button>
                            {application.status !== 'rejected' && canManageApplications && (
                              <button
                                onClick={() => { setSelectedApplication(application); setShowScheduleModal(true); }}
                                className="flex-1 sm:flex-none sm:w-full bg-emerald-600 text-white px-2 py-1.5 sm:px-3 sm:py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
                              >
                                Schedule
                              </button>
                            )}
                            {canDeleteRecords && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault(); e.stopPropagation();
                                  const appId = application._id || application.id;
                                  openConfirm('Delete Application', 'Are you sure you want to delete this application? This action cannot be undone.', async () => {
                                    try {
                                      const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}/${appId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
                                      if (response.ok) { setApplications(prev => prev.filter(app => (app._id || app.id) !== appId)); showToast('Application deleted successfully!', 'success'); }
                                      else { showToast('Failed to delete application', 'error'); }
                                    } catch { showToast('Failed to delete application', 'error'); }
                                    closeConfirm();
                                  });
                                }}
                                className="flex-1 sm:flex-none sm:w-full bg-red-600 text-white px-2 py-1.5 sm:px-3 sm:py-2.5 rounded-lg font-semibold hover:bg-red-700 transition-colors text-xs sm:text-sm inline-flex items-center justify-center gap-1 whitespace-nowrap"
                              >
                                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Delete
                              </button>
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
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Interviews</h1>
                    <p className="text-sm text-gray-500">
                      {interviews.length === 0 ? 'No interviews scheduled' : 
                       interviews.length === 1 ? '1 interview scheduled' : 
                       `${interviews.length} interviews scheduled`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                      📅 Schedule Management
                    </span>
                  </div>
                </div>
              </div>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
              ) : interviews.length === 0 ? (
                <div className="text-center py-16">
                  <MessageSquare className="w-16 sm:w-24 h-16 sm:h-24 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Interviews Scheduled</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-6 px-4">Interview schedules will appear here when candidates book interviews.</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {interviews.map((interview) => (
                    <div key={interview._id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 hover:shadow-sm transition-shadow duration-200">
                      <div className="flex flex-col lg:flex-row items-start gap-4">
                        <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-600 font-semibold text-xs sm:text-sm">
                              {interview.candidateName?.charAt(0).toUpperCase() || 'C'}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-2">
                              <div className="min-w-0">
                                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-1 truncate">
                                  {interview.candidateName || 'Candidate'}
                                </h3>
                                <p className="text-sm sm:text-base text-purple-700 font-semibold flex items-center gap-1">
                                  <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="truncate">{interview.jobTitle || 'Interview'}</span>
                                </p>
                              </div>
                              <span className={`flex-shrink-0 self-start px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                                interview.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                interview.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-200' :
                                interview.status === 'cancelled' ? 'bg-red-50 text-red-700 border border-red-200' :
                                'bg-gray-50 text-gray-600 border border-gray-200'
                              }`}>
                                {interview.status?.charAt(0).toUpperCase() + interview.status?.slice(1) || 'Scheduled'}
                              </span>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 text-xs sm:text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="truncate">{new Date(interview.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span>{interview.time}</span>
                              </span>
                              <span className="truncate">{interview.candidateEmail}</span>
                            </div>

                            {interview.meetingLink && (
                              <div className="mb-3 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                <a
                                  href={interview.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-semibold inline-flex items-center space-x-1 bg-blue-100 px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors"
                                >
                                  <Video className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span>Join Meeting</span>
                                </a>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(interview.meetingLink);
                                    showToast('Meeting link copied!', 'success');
                                  }}
                                  className="text-gray-500 hover:text-gray-700 text-xs border border-gray-300 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                                  title="Copy meeting link"
                                >
                                  Copy Link
                                </button>
                              </div>
                            )}

                            {interview.notes && (
                              <div className="text-xs sm:text-sm text-gray-600 bg-gray-50 p-3 rounded border-l-2 border-gray-300">
                                <strong className="text-gray-700">Notes:</strong> {interview.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 w-full lg:w-auto lg:flex-shrink-0 lg:min-w-[140px]">
                          {canManageApplications ? (<select
                            value={interview.status || 'scheduled'}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
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
                                e.target.value = interview.status || 'scheduled';
                              }
                            }}
                            className="px-3 sm:px-4 py-2 border-2 border-gray-300 rounded-lg text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                            title="Update interview status"
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>) : (<span className="px-3 py-2 border-2 border-gray-100 rounded-lg text-xs font-semibold bg-gray-50 text-gray-400 capitalize text-center">{interview.status || 'scheduled'}</span>)}
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
                                  } catch (error) {
                                    console.error('Delete error:', error);
                                    showToast('Failed to delete interview', 'error');
                                  }
                                  closeConfirm();
                                }
                              );
                            }}
                            className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors text-xs sm:text-sm shadow-md flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : activeMenu === 'saved-candidates' ? (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Saved Candidates</h1>
                <button
                  onClick={() => {
                    const token = getToken();
                    if (token) {
                      fetch(`${API_ENDPOINTS.SAVED_CANDIDATES}`, { headers: { 'Authorization': `Bearer ${token}` } })
                        .then(res => res.ok ? res.json() : [])
                        .then(data => {
                          const candidates = Array.isArray(data) ? data : data.savedCandidates || [];
                          setSavedCandidates(candidates);
                          showToast(`Refreshed! Found ${candidates.length} saved candidates.`, 'success');
                        })
                        .catch(() => showToast('Failed to refresh saved candidates.', 'error'));
                    }
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
              
              {savedCandidates.length === 0 ? (
                  <div className="text-center py-16">
                    <Bookmark className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Saved Candidates</h3>
                    <p className="text-gray-600 mb-6">Save candidates from the candidate search to view them here.</p>
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={() => onNavigate('candidate-search')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Search Candidates
                      </button>

                    </div>
                  </div>
              ) : (
                <div className="space-y-4">
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
                    <div key={candidate._id || candidate.id} className="border-2 border-green-200 rounded-xl p-6 hover:shadow-lg hover:border-green-400 transition-all duration-300 bg-gradient-to-br from-white via-green-50 to-emerald-50">
                      <div className="flex items-start justify-between gap-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {photo ? (
                            <img src={photo} alt={name} className="w-16 h-16 rounded-full object-cover border-2 border-green-300 shadow"
                              onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=64&background=10b981&color=ffffff&bold=true`; }} />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-md text-white font-bold text-2xl">
                              {name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          {/* Name + Applied Job badge */}
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-xl font-bold text-gray-900">{name}</h3>
                            {candidate.appliedJobTitle && (
                              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                {candidate.appliedJobTitle}
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          {title && <p className="text-sm font-semibold text-green-700 mb-2">{title}</p>}

                          {/* Meta row */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {location && (
                              <span className="flex items-center gap-1 text-xs text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded-lg">
                                <MapPin className="w-3 h-3 text-green-500" />{location}
                              </span>
                            )}
                            {experience && (
                              <span className="flex items-center gap-1 text-xs text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded-lg">
                                <Briefcase className="w-3 h-3 text-blue-500" />{experience}
                              </span>
                            )}
                            {email && (
                              <span className="flex items-center gap-1 text-xs text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded-lg">
                                <Mail className="w-3 h-3 text-purple-500" />{email}
                              </span>
                            )}
                          </div>

                          {/* Skills */}
                          {skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {skills.slice(0, 8).map((skill, i) => (
                                <span key={i} className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">{skill}</span>
                              ))}
                              {skills.length > 8 && (
                                <span className="text-xs text-gray-400 px-1 py-0.5">+{skills.length - 8} more</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={() => { if (email) window.location.href = `mailto:${email}`; }}
                            className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-5 py-2 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-800 transition-colors text-sm flex items-center gap-1"
                          >
                            <Mail className="w-4 h-4" />Contact
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
                            className="bg-red-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm"
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Alerts & Notifications</h1>
                <button
                    onClick={async () => {
                      try {
                        const userData = localStorage.getItem('user');
                        if (userData) {
                          const parsedUser = JSON.parse(userData);
                          const dynamicNotifications = await NotificationService.fetchNotifications(parsedUser.email);
                          setNotifications(dynamicNotifications);
                        }
                      } catch (error) {
                        console.error('Error refreshing notifications:', error);
                      }
                    }}
                    className="flex items-center gap-2 text-sm text-gray-600 border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
              </div>
              
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-16">
                    <Bell className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Alerts</h3>
                    <p className="text-gray-600 mb-6">You're all caught up! New alerts will appear here.</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow duration-200">
                      <div className="flex items-start space-x-4">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-base flex-shrink-0">
                          {NotificationService.getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="text-sm font-semibold text-gray-900">{notification.title}</h3>
                            <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{NotificationService.formatTime(notification.time)}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{notification.message}</p>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                if (notification.type === 'application') {
                                  const candidateName = notification.data?.candidateName || notification.data?.candidateEmail || '';
                                  if (candidateName) setAppSearch(candidateName);
                                  setActiveMenu('applications');
                                } else if (notification.type === 'interview') {
                                  setActiveMenu('interviews');
                                } else if (notification.type === 'job') {
                                  onNavigate('my-jobs');
                                }
                              }}
                              className="text-xs font-medium text-blue-600 border border-blue-600 px-3 py-1.5 rounded hover:bg-blue-50 transition-colors"
                            >
                              View Details
                            </button>
                            <button 
                              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                              className="text-xs font-medium text-gray-500 border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors"
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
              <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Alert Preferences</h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-gray-700">New job applications</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-gray-700">Interview confirmations</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-gray-700">Job posting updates</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-gray-700">Weekly summary reports</span>
                  </label>
                </div>
                <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Save Preferences
                </button>
              </div>
            </>
          ) : activeMenu === 'team' ? (
            <TeamSection
              employerEmail={user?.employerId || user?.ownerEmail || user?.email}
              currentUserEmail={user?.email}
              companyName={companyName}
              showToast={showToast}
              canInvite={canInviteMembers}
            />
          ) : activeMenu === 'auto-rejection' ? (
            <>
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">AI Auto-Rejection</h1>
                    <p className="text-sm text-gray-500">
                      Configure intelligent filtering to automatically screen applications
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
                      🤖 Smart Filtering
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
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
                    onClick={() => setNotifications([])}
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
                        else if (notification.type === 'interview') setActiveMenu('interviews');
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

            <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-4 py-3">
              <button
                onClick={() => { setShowNotifications(false); setActiveMenu('alerts'); }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
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
              const userId = u.id || u._id;
              const userEmail = u.email;
              const safeId = userId && typeof userId === 'string' && !/^\d+$/.test(userId) ? userId : '';
              fetch(`${API_ENDPOINTS.BASE_URL}/interviews?employerId=${encodeURIComponent(safeId)}&employerEmail=${encodeURIComponent(userEmail || '')}`)
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
                <span className="text-3xl">🔒</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
              <p className="text-gray-500 text-sm mb-1">
                <span className="font-semibold text-blue-600">{accessDeniedModal.feature}</span> requires
              </p>
              <p className="text-gray-500 text-sm mb-4">
                <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                  accessDeniedModal.requiredRole === 'Owner' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                }`}>{accessDeniedModal.requiredRole}</span> access or higher.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5 w-full">
                <p className="text-amber-800 text-xs">
                  Your current role is <span className={`font-bold px-1.5 py-0.5 rounded-full ${
                    teamRole === 'Recruiter' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                  }`}>{teamRole}</span>. Contact the Owner to request access.
                </p>
              </div>
              <button
                onClick={() => setAccessDeniedModal({ show: false, feature: '', requiredRole: '' })}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
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
    <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
    <p className="text-gray-500 text-sm max-w-xs">
      Your <span className="font-semibold text-blue-600">{role}</span> role does not have permission to access this section.
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
          setMembers(data);
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
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) { showToast('Enter a valid email address', 'error'); return; }
    if (!invitePassword.trim() || invitePassword.length < 8) { showToast('Password must be at least 8 characters', 'error'); return; }
    if (members.find(m => m.memberEmail === inviteEmail.trim())) { showToast('This email is already in the team', 'error'); return; }
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
        showToast(err.error || 'Failed to invite', 'error');
      }
    } catch { showToast('Network error', 'error'); }
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
    Owner: 'bg-blue-100 text-blue-700 border-blue-200',
    Recruiter: 'bg-orange-100 text-orange-700 border-orange-200',
    Viewer: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <>
      <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={closeConfirm} />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 truncate">{companyName} · {members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {members.some(m => m.status === 'pending') && (
            <button onClick={fetchMembers}
              className="flex items-center justify-center gap-1 text-xs border border-gray-300 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors min-h-[36px] sm:min-h-[40px]">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              <span>Refresh</span>
            </button>
          )}
          {canInvite ? (
            <button onClick={() => setShowInvite(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]">
              <UserPlus className="w-4 h-4" /> 
              <span>Invite Member</span>
            </button>
          ) : (
            <span className="flex items-center justify-center gap-2 bg-gray-100 text-gray-400 px-4 py-2 rounded-lg text-xs sm:text-sm border border-gray-200 cursor-not-allowed min-h-[36px] sm:min-h-[40px]" title="Only Owners can invite members">
              <UserPlus className="w-4 h-4" /> 
              <span>Invite Member</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {(Object.entries(ROLE_PERMISSIONS) as [TeamRole, string[]][]).map(([role, perms]) => (
          <div key={role} onClick={() => setSelectedRole(selectedRole === role ? null : role)}
            className={`bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border cursor-pointer transition-all ${
              selectedRole === role ? 'border-blue-400 shadow-md' : 'border-gray-200 hover:border-gray-300'
            }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${roleColors[role]}`}>{role}</span>
              <span className="text-xs text-gray-400">{members.filter(m => m.role === role).length} member{members.filter(m => m.role === role).length !== 1 ? 's' : ''}</span>
            </div>
            <ul className="space-y-1">
              {perms.map(p => <li key={p} className="text-xs text-gray-600 flex items-center gap-1"><span className="text-green-500 flex-shrink-0">✓</span><span className="truncate">{p}</span></li>)}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Members</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {members.map(member => (
            <div key={member.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                {member.memberName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{member.memberName}</p>
                <p className="text-xs text-gray-500 truncate">{member.memberEmail}</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <span className={`text-xs px-2 py-1 rounded-full border font-medium text-center ${
                  member.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : roleColors[member.role]
                }`}>
                  {member.status === 'pending' ? '⏳ Pending' : member.role}
                </span>
                {member.memberEmail !== (currentUserEmail || employerEmail) ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select value={member.role} onChange={e => handleRoleChange(member.id, e.target.value as TeamRole)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 bg-white min-w-[100px]">
                      <option value="Recruiter">Recruiter</option>
                      <option value="Viewer">Viewer</option>
                      <option value="Owner">Owner</option>
                    </select>
                    <button onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to remove this team member?')) {
                        await handleRemove(member.id);
                      }
                    }}
                      className="text-red-500 hover:text-red-700 text-xs border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap">
                      Remove
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 italic text-center sm:text-left">You</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-sm sm:max-w-md p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                {inviteSent ? '✅ Invite Sent!' : 'Invite Team Member'}
              </h3>
              <button onClick={handleCloseInvite} className="text-gray-400 hover:text-gray-600 text-xl p-1">&times;</button>
            </div>

            {inviteSent && inviteCredentials ? (
              <div className="py-2">
                <div className="flex flex-col items-center mb-5">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <span className="text-3xl">🎉</span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-base">Member Added!</h4>
                  <p className="text-gray-500 text-xs mt-1 text-center">Share these credentials securely with the team member.</p>
                </div>

                {/* Credential Card */}
                <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-4 mb-4 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-bold text-sm">🔐 Login Credentials</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      inviteCredentials.role === 'Owner' ? 'bg-blue-400 text-white' :
                      inviteCredentials.role === 'Recruiter' ? 'bg-orange-400 text-white' :
                      'bg-gray-400 text-white'
                    }`}>{inviteCredentials.role}</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="bg-white/10 rounded-lg px-3 py-2">
                      <p className="text-blue-200 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Login URL</p>
                      <p className="text-white text-xs font-mono">{window.location.origin}/employer-login</p>
                    </div>
                    <div className="bg-white/10 rounded-lg px-3 py-2">
                      <p className="text-blue-200 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Email</p>
                      <p className="text-white text-sm font-mono">{inviteCredentials.email}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg px-3 py-2 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-blue-200 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Password</p>
                        <p className="text-white text-sm font-mono">{inviteCredentials.password}</p>
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-lg px-3 py-2">
                      <p className="text-blue-200 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Access Level</p>
                      <p className="text-white text-xs">{ROLE_PERMISSIONS[inviteCredentials.role as TeamRole].join(' · ')}</p>
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
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors mb-3 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Copy All Credentials
                </button>

                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 text-center">
                  ⚠️ Share these credentials privately. The member should change their password after first login.
                </p>

                <div className="flex gap-3">
                  <button onClick={handleCloseInvite} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Done</button>
                  <button onClick={() => { setInviteSent(false); setInviteCredentials(null); setInviteEmail(''); setInviteName(''); setInvitePassword(''); }} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Invite Another</button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)}
                      placeholder="John Doe" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                      placeholder="recruiter@company.com" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      onKeyDown={e => e.key === 'Enter' && handleInvite()} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select value={inviteRole} onChange={e => setInviteRole(e.target.value as TeamRole)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                      <option value="Recruiter">Recruiter — Can post jobs & manage applications</option>
                      <option value="Viewer">Viewer — View only access</option>
                      <option value="Owner">Owner — Full access</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">Login Password *</label>
                      <button type="button" onClick={() => setInvitePassword(generatePassword())}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 px-2 py-0.5 rounded hover:bg-blue-50 transition-colors">
                        ✨ Auto-generate
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showInvitePw ? 'text' : 'password'}
                        value={invitePassword}
                        onChange={e => setInvitePassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                      <button type="button" onClick={() => setShowInvitePw(!showInvitePw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showInvitePw
                          ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                          : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        }
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Member will use this password to login at the Employer Login page.</p>
                  </div>
                  {/* Role permissions preview */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-medium mb-1.5">This person will be able to:</p>
                    <ul className="space-y-1">
                      {ROLE_PERMISSIONS[inviteRole].map(p => (
                        <li key={p} className="text-xs text-gray-600 flex items-center gap-1.5">
                          <span className="text-green-500 flex-shrink-0">✓</span>
                          <span className="truncate">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button onClick={handleCloseInvite}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                  <button onClick={handleInvite} disabled={inviting || !inviteEmail.trim() || invitePassword.length < 8}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
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
