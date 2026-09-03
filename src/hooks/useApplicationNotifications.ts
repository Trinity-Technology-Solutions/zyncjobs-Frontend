import { useState, useEffect, useCallback, useRef } from 'react';
import { API_ENDPOINTS } from '../config/env';

export interface AppNotification {
  id: string;
  applicationId: string;
  jobTitle: string;
  company: string;
  oldStatus: string;
  newStatus: string;
  message: string;
  timestamp: number;
  read: boolean;
  type?: 'application_status' | 'interview';
  interviewDate?: string;
  interviewTime?: string;
  interviewMode?: string;
}

const STATUS_KEY = 'candidate_app_statuses';
const NOTIF_KEY = 'candidate_notifications';
const CLEARED_AT_KEY = 'candidate_notifications_cleared_at';
const DISMISSED_APP_IDS_KEY = 'candidate_dismissed_app_ids';
const POLL_INTERVAL = 30000; // 30 seconds

/** Returns the epoch ms when the user last pressed "Clear All", or 0 if never. */
function getClearedAt(): number {
  return parseInt(localStorage.getItem(CLEARED_AT_KEY) || '0', 10);
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'reviewed':    return 'Your application is being reviewed by the employer';
    case 'shortlisted': return '🎉 Congratulations! You have been shortlisted';
    case 'hired':       return '🎊 Amazing! You got the job offer';
    case 'rejected':    return 'Your application was not selected this time';
    case 'withdrawn':   return 'You have withdrawn this application';
    default:            return `Application status updated to ${status}`;
  }
}

function loadStored(): AppNotification[] {
  try {
    const clearedAt = getClearedAt();
    const all: AppNotification[] = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
    // Drop any notification that existed before the last "Clear All"
    return all.filter(n => n.timestamp > clearedAt);
  } catch { return []; }
}

function persist(notifs: AppNotification[]): AppNotification[] {
  const trimmed = notifs.slice(0, 50);
  localStorage.setItem(NOTIF_KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function useApplicationNotifications(userEmail: string | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>(loadStored);
  const [toast, setToast] = useState<AppNotification | null>(null);
  const prevStatusesRef = useRef<Record<string, string>>({});
  const isFirstPollRef = useRef(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Primary source: poll /applications/candidate/:email for status diffs ──
  const pollApplications = useCallback(async () => {
    if (!userEmail) return;
    try {
      const res = await fetch(
        `${API_ENDPOINTS.BASE_URL}/applications/candidate/${encodeURIComponent(userEmail)}`
      );
      if (!res.ok) return;
      const data: any[] = await res.json();

      const currentStatuses: Record<string, string> = {};
      data.forEach(app => { if (app?._id) currentStatuses[app._id] = app.status; });

      if (isFirstPollRef.current) {
        // First load: seed from localStorage or current state — no notifications
        const saved = localStorage.getItem(STATUS_KEY);
        prevStatusesRef.current = saved ? JSON.parse(saved) : currentStatuses;
        isFirstPollRef.current = false;
        localStorage.setItem(STATUS_KEY, JSON.stringify(currentStatuses));
        return;
      }

      const prev = prevStatusesRef.current;
      const newNotifs: AppNotification[] = [];

      const dismissedAppIds: Set<string> = new Set(JSON.parse(localStorage.getItem(DISMISSED_APP_IDS_KEY) || '[]'));
      data.forEach(app => {
        if (!app?._id || !app?.jobId) return;
        const prevStatus = prev[app._id];
        const currStatus = app.status;
        if (prevStatus && prevStatus !== currStatus && !dismissedAppIds.has(app._id + '_' + currStatus)) {
          newNotifs.push({
            id: `${app._id}_${currStatus}_${Date.now()}`,
            applicationId: app._id,
            jobTitle: app.jobId?.jobTitle || 'Job',
            company: app.jobId?.company || '',
            oldStatus: prevStatus,
            newStatus: currStatus,
            message: getStatusMessage(currStatus),
            timestamp: Date.now(),
            read: false,
          });
        }
      });

      if (newNotifs.length > 0) {
        setNotifications(prev => persist([...newNotifs, ...prev]));
        setToast(newNotifs[0]);
      }

      prevStatusesRef.current = currentStatuses;
      localStorage.setItem(STATUS_KEY, JSON.stringify(currentStatuses));
    } catch {
      // Silently fail
    }
  }, [userEmail]);

  // ── Secondary source: pull real DB notifications from backend ──
  const isFirstDbFetchRef = useRef(true);
  const fetchDbNotifications = useCallback(async () => {
    if (!userEmail) return;
    try {
      const res = await fetch(
        `${API_ENDPOINTS.BASE_URL}/notifications/candidate/${encodeURIComponent(userEmail)}`
      );
      if (!res.ok) return;
      const dbNotifs: any[] = await res.json();

      // Only keep application_status and interview notifications created AFTER the last "Clear All"
      const clearedAt = getClearedAt();

      const converted: AppNotification[] = dbNotifs
        .filter(n => n.type === 'application_status' || n.type === 'interview')
        .map(n => {
          const isInterview = n.type === 'interview';
          // Parse interview details from message if available
          let interviewDate = '';
          let interviewTime = '';
          let interviewMode = '';
          if (isInterview) {
            // Message format: "Your interview for "Job Title" at Company has been scheduled for Date at Time (Mode)"
            const dateMatch = n.message.match(/scheduled for ([^ at]+) at/);
            const timeMatch = n.message.match(/at ([^(]+) \(/);
            const modeMatch = n.message.match(/\(([^)]+)\)/);
            if (dateMatch) interviewDate = dateMatch[1].trim();
            if (timeMatch) interviewTime = timeMatch[1].trim();
            if (modeMatch) interviewMode = modeMatch[1].trim();
          }
          return {
            id: `db_${n.id}`,
            applicationId: n.link?.split('/').pop() || '',
            jobTitle: isInterview ? n.title : n.title,
            company: '',
            oldStatus: '',
            newStatus: '',
            message: n.message,
            timestamp: new Date(n.createdAt).getTime(),
            read: n.read ?? false,
            type: n.type,
            interviewDate,
            interviewTime,
            interviewMode,
          };
        })
        // 🔑 Skip any notification that was already visible before the user cleared all
        .filter(n => n.timestamp > clearedAt);

      if (converted.length === 0) return;

      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const newOnes = converted.filter(n => !existingIds.has(n.id));
        if (newOnes.length === 0) return prev;
        // On first load, restore read state silently — no toast spam
        if (isFirstDbFetchRef.current) {
          isFirstDbFetchRef.current = false;
          return persist([...newOnes, ...prev]);
        }
        // Show toast for new unread ones
        const firstUnread = newOnes.find(n => !n.read);
        if (firstUnread) setToast(firstUnread);
        return persist([...newOnes, ...prev]);
      });
    } catch {
      // Silently fail
    }
  }, [userEmail]);

  useEffect(() => {
    if (!userEmail) return;
    // Run both immediately
    pollApplications();
    fetchDbNotifications();
    // Poll every 30s
    const interval = setInterval(() => {
      pollApplications();
      fetchDbNotifications();
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [userEmail, pollApplications, fetchDbNotifications]);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => persist(prev.map(n => ({ ...n, read: true }))));
    // Sync to backend so notifications stay read after refresh/poll
    if (userEmail) {
      try {
        await fetch(
          `${API_ENDPOINTS.BASE_URL}/notifications/user/${encodeURIComponent(userEmail)}/read-all`,
          { method: 'PUT' }
        );
      } catch {
        // Silently fail — local read state is enough
      }
    }
  }, [userEmail]);

  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => persist(prev.map(n => n.id === id ? { ...n, read: true } : n)));
    // Sync to backend — strip frontend-only "db_" prefix if present
    const backendId = id.startsWith('db_') ? id.slice(3) : id;
    if (userEmail && backendId) {
      try {
        await fetch(
          `${API_ENDPOINTS.BASE_URL}/notifications/${backendId}/read`,
          { method: 'PUT' }
        );
      } catch {
        // Silently fail — local read state is enough
      }
    }
  }, [userEmail]);

  const clearToast = useCallback(() => setToast(null), []);

  const clearAll = useCallback(async () => {
    // Optimistic clear — remove all notifications from state immediately
    setNotifications([]);
    localStorage.removeItem(NOTIF_KEY);
    localStorage.removeItem(STATUS_KEY);
    localStorage.removeItem(DISMISSED_APP_IDS_KEY);
    const clearedAtMs = Date.now();
    localStorage.setItem(CLEARED_AT_KEY, clearedAtMs.toString());
    prevStatusesRef.current = {};

    // Permanently delete notifications on the backend so they never reappear
    // after page refresh, logout/login, or any other re-fetch.
    if (userEmail) {
      try {
        const res = await fetch(
          `${API_ENDPOINTS.BASE_URL}/notifications/user/email/${encodeURIComponent(userEmail)}/clear-all`,
          { method: 'DELETE' }
        );
        if (!res.ok) {
          console.error('Clear all API failed:', res.status, await res.text().catch(() => ''));
        }
      } catch (e) {
        console.error('Clear all network error:', e);
      }
    }
  }, [userEmail]);

  const dismissNotification = useCallback(async (id: string) => {
    const notif = notifications.find(n => n.id === id);
    setNotifications(prev => {
      const next = prev.filter(n => n.id !== id);
      persist(next);
      return next;
    });
    // Track application ID so pollApplications never recreates this status change
    if (notif?.applicationId) {
      const dismissed = new Set(JSON.parse(localStorage.getItem(DISMISSED_APP_IDS_KEY) || '[]'));
      dismissed.add(notif.applicationId + '_' + notif.newStatus);
      localStorage.setItem(DISMISSED_APP_IDS_KEY, JSON.stringify([...dismissed]));
    }
    // Delete from backend — strip frontend-only "db_" prefix if present
    const backendId = id.startsWith('db_') ? id.slice(3) : id;
    if (userEmail) {
      try {
        await fetch(
          `${API_ENDPOINTS.BASE_URL}/notifications/user/email/${encodeURIComponent(userEmail)}/dismiss/${backendId}`,
          { method: 'DELETE' }
        );
      } catch {
        // Silently fail — local removal is enough
      }
    }
  }, [userEmail, notifications]);

  return { notifications, unreadCount, toast, clearToast, markRead, markAllRead, clearAll, dismissNotification };
}
