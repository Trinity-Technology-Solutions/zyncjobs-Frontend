import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Bell, BellOff, CheckCheck, Briefcase, MapPin, DollarSign, Tag, Clock, ExternalLink, Bookmark, BookmarkCheck, Check, X, RotateCcw } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import { AlertNotification } from '../api/jobAlerts';
import { useJobAlertStore } from '../hooks/useJobAlertStore';
import { useSavedJobsStore } from '../store/useSavedJobsStore';

interface Props {
  onNavigate: (page: string, data?: any) => void;
  user?: { name: string; type: 'candidate' | 'employer'; email?: string } | null;
  onLogout?: () => void;
}

type Tab = 'unread' | 'read' | 'dismissed';

const PAGE_SIZE = 15;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatSalary(salary?: AlertNotification['salary']): string | null {
  if (!salary) return null;
  const cur = salary.currency ?? '₹';
  const fmt = (n: number) => n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);
  if (salary.min && salary.max) return `${cur}${fmt(salary.min)} – ${cur}${fmt(salary.max)}`;
  if (salary.min) return `${cur}${fmt(salary.min)}+`;
  if (salary.max) return `Up to ${cur}${fmt(salary.max)}`;
  return null;
}

function toast(msg: string) {
  window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: msg } }));
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function NotifSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}

// ── Notification Card ─────────────────────────────────────────────────────────

interface CardProps {
  notif: AlertNotification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onRestore: (id: string) => void;
  onApply: (jobId: string) => void;
  onSave: (jobId: string) => void;
  isSaved: boolean;
}

const NotifCard: React.FC<CardProps> = ({ notif, onMarkRead, onDismiss, onRestore, onApply, onSave, isSaved }) => {
  const salary = formatSalary(notif.salary);
  const isUnread = notif.status === 'unread';

  return (
    <div className={`bg-white rounded-2xl border transition-all ${isUnread ? 'border-blue-200 shadow-sm' : 'border-gray-100'}`}>
      {isUnread && <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-2xl" />}
      <div className="p-5">
        <div className="flex gap-4">
          {/* Company Logo */}
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
            {notif.companyLogo ? (
              <img src={notif.companyLogo} alt={notif.company} className="w-full h-full object-contain p-1" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-gray-400" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className={`font-semibold text-base truncate ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                  {notif.jobTitle}
                </h3>
                <p className="text-sm text-gray-500 truncate">{notif.company}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isUnread && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(notif.postedAt)}</span>
              </div>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
              {notif.location && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{notif.location}</span>
              )}
              {salary && (
                <span className="flex items-center gap-1 text-green-600 font-medium"><DollarSign className="w-3 h-3" />{salary}</span>
              )}
              <span className="flex items-center gap-1 text-blue-500"><Bell className="w-3 h-3" />{notif.alertName}</span>
            </div>

            {/* Matched Skills */}
            {notif.matchedSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                <span className="text-xs text-gray-400 flex items-center gap-1"><Tag className="w-3 h-3" />Skills:</span>
                {notif.matchedSkills.slice(0, 5).map(s => (
                  <span key={s} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">{s}</span>
                ))}
              </div>
            )}

            {/* Matched Keywords */}
            {notif.matchedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />Keywords:</span>
                {notif.matchedKeywords.slice(0, 4).map(k => (
                  <span key={k} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">{k}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
          <button
            onClick={() => onApply(notif.jobId)}
            className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Apply
          </button>
          <button
            onClick={() => onSave(notif.jobId)}
            className={`flex items-center gap-1.5 border text-xs font-medium px-3 py-2 rounded-lg transition-colors ${
              isSaved
                ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            {isSaved ? 'Saved' : 'Save'}
          </button>
          {isUnread && (
            <button
              onClick={() => onMarkRead(notif._id)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ml-auto"
            >
              <Check className="w-3.5 h-3.5" /> Mark Read
            </button>
          )}
          {notif.status === 'dismissed' && (
            <button
              onClick={() => onRestore(notif._id)}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors ml-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restore
            </button>
          )}
          {notif.status !== 'dismissed' && (
            <button
              onClick={() => onDismiss(notif._id)}
              className={`flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors ${isUnread ? '' : 'ml-auto'}`}
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" /> Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const JobAlertNotificationsPage: React.FC<Props> = ({ onNavigate, user, onLogout }) => {
  const { notifications, unreadCount, notifLoading, markRead, markAllRead, dismissNotification, restoreNotification } =
    useJobAlertStore(user?.email);
  const savedJobIds = useSavedJobsStore(s => s.savedJobIds);
  const saveJobGlobal = useSavedJobsStore(s => s.saveJob);
  const unsaveJobGlobal = useSavedJobsStore(s => s.unsaveJob);
  const fetchSavedJobs = useSavedJobsStore(s => s.fetchSavedJobs);
  const [tab, setTab] = useState<Tab>('unread');
  const [page, setPage] = useState(1);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchSavedJobs(); }, [fetchSavedJobs]);

  const filtered = notifications.filter(n => n.status === tab);
  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  // Reset page when tab changes
  useEffect(() => { setPage(1); }, [tab]);

  // Infinite scroll
  const onIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && hasMore) setPage(p => p + 1);
  }, [hasMore]);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(onIntersect, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [onIntersect]);

  const handleApply = (jobId: string) => onNavigate('job-detail', { jobId });
  const handleSave = (notif: AlertNotification) => {
    const { jobId } = notif;
    if (!jobId) { toast('Job not found'); return; }
    if (savedJobIds.has(jobId)) {
      unsaveJobGlobal(jobId);
      toast('Removed from saved jobs');
    } else {
      saveJobGlobal(jobId, {
        jobTitle: notif.jobTitle,
        company: notif.company,
        location: notif.location,
        salary: notif.salary,
        jobType: undefined,
      });
      toast('Job saved ✓');
    }
  };

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'unread', label: 'Unread', count: notifications.filter(n => n.status === 'unread').length },
    { key: 'read', label: 'Read', count: notifications.filter(n => n.status === 'read').length },
    { key: 'dismissed', label: 'Dismissed', count: notifications.filter(n => n.status === 'dismissed').length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user as any} onLogout={onLogout} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <BackButton fallback="/alerts" />

        <div className="flex items-center justify-between mt-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Alert Notifications</h1>
            <p className="text-sm text-gray-500 mt-0.5">Jobs matching your saved alerts</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => { markAllRead(); toast('All notifications marked as read'); }}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              {(t.count ?? 0) > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  tab === t.key
                    ? t.key === 'unread' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {notifLoading && notifications.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <NotifSkeleton key={i} />)}
          </div>
        ) : visible.length === 0 ? (
          <EmptyNotifications tab={tab} onCreateAlert={() => onNavigate('alerts')} />
        ) : (
          <div className="space-y-4">
            {visible.map(n => (
              <NotifCard
                key={n._id}
                notif={n}
                onMarkRead={markRead}
                onDismiss={dismissNotification}
                onRestore={restoreNotification}
                onApply={handleApply}
                onSave={() => handleSave(n)}
                isSaved={savedJobIds.has(n.jobId)}
              />
            ))}
            {hasMore && <div ref={loaderRef} className="py-4 text-center"><div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}
          </div>
        )}
      </div>

      <Footer onNavigate={onNavigate} user={user as any} />
    </div>
  );
};

// ── Empty States ──────────────────────────────────────────────────────────────

const EMPTY_COPY: Record<Tab, { icon: React.ReactNode; title: string; desc: string }> = {
  unread: {
    icon: <Bell className="w-10 h-10 text-blue-300" />,
    title: 'No Matching Jobs Yet',
    desc: 'We\'ll notify you here as soon as jobs matching your alerts are posted.',
  },
  read: {
    icon: <CheckCheck className="w-10 h-10 text-green-300" />,
    title: 'All Notifications Read',
    desc: 'You\'re all caught up! Check back later for new matches.',
  },
  dismissed: {
    icon: <BellOff className="w-10 h-10 text-gray-300" />,
    title: 'No Dismissed Notifications',
    desc: 'Notifications you dismiss will appear here.',
  },
};

const EmptyNotifications: React.FC<{ tab: Tab; onCreateAlert: () => void }> = ({ tab, onCreateAlert }) => {
  const { icon, title, desc } = EMPTY_COPY[tab];
  return (
    <div className="text-center py-16 px-4">
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-gray-100">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">{desc}</p>
      {tab === 'unread' && (
        <button
          onClick={onCreateAlert}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <Bell className="w-4 h-4" /> Manage Alerts
        </button>
      )}
    </div>
  );
};

export default JobAlertNotificationsPage;
