import React from 'react';
import { ArrowLeft, TrendingUp, Users, Heart, FileText, Radio } from 'lucide-react';
import Header from '../components/Header';
import BackButton from '../components/BackButton';

interface CareerAdvicePageProps {
  onNavigate: (page: string) => void;
  topic: string;
  user?: any;
  onLogout?: () => void;
}

const CareerAdvicePage: React.FC<CareerAdvicePageProps> = ({ onNavigate, topic, user, onLogout }) => {
  const getTopicContent = (topicName: string) => {
    switch (topicName) {
      case 'Career Path':
        return {
          icon: TrendingUp,
          emoji: '📈',
          color: 'orange',
          bgGradient: 'from-orange-50 via-amber-50 to-yellow-50',
          title: 'Career Path Planning',
          description: 'Navigate your professional journey with strategic career planning and goal setting',
          tips: [
            'Define your long-term career goals and vision',
            'Identify skills gaps and create learning plans',
            'Build a professional network in your industry',
            'Seek mentorship and guidance from senior professionals'
          ]
        };
      case 'Career Growth':
        return {
          icon: Users,
          emoji: '🚀',
          color: 'indigo',
          bgGradient: 'from-indigo-50 via-blue-50 to-cyan-50',
          title: 'Career Growth Strategies',
          description: 'Accelerate your career advancement with proven growth strategies',
          tips: [
            'Take on challenging projects and stretch assignments',
            'Develop leadership and soft skills',
            'Stay updated with industry trends and technologies',
            'Build visibility through thought leadership and networking'
          ]
        };
      case 'Diversity & Inclusion':
        return {
          icon: Heart,
          emoji: '🌍',
          color: 'pink',
          bgGradient: 'from-pink-50 via-rose-50 to-red-50',
          title: 'Diversity & Inclusion',
          description: 'Creating inclusive workplaces and advancing diversity in tech',
          tips: [
            'Advocate for inclusive hiring practices',
            'Support underrepresented groups in tech',
            'Challenge bias and promote equal opportunities',
            'Build diverse and inclusive teams'
          ]
        };
      case 'Trinitejob Daily':
        return {
          icon: FileText,
          emoji: '📰',
          color: 'cyan',
          bgGradient: 'from-cyan-50 via-teal-50 to-emerald-50',
          title: 'Trinitejob Daily',
          description: 'Stay informed with daily insights, news, and trends in the tech industry',
          tips: [
            'Get daily tech industry news and updates',
            'Discover emerging technologies and trends',
            'Read success stories from tech professionals',
            'Access exclusive interviews and insights'
          ]
        };
      case 'Tech Connects Podcast':
        return {
          icon: Radio,
          emoji: '🎙️',
          color: 'red',
          bgGradient: 'from-red-50 via-orange-50 to-amber-50',
          title: 'Tech Connects Podcast',
          description: 'Listen to inspiring conversations with tech leaders and innovators',
          tips: [
            'Hear from successful tech entrepreneurs and leaders',
            'Learn about cutting-edge technologies and innovations',
            'Get career advice from industry experts',
            'Discover new opportunities and networking insights'
          ]
        };
      default:
        return {
          icon: TrendingUp,
          emoji: '💼',
          color: 'blue',
          bgGradient: 'from-blue-50 via-indigo-50 to-purple-50',
          title: topic,
          description: 'Professional development and career guidance',
          tips: ['Stay updated with industry trends', 'Network with professionals', 'Continuous learning and skill development']
        };
    }
  };

  const content = getTopicContent(topic);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${content.bgGradient}`}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <BackButton 
          onClick={() => onNavigate && onNavigate('home')}
          text="Back to Home"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors mb-6"
        />
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{content.title} {content.emoji}</h1>
          <p className="text-xl text-gray-600">{content.description}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className={`bg-${content.color}-100 p-4 rounded-lg`}>
              <content.icon className={`w-8 h-8 text-${content.color}-600`} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Key Insights & Tips</h2>
          </div>
          
          <div className="space-y-4">
            {content.tips.map((tip, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                  {index + 1}
                </div>
                <p className="text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Get Started Today</h2>
          <p className="text-gray-600 mb-6">
            Ready to take the next step in your career journey? Explore our resources and connect with opportunities that align with your goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => onNavigate('job-listings')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Browse Jobs
            </button>
            <button 
              onClick={() => onNavigate('home')}
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors"
            >
              Explore More Resources
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerAdvicePage;