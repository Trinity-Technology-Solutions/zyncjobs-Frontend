// Quick filter buttons: Last 48h, This week, Remote Jobs (single-select only) - v2
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, Filter, Briefcase, TrendingUp, X, Bookmark, BookmarkCheck, Clock, Rocket, Trophy, Flame, Sparkles } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import { tokenStorage } from '../utils/tokenStorage';
import { apiFetch } from '../api/apiFetch';
import RecommendedJobs from '../components/RecommendedJobs';
import { aiSuggestions } from '../utils/aiSuggestions';
import { searchAccuracy } from '../utils/searchAccuracy';
import { JobCardSkeleton, SearchLoading } from '../components/LoadingStates';
import { decodeHtmlEntities, formatDate, formatSalary, getPostingFreshness } from '../utils/textUtils';
import { formatJobDescription } from '../utils/htmlUtils';

import CompanyLogo from '../components/CompanyLogo';
import { API_ENDPOINTS } from '../config/env';
import localStorageMigration from '../services/localStorageMigration';
import SalaryRangeSlider from '../components/SalaryRangeSlider';
import ResumeStatusIndicator from '../components/ResumeStatusIndicator';
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
  const [radius, setRadius] = useState(25); // km
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
    freshness: [] as string[]
  });
  const [jobTitleDropdown, setJobTitleDropdown] = useState<string[]>([]);
  const [jobSuggestions, setJobSuggestions] = useState<{keywords: string[], jobTitles: string[], companies: string[]}>({keywords: [], jobTitles: [], companies: []});
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
  const [alertDismissed, setAlertDismissed] = useState(false);
  const jobsPerPage = 10;

  const isFiltered = filters.department.length > 0 || filters.workMode.length > 0 || filters.location.length > 0 ||
    filters.industry.length > 0 || filters.jobType || filters.freshness.length > 0 || expMin > 0 || expMax < 30 || salaryMin > 0 || salaryMax < 50;

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
      // Also load from localStorage for immediate display
      const userData = (() => { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}'); } catch { return {}; } })();
      const userKey = userData?.email || user.name || 'guest';
      const localKey = `savedJobs_${userKey}`;
      const saved = localStorage.getItem(localKey);
      if (saved) setSavedJobs(JSON.parse(saved));
    } else {
      const userData = (() => { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}'); } catch { return {}; } })();
      const userKey = userData?.email || 'guest';
      const localKey = `savedJobs_${userKey}`;
      const saved = localStorage.getItem(localKey);
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
    const userData = (() => { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}'); } catch { return {}; } })();
    const userKey = userData?.email || user?.name || 'user';
    const localKey = `savedJobs_${userKey}`;

    // Always load localStorage first so UI is instant
    const localSaved = localStorage.getItem(localKey);
    if (localSaved) {
      try { setSavedJobs(JSON.parse(localSaved)); } catch {}
    }

    const token = tokenStorage.getAccess();
    if (!token) return;

    try {
      const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/saved-jobs`);
      if (!res.ok) return; // keep localStorage data on any backend failure
      const data = await res.json();
      // Support both { jobIds: [...] } and flat array responses
      const jobIds: string[] = Array.isArray(data) ? data : (data.jobIds || data.ids || []);
      if (jobIds.length === 0) return; // backend returned empty — trust localStorage
      setSavedJobs(jobIds);
      localStorage.setItem(localKey, JSON.stringify(jobIds));
    } catch {
      // network error — localStorage already applied above, do nothing
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
      // Search only on job title
      const jobTitle = (job.title || job.jobTitle || '').toLowerCase();
      const matchTerm = !term || jobTitle.includes(term.toLowerCase());

      // Location filter only
      const matchLoc = !loc ||
        (job.location || '').toLowerCase().includes(loc.toLowerCase()) ||
        (job.country || '').toLowerCase().includes(loc.toLowerCase());

      return matchTerm && matchLoc;
    });
  }, []);

  // Fetch jobs from MongoDB with advanced search
  const fetchJobs = useCallback(async (page = 1, append = false, overrideSearch?: { term?: string; loc?: string; freshness?: string[] }) => {
    if (!append) setLoading(true);
    const activeTerm = overrideSearch?.term !== undefined ? overrideSearch.term : searchTerm;
    const activeLoc = overrideSearch?.loc !== undefined ? overrideSearch.loc : location;
    const activeFreshness = overrideSearch?.freshness !== undefined ? overrideSearch.freshness : filters.freshness;
    try {
      let url = API_ENDPOINTS.JOBS;

      if (activeTerm || activeLoc || filters.industry.length > 0 || filters.companySize.length > 0 || categoryTerms.length > 0) {
        const searchQuery = categoryTerms.length > 0 ? categoryTerms.join(' OR ') : activeTerm;
        const searchParams = {
          query: searchQuery,
          location: activeLoc,
          jobType: filters.jobType ? [filters.jobType] : [],
          industry: filters.industry,
          companySize: filters.companySize,
          freshness: activeFreshness,
          page,
          limit: jobsPerPage
        };

        const response = await apiFetch(`${API_ENDPOINTS.BASE_URL}/search/advanced`, {
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
            setTotalPages(data.totalPages || Math.ceil((data.total || jobsArray.length) / jobsPerPage) || 1);
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
            const allRes = await apiFetch(`${API_ENDPOINTS.JOBS}?limit=200`);
            if (allRes.ok) {
              const allData = await allRes.json();
              const allArr = Array.isArray(allData) ? allData : (allData.jobs || []);
              setJobs(allArr);
              setFilteredJobs(clientFilter(allArr, activeTerm, activeLoc));
            }
          }
        }
      } else {
        url = `${API_ENDPOINTS.JOBS}?limit=500`;
        const response = await apiFetch(url);
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const jobsData = await response.json();
            const jobsArray = Array.isArray(jobsData) ? jobsData : (Array.isArray(jobsData?.jobs) ? jobsData.jobs : []);
            const sortedJobs = jobsArray.sort((a: any, b: any) => {
              const aTime = Math.max(new Date(a.lastRefreshedAt || 0).getTime(), new Date(a.createdAt).getTime());
              const bTime = Math.max(new Date(b.lastRefreshedAt || 0).getTime(), new Date(b.createdAt).getTime());
              return bTime - aTime;
            });
            if (append) {
              setJobs(prev => [...prev, ...sortedJobs]);
              setFilteredJobs(prev => [...prev, ...sortedJobs]);
            } else {
              setJobs(sortedJobs);
              setFilteredJobs(sortedJobs);
            }
            setHasMoreJobs(false);
            setTotalPages(Math.ceil(sortedJobs.length / jobsPerPage) || 1);
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
      const response = await apiFetch(`${API_ENDPOINTS.BASE_URL}/search/filters`);
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
      const response = await apiFetch(`${API_ENDPOINTS.BASE_URL}/search/trending?limit=5`);
      if (response.ok) {
        const data = await response.json();
        setTrending(data);
      }
    } catch (error) {
      // Silently fail - trending endpoint not critical
    }
  };

  // Reactive filter: runs whenever filters, jobs, sliders, or search term changes
  useEffect(() => {
    if (jobs.length === 0) return;
    let filtered = clientFilter(jobs, searchTerm, location);

    if (filters.department.length > 0) {
      filtered = filtered.filter(job =>
        filters.department.includes(job.jobCategory || job.category || '')
      );
    }
    if (expMin > 0 || expMax < 30) {
      filtered = filtered.filter(job => {
        const exp = job.experienceRange || job.experience || '';
        const nums = exp.match(/\d+/g)?.map(Number) || [];
        if (!nums.length) return true;
        const jobMin = Math.min(...nums);
        const jobMax = nums.length > 1 ? Math.max(...nums) : nums[0];
        return jobMin <= (expMax >= 30 ? Infinity : expMax) && jobMax >= expMin;
      });
    }
    if (salaryMin > 0 || salaryMax < 50) {
      const rMin = salaryMin * 100000;
      const rMax = salaryMax >= 50 ? Infinity : salaryMax * 100000;
      filtered = filtered.filter(job => {
        const s = typeof job.salary === 'object' ? (job.salary?.min || 0) : parseInt((job.salary || '').toString().replace(/[^0-9]/g, '') || '0');
        const sMaxVal = typeof job.salary === 'object' ? (job.salary?.max || s) : s;
        if (!s && !sMaxVal) return true;
        return s <= rMax && sMaxVal >= rMin;
      });
    }
    if (filters.workMode.length > 0) {
      filtered = filtered.filter(job => {
        const lt = (job.locationType || '').toLowerCase();
        const loc = (job.location || '').toLowerCase();
        const desc = (job.description || '').toLowerCase();
        const title = (job.title || job.jobTitle || '').toLowerCase();
        
        return filters.workMode.some(mode => {
          if (mode === 'Remote') {
            return lt.includes('remote') || loc.includes('remote') || desc.includes('remote') || 
                   title.includes('remote') || lt.includes('work from home') || 
                   loc.includes('work from home') || loc === 'remote' || lt === 'remote';
          }
          if (mode === 'Hybrid') return lt.includes('hybrid') || loc.includes('hybrid') || desc.includes('hybrid');
          if (mode === 'Work from office') {
            return (lt === 'in person' || lt === 'onsite') || 
                   (!lt.includes('remote') && !lt.includes('hybrid') && 
                    !loc.includes('remote') && !loc.includes('hybrid') &&
                    !desc.includes('remote') && !desc.includes('hybrid'));
          }
          return false;
        });
      });
    }
    if (filters.location.length > 0) {
      filtered = filtered.filter(job =>
        filters.location.some(loc => (job.location || '').toLowerCase().includes(loc.toLowerCase()))
      );
    }
    if (filters.industry.length > 0) {
      filtered = filtered.filter(job => {
        const jobText = `${job.title || ''} ${job.description || ''} ${job.industry || ''}`.toLowerCase();
        return filters.industry.some(ind => jobText.includes(ind.toLowerCase()));
      });
    }
    if (filters.jobType) {
      filtered = filtered.filter(job => {
        const t = job.type || job.jobType;
        const arr = Array.isArray(t) ? t : t ? [t] : [];
        return arr.some((v: string) => v.toLowerCase() === filters.jobType.toLowerCase());
      });
    }
    if (filters.freshness.length > 0) {
      const now = Date.now();
      filtered = filtered.filter(job => {
        const raw = job.createdAt || job.postedAt || job.datePosted;
        if (!raw) return false;
        const t = new Date(raw).getTime();
        if (isNaN(t) || t <= 0) return false;
        const daysDiff = (now - t) / (1000 * 60 * 60 * 24);
        return filters.freshness.some(freshness => {
          if (freshness === '48h') return daysDiff <= 2;
          if (freshness === '7d') return daysDiff <= 7;
          return false;
        });
      });
    }
    filtered.sort((a: any, b: any) => {
      const aTime = Math.max(new Date(a.lastRefreshedAt || 0).getTime(), new Date(a.createdAt).getTime());
      const bTime = Math.max(new Date(b.lastRefreshedAt || 0).getTime(), new Date(b.createdAt).getTime());
      return bTime - aTime;
    });
    setFilteredJobs(filtered);
    setCurrentPage(1);
    setTotalPages(Math.ceil(filtered.length / jobsPerPage) || 1);
  }, [filters, jobs, searchTerm, location, expMin, expMax, salaryMin, salaryMax]);

  // Keep applyFilters as a no-op shim so existing call sites don't break
  const applyFilters = useCallback((_f: any, _j: any, _eMin?: any, _eMax?: any, _sMin?: any, _sMax?: any) => {}, []);

  const handleQuickFilterToggle = (key: string, filterType: string, value: string) => {
    handleQuickFilter(key, filterType, value);
  };

  const fetchStats = async () => {
    try {
      const jobsRes = await apiFetch(API_ENDPOINTS.JOBS);
      if (jobsRes.ok) {
        const allJobs = await jobsRes.json();
        const uniqueCompanies = new Set(allJobs.map((j: any) => j.company).filter(Boolean));
        setStatsCompanies(uniqueCompanies.size);
      }
    } catch {}
    try {
      const usersRes = await apiFetch(`${API_ENDPOINTS.BASE_URL}/users/stats/counts`);
      if (usersRes.ok) {
        const data = await usersRes.json();
        setStatsJobSeekers(data.candidates || 0);
      }
    } catch {}
  };

  const fetchCompanyLogos = async (jobList: any[]) => {
    try {
      const res = await apiFetch(API_ENDPOINTS.COMPANIES);
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
      fetchJobs(1, false, { term: q, loc, freshness: filters.freshness });
    }
  }, [searchParams.get('q'), searchParams.get('location')]);
  
  useEffect(() => {
    if (jobs.length > 0) {
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
  
  // Single active quick filter: '24h' | '7d' | 'remote' | null
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);

  const handleFilterChange = (filterType: string, value: string) => {
    const arrayFilters = ['department', 'location', 'workMode', 'industry', 'companySize', 'freshness'];
    setFilters(prev => {
      if (arrayFilters.includes(filterType)) {
        const arr = prev[filterType as keyof typeof prev] as string[];
        return { ...prev, [filterType]: arr.includes(value) ? arr.filter(i => i !== value) : [...arr, value] };
      }
      return { ...prev, [filterType]: value };
    });
  };

  // Strictly single-select: clicking active button deselects, clicking another replaces
  const handleQuickFilter = (key: string, filterType: string, value: string) => {
    if (activeQuickFilter === key) {
      // deselect
      setActiveQuickFilter(null);
      setFilters(prev => ({ ...prev, freshness: [], workMode: [] }));
    } else {
      // select only this one — clear ALL quick-filter related state first
      setActiveQuickFilter(key);
      // For freshness filters, ensure we have all jobs loaded first
      if (filterType === 'freshness' && jobs.length === 0) {
        fetch(`${API_ENDPOINTS.BASE_URL}/jobs?limit=500`)
          .then(r => r.json())
          .then(data => {
            const arr = Array.isArray(data) ? data : (data.jobs || []);
            setJobs(arr);
          })
          .catch(() => {});
      }
      setFilters(prev => ({
        ...prev,
        freshness: filterType === 'freshness' ? [value] : [],
        workMode: filterType === 'workMode' ? [value] : [],
      }));
    }
  };

  const getJobSuggestions = async (input: string): Promise<{keywords: string[], jobTitles: string[], companies: string[]}> => {
    if (input.length < 2) return {keywords: [], jobTitles: [], companies: []};
    
    // Get all available data
    const allJobTitles: string[] = [];
    const allCompanies: string[] = [];
    const allSkills: string[] = [];
    
    // Extract from backend API
    try {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const res = await apiFetch(`${apiBase}/jobs/titles`);
      if (res.ok) {
        const data = await res.json();
        const backendTitles: string[] = data.job_titles || [];
        allJobTitles.push(...backendTitles);
      }
    } catch (error) {
      console.log('Backend job titles not available');
    }
    
    // Extract from current jobs data with enhanced accuracy
    jobs.forEach(job => {
      if (job.company) allCompanies.push(job.company);
      if (job.title || job.jobTitle) allJobTitles.push(job.title || job.jobTitle);
      if (Array.isArray(job.skills)) {
        allSkills.push(...job.skills);
      }
      if (job.jobCategory) allSkills.push(job.jobCategory);
      if (job.category) allSkills.push(job.category);
    });
    
    // Remove duplicates
    const uniqueJobTitles = [...new Set(allJobTitles)];
    const uniqueCompanies = [...new Set(allCompanies)];
    const uniqueSkills = [...new Set(allSkills)];
    
    // Use enhanced search accuracy engine
    return searchAccuracy.getCategorizedSuggestions(
      input,
      uniqueJobTitles,
      uniqueCompanies,
      uniqueSkills
    );
  };

  // Enhanced search function — title + location only
  const performEnhancedSearch = useCallback(async (searchQuery: string, locationQuery: string) => {
    if (!searchQuery && !locationQuery) {
      fetchJobs(1, false, { term: '', loc: '', freshness: filters.freshness });
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch(`${API_ENDPOINTS.BASE_URL}/search/advanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          location: locationQuery,
          jobType: filters.jobType ? [filters.jobType] : [],
          industry: filters.industry,
          companySize: filters.companySize,
          freshness: filters.freshness,
          page: 1,
          limit: 200
        })
      });

      if (response.ok) {
        const data = await response.json();
        let jobsArray = Array.isArray(data.jobs) ? data.jobs : (Array.isArray(data) ? data : []);

        // Re-filter client-side: title + location only
        const filtered = clientFilter(jobsArray.length > 0 ? jobsArray : jobs, searchQuery, locationQuery);
        setJobs(jobsArray.length > 0 ? jobsArray : jobs);
        setFilteredJobs(filtered);
        setCurrentPage(1);
        setTotalPages(Math.ceil(filtered.length / jobsPerPage) || 1);
      } else {
        const filtered = clientFilter(jobs, searchQuery, locationQuery);
        setFilteredJobs(filtered);
        setCurrentPage(1);
        setTotalPages(Math.ceil(filtered.length / jobsPerPage) || 1);
      }
    } catch (error) {
      console.error('Search error:', error);
      const filtered = clientFilter(jobs, searchQuery, locationQuery);
      setFilteredJobs(filtered);
      setCurrentPage(1);
      setTotalPages(Math.ceil(filtered.length / jobsPerPage) || 1);
    } finally {
      setLoading(false);
    }
  }, [filters, jobs, clientFilter]);
  
  const generateKeywordSuggestions = (input: string): string[] => {
    const keywordPatterns = {
      'so': ['Software', 'Solutions', 'Social Media', 'Software Engineer'],
      'react': ['React', 'React.js', 'React Native', 'Redux'],
      'python': ['Python', 'Django', 'Flask', 'FastAPI'],
      'java': ['Java', 'Spring Boot', 'Hibernate', 'Maven'],
      'node': ['Node.js', 'Express.js', 'npm', 'JavaScript'],
      'data': ['Data Analysis', 'Data Science', 'Big Data', 'Analytics'],
      'ai': ['Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'Neural Networks'],
      'cloud': ['AWS', 'Azure', 'Google Cloud', 'Cloud Computing'],
      'mobile': ['iOS', 'Android', 'React Native', 'Flutter'],
      'web': ['HTML', 'CSS', 'JavaScript', 'Web Development'],
      'database': ['SQL', 'MongoDB', 'PostgreSQL', 'MySQL']
    };
    
    // First check for exact prefix matches
    for (const [key, suggestions] of Object.entries(keywordPatterns)) {
      if (key.startsWith(input.toLowerCase())) {
        return suggestions;
      }
    }
    
    // Then check for contains matches
    for (const [key, suggestions] of Object.entries(keywordPatterns)) {
      if (input.toLowerCase().includes(key) || key.includes(input.toLowerCase())) {
        return suggestions;
      }
    }
    
    return [];
  };
  
  const generateJobTitleSuggestions = (input: string): string[] => {
    const titlePatterns = {
      'so': ['Software Engineer', 'Software Developer', 'Solutions Architect', 'Social Media Manager'],
      'develop': ['Software Developer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer'],
      'engineer': ['Software Engineer', 'DevOps Engineer', 'Data Engineer', 'Cloud Engineer'],
      'manager': ['Product Manager', 'Engineering Manager', 'Project Manager', 'Technical Manager'],
      'analyst': ['Business Analyst', 'Data Analyst', 'Systems Analyst', 'Financial Analyst'],
      'designer': ['UI/UX Designer', 'Product Designer', 'Graphic Designer', 'Web Designer'],
      'scientist': ['Data Scientist', 'Research Scientist', 'Machine Learning Scientist'],
      'architect': ['Software Architect', 'Solutions Architect', 'Cloud Architect', 'System Architect']
    };
    
    // First check for exact prefix matches
    for (const [key, suggestions] of Object.entries(titlePatterns)) {
      if (key.startsWith(input.toLowerCase())) {
        return suggestions;
      }
    }
    
    // Then check for contains matches
    for (const [key, suggestions] of Object.entries(titlePatterns)) {
      if (input.toLowerCase().includes(key) || key.includes(input.toLowerCase())) {
        return suggestions;
      }
    }
    
    return [];
  };

  const getLocationSuggestions = async (input: string): Promise<string[]> => {
    if (input.length < 2) return [];
    
    // Get all available locations
    const allLocations: string[] = [];
    
    // From backend API
    try {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const res = await apiFetch(`${apiBase}/locations`);
      if (res.ok) {
        const data = await res.json();
        const locations: string[] = data.locations || [];
        allLocations.push(...locations);
      }
    } catch (error) {
      console.log('Backend locations not available');
    }
    
    // From current jobs data
    jobs.forEach(job => {
      if (job.location) allLocations.push(job.location);
      if (job.country) allLocations.push(job.country);
    });
    
    // Add common locations as fallback
    const commonLocations = [
      'Remote', 'Work from Home', 'Hybrid',
      'Chennai', 'Bangalore', 'Hyderabad', 'Mumbai', 'Delhi', 'Pune',
      'New York', 'California', 'Texas', 'London', 'Singapore'
    ];
    allLocations.push(...commonLocations);
    
    // Remove duplicates and use enhanced matching
    const uniqueLocations = [...new Set(allLocations)];
    return searchAccuracy.getLocationMatches(input, uniqueLocations);
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
      setJobSuggestions({keywords: [], jobTitles: [], companies: []});
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

  const geocodeLocationText = async (locationText: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/search/geocode?q=${encodeURIComponent(locationText)}`);
      const data = await res.json();
      if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch {}
    return null;
  };

  const handleSearch = async () => {
    // Use enhanced search for better accuracy
    await performEnhancedSearch(searchTerm, location);
  };

  const selectJobSuggestion = (suggestion: string, type: 'keyword' | 'jobTitle' | 'company') => {
    setSearchTerm(suggestion);
    setShowJobSuggestions(false);
    // Trigger search immediately
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  const selectLocationSuggestion = (suggestion: string) => {
    setLocation(suggestion);
    setShowLocationSuggestions(false);
  };

  const handleLocationSearch = async (params: { latitude: number; longitude: number; radius: number; query?: string }) => {
    setLoading(true);
    try {
      const response = await apiFetch(`${API_ENDPOINTS.BASE_URL}/search/radius`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: params.latitude,
          longitude: params.longitude,
          radius: params.radius,
          query: params.query || '',
          page: 1,
          limit: 100
        })
      });
      if (response.ok) {
        const data = await response.json();
        const jobsArray = Array.isArray(data.jobs) ? data.jobs : [];
        setJobs(jobsArray);
        setFilteredJobs(jobsArray);
        setCurrentPage(1);
        setTotalPages(Math.ceil(jobsArray.length / jobsPerPage) || 1);
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
    if (!jobId) return;
    const isAlreadySaved = savedJobs.includes(jobId);
    // Optimistic UI update
    setSavedJobs(prev => isAlreadySaved ? prev.filter(id => id !== jobId) : [...prev, jobId]);

    // Get user email from localStorage user object
    const userData = (() => { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}'); } catch { return {}; } })();
    const userKey = userData?.email || user.name || 'user';
    
    // Always sync localStorage so MyJobsPage can read saved job details
    const idsKey = `savedJobs_${userKey}`;
    const detailsKey = `savedJobDetails_${userKey}`;
    const savedIds: string[] = (() => { try { return JSON.parse(localStorage.getItem(idsKey) || '[]'); } catch { return []; } })();
    const savedDetails: any[] = (() => { try { return JSON.parse(localStorage.getItem(detailsKey) || '[]'); } catch { return []; } })();
    if (isAlreadySaved) {
      localStorage.setItem(idsKey, JSON.stringify(savedIds.filter(id => id !== jobId)));
      localStorage.setItem(detailsKey, JSON.stringify(savedDetails.filter((j: any) => getId(j) !== jobId)));
    } else {
      localStorage.setItem(idsKey, JSON.stringify([...savedIds, jobId]));
      localStorage.setItem(detailsKey, JSON.stringify([...savedDetails, job]));
    }
    
    // Dispatch event to notify MyJobsPage
    window.dispatchEvent(new CustomEvent('zync:savedJobsUpdated', { detail: { jobId, action: isAlreadySaved ? 'removed' : 'added' } }));

    try {
      const token = tokenStorage.getAccess();
      if (token) {
        if (isAlreadySaved) {
          await apiFetch(`${API_ENDPOINTS.BASE_URL}/saved-jobs/${jobId}`, {
            method: 'DELETE',
          });
        } else {
          await apiFetch(`${API_ENDPOINTS.BASE_URL}/saved-jobs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
      }
    } catch (error) {
      // Revert optimistic update on error
      setSavedJobs(prev => isAlreadySaved ? [...prev, jobId] : prev.filter(id => id !== jobId));
      console.error('Error saving job:', error);
    }
  };

  const formatJobDescription_simple = (desc: string, maxLen: number) => {
    if (!desc) return '';
    const plain = desc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return plain.length > maxLen ? plain.substring(0, maxLen) + '...' : plain;
  };

  const [totalPages, setTotalPages] = useState(1);
  const jobResultsRef = React.useRef<HTMLDivElement>(null);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    setTimeout(() => {
      jobResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      {/* Search Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg overflow-visible">
        {/* Back Button */}
        <BackButton
          onClick={() => onNavigate ? onNavigate('home') : window.history.back()}
          position="top-left"
          className="bg-white/80 hover:bg-white text-gray-700 border-gray-300 shadow-md"
        />
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
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header Content */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center items-center mb-4">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
              </div>
            </div>
            
          <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-white mb-3 drop-shadow-lg flex items-center justify-center gap-2 sm:gap-3 flex-wrap text-center">
              Discover Your Dream Job
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />
            </h1>
            <p className="text-sm sm:text-lg text-white/90 mb-4 sm:mb-6 max-w-2xl mx-auto drop-shadow flex items-center justify-center gap-2 text-center px-4">
              {selectedCategory 
                ? `Explore ${selectedCategory.toLowerCase()} opportunities from leading companies` 
                : (
                  <>
                    AI-powered job matching connects you with the right opportunities faster
                    <Rocket className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  </>
                )
              }
            </p>
            
            {/* Quick Stats */}
            <div className="hidden sm:flex justify-center items-center gap-4 sm:gap-8 mb-4 sm:mb-6">
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-white flex items-center justify-center gap-2">
                  <Rocket className="w-4 h-4 sm:w-6 sm:h-6" />
                  Live
                </div>
                <div className="text-white/80 text-xs sm:text-sm">Opportunities</div>
              </div>
              <div className="w-px h-6 sm:h-8 bg-white/30"></div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-white flex items-center justify-center gap-2">
                  <Trophy className="w-4 h-4 sm:w-6 sm:h-6" />
                  Top
                </div>
                <div className="text-white/80 text-xs sm:text-sm">Companies</div>
              </div>
              <div className="w-px h-6 sm:h-8 bg-white/30"></div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-white flex items-center justify-center gap-2">
                  <Flame className="w-4 h-4 sm:w-6 sm:h-6" />
                  Active
                </div>
                <div className="text-white/80 text-xs sm:text-sm">Hiring</div>
              </div>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex justify-center space-x-1 mb-6 flex-wrap gap-2">
            <button 
              onClick={() => setActiveTab('search')}
              className={`px-6 py-3 rounded-full font-semibold flex items-center space-x-2 transition-all ${
                activeTab === 'search' 
                  ? 'bg-white text-gray-900 shadow-lg' 
                  : 'text-white bg-white/20 hover:bg-white/30 border border-white/40'
              }`}
              aria-pressed={activeTab === 'search'}
            >
              <Search className="w-4 h-4" />
              <span>Search Jobs</span>
            </button>
            <button 
              onClick={() => setActiveTab('recommended')}
              className={`px-6 py-3 rounded-full font-semibold flex items-center space-x-2 transition-all ${
                activeTab === 'recommended' 
                  ? 'bg-white text-gray-900 shadow-lg' 
                  : 'text-white bg-white/20 hover:bg-white/30 border border-white/40'
              }`}
              aria-pressed={activeTab === 'recommended'}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Recommended Jobs</span>
            </button>
          </div>

          {/* Search Bar - Only show in search tab */}
          {activeTab === 'search' && (
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {/* Job Title with backend /jobs/titles dropdown */}
              <div className="flex-1 relative">
                <label htmlFor="job-search-input" className="sr-only">Job title</label>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                <input
                  id="job-search-input"
                  type="text"
                  autoComplete="off"
                  placeholder="Job title"
                  value={searchTerm}
                  onChange={async e => {
                    const val = e.target.value;
                    setSearchTerm(val);
                    const fromJobs = [...new Set(
                      jobs.map((j: any) => (j.title || j.jobTitle || '').trim()).filter(Boolean)
                    )] as string[];
                    if (!val.trim()) { setJobTitleDropdown(fromJobs.slice(0, 8)); return; }
                    const q = val.toLowerCase();
                    try {
                      const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/jobs/titles`);
                      if (res.ok) {
                        const d = await res.json();
                        const backendTitles: string[] = d.job_titles || d.titles || (Array.isArray(d) ? d : []);
                        const merged = [...new Set([...backendTitles, ...fromJobs])] as string[];
                        setJobTitleDropdown(merged.filter(t => t.toLowerCase().includes(q)).slice(0, 10));
                      } else {
                        setJobTitleDropdown(fromJobs.filter(t => t.toLowerCase().includes(q)).slice(0, 10));
                      }
                    } catch {
                      setJobTitleDropdown(fromJobs.filter(t => t.toLowerCase().includes(q)).slice(0, 10));
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { setJobTitleDropdown([]); handleSearch(); }
                    if (e.key === 'Escape') setJobTitleDropdown([]);
                  }}
                  onBlur={() => setTimeout(() => setJobTitleDropdown([]), 150)}
                  onFocus={() => {
                    const fromJobs = [...new Set(
                      jobs.map((j: any) => (j.title || j.jobTitle || '').trim()).filter(Boolean)
                    )] as string[];
                    if (!searchTerm.trim()) {
                      setJobTitleDropdown(fromJobs.slice(0, 8));
                    } else {
                      const q = searchTerm.toLowerCase();
                      setJobTitleDropdown(fromJobs.filter(t => t.toLowerCase().includes(q)).slice(0, 10));
                    }
                  }}
                  className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                />
                {jobTitleDropdown.length > 0 && (
                  <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {jobTitleDropdown.map((title, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          onMouseDown={() => {
                            setSearchTerm(title);
                            setJobTitleDropdown([]);
                            setTimeout(() => handleSearch(), 80);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-800 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                        >
                          <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/* Location */}
              <div className="flex-1 relative">
                <label htmlFor="location-search-input" className="sr-only">Location</label>
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="location-search-input"
                  type="text"
                  placeholder="Location (e.g. Chennai, Remote)"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                />
              </div>
            <div className="flex gap-2">
              <label htmlFor="radius-select" className="sr-only">Search radius in kilometres</label>
              <select
                id="radius-select"
                value={radius}
                onChange={(e) => {
                  const newRadius = Number(e.target.value);
                  setRadius(newRadius);
                  if (location) {
                    geocodeLocationText(location).then(coords => {
                      if (coords) {
                        handleLocationSearch({ latitude: coords.lat, longitude: coords.lng, radius: newRadius, query: searchTerm });
                      }
                    });
                  }
                }}
                className="bg-white text-gray-700 px-3 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-medium"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
                <option value={200}>200 km</option>
              </select>
              <button 
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex-shrink-0" 
                title="Search jobs"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
          )}

          {/* Quick Filters - Only show in search tab */}
          {activeTab === 'search' && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedCategory && (
              <div className="flex items-center gap-2 bg-blue-100 border border-blue-300 text-blue-700 px-3 py-1 rounded-full text-sm">
                <span>Category: {selectedCategory}</span>
                <button 
                  onClick={() => {
                    setSelectedCategory('');
                    setCategoryTerms([]);
                    setSearchTerm('');
                    fetchJobs(1, false, { term: '', loc: location, freshness: filters.freshness });
                  }}
                  className="ml-1 hover:bg-blue-200 rounded-full p-1"
                  title="Clear category filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <button
              onClick={() => handleQuickFilter('48h', 'freshness', '48h')}
              className={`px-3 py-1 rounded-full text-sm border font-medium ${
                activeQuickFilter === '48h'
                  ? 'bg-blue-100 border-blue-400 text-blue-800'
                  : 'bg-white border-gray-400 text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-3 h-3 inline mr-1" />
              Last 48 hours
            </button>
            <button
              onClick={() => handleQuickFilter('7d', 'freshness', '7d')}
              className={`px-3 py-1 rounded-full text-sm border font-medium ${
                activeQuickFilter === '7d'
                  ? 'bg-blue-100 border-blue-400 text-blue-800'
                  : 'bg-white border-gray-400 text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-3 h-3 inline mr-1" />
              This week
            </button>
            <button
              onClick={() => handleQuickFilter('remote', 'workMode', 'Remote')}
              className={`px-3 py-1 rounded-full text-sm border font-medium ${
                activeQuickFilter === 'remote'
                  ? 'bg-blue-100 border-blue-400 text-blue-800 shadow-sm'
                  : 'bg-white border-gray-400 text-gray-800 hover:bg-gray-50 hover:border-gray-500'
              }`}
            >
              <MapPin className="w-3 h-3 inline mr-1" />
              Remote Jobs
            </button>
          </div>
          )}

        </div>
      </div>

      {/* Job Listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Job Alert Banner — shown to non-logged-in users */}
        {!user && !alertDismissed && activeTab === 'search' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-5 py-4 mb-4 gap-3">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Receive personalized job alerts!</p>
                <p className="text-gray-500 text-xs mt-0.5">Get our best jobs and opportunities, personalized to your profile and delivered fresh to your inbox.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => onNavigate && onNavigate('login')}
                className="flex items-center gap-1.5 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
              >
                <span className="flex items-center gap-1">
                  Let's go!
                  <Rocket className="w-4 h-4" />
                </span>
              </button>
              <button onClick={() => setAlertDismissed(true)} className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm">
                Dismiss <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Resume Status Indicator for logged-in candidates */}
        {user?.type === 'candidate' && activeTab === 'search' && (
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ResumeStatusIndicator 
                  user={user} 
                  onUploadClick={() => onNavigate && onNavigate('dashboard')}
                  showText={true}
                />
              </div>
              <div className="text-sm text-gray-500">
                Resume status affects your ability to apply for jobs
              </div>
            </div>
          </div>
        )}

        
        {activeTab === 'recommended' ? (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended Jobs for You</h2>
            <RecommendedJobs resumeSkills={resumeSkills} location={location || ''} user={user} onNavigate={onNavigate} />
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden flex items-center justify-between mb-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
              {isFiltered && <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">!</span>}
            </button>
          </div>

          {/* Mobile Filter Panel */}
          {showFilters && (
            <div className="lg:hidden bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <button onClick={() => setShowFilters(false)} title="Close filters"><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                  <select value={filters.jobType} onChange={(e) => handleFilterChange('jobType', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">All Types</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Mode</label>
                  <div className="flex flex-wrap gap-2">
                    {['Remote','Hybrid','Work from office'].map(mode => (
                      <label key={mode} className="flex items-center gap-1 text-sm">
                        <input 
                          type="radio" 
                          name="workModeMobile"
                          checked={filters.workMode.includes(mode)} 
                          onChange={() => {
                            const key = mode === 'Remote' ? 'remote' : mode === 'Hybrid' ? 'hybrid' : 'office';
                            handleQuickFilter(key, 'workMode', mode);
                          }} 
                        />
                        {mode}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              {isFiltered && (
                <button onClick={() => { setActiveQuickFilter(null); setFilters({ jobType: '', salaryRange: '', experience: '', department: [], location: [], workMode: [], industry: [], companySize: [], freshness: [] }); setSalaryMin(0); setSalaryMax(50); setExpMin(0); setExpMax(30); }} className="mt-3 text-sm text-red-500 hover:underline">Clear all filters</button>
              )}
            </div>
          )}

          {/* Left Sidebar - Filters (desktop only) */}
          <div className="hidden lg:block lg:col-span-1">
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
                  onChange={(mn, mx) => { setExpMin(mn); setExpMax(mx); }}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>0</span><span>5</span><span>10</span><span>15</span><span>20</span><span>30+</span>
                </div>
                {(expMin > 0 || expMax < 30) && (
                  <button onClick={() => { setExpMin(0); setExpMax(30); }} className="mt-1 text-xs text-blue-500 hover:underline">Reset</button>
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
                  onChange={(mn, mx) => { setSalaryMin(mn); setSalaryMax(mx); }}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>0</span><span>10</span><span>20</span><span>30</span><span>40</span><span>50+</span>
                </div>
                {(salaryMin > 0 || salaryMax < 50) && (
                  <button onClick={() => { setSalaryMin(0); setSalaryMax(50); }} className="mt-1 text-xs text-blue-500 hover:underline">Reset</button>
                )}
              </div>

              {/* Location */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">
                    Location {filters.location.length > 0 && <span className="text-blue-600">({filters.location.length})</span>}
                  </h4>
                  {filters.location.length > 0 && (
                    <button onClick={() => { const u = { ...filters, location: [] }; setFilters(u); }} className="text-xs text-blue-600 hover:underline">Clear</button>
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
                      const lt = (job.locationType || '').toLowerCase();
                      const loc = (job.location || '').toLowerCase();
                      if (mode === 'Remote') return lt === 'remote' || loc === 'remote';
                      if (mode === 'Hybrid') return lt === 'hybrid' || loc === 'hybrid';
                      return lt === 'in person' || (lt !== 'remote' && lt !== 'hybrid' && loc !== 'remote');
                    }).length;
                    const modeKey = mode === 'Remote' ? 'remote' : mode === 'Hybrid' ? 'hybrid' : 'office';
                    const isActive = filters.workMode.includes(mode);
                    return (
                      <label key={mode} className="flex items-center cursor-pointer" onClick={() => handleQuickFilterToggle(modeKey, 'workMode', mode)}>
                        <input
                          type="radio"
                          name="workMode"
                          className="mr-2"
                          checked={isActive}
                          onChange={() => {}}
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
          <div className="col-span-1 lg:col-span-3" ref={jobResultsRef}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-gray-600 text-sm">
                {loading ? 'Searching...' : (
                  `${filteredJobs.length} results` +
                  (filteredJobs.length > 0 ? ` (${Math.floor(filteredJobs.length * 0.6)} new)` : '')
                )}
              </p>
              
              {isFiltered ? (
                <button
                  onClick={() => {
                    setActiveQuickFilter(null);
                    setFilters({ jobType: '', salaryRange: '', experience: '', department: [], location: [], workMode: [], industry: [], companySize: [], freshness: [] });
                    setSalaryMin(0); setSalaryMax(50); setExpMin(0); setExpMax(30);
                  }}
                  className="text-sm text-indigo-600 border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Clear filters &amp; View All Jobs
                </button>
              ) : (
                <button
                  onClick={() => onNavigate && onNavigate('job-listings')}
                  className="text-sm text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
                >
                  <Briefcase className="w-3.5 h-3.5" /> View All Jobs
                </button>
              )}
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
            {Array.isArray(filteredJobs) && filteredJobs.slice((currentPage - 1) * jobsPerPage, currentPage * jobsPerPage).map((job) => (
            <div key={getId(job) || job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-gray-300 transition-all bg-white">
              <div className="flex flex-col gap-3">
                <div className="flex-1">
                  <div className="flex items-start mb-3">
                    <div className="flex-1">
                      {/* Company logo + name row */}
                      <div className="flex items-center gap-3 mb-2">
                        <CompanyLogo
                          companyName={job.company || ''}
                          storedLogo={companyLogos[(job.company || '').toLowerCase()]}
                          size={40}
                          className="rounded-lg border border-gray-200"
                        />
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

                        {(job.nationalityRestriction || job.nationality_restriction || job.nationalityRequirement) && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-300 rounded-lg px-3 py-2 mb-2">
                          <span className="text-base leading-none">🪪</span>
                          <p className="text-sm text-red-700 font-bold">{job.nationalityRestriction || job.nationality_restriction || job.nationalityRequirement}</p>
                        </div>
                      )}
                      {job.urgentNote && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 mb-2">
                          <p className="text-sm text-orange-700 font-medium leading-relaxed line-clamp-2">{job.urgentNote}</p>
                        </div>
                      )}
                      {job.description && (
                        <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                            {formatJobDescription(job.description, 180)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-3 sm:mt-0 sm:ml-4 sm:min-w-[130px] w-full sm:w-auto">
                  {user?.type === 'candidate' && appliedJobIds.has(getId(job)) && (
                    <span className="flex items-center justify-center gap-1.5 bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-lg text-sm font-medium min-h-[40px] w-full">
                      <span className="text-base leading-none">✅</span> Applied
                    </span>
                  )}
                  {user?.type === 'candidate' && (
                    <button
                      onClick={() => handleSaveJob(job)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border transition-colors text-sm font-medium min-h-[40px] w-full ${
                        savedJobs.includes(getId(job))
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {savedJobs.includes(getId(job)) ? <BookmarkCheck className="w-4 h-4 flex-shrink-0" /> : <Bookmark className="w-4 h-4 flex-shrink-0" />}
                      {savedJobs.includes(getId(job)) ? 'Saved' : 'Save'}
                    </button>
                  )}
                  <button
                    onClick={() => onNavigate && onNavigate('job-detail', { jobTitle: job.title || job.jobTitle, jobId: getId(job), companyName: job.company, jobData: job })}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm text-center min-h-[40px] w-full"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
            ))}
            
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 py-6">
                <button onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="p-2 rounded-lg border border-indigo-200 text-indigo-600 disabled:opacity-40 hover:bg-indigo-50 transition-colors" title="First page">&#171;</button>
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border border-indigo-200 text-indigo-600 disabled:opacity-40 hover:bg-indigo-50 transition-colors" title="Previous page">&#8249;</button>
                <span className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm">{currentPage}</span>
                  of {totalPages}
                </span>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages} className="p-2 rounded-lg border border-indigo-200 text-indigo-600 disabled:opacity-40 hover:bg-indigo-50 transition-colors" title="Next page">&#8250;</button>
                <button onClick={() => handlePageChange(totalPages)} disabled={currentPage >= totalPages} className="p-2 rounded-lg border border-indigo-200 text-indigo-600 disabled:opacity-40 hover:bg-indigo-50 transition-colors" title="Last page">&#187;</button>
              </div>
            )}
          </div>
        )}
          </div>
        </div>
        )}
      </div>
      
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default JobListingsPage;
