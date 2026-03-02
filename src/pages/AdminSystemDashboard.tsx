import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, Server, Users, Zap, Mail } from 'lucide-react';

interface AdminSystemDashboardProps {
  onNavigate: (page: string) => void;
}

const AdminSystemDashboard: React.FC<AdminSystemDashboardProps> = ({ onNavigate }) => {
  const [systemHealth, setSystemHealth] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemData = async () => {
    try {
      const [healthRes, alertsRes, ticketsRes, perfRes] = await Promise.all([
        fetch('/api/admin/system/health'),
        fetch('/api/admin/system/alerts'),
        fetch('/api/admin/support/tickets'),
        fetch('/api/admin/system/performance')
      ]);

      const [health, alertsData, ticketsData, perfData] = await Promise.all([
        healthRes.json(),
        alertsRes.json(),
        ticketsRes.json(),
        perfRes.json()
      ]);

      setSystemHealth(health);
      setAlerts(alertsData.alerts || []);
      setTickets(ticketsData.tickets || []);
      setPerformance(perfData);
    } catch (error) {
      console.error('Error fetching system data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: number) => {
    try {
      await fetch(`/api/admin/system/alerts/${alertId}/resolve`, { method: 'POST' });
      fetchSystemData();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const triggerBackup = async () => {
    try {
      const response = await fetch('/api/admin/system/backup', { method: 'POST' });
      const data = await response.json();
      alert(`Backup initiated: ${data.backupId}`);
    } catch (error) {
      alert('Backup failed');
    }
  };

  const getHealthColor = (value: number, type: string) => {
    if (type === 'uptime') return value > 99 ? 'text-green-600' : 'text-red-600';
    if (type === 'cpu' || type === 'memory') return value < 80 ? 'text-green-600' : 'text-red-600';
    return 'text-blue-600';
  };

  if (loading) return <div className="p-6">Loading system dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">🖥️ System Dashboard</h1>
        <div className="flex space-x-3">
          <button
            onClick={triggerBackup}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Backup Now
          </button>
          <button 
            onClick={() => onNavigate('admin-dashboard')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Back
          </button>
        </div>
      </div>

      {/* Real-time System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">System Uptime</p>
              <p className={`text-2xl font-bold ${getHealthColor(99.9, 'uptime')}`}>
                {Math.floor(systemHealth.metrics?.uptime / 3600)}h
              </p>
            </div>
            <Server className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">CPU Usage</p>
              <p className={`text-2xl font-bold ${getHealthColor(systemHealth.metrics?.cpuUsage, 'cpu')}`}>
                {systemHealth.metrics?.cpuUsage}%
              </p>
            </div>
            <Activity className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Memory Usage</p>
              <p className={`text-2xl font-bold ${getHealthColor(systemHealth.metrics?.memoryUsage, 'memory')}`}>
                {systemHealth.metrics?.memoryUsage}%
              </p>
            </div>
            <Zap className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-purple-600">
                {systemHealth.metrics?.activeConnections}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2 text-red-500" />
              System Alerts
            </h2>
          </div>
          <div className="p-6 max-h-80 overflow-y-auto">
            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.filter(a => !a.resolved).map(alert => (
                  <div key={alert.id} className={`p-3 rounded border-l-4 ${
                    alert.type === 'error' ? 'border-red-500 bg-red-50' :
                    alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No active alerts</p>
            )}
          </div>
        </div>

        {/* Support Tickets */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center">
              <Mail className="w-6 h-6 mr-2 text-blue-500" />
              Support Tickets
            </h2>
          </div>
          <div className="p-6 max-h-80 overflow-y-auto">
            {tickets.length > 0 ? (
              <div className="space-y-3">
                {tickets.filter(t => t.status !== 'resolved').map(ticket => (
                  <div key={ticket.id} className="p-3 border rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{ticket.subject}</p>
                        <p className="text-sm text-gray-600">{ticket.user}</p>
                        <div className="flex items-center mt-1">
                          <span className={`px-2 py-1 rounded text-xs ${
                            ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                            ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {ticket.priority}
                          </span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                            ticket.status === 'open' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No pending tickets</p>
            )}
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-xl font-semibold mb-6">📈 Performance Metrics (24h)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Response Time (ms)</h3>
            <div className="h-32 bg-gray-100 rounded flex items-end justify-between p-2">
              {performance.metrics?.responseTime?.slice(-12).map((value: number, index: number) => (
                <div
                  key={index}
                  className="bg-blue-500 w-4 rounded-t"
                  style={{ height: `${(value / 3) * 100}%` }}
                  title={`${value.toFixed(2)}ms`}
                />
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Active Users</h3>
            <div className="h-32 bg-gray-100 rounded flex items-end justify-between p-2">
              {performance.metrics?.activeUsers?.slice(-12).map((value: number, index: number) => (
                <div
                  key={index}
                  className="bg-green-500 w-4 rounded-t"
                  style={{ height: `${(value / 300) * 100}%` }}
                  title={`${value} users`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-xl font-semibold mb-4">⚡ Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => onNavigate('admin-notifications')}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left"
          >
            <Mail className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-medium">Send Notifications</h3>
            <p className="text-sm text-gray-600">Broadcast messages to users</p>
          </button>
          
          <button
            onClick={() => onNavigate('admin-analytics')}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left"
          >
            <Activity className="w-8 h-8 text-green-600 mb-2" />
            <h3 className="font-medium">View Analytics</h3>
            <p className="text-sm text-gray-600">Detailed system analytics</p>
          </button>
          
          <button
            onClick={() => onNavigate('admin-settings')}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left"
          >
            <Server className="w-8 h-8 text-purple-600 mb-2" />
            <h3 className="font-medium">System Settings</h3>
            <p className="text-sm text-gray-600">Configure system parameters</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSystemDashboard;