import React, { useState } from 'react';
import { RefreshCw, CheckSquare, AlertCircle } from 'lucide-react';
import { useJobRefresh } from '../hooks/useJobRefresh';

interface BulkJobRefreshProps {
  selectedJobIds: string[];
  selectedJobs: Array<{
    id: string;
    title: string;
    refreshCount?: number;
    lastRefreshedAt?: string;
  }>;
  userPlan?: 'free' | 'pro' | 'enterprise';
  onRefreshComplete?: () => void;
  className?: string;
}

const BulkJobRefresh: React.FC<BulkJobRefreshProps> = ({
  selectedJobIds,
  selectedJobs,
  userPlan = 'free',
  onRefreshComplete,
  className = ''
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const { isRefreshing, refreshMultipleJobs, getRefreshStatus } = useJobRefresh({
    userPlan,
    onSuccess: (result) => {
      const { successful, failed, total } = result;
      
      if (successful > 0) {
        window.dispatchEvent(new CustomEvent("zync:alert", { 
          detail: { 
            message: `✅ Successfully refreshed ${successful} of ${total} jobs!`,
            type: 'success'
          } 
        }));
      }
      
      if (failed > 0) {
        window.dispatchEvent(new CustomEvent("zync:alert", { 
          detail: { 
            message: `⚠️ ${failed} jobs failed to refresh. Please try again.`,
            type: 'warning'
          } 
        }));
      }
      
      if (onRefreshComplete) {
        onRefreshComplete();
      }
      
      setShowConfirmation(false);
    },
    onError: (error) => {
      window.dispatchEvent(new CustomEvent("zync:alert", { 
        detail: { 
          message: `❌ Failed to refresh jobs: ${error}`,
          type: 'error'
        } 
      }));
    }
  });

  // Check which jobs can be refreshed
  const refreshableJobs = selectedJobs.filter(job => {
    const status = getRefreshStatus(job.refreshCount || 0, job.lastRefreshedAt || null);
    return status.canRefresh;
  });

  const handleBulkRefresh = async () => {
    if (refreshableJobs.length === 0) {
      window.dispatchEvent(new CustomEvent("zync:alert", { 
        detail: { 
          message: '⚠️ No jobs are available for refresh at this time.',
          type: 'warning'
        } 
      }));
      return;
    }

    try {
      await refreshMultipleJobs(refreshableJobs.map(job => job.id));
    } catch (error) {
      console.error('Bulk refresh failed:', error);
    }
  };

  if (selectedJobIds.length === 0) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowConfirmation(true)}
        disabled={isRefreshing || refreshableJobs.length === 0}
        className={`flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title={`Refresh ${refreshableJobs.length} selected jobs`}
      >
        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span>
          {isRefreshing 
            ? 'Refreshing...' 
            : `Refresh ${refreshableJobs.length} Jobs`
          }
        </span>
      </button>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Bulk Refresh Jobs</h3>
                <p className="text-sm text-gray-500">Refresh multiple jobs at once</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                You have selected <strong>{selectedJobIds.length}</strong> jobs for refresh.
              </p>
              
              {refreshableJobs.length !== selectedJobIds.length && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Some jobs cannot be refreshed:</p>
                      <p>
                        {refreshableJobs.length} of {selectedJobIds.length} jobs are available for refresh.
                        Others may be in cooldown period or have reached their refresh limit.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  ✨ This will update the posting dates and move your jobs to the top of search results, 
                  giving them fresh visibility to job seekers.
                </p>
              </div>
              
              {/* Show jobs that will be refreshed */}
              {refreshableJobs.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Jobs to be refreshed ({refreshableJobs.length}):
                  </p>
                  <div className="max-h-32 overflow-y-auto bg-gray-50 rounded p-2">
                    {refreshableJobs.map(job => (
                      <div key={job.id} className="text-xs text-gray-600 py-1">
                        • {job.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkRefresh}
                disabled={isRefreshing || refreshableJobs.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>
                  {isRefreshing 
                    ? 'Refreshing...' 
                    : `Refresh ${refreshableJobs.length} Jobs`
                  }
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkJobRefresh;