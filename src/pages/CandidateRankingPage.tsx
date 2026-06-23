import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Award, 
  Briefcase, 
  CheckCircle, 
  Search, 
  RefreshCw, 
  TrendingUp, 
  Users, 
  Star, 
  AlertCircle,
  HelpCircle,
  Mail,
  MapPin,
  Calendar
} from 'lucide-react';

const API_ENDPOINTS = {
  BASE_URL: '/api',
  APPLICATIONS: '/api/applications',
  USERS: '/api/users'
};

function getEffectiveEmployerEmail(): string {
  try {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      return parsed.email || 'employer@trinitytech.com';
    }
  } catch (e) {}
  return 'employer@trinitytech.com';
}

function toCdnUrl(url: string): string {
  if (!url) return '';
  return url.replace('s3.amazonaws.com', 'cloudfront.net');
}

function extractSkillsFromText(text: string): string[] {
  if (!text) return [];
  const programmingSkills = [
    'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Java', 
    'C++', 'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 
    'SQL', 'Tailwind CSS', 'Next.js', 'Express', 'Git', 'CI/CD'
  ];
  return programmingSkills.filter(skill => 
    new RegExp(`\\b${skill}\\b`, 'i').test(text)
  );
}

interface MatchScoreBreakdown {
  overall: number;
  explanation: string[];
}

// FIX: job typed as `any` to allow both `jobTitle` and optional `title`
function computeMatchScore(
  skills: string[], 
  candidateTitle: string, 
  location: string, 
  job: any
): MatchScoreBreakdown {
  let score = 50;
  const explanation: string[] = [];

  const jobTitle = job?.jobTitle || job?.title || '';
  const requiredSkills = Array.isArray(job?.skills) ? job.skills : [];

  if (candidateTitle && jobTitle) {
    if (candidateTitle.toLowerCase() === jobTitle.toLowerCase()) {
      score += 20;
      explanation.push('Exact Job Title match');
    } else if (
      candidateTitle.toLowerCase().includes(jobTitle.toLowerCase()) || 
      jobTitle.toLowerCase().includes(candidateTitle.toLowerCase())
    ) {
      score += 10;
      explanation.push('Related Job Title match');
    }
  }

  if (skills.length > 0 && requiredSkills.length > 0) {
    const matchingSkills = skills.filter(s => 
      requiredSkills.some((req: string) => req.toLowerCase() === s.toLowerCase())
    );
    if (matchingSkills.length > 0) {
      const percentage = Math.round((matchingSkills.length / requiredSkills.length) * 30);
      score += percentage;
      explanation.push(`Matched ${matchingSkills.length} required skills`);
    }
  } else if (skills.length > 0) {
    score += 15;
    explanation.push('Matches industry-standard skills');
  }

  score = Math.min(Math.max(score, 0), 100);

  return {
    overall: score,
    explanation: explanation.length > 0 ? explanation : ['Candidate meets general core benchmarks']
  };
}

async function readPdf(url: string): Promise<Array<{ text: string }>> {
  console.log('Mock parsing resume PDF from URL:', url);
  return [
    { text: 'Experienced Developer skilled in React, Node.js, and TypeScript.' }
  ];
}

const Header: React.FC<{ onNavigate?: (page: string) => void; user?: any }> = ({ onNavigate, user }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-6 py-4 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate?.('dashboard')}>
          <div className="font-black tracking-wider text-xl flex items-center gap-1 text-blue-400">
            ZYNC<span className="text-white px-1.5 py-0.5 bg-blue-600 rounded text-sm">JOBS</span>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm text-slate-300">
          <span className="hover:text-white cursor-pointer" onClick={() => onNavigate?.('candidates')}>Candidate Search</span>
          <span className="hover:text-white cursor-pointer" onClick={() => onNavigate?.('companies')}>Companies</span>
          <span className="hover:text-white cursor-pointer" onClick={() => onNavigate?.('posted-jobs')}>Posted Jobs</span>
          <span className="hover:text-white cursor-pointer" onClick={() => onNavigate?.('job-posting')}>Job Posting</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
          </div>
          <span className="text-sm font-semibold text-slate-200">{user?.name || 'Mutheeswaran'}</span>
        </div>
      </div>
    </header>
  );
};

const Footer: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
        <p>© 2026 ZYNC JOBS Inc. All rights reserved.</p>
        <div className="flex gap-6">
          <span className="hover:text-white cursor-pointer">Terms of Service</span>
          <span className="hover:text-white cursor-pointer">Privacy Policy</span>
          <span className="hover:text-white cursor-pointer">Support Helpdesk</span>
        </div>
      </div>
    </footer>
  );
};

// FIX: Added `title?` as an optional field so TypeScript accepts `j.title` accesses
interface Job {
  _id: string;
  id: string;
  jobTitle: string;
  title?: string;
  skills: string[];
}

const MOCK_JOBS: Job[] = [
  { _id: 'job-1', id: 'job-1', jobTitle: 'Full Stack Engineer', skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'] },
  { _id: 'job-2', id: 'job-2', jobTitle: 'Frontend Developer', skills: ['React', 'JavaScript', 'Tailwind CSS'] },
  { _id: 'job-3', id: 'job-3', jobTitle: 'Backend Engineer', skills: ['Node.js', 'Python', 'AWS', 'Kubernetes'] }
];

const MOCK_APPLICATIONS = [
  { _id: 'app-1', id: 'app-1', jobId: 'job-1', candidateEmail: 'anthony.george@gmail.com', candidateName: 'Anthony George Agil', status: 'shortlisted', skills: ['React', 'Node.js', 'TypeScript', 'JavaScript'], candidateJobTitle: 'Full Stack Engineer', candidateLocation: 'Remote', resumeUrl: 'resume1.pdf' },
  { _id: 'app-2', id: 'app-2', jobId: 'job-1', candidateEmail: 'muthee@trinitytech.com', candidateName: 'Mutheeswaran S', status: 'interviewed', skills: ['React', 'JavaScript', 'Node.js'], candidateJobTitle: 'Software Engineer', candidateLocation: 'Chennai', resumeUrl: 'resume2.pdf' },
  { _id: 'app-3', id: 'app-3', jobId: 'job-2', candidateEmail: 'alice.johnson@dev.com', candidateName: 'Alice Johnson', status: 'hired', skills: ['React', 'JavaScript', 'Tailwind CSS'], candidateJobTitle: 'Frontend Engineer', candidateLocation: 'Bangalore' },
  { _id: 'app-4', id: 'app-4', jobId: 'job-2', candidateEmail: 'bob.builder@infra.net', candidateName: 'Bob Builder', status: 'rejected', skills: ['TypeScript', 'Kubernetes', 'AWS'], candidateJobTitle: 'DevOps Specialist', candidateLocation: 'Remote' },
  { _id: 'app-5', id: 'app-5', jobId: 'job-3', candidateEmail: 'carol.danvers@space.org', candidateName: 'Carol Danvers', status: 'shortlisted', skills: ['Python', 'AWS', 'Kubernetes', 'Docker'], candidateJobTitle: 'Backend Architect', candidateLocation: 'Remote' }
];

interface CandidateRankingPageProps {
  onNavigate?: (page: string, data?: any) => void;
  user?: any;
}

interface RankedCandidate {
  id: string;
  name: string;
  email: string;
  rank: number;
  score: number;
  jobTitle: string;
  jobId: string;
  skills: string[];
  experience: string;
  education: string;
  interviewStatus: 'not_scheduled' | 'scheduled' | 'completed' | 'hired' | 'rejected';
  appliedAt: string;
  profilePicture?: string;
  matchReasons: string[];
}

const scoreColor = (s: number) => s >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : s >= 60 ? 'text-blue-600 bg-blue-50 border-blue-200' : s >= 40 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-red-500 bg-red-50 border-red-200';
const barColor = (s: number) => s >= 80 ? 'bg-emerald-500' : s >= 60 ? 'bg-blue-500' : s >= 40 ? 'bg-amber-500' : 'bg-red-400';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  not_scheduled: { label: 'Pending', color: 'text-gray-500 bg-gray-100', dot: 'bg-gray-400' },
  scheduled:     { label: 'Scheduled', color: 'text-blue-600 bg-blue-50', dot: 'bg-blue-500' },
  completed:     { label: 'Interviewed', color: 'text-violet-600 bg-violet-50', dot: 'bg-violet-500' },
  hired:         { label: 'Hired', color: 'text-emerald-600 bg-emerald-50', dot: 'bg-emerald-500' },
  rejected:      { label: 'Rejected', color: 'text-red-500 bg-red-50', dot: 'bg-red-400' },
};

const skillsCache: Record<string, string[]> = {};

const CandidateRankingPage: React.FC<CandidateRankingPageProps> = ({ onNavigate, user }) => {
  // FIX: typed as Job[] so `j.title` is valid via the optional field above
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [rankedCandidates, setRankedCandidates] = useState<RankedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'rank' | 'score' | 'name'>('score');

  useEffect(() => { 
    fetchData(); 
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const userEmail = getEffectiveEmployerEmail();
      
      let allJobs: Job[] = MOCK_JOBS;
      let allApps = MOCK_APPLICATIONS;

      try {
        const [jobsRes, appsRes] = await Promise.all([
          fetch(`${API_ENDPOINTS.BASE_URL}/jobs/employer/email/${encodeURIComponent(userEmail)}`),
          fetch(`${API_ENDPOINTS.APPLICATIONS}?employerEmail=${encodeURIComponent(userEmail)}`)
        ]);

        if (jobsRes.ok) allJobs = await jobsRes.json();
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          allApps = appsData.applications || appsData || MOCK_APPLICATIONS;
        }
      } catch (networkError) {
        console.warn('Network endpoints unavailable, compiling in-memory mock datasets.');
      }
      
      setJobs(allJobs);

      const enriched = await Promise.all(allApps.map(async (app: any) => {
        try {
          const id = app.candidateId || app.userId || app.candidateUserId;
          let profile: any = null;

          if (id) { 
            const r = await fetch(`${API_ENDPOINTS.USERS}/${id}`); 
            if (r.ok) profile = await r.json(); 
          }

          const merged = profile ? {
            ...app,
            candidateSkills: app.candidateSkills?.length ? app.candidateSkills : (profile.skills || []),
            candidateExperience: app.candidateExperience || app.experience || profile.experience || '',
            candidateEducation: app.candidateEducation || app.education || profile.education || '',
            candidateLocation: app.candidateLocation || app.location || profile.location || '',
            candidateJobTitle: app.candidateJobTitle || app.jobTitle || profile.jobTitle || profile.title || '',
            candidateProfilePicture: app.candidateProfilePicture || profile.profilePicture || profile.profilePhoto || '',
            candidateName: app.candidateName || profile.fullName || profile.name || app.candidateEmail,
            resumeUrl: app.resumeUrl || profile.resumeUrl || '',
          } : app;

          const cacheKey = merged._id || merged.id || merged.candidateEmail || '';
          let resolvedSkillsList = merged.candidateSkills || [];

          if (cacheKey && skillsCache[cacheKey]) {
            resolvedSkillsList = skillsCache[cacheKey];
          } else if (!resolvedSkillsList || resolvedSkillsList.length === 0) {
            const resumeUrl = merged?.resumeUrl || '';
            if (resumeUrl) {
              const cfUrl = toCdnUrl(resumeUrl);
              const textItems = await readPdf(cfUrl);
              const resumeText = textItems.map((t: any) => t.text).join(' ');
              resolvedSkillsList = extractSkillsFromText(resumeText);
              if (cacheKey && resolvedSkillsList.length > 0) {
                skillsCache[cacheKey] = resolvedSkillsList;
              }
            }
          }

          return { ...merged, candidateSkills: resolvedSkillsList };
        } catch (singleItemError) {
          console.warn("Skipped profile enrichment for single applicant due to error:", singleItemError);
          return app;
        }
      }));

      const scored: RankedCandidate[] = enriched.map((app: any) => {
        // FIX: compare against both _id/id fields safely
        const job = allJobs.find((j: Job) => 
          String(j._id || j.id) === String(app.jobId?._id || app.jobId?.id || app.jobId)
        );
        const skills: string[] = Array.isArray(app.candidateSkills) ? app.candidateSkills : [];
        const title = app.candidateJobTitle || app.jobTitle || job?.jobTitle || '';
        const location = app.candidateLocation || app.location || '';
        
        const breakdown = computeMatchScore(skills, title, location, job || {});
        const reasons = (breakdown.explanation || []).map(e => e.replace(/^[\u{1F300}-\u{1FAFF}\u2600-\u27BF]\s*/u, ''));
        if (app.resumeUrl) reasons.push('Resume attached');

        return { 
          id: app._id || app.id, 
          name: app.candidateName || app.candidateEmail || 'Candidate', 
          email: app.candidateEmail || '', 
          rank: 0, 
          score: breakdown.overall || 0, 
          // FIX: use `job?.title` safely now that `title?` is declared on Job
          jobTitle: app.jobTitle || job?.jobTitle || job?.title || 'Position', 
          jobId: String(app.jobId?._id || app.jobId?.id || app.jobId || ''), 
          skills, 
          experience: app.candidateExperience || 'Not specified', 
          education: app.candidateEducation || 'Not specified', 
          interviewStatus: (app.status === 'hired' ? 'hired' : app.status === 'rejected' ? 'rejected' : app.status === 'interviewed' ? 'completed' : app.status === 'shortlisted' ? 'scheduled' : 'not_scheduled') as RankedCandidate['interviewStatus'], 
          appliedAt: app.createdAt || '', 
          profilePicture: app.candidateProfilePicture || '', 
          matchReasons: reasons 
        };
      });

      const groups: Record<string, RankedCandidate[]> = {};
      scored.forEach(c => { 
        if (!groups[c.jobId]) groups[c.jobId] = []; 
        groups[c.jobId].push(c); 
      });

      Object.values(groups).forEach(g => { 
        g.sort((a, b) => b.score - a.score); 
        g.forEach((c, i) => { c.rank = i + 1; }); 
      });

      setRankedCandidates(scored);
    } catch (e: any) { 
      console.error(e); 
      setError(e.message || "An unexpected error occurred while loading rankings.");
    } finally { 
      setLoading(false); 
    }
  };

  const filtered = rankedCandidates
    .filter(c => selectedJob === 'all' || c.jobId === selectedJob)
    .filter(c => filterStatus === 'all' || c.interviewStatus === filterStatus)
    .filter(c => !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase()) || c.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => sortBy === 'score' ? b.score - a.score : sortBy === 'name' ? a.name.localeCompare(b.name) : a.rank - b.rank);

  const top3 = [...rankedCandidates].sort((a, b) => b.score - a.score).slice(0, 3);
  const avgScore = rankedCandidates.length > 0 ? Math.round(rankedCandidates.reduce((s, c) => s + c.score, 0) / rankedCandidates.length) : 0;

  const Avatar = ({ name, photo, size = 'md' }: { name: string; photo?: string; size?: 'sm' | 'md' | 'lg' }) => {
    const sz = size === 'lg' ? 'w-14 h-14 text-xl' : size === 'sm' ? 'w-8 h-8 text-sm' : 'w-11 h-11 text-base';
    return photo
      ? <img src={photo} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow`} />
      : <div className={`${sz} rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold flex-shrink-0 ring-2 ring-white shadow`}>{name.charAt(0).toUpperCase()}</div>;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onNavigate={onNavigate} user={user} />

      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => onNavigate?.('dashboard')}
                aria-label="Go back"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-white/70 bg-white/15 hover:bg-white/25 text-white shadow-sm hover:shadow-md transition-all backdrop-blur-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <Trophy className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Candidate Ranking & Matching</h1>
                <p className="text-blue-300 text-xs sm:text-sm mt-0.5">AI-powered scoring · Find your best candidates instantly</p>
              </div>
            </div>
            <button onClick={fetchData} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur px-4 py-2 rounded-xl border border-white/20 text-sm text-white transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="text-sm font-medium">{error}</div>
            <button onClick={fetchData} className="ml-auto text-xs font-bold text-red-800 underline hover:no-underline">Try Again</button>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {[
            { label: 'Total Applicants', value: rankedCandidates.length, color: 'text-slate-700', icon: Users, bg: 'bg-slate-100' },
            { label: 'Avg Match Score', value: `${avgScore}%`, color: 'text-blue-600', icon: TrendingUp, bg: 'bg-blue-50' },
            { label: 'Strong Matches', value: rankedCandidates.filter(c => c.score >= 80).length, color: 'text-emerald-600', icon: Star, bg: 'bg-emerald-50' },
            { label: 'Hired', value: rankedCandidates.filter(c => c.interviewStatus === 'hired').length, color: 'text-violet-600', icon: CheckCircle, bg: 'bg-violet-50' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-gray-100 shadow-sm flex items-center gap-2 sm:gap-4">
                <div className={`w-8 sm:w-11 h-8 sm:h-11 ${s.bg} rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 sm:w-5 h-4 sm:h-5 ${s.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-medium truncate">{s.label}</p>
                  <p className={`text-lg sm:text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {top3.length > 0 && !loading && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <Award className="w-5 h-5 text-yellow-500" />
              <h2 className="text-base font-semibold text-gray-900">Top Candidates</h2>
              <span className="text-xs text-gray-400 ml-1">Highest match scores across all jobs</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {top3.map((c, i) => (
                <div key={c.id} className={`relative rounded-2xl p-5 border-2 ${i === 0 ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50' : i === 1 ? 'border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50' : 'border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50'}`}>
                  <div className="absolute top-3 right-3 text-2xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar name={c.name} photo={c.profilePicture} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{c.name}</p>
                      <p className="text-xs text-gray-500 truncate">{c.jobTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Match Score</span>
                    <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full border ${scoreColor(c.score)}`}>{c.score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${barColor(c.score)} transition-all`} style={{ width: `${c.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 mb-4 space-y-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-gray-200 rounded-lg sm:rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input type="text" placeholder="Search by name, email or job..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder-gray-400" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)} className="text-sm border border-gray-200 rounded-lg sm:rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="all">All Jobs</option>
              {/* FIX: `j.jobTitle || j.title` is now valid — `title?` is declared on Job */}
              {jobs.map(j => <option key={j._id || j.id} value={String(j._id || j.id)}>{j.jobTitle || j.title}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-gray-200 rounded-lg sm:rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="all">All Status</option>
              <option value="not_scheduled">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Interviewed</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="text-sm border border-gray-200 rounded-lg sm:rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="score">Sort by Score</option>
              <option value="rank">Sort by Rank</option>
              <option value="name">Sort by Name</option>
            </select>
            <div className="flex items-center justify-center sm:justify-end">
              <span className="text-xs text-gray-400">{filtered.length} candidate{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
            <p className="text-sm text-gray-500">Scoring & ranking candidates...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Trophy className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">No candidates found</h3>
            <p className="text-sm text-gray-400">Candidates will appear here once they apply to your jobs.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(c => {
              const st = STATUS_CONFIG[c.interviewStatus];
              const isTop = c.rank <= 3;
              return (
                <div key={c.id} className={`bg-white rounded-xl sm:rounded-2xl border shadow-sm p-4 sm:p-5 hover:shadow-md transition-all ${isTop && c.rank === 1 ? 'border-yellow-200' : 'border-gray-100'}`}>
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                      <div className={`w-8 sm:w-10 h-8 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${c.rank === 1 ? 'bg-yellow-400 text-yellow-900' : c.rank === 2 ? 'bg-gray-200 text-gray-700' : c.rank === 3 ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        #{c.rank}
                      </div>
                      <Avatar name={c.name} photo={c.profilePicture} />
                      <div className="ml-auto sm:hidden">
                        <div className={`text-lg font-bold px-2 py-1 rounded-lg border ${scoreColor(c.score)}`}>{c.score}%</div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{c.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-400 truncate">{c.email}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Briefcase className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-blue-400 flex-shrink-0" />
                            <span className="text-xs text-blue-600 font-medium truncate">{c.jobTitle}</span>
                          </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                          <div className="text-center">
                            <div className={`text-xl font-bold px-3 py-1.5 rounded-xl border-2 ${scoreColor(c.score)}`}>{c.score}%</div>
                            <p className="text-xs text-gray-400 mt-0.5">Match</p>
                          </div>
                          <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${st.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </div>
                        <div className="sm:hidden">
                          <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${st.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 mb-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-400">Job Fit Score</span>
                          <span className="text-xs font-medium text-gray-600">{c.score}/100</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 sm:h-2">
                          <div className={`h-1.5 sm:h-2 rounded-full ${barColor(c.score)} transition-all`} style={{ width: `${c.score}%` }} />
                        </div>
                      </div>
                      {c.matchReasons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {c.matchReasons.slice(0, 3).map((r, i) => (
                            <span key={i} className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 flex-shrink-0" /> 
                              <span className="truncate">{r}</span>
                            </span>
                          ))}
                          {c.matchReasons.length > 3 && (
                            <span className="text-xs text-gray-400 px-1">+{c.matchReasons.length - 3} more</span>
                          )}
                        </div>
                      )}
                      {c.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {c.skills.slice(0, 5).map((sk, i) => (
                            <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full truncate">{sk}</span>
                          ))}
                          {c.skills.length > 5 && <span className="text-xs text-gray-400 px-1">+{c.skills.length - 5} more</span>}
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
    </div>
  );
};

export default CandidateRankingPage;