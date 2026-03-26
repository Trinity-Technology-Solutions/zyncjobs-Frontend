/**
 * Job Match Engine
 * - TF-IDF cosine similarity for semantic skill matching
 * - Skill knowledge graph (related skills / aliases)
 * - Weighted scoring: skills 50%, title 25%, location 15%, experience 10%
 * - Detailed match explanation per job
 */

// ─── Skill Knowledge Graph ────────────────────────────────────────────────────
// Maps a canonical skill to its aliases and related skills
const SKILL_GRAPH: Record<string, string[]> = {
  javascript: ['js', 'es6', 'es2015', 'ecmascript', 'vanilla js', 'node', 'nodejs', 'typescript', 'ts'],
  typescript: ['ts', 'javascript', 'js'],
  react: ['reactjs', 'react.js', 'react native', 'next.js', 'nextjs', 'gatsby'],
  angular: ['angularjs', 'angular2', 'angular4'],
  vue: ['vuejs', 'vue.js', 'nuxt', 'nuxtjs'],
  python: ['py', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'scipy'],
  java: ['spring', 'springboot', 'spring boot', 'hibernate', 'maven', 'gradle'],
  'c#': ['csharp', '.net', 'dotnet', 'asp.net', 'blazor'],
  sql: ['mysql', 'postgresql', 'postgres', 'sqlite', 'mssql', 'oracle', 'database'],
  nosql: ['mongodb', 'mongo', 'redis', 'cassandra', 'dynamodb', 'firebase'],
  aws: ['amazon web services', 'ec2', 's3', 'lambda', 'cloudfront', 'rds'],
  azure: ['microsoft azure', 'azure devops'],
  gcp: ['google cloud', 'google cloud platform', 'bigquery'],
  docker: ['containerization', 'containers', 'kubernetes', 'k8s'],
  git: ['github', 'gitlab', 'bitbucket', 'version control'],
  html: ['html5', 'html/css', 'markup'],
  css: ['css3', 'sass', 'scss', 'less', 'tailwind', 'tailwindcss', 'bootstrap'],
  'machine learning': ['ml', 'deep learning', 'ai', 'artificial intelligence', 'tensorflow', 'pytorch', 'keras'],
  devops: ['ci/cd', 'jenkins', 'github actions', 'gitlab ci', 'terraform', 'ansible'],
  agile: ['scrum', 'kanban', 'jira', 'sprint'],
  'ui/ux': ['figma', 'sketch', 'adobe xd', 'user interface', 'user experience', 'design'],
  php: ['laravel', 'symfony', 'wordpress'],
  ruby: ['rails', 'ruby on rails'],
  go: ['golang'],
  rust: ['systems programming'],
  swift: ['ios', 'xcode', 'objective-c'],
  kotlin: ['android', 'android development'],
  'data analysis': ['data analytics', 'tableau', 'power bi', 'excel', 'data visualization'],
  sap: ['sap ewm', 'sap fico', 'sap mm', 'sap sd', 'sap hana', 'abap'],
  salesforce: ['sfdc', 'apex', 'visualforce', 'lightning'],
  pega: ['pega cssa', 'pega bpm', 'pega platform'],
};

// Build reverse lookup: alias → canonical
const ALIAS_MAP: Record<string, string> = {};
Object.entries(SKILL_GRAPH).forEach(([canonical, aliases]) => {
  aliases.forEach(alias => { ALIAS_MAP[alias.toLowerCase()] = canonical; });
  ALIAS_MAP[canonical.toLowerCase()] = canonical;
});

export function normalizeSkill(skill: string): string {
  const lower = skill.toLowerCase().trim();
  return ALIAS_MAP[lower] || lower;
}

// Expand a skill to include all its graph neighbors
function expandSkill(skill: string): string[] {
  const canonical = normalizeSkill(skill);
  const related = SKILL_GRAPH[canonical] || [];
  return [canonical, ...related.map(r => r.toLowerCase())];
}

// ─── TF-IDF Cosine Similarity ─────────────────────────────────────────────────
function buildTermFreq(terms: string[]): Record<string, number> {
  const tf: Record<string, number> = {};
  terms.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
  const total = terms.length || 1;
  Object.keys(tf).forEach(k => { tf[k] /= total; });
  return tf;
}

function cosineSimilarity(a: Record<string, number>, b: Record<string, number>): number {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0, magA = 0, magB = 0;
  keys.forEach(k => {
    const va = a[k] || 0, vb = b[k] || 0;
    dot += va * vb;
    magA += va * va;
    magB += vb * vb;
  });
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

// ─── Match Score Breakdown ────────────────────────────────────────────────────
export interface MatchBreakdown {
  overall: number;
  skillScore: number;
  titleScore: number;
  locationScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  bonusSkills: string[];   // candidate has extra skills not required
  explanation: string[];   // human-readable reasons
}

export function computeMatchScore(
  candidateSkills: string[],
  candidateTitle: string,
  candidateLocation: string,
  job: any
): MatchBreakdown {
  const jobSkills: string[] = (job.skills || []).map((s: string) => s.toLowerCase());
  const jobTitle: string = (job.jobTitle || job.title || '').toLowerCase();
  const jobLocation: string = (job.location || '').toLowerCase();
  const jobDesc: string = (job.description || '').toLowerCase();

  // Normalize candidate skills with graph expansion
  const candNormalized = candidateSkills.map(s => normalizeSkill(s));
  const candExpanded = candidateSkills.flatMap(s => expandSkill(s));
  const jobNormalized = jobSkills.map(s => normalizeSkill(s));
  const jobExpanded = jobSkills.flatMap(s => expandSkill(s));

  // ── Skill Score (TF-IDF cosine) ──
  const candTF = buildTermFreq(candExpanded);
  const jobTF = buildTermFreq(jobExpanded);
  const cosineSim = cosineSimilarity(candTF, jobTF);
  const skillScore = Math.round(Math.min(100, cosineSim * 200)); // scale to 0-100

  // Matched / missing / bonus skills
  const matchedSkills = jobNormalized.filter(js =>
    candExpanded.some(cs => cs === js || cs.includes(js) || js.includes(cs))
  );
  const missingSkills = jobNormalized.filter(js =>
    !candExpanded.some(cs => cs === js || cs.includes(js) || js.includes(cs))
  );
  const bonusSkills = candNormalized.filter(cs =>
    !jobNormalized.some(js => js === cs || js.includes(cs) || cs.includes(js))
  ).slice(0, 3);

  // ── Title Score ──
  const candTitleWords = candidateTitle.toLowerCase().split(/\s+/);
  const jobTitleWords = jobTitle.split(/\s+/);
  const titleOverlap = candTitleWords.filter(w => w.length > 2 && jobTitleWords.some(jw => jw.includes(w) || w.includes(jw))).length;
  const titleScore = Math.min(100, Math.round((titleOverlap / Math.max(jobTitleWords.length, 1)) * 100));

  // Also check if job description mentions candidate's title
  const titleInDesc = candidateTitle.toLowerCase().split(/\s+/).some(w => w.length > 3 && jobDesc.includes(w));

  // ── Location Score ──
  let locationScore = 60; // default neutral
  if (!candidateLocation || jobLocation.includes('remote') || jobLocation.includes('anywhere')) {
    locationScore = 90;
  } else {
    const candLocWords = candidateLocation.toLowerCase().split(/[\s,]+/);
    const jobLocWords = jobLocation.split(/[\s,]+/);
    const locMatch = candLocWords.some(w => w.length > 2 && jobLocWords.some(jw => jw.includes(w) || w.includes(jw)));
    locationScore = locMatch ? 95 : 55;
  }

  // ── Weighted Overall ──
  const overall = Math.round(
    skillScore * 0.55 +
    (titleScore + (titleInDesc ? 10 : 0)) * 0.25 +
    locationScore * 0.20
  );

  // ── Human-readable Explanation ──
  const explanation: string[] = [];

  if (matchedSkills.length > 0) {
    explanation.push(`✅ You match ${matchedSkills.length} of ${jobNormalized.length} required skills: ${matchedSkills.slice(0, 3).join(', ')}${matchedSkills.length > 3 ? ` +${matchedSkills.length - 3} more` : ''}`);
  }
  if (missingSkills.length > 0) {
    explanation.push(`⚠️ ${missingSkills.length} skill gap${missingSkills.length > 1 ? 's' : ''}: ${missingSkills.slice(0, 3).join(', ')}`);
  }
  if (bonusSkills.length > 0) {
    explanation.push(`⭐ You bring extra value: ${bonusSkills.join(', ')}`);
  }
  if (titleScore > 50 || titleInDesc) {
    explanation.push(`🎯 Your experience as "${candidateTitle}" aligns with this role`);
  }
  if (locationScore >= 90) {
    explanation.push(`📍 Location is a great fit (remote-friendly or matching)`);
  }
  if (overall >= 80) {
    explanation.push(`🚀 Strong overall match — highly recommended to apply`);
  } else if (overall >= 60) {
    explanation.push(`👍 Good match — worth applying with a tailored resume`);
  } else {
    explanation.push(`📝 Partial match — consider upskilling in missing areas`);
  }

  return {
    overall: Math.min(98, Math.max(overall, matchedSkills.length > 0 ? 35 : 20)),
    skillScore,
    titleScore: Math.min(100, titleScore + (titleInDesc ? 10 : 0)),
    locationScore,
    matchedSkills,
    missingSkills,
    bonusSkills,
    explanation,
  };
}

// ─── Rank Jobs ────────────────────────────────────────────────────────────────
export function rankJobs(
  jobs: any[],
  candidateSkills: string[],
  candidateTitle: string,
  candidateLocation: string
): Array<any & { matchBreakdown: MatchBreakdown }> {
  return jobs
    .map(job => ({
      ...job,
      matchBreakdown: computeMatchScore(candidateSkills, candidateTitle, candidateLocation, job),
    }))
    .sort((a, b) => b.matchBreakdown.overall - a.matchBreakdown.overall);
}
