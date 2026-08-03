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
        } else {
          // Reset animation when leaving viewport
          setIsVisible(false);
        }
      },
      { threshold: 0.2 }
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
    <section ref={sectionRef} className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        
        {/* LEFT CONTENT */}
        <div 
          className={`space-y-8 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20'
          }`}
        >
          
          <h2 className="text-4xl md:text-5xl font-semibold leading-tight text-gray-900">
            Discover Your Next Career Opportunity
          </h2>

          <p className="text-gray-500 text-lg max-w-md">
            Smart job matching powered by AI to connect you with the perfect role faster.
          </p>

          {/* Stats - Quality focused */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-lg">
            <div className="text-center sm:text-left">
              <h3 className="text-2xl sm:text-3xl font-semibold text-gray-900">Expert</h3>
              <p className="text-sm text-gray-500 mt-1">AI Matching</p>
            </div>

            <div className="text-center sm:text-left">
              <h3 className="text-2xl sm:text-3xl font-semibold text-gray-900">Verified</h3>
              <p className="text-sm text-gray-500 mt-1">Opportunities</p>
            </div>

            <div className="text-center sm:text-left">
              <h3 className="text-2xl sm:text-3xl font-semibold text-gray-900">Instant</h3>
              <p className="text-sm text-gray-500 mt-1">Results</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4">
            <button 
              onClick={() => { window.scrollTo(0, 0); onNavigate && onNavigate('role-selection'); }}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              Get Started
              <TrendingUp className="w-5 h-5" />
            </button>
            <button 
              onClick={() => { window.scrollTo(0, 0); onNavigate && onNavigate('job-listings'); }}
              className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300"
            >
              Browse Jobs
            </button>
          </div>
        </div>

        {/* RIGHT IMAGE */}
        <div 
          className={`relative transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'
          }`}
        >
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt="Team collaboration and success"
            className="w-full h-[500px] object-cover rounded-2xl shadow-2xl"
          />
        </div>

      </div>

      {/* Company Logos Section */}
      <div className="max-w-7xl mx-auto px-6 mt-20">
        <p className="text-center text-gray-400 text-sm font-medium mb-8">Trusted by top companies</p>
        <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
          {[
            { name: 'Birlasoft', logo: 'https://www.google.com/s2/favicons?domain=birlasoft.com&sz=64' },
            { name: 'Persistent', logo: '/images/company-logos/persistent-favicon.svg' },
            { name: 'LTIMindtree', logo: 'https://www.google.com/s2/favicons?domain=ltm.com&sz=64' },
            { name: 'Saksoft', logo: 'https://www.google.com/s2/favicons?domain=saksoft.com&sz=64' },
            { name: 'L&T', logo: '/images/company-logos/lt-logo.png' },
            { name: 'Cognizant', logo: 'https://www.google.com/s2/favicons?domain=cognizant.com&sz=64' },
            { name: 'Accenture', logo: 'https://www.google.com/s2/favicons?domain=accenture.com&sz=64' },
          ].map((company, index) => (
            <img
              key={index}
              src={company.logo}
              alt={company.name}
              className="h-10 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TalentedPeople;

