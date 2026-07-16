/**
 * HTML utilities for decoding and safely rendering job descriptions
 */

// Decode HTML entities - handles both single and double encoded entities
export const decodeHtmlEntities = (text: string): string => {
  if (!text) return '';
  
  let decoded = text;
  let lastDecoded = '';
  let iterations = 0;
  const maxIterations = 5; // Prevent infinite loops
  
  // Decode multiple times to handle double/triple-encoded entities
  while (decoded !== lastDecoded && iterations < maxIterations) {
    lastDecoded = decoded;
    const textarea = document.createElement('textarea');
    textarea.innerHTML = decoded;
    decoded = textarea.value;
    
    // Also handle common HTML entities explicitly
    decoded = decoded
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&copy;/g, '©')
      .replace(/&reg;/g, '®');
    
    iterations++;
  }
  
  return decoded;
};

// Strip HTML tags and return plain text
export const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  
  let decoded = decodeHtmlEntities(html);
  
  // Remove HTML tags using regex
  decoded = decoded.replace(/<[^>]*>/g, ' ');
  
  // Clean up multiple spaces and newlines
  decoded = decoded
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
  
  return decoded;
};

// Convert HTML to formatted plain text with basic formatting
export const htmlToFormattedText = (html: string): string => {
  if (!html) return '';
  
  let decoded = decodeHtmlEntities(html);
  
  // Replace common HTML tags with formatted text (before removing tags)
  decoded = decoded
    .replace(/<h[1-6][^>]*>/gi, '\n\n**')
    .replace(/<\/h[1-6]>/gi, '**\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br[^>]*>/gi, '\n')
    .replace(/<\/br>/gi, '')
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<strong[^>]*>|<b[^>]*>/gi, '**')
    .replace(/<\/strong>|<\/b>/gi, '**')
    .replace(/<em[^>]*>|<i[^>]*>/gi, '*')
    .replace(/<\/em>|<\/i>/gi, '*')
    .replace(/<[^>]*>/g, '') // Remove any remaining tags
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up multiple newlines
    .replace(/^\s+|\s+$/g, '') // Trim whitespace
    .replace(/\*\*\s*\*\*/g, '') // Remove empty bold tags
    .replace(/\*\s*\*/g, ''); // Remove empty italic tags
  
  return decoded;
};

// Create a safe HTML renderer component
export const createSafeHtmlRenderer = (html: string, maxLength?: number): string => {
  if (!html) return '';
  
  const plainText = stripHtmlTags(html);
  
  if (maxLength && plainText.length > maxLength) {
    return plainText.substring(0, maxLength) + '...';
  }
  
  return plainText;
};

// Format job description for display - now with better encoding handling
export const formatJobDescription = (description: string, maxLength: number = 150): string => {
  if (!description) return '';
  
  // Decode all encoded entities
  let processed = decodeHtmlEntities(description);
  
  // Strip all HTML tags
  processed = stripHtmlTags(processed);
  
  // Remove "Job Summary" heading and clean up formatting
  const cleaned = processed
    .replace(/^\s*Job Summary\s*/i, '') // Remove "Job Summary" at the beginning
    .replace(/\s+Job Summary\s+/gi, ' ') // Remove "Job Summary" in the middle
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/\n\s*\n/g, ' ') // Replace multiple newlines with space
    .replace(/[\r\n]+/g, ' ') // Replace remaining newlines with space
    .trim();
  
  if (cleaned.length > maxLength) {
    return cleaned.substring(0, maxLength) + '...';
  }
  
  return cleaned;
};


export default {
  decodeHtmlEntities,
  stripHtmlTags,
  htmlToFormattedText,
  createSafeHtmlRenderer,
  formatJobDescription
};