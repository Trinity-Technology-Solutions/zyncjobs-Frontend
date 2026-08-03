// Shared match score computation — used by both job cards and the breakdown modal

export const normalizeSkill = (s: string) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9#+.\s]/g, '');

export const getUserProfile = () => {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
};

// Validate if profile has essential information for AI matching
export const isValidProfileForMatching = (profile?: any): boolean => {
  if (!profile || typeof profile !== 'object') return false;

  const hasSkills = () => {
    const skills = profile.skills || profile.resumeSkills || [];
    return Array.isArray(skills) && skills.length > 0;
  };

  const hasJobTitle = () => {
    const title = profile.jobTitle || profile.title || '';
    return !!title && title.trim().length > 0;
  };

  const hasExperience = () => {
    // Check if profile has employment history
    const employment = profile.employment;
    if (!employment) return false;
    
    if (Array.isArray(employment) && employment.length > 0) return true;
    
    // Check for single employment object
    if (employment && typeof employment === 'object') {
      const hasAny = (
        employment.company ||
        employment.position ||
        employment.startYear ||
        employment.currentlyWorking ||
        employment.endYear ||
        employment.currentTitle
      );
      return !!hasAny;
    }
    
    return false;
  };

  const hasEducation = () => {
    // Check various education fields
    const hasEducationFields = (
      profile.education ||
      profile.educationCollege ||
      profile.degree ||
      profile.college ||
      profile.graduation ||
      profile.university ||
      profile.masters ||
      profile.bachelors ||
      profile.diploma ||
      profile.certification
    );
    
    // Additional check for valid education (not placeholder values)
    const hasValidEducation = (field: string) => 
      field && 
      field !== 'Not specified' && 
      field !== 'Fresher' && 
      field !== '{}' &&
      typeof field === 'string' &&
      field.trim().length > 0;
    
    const allEducationFields = [
      profile.education,
      profile.educationCollege,
      profile.degree,
      profile.college,
      profile.graduation,
      profile.university,
      profile.masters,
      profile.bachelors,
      profile.diploma,
      profile.certification
    ];
    
    return hasEducationFields || allEducationFields.some(field => hasValidEducation(field));
  };

  const hasLocation = () => {
    const location = profile.location || '';
    return !!location && location.trim().length > 0 && location.toLowerCase() !== 'unknown';
  };

  const isCompleteProfile = (): boolean => {
    const checks = [
      hasSkills(),
      hasJobTitle(),
      hasExperience(),
      hasEducation(),
      hasLocation()
    ];
    
    const completed = checks.filter(check => check).length;
    const total = checks.length;
    const completionPercentage = (completed / total) * 100;
    
    return completionPercentage >= 80;
  };

  return isCompleteProfile();
};

export const getIncompleteProfileFields = (profile?: any): string[] => {
  if (!profile || typeof profile !== 'object') return ['profile'];

  const incompleteFields: string[] = [];

  // Check skills
  const hasSkills = Array.isArray(profile.skills) && profile.skills.length > 0;
  const hasResumeSkills = profile.resumeSkills && Array.isArray(profile.resumeSkills) && profile.resumeSkills.length > 0;
  const hasAnySkills = hasSkills || hasResumeSkills;

  if (!hasAnySkills) {
    incompleteFields.push('skills');
  }

  // Check job title
  const hasJobTitle = (profile.jobTitle || profile.title || '').trim().length > 0;
  if (!hasJobTitle) {
    incompleteFields.push('jobTitle');
  }

  // Check experience
  const hasEmployment = () => {
    const employment = profile.employment;
    if (!employment) return false;
    
    if (Array.isArray(employment) && employment.length > 0) return true;
    
    if (employment && typeof employment === 'object') {
      const hasAnyEmployment = (
        employment.company ||
        employment.position ||
        employment.startYear ||
        employment.currentlyWorking ||
        employment.endYear ||
        employment.currentTitle
      );
      return !!hasAnyEmployment;
    }
    
    return false;
  };

  if (!hasEmployment()) {
    incompleteFields.push('employment');
  }

  // Check education
  const hasEducation = (
    profile.education ||
    profile.educationCollege ||
    profile.degree ||
    profile.college ||
    profile.graduation ||
    profile.university ||
    profile.masters ||
    profile.bachelors ||
    profile.diploma ||
    profile.certification
  );

  const hasValidEducation = () => {
    const fields = [
      profile.education,
      profile.educationCollege,
      profile.degree,
      profile.college,
      profile.graduation,
      profile.university,
      profile.masters,
      profile.bachelors,
      profile.diploma,
      profile.certification
    ];
    
    return fields.some(field => 
      field && 
      field !== 'Not specified' && 
      field !== 'Fresher' && 
      field !== '{}' &&
      typeof field === 'string' &&
      field.trim().length > 0
    );
  };

  if (!hasEducation && !hasValidEducation()) {
    incompleteFields.push('education');
  }

  // Check location
  const hasLocation = (profile.location || '').trim().length > 0 && profile.location?.toLowerCase() !== 'unknown';
  if (!hasLocation) {
    incompleteFields.push('location');
  }

  return incompleteFields;
};

// Skill synonym map — aliases + related terms across all job domains
const SKILL_ALIASES: Record<string, string[]> = {
  // ── Frontend ──
  'javascript': ['js', 'es6', 'es2015', 'ecmascript', 'vanilla js', 'es2016', 'es2017', 'es2018', 'es2019', 'es2020'],
  'typescript': ['ts', 'typed javascript'],
  'react': ['reactjs', 'react.js', 'react js'],
  'react native': ['rn', 'react-native'],
  'next.js': ['nextjs', 'next js', 'next'],
  'vue.js': ['vuejs', 'vue js', 'vue', 'nuxt', 'nuxtjs'],
  'angular': ['angularjs', 'angular2', 'angular js'],
  'html': ['html5', 'html/css', 'hypertext markup language'],
  'css': ['css3', 'sass', 'scss', 'less', 'stylesheets', 'cascading style sheets'],
  'tailwind': ['tailwindcss', 'tailwind css'],
  'bootstrap': ['bootstrap css', 'bootstrap framework'],
  'redux': ['redux toolkit', 'react redux', 'state management'],
  'webpack': ['bundler', 'vite', 'parcel', 'rollup'],
  // ── Backend ──
  'node.js': ['nodejs', 'node js', 'node'],
  'express': ['expressjs', 'express.js', 'express js'],
  'python': ['py', 'python3', 'python programming'],
  'django': ['django rest framework', 'drf'],
  'flask': ['flask python', 'flask framework'],
  'fastapi': ['fast api'],
  'java': ['core java', 'java programming', 'java development', 'java se', 'java ee'],
  'spring': ['spring boot', 'springboot', 'spring framework', 'spring mvc', 'spring cloud'],
  'c#': ['csharp', 'dotnet', '.net', 'asp.net', 'dot net', 'c sharp'],
  'php': ['php7', 'php8', 'laravel', 'symfony', 'codeigniter'],
  'ruby': ['ruby on rails', 'rails', 'ror'],
  'go': ['golang', 'go lang'],
  'rust': ['rust lang', 'rust programming'],
  'kotlin': ['kotlin android', 'kotlin jvm'],
  'scala': ['scala programming', 'akka', 'play framework'],
  'c++': ['cpp', 'c plus plus', 'cplusplus'],
  'c': ['c programming', 'c language'],
  // ── Database ──
  'sql': ['mysql', 'postgresql', 'postgres', 'sqlite', 'mssql', 'oracle', 'pl/sql', 'tsql', 't-sql', 'relational database', 'rdbms'],
  'mysql': ['my sql', 'mysql database'],
  'postgresql': ['postgres', 'psql', 'pg'],
  'mongodb': ['mongo', 'mongo db', 'nosql', 'document database'],
  'redis': ['redis cache', 'in-memory database', 'caching'],
  'elasticsearch': ['elastic search', 'elk stack', 'kibana'],
  'firebase': ['firestore', 'firebase database', 'realtime database'],
  'dynamodb': ['dynamo db', 'aws dynamodb'],
  'cassandra': ['apache cassandra'],
  // ── Cloud / DevOps ──
  'amazon web services': ['aws', 'aws cloud', 'amazon cloud'],
  'google cloud platform': ['gcp', 'google cloud'],
  'microsoft azure': ['azure', 'azure cloud'],
  'docker': ['containerization', 'containers', 'dockerfile'],
  'kubernetes': ['k8s', 'container orchestration', 'k8'],
  'devops': ['ci/cd', 'continuous integration', 'continuous deployment', 'continuous delivery', 'devsecops'],
  'jenkins': ['jenkins pipeline', 'jenkins ci'],
  'terraform': ['infrastructure as code', 'iac', 'terraform cloud'],
  'ansible': ['ansible automation', 'configuration management'],
  'git': ['github', 'gitlab', 'bitbucket', 'version control', 'source control', 'git flow'],
  'linux': ['unix', 'bash', 'shell scripting', 'shell script', 'bash scripting', 'command line', 'cli'],
  // ── AI / ML / Data ──
  'machine learning': ['ml', 'deep learning', 'neural networks', 'supervised learning', 'unsupervised learning'],
  'artificial intelligence': ['ai', 'generative ai', 'gen ai', 'llm', 'large language model'],
  'data science': ['data scientist', 'data engineering', 'data engineer', 'big data'],
  'data analysis': ['data analytics', 'data analyst', 'business analytics', 'data visualization', 'reporting'],
  'python data': ['pandas', 'numpy', 'scipy', 'matplotlib', 'seaborn'],
  'tensorflow': ['tf', 'keras', 'deep learning framework'],
  'pytorch': ['torch', 'deep learning framework'],
  'tableau': ['tableau desktop', 'tableau server', 'data visualization'],
  'power bi': ['powerbi', 'microsoft power bi', 'bi reporting'],
  'excel': ['microsoft excel', 'ms excel', 'spreadsheet', 'vlookup', 'pivot table'],
  'spark': ['apache spark', 'pyspark', 'spark streaming'],
  'hadoop': ['apache hadoop', 'hdfs', 'mapreduce', 'hive'],
  // ── Mobile ──
  'android': ['android development', 'android studio', 'android sdk'],
  'ios': ['swift', 'xcode', 'objective-c', 'ios development'],
  'flutter': ['dart', 'flutter development'],
  // ── QA / Testing ──
  'manual testing': ['manual test', 'functional testing', 'exploratory testing', 'black box testing', 'white box testing', 'regression testing', 'smoke testing', 'sanity testing', 'uat', 'user acceptance testing', 'system testing', 'integration testing'],
  'automation testing': ['selenium', 'cypress', 'playwright', 'test automation', 'automated testing', 'appium', 'testng', 'junit', 'pytest', 'robot framework'],
  'sdlc': ['software development life cycle', 'software development lifecycle', 'development lifecycle'],
  'stlc': ['software testing life cycle', 'software testing lifecycle', 'testing lifecycle'],
  'bug tracking': ['defect tracking', 'bug reporting', 'jira', 'bugzilla', 'mantis', 'defect management', 'issue tracking', 'bug management'],
  'api testing': ['rest api testing', 'postman', 'soap testing', 'rest assured', 'api automation'],
  'performance testing': ['load testing', 'stress testing', 'jmeter', 'gatling', 'k6'],
  'test cases': ['test case writing', 'test case design', 'test planning', 'test plan', 'test scripts', 'test documentation'],
  'quality assurance': ['qa', 'qc', 'quality control', 'software quality', 'software testing', 'testing'],
  // ── Design / UI-UX ──
  'ui/ux': ['ui ux', 'user interface', 'user experience', 'ux design', 'ui design', 'product design'],
  'figma': ['figma design', 'ui design tool'],
  'adobe xd': ['xd', 'adobe experience design'],
  'photoshop': ['adobe photoshop', 'ps', 'image editing'],
  'illustrator': ['adobe illustrator', 'vector design'],
  'wireframing': ['wireframe', 'prototyping', 'mockup', 'prototype'],
  // ── Project Management / Soft Skills ──
  'agile': ['scrum', 'kanban', 'sprint', 'agile methodology', 'agile development', 'agile scrum'],
  'project management': ['pmp', 'project planning', 'project coordination', 'project delivery'],
  'communication': ['verbal communication', 'written communication', 'interpersonal skills', 'presentation skills', 'public speaking'],
  'leadership': ['team lead', 'team leadership', 'people management', 'mentoring', 'coaching'],
  'problem solving': ['analytical thinking', 'critical thinking', 'troubleshooting', 'decision making'],
  'microsoft office': ['ms office', 'word', 'powerpoint', 'outlook', 'office 365', 'excel', 'ms word', 'ms excel'],
  // ── Networking / Security ──
  'networking': ['tcp/ip', 'dns', 'dhcp', 'network protocols', 'lan', 'wan', 'network administration'],
  'cybersecurity': ['information security', 'infosec', 'network security', 'ethical hacking', 'penetration testing', 'vapt'],
  'cloud security': ['aws security', 'azure security', 'iam', 'identity management'],
  // ── Finance / Accounting ──
  'accounting': ['bookkeeping', 'accounts payable', 'accounts receivable', 'financial accounting', 'tally', 'tally erp', 'tally prime', 'general ledger', 'ledger'],
  'tally': ['tally erp', 'tally prime', 'tally accounting', 'tally software'],
  'financial analysis': ['financial modeling', 'financial reporting', 'budgeting', 'forecasting', 'variance analysis', 'mis reporting', 'mis'],
  'taxation': ['gst', 'income tax', 'tax filing', 'indirect tax', 'direct tax', 'tds', 'vat', 'tax compliance', 'tax returns'],
  'auditing': ['internal audit', 'external audit', 'statutory audit', 'audit report', 'audit compliance'],
  'banking': ['retail banking', 'corporate banking', 'investment banking', 'trade finance', 'treasury', 'loans', 'credit analysis'],
  'insurance': ['life insurance', 'general insurance', 'underwriting', 'claims', 'actuarial'],
  'finance': ['financial management', 'corporate finance', 'working capital', 'cash flow', 'fund management'],
  // ── Marketing / Sales ──
  'digital marketing': ['seo', 'sem', 'social media marketing', 'content marketing', 'email marketing', 'online marketing', 'performance marketing', 'growth marketing'],
  'seo': ['search engine optimization', 'on-page seo', 'off-page seo', 'technical seo', 'keyword research', 'link building'],
  'social media': ['social media management', 'instagram', 'facebook marketing', 'linkedin marketing', 'twitter marketing', 'youtube marketing'],
  'content writing': ['copywriting', 'blog writing', 'technical writing', 'content creation', 'article writing', 'creative writing'],
  'sales': ['business development', 'lead generation', 'crm', 'b2b sales', 'b2c sales', 'inside sales', 'field sales', 'direct sales', 'channel sales', 'retail sales', 'telesales', 'cold calling'],
  'marketing': ['brand management', 'product marketing', 'market research', 'campaign management', 'go-to-market', 'btl', 'atl'],
  'customer service': ['customer support', 'client servicing', 'customer care', 'customer success', 'after sales service', 'helpdesk'],
  'retail': ['store management', 'merchandising', 'visual merchandising', 'inventory management', 'pos', 'point of sale'],
  // ── HR / Operations ──
  'human resources': ['hr', 'recruitment', 'talent acquisition', 'payroll', 'hrms', 'hris', 'hr operations', 'hr generalist', 'hr manager'],
  'recruitment': ['talent acquisition', 'sourcing', 'hiring', 'staffing', 'headhunting', 'campus recruitment', 'bulk hiring'],
  'payroll': ['payroll processing', 'salary processing', 'payroll management', 'pf', 'esi', 'statutory compliance'],
  'operations': ['operations management', 'process improvement', 'supply chain', 'logistics', 'warehouse management', 'inventory control'],
  'supply chain': ['logistics', 'procurement', 'vendor management', 'sourcing', 'import export', 'freight', 'shipping'],
  'logistics': ['freight forwarding', 'warehouse', 'dispatch', 'delivery management', 'fleet management', 'transportation'],
  // ── SAP / ERP ──
  'sap': ['sap erp', 'sap s/4hana', 'sap hana', 'sap ewm', 'sap fico', 'sap mm', 'sap sd', 'abap', 'sap basis', 'sap hr', 'sap pp'],
  'erp': ['enterprise resource planning', 'sap', 'oracle erp', 'microsoft dynamics', 'netsuite', 'odoo'],
  // ── Gulf / Middle East Jobs ──
  'gulf experience': ['gcc experience', 'middle east experience', 'uae experience', 'saudi experience', 'qatar experience', 'kuwait experience', 'oman experience', 'bahrain experience'],
  'driving license': ['uae driving license', 'gcc driving license', 'light motor vehicle', 'lmv', 'heavy vehicle license', 'hvl'],
  'visa': ['visit visa', 'employment visa', 'residence visa', 'work permit', 'iqama'],
  // ── Civil / Construction / Engineering ──
  'civil engineering': ['structural engineering', 'construction management', 'site engineering', 'civil works', 'rcc', 'reinforced concrete'],
  'autocad': ['auto cad', 'cad design', 'drafting', '2d drafting', '3d modeling', 'revit', 'staad pro', 'etabs'],
  'construction': ['site supervision', 'project execution', 'building construction', 'infrastructure', 'road construction', 'bridge construction'],
  'quantity surveying': ['qs', 'bill of quantities', 'boq', 'cost estimation', 'tendering', 'rate analysis'],
  'project planning': ['primavera', 'ms project', 'project scheduling', 'gantt chart', 'wbs', 'project control'],
  'mep': ['mechanical electrical plumbing', 'hvac', 'electrical works', 'plumbing', 'fire fighting', 'fire suppression'],
  'surveying': ['land surveying', 'total station', 'gps survey', 'leveling', 'topographic survey'],
  // ── Mechanical / Manufacturing ──
  'mechanical engineering': ['machine design', 'product design', 'manufacturing engineering', 'industrial engineering'],
  'autocad mechanical': ['solidworks', 'catia', 'pro-e', 'creo', 'nx cad', 'unigraphics', 'ansys'],
  'production': ['production planning', 'production management', 'manufacturing', 'shop floor', 'assembly line', 'lean manufacturing'],
  'quality control': ['qc', 'quality inspection', 'incoming quality', 'in-process quality', 'final inspection', 'iqc', 'fqc'],
  'maintenance': ['preventive maintenance', 'predictive maintenance', 'breakdown maintenance', 'tpm', 'cmms'],
  'welding': ['tig welding', 'mig welding', 'arc welding', 'fabrication', 'structural fabrication'],
  'cnc': ['cnc machining', 'cnc programming', 'cnc operator', 'lathe', 'milling', 'turning'],
  // ── Electrical / Electronics ──
  'electrical engineering': ['power systems', 'electrical design', 'panel design', 'switchgear', 'hv', 'lv', 'mv'],
  'plc': ['plc programming', 'scada', 'dcs', 'automation', 'industrial automation', 'hmi'],
  'embedded systems': ['embedded c', 'microcontroller', 'arduino', 'raspberry pi', 'rtos', 'firmware'],
  'vlsi': ['vhdl', 'verilog', 'fpga', 'asic', 'chip design', 'semiconductor'],
  // ── Healthcare / Medical ──
  'nursing': ['staff nurse', 'registered nurse', 'rn', 'icu nursing', 'ot nursing', 'critical care nursing', 'patient care'],
  'doctor': ['mbbs', 'md', 'ms', 'physician', 'general practitioner', 'gp', 'specialist', 'consultant'],
  'pharmacy': ['pharmacist', 'clinical pharmacy', 'drug dispensing', 'pharmaceutical', 'pharma'],
  'medical laboratory': ['lab technician', 'medical lab', 'pathology', 'microbiology', 'hematology', 'biochemistry'],
  'radiology': ['x-ray', 'mri', 'ct scan', 'ultrasound', 'radiographer', 'imaging'],
  'physiotherapy': ['physical therapy', 'physiotherapist', 'rehabilitation', 'sports therapy'],
  'healthcare management': ['hospital administration', 'health informatics', 'clinical management', 'medical coding', 'icd coding'],
  // ── Education / Teaching ──
  'teaching': ['teacher', 'faculty', 'lecturer', 'instructor', 'trainer', 'tutor', 'educator'],
  'curriculum development': ['lesson planning', 'course design', 'instructional design', 'e-learning', 'lms'],
  'training': ['corporate training', 'soft skills training', 'technical training', 'learning and development', 'l&d'],
  // ── Hospitality / Hotel ──
  'hospitality': ['hotel management', 'front office', 'housekeeping', 'food and beverage', 'f&b', 'banquet', 'concierge'],
  'food service': ['restaurant management', 'kitchen management', 'chef', 'catering', 'barista', 'bartender'],
  'travel': ['travel management', 'ticketing', 'gds', 'amadeus', 'galileo', 'tour operations', 'travel consultant'],
  // ── Media / Creative ──
  'video editing': ['premiere pro', 'final cut pro', 'davinci resolve', 'after effects', 'motion graphics'],
  'graphic design': ['photoshop', 'illustrator', 'indesign', 'canva', 'visual design', 'branding'],
  'photography': ['photo editing', 'lightroom', 'product photography', 'event photography'],
  'journalism': ['news writing', 'reporting', 'editing', 'media', 'broadcast', 'print media'],
  // ── Legal ──
  'legal': ['lawyer', 'advocate', 'attorney', 'legal counsel', 'corporate law', 'litigation', 'contract drafting'],
  'compliance': ['regulatory compliance', 'legal compliance', 'risk management', 'governance', 'grc'],
  // ── Real Estate ──
  'real estate': ['property management', 'real estate sales', 'leasing', 'property valuation', 'facility management'],
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

// Skill match — exact, alias, or phrase containment (e.g. "manual testing" inside "basic knowledge of manual testing")
const skillsMatch = (userSkill: string, jobSkill: string): boolean => {
  const u = canonicalize(userSkill);
  const j = canonicalize(jobSkill);
  if (u === j) return true;

  // Alias match: check if canonicalized forms share the same canonical
  const uCanon = ALIAS_TO_CANONICAL[normalizeSkill(userSkill)] || u;
  const jCanon = ALIAS_TO_CANONICAL[normalizeSkill(jobSkill)] || j;
  if (uCanon === jCanon) return true;

  // Prefix/boundary match for compound skills (e.g. "react" in "react.js")
  if (u.length >= 3 && j.length >= 3) {
    const shorter = u.length < j.length ? u : j;
    const longer = u.length < j.length ? j : u;
    const idx = longer.indexOf(shorter);
    if (idx === 0 && (longer.length === shorter.length || /[^a-z0-9]/.test(longer[shorter.length]))) return true;
  }

  // Phrase containment: user skill (>=4 chars) appears as a whole word sequence inside job skill
  // Handles: "manual testing" inside "basic knowledge of manual testing"
  if (u.length >= 4 && j.length > u.length) {
    const escaped = u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`).test(j)) return true;
  }
  if (j.length >= 4 && u.length > j.length) {
    const escaped = j.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`).test(u)) return true;
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

  // 1. Skill match (45%) — use backend-calculated if provided, otherwise enhanced matching
  const backendSkillScore = job.skillScore || job.backendSkillMatch || null;
  const matched: string[] = [];
  const missing: string[] = [];
  let skillScore = 0;

  if (backendSkillScore !== null && typeof backendSkillScore === 'number') {
    // Backend calculation with enhanced skill matching (our JS improvements)
    jobSkillsRaw.forEach(js => {
      const found = userSkillsRaw.some(us => skillsMatch(us, js));
      if (found) matched.push(js);   // original casing for display
      else missing.push(js);          // original casing for display
    });
    // Use backend score if available for consistency
    skillScore = backendSkillScore;
  } else {
    // Enhanced semantic matching for complete backend parity
    const getSkillCategory = (skill: string): string | null => {
      const normalized = skill.toLowerCase();
      const categories: Record<string, string> = {
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
      return cat1 !== null && cat2 !== null && cat1 === cat2;
    };

    jobSkillsRaw.forEach(js => {
      const matchedFound = userSkillsRaw.some(us => {
        const direct = skillsMatch(us, js);
        if (direct) return true;
        const semantic = isSemanticallyRelated(us, js);
        if (semantic) return true;
        return false;
      });
      if (matchedFound) matched.push(js);
      else missing.push(js);
    });

    skillScore = jobSkillsRaw.length > 0 ? Math.round((matched.length / jobSkillsRaw.length) * 100) : 0;
  }

  // 2. Role match (20%) — word-level match with semantic relationships
  const jobTitle = (job.title || job.jobTitle || '').toLowerCase();
  const userTitle = (profile.jobTitle || profile.title || '').toLowerCase();
  let roleScore = 0; // no baseline when both titles exist
  if (jobTitle && userTitle) {
    // Define semantic relationship rules for similar roles
    const semanticRelationshipRules = [
      // QA/Testing relationships
      { targetKeywords: ['tester', 'qa', 'quality assurance', 'manual testing', 'automation testing', 'test engineer'], score: 90 },
      { targetKeywords: ['test manager', 'qa manager', 'test lead', 'testing manager'], score: 85 },
      { targetKeywords: ['software tester', 'sdet', 'selenium tester'], score: 95 },
      
      // Development relationships  
      { targetKeywords: ['developer', 'software engineer', 'backend developer', 'frontend developer', 'full stack developer'], score: 80 },
      { targetKeywords: ['data engineer', 'data scientist', 'ml engineer'], score: 85 },
      
      // Business/Analysis relationships
      { targetKeywords: ['analyst', 'business analyst', 'data analyst'], score: 75 },
      
      // Management relationships
      { targetKeywords: ['manager', 'lead', 'supervisor', 'coordinator'], score: 70 },
      
      // Tech relationships
      { targetKeywords: ['architect', 'senior', 'principal'], score: 60 }
    ];
    
    const stopWords = new Set(['and', 'the', 'for', 'of', 'in', 'at', 'to', 'a', 'an', 'jr', 'sr', 'iii', 'ii']);
    const jWords = jobTitle.split(/\s+/).filter((w: string) => w.length > 2 && !stopWords.has(w));
    const uWords = userTitle.split(/\s+/).filter((w: string) => w.length > 2 && !stopWords.has(w));
    
    if (jWords.length > 0 && uWords.length > 0) {
      // Calculate direct word overlap score
      const commonDirect = jWords.filter((w: string) => uWords.some((uw: string) => uw.includes(w) || w.includes(uw)));
      const directOverlapScore = Math.round((commonDirect.length / jWords.length) * 100);
      
      // Apply semantic relationship rules
      let semanticScore = 0;
      for (const rule of semanticRelationshipRules) {
        const hasJobKeyword = jWords.some((word: string) => rule.targetKeywords.some((kw: string) => 
          word.includes(kw) || kw.includes(word)
        ));
        const hasUserKeyword = uWords.some((word: string) => rule.targetKeywords.some((kw: string) => 
          word.includes(kw) || kw.includes(word)
        ));
        if (hasJobKeyword || hasUserKeyword) {
          semanticScore = Math.max(semanticScore, rule.score);
        }
      }
      
      // Use highest score between direct overlap and semantic relationships
      roleScore = Math.max(directOverlapScore, semanticScore);
    } else {
      // Fallback for malformed titles
      const jobLower = jobTitle.toLowerCase();
      const userLower = userTitle.toLowerCase();
      if (jobLower.includes(userLower) || userLower.includes(jobLower)) {
        roleScore = 85;
      }
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
  const isSeniorJob = seniorWords.some((w: string) => jobTitle.includes(w));
  const isJuniorJob = juniorWords.some((w: string) => jobTitle.includes(w));
  let experienceScore = 65;
  if (isSeniorJob) experienceScore = expYears >= 5 ? 100 : expYears >= 3 ? 75 : 40;
  else if (isJuniorJob) experienceScore = expYears <= 2 ? 100 : expYears <= 4 ? 75 : 55;
  else experienceScore = expYears >= 3 ? 90 : expYears >= 1 ? 80 : 65;

  // 4. Location match (10%)
  const jobLoc = (job.location || '').toLowerCase();
  const userLoc = (profile.location || '').toLowerCase();
  let locationScore = 50; // neutral default — location unknown or not critical
  if (jobLoc && userLoc) {
    if (jobLoc.includes('remote') || userLoc.includes('remote')) locationScore = 100;
    else if (jobLoc.includes(userLoc) || userLoc.includes(jobLoc)) locationScore = 100;
    else {
      // City-level match — check if any word matches
      const jWords = jobLoc.split(/[,\s]+/).filter((w: string) => w.length > 2);
      const uWords = userLoc.split(/[,\s]+/).filter((w: string) => w.length > 2);
      const cityMatch = jWords.some((jw: string) => uWords.some((uw: string) => jw === uw || jw.includes(uw) || uw.includes(jw)));
      locationScore = cityMatch ? 100 : 40;
    }
  }

  // 5. Education match (10%)
  // Only calculate if candidate has education details
  const hasEducation = (
    profile.educationCollege ||
    profile.education ||
    profile.degree ||
    profile.college ||
    profile.graduation ||
    profile.university ||
    profile.masters ||
    profile.bachelors ||
    profile.diploma ||
    profile.certification ||
    (profile.education && profile.education !== 'Not specified' && profile.education !== 'Fresher') ||
    (profile.educationCollege && profile.educationCollege !== '{}')
  );
  
  let educationScore = 0; // Set to 0 by default if no education
  if (hasEducation) {
    const eduObj = profile.educationCollege;
    const eduStr = typeof eduObj === 'object'
      ? String(eduObj?.degree || eduObj?.college || '').toLowerCase()
      : String(profile.education || '').toLowerCase();
    
    educationScore = 40;
    if (eduStr.includes('phd') || eduStr.includes('doctorate')) educationScore = 100;
    else if (eduStr.includes('master') || eduStr.includes('mba') || eduStr.includes('m.tech') || eduStr.includes('m.e')) educationScore = 90;
    else if (eduStr.includes('bachelor') || eduStr.includes('b.tech') || eduStr.includes('b.e') || eduStr.includes('b.sc') || eduStr.includes('degree')) educationScore = 75;
    else if (eduStr.includes('diploma') || eduStr.includes('hsc') || eduStr.includes('12th')) educationScore = 55;
    else if (eduStr) educationScore = 50;
  }

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
