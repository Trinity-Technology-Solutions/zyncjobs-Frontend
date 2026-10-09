import React from 'react';
import ResumeParserComponent from '../components/resume-parser/page';
import Header from '../components/Header';
import BackButton from '../components/BackButton';

interface ResumeParserPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const ResumeParserPage: React.FC<ResumeParserPageProps> = ({ onNavigate, user, onLogout }) => {
  return (
    <div className="resume-parser-page min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      <div className="portal-page-container py-6">
        <div className="mb-6">
          <BackButton 
            fallback={user?.type === 'employer' ? '/dashboard' : '/resume-studio'}
            text={user?.type === 'employer' ? 'Back to Dashboard' : 'Back to Resume Studio'}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
          />
        </div>
        <ResumeParserComponent onNavigate={onNavigate} user={user} />
      </div>
    </div>
  );
};

export default ResumeParserPage;
