import React, { useEffect, useRef } from 'react';
import { Search, FileText, UserPlus, Send } from 'lucide-react';

interface HowItWorksProps {
  onNavigate?: (page: string) => void;
}

const HowItWorks: React.FC<HowItWorksProps> = ({ onNavigate }) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    const steps = sectionRef.current?.querySelectorAll('.step-card');
    steps?.forEach((step) => observer.observe(step));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-white py-16" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h6 className="text-blue-600 font-semibold text-lg mb-2">How It Work</h6>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Follow Easy 4 Steps</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            It is a long established fact that a reader will be distracted by the 
            readable content of a page when looking at its layout.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: Search,
              title: "Search Jobs",
              description: "Browse thousands of job opportunities from top companies. Use filters to find jobs that match your skills and preferences.",
              page: "job-listings"
            },
            {
              icon: FileText,
              title: "CV/Resume",
              description: "Upload your resume or create one using our AI-powered resume builder. Showcase your skills and experience effectively.",
              page: "resume-templates"
            },
            {
              icon: UserPlus,
              title: "Create Account",
              description: "Sign up for free to save jobs, track applications, and get personalized job recommendations based on your profile.",
              page: "register"
            },
            {
              icon: Send,
              title: "Apply Them",
              description: "Apply to jobs with one click. Track your application status and communicate directly with hiring managers.",
              page: "job-listings"
            }
          ].map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div 
                key={index} 
                className="step-card text-center cursor-pointer hover:transform hover:scale-105 transition-all duration-300 opacity-0 translate-y-8" 
                onClick={() => onNavigate && onNavigate(step.page)}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white mx-auto mb-4 hover:bg-blue-700 transition-colors duration-300">
                  <IconComponent className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
      
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default HowItWorks;