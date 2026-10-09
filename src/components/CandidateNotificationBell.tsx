import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, CheckCheck, Trash2 } from 'lucide-react';
import { AppNotification } from '../hooks/useApplicationNotifications';

interface CandidateNotificationBellProps {
  notifications: AppNotification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onDismiss?: (id: string) => void;
  onNavigate: (page: string) => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const CandidateNotificationBell: React.FC<CandidateNotificationBellProps> = ({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  onNavigate,
}) => {
  const [open, setOpen] = useState(false);
  const badgeCount = unreadCount;
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sortedNotifications = [...notifications].sort((first, second) => second.timestamp - first.timestamp);
  const groupLabel = (timestamp: number) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    return timestamp >= today.getTime() ? 'Today' : timestamp >= yesterday.getTime() ? 'Yesterday' : 'Earlier';
  };
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
      if (event.key === 'Tab') {
        const buttons = panelRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
        if (!buttons?.length) return;
        const first = buttons[0]; const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', handleKey); triggerRef.current?.focus(); };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
        aria-label={badgeCount > 0 ? `Notifications, ${badgeCount} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="w-5 h-5" />
        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {open && createPortal(
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[100]" onClick={() => setOpen(false)} />

          {/* Slide-in Panel */}
          <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Notifications" className="portal-notification-panel fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-xl z-[101] transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="notification-drawer-heading">
              <h3 className="font-semibold text-gray-900 text-base">Notifications</h3>
              <div className="flex items-center space-x-3">
                {badgeCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>All read</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={onClearAll} className="text-xs text-gray-400 hover:text-red-500" title="Clear all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => setOpen(false)} aria-label="Close notifications" className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {notifications.length > 0 && <div className="notification-drawer-tools"><span>{badgeCount} unread</span><span>Application and interview updates</span></div>}
            <div className="notification-drawer-list">
              {notifications.length === 0 ? <div className="notification-drawer-empty"><Bell size={32} aria-hidden="true" /><h4>You are all caught up</h4><p>Application updates and interview invitations will appear here.</p></div> : sortedNotifications.map((notification, index) => {
                const group = groupLabel(notification.timestamp);
                const isInterview = notification.type === 'interview';
                return <React.Fragment key={notification.id}>
                  {(index === 0 || groupLabel(sortedNotifications[index - 1].timestamp) !== group) && <h4 className="notification-time-group">{group}</h4>}
                  <button type="button" className={`notification-list-item ${notification.read ? '' : 'is-unread'}`} onClick={() => { onMarkRead(notification.id); setOpen(false); onNavigate(isInterview ? 'interviews' : 'my-applications'); }}>
                    <span className="notification-company-icon" aria-hidden="true">{notification.company?.trim().charAt(0).toUpperCase() || <Bell size={20} />}</span>
                    <span className="notification-item-content"><span className="notification-item-message">{notification.message || (isInterview ? 'You have an interview invitation' : 'Your application has an update')}</span>{notification.jobTitle && <span className="notification-item-role">{notification.jobTitle}</span>}{isInterview && (notification.interviewDate || notification.interviewTime) && <span className="notification-item-schedule">{[notification.interviewDate, notification.interviewTime, notification.interviewMode].filter(Boolean).join(' ? ')}</span>}<span className="notification-item-meta"><span>{isInterview ? 'Interview' : 'Application update'}{notification.company ? ` | ${notification.company}` : ''}</span><time dateTime={Number.isFinite(notification.timestamp) ? new Date(notification.timestamp).toISOString() : undefined}>{timeAgo(notification.timestamp)}</time></span></span>
                  </button>
                </React.Fragment>;
              })}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="notification-drawer-footer">
                <button
                  onClick={() => { setOpen(false); onNavigate('my-applications'); }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium w-full text-center"
                >
                  View all applications →
                </button>
              </div>
            )}
          </div>
        </>, document.body
      )}
    </div>
  );
};

export default CandidateNotificationBell;
