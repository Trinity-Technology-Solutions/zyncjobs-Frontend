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
    'Job Title', 'Position', 'Role', 'Company', 'Organization',
    'Work Location', 'Location', 'Office Location', 'Based In',
    
    // Experience & Education
    'Experience', 'Experience Required', 'Years of Experience',
    'Work Experience', 'Professional Experience', 'Minimum Experience',
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
    
    // Process & Benefits
    'Interview Process', 'Selection Process', 'Hiring Process',
    'Benefits', 'What We Offer', 'Perks', 'Salary', 'Compensation',
    'About Us', 'About the Company', 'Company Overview'
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
      .replace(/\n{2,}/g, '\n')              // Remove multiple newlines
      .replace(/\s{2,}/g, ' ')               // Remove multiple spaces
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove unicode chars
      .replace(/=\n/g, '')                   // Remove email artifacts
      .replace(/=20/g, ' ')
      .replace(/â€¢/g, '•')                  // Fix bullet points
      .replace(/â€"/g, '-')
      .replace(/[""]/g, '"')                 // Normalize quotes
      .replace(/['']/g, "'")
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
    
    const sectionRegex = new RegExp(`(${allHeadingsEscaped})\\s*:?\\s*`, 'gi');
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
    // Priority 1: Explicit Company label
    const companyMatch = text.match(/Company\s*:?\s*(.+)/i);
    if (companyMatch) {
      let company = companyMatch[1].trim();
      company = this.applyBoundaryProtection(company);
      
      const isInvalid = this.INVALID_COMPANY_WORDS.some(word =>
        company.toLowerCase().includes(word)
      );
      
      if (!isInvalid && company.length > 2 && company.length < 50) {
        return company;
      }
    }

    // Priority 2: Pattern-based extraction
    const patterns = [
      /^([A-Z][a-zA-Z0-9\s&\.\-,']{2,40})\s*[-–—]\s*[A-Z]/m,
      /([A-Z][a-zA-Z0-9\s&\.\-,']{3,40})\s+(?:is|are)\s+(?:looking|seeking|hiring)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let company = match[1].trim().replace(/[,\.!]+$/, '');
        
        const isInvalid = this.INVALID_COMPANY_WORDS.some(word =>
          company.toLowerCase().includes(word)
        );
        
        if (!isInvalid && company.length >= 3 && company.length <= 40) {
          return company;
        }
      }
    }

    return '';
  }

  /**
   * Extract job title
   */
  private static extractJobTitle(text: string, sections: Record<string, string>): string {
    if (sections['job title']) {
      return sections['job title'];
    }

    const patterns = [
      /Job Title\s*:?\s*([\s\S]*?)(?=Work Location|Company|Experience|$)/i,
      /(?:job\s+title|position|role)\s*[:\-]\s*([^\n\r]+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        let title = match[1].trim();
        title = this.applyBoundaryProtection(title);
        title = title.replace(/[-\|–—].*$/g, '').trim();
        
        if (title.length > 3 && title.length < 100) {
          return title;
        }
      }
    }

    return 'Software Developer';
  }

  /**
   * Extract location
   */
  private static extractLocation(text: string, sections: Record<string, string>): string {
    if (sections['work location'] || sections['location']) {
      return sections['work location'] || sections['location'];
    }

    const locationMatch = text.match(/(?:Work Location|Location)\s*:?\s*([\s\S]*?)(?=Experience|Company|$)/i);
    if (locationMatch) {
      return this.applyBoundaryProtection(locationMatch[1].trim());
    }

    return '';
  }

  /**
   * Extract experience
   */
  private static extractExperience(text: string, sections: Record<string, string>): string {
    if (sections['experience required'] || sections['experience']) {
      return sections['experience required'] || sections['experience'];
    }

    const experienceMatch = text.match(/Experience Required\s*:?\s*([\s\S]*?)(?=Mandatory Skills|Requirements|$)/i);
    if (experienceMatch) {
      return this.applyBoundaryProtection(experienceMatch[1].trim());
    }

    return '';
  }

  /**
   * Extract salary information
   */
  private static extractSalary(text: string): { min: string; max: string; currency: string; payRate: string } {
    const defaultSalary = { min: '', max: '', currency: 'INR', payRate: 'per year' };
    
    const patterns = [
      /([0-9,]+(?:\.[0-9]+)?)\s*[-–to]+\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:lpa|lakhs?\s*per\s*annum|lakhs?)/gi,
      /₹\s*([0-9,]+(?:\.[0-9]+)?)\s*[-–to]+\s*₹?\s*([0-9,]+(?:\.[0-9]+)?)/gi
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(text);
      if (match) {
        let min = parseFloat(match[1].replace(/,/g, ''));
        let max = parseFloat(match[2].replace(/,/g, ''));
        
        if (/lpa|lakh/i.test(match[0])) {
          min *= 100000;
          max *= 100000;
        }
        
        if (min > 0 && max > 0) {
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
        .filter(line => line.length > 5);
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