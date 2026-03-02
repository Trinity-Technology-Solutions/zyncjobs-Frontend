import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { ArrowLeft, Calendar, MapPin, Briefcase, DollarSign, Clock, Search } from 'lucide-react';

interface DailyJobsPageProps {
  onNavigate: (page: string) => void;
}

const DailyJobsPage: React.FC<DailyJobsPageProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Fetch jobs from backend
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/jobs`);
        if (response.ok) {
          const data = await response.json();
          const jobsArray = Array.isArray(data) ? data : [];
          // Get today's jobs (posted within last 24 hours)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todaysJobs = jobsArray.filter((job: any) => {
            const jobDate = new Date(job.createdAt || job.created_at);
            return jobDate >= today;
          });
          setJobs(todaysJobs);
          setFilteredJobs(todaysJobs);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // Filter jobs based on search criteria
  useEffect(() => {
    const filtered = jobs.filter(job => {
      const matchesSearch = !searchTerm || 
        (job.title || job.jobTitle)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.skills?.some((skill: string) => skill.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesLocation = !location || 
        job.location?.toLowerCase().includes(location.toLowerCase());
      
      return matchesSearch && matchesLocation;
    });
    setFilteredJobs(filtered);
  }, [searchTerm, location, jobs]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button 
            onClick={() => onNavigate && onNavigate('home')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Calendar className="w-6 h-6 text-blue-600" />
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Daily Highlights
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Today's Job Highlights
            </h1>
            <p className="text-lg text-gray-600">
              Fresh opportunities posted on {currentDate}
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Job title or keyword (e.g., Senior AI Engineer)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex-1 relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Location (e.g., San Francisco, CA)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600">
            {loading ? 'Loading...' : (
              <>
                {filteredJobs.length} of {jobs.length} jobs found
                {(searchTerm || location) && (
                  <span className="ml-2 text-blue-600">
                    {searchTerm && `for "${searchTerm}"`}
                    {searchTerm && location && " in "}
                    {location && `"${location}"`}
                  </span>
                )}
              </>
            )}
          </p>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Last updated: Just now</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-500">Try adjusting your search terms or check back later for new postings.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredJobs.map((job) => (
            <div key={job._id || job.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow relative">
              <div className="absolute top-4 right-4">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  NEW
                </span>
              </div>
              
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                      {job.title || job.jobTitle}
                    </h3>
                    <span className="text-sm text-gray-500 ml-4">
                      {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Today'}
                    </span>
                  </div>
                  
                  <p className="text-lg text-blue-600 font-medium mb-2">{job.company}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4" />
                      <span>{typeof job.salary === 'object' && job.salary ? `$${job.salary.min} - $${job.salary.max}` : job.salary || 'Competitive'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Briefcase className="w-4 h-4" />
                      <span>{job.type}</span>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4">{job.description}</p>

                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill: string, index: number) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 lg:mt-0 lg:ml-6">
                  <button 
                    onClick={() => {
                      localStorage.setItem('selectedJob', JSON.stringify(job));
                      onNavigate('job-application');
                    }}
                    className="w-full lg:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            </div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-blue-50 rounded-xl p-8 border border-blue-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Don't miss tomorrow's opportunities
            </h3>
            <p className="text-gray-600 mb-4">
              Get daily job highlights delivered to your inbox
            </p>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Subscribe to Daily Updates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyJobsPage;