import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp } from 'lucide-react';

interface TalentedPeopleProps {
  onNavigate?: (page: string, data?: any) => void;
}

const TalentedPeople: React.FC<TalentedPeopleProps> = ({ onNavigate }) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for scroll animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Trigger animation when entering viewport
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (sectionRef.current) {
            observer.unobserve(sectionRef.current);
          }
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="pt-10 sm:pt-12 lg:pt-14 pb-0 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8 lg:gap-10 items-center">
        
        {/* LEFT CONTENT */}
        <div 
          className={`space-y-4 sm:space-y-5 lg:space-y-6 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12 sm:-translate-x-20'
          }`}
        >
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-blue-600 mb-2">Smarter Way to Get Hired</p>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
            Discover Your Next <span className="text-orange-500">Career Opportunity</span>
          </h2>

          <p className="text-gray-600 text-sm sm:text-base lg:text-lg max-w-md leading-relaxed">
            Smart job matching powered by AI to connect you with the perfect role faster.
          </p>

          {/* Stats - Quality focused */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 max-w-lg">
            <div className="bg-gray-50/70 border border-gray-200 rounded-lg p-3 sm:p-3.5 text-left">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">Expert</h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">AI Matching</p>
            </div>

            <div className="bg-gray-50/70 border border-gray-200 rounded-lg p-3 sm:p-3.5 text-left">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">Verified</h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Opportunities</p>
            </div>

            <div className="bg-gray-50/70 border border-gray-200 rounded-lg p-3 sm:p-3.5 text-left">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">Instant</h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Results</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button 
              onClick={() => { window.scrollTo(0, 0); onNavigate && onNavigate('role-selection'); }}
              className="bg-blue-600 text-white px-6 sm:px-7 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-2xs flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto cursor-pointer"
            >
              <span>Get Started</span>
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button 
              onClick={() => { window.scrollTo(0, 0); onNavigate && onNavigate('job-listings'); }}
              className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 sm:px-7 py-3 rounded-lg font-medium transition-colors text-center text-sm sm:text-base w-full sm:w-auto cursor-pointer"
            >
              Browse Jobs
            </button>
          </div>
        </div>

        {/* RIGHT IMAGE */}
        <div 
          className={`relative transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12 sm:translate-x-20'
          }`}
        >
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt="Team collaboration and success"
            className="w-full h-56 sm:h-80 md:h-[400px] lg:h-[480px] object-cover rounded-xl border border-gray-200 shadow-sm"
          />
        </div>

      </div>

      {/* Company Logos Section / Lightweight Divider Bar */}
      <div className="w-full bg-white border-y border-slate-100 mt-10 sm:mt-12 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-center text-xs font-semibold text-slate-400 tracking-[0.2em] uppercase mb-4 sm:mb-6">
            Trusted by top companies
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-10 md:gap-14 lg:gap-16">
            {[
              { name: 'Birlasoft', logo: 'https://img.logo.dev/birlasoft.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=100' },
              { name: 'Persistent', logo: 'https://img.logo.dev/persistent.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=100' },
              { name: 'LTIMindtree', logo: 'https://img.logo.dev/ltimindtree.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=100' },
              { name: 'Saksoft', logo: 'https://img.logo.dev/saksoft.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=100' },
              { name: 'L&T', logo: 'https://img.logo.dev/larsentoubro.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=100' },
              { name: 'Cognizant', logo: 'https://img.logo.dev/cognizant.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=100' },
              { name: 'Accenture', logo: 'https://img.logo.dev/accenture.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=100' },
            ].map((company, index) => (
              <img
                key={index}
                src={company.logo}
                alt={company.name}
                className="h-9 sm:h-10 lg:h-11 max-w-[140px] sm:max-w-[160px] w-auto object-contain hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TalentedPeople;
