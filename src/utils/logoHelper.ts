// Logo helper that works for both local and Vercel deployment
export const getCompanyLogo = (companyName: string): string => {
  if (!companyName) return '/images/zyncjobs-logo.png';
  
  console.log('Getting logo for company:', companyName);
  
  // Check if company name contains 'trinity' (case insensitive)
  if (companyName.toLowerCase().includes('trinity')) {
    // Use the Trinity Technology logo
    console.log('Trinity Technology detected, using Trinity logo');
    return '/images/trinity-logo.png';
  }
  
  // Check if company name contains 'zync' (case insensitive)
  if (companyName.toLowerCase().includes('zync')) {
    // Use the ZyncJobs logo
    console.log('ZyncJobs detected, using ZyncJobs logo');
    return '/images/zyncjobs-logo.png';
  }
  
  // Try to get domain from company name for Clearbit
  const domain = getCompanyDomain(companyName);
  
  if (domain) {
    return `https://logo.clearbit.com/${domain}`;
  }
  
  // Return letter avatar as fallback
  const initials = companyName.split(' ').map(n => n[0]).join('').toUpperCase();
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'];
  const colorIndex = companyName.length % colors.length;
  const bgColor = colors[colorIndex];
  
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect width="64" height="64" fill="${bgColor}" rx="8"/>
      <text x="32" y="40" text-anchor="middle" fill="white" font-family="Arial" font-size="20" font-weight="bold">${initials}</text>
    </svg>
  `)}`;
};

const getCompanyDomain = (companyName: string): string => {
  const name = companyName.toLowerCase();
  
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
  
  if (domainMap[name]) {
    return domainMap[name];
  }
  
  for (const [key, domain] of Object.entries(domainMap)) {
    if (name.includes(key) || key.includes(name)) {
      return domain;
    }
  }
  
  return '';
};

export const getSafeCompanyLogo = (job: any): string => {
  const companyName = job.company || job.companyName || 'ZyncJobs';
  
  // Special Trinity Technology handling - use Trinity logo
  if (companyName.toLowerCase().includes('trinity')) {
    return '/images/trinity-logo.png';
  }
  
  // Special ZyncJobs handling - use ZyncJobs logo
  if (companyName.toLowerCase().includes('zync')) {
    return '/images/zyncjobs-logo.png';
  }
  
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