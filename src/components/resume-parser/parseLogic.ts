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

export async function parseResumeFromText(text: string): Promise<ParsedResume> {
  const res = await fetch(`${API_BASE_URL}/resume/parse-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText: text }),
  });

  if (!res.ok) throw new Error('Failed to parse resume. Please try again.');

  const { profileData: p } = await res.json();

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
}
