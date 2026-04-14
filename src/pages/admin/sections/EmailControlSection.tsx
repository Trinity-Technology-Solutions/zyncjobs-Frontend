import React, { useState } from 'react';
import { Send, Mail, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { API_ENDPOINTS } from '../../../config/env';
import { tokenStorage } from '../../../utils/tokenStorage';

function authHeaders() {
  const token = tokenStorage.getAdmin() || tokenStorage.getAccess();
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

const TEMPLATES = [
  { id: 'welcome', label: 'Welcome Email', subject: 'Welcome to ZyncJobs!', body: 'Hi {{name}},\n\nWelcome to ZyncJobs! We\'re excited to have you on board.\n\nStart exploring jobs today.\n\nBest,\nZyncJobs Team' },
  { id: 'maintenance', label: 'Maintenance Notice', subject: 'Scheduled Maintenance - ZyncJobs', body: 'Hi {{name}},\n\nWe will be performing scheduled maintenance on {{date}}.\n\nThe platform may be unavailable for a short period.\n\nApologies for any inconvenience.\n\nBest,\nZyncJobs Team' },
  { id: 'promo', label: 'Promotional', subject: 'New Features on ZyncJobs!', body: 'Hi {{name}},\n\nWe\'ve added exciting new features to ZyncJobs.\n\nLog in to explore them today!\n\nBest,\nZyncJobs Team' },
];

export default function EmailControlSection({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [form, setForm] = useState({ to: 'all', subject: '', body: '', specificEmail: '' });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const applyTemplate = (id: string) => {
    const t = TEMPLATES.find(t => t.id === id);
    if (t) setForm(f => ({ ...f, subject: t.subject, body: t.body }));
    setSelectedTemplate(id);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.body.trim()) return;
    setSending(true);
    setStatus(null);
    try {
      const body: any = { subject: form.subject, message: form.body, userType: form.to };
      if (form.to === 'specific') body.email = form.specificEmail;

      const endpoint = form.to === 'specific'
        ? `${API_ENDPOINTS.BASE_URL}/admin/notifications/send`
        : `${API_ENDPOINTS.BASE_URL}/admin/notifications/broadcast`;

      const payload = form.to === 'specific'
        ? { type: 'email', recipients: [form.specificEmail], subject: form.subject, message: form.body }
        : { subject: form.subject, message: form.body, userType: form.to };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.status === 401) { onUnauthorized(); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStatus({ type: 'success', text: data.message || 'Email sent successfully!' });
      setForm({ to: 'all', subject: '', body: '', specificEmail: '' });
      setSelectedTemplate('');
    } catch {
      setStatus({ type: 'error', text: 'Failed to send email.' });
    } finally { setSending(false); }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2"><Mail className="w-5 h-5 text-purple-400" />Email Control Panel</h2>
        <p className="text-xs text-gray-500 mb-6">Send bulk emails or targeted messages to users</p>

        {status && (
          <div className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm mb-4
            ${status.type === 'success' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
            {status.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {status.text}
          </div>
        )}

        {/* Templates */}
        <div className="mb-5">
          <label className="block text-xs text-gray-400 mb-2">Quick Templates</label>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => applyTemplate(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${selectedTemplate === t.id ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={send} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Send To</label>
              <select value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="all">All Users</option>
                <option value="candidates">Candidates Only</option>
                <option value="employers">Employers Only</option>
                <option value="specific">Specific Email</option>
              </select>
            </div>
            {form.to === 'specific' && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Email Address</label>
                <input value={form.specificEmail} onChange={e => setForm(f => ({ ...f, specificEmail: e.target.value }))}
                  type="email" placeholder="user@example.com" required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Subject</label>
            <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required
              placeholder="Email subject"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Body <span className="text-gray-600">(use {'{{name}}'} for personalization)</span></label>
            <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} required rows={8}
              placeholder="Email body..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono" />
          </div>

          <button type="submit" disabled={sending}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
            <Send className="w-4 h-4" />{sending ? 'Sending...' : 'Send Email'}
          </button>
        </form>
      </div>
    </div>
  );
}
