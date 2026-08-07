import React, { useState } from 'react';
import { Sparkles, Loader2, AlertTriangle, Target, FileText, FolderOpen, Crown, Paintbrush, BookOpen, TrendingUp, Star } from 'lucide-react';
import { useResumeStore, type ResumeData, type ExperienceItem, type ProjectItem } from '../../store/useResumeStore';
import { executeResumeAI } from '../../services/resumeAIClient';

const GOAL_LABELS: Record<string, string> = {
  'first-job': 'First Job',
  'internship': 'Internship',
  'career-switch': 'Career Switch',
  'experienced': 'Experienced Professional',
  'executive': 'Executive',
};

interface ScoreDimension {
  label: string;
  score: number;
  max: number;
  tip: string;
  color: string;
  icon: React.ReactNode;
}

function calcScores(data: ResumeData): ScoreDimension[] {
  const goal = data.goal || '';
  const summaryVal = typeof data.summary === 'string' ? data.summary : '';
  const bullets = data.experience.flatMap((experience: ExperienceItem) => experience.bullets.filter((bullet: string) => bullet.trim()));
  const hasNumbers = bullets.some((bullet: string) => /\d/.test(bullet));
  const hasActionVerbs = bullets.some((bullet: string) =>
    /^(led|built|designed|developed|improved|reduced|increased|managed|delivered|implemented|optimized|spearheaded|engineered|created|launched|drove|achieved|established|streamlined|automated|coordinated|executed)/i.test(bullet.trim())
  );
  const avgBulletLen = bullets.length ? bullets.reduce((total: number, bullet: string) => total + bullet.length, 0) / bullets.length : 0;
  const name = (data.personalInfo?.name || '').trim();
  const email = (data.personalInfo?.email || '').trim();
  const phone = (data.personalInfo?.phone || '').trim();

  // Completely empty resume — all zeros
  const isEmpty = !name && !email && data.experience.length === 0 && data.skills.length === 0 && !summaryVal;
  if (isEmpty) {
    const zero = (label: string, color: string, icon: React.ReactNode, tip: string): ScoreDimension =>
      ({ label, score: 0, max: 100, tip, color, icon });
    return [
      zero('ATS', 'bg-blue-500', <Target className="w-4 h-4 text-blue-500" />, 'Fill in your profile to get an ATS score.'),
      zero('Grammar', 'bg-purple-500', <FileText className="w-4 h-4 text-purple-500" />, 'Add experience bullets to evaluate grammar.'),
      zero('Projects', 'bg-green-500', <FolderOpen className="w-4 h-4 text-green-500" />, 'Add projects to score this dimension.'),
      zero('Leadership', 'bg-amber-500', <Crown className="w-4 h-4 text-amber-500" />, 'Add achievements and leadership roles.'),
      zero('Formatting', 'bg-teal-500', <Paintbrush className="w-4 h-4 text-teal-500" />, 'Add your details to evaluate formatting.'),
      zero('Readability', 'bg-cyan-500', <BookOpen className="w-4 h-4 text-cyan-500" />, 'Add experience bullets to evaluate readability.'),
      zero('Impact', 'bg-orange-500', <TrendingUp className="w-4 h-4 text-orange-500" />, 'Add quantified achievements to score impact.'),
      zero('Confidence', 'bg-rose-500', <Star className="w-4 h-4 text-rose-500" />, 'Add LinkedIn, certifications, and experience.'),
    ];
  }

  const isEntry = goal === 'first-job' || goal === 'internship';
  const isExecutive = goal === 'executive';
  const isSwitch = goal === 'career-switch';

  const skillsLower = data.skills.map((skill: string) => skill.toLowerCase());
  const genericSkills = ['team player', 'hard working', 'communication', 'leadership', 'problem solving', 'fast learner', 'creative', 'organized', 'detail oriented', 'self motivated', 'reliable', 'dedicated', 'flexible', 'adaptable'];
  const specificSkills = skillsLower.filter((skill: string) => !genericSkills.includes(skill));
  const targetRole = (data.targetRole || '').toLowerCase();
  const roleKeywords = targetRole ? targetRole.split(/\s+/).filter((word: string) => word.length > 2) : [];
  const roleSkillMatch = roleKeywords.length > 0
    ? specificSkills.filter((skill: string) => roleKeywords.some((keyword: string) => skill.includes(keyword))).length
    : 0;

  // ── ATS ──────────────────────────────────────────────────────────────
  // Strict: penalise missing critical fields heavily
  const atsContact = (name ? 10 : 0) + (email ? 10 : 0) + (phone ? 5 : 0);
  const atsSummary = summaryVal.length >= 80 ? 15 : summaryVal.length >= 30 ? 8 : 0;
  const atsSkills = specificSkills.length >= 10 ? 20 : specificSkills.length >= 6 ? 14 : specificSkills.length >= 3 ? 8 : specificSkills.length > 0 ? 3 : 0;
  const atsRoleMatch = roleSkillMatch >= 2 ? 10 : roleSkillMatch === 1 ? 5 : 0;
  const atsExp = isEntry
    ? Math.min(20, data.experience.length * 6 + bullets.length * 1.5)
    : Math.min(30, data.experience.length * 7 + bullets.length * 1.5);
  const atsBulletQuality = bullets.length === 0 ? 0
    : hasActionVerbs && hasNumbers ? 10
    : hasActionVerbs || hasNumbers ? 5 : 2;
  // Penalty: no education, no summary, very few bullets
  const atsPenalty = (data.education.length === 0 ? -5 : 0) + (bullets.length < 2 && data.experience.length > 0 ? -5 : 0);
  const atsScore = Math.max(0, Math.min(100, atsContact + atsSummary + atsSkills + atsRoleMatch + atsExp + atsBulletQuality + atsPenalty));

  // ── Grammar ──────────────────────────────────────────────────────────
  // No bullets = 0. Base 0, earn points strictly.
  const grammarActionVerb = bullets.length > 0 && hasActionVerbs ? 40 : 0;
  const grammarBulletLen = bullets.length > 0 && avgBulletLen >= 30 && avgBulletLen <= 150 ? 30 : bullets.length > 0 && avgBulletLen > 0 ? 10 : 0;
  const grammarConsistency = bullets.length >= 3 ? 20 : bullets.length > 0 ? 10 : 0;
  const grammarNoPlaceholder = bullets.some((bullet: string) => /^(enter|add|describe|write|type|your)/i.test(bullet.trim())) ? -20 : 10;
  const grammarScore = bullets.length === 0 ? 0 : Math.max(0, Math.min(100, grammarActionVerb + grammarBulletLen + grammarConsistency + grammarNoPlaceholder));

  // ── Projects ─────────────────────────────────────────────────────────
  const projCount = data.projects?.length || 0;
  const projBullets = (data.projects || []).flatMap((project: ProjectItem) => (project.bullets || []).filter((bullet: string) => bullet.trim()));
  const projScore = Math.min(100,
    (projCount >= 3 ? 50 : projCount === 2 ? 40 : projCount === 1 ? 20 : 0) +
    Math.min(30, projBullets.length * 8) +
    (projBullets.some((bullet: string) => /\d/.test(bullet)) ? 20 : 0)
  );

  // ── Leadership ───────────────────────────────────────────────────────
  const leadershipTitles = data.experience.filter((experience: ExperienceItem) =>
    /(lead|manager|director|head|chief|vp|president|supervisor|senior)/i.test(experience.title || '')
  ).length;
  const leadershipBullets = bullets.filter((bullet: string) => /(led|managed|mentor|team|directed|supervised|oversaw|coached)/i.test(bullet)).length;
  const leadershipScore = Math.min(100,
    (leadershipTitles > 0 ? 30 : 0) +
    Math.min(25, leadershipBullets * 10) +
    ((data.achievements?.length || 0) > 0 ? 25 : 0) +
    ((data.awards?.length || 0) > 0 ? 20 : 0)
  );

  // ── Formatting ───────────────────────────────────────────────────────
  // Strict: each section must actually have content, not just exist
  let fmtScore = 0;
  if (name && email) fmtScore += 20;
  else if (name || email) fmtScore += 8;
  if (summaryVal.length >= 80) fmtScore += 20;
  else if (summaryVal.length > 0) fmtScore += 8;
  if (bullets.length >= 3 && bullets.every((bullet: string) => bullet.length < 200)) fmtScore += 20;
  else if (bullets.length > 0) fmtScore += 8;
  if (specificSkills.length >= 5) fmtScore += 20;
  else if (specificSkills.length > 0) fmtScore += 8;
  if (data.education.length > 0) fmtScore += 10;
  if (phone) fmtScore += 10;
  const formattingScore = Math.min(100, fmtScore);

  // ── Readability ──────────────────────────────────────────────────────
  const readBulletLen = bullets.length > 0 && avgBulletLen >= 20 && avgBulletLen <= 120 ? 40 : bullets.length > 0 ? 15 : 0;
  const readBulletCount = bullets.length >= 5 ? 30 : bullets.length >= 3 ? 20 : bullets.length > 0 ? 10 : 0;
  const readSkills = specificSkills.length >= 5 ? 20 : specificSkills.length > 0 ? 10 : 0;
  const readSummary = summaryVal.length >= 50 ? 10 : 0;
  const readabilityScore = bullets.length === 0 ? 0 : Math.min(100, readBulletLen + readBulletCount + readSkills + readSummary);

  // ── Impact ───────────────────────────────────────────────────────────
  const impactNumbers = hasNumbers ? Math.min(40, bullets.filter((bullet: string) => /\d/.test(bullet)).length * 10) : 0;
  const impactVerbs = hasActionVerbs ? 30 : 0;
  const impactAchievements = Math.min(30, (data.achievements?.length || 0) * 15);
  const impactScore = bullets.length === 0 ? 0 : Math.min(100, impactNumbers + impactVerbs + impactAchievements);

  // ── Confidence ───────────────────────────────────────────────────────
  const confLinkedin = (data.personalInfo?.linkedin || '').trim() ? 20 : 0;
  const confPortfolio = (data.personalInfo?.portfolio || '').trim() ? 20 : 0;
  const confCerts = Math.min(20, (data.certifications?.length || 0) * 10);
  const confAwards = Math.min(20, (data.awards?.length || 0) * 10);
  const confExp = data.experience.length >= 3 ? 20 : data.experience.length >= 2 ? 15 : data.experience.length === 1 ? 8 : 0;
  const confidenceScore = Math.min(100, confLinkedin + confPortfolio + confCerts + confAwards + confExp);

  return [
    { label: 'ATS', score: atsScore, max: 100, tip: isEntry ? 'Focus on projects, education, and relevant skills.' : isSwitch ? 'Highlight transferable skills and relevant projects.' : isExecutive ? 'Emphasize strategic impact and organizational leadership.' : 'Add 8–15 specific skills aligned with your target role.', color: 'bg-blue-500', icon: <Target className="w-4 h-4 text-blue-500" /> },
    { label: 'Grammar', score: grammarScore, max: 100, tip: 'Start every bullet with a past-tense action verb. Keep 30–150 chars.', color: 'bg-purple-500', icon: <FileText className="w-4 h-4 text-purple-500" /> },
    { label: 'Projects', score: projScore, max: 100, tip: isEntry ? 'Projects are critical — add 2+ with bullet points and tech stack.' : 'Add 2–3 projects with quantified outcomes.', color: 'bg-green-500', icon: <FolderOpen className="w-4 h-4 text-green-500" /> },
    { label: 'Leadership', score: leadershipScore, max: 100, tip: isExecutive ? 'Board-level results, org strategy, and C-suite impact are essential.' : isEntry ? 'Mention team projects, volunteer leadership, or student org roles.' : 'Add leadership titles, awards, and mentoring bullets.', color: 'bg-amber-500', icon: <Crown className="w-4 h-4 text-amber-500" /> },
    { label: 'Formatting', score: formattingScore, max: 100, tip: 'Complete all sections: contact, summary, experience, skills, education.', color: 'bg-teal-500', icon: <Paintbrush className="w-4 h-4 text-teal-500" /> },
    { label: 'Readability', score: readabilityScore, max: 100, tip: 'Keep bullets 20–120 chars. Use 3–5 bullets per role.', color: 'bg-cyan-500', icon: <BookOpen className="w-4 h-4 text-cyan-500" /> },
    { label: 'Impact', score: impactScore, max: 100, tip: isExecutive ? 'Revenue impact, cost savings, team growth, and market share metrics.' : 'Add numbers (%, $, x) and measurable achievements to bullets.', color: 'bg-orange-500', icon: <TrendingUp className="w-4 h-4 text-orange-500" /> },
    { label: 'Confidence', score: confidenceScore, max: 100, tip: isEntry ? 'Add LinkedIn, certifications, and portfolio to boost credibility.' : isExecutive ? 'Board memberships, speaking engagements, and executive presence.' : 'Add LinkedIn, portfolio, certifications, and 2+ experiences.', color: 'bg-rose-500', icon: <Star className="w-4 h-4 text-rose-500" /> },
  ];
}

export default function ResumeScoreStep() {
  const { data } = useResumeStore();
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const scores = calcScores(data);

  // Weighted overall — ATS, Formatting, Grammar, Impact carry more weight
  const WEIGHTS: Record<string, number> = {
    ATS: 2, Grammar: 1.5, Formatting: 1.5, Impact: 1.5,
    Readability: 1, Projects: 0.75, Leadership: 0.75, Confidence: 1,
  };
  const totalWeight = scores.reduce((s, d) => s + (WEIGHTS[d.label] ?? 1), 0);
  const overall = Math.round(
    scores.reduce((s, d) => s + d.score * (WEIGHTS[d.label] ?? 1), 0) / totalWeight
  );

  const getAIExplanation = async () => {
    setLoading(true);
    try {
      // Send actual resume content so AI gives specific tips, not generic ones
      const summaryVal = Array.isArray(data.summary) ? data.summary.filter(Boolean).join(' ') : data.summary || '';
      const bullets = data.experience.flatMap(e => e.bullets.filter(b => b.trim()));
      const resumeSnapshot = [
        `Target Role: ${data.targetRole || 'Not specified'}`,
        `Name: ${data.personalInfo?.name || '(missing)'}`,
        `Email: ${data.personalInfo?.email || '(missing)'}`,
        `Phone: ${data.personalInfo?.phone || '(missing)'}`,
        `Summary: ${summaryVal || '(missing)'}`,
        `Skills (${data.skills.length}): ${data.skills.slice(0, 15).join(', ') || '(none)'}`,
        `Experience entries: ${data.experience.length}`,
        `Bullets: ${bullets.slice(0, 6).join(' | ') || '(none)'}`,
        `Projects: ${data.projects?.length || 0}`,
        `Certifications: ${data.certifications?.length || 0}`,
        `LinkedIn: ${data.personalInfo?.linkedin ? 'yes' : 'no'}`,
        `Scores: ${scores.map(s => `${s.label} ${s.score}%`).join(', ')}`,
        `Overall: ${overall}%`,
      ].join('\n');
      const res = await executeResumeAI({
        section: 'resume', action: 'score_advice',
        content: resumeSnapshot,
      });
      setAiTips((res.result || '').split(/\n/).map(t => t.replace(/^[-•*\d.]+\s*/, '').trim()).filter(t => t.length > 15).slice(0, 4));
    } catch {
      setAiTips([
        'Add quantified achievements with numbers and percentages to boost Impact.',
        'Include LinkedIn and portfolio links to increase Confidence score.',
        'Start every experience bullet with a strong past-tense action verb.',
      ]);
    } finally {
      setLoading(false);
    }
  };

  const overallColor = overall >= 80 ? 'text-green-600' : overall >= 60 ? 'text-yellow-600' : 'text-red-500';
  const ringColor = overall >= 80 ? '#22c55e' : overall >= 60 ? '#eab308' : '#ef4444';

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
          {data.goal && (
            <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              <Target className="w-3 h-3" />
              Goal: {GOAL_LABELS[data.goal] || data.goal}
            </span>
          )}
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
