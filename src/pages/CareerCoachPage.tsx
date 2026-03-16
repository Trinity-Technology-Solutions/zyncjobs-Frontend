import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RoleGuard from '../components/RoleGuard';

interface CareerCoachPageProps {
  onNavigate?: (page: string, data?: any) => void;
  user?: {name: string, type: 'candidate' | 'employer' | 'admin'} | null;
  onLogout?: () => void;
}

const CareerCoachPage: React.FC<CareerCoachPageProps> = ({ onNavigate, user, onLogout }) => {
  return (
    <RoleGuard 
      userRole={user?.type || 'candidate'} 
      requiredFeature="career-coach"
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>
            <p className="text-gray-600 mb-6">Career coaching is only available to job seekers.</p>
            <button onClick={() => onNavigate && onNavigate('home')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Go Home
            </button>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI Career Coach
            </h1>
            <p className="text-xl text-gray-600">
              Get personalized career guidance powered by artificial intelligence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Career Path Planning</h3>
              <p className="text-gray-600">Get personalized recommendations for your career progression</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Skill Gap Analysis</h3>
              <p className="text-gray-600">Identify skills you need to develop for your dream job</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💼</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Interview Preparation</h3>
              <p className="text-gray-600">Practice with AI-powered mock interviews</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Start Career Coaching
            </button>
          </div>
        </div>
        
        <Footer onNavigate={onNavigate} />
      </div>
    </RoleGuard>
  );
};

export default CareerCoachPage;