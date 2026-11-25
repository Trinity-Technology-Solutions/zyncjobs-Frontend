import { decodeHtmlEntities } from './textUtils';

const sectionHeaders: Record<string, string> = {
  'job summary': 'summary', 'job overview': 'summary', 'overview': 'summary',
  'about the role': 'summary', 'role overview': 'summary',
  'what you will do': 'responsibilities',
  'key responsibilities': 'responsibilities', 'responsibilities': 'responsibilities',
  'role & responsibilities': 'responsibilities', 'role and responsibilities': 'responsibilities',
  'what we are looking for': 'requirements',
  'requirements': 'requirements', 'mandatory skills': 'requirements',
  'required skills': 'requirements', 'required skills & qualifications': 'requirements', 'required skills and qualifications': 'requirements', 'qualifications': 'requirements',
  'technical skills & expertise': 'skills',
  'key skill sets': 'skills',
  'what makes you stand out': 'competencies',
  'behavioral competencies': 'competencies',
  'experience & education': 'expEdu',
  'experience': 'expEdu', 'education': 'expEdu', 'employment type': 'expEdu',
  'compensation & benefits': 'benefits',
  'what we offer': 'benefits', 'benefits': 'benefits',
  'good to have': 'goodtohave', 'nice to have': 'goodtohave', 'preferred skills': 'goodtohave', 'preferred qualifications': 'goodtohave',
  'eligibility criteria': 'eligibility', 'eligibility': 'eligibility',
  'about the company': 'about', 'about us': 'about',
  'how to apply': 'apply', 'application instructions': 'apply',
};

function descriptionLines(value: string): string[] {
  return decodeHtmlEntities(value)
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<li\b[^>]*>/gi, '\n- ')
    .replace(/<\/?(?:ul|ol|p|div|h[1-6]|li)\b[^>]*>|<br\b[^>]*>/gi, '\n')
    .replace(/<\/?[a-z][\w-]*(?:\s[^<>]*)?\s*\/?>/gi, '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

export function getJobDescriptionSections(description: string): Record<string, string[]> {
  const sections: Record<string, string[]> = {};
  let current = 'summary';
  for (const raw of descriptionLines(description)) {
    const line = raw.replace(/^#{1,6}\s+/, '').replace(/\*\*([^*]+)\*\*/g, '$1');
    const colon = line.indexOf(':');
    const heading = (colon < 0 ? line : line.slice(0, colon)).trim().toLowerCase();
    if (Object.prototype.hasOwnProperty.call(sectionHeaders, heading)) {
      current = sectionHeaders[heading];
      const content = colon < 0 ? '' : line.slice(colon + 1).trim();
      if (content) (sections[current] ??= []).push(content);
      continue;
    }
    (sections[current] ??= []).push(line);
  }
  return sections;
}

export function localizeApplyInstructions(line: string): string {
  return line.replace(/\[[^\]]+\]\(https?:\/\/(?:www\.)?zyncjobs\.com\/?\)/gi, 'zyncjobs.com').replace(
    /\bapply\s+(?:through|via|on|at)\s+(?:ZyncJobs\s+(?:at|on)\s+)?(?:https?:\/\/)?(?:www\.)?zyncjobs\.com\/?(?=\s|[.,;!?](?!\w)|$)|\bapply\s+(?:through|via|on)\s+ZyncJobs\b(?!\.[a-z]|\s+(?:at|on)\s+)/gi,
    match => `${match.startsWith('A') ? 'Apply' : 'apply'} directly from this listing`,
  );
}

export function getJobBenefitItems(benefits: unknown): string[] {
  const raw = Array.isArray(benefits)
    ? benefits.filter((item): item is string => typeof item === 'string').join('\n')
    : typeof benefits === 'string' ? benefits : '';
  if (!raw.trim()) return [];
  const sections = getJobDescriptionSections(raw);
  const lines = sections.benefits ?? sections.summary ?? [];
  const items = !Array.isArray(benefits) && !/[<\n]/.test(decodeHtmlEntities(raw)) && lines.length === 1
    ? lines[0].split(',')
    : lines;
  return [...new Set(items.map(item => item.replace(/^[-??*]\s+/, '').trim()).filter(Boolean))];
}
