import { useState, useEffect, useRef } from "react";
import { Search, MapPin } from "lucide-react";
import { API_ENDPOINTS } from '../config/env';
import { useHeroSection } from '../store/useHeroSection';
import { strapiAPI } from '../api/strapi';

const COMPANIES = [
  { name: 'Birlasoft',   logo: 'https://img.logo.dev/birlasoft.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
  { name: 'Persistent', logo: 'https://img.logo.dev/persistent.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
  { name: 'LTIMindtree',logo: 'https://img.logo.dev/ltimindtree.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
  { name: 'Saksoft',    logo: 'https://img.logo.dev/saksoft.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
  { name: 'L&T',        logo: 'https://img.logo.dev/larsentoubro.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
  { name: 'Cognizant',  logo: 'https://img.logo.dev/cognizant.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
  { name: 'Accenture',  logo: 'https://img.logo.dev/accenture.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
];

const CompanyMarquee: React.FC = () => {
  const [paused, setPaused] = useState(false);
  const [clicked, setClicked] = useState<string | null>(null);
  // Duplicate list for seamless loop
  const items = [...COMPANIES, ...COMPANIES];

  const handleLogoClick = (name: string) => {
    if (clicked === name) {
      // second click on same logo → resume
      setClicked(null);
      setPaused(false);
    } else {
      setClicked(name);
      setPaused(true);
    }
  };

  // Click outside marquee → resume
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setPaused(false);
        setClicked(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="bg-white py-6 border-t border-gray-100" ref={ref}>
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
      <p className="text-center text-sm text-gray-500 uppercase tracking-widest mb-4 font-semibold">Trusted by top companies</p>
      <div className="overflow-hidden">
        <div className={`marquee-track${paused ? ' paused' : ''}`}>
          {items.map((c, i) => (
            <button
              key={`${c.name}-${i}`}
              onClick={() => handleLogoClick(c.name)}
              title={clicked === c.name ? 'Click to resume' : c.name}
              className={`flex flex-col items-center justify-center mx-8 gap-2 group focus:outline-none transition-transform ${
                clicked === c.name ? 'scale-110' : 'hover:scale-105'
              }`}
              style={{ minWidth: '90px' }}
            >
              <div className={`relative w-14 h-14 rounded-xl border flex items-center justify-center bg-white shadow-sm transition-all ${
                clicked === c.name
                  ? 'border-blue-500 shadow-blue-200 shadow-md ring-2 ring-blue-400'
                  : 'border-gray-200 group-hover:border-blue-300 group-hover:shadow-md'
              }`}>
                <img
                  src={c.logo}
                  alt={c.name}
                  className="w-10 h-10 object-contain"
                  onError={e => {
                    const img = e.currentTarget;
                    img.style.display = 'none';
                    const span = img.nextElementSibling as HTMLElement;
                    if (span) span.style.display = 'flex';
                  }}
                />
                {/* Fallback letter avatar */}
                <span
                  className="w-10 h-10 rounded-lg bg-blue-600 text-white font-bold text-lg items-center justify-center"
                  style={{ display: 'none' }}
                >
                  {c.name[0]}
                </span>
                {clicked === c.name && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="w-2 h-2 bg-white rounded-full" />
                  </span>
                )}
              </div>
              <span className={`text-xs font-medium transition-colors ${
                clicked === c.name ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
              }`}>{c.name}</span>
            </button>
          ))}
        </div>
      </div>
      {paused && (
        <p className="text-center text-xs text-blue-500 mt-3 animate-pulse">
          ⏸ Paused — click the logo again or click outside to resume
        </p>
      )}
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
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [jobSuggestions, setJobSuggestions] = useState<string[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const jobInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const { data: heroData, fetchHeroSection } = useHeroSection();

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
        if (data.searches) {
          setPopularSearches(data.searches);
        }
      } catch (error) {
        console.error('Error fetching popular searches:', error);
        setPopularSearches(['Software developer', 'Software engineer', 'Devops engineer']);
      }
    };
    
    fetchJobTitles();
    fetchLocations();
    fetchPopularSearches();
  }, []);

  const handleJobSearch = (value: string) => {
    setSearchTerm(value);
    const filtered = value.length > 0
      ? allJobTitles.filter(job => job.toLowerCase().includes(value.toLowerCase()))
      : allJobTitles;
    setJobSuggestions(filtered.slice(0, 50));
    setShowJobDropdown(true);
  };

  const handleLocationSearch = (value: string) => {
    setLocation(value);
    const filtered = value.length > 0
      ? allLocations.filter(loc => loc.toLowerCase().includes(value.toLowerCase()))
      : allLocations;
    setLocationSuggestions(filtered.slice(0, 50));
    setShowLocationDropdown(true);
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
    if (!searchTerm.trim() && !location.trim()) return;
    trackSearch(searchTerm);
    if (onNavigate) {
      onNavigate('job-listings', { searchTerm, location });
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

  const subtitle = heroData?.subtitle || 'We Have 208,000+ Live Jobs';
  const title = heroData?.title || 'Your Dream Job Is Waiting For You';
  const description = heroData?.description || 'AI career platform for jobs, skills, interview prep, and ATS-ready resumes.';
  const buttonText = heroData?.buttonText || 'Find Job';
  const heroImage = heroData?.heroImage?.url ? strapiAPI.getImageUrl(heroData.heroImage.url) : '/images/women.png';

  return (
    <>
      {/* Main Banner Section */}
      <div className="relative bg-white">
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
                  {subtitle}
                </h5>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  {title.split('Dream').map((part, i) => (
                    i === 0 ? <span key={i}>{part}</span> : <span key={i}><span className="text-blue-600">Dream</span>{part}</span>
                  ))}
                </h1>
                <h6 className="text-base text-gray-600 leading-relaxed whitespace-nowrap">
                  {description}
                </h6>
              </div>

              {/* Search Form */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border">
                <form onSubmit={handleSearch}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div className="sm:col-span-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Job Title Input */}
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
                              setJobSuggestions(allJobTitles.length > 0 ? allJobTitles.slice(0, 50) : []);
                              setShowJobDropdown(true);
                            }}
                            onBlur={() => setTimeout(() => setShowJobDropdown(false), 200)}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {showJobDropdown && jobSuggestions.length > 0 && (
                            <ul
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                zIndex: 9999,
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
                          <input
                            ref={locationInputRef}
                            type="text"
                            placeholder="City Or Country"
                            value={location}
                            onChange={(e) => handleLocationSearch(e.target.value)}
                            onFocus={() => {
                              setLocationSuggestions(allLocations.length > 0 ? allLocations.slice(0, 50) : []);
                              setShowLocationDropdown(true);
                            }}
                            onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {showLocationDropdown && locationSuggestions.length > 0 && (
                            <ul
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                zIndex: 9999,
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
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        {buttonText}
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
                <style>{`
                  @keyframes hero-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                  @keyframes hero-spin-rev { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
                  .hero-orbit-inner { animation: hero-spin 20s linear infinite; }
                  .hero-orbit-outer { animation: hero-spin-rev 30s linear infinite; }
                  .hero-icon-counter-inner { animation: hero-spin-rev 20s linear infinite; }
                  .hero-icon-counter-outer { animation: hero-spin 30s linear infinite; }
                `}</style>

                {/* Dotted Circle Background */}
                <div className="absolute inset-0 flex items-center justify-center -mt-12">
                  {/* Inner orbit circle */}
                  <div className="hero-orbit-inner w-[22rem] h-[22rem] rounded-full absolute" style={{border: '2px dashed rgba(30,30,30,0.4)'}}>
                    {[
                      { emoji: '🤖', angle: 0 },
                      { emoji: '✨', angle: 90 },
                      { emoji: '🧠', angle: 180 },
                      { emoji: '⚡', angle: 270 },
                    ].map(({ emoji, angle }) => (
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
                        <div className="hero-icon-counter-inner w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center border border-blue-100" style={{fontSize: '1.4rem'}}>
                          {emoji}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Outer orbit circle */}
                  <div className="hero-orbit-outer w-[33rem] h-[33rem] rounded-full absolute" style={{border: '2px dashed rgba(30,30,30,0.3)'}}>
                    {[
                      { emoji: '🎨', label: 'Resume Studio', angle: 0 },
                      { emoji: '💬', label: 'Interview Preparation', angle: 72 },
                      { emoji: '🧭', label: 'Career Guidance', angle: 144 },
                      { emoji: '✅', label: 'Skill Check', angle: 216 },
                      { emoji: '🚀', label: 'Job Search', angle: 288 },
                    ].map(({ emoji, label, angle }) => (
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
                        <div className="hero-icon-counter-outer w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200" style={{fontSize: '1.4rem'}}>
                          {emoji}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <img
                  src={heroImage}
                  alt="Professional woman"
                  className="w-[26rem] h-[32rem] mx-auto object-contain relative z-10 -mt-12"
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
