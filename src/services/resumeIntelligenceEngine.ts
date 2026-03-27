/**
 * Resume Intelligence Engine - Complete Implementation
 * Features: ATS Scoring, Content Analysis, Keyword Optimization, Section Scoring
 */

export interface ResumeAnalysis {
  overallScore: number;
  atsScore: number;
  sections: {
    contact: number;
    summary: number;
    experience: number;
    education: number;
    skills: number;
    formatting: number;
  };
  keywordMatch: number | null;
  strengths: string[];
  improvements: { issue: string; fix: string; priority: 'high' | 'medium' | 'low' }[];
  missingKeywords: string[];
  verdict: string;
  recommendations: string[];
  atsCompatibility: {
    fileFormat: boolean;
    standardSections: boolean;
    readableFont: boolean;
    properHeadings: boolean;
    noImages: boolean;
  };
}

export interface ResumeContent {
  text: string;
  sections: {
    contact?: string;
    summary?: string;
    experience?: string;
    education?: string;
    skills?: string;
  };
  metadata: {
    wordCount: number;
    pageCount: number;
    hasEmail: boolean;
    hasPhone: boolean;
    hasLinkedIn: boolean;
  };
}

class ResumeIntelligenceEngine {
  private readonly ATS_KEYWORDS = [
    // Technical Skills
    'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node.js', 'typescript',
    'html', 'css', 'sql', 'mongodb', 'postgresql', 'aws', 'azure', 'docker', 'kubernetes',
    'git', 'agile', 'scrum', 'ci/cd', 'devops', 'machine learning', 'ai', 'data analysis',
    
    // Soft Skills
    'leadership', 'communication', 'teamwork', 'problem solving', 'analytical', 'creative',
    'project management', 'time management', 'adaptability', 'collaboration',
    
    // Action Verbs
    'achieved', 'developed', 'implemented', 'managed', 'led', 'created', 'designed',
    'optimized', 'improved', 'increased', 'reduced', 'delivered', 'executed', 'built'
  ];

  private readonly SECTION_WEIGHTS = {
    contact: 0.1,
    summary: 0.15,
    experience: 0.35,
    education: 0.15,
    skills: 0.15,
    formatting: 0.1
  };

  analyzeResume(content: ResumeContent, jobDescription?: string): ResumeAnalysis {
    const sectionScores = this.analyzeSections(content);
    const atsScore = this.calculateATSScore(content);
    const keywordMatch = jobDescription ? this.calculateKeywordMatch(content.text, jobDescription) : null;
    const { strengths, improvements } = this.generateFeedback(content, sectionScores);
    const missingKeywords = jobDescription ? this.findMissingKeywords(content.text, jobDescription) : [];
    
    const overallScore = this.calculateOverallScore(sectionScores, atsScore, keywordMatch);
    const verdict = this.generateVerdict(overallScore);
    const recommendations = this.generateRecommendations(content, sectionScores, improvements);
    const atsCompatibility = this.checkATSCompatibility(content);

    return {
      overallScore,
      atsScore,
      sections: sectionScores,
      keywordMatch,
      strengths,
      improvements,
      missingKeywords,
      verdict,
      recommendations,
      atsCompatibility
    };
  }

  private analyzeSections(content: ResumeContent): ResumeAnalysis['sections'] {
    return {
      contact: this.scoreContactSection(content),
      summary: this.scoreSummarySection(content),
      experience: this.scoreExperienceSection(content),
      education: this.scoreEducationSection(content),
      skills: this.scoreSkillsSection(content),
      formatting: this.scoreFormattingSection(content)
    };
  }

  private scoreContactSection(content: ResumeContent): number {
    let score = 0;
    const { hasEmail, hasPhone, hasLinkedIn } = content.metadata;
    
    if (hasEmail) score += 40;
    if (hasPhone) score += 30;
    if (hasLinkedIn) score += 30;
    
    // Check for professional email
    if (hasEmail && !content.text.toLowerCase().includes('@gmail.com')) score += 10;
    
    return Math.min(100, score);
  }

  private scoreSummarySection(content: ResumeContent): number {
    const summary = content.sections.summary || '';
    if (!summary) return 0;
    
    let score = 30; // Base score for having a summary
    
    // Length check (50-150 words ideal)
    const wordCount = summary.split(/\s+/).length;
    if (wordCount >= 50 && wordCount <= 150) score += 25;
    else if (wordCount >= 30 && wordCount <= 200) score += 15;
    
    // Check for quantifiable achievements
    if (/\d+%|\d+\+|increased|improved|reduced|saved/i.test(summary)) score += 20;
    
    // Check for relevant keywords
    const keywordCount = this.ATS_KEYWORDS.filter(keyword => 
      summary.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    score += Math.min(25, keywordCount * 5);
    
    return Math.min(100, score);
  }

  private scoreExperienceSection(content: ResumeContent): number {
    const experience = content.sections.experience || '';
    if (!experience) return 0;
    
    let score = 20; // Base score for having experience
    
    // Check for multiple positions
    const jobCount = (experience.match(/\d{4}|\d{2}\/\d{4}/g) || []).length / 2;
    if (jobCount >= 2) score += 20;
    if (jobCount >= 3) score += 10;
    
    // Check for quantifiable achievements
    const achievements = experience.match(/\d+%|\$\d+|increased|improved|reduced|saved|\d+\+/gi) || [];
    score += Math.min(30, achievements.length * 5);
    
    // Check for action verbs
    const actionVerbs = ['achieved', 'developed', 'implemented', 'managed', 'led', 'created'];
    const verbCount = actionVerbs.filter(verb => 
      experience.toLowerCase().includes(verb)
    ).length;
    score += Math.min(20, verbCount * 4);
    
    // Check for relevant skills mentioned
    const skillMentions = this.ATS_KEYWORDS.filter(keyword => 
      experience.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    score += Math.min(10, skillMentions * 2);
    
    return Math.min(100, score);
  }

  private scoreEducationSection(content: ResumeContent): number {
    const education = content.sections.education || '';
    if (!education) return 30; // Not always required
    
    let score = 50; // Base score for having education
    
    // Check for degree
    if (/bachelor|master|phd|b\.s|m\.s|b\.a|m\.a/i.test(education)) score += 25;
    
    // Check for GPA (if mentioned and good)
    const gpaMatch = education.match(/gpa:?\s*(\d+\.?\d*)/i);
    if (gpaMatch && parseFloat(gpaMatch[1]) >= 3.5) score += 15;
    
    // Check for relevant coursework or projects
    if (/coursework|project|thesis|research/i.test(education)) score += 10;
    
    return Math.min(100, score);
  }

  private scoreSkillsSection(content: ResumeContent): number {
    const skills = content.sections.skills || '';
    if (!skills) return 0;
    
    let score = 20; // Base score for having skills section
    
    // Count technical skills
    const techSkills = this.ATS_KEYWORDS.filter(keyword => 
      skills.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    score += Math.min(50, techSkills * 5);
    
    // Check for skill categorization
    if (/technical|programming|languages|frameworks|tools/i.test(skills)) score += 15;
    
    // Check for proficiency levels
    if (/expert|advanced|intermediate|proficient|years/i.test(skills)) score += 15;
    
    return Math.min(100, score);
  }

  private scoreFormattingSection(content: ResumeContent): number {
    let score = 50; // Base score
    
    // Check word count (1-2 pages ideal)
    const { wordCount } = content.metadata;
    if (wordCount >= 300 && wordCount <= 800) score += 25;
    else if (wordCount >= 200 && wordCount <= 1000) score += 15;
    
    // Check for consistent formatting indicators
    if (content.text.includes('•') || content.text.includes('-')) score += 15;
    
    // Check for proper sections
    const sections = ['experience', 'education', 'skills'].filter(section => 
      new RegExp(section, 'i').test(content.text)
    ).length;
    score += sections * 3;
    
    return Math.min(100, score);
  }

  private calculateATSScore(content: ResumeContent): number {
    let score = 0;
    
    // File format compatibility (assume PDF/DOCX is good)
    score += 20;
    
    // Standard sections present
    const requiredSections = ['experience', 'education', 'skills'];
    const presentSections = requiredSections.filter(section => 
      content.sections[section as keyof typeof content.sections]
    ).length;
    score += (presentSections / requiredSections.length) * 30;
    
    // No complex formatting issues
    score += 20;
    
    // Readable structure
    if (content.metadata.hasEmail && content.metadata.hasPhone) score += 15;
    
    // Keyword density
    const keywordDensity = this.calculateKeywordDensity(content.text);
    score += Math.min(15, keywordDensity * 30);
    
    return Math.min(100, score);
  }

  private calculateKeywordMatch(resumeText: string, jobDescription: string): number {
    const resumeWords = this.extractKeywords(resumeText.toLowerCase());
    const jobWords = this.extractKeywords(jobDescription.toLowerCase());
    
    if (jobWords.length === 0) return 0;
    
    const matches = jobWords.filter(word => resumeWords.includes(word)).length;
    return Math.round((matches / jobWords.length) * 100);
  }

  private findMissingKeywords(resumeText: string, jobDescription: string): string[] {
    const resumeWords = this.extractKeywords(resumeText.toLowerCase());
    const jobWords = this.extractKeywords(jobDescription.toLowerCase());
    
    return jobWords.filter(word => !resumeWords.includes(word)).slice(0, 10);
  }

  private extractKeywords(text: string): string[] {
    // Extract meaningful keywords (3+ chars, not common words)
    const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'];
    
    return text
      .match(/\b[a-z]{3,}\b/g) || []
      .filter(word => !commonWords.includes(word))
      .filter((word, index, arr) => arr.indexOf(word) === index); // unique
  }

  private calculateKeywordDensity(text: string): number {
    const words = text.split(/\s+/).length;
    const keywords = this.ATS_KEYWORDS.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    
    return words > 0 ? keywords / words : 0;
  }

  private calculateOverallScore(
    sections: ResumeAnalysis['sections'], 
    atsScore: number, 
    keywordMatch: number | null
  ): number {
    let weightedScore = 0;
    
    Object.entries(sections).forEach(([section, score]) => {
      const weight = this.SECTION_WEIGHTS[section as keyof typeof this.SECTION_WEIGHTS];
      weightedScore += score * weight;
    });
    
    // Add ATS score influence
    weightedScore = weightedScore * 0.7 + atsScore * 0.3;
    
    // Boost for good keyword match
    if (keywordMatch && keywordMatch > 70) {
      weightedScore = Math.min(100, weightedScore * 1.1);
    }
    
    return Math.round(weightedScore);
  }

  private generateFeedback(
    content: ResumeContent, 
    sections: ResumeAnalysis['sections']
  ): { strengths: string[]; improvements: { issue: string; fix: string; priority: 'high' | 'medium' | 'low' }[] } {
    const strengths: string[] = [];
    const improvements: { issue: string; fix: string; priority: 'high' | 'medium' | 'low' }[] = [];
    
    // Analyze strengths
    if (sections.contact >= 80) strengths.push('Complete contact information');
    if (sections.summary >= 70) strengths.push('Strong professional summary');
    if (sections.experience >= 75) strengths.push('Well-detailed work experience');
    if (sections.skills >= 70) strengths.push('Comprehensive skills section');
    
    // Analyze improvements
    if (sections.contact < 70) {
      improvements.push({
        issue: 'Incomplete contact information',
        fix: 'Add professional email, phone number, and LinkedIn profile',
        priority: 'high'
      });
    }
    
    if (sections.summary < 50) {
      improvements.push({
        issue: 'Missing or weak professional summary',
        fix: 'Add a 3-4 line summary highlighting your key achievements and skills',
        priority: 'high'
      });
    }
    
    if (sections.experience < 60) {
      improvements.push({
        issue: 'Experience section needs improvement',
        fix: 'Add quantifiable achievements and use strong action verbs',
        priority: 'high'
      });
    }
    
    if (sections.skills < 50) {
      improvements.push({
        issue: 'Skills section is incomplete',
        fix: 'List relevant technical and soft skills with proficiency levels',
        priority: 'medium'
      });
    }
    
    if (content.metadata.wordCount < 300) {
      improvements.push({
        issue: 'Resume is too short',
        fix: 'Expand on your experiences and achievements (aim for 300-800 words)',
        priority: 'medium'
      });
    }
    
    return { strengths, improvements };
  }

  private generateVerdict(overallScore: number): string {
    if (overallScore >= 85) return 'Excellent resume! Ready for top-tier applications.';
    if (overallScore >= 75) return 'Strong resume with minor improvements needed.';
    if (overallScore >= 65) return 'Good foundation, but needs some enhancements.';
    if (overallScore >= 50) return 'Decent resume that requires significant improvements.';
    return 'Resume needs major restructuring and content improvements.';
  }

  private generateRecommendations(
    content: ResumeContent, 
    sections: ResumeAnalysis['sections'],
    improvements: { issue: string; fix: string; priority: 'high' | 'medium' | 'low' }[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Priority-based recommendations
    const highPriority = improvements.filter(imp => imp.priority === 'high');
    if (highPriority.length > 0) {
      recommendations.push(`Focus on ${highPriority.length} high-priority improvements first`);
    }
    
    // Specific recommendations based on scores
    if (sections.experience < 70) {
      recommendations.push('Use the STAR method (Situation, Task, Action, Result) for experience bullets');
    }
    
    if (sections.skills < 60) {
      recommendations.push('Research job descriptions in your field and add relevant skills');
    }
    
    if (content.metadata.wordCount > 800) {
      recommendations.push('Consider condensing content to 1-2 pages for better readability');
    }
    
    recommendations.push('Tailor your resume for each job application');
    recommendations.push('Use our Resume Templates for better formatting');
    
    return recommendations;
  }

  private checkATSCompatibility(content: ResumeContent): ResumeAnalysis['atsCompatibility'] {
    return {
      fileFormat: true, // Assume good format
      standardSections: ['experience', 'education', 'skills'].every(section => 
        content.sections[section as keyof typeof content.sections]
      ),
      readableFont: true, // Assume readable
      properHeadings: /experience|education|skills/i.test(content.text),
      noImages: true // Assume no images in text content
    };
  }

  // Utility method to parse resume content from text
  parseResumeContent(text: string): ResumeContent {
    const sections = this.extractSections(text);
    const metadata = this.extractMetadata(text);
    
    return {
      text,
      sections,
      metadata
    };
  }

  private extractSections(text: string): ResumeContent['sections'] {
    const sections: ResumeContent['sections'] = {};
    
    // Simple section extraction based on common patterns
    const experienceMatch = text.match(/(?:experience|work history)(.*?)(?:education|skills|$)/is);
    if (experienceMatch) sections.experience = experienceMatch[1].trim();
    
    const educationMatch = text.match(/(?:education|academic)(.*?)(?:experience|skills|$)/is);
    if (educationMatch) sections.education = educationMatch[1].trim();
    
    const skillsMatch = text.match(/(?:skills|technical)(.*?)(?:experience|education|$)/is);
    if (skillsMatch) sections.skills = skillsMatch[1].trim();
    
    const summaryMatch = text.match(/(?:summary|objective|profile)(.*?)(?:experience|education|skills)/is);
    if (summaryMatch) sections.summary = summaryMatch[1].trim();
    
    return sections;
  }

  private extractMetadata(text: string): ResumeContent['metadata'] {
    return {
      wordCount: text.split(/\s+/).length,
      pageCount: Math.ceil(text.length / 3000), // Rough estimate
      hasEmail: /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text),
      hasPhone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(text),
      hasLinkedIn: /linkedin\.com|linkedin/i.test(text)
    };
  }
}

export const resumeIntelligenceEngine = new ResumeIntelligenceEngine();
export default resumeIntelligenceEngine;