import React from 'react';
import { AccountStatus, getStatusInfo } from '../utils/rolePermissions';

interface UserStatusBadgeProps {
  status: AccountStatus;
  className?: string;
}

const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ status, className = '' }) => {
  const statusInfo = getStatusInfo(status);
  
  const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
  const colorClasses = {
    green: 'bg-green-100 text-green-800',
    orange: 'bg-orange-100 text-orange-800', 
    red: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`${baseClasses} ${colorClasses[statusInfo.color]} ${className}`}>
      {statusInfo.label}
    </span>
  );
};

export default UserStatusBadge;