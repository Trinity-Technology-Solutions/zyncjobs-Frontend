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
  const ref = useRef<HTMLDivElement>(null);
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
      <p className="text-center text-sm text-gray-500 uppercase tracking-widest mb-4 font-semibold">Trusted by top companies</p>
      <div className="overflow-hidden">
        <div className={`marquee-track${paused ? ' paused' : ''}`}>
          {items.map((c, i) => (
            <div
              key={`${c.name}-${i}`}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              className="flex flex-col items-center justify-center mx-8 gap-2 group"
              style={{ minWidth: '110px' }}
            >
              <div className="w-16 h-16 flex items-center justify-center">
                <img
                  src={c.logo}
                  alt={c.name}
                  className="w-16 h-16 object-contain"
                  onError={e => {
                    const img = e.currentTarget;
                    img.style.display = 'none';
                    const span = img.nextElementSibling as HTMLElement;
                    if (span) span.style.display = 'flex';
                  }}
                />
                <span
                  className="w-16 h-16 rounded-lg bg-blue-600 text-white font-bold text-xl items-center justify-center"
                  style={{ display: 'none' }}
                >
                  {c.name[0]}
                </span>
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

  const subtitle = heroData?.subtitle || 'Let AI Find Your Next Move';
  const title = heroData?.title || 'Your Dream Job Is Waiting For You';
  const description = heroData?.description || 'AI career platform for jobs, skills, interview prep, and ATS-ready resumes.';
  const buttonText = heroData?.buttonText || 'Find Job';
  const heroImage = heroData?.heroImage?.url ? strapiAPI.getImageUrl(heroData.heroImage.url) : '/images/women.png';

  return (
    <>
      {/* Main Banner Section */}
      <div className="relative" style={{
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
            <div className="space-y-8 pb-16">
              <div className="space-y-6">
                <h5 className="font-semibold text-lg" style={{color: '#a78bfa'}}>
                  {subtitle}
                </h5>
                <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                  <style>{`
                    @keyframes letter-pop {
                      0% { opacity: 0; transform: translateY(20px); }
                      100% { opacity: 1; transform: translateY(0); }
                    }
                    .anim-letter {
                      display: inline-block;
                      opacity: 0;
                      animation: letter-pop 0.04s ease forwards;
                    }
                  `}</style>
                  {title.split('').map((char, i) => {
                    const dreamStart = title.indexOf('Dream');
                    const dreamEnd = dreamStart + 5;
                    const isBlue = i >= dreamStart && i < dreamEnd;
                    return (
                      <span
                        key={i}
                        className={`anim-letter`}
                        style={isBlue ? {color: '#f97316', animationDelay: `${i * 0.06}s`} : {animationDelay: `${i * 0.06}s`}}
                      >
                        {char === ' ' ? '\u00A0' : char}
                      </span>
                    );
                  })}
                </h1>
                <h6 className="text-base leading-relaxed whitespace-nowrap" style={{color: 'rgba(255,255,255,0.7)'}}>
                  <style>{`
                    @keyframes desc-letter-pop {
                      0% { opacity: 0; transform: translateY(10px); }
                      100% { opacity: 1; transform: translateY(0); }
                    }
                    .anim-desc-letter {
                      display: inline-block;
                      opacity: 0;
                      animation: desc-letter-pop 0.03s ease forwards;
                    }
                  `}</style>
                  {description.split('').map((char, i) => (
                    <span
                      key={i}
                      className="anim-desc-letter"
                      style={{ animationDelay: `${title.length * 0.06 + i * 0.04}s` }}
                    >
                      {char === ' ' ? '\u00A0' : char}
                    </span>
                  ))}
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
                <h4 className="font-semibold" style={{color: 'rgba(255,255,255,0.9)'}}>Popular Searches:</h4>
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
                      className="hover:underline cursor-pointer" style={{color: '#a78bfa'}}
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
                  <div className="hero-orbit-outer w-[33rem] h-[33rem] rounded-full absolute" style={{border: '1.5px dashed rgba(255,255,255,0.7)'}}>
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
                  className="w-full object-contain object-bottom relative z-10"
                  style={{ maxHeight: '580px', display: 'block' }}
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
