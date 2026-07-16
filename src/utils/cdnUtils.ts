const CLOUDFRONT_DOMAIN = 'https://d1l8g7kve3w485.cloudfront.net';

const S3_PATTERNS = [
  'https://s3.ap-south-1.amazonaws.com/zyncjobs.com/',
  'https://zyncjobs.com.s3.ap-south-1.amazonaws.com/',
  'https://zyncjobs.com.s3.amazonaws.com/',
];

/**
 * Convert any S3 direct URL to CloudFront URL.
 * Safe to call on non-S3 URLs — returns them unchanged.
 */
export function toCdnUrl(url: string): string {
  if (!url) return '';
  for (const pattern of S3_PATTERNS) {
    if (url.startsWith(pattern)) {
      return url.replace(pattern, `${CLOUDFRONT_DOMAIN}/`);
    }
  }
  return url;
}
