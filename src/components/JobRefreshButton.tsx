import React, { useState } from 'react';
import { RefreshCw, Clock, Ban } from 'lucide-react';
import { jobRefreshAPI } from '../services/jobRefreshAPI';

interface JobRefreshButtonProps {
  jobId: string;
  jobTitle: string;
  refreshCount?: number;
  lastRefreshedAt?: string;
  userPlan?: 'free' | 'pro' | 'enterprise';
  onRefreshSuccess?: () => void;
  className?: string;
}

const JobRefreshButton: React.FC<JobRefreshButtonProps> = ({
  jobId,
  jobTitle,
  refreshCount = 0,
  lastRefreshedAt,
  userPlan = 'free',
  onRefreshSuccess,
  className = ''
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Business Rules
  const MAX_REFRESHES = userPlan === 'free' ? 3 : userPlan === 'pro' ? 10 : 999;
  const COOLDOWN_DAYS = userPlan === 'free' ? 7 : userPlan === 'pro' ? 1 : 0;
  
  // Check if refresh is available
  const canRefresh = () => {
    // Check refresh count limit
    if (refreshCount >= MAX_REFRESHES) return false;
    
    // Check cooldown period
    if (lastRefreshedAt) {
      const lastRefresh = new Date(lastRefreshedAt);
      const now = new Date();
      const daysSinceRefresh = Math.floor((now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceRefresh < COOLDOWN_DAYS) return false;
    }
    
    return true;
  };

  // Get next refresh date
  const getNextRefreshDate = () => {
    if (!lastRefreshedAt) return null;
    const lastRefresh = new Date(lastRefreshedAt);
    const nextRefresh = new Date(lastRefresh.getTime() + (COOLDOWN_DAYS * 24 * 60 * 60 * 1000));
    return nextRefresh;
  };

  // Get days until next refresh
  const getDaysUntilRefresh = () => {
    const nextRefresh = getNextRefreshDate();
    if (!nextRefresh) return 0;
    const now = new Date();
    return Math.ceil((nextRefresh.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Handle refresh job
  const handleRefresh = async () => {
    if (!canRefresh()) return;
    
    setIsRefreshing(true);
    try {
      const result = await jobRefreshAPI.refreshJob(jobId);
      
      if (result.success) {
        // Show success message
        window.dispatchEvent(new CustomEvent("zync:alert", { 
          detail: { 
            message: `✅ Job "${jobTitle}" refreshed successfully! It's now at the top of search results.`,
            type: 'success'
          } 
        }));
        
        // Call success callback
        if (onRefreshSuccess) {
          onRefreshSuccess();
        }
        
        setShowConfirmation(false);
      } else {
        throw new Error(result.message || 'Failed to refresh job');
      }
    } catch (error) {
      console.error('Error refreshing job:', error);
      window.dispatchEvent(new CustomEvent("zync:alert", { 
        detail: { 
          message: `❌ ${error instanceof Error ? error.message : 'Failed to refresh job. Please try again.'}`,
          type: 'error'
        } 
      }));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Render button based on state
  const renderButton = () => {
    const isAvailable = canRefresh();
    const daysUntilRefresh = getDaysUntilRefresh();
    
    if (refreshCount >= MAX_REFRESHES) {
      // Limit reached
      return (
        <button
          disabled
          className={`flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed ${className}`}
          title="Refresh limit reached"
        >
          <Ban className="w-4 h-4" />
          <span>Limit Reached</span>
        </button>
      );
    }
    
    if (!isAvailable && daysUntilRefresh > 0) {
      // In cooldown
      return (
        <button
          disabled
          className={`flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed ${className}`}
          title={`Next refresh available in ${daysUntilRefresh} day(s)`}
        >
          <Clock className="w-4 h-4" />
          <span>{daysUntilRefresh}d left</span>
        </button>
      );
    }
    
    // Available to refresh
    return (
      <button
        onClick={() => setShowConfirmation(true)}
        disabled={isRefreshing}
        className={`flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 ${className}`}
        title="Refresh job to move it to top of search results"
      >
        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span>{isRefreshing ? 'Refreshing...' : 'Refresh Job'}</span>
      </button>
    );
  };

  return (
    <>
      {renderButton()}
      
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Refresh Job</h3>
                <p className="text-sm text-gray-500">Move job to top of search results</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Do you want to refresh "<strong>{jobTitle}</strong>"?
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  ✨ This will update the posting date and move your job to the top of search results, 
                  giving it fresh visibility to job seekers.
                </p>
              </div>
              
              {/* Show remaining refreshes */}
              <div className="mt-3 text-sm text-gray-600">
                <p>Refreshes remaining: <strong>{MAX_REFRESHES - refreshCount}</strong> of {MAX_REFRESHES}</p>
                {userPlan === 'free' && (
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Upgrade to Pro for more refreshes and shorter cooldown
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh Job'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JobRefreshButton;