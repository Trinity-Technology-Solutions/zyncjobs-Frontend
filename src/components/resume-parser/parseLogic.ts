export interface ParsedResume {
  profile: {
    name: string;
    email: string;
    phone: string;
    location: string;
    url?: string;
    address?: { city: string; state: string; country: string; postal_code: string; full_address: string };
  };
  skills: { featuredSkills: { skill: string }[] };
  workExperiences: { jobTitle: string; company: string; date: string; descriptions: string[] }[];
  educations: { degree: string; school: string; date: string; gpa?: string; descriptions?: string[] }[];
  projects?: { name: string; date?: string; descriptions?: string[]; description?: string }[];
  competitions?: string[];
  certifications?: { name: string; provider: string; date: string }[];
  softSkills?: string[];
  tools?: string[];
  summary?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
import { tokenStorage } from '../../utils/tokenStorage';
import { getCached, setCached, cacheKey } from '../../services/aiCache';

const RESUME_CACHE_TTL = 30 * 60 * 1000;

async function hashText(text: string): Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Known institution keywords ───────────────────────────────────────────────
const INSTITUTION_KEYWORDS = /\b(university|college|institute|school|academy|polytechnic|iit|nit|licet|loyola|icam|mat\.hr|matriculation|higher secondary|secondary|sslc|hsc|cbse|state board|engineering|technology|science|arts|commerce)\b/i;

// ─── Known degree keywords ────────────────────────────────────────────────────
const DEGREE_KEYWORDS = /\b(b\.?tech|b\.?e|b\.?sc|b\.?com|b\.?a|m\.?tech|m\.?e|m\.?sc|mba|m\.?a|ph\.?d|bachelor|master|diploma|sslc|hsc|10th|12th|standard|information technology|computer science|engineering|data science|electronics|mechanical|civil|electrical|arts|commerce|pcmb|pcmc)\b/i;

// ─── Section heading detector ─────────────────────────────────────────────────
const HEADING_PATTERN = /^(work\s+experience|professional\s+experience|experience|employment|work\s+history|education|academic|qualification|skills|technical\s+skills|key\s+skills|core\s+skills|projects?|personal\s+projects?|academic\s+projects?|certifications?|certificates?|awards?|achievements?|languages?|interests?|hobbies|references?|contact|internship|training|summary|objective|profile|about(\s+me)?|extra.?curricular|extracurricular|hackathons?|short\s+courses?|competitions?|workshops?|volunteer|publications?|research|tools?|soft\s+skills?)s?$/i;

const SECTION_HEADINGS = new Set([
  'about me','about','summary','objective','profile','overview',
  'experience','work experience','employment','work history','professional experience',
  'education','academic background','qualifications',
  'skills','technical skills','key skills','core competencies','competencies',
  'projects','personal projects','academic projects',
  'certifications','certificates','awards','achievements','accomplishments',
  'languages','interests','hobbies','references','contact','contact information',
  'internships','training','volunteer','publications','research','tools','soft skills',
]);

function isLikelyName(line: string): boolean {
  const l = line.trim();
  if (!l || l.length < 2 || l.length > 60) return false;
  if (SECTION_HEADINGS.has(l.toLowerCase())) return false;
  if (/[@|•\-_=*#/\\&]/.test(l)) return false;
  if (/\d{4}/.test(l)) return false;
  if (/^(http|www)/i.test(l)) return false;
  if (!/[a-zA-Z]/.test(l)) return false;
  const words = l.split(/\s+/);
  if (words.length < 2 || words.length > 5) return false;
  const allCapOrTitle = words.every(w => /^[A-Z][a-zA-Z'.-]*$/.test(w) || /^[A-Z]+$/.test(w));
  if (!allCapOrTitle) return false;
  if (DEGREE_KEYWORDS.test(l) || INSTITUTION_KEYWORDS.test(l)) return false;
  return true;
}

function extractSection(lines: string[], headingPattern: RegExp): string[] {
  const startIdx = lines.findIndex(l => headingPattern.test(l.trim()));
  if (startIdx < 0) return [];
  const result: string[] = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed && HEADING_PATTERN.test(trimmed)) break;
    if (trimmed) result.push(trimmed);
  }
  return result;
}

// ─── TECH SKILLS keyword list ─────────────────────────────────────────────────
const TECH_SKILLS = [
  'JavaScript','TypeScript','Python','Java','C','C++','C#','PHP','Ruby','Go','Rust','Kotlin','Swift',
  'React','Angular','Vue','Next.js','Node.js','Express','Django','Flask','Spring','Laravel','FastAPI',
  'HTML','CSS','Tailwind','Bootstrap','SASS','jQuery',
  'SQL','MySQL','PostgreSQL','MongoDB','Redis','SQLite','Oracle','Firebase',
  'AWS','Azure','GCP','Docker','Kubernetes','Git','Linux','Terraform','Jenkins','CI/CD',
  'Machine Learning','Deep Learning','TensorFlow','PyTorch','Scikit-learn','Pandas','NumPy','OpenCV',
  'Power BI','PowerBI','Tableau','Excel','MATLAB','R','Hadoop','Spark','Kafka',
  'REST','GraphQL','Microservices','Agile','Scrum','Figma','Jira','Postman',
  'MERN Stack','MEAN Stack','Full Stack','Data Analysis','Data Science','NLP','IoT',
  'React.js','Angular.js','Node.js','Vue.js','Next.js','Nest.js',
];

// ─── Pure skill/tech-only lines — never treat as company or job title ────────
const SKILL_ONLY_PATTERN = /^(programming\s+languages?|web\s+development|data\s+base|database|tools?|frameworks?|java|python|html|css|javascript|typescript|mysql|mongodb|sql|php|ruby|swift|kotlin|c\+\+|c#|react|angular|vue|node\.?js|express|django|flask|spring|bootstrap|tailwind|sass|jquery|aws|azure|gcp|docker|kubernetes|git|linux|terraform|jenkins|figma|canva|excel|matlab|power\s*bi|tableau|hadoop|spark|kafka|rest|graphql|microservices|agile|scrum|jira|postman)$/i;

// ─── LOCAL PARSER ─────────────────────────────────────────────────────────────
function parseResumeLocally(text: string): ParsedResume {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Profile
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  // Phone: must NOT look like a date range (e.g., "2021 - 2025")
  const phoneCandidates = text.match(/(?:\+91[\s-]?)?[6-9]\d{9}|\+?[\d][\d\s\-(). ]{7,}\d/g);
  let phoneMatch = null;
  if (phoneCandidates) {
    for (const pc of phoneCandidates) {
      // Skip if it's clearly a date range (contains 4-digit year + dash + 4-digit year)
      if (/\b(19|20)\d{2}\s*[-–]\s*(19|20)\d{2}\b/.test(pc)) continue;
      // Skip if it's just a year range like "2021 - 2025"
      if (/^\d{4}\s*[-–]\s*\d{4}$/.test(pc.trim())) continue;
      phoneMatch = pc.trim(); break;
    }
  }
  const urlMatch = text.match(/https?:\/\/[^\s]+|(?:linkedin|github)\.com\/[^\s]+/i);
  const cities = ['Chennai','Bangalore','Bengaluru','Mumbai','Hyderabad','Pune','Delhi','Noida','Gurgaon','Kolkata','Ahmedabad','Coimbatore','Kochi','Jaipur','Indore','Bhopal','Nagpur','Surat','Lucknow','Visakhapatnam','Mysore','Madurai','Trichy','Vellore','Pondicherry','Tirupur','Tiruppur'];
  let location = '';
  for (const city of cities) {
    if (new RegExp(`\\b${city}\\b`, 'i').test(text)) { location = city; break; }
  }

  // Name: first 8 lines, must look like a real name (allowing lowercase names too)
  const toTitleCase = (s: string) => s.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  let name = '';
  for (const line of lines.slice(0, 8)) {
    const normalized = line === line.toUpperCase() && line.length > 1 ? toTitleCase(line) : line;
    // Also accept lowercase names that look like real names (e.g., "subbashinna")
    const looksLikeName = isLikelyName(normalized) || (
      normalized.length >= 3 && normalized.length <= 60 &&
      !SECTION_HEADINGS.has(normalized.toLowerCase()) &&
      !/[@•\-_=#*\/\\&\d]/.test(normalized) &&
      /^[a-zA-Z]/.test(normalized) &&
      normalized.split(/\s+/).length >= 2 &&
      !DEGREE_KEYWORDS.test(normalized) &&
      !INSTITUTION_KEYWORDS.test(normalized)
    );
    if (looksLikeName) { name = normalized; break; }
  }

  // Skills — scan full text for known tech keywords
  const skillsFromText = TECH_SKILLS.filter(k => {
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
  });
  // Also extract from skills section — split by colons, commas, pipes, bullets, newlines
  const skillsSection = extractSection(lines, /^(key\s+|technical\s+|core\s+|hard\s+|soft\s+|professional\s+)?skills?(\s+&\s+\w+)?$/i);
  const skillsFromSection = skillsSection
    .join(' ')
    .split(/[,|•\n\/:]/)
    .map(s => s.replace(/^\s*[-–]\s*/, '').trim())
    .filter(s => s.length > 1 && s.length < 50 && /[a-zA-Z]/.test(s) && !SECTION_HEADINGS.has(s.toLowerCase()))
    // Filter out heading-like words that are not actual skills
    .filter(s => !/^(database|tools?|frameworks?|technology|web|frontend|backend|languages?|platforms?|concepts?|methodologies?)$/i.test(s));
  // Merge, deduplicate
  const allSkills = [...new Set([...skillsFromText, ...skillsFromSection])];

  // Work Experience
  const expSection = extractSection(lines, /^(work\s+)?(experience|employment|history|professional\s+experience|internship)$/i);
  const workExperiences: ParsedResume['workExperiences'] = [];
  if (expSection.length > 0) {
    const datePattern = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4}|present|current)/i;
    const dateRangePattern = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})\b.*\b(\d{4}|present|current)\b/i;
    // A line is a job/company header if it's short, not a bullet, not a pure date, starts with capital
    const isHeader = (l: string) =>
      !(/^[•\-–*]/.test(l)) &&
      !(/^https?:\/\/|^www\./i.test(l)) &&
      !(/^[\d]/.test(l)) &&
      !SKILL_ONLY_PATTERN.test(l) &&
      l.length > 2 && l.length < 100 &&
      /^[A-Z]/.test(l) &&
      !/^(developed|built|created|analyzed|implemented|designed|completed|worked|gained|responsible|managed|led|handled|assisted)/i.test(l);

    let cur: { jobTitle: string; company: string; date: string; descriptions: string[] } | null = null;
    for (const line of expSection) {
      const isBullet = /^[•\-–*]/.test(line);
      const isDateLine = dateRangePattern.test(line) && line.length < 60;
      const isBulletDesc = /^(developed|built|created|analyzed|implemented|designed|completed|worked|gained|responsible|managed|led|handled|assisted)/i.test(line);

      if (isBullet || isBulletDesc) {
        if (cur) cur.descriptions.push(line.replace(/^[•\-–*]\s*/, ''));
        continue;
      }
      // Skip pure skill/tech lines that leaked from adjacent column
      if (SKILL_ONLY_PATTERN.test(line)) continue;
      if (isDateLine) {
        if (cur && !cur.date) { cur.date = line; continue; }
        if (cur && (cur.jobTitle || cur.company)) workExperiences.push(cur);
        cur = { jobTitle: '', company: '', date: line, descriptions: [] };
        continue;
      }
      if (isHeader(line)) {
        if (cur && !cur.date && !cur.jobTitle) { cur.jobTitle = line; continue; }
        if (cur && cur.date && !cur.jobTitle) { cur.jobTitle = line; continue; }
        if (cur && cur.jobTitle && !cur.company) { cur.company = line; continue; }
        if (cur && (cur.jobTitle || cur.company)) workExperiences.push(cur);
        cur = { jobTitle: line, company: '', date: '', descriptions: [] };
      } else if (cur) {
        cur.descriptions.push(line);
      }
    }
    if (cur && (cur.jobTitle || cur.company)) workExperiences.push(cur);
  }

  // Education — group by degree entry: degree line → school line → gpa/date lines
  const eduSection = extractSection(lines, /^education(al\s+(background|qualification))?s?$/i);
  const educations: ParsedResume['educations'] = [];
  if (eduSection.length > 0) {
    const yearRe = /\b(19|20)\d{2}\b/;
    const gpaRe = /\b(gpa|cgpa)[:\s]*([\d.]+)/i;
    const percentRe = /\b(\d{1,3}\.?\d*)\s*%/;
    const yearOfCompletionRe = /year\s+of\s+completion[:\s]*(\d{4})/i;
    const dateRangeRe = /\b(19|20)\d{2}\s*[-–]\s*(?:(19|20)\d{2}|present|current)\b/i;

    const isMetaLine = (l: string) =>
      yearOfCompletionRe.test(l) || percentRe.test(l) || gpaRe.test(l) ||
      /^[\d\s\-–\/]+$/.test(l) || dateRangeRe.test(l);

    // A line is a degree/level header (B.Tech, HSC, SSLC, SENIOR SECONDARY, etc.)
    const isDegreeHeader = (l: string) => DEGREE_KEYWORDS.test(l) && !INSTITUTION_KEYWORDS.test(l);
    // A line is an institution name
    const isInstitution = (l: string) => INSTITUTION_KEYWORDS.test(l);

    let cur: ParsedResume['educations'][0] | null = null;

    const pushCur = () => { if (cur && (cur.school || cur.degree)) educations.push(cur); };

    for (const line of eduSection) {
      if (/^[•\-–*]/.test(line)) continue; // skip bullets

      const yocMatch = line.match(yearOfCompletionRe);
      const pctMatch = line.match(percentRe);
      const gpaMatch = line.match(gpaRe);
      const hasYear = yearRe.test(line);

      if (yocMatch) { if (cur) cur.date = yocMatch[1]; continue; }
      if (gpaMatch) { if (cur) { cur.gpa = gpaMatch[2]; if (hasYear && !cur.date) cur.date = line.match(yearRe)?.[0] || ''; } continue; }
      if (pctMatch && !gpaMatch) { if (cur) { cur.gpa = pctMatch[1]; if (hasYear && !cur.date) cur.date = line.match(yearRe)?.[0] || ''; } continue; }
      if (isMetaLine(line)) { if (cur && !cur.date) cur.date = line.match(yearRe)?.[0] || ''; continue; }

      if (isDegreeHeader(line)) {
        pushCur();
        const clean = line.replace(yearRe, '').replace(gpaRe, '').replace(percentRe, '').trim();
        cur = {
          degree: clean,
          school: '',
          date: hasYear ? (line.match(yearRe)?.[0] || '') : '',
          gpa: gpaMatch?.[2] || (pctMatch?.[1] ?? undefined),
        };
      } else if (isInstitution(line)) {
        if (cur && !cur.school) {
          cur.school = line.replace(yearRe, '').replace(gpaRe, '').trim();
          if (hasYear && !cur.date) cur.date = line.match(yearRe)?.[0] || '';
        } else {
          pushCur();
          cur = { degree: '', school: line.replace(yearRe, '').trim(), date: hasYear ? (line.match(yearRe)?.[0] || '') : '' };
        }
      }
      // else: non-edu line (location, activity text) — skip
    }
    pushCur();
  }

  // Projects
  const projSection = extractSection(lines, /^(personal\s+|academic\s+)?projects?$/i);
  const projects: ParsedResume['projects'] = [];
  if (projSection.length > 0) {
    let cur: { name: string; date?: string; descriptions: string[]; description?: string } | null = null;
    for (const line of projSection) {
      const isBullet = /^[•\-–*]/.test(line);
      const isDesc = /^(developed|built|created|analyzed|implemented|designed|completed|worked|gained|innovated|engineered)/i.test(line);
      const hasYear = /\b(19|20)\d{2}\b/.test(line);
      const isProjectHeader = !isBullet && !isDesc && line.length > 3 && line.length < 120 && /^[A-Z]/.test(line);
      if (isProjectHeader && (!cur || cur.descriptions!.length > 0 || !cur.name)) {
        if (cur) projects.push(cur);
        cur = { name: line.replace(/\b(19|20)\d{2}\b/, '').replace(/[-–]\s*$/, '').trim(), date: hasYear ? line.match(/\b(19|20)\d{2}\b/)?.[0] : undefined, descriptions: [] };
      } else if (cur) {
        cur.descriptions!.push(line.replace(/^[•\-–*]\s*/, ''));
      }
    }
    if (cur) projects.push(cur);
  }

  // Summary
  const summarySection = extractSection(lines, /^(summary|objective|profile|about(\s+me)?)$/i);
  const summary = summarySection.join(' ').trim();

  // Certifications
  const certSection = extractSection(lines, /^certifications?$/i);
  const certifications = certSection
    .filter(l => l.length > 3 && !/^[•\-–*]/.test(l) === false || l.length > 3)
    .map(l => ({ name: l.replace(/^[•\-–*]\s*/, ''), provider: '', date: '' }));

  // Soft skills
  const softSection = extractSection(lines, /^soft\s+skills?$/i);
  const softSkills = softSection
    .join(' ')
    .split(/[,|•\n\/]/)
    .map(s => s.replace(/^\s*[-–]\s*/, '').trim())
    .filter(s => s.length > 1 && s.length < 50);

  return {
    profile: {
      name,
      email: emailMatch?.[0] || '',
      phone: phoneMatch?.[0]?.trim() || '',
      location,
      url: urlMatch?.[0] || '',
    },
    skills: { featuredSkills: allSkills.map(s => ({ skill: s })) },
    workExperiences,
    educations,
    projects,
    summary,
    competitions: [],
    certifications,
    softSkills,
    tools: [],
  };
}

// ─── MERGE: local always wins for education, AI fills gaps elsewhere ──────────
function mergeResults(ai: ParsedResume, local: ParsedResume): ParsedResume {
  const toTitleCase = (s: string) => s.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  // Name: prefer AI if valid and not spaced-out (e.g. "A J A Y" is garbage)
  const aiName = ai.profile.name || '';
  const normalizedAiName = aiName === aiName.toUpperCase() && aiName.length > 1 ? toTitleCase(aiName) : aiName;
  const isSpacedOut = /^([A-Z]\s){2,}[A-Z]$/.test(aiName.trim()); // "A J A Y R O S H A N"
  const name = (!isSpacedOut && isLikelyName(normalizedAiName)) ? normalizedAiName : (local.profile.name || '');

  // Phone: prefer local if AI returned garbage (too short, just '+', etc.)
  const aiPhone = (ai.profile.phone || '').replace(/\s/g, '');
  const phone = aiPhone.length >= 7 ? ai.profile.phone : local.profile.phone;

  // Education: prefer local, filter out non-edu lines (responsibility/activity text)
  const cleanLocalEdu = local.educations.filter(e =>
    INSTITUTION_KEYWORDS.test(e.school) || DEGREE_KEYWORDS.test(e.school) ||
    INSTITUTION_KEYWORDS.test(e.degree) || DEGREE_KEYWORDS.test(e.degree)
  );
  const educations = cleanLocalEdu.length > 0 ? cleanLocalEdu : (ai.educations || []);

  // Work experience: prefer AI only if company AND jobTitle are both clean real values
  const isGarbage = (s: string) => !s || /^https?:\/\/|^www\./i.test(s) || /^[\d]{5,}/.test(s) || SKILL_ONLY_PATTERN.test(s);
  const aiValidWork = (ai.workExperiences || []).filter(e =>
    (e.company || e.jobTitle) && !isGarbage(e.company) && !isGarbage(e.jobTitle)
  );
  // Also validate: jobTitle should not look like a company name and vice versa
  // If AI has valid work but company/jobTitle are swapped, fix them
  const fixedAiWork = aiValidWork.map(e => {
    // If jobTitle looks like a company (all caps short word) and company looks like a role, swap
    const titleIsAllCaps = e.jobTitle === e.jobTitle.toUpperCase() && e.jobTitle.length < 20 && !/\s{2,}/.test(e.jobTitle);
    const companyIsRole = /intern|developer|engineer|analyst|manager|designer|program/i.test(e.company);
    if (titleIsAllCaps && companyIsRole) {
      return { ...e, company: e.jobTitle, jobTitle: e.company };
    }
    return e;
  });
  const workExperiences = fixedAiWork.length > 0 ? fixedAiWork : local.workExperiences;

  // Projects: validate AI projects — reject if they look like word-fragments (name < 3 chars or single word < 4 chars)
  const aiValidProjects = (ai.projects || []).filter(p =>
    p.name && p.name.trim().length >= 4 && p.name.trim().split(/\s+/).length >= 1 &&
    !/^(a|an|the|and|or|of|in|at|to|for|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|may|might|shall|can|need|dare|ought|used)$/i.test(p.name.trim())
  );
  const projects = aiValidProjects.length > 0 ? aiValidProjects : (local.projects || []);

  // Skills: merge AI + local, deduplicate
  const aiSkills = (ai.skills?.featuredSkills || []).map(s => s.skill).filter(Boolean);
  const localSkills = (local.skills?.featuredSkills || []).map(s => s.skill).filter(Boolean);
  const mergedSkills = [...new Set([...aiSkills, ...localSkills])];

  return {
    profile: {
      name,
      email: ai.profile.email || local.profile.email,
      phone,
      location: ai.profile.location || local.profile.location,
      url: local.profile.url || '',
    },
    skills: { featuredSkills: mergedSkills.map(s => ({ skill: s })) },
    workExperiences,
    educations,
    projects,
    summary: ai.summary?.trim() || local.summary || '',
    competitions: ai.competitions?.length ? ai.competitions : (local.competitions || []),
    certifications: ai.certifications?.length ? ai.certifications : (local.certifications || []),
    softSkills: ai.softSkills?.length ? ai.softSkills : (local.softSkills || []),
    tools: ai.tools?.length ? ai.tools : (local.tools || []),
  };
}

export type AIParseStatus = 'ai' | 'local' | 'ai_empty' | 'ai_error';

export async function parseResumeFromText(
  text: string,
  onStatus?: (status: AIParseStatus, detail?: string) => void
): Promise<ParsedResume> {
  // LOCAL PARSER IS PRIMARY — always run first, result is the baseline
  const localResult = parseResumeLocally(text);

  try {
    const textHash = await hashText(text);
    const cKey = cacheKey('resume-parse-v13', textHash);
    const cached = getCached<ParsedResume>(cKey);
    if (cached) { onStatus?.('ai'); return cached; }

    const token = tokenStorage.getAccess();
    const truncatedText = text.length > 8000 ? text.slice(0, 8000) : text;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(`${API_BASE_URL}/resume/parse-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        resumeText: truncatedText,
        instructions: 'Extract resume data as strict JSON. Keys: name (full name, no letter-spacing), email, phone (full digits), location, summary, skills[], workExperiences[{jobTitle,company,date,descriptions[]}], educations[{degree,school,date,gpa}], projects[{name,descriptions[]}]. Project name must be 3+ words. Never split sentences into separate projects.',
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) { onStatus?.('ai_error', `API ${res.status}`); return localResult; }

    const json = await res.json();
    const raw = json.profileData || json.data?.profileData || json.data || json;

    const p = raw.personal_info
      ? {
          name: raw.personal_info.name || '',
          email: raw.personal_info.email || '',
          phone: raw.personal_info.phone || '',
          location: raw.personal_info.location || '',
          summary: raw.summary || '',
          skills: [...(raw.skills?.technical || []), ...(raw.skills?.frameworks || [])],
          softSkills: raw.skills?.soft || [],
          tools: raw.skills?.tools || [],
          workExperiences: (raw.experience || []).map((e: any) => ({
            jobTitle: e.title || e.jobTitle || '',
            company: e.company || '',
            date: e.start_date ? `${e.start_date} - ${e.end_date || 'Present'}` : (e.date || ''),
            descriptions: Array.isArray(e.descriptions) ? e.descriptions : (e.description ? [e.description] : []),
          })),
          educations: (raw.education || raw.educations || []).map((e: any) => ({
            degree: e.degree || e.field_of_study || '',
            school: e.institution || e.school || e.college || '',
            date: e.end_date || e.year || e.date || '',
            gpa: e.gpa || e.cgpa || e.percentage || '',
          })),
          projects: raw.projects || [],
          certifications: (raw.certifications || []).map((c: any) => ({ name: c.name || '', provider: c.issuer || c.provider || '', date: String(c.year || c.date || '') })),
          competitions: raw.competitions || [],
        }
      : {
          ...raw,
          educations: (raw.educations || raw.education || []).map((e: any) => ({
            degree: e.degree || '',
            school: e.school || e.institution || e.college || '',
            date: e.date || e.end_date || '',
            gpa: e.gpa || e.cgpa || '',
          })),
        };

    if (!p || typeof p !== 'object') { onStatus?.('ai_empty', 'Bad AI response'); return localResult; }

    // Validate AI name — reject spaced-out ("A J A Y") or too short
    const aiNameClean = (p.name || '').trim();
    const aiNameValid = aiNameClean.length >= 4 && !/^([A-Za-z]\s){3,}/.test(aiNameClean);

    // Validate AI phone — must have 7+ digits
    const aiPhoneDigits = (p.phone || '').replace(/\D/g, '');
    const aiPhoneValid = aiPhoneDigits.length >= 7;

    // Validate AI work — filter garbage company/jobTitle
    const isGarbage = (s: string) => !s || /^https?:\/\/|^www\./i.test(s) || /^\d{5,}/.test(s) || SKILL_ONLY_PATTERN.test(s);
    const aiWork = (p.workExperiences || p.experience || []).map((e: any) => ({
      jobTitle: e.jobTitle || e.title || '',
      company: e.company || e.companyName || '',
      date: e.date || '',
      descriptions: Array.isArray(e.descriptions) ? e.descriptions : (e.description ? [e.description] : []),
    })).filter((e: any) => !isGarbage(e.company) && !isGarbage(e.jobTitle));

    // Fix swapped company/jobTitle
    const fixedAiWork = aiWork.map((e: any) => {
      const titleAllCaps = e.jobTitle === e.jobTitle.toUpperCase() && e.jobTitle.length < 20;
      const companyIsRole = /intern|developer|engineer|analyst|manager|designer|program/i.test(e.company);
      return (titleAllCaps && companyIsRole) ? { ...e, company: e.jobTitle, jobTitle: e.company } : e;
    });

    // Validate AI projects — reject word-fragments
    const aiProjects = (p.projects || []).map((pr: any) => ({
      name: pr.name || pr.projectName || '',
      description: pr.description || '',
      descriptions: pr.descriptions || [],
    })).filter((pr: any) => pr.name.trim().split(/\s+/).length >= 2 && pr.name.trim().length >= 5);

    // Validate AI education — must have school or degree with real keywords
    const aiEdu = (p.educations || []).map((e: any) => ({
      degree: e.degree || '',
      school: e.school || e.institution || '',
      date: e.date || '',
      gpa: e.gpa || '',
      descriptions: e.descriptions || [],
    })).filter((e: any) =>
      INSTITUTION_KEYWORDS.test(e.school) || DEGREE_KEYWORDS.test(e.school) ||
      INSTITUTION_KEYWORDS.test(e.degree) || DEGREE_KEYWORDS.test(e.degree)
    );

    // BUILD FINAL RESULT: local is primary, AI fills gaps only
    const cleanLocalEdu = localResult.educations.filter(e =>
      INSTITUTION_KEYWORDS.test(e.school) || DEGREE_KEYWORDS.test(e.school) ||
      INSTITUTION_KEYWORDS.test(e.degree) || DEGREE_KEYWORDS.test(e.degree)
    );

    const merged: ParsedResume = {
      profile: {
        name: aiNameValid ? aiNameClean : localResult.profile.name,
        email: p.email || localResult.profile.email,
        phone: aiPhoneValid ? p.phone : localResult.profile.phone,
        location: p.location || localResult.profile.location,
        url: localResult.profile.url || '',
      },
      skills: {
        featuredSkills: [...new Set([
          ...(p.skills || []).map((s: any) => typeof s === 'string' ? s : s?.skill || '').filter(Boolean),
          ...localResult.skills.featuredSkills.map(s => s.skill),
        ])].map(s => ({ skill: s })),
      },
      // Work: use AI if valid, else local
      workExperiences: fixedAiWork.length > 0 ? fixedAiWork : localResult.workExperiences,
      // Education: local first, AI fallback
      educations: cleanLocalEdu.length > 0 ? cleanLocalEdu : aiEdu,
      // Projects: AI if valid (2+ word names), else local
      projects: aiProjects.length > 0 ? aiProjects : (localResult.projects || []),
      summary: (p.summary || '').trim() || localResult.summary || '',
      competitions: p.competitions?.length ? p.competitions : (localResult.competitions || []),
      certifications: p.certifications?.length
        ? p.certifications.map((c: any) => ({ name: c.name || '', provider: c.provider || '', date: c.date || '' }))
        : (localResult.certifications || []),
      softSkills: p.softSkills?.length ? p.softSkills : (localResult.softSkills || []),
      tools: p.tools?.length ? p.tools : (localResult.tools || []),
    };

    setCached(cKey, merged, RESUME_CACHE_TTL);
    onStatus?.('ai');
    return merged;
  } catch (e: any) {
    const isTimeout = e?.name === 'AbortError';
    onStatus?.('ai_error', isTimeout ? 'AI timeout — using local parser' : (e?.message || 'Network error'));
    return localResult;
  }
}
