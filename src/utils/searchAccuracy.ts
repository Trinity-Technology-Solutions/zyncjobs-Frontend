// Enhanced Search Accuracy System
export class SearchAccuracyEngine {
  private static instance: SearchAccuracyEngine;
  
  static getInstance(): SearchAccuracyEngine {
    if (!SearchAccuracyEngine.instance) {
      SearchAccuracyEngine.instance = new SearchAccuracyEngine();
    }
    return SearchAccuracyEngine.instance;
  }

  // Advanced matching algorithm with scoring
  public getAccurateMatches(input: string, dataset: string[], type: 'job' | 'company' | 'skill' | 'location' = 'job'): Array<{item: string, score: number}> {
    if (!input || input.length < 2) return [];
    
    const searchTerm = input.toLowerCase().trim();
    const matches: Array<{item: string, score: number}> = [];
    
    dataset.forEach(item => {
      const itemLower = item.toLowerCase();
      let score = 0;
      
      // Exact match (highest priority)
      if (itemLower === searchTerm) {
        score = 100;
      }
      // Starts with (very high priority)
      else if (itemLower.startsWith(searchTerm)) {
        score = 90;
      }
      // Word boundary match (high priority)
      else if (this.hasWordBoundaryMatch(itemLower, searchTerm)) {
        score = 80;
      }
      // Contains match (medium priority)
      else if (itemLower.includes(searchTerm)) {
        score = 60;
      }
      // Fuzzy match (low priority)
      else if (this.fuzzyMatch(itemLower, searchTerm)) {
        score = 40;
      }
      
      // Boost score based on relevance to search type
      if (score > 0) {
        score += this.getRelevanceBoost(item, searchTerm, type);
        matches.push({ item, score });
      }
    });
    
    // Sort by score (highest first) and return top matches
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }

  // Check for word boundary matches
  private hasWordBoundaryMatch(text: string, searchTerm: string): boolean {
    const words = text.split(/[\s\-_.,()]+/);
    return words.some(word => word.startsWith(searchTerm));
  }

  // Simple fuzzy matching
  private fuzzyMatch(text: string, searchTerm: string): boolean {
    if (searchTerm.length < 3) return false;
    
    let searchIndex = 0;
    for (let i = 0; i < text.length && searchIndex < searchTerm.length; i++) {
      if (text[i] === searchTerm[searchIndex]) {
        searchIndex++;
      }
    }
    return searchIndex === searchTerm.length;
  }

  // Get relevance boost based on search type and common patterns
  private getRelevanceBoost(item: string, searchTerm: string, type: string): number {
    let boost = 0;
    const itemLower = item.toLowerCase();
    
    switch (type) {
      case 'job':
        // Boost for common job title patterns
        if (this.isJobTitle(itemLower)) boost += 20;
        if (this.matchesJobPattern(itemLower, searchTerm)) boost += 15;
        break;
        
      case 'company':
        // Boost for company-specific patterns
        if (this.isCompanyName(itemLower)) boost += 20;
        break;
        
      case 'skill':
        // Boost for technical skills
        if (this.isTechnicalSkill(itemLower)) boost += 15;
        break;
        
      case 'location':
        // Boost for known locations
        if (this.isKnownLocation(itemLower)) boost += 20;
        break;
    }
    
    return boost;
  }

  // Enhanced job title patterns
  private isJobTitle(text: string): boolean {
    const jobTitlePatterns = [
      'engineer', 'developer', 'manager', 'analyst', 'designer', 'architect',
      'specialist', 'consultant', 'coordinator', 'director', 'lead', 'senior',
      'junior', 'intern', 'associate', 'principal', 'staff', 'head'
    ];
    return jobTitlePatterns.some(pattern => text.includes(pattern));
  }

  private matchesJobPattern(text: string, searchTerm: string): boolean {
    const jobPatterns = {
      'so': ['software', 'solution', 'social'],
      'dev': ['developer', 'development', 'devops'],
      'eng': ['engineer', 'engineering'],
      'man': ['manager', 'management'],
      'des': ['designer', 'design'],
      'ana': ['analyst', 'analytics'],
      'dat': ['data', 'database'],
      'web': ['web', 'website'],
      'mob': ['mobile', 'app'],
      'fro': ['frontend', 'front-end'],
      'bac': ['backend', 'back-end'],
      'ful': ['fullstack', 'full-stack', 'full stack']
    };
    
    const pattern = jobPatterns[searchTerm.substring(0, 3) as keyof typeof jobPatterns];
    return pattern ? pattern.some(p => text.includes(p)) : false;
  }

  private isCompanyName(text: string): boolean {
    const companyIndicators = [
      'inc', 'corp', 'ltd', 'llc', 'company', 'technologies', 'solutions',
      'systems', 'services', 'consulting', 'group', 'enterprises'
    ];
    return companyIndicators.some(indicator => text.includes(indicator));
  }

  private isTechnicalSkill(text: string): boolean {
    const techSkills = [
      'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node',
      'typescript', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
      'html', 'css', 'sql', 'mongodb', 'postgresql', 'mysql',
      'aws', 'azure', 'docker', 'kubernetes', 'git', 'jenkins'
    ];
    return techSkills.some(skill => text.includes(skill));
  }

  private isKnownLocation(text: string): boolean {
    const locations = [
      'chennai', 'bangalore', 'hyderabad', 'mumbai', 'delhi', 'pune',
      'new york', 'california', 'texas', 'london', 'singapore', 'remote'
    ];
    return locations.some(location => text.includes(location));
  }

  // Get categorized suggestions (like Dice portal)
  public getCategorizedSuggestions(
    input: string, 
    jobTitles: string[], 
    companies: string[], 
    skills: string[]
  ): {keywords: string[], jobTitles: string[], companies: string[]} {
    
    const keywordMatches = this.getAccurateMatches(input, skills, 'skill');
    const jobTitleMatches = this.getAccurateMatches(input, jobTitles, 'job');
    const companyMatches = this.getAccurateMatches(input, companies, 'company');
    
    return {
      keywords: keywordMatches.slice(0, 3).map(m => m.item),
      jobTitles: jobTitleMatches.slice(0, 3).map(m => m.item),
      companies: companyMatches.slice(0, 3).map(m => m.item)
    };
  }

  // Enhanced location matching
  public getLocationMatches(input: string, locations: string[]): string[] {
    const matches = this.getAccurateMatches(input, locations, 'location');
    return matches.slice(0, 8).map(m => m.item);
  }

  // Smart job search with context awareness
  public getContextAwareJobSuggestions(input: string, context?: {
    userSkills?: string[],
    userLocation?: string,
    userExperience?: string,
    recentSearches?: string[]
  }): string[] {
    
    const baseJobTitles = [
      'Software Engineer', 'Software Developer', 'Full Stack Developer',
      'Frontend Developer', 'Backend Developer', 'DevOps Engineer',
      'Data Scientist', 'Data Analyst', 'Machine Learning Engineer',
      'Product Manager', 'Project Manager', 'Business Analyst',
      'UI/UX Designer', 'Graphic Designer', 'Web Designer',
      'Marketing Manager', 'Sales Manager', 'Account Manager',
      'Quality Assurance Engineer', 'Cybersecurity Analyst',
      'Cloud Engineer', 'Mobile Developer', 'Game Developer'
    ];
    
    let matches = this.getAccurateMatches(input, baseJobTitles, 'job');
    
    // Boost based on user context
    if (context) {
      matches = matches.map(match => {
        let boostedScore = match.score;
        
        // Boost if matches user skills
        if (context.userSkills?.some(skill => 
          match.item.toLowerCase().includes(skill.toLowerCase())
        )) {
          boostedScore += 25;
        }
        
        // Boost if in recent searches
        if (context.recentSearches?.some(search => 
          match.item.toLowerCase().includes(search.toLowerCase())
        )) {
          boostedScore += 15;
        }
        
        return { ...match, score: boostedScore };
      });
      
      matches.sort((a, b) => b.score - a.score);
    }
    
    return matches.slice(0, 8).map(m => m.item);
  }

  // Company search with industry awareness
  public getCompanySuggestions(input: string, companies: string[]): string[] {
    const matches = this.getAccurateMatches(input, companies, 'company');
    return matches.slice(0, 8).map(m => m.item);
  }

  // Skill-based search improvements
  public getSkillSuggestions(input: string): string[] {
    const skills = [
      // Programming Languages
      'JavaScript', 'Python', 'Java', 'TypeScript', 'C++', 'C#', 'Go', 'Rust', 'Swift', 'Kotlin',
      // Frontend
      'React', 'Angular', 'Vue.js', 'HTML', 'CSS', 'Sass', 'Bootstrap', 'Tailwind CSS',
      // Backend
      'Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot', 'ASP.NET', 'Ruby on Rails',
      // Databases
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'SQLite',
      // Cloud & DevOps
      'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'CI/CD',
      // Data & AI
      'Machine Learning', 'Data Science', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
      // Design
      'Figma', 'Adobe Photoshop', 'Adobe Illustrator', 'Sketch', 'InVision',
      // Other
      'Agile', 'Scrum', 'Project Management', 'Business Analysis', 'Digital Marketing'
    ];
    
    const matches = this.getAccurateMatches(input, skills, 'skill');
    return matches.slice(0, 8).map(m => m.item);
  }
}

export const searchAccuracy = SearchAccuracyEngine.getInstance();