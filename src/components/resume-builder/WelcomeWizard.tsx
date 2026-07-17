import React, { useState } from 'react';
import { PenLine, Upload, Sparkles, X } from 'lucide-react';

interface Props {
  goal: string;
  role: string;
  step: number;
  onSetGoal: (v: string) => void;
  onSetRole: (v: string) => void;
  onSetStep: (v: number) => void;
  onStart: (v: string) => void;
  onComplete: () => void;
}

const GOALS = [
  { id: 'first-job', label: 'First Job', icon: '🎓', desc: 'Fresh graduate or entry-level' },
  { id: 'internship', label: 'Internship', icon: '📋', desc: 'Looking for internship opportunities' },
  { id: 'career-switch', label: 'Career Switch', icon: '🔄', desc: 'Moving to a new field or role' },
  { id: 'experienced', label: 'Experienced Professional', icon: '💼', desc: '5+ years of experience' },
  { id: 'executive', label: 'Executive', icon: '👔', desc: 'Senior leadership & management' },
];

const ROLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer',
  'Full Stack Developer', 'DevOps Engineer', 'Data Engineer',
  'Data Scientist', 'AI Engineer', 'Product Manager',
  'UI/UX Designer', 'Project Manager', 'Business Analyst',
  'QA Engineer', 'Mobile Developer', 'Cloud Architect',
  'Cybersecurity Analyst', 'Machine Learning Engineer', 'Systems Analyst',
];

const STEPS = ['How to Start', 'Your Goal', 'Target Job'];

export default function WelcomeWizard({ goal, role, step, onSetGoal, onSetRole, onSetStep, onStart, onComplete }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 p-8 max-h-[90vh] overflow-y-auto">
        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              {i > 0 && <div className={`flex-1 h-0.5 ${i <= step ? 'bg-blue-500' : 'bg-gray-200'}`} />}
              <div className={`flex items-center gap-1.5 text-xs font-medium ${i <= step ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i <= step ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {i + 1}
                </div>
                {label}
              </div>
            </React.Fragment>
          ))}
        </div>

        {step === 0 && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome to ZyncJobs AI Resume Builder</h2>
            <p className="text-sm text-gray-500 mb-5">How would you like to start?</p>
            <div className="space-y-3">
              <button onClick={() => { onStart('scratch'); onSetStep(1); }}
                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                  <PenLine className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Start from Scratch</p>
                  <p className="text-xs text-gray-500">Build your resume step by step with AI guidance</p>
                </div>
              </button>
              <button onClick={() => { onStart('import'); onSetStep(1); }}
                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
                  <Upload className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Upload Resume</p>
                  <p className="text-xs text-gray-500">Import from a PDF or DOCX — AI extracts everything</p>
                </div>
              </button>
              <button onClick={() => { onStart('linkedin'); onSetStep(1); }}
                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-5 h-5 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Import from LinkedIn</p>
                  <p className="text-xs text-gray-500">Pull your profile, experience & skills automatically</p>
                </div>
              </button>
              <button onClick={() => { onStart('ai'); onSetStep(1); }}
                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-purple-400 hover:bg-purple-50/50 transition-all text-left group">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Start with AI</p>
                  <p className="text-xs text-gray-500">Have a conversation — AI builds your resume for you</p>
                </div>
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">What are you looking for?</h2>
            <p className="text-sm text-gray-500 mb-5">This helps us tailor your resume</p>
            <div className="space-y-2.5">
              {GOALS.map(g => (
                <button key={g.id} onClick={() => { onSetGoal(g.id); onSetStep(2); }}
                  className={`w-full flex items-center gap-4 p-4 border rounded-xl transition-all text-left ${goal === g.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}>
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-lg">
                    {g.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{g.label}</p>
                    <p className="text-xs text-gray-500">{g.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => onSetStep(0)} className="mt-4 text-xs text-gray-500 hover:text-gray-700 underline">Back</button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">What's your target role?</h2>
            <p className="text-sm text-gray-500 mb-4">Pick the closest match — you can customize later</p>
            <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto">
              {ROLES.map(r => (
                <button key={r} onClick={() => onSetRole(r)}
                  className={`px-4 py-2 text-sm border rounded-lg transition-all ${role === r ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}>
                  {r}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between mt-6">
              <button onClick={() => onSetStep(1)} className="text-xs text-gray-500 hover:text-gray-700 underline">Back</button>
              <button onClick={onComplete}
                className="px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                {role ? `Start Building as ${role}` : 'Skip & Start Building'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
