import React, { useState, useEffect } from 'react';
import { Activity, Cpu, CheckCircle, XCircle, AlertTriangle, Clock, RefreshCw, Search, ChevronDown } from 'lucide-react';

interface Props {
  onUnauthorized: () => void;
}

interface FeatureStats {
  feature_name: string;
  count: number;
  avg_latency: number;
  success_count: number;
  failed_count: number;
  fallback_count: number;
}

interface AuditLog {
  id: number;
  request_id: string;
  feature_name: string;
  endpoint: string;
  model: string;
  user_id: string;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
  status: string;
  fallback_used: number;
  error_message: string;
  prompt_preview: string;
  response_preview: string;
  created_at: string;
}

const API = '/api/admin/ai';

export default function AIMonitoringSection({ onUnauthorized }: Props) {
  const [features, setFeatures] = useState<FeatureStats[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [today, setToday] = useState(0);
  const [avgLatency, setAvgLatency] = useState(0);
  const [selectedFeature, setSelectedFeature] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, logsRes] = await Promise.all([
        fetch(`${API}/stats`),
        fetch(`${API}/logs?limit=50&${selectedFeature ? `feature=${selectedFeature}` : ''}`),
      ]);
      if (!statsRes.ok || !logsRes.ok) throw new Error('Failed to fetch AI monitoring data');
      const stats = await statsRes.json();
      const logsData = await logsRes.json();
      setFeatures(stats.features || []);
      setTotal(stats.total || 0);
      setToday(stats.today || 0);
      setAvgLatency(stats.avg_latency_ms || 0);
      setLogs(logsData.logs || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load AI monitoring');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [selectedFeature]);

  const colorFor = (name: string) => {
    const colors = ['from-blue-500/20 to-blue-600/10 border-blue-500/30',
      'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
      'from-purple-500/20 to-purple-600/10 border-purple-500/30',
      'from-amber-500/20 to-amber-600/10 border-amber-500/30',
      'from-rose-500/20 to-rose-600/10 border-rose-500/30',
      'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" /> AI Monitoring
          </h2>
          <p className="text-sm text-gray-400 mt-1">Real-time AI service usage, audit logs, and fallback detection</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/70 border border-gray-700/50 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Requests</p>
          <p className="text-2xl font-bold text-white mt-1">{total}</p>
          <p className="text-xs text-gray-500 mt-1">{today} today</p>
        </div>
        <div className="bg-gray-900/70 border border-gray-700/50 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Avg Latency</p>
          <p className="text-2xl font-bold text-white mt-1">{avgLatency.toFixed(0)}<span className="text-sm text-gray-400">ms</span></p>
          <p className="text-xs text-gray-500 mt-1">per request</p>
        </div>
        <div className="bg-gray-900/70 border border-gray-700/50 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Success Rate</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {total > 0 ? Math.round((features.reduce((a, f) => a + f.success_count, 0) / total) * 100) : 0}%
          </p>
          <p className="text-xs text-gray-500 mt-1">{features.reduce((a, f) => a + f.success_count, 0)} succeeded</p>
        </div>
        <div className="bg-gray-900/70 border border-gray-700/50 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Fallback Rate</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {total > 0 ? Math.round((features.reduce((a, f) => a + f.fallback_count, 0) / total) * 100) : 0}%
          </p>
          <p className="text-xs text-gray-500 mt-1">{features.reduce((a, f) => a + f.fallback_count, 0)} fallbacks</p>
        </div>
      </div>

      {/* Feature Cards */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">AI Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((f) => (
            <div key={f.feature_name}
              className={`bg-gradient-to-br ${colorFor(f.feature_name)} border rounded-xl p-4 cursor-pointer transition hover:scale-[1.02] ${selectedFeature === f.feature_name ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedFeature(selectedFeature === f.feature_name ? '' : f.feature_name)}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">{f.feature_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${f.failed_count > 0 ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {f.failed_count > 0 ? `${f.failed_count} failed` : 'OK'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>{f.count} req</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{f.avg_latency.toFixed(0)}ms</span>
                {f.fallback_count > 0 && <span className="flex items-center gap-1 text-amber-400"><AlertTriangle className="w-3 h-3" />{f.fallback_count} fallback</span>}
              </div>
            </div>
          ))}
          {features.length === 0 && !loading && (
            <div className="col-span-full text-center py-8 text-gray-500 text-sm">
              No AI requests yet. Make some AI calls to see monitoring data.
            </div>
          )}
        </div>
      </div>

      {/* Request History */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Request History {selectedFeature && `— ${selectedFeature}`}
        </h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500 text-sm">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">No logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                  <th className="pb-2 pr-4">Time</th>
                  <th className="pb-2 pr-4">Feature</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Latency</th>
                  <th className="pb-2 pr-4">Model</th>
                  <th className="pb-2 pr-4">Fallback</th>
                  <th className="pb-2 pr-4">Tokens</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-2.5 pr-4 text-gray-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 pr-4 text-white font-medium">{log.feature_name}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`flex items-center gap-1 text-xs ${log.status === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {log.status === 'SUCCESS' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-300">{log.latency_ms}ms</td>
                    <td className="py-2.5 pr-4 text-gray-400 text-xs">{log.model}</td>
                    <td className="py-2.5 pr-4">
                      {log.fallback_used ? (
                        <span className="text-amber-400 text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Yes</span>
                      ) : (
                        <span className="text-gray-600 text-xs">No</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-400 text-xs">{log.prompt_tokens + log.completion_tokens}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
