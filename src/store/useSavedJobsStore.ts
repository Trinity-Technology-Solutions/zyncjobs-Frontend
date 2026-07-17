import { create } from 'zustand';
import { apiFetch } from '../api/apiFetch';
import { tokenStorage } from '../utils/tokenStorage';
import { API_ENDPOINTS } from '../config/env';

interface SavedJobsStore {
  savedJobIds: Set<string>;
  loaded: boolean;
  fetchSavedJobs: () => Promise<void>;
  saveJob: (jobId: string, jobData?: any) => Promise<void>;
  unsaveJob: (jobId: string) => Promise<void>;
  isSaved: (jobId: string) => boolean;
  reset: () => void;
}

let fetchInProgress = false;

export const useSavedJobsStore = create<SavedJobsStore>((set, get) => ({
  savedJobIds: new Set<string>(),
  loaded: false,

  fetchSavedJobs: async () => {
    if (!tokenStorage.getAccess() || fetchInProgress) return;
    fetchInProgress = true;
    try {
      const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/saved-jobs`);
      if (!res.ok) return;
      const data = await res.json();
      const ids: string[] = Array.isArray(data)
        ? data
        : (data.jobIds || data.ids || []);
      set({ savedJobIds: new Set<string>(ids), loaded: true });
    } catch {
      // keep existing state on network error
    } finally {
      fetchInProgress = false;
    }
  },

  saveJob: async (jobId: string, jobData?: any) => {
    // Optimistic update
    set(s => ({ savedJobIds: new Set<string>([...s.savedJobIds, jobId]) }));
    try {
      const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/saved-jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          jobTitle: jobData?.jobTitle || jobData?.title,
          company: jobData?.company,
          location: jobData?.location,
          salary: jobData?.salary,
          jobType: jobData?.type || jobData?.jobType,
        }),
      });
      if (!res.ok) throw new Error('save failed');
    } catch {
      // Revert optimistic update
      set(s => {
        const next = new Set<string>(s.savedJobIds);
        next.delete(jobId);
        return { savedJobIds: next };
      });
    }
  },

  unsaveJob: async (jobId: string) => {
    // Optimistic update
    set(s => {
      const next = new Set<string>(s.savedJobIds);
      next.delete(jobId);
      return { savedJobIds: next };
    });
    try {
      const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/saved-jobs/${jobId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('unsave failed');
    } catch {
      // Revert optimistic update
      set(s => ({ savedJobIds: new Set<string>([...s.savedJobIds, jobId]) }));
    }
  },

  isSaved: (jobId: string) => get().savedJobIds.has(jobId),

  reset: () => {
    fetchInProgress = false;
    set({ savedJobIds: new Set<string>(), loaded: false });
  },
}));
