import { create } from 'zustand';
import { strapiAPI, NavItem } from '../api/strapi';

interface NavigationStore {
  items: NavItem[];
  loading: boolean;
  error: string | null;
  fetchNavigation: () => Promise<void>;
}

let isFetching = false;

export const useNavigation = create<NavigationStore>((set) => ({
  items: [],
  loading: false,
  error: null,
  
  fetchNavigation: async () => {
    if (isFetching) return;
    isFetching = true;
    set({ loading: true, error: null });
    try {
      const items = await strapiAPI.getNavigation();
      console.log('Navigation items loaded:', items);
      set({ items, loading: false });
    } catch (error: any) {
      console.error('Failed to load navigation:', error);
      set({ error: error.message, loading: false });
    } finally {
      isFetching = false;
    }
  },
}));
