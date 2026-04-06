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

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden h-full flex flex-col">
      <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <span className="text-sm font-semibold text-gray-700">Live Preview</span>
        <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-0.5 rounded-full">
          {data.template}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
        {!hasContent ? (
          <div className="text-center py-16 text-gray-400 px-6">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Your resume will appear here</p>
            <p className="text-sm mt-1">Start filling in your details</p>
          </div>
        ) : (
          <ResumeTemplate data={data} />
        )}
      </div>
    </div>
  );
}
