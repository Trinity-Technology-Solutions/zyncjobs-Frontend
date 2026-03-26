import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/env';
import { rankJobs, type MatchBreakdown } from '../services/jobMatchEngine';

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
      {/* Header */}
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

      {/* Score breakdown bars */}
      <div className="space-y-1.5 mb-3">
        <ScoreBar label="Skills" value={breakdown.skillScore} color={barColor} />
        <ScoreBar label="Title" value={breakdown.titleScore} color={barColor} />
        <ScoreBar label="Location" value={breakdown.locationScore} color={barColor} />
      </div>

      {/* Matched skills */}
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

      {/* Explanation toggle */}
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

      {/* Salary */}
      {job.salary && (
        <p className="text-xs text-green-600 font-medium mb-2">
          {typeof job.salary === 'object' && job.salary.min
            ? `${job.salary.currency === 'INR' ? '₹' : '$'}${job.salary.min?.toLocaleString()} – ${job.salary.currency === 'INR' ? '₹' : '$'}${job.salary.max?.toLocaleString()}`
            : typeof job.salary === 'string' ? job.salary : ''}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={() => onNavigate?.('job-detail', { jobId: job._id, jobData: job })}
          className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
        >
          View Details
        </button>
        <button
          onClick={() => onNavigate?.('job-application', { jobId: job._id, job })}
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

  useEffect(() => {
    if (!resumeSkills.length) return;
    setLoading(true);
    fetchAndRank();
  }, [resumeSkills, location, experience]);

  const fetchAndRank = async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.JOBS}`);
      if (!res.ok) return;
      const allJobs = await res.json();

      const skillNames = resumeSkills.map(s => s.skill);
      const ranked = rankJobs(allJobs, skillNames, experience, location);
      // Only show jobs with at least some relevance
      const relevant = ranked.filter(j => j.matchBreakdown.overall >= 25);
      setRankedJobs(relevant.length > 0 ? relevant : ranked.slice(0, 5));
    } catch (e) {
      console.error('Job matching error:', e);
    } finally {
      setLoading(false);
    }
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

  if (!rankedJobs.length) {
    return <p className="text-sm text-gray-500 text-center py-4">No jobs found to match against.</p>;
  }

  const displayed = showAll ? rankedJobs : rankedJobs.slice(0, 3);
  const topScore = rankedJobs[0]?.matchBreakdown.overall || 0;

  return (
    <div className="space-y-4">
      {/* Summary banner */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-3">
        <p className="text-sm font-semibold text-blue-900">
          🎯 Found {rankedJobs.length} matching jobs
        </p>
        <p className="text-xs text-blue-700 mt-0.5">
          Best match: <strong>{topScore}%</strong> — ranked by skills, title & location fit
        </p>
      </div>

      {/* Job cards */}
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
