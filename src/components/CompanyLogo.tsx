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

  // 1. Persisted logo from DB (canonical source) — works in all networks
  if (storedLogo && (storedLogo.startsWith('http') || storedLogo.startsWith('/api/')) &&
      !storedLogo.includes('ui-avatars.com') &&
      !storedLogo.includes('google.com/s2/favicons')) {
    urls.push(storedLogo);
  }

  // 2. Local file (trinity, nambikkai, growthpulse, inypeople)
  const local = getLocalCompanyLogo(companyName);
  if (local) urls.push(local);

  // 3. Backend proxy (server-side fetch, bypasses client DNS blocks)
  let domain = getCompanyDomain(companyName);
  if (!domain && website) {
    try { domain = new URL(website.startsWith('http') ? website : `https://${website}`).hostname.replace('www.', ''); } catch {}
  }
  if (domain) {
    urls.push(`${API_BASE}/logo-proxy?domain=${encodeURIComponent(domain)}`);
  }

  // 4. Inline SVG initials — always works, no external dependency
  const initials = (companyName || 'C')
    .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  urls.push(`data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="#3B82F6" rx="12"/><text x="32" y="42" text-anchor="middle" fill="white" font-family="Arial" font-size="24" font-weight="bold">${initials}</text></svg>`
  )}`);

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
