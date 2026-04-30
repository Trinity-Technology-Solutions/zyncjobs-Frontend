import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Filter, Search, Calendar, Briefcase, Users, MessageSquare } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import { API_ENDPOINTS } from '../config/constants';

interface Notification {
  id: string;
  type: 'application' | 'interview' | 'job' | 'message' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: any;
}

interface NotificationsPageProps {
  onNavigate: (page: string, data?: any) => void;
  user?: { name: string; type: 'candidate' | 'employer'; email?: string } | null;
  onLogout?: () => void;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate, user, onLogout }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'application' | 'interview' | 'job' | 'message'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const userEmail = user?.email;
      if (!userEmail) return;

      // Fetch notifications from API
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/notifications?userEmail=${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        // Fallback to mock notifications
        setNotifications(generateMockNotifications());
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications(generateMockNotifications());
    } finally {
      setLoading(false);
    }
  };

  const generateMockNotifications = (): Notification[] => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'application',
        title: 'Application Status Update',
        message: 'Your application for Software Engineer at TechCorp has been reviewed',
        read: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        data: { jobTitle: 'Software Engineer', company: 'TechCorp' }
      },
      {
        id: '2',
        type: 'interview',
        title: 'Interview Scheduled',
        message: 'Interview scheduled for tomorrow at 2:00 PM for Frontend Developer position',
        read: false,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        data: { jobTitle: 'Frontend Developer', time: '2:00 PM' }
      },
      {
        id: '3',
        type: 'job',
        title: 'New Job Match',
        message: 'We found 5 new jobs that match your profile',
        read: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        data: { matchCount: 5 }
      },
      {
        id: '4',
        type: 'message',
        title: 'New Message',
        message: 'You have a new message from HR at InnovateTech',
        read: false,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        data: { sender: 'HR at InnovateTech' }
      },
      {
        id: '5',
        type: 'system',
        title: 'Profile Completion',
        message: 'Complete your profile to get better job recommendations',
        read: true,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        data: { completionPercentage: 75 }
      }
    ];

    return mockNotifications;
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`${API_ENDPOINTS.BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_ENDPOINTS.BASE_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user?.email })
      });
      
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`${API_ENDPOINTS.BASE_URL}/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application': return <Briefcase className="w-5 h-5" />;
      case 'interview': return <Calendar className="w-5 h-5" />;
      case 'job': return <Search className="w-5 h-5" />;
      case 'message': return <MessageSquare className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'application': return 'bg-blue-100 text-blue-600';
      case 'interview': return 'bg-green-100 text-green-600';
      case 'job': return 'bg-purple-100 text-purple-600';
      case 'message': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.read) ||
      notification.type === filter;
    
    const matchesSearch = !searchTerm || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <BackButton onClick={() => onNavigate('dashboard')} />
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Check className="w-4 h-4" />
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'all', label: 'All', icon: Filter },
                { key: 'unread', label: 'Unread', icon: Bell },
                { key: 'application', label: 'Applications', icon: Briefcase },
                { key: 'interview', label: 'Interviews', icon: Calendar },
                { key: 'job', label: 'Jobs', icon: Search },
                { key: 'message', label: 'Messages', icon: MessageSquare }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? "You don't have any notifications yet."
                : `No ${filter} notifications found.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow ${
                  !notification.read ? 'border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <Footer onNavigate={onNavigate} user={user} />
    </div>
  );
};

export default NotificationsPage;