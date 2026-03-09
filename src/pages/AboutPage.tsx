import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface AboutPageProps {
  onNavigate?: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onNavigate, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">About ZyncJobs</h1>
          <p className="text-xl text-blue-100">Connecting Tech Talent with Opportunity</p>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">


        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              ZyncJobs is dedicated to revolutionizing the tech recruitment landscape by connecting talented professionals with their dream careers. We believe in the power of AI-driven matching and transparent communication to create meaningful career opportunities.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our platform empowers job seekers with tools to showcase their skills and helps employers find the right talent efficiently.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We envision a world where finding the right job or hiring the right person is seamless, transparent, and rewarding for everyone involved.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Through innovation and technology, we're building the future of tech recruitment.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Transparency</h3>
              <p className="text-gray-600">We believe in honest communication and clear expectations for all parties.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Innovation</h3>
              <p className="text-gray-600">We continuously improve our platform with cutting-edge AI and technology.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Inclusivity</h3>
              <p className="text-gray-600">We welcome diverse talent and promote equal opportunities for all.</p>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Why Choose ZyncJobs?</h2>
          <ul className="space-y-4">
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-4">✓</span>
              <span className="text-gray-600">AI-powered job matching for better career fits</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-4">✓</span>
              <span className="text-gray-600">Comprehensive resume building and optimization tools</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-4">✓</span>
              <span className="text-gray-600">Skill assessments and career development resources</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-4">✓</span>
              <span className="text-gray-600">Direct access to top tech companies</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-4">✓</span>
              <span className="text-gray-600">Transparent salary benchmarking data</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 font-bold mr-4">✓</span>
              <span className="text-gray-600">24/7 support and career guidance</span>
            </li>
          </ul>
        </div>

        <div className="bg-blue-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Join Our Community</h2>
          <p className="text-gray-600 mb-6">
            Whether you're a job seeker looking for your next opportunity or an employer searching for top talent, ZyncJobs is here to help you succeed.
          </p>
          <button 
            onClick={() => onNavigate && onNavigate('role-selection')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started Today
          </button>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default AboutPage;
