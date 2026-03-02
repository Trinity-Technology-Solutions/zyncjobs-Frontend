import React from 'react';
import { ArrowLeft, Search, Target, Clock, CheckCircle } from 'lucide-react';

interface JobHuntingPageProps {
  onNavigate: (page: string) => void;
}

const JobHuntingPage: React.FC<JobHuntingPageProps> = ({ onNavigate }) => {
  const tips = [
    {
      icon: Search,
      title: "Research Companies",
      description: "Thoroughly research potential employers, their culture, and recent developments."
    },
    {
      icon: Target,
      title: "Target Your Applications",
      description: "Customize your resume and cover letter for each specific job application."
    },
    {
      icon: Clock,
      title: "Stay Organized",
      description: "Keep track of applications, deadlines, and follow-up dates using a spreadsheet."
    },
    {
      icon: CheckCircle,
      title: "Follow Up",
      description: "Send polite follow-up emails 1-2 weeks after submitting your application."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Job Hunting 🧑💻</h1>
          <p className="text-xl text-gray-600">
            Master the art of job hunting with proven strategies and expert tips
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Essential Job Hunting Tips</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {tips.map((tip, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <tip.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{tip.title}</h3>
                  <p className="text-gray-600">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Job Search Strategy</h2>
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-4">
              A successful job hunt requires a strategic approach. Start by defining your career goals and identifying companies that align with your values and aspirations.
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Set clear job search goals and timelines</li>
              <li>Leverage professional networks and LinkedIn</li>
              <li>Use multiple job search platforms</li>
              <li>Prepare for different types of interviews</li>
              <li>Negotiate salary and benefits confidently</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobHuntingPage;