import React from 'react';
import {
  ArrowRight,
  Bookmark,
  Briefcase,
  Bot,
  CheckCircle2,
  FileText,
  Mail,
  MessageSquareText,
  Send,
  Sparkles,
  Target,
  Upload,
  UserRound,
  Wand2,
} from 'lucide-react';

type CandidateFeaturesSectionProps = {
  onNavigate?: (page: string, params?: { tab?: string; clearFilters?: boolean }) => void;
};

const resumeTools = [
  {
    title: 'Resume Builder',
    description: 'Create an ATS-friendly resume with guided sections, professional templates, and editing tools.',
    icon: FileText,
    action: 'resume-studio',
    cta: 'Build your resume',
    tone: 'blue',
  },
  {
    title: 'Resume Parser',
    description: 'Upload a resume to extract your experience, education, and skills into your profile.',
    icon: Upload,
    action: 'resume-parser',
    cta: 'Parse a resume',
    tone: 'violet',
  },
  {
    title: 'AI Resume Analysis',
    description: 'Check your resume score, see where it can improve, and get feedback for your next application.',
    icon: Sparkles,
    action: 'resume-score',
    cta: 'Analyze your resume',
    tone: 'amber',
  },
  {
    title: 'JD-Based Resume Optimization',
    description: 'Tailor your resume to a job description with AI suggestions for relevant wording and keywords.',
    icon: Wand2,
    action: 'resume-builder',
    cta: 'Optimize your resume',
    tone: 'violet',
  },
  {
    title: 'AI Skill Gap Analysis',
    description: 'Compare your resume with a target role to identify skills you may want to develop.',
    icon: Target,
    action: 'skill-gap-analysis',
    cta: 'Check skill gaps',
    tone: 'blue',
  },
  {
    title: 'AI Cover Letter',
    description: 'Draft a role-specific cover letter using details from your resume and the job you want.',
    icon: Mail,
    action: 'resume-builder',
    cta: 'Create a cover letter',
    tone: 'amber',
  },
  {
    title: 'AI Career Coach',
    description: 'Get career guidance, role suggestions, and practical next steps based on your goals.',
    icon: Bot,
    action: 'career-coach',
    cta: 'Talk to career coach',
    tone: 'blue',
  },
  {
    title: 'Interview Preparation',
    description: 'Practice interview questions and review practical tips before meeting an employer.',
    icon: MessageSquareText,
    action: 'interview-tips',
    cta: 'Prepare for interviews',
    tone: 'violet',
  },
  {
    title: 'Skill Check',
    description: 'Take skill assessments to validate your knowledge and showcase your strengths.',
    icon: CheckCircle2,
    action: 'skill-assessment',
    cta: 'Explore assessments',
    tone: 'amber',
  },
];

const jobSearchTools = [
  {
    title: 'Easy Apply',
    description: 'Apply to suitable openings using your saved profile and resume.',
    icon: Send,
    action: 'job-listings',
    params: { clearFilters: true },
  },
  {
    title: 'Profile Management',
    description: 'Keep your skills, experience, and education up to date in one place.',
    icon: UserRound,
    action: 'dashboard',
  },
  {
    title: 'Job Recommendations',
    description: 'Explore roles selected around your skills and career interests.',
    icon: Target,
    action: 'job-listings',
    params: { tab: 'recommended', clearFilters: true },
  },
  {
    title: 'Saved Jobs',
    description: 'Save interesting openings and come back to them when you are ready.',
    icon: Bookmark,
    action: 'my-jobs',
  },
  {
    title: 'Application Tracking',
    description: 'Review the roles you have applied to and follow your application progress.',
    icon: Briefcase,
    action: 'my-applications',
  },
];

const CandidateFeaturesSection: React.FC<CandidateFeaturesSectionProps> = ({ onNavigate }) => (
  <>
    <section className="candidate-home-tools-section bg-[#f6f8fc] py-16 sm:py-20" aria-labelledby="candidate-resume-tools-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Your career toolkit</p>
          <h2 id="candidate-resume-tools-title" className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">AI tools to help you move forward</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Build and improve your resume, explore skill gaps, prepare applications, and get career guidance.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {resumeTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <article key={tool.title} className="group flex min-h-[250px] flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg sm:p-7">
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${tool.tone === 'blue' ? 'bg-blue-50 text-blue-600' : tool.tone === 'violet' ? 'bg-violet-50 text-violet-600' : 'bg-amber-50 text-amber-600'}`}>
                  <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{tool.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{tool.description}</p>
                <button type="button" onClick={() => onNavigate?.(tool.action)} className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-semibold text-blue-700 transition group-hover:text-blue-800">
                  {tool.cta}<ArrowRight size={16} aria-hidden="true" />
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>

    <section className="candidate-home-job-tools-section bg-white py-16 sm:py-20" aria-labelledby="candidate-job-tools-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-9 flex flex-col justify-between gap-4 sm:mb-11 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-orange-600">From search to offer</p>
            <h2 id="candidate-job-tools-title" className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Keep your job search moving</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">Find relevant roles, save the ones you like, and keep track of every application.</p>
          </div>
          <button type="button" onClick={() => onNavigate?.('job-listings', { clearFilters: true })} className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
            Browse all jobs<ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {jobSearchTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button key={tool.title} type="button" onClick={() => onNavigate?.(tool.action, tool.params)} className="group flex min-h-[190px] flex-col items-start rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-md">
                <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition group-hover:bg-blue-100 group-hover:text-blue-700">
                  <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="font-semibold text-slate-900">{tool.title}</span>
                <span className="mt-2 flex-1 text-sm leading-5 text-slate-600">{tool.description}</span>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700">Explore feature<ArrowRight size={14} aria-hidden="true" /></span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  </>
);

export default CandidateFeaturesSection;
