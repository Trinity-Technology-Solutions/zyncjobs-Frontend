import React, { useEffect, useRef, useState } from 'react';
import { Brain, Shield, Zap } from 'lucide-react';

interface CareerOpportunityProps {
  onNavigate?: (page: string) => void;
}

const features = [
  {
    icon: Brain,
    title: 'Expert',
    subtitle: 'AI Matching',
    description: 'Advanced algorithms match you with roles that fit your skills and career goals perfectly.',
    gradient: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-100'
  },
  {
    icon: Shield,
    title: 'Verified',
    subtitle: 'Opportunities',
    description: 'All job postings are verified and screened to ensure legitimate, quality opportunities.',
    gradient: 'from-emerald-500 to-green-600',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-100'
  },
  {
    icon: Zap,
    title: 'Instant',
    subtitle: 'Results',
    description: 'Get matched with relevant opportunities instantly and apply with just one click.',
    gradient: 'from-orange-500 to-red-600',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-100'
  }
];

const CareerOpportunity: React.FC<CareerOpportunityProps> = ({ onNavigate }) => {
  const [visible, setVisible] = useState<boolean[]>([false, false, false]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observers = cardRefs.current.map((ref, i) => {
      if (!ref) return null;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => setVisible(v => { const n = [...v]; n[i] = true; return n; }), i * 150);
          } else {
            setVisible(v => { const n = [...v]; n[i] = false; return n; });
          }
        },
        { threshold: 0.2 }
      );
      obs.observe(ref);
      return obs;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-gray-50 to-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-4">
            Discover Your Next{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
              Career Opportunity
            </span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg leading-relaxed px-4">
            Smart job matching powered by AI to connect you with the perfect role faster.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            
            return (
              <div
                key={feature.title}
                ref={el => { cardRefs.current[index] = el; }}
                className={`group relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-xl border ${feature.borderColor} transition-all duration-500 transform ${
                  visible[index] 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Background Glow Effect */}
                <div className={`absolute inset-0 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500 bg-gradient-to-r ${feature.gradient}`} />
                
                {/* Icon */}
                <div className={`relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-2xl sm:rounded-3xl text-white bg-gradient-to-r ${feature.gradient} mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 mx-auto`}>
                  <Icon className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>

                {/* Content */}
                <div className="text-center">
                  {/* Title */}
                  <div className="mb-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                      {feature.title}
                    </h3>
                    <h4 className={`text-lg sm:text-xl font-semibold ${feature.textColor} leading-tight`}>
                      {feature.subtitle}
                    </h4>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Bottom Accent */}
                <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 rounded-full bg-gradient-to-r ${feature.gradient} scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12 sm:mt-16">
          <button
            onClick={() => onNavigate?.('job-listings')}
            className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-xl sm:rounded-2xl hover:from-blue-700 hover:to-violet-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
          >
            Start Your Journey
            <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>

      </div>
    </section>
  );
};

export default CareerOpportunity;