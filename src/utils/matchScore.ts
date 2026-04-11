// Shared match score computation — used by both job cards and the breakdown modal

export const normalizeSkill = (s: string) => String(s || '').toLowerCase().trim();

export const getUserProfile = () => {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
};

export const computeMatchBreakdown = (job: any) => {
  const profile = getUserProfile();

  const jobSkills: string[] = (Array.isArray(job.skills) ? job.skills : []).map(normalizeSkill);
  const userSkills: string[] = (Array.isArray(profile.skills) ? profile.skills : []).map(normalizeSkill);

  // 1. Skill match (45%)
  const matched: string[] = [];
  const missing: string[] = [];
  jobSkills.forEach(js => {
    const found = userSkills.some(us => us.includes(js) || js.includes(us));
    if (found) matched.push(js);
    else missing.push(js);
  });
  const skillScore = jobSkills.length > 0 ? Math.round((matched.length / jobSkills.length) * 100) : 0;

  // 2. Role match (20%)
  const jobTitle = (job.title || job.jobTitle || '').toLowerCase();
  const userTitle = (profile.jobTitle || profile.title || '').toLowerCase();
  let roleScore = 0;
  if (jobTitle && userTitle) {
    const jWords = jobTitle.split(/\s+/).filter((w: string) => w.length > 2);
    const uWords = userTitle.split(/\s+/).filter((w: string) => w.length > 2);
    const common = jWords.filter((w: string) => uWords.some((uw: string) => uw.includes(w) || w.includes(uw)));
    roleScore = jWords.length > 0 ? Math.round((common.length / jWords.length) * 100) : 0;
  }

  // 3. Experience match (15%)
  const expYears = parseInt(profile.employment?.experienceYears || '0') || 0;
  const seniorWords = ['senior', 'lead', 'principal', 'staff', 'manager'];
  const juniorWords = ['junior', 'fresher', 'entry', 'intern', 'trainee'];
  const isSeniorJob = seniorWords.some(w => jobTitle.includes(w));
  const isJuniorJob = juniorWords.some(w => jobTitle.includes(w));
  let experienceScore = 50;
  if (isSeniorJob && expYears >= 3) experienceScore = 100;
  else if (isSeniorJob && expYears < 3) experienceScore = 30;
  else if (isJuniorJob && expYears <= 2) experienceScore = 100;
  else if (!isSeniorJob && !isJuniorJob) experienceScore = 70;

  // 4. Location match (10%)
  const jobLoc = (job.location || '').toLowerCase();
  const userLoc = (profile.location || '').toLowerCase();
  const locationScore = jobLoc && userLoc
    ? (jobLoc.includes(userLoc) || userLoc.includes(jobLoc) || jobLoc.includes('remote') ? 100 : 0)
    : 0;

  // 5. Education match (10%)
  const userEdu = String(profile.education || profile.educationCollege?.degree || '').toLowerCase();
  let educationScore = 50;
  if (userEdu.includes('master') || userEdu.includes('mba') || userEdu.includes('phd')) educationScore = 100;
  else if (userEdu.includes('bachelor') || userEdu.includes('b.e') || userEdu.includes('b.tech') || userEdu.includes('degree')) educationScore = 80;
  else if (userEdu) educationScore = 60;

  // Weighted overall
  const overall = Math.round(
    skillScore * 0.45 +
    roleScore * 0.20 +
    experienceScore * 0.15 +
    locationScore * 0.10 +
    educationScore * 0.10
  );

  return { overall, skillScore, roleScore, experienceScore, locationScore, educationScore, matched, missing, userSkills, jobSkills };
};
