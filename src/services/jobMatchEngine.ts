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
  // ── Frontend ──
  javascript: ['js', 'es6', 'es2015', 'ecmascript', 'vanilla js', 'node', 'nodejs', 'typescript', 'ts'],
  typescript: ['ts', 'javascript', 'js', 'typed javascript'],
  react: ['reactjs', 'react.js', 'react js', 'react native', 'next.js', 'nextjs', 'gatsby'],
  angular: ['angularjs', 'angular2', 'angular4', 'angular js'],
  vue: ['vuejs', 'vue.js', 'vue js', 'nuxt', 'nuxtjs'],
  html: ['html5', 'html/css', 'markup', 'hypertext markup language'],
  css: ['css3', 'sass', 'scss', 'less', 'tailwind', 'tailwindcss', 'bootstrap', 'stylesheets'],
  redux: ['redux toolkit', 'react redux', 'state management', 'zustand', 'mobx'],
  // ── Backend ──
  'node.js': ['nodejs', 'node js', 'node', 'express', 'expressjs'],
  python: ['py', 'python3', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'scipy'],
  java: ['core java', 'java programming', 'spring', 'springboot', 'spring boot', 'hibernate', 'maven', 'gradle'],
  'c#': ['csharp', '.net', 'dotnet', 'asp.net', 'blazor', 'dot net', 'c sharp'],
  php: ['laravel', 'symfony', 'wordpress', 'codeigniter', 'php7', 'php8'],
  ruby: ['rails', 'ruby on rails', 'ror'],
  go: ['golang', 'go lang'],
  rust: ['systems programming', 'rust lang'],
  kotlin: ['android', 'android development', 'android studio'],
  scala: ['akka', 'play framework'],
  'c++': ['cpp', 'c plus plus', 'cplusplus'],
  // ── Database ──
  sql: ['mysql', 'postgresql', 'postgres', 'sqlite', 'mssql', 'oracle', 'database', 'rdbms', 'pl/sql', 'tsql'],
  nosql: ['mongodb', 'mongo', 'redis', 'cassandra', 'dynamodb', 'firebase', 'document database'],
  mongodb: ['mongo', 'mongo db'],
  redis: ['redis cache', 'caching', 'in-memory database'],
  elasticsearch: ['elastic search', 'elk stack', 'kibana', 'logstash'],
  // ── Cloud / DevOps ──
  aws: ['amazon web services', 'ec2', 's3', 'lambda', 'cloudfront', 'rds', 'aws cloud'],
  azure: ['microsoft azure', 'azure devops', 'azure cloud'],
  gcp: ['google cloud', 'google cloud platform', 'bigquery'],
  docker: ['containerization', 'containers', 'kubernetes', 'k8s', 'dockerfile'],
  devops: ['ci/cd', 'jenkins', 'github actions', 'gitlab ci', 'terraform', 'ansible', 'continuous integration', 'continuous deployment'],
  git: ['github', 'gitlab', 'bitbucket', 'version control', 'source control', 'git flow'],
  linux: ['unix', 'bash', 'shell scripting', 'shell script', 'bash scripting', 'command line'],
  // ── AI / ML / Data ──
  'machine learning': ['ml', 'deep learning', 'ai', 'artificial intelligence', 'tensorflow', 'pytorch', 'keras', 'neural networks'],
  'data science': ['data scientist', 'data engineering', 'big data', 'data engineer'],
  'data analysis': ['data analytics', 'tableau', 'power bi', 'excel', 'data visualization', 'reporting', 'business analytics'],
  spark: ['apache spark', 'pyspark', 'spark streaming'],
  hadoop: ['apache hadoop', 'hdfs', 'mapreduce', 'hive'],
  // ── Mobile ──
  swift: ['ios', 'xcode', 'objective-c', 'ios development'],
  flutter: ['dart', 'flutter development', 'cross platform'],
  // ── QA / Testing ──
  'manual testing': ['manual test', 'functional testing', 'exploratory testing', 'black box testing', 'white box testing', 'regression testing', 'smoke testing', 'sanity testing', 'uat', 'user acceptance testing', 'system testing', 'integration testing'],
  'automation testing': ['selenium', 'cypress', 'playwright', 'test automation', 'automated testing', 'appium', 'testng', 'junit', 'pytest', 'robot framework'],
  sdlc: ['software development life cycle', 'software development lifecycle', 'development lifecycle'],
  stlc: ['software testing life cycle', 'software testing lifecycle', 'testing lifecycle'],
  'bug tracking': ['defect tracking', 'bug reporting', 'jira', 'bugzilla', 'mantis', 'defect management', 'issue tracking'],
  'api testing': ['rest api testing', 'postman', 'soap testing', 'rest assured', 'api automation'],
  'performance testing': ['load testing', 'stress testing', 'jmeter', 'gatling', 'k6'],
  'test cases': ['test case writing', 'test case design', 'test planning', 'test plan', 'test scripts'],
  'quality assurance': ['qa', 'qc', 'quality control', 'software quality', 'software testing', 'testing'],
  // ── Design ──
  'ui/ux': ['figma', 'sketch', 'adobe xd', 'user interface', 'user experience', 'design', 'ux design', 'ui design', 'wireframing', 'prototyping'],
  // ── Project Management / Soft Skills ──
  agile: ['scrum', 'kanban', 'jira', 'sprint', 'agile methodology', 'agile scrum'],
  'project management': ['pmp', 'project planning', 'project coordination', 'project delivery'],
  communication: ['verbal communication', 'written communication', 'interpersonal skills', 'presentation skills'],
  leadership: ['team lead', 'team leadership', 'people management', 'mentoring'],
  // ── Finance / Accounting ──
  accounting: ['bookkeeping', 'accounts payable', 'accounts receivable', 'financial accounting', 'tally', 'tally erp', 'general ledger', 'ledger'],
  tally: ['tally erp', 'tally prime', 'tally accounting', 'tally software'],
  'financial analysis': ['financial modeling', 'financial reporting', 'budgeting', 'forecasting', 'mis reporting', 'mis', 'variance analysis'],
  taxation: ['gst', 'income tax', 'tax filing', 'indirect tax', 'direct tax', 'tds', 'vat', 'tax compliance'],
  auditing: ['internal audit', 'external audit', 'statutory audit', 'audit report', 'audit compliance'],
  banking: ['retail banking', 'corporate banking', 'investment banking', 'trade finance', 'treasury', 'loans', 'credit analysis'],
  insurance: ['life insurance', 'general insurance', 'underwriting', 'claims', 'actuarial'],
  finance: ['financial management', 'corporate finance', 'working capital', 'cash flow', 'fund management'],
  // ── Marketing / Sales ──
  'digital marketing': ['seo', 'sem', 'social media marketing', 'content marketing', 'email marketing', 'online marketing', 'performance marketing'],
  seo: ['search engine optimization', 'on-page seo', 'off-page seo', 'technical seo', 'keyword research', 'link building'],
  'social media': ['social media management', 'instagram', 'facebook marketing', 'linkedin marketing', 'youtube marketing'],
  'content writing': ['copywriting', 'blog writing', 'technical writing', 'content creation', 'article writing'],
  sales: ['business development', 'lead generation', 'crm', 'b2b sales', 'b2c sales', 'inside sales', 'field sales', 'direct sales', 'retail sales', 'telesales', 'cold calling'],
  marketing: ['brand management', 'product marketing', 'market research', 'campaign management', 'btl', 'atl'],
  'customer service': ['customer support', 'client servicing', 'customer care', 'customer success', 'after sales service', 'helpdesk'],
  retail: ['store management', 'merchandising', 'visual merchandising', 'inventory management', 'pos'],
  // ── HR / Operations ──
  'human resources': ['hr', 'recruitment', 'talent acquisition', 'payroll', 'hrms', 'hris', 'hr operations', 'hr generalist'],
  recruitment: ['talent acquisition', 'sourcing', 'hiring', 'staffing', 'headhunting', 'campus recruitment'],
  payroll: ['payroll processing', 'salary processing', 'payroll management', 'pf', 'esi', 'statutory compliance'],
  operations: ['operations management', 'process improvement', 'supply chain', 'logistics', 'warehouse management', 'inventory control'],
  'supply chain': ['logistics', 'procurement', 'vendor management', 'sourcing', 'import export', 'freight', 'shipping'],
  logistics: ['freight forwarding', 'warehouse', 'dispatch', 'delivery management', 'fleet management', 'transportation'],
  // ── SAP / ERP ──
  sap: ['sap ewm', 'sap fico', 'sap mm', 'sap sd', 'sap hana', 'abap', 'sap erp', 'sap s/4hana'],
  salesforce: ['sfdc', 'apex', 'visualforce', 'lightning'],
  pega: ['pega cssa', 'pega bpm', 'pega platform'],
  erp: ['enterprise resource planning', 'oracle erp', 'microsoft dynamics'],
  // ── Networking / Security ──
  networking: ['tcp/ip', 'dns', 'dhcp', 'network protocols', 'lan', 'wan', 'network administration'],
  cybersecurity: ['information security', 'infosec', 'network security', 'ethical hacking', 'penetration testing', 'vapt'],
  // ── Finance / Accounting ──
  accounting: ['bookkeeping', 'accounts payable', 'accounts receivable', 'financial accounting', 'tally', 'tally erp', 'general ledger', 'ledger'],
  tally: ['tally erp', 'tally prime', 'tally accounting', 'tally software'],
  'financial analysis': ['financial modeling', 'financial reporting', 'budgeting', 'forecasting', 'mis reporting', 'mis', 'variance analysis'],
  taxation: ['gst', 'income tax', 'tax filing', 'indirect tax', 'direct tax', 'tds', 'vat', 'tax compliance'],
  auditing: ['internal audit', 'external audit', 'statutory audit', 'audit report', 'audit compliance'],
  banking: ['retail banking', 'corporate banking', 'investment banking', 'trade finance', 'treasury', 'loans', 'credit analysis'],
  insurance: ['life insurance', 'general insurance', 'underwriting', 'claims', 'actuarial'],
  finance: ['financial management', 'corporate finance', 'working capital', 'cash flow', 'fund management'],
  // ── Marketing / Sales ──
  'digital marketing': ['seo', 'sem', 'social media marketing', 'content marketing', 'email marketing', 'online marketing', 'performance marketing'],
  seo: ['search engine optimization', 'on-page seo', 'off-page seo', 'technical seo', 'keyword research', 'link building'],
  'social media': ['social media management', 'instagram', 'facebook marketing', 'linkedin marketing', 'youtube marketing'],
  'content writing': ['copywriting', 'blog writing', 'technical writing', 'content creation', 'article writing'],
  sales: ['business development', 'lead generation', 'crm', 'b2b sales', 'b2c sales', 'inside sales', 'field sales', 'direct sales', 'retail sales', 'telesales', 'cold calling'],
  marketing: ['brand management', 'product marketing', 'market research', 'campaign management', 'btl', 'atl'],
  'customer service': ['customer support', 'client servicing', 'customer care', 'customer success', 'after sales service', 'helpdesk'],
  retail: ['store management', 'merchandising', 'visual merchandising', 'inventory management', 'pos'],
  // ── HR / Operations ──
  'human resources': ['hr', 'recruitment', 'talent acquisition', 'payroll', 'hrms', 'hris', 'hr operations', 'hr generalist'],
  recruitment: ['talent acquisition', 'sourcing', 'hiring', 'staffing', 'headhunting', 'campus recruitment'],
  payroll: ['payroll processing', 'salary processing', 'payroll management', 'pf', 'esi', 'statutory compliance'],
  operations: ['operations management', 'process improvement', 'supply chain', 'logistics', 'warehouse management', 'inventory control'],
  'supply chain': ['logistics', 'procurement', 'vendor management', 'sourcing', 'import export', 'freight', 'shipping'],
  logistics: ['freight forwarding', 'warehouse', 'dispatch', 'delivery management', 'fleet management', 'transportation'],
  // ── Gulf / Middle East ──
  'gulf experience': ['gcc experience', 'middle east experience', 'uae experience', 'saudi experience', 'qatar experience', 'kuwait experience', 'oman experience', 'bahrain experience'],
  'driving license': ['uae driving license', 'gcc driving license', 'light motor vehicle', 'lmv', 'heavy vehicle license'],
  // ── Civil / Construction ──
  'civil engineering': ['structural engineering', 'construction management', 'site engineering', 'civil works', 'rcc'],
  autocad: ['auto cad', 'cad design', 'drafting', '2d drafting', '3d modeling', 'revit', 'staad pro', 'etabs'],
  construction: ['site supervision', 'project execution', 'building construction', 'infrastructure', 'road construction'],
  'quantity surveying': ['qs', 'bill of quantities', 'boq', 'cost estimation', 'tendering', 'rate analysis'],
  'project planning': ['primavera', 'ms project', 'project scheduling', 'gantt chart', 'wbs', 'project control'],
  mep: ['mechanical electrical plumbing', 'hvac', 'electrical works', 'plumbing', 'fire fighting'],
  surveying: ['land surveying', 'total station', 'gps survey', 'leveling', 'topographic survey'],
  // ── Mechanical / Manufacturing ──
  'mechanical engineering': ['machine design', 'product design', 'manufacturing engineering', 'industrial engineering'],
  'cad design': ['solidworks', 'catia', 'pro-e', 'creo', 'nx cad', 'unigraphics', 'ansys'],
  production: ['production planning', 'production management', 'manufacturing', 'shop floor', 'assembly line', 'lean manufacturing'],
  'quality control': ['qc', 'quality inspection', 'incoming quality', 'in-process quality', 'final inspection', 'iqc'],
  maintenance: ['preventive maintenance', 'predictive maintenance', 'breakdown maintenance', 'tpm', 'cmms'],
  welding: ['tig welding', 'mig welding', 'arc welding', 'fabrication', 'structural fabrication'],
  cnc: ['cnc machining', 'cnc programming', 'cnc operator', 'lathe', 'milling', 'turning'],
  // ── Electrical / Electronics ──
  'electrical engineering': ['power systems', 'electrical design', 'panel design', 'switchgear', 'hv', 'lv', 'mv'],
  plc: ['plc programming', 'scada', 'dcs', 'automation', 'industrial automation', 'hmi'],
  'embedded systems': ['embedded c', 'microcontroller', 'arduino', 'raspberry pi', 'rtos', 'firmware'],
  vlsi: ['vhdl', 'verilog', 'fpga', 'asic', 'chip design', 'semiconductor'],
  // ── Healthcare / Medical ──
  nursing: ['staff nurse', 'registered nurse', 'rn', 'icu nursing', 'ot nursing', 'critical care nursing', 'patient care'],
  doctor: ['mbbs', 'md', 'ms', 'physician', 'general practitioner', 'gp', 'specialist', 'consultant'],
  pharmacy: ['pharmacist', 'clinical pharmacy', 'drug dispensing', 'pharmaceutical', 'pharma'],
  'medical laboratory': ['lab technician', 'medical lab', 'pathology', 'microbiology', 'hematology', 'biochemistry'],
  radiology: ['x-ray', 'mri', 'ct scan', 'ultrasound', 'radiographer', 'imaging'],
  physiotherapy: ['physical therapy', 'physiotherapist', 'rehabilitation', 'sports therapy'],
  'healthcare management': ['hospital administration', 'health informatics', 'clinical management', 'medical coding', 'icd coding'],
  // ── Education / Teaching ──
  teaching: ['teacher', 'faculty', 'lecturer', 'instructor', 'trainer', 'tutor', 'educator'],
  'curriculum development': ['lesson planning', 'course design', 'instructional design', 'e-learning', 'lms'],
  training: ['corporate training', 'soft skills training', 'technical training', 'learning and development', 'l&d'],
  // ── Hospitality / Hotel ──
  hospitality: ['hotel management', 'front office', 'housekeeping', 'food and beverage', 'f&b', 'banquet', 'concierge'],
  'food service': ['restaurant management', 'kitchen management', 'chef', 'catering', 'barista', 'bartender'],
  travel: ['travel management', 'ticketing', 'gds', 'amadeus', 'galileo', 'tour operations', 'travel consultant'],
  // ── Media / Creative ──
  'video editing': ['premiere pro', 'final cut pro', 'davinci resolve', 'after effects', 'motion graphics'],
  'graphic design': ['photoshop', 'illustrator', 'indesign', 'canva', 'visual design', 'branding'],
  photography: ['photo editing', 'lightroom', 'product photography', 'event photography'],
  journalism: ['news writing', 'reporting', 'editing', 'media', 'broadcast', 'print media'],
  // ── Legal ──
  legal: ['lawyer', 'advocate', 'attorney', 'legal counsel', 'corporate law', 'litigation', 'contract drafting'],
  compliance: ['regulatory compliance', 'legal compliance', 'risk management', 'governance', 'grc'],
  // ── Real Estate ──
  'real estate': ['property management', 'real estate sales', 'leasing', 'property valuation', 'facility management'],
  // ── Soft Skills (universal) ──
  communication: ['verbal communication', 'written communication', 'interpersonal skills', 'presentation skills', 'public speaking'],
  leadership: ['team lead', 'team leadership', 'people management', 'mentoring', 'coaching'],
  'problem solving': ['analytical thinking', 'critical thinking', 'troubleshooting', 'decision making'],
  'microsoft office': ['ms office', 'word', 'powerpoint', 'outlook', 'office 365', 'ms word', 'ms excel'],
  'time management': ['multitasking', 'prioritization', 'deadline management', 'organizational skills'],
  teamwork: ['team player', 'collaboration', 'cross functional', 'coordination'],
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

    // ── Enhanced Skill Matching ──
    const getSkillCategory = (skill: string): string => {
      const normalized = skill.toLowerCase();
      const categories = {
        'manual testing': 'testing',
        'sdlc': 'testing',
        'stlc': 'testing',
        'bug tracking': 'testing',
        'quality assurance': 'testing',
        'quality control': 'testing',
        'automation testing': 'testing',
        'performance testing': 'testing',
        'test cases': 'testing',
        'api testing': 'testing'
      };
      
      if (categories[normalized]) return categories[normalized];
      
      return null;
    };

    const isSemanticallyRelated = (skill1: string, skill2: string): boolean => {
      const cat1 = getSkillCategory(skill1);
      const cat2 = getSkillCategory(skill2);
      return cat1 && cat2 && cat1 === cat2;
    };

    // Matched / missing / bonus skills with enhanced semantic matching
    const matchedSkills = jobNormalized.filter(js => {
      const directMatch = candExpanded.some(cs => 
        cs === js || cs.includes(js) || js.includes(cs)
      );
      if (directMatch) return true;
      
      const semanticMatch = candExpanded.some(cs => 
        isSemanticallyRelated(cs, js)
      );
      if (semanticMatch) return true;
      
      return false;
    });
    
    const missingSkills = jobNormalized.filter(js => {
      if (matchedSkills.includes(js)) return false;
      
      const hasSemanticRelated = candExpanded.some(cs => 
        isSemanticallyRelated(cs, js)
      );
      if (hasSemanticRelated) return false;
      
      return true;
    });
    
    const bonusSkills = candNormalized.filter(cs =>
      !jobNormalized.some(js => js === cs || js.includes(cs) || cs.includes(js) || isSemanticallyRelated(js, cs))
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
    explanation.push(`You match ${matchedSkills.length} of ${jobNormalized.length} required skills: ${matchedSkills.slice(0, 3).join(', ')}${matchedSkills.length > 3 ? ` +${matchedSkills.length - 3} more` : ''}`);
  }
  if (missingSkills.length > 0) {
    explanation.push(`${missingSkills.length} skill gap${missingSkills.length > 1 ? 's' : ''}: ${missingSkills.slice(0, 3).join(', ')}`);
  }
  if (bonusSkills.length > 0) {
    explanation.push(`Extra value: ${bonusSkills.join(', ')}`);
  }
  if (titleScore > 50 || titleInDesc) {
    explanation.push(`Your experience as "${candidateTitle}" aligns with this role`);
  }
  if (locationScore >= 90) {
    explanation.push(`Location is a great fit (remote-friendly or matching)`);
  }
  if (overall >= 80) {
    explanation.push(`Strong overall match — highly recommended to apply`);
  } else if (overall >= 60) {
    explanation.push(`Good match — worth applying with a tailored resume`);
  } else {
    explanation.push(`Partial match — consider upskilling in missing areas`);
  }

  return {
    overall: Math.min(98, Math.max(overall, matchedSkills.length > 0 ? 25 : 15)), // Lowered minimum from 35/20 to 25/15
    skillScore,
    titleScore: Math.min(100, titleScore + (titleInDesc ? 10 : 0)),
    locationScore,
    matchedSkills,
    missingSkills,
    bonusSkills,
    explanation,
  };
}

// ─── Extract Skills from Raw Resume Text ────────────────────────────────────
// Scans resume text against every canonical skill + alias in SKILL_GRAPH
export function extractSkillsFromText(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const found = new Set<string>();
  Object.entries(SKILL_GRAPH).forEach(([canonical, aliases]) => {
    const terms = [canonical, ...aliases];
    if (terms.some(t => {
      // word-boundary check: surrounded by non-alphanumeric chars
      const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i').test(lower);
    })) {
      found.add(canonical);
    }
  });
  return Array.from(found);
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
