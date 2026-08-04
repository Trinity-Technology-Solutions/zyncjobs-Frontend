import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/apiFetch';
import { API_ENDPOINTS as ENV_ENDPOINTS } from '../config/env';
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
  AlertCircle
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AutocompleteCombobox from '../components/AutocompleteCombobox';

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

// Backend already provides AI-scored applications with candidate profiles

interface Job {
  _id: string;
  id: string;
  jobTitle: string;
  title?: string;
  skills: string[];
  jobCode?: string;
  positionId?: string;
}



interface CandidateRankingPageProps {
  onNavigate?: (page: string, data?: any) => void;
  user?: any;
  onLogout?: () => void;
}

interface RankedCandidate {
  id: string;
  name: string;
  email: string;
  rank: number;
  score: number;
  jobTitle: string;
  jobCode: string;
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

const CandidateRankingPage: React.FC<CandidateRankingPageProps> = ({ onNavigate, user, onLogout }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
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
      
      const [jobsRes, appsRes] = await Promise.all([
        apiFetch(`${ENV_ENDPOINTS.BASE_URL}/jobs/employer/email/${encodeURIComponent(userEmail)}`),
        apiFetch(`${ENV_ENDPOINTS.APPLICATIONS}?employerEmail=${encodeURIComponent(userEmail)}`)
      ]);

      if (!jobsRes.ok) {
        throw new Error(`Failed to fetch jobs: ${jobsRes.status} ${jobsRes.statusText}`);
      }
      if (!appsRes.ok) {
        throw new Error(`Failed to fetch applications: ${appsRes.status} ${appsRes.statusText}`);
      }

      const jobsText = await jobsRes.text();
      const appsText = await appsRes.text();
      let allJobs: Job[];
      let appsData: any;
      try { allJobs = JSON.parse(jobsText); } catch { throw new Error('Invalid response from jobs API'); }
      try { appsData = JSON.parse(appsText); } catch { throw new Error('Invalid response from applications API'); }
      const allApps = appsData.applications || appsData || [];
      
      setJobs(allJobs);

      // TECH_SKILLS keyword list for resume text extraction
      const TECH_SKILLS_KW = ['JavaScript','TypeScript','Python','Java','C++','C#','PHP','Ruby','Go','Rust','Kotlin','Swift','React','Angular','Vue','Next.js','Node.js','Express','Django','Flask','Spring','Laravel','FastAPI','HTML','CSS','Tailwind','Bootstrap','SQL','MySQL','PostgreSQL','MongoDB','Redis','Firebase','AWS','Azure','GCP','Docker','Kubernetes','Git','Linux','Terraform','Jenkins','Machine Learning','Deep Learning','TensorFlow','PyTorch','Scikit-learn','Pandas','NumPy','Power BI','Tableau','Excel','MATLAB','R','Hadoop','Spark','Kafka','REST','GraphQL','Microservices','Agile','Scrum','Figma','Jira','Postman','React.js','Node.js','Vue.js','Nest.js','MERN Stack','Full Stack','Data Analysis','Data Science','NLP'];

      const extractSkillsFromText = (text: string): string[] => {
        if (!text) return [];
        return TECH_SKILLS_KW.filter(k => {
          const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
        });
      };

      const enriched = allApps.map((app: any) => {
        const profile = app.candidateProfile || {};

        // Collect skills from ALL sources and merge
        const profileSkills: string[] = Array.isArray(profile.skills) ? profile.skills : [];
        const appSkills: string[] = Array.isArray(app.skills) ? app.skills : [];
        const parsedSkills: string[] = (
          app.parsedResume?.skills?.featuredSkills?.map((s: any) => s.skill || s).filter(Boolean) ||
          app.resumeData?.skills?.featuredSkills?.map((s: any) => s.skill || s).filter(Boolean) ||
          (Array.isArray(app.parsedResume?.skills) ? app.parsedResume.skills : [])
        );
        const resumeTextSkills: string[] = extractSkillsFromText(
          app.resumeText || app.resumeContent || app.extractedText || ''
        );

        // Merge all, deduplicate (case-insensitive)
        const seen = new Set<string>();
        const candidateSkills: string[] = [
          ...profileSkills, ...appSkills, ...parsedSkills, ...resumeTextSkills
        ].filter(s => {
          const key = String(s).toLowerCase().trim();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        return {
          ...app,
          candidateSkills,
          candidateExperience: profile.experience || profile.yearsExperience || app.experience || 'Not specified',
          candidateEducation: profile.education || 'Not specified',
          candidateLocation: profile.location || '',
          candidateJobTitle: profile.jobTitle || profile.title || app.currentJobTitle || '',
          candidateProfilePicture: profile.profilePhoto || '',
          candidateName: app.candidateName || profile.name || app.candidateEmail,
          skillsSource: [
            profileSkills.length > 0 ? 'profile' : '',
            parsedSkills.length > 0 || resumeTextSkills.length > 0 ? 'resume' : '',
          ].filter(Boolean).join('+') || 'none',
        };
      });

      // ── Scoring helpers ────────────────────────────────────────────
      const STOP = new Set(['strong','experience','in','with','of','and','or','for','the','a','an','knowledge','hands','on','good','understanding','excellent','ability','working','using','familiarity','proficiency','expertise']);
      const tokenize = (str: string): string[] => {
        const out: string[] = [];
        str.toLowerCase().split(/[\s\/\(\),&\.\-\+]+/).forEach(w => { if (w.length > 2 && !STOP.has(w)) out.push(w); });
        return out;
      };

      const localScore = (app: any, skills: string[], jobDataForScore: any): number => {
        const jobSkillsForScore: string[] = Array.isArray(jobDataForScore?.skills) ? jobDataForScore.skills : [];
        const jobTitleForScore: string = jobDataForScore?.jobTitle || jobDataForScore?.title || '';
        const jobDescForScore: string = jobDataForScore?.description || jobDataForScore?.jobDescription || '';

        // 1. Skill match (50%) — against job skills + description keywords
        const jobKw: string[] = [];
        jobSkillsForScore.forEach(s => tokenize(s).forEach(k => { if (!jobKw.includes(k)) jobKw.push(k); }));
        tokenize(jobDescForScore).forEach(k => { if (k.length > 3 && !jobKw.includes(k)) jobKw.push(k); });
        const matchedSkills = skills.filter(cs =>
          tokenize(cs).some(ct => jobKw.some(jk => ct === jk || ct.includes(jk) || jk.includes(ct)))
        );
        // Score based on matched/job-skills ratio (not candidate skills ratio — avoids penalising broad profiles)
        const sScore = jobSkillsForScore.length > 0
          ? Math.min(100, Math.round((matchedSkills.length / jobSkillsForScore.length) * 100))
          : skills.length > 0 ? 40 : 10; // baseline if no job skills defined

        // 2. Title match (25%)
        const candTitleToks = tokenize(app.candidateJobTitle || app.jobTitle || '');
        const jobTitleToks = tokenize(jobTitleForScore);
        const titleHits = candTitleToks.filter(w => jobTitleToks.some(jw => w === jw || w.includes(jw) || jw.includes(w))).length;
        const tScore = jobTitleToks.length > 0 && candTitleToks.length > 0
          ? Math.min(100, Math.round((titleHits / jobTitleToks.length) * 100)) : 0;

        // 3. Experience score (15%) — years + keyword relevance
        const expText = (app.candidateExperience || app.experience || '').toLowerCase();
        const expYears = parseInt(expText.match(/(\d+)/)?.[1] || '0');
        const expHits = jobTitleToks.filter(w => expText.includes(w)).length;
        const expRelevance = jobTitleToks.length > 0 ? Math.min(100, Math.round((expHits / jobTitleToks.length) * 100)) : 0;
        const eScore = Math.round(expRelevance * 0.6 + Math.min(40, expYears * 8) * 0.4);

        // 4. Profile completeness bonus (10%)
        let completeness = 0;
        if (app.resumeUrl && !['resume_from_quick_apply','resume_from_profile','resume_uploaded'].includes(app.resumeUrl)) completeness += 40;
        if (skills.length >= 3) completeness += 30;
        if (app.candidateEducation && app.candidateEducation !== 'Not specified') completeness += 15;
        if (app.candidateJobTitle) completeness += 15;

        return Math.min(99, Math.max(1, Math.round(
          sScore * 0.50 + tScore * 0.25 + eScore * 0.15 + completeness * 0.10
        )));
      };

      // Score each candidate — try AI hybrid-score, fall back to local
      const scorePromises = enriched.map(async (app: any) => {
        const skills: string[] = Array.isArray(app.candidateSkills) ? app.candidateSkills : [];
        const rawJobId = typeof app.jobId === 'object' ? (app.jobId?._id || app.jobId?.id) : app.jobId;
        const jobData = typeof app.jobId === 'object' ? app.jobId : allJobs.find((j: Job) => String(j._id || j.id) === String(rawJobId));

        // Use stored aiScore if already computed and non-zero
        let score = app.aiAnalysis?.overallScore || app.aiScore || 0;

        if (!score) {
          try {
            // Call backend hybrid-score with real candidate + job data
            const res = await apiFetch(`${ENV_ENDPOINTS.BASE_URL}/ranking/hybrid-score`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                candidate: {
                  skills,
                  experience: app.candidateExperience || app.experience || '',
                  education: app.candidateEducation || '',
                  jobTitle: app.candidateJobTitle || '',
                  location: app.candidateLocation || '',
                  name: app.candidateName || '',
                  email: app.candidateEmail || '',
                },
                job: {
                  title: jobData?.jobTitle || jobData?.title || '',
                  skills: jobData?.skills || [],
                  description: jobData?.description || jobData?.jobDescription || '',
                  location: jobData?.location || '',
                  experienceRange: jobData?.experienceRange || '',
                }
              })
            });
            if (res.ok) {
              const data = await res.json();
              // API returns {matched, missing, match_percentage} — extract correctly
              score = data.hybrid_score || data.score || data.overall_score ||
                      data.hybridScore || data.overallScore ||
                      data.match_percentage || 0;
            }
          } catch { /* fall through to local */ }
        }

        // Local fallback if AI returned 0 or failed
        if (!score) score = localScore(app, skills, jobData);
        score = Math.min(99, Math.max(1, Math.round(score)));

        // Build match reasons
        const jobSkills: string[] = Array.isArray(jobData?.skills) ? jobData.skills : [];
        const STOP2 = STOP;
        const tok2 = tokenize;
        const jobKw2: string[] = [];
        jobSkills.forEach(s => tok2(s).forEach(k => { if (!jobKw2.includes(k)) jobKw2.push(k); }));
        const matchedSkills = skills.filter(cs =>
          tok2(cs).some(ct => jobKw2.some(jk => ct === jk || ct.includes(jk) || jk.includes(ct)))
        );
        const reasons: string[] = [];
        if (app.aiAnalysis?.reasons?.length > 0) reasons.push(...app.aiAnalysis.reasons.slice(0, 2));
        if (matchedSkills.length > 0) reasons.push(`${matchedSkills.length} of ${jobSkills.length || skills.length} skills matched`);
        if (score >= 70) reasons.push('Strong overall match');
        if (app.resumeUrl && !['resume_from_quick_apply','resume_from_profile','resume_uploaded'].includes(app.resumeUrl)) reasons.push('Resume attached');
        if (app.skillsSource?.includes('resume')) reasons.push('Skills from resume');
        if (app.candidateJobTitle) reasons.push(`Title: ${app.candidateJobTitle}`);
        if (reasons.length === 0) reasons.push('Profile available');

        return {
          id: app._id || app.id,
          name: app.candidateName || app.candidateEmail || 'Candidate',
          email: app.candidateEmail || '',
          rank: 0,
          score,
          jobTitle: app.jobTitle || jobData?.jobTitle || jobData?.title || 'Position',
          jobCode: jobData?.jobCode || jobData?.positionId || '',
          jobId: String(jobData?._id || jobData?.id || rawJobId || ''),
          skills,
          experience: app.candidateExperience || 'Not specified',
          education: app.candidateEducation || 'Not specified',
          interviewStatus: (app.status === 'hired' ? 'hired' : app.status === 'rejected' ? 'rejected' : app.status === 'interviewed' ? 'completed' : app.status === 'shortlisted' ? 'scheduled' : 'not_scheduled') as RankedCandidate['interviewStatus'],
          appliedAt: app.createdAt || '',
          profilePicture: app.candidateProfilePicture || '',
          matchReasons: reasons
        };
      });

      const scored: RankedCandidate[] = await Promise.all(scorePromises);


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
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 via-indigo-950 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5 sm:gap-6">
              <button
                onClick={() => onNavigate?.('dashboard')}
                aria-label="Go back"
                className="inline-flex items-center justify-center w-12 h-12 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white shadow-lg hover:shadow-xl transition-all backdrop-blur-sm shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              <div className="w-14 sm:w-16 h-14 sm:h-16 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/30 ring-1 ring-white/20">
                <Trophy className="w-7 sm:w-8 h-7 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent leading-tight">Candidate Ranking &amp; Matching</h1>
                <div className="flex items-center gap-3 mt-3">
                  <span className="inline-flex items-center gap-1.5 text-blue-200/90 text-sm sm:text-base font-medium">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
                    AI-powered scoring
                  </span>
                  <span className="w-1 h-1 rounded-full bg-blue-300/40" />
                  <span className="text-blue-200/70 text-sm sm:text-base">Find your best candidates instantly</span>
                </div>
              </div>
            </div>
            <button onClick={fetchData} className="group hidden sm:inline-flex items-center justify-center gap-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20 hover:border-white/30 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200">
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              <span>Refresh Data</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 mt-10 sm:mt-12">
            {[
              { label: 'Total Applicants', value: rankedCandidates.length, color: 'text-blue-200', icon: Users, bar: 'bg-blue-400/30' },
              { label: 'Avg Match Score', value: `${avgScore}%`, color: 'text-emerald-200', icon: TrendingUp, bar: 'bg-emerald-400/30' },
              { label: 'Strong Matches', value: rankedCandidates.filter(c => c.score >= 80).length, color: 'text-amber-200', icon: Star, bar: 'bg-amber-400/30' },
              { label: 'Hired', value: rankedCandidates.filter(c => c.interviewStatus === 'hired').length, color: 'text-violet-200', icon: CheckCircle, bar: 'bg-violet-400/30' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="relative group">
                  <div className={`absolute inset-0 ${s.bar} rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/10 hover:border-white/20 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${s.bar} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-blue-200/60 font-medium truncate">{s.label}</p>
                        <p className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-xs text-gray-500 truncate">{c.jobTitle}</p>
                        {c.jobCode && <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded flex-shrink-0">{c.jobCode}</span>}
                      </div>
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
            <AutocompleteCombobox
              label="Job"
              value={selectedJob}
              onChange={(val) => setSelectedJob(val)}
              options={[{ value: 'all', label: 'All Jobs' }, ...jobs.map(j => ({ value: String(j._id || j.id), label: `${j.jobTitle || j.title}${j.jobCode || j.positionId ? ` — ${j.jobCode || j.positionId}` : ''}` }))]}
              placeholder="Select job..."
            />
            <AutocompleteCombobox
              label="Status"
              value={filterStatus}
              onChange={(val) => setFilterStatus(val)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'not_scheduled', label: 'Pending' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'completed', label: 'Interviewed' },
                { value: 'hired', label: 'Hired' },
                { value: 'rejected', label: 'Rejected' }
              ]}
              placeholder="Select status..."
            />
            <AutocompleteCombobox
              label="Sort by"
              value={sortBy}
              onChange={(val) => setSortBy(val as 'rank' | 'score' | 'name')}
              options={[
                { value: 'score', label: 'Sort by Score' },
                { value: 'rank', label: 'Sort by Rank' },
                { value: 'name', label: 'Sort by Name' }
              ]}
              placeholder="Sort by..."
            />
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
                          <div className="flex items-center gap-1.5 mt-1 min-w-0">
                            <Briefcase className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-blue-400 flex-shrink-0" />
                            <span className="text-xs text-blue-600 font-medium truncate">{c.jobTitle}</span>
                            {c.jobCode && <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded flex-shrink-0">{c.jobCode}</span>}
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
      <Footer onNavigate={onNavigate} user={user} />
    </div>
  );
};

export default CandidateRankingPage;