import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface AIResumeBuilderPageProps {
  onNavigate?: (page: string, data?: any) => void;
  user?: {name: string, type: 'candidate' | 'employer'} | null;
  onLogout?: () => void;
}

const AIResumeBuilderPage: React.FC<AIResumeBuilderPageProps> = ({ onNavigate, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <div className="space-y-8">
            <div className="flex items-center space-x-2 text-green-600 font-semibold">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>48,801 resumes created today</span>
            </div>
            
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Your <span className="text-blue-500">professional AI resume</span>, ready in minutes
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Our AI resume builder saves your time with smart content suggestions and 
                impactful summaries. Get hired faster, stress-free!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => onNavigate && onNavigate('resume-templates')}
                className="bg-blue-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-600 transition-colors"
              >
                Create AI Resume Now
              </button>
              <button
                onClick={() => onNavigate && onNavigate('resume-editor')}
                className="border-2 border-blue-500 text-blue-500 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors"
              >
                Improve My Resume
              </button>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-8">
              <div>
                <div className="text-4xl font-bold text-green-500 mb-2">48%</div>
                <p className="text-gray-600">more likely to get hired</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-500 mb-2">12%</div>
                <p className="text-gray-600">better pay with your next job</p>
              </div>
            </div>
          </div>

          {/* Right Content - Resume Preview */}
          <div className="relative">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md mx-auto">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-gray-900">Samantha Williams</h3>
                <p className="text-gray-600">Senior Analyst</p>
                <p className="text-sm text-gray-500">New York, 10001</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">SUMMARY</h4>
                  <p className="text-sm text-gray-600">
                    Experienced Senior Analyst with 5+ years of experience in data analysis, business intelligence...
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">EXPERIENCE</h4>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Jul 2021 - Current</p>
                    <p>Senior Analyst • New York, NY</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">EDUCATION</h4>
                  <div className="text-sm text-gray-600">
                    <p>New York University • New York, NY</p>
                    <p>Bachelor of Science Economics, 2017</p>
                  </div>
                </div>
              </div>
              
              <button className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold mt-6 hover:bg-blue-600 transition-colors">
                🎯 Generate with AI
              </button>
            </div>
            
            {/* Floating illustration */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-100 rounded-full opacity-20"></div>
            <div className="absolute -top-10 -left-10 w-24 h-24 bg-green-100 rounded-full opacity-20"></div>
          </div>
        </div>
      </div>
      
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default AIResumeBuilderPage;