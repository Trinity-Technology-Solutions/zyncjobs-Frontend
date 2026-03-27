import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  onClick?: () => void;
  text?: string;
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  className = ''
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else if (onClick) {
      onClick();
    } else {
      navigate('/');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors ${className}`}
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back
    </button>
  );
};

export default BackButton;
