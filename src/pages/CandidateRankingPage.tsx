import React, { useState, useEffect } from 'react';
import { Trophy, Award, Briefcase, CheckCircle, Clock, XCircle, Search, RefreshCw, TrendingUp, Users, Star } from 'lucide-react';
import { API_ENDPOINTS } from '../config/constants';
import Header from '../components/Header';
import Footer from '../components/Footer';

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

const scoreCandidate = (app: any, job: any): { score: number; reasons: string[] } => {
  let score = 0;
  const reasons: string[] = [];
  const jobSkills: string[] = Array.isArray(job?.skills) ? job.skills.map((s: string) => s.toLowerCase()) : [];
  const candidateSkills: string[] = Array.isArray(app?.candidateSkills) ? app.candidateSkills.map((s: string) => s.toLowerCase()) : [];
  if (jobSkills.length > 0 && candidateSkills.length > 0) {
    const matched = jobSkills.filter(s => candidateSkills.some(cs => cs.includes(s) || s.includes(cs)));
    score += Math.round((matched.length / jobSkills.length) * 40);
    if (matched.length > 0) reasons.push(`${matched.length}/${jobSkills.length} skills matched`);
  } else { score += 20; }
  const expRange = job?.experienceRange || '';
  const candidateExp = app?.candidateExperience || '';
  if (expRange && candidateExp) {
    const req = parseInt(expRange.match(/(\d+)/)?.[1] || '0');
    const has = parseInt(candidateExp.match(/(\d+)/)?.[1] || '0');
    if (has >= req) { score += 30; reasons.push(`${has} yrs meets requirement`); }
    else if (has >= req - 1) { score += 20; reasons.push('Near-match experience'); }
    else { score += 10; }
  } else { score += 15; }
  const edu = (app?.candidateEducation || '').toLowerCase();
  if (edu.includes('master') || edu.includes('phd')) { score += 15; reasons.push('Advanced degree'); }
  else if (edu.includes('bachelor') || edu.includes('b.tech')) { score += 12; reasons.push("Bachelor's degree"); }
  else { score += 5; }
  if (app?.coverLetter && app.coverLetter.length > 50 && app.coverLetter !== 'No cover letter') { score += 10; reasons.push('Cover letter included'); }
  if (app?.resumeUrl) { score += 5; reasons.push('Resume attached'); }
  return { score: Math.min(score, 100), reasons };
};

const CandidateRankingPage: React.FC<CandidateRankingPageProps> = ({ onNavigate, user }) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [rankedCandidates, setRankedCandidates] = useState<RankedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'rank' | 'score' | 'name'>('rank');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const userEmail = user?.email;
      const [jobsRes, appsRes] = await Promise.all([fetch(API_ENDPOINTS.JOBS), fetch(API_ENDPOINTS.APPLICATIONS)]);
      const allJobs = jobsRes.ok ? await jobsRes.json() : [];
      const appsData = appsRes.ok ? await appsRes.json() : [];
      const allApps = appsData.applications || appsData || [];
      const employerJobs = allJobs.filter((j: any) => j.postedBy?.toLowerCase() === userEmail?.toLowerCase() || j.employerEmail?.toLowerCase() === userEmail?.toLowerCase());
      setJobs(employerJobs);
      const employerApps = allApps.filter((a: any) => a.employerEmail === userEmail);
      const enriched = await Promise.all(employerApps.map(async (app: any) => {
        try {
          const id = app.candidateId || app.userId || app.candidateUserId;
          let profile: any = null;
          if (id) { const r = await fetch(`${API_ENDPOINTS.USERS}/${id}`); if (r.ok) profile = await r.json(); }
          if (!profile && app.candidateEmail) { const r = await fetch(`${API_ENDPOINTS.USERS}/by-email/${encodeURIComponent(app.candidateEmail)}`); if (r.ok) profile = await r.json(); }
          if (profile) return { ...app, candidateSkills: app.candidateSkills?.length ? app.candidateSkills : (profile.skills || []), candidateExperience: app.candidateExperience || profile.experience || '', candidateEducation: app.candidateEducation || profile.education || '', candidateProfilePicture: app.candidateProfilePicture || profile.profilePicture || '', candidateName: app.candidateName || profile.name || app.candidateEmail };
        } catch {}
        return app;
      }));
      const scored: RankedCandidate[] = enriched.map((app: any) => {
        const job = employerJobs.find((j: any) => String(j._id || j.id) === String(app.jobId?._id || app.jobId?.id || app.jobId));
        const { score, reasons } = scoreCandidate(app, job);
        return { id: app._id || app.id, name: app.candidateName || app.candidateEmail || 'Candidate', email: app.candidateEmail || '', rank: 0, score, jobTitle: app.jobTitle || job?.jobTitle || job?.title || 'Position', jobId: String(app.jobId?._id || app.jobId?.id || app.jobId || ''), skills: Array.isArray(app.candidateSkills) ? app.candidateSkills : [], experience: app.candidateExperience || 'Not specified', education: app.candidateEducation || 'Not specified', interviewStatus: (app.status === 'hired' ? 'hired' : app.status === 'rejected' ? 'rejected' : app.status === 'interviewed' ? 'completed' : app.status === 'shortlisted' ? 'scheduled' : 'not_scheduled') as RankedCandidate['interviewStatus'], appliedAt: app.createdAt || '', profilePicture: app.candidateProfilePicture || '', matchReasons: reasons };
      });
      const groups: Record<string, RankedCandidate[]> = {};
      scored.forEach(c => { if (!groups[c.jobId]) groups[c.jobId] = []; groups[c.jobId].push(c); });
      Object.values(groups).forEach(g => { g.sort((a, b) => b.score - a.score); g.forEach((c, i) => { c.rank = i + 1; }); });
      setRankedCandidates(scored);
    } catch (e) { console.error(e); } finally { setLoading(false); }
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

      {/* Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Candidate Ranking & Matching</h1>
              <p className="text-blue-300 text-sm mt-0.5">AI-powered scoring · Find your best candidates instantly</p>
            </div>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur px-4 py-2 rounded-xl border border-white/20 text-sm text-white transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Applicants', value: rankedCandidates.length, color: 'text-slate-700', icon: Users, bg: 'bg-slate-100' },
            { label: 'Avg Match Score', value: `${avgScore}%`, color: 'text-blue-600', icon: TrendingUp, bg: 'bg-blue-50' },
            { label: 'Strong Matches', value: rankedCandidates.filter(c => c.score >= 80).length, color: 'text-emerald-600', icon: Star, bg: 'bg-emerald-50' },
            { label: 'Hired', value: rankedCandidates.filter(c => c.interviewStatus === 'hired').length, color: 'text-violet-600', icon: CheckCircle, bg: 'bg-violet-50' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Top 3 Podium */}
        {top3.length > 0 && (
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

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input type="text" placeholder="Search by name, email or job..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder-gray-400" />
          </div>
          <select value={selectedJob} onChange={e => setSelectedJob(e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-white min-w-[160px]">
            <option value="all">All Jobs</option>
            {jobs.map(j => <option key={j._id || j.id} value={String(j._id || j.id)}>{j.jobTitle || j.title}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="all">All Status</option>
            <option value="not_scheduled">Pending</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Interviewed</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="rank">Sort by Rank</option>
            <option value="score">Sort by Score</option>
            <option value="name">Sort by Name</option>
          </select>
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} candidate{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* List */}
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
                <div key={c.id} className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all ${isTop && c.rank === 1 ? 'border-yellow-200' : 'border-gray-100'}`}>
                  <div className="flex items-start gap-4">

                    {/* Rank */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${c.rank === 1 ? 'bg-yellow-400 text-yellow-900' : c.rank === 2 ? 'bg-gray-200 text-gray-700' : c.rank === 3 ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      #{c.rank}
                    </div>

                    {/* Avatar */}
                    <Avatar name={c.name} photo={c.profilePicture} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-base">{c.name}</h3>
                          <p className="text-sm text-gray-400">{c.email}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-xs text-blue-600 font-medium">{c.jobTitle}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-center">
                            <div className={`text-xl font-bold px-3 py-1.5 rounded-xl border-2 ${scoreColor(c.score)}`}>{c.score}%</div>
                            <p className="text-xs text-gray-400 mt-0.5">Match</p>
                          </div>
                          <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${st.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </div>
                      </div>

                      {/* Score bar */}
                      <div className="mt-3 mb-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-400">Job Fit Score</span>
                          <span className="text-xs font-medium text-gray-600">{c.score}/100</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className={`h-2 rounded-full ${barColor(c.score)} transition-all`} style={{ width: `${c.score}%` }} />
                        </div>
                      </div>

                      {/* Match reasons */}
                      {c.matchReasons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {c.matchReasons.map((r, i) => (
                            <span key={i} className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> {r}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Skills */}
                      {c.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {c.skills.slice(0, 7).map((sk, i) => (
                            <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{sk}</span>
                          ))}
                          {c.skills.length > 7 && <span className="text-xs text-gray-400 px-1">+{c.skills.length - 7} more</span>}
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
