interface MistralResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class MistralResumeService {
  private apiKey = import.meta.env.VITE_MISTRAL_API_KEY || 'demo-key';
  private baseUrl = 'https://api.mistral.ai/v1/chat/completions';

  async parseResumeWithAI(resumeText: string) {
    // For demo, return mock parsed data
    return this.getMockParseData(resumeText);
  }

  private getMockParseData(resumeText: string) {
    // Extract basic info from resume text
    const nameMatch = resumeText.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
    const emailMatch = resumeText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const phoneMatch = resumeText.match(/(\d{3}-\d{3}-\d{4})/);
    const locationMatch = resumeText.match(/([A-Z][a-zA-Z\s]+, [A-Z]{2,})/);
    
    return this.formatResumeData({
      name: nameMatch ? nameMatch[1] : 'Riley Taylor',
      email: emailMatch ? emailMatch[1] : 'e.g.mail@example.com',
      phone: phoneMatch ? phoneMatch[1] : '305-123-4444',
      location: locationMatch ? locationMatch[1] : 'San Francisco, USA',
      summary: 'Accountant',
      skills: ['Accounting', 'Problem-solving', 'Communication', 'Teamwork'],
      experience: [{
        jobTitle: 'Junior Accountant',
        company: 'Tech Corp',
        duration: 'Present',
        description: 'Dedicated professional with strong background in accountant'
      }],
      education: [{
        degree: 'Accounting',
        school: 'University',
        year: '2020'
      }]
    });
  }

  async getJobRecommendations(resumeSkills: string[], location: string, experience: string) {
    // Mock AI recommendations based on skills
    return [
      {
        jobTitle: 'Senior Accountant',
        matchReason: `Perfect match for your ${resumeSkills.join(', ')} skills and ${experience} experience`,
        requiredSkills: resumeSkills.slice(0, 3),
        matchPercentage: 95
      },
      {
        jobTitle: 'Financial Analyst', 
        matchReason: `Your analytical and accounting skills make you ideal for financial analysis roles`,
        requiredSkills: ['Accounting', 'Analysis', 'Problem-solving'],
        matchPercentage: 88
      },
      {
        jobTitle: 'Bookkeeper',
        matchReason: `Strong foundation in accounting principles matches bookkeeping requirements`,
        requiredSkills: ['Accounting', 'Communication'],
        matchPercentage: 82
      }
    ];
  }

  async enhanceJobMatching(candidateProfile: any, jobDescription: string) {
    // Mock AI analysis
    const skillsInJob = candidateProfile.skills.filter((skill: string) => 
      jobDescription.toLowerCase().includes(skill.toLowerCase())
    ).length;
    
    const matchPercentage = Math.min(95, 60 + (skillsInJob * 10));
    
    return {
      overallMatch: matchPercentage,
      skillsMatch: matchPercentage + 5,
      experienceMatch: matchPercentage - 5,
      locationMatch: 95,
      strengths: candidateProfile.skills.slice(0, 2),
      gaps: ['Advanced Excel', 'CPA Certification'],
      recommendation: `Strong candidate with ${skillsInJob} matching skills. Consider for interview.`
    };
  }

  private formatResumeData(extractedData: any) {
    return {
      profile: {
        name: extractedData.name || 'Name not found',
        email: extractedData.email || 'Email not found',
        phone: extractedData.phone || 'Phone not found',
        location: extractedData.location || 'Location not found',
        url: '',
        summary: extractedData.summary || 'Summary not found'
      },
      workExperiences: extractedData.experience?.map((exp: any) => ({
        company: exp.company || 'Company not found',
        jobTitle: exp.jobTitle || 'Job title not found',
        date: exp.duration || 'Date not found',
        descriptions: [exp.description || 'Description not found']
      })) || [],
      educations: extractedData.education?.map((edu: any) => ({
        school: edu.school || 'School not found',
        degree: edu.degree || 'Degree not found',
        date: edu.year || 'Year not found',
        gpa: '',
        descriptions: []
      })) || [],
      projects: [],
      skills: {
        featuredSkills: extractedData.skills?.map((skill: string) => ({ skill })) || [],
        descriptions: []
      },
      custom: {
        descriptions: []
      }
    };
  }

  private getFallbackData() {
    return {
      profile: {
        name: 'Riley Taylor',
        email: 'e.g.mail@example.com',
        phone: '305-123-4444',
        location: 'San Francisco, USA',
        url: '',
        summary: 'Accountant'
      },
      workExperiences: [{
        company: 'Tech Corp',
        jobTitle: 'Junior Accountant',
        date: 'Present',
        descriptions: ['Dedicated professional with strong background in accountant']
      }],
      educations: [{
        school: 'University',
        degree: 'Accounting',
        date: '2020',
        gpa: '',
        descriptions: []
      }],
      projects: [],
      skills: {
        featuredSkills: [
          { skill: 'Accounting' },
          { skill: 'Problem-solving' },
          { skill: 'Communication' }
        ],
        descriptions: []
      },
      custom: {
        descriptions: []
      }
    };
  }
}

export const mistralResumeService = new MistralResumeService();