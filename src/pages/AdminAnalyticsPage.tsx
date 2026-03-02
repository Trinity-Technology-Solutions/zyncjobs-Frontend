import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Briefcase, TrendingUp } from 'lucide-react';

interface AdminAnalyticsPageProps {
  onNavigate: (page: string) => void;
}

const AdminAnalyticsPage: React.FC<AdminAnalyticsPageProps> = ({ onNavigate }) => {
  const [analytics, setAnalytics] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics/dashboard');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading analytics...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">System Analytics</h1>
        <button 
          onClick={() => onNavigate('admin-dashboard')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold">{analytics.totalUsers || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Briefcase className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold">{analytics.totalJobs || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Applications</p>
              <p className="text-2xl font-bold">{analytics.totalApplications || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Jobs</p>
              <p className="text-2xl font-bold">{analytics.activeJobs || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Today's Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>New Users</span>
              <span className="font-bold text-blue-600">{analytics.newUsersToday || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>New Jobs</span>
              <span className="font-bold text-green-600">{analytics.newJobsToday || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button 
              onClick={() => onNavigate('moderation-dashboard')}
              className="w-full text-left p-3 bg-gray-50 rounded hover:bg-gray-100"
            >
              View Pending Moderation
            </button>
            <button 
              onClick={() => onNavigate('admin-settings')}
              className="w-full text-left p-3 bg-gray-50 rounded hover:bg-gray-100"
            >
              System Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;