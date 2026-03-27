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
              <p className="text-gray-600 text-sm leading-relaxed mb-4">Create job posting step by step with our guided form</p>
              <div className="flex items-center justify-center text-blue-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                Get Started
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
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
              <p className="text-gray-600 text-sm leading-relaxed mb-4">Paste job description and auto-extract details</p>
              <div className="flex items-center justify-center text-purple-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                Get Started
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobPostingSelectionPage;
