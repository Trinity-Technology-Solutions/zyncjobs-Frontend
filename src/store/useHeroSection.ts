import { create } from 'zustand';
import { strapiAPI, HeroSection } from '../api/strapi';

interface HeroSectionStore {
  data: HeroSection | null;
  loading: boolean;
  error: string | null;
  fetchHeroSection: () => Promise<void>;
}

let isFetching = false;

export const useHeroSection = create<HeroSectionStore>((set) => ({
  data: null,
  loading: false,
  error: null,
  
  fetchHeroSection: async () => {
    if (isFetching) return;
    isFetching = true;
    set({ loading: true, error: null });
    try {
      const data = await strapiAPI.getHeroSection();
      console.log('Hero section loaded:', data);
      set({ data, loading: false });
    } catch (error: any) {
      console.error('Failed to load hero section:', error);
      set({ error: error.message, loading: false });
    } finally {
      isFetching = false;
    }
  },
}));
