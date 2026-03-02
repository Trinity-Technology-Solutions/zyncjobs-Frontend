import React, { useState } from 'react';

interface JobModerationCardProps {
  job: {
    _id: string;
    jobTitle: string;
    company: string;
    description: string;
    salary?: { min: number; max: number; currency: string };
    moderationFlags?: {
      isSpam: boolean;
      isFake: boolean;
      hasComplianceIssues: boolean;
      isDuplicate: boolean;
    };
  };
  onModerate: (jobId: string, action: string, notes?: string) => void;
}

const JobModerationCard: React.FC<JobModerationCardProps> = ({ job, onModerate }) => {
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const handleModerate = (action: string) => {
    onModerate(job._id, action, notes);
    setNotes('');
    setShowNotes(false);
  };

  const getRiskLevel = () => {
    const flags = job.moderationFlags || {};
    const flagCount = Object.values(flags).filter(Boolean).length;
    
    if (flagCount >= 3) return { level: 'High', color: 'red' };
    if (flagCount >= 2) return { level: 'Medium', color: 'orange' };
    if (flagCount >= 1) return { level: 'Low', color: 'yellow' };
    return { level: 'Clean', color: 'green' };
  };

  const risk = getRiskLevel();

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{job.jobTitle}</h3>
          <p className="text-gray-600">{job.company}</p>
          {job.salary && (
            <p className="text-sm text-gray-500">
              {job.salary.min} - {job.salary.max} {job.salary.currency}
            </p>
          )}
        </div>
        <span className={`px-3 py-1 rounded text-sm font-medium bg-${risk.color}-100 text-${risk.color}-800`}>
          {risk.level} Risk
        </span>
      </div>

      <div className="mb-4">
        <p className="text-gray-700 text-sm line-clamp-3">{job.description}</p>
      </div>

      {/* Flags */}
      {job.moderationFlags && (
        <div className="mb-4">
          <div className="flex gap-2 flex-wrap">
            {job.moderationFlags.isSpam && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">🚫 Spam</span>
            )}
            {job.moderationFlags.isFake && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">⚠️ Fake</span>
            )}
            {job.moderationFlags.hasComplianceIssues && (
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">📋 Compliance</span>
            )}
            {job.moderationFlags.isDuplicate && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">📄 Duplicate</span>
            )}
          </div>
        </div>
      )}

      {/* Notes Section */}
      {showNotes && (
        <div className="mb-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add moderation notes..."
            className="w-full p-2 border rounded text-sm"
            rows={3}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => handleModerate('approve')}
          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
        >
          ✓ Approve
        </button>
        <button
          onClick={() => handleModerate('reject')}
          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          ✗ Reject
        </button>
        <button
          onClick={() => handleModerate('flag')}
          className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
        >
          🏴 Flag
        </button>
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
        >
          📝 Notes
        </button>
      </div>
    </div>
  );
};

export default JobModerationCard;