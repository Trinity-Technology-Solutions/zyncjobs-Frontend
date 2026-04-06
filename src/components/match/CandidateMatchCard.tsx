import React from 'react';
import { MatchScoreBadge } from './MatchScoreBadge';

interface CandidateMatchCardProps {
  candidate: any;
  matchScore: number;
  onViewProfile?: () => void;
  onShortlist?: () => void;
}

export const CandidateMatchCard: React.FC<CandidateMatchCardProps> = ({
  candidate,
  matchScore,
  onViewProfile,
  onShortlist,
}) => {
  return (
    <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-white">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {candidate.name?.charAt(0) || '?'}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{candidate.name || 'Anonymous'}</h3>
              <p className="text-gray-600">{candidate.title || candidate.currentRole || 'Professional'}</p>
            </div>
            <MatchScoreBadge score={matchScore} />
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
            {candidate.location && <span>📍 {candidate.location}</span>}
            {candidate.experience && <span>💼 {candidate.experience} years</span>}
            {candidate.email && <span>📧 {candidate.email}</span>}
          </div>

          {candidate.skills && candidate.skills.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {candidate.skills.slice(0, 8).map((skill: string, i: number) => (
                  <span key={i} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    {skill}
                  </span>
                ))}
                {candidate.skills.length > 8 && (
                  <span className="text-gray-500 text-xs">+{candidate.skills.length - 8} more</span>
                )}
              </div>
            </div>
          )}

          {candidate.profileSummary && (
            <p className="text-gray-700 text-sm mb-4 line-clamp-2">{candidate.profileSummary}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={onViewProfile}
              className="flex-1 bg-white border-2 border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 font-semibold"
            >
              View Profile
            </button>
            <button
              onClick={onShortlist}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Shortlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
