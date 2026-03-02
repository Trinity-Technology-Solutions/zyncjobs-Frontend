import React from 'react';
import { hasPermission, canAccess, UserRole } from '../utils/rolePermissions';

interface RoleGuardProps {
  children: React.ReactNode;
  userRole: UserRole;
  requiredPermission?: string;
  requiredFeature?: string;
  fallback?: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ 
  children, 
  userRole, 
  requiredPermission, 
  requiredFeature,
  fallback = null 
}) => {
  // Check permission-based access
  if (requiredPermission && !hasPermission(userRole, requiredPermission)) {
    return <>{fallback}</>;
  }
  
  // Check feature-based access
  if (requiredFeature && !canAccess(userRole, requiredFeature)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

export default RoleGuard;
export { RoleGuard };