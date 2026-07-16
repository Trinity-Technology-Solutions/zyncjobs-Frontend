interface WeightedConfidence {
  company: number;
  title: number;
  location: number;
  experience: number;
  skills: number;
  responsibilities: number;
  requirements: number;
  salary: number;
  overall: number;
}

interface ParsedJob {
  title: string;
  company: string;
  location: string;
  experience: string;
  salary: {
    min: string;
    max: string;
    currency: string;
    payRate: string;
  };
  responsibilities: string[];
  mandatorySkills: string[];
  goodToHaveSkills: string[];
  interviewProcess: string[];
  confidence: WeightedConfidence;
}

export class JobParser {
  // Invalid words for company name filtering
  private static readonly INVALID_COMPANY_WORDS = [
    'interview', 'mode', 'face', 'round', 'drive', 'office',
    'weekend', 'hiring', 'recruitment', 'process', 'immediate',
    'joiners', 'urgent', 'asap', 'apply', 'now'
  ];

  // Invalid keywords for requirements filtering
  private static readonly INVALID_REQUIREMENT_KEYWORDS = [
    'Interview', 'Hiring Drive', 'Face-to-Face', 'Offer Rollout',
    'Round', 'Office Location', 'Weekend', 'Mode', 'Process',
    'Immediate Joiners', 'Apply Now', 'Contact', 'Email'
  ];

  // All possible section headings for boundary protection (70+ variations)
  private static readonly ALL_HEADINGS = [
    // Job basics
    'Job Title', 'Position', 'Role', 'Organization',
    'Work Location', 'Location', 'Office Location', 'Based In',
    
    // Experience & Education
    'Experience', 'Experience Required', 'Years of Experience',
    'Work Experience', 'Professional Experience', 'Minimum Experience',
    'Notice Period', 'Employment Type', 'Salary Range', 'Priority',
    'Job Summary', 'Preferred Candidate Profile', 'Preferred Candidate',
    'Education', 'Educational Qualifications', 'Academic Background',
    
    // Skills sections (all variations)
    'Mandatory Skills', 'Required Skills', 'Must Have Skills',
    'Primary Skills', 'Technical Skills', 'Core Skills',
    'Essential Skills', 'Must Have', 'Tech Stack',
    'Technologies Required', 'Skills Required', 'Key Skills',
    'Good to Have Skills', 'Nice to Have Skills', 'Preferred Skills',
    'Additional Skills', 'Bonus Skills', 'Optional Skills',
    'Good to Have', 'Nice to Have', 'Preferred',
    
    // Job content
    'Responsibilities', 'Key Responsibilities', 'Job Responsibilities',
    'Roles and Responsibilities', 'Primary Responsibilities',
    'What You Will Do', 'Your Role', 'Duties', 'Tasks',
    'Requirements', 'Job Requirements', 'Qualifications',
    'Minimum Requirements', 'Basic Requirements', 'Eligibility',
    'Key Responsibilities', 'Role Overview', 'About the Role',

    // Process & Benefits
    'Interview Process', 'Selection Process', 'Hiring Process',
    'Benefits', 'What We Offer', 'Perks', 'Salary', 'Compensation',
    'About Us', 'About the Company', 'Company Overview',
    'How to Apply', 'Preferred Qualifications', 'Role Overview'
  ];

  // Section aliases for flexible matching
  private static readonly SECTION_ALIASES = {
    mandatorySkills: [
      'Mandatory Skills', 'Required Skills', 'Must Have Skills',
      'Primary Skills', 'Technical Skills', 'Core Skills',
      'Essential Skills', 'Must Have', 'Tech Stack',
      'Technologies Required', 'Skills Required', 'Key Skills'
    ],
    goodToHaveSkills: [
      'Good to Have Skills', 'Nice to Have Skills', 'Preferred Skills',
      'Additional Skills', 'Bonus Skills', 'Optional Skills',
      'Good to Have', 'Nice to Have', 'Preferred'
    ],
    responsibilities: [
      'Responsibilities', 'Key Responsibilities', 'Job Responsibilities',
      'Roles and Responsibilities', 'What You Will Do', 'Your Role', 'Duties'
    ],
    interviewProcess: [
      'Interview Process', 'Selection Process', 'Hiring Process',
      'Interview Details', 'Process Details', 'Next Steps'
    ]
  };

  // Skill name mappings for proper casing
  private static readonly SKILL_CASE_MAP: Record<string, string> = {
    'javascript': 'JavaScript', 'typescript': 'TypeScript', 'nodejs': 'Node.js',
    'reactjs': 'React', 'react': 'React', 'angular': 'Angular', 'vue.js': 'Vue.js',
    'python': 'Python', 'java': 'Java', 'c#': 'C#', 'c++': 'C++', 'php': 'PHP',
    'sql': 'SQL', 'mysql': 'MySQL', 'postgresql': 'PostgreSQL', 'mongodb': 'MongoDB',
    'redis': 'Redis', 'aws': 'AWS', 'azure': 'Azure', 'gcp': 'GCP',
    'docker': 'Docker', 'kubernetes': 'Kubernetes', 'git': 'Git',
    'bigquery': 'BigQuery', 'kafka': 'Kafka', 'spark': 'Apache Spark'
  };

  /**
   * Main parsing function - handles all job description parsing
   */
  static parseJobDescription(text: string): ParsedJob {
    const cleanText = this.cleanText(text);
    const sections = this.extractSections(cleanText);

    const title = this.extractJobTitle(cleanText, sections);
    const company = this.extractCompanyName(cleanText);
    const location = this.extractLocation(cleanText, sections);
    const experience = this.extractExperience(cleanText, sections);
    const salary = this.extractSalary(cleanText);
    const responsibilities = this.extractResponsibilities(cleanText, sections);
    const mandatorySkills = this.extractMandatorySkills(cleanText, sections);
    const goodToHaveSkills = this.extractGoodToHaveSkills(cleanText, sections);
    const interviewProcess = this.extractInterviewProcess(cleanText, sections);

    const confidence = this.calculateWeightedConfidence({
      title, company, location, experience, salary,
      responsibilities, mandatorySkills, sections, cleanText
    });

    return {
      title, company, location, experience, salary,
      responsibilities, mandatorySkills, goodToHaveSkills,
      interviewProcess, confidence
    };
  }

  /**
   * Clean and normalize text for better parsing
   */
  private static cleanText(text: string): string {
    return text
      .replace(/\r/g, '')                    // Remove carriage returns
      .replace(/\t/g, ' ')                   // Convert tabs to spaces
      .replace(/\*\*([^*]+)\*\*/g, '$1')     // Strip markdown bold **text**
      .replace(/^#{1,3}\s*/gm, '')           // Strip markdown headers ## / ###
      .replace(/\n{2,}/g, '\n')              // Remove multiple newlines
      .replace(/\s{2,}/g, ' ')               // Remove multiple spaces
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove unicode zero-width chars
      .replace(/=\n/g, '')                   // Remove email artifacts
      .replace(/=20/g, ' ')
      .replace(/â€¢/g, '•')                  // Fix bullet points
      .replace(/â€"/g, '-')
      .replace(/[""]/g, '"')                 // Normalize quotes
      .replace(/['']/g, "'")
      .replace(/&amp;/g, '&')               // Decode HTML entities
      .trim();
  }

  /**
   * Extract sections with boundary protection
   */
  private static extractSections(text: string): Record<string, string> {
    const sections: Record<string, string> = {};
    
    // Create regex for all headings
    const allHeadingsEscaped = this.ALL_HEADINGS
      .map(heading => heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    
    // Consume rest of heading line (e.g. "Good to Have (but Not Mandatory)")
    const sectionRegex = new RegExp(`(${allHeadingsEscaped})[^\\n]*\\n`, 'gi');
    const parts = text.split(sectionRegex);
    
    for (let i = 1; i < parts.length; i += 2) {
      const header = parts[i]?.trim();
      let content = parts[i + 1]?.trim() || '';
      
      if (header && content) {
        // Apply boundary protection
        content = this.applyBoundaryProtection(content);
        
        const normalizedHeader = header.toLowerCase();
        sections[normalizedHeader] = content;
        
        // Map to section type
        for (const [sectionType, aliases] of Object.entries(this.SECTION_ALIASES)) {
          if (aliases.some(alias => alias.toLowerCase() === normalizedHeader)) {
            sections[sectionType] = content;
            break;
          }
        }
      }
    }

    return sections;
  }

  /**
   * Apply boundary protection - stop at next heading
   */
  private static applyBoundaryProtection(content: string): string {
    const headingPattern = new RegExp(
      `^\\s*(${this.ALL_HEADINGS.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\s*:?\\s*`,
      'im'
    );
    
    const match = content.match(headingPattern);
    if (match) {
      return content.substring(0, match.index).trim();
    }
    return content;
  }

  /**
   * Extract company name with validation
   */
  private static extractCompanyName(text: string): string {
    const cleanText = text.replace(
      /(?:interview\s+process|recruitment\s+drive|interview\s+mode|drive\s+type|locations?\s+open\s+for)[\s\S]*/gi,
      ''
    ).trim();

    // Priority 1: Explicit "Company:" or "Company Name:" label
    const companyLabelMatch = cleanText.match(/^\s*Company\s+(?:Name)?\s*:\s*(.+)/im);
    if (companyLabelMatch) {
      let company = companyLabelMatch[1].split('\n')[0].trim();
      const isInvalid = this.INVALID_COMPANY_WORDS.some(w => company.toLowerCase().includes(w));
      if (!isInvalid && company.length > 2 && company.length < 50) return company;
    }

    // Priority 2: ZyncJobs header pattern — "ZYNCJOBS | Job Description — ... , [City], [Country]"
    // Extract org name from header subtitle if present
    const zyncMatch = cleanText.match(/ZYNCJOBS.*?—\s*([\w\s,]+?)\n/i);
    if (zyncMatch) {
      // The subtitle is a project/org description, not a company — skip
    }

    // Priority 3: "Connecting Talent" or org line right after ZYNCJOBS header
    const orgMatch = cleanText.match(/ZyncJobs.*?\n([A-Z][\w\s&.,]{3,50})(?:\n|$)/i);
    if (orgMatch) {
      const candidate = orgMatch[1].trim();
      const isInvalid = this.INVALID_COMPANY_WORDS.some(w => candidate.toLowerCase().includes(w));
      if (!isInvalid && candidate.length > 2 && candidate.length < 50) return candidate;
    }

    // Priority 4: "X is looking/hiring/seeking"
    const seekingMatch = cleanText.match(/([A-Z][a-zA-Z0-9\s&\.\-,']{3,40})\s+(?:is|are)\s+(?:looking|seeking|hiring)/i);
    if (seekingMatch) {
      let company = seekingMatch[1].trim().replace(/[,\.!]+$/, '');
      const isInvalid = this.INVALID_COMPANY_WORDS.some(w => company.toLowerCase().includes(w));
      if (!isInvalid && company.length >= 3 && company.length <= 40) return company;
    }

    return '';
  }

  /**
   * Extract job title
   */
  private static extractJobTitle(text: string, sections: Record<string, string>): string {
    if (sections['job title']) return sections['job title'].split('\n')[0].trim();

    const patterns = [
      // After cleanText strips ##, the title becomes the first non-empty uppercase line
      /^([A-Z][A-Za-z\s\/\-&,]{2,60})$/m,
      /Job Title\s*:?\s*([\s\S]*?)(?=Work Location|Company|Experience|$)/i,
      /(?:job\s+title|position|role)\s*[:\-]\s*([^\n\r]+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let title = match[1].trim();
        title = this.applyBoundaryProtection(title);
        title = title.replace(/[-\|–—].*$/g, '').trim();
        if (title.length > 3 && title.length < 100) return title;
      }
    }

    return 'Software Developer';
  }

  /**
   * Extract location
   */
  private static extractLocation(text: string, sections: Record<string, string>): string {
    if (sections['work location'] || sections['location']) {
      return (sections['work location'] || sections['location']).split('\n')[0].trim();
    }

    // Markdown bold label: **Location:** Muscat, Oman
    const boldMatch = text.match(/Location\s*:\s*([^\n]+)/i);
    if (boldMatch) return boldMatch[1].trim();

    const locationMatch = text.match(/(?:Work Location|Location)\s*:?\s*([\s\S]*?)(?=Experience|Company|$)/i);
    if (locationMatch) return this.applyBoundaryProtection(locationMatch[1].trim());

    return '';
  }

  private static extractExperience(text: string, sections: Record<string, string>): string {
    // Check sections first — take only first line (the actual value)
    const rawSection = (sections['experience required'] || sections['experience'] || '').split('\n')[0].trim();
    if (rawSection) {
      const m = rawSection.match(/(\d+)\s*(?:[-\u2013\u2014]|\bto\b)\s*(\d+)/);
      if (m) return `${m[1]}-${m[2]} years`;
      const s = rawSection.match(/(\d+)/);
      if (s && parseInt(s[1]) <= 40) return `${s[1]}+ years`;
    }

    // Direct scan of original text for "Experience Required" label
    // Use original text (before cleanText collapses newlines) via regex
    const labelPatterns = [
      /experience\s+required\s*[:\-]?\s*(\d+)\s*[-\u2013\u2014to]+\s*(\d+)\s*(?:years?|yrs?)/i,
      /experience\s+required\s*[:\-]?\s*(\d+)\+?\s*(?:years?|yrs?)/i,
      // Handles inline collapsed text: "Experience Required 11 – 15 Years Notice Period"
      /experience\s+required\s+(\d+)\s*[-\u2013\u2014]+\s*(\d+)/i,
      /experience\s+required\s+(\d+)/i,
      /(\d+)\s*[-\u2013\u2014]\s*(\d+)\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i,
      /(\d+)\s+to\s+(\d+)\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i,
      /(?:minimum|at\s+least)\s*(\d+)\s*[-\u2013\u2014to]+\s*(\d+)\s*(?:years?|yrs?)/i,
    ];
    for (const p of labelPatterns) {
      const m = text.match(p);
      if (m && m[1]) {
        const a = parseInt(m[1]), b = m[2] ? parseInt(m[2]) : NaN;
        if (!isNaN(a) && a <= 40) {
          if (!isNaN(b) && b <= 40 && b >= a) return `${a}-${b} years`;
          return `${a}+ years`;
        }
      }
    }
    return '';
  }

  /**
   * Extract salary information
   */
  private static extractSalary(text: string): { min: string; max: string; currency: string; payRate: string; payType?: string } {
    const defaultSalary = { min: '', max: '', currency: 'INR', payRate: 'per year' };

    // Priority 1: "up to X LPA" / "upto X LPA" → Maximum amount
    const uptoPattern = /(?:up\s*to|upto)\s*([0-9]+(?:\.[0-9]+)?)\s*(?:lpa|lakhs?\s*per\s*annum|lakhs?)/i;
    const uptoMatch = text.match(uptoPattern);
    if (uptoMatch) {
      let max = parseFloat(uptoMatch[1].replace(/,/g, ''));
      if (/lpa|lakh/i.test(uptoMatch[0])) max *= 100000;
      if (max > 0) {
        return { min: '', max: String(Math.round(max)), currency: 'INR', payRate: 'per year', payType: 'Maximum amount' };
      }
    }

    // Priority 2: Range patterns — handles "₹2 LPA – ₹3 LPA", "2-3 LPA", "2 to 3 lakhs"
    const patterns = [
      // ₹2 LPA – ₹3 LPA  (LPA after each number)
      /₹\s*([0-9]+(?:\.[0-9]+)?)\s*(?:lpa|lakhs?(?:\s*per\s*annum)?)\s*[-–—to]+\s*₹?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:lpa|lakhs?(?:\s*per\s*annum)?)/gi,
      // 2 LPA – 3 LPA  (no ₹)
      /([0-9]+(?:\.[0-9]+)?)\s*(?:lpa|lakhs?(?:\s*per\s*annum)?)\s*[-–—to]+\s*([0-9]+(?:\.[0-9]+)?)\s*(?:lpa|lakhs?(?:\s*per\s*annum)?)/gi,
      // 2-3 LPA  (LPA only after second number)
      /([0-9,]+(?:\.[0-9]+)?)\s*[-–—to]+\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:lpa|lakhs?\s*per\s*annum|lakhs?)/gi,
      // ₹2 – ₹3
      /₹\s*([0-9,]+(?:\.[0-9]+)?)\s*[-–—to]+\s*₹?\s*([0-9,]+(?:\.[0-9]+)?)/gi,
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(text);
      if (match) {
        let min = parseFloat(match[1].replace(/,/g, ''));
        let max = parseFloat(match[2].replace(/,/g, ''));
        if (/lpa|lakh/i.test(match[0])) { min *= 100000; max *= 100000; }
        if (min > 0 && max > 0 && max >= min) {
          return {
            min: String(Math.round(min)),
            max: String(Math.round(max)),
            currency: /₹|INR|lakh/i.test(text) ? 'INR' : 'USD',
            payRate: 'per year'
          };
        }
      }
    }

    return defaultSalary;
  }

  /**
   * Extract responsibilities
   */
  private static extractResponsibilities(text: string, sections: Record<string, string>): string[] {
    if (sections.responsibilities) {
      return this.extractBulletPoints(sections.responsibilities).slice(0, 8);
    }

    // Try to find responsibilities section using aliases
    for (const alias of this.SECTION_ALIASES.responsibilities) {
      const regex = new RegExp(`${alias}\\s*:?\\s*([\\s\\S]*?)(?=${this.ALL_HEADINGS.join('|')}|$)`, 'i');
      const match = text.match(regex);
      if (match && match[1]) {
        const content = this.applyBoundaryProtection(match[1].trim());
        return this.extractBulletPoints(content).slice(0, 8);
      }
    }

    return [];
  }

  /**
   * Extract mandatory skills
   */
  private static extractMandatorySkills(text: string, sections: Record<string, string>): string[] {
    if (sections.mandatorySkills) {
      const bullets = this.extractBulletPoints(sections.mandatorySkills);
      const filtered = this.filterValidRequirements(bullets);
      return this.deduplicateSkills(filtered).slice(0, 10);
    }

    // Try to find skills section using aliases
    for (const alias of this.SECTION_ALIASES.mandatorySkills) {
      const regex = new RegExp(`${alias}\\s*:?\\s*([\\s\\S]*?)(?=${this.ALL_HEADINGS.join('|')}|$)`, 'i');
      const match = text.match(regex);
      if (match && match[1]) {
        const content = this.applyBoundaryProtection(match[1].trim());
        const bullets = this.extractBulletPoints(content);
        const filtered = this.filterValidRequirements(bullets);
        return this.deduplicateSkills(filtered).slice(0, 10);
      }
    }

    return [];
  }

  /**
   * Extract good to have skills
   */
  private static extractGoodToHaveSkills(text: string, sections: Record<string, string>): string[] {
    if (sections.goodToHaveSkills) {
      const bullets = this.extractBulletPoints(sections.goodToHaveSkills);
      const filtered = this.filterValidRequirements(bullets);
      return this.deduplicateSkills(filtered).slice(0, 8);
    }

    // Try to find good to have section using aliases
    for (const alias of this.SECTION_ALIASES.goodToHaveSkills) {
      const regex = new RegExp(`${alias}\\s*:?\\s*([\\s\\S]*?)(?=${this.ALL_HEADINGS.join('|')}|$)`, 'i');
      const match = text.match(regex);
      if (match && match[1]) {
        const content = this.applyBoundaryProtection(match[1].trim());
        const bullets = this.extractBulletPoints(content);
        const filtered = this.filterValidRequirements(bullets);
        return this.deduplicateSkills(filtered).slice(0, 8);
      }
    }

    return [];
  }

  /**
   * Extract interview process
   */
  private static extractInterviewProcess(text: string, sections: Record<string, string>): string[] {
    if (sections.interviewProcess) {
      return this.extractBulletPoints(sections.interviewProcess);
    }

    // Try to find interview process section using aliases
    for (const alias of this.SECTION_ALIASES.interviewProcess) {
      const regex = new RegExp(`${alias}\\s*:?\\s*([\\s\\S]*?)(?=${this.ALL_HEADINGS.join('|')}|$)`, 'i');
      const match = text.match(regex);
      if (match && match[1]) {
        const content = this.applyBoundaryProtection(match[1].trim());
        return this.extractBulletPoints(content);
      }
    }

    return [];
  }

  /**
   * Extract bullet points from text
   */
  private static extractBulletPoints(text: string): string[] {
    const bullets: string[] = [];
    
    // Match various bullet point formats
    const bulletRegex = /(?:^|\n)\s*[•\-\*\d+\.)\s]+(.+)/gm;
    let match;
    
    while ((match = bulletRegex.exec(text)) !== null) {
      const bullet = match[1].trim();
      if (bullet.length > 5 && bullet.length < 200) {
        bullets.push(bullet);
      }
    }

    // If no bullets found, split by lines
    if (bullets.length === 0) {
      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 5 && !/^[\(\[]/.test(line));
      bullets.push(...lines.slice(0, 10));
    }

    return bullets;
  }

  /**
   * Filter out invalid requirements
   */
  private static filterValidRequirements(requirements: string[]): string[] {
    return requirements.filter(item => {
      const itemLower = item.toLowerCase();
      return !this.INVALID_REQUIREMENT_KEYWORDS.some(keyword =>
        itemLower.includes(keyword.toLowerCase())
      );
    });
  }

  /**
   * Deduplicate and normalize skills
   */
  private static deduplicateSkills(skills: string[]): string[] {
    const skillMap = new Map<string, string>();
    
    skills.forEach(skill => {
      const normalizedSkill = skill.trim();
      const lowerSkill = normalizedSkill.toLowerCase();
      
      if (!skillMap.has(lowerSkill)) {
        const properCaseSkill = this.SKILL_CASE_MAP[lowerSkill] || normalizedSkill;
        skillMap.set(lowerSkill, properCaseSkill);
      }
    });
    
    return Array.from(skillMap.values());
  }

  /**
   * Calculate weighted confidence scores
   */
  private static calculateWeightedConfidence(data: {
    title: string;
    company: string;
    location: string;
    experience: string;
    salary: any;
    responsibilities: string[];
    mandatorySkills: string[];
    sections: Record<string, string>;
    cleanText: string;
  }): WeightedConfidence {
    
    // Individual field confidence calculations
    const companyConfidence = data.company ? 
      (this.INVALID_COMPANY_WORDS.some(word => data.company.toLowerCase().includes(word)) ? 0.3 : 0.95) : 0.1;
    
    const titleConfidence = data.title && data.title !== 'Software Developer' ? 0.9 : 
      (data.sections['job title'] ? 0.7 : 0.4);
    
    const locationConfidence = data.location ? 0.85 : 0.2;
    const experienceConfidence = data.experience ? 0.8 : 0.3;
    
    const skillsConfidence = data.mandatorySkills.length > 0 ? 
      Math.min(0.95, 0.5 + (data.mandatorySkills.length * 0.1)) : 0.2;
    
    const responsibilitiesConfidence = data.responsibilities.length > 0 ? 
      Math.min(0.9, 0.4 + (data.responsibilities.length * 0.1)) : 0.3;
    
    const requirementsConfidence = (data.sections.mandatorySkills || data.sections.requirements) ? 0.85 : 0.4;
    const salaryConfidence = (data.salary.min && data.salary.max) ? 0.8 : 0.2;
    
    // Weighted overall confidence
    const overall = (
      companyConfidence * 0.2 +
      titleConfidence * 0.15 +
      skillsConfidence * 0.25 +
      responsibilitiesConfidence * 0.15 +
      locationConfidence * 0.1 +
      experienceConfidence * 0.1 +
      salaryConfidence * 0.05
    );
    
    return {
      company: Math.round(companyConfidence * 100) / 100,
      title: Math.round(titleConfidence * 100) / 100,
      location: Math.round(locationConfidence * 100) / 100,
      experience: Math.round(experienceConfidence * 100) / 100,
      skills: Math.round(skillsConfidence * 100) / 100,
      responsibilities: Math.round(responsibilitiesConfidence * 100) / 100,
      requirements: Math.round(requirementsConfidence * 100) / 100,
      salary: Math.round(salaryConfidence * 100) / 100,
      overall: Math.round(overall * 100) / 100
    };
  }
}

// Usage:
// const result = JobParser.parseJobDescription(jobText);
// 
// Frontend warnings:
// if (result.confidence.company < 0.7) showWarning("⚠️ Please verify company name");
// if (result.confidence.skills < 0.6) showWarning("❌ Please review skills");