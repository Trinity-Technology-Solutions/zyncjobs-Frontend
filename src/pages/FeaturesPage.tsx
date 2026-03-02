import React from 'react';
import { CheckCircle, Clock, Smartphone, Brain, Calendar, Filter } from 'lucide-react';

interface FeaturesPageProps {
  onNavigate: (page: string) => void;
  user: any;
  onLogout: () => void;
}

const FeaturesPage: React.FC<FeaturesPageProps> = ({ onNavigate, user, onLogout }) => {
  const features = [
    {
      title: 'Advanced Search Filters',
      description: 'Smart job recommendations, location-based radius search, company size filters, industry-specific filters, freshness filters, and trending jobs.',
      icon: <Filter className="w-8 h-8 text-blue-600" />,
      status: 'implemented',
      action: () => onNavigate('job-listings')
    },
    {
      title: 'Skill Assessments',
      description: 'Take skill assessments in JavaScript, Python, React and more. Get scored results and showcase your expertise to employers.',
      icon: <Brain className="w-8 h-8 text-green-600" />,
      status: 'implemented',
      action: () => onNavigate('skill-assessments')
    },
    {
      title: 'Interview Scheduling',
      description: 'Schedule, confirm, reschedule interviews with candidates. Support for video calls, phone calls, and in-person meetings.',
      icon: <Calendar className="w-8 h-8 text-purple-600" />,
      status: 'implemented',
      action: () => onNavigate('interviews')
    },
    {
      title: 'Mobile Optimization',
      description: 'Fully responsive design with mobile-first approach, touch-friendly interface, and bottom navigation for mobile devices.',
      icon: <Smartphone className="w-8 h-8 text-orange-600" />,
      status: 'implemented',
      action: () => window.alert('Mobile optimization is active! Try resizing your browser or viewing on mobile.')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trinity Jobs Features</h1>
              <p className="text-gray-600 mt-2">Medium Priority Features Implementation</p>
            </div>
            <button
              onClick={() => onNavigate('home')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  {feature.icon}
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                    <div className="flex items-center mt-1">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm text-green-600 font-medium">Implemented</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">{feature.description}</p>
              
              <button
                onClick={feature.action}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Feature
              </button>
            </div>
          ))}
        </div>

        {/* Implementation Summary */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Implementation Summary</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Backend Implementation</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• SkillAssessment model with questions and scoring</li>
                <li>• Interview model with scheduling and status tracking</li>
                <li>• API routes for assessments and interview management</li>
                <li>• Real-time notifications for interview updates</li>
                <li>• Advanced search service with geospatial queries</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Frontend Implementation</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• React components for skill assessments</li>
                <li>• Interview scheduling interface with calendar</li>
                <li>• Mobile-responsive CSS with touch optimization</li>
                <li>• Bottom navigation for mobile devices</li>
                <li>• Advanced search filters with location radius</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <h4 className="font-semibold text-green-900">All Medium Priority Features Completed</h4>
                <p className="text-green-700 text-sm">4 out of 4 features successfully implemented and ready for use.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;