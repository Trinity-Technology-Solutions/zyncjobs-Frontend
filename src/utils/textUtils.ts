// Utility functions for text processing

export const decodeHtmlEntities = (text: string | null | undefined): string => {
  if (!text || typeof text !== 'string') return text || '';
  
  const htmlEntities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™'
  };
  
  return text.replace(/&[#\w]+;/g, (entity) => {
    return htmlEntities[entity] || entity;
  });
};

export const formatDate = (dateString: string | Date): string => {
  if (!dateString) return 'Recently posted';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    
    if (date > now) return 'Recently posted';
    
    const diffTime = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
    if (diffHours < 24) return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    if (diffDays < 7) return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    if (diffDays < 30) return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
    if (diffDays < 365) return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
    
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Recently posted';
  }
};

export const formatDetailedTime = (dateString: string | Date): string => {
  if (!dateString) return 'Recently posted';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    
    if (date > now) return 'Recently posted';
    
    const diffTime = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffTime / 1000);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffSeconds < 30) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
    if (diffMinutes < 60) return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
    
    if (diffHours < 24) {
      const remainingMinutes = diffMinutes % 60;
      if (remainingMinutes === 0) return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
      return `${diffHours}h ${remainingMinutes}m ago`;
    }
    
    if (diffDays < 7) {
      const remainingHours = diffHours % 24;
      if (remainingHours === 0) return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
      return `${diffDays}d ${remainingHours}h ago`;
    }
    
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.error('Error formatting detailed time:', error);
    return 'Recently posted';
  }
};

export const getPostingFreshness = (dateString: string | Date): 'new' | 'recent' | 'old' => {
  if (!dateString) return 'recent';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) return 'new';
    if (diffHours < 168) return 'recent';
    return 'old';
  } catch (error) {
    return 'recent';
  }
};

export const formatSalary = (salary: any): string => {
  if (!salary) return '';
  
  if (typeof salary === 'object' && (salary.min !== undefined || salary.max !== undefined)) {
    const { min, max } = salary;
    
    if (!min && !max) return '';
    if (min === 0 && max === 0) return '';
    
    const fmtNum = (n: number): string => {
      if (n >= 10000000) return `${(n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 1)}Cr`;
      if (n >= 100000) return `${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
      if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
      return n.toString();
    };

    if (min && max && min > 0 && max > 0) return `₹${fmtNum(min)} - ₹${fmtNum(max)}`;
    if (min && min > 0) return `₹${fmtNum(min)}+`;
    if (max && max > 0) return `Up to ₹${fmtNum(max)}`;
    return '';
  }
  
  if (typeof salary === 'string') {
    if (!salary.trim()) return '';
    return salary.replace(/\$/g, '₹');
  }
  
  return salary.toString();
};

export const formatJobDescription = (description: string, _jobCurrency?: string): string => {
  if (!description || typeof description !== 'string') return description || '';

  let text = description;

  // Always replace $ with ₹
  text = text.replace(/\$([0-9,]+)/g, '₹$1');

  // Strip markdown bold markers ** from headings (e.g. **Job Summary** → Job Summary)
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  // Also strip lone trailing * (e.g. **Requirements* → Requirements)
  text = text.replace(/\*\*([^*]+)\*/g, '$1');

  const metadataKeys = [
    'location', 'work type', 'visa', 'certification', 'experience',
    'salary', 'job type', 'employment type', 'notice period',
    'candidate location', 'work setting'
  ];

  text = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/(^|\s)(\d+\.\s*[A-Z])/g, '\n\n$2')
    .replace(/\s*[•\-\*]\s+/g, '\n• ')
    .replace(/([A-Z][A-Za-z &,/]{2,60}:)(\s*\n|\s{2,})/g, '\n$1\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .trim();

  const lines = text.split('\n');
  const filtered = lines.filter(line => {
    const lower = line.trim().toLowerCase();
    if (!lower) return true;
    return !metadataKeys.some(key => lower.startsWith(key + ':') || lower === key);
  });

  return filtered.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};
