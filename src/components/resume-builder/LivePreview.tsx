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

  // ATS score — mirrors backend /ats-score logic exactly
  const hasName = !!data.personalInfo.name;
  const hasEmail = !!data.personalInfo.email;
  const hasPhone = !!data.personalInfo.phone;
  const summaryVal = Array.isArray(data.summary)
    ? (data.summary as string[]).filter(Boolean).join(' ')
    : data.summary || '';
  const hasSummary = !!summaryVal.trim();
  const skillsCount = data.skills.length;
  const bulletsCount = data.experience.flatMap((e) => e.bullets.filter((b) => b.trim())).length;
  const hasEducation = data.education.length > 0;
  const hasExperience = data.experience.length > 0;

  let score = 0;
  if (hasName) score += 10;
  if (hasEmail && hasPhone) score += 10;
  else if (hasEmail || hasPhone) score += 5;
  if (hasSummary) score += 20;
  score += Math.min(20, skillsCount * 2);
  if (hasExperience) score += 20;
  score += Math.min(10, bulletsCount * 2);
  if (hasEducation) score += 10;
  score = Math.min(100, score);

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
