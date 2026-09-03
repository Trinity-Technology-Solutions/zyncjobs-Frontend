import { create } from 'zustand';
import { strapiAPI, NavItem } from '../api/strapi';

const CAREER_RESOURCE_URLS = new Set(['/skill-assessment', '/career-coach', '/career-roadmap', '/salary-insights', '/resume-studio', 'skill-assessment', 'career-coach', 'career-roadmap', 'salary-insights', 'resume-studio']);

const FALLBACK_NAV: NavItem[] = [
  { id: 1, label: 'Find Jobs', url: '/job-listings', order: 1 },
  { id: 2, label: 'Companies', url: '/companies', order: 2 },
];

export { CAREER_RESOURCE_URLS };

interface NavigationStore {
  items: NavItem[];
  loading: boolean;
  error: string | null;
  fetchNavigation: () => Promise<void>;
}

let isFetching = false;

export const useNavigation = create<NavigationStore>((set) => ({
  items: FALLBACK_NAV,
  loading: false,
  error: null,

  fetchNavigation: async () => {
    if (isFetching) return;
    isFetching = true;
    set({ loading: true, error: null });
    try {
      const items = await strapiAPI.getNavigation();
      console.log('Navigation items loaded:', items);
      // Use Strapi items if available, otherwise keep fallback
      set({ items: items.length > 0 ? items : FALLBACK_NAV, loading: false });
    } catch (error: any) {
      console.error('Failed to load navigation:', error);
      set({ items: FALLBACK_NAV, error: error.message, loading: false });
    } finally {
      isFetching = false;
    }
  },
}));
