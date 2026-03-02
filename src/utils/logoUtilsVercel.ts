// Import logos as modules for Vercel deployment
// Note: Direct imports may not work in Vercel, using public paths instead

export const getCompanyLogo = (companyName: string): string => {
  if (!companyName) return '/images/zyncjobs-logo.png';
  
  // Check if company name contains 'trinity' or 'zync' (case insensitive)
  if (companyName.toLowerCase().includes('trinity') || companyName.toLowerCase().includes('zync')) {
    return '/images/zyncjobs-logo.png';
  }
  
  // Clean company name for file lookup
  const cleanName = companyName.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  
  // For ZyncJobs and other specific companies, use local logos
  const localLogos: { [key: string]: string } = {
    'zyncjobs': '/images/zyncjobs-logo.png',
    'zync-jobs': '/images/zyncjobs-logo.png'
  };
  
  // Check if we have a local logo
  if (localLogos[cleanName]) {
    return localLogos[cleanName];
  }
  
  // Try to get domain from company name for Clearbit (for non-Trinity companies)
  const domain = getCompanyDomain(companyName);
  
  if (domain) {
    return `https://logo.clearbit.com/${domain}`;
  }
  
  // Try local logo path
  const localLogoPath = `/images/company-logos/${cleanName}.png`;
  return localLogoPath;
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
    'gcp': 'cloud.google.com'
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
  
  // Special handling for ZyncJobs/Trinity - ensure we return the correct path
  if (companyName.toLowerCase().includes('trinity') || companyName.toLowerCase().includes('zync')) {
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