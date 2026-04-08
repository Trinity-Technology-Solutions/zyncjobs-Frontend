import React from 'react';
import BackButton from '../components/BackButton';

interface JobPostingSelectionPageProps {
  onNavigate: (page: string, options?: any) => void;
  user?: any;
}

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 relative overflow-hidden">

      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600 rounded-full opacity-5 blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center mb-8">
          <BackButton onClick={() => onNavigate('dashboard')} text="Back to Dashboard" className="text-blue-200 hover:text-white" />
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">Create New Job</h1>
          <p className="text-blue-200 text-base">Choose how you'd like to post your job</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">

          {/* Manual Creation */}
          <div
            onClick={() => onNavigate('job-posting', { mode: 'manual' })}
            className="group bg-gradient-to-br from-blue-800/60 via-blue-900/60 to-indigo-900/80 backdrop-blur-sm border border-blue-500/40 hover:border-blue-400 rounded-2xl p-7 cursor-pointer transition-all duration-300 hover:from-blue-700/70 hover:via-blue-800/70 hover:to-indigo-800/80 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-1 flex flex-col"
          >
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg shadow-blue-500/30 flex-shrink-0">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">Manual Creation</h3>
                <p className="text-blue-200 text-sm mt-0.5">Step-by-step guided form</p>
              </div>
            </div>

            <div className="space-y-2.5 mb-5">
              {manualSteps.map((text, i) => (
                <div key={i} className="flex items-center gap-3 min-h-[24px]">
                  <span className="w-5 h-5 rounded-full bg-blue-500/30 border border-blue-400/50 text-blue-300 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="text-sm text-blue-100">{text}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4 space-y-1.5 mb-5">
              {manualFeatures.map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-blue-300">
                  <span className="text-blue-400">✓</span><span>{f}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto flex items-center justify-between pt-2">
              <span className="text-xs text-blue-300/60 uppercase tracking-wider font-medium">Full Control</span>
              <div className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                Get Started
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Parse Job Details */}
          <div
            onClick={() => onNavigate('job-parsing')}
            className="group bg-gradient-to-br from-blue-800/60 via-blue-900/60 to-indigo-900/80 backdrop-blur-sm border border-blue-500/40 hover:border-blue-400 rounded-2xl p-7 cursor-pointer transition-all duration-300 hover:from-blue-700/70 hover:via-blue-800/70 hover:to-indigo-800/80 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-1 flex flex-col"
          >
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg shadow-blue-500/30 flex-shrink-0">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">Parse Job Details</h3>
                  <span className="text-xs bg-blue-500/30 border border-blue-400/40 text-blue-300 px-2 py-0.5 rounded-full font-medium">AI</span>
                </div>
                <p className="text-blue-200 text-sm mt-0.5">Auto-extract with AI</p>
              </div>
            </div>

            <div className="space-y-2.5 mb-5">
              {parseSteps.map((text, i) => (
                <div key={i} className="flex items-center gap-3 min-h-[24px]">
                  <span className="w-5 h-5 rounded-full bg-blue-500/30 border border-blue-400/50 text-blue-300 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="text-sm text-blue-100">{text}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4 space-y-1.5 mb-5">
              {parseFeatures.map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-blue-300">
                  <span className="text-blue-400">✓</span><span>{f}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto flex items-center justify-between pt-2">
              <span className="text-xs text-blue-300/60 uppercase tracking-wider font-medium">Fastest Way</span>
              <div className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                Get Started
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="max-w-4xl mx-auto mt-8">
          <h2 className="text-base font-semibold text-blue-200 mb-4 text-center uppercase tracking-wider">📋 Job Posting Best Practices</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { icon: '🎯', title: 'Clear Job Title', desc: 'Standard titles get 3x more views.' },
              { icon: '💰', title: 'Include Salary Range', desc: '30% more applications with salary info.' },
              { icon: '📍', title: 'Specify Location', desc: 'Remote jobs get 200% more reach.' },
              { icon: '🛠️', title: 'List Key Skills', desc: 'Limit to 5–8 must-have skills.' },
              { icon: '📝', title: 'Optimal Description', desc: '300–600 words performs best.' },
              { icon: '⚡', title: 'Post Quickly', desc: 'Jobs posted fast fill 2x faster.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                <div className="text-xl mb-2">{icon}</div>
                <h4 className="font-semibold text-white text-sm mb-1">{title}</h4>
                <p className="text-xs text-blue-300 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="max-w-4xl mx-auto mt-6 bg-white/10 border border-white/15 backdrop-blur-sm rounded-2xl p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { value: '23 days', label: 'Avg. time to hire' },
              { value: '+30%', label: 'More apps with salary' },
              { value: '+200%', label: 'Reach with remote' },
              { value: '80%', label: 'Time saved with parsing' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-xs text-blue-300 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default JobPostingSelectionPage;
