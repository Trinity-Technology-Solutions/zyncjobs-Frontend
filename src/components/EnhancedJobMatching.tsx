import React, { useState, useEffect } from 'react';
import { Search, MapPin, DollarSign, TrendingUp, Brain, Target, ChevronRight, BookOpen } from 'lucide-react';
import { advancedJobMatchingEngine, JobMatchResult, CandidateProfile, JobProfile } from '../services/advancedJobMatchingEngine';
import { comprehensiveAnalyticsSystem } from '../services/comprehensiveAnalyticsSystem';
import { tokenStorage } from '../utils/tokenStorage';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface EnhancedJobMatchingProps {
  user?: any;
  onJobSelect?: (job: any) => void;
  onNavigate?: (page: string, data?: any) => void;
}

const MatchScoreIndicator: React.FC<{ score: number; size?: 'sm' | 'md' | 'lg' }> = ({ score, size = 'md' }) => {
  const getColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 border-green-300';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 border-yellow-300';
    return 'text-red-600 bg-red-100 border-red-300';
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg'
  };

  return (
    <div className={`${sizeClasses[size]} ${getColor(score)} border-2 rounded-full flex items-center justify-center font-bold`}>
      {score}
    </div>
  );
};

const JobMatchCard: React.FC<{
  job: JobProfile;
  matchResult: JobMatchResult;
  onSelect: () => void;
  onApply: () => void;
}> = ({ job, matchResult, onSelect, onApply }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{job.title}</h3>
              <MatchScoreIndicator score={matchResult.overallScore} />
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {job.company} · {job.location}
              </div>
              {job.salaryRange.max > 0 && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {job.salaryRange.min.toLocaleString()}–{job.salaryRange.max.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Match Breakdown */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{matchResult.matchBreakdown.skillsMatch}%</div>
            <div className="text-xs text-gray-500">Skills Match</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{matchResult.matchBreakdown.experienceMatch}%</div>
            <div className="text-xs text-gray-500">Experience</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{matchResult.confidence}%</div>
            <div className="text-xs text-gray-500">Confidence</div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="space-y-2 mb-4">
          {matchResult.explanations.strengths.slice(0, 2).map((strength, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-gray-700">{strength}</span>
            </div>
          ))}
          {matchResult.explanations.concerns.slice(0, 1).map((concern, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-gray-700">{concern}</span>
            </div>
          ))}
        </div>

        {/* Career Progression Indicator */}
        {matchResult.careerProgression.isGoodFit && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">Career Growth Opportunity</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">{matchResult.careerProgression.nextStepReason}</p>
          </div>
        )}

        {/* Expandable Details */}
        {expanded && (
          <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
            {/* Missing Skills */}
            {matchResult.missingSkills.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Skills to Develop</h4>
                <div className="flex flex-wrap gap-2">
                  {matchResult.missingSkills.slice(0, 5).map(skill => (
                    <span key={skill} className="bg-red-50 text-red-700 px-2 py-1 rounded-full text-xs border border-red-200">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Transferable Skills */}
            {matchResult.transferableSkills.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Your Transferable Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {matchResult.transferableSkills.slice(0, 5).map(skill => (
                    <span key={skill} className="bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs border border-green-200">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {matchResult.explanations.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">AI Recommendations</h4>
                <div className="space-y-2">
                  {matchResult.explanations.recommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <Brain className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            {expanded ? 'Show Less' : 'Show Details'}
            <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onSelect}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              View Details
            </button>
            <button
              onClick={onApply}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                matchResult.overallScore >= 70
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {matchResult.overallScore >= 70 ? 'Apply Now' : 'Apply Anyway'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EnhancedJobMatching: React.FC<EnhancedJobMatchingProps> = ({ user, onJobSelect, onNavigate }) => {
  const [jobs, setJobs] = useState<JobProfile[]>([]);
  const [matchResults, setMatchResults] = useState<JobMatchResult[]>([]);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    salaryMin: '',
    workType: '',
    experience: ''
  });
  const [sortBy, setSortBy] = useState<'match' | 'salary' | 'date'>('match');

  useEffect(() => {
    loadCandidateProfile();
    loadJobs();
  }, [user]);

  useEffect(() => {
    if (candidateProfile && jobs.length > 0) {
      performMatching();
    }
  }, [candidateProfile, jobs, searchQuery, filters]);

  const loadCandidateProfile = async () => {
    const blank: CandidateProfile = {
      skills: [],
      experience: { years: 0, roles: [], industries: [], achievements: [] },
      education: { degree: '', field: '', institution: '' },
      preferences: { location: [], salaryRange: { min: 0, max: 200000 }, workType: 'flexible', industries: [] },
      careerGoals: { targetRole: '', timeframe: '', priorities: [] },
    };

    if (!user?.email) { setCandidateProfile(blank); return; }

    try {
      const stored = localStorage.getItem('user');
      const u = stored ? JSON.parse(stored) : {};
      const identifier = u.id || u.email;
      const token = tokenStorage.getAccess();
      const res = await fetch(`${API_BASE}/profile/${encodeURIComponent(identifier)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setCandidateProfile({
          skills: data.skills ?? [],
          experience: {
            years: data.experience?.years ?? data.yearsOfExperience ?? 0,
            roles: data.experience?.roles ?? (data.currentRole ? [data.currentRole] : []),
            industries: data.experience?.industries ?? [],
            achievements: data.experience?.achievements ?? [],
          },
          education: {
            degree: data.education?.degree ?? '',
            field: data.education?.field ?? '',
            institution: data.education?.institution ?? '',
          },
          preferences: {
            location: data.preferences?.location ?? (data.location ? [data.location] : []),
            salaryRange: data.preferences?.salaryRange ?? { min: 0, max: 200000 },
            workType: data.preferences?.workType ?? 'flexible',
            industries: data.preferences?.industries ?? [],
          },
          careerGoals: {
            targetRole: data.careerGoals?.targetRole ?? data.desiredRole ?? '',
            timeframe: data.careerGoals?.timeframe ?? '',
            priorities: data.careerGoals?.priorities ?? [],
          },
        });
        return;
      }
    } catch (error) {
      console.error('Failed to load candidate profile:', error);
    }
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      setCandidateProfile({ ...blank, skills: Array.isArray(u.skills) ? u.skills : [] });
    } catch { setCandidateProfile(blank); }
  };

  const loadJobs = async () => {
    try {
      const res = await fetch(`${API_BASE}/jobs?limit=50`);
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data = await res.json();
      const raw: any[] = Array.isArray(data) ? data : (data.jobs ?? []);
      // Normalise backend job shape → JobProfile shape
      const normalised: JobProfile[] = raw.map((j: any) => ({
        id: j._id || j.id,
        title: j.jobTitle || j.title || '',
        company: j.company || '',
        location: j.location || '',
        salaryRange: j.salary && typeof j.salary === 'object'
          ? { min: j.salary.min ?? 0, max: j.salary.max ?? 0 }
          : { min: 0, max: 0 },
        requiredSkills: Array.isArray(j.skills) ? j.skills : [],
        preferredSkills: Array.isArray(j.preferredSkills) ? j.preferredSkills : [],
        experience: {
          minYears: j.experience?.minYears ?? j.minExperience ?? 0,
          maxYears: j.experience?.maxYears ?? j.maxExperience ?? 10,
          requiredRoles: j.experience?.requiredRoles ?? [],
        },
        description: j.description || '',
        benefits: Array.isArray(j.benefits) ? j.benefits : [],
        workType: j.workType ?? (j.remote ? 'remote' : 'onsite'),
        industry: j.industry || j.category || '',
        companySize: j.companySize || '',
        growthStage: j.growthStage || '',
      }));
      setJobs(normalised);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const performMatching = async () => {
    if (!candidateProfile) return;

    try {
      // Track analytics
      const userId = user?.email || 'anonymous';
      comprehensiveAnalyticsSystem.trackEvent(userId, 'job_search', {
        query: searchQuery,
        filters,
        candidateSkills: candidateProfile.skills.length
      });

      // Filter jobs based on search and filters
      let filteredJobs = jobs.filter(job => {
        const matchesSearch = !searchQuery || 
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesLocation = !filters.location || 
          job.location.toLowerCase().includes(filters.location.toLowerCase()) ||
          job.workType === 'remote';

        const matchesSalary = !filters.salaryMin || 
          job.salaryRange.max >= parseInt(filters.salaryMin);

        const matchesWorkType = !filters.workType || 
          job.workType === filters.workType;

        return matchesSearch && matchesLocation && matchesSalary && matchesWorkType;
      });

      // Perform AI matching
      const results = await advancedJobMatchingEngine.matchJobs(candidateProfile, filteredJobs);
      
      // Sort results
      const sortedResults = results.sort((a, b) => {
        switch (sortBy) {
          case 'salary':
            const jobA = jobs.find(j => j.id === a.jobId);
            const jobB = jobs.find(j => j.id === b.jobId);
            return (jobB?.salaryRange.max || 0) - (jobA?.salaryRange.max || 0);
          case 'date':
            return 0; // Would sort by posting date in production
          default:
            return b.overallScore - a.overallScore;
        }
      });

      setMatchResults(sortedResults);
    } catch (error) {
      console.error('Matching failed:', error);
    }
  };

  const handleJobApply = (jobId: string) => {
    const userId = user?.email || 'anonymous';
    comprehensiveAnalyticsSystem.trackEvent(userId, 'job_apply', {
      jobId,
      source: 'ai_matching'
    });

    // Navigate to application page
    if (onNavigate) {
      onNavigate('job-application', { jobId });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Finding your perfect matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8" />
          <h2 className="text-2xl font-bold">AI-Powered Job Matching</h2>
        </div>
        <p className="text-blue-100">
          Our advanced AI analyzes your profile and finds jobs that match your skills, experience, and career goals.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search jobs, companies, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <input
            type="text"
            placeholder="Location"
            value={filters.location}
            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <input
            type="number"
            placeholder="Min Salary"
            value={filters.salaryMin}
            onChange={(e) => setFilters(prev => ({ ...prev, salaryMin: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="match">Best Match</option>
            <option value="salary">Highest Salary</option>
            <option value="date">Most Recent</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {matchResults.length} Jobs Found
          </h3>
          <p className="text-sm text-gray-600">
            Sorted by {sortBy === 'match' ? 'AI match score' : sortBy === 'salary' ? 'salary' : 'date posted'}
          </p>
        </div>
        {candidateProfile && candidateProfile.skills.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-yellow-800">
              <Target className="w-4 h-4" />
              <span>Complete your profile for better matches</span>
            </div>
          </div>
        )}
      </div>

      {/* Job Results */}
      <div className="space-y-4">
        {matchResults.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilters({ location: '', salaryMin: '', workType: '', experience: '' });
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          matchResults.map((result) => {
            const job = jobs.find(j => j.id === result.jobId);
            if (!job) return null;

            return (
              <JobMatchCard
                key={result.jobId}
                job={job}
                matchResult={result}
                onSelect={() => onJobSelect?.(job)}
                onApply={() => handleJobApply(result.jobId)}
              />
            );
          })
        )}
      </div>

      {/* Skill Recommendations */}
      {candidateProfile && matchResults.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600" />
            Improve Your Match Score
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Top Skills to Learn</h4>
              <div className="space-y-2">
                {['TypeScript', 'Docker', 'Kubernetes'].map(skill => (
                  <div key={skill} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                    <span className="text-sm font-medium text-gray-900">{skill}</span>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">+15% match</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Recommended Actions</h4>
              <div className="space-y-2">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-sm text-gray-900">Complete skill assessments</p>
                  <p className="text-xs text-gray-600">Verify your expertise</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-sm text-gray-900">Update your experience</p>
                  <p className="text-xs text-gray-600">Add recent projects</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedJobMatching;