import { API_ENDPOINTS } from '../config/env';

interface AIGenerationRequest {
  type: 'experience' | 'education' | 'summary';
  jobTitle: string;
  company?: string;
  degree?: string;
  school?: string;
  existingContent?: string;
}

class AIService {
  private baseUrl = API_ENDPOINTS.BASE_URL || 'http://localhost:5000';

  async generateContent(request: AIGenerationRequest): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.content || this.getFallbackContent(request);
    } catch (error) {
      console.error('AI Generation Error:', error);
      return this.getFallbackContent(request);
    }
  }



  private getFallbackContent(request: AIGenerationRequest): string {
    switch (request.type) {
      case 'experience':
        return `• Managed daily operations and improved efficiency by implementing new processes
• Collaborated with cross-functional teams to deliver high-quality results
• Analyzed data and provided insights to support strategic decision-making
• Maintained accurate records and ensured compliance with company standards`;
      
      case 'education':
        return `Completed comprehensive coursework in relevant subjects with focus on practical applications. Developed strong analytical and problem-solving skills through various projects and assignments.`;
      
      case 'summary':
        return `Dedicated professional with strong background in ${request.jobTitle.toLowerCase()} and proven track record of delivering results. Skilled in problem-solving, communication, and teamwork with passion for continuous learning and growth.`;
      
      default:
        return 'Professional content generated for resume.';
    }
  }
}

export const aiService = new AIService();
export default aiService;