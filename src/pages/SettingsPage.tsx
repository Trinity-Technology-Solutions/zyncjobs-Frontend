import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Mail, Lock, User, Trash2, LogOut, Shield } from 'lucide-react';
import Notification from '../components/Notification';
import BackButton from '../components/BackButton';
import { accountAPI } from '../api/account';


interface SettingsPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate, user: propUser, onLogout }) => {
  const [user, setUser] = useState<any>(propUser || null);
  const [activeTab, setActiveTab] = useState('Account Information');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    isVisible: boolean;
  }>({ type: 'success', message: '', isVisible: false });

  // Form states
  const [emailForm, setEmailForm] = useState({ newEmail: '', confirmEmail: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailForm.newEmail !== emailForm.confirmEmail) {
      setNotification({ type: 'error', message: 'Email addresses do not match', isVisible: true });
      return;
    }
    const userId = accountAPI.getUserIdFromStorage();
    if (!userId) {
      setNotification({ type: 'error', message: 'Could not identify user. Please log in again.', isVisible: true });
      return;
    }
    const result = await accountAPI.changeEmail(userId, emailForm.newEmail);
    if (result.success) {
      const updatedUser = { ...user, email: emailForm.newEmail };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setEmailForm({ newEmail: '', confirmEmail: '' });
    }
    setNotification({ type: result.success ? 'success' : 'error', message: result.message, isVisible: true });
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setNotification({ type: 'error', message: 'New passwords do not match', isVisible: true });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setNotification({ type: 'error', message: 'Password must be at least 6 characters long', isVisible: true });
      return;
    }
    const userId = accountAPI.getUserIdFromStorage();
    if (!userId) {
      setNotification({ type: 'error', message: 'Could not identify user. Please log in again.', isVisible: true });
      return;
    }
    const result = await accountAPI.changePassword(userId, passwordForm.currentPassword, passwordForm.newPassword);
    if (result.success) {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
    setNotification({ type: result.success ? 'success' : 'error', message: result.message, isVisible: true });
  };

  const handleDeleteAccount = async () => {
    console.log('🗑️ Delete account clicked');
    
    const confirmed = await (window as any).confirmAsync('Are you sure you want to delete your account? This action cannot be undone.');
    if (confirmed) {
      console.log('✅ User confirmed deletion');
      
      try {
        // Get user ID using the utility function
        const userId = accountAPI.getUserIdFromStorage();
        
        if (!userId) {
          setNotification({
            type: 'error',
            message: 'Could not identify user for deletion. Account will be cleared locally.',
            isVisible: true
          });
        } else {
          console.log('🌐 Attempting to delete account from server...');
          
          // Call delete API using the utility function
          const result = await accountAPI.deleteAccount(userId);
          
          if (result.success) {
            console.log('✅ Account deleted from server successfully');
            setNotification({
              type: 'success',
              message: result.message,
              isVisible: true
            });
          } else {
            console.error('❌ Failed to delete from server:', result.error);
            setNotification({
              type: 'error',
              message: `${result.message}. Account cleared locally.`,
              isVisible: true
            });
          }
        }
        
      } catch (error) {
        console.error('❌ Unexpected error during account deletion:', error);
        setNotification({
          type: 'error',
          message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}. Account cleared locally.`,
          isVisible: true
        });
      } finally {
        // Always clear localStorage and logout regardless of API call result
        console.log('🧹 Clearing user data and logging out...');
        accountAPI.clearUserData();
        
        console.log('👤 Setting user to null...');
        setUser(null);
        
        if (onLogout) {
          console.log('🚪 Calling onLogout...');
          onLogout();
        }
        
        console.log('🏠 Navigating to home in 2 seconds...');
        setTimeout(() => {
          onNavigate('home');
        }, 2000);
      }
    } else {
      console.log('❌ User cancelled deletion');
    }
  };

  return (
    <>
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification({ ...notification, isVisible: false })}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col space-y-4">
              <BackButton 
                onClick={() => onNavigate('dashboard')}
                text="Back to Dashboard"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors self-start"
              />
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/90 backdrop-blur-md border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              <button 
                onClick={() => setActiveTab('Account Information')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'Account Information' 
                    ? 'border-red-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Account Information
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'Account Information' && (
            <div className="space-y-6">
              <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-sm border card-hover">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
                  <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
                </div>

                {/* Email Section */}
                <div className="border-b">
                  <button
                    onClick={() => toggleSection('email')}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">Email Address</h3>
                        <p className="text-sm text-gray-500">{user?.email || 'No email set'}</p>
                      </div>
                    </div>
                    {expandedSections.email ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </button>
                  
                  {expandedSections.email && (
                    <div className="px-6 pb-6 bg-gray-50">
                      <form onSubmit={handleEmailUpdate} className="space-y-4 max-w-md">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Email Address
                          </label>
                          <input
                            type="email"
                            value={emailForm.newEmail}
                            onChange={(e) => setEmailForm({...emailForm, newEmail: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Enter new email address"
                            aria-label="New email address"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Email Address
                          </label>
                          <input
                            type="email"
                            value={emailForm.confirmEmail}
                            onChange={(e) => setEmailForm({...emailForm, confirmEmail: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Confirm new email address"
                            aria-label="Confirm new email address"
                            required
                          />
                        </div>
                        <div className="pt-2">
                          <button
                            type="submit"
                            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-glow text-white px-6 py-2 rounded-md font-medium transition-all duration-300 btn-glow"
                          >
                            Update Email
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>

                {/* Password Section */}
                <div className="border-b">
                  <button
                    onClick={() => toggleSection('password')}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <Lock className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">Password</h3>
                        <p className="text-sm text-gray-500">Update your account password</p>
                      </div>
                    </div>
                    {expandedSections.password ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </button>
                  
                  {expandedSections.password && (
                    <div className="px-6 pb-6 bg-gray-50">
                      <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                          </label>
                          <input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Enter current password"
                            aria-label="Current password"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Enter new password (min 6 characters)"
                            aria-label="New password"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Confirm new password"
                            aria-label="Confirm new password"
                            required
                          />
                        </div>
                        <div className="pt-2">
                          <button
                            type="submit"
                            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-glow text-white px-6 py-2 rounded-md font-medium transition-all duration-300 btn-glow"
                          >
                            Update Password
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>

              {/* Privacy Settings Link */}
              <div className="border-b">
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900">Privacy & Data</h3>
                      <p className="text-sm text-gray-500">Manage consent, download or delete your data</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('privacy-settings')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors text-sm"
                  >
                    Manage
                  </button>
                </div>
              </div>

              {/* Manage Account Section */}
                <div className="border-b">
                  <button
                    onClick={() => toggleSection('manage')}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">Account Management</h3>
                        <p className="text-sm text-gray-500">Manage or delete your account</p>
                      </div>
                    </div>
                    {expandedSections.manage ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </button>
                  
                  {expandedSections.manage && (
                    <div className="px-6 pb-6 bg-gray-50">
                      <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-lg p-6 card-hover max-w-md">
                        <div className="flex items-start">
                          <Trash2 className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-medium text-red-900 mb-2">Delete Account</h4>
                            <p className="text-sm text-red-700 mb-4 leading-relaxed">
                              Permanently delete your account and all associated data. This action cannot be undone.
                            </p>
                            <button
                              onClick={handleDeleteAccount}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                            >
                              Delete Account
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Logout Section */}
                <div>
                  <div className="flex items-center justify-between p-6">
                    <div className="flex items-center">
                      <LogOut className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">Logout</h3>
                        <p className="text-sm text-gray-500">Sign out of your account</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (onLogout) onLogout();
                        onNavigate('home');
                      }}
                      className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>
    </>
  );
};

export default SettingsPage;
