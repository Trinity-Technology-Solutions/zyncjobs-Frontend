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
}

const STATUS_KEY = 'candidate_app_statuses';
const NOTIF_KEY = 'candidate_notifications';
const POLL_INTERVAL = 30000; // 30 seconds

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
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]'); }
  catch { return []; }
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

      data.forEach(app => {
        if (!app?._id || !app?.jobId) return;
        const prevStatus = prev[app._id];
        const currStatus = app.status;
        if (prevStatus && prevStatus !== currStatus) {
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
  const fetchDbNotifications = useCallback(async () => {
    if (!userEmail) return;
    try {
      const res = await fetch(
        `${API_ENDPOINTS.BASE_URL}/notifications/candidate/${encodeURIComponent(userEmail)}`
      );
      if (!res.ok) return;
      const dbNotifs: any[] = await res.json();

      // Convert DB notifications to AppNotification shape (unread ones only as new)
      const converted: AppNotification[] = dbNotifs
        .filter(n => n.type === 'application_status')
        .map(n => ({
          id: `db_${n.id}`,
          applicationId: n.link?.split('/').pop() || '',
          jobTitle: n.title,
          company: '',
          oldStatus: '',
          newStatus: '',
          message: n.message,
          timestamp: new Date(n.createdAt).getTime(),
          read: n.read ?? false,
        }));

      if (converted.length === 0) return;

      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const truly_new = converted.filter(n => !existingIds.has(n.id) && !n.read);
        if (truly_new.length === 0) return prev;
        return persist([...truly_new, ...prev]);
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

  const markAllRead = useCallback(() => {
    setNotifications(prev => persist(prev.map(n => ({ ...n, read: true }))));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => persist(prev.map(n => n.id === id ? { ...n, read: true } : n)));
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem(NOTIF_KEY);
  }, []);

  return { notifications, unreadCount, toast, clearToast, markRead, markAllRead, clearAll };
}
