import React from 'react';
import { apiRequest } from '../api/enhancedApiFetch';
import { API_ENDPOINTS } from '../config/env';

interface HealthStatus {
  isHealthy: boolean;
  status: 'healthy' | 'degraded' | 'down';
  services: {
    api: boolean;
    database: boolean;
    auth: boolean;
  };
  responseTime: number;
  lastChecked: Date;
}

interface ServiceMonitor {
  checkHealth(): Promise<HealthStatus>;
  startMonitoring(): void;
  stopMonitoring(): void;
  onStatusChange(callback: (status: HealthStatus) => void): void;
}

class BackendMonitor implements ServiceMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private statusCallbacks: Array<(status: HealthStatus) => void> = [];
  private lastStatus: HealthStatus | null = null;
  private checkInterval = 30000; // 30 seconds

  async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // Check main API health
      const healthResponse = await Promise.race([
        apiRequest('/api/health', { method: 'GET' }, { maxRetries: 1, retryOn5xx: false }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), 10000)
        )
      ]) as any;

      const responseTime = Date.now() - startTime;
      
      if (healthResponse.success) {
        const healthData = healthResponse.data || {};
        
        const status: HealthStatus = {
          isHealthy: true,
          status: 'healthy',
          services: {
            api: true,
            database: healthData.database !== false,
            auth: healthData.auth !== false
          },
          responseTime,
          lastChecked: new Date()
        };

        // Check if any services are down
        const servicesDown = Object.values(status.services).filter(s => !s).length;
        if (servicesDown > 0) {
          status.status = 'degraded';
          status.isHealthy = servicesDown < 2; // Consider degraded if 1 service down
        }

        this.notifyStatusChange(status);
        return status;
      }
    } catch (error) {
      console.warn('Health check failed:', error);
    }

    // Fallback: try basic API call
    try {
      const basicResponse = await Promise.race([
        fetch('/api/ping', { method: 'GET' }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Ping timeout')), 5000)
        )
      ]) as Response;

      const responseTime = Date.now() - startTime;

      if (basicResponse.ok) {
        const status: HealthStatus = {
          isHealthy: true,
          status: 'degraded',
          services: {
            api: true,
            database: false, // Unknown
            auth: false      // Unknown
          },
          responseTime,
          lastChecked: new Date()
        };

        this.notifyStatusChange(status);
        return status;
      }
    } catch (error) {
      console.warn('Basic ping failed:', error);
    }

    // Backend is down
    const status: HealthStatus = {
      isHealthy: false,
      status: 'down',
      services: {
        api: false,
        database: false,
        auth: false
      },
      responseTime: Date.now() - startTime,
      lastChecked: new Date()
    };

    this.notifyStatusChange(status);
    return status;
  }

  startMonitoring(): void {
    if (this.intervalId) return;

    // Initial check
    this.checkHealth();

    // Set up periodic checks
    this.intervalId = setInterval(() => {
      this.checkHealth();
    }, this.checkInterval);

    console.log('Backend monitoring started');
  }

  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Backend monitoring stopped');
    }
  }

  onStatusChange(callback: (status: HealthStatus) => void): void {
    this.statusCallbacks.push(callback);
  }

  private notifyStatusChange(newStatus: HealthStatus): void {
    const statusChanged = !this.lastStatus || 
                         this.lastStatus.status !== newStatus.status ||
                         this.lastStatus.isHealthy !== newStatus.isHealthy;

    if (statusChanged) {
      console.log('Backend status changed:', {
        from: this.lastStatus?.status || 'unknown',
        to: newStatus.status,
        isHealthy: newStatus.isHealthy
      });

      this.statusCallbacks.forEach(callback => {
        try {
          callback(newStatus);
        } catch (error) {
          console.error('Error in status change callback:', error);
        }
      });
    }

    this.lastStatus = newStatus;
  }

  getLastStatus(): HealthStatus | null {
    return this.lastStatus;
  }
}

// Singleton instance
export const backendMonitor = new BackendMonitor();

// React hook for backend status
export const useBackendStatus = () => {
  const [status, setStatus] = React.useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Get initial status
    const lastStatus = backendMonitor.getLastStatus();
    if (lastStatus) {
      setStatus(lastStatus);
      setIsLoading(false);
    }

    // Listen for status changes
    const handleStatusChange = (newStatus: HealthStatus) => {
      setStatus(newStatus);
      setIsLoading(false);
    };

    backendMonitor.onStatusChange(handleStatusChange);

    // Start monitoring if not already started
    backendMonitor.startMonitoring();

    return () => {
      // Don't stop monitoring on unmount as other components might need it
    };
  }, []);

  const checkNow = async () => {
    setIsLoading(true);
    const newStatus = await backendMonitor.checkHealth();
    setStatus(newStatus);
    setIsLoading(false);
    return newStatus;
  };

  return {
    status,
    isLoading,
    checkNow,
    isHealthy: status?.isHealthy ?? false,
    isDown: status?.status === 'down',
    isDegraded: status?.status === 'degraded'
  };
};

// Status indicator component
export const BackendStatusIndicator: React.FC<{ 
  className?: string;
  showDetails?: boolean;
}> = ({ className = '', showDetails = false }) => {
  const { status, isLoading, checkNow } = useBackendStatus();

  if (isLoading || !status) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" />
        {showDetails && <span className="text-xs text-gray-500">Checking...</span>}
      </div>
    );
  }

  const getStatusColor = () => {
    switch (status.status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'down': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'healthy': return 'All systems operational';
      case 'degraded': return 'Some services unavailable';
      case 'down': return 'Service unavailable';
      default: return 'Status unknown';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={checkNow}
        className={`w-2 h-2 rounded-full ${getStatusColor()} hover:scale-110 transition-transform`}
        title="Click to refresh status"
      />
      {showDetails && (
        <div className="text-xs">
          <div className={`font-medium ${
            status.isHealthy ? 'text-green-400' : 'text-red-400'
          }`}>
            {getStatusText()}
          </div>
          <div className="text-gray-500">
            Response: {status.responseTime}ms
          </div>
        </div>
      )}
    </div>
  );
};

// Auto-retry failed requests when backend comes back online
export const setupAutoRetry = () => {
  let failedRequests: Array<() => Promise<any>> = [];

  backendMonitor.onStatusChange((status) => {
    if (status.isHealthy && failedRequests.length > 0) {
      console.log(`Backend is back online, retrying ${failedRequests.length} failed requests`);
      
      const requests = [...failedRequests];
      failedRequests = [];
      
      requests.forEach(async (request, index) => {
        try {
          // Stagger retries to avoid overwhelming the server
          setTimeout(() => request(), index * 100);
        } catch (error) {
          console.warn('Auto-retry failed:', error);
        }
      });
    }
  });

  return {
    addFailedRequest: (request: () => Promise<any>) => {
      failedRequests.push(request);
    }
  };
};