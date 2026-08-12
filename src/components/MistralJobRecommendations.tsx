import React, { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '../config/env';
import { computeMatchBreakdown, getIncompleteProfileFields } from '../utils/matchScore';
import type { EnhancedJobRecommendation } from '../services/enhancedAIRecommendationEngine';

const icons = {
  check: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  cross: "M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  star: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
  chevronUp: "M4.5 15.75l7.5-7.5 7.5 7.5",
  chevronDown: "M19.5 8.25l-7.5 7.5-7.5-7.5",
  target: "M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z",
  robot: "M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v.75",
  thumbsUp: "M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z",
  note: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  trendUp: "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941",
  warning: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
  book: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
};
function SvgIcon({ name, className = "w-4 h-4" }: { name: keyof typeof icons; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d={icons[name]} />
    </svg>
  );
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Match endpoints can return items shaped like { job: {...}, score: ... } — normalize to the job object itself
function extractJob(raw: any): any {
  if (!raw || typeof raw !== 'object') return {};
  const hasJobFields = raw._id || raw.id || raw.jobId || raw.jobTitle || raw.title || raw.company;
  if (!hasJobFields && raw.job && typeof raw.job === 'object') return raw.job;
  return raw;
}

function getJobId(job: any): string {
  const j = extractJob(job);
  return j._id || j.id || j.jobId || j._jobId || '';
}

interface MistralJobRecommendationsProps {
  resumeSkills: Array<{ skill: string }>;
  location: string;
  experience: string;
  onNavigate?: (page: string, data?: any) => void;
}

const ScoreBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="w-16 text-gray-500 shrink-0">{label}</span>
    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${value}%` }} />
    </div>
    <span className="w-8 text-right font-medium text-gray-700">{value}%</span>
  </div>
);

const EnhancedMatchCard: React.FC<{
  recommendation: EnhancedJobRecommendation;
  onNavigate?: (page: string, data?: any) => void;
}> = ({ recommendation, onNavigate }) => {
  const { job, matchScore, skillMatch, careerFit, recommendations: rec, aiInsights } = recommendation;
  const [expanded, setExpanded] = useState(false);

  const scoreColor = matchScore >= 80
    ? 'text-green-700 bg-green-100 border-green-200'
    : matchScore >= 60
    ? 'text-yellow-700 bg-yellow-100 border-yellow-200'
    : 'text-red-700 bg-red-100 border-red-200';

  const barColor = matchScore >= 80 ? 'bg-green-500'
    : matchScore >= 60 ? 'bg-yellow-500' : 'bg-red-400';

  const confidenceColor = rec.confidenceLevel === 'high' ? 'text-green-600' :
    rec.confidenceLevel === 'medium' ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all bg-white">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h5 className="font-semibold text-gray-900 text-sm leading-tight">{job.jobTitle || job.title}</h5>
          <p className="text-blue-600 text-xs font-medium mt-0.5">{job.company}</p>
          <p className="text-gray-400 text-xs">{job.location}</p>
        </div>
        <div className="text-right ml-3 shrink-0">
          <span className={`inline-block px-2.5 py-1 rounded-full text-sm font-bold border ${scoreColor}`}>
            {matchScore}%
          </span>
          <p className={`text-xs mt-0.5 font-medium ${confidenceColor}`}>
            {rec.confidenceLevel.toUpperCase()}
          </p>
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        <ScoreBar label="Skills" value={Math.round((skillMatch.matched.length / (skillMatch.matched.length + skillMatch.missing.length)) * 100)} color={barColor} />
        <ScoreBar label="Experience" value={careerFit.experienceAlignment} color={barColor} />
        <ScoreBar label="Location" value={careerFit.locationFit} color={barColor} />
        <ScoreBar label="Salary" value={careerFit.salaryAlignment} color={barColor} />
      </div>

      {skillMatch.matched.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {skillMatch.matched.slice(0, 4).map((s, i) => (
            <span key={i} className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium inline-flex items-center gap-0.5"><SvgIcon name="check" className="w-3 h-3" />{s}</span>
          ))}
          {skillMatch.missing.slice(0, 2).map((s, i) => (
            <span key={i} className="bg-red-50 text-red-500 px-2 py-0.5 rounded text-xs inline-flex items-center gap-0.5"><SvgIcon name="cross" className="w-3 h-3" />{s}</span>
          ))}
          {skillMatch.bonus.slice(0, 2).map((s, i) => (
            <span key={i} className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs inline-flex items-center gap-0.5"><SvgIcon name="star" className="w-3 h-3" />{s}</span>
          ))}
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-blue-600 hover:text-blue-800 font-medium mb-2"
      >
        {expanded ? <><SvgIcon name="chevronUp" className="w-3 h-3 inline" /> Hide explanation</> : <><SvgIcon name="chevronDown" className="w-3 h-3 inline" /> Why this match?</>}
      </button>

      {expanded && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">AI Insights:</p>
            {aiInsights.map((insight, i) => (
              <p key={i} className="text-xs text-gray-700">{insight}</p>
            ))}
          </div>
          
          {rec.improvementSuggestions.length > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-1">Improvement Tips:</p>
              {rec.improvementSuggestions.map((tip, i) => (
                <p key={i} className="text-xs text-blue-600">• {tip}</p>
              ))}
            </div>
          )}
          
          {rec.careerProgression.length > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-1">Career Impact:</p>
              {rec.careerProgression.map((prog, i) => (
                <p key={i} className="text-xs text-purple-600">• {prog}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {job.salary && (
        <p className="text-xs text-green-600 font-medium mb-2">
          {typeof job.salary === 'object' && job.salary.min
            ? `${job.salary.currency === 'INR' ? '₹' : '$'}${job.salary.min?.toLocaleString()} – ${job.salary.currency === 'INR' ? '₹' : '$'}${job.salary.max?.toLocaleString()}`
            : typeof job.salary === 'string' ? job.salary : ''}
        </p>
      )}

      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={() => {
            const target = extractJob(job);
            const jobId = getJobId(target);
            localStorage.setItem('selectedJob', JSON.stringify(target));
            window.location.href = jobId ? `/job-detail?id=${jobId}` : '/job-listings';
          }}
          className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
        >
          View Details
        </button>
        <button
          onClick={() => {
            const target = extractJob(job);
            const jobId = getJobId(target);
            localStorage.setItem('selectedJob', JSON.stringify(target));
            sessionStorage.setItem('selectedJob', JSON.stringify({
              _id: jobId,
              jobTitle: target.jobTitle || target.title,
              company: target.company,
              location: target.location,
              jobData: target
            }));
            window.location.href = '/job-application';
          }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            rec.shouldApply 
              ? 'border border-green-600 text-green-600 hover:bg-green-50'
              : 'border border-gray-400 text-gray-500 hover:bg-gray-50'
          }`}
        >
          {rec.shouldApply ? <><SvgIcon name="check" className="w-3 h-3 inline" /> Recommended</> : 'Consider'}
        </button>
      </div>
    </div>
  );
};

const MistralJobRecommendations: React.FC<MistralJobRecommendationsProps> = ({
  resumeSkills,
  location,
  experience,
  onNavigate,
}) => {
  const [rankedJobs, setRankedJobs] = useState<EnhancedJobRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [blockReason, setBlockReason] = useState<string[] | null>(null);
  const prevSkillsKey = useRef('');

  const skillsKey = resumeSkills.map(s => s.skill).join(',');

  const buildCandidateProfile = () => ({
    skills: resumeSkills.map(s => s.skill || s).filter(Boolean),
    jobTitle: experience,
    location,
  });

  const scoreJobs = (jobs: any[], limit: number): EnhancedJobRecommendation[] => {
    const profile = buildCandidateProfile();
    return jobs.slice(0, limit).map(item => {
      const job = extractJob(item);
      const jobData = { ...job, title: job.jobTitle || job.title || '', skills: Array.isArray(job.skills) ? job.skills : [] };
      const b = computeMatchBreakdown(jobData, profile);
      const jobSkillsLower: string[] = jobData.skills.map((s: string) => String(s || '').toLowerCase());
      const bonus = profile.skills.filter(s =>
        !jobSkillsLower.some(js => s.toLowerCase().includes(js) || js.includes(s.toLowerCase()))
      ).slice(0, 3);
      const shouldApply = b.overall >= 60;
      const confidenceLevel = b.overall >= 80 ? 'high' : b.overall >= 60 ? 'medium' : 'low';
      const improvementSuggestions: string[] = [];
      if (b.missing.length > 0) improvementSuggestions.push(`Learn ${b.missing.slice(0, 2).join(', ')} to strengthen your profile`);
      if (b.experienceScore < 60) improvementSuggestions.push('Consider highlighting relevant experience in your resume');
      const careerProgression: string[] = [];
      if (b.overall >= 70) careerProgression.push('This role aligns well with your career trajectory');
      if (bonus.length > 0) careerProgression.push(`Your ${bonus[0]} skills could be valuable here`);
      const aiInsights: string[] = [];
      if (b.matched.length >= 3) aiInsights.push(`Strong skill alignment with ${b.matched.length} matching competencies`);
      if (b.experienceScore >= 70) aiInsights.push('Your experience profile fits well with this role');
      if (b.locationScore >= 80) aiInsights.push('Excellent location match for this position');
      if (b.missing.length > 0) aiInsights.push(`Consider developing ${b.missing[0]} to become a stronger candidate`);
      return {
        job,
        matchScore: b.overall,
        skillMatch: { matched: b.matched, missing: b.missing.slice(0, 5), bonus },
        careerFit: { experienceAlignment: b.experienceScore, locationFit: b.locationScore, salaryAlignment: job.salary ? 80 : 60 },
        recommendations: { shouldApply, confidenceLevel, improvementSuggestions, careerProgression },
        aiInsights,
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  };

  useEffect(() => {
    if (skillsKey === prevSkillsKey.current) return; // skills unchanged
    prevSkillsKey.current = skillsKey;

    const skillNames = skillsKey.split(',').filter(Boolean);
    const gateProfile = { skills: skillNames, jobTitle: experience, location };
    const essentialMissing = getIncompleteProfileFields(gateProfile).filter(f => f === 'skills' || f === 'jobTitle');

    if (essentialMissing.length > 0) {
      setBlockReason(essentialMissing);
      setRankedJobs([]);
      setLoading(false);
      setError(null);
      return;
    }
    setBlockReason(null);

    setLoading(true);
    setRankedJobs([]);
    setError(null);
    runMatching(skillNames, experience, location);
  }, [skillsKey, experience, location]); // eslint-disable-line react-hooks/exhaustive-deps

  const runMatching = async (skillNames: string[], exp: string, loc: string) => {
    try {
      // Step 1: Try backend user-specific recommendations
      const storedUser = localStorage.getItem('user');
      const userId = storedUser ? JSON.parse(storedUser)?.id : null;

      if (userId) {
        try {
          const res = await fetch(`${API_BASE}/match/recommendations/${userId}?limit=10`);
          if (res.ok) {
            const data = await res.json();
            const matched = Array.isArray(data.jobs) ? data.jobs : [];
            if (matched.length > 0) {
              const recommendations = scoreJobs(matched, 10);
              setRankedJobs(recommendations);
              setAiInsights(generateGlobalInsights(recommendations));
              return;
            }
          }
        } catch (_) {}
      }

      // Step 2: Try backend semantic match
      try {
        const res = await fetch(`${API_BASE}/match/jobs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: skillNames.join(' '), limit: 10 }),
        });
        if (res.ok) {
          const data = await res.json();
          const matches = Array.isArray(data.matches) ? data.matches : [];
          if (matches.length > 0) {
            const recommendations = scoreJobs(matches, 10);
            setRankedJobs(recommendations);
            setAiInsights(generateGlobalInsights(recommendations));
            return;
          }
        }
      } catch (_) {}

      // Step 3: Fetch all jobs and rank with consistent scoring — ALWAYS show results
      const res = await fetch(`${API_ENDPOINTS.JOBS}`);
      if (!res.ok) throw new Error(`Jobs API returned ${res.status}`);

      const allJobs: any[] = await res.json();
      if (!allJobs.length) {
        setError('No jobs available in the database yet.');
        return;
      }

      const recommendations = scoreJobs(allJobs, 8);
      setRankedJobs(recommendations);
      setAiInsights(generateGlobalInsights(recommendations));
    } catch (e: any) {
      console.error('Job matching error:', e);
      setError('Could not load job recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate global insights from all recommendations
  const generateGlobalInsights = (recommendations: EnhancedJobRecommendation[]): string[] => {
    const insights: string[] = [];
    
    const highConfidenceJobs = recommendations.filter(r => r.recommendations.confidenceLevel === 'high').length;
    const avgMatchScore = Math.round(recommendations.reduce((sum, r) => sum + r.matchScore, 0) / recommendations.length);
    
    if (highConfidenceJobs >= 3) {
      insights.push(`» ${highConfidenceJobs} high-confidence matches found - you're well-positioned!`);
    }
    
    if (avgMatchScore >= 75) {
      insights.push(`» Strong overall profile match (${avgMatchScore}% average)`);
    } else if (avgMatchScore >= 60) {
      insights.push(`» Good profile match with room for improvement (${avgMatchScore}% average)`);
    }
    
    // Skill insights
    const commonMissingSkills = new Map<string, number>();
    recommendations.forEach(r => {
      r.skillMatch.missing.forEach(skill => {
        commonMissingSkills.set(skill, (commonMissingSkills.get(skill) || 0) + 1);
      });
    });
    
    const topMissingSkills = Array.from(commonMissingSkills.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([skill]) => skill);
    
    if (topMissingSkills.length > 0) {
      insights.push(`» Focus on learning: ${topMissingSkills.join(', ')} to improve match rates`);
    }
    
    return insights;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
          Analyzing your skills against live jobs...
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
            <div className="space-y-1.5">
              {[1, 2, 3].map(j => <div key={j} className="h-2 bg-gray-100 rounded" />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500 text-center py-4">{error}</p>;
  }

  if (blockReason) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
        </div>
        <p className="text-sm font-semibold text-amber-900 mb-2">Complete your profile to unlock AI job matches</p>
        <p className="text-xs text-amber-700 mb-4">
          Missing essential information: {blockReason.map(f => f === 'jobTitle' ? 'job title' : f).join(', ')}.
          Add these to your resume or profile to get accurate match scores.
        </p>
      </div>
    );
  }

  if (!rankedJobs.length) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-gray-500">Upload your resume to see AI-matched job recommendations.</p>
      </div>
    );
  }

  const displayed = showAll ? rankedJobs : rankedJobs.slice(0, 3);
  const topScore = rankedJobs[0]?.matchScore || 0;
  const recommendedCount = rankedJobs.filter(r => r.recommendations.shouldApply).length;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-3">
        <p className="text-sm font-semibold text-blue-900">
          <SvgIcon name="target" className="w-4 h-4 inline mr-1" />Found {rankedJobs.length} matching jobs • {recommendedCount} recommended
        </p>
        <p className="text-xs text-blue-700 mt-0.5">
          Best match: <strong>{topScore}%</strong> — AI-powered matching with career insights
        </p>
      </div>

      {aiInsights.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
          <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-1"><SvgIcon name="robot" className="w-4 h-4" /> AI Career Insights</p>
          {aiInsights.map((insight, i) => (
            <p key={i} className="text-xs text-blue-700 mb-1">{insight}</p>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {displayed.map((recommendation, i) => (
          <EnhancedMatchCard
            key={recommendation.job._id || i}
            recommendation={recommendation}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      {rankedJobs.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          {showAll ? <><SvgIcon name="chevronUp" className="w-3 h-3 inline" /> Show less</> : <><SvgIcon name="chevronDown" className="w-3 h-3 inline" /> Show {rankedJobs.length - 3} more jobs</>}
        </button>
      )}
    </div>
  );
};

export default MistralJobRecommendations;
