import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
}

const BASE = 'https://www.zyncjobs.com';

const SEOHead = ({ title, description, canonical }: SEOHeadProps) => {
  useEffect(() => {
    // Title
    if (title) document.title = title;

    // Description
    if (description) {
      let desc = document.querySelector('meta[name="description"]');
      if (!desc) { desc = document.createElement('meta'); desc.setAttribute('name', 'description'); document.head.appendChild(desc); }
      desc.setAttribute('content', description);
    }

    // Canonical
    const href = canonical ? `${BASE}${canonical}` : `${BASE}${window.location.pathname}`;
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) { link = document.createElement('link'); link.setAttribute('rel', 'canonical'); document.head.appendChild(link); }
    link.setAttribute('href', href);

    // OG URL
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) { ogUrl = document.createElement('meta'); ogUrl.setAttribute('property', 'og:url'); document.head.appendChild(ogUrl); }
    ogUrl.setAttribute('content', href);

    // OG Title
    if (title) {
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) { ogTitle = document.createElement('meta'); ogTitle.setAttribute('property', 'og:title'); document.head.appendChild(ogTitle); }
      ogTitle.setAttribute('content', title);
    }
  }, [title, description, canonical]);

  return null;
};

export default SEOHead;
