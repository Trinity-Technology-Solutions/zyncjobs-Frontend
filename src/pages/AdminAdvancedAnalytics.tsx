import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Briefcase, PieChart, Download } from 'lucide-react';

interface AdminAdvancedAnalyticsProps {
  onNavigate: (page: string) => void;
}

const AdminAdvancedAnalytics: React.FC<AdminAdvancedAnalyticsProps> = ({ onNavigate }) => {
  const [analytics, setAnalytics] = useState<any>({});
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      // Mock advanced analytics data
      const mockData = {
        userGrowth: Array.from({length: 30}, (_, i) => ({
          date: new Date(Date.now() - (29-i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          candidates: Math.floor(Math.random() * 50) + 20,
          employers: Math.floor(Math.random() * 10) + 5
        })),
        jobMetrics: {
          totalJobs: 1247,
          activeJobs: 892,
          pendingApproval: 23,
          rejectedJobs: 45,
          avgTimeToApproval: 2.3
        },
        applicationMetrics: {
          totalApplications: 5634,
          successRate: 12.5,
          avgApplicationsPerJob: 4.5,
          topSkills: ['JavaScript', 'Python', 'React', 'Node.js', 'AWS']
        },
        conversionFunnel: [
          { stage: 'Visitors', count: 10000, percentage: 100 },
          { stage: 'Registrations', count: 1500, percentage: 15 },
          { stage: 'Profile Complete', count: 900, percentage: 9 },
          { stage: 'Job Applications', count: 450, percentage: 4.5 },
          { stage: 'Interviews', count: 90, percentage: 0.9 },
          { stage: 'Hires', count: 25, percentage: 0.25 }
        ]
      };
      
      setAnalytics(mockData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Date,Candidates,Employers\n" +
      analytics.userGrowth?.map((row: any) => `${row.date},${row.candidates},${row.employers}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "zyncjobs_analytics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-6">Loading advanced analytics...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center">
          <BarChart3 className="w-8 h-8 mr-3 text-blue-600" />
          Advanced Analytics
        </h1>
        <div className="flex space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border rounded px-3 py-2"
            title="Select time range for analytics"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={exportReport}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <button 
            onClick={() => onNavigate('admin-system')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Back
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold text-blue-600">{analytics.jobMetrics?.totalJobs}</p>
              <p className="text-xs text-green-600">↑ 12% from last month</p>
            </div>
            <Briefcase className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Applications</p>
              <p className="text-2xl font-bold text-green-600">{analytics.applicationMetrics?.totalApplications}</p>
              <p className="text-xs text-green-600">↑ 8% from last month</p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-purple-600">{analytics.applicationMetrics?.successRate}%</p>
              <p className="text-xs text-red-600">↓ 2% from last month</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Approval Time</p>
              <p className="text-2xl font-bold text-orange-600">{analytics.jobMetrics?.avgTimeToApproval}h</p>
              <p className="text-xs text-green-600">↓ 0.5h from last month</p>
            </div>
            <PieChart className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* User Growth Chart */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-xl font-semibold mb-6">📈 User Growth Trend</h2>
        <div className="h-64 bg-gray-50 rounded p-4">
          <div className="flex items-end justify-between h-full">
            {analytics.userGrowth?.slice(-14).map((day: any, index: number) => (
              <div key={index} className="flex flex-col items-center space-y-1">
                <div className="flex flex-col items-center space-y-1">
                  <div
                    className="bg-blue-500 w-4 rounded-t"
                    style={{ height: `${(day.candidates / 50) * 150}px` }}
                    title={`Candidates: ${day.candidates}`}
                  />
                  <div
                    className="bg-green-500 w-4 rounded-t"
                    style={{ height: `${(day.employers / 15) * 150}px` }}
                    title={`Employers: ${day.employers}`}
                  />
                </div>
                <span className="text-xs text-gray-500 transform rotate-45">
                  {new Date(day.date).getDate()}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center mt-4 space-x-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            <span className="text-sm">Candidates</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span className="text-sm">Employers</span>
          </div>
        </div>
      </div>

      {/* Conversion Funnel & Top Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-xl font-semibold mb-6">🎯 Conversion Funnel</h2>
          <div className="space-y-3">
            {analytics.conversionFunnel?.map((stage: any, index: number) => (
              <div key={index} className="flex items-center">
                <div className="w-24 text-sm font-medium">{stage.stage}</div>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-6">
                    <div
                      className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${stage.percentage}%` }}
                    >
                      <span className="text-white text-xs font-medium">
                        {stage.percentage}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-16 text-sm text-gray-600">{stage.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-xl font-semibold mb-6">🔥 Top Skills in Demand</h2>
          <div className="space-y-4">
            {analytics.applicationMetrics?.topSkills?.map((skill: string, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="font-medium">{skill}</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      style={{ width: `${100 - index * 15}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{100 - index * 15}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Reports */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-xl font-semibold mb-6">📊 Detailed Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium mb-2">Job Performance</h3>
            <p className="text-sm text-gray-600 mb-3">Analyze job posting effectiveness and application rates</p>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View Report →
            </button>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium mb-2">User Engagement</h3>
            <p className="text-sm text-gray-600 mb-3">Track user activity, session duration, and feature usage</p>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View Report →
            </button>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium mb-2">Revenue Analytics</h3>
            <p className="text-sm text-gray-600 mb-3">Monitor subscription revenue and conversion rates</p>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View Report →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAdvancedAnalytics;