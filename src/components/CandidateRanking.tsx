import React from 'react';

interface CandidateRankingProps {
  candidates: any[];
  selectedJob: any;
  onSelectCandidate: (candidateId: string) => void;
  selectedCandidates: string[];
  filterCriteria: any;
  onFilterChange: (criteria: any) => void;
}

const CandidateRanking: React.FC<CandidateRankingProps> = ({
  candidates,
  selectedJob,
  onSelectCandidate,
  selectedCandidates,
  filterCriteria,
  onFilterChange
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mt-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Candidate Ranking & Filtering</h2>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Match Score</label>
          <input
            type="range"
            min="0"
            max="100"
            value={filterCriteria.minScore}
            onChange={(e) => onFilterChange({...filterCriteria, minScore: parseInt(e.target.value)})}
            className="w-full"
          />
          <span className="text-sm text-gray-600">{filterCriteria.minScore}%</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Required Skill</label>
          <input
            type="text"
            value={filterCriteria.skills}
            onChange={(e) => onFilterChange({...filterCriteria, skills: e.target.value})}
            placeholder="e.g. JavaScript, Python"
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={filterCriteria.location}
            onChange={(e) => onFilterChange({...filterCriteria, location: e.target.value})}
            placeholder="e.g. San Francisco, Remote"
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Candidate List */}
      <div className="space-y-4">
        {candidates.map((candidate, index) => (
          <div key={candidate.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={selectedCandidates.includes(candidate.id)}
                  onChange={() => onSelectCandidate(candidate.id)}
                  className="w-4 h-4"
                />
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                    #{index + 1}
                  </span>
                  <div>
                    <h3 className="font-medium text-gray-900">{candidate.resume.profile.name}</h3>
                    <p className="text-sm text-gray-600">{candidate.fileName}</p>
                  </div>
                </div>
              </div>
              
              {candidate.matchScore && (
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className={`text-lg font-bold ${
                      candidate.matchScore.overall >= 80 ? 'text-green-600' :
                      candidate.matchScore.overall >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {candidate.matchScore.overall}%
                    </div>
                    <div className="text-xs text-gray-500">Overall</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-700">{candidate.matchScore.skills}%</div>
                    <div className="text-xs text-gray-500">Skills</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-700">{candidate.matchScore.experience}%</div>
                    <div className="text-xs text-gray-500">Experience</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Quick Info */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">📍 {candidate.resume.profile.location}</span>
              <span className="text-sm text-gray-600">💼 {candidate.resume.workExperiences[0]?.jobTitle}</span>
              <span className="text-sm text-gray-600">🎓 {candidate.resume.educations[0]?.degree}</span>
            </div>
            
            {/* Skills Preview */}
            <div className="mt-2 flex flex-wrap gap-1">
              {candidate.resume.skills.featuredSkills.slice(0, 4).map((skill: any, idx: number) => (
                <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  {skill.skill}
                </span>
              ))}
              {candidate.resume.skills.featuredSkills.length > 4 && (
                <span className="text-xs text-gray-500">+{candidate.resume.skills.featuredSkills.length - 4} more</span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {candidates.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No candidates uploaded yet. Use bulk upload to add multiple resumes.
        </div>
      )}
    </div>
  );
};

export default CandidateRanking;