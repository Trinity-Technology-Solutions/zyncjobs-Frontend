import React from 'react';
import ResumeParserComponent from '../components/resume-parser/page';
import Header from '../components/Header';
import BackButton from '../components/BackButton';
import RoleGuard from '../components/RoleGuard';

interface ResumeParserPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const ResumeParserPage: React.FC<ResumeParserPageProps> = ({ onNavigate, user, onLogout }) => {
  return (
    <RoleGuard 
      userRole={user?.type || 'candidate'} 
      requiredFeature="resume-parser"
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>
            <p className="text-gray-600 mb-6">Resume parser is only available to job seekers.</p>
            <button onClick={() => onNavigate('home')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Go Home
            </button>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <BackButton 
            onClick={() => window.history.back()}
            text="Back"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
          />
        </div>
        <ResumeParserComponent onNavigate={onNavigate} user={user} />
        </div>
      </div>
    </RoleGuard>
  );
};

export default ResumeParserPage;
