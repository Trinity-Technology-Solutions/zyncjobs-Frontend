export interface ParsedResume {
  profile: { name: string; email: string; phone: string; location: string };
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
  // Reject lines that look like headings (all caps short words) or contain special chars
  if (/[@|•\-_=*#/\\]/.test(l)) return false;
  if (/\d{4}/.test(l)) return false; // contains year
  if (/^(http|www)/i.test(l)) return false;
  // A name should have at least one letter and look like words
  if (!/[a-zA-Z]/.test(l)) return false;
  // Reject if it's a single ALL-CAPS word that's a common heading
  if (/^[A-Z\s]+$/.test(l) && l.split(' ').length <= 2 && l.length < 20) return false;
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

  // Name: first line that looks like a real name (not a heading)
  const name = lines.find(isLikelyName) || '';

  // --- Skills ---
  const skillsSection = extractSection(lines, /^(technical\s+)?skills?$/i);
  const skillsText = skillsSection.join(' ');
  const skills = skillsText
    .split(/[,|•\n\/]/)
    .map(s => s.replace(/^\s*[-–]\s*/, '').trim())
    .filter(s => s.length > 1 && s.length < 50 && /[a-zA-Z]/.test(s));

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
    let currentEdu: { degree: string; school: string; date: string } | null = null;
    for (const line of eduSection) {
      if (yearPattern.test(line)) {
        if (currentEdu) educations.push(currentEdu);
        currentEdu = { degree: '', school: '', date: line.match(yearPattern)?.[0] || line };
      } else if (currentEdu) {
        if (!currentEdu.degree) currentEdu.degree = line;
        else if (!currentEdu.school) currentEdu.school = line;
      } else {
        currentEdu = { degree: line, school: '', date: '' };
      }
    }
    if (currentEdu && (currentEdu.degree || currentEdu.school)) educations.push(currentEdu);
  }

  // --- Projects ---
  const projSection = extractSection(lines, /^(personal\s+|academic\s+)?projects?$/i);
  const projects: { name: string; description: string }[] = [];
  if (projSection.length > 0) {
    let currentProj: { name: string; description: string } | null = null;
    for (const line of projSection) {
      if (line.length < 80 && !/^[•\-–]/.test(line) && (!currentProj || currentProj.description)) {
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

export async function parseResumeFromText(text: string): Promise<ParsedResume> {
  // Always run local parser as baseline
  const localResult = parseResumeLocally(text);

  try {
    const token = tokenStorage.getAccess();
    const res = await fetch(`${API_BASE_URL}/resume/parse-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ resumeText: text }),
    });

    if (!res.ok) {
      console.warn(`parse-profile API returned ${res.status}, using local parser`);
      return localResult;
    }

    const json = await res.json();
    console.log('parse-profile raw response:', JSON.stringify(json));

    const p = json.profileData || json.data || json;

    // If AI returned nothing at all, use local
    if (!p || (!p.name && !p.email && !p.skills?.length)) {
      console.warn('AI returned empty profile, using local parser');
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
        featuredSkills: (p.skills || []).map((s: string) => ({ skill: s })),
      },
      workExperiences: (p.workExperiences || []).map((e: any) => ({
        jobTitle: e.jobTitle || '',
        company: e.company || '',
        date: e.date || '',
        descriptions: Array.isArray(e.descriptions) ? e.descriptions : [],
      })),
      educations: (p.educations || []).map((e: any) => ({
        degree: e.degree || '',
        school: e.school || '',
        date: e.date || '',
      })),
      projects: (p.projects || []).map((pr: any) => ({
        name: pr.name || '',
        description: pr.description || '',
      })),
      competitions: p.competitions || [],
      certifications: (p.certifications || []).map((c: any) => ({
        name: c.name || '',
        provider: c.provider || '',
        date: c.date || '',
      })),
      softSkills: p.softSkills || [],
      tools: p.tools || [],
      summary: p.summary || p.profileSummary || '',
    };

    // Merge: AI fills what it can, local fills the gaps
    return mergeResults(aiResult, localResult, text);
  } catch (e) {
    console.warn('parse-profile API failed, using local parser:', e);
    return localResult;
  }
}
