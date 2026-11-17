import React from 'react';
import './CandidateFeaturesSection.css';
import {
  ArrowRight, Bookmark, Briefcase, Bot, CheckCircle2,
  FileText, Mail, MessageSquareText, Send, Sparkles,
  Target, Upload, UserRound, Wand2,
} from 'lucide-react';
import { GlareCard } from '@/components/ui/glare-card';

type CandidateFeaturesSectionProps = {
  onNavigate?: (page: string, params?: { tab?: string; clearFilters?: boolean }) => void;
};

const CandidateToolGlareCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`career-tool-card ${className}`}>
    {children}
  </div>
);

const jobCards = [
  {
    icon: Send,
    title: 'Easy Apply',
    desc: 'Apply to suitable openings using your saved profile and resume in one click.',
    action: 'job-listings',
    params: { clearFilters: true } as { tab?: string; clearFilters?: boolean },
    bg: 'linear-gradient(160deg, #1d4ed8 0%, #3b82f6 60%, #60a5fa 100%)',
  },
  {
    icon: UserRound,
    title: 'Profile Management',
    desc: 'Keep your skills, experience, and education up to date in one place.',
    action: 'dashboard',
    params: undefined as { tab?: string; clearFilters?: boolean } | undefined,
    bg: 'linear-gradient(160deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)',
  },
  {
    icon: Target,
    title: 'Job Recommendations',
    desc: 'Explore roles selected around your skills and career interests.',
    action: 'job-listings',
    params: { tab: 'recommended', clearFilters: true } as { tab?: string; clearFilters?: boolean },
    bg: 'linear-gradient(160deg, #1e40af 0%, #4f46e5 60%, #818cf8 100%)',
  },
  {
    icon: Bookmark,
    title: 'Saved Jobs',
    desc: 'Save interesting openings and come back to them when you are ready.',
    action: 'my-jobs',
    params: undefined as { tab?: string; clearFilters?: boolean } | undefined,
    bg: 'linear-gradient(160deg, #1d4ed8 0%, #0ea5e9 60%, #38bdf8 100%)',
  },
  {
    icon: Briefcase,
    title: 'Application Tracking',
    desc: 'Review the roles you have applied to and follow your application progress.',
    action: 'my-applications',
    params: undefined as { tab?: string; clearFilters?: boolean } | undefined,
    bg: 'linear-gradient(160deg, #312e81 0%, #4f46e5 60%, #6366f1 100%)',
  },
];

const AccordionCards: React.FC<{ onNavigate?: (page: string, params?: { tab?: string; clearFilters?: boolean }) => void }> = ({ onNavigate }) => {
  return (
    <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {jobCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <GlareCard
            key={card.title}
            containerClassName="h-full w-full !aspect-auto [--radius:16px]"
            className="h-full !bg-white"
          >
            <button
              type="button"
              onClick={() => onNavigate?.(card.action, card.params)}
              className="group relative block min-h-[254px] w-full overflow-hidden rounded-2xl bg-white p-5 text-left transition-all duration-200 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-inset"
            >
              <div
                className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                style={{ background: card.bg }}
              />
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-blue-50 group-hover:text-blue-700">
                <Icon size={19} strokeWidth={1.8} />
              </div>
              <span className="absolute right-4 top-4 text-xs font-semibold text-slate-300">0{index + 1}</span>
              <div className="mt-7">
                <h3 className="text-base font-bold tracking-tight text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.desc}</p>
              </div>
              <div className="absolute inset-x-5 bottom-5 flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                Explore feature
                <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </button>
          </GlareCard>
        );
      })}
    </div>
  );
};

const CandidateFeaturesSection: React.FC<CandidateFeaturesSectionProps> = ({ onNavigate }) => {
  return (
    <>
      {/* ── AI Career Tools — Zoho Bento ── */}
      <section
        className="career-tools-section relative overflow-hidden py-16 sm:py-24"
        style={{ background: '#ffffff' }}
        aria-labelledby="candidate-resume-tools-title"
      >
        <div className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-200/40 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[350px] w-[350px] rounded-full bg-indigo-100/60 blur-[80px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-600">
              <Sparkles size={12} /> Your career toolkit
            </span>
            <h2 id="candidate-resume-tools-title" className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              AI tools built for{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">your next move</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
              Build, optimize, and land — everything you need from resume to offer letter.
            </p>
          </div>

          {/* Bento grid — 3 col */}
          <div className="career-tools-grid">

            {/* Col 1 — Resume Builder tall */}
            <CandidateToolGlareCard className="lg:row-span-2">
            <button type="button" onClick={() => onNavigate?.('resume-studio')}
              className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl p-7 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              style={{ background: 'linear-gradient(145deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%)', minHeight: '520px' }}>
              <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 group-hover:bg-white/30"><ArrowRight size={14} className="text-white" /></div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20"><FileText size={22} className="text-white" strokeWidth={1.8} /></div>
              <h3 className="mt-5 text-2xl font-bold text-white">Resume Builder</h3>
              <p className="mt-2 text-sm leading-6 text-blue-100">Create an ATS-friendly resume with guided sections and professional templates.</p>
              {/* mini resume app window */}
              <div className="mt-5 flex-1 overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* window bar */}
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <span className="ml-2 text-[10px] text-slate-400">resume-builder.zyncjobs.com</span>
                </div>
                <div className="flex h-full">
                  {/* sidebar */}
                  <div className="w-24 shrink-0 border-r border-slate-100 bg-slate-50 p-2">
                    {['Personal', 'Experience', 'Education', 'Skills', 'Summary'].map((s, i) => (
                      <div key={s} className={`mb-1 rounded-lg px-2 py-1.5 text-[9px] font-medium ${i === 1 ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>{s}</div>
                    ))}
                  </div>
                  {/* content */}
                  <div className="flex-1 p-3">
                    <div className="mb-2 text-[10px] font-bold text-slate-700">Work Experience</div>
                    <div className="mb-2 rounded-lg border border-slate-100 bg-white p-2 shadow-sm">
                      <div className="text-[10px] font-semibold text-slate-800">Senior Developer</div>
                      <div className="text-[9px] text-blue-600">Zoho Corp · 2022–Present</div>
                      <div className="mt-1 h-1 w-full rounded bg-slate-100" />
                      <div className="mt-0.5 h-1 w-4/5 rounded bg-slate-100" />
                    </div>
                    <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50 p-2 text-center">
                      <span className="text-[9px] text-blue-500">+ Add experience</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {['React', 'TypeScript', 'Node.js'].map(sk => (
                        <span key={sk} className="rounded bg-blue-100 px-1.5 py-0.5 text-[8px] font-medium text-blue-700">{sk}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </button>
            </CandidateToolGlareCard>

            {/* Col 2 Row 1 — AI Resume Analysis */}
            <CandidateToolGlareCard>
            <button type="button" onClick={() => onNavigate?.('resume-score')}
              className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-blue-100 p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)' }}>
              <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 group-hover:bg-blue-200"><ArrowRight size={14} className="text-blue-600" /></div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-200/60"><Sparkles size={18} className="text-blue-700" strokeWidth={1.8} /></span>
              <h3 className="mt-3 text-base font-bold text-slate-900">AI Resume Analysis</h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">Score your resume and get AI feedback instantly.</p>
              {/* mini score dashboard */}
              <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-md">
                <div className="bg-amber-500 px-3 py-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white">Resume Score</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">82/100</span>
                </div>
                <div className="p-3 space-y-2">
                  {[{ l: 'ATS Compatibility', v: 88, c: 'bg-green-400' }, { l: 'Keyword Match', v: 74, c: 'bg-amber-400' }, { l: 'Readability', v: 91, c: 'bg-blue-400' }, { l: 'Impact Score', v: 67, c: 'bg-orange-400' }].map(r => (
                    <div key={r.l}>
                      <div className="flex justify-between text-[9px] text-slate-500 mb-0.5"><span>{r.l}</span><span className="font-bold text-slate-700">{r.v}%</span></div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full rounded-full ${r.c}`} style={{ width: `${r.v}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </button>
            </CandidateToolGlareCard>

            {/* Col 3 Row 1 — Resume Parser */}
            <CandidateToolGlareCard>
            <button type="button" onClick={() => onNavigate?.('resume-parser')}
              className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-blue-100 p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #eef2ff 100%)' }}>
              <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 group-hover:bg-indigo-200"><ArrowRight size={14} className="text-indigo-600" /></div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-200/60"><Upload size={18} className="text-indigo-700" strokeWidth={1.8} /></span>
              <h3 className="mt-3 text-base font-bold text-slate-900">Resume Parser</h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">Upload and extract your profile data automatically.</p>
              {/* mini parsed result */}
              <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-md">
                <div className="bg-indigo-600 px-3 py-2"><span className="text-[10px] font-bold text-white">Parsed Successfully ✓</span></div>
                <div className="p-3 space-y-1.5">
                  {[{ label: 'Name', val: 'Arun Kumar' }, { label: 'Role', val: 'Frontend Dev' }, { label: 'Exp', val: '4 years' }, { label: 'Skills', val: 'React, TS, Node' }].map(f => (
                    <div key={f.label} className="flex items-center gap-2">
                      <span className="w-10 text-[9px] font-semibold text-indigo-500">{f.label}</span>
                      <span className="flex-1 rounded bg-indigo-50 px-2 py-0.5 text-[9px] text-slate-700">{f.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </button>
            </CandidateToolGlareCard>

            {/* Col 2 Row 2 — Skill Gap Analysis (col-span-2) */}
            <CandidateToolGlareCard className="lg:col-span-2">
            <button type="button" onClick={() => onNavigate?.('skill-gap-analysis')}
              className="group relative flex h-full w-full overflow-hidden rounded-3xl p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 55%, #60a5fa 100%)' }}>
              <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 group-hover:bg-white/30"><ArrowRight size={14} className="text-white" /></div>
              <div className="flex-1 min-w-0">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20"><Target size={20} className="text-white" strokeWidth={1.8} /></span>
                <h3 className="mt-3 text-lg font-bold text-white">AI Skill Gap Analysis</h3>
                <p className="mt-1 text-sm leading-6 text-emerald-100">Compare your profile with a target role and find what to learn next.</p>
              </div>
              {/* mini gap UI */}
              <div className="ml-4 w-2/5 overflow-hidden rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <div className="mb-2 text-[10px] font-bold text-white">Target: Senior Engineer</div>
                {[{ skill: 'AWS', have: 40, need: 90 }, { skill: 'Docker', have: 60, need: 85 }, { skill: 'GraphQL', have: 20, need: 70 }, { skill: 'K8s', have: 10, need: 75 }].map(g => (
                  <div key={g.skill} className="mb-2">
                    <div className="flex justify-between text-[9px] text-white/80 mb-0.5"><span>{g.skill}</span><span className="font-bold text-white">+{g.need - g.have}%</span></div>
                    <div className="relative h-2 rounded-full bg-white/10">
                      <div className="absolute h-full rounded-full bg-white/25" style={{ width: `${g.need}%` }} />
                      <div className="absolute h-full rounded-full bg-white" style={{ width: `${g.have}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </button>
            </CandidateToolGlareCard>

            {/* Row 3 — JD Optimization */}
            <CandidateToolGlareCard>
            <button type="button" onClick={() => onNavigate?.('resume-builder')}
              className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-blue-100 p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)' }}>
              <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 group-hover:bg-blue-200"><ArrowRight size={14} className="text-blue-600" /></div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-200/60"><Wand2 size={18} className="text-blue-700" strokeWidth={1.8} /></span>
              <h3 className="mt-3 text-base font-bold text-slate-900">JD Optimization</h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">Tailor your resume to any job description with AI.</p>
              <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-md">
                <div className="bg-blue-600 px-3 py-1.5 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-white">Match Analysis</span>
                  <span className="text-[10px] font-bold text-blue-200">87% match</span>
                </div>
                <div className="p-2.5 space-y-1.5">
                  {[{ t: 'Keywords added', n: '12', ok: true }, { t: 'Tone aligned', n: '✓', ok: true }, { t: 'Skills matched', n: '8/10', ok: true }, { t: 'Missing terms', n: '3', ok: false }].map(item => (
                    <div key={item.t} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className={`h-3.5 w-3.5 rounded-full flex items-center justify-center ${item.ok ? 'bg-green-100' : 'bg-red-100'}`}>
                          <span className={`text-[8px] font-bold ${item.ok ? 'text-green-600' : 'text-red-500'}`}>{item.ok ? '✓' : '!'}</span>
                        </div>
                        <span className="text-[9px] text-slate-600">{item.t}</span>
                      </div>
                      <span className={`text-[9px] font-bold ${item.ok ? 'text-blue-700' : 'text-red-500'}`}>{item.n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </button>
            </CandidateToolGlareCard>

            {/* Row 3 — AI Cover Letter */}
            <CandidateToolGlareCard>
            <button type="button" onClick={() => onNavigate?.('resume-builder')}
              className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-blue-100 p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #eef2ff 100%)' }}>
              <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 group-hover:bg-indigo-200"><ArrowRight size={14} className="text-indigo-600" /></div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-200/60"><Mail size={18} className="text-indigo-700" strokeWidth={1.8} /></span>
              <h3 className="mt-3 text-base font-bold text-slate-900">AI Cover Letter</h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">Draft a role-specific cover letter in seconds.</p>
              <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-md">
                <div className="border-b border-slate-100 px-3 py-2">
                  <div className="flex items-center gap-2 text-[9px] text-slate-400">
                    <span className="font-semibold text-slate-600">To:</span> hiring@company.com
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-slate-400">
                    <span className="font-semibold text-slate-600">Re:</span> Frontend Developer Role
                  </div>
                </div>
                <div className="p-2.5 space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-slate-100" />
                  <div className="h-1.5 w-5/6 rounded-full bg-slate-100" />
                  <div className="h-1.5 w-full rounded-full bg-slate-100" />
                  <div className="h-1.5 w-4/5 rounded-full bg-slate-100" />
                  <div className="h-1.5 w-3/4 rounded-full bg-slate-100" />
                </div>
                <div className="flex items-center gap-1.5 px-3 pb-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[9px] text-slate-400">AI-generated · tailored to JD</span>
                </div>
              </div>
            </button>
            </CandidateToolGlareCard>

            {/* Row 3 — AI Career Coach */}
            <CandidateToolGlareCard>
            <button type="button" onClick={() => onNavigate?.('career-coach')}
              className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-blue-100 p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)' }}>
              <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 group-hover:bg-blue-200"><ArrowRight size={14} className="text-blue-600" /></div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-200/60"><Bot size={18} className="text-blue-700" strokeWidth={1.8} /></span>
              <h3 className="mt-3 text-base font-bold text-slate-900">AI Career Coach</h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">Get guidance, role suggestions, and next steps.</p>
              <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-md">
                <div className="bg-blue-500 px-3 py-1.5 flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-white/30 flex items-center justify-center"><Bot size={9} className="text-white" /></div>
                  <span className="text-[10px] font-bold text-white">Zync AI Coach</span>

                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-green-300 animate-pulse" />
                </div>
                <div className="p-2.5 space-y-2">
                  <div className="flex gap-1.5">
                    <div className="h-5 w-5 shrink-0 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">U</div>
                    <div className="rounded-xl rounded-tl-none bg-slate-100 px-2 py-1.5 text-[9px] text-slate-700">What roles suit my skills?</div>
                  </div>
                  <div className="flex gap-1.5 justify-end">
                    <div className="rounded-xl rounded-tr-none bg-blue-600 px-2 py-1.5 text-[9px] text-white">Try Product Manager or UX Lead →</div>
                    <div className="h-5 w-5 shrink-0 rounded-full bg-blue-600 flex items-center justify-center text-[8px] font-bold text-white">AI</div>
                  </div>
                </div>
              </div>
            </button>
            </CandidateToolGlareCard>

            {/* Row 4 — Interview Prep (col-span-2) */}
            <CandidateToolGlareCard className="lg:col-span-2">
            <button type="button" onClick={() => onNavigate?.('interview-tips')}
              className="group relative flex h-full w-full overflow-hidden rounded-3xl p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 55%, #3b82f6 100%)' }}>
              <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 group-hover:bg-white/30"><ArrowRight size={14} className="text-white" /></div>
              <div className="flex-1 min-w-0">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20"><MessageSquareText size={20} className="text-white" strokeWidth={1.8} /></span>
                <h3 className="mt-3 text-lg font-bold text-white">Interview Prep</h3>
                <p className="mt-1 text-sm leading-6 text-indigo-100">Practice questions and tips before meeting an employer.</p>
              </div>
              {/* mini interview UI */}
              <div className="ml-4 w-2/5 overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm">
                <div className="border-b border-white/10 px-3 py-2">
                  <span className="text-[10px] font-bold text-white">Practice Session</span>
                </div>
                <div className="p-2.5 space-y-1.5">
                  {[{ q: 'Tell me about yourself', done: true }, { q: 'Why this role?', done: true }, { q: 'Your biggest strength?', done: false }, { q: 'Where do you see yourself?', done: false }].map(item => (
                    <div key={item.q} className="flex items-start gap-2">
                      <div className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full flex items-center justify-center ${item.done ? 'bg-green-400' : 'bg-white/20'}`}>
                        {item.done && <span className="text-[8px] text-white font-bold">✓</span>}
                      </div>
                      <span className={`text-[9px] leading-4 ${item.done ? 'text-white/60 line-through' : 'text-white/90'}`}>{item.q}</span>
                    </div>
                  ))}
                </div>
              </div>
            </button>
            </CandidateToolGlareCard>

            {/* Row 4 — Skill Check */}
            <CandidateToolGlareCard>
            <button type="button" onClick={() => onNavigate?.('skill-assessment')}
              className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-blue-100 p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)' }}>
              <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 group-hover:bg-blue-200"><ArrowRight size={14} className="text-blue-600" /></div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-200/60"><CheckCircle2 size={18} className="text-blue-700" strokeWidth={1.8} /></span>
              <h3 className="mt-3 text-base font-bold text-slate-900">Skill Check</h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">Validate your knowledge with assessments.</p>
              <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-md">
                <div className="bg-blue-600 px-3 py-1.5 flex justify-between">
                  <span className="text-[10px] font-bold text-white">Your Scores</span>
                  <span className="text-[10px] text-blue-200">4 completed</span>
                </div>
                <div className="p-2.5 space-y-1.5">
                  {[{ l: 'React', s: 92, c: 'bg-blue-500' }, { l: 'SQL', s: 78, c: 'bg-blue-400' }, { l: 'Python', s: 65, c: 'bg-indigo-500' }, { l: 'AWS', s: 55, c: 'bg-blue-300' }].map(a => (
                    <div key={a.l} className="flex items-center gap-2">
                      <span className="w-10 text-[9px] font-semibold text-slate-600">{a.l}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full rounded-full ${a.c}`} style={{ width: `${a.s}%` }} /></div>
                      <span className="text-[9px] font-bold text-slate-700">{a.s}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </button>
            </CandidateToolGlareCard>

        </div>
        </div>
      </section>

      {/* ── From Search to Offer — accordion hover cards ── */}
      <section className="border-y border-slate-100 bg-slate-50/70 py-16 sm:py-20" aria-labelledby="candidate-job-tools-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* header row */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">From search to offer</p>
              <h2 id="candidate-job-tools-title" className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Keep your job search moving
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                Find relevant roles, save the ones you like, and keep track of every application.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.('job-listings', { clearFilters: true })}
              className="group inline-flex w-fit shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Browse all jobs
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* accordion hover cards */}
          <AccordionCards onNavigate={onNavigate} />

        </div>
      </section>
    </>
  );
};

export default CandidateFeaturesSection;
