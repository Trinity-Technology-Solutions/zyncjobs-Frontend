import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RoleGuard from '../components/RoleGuard';

interface AIResumeBuilderPageProps {
  onNavigate?: (page: string, data?: any) => void;
  user?: {name: string, type: 'candidate' | 'employer'} | null;
  onLogout?: () => void;
}

const AIResumeBuilderPage: React.FC<AIResumeBuilderPageProps> = ({ onNavigate, user, onLogout }) => {
  return (
    <RoleGuard 
      userRole={user?.type || 'candidate'} 
      requiredFeature="resume-builder"
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>
            <p className="text-gray-600 mb-6">This feature is only available to job seekers.</p>
            <button onClick={() => onNavigate && onNavigate('home')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Go Home
            </button>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <div className="space-y-8">
            <div className="flex items-center space-x-2 text-green-600 font-semibold animate-pulse">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>48,801 resumes created today</span>
            </div>
            
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Your <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">professional AI resume</span>, ready in minutes
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Our AI resume builder saves your time with smart content suggestions and 
                impactful summaries. Get hired faster, stress-free!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => onNavigate && onNavigate('resume-templates')}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-glow transition-all duration-300 btn-glow"
              >
                Create AI Resume Now
              </button>
              <button
                onClick={() => onNavigate && onNavigate('resume-editor')}
                className="border-2 border-blue-500 text-blue-500 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors card-hover"
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
            <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-2xl p-8 max-w-md mx-auto card-hover shimmer-effect">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full mx-auto mb-4 shadow-lg"></div>
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
              
              <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-lg font-semibold mt-6 hover:shadow-glow transition-all duration-300 btn-glow">
                🎯 Generate with AI
              </button>
            </div>
            
            {/* Floating illustration */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-100 rounded-full opacity-20"></div>
            <div className="absolute -top-10 -left-10 w-24 h-24 bg-green-100 rounded-full opacity-20"></div>
          </div>
        </div>
      </div>
      
        <Footer onNavigate={onNavigate} user={user} />
      </div>
    </RoleGuard>
  );
};

export default AIResumeBuilderPage;
