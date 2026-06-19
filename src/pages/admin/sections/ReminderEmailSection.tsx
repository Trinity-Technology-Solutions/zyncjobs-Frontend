import React, { useState, useEffect, useCallback } from 'react';
import { Send, Mail, Users, Building2, RefreshCw, AlertCircle, CheckCircle, XCircle, Clock, FileText, Search } from 'lucide-react';
import { API_ENDPOINTS } from '../../../config/env';
import { tokenStorage } from '../../../utils/tokenStorage';
import { apiFetch } from '../../../api/apiFetch';

function authHeaders() {
  const token = tokenStorage.getAdmin() || tokenStorage.getAccess();
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function authFetch(url: string, options: RequestInit = {}, onUnauthorized?: () => void) {
  const response = await apiFetch(url, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) }
  });
  if (response.status === 401) {
    tokenStorage.clear();
    onUnauthorized?.();
    throw new Error('UNAUTHORIZED');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || body.message || `HTTP ${response.status}`);
  }
  return await response.json();
}

interface TemplateGroup {
  group: string;
  groupIcon: string;
  items: { id: string; label: string; subject: string; body: string; }[];
}

const TEMPLATE_GROUPS: TemplateGroup[] = [
  {
    group: 'Candidate Templates',
    groupIcon: '👤',
    items: [
      {
        id: 'candidate_profile',
        label: 'Profile Completion',
        subject: 'Complete Your Candidate Profile on ZyncJobs',
        body: 'Hi {{name}},\n\nThis is a friendly reminder to complete your candidate profile on ZyncJobs.\n\nHaving a complete profile helps you get noticed by top employers and unlocks personalized job recommendations tailored to your skills and experience.\n\nHere\'s what you can do:\n• Add your work experience and education\n• Upload your resume\n• Set your job preferences and desired salary\n\nLog in today to finish setting up your profile and take the next step in your career journey.'
      },
      {
        id: 'candidate_resume',
        label: 'Resume Update',
        subject: 'Update Your Resume on ZyncJobs',
        body: 'Hi {{name}},\n\nAn updated resume increases your chances of getting noticed by recruiters by up to 40%.\n\nTake a few minutes to:\n• Add your latest experience and skills\n• Update your contact information\n• Highlight recent achievements and certifications\n\nEmployers are actively searching for candidates like you on ZyncJobs. Make sure your profile stands out and showcases your best self!'
      },
      {
        id: 'candidate_jobs',
        label: 'New Job Matches',
        subject: 'New Job Matches Waiting for You on ZyncJobs',
        body: 'Hi {{name}},\n\nWe\'ve found new job opportunities that match your skills and experience on ZyncJobs.\n\nDon\'t miss out on your next career move. Log in today to:\n• View your personalized job recommendations\n• Apply with just a few clicks\n• Track your application status in real-time\n\nYour dream job could be just one click away!'
      },
      {
        id: 'candidate_engagement',
        label: 'Re-Engagement',
        subject: 'We Miss You! New Opportunities on ZyncJobs',
        body: 'Hi {{name}},\n\nIt\'s been a while since you last visited ZyncJobs. We\'ve been busy adding new features and opportunities for candidates.\n\nHere\'s what\'s new:\n• Fresh job listings matching your profile\n• Enhanced AI-powered job recommendations\n• Improved resume builder with professional templates\n• New skill assessments to boost your profile\n\nCome back and see what\'s waiting for you!'
      },
    ]
  },
  {
    group: 'Employer Templates',
    groupIcon: '🏢',
    items: [
      {
        id: 'employer_engagement',
        label: 'Employer Follow-Up',
        subject: 'Maximize Your Hiring on ZyncJobs',
        body: 'Hi {{name}},\n\nWe hope you\'re finding great candidates on ZyncJobs! We wanted to share some tips to help you get the most out of your hiring experience.\n\nDid you know?\n• Jobs with complete descriptions get 3x more applications\n• Featured jobs appear at the top of search results\n• Our AI matching helps you find the best candidates faster\n• You can track all applications in one dashboard\n\nLog in to review your job postings and connect with top talent today.'
      },
      {
        id: 'employer_posting',
        label: 'Job Posting Tips',
        subject: 'Get More Applications for Your Jobs on ZyncJobs',
        body: 'Hi {{name}},\n\nWant to attract more qualified candidates? Here are some proven tips for your job postings on ZyncJobs:\n\n• Write clear, detailed job descriptions with specific requirements\n• Include salary range to attract serious applicants\n• Add your company culture and benefits to stand out\n• Respond to applicants quickly to maintain engagement\n\nLog in to optimize your job postings and start receiving more applications from top talent.'
      },
      {
        id: 'employer_candidates',
        label: 'Candidate Matching',
        subject: 'Discover Top Candidates on ZyncJobs',
        body: 'Hi {{name}},\n\nOur AI-powered matching system has identified candidates that could be a great fit for your open positions on ZyncJobs.\n\nHere\'s how to make the most of it:\n• Browse AI-matched candidate profiles\n• Review resumes and skills summaries\n• Reach out to candidates directly through our platform\n• Schedule interviews with top matches\n\nLog in to discover your next great hire today!'
      },
    ]
  },
  {
    group: 'General Templates',
    groupIcon: '📋',
    items: [
      {
        id: 'general_engagement',
        label: 'General Re-Engagement',
        subject: 'Stay Connected with ZyncJobs',
        body: 'Hi {{name}},\n\nWe wanted to check in and make sure you\'re getting the most out of ZyncJobs.\n\nWhether you\'re looking for your next opportunity or searching for top talent, we\'re here to help you succeed.\n\nLog in today to see what\'s new and take advantage of everything ZyncJobs has to offer.'
      },
    ]
  }
];

interface EmailRecord {
  _id?: string;
  id?: string;
  subject: string;
  recipients: number;
  sentAt: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  userType: string;
  error?: string;
}

interface Props {
  onUnauthorized: () => void;
  initialUserType?: 'candidates' | 'employers' | 'both';
  initialSelectedIds?: string[];
}

export default function ReminderEmailSection({ onUnauthorized, initialUserType, initialSelectedIds }: Props) {
  const [userType, setUserType] = useState<'candidates' | 'employers' | 'both'>(initialUserType || 'both');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [history, setHistory] = useState<EmailRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [selectedUsersLoading, setSelectedUsersLoading] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allUsersLoading, setAllUsersLoading] = useState(false);
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>([]);
  const [localUserSearch, setLocalUserSearch] = useState('');
  const [localRoleFilter, setLocalRoleFilter] = useState<'all' | 'candidate' | 'employer'>('all');

  const selectedIds = (() => {
    const ids: string[] = [];
    if (initialSelectedIds?.length) ids.push(...initialSelectedIds);
    for (const id of localSelectedIds) {
      if (!ids.includes(id)) ids.push(id);
    }
    return ids;
  })();

  const fetchAllUsers = useCallback(async () => {
    setAllUsersLoading(true);
    try {
      const res = await authFetch(`${API_ENDPOINTS.ADMIN_USERS}?limit=5000`, {}, onUnauthorized);
      const list = res.users ?? res.data ?? res ?? [];
      setAllUsers(list);
    } catch {
      // silently fail
    } finally {
      setAllUsersLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    if (!selectedIds.length) { setSelectedUsers([]); return; }
    const source = allUsers.length ? allUsers : null;
    if (source) {
      const filtered = source.filter((u: any) => {
        const uid = u._id || u.id || u.userId || u.email;
        return selectedIds.includes(uid);
      });
      if (filtered.length || !selectedUsersLoading) setSelectedUsers(filtered);
    } else {
      setSelectedUsersLoading(true);
      authFetch(`${API_ENDPOINTS.ADMIN_USERS}?limit=5000`, {}, onUnauthorized)
        .then(res => {
          const all = res.users ?? res.data ?? res ?? [];
          setAllUsers(all);
          const filtered = all.filter((u: any) => {
            const uid = u._id || u.id || u.userId || u.email;
            return selectedIds.includes(uid);
          });
          setSelectedUsers(filtered);
        })
        .catch(() => {})
        .finally(() => setSelectedUsersLoading(false));
    }
  }, [selectedIds.join(','), allUsers.length, onUnauthorized]);

  const toggleLocalUser = (id: string) => {
    setLocalSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const openUserPicker = () => {
    setShowUserPicker(true);
    if (!allUsers.length) fetchAllUsers();
  };

  const closeUserPicker = () => {
    setShowUserPicker(false);
    setLocalUserSearch('');
    setLocalRoleFilter('all');
  };

  const clearLocalSelection = () => {
    setLocalSelectedIds([]);
    setSelectedUsers([]);
  };

  const filteredUsers = allUsers.filter((u: any) => {
    const role = (u.role || u.userType || '').toLowerCase();
    const name = (u.name || u.fullName || u.email || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const s = localUserSearch.toLowerCase();
    if (localRoleFilter !== 'all' && role !== localRoleFilter) return false;
    if (s && !name.includes(s) && !email.includes(s)) return false;
    return true;
  });

  const applyTemplate = (id: string) => {
    for (const g of TEMPLATE_GROUPS) {
      const t = g.items.find(t => t.id === id);
      if (t) {
        setSubject(t.subject);
        setBody(t.body);
        setSelectedTemplate(id);
        return;
      }
    }
  };

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await authFetch(`${API_ENDPOINTS.ADMIN_EMAIL_STATUS}?limit=50`, {}, onUnauthorized);
      const list = res.records ?? res.emails ?? res.data ?? res ?? [];
      setHistory(list);
    } catch {
      // silently fail
    } finally {
      setHistoryLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    setStatus(null);
    try {
      const res = await authFetch(`${API_ENDPOINTS.ADMIN_REMINDER_EMAIL}`, {
        method: 'POST',
        body: JSON.stringify({
          userType,
          subject: subject.trim(),
          message: body.trim(),
          recipientIds: selectedIds.length ? selectedIds : undefined,
        }),
      }, onUnauthorized);
      setStatus({ type: 'success', text: res.message || 'Reminder email sent successfully!' });
      setSubject('');
      setBody('');
      setSelectedTemplate('');
      setLocalSelectedIds([]);
      setSelectedUsers([]);
      loadHistory();
    } catch (e: any) {
      setStatus({ type: 'error', text: e.message || 'Failed to send reminder email.' });
    } finally {
      setSending(false);
    }
  };

  const selectedCandidateCount = selectedUsers.filter(u => (u.role || u.userType || '').toLowerCase() === 'candidate').length;
  const selectedEmployerCount = selectedUsers.filter(u => (u.role || u.userType || '').toLowerCase() === 'employer').length;

  const statusIcon = (s: string) => {
    switch (s) {
      case 'sent': return <CheckCircle className="w-4 h-4 text-blue-400" />;
      case 'delivered': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-amber-400" />;
    }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      sent: 'bg-blue-900/40 text-blue-400',
      delivered: 'bg-emerald-900/40 text-emerald-400',
      failed: 'bg-red-900/40 text-red-400',
      pending: 'bg-amber-900/40 text-amber-400',
    };
    return map[s] || 'bg-gray-800 text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Compose Card */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
          <Mail className="w-5 h-5 text-purple-400" />Compose Reminder Email
        </h2>
        <p className="text-xs text-gray-500 mb-6">Send reminder emails to candidates, employers, or both</p>

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
          <div className="space-y-3">
            {TEMPLATE_GROUPS.map(group => (
              <div key={group.group}>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <span>{group.groupIcon}</span>{group.group}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map(t => (
                    <button
                      key={t.id}
                      onClick={() => applyTemplate(t.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors
                        ${selectedTemplate === t.id
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Select Users Button / Summary */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={openUserPicker}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            <Users className="w-4 h-4" />Select Users
          </button>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={clearLocalSelection}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              Clear selection
            </button>
          )}
        </div>

        {/* User Picker Panel */}
        {showUserPicker && (
          <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-200">
                <Users className="w-4 h-4 text-purple-400" />Pick Users
                <span className="text-xs text-gray-500 font-normal">({selectedIds.length} selected)</span>
              </h3>
              <button onClick={closeUserPicker} className="text-xs text-gray-500 hover:text-white transition-colors">Close</button>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  value={localUserSearch}
                  onChange={e => setLocalUserSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              {(['all', 'candidate', 'employer'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setLocalRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize shrink-0
                    ${localRoleFilter === r ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                >
                  {r === 'all' ? 'All' : r + 's'}
                </button>
              ))}
              <button onClick={fetchAllUsers} disabled={allUsersLoading} className="text-gray-500 hover:text-white disabled:opacity-40 shrink-0">
                <RefreshCw className={`w-3.5 h-3.5 ${allUsersLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {allUsersLoading ? (
              <div className="space-y-2 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-700 rounded" />
                ))}
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-0.5 border border-gray-700 rounded-lg">
                {filteredUsers.map((u: any) => {
                  const uid = u._id || u.id || u.userId || u.email;
                  const role = (u.role || u.userType || '').toLowerCase();
                  const checked = selectedIds.includes(uid);
                  return (
                    <label
                      key={uid}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors text-sm
                        ${checked ? 'bg-purple-900/30' : 'hover:bg-gray-700/50'}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleLocalUser(uid)}
                        className="rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500"
                      />
                      <div className={`w-2 h-2 rounded-full shrink-0 ${role === 'employer' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                      <span className="flex-1 text-gray-200 truncate">{u.name || u.fullName || u.email}</span>
                      <span className="text-[10px] uppercase text-gray-500 shrink-0">{role}</span>
                    </label>
                  );
                })}
                {!filteredUsers.length && (
                  <p className="text-center text-gray-500 py-6 text-sm">No users found</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Selected Users Summary */}
        {(selectedUsers.length > 0 || selectedUsersLoading) && (
          <div className="bg-gray-800/60 border border-purple-600/30 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                <Users className="w-4 h-4" />Selected Recipients
              </h3>
              <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
                {selectedIds.length} user{selectedIds.length !== 1 ? 's' : ''}
              </span>
            </div>
            {selectedUsersLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-700 rounded w-1/2" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-3 text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Users className="w-3.5 h-3.5" />{selectedCandidateCount} Candidate{selectedCandidateCount !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1.5 text-blue-400">
                    <Building2 className="w-3.5 h-3.5" />{selectedEmployerCount} Employer{selectedEmployerCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {selectedUsers.map((u: any) => {
                    const role = (u.role || u.userType || '').toLowerCase();
                    return (
                      <div key={u._id || u.id || u.email || Math.random()} className="flex items-center gap-2 text-xs text-gray-400">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${role === 'employer' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                        <span className="truncate">{u.name || u.fullName || u.email}</span>
                        <span className="text-[10px] uppercase text-gray-600 shrink-0">{role}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        <form onSubmit={send} className="space-y-4">
          {/* Recipient Selection */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Send To</label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: 'candidates', label: 'Candidates', icon: Users },
                { value: 'employers', label: 'Employers', icon: Building2 },
                { value: 'both', label: 'Both', icon: Users },
              ] as const).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setUserType(value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${userType === value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Subject</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
              placeholder="Email subject"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Body <span className="text-gray-600">(use {'{{name}}'} for personalization)</span>
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              required
              rows={8}
              placeholder="Email body..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono"
            />
          </div>

          {/* Send Button */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-all"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send Reminder Email'}
            </button>
            <button
              type="button"
              onClick={() => { setSubject(''); setBody(''); setSelectedTemplate(''); setStatus(null); }}
              className="px-4 py-2.5 text-sm text-gray-400 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Delivery History */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold">Email Delivery History</h2>
          </div>
          <button onClick={loadHistory} disabled={historyLoading} className="text-gray-400 hover:text-white disabled:opacity-40">
            <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="text-left px-6 py-3 font-medium">Subject</th>
                <th className="text-left px-6 py-3 font-medium">Recipients</th>
                <th className="text-left px-6 py-3 font-medium">Type</th>
                <th className="text-left px-6 py-3 font-medium">Sent At</th>
                <th className="text-left px-6 py-3 font-medium">Status</th>
                <th className="text-left px-6 py-3 font-medium">Error</th>
              </tr>
            </thead>
            <tbody>
              {historyLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-800 animate-pulse">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-3"><div className="h-4 bg-gray-700 rounded w-24" /></td>
                      ))}
                    </tr>
                  ))
                : history.map((rec: any) => (
                    <tr key={rec._id || rec.id || Math.random()} className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
                      <td className="px-6 py-3 text-gray-200 font-medium max-w-[200px] truncate">{rec.subject}</td>
                      <td className="px-6 py-3 text-gray-400">{rec.recipients ?? rec.recipientCount ?? '—'}</td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-gray-800 text-gray-300">
                          {rec.userType || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-400">
                        {rec.sentAt ? new Date(rec.sentAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge(rec.status)}`}>
                          {statusIcon(rec.status)}{rec.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-red-400 text-xs max-w-[150px] truncate">{rec.error || '—'}</td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
          {!historyLoading && !history.length && (
            <p className="text-center text-gray-500 py-8 text-sm">No email history yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
