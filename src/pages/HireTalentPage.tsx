import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface HireTalentPageProps {
  onNavigate?: (page: string) => void;
}

const HireTalentPage: React.FC<HireTalentPageProps> = ({ onNavigate }) => {

  return (
    <div className="bg-gray-50">
      <Header onNavigate={onNavigate} />
      
      {/* Main Content */}
      <main className="min-h-screen flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <button
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-8 mx-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Hire the best talent with Trinitejob
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Post jobs, manage your listings, and view applications from top tech professionals. 
            Connect with qualified candidates and build your dream team.
          </p>
          <button 
            onClick={() => onNavigate && onNavigate('job-posting')}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Post a Job
          </button>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default HireTalentPage;