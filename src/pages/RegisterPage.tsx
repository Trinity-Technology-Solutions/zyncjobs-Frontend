import React from 'react';
import { ArrowLeft, User, Building, ArrowRight } from 'lucide-react';

const RegisterPage = ({ onNavigate }: { onNavigate?: (page: string) => void }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Join Trinitejob
          </h1>
          <p className="text-xl text-gray-600">
            Choose your path to get started
          </p>
        </div>

        {/* Cards Container */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Tech Professionals Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Tech Professionals
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Find your dream job, connect with top companies, and advance your tech career with personalized recommendations.
            </p>
            <button 
              onClick={() => onNavigate && onNavigate('candidate-register')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Create free profile</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Employers & Recruiters Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <Building className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Employers & Recruiters
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Post jobs, find qualified candidates, and build your dream team with our powerful recruiting tools and insights.
            </p>
            <button 
              onClick={() => onNavigate && onNavigate('employer-register')}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Post a job</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <button 
            onClick={() => onNavigate && onNavigate('home')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;