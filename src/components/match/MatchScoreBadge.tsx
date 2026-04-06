import React from 'react';

interface MatchScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const MatchScoreBadge: React.FC<MatchScoreBadgeProps> = ({ score, size = 'md', showLabel = true }) => {
  const getColor = () => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Fair';
  };

  const getEmoji = () => {
    if (score >= 80) return '🔥';
    if (score >= 60) return '👍';
    return '💡';
  };

  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1.5',
    lg: 'text-lg px-4 py-2',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} ${getColor()} text-white font-bold rounded-lg`}>
        {Math.round(score)}% {getEmoji()}
      </div>
      {showLabel && <span className="text-gray-600 text-sm">{getLabel()} Match</span>}
    </div>
  );
};
