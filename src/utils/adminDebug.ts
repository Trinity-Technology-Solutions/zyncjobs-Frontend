// Admin Debug Utility
// Use this to debug admin invite flow issues

export const debugAdminFlow = () => {
  console.log('🔍 ADMIN DEBUG INFO:');
  console.log('==================');
  
  // Check localStorage
  const storedUser = localStorage.getItem('user');
  const lastUserType = localStorage.getItem('lastUserType');
  
  console.log('📦 localStorage.user:', storedUser);
  console.log('📦 localStorage.lastUserType:', lastUserType);
  
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      console.log('👤 Parsed user object:', parsed);
      console.log('👤 User type:', parsed.type);
      console.log('👤 User role:', parsed.role);
      console.log('👤 User userType:', parsed.userType);
    } catch (e) {
      console.error('❌ Failed to parse stored user:', e);
    }
  }
  
  // Check sessionStorage
  console.log('📦 sessionStorage keys:', Object.keys(sessionStorage));
  
  // Check current URL
  console.log('🌐 Current URL:', window.location.href);
  console.log('🌐 Current pathname:', window.location.pathname);
  
  // Check tokens
  const accessToken = sessionStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  console.log('🔑 Access token exists:', !!accessToken);
  console.log('🔑 Refresh token exists:', !!refreshToken);
  
  if (accessToken) {
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      console.log('🔑 Token payload:', payload);
      console.log('🔑 Token userType:', payload.userType);
      console.log('🔑 Token role:', payload.role);
    } catch (e) {
      console.error('❌ Failed to decode token:', e);
    }
  }
  
  // Check React Router state
  console.log('📍 React Router pathname:', window.location.pathname);
  
  // Check if we're in admin context
  const isAdminPath = window.location.pathname.startsWith('/admin');
  console.log('🔒 Is admin path:', isAdminPath);
  
  console.log('==================');
};

export const debugInviteEmail = (email: string) => {
  console.log('📧 EMAIL DEBUG INFO:');
  console.log('==================');
  console.log('📧 Email to invite:', email);
  console.log('📧 Email validation:', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  console.log('📧 API endpoint:', `${import.meta.env.VITE_API_URL || '/api'}/admin/users/invite-admin`);
  console.log('📧 Environment variables:');
  console.log('   - VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('   - VITE_SOCKET_URL:', import.meta.env.VITE_SOCKET_URL);
  console.log('   - VITE_APP_URL:', import.meta.env.VITE_APP_URL);
  console.log('==================');
};

// Helper to clear all user data and force admin login
export const forceAdminReset = () => {
  console.log('🔄 FORCING ADMIN RESET...');
  localStorage.removeItem('user');
  localStorage.removeItem('lastUserType');
  sessionStorage.clear();
  window.location.href = '/admin/login';
};

// Add to window for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).debugAdminFlow = debugAdminFlow;
  (window as any).debugInviteEmail = debugInviteEmail;
  (window as any).forceAdminReset = forceAdminReset;
}