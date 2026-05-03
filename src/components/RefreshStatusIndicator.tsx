import React from 'react';
import { RefreshCw, Clock, CheckCircle } from 'lucide-react';

interface RefreshStatusIndicatorProps {
  refreshCount?: number;
  lastRefreshedAt?: string;
  maxRefreshes?: number;
  className?: string;
}

const RefreshStatusIndicator: React.FC<RefreshStatusIndicatorProps> = ({
  refreshCount = 0,
  lastRefreshedAt,
  maxRefreshes = 3,
  className = ''
}) => {
  // Don't show if never refreshed
  if (refreshCount === 0 && !lastRefreshedAt) {
    return null;
  }

  const formatLastRefresh = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString('en-GB');
  };

  return (
    <div className={`flex items-center space-x-2 text-xs text-gray-500 ${className}`}>
      {refreshCount > 0 && (
        <div className="flex items-center space-x-1">
          <RefreshCw className="w-3 h-3" />
          <span>{refreshCount}/{maxRefreshes} refreshes</span>
        </div>
      )}
      
      {lastRefreshedAt && (
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>Last: {formatLastRefresh(lastRefreshedAt)}</span>
        </div>
      )}
      
      {refreshCount > 0 && refreshCount < maxRefreshes && (
        <div className="flex items-center space-x-1 text-green-600">
          <CheckCircle className="w-3 h-3" />
          <span>Available</span>
        </div>
      )}
      
      {refreshCount >= maxRefreshes && (
        <div className="flex items-center space-x-1 text-orange-600">
          <span>Limit reached</span>
        </div>
      )}
    </div>
  );
};

export default RefreshStatusIndicator;