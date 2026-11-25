const preferredHeading = /^(?:preferred(?: skills| qualifications)?|good to have(?: skills)?|nice to have(?: skills)?|optional skills|bonus skills)$/i;
const sectionHeading = /^(?:about.+|job overview|responsibilities|key responsibilities|required skills(?: and qualifications)?|required qualifications|requirements|qualifications|eligibility(?: criteria)?|compensation(?: and benefits)?|benefits|what we offer|how to apply|application instructions)$/i;
const nonSkill = /\b(?:freshers?|fresh graduates?|entry level|graduates? (?:are )?welcome|no experience required|academic projects?|internship(?:s| experience)?|work authorization|visa sponsorship|years? of experience|degree|mba|salary|apply)\b/i;
const normalize = (value: string) => value.toLowerCase().replace(/&/g, ' and ').replace(/[^\p{L}\p{N}+#]+/gu, ' ').trim();
const skillIntro = /^(?:(?:basic|good|working|strong)\s+)?(?:knowledge\s+of|familiarity\s+with|understanding\s+of|experience\s+(?:with|in|using)|proficiency\s+(?:with|in))\s*/i;

function cleanSkill(value: string): string {
  return value
    .trim()
    .replace(/^(?:[-*•–]\s+|\d+[.)]\s+)/, '')
    .replace(skillIntro, '')
    .replace(/^(?:good|strong|basic)\s+(?=\w)/i, '')
    .replace(/\s+(?:(?:is|would be)\s+(?:a plus|an (?:added )?advantage|preferred))\b[.!]?$/i, '')
    .replace(/[.!;:]+$/, '')
    .trim()
    .replace(/\s+/g, ' ');
}

const knownSkills = [
  ['Digital Marketing', /\bdigital marketing\b/i],
  ['Social Media', /\bsocial media\b/i],
  ['Business Development', /\bbusiness development\b/i],
  ['Market Research', /\bmarket research\b/i],
  ['Communication', /\bcommunication\b/i],
  ['Presentation Skills', /\bpresentation(?: skills\b|,)/i],
  ['Problem Solving', /\bproblem[ -]solving\b/i],
  ['Lead Generation', /\blead generation\b/i],
  ['Excel', /\b(?:microsoft )?excel\b/i],
  ['Microsoft Word', /\b(?:microsoft word|excel,\s*word|word and powerpoint)\b/i],
  ['PowerPoint', /\bpowerpoint\b/i],
  ['Canva', /\bcanva\b/i],
  ['Digital Advertising', /\bdigital advertising\b/i],
  ['Branding', /\bbranding\b/i],
] as const;

function skillEvidence(description: string) {
  const required: string[] = [];
  const preferred: string[] = [];
  let target = required;
  for (const line of description.split(/\r?\n/)) {
    const heading = normalize(line.replace(/^\s*#{1,6}\s+/, ''));
    if (preferredHeading.test(heading)) target = preferred;
    else if (sectionHeading.test(heading)) target = required;
    else if (/\b(?:nice to have|is a plus|is an added advantage|would be an advantage)\b/i.test(line)) preferred.push(line);
    else target.push(line);
  }
  return { required: required.join('\n'), preferred: preferred.join('\n') };
}

export function importJobSkills(description: string, candidates: unknown[], preference: 'required' | 'preferred'): string[] {
  const evidence = skillEvidence(description)[preference];
  const source = ` ${normalize(evidence)} `;
  const skills = new Map<string, string>();
  for (const [name, pattern] of knownSkills) {
    if (pattern.test(evidence)) skills.set(normalize(name), name);
  }
  const preferredLines = preference === 'preferred' ? evidence.split('\n') : [];
  for (const candidate of [...preferredLines, ...candidates]) {
    if (typeof candidate !== 'string') continue;
    const skill = cleanSkill(candidate);
    const key = normalize(skill).replace(/^microsoft excel$/, 'excel').replace(/^social media (?:marketing|platforms)$/, 'social media');
    if (key.length < 2 || skill.length > 70 || nonSkill.test(key)
      || /\b(?:and|or|of|with|in|for|to|using)$/.test(key)
      || /\b(?:familiarity|knowledge|understanding|experience|proficiency)$/.test(key)
      || !source.includes(` ${key} `)) continue;
    if ([...skills.keys()].some(existing => ` ${existing} `.includes(` ${key} `))) continue;
    if (!skills.has(key)) skills.set(key, skill);
  }
  return [...skills.values()].slice(0, preference === 'required' ? 15 : 10);
}
