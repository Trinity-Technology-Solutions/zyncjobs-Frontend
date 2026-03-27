import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface WhyZyncJobsPageProps {
  onNavigate?: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const WhyZyncJobsPage: React.FC<WhyZyncJobsPageProps> = ({ onNavigate, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">Why ZyncJobs?</h1>
          <p className="text-xl text-green-100">The Platform Built for Tech Professionals and Employers</p>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div className="bg-blue-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">For Job Seekers</h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-3">→</span>
                <div>
                  <h3 className="font-semibold text-gray-900">AI-Powered Recommendations</h3>
                  <p className="text-sm text-gray-600">Get job suggestions tailored to your skills and career goals</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-3">→</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Resume Builder</h3>
                  <p className="text-sm text-gray-600">Create professional resumes with AI assistance</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-3">→</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Skill Assessments</h3>
                  <p className="text-sm text-gray-600">Validate and showcase your technical skills</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-3">→</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Career Guidance</h3>
                  <p className="text-sm text-gray-600">Access expert advice and interview preparation</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 font-bold mr-3">→</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Salary Insights</h3>
                  <p className="text-sm text-gray-600">Know your market value with transparent salary data</p>
                </div>
              </li>
            </ul>
          </div>

          {user?.role !== 'candidate' && (
            <div className="bg-green-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">For Employers</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-3">→</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Smart Candidate Matching</h3>
                    <p className="text-sm text-gray-600">Find the right talent using AI-powered filtering</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-3">→</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Resume Parser</h3>
                    <p className="text-sm text-gray-600">Automatically extract and analyze candidate information</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-3">→</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Hiring Dashboard</h3>
                    <p className="text-sm text-gray-600">Manage applications and track hiring progress</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-3">→</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Salary Benchmarking</h3>
                    <p className="text-sm text-gray-600">Set competitive salaries based on market data</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-3">→</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Dedicated Support</h3>
                    <p className="text-sm text-gray-600">Get expert assistance with your hiring needs</p>
                  </div>
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Key Advantages</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
              <p className="text-gray-600">Active Job Listings</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
              <p className="text-gray-600">Top Tech Companies</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">100K+</div>
              <p className="text-gray-600">Registered Professionals</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What Sets Us Apart</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-600 text-white">
                  ✓
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Technology-First Approach</h3>
                <p className="text-gray-600">Leveraging AI and machine learning for better matches</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-600 text-white">
                  ✓
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Community-Driven</h3>
                <p className="text-gray-600">Built by tech professionals for tech professionals</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-600 text-white">
                  ✓
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Transparent & Fair</h3>
                <p className="text-gray-600">No hidden fees, clear communication, honest feedback</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-600 text-white">
                  ✓
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Continuous Innovation</h3>
                <p className="text-gray-600">Regular updates and new features based on user feedback</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center bg-blue-600 text-white rounded-lg p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8">Join thousands of professionals and companies on ZyncJobs</p>
          <button 
            onClick={() => onNavigate && onNavigate('role-selection')}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Sign Up Now
          </button>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default WhyZyncJobsPage;
