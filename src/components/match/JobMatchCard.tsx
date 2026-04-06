import React, { useState } from 'react';
import { MatchScoreBadge } from './MatchScoreBadge';
import { MatchBreakdownModal } from './MatchBreakdownModal';

interface JobMatchCardProps {
  job: any;
  matchScore: number;
  userId: string;
}

export const JobMatchCard: React.FC<JobMatchCardProps> = ({ job, matchScore, userId }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <>
      <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-white">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h3>
            <p className="text-gray-600 mb-2">{job.company}</p>
            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
              {job.location && <span>📍 {String(job.location)}</span>}
              {job.salary && <span>💰 {typeof job.salary === 'object' ? `${job.salary.min || ''}–${job.salary.max || ''}` : String(job.salary)}</span>}
              {job.type && <span>💼 {String(job.type)}</span>}
            </div>
          </div>
          <MatchScoreBadge score={matchScore} />
        </div>

        {job.description && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-2">{job.description}</p>
        )}

        {job.skills && job.skills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {job.skills.slice(0, 6).map((skill: string, i: number) => (
                <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {skill}
                </span>
              ))}
              {job.skills.length > 6 && (
                <span className="text-gray-500 text-xs">+{job.skills.length - 6} more</span>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setShowBreakdown(true)}
            className="flex-1 bg-white border-2 border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 font-semibold"
          >
            View Match Details
          </button>
          <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold">
            Apply Now
          </button>
        </div>
      </div>

      <MatchBreakdownModal
        jobId={job.id}
        userId={userId}
        isOpen={showBreakdown}
        onClose={() => setShowBreakdown(false)}
      />
    </>
  );
};
