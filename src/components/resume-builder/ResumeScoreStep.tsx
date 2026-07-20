import React, { useState } from 'react';
import { Sparkles, Loader2, AlertTriangle, Target, FileText, FolderOpen, Crown, Paintbrush, BookOpen, TrendingUp, Star } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { executeResumeAI } from '../../services/resumeAIClient';

interface ScoreDimension {
  label: string;
  score: number;
  max: number;
  tip: string;
  color: string;
  icon: React.ReactNode;
}

function calcScores(data: ReturnType<typeof useResumeStore>['data']): ScoreDimension[] {
  const summaryVal = Array.isArray(data.summary)
    ? (data.summary as string[]).filter(Boolean).join(' ')
    : data.summary || '';
  const bullets = data.experience.flatMap((e) => e.bullets.filter((b) => b.trim()));
  const hasNumbers = bullets.some((b) => /\d/.test(b));
  const hasActionVerbs = bullets.some((b) =>
    /^(led|built|designed|developed|improved|reduced|increased|managed|delivered|implemented|optimized|spearheaded|engineered)/i.test(b.trim())
  );
  const avgBulletLen = bullets.length ? bullets.reduce((s, b) => s + b.length, 0) / bullets.length : 0;
  const hasBasicInfo = !!(data.personalInfo.name && data.personalInfo.email);

  const skillCategories: Record<string, string[]> = {
    frontend: ['react', 'angular', 'vue', 'svelte', 'html', 'css', 'javascript', 'typescript', 'tailwind', 'bootstrap'],
    backend: ['python', 'java', 'go', 'rust', 'c#', 'ruby', 'php', 'node', 'nodejs', 'spring', 'django', 'flask', 'fastapi', '.net'],
    database: ['sql', 'postgresql', 'mongodb', 'redis', 'mysql', 'oracle', 'dynamodb', 'cassandra', 'elasticsearch'],
    cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins'],
    mobile: ['swift', 'kotlin', 'flutter', 'react native', 'dart', 'ionic'],
    data: ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'spark', 'hadoop'],
  };
  const genericSkills = ['team player', 'hard working', 'communication', 'leadership', 'problem solving', 'fast learner', 'creative', 'organized', 'detail oriented', 'self motivated', 'reliable', 'dedicated', 'flexible', 'adaptable'];
  const skillsLower = data.skills.map(s => s.toLowerCase());
  const specificCount = skillsLower.filter(s => !genericSkills.includes(s)).length;
  const categoriesCovered = new Set(Object.entries(skillCategories)
    .filter(([, cats]) => skillsLower.some(s => cats.some(c => s.includes(c))))
    .map(([cat]) => cat));
  const skillDiversity = Math.min(10, categoriesCovered.size * 3);
  const targetRole = (data.targetRole || '').toLowerCase();
  const roleKeywords = targetRole ? targetRole.split(/\s+/).filter(w => w.length > 2) : [];
  const roleSkillMatch = targetRole && roleKeywords.length > 0
    ? skillsLower.filter(s => roleKeywords.some(k => s.includes(k))).length
    : 0;

  return [
    {
      label: 'ATS', score: Math.min(100,
        (data.personalInfo.name ? 8 : 0) + (data.personalInfo.email ? 8 : 0) +
        (data.personalInfo.phone ? 4 : 0) + (summaryVal ? 15 : 0) +
        Math.min(15, data.skills.length * 2) +
        (specificCount >= 3 ? 10 : specificCount >= 1 ? 5 : 0) +
        skillDiversity +
        (roleSkillMatch > 0 ? 5 : 0) +
        (data.experience.length ? 20 : 0) +
        Math.min(10, bullets.length * 2)
      ), max: 100, tip: 'Add 8-15 specific, diverse skills. Align skills with target role.', color: 'bg-blue-500', icon: <Target className="w-4 h-4 text-blue-500" />,
    },
    {
      label: 'Grammar', score: bullets.length === 0 ? 0 : Math.min(100,
        40 + (hasActionVerbs ? 30 : 0) + (avgBulletLen > 30 && avgBulletLen < 150 ? 30 : 0)
      ), max: 100, tip: 'Start bullets with action verbs. Keep 30–150 chars.', color: 'bg-purple-500', icon: <FileText className="w-4 h-4 text-purple-500" />,
    },
    {
      label: 'Projects', score: Math.min(100,
        ((data.projects?.length || 0) >= 2 ? 60 : (data.projects?.length || 0) * 25) +
        Math.min(40, bullets.length * 5)
      ), max: 100, tip: 'Add 2+ projects with detailed bullet points.', color: 'bg-green-500', icon: <FolderOpen className="w-4 h-4 text-green-500" />,
    },
    {
      label: 'Leadership', score: Math.min(100,
        ((data.achievements?.length || 0) > 0 ? 30 : 0) +
        ((data.awards?.length || 0) > 0 ? 25 : 0) +
        (data.experience.filter(e => e.title?.toLowerCase().includes('lead') || e.title?.toLowerCase().includes('manager')).length > 0 ? 25 : 0) +
        (bullets.some(b => /(led|managed|mentor|team|directed|supervised)/i.test(b)) ? 20 : 0)
      ), max: 100, tip: 'Add leadership roles, awards, and mentoring experience.', color: 'bg-amber-500', icon: <Crown className="w-4 h-4 text-amber-500" />,
    },
    {
      label: 'Formatting', score: (() => {
        if (!hasBasicInfo && data.experience.length === 0 && data.skills.length === 0) return 0;
        let f = 0;
        if (hasBasicInfo) f += 20;
        if (bullets.length > 0 && bullets.every(b => b.length < 200)) f += 30;
        if (data.skills.length > 0) f += 25;
        if (summaryVal.length > 0) f += 25;
        return Math.min(100, f);
      })(), max: 100, tip: 'Keep bullets under 200 chars, add skills + summary.', color: 'bg-teal-500', icon: <Paintbrush className="w-4 h-4 text-teal-500" />,
    },
    {
      label: 'Readability', score: bullets.length === 0 ? 0 : Math.min(100,
        (avgBulletLen > 20 && avgBulletLen < 120 ? 50 : 20) +
        (bullets.length >= 3 ? 30 : bullets.length * 10) +
        (data.skills.length > 0 ? 20 : 0)
      ), max: 100, tip: 'Keep bullets 20–120 chars. Use 3–5 per role.', color: 'bg-cyan-500', icon: <BookOpen className="w-4 h-4 text-cyan-500" />,
    },
    {
      label: 'Impact', score: bullets.length === 0 ? 0 : Math.min(100,
        (hasNumbers ? 50 : 0) + (hasActionVerbs ? 30 : 0) +
        ((data.achievements?.length || 0) > 0 ? 20 : 0)
      ), max: 100, tip: 'Add numbers (%, $) and measurable achievements.', color: 'bg-orange-500', icon: <TrendingUp className="w-4 h-4 text-orange-500" />,
    },
    {
      label: 'Confidence', score: Math.min(100,
        (data.personalInfo.linkedin ? 20 : 0) + (data.personalInfo.portfolio ? 20 : 0) +
        ((data.certifications?.length || 0) > 0 ? 20 : 0) + ((data.awards?.length || 0) > 0 ? 20 : 0) +
        (data.experience.length >= 2 ? 20 : data.experience.length * 10)
      ), max: 100, tip: 'Add LinkedIn, portfolio, certs, and 2+ experiences.', color: 'bg-rose-500', icon: <Star className="w-4 h-4 text-rose-500" />,
    },
  ];
}

export default function ResumeScoreStep() {
  const { data } = useResumeStore();
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const scores = calcScores(data);
  const overall = Math.round(scores.reduce((s, d) => s + d.score, 0) / scores.length);

  const getAIExplanation = async () => {
    setLoading(true);
    try {
      const weakest = scores.filter((s) => s.score < 60).map((s) => s.label).join(', ');
      const res = await executeResumeAI({
        section: 'resume', action: 'score_advice',
        content: `Resume score: overall ${overall}%. Weak areas: ${weakest || 'none'}.`,
      });
      setAiTips((res.result || '').split(/\n|•|\d\./).map((t) => t.trim()).filter((t) => t.length > 10).slice(0, 4));
    } catch {
      setAiTips([
        'Add quantified achievements with numbers to boost Impact.',
        'Include LinkedIn and portfolio to increase Confidence.',
        'Paste a job description in AI Optimize to improve ATS.',
      ]);
    } finally {
      setLoading(false);
    }
  };

  const overallColor = overall >= 80 ? 'text-green-600' : overall >= 60 ? 'text-yellow-600' : 'text-red-500';
  const ringColor = overall >= 80 ? '#22c55e' : overall >= 60 ? '#eab308' : '#ef4444';
  const barColor = overall >= 80 ? 'bg-green-500' : overall >= 60 ? 'bg-yellow-500' : 'bg-red-400';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Resume Health</h2>
        <p className="text-sm text-gray-500">8-dimension analysis of your resume strength</p>
      </div>

      {/* Overall ring */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-2xl p-6 flex items-center gap-6">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke={ringColor}
              strokeWidth="2.5" strokeDasharray={`${overall} ${100 - overall}`} strokeLinecap="round" />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-xl font-bold ${overallColor}`}>{overall}</span>
        </div>
        <div className="flex-1">
          <p className="text-lg font-bold text-gray-900">
            Resume Health <span className={overallColor}>{overall}%</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {overall >= 80 ? 'Excellent — your resume is ready to go!' :
             overall >= 60 ? 'Good — a few tweaks will make it great.' :
             'Needs significant improvement.'}
          </p>
          <button onClick={getAIExplanation} disabled={loading}
            className="mt-3 flex items-center gap-2 px-4 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
            {loading ? <><Loader2 className="w-3 h-3 animate-spin" />Analyzing...</> : <><Sparkles className="w-3 h-3" />Get AI Tips</>}
          </button>
        </div>
      </div>

      {/* AI Tips */}
      {aiTips.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-semibold text-purple-800 flex items-center gap-2"><Sparkles className="w-4 h-4" />AI Suggested Improvements</p>
          {aiTips.map((tip, i) => (
            <p key={i} className="text-sm text-gray-700 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              {tip}
            </p>
          ))}
        </div>
      )}

      {/* Health bars */}
      <div className="space-y-2">
        {scores.map((dim) => {
          const dimColor = dim.score >= 80 ? 'text-green-600' : dim.score >= 60 ? 'text-yellow-600' : 'text-red-500';
          const dimBar = dim.score >= 80 ? 'bg-green-500' : dim.score >= 60 ? 'bg-yellow-400' : 'bg-red-400';
          return (
            <div key={dim.label} className="flex items-center gap-3 group">
              <span className="w-6 flex items-center justify-center shrink-0">{dim.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{dim.label}</span>
                  <span className={`text-xs font-bold ${dimColor}`}>{dim.score}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div className={`h-2.5 rounded-full transition-all duration-500 ${dimBar}`} style={{ width: `${dim.score}%` }} />
                </div>
                {dim.score < 80 && (
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate group-hover:text-clip">{dim.tip}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
