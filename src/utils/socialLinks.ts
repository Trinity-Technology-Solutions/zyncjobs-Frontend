export type SocialPlatform = 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'website';

export function normalizeSocialUrl(value: string | undefined | null, platform: SocialPlatform = 'linkedin'): string | null {
  if (!value) return null;
  let url = value.trim();
  if (!url) return null;

  // If it's a full valid URL, return as-is
  if (/^(https?:\/\/|mailto:)/i.test(url)) {
    return url;
  }

  // Everything below builds a proper absolute URL so the link never becomes relative (404)
  switch (platform) {
    case 'linkedin': {
      // Bare company/person slug, e.g. "trinitytech" or "trinity-technology-solutions"
      if (/^[a-zA-Z0-9][a-zA-Z0-9\-\.]*$/.test(url)) {
        return `https://www.linkedin.com/company/${url}`;
      }
      // Already a linkedin path without scheme, e.g. "linkedin.com/company/x" or "www.linkedin.com/in/x"
      return `https://${url.replace(/^\/+/, '')}`;
    }
    case 'twitter':
      url = url.replace(/^@+/, '');
      if (/^[a-zA-Z0-9_]+$/.test(url)) return `https://twitter.com/${url}`;
      return `https://${url.replace(/^\/+/, '')}`;
    case 'facebook':
    case 'instagram':
      if (/^[a-zA-Z0-9\.]+$/.test(url)) {
        const base = platform === 'facebook' ? 'facebook.com' : 'instagram.com';
        return `https://www.${base}/${url}`;
      }
      return `https://${url.replace(/^\/+/, '')}`;
    case 'website':
    default:
      return `https://${url.replace(/^\/+/, '')}`;
  }
}