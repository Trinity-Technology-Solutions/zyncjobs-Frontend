import React from 'react';

interface CandidateComparisonProps {
  candidates: any[];
  selectedJob: any;
  onClose: () => void;
}

const CandidateComparison: React.FC<CandidateComparisonProps> = ({
  candidates,
  selectedJob,
  onClose
}) => {
  if (candidates.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">👥 Candidate Comparison</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="text-2xl">×</span>
          </button>
        </div>
        
        <div className="p-6">
          {selectedJob && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900">Comparing for: {selectedJob.jobTitle}</h3>
              <p className="text-sm text-blue-700">{selectedJob.company} • {selectedJob.location}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="border border-gray-200 rounded-lg p-4">
                {/* Header */}
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-gray-900">{candidate.resume.profile.name}</h3>
                  <p className="text-sm text-gray-600">{candidate.resume.workExperiences[0]?.jobTitle}</p>
                  {candidate.matchScore && (
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                      candidate.matchScore.overall >= 80 ? 'bg-green-100 text-green-800' :
                      candidate.matchScore.overall >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {candidate.matchScore.overall}% Match
                    </div>
                  )}
                </div>
                
                {/* Contact Info */}
                <div className="mb-4 text-sm">
                  <p className="text-gray-600">📧 {candidate.resume.profile.email}</p>
                  <p className="text-gray-600">📱 {candidate.resume.profile.phone}</p>
                  <p className="text-gray-600">📍 {candidate.resume.profile.location}</p>
                </div>
                
                {/* Match Breakdown */}
                {candidate.matchScore && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Match Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Skills:</span>
                        <span className="font-medium">{candidate.matchScore.skills}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Experience:</span>
                        <span className="font-medium">{candidate.matchScore.experience}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Location:</span>
                        <span className="font-medium">{candidate.matchScore.location}%</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Skills */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Top Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {candidate.resume.skills.featuredSkills.slice(0, 6).map((skill: any, idx: number) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {skill.skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Experience */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Latest Experience</h4>
                  {candidate.resume.workExperiences[0] && (
                    <div className="text-sm">
                      <p className="font-medium">{candidate.resume.workExperiences[0].jobTitle}</p>
                      <p className="text-gray-600">{candidate.resume.workExperiences[0].company}</p>
                      <p className="text-gray-500">{candidate.resume.workExperiences[0].date}</p>
                    </div>
                  )}
                </div>
                
                {/* Education */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Education</h4>
                  {candidate.resume.educations[0] && (
                    <div className="text-sm">
                      <p className="font-medium">{candidate.resume.educations[0].degree}</p>
                      <p className="text-gray-600">{candidate.resume.educations[0].school}</p>
                      <p className="text-gray-500">{candidate.resume.educations[0].date}</p>
                    </div>
                  )}
                </div>
                
                {/* Strengths & Gaps */}
                {candidate.matchScore && (
                  <div>
                    <div className="mb-2">
                      <h5 className="text-sm font-medium text-green-700">✅ Strengths</h5>
                      <div className="flex flex-wrap gap-1">
                        {candidate.matchScore.skillMatches.slice(0, 3).map((skill: string, idx: number) => (
                          <span key={idx} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-red-700">❌ Gaps</h5>
                      <div className="flex flex-wrap gap-1">
                        {candidate.matchScore.missingSkills.slice(0, 3).map((skill: string, idx: number) => (
                          <span key={idx} className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700">
                    Interview
                  </button>
                  <button className="flex-1 bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700">
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateComparison;