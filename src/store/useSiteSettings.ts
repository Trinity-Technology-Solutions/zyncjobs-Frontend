import { create } from 'zustand';
import { strapiAPI, SiteSettings } from '../api/strapi';

interface SiteSettingsStore {
  data: SiteSettings | null;
  loading: boolean;
  error: string | null;
  fetchSiteSettings: () => Promise<void>;
}

let isFetching = false;

export const useSiteSettings = create<SiteSettingsStore>((set) => ({
  data: null,
  loading: false,
  error: null,
  
  fetchSiteSettings: async () => {
    if (isFetching) return;
    isFetching = true;
    set({ loading: true, error: null });
    try {
      const data = await strapiAPI.getSiteSettings();
      console.log('Site settings loaded:', data);
      set({ data, loading: false });
    } catch (error: any) {
      console.error('Failed to load site settings:', error);
      set({ error: error.message, loading: false });
    } finally {
      isFetching = false;
    }
  },
}));
