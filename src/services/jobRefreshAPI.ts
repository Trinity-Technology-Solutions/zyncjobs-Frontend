import { API_ENDPOINTS } from '../config/env';

export interface JobRefreshResponse {
  success: boolean;
  message: string;
  job?: {
    id: string;
    refreshCount: number;
    lastRefreshedAt: string;
    postedAt: string;
  };
  error?: string;
}

export interface BulkRefreshResponse {
  success: boolean;
  message: string;
  results: {
    successful: number;
    failed: number;
    total: number;
    details: Array<{
      jobId: string;
      success: boolean;
      error?: string;
    }>;
  };
}

class JobRefreshAPI {
  
  /**
   * Refresh a single job posting
   */
  async refreshJob(jobId: string): Promise<JobRefreshResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/jobs/${jobId}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          refreshedAt: new Date().toISOString(),
          action: 'refresh'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: Failed to refresh job`);
      }

      return {
        success: true,
        message: data.message || 'Job refreshed successfully',
        job: {
          id: jobId,
          refreshCount: data.refreshCount || 0,
          lastRefreshedAt: data.lastRefreshedAt || new Date().toISOString(),
          postedAt: data.postedAt || data.created_at || new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Job refresh API error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to refresh job',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Refresh multiple jobs in bulk
   */
  async refreshMultipleJobs(jobIds: string[]): Promise<BulkRefreshResponse> {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/jobs/bulk-refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          jobIds,
          refreshedAt: new Date().toISOString()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: Failed to refresh jobs`);
      }

      return {
        success: true,
        message: data.message || 'Jobs refreshed successfully',
        results: {
          successful: data.successful || 0,
          failed: data.failed || 0,
          total: jobIds.length,
          details: data.details || []
        }
      };

    } catch (error) {
      console.error('Bulk job refresh API error:', error);
      
      // Fallback: Try individual refreshes if bulk fails
      const results = await Promise.allSettled(
        jobIds.map(jobId => this.refreshJob(jobId))
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;

      return {
        success: successful > 0,
        message: `Refreshed ${successful} of ${jobIds.length} jobs`,
        results: {
          successful,
          failed,
          total: jobIds.length,
          details: results.map((result, index) => ({
            jobId: jobIds[index],
            success: result.status === 'fulfilled' && result.value.success,
            error: result.status === 'rejected' ? result.reason : 
                   (result.status === 'fulfilled' && !result.value.success ? result.value.error : undefined)
          }))
        }
      };
    }
  }

  /**
   * Get job refresh status and history
   */
  async getJobRefreshStatus(jobId: string) {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/jobs/${jobId}/refresh-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to get refresh status`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get refresh status error:', error);
      return null;
    }
  }

  /**
   * Check if job can be refreshed based on business rules
   */
  canRefreshJob(refreshCount: number, lastRefreshedAt: string | null, userPlan: 'free' | 'pro' | 'enterprise' = 'free'): {
    canRefresh: boolean;
    reason?: string;
    daysUntilNext?: number;
    refreshesRemaining?: number;
  } {
    const limits = {
      free: { maxRefreshes: 3, cooldownDays: 7 },
      pro: { maxRefreshes: 10, cooldownDays: 1 },
      enterprise: { maxRefreshes: 999, cooldownDays: 0 }
    };

    const { maxRefreshes, cooldownDays } = limits[userPlan];

    // Check refresh count limit
    if (refreshCount >= maxRefreshes) {
      return {
        canRefresh: false,
        reason: 'Refresh limit reached',
        refreshesRemaining: 0
      };
    }

    // Check cooldown period
    if (lastRefreshedAt && cooldownDays > 0) {
      const lastRefresh = new Date(lastRefreshedAt);
      const now = new Date();
      const daysSinceRefresh = Math.floor((now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceRefresh < cooldownDays) {
        return {
          canRefresh: false,
          reason: 'In cooldown period',
          daysUntilNext: cooldownDays - daysSinceRefresh,
          refreshesRemaining: maxRefreshes - refreshCount
        };
      }
    }

    return {
      canRefresh: true,
      refreshesRemaining: maxRefreshes - refreshCount
    };
  }
}

// Export singleton instance
export const jobRefreshAPI = new JobRefreshAPI();
export default jobRefreshAPI;