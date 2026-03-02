export const getCompanyLogo = (companyName: string): string => {
  if (!companyName) return '/images/zyncjobs-logo.png';
  
  // Check if company name contains 'trinity' (case insensitive)
  if (companyName.toLowerCase().includes('trinity')) {
    return '/images/trinity-logo.png';
  }
  
  // Check if company name contains 'zync' (case insensitive)
  if (companyName.toLowerCase().includes('zync')) {
    return '/images/zyncjobs-logo.png';
  }
  
  // Clean company name for file lookup
  const cleanName = companyName.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  
  // For specific companies, use letter avatars as fallback
  const localLogos: { [key: string]: string } = {};
  
  // Check if we have a local logo (currently none defined)
  if (localLogos[cleanName]) {
    return localLogos[cleanName];
  }
  
  // Try to get domain from company name for Clearbit (for non-Trinity companies)
  const domain = getCompanyDomain(companyName);
  
  if (domain) {
    return `https://logo.clearbit.com/${domain}`;
  }
  
  // Always return letter avatar as fallback instead of missing zync-logo.svg
  const initials = companyName.split(' ').map(n => n[0]).join('').toUpperCase();
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect width="64" height="64" fill="#3B82F6" rx="8"/>
      <text x="32" y="40" text-anchor="middle" fill="white" font-family="Arial" font-size="20" font-weight="bold">${initials}</text>
    </svg>
  `)}`;
};

const getCompanyDomain = (companyName: string): string => {
  const name = companyName.toLowerCase();
  
  // Common company domain mappings
  const domainMap: { [key: string]: string } = {
    'google': 'google.com',
    'microsoft': 'microsoft.com',
    'apple': 'apple.com',
    'amazon': 'amazon.com',
    'facebook': 'facebook.com',
    'meta': 'meta.com',
    'netflix': 'netflix.com',
    'tesla': 'tesla.com',
    'uber': 'uber.com',
    'airbnb': 'airbnb.com',
    'spotify': 'spotify.com',
    'twitter': 'twitter.com',
    'linkedin': 'linkedin.com',
    'instagram': 'instagram.com',
    'youtube': 'youtube.com',
    'adobe': 'adobe.com',
    'salesforce': 'salesforce.com',
    'oracle': 'oracle.com',
    'ibm': 'ibm.com',
    'intel': 'intel.com',
    'nvidia': 'nvidia.com',
    'paypal': 'paypal.com',
    'ebay': 'ebay.com',
    'zoom': 'zoom.us',
    'slack': 'slack.com',
    'dropbox': 'dropbox.com',
    'github': 'github.com',
    'gitlab': 'gitlab.com',
    'atlassian': 'atlassian.com',
    'shopify': 'shopify.com',
    'stripe': 'stripe.com',
    'square': 'squareup.com',
    'twilio': 'twilio.com',
    'mongodb': 'mongodb.com',
    'redis': 'redis.com',
    'docker': 'docker.com',
    'kubernetes': 'kubernetes.io',
    'aws': 'aws.amazon.com',
    'azure': 'azure.microsoft.com',
    'gcp': 'cloud.google.com',
    'trinity technology solution': 'trinitetech.com',
    'tcs': 'tcs.com',
    'infosys': 'infosys.com',
    'wipro': 'wipro.com',
    'zoho': 'zoho.com',
    'accenture': 'accenture.com'
  };
  
  // Check for exact matches first
  if (domainMap[name]) {
    return domainMap[name];
  }
  
  // Check for partial matches
  for (const [key, domain] of Object.entries(domainMap)) {
    if (name.includes(key) || key.includes(name)) {
      return domain;
    }
  }
  
  // Try to construct domain from company name (only for known patterns)
  return '';
};

export const getSafeCompanyLogo = (job: any): string => {
  const companyName = job.company || job.companyName || 'ZyncJobs';
  
  // Special handling for Trinity Technology - use Trinity logo
  if (companyName.toLowerCase().includes('trinity')) {
    return '/images/trinity-logo.png';
  }
  
  // Special handling for ZyncJobs - use ZyncJobs logo
  if (companyName.toLowerCase().includes('zync')) {
    return '/images/zyncjobs-logo.png';
  }
  
  // Use the updated getCompanyLogo function
  return getCompanyLogo(companyName);
};

export const getLetterAvatar = (name: string): string => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <rect width="40" height="40" fill="#3B82F6" rx="8"/>
      <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">${initials}</text>
    </svg>
  `)}`;
};