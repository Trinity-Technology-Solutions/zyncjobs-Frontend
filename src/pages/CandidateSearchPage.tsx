import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/env';
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
  profilePhoto?: string;
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
  const [openContactMenu, setOpenContactMenu] = useState<string | null>(null);
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreCandidates, setHasMoreCandidates] = useState(true);
  const candidatesPerPage = 10;

  useEffect(() => {
    const loadSkillsAndLocations = async () => {
      try {
        const skillsResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/autocomplete/skills`);
        if (skillsResponse.ok) {
          const skillsData = await skillsResponse.json();
          setAllSkills(Array.isArray(skillsData) ? skillsData : skillsData.skills || []);
        }
        
        const locationsResponse = await fetch(`${API_ENDPOINTS.BASE_URL}/autocomplete/locations`);
        if (locationsResponse.ok) {
          const locationsData = await locationsResponse.json();
          setAllLocations(Array.isArray(locationsData) ? locationsData : locationsData.locations || []);
        }
      } catch (error) {
        console.error('Error loading skills and locations:', error);
      }
    };
    
    loadSkillsAndLocations();
  }, []);

  const fetchCandidates = async (page = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedSkill) params.append('skill', selectedSkill);
      if (selectedLocation) params.append('location', selectedLocation);
      params.append('page', page.toString());
      params.append('limit', candidatesPerPage.toString());
      
      // Try to fetch from profiles endpoint first (has complete data)
      let response = await fetch(`${API_ENDPOINTS.BASE_URL}/profiles?${params}`);
      
      // Fallback to candidates endpoint if profiles not available
      if (!response.ok) {
        response = await fetch(`${API_ENDPOINTS.BASE_URL}/candidates?${params}`);
      }
      
      if (response.ok) {
        const data = await response.json();
        const candidatesArray = Array.isArray(data) ? data : data.candidates || data.profiles || [];
        
        // Filter out employer/admin accounts - only show candidates
        const filteredCandidates = candidatesArray.filter((c: any) => 
          c.userType !== 'employer' && c.userType !== 'admin' && c.type !== 'employer'
        );
        
        if (append) {
          setCandidates(prev => [...prev, ...filteredCandidates]);
        } else {
          setCandidates(filteredCandidates);
          if (!searchTerm && !selectedSkill && !selectedLocation) {
            setTotalCandidates(filteredCandidates.length);
          }
        }
        
        setHasMoreCandidates(filteredCandidates.length === candidatesPerPage);
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

  useEffect(() => {
    const interval = setInterval(() => {
      if (!searchTerm && !selectedSkill && !selectedLocation) {
        fetchCandidates();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [searchTerm, selectedSkill, selectedLocation]);

  const getAvatar = (name: string) => {
    return name ? name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'NA';
  };

  const getCandidateName = (candidate: Candidate) => {
    return candidate.fullName || candidate.name || 'Anonymous';
  };

  const getCandidateLocation = (candidate: Candidate) => {
    return candidate.location || 'Location not specified';
  };

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
      
      {/* Hero Header Section */}
      <div className="relative bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M25 25m-20 0a20 20 0 1 1 40 0a20 20 0 1 1 -40 0'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 left-1/4 w-16 h-16 bg-white/10 rounded-full blur-lg animate-pulse delay-500"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <BackButton 
            onClick={() => onNavigate && onNavigate('dashboard')}
            text="Back to Dashboard"
            className="inline-flex items-center text-sm text-white/80 hover:text-white transition-colors mb-6 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm"
          />
          
          <div className="text-center">
            {/* Talent Icons */}
            <div className="flex justify-center items-center mb-6">
              <div className="flex -space-x-2">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <Code className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
              Find Top Tech Talent 🎯
            </h1>
            <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto drop-shadow">
              Browse our pool of verified tech professionals and find the perfect candidates for your team
            </p>
            
            {/* Stats */}
            <div className="flex justify-center items-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{totalCandidates || candidates.length || 0}+</div>
                <div className="text-white/80 text-sm">Active Candidates</div>
              </div>
              <div className="w-px h-8 bg-white/30"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-white/80 text-sm">Verified Profiles</div>
              </div>
              <div className="w-px h-8 bg-white/30"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-white/80 text-sm">Real-time Updates</div>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg">
                <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search candidates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 font-medium"
                    />
                  </div>
                  <div className="relative">
                    <Code className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Skills (e.g., Python, React)..."
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
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
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
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Location (e.g., Mumbai, Remote)..."
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
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
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
                  <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl">
                    <Filter className="w-5 h-5" />
                    <span>Search Talent</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

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
          <div className="grid lg:grid-cols-2 gap-4">
            {candidates.map((candidate) => (
            <div key={candidate._id} className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className="h-28 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 relative overflow-hidden flex items-center px-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-white overflow-hidden">
                  {candidate.profilePhoto ? (
                    <img src={candidate.profilePhoto} alt={getCandidateName(candidate)} className="w-full h-full object-cover" />
                  ) : (
                    getAvatar(getCandidateName(candidate))
                  )}
                </div>
              </div>
              <div className="px-6 py-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{getCandidateName(candidate)}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-bold text-gray-900 text-sm">{candidate.rating || '5.0'}</span>
                      <span className="text-gray-500 text-xs">(174 reviews)</span>
                    </div>
                    <p className="text-gray-600 text-xs mt-1">Male, 30</p>
                  </div>
                  <button onClick={() => handleViewProfile(candidate)} className="bg-blue-600 text-white px-4 py-1 rounded text-sm font-semibold hover:bg-blue-700 transition-colors">
                    View Profile
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-200 text-xs">
                  <div>
                    <p className="text-gray-600 font-medium">Location:</p>
                    <p className="text-gray-900">{getCandidateLocation(candidate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Slack ID:</p>
                    <p className="text-gray-900">UORLM4TP71</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2 text-sm">About me</h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-gray-900">Title:</span>
                      <p className="text-gray-700">{candidate.jobTitle || candidate.title || 'Professional'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Experience:</span>
                      <p className="text-gray-700">{candidate.experience || '2+ years'}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Skills:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {getCandidateSkills(candidate).slice(0, 6).map((skill, index) => (
                          <span key={index} className="text-blue-600 text-xs font-medium bg-blue-50 px-2 py-1 rounded">
                            {skill}
                          </span>
                        ))}
                        {getCandidateSkills(candidate).length > 6 && (
                          <span className="text-blue-600 text-xs font-medium">+{getCandidateSkills(candidate).length - 6} more</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative mt-4">
                  <button onClick={() => setOpenContactMenu(openContactMenu === candidate._id ? null : candidate._id)} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl">
                    <Mail className="w-5 h-5" />
                    <span>Contact Candidate</span>
                    <svg className={`w-4 h-4 ml-auto transition-transform ${openContactMenu === candidate._id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>
                  {openContactMenu === candidate._id && (
                    <div className="absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mb-2">
                      <button onClick={() => candidate.email && (window.location.href = `mailto:${candidate.email}`)} className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm border-b transition-colors flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>Send Email</span>
                      </button>
                      <button onClick={() => {
                        setSelectedCandidate(candidate);
                        setIsModalOpen(true);
                        setOpenContactMenu(null);
                      }} className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm border-b transition-colors flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>Schedule Interview</span>
                      </button>
                      <button onClick={() => {
                        navigator.clipboard.writeText(candidate.email || '');
                        alert('Email copied to clipboard!');
                        setOpenContactMenu(null);
                      }} className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm border-b transition-colors flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Copy Email</span>
                      </button>
                      <button onClick={() => {
                        const userData = JSON.parse(localStorage.getItem('user') || '{}');
                        const candidateData = {
                          candidateId: candidate._id,
                          candidateName: getCandidateName(candidate),
                          candidateTitle: candidate.title || 'Professional',
                          candidateLocation: getCandidateLocation(candidate),
                          candidateExperience: candidate.experience || '2+ years',
                          candidateEmail: candidate.email,
                          candidateSkills: getCandidateSkills(candidate),
                          candidatePhoto: candidate.profilePhoto,
                          companyName: userData.company || userData.companyName || 'Company',
                          companyLogo: userData.companyLogo || ''
                        };
                        
                        const token = localStorage.getItem('token');
                        
                        fetch(`${API_ENDPOINTS.SAVED_CANDIDATES}`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify(candidateData)
                        })
                        .then(res => {
                          if (res.status === 409) {
                            // Already saved, remove it
                            return fetch(`${API_ENDPOINTS.SAVED_CANDIDATES}/${candidate._id}`, {
                              method: 'DELETE',
                              headers: {
                                'Authorization': `Bearer ${token}`
                              }
                            }).then(() => {
                              alert('Candidate removed from saved list!');
                            });
                          } else if (res.ok) {
                            alert('Candidate saved successfully! View in Employer Dashboard > Saved Candidates');
                          } else {
                            throw new Error('Failed to save candidate');
                          }
                        })
                        .catch(err => {
                          console.error('Error saving candidate:', err);
                          alert('Failed to save candidate. Please try again.');
                        });
                        setOpenContactMenu(null);
                      }} className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm transition-colors flex items-center space-x-2">
                        <Star className="w-4 h-4" />
                        <span>Save Candidate</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            ))}
          </div>
        )}

        {candidates.length > 0 && hasMoreCandidates && (
          <div className="flex justify-center py-8">
            <button
              onClick={handleLoadMoreCandidates}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Load More Candidates
            </button>
          </div>
        )}
      </div>
      

    </div>
  );
};

export default CandidateSearchPage;
