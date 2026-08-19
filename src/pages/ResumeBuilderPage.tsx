import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Save, Undo2, Redo2, Download, FileText, Briefcase, GraduationCap,
  User, Sparkles, Award, FolderOpen, Wrench, ChevronLeft, ChevronRight,
  FileDown, Send, PenLine, Languages, Trophy, LayoutList, Star, Mail,
  UserCircle, BookOpen, WrenchIcon, BarChart3, Palette, Copy, Plus,
  Loader2, RefreshCw, WifiOff, CheckCircle2, Circle, AlertTriangle,
  Search, ArrowRight, CheckCheck, TrendingUp, MessageSquare,
  Eye, EyeOff, Upload,
} from 'lucide-react';

const AI_BASE = import.meta.env.VITE_AI_API_URL || '/api/ai-proxy';
import TemplateSelection from '../components/resume-builder/TemplateSelection';
import PersonalInfoStep from '../components/resume-builder/PersonalInfoStep';
import SummaryStep from '../components/resume-builder/SummaryStep';
import ExperienceStep from '../components/resume-builder/ExperienceStep';
import EducationStep from '../components/resume-builder/EducationStep';
import SkillsStep from '../components/resume-builder/SkillsStep';
import AISuggestionsStep from '../components/resume-builder/AISuggestionsStep';
import SkillGapLearning from '../components/resume-builder/SkillGapLearning';
import CertificationsAwardsStep from '../components/resume-builder/CertificationsAwardsStep';
import ProjectsStep from '../components/resume-builder/ProjectsStep';
import LanguagesStep from '../components/resume-builder/LanguagesStep';
import AchievementsStep from '../components/resume-builder/AchievementsStep';
import CustomSectionsStep from '../components/resume-builder/CustomSectionsStep';
import ResumeScoreStep from '../components/resume-builder/ResumeScoreStep';
import CoverLetterStep from '../components/resume-builder/CoverLetterStep';
import AIInterviewStep from '../components/resume-builder/AIInterviewStep';
import AISuggestionsPanel from '../components/resume-builder/AISuggestionsPanel';
import AskAIWidget from '../components/resume-builder/AskAIWidget';
import WelcomeWizard from '../components/resume-builder/WelcomeWizard';
import RightPanel from '../components/resume-builder/RightPanel';
import { useResumeStore, ResumeData } from '../store/useResumeStore';
import AutocompleteCombobox from '../components/AutocompleteCombobox';

interface Props {
  onNavigate?: (page: string) => void;
  user?: any;
  onLogout?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  component: React.ComponentType<any>;
  section: string;
}

const NAV: NavItem[] = [
  { id: 'personal',   label: 'Personal',        icon: User,        component: PersonalInfoStep,        section: 'Profile' },
  { id: 'experience', label: 'Experience',       icon: Briefcase,   component: ExperienceStep,         section: 'Content' },
  { id: 'education',  label: 'Education',        icon: GraduationCap, component: EducationStep,       section: 'Content' },
  { id: 'projects',   label: 'Projects',         icon: FolderOpen,  component: ProjectsStep,           section: 'Content' },
  { id: 'skills',     label: 'Skills',           icon: Wrench,      component: SkillsStep,             section: 'Content' },
  { id: 'certs',      label: 'Certifications',   icon: Award,       component: CertificationsAwardsStep, section: 'Enhance' },
  { id: 'languages',  label: 'Languages',        icon: Languages,   component: LanguagesStep,          section: 'Enhance' },
  { id: 'achievements',label: 'Achievements',    icon: Trophy,      component: AchievementsStep,       section: 'Enhance' },
  { id: 'custom',     label: 'Custom Sections',  icon: LayoutList,  component: CustomSectionsStep,     section: 'Enhance' },
  { id: 'summary',    label: 'Summary',          icon: PenLine,     component: SummaryStep,            section: 'Enhance' },
  { id: 'score',      label: 'Resume Score',     icon: Star,        component: ResumeScoreStep,        section: 'Analyze' },
  { id: 'cover',      label: 'Cover Letter',     icon: Mail,        component: CoverLetterStep,        section: 'Analyze' },
  { id: 'ai',         label: 'AI Optimize',      icon: Sparkles,    component: AISuggestionsStep,      section: 'Analyze' },
  { id: 'skills-gap', label: 'Skill Gap',        icon: TrendingUp,  component: SkillGapLearning,       section: 'Analyze' },
  { id: 'template',   label: 'Templates',        icon: FileText,    component: TemplateSelection,      section: 'Design' },
];

const QUICK_APPLY_STEPS = [
  { id: 'choose-job',   label: 'Choose Job',        icon: Search,      desc: 'Pick a target job' },
  { id: 'review',       label: 'Review Resume',     icon: FileText,    desc: 'Check your resume is ready' },
  { id: 'optimize',     label: 'AI Optimize',       icon: Sparkles,    desc: 'Match resume to job' },
  { id: 'score',        label: 'ATS Score',         icon: Star,        desc: 'Check ATS compatibility' },
  { id: 'cover-letter', label: 'Cover Letter',      icon: Mail,        desc: 'Generate cover letter' },
  { id: 'apply',        label: 'Apply',             icon: Send,        desc: 'Submit application' },
];

const ROLE_PRESETS: Record<string, { summary: string; skills: string[] }> = {
  'Software Engineer': { summary: 'Results-driven Software Engineer with expertise in designing, developing, and maintaining scalable applications. Proficient in modern programming languages and frameworks with a strong focus on clean code and best practices.', skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Git', 'SQL', 'REST APIs', 'Docker'] },
  'Frontend Developer': { summary: 'Creative Frontend Developer skilled in building responsive, user-friendly web applications. Experienced with modern JavaScript frameworks and passionate about delivering exceptional user experiences.', skills: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Tailwind CSS', 'Git', 'REST APIs'] },
  'Backend Developer': { summary: 'Experienced Backend Developer specializing in building robust, scalable server-side applications and APIs. Strong foundation in database design, microservices architecture, and cloud services.', skills: ['Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'REST APIs', 'Docker', 'AWS', 'Git', 'Redis'] },
  'Full Stack Developer': { summary: 'Versatile Full Stack Developer with comprehensive experience across frontend and backend technologies. Adept at building complete web applications from concept to deployment.', skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'Docker', 'AWS', 'Git'] },
  'DevOps Engineer': { summary: 'DevOps Engineer focused on automating infrastructure, streamlining CI/CD pipelines, and improving system reliability. Experienced with cloud platforms and containerization technologies.', skills: ['Docker', 'Kubernetes', 'AWS', 'Azure', 'CI/CD', 'Jenkins', 'Terraform', 'Linux', 'Git', 'Python'] },
  'Data Engineer': { summary: 'Data Engineer experienced in building and maintaining data pipelines, ETL processes, and data warehouse solutions. Skilled in optimizing data flows for analytics and machine learning.', skills: ['Python', 'SQL', 'Apache Spark', 'Airflow', 'AWS', 'PostgreSQL', 'Kafka', 'Snowflake', 'Git'] },
  'Data Scientist': { summary: 'Data Scientist with strong analytical skills and experience in machine learning, statistical modeling, and data visualization. Passionate about extracting actionable insights from complex datasets.', skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'Pandas', 'NumPy', 'Statistics', 'Data Visualization', 'Git'] },
  'AI Engineer': { summary: 'AI Engineer specializing in developing and deploying machine learning models and AI-powered solutions. Experienced with LLMs, NLP, computer vision, and MLOps practices.', skills: ['Python', 'Machine Learning', 'Deep Learning', 'NLP', 'TensorFlow', 'PyTorch', 'LLMs', 'Docker', 'Git'] },
  'Product Manager': { summary: 'Strategic Product Manager with a track record of delivering user-centric products. Skilled in roadmap planning, stakeholder management, and cross-functional team leadership.', skills: ['Product Strategy', 'Roadmapping', 'User Research', 'Agile', 'Data Analysis', 'A/B Testing', 'Jira', 'Figma'] },
  'UI/UX Designer': { summary: 'User-centered UI/UX Designer with expertise in creating intuitive digital experiences. Proficient in design thinking, wireframing, prototyping, and user research methodologies.', skills: ['Figma', 'Sketch', 'Adobe XD', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems', 'HTML', 'CSS'] },
  'Project Manager': { summary: 'Accomplished Project Manager with expertise in leading cross-functional teams, managing budgets, and delivering projects on time. Adept at Agile and Waterfall methodologies.', skills: ['Project Management', 'Agile', 'Scrum', 'Jira', 'Risk Management', 'Budgeting', 'Stakeholder Management', 'MS Project'] },
  'Business Analyst': { summary: 'Detail-oriented Business Analyst skilled in requirements gathering, process improvement, and data-driven decision making. Bridging the gap between business needs and technical solutions.', skills: ['Requirements Analysis', 'SQL', 'Data Analysis', 'Process Mapping', 'Jira', 'Agile', 'Excel', 'Tableau'] },
  'QA Engineer': { summary: 'Meticulous QA Engineer experienced in manual and automated testing. Skilled in test planning, bug tracking, and ensuring software quality across the development lifecycle.', skills: ['Selenium', 'Test Automation', 'Manual Testing', 'Jira', 'Postman', 'API Testing', 'Cypress', 'Git', 'Python'] },
  'Mobile Developer': { summary: 'Mobile Developer experienced in building cross-platform and native mobile applications. Passionate about creating smooth, performant mobile experiences.', skills: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'JavaScript', 'TypeScript', 'Firebase', 'Git', 'REST APIs'] },
  'Cloud Architect': { summary: 'Cloud Architect specializing in designing scalable, secure, and cost-effective cloud solutions. Deep expertise in multi-cloud environments and infrastructure modernization.', skills: ['AWS', 'Azure', 'GCP', 'Terraform', 'Docker', 'Kubernetes', 'Microservices', 'Security', 'Python'] },
  'Cybersecurity Analyst': { summary: 'Cybersecurity Analyst focused on protecting systems and data through threat detection, vulnerability assessment, and security best practices. Committed to maintaining robust security postures.', skills: ['Network Security', 'Ethical Hacking', 'SIEM', 'Risk Assessment', 'Python', 'Linux', 'Firewalls', 'Incident Response'] },
  'Machine Learning Engineer': { summary: 'Machine Learning Engineer experienced in designing and deploying ML models at scale. Proficient in MLOps, model optimization, and productionizing AI solutions.', skills: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'MLOps', 'Docker', 'AWS', 'SQL', 'Git'] },
  'Systems Analyst': { summary: 'Systems Analyst skilled in evaluating and improving IT systems to meet business objectives. Experienced in system design, integration, and optimization.', skills: ['System Analysis', 'SQL', 'UML', 'Process Modeling', 'Jira', 'Testing', 'Documentation', 'Python'] },
};

const GOAL_PRESETS: Record<string, { summaryPrefix: string; skills: string[] }> = {
  'first-job': {
    summaryPrefix: 'Motivated and detail-oriented recent graduate',
    skills: ['Team Collaboration', 'Communication', 'Problem Solving', 'Fast Learner', 'Time Management'],
  },
  'internship': {
    summaryPrefix: 'Enthusiastic and eager to learn',
    skills: ['Quick Learner', 'Teamwork', 'Communication', 'Adaptability', 'Problem Solving'],
  },
  'career-switch': {
    summaryPrefix: 'Career-driven professional with transferable expertise',
    skills: ['Adaptability', 'Transferable Skills', 'Cross-functional Collaboration', 'Problem Solving', 'Communication'],
  },
  'experienced': {
    summaryPrefix: 'Seasoned professional with a proven track record',
    skills: ['Leadership', 'Strategic Planning', 'Cross-functional Collaboration', 'Mentoring', 'Stakeholder Management'],
  },
  'executive': {
    summaryPrefix: 'Visionary executive with extensive experience leading organizations',
    skills: ['Executive Leadership', 'Strategic Vision', 'Board Governance', 'Organizational Development', 'C-suite Communication'],
  },
};

export default function ResumeBuilderPage({ onNavigate, user }: Props) {
  const [activeId, setActiveId] = useState(() => sessionStorage.getItem('rb_activeId') || 'personal');

  // Persist active step across refresh
  const setActiveIdPersisted = React.useCallback((id: string) => {
    sessionStorage.setItem('rb_activeId', id);
    setActiveId(id);
  }, []);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dropHandledRef = useRef(0);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardStart, setWizardStart] = useState('');
  const [wizardGoal, setWizardGoal] = useState('');
  const [wizardRole, setWizardRole] = useState('');
  const [mode, setMode] = useState<'editor' | 'quick-apply'>('editor');
  const [qaStep, setQaStep] = useState(0);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('applied_jobs') || '[]'); } catch { return []; }
  });
  const [applying, setApplying] = useState(false);

  const [aiMode, setAiMode] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAskAI, setShowAskAI] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [, setTriggerLinkedin] = useState(false);
  const [applied, setApplied] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data, update, updatePersonalInfo, touchSave, toggleSection, undo, redo, canUndo, canRedo, pushHistory } = useResumeStore();
  const completeness = [!!data.summary, data.experience.length > 0, data.skills.length > 0, data.education.length > 0].filter(Boolean).length;

  const { lastSaved: _ls, ...dataWithoutLastSaved } = data;
  const dataHash = JSON.stringify(dataWithoutLastSaved);
  const prevDataHash = useRef(dataHash);
  
  const profilePrefilledRef = useRef(false);
  const processResumeFileRef = useRef<(file: File) => Promise<void>>();

  useEffect(() => {
    const handler = (e: any) => { if (e.detail?.file) processResumeFileRef.current?.(e.detail.file); };
    window.addEventListener('zync:import-resume', handler);
    return () => window.removeEventListener('zync:import-resume', handler);
  }, []);

  // Push history on section change
  const prevActiveId = useRef(activeId);
  useEffect(() => {
    if (prevActiveId.current !== activeId) {
      pushHistory();
      prevActiveId.current = activeId;
    }
  }, [activeId]);

  // Push history on data changes (debounced)
  const historyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevDataForHistory = useRef<string | null>(null);
  useEffect(() => {
    if (prevDataForHistory.current === null) { prevDataForHistory.current = dataHash; return; }
    if (dataHash === prevDataForHistory.current) return;
    prevDataForHistory.current = dataHash;
    if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
    historyDebounceRef.current = setTimeout(() => { pushHistory(); }, 1500);
    return () => { if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current); };
  }, [dataHash]);
  useEffect(() => {
    if (selectedJob && qaStep === 0) {
      const t = setTimeout(() => setQaStep(1), 350);
      return () => clearTimeout(t);
    }
  }, [selectedJob]);

  useEffect(() => {
    if (qaStep === 1 && completeness >= 4) {
      const t = setTimeout(() => setQaStep(2), 500);
      return () => clearTimeout(t);
    }
  }, [qaStep, completeness]);

  // Resume versioning with per-version data persistence
  const VERSIONS_KEY = 'zyncjobs-resume-versions';
  const VERSION_DATA_PREFIX = 'zyncjobs-resume-v-';
  
  const getSavedVersions = (): string[] => {
    try { return JSON.parse(localStorage.getItem(VERSIONS_KEY) || '[]'); } catch { return []; }
  };
  const saveVersionList = (list: string[]) => { try { localStorage.setItem(VERSIONS_KEY, JSON.stringify(list)); } catch {} };
  const loadVersionData = (versionName: string) => {
    try {
      const raw = localStorage.getItem(VERSION_DATA_PREFIX + versionName);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  };
  const persistCurrentVersion = (versionName: string) => {
    try { localStorage.setItem(VERSION_DATA_PREFIX + versionName, JSON.stringify(data)); } catch {}
  };

  // Load profile courses as resume versions when profile is available
    const [versions, setVersions] = useState<string[]>(() => {
    const profile = JSON.parse(localStorage.getItem('user') || '{}');
    const profileCourses = profile?.courses || [];
    const courseVersions = profileCourses
      .map((c: any) => (typeof c === 'string' ? c : c?.title))
      .filter(Boolean);
    const savedVersions = getSavedVersions();
    const merged = [...new Set([...savedVersions, ...courseVersions])];
    const initial = merged.length > 0 ? merged : ['Master Resume'];
    return initial;
  });
  const [activeVersion, setActiveVersion] = useState<string>('Master Resume');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline' | 'syncing'>('saved');
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');

  // On mount, load active version data
  useEffect(() => {
    const saved = loadVersionData(activeVersion);
    if (saved && JSON.stringify(saved) !== JSON.stringify(data)) {
      Object.keys(saved).forEach((k) => update(k as any, saved[k]));
    }
  }, []);

  React.useEffect(() => {
    if (dataHash === prevDataHash.current) return;
    prevDataHash.current = dataHash;
    const savingTimer = setTimeout(() => setSaveStatus('saving'), 300);
    const saveTimer = setTimeout(() => {
      clearTimeout(savingTimer);
      try {
        touchSave();
        persistCurrentVersion(activeVersion);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('offline');
      }
    }, 800);
    return () => {
      clearTimeout(savingTimer);
      clearTimeout(saveTimer);
    };
  }, [dataHash]);

  

  // Prefill resume from profile API (only once, when resume is still default)
  React.useEffect(() => {
    if (!user?.email) return;
    if (profilePrefilledRef.current) return;
    const hasData = data.experience.length > 0 || data.education.length > 0 || data.skills.length > 0;
    if (hasData) return;
    const prefillKey = `resume_prefilled_${user.email}`;
    if (sessionStorage.getItem(prefillKey)) return;
    (async () => {
      if (!profilePrefilledRef.current) {
        profilePrefilledRef.current = true;
        try {
          const { apiFetch } = await import('../api/apiFetch');
          const { API_ENDPOINTS } = await import('../config/env');
          const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/profile/${encodeURIComponent(user.email)}`);
          if (!res.ok) return;
          const p: any = await res.json();

        // Skills
        if (Array.isArray(p.skills) && p.skills.length > 0) {
          update('skills', p.skills.filter((s: any) => typeof s === 'string'));
        }

        // Summary
        if (p.profileSummary) update('summary', p.profileSummary);

        // Experience from employment
        if (p.employment) {
          const empArray = typeof p.employment === 'string' ? (() => { try { return JSON.parse(p.employment); } catch { return []; } })() : p.employment;
          if (Array.isArray(empArray) && empArray.length > 0) {
            const mapped = empArray.map((e: any) => ({
              id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
              title: e.designation || e.title || e.role || '',
              company: e.companyName || e.company || '',
              location: e.location || '',
              duration: e.currentlyWorking
                ? `${e.startMonth || ''} ${e.startYear || ''} – Present`
                : `${e.startMonth || ''} ${e.startYear || ''} – ${e.endMonth || ''} ${e.endYear || ''}`,
              current: !!e.currentlyWorking,
              bullets: e.description ? [e.description] : [''],
            }));
            update('experience', mapped);
          }
        }

        // Education
        const eduItems: any[] = [];
        if (p.educationCollege && typeof p.educationCollege === 'object') {
          const ec = p.educationCollege;
          if (ec.college || ec.degree) {
            eduItems.push({
              id: Date.now().toString() + 'edu1',
              degree: ec.degree || '',
              institution: ec.college || '',
              location: '',
              duration: ec.passingYear ? `– ${ec.passingYear}` : '',
              grade: ec.percentage ? `${ec.percentage}%` : '',
            });
          }
        }
        if (p.educationClass12 && (p.educationClass12.school || p.educationClass12.board)) {
          const e12 = typeof p.educationClass12 === 'string' ? JSON.parse(p.educationClass12) : p.educationClass12;
          eduItems.push({
            id: Date.now().toString() + 'edu2',
            degree: 'Class XII',
            institution: e12.school || e12.board || '',
            location: '',
            duration: e12.year ? `– ${e12.year}` : '',
            grade: e12.percentage ? `${e12.percentage}%` : '',
          });
        }
        if (p.educationClass10 && (p.educationClass10.school || p.educationClass10.board)) {
          const e10 = typeof p.educationClass10 === 'string' ? JSON.parse(p.educationClass10) : p.educationClass10;
          eduItems.push({
            id: Date.now().toString() + 'edu3',
            degree: 'Class X',
            institution: e10.school || e10.board || '',
            location: '',
            duration: e10.year ? `– ${e10.year}` : '',
            grade: e10.percentage ? `${e10.percentage}%` : '',
          });
        }
        if (eduItems.length > 0) update('education', eduItems);

        // Certifications
        if (p.certifications) {
          const certs: any[] = [];
          const certArr = typeof p.certifications === 'string' ? (() => { try { return JSON.parse(p.certifications); } catch { return []; } })() : p.certifications;
          if (Array.isArray(certArr)) {
            certArr.forEach((c: any, i: number) => {
              if (typeof c === 'string') certs.push({ id: Date.now().toString() + 'cert' + i, name: c, issuer: '', year: '' });
              else if (c && typeof c === 'object') certs.push({ id: Date.now().toString() + 'cert' + i, name: c.name || '', issuer: c.issuer || '', year: c.year || c.date || '' });
            });
            if (certs.length > 0) update('certifications', certs);
          }
        }

        // Awards
        if (p.awards) {
          const awardArr = typeof p.awards === 'string' ? (() => { try { return JSON.parse(p.awards); } catch { return []; } })() : p.awards;
          if (Array.isArray(awardArr) && awardArr.length > 0) {
            const awards = awardArr.map((a: any, i: number) => ({
              id: Date.now().toString() + 'award' + i,
              title: typeof a === 'string' ? a : a.title || '',
              issuer: a.issuer || '',
              year: a.year || '',
              description: a.description || '',
            }));
            update('awards', awards);
          }
        }

        // Projects
        if (p.projects) {
          const projArr = typeof p.projects === 'string' ? (() => { try { return JSON.parse(p.projects); } catch { return []; } })() : p.projects;
          if (Array.isArray(projArr) && projArr.length > 0) {
            const projects = projArr.map((pr: any, i: number) => ({
              id: Date.now().toString() + 'proj' + i,
              name: typeof pr === 'string' ? pr : pr.name || pr.title || '',
              role: pr.role || '',
              duration: pr.duration || '',
              url: pr.url || '',
              bullets: pr.description ? [pr.description] : [''],
            }));
            update('projects', projects);
          }
        }

        // Languages
        if (p.languages) {
          const langArr = typeof p.languages === 'string' ? (() => { try { return JSON.parse(p.languages); } catch { return []; } })() : p.languages;
          if (Array.isArray(langArr) && langArr.length > 0) {
            const langs = langArr.map((l: any, i: number) => ({
              id: Date.now().toString() + 'lang' + i,
              language: typeof l === 'string' ? l : l.language || l.name || '',
              proficiency: (l.proficiency || 'Intermediate') as any,
            }));
            update('languages', langs);
          }
        }

        sessionStorage.setItem(prefillKey, '1');
      } catch { /* silent */ }
      profilePrefilledRef.current = true;
      }
    })();
  }, [user?.email]);

  // Fetch platform jobs for Quick Apply
  useEffect(() => {
    if (mode !== 'quick-apply') return;
    setJobsLoading(true);
    (async () => {
      try {
        const { apiFetch } = await import('../api/apiFetch');
        const { API_ENDPOINTS } = await import('../config/env');
        const res = await apiFetch(`${API_ENDPOINTS.BASE_URL}/jobs?limit=20&sort=-createdAt`);
        if (res.ok) {
          const body = await res.json();
          const list = Array.isArray(body) ? body : body?.data || body?.jobs || [];
          setJobs(list);
        }
      } catch { /* silent */ } finally { setJobsLoading(false); }
    })();
  }, [mode]);

  const applyForJob = async () => {
    if (!selectedJob) return;
    setApplying(true);
    setSubmitError('');
    try {
      const { apiFetch } = await import('../api/apiFetch');
      const { API_ENDPOINTS } = await import('../config/env');

      // 1. Save resume data to candidate profile so ranking/scoring picks it up
      const candidateEmail = data.personalInfo.email || '';
      const jobTitle = selectedJob.title || selectedJob.jobTitle || '';
      const candidateSkills = data.skills;
      const expText = data.experience.map(e => `${e.title} at ${e.company}${e.duration ? ` (${e.duration})` : ''}`).join('; ');
      const eduText = data.education.map(e => `${e.degree} at ${e.institution}`).join('; ');
      if (candidateEmail) {
        try {
          await apiFetch(`${API_ENDPOINTS.BASE_URL}/profile/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: candidateEmail,
              skills: candidateSkills,
              experience: expText,
              education: eduText,
              jobTitle,
              summary: data.summary,
            }),
          });
        } catch { /* profile save is best-effort */ }
      }

      // 2. Generate & upload HTML resume so employer can view it
      let resumeUrl = 'resume_from_quick_apply';
      try {
        const { S3Service } = await import('../services/s3Service');
        const html = buildResumeHTML(data);
        const blob = new Blob([html], { type: 'text/html' });
        const file = new File([blob], `${data.personalInfo.name || 'resume'}.html`, { type: 'text/html' });
        const uploadRes = await S3Service.uploadResumeToS3(file);
        if (uploadRes.success && uploadRes.fileUrl) {
          resumeUrl = uploadRes.fileUrl;
        }
      } catch { /* upload is best-effort */ }

      // 3. Submit the application
      const payload = {
        jobId: selectedJob.id || selectedJob._id,
        candidateName: data.personalInfo.name || '',
        candidateEmail,
        candidatePhone: data.personalInfo.phone || '',
        resumeUrl,
        candidateExperience: expText,
        candidateEducation: eduText,
        skills: candidateSkills,
        candidateSkills,
        summary: data.summary,
        jobTitle,
        jobDescription: selectedJob.description || selectedJob.jobDescription || '',
        candidateProfile: {
          skills: candidateSkills,
          experience: expText,
          education: eduText,
          jobTitle,
        },
      };
      const res = await apiFetch(`${API_ENDPOINTS.APPLICATIONS}`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setApplied(true);
        const jid = selectedJob.id || selectedJob._id;
        const newApplied = [...new Set([...appliedJobs, jid])];
        setAppliedJobs(newApplied);
        localStorage.setItem('applied_jobs', JSON.stringify(newApplied));
      } else {
        const body = await res.text().catch(() => '');
        let msg = `Server returned ${res.status}`;
        try { const j = JSON.parse(body); msg = j.message || j.error || msg; } catch {}
        setSubmitError(msg);
      }
    } catch (e: any) {
      setSubmitError(e?.message || 'Network error — could not reach server');
    } finally { setApplying(false); }
  };

  const GOAL_HIDDEN_SECTIONS: Record<string, string[]> = {
    'first-job': ['certs', 'languages', 'custom'],
    'internship': ['certs', 'languages', 'custom'],
    'career-switch': ['languages'],
    'experienced': ['languages'],
    'executive': ['projects', 'languages'],
  };

  const GOAL_SECTION_ORDER: Record<string, string[]> = {
    'first-job':    ['personal', 'education', 'projects', 'skills', 'summary', 'experience', 'certs', 'languages', 'achievements', 'custom', 'score', 'cover', 'ai', 'skills-gap', 'template'],
    'internship':   ['personal', 'education', 'projects', 'skills', 'summary', 'experience', 'certs', 'languages', 'achievements', 'custom', 'score', 'cover', 'ai', 'skills-gap', 'template'],
    'career-switch':['personal', 'summary', 'skills', 'projects', 'experience', 'education', 'certs', 'languages', 'achievements', 'custom', 'score', 'cover', 'ai', 'skills-gap', 'template'],
    'experienced':  ['personal', 'experience', 'skills', 'achievements', 'summary', 'education', 'projects', 'certs', 'languages', 'custom', 'score', 'cover', 'ai', 'skills-gap', 'template'],
    'executive':    ['personal', 'summary', 'experience', 'achievements', 'certs', 'skills', 'education', 'projects', 'languages', 'custom', 'score', 'cover', 'ai', 'skills-gap', 'template'],
  };

  const orderedNav = useMemo(() => {
    const order = data.goal ? GOAL_SECTION_ORDER[data.goal] : undefined;
    if (!order) return NAV;
    const navMap = new Map(NAV.map(n => [n.id, n]));
    return order.map(id => navMap.get(id)).filter(Boolean) as NavItem[];
  }, [data.goal]);
  const active = orderedNav.find((n) => n.id === activeId) ?? orderedNav[0];
  const activeIdx = orderedNav.findIndex((n) => n.id === activeId);
  const ActiveComponent = active?.component ?? (() => null);

  const sections = [...new Set(orderedNav.map(n => n.section))];
  const sectionIcons: Record<string, any> = {
    Profile: UserCircle,
    Content: BookOpen,
    Enhance: WrenchIcon,
    Analyze: BarChart3,
    Design: Palette,
  };

  const processResumeFile = async (file: File) => {
    if (file.size < 100) {
      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'The uploaded resume is empty. Please upload a valid resume.' } }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'File size exceeds the maximum allowed limit of 5 MB.' } }));
      return;
    }
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    if (isPdf) {
      const buf = await file.slice(0, 5).arrayBuffer();
      const header = new Uint8Array(buf);
      const isPdfHeader = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46 && header[4] === 0x2D;
      if (!isPdfHeader) {
        window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Invalid or corrupted resume file. Please upload a valid PDF.' } }));
        return;
      }
    }
    setImportLoading(true);
    try {
      // Get AI token
      const tokenRes = await fetch(`${AI_BASE}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'ai_user', role: 'candidate' }),
      });
      let access_token: string | null = null;
      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        access_token = tokenData.access_token;
      }

      // Use parse-upload endpoint — backend handles OCR + LLM parsing, always fresh (no cache)
      const formData = new FormData();
      formData.append('file', file);
      const headers: Record<string, string> = {};
      if (access_token) headers['Authorization'] = `Bearer ${access_token}`;
      const resumeRes = await fetch(`${AI_BASE}/ai/resume/parse-upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!resumeRes.ok) {
        const errText = await resumeRes.text().catch(() => '');
        let errMsg = `Parse failed (${resumeRes.status})`;
        try { const j = JSON.parse(errText); errMsg = j.detail || j.error || errMsg; } catch {}
        throw new Error(errMsg);
      }
      const resumeData = await resumeRes.json();
      if (!resumeData.success) throw new Error(resumeData.error || 'Parse failed');
      const parsed = resumeData.parsed || {};
      if (parsed?.error) throw new Error(parsed.error);

      if (parsed.name) { updatePersonalInfo('name', parsed.name); update('resumeName', `${parsed.name}'s Resume`); }
      if (parsed.email) updatePersonalInfo('email', parsed.email);
      if (parsed.phone) updatePersonalInfo('phone', parsed.phone);
      if (parsed.location) updatePersonalInfo('location', parsed.location);
      if (parsed.linkedin) updatePersonalInfo('linkedin', parsed.linkedin);
      if (parsed.summary) update('summary', parsed.summary);

      const allSkills = [
        ...(Array.isArray(parsed.skills) ? parsed.skills : []),
        ...(Array.isArray(parsed.softSkills) ? parsed.softSkills : []),
        ...(Array.isArray(parsed.tools) ? parsed.tools : []),
      ];
      if (allSkills.length > 0) update('skills', allSkills);

      if (Array.isArray(parsed.certifications) && parsed.certifications.length > 0) {
        update('certifications', parsed.certifications.map((c: any) => ({
          id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
          name: c.name || c.title || '',
          issuer: c.provider || c.issuer || c.organization || '',
          year: c.date || c.year || '',
        })));
      }
      if (Array.isArray(parsed.educations) && parsed.educations.length > 0) {
        update('education', parsed.educations.map((e: any) => ({
          id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
          degree: e.degree || e.qualification || '',
          institution: e.school || e.institution || e.college || e.university || '',
          location: e.location || '',
          duration: e.date || e.duration || `${e.startYear || ''} – ${e.endYear || e.passingYear || ''}`.trim(),
          grade: e.grade || e.percentage || e.cgpa || '',
        })));
      }
      if (Array.isArray(parsed.projects) && parsed.projects.length > 0) {
        update('projects', parsed.projects.map((p: any) => ({
          id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
          name: p.name || p.title || '',
          role: p.role || '',
          duration: p.date || p.duration || '',
          url: p.url || '',
          bullets: Array.isArray(p.descriptions) ? p.descriptions
            : Array.isArray(p.bullets) ? p.bullets
            : p.description ? [p.description] : [],
        })));
      }
      if (Array.isArray(parsed.workExperiences) && parsed.workExperiences.length > 0) {
        update('experience', parsed.workExperiences.map((w: any) => ({
          id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
          title: w.jobTitle || w.title || w.role || '',
          company: w.company || w.organization || '',
          location: w.location || '',
          duration: w.date || w.duration || `${w.startDate || ''} – ${w.endDate || 'Present'}`.trim(),
          current: !!(w.current || w.currentlyWorking || w.endDate === 'Present'),
          bullets: Array.isArray(w.descriptions) ? w.descriptions
            : Array.isArray(w.bulletPoints) ? w.bulletPoints
            : Array.isArray(w.bullets) ? w.bullets
            : w.description ? [w.description] : [],
        })));
      }

      touchSave();
      pushHistory();
      setActiveIdPersisted('personal');
    } catch (e: any) {
      console.error('Import error:', e);
      if (e?.message?.includes('Failed to fetch') || e?.name === 'TypeError') {
        window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'Failed to process resume. Please try again.' } }));
      } else {
        window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: e?.message || 'Unable to read the uploaded resume. Please upload a valid PDF.' } }));
      }
    } finally {
      setImportLoading(false);
    }
  };

  processResumeFileRef.current = processResumeFile;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    dropHandledRef.current = Date.now();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.size < 100) {
      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'The uploaded resume is empty. Please upload a valid resume.' } }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      window.dispatchEvent(new CustomEvent('zync:alert', { detail: { message: 'File size exceeds the maximum allowed limit of 5 MB.' } }));
      return;
    }
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (allowed.includes(ext)) {
      processResumeFile(file);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processResumeFile(file);
    e.target.value = '';
  };

  const saveNote = 'Auto-saved to your browser. Resume data stays on this device.';

  const [pdfLoading, setPdfLoading] = useState(false);

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      const name = (data.personalInfo?.name || '').trim() || 'Resume';
      const { pdf, Document } = await import('@react-pdf/renderer');
      const { createElement } = await import('react');
      const { default: ResumePDFDocument } = await import('../components/resume-builder/ResumePDFDocument');
      const element = createElement(ResumePDFDocument, { data }) as unknown as React.ReactElement<React.ComponentProps<typeof Document>>;
      const blob = await pdf(element).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${name}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('PDF generation failed:', e);
      // Fallback: print-based PDF (still text-layer)
      try {
        const html = buildResumeHTML(data);
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:none';
        document.body.appendChild(iframe);
        const iDoc = iframe.contentDocument!;
        iDoc.open(); iDoc.write(html); iDoc.close();
        await new Promise(r => setTimeout(r, 400));
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      } catch { /* silent */ }
    } finally {
      setPdfLoading(false);
    }
  };

  const downloadDOCX = async () => {
    setPdfLoading(true);
    try {
      const name = (data.personalInfo?.name || '').trim() || 'Resume';
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
      const n = data.personalInfo;

      const mkPara = (text: string, opts: any = {}) =>
        new Paragraph({ children: [new TextRun({ text, ...opts })], spacing: { after: 60 } });
      const mkHeading = (text: string) =>
        new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 160, after: 60 }, border: { bottom: { style: 'single', size: 6, color: '333333', space: 2 } } });
      const mkBullet = (text: string) =>
        new Paragraph({ children: [new TextRun({ text })], bullet: { level: 0 }, spacing: { after: 40 } });

      const children: any[] = [
        // Header
        new Paragraph({ children: [new TextRun({ text: n.name || '', bold: true, size: 36 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
        new Paragraph({
          children: [new TextRun({ text: [n.email, n.phone, n.location, n.linkedin, n.portfolio].filter(Boolean).join('  |  '), size: 20, color: '555555' })],
          alignment: AlignmentType.CENTER, spacing: { after: 120 },
        }),
      ];

      if (data.summary) {
        children.push(mkHeading('Professional Summary'));
        children.push(mkPara(Array.isArray(data.summary) ? data.summary.join(' ') : data.summary));
      }
      if (data.skills.length > 0) {
        children.push(mkHeading('Skills'));
        children.push(mkPara(data.skills.join('  ·  ')));
      }
      if (data.experience.length > 0) {
        children.push(mkHeading('Experience'));
        data.experience.forEach(exp => {
          children.push(new Paragraph({ children: [new TextRun({ text: `${exp.title}${exp.company ? ` — ${exp.company}` : ''}`, bold: true }), new TextRun({ text: exp.duration ? `  |  ${exp.duration}` : '', color: '777777' })], spacing: { after: 40 } }));
          exp.bullets.filter(b => b.trim()).forEach(b => children.push(mkBullet(b)));
        });
      }
      if (data.education.length > 0) {
        children.push(mkHeading('Education'));
        data.education.forEach(edu => {
          const deg = edu.ugDegree || edu.pgDegree || edu.degree || '';
          children.push(mkPara(`${deg}${edu.institution ? ` — ${edu.institution}` : ''}${edu.duration ? `  |  ${edu.duration}` : ''}${edu.grade ? `  |  ${edu.grade}` : ''}`));
        });
      }
      if (data.certifications.length > 0) {
        children.push(mkHeading('Certifications'));
        data.certifications.forEach(c => children.push(mkPara(`${c.name}${c.issuer ? ` — ${c.issuer}` : ''}${c.year ? `  (${c.year})` : ''}`)));
      }
      if (data.projects.length > 0) {
        children.push(mkHeading('Projects'));
        data.projects.forEach(p => {
          children.push(new Paragraph({ children: [new TextRun({ text: `${p.name}${p.role ? ` — ${p.role}` : ''}`, bold: true })], spacing: { after: 40 } }));
          if (p.url) children.push(mkPara(p.url, { color: '2563eb' }));
          p.bullets.filter(b => b.trim()).forEach(b => children.push(mkBullet(b)));
        });
      }
      if (data.languages.length > 0) {
        children.push(mkHeading('Languages'));
        children.push(mkPara(data.languages.map(l => `${l.language} (${l.proficiency})`).join('  ·  ')));
      }
      if (data.achievements?.length > 0) {
        children.push(mkHeading('Achievements'));
        data.achievements.forEach((a: any) => {
          if (a.title) children.push(new Paragraph({ children: [new TextRun({ text: a.title, bold: true })], spacing: { after: 30 } }));
          if (a.description) children.push(mkPara(a.description));
        });
      }

      const doc = new Document({
        sections: [{ properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } }, children }],
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${name}.docx`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('DOCX generation failed:', e);
      // Fallback: HTML as .doc (still text-parseable)
      const html = buildResumeHTML(data);
      const blob = new Blob([html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${(data.personalInfo?.name || 'Resume').trim()}.doc`; a.click();
      URL.revokeObjectURL(url);
    } finally {
      setPdfLoading(false);
    }
  };

  const resumeEmpty = !data.experience.length && !data.skills.length && !data.summary && !data.education.length;
  const onboardingKey = `resume_onboarding_done_${user?.email || 'anon'}`;

  // ── Quick Apply render functions ──────────────────────────────────────────
  const renderChooseJob = () => {
    const filteredJobs = jobs.filter((j: any) =>
      !jobSearch || (j.title || j.jobTitle || '').toLowerCase().includes(jobSearch.toLowerCase())
    );
    return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Choose a Job</h2>
        <p className="text-sm text-gray-500 mt-0.5">Select a saved job to tailor your resume for</p>
      </div>
      {jobsLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-8"><Loader2 className="w-4 h-4 animate-spin" /> Loading saved jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
          <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-1">No jobs available yet</p>
          <p className="text-xs text-gray-400">Jobs posted on ZyncJobs will appear here</p>
        </div>
      ) : (
        <div>
          {jobs.length > 5 && (
            <AutocompleteCombobox
              value={jobSearch}
              onChange={setJobSearch}
              options={jobs.map((j: any) => ({ value: j.title || j.jobTitle || '', label: j.title || j.jobTitle || 'Untitled' }))}
              allowCustom
              placeholder="Search jobs by title..."
              className="mb-2"
            />
          )}
          <div className="grid gap-2">
              {filteredJobs.map((job: any) => {
              const jid = job.id || job._id;
              const isSelected = selectedJob && (selectedJob.id === jid || selectedJob._id === jid);
              const isApplied = appliedJobs.includes(jid);
              const jobSkills: string[] = (job.skills || []).filter((s: any) => typeof s === 'string');
              const userSkills = data.skills.length > 0 ? data.skills : (
                (() => { try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return Array.isArray(u.skills) ? u.skills : []; } catch { return []; } })()
              );
              const matchCount = jobSkills.filter((s: string) => userSkills.some((us: string) => {
                const a = us.toLowerCase(), b = s.toLowerCase();
                return a === b || a.includes(b) || b.includes(a);
              })).length;
              const matchPct = jobSkills.length > 0 ? Math.round((matchCount / jobSkills.length) * 100) : 0;
              return (
                <button key={jid} onClick={() => setSelectedJob(job)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${isApplied ? 'border-green-200 bg-green-50/50' : isSelected ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{job.title || job.jobTitle || 'Untitled'}</p>
                        {isApplied && <span className="text-[10px] text-green-600 font-medium shrink-0">Applied </span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{job.company || job.companyName || ''} · {job.location || ''}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {jobSkills.length > 0 && (
                        <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          matchPct >= 70 ? 'bg-green-100 text-green-700' : matchPct >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {matchPct}% match
                        </div>
                      )}
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                    </div>
                  </div>
                  {jobSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {jobSkills.slice(0, 4).map((s: string, i: number) => {
                        const has = data.skills.some(us => { const a = us.toLowerCase(), b = s.toLowerCase(); return a === b || a.includes(b) || b.includes(a); });
                        return <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${has ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s}</span>;
                      })}
                      {jobSkills.length > 4 && <span className="text-[10px] text-gray-400">+{jobSkills.length - 4}</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {selectedJob && (
        <div className="flex justify-end pt-2">
          <p className="text-xs text-gray-400 flex items-center gap-1">Moving to review <ArrowRight className="w-3 h-3" /></p>
        </div>
      )}
    </div>
  );
  };

  const renderReviewResume = () => {
    const hasSummary = !!data.summary;
    const hasExp = data.experience.length > 0;
    const hasSkills = data.skills.length > 0;
    const hasEdu = data.education.length > 0;
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Review Your Resume</h2>
          <p className="text-sm text-gray-500 mt-0.5">{selectedJob ? `Targeting: ${selectedJob.title || selectedJob.jobTitle || ''}` : ''}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: 'Summary', ok: hasSummary, hint: 'Add a professional summary' },
            { label: 'Experience', ok: hasExp, hint: 'Add work experience' },
            { label: 'Skills', ok: hasSkills, hint: 'Add skills' },
            { label: 'Education', ok: hasEdu, hint: 'Add education' },
          ].map(item => (
            <div key={item.label} className={`p-3 rounded-xl border ${item.ok ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                {item.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-amber-400" />}
                <span className="text-sm font-medium text-gray-800">{item.label}</span>
              </div>
              <p className="text-[10px] text-gray-500">{item.ok ? 'Ready' : item.hint}</p>
            </div>
          ))}
        </div>
        {completeness < 4 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-medium mb-1">Your resume needs more content</p>
            <p className="text-xs text-blue-600">Switch to Editor mode to fill in the missing sections, or import a resume PDF.</p>
          </div>
        )}
        <div className="flex justify-between pt-2">
          <button onClick={() => setQaStep(0)} className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Back</button>
          {completeness >= 4 ? (
            <div className="flex items-center gap-1 text-xs text-gray-400 px-2">Resume ready <ArrowRight className="w-3 h-3" /></div>
          ) : (
            <button onClick={() => setQaStep(2)} disabled={completeness < 2}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-40">
              Optimize with AI <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderOptimize = () => (
    <div>
      <AISuggestionsStep selectedJob={selectedJob} />
      <div className="flex justify-between pt-4 mt-4 border-t border-gray-100">
        <button onClick={() => setQaStep(1)} className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Back</button>
        <button onClick={() => setQaStep(3)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          Check ATS Score <Star className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderScore = () => (
    <div>
      <ResumeScoreStep />
      <div className="flex justify-between pt-4 mt-4 border-t border-gray-100">
        <button onClick={() => setQaStep(2)} className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Back</button>
        <button onClick={() => setQaStep(4)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          Generate Cover Letter <Mail className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderCoverLetter = () => (
    <div>
      <CoverLetterStep selectedJob={selectedJob} />
      <div className="flex justify-between pt-4 mt-4 border-t border-gray-100">
        <button onClick={() => setQaStep(3)} className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Back</button>
        <button onClick={() => setQaStep(5)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          Review & Apply <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderApply = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Review & Apply</h2>
        <p className="text-sm text-gray-500 mt-0.5">Final review before submitting your application</p>
      </div>

      {applied ? (
        <div className="text-center py-12 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">Application Submitted!</h3>
          <p className="text-sm text-gray-500 mb-4">Your resume and cover letter have been sent for {selectedJob?.title || selectedJob?.jobTitle || ''}</p>
          <button onClick={() => { setApplied(false); setSelectedJob(null); setQaStep(0); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            Apply for Another Job
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Job summary */}
          {selectedJob && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm font-semibold text-gray-900">{selectedJob.title || selectedJob.jobTitle}</p>
              <p className="text-xs text-gray-500">{selectedJob.company || ''} · {selectedJob.location || ''}</p>
            </div>
          )}

          {/* Resume summary */}
          <div className="p-4 border border-gray-200 rounded-xl space-y-2">
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" /> Resume</p>
            <div className="text-xs text-gray-600 space-y-1">
              <p>{data.personalInfo.name || 'Your Name'} · {data.personalInfo.email} · {data.personalInfo.phone}</p>
              {data.skills.length > 0 && <p>Skills: {data.skills.slice(0, 10).join(', ')}</p>}
              {data.experience.length > 0 && <p>Experience: {data.experience.map(e => `${e.title} at ${e.company}`).join(', ')}</p>}
            </div>
          </div>

          {applying && (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Submitting application...
            </div>
          )}

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{submitError}</div>
          )}

          <div className="flex justify-between pt-2">
            <button onClick={() => setQaStep(4)} className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Back</button>
            <button onClick={applyForJob} disabled={applying}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-40">
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Application
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Hidden file input for import */}
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={handleFileImport} />

      {/* ── AI Suggestions Panel (Grammarly-like) ────────────────────── */}
      {showSuggestions && (
        <div className="fixed right-4 top-20 z-40 max-w-full sm:right-6 sm:top-24 md:right-8 md:top-28 lg:right-12 lg:top-32">
          <AISuggestionsPanel onClose={() => setShowSuggestions(false)} onNavigate={(section) => { setActiveIdPersisted(section); setShowSuggestions(false); }} />
        </div>
      )}

      {/* ── Welcome Wizard (3-step onboarding) ─────────────────────────── */}
      {showOnboarding && resumeEmpty && !sessionStorage.getItem(onboardingKey) && (
        <WelcomeWizard
          goal={wizardGoal}
          role={wizardRole}
          step={wizardStep}
          onSetGoal={setWizardGoal}
          onSetRole={setWizardRole}
          onSetStep={setWizardStep}
          onStart={setWizardStart}
          onUploadNow={() => {
            if (Date.now() - dropHandledRef.current < 100) return;
            setTimeout(() => fileInputRef.current?.click(), 50);
          }}
          onComplete={() => {
            sessionStorage.setItem(onboardingKey, '1');
            if (wizardGoal) update('goal', wizardGoal);
            if (wizardRole) update('targetRole', wizardRole);

            const goalData = wizardGoal ? GOAL_PRESETS[wizardGoal] : undefined;
            const roleData = wizardRole ? ROLE_PRESETS[wizardRole] : undefined;

            if (!data.summary) {
              let summary = '';
              if (goalData && roleData) {
                summary = `${goalData.summaryPrefix} ${roleData.summary.charAt(0).toLowerCase() + roleData.summary.slice(1)}`;
              } else if (roleData) {
                summary = roleData.summary;
              } else if (goalData) {
                summary = `${goalData.summaryPrefix} professional`;
              }
              if (summary) update('summary', summary);
            }

            const existing = new Set(data.skills.map(s => s.toLowerCase()));
            const newSkills = [...(roleData?.skills || []), ...(goalData?.skills || [])].filter(s => !existing.has(s.toLowerCase()));
            if (newSkills.length > 0) update('skills', [...data.skills, ...newSkills]);

            // Auto-hide irrelevant sections based on goal (only if empty)
            const toHide = wizardGoal ? GOAL_HIDDEN_SECTIONS[wizardGoal] : undefined;
            if (toHide && !data.hiddenSections?.length) {
              toHide.forEach(sectionId => {
                const hasData = (
                  (sectionId === 'experience' && data.experience.length > 0) ||
                  (sectionId === 'education' && data.education.length > 0) ||
                  (sectionId === 'projects' && (data.projects?.length || 0) > 0) ||
                  (sectionId === 'skills' && data.skills.length > 0) ||
                  (sectionId === 'certs' && (data.certifications?.length || 0) > 0) ||
                  (sectionId === 'languages' && (data.languages?.length || 0) > 0) ||
                  (sectionId === 'achievements' && (data.achievements?.length || 0) > 0) ||
                  (sectionId === 'custom' && (data.customSections?.length || 0) > 0) ||
                  (sectionId === 'summary' && !!data.summary)
                );
                if (!hasData) toggleSection(sectionId);
              });
            }

            setShowOnboarding(false);
            if (wizardStart === 'import' && Date.now() - dropHandledRef.current >= 100) fileInputRef.current?.click();
            else if (wizardStart === 'linkedin') setTriggerLinkedin(true);
            else if (wizardStart === 'ai') setAiMode(true);
          }}
        />
      )}

    <div className="flex flex-col flex-1 min-h-0 bg-[#f4f6fb] relative"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        if (Date.now() - dropHandledRef.current < 100) return;
        handleDrop(e);
      }}
    >
      {/* Drag-over overlay */}
      {dragOver && (
        <div className="absolute inset-0 z-50 bg-blue-600/10 border-4 border-dashed border-blue-500 rounded-xl flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <Upload className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <p className="text-lg font-semibold text-gray-900">Drop your resume here</p>
            <p className="text-sm text-gray-500 mt-1">PDF, DOC, DOCX, JPG, PNG supported</p>
          </div>
        </div>
      )}
      {/* Import loading overlay */}
      {importLoading && (
        <div className="absolute inset-0 z-50 bg-white/80 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-gray-700">Parsing your resume with AI...</p>
          <p className="text-xs text-gray-400">This may take up to 30 seconds</p>
        </div>
      )}
      {/* Workspace toolbar */}
      <div className="bg-white border-b border-gray-200 px-2 sm:px-3 py-1.5 flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Mobile menu toggle */}
        <button onClick={() => setShowMobileSidebar(true)} className="md:hidden p-1 rounded hover:bg-gray-100 text-gray-500">
          <LayoutList className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1 min-w-0" style={{maxWidth: '180px'}}>
          <input
            value={data.resumeName}
            onChange={(e) => update('resumeName', e.target.value)}
            className="text-sm font-semibold text-gray-800 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent min-w-0 w-[90px] sm:w-[120px] px-1 truncate"
          />
          <span title={saveNote} className={`text-[10px] hidden lg:flex items-center gap-1 cursor-default shrink-0 ${
            saveStatus === 'saving' ? 'text-amber-500' :
            saveStatus === 'syncing' ? 'text-blue-500' :
            saveStatus === 'offline' ? 'text-red-400' : 'text-emerald-600'
          }`}>
            {saveStatus === 'saving' && <><Loader2 className="w-2.5 h-2.5 animate-spin" />Saving...</>}
            {saveStatus === 'saved' && <><Save className="w-2.5 h-2.5" />Saved</>}
            {saveStatus === 'syncing' && <><RefreshCw className="w-2.5 h-2.5 animate-spin" />Syncing...</>}
            {saveStatus === 'offline' && <><WifiOff className="w-2.5 h-2.5" />Offline</>}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors border ${
              canUndo
                ? 'border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer'
                : 'border-gray-200 text-gray-300 cursor-not-allowed'
            }`}>
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Undo</span>
          </button>
          <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors border ${
              canRedo
                ? 'border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer'
                : 'border-gray-200 text-gray-300 cursor-not-allowed'
            }`}>
            <Redo2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Redo</span>
          </button>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <button onClick={() => setShowSuggestions(!showSuggestions)}
            className={`p-1 rounded transition-colors ${showSuggestions ? 'text-purple-600 bg-purple-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
            title="AI Suggestions (Grammarly)">
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="hidden sm:block w-px h-4 bg-gray-200" />
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => {
              setMode('editor');
              setQaStep(0);
              setAiMode(false);
              setShowSuggestions(false);
              // Restore last active editor step or default to personal
              const lastId = sessionStorage.getItem('rb_activeId') || 'personal';
              setActiveIdPersisted(lastId);
            }}
            className={`px-2 py-1 text-[10px] sm:text-[11px] font-medium rounded-md transition-colors ${mode === 'editor' && !aiMode ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <PenLine className="w-3 h-3 inline sm:mr-1" /><span className="hidden sm:inline">Editor</span>
          </button>
          <button onClick={() => { setMode('quick-apply'); setQaStep(0); setAiMode(false); setShowSuggestions(false); }}
            className={`px-2 py-1 text-[10px] sm:text-[11px] font-medium rounded-md transition-colors ${mode === 'quick-apply' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Send className="w-3 h-3 inline sm:mr-1" /><span className="hidden sm:inline">Quick Apply</span>
          </button>
        </div>
        <div className="w-px h-4 bg-gray-200" />
        <button onClick={() => { if (Date.now() - dropHandledRef.current < 100) return; fileInputRef.current?.click(); }} title="Import Resume" className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium border border-green-300 bg-green-50 rounded hover:bg-green-100 text-green-700 transition-colors">
          <Upload className="w-3 h-3" />Import
        </button>
        <div className="hidden sm:flex items-center gap-1">
          <div className="w-px h-4 bg-gray-200" />
          <button onClick={downloadPDF} disabled={pdfLoading} title="Download PDF" className="hidden sm:flex items-center gap-1 px-2 py-1 text-[10px] font-medium border border-gray-200 rounded hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50">
            {pdfLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} PDF
          </button>
          <button onClick={downloadDOCX} title="Download DOCX" className="hidden sm:flex items-center gap-1 px-2 py-1 text-[10px] font-medium border border-gray-200 rounded hover:bg-gray-50 text-gray-600 transition-colors">
            <FileDown className="w-3 h-3" /> DOCX
          </button>
          <div className="hidden sm:block w-px h-6 bg-gray-200 mx-1" />
          <button onClick={() => setShowCompletion(true)} title="Finish" className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
            <CheckCircle2 className="w-3 h-3" /> Finish
          </button>
          <button onClick={() => onNavigate?.('job-listings')} title="Browse jobs" className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            <Send className="w-3 h-3" /> Apply
          </button>
        </div>
      </div>

      {/* AI Interview mode — replaces 3-column layout */}
      {aiMode ? (
        <AIInterviewStep onComplete={() => setAiMode(false)} />
      ) : (
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Mobile sidebar backdrop */}
        {showMobileSidebar && (
          <div onClick={() => setShowMobileSidebar(false)} className="md:hidden fixed inset-0 z-30 bg-black/40" />
        )}

        {/* COL 1: Sidebar nav */}
        <aside
          className={`${showMobileSidebar ? 'fixed left-0 top-0 bottom-0 z-40 w-[280px]' : 'hidden'} md:flex ${sidebarOpen ? 'md:w-[280px]' : 'md:w-12'} bg-white border-r border-gray-200 flex-col transition-all duration-200 flex-shrink-0`}
        >
          <button
            onClick={() => { setSidebarOpen(!sidebarOpen); setShowMobileSidebar(false); }}
            className="hidden md:flex items-center justify-end px-2 py-2 text-gray-400 hover:text-gray-600 border-b border-gray-100"
          >
            {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => setShowMobileSidebar(false)} className="md:hidden flex items-center justify-end px-2 py-2 text-gray-400 hover:text-gray-600 border-b border-gray-100">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Quick Apply Stepper */}
          {mode === 'quick-apply' && sidebarOpen && (
            <div className="flex flex-col h-full">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Send className="w-3 h-3" /> Quick Apply
                </h3>
              </div>
              <nav className="flex-1 py-2 overflow-y-auto">
                {QUICK_APPLY_STEPS.map((step, i) => {
                  const StepIcon = step.icon;
                  const isActive = i === qaStep;
                  const isDone = i < qaStep;
                  return (
                    <button
                      key={step.id}
                      onClick={() => {
                        if (i === 0 || i < qaStep || selectedJob) setQaStep(i);
                      }}
                      disabled={i > 0 && !selectedJob && i > qaStep}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                        ${isActive
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600 font-semibold'
                          : isDone
                            ? 'text-emerald-600'
                            : i > qaStep && !selectedJob && i > 0
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <StepIcon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate font-medium">{step.label}</p>
                        <p className="text-[10px] text-gray-400 truncate">{step.desc}</p>
                      </div>
                      {isActive && <ChevronRight className="w-3 h-3 text-blue-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Editor Sidebar Nav */}
          {mode === 'editor' && (
          <nav className="flex-1 py-1 overflow-y-auto">
            {sections.map((section) => {
              const SectionIcon = sectionIcons[section] || UserCircle;
              const sectionItems = orderedNav.filter(n => n.section === section);
              return (
                <div key={section} className="mb-1">
                  {sidebarOpen && (
                    <div className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                      <SectionIcon className="w-3.5 h-3.5" />
                      {section}
                    </div>
                  )}
                    {sectionItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.id === activeId;
                    const isHidden = data.hiddenSections?.includes(item.id);
                    const canHide = ['personal', 'summary'].indexOf(item.id) === -1;
                    return (
                      <div key={item.id} className="flex items-center group">
                      <button
                        onClick={() => setActiveIdPersisted(item.id)}
                        title={item.label}
                        className={`flex-1 flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                          ${isActive
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                        {sidebarOpen && <span className="text-sm truncate">{item.label}</span>}
                      </button>
                      {sidebarOpen && canHide && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSection(item.id); }}
                          className={`p-2 mr-1 rounded transition-colors ${
                            isHidden ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-300 hover:text-gray-600 hover:bg-gray-100'
                          }`}
                          title={isHidden ? 'Show in resume' : 'Hide from resume'}
                        >
                          {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Resume Versions in sidebar */}
            {sidebarOpen && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <Copy className="w-3.5 h-3.5" />
                  Versions
                </div>
                {versions.map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      if (v === activeVersion) return;
                      persistCurrentVersion(activeVersion);
                      const saved = loadVersionData(v);
                      if (saved) {
                        Object.keys(saved).forEach((k) => update(k as any, saved[k]));
                      }
                      setActiveVersion(v);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3
                      ${v === activeVersion ? 'text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <FileText className={`w-4 h-4 ${v === activeVersion ? 'text-blue-500' : 'text-gray-400'}`} />
                    {v}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setShowNewVersionModal(true);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> New Version
                </button>
                {showNewVersionModal && (
                  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 w-96 max-w-md">
                      <h3 className="text-lg font-semibold mb-4">Create New Resume Version</h3>
                      <input
                        type="text"
                        value={newVersionName}
                        onChange={(e) => setNewVersionName(e.target.value)}
                        placeholder="e.g. Frontend Developer"
                        className="w-full border rounded p-2 mb-4"
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setShowNewVersionModal(false)}
                          className="px-4 py-2 border rounded hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (newVersionName.trim()) {
                              persistCurrentVersion(activeVersion);
                              const newList = [...versions, newVersionName.trim()];
                              setVersions(newList);
                              saveVersionList(newList);
                              const preset = ROLE_PRESETS[newVersionName.trim()];
                              if (preset) {
                                update('summary', preset.summary);
                                update('skills', preset.skills);
                                update('targetRole', newVersionName.trim());
                              }
                              setActiveVersion(newVersionName.trim());
                              setShowNewVersionModal(false);
                              setNewVersionName('');
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>
          )}

          {/* Prev / Next (editor mode only) */}
          {mode === 'editor' && sidebarOpen && (
            <div className="border-t border-gray-100 p-2 flex gap-1.5">
              <button
                onClick={() => setActiveIdPersisted(orderedNav[Math.max(0, activeIdx - 1)].id)}
                disabled={activeIdx === 0}
                className="flex-1 flex items-center justify-center gap-1 py-1 text-[11px] border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-600"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                onClick={() => setActiveIdPersisted(orderedNav[Math.min(orderedNav.length - 1, activeIdx + 1)].id)}
                disabled={activeIdx === orderedNav.length - 1}
                className="flex-1 flex items-center justify-center gap-1 py-1 text-[11px] bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </aside>

        {/* COL 2: Resume editor / Quick Apply */}
        <main className="flex-1 overflow-y-auto bg-white flex justify-center" style={{ minWidth: 0 }}>
          <div className="w-full max-w-[950px] px-3 sm:px-6 md:px-10 py-4 sm:py-8 pb-20">
            {mode === 'quick-apply' ? (
              <div className="space-y-6">
                {/* Step indicator */}
                <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                  {QUICK_APPLY_STEPS.map((step, i) => {
                    const StepIcon = step.icon;
                    const isActive = i === qaStep;
                    const isDone = i < qaStep;
                    return (
                      <React.Fragment key={step.id}>
                        {i > 0 && <div className={`h-px flex-1 ${isDone || i <= qaStep ? 'bg-blue-200' : 'bg-gray-200'}`} />}
                        <button onClick={() => { if (i <= qaStep || selectedJob) setQaStep(i); }}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors
                            ${isActive ? 'bg-blue-100 text-blue-700' : isDone ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {isDone ? <CheckCircle2 className="w-3 h-3" /> : <StepIcon className="w-3 h-3" />}
                          <span className="hidden sm:inline">{step.label}</span>
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Step content */}
                {qaStep === 0 && renderChooseJob()}
                {qaStep === 1 && renderReviewResume()}
                {qaStep === 2 && renderOptimize()}
                {qaStep === 3 && renderScore()}
                {qaStep === 4 && renderCoverLetter()}
                {qaStep === 5 && renderApply()}
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Step navigation bar — above the form */}
                <div className="flex items-center justify-between px-4 py-3 mb-4 bg-white border border-gray-200 rounded-xl shadow-sm sticky top-0 z-10">
                  <button
                    onClick={() => setActiveIdPersisted(orderedNav[Math.max(0, activeIdx - 1)].id)}
                    disabled={activeIdx === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-sm font-semibold text-gray-800">{active.label}</span>
                    <span className="text-[10px] text-gray-400">{activeIdx + 1} of {orderedNav.length}</span>
                  </div>
                  <button
                    onClick={() => setActiveIdPersisted(orderedNav[Math.min(orderedNav.length - 1, activeIdx + 1)].id)}
                    disabled={activeIdx === orderedNav.length - 1}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <ActiveComponent />
              </div>
            )}
          </div>
        </main>

        {/* COL 3: Live preview */}
        <aside className="hidden xl:flex flex-col w-[520px] flex-shrink-0 border-l border-gray-200 bg-white overflow-hidden">
          <RightPanel onNavigate={onNavigate} />
        </aside>
      </div>
      )}

      {/* ── Ask AI Widget (floating) ──────────────────────────────────── */}
      {showAskAI && <AskAIWidget onClose={() => setShowAskAI(false)} resumeContext={`Resume: ${data.personalInfo.name}, ${data.skills.length} skills, ${data.experience.length} experiences`} />}

      {/* ── Ask AI floating button ────────────────────────────────────── */}
      {!showAskAI && !aiMode && (
        <button onClick={() => setShowAskAI(true)}
          className="fixed bottom-4 right-4 z-40 w-12 h-12 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 flex items-center justify-center transition-all hover:scale-105">
          <MessageSquare className="w-5 h-5" />
        </button>
      )}

      {/* ── Completion Dashboard (Phase 13) ────────────────────────────── */}
      {showCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Resume Completed!</h2>
              <p className="text-sm text-gray-500 mt-1">Your resume is ready. Here's your summary:</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-4 bg-blue-50 rounded-xl text-center">
                {(function computeScore() {
                  const hasName = !!(data.personalInfo?.name?.trim());
                  const hasEmail = !!(data.personalInfo?.email?.trim());
                  const hasPhone = !!(data.personalInfo?.phone?.trim());
                  const hasSummary = !!data.summary.trim();
                  const hasExperience = data.experience.length > 0;
                  const hasEducation = data.education.length > 0;
                  const hasSkills = data.skills.length > 0;
                  const items = [hasName, hasEmail, hasPhone, hasSummary, hasExperience, hasEducation, hasSkills];
                  const filled = items.filter(Boolean).length;
                  const completion = Math.round((filled / items.length) * 100);
                  return completion;
                })()}%
                <p className="text-xs text-gray-500">Completion</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-green-600">{data.experience.length + (data.projects?.length || 0) + (data.certifications?.length || 0)}</p>
                <p className="text-xs text-gray-500">Total Entries</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-purple-600">{data.skills.length}</p>
                <p className="text-xs text-gray-500">Skills Added</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-amber-600">{data.experience.length >= 2 ? <CheckCircle2 className="w-6 h-6 text-amber-600" /> : <AlertTriangle className="w-6 h-6 text-amber-400" />}</p>
                <p className="text-xs text-gray-500">Interview Ready</p>
              </div>
            </div>

            <div className="space-y-2">
              <button onClick={() => { setShowCompletion(false); onNavigate?.('job-listings'); }}
                className="w-full py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Find Matching Jobs
              </button>
              <button onClick={() => { setShowCompletion(false); setActiveIdPersisted('score'); }}
                className="w-full py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                View Full ATS Score
              </button>
              <button onClick={() => { setShowCompletion(false); onNavigate?.('career-coach'); }}
                className="w-full py-2.5 text-sm text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" /> Talk to Career Coach
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

function sanitizeText(s: any): string {
  if (!s) return '';
  return String(s)
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildResumeHTML(data: ResumeData): string {
  const n = data.personalInfo;
  const exp = data.experience.map(e => `<div style="margin-bottom:8px"><b>${sanitizeText(e.title)}</b> at <b>${sanitizeText(e.company)}</b>${e.duration ? ` — ${sanitizeText(e.duration)}` : ''}${e.bullets?.length ? `<ul style="margin:4px 0 0 16px">${e.bullets.filter(Boolean).map(b => `<li>${sanitizeText(b)}</li>`).join('')}</ul>` : ''}</div>`).join('');
  const edu = data.education.map(e => `<div>${sanitizeText(e.degree)} at ${sanitizeText(e.institution)}${e.duration ? ` — ${sanitizeText(e.duration)}` : ''}</div>`).join('');
  const certs = data.certifications.map(c => `<div>${sanitizeText(c.name)} — ${sanitizeText(c.issuer)}${c.year ? ` (${sanitizeText(c.year)})` : ''}</div>`).join('');
  const projs = data.projects.map(p => `<div style="margin-bottom:6px"><b>${sanitizeText(p.name)}</b>${p.role ? ` — ${sanitizeText(p.role)}` : ''}${p.bullets?.length ? `<ul style="margin:2px 0 0 16px">${p.bullets.filter(Boolean).map(b => `<li>${sanitizeText(b)}</li>`).join('')}</ul>` : ''}</div>`).join('');
  const langs = data.languages.map(l => `<span style="display:inline-block;background:#e5e7eb;padding:2px 8px;border-radius:4px;margin:2px;font-size:12px">${sanitizeText(l.language)} (${sanitizeText(l.proficiency)})</span>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${n.name || 'Resume'}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:32px;color:#1f2937;line-height:1.5}
  h1{font-size:22px;margin:0 0 4px}
  .contact{font-size:13px;color:#6b7280;margin-bottom:16px}
  .section{margin-bottom:16px}
  .section-title{font-size:14px;font-weight:700;text-transform:uppercase;color:#374151;border-bottom:2px solid #3b82f6;padding-bottom:4px;margin-bottom:8px}
  .skill{margin-right:4px;margin-bottom:4px;font-size:12px}
  ul{margin:4px 0 4px 16px;padding:0;font-size:13px}
  li{margin-bottom:2px}
  .skill-tag{display:inline-block;background:#eff6ff;color:#1d4ed8;padding:2px 8px;border-radius:4px;margin:2px;font-size:12px;border:1px solid #bfdbfe}
</style></head><body>
<h1>${n.name || ''}</h1>
<div class="contact">${[n.email, n.phone, n.location].filter(Boolean).join(' · ')}${n.linkedin ? ' · ' + n.linkedin : ''}${n.portfolio ? ' · ' + n.portfolio : ''}</div>
${data.summary ? `<div class="section"><div class="section-title">Professional Summary</div><p style="font-size:13px;margin:0">${data.summary}</p></div>` : ''}
${exp ? `<div class="section"><div class="section-title">Experience</div>${exp}</div>` : ''}
${edu ? `<div class="section"><div class="section-title">Education</div>${edu}</div>` : ''}
${data.skills.length ? `<div class="section"><div class="section-title">Skills</div>${data.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>` : ''}
${certs ? `<div class="section"><div class="section-title">Certifications</div>${certs}</div>` : ''}
${projs ? `<div class="section"><div class="section-title">Projects</div>${projs}</div>` : ''}
${langs ? `<div class="section"><div class="section-title">Languages</div>${langs}</div>` : ''}
</body></html>`;
}
