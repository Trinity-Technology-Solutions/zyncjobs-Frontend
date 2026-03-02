import React, { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';

interface AdminSettingsPageProps {
  onNavigate: (page: string) => void;
}

const AdminSettingsPage: React.FC<AdminSettingsPageProps> = ({ onNavigate }) => {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Settings className="w-8 h-8 mr-3" />
          System Settings
        </h1>
        <button 
          onClick={() => onNavigate('admin-dashboard')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Site Name</label>
            <input
              type="text"
              value={settings.siteName || ''}
              onChange={(e) => setSettings({...settings, siteName: e.target.value})}
              className="w-full border rounded px-3 py-2"
              title="Enter the site name"
              placeholder="Enter site name"
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.allowRegistration || false}
              onChange={(e) => setSettings({...settings, allowRegistration: e.target.checked})}
              className="rounded"
              title="Allow new user registration"
            />
            <label>Allow new user registration</label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.autoApproveJobs || false}
              onChange={(e) => setSettings({...settings, autoApproveJobs: e.target.checked})}
              className="rounded"
              title="Auto-approve job postings"
            />
            <label>Auto-approve job postings</label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.maintenanceMode || false}
              onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
              className="rounded"
              title="Enable maintenance mode"
            />
            <label className="text-red-600">Maintenance Mode</label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Max Jobs per Employer</label>
            <input
              type="number"
              value={settings.maxJobsPerEmployer || 50}
              onChange={(e) => setSettings({...settings, maxJobsPerEmployer: parseInt(e.target.value)})}
              className="w-full border rounded px-3 py-2"
              title="Maximum number of jobs per employer"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;