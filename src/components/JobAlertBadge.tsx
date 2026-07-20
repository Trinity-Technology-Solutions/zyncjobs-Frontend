import React from 'react';

interface JobAlertBadgeProps {
  count: number;
  className?: string;
}

const JobAlertBadge: React.FC<JobAlertBadgeProps> = ({ count, className = '' }) => {
  if (count <= 0) return null;
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-red-500 text-white rounded-full leading-none ${className}`}
      aria-label={`${count} unread job alert notifications`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

export default JobAlertBadge;
