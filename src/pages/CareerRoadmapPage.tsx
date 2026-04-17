import React, { useState, useEffect } from 'react';
import { ArrowLeft, Target, TrendingUp, Loader, ChevronRight, BookOpen, Zap, RotateCcw } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { callAIWithFallback, generateCareerRoadmap } from '../services/aiChatService';
import { getCached, setCached, cacheKey } from '../services/aiCache';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface Props {
  onNavigate: (page: string, data?: any) => void;
  user?: any;
  onLogout?: () => void;
}

interface RoadmapStep {
  step: number;
  title: string;
  timeframe: string;
  skills: string[];
  description: string;
  milestone: string;
}

interface Roadmap {
  currentRole: string;
  targetRole: string;
  totalTimeframe: string;
  summary: string;
  steps: RoadmapStep[];
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
  { bg: 'bg-blue-600', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-600' },
  { bg: 'bg-purple-600', light: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-600' },
  { bg: 'bg-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-600' },
  { bg: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
  { bg: 'bg-pink-600', light: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', dot: 'bg-pink-600' },
];

export default function CareerRoadmapPage({ onNavigate, user, onLogout }: Props) {
  const [currentRole, setCurrentRole] = useState('');
  const [customCurrent, setCustomCurrent] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [customTarget, setCustomTarget] = useState('');
  const [experience, setExperience] = useState('');
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [error, setError] = useState('');
  const [expandedStep, setExpandedStep] = useState<number | null>(0);

  // Pre-fill from localStorage
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (u.jobTitle) setCurrentRole('custom'), setCustomCurrent(u.jobTitle);
    } catch { }
  }, []);

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
      let parsed: Roadmap;
      try {
        parsed = await generateCareerRoadmap(resolvedCurrent, resolvedTarget, experience);
      } catch {
        // backend attempt
        const res = await fetch(`${API_BASE}/ai-suggestions/career-coach`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemPrompt: 'You are a career coach. Return only valid JSON, no markdown.',
            messages: [{ role: 'user', content: `Career roadmap from "${resolvedCurrent}" to "${resolvedTarget}", experience: ${experience}. Return JSON with currentRole,targetRole,totalTimeframe,summary,steps(4),finalTip.` }],
          }),
        });
        const data = await res.json();
        const match = (data.reply || '').match(/\{[\s\S]*\}/);
        if (!match) throw new Error();
        parsed = JSON.parse(match[0]);
      }
      if (!parsed.steps || !Array.isArray(parsed.steps)) throw new Error();
      setCached(key, parsed, 30 * 60 * 1000);
      setRoadmap(parsed);
    } catch {
      setRoadmap(buildFallback(resolvedCurrent, resolvedTarget, experience));
    } finally {
      setLoading(false);
    }
  };

  const buildFallback = (current: string, target: string, exp: string): Roadmap => ({
    currentRole: current,
    targetRole: target,
    totalTimeframe: '2-3 years',
    summary: `Transitioning from ${current} to ${target} is achievable with focused learning and consistent practice. This roadmap breaks your journey into clear, actionable phases.`,
    steps: [
      { step: 1, title: 'Foundation Building', timeframe: '0-6 months', skills: ['Core concepts of ' + target, 'Industry tools', 'Best practices', 'Portfolio projects'], description: 'Build a strong foundation in the core skills required for ' + target, milestone: 'Complete 2 portfolio projects demonstrating core skills' },
      { step: 2, title: 'Skill Development', timeframe: '6-12 months', skills: ['Advanced techniques', 'Collaboration tools', 'Problem solving', 'Real-world projects'], description: 'Deepen your expertise and start applying skills in real scenarios', milestone: 'Land a junior/mid role or freelance project in target field' },
      { step: 3, title: 'Professional Growth', timeframe: '1-2 years', skills: ['Leadership basics', 'System design', 'Mentoring', 'Domain expertise'], description: 'Grow professionally and build your reputation in the field', milestone: 'Get promoted or take on a senior responsibility' },
      { step: 4, title: 'Target Role Achieved', timeframe: '2-3 years', skills: ['Strategic thinking', 'Team management', 'Innovation', 'Industry networking'], description: 'You are now operating at the ' + target + ' level with full confidence', milestone: 'Officially working as ' + target + ' with proven track record' },
    ],
    finalTip: `Stay consistent — even 1 hour of focused learning daily compounds into massive growth over 2-3 years.`,
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      {/* Hero */}
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => onNavigate('dashboard')} className="inline-flex items-center text-gray-500 hover:text-gray-800 text-sm mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </button>
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
              <><Loader className="w-4 h-4 animate-spin" /> Generating your roadmap...</>
            ) : (
              <><Zap className="w-4 h-4" /> Generate My Career Roadmap</>
            )}
          </button>
        </div>

        {/* Roadmap Result */}
        {roadmap && (
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

            {/* Timeline Steps */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-200 hidden sm:block" />

              <div className="space-y-4">
                {/* Current Position */}
                <div className="flex items-center gap-4 pl-0 sm:pl-16 relative">
                  <div className="absolute left-0 w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center hidden sm:flex flex-shrink-0">
                    <span className="text-gray-600 font-bold text-sm">NOW</span>
                  </div>
                  <div className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 w-full">
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                      Starting Point: {roadmap.currentRole}
                    </span>
                    <span className="ml-5 text-xs text-gray-400">{experience}</span>
                  </div>
                </div>

                {/* Steps */}
                {roadmap.steps && roadmap.steps.map((step, idx) => {
                  const color = STEP_COLORS[idx % STEP_COLORS.length];
                  const isExpanded = expandedStep === idx;
                  return (
                    <div key={idx} className="flex gap-4 relative">
                      {/* Step circle */}
                      <div className={`absolute left-0 w-12 h-12 ${color.bg} rounded-full flex items-center justify-center hidden sm:flex flex-shrink-0 shadow-md z-10`}>
                        <span className="text-white font-bold">{step.step}</span>
                      </div>

                      {/* Step card */}
                      <div className={`sm:ml-16 w-full border-2 ${isExpanded ? color.border : 'border-gray-200'} rounded-xl overflow-hidden transition-all`}>
                        <button
                          onClick={() => setExpandedStep(isExpanded ? null : idx)}
                          className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`sm:hidden w-7 h-7 ${color.bg} text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0`}>{step.step}</span>
                              <div>
                                <h3 className="font-bold text-gray-900">{step.title}</h3>
                                <span className={`text-xs font-semibold ${color.text} ${color.light} px-2 py-0.5 rounded-full inline-flex items-center gap-1`}>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                  {step.timeframe}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>
                        </button>

                        {isExpanded && (
                          <div className={`px-4 pb-4 ${color.light} border-t ${color.border}`}>
                            {/* Description */}
                            <p className="text-sm text-gray-700 mt-3 mb-3">{step.description}</p>

                            {/* Skills */}
                            {step.skills && step.skills.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Skills to Learn</p>
                                <div className="flex flex-wrap gap-2">
                                  {step.skills.map((skill, i) => (
                                    <span key={i} className={`text-sm px-3 py-1 rounded-full font-medium border ${color.border} ${color.text} bg-white`}>
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Milestone */}
                            <div className={`flex items-start gap-2 bg-white border ${color.border} rounded-lg p-3`}>
                              <div className="w-7 h-7 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Milestone</p>
                                <p className="text-sm text-gray-800 font-medium">{step.milestone}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Goal Achieved */}
                <div className="flex items-center gap-4 relative">
                  <div className="absolute left-0 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center hidden sm:flex flex-shrink-0 shadow-md">
                    <svg className="w-6 h-6 text-yellow-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  </div>
                  <div className="sm:ml-16 w-full bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl px-4 py-3">
                    <span className="text-sm font-bold text-yellow-800 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                      Goal Achieved: {roadmap.targetRole}
                    </span>
                    <p className="text-xs text-yellow-700 mt-0.5">Total journey: {roadmap.totalTimeframe}</p>
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
                onClick={() => { setRoadmap(null); setCurrentRole(''); setTargetRole(''); setExperience(''); }}
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
        )}

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
