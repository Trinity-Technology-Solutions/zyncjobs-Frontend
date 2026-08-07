import { apiFetch } from '../api/apiFetch';
import { API_ENDPOINTS as ENV_ENDPOINTS } from '../config/env';

// ── Shared candidate match-scoring — single source of truth used by
//    Candidate Ranking and Employer Dashboard (must stay identical) ──

export const TECH_SKILLS_KW = ['JavaScript','TypeScript','Python','Java','C++','C#','PHP','Ruby','Go','Rust','Kotlin','Swift','React','Angular','Vue','Next.js','Node.js','Express','Django','Flask','Spring','Laravel','FastAPI','HTML','CSS','Tailwind','Bootstrap','SQL','MySQL','PostgreSQL','MongoDB','Redis','Firebase','AWS','Azure','GCP','Docker','Kubernetes','Git','Linux','Terraform','Jenkins','Machine Learning','Deep Learning','TensorFlow','PyTorch','Scikit-learn','Pandas','NumPy','Power BI','Tableau','Excel','MATLAB','R','Hadoop','Spark','Kafka','REST','GraphQL','Microservices','Agile','Scrum','Figma','Jira','Postman','React.js','Node.js','Vue.js','Nest.js','MERN Stack','Full Stack','Data Analysis','Data Science','NLP'];

export const extractSkillsFromText = (text: string): string[] => {
  if (!text) return [];
  return TECH_SKILLS_KW.filter(k => {
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
  });
};

// Merge skills from ALL application sources and deduplicate (case-insensitive)
export const mergeCandidateSkills = (app: any): string[] => {
  const profile = app.candidateProfile || {};
  const profileSkills: string[] = Array.isArray(profile.skills) ? profile.skills : [];
  const appSkills: string[] = Array.isArray(app.skills) ? app.skills : [];
  const parsedSkills: string[] = (
    app.parsedResume?.skills?.featuredSkills?.map((s: any) => s.skill || s).filter(Boolean) ||
    app.resumeData?.skills?.featuredSkills?.map((s: any) => s.skill || s).filter(Boolean) ||
    (Array.isArray(app.parsedResume?.skills) ? app.parsedResume.skills : [])
  );
  const resumeTextSkills: string[] = extractSkillsFromText(
    app.resumeText || app.resumeContent || app.extractedText || ''
  );
  const seen = new Set<string>();
  return [...profileSkills, ...appSkills, ...parsedSkills, ...resumeTextSkills].filter(s => {
    const key = String(s).toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// ── Local fallback scoring (identical to Candidate Ranking) ──
export const STOP = new Set(['strong','experience','in','with','of','and','or','for','the','a','an','knowledge','hands','on','good','understanding','excellent','ability','working','using','familiarity','proficiency','expertise']);
export const tokenize = (str: string): string[] => {
  const out: string[] = [];
  str.toLowerCase().split(/[\s\/\(\),&\.\-\+]+/).forEach(w => { if (w.length > 2 && !STOP.has(w)) out.push(w); });
  return out;
};

export const localScore = (app: any, skills: string[], jobDataForScore: any): number => {
  const jobSkillsForScore: string[] = Array.isArray(jobDataForScore?.skills) ? jobDataForScore.skills : [];
  const jobTitleForScore: string = jobDataForScore?.jobTitle || jobDataForScore?.title || '';
  const jobDescForScore: string = jobDataForScore?.description || jobDataForScore?.jobDescription || '';

  // 1. Skill match (50%) — against job skills + description keywords
  const jobKw: string[] = [];
  jobSkillsForScore.forEach(s => tokenize(s).forEach(k => { if (!jobKw.includes(k)) jobKw.push(k); }));
  tokenize(jobDescForScore).forEach(k => { if (k.length > 3 && !jobKw.includes(k)) jobKw.push(k); });
  const matchedSkills = skills.filter(cs =>
    tokenize(cs).some(ct => jobKw.some(jk => ct === jk || ct.includes(jk) || jk.includes(ct)))
  );
  const sScore = jobSkillsForScore.length > 0
    ? Math.min(100, Math.round((matchedSkills.length / jobSkillsForScore.length) * 100))
    : skills.length > 0 ? 40 : 10;

  // 2. Title match (25%)
  const candTitleToks = tokenize(app.candidateJobTitle || app.jobTitle || '');
  const jobTitleToks = tokenize(jobTitleForScore);
  const titleHits = candTitleToks.filter(w => jobTitleToks.some(jw => w === jw || w.includes(jw) || jw.includes(w))).length;
  const tScore = jobTitleToks.length > 0 && candTitleToks.length > 0
    ? Math.min(100, Math.round((titleHits / jobTitleToks.length) * 100)) : 0;

  // 3. Experience score (15%) — years + keyword relevance
  const expText = (app.candidateExperience || app.experience || '').toLowerCase();
  const expYears = parseInt(expText.match(/(\d+)/)?.[1] || '0');
  const expHits = jobTitleToks.filter(w => expText.includes(w)).length;
  const expRelevance = jobTitleToks.length > 0 ? Math.min(100, Math.round((expHits / jobTitleToks.length) * 100)) : 0;
  const eScore = Math.round(expRelevance * 0.6 + Math.min(40, expYears * 8) * 0.4);

  // 4. Profile completeness bonus (10%)
  let completeness = 0;
  if (app.resumeUrl && !['resume_from_quick_apply','resume_from_profile','resume_uploaded'].includes(app.resumeUrl)) completeness += 40;
  if (skills.length >= 3) completeness += 30;
  if (app.candidateEducation && app.candidateEducation !== 'Not specified') completeness += 15;
  if (app.candidateJobTitle) completeness += 15;

  return Math.min(99, Math.max(1, Math.round(
    sScore * 0.50 + tScore * 0.25 + eScore * 0.15 + completeness * 0.10
  )));
};

// ── Full chain: stored AI score → backend hybrid-score → local fallback ──
// Always returns a number 1-99 (never 0), same as Candidate Ranking.
export const scoreCandidate = async (app: any, allJobs: any[]): Promise<number> => {
  const profile = app.candidateProfile || {};
  const skills: string[] = Array.isArray(app.candidateSkills)
    ? app.candidateSkills
    : mergeCandidateSkills(app);

  const rawJobId = typeof app.jobId === 'object' ? (app.jobId?._id || app.jobId?.id) : app.jobId;
  const jobData = typeof app.jobId === 'object'
    ? app.jobId
    : allJobs.find((j: any) => String(j._id || j.id) === String(rawJobId));

  // Use stored aiScore if already computed and non-zero
  let score = app.aiAnalysis?.overallScore || app.aiScore || 0;

  if (!score) {
    try {
      const res = await apiFetch(`${ENV_ENDPOINTS.BASE_URL}/ranking/hybrid-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: {
            skills,
            experience: app.candidateExperience || app.experience || '',
            education: app.candidateEducation || '',
            jobTitle: app.candidateJobTitle || profile.jobTitle || '',
            location: app.candidateLocation || profile.location || '',
            name: app.candidateName || profile.name || '',
            email: app.candidateEmail || '',
          },
          job: {
            title: jobData?.jobTitle || jobData?.title || '',
            skills: jobData?.skills || [],
            description: jobData?.description || jobData?.jobDescription || '',
            location: jobData?.location || '',
            experienceRange: jobData?.experienceRange || '',
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        score = data.hybrid_score || data.score || data.overall_score ||
                data.hybridScore || data.overallScore ||
                data.match_percentage || 0;
      }
    } catch { /* fall through to local */ }
  }

  // Local fallback if AI returned 0 or failed
  if (!score) score = localScore(app, skills, jobData);
  return Math.min(99, Math.max(1, Math.round(score)));
};
