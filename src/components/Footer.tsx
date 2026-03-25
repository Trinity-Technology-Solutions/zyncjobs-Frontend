import React from 'react';
import { Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

interface FooterProps {
  onNavigate?: (page: string, topic?: string) => void;
  user?: { name: string; type: 'candidate' | 'employer' } | null;
}

const Footer: React.FC<FooterProps> = ({ onNavigate, user }) => {
  const isCandidate = user?.type === 'candidate';

  const handleEmployerLink = (page: string) => {
    if (!onNavigate) return;
    if (isCandidate) {
      onNavigate('employer-login');
    } else {
      onNavigate(page);
    }
  };

  const jobSeekerLinks = [
    { name: "Find Jobs", action: () => onNavigate && onNavigate('job-listings') },
    { name: "Browse Companies", action: () => onNavigate && onNavigate('companies') },
    { name: "Career Resources", action: () => onNavigate && onNavigate('career-resources') },
  ];

  const employerLinks = [
    { name: "Post a Job", action: () => handleEmployerLink('job-posting-selection') },
    { name: "Find Candidates", action: () => handleEmployerLink('candidate-search') },
    { name: "Employer Solutions", action: () => handleEmployerLink('employers') },
    { name: "Hiring Dashboard", action: () => handleEmployerLink('dashboard') },
  ];

  const isEmployer = user?.type === 'employer';

  const resourceLinks = [
    { name: "🎨 Resume Studio", action: () => onNavigate && onNavigate('resume-studio'), candidateOnly: true },
    { name: "💬 Interview Preparation", action: () => onNavigate && onNavigate('interview-tips'), candidateOnly: true },
    { name: "🧭 Career Guidance", action: () => onNavigate && onNavigate('career-coach'), candidateOnly: true },
    { name: "✅ Skill Check", action: () => onNavigate && onNavigate('skill-assessment'), candidateOnly: true },
  ].filter(link => !isEmployer || !link.candidateOnly);

  const companyLinks = [
    { name: "About ZyncJobs", action: () => onNavigate && onNavigate('about') },
    { name: "Why ZyncJobs?", action: () => onNavigate && onNavigate('why-zyncjobs') },
    { name: "Contact Us", action: () => onNavigate && onNavigate('contact') },
    { name: "Help Center", action: () => onNavigate && onNavigate('help') }
  ];

  const legalLinks = [
    { name: "Terms & Conditions", href: '#', onClick: () => onNavigate && onNavigate('terms') },
    { name: "Privacy Policy", href: '#', onClick: () => onNavigate && onNavigate('privacy') },
    { name: "Accessibility", href: '#', onClick: () => onNavigate && onNavigate('accessibility') }
  ];

  return (
    <footer className="bg-white text-gray-900 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <img 
            src="/images/zyncjobs-logo.png" 
            alt="ZyncJobs" 
            className="h-32 w-auto mb-6"
          />
          <p className="text-gray-600 mb-6 leading-relaxed max-w-2xl">
            The leading platform connecting tech professionals with their dream careers. Find jobs, hire talent, and grow your career in tech.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-lg font-semibold mb-6">For Job Seekers</h4>
            <ul className="space-y-3">
              {jobSeekerLinks.map((link, index) => (
                <li key={index}>
                  <button 
                    onClick={link.action}
                    className="text-gray-600 hover:text-gray-900 transition-colors text-left cursor-pointer"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          {!isCandidate && (
          <div>
            <h4 className="text-lg font-semibold mb-6">For Employers</h4>
            <ul className="space-y-3">
              {employerLinks.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={link.action}
                    className="text-gray-600 hover:text-gray-900 transition-colors text-left cursor-pointer"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          )}
          
          {resourceLinks.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold mb-6">Resources</h4>
            <ul className="space-y-3">
              {resourceLinks.map((link, index) => (
                <li key={index}>
                  <button 
                    onClick={link.action}
                    className="text-gray-600 hover:text-gray-900 transition-colors text-left cursor-pointer"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          )}
          
          <div>
            <h4 className="text-lg font-semibold mb-6">Company</h4>
            <ul className="space-y-3">
              {companyLinks.map((link, index) => (
                <li key={index}>
                  <button 
                    onClick={link.action}
                    className="text-gray-600 hover:text-gray-900 transition-colors text-left cursor-pointer"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-500 text-sm mb-4 md:mb-0">
              © 2026 ZyncJobs. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              {legalLinks.map((link, index) => (
                <button
                  key={index}
                  onClick={link.onClick}
                  className="text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  {link.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
