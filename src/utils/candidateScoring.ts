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

// Returns detailed breakdown for transparency
export const scoreBreakdown = (app: any, skills: string[], jobDataForScore: any): {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  jobSkills: string[];
  skillsScore: number;
  titleScore: number;
  expScore: number;
} => {
  const jobSkillsForScore: string[] = Array.isArray(jobDataForScore?.skills) ? jobDataForScore.skills : [];
  const jobTitleForScore: string = jobDataForScore?.jobTitle || jobDataForScore?.title || '';

  // 1. Skill match (60%) — match candidate skills against each required job skill
  const matchedSkills = jobSkillsForScore.filter(js =>
    tokenize(js).some(jt =>
      skills.some(cs => tokenize(cs).some(ct => ct === jt || ct.includes(jt) || jt.includes(ct)))
    )
  );
  const missingSkills = jobSkillsForScore.filter(js => !matchedSkills.includes(js));

  let sScore: number;
  if (jobSkillsForScore.length > 0) {
    const ratio = matchedSkills.length / jobSkillsForScore.length;
    const breadthBonus = skills.length >= 5 ? 10 : skills.length >= 3 ? 5 : 0;
    sScore = Math.min(100, Math.round(ratio * 100) + breadthBonus);
  } else if (skills.length > 0) {
    sScore = Math.min(70, 30 + skills.length * 5);
  } else {
    sScore = 20;
  }

  // 2. Title match (20%)
  const candTitleToks = tokenize(app.candidateJobTitle || app.jobTitle || '');
  const jobTitleToks = tokenize(jobTitleForScore);
  const titleHits = candTitleToks.filter(w => jobTitleToks.some(jw => w === jw || w.includes(jw) || jw.includes(w))).length;
  const tScore = jobTitleToks.length > 0 && candTitleToks.length > 0
    ? Math.min(100, Math.round((titleHits / jobTitleToks.length) * 100)) : 30;

  // 3. Experience score (20%)
  const expText = (app.candidateExperience || app.experience || '').toLowerCase();
  const expYears = parseInt(expText.match(/(\d+)/)?.[1] || '0');
  const eScore = expYears >= 5 ? 90 : expYears >= 3 ? 75 : expYears >= 1 ? 60 : expText ? 45 : 30;

  const score = Math.min(99, Math.max(1, Math.round(
    sScore * 0.60 + tScore * 0.20 + eScore * 0.20
  )));

  return { score, matchedSkills, missingSkills, jobSkills: jobSkillsForScore, skillsScore: sScore, titleScore: tScore, expScore: eScore };
};

export const localScore = (app: any, skills: string[], jobDataForScore: any): number => {
  return scoreBreakdown(app, skills, jobDataForScore).score;
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
