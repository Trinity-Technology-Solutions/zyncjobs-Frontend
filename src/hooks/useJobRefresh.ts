import { useState, useCallback } from 'react';
import { jobRefreshAPI } from '../services/jobRefreshAPI';

export interface JobRefreshData {
  refreshCount: number;
  lastRefreshedAt: string | null;
  canRefresh: boolean;
  daysUntilNextRefresh: number;
  refreshesRemaining: number;
}

export interface UseJobRefreshOptions {
  userPlan?: 'free' | 'pro' | 'enterprise';
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export const useJobRefresh = (options: UseJobRefreshOptions = {}) => {
  const { userPlan = 'free', onSuccess, onError } = options;
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Business rules based on user plan
  const getRefreshLimits = useCallback(() => {
    switch (userPlan) {
      case 'pro':
        return { maxRefreshes: 10, cooldownDays: 1 };
      case 'enterprise':
        return { maxRefreshes: 999, cooldownDays: 0 };
      default: // free
        return { maxRefreshes: 3, cooldownDays: 7 };
    }
  }, [userPlan]);

  // Calculate refresh status
  const getRefreshStatus = useCallback((refreshCount: number, lastRefreshedAt: string | null): JobRefreshData => {
    const { maxRefreshes, cooldownDays } = getRefreshLimits();
    
    let canRefresh = true;
    let daysUntilNextRefresh = 0;
    
    // Check refresh count limit
    if (refreshCount >= maxRefreshes) {
      canRefresh = false;
    }
    
    // Check cooldown period
    if (lastRefreshedAt && cooldownDays > 0) {
      const lastRefresh = new Date(lastRefreshedAt);
      const now = new Date();
      const daysSinceRefresh = Math.floor((now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceRefresh < cooldownDays) {
        canRefresh = false;
        daysUntilNextRefresh = cooldownDays - daysSinceRefresh;
      }
    }
    
    return {
      refreshCount,
      lastRefreshedAt,
      canRefresh,
      daysUntilNextRefresh,
      refreshesRemaining: Math.max(0, maxRefreshes - refreshCount)
    };
  }, [getRefreshLimits]);

  // Refresh job function
  const refreshJob = useCallback(async (jobId: string) => {
    setIsRefreshing(true);
    
    try {
      const result = await jobRefreshAPI.refreshJob(jobId);
      
      if (result.success) {
        if (onSuccess) {
          onSuccess(result);
        }
        return result;
      } else {
        throw new Error(result.message || 'Failed to refresh job');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh job';
      
      if (onError) {
        onError(errorMessage);
      }
      
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  }, [onSuccess, onError]);

  // Bulk refresh jobs
  const refreshMultipleJobs = useCallback(async (jobIds: string[]) => {
    setIsRefreshing(true);
    
    try {
      const result = await jobRefreshAPI.refreshMultipleJobs(jobIds);
      
      if (onSuccess) {
        onSuccess(result.results);
      }
      
      return result.results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh jobs';
      
      if (onError) {
        onError(errorMessage);
      }
      
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  }, [onSuccess, onError]);

  return {
    isRefreshing,
    refreshJob,
    refreshMultipleJobs,
    getRefreshStatus,
    getRefreshLimits
  };
};

export default useJobRefresh;