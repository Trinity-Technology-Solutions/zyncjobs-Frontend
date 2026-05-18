// Enhanced Search Accuracy System with Advanced Algorithms
export class SearchAccuracyEngine {
  private static instance: SearchAccuracyEngine;
  
  static getInstance(): SearchAccuracyEngine {
    if (!SearchAccuracyEngine.instance) {
      SearchAccuracyEngine.instance = new SearchAccuracyEngine();
    }
    return SearchAccuracyEngine.instance;
  }

  // Advanced matching algorithm with multiple scoring methods
  public getAccurateMatches(input: string, dataset: string[], type: 'job' | 'company' | 'skill' | 'location' = 'job'): Array<{item: string, score: number}> {
    if (!input || input.length < 1) return [];
    
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
        score = 95 - (itemLower.length - searchTerm.length) * 0.5; // Prefer shorter matches
      }
      // Word boundary match (high priority)
      else if (this.hasWordBoundaryMatch(itemLower, searchTerm)) {
        score = 85;
      }
      // Contains match (medium-high priority)
      else if (itemLower.includes(searchTerm)) {
        const position = itemLower.indexOf(searchTerm);
        score = 70 - position * 0.5; // Prefer matches closer to start
      }
      // Levenshtein distance match (medium priority)
      else if (this.levenshteinDistance(itemLower, searchTerm) <= Math.max(2, Math.floor(searchTerm.length * 0.3))) {
        const distance = this.levenshteinDistance(itemLower, searchTerm);
        score = 60 - distance * 5;
      }
      // Fuzzy match (low-medium priority)
      else if (this.fuzzyMatch(itemLower, searchTerm)) {
        score = 45;
      }
      // Phonetic match (low priority)
      else if (this.phoneticMatch(itemLower, searchTerm)) {
        score = 35;
      }
      // Abbreviation match (low priority)
      else if (this.abbreviationMatch(itemLower, searchTerm)) {
        score = 30;
      }
      
      // Boost score based on relevance to search type
      if (score > 0) {
        score += this.getRelevanceBoost(item, searchTerm, type);
        score += this.getPopularityBoost(item, type);
        matches.push({ item, score: Math.min(100, score) });
      }
    });
    
    // Sort by score (highest first) and return top matches
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }

  // Levenshtein distance for typo tolerance
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  // Phonetic matching for similar sounding words
  private phoneticMatch(text: string, searchTerm: string): boolean {
    const phoneticMap: Record<string, string[]> = {
      'javascript': ['js', 'java script', 'ecmascript'],
      'python': ['py', 'python3'],
      'react': ['reactjs', 'react.js'],
      'angular': ['angularjs', 'ng'],
      'node': ['nodejs', 'node.js'],
      'css': ['css3', 'cascading'],
      'html': ['html5', 'markup'],
      'sql': ['sequel', 'database'],
      'ui': ['user interface'],
      'ux': ['user experience'],
      'ai': ['artificial intelligence'],
      'ml': ['machine learning'],
      'api': ['rest', 'restful'],
      'dev': ['developer', 'development'],
      'eng': ['engineer', 'engineering'],
      'mgr': ['manager', 'management'],
      'sr': ['senior'],
      'jr': ['junior'],
      'fullstack': ['full stack', 'full-stack'],
      'frontend': ['front end', 'front-end'],
      'backend': ['back end', 'back-end']
    };
    
    for (const [key, variants] of Object.entries(phoneticMap)) {
      if ((key === searchTerm && variants.some(v => text.includes(v))) ||
          (variants.includes(searchTerm) && text.includes(key))) {
        return true;
      }
    }
    return false;
  }

  // Abbreviation matching
  private abbreviationMatch(text: string, searchTerm: string): boolean {
    if (searchTerm.length < 2) return false;
    
    const words = text.split(/[\s\-_.,()]+/).filter(w => w.length > 0);
    const abbreviation = words.map(w => w[0]).join('').toLowerCase();
    
    return abbreviation.includes(searchTerm) || searchTerm.includes(abbreviation);
  }

  // Popularity boost based on common terms
  private getPopularityBoost(item: string, type: string): number {
    const popularTerms: Record<string, string[]> = {
      job: ['developer', 'engineer', 'manager', 'analyst', 'designer', 'react', 'python', 'javascript', 'java'],
      skill: ['javascript', 'python', 'react', 'java', 'sql', 'html', 'css', 'node', 'angular', 'aws'],
      location: ['remote', 'bangalore', 'mumbai', 'delhi', 'chennai', 'hyderabad', 'pune', 'new york', 'california'],
      company: ['google', 'microsoft', 'amazon', 'apple', 'facebook', 'netflix', 'uber', 'airbnb']
    };
    
    const popular = popularTerms[type] || [];
    const itemLower = item.toLowerCase();
    
    for (const term of popular) {
      if (itemLower.includes(term)) {
        return 5;
      }
    }
    return 0;
  }

  // Check for word boundary matches
  private hasWordBoundaryMatch(text: string, searchTerm: string): boolean {
    const words = text.split(/[\s\-_.,()]+/);
    return words.some(word => word.startsWith(searchTerm));
  }

  // Simple fuzzy matching with improved algorithm
  private fuzzyMatch(text: string, searchTerm: string): boolean {
    if (searchTerm.length < 2) return false;
    
    let searchIndex = 0;
    let consecutiveMatches = 0;
    let maxConsecutive = 0;
    
    for (let i = 0; i < text.length && searchIndex < searchTerm.length; i++) {
      if (text[i] === searchTerm[searchIndex]) {
        searchIndex++;
        consecutiveMatches++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
      } else {
        consecutiveMatches = 0;
      }
    }
    
    // Require at least 70% of characters to match and some consecutive matches
    return searchIndex >= Math.ceil(searchTerm.length * 0.7) && maxConsecutive >= 2;
  }

  // Get relevance boost based on search type and common patterns
  private getRelevanceBoost(item: string, searchTerm: string, type: string): number {
    let boost = 0;
    const itemLower = item.toLowerCase();
    
    switch (type) {
      case 'job':
        // Boost for common job title patterns
        if (this.isJobTitle(itemLower)) boost += 15;
        if (this.matchesJobPattern(itemLower, searchTerm)) boost += 12;
        if (this.hasExperienceLevel(itemLower)) boost += 8;
        break;
        
      case 'company':
        // Boost for company-specific patterns
        if (this.isCompanyName(itemLower)) boost += 15;
        if (this.hasCompanyKeywords(itemLower)) boost += 10;
        break;
        
      case 'skill':
        // Boost for technical skills
        if (this.isTechnicalSkill(itemLower)) boost += 12;
        if (this.isFrameworkOrLibrary(itemLower)) boost += 10;
        if (this.isProgrammingLanguage(itemLower)) boost += 15;
        break;
        
      case 'location':
        // Boost for known locations
        if (this.isKnownLocation(itemLower)) boost += 15;
        if (this.isMetroCity(itemLower)) boost += 12;
        if (this.isCountry(itemLower)) boost += 8;
        break;
    }
    
    return boost;
  }

  // Enhanced job title patterns
  private isJobTitle(text: string): boolean {
    const jobTitlePatterns = [
      'engineer', 'developer', 'manager', 'analyst', 'designer', 'architect',
      'specialist', 'consultant', 'coordinator', 'director', 'lead', 'senior',
      'junior', 'intern', 'associate', 'principal', 'staff', 'head', 'chief',
      'executive', 'officer', 'administrator', 'technician', 'supervisor'
    ];
    return jobTitlePatterns.some(pattern => text.includes(pattern));
  }

  private hasExperienceLevel(text: string): boolean {
    const levels = ['senior', 'junior', 'lead', 'principal', 'staff', 'entry', 'mid', 'experienced'];
    return levels.some(level => text.includes(level));
  }

  private matchesJobPattern(text: string, searchTerm: string): boolean {
    const jobPatterns = {
      'soft': ['software', 'solution'],
      'dev': ['developer', 'development', 'devops'],
      'eng': ['engineer', 'engineering'],
      'man': ['manager', 'management'],
      'des': ['designer', 'design'],
      'ana': ['analyst', 'analytics', 'analysis'],
      'dat': ['data', 'database'],
      'web': ['web', 'website'],
      'mob': ['mobile', 'app'],
      'fro': ['frontend', 'front-end'],
      'bac': ['backend', 'back-end'],
      'ful': ['fullstack', 'full-stack', 'full stack'],
      'ui': ['ui', 'user interface'],
      'ux': ['ux', 'user experience'],
      'qa': ['qa', 'quality assurance', 'testing'],
      'ml': ['machine learning', 'ml', 'ai'],
      'sec': ['security', 'cybersecurity'],
      'cloud': ['cloud', 'aws', 'azure', 'gcp']
    };
    
    const searchPrefix = searchTerm.substring(0, 3);
    const pattern = jobPatterns[searchPrefix as keyof typeof jobPatterns];
    return pattern ? pattern.some(p => text.includes(p)) : false;
  }

  private hasCompanyKeywords(text: string): boolean {
    const keywords = ['tech', 'solutions', 'systems', 'services', 'consulting', 'labs', 'studios'];
    return keywords.some(keyword => text.includes(keyword));
  }

  private isCompanyName(text: string): boolean {
    const companyIndicators = [
      'inc', 'corp', 'ltd', 'llc', 'company', 'technologies', 'solutions',
      'systems', 'services', 'consulting', 'group', 'enterprises', 'labs',
      'studios', 'works', 'digital', 'software', 'pvt'
    ];
    return companyIndicators.some(indicator => text.includes(indicator));
  }

  private isProgrammingLanguage(text: string): boolean {
    const languages = [
      'javascript', 'python', 'java', 'typescript', 'c++', 'c#', 'go', 'rust',
      'swift', 'kotlin', 'php', 'ruby', 'scala', 'r', 'matlab', 'perl'
    ];
    return languages.some(lang => text.includes(lang));
  }

  private isFrameworkOrLibrary(text: string): boolean {
    const frameworks = [
      'react', 'angular', 'vue', 'node', 'express', 'django', 'flask',
      'spring', 'laravel', 'rails', 'jquery', 'bootstrap', 'tailwind'
    ];
    return frameworks.some(fw => text.includes(fw));
  }

  private isTechnicalSkill(text: string): boolean {
    const techSkills = [
      'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node',
      'typescript', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
      'html', 'css', 'sql', 'mongodb', 'postgresql', 'mysql',
      'aws', 'azure', 'docker', 'kubernetes', 'git', 'jenkins',
      'machine learning', 'data science', 'artificial intelligence'
    ];
    return techSkills.some(skill => text.includes(skill));
  }

  private isMetroCity(text: string): boolean {
    const metroCities = [
      'mumbai', 'delhi', 'bangalore', 'hyderabad', 'chennai', 'kolkata',
      'pune', 'ahmedabad', 'new york', 'los angeles', 'chicago', 'houston',
      'london', 'paris', 'berlin', 'tokyo', 'singapore', 'sydney'
    ];
    return metroCities.some(city => text.includes(city));
  }

  private isCountry(text: string): boolean {
    const countries = ['india', 'usa', 'uk', 'canada', 'australia', 'germany', 'france', 'singapore'];
    return countries.some(country => text.includes(country));
  }

  private isKnownLocation(text: string): boolean {
    const locations = [
      'chennai', 'bangalore', 'hyderabad', 'mumbai', 'delhi', 'pune', 'kolkata',
      'new york', 'california', 'texas', 'london', 'singapore', 'remote', 'work from home'
    ];
    return locations.some(location => text.includes(location));
  }

  // Get categorized suggestions with improved accuracy
  public getCategorizedSuggestions(
    input: string, 
    jobTitles: string[], 
    companies: string[], 
    skills: string[]
  ): {keywords: string[], jobTitles: string[], companies: string[], skills: string[]} {
    
    const keywordMatches = this.getAccurateMatches(input, skills, 'skill');
    const jobTitleMatches = this.getAccurateMatches(input, jobTitles, 'job');
    const companyMatches = this.getAccurateMatches(input, companies, 'company');
    const skillMatches = this.getAccurateMatches(input, skills, 'skill');
    
    return {
      keywords: keywordMatches.slice(0, 4).map(m => m.item),
      jobTitles: jobTitleMatches.slice(0, 4).map(m => m.item),
      companies: companyMatches.slice(0, 4).map(m => m.item),
      skills: skillMatches.slice(0, 4).map(m => m.item)
    };
  }

  // Enhanced location matching with regional awareness
  public getLocationMatches(input: string, locations: string[]): string[] {
    const matches = this.getAccurateMatches(input, locations, 'location');
    
    // Add regional suggestions for Indian cities
    const regionalSuggestions = this.getRegionalSuggestions(input);
    const combinedMatches = [...matches.map(m => m.item), ...regionalSuggestions]
      .filter((item, index, arr) => arr.indexOf(item) === index) // Remove duplicates
      .slice(0, 10);
    
    return combinedMatches;
  }

  private getRegionalSuggestions(input: string): string[] {
    const inputLower = input.toLowerCase();
    const regionalMap: Record<string, string[]> = {
      'bang': ['Bangalore', 'Bengaluru'],
      'beng': ['Bangalore', 'Bengaluru'],
      'mum': ['Mumbai', 'Bombay'],
      'bomb': ['Mumbai', 'Bombay'],
      'del': ['Delhi', 'New Delhi'],
      'chen': ['Chennai', 'Madras'],
      'madr': ['Chennai', 'Madras'],
      'hyd': ['Hyderabad', 'Secunderabad'],
      'pun': ['Pune', 'Poona'],
      'kol': ['Kolkata', 'Calcutta'],
      'calc': ['Kolkata', 'Calcutta'],
      'ny': ['New York', 'NYC'],
      'nyc': ['New York', 'NYC'],
      'sf': ['San Francisco', 'Bay Area'],
      'la': ['Los Angeles', 'LA'],
      'lon': ['London', 'UK'],
      'sing': ['Singapore', 'SG']
    };
    
    for (const [key, suggestions] of Object.entries(regionalMap)) {
      if (inputLower.includes(key)) {
        return suggestions;
      }
    }
    return [];
  }

  // Smart job search with context awareness and better suggestions
  public getContextAwareJobSuggestions(input: string, context?: {
    userSkills?: string[],
    userLocation?: string,
    userExperience?: string,
    recentSearches?: string[]
  }): string[] {
    
    const baseJobTitles = [
      // Software Development
      'Software Engineer', 'Software Developer', 'Full Stack Developer',
      'Frontend Developer', 'Backend Developer', 'Mobile Developer',
      'React Developer', 'Angular Developer', 'Vue.js Developer',
      'Node.js Developer', 'Python Developer', 'Java Developer',
      'JavaScript Developer', 'TypeScript Developer', 'PHP Developer',
      'C# Developer', 'Go Developer', 'Ruby Developer',
      
      // DevOps & Cloud
      'DevOps Engineer', 'Cloud Engineer', 'Site Reliability Engineer',
      'AWS Engineer', 'Azure Engineer', 'Kubernetes Engineer',
      'Docker Engineer', 'Infrastructure Engineer',
      
      // Data & AI
      'Data Scientist', 'Data Analyst', 'Data Engineer',
      'Machine Learning Engineer', 'AI Engineer', 'ML Engineer',
      'Business Intelligence Analyst', 'Analytics Engineer',
      
      // Management & Leadership
      'Product Manager', 'Project Manager', 'Engineering Manager',
      'Technical Lead', 'Team Lead', 'Scrum Master',
      'Business Analyst', 'Product Owner',
      
      // Design & UX
      'UI/UX Designer', 'Product Designer', 'Graphic Designer',
      'Web Designer', 'Visual Designer', 'Interaction Designer',
      
      // Quality & Testing
      'Quality Assurance Engineer', 'Test Engineer', 'QA Analyst',
      'Automation Engineer', 'Performance Tester',
      
      // Security
      'Cybersecurity Analyst', 'Security Engineer', 'Information Security Analyst',
      'Penetration Tester', 'Security Consultant',
      
      // Marketing & Sales
      'Digital Marketing Manager', 'Marketing Manager', 'Content Manager',
      'SEO Specialist', 'Social Media Manager', 'Sales Manager',
      'Account Manager', 'Business Development Manager',
      
      // Other
      'Technical Writer', 'Solutions Architect', 'Database Administrator',
      'Network Engineer', 'System Administrator', 'Game Developer'
    ];
    
    let matches = this.getAccurateMatches(input, baseJobTitles, 'job');
    
    // Boost based on user context
    if (context) {
      matches = matches.map(match => {
        let boostedScore = match.score;
        
        // Boost if matches user skills
        if (context.userSkills?.some(skill => 
          match.item.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(match.item.toLowerCase().split(' ')[0])
        )) {
          boostedScore += 20;
        }
        
        // Boost if in recent searches
        if (context.recentSearches?.some(search => 
          match.item.toLowerCase().includes(search.toLowerCase()) ||
          search.toLowerCase().includes(match.item.toLowerCase())
        )) {
          boostedScore += 15;
        }
        
        // Boost based on experience level
        if (context.userExperience) {
          const exp = context.userExperience.toLowerCase();
          if (exp.includes('senior') && match.item.toLowerCase().includes('senior')) {
            boostedScore += 10;
          }
          if (exp.includes('lead') && match.item.toLowerCase().includes('lead')) {
            boostedScore += 10;
          }
        }
        
        return { ...match, score: Math.min(100, boostedScore) };
      });
      
      matches.sort((a, b) => b.score - a.score);
    }
    
    return matches.slice(0, 10).map(m => m.item);
  }

  // Company search with industry awareness and better matching
  public getCompanySuggestions(input: string, companies: string[]): string[] {
    const matches = this.getAccurateMatches(input, companies, 'company');
    
    // Add popular companies if input is short
    if (input.length <= 2) {
      const popularCompanies = [
        'Google', 'Microsoft', 'Amazon', 'Apple', 'Facebook', 'Netflix',
        'Uber', 'Airbnb', 'Tesla', 'Spotify', 'Adobe', 'Salesforce',
        'TCS', 'Infosys', 'Wipro', 'Accenture', 'IBM', 'Oracle',
        'Flipkart', 'Zomato', 'Swiggy', 'Paytm', 'Ola', 'BYJU\'S'
      ];
      
      const popularMatches = this.getAccurateMatches(input, popularCompanies, 'company');
      const combined = [...matches, ...popularMatches]
        .filter((item, index, arr) => arr.findIndex(i => i.item === item.item) === index)
        .sort((a, b) => b.score - a.score);
      
      return combined.slice(0, 10).map(m => m.item);
    }
    
    return matches.slice(0, 10).map(m => m.item);
  }

  // Enhanced skill-based search with categorization
  public getSkillSuggestions(input: string): string[] {
    const skills = [
      // Programming Languages (High Priority)
      'JavaScript', 'Python', 'Java', 'TypeScript', 'C++', 'C#', 'Go', 'Rust', 
      'Swift', 'Kotlin', 'PHP', 'Ruby', 'Scala', 'R', 'MATLAB', 'Perl',
      
      // Frontend Technologies
      'React', 'Angular', 'Vue.js', 'HTML', 'CSS', 'Sass', 'SCSS', 'Less',
      'Bootstrap', 'Tailwind CSS', 'Material-UI', 'Ant Design', 'jQuery',
      'Webpack', 'Vite', 'Parcel', 'Gulp', 'Grunt',
      
      // Backend Technologies
      'Node.js', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot',
      'ASP.NET', 'Ruby on Rails', 'Laravel', 'Symfony', 'CodeIgniter',
      'Nest.js', 'Koa.js', 'Hapi.js',
      
      // Databases
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'SQLite',
      'Oracle', 'SQL Server', 'Cassandra', 'DynamoDB', 'Firebase',
      
      // Cloud & DevOps
      'AWS', 'Azure', 'Google Cloud Platform', 'Docker', 'Kubernetes',
      'Jenkins', 'GitLab CI', 'GitHub Actions', 'Terraform', 'Ansible',
      'Chef', 'Puppet', 'Vagrant', 'Nginx', 'Apache',
      
      // Data & Analytics
      'Machine Learning', 'Deep Learning', 'Data Science', 'TensorFlow',
      'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn', 'Matplotlib', 'Seaborn',
      'Tableau', 'Power BI', 'Apache Spark', 'Hadoop', 'Kafka',
      
      // Mobile Development
      'React Native', 'Flutter', 'iOS Development', 'Android Development',
      'Xamarin', 'Ionic', 'Cordova', 'Unity', 'Unreal Engine',
      
      // Design & UX
      'Figma', 'Adobe Photoshop', 'Adobe Illustrator', 'Sketch', 'InVision',
      'Adobe XD', 'Canva', 'Blender', 'After Effects', 'Premiere Pro',
      
      // Testing & Quality
      'Selenium', 'Jest', 'Cypress', 'Mocha', 'Chai', 'JUnit', 'TestNG',
      'Postman', 'Insomnia', 'SoapUI',
      
      // Version Control & Collaboration
      'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN', 'Mercurial',
      'Jira', 'Confluence', 'Slack', 'Microsoft Teams',
      
      // Methodologies & Soft Skills
      'Agile', 'Scrum', 'Kanban', 'DevOps', 'CI/CD', 'TDD', 'BDD',
      'Project Management', 'Team Leadership', 'Communication',
      'Problem Solving', 'Critical Thinking', 'Time Management'
    ];
    
    const matches = this.getAccurateMatches(input, skills, 'skill');
    return matches.slice(0, 12).map(m => m.item);
  }

  // Real-time search suggestions with debouncing support
  public getRealTimeSuggestions(
    input: string,
    type: 'job' | 'skill' | 'location' | 'company',
    dataset: string[],
    limit: number = 8
  ): string[] {
    if (!input || input.length < 1) {
      // Return popular items for empty input
      return this.getPopularItems(type).slice(0, limit);
    }
    
    const matches = this.getAccurateMatches(input, dataset, type);
    return matches.slice(0, limit).map(m => m.item);
  }

  private getPopularItems(type: string): string[] {
    const popularItems: Record<string, string[]> = {
      job: ['Software Engineer', 'Data Scientist', 'Product Manager', 'Frontend Developer', 'Backend Developer'],
      skill: ['JavaScript', 'Python', 'React', 'Java', 'SQL', 'HTML', 'CSS', 'Node.js'],
      location: ['Remote', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune'],
      company: ['Google', 'Microsoft', 'Amazon', 'TCS', 'Infosys', 'Wipro']
    };
    
    return popularItems[type] || [];
  }
}

export const searchAccuracy = SearchAccuracyEngine.getInstance();