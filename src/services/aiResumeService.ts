export interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    website?: string;
  };
  summary: string;
  experience: Array<{
    company: string;
    position: string;
    duration: string;
    description: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  skills: string[];
  languages?: string[];
  certifications?: string[];
}

export interface AIResumeRequest {
  jobTitle: string;
  industry: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  skills?: string[];
  personalInfo?: Partial<ResumeData['personalInfo']>;
  education?: {
    degree?: string;
    institution?: string;
    year?: string;
    gpa?: string;
    field?: string;
    location?: string;
  };
}

class AIResumeService {
  private apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  async generateResume(request: AIResumeRequest): Promise<ResumeData> {
    try {
      const prompt = this.createPrompt(request);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional resume writer. Generate realistic resume content in JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      return JSON.parse(content);
    } catch (error) {
      console.error('AI Resume Generation Error:', error);
      return this.getFallbackResume(request);
    }
  }

  private createPrompt(request: AIResumeRequest): string {
    return `Generate a professional resume for a ${request.experienceLevel} level ${request.jobTitle} in the ${request.industry} industry. 
    
    Include:
    - Professional summary (2-3 sentences)
    - 2-3 relevant work experiences with bullet points
    - Education background
    - Relevant skills: ${request.skills?.join(', ') || 'industry-relevant skills'}
    
    Return ONLY valid JSON in this exact format:
    {
      "personalInfo": {
        "name": "Professional Name",
        "email": "email@example.com",
        "phone": "(555) 123-4567",
        "location": "City, State",
        "linkedin": "linkedin.com/in/profile"
      },
      "summary": "Professional summary text...",
      "experience": [
        {
          "company": "Company Name",
          "position": "Job Title",
          "duration": "2020 - Present",
          "description": ["Achievement 1", "Achievement 2", "Achievement 3"]
        }
      ],
      "education": [
        {
          "institution": "University Name",
          "degree": "Degree Name",
          "year": "2020"
        }
      ],
      "skills": ["Skill 1", "Skill 2", "Skill 3"]
    }`;
  }

  private getFallbackResume(request: AIResumeRequest): ResumeData {
    return {
      personalInfo: {
        name: request.personalInfo?.name || "Your Name",
        email: request.personalInfo?.email || "your.email@example.com",
        phone: "(555) 123-4567",
        location: "City, State",
        linkedin: "linkedin.com/in/yourprofile"
      },
      summary: `Experienced ${request.jobTitle} with proven track record in ${request.industry}. Skilled in ${request.skills?.slice(0, 3).join(', ') || 'relevant technologies'} with strong problem-solving abilities and team collaboration skills.`,
      experience: [
        {
          company: "Previous Company",
          position: request.jobTitle,
          duration: "2021 - Present",
          description: [
            `Led ${request.industry} projects resulting in improved efficiency`,
            `Collaborated with cross-functional teams to deliver solutions`,
            `Implemented best practices and mentored junior team members`
          ]
        },
        {
          company: "Earlier Company",
          position: `Junior ${request.jobTitle}`,
          duration: "2019 - 2021",
          description: [
            `Developed skills in ${request.skills?.slice(0, 2).join(' and ') || 'core technologies'}`,
            `Contributed to team projects and learned industry standards`,
            `Gained experience in ${request.industry} domain knowledge`
          ]
        }
      ],
      education: [
        {
          institution: "University Name",
          degree: "Bachelor's Degree in Related Field",
          year: "2019"
        }
      ],
      skills: request.skills || ["Communication", "Problem Solving", "Team Work", "Leadership"]
    };
  }

  async generateSummary(jobTitle: string, skills: string[]): Promise<string> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: `Write a professional resume summary for a ${jobTitle} with skills in ${skills.join(', ')}. Keep it 2-3 sentences, professional and impactful.`
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      return `Experienced ${jobTitle} with expertise in ${skills.slice(0, 3).join(', ')}. Proven track record of delivering high-quality results and driving team success through innovative solutions and strong collaboration skills.`;
    }
  }
}

export const aiResumeService = new AIResumeService();