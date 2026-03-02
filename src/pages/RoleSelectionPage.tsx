import React from 'react';
import { User, Building } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface RoleSelectionPageProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

const RoleSelectionPage: React.FC<RoleSelectionPageProps> = ({ onNavigate, user = null, onLogout }) => {
  const handleRoleSelection = (role: 'candidate' | 'employer') => {
    if (role === 'candidate') {
      onNavigate('candidate-register');
    } else {
      onNavigate('employer-register');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] px-4 py-12">
        <div className="max-w-4xl w-full">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Where tech connects
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Be a part of the Zync community, where more than half of U.S. technology 
              professionals come to land their next job; as an analyst, designer, developer and 
              many more, regardless of your level.
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Tech Professionals Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow flex flex-col h-full">
              <div className="text-center flex-1">
                <h2 className="text-2xl font-bold text-teal-600 mb-4">Tech Professionals</h2>
                <div className="flex justify-center mb-6">
                  <div className="w-32 h-32 bg-teal-50 rounded-full flex items-center justify-center">
                    <User className="w-16 h-16 text-teal-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  I'm interested in a tech job.
                </h3>
                <p className="text-gray-600 mb-8">
                  Be seen and get hired. Create your profile and let opportunities find you.
                </p>
              </div>
              <button
                onClick={() => handleRoleSelection('candidate')}
                className="w-full bg-teal-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-teal-700 transition-colors mt-auto"
              >
                Create Candidate Profile
              </button>
            </div>

            {/* Employers & Recruiters Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow flex flex-col h-full">
              <div className="text-center flex-1">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Employers & Recruiters</h2>
                <div className="flex justify-center mb-6">
                  <div className="w-32 h-32 bg-red-50 rounded-full flex items-center justify-center">
                    <Building className="w-16 h-16 text-red-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  I'm looking to hire tech talent.
                </h3>
                <p className="text-gray-600 mb-8">
                  Let us show you how we help fill tech jobs faster.
                </p>
              </div>
              <button
                onClick={() => handleRoleSelection('employer')}
                className="w-full bg-red-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors mt-auto"
              >
                Create Employer Profile
              </button>
            </div>
          </div>

          {/* Already have an account */}
          <div className="text-center mt-12">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default RoleSelectionPage;