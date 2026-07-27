import React, { useState } from 'react';
import { Bell, X, CheckCheck, Trash2, Calendar, Clock, Video, Phone, MapPin } from 'lucide-react';
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

const STATUS_COLORS: Record<string, string> = {
  reviewed: 'bg-yellow-100 text-yellow-800',
  shortlisted: 'bg-green-100 text-green-800',
  hired: 'bg-purple-100 text-purple-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800',
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getInterviewModeIcon(mode: string) {
  switch (mode?.toLowerCase()) {
    case 'video':
      return <Video className="w-3.5 h-3.5" />;
    case 'phone':
      return <Phone className="w-3.5 h-3.5" />;
    case 'in-person':
      return <MapPin className="w-3.5 h-3.5" />;
    default:
      return <Video className="w-3.5 h-3.5" />;
  }
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
  const badgeCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setOpen(false)} />

          {/* Slide-in Panel */}
          <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 text-base">Application Updates</h3>
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
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="h-full overflow-y-auto pb-20">
              {notifications.length === 0 ? (
                <div className="py-16 text-center">
                  <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No notifications yet</p>
                  <p className="text-xs text-gray-400 mt-1">We'll notify you when your application status changes</p>
                </div>
              ) : (
                notifications.map(n => {
                  const isInterview = n.type === 'interview';
                  
                  return (
                    <div
                      key={n.id}
                      onClick={() => { onMarkRead(n.id); setOpen(false); onNavigate(isInterview ? 'my-applications' : 'my-applications'); }}
                      className={`px-5 py-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{n.jobTitle}</p>
                          <p className="text-xs text-gray-500 truncate">{n.company}</p>
                          
                          {isInterview ? (
                            // Interview notification display
                            <div className="mt-2 space-y-1">
                              <p className="text-xs text-gray-600">{n.message}</p>
                              <div className="flex items-center space-x-3 text-xs text-gray-500">
                                {n.interviewDate && (
                                  <span className="flex items-center space-x-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{n.interviewDate}</span>
                                  </span>
                                )}
                                {n.interviewTime && (
                                  <span className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{n.interviewTime}</span>
                                  </span>
                                )}
                                {n.interviewMode && (
                                  <span className="flex items-center space-x-1">
                                    {getInterviewModeIcon(n.interviewMode)}
                                    <span className="capitalize">{n.interviewMode}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            // Application status change display
                            <>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-gray-400 line-through capitalize">{n.oldStatus}</span>
                                <span className="text-xs text-gray-400">→</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[n.newStatus] || 'bg-gray-100 text-gray-700'}`}>
                                  {n.newStatus}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                            </>
                          )}
                        </div>
                        <div className="flex flex-col items-end ml-2 flex-shrink-0">
                          <span className="text-xs text-gray-400">{timeAgo(n.timestamp)}</span>
                          {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 px-5 py-3 border-t border-gray-100 bg-white">
                <button
                  onClick={() => { setOpen(false); onNavigate('my-applications'); }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium w-full text-center"
                >
                  View all applications →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CandidateNotificationBell;
