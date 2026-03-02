import React from 'react';
import BackButton from '../components/BackButton';

interface JobPostingSelectionPageProps {
  onNavigate: (page: string, options?: any) => void;
  user?: any;
}

const JobPostingSelectionPage: React.FC<JobPostingSelectionPageProps> = ({ onNavigate, user }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-between items-center mb-8">
            <BackButton 
              onClick={() => onNavigate('dashboard')}
              text="Back to Dashboard"
            />
            <div className="flex-1 text-center">
              <h1 className="text-4xl font-bold text-gray-800">New Job</h1>
            </div>
            <button 
              onClick={() => onNavigate('dashboard')} 
              className="text-gray-500 text-2xl hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Manual Creation */}
          <div 
            onClick={() => onNavigate('job-posting', { mode: 'manual' })}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl p-8 cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Manual Creation</h3>
              <p className="text-blue-100 text-sm">Create job posting step by step with guided form</p>
            </div>
          </div>

          {/* Parse Job Details */}
          <div 
            onClick={() => onNavigate('job-parsing')}
            className="bg-pink-500 hover:bg-pink-600 text-white rounded-2xl p-8 cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M8,12V14H16V12H8M8,16V18H13V16H8Z" />
                  <path d="M12,15L16,11H13V7H11V11H8L12,15Z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Parse Job Details</h3>
              <p className="text-pink-100 text-sm">Paste job description and auto-extract details</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600">Choose how you'd like to create your job posting</p>
        </div>
      </div>
    </div>
  );
};

export default JobPostingSelectionPage;