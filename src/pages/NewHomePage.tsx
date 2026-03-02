import React, { useState, useEffect } from 'react';
import { TrendingUp, MapPin, DollarSign, Clock } from 'lucide-react';
import NewHero from '../components/NewHero';
import JobCategories from '../components/JobCategories';
import LatestJobs from '../components/LatestJobs';
import HowItWorks from '../components/HowItWorks';
import NewTestimonials from '../components/NewTestimonials';
import CallToAction from '../components/CallToAction';
import { API_ENDPOINTS } from '../config/env';

interface NewHomePageProps {
  onNavigate?: (page: string, data?: any) => void;
  user?: {name: string, type: 'candidate' | 'employer'} | null;
}

const NewHomePage: React.FC<NewHomePageProps> = ({ onNavigate, user }) => {
  const [trending, setTrending] = useState<any[]>([]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/search/trending?limit=6`);
        if (response.ok) {
          const data = await response.json();
          setTrending(data);
        }
      } catch (error) {
        console.error('Error fetching trending jobs:', error);
      }
    };

    fetchTrending();
  }, []);
  return (
    <div className="min-h-screen bg-gray-50">
      <NewHero onNavigate={onNavigate} user={user} />
      <JobCategories onNavigate={onNavigate} />
      <LatestJobs onNavigate={onNavigate} user={user} />
      
      {/* Trending Jobs Section */}
      {trending.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 mb-4">
                <TrendingUp className="h-8 w-8 text-orange-500" />
                <h2 className="text-3xl font-bold text-gray-900">Trending Jobs</h2>
              </div>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover the most popular job opportunities that are gaining attention from top candidates
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trending.map((job: any) => (
                <div key={job._id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate && onNavigate('job-detail', { jobId: job._id, jobData: job })}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.jobTitle}</h3>
                      <p className="text-blue-600 font-medium mb-2">{job.company}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{job.location}</span>
                        </div>
                        {job.salary?.max > 0 && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span>${job.salary.min}k-${job.salary.max}k</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {job.description?.substring(0, 100)}...
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-orange-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm font-medium">{job.views} views</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">{new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skills?.slice(0, 3).map((skill: string) => (
                      <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate && onNavigate('job-detail', { jobId: job._id, jobData: job });
                    }}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <button 
                onClick={() => onNavigate && onNavigate('job-listings')}
                className="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
              >
                View All Trending Jobs
              </button>
            </div>
          </div>
        </section>
      )}
      
      <HowItWorks onNavigate={onNavigate} />
      <NewTestimonials />
      <CallToAction onNavigate={onNavigate} />
    </div>
  );
};

export default NewHomePage;