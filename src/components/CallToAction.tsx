import React from 'react';
import GetStartedButton from './animata/button/get-started-button';
import WorkButton from './animata/button/work-button';

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
        } else {
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
    <section 
      ref={sectionRef}
      className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white text-center relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
      </div>
      
      <div className={`max-w-3xl mx-auto px-6 relative z-10 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        
        {/* Heading */}
        <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
          Find Your Next Opportunity Faster
        </h2>

        {/* Subtext */}
        <p className="text-gray-300 mt-4 text-lg md:text-xl mb-8">
          Join thousands of professionals using AI-powered job matching to land better roles.
        </p>

        {/* Buttons */}
        <div className={`mt-8 flex flex-col sm:flex-row justify-center gap-4 transition-all duration-1000 delay-300 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          
          {/* Primary Button */}
          <GetStartedButton
            text="Get Started"
            onClick={() => onNavigate && onNavigate('candidate-register')}
          />

          {/* Secondary Button */}
          <WorkButton
            text="Browse Jobs"
            size="md"
            onClick={() => onNavigate && onNavigate('job-listings')}
          />

        </div>

        {/* Trust Line */}
        <p className="text-sm text-gray-400 mt-8 flex items-center justify-center gap-2 flex-wrap">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            100% free
          </span>
          <span className="text-gray-500">•</span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
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
