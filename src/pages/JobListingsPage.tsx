import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Filter, Briefcase, TrendingUp, X, Bookmark, BookmarkCheck, Clock } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import LocationRadiusSearch from '../components/LocationRadiusSearch';
import RecommendedJobs from '../components/RecommendedJobs';
import { aiSuggestions } from '../utils/aiSuggestions';
import { JobCardSkeleton, SearchLoading } from '../components/LoadingStates';
import { decodeHtmlEntities, formatDate, formatSalary, getPostingFreshness } from '../utils/textUtils';
import { getSafeCompanyLogo } from '../utils/logoUtils';
import { API_ENDPOINTS } from '../config/env';
import localStorageMigration from '../services/localStorageMigration';
import JobShareModal from '../components/JobShareModal';

const JobListingsPage = ({ onNavigate, user, onLogout, searchParams }: { 
  onNavigate?: (page: string, data?: any) => void;
  user?: {name: string, type: 'candidate' | 'employer'} | null;
  onLogout?: () => void;
  searchParams?: { searchTerm?: string; location?: string; experience?: string; category?: string; categoryTerms?: string[] };
}) => {
  const [searchTerm, setSearchTerm] = useState(searchParams?.searchTerm || '');
  const [location, setLocation] = useState(searchParams?.location || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams?.category || '');
  const [categoryTerms, setCategoryTerms] = useState<string[]>(searchParams?.categoryTerms || []);
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
  const [activeTab, setActiveTab] = useState<'search' | 'recommended'>('search');
  const [resumeSkills, setResumeSkills] = useState<Array<{ skill: string }>>([]);
  const [statsCompanies, setStatsCompanies] = useState<number>(0);
  const [shareJob, setShareJob] = useState<any>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [statsJobSeekers, setStatsJobSeekers] = useState<number>(0);
  const jobsPerPage = 10;

  // Load saved jobs from backend if user is logged in
  useEffect(() => {
    if (user?.name) {
      loadSavedJobsFromBackend();
    } else {
      // Load from localStorage for non-logged users
      const userKey = `savedJobs_${user?.name || 'guest'}`;
      const saved = localStorage.getItem(userKey);
      if (saved) {
        setSavedJobs(JSON.parse(saved));
      }
    }
  }, [user]);

  // Load resume skills from backend if user is logged in
  useEffect(() => {
    if (user?.name) {
      loadResumeSkillsFromBackend();
    } else {
      // Load from localStorage for non-logged users
      try {
        const resumeData = localStorage.getItem('resumeData');
        if (resumeData) {
          const parsed = JSON.parse(resumeData);
          if (parsed.skills && Array.isArray(parsed.skills)) {
            setResumeSkills(parsed.skills);
          }
        }
      } catch (error) {
        console.error('Error loading resume skills:', error);
      }
    }
  }, [user]);

  const loadSavedJobsFromBackend = async () => {
    try {
      // This would need to be implemented for regular saved jobs (not just recommended)
      // For now, fallback to localStorage
      const userKey = `savedJobs_${user?.name}`;
      const saved = localStorage.getItem(userKey);
      if (saved) {
        setSavedJobs(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved jobs from backend:', error);
    }
  };

  const loadResumeSkillsFromBackend = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('no token');
      localStorageMigration.setToken(token);
      const skills = await localStorageMigration.getResumeSkills();
      if (skills.length > 0) { setResumeSkills(skills); return; }
    } catch {}
    // fallback to localStorage
    try {
      const resumeData = localStorage.getItem('resumeData');
      if (resumeData) {
        const parsed = JSON.parse(resumeData);
        if (parsed.skills && Array.isArray(parsed.skills)) setResumeSkills(parsed.skills);
      }
    } catch (e) {
      console.error('Error loading resume skills from localStorage:', e);
    }
  };

  // Fetch jobs from MongoDB with advanced search
  const fetchJobs = async (page = 1, append = false) => {
    if (!append) setLoading(true);
    try {
      let url = API_ENDPOINTS.JOBS;
      
      console.log('🔍 API_ENDPOINTS.JOBS:', API_ENDPOINTS.JOBS);
      console.log('🔍 API_ENDPOINTS.BASE_URL:', API_ENDPOINTS.BASE_URL);
      
      // Use advanced search if filters are applied or category is selected
      if (searchTerm || location || filters.industry.length > 0 || filters.companySize.length > 0 || filters.freshness || categoryTerms.length > 0) {
        const searchQuery = categoryTerms.length > 0 ? categoryTerms.join(' OR ') : searchTerm;
        const searchParams = {
          query: searchQuery,
          location: location,
          jobType: filters.jobType ? [filters.jobType] : [],
          industry: filters.industry,
          companySize: filters.companySize,
          freshness: filters.freshness,
          page: page,
          limit: jobsPerPage
        };
        
        console.log('🔍 Using advanced search with params:', searchParams);
        
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/search/advanced`, {
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
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/search/filters`);
      if (response.ok) {
        const data = await response.json();
        setFilterOptions(data);
      }
    } catch (error) {
      // Silently fail - filters endpoint not critical
    }
  };

  const fetchTrending = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/search/trending?limit=5`);
      if (response.ok) {
        const data = await response.json();
        setTrending(data);
      }
    } catch (error) {
      // Silently fail - trending endpoint not critical
    }
  };

  // Search and filter function
  const performSearch = useCallback(() => {
    let filtered = [...jobs];
    
    // Search by term or category
    if (searchTerm || categoryTerms.length > 0) {
      filtered = filtered.filter(job => {
        const jobText = `${job.title} ${job.description} ${job.company}`.toLowerCase();
        
        // If we have category terms, check if job matches any of them
        if (categoryTerms.length > 0) {
          const matchesCategory = categoryTerms.some(term => 
            jobText.includes(term.toLowerCase())
          );
          if (matchesCategory) return true;
        }
        
        // Also check regular search term
        if (searchTerm) {
          return jobText.includes(searchTerm.toLowerCase());
        }
        
        return categoryTerms.length > 0; // If only category filtering, return category matches
      });
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
        const jobText = `${job.type} ${job.location} ${job.description} ${job.workMode || ''}`.toLowerCase();
        return filters.workMode.some(mode => {
          if (mode === 'Remote') return jobText.includes('remote');
          if (mode === 'Hybrid') return jobText.includes('hybrid');
          if (mode === 'Work from office') return !jobText.includes('remote') && !jobText.includes('hybrid');
          return false;
        });
      });
    }

    // Filter by freshness
    if (filters.freshness) {
      const now = Date.now();
      const cutoff = filters.freshness === '24h'
        ? now - 24 * 60 * 60 * 1000
        : now - 7 * 24 * 60 * 60 * 1000;
      filtered = filtered.filter(job => {
        const posted = new Date(job.createdAt).getTime();
        return posted >= cutoff;
      });
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    setFilteredJobs(filtered);
  }, [searchTerm, location, jobs, filters, categoryTerms]);

  const fetchStats = async () => {
    try {
      const jobsRes = await fetch(API_ENDPOINTS.JOBS);
      if (jobsRes.ok) {
        const allJobs = await jobsRes.json();
        const uniqueCompanies = new Set(allJobs.map((j: any) => j.company).filter(Boolean));
        setStatsCompanies(uniqueCompanies.size);
      }
    } catch {}
    try {
      const usersRes = await fetch(`${API_ENDPOINTS.BASE_URL}/users/stats/counts`);
      if (usersRes.ok) {
        const data = await usersRes.json();
        setStatsJobSeekers(data.candidates || 0);
      }
    } catch {}
  };

  useEffect(() => {
    fetchJobs();
    fetchFilterOptions();
    fetchTrending();
    fetchStats();
    
    const handleJobPosted = () => {
      console.log('New job posted, refreshing job listings...');
      fetchJobs();
    };
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lastJobPosted') {
        console.log('Job posted detected, refreshing...');
        setTimeout(() => fetchJobs(), 500);
      }
    };
    
    window.addEventListener('jobPosted', handleJobPosted);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('jobPosted', handleJobPosted);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  useEffect(() => {
    if (searchParams?.searchTerm || searchParams?.location || searchParams?.category) {
      setSearchTerm(searchParams.searchTerm || '');
      setLocation(searchParams.location || '');
      setSelectedCategory(searchParams.category || '');
      setCategoryTerms(searchParams.categoryTerms || []);
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
  }, [performSearch, jobs, filters]);
  
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
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/search/radius`, {
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
    fetchJobs(nextPage, true); // true = append for lazy loading
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      {/* Search Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-8 left-8 w-16 h-16 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-16 right-16 w-24 h-24 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-8 left-1/3 w-12 h-12 bg-white/10 rounded-full blur-lg animate-pulse delay-500"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Content */}
          <div className="text-center mb-8">
            <div className="flex justify-center items-center mb-4">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
              {selectedCategory ? `${selectedCategory} Jobs` : 'Find Your Dream Job'}
            </h1>
            <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto drop-shadow">
              {selectedCategory 
                ? `Discover ${selectedCategory.toLowerCase()} opportunities from top companies` 
                : 'Discover thousands of opportunities from top companies worldwide'
              }
            </p>
            
            {/* Quick Stats */}
            <div className="flex justify-center items-center gap-8 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{loading ? '...' : filteredJobs.length}+</div>
                <div className="text-white/80 text-sm">Active Jobs</div>
              </div>
              <div className="w-px h-8 bg-white/30"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{statsCompanies > 0 ? `${statsCompanies}+` : `...`}</div>
                <div className="text-white/80 text-sm">Companies</div>
              </div>
              <div className="w-px h-8 bg-white/30"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{statsJobSeekers > 0 ? `${statsJobSeekers}+` : `...`}</div>
                <div className="text-white/80 text-sm">Job Seekers</div>
              </div>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex justify-center space-x-1 mb-6">
            <button 
              onClick={() => setActiveTab('search')}
              className={`px-6 py-3 rounded-full font-medium flex items-center space-x-2 transition-all ${
                activeTab === 'search' 
                  ? 'bg-white text-gray-900 shadow-lg' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Search Jobs</span>
            </button>
            <button 
              onClick={() => setActiveTab('recommended')}
              className={`px-6 py-3 rounded-full font-medium flex items-center space-x-2 transition-all ${
                activeTab === 'recommended' 
                  ? 'bg-white text-gray-900 shadow-lg' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Recommended Jobs</span>
            </button>
          </div>

          {/* Search Bar - Only show in search tab */}
          {activeTab === 'search' && (
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
          )}

          {/* Quick Filters - Only show in search tab */}
          {activeTab === 'search' && (
          <div className="flex gap-2 mb-4">
            {selectedCategory && (
              <div className="flex items-center gap-2 bg-blue-100 border border-blue-300 text-blue-700 px-3 py-1 rounded-full text-sm">
                <span>Category: {selectedCategory}</span>
                <button 
                  onClick={() => {
                    setSelectedCategory('');
                    setCategoryTerms([]);
                    setSearchTerm('');
                    fetchJobs();
                  }}
                  className="ml-1 hover:bg-blue-200 rounded-full p-1"
                  title="Clear category filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <button
              onClick={() => setFilters(prev => ({ ...prev, freshness: prev.freshness === '24h' ? '' : '24h' }))}
              className={`px-3 py-1 rounded-full text-sm border ${
                filters.freshness === '24h' 
                  ? 'bg-blue-100 border-blue-300 text-blue-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Last 24 hours
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, freshness: prev.freshness === '7d' ? '' : '7d' }))}
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
          )}

        </div>
      </div>

      {/* Job Listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {activeTab === 'search' && <LocationRadiusSearch onSearch={handleLocationSearch} />}
        
        {activeTab === 'recommended' ? (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended Jobs for You</h2>
            <RecommendedJobs resumeSkills={resumeSkills} location={location || ''} user={user} />
          </div>
        ) : (
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
                    {trending.map((job: any, idx: number) => (
                      <div key={job._id || idx} className="border-l-2 border-orange-500 pl-3 cursor-pointer hover:bg-gray-50 p-2 rounded" onClick={() => onNavigate && onNavigate(`job-detail/${job._id}`)}>

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
            <div className="mb-3">
              <p className="text-gray-600 text-sm">
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
                  <option value="50k-100k">₹50k - ₹100k</option>
                  <option value="100k-150k">₹100k - ₹150k</option>
                  <option value="150k+">₹150k+</option>
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
            <div key={job._id || job.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-gray-300 transition-all bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start mb-3">
                    <div className="flex-shrink-0 w-14 h-14 mr-4">
                      <div className="w-14 h-14 rounded-lg border border-gray-200 flex items-center justify-center bg-white">
                        <img
                            src={getSafeCompanyLogo(job)}
                            alt={`${job.company} logo`}
                            className="w-12 h-12 object-contain"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              const name = job.company || '';
                              const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
                              img.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="48" height="48" fill="#3B82F6" rx="8"/><text x="24" y="31" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">${initials}</text></svg>`)}`;
                            }}
                          />
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3
                        className="text-xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer mb-1"
                        onClick={() => onNavigate && onNavigate('job-detail', { jobTitle: job.title || job.jobTitle, jobId: job._id || job.id, companyName: job.company, jobData: job })}
                      >
                        {decodeHtmlEntities(job.title || job.jobTitle)}
                      </h3>
                      <p className="text-base text-blue-700 font-semibold flex items-center gap-1 mb-3">
                        <span>🏢</span>
                        {job.company}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <div className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-lg">
                          <MapPin className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">{job.location}</span>
                        </div>
                        {formatSalary(job.salary) && (
                          <div className="flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-lg">
                            <span className="text-sm font-semibold text-green-700">{formatSalary(job.salary)}</span>
                          </div>
                        )}
                        {job.type && (
                          <div className="flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg">
                            <Briefcase className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-700">{job.type}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-lg">
                          <span className="text-xs font-medium text-purple-600">{formatDate(job.createdAt)}</span>
                        </div>
                        {getPostingFreshness(job.createdAt) === 'new' && (
                          <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">NEW</span>
                        )}
                      </div>

                      {job.description && (
                        <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                          <p className="text-sm text-gray-700 leading-relaxed font-medium">
                            {decodeHtmlEntities(job.description.replace(/<[^>]+>/g, '')).substring(0, 150)}{job.description.length > 150 ? '...' : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2 ml-4">
                  {user?.type === 'candidate' && (
                    <button
                      onClick={() => handleSaveJob(job)}
                      className={`flex items-center space-x-1 px-4 py-2 rounded-lg border-2 transition-colors shadow-sm ${
                        savedJobs.includes(job._id || job.id)
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {savedJobs.includes(job._id || job.id) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      <span className="text-sm font-semibold">{savedJobs.includes(job._id || job.id) ? 'Saved' : 'Save'}</span>
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setShareJob(job); setShowShareModal(true); }}
                    className="flex items-center space-x-1 px-4 py-2 rounded-lg border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <span className="text-sm font-semibold">Share</span>
                  </button>
                  <button
                    onClick={() => onNavigate && onNavigate('job-detail', { jobTitle: job.title || job.jobTitle, jobId: job._id || job.id, companyName: job.company, jobData: job })}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm min-w-[140px]"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
            ))}
            
            {hasMoreJobs && (
              <div className="flex justify-center py-6">
                <button
                  onClick={handleLoadMoreJobs}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Load More Jobs
                </button>
              </div>
            )}
          </div>
        )}
          </div>
        </div>
        )}
      </div>
      
      <Footer onNavigate={onNavigate} />

      <JobShareModal
        isOpen={showShareModal}
        onClose={() => { setShowShareModal(false); setShareJob(null); }}
        job={shareJob}
      />

      {/* Floating Back Button */}
      <BackButton 
        onClick={() => onNavigate ? onNavigate('home') : window.history.back()}
      />
    </div>
  );
};

export default JobListingsPage;
