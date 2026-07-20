import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { alertNotifAPI, AlertNotification, alertsAPI, JobAlert } from '../api/jobAlerts';
import { config } from '../config/env';

const POLL_MS = 60_000;
const UNREAD_KEY = 'job_alert_unread_count';

function persist(n: number) {
  localStorage.setItem(UNREAD_KEY, String(n));
}

export function useJobAlertStore(userEmail: string | undefined) {
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(() =>
    parseInt(localStorage.getItem(UNREAD_KEY) || '0', 10)
  );
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!userEmail) return;
    setAlertsLoading(true);
    try {
      const data = await alertsAPI.list(userEmail);
      setAlerts(Array.isArray(data) ? data : (data as any).alerts ?? []);
    } catch { /* silent */ } finally {
      setAlertsLoading(false);
    }
  }, [userEmail]);

  const fetchNotifications = useCallback(async () => {
    if (!userEmail) return;
    setNotifLoading(true);
    try {
      const raw = await alertNotifAPI.list(userEmail);
      const list: AlertNotification[] = Array.isArray(raw) ? raw : (raw as any).notifications ?? [];
      const seen = new Set<string>();
      const deduped = list.filter(n => { if (seen.has(n._id)) return false; seen.add(n._id); return true; });
      setNotifications(deduped);
      const unread = deduped.filter(n => n.status === 'unread').length;
      setUnreadCount(unread);
      persist(unread);
    } catch { /* silent */ } finally {
      setNotifLoading(false);
    }
  }, [userEmail]);

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const createAlert = useCallback(async (
    payload: Omit<JobAlert, '_id' | 'totalJobsSent' | 'createdAt' | 'isActive'>
  ): Promise<JobAlert> => {
    if (!userEmail) throw new Error('Not authenticated');
    const created = await alertsAPI.create({ ...payload, userEmail });
    setAlerts(prev => [created, ...prev]);
    return created;
  }, [userEmail]);

  const updateAlert = useCallback(async (id: string, payload: Partial<JobAlert>): Promise<void> => {
    const updated = await alertsAPI.update(id, payload);
    setAlerts(prev => prev.map(a => a._id === id ? updated : a));
  }, []);

  const deleteAlert = useCallback(async (id: string): Promise<void> => {
    setAlerts(prev => prev.filter(a => a._id !== id)); // optimistic
    const res = await alertsAPI.remove(id);
    if (!res.ok) { fetchAlerts(); throw new Error('Failed to delete'); }
  }, [fetchAlerts]);

  const pauseAlert = useCallback(async (id: string): Promise<void> => {
    setAlerts(prev => prev.map(a => a._id === id ? { ...a, isActive: false } : a));
    const res = await alertsAPI.pause(id);
    if (!res.ok) fetchAlerts();
  }, [fetchAlerts]);

  const resumeAlert = useCallback(async (id: string): Promise<void> => {
    setAlerts(prev => prev.map(a => a._id === id ? { ...a, isActive: true } : a));
    const res = await alertsAPI.resume(id);
    if (!res.ok) fetchAlerts();
  }, [fetchAlerts]);

  const markRead = useCallback(async (id: string): Promise<void> => {
    setNotifications(prev => {
      const wasUnread = prev.find(n => n._id === id)?.status === 'unread';
      const next = prev.map(n => n._id === id ? { ...n, status: 'read' as const } : n);
      if (wasUnread) {
        const c = Math.max(0, next.filter(n => n.status === 'unread').length);
        setUnreadCount(c); persist(c);
      }
      return next;
    });
    await alertNotifAPI.markRead(id).catch(() => {});
  }, []);

  const markAllRead = useCallback(async (): Promise<void> => {
    if (!userEmail) return;
    setNotifications(prev => prev.map(n => n.status === 'unread' ? { ...n, status: 'read' as const } : n));
    setUnreadCount(0); persist(0);
    await alertNotifAPI.markAllRead(userEmail).catch(() => {});
  }, [userEmail]);

  const dismissNotification = useCallback(async (id: string): Promise<void> => {
    setNotifications(prev => {
      const wasUnread = prev.find(n => n._id === id)?.status === 'unread';
      const next = prev.map(n => n._id === id ? { ...n, status: 'dismissed' as const } : n);
      if (wasUnread) {
        const c = Math.max(0, next.filter(n => n.status === 'unread').length);
        setUnreadCount(c); persist(c);
      }
      return next;
    });
    await alertNotifAPI.dismiss(id).catch(() => {});
  }, []);

  // ── Socket + polling ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!userEmail) return;
    fetchAlerts();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_MS);
    let socket: Socket | null = null;
    try {
      socket = io(config.SOCKET_URL, { transports: ['websocket', 'polling'], reconnection: true, reconnectionAttempts: 3 });
      socketRef.current = socket;
      socket.on(`job_alert_notification:${userEmail}`, fetchNotifications);
    } catch { /* socket optional */ }
    return () => {
      clearInterval(interval);
      socket?.disconnect();
    };
  }, [userEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    alerts, notifications, unreadCount,
    alertsLoading, notifLoading,
    fetchAlerts, fetchNotifications,
    createAlert, updateAlert, deleteAlert,
    pauseAlert, resumeAlert,
    markRead, markAllRead, dismissNotification,
  };
}
