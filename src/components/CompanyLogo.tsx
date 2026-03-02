import React, { useState, useEffect } from 'react';

interface CompanyLogoProps {
  companyName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CompanyLogo: React.FC<CompanyLogoProps> = ({ 
  companyName, 
  size = 'md', 
  className = '' 
}) => {
  const [logoSrc, setLogoSrc] = useState<string>('');
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };

  const getCompanyDomain = (name: string): string => {
    const cleanName = name.toLowerCase().trim();
    
    const domainMap: { [key: string]: string } = {
      'google': 'google.com',
      'microsoft': 'microsoft.com',
      'apple': 'apple.com',
      'amazon': 'amazon.com',
      'meta': 'meta.com',
      'facebook': 'meta.com',
      'netflix': 'netflix.com',
      'tesla': 'tesla.com',
      'uber': 'uber.com',
      'airbnb': 'airbnb.com',
      'spotify': 'spotify.com',
      'twitter': 'x.com',
      'linkedin': 'linkedin.com',
      'ibm': 'ibm.com',
      'accenture': 'accenture.com',
      'oracle': 'oracle.com',
      'salesforce': 'salesforce.com',
      'adobe': 'adobe.com',
      'tcs': 'tcs.com',
      'infosys': 'infosys.com',
      'wipro': 'wipro.com',
      'zoho': 'zoho.com'
    };

    // Direct match
    if (domainMap[cleanName]) {
      return domainMap[cleanName];
    }

    // Partial match
    for (const [key, domain] of Object.entries(domainMap)) {
      if (cleanName.includes(key)) {
        return domain;
      }
    }

    return '';
  };

  const getLetterAvatar = (name: string): string => {
    const initials = name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
      '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
    ];
    
    const colorIndex = name.length % colors.length;
    const bgColor = colors[colorIndex];

    return `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <rect width="48" height="48" fill="${bgColor}" rx="8"/>
        <text x="24" y="30" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">${initials}</text>
      </svg>
    `)}`;
  };

  useEffect(() => {
    if (!companyName) {
      setLogoSrc(getLetterAvatar('ZJ'));
      return;
    }

    // Special handling for Trinity
    if (companyName.toLowerCase().includes('trinity')) {
      setLogoSrc('/images/company-logos/trinity-logo.png');
      return;
    }

    const domain = getCompanyDomain(companyName);
    if (domain) {
      setLogoSrc(`https://logo.clearbit.com/${domain}`);
    } else {
      setLogoSrc(getLetterAvatar(companyName));
      setHasError(true); // Skip clearbit attempt
    }
  }, [companyName]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setLogoSrc(getLetterAvatar(companyName || 'Company'));
    }
  };

  const handleLoad = () => {
    // Logo loaded successfully, no need for fallback
    console.log(`✅ Logo loaded for ${companyName}`);
  };

  return (
    <div className={`${sizeClasses[size]} ${className} flex-shrink-0`}>
      <img
        src={logoSrc}
        alt={`${companyName} logo`}
        className="w-full h-full object-contain rounded-lg"
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />
    </div>
  );
};

export default CompanyLogo;