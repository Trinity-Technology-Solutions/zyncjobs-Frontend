import React from 'react';
import { FileText } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import ResumeTemplate from './ResumeTemplate';

export default function LivePreview() {
  const { data } = useResumeStore();

  const hasContent =
    data.personalInfo.name ||
    data.summary ||
    data.experience.length > 0 ||
    data.education.length > 0 ||
    data.skills.length > 0;

  // ATS-style score (simple calc)
  const fields = [
    data.personalInfo.name, data.personalInfo.email, data.personalInfo.phone,
    data.personalInfo.location, data.summary,
  ].filter(Boolean).length;
  const score = Math.min(
    100,
    Math.round(
      (fields / 5) * 30 +
      Math.min(data.experience.length, 3) * 15 +
      Math.min(data.education.length, 2) * 10 +
      Math.min(data.skills.length, 10) * 2
    )
  );

  const scoreColor = score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-400';

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col"
      style={{ height: 'calc(100vh - 140px)' }}
    >
      {/* Header bar */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold text-white px-2 py-0.5 rounded ${scoreColor}`}>
            {score}%
          </span>
          <span className="text-sm font-semibold text-gray-700">Your resume score 🔥</span>
        </div>
        <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-0.5 rounded-full">
          {data.template}
        </span>
      </div>

      {/* Resume content */}
      <div className="flex-1 overflow-y-auto">
        {!hasContent ? (
          <div className="text-center py-16 text-gray-400 px-6">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Your resume will appear here</p>
            <p className="text-sm mt-1">Start filling in your details</p>
          </div>
        ) : (
          <div className="origin-top-left" style={{ transform: 'scale(0.72)', width: '138.9%' }}>
            <ResumeTemplate data={data} />
          </div>
        )}
      </div>
    </div>
  );
}
