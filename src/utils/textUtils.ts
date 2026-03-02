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
    
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return '1 day ago';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch (error) {
    return 'Recently posted';
  }
};

export const formatSalary = (salary: any): string => {
  if (!salary) return 'Competitive';
  
  // Handle new object format with currency
  if (typeof salary === 'object' && salary.min !== undefined && salary.max !== undefined) {
    const { min, max, currency = 'USD', period = 'yearly' } = salary;
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