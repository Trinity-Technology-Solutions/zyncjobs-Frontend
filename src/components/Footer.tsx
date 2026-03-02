import React from 'react';
import { Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

interface FooterProps {
  onNavigate?: (page: string, topic?: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const jobSeekerLinks = [
    { name: "Find Jobs", action: () => onNavigate && onNavigate('job-listings') },
    { name: "Browse Companies", action: () => onNavigate && onNavigate('companies') },
    { name: "Career Resources", action: () => onNavigate && onNavigate('career-insights-hub') },
    { name: "Salary Report", action: () => onNavigate && onNavigate('salary-report') },
    { name: "Job Hunting Tips", action: () => onNavigate && onNavigate('job-hunting') },
    { name: "Resume Help", action: () => onNavigate && onNavigate('resume-help') },
    { name: "AI Resume Builder", action: () => {
      console.log('Footer AI Resume Builder clicked!');
      onNavigate && onNavigate('ai-resume-builder');
    }}
  ];

  const employerLinks = [
    { name: "Post a Job", action: () => onNavigate && onNavigate('job-posting-selection') },
    { name: "Find Candidates", action: () => onNavigate && onNavigate('candidate-search') },
    { name: "Employer Solutions", action: () => onNavigate && onNavigate('employers') },
    { name: "Hiring Dashboard", action: () => onNavigate && onNavigate('employer-login') },
    { name: "Pricing Plans", action: () => onNavigate && onNavigate('employers') }
  ];

  const resourceLinks = [
    { name: "Interview Tips", action: () => onNavigate && onNavigate('interview-tips') },
    { name: "Career Growth", action: () => onNavigate && onNavigate('career-advice', 'Career Growth') },
    { name: "Diversity & Inclusion", action: () => onNavigate && onNavigate('career-advice', 'Diversity & Inclusion') },
    { name: "Tech Connects Podcast", action: () => onNavigate && onNavigate('career-advice', 'Tech Connects Podcast') },
    { name: "ZyncJobs Daily", action: () => onNavigate && onNavigate('career-advice', 'ZyncJobs Daily') }
  ];

  const companyLinks = [
    { name: "About ZyncJobs", action: () => onNavigate && onNavigate('about') },
    { name: "Why ZyncJobs?", action: () => onNavigate && onNavigate('why-zyncjobs') },
    { name: "Contact Us", action: () => onNavigate && onNavigate('contact') },
    { name: "Help Center", action: () => onNavigate && onNavigate('help') }
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
              © 2025 ZyncJobs. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">
                Terms & Conditions
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">
                Accessibility
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;