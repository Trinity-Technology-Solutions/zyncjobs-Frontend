import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
  user: { type: 'candidate' | 'employer' | 'admin' | 'super_admin' | 'manager' } | null;
  allowedRoles?: Array<'candidate' | 'employer' | 'admin' | 'super_admin' | 'manager'>;
  redirectTo?: string;
  userLoading?: boolean;
}

const RedirectWithAlert: React.FC<{ message: string; to: string }> = ({ message, to }) => {
  useEffect(() => { window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: String(message) } })); }, []);
  return <Navigate to={to} replace />;
};

const AuthGuard: React.FC<AuthGuardProps> = ({ children, user, allowedRoles, redirectTo = '/login', userLoading = false }) => {
  const location = useLocation();

  // Wait for session restore before redirecting
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user?.type) return <Navigate to={redirectTo} state={{ from: location }} replace />;

  const effectiveRole = user.type === 'super_admin' ? 'admin' : user.type;
  if (allowedRoles && !allowedRoles.includes(user.type) && !allowedRoles.includes(effectiveRole as any)) {
    if (user.type === 'employer' && allowedRoles.includes('candidate')) {
      return <RedirectWithAlert message="This feature is only accessible to candidates. Please login with a candidate account." to="/dashboard" />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
