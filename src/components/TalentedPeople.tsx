import React, { useState, useEffect, useRef } from 'react';
import { Bot, BadgeCheck, Zap, Sparkles } from 'lucide-react';
import GetStartedButton from './animata/button/get-started-button';
import WorkButton from './animata/button/work-button';

interface TalentedPeopleProps {
  onNavigate?: (page: string, data?: any) => void;
}

const STATS = [
  { Icon: Bot, label: 'Expert', sub: 'AI Matching', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
  { Icon: BadgeCheck, label: 'Verified', sub: 'Opportunities', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  { Icon: Zap, label: 'Instant', sub: 'Results', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
];

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
    <section ref={sectionRef} className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">

        {/* LEFT CONTENT */}
        <div
          className={`space-y-8 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20'
          }`}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest border border-blue-100">
            <Sparkles className="w-3.5 h-3.5" /> AI-Powered Matching
          </span>

          <h2 className="text-4xl md:text-5xl font-semibold leading-tight text-gray-900">
            Discover Your Next{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-violet-600 to-orange-500">
              Career Opportunity
            </span>
          </h2>

          <p className="text-gray-500 text-lg max-w-md">
            Smart job matching powered by AI to connect you with the perfect role faster.
          </p>

          {/* Stats - Quality focused */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg">
            {STATS.map(({ Icon, label, sub, color, bg, border }) => (
              <div
                key={label}
                className={`rounded-2xl border ${border} ${bg} p-4 text-center sm:text-left transition-all duration-300 hover:shadow-md hover:-translate-y-1`}
              >
                <span className={`inline-flex w-10 h-10 rounded-xl ${bg} border ${border} items-center justify-center mb-2`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </span>
                <h3 className="text-xl font-semibold text-gray-900 leading-tight">{label}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4">
            <GetStartedButton
              text="Get Started"
              onClick={() => { window.scrollTo(0, 0); onNavigate && onNavigate('candidate-register'); }}
            />
            <WorkButton
              text="Browse Jobs"
              size="md"
              onClick={() => { window.scrollTo(0, 0); onNavigate && onNavigate('job-listings'); }}
            />
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