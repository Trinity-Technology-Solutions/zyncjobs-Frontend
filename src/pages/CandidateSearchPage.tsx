import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { API_ENDPOINTS } from '../config/env';
import { Search, Filter, MapPin, Star, Users, Code, Mail, Briefcase, Zap, ChevronDown, MessageCircle, Copy, Target, CheckCircle, Bot } from 'lucide-react';
import { tokenStorage } from '../utils/tokenStorage';
import DirectMessage from '../components/DirectMessage';
import BackButton from '../components/BackButton';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CandidateProfileView from './CandidateProfileView';
import { apiFetch } from '../api/apiFetch';
import { searchAccuracy } from '../utils/searchAccuracy';

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
  resumeUrl?: string;
  // AI computed
  aiScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  fitLabel?: 'Excellent' | 'Good' | 'Fair' | 'Low';
  _bestJob?: any;
}

interface CandidateSearchPageProps {
  onNavigate: (page: string, params?: any) => void;
  user?: any;
  onLogout?: () => void;
}

const CandidateSearchPage: React.FC<CandidateSearchPageProps> = ({ onNavigate, user, onLogout }) => {
  const [viewingCandidateId, setViewingCandidateId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [loading, setLoading] = useState(true);
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
  const token = tokenStorage.getAccess() || tokenStorage.getAdmin();
  useEffect(() => {
    fetch(`${API_ENDPOINTS.JOBS}`)
      .then(r => r.ok ? r.json() : [])
      .then((jobs: any[]) => {
        const allJobs = Array.isArray(jobs) ? jobs : jobs.jobs || [];
        if (!user?.email) {
          setEmployerJobs(allJobs);
          if (allJobs.length > 0) setSelectedJob(allJobs[0]);
          return;
        }
        const email = user.email.toLowerCase();
        const mine = allJobs.filter((j: any) =>
          (j.postedBy || '').toLowerCase() === email ||
          (j.employerEmail || '').toLowerCase() === email ||
          (j.createdBy || '').toLowerCase() === email ||
          (j.userId || '').toLowerCase() === email
        );
        const jobsToUse = mine.length > 0 ? mine : allJobs;
        setEmployerJobs(jobsToUse);
        if (jobsToUse.length > 0) setSelectedJob(jobsToUse[0]);
      })
      .catch(() => {});
  }, [user]);

  // AI scoring function — pure frontend, no extra API call
  const computeAIScore = (candidate: Candidate, job: any | null): { aiScore: number; matchedSkills: string[]; missingSkills: string[]; fitLabel: Candidate['fitLabel']; bestJob: any } => {
    try {
      const candSkills: string[] = (Array.isArray(candidate.skills) ? candidate.skills : []).map(s => String(s || '').toLowerCase().trim()).filter(Boolean);

      const scoreAgainstJob = (j: any) => {
        const rawJobSkills: string[] = Array.isArray(j.skills) ? j.skills : [];
        const matched: string[] = [];
        const missing: string[] = [];
        rawJobSkills.forEach((js: string) => {
          const jsLower = String(js || '').toLowerCase().trim();
          if (!jsLower) return;
          const isMatch = candSkills.some(cs => cs.includes(jsLower) || jsLower.includes(cs));
          if (isMatch) matched.push(js);
          else missing.push(js);
        });
        const skillScore = rawJobSkills.length > 0 ? (matched.length / rawJobSkills.length) * 70 : 0;
        const profileFields = ['experience', 'location', 'profileSummary', 'education'];
        const profileScore = profileFields.filter(f => {
          const v = (candidate as any)[f];
          return v && String(v).trim().length > 0;
        }).length / profileFields.length * 30;
        return { score: Math.round(skillScore + profileScore), matched, missing };
      };

      // If a specific job is selected, score against it
      if (job) {
        const { score, matched, missing } = scoreAgainstJob(job);
        const fitLabel: Candidate['fitLabel'] = score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : score >= 30 ? 'Fair' : 'Low';
        return { aiScore: score, matchedSkills: matched, missingSkills: missing, fitLabel, bestJob: job };
      }

      // No job selected — find best match across all employer jobs
      if (employerJobs.length > 0) {
        let best = { score: 0, matched: [] as string[], missing: [] as string[], job: employerJobs[0] };
        for (const j of employerJobs) {
          const { score, matched, missing } = scoreAgainstJob(j);
          if (score > best.score) best = { score, matched, missing, job: j };
        }
        const fitLabel: Candidate['fitLabel'] = best.score >= 75 ? 'Excellent' : best.score >= 50 ? 'Good' : best.score >= 30 ? 'Fair' : 'Low';
        return { aiScore: best.score, matchedSkills: best.matched, missingSkills: best.missing, fitLabel, bestJob: best.job };
      }

      // Fallback: profile completeness
      const fields = ['skills', 'experience', 'location', 'profileSummary', 'education'];
      const filled = fields.filter(f => { const v = (candidate as any)[f]; return v && (Array.isArray(v) ? v.length > 0 : String(v).trim().length > 0); }).length;
      const score = Math.round((filled / fields.length) * 100);
      return { aiScore: score, matchedSkills: [], missingSkills: [], fitLabel: score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : score >= 30 ? 'Fair' : 'Low', bestJob: null };
    } catch {
      return { aiScore: 0, matchedSkills: [], missingSkills: [], fitLabel: 'Low', bestJob: null };
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

        if (q && !name.includes(q) && !title.includes(q) && !email.includes(q) && !summary.includes(q) && !skills.some((s: string) => s.includes(q))) return false;
        if (skillQ && !skills.some((s: string) => s.includes(skillQ) || skillQ.includes(s))) return false;
        if (locQ && !location.includes(locQ)) return false;
        if (experienceFilter && !experience.includes(experienceFilter.toLowerCase())) return false;
        if (availabilityFilter && !availability.includes(availabilityFilter.toLowerCase())) return false;
        return true;
      });

      const withScores = filtered.map(c => { const scored = computeAIScore(c, selectedJob); return { ...c, ...scored, _bestJob: scored.bestJob }; });
      if (sortBy === 'ai_score') return [...withScores].sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0));
      if (sortBy === 'skills') return [...withScores].sort((a, b) => (b.matchedSkills?.length ?? 0) - (a.matchedSkills?.length ?? 0));
      return [...withScores].sort((a, b) =>
        (getCandidateName(a) || '').localeCompare(getCandidateName(b) || '')
      );
    } catch {
      return candidates;
    }
  }, [candidates, searchTerm, selectedSkill, selectedLocation, experienceFilter, availabilityFilter, selectedJob, sortBy, employerJobs]);

  useEffect(() => {
    const loadSkillsAndLocations = async () => {      try {
        const skillsResponse = await apiFetch(`${API_ENDPOINTS.BASE_URL}/autocomplete/skills`);
        if (skillsResponse.ok) {
          const skillsData = await skillsResponse.json();
          setAllSkills(Array.isArray(skillsData) ? skillsData : skillsData.skills || []);
        }
        
        const locationsResponse = await apiFetch(`${API_ENDPOINTS.BASE_URL}/autocomplete/locations`);
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
          const res = await apiFetch(url);
          if (res.ok) {
            const data = await res.json();
            const arr = Array.isArray(data) ? data : data.candidates || data.profiles || data.users || [];
            if (arr.length > 0) { candidatesArray = arr; break; }
          }
        } catch {}
      }
      const filtered = candidatesArray
        .filter((c: any) => !['employer', 'admin', 'super_admin'].includes(c.userType || c.type || c.role || ''))
        .map((c: any) => {
          const rawPhoto = c.profilePhoto || c.photo || c.avatar || c.image || '';
          let profilePhoto = '';
          
          if (rawPhoto) {
            if (rawPhoto.startsWith('http') || rawPhoto.startsWith('data:')) {
              // Already a complete URL or data URL
              profilePhoto = rawPhoto;
            } else {
              // Construct full URL
              const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace('/api', '');
              const cleanPath = rawPhoto.startsWith('/') ? rawPhoto : `/${rawPhoto}`;
              profilePhoto = `${BASE}${cleanPath}`;
            }
          }
          
          const resumeUrl = c.resumeUrl ||
            (c.resume && typeof c.resume === 'object'
              ? (c.resume.url || c.resume.fileUrl || (c.resume.filename ? `${API_ENDPOINTS.BASE_URL}/uploads/${c.resume.filename}` : ''))
              : c.resume) || '';
          // Normalize skills from any possible field name into a single `skills` array
          const rawSkills = c.skills || c.skillSet || c.skill_set || c.keySkills || c.tags || [];
          let skills: string[] = [];
          if (Array.isArray(rawSkills)) {
            skills = rawSkills.map((s: any) => (typeof s === 'object' && s !== null ? s.name || s.label || String(s) : String(s))).filter(Boolean);
          } else if (typeof rawSkills === 'string' && rawSkills.trim()) {
            // Handle JSON stringified array: '["React","Node.js"]'
            if (rawSkills.trim().startsWith('[')) {
              try { skills = JSON.parse(rawSkills).map((s: any) => String(s)).filter(Boolean); } catch { skills = rawSkills.split(',').map((s: string) => s.trim()).filter(Boolean); }
            } else {
              skills = rawSkills.split(',').map((s: string) => s.trim()).filter(Boolean);
            }
          }
          return { ...c, _id: c._id || c.id, profilePhoto, resumeUrl, skills };
        });
      setCandidates(filtered);
      setTotalCandidates(filtered.length);
      setLastRefreshed(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
      
      // Track search appearances for all candidates that appear in results
      if (filtered.length > 0 && (searchTerm || selectedSkill || selectedLocation)) {
        const searchQuery = [searchTerm, selectedSkill, selectedLocation].filter(Boolean).join(' ');
        
        // Track search appearance for each candidate
        filtered.forEach(async (candidate: any) => {
          if (candidate.email) {
            try {
              await apiFetch(`${API_ENDPOINTS.BASE_URL}/analytics-tracking/track/search-appearance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: candidate._id || candidate.id,
                  email: candidate.email,
                  searchQuery: searchQuery,
                  keyword: searchQuery
                })
              });
            } catch (error) {
              console.log('Search appearance tracking failed:', error);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedSkill, selectedLocation]);

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
    return skills;
  };

  const handleViewProfile = (candidate: Candidate) => {
    const cid = candidate.email || candidate._id || '';
    if (!cid) return;
    
    // Track profile view
    if (candidate.email) {
      apiFetch(`${API_ENDPOINTS.BASE_URL}/analytics-tracking/track/profile-view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: candidate._id,
          email: candidate.email,
          viewedBy: user?.email || 'employer'
        })
      }).catch(error => console.log('Profile view tracking failed:', error));
    }
    
    sessionStorage.setItem('viewCandidateId', cid);
    sessionStorage.setItem('viewCandidateData', JSON.stringify({
      name: getCandidateName(candidate),
      email: candidate.email || '',
      skills: candidate.skills || [],
      resumeUrl: candidate.resumeUrl || '',
    }));
    setViewingCandidateId(cid);
  };

return (
    <div className="min-h-screen bg-gray-50">
      {viewingCandidateId && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-white">
          <CandidateProfileView
            candidateId={viewingCandidateId}
            onNavigate={onNavigate}
            onBack={() => setViewingCandidateId(null)}
          />
        </div>
      )}
      {!viewingCandidateId && (
      <><Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      {/* Hero Header Section */}
      <div className="relative bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M25 25m-20 0a20 20 0 1 1 40 0a20 20 0 1 1 -40 0'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse hidden sm:block"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000 hidden lg:block"></div>
        <div className="absolute bottom-10 left-1/4 w-16 h-16 bg-white/10 rounded-full blur-lg animate-pulse delay-500 hidden md:block"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            {/* Talent Icons */}
            <div className="flex justify-center items-center mb-4 sm:mb-6">
              <div className="flex -space-x-2">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <Users className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                </div>
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <Star className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                </div>
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <Code className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <span>Find Top Talent That Hits Different</span>
              <Target className="w-6 sm:w-8 h-6 sm:h-8" />
            </h1>
            <p className="text-base sm:text-lg text-white/90 mb-4 sm:mb-6 max-w-2xl mx-auto drop-shadow flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
              <span>Browse our pool of verified professionals and find the perfect candidates for your team</span>
              <Users className="w-4 sm:w-5 h-4 sm:h-5" />
            </p>
            
            {/* Stats */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 mb-6 sm:mb-8">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-2">
                  <Target className="w-5 sm:w-6 h-5 sm:h-6" />
                  Quality
                </div>
                <div className="text-white/80 text-sm">Talent Pool</div>
              </div>
              <div className="w-8 sm:w-px h-px sm:h-8 bg-white/30"></div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 sm:w-6 h-5 sm:h-6" />
                  Verified
                </div>
                <div className="text-white/80 text-sm">Profiles</div>
              </div>
              <div className="w-8 sm:w-px h-px sm:h-8 bg-white/30"></div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-2">
                  <Bot className="w-5 sm:w-6 h-5 sm:h-6" />
                  AI-Powered
                </div>
                <div className="text-white/80 text-sm">Matching</div>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/30 shadow-lg">
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search candidates"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <Code className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Skills (e.g., Python)"
                        value={selectedSkill}
                        onChange={(e) => {
                          setSelectedSkill(e.target.value);
                          if (e.target.value.length >= 1) {
                            const filtered = searchAccuracy.getAccurateMatches(
                              e.target.value, 
                              allSkills, 
                              'skill'
                            ).slice(0, 12).map(m => m.item);
                            setSkillSuggestions(filtered);
                            setShowSkillSuggestions(true);
                          } else {
                            const popularSkills = ['JavaScript', 'Python', 'React', 'Java', 'Node.js', 'Angular', 'SQL', 'HTML', 'CSS', 'AWS'];
                            setSkillSuggestions(popularSkills);
                            setShowSkillSuggestions(true);
                          }
                        }}
                        onFocus={() => {
                          if (selectedSkill) {
                            const filtered = searchAccuracy.getAccurateMatches(
                              selectedSkill, 
                              allSkills, 
                              'skill'
                            ).slice(0, 12).map(m => m.item);
                            setSkillSuggestions(filtered);
                          } else {
                            const popularSkills = ['JavaScript', 'Python', 'React', 'Java', 'Node.js', 'Angular', 'SQL', 'HTML', 'CSS', 'AWS'];
                            setSkillSuggestions(popularSkills);
                          }
                          setShowSkillSuggestions(true);
                        }}
                        onBlur={() => setTimeout(() => setShowSkillSuggestions(false), 150)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm"
                      />
                      {showSkillSuggestions && skillSuggestions.length > 0 && (
                        <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-xl overflow-hidden" style={{maxHeight: '152px'}}>
                          <div className="overflow-y-auto" style={{maxHeight: '152px'}}>
                            {skillSuggestions.map((skill, index) => (
                              <button
                                key={index}
                                type="button"
                                onMouseDown={() => {
                                  setSelectedSkill(skill);
                                  setShowSkillSuggestions(false);
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-blue-50 hover:text-blue-700 text-sm text-gray-800 font-medium transition-colors border-b border-gray-100 last:border-b-0"
                              >
                                <span className="flex items-center gap-2">
                                  <Code className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                  {skill}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Location (e.g., Mumbai)"
                        value={selectedLocation}
                        onChange={(e) => {
                          setSelectedLocation(e.target.value);
                          if (e.target.value.length >= 1) {
                            const filtered = searchAccuracy.getLocationMatches(
                              e.target.value, 
                              allLocations
                            ).slice(0, 12);
                            setLocationSuggestions(filtered);
                            setShowLocationSuggestions(true);
                          } else {
                            const popularLocations = ['Remote', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Gurgaon', 'Noida', 'Kolkata'];
                            setLocationSuggestions(popularLocations);
                            setShowLocationSuggestions(true);
                          }
                        }}
                        onFocus={() => {
                          if (selectedLocation) {
                            const filtered = searchAccuracy.getLocationMatches(
                              selectedLocation, 
                              allLocations
                            ).slice(0, 12);
                            setLocationSuggestions(filtered);
                          } else {
                            const popularLocations = ['Remote', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Gurgaon', 'Noida', 'Kolkata'];
                            setLocationSuggestions(popularLocations);
                          }
                          setShowLocationSuggestions(true);
                        }}
                        onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 150)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm"
                      />
                      {showLocationSuggestions && locationSuggestions.length > 0 && (
                        <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-xl overflow-hidden" style={{maxHeight: '152px'}}>
                          <div className="overflow-y-auto" style={{maxHeight: '152px'}}>
                            {locationSuggestions.map((location, index) => (
                              <button
                                key={index}
                                type="button"
                                onMouseDown={() => {
                                  setSelectedLocation(location);
                                  setShowLocationSuggestions(false);
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-blue-50 hover:text-blue-700 text-sm text-gray-800 font-medium transition-colors border-b border-gray-100 last:border-b-0"
                              >
                                <span className="flex items-center gap-2">
                                  <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                  {location}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => fetchCandidates()} className="w-full sm:w-auto sm:self-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-md">
                    <Filter className="w-4 h-4" />
                    <span>Search Candidates</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        <div className="mb-4 sm:mb-6">
          {/* AI Insights Bar */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 text-white">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-300" />
                <span className="font-semibold text-sm">AI Talent Insights</span>
              </div>
              {/* Job Selector */}
              <div className="relative flex-1 w-full lg:min-w-[200px]">
                <button
                  onClick={() => setShowJobDropdown(!showJobDropdown)}
                  className="w-full flex items-center justify-between bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Briefcase className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{selectedJob ? selectedJob.jobTitle : 'Select a job to rank candidates'}</span>
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
                          <div className="font-medium truncate">{job.jobTitle}</div>
                          <div className="text-xs text-gray-400 truncate">{job.company} · {job.location}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {/* Sort */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto">
                <span className="text-white/70 text-xs">Sort:</span>
                <div className="flex flex-wrap gap-2">
                  {(['ai_score', 'skills', 'name'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s)}
                      className={`text-xs px-2 sm:px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5 ${
                        sortBy === s ? 'bg-white text-indigo-700' : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      {s === 'ai_score' ? (
                        <><Bot className="w-3.5 h-3.5" /> <span className="hidden sm:inline">AI Score</span><span className="sm:hidden">AI</span></>
                      ) : s === 'skills' ? (
                        <><Target className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Skills</span><span className="sm:hidden">Skills</span></>
                      ) : (
                        <><Users className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Name</span><span className="sm:hidden">Name</span></>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              {/* Summary */}
              <div className="text-xs text-white/80 w-full lg:w-auto lg:ml-auto">
                <span className="block sm:inline">{scoredCandidates.filter(c => (c.aiScore ?? 0) >= 70).length} excellent matches</span>
                <span className="hidden sm:inline"> · </span>
                <span className="block sm:inline">{scoredCandidates.filter(c => (c.aiScore ?? 0) >= 50 && (c.aiScore ?? 0) < 70).length} good fits</span>
              </div>
            </div>
          </div>

          {loading && (
            <div className="bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm sm:text-base text-gray-700">Searching candidates...</span>
              </div>
            </div>
          )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
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
                <div key={candidate._id} className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">
                  {/* Top section */}
                  <div className="p-3 sm:p-4 md:p-5 flex items-start gap-2 sm:gap-3 md:gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0 overflow-hidden shadow">
                      {candidate.profilePhoto ? (
                        <img 
                          src={candidate.profilePhoto} 
                          alt={getCandidateName(candidate)} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            (target.nextElementSibling as HTMLElement).style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-full h-full flex items-center justify-center text-white font-bold text-lg ${candidate.profilePhoto ? 'hidden' : 'flex'}`}
                        style={{ display: candidate.profilePhoto ? 'none' : 'flex' }}
                      >
                        {getAvatar(getCandidateName(candidate))}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight truncate">{getCandidateName(candidate)}</h3>
                          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{candidate.jobTitle || candidate.title || 'Professional'}</p>
                          <p className="text-xs text-gray-400 mt-0.5 sm:mt-1 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{getCandidateLocation(candidate)}</span>
                          </p>
                        </div>
                        {/* AI Score */}
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className="relative w-10 h-10 sm:w-12 sm:h-12">
                            <svg className="w-10 h-10 sm:w-12 sm:h-12 -rotate-90" viewBox="0 0 36 36">
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
                          <span className={`mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${fit.bg} ${fit.text} text-xs whitespace-nowrap`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${fit.dot}`}></span>
                            {fitLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="mx-3 sm:mx-4 md:mx-5 border-t border-gray-100" />

                  {/* Skills */}
                  <div className="px-3 sm:px-4 md:px-5 py-2 sm:py-3 md:py-3 flex-grow">
                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
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

                  {/* AI Match bar — always show */}
                  {(() => {
                    const matchJob = selectedJob || (candidate as any)._bestJob;
                    if (!matchJob) return null;
                    return (
                      <div className="px-3 sm:px-4 md:px-5 pb-3">
                        <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                            <span className="text-xs font-semibold text-gray-600">Match — <span className="text-indigo-600">{matchJob.jobTitle || matchJob.title}</span></span>
                            <span className="text-xs font-bold text-gray-700">{score}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                            <div className={`h-1.5 rounded-full ${scoreBarColor}`} style={{ width: `${score}%` }} />
                          </div>
                          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 text-xs">
                            {(candidate.matchedSkills?.length ?? 0) > 0 && (
                              <span className="text-emerald-600 font-medium">✓ {candidate.matchedSkills!.length} matched</span>
                            )}
                            {getCandidateSkills(candidate).length > 0 && (candidate.missingSkills?.length ?? 0) > 0 && (
                              <span className="text-red-500 font-medium">✗ {candidate.missingSkills!.length} missing</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Actions */}
                  <div className="px-3 sm:px-4 md:px-5 pb-5 flex flex-col sm:flex-row gap-2 mt-auto">
                    <button
                      onClick={() => handleViewProfile(candidate)}
                      className="w-full sm:flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                    >
                      View Profile
                    </button>

                    <div className="relative w-full sm:w-auto" data-contact-menu>
                      <button
                        onClick={() => setOpenContactMenu(openContactMenu === candidate._id ? null : candidate._id)}
                        className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-1.5 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        Contact
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openContactMenu === candidate._id ? 'rotate-180' : ''}`} />
                      </button>
                      {openContactMenu === candidate._id && (
                        <div className="absolute bottom-full right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 mb-1 w-full sm:w-48 overflow-hidden">
                          <button onClick={() => { setSelectedCandidateForMessage(candidate); setOpenContactMenu(null); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2 border-b">
                            <MessageCircle className="w-4 h-4 text-gray-400" /> Send Message
                          </button>
                          <button onClick={() => { navigator.clipboard.writeText(candidate.email || ''); window.dispatchEvent(new CustomEvent("zync:alert", { detail: { message: "Email copied!" } })); setOpenContactMenu(null); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2 border-b">
                            <Copy className="w-4 h-4 text-gray-400" /> Copy Email
                          </button>
                          <button onClick={() => {
                            const userData = JSON.parse(localStorage.getItem('user') || '{}');
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
                              appliedJobTitle: selectedJob ? (selectedJob.jobTitle || selectedJob.title || '') : '',
                              appliedJobId: selectedJob ? (selectedJob._id || selectedJob.id || null) : null,
                            };
                            fetch(`${API_ENDPOINTS.SAVED_CANDIDATES}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) })
                              .then(async res => {
                                if (res.status === 409) {
                                  // Already saved — find the record and remove it
                                  const existing = await apiFetch(`${API_ENDPOINTS.SAVED_CANDIDATES}`, { headers: { 'Authorization': `Bearer ${token}` } })
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


      </div>
      
      <Footer onNavigate={onNavigate} />
      </>
      )}

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
    </div>
  );
};

export default CandidateSearchPage;

