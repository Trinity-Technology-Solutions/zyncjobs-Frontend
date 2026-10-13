import type { ResumeData } from '../store/useResumeStore';

function cleanText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\u00e2\u20ac[\u201c\u201d\u0093\u0094]/g, '-')
    .replace(/\u00e2\u20ac\u00a2|\u2022/g, '-')
    .replace(/\u00c2\u00b7|\u00b7/g, '|')
    .replace(/\u00e2\u20ac\u2122|\u2019/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\uFFFD/g, '')
    .trim();
}

const hasText = (...values: unknown[]) => values.some(value => cleanText(value).length > 0);
const cleanBullet = (value: unknown) => cleanText(value)
  .replace(/^[\s>*\u2022-]+/, '')
  .replace(/\s+(?:INTERNSHIP EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE)\s*$/i, '')
  .trim();

export function prepareResumeContent(data: ResumeData): ResumeData {
  const cleanArray = <T extends Record<string, any>>(items: T[] | undefined, keys: string[]) =>
    (items || []).map(item => Object.fromEntries(
      Object.entries(item).map(([key, value]) => [key, typeof value === 'string' ? cleanText(value) : value]),
    ) as T).filter(item => hasText(...keys.map(key => item[key])));

  return {
    ...data,
    personalInfo: Object.fromEntries(
      Object.entries(data.personalInfo || {}).map(([key, value]) => [key, cleanText(value)]),
    ) as ResumeData['personalInfo'],
    summary: Array.isArray(data.summary) ? data.summary.map(cleanText).filter(Boolean).join(' ') : cleanText(data.summary),
    skills: [...new Map((data.skills || []).map(cleanText).filter(Boolean).map(skill => [skill.toLocaleLowerCase(), skill])).values()],
    experience: cleanArray(data.experience, ['title', 'company', 'location', 'duration', 'bullets']).map(item => ({
      ...item,
      bullets: (item.bullets || []).map(cleanBullet).filter(Boolean),
    })),
    education: cleanArray(data.education, ['institution', 'degree', 'fieldOfStudy', 'board', 'duration', 'grade', 'description']),
    certifications: cleanArray(data.certifications, ['name', 'issuer', 'year']),
    awards: cleanArray(data.awards, ['title', 'issuer', 'year', 'description']),
    projects: cleanArray(data.projects, ['name', 'role', 'duration', 'url', 'bullets']).map(item => ({
      ...item,
      bullets: (item.bullets || []).map(cleanBullet).filter(Boolean),
    })),
    languages: cleanArray(data.languages, ['language', 'proficiency']),
    achievements: cleanArray(data.achievements, ['title', 'description']),
    customSections: (data.customSections || []).map(section => ({
      ...section,
      heading: cleanText(section.heading),
      content: cleanText(section.content),
    })).filter(section => hasText(section.heading, section.content)),
  };
}
