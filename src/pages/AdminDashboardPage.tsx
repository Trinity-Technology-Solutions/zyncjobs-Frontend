import React from 'react';
import { Users, Briefcase, Building, BarChart3, Shield, Settings } from 'lucide-react';
import Header from '../components/Header';
import RoleGuard from '../components/RoleGuard';
import { PERMISSIONS } from '../utils/rolePermissions';

interface AdminDashboardPageProps {
  onNavigate: (page: string) => void;
  user?: { name: string; type: 'admin' };
  onLogout: () => void;
}

const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate, user, onLogout }) => {
  const adminStats = [
    { title: 'Total Users', value: '1,234', icon: Users, color: 'bg-blue-500' },
    { title: 'Active Jobs', value: '456', icon: Briefcase, color: 'bg-green-500' },
    { title: 'Companies', value: '89', icon: Building, color: 'bg-purple-500' },
    { title: 'Applications', value: '2,345', icon: BarChart3, color: 'bg-orange-500' }
  ];

  const adminActions = [
    { title: 'Manage Users', description: 'Add, edit, or remove user accounts', icon: Users, action: 'user-management' },
    { title: 'Job Management', description: 'Oversee all job postings', icon: Briefcase, action: 'job-management' },
    { title: 'Company Management', description: 'Manage company profiles', icon: Building, action: 'company-management' },
    { title: 'Content Moderation', description: 'Review and moderate content', icon: Shield, action: 'content-moderation' },
    { title: 'Analytics', description: 'View platform analytics', icon: BarChart3, action: 'analytics' },
    { title: 'AI Scoring Demo', description: 'Test AI-powered candidate scoring system', icon: BarChart3, action: 'ai-scoring-demo' },
    { title: 'System Settings', description: 'Configure platform settings', icon: Settings, action: 'settings' }
  ];

  return (
    <RoleGuard userRole="admin" requiredPermission={PERMISSIONS.VIEW_ANALYTICS}>
      <div className="min-h-screen bg-gray-50">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage and monitor the ZyncJobs platform</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {adminStats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Admin Actions */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Admin Actions</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {adminActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => onNavigate(action.action)}
                  className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center mb-3">
                    <action.icon className="w-8 h-8 text-blue-600" />
                    <h3 className="text-lg font-medium text-gray-900 ml-3">{action.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm">{action.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
};

export default AdminDashboardPage;