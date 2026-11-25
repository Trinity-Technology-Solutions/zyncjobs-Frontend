import { useState } from 'react';
import { API_ENDPOINTS } from '../config/env';

export interface EmployerIdentity {
  name?: string;
  email?: string;
  ownerEmail?: string;
  employerOwnerId?: string;
  company?: string;
  companyName?: string;
  ownerCompanyName?: string;
  organizationName?: string;
  companyLogo?: string;
}

const companyDomains: Record<string, string> = {
  zoho: 'zoho.com', tcs: 'tcs.com', infosys: 'infosys.com', wipro: 'wipro.com',
  google: 'google.com', microsoft: 'microsoft.com', amazon: 'amazon.com',
  accenture: 'accenture.com', cognizant: 'cognizant.com', hcl: 'hcltech.com',
  oracle: 'oracle.com', ibm: 'ibm.com', capgemini: 'capgemini.com',
};
const personalMailDomains = new Set(['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com']);
const emailDomain = (value?: string) => value?.trim().toLowerCase().match(/@([a-z0-9.-]+\.[a-z]{2,})$/)?.[1];

export function employerLogoSources(account: EmployerIdentity): string[] {
  const company = account.companyName || account.ownerCompanyName || account.company || account.organizationName || '';
  const names = `${company} ${account.name || ''}`.toLowerCase();
  const domain = emailDomain(account.ownerEmail) || emailDomain(account.employerOwnerId) || emailDomain(account.email);
  let localLogo = '';
  if (names.includes('trinity') || domain === 'trinitetech.com') localLogo = '/images/trinity-logo.webp';
  else if (/inypeople|iny people/.test(names)) localLogo = '/images/company-logos/inypeople-logo.png';
  else if (names.includes('nambikkai') || domain === 'nambikkai.com') localLogo = '/images/company-logos/nambikkai-logo.png';

  const knownDomain = Object.entries(companyDomains).find(([name]) => company.toLowerCase().includes(name))?.[1];
  const logoDomain = knownDomain || (domain && !personalMailDomains.has(domain) ? domain : '');
  const proxyLogo = logoDomain ? `${API_ENDPOINTS.BASE_URL}/logo-proxy?domain=${encodeURIComponent(logoDomain)}` : '';
  return [...new Set([account.companyLogo?.trim(), localLogo, proxyLogo].filter((source): source is string => Boolean(source)))];
}

function CompanyImage({ sources, initials }: { sources: string[]; initials: string }) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const source = sources[sourceIndex];
  return source ? (
    <img src={source} alt="" className="h-full w-full" style={{ objectFit: 'contain' }} onError={() => setSourceIndex(sourceIndex + 1)} />
  ) : (
    <span className="grid h-full w-full place-items-center rounded-full bg-blue-700 text-white font-bold" aria-hidden="true">{initials}</span>
  );
}

export default function EmployerAvatar({ account, className }: { account: EmployerIdentity; className?: string }) {
  const company = account.companyName || account.ownerCompanyName || account.company || account.organizationName;
  const name = company && company !== 'Company' ? company : account.name || account.email?.split('@')[0] || 'Employer';
  const initials = name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'E';
  const sources = employerLogoSources(account);
  return (
    <span className={className}>
      <CompanyImage key={JSON.stringify(sources)} sources={sources} initials={initials} />
    </span>
  );
}
