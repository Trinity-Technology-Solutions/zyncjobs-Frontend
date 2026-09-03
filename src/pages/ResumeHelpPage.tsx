import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  FileText, CheckCircle, AlertCircle, Lightbulb, Star, Award, 
  Target, Users, TrendingUp, Clock, Download, ArrowRight,
  BookOpen, Zap, Shield, Eye
} from 'lucide-react';
import BackButton from '../components/BackButton';

interface ResumeHelpPageProps {
  onNavigate?: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const ResumeHelpPage: React.FC<ResumeHelpPageProps> = ({ onNavigate, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('tips');

  const resumeTips = [
    {
      title: 'Keep It Concise & Impactful',
      description: 'Limit your resume to 1-2 pages. Recruiters spend only 6-7 seconds reviewing each resume. Make every word count.',
      icon: Clock,
      color: 'from-blue-500 to-blue-600',
      stats: '6-7 sec average review time'
    },
    {
      title: 'Professional Formatting',
      description: 'Use consistent fonts, proper spacing, and bullet points. Clean design increases readability by 40%.',
      icon: Eye,
      color: 'from-purple-500 to-purple-600',
      stats: '40% better readability'
    },
    {
      title: 'Quantify Achievements',
      description: 'Focus on accomplishments with metrics. Resumes with numbers get 30% more interviews.',
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      stats: '30% more interviews'
    },
    {
      title: 'ATS Optimization',
      description: 'Tailor keywords for each job. 75% of resumes are filtered by ATS before human review.',
      icon: Target,
      color: 'from-orange-500 to-orange-600',
      stats: '75% use ATS filtering'
    },
    {
      title: 'Relevant Skills Focus',
      description: 'List technical and soft skills that match job requirements. Skills matching increases callbacks by 50%.',
      icon: Zap,
      color: 'from-indigo-500 to-indigo-600',
      stats: '50% more callbacks'
    },
    {
      title: 'Complete Contact Info',
      description: 'Include email, phone, LinkedIn, and location. Professional profiles get 21x more views.',
      icon: Users,
      color: 'from-pink-500 to-pink-600',
      stats: '21x more profile views'
    }
  ];

  const dosDonts = [
    {
      category: 'DO',
      items: [
        { text: 'Use action verbs (Led, Developed, Managed, Implemented)', impact: 'High' },
        { text: 'Include quantifiable results (Increased sales by 25%)', impact: 'High' },
        { text: 'Use industry-specific keywords', impact: 'Critical' },
        { text: 'Proofread multiple times for errors', impact: 'Critical' },
        { text: 'Use professional email address', impact: 'Medium' },
        { text: 'Include relevant certifications', impact: 'High' }
      ],
      color: 'green',
      icon: CheckCircle
    },
    {
      category: "DON'T",
      items: [
        { text: 'Use personal pronouns (I, me, we)', impact: 'Medium' },
        { text: 'Include irrelevant information', impact: 'High' },
        { text: 'Use unprofessional email addresses', impact: 'Critical' },
        { text: 'Exceed 2 pages (unless required)', impact: 'Medium' },
        { text: 'Use fancy fonts or colors', impact: 'Medium' },
        { text: 'Include salary expectations', impact: 'High' }
      ],
      color: 'red',
      icon: AlertCircle
    }
  ];

  const sections = [
    {
      title: 'Contact Information',
      content: 'Place at the top with clear hierarchy. Include: Full name, Phone number, Professional email, City/State, LinkedIn URL, Portfolio (if applicable)',
      priority: 'Critical',
      tips: ['Use a professional email format', 'Ensure phone number is current', 'LinkedIn should be public']
    },
    {
      title: 'Professional Summary',
      content: '2-3 compelling lines highlighting your unique value proposition and career goals. This is your elevator pitch on paper.',
      priority: 'High',
      tips: ['Tailor to each job application', 'Include key achievements', 'Use industry keywords']
    },
    {
      title: 'Work Experience',
      content: 'List in reverse chronological order with impact-focused descriptions. Include: Company name, Job title, Employment dates, 3-5 achievement bullets',
      priority: 'Critical',
      tips: ['Start bullets with action verbs', 'Quantify results when possible', 'Show progression and growth']
    },
    {
      title: 'Education',
      content: 'Include relevant academic credentials. Add: Institution name, Degree type, Field of study, Graduation date, GPA (if 3.5+), Honors/Awards',
      priority: 'High',
      tips: ['Recent graduates: place before experience', 'Include relevant coursework', 'Highlight academic achievements']
    },
    {
      title: 'Skills & Technologies',
      content: 'Organize technical and soft skills by relevance. Group by categories and include proficiency levels where appropriate.',
      priority: 'High',
      tips: ['Match job description keywords', 'Separate technical from soft skills', 'Be honest about proficiency']
    },
    {
      title: 'Certifications & Awards',
      content: 'Showcase relevant certifications, licenses, and professional recognition that strengthen your candidacy and demonstrate expertise.',
      priority: 'Medium',
      tips: ['Include expiration dates', 'Prioritize industry-relevant certs', 'Add issuing organizations']
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <BackButton fallback="/resume-studio" className="mb-8 bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:border-white/50 shadow-lg" />
          
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <FileText className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Resume Tips & Guide
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
              Master the art of creating compelling resumes that get noticed by recruiters and land interviews
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold">Expert Tips</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-400" />
                  <span className="font-semibold">Industry Standards</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold">ATS Optimized</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 mb-12">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'tips', label: 'Expert Tips', icon: Lightbulb },
              { id: 'sections', label: 'Resume Sections', icon: BookOpen },
              { id: 'dosdont', label: "Do's & Don'ts", icon: CheckCircle }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/25'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tips Tab */}
        {activeTab === 'tips' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumeTips.map((tip, index) => {
                const Icon = tip.icon;
                return (
                  <div key={index} className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300">
                    <div className={`w-12 h-12 bg-gradient-to-r ${tip.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{tip.title}</h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">{tip.description}</p>
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-xs font-medium text-blue-600">{tip.stats}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pro Tip Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8">
              <div className="flex items-start gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 flex-shrink-0">
                  <Lightbulb className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Pro Tip: AI-Powered Resume Optimization</h3>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    Use our AI Resume Builder to automatically optimize your resume with industry keywords and formatting. 
                    It analyzes job descriptions and suggests improvements to increase your chances of getting noticed by 3x.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => onNavigate && onNavigate('resume-builder')}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      <Zap className="w-5 h-5" />
                      Try AI Resume Builder
                    </button>
                    <button
                      onClick={() => onNavigate && onNavigate('resume-studio')}
                      className="bg-white text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors font-semibold border border-gray-200 flex items-center gap-2"
                    >
                      <FileText className="w-5 h-5" />
                      Resume Studio
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sections Tab */}
        {activeTab === 'sections' && (
          <div className="space-y-6">
            {sections.map((section, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-200">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(section.priority)}`}>
                        {section.priority}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4 leading-relaxed">{section.content}</p>
                    
                    {/* Tips */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Quick Tips
                      </h4>
                      <ul className="space-y-1">
                        {section.tips.map((tip, tipIndex) => (
                          <li key={tipIndex} className="text-sm text-gray-600 flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Resume Checklist */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-2">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                Resume Quality Checklist
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { text: 'No spelling or grammar errors', priority: 'Critical' },
                  { text: 'Consistent formatting throughout', priority: 'High' },
                  { text: 'Contact information is current', priority: 'Critical' },
                  { text: 'Dates are accurate and complete', priority: 'High' },
                  { text: 'Action verbs used in descriptions', priority: 'High' },
                  { text: 'Quantifiable achievements included', priority: 'Critical' },
                  { text: 'Tailored to job description', priority: 'Critical' },
                  { text: 'Professional appearance', priority: 'High' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
                    <input type="checkbox" className="w-4 h-4 text-green-600 rounded" />
                    <div className="flex-1">
                      <span className="text-gray-700 font-medium">{item.text}</span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Do's & Don'ts Tab */}
        {activeTab === 'dosdont' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {dosDonts.map((section, index) => {
              const Icon = section.icon;
              return (
                <div key={index} className={`bg-white rounded-2xl p-8 border-2 transition-all duration-300 hover:shadow-xl ${
                  section.color === 'green' 
                    ? 'border-green-200 hover:border-green-300' 
                    : 'border-red-200 hover:border-red-300'
                }`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      section.color === 'green' 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                        : 'bg-gradient-to-r from-red-500 to-pink-600'
                    }`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className={`text-2xl font-bold ${
                      section.color === 'green' ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {section.category}
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    {section.items.map((item, idx) => (
                      <div key={idx} className={`p-4 rounded-xl border-l-4 transition-all duration-200 hover:shadow-md ${
                        section.color === 'green' 
                          ? 'bg-green-50 border-green-400 hover:bg-green-100' 
                          : 'bg-red-50 border-red-400 hover:bg-red-100'
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            section.color === 'green' ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                            <span className="text-white font-bold text-sm">
                              {section.color === 'green' ? '✓' : '✗'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${
                              section.color === 'green' ? 'text-green-900' : 'text-red-900'
                            }`}>
                              {item.text}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-gray-600">Impact:</span>
                              <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${getImpactColor(item.impact)}`} />
                                <span className="text-xs font-semibold text-gray-700">{item.impact}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
          <div className="relative text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <FileText className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Build Your Perfect Resume?
            </h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Use our AI-powered resume builder to create a professional resume in minutes with industry-specific optimization
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => onNavigate && onNavigate('resume-builder')}
                className="bg-white text-blue-900 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all duration-200 flex items-center gap-3 shadow-xl hover:shadow-2xl hover:scale-105"
              >
                <Zap className="w-5 h-5" />
                Build AI Resume
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => onNavigate && onNavigate('resume-studio')}
                className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-all duration-200 flex items-center gap-3"
              >
                <FileText className="w-5 h-5" />
                Resume Studio
              </button>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-blue-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>ATS Optimized</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Industry Keywords</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Professional Templates</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} user={user} />
    </div>
  );
};

export default ResumeHelpPage;
