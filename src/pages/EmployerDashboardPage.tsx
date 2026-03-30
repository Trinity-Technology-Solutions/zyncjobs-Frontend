import React, { useState, useEffect, useMemo } from 'react';
import { User, Briefcase, MessageSquare, FileText, Bookmark, Settings, Trash2, LogOut, Bell, Plus, Users, UserPlus, Folder, MapPin, Mail, TrendingUp, BarChart2, Search, Calendar, Clock, Video } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { API_ENDPOINTS } from '../config/constants';
import { decodeHtmlEntities, formatDate, formatSalary } from '../utils/textUtils';
import BackButton from '../components/BackButton';
import AutoRejectionSettings from '../components/AutoRejectionSettings';
import ScheduleInterviewModal from '../components/ScheduleInterviewModal';
import ResumeModal from '../components/ResumeModal';
import NotificationService, { Notification } from '../services/notificationService';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast, ToastType } from '../hooks/useToast';
import NotificationComponent from '../components/Notification';

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

  const getToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken');

  // Fetch recent conversations for sidebar Messages panel
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) return;
        const { id, _id } = JSON.parse(userData);
        const userId = id || _id;
        if (!userId) return;
        const res = await fetch(`${API_ENDPOINTS.BASE_URL}/messages/conversations/${userId}`);
        if (!res.ok) return;
        const convos = await res.json();
        // Enrich each conversation with the other party's info
        const enriched = await Promise.all(
          convos.slice(0, 4).map(async (c: any) => {
            const msg = c.lastMessage;
            const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
            try {
              const uRes = await fetch(`${API_ENDPOINTS.BASE_URL}/users/${otherId}`);
              const uData = uRes.ok ? await uRes.json() : {};
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
          
          console.log('Fetching dynamic notifications for:', userEmail);
          
          // Use the notification service to fetch dynamic notifications
          const dynamicNotifications = await NotificationService.fetchNotifications(userEmail);
          console.log('Dynamic notifications received:', dynamicNotifications);
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
      const fallbackNotifications = NotificationService.createFallbackNotifications(
        applications, 
        interviews, 
        jobs
      );
      
      console.log('Using fallback notifications:', fallbackNotifications.length);
      setNotifications(fallbackNotifications);
    };
    
    // Initial fetch
    fetchNotifications();
    
    // Set up real-time updates - fetch every 30 seconds
    const notificationInterval = setInterval(fetchNotifications, 30000);
    
    return () => {
      clearInterval(notificationInterval);
    };
  }, [applications, interviews, jobs]); // Depend on real data

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      console.log('Dashboard - User data:', parsedUser);
      
      // Force clear any cached state that might interfere
      setJobs([]);
      setApplications([]);
      setInterviews([]);
      setDashboardStats(null);
      setRecentActivity([]);
      
      setUser(parsedUser);
      setEmployerName(parsedUser.name || 'Employer');
      // Fix: Use actual company name from registration, not generic 'Company'
      const actualCompanyName = parsedUser.companyName || parsedUser.company || parsedUser.organizationName || 'Company';
      setCompanyName(actualCompanyName);
      setCompanyLogo(parsedUser.companyLogo || '');
      setCompanyWebsite(parsedUser.companyWebsite || '');
      
      // Fetch company domain from companies.json
      fetchCompanyDomain(actualCompanyName);
      
      fetchDashboardData(parsedUser);
    }
    
    // Listen for alerts navigation event from header
    const handleShowAlerts = () => {
      console.log('Show alerts event received');
      setActiveMenu('alerts');
    };
    
    // Listen for applications navigation event from header
    const handleShowApplications = () => {
      console.log('Show applications event received');
      setActiveMenu('applications');
    };
    
    window.addEventListener('showAlerts', handleShowAlerts);
    window.addEventListener('showApplications', handleShowApplications);
    
    return () => {
      window.removeEventListener('showAlerts', handleShowAlerts);
      window.removeEventListener('showApplications', handleShowApplications);
    };
  }, []);

  const fetchCompanyDomain = async (companyName: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/companies`);
      if (response.ok) {
        const companies = await response.json();
        console.log('Companies loaded:', companies.length);
        
        // Try exact match first
        let company = companies.find((c: any) => 
          c.name.toLowerCase() === companyName.toLowerCase()
        );
        
        // If no exact match, try partial match
        if (!company) {
          company = companies.find((c: any) => 
            c.name.toLowerCase().includes(companyName.toLowerCase()) ||
            companyName.toLowerCase().includes(c.name.toLowerCase())
          );
        }
        
        if (company) {
          console.log('Found company:', company.name, 'domain:', company.domain);
          setCompanyDomain(company.domain);
        } else {
          console.log('Company not found in database:', companyName);
        }
      } else {
        console.warn('Companies API returned error:', response.status);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

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
    
    const handleJobDeleted = () => {
      if (user) {
        console.log('Job deleted event received, refreshing dashboard data...');
        fetchDashboardData(user);
      }
    };
    
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
      console.log('Fetching dashboard data for user:', userData);
      
      // Get user ID - try different possible fields
      const userId = userData.id || userData._id || userData.userId;
      const userEmail = userData.email;
      const userName = userData.name || userData.fullName;
      
      console.log('Using userId:', userId, 'userEmail:', userEmail, 'userName:', userName);
      
      // Fetch data with individual error handling for each endpoint
      let employerJobs = [];
      let employerApps = [];
      let dashboardStats = { activeJobs: 0, applications: 0, interviews: 0, hired: 0 };
      let recentActivity = [];
      
      // Fetch Jobs
      try {
        console.log('Fetching jobs from:', API_ENDPOINTS.JOBS);
        const jobsRes = await fetch(API_ENDPOINTS.JOBS);
        if (jobsRes.ok) {
          const allJobs = await jobsRes.json();
          console.log('Dashboard - All jobs:', allJobs.length);
          employerJobs = Array.isArray(allJobs) ? allJobs.filter((job: any) => {
            const email = userEmail?.toLowerCase().trim();
            const matchesEmail = job.postedBy?.toLowerCase().trim() === email || job.employerEmail?.toLowerCase().trim() === email;
            return matchesEmail;
          }) : [];
          console.log('Dashboard - Filtered employer jobs:', employerJobs.length);
          setJobs(employerJobs);
          dashboardStats.activeJobs = employerJobs.length;
        } else {
          const errorText = await jobsRes.text().catch(() => 'Unknown error');
          console.error('Jobs API returned error:', jobsRes.status, jobsRes.statusText);
          console.error('Jobs API error details:', errorText);
          
          // Set more specific error message based on status code
          if (jobsRes.status === 500) {
            setError('Server error while loading jobs. The backend server may be experiencing issues. Please try again later or contact support.');
          } else if (jobsRes.status === 404) {
            setError('Jobs API endpoint not found. Please check if the server is properly configured.');
          } else {
            setError(`Failed to load jobs: ${jobsRes.status} ${jobsRes.statusText}`);
          }
          setJobs([]);
        }
      } catch (error) {
        console.error('Jobs API network error:', error);
        setError('Network error while loading jobs. Please check your internet connection and try again.');
        setJobs([]);
      }

      // Fetch Applications
      try {
        const appsRes = await fetch(API_ENDPOINTS.APPLICATIONS);
        if (appsRes.ok) {
          const response = await appsRes.json();
          const allApps = response.applications || response || [];
          console.log('Dashboard - All applications:', allApps.length);
          
          // Fetch job details for each application
          const appsWithJobDetails = await Promise.all(
            allApps.map(async (app: any) => {
              try {
                const appJobId = app.jobId?.id || app.jobId?._id || app.jobId;
                console.log('Processing application:', app.candidateName, 'jobId:', appJobId);
                
                if (appJobId && typeof appJobId === 'string' && appJobId !== 'undefined') {
                  const jobRes = await fetch(`${API_ENDPOINTS.JOBS}/${appJobId}`);
                  if (jobRes.ok) {
                    const jobData = await jobRes.json();
                    console.log('Fetched job data for', appJobId, ':', jobData.jobTitle || jobData.title);
                    return { ...app, jobTitle: jobData.jobTitle || jobData.title || 'Job Position' };
                  } else {
                    console.log('Job fetch failed for', appJobId, ':', jobRes.status);
                  }
                } else {
                  console.log('No valid jobId for application:', app.candidateName);
                }
              } catch (e) {
                console.log('Failed to fetch job for application:', app._id || app.id, e);
              }
              return app;
            })
          );
          
          employerApps = Array.isArray(appsWithJobDetails) ? appsWithJobDetails.filter((app: any) => {
            const matchesEmail = app.employerEmail === userEmail;
            console.log(`App: ${app.candidateName}, matchesEmail: ${matchesEmail}`);
            return matchesEmail;
          }) : [];
          console.log('Dashboard - Filtered employer applications:', employerApps.length);
          setApplications(employerApps);
          dashboardStats.applications = employerApps.length;
        } else {
          console.warn('Applications API returned error:', appsRes.status);
          setApplications([]);
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
        setApplications([]);
      }

      // Fetch Interviews (non-critical, fail silently)
      try {
        const interviewsRes = await fetch(`${API_ENDPOINTS.BASE_URL}/interviews?employerId=${encodeURIComponent(userId || '')}&employerEmail=${encodeURIComponent(userEmail || '')}`);
        if (interviewsRes.ok) {
          const interviewsData = await interviewsRes.json();
          const interviewsArray = Array.isArray(interviewsData) ? interviewsData : [];
          const now = new Date();
          
          // Fetch job details for each interview
          const interviewsWithJobDetails = await Promise.all(
            interviewsArray.map(async (interview: any) => {
              try {
                const jobId = interview.jobId?.id || interview.jobId?._id || interview.jobId;
                if (jobId && typeof jobId === 'string') {
                  const jobRes = await fetch(`${API_ENDPOINTS.JOBS}/${jobId}`);
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
          
          // Filter out past interviews and completed/cancelled status interviews
          const filteredInterviews = interviewsWithJobDetails.filter((interview: any) => {
            const interviewDate = new Date(interview.date);
            const isPast = interviewDate < now;
            const isCompletedOrCancelled = interview.status === 'completed' || interview.status === 'cancelled';
            return !isPast && !isCompletedOrCancelled;
          });
          
          setInterviews(filteredInterviews);
          dashboardStats.interviews = filteredInterviews.length;
        } else {
          setInterviews([]);
        }
      } catch {
        setInterviews([]);
      }

      // Fetch Dashboard Stats (non-critical, fail silently)
      try {
        const statsRes = await fetch(`${API_ENDPOINTS.BASE_URL}/dashboard/stats?employerId=${encodeURIComponent(userId || '')}&employerEmail=${encodeURIComponent(userEmail || '')}&userName=${encodeURIComponent(userName || '')}`);
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
        const activityRes = await fetch(`${API_ENDPOINTS.BASE_URL}/dashboard/recent-activity?employerId=${encodeURIComponent(userId || '')}&employerEmail=${encodeURIComponent(userEmail || '')}&userName=${encodeURIComponent(userName || '')}`);
        if (activityRes.ok) {
          const activity = await activityRes.json();
          recentActivity = activity;
        }
      } catch {
        // non-critical fallback to local activity below
      }
      
      // If no activity from API, create from local jobs
      if (recentActivity.length === 0 && employerJobs.length > 0) {
        recentActivity = employerJobs.slice(0, 3).map(job => ({
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

  const getFallbackLogo = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=6366f1&color=ffffff&bold=true`;
  };

  const getDisplayLogo = () => {
    console.log('getDisplayLogo - companyLogo:', companyLogo);
    console.log('getDisplayLogo - companyName:', companyName);
    console.log('getDisplayLogo - user email:', user?.email);
    
    // Check if user is from Trinity Technology Solutions
    if (user?.email && user.email.includes('@trinitetech')) {
      console.log('Using Trinity logo for trinitetech employee');
      // Try Trinity logo with fallback
      const trinityLogo = '/images/company-logos/trinity-logo.png';
      return trinityLogo;
    }
    
    // First try to use company logo from user data
    if (companyLogo && companyLogo.trim() !== '' && !companyLogo.includes('clearbit.com') && !companyLogo.includes('gstatic.com')) {
      console.log('Using stored company logo:', companyLogo);
      return companyLogo;
    }
    
    // Try to get logo from company name using Clearbit
    if (companyName && companyName.trim() !== '' && companyName !== 'Company') {
      const companyDomain = companyName.toLowerCase().replace(/\s+/g, '') + '.com';
      console.log('Trying Clearbit logo for:', companyDomain);
      return `https://logo.clearbit.com/${companyDomain}`;
    }
    
    // Try to extract company name from email domain
    if (user?.email && user.email.includes('@')) {
      const emailDomain = user.email.split('@')[1];
      if (emailDomain && !emailDomain.includes('gmail') && !emailDomain.includes('yahoo') && !emailDomain.includes('outlook')) {
        console.log('Trying Clearbit logo for email domain:', emailDomain);
        return `https://logo.clearbit.com/${emailDomain}`;
      }
    }
    
    // Fallback to avatar with company name or employer name
    const displayName = companyName && companyName !== 'Company' ? companyName : employerName;
    console.log('Using fallback avatar for:', displayName);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=128&background=6366f1&color=ffffff&bold=true`;
  };

  const getJobCompanyLogo = (job: any) => {
    const company = job.company || job.companyName || companyName;
    
    if (job.companyLogo && !job.companyLogo.includes('clearbit.com') && !job.companyLogo.includes('gstatic.com')) {
      return job.companyLogo;
    }
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&size=40&background=6366f1&color=ffffff&bold=true`;
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

  const topJobs = useMemo(() => {
    return jobs
      .map(j => {
        const jId = String(j.id || j._id || '');
        return {
          name: (j.jobTitle || j.title || 'Job').substring(0, 22),
          applications: applications.filter(a => {
            const aJobId = typeof a.jobId === 'object'
              ? String(a.jobId?._id || a.jobId?.id || '')
              : String(a.jobId || '');
            return aJobId && jId && aJobId === jId;
          }).length
        };
      })
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 5);
  }, [jobs, applications]);

  const funnelData = useMemo(() => [
    { stage: 'Applied',     count: applications.length },
    { stage: 'Reviewed',    count: applications.filter(a => ['reviewed','shortlisted','interviewed','hired'].includes(a.status)).length },
    { stage: 'Shortlisted', count: applications.filter(a => ['shortlisted','interviewed','hired'].includes(a.status)).length },
    { stage: 'Interviewed', count: applications.filter(a => ['interviewed','hired'].includes(a.status)).length },
    { stage: 'Hired',       count: applications.filter(a => a.status === 'hired').length },
  ], [applications]);

  const PIE_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];
  
  // ── Calculate dynamic percentage changes (last 30 days vs previous 30 days) ──
  const calculatePercentageChange = (currentData: any[], field: string) => {
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

    if (previousCount === 0) return currentCount > 0 ? `+${currentCount} this month` : '0%';
    const change = ((currentCount - previousCount) / previousCount) * 100;
    return `${change >= 0 ? '+' : ''}${Math.round(change)}%`;
  };

  // Calculate dynamic percentages for each metric
  const jobsPercentage = useMemo(() => calculatePercentageChange(jobs, 'createdAt'), [jobs]);
  const applicationsPercentage = useMemo(() => calculatePercentageChange(applications, 'createdAt'), [applications]);
  const interviewsPercentage = useMemo(() => {
    const interviewed = applications.filter(a => ['interviewed','hired'].includes(a.status));
    return calculatePercentageChange(interviewed, 'updatedAt');
  }, [applications]);
  const hiredPercentage = useMemo(() => {
    const hired = applications.filter(a => a.status === 'hired');
    return calculatePercentageChange(hired, 'updatedAt');
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

  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 flex" style={{overflowX: 'hidden', maxWidth: '100vw'}}>
      {/* Error Display */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 max-w-md">
          <div className="flex items-start">
            <span className="mr-2 mt-0.5">⚠️</span>
            <div className="flex-1">
              <div className="font-medium">Dashboard Loading Issue</div>
              <div className="text-sm mt-1">{error}</div>
            </div>
            <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700 font-bold text-lg leading-none">&times;</button>
          </div>
        </div>
      )}

      {/* Static Sidebar */}
      <div className="bg-white border-r border-gray-200 flex flex-col flex-shrink-0" style={{width: '260px', height: '100vh', overflowY: 'hidden', overflowX: 'hidden', position: 'sticky', top: 0}}>
            {/* Profile header */}
            <div className="px-5 pt-4 pb-3 border-b border-gray-200">
              <BackButton onClick={() => window.history.back()} text="Back" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors mb-2" />
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <img src={getDisplayLogo()} alt={companyName || employerName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-200 shadow-md"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      const displayName = companyName || employerName;
                      const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=128&background=6366f1&color=ffffff&bold=true`;
                      if (img.src !== fallbackUrl) img.src = fallbackUrl;
                    }}
                  />
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm leading-tight">{employerName}</p>
                  <p className="text-xs text-gray-500 leading-snug mt-0.5">
                    {companyName && companyName !== 'Company' ? companyName :
                     user?.email?.includes('@trinitetech') ? 'Trinity Technology Solutions' :
                     user?.email?.includes('@') ? user.email.split('@')[1].split('.')[0].charAt(0).toUpperCase() + user.email.split('@')[1].split('.')[0].slice(1) :
                     'Company'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages + Activity panel */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700">Messages</span>
                <button onClick={() => onNavigate('messages')} className="text-blue-500 hover:text-blue-700">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
              {recentMessages.length === 0 ? (
                <p className="text-xs text-gray-400 mb-3">No messages yet</p>
              ) : (
                <div className="space-y-2 mb-3">
                  {recentMessages.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg p-1 transition-colors">
                      {c.otherPhoto ? (
                        <img src={c.otherPhoto} alt={c.otherName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {c.otherName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{c.otherName}</p>
                        <p className="text-xs text-gray-400 truncate">{c.preview}...</p>
                      </div>
                      {c.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold flex-shrink-0">{c.unreadCount}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="py-1" style={{paddingLeft: '12px', paddingRight: '12px'}}>
          <button
            onClick={() => setActiveMenu('dashboard')}
            className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors ${
              activeMenu === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="font-medium text-sm">Dashboard</span>
          </button>

          <button
            onClick={() => onNavigate('job-management')}
            className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Briefcase className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">Job Management</span>
          </button>

          <button
            onClick={() => setActiveMenu('applications')}
            className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors ${
              activeMenu === 'applications' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">Applications</span>
            {applications.length > 0 && (
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold ${
                activeMenu === 'applications' ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-800'
              }`}>
                {applications.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveMenu('interviews')}
            className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors ${
              activeMenu === 'interviews' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <MessageSquare className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">Interviews</span>
            {interviews.length > 0 && (
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold ${
                activeMenu === 'interviews' ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-800'
              }`}>
                {interviews.length}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate('my-jobs')}
            className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Briefcase className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">Posted Jobs</span>
            {jobs.length > 0 && (
              <span className="ml-auto bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                {jobs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveMenu('team')}
            className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors ${
              activeMenu === 'team' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">Team</span>
          </button>

          <button
            onClick={() => setActiveMenu('auto-rejection')}
            className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors ${
              activeMenu === 'auto-rejection' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">AI Rejection</span>
          </button>

          <button
            onClick={() => onNavigate('candidate-search')}
            className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Search className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">Search Candidates</span>
          </button>

          <button
            onClick={() => setActiveMenu('saved-candidates')}
            className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors ${
              activeMenu === 'saved-candidates' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Bookmark className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">Saved Candidates</span>
          </button>

          <button
            onClick={() => setActiveMenu('alerts')}
            className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors ${
              activeMenu === 'alerts' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Bell className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">Alerts</span>
            {notifications.length > 0 && (
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold ${
                activeMenu === 'alerts' ? 'bg-white text-red-600' : 'bg-red-500 text-white'
              }`}>
                {notifications.length}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate('settings')}
            className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">Account Settings</span>
          </button>

          <button
            onClick={() => openConfirm('Delete Account', 'Once you delete your account, there is no going back. Are you certain?', () => {
              showToast('Account deletion coming soon.', 'info');
              closeConfirm();
            })}
            className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">Delete Account</span>
          </button>
            </nav>


            <div className="py-3 border-t border-gray-200" style={{paddingLeft: '12px', paddingRight: '12px', paddingBottom: '20px', marginBottom: '16px'}}>
              <button
                onClick={() => {
                  if (onLogout) { onLogout(); } else { localStorage.removeItem('user'); onNavigate('home'); }
                }}
                className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">Logout</span>
              </button>
            </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50" style={{minWidth: 0}}>
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 max-w-lg">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input type="text" placeholder="Search here.." className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder-gray-400" />
            </div>
          </div>
          <div className="flex items-center gap-3">
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
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-6 h-6" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>
            </div>
            <button
              onClick={() => onNavigate('job-posting-selection')}
              className="bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium hover:bg-emerald-800 transition-colors text-sm"
            >
              Post a Job
            </button>
          </div>
          </div>
        </div>


        {/* Dashboard Content */}
        <div className="py-6">
          <div className="max-w-[1200px] mx-auto px-6">
          {activeMenu === 'dashboard' ? (
            <>
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Employer Dashboard</h1>
                <p className="text-gray-500 mt-1 text-sm">Welcome back, {employerName} here's your hiring overview</p>
              </div>

              {/* ── Stat Cards ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {stats.map((stat, index) => {
                  const isPositive = !stat.percentage.startsWith('-');
                  const numericPct = parseInt(stat.percentage.replace(/[^0-9-]/g, '')) || 0;
                  const clampedPct = Math.min(Math.abs(numericPct), 100);
                  const isNumericPct = stat.percentage.includes('%');
                  const radius = 28;
                  const circumference = 2 * Math.PI * radius;
                  const fillRatio = isNumericPct ? clampedPct / 100 : 0.6;
                  const strokeDash = fillRatio * circumference;
                  const ringColors = ['#8b5cf6','#06b6d4','#f59e0b','#10b981'];
                  const ringColor = isPositive ? ringColors[index] : '#ef4444';
                  // Format value like 12.2K
                  const numVal = parseInt(stat.value) || 0;
                  const displayVal = numVal >= 1000 ? `${(numVal/1000).toFixed(1)}K` : stat.value;
                  return (
                    <div key={index} className="bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">{stat.label}</p>
                      <div className="flex items-center justify-between">
                        <h3 className="text-3xl font-bold text-gray-900">{displayVal}</h3>
                        <div className="relative flex-shrink-0">
                          <svg width="68" height="68" viewBox="0 0 68 68">
                            <circle cx="34" cy="34" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="5" />
                            <circle
                              cx="34" cy="34" r={radius} fill="none"
                              stroke={ringColor} strokeWidth="5"
                              strokeDasharray={`${strokeDash} ${circumference}`}
                              strokeLinecap="round"
                              transform="rotate(-90 34 34)"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold" style={{ color: ringColor }}>
                              {isNumericPct
                                ? `${isPositive ? '+' : ''}${numericPct}%`
                                : stat.percentage.replace(' this month', '')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Row 1: Applications Over Time + Funnel ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Area chart – applications last 7 days */}
                <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">Applications Received</h2>
                      <p className="text-xs text-gray-400">Last 7 days</p>
                    </div>
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                  {applications.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No application data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={150}>
                      <AreaChart data={applicationsOverTime} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="applications" stroke="#3b82f6" fill="url(#appGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Application Status Donut */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">Status Breakdown</h2>
                      <p className="text-xs text-gray-400">All applications</p>
                    </div>
                    <BarChart2 className="w-5 h-5 text-purple-500" />
                  </div>
                  {statusBreakdown.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={statusBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                          {statusBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* ── Row 2: Top Active Jobs + Acquisitions + New Applicants ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

                {/* Top Active Jobs table */}
                <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-semibold text-gray-900">Top Active Jobs</h2>
                    <span className="text-xs text-blue-500 font-medium">Last 30 days</span>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    {[{label:'Applications',color:'#8b5cf6'},{label:'Shortlisted',color:'#06b6d4'},{label:'Rejected',color:'#d1d5db'}].map(l => (
                      <div key={l.label} className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full" style={{background:l.color}}></span>
                        <span className="text-xs text-gray-500">{l.label}</span>
                      </div>
                    ))}
                  </div>
                  {topJobs.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No jobs posted yet</div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left text-xs text-gray-400 font-medium pb-2">Job Title</th>
                          <th className="text-right text-xs text-gray-400 font-medium pb-2">Applications</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topJobs.slice(0,5).map((job, i) => {
                          const jId = String(jobs[i]?.id || jobs[i]?._id || '');
                          const shortlisted = applications.filter(a => {
                            const aId = typeof a.jobId === 'object' ? String(a.jobId?._id || a.jobId?.id || '') : String(a.jobId || '');
                            return aId === jId && ['shortlisted','hired'].includes(a.status);
                          }).length;
                          const rejected = applications.filter(a => {
                            const aId = typeof a.jobId === 'object' ? String(a.jobId?._id || a.jobId?.id || '') : String(a.jobId || '');
                            return aId === jId && a.status === 'rejected';
                          }).length;
                          const total = Math.max(job.applications, 1);
                          return (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="py-3">
                                <p className="text-sm font-medium text-gray-800 mb-1.5">{job.name}</p>
                                <div className="flex h-1.5 w-44 rounded-full overflow-hidden bg-gray-100">
                                  <div style={{width:`${(job.applications/total)*100}%`,background:'#8b5cf6'}} />
                                  <div style={{width:`${(shortlisted/total)*100}%`,background:'#06b6d4'}} />
                                  <div style={{width:`${(rejected/total)*100}%`,background:'#d1d5db'}} />
                                </div>
                              </td>
                              <td className="py-3 text-right text-sm font-bold text-gray-900">{job.applications}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Right col: Acquisitions + New Applicants */}
                <div className="flex flex-col gap-5">

                  {/* Acquisitions */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-semibold text-gray-900">Acquisitions</h2>
                      <span className="text-xs text-blue-500 font-medium">This Month</span>
                    </div>
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
                          <div className="flex h-2 rounded-full overflow-hidden mb-3">
                            {acq.map((s,i) => <div key={i} style={{width:`${(s.count/total)*100}%`,background:s.color}} />)}
                          </div>
                          <div className="space-y-2">
                            {acq.map((s,i) => (
                              <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{background:s.color}}></span>
                                  <span className="text-xs text-gray-500">{s.label}</span>
                                </div>
                                <span className="text-xs font-bold text-gray-700">
                                  {applications.length > 0 ? `${Math.round((s.count/total)*100)}%` : '0%'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* New Applicants */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-semibold text-gray-900">New Applicants</h2>
                      <span className="text-xs text-blue-500 font-medium">Today</span>
                    </div>
                    {applications.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">No applicants yet</p>
                    ) : (
                      <div className="space-y-3">
                        {applications.slice(0,4).map((app,i) => (
                          <div key={i} className="flex items-center gap-3">
                            {app.candidateProfilePicture ? (
                              <img src={app.candidateProfilePicture} alt={app.candidateName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                                style={{background: PIE_COLORS[i % PIE_COLORS.length]}}>
                                {(app.candidateName||'C').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{app.candidateName||'Candidate'}</p>
                              <p className="text-xs text-gray-400 truncate">Applied for {(app.jobTitle||'a position').substring(0,22)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* ── Row 3: Quick Actions + Recent Activity ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="space-y-3">
                    <button onClick={() => onNavigate('job-posting-selection')} className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
                      <Plus className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span className="font-medium text-gray-900">Post New Job</span>
                    </button>
                    <button onClick={() => onNavigate('job-management')} className="w-full flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left">
                      <Briefcase className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      <span className="font-medium text-gray-900">Job Management</span>
                    </button>
                    <button onClick={() => onNavigate('candidate-search')} className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left">
                      <Search className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="font-medium text-gray-900">Search Candidates</span>
                    </button>
                    <button onClick={() => setActiveMenu('applications')} className="w-full flex items-center gap-3 p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors text-left">
                      <Folder className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                      <span className="font-medium text-gray-900">Manage Applications</span>
                    </button>
                    <button onClick={() => setActiveMenu('interviews')} className="w-full flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left">
                      <MessageSquare className="w-5 h-5 text-orange-600 flex-shrink-0" />
                      <span className="font-medium text-gray-900">Schedule Interview</span>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Activity</h2>
                  <div className="space-y-4">
                    {loading ? (
                      <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
                    ) : recentActivity.length === 0 ? (
                      <div className="text-center py-8"><p className="text-gray-500 text-sm">No recent activity</p></div>
                    ) : (
                      recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-b-0">
                          <div className="flex-1">
                            <p className="text-gray-900 font-medium text-sm">{activity.message}</p>
                            {activity.details && (
                              <p className="text-gray-600 text-xs mt-1">
                                {activity.details.candidateName && `${activity.details.candidateName} - `}
                                {activity.details.jobTitle}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 ml-4">{activity.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : activeMenu === 'applications' ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
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
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 flex-1 min-w-[180px]">
                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search candidate..."
                    value={appSearch}
                    onChange={e => setAppSearch(e.target.value)}
                    className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder-gray-400"
                  />
                </div>
                <select
                  value={appFilterJob}
                  onChange={e => setAppFilterJob(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-white min-w-[180px]"
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
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-white"
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
                    className="text-sm text-red-500 hover:text-red-700 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
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
                    <div key={application._id || application.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-600 font-semibold text-sm">
                              {application.candidateName?.charAt(0).toUpperCase() || 'C'}
                            </span>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                  {application.candidateName || application.candidateEmail}
                                </h3>
                                <p className="text-base text-blue-700 font-semibold flex items-center gap-1">
                                  <Briefcase className="w-4 h-4" />
                                  Applied for: {application.jobTitle || 'Job Position'}
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                application.status === 'applied' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                application.status === 'reviewed' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                application.status === 'shortlisted' ? 'bg-green-50 text-green-700 border border-green-200' :
                                application.status === 'hired' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                application.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                                'bg-gray-50 text-gray-600 border border-gray-200'
                              }`}>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                              <span className="text-sm text-gray-500">{application.candidateEmail}</span>

                              <span className="text-sm text-gray-500">Applied: {new Date(application.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>

                            {application.coverLetter && application.coverLetter !== 'No cover letter' && (
                              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded mb-3 border-l-2 border-gray-300">
                                <strong className="text-gray-700">Cover Letter:</strong> {application.coverLetter.length > 150 ? 
                                  `${application.coverLetter.substring(0, 150)}...` : 
                                  application.coverLetter
                                }
                              </div>
                            )}

                            {application.resumeUrl ? (
                              <div className="mb-3">
                                <button
                                  onClick={() => {
                                    const appId = application._id || application.id;
                                    setSelectedResumeAppId(appId);
                                    setSelectedResumeUrl(application.resumeUrl || null);
                                    setSelectedResumeCandidateName(application.candidateName || null);
                                    setSelectedResumeCandidateEmail(application.candidateEmail || null);
                                    setShowResumeModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-semibold inline-flex items-center space-x-1 bg-blue-100 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors"
                                >
                                  <FileText className="w-4 h-4" />
                                  <span>View Resume</span>
                                </button>
                              </div>
                            ) : (
                              <div className="mb-3">
                                <span className="text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-lg flex items-center gap-1"><FileText className="w-4 h-4" /> Resume not available</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="ml-6 flex flex-col space-y-2">
                          <select
                            value={application.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              const appId = application._id || application.id;
                              try {
                                const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}/${appId}/status`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: newStatus }),
                                });
                                
                                if (response.ok) {
                                  setApplications(prev => 
                                    prev.map(app => 
                                      (app._id || app.id) === appId ? { ...app, status: newStatus } : app
                                    )
                                  );
                                  
                                  const statusMessages: Record<string, string> = {
                                    pending: 'Application marked as pending',
                                    reviewed: 'Application marked as reviewed',
                                    shortlisted: 'Candidate shortlisted!',
                                    rejected: 'Application rejected',
                                    hired: 'Candidate hired!',
                                  };
                                  showToast(statusMessages[newStatus] || 'Status updated', 'success');
                                } else {
                                  throw new Error(`Failed to update status: ${response.status}`);
                                }
                              } catch (error) {
                                console.error('Error updating status:', error);
                                showToast('Failed to update application status. Please try again.', 'error');
                                e.target.value = application.status;
                              }
                            }}
                            className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                            title="Update application status"
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="rejected">Rejected</option>
                            <option value="hired">Hired</option>
                          </select>
                          {application.status !== 'rejected' && (
                            <button 
                              onClick={() => {
                                setSelectedApplication(application);
                                setShowScheduleModal(true);
                              }}
                              className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors text-sm shadow-md"
                            >
                              Schedule Interview
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              const candidateId = application.candidateId || application.userId || application.candidateUserId || application.candidateEmail;
                              if (!candidateId) {
                                showToast('Candidate profile not available.', 'info');
                                return;
                              }
                              sessionStorage.setItem('viewCandidateId', candidateId);
                              onNavigate('candidate-profile-view', { candidateId });
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm shadow-md"
                          >
                            View Profile
                          </button>
                          <button 
                            onClick={() => {
                              const appId = application._id || application.id;
                              openConfirm('Delete Application', 'Are you sure you want to delete this application?', () => {
                                fetch(`${API_ENDPOINTS.APPLICATIONS}/${appId}`, {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                }).then(res => {
                                  if (res.ok) {
                                    setApplications(prev => prev.filter(app => (app._id || app.id) !== appId));
                                    showToast('Application deleted successfully!', 'success');
                                  } else {
                                    showToast('Failed to delete application', 'error');
                                  }
                                }).catch(() => showToast('Failed to delete application', 'error'));
                                closeConfirm();
                              });
                            }}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm shadow-md flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                );
              })()}
            </>
          ) : activeMenu === 'interviews' ? (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Scheduled Interviews</h1>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
              ) : interviews.length === 0 ? (
                <div className="text-center py-16">
                  <MessageSquare className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Interviews Scheduled</h3>
                  <p className="text-gray-600 mb-6">Interview schedules will appear here when candidates book interviews.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {interviews.map((interview) => (
                    <div key={interview._id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-600 font-semibold text-sm">
                              {interview.candidateName?.charAt(0).toUpperCase() || 'C'}
                            </span>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                  {interview.candidateName || 'Candidate'}
                                </h3>
                                <p className="text-base text-purple-700 font-semibold flex items-center gap-1">
                                  <Briefcase className="w-4 h-4" />
                                  {interview.jobTitle || 'Interview'}
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                interview.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                interview.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-200' :
                                interview.status === 'cancelled' ? 'bg-red-50 text-red-700 border border-red-200' :
                                'bg-gray-50 text-gray-600 border border-gray-200'
                              }`}>
                                {interview.status?.charAt(0).toUpperCase() + interview.status?.slice(1) || 'Scheduled'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-3 mb-3 flex-wrap text-sm text-gray-500">
                              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(interview.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>

                              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{interview.time}</span>

                              <span>{interview.candidateEmail}</span>
                            </div>

                            {interview.meetingLink && (
                              <div className="mb-3">
                                <a
                                  href={interview.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm font-semibold inline-flex items-center space-x-1 bg-blue-100 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors"
                                >
                                  <Video className="w-4 h-4" />
                                  <span>Join Meeting</span>
                                </a>
                              </div>
                            )}

                            {interview.notes && (
                              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border-l-2 border-gray-300">
                                <strong className="text-gray-700">Notes:</strong> {interview.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="ml-6 flex flex-col space-y-2">
                          <select
                            value={interview.status || 'scheduled'}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              try {
                                const response = await fetch(`${API_ENDPOINTS.BASE_URL}/interviews/${interview._id}/status`, {
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
                            className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                            title="Update interview status"
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <button 
                            onClick={() => {
                              openConfirm('Delete Interview', 'Are you sure you want to delete this interview?', () => {
                                fetch(`${API_ENDPOINTS.BASE_URL}/interviews/${interview._id}`, {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                }).then(res => {
                                  if (res.ok) {
                                    setInterviews(prev => prev.filter(int => int._id !== interview._id));
                                    showToast('Interview deleted successfully!', 'success');
                                  } else {
                                    showToast('Failed to delete interview', 'error');
                                  }
                                }).catch(() => showToast('Failed to delete interview', 'error'));
                                closeConfirm();
                              });
                            }}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm shadow-md flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : activeMenu === 'saved-candidates' ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Saved Candidates</h1>
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
                          {/* Name + Saved-by badge */}
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-xl font-bold text-gray-900">{name}</h3>
                            {candidate.companyName && (
                              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                {candidate.companyLogo && (
                                  <img src={candidate.companyLogo} alt="" className="w-3.5 h-3.5 rounded-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                )}
                                {candidate.companyName}
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
                            onClick={() => {
                              openConfirm('Remove Candidate', 'Remove this candidate from your saved list?', () => {
                                const token = getToken();
                                const recordId = candidate.id || candidate._id;
                                fetch(`${API_ENDPOINTS.SAVED_CANDIDATES}/${recordId}`, {
                                  method: 'DELETE',
                                  headers: { 'Authorization': `Bearer ${token}` }
                                })
                                .then(res => {
                                  if (res.ok) {
                                    setSavedCandidates(prev => prev.filter(c => (c.id || c._id) !== recordId));
                                    showToast('Candidate removed from saved list!', 'success');
                                  } else {
                                    showToast('Failed to remove candidate. Please try again.', 'error');
                                  }
                                })
                                .catch(() => showToast('Failed to remove candidate. Please try again.', 'error'));
                                closeConfirm();
                              });
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
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Alerts & Notifications</h1>
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
            <TeamSection employerEmail={user?.email} companyName={companyName} showToast={showToast} />
          ) : activeMenu === 'auto-rejection' ? (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">AI Auto-Rejection Settings</h1>
              <AutoRejectionSettings onSave={(settings) => console.log('Settings saved:', settings)} />
            </>
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
          <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
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
            fetchDashboardData(user);
          }}
        />
      )}
    </div>
  );
};


// ── Team Section Component ──────────────────────────────────────────────

type TeamRole = 'Owner' | 'Recruiter' | 'Viewer';
interface TeamMember { id: string; memberEmail: string; memberName: string; role: TeamRole; status: 'active' | 'pending'; createdAt: string; }

const ROLE_PERMISSIONS: Record<TeamRole, string[]> = {
  Owner: ['Post Jobs', 'Manage Applications', 'Invite Members', 'Remove Members', 'Change Roles', 'View Analytics'],
  Recruiter: ['Post Jobs', 'Manage Applications', 'View Analytics'],
  Viewer: ['View Analytics'],
};

const TeamSection: React.FC<{ employerEmail: string; companyName: string; showToast: (message: string, type?: ToastType) => void }> = ({ employerEmail, companyName, showToast }) => {
  const API_BASE = import.meta.env.VITE_API_URL || '/api';
  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<TeamRole>('Recruiter');
  const [inviteName, setInviteName] = React.useState('');
  const [showInvite, setShowInvite] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<TeamRole | null>(null);

  const fetchMembers = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/team?employerId=${encodeURIComponent(employerEmail)}`);
      if (res.ok) {
        const data = await res.json();
        const hasOwner = data.some((m: TeamMember) => m.memberEmail === employerEmail && m.role === 'Owner');
        if (!hasOwner) {
          await fetch(`${API_BASE}/team`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employerId: employerEmail, memberEmail: employerEmail, memberName: 'You (Owner)', role: 'Owner', status: 'active' })
          });
          const res2 = await fetch(`${API_BASE}/team?employerId=${encodeURIComponent(employerEmail)}`);
          if (res2.ok) setMembers(await res2.json());
          else setMembers([{ id: '1', memberEmail: employerEmail, memberName: 'You (Owner)', role: 'Owner', status: 'active', createdAt: new Date().toISOString() }]);
        } else {
          setMembers(data);
        }
      } else {
        console.error('Team API error:', res.status, res.statusText);
        // Set fallback owner on API error
        setMembers([{ id: '1', memberEmail: employerEmail, memberName: 'You (Owner)', role: 'Owner', status: 'active', createdAt: new Date().toISOString() }]);
      }
    } catch (e) { 
      console.error('Team fetch error:', e);
      // Set fallback owner on network error
      setMembers([{ id: '1', memberEmail: employerEmail, memberName: 'You (Owner)', role: 'Owner', status: 'active', createdAt: new Date().toISOString() }]);
    }
    finally { setLoading(false); }
  }, [employerEmail, API_BASE]);

  React.useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) { showToast('Enter a valid email address', 'error'); return; }
    if (members.find(m => m.memberEmail === inviteEmail.trim())) { showToast('This email is already in the team', 'error'); return; }
    try {
      const res = await fetch(`${API_BASE}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employerId: employerEmail, memberEmail: inviteEmail.trim(), memberName: inviteName.trim() || inviteEmail.split('@')[0], role: inviteRole })
      });
      if (res.ok) {
        await fetchMembers();
        setInviteEmail(''); setInviteName(''); setShowInvite(false);
        showToast(`${inviteEmail} invited as ${inviteRole}`, 'success');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to invite', 'error');
      }
    } catch { showToast('Network error', 'error'); }
  };

  const handleRoleChange = async (id: string, role: TeamRole) => {
    try {
      const res = await fetch(`${API_BASE}/team/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (res.ok) { await fetchMembers(); showToast('Role updated', 'success'); }
    } catch { showToast('Failed to update role', 'error'); }
  };

  const handleRemove = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/team/${id}`, { method: 'DELETE' });
      if (res.ok) { await fetchMembers(); showToast('Member removed', 'success'); }
    } catch { showToast('Failed to remove member', 'error'); }
  };

  const roleColors: Record<TeamRole, string> = {
    Owner: 'bg-blue-100 text-blue-700 border-blue-200',
    Recruiter: 'bg-orange-100 text-orange-700 border-orange-200',
    Viewer: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-500 text-sm mt-1">{companyName} · {members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
          <UserPlus className="w-4 h-4" /> Invite Member
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {(Object.entries(ROLE_PERMISSIONS) as [TeamRole, string[]][]).map(([role, perms]) => (
          <div key={role} onClick={() => setSelectedRole(selectedRole === role ? null : role)}
            className={`bg-white rounded-xl p-4 border cursor-pointer transition-all ${
              selectedRole === role ? 'border-blue-400 shadow-md' : 'border-gray-200 hover:border-gray-300'
            }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${roleColors[role]}`}>{role}</span>
              <span className="text-xs text-gray-400">{members.filter(m => m.role === role).length} member{members.filter(m => m.role === role).length !== 1 ? 's' : ''}</span>
            </div>
            <ul className="space-y-1">
              {perms.map(p => <li key={p} className="text-xs text-gray-600 flex items-center gap-1"><span className="text-green-500">✓</span>{p}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Members</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {members.map(member => (
            <div key={member.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {member.memberName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{member.memberName}</p>
                <p className="text-xs text-gray-500 truncate">{member.memberEmail}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                member.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : roleColors[member.role]
              }`}>
                {member.status === 'pending' ? '⏳ Pending' : member.role}
              </span>
              {member.memberEmail !== employerEmail ? (
                <div className="flex items-center gap-2">
                  <select value={member.role} onChange={e => handleRoleChange(member.id, e.target.value as TeamRole)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="Recruiter">Recruiter</option>
                    <option value="Viewer">Viewer</option>
                    <option value="Owner">Owner</option>
                  </select>
                  <button onClick={() => handleRemove(member.id)}
                    className="text-red-500 hover:text-red-700 text-xs border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                    Remove
                  </button>
                </div>
              ) : (
                <span className="text-xs text-gray-400 italic">You</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Invite Team Member</h3>
              <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)}
                  placeholder="John Doe" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  placeholder="recruiter@company.com" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
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
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowInvite(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleInvite}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Send Invite</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployerDashboardPage;
