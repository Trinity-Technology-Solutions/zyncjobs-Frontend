export interface ParsedResume {
  profile: {
    name: string;
    email: string;
    phone: string;
    location: string;
    address?: {
      city: string;
      state: string;
      country: string;
      postal_code: string;
      full_address: string;
    };
  };
  skills: { featuredSkills: { skill: string }[] };
  workExperiences: { jobTitle: string; company: string; date: string; descriptions: string[] }[];
  educations: { degree: string; school: string; date: string }[];
  projects?: { name: string; description: string }[];
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

// Common resume section headings — never treat these as a person's name
const SECTION_HEADINGS = new Set([
  'about me', 'about', 'summary', 'objective', 'profile', 'overview',
  'experience', 'work experience', 'employment', 'work history', 'professional experience',
  'education', 'academic background', 'qualifications',
  'skills', 'technical skills', 'key skills', 'core competencies', 'competencies',
  'projects', 'personal projects', 'academic projects',
  'certifications', 'certificates', 'awards', 'achievements', 'accomplishments',
  'languages', 'interests', 'hobbies', 'references', 'contact', 'contact information',
  'internships', 'training', 'volunteer', 'publications', 'research',
]);

function isLikelyName(line: string): boolean {
  const l = line.trim();
  if (!l || l.length < 2 || l.length > 60) return false;
  if (SECTION_HEADINGS.has(l.toLowerCase())) return false;
  if (/[@|•\-_=*#/\\]/.test(l)) return false;
  if (/\d{4}/.test(l)) return false;
  if (/^(http|www)/i.test(l)) return false;
  if (!/[a-zA-Z]/.test(l)) return false;
  // Must look like a name: 1-4 words, each starting with capital or all-caps
  const words = l.split(/\s+/);
  if (words.length < 1 || words.length > 4) return false;
  // Each word should be capitalised (proper name) or all-caps short word
  const allWordsCapitalised = words.every(w => /^[A-Z][a-zA-Z]*$/.test(w) || /^[A-Z]+$/.test(w));
  if (!allWordsCapitalised) return false;
  // Reject common single-word all-caps section headings
  if (words.length <= 2 && /^[A-Z\s]+$/.test(l) && l.length < 15) {
    // Allow only if it looks like a real name (has both first + last name feel)
    if (words.length < 2) return false;
  }
  return true;
}

// Extract text block between two section headings
function extractSection(lines: string[], headingPattern: RegExp): string[] {
  const startIdx = lines.findIndex(l => headingPattern.test(l.trim()));
  if (startIdx < 0) return [];
  const nextHeadingPattern = /^(experience|work|education|skills|projects|certifications|awards|languages|interests|references|contact|internship|training|summary|objective|profile|about)/i;
  const result: string[] = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (i !== startIdx + 1 && nextHeadingPattern.test(lines[i].trim()) && lines[i].trim().length < 30) break;
    if (lines[i].trim()) result.push(lines[i].trim());
  }
  return result;
}

function parseResumeLocally(text: string): ParsedResume {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(\+?[\d][\d\s\-(). ]{7,}\d)/);
  const locationMatch = text.match(/\b(Chennai|Mumbai|Delhi|Bangalore|Hyderabad|Pune|Kolkata|Ahmedabad|Jaipur|Surat|[A-Z][a-z]+,\s*[A-Z]{2})\b/);

  // Name: search only in first 10 lines to avoid picking up section body text
  const name = lines.slice(0, 10).find(isLikelyName) || '';

  // --- Skills --- (match various heading forms: "Skills", "Key Skills", "Technical Skills", etc.)
  const skillsSection = extractSection(lines, /^(key\s+|technical\s+|core\s+|hard\s+)?skills?$/i);
  const skillsText = skillsSection.join(' ');
  const skills = skillsText
    .split(/[,|•\n\/]/)
    .map(s => s.replace(/^\s*[-–]\s*/, '').trim())
    .filter(s => s.length > 1 && s.length < 50 && /[a-zA-Z]/.test(s) && !SECTION_HEADINGS.has(s.toLowerCase()));

  // --- Work Experience ---
  const expSection = extractSection(lines, /^(work\s+)?(experience|employment|history|professional\s+experience)$/i);
  const workExperiences: ParsedResume['workExperiences'] = [];
  if (expSection.length > 0) {
    // Try to parse multiple entries: look for date patterns as entry boundaries
    const datePattern = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4}|present|current)/i;
    let currentEntry: { jobTitle: string; company: string; date: string; descriptions: string[] } | null = null;
    for (const line of expSection) {
      if (datePattern.test(line) && line.length < 60) {
        if (currentEntry) workExperiences.push(currentEntry);
        // This line is likely a date range — look back for title/company
        currentEntry = { jobTitle: '', company: '', date: line, descriptions: [] };
      } else if (currentEntry) {
        if (!currentEntry.jobTitle && line.length < 80) currentEntry.jobTitle = line;
        else if (!currentEntry.company && line.length < 80) currentEntry.company = line;
        else if (line.startsWith('•') || line.startsWith('-') || line.startsWith('–')) {
          currentEntry.descriptions.push(line.replace(/^[•\-–]\s*/, ''));
        }
      } else {
        // No date found yet — treat first lines as title/company
        if (workExperiences.length === 0) {
          currentEntry = { jobTitle: line, company: '', date: '', descriptions: [] };
        }
      }
    }
    if (currentEntry && (currentEntry.jobTitle || currentEntry.company)) workExperiences.push(currentEntry);
  }

  // --- Education ---
  const eduSection = extractSection(lines, /^education(al\s+background)?$/i);
  const educations: ParsedResume['educations'] = [];
  if (eduSection.length > 0) {
    const yearPattern = /\b(19|20)\d{2}\b/;
    // Group lines into entries: an entry starts with a school/degree line (non-year, length > 10)
    // and ends before the next school-like line or year-only line
    let currentEdu: { degree: string; school: string; date: string } | null = null;
    for (const line of eduSection) {
      const hasYear = yearPattern.test(line);
      const isYearOnly = /^\s*(19|20)\d{2}\s*$/.test(line);
      if (isYearOnly) {
        // Bare year line — attach to current entry as date
        if (currentEdu && !currentEdu.date) currentEdu.date = line.trim();
        continue;
      }
      if (!currentEdu) {
        // First line of a new entry
        currentEdu = { degree: '', school: line, date: hasYear ? (line.match(yearPattern)?.[0] || '') : '' };
      } else if (!currentEdu.degree && line.length > 5) {
        // Second line = degree/course info
        currentEdu.degree = line.replace(yearPattern, '').trim();
        if (hasYear && !currentEdu.date) currentEdu.date = line.match(yearPattern)?.[0] || '';
      } else if (line.length > 10 && !hasYear) {
        // Looks like a new school entry
        if (currentEdu.school || currentEdu.degree) educations.push(currentEdu);
        currentEdu = { degree: '', school: line, date: '' };
      } else if (hasYear && !currentEdu.date) {
        currentEdu.date = line.match(yearPattern)?.[0] || '';
      }
    }
    if (currentEdu && (currentEdu.school || currentEdu.degree)) educations.push(currentEdu);
  }

  // --- Projects ---
  const projSection = extractSection(lines, /^(personal\s+|academic\s+)?projects?$/i);
  const projects: { name: string; description: string }[] = [];
  if (projSection.length > 0) {
    let currentProj: { name: string; description: string } | null = null;
    for (const line of projSection) {
      const isBullet = /^[•\-–]/.test(line);
      // A project name: not a bullet, not too long, doesn't look like a description sentence
      const looksLikeName = !isBullet && line.length < 100 && line.length > 3
        && !/^(developed|built|created|analyzed|implemented|designed|completed|worked|gained)/i.test(line)
        && (!currentProj || currentProj.description.length > 0);
      if (looksLikeName) {
        if (currentProj) projects.push(currentProj);
        currentProj = { name: line, description: '' };
      } else if (currentProj) {
        currentProj.description += (currentProj.description ? ' ' : '') + line.replace(/^[•\-–]\s*/, '');
      }
    }
    if (currentProj) projects.push(currentProj);
  }

  // --- Summary ---
  const summarySection = extractSection(lines, /^(summary|objective|profile|about(\s+me)?)$/i);
  const summary = summarySection.join(' ').trim();

  return {
    profile: {
      name,
      email: emailMatch?.[0] || '',
      phone: phoneMatch?.[1]?.trim() || '',
      location: locationMatch?.[1] || '',
    },
    skills: { featuredSkills: skills.map(s => ({ skill: s })) },
    workExperiences,
    educations,
    projects,
    summary,
    competitions: [],
    certifications: [],
    softSkills: [],
    tools: [],
  };
}

// Merge AI result with local parser — use local values when AI fields are empty/wrong
function mergeResults(ai: ParsedResume, local: ParsedResume, rawText: string): ParsedResume {
  // Fix bad AI name (section headings, all-caps single words, etc.)
  const aiName = ai.profile.name;
  const cleanName = isLikelyName(aiName) ? aiName : (local.profile.name || '');

  // For arrays: use AI if non-empty, else use local
  const workExperiences = ai.workExperiences.length > 0 ? ai.workExperiences : local.workExperiences;
  const educations = ai.educations.length > 0 ? ai.educations : local.educations;
  const projects = (ai.projects?.length ?? 0) > 0 ? ai.projects! : (local.projects || []);
  const skills = ai.skills.featuredSkills.length > 0 ? ai.skills.featuredSkills : local.skills.featuredSkills;

  // For strings: use AI if non-empty, else local
  const summary = ai.summary?.trim() || local.summary || '';
  const location = ai.profile.location || local.profile.location;
  const phone = ai.profile.phone || local.profile.phone;
  const email = ai.profile.email || local.profile.email;

  return {
    profile: { name: cleanName, email, phone, location },
    skills: { featuredSkills: skills },
    workExperiences,
    educations,
    projects,
    summary,
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
  const localResult = parseResumeLocally(text);

  try {
    const textHash = await hashText(text);
    const cKey = cacheKey('resume-parse', textHash);
    const cached = getCached<ParsedResume>(cKey);
    if (cached) { onStatus?.('ai'); return cached; }

    const token = tokenStorage.getAccess();
    const truncatedText = text.length > 3000 ? text.slice(0, 3000) : text;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${API_BASE_URL}/resume/parse-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ resumeText: truncatedText }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      onStatus?.('ai_error', `API ${res.status}: ${errText.slice(0, 120)}`);
      return localResult;
    }

    const json = await res.json();

    // Handle various backend response shapes
    const p = json.profileData || json.data?.profileData || json.data || json;

    if (!p || typeof p !== 'object' || (!p.name && !p.email && !(p.skills?.length > 0) && !p.workExperiences?.length)) {
      onStatus?.('ai_empty', 'AI returned no usable data — using local parser');
      return localResult;
    }

    const aiResult: ParsedResume = {
      profile: {
        name: p.name || '',
        email: p.email || '',
        phone: p.phone || '',
        location: p.location || '',
      },
      skills: {
        featuredSkills: (p.skills || []).map((s: any) => ({ skill: typeof s === 'string' ? s : s?.skill || '' })).filter((s: any) => s.skill),
      },
      workExperiences: (p.workExperiences || p.experience || []).map((e: any) => ({
        jobTitle: e.jobTitle || e.title || '',
        company: e.company || e.companyName || '',
        date: e.date || '',
        descriptions: Array.isArray(e.descriptions) ? e.descriptions : (e.description ? [e.description] : []),
      })),
      educations: (p.educations || p.education || []).map((e: any) => ({
        degree: e.degree || '',
        school: e.school || e.college || '',
        date: e.date || e.endYear || e.passingYear || '',
      })),
      projects: (p.projects || []).map((pr: any) => ({
        name: pr.name || pr.projectName || '',
        description: pr.description || '',
      })),
      competitions: p.competitions || [],
      certifications: (p.certifications || []).map((c: any) => ({
        name: c.name || c.certificationName || '',
        provider: c.provider || '',
        date: c.date || '',
      })),
      softSkills: p.softSkills || [],
      tools: p.tools || [],
      summary: p.summary || p.profileSummary || '',
    };

    const merged = mergeResults(aiResult, localResult, text);
    setCached(cKey, merged, RESUME_CACHE_TTL);
    onStatus?.('ai');
    return merged;
  } catch (e: any) {
    const isTimeout = e?.name === 'AbortError';
    onStatus?.('ai_error', isTimeout ? 'AI timeout — using local parser' : (e?.message || 'Network error'));
    return localResult;
  }
}
