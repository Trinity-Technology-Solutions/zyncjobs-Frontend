import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, Users, Brain, Clock, ChevronDown, ChevronUp, Star, Zap, Target, Award, CheckCircle, Play, BookOpen, Mic, Video, ThumbsUp } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface InterviewTipsPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const InterviewTipsPage: React.FC<InterviewTipsPageProps> = ({ onNavigate, user, onLogout }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'tips' | 'questions' | 'star'>('tips');

  const phases = [
    {
      step: '01',
      icon: BookOpen,
      title: 'Research & Prepare',
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      tips: ['Study company mission, products & recent news', 'Understand the job description deeply', 'Research your interviewers on LinkedIn', 'Prepare 5–7 achievement stories'],
    },
    {
      step: '02',
      icon: Mic,
      title: 'During the Interview',
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      tips: ['Use STAR method for behavioral questions', 'Listen carefully before answering', 'Show enthusiasm and positive energy', 'Ask clarifying questions when needed'],
    },
    {
      step: '03',
      icon: MessageSquare,
      title: 'Ask Smart Questions',
      color: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      tips: ['What does success look like in 90 days?', 'What are the biggest team challenges?', 'How do you support professional growth?', 'What do you love most about working here?'],
    },
    {
      step: '04',
      icon: Clock,
      title: 'Follow Up',
      color: 'from-orange-500 to-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      tips: ['Send thank-you email within 24 hours', 'Reference specific conversation points', 'Reiterate your enthusiasm for the role', 'Connect on LinkedIn with a personal note'],
    },
  ];

  const commonQuestions = [
    { q: 'Tell me about yourself', hint: 'Keep it 90 seconds — present, past, future formula', tag: 'Opening' },
    { q: 'Why do you want this job?', hint: 'Show genuine research + align your goals with theirs', tag: 'Motivation' },
    { q: 'What are your strengths?', hint: 'Pick 2–3 relevant to the role with real examples', tag: 'Self-awareness' },
    { q: 'What is your biggest weakness?', hint: 'Be honest, show self-awareness + what you\'re doing to improve', tag: 'Self-awareness' },
    { q: 'Where do you see yourself in 5 years?', hint: 'Align with company growth, show ambition without arrogance', tag: 'Goals' },
    { q: 'Why are you leaving your current job?', hint: 'Stay positive — focus on growth, never badmouth', tag: 'Transition' },
    { q: 'Tell me about a challenge you overcame', hint: 'Use STAR method with a measurable outcome', tag: 'Behavioral' },
    { q: 'What is your expected salary?', hint: 'Research market rates, give a range, not a fixed number', tag: 'Negotiation' },
  ];

  const starExamples = [
    { letter: 'S', label: 'Situation', color: 'bg-blue-500', desc: 'Set the scene — what was the context?', example: '"Our team was behind on a critical product launch with 2 weeks to go..."' },
    { letter: 'T', label: 'Task', color: 'bg-purple-500', desc: 'What was your responsibility?', example: '"I was responsible for coordinating 3 teams and ensuring delivery..."' },
    { letter: 'A', label: 'Action', color: 'bg-emerald-500', desc: 'What specific steps did YOU take?', example: '"I created a daily standup, identified blockers, and re-prioritized tasks..."' },
    { letter: 'R', label: 'Result', color: 'bg-orange-500', desc: 'What was the measurable outcome?', example: '"We launched on time, increasing Q3 revenue by 18%..."' },
  ];

  const stats = [
    { value: '93%', label: 'of hiring decisions are made in the first 5 minutes', icon: Zap },
    { value: '70%', label: 'of candidates fail due to poor preparation', icon: Target },
    { value: '3x', label: 'more likely to get hired with STAR method answers', icon: Award },
  ];

  const tagColors: Record<string, string> = {
    Opening: 'bg-blue-100 text-blue-700',
    Motivation: 'bg-purple-100 text-purple-700',
    'Self-awareness': 'bg-emerald-100 text-emerald-700',
    Goals: 'bg-orange-100 text-orange-700',
    Transition: 'bg-pink-100 text-pink-700',
    Behavioral: 'bg-indigo-100 text-indigo-700',
    Negotiation: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-purple-400 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-white/80 text-sm mb-6">
            <Mic className="w-4 h-4" /> Interview Mastery Guide
          </div>
          <h1 className="text-5xl font-black text-white mb-4 leading-tight">
            Ace Every <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">Interview</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
            Proven strategies, real examples, and expert tips to land your dream job with confidence.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {stats.map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 text-center">
                <div className="text-3xl font-black text-white">{s.value}</div>
                <div className="text-white/60 text-xs mt-1 max-w-[140px]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Back */}
        <button onClick={() => onNavigate('home')} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
        </button>

        {/* Tabs */}
        <div className="flex gap-2 mb-10 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 w-fit">
          {[
            { key: 'tips', label: 'Interview Tips', icon: Star },
            { key: 'questions', label: 'Common Questions', icon: MessageSquare },
            { key: 'star', label: 'STAR Method', icon: Target },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tips Tab */}
        {activeTab === 'tips' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {phases.map((phase, i) => (
                <div key={i} className={`bg-white rounded-2xl border ${phase.border} shadow-sm overflow-hidden hover:shadow-md transition-shadow`}>
                  <div className={`bg-gradient-to-r ${phase.color} p-5 flex items-center gap-4`}>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <phase.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-white/60 text-xs font-bold tracking-widest">STEP {phase.step}</div>
                      <div className="text-white font-bold text-lg">{phase.title}</div>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    {phase.tips.map((tip, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${phase.text}`} />
                        <span className="text-gray-700 text-sm">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Pro Tips Banner */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Pro Tips from Hiring Managers</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { icon: Video, tip: 'For virtual interviews, test your camera, mic, and lighting 30 mins before' },
                  { icon: ThumbsUp, tip: 'Mirror the interviewer\'s energy — match their pace and formality level' },
                  { icon: Users, tip: 'Bring 3 printed copies of your resume even if they have it digitally' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm">
                    <item.icon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">{item.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="space-y-3">
            <p className="text-gray-500 text-sm mb-6">Click any question to see the expert hint on how to answer it.</p>
            {commonQuestions.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">"{item.q}"</span>
                      <span className={`ml-3 text-xs px-2 py-0.5 rounded-full font-medium ${tagColors[item.tag]}`}>{item.tag}</span>
                    </div>
                  </div>
                  {openFaq === i ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                </div>
                {openFaq === i && (
                  <div className="px-5 pb-5 border-t border-gray-50">
                    <div className="flex items-start gap-3 mt-4 bg-indigo-50 rounded-xl p-4">
                      <Star className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <p className="text-indigo-800 text-sm font-medium">{item.hint}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* STAR Tab */}
        {activeTab === 'star' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">The STAR Method</h2>
              <p className="text-gray-500 text-sm">A structured way to answer behavioral interview questions with clarity and impact.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {starExamples.map((item, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className={`${item.color} p-5 flex items-center gap-4`}>
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white text-3xl font-black">
                      {item.letter}
                    </div>
                    <div>
                      <div className="text-white font-bold text-xl">{item.label}</div>
                      <div className="text-white/70 text-sm">{item.desc}</div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="bg-gray-50 rounded-xl p-4 border-l-4 border-gray-300">
                      <p className="text-gray-600 text-sm italic">{item.example}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Example Story */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Full STAR Example Answer</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'S', color: 'bg-blue-500', text: 'Our e-commerce site was losing 30% of users at checkout due to a slow payment flow.' },
                  { label: 'T', color: 'bg-purple-500', text: 'I was tasked with identifying the bottleneck and proposing a fix within 2 weeks.' },
                  { label: 'A', color: 'bg-emerald-500', text: 'I ran A/B tests, identified a 3-second API delay, and worked with backend to optimize it.' },
                  { label: 'R', color: 'bg-orange-500', text: 'Checkout completion improved by 22%, adding $40K in monthly revenue.' },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm">
                    <span className={`${s.color} text-white text-xs font-bold w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>{s.label}</span>
                    <p className="text-gray-700 text-sm">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Ready to practice?</h3>
          <p className="text-white/70 mb-6">Use our AI Career Coach to do mock interviews and get instant feedback.</p>
          <button
            onClick={() => onNavigate('career-coach')}
            className="bg-white text-indigo-700 font-bold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
          >
            Start Mock Interview →
          </button>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default InterviewTipsPage;
