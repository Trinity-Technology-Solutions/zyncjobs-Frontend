import { useState, useEffect } from 'react';
import { Target, TrendingUp, ChevronRight, BookOpen, Zap, RotateCcw, DollarSign, BarChart2, Sparkles, Award } from 'lucide-react';
import { AIFeatureLoader } from '../components/AIProgressLoader';
import BackButton from '../components/BackButton';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { generateCareerRoadmap } from '../services/aiChatService';
import { getCached, setCached, cacheKey } from '../services/aiCache';
import { saveRoadmapToDB, fetchRoadmapFromDB } from '../api/roadmap';

interface Props {
  onNavigate: (page: string, data?: any) => void;
  user?: any;
  onLogout?: () => void;
}

interface SkillDetail {
  name: string;
  why: string;
  resource?: { name: string; url: string; type: string }[];
}

interface Milestone {
  title: string;
  description: string;
  completed?: boolean;
}

interface MarketDemand {
  level: 'high' | 'medium' | 'low';
  score: number;
  trends: string[];
}

interface RoadmapStep {
  step: number;
  title: string;
  timeframe: string;
  skills: string[];
  skillDetails: SkillDetail[];
  description: string;
  milestones: Milestone[];
  salaryRange?: string;
  certifications: { name: string; provider: string; priority: string }[];
  marketDemand?: MarketDemand;
  completed?: boolean;
}

interface Roadmap {
  currentRole: string;
  targetRole: string;
  totalTimeframe: string;
  summary: string;
  steps: RoadmapStep[];
  certifications: { name: string; provider: string; priority: string }[];
  salaryProgression: { phase: number; expected_range: string }[];
  marketTrends: string[];
  marketDemand?: MarketDemand;
  transferableSkills: string[];
  finalTip: string;
}

const JOB_ROLES = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Data Scientist', 'Data Analyst', 'Machine Learning Engineer',
  'DevOps Engineer', 'Cloud Engineer', 'Product Manager',
  'UI/UX Designer', 'Business Analyst', 'QA Engineer',
  'Mobile Developer', 'Cybersecurity Analyst', 'HR Manager',
  'Marketing Manager', 'Sales Executive', 'Project Manager',
];

const EXP_LEVELS = ['Fresher (0-1 yr)', '1-2 years', '2-4 years', '4-7 years', '7+ years'];

const STEP_COLORS = [
  { bg: 'bg-blue-600', light: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800', dot: 'bg-blue-600' },
  { bg: 'bg-purple-600', light: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-800', dot: 'bg-purple-600' },
  { bg: 'bg-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-800', dot: 'bg-emerald-600' },
  { bg: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800', dot: 'bg-orange-500' },
  { bg: 'bg-pink-600', light: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-800', dot: 'bg-pink-600' },
];

export default function CareerRoadmapPage({ onNavigate, user, onLogout }: Props) {
  const [currentRole, setCurrentRole] = useState('');
  const [customCurrent, setCustomCurrent] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [customTarget, setCustomTarget] = useState('');
  const [experience, setExperience] = useState('');
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [, setError] = useState('');
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Restore saved roadmap — DB first, localStorage fallback + pre-fill user jobTitle
  useEffect(() => {
    const restore = async () => {
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = u._id || u.id || u.email;
        if (userId) {
          const dbData = await fetchRoadmapFromDB(userId);
          if (dbData?.roadmapData) {
            setRoadmap(dbData.roadmapData as Roadmap);
            setCurrentRole(dbData.currentRole || '');
            setTargetRole(dbData.targetRole || '');
            setExperience(dbData.experience || '');
            setCompletedSteps(new Set(dbData.completedSteps || []));
            localStorage.setItem('career_roadmap_state', JSON.stringify({ roadmap: dbData.roadmapData, currentRole: dbData.currentRole, targetRole: dbData.targetRole, experience: dbData.experience, completedSteps: dbData.completedSteps }));
            return;
          }
        }
        // Fallback to localStorage
        const saved = localStorage.getItem('career_roadmap_state');
        if (saved) {
          const { roadmap: r, currentRole: cr, customCurrent: cc, targetRole: tr, customTarget: ct, experience: exp, completedSteps: cs } = JSON.parse(saved);
          if (r) { setRoadmap(r); setCurrentRole(cr || ''); setCustomCurrent(cc || ''); setTargetRole(tr || ''); setCustomTarget(ct || ''); setExperience(exp || ''); setCompletedSteps(new Set(cs || [])); return; }
        }
        // Pre-fill jobTitle from user profile if no saved roadmap
        const u2 = JSON.parse(localStorage.getItem('user') || '{}');
        if (u2.jobTitle) { setCurrentRole('custom'); setCustomCurrent(u2.jobTitle); }
      } catch { }
    };
    restore();
  }, []);

  const syncToDB = (r: Roadmap, cr: string, tr: string, exp: string, cs: Set<number>) => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = u._id || u.id || u.email;
      if (userId) saveRoadmapToDB({ userId, currentRole: cr, targetRole: tr, experience: exp, roadmapData: r, completedSteps: [...cs] });
    } catch { }
  };

  const toggleStepComplete = (step: number) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(step)) newSet.delete(step); else newSet.add(step);
      if (roadmap) {
        try { const saved = JSON.parse(localStorage.getItem('career_roadmap_state') || '{}'); localStorage.setItem('career_roadmap_state', JSON.stringify({ ...saved, completedSteps: [...newSet] })); } catch { }
        syncToDB(roadmap, resolvedCurrent, resolvedTarget, experience, newSet);
      }
      return newSet;
    });
  };

  const toggleMilestoneComplete = (step: number, milestoneIndex: number) => {
    setRoadmap(prev => {
      if (!prev) return prev;
      const newSteps = prev.steps.map(s =>
        s.step === step ? { ...s, milestones: s.milestones.map((m, i) => i === milestoneIndex ? { ...m, completed: !m.completed } : m) } : s
      );
      const updated = { ...prev, steps: newSteps };
      try { const saved = JSON.parse(localStorage.getItem('career_roadmap_state') || '{}'); localStorage.setItem('career_roadmap_state', JSON.stringify({ ...saved, roadmap: updated })); } catch { }
      syncToDB(updated, resolvedCurrent, resolvedTarget, experience, completedSteps);
      return updated;
    });
  };

  const resolvedCurrent = currentRole === 'custom' ? customCurrent : currentRole;
  const resolvedTarget = targetRole === 'custom' ? customTarget : targetRole;
  const canGenerate = resolvedCurrent.trim() && resolvedTarget.trim() && experience;

  const generateRoadmap = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError('');
    setRoadmap(null);
    setExpandedStep(0);

    const key = cacheKey('roadmap', resolvedCurrent, resolvedTarget, experience);
    const cached = getCached<Roadmap>(key);
    if (cached) { setRoadmap(cached); setLoading(false); return; }

    try {
      const parsed = await generateCareerRoadmap(resolvedCurrent, resolvedTarget, experience);
      if (!parsed.steps || !Array.isArray(parsed.steps)) throw new Error();
      setCached(key, parsed, 30 * 60 * 1000);
      setRoadmap(parsed);
      saveRoadmapState(parsed);
    } catch {
      const fallback = buildFallback(resolvedCurrent, resolvedTarget, experience);
      setRoadmap(fallback);
      saveRoadmapState(fallback);
    } finally {
      setLoading(false);
    }
  };

  const saveRoadmapState = (r: Roadmap) => {
    const cr = currentRole === 'custom' ? customCurrent : currentRole;
    const tr = targetRole === 'custom' ? customTarget : targetRole;
    try {
      localStorage.setItem('career_roadmap_state', JSON.stringify({
        roadmap: r, currentRole, customCurrent, targetRole, customTarget, experience, completedSteps: [...completedSteps]
      }));
    } catch { }
    syncToDB(r, cr, tr, experience, completedSteps);
  };

  const buildFallback = (current: string, target: string, _exp: string): Roadmap => ({
    currentRole: current,
    targetRole: target,
    totalTimeframe: '2-3 years',
    summary: `Transitioning from ${current} to ${target} is achievable with focused learning and consistent practice. This roadmap breaks your journey into clear, actionable phases.`,
    steps: [
      {
        step: 1,
        title: 'Foundation Building',
        timeframe: '0-6 months',
        skills: ['Core concepts of ' + target, 'Industry tools', 'Best practices', 'Portfolio projects'],
        skillDetails: [
          { name: 'Core concepts of ' + target, why: 'Fundamental building blocks for your target role', resource: [{ name: 'FreeCodeCamp', url: 'https://freecodecamp.org', type: 'course' }] },
          { name: 'Industry tools', why: 'Standard tooling used in professional environments', resource: [{ name: 'Official docs', url: 'https://docs.example.com', type: 'docs' }] },
        ],
        description: 'Build a strong foundation in the core skills required for ' + target,
        milestones: [
          { title: 'Core concepts mastered', description: 'Can explain core concepts clearly', completed: false },
          { title: '2 portfolio projects done', description: 'Complete 2 projects demonstrating core skills', completed: false },
        ],
        salaryRange: 'Entry level range',
        certifications: [{ name: 'Entry Level Certification', provider: 'Industry Org', priority: 'high' }],
        marketDemand: { level: 'high', score: 85, trends: ['High demand', 'Growing market'] },
        completed: false,
      },
      {
        step: 2,
        title: 'Skill Development',
        timeframe: '6-12 months',
        skills: ['Advanced techniques', 'Collaboration tools', 'Problem solving', 'Real-world projects'],
        skillDetails: [
          { name: 'Advanced techniques', why: 'Deepen expertise beyond basics', resource: [{ name: 'Advanced Course', url: 'https://example.com/advanced', type: 'course' }] },
        ],
        description: 'Deepen your expertise and start applying skills in real scenarios',
        milestones: [
          { title: 'Land junior role', description: 'Get hired or freelance in target field', completed: false },
          { title: 'Complete 3 real projects', description: 'Ship 3 real-world projects', completed: false },
        ],
        certifications: [{ name: 'Intermediate Cert', provider: 'Industry Org', priority: 'medium' }],
        marketDemand: { level: 'high', score: 80, trends: ['Strong demand'] },
        completed: false,
      },
      {
        step: 3,
        title: 'Professional Growth',
        timeframe: '1-2 years',
        skills: ['Leadership basics', 'System design', 'Mentoring', 'Domain expertise'],
        skillDetails: [
          { name: 'System design', why: 'Essential for senior roles', resource: [{ name: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer', type: 'github' }] },
        ],
        description: 'Grow professionally and build your reputation in the field',
        milestones: [
          { title: 'Promoted or senior role', description: 'Take on senior responsibilities', completed: false },
          { title: 'Mentor junior devs', description: 'Guide at least 2 junior developers', completed: false },
        ],
        certifications: [{ name: 'Advanced Cert', provider: 'Industry Org', priority: 'low' }],
        marketDemand: { level: 'medium', score: 70, trends: ['Stable demand'] },
        completed: false,
      },
      {
        step: 4,
        title: 'Target Role Achieved',
        timeframe: '2-3 years',
        skills: ['Strategic thinking', 'Team management', 'Innovation', 'Industry networking'],
        skillDetails: [
          { name: 'Strategic thinking', why: 'Drive business impact through technology', resource: [] },
        ],
        description: 'You are now operating at the ' + target + ' level with full confidence',
        milestones: [
          { title: 'Working as ' + target, description: 'Officially in target role with proven track record', completed: false },
          { title: 'Industry recognition', description: 'Speak at conferences or publish articles', completed: false },
        ],
        certifications: [],
        marketDemand: { level: 'high', score: 90, trends: ['Leadership demand'] },
        completed: false,
      },
    ],
    certifications: [],
    salaryProgression: [],
    marketTrends: [],
    marketDemand: { level: 'high', score: 85, trends: ['High demand', 'Growing market'] },
    transferableSkills: [],
    finalTip: `Stay consistent — even 1 hour of focused learning daily compounds into massive growth over 2-3 years.`,
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      {/* Hero */}
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <BackButton onClick={() => onNavigate('dashboard')} className="mb-4" />
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full">
                <Zap className="w-3 h-3" /> AI Powered
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full">
                <TrendingUp className="w-3 h-3" /> Career Growth
              </span>
            </div>
            <h1 style={{ fontSize: '34px', fontWeight: 700, letterSpacing: '-0.5px' }} className="text-gray-900">
              <span className="text-gray-900">AI</span>
              <span className="text-blue-600"> Career Roadmap</span>
            </h1>
            <p style={{ fontSize: '16px', color: '#6B7280', maxWidth: '600px' }} className="mt-2">
              AI-powered step-by-step path from where you are to where you want to be.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 w-full flex-1">

        {/* Input Form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" /> Set Your Career Goal
          </h2>

          <div className="grid md:grid-cols-3 gap-4 mb-4">
            {/* Current Role */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Current Role</label>
              <select
                value={currentRole}
                onChange={e => setCurrentRole(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select role...</option>
                {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                <option value="custom">+ Custom Role</option>
              </select>
              {currentRole === 'custom' && (
                <input
                  type="text" placeholder="Enter your current role"
                  value={customCurrent} onChange={e => setCustomCurrent(e.target.value)}
                  className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* Target Role */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Target Role</label>
              <select
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select target...</option>
                {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                <option value="custom">+ Custom Role</option>
              </select>
              {targetRole === 'custom' && (
                <input
                  type="text" placeholder="Enter your target role"
                  value={customTarget} onChange={e => setCustomTarget(e.target.value)}
                  className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Current Experience</label>
              <select
                value={experience}
                onChange={e => setExperience(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select experience...</option>
                {EXP_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={generateRoadmap}
            disabled={!canGenerate || loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Zap className="w-4 h-4 animate-pulse" /> Generating roadmap...</>
            ) : (
              <><Zap className="w-4 h-4" /> Generate My Career Roadmap</>
            )}
          </button>
        </div>

          {loading ? (
            <AIFeatureLoader
              title="Generating your roadmap"
              subtitle={`${resolvedCurrent} to ${resolvedTarget}`}
              icon="chart"
              steps={['Analyzing your current role', 'Mapping skill requirements', 'Building progression steps', 'Calculating timeframes', 'Finalizing roadmap']}
            />
          ) : roadmap ? (
          <div className="space-y-6">

            {/* Summary Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="bg-white/20 text-white text-sm font-semibold px-3 py-1 rounded-full">{roadmap.currentRole}</span>
                    <ChevronRight className="w-4 h-4 text-blue-200" />
                    <span className="bg-yellow-400 text-yellow-900 text-sm font-bold px-3 py-1 rounded-full">{roadmap.targetRole}</span>
                  </div>
                  <p className="text-blue-100 text-sm leading-relaxed">{roadmap.summary}</p>
                </div>
                <div className="bg-white/15 rounded-xl px-4 py-3 text-center flex-shrink-0">
                  <div className="text-2xl font-black">{roadmap.totalTimeframe}</div>
                  <div className="text-xs text-blue-200">Total Time</div>
                </div>
              </div>
            </div>

            {/* Personalized Transition Card */}
            {roadmap.transferableSkills && roadmap.transferableSkills.length > 0 && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Your Transferable Skills</p>
                    <p className="text-xs text-emerald-600">Skills from {roadmap.currentRole} that give you a head start</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {roadmap.transferableSkills.map((skill, i) => (
                    <span key={i} className="text-sm px-3 py-1 rounded-full font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Market Demand */}
            {(roadmap.marketDemand || (roadmap.marketTrends && roadmap.marketTrends.length > 0)) && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <BarChart2 className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">Market Demand for {roadmap.targetRole}</p>
                </div>
                {roadmap.marketDemand ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Demand Level</span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        roadmap.marketDemand.level === 'high' ? 'bg-green-100 text-green-800' :
                        roadmap.marketDemand.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {roadmap.marketDemand.level.toUpperCase()} ({roadmap.marketDemand.score}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                      <div className={`h-2.5 rounded-full transition-all ${
                        roadmap.marketDemand.level === 'high' ? 'bg-green-500' :
                        roadmap.marketDemand.level === 'medium' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} style={{ width: `${roadmap.marketDemand.score}%` }} />
                    </div>
                    {roadmap.marketDemand.trends && roadmap.marketDemand.trends.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {roadmap.marketDemand.trends.map((trend, i) => (
                          <span key={i} className="text-xs px-3 py-1.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {trend}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {roadmap.marketTrends.map((trend, i) => (
                      <span key={i} className="text-xs px-3 py-1.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {trend}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Salary Progression */}
            {roadmap.salaryProgression && roadmap.salaryProgression.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">Expected Salary Progression</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {roadmap.salaryProgression.map((s, i) => (
                    <div key={i} className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                      <p className="text-xs font-semibold text-green-600 mb-1">Phase {s.phase}</p>
                      <p className="text-sm font-bold text-green-800">{s.expected_range}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {roadmap.certifications && roadmap.certifications.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">Recommended Certifications</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {roadmap.certifications.map((cert, i) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium ${
                      cert.priority === 'high' ? 'bg-purple-50 border-purple-300 text-purple-800' : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}>
                      <span>{cert.name}</span>
                      <span className="text-xs opacity-70">· {cert.provider}</span>
                      {cert.priority === 'high' && <span className="text-xs bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded-full">High</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline Steps */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 top-16 bottom-16 w-0.5 bg-gray-300" />

              <div className="space-y-6">
                {/* Current Position */}
                <div className="flex items-center gap-4 relative">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                    <span className="text-gray-600 font-bold text-xs">NOW</span>
                  </div>
                  <div className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 flex-1 ml-2">
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                      Starting Point: {roadmap.currentRole}
                    </span>
                    <span className="ml-5 text-xs text-gray-500">{experience}</span>
                  </div>
                </div>

                {/* Steps */}
                {roadmap.steps && roadmap.steps.map((step, idx) => {
                  const color = STEP_COLORS[idx % STEP_COLORS.length];
                  const isExpanded = expandedStep === idx;
                  return (
                    <div key={idx} className="flex gap-4 relative">
                      {/* Step circle */}
                      <div className={`w-12 h-12 ${color.bg} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg z-10`}>
                        <span className="text-white font-bold text-sm">{step.step}</span>
                      </div>

                      {/* Step card */}
                      <div className={`flex-1 ml-2 border-2 ${isExpanded ? color.border : 'border-gray-200'} rounded-xl overflow-hidden transition-all bg-white`}>
                        <button
                          onClick={() => setExpandedStep(isExpanded ? null : idx)}
                          className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-gray-900 text-base">{step.title}</h3>
                              <span className={`text-xs font-semibold ${color.text} ${color.light} px-2 py-1 rounded-full inline-flex items-center gap-1 mt-1`}>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                {step.timeframe}
                              </span>
                            </div>
                            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>
                        </button>

                        {isExpanded && (
                          <div className={`px-4 pb-4 ${color.light} border-t ${color.border}`}>
                            {/* Progress checkbox for step */}
                            <div className="flex items-center gap-2 mb-3">
                              <input
                                type="checkbox"
                                id={`step-${step.step}`}
                                checked={completedSteps.has(step.step)}
                                onChange={() => toggleStepComplete(step.step)}
                                className={`w-5 h-5 ${color.text} rounded border-2 focus:ring-2 focus:ring-offset-2`}
                              />
                              <label htmlFor={`step-${step.step}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                                Mark this phase as complete
                              </label>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-gray-700 mt-3 mb-3 leading-relaxed">{step.description}</p>

                            {/* Skills with why tooltip */}
                            {step.skillDetails && step.skillDetails.length > 0 && (
                              <div className="mb-4">
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Skills to Learn</p>
                                <div className="space-y-2">
                                  {step.skillDetails.map((skill, i) => (
                                    <div key={i} className="group relative">
                                      <span className={`text-sm px-3 py-1.5 rounded-full font-medium border ${color.border} ${color.text} bg-white inline-flex items-center gap-1.5`}>
                                        {skill.name}
                                        {skill.why && (
                                          <span className="relative">
                                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal z-10">
                                              {skill.why}
                                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                            </div>
                                          </span>
                                        )}
                                      </span>
                                      {skill.resource && skill.resource.length > 0 && (
                                        <div className="mt-1 ml-2 flex flex-wrap gap-1.5">
                                          {skill.resource.map((res, ri) => (
                                            <a key={ri} href={res.url} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 transition-colors inline-flex items-center gap-1">
                                              <BookOpen className="w-3 h-3" /> {res.name} ({res.type})
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Fallback skills chips (backward compat) */}
                            {(!step.skillDetails || step.skillDetails.length === 0) && step.skills && step.skills.length > 0 && (
                              <div className="mb-4">
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Skills to Learn</p>
                                <div className="flex flex-wrap gap-2">
                                  {step.skills.map((skill, i) => (
                                    <span key={i} className={`text-sm px-3 py-1 rounded-full font-medium border ${color.border} ${color.text} bg-white`}>
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Salary for this phase */}
                            {step.salaryRange && (
                              <div className="mb-3 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-semibold text-green-700">{step.salaryRange}</span>
                              </div>
                            )}

                            {/* Per-phase Certifications */}
                            {step.certifications && step.certifications.length > 0 && (
                              <div className="mb-4">
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Certifications for this Phase</p>
                                <div className="flex flex-wrap gap-2">
                                  {step.certifications.map((cert, i) => (
                                    <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium ${
                                      cert.priority === 'high' ? 'bg-purple-50 border-purple-300 text-purple-800' : 'bg-gray-50 border-gray-200 text-gray-700'
                                    }`}>
                                      <span>{cert.name}</span>
                                      <span className="text-xs opacity-70">· {cert.provider}</span>
                                      {cert.priority === 'high' && <span className="text-xs bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded-full">High</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Market Demand per phase */}
                            {step.marketDemand && (
                              <div className="mb-4 p-3 bg-white border rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Market Demand</p>
                                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                    step.marketDemand.level === 'high' ? 'bg-green-100 text-green-800' :
                                    step.marketDemand.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {step.marketDemand.level.toUpperCase()} ({step.marketDemand.score}%)
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div className={`h-2 rounded-full transition-all ${
                                    step.marketDemand.level === 'high' ? 'bg-green-500' :
                                    step.marketDemand.level === 'medium' ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`} style={{ width: `${step.marketDemand.score}%` }} />
                                </div>
                                {step.marketDemand.trends && step.marketDemand.trends.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {step.marketDemand.trends.map((t, ti) => (
                                      <span key={ti} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">{t}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Milestones with progress tracking */}
                            {step.milestones && step.milestones.length > 0 && (
                              <div className="space-y-3">
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Milestones</p>
                                {step.milestones.map((ms, mi) => (
                                  <div key={mi} className={`flex items-start gap-3 bg-white border ${color.border} rounded-lg p-3`}>
                                    <input
                                      type="checkbox"
                                      id={`milestone-${step.step}-${mi}`}
                                      checked={ms.completed}
                                      onChange={() => toggleMilestoneComplete(step.step, mi)}
                                      className={`mt-1 w-5 h-5 ${color.text} rounded border-2 focus:ring-2 focus:ring-offset-2 flex-shrink-0`}
                                    />
                                    <div className="flex-1">
                                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">{ms.title}</p>
                                      <p className="text-sm text-gray-800 font-medium leading-relaxed">{ms.description}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Goal Achieved */}
                <div className="flex items-center gap-4 relative">
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg z-10">
                    <svg className="w-6 h-6 text-yellow-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  </div>
                  <div className="flex-1 ml-2 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl px-4 py-3">
                    <span className="text-sm font-bold text-yellow-800 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                      Goal Achieved: {roadmap.targetRole}
                    </span>
                    <p className="text-xs text-yellow-700 mt-1">Total journey: {roadmap.totalTimeframe}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Final Tip */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5 flex items-start gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-800 mb-0.5">Pro Tip</p>
                <p className="text-sm text-indigo-700">{roadmap.finalTip}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setRoadmap(null); setCurrentRole(''); setTargetRole(''); setExperience(''); setCustomCurrent(''); setCustomTarget(''); setCompletedSteps(new Set());
                  localStorage.removeItem('career_roadmap_state');
                  try { const u = JSON.parse(localStorage.getItem('user') || '{}'); const userId = u._id || u.id || u.email; if (userId) saveRoadmapToDB({ userId, currentRole: '', targetRole: '', experience: '', roadmapData: {} as any, completedSteps: [] }); } catch { }
                }}
                className="flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl hover:bg-gray-50 font-medium text-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> New Roadmap
              </button>
              <button
                onClick={() => onNavigate('skill-gap-analysis')}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 font-medium text-sm transition-colors"
              >
                <Target className="w-4 h-4" /> Analyse Skill Gap
              </button>
              <button
                onClick={() => onNavigate('skill-assessment')}
                className="flex items-center gap-2 border border-blue-600 text-blue-600 px-5 py-2.5 rounded-xl hover:bg-blue-50 font-medium text-sm transition-colors"
              >
                <Zap className="w-4 h-4" /> Take Skill Assessment
              </button>
              <button
                onClick={() => onNavigate('career-coach')}
                className="flex items-center gap-2 border border-purple-500 text-purple-600 px-5 py-2.5 rounded-xl hover:bg-purple-50 font-medium text-sm transition-colors"
              >
                <TrendingUp className="w-4 h-4" /> Ask Career Coach
              </button>
            </div>
          </div>
        ) : null}

        {/* Empty state */}
        {!roadmap && !loading && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-16 text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium text-lg">Your roadmap will appear here</p>
            <p className="text-gray-400 text-sm mt-1">Fill in your current role, target role, and experience above</p>
          </div>
        )}
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
