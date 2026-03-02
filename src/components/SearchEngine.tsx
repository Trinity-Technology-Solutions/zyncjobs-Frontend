import React, { useState, useEffect, useCallback } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { Search, MapPin, Users, Star, Building, Globe, Briefcase, Sparkles, Filter, TrendingUp, Clock } from 'lucide-react';
import { searchAPI } from '../api/search';

const SearchEngine: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [trending, setTrending] = useState<any[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    jobType: [],
    industry: [],
    companySize: [],
    freshness: '',
    salaryMin: 0,
    salaryMax: 200000
  });

  // Debounced search function with advanced filters
  const performSearch = useCallback(async (query: string) => {
    setLoading(true);
    try {
      if (query || location || filters.industry.length > 0 || filters.companySize.length > 0 || filters.freshness) {
        const searchParams = {
          query: query,
          location: location,
          jobType: filters.jobType,
          industry: filters.industry,
          companySize: filters.companySize,
          freshness: filters.freshness,
          salaryMin: filters.salaryMin,
          salaryMax: filters.salaryMax,
          page: 1,
          limit: 20
        };
        
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/search/advanced`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchParams)
        });
        
        if (response.ok) {
          const data = await response.json();
          setResults(data.jobs || []);
        }
      } else {
        const searchResults = await searchAPI(query);
        setResults(searchResults);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [location, filters]);

  // Fetch trending jobs
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/search/trending?limit=4`);
        if (response.ok) {
          const data = await response.json();
          setTrending(data);
        }
      } catch (error) {
        console.error('Error fetching trending jobs:', error);
      }
    };

    const fetchLocations = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/locations`);
        if (response.ok) {
          const data = await response.json();
          if (data.locations && data.locations.length > 0) {
            setAllLocations(data.locations);
          }
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    fetchTrending();
    fetchLocations();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, performSearch]);

  const getSuggestions = (input: string): string[] => {
    const allJobs = [
      'React Developer', 'Python Developer', 'Java Developer', 'JavaScript Developer', 'Node.js Developer',
      'Angular Developer', 'Vue.js Developer', 'PHP Developer', 'C# Developer', 'Go Developer',
      'Data Scientist', 'Data Analyst', 'Machine Learning Engineer', 'AI Engineer',
      'UI/UX Designer', 'Graphic Designer', 'Product Designer', 'Web Designer',
      'Content Writer', 'Content Manager', 'Marketing Manager', 'Digital Marketing Specialist',
      'Sales Executive', 'Business Development Manager', 'Account Manager',
      'Project Manager', 'Product Manager', 'Scrum Master', 'Business Analyst',
      'DevOps Engineer', 'Cloud Engineer', 'Cybersecurity Analyst', 'QA Engineer'
    ];
    
    const allLocations = [
      'Chennai', 'Bangalore', 'Hyderabad', 'Mumbai', 'Delhi', 'Pune', 'Kolkata', 'Kochi',
      'New York', 'California', 'Texas', 'Florida', 'Washington', 'Chicago', 'Boston',
      'Toronto', 'Vancouver', 'Montreal', 'London', 'Manchester', 'Berlin', 'Munich',
      'Sydney', 'Melbourne', 'Singapore', 'Tokyo', 'Dubai', 'Remote', 'Work from Home'
    ];

    if (!input || input.length < 1) return [];
    
    const inputLower = input.toLowerCase();
    const jobMatches = allJobs.filter(job => job.toLowerCase().includes(inputLower));
    const locationMatches = allLocations.filter(location => location.toLowerCase().includes(inputLower));
    
    return [...jobMatches, ...locationMatches].slice(0, 8);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.length >= 2) {
      const newSuggestions = getSuggestions(value);
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
  };

  const handleLocationSearch = (value: string) => {
    setLocation(value);
    if (value.length > 0) {
      const filtered = allLocations.filter(loc => 
        loc.toLowerCase().includes(value.toLowerCase())
      );
      setLocationSuggestions(filtered.slice(0, 10));
      setShowLocationDropdown(true);
    } else {
      setLocationSuggestions(allLocations.slice(0, 10));
      setShowLocationDropdown(true);
    }
  };

  const selectLocation = (loc: string) => {
    setLocation(loc);
    setShowLocationDropdown(false);
  };

  const renderCompanyCard = (company: any) => (
    <div key={`company-${company.id}`} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4 mb-4">
        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
          <Building className="w-8 h-8 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
            {company.name}
          </h3>
          <p className="text-sm text-gray-600">{company.industry}</p>
          <div className="flex items-center space-x-1 mt-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">{company.rating}</span>
          </div>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4">{company.description}</p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{company.location}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{company.employees} employees</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Globe className="w-4 h-4" />
          <span>{company.website}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-sm text-blue-600 font-medium">
          {company.openJobs} open positions
        </span>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
          View Company
        </button>
      </div>
    </div>
  );

  const renderJobCard = (job: any) => (
    <div key={`job-${job.id}`} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-2">
            {job.role}
          </h3>
          <p className="text-gray-600 font-medium">{job.company}</p>
          <div className="flex items-center text-gray-600 mt-1">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{job.location}</span>
            <span className="mx-2">•</span>
            <span>{job.type}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Briefcase className="w-5 h-5 text-blue-600" />
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4">{job.description}</p>

      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {job.skills.slice(0, 4).map((skill: string, index: number) => (
            <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              {skill}
            </span>
          ))}
          {job.skills.length > 4 && (
            <span className="text-gray-500 text-sm">+{job.skills.length - 4} more</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-sm text-green-600 font-medium">{job.salary}</span>
        <div className="space-x-2">
          <button className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors">
            Save Job
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Search Jobs & Companies</h1>
          
          <div className="flex gap-4 max-w-4xl">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="searchInput"
                type="text"
                placeholder="Job title, keywords, or company"
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onMouseDown={() => selectSuggestion(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0 flex items-center"
                    >
                      <Search className="w-4 h-4 text-gray-400 mr-3" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex-1 relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => handleLocationSearch(e.target.value)}
                onFocus={() => {
                  setLocationSuggestions(allLocations.slice(0, 10));
                  setShowLocationDropdown(true);
                }}
                onBlur={() => setTimeout(() => setShowLocationDropdown(false), 300)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {showLocationDropdown && locationSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {locationSuggestions.map((loc, index) => (
                    <button
                      key={index}
                      type="button"
                      onMouseDown={() => selectLocation(loc)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0 flex items-center"
                    >
                      <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
            
            <button
              onClick={() => performSearch(searchTerm)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
          
          {/* Quick Filters */}
          <div className="flex gap-2 mt-4">
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
              onClick={() => setFilters(prev => ({ ...prev, jobType: prev.jobType.includes('Remote') ? prev.jobType.filter(t => t !== 'Remote') : [...prev.jobType, 'Remote'] }))}
              className={`px-3 py-1 rounded-full text-sm border ${
                filters.jobType.includes('Remote') 
                  ? 'bg-blue-100 border-blue-300 text-blue-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Remote Jobs
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Trending Jobs */}
            {trending.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  Trending Jobs
                </h3>
                <div className="space-y-3">
                  {trending.map((job: any) => (
                    <div key={job._id} className="border-l-2 border-orange-500 pl-3">
                      <h4 className="font-medium text-sm">{job.jobTitle}</h4>
                      <p className="text-xs text-gray-600">{job.company}</p>
                      <p className="text-xs text-gray-500">{job.views} views</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Advanced Filters */}
            {showFilters && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Filters</h3>
                
                {/* Industry */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  <div className="space-y-2">
                    {['Technology', 'Healthcare', 'Finance', 'Education'].map((industry) => (
                      <label key={industry} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.industry.includes(industry)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({ ...prev, industry: [...prev.industry, industry] }));
                            } else {
                              setFilters(prev => ({ ...prev, industry: prev.industry.filter(i => i !== industry) }));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{industry}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Company Size */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                  <div className="space-y-2">
                    {['1-10', '11-50', '51-200', '201-500', '500+'].map((size) => (
                      <label key={size} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.companySize.includes(size)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({ ...prev, companySize: [...prev.companySize, size] }));
                            } else {
                              setFilters(prev => ({ ...prev, companySize: prev.companySize.filter(s => s !== size) }));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{size} employees</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Main Results */}
          <div className="lg:col-span-3">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600">
            {loading ? 'Searching...' : `${results.length} results found`}
            {searchTerm && ` for "${searchTerm}"`}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-500">Try different keywords or browse all opportunities.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {results.map((item) => 
              item.type === 'company' ? renderCompanyCard(item) : renderJobCard(item)
            )}
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchEngine;