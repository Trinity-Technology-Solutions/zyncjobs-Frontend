import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../api/apiFetch';
import { API_ENDPOINTS, config } from '../config/env';
import { io, Socket } from 'socket.io-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AlertCriteria {
  keywords: string[];
  skills: string[];
  location: string;
  country: string;
  experienceLevel: string;
  salaryMin?: number;
  salaryMax?: number;
  workType: string[];
  category: string;
}

export interface JobAlert {
  _id: string;
  alertName: string;
  criteria: AlertCriteria;
  frequency: 'instant' | 'daily' | 'weekly';
  isActive: boolean;
  totalJobsSent: number;
  lastSent?: string;
  lastMatched?: string;
  createdAt: string;
}

export interface AlertNotification {
  _id: string;
  alertId: string;
  alertName: string;
  jobId: string;
  jobTitle: string;
  company: string;
  companyLogo?: string;
  location: string;
  salary?: any;
  matchedSkills: string[];
  matchedKeywords: string[];
  postedAt: string;
  status: 'unread' | 'read' | 'dismissed';
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const POLL_MS = 60_000;
const UNREAD_KEY = 'job_alert_unread_count';

function persistUnread(n: number) {
  localStorage.setItem(UNREAD_KEY, String(n));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useJobAlerts(userEmail: string | undefined) {
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(() =>
    parseInt(localStorage.getItem(UNREAD_KEY) || '0', 10)
  );
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const previousNotificationsRef = useRef<AlertNotification[]>([]);
  const previousUnreadCountRef = useRef<number>(0);

  // ── Fetch alerts ─────────────────────────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    if (!userEmail) return;
    setAlertsLoading(true);
    try {
      const res = await apiFetch(
        `${API_ENDPOINTS.BASE_URL}/job-alerts/user/${encodeURIComponent(userEmail)}`
      );
      if (res.ok) {
        const data = await res.json();
        setAlerts(Array.isArray(data) ? data : data.alerts ?? []);
      }
    } catch { /* silent */ } finally {
      setAlertsLoading(false);
    }
  }, [userEmail]);

  // ── Fetch notifications — always replaces list, dedup by _id ─────────────────
  const fetchNotifications = useCallback(async () => {
    if (!userEmail) return;
    setNotifLoading(true);
    try {
      const res = await apiFetch(
        `${API_ENDPOINTS.BASE_URL}/job-alerts/notifications/${encodeURIComponent(userEmail)}`
      );
      if (!res.ok) return;
      const raw = await res.json();
      const list: AlertNotification[] = Array.isArray(raw) ? raw : raw.notifications ?? [];

      // Deduplicate by _id (server is source of truth)
      const seen = new Set<string>();
      const deduped = list.filter(n => {
        if (seen.has(n._id)) return false;
        seen.add(n._id);
        return true;
      });

      const active = deduped.filter(n => n.status !== 'dismissed');
      setNotifications(active);
      const unread = active.filter(n => n.status === 'unread').length;
      setUnreadCount(unread);
      persistUnread(unread);
    } catch { /* silent */ } finally {
      setNotifLoading(false);
    }
  }, [userEmail]);

  // ── Create alert ──────────────────────────────────────────────────────────────
  const createAlert = useCallback(
    async (
      payload: Omit<JobAlert, '_id' | 'totalJobsSent' | 'createdAt' | 'isActive'>
    ): Promise<JobAlert> => {
      if (!userEmail) throw new Error('Not authenticated');
      const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/job-alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, userEmail }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? err.message ?? 'Failed to create alert');
      }
      const created: JobAlert = await res.json();
      setAlerts(prev => [created, ...prev]);
      return created;
    },
    [userEmail]
  );

  // ── Update alert ──────────────────────────────────────────────────────────────
  const updateAlert = useCallback(async (id: string, payload: Partial<JobAlert>): Promise<void> => {
    const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/job-alerts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? err.message ?? 'Failed to update alert');
    }
    const updated: JobAlert = await res.json();
    setAlerts(prev => prev.map(a => (a._id === id ? updated : a)));
  }, []);

  // ── Delete alert (optimistic) ─────────────────────────────────────────────────
  const deleteAlert = useCallback(
    async (id: string): Promise<void> => {
      setAlerts(prev => prev.filter(a => a._id !== id));
      const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/job-alerts/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        fetchAlerts(); // revert
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? err.message ?? 'Failed to delete alert');
      }
    },
    [fetchAlerts]
  );

  // ── Pause (optimistic) ────────────────────────────────────────────────────────
  const pauseAlert = useCallback(
    async (id: string): Promise<void> => {
      setAlerts(prev => prev.map(a => (a._id === id ? { ...a, isActive: false } : a)));
      const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/job-alerts/${id}/pause`, {
        method: 'PUT',
      });
      if (!res.ok) fetchAlerts();
    },
    [fetchAlerts]
  );

  // ── Resume (optimistic) ───────────────────────────────────────────────────────
  const resumeAlert = useCallback(
    async (id: string): Promise<void> => {
      setAlerts(prev => prev.map(a => (a._id === id ? { ...a, isActive: true } : a)));
      const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/job-alerts/${id}/resume`, {
        method: 'PUT',
      });
      if (!res.ok) fetchAlerts();
    },
    [fetchAlerts]
  );

  // ── Mark single notification read (optimistic + rollback) ────────────────────
  const markRead = useCallback(async (id: string): Promise<void> => {
    previousNotificationsRef.current = notifications;
    previousUnreadCountRef.current = unreadCount;
    setNotifications(prev => {
      const wasUnread = prev.find(n => n._id === id)?.status === 'unread';
      const next = prev.map(n => (n._id === id ? { ...n, status: 'read' as const } : n));
      if (wasUnread) {
        const newCount = Math.max(0, next.filter(n => n.status === 'unread').length);
        setUnreadCount(newCount);
        persistUnread(newCount);
      }
      return next;
    });
    try {
      const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/job-alerts/notifications/${id}/read`, {
        method: 'PUT',
      });
      if (!res.ok) throw new Error('Failed to mark as read');
    } catch {
      setNotifications(previousNotificationsRef.current);
      setUnreadCount(previousUnreadCountRef.current);
      persistUnread(previousUnreadCountRef.current);
    }
  }, [notifications, unreadCount]);

  // ── Mark all read (optimistic + rollback) ────────────────────────────────────
  const markAllRead = useCallback(async (): Promise<void> => {
    if (!userEmail) return;
    previousNotificationsRef.current = notifications;
    previousUnreadCountRef.current = unreadCount;
    setNotifications(prev =>
      prev.map(n => (n.status === 'unread' ? { ...n, status: 'read' as const } : n))
    );
    setUnreadCount(0);
    persistUnread(0);
    try {
      const res = await apiFetch(
        `${API_ENDPOINTS.BASE_URL}/job-alerts/notifications/${encodeURIComponent(userEmail)}/read-all`,
        { method: 'PUT' }
      );
      if (!res.ok) throw new Error('Failed to mark all as read');
    } catch {
      setNotifications(previousNotificationsRef.current);
      setUnreadCount(previousUnreadCountRef.current);
      persistUnread(previousUnreadCountRef.current);
    }
  }, [userEmail, notifications, unreadCount]);

  // ── Dismiss notification (optimistic + rollback) ──────────────────────────────
  const dismissNotification = useCallback(async (id: string): Promise<void> => {
    previousNotificationsRef.current = notifications;
    previousUnreadCountRef.current = unreadCount;
    setNotifications(prev => {
      const wasUnread = prev.find(n => n._id === id)?.status === 'unread';
      const next = prev.map(n =>
        n._id === id ? { ...n, status: 'dismissed' as const } : n
      );
      if (wasUnread) {
        const newCount = Math.max(0, next.filter(n => n.status === 'unread').length);
        setUnreadCount(newCount);
        persistUnread(newCount);
      }
      return next;
    });
    try {
      const res = await apiFetch(
        `${API_ENDPOINTS.BASE_URL}/job-alerts/notifications/${id}/dismiss`,
        { method: 'PUT' }
      );
      if (!res.ok) throw new Error('Failed to dismiss');
    } catch {
      setNotifications(previousNotificationsRef.current);
      setUnreadCount(previousUnreadCountRef.current);
      persistUnread(previousUnreadCountRef.current);
    }
  }, [notifications, unreadCount]);

  // ── Socket + polling ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userEmail) return;

    fetchAlerts();
    fetchNotifications();

    const interval = setInterval(fetchNotifications, POLL_MS);

    // Reuse existing socket infrastructure
    let socket: Socket | null = null;
    try {
      socket = io(config.SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 3,
      });
      socketRef.current = socket;
      socket.on(`job_alert_notification:${userEmail}`, fetchNotifications);
    } catch { /* socket is optional */ }

    return () => {
      clearInterval(interval);
      socket?.disconnect();
    };
  }, [userEmail]); // eslint-disable-line react-hooks/exhaustive-deps
  // fetchAlerts / fetchNotifications are stable (useCallback with stable deps)
  // but we intentionally exclude them to avoid re-subscribing the socket on
  // every render — the initial call is enough.

  return {
    alerts,
    notifications,
    unreadCount,
    alertsLoading,
    notifLoading,
    fetchAlerts,
    fetchNotifications,
    createAlert,
    updateAlert,
    deleteAlert,
    pauseAlert,
    resumeAlert,
    markRead,
    markAllRead,
    dismissNotification,
  };
}
