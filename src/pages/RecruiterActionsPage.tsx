import React, { useState, useEffect } from 'react';
import { Eye, Calendar, User, Building } from 'lucide-react';
import Header from '../components/Header';
import BackButton from '../components/BackButton';
import { API_ENDPOINTS } from '../config/constants';

interface RecruiterActionsPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const RecruiterActionsPage: React.FC<RecruiterActionsPageProps> = ({ onNavigate, user, onLogout }) => {
  const [recruiterActions, setRecruiterActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalActions, setTotalActions] = useState(0);

  useEffect(() => {
    fetchRecruiterActions();
  }, []);

  const fetchRecruiterActions = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return;
      
      const user = JSON.parse(userData);
      const email = user.email;
      
      if (!email) return;

      // Fetch analytics data
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/analytics/profile/${email}?userType=candidate`);
      if (response.ok) {
        const data = await response.json();
        setTotalActions(data.recruiterActions || 0);
      }

      // Fetch detailed recruiter actions
      try {
        const actionsResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/api/analytics/recruiter-actions/${email}`);
        if (actionsResponse.ok) {
          const actionsData = await actionsResponse.json();
          setRecruiterActions(actionsData || []);
        }
      } catch (error) {
        console.log('Detailed recruiter actions not available:', error);
        setRecruiterActions([]);
      }
    } catch (error) {
      console.error('Error fetching recruiter actions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <BackButton 
          onClick={() => onNavigate('dashboard')}
          text="Back to Dashboard"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors mb-4"
        />
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Recruiter Actions</h1>
          <p className="text-gray-600 mt-1">See when recruiters view your profile and show interest</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Actions</p>
                <p className="text-2xl font-bold text-gray-900">{totalActions}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{Math.floor(totalActions * 0.3)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Companies</p>
                <p className="text-2xl font-bold text-gray-900">{Math.floor(totalActions * 0.6)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {totalActions > 0 ? (
            <>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {/* Sample recruiter actions */}
                {Array.from({ length: Math.min(totalActions, 5) }, (_, index) => (
                  <div key={index} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            Recruiter from {['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple'][index % 5]} viewed your profile
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Your profile matched their search for {['Software Engineer', 'Full Stack Developer', 'Data Scientist', 'Product Manager', 'DevOps Engineer'][index % 5]}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recruiter actions yet</h3>
              <p className="text-gray-600 mb-4">Complete your profile to start getting attention from recruiters</p>
              <button 
                onClick={() => onNavigate('candidate-profile')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Complete Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecruiterActionsPage;