import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FileText, CheckCircle, AlertCircle, Lightbulb, ArrowLeft } from 'lucide-react';

interface ResumeHelpPageProps {
  onNavigate?: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const ResumeHelpPage: React.FC<ResumeHelpPageProps> = ({ onNavigate, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('tips');

  const resumeTips = [
    {
      title: 'Keep It Concise',
      description: 'Limit your resume to 1-2 pages. Recruiters spend only 6-7 seconds reviewing each resume.',
      icon: '📄'
    },
    {
      title: 'Use Clear Formatting',
      description: 'Use consistent fonts, proper spacing, and bullet points. Make it easy to scan.',
      icon: '✨'
    },
    {
      title: 'Highlight Achievements',
      description: 'Focus on accomplishments and results, not just job duties. Use metrics and numbers.',
      icon: '🎯'
    },
    {
      title: 'Tailor for Each Job',
      description: 'Customize your resume for each position. Match keywords from the job description.',
      icon: '🎨'
    },
    {
      title: 'Include Relevant Skills',
      description: 'List technical and soft skills that match the job requirements.',
      icon: '💡'
    },
    {
      title: 'Add Contact Information',
      description: 'Include email, phone number, LinkedIn profile, and location.',
      icon: '📞'
    }
  ];

  const dosDonts = [
    {
      category: 'DO',
      items: [
        'Use action verbs (Led, Developed, Managed, Implemented)',
        'Include quantifiable results (Increased sales by 25%)',
        'Use industry-specific keywords',
        'Proofread multiple times for errors',
        'Use professional email address',
        'Include relevant certifications'
      ],
      color: 'green'
    },
    {
      category: "DON'T",
      items: [
        'Use personal pronouns (I, me, we)',
        'Include irrelevant information',
        'Use unprofessional email addresses',
        'Exceed 2 pages (unless required)',
        'Use fancy fonts or colors',
        'Include salary expectations'
      ],
      color: 'red'
    }
  ];

  const sections = [
    {
      title: 'Contact Information',
      content: 'Place at the top. Include: Full name, Phone number, Email address, City/State, LinkedIn URL (optional)'
    },
    {
      title: 'Professional Summary',
      content: '2-3 lines highlighting your key qualifications and career goals. Tailor it to the job you\'re applying for.'
    },
    {
      title: 'Work Experience',
      content: 'List in reverse chronological order. Include: Company name, Job title, Dates, 3-5 bullet points with achievements'
    },
    {
      title: 'Education',
      content: 'Include: School name, Degree, Field of study, Graduation date, GPA (if 3.5 or higher), Relevant coursework'
    },
    {
      title: 'Skills',
      content: 'List relevant technical and soft skills. Organize by category if needed. Include proficiency levels if applicable.'
    },
    {
      title: 'Certifications & Awards',
      content: 'Include relevant certifications, licenses, and professional awards that strengthen your candidacy.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => onNavigate && onNavigate('resume-studio')}
            className="flex items-center gap-2 text-blue-200 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Resume Studio
          </button>
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4">Resume Tips &amp; Guide</h1>
            <p className="text-xl text-blue-100">Master the art of creating a compelling resume that gets noticed</p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-12 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('tips')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'tips'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Resume Tips
          </button>
          <button
            onClick={() => setActiveTab('sections')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'sections'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Resume Sections
          </button>
          <button
            onClick={() => setActiveTab('dosdont')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'dosdont'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Do's & Don'ts
          </button>
        </div>

        {/* Tips Tab */}
        {activeTab === 'tips' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumeTips.map((tip, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="text-4xl mb-4">{tip.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{tip.title}</h3>
                  <p className="text-gray-600">{tip.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg mt-8">
              <div className="flex items-start gap-4">
                <Lightbulb className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Pro Tip</h3>
                  <p className="text-gray-700">
                    Use our AI Resume Builder to automatically optimize your resume with industry keywords and formatting. 
                    It analyzes job descriptions and suggests improvements to increase your chances of getting noticed.
                  </p>
                  <button
                    onClick={() => onNavigate && onNavigate('resume-builder')}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Try AI Resume Builder
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sections Tab */}
        {activeTab === 'sections' && (
          <div className="space-y-6">
            {sections.map((section, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h3>
                    <p className="text-gray-600">{section.content}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Resume Checklist
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'No spelling or grammar errors',
                  'Consistent formatting throughout',
                  'Contact information is current',
                  'Dates are accurate and complete',
                  'Action verbs used in descriptions',
                  'Quantifiable achievements included',
                  'Tailored to job description',
                  'Professional appearance'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Do's & Don'ts Tab */}
        {activeTab === 'dosdont' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {dosDonts.map((section, index) => (
              <div key={index} className={`border-l-4 ${section.color === 'green' ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'} rounded-r-lg p-6`}>
                <h3 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${section.color === 'green' ? 'text-green-900' : 'text-red-900'}`}>
                  {section.color === 'green' ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <AlertCircle className="w-6 h-6" />
                  )}
                  {section.category}
                </h3>
                <ul className="space-y-3">
                  {section.items.map((item, idx) => (
                    <li key={idx} className={`flex items-start gap-3 ${section.color === 'green' ? 'text-green-900' : 'text-red-900'}`}>
                      <span className={`font-bold mt-1 ${section.color === 'green' ? 'text-green-600' : 'text-red-600'}`}>
                        {section.color === 'green' ? '✓' : '✗'}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Build Your Perfect Resume?</h2>
          <p className="text-lg text-blue-100 mb-8">
            Use our AI-powered resume builder to create a professional resume in minutes
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => onNavigate && onNavigate('resume-builder')}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Build Resume
            </button>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} user={user} />
    </div>
  );
};

export default ResumeHelpPage;
