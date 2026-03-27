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

// Regex-based fallback parser when AI backend fails
function parseResumeLocally(text: string): ParsedResume {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(\+?\d[\d\s\-().]{7,}\d)/);

  // Name: first non-empty line that isn't an email/phone/url
  const name = lines.find(l =>
    !l.match(/[@\d{4}http]/) && l.length > 2 && l.length < 60
  ) || '';

  // Skills: look for lines after "SKILLS" heading
  const skillsIdx = lines.findIndex(l => /^skills$/i.test(l));
  const rawSkillsBlock = skillsIdx >= 0 ? lines.slice(skillsIdx + 1, skillsIdx + 6).join(' ') : '';
  const skills = rawSkillsBlock
    .split(/[,|•\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 1 && s.length < 40);

  // Experience: lines after "EXPERIENCE" or "WORK"
  const expIdx = lines.findIndex(l => /experience|work history/i.test(l));
  const workExperiences = expIdx >= 0 ? [{
    jobTitle: lines[expIdx + 1] || '',
    company: lines[expIdx + 2] || '',
    date: lines[expIdx + 3] || '',
    descriptions: lines.slice(expIdx + 4, expIdx + 8).filter(l => l.startsWith('•') || l.startsWith('-')),
  }] : [];

  // Education: lines after "EDUCATION"
  const eduIdx = lines.findIndex(l => /^education$/i.test(l));
  const educations = eduIdx >= 0 ? [{
    degree: lines[eduIdx + 1] || '',
    school: lines[eduIdx + 2] || '',
    date: lines[eduIdx + 3] || '',
  }] : [];

  return {
    profile: { name, email: emailMatch?.[0] || '', phone: phoneMatch?.[1] || '', location: '' },
    skills: { featuredSkills: skills.map(s => ({ skill: s })) },
    workExperiences,
    educations,
  };
}

export async function parseResumeFromText(text: string): Promise<ParsedResume> {
  try {
    const res = await fetch(`${API_BASE_URL}/resume/parse-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText: text }),
    });

    if (!res.ok) {
      console.warn(`parse-profile API returned ${res.status}, falling back to local parser`);
      return parseResumeLocally(text);
    }

    const json = await res.json();
    console.log('parse-profile raw response:', JSON.stringify(json));

    // Handle different response shapes from backend
    const p = json.profileData || json.data || json;

    // If AI returned empty critical fields, fall back to local parser
    if (!p.name && !p.skills?.length && !p.workExperiences?.length) {
      console.warn('AI returned empty profile, falling back to local parser');
      return parseResumeLocally(text);
    }

    return {
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
      summary: p.summary || '',
    };
  } catch (e) {
    console.warn('parse-profile API failed, falling back to local parser:', e);
    return parseResumeLocally(text);
  }
}
