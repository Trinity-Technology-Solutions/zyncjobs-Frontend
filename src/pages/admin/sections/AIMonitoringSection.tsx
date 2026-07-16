import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface AIMonitoringSectionProps {
  onUnauthorized?: () => void;
}

export default function AIMonitoringSection({ onUnauthorized }: AIMonitoringSectionProps) {
  const [metrics, setMetrics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/ai/monitoring', {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setMetrics(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Clock className="animate-spin w-8 h-8 text-blue-600 mx-auto mb-2" />
        <p className="text-gray-500">Loading AI monitoring...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-700 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Failed to load metrics</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const uptime = metrics.uptime || '99.9%';
  const requestsToday = metrics.requests_today || 0;
  const avgLatency = metrics.avg_latency_ms || 0;
  const errorRate = metrics.error_rate || 0;
  const models = metrics.models || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">AI Monitoring Dashboard</h2>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
        >
          <RefreshCw className="w-4 h-4 inline mr-1" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-500">Uptime</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{uptime}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-500">Requests Today</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{requestsToday.toLocaleString()}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-gray-500">Avg Latency</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{avgLatency}ms</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-sm text-gray-500">Error Rate</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {errorRate.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Model Health</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {models.length > 0 ? (
            models.map((model: any) => (
              <div key={model.name} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      model.status === 'healthy' ? 'bg-green-500' :
                      model.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="font-medium text-gray-900">{model.name}</span>
                  <span className="text-xs text-gray-500">v{model.version}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Latency: {model.latency_ms}ms</span>
                  <span>Errors: {model.errors_today}</span>
                  <span className={`font-medium ${
                    model.status === 'healthy' ? 'text-green-600' :
                    model.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {model.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-8 text-center text-gray-500">
              No model metrics available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}