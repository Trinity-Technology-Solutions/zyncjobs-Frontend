import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { API_ENDPOINTS } from '../config/env';
import { Search, Filter, MapPin, Star, Users, Code, Mail, Briefcase, Zap, ChevronDown, MessageCircle, Copy } from 'lucide-react';
import CandidateProfileModal from '../components/CandidateProfileModal';
import DirectMessage from '../components/DirectMessage';
import BackButton from '../components/BackButton';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface Candidate {
  _id: string;
  name?: string;
  fullName?: string;
  title?: string;
  jobTitle?: string;
  location?: string;
  skills?: string[];
  experience?: string;
  rating?: number;
  salary?: string;
  availability?: string;
  email?: string;
  profilePhoto?: string;
  profileSummary?: string;
  education?: string;
  languages?: string;
  employment?: any;
  certifications?: any;
  // AI computed
  aiScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  fitLabel?: 'Excellent' | 'Good' | 'Fair' | 'Low';
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
  const [experienceFilter, setExperienceFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [employerJobs, setEmployerJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<'ai_score' | 'name' | 'skills'>('ai_score');
  const [selectedCandidateForMessage, setSelectedCandidateForMessage] = useState<Candidate | null>(null);

  // Close contact menu on outside click
  useEffect(() => {
    if (!openContactMenu) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-contact-menu]')) setOpenContactMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openContactMenu]);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  useEffect(() => {
    if (!user?.email) return;
    fetch(`${API_ENDPOINTS.JOBS}`)
      .then(r => r.ok ? r.json() : [])
      .then((jobs: any[]) => {
        const email = user.email.toLowerCase();
        const mine = jobs.filter(j =>
          (j.postedBy || '').toLowerCase() === email ||
          (j.employerEmail || '').toLowerCase() === email
        );
        setEmployerJobs(mine);
        if (mine.length > 0) setSelectedJob(mine[0]);
      })
      .catch(() => {});
  }, [user]);

  // AI scoring function — pure frontend, no extra API call
  const computeAIScore = (candidate: Candidate, job: any | null): { aiScore: number; matchedSkills: string[]; missingSkills: string[]; fitLabel: Candidate['fitLabel'] } => {
    try {
      if (!job) {
        const fields = ['skills', 'experience', 'location', 'profileSummary', 'education', 'employment', 'certifications', 'languages'];
        const filled = fields.filter(f => {
          const v = (candidate as any)[f];
          return v && (Array.isArray(v) ? v.length > 0 : String(v).trim().length > 0);
        }).length;
        const score = Math.round((filled / fields.length) * 100);
        return { aiScore: score, matchedSkills: [], missingSkills: [], fitLabel: score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : score >= 30 ? 'Fair' : 'Low' };
      }

      const jobSkills: string[] = (Array.isArray(job.skills) ? job.skills : []).map((s: string) => String(s || '').toLowerCase().trim());
      const candSkills: string[] = (Array.isArray(candidate.skills) ? candidate.skills : []).map(s => String(s || '').toLowerCase().trim());

      const matched = jobSkills.filter(js => candSkills.some(cs => cs.includes(js) || js.includes(cs)));
      const missing = jobSkills.filter(js => !candSkills.some(cs => cs.includes(js) || js.includes(cs)));

      const skillScore = jobSkills.length > 0 ? (matched.length / jobSkills.length) * 70 : 35;
      const profileFields = ['experience', 'location', 'profileSummary', 'education'];
      const profileScore = profileFields.filter(f => {
        const v = (candidate as any)[f];
        return v && String(v).trim().length > 0;
      }).length / profileFields.length * 30;

      const total = Math.round(skillScore + profileScore);
      const fitLabel: Candidate['fitLabel'] = total >= 75 ? 'Excellent' : total >= 50 ? 'Good' : total >= 30 ? 'Fair' : 'Low';

      const origMatched = (Array.isArray(job.skills) ? job.skills : []).filter((_: string, i: number) => matched.includes(jobSkills[i]));
      const origMissing = (Array.isArray(job.skills) ? job.skills : []).filter((_: string, i: number) => missing.includes(jobSkills[i]));

      return { aiScore: total, matchedSkills: origMatched, missingSkills: origMissing, fitLabel };
    } catch {
      return { aiScore: 0, matchedSkills: [], missingSkills: [], fitLabel: 'Low' };
    }
  };

  // Client-side filtered + scored + sorted candidates
  const scoredCandidates = useMemo(() => {
    try {
      const q = searchTerm.toLowerCase().trim();
      const skillQ = selectedSkill.toLowerCase().trim();
      const locQ = selectedLocation.toLowerCase().trim();

      const filtered = candidates.filter(c => {
        const name = (c.fullName || c.name || '').toLowerCase();
        const title = (c.jobTitle || c.title || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        const summary = (c.profileSummary || '').toLowerCase();
        const skills = (c.skills || []).map((s: string) => s.toLowerCase());
        const location = (c.location || '').toLowerCase();
        const experience = (c.experience || '').toLowerCase();
        const availability = (c.availability || '').toLowerCase();

        if (q && !name.includes(q) && !title.includes(q) && !email.includes(q) && !summary.includes(q) && !skills.some((s: string) => s.includes(q)))
          return false;
        if (skillQ && !skills.some((s: string) => s.includes(skillQ) || skillQ.includes(s)))
          return false;
        if (locQ && !location.includes(locQ))
          return false;
        if (experienceFilter && !experience.includes(experienceFilter.toLowerCase()))
          return false;
        if (availabilityFilter && !availability.includes(availabilityFilter.toLowerCase()))
          return false;
        return true;
      });

      const withScores = filtered.map(c => ({ ...c, ...computeAIScore(c, selectedJob) }));
      if (sortBy === 'ai_score') return [...withScores].sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0));
      if (sortBy === 'skills') return [...withScores].sort((a, b) => (b.matchedSkills?.length ?? 0) - (a.matchedSkills?.length ?? 0));
      return [...withScores].sort((a, b) =>
        (getCandidateName(a) || '').localeCompare(getCandidateName(b) || '')
      );
    } catch {
      return candidates;
    }
  }, [candidates, searchTerm, selectedSkill, selectedLocation, experienceFilter, availabilityFilter, selectedJob, sortBy]);

  useEffect(() => {
    const loadSkillsAndLocations = async () => {      try {
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

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      let candidatesArray: any[] = [];
      const endpoints = [
        `${API_ENDPOINTS.BASE_URL}/users?role=candidate`,
        `${API_ENDPOINTS.BASE_URL}/profiles`,
        `${API_ENDPOINTS.BASE_URL}/candidates`,
      ];
      for (const url of endpoints) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const arr = Array.isArray(data) ? data : data.candidates || data.profiles || data.users || [];
            if (arr.length > 0) { candidatesArray = arr; break; }
          }
        } catch {}
      }
      const filtered = candidatesArray
        .filter((c: any) => !['employer', 'admin', 'super_admin'].includes(c.userType || c.type || c.role || ''))
        .map((c: any) => ({ ...c, _id: c._id || c.id }));
      setCandidates(filtered);
      setTotalCandidates(filtered.length);
      setLastRefreshed(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  useEffect(() => {
    const interval = setInterval(() => fetchCandidates(), 60000);
    return () => clearInterval(interval);
  }, [fetchCandidates]);

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
                <div className="text-2xl font-bold text-white">
                  {candidates.filter(c => c.profilePhoto && c.skills && c.skills.length > 0).length}+
                </div>
                <div className="text-white/80 text-sm">Verified Profiles</div>
              </div>
              <div className="w-px h-8 bg-white/30"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {lastRefreshed || '--:--'}
                </div>
                <div className="text-white/80 text-sm">Last Refreshed</div>
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
                        const filtered = allSkills.filter(skill =>
                          skill.toLowerCase().includes(e.target.value.toLowerCase())
                        ).slice(0, 50);
                        setSkillSuggestions(filtered);
                        setShowSkillSuggestions(true);
                      }}
                      onFocus={() => {
                        const filtered = selectedSkill
                          ? allSkills.filter(s => s.toLowerCase().includes(selectedSkill.toLowerCase())).slice(0, 50)
                          : allSkills.slice(0, 50);
                        setSkillSuggestions(filtered);
                        setShowSkillSuggestions(true);
                      }}
                      onBlur={() => setTimeout(() => setShowSkillSuggestions(false), 150)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                    />
                    {showSkillSuggestions && skillSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                        const filtered = allLocations.filter(location =>
                          location.toLowerCase().includes(e.target.value.toLowerCase())
                        ).slice(0, 50);
                        setLocationSuggestions(filtered);
                        setShowLocationSuggestions(true);
                      }}
                      onFocus={() => {
                        const filtered = selectedLocation
                          ? allLocations.filter(l => l.toLowerCase().includes(selectedLocation.toLowerCase())).slice(0, 50)
                          : allLocations.slice(0, 50);
                        setLocationSuggestions(filtered);
                        setShowLocationSuggestions(true);
                      }}
                      onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 150)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                    />
                    {showLocationSuggestions && locationSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                  <button onClick={() => fetchCandidates()} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl">
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

        <div className="mb-6">
          {/* AI Insights Bar */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 mb-4 text-white">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-300" />
                <span className="font-semibold text-sm">AI Talent Insights</span>
              </div>
              {/* Job Selector */}
              <div className="relative flex-1 min-w-[200px]">
                <button
                  onClick={() => setShowJobDropdown(!showJobDropdown)}
                  className="w-full flex items-center justify-between bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Briefcase className="w-4 h-4 flex-shrink-0" />
                    {selectedJob ? selectedJob.jobTitle : 'Select a job to rank candidates'}
                  </span>
                  <ChevronDown className="w-4 h-4 flex-shrink-0" />
                </button>
                {showJobDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-52 overflow-y-auto">
                    <button
                      onClick={() => { setSelectedJob(null); setShowJobDropdown(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 border-b"
                    >
                      Profile completeness score (no job)
                    </button>
                    {employerJobs.length === 0 ? (
                      <div className="px-3 py-3 text-sm text-gray-400">No jobs posted yet</div>
                    ) : (
                      employerJobs.map(job => (
                        <button
                          key={job._id}
                          onClick={() => { setSelectedJob(job); setShowJobDropdown(false); }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 border-b last:border-0 ${
                            selectedJob?._id === job._id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
                          }`}
                        >
                          <div className="font-medium">{job.jobTitle}</div>
                          <div className="text-xs text-gray-400">{job.company} · {job.location}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-white/70 text-xs">Sort:</span>
                {(['ai_score', 'skills', 'name'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      sortBy === s ? 'bg-white text-indigo-700' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {s === 'ai_score' ? '🤖 AI Score' : s === 'skills' ? '🎯 Skills' : '🔤 Name'}
                  </button>
                ))}
              </div>
              {/* Summary — always visible */}
              <div className="text-xs text-white/80 ml-auto">
                {scoredCandidates.filter(c => (c.aiScore ?? 0) >= 70).length} excellent matches · {scoredCandidates.filter(c => (c.aiScore ?? 0) >= 50 && (c.aiScore ?? 0) < 70).length} good fits
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
              <div className="text-gray-700 font-medium text-lg">
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Searching candidates...</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-blue-600 font-bold">{scoredCandidates.length}</span>
                    <span className="text-gray-600"> candidate{scoredCandidates.length !== 1 ? 's' : ''} found</span>
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
        ) : scoredCandidates.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 border border-gray-200">
              <Users className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No candidates found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {(searchTerm || selectedSkill || selectedLocation) 
                  ? 'No candidates match your current search criteria. Try adjusting your filters.' 
                  : 'No candidates are currently registered.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedSkill('');
                    setSelectedLocation('');
                    setExperienceFilter('');
                    setAvailabilityFilter('');
                  }}
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {scoredCandidates.map((candidate) => {
              const score = candidate.aiScore ?? 0;
              const fitLabel = candidate.fitLabel ?? 'Low';
              const fitConfig: Record<string, { bg: string; text: string; dot: string }> = {
                Excellent: { bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
                Good:      { bg: 'bg-blue-50 border border-blue-200',    text: 'text-blue-700',    dot: 'bg-blue-500' },
                Fair:      { bg: 'bg-amber-50 border border-amber-200',  text: 'text-amber-700',  dot: 'bg-amber-500' },
                Low:       { bg: 'bg-red-50 border border-red-200',      text: 'text-red-600',    dot: 'bg-red-500' },
              };
              const scoreBarColor = score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-blue-500' : score >= 30 ? 'bg-amber-500' : 'bg-red-400';
              const fit = fitConfig[fitLabel];
              return (
                <div key={candidate._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                  {/* Top section */}
                  <div className="p-5 flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden shadow">
                      {candidate.profilePhoto
                        ? <img src={candidate.profilePhoto} alt={getCandidateName(candidate)} className="w-full h-full object-cover" />
                        : getAvatar(getCandidateName(candidate))}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-base font-bold text-gray-900 leading-tight">{getCandidateName(candidate)}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">{candidate.jobTitle || candidate.title || 'Professional'}</p>
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{getCandidateLocation(candidate)}
                          </p>
                        </div>
                        {/* AI Score */}
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className="relative w-12 h-12">
                            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                              <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                              <circle cx="18" cy="18" r="15" fill="none"
                                stroke={score >= 75 ? '#10b981' : score >= 50 ? '#3b82f6' : score >= 30 ? '#f59e0b' : '#ef4444'}
                                strokeWidth="3"
                                strokeDasharray={`${(score / 100) * 94.2} 94.2`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">{score}%</span>
                          </div>
                          <span className={`mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${fit.bg} ${fit.text}`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${fit.dot}`}></span>
                            {fitLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="mx-5 border-t border-gray-100" />

                  {/* Skills */}
                  <div className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {getCandidateSkills(candidate).slice(0, 5).map((skill, idx) => {
                        const isMatched = candidate.matchedSkills?.map(s => s.toLowerCase()).includes(skill.toLowerCase());
                        return (
                          <span key={idx} className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            isMatched ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {isMatched && <span className="mr-0.5">✓</span>}{skill}
                          </span>
                        );
                      })}
                      {getCandidateSkills(candidate).length > 5 && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">+{getCandidateSkills(candidate).length - 5}</span>
                      )}
                    </div>
                  </div>

                  {/* AI Match bar */}
                  {selectedJob && (
                    <div className="px-5 pb-3">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-600">Match — <span className="text-indigo-600">{selectedJob.jobTitle}</span></span>
                          <span className="text-xs font-bold text-gray-700">{score}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                          <div className={`h-1.5 rounded-full ${scoreBarColor}`} style={{ width: `${score}%` }} />
                        </div>
                        <div className="flex gap-3 text-xs">
                          {(candidate.matchedSkills?.length ?? 0) > 0 && <span className="text-emerald-600 font-medium">✓ {candidate.matchedSkills!.length} matched</span>}
                          {(candidate.missingSkills?.length ?? 0) > 0 && <span className="text-red-500 font-medium">✗ {candidate.missingSkills!.length} missing</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="px-5 pb-5 flex gap-2">
                    <button
                      onClick={() => handleViewProfile(candidate)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                    >
                      View Profile
                    </button>
                    <div className="relative" data-contact-menu>
                      <button
                        onClick={() => setOpenContactMenu(openContactMenu === candidate._id ? null : candidate._id)}
                        className="flex items-center gap-1.5 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        Contact
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openContactMenu === candidate._id ? 'rotate-180' : ''}`} />
                      </button>
                      {openContactMenu === candidate._id && (
                        <div className="absolute bottom-full right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 mb-1 w-48 overflow-hidden">
                          <button onClick={() => { setSelectedCandidateForMessage(candidate); setOpenContactMenu(null); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2 border-b">
                            <MessageCircle className="w-4 h-4 text-gray-400" /> Send Message
                          </button>
                          <button onClick={() => { navigator.clipboard.writeText(candidate.email || ''); window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Email copied!" } })); setOpenContactMenu(null); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2 border-b">
                            <Copy className="w-4 h-4 text-gray-400" /> Copy Email
                          </button>
                          <button onClick={() => {
                            const userData = JSON.parse(localStorage.getItem('user') || '{}');
                            const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
                            if (!token) { window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Please login to save candidates" } })); setOpenContactMenu(null); return; }
                            const payload = {
                              candidateId: candidate._id,
                              fullName: getCandidateName(candidate),
                              name: getCandidateName(candidate),
                              title: candidate.title || candidate.jobTitle || 'Professional',
                              location: getCandidateLocation(candidate),
                              experience: candidate.experience || '',
                              email: candidate.email || '',
                              skills: getCandidateSkills(candidate),
                              profilePhoto: candidate.profilePhoto || '',
                              companyName: userData.companyName || userData.company || '',
                              companyLogo: userData.companyLogo || '',
                            };
                            fetch(`${API_ENDPOINTS.SAVED_CANDIDATES}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) })
                              .then(async res => {
                                if (res.status === 409) {
                                  // Already saved — find the record and remove it
                                  const existing = await fetch(`${API_ENDPOINTS.SAVED_CANDIDATES}`, { headers: { 'Authorization': `Bearer ${token}` } })
                                    .then(r => r.ok ? r.json() : [])
                                    .then(data => {
                                      const list = Array.isArray(data) ? data : data.savedCandidates || [];
                                      return list.find((c: any) => c.candidateId === candidate._id || c.candidateEmail === candidate.email);
                                    })
                                    .catch(() => null);
                                  if (existing) {
                                    const recordId = existing._id || existing.id;
                                    fetch(`${API_ENDPOINTS.SAVED_CANDIDATES}/${recordId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
                                      .then(r => { if (r.ok) { window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Candidate removed from saved list!" } })); window.dispatchEvent(new CustomEvent('candidateSaved')); } else { window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Could not remove candidate." } })); } })
                                      .catch(() => window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Could not remove candidate." } })));
                                  } else {
                                    window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Candidate is already saved." } }));
                                  }
                                  return;
                                }
                                if (res.ok) { window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Candidate saved successfully!" } })); window.dispatchEvent(new CustomEvent('candidateSaved', { detail: payload })); }
                                else { const t = await res.text(); console.error('Save failed:', t); window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Failed to save candidate. Please try again." } })); }
                              })
                              .catch(err => { console.error('Save error:', err); window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Network error. Please try again." } })); });
                            setOpenContactMenu(null);
                          }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2">
                            <Star className="w-4 h-4 text-gray-400" /> Save Candidate
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {scoredCandidates.length > 0 && candidates.length > scoredCandidates.length && (
          <div className="flex justify-center py-4">
            <p className="text-sm text-gray-400">Showing {scoredCandidates.length} of {candidates.length} candidates</p>
          </div>
        )}
      </div>
      

      <CandidateProfileModal
        candidate={selectedCandidate}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {selectedCandidateForMessage && (
        <DirectMessage
          candidateId={selectedCandidateForMessage._id}
          candidateName={getCandidateName(selectedCandidateForMessage)}
          candidateEmail={selectedCandidateForMessage.email || ''}
          employerId={currentUser.id || ''}
          employerName={currentUser.name || currentUser.fullName || ''}
          onClose={() => setSelectedCandidateForMessage(null)}
        />
      )}

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default CandidateSearchPage;

