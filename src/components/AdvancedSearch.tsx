import React, { useState, useEffect } from 'react';
import { Search, MapPin, Filter, Clock, TrendingUp, Star } from 'lucide-react';

const AdvancedSearch = () => {
  const [searchParams, setSearchParams] = useState({
    query: '',
    location: '',
    radius: 50,
    jobType: [],
    locationType: [],
    industry: [],
    companySize: [],
    salaryMin: 0,
    salaryMax: 200000,
    experienceLevel: [],
    freshness: '',
    skills: [],
    benefits: []
  });

  const [results, setResults] = useState({ jobs: [], total: 0 });
  const [filters, setFilters] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Load filter options
  useEffect(() => {
    fetchFilters();
    fetchTrending();
  }, []);

  const fetchFilters = async () => {
    try {
      const response = await fetch('/api/search/filters');
      const data = await response.json();
      setFilters(data);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const fetchTrending = async () => {
    try {
      const response = await fetch('/api/search/trending');
      const data = await response.json();
      setTrending(data);
    } catch (error) {
      console.error('Error fetching trending jobs:', error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/search/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchParams)
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setSearchParams(prev => ({
      ...prev,
      [key]: Array.isArray(prev[key]) 
        ? prev[key].includes(value)
          ? prev[key].filter(item => item !== value)
          : [...prev[key], value]
        : value
    }));
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Search Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Job title, keywords, or company"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={searchParams.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Location"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={searchParams.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
            </div>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="h-5 w-5" />
            Filters
          </button>
          
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Job Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
              <div className="space-y-2">
                {filters.jobTypes?.map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={searchParams.jobType.includes(type)}
                      onChange={() => handleFilterChange('jobType', type)}
                      className="mr-2"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            {/* Location Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location Type</label>
              <div className="space-y-2">
                {filters.locationTypes?.map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={searchParams.locationType.includes(type)}
                      onChange={() => handleFilterChange('locationType', type)}
                      className="mr-2"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
              <select
                multiple
                className="w-full border border-gray-300 rounded-lg p-2"
                value={searchParams.industry}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  setSearchParams(prev => ({ ...prev, industry: values }));
                }}
              >
                {filters.industries?.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            {/* Company Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
              <div className="space-y-2">
                {filters.companySizes?.map(size => (
                  <label key={size} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={searchParams.companySize.includes(size)}
                      onChange={() => handleFilterChange('companySize', size)}
                      className="mr-2"
                    />
                    {size} employees
                  </label>
                ))}
              </div>
            </div>

            {/* Salary Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={searchParams.salaryMin}
                  onChange={(e) => handleFilterChange('salaryMin', parseInt(e.target.value) || 0)}
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={searchParams.salaryMax}
                  onChange={(e) => handleFilterChange('salaryMax', parseInt(e.target.value) || 200000)}
                />
              </div>
            </div>

            {/* Freshness */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Posted</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={searchParams.freshness}
                onChange={(e) => handleFilterChange('freshness', e.target.value)}
              >
                <option value="">Any time</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Results */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {results.total > 0 ? `${results.total} Jobs Found` : 'Search Results'}
              </h2>
            </div>
            
            <div className="divide-y">
              {results.jobs?.map(job => (
                <div key={job._id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-800">
                        {job.jobTitle}
                      </h3>
                      <p className="text-gray-600">{job.company}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </span>
                        <span>{job.jobType}</span>
                        <span>{job.locationType}</span>
                        {job.trending && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <TrendingUp className="h-4 w-4" />
                            Trending
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-gray-700 line-clamp-2">{job.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {job.skills?.slice(0, 3).map(skill => (
                          <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      {job.salary?.max > 0 && (
                        <p className="text-green-600 font-semibold">
                          ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trending Jobs */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              Trending Jobs
            </h3>
            <div className="space-y-3">
              {trending.slice(0, 5).map(job => (
                <div key={job._id} className="border-l-2 border-orange-500 pl-3">
                  <h4 className="font-medium text-sm">{job.jobTitle}</h4>
                  <p className="text-xs text-gray-600">{job.company}</p>
                  <p className="text-xs text-gray-500">{job.views} views</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Filters */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Filters</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleFilterChange('freshness', '24h')}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Last 24 hours
              </button>
              <button
                onClick={() => handleFilterChange('locationType', 'Remote')}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-100"
              >
                Remote Jobs
              </button>
              <button
                onClick={() => handleFilterChange('jobType', 'Full-time')}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-100"
              >
                Full-time
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;