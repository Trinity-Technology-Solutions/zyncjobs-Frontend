import React from 'react';
import { 
  FileEdit, 
  Sparkles, 
  UploadCloud, 
  Check, 
  ArrowRight, 
  BookOpen, 
  DollarSign, 
  MapPin, 
  ListChecks, 
  FileText, 
  Zap 
} from 'lucide-react';
import BackButton from '../components/BackButton';

interface JobPostingSelectionPageProps {
  onNavigate: (page: string, options?: any) => void;
  user?: any;
}

const bulkSteps = [
  'Upload CSV file',
  'AI parses every JD automatically',
  'Preview, edit & validate all jobs',
  'Bulk publish in one click',
  'Jobs go live instantly',
];

const bulkFeatures = [
  'Parse 100+ JDs in minutes',
  'AI extracts title, skills, salary & more',
  'Edit & fix any job before publishing',
];

const manualSteps = [
  'Fill in job title, location & company',
  'Set job type, pay & benefits',
  'Add skills & qualifications',
  'Write or AI-generate job description',
  'Review & publish',
];

const parseSteps = [
  'Paste your existing job description',
  'AI extracts title, skills, salary & more',
  'Review and edit auto-filled fields',
  'Confirm details & publish instantly',
  'Job goes live & reaches candidates',
];

const manualFeatures = [
  'AI-powered job title & skill suggestions',
  'Auto-generate job description with AI',
  'Real-time salary benchmarking tips',
];

const parseFeatures = [
  'Auto-extract skills, salary & experience',
  'Saves up to 80% of posting time',
  'Supports PDF, Word & plain text',
];

const JobPostingSelectionPage: React.FC<JobPostingSelectionPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

        {/* Top Back Action */}
        <div className="flex items-center mb-6 sm:mb-8">
          <BackButton fallback="/dashboard" text="Back" className="text-slate-600 hover:text-slate-900" />
        </div>

        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12 max-w-2xl mx-auto">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-600 mb-2">
            Job Publishing
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
            Create New <span className="text-orange-500">Job</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 leading-relaxed">
            Choose how you'd like to post your job — manual entry, instant AI parsing, or bulk CSV upload.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch mb-12 sm:mb-14">

          {/* Option 1: Manual Creation */}
          <div 
            onClick={() => onNavigate('job-posting', { mode: 'manual' })}
            className="group relative bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-xs p-6 sm:p-7 flex flex-col justify-between cursor-pointer transition-all duration-200 shadow-2xs select-none"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onNavigate('job-posting', { mode: 'manual' });
              }
            }}
          >
            <div>
              {/* Header */}
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200 flex-shrink-0">
                  <FileEdit className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
                    Manual Creation
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Step-by-step guided form
                  </p>
                </div>
              </div>

              {/* Step Sequence */}
              <div className="space-y-2.5 my-5">
                {manualSteps.map((text, i) => (
                  <div key={i} className="flex items-start gap-2.5 min-h-[22px]">
                    <span className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-700 leading-snug font-normal">
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Feature Highlights */}
              <div className="border-t border-gray-100 pt-3.5 my-4 space-y-1.5">
                {manualFeatures.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" strokeWidth={2.2} />
                    <span className="font-medium">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                Full Control
              </span>
              <button 
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Option 2: Parse Job Details */}
          <div 
            onClick={() => onNavigate('job-parsing')}
            className="group relative bg-white rounded-xl border border-gray-200 hover:border-orange-400 hover:shadow-xs p-6 sm:p-7 flex flex-col justify-between cursor-pointer transition-all duration-200 shadow-2xs select-none"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onNavigate('job-parsing');
              }
            }}
          >
            <div>
              {/* Header */}
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-11 h-11 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-200 flex-shrink-0">
                  <Sparkles className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors leading-snug">
                      Parse Job Details
                    </h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200">
                      AI
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Auto-extract with AI
                  </p>
                </div>
              </div>

              {/* Step Sequence */}
              <div className="space-y-2.5 my-5">
                {parseSteps.map((text, i) => (
                  <div key={i} className="flex items-start gap-2.5 min-h-[22px]">
                    <span className="w-5 h-5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-700 leading-snug font-normal">
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Feature Highlights */}
              <div className="border-t border-gray-100 pt-3.5 my-4 space-y-1.5">
                {parseFeatures.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" strokeWidth={2.2} />
                    <span className="font-medium">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-orange-600 uppercase tracking-wider">
                Fastest Way
              </span>
              <button 
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Option 3: Bulk Import */}
          <div 
            onClick={() => onNavigate('bulk-job-import')}
            className="group relative bg-white rounded-xl border border-gray-200 hover:border-emerald-400 hover:shadow-xs p-6 sm:p-7 flex flex-col justify-between cursor-pointer transition-all duration-200 shadow-2xs select-none"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onNavigate('bulk-job-import');
              }
            }}
          >
            <div>
              {/* Header */}
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200 flex-shrink-0">
                  <UploadCloud className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors leading-snug">
                      Bulk Import
                    </h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      NEW
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Import 100s of jobs at once
                  </p>
                </div>
              </div>

              {/* Step Sequence */}
              <div className="space-y-2.5 my-5">
                {bulkSteps.map((text, i) => (
                  <div key={i} className="flex items-start gap-2.5 min-h-[22px]">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-700 leading-snug font-normal">
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Feature Highlights */}
              <div className="border-t border-gray-100 pt-3.5 my-4 space-y-1.5">
                {bulkFeatures.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-gray-600">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" strokeWidth={2.2} />
                    <span className="font-medium">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
                Recruiters & Agencies
              </span>
              <button 
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

        </div>

        {/* Best Practices Section */}
        <div className="max-w-5xl mx-auto mt-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-gray-500" />
            <h2 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Job Posting Best Practices
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
            {[
              { 
                icon: <FileText className="w-4 h-4 text-blue-600" />, 
                title: 'Clear Job Title', 
                desc: 'Standard titles get 3x more views.' 
              },
              { 
                icon: <DollarSign className="w-4 h-4 text-emerald-600" />, 
                title: 'Include Salary Range', 
                desc: '30% more applications with salary info.' 
              },
              { 
                icon: <MapPin className="w-4 h-4 text-red-600" />, 
                title: 'Specify Location', 
                desc: 'Remote jobs get 200% more reach.' 
              },
              { 
                icon: <ListChecks className="w-4 h-4 text-purple-600" />, 
                title: 'List Key Skills', 
                desc: 'Limit to 5–8 must-have skills.' 
              },
              { 
                icon: <FileEdit className="w-4 h-4 text-indigo-600" />, 
                title: 'Optimal Description', 
                desc: '300–600 words performs best.' 
              },
              { 
                icon: <Zap className="w-4 h-4 text-amber-600" />, 
                title: 'Post Quickly', 
                desc: 'Jobs posted fast fill 2x faster.' 
              },
            ].map(({ icon, title, desc }) => (
              <div 
                key={title} 
                className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-2xs hover:border-gray-300 hover:shadow-xs transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center mb-2.5">
                  {icon}
                </div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1">{title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="max-w-5xl mx-auto mt-6 bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-2xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {[
              { value: '23 days', label: 'Avg. time to hire', color: '#2563eb' },
              { value: '+30%', label: 'More apps with salary', color: '#16a34a' },
              { value: '+200%', label: 'Reach with remote', color: '#0891b2' },
              { value: '80%', label: 'Time saved with parsing', color: '#ea580c' },
            ].map(({ value, label, color }, idx) => (
              <div key={label} className={idx > 1 ? 'pt-3 md:pt-0' : ''}>
                <div className="text-2xl font-bold tracking-tight" style={{ color }}>{value}</div>
                <div className="text-xs text-gray-500 mt-1 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default JobPostingSelectionPage;
