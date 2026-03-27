import React from 'react';
import BackButton from '../components/BackButton';

interface JobPostingSelectionPageProps {
  onNavigate: (page: string, options?: any) => void;
  user?: any;
}

const JobPostingSelectionPage: React.FC<JobPostingSelectionPageProps> = ({ onNavigate, user }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="flex justify-between items-start mb-8">
            <BackButton 
              onClick={() => onNavigate('dashboard')}
              text="Back to Dashboard"
            />
            <button 
              onClick={() => onNavigate('dashboard')} 
              className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
            >
              ×
            </button>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">Create New Job</h1>
            <p className="text-gray-600 mt-2">Choose how you'd like to post your job</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Manual Creation */}
          <div 
            onClick={() => onNavigate('job-posting', { mode: 'manual' })}
            className="group bg-white border-2 border-gray-200 hover:border-blue-500 rounded-xl p-8 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1"
          >
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg group-hover:from-blue-100 group-hover:to-blue-200 transition-all">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">Manual Creation</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">Create job posting step by step with our guided form</p>
            </div>
            <div className="space-y-3 mb-6">
              {[
                { step: '1', text: 'Fill in job title, location & company' },
                { step: '2', text: 'Set job type, pay & benefits' },
                { step: '3', text: 'Add skills & qualifications' },
                { step: '4', text: 'Write or AI-generate job description' },
                { step: '5', text: 'Review & publish' },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{step}</span>
                  <span className="text-sm text-gray-600">{text}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-2">
              {['AI-powered job title & skill suggestions', 'Auto-generate job description with AI', 'Real-time salary benchmarking tips'].map(f => (
                <div key={f} className="flex items-center space-x-2 text-xs text-gray-500">
                  <span className="text-blue-500">✓</span><span>{f}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center text-blue-600 font-semibold text-sm mt-6 group-hover:translate-x-1 transition-transform">
              Get Started
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Parse Job Details */}
          <div 
            onClick={() => onNavigate('job-parsing')}
            className="group bg-white border-2 border-gray-200 hover:border-purple-500 rounded-xl p-8 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1"
          >
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg group-hover:from-purple-100 group-hover:to-purple-200 transition-all">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">Parse Job Details</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">Paste job description and auto-extract details with AI</p>
            </div>
            <div className="space-y-3 mb-6">
              {[
                { step: '1', text: 'Paste your existing job description' },
                { step: '2', text: 'AI extracts title, skills, salary & more' },
                { step: '3', text: 'Review and edit auto-filled fields' },
                { step: '4', text: 'Confirm details & publish instantly' },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{step}</span>
                  <span className="text-sm text-gray-600">{text}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-2">
              {['Auto-extract skills, salary & experience', 'Saves up to 80% of posting time', 'Supports PDF, Word & plain text'].map(f => (
                <div key={f} className="flex items-center space-x-2 text-xs text-gray-500">
                  <span className="text-purple-500">✓</span><span>{f}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center text-purple-600 font-semibold text-sm mt-6 group-hover:translate-x-1 transition-transform">
              Get Started
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Tips & Best Practices */}
        <div className="max-w-4xl mx-auto mt-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">📋 Job Posting Best Practices</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '🎯',
                title: 'Clear Job Title',
                desc: 'Use standard titles like "Software Engineer" instead of internal codes. Clear titles get 3x more views.',
              },
              {
                icon: '💰',
                title: 'Include Salary Range',
                desc: 'Jobs with salary info receive 30% more applications and attract higher-quality candidates.',
              },
              {
                icon: '📍',
                title: 'Specify Location',
                desc: 'Remote-friendly jobs get 200% more reach. Be clear about hybrid or on-site expectations.',
              },
              {
                icon: '🛠️',
                title: 'List Key Skills',
                desc: 'Limit to 5–8 must-have skills. Overly long lists discourage qualified candidates from applying.',
              },
              {
                icon: '📝',
                title: 'Optimal Description',
                desc: '300–600 word descriptions perform best. Too long reduces applications by up to 25%.',
              },
              {
                icon: '⚡',
                title: 'Post Quickly',
                desc: 'Jobs posted within 48 hours of opening fill 2x faster. Use parsing to save time.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="text-2xl mb-3">{icon}</div>
                <h4 className="font-semibold text-gray-800 mb-1">{title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="max-w-4xl mx-auto mt-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            {[
              { value: '23 days', label: 'Avg. time to hire' },
              { value: '+30%', label: 'More apps with salary' },
              { value: '+200%', label: 'Reach with remote' },
              { value: '80%', label: 'Time saved with parsing' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-sm text-blue-100 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobPostingSelectionPage;
