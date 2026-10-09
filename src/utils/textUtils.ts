// Repair known UTF-8/Windows-1252 mojibake without modifying valid Unicode text.
const encodingRepairs: Record<string, string> = {"\u00c2\u00a0": "\u00a0", "\u00c3\u201a\u00c2\u00a0": "\u00a0", "\u00c3\u0082\u00c2\u00a0": "\u00a0", "\u00c2\u00b7": "\u00b7", "\u00c3\u201a\u00c2\u00b7": "\u00b7", "\u00c3\u0082\u00c2\u00b7": "\u00b7", "\u00c2\u00a9": "\u00a9", "\u00c3\u201a\u00c2\u00a9": "\u00a9", "\u00c3\u0082\u00c2\u00a9": "\u00a9", "\u00c2\u00ae": "\u00ae", "\u00c3\u201a\u00c2\u00ae": "\u00ae", "\u00c3\u0082\u00c2\u00ae": "\u00ae", "\u00e2\u20ac\u201c": "\u2013", "\u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u20ac\u0153": "\u2013", "\u00e2\u0080\u0093": "\u2013", "\u00c3\u00a2\u00c2\u0080\u00c2\u0093": "\u2013", "\u00e2\u20ac\u201d": "\u2014", "\u00e2\u0080\u0094": "\u2014", "\u00c3\u00a2\u00c2\u0080\u00c2\u0094": "\u2014", "\u00e2\u20ac\u02dc": "\u2018", "\u00c3\u00a2\u00e2\u201a\u00ac\u00cb\u0153": "\u2018", "\u00e2\u0080\u0098": "\u2018", "\u00c3\u00a2\u00c2\u0080\u00c2\u0098": "\u2018", "\u00e2\u20ac\u2122": "\u2019", "\u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u201e\u00a2": "\u2019", "\u00e2\u0080\u0099": "\u2019", "\u00c3\u00a2\u00c2\u0080\u00c2\u0099": "\u2019", "\u00e2\u20ac\u0153": "\u201c", "\u00c3\u00a2\u00e2\u201a\u00ac\u00c5\u201c": "\u201c", "\u00e2\u0080\u009c": "\u201c", "\u00c3\u00a2\u00c2\u0080\u00c2\u009c": "\u201c", "\u00e2\u0080\u009d": "\u201d", "\u00c3\u00a2\u00c2\u0080\u00c2\u009d": "\u201d", "\u00e2\u20ac\u00a2": "\u2022", "\u00c3\u00a2\u00e2\u201a\u00ac\u00c2\u00a2": "\u2022", "\u00e2\u0080\u00a2": "\u2022", "\u00c3\u00a2\u00c2\u0080\u00c2\u00a2": "\u2022", "\u00e2\u20ac\u00a6": "\u2026", "\u00c3\u00a2\u00e2\u201a\u00ac\u00c2\u00a6": "\u2026", "\u00e2\u0080\u00a6": "\u2026", "\u00c3\u00a2\u00c2\u0080\u00c2\u00a6": "\u2026", "\u00e2\u201a\u00b9": "\u20b9", "\u00c3\u00a2\u00e2\u20ac\u0161\u00c2\u00b9": "\u20b9", "\u00e2\u0082\u00b9": "\u20b9", "\u00c3\u00a2\u00c2\u0082\u00c2\u00b9": "\u20b9", "\u00e2\u201e\u00a2": "\u2122", "\u00c3\u00a2\u00e2\u20ac\u017e\u00c2\u00a2": "\u2122", "\u00e2\u0084\u00a2": "\u2122", "\u00c3\u00a2\u00c2\u0084\u00c2\u00a2": "\u2122", "\u00e2\u0086\u0090": "\u2190", "\u00c3\u00a2\u00c2\u0086\u00c2\u0090": "\u2190", "\u00e2\u2020\u2019": "\u2192", "\u00c3\u00a2\u00e2\u20ac\u00a0\u00e2\u20ac\u2122": "\u2192", "\u00e2\u0086\u0092": "\u2192", "\u00c3\u00a2\u00c2\u0086\u00c2\u0092": "\u2192", "\u00e2\u2020\u201c": "\u2193", "\u00c3\u00a2\u00e2\u20ac\u00a0\u00e2\u20ac\u0153": "\u2193", "\u00e2\u0086\u0093": "\u2193", "\u00c3\u00a2\u00c2\u0086\u00c2\u0093": "\u2193", "\u00e2\u0153\u201c": "\u2713", "\u00c3\u00a2\u00c5\u201c\u00e2\u20ac\u0153": "\u2713", "\u00e2\u009c\u0093": "\u2713", "\u00c3\u00a2\u00c2\u009c\u00c2\u0093": "\u2713", "\u00e2\u0153\u201d": "\u2714", "\u00e2\u009c\u0094": "\u2714", "\u00c3\u00a2\u00c2\u009c\u00c2\u0094": "\u2714", "\u00e2\u0153\u2022": "\u2715", "\u00c3\u00a2\u00c5\u201c\u00e2\u20ac\u00a2": "\u2715", "\u00e2\u009c\u0095": "\u2715", "\u00c3\u00a2\u00c2\u009c\u00c2\u0095": "\u2715", "\u00e2\u0153\u2013": "\u2716", "\u00c3\u00a2\u00c5\u201c\u00e2\u20ac\u201c": "\u2716", "\u00e2\u009c\u0096": "\u2716", "\u00c3\u00a2\u00c2\u009c\u00c2\u0096": "\u2716", "\u00f0\u0178\u017d\u2030": "\ud83c\udf89", "\u00c3\u00b0\u00c5\u00b8\u00c5\u00bd\u00e2\u20ac\u00b0": "\ud83c\udf89", "\u00f0\u009f\u008e\u0089": "\ud83c\udf89", "\u00c3\u00b0\u00c2\u009f\u00c2\u008e\u00c2\u0089": "\ud83c\udf89"};
export const repairTextEncoding = (value: string | null | undefined): string => {
  if (typeof value !== 'string') return '';
  let result = value;
  for (let pass = 0; pass < 2; pass++) {
    for (const [broken, correct] of Object.entries(encodingRepairs).sort(([a], [b]) => b.length - a.length)) result = result.split(broken).join(correct);
  }
  return result;
};

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
  
  return repairTextEncoding(text).replace(/&[#\w]+;/g, (entity) => {
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

export const formatSalary = (salary: any, currencyCode?: string): string => {
  if (!salary) return '';

  const CURRENCY_SYMBOLS: Record<string, string> = {
    // Asia
    INR: '₹', PKR: '₨', BDT: '৳', LKR: 'Rs', NPR: 'Rs',
    THB: '฿', IDR: 'Rp', PHP: '₱', VND: '₫', KRW: '₩',
    JPY: '¥', CNY: '¥', TWD: 'NT$', HKD: 'HK$', MOP: 'MOP$',
    MYR: 'RM', SGD: 'S$', BND: 'B$', MMK: 'K', KHR: '៛',
    MNT: '₮', KZT: '₸', UZS: 'soʻm', GEL: '₾', AMD: '֏',
    AZN: '₼', TRY: '₺', ILS: '₪', JOD: 'JD', LBP: 'L£',
    SYP: 'S£', IQD: 'IQD', IRR: '﷼', AFN: '؋',
    // Gulf / Middle East
    AED: 'د.إ', SAR: 'ر.س', OMR: 'ر.ع', QAR: 'ر.ق',
    KWD: 'د.ك', BHD: '.د.ب', YER: '﷼',
    // Europe
    EUR: '€', GBP: '£', CHF: 'Fr', SEK: 'kr', NOK: 'kr',
    DKK: 'kr', PLN: 'zł', CZK: 'Kč', HUF: 'Ft', RON: 'lei',
    BGN: 'лв', HRK: 'kn', RSD: 'din', UAH: '₴', RUB: '₽',
    // Americas
    USD: '$', CAD: 'C$', MXN: '$', BRL: 'R$', ARS: '$',
    CLP: '$', COP: '$', PEN: 'S/', VES: 'Bs.', UYU: '$U',
    // Africa
    ZAR: 'R', NGN: '₦', KES: 'KSh', GHS: 'GH₵', EGP: 'E£',
    MAD: 'MAD', TND: 'DT', ETB: 'Br', TZS: 'TSh', UGX: 'USh',
    // Oceania
    AUD: 'A$', NZD: 'NZ$', FJD: 'FJ$',
  };

  const fmtNum = (n: number, code: string): string => {
    if (code === 'INR') {
      if (n >= 10000000) return `${(n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 1)}Cr`;
      if (n >= 100000)   return `${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
      if (n >= 1000)     return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
      return n.toString();
    }
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000)    return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
    return n.toString();
  };

  if (typeof salary === 'object' && (salary.min !== undefined || salary.max !== undefined)) {
    const { min, max } = salary;
    if (!min && !max) return '';
    if (min === 0 && max === 0) return '';
    const code = currencyCode || salary.currency || 'USD';
    const sym = CURRENCY_SYMBOLS[code] || code;
    if (min && max && min > 0 && max > 0) {
      if (min === max) return `${sym}${fmtNum(min, code)}`;
      return `${sym}${fmtNum(min, code)} - ${sym}${fmtNum(max, code)}`;
    }
    if (min && min > 0) return `${sym}${fmtNum(min, code)}+`;
    if (max && max > 0) return `Up to ${sym}${fmtNum(max, code)}`;
    return '';
  }

  if (typeof salary === 'string') {
    if (!salary.trim()) return '';
    return salary;
  }

  return salary.toString();
};

export const formatJobDescription = (description: string, _jobCurrency?: string): string => {
  if (!description || typeof description !== 'string') return description || '';

  let text = description;

  // Strip HTML tags if present
  if (/<[a-z][\s\S]*>/i.test(text)) {
    text = text.replace(/<\/?(p|li|br|div|h[1-6])[^>]*>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  }

  // Do not blindly replace currency symbols — keep original currency from job data
  // text = text.replace(/\$([0-9,]+)/g, '₹$1'); // removed: breaks USD jobs

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
