/**
 * HTML utilities for decoding and safely rendering job descriptions
 */

// Decode HTML entities
export const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

// Strip HTML tags and return plain text
export const stripHtmlTags = (html: string): string => {
  const decoded = decodeHtmlEntities(html);
  const div = document.createElement('div');
  div.innerHTML = decoded;
  return div.textContent || div.innerText || '';
};

// Convert HTML to formatted plain text with basic formatting
export const htmlToFormattedText = (html: string): string => {
  if (!html) return '';
  
  let decoded = decodeHtmlEntities(html);
  
  // Replace common HTML tags with formatted text
  decoded = decoded
    .replace(/<h[1-6][^>]*>/gi, '\n\n**')
    .replace(/<\/h[1-6]>/gi, '**\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br[^>]*>/gi, '\n')
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

// Format job description for display
export const formatJobDescription = (description: string, maxLength: number = 150): string => {
  if (!description) return '';
  
  let processed = description;
  
  // Handle double-encoded HTML entities first
  processed = processed
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  // Now decode any remaining HTML entities and strip tags
  const plainText = stripHtmlTags(processed);
  
  // Remove "Job Summary" heading and clean up formatting
  const cleaned = plainText
    .replace(/^\s*Job Summary\s*/i, '') // Remove "Job Summary" at the beginning
    .replace(/\s+Job Summary\s+/gi, ' ') // Remove "Job Summary" in the middle
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, ' ')
    .replace(/[\r\n]+/g, ' ')
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