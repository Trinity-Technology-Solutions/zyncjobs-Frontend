import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  buttonText: string;
  onButtonClick: () => void;
  icon?: 'jobs' | 'applications' | 'interviews' | 'postings';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  buttonText,
  onButtonClick,
  icon = 'jobs'
}) => {
  const renderIcon = () => {
    switch (icon) {
      case 'jobs':
        return (
          <svg className="w-48 h-48 mb-8 text-gray-400" viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="25" y="60" width="70" height="40" rx="3" />
            <rect x="32" y="52" width="56" height="10" rx="2" />
            <rect x="38" y="38" width="44" height="16" rx="2" />
            <line x1="42" y1="42" x2="60" y2="42" strokeWidth="1.2" />
            <line x1="42" y1="48" x2="76" y2="48" strokeWidth="1.2" />
            <path d="M 70 65 L 78 65" strokeWidth="2.5" />
          </svg>
        );
      case 'applications':
        return (
          <svg className="w-48 h-48 mb-8 text-gray-400" viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="20" y="25" width="80" height="70" rx="3" />
            <line x1="30" y1="40" x2="90" y2="40" strokeWidth="1.2" />
            <line x1="30" y1="50" x2="90" y2="50" strokeWidth="1.2" />
            <line x1="30" y1="60" x2="70" y2="60" strokeWidth="1.2" />
            <circle cx="60" cy="80" r="8" fill="none" strokeWidth="1.2" />
            <path d="M 60 75 L 60 85 M 55 80 L 65 80" strokeWidth="1.2" />
          </svg>
        );
      case 'interviews':
        return (
          <svg className="w-48 h-48 mb-8 text-gray-400" viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1.2">
            <circle cx="40" cy="40" r="12" />
            <path d="M 30 55 Q 30 60 40 60 Q 50 60 50 55" />
            <circle cx="80" cy="40" r="12" />
            <path d="M 70 55 Q 70 60 80 60 Q 90 60 90 55" />
            <line x1="40" y1="65" x2="80" y2="65" strokeWidth="1.5" />
            <line x1="40" y1="75" x2="80" y2="75" strokeWidth="1.5" />
            <line x1="40" y1="85" x2="70" y2="85" strokeWidth="1.5" />
          </svg>
        );
      case 'postings':
        return (
          <svg className="w-48 h-48 mb-8 text-gray-400" viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="20" y="20" width="80" height="80" rx="3" />
            <line x1="30" y1="35" x2="90" y2="35" strokeWidth="1.2" />
            <line x1="30" y1="45" x2="90" y2="45" strokeWidth="1.2" />
            <line x1="30" y1="55" x2="90" y2="55" strokeWidth="1.2" />
            <line x1="30" y1="65" x2="75" y2="65" strokeWidth="1.2" />
            <circle cx="85" cy="75" r="8" fill="none" strokeWidth="1.5" />
            <path d="M 85 70 L 85 80 M 80 75 L 90 75" strokeWidth="1.5" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      <div className="bg-white rounded-3xl border border-gray-200 flex flex-col items-center justify-center py-24 px-4">
        {renderIcon()}
        <h3 className="text-3xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-500 text-center mb-8 max-w-md text-lg">
          {description}
        </p>
        <button
          onClick={onButtonClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-full font-semibold transition-colors text-lg"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default EmptyState;

