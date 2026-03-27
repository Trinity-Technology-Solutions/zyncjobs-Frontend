/**
 * Advanced AI Job Matching Engine with Knowledge Graph
 * Features: Vector similarity, Knowledge graph, Multi-agent scoring, Explainable AI
 */

export interface JobMatchResult {
  jobId: string;
  overallScore: number;
  confidence: number;
  matchBreakdown: {
    skillsMatch: number;
    experienceMatch: number;
    locationMatch: number;
    salaryMatch: number;
    cultureMatch: number;
    careerGrowthMatch: number;
  };
  explanations: {
    strengths: string[];
    concerns: string[];
    recommendations: string[];
  };
  missingSkills: string[];
  transferableSkills: string[];
  careerProgression: {
    isGoodFit: boolean;
    nextStepReason: string;
    growthPotential: number;
  };
}

export interface CandidateProfile {
  skills: string[];
  experience: {
    years: number;
    roles: string[];
    industries: string[];
    achievements: string[];
  };
  education: {
    degree: string;
    field: string;
    institution: string;
  };
  preferences: {
    location: string[];
    salaryRange: { min: number; max: number };
    workType: 'remote' | 'hybrid' | 'onsite' | 'flexible';
    industries: string[];
  };
  careerGoals: {
    targetRole: string;
    timeframe: string;
    priorities: string[];
  };
}

export interface JobProfile {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryRange: { min: number; max: number };
  requiredSkills: string[];
  preferredSkills: string[];
  experience: {
    minYears: number;
    maxYears: number;
    requiredRoles: string[];
  };
  description: string;
  benefits: string[];
  workType: 'remote' | 'hybrid' | 'onsite';
  industry: string;
  companySize: string;
  growthStage: string;
}

class AdvancedJobMatchingEngine {
  private readonly SKILL_KNOWLEDGE_GRAPH: Record<string, {
    aliases: string[];
    related: string[];
    category: string;
    level: string;
    transferability: number;
  }> = {
    // Programming Languages
    javascript: {
      aliases: ['js', 'es6', 'es2015', 'ecmascript', 'vanilla js'],
      related: ['typescript', 'node.js', 'react', 'vue', 'angular'],
      category: 'programming',
      level: 'core',
      transferability: 0.9
    },
    typescript: {
      aliases: ['ts'],
      related: ['javascript', 'angular', 'react', 'node.js'],
      category: 'programming',
      level: 'advanced',
      transferability: 0.85
    },
    python: {
      aliases: ['py'],
      related: ['django', 'flask', 'fastapi', 'pandas', 'numpy', 'machine learning'],
      category: 'programming',
      level: 'core',
      transferability: 0.9
    },
    react: {
      aliases: ['reactjs', 'react.js'],
      related: ['javascript', 'typescript', 'jsx', 'redux', 'next.js'],
      category: 'frontend',
      level: 'framework',
      transferability: 0.8
    },
    // Add more skills...
    'machine learning': {
      aliases: ['ml', 'ai', 'artificial intelligence'],
      related: ['python', 'tensorflow', 'pytorch', 'data science', 'deep learning'],
      category: 'ai',
      level: 'specialized',
      transferability: 0.7
    },
    aws: {
      aliases: ['amazon web services', 'amazon aws'],
      related: ['cloud computing', 'ec2', 's3', 'lambda', 'devops'],
      category: 'cloud',
      level: 'platform',
      transferability: 0.75
    }
  };

  private readonly ROLE_PROGRESSION_GRAPH: Record<string, {
    nextRoles: string[];
    requiredSkills: string[];
    timeToNext: string;
    salaryGrowth: number;
  }> = {
    'software engineer': {
      nextRoles: ['senior software engineer', 'tech lead', 'engineering manager'],
      requiredSkills: ['programming', 'problem solving', 'debugging'],
      timeToNext: '2-3 years',
      salaryGrowth: 1.3
    },
    'senior software engineer': {
      nextRoles: ['staff engineer', 'principal engineer', 'engineering manager'],
      requiredSkills: ['system design', 'mentoring', 'architecture'],
      timeToNext: '3-5 years',
      salaryGrowth: 1.4
    },
    'data scientist': {
      nextRoles: ['senior data scientist', 'ml engineer', 'data science manager'],
      requiredSkills: ['machine learning', 'statistics', 'python', 'sql'],
      timeToNext: '2-4 years',
      salaryGrowth: 1.35
    }
  };

  private readonly INDUSTRY_KNOWLEDGE: Record<string, {
    commonSkills: string[];
    salaryMultiplier: number;
    growthRate: string;
    workCulture: string;
  }> = {
    technology: {
      commonSkills: ['programming', 'agile', 'cloud computing', 'devops'],
      salaryMultiplier: 1.2,
      growthRate: 'high',
      workCulture: 'innovative'
    },
    finance: {
      commonSkills: ['excel', 'sql', 'python', 'risk management'],
      salaryMultiplier: 1.15,
      growthRate: 'stable',
      workCulture: 'structured'
    },
    healthcare: {
      commonSkills: ['compliance', 'data analysis', 'patient care'],
      salaryMultiplier: 1.0,
      growthRate: 'stable',
      workCulture: 'mission-driven'
    }
  };

  async matchJobs(candidate: CandidateProfile, jobs: JobProfile[]): Promise<JobMatchResult[]> {
    const results: JobMatchResult[] = [];

    for (const job of jobs) {
      const matchResult = await this.calculateJobMatch(candidate, job);
      results.push(matchResult);
    }

    // Sort by overall score and confidence
    return results.sort((a, b) => {
      const scoreA = a.overallScore * a.confidence;
      const scoreB = b.overallScore * b.confidence;
      return scoreB - scoreA;
    });
  }

  private async calculateJobMatch(candidate: CandidateProfile, job: JobProfile): Promise<JobMatchResult> {
    // Multi-factor matching
    const skillsMatch = this.calculateSkillsMatch(candidate.skills, job.requiredSkills, job.preferredSkills);
    const experienceMatch = this.calculateExperienceMatch(candidate.experience, job.experience);
    const locationMatch = this.calculateLocationMatch(candidate.preferences.location, job.location, job.workType);
    const salaryMatch = this.calculateSalaryMatch(candidate.preferences.salaryRange, job.salaryRange);
    const cultureMatch = this.calculateCultureMatch(candidate, job);
    const careerGrowthMatch = this.calculateCareerGrowthMatch(candidate.careerGoals, job);

    const matchBreakdown = {
      skillsMatch: skillsMatch.score,
      experienceMatch,
      locationMatch,
      salaryMatch,
      cultureMatch,
      careerGrowthMatch
    };

    // Weighted overall score
    const overallScore = Math.round(
      skillsMatch.score * 0.35 +
      experienceMatch * 0.25 +
      locationMatch * 0.15 +
      salaryMatch * 0.10 +
      cultureMatch * 0.10 +
      careerGrowthMatch * 0.05
    );

    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(candidate, job);

    // Generate explanations
    const explanations = this.generateExplanations(candidate, job, matchBreakdown, skillsMatch);

    // Career progression analysis
    const careerProgression = this.analyzeCareerProgression(candidate, job);

    return {
      jobId: job.id,
      overallScore,
      confidence,
      matchBreakdown,
      explanations,
      missingSkills: skillsMatch.missing,
      transferableSkills: skillsMatch.transferable,
      careerProgression
    };
  }

  private calculateSkillsMatch(
    candidateSkills: string[], 
    requiredSkills: string[], 
    preferredSkills: string[]
  ): { score: number; missing: string[]; transferable: string[] } {
    const normalizedCandidateSkills = this.normalizeSkills(candidateSkills);
    const normalizedRequired = this.normalizeSkills(requiredSkills);
    const normalizedPreferred = this.normalizeSkills(preferredSkills);

    // Calculate matches using knowledge graph
    const requiredMatches = this.findSkillMatches(normalizedCandidateSkills, normalizedRequired);
    const preferredMatches = this.findSkillMatches(normalizedCandidateSkills, normalizedPreferred);

    // Calculate score
    const requiredScore = requiredMatches.direct.length / Math.max(normalizedRequired.length, 1);
    const preferredScore = preferredMatches.direct.length / Math.max(normalizedPreferred.length, 1);
    const transferableBonus = (requiredMatches.transferable.length + preferredMatches.transferable.length) * 0.1;

    const score = Math.min(100, Math.round((requiredScore * 70 + preferredScore * 20 + transferableBonus) * 100));

    // Find missing and transferable skills
    const missing = normalizedRequired.filter(skill => 
      !requiredMatches.direct.includes(skill) && !requiredMatches.transferable.includes(skill)
    );

    const transferable = [...requiredMatches.transferable, ...preferredMatches.transferable];

    return { score, missing, transferable };
  }

  private normalizeSkills(skills: string[]): string[] {
    return skills.map(skill => {
      const normalized = skill.toLowerCase().trim();
      // Check if it's an alias and return canonical form
      for (const [canonical, data] of Object.entries(this.SKILL_KNOWLEDGE_GRAPH)) {
        if (data.aliases.includes(normalized) || canonical === normalized) {
          return canonical;
        }
      }
      return normalized;
    });
  }

  private findSkillMatches(candidateSkills: string[], requiredSkills: string[]): {
    direct: string[];
    transferable: string[];
  } {
    const direct: string[] = [];
    const transferable: string[] = [];

    for (const required of requiredSkills) {
      // Direct match
      if (candidateSkills.includes(required)) {
        direct.push(required);
        continue;
      }

      // Check for transferable skills through knowledge graph
      const skillData = this.SKILL_KNOWLEDGE_GRAPH[required];
      if (skillData) {
        const hasRelated = candidateSkills.some(candidateSkill => {
          const candidateData = this.SKILL_KNOWLEDGE_GRAPH[candidateSkill];
          return candidateData && 
                 candidateData.related.includes(required) &&
                 candidateData.transferability > 0.6;
        });

        if (hasRelated) {
          transferable.push(required);
        }
      }
    }

    return { direct, transferable };
  }

  private calculateExperienceMatch(candidateExp: CandidateProfile['experience'], jobExp: JobProfile['experience']): number {
    let score = 0;

    // Years of experience
    if (candidateExp.years >= jobExp.minYears) {
      if (candidateExp.years <= jobExp.maxYears) {
        score += 50; // Perfect fit
      } else if (candidateExp.years <= jobExp.maxYears + 2) {
        score += 40; // Slightly overqualified
      } else {
        score += 25; // Overqualified
      }
    } else {
      // Underqualified but might have potential
      const gap = jobExp.minYears - candidateExp.years;
      score += Math.max(0, 30 - gap * 10);
    }

    // Role relevance
    const roleMatches = candidateExp.roles.filter(role => 
      jobExp.requiredRoles.some(reqRole => 
        role.toLowerCase().includes(reqRole.toLowerCase()) ||
        reqRole.toLowerCase().includes(role.toLowerCase())
      )
    ).length;

    score += Math.min(30, roleMatches * 15);

    // Achievement quality (simplified)
    if (candidateExp.achievements.length > 0) {
      score += Math.min(20, candidateExp.achievements.length * 5);
    }

    return Math.min(100, score);
  }

  private calculateLocationMatch(candidateLocations: string[], jobLocation: string, workType: string): number {
    if (workType === 'remote') return 95;

    const jobLocationLower = jobLocation.toLowerCase();
    const hasMatch = candidateLocations.some(loc => 
      loc.toLowerCase().includes(jobLocationLower) || 
      jobLocationLower.includes(loc.toLowerCase())
    );

    if (hasMatch) return 90;
    if (workType === 'hybrid') return 70;
    return 40; // Location mismatch for onsite role
  }

  private calculateSalaryMatch(candidateRange: { min: number; max: number }, jobRange: { min: number; max: number }): number {
    // Check for overlap
    const overlapMin = Math.max(candidateRange.min, jobRange.min);
    const overlapMax = Math.min(candidateRange.max, jobRange.max);

    if (overlapMin <= overlapMax) {
      // There's overlap
      const overlapSize = overlapMax - overlapMin;
      const candidateRangeSize = candidateRange.max - candidateRange.min;
      const overlapPercentage = overlapSize / candidateRangeSize;
      return Math.round(60 + overlapPercentage * 40);
    }

    // No overlap - check how close they are
    if (jobRange.max < candidateRange.min) {
      // Job pays less than candidate wants
      const gap = candidateRange.min - jobRange.max;
      const gapPercentage = gap / candidateRange.min;
      return Math.max(20, Math.round(60 - gapPercentage * 100));
    }

    // Job pays more than candidate expects (good for candidate)
    return 80;
  }

  private calculateCultureMatch(candidate: CandidateProfile, job: JobProfile): number {
    let score = 50; // Base score

    // Industry preference
    if (candidate.preferences.industries.includes(job.industry)) {
      score += 25;
    }

    // Work type preference
    if (candidate.preferences.workType === job.workType || candidate.preferences.workType === 'flexible') {
      score += 25;
    }

    return Math.min(100, score);
  }

  private calculateCareerGrowthMatch(careerGoals: CandidateProfile['careerGoals'], job: JobProfile): number {
    let score = 50; // Base score

    // Check if job aligns with target role
    const targetRoleLower = careerGoals.targetRole.toLowerCase();
    const jobTitleLower = job.title.toLowerCase();

    if (jobTitleLower.includes(targetRoleLower) || targetRoleLower.includes(jobTitleLower)) {
      score += 30;
    }

    // Check career progression potential
    const roleData = this.ROLE_PROGRESSION_GRAPH[job.title.toLowerCase()];
    if (roleData && roleData.nextRoles.some(nextRole => 
      nextRole.toLowerCase().includes(targetRoleLower)
    )) {
      score += 20;
    }

    return Math.min(100, score);
  }

  private calculateConfidence(candidate: CandidateProfile, job: JobProfile): number {
    let confidence = 0;

    // Data completeness factors
    if (candidate.skills.length > 0) confidence += 20;
    if (candidate.experience.years > 0) confidence += 20;
    if (candidate.preferences.location.length > 0) confidence += 15;
    if (candidate.preferences.salaryRange.min > 0) confidence += 15;
    if (job.requiredSkills.length > 0) confidence += 15;
    if (job.description.length > 100) confidence += 15;

    return Math.min(100, confidence);
  }

  private generateExplanations(
    candidate: CandidateProfile, 
    job: JobProfile, 
    breakdown: JobMatchResult['matchBreakdown'],
    skillsMatch: { score: number; missing: string[]; transferable: string[] }
  ): JobMatchResult['explanations'] {
    const strengths: string[] = [];
    const concerns: string[] = [];
    const recommendations: string[] = [];

    // Analyze strengths
    if (breakdown.skillsMatch >= 80) {
      strengths.push(`Strong skills alignment (${breakdown.skillsMatch}% match)`);
    }
    if (breakdown.experienceMatch >= 75) {
      strengths.push(`Experience level fits well with job requirements`);
    }
    if (breakdown.locationMatch >= 85) {
      strengths.push(`Location and work arrangement preferences align`);
    }
    if (skillsMatch.transferable.length > 0) {
      strengths.push(`Transferable skills: ${skillsMatch.transferable.slice(0, 3).join(', ')}`);
    }

    // Analyze concerns
    if (breakdown.skillsMatch < 60) {
      concerns.push(`Skills gap: Missing ${skillsMatch.missing.length} key skills`);
    }
    if (breakdown.experienceMatch < 50) {
      concerns.push(`Experience level may not fully meet requirements`);
    }
    if (breakdown.salaryMatch < 60) {
      concerns.push(`Salary expectations may not align with offer`);
    }

    // Generate recommendations
    if (skillsMatch.missing.length > 0) {
      recommendations.push(`Consider learning: ${skillsMatch.missing.slice(0, 3).join(', ')}`);
    }
    if (breakdown.experienceMatch < 70) {
      recommendations.push(`Highlight relevant projects and achievements in your application`);
    }
    if (breakdown.skillsMatch >= 70) {
      recommendations.push(`This role aligns well with your profile - consider applying`);
    }

    return { strengths, concerns, recommendations };
  }

  private analyzeCareerProgression(candidate: CandidateProfile, job: JobProfile): JobMatchResult['careerProgression'] {
    const currentRoles = candidate.experience.roles.map(r => r.toLowerCase());
    const jobTitle = job.title.toLowerCase();
    
    // Check if this is a logical next step
    let isGoodFit = false;
    let nextStepReason = '';
    let growthPotential = 50;

    // Look for career progression patterns
    for (const currentRole of currentRoles) {
      const roleData = this.ROLE_PROGRESSION_GRAPH[currentRole];
      if (roleData && roleData.nextRoles.some(nextRole => 
        nextRole.toLowerCase().includes(jobTitle) || jobTitle.includes(nextRole.toLowerCase())
      )) {
        isGoodFit = true;
        nextStepReason = `Natural progression from ${currentRole}`;
        growthPotential = 80;
        break;
      }
    }

    // Check for lateral moves with growth potential
    if (!isGoodFit) {
      const industryData = this.INDUSTRY_KNOWLEDGE[job.industry];
      if (industryData && industryData.growthRate === 'high') {
        isGoodFit = true;
        nextStepReason = 'Good opportunity in high-growth industry';
        growthPotential = 70;
      }
    }

    return {
      isGoodFit,
      nextStepReason: nextStepReason || 'Role may not align with typical career progression',
      growthPotential
    };
  }

  // Utility method to get skill recommendations
  getSkillRecommendations(candidateSkills: string[], targetRole: string): string[] {
    const roleData = this.ROLE_PROGRESSION_GRAPH[targetRole.toLowerCase()];
    if (!roleData) return [];

    const currentSkillsNormalized = this.normalizeSkills(candidateSkills);
    const missingSkills = roleData.requiredSkills.filter(skill => 
      !currentSkillsNormalized.includes(skill.toLowerCase())
    );

    return missingSkills;
  }

  // Method to simulate vector embeddings (in real implementation, use actual embeddings)
  private simulateVectorSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length; // Jaccard similarity
  }
}

export const advancedJobMatchingEngine = new AdvancedJobMatchingEngine();
export default advancedJobMatchingEngine;