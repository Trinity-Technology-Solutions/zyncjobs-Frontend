import React, { useState, useEffect } from 'react';
import Notification from '../components/Notification';
import BackButton from '../components/BackButton';
import EmptyState from '../components/EmptyState';
import { sendAIMessage } from '../services/aiChatService';
import { getCached, setCached, cacheKey } from '../services/aiCache';
import { API_ENDPOINTS } from '../config/constants';
import { generatePositionId } from '../utils/jobMigrationUtils';
import { getCompanyLogo } from '../utils/logoUtils';
import { getCategoryBanner, getCategoryBannerOptions } from '../utils/categoryBannerImages';
import JobBannerUploader from '../components/JobBannerUploader';
import mistralAIService from '../services/mistralAIService';
import { tokenStorage } from '../utils/tokenStorage';
import { apiFetch } from '../api/apiFetch';
import { getEffectiveEmployerEmail } from '../utils/employerIdUtils';


interface JobPostingPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout?: () => void;
  mode?: string;
  parsedData?: any;
}

interface JobData {
  // Step 1: Job Basics
  jobTitle: string;
  locationType: string;
  jobLocation: string;
  expandCandidateSearch: boolean;
  experienceRange: string;
  country: string;
  language: string | string[];
  jobCategory: string;
  priority: string;
  clientName: string;
  jobCode: string;
  reportingManager: string;
  
  // Step 2: Hiring Goals
  hiringTimeline: string;
  numberOfPeople: number;
  workAuth: string[];
  
  // Step 3: Job Details
  jobType: string[];
  
  // Step 4: Pay and Benefits
  payType: string;
  minSalary: string;
  maxSalary: string;
  payRate: string;
  currency: string;
  benefits: string[];
  
  // Step 5: Qualifications
  skills: string[];
  goodToHaveSkills: string[];
  educationLevel: string;
  certifications: string[];
  
  // Step 6: Job Description
  jobDescription: string;
  responsibilities: string[];
  requirements: string[];
  noticePeriod: string;
  urgentNote: string;
  nationalityRestriction: string;
  
  jobHeaderImage: string;

  // Company Information
  companyName: string;
  companyLogo: string;
  companyId: string;
  companyTagline: string;
}

const formatSalary = (value: string): string => {
  const num = parseInt(value.replace(/,/g, ''));
  if (isNaN(num)) return value;
  // If user enters small numbers (1-999), treat as Lakhs (LPA)
  if (num < 1000) return `${num}L`;
  if (num >= 10000000) return `${(num / 10000000).toFixed(num % 10000000 === 0 ? 0 : 1)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(num % 100000 === 0 ? 0 : 1)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
  return value;
};

// Snap a raw number to the nearest available dropdown option value
const snapToDropdownYear = (n: number, isMax: boolean): string => {
  const minOpts = [0,1,2,3,4,5,6,7,8,9,10,12,15,20];
  const maxOpts = [1,2,3,4,5,6,7,8,9,10,12,15,20,25];
  const opts = isMax ? maxOpts : minOpts;
  const closest = opts.reduce((a, b) => Math.abs(b - n) < Math.abs(a - n) ? b : a);
  return `${closest} year${closest !== 1 ? 's' : ''}`;
};

const extractExperienceFromText = (text: string): string => {
  if (!text) return '';
  // Only match lines/phrases that are clearly about experience years — not random sentences
  const patterns = [
    /(?:experience\s+required|experience)[:\s]*?(\d+)\s*[-–]\s*(\d+)\s*(?:years?|yrs?)/i,
    /(?:experience\s+required|experience)[:\s]*?(\d+)\s+to\s+(\d+)\s*(?:years?|yrs?)/i,
    /(\d+)\s*[-–]\s*(\d+)\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i,
    /(\d+)\s+to\s+(\d+)\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i,
    /(?:minimum|at\s+least|min\.?)\s*(\d+)\s*[-–to]+\s*(\d+)\s*(?:years?|yrs?)/i,
    /(?:minimum|at\s+least|min\.?)\s*(\d+)\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i,
    /(\d+)\+\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const a = parseInt(match[1]), b = match[2] ? parseInt(match[2]) : NaN;
      if (!isNaN(a) && a <= 40 && !isNaN(b) && b <= 40 && b >= a) {
        return `${snapToDropdownYear(a, false)} - ${snapToDropdownYear(b, true)}`;
      }
      if (!isNaN(a) && a <= 40) {
        return `${snapToDropdownYear(a, false)} - ${snapToDropdownYear(Math.min(a + 2, 25), true)}`;
      }
    }
  }
  return '';
};

const KNOWN_TOOLS = [
  'postman', 'rest assured', 'selenium', 'jira', 'confluence', 'jenkins',
  'docker', 'kubernetes', 'git', 'github', 'gitlab', 'bitbucket',
  'react', 'angular', 'vue', 'node', 'nodejs', 'express', 'django', 'flask',
  'spring', 'hibernate', 'maven', 'gradle', 'junit', 'pytest', 'jest',
  'aws', 'azure', 'gcp', 'terraform', 'ansible', 'linux', 'ubuntu',
  'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
  'python', 'java', 'javascript', 'typescript', 'kotlin', 'swift', 'golang',
  'html', 'css', 'sass', 'tailwind', 'bootstrap', 'figma', 'sketch',
  'tableau', 'power bi', 'excel', 'salesforce', 'sap', 'erp',
  'agile', 'scrum', 'kanban', 'devops', 'ci/cd', 'microservices',
  'machine learning', 'tensorflow', 'pytorch', 'rest', 'graphql', 'soap', 'api', 'sql'
];

const TRENDING_COMPANIES = [
  { id: '1', name: 'Google', logo: '' },
  { id: '2', name: 'Microsoft', logo: '' },
  { id: '3', name: 'Apple', logo: '' },
  { id: '4', name: 'Amazon', logo: '' },
  { id: '5', name: 'Meta', logo: '' },
  { id: '6', name: 'Netflix', logo: '' },
  { id: '7', name: 'Tesla', logo: '' },
  { id: '8', name: 'Uber', logo: '' },
  { id: '9', name: 'Airbnb', logo: '' },
  { id: '10', name: 'Spotify', logo: '' },
  { id: '11', name: 'Twitter', logo: '' },
  { id: '12', name: 'LinkedIn', logo: '' },
  { id: '13', name: 'Adobe', logo: '' },
  { id: '14', name: 'Salesforce', logo: '' },
  { id: '15', name: 'Oracle', logo: '' },
  { id: '16', name: 'SAP', logo: '' },
  { id: '17', name: 'IBM', logo: '' },
  { id: '18', name: 'Intel', logo: '' },
  { id: '19', name: 'NVIDIA', logo: '' },
  { id: '20', name: 'Qualcomm', logo: '' },
  { id: '21', name: 'PayPal', logo: '' },
  { id: '22', name: 'Stripe', logo: '' },
  { id: '23', name: 'Shopify', logo: '' },
  { id: '24', name: 'Zoom', logo: '' },
  { id: '25', name: 'Slack', logo: '' },
  { id: '26', name: 'Atlassian', logo: '' },
  { id: '27', name: 'GitHub', logo: '' },
  { id: '28', name: 'GitLab', logo: '' },
  { id: '29', name: 'Docker', logo: '' },
  { id: '30', name: 'MongoDB', logo: '' },
  { id: '31', name: 'Snowflake', logo: '' },
  { id: '32', name: 'Databricks', logo: '' },
  { id: '33', name: 'Cloudflare', logo: '' },
  { id: '34', name: 'Figma', logo: '' },
  { id: '35', name: 'Notion', logo: '' },
  { id: '36', name: 'Canva', logo: '' },
  { id: '37', name: 'HubSpot', logo: '' },
  { id: '38', name: 'Zendesk', logo: '' },
  { id: '39', name: 'ServiceNow', logo: '' },
  { id: '40', name: 'Workday', logo: '' },
  { id: '41', name: 'Datadog', logo: '' },
  { id: '42', name: 'Twilio', logo: '' },
  { id: '43', name: 'OpenAI', logo: '' },
  { id: '44', name: 'Anthropic', logo: '' },
  { id: '45', name: 'Palantir', logo: '' },
  { id: '46', name: 'TCS', logo: '' },
  { id: '47', name: 'Infosys', logo: '' },
  { id: '48', name: 'Wipro', logo: '' },
  { id: '49', name: 'HCL Technologies', logo: '' },
  { id: '50', name: 'Tech Mahindra', logo: '' },
  { id: '51', name: 'Accenture', logo: '' },
  { id: '52', name: 'Cognizant', logo: '' },
  { id: '53', name: 'Capgemini', logo: '' },
  { id: '54', name: 'Mphasis', logo: '' },
  { id: '55', name: 'Hexaware', logo: '' },
  { id: '56', name: 'LTIMindtree', logo: '' },
  { id: '57', name: 'Persistent Systems', logo: '' },
  { id: '58', name: 'Coforge', logo: '' },
  { id: '59', name: 'Zoho', logo: '' },
  { id: '60', name: 'Freshworks', logo: '' },
  { id: '61', name: 'Flipkart', logo: '' },
  { id: '62', name: 'Swiggy', logo: '' },
  { id: '63', name: 'Zomato', logo: '' },
  { id: '64', name: 'Ola', logo: '' },
  { id: '65', name: 'Paytm', logo: '' },
  { id: '66', name: 'Razorpay', logo: '' },
  { id: '67', name: "BYJU'S", logo: '' },
  { id: '68', name: 'Unacademy', logo: '' },
  { id: '69', name: 'upGrad', logo: '' },
  { id: '70', name: 'Meesho', logo: '' },
  { id: '71', name: 'Myntra', logo: '' },
  { id: '72', name: 'Nykaa', logo: '' },
  { id: '73', name: 'OYO', logo: '' },
  { id: '74', name: 'Dream11', logo: '' },
  { id: '75', name: 'PhonePe', logo: '' },
  { id: '76', name: 'Zerodha', logo: '' },
  { id: '77', name: 'Groww', logo: '' },
  { id: '78', name: 'CRED', logo: '' },
  { id: '79', name: 'Delhivery', logo: '' },
  { id: '80', name: 'Postman', logo: '' },
  { id: '81', name: 'BrowserStack', logo: '' },
  { id: '82', name: 'Deloitte', logo: '' },
  { id: '83', name: 'PwC', logo: '' },
  { id: '84', name: 'KPMG', logo: '' },
  { id: '85', name: 'EY', logo: '' },
  { id: '86', name: 'McKinsey', logo: '' },
  { id: '87', name: 'BCG', logo: '' },
  { id: '88', name: 'HDFC Bank', logo: '' },
  { id: '89', name: 'ICICI Bank', logo: '' },
  { id: '90', name: 'JPMorgan', logo: '' },
  { id: '91', name: 'Goldman Sachs', logo: '' },
  { id: '92', name: 'Samsung', logo: '' },
  { id: '93', name: 'Trinity Technology Solutions', logo: '/images/company-logos/trinity-logo.png' },
  { id: '94', name: 'Nambikkai India', logo: '/images/company-logos/nambikkai-logo.png' },
];

const INVALID_COMPANY_PHRASES = [
  'good to have', 'must have', 'nice to have', 'required skills', 'preferred skills',
  'key skills', 'technical skills', 'soft skills', 'job description',
  'job requirements', 'what we offer', 'who we are', 'not mentioned',
  'not specified', 'not provided', 'n/a', 'none', 'responsibilities include',
  'duties include', 'candidate should', 'applicant must', 'looking for',
  'we are seeking', 'ideal candidate', 'successful candidate'
];

const sanitizeParsedCompany = (company?: string): string => {
  if (!company || company.trim().length < 2) return '';
  
  const trimmed = company.trim();
  const lower = trimmed.toLowerCase();
  
  // Skip obvious invalid phrases
  if (INVALID_COMPANY_PHRASES.some(p => lower.includes(p))) return '';
  
  // Skip if it's just a known tool/technology
  if (KNOWN_TOOLS.some(t => lower === t)) return '';
  
  // Skip if it starts with a number
  if (/^\d/.test(trimmed)) return '';
  
  // Skip if it's all caps and more than 4 words (likely a description)
  if (/^[A-Z\s&]+$/.test(trimmed) && trimmed.split(/\s+/).length > 4) return '';
  
  // Skip if it contains common job description keywords
  const jobDescKeywords = ['experience', 'required', 'preferred', 'skills', 'qualifications', 'responsibilities', 'duties', 'requirements', 'candidate', 'applicant', 'position', 'role', 'job', 'work', 'years', 'degree', 'education'];
  if (jobDescKeywords.some(keyword => lower.includes(keyword))) return '';
  
  // Skip if it's a comma-separated list (likely skills)
  if (lower.includes(',') && lower.split(',').length > 2) {
    const parts = lower.split(',').map(p => p.trim());
    if (parts.some(p => KNOWN_TOOLS.some(t => p.includes(t)))) return '';
  }
  
  return trimmed;
};

const JobPostingPage: React.FC<JobPostingPageProps> = ({ onNavigate, user, onLogout, mode = 'manual', parsedData }) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Check for edit mode data from sessionStorage
  const editJobRaw = sessionStorage.getItem('editJobData');
  const editJob = editJobRaw ? JSON.parse(editJobRaw) : null;
  const isEditMode = !!editJob;
  const editJobId = editJob?._id || editJob?.id;

  // Helper to extract salary values from job data
  const getSalaryMin = (job: any): string => {
    if (!job?.salary) return '';
    if (typeof job.salary === 'object') return String(job.salary.min || '');
    const match = String(job.salary).match(/(\d+)/);
    return match ? match[1] : '';
  };
  const getSalaryMax = (job: any): string => {
    if (!job?.salary) return '';
    if (typeof job.salary === 'object') return String(job.salary.max || '');
    const parts = String(job.salary).match(/(\d+)[^\d]+(\d+)/);
    return parts ? parts[2] : '';
  };

  const [jobData, setJobData] = useState<JobData>({
    jobTitle: editJob?.jobTitle || editJob?.title || parsedData?.jobTitle || '',
    locationType: editJob?.locationType || (() => {
      const loc = parsedData?.jobLocation || '';
      const rawJD = parsedData?.jobDescription || '';
      if (/^remote$/i.test(loc.trim()) || /\bfully\s+remote\b|\b100%\s+remote\b/i.test(rawJD)) return 'Remote';
      if (/^hybrid$/i.test(loc.trim()) || /\bwork\s+mode\s*[:\-]?\s*hybrid\b|\bhybrid\b/i.test(rawJD)) return 'Hybrid';
      return 'In person';
    })(),
    jobLocation: editJob?.location || editJob?.jobLocation || (() => {
      const loc = parsedData?.jobLocation || '';
      // Strip work mode keywords if they bled into the location string
      return loc.replace(/\s*(?:work\s+mode|work\s+type)[^\n]*/gi, '')
                .replace(/\s*(hybrid|remote|on-?site|in-?person)\s*$/gi, '')
                .trim();
    })(),
    expandCandidateSearch: false,
    experienceRange: (() => {
      const raw = editJob?.experienceRange || editJob?.experience || editJob?.experienceLevel || parsedData?.experienceRange || '';
      const snapMin = (n: number) => { const opts = [0,1,2,3,4,5,6,7,8,9,10,12,15,20]; const c = opts.reduce((a,b) => Math.abs(b-n)<Math.abs(a-n)?b:a); return `${c} year${c!==1?'s':''}`; };
      const snapMax = (n: number) => { const opts = [1,2,3,4,5,6,7,8,9,10,12,15,20,25]; const c = opts.reduce((a,b) => Math.abs(b-n)<Math.abs(a-n)?b:a); return `${c} year${c!==1?'s':''}`; };
      const normalize = (val: string) => {
        const m = val.match(/(\d+)\s*[-\u2013\u2014to]+\s*(\d+)/);
        if (m) return `${snapMin(parseInt(m[1]))} - ${snapMax(parseInt(m[2]))}`;
        const s = val.match(/(\d+)/);
        if (s) { const n = parseInt(s[1]); return `${snapMin(n)} - ${snapMax(Math.min(n+2,25))}`; }
        return '';
      };
      // Only use raw if it actually contains year numbers (not garbage text)
      if (raw && /\d+\s*[-\u2013\u2014to]+\s*\d+|\d+\+?\s*(?:years?|yrs?)/i.test(raw)) return normalize(raw);
      // Fallback: parse directly from JD text
      if (parsedData?.jobDescription) {
        const jd = parsedData.jobDescription;
        const labelMatch = jd.match(/experience\s+required\s*[:\-]?\s*([\d][\d\s\-\u2013\u2014to]*(?:years?|yrs?))/i);
        if (labelMatch) return normalize(labelMatch[1]);
        const rangeMatch = jd.match(/(\d+)\s*[-\u2013\u2014]\s*(\d+)\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i);
        if (rangeMatch) return normalize(rangeMatch[0]);
      }
      return '';
    })(),
    country: editJob?.country || parsedData?.country || '',
    language: (() => {
      const lang = editJob?.language || editJob?.languages;
      if (lang) {
        if (Array.isArray(lang)) return lang;
        if (typeof lang === 'string' && lang.trim()) return lang.split(',').map((l: string) => l.trim()).filter(Boolean);
      }
      // Auto-parse from JD/parsedData
      if (parsedData?.jobDescription || parsedData?.requirements) {
        const text = ((parsedData.jobDescription || '') + ' ' + (Array.isArray(parsedData.requirements) ? parsedData.requirements.join(' ') : parsedData.requirements || '')).toLowerCase();
        const langMap: Record<string, string> = {
          // Indian
          english: 'English', hindi: 'Hindi', tamil: 'Tamil', telugu: 'Telugu',
          kannada: 'Kannada', malayalam: 'Malayalam', marathi: 'Marathi',
          bengali: 'Bengali', gujarati: 'Gujarati', punjabi: 'Punjabi',
          urdu: 'Urdu', odia: 'Odia', assamese: 'Assamese', konkani: 'Konkani',
          // Middle East / GCC
          arabic: 'Arabic',
          // European
          french: 'French', german: 'German', spanish: 'Spanish', portuguese: 'Portuguese',
          italian: 'Italian', dutch: 'Dutch', russian: 'Russian', turkish: 'Turkish',
          // Asia-Pacific
          mandarin: 'Mandarin', chinese: 'Chinese', japanese: 'Japanese', korean: 'Korean',
          malay: 'Malay', indonesian: 'Indonesian', tagalog: 'Tagalog', vietnamese: 'Vietnamese',
          thai: 'Thai', sinhala: 'Sinhala', nepali: 'Nepali',
        };
        return Object.entries(langMap)
          .filter(([key]) => new RegExp(`\\b${key}\\b`).test(text))
          .map(([, val]) => val);
      }
      return [];
    })(),
    jobCategory: editJob?.jobCategory || editJob?.category || parsedData?.jobCategory || '',
    priority: editJob?.priority || parsedData?.priority || 'Medium',
    clientName: editJob?.clientName || parsedData?.clientName || '',
    jobCode: editJob?.jobCode || `JOB-${Date.now()}`,
    reportingManager: editJob?.reportingManager || parsedData?.reportingManager || '',
    noticePeriod: parsedData?.noticePeriod || '',
    urgentNote: editJob?.urgentNote || '',
    nationalityRestriction: editJob?.nationalityRestriction || parsedData?.nationalityRestriction || '',
    hiringTimeline: '',
    numberOfPeople: 0,
    workAuth: editJob?.workAuth || parsedData?.workAuth || [],
    jobType: editJob?.type ? (Array.isArray(editJob.type) ? editJob.type : [editJob.type]) :
             editJob?.jobType ? (Array.isArray(editJob.jobType) ? editJob.jobType : [editJob.jobType]) :
             parsedData?.jobType && Array.isArray(parsedData.jobType) ? parsedData.jobType :
             parsedData?.jobType ? [parsedData.jobType] : [],
    payType: (() => {
      if (editJob?.payType) return editJob.payType;
      // If parser explicitly flagged payType (e.g. 'Maximum amount' for "up to X LPA")
      if (parsedData?.payType) return parsedData.payType;
      // If only maxSalary is set (no minSalary), treat as 'Maximum amount'
      if ((!parsedData?.minSalary || parseInt(parsedData.minSalary) === 0) && parsedData?.maxSalary && parseInt(parsedData.maxSalary) > 0) return 'Maximum amount';
      return 'Range';
    })(),
    minSalary: getSalaryMin(editJob) || (parsedData?.minSalary && parseInt(parsedData.minSalary) > 0 ? parsedData.minSalary : ''),
    maxSalary: getSalaryMax(editJob) || (parsedData?.maxSalary && parseInt(parsedData.maxSalary) > 0 ? parsedData.maxSalary : ''),
    payRate: editJob?.salary?.period === 'monthly' ? 'per month' : editJob?.salary?.period === 'hourly' ? 'per hour' : parsedData?.payRate || 'per year',
    currency: parsedData?.currency || 'INR',
    benefits: editJob?.benefits || parsedData?.benefits || [],
    jobDescription: (() => {
      const stripHtml = (html: string) =>
        html
          .replace(/<[^>]*>/g, ' ')
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')
          .replace(/\s{2,}/g, ' ')
          .trim();
      const raw = editJob?.jobDescription || editJob?.description || '';
      if (raw) return stripHtml(raw);
      const parsed = parsedData?.jobDescription || '';
      if (!parsed) return '';

      const cleaned = stripHtml(parsed);
      const lines = cleaned.split('\n').map(l => l.trim());

      // Metadata label patterns — lines to skip entirely
      const metaPatterns = [
        /^(job\s+)?description\s*:?\s*$/i,
        /^job\s+summary\s*:?\s*$/i,
        /^position\s+(title|name)\s*[:\-]/i,
        /^(job\s+)?title\s*[:\-]/i,
        /^(job\s+)?role\s*[:\-]/i,
        /^location\s*[:\-]/i,
        /^work\s+location\s*[:\-]/i,
        /^experience\s*[:\-]/i,
        /^employment\s+type\s*[:\-]/i,
        /^nationality\s*[:\-]/i,
        /^nationality\s+requirement\s*[:\-]/i,
        /^languages?\s+(required|preferred)?\s*[:\-]/i,
        /^reporting\s+to\s*[:\-]/i,
        /^industry\s*[:\-]/i,
        /^department\s*[:\-]/i,
        /^salary\s*[:\-]/i,
        /^ctc\s*[:\-]/i,
        /^notice\s+period\s*[:\-]/i,
        /^zyncjobs/i,
        /^connecting\s+talent/i,
      ];

      // Content section starters — once we hit these, include everything from here
      const contentSectionPatterns = [
        /^(role\s+overview|about\s+the\s+role|job\s+overview|overview)/i,
        /^(key\s+)?responsibilities/i,
        /^(job\s+)?requirements/i,
        /^qualifications/i,
        /^what\s+you('ll|\s+will)\s+(do|be)/i,
        /^we\s+are\s+(looking|seeking|hiring)/i,
        /^(the\s+)?ideal\s+candidate/i,
        /^about\s+us/i,
        /^preferred\s+qualifications/i,
        /^what\s+we\s+offer/i,
      ];

      // Find where real content starts
      let contentStartIdx = -1;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        if (contentSectionPatterns.some(p => p.test(line))) {
          contentStartIdx = i;
          break;
        }
      }

      // If no content section found, skip meta lines from the top
      if (contentStartIdx === -1) {
        let startIdx = 0;
        for (let i = 0; i < Math.min(lines.length, 15); i++) {
          const line = lines[i];
          if (!line) { startIdx = i + 1; continue; }
          const isMeta = metaPatterns.some(p => p.test(line));
          const isJobTitle = parsedData?.jobTitle &&
            line.toLowerCase().includes((parsedData.jobTitle || '').toLowerCase().substring(0, 20));
          if (isMeta || isJobTitle) {
            startIdx = i + 1;
          } else {
            break;
          }
        }
        contentStartIdx = startIdx;
      }

      // Build final description — skip inline meta lines throughout
      const result = lines
        .slice(contentStartIdx)
        .filter(line => !metaPatterns.some(p => p.test(line)))
        .join('\n')
        .trim();

      return result;
    })(),
    responsibilities: editJob?.responsibilities
      ? (Array.isArray(editJob.responsibilities) ? editJob.responsibilities : editJob.responsibilities.split('\n').filter(Boolean))
      : parsedData?.responsibilities || [],
    requirements: editJob?.requirements
      ? (Array.isArray(editJob.requirements) ? editJob.requirements : editJob.requirements.split('\n').filter(Boolean))
      : parsedData?.requirements || [],
    skills: editJob?.skills || parsedData?.skills || [],
    goodToHaveSkills: parsedData?.goodToHaveSkills || [],
    educationLevel: editJob?.educationLevel || parsedData?.educationLevel || "Bachelor's degree",
    certifications: [],
    companyName: editJob?.company || editJob?.companyName || (parsedData?.companyName?.trim() || '') || (() => { try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return u.companyName || u.company || ''; } catch { return ''; } })() || (user?.companyName || user?.company || ''),
    companyLogo: editJob?.companyLogo || '',
    companyId: '',
    companyTagline: editJob?.companyTagline || editJob?.tagline || parsedData?.tagline || parsedData?.companyTagline || (() => { try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return u.tagline || ''; } catch { return ''; } })() || (user?.tagline || ''),
    jobHeaderImage: editJob?.jobHeaderImage || ''
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    isVisible: boolean;
  }>({ type: 'success', message: '', isVisible: false });

  // AI Suggestions state
  const [jobTitleSuggestions, setJobTitleSuggestions] = useState<string[]>([]);
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [showJobTitleSuggestions, setShowJobTitleSuggestions] = useState(false);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const [countrySuggestions, setCountrySuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isLoadingJobTitles, setIsLoadingJobTitles] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [companySearchResults, setCompanySearchResults] = useState<any[]>([]);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [aiSuggestedSkills, setAiSuggestedSkills] = useState<string[]>([]);
  const [catOpen, setCatOpen] = useState(false);
  const [catInput, setCatInput] = useState(jobData?.jobCategory || '');
  const [natOpen, setNatOpen] = useState(false);
  const [natInput, setNatInput] = useState(jobData?.nationalityRestriction || '');
  const [langInput, setLangInput] = useState('');

  const [salaryModified, setSalaryModified] = useState(() => {
    const min = getSalaryMin(editJob) || parsedData?.minSalary || parsedData?.salary?.min;
    const max = getSalaryMax(editJob) || parsedData?.maxSalary || parsedData?.salary?.max;
    // Modified if range has both values, OR if only max is set (Maximum amount / upto)
    return !!(max && parseInt(String(max)) > 0);
  });
  const [salaryFocused, setSalaryFocused] = useState<'min' | 'max' | null>(null);

  const [showBannerPicker, setShowBannerPicker] = useState(false);
  const [bannerType, setBannerType] = useState<'default' | 'uploaded'>(() => {
    if (!editJob?.jobHeaderImage) return 'default';
    if (editJob.jobHeaderImage.startsWith('https://images.unsplash.com')) return 'default';
    return 'uploaded';
  });

  const handleDefaultBannerSelect = (url: string) => {
    updateJobData('jobHeaderImage', url);
    setBannerType('default');
    setShowBannerPicker(false);
  };

  const handleUploadedBanner = (url: string) => {
    updateJobData('jobHeaderImage', url);
    setBannerType('uploaded');
    setShowBannerPicker(false);
  };

  const handleUploadRemove = () => {
    const defaultBanner = getCategoryBanner(jobData.jobCategory) || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop';
    updateJobData('jobHeaderImage', defaultBanner);
    setBannerType('default');
  };

  const cityCountryMap: Record<string, string> = {
    'Mumbai': 'India', 'Delhi': 'India', 'New Delhi': 'India', 'Bangalore': 'India',
    'Bengaluru': 'India', 'Chennai': 'India', 'Hyderabad': 'India', 'Kolkata': 'India',
    'Pune': 'India', 'Ahmedabad': 'India', 'Surat': 'India', 'Jaipur': 'India',
    'Lucknow': 'India', 'Kanpur': 'India', 'Nagpur': 'India', 'Indore': 'India',
    'Thane': 'India', 'Bhopal': 'India', 'Visakhapatnam': 'India', 'Patna': 'India',
    'Vadodara': 'India', 'Ghaziabad': 'India', 'Ludhiana': 'India', 'Agra': 'India',
    'Nashik': 'India', 'Faridabad': 'India', 'Meerut': 'India', 'Rajkot': 'India',
    'Varanasi': 'India', 'Srinagar': 'India', 'Aurangabad': 'India', 'Dhanbad': 'India',
    'Amritsar': 'India', 'Navi Mumbai': 'India', 'Allahabad': 'India', 'Ranchi': 'India',
    'Howrah': 'India', 'Coimbatore': 'India', 'Jabalpur': 'India', 'Gwalior': 'India',
    'Vijayawada': 'India', 'Jodhpur': 'India', 'Madurai': 'India', 'Raipur': 'India',
    'Kota': 'India', 'Guwahati': 'India', 'Chandigarh': 'India', 'Mysore': 'India',
    'Gurgaon': 'India', 'Noida': 'India', 'Kochi': 'India', 'Dehradun': 'India',
    'Bhubaneswar': 'India', 'Mangalore': 'India', 'Erode': 'India', 'Trichy': 'India',
    'Tiruchirappalli': 'India', 'Salem': 'India', 'Tirunelveli': 'India', 'Vellore': 'India',
    'Pondicherry': 'India', 'Puducherry': 'India', 'Kolhapur': 'India', 'Nanded': 'India',
    'Solapur': 'India', 'Hubli': 'India', 'Dharwad': 'India',
    'New York': 'United States', 'Los Angeles': 'United States', 'Chicago': 'United States',
    'Houston': 'United States', 'Phoenix': 'United States', 'San Francisco': 'United States',
    'Seattle': 'United States', 'Denver': 'United States', 'Boston': 'United States',
    'Atlanta': 'United States', 'Miami': 'United States', 'Dallas': 'United States',
    'Austin': 'United States', 'San Jose': 'United States', 'Las Vegas': 'United States',
    'London': 'United Kingdom', 'Manchester': 'United Kingdom', 'Birmingham': 'United Kingdom',
    'Toronto': 'Canada', 'Vancouver': 'Canada', 'Montreal': 'Canada',
    'Sydney': 'Australia', 'Melbourne': 'Australia', 'Brisbane': 'Australia',
    'Singapore': 'Singapore', 'Dubai': 'United Arab Emirates',
    'Berlin': 'Germany', 'Munich': 'Germany', 'Frankfurt': 'Germany',
    'Paris': 'France', 'Madrid': 'Spain', 'Barcelona': 'Spain',
    'Rome': 'Italy', 'Milan': 'Italy', 'Amsterdam': 'Netherlands',
    'Tokyo': 'Japan', 'Seoul': 'South Korea', 'Beijing': 'China', 'Shanghai': 'China',
    'Kuala Lumpur': 'Malaysia', 'Jakarta': 'Indonesia',
  };

  const getCountryFromCity = (city: string): string => {
    if (!city || /^(remote|hybrid|on-site)$/i.test(city.trim())) return '';
    const exact = cityCountryMap[city];
    if (exact) return exact;
    const lower = city.toLowerCase();
    for (const [c, country] of Object.entries(cityCountryMap)) {
      if (c.toLowerCase() === lower || lower.includes(c.toLowerCase())) return country;
    }
    return '';
  };

  const updateJobData = (field: keyof JobData, value: any) => {
    setJobData(prev => ({ ...prev, [field]: value }));
  };
  useEffect(() => {
    const fetchCompanyLogo = async () => {
      if (parsedData?.companyName && !jobData.companyLogo) {
        try {
          // Try to fetch company from backend first
          const response = await fetch(`${API_ENDPOINTS.BASE_URL}/companies?search=${encodeURIComponent(parsedData.companyName)}`);
          if (response.ok) {
            const data = await response.json();
            const companies = Array.isArray(data) ? data : (data.companies || data.data || []);
            
            const matchedCompany = companies.find((company: any) => 
              (company.name || company.companyName || '').toLowerCase().includes(parsedData.companyName.toLowerCase()) ||
              parsedData.companyName.toLowerCase().includes((company.name || company.companyName || '').toLowerCase())
            );
            
            if (matchedCompany) {
              const name = matchedCompany.name || matchedCompany.companyName || '';
              updateJobData('companyLogo', getCompanyLogo(name) || matchedCompany.logo || matchedCompany.logoUrl || matchedCompany.imageUrl || matchedCompany.image || '');
              updateJobData('companyId', matchedCompany._id || matchedCompany.id || matchedCompany.name);
              return;
            }
          }
        } catch (error) {
          console.error('Error fetching company logo:', error);
        }
        
        const matchedCompany = TRENDING_COMPANIES.find(company => 
          company.name.toLowerCase().includes(parsedData.companyName.toLowerCase()) ||
          parsedData.companyName.toLowerCase().includes(company.name.toLowerCase())
        );
        
        if (matchedCompany) {
          const companyLogo = matchedCompany.logo || getCompanyLogo(parsedData.companyName);
          updateJobData('companyLogo', companyLogo);
          updateJobData('companyId', matchedCompany.id);
        } else {
          const logo = getCompanyLogo(parsedData.companyName);
          if (logo) updateJobData('companyLogo', logo);
        }
      }
    };
    
    fetchCompanyLogo();
  }, [parsedData]);

  // Auto-parse skills from job description when parsedData is available
  useEffect(() => {
    if (parsedData?.jobDescription && mode === 'parse') {
      const parsedSkills = parseSkillsFromJobDescription(
        parsedData.jobDescription, 
        parsedData.jobTitle || ''
      );
      
      // If no skills were parsed initially or only basic skills, update with parsed skills
      if (!parsedData.skills || parsedData.skills.length === 0 || 
          parsedData.skills.every((skill: string) => ['AWS', 'Azure', 'GitHub', 'IT', 'Java', 'Linux', 'Python', 'SQL', 'Version control'].includes(skill))) {
        updateJobData('skills', parsedSkills);
      } else {
        // Merge existing skills with parsed skills
        const mergedSkills = [...new Set([...parsedData.skills, ...parsedSkills])].slice(0, 15);
        updateJobData('skills', mergedSkills);
      }
    }
  }, [parsedData, mode]);

  // Set salaryModified if parsedData has actual salary values
  useEffect(() => {
    if (parsedData?.maxSalary && parseInt(parsedData.maxSalary) > 0) {
      setSalaryModified(true);
    }
  }, [parsedData]);

  // Auto-fill country from parsed location on mount
  useEffect(() => {
    if (mode === 'parse' && parsedData?.jobLocation && !parsedData?.country) {
      const country = getCountryFromCity(parsedData.jobLocation);
      if (country) updateJobData('country', country);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedData]);

  // Clear [object Object] on mount
  useEffect(() => {
    if (jobData.jobDescription === '[object Object]' || jobData.jobDescription === 'undefined') {
      updateJobData('jobDescription', '');
    }
    // In parse mode, clear only garbage values — real JD will be regenerated at step 6
    if (mode === 'parse' && (jobData.jobDescription === '[object Object]' || jobData.jobDescription === 'undefined')) {
      updateJobData('jobDescription', '');
    }
  }, []);

  // Auto-extract experience range from job description — only in manual mode when not already set
  useEffect(() => {
    if (mode === 'parse') return;
    if (jobData.jobDescription && !jobData.experienceRange) {
      const extracted = extractExperienceFromText(jobData.jobDescription);
      if (extracted) updateJobData('experienceRange', extracted);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobData.jobDescription]);

  // Set default banner image when job category changes, only if no user-uploaded banner exists
  useEffect(() => {
    if (jobData.jobCategory) {
      const hasUserUploadedBanner = jobData.jobHeaderImage && !jobData.jobHeaderImage.startsWith('https://images.unsplash.com');
      if (!hasUserUploadedBanner) {
        const defaultBanner = getCategoryBanner(jobData.jobCategory);
        if (defaultBanner) {
          updateJobData('jobHeaderImage', defaultBanner);
        }
      }
    }
  }, [jobData.jobCategory]);

  // Load countries on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/locations/countries`);
        const data = await response.json();
        setCountries(data.countries || []);
      } catch (error) {
        setCountries(['India', 'United States', 'United Kingdom', 'Canada', 'Australia']);
      }
    };
    fetchCountries();
  }, []);

  // AI-powered job title suggestions
  const handleJobTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateJobData('jobTitle', value);
    
    if (value.length >= 1) {
      setIsLoadingJobTitles(true);
      
      try {
        const response = await fetch(`${API_ENDPOINTS.JOBS.replace('/jobs', '/suggest')}?q=${encodeURIComponent(value)}&type=job`);
        const data = await response.json();
        console.log('Job title API response:', data);
        
        if (data.suggestions && data.suggestions.length > 0) {
          setJobTitleSuggestions(data.suggestions);
          setShowJobTitleSuggestions(true);
        } else {
          setShowJobTitleSuggestions(false);
        }
      } catch (error) {
        console.error('Job title suggestions failed:', error);
        setShowJobTitleSuggestions(false);
      } finally {
        setIsLoadingJobTitles(false);
      }
    } else {
      setShowJobTitleSuggestions(false);
      setJobTitleSuggestions([]);
    }
  };

  const getFallbackJobTitles = (input: string) => {
    const key = input.toLowerCase();
    const fallbacks: { [key: string]: string[] } = {
      'account': ['Accountant', 'Account Manager', 'Accounting Specialist', 'Account Executive', 'Senior Accountant', 'Accounting Clerk', 'Account Coordinator', 'Accounting Manager'],
      'software': ['Software Developer', 'Software Engineer', 'Software Tester', 'Software Architect', 'Senior Software Engineer', 'Software Quality Engineer', 'Software Consultant', 'Software Product Manager'],
      'data': ['Data Scientist', 'Data Analyst', 'Data Engineer', 'Data Architect', 'Senior Data Scientist', 'Data Product Manager', 'Data Visualization Specialist', 'Big Data Engineer'],
      'marketing': ['Marketing Manager', 'Digital Marketing Specialist', 'Content Marketing Manager', 'Marketing Coordinator', 'Social Media Manager', 'Marketing Analyst', 'Brand Manager', 'Growth Marketing Manager'],
      'sales': ['Sales Representative', 'Sales Manager', 'Account Executive', 'Sales Coordinator', 'Business Development Manager', 'Sales Analyst', 'Inside Sales Representative', 'Sales Director']
    };
    
    for (const [prefix, suggestions] of Object.entries(fallbacks)) {
      if (key.includes(prefix) || prefix.includes(key)) {
        return suggestions;
      }
    }
    return ['Software Developer', 'Marketing Manager', 'Sales Representative', 'Data Analyst', 'Product Manager', 'Business Analyst', 'Project Manager', 'Operations Manager'];
  };

  const handleLocationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateJobData('jobLocation', value);
    
    if (value.length >= 1) {
      setIsLoadingLocations(true);
      
      try {
        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/locations/search/${encodeURIComponent(value)}`);
        const data = await response.json();
        
        if (data.locations && data.locations.length > 0) {
          setLocationSuggestions(data.locations);
          setShowLocationSuggestions(true);
        } else {
          const fallbackLocations = getFallbackLocations(value);
          setLocationSuggestions(fallbackLocations);
          setShowLocationSuggestions(fallbackLocations.length > 0);
        }
      } catch (error) {
        const fallbackLocations = getFallbackLocations(value);
        setLocationSuggestions(fallbackLocations);
        setShowLocationSuggestions(fallbackLocations.length > 0);
      } finally {
        setIsLoadingLocations(false);
      }
    } else {
      setShowLocationSuggestions(false);
      setLocationSuggestions([]);
    }
  };

  const handleLocationBlur = async (value: string) => {
    setTimeout(async () => {
      setShowLocationSuggestions(false);
      if (value && !/^(remote|hybrid|on-site)$/i.test(value.trim())) {
        const local = getCountryFromCity(value);
        if (local) { updateJobData('country', local); return; }
        try {
          const res = await fetch(`${API_ENDPOINTS.BASE_URL}/locations/city-country/${encodeURIComponent(value)}`);
          const data = await res.json();
          if (data.country) updateJobData('country', data.country);
        } catch {}
      }
    }, 150);
  };

  const getFallbackLocations = (input: string) => {
    const key = input.toLowerCase();
    const allLocations = [
      'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad',
      'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
      'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
      'Faridabad', 'Meerut', 'Rajkot', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad',
      'Amritsar', 'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur',
      'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Guwahati',
      'Chandigarh', 'Solapur', 'Hubli-Dharwad', 'Bareilly', 'Moradabad', 'Mysore',
      'Gurgaon', 'Aligarh', 'Jalandhar', 'Tiruchirappalli', 'Bhubaneswar', 'Salem',
      'Warangal', 'Guntur', 'Bhiwandi', 'Saharanpur', 'Gorakhpur', 'Bikaner', 'Amravati',
      'Noida', 'Jamshedpur', 'Bhilai', 'Cuttack', 'Firozabad', 'Kochi', 'Nellore',
      'Bhavnagar', 'Dehradun', 'Durgapur', 'Asansol', 'Rourkela', 'Nanded', 'Kolhapur',
      'Ajmer', 'Akola', 'Gulbarga', 'Jamnagar', 'Ujjain', 'Loni', 'Siliguri', 'Jhansi',
      'Ulhasnagar', 'Jammu', 'Mangalore', 'Erode', 'Belgaum', 'Ambattur', 'Tirunelveli',
      'Malegaon', 'Gaya', 'Jalgaon', 'Udaipur', 'Maheshtala', 'Davanagere', 'Kozhikode',
      'Kurnool', 'Rajahmundry', 'Bokaro', 'South Dumdum', 'Bellary', 'Patiala', 'Gopalpur',
      'Agartala', 'Bhagalpur', 'Muzaffarnagar', 'Bhatpara', 'Panihati', 'Latur', 'Dhule',
      'Rohtak', 'Korba', 'Bhilwara', 'Berhampur', 'Muzaffarpur', 'Ahmednagar', 'Mathura',
      'Kollam', 'Avadi', 'Kadapa', 'Kamarhati', 'Sambalpur', 'Bilaspur', 'Shahjahanpur',
      'Satara', 'Bijapur', 'Rampur', 'Shivamogga', 'Chandrapur', 'Junagadh', 'Thrissur',
      'Alwar', 'Bardhaman', 'Kulti', 'Kakinada', 'Nizamabad', 'Parbhani', 'Tumkur',
      'Khammam', 'Ozhukarai', 'Bihar Sharif', 'Panipat', 'Darbhanga', 'Bally', 'Aizawl',
      'Dewas', 'Ichalkaranji', 'Karnal', 'Bathinda', 'Jalna', 'Eluru', 'Baranagar',
      'Purnia', 'Satna', 'Mau', 'Sonipat', 'Farrukhabad', 'Sagar', 'Durg', 'Imphal',
      'Ratlam', 'Hapur', 'Arrah', 'Anantapur', 'Karimnagar', 'Etawah', 'Ambernath',
      'North Dumdum', 'Bharatpur', 'Begusarai', 'New Delhi', 'Gandhidham', 'Tiruvottiyur',
      'Puducherry', 'Sikar', 'Thoothukudi', 'Rewa', 'Mirzapur', 'Raichur', 'Pali',
      'Ramagundam', 'Silchar', 'Orai', 'Tenali', 'Jorhat', 'Karaikudi', 'Kishanganj',
      'Surendranagar', 'Remote', 'Work from Home', 'Pan India', 'India'
    ];
    
    return allLocations.filter(location => 
      location.toLowerCase().includes(key)
    ).slice(0, 10);
  };



  // AI-powered skill suggestions
  const handleSkillInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSkillInput(value);
    
    if (value.length >= 1) {
      setIsLoadingSkills(true);
      
      try {
        // First try to get skills from backend skills.json
        const response = await fetch(`${API_ENDPOINTS.SKILLS}?q=${encodeURIComponent(value)}`);
        const data = await response.json();
        console.log('Skills API response:', data);
        
        if (data.skills && data.skills.length > 0) {
          setSkillSuggestions(data.skills);
          setShowSkillSuggestions(true);
        } else {
          // Use fallback skills if API doesn't return results
          const fallbackSkills = getFallbackSkills(value);
          setSkillSuggestions(fallbackSkills);
          setShowSkillSuggestions(fallbackSkills.length > 0);
        }
      } catch (error) {
        console.error('Skill suggestions failed:', error);
        // Use fallback skills if API fails
        const fallbackSkills = getFallbackSkills(value);
        setSkillSuggestions(fallbackSkills);
        setShowSkillSuggestions(fallbackSkills.length > 0);
      } finally {
        setIsLoadingSkills(false);
      }
    } else {
      setShowSkillSuggestions(false);
      setSkillSuggestions([]);
    }
  };

  const getFallbackSkills = (input: string) => {
    const key = input.toLowerCase();
    const fallbacks: { [key: string]: string[] } = {
      'py': ['Python', 'PyTorch', 'PySpark', 'Pytest', 'Pandas', 'NumPy', 'PyQt', 'Pyramid'],
      'java': ['JavaScript', 'Java', 'jQuery', 'JSON', 'JavaFX', 'Jakarta EE', 'Jackson', 'JUnit'],
      'react': ['React', 'React Native', 'Redux', 'React Router', 'React Hooks', 'React Testing Library', 'Next.js', 'Gatsby'],
      'node': ['Node.js', 'Express.js', 'npm', 'Nodemon', 'NestJS', 'Socket.io', 'Mongoose', 'Passport.js'],
      'aws': ['AWS', 'AWS Lambda', 'AWS S3', 'AWS EC2', 'AWS RDS', 'AWS CloudFormation', 'AWS ECS', 'AWS API Gateway'],
      'azure': ['Azure', 'Azure Functions', 'Azure DevOps', 'Azure SQL', 'Azure Storage', 'Azure Active Directory'],
      'sql': ['SQL', 'MySQL', 'PostgreSQL', 'SQLite', 'SQL Server', 'Oracle SQL', 'MongoDB', 'NoSQL'],
      'git': ['Git', 'GitHub', 'GitLab', 'Bitbucket', 'Version Control', 'Git Flow'],
      'docker': ['Docker', 'Docker Compose', 'Kubernetes', 'Container Orchestration', 'Docker Swarm'],
      'angular': ['Angular', 'AngularJS', 'TypeScript', 'RxJS', 'Angular CLI', 'Angular Material'],
      'vue': ['Vue.js', 'Vuex', 'Vue Router', 'Nuxt.js', 'Vue CLI', 'Vuetify'],
      'css': ['CSS', 'CSS3', 'Sass', 'SCSS', 'Less', 'Tailwind CSS', 'Bootstrap', 'Material-UI'],
      'html': ['HTML', 'HTML5', 'Semantic HTML', 'Web Standards', 'Accessibility'],
      'test': ['Testing', 'Unit Testing', 'Integration Testing', 'Jest', 'Cypress', 'Selenium', 'Test Automation'],
      'api': ['REST API', 'GraphQL', 'API Development', 'API Testing', 'Postman', 'Swagger'],
      'data': ['Data Analysis', 'Data Science', 'Machine Learning', 'Data Visualization', 'Tableau', 'Power BI'],
      'mobile': ['Mobile Development', 'iOS', 'Android', 'React Native', 'Flutter', 'Swift', 'Kotlin'],
      'design': ['UI/UX Design', 'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator', 'Wireframing'],
      'project': ['Project Management', 'Agile', 'Scrum', 'Kanban', 'Jira', 'Trello', 'Asana'],
      'communication': ['Communication', 'Presentation', 'Public Speaking', 'Writing', 'Documentation'],
      'leadership': ['Leadership', 'Team Management', 'Mentoring', 'Strategic Planning', 'Decision Making']
    };
    
    // Check for exact matches first
    for (const [prefix, suggestions] of Object.entries(fallbacks)) {
      if (key.startsWith(prefix) || prefix.startsWith(key)) {
        return suggestions.filter(skill => skill.toLowerCase().includes(key));
      }
    }
    
    // Check for partial matches in skill names
    const allSkills = Object.values(fallbacks).flat();
    const matchingSkills = allSkills.filter(skill => 
      skill.toLowerCase().includes(key)
    );
    
    if (matchingSkills.length > 0) {
      return matchingSkills.slice(0, 8);
    }
    
    // Default popular skills if no matches
    return ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'AWS', 'Docker'];
  };

  // Local JD generator — no AI dependency, always works
  const generateLocalJD = (jobTitle: string, company: string, location: string, context: any): string => {
    const title = jobTitle.toLowerCase();
    const co = company || 'our company';
    const loc = location ? ` in ${location}` : '';
    const skills = Array.isArray(context?.skills) && context.skills.length > 0 ? context.skills.join(', ') : 'relevant technologies';
    const jobType = Array.isArray(context?.jobType) ? context.jobType.join('/') : (context?.jobType || 'Full-time');
    const education = Array.isArray(context?.educationLevel) ? context.educationLevel[0] : (context?.educationLevel || "Bachelor's degree");
    const salary = context?.salary ? `\n• Salary: ${context.salary}` : '';
    const benefits = Array.isArray(context?.benefits) && context.benefits.length > 0 ? context.benefits.join(', ') : 'health insurance, flexible work';

    const isTech = /developer|engineer|programmer|architect|devops|fullstack|frontend|backend|data|cloud|security|qa|tester/i.test(title);
    const isMarketing = /marketing|seo|content|social media|brand|growth|digital/i.test(title);
    const isSales = /sales|account executive|business development|bdm/i.test(title);
    const isHR = /hr|human resource|recruiter|talent|people/i.test(title);
    const isFinance = /accountant|finance|accounting|auditor|tax|payroll/i.test(title);
    const isDesign = /designer|ui|ux|graphic|creative/i.test(title);
    const isMedia = /news|journalist|reporter|anchor|producer|editor|broadcast|media|correspondent|cameraman|videographer|photographer|content creator|copywriter|writer|blogger/i.test(title);
    const isManager = /manager|lead|head|director|vp|chief/i.test(title);

    let responsibilities: string[];
    let requirements: string[];

    if (isTech) {
      responsibilities = [
        `Design, develop, and maintain high-quality ${jobTitle} solutions`,
        'Collaborate with cross-functional teams to define and implement new features',
        'Write clean, scalable, and well-documented code',
        'Conduct code reviews and ensure best practices are followed',
        `Work with technologies including: ${skills}`,
        'Troubleshoot, debug, and optimize application performance',
        'Participate in agile ceremonies and sprint planning',
      ];
      requirements = [
        `${education} in Computer Science, Engineering, or related field`,
        `3+ years of experience as a ${jobTitle}`,
        `Strong proficiency in: ${skills}`,
        'Experience with version control systems (Git)',
        'Excellent problem-solving and analytical skills',
        'Strong communication and teamwork abilities',
      ];
    } else if (isMarketing) {
      responsibilities = [
        'Plan and execute digital marketing campaigns across multiple channels',
        'Analyze campaign performance and optimize for ROI',
        'Create engaging content for social media, email, and web',
        'Conduct market research and competitor analysis',
        'Collaborate with design and sales teams',
        'Track KPIs and prepare performance reports',
      ];
      requirements = [
        `${education} in Marketing, Communications, or related field`,
        `2+ years of experience in ${jobTitle} role`,
        `Proficiency in: ${skills}`,
        'Strong analytical and creative thinking skills',
        'Excellent written and verbal communication',
      ];
    } else if (isSales) {
      responsibilities = [
        'Identify and pursue new business opportunities',
        'Build and maintain strong client relationships',
        'Meet and exceed monthly/quarterly sales targets',
        'Present products and services to prospective clients',
        'Negotiate contracts and close deals',
        'Maintain accurate records in CRM system',
      ];
      requirements = [
        `${education} in Business, Sales, or related field`,
        `2+ years of experience in ${jobTitle} role`,
        'Proven track record of meeting sales targets',
        'Excellent communication and negotiation skills',
        'Self-motivated with strong work ethic',
      ];
    } else if (isHR) {
      responsibilities = [
        'Manage end-to-end recruitment and onboarding processes',
        'Develop and implement HR policies and procedures',
        'Handle employee relations and conflict resolution',
        'Conduct performance management and appraisal cycles',
        'Ensure compliance with labor laws and regulations',
        'Drive employee engagement and retention initiatives',
      ];
      requirements = [
        `${education} in Human Resources, Psychology, or related field`,
        `3+ years of experience in ${jobTitle} role`,
        'Knowledge of employment laws and HR best practices',
        'Strong interpersonal and communication skills',
        'Experience with HRIS systems',
      ];
    } else if (isFinance) {
      responsibilities = [
        'Prepare and maintain accurate financial records and statements',
        'Process accounts payable and receivable transactions',
        'Assist with monthly, quarterly, and annual financial reporting',
        'Reconcile bank statements and general ledger accounts',
        'Support budget preparation and financial analysis',
        'Ensure compliance with accounting standards and tax regulations',
      ];
      requirements = [
        `${education} in Accounting, Finance, or related field`,
        `2+ years of experience in ${jobTitle} role`,
        `Proficiency in: ${skills}`,
        'Knowledge of GAAP and tax regulations',
        'Strong attention to detail and analytical skills',
      ];
    } else if (isDesign) {
      responsibilities = [
        'Create user-centered designs for web and mobile applications',
        'Develop wireframes, prototypes, and high-fidelity mockups',
        'Conduct user research and usability testing',
        'Collaborate with developers and product managers',
        'Maintain design systems and brand consistency',
        'Present design concepts to stakeholders',
      ];
      requirements = [
        `${education} in Design, HCI, or related field`,
        `2+ years of experience as a ${jobTitle}`,
        `Proficiency in: ${skills}`,
        'Strong portfolio demonstrating design skills',
        'Understanding of user-centered design principles',
      ];
    } else if (isMedia) {
      responsibilities = [
        `Research, write, and produce compelling ${jobTitle} content for broadcast/digital platforms`,
        'Coordinate with reporters, anchors, and camera crews to deliver timely news coverage',
        'Edit and review scripts, footage, and stories for accuracy and editorial standards',
        'Monitor breaking news and manage live coverage logistics',
        'Collaborate with editorial team to plan daily news rundowns and story lineups',
        'Ensure content meets broadcast quality, legal, and ethical standards',
      ];
      requirements = [
        `${education} in Journalism, Mass Communication, Media Studies, or related field`,
        `2+ years of experience as a ${jobTitle} in a news or media organization`,
        `Skills: ${skills}`,
        'Strong news judgment and ability to work under tight deadlines',
        'Excellent written and verbal communication skills',
        'Familiarity with broadcast/digital media production tools',
      ];
    } else {
      responsibilities = [
        'Collaborate effectively with team members and stakeholders',
        'Contribute to process improvements and operational efficiency',
        'Prepare reports and documentation as required',
        'Meet deadlines and deliver high-quality work',
        'Stay updated with industry trends and best practices',
      ];
      requirements = [
        `${education} or equivalent experience`,
        `2+ years of relevant experience${isManager ? ' with team leadership' : ''}`,
        `Skills: ${skills}`,
        'Strong communication and interpersonal skills',
        'Ability to work independently and manage priorities',
      ];
    }

    const respText = responsibilities.map(r => `• ${r}`).join('\n');
    const reqText = requirements.map(r => `• ${r}`).join('\n');

    return `Job Summary
We are looking for a talented and experienced ${jobTitle} to join ${co}${loc}. This is a ${jobType} position offering an exciting opportunity to make a significant impact in a dynamic and collaborative environment. The ideal candidate will bring a strong background in ${skills}, a passion for excellence, and the ability to thrive in a fast-paced setting. You will work closely with cross-functional teams to deliver high-quality outcomes and contribute to the long-term success of the organization.

About the Role
As a ${jobTitle} at ${co}, you will be responsible for driving key initiatives, collaborating with stakeholders, and delivering results that align with our strategic goals. We are looking for someone who is proactive, detail-oriented, and committed to continuous improvement. This role offers significant growth potential and the opportunity to work on challenging, meaningful projects.

Key Responsibilities
${respText}

Requirements
${reqText}

What We Offer
• Competitive compensation package${salary}
• ${benefits}
• Professional development and continuous learning opportunities
• Collaborative, inclusive, and innovative work culture
• Opportunity to work on impactful projects with a talented team
• Flexible working arrangements and work-life balance
• Regular performance reviews and career growth pathways

About ${co}
${co} is a forward-thinking organization committed to excellence, innovation, and creating value for our clients and stakeholders. We believe in empowering our employees to do their best work and fostering a culture of respect, collaboration, and continuous improvement. Join us and be part of a team that is shaping the future.

How to Apply
If you are passionate about ${jobTitle.toLowerCase()} and meet the above requirements, we would love to hear from you. Apply now through ZyncJobs and take the next step in your career journey.`;
  };

  // Extract bullet points from a named section in JD text
  const extractSectionFromJD = (text: string, headings: string[]): string[] => {
    for (const heading of headings) {
      const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = text.match(new RegExp(`${escaped}\\s*\\n([\\s\\S]*?)(?=\\n[A-Z][^\\n]{2,}\\n|$)`, 'i'));
      if (match) {
        return match[1]
          .split('\n')
          .map(l => l.replace(/^[\u2022\-\*\d+\.\)\s]+/, '').trim())
          .filter(l => l.length > 10);
      }
    }
    return [];
  };

  // Auto-generate job description and populate skills/education
  const generateJobDescription = async (jobTitle: string, forceUpdate = false) => {
    if (!jobTitle || jobTitle.length < 3) return;
    setIsGeneratingDescription(true);
    try {
      const shouldIncludeSalary = salaryModified && jobData.minSalary && jobData.maxSalary;
      const context = {
        jobType: jobData.jobType,
        skills: jobData.skills,
        salary: shouldIncludeSalary ? `${jobData.currency} ${formatSalary(jobData.minSalary)} - ${formatSalary(jobData.maxSalary)} ${jobData.payRate}` : undefined,
        benefits: jobData.benefits,
        educationLevel: jobData.educationLevel,
        existingDescription: (jobData.jobDescription === '[object Object]' || jobData.jobDescription === 'undefined') ? '' : jobData.jobDescription,
        responsibilities: jobData.responsibilities.filter(Boolean),
        requirements: jobData.requirements.filter(Boolean),
      };

      // Try AI first — fall back to local only if AI fails
      let jdText = '';
      try {
        const raw = await mistralAIService.generateJobDescription(
          jobTitle,
          jobData.companyName || '',
          jobData.jobLocation || '',
          context
        );
        if (typeof raw === 'string' && raw.trim() && raw !== '[object Object]') {
          jdText = raw.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*\*([^*]+)\*/g, '$1');
        }
      } catch { /* AI failed, use local */ }

      if (!jdText) {
        jdText = generateLocalJD(jobTitle, jobData.companyName || '', jobData.jobLocation || '', context);
      }
      updateJobData('jobDescription', jdText);

      const parsedSkills = parseSkillsFromJobDescription(jdText, jobTitle);
      if (!forceUpdate) {
        const { skills: titleSkills, education } = getJobTitleDefaults(jobTitle);
        const { responsibilities: titleResponsibilities, requirements: titleRequirements } = getJobTitleResponsibilitiesAndRequirements(jobTitle);
        const combinedSkills = [...new Set([...parsedSkills, ...titleSkills])].slice(0, 12);
        if (jobData.skills.length === 0 || jobData.skills.every(s => ['AWS','Azure','GitHub','IT','Java','Linux','Python','SQL','Version control'].includes(s))) {
          updateJobData('skills', combinedSkills);
        }
        if (jobData.educationLevel === "Bachelor's degree") updateJobData('educationLevel', education);
        if (jobData.responsibilities.length === 0) updateJobData('responsibilities', titleResponsibilities);
        if (jobData.requirements.length === 0) updateJobData('requirements', titleRequirements);
      } else {
        updateJobData('skills', [...new Set([...jobData.skills, ...parsedSkills])].slice(0, 15));
        // On regenerate, also extract responsibilities and requirements from the new JD
        const extractedResp = extractSectionFromJD(jdText, ['Key Responsibilities', 'Responsibilities']);
        const extractedReq = extractSectionFromJD(jdText, ['Requirements', 'Qualifications']);
        if (extractedResp.length > 0) updateJobData('responsibilities', extractedResp);
        if (extractedReq.length > 0) updateJobData('requirements', extractedReq);
      }
      setNotification({ type: 'success', message: 'Job description generated!', isVisible: true });
    } catch (error) {
      console.error('Job description generation failed:', error);
      setNotification({ type: 'error', message: 'Failed to generate job description.', isVisible: true });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // Enhanced skill parsing from job description
  const parseSkillsFromJobDescription = (jobDescription: string, jobTitle: string = ''): string[] => {
    if (!jobDescription) return [];
    
    const text = (jobDescription + ' ' + jobTitle).toLowerCase();
    const extractedSkills = new Set<string>();
    
    // Comprehensive skill database with variations
    const skillDatabase = {
      // Programming Languages
      'javascript': ['javascript', 'js', 'node.js', 'nodejs', 'react', 'vue', 'angular'],
      'python': ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'scipy'],
      'java': ['java', 'spring', 'hibernate', 'maven', 'gradle'],
      'typescript': ['typescript', 'ts'],
      'c#': ['c#', 'csharp', '.net', 'dotnet', 'asp.net'],
      'php': ['php', 'laravel', 'symfony', 'codeigniter'],
      'ruby': ['ruby', 'rails', 'ruby on rails'],
      'go': ['golang', 'go'],
      'rust': ['rust'],
      'kotlin': ['kotlin'],
      'swift': ['swift', 'ios'],
      'scala': ['scala'],
      'r': ['r programming'],
      'matlab': ['matlab'],
      'perl': ['perl'],
      'shell': ['bash', 'shell', 'powershell', 'zsh'],
      
      // Frontend Technologies
      'react': ['react', 'reactjs', 'react.js', 'jsx'],
      'angular': ['angular', 'angularjs'],
      'vue.js': ['vue', 'vuejs', 'vue.js'],
      'html': ['html', 'html5'],
      'css': ['css', 'css3', 'scss', 'sass', 'less'],
      'bootstrap': ['bootstrap'],
      'tailwind css': ['tailwind', 'tailwindcss'],
      'material-ui': ['material-ui', 'mui'],
      'jquery': ['jquery'],
      
      // Backend Technologies
      'node.js': ['node', 'nodejs', 'node.js', 'express'],
      'express.js': ['express', 'expressjs'],
      'django': ['django'],
      'flask': ['flask'],
      'spring boot': ['spring boot', 'springboot'],
      'laravel': ['laravel'],
      'rails': ['rails', 'ruby on rails'],
      
      // Databases
      'mysql': ['mysql'],
      'postgresql': ['postgresql', 'postgres'],
      'mongodb': ['mongodb', 'mongo'],
      'redis': ['redis'],
      'elasticsearch': ['elasticsearch', 'elastic search'],
      'oracle': ['oracle db', 'oracle database'],
      'sql server': ['sql server', 'mssql'],
      'sqlite': ['sqlite'],
      'cassandra': ['cassandra'],
      'dynamodb': ['dynamodb'],
      
      // Cloud Platforms
      'aws': ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'rds', 'cloudformation'],
      'azure': ['azure', 'microsoft azure'],
      'gcp': ['gcp', 'google cloud', 'google cloud platform'],
      'docker': ['docker', 'containerization'],
      'kubernetes': ['kubernetes', 'k8s'],
      
      // DevOps & Tools
      'git': ['git', 'github', 'gitlab', 'bitbucket'],
      'jenkins': ['jenkins'],
      'ci/cd': ['ci/cd', 'continuous integration', 'continuous deployment'],
      'terraform': ['terraform'],
      'ansible': ['ansible'],
      'puppet': ['puppet'],
      'chef': ['chef'],
      
      // Testing
      'jest': ['jest'],
      'cypress': ['cypress'],
      'selenium': ['selenium'],
      'junit': ['junit'],
      'pytest': ['pytest'],
      'mocha': ['mocha'],
      'jasmine': ['jasmine'],
      
      // Data Science & Analytics
      'machine learning': ['machine learning', 'ml', 'artificial intelligence', 'ai'],
      'deep learning': ['deep learning', 'neural networks'],
      'tensorflow': ['tensorflow'],
      'pytorch': ['pytorch'],
      'pandas': ['pandas'],
      'numpy': ['numpy'],
      'scikit-learn': ['scikit-learn', 'sklearn'],
      'tableau': ['tableau'],
      'power bi': ['power bi', 'powerbi'],
      'spark': ['apache spark', 'spark'],
      'hadoop': ['hadoop'],
      
      // Mobile Development
      'react native': ['react native'],
      'flutter': ['flutter'],
      'android': ['android'],
      'ios': ['ios', 'swift'],
      'xamarin': ['xamarin'],
      
      // Design
      'figma': ['figma'],
      'sketch': ['sketch'],
      'adobe xd': ['adobe xd', 'xd'],
      'photoshop': ['photoshop'],
      'illustrator': ['illustrator'],
      'ui/ux': ['ui/ux', 'ui', 'ux', 'user experience', 'user interface'],
      
      // Project Management
      'agile': ['agile', 'scrum', 'kanban'],
      'jira': ['jira'],
      'trello': ['trello'],
      'asana': ['asana'],
      'confluence': ['confluence'],
      
      // Business Skills
      'excel': ['excel', 'microsoft excel'],
      'powerpoint': ['powerpoint', 'ppt'],
      'word': ['microsoft word', 'ms word'],
      'salesforce': ['salesforce', 'crm'],
      'sap': ['sap'],
      'erp': ['erp'],
      
      // Soft Skills
      'communication': ['communication', 'verbal communication', 'written communication'],
      'leadership': ['leadership', 'team lead', 'team management'],
      'problem solving': ['problem solving', 'analytical thinking'],
      'teamwork': ['teamwork', 'collaboration', 'team player'],
      'project management': ['project management', 'pmp']
    };
    
    // Extract skills using pattern matching
    Object.entries(skillDatabase).forEach(([skill, variations]) => {
      variations.forEach(variation => {
        const pattern = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        if (pattern.test(text)) {
          extractedSkills.add(skill);
        }
      });
    });
    
    // Additional pattern-based extraction for common skill formats
    const skillPatterns = [
      /\b([A-Z][a-z]+(?:\.[a-z]+)+)\b/g, // Framework patterns like React.js, Vue.js
      /\b([A-Z]{2,})\b/g, // Acronyms like AWS, API, SQL
      /\b(\w+(?:-\w+)+)\b/g, // Hyphenated skills like machine-learning
    ];
    
    skillPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleanMatch = match.toLowerCase().trim();
          if (cleanMatch.length > 2 && cleanMatch.length < 30) {
            // Check if it's a known skill or technology
            const knownTechTerms = ['api', 'sql', 'xml', 'json', 'rest', 'soap', 'mvc', 'orm', 'ide', 'sdk', 'cli'];
            if (knownTechTerms.includes(cleanMatch) || 
                Object.values(skillDatabase).flat().includes(cleanMatch)) {
              extractedSkills.add(cleanMatch.toUpperCase());
            }
          }
        });
      }
    });
    
    // Convert to proper case and filter
    const finalSkills = Array.from(extractedSkills)
      .map(skill => {
        // Proper case conversion
        if (skill === 'javascript') return 'JavaScript';
        if (skill === 'typescript') return 'TypeScript';
        if (skill === 'node.js') return 'Node.js';
        if (skill === 'react') return 'React';
        if (skill === 'angular') return 'Angular';
        if (skill === 'vue.js') return 'Vue.js';
        if (skill === 'python') return 'Python';
        if (skill === 'java') return 'Java';
        if (skill === 'c#') return 'C#';
        if (skill === 'aws') return 'AWS';
        if (skill === 'azure') return 'Azure';
        if (skill === 'docker') return 'Docker';
        if (skill === 'kubernetes') return 'Kubernetes';
        if (skill === 'git') return 'Git';
        if (skill === 'mysql') return 'MySQL';
        if (skill === 'postgresql') return 'PostgreSQL';
        if (skill === 'mongodb') return 'MongoDB';
        if (skill === 'machine learning') return 'Machine Learning';
        if (skill === 'ui/ux') return 'UI/UX Design';
        
        // Default: capitalize first letter
        return skill.charAt(0).toUpperCase() + skill.slice(1);
      })
      .filter(skill => skill.length > 1)
      .slice(0, 15); // Limit to top 15 skills
    
    return finalSkills;
  };

  // Get default responsibilities and requirements based on job title
  const getJobTitleResponsibilitiesAndRequirements = (jobTitle: string) => {
    const title = jobTitle.toLowerCase();
    
    if (title.includes('software') && (title.includes('developer') || title.includes('engineer'))) {
      return {
        responsibilities: [
          'Design, develop, and maintain high-quality software applications',
          'Collaborate with cross-functional teams to define and implement new features',
          'Write clean, maintainable, and efficient code following best practices',
          'Participate in code reviews and provide constructive feedback to team members'
        ],
        requirements: [
          'Bachelor\'s degree in Computer Science, Engineering, or related field',
          'Proficiency in programming languages such as Java, Python, or JavaScript',
          'Experience with software development methodologies and version control systems',
          'Strong problem-solving skills and attention to detail'
        ]
      };
    }
    
    if (title.includes('data') && (title.includes('scientist') || title.includes('analyst'))) {
      return {
        responsibilities: [
          'Analyze large datasets to identify trends, patterns, and business insights',
          'Develop and implement statistical models and machine learning algorithms',
          'Create data visualizations and reports to communicate findings to stakeholders',
          'Collaborate with business teams to understand requirements and provide data-driven solutions'
        ],
        requirements: [
          'Bachelor\'s degree in Statistics, Mathematics, Computer Science, or related field',
          'Proficiency in data analysis tools such as Python, R, SQL, or similar',
          'Experience with data visualization tools like Tableau, Power BI, or similar',
          'Strong analytical and problem-solving skills with attention to detail'
        ]
      };
    }
    
    if (title.includes('marketing')) {
      return {
        responsibilities: [
          'Develop and execute comprehensive marketing strategies and campaigns',
          'Analyze market trends and customer behavior to identify opportunities',
          'Manage social media presence and create engaging content across platforms',
          'Collaborate with sales teams to generate leads and support business growth'
        ],
        requirements: [
          'Bachelor\'s degree in Marketing, Communications, or related field',
          'Experience with digital marketing tools and platforms (Google Analytics, social media)',
          'Strong written and verbal communication skills',
          'Creative thinking and ability to work in a fast-paced environment'
        ]
      };
    }
    
    if (title.includes('sales')) {
      return {
        responsibilities: [
          'Identify and pursue new business opportunities and potential clients',
          'Build and maintain strong relationships with existing and prospective customers',
          'Present products and services to clients and negotiate contracts',
          'Meet and exceed sales targets while providing excellent customer service'
        ],
        requirements: [
          'Bachelor\'s degree in Business, Sales, or related field',
          'Proven track record in sales with strong negotiation skills',
          'Excellent communication and interpersonal skills',
          'Self-motivated with ability to work independently and as part of a team'
        ]
      };
    }
    
    if (title.includes('project manager') || title.includes('program manager')) {
      return {
        responsibilities: [
          'Plan, execute, and deliver projects on time and within budget',
          'Coordinate cross-functional teams and manage project resources effectively',
          'Monitor project progress and communicate status updates to stakeholders',
          'Identify and mitigate project risks while ensuring quality deliverables'
        ],
        requirements: [
          'Bachelor\'s degree in Business, Engineering, or related field',
          'PMP certification or equivalent project management experience',
          'Strong organizational and leadership skills',
          'Proficiency in project management tools and methodologies'
        ]
      };
    }
    
    if (title.includes('hr') || title.includes('human resources')) {
      return {
        responsibilities: [
          'Manage recruitment and selection processes for various positions',
          'Develop and implement HR policies and procedures',
          'Handle employee relations, performance management, and conflict resolution',
          'Ensure compliance with employment laws and company policies'
        ],
        requirements: [
          'Bachelor\'s degree in Human Resources, Psychology, or related field',
          'Knowledge of employment laws and HR best practices',
          'Strong interpersonal and communication skills',
          'Experience with HRIS systems and HR analytics'
        ]
      };
    }
    
    if (title.includes('accountant') || title.includes('accounting')) {
      return {
        responsibilities: [
          'Prepare and maintain accurate financial records and statements',
          'Process accounts payable and receivable transactions',
          'Assist with budget preparation and financial analysis',
          'Ensure compliance with accounting standards and tax regulations'
        ],
        requirements: [
          'Bachelor\'s degree in Accounting, Finance, or related field',
          'Knowledge of accounting principles and financial reporting standards',
          'Proficiency in accounting software and Microsoft Excel',
          'Strong attention to detail and analytical skills'
        ]
      };
    }
    
    if (title.includes('designer') || title.includes('ui') || title.includes('ux')) {
      return {
        responsibilities: [
          'Create user-centered designs for web and mobile applications',
          'Conduct user research and usability testing to inform design decisions',
          'Develop wireframes, prototypes, and high-fidelity mockups',
          'Collaborate with developers and product managers to implement designs'
        ],
        requirements: [
          'Bachelor\'s degree in Design, HCI, or related field',
          'Proficiency in design tools such as Figma, Sketch, or Adobe Creative Suite',
          'Strong portfolio demonstrating UI/UX design skills',
          'Understanding of user-centered design principles and methodologies'
        ]
      };
    }
    
    // Default for other roles
    return {
      responsibilities: [
        'Execute daily tasks and responsibilities according to company standards',
        'Collaborate effectively with team members and stakeholders',
        'Contribute to process improvements and operational efficiency',
        'Maintain professional development and stay current with industry trends'
      ],
      requirements: [
        'Bachelor\'s degree or equivalent experience in relevant field',
        'Strong communication and interpersonal skills',
        'Ability to work independently and manage multiple priorities',
        'Proficiency in relevant tools and technologies for the role'
      ]
    };
  };

  // Get default skills and education based on job title
  const getJobTitleDefaults = (jobTitle: string) => {
    const title = jobTitle.toLowerCase();
    
    if (title.includes('accountant') || title.includes('accounting')) {
      return {
        skills: ['QuickBooks', 'Excel', 'Financial Reporting', 'GAAP', 'Tax Preparation', 'Accounts Payable', 'Accounts Receivable', 'SAP'],
        education: "Bachelor's degree in Accounting or Finance"
      };
    }
    
    if (title.includes('marketing')) {
      return {
        skills: ['Digital Marketing', 'Social Media', 'Google Analytics', 'SEO', 'Content Marketing', 'Email Marketing', 'Adobe Creative Suite', 'Campaign Management'],
        education: "Bachelor's degree in Marketing or Communications"
      };
    }
    
    if (title.includes('sales')) {
      return {
        skills: ['CRM Software', 'Lead Generation', 'Negotiation', 'Customer Relationship Management', 'Sales Forecasting', 'Presentation Skills', 'Cold Calling', 'Salesforce'],
        education: "Bachelor's degree in Business or Sales"
      };
    }
    
    if (title.includes('hr') || title.includes('human resources')) {
      return {
        skills: ['HRIS', 'Recruitment', 'Employee Relations', 'Performance Management', 'Benefits Administration', 'Training & Development', 'Employment Law', 'Payroll'],
        education: "Bachelor's degree in Human Resources or related field"
      };
    }
    
    if (title.includes('developer') || title.includes('engineer') || title.includes('programmer')) {
      return {
        skills: ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'AWS', 'Docker'],
        education: "Bachelor's degree in Computer Science or Engineering"
      };
    }

    if (/news|journalist|reporter|anchor|producer|editor|broadcast|media|correspondent|writer|blogger/i.test(title)) {
      return {
        skills: ['News Writing', 'Video Editing', 'Broadcast Journalism', 'Script Writing', 'Adobe Premiere', 'Communication', 'Research', 'Storytelling'],
        education: "Bachelor's degree in Journalism or Mass Communication"
      };
    }
    
    return {
      skills: ['Communication', 'Problem Solving', 'Team Collaboration', 'Time Management', 'Analytical Thinking', 'Microsoft Office', 'Project Management'],
      education: "Bachelor's degree or equivalent experience"
    };
  };

  const fetchAISkillsForTitle = async (title: string) => {
    if (!title || title.length < 3) return;
    const key = cacheKey('job-skills', title.toLowerCase());
    const cached = getCached<string[]>(key);
    if (cached) { setAiSuggestedSkills(cached); return; }
    try {
      const reply = await sendAIMessage(
        [{ role: 'user', content: `List exactly 10 key skills required for a "${title}" job role. Return ONLY a JSON array of skill names, no explanation: ["skill1","skill2",...]` }],
        'You are a job skills expert. Return only a valid JSON array of skill strings.',
        undefined,
        200
      );
      const match = reply.match(/\[[\s\S]*\]/);
      if (match) {
        const skills: string[] = JSON.parse(match[0]).slice(0, 10);
        setCached(key, skills, 60 * 60 * 1000); // cache 1 hour
        setAiSuggestedSkills(skills);
      }
    } catch {
      // fallback to getJobTitleDefaults
      const { skills } = getJobTitleDefaults(title);
      setAiSuggestedSkills(skills);
    }
  };

  // Select suggestions
  const selectJobTitle = (title: string) => {
    updateJobData('jobTitle', title);
    setShowJobTitleSuggestions(false);
    setJobTitleSuggestions([]);
    fetchAISkillsForTitle(title);
    setTimeout(() => generateJobDescription(title), 500);
  };

  // Handle country input change with suggestions
  const handleCountryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateJobData('country', value);
    
    if (value.length >= 1) {
      const filtered = countries.filter(country => 
        country.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8);
      setCountrySuggestions(filtered);
      setShowCountrySuggestions(filtered.length > 0);
    } else {
      setShowCountrySuggestions(false);
    }
  };

  const selectCountry = (country: string) => {
    updateJobData('country', country);
    setShowCountrySuggestions(false);
  };

  const selectLocation = async (location: string) => {
    updateJobData('jobLocation', location);
    setShowLocationSuggestions(false);
    setLocationSuggestions([]);
    if (location && !/^(remote|hybrid|on-site)$/i.test(location.trim())) {
      const local = getCountryFromCity(location);
      if (local) { updateJobData('country', local); return; }
      try {
        const res = await fetch(`${API_ENDPOINTS.BASE_URL}/locations/city-country/${encodeURIComponent(location)}`);
        const data = await res.json();
        if (data.country) updateJobData('country', data.country);
      } catch {}
    }
  };

  const addSkill = (skill: string) => {
    if (!jobData.skills.includes(skill)) {
      updateJobData('skills', [...jobData.skills, skill]);
    }
    setSkillInput('');
    setShowSkillSuggestions(false);
  };

  // Smart skill search in job description
  const findSkillInJobDescription = (searchSkill: string): string[] => {
    if (!jobData.jobDescription) return [];
    
    const jdText = jobData.jobDescription.toLowerCase();
    const searchTerm = searchSkill.toLowerCase();
    const foundSkills = new Set<string>();
    
    // Skill mapping for better detection
    const skillMappings: { [key: string]: string[] } = {
      'react': ['react', 'reactjs', 'react.js', 'jsx', 'react native'],
      'angular': ['angular', 'angularjs', 'angular 2+', 'typescript'],
      'vue': ['vue', 'vuejs', 'vue.js', 'nuxt'],
      'node': ['node', 'nodejs', 'node.js', 'express', 'npm'],
      'python': ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy'],
      'java': ['java', 'spring', 'spring boot', 'hibernate', 'maven'],
      'javascript': ['javascript', 'js', 'es6', 'es2015', 'jquery'],
      'typescript': ['typescript', 'ts'],
      'aws': ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'cloudformation'],
      'azure': ['azure', 'microsoft azure', 'azure functions'],
      'docker': ['docker', 'containerization', 'containers'],
      'kubernetes': ['kubernetes', 'k8s', 'container orchestration'],
      'git': ['git', 'github', 'gitlab', 'version control'],
      'sql': ['sql', 'mysql', 'postgresql', 'database'],
      'mongodb': ['mongodb', 'mongo', 'nosql'],
      'redis': ['redis', 'caching'],
      'graphql': ['graphql', 'apollo'],
      'rest': ['rest', 'restful', 'api'],
      'microservices': ['microservices', 'microservice architecture'],
      'agile': ['agile', 'scrum', 'kanban'],
      'ci/cd': ['ci/cd', 'continuous integration', 'continuous deployment', 'jenkins'],
      'testing': ['testing', 'unit testing', 'integration testing', 'jest', 'cypress'],
      'machine learning': ['machine learning', 'ml', 'ai', 'artificial intelligence'],
      'data science': ['data science', 'data analysis', 'analytics'],
      'devops': ['devops', 'infrastructure', 'deployment'],
      'linux': ['linux', 'unix', 'bash', 'shell'],
      'windows': ['windows', 'powershell'],
      'mobile': ['mobile', 'ios', 'android', 'react native', 'flutter'],
      'frontend': ['frontend', 'front-end', 'ui', 'user interface'],
      'backend': ['backend', 'back-end', 'server-side'],
      'fullstack': ['fullstack', 'full-stack', 'full stack']
    };
    
    // Check if the search term or its variations exist in JD
    const variations = skillMappings[searchTerm] || [searchTerm];
    
    variations.forEach(variation => {
      const regex = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(jdText)) {
        // Add the properly formatted skill name
        const properSkillName = formatSkillName(variation);
        foundSkills.add(properSkillName);
      }
    });
    
    // Also run the comprehensive parsing to find related skills
    const allParsedSkills = parseSkillsFromJobDescription(jobData.jobDescription, jobData.jobTitle);
    
    // Filter parsed skills that are related to the search term
    allParsedSkills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      if (skillLower.includes(searchTerm) || searchTerm.includes(skillLower)) {
        foundSkills.add(skill);
      }
    });
    
    return Array.from(foundSkills);
  };
  
  // Format skill names properly
  const formatSkillName = (skill: string): string => {
    const skillFormatting: { [key: string]: string } = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'nodejs': 'Node.js',
      'node.js': 'Node.js',
      'reactjs': 'React',
      'react.js': 'React',
      'vuejs': 'Vue.js',
      'vue.js': 'Vue.js',
      'angularjs': 'Angular',
      'mysql': 'MySQL',
      'postgresql': 'PostgreSQL',
      'mongodb': 'MongoDB',
      'aws': 'AWS',
      'gcp': 'GCP',
      'ui/ux': 'UI/UX Design',
      'ci/cd': 'CI/CD',
      'api': 'API',
      'rest': 'REST API',
      'graphql': 'GraphQL',
      'html': 'HTML',
      'css': 'CSS',
      'sql': 'SQL'
    };
    
    const lowerSkill = skill.toLowerCase();
    return skillFormatting[lowerSkill] || skill.charAt(0).toUpperCase() + skill.slice(1);
  };
  
  // Enhanced skill addition with JD parsing
  const addSkillWithParsing = (inputSkill: string) => {
    const trimmedSkill = inputSkill.trim();
    if (!trimmedSkill) return;
    
    // First, add the manually entered skill if it's not already there
    const formattedSkill = formatSkillName(trimmedSkill);
    const currentSkills = [...jobData.skills];
    
    // Check if skill already exists to prevent duplicates
    if (currentSkills.includes(formattedSkill)) {
      setSkillInput('');
      setShowSkillSuggestions(false);
      return;
    }
    
    currentSkills.push(formattedSkill);
    
    // Then, search for related skills in the job description
    const foundSkills = findSkillInJobDescription(trimmedSkill);
    
    // Add found skills that aren't already in the list
    const newSkills = foundSkills.filter(skill => !currentSkills.includes(skill));
    
    if (newSkills.length > 0) {
      const updatedSkills = [...currentSkills, ...newSkills].slice(0, 15); // Limit to 15 skills
      updateJobData('skills', updatedSkills);
      
      setNotification({
        type: 'success',
        message: `Added "${formattedSkill}" and found ${newSkills.length} related skills from JD: ${newSkills.join(', ')}`,
        isVisible: true
      });
    } else {
      updateJobData('skills', currentSkills);
      
      if (jobData.jobDescription) {
        setNotification({
          type: 'info',
          message: `Added "${formattedSkill}" - no additional related skills found in JD`,
          isVisible: true
        });
      }
    }
    
    setSkillInput('');
    setShowSkillSuggestions(false);
  };

  const searchCompanies = async (query: string) => {
    if (query.length < 2) {
      setCompanySearchResults([]);
      setShowCompanyDropdown(false);
      return;
    }

    try {
      // Fetch companies from backend API
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/companies?search=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        const companies = Array.isArray(data) ? data : (data.companies || data.data || []);
        
        const mappedCompanies = companies.map((company: any) => {
          const name = company.name || company.companyName || '';
          return {
            id: company._id || company.id || name,
            name,
            logo: getCompanyLogo(name) || company.logo || company.logoUrl || company.imageUrl || company.image || '',
            tagline: company.tagline || company.companyTagline || company.companySlogan || ''
          };
        });

        // Enhanced search: also check if the query matches any part of company names
        const queryLower = query.toLowerCase();
        const additionalMatches = TRENDING_COMPANIES.filter(c => {
          const nameLower = c.name.toLowerCase();
          return nameLower.includes(queryLower) || 
                 queryLower.includes(nameLower) ||
                 // Check for partial word matches
                 nameLower.split(' ').some(word => word.startsWith(queryLower)) ||
                 queryLower.split(' ').some(word => nameLower.includes(word));
        });
        
        // Merge backend results with trending companies, avoiding duplicates
        const merged = [...mappedCompanies];
        additionalMatches.forEach(trending => {
          if (!merged.some(m => m.name.toLowerCase() === trending.name.toLowerCase())) {
            merged.push(trending);
          }
        });
        
        // If no results found, allow user to add the company they typed
        if (merged.length === 0 && query.trim().length > 2) {
          merged.push({
            id: 'custom-' + Date.now(),
            name: query.trim(),
            logo: ''
          });
        }
        
        setCompanySearchResults(merged);
        setShowCompanyDropdown(merged.length > 0);
      } else {
        // Fallback to trending companies with enhanced search
        const queryLower = query.toLowerCase();
        const filtered = TRENDING_COMPANIES.filter(company => {
          const nameLower = company.name.toLowerCase();
          return nameLower.includes(queryLower) || 
                 queryLower.includes(nameLower) ||
                 nameLower.split(' ').some(word => word.startsWith(queryLower)) ||
                 queryLower.split(' ').some(word => nameLower.includes(word));
        });
        
        // If no matches in trending companies, allow custom company
        if (filtered.length === 0 && query.trim().length > 2) {
          filtered.push({
            id: 'custom-' + Date.now(),
            name: query.trim(),
            logo: ''
          });
        }
        
        setCompanySearchResults(filtered);
        setShowCompanyDropdown(filtered.length > 0);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      // Enhanced fallback search
      const queryLower = query.toLowerCase();
      const filtered = TRENDING_COMPANIES.filter(company => {
        const nameLower = company.name.toLowerCase();
        return nameLower.includes(queryLower) || 
               queryLower.includes(nameLower) ||
               nameLower.split(' ').some(word => word.startsWith(queryLower)) ||
               queryLower.split(' ').some(word => nameLower.includes(word));
      });
      
      // Always allow custom company entry
      if (query.trim().length > 2) {
        filtered.push({
          id: 'custom-' + Date.now(),
          name: query.trim(),
          logo: ''
        });
      }
      
      setCompanySearchResults(filtered);
      setShowCompanyDropdown(filtered.length > 0);
    }
  };

  const selectCompany = (company: any) => {
    updateJobData('companyName', company.name);
    updateJobData('companyLogo', company.logo);
    updateJobData('companyId', company.id);
    updateJobData('companyTagline', company.tagline || company.companyTagline || company.companySlogan || '');
    setShowCompanyDropdown(false);
  };

  const removeSkill = (skillToRemove: string) => {
    updateJobData('skills', jobData.skills.filter(skill => skill !== skillToRemove));
  };

  const validateStep = (step: number): { isValid: boolean; message: string } => {
    switch (step) {
      case 1:
        if (!jobData.jobTitle.trim()) return { isValid: false, message: 'Job title is required' };
        if (!jobData.companyName.trim()) return { isValid: false, message: 'Company name is required' };
        if (!jobData.jobLocation.trim()) return { isValid: false, message: 'Job location is required' };
        if (!jobData.jobCategory.trim()) return { isValid: false, message: 'Job category is required' };
        if (!jobData.country.trim()) return { isValid: false, message: 'Country is required' };
        break;
      case 2:
        // Step 2 is removed - no validation needed
        break;
      case 3:
        if (!Array.isArray(jobData.jobType) || jobData.jobType.length === 0) {
          return { isValid: false, message: 'At least one job type is required' };
        }
        break;
      case 4:
        // Salary section is now optional
        break;
      case 5:
        if (jobData.skills.length === 0) return { isValid: false, message: 'At least one skill is required' };
        const education = Array.isArray(jobData.educationLevel) ? jobData.educationLevel : jobData.educationLevel ? [jobData.educationLevel] : [];
        if (education.length === 0) return { isValid: false, message: 'Education level is required' };
        break;
      case 6:
        if (!jobData.jobDescription.trim()) return { isValid: false, message: 'Job description is required' };
        break;
    }
    return { isValid: true, message: '' };
  };

  const nextStep = () => {
    const validation = validateStep(currentStep);
    if (!validation.isValid) {
      setNotification({
        type: 'error',
        message: validation.message,
        isVisible: true
      });
      return;
    }
    
    // Skip step 2 - go directly from step 1 to step 3
    if (currentStep === 1) {
      setCurrentStep(3);
    } else if (currentStep < 7) {
      const nextStepNum = currentStep + 1;
      setCurrentStep(nextStepNum);
      // Auto-generate JD when entering step 6 ONLY if no JD exists yet
      if (nextStepNum === 6 && jobData.jobTitle && !jobData.jobDescription.trim()) {
        setTimeout(() => generateJobDescription(jobData.jobTitle), 300);
      }
      // In parse mode, always regenerate a clean description when entering step 6
      if (nextStepNum === 6 && jobData.jobTitle && mode === 'parse') {
        setTimeout(() => generateJobDescription(jobData.jobTitle, true), 300);
      }
      // If skipping to review (step 7) and JD is empty, generate it now
      if (nextStepNum === 7 && !jobData.jobDescription.trim() && jobData.jobTitle) {
        setTimeout(() => generateJobDescription(jobData.jobTitle, true), 300);
      }
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    // Skip step 2 - go directly from step 3 to step 1
    if (currentStep === 3) {
      setCurrentStep(1);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
    
    // Scroll to top smoothly when moving to previous step
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const renderStep1 = () => (
    <div className="px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <BackButton 
          onClick={() => mode === 'parse' ? onNavigate('job-parsing') : onNavigate('job-posting-selection')}
          text={mode === 'parse' ? 'Back to Parser' : 'Back to Selection'}
        />
        <button onClick={() => onNavigate('dashboard')} className="text-gray-500 text-2xl hover:text-gray-700">×</button>
      </div>
      
      <div className="space-y-8">
        <div className="relative">
          <label className="block text-gray-700 font-medium mb-3">Job title *</label>
          <div className="relative">
            <input
              type="text"
              value={jobData.jobTitle}
              onChange={handleJobTitleChange}
              onBlur={() => { if (jobData.jobTitle.length >= 3) { fetchAISkillsForTitle(jobData.jobTitle); } }}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Software Engineer"
            />
            {isLoadingJobTitles && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
          {showJobTitleSuggestions && jobTitleSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {jobTitleSuggestions.map((title, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectJobTitle(title)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm border-b last:border-b-0 transition-colors flex items-center justify-between group"
                >
                  <span>{title}</span>
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">✨ AI</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-3">Job location type *</label>
          <select
            value={jobData.locationType}
            onChange={(e) => updateJobData('locationType', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="In person">In person</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>
        
        <div className="relative">
          <label className="block text-gray-700 font-medium mb-3">Company for this job *</label>
          <p className="text-gray-500 text-sm mb-3">You can post jobs for any company, not just your registered company</p>
          <div className="relative">
            <input
              type="text"
              value={jobData.companyName}
              onChange={(e) => {
                updateJobData('companyName', e.target.value);
                searchCompanies(e.target.value);
              }}
              onFocus={() => {
                if (jobData.companyName.length >= 2) {
                  searchCompanies(jobData.companyName);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowCompanyDropdown(false), 200);
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search for company (e.g., Google, Microsoft, Netflix)..."
            />
            {showCompanyDropdown && companySearchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {companySearchResults.map((company) => (
                  <div
                    key={company.id}
                    onMouseDown={() => selectCompany(company)}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors flex items-center space-x-3 border-b last:border-b-0"
                  >
                    <div className="w-8 h-8 flex-shrink-0">
                      <img
                        src={company.logo}
                        alt={company.name}
                        className="w-8 h-8 rounded object-contain bg-white border"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <span className="text-gray-900 font-medium">{company.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="relative">
          <label className="block text-gray-700 font-medium mb-2">What is the job location? *</label>
          <p className="text-gray-500 text-sm mb-3">Enter city, region, or select Remote</p>
          <div className="relative">
            <input
              type="text"
              value={jobData.jobLocation}
              onChange={handleLocationChange}
              onBlur={(e) => handleLocationBlur(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Chennai, Remote, Bangalore"
            />
            {isLoadingLocations && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
          {showLocationSuggestions && locationSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {locationSuggestions.map((location, index) => (
                <div
                  key={index}
                  onMouseDown={() => selectLocation(location)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm border-b last:border-b-0 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <span>{location}</span>
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">📍</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-3">Job Category *</label>
          {(() => {
            const JOB_CATEGORIES = [
              'Information Technology','Software Development','Data Science & Analytics',
              'Sales & Marketing','Finance & Accounting','Human Resources','Operations',
              'Customer Service','Healthcare','Engineering','Education','Legal',
              'Manufacturing','Retail','Construction','Hospitality & Tourism',
              'Media & Communications','Logistics & Supply Chain','Real Estate','Oil & Gas',
              'Telecommunications','Banking & Insurance','Other',
            ];
            const filtered = JOB_CATEGORIES.filter(c => c.toLowerCase().includes(catInput.toLowerCase()));
            return (
              <div className="relative">
                <div
                  className={`flex items-center border rounded-lg px-4 py-3 bg-white cursor-text ${
                    catOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => setCatOpen(true)}
                >
                  <input
                    type="text"
                    value={catInput}
                    onChange={(e) => { setCatInput(e.target.value); updateJobData('jobCategory', e.target.value); setCatOpen(true); }}
                    onFocus={() => setCatOpen(true)}
                    onBlur={() => setTimeout(() => setCatOpen(false), 150)}
                    placeholder="Select or type a category..."
                    className="flex-1 outline-none text-base bg-transparent text-gray-800 placeholder-gray-400"
                  />
                  <svg className={`w-4 h-4 text-gray-400 ml-2 transition-transform ${catOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </div>
                {catOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {filtered.length === 0 && catInput && (
                      <button
                        type="button"
                        onMouseDown={() => { updateJobData('jobCategory', catInput); setCatInput(catInput); setCatOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50"
                      >
                        + Add "{catInput}"
                      </button>
                    )}
                    {filtered.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onMouseDown={() => { updateJobData('jobCategory', cat); setCatInput(cat); setCatOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 flex items-center justify-between ${
                          jobData.jobCategory === cat ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'
                        }`}
                      >
                        {cat}
                        {jobData.jobCategory === cat && <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-3">Nationality Restriction</label>
          <p className="text-gray-500 text-sm mb-2">Specify if this job is open only to a particular nationality.</p>
          {parsedData?.nationalityRestriction && (
            <p className="text-xs text-green-600 mb-2">✨ Auto-detected from JD: <strong>{parsedData.nationalityRestriction}</strong></p>
          )}
          {(() => {
            const NAT_OPTIONS = [
              'Oman National Only','UAE National Only','Saudi National Only',
              'Bahrain National Only','Kuwait National Only','Qatar National Only',
              'GCC National Only','Indian National Only','No restriction (Open to all)',
            ];
            const filtered = NAT_OPTIONS.filter(n => n.toLowerCase().includes(natInput.toLowerCase()));
            return (
              <div className="relative">
                <div
                  className={`flex items-center border rounded-lg px-4 py-3 bg-white cursor-text ${
                    natOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => setNatOpen(true)}
                >
                  <input
                    type="text"
                    value={natInput}
                    onChange={(e) => { setNatInput(e.target.value); updateJobData('nationalityRestriction', e.target.value === 'No restriction (Open to all)' ? '' : e.target.value); setNatOpen(true); }}
                    onFocus={() => setNatOpen(true)}
                    onBlur={() => setTimeout(() => setNatOpen(false), 150)}
                    placeholder="Select or type nationality restriction..."
                    className="flex-1 outline-none text-base bg-transparent text-gray-800 placeholder-gray-400"
                  />
                  {natInput && (
                    <button type="button" onMouseDown={() => { setNatInput(''); updateJobData('nationalityRestriction', ''); }} className="mr-1 text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                  <svg className={`w-4 h-4 text-gray-400 ml-1 transition-transform ${natOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </div>
                {natOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {filtered.length === 0 && natInput && (
                      <button
                        type="button"
                        onMouseDown={() => { updateJobData('nationalityRestriction', natInput); setNatInput(natInput); setNatOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50"
                      >
                        + Add "{natInput}"
                      </button>
                    )}
                    {filtered.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onMouseDown={() => { const val = opt === 'No restriction (Open to all)' ? '' : opt; updateJobData('nationalityRestriction', val); setNatInput(opt === 'No restriction (Open to all)' ? '' : opt); setNatOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 flex items-center justify-between ${
                          jobData.nationalityRestriction === (opt === 'No restriction (Open to all)' ? '' : opt) ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'
                        }`}
                      >
                        {opt}
                        {jobData.nationalityRestriction === (opt === 'No restriction (Open to all)' ? '' : opt) && <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
          {jobData.nationalityRestriction && (
            <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              ⚠️ This job will be prominently marked as <strong>{jobData.nationalityRestriction}</strong> on job listings.
            </p>
          )}
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-3">
            Urgent Note{' '}
            <span className="text-gray-400 font-normal text-sm">(optional)</span>
          </label>
          <p className="text-gray-500 text-sm mb-2">Highlight urgent requirements. Shown as an orange alert on the job card.</p>
          <textarea
            value={jobData.urgentNote || ''}
            onChange={(e) => updateJobData('urgentNote', e.target.value)}
            rows={2}
            className="w-full border border-orange-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-sm"
            placeholder="e.g. Immediate joiners preferred. Strong analytical skills required."
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-3">Priority Level *</label>
          <select
            value={jobData.priority || 'Medium'}
            onChange={(e) => updateJobData('priority', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Low">Low Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="High">High Priority</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
        
        <div className="relative">
          <label className="block text-gray-700 font-medium mb-3">Country *</label>
          <input
            type="text"
            value={jobData.country}
            onChange={handleCountryChange}
            onFocus={() => jobData.country.length >= 1 && setShowCountrySuggestions(true)}
            onBlur={() => setTimeout(() => setShowCountrySuggestions(false), 200)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. India, United States"
          />
          {showCountrySuggestions && countrySuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {countrySuggestions.map((country, index) => (
                <button
                  key={index}
                  type="button"
                  onMouseDown={() => selectCountry(country)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm border-b last:border-b-0 transition-colors"
                >
                  {country}
                </button>
              ))}
            </div>
          )}
        </div>
        

        
        <div>
          <label className="block text-gray-700 font-medium mb-3">
            Language(s) required{' '}
            <span className="text-gray-400 font-normal text-sm">(optional)</span>
            {Array.isArray(jobData.language) && jobData.language.length > 0 && mode === 'parse' && (
              <span className="ml-2 text-xs text-green-600">✨ Auto-detected from JD</span>
            )}
          </label>
          {(() => {
            const selected = Array.isArray(jobData.language) ? jobData.language : jobData.language ? [jobData.language] : [];
            return (
              <>
                <div className="flex flex-wrap gap-2 mb-3">
                  {['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi', 'Arabic'].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        const newLangs = selected.includes(lang)
                          ? selected.filter((l: string) => l !== lang)
                          : [...selected, lang];
                        updateJobData('language', newLangs);
                      }}
                      className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                        selected.includes(lang)
                          ? 'border-blue-600 text-blue-600 bg-blue-50'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {selected.includes(lang) ? '✓' : '+'} {lang}
                    </button>
                  ))}
                  {selected.filter((l: string) => !['English','Hindi','Tamil','Telugu','Kannada','Malayalam','Marathi','Bengali','Gujarati','Punjabi','Arabic'].includes(l)).map((lang: string) => (
                    <span key={lang} className="inline-flex items-center px-3 py-1.5 border border-blue-600 rounded-lg text-sm text-blue-600 bg-blue-50">
                      ✓ {lang}
                      <button type="button" onClick={() => updateJobData('language', selected.filter((l: string) => l !== lang))} className="ml-2 text-blue-400 hover:text-blue-700">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={langInput}
                    onChange={(e) => setLangInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = langInput.trim();
                        if (val && !selected.includes(val)) updateJobData('language', [...selected, val]);
                        setLangInput('');
                      }
                    }}
                    placeholder="Type a language and press Enter..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = langInput.trim();
                      if (val && !selected.includes(val)) updateJobData('language', [...selected, val]);
                      setLangInput('');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </>
            );
          })()}
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-3">Experience Range</label>
          {mode === 'parse' && jobData.experienceRange && /^\d+ years? - \d+ years?$/.test(jobData.experienceRange) && (
            <p className="text-xs text-green-600 mb-2">✨ Auto-extracted from JD: <strong>{jobData.experienceRange}</strong></p>
          )}
          {mode === 'parse' && jobData.noticePeriod && (
            <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2 mb-3">
              📋 <strong>Note from JD:</strong> {jobData.noticePeriod}
            </p>
          )}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-gray-500 text-sm mb-1">Min Experience</label>
              <select
                value={jobData.experienceRange.split(' - ')[0]?.trim() || ''}
                onChange={(e) => {
                  const max = jobData.experienceRange.split(' - ')[1]?.trim() || '';
                  updateJobData('experienceRange', e.target.value ? (max ? `${e.target.value} - ${max}` : e.target.value) : max);
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select</option>
                {[0,1,2,3,4,5,6,7,8,9,10,12,15,20].map(y => (
                  <option key={y} value={`${y} year${y !== 1 ? 's' : ''}`}>{y} year{y !== 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-gray-500 text-sm mb-1">Max Experience</label>
              <select
                value={jobData.experienceRange.split(' - ')[1]?.trim() || ''}
                onChange={(e) => {
                  const min = jobData.experienceRange.split(' - ')[0]?.trim() || '';
                  updateJobData('experienceRange', e.target.value ? (min ? `${min} - ${e.target.value}` : e.target.value) : min);
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select</option>
                {[1,2,3,4,5,6,7,8,9,10,12,15,20,25].map(y => (
                  <option key={y} value={`${y} year${y !== 1 ? 's' : ''}`}>{y} year{y !== 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

      </div>
      
      <div className="flex justify-end mt-16">
        <button
          onClick={nextStep}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium flex items-center space-x-2 hover:bg-blue-700"
        >
          <span>Continue</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Hiring goals & Requirements</h1>
      
      <div className="space-y-8">
        <div>
          <label className="block text-gray-700 font-medium mb-3">Hiring timeline for this job *</label>
          <select
            value={jobData.hiringTimeline}
            onChange={(e) => updateJobData('hiringTimeline', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select an option</option>
            <option value="1 to 3 days">1 to 3 days</option>
            <option value="3 to 7 days">3 to 7 days</option>
            <option value="1 to 2 weeks">1 to 2 weeks</option>
            <option value="2 to 4 weeks">2 to 4 weeks</option>
            <option value="More than 4 weeks">More than 4 weeks</option>
          </select>
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-3">Number of people to hire in the next 30 days *</label>
          <input
            type="number"
            min="1"
            max="100"
            value={jobData.numberOfPeople || ''}
            onChange={(e) => updateJobData('numberOfPeople', parseInt(e.target.value) || 0)}
            placeholder="Enter number of people to hire"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 font-medium mb-3">Work Authorization Required</label>
          <div className="space-y-2">
            {[
              'US Citizen',
              'Green Card Holder',
              'H1B Visa',
              'L1 Visa',
              'OPT/CPT',
              'TN Visa',
              'No Sponsorship Required',
              'Will Sponsor'
            ].map((auth) => (
              <label key={auth} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={(jobData.workAuth || []).includes(auth)}
                  onChange={(e) => {
                    const currentAuth = jobData.workAuth || [];
                    const newAuth = e.target.checked
                      ? [...currentAuth, auth]
                      : currentAuth.filter(a => a !== auth);
                    updateJobData('workAuth', newAuth);
                  }}
                  className="rounded"
                />
                <span className="text-gray-700">{auth}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-gray-700 font-medium mb-2">Expand your candidate search</h3>
          <p className="text-gray-500 text-sm mb-4">Over 10 million active job seekers are open to relocating.</p>
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={jobData.expandCandidateSearch}
              onChange={(e) => updateJobData('expandCandidateSearch', e.target.checked)}
              className="mt-1"
            />
            <div>
              <span className="text-gray-700">I'm interested in attracting candidates open to relocation</span>
              <button className="text-blue-600 ml-2 text-sm underline hover:text-blue-700">How it works</button>
              <p className="text-gray-500 text-sm mt-1">Marking your interest helps improve our recommendations.</p>
            </div>
          </label>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-12">
        <button
          onClick={prevStep}
          className="flex items-center space-x-2 text-blue-600 font-medium hover:text-blue-700"
        >
          <span>←</span>
          <span>Back</span>
        </button>
        <button
          onClick={nextStep}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium flex items-center space-x-2 hover:bg-blue-700"
        >
          <span>Continue</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="px-6 py-8">
      <div className="space-y-8">
        <div>
          <label className="block text-gray-700 font-medium mb-6">Job type *</label>
          <div className="flex flex-wrap gap-4">
            {['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  const newTypes = jobData.jobType.includes(type)
                    ? jobData.jobType.filter(t => t !== type)
                    : [...jobData.jobType, type];
                  updateJobData('jobType', newTypes);
                }}
                className={`px-6 py-3 border rounded-lg font-medium transition-colors ${
                  jobData.jobType.includes(type)
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                + {type}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-12">
        <button
          onClick={prevStep}
          className="flex items-center space-x-2 text-blue-600 font-medium hover:text-blue-700"
        >
          <span>←</span>
          <span>Back</span>
        </button>
        <button
          onClick={nextStep}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium flex items-center space-x-2 hover:bg-blue-700"
        >
          <span>Continue</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="px-6 py-8">
      <div className="space-y-8">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-700 font-medium">Pay (optional)</h3>
            {salaryModified && (
              <button
                onClick={() => {
                  updateJobData('minSalary', '');
                  updateJobData('maxSalary', '');
                  setSalaryModified(false);
                  setNotification({
                    type: 'info',
                    message: 'Salary information cleared - job description will not include salary',
                    isVisible: true
                  });
                }}
                className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center space-x-1"
              >
                <span>×</span>
                <span>Clear Salary</span>
              </button>
            )}
          </div>
          <p className="text-gray-500 text-sm mb-6">You can skip this section or add pay information to attract more candidates.</p>
          
          <div className="flex flex-wrap gap-3 items-end">
            <div style={{minWidth: '180px'}} className="flex-shrink-0">
              <label className="block text-gray-600 text-sm mb-2">Show pay by</label>
              <select
                value={jobData.payType}
                onChange={(e) => {
                  updateJobData('payType', e.target.value);
                  if (e.target.value === 'Maximum amount') updateJobData('minSalary', '');
                  if (e.target.value === 'Starting amount') updateJobData('maxSalary', '');
                  if (e.target.value === 'Exact amount') { updateJobData('minSalary', ''); updateJobData('maxSalary', ''); }
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Range">Range</option>
                <option value="Starting amount">Starting amount</option>
                <option value="Maximum amount">Maximum amount (Upto)</option>
                <option value="Exact amount">Exact amount</option>
              </select>
            </div>
            
            <div className="w-28">
              <label className="block text-gray-600 text-sm mb-2">Currency</label>
              <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 font-medium">
                ₹ INR
              </div>
            </div>
            
            {jobData.payType !== 'Maximum amount' && (
              <div className="w-32">
                <label className="block text-gray-600 text-sm mb-2">
                  {jobData.payType === 'Starting amount' ? 'Starting amount' : jobData.payType === 'Exact amount' ? 'Amount' : 'Minimum'}
                </label>
                <input
                  type="text"
                  value={salaryFocused === 'min' ? jobData.minSalary : (jobData.minSalary ? formatSalary(jobData.minSalary) : '')}
                  onFocus={() => setSalaryFocused('min')}
                  onChange={(e) => {
                    updateJobData('minSalary', e.target.value.replace(/[^0-9]/g, ''));
                    setSalaryModified(true);
                  }}
                  onBlur={() => setSalaryFocused(null)}
                  placeholder="e.g. 500000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            
            {jobData.payType === 'Range' && (
              <div className="flex items-end pb-2">
                <span className="text-gray-500">to</span>
              </div>
            )}
            
            {jobData.payType !== 'Starting amount' && jobData.payType !== 'Exact amount' && (
              <div className="w-32">
                <label className="block text-gray-600 text-sm mb-2">
                  {jobData.payType === 'Maximum amount' ? 'Upto (Maximum)' : 'Maximum'}
                </label>
                <input
                  type="text"
                  value={salaryFocused === 'max' ? jobData.maxSalary : (jobData.maxSalary ? formatSalary(jobData.maxSalary) : '')}
                  onFocus={() => setSalaryFocused('max')}
                  onChange={(e) => {
                    updateJobData('maxSalary', e.target.value.replace(/[^0-9]/g, ''));
                    setSalaryModified(true);
                  }}
                  onBlur={() => setSalaryFocused(null)}
                  placeholder={jobData.payType === 'Maximum amount' ? 'e.g. 2500000' : 'e.g. 800000'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>
          {/* Salary preview hint */}
          {salaryModified && (jobData.minSalary || jobData.maxSalary) && (
            <p className="text-xs text-gray-500 mt-2">
              Preview: {jobData.payType === 'Maximum amount' ? `Upto ₹${formatSalary(jobData.maxSalary)}` :
                        jobData.payType === 'Starting amount' ? `From ₹${formatSalary(jobData.minSalary)}` :
                        jobData.payType === 'Exact amount' ? `₹${formatSalary(jobData.minSalary)}` :
                        `₹${formatSalary(jobData.minSalary)} - ₹${formatSalary(jobData.maxSalary)}`} {jobData.payRate}
            </p>
          )}
          
          <div className="mt-4">
            <label className="block text-gray-600 text-sm mb-2">Rate</label>
            <select
              value={jobData.payRate}
              onChange={(e) => updateJobData('payRate', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="per year">per year</option>
              <option value="per month">per month</option>
              <option value="per hour">per hour</option>
            </select>
          </div>
          
          {/* Salary Status Indicator */}
          <div className="mt-4 p-3 rounded-lg border">
            <div className="flex items-center space-x-2">
              {salaryModified ? (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-sm text-green-700 font-medium">Salary will be included in job description</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  <span className="text-sm text-gray-600">Salary is optional - will show "Competitive salary" if not specified</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-gray-700 font-medium mb-4">Benefits</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              'Visa sponsorship', 'Green card sponsorship', 'Dental insurance',
              'Health insurance', 'Vision insurance', 'AD&D insurance', 'Life insurance'
            ].map((benefit) => (
              <button
                key={benefit}
                type="button"
                onClick={() => {
                  const newBenefits = jobData.benefits.includes(benefit)
                    ? jobData.benefits.filter(b => b !== benefit)
                    : [...jobData.benefits, benefit];
                  updateJobData('benefits', newBenefits);
                }}
                className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                  jobData.benefits.includes(benefit)
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                + {benefit}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-gray-700 font-medium mb-3">Work Authorization Required</h3>
          <div className="space-y-2">
            {[
              'US Citizen',
              'Green Card Holder',
              'H1B Visa',
              'L1 Visa',
              'OPT/CPT',
              'TN Visa',
              'No Sponsorship Required',
              'Will Sponsor'
            ].map((auth) => (
              <label key={auth} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={(jobData.workAuth || []).includes(auth)}
                  onChange={(e) => {
                    const currentAuth = jobData.workAuth || [];
                    const newAuth = e.target.checked
                      ? [...currentAuth, auth]
                      : currentAuth.filter(a => a !== auth);
                    updateJobData('workAuth', newAuth);
                  }}
                  className="rounded"
                />
                <span className="text-gray-700">{auth}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-12">
        <button
          onClick={prevStep}
          className="flex items-center space-x-2 text-blue-600 font-medium hover:text-blue-700"
        >
          <span>←</span>
          <span>Back</span>
        </button>
        <button
          onClick={nextStep}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium flex items-center space-x-2 hover:bg-blue-700"
        >
          <span>Continue</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );

  const renderQualifications = () => (
    <div className="px-6 py-8">
      <div className="space-y-8">
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-700 font-medium">What skills should candidates have?</h3>
            {jobData.jobDescription && (
              <button
                onClick={() => {
                  const parsedSkills = parseSkillsFromJobDescription(jobData.jobDescription, jobData.jobTitle);
                  const mergedSkills = [...new Set([...jobData.skills, ...parsedSkills])].slice(0, 15);
                  updateJobData('skills', mergedSkills);
                  setNotification({
                    type: 'success',
                    message: `Extracted ${parsedSkills.length} skills from job description!`,
                    isVisible: true
                  });
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium flex items-center space-x-1 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                <span>Extract from JD</span>
              </button>
            )}
          </div>
          
          {/* Selected Skills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {jobData.skills.map((skill, index) => (
              <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                {skill}
                <button 
                  type="button" 
                  onClick={() => removeSkill(skill)} 
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          
          {/* Skill Input with AI Suggestions */}
          <div className="relative">
            <input
              type="text"
              value={skillInput}
              onChange={handleSkillInputChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && skillInput.trim()) {
                  e.preventDefault();
                  addSkillWithParsing(skillInput.trim());
                }
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Type skills (e.g. Python, React, AWS)..."
            />
            {isLoadingSkills && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            )}
            {showSkillSuggestions && skillSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {skillSuggestions.map((skill, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => addSkillWithParsing(skill)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm border-b last:border-b-0 transition-colors flex items-center justify-between group"
                  >
                    <span>{skill}</span>
                    <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">AI</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* AI Suggested Skills based on Job Title */}
          {(aiSuggestedSkills.length > 0 || jobData.jobTitle) && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                AI suggested for "{jobData.jobTitle || 'your role'}"
              </p>
              <div className="flex flex-wrap gap-2">
                {(aiSuggestedSkills.length > 0 ? aiSuggestedSkills : getJobTitleDefaults(jobData.jobTitle).skills).map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => {
                      const newSkills = jobData.skills.includes(skill)
                        ? jobData.skills.filter(s => s !== skill)
                        : [...jobData.skills, skill];
                      updateJobData('skills', newSkills);
                    }}
                    className={`px-3 py-1.5 border rounded-lg text-sm transition-colors ${
                      jobData.skills.includes(skill)
                        ? 'border-blue-600 text-blue-600 bg-blue-50'
                        : 'border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    {jobData.skills.includes(skill) ? '✓' : '+'} {skill}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Good to Have Skills Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-gray-700 font-medium">Good to Have Skills</h3>
                <p className="text-xs text-gray-400 mt-0.5">Optional skills that are a bonus but not required</p>
              </div>
              {mode === 'parse' && parsedData?.goodToHaveSkills?.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const toAdd = parsedData.goodToHaveSkills.filter((s: string) => !jobData.goodToHaveSkills.includes(s));
                    updateJobData('goodToHaveSkills', [...jobData.goodToHaveSkills, ...toAdd]);
                  }}
                  className="text-xs bg-amber-100 text-amber-700 border border-amber-300 px-3 py-1 rounded-lg hover:bg-amber-200 transition-colors"
                >
                  Import from JD ({parsedData.goodToHaveSkills.length})
                </button>
              )}
            </div>

            {/* Selected Good to Have tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {jobData.goodToHaveSkills.map((skill, index) => (
                <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800 border border-amber-200">
                  {skill}
                  <button
                    type="button"
                    onClick={() => updateJobData('goodToHaveSkills', jobData.goodToHaveSkills.filter((_, i) => i !== index))}
                    className="ml-2 text-amber-600 hover:text-amber-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Good to Have input */}
            <input
              type="text"
              placeholder="Type a good-to-have skill and press Enter..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val && !jobData.goodToHaveSkills.includes(val)) {
                    updateJobData('goodToHaveSkills', [...jobData.goodToHaveSkills, val]);
                  }
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />

            {/* JD parsed good-to-have suggestions */}
            {mode === 'parse' && parsedData?.goodToHaveSkills?.length > 0 && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-medium text-amber-700 mb-2">From JD — click to add:</p>
                <div className="flex flex-wrap gap-2">
                  {parsedData.goodToHaveSkills.map((skill: string) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => {
                        if (!jobData.goodToHaveSkills.includes(skill))
                          updateJobData('goodToHaveSkills', [...jobData.goodToHaveSkills, skill]);
                      }}
                      className={`px-3 py-1.5 border rounded-lg text-sm transition-colors ${
                        jobData.goodToHaveSkills.includes(skill)
                          ? 'border-amber-500 text-amber-700 bg-amber-100'
                          : 'border-amber-300 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      {jobData.goodToHaveSkills.includes(skill) ? '✓' : '+'} {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-gray-700 font-medium mb-4">What education level should candidates have?</h3>
          <p className="text-gray-500 text-sm mb-4">Select all acceptable education levels</p>
          <div className="space-y-2">
            {[
              "High School Diploma",
              "Associate's Degree",
              "Bachelor's Degree",
              "Master's Degree",
              "PhD/Doctorate",
              "Professional Certification",
              "Trade School Certificate",
              "No formal education required"
            ].map((level) => {
              const currentEducation = Array.isArray(jobData.educationLevel) ? jobData.educationLevel : jobData.educationLevel ? [jobData.educationLevel] : [];
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    const newEducation = currentEducation.includes(level)
                      ? currentEducation.filter(e => e !== level)
                      : [...currentEducation, level];
                    updateJobData('educationLevel', newEducation);
                  }}
                  className={`w-full text-left px-4 py-2 border rounded-lg transition-colors ${
                    currentEducation.includes(level)
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {currentEducation.includes(level) ? '✓' : '+'} {level}
                </button>
              );
            })}
          </div>
          {Array.isArray(jobData.educationLevel) && jobData.educationLevel.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-600">Selected: {jobData.educationLevel.join(', ')}</p>
            </div>
          )}
        </div>
        
      </div>
      
      <div className="flex justify-between items-center mt-12">
        <button
          onClick={prevStep}
          className="flex items-center space-x-2 text-blue-600 font-medium hover:text-blue-700"
        >
          <span>←</span>
          <span>Back</span>
        </button>
        <button
          onClick={nextStep}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium flex items-center space-x-2 hover:bg-blue-700"
        >
          <span>Continue</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );

  const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
    </svg>
  );

  const renderJobDescription = () => (
    <div className="px-6 py-8">
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-gray-700 font-medium">Job description *</label>
            {isGeneratingDescription && (
              <span className="text-blue-600 text-sm flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                Generating with AI...
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mb-4">AI-powered job description. You can edit or replace it.</p>
          
          <textarea
            value={jobData.jobDescription}
            onChange={(e) => updateJobData('jobDescription', e.target.value)}
            placeholder="Enter job description here..."
            className="w-full p-4 min-h-[200px] resize-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* Key Responsibilities Section */}
        <div>
          <label className="block text-gray-900 font-bold text-base mb-1">Key Responsibilities</label>
          <p className="text-gray-500 text-sm mb-4">List the main responsibilities for this role (one per line)</p>
          
          <div className="space-y-2">
            {jobData.responsibilities.map((responsibility, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="text-gray-800 font-bold text-lg select-none flex-shrink-0">•</span>
                <input
                  type="text"
                  value={responsibility}
                  onChange={(e) => {
                    const newResponsibilities = [...jobData.responsibilities];
                    newResponsibilities[index] = e.target.value;
                    updateJobData('responsibilities', newResponsibilities);
                  }}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Develop and maintain web applications"
                />
                <button
                  onClick={() => {
                    const newResponsibilities = jobData.responsibilities.filter((_, i) => i !== index);
                    updateJobData('responsibilities', newResponsibilities);
                  }}
                  className="text-red-600 hover:text-red-800 p-2"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                updateJobData('responsibilities', [...jobData.responsibilities, '']);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
            >
              <span>+</span>
              <span>Add Responsibility</span>
            </button>
          </div>
        </div>
        
        {/* Requirements Section */}
        <div>
          <label className="block text-gray-900 font-bold text-base mb-1">Requirements</label>
          <p className="text-gray-500 text-sm mb-4">List the key requirements for this role (one per line)</p>
          
          <div className="space-y-2">
            {jobData.requirements.map((requirement, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="text-gray-800 font-bold text-lg select-none flex-shrink-0">•</span>
                <input
                  type="text"
                  value={requirement}
                  onChange={(e) => {
                    const newRequirements = [...jobData.requirements];
                    newRequirements[index] = e.target.value;
                    updateJobData('requirements', newRequirements);
                  }}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Bachelor's degree in Computer Science"
                />
                <button
                  onClick={() => {
                    const newRequirements = jobData.requirements.filter((_, i) => i !== index);
                    updateJobData('requirements', newRequirements);
                  }}
                  className="text-red-600 hover:text-red-800 p-2"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                updateJobData('requirements', [...jobData.requirements, '']);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
            >
              <span>+</span>
              <span>Add Requirement</span>
            </button>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <button
            onClick={() => generateJobDescription(jobData.jobTitle, true)}
            disabled={!jobData.jobTitle || isGeneratingDescription}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
          >
            {isGeneratingDescription ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                <span>Regenerate with AI</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-12">
        <button
          onClick={prevStep}
          className="flex items-center space-x-2 text-blue-600 font-medium hover:text-blue-700"
        >
          <span>←</span>
          <span>Back</span>
        </button>
        <button
          onClick={nextStep}
          disabled={isGeneratingDescription}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium flex items-center space-x-2 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGeneratingDescription ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              <span>Generating JD...</span>
            </>
          ) : (
            <>
              <span>Continue</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderStep7 = () => {
    const bannerUrl = jobData.jobHeaderImage || getCategoryBanner(jobData.jobCategory) || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop';
    const bannerOptions = getCategoryBannerOptions(jobData.jobCategory);

    return (
    <div className="px-6 py-8">
      {/* Banner preview */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Job Banner</span>
          <button type="button" onClick={() => setShowBannerPicker(true)}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
            Change Banner
          </button>
        </div>
        <div className="relative h-36 rounded-lg overflow-hidden bg-gray-900">
          <img src={bannerUrl} alt="Job banner" className="w-full h-full object-cover opacity-80"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop'; }} />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-purple-900/30" />
        </div>
      </div>

      {/* Banner picker modal */}
      {showBannerPicker && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Choose Banner Image</h3>
              <button onClick={() => setShowBannerPicker(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="overflow-y-auto p-5 grid grid-cols-2 gap-3">
              {bannerOptions.map((url) => (
                <button key={url} type="button" onClick={() => handleDefaultBannerSelect(url)}
                  className={`relative h-28 rounded-lg overflow-hidden border-2 transition-all ${bannerUrl === url ? 'border-blue-600 ring-2 ring-blue-300' : 'border-transparent hover:border-blue-400'}`}>
                  <img src={url} alt="banner" className="w-full h-full object-cover" />
                  {bannerUrl === url && (
                    <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white drop-shadow" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="px-5 py-4 border-t">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Custom Banner</label>
              <JobBannerUploader
                currentBanner={bannerType === 'uploaded' ? jobData.jobHeaderImage : ''}
                onChange={handleUploadedBanner}
                onRemove={handleUploadRemove}
              />
              <p className="text-xs text-gray-400 mt-1">Supported: JPG &#8226; PNG &#8226; WEBP</p>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Job details</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">Job title</span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-800">{jobData.jobTitle}</span>
                <button onClick={() => setCurrentStep(1)} className="text-blue-600 hover:text-blue-700"><EditIcon /></button>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">Company for this job</span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-800">{jobData.companyName}</span>
                <button onClick={() => setCurrentStep(1)} className="text-blue-600 hover:text-blue-700"><EditIcon /></button>
              </div>
            </div>
            
            {/* Only show number of openings if it's actually set and not 0 */}
            {jobData.numberOfPeople > 0 && (
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Number of openings</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-800">{jobData.numberOfPeople}</span>
                  <button onClick={() => setCurrentStep(1)} className="text-blue-600 hover:text-blue-700"><EditIcon /></button>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">Country and language</span>
              <div className="flex items-center space-x-2">
                <div>
                  <div className="text-gray-800">{jobData.country}</div>
                  <div className="text-gray-800">{Array.isArray(jobData.language) ? jobData.language.join(', ') : jobData.language}</div>
                </div>
                <button onClick={() => setCurrentStep(1)} className="text-blue-600 hover:text-blue-700"><EditIcon /></button>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">Location</span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-800">{jobData.jobLocation}</span>
                <button onClick={() => setCurrentStep(1)} className="text-blue-600 hover:text-blue-700"><EditIcon /></button>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">Job type</span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-800">{Array.isArray(jobData.jobType) ? jobData.jobType.join(', ') : jobData.jobType}</span>
                <button onClick={() => setCurrentStep(3)} className="text-blue-600 hover:text-blue-700"><EditIcon /></button>
              </div>
            </div>
            
            {/* Only show pay if user actually modified salary values */}
            {salaryModified && jobData.minSalary && jobData.maxSalary && (
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Pay</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-800">
                    ₹{formatSalary(jobData.minSalary)} - ₹{formatSalary(jobData.maxSalary)} {jobData.payRate}
                  </span>
                  <button onClick={() => setCurrentStep(4)} className="text-blue-600 hover:text-blue-700"><EditIcon /></button>
                </div>
              </div>
            )}
            
            {/* Only show benefits if any are selected */}
            {jobData.benefits.length > 0 && (
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Benefits</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-800">{jobData.benefits.join(', ')}</span>
                  <button onClick={() => setCurrentStep(4)} className="text-blue-600 hover:text-blue-700"><EditIcon /></button>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-start py-3">
              <span className="text-gray-600">Job description</span>
              <div className="flex items-start space-x-2 max-w-md">
                <div>
                  <div className="font-medium text-gray-800 mb-2">Overview</div>
                  {(() => {
                    const jd = (jobData.jobDescription || '').trim();
                    if (!jd) return (
                      <span className="text-orange-500 text-sm cursor-pointer" onClick={() => setCurrentStep(6)}>
                        No description — click Edit to add one
                      </span>
                    );
                    const preview = jd.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\n+/g, ' ').trim();
                    return (
                      <p className="text-gray-600 text-sm">
                        {preview.length > 200 ? preview.substring(0, 200) + '...' : preview}
                      </p>
                    );
                  })()}
                </div>
                <button onClick={() => setCurrentStep(6)} className="text-blue-600 mt-1 hover:text-blue-700 flex-shrink-0"><EditIcon /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-12">
        <button
          onClick={prevStep}
          className="flex items-center space-x-2 text-blue-600 font-medium hover:text-blue-700"
        >
          <span>←</span>
          <span>Back</span>
        </button>
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          {isEditMode ? 'Update Job' : 'Post Job'}
        </button>
      </div>
    </div>
    );
  };

  const handleSubmit = async () => {
    // Check if user is logged in
    if (!user || !user.email) {
      setNotification({
        type: 'error',
        message: 'You must be logged in to post a job',
        isVisible: true
      });
      return;
    }

    // Map experienceRange to experienceLevel enum
    const mapExperienceLevel = (range: string): string => {
      if (range.includes('0-1') || range.includes('1-2')) return 'Entry';
      if (range.includes('2-3') || range.includes('3-5')) return 'Mid';
      if (range.includes('5-7') || range.includes('7-10')) return 'Senior';
      if (range.includes('10+')) return 'Lead';
      return '';
    };

    // Get proper company logo - use logoUtils for special cases (Nambikkai, Trinity, etc.)
    const logoUrl = getCompanyLogo(jobData.companyName) || jobData.companyLogo || '';
    const companyTagline = (jobData.companyTagline || user?.tagline || '').trim();
    
    // Use the uploaded banner URL directly, or fall back to category default
    const finalBannerImage = jobData.jobHeaderImage || getCategoryBanner(jobData.jobCategory) || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop';
    console.log('Final banner image being sent:', finalBannerImage);
    
    // Check if salary should be included (only if user actually modified it)
    const shouldIncludeSalary = salaryModified && jobData.minSalary && jobData.maxSalary;
    
    // Format jobType as simple string - let backend handle PostgreSQL conversion
    const formatJobType = (field: any): string => {
      if (Array.isArray(field)) {
        const cleanArray = field.filter(item => item && item.trim && item.trim() !== '');
        return cleanArray.length > 0 ? cleanArray[0] : 'Full-time'; // Take first item as string
      }
      if (field && typeof field === 'string' && field.trim() !== '') {
        return field.trim();
      }
      return 'Full-time'; // Default
    };

    // Format arrays as JSON arrays for backend processing
    const formatArrayField = (field: any): any[] => {
      if (Array.isArray(field)) {
        return field.filter(item => item && item.trim && item.trim() !== '');
      }
      if (field && typeof field === 'string' && field.trim() !== '') {
        return [field.trim()];
      }
      return [];
    };

    // Build comprehensive job description
    const buildJobDescription = (): string => {
      const base = (jobData.jobDescription || '').trim();
      // Always use the base description if it exists — regardless of format
      if (base) return base;
      // Fallback: build from responsibilities + requirements if no base JD
      const respItems = (Array.isArray(jobData.responsibilities) ? jobData.responsibilities : []).filter(Boolean);
      const reqItems = (Array.isArray(jobData.requirements) ? jobData.requirements : []).filter(Boolean);
      let full = '';
      if (respItems.length > 0) full += 'Key Responsibilities\n' + respItems.map(r => '\u2022 ' + r).join('\n') + '\n\n';
      if (reqItems.length > 0) full += 'Requirements\n' + reqItems.map(r => '\u2022 ' + r).join('\n');
      return full.trim();
    };

    const jobPostData = {
      jobTitle: jobData.jobTitle,
      company: jobData.companyName || user?.companyName || 'Your Company',
      companyName: jobData.companyName || user?.companyName || 'Your Company',
      companyLogo: logoUrl,
      companyTagline,
      companySlogan: companyTagline,
      tagline: companyTagline,
      location: jobData.jobLocation,
      jobLocation: jobData.jobLocation,
      jobType: formatArrayField(jobData.jobType),
      type: formatArrayField(jobData.jobType)[0] || 'Full-time',
      description: buildJobDescription(),
      jobDescription: buildJobDescription(),
      responsibilities: (Array.isArray(jobData.responsibilities) ? jobData.responsibilities.filter(Boolean) : []).join('\n'),
      requirements: (Array.isArray(jobData.requirements) ? jobData.requirements.filter(Boolean) : []).join('\n'),
      skills: formatArrayField(jobData.skills),
      goodToHaveSkills: formatArrayField(jobData.goodToHaveSkills),
      experienceRange: jobData.experienceRange || '',
      ...(shouldIncludeSalary && {
        salary: {
          min: (() => { const v = parseInt(jobData.minSalary.replace(/,/g, '')) || 0; return v > 0 && v < 1000 ? v * 100000 : v; })(),
          max: (() => {
            if (jobData.payType === 'Exact amount') {
              const v = parseInt(jobData.minSalary.replace(/,/g, '')) || 0;
              return v > 0 && v < 1000 ? v * 100000 : v;
            }
            const v = parseInt(jobData.maxSalary.replace(/,/g, '')) || 0;
            return v > 0 && v < 1000 ? v * 100000 : v;
          })(),
          currency: jobData.currency,
          period: jobData.payRate === 'per year' ? 'yearly' : jobData.payRate === 'per month' ? 'monthly' : 'hourly'
        },
        salaryMin: (() => { const v = parseInt(jobData.minSalary.replace(/,/g, '')) || 0; return v > 0 && v < 1000 ? v * 100000 : v; })(),
        salaryMax: (() => {
          if (jobData.payType === 'Exact amount') {
            const v = parseInt(jobData.minSalary.replace(/,/g, '')) || 0;
            return v > 0 && v < 1000 ? v * 100000 : v;
          }
          const v = parseInt(jobData.maxSalary.replace(/,/g, '')) || 0;
          return v > 0 && v < 1000 ? v * 100000 : v;
        })(),
        currency: jobData.currency,
        payRate: jobData.payRate,
        payType: jobData.payType
      }),
      benefits: formatArrayField(jobData.benefits),
      postedBy: user.email,
      postedByEmail: user.email,
      employerEmail: getEffectiveEmployerEmail(),
      employerName: user.name,
      employerCompany: user?.companyName || jobData.companyName || 'Your Company',
      employerId: user.employerId || 'EID0001',
      positionId: generatePositionId(jobData.companyName || user?.companyName),
      jobCategory: jobData.jobCategory || '',
      locationType: jobData.locationType || '',
      language: Array.isArray(jobData.language) ? jobData.language : jobData.language ? [jobData.language] : [],
      languages: Array.isArray(jobData.language) ? jobData.language : jobData.language ? [jobData.language] : [],
      country: jobData.country || '',
      urgentNote: jobData.urgentNote?.trim() || '',
      nationalityRestriction: jobData.nationalityRestriction || '',
      jobHeaderImage: finalBannerImage
    };
    
    console.log('Posting job for user:', user.email);
    console.log('JobType being sent:', jobPostData.jobType, 'Type:', typeof jobPostData.jobType);
    console.log('Benefits being sent:', jobPostData.benefits, 'Type:', typeof jobPostData.benefits, 'IsArray:', Array.isArray(jobPostData.benefits));
    console.log('Skills being sent:', jobPostData.skills, 'Type:', typeof jobPostData.skills, 'IsArray:', Array.isArray(jobPostData.skills));
    console.log('Banner image being sent:', jobPostData.jobHeaderImage);
    console.log('Full payload:', JSON.stringify(jobPostData, null, 2));
    
    try {
      const url = isEditMode ? `${API_ENDPOINTS.JOBS}/${editJobId}` : API_ENDPOINTS.JOBS;
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobPostData)
      });
      
      if (response.ok) {
        const result = await response.json();
        sessionStorage.removeItem('editJobData');
        setNotification({
          type: 'success',
          message: isEditMode ? 'Job updated successfully!' : 'Job posted successfully!',
          isVisible: true
        });
        
        // Trigger event to refresh latest jobs
        window.dispatchEvent(new CustomEvent('jobPosted', { detail: result }));
        
        // Also dispatch a storage event for cross-tab communication
        localStorage.setItem('lastJobPosted', JSON.stringify({
          jobId: result._id || result.id,
          timestamp: new Date().toISOString(),
          postedBy: user.email
        }));
        
        // Clear the form
        setJobData({
          jobTitle: '',
          locationType: 'In person',
          jobLocation: '',
          expandCandidateSearch: false,
          experienceRange: '',
          noticePeriod: '',
          urgentNote: '',
          nationalityRestriction: '',
          country: '',
          language: '',
          jobCategory: '',
          priority: 'Medium',
          clientName: '',
          jobCode: '', // Backend will generate this
          reportingManager: '',
          hiringTimeline: '',
          numberOfPeople: 0,
          workAuth: [],
          jobType: [], // Ensure this is an array
          payType: 'Range',
          minSalary: '',
          maxSalary: '',
          payRate: 'per year',
          currency: 'INR',
          benefits: [],
          jobDescription: '',
          responsibilities: [],
          requirements: [],
          skills: [],
          goodToHaveSkills: [],
          educationLevel: "Bachelor's degree",
          certifications: [],
          companyName: '',
          companyLogo: '',
          companyId: '',
          companyTagline: '',
          jobHeaderImage: ''
        });
        setCurrentStep(1);
        
        // Navigate back appropriately
        setTimeout(() => {
          onNavigate(isEditMode ? 'job-management' : 'job-listings');
        }, 2000);
      } else {
        const errorText = await response.text();
        console.error('Job posting failed with status:', response.status);

        if (response.status === 401) {
          setNotification({
            type: 'error',
            message: 'Session expired. Please log out and log back in, then try again.',
            isVisible: true
          });
          return;
        }

        let errorMessage = 'Failed to post job';
        if (!errorText || errorText.trim() === '') {
          errorMessage = `Backend server error (${response.status}). Please check if the backend server is running.`;
        } else {
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorJson.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
        }
        setNotification({ type: 'error', message: `Job posting failed: ${errorMessage}`, isVisible: true });
      }
    } catch (error) {
      console.error('Error posting job:', error);
      setNotification({
        type: 'error',
        message: 'Error posting job. Please check if the backend server is running.',
        isVisible: true
      });
    }
  };

  return (
    <>
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification({ ...notification, isVisible: false })}
      />
      
      
      <div className="min-h-screen bg-white">
        {/* Fixed Header Section */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-6 py-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>Step {currentStep === 1 ? 1 : currentStep === 3 ? 2 : currentStep === 4 ? 3 : currentStep === 5 ? 4 : currentStep === 6 ? 5 : 6} of 6</span>
                <span>{Math.round(((currentStep === 1 ? 1 : currentStep === 3 ? 2 : currentStep === 4 ? 3 : currentStep === 5 ? 4 : currentStep === 6 ? 5 : 6) / 6) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep === 1 ? 1 : currentStep === 3 ? 2 : currentStep === 4 ? 3 : currentStep === 5 ? 4 : currentStep === 6 ? 5 : 6) / 6) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-800">
                {currentStep === 1 && (mode === 'parse' ? 'Review Parsed Job' : 'Add job basics')}
                {currentStep === 3 && 'Add job details'}
                {currentStep === 4 && 'Add pay and benefits'}
                {currentStep === 5 && 'Qualifications'}
                {currentStep === 6 && 'Describe the job'}
                {currentStep === 7 && 'Review'}
              </h1>
              {currentStep === 1 && parsedData && (
                <span className="text-sm text-green-600 ml-2">AI Parsed</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Step Content */}
        <div className="flex flex-col lg:flex-row max-w-6xl mx-auto">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {currentStep === 1 && renderStep1()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderQualifications()}
            {currentStep === 6 && renderJobDescription()}
            {currentStep === 7 && renderStep7()}
          </div>
          
          {/* Sidebar with Tips */}
          <div className="hidden lg:block w-80 bg-gray-50 border-l border-gray-200 p-6">
            <div className="sticky top-32">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Tips & Help</h3>
              
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-800 mb-2">Job Title Tips</h4>
                    <p className="text-sm text-gray-600">Use specific, clear job titles. Avoid internal jargon or abbreviations.</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-800 mb-2">Location Best Practices</h4>
                    <p className="text-sm text-gray-600">Be specific about location requirements. Remote work attracts 3x more candidates.</p>
                  </div>
                </div>
              )}
              
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-800 mb-2">Job Type Impact</h4>
                    <p className="text-sm text-gray-600">Full-time positions get 40% more applications than part-time roles.</p>
                  </div>
                </div>
              )}
              
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-800 mb-2">Salary Transparency</h4>
                    <p className="text-sm text-gray-600">Jobs with salary ranges get 30% more applications and higher quality candidates.</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-800 mb-2">Benefits Matter</h4>
                    <p className="text-sm text-gray-600">Health insurance and visa sponsorship are top priorities for candidates.</p>
                  </div>
                </div>
              )}
              
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-800 mb-2">Skills Selection</h4>
                    <p className="text-sm text-gray-600">List 5-8 key skills. Too many requirements can discourage qualified candidates.</p>
                  </div>
                </div>
              )}
              
              {currentStep === 6 && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-800 mb-2">Description Length</h4>
                    <p className="text-sm text-gray-600">Optimal job descriptions are 300-600 words. Too long descriptions reduce applications by 25%.</p>
                  </div>
                </div>
              )}
              
              {currentStep === 7 && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-800 mb-2">Final Check</h4>
                    <p className="text-sm text-gray-600">Review all details carefully. You can edit the job after posting.</p>
                  </div>
                </div>
              )}
              
              {/* Quick Stats */}
              <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Quick Stats</h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-start gap-2"><span className="text-blue-500 mt-1">&bull;</span> Average time to hire: 23 days</div>
                  <div className="flex items-start gap-2"><span className="text-blue-500 mt-1">&bull;</span> Jobs with salary: +30% applications</div>
                  <div className="flex items-start gap-2"><span className="text-blue-500 mt-1">&bull;</span> Remote jobs: +200% reach</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default JobPostingPage;

