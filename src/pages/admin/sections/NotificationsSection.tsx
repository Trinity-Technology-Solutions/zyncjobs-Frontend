import React, { useState, useEffect, useCallback } from 'react';
import { Send, RefreshCw, AlertCircle, Bell, Trash2, Users, User } from 'lucide-react';
import { API_ENDPOINTS } from '../../../config/env';
import { tokenStorage } from '../../../utils/tokenStorage';
import { apiFetch } from '../../../api/apiFetch';
import AutocompleteCombobox from '../../../components/AutocompleteCombobox';

function authHeaders() {
  // Try admin token first, then access token
  const adminToken = tokenStorage.getAdmin();
  const accessToken = tokenStorage.getAccess();
  const token = adminToken || accessToken;
  
  console.log('🔔 Notifications auth - Admin token exists:', !!adminToken);
  console.log('🔔 Notifications auth - Access token exists:', !!accessToken);
  
  return { 
    'Content-Type': 'application/json', 
    ...(token ? { Authorization: `Bearer ${token}` } : {}) 
  };
}

async function authFetch(url: string, options: RequestInit = {}, onUnauthorized?: () => void) {
  try {
    console.log('🔔 Fetching notifications from:', url);
    const res = await apiFetch(url, { 
      ...options, 
      headers: { ...authHeaders(), ...(options.headers as any || {}) } 
    });
    
    console.log('🔔 Notifications response status:', res.status);
    
    if (res.status === 401) {
      console.log('🔔 Unauthorized access to notifications');
      onUnauthorized?.();
      throw new Error('UNAUTHORIZED');
    }
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('🔔 Notifications API error:', errorText);
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    
    return res.json();
  } catch (error) {
    console.error('🔔 Notifications fetch error:', error);
    throw error;
  }
}

export default function NotificationsSection({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ title: '', message: '', target: 'all', userId: '' });
  const [endpointAvailable, setEndpointAvailable] = useState(true);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      console.log('🔔 Loading notification queue from:', API_ENDPOINTS.ADMIN_NOTIFICATIONS_QUEUE);
      
      // Check if the endpoint exists
      if (!API_ENDPOINTS.ADMIN_NOTIFICATIONS_QUEUE) {
        console.warn('🔔 ADMIN_NOTIFICATIONS_QUEUE endpoint not configured');
        setError('Notification queue endpoint not configured.');
        setQueue([]);
        setEndpointAvailable(false);
        return;
      }
      
      const res = await authFetch(API_ENDPOINTS.ADMIN_NOTIFICATIONS_QUEUE, {}, onUnauthorized);
      console.log('🔔 Notification queue response:', res);
      
      const notifications = res.notifications ?? res.data ?? res ?? [];
      console.log('🔔 Parsed notifications:', notifications);
      
      setQueue(Array.isArray(notifications) ? notifications : []);
      setEndpointAvailable(true);
    } catch (e: any) {
      console.error('🔔 Failed to load notification queue:', e);
      
      if (e.message === 'UNAUTHORIZED') { 
        onUnauthorized(); 
        return; 
      }
      
      // Handle different types of errors
      if (e.message.includes('404')) {
        setError('Notification queue feature not available. The backend may not support this feature yet.');
        setEndpointAvailable(false);
      } else if (e.message.includes('500')) {
        setError('Server error loading notifications. Please try again later.');
      } else {
        setError('Failed to load notification queue. Please check your connection.');
      }
      
      setQueue([]); // Set empty array on error
    } finally { 
      setLoading(false); 
    }
  }, [onUnauthorized]);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  const broadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;
    setSending(true);
    setError('');
    setSuccess('');
    try {
      const body: any = { subject: form.title, message: form.message, userType: form.target };
      if (form.target === 'user' && form.userId) {
        // specific user — use send endpoint
        await authFetch(`${API_ENDPOINTS.BASE_URL}/admin/notifications/send`, {
          method: 'POST',
          body: JSON.stringify({ type: 'email', recipients: [form.userId], subject: form.title, message: form.message }),
        });
      } else {
        await authFetch(API_ENDPOINTS.ADMIN_NOTIFICATIONS_BROADCAST, { method: 'POST', body: JSON.stringify(body) });
      }
      setSuccess('Notification sent successfully!');
      setForm({ title: '', message: '', target: 'all', userId: '' });
      loadQueue();
    } catch { setError('Failed to send notification.'); }
    finally { setSending(false); }
  };

  const deleteNotif = (id: string) => {
    setQueue(prev => prev.filter(n => (n._id || n.id) !== id));
  };

  return (
    <div className="space-y-4">
      {/* Broadcast Form */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-purple-400" />Send Notification</h2>

        {error && <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 text-red-300 rounded-lg px-4 py-2 text-sm mb-4"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
        {success && <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-700/50 text-emerald-300 rounded-lg px-4 py-2 text-sm mb-4"><Bell className="w-4 h-4 shrink-0" />{success}</div>}

        <form onSubmit={broadcast} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Title</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                placeholder="Notification title"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Target</label>
              <AutocompleteCombobox
                value={form.target}
                onChange={(val) => setForm(f => ({ ...f, target: val }))}
                options={[
                  { value: 'all', label: 'All Users' },
                  { value: 'candidates', label: 'Candidates Only' },
                  { value: 'employers', label: 'Employers Only' },
                  { value: 'user', label: 'Specific User' },
                ]}
                placeholder="Select target..."
              />
            </div>
          </div>

          {form.target === 'user' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">User ID or Email</label>
              <input value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
                placeholder="user@email.com or user ID"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-1">Message</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required rows={3}
              placeholder="Notification message..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
          </div>

          <button type="submit" disabled={sending}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
            <Send className="w-4 h-4" />{sending ? 'Sending...' : 'Send Notification'}
          </button>
        </form>
      </div>

      {/* Queue */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-300">Recent Notifications</h2>
          <button onClick={loadQueue} disabled={loading} className="text-gray-400 hover:text-white disabled:opacity-40">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {error && (
          <div className="px-6 py-4 bg-yellow-900/20 border-b border-yellow-700/30">
            <div className="flex items-center gap-2 text-yellow-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
            {!endpointAvailable && (
              <p className="text-xs text-yellow-400/70 mt-2">
                The notification queue feature may not be implemented in your backend yet. 
                You can still send notifications using the form above.
              </p>
            )}
          </div>
        )}
        
        <div className="divide-y divide-gray-800">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-6 py-4 animate-pulse space-y-2">
                <div className="h-4 bg-gray-800 rounded w-48" />
                <div className="h-3 bg-gray-800 rounded w-72" />
              </div>
            ))
          ) : !endpointAvailable ? (
            <div className="px-6 py-8 text-center">
              <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-2">Notification Queue Not Available</p>
              <p className="text-gray-600 text-xs">
                This feature requires backend support. You can still send notifications above.
              </p>
            </div>
          ) : queue.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">No notifications sent yet.</p>
          ) : queue.map(n => {
            const id = n._id || n.id;
            return (
              <div key={id} className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-gray-800/30">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-900/40 rounded-lg flex items-center justify-center shrink-0">
                    {n.target === 'user' ? <User className="w-4 h-4 text-purple-400" /> : <Users className="w-4 h-4 text-purple-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{n.title || n.subject || n.type || 'Notification'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded capitalize">{n.userType || n.target || 'all'}</span>
                      <span className="text-xs text-gray-600">{n.createdAt ? new Date(n.createdAt).toLocaleString() : '—'}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => deleteNotif(id)} className="text-gray-600 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
