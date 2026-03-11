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
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed mb-4 text-lg">
              ZyncJobs is dedicated to revolutionizing the tech recruitment landscape by connecting talented professionals with their dream careers. We believe in the power of AI-driven matching and transparent communication to create meaningful career opportunities.
            </p>
            <p className="text-gray-700 leading-relaxed text-lg">
              Our platform empowers job seekers with tools to showcase their skills and helps employers find the right talent efficiently.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Vision</h2>
            <p className="text-gray-700 leading-relaxed mb-4 text-lg">
              We envision a world where finding the right job or hiring the right person is seamless, transparent, and rewarding for everyone involved.
            </p>
            <p className="text-gray-700 leading-relaxed text-lg">
              Through innovation and technology, we're building the future of tech recruitment.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-12 mb-16 border border-blue-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Transparency</h3>
              <p className="text-gray-700 leading-relaxed">We believe in honest communication and clear expectations for all parties involved in the recruitment process.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Innovation</h3>
              <p className="text-gray-700 leading-relaxed">We continuously improve our platform with cutting-edge AI and technology to serve you better.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Inclusivity</h3>
              <p className="text-gray-700 leading-relaxed">We welcome diverse talent and promote equal opportunities for all professionals.</p>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-10">Why Choose ZyncJobs?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start p-4 bg-gray-50 rounded-lg">
              <span className="text-blue-600 font-bold text-2xl mr-4 flex-shrink-0">✓</span>
              <span className="text-gray-700 text-lg">AI-powered job matching for better career fits</span>
            </div>
            <div className="flex items-start p-4 bg-gray-50 rounded-lg">
              <span className="text-blue-600 font-bold text-2xl mr-4 flex-shrink-0">✓</span>
              <span className="text-gray-700 text-lg">Comprehensive resume building and optimization tools</span>
            </div>
            <div className="flex items-start p-4 bg-gray-50 rounded-lg">
              <span className="text-blue-600 font-bold text-2xl mr-4 flex-shrink-0">✓</span>
              <span className="text-gray-700 text-lg">Skill assessments and career development resources</span>
            </div>
            <div className="flex items-start p-4 bg-gray-50 rounded-lg">
              <span className="text-blue-600 font-bold text-2xl mr-4 flex-shrink-0">✓</span>
              <span className="text-gray-700 text-lg">Direct access to top tech companies</span>
            </div>
            <div className="flex items-start p-4 bg-gray-50 rounded-lg">
              <span className="text-blue-600 font-bold text-2xl mr-4 flex-shrink-0">✓</span>
              <span className="text-gray-700 text-lg">Transparent salary benchmarking data</span>
            </div>
            <div className="flex items-start p-4 bg-gray-50 rounded-lg">
              <span className="text-blue-600 font-bold text-2xl mr-4 flex-shrink-0">✓</span>
              <span className="text-gray-700 text-lg">24/7 support and career guidance</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Career?</h2>
          <p className="text-blue-100 mb-8 text-lg max-w-2xl mx-auto">
            Whether you're a job seeker looking for your next opportunity or an employer searching for top talent, ZyncJobs is here to help you succeed.
          </p>
          <button 
            onClick={() => onNavigate && onNavigate('role-selection')}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-lg"
          >
            Get Started Today
          </button>
        </div>
      </main>

      <Footer onNavigate={onNavigate} user={user} />
    </div>
  );
};

export default AboutPage;
