const DEFAULT: Record<string, string> = {
  title: 'Enter your job title',
  company: 'Enter your company name',
  degree: 'Enter your degree',
  institution: 'Enter your institution name',
  projectName: 'Enter your project name',
  role: 'Enter your role',
  skill: 'Enter a skill',
  summary: 'Write your professional summary',
  achievement: 'Describe your achievement and its impact',
  certName: 'Enter certification name',
  issuer: 'Enter issuing organization',
  language: 'Enter a language',
  awardTitle: 'Enter award title',
};

export function ph(_goal: string | undefined, field: string): string {
  return DEFAULT[field] || '';
}