import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { ArrowLeft, Search, Filter, MapPin, Star, Users, Code, Mail, Phone } from 'lucide-react';
import CandidateProfileModal from '../components/CandidateProfileModal';
import BackButton from '../components/BackButton';
import Header from '../components/Header';

interface Candidate {
  _id: string;
  name?: string;
  fullName?: string;
  title?: string;
  location?: string;
  skills?: string[];
  experience?: string;
  rating?: number;
  salary?: string;
  availability?: string;
  email?: string;
}

interface CandidateSearchPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const CandidateSearchPage: React.FC<CandidateSearchPageProps> = ({ onNavigate, user, onLogout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreCandidates, setHasMoreCandidates] = useState(true);
  const candidatesPerPage = 10;

  // Load all skills and locations on component mount
  useEffect(() => {
    const loadSkillsAndLocations = async () => {
      try {
        // Load skills from skills.json
        const skillsResponse = await fetch('/backend/data/skills.json');
        if (skillsResponse.ok) {
          const skillsData = await skillsResponse.json();
          setAllSkills(skillsData.skills || []);
        }
        
        // Load locations from locations.json
        const locationsResponse = await fetch('/backend/data/locations.json');
        if (locationsResponse.ok) {
          const locationsData = await locationsResponse.json();
          setAllLocations(locationsData.locations || []);
        }
      } catch (error) {
        console.error('Error loading skills and locations:', error);
      }
    };
    
    loadSkillsAndLocations();
  }, []);

  // Fetch candidates from API
  const fetchCandidates = async (page = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedSkill) params.append('skill', selectedSkill);
      if (selectedLocation) params.append('location', selectedLocation);
      params.append('page', page.toString());
      params.append('limit', candidatesPerPage.toString());
      
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/candidates?${params}`);
      if (response.ok) {
        const data = await response.json();
        
        if (append) {
          setCandidates(prev => [...prev, ...data]);
        } else {
          setCandidates(data);
          // If no filters applied, this represents total candidates
          if (!searchTerm && !selectedSkill && !selectedLocation) {
            setTotalCandidates(data.length);
          }
        }
        
        setHasMoreCandidates(data.length === candidatesPerPage);
      } else {
        console.error('Failed to fetch candidates');
        if (!append) setCandidates([]);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      if (!append) setCandidates([]);
    } finally {
      if (!append) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [searchTerm, selectedSkill, selectedLocation]);

  // Refresh candidates every 30 seconds to catch new registrations
  useEffect(() => {
    const interval = setInterval(() => {
      if (!searchTerm && !selectedSkill && !selectedLocation) {
        fetchCandidates();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [searchTerm, selectedSkill, selectedLocation]);

  // Fetch skill suggestions from API
  const fetchSkillSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSkillSuggestions([]);
      return;
    }
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/autocomplete/skills?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const suggestions = await response.json();
        setSkillSuggestions(suggestions);
      }
    } catch (error) {
      console.error('Error fetching skill suggestions:', error);
    }
  };

  // Fetch location suggestions from API
  const fetchLocationSuggestions = async (query: string) => {
    if (query.length < 2) {
      setLocationSuggestions([]);
      return;
    }
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/autocomplete/locations?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const suggestions = await response.json();
        setLocationSuggestions(suggestions);
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
    }
  };

  // Get avatar initials from name
  const getAvatar = (name: string) => {
    return name ? name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'NA';
  };

  // Get candidate name (handle both fullName and name fields)
  const getCandidateName = (candidate: Candidate) => {
    return candidate.fullName || candidate.name || 'Anonymous';
  };

  // Get candidate location
  const getCandidateLocation = (candidate: Candidate) => {
    return candidate.location || 'Location not specified';
  };

  // Get candidate skills
  const getCandidateSkills = (candidate: Candidate) => {
    const skills = candidate.skills || [];
    return skills.length > 0 ? skills : ['No skills listed'];
  };

  const handleViewProfile = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCandidate(null);
  };

  const handleLoadMoreCandidates = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchCandidates(nextPage, true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackButton 
          onClick={() => onNavigate && onNavigate('dashboard')}
          text="Back to Dashboard"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors mb-6"
        />
        <div className="text-center mb-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight">
              Find Top Tech Talent 
              <span className="inline-block ml-2">🎯</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed">
              Browse our pool of verified tech professionals and find the perfect candidates for your team
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center space-x-2 bg-white/60 px-4 py-2 rounded-full">
                <Users className="w-4 h-4" />
                <span>{totalCandidates || 0} Active Candidate{totalCandidates !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/60 px-4 py-2 rounded-full">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>Verified Profiles</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/60 px-4 py-2 rounded-full">
                <Code className="w-4 h-4" />
                <span>Real-time Updates</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-gray-200 shadow-lg">
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 font-medium"
              />
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search skills (e.g., Python, React, AWS)..."
                value={selectedSkill}
                onChange={(e) => {
                  setSelectedSkill(e.target.value);
                  if (e.target.value.length >= 1) {
                    const filtered = allSkills.filter(skill => 
                      skill.toLowerCase().includes(e.target.value.toLowerCase())
                    ).slice(0, 10);
                    setSkillSuggestions(filtered);
                    setShowSkillSuggestions(true);
                  } else {
                    setShowSkillSuggestions(false);
                  }
                }}
                onFocus={() => {
                  if (selectedSkill.length >= 1) {
                    const filtered = allSkills.filter(skill => 
                      skill.toLowerCase().includes(selectedSkill.toLowerCase())
                    ).slice(0, 10);
                    setSkillSuggestions(filtered);
                    setShowSkillSuggestions(true);
                  }
                }}
                onBlur={() => setTimeout(() => setShowSkillSuggestions(false), 200)}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
              />
              {showSkillSuggestions && skillSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {skillSuggestions.map((skill, index) => (
                    <button
                      key={index}
                      type="button"
                      onMouseDown={() => {
                        setSelectedSkill(skill);
                        setShowSkillSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm border-b last:border-b-0 transition-colors"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search locations (e.g., Mumbai, Remote, Bangalore)..."
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  if (e.target.value.length >= 1) {
                    const filtered = allLocations.filter(location => 
                      location.toLowerCase().includes(e.target.value.toLowerCase())
                    ).slice(0, 10);
                    setLocationSuggestions(filtered);
                    setShowLocationSuggestions(true);
                  } else {
                    setShowLocationSuggestions(false);
                  }
                }}
                onFocus={() => {
                  if (selectedLocation.length >= 1) {
                    const filtered = allLocations.filter(location => 
                      location.toLowerCase().includes(selectedLocation.toLowerCase())
                    ).slice(0, 10);
                    setLocationSuggestions(filtered);
                    setShowLocationSuggestions(true);
                  }
                }}
                onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
              />
              {showLocationSuggestions && locationSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {locationSuggestions.map((location, index) => (
                    <button
                      key={index}
                      type="button"
                      onMouseDown={() => {
                        setSelectedLocation(location);
                        setShowLocationSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm border-b last:border-b-0 transition-colors"
                    >
                      {location}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl">
              <Filter className="w-5 h-5" />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
              <div className="text-gray-700 font-medium text-lg">
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Searching candidates...</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-blue-600 font-bold">{candidates.length}</span> 
                    <span className="text-gray-600">candidate{candidates.length !== 1 ? 's' : ''} found</span>
                    {(searchTerm || selectedSkill || selectedLocation) && (
                      <span className="ml-2 text-gray-500">
                        {searchTerm && ` matching "${searchTerm}"`}
                        {selectedSkill && ` with ${selectedSkill} skills`}
                        {selectedLocation && ` in ${selectedLocation}`}
                      </span>
                    )}
                  </div>
                )}
              </div>
          </div>
        </div>

        {/* Candidates Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <p className="text-gray-500 text-lg">Loading candidates...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 border border-gray-200">
              <Users className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No candidates found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {(searchTerm || selectedSkill || selectedLocation) 
                  ? 'No candidates match your current search criteria. Try adjusting your filters.' 
                  : 'No candidates are currently registered. Be the first to join our talent pool!'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => onNavigate('register')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Register as Candidate
                </button>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedSkill('');
                    setSelectedLocation('');
                  }}
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {candidates.map((candidate) => (
            <div key={candidate._id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 hover:shadow-2xl hover:bg-white/90 transition-all duration-300 group">
              <div className="flex items-start space-x-6 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform">
                  {getAvatar(getCandidateName(candidate))}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 truncate">{getCandidateName(candidate)}</h3>
                  <p className="text-blue-600 font-semibold text-lg mb-3">{candidate.title}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{getCandidateLocation(candidate)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{candidate.experience || '2+ years'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-medium">{candidate.rating}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-600 font-medium">{candidate.availability}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <Code className="w-5 h-5 text-blue-600" />
                  <span>Technical Skills</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {getCandidateSkills(candidate).slice(0, 6).map((skill, index) => (
                    <span 
                      key={index} 
                      className={skill === 'No skills listed' 
                        ? 'text-gray-500 text-sm italic' 
                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 px-3 py-2 rounded-full text-sm font-medium border border-blue-200 hover:bg-blue-100 transition-colors'
                      }
                    >
                      {skill}
                    </span>
                  ))}
                  {getCandidateSkills(candidate).length > 6 && (
                    <span className="text-gray-500 text-sm font-medium px-3 py-2">
                      +{getCandidateSkills(candidate).length - 6} more
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Expected Salary</p>
                    <p className="font-bold text-green-600 text-lg">{candidate.salary}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Availability</p>
                    <p className="font-semibold text-gray-900">{candidate.availability}</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button 
                  onClick={() => candidate.email && (window.location.href = `mailto:${candidate.email}`)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <Mail className="w-5 h-5" />
                  <span>Contact</span>
                </button>
                <button 
                  onClick={() => handleViewProfile(candidate)}
                  className="flex-1 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Users className="w-5 h-5" />
                  <span>View Profile</span>
                </button>
              </div>
            </div>
            ))}
          </div>
        )}

        {candidates.length > 0 && hasMoreCandidates && (
          <div className="text-center mt-12">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 inline-block">
              <p className="text-gray-600 mb-4">Showing {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}</p>
              <button 
                onClick={handleLoadMoreCandidates}
                className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-8 py-4 rounded-xl font-semibold hover:from-gray-900 hover:to-black transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-3 mx-auto"
              >
                <Users className="w-5 h-5" />
                <span>Load More Candidates</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      <CandidateProfileModal
        candidate={selectedCandidate}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default CandidateSearchPage;