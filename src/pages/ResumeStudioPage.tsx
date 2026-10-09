import React from 'react';
import { FileText, Upload, BarChart2, BookOpen, ArrowRight, CheckCircle, Layout } from 'lucide-react';
import BackButton from '../components/BackButton';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface ResumeStudioPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const ResumeStudioPage: React.FC<ResumeStudioPageProps> = ({ onNavigate, user, onLogout }) => {

  const cards = [
    {
      id: -1,
      title: 'Resume Builder',
      desc: 'Build a professional ATS-optimized resume from scratch using AI. Fill in your details and get a ready-to-download resume in seconds.',
      cta: 'Build Resume',
      page: 'resume-builder',
      accent: '#3b82f6',
      accentLight: '#eff6ff',
      accentBorder: '#bfdbfe',
      visual: (
        <div className="relative w-full h-28 flex items-center justify-center gap-3">
          <div className="bg-white rounded-lg shadow-md border border-gray-100 w-20 h-24 p-2 absolute left-6 rotate-[-6deg] opacity-70">
            <div className="w-full h-2 bg-blue-400 rounded mb-1.5" />
            <div className="w-3/4 h-1 bg-gray-200 rounded mb-1" />
            <div className="w-full h-1 bg-gray-100 rounded mb-1" />
            <div className="w-2/3 h-1 bg-gray-100 rounded mb-2" />
            <div className="w-full h-1 bg-gray-200 rounded mb-0.5" />
            <div className="w-full h-1 bg-gray-100 rounded" />
          </div>
          <div className="bg-white rounded-lg shadow-lg border border-blue-100 w-20 h-24 p-2 absolute left-14 z-10">
            <div className="w-full h-2 bg-blue-600 rounded mb-1.5" />
            <div className="w-3/4 h-1 bg-gray-300 rounded mb-1" />
            <div className="w-full h-1 bg-gray-200 rounded mb-1" />
            <div className="w-2/3 h-1 bg-gray-200 rounded mb-2" />
            <div className="w-full h-1 bg-gray-200 rounded mb-0.5" />
            <div className="w-full h-1 bg-gray-100 rounded" />
          </div>
          <div className="absolute right-4 top-2">
            <div className="w-7 h-7 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center">
              <Layout className="w-3.5 h-3.5 text-blue-500" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 0,
      title: 'Resume Parser',
      desc: 'Upload your existing resume and let our AI extract and structure your information automatically in seconds.',
      cta: 'Upload Resume',
      page: 'resume-parser',
      accent: '#6366f1',
      accentLight: '#eef2ff',
      accentBorder: '#c7d2fe',
      visual: (
        <div className="relative w-full h-28 flex items-center justify-center">
          <div className="w-36 h-20 border-2 border-dashed border-indigo-300 rounded-xl flex flex-col items-center justify-center gap-1.5 bg-indigo-50/60">
            <Upload className="w-6 h-6 text-indigo-400" />
            <span className="text-xs text-indigo-400 font-medium">Drag & Drop</span>
            <span className="text-xs text-indigo-300">PDF, DOCX</span>
          </div>
        </div>
      ),
    },
    {
      id: 1,
      title: 'Resume Analyzer',
      desc: 'Get AI-powered ATS score and feedback. See how well your resume matches job descriptions with improvement tips.',
      cta: 'Check Score',
      page: 'resume-score',
      accent: '#10b981',
      accentLight: '#ecfdf5',
      accentBorder: '#a7f3d0',
      visual: (
        <div className="relative w-full h-28 flex items-center justify-center gap-4">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#d1fae5" strokeWidth="7" />
              <circle cx="40" cy="40" r="32" fill="none" stroke="#10b981" strokeWidth="7"
                strokeDasharray={`${0.85 * 201} 201`} strokeLinecap="round" transform="rotate(-90 40 40)" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-emerald-600">85%</span>
              <span className="text-xs text-gray-400">ATS</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {['Skills Matched', 'Keywords Found', 'Format OK'].map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-xs text-gray-600">{t}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: 'Tips & Guide',
      desc: 'Learn best practices for writing a standout resume. Expert tips, examples, and step-by-step guidance.',
      cta: 'Read Guides',
      page: 'resume-help',
      accent: '#f59e0b',
      accentLight: '#fffbeb',
      accentBorder: '#fde68a',
      visual: (
        <div className="relative w-full h-28 flex items-center justify-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-amber-700 mb-1">💡 Tip of the day</p>
            <p className="text-xs text-gray-600 leading-relaxed">Use action verbs like "Led", "Built", "Increased" to make your experience stand out.</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="resume-studio-page min-h-[calc(100vh-var(--header-h,80px))] flex flex-col justify-between" style={{ background: '#F8FAFC' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <div className="portal-page-container flex-1 w-full max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-10 sm:pb-12 lg:pb-16">
        <BackButton fallback="/dashboard" className="mb-4 sm:mb-6" />

        <div className="resume-studio-heading">
          <p className="resume-studio-eyebrow">AI-POWERED RESUME TOOLS</p>
          <h1>Everything you need to <span>analyze and perfect your resume.</span></h1>
          <p>Powerful tools in one place: parse, analyze, and improve your resume with AI.</p>
        </div>
        <div className="resume-studio-tools">
          {cards.map((card, index) => {
            const ToolIcon = [FileText, Upload, BarChart2, BookOpen][index];
            return <article className="resume-tool-card" key={card.id} style={{'--resume-tool-accent': card.accent, '--resume-tool-surface': card.accentLight} as React.CSSProperties}>
              <div className="resume-tool-copy"><div className="resume-tool-header"><span className="resume-tool-icon"><ToolIcon size={22} strokeWidth={1.7} aria-hidden="true" /></span><h2>{card.title}</h2></div><p>{card.desc}</p></div>
              <div className="resume-tool-preview" aria-hidden="true" inert=""><span className="resume-tool-preview-label">ILLUSTRATIVE PREVIEW</span>{card.visual}</div>
              <div className="resume-tool-footer"><button type="button" onClick={() => onNavigate(card.page)}>{card.cta}<ArrowRight size={17} aria-hidden="true" /></button></div>
            </article>;
          })}
        </div>

        <div className="resume-studio-benefits mt-8 sm:mt-10 lg:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 text-xs sm:text-sm text-gray-400 flex-wrap">
          {['ATS Optimized', 'AI-Powered', 'Free to Use', 'Instant Download'].map((t, i) => (
            <div key={i} className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-emerald-400 flex-shrink-0" />
              {t}
            </div>
          ))}
        </div>
      </div>

      <Footer onNavigate={onNavigate} user={user} />
    </div>
  );
};

export default ResumeStudioPage;
