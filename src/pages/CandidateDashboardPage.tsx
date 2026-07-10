import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  TrendingUp,
  Star,
  Edit,
  FileText,
  Search,
  X,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { API_ENDPOINTS } from "../config/constants";
import { apiFetch } from "../api/apiFetch";
import Notification from "../components/Notification";
import BackButton from "../components/BackButton";
import ProfilePhotoEditor from "../components/ProfilePhotoEditor";
import CandidateNotificationBell from "../components/CandidateNotificationBell";
import { useApplicationNotifications } from "../hooks/useApplicationNotifications";
import { tokenStorage } from "../utils/tokenStorage";
import { S3Service } from "../services/s3Service";

import LinkedInConnect, {
  type LinkedInProfile,
} from "../components/LinkedInConnect";
import ProfileVisibilityToggle from "../components/ProfileVisibilityToggle";
import CoverPhotoCropModal from "../components/CoverPhotoCropModal";
import { AIFeatureLoader } from "../components/AIProgressLoader";
import ConfirmDialog from "../components/ConfirmDialog";

interface CandidateDashboardPageProps {
  user?: any;
  onNavigate: (page: string, data?: any) => void;
  readOnly?: boolean;
  viewEmail?: string;
}

const CandidateDashboardPage: React.FC<CandidateDashboardPageProps> = ({
  user: userProp,
  onNavigate,
  readOnly = false,
  viewEmail,
}) => {
  const [user, setUser] = useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    () => searchParams.get("tab") || "Profile",
  );
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
    isVisible: boolean;
  }>({ type: "success", message: "", isVisible: false });
  const [showNotifTooltip, setShowNotifTooltip] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [coverCropModal, setCoverCropModal] = useState<{
    src: string;
    file: File;
  } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean; title: string; message: string; onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const showConfirm = (title: string, message: string, onConfirm: () => void) =>
    setConfirmDialog({ isOpen: true, title, message, onConfirm });
  const [showResumePopup, setShowResumePopup] = useState(false);
  const [resumePopupFile, setResumePopupFile] = useState<File | null>(null);
  const [resumePopupParsing, setResumePopupParsing] = useState(false);
  const [resumePopupError, setResumePopupError] = useState("");
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>({});
  const [applications, setApplications] = useState<any[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>(() => {
    try {
      const userData =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      const parsed = userData ? JSON.parse(userData) : {};
      const key = `savedJobs_${parsed?.email || parsed?.name || "user"}`;
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  });
  const [myAssessments, setMyAssessments] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [collegeSearch, setCollegeSearch] = useState("");
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [jobTitles, setJobTitles] = useState<any[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [prefLocInput, setPrefLocInput] = useState("");
  const [careerPrefLocInput, setCareerPrefLocInput] = useState("");
  const [showJobTitleDropdown, setShowJobTitleDropdown] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [loadingChats, setLoadingChats] = useState(false);
  const [activeQuickAction, setActiveQuickAction] = useState<string | null>(
    null,
  );

  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !selectedConversation) return;
    try {
      const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversation._id,
          senderEmail: user?.email,
          senderId: user?.id,
          message: chatMessage.trim(),
        }),
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [...prev, newMsg]);
        setChatMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const candidateEmail = user?.email || (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}").email; } catch { return undefined; }
  })();
  const {
    notifications: appNotifications,
    unreadCount,
    markRead,
    markAllRead,
    clearAll,
  } = useApplicationNotifications(candidateEmail);

  const fetchActivityInsights = async (userId: string) => {
    setLoadingActivity(true);
    try {
      const email = user?.email || userId;

      const [appsRes, interviewsRes, analyticsRes] = await Promise.all([
        fetch(
          `${API_ENDPOINTS.BASE_URL}/applications/candidate/${encodeURIComponent(email)}`,
        ),
        fetch(
          `${API_ENDPOINTS.BASE_URL}/interviews/candidate/${encodeURIComponent(email)}`,
        ),
        fetch(
          `${API_ENDPOINTS.BASE_URL}/analytics/profile/${encodeURIComponent(email)}`,
        ),
      ]);

      let apps: any[] = [];
      let interviews: any[] = [];

      if (appsRes.ok) {
        const data = await appsRes.json();
        if (Array.isArray(data)) apps = data;
      }

      if (interviewsRes.ok) {
        const data = await interviewsRes.json();
        if (Array.isArray(data)) interviews = data;
      }

      // profileViews from analytics endpoint only if backend tracks it
      let profileViews = 0;
      if (analyticsRes.ok) {
        const analytics = await analyticsRes.json();
        profileViews = analytics.profileViews || 0;
      }

      // applicationsSent = total applications submitted
      const applicationsSent = apps.length;

      // recruiterActions = applications that moved past 'applied' (reviewed/shortlisted/rejected by recruiter)
      const recruiterActions =
        apps.filter((a: any) =>
          ["reviewed", "shortlisted", "rejected", "hired"].includes(a.status),
        ).length + interviews.length;

      // searchAppearances = applications where recruiter viewed/shortlisted (real signal of appearing in search)
      const searchAppearances = apps.filter((a: any) =>
        ["reviewed", "shortlisted", "hired"].includes(a.status),
      ).length;

      // Build recent activity from real application + interview events
      const recentActivity: Array<{
        type: string;
        company: string;
        message: string;
        time: string;
        icon: string;
      }> = [];

      const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 24) return hours <= 1 ? "Just now" : `${hours}h ago`;
        return `${days}d ago`;
      };

      apps.slice(0, 4).forEach((app: any) => {
        const statusIcons: Record<string, string> = {
          applied: "??",
          reviewed: "??",
          shortlisted: "??",
          rejected: "?",
          hired: "?",
        };
        recentActivity.push({
          type: "application",
          company: app.jobId?.company || "Company",
          message: `Applied for ${app.jobId?.jobTitle || "a position"}  ${app.status}`,
          time: timeAgo(app.createdAt),
          icon: statusIcons[app.status] || "??",
        });
      });

      interviews.slice(0, 2).forEach((iv: any) => {
        recentActivity.push({
          type: "interview",
          company: iv.company || iv.jobId?.company || "Company",
          message: `Interview scheduled for ${iv.jobTitle || iv.jobId?.jobTitle || "a position"}`,
          time: timeAgo(iv.scheduledAt || iv.createdAt),
          icon: "??",
        });
      });

      // Sort by most recent
      recentActivity.sort((a, b) => {
        const parse = (t: string) => {
          if (t === "Just now") return 0;
          const h = t.match(/(\d+)h ago/);
          if (h) return parseInt(h[1]) * 60;
          const d = t.match(/(\d+)d ago/);
          if (d) return parseInt(d[1]) * 1440;
          return 9999;
        };
        return parse(a.time) - parse(b.time);
      });

      if (recentActivity.length === 0) {
        recentActivity.push({
          type: "info",
          company: "ZyncJobs",
          message: "No activity yet. Start applying to jobs!",
          time: "Now",
          icon: "",
        });
      }

      setActivityData({
        profileViews,
        searchAppearances,
        applicationsSent,
        recruiterActions,
        recentActivity,
      });
    } catch (error) {
      console.error("Error fetching activity insights:", error);
      setActivityData({
        profileViews: 0,
        searchAppearances: 0,
        applicationsSent: 0,
        recruiterActions: 0,
        recentActivity: [
          {
            type: "info",
            company: "ZyncJobs",
            message: "Failed to load activity data",
            time: "Now",
            icon: "??",
          },
        ],
      });
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await apiFetch(`${API_ENDPOINTS.BASE_URL}/colleges`);
        console.log("Colleges API response:", response.status);
        if (response.ok) {
          const data = await response.json();
          console.log("Colleges data:", data);
          setColleges(data.colleges || []);
        } else {
          console.error("Failed to fetch colleges:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching colleges:", error);
      }
    };
    const fetchLocations = async () => {
      try {
        const response = await apiFetch(`${API_ENDPOINTS.BASE_URL}/locations`);
        if (response.ok) {
          const data = await response.json();
          setLocations(data.locations || []);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };
    const fetchSkills = async () => {
      try {
        const response = await apiFetch(
          `${API_ENDPOINTS.BASE_URL}/autocomplete/skills`,
        );
        if (response.ok) {
          const data = await response.json();
          setSkills(data.skills || []);
        }
      } catch (error) {
        console.error("Error fetching skills:", error);
      }
    };
    const fetchJobTitles = async () => {
      try {
        const response = await apiFetch(`${API_ENDPOINTS.BASE_URL}/job-titles`);
        if (response.ok) {
          const data = await response.json();
          setJobTitles(data.job_titles || []);
        }
      } catch (error) {
        console.error("Error fetching job titles:", error);
      }
    };
    fetchColleges();
    fetchLocations();
    fetchSkills();
    fetchJobTitles();
  }, []);

  useEffect(() => {
    const loadUserProfile = async () => {
      let parsedUser: any = null;

      if (readOnly && viewEmail) {
        // Load the target candidate's profile directly
        try {
          const response = await apiFetch(
            `${API_ENDPOINTS.BASE_URL}/profile/${encodeURIComponent(viewEmail)}`,
          );
          if (response.ok) {
            parsedUser = await response.json();
            setUser(parsedUser);
            calculateProfileCompletion(parsedUser);
          }
        } catch (error) {
          console.error("Error fetching candidate profile:", error);
        }
        setLoading(false);
        return;
      }

      // Prefer user prop (React state from App.tsx) over localStorage
      const userData = userProp || localStorage.getItem("user") || sessionStorage.getItem("user");
      if (userData) {
        try {
          const parsedUser = typeof userData === 'object' ? userData : JSON.parse(userData);
          let finalUser = parsedUser;
          // Fetch fresh data from database
          try {
            let profileData: any = null;
            try {
              const profileRes = await apiFetch(
                `${API_ENDPOINTS.BASE_URL}/profile/${parsedUser.email}`,
              );
              if (profileRes.ok) profileData = await profileRes.json();
            } catch {
              /* silent */
            }
            const _uid = parsedUser._id || parsedUser.id;
            if (
              _uid &&
              (!profileData ||
                (!profileData.skills?.length &&
                  !profileData.employment &&
                  !profileData.educationCollege))
            ) {
              try {
                const userRes = await apiFetch(
                  `${API_ENDPOINTS.BASE_URL}/users/${_uid}`,
                );
                if (userRes.ok) {
                  const userRecord = await userRes.json();
                  profileData = profileData
                    ? { ...userRecord, ...profileData }
                    : userRecord;
                }
              } catch {
                /* silent */
              }
            }
            const response = { ok: !!profileData };
            if (profileData && response.ok) {
              console.log(
                "Dashboard loaded, skills:",
                profileData.skills?.length,
                "employment:",
                !!profileData.employment,
              );
              // Merge database data with localStorage data, prioritizing database data
              const normalizePhotoUrl = (url: string) => {
                if (!url) return "";
                if (url.startsWith("data:")) return url;
                const backendBase = (
                  import.meta.env.VITE_API_URL || "/api"
                ).replace(/\/api\/?$/, "");
                if (url.startsWith("http")) return url;
                return url.startsWith("/")
                  ? `${backendBase}${url}`
                  : `${backendBase}/${url}`;
              };
              // Helper: pick profileData value only if it's meaningfully filled
              const pick = (
                fromDB: any,
                fromLocal: any,
                fallback: any = "",
              ) => {
                if (fromDB !== null && fromDB !== undefined && fromDB !== "") {
                  if (typeof fromDB === "object" && !Array.isArray(fromDB)) {
                    // Only use DB object if it has at least one non-empty value
                    if (
                      Object.values(fromDB).some(
                        (v) =>
                          v !== null &&
                          v !== undefined &&
                          String(v).trim() !== "",
                      )
                    )
                      return fromDB;
                  } else if (Array.isArray(fromDB) && fromDB.length > 0) {
                    return fromDB;
                  } else if (
                    typeof fromDB === "string" &&
                    fromDB.trim() !== ""
                  ) {
                    return fromDB;
                  } else if (typeof fromDB !== "object") {
                    return fromDB;
                  }
                }
                return fromLocal !== undefined &&
                  fromLocal !== null &&
                  fromLocal !== ""
                  ? fromLocal
                  : fallback;
              };

              const updatedUser = {
                ...parsedUser,
                ...profileData,
                // All fields use pick() so DB empty values never overwrite good localStorage values
                name: pick(profileData.name, parsedUser.name),
                profilePhoto: normalizePhotoUrl(
                  profileData.profilePhoto || parsedUser.profilePhoto || "",
                ),
                coverPhoto: normalizePhotoUrl(
                  profileData.coverPhoto || parsedUser.coverPhoto || "",
                ),
                profileFrame: pick(
                  profileData.profileFrame,
                  parsedUser.profileFrame,
                  "none",
                ),
                profileSummary: pick(
                  profileData.profileSummary,
                  parsedUser.profileSummary,
                ),
                employment: pick(profileData.employment, parsedUser.employment),
                projects: pick(profileData.projects, parsedUser.projects),
                internships: pick(
                  profileData.internships,
                  parsedUser.internships,
                ),
                languages: pick(profileData.languages, parsedUser.languages),
                awards: pick(profileData.awards, parsedUser.awards),
                clubsCommittees: pick(
                  profileData.clubsCommittees,
                  parsedUser.clubsCommittees,
                ),
                competitiveExams: pick(
                  profileData.competitiveExams,
                  parsedUser.competitiveExams,
                ),
                academicAchievements: pick(
                  profileData.academicAchievements,
                  parsedUser.academicAchievements,
                ),
                certifications: pick(
                  profileData.certifications,
                  parsedUser.certifications,
                ),
                companyName: pick(
                  profileData.companyName,
                  parsedUser.companyName,
                ),
                roleTitle: pick(profileData.roleTitle, parsedUser.roleTitle),
                gender: pick(profileData.gender, parsedUser.gender),
                email: parsedUser.email,
                id: parsedUser.id,
                role: parsedUser.role,
                birthday: pick(profileData.birthday, parsedUser.birthday),
                location: pick(profileData.location, parsedUser.location),
                phone: pick(profileData.phone, parsedUser.phone),
                jobTitle: pick(profileData.jobTitle, parsedUser.jobTitle),
                education: pick(profileData.education, parsedUser.education),
                educationCollege: pick(
                  profileData.educationCollege,
                  parsedUser.educationCollege,
                ),
                educationClass12: pick(
                  profileData.educationClass12,
                  parsedUser.educationClass12,
                ),
                educationClass10: pick(
                  profileData.educationClass10,
                  parsedUser.educationClass10,
                ),
                careerPreferences: pick(
                  profileData.careerPreferences,
                  parsedUser.careerPreferences,
                ),
                skills: pick(profileData.skills, parsedUser.skills),
                resume:
                  profileData.resume !== undefined
                    ? profileData.resume
                    : parsedUser.resume !== undefined
                      ? parsedUser.resume
                      : profileData.resumeUrl
                        ? {
                            name: profileData.resumeUrl.split("/").pop(),
                            url: profileData.resumeUrl,
                            uploadDate: "",
                          }
                        : null,
                resumeUrl:
                  profileData.resumeUrl !== undefined
                    ? profileData.resumeUrl
                    : parsedUser.resumeUrl || "",
              };
              setUser(updatedUser);
              // Update localStorage with fresh data
              localStorage.setItem("user", JSON.stringify(updatedUser));
              calculateProfileCompletion(updatedUser);

              // Show resume popup for first-time users
              const popupKey = `resumePopupDismissed_${parsedUser.email}`;
              const isNewUser = !updatedUser.resume && !updatedUser.resumeUrl;
              if (!localStorage.getItem(popupKey) && isNewUser) {
                localStorage.removeItem(popupKey); // ensure clean state
                setTimeout(() => setShowResumePopup(true), 800);
              }
            } else {
              setUser(parsedUser);
              calculateProfileCompletion(parsedUser);

              // Show resume popup for first-time users
              const popupKey = `resumePopupDismissed_${parsedUser.email}`;
              const isNewUser = !parsedUser.resume && !parsedUser.resumeUrl;
              if (!localStorage.getItem(popupKey) && isNewUser) {
                localStorage.removeItem(popupKey);
                setTimeout(() => setShowResumePopup(true), 800);
              }
            }
          } catch (error) {
            console.error("Error fetching profile from database:", error);
            setUser(parsedUser);
            calculateProfileCompletion(parsedUser);

            // Show resume popup for first-time users
            const popupKey = `resumePopupDismissed_${parsedUser.email}`;
            const isNewUser = !parsedUser.resume && !parsedUser.resumeUrl;
            if (!localStorage.getItem(popupKey) && isNewUser) {
              localStorage.removeItem(popupKey);
              setTimeout(() => setShowResumePopup(true), 800);
            }
          }

          fetchNotifications(parsedUser.email);
          // Fetch activity insights when Activity tab is active
          if (activeTab === "Activity") {
            fetchActivityInsights(parsedUser.email);
          }
          // Fetch applications and recommended jobs
          fetchApplications(parsedUser.email);
          fetchRecommendedJobs(parsedUser);
          fetchMyAssessments();
          // Sync savedJobIds from localStorage after user loads
          try {
            const key = `savedJobs_${parsedUser.email || parsedUser.name || "user"}`;
            setSavedJobIds(JSON.parse(localStorage.getItem(key) || "[]"));
          } catch {
            /* silent */
          }
        } catch (error) {
          console.error("Error parsing user data:", error);
          // Still try to show popup even if JSON parse fails
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUserProfile();

    // Re-fetch assessments when a new local assessment is saved
    const onAssessmentDone = () => fetchMyAssessments();
    window.addEventListener("zync:assessmentSaved", onAssessmentDone);
    // Sync bookmark state when MyJobs removes a saved job
    const onSavedJobsUpdated = (e: Event) => {
      const { removedId } = (e as CustomEvent).detail;
      setSavedJobIds((prev) => prev.filter((id) => id !== removedId));
    };
    window.addEventListener("zync:savedJobsUpdated", onSavedJobsUpdated);
    return () => {
      window.removeEventListener("zync:assessmentSaved", onAssessmentDone);
      window.removeEventListener("zync:savedJobsUpdated", onSavedJobsUpdated);
    };
  }, []);

  const fetchMyAssessments = async () => {
    // Collect practice assessments saved to localStorage
    const localAssessments = Object.keys(localStorage)
      .filter((k) => k.startsWith("assessment_local-"))
      .map((k) => {
        try {
          return JSON.parse(localStorage.getItem(k) || "");
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort(
        (a: any, b: any) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
      );

    try {
      let token = tokenStorage.getAccess();
      if (!token) {
        setMyAssessments(localAssessments);
        return;
      }
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.exp * 1000 < Date.now()) {
          const refreshToken = tokenStorage.getRefresh();
          if (!refreshToken) {
            setMyAssessments(localAssessments);
            return;
          }
          const res = await apiFetch(
            `${API_ENDPOINTS.BASE_URL}/users/refresh`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken }),
            },
          );
          if (res.ok) {
            const data = await res.json();
            tokenStorage.setAccess(data.accessToken);
            if (data.refreshToken) tokenStorage.setRefresh(data.refreshToken);
            token = data.accessToken;
          } else {
            setMyAssessments(localAssessments);
            return;
          }
        }
      } catch {
        /* use token as-is */
      }
      const response = await apiFetch(
        `${API_ENDPOINTS.BASE_URL}/skill-assessments/my-assessments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const backendList = response.ok ? await response.json() : [];
      // Merge backend + local, dedup by assessmentId
      const merged = [
        ...backendList,
        ...localAssessments.filter(
          (la: any) =>
            !backendList.some((ba: any) => ba.assessmentId === la.assessmentId),
        ),
      ];
      setMyAssessments(merged);
    } catch {
      setMyAssessments(localAssessments);
    }
  };

  const fetchNotifications = async (userId: string) => {
    try {
      // Fetch real applications for notifications
      const appsResponse = await apiFetch(
        `${API_ENDPOINTS.BASE_URL}/applications/candidate/${userId}`,
      );
      if (appsResponse.ok) {
        const apps = await appsResponse.json();
        const appNotifications = apps.slice(0, 5).map((app: any) => ({
          id: app._id,
          type: "application",
          company: app.jobId?.company || "Company",
          title: `Application ${app.status}`,
          message: `Your application for ${app.jobId?.jobTitle || "position"} is ${app.status}`,
          actionText: "View Application",
          time:
            new Date(app.createdAt).toLocaleDateString() ===
            new Date().toLocaleDateString()
              ? `${Math.floor((new Date().getTime() - new Date(app.createdAt).getTime()) / (1000 * 60 * 60))}h ago`
              : `${Math.floor((new Date().getTime() - new Date(app.createdAt).getTime()) / (1000 * 60 * 60 * 24))}d ago`,
          applicationId: app._id,
        }));
        setNotifications(appNotifications);
        // Auto-dismiss tooltip after 5 seconds
        setTimeout(() => setShowNotifTooltip(false), 5000);
      } else {
        // Fallback to job notifications
        const jobsResponse = await apiFetch(`${API_ENDPOINTS.JOBS}?limit=5`);
        if (jobsResponse.ok) {
          const jobs = await jobsResponse.json();
          const jobNotifications = jobs.map((job: any, index: number) => ({
            id: job._id || index,
            type: "job",
            company: job.company || "Company",
            title: `New job: ${job.jobTitle || job.title}`,
            message: `${job.company} is hiring for ${job.jobTitle || job.title} in ${job.location}`,
            actionText: "View Job",
            time:
              new Date(job.createdAt).toLocaleDateString() ===
              new Date().toLocaleDateString()
                ? `${Math.floor(Math.random() * 12) + 1}h ago`
                : `${Math.floor(Math.random() * 7) + 1}d ago`,
            jobId: job._id,
          }));
          setNotifications(jobNotifications);
        } else {
          setNotifications([]);
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    }
  };

  const calculateProfileCompletion = (userData: any) => {
    const checks = [
      { w: 10, ok: () => !!userData.name?.trim() },
      { w: 5, ok: () => !!userData.email?.trim() },
      { w: 5, ok: () => !!userData.phone?.trim() },
      { w: 5, ok: () => !!userData.location?.trim() },
      { w: 5, ok: () => !!userData.gender?.trim() },
      { w: 5, ok: () => !!userData.birthday },
      { w: 10, ok: () => !!userData.profilePhoto?.trim() },
      { w: 10, ok: () => (userData.profileSummary?.trim()?.length ?? 0) > 10 },
      {
        w: 10,
        ok: () => Array.isArray(userData.skills) && userData.skills.length > 0,
      },
      {
        w: 5,
        ok: () =>
          Array.isArray(userData.languages)
            ? userData.languages.length > 0
            : !!userData.languages?.trim?.(),
      },
      {
        w: 10,
        ok: () => {
          const e = userData.educationCollege || userData.education;
          if (!e) return false;
          if (typeof e === "string") return e.trim().length > 0;
          return !!(e.college?.trim() || e.degree?.trim());
        },
      },
      {
        w: 10,
        ok: () => {
          const e = userData.employment;
          if (!e) return false;
          if (Array.isArray(e))
            return (
              e.length > 0 &&
              !!(e[0]?.companyName?.trim() || e[0]?.designation?.trim())
            );
          if (typeof e === "string") return e.trim().length > 0;
          return !!(e.companyName?.trim() || e.designation?.trim());
        },
      },
      {
        w: 5,
        ok: () => {
          const p = userData.projects;
          if (!p) return false;
          if (Array.isArray(p))
            return p.length > 0 && !!p[0]?.projectName?.trim();
          if (typeof p === "string") return p.trim().length > 0;
          return !!p.projectName?.trim();
        },
      },
      { w: 5, ok: () => !!(userData.resume || userData.resumeUrl) },
    ];
    const total = checks.reduce((s, c) => s + c.w, 0);
    const earned = checks.reduce((s, c) => s + (c.ok() ? c.w : 0), 0);
    setCompletionPercentage(Math.round((earned / total) * 100));
  };

  const fetchApplications = async (userEmail: string) => {
    try {
      const response = await apiFetch(
        `${API_ENDPOINTS.BASE_URL}/applications/candidate/${userEmail}`,
      );
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };

  const fetchRecommendedJobs = async (userData: any) => {
    try {
      const userId = userData?.id;
      if (userId) {
        const res = await apiFetch(
          `${API_ENDPOINTS.BASE_URL}/match/recommendations/${userId}?limit=5`,
        );
        if (res.ok) {
          const data = await res.json();
          const matched = Array.isArray(data.jobs) ? data.jobs : [];
          if (matched.length > 0) {
            setRecommendedJobs(
              matched.map((j: any) => ({
                ...j,
                matchScore: j.matchScore || 0,
              })),
            );
            return;
          }
        }
      }
      // Fallback: skill-based filter
      const response = await apiFetch(`${API_ENDPOINTS.JOBS}?limit=50`);
      if (response.ok) {
        const allJobs = await response.json();
        const rawSkills = userData.skills || [];
        const userSkills: string[] = Array.isArray(rawSkills)
          ? rawSkills
              .map((s: any) =>
                (typeof s === "string" ? s : s?.skill || "").toLowerCase(),
              )
              .filter(Boolean)
          : [];
        let filtered = Array.isArray(allJobs) ? allJobs : [];
        if (userSkills.length > 0) {
          const matched = filtered.filter((job: any) => {
            const jobSkills = (job.skills || []).map((s: any) =>
              (typeof s === "string" ? s : s?.skill || "").toLowerCase(),
            );
            return userSkills.some((skill: string) =>
              jobSkills.some(
                (js: string) => js.includes(skill) || skill.includes(js),
              ),
            );
          });
          filtered = matched.length > 0 ? matched : filtered;
        }
        setRecommendedJobs(filtered.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching recommended jobs:", error);
    }
  };

  // Re-run when user skills update from profile load
  useEffect(() => {
    if (user && (user.skills?.length > 0 || user.keySkills?.length > 0)) {
      fetchRecommendedJobs(user);
    }
  }, [JSON.stringify(user?.skills), JSON.stringify(user?.keySkills)]);

  // Sync openToWork and profileFrame from localStorage when toggled externally
  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser((prev: any) =>
            prev
              ? {
                  ...prev,
                  openToWork: parsed.openToWork,
                  profileFrame: parsed.profileFrame,
                  visibilityStatus: parsed.visibilityStatus ?? prev.visibilityStatus,
                  profileVisibility: parsed.profileVisibility ?? prev.profileVisibility,
                }
              : prev,
          );
        }
      } catch {
        /* silent */
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("zync:user-updated", handleStorage as EventListener);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("zync:user-updated", handleStorage as EventListener);
    };
  }, []);

  return (
    <>
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification({ ...notification, isVisible: false })}
      />
      <div className="min-h-screen bg-gray-50 font-['IBM_Plex_Sans']">
        {/* Tab Navigation */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-8 flex-shrink-0">
                <BackButton
                  onClick={() =>
                    onNavigate && onNavigate(readOnly ? "dashboard" : "home")
                  }
                  text={readOnly ? "Back" : "Back to Home"}
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors py-4 font-['IBM_Plex_Sans']"
                />
                {!readOnly && (
                  <>
                    <button
                      onClick={() => {
                        setActiveTab("Profile");
                        setSearchParams({});
                      }}
                      className={`py-4 px-1 border-b-2 font-medium text-xs sm:text-sm font-['IBM_Plex_Sans'] whitespace-nowrap ${
                        activeTab === "Profile"
                          ? "border-black text-gray-900"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      View & Edit
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("Activity");
                        setSearchParams({ tab: "Activity" });
                        if (user && !activityData) {
                          fetchActivityInsights(user.email);
                        }
                      }}
                      className={`py-4 px-1 border-b-2 font-medium text-xs sm:text-sm font-['IBM_Plex_Sans'] whitespace-nowrap ${
                        activeTab === "Activity"
                          ? "border-black text-gray-900"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Activity insights
                    </button>
                  </>
                )}
                {readOnly && (
                  <span className="py-4 px-1 font-medium text-sm text-gray-900 font-['IBM_Plex_Sans']">
                    Candidate Profile
                  </span>
                )}
              </div>
              {!readOnly && (
                <div className="py-2">
                  <CandidateNotificationBell
                    notifications={appNotifications}
                    unreadCount={unreadCount}
                    onMarkRead={markRead}
                    onMarkAllRead={markAllRead}
                    onClearAll={clearAll}
                    onNavigate={onNavigate}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {!readOnly && (
          <div className="fixed top-20 right-4 z-50 hidden">
            <CandidateNotificationBell
              notifications={appNotifications}
              unreadCount={unreadCount}
              onMarkRead={markRead}
              onMarkAllRead={markAllRead}
              onClearAll={clearAll}
              onNavigate={onNavigate}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {activeTab === "Profile" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
              {!readOnly && (
                <div className="lg:col-span-1 order-3 lg:order-1">
                  {/* Quick Actions — styled to match employer dashboard sidebar */}
                  <div
                    className="rounded-xl overflow-hidden shadow-lg mb-4 sm:mb-6"
                    style={{
                      background:
                        "linear-gradient(to bottom, #1e3a8a, #1d4ed8, #1e3a8a)",
                    }}
                  >
                    {/* Header */}
                    <div className="px-6 pt-5 pb-4 border-b border-blue-700">
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-300" />
                        Quick Actions
                      </h3>
                    </div>
                    {/* Profile completion bar */}
                    <div className="px-6 py-4 bg-blue-800/50">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-blue-200 font-semibold tracking-wide">
                          Profile Strength
                        </span>
                        <span className="text-xs font-bold text-white bg-blue-600/60 px-2 py-0.5 rounded-full">
                          {completionPercentage}%
                        </span>
                      </div>
                      <div className="w-full bg-blue-900/70 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all duration-700"
                          style={{
                            width: `${completionPercentage}%`,
                            background:
                              completionPercentage >= 80
                                ? "linear-gradient(to right, #34d399, #10b981)"
                                : completionPercentage >= 50
                                  ? "linear-gradient(to right, #60a5fa, #22d3ee)"
                                  : "linear-gradient(to right, #f59e0b, #fbbf24)",
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-blue-300 mt-1.5">
                        {completionPercentage < 50
                          ? "Add more details to stand out"
                          : completionPercentage < 80
                            ? "Almost there! Keep going"
                            : "Great profile!"}
                      </p>
                    </div>
                    {/* Nav items */}
                    <nav className="py-3 px-3 space-y-1">
                      {(
                        [
                          {
                            key: "job-listings",
                            label: "Browse All Jobs",
                            icon: <Search className="w-5 h-5 flex-shrink-0" />,
                            action: () => onNavigate("job-listings"),
                          },
                          {
                            key: "companies",
                            label: "Company Reviews",
                            icon: <Star className="w-5 h-5 flex-shrink-0" />,
                            action: () => onNavigate("companies"),
                          },
                          {
                            key: "skill-assessment",
                            label: "Take Skill Assessment",
                            icon: (
                              <TrendingUp className="w-5 h-5 flex-shrink-0" />
                            ),
                            action: () => onNavigate("skill-assessment"),
                          },
                          {
                            key: "skill-gap",
                            label: "Skill Gap Analysis",
                            icon: <Search className="w-5 h-5 flex-shrink-0" />,
                            action: () => onNavigate("skill-gap-analysis"),
                          },
                          {
                            key: "career-roadmap",
                            label: "Career Roadmap",
                            icon: (
                              <TrendingUp className="w-5 h-5 flex-shrink-0" />
                            ),
                            action: () => onNavigate("career-roadmap"),
                          },
                          {
                            key: "salary-insights",
                            label: "Salary Insights",
                            icon: (
                              <svg
                                className="w-5 h-5 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            ),
                            action: () => onNavigate("salary-insights"),
                          },
                          {
                            key: "job-matches",
                            label: "AI Job Matches",
                            icon: (
                              <svg
                                className="w-5 h-5 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            ),
                            action: () => onNavigate("job-matches"),
                          },
                          {
                            key: "my-applications",
                            label: "My Applications",
                            icon: (
                              <FileText className="w-5 h-5 flex-shrink-0" />
                            ),
                            action: () => onNavigate("my-applications"),
                            badge: applications.length || null,
                          },
                          {
                            key: "interviews",
                            label: "My Interviews",
                            icon: (
                              <svg
                                className="w-5 h-5 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            ),
                            action: () => onNavigate("interviews"),
                          },
                          {
                            key: "messages",
                            label: "Messages",
                            icon: (
                              <svg
                                className="w-5 h-5 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                              </svg>
                            ),
                            action: () => onNavigate("candidate-messages"),
                          },
                          {
                            key: "settings",
                            label: "Settings",
                            icon: <Edit className="w-5 h-5 flex-shrink-0" />,
                            action: () => onNavigate("settings"),
                          },
                        ] as {
                          key: string;
                          label: string;
                          icon: React.ReactNode;
                          action: () => void;
                          badge?: number | null;
                        }[]
                      ).map((item) => {
                        const isActive = activeQuickAction === item.key;
                        return (
                          <button
                            key={item.key}
                            onClick={() => {
                              setActiveQuickAction(item.key);
                              item.action();
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left font-medium transition-all duration-200 ${
                              isActive
                                ? "bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-lg shadow-blue-400/40"
                                : "text-white hover:bg-blue-700/60"
                            }`}
                            style={{ fontSize: "15px" }}
                          >
                            <span
                              className={`flex-shrink-0 ${isActive ? "text-white" : "text-blue-200"}`}
                            >
                              {item.icon}
                            </span>
                            <span
                              className={`flex-1 leading-tight ${isActive ? "font-semibold" : "font-medium"}`}
                            >
                              {item.label}
                            </span>
                            {item.badge ? (
                              <span
                                className="flex-shrink-0 min-w-[22px] h-[22px] px-1 rounded-full font-bold flex items-center justify-center bg-emerald-400 text-slate-900"
                                style={{ fontSize: "11px" }}
                              >
                                {item.badge}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}

                      {/* LinkedIn Import — full-width row matching other items */}
                      {!user?.linkedInImported && (
                        <div className="border-t border-blue-700/60 mt-1 pt-1">
                          <LinkedInConnect
                            mode="modal"
                            className="w-full px-3 py-3 rounded-lg border border-white/30 text-white bg-transparent font-medium text-[15px] hover:bg-blue-700/60"
                            onImport={async (profile: LinkedInProfile) => {
                              // Resolve email — user may be null if page just loaded after OAuth redirect
                              const resolvedEmail =
                                user?.email ||
                                (() => {
                                  try {
                                    return JSON.parse(
                                      localStorage.getItem("user") || "{}",
                                    ).email;
                                  } catch {
                                    return "";
                                  }
                                })();
                              const currentUser =
                                user ||
                                (() => {
                                  try {
                                    return JSON.parse(
                                      localStorage.getItem("user") || "{}",
                                    );
                                  } catch {
                                    return {};
                                  }
                                })();
                              const merged = {
                                ...currentUser,
                                name: profile.name || currentUser?.name,
                                location:
                                  profile.location || currentUser?.location,
                                profileSummary:
                                  profile.summary ||
                                  currentUser?.profileSummary,
                                profilePhoto:
                                  profile.profilePhoto ||
                                  currentUser?.profilePhoto,
                                skills:
                                  profile.skills.length > 0
                                    ? profile.skills
                                    : currentUser?.skills || [],
                                ...(profile.experience.length > 0
                                  ? {
                                      employment: profile.experience.map(
                                        (exp) => ({
                                          companyName: exp.company,
                                          designation: exp.title,
                                          description: exp.description,
                                          currentlyWorking: exp.current,
                                          startYear:
                                            exp.startDate?.match(
                                              /\d{4}/,
                                            )?.[0] || "",
                                          endYear:
                                            exp.endDate?.match(/\d{4}/)?.[0] ||
                                            "",
                                        }),
                                      ),
                                    }
                                  : {}),
                                ...(profile.education.length > 0
                                  ? {
                                      educationCollege: {
                                        college: profile.education[0].school,
                                        degree: profile.education[0].degree,
                                        passingYear:
                                          profile.education[0].endYear || "",
                                      },
                                    }
                                  : {}),
                                linkedInImported: true,
                              };
                              setUser(merged);
                              localStorage.setItem(
                                "user",
                                JSON.stringify(merged),
                              );
                              calculateProfileCompletion(merged);
                              // Use LinkedIn token if available (set during OAuth callback)
                              const linkedinToken =
                                sessionStorage.getItem("linkedin_token");
                              const saveHeaders: Record<string, string> = {
                                "Content-Type": "application/json",
                              };
                              if (linkedinToken)
                                saveHeaders["Authorization"] =
                                  `Bearer ${linkedinToken}`;
                              try {
                                await apiFetch(
                                  `${API_ENDPOINTS.BASE_URL}/profile/save`,
                                  {
                                    method: "POST",
                                    headers: saveHeaders,
                                    body: JSON.stringify({
                                      email: resolvedEmail,
                                      ...merged,
                                    }),
                                  },
                                );
                                sessionStorage.removeItem("linkedin_token");
                              } catch {
                                /* silent */
                              }
                              setNotification({
                                type: "success",
                                message:
                                  "LinkedIn profile imported successfully!",
                                isVisible: true,
                              });
                            }}
                          />
                        </div>
                      )}
                      {user?.linkedInImported && (
                        <div className="flex items-center gap-3 px-3 py-3 text-sm text-green-300 font-medium border-t border-blue-700/60 mt-2">
                          <svg
                            className="w-5 h-5 flex-shrink-0"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                          LinkedIn connected
                        </div>
                      )}
                    </nav>
                  </div>

                  {/* Profile Visibility */}
                  <div className="mb-6">
                    <ProfileVisibilityToggle
                      userEmail={user?.email || ""}
                      compact={true}
                      onSave={(data) => {
                        const updatedUser = { ...user, ...data };
                        setUser(updatedUser);
                        localStorage.setItem(
                          "user",
                          JSON.stringify(updatedUser),
                        );
                      }}
                    />
                  </div>

                  {/* Stats between Quick Actions and Followed Companies */}
                  <div className="grid grid-cols-3 gap-2 mb-4 sm:mb-6">
                    {[
                      {
                        label: "Applications",
                        value: applications.length,
                        bg: "bg-blue-600",
                        onClick: () => onNavigate("my-applications"),
                      },
                      {
                        label: "Shortlisted",
                        value: applications.filter(
                          (a: any) => a.status === "shortlisted",
                        ).length,
                        bg: "bg-green-600",
                        onClick: () => onNavigate("my-applications"),
                      },
                      {
                        label: "Interviews",
                        value: applications.filter((a: any) =>
                          ["reviewed", "hired", "shortlisted"].includes(
                            a.status,
                          ),
                        ).length,
                        bg: "bg-orange-500",
                        onClick: () => onNavigate("interviews"),
                      },
                    ].map((stat) => (
                      <button
                        key={stat.label}
                        onClick={stat.onClick}
                        className={`${stat.bg} text-white rounded-xl p-2 sm:p-3 text-center hover:opacity-90 transition-opacity`}
                      >
                        <div className="text-lg sm:text-xl font-bold">
                          {stat.value}
                        </div>
                        <div className="text-[10px] sm:text-xs font-medium opacity-90 leading-tight mt-0.5">
                          {stat.label}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Followed Companies Section */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Followed Companies
                    </h3>
                    {(() => {
                      const followKey = `followedCompanies_${user?.email || "guest"}`;
                      const followed: string[] = JSON.parse(
                        localStorage.getItem(followKey) || "[]",
                      );
                      if (followed.length === 0)
                        return (
                          <div className="text-center py-3">
                            <p className="text-sm text-gray-500 mb-2">
                              No companies followed yet
                            </p>
                            <button
                              onClick={() => onNavigate("companies")}
                              className="text-blue-600 text-sm hover:underline"
                            >
                              Browse Companies
                            </button>
                          </div>
                        );
                      return (
                        <div className="space-y-2">
                          {followed.map((name, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                            >
                              <span className="text-sm font-medium text-gray-800 truncate">
                                {name}
                              </span>
                              <button
                                onClick={() => {
                                  const updated = followed.filter(
                                    (_, idx) => idx !== i,
                                  );
                                  localStorage.setItem(
                                    followKey,
                                    JSON.stringify(updated),
                                  );
                                  window.location.reload();
                                }}
                                className="text-xs text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                              >
                                Unfollow
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => onNavigate("companies")}
                            className="text-xs text-blue-600 hover:underline mt-1"
                          >
                            Browse more companies
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Skill Assessments Section */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Skill Assessments
                    </h3>
                    <div className="space-y-4">
                      <div className="text-center py-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <TrendingUp className="w-8 h-8 text-blue-600" />
                        </div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Take New Assessment
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Test your skills and showcase your expertise
                        </p>
                        <button
                          onClick={() => onNavigate("skill-assessment")}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Start Assessment
                        </button>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">
                            My Assessments
                          </h4>
                          {myAssessments.length > 3 && (
                            <button
                              onClick={() => onNavigate("skill-assessment")}
                              className="text-xs text-blue-600 font-medium hover:underline"
                            >
                              View More ({myAssessments.length})
                            </button>
                          )}
                        </div>
                        {myAssessments.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            No assessments completed yet
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {myAssessments
                              .slice(0, 3)
                              .map((a: any, i: number) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">
                                      {a.skill}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {a.completedAt &&
                                      new Date(a.completedAt).getFullYear() >
                                        1970
                                        ? new Date(
                                            a.completedAt,
                                          ).toLocaleDateString("en-US", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                          })
                                        : "Date unavailable"}
                                    </p>
                                  </div>
                                  <span
                                    className={`text-sm font-bold ${a.score >= 70 ? "text-green-600" : "text-orange-500"}`}
                                  >
                                    {a.score}%
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Job Recommendations */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {user?.skills?.length > 0 ? 'AI Job Suggestions' : 'Latest Jobs'}
                      </h3>
                      {recommendedJobs.length > 3 && (
                        <button
                          onClick={() => onNavigate("job-listings")}
                          className="text-xs text-blue-600 font-medium hover:underline"
                        >
                          View More ({recommendedJobs.length})
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {recommendedJobs.length > 0 ? (
                        recommendedJobs.slice(0, 3).map((job, index) => {
                          const jobId = job._id || job.id;
                          const userSkills: string[] = (
                            Array.isArray(user?.skills) ? user.skills : []
                          ).map((s: any) => String(s || "").toLowerCase());
                          const jobSkills: string[] = (
                            Array.isArray(job.skills) ? job.skills : []
                          ).map((s: any) => String(s || "").toLowerCase());
                          const matchCount = jobSkills.filter((js) =>
                            userSkills.some(
                              (us) => us.includes(js) || js.includes(us),
                            ),
                          ).length;
                          const matchPct =
                            job.matchScore ||
                            (jobSkills.length > 0
                              ? Math.round(
                                  (matchCount / jobSkills.length) * 100,
                                )
                              : 0);
                          const isSaved = savedJobIds.includes(jobId);
                          return (
                            <div
                              key={jobId || index}
                              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm bg-white transition-all"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-gray-900 text-sm">
                                  {job.jobTitle || job.title}
                                </h4>
                                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                  {matchPct > 0 && (
                                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                      {matchPct}% Match
                                    </span>
                                  )}
                                  <button
                                    onClick={async () => {
                                      const userEmail =
                                        user?.email || user?.name || "user";
                                      const idsKey = `savedJobs_${userEmail}`;
                                      const detailsKey = `savedJobDetails_${userEmail}`;
                                      const savedIds: string[] = (() => {
                                        try {
                                          return JSON.parse(
                                            localStorage.getItem(idsKey) ||
                                              "[]",
                                          );
                                        } catch {
                                          return [];
                                        }
                                      })();
                                      const savedDetails: any[] = (() => {
                                        try {
                                          return JSON.parse(
                                            localStorage.getItem(detailsKey) ||
                                              "[]",
                                          );
                                        } catch {
                                          return [];
                                        }
                                      })();
                                      const isAlreadySaved =
                                        savedIds.includes(jobId);
                                      if (isAlreadySaved) {
                                        const confirmed = await (window as any).confirmAsync(
                                          'Remove this job from your saved list?'
                                        );
                                        if (!confirmed) return;
                                        const updatedIds = savedIds.filter(
                                          (id) => id !== jobId,
                                        );
                                        const updatedDetails =
                                          savedDetails.filter(
                                            (j: any) =>
                                              (j._id || j.id) !== jobId,
                                          );
                                        localStorage.setItem(
                                          idsKey,
                                          JSON.stringify(updatedIds),
                                        );
                                        localStorage.setItem(
                                          detailsKey,
                                          JSON.stringify(updatedDetails),
                                        );
                                        setSavedJobIds(updatedIds);
                                        setNotification({
                                          type: "info",
                                          message:
                                            "Job removed from saved list",
                                          isVisible: true,
                                        });
                                      } else {
                                        const updatedIds = [...savedIds, jobId];
                                        const updatedDetails = [
                                          ...savedDetails.filter(
                                            (j: any) =>
                                              (j._id || j.id) !== jobId,
                                          ),
                                          job,
                                        ];
                                        localStorage.setItem(
                                          idsKey,
                                          JSON.stringify(updatedIds),
                                        );
                                        localStorage.setItem(
                                          detailsKey,
                                          JSON.stringify(updatedDetails),
                                        );
                                        setSavedJobIds(updatedIds);
                                        setNotification({
                                          type: "success",
                                          message:
                                            "Job saved! View in My Jobs → Saved",
                                          isVisible: true,
                                        });
                                      }
                                    }}
                                    className={`p-1 rounded transition-colors ${isSaved ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                                    title={
                                      isSaved ? "Remove from saved" : "Save job"
                                    }
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill={isSaved ? "currentColor" : "none"}
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 mb-2">
                                {job.company}
                                {job.location ? ` · ${job.location}` : ""}
                              </p>
                              {job.salary &&
                                (() => {
                                  const salaryText =
                                    typeof job.salary === "object"
                                      ? job.salary.min || job.salary.max
                                        ? `₹${job.salary.min || ""} - ₹${job.salary.max || ""}`
                                        : null
                                      : job.salary;
                                  return salaryText ? (
                                    <p className="flex items-center gap-1 text-xs text-green-600 font-medium mb-2">
                                      <svg
                                        className="w-3 h-3 flex-shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                        />
                                      </svg>
                                      {salaryText}
                                    </p>
                                  ) : null;
                                })()}
                              {Array.isArray(job.skills) &&
                                job.skills.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {job.skills
                                      .slice(0, 3)
                                      .map((skill: string, idx: number) => (
                                        <span
                                          key={idx}
                                          className={`text-xs px-2 py-0.5 rounded ${
                                            userSkills.some(
                                              (us) =>
                                                us.includes(
                                                  String(skill).toLowerCase(),
                                                ) ||
                                                String(skill)
                                                  .toLowerCase()
                                                  .includes(us),
                                            )
                                              ? "bg-green-100 text-green-800"
                                              : "bg-blue-100 text-blue-800"
                                          }`}
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                  </div>
                                )}
                              <div className="flex justify-end pt-1.5 border-t border-gray-100">
                                <button
                                  onClick={() => {
                                    if (!jobId) return;
                                    localStorage.setItem(
                                      "selectedJob",
                                      JSON.stringify(job),
                                    );
                                    onNavigate(`job-detail/${jobId}`);
                                  }}
                                  className="text-xs text-blue-600 font-medium hover:text-blue-800"
                                >
                                  Apply Now
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          <p>
                            Complete your profile to get personalized job
                            recommendations
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 text-sm">
                          Recent Applications
                        </h4>
                        {applications.length > 3 && (
                          <button
                            onClick={() => onNavigate("my-applications")}
                            className="text-xs text-blue-600 font-medium hover:underline"
                          >
                            View More ({applications.length})
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {applications.length > 0 ? (
                          applications.slice(0, 3).map((app, index) => (
                            <div
                              key={app._id || index}
                              className="border border-gray-200 rounded-lg p-3 hover:shadow-sm hover:border-gray-300 transition-all bg-white"
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="min-w-0 flex-1">
                                  <h5 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                                    {app.jobId?.jobTitle || "Job Position"}
                                  </h5>
                                  <p className="text-xs text-gray-500 truncate mt-0.5">
                                    {app.jobId?.company || "Company"}
                                  </p>
                                </div>
                                <span
                                  className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                                    app.status === "applied"
                                      ? "bg-blue-100 text-blue-700"
                                      : app.status === "reviewed"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : app.status === "shortlisted"
                                          ? "bg-green-100 text-green-700"
                                          : app.status === "rejected"
                                            ? "bg-red-100 text-red-700"
                                            : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {app.status.charAt(0).toUpperCase() +
                                    app.status.slice(1)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                  <svg
                                    className="w-3 h-3 flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                  </svg>
                                  {app.jobId?.location || "Remote"}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                                  <svg
                                    className="w-3 h-3 flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                  </svg>
                                  {app.jobId?.salary
                                    ? typeof app.jobId.salary === "object"
                                      ? app.jobId.salary.min ||
                                        app.jobId.salary.max
                                        ? `₹${app.jobId.salary.min || ""}-₹${app.jobId.salary.max || ""}`
                                        : "Competitive"
                                      : app.jobId.salary
                                    : "Competitive"}
                                </span>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <p className="text-xs text-gray-400">
                                  {new Date(app.createdAt).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const jobId =
                                      app.jobId?._id ||
                                      app.jobId?.id ||
                                      (typeof app.jobId === "string"
                                        ? app.jobId
                                        : null);
                                    if (jobId) {
                                      localStorage.setItem(
                                        "selectedJob",
                                        JSON.stringify(app.jobId),
                                      );
                                      onNavigate("job-detail/" + jobId);
                                    } else {
                                      onNavigate("my-applications");
                                    }
                                  }}
                                  className="text-xs text-blue-600 font-medium hover:text-blue-800"
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <p className="text-gray-700 font-medium text-sm mb-2">
                              No applications yet
                            </p>
                            <p className="text-gray-500 text-xs mb-3">
                              Start applying to jobs and track them here
                            </p>
                            <button
                              onClick={() => onNavigate("job-listings")}
                              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                            >
                              Browse Jobs
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Content Area */}
              <div className="lg:col-span-3 order-1 lg:order-2">
                {/* Profile Header Card — LinkedIn style with cover */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 sm:mb-6 overflow-hidden">
                  {/* Cover Photo */}
                  <div className="relative h-32 sm:h-40 lg:h-52 bg-gradient-to-r from-slate-400 via-slate-300 to-slate-200 group">
                    {user?.coverPhoto ? (
                      <img
                        src={user.coverPhoto}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                    {/* Cover upload + remove buttons */}
                    {!readOnly && (
                      <React.Fragment><div className="absolute top-3 right-3 flex gap-2">
                        <label
                          className="bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full cursor-pointer shadow transition-all"
                          title="Change cover photo"
                        >
                          <svg
                            className="w-4 h-4 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
                              if (!allowedTypes.includes(file.type)) {
                                window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Only JPG, JPEG, PNG, and WEBP files are allowed." } }));
                                e.target.value = "";
                                return;
                              }
                              if (file.size > 5 * 1024 * 1024) {
                                window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "File size exceeds the maximum limit of 5 MB." } }));
                                e.target.value = "";
                                return;
                              }
                              const src = URL.createObjectURL(file);
                              setCoverCropModal({ src, file });
                              e.target.value = "";
                            }}
                          />
                        </label>
                        {user?.coverPhoto && (
                          <button
                            title="Remove cover photo"
                            className="bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow transition-all"
                            onClick={() => showConfirm(
                              'Remove Cover Photo',
                              'Are you sure you want to remove your cover photo?',
                              async () => {
                                const updatedUser = { ...user, coverPhoto: "" };
                                setUser(updatedUser);
                                localStorage.setItem("user", JSON.stringify(updatedUser));
                                await apiFetch(`${API_ENDPOINTS.BASE_URL}/profile/save`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ email: user?.email, coverPhoto: "" }),
                                });
                                setNotification({ type: "success", message: "Cover photo removed!", isVisible: true });
                              }
                            )}
                          >
                            <X className="w-4 h-4 text-gray-600" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 text-right">Supported formats: JPG, JPEG, PNG, WEBP &mdash; Max 5 MB</p>
                      </React.Fragment>
                    )}
                  </div>

                  {/* Profile photo overlapping cover */}
                  <div className="px-6 pb-6">
                    <div className="flex items-end justify-between -mt-14 mb-4">
                      {/* Profile photo */}
                      <div className="relative flex-shrink-0">
                        {(() => {
                          const frameColor =
                            user?.profileFrame === "blue"
                              ? "#0A66C2"
                              : user?.profileFrame === "green"
                                ? "#057642"
                                : user?.profileFrame === "purple"
                                  ? "#7C3AED"
                                  : user?.profileFrame === "gold"
                                    ? "#F59E0B"
                                    : user?.openToWork
                                      ? "#22c55e"
                                      : null;
                          return (
                            <div
                              className="w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden cursor-pointer bg-white"
                              style={{
                                border: frameColor
                                  ? `4px solid ${frameColor}`
                                  : "4px solid white",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                              }}
                              onClick={() =>
                                !readOnly && setShowPhotoEditor(true)
                              }
                            >
                              {user?.profilePhoto ? (
                                <img
                                  src={user.profilePhoto}
                                  alt="Profile"
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-white font-semibold text-sm hover:bg-gray-400 transition-colors">
                                  {!readOnly
                                    ? "Add photo"
                                    : user?.name?.charAt(0) || "?"}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                        {user?.openToWork && (
                          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow">
                            #OpenToWork
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Profile Info */}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h1 className="text-2xl font-semibold text-gray-900">
                            {user?.name || user?.fullName || "Add your name"}
                          </h1>
                          <Edit
                            onClick={() => {
                              setActiveModal("personalDetails");
                              setModalData({
                                name: user?.name || "",
                                gender: user?.gender || "",
                                birthday: user?.birthday || "",
                                location: user?.location || "",
                                phone: user?.phone || "",
                              });
                            }}
                            className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-600"
                          />
                        </div>
                        <p className="text-gray-600 mb-1">
                          {user?.title ||
                            user?.jobTitle ||
                            "Add your job title"}
                        </p>

                        {user?.educationCollege?.college && (
                          <p className="text-gray-500 text-sm mb-3">
                            {user.educationCollege.degree
                              ? `${user.educationCollege.degree}  `
                              : ""}
                            {user.educationCollege.college}
                          </p>
                        )}

                        {/* Contact Info */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-gray-600 mb-3">
                          <button
                            onClick={() => {
                              setActiveModal("personalDetails");
                              setModalData({
                                name: user?.name || "",
                                gender: user?.gender || "",
                                birthday: user?.birthday || "",
                                location: user?.location || "",
                                phone: user?.phone || "",
                                jobTitle: user?.jobTitle || "",
                                education: user?.education || "",
                              });
                            }}
                            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            <span>{user?.location || "Add Location"}</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveModal("personalDetails");
                              setModalData({
                                name: user?.name || "",
                                gender: user?.gender || "",
                                birthday: user?.birthday || "",
                                location: user?.location || "",
                                phone: user?.phone || "",
                                jobTitle: user?.jobTitle || "",
                                education: user?.education || "",
                              });
                            }}
                            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                              />
                            </svg>
                            <span>{user?.phone || "Add Phone"}</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveModal("personalDetails");
                              setModalData({
                                name: user?.name || "",
                                gender: user?.gender || "",
                                birthday: user?.birthday || "",
                                location: user?.location || "",
                                phone: user?.phone || "",
                                jobTitle: user?.jobTitle || "",
                                education: user?.education || "",
                              });
                            }}
                            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            <span>{user?.email || "Add Email"}</span>
                          </button>
                        </div>
                        {/* Action Links */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm">
                          <button
                            onClick={() => {
                              setActiveModal("personalDetails");
                              setModalData({
                                name: user?.name || "",
                                gender: user?.gender || "",
                                birthday: user?.birthday || "",
                                location: user?.location || "",
                                phone: user?.phone || "",
                                jobTitle: user?.jobTitle || "",
                                education: user?.education || "",
                              });
                            }}
                            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            <span>{user?.gender || "Add Gender"}</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveModal("personalDetails");
                              setModalData({
                                name: user?.name || "",
                                gender: user?.gender || "",
                                birthday: user?.birthday || "",
                                location: user?.location || "",
                                phone: user?.phone || "",
                                jobTitle: user?.jobTitle || "",
                                education: user?.education || "",
                              });
                            }}
                            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                          >
                            <svg
                              className="w-4 h-4"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM5 7V5h14v2H5zm2 4h10v2H7zm0 4h10v2H7z" />
                            </svg>
                            <span>
                              {user?.birthday
                                ? new Date(user.birthday).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )
                                : "Add birthday"}
                            </span>
                          </button>
                        </div>
                      </div>
                      {!readOnly && (
                        <div className="flex-shrink-0 mt-2 sm:mt-0">
                          <button
                            onClick={() => {
                              setResumePopupFile(null);
                              setResumePopupError("");
                              setShowResumePopup(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-full shadow hover:from-blue-700 hover:to-indigo-700 transition-all"
                          >
                            <Sparkles className="w-4 h-4" />
                            Import Resume
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Your career preferences */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Your career preferences
                    </h2>
                    <button
                      onClick={() => {
                        setActiveModal("careerPreferences");
                        setModalData(user?.careerPreferences || {});
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Add
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">
                        Preferred job type
                      </p>
                      {user?.careerPreferences?.lookingFor &&
                      user.careerPreferences.lookingFor.length > 0 ? (
                        <p className="text-gray-900">
                          {user.careerPreferences.lookingFor.join(", ")}
                        </p>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveModal("careerPreferences");
                            setModalData(user?.careerPreferences || {});
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Add desired job type
                        </button>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm mb-1">
                        Availability to work
                      </p>
                      {user?.careerPreferences?.availability ? (
                        <p className="text-gray-900">
                          {user.careerPreferences.availability}
                        </p>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveModal("careerPreferences");
                            setModalData(user?.careerPreferences || {});
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Add work availability
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1">
                      Preferred location
                    </p>
                    {user?.careerPreferences?.locations?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user.careerPreferences.locations.map(
                          (loc: string, i: number) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full"
                            >
                              {loc}
                            </span>
                          ),
                        )}
                      </div>
                    ) : user?.careerPreferences?.location ? (
                      <p className="text-gray-900">
                        {user.careerPreferences.location}
                      </p>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveModal("careerPreferences");
                          setModalData(user?.careerPreferences || {});
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Add preferred location
                      </button>
                    )}
                  </div>
                </div>

                {/* Education Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Education
                    </h2>
                    <button
                      onClick={() => {
                        setActiveModal("educationCollege");
                        setModalData(user?.educationCollege || {});
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {user?.educationCollege &&
                      typeof user.educationCollege === "object" &&
                      user.educationCollege.degree
                        ? "Edit"
                        : "Add"}
                    </button>
                  </div>
                  <div className="space-y-4">
                    {user?.educationCollege &&
                    typeof user.educationCollege === "object" &&
                    user.educationCollege.degree ? (
                      <div className="border-b border-gray-100 pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {user.educationCollege.degree} from{" "}
                              {user.educationCollege.college}
                            </h3>
                            <p className="text-gray-500 text-sm">
                              {user.educationCollege.courseType}{" "}
                              {user.educationCollege.percentage} Graduated in{" "}
                              {user.educationCollege.passingYear}
                            </p>
                          </div>
                          <Edit
                            onClick={() => {
                              setActiveModal("educationCollege");
                              setModalData(user?.educationCollege || {});
                            }}
                            className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-600"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-gray-500 text-sm">
                        <p>No education details added yet</p>
                      </div>
                    )}
                    {user?.educationClass12 &&
                    typeof user.educationClass12 === "object" &&
                    user.educationClass12.board ? (
                      <div className="border-b border-gray-100 pb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-gray-700 font-medium">
                              Class XII - {user.educationClass12.board}
                            </p>
                            <p className="text-gray-500 text-sm">
                              {user.educationClass12.percentage}%{" "}
                              {user.educationClass12.medium} Medium Passed in{" "}
                              {user.educationClass12.passingYear}
                            </p>
                          </div>
                          <Edit
                            onClick={() => {
                              setActiveModal("educationClass12");
                              setModalData(user?.educationClass12 || {});
                            }}
                            className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-600"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="border-b border-gray-100 pb-4">
                        <button
                          onClick={() => {
                            setActiveModal("educationClass12");
                            setModalData({});
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Add Class XII Details
                        </button>
                      </div>
                    )}
                    {user?.educationClass10 &&
                    typeof user.educationClass10 === "object" &&
                    user.educationClass10.board ? (
                      <div className="border-b border-gray-100 pb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-gray-700 font-medium">
                              Class X - {user.educationClass10.board}
                            </p>
                            <p className="text-gray-500 text-sm">
                              {user.educationClass10.percentage}%{" "}
                              {user.educationClass10.medium} Medium Passed in{" "}
                              {user.educationClass10.passingYear}
                            </p>
                          </div>
                          <Edit
                            onClick={() => {
                              setActiveModal("educationClass10");
                              setModalData(user?.educationClass10 || {});
                            }}
                            className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-600"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <button
                          onClick={() => {
                            setActiveModal("educationClass10");
                            setModalData({});
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Add Class X Details
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Skills Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                      <span>Key skills</span>
                      <Edit
                        onClick={() => {
                          setActiveModal("skills");
                          setModalData(user?.skills || []);
                        }}
                        className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-600"
                      />
                    </h2>
                  </div>
                  {user?.skills && user.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      Add your key skills to help recruiters find you
                    </p>
                  )}
                </div>

                {/* Languages Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Languages
                    </h2>
                    <button
                      onClick={() => {
                        setActiveModal("languages");
                        setModalData(user?.languages || "");
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {user?.languages && user.languages.length > 0
                        ? "Edit"
                        : "Add"}
                    </button>
                  </div>
                  {user?.languages && user.languages.length > 0 ? (
                    <p className="text-gray-700">
                      {Array.isArray(user.languages)
                        ? user.languages.join(", ")
                        : user.languages}
                    </p>
                  ) : (
                    <p className="text-gray-500">
                      Talk about the languages that you can speak, read or write
                    </p>
                  )}
                </div>

                {/* Profile Summary Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Profile Summary
                    </h2>
                    <button
                      onClick={() => {
                        setActiveModal("profileSummary");
                        setModalData(user?.profileSummary || "");
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {user?.profileSummary && user.profileSummary.trim()
                        ? "Edit"
                        : "Add"}
                    </button>
                  </div>
                  {user?.profileSummary && user.profileSummary.trim() ? (
                    <p
                      className="text-gray-700 break-words"
                      style={{ overflowWrap: "anywhere" }}
                    >
                      {user.profileSummary}
                    </p>
                  ) : (
                    <p className="text-gray-500">
                      Your Profile Summary should mention the highlights of your
                      career and education, what your professional interests
                      are, and what kind of a career you are looking for. Write
                      a meaningful summary of more than 50 characters.
                    </p>
                  )}
                </div>

                {/* Employment Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Employment
                    </h2>
                    <button
                      onClick={() => {
                        setActiveModal("employment");
                        setModalData({});
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Add
                    </button>
                  </div>
                  {(() => {
                    const empList: any[] = Array.isArray(user?.employment)
                      ? user.employment
                      : user?.employment &&
                          typeof user.employment === "object" &&
                          user.employment.companyName
                        ? [user.employment]
                        : [];
                    return empList.length > 0 ? (
                      <div className="space-y-4">
                        {empList.map((emp: any, idx: number) => (
                          <div
                            key={idx}
                            className="border-b border-gray-100 pb-4 last:border-0"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {emp.designation} at {emp.companyName}
                                </h3>
                                <p className="text-gray-500 text-sm">
                                  {emp.startMonth} {emp.startYear} -{" "}
                                  {emp.currentlyWorking
                                    ? "Present"
                                    : `${emp.endMonth} ${emp.endYear}`}
                                  {emp.experienceYears || emp.experienceMonths
                                    ? `  ${emp.experienceYears || 0} years ${emp.experienceMonths || 0} months`
                                    : ""}
                                </p>
                                <p
                                  className="text-gray-700 text-sm mt-1 break-words"
                                  style={{ overflowWrap: "anywhere" }}
                                >
                                  {emp.description}
                                </p>
                              </div>
                              <div className="flex gap-2 ml-2">
                                <Edit
                                  onClick={() => {
                                    setActiveModal("employment");
                                    setModalData({ ...emp, _editIndex: idx });
                                  }}
                                  className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-600"
                                />
                                <button
                                  onClick={async () => {
                                    const updated = empList.filter(
                                      (_, i) => i !== idx,
                                    );
                                    const updatedUser = {
                                      ...user,
                                      employment: updated,
                                    };
                                    setUser(updatedUser);
                                    localStorage.setItem(
                                      "user",
                                      JSON.stringify(updatedUser),
                                    );
                                    await apiFetch(
                                      `${API_ENDPOINTS.BASE_URL}/profile/save`,
                                      {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          email: user?.email,
                                          employment: updated,
                                        }),
                                      },
                                    );
                                  }}
                                  className="text-red-400 hover:text-red-600 text-xs"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        Talk about the company you worked at, your designation
                        and describe what all you did there
                      </p>
                    );
                  })()}
                </div>

                {/* Projects Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Projects
                    </h2>
                    <button
                      onClick={() => {
                        setActiveModal("projects");
                        setModalData({});
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Add
                    </button>
                  </div>
                  {(() => {
                    const list: any[] = Array.isArray(user?.projects)
                      ? user.projects
                      : user?.projects &&
                          typeof user.projects === "object" &&
                          user.projects.projectName
                        ? [user.projects]
                        : [];
                    return list.length > 0 ? (
                      <div className="space-y-4">
                        {list.map((proj: any, idx: number) => (
                          <div
                            key={idx}
                            className="border-b border-gray-100 pb-4 last:border-0"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">
                                  {proj.projectName}
                                </h3>
                                <p
                                  className="text-gray-700 text-sm mb-1 break-words"
                                  style={{ overflowWrap: "anywhere" }}
                                >
                                  {proj.description}
                                </p>
                                {proj.skills && (
                                  <p
                                    className="text-gray-600 text-sm break-words"
                                    style={{ overflowWrap: "anywhere" }}
                                  >
                                    <span className="font-medium">Skills:</span>{" "}
                                    {proj.skills}
                                  </p>
                                )}
                                {proj.projectUrl && (
                                  <a
                                    href={proj.projectUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm break-all"
                                  >
                                    {proj.projectUrl}
                                  </a>
                                )}
                              </div>
                              <div className="flex gap-2 ml-2">
                                <Edit
                                  onClick={() => {
                                    setActiveModal("projects");
                                    setModalData({ ...proj, _editIndex: idx });
                                  }}
                                  className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-600"
                                />
                                <button
                                  onClick={async () => {
                                    const updated = list.filter(
                                      (_, i) => i !== idx,
                                    );
                                    const updatedUser = {
                                      ...user,
                                      projects: updated,
                                    };
                                    setUser(updatedUser);
                                    localStorage.setItem(
                                      "user",
                                      JSON.stringify(updatedUser),
                                    );
                                    await apiFetch(
                                      `${API_ENDPOINTS.BASE_URL}/profile/save`,
                                      {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          email: user?.email,
                                          projects: updated,
                                        }),
                                      },
                                    );
                                  }}
                                  className="text-red-400 hover:text-red-600 text-xs"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        Talk about your projects that made you proud and
                        contributed to your learnings
                      </p>
                    );
                  })()}
                </div>

                {/* Internships Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Internships
                    </h2>
                    <button
                      onClick={() => {
                        setActiveModal("internships");
                        setModalData({});
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Add
                    </button>
                  </div>
                  {(() => {
                    const list: any[] = Array.isArray(user?.internships)
                      ? user.internships
                      : user?.internships &&
                          typeof user.internships === "object" &&
                          user.internships.companyName
                        ? [user.internships]
                        : [];
                    return list.length > 0 ? (
                      <div className="space-y-4">
                        {list.map((intern: any, idx: number) => (
                          <div
                            key={idx}
                            className="border-b border-gray-100 pb-4 last:border-0"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">
                                  {intern.companyName}
                                </h3>
                                <p className="text-gray-500 text-sm mb-1">
                                  {intern.startMonth} {intern.startYear} -{" "}
                                  {intern.endMonth} {intern.endYear}
                                </p>
                                <p
                                  className="text-gray-700 text-sm mb-1 break-words"
                                  style={{ overflowWrap: "anywhere" }}
                                >
                                  {intern.description}
                                </p>
                                {intern.skills && (
                                  <p
                                    className="text-gray-600 text-sm break-words"
                                    style={{ overflowWrap: "anywhere" }}
                                  >
                                    <span className="font-medium">Skills:</span>{" "}
                                    {intern.skills}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2 ml-2">
                                <Edit
                                  onClick={() => {
                                    setActiveModal("internships");
                                    setModalData({
                                      ...intern,
                                      _editIndex: idx,
                                    });
                                  }}
                                  className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-600"
                                />
                                <button
                                  onClick={async () => {
                                    const updated = list.filter(
                                      (_, i) => i !== idx,
                                    );
                                    const updatedUser = {
                                      ...user,
                                      internships: updated,
                                    };
                                    setUser(updatedUser);
                                    localStorage.setItem(
                                      "user",
                                      JSON.stringify(updatedUser),
                                    );
                                    await apiFetch(
                                      `${API_ENDPOINTS.BASE_URL}/profile/save`,
                                      {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          email: user?.email,
                                          internships: updated,
                                        }),
                                      },
                                    );
                                  }}
                                  className="text-red-400 hover:text-red-600 text-xs"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        Talk about the company you interned at, what projects
                        you undertook and what special skills you learned
                      </p>
                    );
                  })()}
                </div>

                {/* Accomplishments Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Accomplishments
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {/* Certifications */}
                    <div className="border-b border-gray-100 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">
                          Certifications
                        </h3>
                        <button
                          onClick={() => {
                            setActiveModal("certifications");
                            setModalData(user?.certifications || {});
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          {user?.certifications &&
                          typeof user.certifications === "object" &&
                          user.certifications.certificationName
                            ? "Edit"
                            : "Add"}
                        </button>
                      </div>
                      {user?.certifications &&
                      typeof user.certifications === "object" &&
                      user.certifications.certificationName ? (
                        <div>
                          <p className="text-gray-900 font-medium">
                            {user.certifications.certificationName}
                          </p>
                          {user.certifications.completionId && (
                            <p className="text-gray-600 text-sm">
                              ID: {user.certifications.completionId}
                            </p>
                          )}
                          {(user.certifications.startMonth ||
                            user.certifications.startYear) && (
                            <p className="text-gray-500 text-sm">
                              {[
                                user.certifications.startMonth,
                                user.certifications.startYear,
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              {" - "}
                              {user.certifications.noExpiry
                                ? "No Expiry"
                                : [
                                    user.certifications.endMonth,
                                    user.certifications.endYear,
                                  ]
                                    .filter(Boolean)
                                    .join(" ") || ""}
                            </p>
                          )}
                          {user.certifications.certificationUrl && (
                            <a
                              href={user.certifications.certificationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm break-all"
                            >
                              {user.certifications.certificationUrl}
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">
                          Talk about any certified courses that you completed
                        </p>
                      )}
                    </div>

                    {/* Awards */}
                    <div className="border-b border-gray-100 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">Awards</h3>
                        <button
                          onClick={() => {
                            setActiveModal("awards");
                            setModalData(user?.awards || "");
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          {user?.awards && user.awards.trim() ? "Edit" : "Add"}
                        </button>
                      </div>
                      {user?.awards && user.awards.trim() ? (
                        <p
                          className="text-gray-700 whitespace-pre-line break-all break-words"
                          style={{ overflowWrap: "anywhere" }}
                        >
                          {user.awards}
                        </p>
                      ) : (
                        <p className="text-gray-500 text-sm">
                          Talk about any special recognitions that you received
                          that makes you proud
                        </p>
                      )}
                    </div>

                    {/* Club & committees */}
                    <div className="border-b border-gray-100 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">
                          Club & committees
                        </h3>
                        <button
                          onClick={() => {
                            setActiveModal("clubsCommittees");
                            setModalData(user?.clubsCommittees || {});
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          {user?.clubsCommittees &&
                          typeof user.clubsCommittees === "object" &&
                          user.clubsCommittees.clubName
                            ? "Edit"
                            : "Add"}
                        </button>
                      </div>
                      {user?.clubsCommittees &&
                      typeof user.clubsCommittees === "object" &&
                      user.clubsCommittees.clubName ? (
                        <div>
                          <p
                            className="text-gray-900 font-medium break-words"
                            style={{ overflowWrap: "anywhere" }}
                          >
                            {user.clubsCommittees.designation} at{" "}
                            {user.clubsCommittees.clubName}
                          </p>
                          <p className="text-gray-500 text-sm">
                            {user.clubsCommittees.startMonth}{" "}
                            {user.clubsCommittees.startYear} -{" "}
                            {user.clubsCommittees.currentlyWorking
                              ? "Present"
                              : `${user.clubsCommittees.endMonth} ${user.clubsCommittees.endYear}`}
                            {user.clubsCommittees.associatedEducation &&
                              `  ${user.clubsCommittees.associatedEducation}`}
                          </p>
                          <p
                            className="text-gray-700 text-sm mt-1 break-all break-words"
                            style={{ overflowWrap: "anywhere" }}
                          >
                            {user.clubsCommittees.description}
                          </p>
                          {user.clubsCommittees.mediaFile && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-600 mb-1">
                                Attached media:
                              </p>
                              <p
                                className="text-sm text-gray-900 font-medium break-words"
                                style={{ overflowWrap: "anywhere" }}
                              >
                                {user.clubsCommittees.mediaFile}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">
                          Add details of position of responsibilities that you
                          have held
                        </p>
                      )}
                    </div>

                    {/* Competitive exams */}
                    <div className="border-b border-gray-100 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">
                          Competitive exams
                        </h3>
                        <button
                          onClick={() => {
                            setActiveModal("competitiveExams");
                            setModalData({
                              _list: (() => {
                                const ce = user?.competitiveExams;
                                if (Array.isArray(ce)) return ce;
                                if (ce && typeof ce === "object" && ce.examName)
                                  return [ce];
                                return [];
                              })(),
                              examName: "",
                              score: "",
                              year: "",
                            });
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          + Add
                        </button>
                      </div>
                      {(() => {
                        const ce = user?.competitiveExams;
                        const list: any[] = Array.isArray(ce)
                          ? ce
                          : ce && typeof ce === "object" && ce.examName
                            ? [ce]
                            : [];
                        return list.length > 0 ? (
                          <div className="space-y-2">
                            {list.map((exam: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                              >
                                <div>
                                  <p className="text-gray-900 font-medium text-sm">
                                    {exam.examName}
                                  </p>
                                  <p className="text-gray-500 text-xs">
                                    {[
                                      exam.score && `Score: ${exam.score}`,
                                      exam.year && `Year: ${exam.year}`,
                                    ]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setActiveModal("competitiveExams");
                                      setModalData({
                                        _list: list,
                                        _editIndex: idx,
                                        examName: exam.examName,
                                        score: exam.score || "",
                                        year: exam.year || "",
                                      });
                                    }}
                                    className="text-gray-400 hover:text-blue-600"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const updated = list.filter(
                                        (_: any, i: number) => i !== idx,
                                      );
                                      const updatedUser = {
                                        ...user,
                                        competitiveExams: updated,
                                      };
                                      setUser(updatedUser);
                                      localStorage.setItem(
                                        "user",
                                        JSON.stringify(updatedUser),
                                      );
                                      await apiFetch(
                                        `${API_ENDPOINTS.BASE_URL}/profile/save`,
                                        {
                                          method: "POST",
                                          headers: {
                                            "Content-Type": "application/json",
                                          },
                                          body: JSON.stringify({
                                            email: user?.email,
                                            competitiveExams: updated,
                                          }),
                                        },
                                      );
                                    }}
                                    className="text-red-400 hover:text-red-600 text-xs font-bold"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">
                            Talk about any competitive exam that you appeared
                            for and the rank received
                          </p>
                        );
                      })()}
                    </div>

                    {/* Academic achievements */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">
                          Academic achievements
                        </h3>
                        <button
                          onClick={() => {
                            setActiveModal("academicAchievements");
                            setModalData(user?.academicAchievements || "");
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          {user?.academicAchievements &&
                          user.academicAchievements.trim()
                            ? "Edit"
                            : "Add"}
                        </button>
                      </div>
                      {user?.academicAchievements &&
                      user.academicAchievements.trim() ? (
                        <p
                          className="text-gray-700 whitespace-pre-line break-words"
                          style={{ overflowWrap: "anywhere" }}
                        >
                          {user.academicAchievements}
                        </p>
                      ) : (
                        <p className="text-gray-500 text-sm">
                          Talk about any academic achievement whether in college
                          or school that deserves a mention
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resume Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Resume
                    </h2>
                  </div>
                  <p className="text-gray-500 mb-4">
                    Your resume is the first impression you make on potential
                    employers. Craft it carefully to secure your desired job or
                    internship.
                  </p>
                  {user?.resume ? (
                    <div className="border border-gray-300 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {user.resume.name || "Resume.pdf"}
                          </p>
                          <p className="text-sm text-gray-500">
                            Uploaded on {user.resume.uploadDate || "Recently"}
                          </p>
                        </div>
                        <input
                          type="file"
                          id="resume-update"
                          accept=".doc,.docx,.rtf,.pdf"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 2 * 1024 * 1024) {
                              setNotification({
                                type: "error",
                                message: "File size must be less than 2MB",
                                isVisible: true,
                              });
                              return;
                            }
                            const userEmail =
                              user?.email ||
                              (() => {
                                try {
                                  return JSON.parse(
                                    localStorage.getItem("user") || "{}",
                                  ).email;
                                } catch {
                                  return "";
                                }
                              })();
                            if (!userEmail) {
                              setNotification({
                                type: "error",
                                message:
                                  "Please log in again to upload your resume.",
                                isVisible: true,
                              });
                              return;
                            }
                            try {
                              const s3Result =
                                await S3Service.uploadResumeToS3(file);
                              if (!s3Result.success)
                                throw new Error(
                                  s3Result.error || "Upload failed",
                                );
                              const fileUrl = s3Result.fileUrl;
                              const resumeData = {
                                name: file.name,
                                size: file.size,
                                uploadDate: new Date().toLocaleDateString(),
                                url: fileUrl,
                              };
                              const updatedUser = {
                                ...user,
                                resume: resumeData,
                                resumeUrl: fileUrl,
                              };
                              setUser(updatedUser);
                              localStorage.setItem(
                                "user",
                                JSON.stringify(updatedUser),
                              );
                              window.dispatchEvent(new CustomEvent('zync:user-updated', { detail: updatedUser }));
                              calculateProfileCompletion(updatedUser);
                              await apiFetch(
                                `${API_ENDPOINTS.BASE_URL}/profile/save`,
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    email: userEmail,
                                    resume: resumeData,
                                    resumeUrl: fileUrl,
                                  }),
                                },
                              );
                              setNotification({
                                type: "success",
                                message: "Resume updated successfully!",
                                isVisible: true,
                              });
                            } catch (error: any) {
                              setNotification({
                                type: "error",
                                message:
                                  error.message ||
                                  "Failed to upload resume. Please try again.",
                                isVisible: true,
                              });
                            }
                          }}
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() =>
                              document.getElementById("resume-update")?.click()
                            }
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Update
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              showConfirm(
                                'Remove Resume',
                                'Are you sure you want to remove your resume? This action cannot be undone.',
                                async () => {
                                  try {
                                    const updatedUser = { ...user, resume: null, resumeUrl: "" };
                                    setUser(updatedUser);
                                    localStorage.setItem("user", JSON.stringify(updatedUser));
                                    calculateProfileCompletion(updatedUser);
                                    const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/profile/save`, {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ email: user?.email, resume: null, resumeUrl: "", removeResume: true }),
                                    });
                                    if (!res.ok) throw new Error("Save failed");
                                    setNotification({ type: "success", message: "Resume removed successfully!", isVisible: true });
                                  } catch (error) {
                                    setUser(user);
                                    localStorage.setItem("user", JSON.stringify(user));
                                    setNotification({ type: "error", message: "Failed to remove resume. Please try again.", isVisible: true });
                                  }
                                }
                              );
                            }}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <input
                        type="file"
                        id="resume-upload"
                        accept=".doc,.docx,.rtf,.pdf"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 2 * 1024 * 1024) {
                            setNotification({
                              type: "error",
                              message: "File size must be less than 2MB",
                              isVisible: true,
                            });
                            return;
                          }
                          const userEmail =
                            user?.email ||
                            (() => {
                              try {
                                return JSON.parse(
                                  localStorage.getItem("user") || "{}",
                                ).email;
                              } catch {
                                return "";
                              }
                            })();
                          if (!userEmail) {
                            setNotification({
                              type: "error",
                              message:
                                "Please log in again to upload your resume.",
                              isVisible: true,
                            });
                            return;
                          }
                          try {
                            const s3Result =
                              await S3Service.uploadResumeToS3(file);
                            if (!s3Result.success)
                              throw new Error(
                                s3Result.error || "Upload failed",
                              );
                            const fileUrl = s3Result.fileUrl;
                            const resumeData = {
                              name: file.name,
                              size: file.size,
                              uploadDate: new Date().toLocaleDateString(),
                              url: fileUrl,
                            };
                            const updatedUser = {
                              ...user,
                              resume: resumeData,
                              resumeUrl: fileUrl,
                            };
                            setUser(updatedUser);
                            localStorage.setItem(
                              "user",
                              JSON.stringify(updatedUser),
                            );
                            window.dispatchEvent(new CustomEvent('zync:user-updated', { detail: updatedUser }));
                            calculateProfileCompletion(updatedUser);
                            await apiFetch(
                              `${API_ENDPOINTS.BASE_URL}/profile/save`,
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  email: userEmail,
                                  resume: resumeData,
                                  resumeUrl: fileUrl,
                                }),
                              },
                            );
                            setNotification({
                              type: "success",
                              message: "Resume uploaded successfully!",
                              isVisible: true,
                            });
                          } catch (error: any) {
                            setNotification({
                              type: "error",
                              message:
                                error.message ||
                                "Failed to upload resume. Please try again.",
                              isVisible: true,
                            });
                          }
                        }}
                      />
                      <button
                        onClick={() =>
                          document.getElementById("resume-upload")?.click()
                        }
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Upload resume
                      </button>
                      <p className="text-gray-500 text-sm mt-2">
                        Supported formats: doc, docx, rtf, pdf, up to 2MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "Activity" && (
            <div className="space-y-6">
              {loadingActivity ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">
                      Loading activity insights...
                    </span>
                  </div>
                </div>
              ) : activityData ? (
                <>
                  {/* Activity Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 4C13.66 4 15 5.34 15 7C15 8.66 13.66 10 12 10C10.34 10 9 8.66 9 7C9 5.34 10.34 4 12 4ZM12 20C9.33 20 6.94 18.66 5.5 16.63C5.53 14.47 9.83 13.3 12 13.3C14.17 13.3 18.47 14.47 18.5 16.63C17.06 18.66 14.67 20 12 20Z"
                                fill="currentColor"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">
                            Profile Views
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {activityData.profileViews}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="11" cy="11" r="8"></circle>
                                <line
                                  x1="21"
                                  y1="21"
                                  x2="16.65"
                                  y2="16.65"
                                ></line>
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">
                              Search Appearances
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                              {activityData.searchAppearances}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => onNavigate("search-appearances")}
                          className="text-xs text-blue-600 font-medium hover:underline flex-shrink-0 ml-2"
                        >
                          View All
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">
                            Applications Sent
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {activityData.applicationsSent}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <circle
                                  cx="7"
                                  cy="7"
                                  r="3"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                />
                                <path
                                  d="M2 18C2 15.2386 4.23858 13 7 13H7C9.76142 13 12 15.2386 12 18V20H2V18Z"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                />
                                <circle
                                  cx="17"
                                  cy="7"
                                  r="3"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                />
                                <path
                                  d="M12 18C12 15.2386 14.2386 13 17 13H17C19.7614 13 22 15.2386 22 18V20H12V18Z"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">
                              Recruiter Actions
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                              {activityData.recruiterActions}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => onNavigate("recruiter-actions")}
                          className="text-xs text-blue-600 font-medium hover:underline flex-shrink-0 ml-2"
                        >
                          View All
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Recent Activity
                    </h2>
                    <div className="space-y-4">
                      {activityData.recentActivity.map(
                        (activity: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg"
                          >
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                              <path d="M3 3v5h5" />
                              <path d="M12 7v5l4 2" />
                            </svg>

                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {activity.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {activity.company} {activity.time}
                              </p>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Activity Chart */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      Activity Trends
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                      Your job search activity over the last 7 days
                    </p>
                    {(() => {
                      const days = Array.from({ length: 7 }, (_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (6 - i));
                        return {
                          label: d.toLocaleDateString("en-IN", {
                            weekday: "short",
                          }),
                          applications: 0,
                          interviews: 0,
                        };
                      });
                      activityData.recentActivity.forEach((a: any) => {
                        const mins =
                          a.time === "Just now"
                            ? 0
                            : (() => {
                                const h = a.time.match(/(\d+)h ago/);
                                if (h) return parseInt(h[1]) * 60;
                                const d = a.time.match(/(\d+)d ago/);
                                if (d) return parseInt(d[1]) * 1440;
                                return 0;
                              })();
                        const idx = 6 - Math.floor(mins / 1440);
                        if (idx >= 0 && idx < 7) {
                          if (a.type === "interview") days[idx].interviews += 1;
                          else days[idx].applications += 1;
                        }
                      });
                      const maxVal = Math.max(
                        ...days.map((d) => d.applications + d.interviews),
                        1,
                      );
                      return (
                        <div>
                          <div className="flex items-center gap-6 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"></span>
                              <span className="text-xs text-gray-600">
                                Applications
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-sm bg-purple-400 inline-block"></span>
                              <span className="text-xs text-gray-600">
                                Interviews
                              </span>
                            </div>
                          </div>
                          <div
                            className="flex items-end gap-2"
                            style={{ height: 120 }}
                          >
                            {days.map((day, i) => {
                              const total = day.applications + day.interviews;
                              const barH =
                                total > 0
                                  ? Math.max((total / maxVal) * 96, 6)
                                  : 3;
                              return (
                                <div
                                  key={i}
                                  className="flex-1 flex flex-col items-center justify-end gap-1"
                                >
                                  {total > 0 && (
                                    <span className="text-xs font-semibold text-gray-700">
                                      {total}
                                    </span>
                                  )}
                                  <div
                                    className="w-full relative rounded-t overflow-hidden"
                                    style={{
                                      height: barH,
                                      backgroundColor:
                                        total > 0 ? "#3b82f6" : "#e5e7eb",
                                    }}
                                  >
                                    {day.interviews > 0 && total > 0 && (
                                      <div
                                        className="absolute top-0 left-0 right-0 bg-purple-400"
                                        style={{
                                          height:
                                            (day.interviews / total) * 100 +
                                            "%",
                                        }}
                                      ></div>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {day.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-600">
                                {activityData.applicationsSent}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Total Applications
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-purple-500">
                                {activityData.recruiterActions}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Recruiter Actions
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-600">
                                {activityData.searchAppearances}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Search Appearances
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* First-time Resume Upload Popup */}
      {showResumePopup && !readOnly && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <button
                  onClick={() => {
                    localStorage.setItem(
                      `resumePopupDismissed_${user?.email}`,
                      "1",
                    );
                    setShowResumePopup(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Complete your profile faster!
              </h2>
              <p className="text-gray-500 text-sm mb-5">
                Upload your resume and we'll fill your profile with the parsed
                details — phone, skills, experience, education and more. Fields
                not found in the resume will be cleared.
              </p>

              {resumePopupError && (
                <p className="text-red-500 text-sm mb-3">{resumePopupError}</p>
              )}

              {resumePopupFile ? (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg mb-4">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate flex-1">
                    {resumePopupFile.name}
                  </span>
                  <button
                    onClick={() => setResumePopupFile(null)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors mb-4">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">
                    Click to upload resume
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PDF, DOC, DOCX up to 5MB
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setResumePopupFile(f);
                        setResumePopupError("");
                      }
                    }}
                  />
                </label>
              )}

              {resumePopupParsing && (
                <div className="mb-4">
                  <AIFeatureLoader
                    title="Parsing your resume"
                    subtitle="AI is extracting your skills, experience & education"
                    icon="document"
                    steps={[
                      "Reading PDF content",
                      "Extracting text & structure",
                      "Identifying skills & experience",
                      "Parsing education details",
                      "Running AI analysis",
                      "Building your profile",
                    ]}
                  />
                </div>
              )}

              <button
                disabled={!resumePopupFile || resumePopupParsing}
                onClick={async () => {
                  if (!resumePopupFile) return;
                  setResumePopupParsing(true);
                  setResumePopupError("");
                  try {
                    // 1. Parse resume — use plain fetch with explicit token + 60s timeout
                    const formData = new FormData();
                    formData.append("resume", resumePopupFile);
                    const accessToken = tokenStorage.getAccess();
                    const controller = new AbortController();
                    const timeoutId = setTimeout(
                      () => controller.abort(),
                      60000,
                    );
                    let parseRes: Response;
                    try {
                      parseRes = await fetch(
                        `${API_ENDPOINTS.BASE_URL}/resume/upload-and-parse`,
                        {
                          method: "POST",
                          headers: accessToken
                            ? { Authorization: `Bearer ${accessToken}` }
                            : {},
                          body: formData,
                          signal: controller.signal,
                        },
                      );
                    } catch (fetchErr: any) {
                      if (fetchErr?.name === "AbortError")
                        throw new Error("Request timed out. Please try again.");
                      throw new Error(
                        "Could not connect to server. Please check your connection.",
                      );
                    } finally {
                      clearTimeout(timeoutId);
                    }

                    // Handle non-JSON or empty responses
                    const rawText = await parseRes.text();
                    if (!rawText || !rawText.trim()) {
                      throw new Error(
                        "Server returned empty response. Please try again.",
                      );
                    }
                    let parseData: any;
                    try {
                      parseData = JSON.parse(rawText);
                    } catch {
                      throw new Error("Server error. Please try again.");
                    }
                    if (!parseRes.ok || !parseData.success) {
                      throw new Error(parseData.error || "Parse failed");
                    }
                    const p = parseData.profileData;
                    console.log(
                      "[ResumePopup] AI parsed profileData:",
                      JSON.stringify(p, null, 2),
                    );

                    // Sanitize AI name — reject section headings
                    const SECTION_HEADINGS = new Set([
                      "about me",
                      "about",
                      "summary",
                      "objective",
                      "profile",
                      "overview",
                      "experience",
                      "work experience",
                      "education",
                      "skills",
                      "projects",
                      "certifications",
                      "contact",
                    ]);
                    const isValidName = (n: string) => {
                      if (!n || n.length < 2 || n.length > 60) return false;
                      if (SECTION_HEADINGS.has(n.toLowerCase())) return false;
                      if (
                        /^[A-Z\s]+$/.test(n) &&
                        n.split(" ").length <= 2 &&
                        n.length < 20
                      )
                        return false;
                      return /[a-zA-Z]/.test(n);
                    };
                    const cleanName = isValidName(p.name) ? p.name : "";
                    // 2. Upload resume file to S3
                    const s3Result =
                      await S3Service.uploadResumeToS3(resumePopupFile);
                    if (!s3Result.success)
                      throw new Error(s3Result.error || "Upload failed");
                    const fileUrl = s3Result.fileUrl || "";
                    const resumeData = {
                      name: resumePopupFile.name,
                      size: resumePopupFile.size,
                      uploadDate: new Date().toLocaleDateString(),
                      url: fileUrl,
                    };

                    // 3. Resume is source of truth — replace each field with parsed value;
                    //    if resume has no value for a field, that field becomes empty.
                    const workExps =
                      p.workExperiences ||
                      p.experience ||
                      p.workExperience ||
                      [];
                    const educations = p.educations || p.education || [];
                    const eduArr = Array.isArray(educations)
                      ? educations
                      : educations && typeof educations === "object"
                        ? [educations]
                        : [];
                    const expArr = Array.isArray(workExps) ? workExps : [];
                    const extractYear = (dateStr: string) =>
                      String(dateStr || "").match(/\d{4}/)?.[0] || "";
                    const rawSkillsArr: any[] = Array.isArray(p.skills)
                      ? p.skills
                      : [];
                    const normalizedSkills: string[] = rawSkillsArr
                      .map((s: any) =>
                        typeof s === "string" ? s : s?.skill || s?.name || "",
                      )
                      .filter(Boolean);

                    const merged = {
                      ...user,
                      resume: resumeData,
                      resumeUrl: fileUrl,
                      // Always set from resume — empty string if not found
                      name: cleanName || user?.name || "",
                      phone: p.phone || "",
                      location: p.location || "",
                      country: p.country || user?.country || "",
                      profileSummary: p.summary || p.profileSummary || "",
                      skills:
                        normalizedSkills.length > 0 ? normalizedSkills : [],
                      jobTitle:
                        p.title ||
                        p.jobTitle ||
                        expArr[0]?.jobTitle ||
                        expArr[0]?.title ||
                        "",
                      employment:
                        expArr.length > 0
                          ? expArr.map((w: any) => {
                              const dateParts = String(w.date || "").split(
                                /\s*[-–]\s*/,
                              );
                              return {
                                companyName: w.company || w.companyName || "",
                                designation:
                                  w.jobTitle || w.title || w.designation || "",
                                description: Array.isArray(w.descriptions)
                                  ? w.descriptions.join(" ")
                                  : w.description || w.descriptions || "",
                                startYear: extractYear(
                                  dateParts[0] || w.startDate || "",
                                ),
                                endYear: extractYear(
                                  dateParts[1] || w.endDate || "",
                                ),
                                currentlyWorking:
                                  /present|current/i.test(
                                    w.date || w.endDate || "",
                                  ) || !!w.current,
                              };
                            })
                          : [],
                      educationCollege:
                        eduArr.length > 0
                          ? {
                              college:
                                eduArr[0].school || eduArr[0].college || "",
                              degree: eduArr[0].degree || "",
                              passingYear: extractYear(
                                eduArr[0].endYear ||
                                  eduArr[0].passingYear ||
                                  eduArr[0].date ||
                                  "",
                              ),
                              percentage:
                                eduArr[0].percentage || eduArr[0].grade || "",
                            }
                          : {},
                      projects:
                        p.projects?.length > 0
                          ? p.projects.map((pr: any) => ({
                              projectName: pr.name || pr.projectName || "",
                              description: pr.description || "",
                            }))
                          : [],
                    };
                    setUser(merged);
                    localStorage.setItem("user", JSON.stringify(merged));
                    window.dispatchEvent(new CustomEvent('zync:user-updated', { detail: merged }));
                    calculateProfileCompletion(merged);

                    // 4. Save to backend
                    const saveEmail =
                      user?.email ||
                      (() => {
                        try {
                          return JSON.parse(
                            localStorage.getItem("user") || "{}",
                          ).email;
                        } catch {
                          return "";
                        }
                      })();
                    if (saveEmail) {
                      await apiFetch(`${API_ENDPOINTS.BASE_URL}/profile/save`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: saveEmail, ...merged }),
                      });
                    }

                    localStorage.setItem(
                      `resumePopupDismissed_${user?.email}`,
                      "1",
                    );
                    setShowResumePopup(false);
                    setNotification({
                      type: "success",
                      message:
                        "Resume parsed & profile updated successfully! 🎉",
                      isVisible: true,
                    });
                  } catch (err: any) {
                    setResumePopupError(
                      err.message ||
                        "Failed to parse resume. Please try again.",
                    );
                  } finally {
                    setResumePopupParsing(false);
                  }
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {resumePopupParsing ? (
                  <>
                    <span>Parsing with AI...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Parse Resume & Fill Profile</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  localStorage.setItem(
                    `resumePopupDismissed_${user?.email}`,
                    "1",
                  );
                  setShowResumePopup(false);
                }}
                className="w-full mt-3 text-gray-500 text-sm hover:text-gray-700 py-2"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cover Photo Crop Modal */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(prev => ({ ...prev, isOpen: false })); }}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
      {coverCropModal && (
        <CoverPhotoCropModal
          src={coverCropModal.src}
          onClose={() => {
            URL.revokeObjectURL(coverCropModal.src);
            setCoverCropModal(null);
          }}
          onApply={async (croppedBlob) => {
            URL.revokeObjectURL(coverCropModal.src);
            setCoverCropModal(null);
            try {
              const formData = new FormData();
              formData.append("photo", croppedBlob, "cover.jpg");
              const uploadRes = await apiFetch(
                `${API_ENDPOINTS.BASE_URL}/upload/profile-photo`,
                { method: "POST", body: formData },
              );
              if (!uploadRes.ok)
                throw new Error(`Upload failed: ${uploadRes.status}`);
              const data = await uploadRes.json();
              const backendBase = (
                import.meta.env.VITE_API_URL || "/api"
              ).replace(/\/api\/?$/, "");
              const coverUrl = data.photoUrl?.startsWith("http")
                ? data.photoUrl
                : `${backendBase}${data.photoUrl?.startsWith("/") ? data.photoUrl : `/${data.photoUrl}`}`;
              const updatedUser = { ...user, coverPhoto: coverUrl };
              setUser(updatedUser);
              try {
                localStorage.setItem("user", JSON.stringify(updatedUser));
              } catch {
                /* quota full */
              }
              await apiFetch(`${API_ENDPOINTS.BASE_URL}/profile/save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: user?.email,
                  coverPhoto: coverUrl,
                }),
              });
              setNotification({
                type: "success",
                message: "Cover photo updated!",
                isVisible: true,
              });
            } catch (err) {
              setNotification({
                type: "error",
                message: "Cover photo upload failed. Try a smaller image.",
                isVisible: true,
              });
            }
          }}
        />
      )}

      <ProfilePhotoEditor
        isOpen={showPhotoEditor}
        onClose={() => setShowPhotoEditor(false)}
        onSave={async (photo, frame) => {
          try {
            let photoUrl = photo;

            // If photo is base64 data URL, convert to blob and upload
            if (photo && photo.startsWith("data:")) {
              // Convert base64 data URL to blob directly
              const response = await fetch(photo);
              const blob = await response.blob();
              const ext = blob.type.split("/")[1] || "jpg";
              const formData = new FormData();
              formData.append("photo", blob, `profile.${ext}`);
              const uploadRes = await apiFetch(
                `${API_ENDPOINTS.BASE_URL}/upload/profile-photo`,
                {
                  method: "POST",
                  body: formData,
                },
              );
              if (!uploadRes.ok) {
                const errData = await uploadRes.json().catch(() => ({}));
                throw new Error(
                  errData.error || "Photo upload failed. Please try again.",
                );
              }
              const data = await uploadRes.json();
              const backendBase = (
                import.meta.env.VITE_API_URL || "/api"
              ).replace(/\/api\/?$/, "");
              photoUrl = data.photoUrl?.startsWith("http")
                ? data.photoUrl
                : `${backendBase}${data.photoUrl?.startsWith("/") ? data.photoUrl : `/${data.photoUrl}`}`;
            }

            const updatedUser = {
              ...user,
              profilePhoto: photoUrl,
              profileFrame: frame || "none",
            };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));

            await apiFetch(`${API_ENDPOINTS.BASE_URL}/profile/save`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: user?.email,
                profilePhoto: photoUrl,
                profileFrame: frame || "none",
              }),
            });

            setNotification({
              type: "success",
              message: "Profile photo updated successfully!",
              isVisible: true,
            });
          } catch (error: any) {
            console.error("Error saving profile photo:", error);
            setNotification({
              type: "error",
              message: error.message || "Failed to save profile photo",
              isVisible: true,
            });
          }
        }}
        currentPhoto={user?.profilePhoto}
        currentFrame={user?.profileFrame || "none"}
      />

      {/* Personal Details Modal */}
      {activeModal === "personalDetails" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">All about you</h2>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block font-medium mb-2">Full name</label>
                  <input
                    type="text"
                    value={modalData.name || ""}
                    onChange={(e) =>
                      setModalData({ ...modalData, name: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Gender</label>
                  <div className="flex gap-3">
                    {["Male", "Female", "Transgender"].map((g) => (
                      <button
                        key={g}
                        onClick={() =>
                          setModalData({ ...modalData, gender: g })
                        }
                        className={`px-6 py-2 border rounded-full ${modalData.gender === g ? "bg-blue-50 border-blue-500" : "hover:bg-gray-50"}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-2">
                    Date of birth (DD/MM/YYYY)
                  </label>
                  <input
                    type="date"
                    value={modalData.birthday || ""}
                    onChange={(e) =>
                      setModalData({ ...modalData, birthday: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">
                    Current location
                  </label>
                  {locations.length > 0 ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={modalData.location || ""}
                        onChange={(e) => {
                          setModalData({
                            ...modalData,
                            location: e.target.value,
                          });
                          setShowLocationDropdown(true);
                        }}
                        onFocus={() => setShowLocationDropdown(true)}
                        className="w-full p-3 border rounded-lg"
                        placeholder="Type location..."
                      />
                      {showLocationDropdown && locations.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-t-0 rounded-b-lg shadow-lg max-h-64 overflow-y-auto z-50">
                          {locations
                            .filter(
                              (l: string) =>
                                !modalData.location ||
                                l
                                  .toLowerCase()
                                  .includes(modalData.location.toLowerCase()),
                            )
                            .slice(0, 15)
                            .map((location: string, idx: number) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  setModalData({ ...modalData, location });
                                  setShowLocationDropdown(false);
                                }}
                                className="p-3 hover:bg-blue-50 cursor-pointer border-b text-sm"
                              >
                                {location}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={modalData.location || ""}
                      onChange={(e) =>
                        setModalData({ ...modalData, location: e.target.value })
                      }
                      className="w-full p-3 border rounded-lg"
                      placeholder="Enter your location"
                    />
                  )}
                </div>
                <div>
                  <label className="block font-medium mb-2">Phone number</label>
                  <input
                    type="tel"
                    value={modalData.phone || ""}
                    onChange={(e) =>
                      setModalData({ ...modalData, phone: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Job title</label>
                  {jobTitles.length > 0 ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={modalData.jobTitle || ""}
                        onChange={(e) => {
                          setModalData({
                            ...modalData,
                            jobTitle: e.target.value,
                          });
                          setShowJobTitleDropdown(true);
                        }}
                        onFocus={() => setShowJobTitleDropdown(true)}
                        className="w-full p-3 border rounded-lg"
                        placeholder="Type job title..."
                      />
                      {showJobTitleDropdown && jobTitles.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-t-0 rounded-b-lg shadow-lg max-h-64 overflow-y-auto z-50">
                          {jobTitles
                            .filter(
                              (t: string) =>
                                !modalData.jobTitle ||
                                t
                                  .toLowerCase()
                                  .includes(modalData.jobTitle.toLowerCase()),
                            )
                            .slice(0, 15)
                            .map((title: string, idx: number) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  setModalData({
                                    ...modalData,
                                    jobTitle: title,
                                  });
                                  setShowJobTitleDropdown(false);
                                }}
                                className="p-3 hover:bg-blue-50 cursor-pointer border-b text-sm"
                              >
                                {title}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={modalData.jobTitle || ""}
                      onChange={(e) =>
                        setModalData({ ...modalData, jobTitle: e.target.value })
                      }
                      className="w-full p-3 border rounded-lg"
                      placeholder="Enter your job title"
                    />
                  )}
                </div>
                <div>
                  <label className="block font-medium mb-2">Education</label>
                  <input
                    type="text"
                    value={modalData.education || ""}
                    onChange={(e) =>
                      setModalData({ ...modalData, education: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter your education"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-blue-600 px-6 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const updatedUser = {
                      ...user,
                      name:
                        modalData.name !== undefined
                          ? modalData.name
                          : user?.name,
                      gender:
                        modalData.gender !== undefined
                          ? modalData.gender
                          : user?.gender,
                      birthday:
                        modalData.birthday !== undefined
                          ? modalData.birthday
                          : user?.birthday,
                      location:
                        modalData.location !== undefined
                          ? modalData.location
                          : user?.location,
                      phone:
                        modalData.phone !== undefined
                          ? modalData.phone
                          : user?.phone,
                      jobTitle:
                        modalData.jobTitle !== undefined
                          ? modalData.jobTitle
                          : user?.jobTitle,
                      education:
                        modalData.education !== undefined
                          ? modalData.education
                          : user?.education,
                    };

                    try {
                      const response = await apiFetch(
                        `${API_ENDPOINTS.BASE_URL}/profile/save`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            email: user?.email,
                            name:
                              modalData.name !== undefined
                                ? modalData.name
                                : user?.name,
                            gender:
                              modalData.gender !== undefined
                                ? modalData.gender
                                : user?.gender,
                            birthday:
                              modalData.birthday !== undefined
                                ? modalData.birthday
                                : user?.birthday,
                            location:
                              modalData.location !== undefined
                                ? modalData.location
                                : user?.location,
                            phone:
                              modalData.phone !== undefined
                                ? modalData.phone
                                : user?.phone,
                            jobTitle:
                              modalData.jobTitle !== undefined
                                ? modalData.jobTitle
                                : user?.jobTitle,
                            education:
                              modalData.education !== undefined
                                ? modalData.education
                                : user?.education,
                          }),
                        },
                      );

                      if (!response.ok) {
                        throw new Error("Failed to save to server");
                      }

                      // Only update local state after successful backend save
                      setUser(updatedUser);
                      localStorage.setItem("user", JSON.stringify(updatedUser));
                      calculateProfileCompletion(updatedUser);

                      setNotification({
                        type: "success",
                        message: "Profile updated successfully!",
                        isVisible: true,
                      });
                      setActiveModal(null);
                    } catch (error) {
                      console.error("Error saving:", error);
                      setNotification({
                        type: "error",
                        message: "Failed to save profile. Please try again.",
                        isVisible: true,
                      });
                    }
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Career Preferences Modal */}
      {activeModal === "careerPreferences" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Career preferences
                  </h2>
                  <p className="text-gray-600">
                    Tell us your preferences for your next job & we will send
                    you most relevant recommendations
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block font-medium mb-3">Looking for</label>
                  <div className="flex gap-3">
                    {["Internships", "Jobs"].map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          const current = modalData.lookingFor || [];
                          setModalData({
                            ...modalData,
                            lookingFor: current.includes(type)
                              ? current.filter((t: string) => t !== type)
                              : [...current, type],
                          });
                        }}
                        className={`px-4 py-2 border rounded-full ${(modalData.lookingFor || []).includes(type) ? "bg-blue-50 border-blue-500" : "hover:bg-gray-50"}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-3">
                    Availability to work
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      "15 Days or less",
                      "1 Month",
                      "2 Months",
                      "3 Months",
                      "More than 3 Months",
                    ].map((time) => (
                      <button
                        key={time}
                        onClick={() =>
                          setModalData({ ...modalData, availability: time })
                        }
                        className={`px-4 py-2 border rounded-full ${modalData.availability === time ? "bg-blue-50 border-blue-500" : "hover:bg-gray-50"}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-3">
                    Preferred locations
                  </label>
                  {(() => {
                    const selectedLocs: string[] =
                      modalData.locations ||
                      (modalData.location ? [modalData.location] : []);
                    const locInput = careerPrefLocInput;
                    const setLocInput = setCareerPrefLocInput;
                    return (
                      <div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {selectedLocs.map((loc: string, i: number) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                            >
                              {loc}
                              <button
                                type="button"
                                onClick={() =>
                                  setModalData({
                                    ...modalData,
                                    locations: selectedLocs.filter(
                                      (_: string, idx: number) => idx !== i,
                                    ),
                                    location: undefined,
                                  })
                                }
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={locInput}
                            onChange={(e) => {
                              setLocInput(e.target.value);
                              setShowLocationDropdown(true);
                            }}
                            onFocus={() => setShowLocationDropdown(true)}
                            className="w-full p-3 border rounded-lg"
                            placeholder="Type and select a location to add..."
                          />
                          {showLocationDropdown && locInput && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-t-0 rounded-b-lg shadow-lg max-h-48 overflow-y-auto z-50">
                              {(locations.length > 0 ? locations : [locInput])
                                .filter(
                                  (l: string) =>
                                    l
                                      .toLowerCase()
                                      .includes(locInput.toLowerCase()) &&
                                    !selectedLocs.includes(l),
                                )
                                .slice(0, 15)
                                .map((loc: string, idx: number) => (
                                  <div
                                    key={idx}
                                    onClick={() => {
                                      setModalData({
                                        ...modalData,
                                        locations: [...selectedLocs, loc],
                                        location: undefined,
                                      });
                                      setLocInput("");
                                      setShowLocationDropdown(false);
                                    }}
                                    className="p-3 hover:bg-blue-50 cursor-pointer border-b text-sm"
                                  >
                                    {loc}
                                  </div>
                                ))}
                              {locations.length === 0 && locInput && (
                                <div
                                  onClick={() => {
                                    setModalData({
                                      ...modalData,
                                      locations: [...selectedLocs, locInput],
                                      location: undefined,
                                    });
                                    setLocInput("");
                                    setShowLocationDropdown(false);
                                  }}
                                  className="p-3 hover:bg-blue-50 cursor-pointer border-b text-sm text-blue-600"
                                >
                                  Add "{locInput}"
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-blue-600 px-6 py-2"
                >
                  I'll add this later
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await apiFetch(
                        `${API_ENDPOINTS.BASE_URL}/profile/save`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            email: user?.email,
                            careerPreferences: modalData,
                          }),
                        },
                      );
                      if (!res.ok) throw new Error("Save failed");
                      const updatedUser = {
                        ...user,
                        careerPreferences: modalData,
                      };
                      setUser(updatedUser);
                      localStorage.setItem("user", JSON.stringify(updatedUser));
                      calculateProfileCompletion(updatedUser);
                      setNotification({
                        type: "success",
                        message: "Career preferences saved!",
                        isVisible: true,
                      });
                      setActiveModal(null);
                    } catch (error) {
                      console.error("Error saving:", error);
                      setNotification({
                        type: "error",
                        message: "Failed to save. Please try again.",
                        isVisible: true,
                      });
                    }
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Skills Modal */}
      {activeModal === "skills" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Key skills</h2>
                  <p className="text-gray-600">
                    Recruiters look for candidates with specific keyskills. Add
                    them here to appear in searches.
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="border rounded-lg p-4 mb-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  {(Array.isArray(modalData) ? modalData : []).map(
                    (skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() =>
                            setModalData(
                              (Array.isArray(modalData)
                                ? modalData
                                : []
                              ).filter((_: any, i: number) => i !== idx),
                            )
                          }
                          className="hover:text-blue-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ),
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Enter your key skills and press Enter"
                  className="w-full p-2 border-0 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      e.preventDefault();
                      const newSkills = [
                        ...(Array.isArray(modalData) ? modalData : []),
                        e.currentTarget.value.trim(),
                      ];
                      setModalData(newSkills);
                      e.currentTarget.value = "";
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-blue-600 px-6 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const skillsArray = Array.isArray(modalData)
                      ? modalData
                      : [];
                    try {
                      const response = await apiFetch(
                        `${API_ENDPOINTS.BASE_URL}/profile/save`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            email: user?.email,
                            skills: skillsArray,
                          }),
                        },
                      );
                      if (!response.ok) throw new Error("Save failed");
                      const updatedUser = { ...user, skills: skillsArray };
                      setUser(updatedUser);
                      localStorage.setItem("user", JSON.stringify(updatedUser));
                      calculateProfileCompletion(updatedUser);
                      setNotification({
                        type: "success",
                        message: "Skills saved successfully!",
                        isVisible: true,
                      });
                      setActiveModal(null);
                    } catch (error) {
                      console.error("Error saving:", error);
                      setNotification({
                        type: "error",
                        message: "Failed to save skills",
                        isVisible: true,
                      });
                    }
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Languages Modal */}
      {activeModal === "languages" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Languages known</h2>
                  <p className="text-gray-600">
                    Strengthen your resume by letting recruiters know you can
                    communicate in multiple languages
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="mb-6">
                <label className="block font-medium mb-3">Language</label>
                <select
                  className="w-full p-3 border rounded-lg mb-4"
                  onChange={(e) => {
                    if (e.target.value) {
                      const current =
                        typeof modalData === "string"
                          ? modalData
                              .split(",")
                              .map((s: string) => s.trim())
                              .filter(Boolean)
                          : [];
                      if (!current.includes(e.target.value)) {
                        setModalData([...current, e.target.value].join(", "));
                      }
                    }
                  }}
                >
                  <option>Select Language</option>
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Tamil</option>
                  <option>Telugu</option>
                  <option>Kannada</option>
                  <option>Malayalam</option>
                </select>
                <div className="flex gap-2 flex-wrap">
                  {(typeof modalData === "string"
                    ? modalData
                        .split(",")
                        .map((s: string) => s.trim())
                        .filter(Boolean)
                    : []
                  ).map((lang: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-gray-100 rounded-full text-sm flex items-center gap-2"
                    >
                      {lang}
                      <button
                        onClick={() => {
                          const langs = modalData
                            .split(",")
                            .map((s: string) => s.trim())
                            .filter(Boolean);
                          setModalData(
                            langs
                              .filter((_: string, i: number) => i !== idx)
                              .join(", "),
                          );
                        }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-blue-600 px-6 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await apiFetch(
                        `${API_ENDPOINTS.BASE_URL}/profile/save`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            email: user?.email,
                            languages: modalData,
                          }),
                        },
                      );
                      if (!res.ok) throw new Error("Save failed");
                      const updatedUser = { ...user, languages: modalData };
                      setUser(updatedUser);
                      localStorage.setItem("user", JSON.stringify(updatedUser));
                      calculateProfileCompletion(updatedUser);
                      setNotification({
                        type: "success",
                        message: "Languages saved!",
                        isVisible: true,
                      });
                      setActiveModal(null);
                    } catch (error) {
                      console.error("Error saving:", error);
                      setNotification({
                        type: "error",
                        message: "Failed to save languages",
                        isVisible: true,
                      });
                    }
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Education Modal */}
      {activeModal === "education" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Education</h2>
                  <p className="text-gray-600">
                    Add your educational qualifications
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <textarea
                  value={modalData}
                  onChange={(e) => setModalData(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  rows={6}
                  placeholder="Enter your education details"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-blue-600 px-6 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const field = activeModal;
                    const updatedUser = { ...user, [field]: modalData };
                    setUser(updatedUser);
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                    calculateProfileCompletion(updatedUser);
                    try {
                      await apiFetch(`${API_ENDPOINTS.BASE_URL}/profile/save`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          email: user?.email,
                          [field]: modalData,
                        }),
                      });
                    } catch (error) {
                      console.error("Error saving:", error);
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Summary Modal */}
      {activeModal === "profileSummary" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Profile Summary</h2>
                  <p className="text-gray-600">
                    Write a meaningful summary of more than 50 characters
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <textarea
                  value={modalData}
                  onChange={(e) => setModalData(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  rows={6}
                  placeholder="Your Profile Summary should mention the highlights of your career and education..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-blue-600 px-6 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await apiFetch(
                        `${API_ENDPOINTS.BASE_URL}/profile/save`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            email: user?.email,
                            profileSummary: modalData,
                          }),
                        },
                      );
                      if (!res.ok) throw new Error("Save failed");
                      const updatedUser = {
                        ...user,
                        profileSummary: modalData,
                      };
                      setUser(updatedUser);
                      localStorage.setItem("user", JSON.stringify(updatedUser));
                      calculateProfileCompletion(updatedUser);
                      setNotification({
                        type: "success",
                        message: "Profile summary saved successfully!",
                        isVisible: true,
                      });
                      setActiveModal(null);
                    } catch (error) {
                      console.error("Error saving:", error);
                      setNotification({
                        type: "error",
                        message: "Failed to save profile summary",
                        isVisible: true,
                      });
                    }
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employment Modal */}
      {activeModal === "employment" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Employment details
                  </h2>
                  <p className="text-gray-600">
                    Adding roles & companies you have worked with help employers
                    understand your background
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">
                    Total work experience
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={modalData.experienceYears || ""}
                      onChange={(e) =>
                        setModalData({
                          ...modalData,
                          experienceYears: e.target.value,
                        })
                      }
                      className="p-3 border rounded-lg"
                      placeholder="Years"
                    />
                    <input
                      type="text"
                      value={modalData.experienceMonths || ""}
                      onChange={(e) =>
                        setModalData({
                          ...modalData,
                          experienceMonths: e.target.value,
                        })
                      }
                      className="p-3 border rounded-lg"
                      placeholder="Months"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-2">Company name</label>
                  <input
                    type="text"
                    value={modalData.companyName || ""}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        companyName: e.target.value,
                      })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter the name of the company you worked at"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Designation</label>
                  <input
                    type="text"
                    value={modalData.designation || ""}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        designation: e.target.value,
                      })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter the designation you held"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">
                    Working since
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={modalData.startMonth || ""}
                      onChange={(e) =>
                        setModalData({
                          ...modalData,
                          startMonth: e.target.value,
                        })
                      }
                      className="p-3 border rounded-lg"
                    >
                      <option value=""></option>
                      {[
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                      ].map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={modalData.startYear || ""}
                      onChange={(e) =>
                        setModalData({
                          ...modalData,
                          startYear: e.target.value,
                        })
                      }
                      className="p-3 border rounded-lg"
                      placeholder="Year"
                    />
                  </div>
                  <p className="text-center text-gray-500 text-sm my-2">to</p>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={modalData.endMonth || ""}
                      onChange={(e) =>
                        setModalData({ ...modalData, endMonth: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                      disabled={modalData.currentlyWorking}
                    >
                      <option value=""></option>
                      {[
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                      ].map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={modalData.endYear || ""}
                      onChange={(e) =>
                        setModalData({ ...modalData, endYear: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                      placeholder="Year"
                      disabled={modalData.currentlyWorking}
                    />
                  </div>
                  <label className="flex items-center mt-3">
                    <input
                      type="checkbox"
                      checked={modalData.currentlyWorking || false}
                      onChange={(e) =>
                        setModalData({
                          ...modalData,
                          currentlyWorking: e.target.checked,
                          endMonth: "",
                          endYear: "",
                        })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">I currently work here</span>
                  </label>
                </div>
                <div>
                  <label className="block font-medium mb-2">
                    Describe what you did at work
                  </label>
                  <textarea
                    value={modalData.description || ""}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        description: e.target.value,
                      })
                    }
                    className="w-full p-3 border rounded-lg"
                    rows={5}
                    maxLength={4000}
                    placeholder="Enter the responsibilities you held, anything you accomplished or learned while serving in your full time job"
                  />
                  <p className="text-xs text-gray-500 text-right">
                    {(modalData.description || "").length}/4000
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-blue-600 px-6 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const existing: any[] = Array.isArray(user?.employment)
                      ? user.employment
                      : user?.employment &&
                          typeof user.employment === "object" &&
                          user.employment.companyName
                        ? [user.employment]
                        : [];
                    const editIdx = modalData._editIndex;
                    const { _editIndex, ...cleanData } = modalData;
                    const updated =
                      editIdx !== undefined
                        ? existing.map((e, i) =>
                            i === editIdx ? cleanData : e,
                          )
                        : [...existing, cleanData];
                    try {
                      const res = await apiFetch(
                        `${API_ENDPOINTS.BASE_URL}/profile/save`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            email: user?.email,
                            employment: updated,
                          }),
                        },
                      );
                      if (!res.ok) throw new Error("Save failed");
                      const updatedUser = { ...user, employment: updated };
                      setUser(updatedUser);
                      localStorage.setItem("user", JSON.stringify(updatedUser));
                      calculateProfileCompletion(updatedUser);
                      setNotification({
                        type: "success",
                        message: "Employment details saved successfully!",
                        isVisible: true,
                      });
                      setActiveModal(null);
                    } catch (error) {
                      console.error("Error saving:", error);
                      setNotification({
                        type: "error",
                        message: "Failed to save employment details",
                        isVisible: true,
                      });
                    }
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects Modal */}
      {activeModal === "projects" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Projects</h2>
                  <p className="text-gray-600">
                    Talk about your projects that made you proud
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">Project name</label>
                  <input
                    type="text"
                    value={modalData.projectName || ""}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        projectName: e.target.value,
                      })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter the name of the project you undertook"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">
                    Describe what you did in project
                  </label>
                  <textarea
                    value={modalData.description || ""}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        description: e.target.value,
                      })
                    }
                    className="w-full p-3 border rounded-lg"
                    rows={4}
                    maxLength={1000}
                    placeholder="Enter the responsibilities you held, anything you accomplished or learned while working on this project"
                  />
                  <p className="text-xs text-gray-500 text-right">
                    {(modalData.description || "").length}/1000
                  </p>
                </div>
                <div>
                  <label className="block font-medium mb-2">
                    Key skills (optional)
                  </label>
                  <input
                    type="text"
                    value={modalData.skills || ""}
                    onChange={(e) =>
                      setModalData({ ...modalData, skills: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter the skills you used in this role"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">
                    Project URL (optional)
                  </label>
                  <input
                    type="text"
                    value={modalData.projectUrl || ""}
                    onChange={(e) =>
                      setModalData({ ...modalData, projectUrl: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter the website link of the project"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-blue-600 px-6 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const existing: any[] = Array.isArray(user?.projects)
                      ? user.projects
                      : user?.projects &&
                          typeof user.projects === "object" &&
                          user.projects.projectName
                        ? [user.projects]
                        : [];
                    const editIdx = modalData._editIndex;
                    const { _editIndex, ...cleanData } = modalData;
                    const updated =
                      editIdx !== undefined
                        ? existing.map((e, i) =>
                            i === editIdx ? cleanData : e,
                          )
                        : [...existing, cleanData];
                    try {
                      const res = await apiFetch(
                        `${API_ENDPOINTS.BASE_URL}/profile/save`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            email: user?.email,
                            projects: updated,
                          }),
                        },
                      );
                      if (!res.ok) throw new Error("Save failed");
                      const updatedUser = { ...user, projects: updated };
                      setUser(updatedUser);
                      localStorage.setItem("user", JSON.stringify(updatedUser));
                      calculateProfileCompletion(updatedUser);
                      setNotification({
                        type: "success",
                        message: "Project details saved successfully!",
                        isVisible: true,
                      });
                      setActiveModal(null);
                    } catch (error) {
                      console.error("Error saving:", error);
                      setNotification({
                        type: "error",
                        message: "Failed to save project details",
                        isVisible: true,
                      });
                    }
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Internships Modal */}
      {activeModal === "internships" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Internships</h2>
                  <p className="text-gray-600">
                    Show your professional learnings
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">Company name</label>
                  <input
                    type="text"
                    value={modalData.companyName || ""}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        companyName: e.target.value,
                      })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter the name of the company"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">
                    Internship duration
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={modalData.startMonth || ""}
                      onChange={(e) =>
                        setModalData({
                          ...modalData,
                          startMonth: e.target.value,
                        })
                      }
                      className="p-3 border rounded-lg"
                    >
                      <option value=""></option>
                      {[
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                      ].map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={modalData.startYear || ""}
                      onChange={(e) =>
                        setModalData({
                          ...modalData,
                          startYear: e.target.value,
                        })
                      }
                      className="p-3 border rounded-lg"
                      placeholder="Year"
                    />
                  </div>
                  <p className="text-center text-gray-500 text-sm my-2">to</p>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={modalData.endMonth || ""}
                      onChange={(e) =>
                        setModalData({ ...modalData, endMonth: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                    >
                      <option value=""></option>
                      {[
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                      ].map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={modalData.endYear || ""}
                      onChange={(e) =>
                        setModalData({ ...modalData, endYear: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                      placeholder="Year"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-2">
                    Describe what you did during internship
                  </label>
                  <textarea
                    value={modalData.description || ""}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        description: e.target.value,
                      })
                    }
                    className="w-full p-3 border rounded-lg"
                    rows={4}
                    maxLength={1000}
                    placeholder="Enter the responsibilities you held, anything you accomplished or learned while serving in your internship"
                  />
                  <p className="text-xs text-gray-500 text-right">
                    {(modalData.description || "").length}/1000
                  </p>
                </div>
                <div>
                  <label className="block font-medium mb-2">
                    Key skills (optional)
                  </label>
                  <input
                    type="text"
                    value={modalData.skills || ""}
                    onChange={(e) =>
                      setModalData({ ...modalData, skills: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="Enter the skills you used in this role"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-blue-600 px-6 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const existing: any[] = Array.isArray(user?.internships)
                      ? user.internships
                      : user?.internships &&
                          typeof user.internships === "object" &&
                          user.internships.companyName
                        ? [user.internships]
                        : [];
                    const editIdx = modalData._editIndex;
                    const { _editIndex, ...cleanData } = modalData;
                    const updated =
                      editIdx !== undefined
                        ? existing.map((e, i) =>
                            i === editIdx ? cleanData : e,
                          )
                        : [...existing, cleanData];
                    try {
                      const res = await apiFetch(
                        `${API_ENDPOINTS.BASE_URL}/profile/save`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            email: user?.email,
                            internships: updated,
                          }),
                        },
                      );
                      if (!res.ok) throw new Error("Save failed");
                      const updatedUser = { ...user, internships: updated };
                      setUser(updatedUser);
                      localStorage.setItem("user", JSON.stringify(updatedUser));
                      calculateProfileCompletion(updatedUser);
                      setNotification({
                        type: "success",
                        message: "Internship details saved successfully!",
                        isVisible: true,
                      });
                      setActiveModal(null);
                    } catch (error) {
                      console.error("Error saving:", error);
                      setNotification({
                        type: "error",
                        message: "Failed to save internship details",
                        isVisible: true,
                      });
                    }
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certifications Modal */}
      {activeModal === "certifications" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Certification</h2>
                  <p className="text-gray-600">
                    Add details of your certification. You can add up to 10 in
                    your profile.
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">
                    Certification name
                  </label>
                  <input
                    type="text"
                    value={modalData.certificationName || ""}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        certificationName: e.target.value,
                      })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="Please enter your certification name"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">
                    Certification completion ID
                  </label>
                  <input
                    type="text"
                    value={modalData.completionId || ""}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        completionId: e.target.value,
                      })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="Please mention your course completion ID"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">
                    Certification URL
                  </label>
                  <input
                    type="text"
                    value={modalData.certificationUrl || ""}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        certificationUrl: e.target.value,
                      })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="Please mention your completion URL"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">
                    Certification validity
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={modalData.startMonth || ""}
                      onChange={(e) =>
                        setModalData({
                          ...modalData,
                          startMonth: e.target.value,
                        })
                      }
                      className="p-3 border rounded-lg"
                    >
                      <option value="">Month</option>
                      {[
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                      ].map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={modalData.startYear || ""}
                      onChange={(e) =>
                        setModalData({
                          ...modalData,
                          startYear: e.target.value,
                        })
                      }
                      className="p-3 border rounded-lg"
                      placeholder="Year"
                    />
                  </div>
                  <p className="text-center text-gray-500 text-sm my-2">to</p>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={modalData.endMonth || ""}
                      onChange={(e) =>
                        setModalData({ ...modalData, endMonth: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                      disabled={modalData.noExpiry}
                    >
                      <option value="">Month</option>
                      {[
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                      ].map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={modalData.endYear || ""}
                      onChange={(e) =>
                        setModalData({ ...modalData, endYear: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                      placeholder="Year"
                      disabled={modalData.noExpiry}
                    />
                  </div>
                  <label className="flex items-center mt-3">
                    <input
                      type="checkbox"
                      checked={modalData.noExpiry || false}
                      onChange={(e) =>
                        setModalData({
                          ...modalData,
                          noExpiry: e.target.checked,
                          endMonth: "",
                          endYear: "",
                        })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">
                      This certification does not expire
                    </span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-blue-600 px-6 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const updatedUser = { ...user, certifications: modalData };
                    setUser(updatedUser);
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                    calculateProfileCompletion(updatedUser);
                    try {
                      const res = await apiFetch(
                        `${API_ENDPOINTS.BASE_URL}/profile/save`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            email: user?.email,
                            certifications: modalData,
                          }),
                        },
                      );
                      if (res.ok) {
                        setNotification({
                          type: "success",
                          message: "Certification saved successfully!",
                          isVisible: true,
                        });
                      } else {
                        setNotification({
                          type: "error",
                          message: "Failed to save certification",
                          isVisible: true,
                        });
                      }
                    } catch (error) {
                      console.error("Error saving:", error);
                      setNotification({
                        type: "error",
                        message: "Failed to save certification",
                        isVisible: true,
                      });
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Awards Modal */}
      {activeModal === "awards" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Awards</h2>
                  <p className="text-gray-600">
                    Talk about any special recognitions that you received
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <textarea
                value={modalData}
                onChange={(e) => setModalData(e.target.value)}
                className="w-full p-3 border rounded-lg"
                rows={6}
                placeholder="Enter your awards"
              />
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-blue-600 px-6 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const updatedUser = { ...user, awards: modalData };
                    setUser(updatedUser);
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                    calculateProfileCompletion(updatedUser);
                    try {
                      await apiFetch(`${API_ENDPOINTS.BASE_URL}/profile/save`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          email: user?.email,
                          awards: modalData,
                        }),
                      });
                    } catch (error) {
                      console.error("Error saving:", error);
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Club & Committees Modal */}
      {activeModal === "clubsCommittees" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Club & committees</h2>
                  <p className="text-gray-600">
                    Showcase your leadership skills by adding position of
                    responsibilities that you have held
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">
                    Club or committee name
                  </label>
                  <input
                    type="text"
                    value={modalData.clubName || ""}
                    onChange={(e) =>
                      setModalData({ ...modalData, clubName: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="Eg. E-Cell"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">
                    Designation/Position of responsibility
                  </label>
                  <input
                    type="text"
                    value={modalData.designation || ""}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        designation: e.target.value,
                      })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="Eg. Head boy"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">
                    Associate with education (optional)
                  </label>
                  <select
                    value={modalData.associatedEducation || ""}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        associatedEducation: e.target.value,
                      })
                    }
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">Select an option</option>
                    <option>College</option>
                    <option>School</option>
                    <option>University</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-2">Duration</label>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={modalData.startMonth || ""}
                      onChange={(e) =>
                        setModalData({
                          ...modalData,
                          startMonth: e.target.value,
                        })
                      }
                      className="p-3 border rounded-lg"
                    >
                      <option value=""></option>
                      {[
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                      ].map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={modalData.startYear || ""}
                      onChange={(e) =>
                        setModalData({
                          ...modalData,
                          startYear: e.target.value,
                        })
                      }
                      className="p-3 border rounded-lg"
                      placeholder="Year"
                    />
                  </div>
                  <p className="text-center text-gray-500 text-sm my-2">to</p>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={modalData.endMonth || ""}
                      onChange={(e) =>
                        setModalData({ ...modalData, endMonth: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                      disabled={modalData.currentlyWorking}
                    >
                      <option value=""></option>
                      {[
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                      ].map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={modalData.endYear || ""}
                      onChange={(e) =>
                        setModalData({ ...modalData, endYear: e.target.value })
                      }
                      className="p-3 border rounded-lg"
                      placeholder="Year"
                      disabled={modalData.currentlyWorking}
                    />
                  </div>
                  <label className="flex items-center mt-3">
                    <input
                      type="checkbox"
                      checked={modalData.currentlyWorking || false}
                      onChange={(e) =>
                        setModalData({
                          ...modalData,
                          currentlyWorking: e.target.checked,
                          endMonth: "",
                          endYear: "",
                        })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">
                      I am currently working in this role
                    </span>
                  </label>
                </div>
                <div>
                  <label className="block font-medium mb-2">Description</label>
                  <textarea
                    value={modalData.description || ""}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        description: e.target.value,
                      })
                    }
                    className="w-full p-3 border rounded-lg"
                    rows={4}
                    maxLength={1000}
                    placeholder="Describe your responsibilities and experiences at this position"
                  />
                  <p className="text-xs text-gray-500 text-right">
                    {(modalData.description || "").length}/1000
                  </p>
                </div>
                <div>
                  <label className="block font-medium mb-2">
                    Media (optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Add media to support your work
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="club-media-upload"
                      accept=".doc,.docx,.pdf,.rtf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.size <= 2 * 1024 * 1024) {
                          setModalData({
                            ...modalData,
                            mediaFile: file.name,
                            mediaFileObj: file,
                          });
                        } else if (file && file.size > 2 * 1024 * 1024) {
                          setNotification({
                            type: "error",
                            message: "File size must be less than 2MB",
                            isVisible: true,
                          });
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("club-media-upload")?.click()
                      }
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                    >
                      Choose File
                    </button>
                    {modalData.mediaFile && (
                      <span className="text-sm text-gray-600">
                        {modalData.mediaFile}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Supported format: DOC, DOCx, PDF, RTF, PNG, JPG | Maximum
                    file size: 2 MB
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-blue-600 px-6 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const { mediaFileObj, ...dataToSave } = modalData;
                    const updatedUser = {
                      ...user,
                      clubsCommittees: dataToSave,
                    };
                    setUser(updatedUser);
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                    calculateProfileCompletion(updatedUser);
                    try {
                      await apiFetch(`${API_ENDPOINTS.BASE_URL}/profile/save`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          email: user?.email,
                          clubsCommittees: dataToSave,
                        }),
                      });
                      setNotification({
                        type: "success",
                        message:
                          "Club & committees details saved successfully!",
                        isVisible: true,
                      });
                    } catch (error) {
                      console.error("Error saving:", error);
                      setNotification({
                        type: "error",
                        message: "Failed to save club & committees details",
                        isVisible: true,
                      });
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Competitive Exams Modal */}
      {activeModal === "competitiveExams" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Competitive exams</h2>
                  <p className="text-gray-600">
                    Add details of competitive exams you have taken to enhance
                    your profile.
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">Exam name</label>
                  <select
                    value={modalData.examName || ""}
                    onChange={(e) =>
                      setModalData({ ...modalData, examName: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">Select Exam</option>
                    <option>TOEFL</option>
                    <option>GMAT</option>
                    <option>GRE</option>
                    <option>SAT</option>
                    <option>IELTS</option>
                    <option>CAT</option>
                    <option>GATE</option>
                    <option>JEE</option>
                    <option>NEET</option>
                    <option>UPSC</option>
                    <option>SSC</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium mb-2">
                      Score / Rank (optional)
                    </label>
                    <input
                      type="text"
                      value={modalData.score || ""}
                      onChange={(e) =>
                        setModalData({ ...modalData, score: e.target.value })
                      }
                      className="w-full p-3 border rounded-lg"
                      placeholder="e.g. 320, AIR 245"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-2">
                      Year (optional)
                    </label>
                    <input
                      type="text"
                      value={modalData.year || ""}
                      onChange={(e) =>
                        setModalData({ ...modalData, year: e.target.value })
                      }
                      className="w-full p-3 border rounded-lg"
                      placeholder="e.g. 2023"
                    />
                  </div>
                </div>
                {/* Already added exams */}
                {(modalData._list || []).length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Added exams
                    </p>
                    <div className="space-y-2">
                      {(modalData._list as any[]).map(
                        (exam: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {exam.examName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {[
                                  exam.score && `Score: ${exam.score}`,
                                  exam.year && `Year: ${exam.year}`,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                setModalData({
                                  ...modalData,
                                  _list: (modalData._list as any[]).filter(
                                    (_: any, i: number) => i !== idx,
                                  ),
                                })
                              }
                              className="text-red-400 hover:text-red-600 text-sm font-bold"
                            >
                              ×
                            </button>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-blue-600 px-6 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!modalData.examName) return;
                    const existing: any[] = modalData._list || [];
                    const editIdx = modalData._editIndex;
                    const entry = {
                      examName: modalData.examName,
                      score: modalData.score || "",
                      year: modalData.year || "",
                    };
                    const updated =
                      editIdx !== undefined
                        ? existing.map((e: any, i: number) =>
                            i === editIdx ? entry : e,
                          )
                        : [...existing, entry];
                    setModalData({
                      _list: updated,
                      examName: "",
                      score: "",
                      year: "",
                    });
                  }}
                  className="border border-blue-600 text-blue-600 px-6 py-2 rounded-full hover:bg-blue-50"
                >
                  + Add Exam
                </button>
                <button
                  onClick={async () => {
                    const existing: any[] = modalData._list || [];
                    const finalList = modalData.examName
                      ? [
                          ...existing,
                          {
                            examName: modalData.examName,
                            score: modalData.score || "",
                            year: modalData.year || "",
                          },
                        ]
                      : existing;
                    if (finalList.length === 0) {
                      setActiveModal(null);
                      return;
                    }
                    const updatedUser = {
                      ...user,
                      competitiveExams: finalList,
                    };
                    setUser(updatedUser);
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                    calculateProfileCompletion(updatedUser);
                    try {
                      const res = await apiFetch(
                        `${API_ENDPOINTS.BASE_URL}/profile/save`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            email: user?.email,
                            competitiveExams: finalList,
                          }),
                        },
                      );
                      if (res.ok) {
                        setNotification({
                          type: "success",
                          message: "Competitive exams saved successfully!",
                          isVisible: true,
                        });
                      } else {
                        setNotification({
                          type: "error",
                          message: "Failed to save competitive exams",
                          isVisible: true,
                        });
                      }
                    } catch (error) {
                      console.error("Error saving:", error);
                      setNotification({
                        type: "error",
                        message: "Failed to save competitive exams",
                        isVisible: true,
                      });
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Academic Achievements Modal */}
      {activeModal === "academicAchievements" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Academic achievements
                  </h2>
                  <p className="text-gray-600">
                    Talk about any academic achievement whether in college or
                    school that deserves a mention
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <textarea
                value={modalData}
                onChange={(e) => setModalData(e.target.value)}
                className="w-full p-3 border rounded-lg"
                rows={6}
                placeholder="Enter your academic achievements"
              />
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-blue-600 px-6 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const updatedUser = {
                      ...user,
                      academicAchievements: modalData,
                    };
                    setUser(updatedUser);
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                    calculateProfileCompletion(updatedUser);
                    try {
                      await apiFetch(`${API_ENDPOINTS.BASE_URL}/profile/save`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          email: user?.email,
                          academicAchievements: modalData,
                        }),
                      });
                    } catch (error) {
                      console.error("Error saving:", error);
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Education College Modal */}
      {activeModal === "educationCollege" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    College/University Education
                  </h2>
                  <p className="text-gray-600">
                    Adding your educational details help recruiters know your
                    value as a potential candidate
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">
                    College/University Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={modalData.college || ""}
                      onChange={(e) => {
                        setModalData({ ...modalData, college: e.target.value });
                        setCollegeSearch(e.target.value);
                        setShowCollegeDropdown(true);
                      }}
                      onFocus={() => setShowCollegeDropdown(true)}
                      className="w-full p-3 border rounded-lg"
                      placeholder="Type college name..."
                    />
                    {showCollegeDropdown && colleges.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-t-0 rounded-b-lg shadow-lg max-h-64 overflow-y-auto z-50">
                        {colleges
                          .filter(
                            (c: any) =>
                              !modalData.college ||
                              c.name
                                .toLowerCase()
                                .includes(modalData.college.toLowerCase()),
                          )
                          .slice(0, 15)
                          .map((college: any) => (
                            <div
                              key={college.id}
                              onClick={() => {
                                setModalData({
                                  ...modalData,
                                  college: college.name,
                                });
                                setShowCollegeDropdown(false);
                              }}
                              className="p-3 hover:bg-blue-50 cursor-pointer border-b text-sm"
                            >
                              {college.name}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-2">Degree</label>
                  <select
                    value={modalData.degree || ""}
                    onChange={(e) =>
                      setModalData({ ...modalData, degree: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">Select Degree</option>
                    <option>High School Diploma</option>
                    <option>Associate's Degree</option>
                    <option>Bachelor's Degree</option>
                    <option>Bachelor</option>
                    <option>Master's Degree</option>
                    <option>Post Graduate</option>
                    <option>PhD</option>
                    <option>Doctorate</option>
                    <option>Professional Certification</option>
                    <option>Diploma</option>
                    <option>Certificate</option>
                    <option>Vocational Training</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-2">Course Type</label>
                  <select
                    value={modalData.courseType || ""}
                    onChange={(e) =>
                      setModalData({ ...modalData, courseType: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">Select Course Type</option>
                    <option>Full Time</option>
                    <option>Part Time</option>
                    <option>Distance Learning</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-2">
                    Percentage/CGPA
                  </label>
                  <input
                    type="text"
                    value={modalData.percentage || ""}
                    onChange={(e) =>
                      setModalData({ ...modalData, percentage: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="e.g., 85% or 8.5 CGPA"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Passing Year</label>
                  <input
                    type="text"
                    value={modalData.passingYear || ""}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        passingYear: e.target.value,
                      })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="YYYY"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-blue-600 px-6 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const updatedUser = {
                      ...user,
                      educationCollege: modalData,
                    };
                    setUser(updatedUser);
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                    calculateProfileCompletion(updatedUser);
                    try {
                      await apiFetch(`${API_ENDPOINTS.BASE_URL}/profile/save`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          email: user?.email,
                          educationCollege: modalData,
                        }),
                      });
                    } catch (error) {
                      console.error("Error saving:", error);
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Education Class 12 Modal */}
      {activeModal === "educationClass12" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Class XII Details</h2>
                  <p className="text-gray-600">
                    Adding your educational details help recruiters know your
                    value as a potential candidate
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">
                    Examination board
                  </label>
                  <select
                    value={modalData.board || ""}
                    onChange={(e) =>
                      setModalData({ ...modalData, board: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">Select Board Name</option>
                    <option>CBSE</option>
                    <option>ICSE</option>
                    <option>State Board</option>
                    <option>IB</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-2">
                    Medium of study
                  </label>
                  <select
                    value={modalData.medium || ""}
                    onChange={(e) =>
                      setModalData({ ...modalData, medium: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">Select Medium</option>
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Tamil</option>
                    <option>Telugu</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-2">Percentage</label>
                  <input
                    type="text"
                    value={modalData.percentage || ""}
                    onChange={(e) =>
                      setModalData({ ...modalData, percentage: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="e.g. 95"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Passing year</label>
                  <input
                    type="text"
                    value={modalData.passingYear || ""}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        passingYear: e.target.value,
                      })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="YYYY"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-blue-600 px-6 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const updatedUser = {
                      ...user,
                      educationClass12: modalData,
                    };
                    setUser(updatedUser);
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                    calculateProfileCompletion(updatedUser);
                    try {
                      await apiFetch(`${API_ENDPOINTS.BASE_URL}/profile/save`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          email: user?.email,
                          educationClass12: modalData,
                        }),
                      });
                    } catch (error) {
                      console.error("Error saving:", error);
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Education Class 10 Modal */}
      {activeModal === "educationClass10" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Class X Details</h2>
                  <p className="text-gray-600">
                    Adding your educational details help recruiters know your
                    value as a potential candidate
                  </p>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">
                    Examination board
                  </label>
                  <select
                    value={modalData.board || ""}
                    onChange={(e) =>
                      setModalData({ ...modalData, board: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">Select Board Name</option>
                    <option>CBSE</option>
                    <option>ICSE</option>
                    <option>State Board</option>
                    <option>IB</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-2">
                    Medium of study
                  </label>
                  <select
                    value={modalData.medium || ""}
                    onChange={(e) =>
                      setModalData({ ...modalData, medium: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">Select Medium</option>
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Tamil</option>
                    <option>Telugu</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-2">Percentage</label>
                  <input
                    type="text"
                    value={modalData.percentage || ""}
                    onChange={(e) =>
                      setModalData({ ...modalData, percentage: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="e.g. 95"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2">Passing year</label>
                  <input
                    type="text"
                    value={modalData.passingYear || ""}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        passingYear: e.target.value,
                      })
                    }
                    className="w-full p-3 border rounded-lg"
                    placeholder="YYYY"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-blue-600 px-6 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const updatedUser = {
                      ...user,
                      educationClass10: modalData,
                    };
                    setUser(updatedUser);
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                    calculateProfileCompletion(updatedUser);
                    try {
                      await apiFetch(`${API_ENDPOINTS.BASE_URL}/profile/save`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          email: user?.email,
                          educationClass10: modalData,
                        }),
                      });
                    } catch (error) {
                      console.error("Error saving:", error);
                    }
                    setActiveModal(null);
                  }}
                  className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md h-96 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="border-b border-gray-200 p-4 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {(
                    selectedConversation?.participants?.find(
                      (p: any) => p?.email !== user?.email,
                    )?.name?.[0] || "U"
                  ).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedConversation?.participants?.find(
                      (p: any) => p?.email !== user?.email,
                    )?.name ||
                      selectedConversation?.participants?.find(
                        (p: any) => p?.email !== user?.email,
                      )?.email ||
                      selectedConversation?.otherUser?.name ||
                      "Unknown"}
                  </h3>
                  <p className="text-xs text-gray-500">Active now</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedConversation(null);
                  setMessages([]);
                  setChatMessage("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-white space-y-3">
              {loadingChats ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-400 text-sm">
                    Loading messages...
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">No messages yet</p>
                    <p className="text-gray-300 text-xs mt-1">
                      Start the conversation!
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg: any, idx: number) => {
                  const isOwn =
                    msg.senderId === user?.id ||
                    msg.senderEmail === user?.email;
                  return (
                    <div
                      key={idx}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          isOwn
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-gray-100 text-gray-900 rounded-bl-none"
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p
                          className={`text-xs mt-1 ${isOwn ? "text-blue-100" : "text-gray-500"}`}
                        >
                          {new Date(
                            msg.createdAt || msg.timestamp,
                          ).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      sendChatMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatMessage.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CandidateDashboardPage;
