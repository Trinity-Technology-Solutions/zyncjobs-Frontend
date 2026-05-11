import React, { useState, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '../config/env';
import { rankJobs, computeMatchScore, type MatchBreakdown } from '../services/jobMatchEngine';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

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

const MatchCard: React.FC<{
  job: any;
  breakdown: MatchBreakdown;
  onNavigate?: (page: string, data?: any) => void;
}> = ({ job, breakdown, onNavigate }) => {
  const [expanded, setExpanded] = useState(false);

  const scoreColor = breakdown.overall >= 80
    ? 'text-green-700 bg-green-100 border-green-200'
    : breakdown.overall >= 60
    ? 'text-yellow-700 bg-yellow-100 border-yellow-200'
    : 'text-red-700 bg-red-100 border-red-200';

  const barColor = breakdown.overall >= 80 ? 'bg-green-500'
    : breakdown.overall >= 60 ? 'bg-yellow-500' : 'bg-red-400';

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
            {breakdown.overall}%
          </span>
          <p className="text-xs text-gray-400 mt-0.5">Match</p>
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        <ScoreBar label="Skills" value={breakdown.skillScore} color={barColor} />
        <ScoreBar label="Title" value={breakdown.titleScore} color={barColor} />
        <ScoreBar label="Location" value={breakdown.locationScore} color={barColor} />
      </div>

      {breakdown.matchedSkills.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {breakdown.matchedSkills.slice(0, 4).map((s, i) => (
            <span key={i} className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">✓ {s}</span>
          ))}
          {breakdown.missingSkills.slice(0, 2).map((s, i) => (
            <span key={i} className="bg-red-50 text-red-500 px-2 py-0.5 rounded text-xs">✗ {s}</span>
          ))}
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-blue-600 hover:text-blue-800 font-medium mb-2"
      >
        {expanded ? '▲ Hide explanation' : '▼ Why this match?'}
      </button>

      {expanded && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-1">
          {breakdown.explanation.map((line, i) => (
            <p key={i} className="text-xs text-gray-700">{line}</p>
          ))}
          {breakdown.bonusSkills.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Your extra skills:</p>
              <div className="flex flex-wrap gap-1">
                {breakdown.bonusSkills.map((s, i) => (
                  <span key={i} className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">{s}</span>
                ))}
              </div>
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
            const jobId = job._id || job.id;
            localStorage.setItem('selectedJob', JSON.stringify(job));
            window.location.href = jobId ? `/job-detail?id=${jobId}` : '/job-listings';
          }}
          className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
        >
          View Details
        </button>
        <button
          onClick={() => {
            localStorage.setItem('selectedJob', JSON.stringify(job));
            sessionStorage.setItem('selectedJob', JSON.stringify({
              _id: job._id,
              jobTitle: job.jobTitle || job.title,
              company: job.company,
              location: job.location,
              jobData: job
            }));
            window.location.href = '/job-application';
          }}
          className="flex-1 border border-blue-600 text-blue-600 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 transition-colors"
        >
          Apply Now
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
  const [rankedJobs, setRankedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevSkillsKey = useRef('');

  const skillsKey = resumeSkills.map(s => s.skill).join(',');

  useEffect(() => {
    if (!skillsKey) return; // no skills yet
    if (skillsKey === prevSkillsKey.current) return; // skills unchanged
    prevSkillsKey.current = skillsKey;

    const skillNames = skillsKey.split(',').filter(Boolean);
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
              setRankedJobs(buildBreakdowns(matched, skillNames, exp, loc));
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
            setRankedJobs(buildBreakdowns(matches, skillNames, exp, loc));
            return;
          }
        }
      } catch (_) {}

      // Step 3: Fetch all jobs and rank locally — ALWAYS show results
      const res = await fetch(`${API_ENDPOINTS.JOBS}`);
      if (!res.ok) throw new Error(`Jobs API returned ${res.status}`);

      const allJobs: any[] = await res.json();
      if (!allJobs.length) {
        setError('No jobs available in the database yet.');
        return;
      }

      // Rank all jobs by skill match against job skills + description
      const ranked = rankJobsLocally(allJobs, skillNames, exp, loc);

      // Always show top 8 regardless of score — never show empty
      setRankedJobs(ranked.slice(0, 8));
    } catch (e: any) {
      console.error('Job matching error:', e);
      setError('Could not load job recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Build match breakdowns merging backend scores with local computation
  const buildBreakdowns = (jobs: any[], skillNames: string[], exp: string, loc: string) =>
    jobs.map((j: any) => {
      const local = computeMatchScore(skillNames, exp, loc, j);
      const backendOverall = j.matchScore ?? j.matchPercentage ?? 0;
      const breakdown: MatchBreakdown = {
        overall: backendOverall > 0 ? backendOverall : local.overall,
        skillScore: j.skillScore > 0 ? j.skillScore : local.skillScore,
        titleScore: j.titleScore > 0 ? j.titleScore : local.titleScore,
        locationScore: j.locationScore > 0 ? j.locationScore : local.locationScore,
        matchedSkills: j.matchingSkills?.length ? j.matchingSkills : local.matchedSkills,
        missingSkills: j.missingSkills?.length ? j.missingSkills : local.missingSkills,
        bonusSkills: local.bonusSkills,
        explanation: j.explanation?.length ? j.explanation : local.explanation,
      };
      return { ...j, matchBreakdown: breakdown };
    });

  // Local ranking: match candidate skills against job.skills array AND job description text
  const rankJobsLocally = (jobs: any[], skillNames: string[], exp: string, loc: string) => {
    const candSkillsLower = skillNames.map(s => s.toLowerCase().trim());

    const scored = jobs.map(job => {
      const jobSkills: string[] = (job.skills || []).map((s: string) => s.toLowerCase().trim());
      const jobDesc = (job.description || '').toLowerCase();
      const jobTitle = (job.jobTitle || job.title || '').toLowerCase();

      // Count how many candidate skills appear in job skills list OR description
      let matchCount = 0;
      const matchedSkills: string[] = [];
      const missingSkills: string[] = [];

      for (const cs of candSkillsLower) {
        const inJobSkills = jobSkills.some(js => js.includes(cs) || cs.includes(js));
        const inDesc = jobDesc.includes(cs);
        const inTitle = jobTitle.includes(cs);
        if (inJobSkills || inDesc || inTitle) {
          matchCount++;
          matchedSkills.push(cs);
        }
      }

      for (const js of jobSkills) {
        if (!candSkillsLower.some(cs => cs.includes(js) || js.includes(cs))) {
          missingSkills.push(js);
        }
      }

      // Skill score: % of candidate skills found in job
      const skillScore = candSkillsLower.length > 0
        ? Math.round((matchCount / candSkillsLower.length) * 100)
        : 0;

      // Title score
      const expWords = exp.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const titleWords = jobTitle.split(/\s+/);
      const titleMatches = expWords.filter(w => titleWords.some(tw => tw.includes(w) || w.includes(tw))).length;
      const titleScore = expWords.length > 0 ? Math.min(100, Math.round((titleMatches / expWords.length) * 100)) : 30;

      // Location score
      let locationScore = 60;
      if (!loc || jobTitle.includes('remote') || jobDesc.includes('remote')) {
        locationScore = 85;
      } else {
        const locWords = loc.toLowerCase().split(/[\s,]+/).filter(w => w.length > 2);
        const jobLoc = (job.location || '').toLowerCase();
        if (locWords.some(w => jobLoc.includes(w))) locationScore = 90;
      }

      // Weighted overall — give more weight to skill match
      const overall = Math.round(skillScore * 0.60 + titleScore * 0.20 + locationScore * 0.20);

      const explanation: string[] = [];
      if (matchedSkills.length > 0)
        explanation.push(`✅ ${matchedSkills.length} of your skills match this job: ${matchedSkills.slice(0, 3).join(', ')}`);
      if (missingSkills.length > 0)
        explanation.push(`⚠️ Skills gap: ${missingSkills.slice(0, 3).join(', ')}`);
      if (titleScore > 40)
        explanation.push(`🎯 Your experience as "${exp}" aligns with this role`);
      if (overall >= 60)
        explanation.push(`👍 Good match — worth applying`);
      else
        explanation.push(`📝 Partial match — consider applying anyway`);

      const breakdown: MatchBreakdown = {
        overall: Math.max(overall, matchedSkills.length > 0 ? 20 : 10),
        skillScore,
        titleScore,
        locationScore,
        matchedSkills,
        missingSkills,
        bonusSkills: candSkillsLower.filter(cs => !jobSkills.some(js => js.includes(cs) || cs.includes(js))).slice(0, 3),
        explanation,
      };

      return { ...job, matchBreakdown: breakdown };
    });

    // Sort by overall score descending
    return scored.sort((a, b) => b.matchBreakdown.overall - a.matchBreakdown.overall);
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

  if (!rankedJobs.length) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-gray-500">Upload your resume to see AI-matched job recommendations.</p>
      </div>
    );
  }

  const displayed = showAll ? rankedJobs : rankedJobs.slice(0, 3);
  const topScore = rankedJobs[0]?.matchBreakdown.overall || 0;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-3">
        <p className="text-sm font-semibold text-blue-900">
          🎯 Found {rankedJobs.length} matching jobs
        </p>
        <p className="text-xs text-blue-700 mt-0.5">
          Best match: <strong>{topScore}%</strong> — ranked by skills, title & location fit
        </p>
      </div>

      <div className="space-y-3">
        {displayed.map((job, i) => (
          <MatchCard
            key={job._id || i}
            job={job}
            breakdown={job.matchBreakdown}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      {rankedJobs.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          {showAll ? '▲ Show less' : `▼ Show ${rankedJobs.length - 3} more jobs`}
        </button>
      )}
    </div>
  );
};

export default MistralJobRecommendations;
