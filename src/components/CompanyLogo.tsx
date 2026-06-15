import React, { useState, useEffect } from 'react';
import { getCompanyDomain, getLocalCompanyLogo } from '../utils/logoUtils';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface CompanyLogoProps {
  companyName: string;
  website?: string;
  size?: number;
  className?: string;
  alt?: string;
  storedLogo?: string;
}

function getSources(companyName: string, website?: string, storedLogo?: string): string[] {
  const urls: string[] = [];

  // 1. Local file (trinity, nambikkai, growthpulse, inypeople)
  const local = getLocalCompanyLogo(companyName);
  if (local) urls.push(local);

  // 2. Stored logo — route external logo services through proxy
  if (storedLogo && storedLogo.startsWith('http') && !storedLogo.includes('ui-avatars.com') && !storedLogo.includes('google.com/s2/favicons')) {
    if (storedLogo.includes('logo.clearbit.com')) {
      const m = storedLogo.match(/logo\.clearbit\.com\/([^/?]+)/);
      if (m) urls.push(`${API_BASE}/logo-proxy?domain=${encodeURIComponent(m[1])}`);
    } else if (storedLogo.includes('img.logo.dev')) {
      const m = storedLogo.match(/img\.logo\.dev\/([^?]+)/);
      if (m) urls.push(`${API_BASE}/logo-proxy?domain=${encodeURIComponent(m[1])}`);
    } else {
      urls.push(storedLogo);
    }
  }

  // 3. Resolve domain
  let domain = getCompanyDomain(companyName);
  if (!domain && website) {
    try { domain = new URL(website).hostname.replace('www.', ''); } catch {}
  }

  if (domain) {
    // 4. Backend proxy — server fetches logo, bypasses client network restrictions
    urls.push(`${API_BASE}/logo-proxy?domain=${encodeURIComponent(domain)}`);
  }

  // 5. UI Avatars — always works
  urls.push(
    `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&size=64&background=3b82f6&color=ffffff&bold=true&format=svg`
  );

  return urls;
}

const CompanyLogo: React.FC<CompanyLogoProps> = ({
  companyName,
  website,
  size = 64,
  className = '',
  alt,
  storedLogo,
}) => {
  const [sources, setSources] = useState<string[]>(() => getSources(companyName, website, storedLogo));
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setSources(getSources(companyName, website, storedLogo));
    setIdx(0);
  }, [companyName, website, storedLogo]);

  const initials = (companyName || 'C')
    .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  if (idx >= sources.length) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold rounded-lg ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.35, minWidth: size }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={sources[idx]}
      alt={alt || `${companyName} logo`}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
      onError={() => setIdx((p) => p + 1)}
      loading="lazy"
    />
  );
};

export default CompanyLogo;
