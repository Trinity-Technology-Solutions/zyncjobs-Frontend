export interface EnhancedJobRecommendation {
  job: any;
  matchScore: number;
  skillMatch: {
    matched: string[];
    missing: string[];
    bonus: string[];
  };
  careerFit: {
    experienceAlignment: number;
    locationFit: number;
    salaryAlignment: number;
  };
  recommendations: {
    shouldApply: boolean;
    confidenceLevel: 'high' | 'medium' | 'low';
    improvementSuggestions: string[];
    careerProgression: string[];
  };
  aiInsights: string[];
}

export interface CandidateProfile {
  skills: string[];
  experience: string;
  location: string;
}

export class EnhancedAIRecommendationEngine {
  static async generateRecommendations(
    profile: CandidateProfile,
    jobs: any[],
    limit: number = 10
  ): Promise<EnhancedJobRecommendation[]> {
    const recommendations: EnhancedJobRecommendation[] = [];

    for (const job of jobs.slice(0, limit)) {
      const recommendation = await this.analyzeJobMatch(profile, job);
      recommendations.push(recommendation);
    }

    // Sort by match score
    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  }

  private static async analyzeJobMatch(
    profile: CandidateProfile,
    job: any
  ): Promise<EnhancedJobRecommendation> {
    const skillMatch = this.analyzeSkillMatch(profile.skills, job);
    const careerFit = this.analyzeCareerFit(profile, job);
    const matchScore = this.calculateOverallScore(skillMatch, careerFit);
    const recommendations = this.generateJobRecommendations(skillMatch, careerFit, matchScore);
    const aiInsights = this.generateAIInsights(profile, job, skillMatch, careerFit);

    return {
      job,
      matchScore,
      skillMatch,
      careerFit,
      recommendations,
      aiInsights
    };
  }

  private static analyzeSkillMatch(candidateSkills: string[], job: any) {
    const jobSkills = job.skills || [];
    const jobDescription = (job.description || '').toLowerCase();
    const jobTitle = (job.jobTitle || job.title || '').toLowerCase();

    const matched: string[] = [];
    const missing: string[] = [];
    const bonus: string[] = [];

    // Check candidate skills against job
    for (const skill of candidateSkills) {
      const skillLower = skill.toLowerCase();
      const isInJobSkills = jobSkills.some((js: string) => 
        js.toLowerCase().includes(skillLower) || skillLower.includes(js.toLowerCase())
      );
      const isInDescription = jobDescription.includes(skillLower);
      const isInTitle = jobTitle.includes(skillLower);

      if (isInJobSkills || isInDescription || isInTitle) {
        matched.push(skill);
      }
    }

    // Check for missing job skills
    for (const jobSkill of jobSkills) {
      const skillLower = jobSkill.toLowerCase();
      const hasSkill = candidateSkills.some(cs => 
        cs.toLowerCase().includes(skillLower) || skillLower.includes(cs.toLowerCase())
      );
      if (!hasSkill) {
        missing.push(jobSkill);
      }
    }

    // Bonus skills (candidate has but job doesn't explicitly require)
    for (const skill of candidateSkills) {
      if (!matched.includes(skill)) {
        bonus.push(skill);
      }
    }

    return { matched, missing: missing.slice(0, 5), bonus: bonus.slice(0, 3) };
  }

  private static analyzeCareerFit(profile: CandidateProfile, job: any) {
    // Experience alignment
    const experienceAlignment = this.calculateExperienceAlignment(profile.experience, job);
    
    // Location fit
    const locationFit = this.calculateLocationFit(profile.location, job.location);
    
    // Salary alignment (basic estimation)
    const salaryAlignment = this.calculateSalaryAlignment(job);

    return {
      experienceAlignment,
      locationFit,
      salaryAlignment
    };
  }

  private static calculateExperienceAlignment(candidateExp: string, job: any): number {
    const expLower = candidateExp.toLowerCase();
    const jobTitle = (job.jobTitle || job.title || '').toLowerCase();
    const jobDescription = (job.description || '').toLowerCase();

    const expWords = expLower.split(/\s+/).filter(w => w.length > 2);
    let matches = 0;

    for (const word of expWords) {
      if (jobTitle.includes(word) || jobDescription.includes(word)) {
        matches++;
      }
    }

    return expWords.length > 0 ? Math.min(100, Math.round((matches / expWords.length) * 100)) : 50;
  }

  private static calculateLocationFit(candidateLocation: string, jobLocation: string): number {
    if (!candidateLocation || !jobLocation) return 60;
    
    const candLoc = candidateLocation.toLowerCase();
    const jobLoc = jobLocation.toLowerCase();

    if (jobLoc.includes('remote') || candLoc.includes('remote')) return 95;
    
    const candWords = candLoc.split(/[,\s]+/).filter(w => w.length > 2);
    const jobWords = jobLoc.split(/[,\s]+/).filter(w => w.length > 2);

    for (const candWord of candWords) {
      for (const jobWord of jobWords) {
        if (candWord.includes(jobWord) || jobWord.includes(candWord)) {
          return 90;
        }
      }
    }

    return 40;
  }

  private static calculateSalaryAlignment(job: any): number {
    // Basic salary alignment - can be enhanced with actual salary data
    if (job.salary) {
      return 80; // Assume good alignment if salary is provided
    }
    return 60; // Neutral if no salary info
  }

  private static calculateOverallScore(skillMatch: any, careerFit: any): number {
    const skillScore = skillMatch.matched.length > 0 
      ? Math.round((skillMatch.matched.length / (skillMatch.matched.length + skillMatch.missing.length)) * 100)
      : 0;

    return Math.round(
      skillScore * 0.5 +
      careerFit.experienceAlignment * 0.3 +
      careerFit.locationFit * 0.1 +
      careerFit.salaryAlignment * 0.1
    );
  }

  private static generateJobRecommendations(skillMatch: any, careerFit: any, matchScore: number) {
    const shouldApply = matchScore >= 60;
    const confidenceLevel = matchScore >= 80 ? 'high' : matchScore >= 60 ? 'medium' : 'low';
    
    const improvementSuggestions: string[] = [];
    const careerProgression: string[] = [];

    if (skillMatch.missing.length > 0) {
      improvementSuggestions.push(`Learn ${skillMatch.missing.slice(0, 2).join(', ')} to strengthen your profile`);
    }

    if (careerFit.experienceAlignment < 60) {
      improvementSuggestions.push('Consider highlighting relevant experience in your resume');
    }

    if (matchScore >= 70) {
      careerProgression.push('This role aligns well with your career trajectory');
    }

    if (skillMatch.bonus.length > 0) {
      careerProgression.push(`Your ${skillMatch.bonus[0]} skills could be valuable here`);
    }

    return {
      shouldApply,
      confidenceLevel,
      improvementSuggestions,
      careerProgression
    };
  }

  private static generateAIInsights(profile: CandidateProfile, job: any, skillMatch: any, careerFit: any): string[] {
    const insights: string[] = [];

    if (skillMatch.matched.length >= 3) {
      insights.push(`Strong skill alignment with ${skillMatch.matched.length} matching competencies`);
    }

    if (careerFit.experienceAlignment >= 70) {
      insights.push('Your experience profile fits well with this role');
    }

    if (careerFit.locationFit >= 80) {
      insights.push('Excellent location match for this position');
    }

    if (skillMatch.missing.length > 0) {
      insights.push(`Consider developing ${skillMatch.missing[0]} to become a stronger candidate`);
    }

    return insights;
  }
}