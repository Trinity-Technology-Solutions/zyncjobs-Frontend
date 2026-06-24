import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Bot, Sparkles, Brain, Zap, Palette, MessageCircle, Compass, CheckCircle, Rocket } from "lucide-react";
import { API_ENDPOINTS } from '../config/env';
import { useHeroSection } from '../store/useHeroSection';
import { strapiAPI } from '../api/strapi';
import { searchAccuracy } from '../utils/searchAccuracy';

const COMPANIES = [
  { name: 'Birlasoft',   logo: 'https://www.google.com/s2/favicons?domain=birlasoft.com&sz=64' },
  { name: 'Persistent', logo: 'https://www.google.com/s2/favicons?domain=persistent.com&sz=64' },
  { name: 'LTIMindtree',logo: 'https://www.google.com/s2/favicons?domain=ltimindtree.com&sz=64' },
  { name: 'L&T',        logo: 'https://www.google.com/s2/favicons?domain=larsentoubro.com&sz=64' },
  { name: 'Cognizant',  logo: 'https://www.google.com/s2/favicons?domain=cognizant.com&sz=64' },
  { name: 'Accenture',  logo: 'https://www.google.com/s2/favicons?domain=accenture.com&sz=64' },
];

const CompanyMarquee: React.FC = () => {
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // Create seamless marquee by duplicating companies for smooth animation
  const items = [...COMPANIES, ...COMPANIES];

  return (
    <div className="bg-white py-6" ref={ref} style={{borderRadius: '40px 40px 0 0', marginTop: '-40px', position: 'relative', zIndex: 10}}>
      <style>{`
        @keyframes marquee-rtl {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee-rtl 22s linear infinite;
        }
        .marquee-track.paused {
          animation-play-state: paused;
        }
      `}</style>
      <p className="text-center text-sm text-gray-500 uppercase tracking-widest mb-4 font-semibold">Trusted by leading companies</p>
      <div className="overflow-hidden">
        <div className={`marquee-track${paused ? ' paused' : ''}`}>
          {items.map((c, i) => (
            <div
              key={`${c.name}-${i}`}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              className="flex flex-col items-center justify-center mx-7 gap-2 group"
              style={{ minWidth: '100px' }}
            >
              <div className="w-14 h-14 flex items-center justify-center">
                <img
                  src={c.logo}
                  alt={c.name}
                  width={56}
                  height={56}
                  loading="lazy"
                  decoding="async"
                  className="w-14 h-14 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

interface NewHeroProps {
  onNavigate?: (page: string, data?: any) => void;
  user?: {name: string, type: 'candidate' | 'employer'} | null;
}

const NewHero: React.FC<NewHeroProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [allJobTitles, setAllJobTitles] = useState<string[]>([]);
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>(['iOS Developer', 'Digital Marketing Specialist', 'AI Engineer', 'Video Editor', 'Software Engineer']);
  const [displayedSearches, setDisplayedSearches] = useState<string[]>([]);
  const [jobSuggestions, setJobSuggestions] = useState<string[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const jobInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { data: heroData, fetchHeroSection } = useHeroSection();

  useEffect(() => {
    // Initialize with first 3 popular searches
    setDisplayedSearches(popularSearches.slice(0, 3));
  }, [popularSearches]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimationKey(prev => prev + 1);
        }
      },
      { threshold: 0.3 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => {
      if (heroRef.current) {
        observer.unobserve(heroRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchHeroSection();
  }, []);

  useEffect(() => {
    // Fetch job titles from API
    const fetchJobTitles = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/autocomplete/jobs`);
        const data = await response.json();
        const titles = Array.isArray(data) ? data : data.job_titles || [];
        if (titles.length > 0) {
          setAllJobTitles(titles);
          setJobSuggestions(titles.slice(0, 50));
        }
      } catch (error) {
        console.error('Error fetching job titles:', error);
      }
    };

    // Fetch locations from API
    const fetchLocations = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/autocomplete/locations`);
        const data = await response.json();
        const locs = Array.isArray(data) ? data : data.locations || [];
        if (locs.length > 0) {
          setAllLocations(locs);
          setLocationSuggestions(locs.slice(0, 50));
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    // Fetch popular searches
    const fetchPopularSearches = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/search-analytics/popular`);
        const data = await response.json();
        if (data.searches && data.searches.length > 0) {
          // Sort by search count/frequency and take top searches
          const sortedSearches = data.searches
            .sort((a: any, b: any) => (b.count || b.frequency || 0) - (a.count || a.frequency || 0))
            .map((item: any) => item.query || item.term || item)
            .slice(0, 8); // Keep top 8 for rotation
          setPopularSearches(sortedSearches);
        }
      } catch (error) {
        console.error('Error fetching popular searches:', error);
        // Keep default searches if API fails
      }
    };
    
    // Defer non-critical API calls until after page load to reduce TBT
    const timer = setTimeout(() => {
      fetchJobTitles();
      fetchLocations();
      fetchPopularSearches();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleJobSearch = (value: string) => {
    setSearchTerm(value);
    if (value.length >= 2) {
      // Use enhanced search accuracy for better job title matching
      const filtered = searchAccuracy.getContextAwareJobSuggestions(value);
      setJobSuggestions(filtered);
      setShowJobDropdown(filtered.length > 0);
    } else {
      setJobSuggestions([]);
      setShowJobDropdown(false);
    }
  };

  const handleLocationSearch = (value: string) => {
    setLocation(value);
    if (value.length >= 2) {
      // Use enhanced location matching
      const filtered = searchAccuracy.getLocationMatches(value, allLocations);
      setLocationSuggestions(filtered);
      setShowLocationDropdown(filtered.length > 0);
    } else {
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
    }
  };

  const handlePopularSearchClick = (clickedTerm: string) => {
    setSearchTerm(clickedTerm);
    trackSearch(clickedTerm);
    
    // Get remaining searches (excluding the clicked one)
    const remainingSearches = popularSearches.filter(term => term !== clickedTerm);
    
    // Get next 3 most popular searches from remaining ones
    const nextSearches = remainingSearches.slice(0, 3);
    
    // Update displayed searches with next most popular
    setDisplayedSearches(nextSearches);
    
    if (onNavigate) {
      onNavigate('job-listings', { searchTerm: clickedTerm, location: location.trim() });
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
    const term = searchTerm.trim();
    const loc = location.trim();
    if (!term && !loc) return;
    if (term) trackSearch(term);
    if (onNavigate) {
      onNavigate('job-listings', { searchTerm: term, location: loc });
    }
  };

  const trackSearch = async (query: string) => {
    try {
      await fetch(`${API_ENDPOINTS.BASE_URL}/search-analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  };

  const subtitle = heroData?.subtitle || 'Let AI Find Your Next Move';
  const title = heroData?.title || 'Your Dream Job Is Waiting For You';
  const description = heroData?.description || 'AI career platform for jobs, skills, interview prep, and ATS-ready resumes.';
  const buttonText = heroData?.buttonText || 'Find Job';
  const heroImage = heroData?.heroImage?.url ? strapiAPI.getImageUrl(heroData.heroImage.url) : '/images/women.png';

  return (
    <>
      {/* Main Banner Section */}
      <div ref={heroRef} className="relative" style={{
        background: 'linear-gradient(135deg, #0f0c29 0%, #1a1040 30%, #2d1b69 60%, #1e0a3c 100%)',
      }}>
        {/* Subtle radial glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full" style={{background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)'}}></div>
          <div className="absolute bottom-10 right-1/4 w-80 h-80 rounded-full" style={{background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)'}}></div>
          <div className="absolute top-1/2 left-10 w-64 h-64 rounded-full" style={{background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{paddingTop: '4rem', paddingBottom: '0'}}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
            
            {/* Left Content */}
            <div className="space-y-8 pb-16 w-full overflow-hidden">
              <div className="space-y-6">
                <h5 className="font-semibold text-lg" style={{color: '#a78bfa'}}>
                  {subtitle}
                </h5>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight break-words max-w-full">
                  <style>{`
                    @keyframes word-pop {
                      0% { opacity: 0; transform: translateY(20px); }
                      100% { opacity: 1; transform: translateY(0); }
                    }
                    .anim-word {
                      display: inline;
                      opacity: 0;
                      animation: word-pop 0.6s ease forwards;
                      white-space: pre-wrap;
                    }
                  `}</style>
                  {title.split(' ').map((word, i) => {
                    const isDreamWord = word.toLowerCase().includes('dream');
                    return (
                      <span key={`${animationKey}-${i}`}>
                        <span
                          className="anim-word"
                          style={isDreamWord ? {color: '#f97316', animationDelay: `${i * 0.2}s`} : {animationDelay: `${i * 0.2}s`}}
                        >
                          {word}
                        </span>
                        {i < title.split(' ').length - 1 && ' '}
                      </span>
                    );
                  })}
                </h1>
                <h6 className="text-xs sm:text-sm lg:text-base leading-relaxed break-words" style={{color: 'rgba(255,255,255,0.7)'}}>
                  <style>{`
                    @keyframes desc-fade-in {
                      0% { opacity: 0; transform: translateY(10px); }
                      100% { opacity: 1; transform: translateY(0); }
                    }
                    .anim-desc-text {
                      opacity: 0;
                      animation: desc-fade-in 0.8s ease forwards;
                      animation-delay: 1.5s;
                    }
                  `}</style>
                  <span className="anim-desc-text">
                    {description}
                  </span>
                </h6>
              </div>

              {/* Search Form */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border">
                <form onSubmit={handleSearch} role="search" aria-label="Job search">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div className="sm:col-span-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Job Title Input */}
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-blue-600" />
                          </div>
                          <label htmlFor="hero-job-search" className="sr-only">Job title or keywords</label>
                          <input
                            id="hero-job-search"
                            ref={jobInputRef}
                            type="text"
                            placeholder="Job Title, Keywords"
                            value={searchTerm}
                            onChange={(e) => handleJobSearch(e.target.value)}
                            onFocus={() => {
                              if (searchTerm.length >= 2) {
                                const filtered = allJobTitles.filter(job => 
                                  job.toLowerCase().includes(searchTerm.toLowerCase())
                                ).slice(0, 8);
                                setJobSuggestions(filtered);
                                setShowJobDropdown(filtered.length > 0);
                              }
                            }}
                            onBlur={() => setTimeout(() => setShowJobDropdown(false), 200)}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            aria-label="Job title or keywords"
                            aria-autocomplete="list"
                            aria-expanded={showJobDropdown}
                            aria-controls="job-suggestions"
                          />
                          {showJobDropdown && jobSuggestions.length > 0 && (
                            <ul
                              id="job-suggestions"
                              role="listbox"
                              aria-label="Job title suggestions"
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                zIndex: 99999,
                                background: '#fff',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                                maxHeight: '240px',
                                overflowY: 'auto',
                                marginTop: '4px',
                                listStyle: 'none',
                                padding: 0,
                              }}
                            >
                              {jobSuggestions.map((job, index) => (
                                <li
                                  key={index}
                                  role="option"
                                  aria-selected={false}
                                  onMouseDown={() => selectJob(job)}
                                  style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: '14px', color: '#1f2937' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
                                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                                >
                                  {job}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        {/* Location Input */}
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-blue-600" />
                          </div>
                          <label htmlFor="hero-location-search" className="sr-only">City or country</label>
                          <input
                            id="hero-location-search"
                            ref={locationInputRef}
                            type="text"
                            placeholder="City Or Country"
                            value={location}
                            onChange={(e) => handleLocationSearch(e.target.value)}
                            onFocus={() => {
                              if (location.length >= 2) {
                                const filtered = allLocations.filter(loc => 
                                  loc.toLowerCase().includes(location.toLowerCase())
                                ).slice(0, 8);
                                setLocationSuggestions(filtered);
                                setShowLocationDropdown(filtered.length > 0);
                              }
                            }}
                            onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            aria-label="City or country"
                            aria-autocomplete="list"
                            aria-expanded={showLocationDropdown}
                            aria-controls="location-suggestions"
                          />
                          {showLocationDropdown && locationSuggestions.length > 0 && (
                            <ul
                              id="location-suggestions"
                              role="listbox"
                              aria-label="Location suggestions"
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                zIndex: 99999,
                                background: '#fff',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                                maxHeight: '240px',
                                overflowY: 'auto',
                                marginTop: '4px',
                                listStyle: 'none',
                                padding: 0,
                              }}
                            >
                              {locationSuggestions.map((loc, index) => (
                                <li
                                  key={index}
                                  role="option"
                                  aria-selected={false}
                                  onMouseDown={() => selectLocation(loc)}
                                  style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: '14px', color: '#1f2937' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
                                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                                >
                                  {loc}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        aria-label="Search jobs"
                      >
                        {buttonText}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Popular Searches */}
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-semibold" style={{color: 'rgba(255,255,255,0.9)'}}>Popular Searches:</h4>
                <div className="flex flex-wrap gap-2">
                  {displayedSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handlePopularSearchClick(term)}
                      className="hover:underline cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1 rounded" 
                      style={{color: '#a78bfa'}}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>

              <div className="relative">
                <style>{`
                  @keyframes hero-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                  @keyframes hero-spin-rev { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
                  .hero-orbit-inner { animation: hero-spin 20s linear infinite; }
                  .hero-orbit-outer { animation: hero-spin-rev 30s linear infinite; }
                  .hero-icon-counter-inner { animation: hero-spin-rev 20s linear infinite; }
                  .hero-icon-counter-outer { animation: hero-spin 30s linear infinite; }
                `}</style>

                {/* Dotted Circle Background */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Inner orbit circle */}
                  <div className="hero-orbit-inner w-[22rem] h-[22rem] rounded-full absolute" style={{border: '1.5px dashed rgba(255,255,255,0.6)'}}>
                    {[
                      { Icon: Bot, angle: 0, color: '#3b82f6' },
                      { Icon: Sparkles, angle: 90, color: '#8b5cf6' },
                      { Icon: Brain, angle: 180, color: '#ec4899' },
                      { Icon: Zap, angle: 270, color: '#f59e0b' },
                    ].map(({ Icon, angle, color }) => (
                      <div
                        key={angle}
                        className="absolute"
                        style={{
                          top: '50%', left: '50%',
                          width: '2.5rem', height: '2.5rem',
                          marginTop: '-1.25rem', marginLeft: '-1.25rem',
                          transform: `rotate(${angle}deg) translate(11rem)`,
                        }}
                      >
                        <div className="hero-icon-counter-inner w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center border border-blue-100">
                          <Icon className="w-5 h-5" style={{ color }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Outer orbit circle */}
                  <div className="hero-orbit-outer w-[33rem] h-[33rem] rounded-full absolute" style={{border: '1.5px dashed rgba(255,255,255,0.7)'}}>
                    {[
                      { Icon: Palette, label: 'Resume Studio', angle: 0, color: '#06b6d4' },
                      { Icon: MessageCircle, label: 'Interview Preparation', angle: 72, color: '#10b981' },
                      { Icon: Compass, label: 'Career Guidance', angle: 144, color: '#f59e0b' },
                      { Icon: CheckCircle, label: 'Skill Check', angle: 216, color: '#8b5cf6' },
                      { Icon: Rocket, label: 'Job Search', angle: 288, color: '#ef4444' },
                    ].map(({ Icon, label, angle, color }) => (
                      <div
                        key={label}
                        className="absolute"
                        style={{
                          top: '50%', left: '50%',
                          width: '2.5rem', height: '2.5rem',
                          marginTop: '-1.25rem', marginLeft: '-1.25rem',
                          transform: `rotate(${angle}deg) translate(16.5rem)`,
                        }}
                      >
                        <div className="hero-icon-counter-outer w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200">
                          <Icon className="w-5 h-5" style={{ color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <img
                  src={heroImage}
                  alt="Professional standing confidently"
                  className="w-full object-contain object-bottom relative z-10"
                  style={{ maxHeight: '580px', display: 'block' }}
                  width={580}
                  height={580}
                  fetchpriority="high"
                  decoding="sync"
                />
              </div>
          </div>
        </div>
      </div>

      {/* Partners Marquee Section */}
      <CompanyMarquee />
    </>
  );
};

export default NewHero;

