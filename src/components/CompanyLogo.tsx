import React, { useState, useEffect } from 'react';
import { getLogoWithFallbacks } from '../utils/logoUtils';

interface CompanyLogoProps {
  companyName: string;
  website?: string;
  size?: number;
  className?: string;
  alt?: string;
}

const CompanyLogo: React.FC<CompanyLogoProps> = ({ 
  companyName, 
  website, 
  size = 64, 
  className = '', 
  alt 
}) => {
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);
  const [logoSources, setLogoSources] = useState<string[]>([]);
  const [showLetterAvatar, setShowLetterAvatar] = useState(false);

  useEffect(() => {
    const sources = getLogoWithFallbacks(companyName, website);
    setLogoSources(sources);
    setCurrentLogoIndex(0);
    setShowLetterAvatar(false);
  }, [companyName, website]);

  const handleImageError = () => {
    if (currentLogoIndex < logoSources.length - 1) {
      setCurrentLogoIndex(currentLogoIndex + 1);
    } else {
      setShowLetterAvatar(true);
    }
  };

  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (showLetterAvatar || logoSources.length === 0) {
    const initials = getInitials(companyName);
    return (
      <div 
        className={`flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold rounded-lg ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={logoSources[currentLogoIndex]}
      alt={alt || `${companyName} logo`}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
      onError={handleImageError}
      loading="lazy"
    />
  );
};

export default CompanyLogo;