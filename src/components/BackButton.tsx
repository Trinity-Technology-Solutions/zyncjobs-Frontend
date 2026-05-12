import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  onClick?: () => void;
  text?: string;
  className?: string;
  position?: 'inline' | 'top-left';
}

const BackButton: React.FC<BackButtonProps> = ({ onClick, className = '', position = 'inline' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const positionClass = position === 'top-left' ? 'absolute top-4 left-4 z-10' : '';

  return (
    <div className={positionClass}>
    <button
      onClick={handleClick}
      aria-label="Go back"
      className={`inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 shadow-sm hover:shadow-md transition-all ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
    </button>
    </div>
  );
};

export default BackButton;
