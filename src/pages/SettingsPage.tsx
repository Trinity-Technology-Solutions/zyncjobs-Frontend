import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Mail, Lock, User, Trash2 } from 'lucide-react';
import Notification from '../components/Notification';
import BackButton from '../components/BackButton';


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

  const handleEmailUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailForm.newEmail !== emailForm.confirmEmail) {
      setNotification({
        type: 'error',
        message: 'Email addresses do not match',
        isVisible: true
      });
      return;
    }
    
    const updatedUser = { ...user, email: emailForm.newEmail };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setEmailForm({ newEmail: '', confirmEmail: '' });
    setNotification({
      type: 'success',
      message: 'Email updated successfully!',
      isVisible: true
    });
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setNotification({
        type: 'error',
        message: 'New passwords do not match',
        isVisible: true
      });
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setNotification({
        type: 'error',
        message: 'Password must be at least 6 characters long',
        isVisible: true
      });
      return;
    }

    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setNotification({
      type: 'success',
      message: 'Password updated successfully!',
      isVisible: true
    });
  };

  const handleDeleteAccount = async () => {
    console.log('🗑️ Delete account clicked');
    
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      console.log('✅ User confirmed deletion');
      
      try {
        // Get user ID from localStorage
        const userData = localStorage.getItem('user');
        console.log('📦 User data from localStorage:', userData);
        
        if (userData) {
          const parsedUser = JSON.parse(userData);
          console.log('👤 Parsed user:', parsedUser);
          
          const userId = parsedUser.id || parsedUser._id;
          console.log('🆔 User ID for deletion:', userId);
          
          if (userId) {
            console.log('🌐 Calling delete API...');
            
            // Call delete API
            const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            console.log('📡 API Response status:', response.status);
            const responseData = await response.json();
            console.log('📡 API Response data:', responseData);
            
            if (response.ok) {
              console.log('✅ Account deleted from database');
            } else {
              console.error('❌ Failed to delete from database:', responseData);
            }
          } else {
            console.error('❌ No user ID found');
          }
        } else {
          console.error('❌ No user data in localStorage');
        }
        
        // Clear localStorage and logout regardless of API call result
        console.log('🧹 Clearing localStorage...');
        localStorage.removeItem('user');
        localStorage.clear(); // Clear everything
        
        console.log('👤 Setting user to null...');
        setUser(null);
        
        if (onLogout) {
          console.log('🚪 Calling onLogout...');
          onLogout();
        }
        
        setNotification({
          type: 'success',
          message: 'Account deleted successfully',
          isVisible: true
        });
        
        console.log('🏠 Navigating to home in 1 second...');
        setTimeout(() => {
          onNavigate('home');
        }, 1000);
        
      } catch (error) {
        console.error('❌ Delete account error:', error);
        setNotification({
          type: 'error',
          message: 'Failed to delete account. Please try again.',
          isVisible: true
        });
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <BackButton 
                  onClick={() => onNavigate('dashboard')}
                  text="Back to Dashboard"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
                />
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b">
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
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
                  <p className="text-gray-600 mt-1">Manage your account information</p>
                </div>

                {/* Email Section */}
                <div className="border-b">
                  <button
                    onClick={() => toggleSection('email')}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">Email</h3>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                    {expandedSections.email ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  
                  {expandedSections.email && (
                    <div className="px-6 pb-6">
                      <form onSubmit={handleEmailUpdate} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Email Address
                          </label>
                          <input
                            type="email"
                            value={emailForm.newEmail}
                            onChange={(e) => setEmailForm({...emailForm, newEmail: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter new email address"
                            aria-label="New email address"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm New Email Address
                          </label>
                          <input
                            type="email"
                            value={emailForm.confirmEmail}
                            onChange={(e) => setEmailForm({...emailForm, confirmEmail: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Confirm new email address"
                            aria-label="Confirm new email address"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                        >
                          Update Email
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Password Section */}
                <div className="border-b">
                  <button
                    onClick={() => toggleSection('password')}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <Lock className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">Password</h3>
                        <p className="text-sm text-gray-500">Change your password</p>
                      </div>
                    </div>
                    {expandedSections.password ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  
                  {expandedSections.password && (
                    <div className="px-6 pb-6">
                      <form onSubmit={handlePasswordUpdate} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Current Password
                          </label>
                          <input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter current password"
                            aria-label="Current password"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter new password"
                            aria-label="New password"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Confirm new password"
                            aria-label="Confirm new password"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                        >
                          Update Password
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Manage Account Section */}
                <div>
                  <button
                    onClick={() => toggleSection('manage')}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">Manage Account</h3>
                        <p className="text-sm text-gray-500">Delete your account</p>
                      </div>
                    </div>
                    {expandedSections.manage ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  
                  {expandedSections.manage && (
                    <div className="px-6 pb-6">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <Trash2 className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
                          <div>
                            <h4 className="font-medium text-red-900 mb-2">Delete Account</h4>
                            <p className="text-sm text-red-700 mb-4">
                              Once you delete your account, there is no going back. Please be certain.
                            </p>
                            <button
                              onClick={handleDeleteAccount}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium"
                            >
                              Delete Account
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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