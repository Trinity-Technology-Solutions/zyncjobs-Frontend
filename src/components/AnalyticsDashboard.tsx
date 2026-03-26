import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Users, Briefcase, FileText, Target, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import { comprehensiveAnalyticsSystem, AnalyticsDashboardData, PlatformAnalytics } from '../services/comprehensiveAnalyticsSystem';

interface AnalyticsDashboardProps {
  userRole: 'admin' | 'employer' | 'candidate';
  userId?: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ComponentType<any>;
  color: string;
}> = ({ title, value, change, trend, icon: Icon, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {change !== undefined && (
          <div className={`flex items-center mt-2 text-sm ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : 
             trend === 'down' ? <TrendingDown className="w-4 h-4 mr-1" /> : 
             <div className="w-4 h-4 mr-1" />}
            {change > 0 ? '+' : ''}{change}%
          </div>
        )}
      </div>
      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const AlertCard: React.FC<{
  type: 'warning' | 'info' | 'success';
  message: string;
  timestamp: Date;
}> = ({ type, message, timestamp }) => {
  const config = {
    warning: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    info: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' }
  };

  const { icon: Icon, color, bg, border } = config[type];

  return (
    <div className={`${bg} ${border} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${color} mt-0.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800">{message}</p>
          <p className="text-xs text-gray-500 mt-1">{timestamp.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ userRole, userId }) => {
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboardData | null>(null);
  const [platformAnalytics, setPlatformAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [realTimeMetrics, setRealTimeMetrics] = useState<Record<string, number>>({});

  useEffect(() => {
    loadAnalytics();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      const metrics = comprehensiveAnalyticsSystem.getRealTimeMetrics();
      setRealTimeMetrics(metrics);
    }, 5000);

    return () => clearInterval(interval);
  }, [timeRange, userId]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      if (userRole === 'admin') {
        const analytics = await comprehensiveAnalyticsSystem.getPlatformAnalytics();
        setPlatformAnalytics(analytics);
      }

      // Load dashboard data
      const mockDashboardData: AnalyticsDashboardData = {
        realTimeMetrics: {
          activeUsers: realTimeMetrics.active_users || 1247,
          jobSearches: realTimeMetrics.job_search_count || 89,
          applications: realTimeMetrics.job_apply_count || 23,
          resumesGenerated: realTimeMetrics.resume_generate_count || 15
        },
        charts: {
          userGrowth: generateUserGrowthData(30),
          applicationTrends: generateApplicationTrendsData(30),
          topSkills: [
            { skill: 'JavaScript', count: 1250 },
            { skill: 'Python', count: 1100 },
            { skill: 'React', count: 950 },
            { skill: 'Node.js', count: 800 },
            { skill: 'AWS', count: 750 }
          ],
          conversionFunnel: [
            { stage: 'Visitors', users: 10000, rate: 100 },
            { stage: 'Signups', users: 2500, rate: 25 },
            { stage: 'Profile Complete', users: 2000, rate: 20 },
            { stage: 'First Search', users: 1500, rate: 15 },
            { stage: 'First Application', users: 500, rate: 5 }
          ]
        },
        insights: {
          keyMetrics: [
            { metric: 'User Engagement', value: 78, change: 12, trend: 'up' },
            { metric: 'Job Match Accuracy', value: 85, change: 5, trend: 'up' },
            { metric: 'Application Success Rate', value: 15.5, change: -2, trend: 'down' },
            { metric: 'Platform Satisfaction', value: 4.2, change: 8, trend: 'up' }
          ],
          alerts: [
            { type: 'warning', message: 'Application success rate has decreased by 2% this week', timestamp: new Date() },
            { type: 'info', message: 'New feature: AI Interview Coach launched successfully', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
            { type: 'success', message: 'User engagement reached all-time high', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) }
          ],
          recommendations: [
            { title: 'Improve Job Matching', description: 'Enhance AI algorithms to increase match accuracy', priority: 'high' },
            { title: 'User Onboarding', description: 'Streamline profile completion process', priority: 'medium' },
            { title: 'Mobile Experience', description: 'Optimize mobile app performance', priority: 'low' }
          ]
        }
      };

      setDashboardData(mockDashboardData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateUserGrowthData = (days: number): { date: string; users: number }[] => {
    const data: { date: string; users: number }[] = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const baseValue = 100;
      const value = baseValue + Math.floor(Math.random() * 50) + (days - i) * 2;
      data.push({
        date: date.toISOString().split('T')[0],
        users: value
      });
    }
    return data;
  };

  const generateApplicationTrendsData = (days: number): { date: string; applications: number }[] => {
    const data: { date: string; applications: number }[] = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const baseValue = 50;
      const value = baseValue + Math.floor(Math.random() * 50) + (days - i) * 2;
      data.push({
        date: date.toISOString().split('T')[0],
        applications: value
      });
    }
    return data;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load analytics data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 text-sm mt-1">
              {userRole === 'admin' ? 'Platform Overview' : 'Your Performance Insights'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live Data
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Real-time Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Active Users"
            value={dashboardData.realTimeMetrics.activeUsers.toLocaleString()}
            change={12}
            trend="up"
            icon={Users}
            color="bg-blue-500"
          />
          <MetricCard
            title="Job Searches"
            value={dashboardData.realTimeMetrics.jobSearches}
            change={8}
            trend="up"
            icon={Target}
            color="bg-green-500"
          />
          <MetricCard
            title="Applications"
            value={dashboardData.realTimeMetrics.applications}
            change={-3}
            trend="down"
            icon={Briefcase}
            color="bg-yellow-500"
          />
          <MetricCard
            title="Resumes Generated"
            value={dashboardData.realTimeMetrics.resumesGenerated}
            change={15}
            trend="up"
            icon={FileText}
            color="bg-purple-500"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dashboardData.charts.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Application Trends */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData.charts.applicationTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="applications" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skills and Funnel Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Skills */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Skills in Demand</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.charts.topSkills} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="skill" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Conversion Funnel */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
            <div className="space-y-4">
              {dashboardData.charts.conversionFunnel.map((stage, index) => (
                <div key={stage.stage} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
                    <span className="text-sm text-gray-500">{stage.users.toLocaleString()} ({stage.rate}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${stage.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardData.insights.keyMetrics.map((metric, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">{metric.metric}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <div className={`flex items-center justify-center mt-1 text-sm ${
                  metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {metric.trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : 
                   metric.trend === 'down' ? <TrendingDown className="w-4 h-4 mr-1" /> : null}
                  {metric.change > 0 ? '+' : ''}{metric.change}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alerts */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Recent Alerts
            </h3>
            <div className="space-y-3">
              {dashboardData.insights.alerts.map((alert, index) => (
                <AlertCard key={index} {...alert} />
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h3>
            <div className="space-y-4">
              {dashboardData.insights.recommendations.map((rec, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{rec.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {rec.priority} priority
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{rec.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Platform Analytics (Admin Only) */}
        {userRole === 'admin' && platformAnalytics && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{platformAnalytics.overview.totalUsers.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{platformAnalytics.overview.totalJobs.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Active Jobs</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{platformAnalytics.overview.successRate}%</p>
                <p className="text-sm text-gray-600">Success Rate</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;