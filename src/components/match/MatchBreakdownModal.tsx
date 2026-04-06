import React, { useEffect, useState } from 'react';
import { matchAPI, MatchBreakdown } from '../../services/matchAPI';
import { MatchScoreBadge } from './MatchScoreBadge';

interface MatchBreakdownModalProps {
  jobId: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const MatchBreakdownModal: React.FC<MatchBreakdownModalProps> = ({ jobId, userId, isOpen, onClose }) => {
  const [data, setData] = useState<MatchBreakdown | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && jobId && userId) {
      setLoading(true);
      matchAPI.getMatchExplanation(jobId, userId)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, jobId, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Match Breakdown</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : data ? (
            <>
              <div className="mb-6">
                <MatchScoreBadge score={data.matchScore} size="lg" />
              </div>

              <div className="space-y-4">
                {/* Skills Match */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg">✅ Skills Match ({data.breakdown.skillMatch.weight}% weight)</h3>
                    <span className="text-xl font-bold text-green-600">{Math.round(data.breakdown.skillMatch.score)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${data.breakdown.skillMatch.score}%` }}></div>
                  </div>
                  {data.breakdown.skillMatch.matched.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-600 mb-1">Matched Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {data.breakdown.skillMatch.matched.map((skill, i) => (
                          <span key={i} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">✓ {skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.breakdown.skillMatch.related.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-600 mb-1">Related Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {data.breakdown.skillMatch.related.map((skill, i) => (
                          <span key={i} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">~ {skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.breakdown.skillMatch.missing.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Missing Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {data.breakdown.skillMatch.missing.map((skill, i) => (
                          <span key={i} className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">✗ {skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Role Match */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg">✅ Role Match ({data.breakdown.roleMatch.weight}% weight)</h3>
                    <span className="text-xl font-bold text-blue-600">{Math.round(data.breakdown.roleMatch.score)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${data.breakdown.roleMatch.score}%` }}></div>
                  </div>
                  <p className="text-sm text-gray-700">Your Role: <span className="font-semibold">{data.breakdown.roleMatch.candidateRole}</span></p>
                  <p className="text-sm text-gray-700">Job Role: <span className="font-semibold">{data.breakdown.roleMatch.jobRole}</span></p>
                  <p className="text-sm text-gray-600 mt-1">{data.breakdown.roleMatch.seniorityMatch}</p>
                </div>

                {/* Experience Match */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg">✅ Experience ({data.breakdown.experienceMatch.weight}% weight)</h3>
                    <span className="text-xl font-bold text-purple-600">{Math.round(data.breakdown.experienceMatch.score)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${data.breakdown.experienceMatch.score}%` }}></div>
                  </div>
                </div>

                {/* Text Similarity */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg">📄 Text Similarity ({data.breakdown.textSimilarity.weight}% weight)</h3>
                    <span className="text-xl font-bold text-indigo-600">{Math.round(data.breakdown.textSimilarity.score)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${data.breakdown.textSimilarity.score}%` }}></div>
                  </div>
                </div>

                {/* Location & Education */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">📍 Location ({data.breakdown.locationMatch.weight}%)</h3>
                      <span className="font-bold">{Math.round(data.breakdown.locationMatch.score)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${data.breakdown.locationMatch.score}%` }}></div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">🎓 Education ({data.breakdown.educationMatch.weight}%)</h3>
                      <span className="font-bold">{Math.round(data.breakdown.educationMatch.score)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${data.breakdown.educationMatch.score}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">No data available</div>
          )}
        </div>
      </div>
    </div>
  );
};
