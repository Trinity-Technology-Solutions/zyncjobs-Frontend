export interface SkillSuggestion {
  skill: string;
  relevance: number;
  category: string;
  description?: string;
}

export interface SkillAnalysis {
  extractedSkills: string[];
  suggestedSkills: SkillSuggestion[];
  skillGaps: string[];
  strengthAreas: string[];
}

export class IntelligentSkillsService {
  private static commonSkills = [
    // Technical Skills
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'TypeScript', 'HTML', 'CSS',
    'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'Git',
    
    // Soft Skills
    'Communication', 'Leadership', 'Problem Solving', 'Team Collaboration',
    'Project Management', 'Critical Thinking', 'Adaptability', 'Time Management',
    
    // Domain Skills
    'Data Analysis', 'Machine Learning', 'UI/UX Design', 'Digital Marketing',
    'Sales', 'Customer Service', 'Business Analysis', 'Quality Assurance'
  ];

  static analyzeSkills(resumeText: string, jobDescription?: string): SkillAnalysis {
    const extractedSkills = this.extractSkillsFromText(resumeText);
    const suggestedSkills = this.generateSkillSuggestions(extractedSkills, jobDescription);
    const skillGaps = jobDescription ? this.identifySkillGaps(extractedSkills, jobDescription) : [];
    const strengthAreas = this.identifyStrengthAreas(extractedSkills);

    return {
      extractedSkills,
      suggestedSkills,
      skillGaps,
      strengthAreas
    };
  }

  private static extractSkillsFromText(text: string): string[] {
    const textLower = text.toLowerCase();
    const foundSkills: string[] = [];

    for (const skill of this.commonSkills) {
      if (textLower.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    }

    return [...new Set(foundSkills)]; // Remove duplicates
  }

  private static generateSkillSuggestions(currentSkills: string[], jobDescription?: string): SkillSuggestion[] {
    const suggestions: SkillSuggestion[] = [];
    const currentSkillsLower = currentSkills.map(s => s.toLowerCase());

    // Suggest complementary skills
    const skillMap: Record<string, string[]> = {
      'javascript': ['React', 'Node.js', 'TypeScript', 'Vue.js'],
      'python': ['Django', 'Flask', 'Pandas', 'NumPy', 'Machine Learning'],
      'react': ['Redux', 'Next.js', 'TypeScript', 'Jest'],
      'java': ['Spring', 'Hibernate', 'Maven', 'JUnit'],
      'aws': ['Docker', 'Kubernetes', 'Terraform', 'CI/CD'],
    };

    for (const skill of currentSkills) {
      const relatedSkills = skillMap[skill.toLowerCase()] || [];
      for (const related of relatedSkills) {
        if (!currentSkillsLower.includes(related.toLowerCase())) {
          suggestions.push({
            skill: related,
            relevance: 0.8,
            category: 'Technical',
            description: `Complements your ${skill} skills`
          });
        }
      }
    }

    return suggestions.slice(0, 10); // Limit suggestions
  }

  private static identifySkillGaps(currentSkills: string[], jobDescription: string): string[] {
    const jobSkills = this.extractSkillsFromText(jobDescription);
    const currentSkillsLower = currentSkills.map(s => s.toLowerCase());
    
    return jobSkills.filter(skill => 
      !currentSkillsLower.includes(skill.toLowerCase())
    );
  }

  private static identifyStrengthAreas(skills: string[]): string[] {
    const categories: Record<string, string[]> = {
      'Frontend Development': ['JavaScript', 'React', 'HTML', 'CSS', 'TypeScript', 'Vue.js'],
      'Backend Development': ['Node.js', 'Python', 'Java', 'SQL', 'MongoDB'],
      'Cloud & DevOps': ['AWS', 'Docker', 'Kubernetes', 'CI/CD'],
      'Data & Analytics': ['Python', 'SQL', 'Data Analysis', 'Machine Learning'],
      'Leadership & Management': ['Leadership', 'Project Management', 'Team Collaboration']
    };

    const strengths: string[] = [];
    const skillsLower = skills.map(s => s.toLowerCase());

    for (const [category, categorySkills] of Object.entries(categories)) {
      const matchCount = categorySkills.filter(skill => 
        skillsLower.includes(skill.toLowerCase())
      ).length;

      if (matchCount >= 2) { // At least 2 skills in category
        strengths.push(category);
      }
    }

    return strengths;
  }

  static suggestSkillsForRole(jobTitle: string, jobDescription: string): SkillSuggestion[] {
    const roleSkillMap: Record<string, string[]> = {
      'frontend': ['React', 'JavaScript', 'HTML', 'CSS', 'TypeScript'],
      'backend': ['Node.js', 'Python', 'Java', 'SQL', 'API Development'],
      'fullstack': ['React', 'Node.js', 'JavaScript', 'SQL', 'Git'],
      'data': ['Python', 'SQL', 'Data Analysis', 'Machine Learning', 'Statistics'],
      'devops': ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Linux'],
      'manager': ['Leadership', 'Project Management', 'Communication', 'Strategic Planning']
    };

    const titleLower = jobTitle.toLowerCase();
    const descLower = jobDescription.toLowerCase();
    
    let relevantSkills: string[] = [];

    for (const [role, skills] of Object.entries(roleSkillMap)) {
      if (titleLower.includes(role) || descLower.includes(role)) {
        relevantSkills = [...relevantSkills, ...skills];
      }
    }

    // Also extract from job description
    relevantSkills = [...relevantSkills, ...this.extractSkillsFromText(jobDescription)];

    return [...new Set(relevantSkills)].map(skill => ({
      skill,
      relevance: 0.9,
      category: this.categorizeSkill(skill),
      description: `Important for ${jobTitle} role`
    }));
  }

  private static categorizeSkill(skill: string): string {
    const technical = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS'];
    const soft = ['Communication', 'Leadership', 'Problem Solving', 'Team Collaboration'];
    
    if (technical.some(t => skill.toLowerCase().includes(t.toLowerCase()))) {
      return 'Technical';
    }
    if (soft.some(s => skill.toLowerCase().includes(s.toLowerCase()))) {
      return 'Soft Skills';
    }
    return 'Domain';
  }
}