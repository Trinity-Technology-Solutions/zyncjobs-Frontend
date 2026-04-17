import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, CheckCircle, XCircle, BookOpen, TrendingUp, Loader, Zap, Brain, Target } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { tokenStorage } from '../utils/tokenStorage';
import { API_ENDPOINTS } from '../config/env';
import { advancedJobMatchingEngine, JobMatchResult, CandidateProfile, JobProfile } from '../services/advancedJobMatchingEngine';
import { comprehensiveAnalyticsSystem } from '../services/comprehensiveAnalyticsSystem';
import { getCached, setCached, cacheKey } from '../services/aiCache';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface SkillGapAnalysisPageProps {
  onNavigate: (page: string, params?: any) => void;
  user?: any;
  onLogout?: () => void;
}

interface LearningResource { title: string; url: string; type: string; }
interface CareerPath { currentLevel: string; nextRole: string; timeframe: string; skillsToLearn: string[]; tip: string; }

export default function SkillGapAnalysisPage({ onNavigate, user, onLogout }: SkillGapAnalysisPageProps) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [jobSearch, setJobSearch] = useState('');
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [learningResources, setLearningResources] = useState<Record<string, LearningResource[]>>({});
  const [loadingResources, setLoadingResources] = useState<Record<string, boolean>>({});
  const [careerPath, setCareerPath] = useState<CareerPath | null>(null);
  const [loadingCareerPath, setLoadingCareerPath] = useState(false);
  const [jobMatchResults, setJobMatchResults] = useState<JobMatchResult[]>([]);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);

  useEffect(() => {
    const loadSkills = async () => {
      const saved = localStorage.getItem('user');
      if (!saved) return;
      try {
        const u = JSON.parse(saved);
        const identifier = u.id || u.email;
        if (!identifier) return;
        const token = tokenStorage.getAccess();
        const res = await fetch(`${API_BASE}/profile/${encodeURIComponent(identifier)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.skills) && data.skills.length > 0) {
            setUserSkills(data.skills);
            return;
          }
        }
      } catch { /* ignore */ }
      // fallback to localStorage
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        if (Array.isArray(u.skills) && u.skills.length > 0) setUserSkills(u.skills);
      } catch { /* ignore */ }
    };
    loadSkills();
  }, []);

  useEffect(() => {
    fetch(API_ENDPOINTS.JOBS)
      .then(r => r.ok ? r.json() : [])
      .then(data => setJobs(Array.isArray(data) ? data : []))
      .catch(() => setJobs([]));
  }, []);

  useEffect(() => {
    if (!selectedJob) { setCareerPath(null); return; }
    const jobTitle = selectedJob.jobTitle || selectedJob.title || '';
    const key = cacheKey('career-path', jobTitle, userSkills.join(','));
    const cached = getCached<CareerPath>(key);
    if (cached) { setCareerPath(cached); return; }
    setLoadingCareerPath(true);
    fetch(`${API_BASE}/skill-assessments/career-path?jobTitle=${encodeURIComponent(jobTitle)}&skills=${encodeURIComponent(userSkills.join(','))}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCached(key, data); setCareerPath(data); })
      .catch(() => setCareerPath(null))
      .finally(() => setLoadingCareerPath(false));
  }, [selectedJob]);

  const fetchLearningResources = async (skill: string) => {
    if (learningResources[skill] !== undefined || loadingResources[skill]) return;
    const key = cacheKey('learning', skill);
    const cached = getCached<LearningResource[]>(key);
    if (cached) { setLearningResources(prev => ({ ...prev, [skill]: cached })); return; }
    setLoadingResources(prev => ({ ...prev, [skill]: true }));
    try {
      const res = await fetch(`${API_BASE}/skill-assessments/learning-resources?skill=${encodeURIComponent(skill)}`);
      const data = res.ok ? await res.json() : { resources: [] };
      const resources = data.resources || [];
      setCached(key, resources);
      setLearningResources(prev => ({ ...prev, [skill]: resources }));
    } catch {
      setLearningResources(prev => ({ ...prev, [skill]: [] }));
    } finally {
      setLoadingResources(prev => ({ ...prev, [skill]: false }));
    }
  };

  // Fetch all missing skill resources in parallel when job is selected
  useEffect(() => {
    if (!selectedJob || missing.length === 0) return;
    missing.forEach(skill => fetchLearningResources(skill));
  }, [selectedJob, missing.join(',')]);

  const filteredJobs = jobs.filter(j =>
    (j.jobTitle || j.title || '').toLowerCase().includes(jobSearch.toLowerCase())
  );

  const saveSkillsToDB = async (skills: string[]) => {
    try {
      const saved = localStorage.getItem('user');
      if (!saved) return;
      const u = JSON.parse(saved);
      const email = u.email;
      if (!email) return;
      const token = tokenStorage.getAccess();
      await fetch(`${API_BASE}/profile/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ email, userId: u.id || undefined, skills })
      });
    } catch { /* ignore */ }
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !userSkills.includes(s)) {
      const updated = [...userSkills, s];
      setUserSkills(updated);
      saveSkillsToDB(updated);
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    const updated = userSkills.filter(s => s !== skill);
    setUserSkills(updated);
    saveSkillsToDB(updated);
  };

  const jobSkills: string[] = selectedJob
    ? (selectedJob.skills || []).map((s: string) => s.trim()).filter(Boolean)
    : [];
  const userSkillsLower = userSkills.map(s => s.toLowerCase());
  const matched = jobSkills.filter(s => userSkillsLower.some(u => u.includes(s.toLowerCase()) || s.toLowerCase().includes(u)));
  const missing = jobSkills.filter(s => !userSkillsLower.some(u => u.includes(s.toLowerCase()) || s.toLowerCase().includes(u)));
  const matchPct = jobSkills.length > 0 ? Math.round((matched.length / jobSkills.length) * 100) : 0;

  const matchColor = matchPct >= 70 ? 'text-green-600' : matchPct >= 40 ? 'text-yellow-600' : 'text-red-500';
  const barColor = matchPct >= 70 ? 'bg-green-500' : matchPct >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <div className="min-h-screen bg-gray-50">

        {/* Compact Hero Banner */}
        <div className="text-white px-4 py-5">
          <div className="max-w-6xl mx-auto relative overflow-hidden">
            <button onClick={() => onNavigate('dashboard')} className="inline-flex items-center text-gray-500 hover:text-gray-800 text-sm mb-3">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full">
                  <Zap className="w-3 h-3" /> AI Powered
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full">
                  <TrendingUp className="w-3 h-3" /> Real-time Insights
                </span>
              </div>
              <h1 style={{ fontSize: '34px', fontWeight: 700, letterSpacing: '-0.5px' }} className="text-gray-900">
                <span className="text-gray-900">AI</span>
                <span className="text-blue-600"> Skill Gap Insights</span>
              </h1>
              <p style={{ fontSize: '16px', color: '#6B7280', maxWidth: '600px' }} className="mt-2">
                Compare your skills with job requirements and get a personalized AI learning roadmap.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-4">

          {/* Top Row: Skills + Job Selection side by side */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">

            {/* Your Skills */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs">✦</span>
                Your Skills
                <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">{userSkills.length} added</span>
              </h2>
              <div className="flex flex-wrap gap-2 border border-gray-200 rounded-lg p-2 focus-within:ring-2 focus-within:ring-blue-500 mb-2 min-h-[44px]">
                {userSkills.map(skill => (
                  <span key={skill} className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="text-blue-400 hover:text-blue-700 font-bold leading-none">×</button>
                  </span>
                ))}
                <input
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSkill()}
                  placeholder={userSkills.length === 0 ? 'Add a skill (e.g. React, Node.js...)' : 'Add more...'}
                  className="flex-1 outline-none text-sm p-1 min-w-[120px]"
                />
              </div>
              <p className="text-xs text-gray-400">Press Enter to add skills</p>
            </div>

            {/* Job Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs">🎯</span>
                Select Job to Compare
                {selectedJob && <span className="ml-auto text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-medium truncate max-w-[140px]">{selectedJob.jobTitle || selectedJob.title}</span>}
              </h2>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  value={jobSearch}
                  onChange={e => setJobSearch(e.target.value)}
                  placeholder="Search job title..."
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div className="max-h-[250px] overflow-y-auto space-y-1">
                {filteredJobs.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-3">No jobs found.</p>
                ) : (
                  filteredJobs.slice(0, 20).map((job, idx) => (
                    <div
                      key={job._id || job.id || idx}
                      onClick={() => setSelectedJob(job)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedJob?._id === job._id
                          ? 'border-purple-400 bg-purple-50 shadow-sm'
                          : 'border-gray-100 hover:border-purple-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-sm text-gray-800">{job.jobTitle || job.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{job.company} · {job.location}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Results Section */}
          {selectedJob ? (
            <div className="space-y-4">

              {/* Match Score Bar */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-4">
                  {/* Big Score Circle */}
                  <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center flex-shrink-0 font-bold text-lg ${
                    matchPct >= 70 ? 'border-green-400 text-green-600 bg-green-50' :
                    matchPct >= 40 ? 'border-yellow-400 text-yellow-600 bg-yellow-50' :
                    'border-red-400 text-red-500 bg-red-50'
                  }`}>
                    {jobSkills.length === 0 ? 'N/A' : `${matchPct}%`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-base font-semibold text-gray-800 truncate">
                        {selectedJob.jobTitle || selectedJob.title}
                        <span className="text-gray-400 font-normal"> · {selectedJob.company}</span>
                      </h2>
                      <span className="text-sm text-gray-400 flex-shrink-0 ml-2">{matched.length}/{jobSkills.length} skills</span>
                    </div>
                    {jobSkills.length === 0 ? (
                      <p className="text-sm text-yellow-600">⚠️ No skills listed for this job.</p>
                    ) : (
                      <>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 mb-1">
                          <div className={`h-2.5 rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${matchPct}%` }} />
                        </div>
                        <p className="text-sm text-gray-500">
                          {matchPct >= 70 ? '🎉 Strong match! You meet most requirements.' :
                           matchPct >= 40 ? '📈 Good foundation. A few skills to learn.' :
                           '📚 Significant gap. Focus on the missing skills below.'}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Matched + Missing side by side */}
              {jobSkills.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl border border-green-200 p-4">
                    <h3 className="text-base font-semibold text-green-700 mb-2 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Matched Skills
                      <span className="ml-auto bg-green-100 text-green-700 text-sm px-2 py-0.5 rounded-full">{matched.length}</span>
                    </h3>
                    {matched.length === 0 ? (
                      <p className="text-sm text-gray-400">No matching skills yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {matched.map(skill => (
                          <span key={skill} className="bg-green-50 border border-green-200 text-green-800 px-3 py-1 rounded-full text-sm">✓ {skill}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-xl border border-red-200 p-4">
                    <h3 className="text-base font-semibold text-red-600 mb-2 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" /> Missing Skills
                      <span className="ml-auto bg-red-100 text-red-600 text-sm px-2 py-0.5 rounded-full">{missing.length}</span>
                    </h3>
                    {missing.length === 0 ? (
                      <p className="text-sm text-gray-400">You have all required skills! 🎉</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {missing.map(skill => (
                          <span key={skill} className="bg-red-50 border border-red-200 text-red-700 px-3 py-1 rounded-full text-sm">✗ {skill}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Learning Roadmap + Career Path side by side on large screens */}
              <div className="grid lg:grid-cols-5 gap-4">

                {/* AI Learning Roadmap — wider */}
                {missing.length > 0 && (
                  <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-600" /> AI Learning Roadmap
                      <span className="text-sm text-gray-400 font-normal ml-1">({missing.length} skills to learn)</span>
                    </h3>
                    <div className="space-y-2">
                      {missing.map((skill, idx) => (
                        <div key={skill} className="border border-gray-100 rounded-lg p-3 bg-gray-50 hover:bg-white transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0">
                                {idx + 1}
                              </span>
                              <span className="text-sm font-semibold text-gray-800">{skill}</span>
                            </div>
                            {!learningResources[skill] && !loadingResources[skill] && (
                              <button
                                onClick={() => fetchLearningResources(skill)}
                                className="text-sm bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors flex-shrink-0"
                              >
                                Resources →
                              </button>
                            )}
                            {loadingResources[skill] && (
                              <span className="flex items-center gap-1 text-sm text-gray-400">
                                <Loader className="w-3 h-3 animate-spin" /> Loading
                              </span>
                            )}
                          </div>

                          {learningResources[skill] && learningResources[skill].length > 0 && (
                            <div className="mt-2 space-y-1 pl-8">
                              {learningResources[skill].map((r, i) => (
                                <a
                                  key={i}
                                  href={r.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                                >
                                  <span className="text-sm text-gray-700 truncate">{r.title}</span>
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">{r.type}</span>
                                </a>
                              ))}
                            </div>
                          )}

                          {learningResources[skill] && learningResources[skill].length === 0 && (
                            <div className="mt-2 pl-8">
                              <a
                                href={`https://www.google.com/search?q=learn+${encodeURIComponent(skill)}+tutorial+free`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                Search tutorials for {skill} →
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Career Path — narrower */}
                <div className={`${missing.length > 0 ? 'lg:col-span-2' : 'lg:col-span-5'} bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl p-4 text-white`}>
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-yellow-300" /> AI Career Path
                  </h3>
                  {loadingCareerPath && (
                    <div className="flex items-center gap-2 text-sm text-blue-200">
                      <Loader className="w-4 h-4 animate-spin" /> Generating your career path...
                    </div>
                  )}
                  {!loadingCareerPath && careerPath && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/10 rounded-lg p-2.5 text-center">
                          <p className="text-xs text-blue-200">Current Level</p>
                          <p className="text-sm font-bold mt-0.5">{careerPath.currentLevel}</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-2.5 text-center">
                          <p className="text-xs text-blue-200">Timeframe</p>
                          <p className="text-sm font-bold mt-0.5">{careerPath.timeframe}</p>
                        </div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <p className="text-xs text-blue-200 mb-1">Next Role</p>
                        <p className="text-base font-bold text-yellow-300">{careerPath.nextRole}</p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-200 mb-1.5">Skills to develop:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {careerPath.skillsToLearn.map(s => (
                            <span key={s} className="bg-white/20 text-white px-2.5 py-0.5 rounded-full text-sm">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <p className="text-sm text-blue-100">💡 {careerPath.tip}</p>
                      </div>
                    </div>
                  )}
                  {!loadingCareerPath && !careerPath && (
                    <p className="text-sm text-blue-200">Career path suggestion unavailable for this role.</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pb-2">
                <button
                  onClick={() => onNavigate('skill-assessment')}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Take Skill Assessment
                </button>
                <button
                  onClick={() => onNavigate('job-detail', { jobId: selectedJob._id, jobData: selectedJob })}
                  className="border border-blue-600 text-blue-600 px-5 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  View Job Details
                </button>
                <button
                  onClick={() => onNavigate('resume-parser')}
                  className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Update Skills via Resume
                </button>
              </div>
            </div>
          ) : (
            /* Empty state — compact */
            <div className="bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="font-medium text-gray-600 mb-1">No Analysis Yet</h3>
              <p className="text-sm text-gray-400">Add skills &amp; select a job to see AI insights</p>
            </div>
          )}
        </div>
      </div>
      <Footer onNavigate={onNavigate} />
    </>
  );
}
