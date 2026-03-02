import React, { useState } from 'react';
import { AccountStatus } from '../utils/rolePermissions';

interface UserStatusManagerProps {
  userId: string;
  currentStatus: AccountStatus;
  onStatusChange: (userId: string, newStatus: AccountStatus) => Promise<void>;
}

const UserStatusManager: React.FC<UserStatusManagerProps> = ({
  userId,
  currentStatus,
  onStatusChange
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusChange = async (newStatus: AccountStatus) => {
    if (newStatus === currentStatus) return;
    
    setIsLoading(true);
    try {
      await onStatusChange(userId, newStatus);
    } finally {
      setIsLoading(false);
    }
  };

  const statusOptions: { value: AccountStatus; label: string; color: string }[] = [
    { value: 'active', label: 'Active', color: 'green' },
    { value: 'suspended', label: 'Suspend', color: 'orange' },
    { value: 'deleted', label: 'Delete', color: 'red' }
  ];

  return (
    <div className="flex gap-2">
      {statusOptions.map(({ value, label, color }) => (
        <button
          key={value}
          onClick={() => handleStatusChange(value)}
          disabled={isLoading || value === currentStatus}
          className={`px-3 py-1 text-sm rounded ${
            value === currentStatus
              ? `bg-${color}-100 text-${color}-800 cursor-not-allowed`
              : `bg-gray-100 hover:bg-${color}-50 text-gray-700 hover:text-${color}-700`
          } ${isLoading ? 'opacity-50' : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default UserStatusManager;