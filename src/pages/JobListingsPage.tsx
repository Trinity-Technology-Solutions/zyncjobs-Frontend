import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Filter, Briefcase, Clock, DollarSign, X, Bookmark, BookmarkCheck, TrendingUp } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import LocationRadiusSearch from '../components/LocationRadiusSearch';
import { aiSuggestions } from '../utils/aiSuggestions';
import { JobCardSkeleton, SearchLoading } from '../components/LoadingStates';
import { decodeHtmlEntities, formatDate, formatSalary, formatJobDescription } from '../utils/textUtils';
import { API_ENDPOINTS } from '../config/env';

const JobListingsPage = ({ onNavigate, user, onLogout, searchParams }: { 
  onNavigate?: (page: string) => void;
  user?: {name: string, type: 'candidate' | 'employer'} | null;
  onLogout?: () => void;
  searchParams?: { searchTerm?: string; location?: string; experience?: string };
}) => {
  const [searchTerm, setSearchTerm] = useState(searchParams?.searchTerm || '');
  const [location, setLocation] = useState(searchParams?.location || '');
  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    jobType: '',
    salaryRange: '',
    experience: '',
    department: [] as string[],
    location: [] as string[],
    workMode: [] as string[],
    industry: [] as string[],
    companySize: [] as string[],
    freshness: ''
  });
  const [jobSuggestions, setJobSuggestions] = useState<string[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showJobSuggestions, setShowJobSuggestions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [filterOptions, setFilterOptions] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreJobs, setHasMoreJobs] = useState(true);
  const jobsPerPage = 10;

  // Load saved jobs from localStorage
  useEffect(() => {
    if (user?.name) {
      const userKey = `savedJobs_${user.name}`;
      const saved = localStorage.getItem(userKey);
      if (saved) {
        setSavedJobs(JSON.parse(saved));
      }
    }
  }, [user]);

  // Fetch jobs from MongoDB with advanced search
  const fetchJobs = async (page = 1, append = false) => {
    if (!append) setLoading(true);
    try {
      let url = API_ENDPOINTS.JOBS;
      
      console.log('🔍 API_ENDPOINTS.JOBS:', API_ENDPOINTS.JOBS);
      console.log('🔍 API_ENDPOINTS.BASE_URL:', API_ENDPOINTS.BASE_URL);
      
      // Use advanced search if filters are applied
      if (searchTerm || location || filters.industry.length > 0 || filters.companySize.length > 0 || filters.freshness) {
        const searchParams = {
          query: searchTerm,
          location: location,
          jobType: filters.jobType ? [filters.jobType] : [],
          industry: filters.industry,
          companySize: filters.companySize,
          freshness: filters.freshness,
          page: page,
          limit: jobsPerPage
        };
        
        console.log('🔍 Using advanced search with params:', searchParams);
        
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/search/advanced`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchParams)
        });
        
        if (response.ok) {
          const data = await response.json();
          const jobsArray = Array.isArray(data.jobs) ? data.jobs : [];
          console.log('✅ Advanced search jobs received:', jobsArray.length);
          
          if (append) {
            setJobs(prev => [...prev, ...jobsArray]);
            setFilteredJobs(prev => [...prev, ...jobsArray]);
          } else {
            setJobs(jobsArray);
            setFilteredJobs(jobsArray);
          }
          
          setHasMoreJobs(jobsArray.length === jobsPerPage);
        } else {
          console.error('❌ Advanced search failed:', response.status, response.statusText);
          if (!append) {
            setJobs([]);
            setFilteredJobs([]);
          }
        }
      } else {
        // Regular search
        if (searchTerm || location) {
          const params = new URLSearchParams();
          if (searchTerm) params.append('q', searchTerm);
          if (location) params.append('location', location);
          params.append('page', page.toString());
          params.append('limit', jobsPerPage.toString());
          url = `${API_ENDPOINTS.JOBS}/search/query?${params}`;
        } else {
          url = `${API_ENDPOINTS.JOBS}?page=${page}&limit=${jobsPerPage}`;
        }
        
        console.log('🔍 Fetching jobs from:', url);
        const response = await fetch(url);
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const jobsData = await response.json();
            console.log('✅ Jobs received:', jobsData.length);
            const jobsArray = Array.isArray(jobsData) ? jobsData : [];
            const sortedJobs = jobsArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            if (append) {
              setJobs(prev => [...prev, ...sortedJobs]);
              setFilteredJobs(prev => [...prev, ...sortedJobs]);
            } else {
              setJobs(sortedJobs);
              setFilteredJobs(sortedJobs);
            }
            
            setHasMoreJobs(sortedJobs.length === jobsPerPage);
          } else {
            console.error('❌ Non-JSON response received');
            if (!append) {
              setJobs([]);
              setFilteredJobs([]);
            }
          }
        } else {
          console.error('❌ Jobs API failed:', response.status, response.statusText);
          if (!append) {
            setJobs([]);
            setFilteredJobs([]);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error fetching jobs:', error);
      if (!append) {
        setJobs([]);
        setFilteredJobs([]);
      }
    } finally {
      if (!append) setLoading(false);
    }
  };

  // Fetch filter options and trending jobs
  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/search/filters`);
      if (response.ok) {
        const data = await response.json();
        setFilterOptions(data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchTrending = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/search/trending?limit=5`);
      if (response.ok) {
        const data = await response.json();
        setTrending(data);
      }
    } catch (error) {
      console.error('Error fetching trending jobs:', error);
    }
  };

  // Search and filter function
  const performSearch = useCallback(() => {
    let filtered = [...jobs];
    
    // Search by term
    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by location
    if (location) {
      filtered = filtered.filter(job => 
        job.location?.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    // Apply filters
    if (filters.jobType) {
      filtered = filtered.filter(job => job.type === filters.jobType);
    }
    
    // Filter by department (based on job title/description)
    if (filters.department.length > 0) {
      filtered = filtered.filter(job => {
        const jobText = `${job.title} ${job.description}`.toLowerCase();
        return filters.department.some(dept => {
          if (dept === 'Engineering - Software & QA') {
            return jobText.includes('software') || jobText.includes('engineer') || jobText.includes('developer') || jobText.includes('qa');
          }
          if (dept === 'Sales & Business Development') {
            return jobText.includes('sales') || jobText.includes('business') || jobText.includes('marketing');
          }
          if (dept === 'IT & Information Security') {
            return jobText.includes('security') || jobText.includes('it ') || jobText.includes('system');
          }
          return false;
        });
      });
    }
    
    // Filter by salary range
    if (filters.salaryRange) {
      filtered = filtered.filter(job => {
        const salary = parseInt(job.salary?.replace(/[^0-9]/g, '') || '0');
        if (filters.salaryRange === '0-3 Lakhs') return salary <= 300000;
        if (filters.salaryRange === '3-6 Lakhs') return salary >= 300000 && salary <= 600000;
        if (filters.salaryRange === '6-10 Lakhs') return salary >= 600000 && salary <= 1000000;
        return true;
      });
    }
    
    // Filter by work mode
    if (filters.workMode.length > 0) {
      filtered = filtered.filter(job => {
        const jobText = `${job.type} ${job.location} ${job.description}`.toLowerCase();
        return filters.workMode.some(mode => {
          if (mode === 'Remote') return jobText.includes('remote');
          if (mode === 'Hybrid') return jobText.includes('hybrid');
          if (mode === 'Work from office') return !jobText.includes('remote') && !jobText.includes('hybrid');
          return false;
        });
      });
    }
    
    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    setFilteredJobs(filtered);
  }, [searchTerm, location, jobs, filters]);

  useEffect(() => {
    fetchJobs();
    fetchFilterOptions();
    fetchTrending();
    
    // Listen for job posting events to refresh the list
    const handleJobPosted = () => {
      console.log('New job posted, refreshing job listings...');
      fetchJobs();
    };
    
    window.addEventListener('jobPosted', handleJobPosted);
    
    return () => {
      window.removeEventListener('jobPosted', handleJobPosted);
    };
  }, []);
  
  useEffect(() => {
    if (searchParams?.searchTerm || searchParams?.location) {
      setSearchTerm(searchParams.searchTerm || '');
      setLocation(searchParams.location || '');
      console.log('Search params received:', searchParams);
      fetchJobs();
    } else {
      fetchJobs();
    }
  }, [searchParams]);
  
  useEffect(() => {
    if (jobs.length > 0) {
      const timeoutId = setTimeout(() => {
        performSearch();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [performSearch, jobs]);
  
  const handleApplyNow = (job: any) => {
    if (onNavigate) {
      // Store only essential job data to avoid quota issues
      const essentialJobData = {
        _id: job._id,
        title: job.title || job.jobTitle,
        company: job.company,
        location: job.location,
        description: job.description?.substring(0, 300) || '',
        salary: job.salary,
        type: job.type
      };
      
      try {
        localStorage.setItem('selectedJob', JSON.stringify(essentialJobData));
        onNavigate('job-application');
      } catch (error) {
        console.error('Storage quota exceeded:', error);
        // Clear old data and try again
        localStorage.removeItem('savedJobDetails_user');
        localStorage.removeItem('userApplications');
        try {
          localStorage.setItem('selectedJob', JSON.stringify(essentialJobData));
          onNavigate('job-application');
        } catch (retryError) {
          alert('Storage full. Please clear browser data.');
        }
      }
    }
  };
  
  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === 'department' || filterType === 'location' || filterType === 'workMode' || filterType === 'industry' || filterType === 'companySize') {
      setFilters(prev => {
        const currentArray = prev[filterType as keyof typeof prev] as string[];
        const isSelected = currentArray.includes(value);
        return {
          ...prev,
          [filterType]: isSelected 
            ? currentArray.filter(item => item !== value)
            : [...currentArray, value]
        };
      });
    } else {
      setFilters(prev => ({ ...prev, [filterType]: value }));
    }
    
    // Trigger search when filters change
    setTimeout(() => fetchJobs(), 100);
  };

  const getJobSuggestions = async (input: string): Promise<string[]> => {
    return await aiSuggestions.getJobSuggestions(input);
  };

  const getLocationSuggestions = async (input: string): Promise<string[]> => {
    return await aiSuggestions.getLocationSuggestions(input);
  };

  const handleJobInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.length >= 1) {
      const suggestions = await getJobSuggestions(value);
      setJobSuggestions(suggestions);
      setShowJobSuggestions(true);
    } else {
      setShowJobSuggestions(false);
    }
  };

  const handleLocationInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);
    
    if (value.length >= 1) {
      const suggestions = await getLocationSuggestions(value);
      setLocationSuggestions(suggestions);
      setShowLocationSuggestions(true);
    } else {
      setShowLocationSuggestions(false);
    }
  };

  const selectJobSuggestion = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowJobSuggestions(false);
  };

  const selectLocationSuggestion = (suggestion: string) => {
    setLocation(suggestion);
    setShowLocationSuggestions(false);
  };

  const handleLocationSearch = async (params: { latitude: number; longitude: number; radius: number; query?: string }) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/search/radius`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: params.latitude,
          longitude: params.longitude,
          radius: params.radius,
          query: params.query || '',
          page: 1,
          limit: 50
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const jobsArray = Array.isArray(data.jobs) ? data.jobs : [];
        setJobs(jobsArray);
        setFilteredJobs(jobsArray);
      }
    } catch (error) {
      console.error('Error in location search:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveJob = (job: any) => {
    if (!user?.name) return; // Only allow saving if user is logged in
    
    const jobId = job._id || job.id;
    const isAlreadySaved = savedJobs.includes(jobId);
    
    // Use user-specific keys
    const userKey = `savedJobs_${user.name}`;
    const userDetailsKey = `savedJobDetails_${user.name}`;
    
    let updatedSavedJobs;
    if (isAlreadySaved) {
      // Remove from saved jobs
      updatedSavedJobs = savedJobs.filter(id => id !== jobId);
      // Also remove from job details
      const existingSavedJobDetails = JSON.parse(localStorage.getItem(userDetailsKey) || '[]');
      const updatedJobDetails = existingSavedJobDetails.filter((j: any) => (j._id || j.id) !== jobId);
      localStorage.setItem(userDetailsKey, JSON.stringify(updatedJobDetails));
    } else {
      // Add to saved jobs
      updatedSavedJobs = [...savedJobs, jobId];
      // Also save the job details
      const existingSavedJobDetails = JSON.parse(localStorage.getItem(userDetailsKey) || '[]');
      const updatedJobDetails = [...existingSavedJobDetails.filter((j: any) => (j._id || j.id) !== jobId), job];
      localStorage.setItem(userDetailsKey, JSON.stringify(updatedJobDetails));
    }
    
    setSavedJobs(updatedSavedJobs);
    localStorage.setItem(userKey, JSON.stringify(updatedSavedJobs));
  };

  const handleLoadMoreJobs = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchJobs(nextPage, false); // false = replace instead of append
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      fetchJobs(prevPage, false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      {/* Search Section */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-8">
            <button className="bg-white text-gray-900 px-6 py-2 rounded-full font-medium flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>Search Jobs</span>
            </button>
            <button className="text-gray-300 hover:text-white px-6 py-2 rounded-full font-medium">
              Recommended Jobs
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Job title, skill, company, keyword"
                value={searchTerm}
                onChange={handleJobInputChange}
                onFocus={() => searchTerm.length >= 1 && setShowJobSuggestions(true)}
                onBlur={() => setTimeout(() => setShowJobSuggestions(false), 200)}
                onKeyPress={(e) => e.key === 'Enter' && fetchJobs()}
                className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {showJobSuggestions && jobSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {jobSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onMouseDown={() => selectJobSuggestion(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0 flex items-center text-gray-900"
                    >
                      <Search className="w-4 h-4 text-gray-400 mr-3" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Location (ex. Denver, remote)"
                value={location}
                onChange={handleLocationInputChange}
                onFocus={() => location.length >= 1 && setShowLocationSuggestions(true)}
                onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                onKeyPress={(e) => e.key === 'Enter' && fetchJobs()}
                className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {showLocationSuggestions && locationSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {locationSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onMouseDown={() => selectLocationSuggestion(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0 flex items-center text-gray-900"
                    >
                      <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={() => fetchJobs()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors" 
              title="Search jobs"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFilters(prev => ({ ...prev, freshness: '24h' }))}
              className={`px-3 py-1 rounded-full text-sm border ${
                filters.freshness === '24h' 
                  ? 'bg-blue-100 border-blue-300 text-blue-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Last 24 hours
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, freshness: '7d' }))}
              className={`px-3 py-1 rounded-full text-sm border ${
                filters.freshness === '7d' 
                  ? 'bg-blue-100 border-blue-300 text-blue-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              This week
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, workMode: prev.workMode.includes('Remote') ? prev.workMode.filter(m => m !== 'Remote') : [...prev.workMode, 'Remote'] }))}
              className={`px-3 py-1 rounded-full text-sm border ${
                filters.workMode.includes('Remote') 
                  ? 'bg-blue-100 border-blue-300 text-blue-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Remote Jobs
            </button>
          </div>


        </div>
      </div>

      {/* Job Listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LocationRadiusSearch onSearch={handleLocationSearch} />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Filters */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Trending Jobs */}
              {trending.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    Trending Jobs
                  </h3>
                  <div className="space-y-3">
                    {trending.map((job: any) => (
                      <div key={job._id} className="border-l-2 border-orange-500 pl-3 cursor-pointer hover:bg-gray-50 p-2 rounded" onClick={() => onNavigate && onNavigate(`job-detail/${job._id}`)}>
                        <h4 className="font-medium text-sm">{job.jobTitle}</h4>
                        <p className="text-xs text-gray-600">{job.company}</p>
                        <p className="text-xs text-gray-500">{job.views} views</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">All Filters</h3>
              
              {/* Department */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Department</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={filters.department.includes('Engineering - Software & QA')}
                      onChange={() => handleFilterChange('department', 'Engineering - Software & QA')}
                    />
                    <span className="text-sm">Engineering - Software & QA (34444)</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={filters.department.includes('Sales & Business Development')}
                      onChange={() => handleFilterChange('department', 'Sales & Business Development')}
                    />
                    <span className="text-sm">Sales & Business Development (15502)</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={filters.department.includes('IT & Information Security')}
                      onChange={() => handleFilterChange('department', 'IT & Information Security')}
                    />
                    <span className="text-sm">IT & Information Security (5116)</span>
                  </label>
                </div>
              </div>
              
              {/* Experience */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Experience</h4>
                <select 
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={filters.experience}
                  onChange={(e) => handleFilterChange('experience', e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="0-1 years">0-1 years</option>
                  <option value="1-3 years">1-3 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="5+ years">5+ years</option>
                </select>
              </div>
              
              {/* Salary */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Salary</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={filters.salaryRange === '0-3 Lakhs'}
                      onChange={() => handleFilterChange('salaryRange', filters.salaryRange === '0-3 Lakhs' ? '' : '0-3 Lakhs')}
                    />
                    <span className="text-sm">0-3 Lakhs (3019)</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={filters.salaryRange === '3-6 Lakhs'}
                      onChange={() => handleFilterChange('salaryRange', filters.salaryRange === '3-6 Lakhs' ? '' : '3-6 Lakhs')}
                    />
                    <span className="text-sm">3-6 Lakhs (18634)</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={filters.salaryRange === '6-10 Lakhs'}
                      onChange={() => handleFilterChange('salaryRange', filters.salaryRange === '6-10 Lakhs' ? '' : '6-10 Lakhs')}
                    />
                    <span className="text-sm">6-10 Lakhs (25907)</span>
                  </label>
                </div>
              </div>
              
              {/* Location */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Location</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Bengaluru (15212)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Hyderabad (8126)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Chennai (6997)</span>
                  </label>
                </div>
              </div>
              
              {/* Work Mode */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Work mode</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={filters.workMode.includes('Work from office')}
                      onChange={() => handleFilterChange('workMode', 'Work from office')}
                    />
                    <span className="text-sm">Work from office (37469)</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={filters.workMode.includes('Hybrid')}
                      onChange={() => handleFilterChange('workMode', 'Hybrid')}
                    />
                    <span className="text-sm">Hybrid (3327)</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2" 
                      checked={filters.workMode.includes('Remote')}
                      onChange={() => handleFilterChange('workMode', 'Remote')}
                    />
                    <span className="text-sm">Remote (1052)</span>
                  </label>
                </div>
              </div>
              
              {/* Industry Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Industry</h4>
                <div className="space-y-2">
                  {['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing'].map((industry) => (
                    <label key={industry} className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-2" 
                        checked={filters.industry.includes(industry)}
                        onChange={() => handleFilterChange('industry', industry)}
                      />
                      <span className="text-sm">{industry}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Company Size Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Company Size</h4>
                <div className="space-y-2">
                  {['1-10', '11-50', '51-200', '201-500', '500+'].map((size) => (
                    <label key={size} className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-2" 
                        checked={filters.companySize.includes(size)}
                        onChange={() => handleFilterChange('companySize', size)}
                      />
                      <span className="text-sm">{size} employees</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
          
          {/* Right Content - Job Results */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <p className="text-gray-600">
                {loading ? 'Searching...' : (
                  `${filteredJobs.length} results` +
                  (filteredJobs.length > 0 ? ` (${Math.floor(filteredJobs.length * 0.6)} new)` : '')
                )}
              </p>
            </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <button onClick={() => setShowFilters(false)} title="Close filters">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                <select 
                  value={filters.jobType}
                  onChange={(e) => handleFilterChange('jobType', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                <select 
                  value={filters.experience}
                  onChange={(e) => handleFilterChange('experience', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">All Levels</option>
                  <option value="Entry">Entry Level</option>
                  <option value="Mid">Mid Level</option>
                  <option value="Senior">Senior Level</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
                <select 
                  value={filters.salaryRange}
                  onChange={(e) => handleFilterChange('salaryRange', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">All Ranges</option>
                  <option value="50k-100k">$50k - $100k</option>
                  <option value="100k-150k">$100k - $150k</option>
                  <option value="150k+">$150k+</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            {[...Array(5)].map((_, index) => (
              <JobCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-500">Try adjusting your search terms or browse all jobs.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.isArray(filteredJobs) && filteredJobs.map((job) => (
            <div key={job._id || job.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow max-w-4xl">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-start mb-3">
                    {/* Company Logo */}
                    <div className="flex-shrink-0 w-10 h-10 mr-3">
                      <div className="w-10 h-10 rounded border border-gray-200 flex items-center justify-center bg-white">
                        {job.companyLogo || job.company?.toLowerCase().includes('trinity') ? (
                          <img 
                            src={job.company?.toLowerCase().includes('trinity') ? '/images/company-logos/trinity-logo.png' : job.companyLogo}
                            alt={`${job.company} logo`}
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              // Special Trinity fallback
                              if (job.company?.toLowerCase().includes('trinity')) {
                                img.src = `data:image/svg+xml,${encodeURIComponent(`
                                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                                    <rect width="32" height="32" fill="#4F46E5" rx="4"/>
                                    <text x="16" y="14" text-anchor="middle" fill="white" font-family="Arial" font-size="8" font-weight="bold">Trinity</text>
                                    <text x="16" y="22" text-anchor="middle" fill="white" font-family="Arial" font-size="6">Tech</text>
                                  </svg>
                                `)}`;
                              } else {
                                img.src = '/images/zync-logo.svg';
                              }
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                            {/* Empty placeholder when no logo */}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Job Info */}
                    <div className="flex-1">
                      <h3 
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer mb-1"
                        onClick={() => onNavigate && onNavigate('job-detail', { jobId: job._id || job.id, jobData: job })}
                      >
                        {decodeHtmlEntities(job.title || job.jobTitle)}
                      </h3>
                      <p className="text-blue-600 font-medium mb-2">{job.company}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>{formatSalary(job.salary)}</span>
                        </div>
                        {job.type && (
                          <div className="flex items-center space-x-1">
                            <Briefcase className="w-4 h-4" />
                            <span>{job.type}</span>
                          </div>
                        )}
                        <span className="text-gray-500">{formatDate(job.createdAt)}</span>
                      </div>

                      <p className="text-gray-600 text-sm">
                        {job.description && job.description.length > 100 
                          ? `${formatJobDescription(decodeHtmlEntities(job.description).substring(0, 100), typeof job.salary === 'object' ? job.salary.currency : undefined)}...` 
                          : formatJobDescription(decodeHtmlEntities(job.description || ''), typeof job.salary === 'object' ? job.salary.currency : undefined)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {user?.type === 'candidate' && (
                    <button 
                      onClick={() => handleSaveJob(job)}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg border transition-colors ${
                        savedJobs.includes(job._id || job.id)
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {savedJobs.includes(job._id || job.id) ? (
                        <BookmarkCheck className="w-4 h-4" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                      <span className="text-sm">{savedJobs.includes(job._id || job.id) ? 'Saved' : 'Save'}</span>
                    </button>
                  )}
                  <button 
                    onClick={() => onNavigate && onNavigate('job-detail', { jobId: job._id || job.id, jobData: job })}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
            ))}
            
            {hasMoreJobs && (
              <div className="flex justify-center items-center space-x-4 py-6">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-gray-600">Page {currentPage}</span>
                <button
                  onClick={handleLoadMoreJobs}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
          </div>
        </div>
      </div>
      
      <Footer onNavigate={onNavigate} />
      
      {/* Floating Back Button */}
      <BackButton 
        fallbackPage="home"
        onNavigate={onNavigate}
      />
    </div>
  );
};

export default JobListingsPage;