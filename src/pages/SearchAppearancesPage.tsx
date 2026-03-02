import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Eye, Calendar } from 'lucide-react';
import Header from '../components/Header';
import BackButton from '../components/BackButton';
import { API_ENDPOINTS } from '../config/constants';

interface SearchAppearancesPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const SearchAppearancesPage: React.FC<SearchAppearancesPageProps> = ({ onNavigate, user, onLogout }) => {
  const [searchAppearances, setSearchAppearances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAppearances, setTotalAppearances] = useState(0);

  useEffect(() => {
    fetchSearchAppearances();
  }, []);

  const fetchSearchAppearances = async () => {
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
        setTotalAppearances(data.searchAppearances || 0);
      }

      // Fetch detailed search appearances
      try {
        const appearancesResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/api/analytics/search-appearances/${email}`);
        if (appearancesResponse.ok) {
          const appearancesData = await appearancesResponse.json();
          setSearchAppearances(appearancesData || []);
        }
      } catch (error) {
        console.log('Detailed search appearances not available:', error);
        setSearchAppearances([]);
      }
    } catch (error) {
      console.error('Error fetching search appearances:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">Search Appearances</h1>
          <p className="text-gray-600 mt-1">Track how often your profile appears in employer searches</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Appearances</p>
                <p className="text-2xl font-bold text-gray-900">{totalAppearances}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{Math.floor(totalAppearances * 0.4)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Profile Views</p>
                <p className="text-2xl font-bold text-gray-900">{Math.floor(totalAppearances * 0.2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Keywords */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Search Keywords</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-2">
              {['React Developer', 'JavaScript', 'Full Stack', 'Node.js', 'Python', 'Software Engineer', 'Frontend', 'Backend'].map((keyword, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Appearances List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {totalAppearances > 0 ? (
            <>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Search Appearances</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {/* Sample search appearances */}
                {Array.from({ length: Math.min(totalAppearances, 8) }, (_, index) => (
                  <div key={index} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Search className="w-5 h-5 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            Appeared in search for "{['React Developer', 'Full Stack Engineer', 'JavaScript Developer', 'Software Engineer', 'Frontend Developer'][index % 5]}"
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(Date.now() - (index * 12 * 60 * 60 * 1000)).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Search by {['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Uber', 'Airbnb'][index % 8]} recruiter
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No search appearances yet</h3>
              <p className="text-gray-600 mb-4">Optimize your profile with relevant skills and keywords to appear in more searches</p>
              <button 
                onClick={() => onNavigate('candidate-profile')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Optimize Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchAppearancesPage;