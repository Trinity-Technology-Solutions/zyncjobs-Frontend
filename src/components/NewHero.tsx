import { useState, useEffect, useRef } from "react";
import { Search, MapPin, ChevronDown } from "lucide-react";
import { API_ENDPOINTS } from '../config/api';

interface NewHeroProps {
  onNavigate?: (page: string, data?: any) => void;
  user?: {name: string, type: 'candidate' | 'employer'} | null;
}

const NewHero: React.FC<NewHeroProps> = ({ onNavigate, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [allJobTitles, setAllJobTitles] = useState<string[]>([]);
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [jobSuggestions, setJobSuggestions] = useState<string[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const jobInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch job titles from API
    const fetchJobTitles = async () => {
      try {
        console.log('Fetching job titles from:', `${API_ENDPOINTS.BASE_URL}/api/jobs/titles`);
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/jobs/titles`);
        const data = await response.json();
        console.log('Job titles response:', data);
        if (data.job_titles && data.job_titles.length > 0) {
          setAllJobTitles(data.job_titles);
          setJobSuggestions(data.job_titles.slice(0, 10));
        }
      } catch (error) {
        console.error('Error fetching job titles:', error);
      }
    };

    // Fetch locations from API
    const fetchLocations = async () => {
      try {
        console.log('Fetching locations from:', `${API_ENDPOINTS.BASE_URL}/api/locations`);
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/locations`);
        const data = await response.json();
        console.log('Locations response:', data);
        if (data.locations && data.locations.length > 0) {
          setAllLocations(data.locations);
          setLocationSuggestions(data.locations.slice(0, 10));
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    // Fetch popular searches
    const fetchPopularSearches = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/search-analytics/popular`);
        const data = await response.json();
        if (data.searches) {
          setPopularSearches(data.searches);
        }
      } catch (error) {
        console.error('Error fetching popular searches:', error);
        // Fallback to default searches
        setPopularSearches(['React', 'Python', 'JavaScript', 'Node.js', 'Java', 'Angular']);
      }
    };
    
    fetchJobTitles();
    fetchLocations();
    fetchPopularSearches();
  }, []);

  const handleJobSearch = (value: string) => {
    setSearchTerm(value);
    if (value.length > 0) {
      const filtered = allJobTitles.filter(job => 
        job.toLowerCase().includes(value.toLowerCase())
      );
      setJobSuggestions(filtered.slice(0, 10));
      setShowJobDropdown(true);
    } else {
      setJobSuggestions(allJobTitles.slice(0, 10));
      setShowJobDropdown(true);
    }
  };

  const handleLocationSearch = (value: string) => {
    console.log('Location search:', value, 'All locations:', allLocations.length);
    setLocation(value);
    if (value.length > 0) {
      const filtered = allLocations.filter(loc => 
        loc.toLowerCase().includes(value.toLowerCase())
      );
      console.log('Filtered locations:', filtered);
      setLocationSuggestions(filtered.slice(0, 10));
      setShowLocationDropdown(true);
    } else {
      setLocationSuggestions(allLocations.slice(0, 10));
      setShowLocationDropdown(true);
    }
  };

  const selectJob = (job: string) => {
    setSearchTerm(job);
    setShowJobDropdown(false);
  };

  const selectLocation = (loc: string) => {
    setLocation(loc);
    setShowLocationDropdown(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if both fields are filled
    if (!searchTerm.trim()) {
      alert('Please enter a job title or keyword');
      return;
    }
    
    if (!location.trim()) {
      alert('Please enter a city or postcode');
      return;
    }
    
    // Track the search query
    trackSearch(searchTerm);
    
    if (onNavigate) {
      onNavigate('job-listings', { searchTerm, location });
    }
  };

  const trackSearch = async (query: string) => {
    try {
      await fetch(`${API_ENDPOINTS.BASE_URL}/api/search-analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  };

  return (
    <>
      {/* Main Banner Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-blue-100 rounded-full opacity-20"></div>
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-blue-200 rounded-full opacity-30"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="space-y-8 -mt-8">
              <div className="space-y-6">
                <h5 className="text-blue-600 font-semibold text-lg">
                  We Have 208,000+ Live Jobs
                </h5>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Your <span className="text-blue-600">Dream</span> Job Is Waiting For You
                </h1>
                <h6 className="text-lg text-gray-600 leading-relaxed">
                  Type your keyword, then click search to find your perfect job.
                </h6>
              </div>

              {/* Search Form */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border">
                <form onSubmit={handleSearch}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div className="sm:col-span-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-blue-600" />
                          </div>
                          <input
                            ref={jobInputRef}
                            type="text"
                            placeholder="Job Title, Keywords"
                            value={searchTerm}
                            onChange={(e) => handleJobSearch(e.target.value)}
                            onFocus={() => {
                              setJobSuggestions(allJobTitles.slice(0, 10));
                              setShowJobDropdown(true);
                            }}
                            onBlur={() => setTimeout(() => setShowJobDropdown(false), 300)}
                            required
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {showJobDropdown && jobSuggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {jobSuggestions.map((job, index) => (
                                <div
                                  key={index}
                                  onMouseDown={() => selectJob(job)}
                                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  {job}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-blue-600" />
                          </div>
                          <input
                            ref={locationInputRef}
                            type="text"
                            placeholder="City Or Country"
                            value={location}
                            onChange={(e) => handleLocationSearch(e.target.value)}
                            onFocus={() => {
                              setLocationSuggestions(allLocations.slice(0, 10));
                              setShowLocationDropdown(true);
                            }}
                            onBlur={() => setTimeout(() => setShowLocationDropdown(false), 300)}
                            required
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {showLocationDropdown && locationSuggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {locationSuggestions.map((loc, index) => (
                                <div
                                  key={index}
                                  onMouseDown={() => selectLocation(loc)}
                                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  {loc}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Find Job
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Popular Searches */}
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-semibold text-gray-900">Popular Searches:</h4>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        setSearchTerm(term);
                        trackSearch(term);
                        if (onNavigate) {
                          onNavigate('job-listings', { searchTerm: term, location });
                        }
                      }}
                      className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>

              <div className="relative">
                {/* Dotted Circle Background */}
                <div className="absolute inset-0 flex items-center justify-center -mt-12">
                  <div className="w-[22rem] h-[22rem] border-2 border-dashed border-gray-800 rounded-full opacity-50 animate-spin" style={{animationDuration: '20s'}}></div>
                  <div className="w-[33rem] h-[33rem] border-2 border-dashed border-gray-800 rounded-full opacity-40 absolute animate-spin" style={{animationDuration: '30s', animationDirection: 'reverse'}}></div>
                </div>
                
                <img
                  src="/images/women.png"
                  alt="Professional woman"
                  className="w-[26rem] h-[32rem] mx-auto object-contain relative z-10 -mt-12"
                />
              </div>
          </div>
        </div>
      </div>

      {/* Partners Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center space-x-12">
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" className="h-8 opacity-70 hover:opacity-100 transition-opacity" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" className="h-8 opacity-70 hover:opacity-100 transition-opacity" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" className="h-8 opacity-70 hover:opacity-100 transition-opacity" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg" alt="Meta" className="h-8 opacity-70 hover:opacity-100 transition-opacity" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple" className="h-8 opacity-70 hover:opacity-100 transition-opacity" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" alt="Netflix" className="h-8 opacity-70 hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </>
  );
};

export default NewHero;