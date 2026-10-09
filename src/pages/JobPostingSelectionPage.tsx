import React from 'react';
import BackButton from '../components/BackButton';
import { Pencil, Sparkles, Upload, ArrowRight, CheckCircle2, Briefcase, BookOpen, MapPin, ListChecks, FileText, Zap, Wallet } from 'lucide-react';

interface JobPostingSelectionPageProps {
  onNavigate: (page: string, options?: any) => void;
  user?: any;
}

const bulkSteps = [
  'Upload CSV file',
  'AI parses every JD automatically',
  'Preview, edit & validate all jobs',
  'Bulk publish in one click',
  'Jobs go live instantly',
];

const bulkFeatures = [
  'Parse 100+ JDs in minutes',
  'AI extracts title, skills, salary & more',
  'Edit & fix any job before publishing',
];

const manualSteps = [
  'Fill in job title, location & company',
  'Set job type, pay & benefits',
  'Add skills & qualifications',
  'Write or AI-generate job description',
  'Review & publish',
];

const parseSteps = [
  'Paste your existing job description',
  'AI extracts title, skills, salary & more',
  'Review and edit auto-filled fields',
  'Confirm details & publish instantly',
  'Job goes live & reaches candidates',
];

const manualFeatures = [
  'AI-powered job title & skill suggestions',
  'Auto-generate job description with AI',
  'Real-time salary benchmarking tips',
];

const parseFeatures = [
  'Auto-extract skills, salary & experience',
  'Saves up to 80% of posting time',
  'Supports PDF, Word & plain text',
];


const JobPostingSelectionPage: React.FC<JobPostingSelectionPageProps> = ({ onNavigate }) => {
  const methods = [
    { id: 'manual', title: 'Manual Creation', subtitle: 'Step-by-step guided form', icon: Pencil, steps: manualSteps, features: manualFeatures, tag: 'Full Control', badge: '', action: () => { localStorage.removeItem('editJobData'); onNavigate('job-posting', { mode: 'manual' }); } },
    { id: 'ai', title: 'Parse Job Details', subtitle: 'Auto-extract with AI', icon: Sparkles, steps: parseSteps, features: parseFeatures, tag: 'Fastest Way', badge: 'AI', action: () => { localStorage.removeItem('editJobData'); onNavigate('job-parsing'); } },
    { id: 'bulk', title: 'Bulk Import', subtitle: 'Import 100s of jobs at once', icon: Upload, steps: bulkSteps, features: bulkFeatures, tag: 'Recruiters & Agencies', badge: 'NEW', action: () => onNavigate('bulk-job-import') },
  ];
  const practices = [
    { icon: BookOpen, title: 'Clear Job Title', description: 'Standard titles get 3x more views.' },
    { icon: Wallet, title: 'Include Salary Range', description: '30% more applications with salary info.' },
    { icon: MapPin, title: 'Specify Location', description: 'Remote jobs get 200% more reach.' },
    { icon: ListChecks, title: 'List Key Skills', description: 'Limit to 5-8 must-have skills.' },
    { icon: FileText, title: 'Optimal Description', description: '300-600 words performs best.' },
    { icon: Zap, title: 'Post Quickly', description: 'Jobs posted fast fill 2x faster.' },
  ];
  return (
    <div className="job-creation-selection employer-content-page min-h-screen">
      <main className="job-selection-container portal-page-container">
        <div className="job-selection-back"><BackButton onClick={() => onNavigate('dashboard')} text="Back to dashboard" /></div>
        <header className="job-selection-heading">
          <span className="job-selection-heading-icon"><Briefcase size={24} aria-hidden="true" /></span>
          <div><p className="job-selection-eyebrow">JOB POSTING</p><h1>Create New Job</h1><p>Choose how you'd like to post your job</p></div>
        </header>
        <section aria-label="Choose a job posting method" className="job-selection-methods">
          {methods.map(({ id, title, subtitle, icon: Icon, steps, features, tag, badge, action }) => (
            <article key={id} data-method={id} className="job-selection-card" aria-labelledby={`job-method-${id}`}>
              <div className="job-selection-card-top"><span className="job-selection-method-icon"><Icon size={24} aria-hidden="true" /></span>{badge && <span className="job-selection-badge">{badge}</span>}</div>
              <h2 id={`job-method-${id}`}>{title}</h2>
              <p className="job-selection-subtitle">{subtitle}</p>
              <ol className="job-selection-steps">
                {steps.map((step, index) => <li key={step}><span aria-hidden="true">{index + 1}</span><p>{step}</p></li>)}
              </ol>
              <ul className="job-selection-features">{features.map(feature => <li key={feature}><CheckCircle2 size={15} aria-hidden="true" /><span>{feature}</span></li>)}</ul>
              <div className="job-selection-card-action"><span>{tag}</span><button type="button" onClick={action} aria-label={`Get started with ${title}`}>Get Started <ArrowRight size={16} aria-hidden="true" /></button></div>
            </article>
          ))}
        </section>
        <section className="job-selection-practices" aria-labelledby="job-practices-title">
          <div className="job-selection-practices-heading"><BookOpen size={19} aria-hidden="true" /><h2 id="job-practices-title">Job Posting Best Practices</h2></div>
          <div className="job-selection-practices-grid">{practices.map(({ icon: Icon, title, description }) => <article key={title}><Icon size={20} aria-hidden="true" /><div><h3>{title}</h3><p>{description}</p></div></article>)}</div>
        </section>
        <div className="job-selection-stats" aria-label="Job posting insights">
          {[{ value: '23 days', label: 'Avg. time to hire' }, { value: '+30%', label: 'More apps with salary' }, { value: '+200%', label: 'Reach with remote' }, { value: '80%', label: 'Time saved with parsing' }].map(({ value, label }) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
        </div>
      </main>
    </div>
  );
};

export default JobPostingSelectionPage;
