import React from 'react';
import { computeMatchBreakdown } from '../../utils/matchScore';

interface MatchBreakdownModalProps {
  job: any;
  isOpen: boolean;
  onClose: () => void;
}

const Bar: React.FC<{ score: number; color: string }> = ({ score, color }) => (
  <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
    <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${Math.min(score, 100)}%` }} />
  </div>
);

const getColor = (s: number) =>
  s >= 80 ? 'text-green-600' : s >= 60 ? 'text-yellow-600' : s >= 40 ? 'text-orange-500' : 'text-red-500';

const getBg = (s: number) =>
  s >= 80 ? 'bg-green-500' : s >= 60 ? 'bg-yellow-400' : s >= 40 ? 'bg-orange-400' : 'bg-red-400';

const getLabel = (s: number) =>
  s >= 80 ? 'Excellent Match' : s >= 60 ? 'Good Match' : s >= 40 ? 'Fair Match' : 'Low Match';

export const MatchBreakdownModal: React.FC<MatchBreakdownModalProps> = ({ job, isOpen, onClose }) => {
  if (!isOpen || !job) return null;

  const { overall, skillScore, roleScore, experienceScore, locationScore, educationScore, matched, missing, userSkills } =
    computeMatchBreakdown(job);

  const userTitle = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}').jobTitle || 'Not set'; } catch { return 'Not set'; }
  })();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Match Breakdown</h2>
            <p className="text-sm text-gray-500">{job.title} · {job.company}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-5">

          {/* Overall score — same value as card badge */}
          <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
            <div className={`text-4xl font-black ${getColor(overall)}`}>{overall}%</div>
            <div>
              <div className={`text-sm font-semibold ${getColor(overall)}`}>{getLabel(overall)}</div>
              <div className="text-xs text-gray-500 mt-0.5">Skills 45% · Role 20% · Experience 15% · Location 10% · Education 10%</div>
            </div>
          </div>

          {/* Skills Match */}
          <div className="border border-gray-100 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800">🎯 Skills Match <span className="text-xs text-gray-400 font-normal">(45%)</span></span>
              <span className={`font-bold text-lg ${getColor(skillScore)}`}>{skillScore}%</span>
            </div>
            <Bar score={skillScore} color={getBg(skillScore)} />

            {userSkills.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">⚠ Add skills to your profile for accurate matching</p>
            )}
            {matched.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1.5 font-medium">✅ Matched Skills ({matched.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {matched.map((s, i) => (
                    <span key={i} className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium capitalize">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {missing.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1.5 font-medium">❌ Missing Skills ({missing.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {missing.map((s, i) => (
                    <span key={i} className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium capitalize">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Role Match */}
          <div className="border border-gray-100 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800">💼 Role Match <span className="text-xs text-gray-400 font-normal">(20%)</span></span>
              <span className={`font-bold text-lg ${getColor(roleScore)}`}>{roleScore}%</span>
            </div>
            <Bar score={roleScore} color="bg-blue-500" />
            <div className="mt-2 text-xs text-gray-500 space-y-0.5">
              <p>Job: <span className="font-medium text-gray-700">{job.title || job.jobTitle || '—'}</span></p>
              <p>Your title: <span className="font-medium text-gray-700">{userTitle}</span></p>
            </div>
          </div>

          {/* Experience */}
          <div className="border border-gray-100 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800">📅 Experience <span className="text-xs text-gray-400 font-normal">(15%)</span></span>
              <span className={`font-bold text-lg ${getColor(experienceScore)}`}>{experienceScore}%</span>
            </div>
            <Bar score={experienceScore} color="bg-purple-500" />
          </div>

          {/* Location + Education */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-100 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800 text-sm">📍 Location <span className="text-xs text-gray-400 font-normal">(10%)</span></span>
                <span className={`font-bold ${getColor(locationScore)}`}>{locationScore}%</span>
              </div>
              <Bar score={locationScore} color="bg-teal-500" />
              <p className="text-xs text-gray-500 mt-1.5">{job.location || '—'}</p>
            </div>
            <div className="border border-gray-100 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800 text-sm">🎓 Education <span className="text-xs text-gray-400 font-normal">(10%)</span></span>
                <span className={`font-bold ${getColor(educationScore)}`}>{educationScore}%</span>
              </div>
              <Bar score={educationScore} color="bg-orange-400" />
            </div>
          </div>

          {/* Tip */}
          {missing.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
              💡 <strong>Tip:</strong> Adding <strong>{missing.slice(0, 3).join(', ')}</strong>
              {missing.length > 3 ? ` and ${missing.length - 3} more skills` : ''} to your profile could improve your match score.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
