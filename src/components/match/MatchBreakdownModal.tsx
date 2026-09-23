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

  const { overall, skillScore, roleScore, experienceScore, locationScore, educationScore, matched, missing, userSkills, jobSkills } =
    computeMatchBreakdown(job);

  const profile = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const userTitle = profile.jobTitle || profile.title || 'Not set';
  const userLocation = profile.location || 'Not set';

  const educationFields = [profile.education, profile.educationCollege, profile.degree, profile.college, profile.graduation, profile.university, profile.masters, profile.bachelors, profile.diploma, profile.certification];
  const hasEducation = educationFields.some(f => f && f !== 'Not specified' && f !== 'Fresher' && f !== '{}' && String(f).trim().length > 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Match Breakdown</h2>
            <p className="text-sm text-gray-500">{job.title || job.jobTitle} · {job.company}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-5">

          {/* Overall score */}
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
              <span className="font-semibold text-gray-800 inline-flex items-center gap-1.5">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8l2 4-4 1.5 2 2.5"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>
                Skills Match <span className="text-xs text-gray-400 font-normal">(45%)</span>
              </span>
              <span className={`font-bold text-lg ${getColor(skillScore)}`}>{skillScore}%</span>
            </div>
            <Bar score={skillScore} color={getBg(skillScore)} />

            {userSkills.length === 0 && (
              <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-3 py-2 rounded-lg inline-flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                No skills found in your profile. Add skills to your profile for accurate matching.
              </p>
            )}

            <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-500">
              <div><span className="font-medium">Job requires:</span> {jobSkills.length} skills</div>
              <div><span className="font-medium">You have:</span> {userSkills.length} skills</div>
            </div>

            {matched.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1.5 font-medium inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  Matched Skills ({matched.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {matched.map((s, i) => (
                    <span key={i} className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {missing.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1.5 font-medium inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Missing Skills ({missing.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {missing.map((s, i) => (
                    <span key={i} className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {userSkills.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1.5 font-medium">Your skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {userSkills.map((s, i) => (
                    <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Role Match */}
          <div className="border border-gray-100 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800 inline-flex items-center gap-1.5">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
                Role Match <span className="text-xs text-gray-400 font-normal">(20%)</span>
              </span>
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
              <span className="font-semibold text-gray-800 inline-flex items-center gap-1.5">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Experience <span className="text-xs text-gray-400 font-normal">(15%)</span>
              </span>
              <span className={`font-bold text-lg ${getColor(experienceScore)}`}>{experienceScore}%</span>
            </div>
            <Bar score={experienceScore} color="bg-purple-500" />
          </div>

          {/* Location + Education */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-100 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800 text-sm inline-flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                  Location <span className="text-xs text-gray-400 font-normal">(10%)</span>
                </span>
                <span className={`font-bold ${getColor(locationScore)}`}>{locationScore}%</span>
              </div>
              <Bar score={locationScore} color="bg-teal-500" />
              <div className="mt-1.5 text-xs text-gray-500 space-y-0.5">
                <p>Job: <span className="font-medium text-gray-700">{job.location || '—'}</span></p>
                <p>You: <span className="font-medium text-gray-700">{userLocation}</span></p>
              </div>
            </div>
            <div className="border border-gray-100 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800 text-sm inline-flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M22 10l-10-7L2 10l10 7 10-7z"/><path d="M6 12v5c0 1.1 2.69 2 6 2s6-.9 6-2v-5"/></svg>
                  Education <span className="text-xs text-gray-400 font-normal">(10%)</span>
                </span>
                {hasEducation
                  ? <span className={`font-bold ${getColor(educationScore)}`}>{educationScore}%</span>
                  : <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Not provided</span>
                }
              </div>
              {hasEducation
                ? <Bar score={educationScore} color="bg-orange-400" />
                : <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-3 py-2 rounded-lg flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                    Add your education details to your profile to include this in your match score.
                  </p>
              }
            </div>
          </div>

          {/* Tip */}
          {missing.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 flex items-start gap-1.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span><strong>Tip:</strong> Adding <strong>{missing.slice(0, 3).join(', ')}</strong>
              {missing.length > 3 ? ` and ${missing.length - 3} more skills` : ''} to your profile could significantly improve your match score.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
