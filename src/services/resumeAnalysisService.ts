import mistralAIService from './mistralAIService';

class ResumeAnalysisService {
  static async analyzeResume(resumeText: string, jobRequirements: any) {
    try {
      // Use Mistral AI for intelligent resume analysis
      const prompt = `
Analyze this resume against job requirements and provide a JSON response:

RESUME:
${resumeText}

JOB REQUIREMENTS:
- Title: ${jobRequirements.jobTitle}
- Skills: ${jobRequirements.skills?.join(', ')}
- Experience: ${jobRequirements.experienceRange}
- Education: ${jobRequirements.educationLevel}

Provide analysis in this exact JSON format:
{
  "skillsMatch": 85,
  "experienceMatch": 90,
  "educationMatch": 80,
  "overallScore": 85,
  "missingSkills": ["React", "Node.js"],
  "rejectionReasons": ["Skills mismatch"],
  "feedback": ["Add React experience to strengthen application"]
}

Score each category 0-100. Include specific missing skills and constructive feedback.`;

      const aiResponse = await mistralAIService.generateText(prompt);
      
      // Parse AI response
      let analysis;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response, using fallback:', parseError);
        analysis = this.fallbackAnalysis(resumeText, jobRequirements);
      }

      // Validate and ensure all required fields
      analysis = {
        skillsMatch: analysis.skillsMatch || 50,
        experienceMatch: analysis.experienceMatch || 50,
        educationMatch: analysis.educationMatch || 50,
        overallScore: analysis.overallScore || 50,
        missingSkills: analysis.missingSkills || [],
        rejectionReasons: analysis.rejectionReasons || [],
        feedback: analysis.feedback || []
      };

      return analysis;
    } catch (error) {
      console.error('Mistral AI analysis failed, using fallback:', error);
      return this.fallbackAnalysis(resumeText, jobRequirements);
    }
  }

  private static fallbackAnalysis(resumeText: string, jobRequirements: any) {
    const analysis = {
      skillsMatch: 0,
      experienceMatch: 0,
      educationMatch: 0,
      overallScore: 0,
      missingSkills: [] as string[],
      rejectionReasons: [] as string[],
      feedback: [] as string[]
    };

    // Extract skills from resume
    const resumeSkills = this.extractSkills(resumeText);
    const requiredSkills = jobRequirements.skills || [];
    
    // Calculate skills match
    const matchedSkills = requiredSkills.filter((skill: string) => 
      resumeSkills.some(resumeSkill => 
        resumeSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(resumeSkill.toLowerCase())
      )
    );
    
    analysis.skillsMatch = requiredSkills.length > 0 ? 
      (matchedSkills.length / requiredSkills.length) * 100 : 100;
    
    analysis.missingSkills = requiredSkills.filter((skill: string) => 
      !matchedSkills.includes(skill)
    );

    // Extract experience
    const experience = this.extractExperience(resumeText);
    const minExperience = this.parseExperience(jobRequirements.experienceRange);
    
    analysis.experienceMatch = experience >= minExperience ? 100 : 
      (experience / minExperience) * 100;

    // Education match (basic check)
    const hasEducation = this.checkEducation(resumeText, jobRequirements.educationLevel);
    analysis.educationMatch = hasEducation ? 100 : 50;

    // Calculate overall score
    analysis.overallScore = (
      analysis.skillsMatch * 0.5 + 
      analysis.experienceMatch * 0.3 + 
      analysis.educationMatch * 0.2
    );

    // Generate rejection reasons
    if (analysis.skillsMatch < 60) {
      analysis.rejectionReasons.push('Skills mismatch');
      analysis.feedback.push(`Missing key skills: ${analysis.missingSkills.slice(0, 3).join(', ')}`);
    }
    
    if (analysis.experienceMatch < 80) {
      analysis.rejectionReasons.push('Insufficient experience');
      analysis.feedback.push(`Minimum ${minExperience} years experience required`);
    }
    
    if (analysis.educationMatch < 80) {
      analysis.rejectionReasons.push('Education requirements not met');
      analysis.feedback.push(`${jobRequirements.educationLevel} preferred`);
    }

    return analysis;
  }

  private static extractSkills(resumeText: string): string[] {
    const skillKeywords = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue.js',
      'HTML', 'CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Azure', 'Docker',
      'Kubernetes', 'Git', 'Linux', 'Windows', 'MacOS', 'Photoshop', 'Figma',
      'Sketch', 'Adobe', 'Marketing', 'SEO', 'SEM', 'Analytics', 'Excel',
      'PowerPoint', 'Word', 'Project Management', 'Agile', 'Scrum', 'JIRA'
    ];
    
    const foundSkills: string[] = [];
    const lowerText = resumeText.toLowerCase();
    
    skillKeywords.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    });
    
    return foundSkills;
  }

  private static extractExperience(resumeText: string): number {
    const experiencePatterns = [
      /(\d+)\+?\s*years?\s*(?:of\s*)?experience/gi,
      /experience\s*:?\s*(\d+)\+?\s*years?/gi,
      /(\d+)\+?\s*years?\s*in/gi
    ];
    
    let maxExperience = 0;
    
    experiencePatterns.forEach(pattern => {
      const matches = resumeText.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const years = parseInt(match.match(/\d+/)?.[0] || '0');
          maxExperience = Math.max(maxExperience, years);
        });
      }
    });
    
    return maxExperience;
  }

  private static parseExperience(experienceRange: string): number {
    if (!experienceRange) return 0;
    
    const match = experienceRange.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private static checkEducation(resumeText: string, requiredEducation: string): boolean {
    if (!requiredEducation) return true;
    
    const educationKeywords = {
      'high school': ['high school', 'secondary', '12th', 'diploma'],
      'bachelor': ['bachelor', 'b.tech', 'b.e', 'b.sc', 'b.com', 'b.a'],
      'master': ['master', 'm.tech', 'm.e', 'm.sc', 'm.com', 'm.a', 'mba'],
      'phd': ['phd', 'doctorate', 'ph.d']
    };
    
    const lowerText = resumeText.toLowerCase();
    const lowerRequired = requiredEducation.toLowerCase();
    
    for (const [level, keywords] of Object.entries(educationKeywords)) {
      if (lowerRequired.includes(level)) {
        return keywords.some(keyword => lowerText.includes(keyword));
      }
    }
    
    return true;
  }

  static shouldAutoReject(analysis: any, rejectionRules: any): boolean {
    if (!rejectionRules.autoReject) return false;
    
    const thresholds = {
      skillsMatch: rejectionRules.minSkillsMatch || 60,
      experienceMatch: rejectionRules.minExperienceMatch || 80,
      overallScore: rejectionRules.minOverallScore || 70
    };
    
    return (
      analysis.skillsMatch < thresholds.skillsMatch ||
      analysis.experienceMatch < thresholds.experienceMatch ||
      analysis.overallScore < thresholds.overallScore
    );
  }
}

export default ResumeAnalysisService;