import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import GetStartedButton from '../components/animata/button/get-started-button';

interface AboutPageProps {
  onNavigate?: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onNavigate, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <div className="relative bg-gradient-to-br from-blue-50 via-orange-50 to-blue-100 text-gray-900 py-8 overflow-hidden border-b border-gray-200">
        {/* Back Button */}
        <div className="absolute top-4 left-4 z-10">
          <BackButton fallback="/" className="bg-white/80 hover:bg-white text-gray-700 border-gray-300 shadow-md" />
        </div>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M30 30m-25 0a25 25 0 1 1 50 0a25 25 0 1 1 -50 0'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-24 h-24 bg-blue-200/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-orange-200/30 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 left-1/3 w-20 h-20 bg-orange-100/40 rounded-full blur-lg animate-pulse delay-500"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Company Logo/Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-orange-200 shadow-lg bg-white flex items-center justify-center">
              <img src="/favicon_io/android-chrome-192x192.png" alt="ZyncJobs" className="w-12 h-12 object-contain" />
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 text-gray-900">About ZyncJobs</h1>
          <p className="text-base sm:text-lg text-gray-600 mb-6">Connecting Talent with Opportunity — Across Every Industry</p>
          
          {/* Mission Statement */}
          <div className="max-w-3xl mx-auto bg-white/60 backdrop-blur-sm border border-orange-200 rounded-2xl p-6 shadow-lg">
            <p className="text-lg text-gray-700 leading-relaxed">
              "Making job search and hiring seamless, transparent, and rewarding — for every candidate and every employer, in every field."
            </p>
          </div>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Mission & Vision Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {/* Mission Card */}
          <div className="group relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-10 -translate-x-10"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h2 className="text-2xl font-bold">Our Mission</h2>
              </div>
              <p className="text-blue-100 leading-relaxed mb-4">
                ZyncJobs was built with one belief: finding the right job — or the right person — should never feel like a struggle.
              </p>
              <p className="text-blue-100 leading-relaxed mb-4">
                We connect talented professionals across every industry with employers who need them. Whether you are in technology, healthcare, finance, education, manufacturing, retail, or beyond — ZyncJobs works for you.
              </p>
              <p className="text-blue-100 leading-relaxed">
                We use smart matching and transparent communication so candidates find roles they genuinely fit, and employers find people they genuinely want to hire.
              </p>
            </div>
          </div>

          {/* Vision Card */}
          <div className="group relative bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-8 overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-10 -translate-x-10"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </div>
                <h2 className="text-2xl font-bold">Our Vision</h2>
              </div>
              <p className="text-orange-100 leading-relaxed mb-4">
                We are building a platform where no opportunity goes unfilled and no talent goes unnoticed — regardless of background, industry, or location.
              </p>
              <p className="text-orange-100 leading-relaxed mb-4">
                We envision a world where the hiring process is simple, human, and fair for everyone involved.
              </p>
              <p className="text-orange-100 leading-relaxed">
                We are a startup with big ambitions, and we grow better every single day — because we have to earn your trust. We are early in our journey — and that is our advantage. We are hungry, fast, and built around your needs.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-2xl p-10 mb-20 border border-orange-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100 text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-blue-700 mb-3">Transparency</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Honest communication, clear expectations, and no hidden surprises — for candidates and employers alike.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-orange-100 text-center">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-orange-600 mb-3">Inclusivity</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Every industry, every background, every career stage. ZyncJobs is for everyone — not just tech professionals.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100 text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-blue-700 mb-3">Innovation</h3>
              <p className="text-gray-600 text-sm leading-relaxed">We are a tech-first platform, constantly improving. Better matching, smarter tools, and a smoother experience — every week.</p>
            </div>
          </div>
        </div>

        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-10">Why Choose ZyncJobs?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {([
              { icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>, title: 'Smart Matching', desc: 'Smart job matching across all industries — not just tech', color: 'blue' },
              { icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, title: 'Fast Hiring', desc: 'Employers post requirements and get matched candidates — fast', color: 'orange' },
              { icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>, title: 'Growing Daily', desc: 'Hundreds of active openings across domains — and growing', color: 'blue' },
              { icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, title: 'Resume Tools', desc: 'Resume tools and career resources to help you stand out', color: 'orange' },
              { icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" /></svg>, title: 'Clean UX', desc: 'Simple, clean experience — no clutter, no confusion', color: 'blue' },
              { icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, title: 'Salary Insights', desc: 'Transparent salary data so candidates and employers align from day one', color: 'orange' },
            ] as { icon: React.ReactNode; title: string; desc: string; color: string }[]).map((item, i) => (
              <div key={i} className={`bg-white rounded-xl p-6 shadow-sm border ${
                item.color === 'blue' ? 'border-blue-100 hover:border-blue-300' : 'border-orange-100 hover:border-orange-300'
              } transition-all hover:shadow-md`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  item.color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-500'
                }`}>{item.icon}</div>
                <h3 className={`font-semibold text-base mb-2 ${
                  item.color === 'blue' ? 'text-blue-700' : 'text-orange-600'
                }`}>{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-lg p-6 sm:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Your next great opportunity starts here</h2>
          <p className="text-white/90 mb-8 text-lg max-w-2xl mx-auto">
            Whether you are a job seeker ready for your next move or an employer looking for the right person — ZyncJobs makes it simple, seamless, and worth your time.
          </p>
          <div className="flex justify-center">
            <GetStartedButton
              text="Get Started Today"
              onClick={() => onNavigate && onNavigate('candidate-register')}
            />
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} user={user} />
    </div>
  );
};

export default AboutPage;
