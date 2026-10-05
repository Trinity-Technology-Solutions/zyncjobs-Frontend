import React from 'react';

interface CallToActionProps {
  onNavigate?: (page: string, data?: any) => void;
}

const CallToAction: React.FC<CallToActionProps> = ({ onNavigate }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const sectionRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
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
    <section 
      ref={sectionRef}
      className="pt-8 sm:pt-10 lg:pt-12 pb-12 sm:pb-16 lg:pb-20 bg-white text-gray-900 text-center relative overflow-hidden"
    >
      {/* Background Decoratives - Subtle Atmospheric Glows matching Hero */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute left-[15%] top-[20%] w-[350px] h-[350px] bg-blue-50/50 rounded-full blur-[100px]" />
        <div className="absolute right-[15%] bottom-[10%] w-[300px] h-[300px] bg-orange-50/40 rounded-full blur-[90px]" />
      </div>

      <div className={`max-w-3xl mx-auto px-4 sm:px-6 relative z-10 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        
        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-3 sm:mb-4 tracking-tight text-gray-900">
          Find Your Next Opportunity <span className="text-orange-500">Faster</span>
        </h2>

        {/* Subtext */}
        <p className="text-gray-600 text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
          Join thousands of professionals using AI-powered job matching to land better roles.
        </p>

        {/* Buttons */}
        <div className={`mt-2 sm:mt-3 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 max-w-xs sm:max-w-none mx-auto transition-all duration-1000 delay-300 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          
          {/* Primary Button */}
          <button 
            onClick={() => onNavigate && onNavigate('role-selection')}
            className="bg-blue-600 text-white px-7 sm:px-9 py-3.5 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 transform w-full sm:w-auto"
          >
            Get Started
          </button>

          {/* Secondary Button */}
          <button 
            onClick={() => onNavigate && onNavigate('job-listings')}
            className="border-2 border-slate-200 text-slate-700 bg-white px-7 sm:px-9 py-3.5 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all duration-300 w-full sm:w-auto shadow-xs"
          >
            Browse Jobs
          </button>

        </div>

        {/* Trust Line */}
        <p className="text-xs sm:text-sm text-gray-500 mt-6 sm:mt-8 flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 font-medium text-gray-600">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            No signup required
          </span>
          <span className="text-gray-300 hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5 font-medium text-gray-600">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            100% free
          </span>
          <span className="text-gray-300 hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5 font-medium text-gray-600">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Trusted by job seekers
          </span>
        </p>

      </div>
    </section>
  );
};

export default CallToAction;
