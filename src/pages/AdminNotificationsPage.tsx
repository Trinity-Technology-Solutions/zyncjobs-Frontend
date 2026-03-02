import React, { useState, useEffect } from 'react';
import { Mail, Send, Users, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface AdminNotificationsPageProps {
  onNavigate: (page: string) => void;
}

const AdminNotificationsPage: React.FC<AdminNotificationsPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('send');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [emailForm, setEmailForm] = useState({
    type: 'email',
    recipients: '',
    subject: '',
    message: '',
    priority: 'medium'
  });

  const [broadcastForm, setBroadcastForm] = useState({
    userType: 'all',
    subject: '',
    message: ''
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications/queue');
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const sendNotification = async () => {
    setLoading(true);
    try {
      const recipients = emailForm.recipients.split(',').map(email => email.trim());
      
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...emailForm,
          recipients
        })
      });

      if (response.ok) {
        alert('Notification sent successfully!');
        setEmailForm({ type: 'email', recipients: '', subject: '', message: '', priority: 'medium' });
        fetchNotifications();
      }
    } catch (error) {
      alert('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const sendBroadcast = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(broadcastForm)
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        setBroadcastForm({ userType: 'all', subject: '', message: '' });
        fetchNotifications();
      }
    } catch (error) {
      alert('Failed to send broadcast');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Mail className="w-8 h-8 mr-3 text-blue-600" />
          Notification Center
        </h1>
        <button 
          onClick={() => onNavigate('admin-system')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Back to System
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('send')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'send' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Send Notification
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'broadcast' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Broadcast
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Send Individual Notification */}
      {activeTab === 'send' && (
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-xl font-semibold mb-6">📧 Send Individual Notification</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Recipients (comma-separated emails)</label>
              <textarea
                value={emailForm.recipients}
                onChange={(e) => setEmailForm({...emailForm, recipients: e.target.value})}
                className="w-full border rounded px-3 py-2 h-20"
                placeholder="user1@example.com, user2@example.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <select
                  value={emailForm.priority}
                  onChange={(e) => setEmailForm({...emailForm, priority: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  title="Select notification priority"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={emailForm.type}
                  onChange={(e) => setEmailForm({...emailForm, type: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  title="Select notification type"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push Notification</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <input
                type="text"
                value={emailForm.subject}
                onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                className="w-full border rounded px-3 py-2"
                placeholder="Notification subject"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                value={emailForm.message}
                onChange={(e) => setEmailForm({...emailForm, message: e.target.value})}
                className="w-full border rounded px-3 py-2 h-32"
                placeholder="Your notification message..."
              />
            </div>

            <button
              onClick={sendNotification}
              disabled={loading || !emailForm.recipients || !emailForm.subject || !emailForm.message}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </div>
      )}

      {/* Broadcast to All Users */}
      {activeTab === 'broadcast' && (
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-xl font-semibold mb-6">📢 Broadcast Message</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Target Audience</label>
              <select
                value={broadcastForm.userType}
                onChange={(e) => setBroadcastForm({...broadcastForm, userType: e.target.value})}
                className="w-full border rounded px-3 py-2"
                title="Select target audience for broadcast"
              >
                <option value="all">All Users</option>
                <option value="candidates">Candidates Only</option>
                <option value="employers">Employers Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <input
                type="text"
                value={broadcastForm.subject}
                onChange={(e) => setBroadcastForm({...broadcastForm, subject: e.target.value})}
                className="w-full border rounded px-3 py-2"
                placeholder="Broadcast subject"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                value={broadcastForm.message}
                onChange={(e) => setBroadcastForm({...broadcastForm, message: e.target.value})}
                className="w-full border rounded px-3 py-2 h-32"
                placeholder="Your broadcast message..."
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> This will send notifications to all selected users. 
                    Please review your message carefully before sending.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={sendBroadcast}
              disabled={loading || !broadcastForm.subject || !broadcastForm.message}
              className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50 flex items-center"
            >
              <Users className="w-4 h-4 mr-2" />
              {loading ? 'Broadcasting...' : 'Send Broadcast'}
            </button>
          </div>
        </div>
      )}

      {/* Notification History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">📋 Notification History</h2>
          </div>
          <div className="p-6">
            {notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map(notification => (
                  <div key={notification.id} className="border rounded p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          {getStatusIcon(notification.status)}
                          <span className="ml-2 font-medium">{notification.subject}</span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                            notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                            notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {notification.priority}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <span>Type: {notification.type}</span>
                          <span className="mx-2">•</span>
                          <span>Sent: {new Date(notification.createdAt).toLocaleString()}</span>
                          {notification.recipients && (
                            <>
                              <span className="mx-2">•</span>
                              <span>Recipients: {Array.isArray(notification.recipients) ? notification.recipients.length : notification.recipients}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No notifications sent yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationsPage;