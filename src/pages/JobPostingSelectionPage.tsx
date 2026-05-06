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
    <div className="min-h-screen relative overflow-hidden bg-white">

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        .anim-fade-1 { animation: fadeSlideUp 0.55s ease both; }
        .anim-fade-2 { animation: fadeSlideUp 0.55s 0.12s ease both; }
        .anim-fade-3 { animation: fadeSlideUp 0.55s 0.24s ease both; }
        .anim-fade-4 { animation: fadeSlideUp 0.55s 0.36s ease both; }
        .anim-fade-5 { animation: fadeSlideUp 0.55s 0.48s ease both; }
        .card-float:hover { animation: floatY 2.5s ease-in-out infinite; }
        .card-manual {
          background: linear-gradient(145deg, #3b4fd8 0%, #4f63f5 60%, #6272f7 100%);
          border: none;
          transition: box-shadow 0.3s, transform 0.3s;
        }
        .card-manual:hover {
          box-shadow: 0 12px 40px rgba(59,79,216,0.45);
          transform: translateY(-4px);
        }
        .card-ai {
          background: linear-gradient(145deg, #e05a1a 0%, #f97316 60%, #fb923c 100%);
          border: none;
          transition: box-shadow 0.3s, transform 0.3s;
        }
        .card-ai:hover {
          box-shadow: 0 12px 40px rgba(249,115,22,0.45);
          transform: translateY(-4px);
        }
        .step-dot-manual {
          background: rgba(255,255,255,0.25);
          border: 1px solid rgba(255,255,255,0.5);
          color: #fff;
        }
        .step-dot-ai {
          background: rgba(255,255,255,0.25);
          border: 1px solid rgba(255,255,255,0.5);
          color: #fff;
        }
        .check-manual { color: #fff; }
        .check-ai     { color: #fff; }
        .badge-ai {
          background: rgba(255,255,255,0.25);
          border: 1px solid rgba(255,255,255,0.5);
          color: #fff;
        }
        .stat-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          transition: background 0.3s;
        }
        .stat-card:hover { background: #f1f5f9; }
        .tip-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          transition: background 0.3s, border-color 0.3s;
        }
        .tip-card:hover {
          background: #eff6ff;
          border-color: #bfdbfe;
        }
      `}</style>

      <div className="relative max-w-5xl mx-auto px-6 py-10">

        {/* Back */}
        <div className="flex items-center mb-8 anim-fade-1">
          <BackButton onClick={() => onNavigate('dashboard')} text="Back" className="text-slate-600 hover:text-slate-900" />
        </div>

        {/* Header */}
        <div className="text-center mb-10 anim-fade-2">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-slate-900">
            Create New Job
          </h1>
          <p className="text-slate-500 text-base">Choose how you'd like to post your job</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch anim-fade-3">

          {/* Manual Creation — purple theme */}
          <div onClick={() => onNavigate('job-posting', { mode: 'manual' })}
            className="card-manual card-float rounded-2xl p-7 cursor-pointer backdrop-blur-sm flex flex-col">

            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 flex items-center justify-center rounded-xl flex-shrink-0 shadow-lg"
                style={{ background: 'rgba(255,255,255,0.2)', boxShadow: '0 0 16px rgba(255,255,255,0.15)' }}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Manual Creation</h3>
                <p className="text-blue-100 text-sm mt-0.5">Step-by-step guided form</p>
              </div>
            </div>

            <div className="space-y-2.5 mb-5">
              {manualSteps.map((text, i) => (
                <div key={i} className="flex items-center gap-3 min-h-[24px]">
                  <span className="step-dot-manual w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="text-sm text-slate-200">{text}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/20 pt-4 space-y-1.5 mb-5">
              {manualFeatures.map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-blue-50">
                  <span className="check-manual">✓</span><span>{f}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto flex items-center justify-between pt-2">
              <span className="text-xs text-blue-100/80 uppercase tracking-wider font-medium">Full Control</span>
              <button className="bg-white text-blue-700 font-semibold text-sm px-5 py-2 rounded-lg flex items-center gap-1.5 hover:bg-blue-50 transition-colors">
                Get Started
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Parse Job Details — orange theme */}
          <div onClick={() => onNavigate('job-parsing')}
            className="card-ai card-float rounded-2xl p-7 cursor-pointer flex flex-col">

            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 flex items-center justify-center rounded-xl flex-shrink-0 shadow-lg"
                style={{ background: 'rgba(255,255,255,0.2)', boxShadow: '0 0 16px rgba(255,255,255,0.15)' }}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white">Parse Job Details</h3>
                  <span className="badge-ai text-xs px-2 py-0.5 rounded-full font-semibold">AI</span>
                </div>
                <p className="text-orange-100 text-sm mt-0.5">Auto-extract with AI</p>
              </div>
            </div>

            <div className="space-y-2.5 mb-5">
              {parseSteps.map((text, i) => (
                <div key={i} className="flex items-center gap-3 min-h-[24px]">
                  <span className="step-dot-ai w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="text-sm text-slate-200">{text}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/20 pt-4 space-y-1.5 mb-5">
              {parseFeatures.map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-orange-50">
                  <span className="check-ai">✓</span><span>{f}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto flex items-center justify-between pt-2">
              <span className="text-xs text-orange-100/80 uppercase tracking-wider font-medium">Fastest Way</span>
              <button className="bg-white text-orange-600 font-semibold text-sm px-5 py-2 rounded-lg flex items-center gap-1.5 hover:bg-orange-50 transition-colors">
                Get Started
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="max-w-4xl mx-auto mt-8 anim-fade-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Job Posting Best Practices</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { 
                icon: <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>, 
                title: 'Clear Job Title', 
                desc: 'Standard titles get 3x more views.' 
              },
              { 
                icon: <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, 
                title: 'Include Salary Range', 
                desc: '30% more applications with salary info.' 
              },
              { 
                icon: <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, 
                title: 'Specify Location', 
                desc: 'Remote jobs get 200% more reach.' 
              },
              { 
                icon: <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, 
                title: 'List Key Skills', 
                desc: 'Limit to 5–8 must-have skills.' 
              },
              { 
                icon: <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>, 
                title: 'Optimal Description', 
                desc: '300–600 words performs best.' 
              },
              { 
                icon: <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, 
                title: 'Post Quickly', 
                desc: 'Jobs posted fast fill 2x faster.' 
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="tip-card rounded-xl p-4">
                <div className="mb-2">{icon}</div>
                <h4 className="font-semibold text-slate-800 text-sm mb-1">{title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="max-w-4xl mx-auto mt-6 stat-card rounded-2xl p-5 anim-fade-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { value: '23 days', label: 'Avg. time to hire', color: '#3b4fd8' },
              { value: '+30%', label: 'More apps with salary', color: '#16a34a' },
              { value: '+200%', label: 'Reach with remote', color: '#0891b2' },
              { value: '80%', label: 'Time saved with parsing', color: '#e05a1a' },
            ].map(({ value, label, color }) => (
              <div key={label}>
                <div className="text-2xl font-extrabold" style={{ color }}>{value}</div>
                <div className="text-xs text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default JobPostingSelectionPage;
