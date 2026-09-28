import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/apiFetch';
import { API_ENDPOINTS as ENV_ENDPOINTS } from '../config/env';
import { mergeCandidateSkills, scoreCandidate, scoreBreakdown, extractSkillsFromText, tokenize, STOP } from '../utils/candidateScoring';
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
  Medal,
  MoreVertical,
  ChevronLeft,
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
  matchedSkills: string[];
  missingSkills: string[];
  jobSkills: string[];
}

const scoreTextColor = (s: number) =>
  s >= 80 ? 'text-emerald-600' : s >= 60 ? 'text-blue-600' : s >= 40 ? 'text-amber-500' : 'text-red-500';

const barColor = (s: number) =>
  s >= 80 ? 'bg-emerald-500' : s >= 60 ? 'bg-blue-500' : s >= 40 ? 'bg-amber-400' : 'bg-red-400';

const tierBorder = (s: number) =>
  s >= 80 ? 'bg-emerald-500' : s >= 60 ? 'bg-blue-500' : s >= 40 ? 'bg-amber-400' : 'bg-slate-200';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  not_scheduled: { label: 'Pending',    color: 'text-slate-500 bg-slate-100',   dot: 'bg-slate-400' },
  scheduled:     { label: 'Scheduled',  color: 'text-blue-600 bg-blue-50',      dot: 'bg-blue-500' },
  completed:     { label: 'Interviewed',color: 'text-violet-600 bg-violet-50',  dot: 'bg-violet-500' },
  hired:         { label: 'Hired',      color: 'text-emerald-600 bg-emerald-50',dot: 'bg-emerald-500' },
  rejected:      { label: 'Rejected',   color: 'text-red-500 bg-red-50',        dot: 'bg-red-400' },
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

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const userEmail = getEffectiveEmployerEmail();
      const [jobsRes, appsRes] = await Promise.all([
        apiFetch(`${ENV_ENDPOINTS.BASE_URL}/jobs/employer/email/${encodeURIComponent(userEmail)}`),
        apiFetch(`${ENV_ENDPOINTS.APPLICATIONS}?employerEmail=${encodeURIComponent(userEmail)}`)
      ]);
      if (!jobsRes.ok) throw new Error(`Failed to fetch jobs: ${jobsRes.status} ${jobsRes.statusText}`);
      if (!appsRes.ok) throw new Error(`Failed to fetch applications: ${appsRes.status} ${appsRes.statusText}`);

      const jobsText = await jobsRes.text();
      const appsText = await appsRes.text();
      let allJobs: Job[];
      let appsData: any;
      try { allJobs = JSON.parse(jobsText); } catch { throw new Error('Invalid response from jobs API'); }
      try { appsData = JSON.parse(appsText); } catch { throw new Error('Invalid response from applications API'); }
      const allApps = appsData.applications || appsData || [];
      setJobs(allJobs);

      const enriched = allApps.map((app: any) => {
        const profile = app.candidateProfile || {};
        const profileSkills: string[] = Array.isArray(profile.skills) ? profile.skills : [];
        const parsedSkills: string[] = (
          app.parsedResume?.skills?.featuredSkills?.map((s: any) => s.skill || s).filter(Boolean) ||
          app.resumeData?.skills?.featuredSkills?.map((s: any) => s.skill || s).filter(Boolean) ||
          (Array.isArray(app.parsedResume?.skills) ? app.parsedResume.skills : [])
        );
        const resumeTextSkills: string[] = extractSkillsFromText(
          app.resumeText || app.resumeContent || app.extractedText || ''
        );
        const candidateSkills: string[] = mergeCandidateSkills(app);
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

      const scorePromises = enriched.map(async (app: any) => {
        const skills: string[] = Array.isArray(app.candidateSkills) ? app.candidateSkills : [];
        const rawJobId = typeof app.jobId === 'object' ? (app.jobId?._id || app.jobId?.id) : app.jobId;
        const jobFromList = allJobs.find((j: Job) => String(j._id || j.id) === String(rawJobId));
        const jobData = typeof app.jobId === 'object' ? app.jobId : jobFromList;
        const score = await scoreCandidate(app, allJobs);
        const breakdown = scoreBreakdown(app, skills, jobData);

        const jobSkills: string[] = Array.isArray(jobData?.skills) ? jobData.skills : [];
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
          jobCode: app.jobCode || app.positionId || jobFromList?.jobCode || jobFromList?.positionId || jobData?.jobCode || jobData?.positionId || '',
          jobId: String(jobData?._id || jobData?.id || rawJobId || ''),
          skills,
          experience: app.candidateExperience || 'Not specified',
          education: app.candidateEducation || 'Not specified',
          interviewStatus: (app.status === 'hired' ? 'hired' : app.status === 'rejected' ? 'rejected' : app.status === 'interviewed' ? 'completed' : app.status === 'shortlisted' ? 'scheduled' : 'not_scheduled') as RankedCandidate['interviewStatus'],
          appliedAt: app.createdAt || '',
          profilePicture: app.candidateProfilePicture || '',
          matchReasons: reasons,
          matchedSkills: breakdown.matchedSkills,
          missingSkills: breakdown.missingSkills,
          jobSkills: breakdown.jobSkills,
        };
      });

      const scored: RankedCandidate[] = await Promise.all(scorePromises);
      const groups: Record<string, RankedCandidate[]> = {};
      scored.forEach(c => { if (!groups[c.jobId]) groups[c.jobId] = []; groups[c.jobId].push(c); });
      Object.values(groups).forEach(g => { g.sort((a, b) => b.score - a.score); g.forEach((c, i) => { c.rank = i + 1; }); });
      setRankedCandidates(scored);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An unexpected error occurred while loading rankings.');
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
    const sz = size === 'lg' ? 'w-12 h-12 text-lg' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
    return photo
      ? <img src={photo} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0`} />
      : <div className={`${sz} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0`}>{name.charAt(0).toUpperCase()}</div>;
  };

  const rankLabel = (i: number) => {
    const cfg = [
      { bg: 'bg-amber-400', text: 'text-amber-900', label: '1st' },
      { bg: 'bg-slate-300', text: 'text-slate-700', label: '2nd' },
      { bg: 'bg-orange-400', text: 'text-white',    label: '3rd' },
    ];
    return cfg[i] || { bg: 'bg-slate-100', text: 'text-slate-500', label: `${i + 1}` };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      {/* Page header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate?.('dashboard')}
                className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Candidate Ranking</h1>
                <p className="text-sm text-gray-500 mt-0.5">AI-powered match scoring across all your job postings</p>
              </div>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-6 pt-6 border-t border-gray-100">
            {[
              { label: 'Total Applicants', value: rankedCandidates.length, color: 'text-gray-900' },
              { label: 'Avg Match Score',  value: `${avgScore}%`,          color: 'text-blue-600' },
              { label: 'Strong Matches',   value: rankedCandidates.filter(c => c.score >= 80).length, color: 'text-emerald-600' },
              { label: 'Hired',            value: rankedCandidates.filter(c => c.interviewStatus === 'hired').length, color: 'text-violet-600' },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{s.label}</p>
                <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={fetchData} className="ml-auto font-semibold underline text-red-800 hover:no-underline">Retry</button>
          </div>
        )}

        {/* Top 3 podium */}
        {top3.length > 0 && !loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-gray-800">Top Candidates</span>
              <span className="text-xs text-gray-400">— highest scores across all jobs</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {top3.map((c, i) => {
                const rl = rankLabel(i);
                return (
                  <div key={c.id} className="flex items-center gap-3 p-4 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${rl.bg} ${rl.text}`}>
                      {rl.label}
                    </div>
                    <Avatar name={c.name} photo={c.profilePicture} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400 truncate">{c.jobTitle}{c.jobCode ? ` · ${c.jobCode}` : ''}</p>
                    </div>
                    <div className={`text-sm font-bold flex-shrink-0 ${scoreTextColor(c.score)}`}>{c.score}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <AutocompleteCombobox
              value={searchTerm}
              onChange={setSearchTerm}
              options={[]}
              allowCustom
              placeholder="Search by name, email or job..."
              className="border-none shadow-none bg-transparent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <AutocompleteCombobox
              label="Job"
              value={selectedJob}
              onChange={setSelectedJob}
              options={[{ value: 'all', label: 'All Jobs' }, ...jobs.map(j => ({ value: String(j._id || j.id), label: `${j.jobTitle || j.title}${j.jobCode || j.positionId ? ` · ${j.jobCode || j.positionId}` : ''}` }))]}
              placeholder="All Jobs"
            />
            <AutocompleteCombobox
              label="Status"
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'all',           label: 'All Status' },
                { value: 'not_scheduled', label: 'Pending' },
                { value: 'scheduled',     label: 'Scheduled' },
                { value: 'completed',     label: 'Interviewed' },
                { value: 'hired',         label: 'Hired' },
                { value: 'rejected',      label: 'Rejected' },
              ]}
              placeholder="All Status"
            />
            <AutocompleteCombobox
              label="Sort by"
              value={sortBy}
              onChange={(val) => setSortBy(val as 'rank' | 'score' | 'name')}
              options={[
                { value: 'score', label: 'Match Score' },
                { value: 'rank',  label: 'Rank' },
                { value: 'name',  label: 'Name' },
              ]}
              placeholder="Sort by Score"
            />
            <div className="flex items-end pb-1">
              <span className="text-xs text-gray-400">{filtered.length} candidate{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Candidate list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-gray-200">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-gray-500">Scoring candidates...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-gray-200">
            <Users className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-600">No candidates found</p>
            <p className="text-xs text-gray-400 mt-1">Candidates will appear here once they apply.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {filtered.map((c, idx) => {
              const st = STATUS_CONFIG[c.interviewStatus];
              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${idx !== 0 ? 'border-t border-gray-100' : ''}`}
                >
                  {/* Tier bar */}
                  <div className={`w-1 h-10 rounded-full flex-shrink-0 ${tierBorder(c.score)}`} />

                  {/* Rank */}
                  <div className="w-8 text-center flex-shrink-0">
                    <span className="text-xs font-bold text-gray-400">#{c.rank}</span>
                  </div>

                  {/* Avatar */}
                  <Avatar name={c.name} photo={c.profilePicture} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{c.name}</span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-400">{c.email}</span>
                      <span className="text-gray-200">·</span>
                      <Briefcase className="w-3 h-3 text-gray-300 flex-shrink-0" />
                      <span className="text-xs text-gray-500">{c.jobTitle}</span>
                      {c.jobCode && (
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{c.jobCode}</span>
                      )}
                    </div>
                    {/* Skills breakdown */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {c.matchedSkills.slice(0, 4).map((sk, i) => (
                        <span key={i} className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">✓ {sk}</span>
                      ))}
                      {c.missingSkills.slice(0, 3).map((sk, i) => (
                        <span key={i} className="text-[11px] text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded">✗ {sk}</span>
                      ))}
                      {(c.matchedSkills.length + c.missingSkills.length) === 0 && c.skills.slice(0, 4).map((sk, i) => (
                        <span key={i} className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">{sk}</span>
                      ))}
                      {c.jobSkills.length > 0 && (
                        <span className="text-[11px] text-gray-400 ml-1">{c.matchedSkills.length}/{c.jobSkills.length} skills matched</span>
                      )}
                    </div>
                  </div>

                  {/* Score + bar */}
                  <div className="hidden sm:flex flex-col items-end gap-1.5 flex-shrink-0 w-28">
                    <span className={`text-xl font-bold ${scoreTextColor(c.score)}`}>{c.score}%</span>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full">
                      <div className={`h-1.5 rounded-full ${barColor(c.score)}`} style={{ width: `${c.score}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">Match Score</span>
                  </div>

                  {/* Actions */}
                  <button className="p-1.5 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </button>
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
