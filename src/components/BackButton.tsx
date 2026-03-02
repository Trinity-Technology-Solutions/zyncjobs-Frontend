import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onClick: () => void;
  text?: string;
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  onClick, 
  text = "Back", 
  className = "" 
}) => {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors ${className}`}
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {text}
    </button>
  );
};

export default BackButton;