import React from 'react';
import { FileText, Search, BarChart2, BookOpen, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface ResumeStudioPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const features = [
  {
    icon: <FileText className="w-8 h-8 text-blue-600" />,
    title: 'Resume Builder',
    description: 'Create a professional resume from scratch using our templates. Pick a design, fill in your details, and download instantly.',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    btn: 'bg-blue-600 hover:bg-blue-700',
    page: 'resume-templates',
  },
  {
    icon: <Search className="w-8 h-8 text-purple-600" />,
    title: 'Resume Parser',
    description: 'Upload your existing resume and let our AI extract and structure your information automatically.',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    btn: 'bg-purple-600 hover:bg-purple-700',
    page: 'resume-parser',
  },
  {
    icon: <BarChart2 className="w-8 h-8 text-green-600" />,
    title: 'Resume Analyzer',
    description: 'Get AI-powered feedback on your resume. See how well it matches job descriptions and get improvement suggestions.',
    bg: 'bg-green-50',
    border: 'border-green-200',
    btn: 'bg-green-600 hover:bg-green-700',
    page: 'ai-resume-builder',
  },
  {
    icon: <BookOpen className="w-8 h-8 text-orange-600" />,
    title: 'Resume Tips & Guide',
    description: 'Learn best practices for writing a standout resume. Expert tips, examples, and step-by-step guidance.',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    btn: 'bg-orange-600 hover:bg-orange-700',
    page: 'resume-help',
  },
];

const ResumeStudioPage: React.FC<ResumeStudioPageProps> = ({ onNavigate, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Resume Studio</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to build, improve, and perfect your resume — all in one place.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className={`${f.bg} ${f.border} border rounded-2xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow`}
            >
              <div>
                <div className="mb-4">{f.icon}</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h2>
                <p className="text-gray-600 text-sm leading-relaxed">{f.description}</p>
              </div>
              <button
                onClick={() => onNavigate(f.page)}
                className={`mt-6 ${f.btn} text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 w-fit transition-colors`}
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default ResumeStudioPage;
