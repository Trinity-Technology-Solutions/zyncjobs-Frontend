import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, Filter, Briefcase, TrendingUp, X, Bookmark, BookmarkCheck, Clock } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import { tokenStorage } from '../utils/tokenStorage';
import RecommendedJobs from '../components/RecommendedJobs';
import { aiSuggestions } from '../utils/aiSuggestions';
import { JobCardSkeleton, SearchLoading } from '../components/LoadingStates';
import { decodeHtmlEntities, formatDate, formatSalary, getPostingFreshness } from '../utils/textUtils';
import { getSafeCompanyLogo } from '../utils/logoUtils';
import { API_ENDPOINTS } from '../config/env';
import localStorageMigration from '../services/localStorageMigration';
import SalaryRangeSlider from '../components/SalaryRangeSlider';
import LocationRadiusSearch from '../components/LocationRadiusSearch';
import { getId } from '../utils/getId';

const JobListingsPage = ({ onNavigate, user, onLogout, searchParams: initialSearch }: { 
  onNavigate?: (page: string, data?: any) => void;
  user?: {name: string, type: 'candidate' | 'employer'} | null;
  onLogout?: () => void;
  searchParams?: { searchTerm?: string; location?: string; experience?: string; category?: string; categoryTerms?: string[] };
}) => {
  const [searchTerm, setSearchTerm] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return initialSearch?.searchTerm || p.get('q') || '';
  });
  const [location, setLocation] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return initialSearch?.location || p.get('location') || '';
  });
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return initialSearch?.category || p.get('category') || '';
  });
  const [categoryTerms, setCategoryTerms] = useState<string[]>(initialSearch?.categoryTerms || []);
  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [salaryMin, setSalaryMin] = useState(0);
  const [salaryMax, setSalaryMax] = useState(50);
  const [expMin, setExpMin] = useState(0);
  const [expMax, setExpMax] = useState(30);
  const [locationSearch, setLocationSearch] = useState('');
  const [showAllLocations, setShowAllLocations] = useState(false);
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
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'search' | 'recommended'>(
    searchParams.get('tab') === 'recommended' ? 'recommended' : 'search'
  );
  const [resumeSkills, setResumeSkills] = useState<Array<{ skill: string }>>([]);
  const [statsCompanies, setStatsCompanies] = useState<number>(0);
  const [statsJobSeekers, setStatsJobSeekers] = useState<number>(0);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [companyLogos, setCompanyLogos] = useState<Record<string, string>>({});
  const jobsPerPage = 10;

  // Load applied jobs for candidate
  useEffect(() => {
    if (user?.type === 'candidate') {
      const userData = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
      const email = userData.email;
      if (!email) return;
      fetch(`${API_ENDPOINTS.BASE_URL}/applications/candidate/${encodeURIComponent(email)}`)
        .then(r => r.ok ? r.json() : [])
        .then((apps: any[]) => {
          const ids = new Set(apps.map((a: any) => getId(a.jobId) || a.jobId || '').filter(Boolean));
          setAppliedJobIds(ids);
        })
        .catch(() => {});
    }
  }, [user]);

  // Load saved jobs from backend if user is logged in
  useEffect(() => {
    if (user?.name) {
      loadSavedJobsFromBackend();
    } else {
      const userKey = `savedJobs_${user?.name || 'guest'}`;
      const saved = localStorage.getItem(userKey);
      if (saved) setSavedJobs(JSON.parse(saved));
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
      const token = tokenStorage.getAccess();
      if (!token) {
        const userKey = `savedJobs_${user?.name}`;
        const saved = localStorage.getItem(userKey);
        if (saved) setSavedJobs(JSON.parse(saved));
        return;
      }
      const res = await fetch(`${API_ENDPOINTS.BASE_URL}/saved-jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedJobs(data.jobIds || []);
      }
    } catch (error) {
      console.error('Error loading saved jobs from backend:', error);
    }
  };

  const loadResumeSkillsFromBackend = async () => {
    try {
      const token = tokenStorage.getAccess();
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

  const clientFilter = useCallback((jobList: any[], term: string, loc: string) => {
    return jobList.filter(job => {
      const text = [
        job.title, job.jobTitle, job.description,
        job.company, job.skills, job.requirements,
        job.jobCategory, job.category
      ].filter(Boolean).join(' ').toLowerCase();
      const matchTerm = !term || term.toLowerCase().split(/\s+/).every(w => text.includes(w));
      const matchLoc = !loc || (job.location || '').toLowerCase().includes(loc.toLowerCase()) ||
        (job.country || '').toLowerCase().includes(loc.toLowerCase());
      return matchTerm && matchLoc;
    });
  }, []);

  // Fetch jobs from MongoDB with advanced search
  const fetchJobs = useCallback(async (page = 1, append = false, overrideSearch?: { term?: string; loc?: string }) => {
    if (!append) setLoading(true);
    const activeTerm = overrideSearch?.term !== undefined ? overrideSearch.term : searchTerm;
    const activeLoc = overrideSearch?.loc !== undefined ? overrideSearch.loc : location;
    try {
      let url = API_ENDPOINTS.JOBS;

      if (activeTerm || activeLoc || filters.industry.length > 0 || filters.companySize.length > 0 || filters.freshness || categoryTerms.length > 0) {
        const searchQuery = categoryTerms.length > 0 ? categoryTerms.join(' OR ') : activeTerm;
        const searchParams = {
          query: searchQuery,
          location: activeLoc,
          jobType: filters.jobType ? [filters.jobType] : [],
          industry: filters.industry,
          companySize: filters.companySize,
          freshness: filters.freshness,
          page,
          limit: jobsPerPage
        };

        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/search/advanced`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchParams)
        });

        if (response.ok) {
          const data = await response.json();
          const jobsArray = Array.isArray(data.jobs) ? data.jobs : (Array.isArray(data) ? data : []);
          if (jobsArray.length > 0) {
            if (append) {
              setJobs(prev => [...prev, ...jobsArray]);
              setFilteredJobs(prev => [...prev, ...jobsArray]);
            } else {
              setJobs(jobsArray);
              setFilteredJobs(jobsArray);
            }
            setHasMoreJobs(jobsArray.length === jobsPerPage);
            return;
          }
        }
        // Advanced search failed or returned empty — fall back to client-side filter on all jobs
        if (!append) {
          // If we have jobs loaded, filter them; otherwise fetch all and filter
          if (jobs.length > 0) {
            const fallback = clientFilter(jobs, activeTerm, activeLoc);
            setFilteredJobs(fallback);
          } else {
            const allRes = await fetch(`${API_ENDPOINTS.JOBS}?limit=200`);
            if (allRes.ok) {
              const allData = await allRes.json();
              const allArr = Array.isArray(allData) ? allData : (allData.jobs || []);
              setJobs(allArr);
              setFilteredJobs(clientFilter(allArr, activeTerm, activeLoc));
            }
          }
        }
      } else {
        url = `${API_ENDPOINTS.JOBS}?page=${page}&limit=${jobsPerPage}`;
        const response = await fetch(url);
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const jobsData = await response.json();
            const jobsArray = Array.isArray(jobsData) ? jobsData : (Array.isArray(jobsData?.jobs) ? jobsData.jobs : []);
            const sortedJobs = jobsArray.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            if (append) {
              setJobs(prev => [...prev, ...sortedJobs]);
              setFilteredJobs(prev => [...prev, ...sortedJobs]);
            } else {
              setJobs(sortedJobs);
              setFilteredJobs(sortedJobs);
            }
            setHasMoreJobs(sortedJobs.length === jobsPerPage);
          } else {
            if (!append) { setJobs([]); setFilteredJobs([]); }
          }
        } else {
          console.error('❌ Jobs API failed:', response.status);
          if (!append) { setJobs([]); setFilteredJobs([]); }
        }
      }
    } catch (error) {
      console.error('❌ Error fetching jobs:', error);
      if (!append) { setJobs([]); setFilteredJobs([]); }
    } finally {
      if (!append) setLoading(false);
    }
  }, [searchTerm, location, filters, categoryTerms, jobsPerPage]);

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

  const applyFilters = useCallback((updatedFilters: typeof filters, jobList: any[]) => {
    let filtered = clientFilter(jobList, searchTerm, location);

    if (updatedFilters.department.length > 0) {
      filtered = filtered.filter(job =>
        updatedFilters.department.includes(job.jobCategory || job.category || '')
      );
    }
    // experience filtered via expMin/expMax slider directly

    if (updatedFilters.workMode.length > 0) {
      filtered = filtered.filter(job => {
        const jobText = `${job.type || ''} ${job.location || ''} ${job.description || ''} ${job.workMode || ''}`.toLowerCase();
        return updatedFilters.workMode.some(mode => {
          if (mode === 'Remote') return jobText.includes('remote');
          if (mode === 'Hybrid') return jobText.includes('hybrid');
          if (mode === 'Work from office') return !jobText.includes('remote') && !jobText.includes('hybrid');
          return false;
        });
      });
    }
    if (updatedFilters.location.length > 0) {
      filtered = filtered.filter(job =>
        updatedFilters.location.some(loc => (job.location || '').toLowerCase().includes(loc.toLowerCase()))
      );
    }
    if (updatedFilters.industry.length > 0) {
      filtered = filtered.filter(job => {
        const jobText = `${job.title || ''} ${job.description || ''} ${job.industry || ''}`.toLowerCase();
        return updatedFilters.industry.some(ind => jobText.includes(ind.toLowerCase()));
      });
    }
    if (updatedFilters.jobType) {
      filtered = filtered.filter(job => {
        const t = job.type || job.jobType;
        const arr = Array.isArray(t) ? t : t ? [t] : [];
        return arr.some((v: string) => v.toLowerCase() === updatedFilters.jobType.toLowerCase());
      });
    }
    if (updatedFilters.freshness) {
      const now = Date.now();
      const cutoff = updatedFilters.freshness === '24h' ? now - 86400000 : now - 604800000;
      filtered = filtered.filter(job => new Date(job.createdAt).getTime() >= cutoff);
    }
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setFilteredJobs(filtered);
  }, [clientFilter, searchTerm, location]);

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

  const fetchCompanyLogos = async (jobList: any[]) => {
    try {
      const res = await fetch(API_ENDPOINTS.COMPANIES);
      if (!res.ok) return;
      const data = await res.json();
      const companies: any[] = Array.isArray(data) ? data : (data.companies || data.data || []);
      const map: Record<string, string> = {};
      companies.forEach((c: any) => {
        const name = (c.name || c.companyName || '').toLowerCase();
        const logo = c.logo || c.logoUrl || c.imageUrl || c.image || '';
        if (name && logo) map[name] = logo;
      });
      // Also check job.companyLogo field directly
      jobList.forEach((j: any) => {
        const name = (j.company || '').toLowerCase();
        const logo = j.companyLogo || j.logoUrl || '';
        if (name && logo && !map[name]) map[name] = logo;
      });
      setCompanyLogos(map);
    } catch {}
  };

  useEffect(() => {
    fetchJobs();
    fetchFilterOptions();
    fetchTrending();
    fetchStats();
    fetchCompanyLogos([]);

    const handleJobPosted = () => fetchJobs();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lastJobPosted') setTimeout(() => fetchJobs(), 500);
    };

    window.addEventListener('jobPosted', handleJobPosted);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('jobPosted', handleJobPosted);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchJobs]);
  
  useEffect(() => {
    if (initialSearch?.searchTerm || initialSearch?.location || initialSearch?.category) {
      const term = initialSearch.searchTerm || '';
      const loc = initialSearch.location || '';
      setSearchTerm(term);
      setLocation(loc);
      setSelectedCategory(initialSearch.category || '');
      setCategoryTerms(initialSearch.categoryTerms || []);
    }
  }, [initialSearch]);

  // Re-run search whenever URL params (q / location) change — handles hero search & popular searches
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const loc = searchParams.get('location') || '';
    if (q || loc) {
      setSearchTerm(q);
      setLocation(loc);
      fetchJobs(1, false, { term: q, loc });
    }
  }, [searchParams.get('q'), searchParams.get('location')]);
  
  useEffect(() => {
    if (jobs.length > 0) {
      applyFilters(filters, jobs);
      fetchCompanyLogos(jobs);
    }
  }, [jobs]);
  
  const handleApplyNow = (job: any) => {
    if (onNavigate) {
      // Store only essential job data to avoid quota issues
      const essentialJobData = {
        id: getId(job),
        _id: getId(job),
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
          window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Storage full. Please clear browser data." } }));
        }
      }
    }
  };
  
  const handleFilterChange = (filterType: string, value: string) => {
    const arrayFilters = ['department', 'location', 'workMode', 'industry', 'companySize'];
    setFilters(prev => {
      const updated = arrayFilters.includes(filterType)
        ? {
            ...prev,
            [filterType]: (prev[filterType as keyof typeof prev] as string[]).includes(value)
              ? (prev[filterType as keyof typeof prev] as string[]).filter(i => i !== value)
              : [...(prev[filterType as keyof typeof prev] as string[]), value]
          }
        : { ...prev, [filterType]: value };
      applyFilters(updated, jobs);
      return updated;
    });
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

  const handleSearch = () => fetchJobs(1, false, { term: searchTerm, loc: location });

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

  const handleSaveJob = async (job: any) => {
    if (!user?.name) return;
    const jobId = getId(job);
    const isAlreadySaved = savedJobs.includes(jobId);
    // Optimistic update
    setSavedJobs(prev => isAlreadySaved ? prev.filter(id => id !== jobId) : [...prev, jobId]);
    try {
      const token = tokenStorage.getAccess();
      if (token) {
        if (isAlreadySaved) {
          await fetch(`${API_ENDPOINTS.BASE_URL}/saved-jobs/${jobId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
        } else {
          await fetch(`${API_ENDPOINTS.BASE_URL}/saved-jobs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              jobId,
              jobTitle: job.jobTitle || job.title,
              company: job.company,
              location: job.location,
              salary: job.salary,
              jobType: job.type || job.jobType
            })
          });
        }
      } else {
        // Fallback localStorage for guests
        const userKey = `savedJobs_${user.name}`;
        const updated = isAlreadySaved ? savedJobs.filter(id => id !== jobId) : [...savedJobs, jobId];
        localStorage.setItem(userKey, JSON.stringify(updated));
      }
    } catch (error) {
      // Revert optimistic update on error
      setSavedJobs(prev => isAlreadySaved ? [...prev, jobId] : prev.filter(id => id !== jobId));
      console.error('Error saving job:', error);
    }
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
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
              onClick={handleSearch}
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
                    fetchJobs(1, false, { term: '', loc: location });
                  }}
                  className="ml-1 hover:bg-blue-200 rounded-full p-1"
                  title="Clear category filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <button
              onClick={() => {
                const updated = { ...filters, freshness: filters.freshness === '24h' ? '' : '24h' };
                setFilters(updated); applyFilters(updated, jobs);
              }}
              className={`px-3 py-1 rounded-full text-sm border ${
                filters.freshness === '24h' 
                  ? 'bg-blue-100 border-blue-300 text-blue-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Last 24 hours
            </button>
            <button
              onClick={() => {
                const updated = { ...filters, freshness: filters.freshness === '7d' ? '' : '7d' };
                setFilters(updated); applyFilters(updated, jobs);
              }}
              className={`px-3 py-1 rounded-full text-sm border ${
                filters.freshness === '7d' 
                  ? 'bg-blue-100 border-blue-300 text-blue-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              This week
            </button>
            <button
              onClick={() => {
                const updated = { ...filters, workMode: filters.workMode.includes('Remote') ? filters.workMode.filter(m => m !== 'Remote') : [...filters.workMode, 'Remote'] };
                setFilters(updated); applyFilters(updated, jobs);
              }}
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
            <RecommendedJobs resumeSkills={resumeSkills} location={location || ''} user={user} onNavigate={onNavigate} />
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
              {/* Trending Job Titles - Dynamic count from real data */}
              {jobs.length > 0 && (() => {
                const titleCounts: Record<string, number> = {};
                jobs.forEach((job: any) => {
                  const title = (job.jobTitle || job.title || '').trim();
                  if (title) titleCounts[title] = (titleCounts[title] || 0) + 1;
                });
                const topTitles = Object.entries(titleCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
                if (topTitles.length === 0) return null;
                return (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-orange-500" />
                      Trending Jobs
                    </h3>
                    <div className="space-y-2">
                      {topTitles.map(([title, count]) => (
                        <div key={title} onClick={() => setSearchTerm(title)} className="flex items-center justify-between cursor-pointer group hover:bg-orange-50 rounded-lg px-3 py-2 transition-colors">
                          <span className="text-sm text-gray-700 group-hover:text-orange-600 font-medium truncate pr-2">{title}</span>
                          <span className="flex-shrink-0 text-xs font-semibold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              <div className="p-6">
                <h4 className="font-medium text-gray-900 mb-3">Department</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {[
                    'Information Technology', 'Software Development', 'Data Science & Analytics',
                    'Sales & Marketing', 'Finance & Accounting', 'Human Resources',
                    'Operations', 'Customer Service', 'Healthcare', 'Engineering',
                    'Education', 'Legal', 'Manufacturing', 'Retail', 'Other'
                  ].map(cat => {
                    const count = jobs.filter(j => (j.jobCategory || j.category) === cat).length;
                    return (
                      <label key={cat} className="flex items-center">
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={filters.department.includes(cat)}
                          onChange={() => handleFilterChange('department', cat)}
                        />
                        <span className="text-sm">{cat} ({count})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              
              {/* Experience */}
              <div className="p-6">
                <h4 className="font-medium text-gray-900 mb-1">Experience (Years)</h4>
                <div className="flex justify-between text-xs text-blue-600 font-semibold mb-3">
                  <span>{expMin} Yrs</span>
                  <span>{expMax >= 30 ? '30+ Yrs' : `${expMax} Yrs`}</span>
                </div>
                <SalaryRangeSlider
                  min={expMin}
                  max={expMax}
                  onChange={(mn, mx) => {
                    setExpMin(mn);
                    setExpMax(mx);
                    setFilteredJobs(jobs.filter(job => {
                      const exp = job.experienceRange || job.experience || '';
                      const nums = exp.match(/\d+/g)?.map(Number) || [];
                      if (!nums.length) return true;
                      const jobMin = Math.min(...nums);
                      const jobMax = nums.length > 1 ? Math.max(...nums) : nums[0];
                      const rMax = mx >= 30 ? Infinity : mx;
                      return jobMin <= rMax && jobMax >= mn;
                    }));
                  }}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>0</span><span>5</span><span>10</span><span>15</span><span>20</span><span>30+</span>
                </div>
                {(expMin > 0 || expMax < 30) && (
                  <button onClick={() => { setExpMin(0); setExpMax(30); applyFilters(filters, jobs); }} className="mt-1 text-xs text-blue-500 hover:underline">Reset</button>
                )}
              </div>

              {/* Salary */}
              <div className="p-6">
                <h4 className="font-medium text-gray-900 mb-1">Salary (LPA)</h4>
                <div className="flex justify-between text-xs text-blue-600 font-semibold mb-3">
                  <span>{salaryMin} LPA</span>
                  <span>{salaryMax >= 50 ? '50+ LPA' : `${salaryMax} LPA`}</span>
                </div>
                <SalaryRangeSlider
                  min={salaryMin}
                  max={salaryMax}
                  onChange={(mn, mx) => {
                    setSalaryMin(mn);
                    setSalaryMax(mx);
                    const rMin = mn * 100000;
                    const rMax = mx >= 50 ? Infinity : mx * 100000;
                    setFilteredJobs(jobs.filter(job => {
                      const s = typeof job.salary === 'object' ? (job.salary?.min || 0) : parseInt((job.salary || '').toString().replace(/[^0-9]/g, '') || '0');
                      const sMax = typeof job.salary === 'object' ? (job.salary?.max || s) : s;
                      if (!s && !sMax) return true;
                      return s <= rMax && sMax >= rMin;
                    }));
                  }}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>0</span><span>10</span><span>20</span><span>30</span><span>40</span><span>50+</span>
                </div>
                {(salaryMin > 0 || salaryMax < 50) && (
                  <button onClick={() => { setSalaryMin(0); setSalaryMax(50); applyFilters(filters, jobs); }} className="mt-1 text-xs text-blue-500 hover:underline">Reset</button>
                )}
              </div>

              {/* Location */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">
                    Location {filters.location.length > 0 && <span className="text-blue-600">({filters.location.length})</span>}
                  </h4>
                  {filters.location.length > 0 && (
                    <button onClick={() => { const u = { ...filters, location: [] }; setFilters(u); applyFilters(u, jobs); }} className="text-xs text-blue-600 hover:underline">Clear</button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Search Location"
                  value={locationSearch}
                  onChange={e => setLocationSearch(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="space-y-1.5">
                  {(() => {
                    const jobLocs = Array.from(new Set(jobs.map(j => (j.location || '').trim()).filter(Boolean))).sort();
                    const filtered = locationSearch
                      ? jobLocs.filter(l => l.toLowerCase().includes(locationSearch.toLowerCase()))
                      : jobLocs;
                    const visible = showAllLocations ? filtered : filtered.slice(0, 6);
                    return (
                      <>
                        {visible.map(loc => {
                          const count = jobs.filter(j => (j.location || '').toLowerCase().includes(loc.toLowerCase())).length;
                          return (
                            <label key={loc} className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                className="w-4 h-4 accent-blue-600"
                                checked={filters.location.includes(loc)}
                                onChange={() => handleFilterChange('location', loc)}
                              />
                              <span className="text-sm text-gray-700 group-hover:text-blue-600 flex-1">{loc}</span>
                              <span className="text-xs text-gray-400">({count})</span>
                            </label>
                          );
                        })}
                        {filtered.length > 6 && !locationSearch && (
                          <button onClick={() => setShowAllLocations(v => !v)} className="text-xs text-blue-600 hover:underline mt-1 font-medium">
                            {showAllLocations ? 'View less' : `View more (${filtered.length - 6}+)`}
                          </button>
                        )}
                        {filtered.length === 0 && <p className="text-xs text-gray-400 italic">No locations found</p>}
                      </>
                    );
                  })()}
                </div>
              </div>
              
              {/* Work Mode */}
              <div className="p-6">
                <h4 className="font-medium text-gray-900 mb-3">Work mode</h4>
                <div className="space-y-2">
                  {['Work from office', 'Hybrid', 'Remote'].map(mode => {
                    const count = jobs.filter(job => {
                      const text = `${job.type || ''} ${job.location || ''} ${job.description || ''} ${job.workMode || ''} ${job.locationType || ''}`.toLowerCase();
                      if (mode === 'Remote') return text.includes('remote');
                      if (mode === 'Hybrid') return text.includes('hybrid');
                      return !text.includes('remote') && !text.includes('hybrid');
                    }).length;
                    return (
                      <label key={mode} className="flex items-center">
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={filters.workMode.includes(mode)}
                          onChange={() => handleFilterChange('workMode', mode)}
                        />
                        <span className="text-sm">{mode} ({count})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              {/* Job Type */}
              <div className="p-6">
                <h4 className="font-medium text-gray-900 mb-3">Job Type</h4>
                <div className="space-y-2">
                  {(() => {
                    const allTypes = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'];
                    const dynamicTypes = Array.from(new Set(
                      jobs.flatMap(j => {
                        const t = j.type || j.jobType;
                        return Array.isArray(t) ? t : t ? [t] : [];
                      }).map((t: string) => t.trim()).filter(Boolean)
                    ));
                    const types = Array.from(new Set([...allTypes, ...dynamicTypes]));
                    return types.map(type => {
                      const count = jobs.filter(j => {
                        const t = j.type || j.jobType;
                        const arr = Array.isArray(t) ? t : t ? [t] : [];
                        return arr.some((v: string) => v.toLowerCase() === type.toLowerCase());
                      }).length;
                      return (
                        <label key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={filters.jobType === type}
                            onChange={() => handleFilterChange('jobType', filters.jobType === type ? '' : type)}
                          />
                          <span className="text-sm">{type} ({count})</span>
                        </label>
                      );
                    });
                  })()}
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
            <div key={getId(job) || job.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-gray-300 transition-all bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start mb-3">
                    <div className="flex-1">
                      {/* Company logo + name row */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center bg-white">
                          <img
                            src={companyLogos[(job.company || '').toLowerCase()] || getSafeCompanyLogo(job)}
                            alt={`${job.company} logo`}
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              const name = job.company || '';
                              const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
                              img.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="#3B82F6" rx="6"/><text x="16" y="21" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">${initials}</text></svg>`)}`;
                            }}
                          />
                        </div>
                        <span className="text-blue-600 font-semibold text-base">{job.company}</span>
                      </div>

                      {/* Job title */}
                      <h3
                        className="text-xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer mb-1"
                        onClick={() => onNavigate && onNavigate('job-detail', { jobTitle: job.title || job.jobTitle, jobId: getId(job), companyName: job.company, jobData: job })}
                      >
                        {decodeHtmlEntities(job.title || job.jobTitle)}
                      </h3>

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
                        {(() => { const t = job.type || job.jobType; const display = Array.isArray(t) ? t.join(', ') : t; return display ? (
                          <div className="flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg">
                            <Briefcase className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-700">{display}</span>
                          </div>
                        ) : null; })()}
                        {job.locationType && (
                          <div className="flex items-center gap-1 bg-cyan-50 px-3 py-1.5 rounded-lg">
                            <span className="text-sm font-medium text-cyan-700">{job.locationType}</span>
                          </div>
                        )}
                        {(job.jobCategory || job.category) && (
                          <div className="flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg">
                            <span className="text-sm font-medium text-indigo-700">{job.jobCategory || job.category}</span>
                          </div>
                        )}
                        {(job.experienceRange || job.experience) && (
                          <div className="flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-lg">
                            <span className="text-sm font-medium text-orange-700">{job.experienceRange || job.experience}</span>
                          </div>
                        )}
                        {job.country && (
                          <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg">
                            <span className="text-sm font-medium text-gray-600">{job.country}</span>
                          </div>
                        )}
                        {(job.language?.length > 0 || job.languages?.length > 0) && (
                          <div className="flex items-center gap-1 bg-teal-50 px-3 py-1.5 rounded-lg">
                            <span className="text-sm font-medium text-teal-700">
                              {(() => {
                                const lang = job.language || job.languages;
                                return Array.isArray(lang) ? lang.join(', ') : lang;
                              })()}
                            </span>
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
                            {decodeHtmlEntities(job.description.replace(/<[^>]+>/g, '')).substring(0, 250)}{job.description.length > 250 ? '...' : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-stretch gap-2 ml-4 min-w-[130px]">
                  {user?.type === 'candidate' && appliedJobIds.has(getId(job)) && (
                    <span className="flex items-center justify-center gap-1 bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-lg text-sm font-medium">
                      ✅ Applied
                    </span>
                  )}
                  {user?.type === 'candidate' && (
                    <button
                      onClick={() => handleSaveJob(job)}
                      className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border transition-colors text-sm font-medium ${
                        savedJobs.includes(getId(job))
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {savedJobs.includes(getId(job)) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      {savedJobs.includes(getId(job)) ? 'Saved' : 'Save'}
                    </button>
                  )}
                  <button
                    onClick={() => onNavigate && onNavigate('job-detail', { jobTitle: job.title || job.jobTitle, jobId: getId(job), companyName: job.company, jobData: job })}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm text-center"
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

      {/* Floating Back Button */}
      <BackButton 
        onClick={() => onNavigate ? onNavigate('home') : window.history.back()}
      />
    </div>
  );
};

export default JobListingsPage;
