const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || '';

export interface SiteSettings {
  siteLogo?: {
    url?: string;
  };
  siteTitle?: string;
  siteDescription?: string;
}

export interface NavItem {
  id: number;
  label: string;
  url: string;
  order: number;
}

export interface HeroSection {
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  heroImage?: { url: string };
}

export const strapiAPI = {
  async getSiteSettings(): Promise<SiteSettings> {
    try {
      if (!STRAPI_URL) return {};
      const url = `${STRAPI_URL}/api/site-settings?populate=*`;
      console.log('Fetching from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Strapi error:', response.status, errorText);
        throw new Error(`Failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Full Strapi response:', data);
      
      let item: any = {};
      if (Array.isArray(data.data) && data.data.length > 0) {
        item = data.data[0];
      } else if (data.data) {
        item = data.data;
      }
      
      console.log('Item:', item);
      
      const settings: SiteSettings = {
        siteTitle: item.siteTitle,
        siteDescription: item.siteDescription,
      };
      
      // Extract logo - Strapi v4 has siteLogo directly on the item
      if (item.siteLogo?.url) {
        settings.siteLogo = { url: item.siteLogo.url };
        console.log('✓ Logo URL found:', settings.siteLogo.url);
      } else {
        console.log('✗ No logo URL found');
      }
      
      console.log('Final settings:', settings);
      return settings;
    } catch (error) {
      console.error('Error fetching site settings:', error);
      throw error;
    }
  },

  async getHeroSection(): Promise<HeroSection> {
    try {
      if (!STRAPI_URL) return { title: '', subtitle: '', description: '', buttonText: '' };
      const url = `${STRAPI_URL}/api/hero-sections?populate=*`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) return { title: '', subtitle: '', description: '', buttonText: '' };
      const data = await response.json();
      const item = Array.isArray(data.data) && data.data.length > 0 ? data.data[0] : {};
      return {
        title: item.title || '',
        subtitle: item.subtitle || '',
        description: item.description || '',
        buttonText: item.buttonText || 'Find Job',
        heroImage: item.heroImage?.url ? { url: item.heroImage.url } : undefined,
      };
    } catch (error) {
      console.error('Error fetching hero section:', error);
      return { title: '', subtitle: '', description: '', buttonText: '' };
    }
  },

  async getNavigation(): Promise<NavItem[]> {
    try {
      if (!STRAPI_URL) return [];
      const url = `${STRAPI_URL}/api/nav-items?sort=order:asc`;
      console.log('Fetching navigation from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Navigation API error:', response.status);
        return [];
      }

      const data = await response.json();
      console.log('Navigation data:', data);
      
      if (Array.isArray(data.data)) {
        return data.data.map((item: any) => ({
          id: item.id,
          label: item.label,
          url: item.url,
          order: item.order || 0,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching navigation:', error);
      return [];
    }
  },

  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `${STRAPI_URL}${imagePath}`;
  },
};
