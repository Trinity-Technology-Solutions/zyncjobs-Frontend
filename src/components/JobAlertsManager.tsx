import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/constants';
import { Bell, Plus, Edit, Trash2, Mail, Smartphone } from 'lucide-react';

interface JobAlert {
  _id: string;
  alertName: string;
  criteria: {
    keywords: string[];
    location: string;
    jobType: string[];
    experienceLevel: string;
    salaryMin: number;
    salaryMax: number;
    company: string;
  };
  frequency: 'instant' | 'daily' | 'weekly';
  isActive: boolean;
  totalJobsSent: number;
  lastSent?: string;
}

interface JobAlertsManagerProps {
  user: any;
}

const JobAlertsManager: React.FC<JobAlertsManagerProps> = ({ user }) => {
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<JobAlert | null>(null);
  const [loading, setLoading] = useState(true);

  // Suggestion states
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([]);
  const [jobTitleSuggestions, setJobTitleSuggestions] = useState<string[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showJobTitleDropdown, setShowJobTitleDropdown] = useState(false);

  const [formData, setFormData] = useState({
    alertName: '',
    keywords: '',
    location: '',
    jobType: [] as string[],
    experienceLevel: '',
    salaryMin: '',
    salaryMax: '',
    company: '',
    frequency: 'daily' as 'instant' | 'daily' | 'weekly'
  });

  useEffect(() => {
    const userId = user?._id || user?.id || 'demo-user';
    if (userId) {
      fetchAlerts(userId);
    }
  }, [user]);

  const fetchAlerts = async (userId?: string) => {
    const id = userId || user?._id || user?.id || 'demo-user';
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/job-alerts/user/${id}`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const alertData = {
      userId: user?._id || user?.id || 'demo-user',
      email: user?.email || 'demo@example.com',
      phone: user?.phone || '',
      alertName: formData.alertName,
      criteria: {
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        location: formData.location,
        jobType: formData.jobType,
        experienceLevel: formData.experienceLevel,
        salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
        company: formData.company
      },
      frequency: formData.frequency
    };

    try {
      const url = editingAlert 
        ? `${API_ENDPOINTS.BASE_URL}/api/job-alerts/${editingAlert._id}`
        : `${API_ENDPOINTS.BASE_URL}/api/job-alerts`;
      
      const method = editingAlert ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData)
      });

      if (response.ok) {
        await fetchAlerts();
        resetForm();
        alert(editingAlert ? 'Alert updated!' : 'Alert created!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save alert');
      }
    } catch (error) {
      console.error('Error saving alert:', error);
      alert('Failed to save alert');
    }
  };

  const handleEdit = (alert: JobAlert) => {
    setEditingAlert(alert);
    setFormData({
      alertName: alert.alertName,
      keywords: alert.criteria.keywords.join(', '),
      location: alert.criteria.location || '',
      jobType: alert.criteria.jobType || [],
      experienceLevel: alert.criteria.experienceLevel || '',
      salaryMin: alert.criteria.salaryMin?.toString() || '',
      salaryMax: alert.criteria.salaryMax?.toString() || '',
      company: alert.criteria.company || '',
      frequency: alert.frequency
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/job-alerts/${alertId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchAlerts();
        alert('Alert deleted!');
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      alert('Failed to delete alert');
    }
  };

  const resetForm = () => {
    setFormData({
      alertName: '',
      keywords: '',
      location: '',
      jobType: [],
      experienceLevel: '',
      salaryMin: '',
      salaryMax: '',
      company: '',
      frequency: 'daily'
    });
    setShowCreateForm(false);
    setEditingAlert(null);
  };

  const handleJobTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      jobType: prev.jobType.includes(type)
        ? prev.jobType.filter(t => t !== type)
        : [...prev.jobType, type]
    }));
  };

  // Location suggestions
  const handleLocationChange = async (value: string) => {
    setFormData(prev => ({ ...prev, location: value }));
    
    if (value.length >= 2) {
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/locations/search/${encodeURIComponent(value)}`);
        if (response.ok) {
          const data = await response.json();
          setLocationSuggestions(data.locations || []);
          setShowLocationDropdown(true);
        }
      } catch (error) {
        const fallbackLocations = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Remote', 'Work from Home']
          .filter(loc => loc.toLowerCase().includes(value.toLowerCase()));
        setLocationSuggestions(fallbackLocations);
        setShowLocationDropdown(fallbackLocations.length > 0);
      }
    } else {
      setShowLocationDropdown(false);
    }
  };

  // Company suggestions
  const handleCompanyChange = async (value: string) => {
    setFormData(prev => ({ ...prev, company: value }));
    
    if (value.length >= 2) {
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/companies/search?q=${encodeURIComponent(value)}`);
        if (response.ok) {
          const data = await response.json();
          setCompanySuggestions(data.map((c: any) => c.name) || []);
          setShowCompanyDropdown(true);
        }
      } catch (error) {
        const fallbackCompanies = ['Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Tesla', 'Uber', 'Airbnb', 'TCS', 'Infosys', 'Wipro']
          .filter(comp => comp.toLowerCase().includes(value.toLowerCase()));
        setCompanySuggestions(fallbackCompanies);
        setShowCompanyDropdown(fallbackCompanies.length > 0);
      }
    } else {
      setShowCompanyDropdown(false);
    }
  };

  // Job title suggestions
  const handleJobTitleChange = async (value: string) => {
    setFormData(prev => ({ ...prev, keywords: value }));
    
    if (value.length >= 2) {
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/suggest?q=${encodeURIComponent(value)}&type=job`);
        if (response.ok) {
          const data = await response.json();
          setJobTitleSuggestions(data.suggestions || []);
          setShowJobTitleDropdown(true);
        }
      } catch (error) {
        const fallbackTitles = ['Software Engineer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'Data Scientist', 'Product Manager', 'DevOps Engineer', 'UI/UX Designer']
          .filter(title => title.toLowerCase().includes(value.toLowerCase()));
        setJobTitleSuggestions(fallbackTitles);
        setShowJobTitleDropdown(fallbackTitles.length > 0);
      }
    } else {
      setShowJobTitleDropdown(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Job Alerts</h3>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Alert</span>
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="font-medium mb-4">
            {editingAlert ? 'Edit Alert' : 'Create New Alert'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                value={formData.alertName}
                onChange={(e) => {
                  e.preventDefault();
                  setFormData(prev => ({ ...prev, alertName: e.target.value }));
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., React Developer"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skills (comma separated)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({ ...prev, keywords: value }));
                    if (value.length >= 2) {
                      handleJobTitleChange(value);
                    } else {
                      setShowJobTitleDropdown(false);
                    }
                  }}
                  onFocus={() => {
                    if (formData.keywords.length >= 2) {
                      setShowJobTitleDropdown(true);
                    }
                  }}
                  onBlur={() => setTimeout(() => setShowJobTitleDropdown(false), 200)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., React, JavaScript, Frontend"
                />
                {showJobTitleDropdown && jobTitleSuggestions.length > 0 && (
                  <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-48 overflow-y-auto" style={{ zIndex: 9999 }}>
                    {jobTitleSuggestions.map((title, index) => (
                      <button
                        key={index}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFormData(prev => ({ ...prev, keywords: title }));
                          setShowJobTitleDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm border-b last:border-b-0 transition-colors"
                      >
                        {title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData(prev => ({ ...prev, location: value }));
                      if (value.length >= 2) {
                        handleLocationChange(value);
                      } else {
                        setShowLocationDropdown(false);
                      }
                    }}
                    onFocus={() => {
                      if (formData.location.length >= 2) {
                        setShowLocationDropdown(true);
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., San Francisco, Remote"
                  />
                  {showLocationDropdown && locationSuggestions.length > 0 && (
                    <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-48 overflow-y-auto" style={{ zIndex: 9999 }}>
                      {locationSuggestions.map((location, index) => (
                        <button
                          key={index}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFormData(prev => ({ ...prev, location }));
                            setShowLocationDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm border-b last:border-b-0 transition-colors"
                        >
                          {location}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData(prev => ({ ...prev, company: value }));
                      if (value.length >= 2) {
                        handleCompanyChange(value);
                      } else {
                        setShowCompanyDropdown(false);
                      }
                    }}
                    onFocus={() => {
                      if (formData.company.length >= 2) {
                        setShowCompanyDropdown(true);
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 200)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Google, Microsoft"
                  />
                  {showCompanyDropdown && companySuggestions.length > 0 && (
                    <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-48 overflow-y-auto" style={{ zIndex: 9999 }}>
                      {companySuggestions.map((company, index) => (
                        <button
                          key={index}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFormData(prev => ({ ...prev, company }));
                            setShowCompanyDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm border-b last:border-b-0 transition-colors"
                        >
                          {company}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Type
              </label>
              <div className="flex flex-wrap gap-2">
                {['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'].map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.jobType.includes(type)}
                      onChange={() => handleJobTypeChange(type)}
                      className="mr-2"
                    />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Salary
                </label>
                <input
                  type="number"
                  value={formData.salaryMin}
                  onChange={(e) => setFormData(prev => ({ ...prev, salaryMin: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="50000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Salary
                </label>
                <input
                  type="number"
                  value={formData.salaryMax}
                  onChange={(e) => setFormData(prev => ({ ...prev, salaryMax: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="100000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="instant">Instant</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingAlert ? 'Update Alert' : 'Create Alert'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.map(alert => (
          <div key={alert._id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{alert.alertName}</h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEdit(alert)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(alert._id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              {alert.criteria.keywords.length > 0 && (
                <p><strong>Keywords:</strong> {alert.criteria.keywords.join(', ')}</p>
              )}
              {alert.criteria.location && (
                <p><strong>Location:</strong> {alert.criteria.location}</p>
              )}
              {alert.criteria.jobType.length > 0 && (
                <p><strong>Job Type:</strong> {alert.criteria.jobType.join(', ')}</p>
              )}
              <p><strong>Frequency:</strong> {alert.frequency}</p>
              <p><strong>Jobs Sent:</strong> {alert.totalJobsSent}</p>
              {alert.lastSent && (
                <p><strong>Last Sent:</strong> {new Date(alert.lastSent).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        ))}

        {alerts.length === 0 && (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No job alerts created yet</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first alert
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobAlertsManager;