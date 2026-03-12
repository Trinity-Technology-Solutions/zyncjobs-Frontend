import React, { useState, useEffect } from 'react';
import { Clock, Calendar, RefreshCw } from 'lucide-react';
import { formatDate, formatDetailedTime, getPostingFreshness } from '../utils/textUtils';
import { API_ENDPOINTS } from '../config/env';

const JobTimingTest: React.FC = () => {
  const [testData, setTestData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchTimingTest = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/jobs/timing-test`);
      if (response.ok) {
        const data = await response.json();
        setTestData(data);
      }
    } catch (error) {
      console.error('Error fetching timing test:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimingTest();
  }, []);

  const createTestJob = (title: string, hoursAgo: number) => {
    const createdAt = new Date(Date.now() - (hoursAgo * 60 * 60 * 1000));
    return {
      id: `test-${hoursAgo}h`,
      jobTitle: title,
      company: 'Test Company',
      location: 'Test Location',
      createdAt: createdAt.toISOString(),
      salary: '$50k - $80k'
    };
  };

  const testJobs = [
    createTestJob('Just Posted Job', 0),
    createTestJob('30 Minutes Ago Job', 0.5),
    createTestJob('1 Hour Ago Job', 1),
    createTestJob('3 Hours Ago Job', 3),
    createTestJob('12 Hours Ago Job', 12),
    createTestJob('1 Day Ago Job', 24),
    createTestJob('3 Days Ago Job', 72),
    createTestJob('1 Week Ago Job', 168),
    createTestJob('2 Weeks Ago Job', 336),
    createTestJob('1 Month Ago Job', 720)
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              Job Posting Time Test
            </h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Current Time: {currentTime.toLocaleString()}
              </div>
              <button
                onClick={fetchTimingTest}
                disabled={loading}
                className=\"bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2\"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Test Jobs */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                Test Jobs (Various Times)
              </h2>
              <div className="space-y-3">
                {testJobs.map((job) => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{job.jobTitle}</h3>
                        <p className="text-sm text-gray-600">{job.company} • {job.location}</p>
                        <p className="text-sm text-green-600 font-medium">{job.salary}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium text-purple-600">
                            {formatDate(job.createdAt)}
                          </span>
                          {getPostingFreshness(job.createdAt) === 'new' && (
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                              NEW
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Detailed: {formatDetailedTime(job.createdAt)}
                        </div>
                        <div className="text-xs text-gray-400">
                          Raw: {new Date(job.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Real Jobs from Database */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Real Jobs from Database
              </h2>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : testData?.realJobs ? (
                <div className="space-y-3">
                  {testData.realJobs.map((job: any) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{job.title}</h3>
                          <p className="text-sm text-gray-600">{job.company}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium text-purple-600">
                              {formatDate(job.createdAt)}
                            </span>
                            {getPostingFreshness(job.createdAt) === 'new' && (
                              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                NEW
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            Detailed: {formatDetailedTime(job.createdAt)}
                          </div>
                          <div className="text-xs text-gray-400">
                            Backend: {job.timeSincePosted}
                          </div>
                          <div className="text-xs text-gray-300">
                            Raw: {new Date(job.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No real jobs data available
                </div>
              )}
            </div>
          </div>

          {/* Timing Format Examples */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timing Format Examples</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">formatDate() - Standard</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Just now</li>
                  <li>• 5 minutes ago</li>
                  <li>• 2 hours ago</li>
                  <li>• 3 days ago</li>
                  <li>• 2 weeks ago</li>
                  <li>• Jan 15, 2024</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">formatDetailedTime() - Detailed</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Just now</li>
                  <li>• 45 seconds ago</li>
                  <li>• 2h 30m ago</li>
                  <li>• 3d 5h ago</li>
                  <li>• Jan 15, 2024, 2:30 PM</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">getPostingFreshness()</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 'new' - Last 24 hours</li>
                  <li>• 'recent' - Last 7 days</li>
                  <li>• 'old' - Older than 7 days</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobTimingTest;