import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import WorkButton from '../components/animata/button/work-button';

interface WhyZyncJobsPageProps {
  onNavigate?: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const WhyZyncJobsPage: React.FC<WhyZyncJobsPageProps> = ({ onNavigate, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-blue-50 via-orange-50 to-blue-100 text-gray-900 py-8 overflow-hidden border-b border-gray-200">
        <div className="absolute top-4 left-4 z-10">
          <BackButton fallback="/" className="bg-white/80 hover:bg-white text-gray-700 border-gray-300 shadow-md" />
        </div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M30 30m-25 0a25 25 0 1 1 50 0a25 25 0 1 1 -50 0'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Why ZyncJobs?</h1>
          <p className="text-base sm:text-lg text-gray-600 mb-6">The Platform Built for Every Job Seeker and Employer</p>
          <div className="max-w-3xl mx-auto bg-white/60 backdrop-blur-sm border border-orange-200 rounded-2xl p-6 shadow-lg">
            <p className="text-lg text-gray-700 leading-relaxed">
              "Smart matching, transparent communication, and real opportunities — for every professional, every field, every ambition."
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* For Job Seekers & Employers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Job Seekers */}
          <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-10 -translate-x-10"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <h2 className="text-2xl font-bold">For Job Seekers</h2>
              </div>
              <ul className="space-y-4">
                {[
                  { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>, title: 'AI-Powered Recommendations', desc: 'Get job suggestions tailored to your skills and career goals' },
                  { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, title: 'Resume Builder', desc: 'Create professional resumes with AI assistance' },
                  { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>, title: 'Skill Assessments', desc: 'Validate and showcase your skills across any domain' },
                  { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>, title: 'Career Guidance', desc: 'Access expert advice and interview preparation' },
                  { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, title: 'Salary Insights', desc: 'Know your market value with transparent salary data' },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">{item.icon}</div>
                    <div>
                      <h3 className="font-semibold text-white">{item.title}</h3>
                      <p className="text-sm text-blue-100">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Employers */}
          {user?.role !== 'candidate' && (
            <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-8 overflow-hidden text-white">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-10 -translate-x-10"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <h2 className="text-2xl font-bold">For Employers</h2>
                </div>
                <ul className="space-y-4">
                  {[
                    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, title: 'Smart Candidate Matching', desc: 'Find the right talent using AI-powered filtering across all fields' },
                    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>, title: 'Resume Parser', desc: 'Automatically extract and analyze candidate information' },
                    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>, title: 'Hiring Dashboard', desc: 'Manage applications and track hiring progress' },
                    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>, title: 'Salary Benchmarking', desc: 'Set competitive salaries based on market data' },
                    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>, title: 'Dedicated Support', desc: 'Get expert assistance with your hiring needs' },
                  ].map((item) => (
                    <li key={item.title} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">{item.icon}</div>
                      <div>
                        <h3 className="font-semibold text-white">{item.title}</h3>
                        <p className="text-sm text-orange-100">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Create Your Profile', desc: 'Sign up as a job seeker or employer and build your profile in minutes with AI assistance.', color: 'blue', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
              { step: '02', title: 'Get Matched Instantly', desc: 'Our AI engine connects the right candidates with the right roles across every industry.', color: 'orange', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
              { step: '03', title: 'Apply or Hire with Ease', desc: 'Candidates apply with one click. Employers review, shortlist, and communicate — all in one place.', color: 'blue', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            ].map((item) => (
              <div key={item.step} className={`relative rounded-2xl p-8 border text-center overflow-hidden ${item.color === 'blue' ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
                <div className={`absolute top-4 right-4 text-5xl font-black opacity-10 ${item.color === 'blue' ? 'text-blue-600' : 'text-orange-500'}`}>{item.step}</div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${item.color === 'blue' ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white'}`}>{item.icon}</div>
                <h3 className={`font-bold text-lg mb-2 ${item.color === 'blue' ? 'text-blue-700' : 'text-orange-600'}`}>{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What Sets Us Apart */}
        <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-2xl p-10 mb-16 border border-orange-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">What Sets Us Apart</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { title: 'People-First Approach', desc: 'Built for every professional, every field, every ambition', color: 'blue', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
              { title: 'Community-Driven', desc: 'Built by professionals, for professionals — across all industries', color: 'orange', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
              { title: 'Transparent & Fair', desc: 'No hidden fees, clear communication, honest feedback', color: 'blue', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
              { title: 'Continuous Innovation', desc: 'Regular updates and new features based on user feedback', color: 'orange', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-6 shadow-sm flex items-start gap-4 border border-gray-100">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color === 'blue' ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white'}`}>{item.icon}</div>
                <div>
                  <h3 className={`font-semibold text-base mb-1 ${item.color === 'blue' ? 'text-blue-700' : 'text-orange-600'}`}>{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8 text-white/90">Join thousands of professionals and companies on ZyncJobs</p>
          <div className="flex justify-center">
            <WorkButton
              text="Sign Up Now"
              onClick={() => onNavigate && onNavigate('candidate-register')}
            />
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default WhyZyncJobsPage;
