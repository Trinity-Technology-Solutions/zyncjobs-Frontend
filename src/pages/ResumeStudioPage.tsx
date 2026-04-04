import React, { useState } from 'react';
import { FileText, Upload, BarChart2, BookOpen, ArrowRight, ArrowLeft, CheckCircle, Lightbulb, Layout, Zap } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface ResumeStudioPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

const ResumeStudioPage: React.FC<ResumeStudioPageProps> = ({ onNavigate, user, onLogout }) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const cards = [
    {
      id: 0,
      title: 'Resume Builder',
      desc: 'Create a professional resume from scratch using beautiful templates. Pick a design, fill in your details, and download instantly.',
      cta: 'Build Now',
      page: 'resume-templates',
      accent: '#3b82f6',
      accentLight: '#eff6ff',
      accentBorder: '#bfdbfe',
      visual: (
        <div className="relative w-full h-28 flex items-center justify-center">
          {/* Mini resume preview */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 w-20 h-24 p-2 absolute left-6 rotate-[-6deg] opacity-80">
            <div className="w-full h-2 bg-blue-400 rounded mb-1.5" />
            <div className="w-3/4 h-1 bg-gray-200 rounded mb-1" />
            <div className="w-full h-1 bg-gray-100 rounded mb-1" />
            <div className="w-2/3 h-1 bg-gray-100 rounded mb-2" />
            <div className="w-full h-1 bg-gray-200 rounded mb-0.5" />
            <div className="w-full h-1 bg-gray-100 rounded mb-0.5" />
            <div className="w-3/4 h-1 bg-gray-100 rounded" />
          </div>
          <div className="bg-white rounded-lg shadow-lg border border-blue-100 w-20 h-24 p-2 absolute left-14 z-10">
            <div className="w-full h-2 bg-blue-600 rounded mb-1.5" />
            <div className="w-3/4 h-1 bg-gray-300 rounded mb-1" />
            <div className="w-full h-1 bg-gray-200 rounded mb-1" />
            <div className="w-2/3 h-1 bg-gray-200 rounded mb-2" />
            <div className="w-full h-1 bg-gray-200 rounded mb-0.5" />
            <div className="w-full h-1 bg-gray-100 rounded mb-0.5" />
            <div className="w-3/4 h-1 bg-gray-100 rounded" />
          </div>
          <div className="absolute right-4 top-2 flex flex-col gap-1.5">
            {[Layout, FileText, Zap].map((Icon, i) => (
              <div key={i} className="w-7 h-7 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-blue-500" />
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 1,
      title: 'Resume Parser',
      desc: 'Upload your existing resume and let our AI extract and structure your information automatically in seconds.',
      cta: 'Upload Resume',
      page: 'resume-parser',
      accent: '#6366f1',
      accentLight: '#eef2ff',
      accentBorder: '#c7d2fe',
      highlight: true,
      visual: (
        <div className="relative w-full h-28 flex items-center justify-center">
          <div className="w-36 h-20 border-2 border-dashed border-indigo-300 rounded-xl flex flex-col items-center justify-center gap-1.5 bg-indigo-50/60">
            <Upload className="w-6 h-6 text-indigo-400" />
            <span className="text-xs text-indigo-400 font-medium">Drag & Drop</span>
            <span className="text-xs text-indigo-300">PDF, DOCX</span>
          </div>
          <div className="absolute right-4 top-3 flex flex-col gap-1">
            {['JS', 'PY', 'RE'].map((t, i) => (
              <div key={i} className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded font-medium">{t}</div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: 'Resume Analyzer',
      desc: 'Get AI-powered ATS score and feedback. See how well your resume matches job descriptions with improvement tips.',
      cta: 'Check Score',
      page: 'resume-score',
      accent: '#10b981',
      accentLight: '#ecfdf5',
      accentBorder: '#a7f3d0',
      visual: (
        <div className="relative w-full h-28 flex items-center justify-center gap-4">
          {/* Circular gauge */}
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
          {/* Checkmarks */}
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
      id: 3,
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
            <Lightbulb className="w-5 h-5 text-amber-500" />
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
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

      <div className="max-w-5xl mx-auto px-6 py-16">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            <Zap className="w-3.5 h-3.5" /> AI-Powered Resume Tools
          </div>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            Everything you need to<br />
            <span className="text-blue-600">build, improve, and perfect</span><br />
            your resume.
          </h1>
          <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
            Four powerful tools in one place — from building to analyzing, we've got you covered.
          </p>
          <button
            onClick={() => onNavigate('resume-templates')}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3.5 rounded-full font-semibold text-sm hover:bg-gray-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform"
          >
            Create Your Resume <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Four Pillars Grid */}
        <div className="grid grid-cols-2 gap-5">
          {cards.map((card) => (
            <div
              key={card.id}
              onMouseEnter={() => setHovered(card.id)}
              onMouseLeave={() => setHovered(null)}
              className="rounded-2xl border p-6 flex flex-col justify-between cursor-pointer transition-all duration-300"
              style={{
                background: hovered === card.id ? card.accentLight : '#ffffff',
                borderColor: hovered === card.id ? card.accentBorder : '#e5e7eb',
                boxShadow: hovered === card.id
                  ? `0 12px 40px -8px ${card.accent}30`
                  : '0 1px 4px rgba(0,0,0,0.06)',
                transform: hovered === card.id ? 'translateY(-4px)' : 'translateY(0)',
                outline: card.highlight ? `2px solid ${card.accentBorder}` : 'none',
              }}
            >
              {card.visual}
              <div className="mt-4">
                <h2 className="text-lg font-bold text-gray-900 mb-1.5">{card.title}</h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">{card.desc}</p>
                <button
                  onClick={() => onNavigate(card.page)}
                  className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full transition-all"
                  style={{
                    background: card.accent,
                    color: '#fff',
                    boxShadow: `0 4px 14px -2px ${card.accent}50`,
                  }}
                >
                  {card.cta} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom trust bar */}
        <div className="mt-14 flex items-center justify-center gap-8 text-sm text-gray-400">
          {['ATS Optimized', 'AI-Powered', 'Free to Use', 'Instant Download'].map((t, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              {t}
            </div>
          ))}
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default ResumeStudioPage;
