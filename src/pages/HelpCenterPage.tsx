import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import AutocompleteCombobox from '../components/AutocompleteCombobox';
import { ChevronDown } from 'lucide-react';

interface HelpCenterPageProps {
  onNavigate?: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'Getting Started': <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  'For Job Seekers': <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  'For Employers': <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  'Features & Tools': <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  'Account & Privacy': <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
};

const categoryColors = ['blue', 'orange', 'blue', 'orange', 'blue'];

const HelpCenterPage: React.FC<HelpCenterPageProps> = ({ onNavigate, user, onLogout }) => {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
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

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-blue-50 via-orange-50 to-blue-100 text-gray-900 py-8 overflow-hidden border-b border-gray-200">
        <div className="absolute top-4 left-4 z-10">
          <BackButton onClick={() => onNavigate && onNavigate('home')} className="bg-white/80 hover:bg-white text-gray-700 border-gray-300 shadow-md" />
        </div>
        <div className="absolute top-10 left-10 w-24 h-24 bg-blue-200/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-orange-200/30 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 left-1/3 w-20 h-20 bg-orange-100/40 rounded-full blur-lg animate-pulse delay-500"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-orange-200 shadow-lg bg-white flex items-center justify-center">
              <img src="/favicon_io/android-chrome-192x192.png" alt="ZyncJobs" className="w-12 h-12 object-contain" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Help Center</h1>
          <p className="text-base sm:text-lg text-gray-600 mb-6">Find answers to common questions</p>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <AutocompleteCombobox
              value={searchTerm}
              onChange={setSearchTerm}
              options={[]}
              allowCustom
              placeholder="Search help articles..."
            />
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Category quick-nav pills */}
        {!searchTerm && (
          <div className="flex flex-wrap gap-2 mb-10 justify-center">
            {faqs.map((cat, i) => (
              <button
                key={cat.category}
                onClick={() => {
                  const el = document.getElementById(`cat-${i}`);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  categoryColors[i] === 'blue'
                    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                }`}
              >
                {categoryIcons[cat.category]}
                {cat.category}
              </button>
            ))}
          </div>
        )}

        {/* FAQ Sections */}
        <div className="space-y-10">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((category, categoryIndex) => {
              const origIndex = faqs.findIndex(f => f.category === category.category);
              const color = categoryColors[origIndex] ?? 'blue';
              return (
                <div key={categoryIndex} id={`cat-${origIndex}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color === 'blue' ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white'}`}>
                      {categoryIcons[category.category]}
                    </div>
                    <h2 className={`text-xl font-bold ${color === 'blue' ? 'text-blue-700' : 'text-orange-600'}`}>{category.category}</h2>
                  </div>
                  <div className="space-y-2">
                    {category.items.map((item, itemIndex) => {
                      const key = `${categoryIndex}-${itemIndex}`;
                      const isOpen = expandedFaq === key;
                      return (
                        <div
                          key={itemIndex}
                          className={`rounded-xl border transition-all ${
                            isOpen
                              ? color === 'blue' ? 'border-blue-300 bg-blue-50' : 'border-orange-300 bg-orange-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <button
                            onClick={() => setExpandedFaq(isOpen ? null : key)}
                            className="w-full flex items-center justify-between p-4 text-left"
                          >
                            <span className={`font-semibold text-sm ${isOpen ? (color === 'blue' ? 'text-blue-700' : 'text-orange-600') : 'text-gray-900'}`}>{item.q}</span>
                            <ChevronDown className={`w-5 h-5 flex-shrink-0 ml-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${isOpen ? (color === 'blue' ? 'text-blue-600' : 'text-orange-500') : 'text-gray-400'}`} />
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4">
                              <p className="text-gray-600 text-sm leading-relaxed">{item.a}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg font-medium">No results found</p>
              <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
            </div>
          )}
        </div>

        {/* Still need help */}
        <div className="mt-16 relative bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl p-10 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <h2 className="text-xl font-bold">Still need help?</h2>
              </div>
              <p className="text-white/80 text-sm">Can't find what you're looking for? Our support team is ready.</p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('contact')}
              className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex-shrink-0"
            >
              Contact Support
            </button>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} user={user} />
    </div>
  );
};

export default HelpCenterPage;
