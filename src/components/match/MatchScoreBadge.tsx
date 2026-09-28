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

  const getSvg = (d: string) => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} /></svg>;

  const getSvg80 = () => getSvg('M12 15v2m-6 4h12a2 2 0 002-2v-4a2 2 0 00-2-2m-6 4h12a2 2 0 002-2v-4a2 2 0 00-2-2');

  const getSvg60 = () => getSvg('M13 10V3L4 14h7v7l9-11h-7z');

  const getSvgLow = () => getSvg('M9 12H6a2 2 0 00-2 2v7a2 2 0 002 2h3l.586-2.414a12 12 0 111.718 3.1m7.1 2.123A4.5 4.5 0 1112 15m0-12l-6 6m6-6l6-6');

  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1.5',
    lg: 'text-lg px-4 py-2',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} ${getColor()} text-white font-bold rounded-lg`}>
        {Math.round(score)}%
                                  {score >= 80 && getSvg80()}
                                  {score >= 60 && score < 80 && getSvg60()}
                                  {score < 60 && getSvgLow()}
      </div>
      {showLabel && <span className="text-gray-600 text-sm">{getLabel()} Match</span>}
    </div>
  );
};
