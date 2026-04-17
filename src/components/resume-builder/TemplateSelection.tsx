import React from 'react';
import { Check } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import ResumeTemplate from './ResumeTemplate';
import type { ResumeData } from '../../store/useResumeStore';

const DUMMY: ResumeData = {
  template: 'classic',
  personalInfo: {
    name: 'Alex Johnson',
    email: 'alex@email.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    linkedin: 'linkedin.com/in/alexjohnson',
    portfolio: '',
  },
  summary: 'Results-driven software engineer with 5+ years of experience building scalable web applications and leading cross-functional teams.',
  experience: [
    {
      id: '1',
      title: 'Senior Software Engineer',
      company: 'TechCorp Inc.',
      location: 'New York, NY',
      duration: '2021 – Present',
      current: true,
      bullets: [
        'Led development of microservices architecture serving 2M+ users',
        'Reduced API response time by 40% through caching strategies',
      ],
    },
    {
      id: '2',
      title: 'Software Engineer',
      company: 'StartupXYZ',
      location: 'Remote',
      duration: '2019 – 2021',
      current: false,
      bullets: ['Built React dashboard used by 500+ enterprise clients'],
    },
  ],
  education: [
    {
      id: '1',
      degree: 'B.S. Computer Science',
      institution: 'State University',
      location: 'New York',
      duration: '2015 – 2019',
      grade: 'GPA: 3.8',
    },
  ],
  skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'PostgreSQL'],
  certifications: [{ id: '1', name: 'AWS Solutions Architect', issuer: 'Amazon', year: '2022' }],
  awards: [],
  jobDescription: '',
};

const TEMPLATES = [
  { id: 'classic',      name: 'Classic',      desc: 'Centered header, bold section rules. Most ATS-safe.' },
  { id: 'modern',       name: 'Modern',       desc: 'Left-aligned name, thin rule divider. Clean & contemporary.' },
  { id: 'minimal',      name: 'Minimal',      desc: 'Two-column label sidebar. Ultra-clean whitespace.' },
  { id: 'executive',    name: 'Executive',    desc: 'Double-rule header, formal serif. Ideal for senior roles.' },
  { id: 'compact',      name: 'Compact',      desc: 'Dense layout, fits more content. Best for experienced candidates.' },
  { id: 'professional', name: 'Professional', desc: 'Sidebar layout with contact & skills on left.' },
] as const;

type TemplateId = typeof TEMPLATES[number]['id'];

export default function TemplateSelection() {
  const { data, update } = useResumeStore();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Choose a Resume Template</h2>
        <p className="text-gray-500 text-sm">All 6 templates are ATS-optimized — clean layouts that pass applicant tracking systems.</p>
        <p className="text-xs text-gray-400 mt-1">You can change your template at any time.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
        {TEMPLATES.map(t => {
          const isSelected = data.template === t.id;
          const previewData: ResumeData = { ...DUMMY, template: t.id };
          return (
            <button
              key={t.id}
              onClick={() => update('template', t.id as string)}
              className={`relative group text-left rounded-xl border-2 overflow-hidden transition-all bg-white ${
                isSelected
                  ? 'border-gray-900 shadow-lg'
                  : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
              }`}
            >
              {/* Live scaled preview */}
              <div className="relative bg-white border-b border-gray-100 overflow-hidden" style={{ height: 220 }}>
                <div style={{ transform: 'scale(0.38)', transformOrigin: 'top left', width: '263%', pointerEvents: 'none' }}>
                  <ResumeTemplate data={previewData} />
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                    Select Template
                  </span>
                </div>

                {/* Selected badge */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center shadow">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="px-3 py-2.5">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`font-semibold text-sm ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>{t.name}</span>
                  {isSelected && <span className="text-xs text-gray-500 font-medium">Selected</span>}
                </div>
                <p className="text-xs text-gray-400 leading-snug line-clamp-2">{t.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-xs text-gray-400 text-center">
        ✓ All templates use standard fonts and plain text — fully compatible with ATS systems
      </p>
    </div>
  );
}
