import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Mail, Lock, User, Trash2, LogOut, Shield, Eye, EyeOff, Info } from 'lucide-react';
import Notification from '../components/Notification';
import BackButton from '../components/BackButton';
import { accountAPI } from '../api/account';
import { updateUserInStorage } from '../utils/userStorage';


interface SettingsPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
  onUserUpdate?: (user: any) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate, user: propUser, onLogout, onUserUpdate }) => {
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
  const [otpForm, setOtpForm] = useState({ otp: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] as string[] });
  const [otpStep, setOtpStep] = useState<'idle' | 'sent' | 'verified'>('idle');
  const [otpMessage, setOtpMessage] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCount, setResendCount] = useState(0);

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

  // Step 1 — Send OTP to new email
  const handleSendOTP = async (e: React.FormEvent) => {
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
    setOtpLoading(true);
    setOtpError('');
    setOtpMessage('');
    const result = await accountAPI.sendEmailOTP(emailForm.newEmail, emailForm.confirmEmail);
    setOtpLoading(false);
    if (result.success) {
      setOtpStep('sent');
      setOtpMessage(result.message);
      setResendCount(0);
    } else {
      setOtpError(result.message);
    }
    setNotification({ type: result.success ? 'success' : 'error', message: result.message, isVisible: true });
  };

  // Step 2 — Verify OTP and update email
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = accountAPI.getUserIdFromStorage();
    if (!userId) {
      setNotification({ type: 'error', message: 'Could not identify user. Please log in again.', isVisible: true });
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    const result = await accountAPI.verifyEmailOTP(emailForm.newEmail, otpForm.otp);
    setOtpLoading(false);
    if (result.success) {
      // Apply the verified email immediately so the Settings page, global auth
      // state, and storage all update without a refresh or re-login.
      const newEmail = emailForm.newEmail;
      const updatedUser = { ...user, email: newEmail };
      setUser(updatedUser);
      updateUserInStorage(updatedUser);
      onUserUpdate?.(updatedUser);
      setOtpStep('verified');
      setOtpMessage('Your email address has been updated successfully.');
      setEmailForm({ newEmail: '', confirmEmail: '' });
      setOtpForm({ otp: '' });

      // Reconcile against the source of truth by reusing the existing GET /me
      // flow. This refreshes the authenticated profile and any cached data.
      accountAPI.getMe().then((freshUser) => {
        if (freshUser?.email) {
          const reconciled = { ...updatedUser, ...freshUser, email: freshUser.email };
          setUser(reconciled);
          updateUserInStorage(reconciled);
          onUserUpdate?.(reconciled);
        }
      }).catch(() => { /* optimistic update is already applied */ });
    } else {
      setOtpError(result.message);
      if (result.message.includes('expired') || result.message.includes('Too many')) {
        setOtpStep('idle');
      }
    }
    setNotification({ type: result.success ? 'success' : 'error', message: result.message, isVisible: true });
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setOtpError('');
    setOtpMessage('');
    setOtpLoading(true);
    const result = await accountAPI.resendEmailOTP(emailForm.newEmail);
    setOtpLoading(false);
    if (result.success) {
      setResendCount(prev => prev + 1);
      setOtpMessage(result.message);
      setOtpForm({ otp: '' });
    } else {
      setOtpError(result.message);
    }
    setNotification({ type: result.success ? 'success' : 'error', message: result.message, isVisible: true });
  };

  const validatePassword = (pwd: string) => {
    const feedback: string[] = [];
    let score = 0;
    if (pwd.length >= 8) score++; else feedback.push('At least 8 characters');
    if (/[A-Z]/.test(pwd)) score++; else feedback.push('One uppercase letter');
    if (/[a-z]/.test(pwd)) score++; else feedback.push('One lowercase letter');
    if (/\d/.test(pwd)) score++; else feedback.push('One number');
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++; else feedback.push('One special character');
    return { score, feedback };
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setNotification({ type: 'error', message: 'New passwords do not match', isVisible: true });
      return;
    }
    const strength = validatePassword(passwordForm.newPassword);
    if (strength.score < 4) {
      setNotification({ type: 'error', message: 'Password must include at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character', isVisible: true });
      return;
    }
    const userId = user?.id || user?._id || accountAPI.getUserIdFromStorage();
    if (!userId) {
      setNotification({ type: 'error', message: 'Could not identify user. Please log in again.', isVisible: true });
      return;
    }
    const result = await accountAPI.changePassword(userId, passwordForm.currentPassword, passwordForm.newPassword);
    if (result.success) {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswords({ current: false, new: false, confirm: false });
      setPasswordStrength({ score: 0, feedback: [] });
    }
    setNotification({ type: result.success ? 'success' : 'error', message: result.message, isVisible: true });
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      const userId = accountAPI.getUserIdFromStorage();
      if (userId) {
        await accountAPI.deleteAccount(userId);
      }
    } catch {
      // proceed with local cleanup regardless
    } finally {
      accountAPI.clearUserData();
      setUser(null);
      setShowDeleteModal(false);
      setDeleting(false);
      if (onLogout) onLogout();
      setTimeout(() => { onNavigate('home'); }, 500);
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
                fallback="/dashboard"
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
            <div className="flex overflow-x-auto">
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

                {/* ── Email Section ── */}
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
                      {!(user?.role === 'candidate' || user?.userType === 'candidate') ? (
                        /* Non-candidates (employers, admins) — read-only */
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 max-w-md">
                          <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-blue-800 font-medium mb-1">Email Address</p>
                              <p className="text-sm text-blue-700 leading-relaxed">
                                Your email address cannot be changed from your account settings.
                              </p>
                              <p className="text-sm text-blue-600 leading-relaxed mt-2">
                                If you need to update your registered email address, please contact the administrator for assistance.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : otpStep === 'verified' ? (
                        /* ✅ Success state */
                        <div className="bg-green-50 border border-green-200 rounded-lg p-5 max-w-md">
                          <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <div>
                              <p className="text-sm text-green-800 font-semibold mb-1">Email Updated</p>
                              <p className="text-sm text-green-700">Your email address has been updated successfully.</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setOtpStep('idle');
                                  setEmailForm({ newEmail: '', confirmEmail: '' });
                                  setOtpForm({ otp: '' });
                                  setOtpMessage('');
                                  setOtpError('');
                                }}
                                className="mt-3 text-sm text-green-700 underline hover:text-green-900 transition-colors"
                              >
                                Change email again
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : otpStep === 'idle' ? (
                        /* Step 1 — Enter new email + send OTP */
                        <form onSubmit={handleSendOTP} className="space-y-4 max-w-md">
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
                          {otpError && (
                            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{otpError}</p>
                          )}
                          <div className="pt-2">
                            <button
                              type="submit"
                              disabled={otpLoading}
                              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-glow text-white px-6 py-2 rounded-md font-medium transition-all duration-300 btn-glow disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {otpLoading ? 'Sending…' : 'Send Verification Code'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        /* Step 2 — Enter OTP */
                        <div className="space-y-4 max-w-md">
                          {otpMessage && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                              <Mail className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-blue-800">{otpMessage}</p>
                            </div>
                          )}
                          <form onSubmit={handleVerifyOTP} className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-3">
                                Verification Code
                              </label>
                              {/* 6-digit OTP boxes */}
                              <div className="flex gap-2 mb-1">
                                {Array.from({ length: 6 }).map((_, idx) => (
                                  <input
                                    key={idx}
                                    id={`otp-digit-${idx}`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={otpForm.otp[idx] || ''}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/\D/g, '');
                                      const digits = otpForm.otp.split('');
                                      digits[idx] = val;
                                      const newOtp = digits.join('').slice(0, 6);
                                      setOtpForm({ otp: newOtp });
                                      if (val && idx < 5) {
                                        const next = document.getElementById(`otp-digit-${idx + 1}`);
                                        next?.focus();
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Backspace' && !otpForm.otp[idx] && idx > 0) {
                                        const digits = otpForm.otp.split('');
                                        digits[idx - 1] = '';
                                        setOtpForm({ otp: digits.join('') });
                                        const prev = document.getElementById(`otp-digit-${idx - 1}`);
                                        prev?.focus();
                                      }
                                    }}
                                    onPaste={(e) => {
                                      e.preventDefault();
                                      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                                      setOtpForm({ otp: pasted });
                                    }}
                                    className="w-11 h-12 text-center text-lg font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                    aria-label={`OTP digit ${idx + 1}`}
                                  />
                                ))}
                              </div>
                            </div>
                            {otpError && (
                              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{otpError}</p>
                            )}
                            <div className="flex flex-col sm:flex-row gap-3 pt-1">
                              <button
                                type="submit"
                                disabled={otpLoading || otpForm.otp.length < 6}
                                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-glow text-white px-6 py-2 rounded-md font-medium transition-all duration-300 btn-glow disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {otpLoading ? 'Verifying…' : 'Verify & Update Email'}
                              </button>
                              <button
                                type="button"
                                onClick={handleResendOTP}
                                disabled={otpLoading || resendCount >= 3}
                                className="text-sm text-blue-600 hover:text-blue-800 underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed px-2 py-2"
                              >
                                {resendCount >= 3
                                  ? 'Resend limit reached'
                                  : otpLoading
                                  ? 'Sending…'
                                  : `Resend Code${resendCount > 0 ? ` (${3 - resendCount} left)` : ''}`}
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setOtpStep('idle'); setOtpError(''); setOtpMessage(''); setOtpForm({ otp: '' }); }}
                              className="text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
                            >
                              ← Change email address
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Password Section ── */}
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
                          <div className="relative">
                            <input
                              type={showPasswords.current ? 'text' : 'password'}
                              value={passwordForm.currentPassword}
                              onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="Enter current password"
                              aria-label="Current password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                              aria-label={showPasswords.current ? 'Hide password' : 'Show password'}
                            >
                              {showPasswords.current ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.new ? 'text' : 'password'}
                              value={passwordForm.newPassword}
                              onChange={(e) => { const val = e.target.value; setPasswordForm({...passwordForm, newPassword: val}); setPasswordStrength(validatePassword(val)); }}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="Enter new password"
                              aria-label="New password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                              aria-label={showPasswords.new ? 'Hide password' : 'Show password'}
                            >
                              {showPasswords.new ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                            </button>
                          </div>
                          {passwordForm.newPassword && (
                            <div className="mt-2">
                              <div className="flex gap-1 mb-1">
                                {[1, 2, 3, 4, 5].map((level) => (
                                  <div key={level} className={`h-1.5 flex-1 rounded-full transition-colors ${passwordStrength.score >= level ? 'bg-green-500' : 'bg-gray-200'}`} />
                                ))}
                              </div>
                              {passwordStrength.feedback.length > 0 && (
                                <ul className="text-xs text-gray-500 space-y-0.5">
                                  {passwordStrength.feedback.map((msg, i) => (
                                    <li key={i} className="flex items-center gap-1"><span className="text-red-400">●</span> {msg}</li>
                                  ))}
                                </ul>
                              )}
                              {passwordStrength.score >= 4 && (
                                <p className="text-xs text-green-600 flex items-center gap-1 mt-1"><span>✓</span> Strong password</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPasswords.confirm ? 'text' : 'password'}
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="Confirm new password"
                              aria-label="Confirm new password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                              aria-label={showPasswords.confirm ? 'Hide password' : 'Show password'}
                            >
                              {showPasswords.confirm ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                            </button>
                          </div>
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

                {/* ── Privacy Settings Link ── */}
                <div className="border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-6">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-gray-900">Privacy &amp; Data</h3>
                        <p className="text-sm text-gray-500">Manage consent, download or delete your data</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('privacy-settings')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md font-medium transition-colors text-sm self-start sm:self-auto flex-shrink-0 min-h-[44px] flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      Manage
                    </button>
                  </div>
                </div>

                {/* ── Account Management ── */}
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
                              onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); }}
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

                {/* ── Logout ── */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-6">
                    <div className="flex items-start gap-3">
                      <LogOut className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
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
                      className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 self-start sm:self-auto flex-shrink-0 min-h-[40px]"
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

      {/* ── Delete Account Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Account</h3>
                <p className="text-xs text-gray-500">This action is permanent and cannot be undone</p>
              </div>
            </div>

            {/* What gets deleted */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
              <p className="text-sm font-semibold text-red-800 mb-2">If you delete your account, the following will be permanently removed:</p>
              <ul className="space-y-1">
                {[
                  'Your profile & personal details',
                  'Your resume & uploaded documents',
                  'All job applications you submitted',
                  'Your saved jobs & job alerts',
                  'Interview schedules & messages',
                  'Your dashboard & activity history',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-red-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Type DELETE to confirm */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="font-bold text-red-600">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                disabled={deleting}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsPage;
