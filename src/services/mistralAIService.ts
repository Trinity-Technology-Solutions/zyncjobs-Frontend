import { API_ENDPOINTS } from '../config/env';

const API_BASE_URL = API_ENDPOINTS.BASE_URL || 'http://localhost:5000';
const SUGGEST_API_URL = `${API_BASE_URL}/api/suggest`;

class MistralAIService {
  private async callBackendAPI(endpoint: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-suggestions/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Backend API call failed:', error);
      throw error;
    }
  }

  async getJobTitleSuggestions(input: string): Promise<string[]> {
    try {
      const response = await fetch(`${SUGGEST_API_URL}?q=${encodeURIComponent(input)}&type=job`);
      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      return this.getFallbackJobTitles(input);
    }
  }

  async getSkillSuggestions(input: string): Promise<string[]> {
    try {
      const response = await fetch(`${SUGGEST_API_URL}?q=${encodeURIComponent(input)}&type=skill`);
      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      return this.getFallbackSkills(input);
    }
  }

  async getLocationSuggestions(input: string): Promise<string[]> {
    try {
      const response = await fetch(`${SUGGEST_API_URL}?q=${encodeURIComponent(input)}&type=location`);
      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      return this.getFallbackLocations(input);
    }
  }

  async generateJobDescription(jobTitle: string, company?: string, location?: string, additionalContext?: any): Promise<string> {
    // Use fallback system directly since backend AI endpoint doesn't exist
    return this.getFallbackJobDescription(jobTitle, additionalContext);
  }

  // Fallback methods for when API fails
  private getFallbackJobTitles(input: string): string[] {
    const fallbacks: { [key: string]: string[] } = {
      'software': ['Software Developer', 'Software Engineer', 'Software Tester', 'Software Architect'],
      'data': ['Data Scientist', 'Data Analyst', 'Data Engineer', 'Data Architect'],
      'frontend': ['Frontend Developer', 'Frontend Engineer', 'UI Developer', 'React Developer'],
      'backend': ['Backend Developer', 'Backend Engineer', 'API Developer', 'Server Engineer'],
      'full': ['Full Stack Developer', 'Full Stack Engineer', 'Fullstack Developer'],
      'senior': ['Senior Developer', 'Senior Engineer', 'Senior Architect', 'Senior Consultant']
    };

    const key = input.toLowerCase();
    for (const [prefix, suggestions] of Object.entries(fallbacks)) {
      if (prefix.startsWith(key) || key.includes(prefix)) {
        return suggestions;
      }
    }
    return ['Software Developer', 'Software Engineer', 'Data Scientist', 'Product Manager'];
  }

  private getFallbackSkills(input: string): string[] {
    const fallbacks: { [key: string]: string[] } = {
      'py': ['Python', 'PyTorch', 'PySpark', 'Pytest'],
      'java': ['JavaScript', 'Java', 'jQuery', 'JSON'],
      'react': ['React', 'React Native', 'Redux', 'React Router'],
      'node': ['Node.js', 'Express.js', 'npm', 'Nodemon'],
      'aws': ['AWS', 'AWS Lambda', 'AWS S3', 'AWS EC2'],
      'azure': ['Azure', 'Azure Functions', 'Azure DevOps', 'Azure SQL'],
      'sql': ['SQL', 'MySQL', 'PostgreSQL', 'SQLite'],
      'git': ['Git', 'GitHub', 'GitLab', 'Bitbucket'],
      'docker': ['Docker', 'Docker Compose', 'Kubernetes', 'Container Orchestration'],
      'angular': ['Angular', 'AngularJS', 'TypeScript', 'RxJS'],
      'vue': ['Vue.js', 'Vuex', 'Vue Router', 'Nuxt.js'],
      'css': ['CSS', 'CSS3', 'Sass', 'SCSS'],
      'html': ['HTML', 'HTML5', 'Semantic HTML', 'Web Standards']
    };

    const key = input.toLowerCase();
    for (const [prefix, suggestions] of Object.entries(fallbacks)) {
      if (prefix.startsWith(key)) {
        return suggestions;
      }
    }
    return ['JavaScript', 'Python', 'React', 'Node.js'];
  }

  private getFallbackLocations(input: string): string[] {
    const fallbacks: { [key: string]: string[] } = {
      'ch': ['Chennai', 'Chicago', 'Charlotte', 'Chandigarh'],
      'san': ['San Francisco', 'San Diego', 'San Jose', 'Santa Clara'],
      'new': ['New York', 'New Delhi', 'Newark', 'Newcastle'],
      'ban': ['Bangalore', 'Bangkok', 'Bangladesh', 'Bangor']
    };

    const key = input.toLowerCase();
    for (const [prefix, suggestions] of Object.entries(fallbacks)) {
      if (prefix.startsWith(key)) {
        return suggestions;
      }
    }
    return ['New York', 'San Francisco', 'London', 'Bangalore'];
  }

  private getFallbackJobDescription(jobTitle: string, context?: any): string {
    const title = jobTitle.toLowerCase();
    const skills = context?.skills?.length > 0 ? context.skills.join(', ') : 'relevant skills';
    const salary = context?.salary || 'competitive salary';
    const jobType = context?.jobType || 'full-time';
    const education = context?.educationLevel || 'Bachelor\'s degree';
    
    // Accounting/Finance roles
    if (title.includes('accountant') || title.includes('accounting') || title.includes('finance')) {
      return `We are seeking a detail-oriented ${jobTitle} to join our finance team.

Position Overview:
This is a ${jobType} position offering ${salary} with excellent career growth opportunities.

Key Responsibilities:
• Prepare and maintain accurate financial records and statements
• Process accounts payable and receivable transactions
• Assist with monthly, quarterly, and annual financial reporting
• Reconcile bank statements and general ledger accounts
• Support budget preparation and financial analysis
• Ensure compliance with accounting standards and regulations

Required Qualifications:
• ${education} in Accounting, Finance, or related field
• 2+ years of accounting experience
• Proficiency in accounting software (QuickBooks, SAP, Excel)
• Strong attention to detail and analytical skills
• Knowledge of GAAP and tax regulations
• Excellent organizational and time management skills

What We Offer:
• ${salary} based on experience
• Comprehensive health, dental, and vision insurance
• Professional development and certification support
• Stable work environment with growth opportunities
• Modern accounting tools and technology
• Flexible working arrangements

Join our team and contribute to our financial success!`;
    }
    
    // Software/Tech roles
    if (title.includes('developer') || title.includes('engineer') || title.includes('programmer')) {
      return `We are seeking a talented ${jobTitle} to join our dynamic team.

Position Overview:
This is a ${jobType} position offering ${salary} and excellent growth opportunities.

Key Responsibilities:
• Design, develop, and maintain high-quality software solutions
• Collaborate with cross-functional teams to deliver innovative projects
• Write clean, efficient, and well-documented code
• Participate in code reviews and technical discussions
• Stay updated with latest industry trends and technologies
• Mentor junior team members and contribute to team knowledge sharing

Required Qualifications:
• ${education} in Computer Science, Engineering, or related field
• 3+ years of professional experience in software development
• Strong expertise in: ${skills}
• Excellent problem-solving and analytical skills
• Strong communication and teamwork abilities
• Experience with version control systems (Git)

What We Offer:
• ${salary} based on experience
• Comprehensive health, dental, and vision insurance
• Flexible working arrangements and remote work options
• Professional development opportunities and training budget
• Collaborative and innovative work environment
• Modern tech stack and cutting-edge projects

Join our team and help us build the future of technology!`;
    }
    
    // Generic fallback for other roles
    return `We are seeking a qualified ${jobTitle} to join our team.

Position Overview:
This is a ${jobType} position offering ${salary} with opportunities for professional growth.

Key Responsibilities:
• Execute core responsibilities related to ${jobTitle}
• Collaborate with team members and stakeholders
• Maintain high standards of work quality and professionalism
• Contribute to organizational goals and objectives
• Support continuous improvement initiatives
• Participate in training and development programs

Required Qualifications:
• ${education} or equivalent experience
• Relevant experience in the field
• Strong analytical and problem-solving skills
• Excellent communication and interpersonal abilities
• Attention to detail and accuracy
• Ability to work independently and as part of a team

What We Offer:
• ${salary} based on experience
• Comprehensive benefits package
• Professional growth opportunities
• Supportive and collaborative work environment
• Training and development programs
• Work-life balance initiatives

Join our team and make a meaningful impact!`;
  }
}

// Export additional function for direct use
export const generateJobDescription = async (jobTitle: string, context?: {
  jobType?: string;
  skills?: string;
  salaryRange?: string;
  benefits?: string;
  education?: string;
}): Promise<string> => {
  return mistralAIService.generateJobDescription(jobTitle, undefined, undefined, context);
};

const mistralAIService = new MistralAIService();
export default mistralAIService;