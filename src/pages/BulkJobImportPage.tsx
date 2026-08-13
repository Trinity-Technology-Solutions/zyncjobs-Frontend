import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Upload, X, CheckCircle, AlertCircle, Edit2, Trash2, ChevronDown, ChevronUp, Loader, Zap, Download, Users, Copy, Sparkles, MapPin, Clock, Briefcase } from 'lucide-react';
import BackButton from '../components/BackButton';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { API_ENDPOINTS, NOTICE_PERIOD_OPTIONS } from '../config/constants';
import { apiFetch } from '../api/apiFetch';
import { getEffectiveEmployerEmail } from '../utils/employerIdUtils';
  import { generatePositionId } from '../utils/jobMigrationUtils';
  import { generateJD, generateLocalJD } from '../utils/jdGenerator';
import AutocompleteCombobox from '../components/AutocompleteCombobox';
import { sendAIMessage } from '../services/aiChatService';

interface Props {
  onNavigate: (page: string, data?: any) => void;
  user?: any;
}

interface ParsedJob {
  id: string;
  fileName: string;
  jobTitle: string;
  companyName: string;
  jobLocation: string;
  experienceRange: string;
  skills: string[];
  jobType: string;
  jobDescription: string;
  minSalary: string;
  maxSalary: string;
  currency: string;
  jobCategory: string;
  noticePeriod: string;
  status: 'ready' | 'error' | 'publishing' | 'published';
  errors: string[];
  selected: boolean;
  raw: string;
  isDuplicate?: boolean;
  duplicateOf?: string;
  candidateCount?: number;
  candidateCountLoading?: boolean;
  aiEnhanced?: boolean;
}

type Step = 'upload' | 'parsing' | 'preview' | 'publishing' | 'done';

// ── Skill DB (subset for fast client-side extraction) ──────────────────
const SKILL_KEYWORDS = [
  'JavaScript','TypeScript','Python','Java','C#','C++','PHP','Ruby','Go','Kotlin','Swift','Scala','R',
  'React','Angular','Vue.js','Next.js','Node.js','Express.js','Django','Flask','Spring Boot','Laravel',
  'HTML','CSS','Tailwind CSS','Bootstrap','jQuery','Svelte',
  'MySQL','PostgreSQL','MongoDB','Redis','Elasticsearch','Oracle','SQLite','DynamoDB','Cassandra',
  'AWS','Azure','GCP','Docker','Kubernetes','Terraform','Jenkins','CI/CD','Ansible','Helm',
  'Git','GitHub','GitLab','Jira','Confluence','Figma','Sketch','Adobe XD',
  'REST API','GraphQL','gRPC','SOAP','Microservices','Kafka','RabbitMQ',
  'Machine Learning','Deep Learning','TensorFlow','PyTorch','Scikit-learn','Pandas','NumPy',
  'Agile','Scrum','Kanban','SAP','Salesforce','Power BI','Tableau','Excel',
  'Linux','Unix','Bash','PowerShell','Selenium','Jest','Cypress','JUnit','Pytest',
  'React Native','Flutter','iOS','Android','Swift','Kotlin',
  'Communication','Leadership','Problem Solving','Teamwork','Project Management',
];

function extractSkills(text: string): string[] {
  const found = new Set<string>();
  const lower = text.toLowerCase();
  for (const skill of SKILL_KEYWORDS) {
    const pat = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pat.test(lower)) found.add(skill);
  }
  return Array.from(found).slice(0, 12);
}

const TITLE_RE = /^(?:senior|junior|sr\.?|jr\.?|lead|principal|chief|head|staff|assistant|associate|graduate|experienced|entry[- ]level|mid[- ]level)?\s*[A-Z][\w'\-& ,.]{2,50}?\s+(?:developer|engineer|manager|designer|analyst|accountant|nurse|technician|consultant|specialist|executive|representative|coordinator|supervisor|director|architect|officer|operator|clerk|mechanic|electrician|plumber|welder|driver|chef|cook|waiter|barista|security|housekeeper|cleaner|carpenter|worker|helper|attendant|agent|advisor|trainer|coach|editor|writer|reporter|photographer|librarian|pharmacist|therapist|counselor|doctor|physician|dentist|surgeon|researcher|scientist|technologist|administrator|trainee|intern|fullstack|full-stack|frontend|front-end|backend|back-end|devops|data|qa|quality|ui|ux|graphic|content|hr|finance|account|business|operations|logistics|procurement|purchase|warehouse|safety|hse|sales|marketing)$/i;

const TITLE_FILLER_RE = /^(?:experienced|innovative|passionate|motivated|talented|skilled|highly|strong|dynamic|creative|dedicated|self[- ]motivated|proactive|accomplished|seasoned|results[- ]driven|expert|exceptional|energetic|enthusiastic|ambitious|qualified|reliable|professional|detail[- ]oriented|customer[- ]focused|technical|strategic|hands[- ]on)\s+/i;

const SENTENCE_RE = /(we\s+(?:are|'re)|looking\s+for|is\s+(?:seeking|hiring)|are\s+(?:seeking|hiring)|join\s+our|our\s+team|currently\s+(?:hiring|seeking))/i;
const MARKER_RE = /^(?:job|position|role|opening|vacancy|jd|posting|requirement)[\s#\-.:]*\d+/i;
const HEADER_RE = /^(?:job title|position title|title|company|organization|employer)\s*:/i;
const NUMBERED_RE = /^\d+\s*[.)\-:]\s+[A-Z]/;
const SEPARATOR_LINE_RE = /^\s*(?:-{3,}|={3,}|\*{3,}|~{3,}|_{3,}|…{3,})\s*$/;

function stripMarkdown(s: string): string {
  return s
    .replace(/^\s*#+\s*/, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^\s*\*\s+/, '')
    .trim();
}

function normalizeText(text: string): string {
  return text
    .split('\n')
    .map(l => (SEPARATOR_LINE_RE.test(l) ? '' : l))
    .join('\n')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanTitle(raw: string): string {
  let t = raw.trim().replace(/[*#_]/g, '').replace(/\s+/g, ' ');
  for (let i = 0; i < 5 && TITLE_FILLER_RE.test(t); i++) t = t.replace(TITLE_FILLER_RE, '');
  return t;
}

function extractJobTitle(text: string): string {
  const norm = normalizeText(text);
  const lines = norm.split('\n').map(l => l.trim()).filter(l => l.length > 3 && l.length < 80).slice(0, 12);
  const firstLine = lines[0] || '';

  const labeled = norm.match(/(?:job\s+title|position|role|vacancy|opening)\s*[:\-]\s*([^\n\r]{3,60})/i);
  if (labeled?.[1]) {
    const t = cleanTitle(labeled[1]);
    if (t.length > 3 && t.length < 80 && !/http|www|email|apply/i.test(t)) return t;
  }

  for (const line of lines) {
    if (TITLE_RE.test(line) && !SENTENCE_RE.test(line)) return line;
  }

  const seeking = norm.match(/(?:hiring|seeking|looking\s+for)\s+(?:a|an)\s+([^\n\r,]{3,60}?)(?:\s+to|\s+for|\.|,|\n|$)/i);
  if (seeking?.[1]) {
    const t = cleanTitle(seeking[1]);
    if (t.length > 3 && t.length < 80 && !/http|www|email|apply/i.test(t)) return t;
  }

  const at = norm.match(/^([^\n\r]{5,60}?)(?:\s+at\s+|\s+[-–]\s+|\s*\|)/im);
  if (at?.[1]) {
    const t = cleanTitle(at[1]);
    if (t.length > 3 && t.length < 80 && !/http|www|email|apply/i.test(t)) return t;
  }

  return firstLine || 'Untitled Position';
}

function extractLocation(text: string): string {
  const label = text.match(/(?:location|work\s+location|job\s+location)\s*[:\-]\s*([^\n\r,]{2,40})/i);
  if (label?.[1]) return label[1].trim();
  const cities = ['Mumbai','Delhi','Bangalore','Bengaluru','Chennai','Hyderabad','Pune','Kolkata',
    'Noida','Gurgaon','Ahmedabad','Remote','Hybrid','On-site','New York','San Francisco',
    'London','Singapore','Dubai','Toronto','Sydney'];
  for (const c of cities) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(text)) return c;
  }
  if (/remote|wfh|work\s+from\s+home/i.test(text)) return 'Remote';
  return '';
}

function extractCompanyName(text: string): string {
  const label = text.match(/(?:company\s*name|hiring\s+company|company|organization|organisation|employer)\s*[:\-]\s*([^\n\r,]{2,60})/i);
  if (label?.[1]) {
    const t = label[1].trim().replace(/[*#_]/g, '');
    if (t.length > 2 && t.length < 80 && !/http|www|email|apply|preferred|not\s+mandatory/i.test(t)) return t;
  }
  const subject = text.match(/^([A-Z][\w&'.\- ]{2,50}?)\s+(?:is|are)\s+(?:hiring|seeking|recruiting|looking\s+for)/im);
  if (subject?.[1] && !/^(we|our|us|i)\b/i.test(subject[1])) return subject[1].trim();
  const tagline = text.match(/^([A-Z][\w&'.\- ]{2,40}?)\s*[—–|]\s*[A-Z][^-\n]{2,40}$/m);
  if (tagline?.[1] && !/developer|engineer|manager|architect|analyst|designer|specialist|consultant|executive|recruiter|agent|officer|analyst|accountant|technician/i.test(tagline[1])) return tagline[1].trim();
  const at = text.match(/(?:at|for)\s+([A-Z][A-Za-z0-9&'.\- ]{2,45}?)(?:[,.;]|\n|$)/);
  if (at?.[1] && !/^(inc|llc|ltd|pvt|the|a|an)\b/i.test(at[1])) return at[1].trim();
  return '';
}

function extractExperience(text: string): string {
  const m = text.match(/(\d+)\s*[-–to]+\s*(\d+)\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i)
    || text.match(/(?:experience)\s*[:\-]?\s*(\d+)\s*[-–to]+\s*(\d+)/i)
    || text.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i);
  if (m) {
    const a = parseInt(m[1]), b = m[2] ? parseInt(m[2]) : NaN;
    if (!isNaN(b)) return `${a}-${b} years`;
    return `${a}+ years`;
  }
  return '';
}

// Maps any input (CSV cell, AI output, text) to one of the 6 valid DB enum values
function normalizeJobType(value: unknown): string {
  let raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') return '';
  const v = raw.trim().toLowerCase().replace(/[-\s_]/g, '');
  if (!v) return '';
  if (/^(fulltime|ft)$/.test(v) || /permanent|regular/.test(v)) return 'Full-time';
  if (/^(parttime|pt)$/.test(v)) return 'Part-time';
  if (/contract/.test(v)) return 'Contract';
  if (/freelanc/.test(v)) return 'Freelance';
  if (/intern/.test(v)) return 'Internship';
  if (/temp/.test(v) || /seasonal/.test(v)) return 'Temporary';
  return 'Full-time';
}

function extractJobType(text: string): string {
  const m = text.match(/(full[- ]?time|part[- ]?time|freelanc\w*|contractual|contract\b|internship|intern\b|temporary|temp\b|permanent|seasonal)/i);
  return m ? normalizeJobType(m[1]) || 'Full-time' : 'Full-time';
}

function extractCategory(title: string): string {
  const t = title.toLowerCase();
  if (/developer|engineer|programmer|architect|devops|fullstack|frontend|backend/i.test(t)) return 'Software Development';
  if (/data|analyst|scientist|ml|ai|machine\s+learning/i.test(t)) return 'Data Science & Analytics';
  if (/sales|account\s+exec|business\s+dev/i.test(t)) return 'Sales & Marketing';
  if (/marketing|seo|content|brand/i.test(t)) return 'Sales & Marketing';
  if (/hr|human\s+res|recruiter|talent/i.test(t)) return 'Human Resources';
  if (/finance|accountant|accounting|audit/i.test(t)) return 'Finance & Accounting';
  if (/design|ui|ux|graphic/i.test(t)) return 'Information Technology';
  if (/manager|director|lead|head/i.test(t)) return 'Operations';
  return 'Information Technology';
}

function extractSalary(text: string) {
  const m = text.match(/(\d+(?:\.\d+)?)\s*[-–to]+\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|l)/i)
    || text.match(/(\d+(?:,\d+)*)\s*[-–to]+\s*(\d+(?:,\d+)*)/);
  if (m) {
    let min = parseFloat(m[1].replace(/,/g, ''));
    let max = parseFloat(m[2].replace(/,/g, ''));
    if (/lpa|lakh/i.test(m[0])) { min *= 100000; max *= 100000; }
    return { min: String(Math.round(min)), max: String(Math.round(max)), currency: 'INR' };
  }
  return { min: '', max: '', currency: 'INR' };
}

function validateJob(job: ParsedJob): string[] {
  const errs: string[] = [];
  if (!job.jobTitle || job.jobTitle === 'Untitled Position') errs.push('Job title missing');
  if (!job.jobLocation) errs.push('Location missing');
  if (!job.experienceRange) errs.push('Experience missing');
  if (job.skills.length === 0) errs.push('Skills missing');
  return errs;
}

// ── Parse plain text into a ParsedJob ─────────────────────────────────
function parseTextToJob(text: string, fileName: string): ParsedJob {
  const norm = normalizeText(text);
  const salary = extractSalary(norm);
  const job: ParsedJob = {
    id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    fileName,
    jobTitle: extractJobTitle(norm),
    companyName: extractCompanyName(norm),
    jobLocation: extractLocation(norm),
    experienceRange: extractExperience(norm),
    skills: extractSkills(norm),
    jobType: extractJobType(norm),
    jobDescription: text.slice(0, 2000),
    minSalary: salary.min,
    maxSalary: salary.max,
    currency: salary.currency,
    jobCategory: '',
    noticePeriod: '',
    status: 'ready',
    errors: [],
    selected: true,
    raw: text,
  };
  job.jobCategory = extractCategory(job.jobTitle);
  job.errors = validateJob(job);
  if (job.errors.length > 0) job.status = 'error';
  return job;
}

// ── Batch AI enhancement for multiple jobs in one call ───────────────
async function aiEnhanceBatch(raws: string[]): Promise<Partial<ParsedJob>[]> {
  const snippets = raws.map((r, i) => `JD_${i + 1}:\n${r.slice(0, 800)}`).join('\n\n---\n\n');
  const prompt = `Extract job details from each job description below. Return ONLY a valid JSON array with ${raws.length} objects, one per JD, in order:
[{"jobTitle":"","companyName":"","jobLocation":"","experienceRange":"","skills":[],"jobType":"Full-time","jobCategory":"","noticePeriod":"","minSalary":"","maxSalary":""}]

${snippets}`;
  try {
    const reply = await sendAIMessage(
      [{ role: 'user', content: prompt }],
      'You are a job description parser. Return only a valid JSON array, no markdown.',
      undefined, 1200
    );
    const match = reply.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* fallback to empty results */ }
  return raws.map(() => ({}));
}

// ── CSV parser (handles quoted fields) ───────────────────────────────
function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = '', inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === ',' && !inQuote) { result.push(cur.trim()); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur.trim());
  return result;
}

function parseCSV(text: string): ParsedJob[] {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCSVLine(lines[0]).map(h => h.toLowerCase());
  return lines.slice(1).map((line, i) => {
    const vals = splitCSVLine(line);
    const get = (key: string) => vals[headers.indexOf(key)] || '';
    const title = get('job title') || get('jobtitle') || get('title') || `Role ${i + 1}`;
    const rawText = `${title} ${get('description') || ''} ${get('skills') || ''}`;
    const skillsRaw = get('skills') || get('skill') || '';
    const job: ParsedJob = {
      id: `job-csv-${i}-${Date.now()}`,
      fileName: `Row ${i + 1}`,
      jobTitle: title,
      companyName: get('company') || get('company name') || '',
      jobLocation: get('location') || get('job location') || '',
      experienceRange: get('experience') || '',
      skills: skillsRaw.split(/[;|,]/).map(s => s.trim()).filter(Boolean).slice(0, 12),
      jobType: normalizeJobType(get('employment type')) || normalizeJobType(get('job type')) || extractJobType(rawText),
      jobDescription: get('description') || rawText,
      minSalary: get('min salary') || get('salary min') || '',
      maxSalary: get('max salary') || get('salary max') || get('salary') || '',
      currency: 'INR',
      jobCategory: get('category') || extractCategory(title),
      noticePeriod: get('notice period') || '',
      status: 'ready',
      errors: [],
      selected: true,
      raw: rawText,
    };
    if (!job.skills.length) job.skills = extractSkills(rawText);
    job.errors = validateJob(job);
    if (job.errors.length) job.status = 'error';
    return job;
  });
}

// ── Split pasted multi-JD text ─────────────────────────────────────────
function hasRoleLine(text: string): boolean {
  return text.split('\n').some(l => {
    const t = l.trim();
    return (TITLE_RE.test(t) && !SENTENCE_RE.test(t)) || /(?:hiring|looking\s+for|seeking)\s+(?:a|an)\b/i.test(t);
  });
}

function isContinuation(block: string, prev: string, afterSeparator: boolean): boolean {
  const firstLine = stripMarkdown(block.split('\n')[0]).toLowerCase();
  if (!firstLine) return true;
  const prevHasTitle = hasRoleLine(prev);
  const titleLike = TITLE_RE.test(firstLine) && !SENTENCE_RE.test(firstLine);
  const metaStart = /^(about|overview|responsibilities|requirements|qualifications|skills|benefits|role|summary|what we offer|key responsibilities|must have|nice to have|how to apply|zyncjobs|connecting|description|job description|experience|education|salary|location|company|the role|the company|the ideal candidate)/.test(firstLine);
  // Explicit markers (Job 2:, JD 3:, "2. Title") always start a new JD
  if (MARKER_RE.test(block) || HEADER_RE.test(block) || NUMBERED_RE.test(block)) return false;
  // After an explicit separator (---), the fragment is a NEW JD unless it is
  // clearly an internal section (About/Responsibilities...) or the JD's own
  // title block appearing right after a header fragment.
  if (afterSeparator) {
    if (metaStart && prevHasTitle) return true;
    if (titleLike && !prevHasTitle) return true;
    return false;
  }
  // Title-like start after a JD that already has a role line => new JD
  if (titleLike && prevHasTitle) return false;
  // Hiring sentence start ("We are looking for a ...") => new JD boundary
  if (prevHasTitle && SENTENCE_RE.test(firstLine) && /(hiring|looking|seeking|join|opportunity|vacanc|opening|need|require)/i.test(firstLine) && block.length > 150) return false;
  // Meta/heading sections (About, Responsibilities, ...) => continuation
  if (prevHasTitle && metaStart) return true;
  // Short non-title fragments after a titled JD => continuation
  if (block.length <= 300 && !titleLike && prevHasTitle) return true;
  return false;
}

function splitPastedJDs(text: string): string[] {
  // Phase 1 — split at explicit separator lines (---, ===, ***, ~~~, ___ on
  // their own line): the paste box tells users to separate JDs with ---.
  const segments: { text: string; afterSep: boolean }[] = [];
  let cur: string[] = [];
  let afterSep = false;
  for (const line of text.split('\n')) {
    if (SEPARATOR_LINE_RE.test(line)) {
      if (cur.length) segments.push({ text: normalizeText(cur.join('\n')), afterSep });
      cur = [];
      afterSep = true;
      continue;
    }
    cur.push(line);
  }
  if (cur.length) segments.push({ text: normalizeText(cur.join('\n')), afterSep });

  // Phase 2 — merge fragments that are continuations of the previous JD
  // (e.g. --- used as a markdown rule INSIDE a single JD, or About/Requirements sections)
  const groups: string[] = [];
  for (const seg of segments) {
    if (!seg.text) continue;
    const last = groups[groups.length - 1];
    if (last && isContinuation(seg.text, last, seg.afterSep)) {
      groups[groups.length - 1] = last + '\n\n' + seg.text;
    } else {
      groups.push(seg.text);
    }
  }

  // Phase 3 — drop fragments that are not real JDs; if separators were never
  // used, split back-to-back JDs inside the single remaining segment.
  let parts = groups.filter(g => g.length > 50);
  if (parts.length === 1) {
    const blocks = parts[0].split(/\n\s*\n+/).map(b => b.trim()).filter(Boolean);
    const inner: string[] = [];
    let current = '';
    for (const block of blocks) {
      const firstLine = stripMarkdown(block.split('\n')[0].trim());
      // Relaxed title detection: short line (≤10 words), not a sentence, not a meta-section
      const titleLike =
        firstLine.length >= 3 && firstLine.length <= 120 &&
        firstLine.split(/\s+/).length <= 10 &&
        !SENTENCE_RE.test(firstLine) &&
        !/^(about|overview|responsibilities|requirements|qualifications|skills|benefits|summary|description|experience|education|salary|location|company|the role|how to apply)/i.test(firstLine);
      const hiringLike =
        SENTENCE_RE.test(firstLine) &&
        /(hiring|looking|seeking|join|opportunity|vacanc|opening|need|require)/i.test(firstLine) &&
        block.length > 150;
      const isStart = MARKER_RE.test(block) || HEADER_RE.test(block) || NUMBERED_RE.test(block) || titleLike || hiringLike;
      const currentHasContent = current.length > 100;
      if (isStart && current && currentHasContent) {
        inner.push(current.trim());
        current = block;
      } else {
        current += (current ? '\n\n' : '') + block;
      }
    }
    if (current) inner.push(current.trim());
    const innerParts = inner.filter(g => g.length > 50);
    if (innerParts.length > 1) parts = innerParts;
  }

  return parts.length > 1 ? parts : [text];
}

// ── CSV template content ───────────────────────────────────────────────
// Notice Period is optional — older templates without this column still import fine.
const CSV_TEMPLATE = `Job Title,Company,Location,Experience,Skills,Employment Type,Min Salary,Max Salary,Notice Period,Description
Java Developer,Acme Corp,Chennai,3-5 years,"Java,Spring Boot,Microservices",Full-time,600000,900000,Immediate,We are hiring a Java Developer...
React Developer,Acme Corp,Bangalore,2-4 years,"React,TypeScript,Node.js",Full-time,500000,800000,30 Days,Looking for a React Developer...`;

// ── Duplicate detection ───────────────────────────────────────────────
async function fetchExistingJobTitles(): Promise<string[]> {
  try {
    const { apiFetch } = await import('../api/apiFetch');
    const { API_ENDPOINTS } = await import('../config/constants');
    const res = await apiFetch(API_ENDPOINTS.JOBS);
    if (!res.ok) return [];
    const data = await res.json();
    const jobs: any[] = Array.isArray(data) ? data : data.jobs || data.data || [];
    return jobs.map((j: any) => (j.jobTitle || j.title || '').toLowerCase().trim()).filter(Boolean);
  } catch { return []; }
}

function titleSimilarity(a: string, b: string): number {
  const wa = new Set(a.toLowerCase().split(/\s+/));
  const wb = b.toLowerCase().split(/\s+/);
  const hits = wb.filter(w => wa.has(w)).length;
  return hits / Math.max(wa.size, wb.length);
}

// ── Candidate count estimate ──────────────────────────────────────────
async function fetchCandidateCount(skills: string[], title: string): Promise<number> {
  // No skills extracted → 0 matches (never count ALL candidates)
  if (!Array.isArray(skills) || skills.length === 0) return 0;
  try {
    const base = import.meta.env.VITE_API_URL || '/api';
    const skillParam = skills.slice(0, 5).join(',');
    const res = await fetch(`${base}/users?role=candidate&skills=${encodeURIComponent(skillParam)}&total_only=true&limit=1`);
    if (!res.ok) return 0;
    const data = await res.json();
    return typeof data.total === 'number' ? data.total : 0;
  } catch { return 0; }
}

// ── Bulk AI enhance description ───────────────────────────────────────
async function aiEnhanceDescription(job: ParsedJob): Promise<string> {
  const prompt = `Rewrite this job description professionally. Make it compelling, structured with sections: Overview, Responsibilities, Requirements, Nice-to-Have, Benefits. Keep it concise (250-350 words).

Job Title: ${job.jobTitle}
Skills: ${job.skills.join(', ')}
Experience: ${job.experienceRange}
Original:\n${job.jobDescription.slice(0, 800)}`;
  try {
    const reply = await sendAIMessage(
      [{ role: 'user', content: prompt }],
      'You are a professional job description writer. Write clear, engaging job postings.',
      undefined, 800
    );
    return reply.trim()
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
  } catch { return job.jobDescription; }
}

// SVG icon components replacing emojis
const IconCSV = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18M10 3v18M14 3v18M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
  </svg>
);
const IconPDF = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);
const IconDOCX = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const IconZIP = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
  </svg>
);

export default function BulkJobImportPage({ onNavigate, user }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [jobs, setJobs] = useState<ParsedJob[]>([]);
  const [parsingProgress, setParsingProgress] = useState(0);
  const [parsingLabel, setParsingLabel] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<ParsedJob | null>(null);
  const [publishResults, setPublishResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [enhancingLabel, setEnhancingLabel] = useState('');
  const [checkingDupes, setCheckingDupes] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pasteRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── File reading helpers ───────────────────────────────────────────
  const readFileAsText = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = e => res(e.target?.result as string || '');
      r.onerror = rej;
      r.readAsText(file);
    });

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = e => res(e.target?.result as ArrayBuffer);
      r.onerror = rej;
      r.readAsArrayBuffer(file);
    });

  const extractTextFromFile = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();
        const buffer = await readFileAsArrayBuffer(file);
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        const pages: string[] = [];
        for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          pages.push(content.items.map((item: any) => item.str).join(' '));
        }
        return pages.join('\n');
      } catch { return readFileAsText(file); }
    }
    if (ext === 'docx') {
      try {
        const mammoth = await import('mammoth');
        const buffer = await readFileAsArrayBuffer(file);
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        return result.value;
      } catch { return readFileAsText(file); }
    }
    return readFileAsText(file);
  };

  const extractZipFiles = async (file: File): Promise<File[]> => {
    try {
      const JSZip = (await import('jszip').catch(() => null))?.default;
      if (!JSZip) return [file];
      const zip = await JSZip.loadAsync(file);
      const extracted: File[] = [];
      for (const [name, entry] of Object.entries(zip.files)) {
        if ((entry as any).dir) continue;
        const lower = name.toLowerCase();
        if (!lower.endsWith('.csv') && !lower.endsWith('.txt') && !lower.endsWith('.pdf') && !lower.endsWith('.docx')) continue;
        const blob = await (entry as any).async('blob');
        extracted.push(new File([blob], name.split('/').pop() || name));
      }
      return extracted.length > 0 ? extracted : [file];
    } catch { return [file]; }
  };

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const rawArr = Array.from(files);
    const expanded: File[] = rawArr.filter(f => f.name.toLowerCase().endsWith('.csv'));
    if (expanded.length === 0) {
      showToast('Only CSV files are supported', 'error');
      return;
    }
    setStep('parsing');
    setParsingProgress(0);
    const parsed: ParsedJob[] = [];
    for (let i = 0; i < expanded.length; i++) {
      const file = expanded[i];
      setParsingLabel(`Parsing ${file.name} (${i + 1}/${expanded.length})\u2026`);
      setParsingProgress(Math.round((i / expanded.length) * 80));
      try {
        const text = await readFileAsText(file);
        parsed.push(...parseCSV(text));
      } catch {
        parsed.push({
          id: `job-err-${i}-${Date.now()}`,
          fileName: file.name,
          jobTitle: file.name.replace(/\.[^.]+$/, ''),
          companyName: '', jobLocation: '', experienceRange: '',
          skills: [], jobType: 'Full-time', jobDescription: '',
          minSalary: '', maxSalary: '', currency: 'INR',
          jobCategory: 'Information Technology', noticePeriod: '',
          status: 'error', errors: ['Failed to read file'], selected: true, raw: '',
        });
      }
      // Rate limit: 200ms between AI calls to avoid OpenRouter rate limiting
      if (i < expanded.length - 1) await new Promise(r => setTimeout(r, 200));
    }
    setParsingProgress(100);
    setParsingLabel('Done!');
    setTimeout(() => {
      setJobs(prev => {
        const existingIds = new Set(prev.map(j => j.jobTitle + j.companyName + j.jobLocation));
        const newJobs = parsed.filter(j => !existingIds.has(j.jobTitle + j.companyName + j.jobLocation));
        return [...prev, ...newJobs];
      });
      setStep('preview');
    }, 500);
  }, []);

  const handlePaste = useCallback(async () => {
    const text = pasteRef.current?.value.trim();
    if (!text || text.length < 30) { showToast('Paste at least one job description', 'error'); return; }
    const parts = splitPastedJDs(text);
    setStep('parsing');
    setParsingProgress(0);
    // Step 1 — regex-parse all JDs locally
    setParsingLabel(`Parsing ${parts.length} job description${parts.length > 1 ? 's' : ''}…`);
    const parsed: ParsedJob[] = parts.map((p, i) => parseTextToJob(p, `JD ${i + 1}`));
    setParsingProgress(40);
    // Step 2 — single batched AI call for all JDs
    setParsingLabel(`Enhancing with AI (1 call for all ${parts.length} jobs)…`);
    const aiResults = await aiEnhanceBatch(parsed.map(j => j.raw));
    setParsingProgress(85);
    // Step 3 — merge AI field extraction results back
    aiResults.forEach((ai, i) => {
      if (!parsed[i]) return;
      const job = parsed[i];
      Object.assign(job, {
        jobTitle: ai.jobTitle || job.jobTitle,
        companyName: ai.companyName || job.companyName,
        jobLocation: ai.jobLocation || job.jobLocation,
        experienceRange: ai.experienceRange || job.experienceRange,
        skills: (ai.skills && (ai.skills as string[]).length > 0) ? ai.skills as string[] : job.skills,
        jobType: normalizeJobType(ai.jobType) || job.jobType,
        jobCategory: ai.jobCategory || job.jobCategory,
        noticePeriod: (ai.noticePeriod as string) || job.noticePeriod,
      });
      job.errors = validateJob(job);
      job.status = job.errors.length > 0 ? 'error' : 'ready';
    });
    // Step 4 — generate rich JD for each job (same as single job posting)
    setParsingLabel(`Generating rich job descriptions…`);
    for (let i = 0; i < parsed.length; i++) {
      const job = parsed[i];
      setParsingLabel(`Generating JD ${i + 1}/${parsed.length}: ${job.jobTitle}…`);
      try {
        const richJD = await generateJD(
          job.jobTitle,
          job.companyName || '',
          job.jobLocation || '',
          {
            jobType: job.jobType || 'Full-time',
            skills: job.skills,
            educationLevel: "Bachelor's degree",
            benefits: [],
            salary: (job.minSalary && job.maxSalary) ? `${job.currency || 'INR'} ${job.minSalary} - ${job.maxSalary}` : undefined,
          }
        );
        if (richJD && richJD.length > 100) job.jobDescription = richJD;
      } catch { /* keep existing description */ }
    }
    setParsingProgress(100);
    setParsingLabel('Done!');
    setTimeout(() => {
      setJobs(prev => {
        const existingIds = new Set(prev.map(j => j.jobTitle + j.companyName + j.jobLocation));
        const newJobs = parsed.filter(j => !existingIds.has(j.jobTitle + j.companyName + j.jobLocation));
        return [...prev, ...newJobs];
      });
      setStep('preview');
    }, 500);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  // ── Edit save ────────────────────────────────────────────────────
  const saveEdit = () => {
    if (!editingJob) return;
    setJobs(prev => prev.map(j => {
      if (j.id !== editingJob.id) return j;
      const normalized = { ...editingJob, jobType: normalizeJobType(editingJob.jobType) || 'Full-time' };
      const errs = validateJob(normalized);
      return { ...normalized, errors: errs, status: errs.length > 0 ? 'error' : 'ready' };
    }));
    setEditingJob(null);
  };

  // ── Check duplicates ──────────────────────────────────────────────
  const checkDuplicates = useCallback(async () => {
    setCheckingDupes(true);
    showToast('Checking for duplicate jobs…', 'info');
    const existingTitles = await fetchExistingJobTitles();
    if (!existingTitles.length) {
      showToast('No existing jobs found to compare', 'info');
      setCheckingDupes(false);
      return;
    }
    let dupeCount = 0;
    setJobs(prev => prev.map(job => {
      const match = existingTitles.find(t => titleSimilarity(job.jobTitle, t) >= 0.6);
      if (match) dupeCount++;
      return match ? { ...job, isDuplicate: true, duplicateOf: match } : { ...job, isDuplicate: false };
    }));
    showToast(dupeCount > 0 ? `${dupeCount} potential duplicate(s) flagged` : 'No duplicates found ✓', dupeCount > 0 ? 'error' : 'success');
    setCheckingDupes(false);
  }, []);

  // ── Load candidate counts ─────────────────────────────────────────
  const loadCandidateCounts = useCallback(async () => {
    setJobs(prev => prev.map(j => ({ ...j, candidateCountLoading: true })));
    showToast('Fetching matching candidate counts…', 'info');
    const updated = await Promise.all(
      jobs.map(async job => {
        const count = await fetchCandidateCount(job.skills, job.jobTitle);
        return { ...job, candidateCount: count, candidateCountLoading: false };
      })
    );
    setJobs(updated);
    showToast('Candidate counts loaded', 'success');
  }, [jobs]);

  // ── Bulk AI enhance descriptions ──────────────────────────────────
  const bulkEnhance = useCallback(async () => {
    const toEnhance = jobs.filter(j => j.selected && j.status !== 'published');
    if (!toEnhance.length) { showToast('Select jobs to enhance', 'error'); return; }
    setEnhancing(true);
    showToast(`Enhancing ${toEnhance.length} job description(s) with AI…`, 'info');
    const updatedJobs = [...jobs];
    for (let i = 0; i < updatedJobs.length; i++) {
      const job = updatedJobs[i];
      if (!job.selected || job.status === 'published') continue;
      setEnhancingLabel(`Enhancing ${job.jobTitle} (${toEnhance.indexOf(job) + 1}/${toEnhance.length})…`);
      const newDesc = await aiEnhanceDescription(job);
      updatedJobs[i] = { ...job, jobDescription: newDesc, aiEnhanced: true };
      setJobs([...updatedJobs]);
      // Rate limit: 200ms between AI calls
      await new Promise(r => setTimeout(r, 200));
    }
    setEnhancing(false);
    setEnhancingLabel('');
    showToast('All descriptions enhanced ✓', 'success');
  }, [jobs]);

  // ── Bulk publish via new /api/jobs/bulk endpoint ───────────────────────
  const buildFullDescription = (job: ParsedJob, companyName: string): string => {
    const desc = job.jobDescription?.trim();
    const cleanDesc = desc
      ? desc.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      : '';
    if (cleanDesc && cleanDesc.length > 300) return cleanDesc;
    // Same rich JD template as manual posting (AI-first generation happens in ensureJobDescriptions)
    return generateLocalJD(job.jobTitle, companyName, job.jobLocation || '', {
      jobType: job.jobType || 'Full-time',
      skills: job.skills,
      educationLevel: "Bachelor's degree",
      benefits: [],
      salary: (job.minSalary && job.maxSalary) ? `${job.currency || 'INR'} ${job.minSalary} - ${job.maxSalary}` : undefined,
    });
  };

  // Same JD generation as manual posting: AI first, rich local template only if AI fails
  const ensureJobDescriptions = async (toPublish: ParsedJob[], defaultCompany: string) => {
    const updated: Record<string, string> = {};
    for (const job of toPublish) {
      const desc = job.jobDescription?.trim() || '';
      const clean = desc
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      if (clean.length > 300) continue;
      try {
        const companyName = job.companyName || defaultCompany || 'Company';
        const jd = await generateJD(job.jobTitle, companyName, job.jobLocation || '', {
          jobType: job.jobType || 'Full-time',
          skills: job.skills,
          educationLevel: "Bachelor's degree",
          benefits: [],
          salary: (job.minSalary && job.maxSalary) ? `${job.currency || 'INR'} ${job.minSalary} - ${job.maxSalary}` : undefined,
        });
        if (jd && jd.length > 100) updated[job.id] = jd;
      } catch { /* keep existing description */ }
      await new Promise(r => setTimeout(r, 200));
    }
    if (Object.keys(updated).length > 0) {
      setJobs(prev => prev.map(j => updated[j.id] ? { ...j, jobDescription: updated[j.id] } : j));
    }
    return updated;
  };

  const publishJobs = async () => {
    const toPublish = jobs.filter(j => j.selected && j.status !== 'published');
    if (!toPublish.length) { showToast('No jobs selected to publish', 'error'); return; }
    if (!user?.email) { showToast('Please log in first', 'error'); return; }
    setStep('publishing');

    const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
    // Company name: job field > logged-in employer's company > fallback
    const defaultCompany = storedUser.companyName || storedUser.company || user?.companyName || user?.company || '';

    // Mark all as publishing
    setJobs(prev => prev.map(j => toPublish.find(p => p.id === j.id) ? { ...j, status: 'publishing' } : j));

    // Generate missing/short JDs the same way as manual posting (AI first, local fallback)
    const generated = await ensureJobDescriptions(toPublish, defaultCompany);
    toPublish.forEach(job => { if (generated[job.id]) job.jobDescription = generated[job.id]; });

    const jobsPayload = toPublish.map(job => {
      const companyName = job.companyName || defaultCompany || 'Company';
      return {
        jobTitle: job.jobTitle,
        company: companyName,
        companyName,
        location: job.jobLocation || 'Remote',
        jobLocation: job.jobLocation || 'Remote',
        jobType: [normalizeJobType(job.jobType) || 'Full-time'],
        description: buildFullDescription(job, companyName),
        jobDescription: buildFullDescription(job, companyName),
        skills: job.skills,
        experienceRange: job.experienceRange,
        jobCategory: job.jobCategory || 'Information Technology',
        postedBy: user.email,
        postedByEmail: user.email,
        postedByName: user.name || user.email,
        employerEmail: getEffectiveEmployerEmail(),
        positionId: generatePositionId(companyName),
        locationType: 'In person',
        noticePeriod: job.noticePeriod || '',
        ...(job.minSalary && job.maxSalary && {
          salary: { min: parseInt(job.minSalary), max: parseInt(job.maxSalary), currency: job.currency, period: 'yearly' }
        }),
      };
    });

    try {
      // Use bulk endpoint
      const res = await apiFetch(`${API_ENDPOINTS.JOBS}/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs: jobsPayload, employerEmail: getEffectiveEmployerEmail() }),
      });

      if (res.ok) {
        const data = await res.json();
        let si = 0;
        setJobs(prev => prev.map(j => {
          if (!toPublish.find(p => p.id === j.id)) return j;
          const r = data.results?.[si++];
          return r?.success
            ? { ...j, status: 'published' }
            : { ...j, status: 'error', errors: [r?.error || 'Publish failed'] };
        }));
        setPublishResults({ success: data.successCount ?? 0, failed: data.failCount ?? 0 });
      } else {
        // Bulk endpoint failed — fallback to individual POSTs with 200ms delay
        let success = 0, failed = 0;
        for (const job of toPublish) {
          setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'publishing' } : j));
          try {
            const companyName = job.companyName || defaultCompany || 'Company';
            const payload = {
              jobTitle: job.jobTitle, company: companyName, companyName,
              location: job.jobLocation || 'Remote', jobLocation: job.jobLocation || 'Remote',
              jobType: [normalizeJobType(job.jobType) || 'Full-time'], type: normalizeJobType(job.jobType) || 'Full-time',
              description: buildFullDescription(job, companyName),
              jobDescription: buildFullDescription(job, companyName),
              skills: job.skills, experienceRange: job.experienceRange,
              jobCategory: job.jobCategory || 'Information Technology',
              postedBy: user.email, postedByEmail: user.email,
              postedByName: user.name || user.email,
              employerEmail: getEffectiveEmployerEmail(),
              positionId: generatePositionId(companyName),
              locationType: 'In person', noticePeriod: job.noticePeriod || '',
              ...(job.minSalary && job.maxSalary && {
                salary: { min: parseInt(job.minSalary), max: parseInt(job.maxSalary), currency: job.currency, period: 'yearly' }
              }),
            };
            const r = await apiFetch(API_ENDPOINTS.JOBS, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (r.ok) { success++; setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'published' } : j)); }
            else { failed++; setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'error', errors: ['Publish failed'] } : j)); }
          } catch { failed++; setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'error', errors: ['Network error'] } : j)); }
          await new Promise(r => setTimeout(r, 200));
        }
        setPublishResults({ success, failed });
      }
    } catch {
      setPublishResults({ success: 0, failed: toPublish.length });
      setJobs(prev => prev.map(j => toPublish.find(p => p.id === j.id) ? { ...j, status: 'error', errors: ['Network error'] } : j));
    }
    setStep('done');
  };

  const selectedCount = jobs.filter(j => j.selected).length;
  const readyCount = jobs.filter(j => j.status === 'ready').length;
  const errorCount = jobs.filter(j => j.status === 'error').length;

  // ─────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Toast — rendered in a portal so it's never clipped by page/header layout */}
      {toast && createPortal(
        <div className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 max-w-[calc(100vw-2rem)] sm:max-w-md break-words ${
          toast.type === 'success' ? 'bg-green-600 text-white' :
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : toast.type === 'error' ? <X className="w-4 h-4 flex-shrink-0" /> : <Zap className="w-4 h-4 flex-shrink-0" />}
          <span>{toast.msg}</span>
        </div>,
        document.body
      )}

      {/* Hidden file input — always mounted so "+ Add More" can open the
          picker directly from the preview without leaving the list */}
      <input
        ref={fileRef}
        type="file"
        multiple
        accept=".csv"
        className="hidden"
        onChange={e => e.target.files && processFiles(e.target.files)}
      />

      {/* Site Header */}
      <Header onNavigate={onNavigate} user={user} />

      {/* Page sub-header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton fallback="/job-posting-selection" text="Back" />
            <div className="w-px h-5 bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Upload className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-base font-semibold text-gray-900">Bulk Job Import</h1>
            </div>
          </div>
          {/* Step pills */}
          <div className="hidden sm:flex items-center gap-1 text-xs font-medium">
            {(['upload','preview','done'] as const).map((s, i) => (
              <React.Fragment key={s}>
                <span className={`px-2.5 py-1 rounded-full ${
                  step === s || (step === 'parsing' && s === 'upload') || (step === 'publishing' && s === 'preview')
                    ? 'bg-blue-600 text-white'
                    : jobs.length > 0 && i < ['upload','preview','done'].indexOf(step)
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
                </span>
                {i < 2 && <span className="text-gray-300">›</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">

        {/* ── STEP: UPLOAD ─────────────────────────────────────────── */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Import Multiple Jobs at Once</h2>
              <p className="text-gray-500 mt-1 text-sm">Upload a CSV file — or paste multiple JDs below</p>
            </div>

            {/* Existing parsed jobs notice (visible when coming back via "Add More") */}
            {jobs.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-blue-200 rounded-2xl px-5 py-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>
                    <span className="font-semibold text-gray-900">{jobs.length} job{jobs.length !== 1 ? 's' : ''}</span> already parsed
                    — new uploads will be merged with the existing list
                  </span>
                </div>
                <button
                  onClick={() => setStep('preview')}
                  className="text-xs font-medium text-blue-700 border border-blue-200 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
                >
                  Back to Preview
                </button>
              </div>
            )}

            {/* Drop zone */}
            <div
              onDrop={onDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${dragOver ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/30'}`}
            >
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-7 h-7 text-blue-600" />
              </div>
              <p className="text-lg font-semibold text-gray-800">Drag & drop files here</p>
              <p className="text-sm text-gray-400 mt-1 mb-5">or click to browse</p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full font-medium">
                  <IconCSV /> CSV Files only
                </span>
              </div>
            </div>

            {/* Paste area */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">Paste Multiple JDs</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Separate each job description with <code className="bg-gray-100 px-1 rounded">---</code></p>
                </div>
                <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-1 rounded-full">Copy-Paste</span>
              </div>
              <textarea
                ref={pasteRef}
                rows={6}
                placeholder={`Paste Job Description 1 here...\n\n---\n\nPaste Job Description 2 here...\n\n---\n\nPaste Job Description 3 here...`}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handlePaste}
                  className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" /> Parse with AI
                </button>
              </div>
            </div>

            {/* CSV template download */}
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
              <div>
                <p className="text-sm font-semibold text-blue-800">Need a CSV template?</p>
                <p className="text-xs text-blue-600 mt-0.5">Download and fill in your job data, then upload above</p>
              </div>
              <button
                onClick={() => {
                  const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = 'zyncjobs_bulk_template.csv'; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-1.5 text-sm font-medium text-blue-700 border border-blue-300 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4" /> Download Template
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: PARSING ─────────────────────────────────────────── */}
        {step === 'parsing' && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="relative w-20 h-20">
              <div className="w-20 h-20 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-7 h-7 text-blue-600" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">AI Parsing in Progress</h2>
              <p className="text-gray-500 text-sm mt-1">{parsingLabel}</p>
            </div>
            <div className="w-72 bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${parsingProgress}%` }} />
            </div>
            <p className="text-xs text-gray-400">{parsingProgress}% complete</p>
          </div>
        )}

        {/* ── STEP: PREVIEW ─────────────────────────────────────────── */}
        {step === 'preview' && (
          <div className="space-y-5">
            {/* Summary bar */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-bold text-gray-900">{jobs.length} Jobs Found</span>
                <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> {readyCount} Ready
                </span>
                {errorCount > 0 && (
                  <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> {errorCount} Need Review
                  </span>
                )}
                {jobs.filter(j => j.isDuplicate).length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full font-medium">
                    <Copy className="w-3.5 h-3.5" /> {jobs.filter(j => j.isDuplicate).length} Duplicates
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none border border-gray-200 rounded-lg px-3 h-9 hover:bg-gray-50 transition-colors">
                  <input type="checkbox" checked={jobs.every(j => j.selected)} onChange={e => setJobs(prev => prev.map(j => ({ ...j, selected: e.target.checked })))} className="rounded" />
                  Select all
                </label>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="h-9 text-xs font-medium text-gray-600 border border-gray-200 px-3 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  + Add More
                </button>
                <button
                  onClick={checkDuplicates}
                  disabled={checkingDupes}
                  className="h-9 text-xs font-medium text-orange-700 border border-orange-200 bg-orange-50 px-3 rounded-lg hover:bg-orange-100 transition-colors flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                  title="Check against already posted jobs"
                >
                  {checkingDupes ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
                  Duplicate Check
                </button>
                <button
                  onClick={loadCandidateCounts}
                  className="h-9 text-xs font-medium text-purple-700 border border-purple-200 bg-purple-50 px-3 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  title="Show matching candidate count per job"
                >
                  <Users className="w-3.5 h-3.5" /> Match Counts
                </button>
                <button
                  onClick={bulkEnhance}
                  disabled={enhancing || selectedCount === 0}
                  className="h-9 text-xs font-medium text-blue-700 border border-blue-200 bg-blue-50 px-3 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                  title="AI-rewrite all selected job descriptions"
                >
                  {enhancing ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {enhancing ? (enhancingLabel || 'Enhancing…') : 'AI Enhance'}
                </button>
                <div className="w-px h-6 bg-gray-200 mx-1" />
                <button
                  onClick={publishJobs}
                  disabled={selectedCount === 0}
                  className="h-9 bg-blue-600 text-white text-xs font-semibold px-4 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Publish {selectedCount > 0 ? `${selectedCount} Jobs` : 'Selected'}
                </button>
              </div>
            </div>

            {/* Job cards */}
            <div className="space-y-3">
              {jobs.map(job => (
                <div key={job.id} className={`bg-white border rounded-xl overflow-hidden transition-all ${
                    job.isDuplicate ? 'border-red-300' :
                    job.status === 'error' ? 'border-amber-300' :
                    job.status === 'published' ? 'border-green-300 opacity-70' :
                    'border-gray-200'
                  }`}>
                  {/* Card header */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={job.selected}
                      onChange={e => setJobs(prev => prev.map(j => j.id === job.id ? { ...j, selected: e.target.checked } : j))}
                      className="rounded flex-shrink-0"
                      disabled={job.status === 'published'}
                    />
                    {/* Status icon */}
                    <div className="flex-shrink-0">
                      {job.status === 'published' ? <CheckCircle className="w-5 h-5 text-green-500" /> :
                       job.status === 'publishing' ? <Loader className="w-5 h-5 text-blue-500 animate-spin" /> :
                       job.status === 'error' ? <AlertCircle className="w-5 h-5 text-amber-500" /> :
                       <CheckCircle className="w-5 h-5 text-green-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm truncate">{job.jobTitle}</p>
                        {job.status === 'published' && <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-medium">Published</span>}
                        {job.status === 'error' && <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">Needs Review</span>}
                        {job.aiEnhanced && (
                          <span className="text-xs text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> AI Enhanced
                          </span>
                        )}
                        {job.isDuplicate && (
                          <span className="text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <Copy className="w-3 h-3" /> Duplicate
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {job.companyName && <span className="text-xs text-gray-600 font-medium">{job.companyName}</span>}
                        {job.jobLocation && <span className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{job.jobLocation}</span>}
                        {job.experienceRange && <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{job.experienceRange}</span>}
                        {job.jobType && <span className="text-xs text-gray-500 flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.jobType}</span>}
                        {job.candidateCountLoading && <span className="text-xs text-purple-500 flex items-center gap-1"><Loader className="w-3 h-3 animate-spin" /> Loading…</span>}
                        {!job.candidateCountLoading && job.candidateCount !== undefined && (
                          <span className="text-xs text-purple-700 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Users className="w-3 h-3" /> {job.candidateCount} matches
                          </span>
                        )}
                        <span className="text-xs text-gray-400">from {job.fileName}</span>
                      </div>
                      {job.isDuplicate && job.duplicateOf && (
                        <p className="text-xs text-red-500 mt-0.5">Similar to existing: "{job.duplicateOf}"</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setEditingJob({ ...jobs.find(j => j.id === job.id) || job })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setJobs(prev => prev.filter(j => j.id !== job.id))} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remove">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setExpandedId(expandedId === job.id ? null : job.id)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        {expandedId === job.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded preview â€” full field table */}
                  {expandedId === job.id && (
                    <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 space-y-4">

                      {/* Validation errors */}
                      {job.errors.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {job.errors.map(e => (
                            <span key={e} className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3" /> {e}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* All parsed fields */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-xs">
                        {([
                          { label: 'Company',    value: job.companyName },
                          { label: 'Location',   value: job.jobLocation },
                          { label: 'Experience', value: job.experienceRange },
                          { label: 'Job Type',   value: job.jobType },
                          { label: 'Category',   value: job.jobCategory },
                          { label: 'Notice',     value: job.noticePeriod },
                          { label: 'Min Salary', value: job.minSalary ? `\u20b9${Number(job.minSalary).toLocaleString()}` : '' },
                          { label: 'Max Salary', value: job.maxSalary ? `\u20b9${Number(job.maxSalary).toLocaleString()}` : '' },
                          { label: 'Source',     value: job.fileName },
                        ] as { label: string; value: string }[]).map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-gray-400 uppercase tracking-wide text-[10px] font-semibold">{label}</p>
                            <p className={`mt-0.5 font-medium ${value ? 'text-gray-800' : 'text-red-400 italic'}`}>
                              {value || 'Missing'}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Skills */}
                      {job.skills.length > 0 && (
                        <div>
                          <p className="text-gray-400 uppercase tracking-wide text-[10px] font-semibold mb-1.5">Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {job.skills.map(s => (
                              <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {job.jobDescription && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-gray-400 uppercase tracking-wide text-[10px] font-semibold">Job Description</p>
                            {job.aiEnhanced && <span className="text-[10px] text-purple-600 font-medium flex items-center gap-0.5"><Sparkles className="w-3 h-3" /> AI Enhanced</span>}
                          </div>
                          <pre className="text-xs text-gray-700 leading-relaxed bg-white border border-gray-200 rounded-lg px-3 py-2 max-h-60 overflow-y-auto whitespace-pre-wrap font-sans">
                            {job.jobDescription
                              .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
                            }
                          </pre>
                        </div>
                      )}

                      {/* Quick edit */}
                      <div className="flex justify-end">
                        <button
                          onClick={() => setEditingJob({ ...jobs.find(j => j.id === job.id) || job })}
                          className="text-xs font-medium text-blue-600 border border-blue-200 bg-white px-3 py-1.5 rounded-lg hover:bg-blue-50 flex items-center gap-1.5 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" /> Fix / Edit this job
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom action bar */}
            <div className="sticky bottom-4 flex justify-center pointer-events-none">
              <div className="pointer-events-auto bg-white border border-gray-200 rounded-full shadow-lg px-4 py-2.5 flex items-center gap-3">
                <span className="text-xs text-gray-600 font-medium whitespace-nowrap">{selectedCount} of {jobs.length} selected</span>
                <div className="w-px h-4 bg-gray-200" />
                <button
                  onClick={publishJobs}
                  disabled={selectedCount === 0}
                  className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Publish {selectedCount > 0 ? `${selectedCount} Jobs` : ''}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: PUBLISHING ─────────────────────────────────────── */}
        {step === 'publishing' && (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            <h2 className="text-xl font-bold text-gray-900">Publishing Jobs…</h2>
            <p className="text-sm text-gray-500">Please wait while we post your jobs</p>
            <div className="w-full max-w-sm space-y-2 mt-4">
              {jobs.filter(j => j.selected).map(j => (
                <div key={j.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2">
                  {j.status === 'published' ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> :
                   j.status === 'publishing' ? <Loader className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" /> :
                   j.status === 'error' ? <X className="w-4 h-4 text-red-500 flex-shrink-0" /> :
                   <div className="w-4 h-4 rounded-full bg-gray-200 flex-shrink-0" />}
                  <span className="text-sm text-gray-700 truncate">{j.jobTitle}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP: DONE ────────────────────────────────────────────── */}
        {step === 'done' && (
          <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Bulk Import Complete!</h2>
              <p className="text-gray-500 mt-2">
                <span className="font-semibold text-blue-700">{publishResults.success} jobs published</span>
                {publishResults.failed > 0 && <span className="text-red-600 ml-2">· {publishResults.failed} failed</span>}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={() => onNavigate('job-management')} className="bg-blue-600 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
                View Posted Jobs
              </button>
              <button onClick={() => { setJobs([]); setStep('upload'); }} className="border border-gray-300 text-gray-700 font-medium px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                Import More Jobs
              </button>
              <button onClick={() => onNavigate('dashboard')} className="border border-gray-300 text-gray-700 font-medium px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                Back to Dashboard
              </button>
            </div>

            {/* Failed jobs list */}
            {publishResults.failed > 0 && (
              <div className="w-full max-w-md mt-4 text-left">
                <p className="text-sm font-medium text-red-700 mb-2">Failed to publish:</p>
                {jobs.filter(j => j.status === 'error' && j.selected).map(j => (
                  <div key={j.id} className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-1">
                    <X className="w-4 h-4 flex-shrink-0" /> {j.jobTitle} — {j.errors[0]}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Site Footer */}
      <Footer onNavigate={onNavigate} user={user} />

      {/* ── EDIT MODAL ────────────────────────────────────────────── */}
      {editingJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingJob(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Edit Job</h3>
              <button onClick={() => setEditingJob(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="px-5 py-4 space-y-4">
              {([
                { label: 'Job Title *', field: 'jobTitle', type: 'text' },
                { label: 'Location', field: 'jobLocation', type: 'text' },
                { label: 'Experience Range', field: 'experienceRange', type: 'text' },
                { label: 'Company Name', field: 'companyName', type: 'text' },
              ] as const).map(({ label, field, type }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                  <input
                    type={type}
                    value={(editingJob as any)[field]}
                    onChange={e => setEditingJob(prev => prev ? { ...prev, [field]: e.target.value } : null)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
              <div>
                <AutocompleteCombobox
                  label="Job Type"
                  value={editingJob.jobType}
                  onChange={(val) => setEditingJob(prev => prev ? { ...prev, jobType: val } : null)}
                  options={['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Temporary'].map(t => ({ value: t, label: t }))}
                  placeholder="Select job type"
                />
              </div>
              <div>
                <AutocompleteCombobox
                  label="Job Category"
                  value={editingJob.jobCategory}
                  onChange={(val) => setEditingJob(prev => prev ? { ...prev, jobCategory: val } : null)}
                  options={['Information Technology','Software Development','Data Science & Analytics','Sales & Marketing','Finance & Accounting','Human Resources','Operations','Customer Service','Healthcare','Engineering','Education','Legal','Manufacturing','Retail','Construction','Hospitality & Tourism','Media & Communications','Logistics & Supply Chain','Real Estate','Oil & Gas','Telecom','Banking & Insurance','Other'].map(c => ({ value: c, label: c }))}
                  placeholder="Select category"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notice Period</label>
                <select
                  value={editingJob.noticePeriod}
                  onChange={e => setEditingJob(prev => prev ? { ...prev, noticePeriod: e.target.value } : null)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="" disabled hidden>Select Notice Period</option>
                  {NOTICE_PERIOD_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  value={editingJob.skills.join(', ')}
                  onChange={e => setEditingJob(prev => prev ? { ...prev, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : null)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="React, Node.js, Python…"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Min Salary</label>
                  <input type="text" value={editingJob.minSalary} onChange={e => setEditingJob(prev => prev ? { ...prev, minSalary: e.target.value } : null)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="500000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Max Salary</label>
                  <input type="text" value={editingJob.maxSalary} onChange={e => setEditingJob(prev => prev ? { ...prev, maxSalary: e.target.value } : null)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="800000" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Job Description</label>
                <p className="text-xs text-gray-400 mb-1">{editingJob.jobDescription.length} chars — scroll to see full content</p>
                <textarea
                  rows={14}
                  value={editingJob.jobDescription
                    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")}
                  onChange={e => setEditingJob(prev => prev ? { ...prev, jobDescription: e.target.value } : null)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono"
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex gap-3 justify-end">
              <button onClick={() => setEditingJob(null)} className="text-sm border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={saveEdit} className="text-sm bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
