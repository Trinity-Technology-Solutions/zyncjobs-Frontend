import React from 'react';
import { ArrowLeft, BookOpen, FileText, MessageSquare, TrendingUp, Users, Heart, Radio, ArrowRight } from 'lucide-react';

interface CareerInsightsHubPageProps {
  onNavigate: (page: string, topic?: string) => void;
}

const CareerInsightsHubPage: React.FC<CareerInsightsHubPageProps> = ({ onNavigate }) => {
  const sections = [
    {
      icon: BookOpen,
      title: "Job Hunting",
      emoji: "🧑💻",
      description: "Master the art of finding and landing your dream tech job with proven strategies.",
      example: "Learn how to optimize your LinkedIn profile to attract 3x more recruiter messages.",
      color: "blue",
      action: () => onNavigate('job-hunting')
    },
    {
      icon: FileText,
      title: "Resume Help",
      emoji: "📄",
      description: "Create compelling resumes that pass ATS systems and impress hiring managers.",
      example: "Discover the 5 keywords that increase your resume's visibility by 40%.",
      color: "green",
      action: () => onNavigate('resume-help')
    },
    {
      icon: MessageSquare,
      title: "Interview Tips",
      emoji: "🎤",
      description: "Ace technical and behavioral interviews with confidence and preparation.",
      example: "Master the STAR method to answer behavioral questions like a pro.",
      color: "purple",
      action: () => onNavigate('interview-tips')
    },
    {
      icon: TrendingUp,
      title: "Career Path",
      emoji: "📈",
      description: "Navigate your professional journey with strategic planning and goal setting.",
      example: "Create a 5-year career roadmap that aligns with industry growth trends.",
      color: "orange",
      action: () => onNavigate('career-advice', 'Career Path')
    },
    {
      icon: Users,
      title: "Career Growth",
      emoji: "🚀",
      description: "Accelerate your advancement with leadership skills and strategic networking.",
      example: "Build executive presence that gets you noticed for promotion opportunities.",
      color: "indigo",
      action: () => onNavigate('career-advice', 'Career Growth')
    },
    {
      icon: Heart,
      title: "Diversity & Inclusion",
      emoji: "🌍",
      description: "Champion inclusive practices and advance diversity in the tech industry.",
      example: "Implement bias-free hiring practices that increase team diversity by 60%.",
      color: "pink",
      action: () => onNavigate('career-advice', 'Diversity & Inclusion')
    },
    {
      icon: FileText,
      title: "Trinitejob Daily",
      emoji: "📰",
      description: "Stay informed with daily tech industry insights, trends, and opportunities.",
      example: "Get exclusive access to startup funding news 24 hours before it goes public.",
      color: "cyan",
      action: () => onNavigate('career-advice', 'Trinitejob Daily')
    },
    {
      icon: Radio,
      title: "Tech Connects Podcast",
      emoji: "🎙️",
      description: "Listen to inspiring conversations with tech leaders and innovators.",
      example: "Hear how a junior developer became CTO in 3 years through strategic moves.",
      color: "red",
      action: () => onNavigate('career-advice', 'Tech Connects Podcast')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Career Insights Hub 🚀
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your comprehensive resource center for career development, professional growth, and tech industry insights
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 mb-12">
          {sections.map((section, index) => (
            <div
              key={index}
              onClick={section.action}
              className="group bg-white/70 backdrop-blur-sm border-2 border-gray-200 rounded-2xl p-8 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer hover:border-blue-500 transform"
            >
              <div className="flex items-start space-x-4 mb-6">
                <div className={`bg-${section.color}-100 p-4 rounded-xl group-hover:scale-110 transition-transform`}>
                  <section.icon className={`w-8 h-8 text-${section.color}-600`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {section.title} {section.emoji}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {section.description}
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50/80 rounded-lg p-4 border-l-4 border-blue-500">
                <p className="text-sm text-gray-700 italic">
                  💡 {section.example}
                </p>
              </div>
              
              <div className="flex items-center justify-end mt-4 text-blue-600 group-hover:text-blue-700">
                <span className="text-sm font-medium mr-2">Explore more</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        <div className="text-center bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Accelerate Your Career?</h2>
          <p className="text-gray-600 mb-6">
            Join thousands of tech professionals who are already advancing their careers with Trinitejob
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => onNavigate('job-listings')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Browse Jobs
            </button>
            <button 
              onClick={() => onNavigate('register')}
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors"
            >
              Join Trinitejob
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerInsightsHubPage;