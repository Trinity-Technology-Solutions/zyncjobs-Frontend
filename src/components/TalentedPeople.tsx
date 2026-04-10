import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';

interface TalentedPeopleProps {
  onNavigate?: (page: string, data?: any) => void;
}

const TalentedPeople: React.FC<TalentedPeopleProps> = ({ onNavigate }) => {
  // Animated counter for stats
  const [counts, setCounts] = useState({ candidates: 0, accuracy: 0 });

  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const interval = duration / steps;
    
    const targets = { candidates: 10000, accuracy: 95 };
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      
      setCounts({
        candidates: Math.floor(targets.candidates * progress),
        accuracy: Math.floor(targets.accuracy * progress)
      });

      if (step >= steps) {
        clearInterval(timer);
        setCounts(targets);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K+`;
    return `${num}+`;
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        
        {/* LEFT CONTENT */}
        <div className="space-y-8">
          
          <h2 className="text-4xl md:text-5xl font-semibold leading-tight text-gray-900">
            Join 10,000+ Professionals Finding Jobs Smarter
          </h2>

          <p className="text-gray-500 text-lg max-w-md">
            AI-powered job matching to help you find the right opportunities faster.
          </p>

          {/* Stats - Minimal */}
          <div className="flex gap-12">
            <div>
              <h3 className="text-3xl font-semibold text-gray-900">{formatNumber(counts.candidates)}</h3>
              <p className="text-sm text-gray-500 mt-1">Candidates</p>
            </div>

            <div>
              <h3 className="text-3xl font-semibold text-gray-900">{counts.accuracy}%</h3>
              <p className="text-sm text-gray-500 mt-1">Match Accuracy</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4">
            <button 
              onClick={() => onNavigate && onNavigate('role-selection')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              Get Started
              <TrendingUp className="w-5 h-5" />
            </button>
            <button 
              onClick={() => onNavigate && onNavigate('job-listings')}
              className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300"
            >
              Browse Jobs
            </button>
          </div>
        </div>

        {/* RIGHT IMAGE */}
        <div className="relative">
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
            { name: 'Birlasoft', logo: 'https://img.logo.dev/birlasoft.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
            { name: 'Persistent', logo: 'https://img.logo.dev/persistent.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
            { name: 'LTIMindtree', logo: 'https://img.logo.dev/ltimindtree.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
            { name: 'Saksoft', logo: 'https://img.logo.dev/saksoft.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
            { name: 'L&T', logo: 'https://img.logo.dev/larsentoubro.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
            { name: 'Cognizant', logo: 'https://img.logo.dev/cognizant.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
            { name: 'Accenture', logo: 'https://img.logo.dev/accenture.com?token=pk_cY8JBeWnQR6g5m_ymQhBoQ&size=80' },
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
