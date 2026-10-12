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
      className="home-final-cta illustrated-candidate-cta py-10 sm:py-12 lg:py-14 relative overflow-hidden"
    >
      <div className={`candidate-opportunity-layout max-w-7xl mx-auto relative z-10 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        
        <div className="candidate-opportunity-copy">
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
        <svg className="candidate-opportunity-art" viewBox="0 0 320 250" fill="none" aria-hidden="true" focusable="false">
          <circle cx="181" cy="124" r="98" fill="#E2EAF9" />
          <g className="career-floating-document"><rect x="183" y="37" width="84" height="106" rx="10" fill="#FFF" stroke="#A8BFDF" strokeWidth="1.7" /><rect x="198" y="54" width="45" height="7" rx="3" fill="#94AFD7" /><path d="M198 77H250M198 91H250M198 105H234" stroke="#CCD8EA" strokeWidth="3" strokeLinecap="round" /><circle cx="252" cy="137" r="20" fill="#EEF8F2" stroke="#95C2A9" strokeWidth="1.5" /><path d="m243 138 6 6 12-14" stroke="#5C9977" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" /></g>
          <g stroke="#26374F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M81 218 90 158 118 144 146 146 167 168 175 218Z" fill="#FFF" />
            <path d="M118 129 119 147 132 157 144 145 141 130" fill="#FFF" />
            <path d="M113 96Q113 76 133 76Q153 76 154 97L149 125Q135 144 121 128Z" fill="#FFF" />
            <path d="M114 107Q100 82 119 71Q128 65 142 71Q159 75 157 98L148 90 130 91 119 98Z" fill="#26374F" />
            <path d="M122 104H128M139 104H145M134 106 133 117 137 117M128 125Q135 130 144 123" />
            <path d="M102 162 88 196 104 218M149 162 177 176 197 153 207 162 181 196 155 184" fill="#FFF" />
            <path d="M197 153 201 143Q204 136 208 141L207 150 212 148Q218 150 214 156L207 162" fill="#FFF" />
          </g>
          <rect x="71" y="207" width="71" height="32" rx="7" fill="#C6D7F0" stroke="#7B9BC7" strokeWidth="1.5" /><path d="M93 207v-6a5 5 0 0 1 5-5h15a5 5 0 0 1 5 5v6" stroke="#7B9BC7" strokeWidth="2" /><path d="M57 240H258" stroke="#B9CAE3" strokeWidth="2" strokeLinecap="round" />
          <g className="career-floating-document-secondary"><circle cx="66" cy="110" r="18" fill="#FFF" stroke="#B1C3E0" strokeWidth="1.5" /><path d="m60 109 4 5 9-10" stroke="#7899C7" strokeWidth="2" strokeLinecap="round" /></g>
        </svg>
      </div>
    </section>
  );
};

export default CallToAction;
