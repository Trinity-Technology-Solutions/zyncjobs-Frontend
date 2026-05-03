import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, Briefcase, Calendar, Download, Filter, Eye, UserCheck, Clock, Target } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import { API_ENDPOINTS } from '../config/constants';

interface AnalyticsPageProps {
  onNavigate: (page: string, data?: any) => void;
  user?: { name: string; type: 'candidate' | 'employer'; email?: string } | null;
  onLogout?: () => void;
}

interface AnalyticsData {
  applications: any[];
  jobs: any[];
  interviews: any[];
  views: any[];
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onNavigate, user, onLogout }) => {
  const [data, setData] = useState<AnalyticsData>({ applications: [], jobs: [], interviews: [], views: [] });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'applications' | 'views' | 'interviews'>('applications');

  useEffect(() => {
    fetchAnalyticsData();
  }, [user, timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const userEmail = user?.email;
      if (!userEmail) return;

      // Fetch analytics data from multiple endpoints
      const [appsRes, jobsRes, interviewsRes, viewsRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.BASE_URL}/analytics/applications?employerEmail=${encodeURIComponent(userEmail)}&range=${timeRange}`),
        fetch(`${API_ENDPOINTS.BASE_URL}/analytics/jobs?employerEmail=${encodeURIComponent(userEmail)}&range=${timeRange}`),
        fetch(`${API_ENDPOINTS.BASE_URL}/analytics/interviews?employerEmail=${encodeURIComponent(userEmail)}&range=${timeRange}`),
        fetch(`${API_ENDPOINTS.BASE_URL}/analytics/views?employerEmail=${encodeURIComponent(userEmail)}&range=${timeRange}`)
      ]);

      const applications = appsRes.ok ? await appsRes.json() : [];
      const jobs = jobsRes.ok ? await jobsRes.json() : [];
      const interviews = interviewsRes.ok ? await interviewsRes.json() : [];
      const views = viewsRes.ok ? await viewsRes.json() : [];

      setData({ applications, jobs, interviews, views });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Generate mock data for demo
      setData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (): AnalyticsData => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const applications = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      count: Math.floor(Math.random() * 10) + 1,
      status: ['applied', 'reviewed', 'shortlisted', 'rejected', 'hired'][Math.floor(Math.random() * 5)]
    }));

    const jobs = Array.from({ length: Math.min(days / 7, 10) }, (_, i) => ({
      title: `Job ${i + 1}`,
      applications: Math.floor(Math.random() * 50) + 10,
      views: Math.floor(Math.random() * 200) + 50,
      posted: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));

    const interviews = Array.from({ length: Math.floor(days / 3) }, (_, i) => ({
      date: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      count: Math.floor(Math.random() * 5) + 1,
      status: ['scheduled', 'completed', 'cancelled'][Math.floor(Math.random() * 3)]
    }));

    const views = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      count: Math.floor(Math.random() * 20) + 5
    }));

    return { applications, jobs, interviews, views };
  };

  const getTimeRangeData = () => {
    const now = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return { startDate, endDate: now };
  };

  const getMetrics = () => {
    const totalApplications = data.applications.length;
    const totalJobs = data.jobs.length;
    const totalInterviews = data.interviews.length;
    const totalViews = data.views.reduce((sum, view) => sum + (view.count || 0), 0);

    const applicationsByStatus = data.applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const conversionRate = totalApplications > 0 ? ((applicationsByStatus.hired || 0) / totalApplications * 100).toFixed(1) : '0';
    const interviewRate = totalApplications > 0 ? ((totalInterviews / totalApplications) * 100).toFixed(1) : '0';

    return {
      totalApplications,
      totalJobs,
      totalInterviews,
      totalViews,
      conversionRate,
      interviewRate,
      applicationsByStatus
    };
  };

  const getChartData = () => {
    const { startDate, endDate } = getTimeRangeData();
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const applications = data.applications.filter(app => app.date === dateStr).length;
      const views = data.views.find(view => view.date === dateStr)?.count || 0;
      const interviews = data.interviews.filter(int => int.date === dateStr).length;
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        applications,
        views,
        interviews
      };
    });
  };

  const metrics = getMetrics();
  const chartData = getChartData();
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const statusData = Object.entries(metrics.applicationsByStatus).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count
  }));

  const exportData = () => {
    const csvContent = [
      ['Date', 'Applications', 'Views', 'Interviews'],
      ...chartData.map(row => [row.date, row.applications, row.views, row.interviews])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${timeRange}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <BackButton onClick={() => onNavigate('dashboard')} />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Track your hiring performance and metrics</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button
                onClick={exportData}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Applications</p>
                    <p className="text-3xl font-bold text-gray-900">{metrics.totalApplications}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">+12% from last period</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                    <p className="text-3xl font-bold text-gray-900">{metrics.totalJobs}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Briefcase className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600">+5% from last period</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Interviews</p>
                    <p className="text-3xl font-bold text-gray-900">{metrics.totalInterviews}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-gray-600">Interview Rate: {metrics.interviewRate}%</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Job Views</p>
                    <p className="text-3xl font-bold text-gray-900">{metrics.totalViews}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Eye className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-gray-600">Avg. per job: {Math.round(metrics.totalViews / Math.max(metrics.totalJobs, 1))}</span>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Trend Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Trends Over Time</h3>
                  <select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value as any)}
                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                  >
                    <option value="applications">Applications</option>
                    <option value="views">Views</option>
                    <option value="interviews">Interviews</option>
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey={selectedMetric}
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Application Status Breakdown */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Application Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {statusData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-gray-600">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Conversion Rate</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">{metrics.conversionRate}%</p>
                <p className="text-sm text-gray-600">Applications to hires</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Interview Rate</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">{metrics.interviewRate}%</p>
                <p className="text-sm text-gray-600">Applications to interviews</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Avg. Time to Hire</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">14</p>
                <p className="text-sm text-gray-600">Days from application</p>
              </div>
            </div>

            {/* Job Performance Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Job Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applications
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Views
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conversion
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Posted
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.jobs.slice(0, 10).map((job, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {job.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.applications}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.views}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.views > 0 ? ((job.applications / job.views) * 100).toFixed(1) : 0}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(job.posted).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
      
      <Footer onNavigate={onNavigate} user={user} />
    </div>
  );
};

export default AnalyticsPage;