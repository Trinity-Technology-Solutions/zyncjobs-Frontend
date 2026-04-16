import React, { useEffect, useState } from 'react';
import { matchAPI } from '../services/matchAPI';
import { CandidateMatchCard } from '../components/match/CandidateMatchCard';

export const CandidateMatchesPage: React.FC<{ onNavigate?: (page: string, data?: any) => void }> = ({ onNavigate }) => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  
  // TODO: Get from job selection or route params
  const jobId = '1'; // Replace with actual job ID

  useEffect(() => {
    if (jobId) {
      loadCandidates();
    }
  }, [jobId]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const data = await matchAPI.getTopCandidates(jobId, 30);
      setCandidates(data.candidates);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🎯 Top Candidates</h1>
          <p className="text-gray-600">AI-matched candidates for your job posting</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Finding top candidates...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadCandidates}
              className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        ) : candidates.length === 0 ? (
          <div className="bg-white border rounded-lg p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">No matching candidates found</p>
            <p className="text-gray-500 text-sm">Try adjusting your job requirements</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex justify-between items-center">
              <div className="text-gray-600">
                Found <span className="font-semibold text-gray-900">{candidates.length}</span> matching candidates
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Filter
                </button>
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Sort by Match
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {candidates.map((candidate) => (
                <CandidateMatchCard
                  key={candidate.userId}
                  candidate={candidate.profile || candidate}
                  matchScore={candidate.score || 0}
                  onViewProfile={() => {
                    const cid = (candidate.profile || candidate).email || candidate.userId || '';
                    if (!cid || !onNavigate) return;
                    sessionStorage.setItem('viewCandidateId', cid);
                    onNavigate('candidate-profile-view', { candidateId: cid });
                  }}
                  onShortlist={() => console.log('Shortlist:', candidate.userId)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
