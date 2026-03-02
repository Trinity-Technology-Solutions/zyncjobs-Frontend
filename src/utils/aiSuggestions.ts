// AI-powered suggestion system
export class AISuggestionService {
  private static instance: AISuggestionService;
  private cache: Map<string, { data: string[], timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): AISuggestionService {
    if (!AISuggestionService.instance) {
      AISuggestionService.instance = new AISuggestionService();
    }
    return AISuggestionService.instance;
  }

  private async callAI(prompt: string): Promise<string[]> {
    try {
      // Call OpenRouter API with Mistral model
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_REACT_APP_OPENROUTER_API_KEY || import.meta.env.VITE_OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Trinity Jobs'
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-7b-instruct',
          messages: [{
            role: 'user',
            content: prompt
          }],
          max_tokens: 200,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      // Parse the response into an array
      return content.split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .slice(0, 8);
    } catch (error) {
      console.error('OpenRouter API error:', error);
      return this.fallbackSuggestions(prompt);
    }
  }

  private fallbackSuggestions(input: string): string[] {
    const inputLower = input.toLowerCase();
    
    if (inputLower.includes('job') || inputLower.includes('develop') || inputLower.includes('engineer') || inputLower.includes('manager') || inputLower.includes('analyst')) {
      return this.generateJobSuggestions(inputLower);
    }
    
    if (this.isLocationQuery(inputLower)) {
      return this.generateLocationSuggestions(inputLower);
    }
    
    return this.generateSkillSuggestions(inputLower);
  }

  private generateJobSuggestions(input: string): string[] {
    const patterns = new Map([
      ['react', ['React Developer', 'Senior React Developer', 'React Native Developer', 'Frontend React Developer']],
      ['python', ['Python Developer', 'Senior Python Developer', 'Python Data Scientist', 'Backend Python Developer']],
      ['java', ['Java Developer', 'Senior Java Developer', 'Java Full Stack Developer', 'Java Spring Developer']],
      ['node', ['Node.js Developer', 'Backend Node Developer', 'Full Stack Node Developer']],
      ['data', ['Data Scientist', 'Data Analyst', 'Data Engineer', 'Machine Learning Engineer']],
      ['ai', ['AI Engineer', 'Machine Learning Engineer', 'Deep Learning Engineer', 'AI Research Scientist']],
      ['design', ['UI/UX Designer', 'Product Designer', 'Graphic Designer', 'Web Designer']],
      ['marketing', ['Marketing Manager', 'Digital Marketing Specialist', 'Content Marketing Manager', 'Growth Marketing Manager']],
      ['sales', ['Sales Executive', 'Sales Manager', 'Business Development Manager', 'Account Executive']],
      ['product', ['Product Manager', 'Senior Product Manager', 'Product Owner', 'Product Marketing Manager']],
      ['engineer', ['Software Engineer', 'DevOps Engineer', 'Systems Engineer', 'Cloud Engineer']],
      ['manager', ['Engineering Manager', 'Project Manager', 'Operations Manager', 'Team Lead']],
      ['analyst', ['Business Analyst', 'Financial Analyst', 'Systems Analyst', 'Research Analyst']]
    ]);

    for (const [key, suggestions] of patterns) {
      if (input.includes(key)) {
        return suggestions;
      }
    }

    return ['Software Developer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer'];
  }

  private generateLocationSuggestions(input: string): string[] {
    const patterns = new Map([
      ['che', ['Chennai', 'Chennai, India']],
      ['ban', ['Bangalore', 'Bengaluru', 'Bangalore, India']],
      ['hyd', ['Hyderabad', 'Hyderabad, India']],
      ['mum', ['Mumbai', 'Mumbai, India']],
      ['del', ['Delhi', 'New Delhi', 'Delhi NCR']],
      ['new', ['New York', 'New York City', 'NYC']],
      ['san', ['San Francisco', 'San Jose', 'San Diego']],
      ['lon', ['London', 'London, UK']],
      ['ber', ['Berlin', 'Berlin, Germany']],
      ['tok', ['Tokyo', 'Tokyo, Japan']],
      ['sin', ['Singapore']],
      ['dub', ['Dubai', 'Dubai, UAE']],
      ['remote', ['Remote', 'Work from Home', 'Hybrid']]
    ]);

    for (const [key, suggestions] of patterns) {
      if (input.includes(key)) {
        return suggestions;
      }
    }

    return ['Remote', 'New York', 'London', 'Singapore', 'Bangalore', 'San Francisco'];
  }

  private generateSkillSuggestions(input: string): string[] {
    const skills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue.js', 'TypeScript',
      'AWS', 'Azure', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'MySQL',
      'Machine Learning', 'Data Science', 'AI', 'DevOps', 'Cloud Computing',
      'UI/UX Design', 'Figma', 'Adobe Photoshop', 'Digital Marketing', 'SEO',
      'Project Management', 'Agile', 'Scrum', 'Business Analysis'
    ];

    return skills
      .filter(skill => skill.toLowerCase().includes(input))
      .slice(0, 8);
  }

  private isLocationQuery(input: string): boolean {
    const locationKeywords = ['city', 'country', 'remote', 'office', 'location'];
    return locationKeywords.some(keyword => input.includes(keyword)) || input.length <= 4;
  }

  async getJobSuggestions(input: string): Promise<string[]> {
    if (!input || input.length < 1) return [];

    const cacheKey = `job_${input.toLowerCase()}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const prompt = `Generate 8 relevant job titles for "${input}". Return only job titles, one per line.`;
    
    const suggestions = await this.callAI(prompt);
    this.cache.set(cacheKey, { data: suggestions, timestamp: Date.now() });
    return suggestions;
  }

  async getLocationSuggestions(input: string): Promise<string[]> {
    if (!input || input.length < 1) return [];

    const cacheKey = `location_${input.toLowerCase()}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const prompt = `Generate 8 relevant locations for "${input}". Include cities, countries. Return only location names, one per line.`;
    
    const suggestions = await this.callAI(prompt);
    this.cache.set(cacheKey, { data: suggestions, timestamp: Date.now() });
    return suggestions;
  }

  async getSkillSuggestions(input: string): Promise<string[]> {
    if (!input || input.length < 1) return [];

    const cacheKey = `skill_${input.toLowerCase()}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const prompt = `Generate 8 relevant professional skills for "${input}". Return only skill names, one per line.`;
    
    const suggestions = await this.callAI(prompt);
    this.cache.set(cacheKey, { data: suggestions, timestamp: Date.now() });
    return suggestions;
  }

  async generateExperience(jobTitle: string, skills: string[]): Promise<string> {
    try {
      const skillsText = skills.length > 0 ? skills.join(', ') : 'various technologies';
      const prompt = `Create a comprehensive professional work experience description for a ${jobTitle} position. Include the following:

1. 3-4 detailed bullet points with specific achievements and quantifiable results
2. Use these skills: ${skillsText}
3. Include metrics like percentages, numbers, time savings, revenue impact
4. Show progression and leadership responsibilities
5. Mention collaboration with teams and stakeholders
6. Format each point starting with •
7. Make it sound professional and impressive for job applications

Example format:
• Led development of scalable web applications using React and Node.js, serving 100K+ daily users
• Optimized database queries and API performance, reducing response time by 40%
• Collaborated with cross-functional teams of 8+ members to deliver projects 20% ahead of schedule
• Mentored 3 junior developers and established coding standards that improved code quality by 30%`;
      
      const response = await this.callAI(prompt);
      return response.join('\n');
    } catch (error) {
      return this.getComprehensiveFallbackExperience(jobTitle, skills);
    }
  }

  async improveExperience(currentExperience: string): Promise<string> {
    try {
      const prompt = `Improve this work experience description to be more professional and impactful. Add specific metrics and achievements where possible. Format as bullet points starting with •:\n\n${currentExperience}`;
      
      const response = await this.callAI(prompt);
      return response.join('\n');
    } catch (error) {
      return currentExperience;
    }
  }

  async suggestSkillsForRole(jobTitle: string): Promise<string[]> {
    try {
      const prompt = `List 8 essential technical and professional skills for a ${jobTitle} role. Return only skill names, one per line.`;
      
      const suggestions = await this.callAI(prompt);
      return suggestions;
    } catch (error) {
      return this.getFallbackSkillsForRole(jobTitle);
    }
  }

  async optimizeSkills(currentSkills: string[], jobTitle?: string): Promise<string[]> {
    try {
      const roleContext = jobTitle ? ` for a ${jobTitle} role` : '';
      const prompt = `Optimize and prioritize these skills${roleContext}. Remove duplicates, add missing important skills, and return the top 10 most relevant skills:\n${currentSkills.join(', ')}`;
      
      const optimized = await this.callAI(prompt);
      return optimized.slice(0, 10);
    } catch (error) {
      return currentSkills;
    }
  }

  private getComprehensiveFallbackExperience(jobTitle: string, skills: string[]): string {
    const skillsText = skills.length > 0 ? skills.slice(0, 3).join(', ') : 'modern technologies';
    
    const experiences = {
      'Software Engineer': `• Developed and maintained scalable web applications using ${skillsText}, serving 50K+ daily active users
• Implemented automated testing and CI/CD pipelines, reducing deployment time by 60% and bug reports by 45%
• Collaborated with product managers and designers in agile teams to deliver 15+ features ahead of schedule
• Mentored 2 junior developers and conducted code reviews, improving overall team code quality by 35%`,
      
      'Data Engineer': `• Built and optimized ETL pipelines processing 10TB+ daily data using ${skillsText}, improving data accuracy by 40%
• Designed and implemented data warehouse solutions supporting 100+ business analysts and data scientists
• Automated data quality monitoring and alerting systems, reducing data incidents by 70%
• Led migration of legacy systems to cloud infrastructure, resulting in 50% cost reduction and 3x performance improvement`,
      
      'Data Scientist': `• Developed machine learning models using ${skillsText} with 90%+ accuracy for predictive analytics and customer segmentation
• Analyzed large datasets (100M+ records) to extract actionable business insights, driving $2M+ revenue increase
• Built automated reporting dashboards used by 50+ stakeholders across marketing, sales, and operations teams
• Presented findings to C-level executives and influenced strategic decisions affecting company direction`,
      
      'Product Manager': `• Led product development lifecycle for 5+ features from conception to launch, achieving 25% user engagement increase
• Managed cross-functional teams of 12+ members across engineering, design, and marketing departments
• Conducted user research and A/B testing with 10K+ users, improving conversion rates by 30%
• Defined product roadmap and prioritized features based on data analysis, resulting in 40% faster time-to-market`,
      
      'Frontend Developer': `• Built responsive web applications using ${skillsText}, improving user experience and reducing bounce rate by 25%
• Optimized application performance and loading times, achieving 95+ Google PageSpeed scores
• Collaborated with UX/UI designers to implement pixel-perfect designs across 10+ product features
• Established component library and design system used by 8+ developers, reducing development time by 40%`,
      
      'Backend Developer': `• Designed and developed RESTful APIs using ${skillsText}, handling 1M+ requests per day with 99.9% uptime
• Optimized database queries and implemented caching strategies, reducing response time by 50%
• Built microservices architecture supporting scalable applications for 100K+ concurrent users
• Implemented security best practices and monitoring systems, preventing security incidents and ensuring compliance`
    };
    
    const jobLower = jobTitle.toLowerCase();
    
    if (jobLower.includes('data engineer')) return experiences['Data Engineer'];
    if (jobLower.includes('data scientist')) return experiences['Data Scientist'];
    if (jobLower.includes('product manager')) return experiences['Product Manager'];
    if (jobLower.includes('frontend')) return experiences['Frontend Developer'];
    if (jobLower.includes('backend')) return experiences['Backend Developer'];
    if (jobLower.includes('engineer') || jobLower.includes('developer')) return experiences['Software Engineer'];
    
    return experiences['Software Engineer'];
  }

  private getFallbackSkillsForRole(jobTitle: string): string[] {
    const roleSkills = {
      'Software Engineer': ['JavaScript', 'Python', 'React', 'Node.js', 'Git', 'AWS', 'SQL', 'Agile'],
      'Data Scientist': ['Python', 'R', 'Machine Learning', 'SQL', 'Pandas', 'TensorFlow', 'Statistics', 'Tableau'],
      'Product Manager': ['Product Strategy', 'Agile', 'Analytics', 'User Research', 'Roadmapping', 'Stakeholder Management', 'A/B Testing', 'Jira']
    };
    
    return roleSkills[jobTitle as keyof typeof roleSkills] || roleSkills['Software Engineer'];
  }

  async generateJobTitlesForCompany(companyName: string): Promise<string[]> {
    try {
      const prompt = `Generate 8 relevant job titles that ${companyName} might be hiring for. Consider the company's industry and common roles. Return only job titles, one per line.`;
      
      const suggestions = await this.callAI(prompt);
      return suggestions;
    } catch (error) {
      return this.getFallbackJobTitlesForCompany(companyName);
    }
  }

  async getPopularJobLocations(): Promise<string[]> {
    try {
      const prompt = 'List 10 popular job locations including major tech hubs, business centers, and remote options. Return only location names, one per line.';
      
      const suggestions = await this.callAI(prompt);
      return suggestions;
    } catch (error) {
      return this.getFallbackPopularLocations();
    }
  }

  private getFallbackJobTitlesForCompany(companyName: string): string[] {
    const companyLower = companyName.toLowerCase();
    
    if (companyLower.includes('tech') || companyLower.includes('software')) {
      return ['Software Engineer', 'Senior Developer', 'Product Manager', 'DevOps Engineer', 'Data Scientist', 'UI/UX Designer', 'QA Engineer', 'Technical Lead'];
    }
    
    if (companyLower.includes('finance') || companyLower.includes('bank')) {
      return ['Financial Analyst', 'Risk Manager', 'Investment Advisor', 'Compliance Officer', 'Business Analyst', 'Portfolio Manager', 'Credit Analyst', 'Operations Manager'];
    }
    
    if (companyLower.includes('health') || companyLower.includes('medical')) {
      return ['Healthcare Analyst', 'Medical Researcher', 'Clinical Coordinator', 'Health Informatics Specialist', 'Biomedical Engineer', 'Healthcare Administrator', 'Medical Writer', 'Quality Assurance Specialist'];
    }
    
    // Default tech roles
    return ['Software Engineer', 'Product Manager', 'Marketing Manager', 'Sales Representative', 'Business Analyst', 'Operations Manager', 'Customer Success Manager', 'Data Analyst'];
  }

  private getFallbackPopularLocations(): string[] {
    return [
      'Remote',
      'San Francisco, CA',
      'New York, NY',
      'Seattle, WA',
      'Austin, TX',
      'Boston, MA',
      'Chicago, IL',
      'Los Angeles, CA',
      'Denver, CO',
      'Atlanta, GA'
    ];
  }

  async getSalarySuggestions(input: string, jobTitle?: string, location?: string): Promise<string[]> {
    try {
      const context = jobTitle ? ` for ${jobTitle}` : '';
      const locationContext = location ? ` in ${location}` : '';
      const prompt = `Generate 6 realistic salary ranges${context}${locationContext}. Consider market rates. Format as "$X,000 - $Y,000". Return only salary ranges, one per line.`;
      
      const suggestions = await this.callAI(prompt);
      return suggestions;
    } catch (error) {
      return this.getFallbackSalaryRanges(jobTitle, location);
    }
  }

  async getSalaryRangeForRole(jobTitle: string, location?: string): Promise<string[]> {
    try {
      const locationContext = location ? ` in ${location}` : '';
      const prompt = `Generate 6 realistic salary ranges for ${jobTitle}${locationContext}. Consider market rates and different experience levels. Format as "$X,000 - $Y,000". Return only salary ranges, one per line.`;
      
      const suggestions = await this.callAI(prompt);
      return suggestions;
    } catch (error) {
      return this.getFallbackSalaryRanges(jobTitle, location);
    }
  }

  private getFallbackSalaryRanges(jobTitle?: string, location?: string): string[] {
    const jobLower = jobTitle?.toLowerCase() || '';
    const locationLower = location?.toLowerCase() || '';
    
    // Location multipliers
    const isHighCostArea = locationLower.includes('san francisco') || locationLower.includes('new york') || locationLower.includes('seattle');
    const multiplier = isHighCostArea ? 1.3 : 1.0;
    
    // Base salary ranges by role
    let salaryRanges = [
      [60000, 80000],
      [80000, 100000],
      [100000, 130000],
      [130000, 160000],
      [160000, 200000],
      [200000, 250000]
    ];
    
    if (jobLower.includes('engineer') || jobLower.includes('developer')) {
      salaryRanges = [
        [70000, 90000],
        [90000, 120000],
        [120000, 150000],
        [150000, 180000],
        [180000, 220000],
        [220000, 280000]
      ];
    } else if (jobLower.includes('manager') || jobLower.includes('lead')) {
      salaryRanges = [
        [80000, 110000],
        [110000, 140000],
        [140000, 170000],
        [170000, 200000],
        [200000, 250000],
        [250000, 300000]
      ];
    } else if (jobLower.includes('data scientist') || jobLower.includes('ai')) {
      salaryRanges = [
        [85000, 115000],
        [115000, 145000],
        [145000, 180000],
        [180000, 220000],
        [220000, 280000],
        [280000, 350000]
      ];
    } else if (jobLower.includes('designer')) {
      salaryRanges = [
        [55000, 75000],
        [75000, 95000],
        [95000, 120000],
        [120000, 150000],
        [150000, 180000],
        [180000, 220000]
      ];
    }
    
    // Apply location multiplier and format
    const formatSalary = (min: number, max: number) => {
      const adjustedMin = Math.round((min * multiplier) / 1000) * 1000;
      const adjustedMax = Math.round((max * multiplier) / 1000) * 1000;
      return `$${adjustedMin.toLocaleString()} - $${adjustedMax.toLocaleString()}`;
    };
    
    return salaryRanges.map(([min, max]) => formatSalary(min, max));
  }
}

export const aiSuggestions = AISuggestionService.getInstance();