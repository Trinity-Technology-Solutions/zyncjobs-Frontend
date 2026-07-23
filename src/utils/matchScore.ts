// Shared match score computation — used by both job cards and the breakdown modal

export const normalizeSkill = (s: string) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9#+.\s]/g, '');

export const getUserProfile = () => {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
};

// Skill synonym map — common aliases that should count as a match
const SKILL_ALIASES: Record<string, string[]> = {
  'javascript': ['js', 'es6', 'es2015', 'ecmascript', 'vanilla js'],
  'typescript': ['ts'],
  'python': ['py'],
  'react': ['reactjs', 'react.js'],
  'react native': ['rn'],
  'node.js': ['nodejs', 'node'],
  'next.js': ['nextjs', 'next'],
  'vue.js': ['vuejs', 'vue'],
  'angular': ['angularjs'],
  'postgresql': ['postgres', 'psql'],
  'mongodb': ['mongo'],
  'mysql': ['sql'],
  'machine learning': ['ml'],
  'artificial intelligence': ['ai'],
  'amazon web services': ['aws'],
  'google cloud platform': ['gcp'],
  'microsoft azure': ['azure'],
  'kubernetes': ['k8s'],
  'docker': ['containerization'],
  'graphql': ['graph ql'],
  'c++': ['cpp'],
  'c#': ['csharp', 'dotnet', '.net'],
};

// Build reverse alias map
const ALIAS_TO_CANONICAL: Record<string, string> = {};
for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
  for (const alias of aliases) {
    ALIAS_TO_CANONICAL[alias] = canonical;
  }
}

const canonicalize = (skill: string): string => {
  const n = normalizeSkill(skill);
  return ALIAS_TO_CANONICAL[n] || n;
};

// Strict skill match — exact or alias match only, no substring tricks
const skillsMatch = (userSkill: string, jobSkill: string): boolean => {
  const u = canonicalize(userSkill);
  const j = canonicalize(jobSkill);
  if (u === j) return true;
  // Allow exact word boundary match for compound skills (e.g. "react" matches "react.js")
  if (u.length >= 3 && j.length >= 3) {
    // Only match if one is a prefix/suffix of the other AND the shorter one is >= 3 chars
    // AND they share the same root word (not just substring)
    const shorter = u.length < j.length ? u : j;
    const longer = u.length < j.length ? j : u;
    // Must start with the shorter term and next char is non-alpha (e.g. "react" in "react.js")
    const idx = longer.indexOf(shorter);
    if (idx === 0 && (longer.length === shorter.length || /[^a-z0-9]/.test(longer[shorter.length]))) return true;
  }
  return false;
};

export const resolveUserSkills = (profile: any): string[] => {
  // 1. profile.skills array
  const raw = profile.skills || profile.keySkills || profile.resumeSkills || [];
  if (Array.isArray(raw) && raw.length > 0)
    return raw.map((s: any) => (typeof s === 'object' ? (s.skill || s.name || '') : String(s)).trim()).filter(Boolean);

  // 2. resumeData in localStorage
  try {
    const rd = JSON.parse(localStorage.getItem('resumeData') || '{}');
    const rdSkills = rd.skills || rd.keySkills || [];
    if (Array.isArray(rdSkills) && rdSkills.length > 0)
      return rdSkills.map((s: any) => (typeof s === 'object' ? (s.skill || s.name || '') : String(s)).trim()).filter(Boolean);
  } catch {}

  return [];
};

export const computeMatchBreakdown = (job: any) => {
  const profile = getUserProfile();

  // Keep original casing for display, normalize only for comparison
  const jobSkillsRaw: string[] = (Array.isArray(job.skills) ? job.skills : [])
    .map((s: any) => String(s || '').trim()).filter(Boolean);
  const userSkillsRaw: string[] = resolveUserSkills(profile);

  // 1. Skill match (45%) — strict matching
  const matched: string[] = [];
  const missing: string[] = [];

  jobSkillsRaw.forEach(js => {
    const found = userSkillsRaw.some(us => skillsMatch(us, js));
    if (found) matched.push(js);   // original casing for display
    else missing.push(js);          // original casing for display
  });

  const skillScore = jobSkillsRaw.length > 0 ? Math.round((matched.length / jobSkillsRaw.length) * 100) : 0;

  // 2. Role match (20%) — word-level exact match, ignore short words
  const jobTitle = (job.title || job.jobTitle || '').toLowerCase();
  const userTitle = (profile.jobTitle || profile.title || '').toLowerCase();
  let roleScore = 0;
  if (jobTitle && userTitle) {
    const stopWords = new Set(['and', 'the', 'for', 'of', 'in', 'at', 'to', 'a', 'an']);
    const jWords = jobTitle.split(/\s+/).filter((w: string) => w.length > 2 && !stopWords.has(w));
    const uWords = userTitle.split(/\s+/).filter((w: string) => w.length > 2 && !stopWords.has(w));
    if (jWords.length > 0 && uWords.length > 0) {
      const common = jWords.filter((w: string) => uWords.includes(w));
      roleScore = Math.round((common.length / jWords.length) * 100);
    }
  }

  // 3. Experience match (15%)
  const empList = Array.isArray(profile.employment) ? profile.employment
    : (profile.employment && typeof profile.employment === 'object' ? [profile.employment] : []);
  let expYears = 0;
  empList.forEach((e: any) => {
    const start = parseInt(e.startYear || '0');
    const end = e.currentlyWorking ? new Date().getFullYear() : parseInt(e.endYear || '0');
    if (start > 1990 && end >= start) expYears += (end - start);
  });

  const seniorWords = ['senior', 'lead', 'principal', 'staff', 'manager', 'head', 'director'];
  const juniorWords = ['junior', 'fresher', 'entry', 'intern', 'trainee', 'associate'];
  const isSeniorJob = seniorWords.some(w => jobTitle.includes(w));
  const isJuniorJob = juniorWords.some(w => jobTitle.includes(w));
  let experienceScore = 60;
  if (isSeniorJob) experienceScore = expYears >= 5 ? 100 : expYears >= 3 ? 70 : 30;
  else if (isJuniorJob) experienceScore = expYears <= 2 ? 100 : expYears <= 4 ? 70 : 50;
  else experienceScore = expYears >= 1 ? 80 : 50;

  // 4. Location match (10%)
  const jobLoc = (job.location || '').toLowerCase();
  const userLoc = (profile.location || '').toLowerCase();
  let locationScore = 0;
  if (jobLoc && userLoc) {
    if (jobLoc.includes('remote') || userLoc.includes('remote')) locationScore = 100;
    else if (jobLoc.includes(userLoc) || userLoc.includes(jobLoc)) locationScore = 100;
    else {
      // City-level match — check if any word matches
      const jCity = jobLoc.split(/[,\s]+/)[0];
      const uCity = userLoc.split(/[,\s]+/)[0];
      locationScore = (jCity && uCity && jCity === uCity) ? 100 : 0;
    }
  }

  // 5. Education match (10%)
  const eduObj = profile.educationCollege;
  const eduStr = typeof eduObj === 'object'
    ? String(eduObj?.degree || eduObj?.college || '').toLowerCase()
    : String(profile.education || '').toLowerCase();
  let educationScore = 40;
  if (eduStr.includes('phd') || eduStr.includes('doctorate')) educationScore = 100;
  else if (eduStr.includes('master') || eduStr.includes('mba') || eduStr.includes('m.tech') || eduStr.includes('m.e')) educationScore = 90;
  else if (eduStr.includes('bachelor') || eduStr.includes('b.tech') || eduStr.includes('b.e') || eduStr.includes('b.sc') || eduStr.includes('degree')) educationScore = 75;
  else if (eduStr.includes('diploma') || eduStr.includes('hsc') || eduStr.includes('12th')) educationScore = 55;
  else if (eduStr) educationScore = 50;

  const overall = Math.round(
    skillScore * 0.45 +
    roleScore * 0.20 +
    experienceScore * 0.15 +
    locationScore * 0.10 +
    educationScore * 0.10
  );

  return {
    overall,
    skillScore, roleScore, experienceScore, locationScore, educationScore,
    matched,   // original casing
    missing,   // original casing
    userSkills: userSkillsRaw,
    jobSkills: jobSkillsRaw,
  };
};
