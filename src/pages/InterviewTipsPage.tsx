import React from 'react';
import { ArrowLeft, MessageSquare, Users, Brain, Clock } from 'lucide-react';
import Header from '../components/Header';

interface InterviewTipsPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const InterviewTipsPage: React.FC<InterviewTipsPageProps> = ({ onNavigate, user, onLogout }) => {
  const tips = [
    {
      icon: Brain,
      title: "Research & Prepare",
      description: "Study the company, role, and prepare answers for common interview questions."
    },
    {
      icon: Users,
      title: "Practice STAR Method",
      description: "Structure your answers using Situation, Task, Action, Result framework."
    },
    {
      icon: MessageSquare,
      title: "Ask Smart Questions",
      description: "Prepare thoughtful questions about the role, team, and company culture."
    },
    {
      icon: Clock,
      title: "Follow Up",
      description: "Send a thank-you email within 24 hours expressing your continued interest."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Interview Tips 🎤</h1>
          <p className="text-xl text-gray-600">
            Ace your interviews with confidence using these proven strategies and techniques
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Interview Success Tips</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {tips.map((tip, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <tip.icon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{tip.title}</h3>
                  <p className="text-gray-600">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Common Interview Questions</h2>
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-4">
              Prepare for these frequently asked questions to boost your confidence:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>"Tell me about yourself" - Keep it professional and relevant</li>
              <li>"Why do you want this job?" - Show genuine interest and research</li>
              <li>"What are your strengths/weaknesses?" - Be honest but strategic</li>
              <li>"Where do you see yourself in 5 years?" - Align with company growth</li>
              <li>"Do you have any questions for us?" - Always have 2-3 prepared questions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewTipsPage;