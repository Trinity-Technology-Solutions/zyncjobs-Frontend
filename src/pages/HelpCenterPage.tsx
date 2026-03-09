import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ChevronDown, Search } from 'lucide-react';

interface HelpCenterPageProps {
  onNavigate?: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const HelpCenterPage: React.FC<HelpCenterPageProps> = ({ onNavigate, user, onLogout }) => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const faqs = [
    {
      category: 'Getting Started',
      items: [
        { q: 'How do I create an account?', a: 'Click Register, choose your role (Job Seeker or Employer), and fill in your details.' },
        { q: 'Is ZyncJobs free?', a: 'Job seekers can use ZyncJobs for free. Employers have flexible pricing plans.' },
        { q: 'How do I reset my password?', a: 'Click "Forgot Password" on the login page and follow the email instructions.' }
      ]
    },
    {
      category: 'For Job Seekers',
      items: [
        { q: 'How do I search for jobs?', a: 'Use the Job Search feature to filter by location, skills, and job title.' },
        { q: 'How do I apply for a job?', a: 'Click on a job listing and click "Apply". You can use your resume or create one on the platform.' },
        { q: 'Can I save jobs for later?', a: 'Yes, click the bookmark icon on any job to save it to your profile.' },
        { q: 'How do I build a resume?', a: 'Use our AI Resume Builder or choose from professional templates.' }
      ]
    },
    {
      category: 'For Employers',
      items: [
        { q: 'How do I post a job?', a: 'Go to Job Posting and fill in the job details. Our AI will help optimize your listing.' },
        { q: 'How do I find candidates?', a: 'Use the Candidate Search feature with filters for skills, experience, and location.' },
        { q: 'What is the Resume Parser?', a: 'It automatically extracts key information from resumes to help you review candidates faster.' },
        { q: 'How do I manage applications?', a: 'Use your Hiring Dashboard to track, review, and communicate with applicants.' }
      ]
    },
    {
      category: 'Features & Tools',
      items: [
        { q: 'What are Skill Assessments?', a: 'Tests that validate technical skills and help employers verify candidate abilities.' },
        { q: 'How does Salary Benchmarking work?', a: 'Compare salaries for similar roles in your location based on market data.' },
        { q: 'What is the Career Coach Agent?', a: 'An AI-powered tool that provides personalized career advice and guidance.' },
        { q: 'Can I schedule interviews on ZyncJobs?', a: 'Yes, use the Interview Scheduling feature to coordinate with candidates.' }
      ]
    },
    {
      category: 'Account & Privacy',
      items: [
        { q: 'How do I update my profile?', a: 'Go to Settings and click "Edit Profile" to update your information.' },
        { q: 'Is my data secure?', a: 'Yes, we use industry-standard encryption and security measures to protect your data.' },
        { q: 'Can I delete my account?', a: 'Yes, go to Settings and select "Delete Account". This action is permanent.' },
        { q: 'How do I control my privacy settings?', a: 'Visit Settings to manage who can see your profile and contact information.' }
      ]
    }
  ];

  const filteredFaqs = faqs.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">Help Center</h1>
          <p className="text-xl text-indigo-100">Find answers to common questions</p>
        </div>
      </div>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">


        <div className="mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
        </div>

        <div className="space-y-8">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{category.category}</h2>
                <div className="space-y-3">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === `${categoryIndex}-${itemIndex}` ? null : `${categoryIndex}-${itemIndex}`)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-left font-semibold text-gray-900">{item.q}</span>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-500 transition-transform ${
                            expandedFaq === `${categoryIndex}-${itemIndex}` ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {expandedFaq === `${categoryIndex}-${itemIndex}` && (
                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                          <p className="text-gray-600">{item.a}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No results found for "{searchTerm}"</p>
            </div>
          )}
        </div>

        <div className="mt-16 bg-blue-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Still need help?</h2>
          <p className="text-gray-600 mb-6">Can't find what you're looking for? Contact our support team.</p>
          <button 
            onClick={() => onNavigate && onNavigate('contact')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Contact Support
          </button>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default HelpCenterPage;
