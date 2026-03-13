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
    
    // Check if date is in the future (invalid)
    if (date > now) {
      return 'Recently posted';
    }
    
    const diffTime = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    
    // Less than 1 minute
    if (diffMinutes < 1) {
      return 'Just now';
    }
    
    // Less than 1 hour
    if (diffMinutes < 60) {
      return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
    }
    
    // Less than 24 hours
    if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    }
    
    // Less than 7 days
    if (diffDays < 7) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    }
    
    // Less than 30 days
    if (diffDays < 30) {
      return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
    }
    
    // Less than 365 days
    if (diffDays < 365) {
      return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
    }
    
    // More than a year - show actual date
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Recently posted';
  }
};

// More detailed time formatting for job details page
export const formatDetailedTime = (dateString: string | Date): string => {
  if (!dateString) return 'Recently posted';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    
    // Check if date is in the future (invalid)
    if (date > now) {
      return 'Recently posted';
    }
    
    const diffTime = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffTime / 1000);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Less than 30 seconds
    if (diffSeconds < 30) {
      return 'Just now';
    }
    
    // Less than 1 minute
    if (diffSeconds < 60) {
      return `${diffSeconds} seconds ago`;
    }
    
    // Less than 1 hour
    if (diffMinutes < 60) {
      return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
    }
    
    // Less than 24 hours
    if (diffHours < 24) {
      const remainingMinutes = diffMinutes % 60;
      if (diffHours === 1 && remainingMinutes === 0) {
        return '1 hour ago';
      } else if (remainingMinutes === 0) {
        return `${diffHours} hours ago`;
      } else {
        return `${diffHours}h ${remainingMinutes}m ago`;
      }
    }
    
    // Less than 7 days
    if (diffDays < 7) {
      const remainingHours = diffHours % 24;
      if (diffDays === 1 && remainingHours === 0) {
        return '1 day ago';
      } else if (remainingHours === 0) {
        return `${diffDays} days ago`;
      } else {
        return `${diffDays}d ${remainingHours}h ago`;
      }
    }
    
    // More than a week - show formatted date with time
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
  } catch (error) {
    console.error('Error formatting detailed time:', error);
    return 'Recently posted';
  }
};

// Get posting freshness indicator
export const getPostingFreshness = (dateString: string | Date): 'new' | 'recent' | 'old' => {
  if (!dateString) return 'recent';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 24) return 'new';
    if (diffHours < 168) return 'recent'; // 7 days
    return 'old';
  } catch (error) {
    return 'recent';
  }
};

export const formatSalary = (salary: any): string => {
  if (!salary) return '';
  
  // Handle new object format with currency
  if (typeof salary === 'object' && salary.min !== undefined && salary.max !== undefined) {
    const { min, max, currency = 'USD', period = 'yearly' } = salary;
    
    // If both min and max are 0 or empty, don't show salary
    if (!min && !max) return '';
    if (min === 0 && max === 0) return '';
    
    const currencySymbol = currency === 'INR' ? '₹' : 
                          currency === 'USD' ? '$' : 
                          currency === 'EUR' ? '€' : 
                          currency === 'GBP' ? '£' : 
                          currency === 'CAD' ? 'C$' : 
                          currency === 'AUD' ? 'A$' : 
                          currency === 'JPY' ? '¥' : 
                          currency === 'SGD' ? 'S$' : '$';
    
    // Format numbers in lakhs for INR
    if (currency === 'INR') {
      const minLakhs = (min / 100000).toFixed(1).replace('.0', '');
      const maxLakhs = (max / 100000).toFixed(1).replace('.0', '');
      return `₹${minLakhs} - ₹${maxLakhs} Lakhs`;
    }
    
    return `${currencySymbol}${(min/1000).toFixed(0)}k - ${currencySymbol}${(max/1000).toFixed(0)}k`;
  }
  
  // Handle old string format - detect INR amounts and replace $ with ₹
  if (typeof salary === 'string') {
    // If salary is empty string or just whitespace, return empty
    if (!salary.trim()) return '';
    
    // Check if salary contains large numbers (likely INR)
    const salaryStr = salary.toString();
    const numbers = salaryStr.match(/\d+,?\d*/g);
    if (numbers && numbers.length > 0) {
      const firstNumber = parseInt(numbers[0].replace(/,/g, ''));
      // If number is >= 30000, treat as INR
      if (firstNumber >= 30000) {
        return salaryStr.replace(/\$/g, '₹');
      }
    }
    return salaryStr;
  }
  
  return salary.toString();
};

export const formatJobDescription = (description: string, jobCurrency?: string): string => {
  if (!description || typeof description !== 'string') return description || '';
  
  // If job has INR currency, replace $ with ₹ in the description
  if (jobCurrency === 'INR') {
    return description.replace(/\$([0-9,]+)/g, '₹$1');
  }
  
  return description;
};
