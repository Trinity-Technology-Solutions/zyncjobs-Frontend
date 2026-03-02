import React from 'react';
import { ArrowLeft, Brain, Database, Code, Zap, Server, Globe, Smartphone, Cloud } from 'lucide-react';

interface SkillDetailPageProps {
  onNavigate: (page: string) => void;
  skillName: string;
}

const SkillDetailPage: React.FC<SkillDetailPageProps> = ({ onNavigate, skillName }) => {
  const getSkillDetails = (skill: string) => {
    const skillData: { [key: string]: { icon: any, description: string } } = {
      'Apache Kafka': {
        icon: Server,
        description: 'A distributed streaming platform used for building real-time data pipelines and streaming applications. Essential for handling high-throughput data processing.'
      },
      'AI': {
        icon: Brain,
        description: 'Artificial Intelligence encompasses machine learning, deep learning, and neural networks. Drive innovation in automation, prediction, and intelligent systems.'
      },
      'Big Data': {
        icon: Database,
        description: 'Technologies and techniques for processing and analyzing large, complex datasets. Work with Hadoop, Spark, and distributed computing systems.'
      },
      'Machine Learning': {
        icon: Brain,
        description: 'Build algorithms that learn from data to make predictions and decisions. Apply statistical models and neural networks to solve complex problems.'
      },
      'ETL': {
        icon: Zap,
        description: 'Extract, Transform, Load processes for data integration. Move and transform data between different systems and databases efficiently.'
      },
      'MongoDB': {
        icon: Database,
        description: 'A popular NoSQL database for modern applications. Store and query flexible, JSON-like documents at scale with high performance.'
      },
      'React': {
        icon: Code,
        description: 'A JavaScript library for building user interfaces. Create interactive, component-based web applications with modern development practices.'
      },
      'TypeScript': {
        icon: Code,
        description: 'A typed superset of JavaScript that compiles to plain JavaScript. Build more reliable and maintainable large-scale applications.'
      }
    };

    return skillData[skill] || { icon: Globe, description: 'An important technology skill in high demand across the tech industry.' };
  };

  const skillDetails = getSkillDetails(skillName);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Modern Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(168,85,247,0.4),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(236,72,153,0.3),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,_rgba(139,92,246,0.2),_transparent_50%)]" />
        <div className="absolute top-0 left-0 w-full h-full opacity-40">
          <div className="absolute top-10 left-10 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" />
          <div className="absolute top-40 right-10 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000" />
          <div className="absolute bottom-10 left-20 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000" />
        </div>
      </div>

      {/* Floating geometric shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-5 h-5 bg-white/30 rotate-45 animate-bounce" />
        <div className="absolute top-3/4 right-1/4 w-7 h-7 bg-purple-300/40 rounded-full animate-pulse" />
        <div className="absolute top-1/2 left-3/4 w-4 h-4 bg-pink-300/50 rotate-12 animate-spin" style={{animationDuration: '10s'}} />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-indigo-300/40 animate-ping" />
      </div>

      {/* Back Button */}
      <div className="fixed top-8 left-8 z-50">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center space-x-3 text-white bg-purple-600 hover:bg-purple-700 transition-all duration-300 px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl cursor-pointer"
          style={{ pointerEvents: 'auto' }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Home</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-16 max-w-4xl w-full mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl mb-8 shadow-2xl">
              <skillDetails.icon className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-6">
              {skillName}
            </h1>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 mb-12 border border-purple-100">
            <p className="text-xl text-gray-700 leading-relaxed text-center">
              {skillDetails.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={() => onNavigate('job-listings')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-5 rounded-2xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1"
            >
              Find {skillName} Jobs
            </button>
            <button 
              onClick={() => onNavigate('home')}
              className="border-2 border-gray-300 bg-white/80 text-gray-700 px-12 py-5 rounded-2xl font-bold text-lg hover:border-purple-500 hover:text-purple-600 hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Explore More Skills
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillDetailPage;