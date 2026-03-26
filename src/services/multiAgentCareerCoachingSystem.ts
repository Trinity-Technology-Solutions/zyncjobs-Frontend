/**
 * Multi-Agent Career Coaching System
 * Features: Specialized agents, Personalized coaching, Career path planning, Skill development
 */

export interface CoachingSession {
  sessionId: string;
  userId: string;
  timestamp: Date;
  agentType: AgentType;
  query: string;
  response: string;
  recommendations: Recommendation[];
  followUpActions: FollowUpAction[];
  satisfaction?: number;
}

export interface Recommendation {
  id: string;
  type: 'skill' | 'course' | 'job' | 'networking' | 'certification';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timeframe: string;
  resources: Resource[];
  estimatedImpact: number;
}

export interface Resource {
  title: string;
  url: string;
  type: 'course' | 'article' | 'video' | 'book' | 'tool';
  provider: string;
  cost: 'free' | 'paid' | 'freemium';
  duration?: string;
  rating?: number;
}

export interface FollowUpAction {
  action: string;
  deadline: Date;
  completed: boolean;
  reminder: boolean;
}

export type AgentType = 
  | 'career-planner'
  | 'skill-advisor'
  | 'interview-coach'
  | 'resume-expert'
  | 'salary-negotiator'
  | 'networking-guide'
  | 'industry-analyst';

export interface UserProfile {
  id: string;
  currentRole: string;
  experience: number;
  skills: string[];
  interests: string[];
  careerGoals: {
    shortTerm: string;
    longTerm: string;
    timeframe: string;
  };
  challenges: string[];
  preferences: {
    workStyle: string;
    industries: string[];
    locations: string[];
  };
  assessmentResults?: {
    personalityType: string;
    strengthsProfile: string[];
    learningStyle: string;
  };
}

class MultiAgentCareerCoachingSystem {
  private agents: Map<AgentType, CareerAgent> = new Map();
  private sessionHistory: Map<string, CoachingSession[]> = new Map();

  constructor() {
    this.initializeAgents();
  }

  private initializeAgents(): void {
    this.agents.set('career-planner', new CareerPlannerAgent());
    this.agents.set('skill-advisor', new SkillAdvisorAgent());
    this.agents.set('interview-coach', new InterviewCoachAgent());
    this.agents.set('resume-expert', new ResumeExpertAgent());
    this.agents.set('salary-negotiator', new SalaryNegotiatorAgent());
    this.agents.set('networking-guide', new NetworkingGuideAgent());
    this.agents.set('industry-analyst', new IndustryAnalystAgent());
  }

  async getCoaching(
    userId: string,
    query: string,
    userProfile: UserProfile,
    preferredAgent?: AgentType
  ): Promise<CoachingSession> {
    // Determine best agent for the query
    const agentType = preferredAgent || this.determineOptimalAgent(query, userProfile);
    const agent = this.agents.get(agentType);

    if (!agent) {
      throw new Error(`Agent ${agentType} not found`);
    }

    // Generate response
    const response = await agent.generateResponse(query, userProfile, this.getSessionHistory(userId));
    const recommendations = await agent.generateRecommendations(query, userProfile);
    const followUpActions = agent.generateFollowUpActions(query, userProfile);

    // Create session
    const session: CoachingSession = {
      sessionId: this.generateSessionId(),
      userId,
      timestamp: new Date(),
      agentType,
      query,
      response,
      recommendations,
      followUpActions
    };

    // Store session
    this.storeSession(userId, session);

    return session;
  }

  private determineOptimalAgent(query: string, userProfile: UserProfile): AgentType {
    const queryLower = query.toLowerCase();

    // Keyword-based agent selection
    if (queryLower.includes('career path') || queryLower.includes('career plan') || queryLower.includes('next step')) {
      return 'career-planner';
    }
    if (queryLower.includes('skill') || queryLower.includes('learn') || queryLower.includes('course')) {
      return 'skill-advisor';
    }
    if (queryLower.includes('interview') || queryLower.includes('preparation')) {
      return 'interview-coach';
    }
    if (queryLower.includes('resume') || queryLower.includes('cv')) {
      return 'resume-expert';
    }
    if (queryLower.includes('salary') || queryLower.includes('negotiate') || queryLower.includes('compensation')) {
      return 'salary-negotiator';
    }
    if (queryLower.includes('network') || queryLower.includes('connect') || queryLower.includes('linkedin')) {
      return 'networking-guide';
    }
    if (queryLower.includes('industry') || queryLower.includes('market') || queryLower.includes('trend')) {
      return 'industry-analyst';
    }

    // Default to career planner for general queries
    return 'career-planner';
  }

  private getSessionHistory(userId: string): CoachingSession[] {
    return this.sessionHistory.get(userId) || [];
  }

  private storeSession(userId: string, session: CoachingSession): void {
    const history = this.getSessionHistory(userId);
    history.push(session);
    this.sessionHistory.set(userId, history);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get personalized dashboard for user
  async getPersonalizedDashboard(userId: string, userProfile: UserProfile): Promise<{
    currentGoals: string[];
    nextActions: FollowUpAction[];
    skillProgress: { skill: string; progress: number }[];
    recommendations: Recommendation[];
  }> {
    const history = this.getSessionHistory(userId);
    const recentSessions = history.slice(-10);

    // Aggregate follow-up actions
    const nextActions = recentSessions
      .flatMap(session => session.followUpActions)
      .filter(action => !action.completed)
      .slice(0, 5);

    // Get skill progress (simulated)
    const skillProgress = userProfile.skills.map(skill => ({
      skill,
      progress: Math.floor(Math.random() * 100) // In real implementation, track actual progress
    }));

    // Get current recommendations
    const recommendations = recentSessions
      .flatMap(session => session.recommendations)
      .filter(rec => rec.priority === 'high')
      .slice(0, 3);

    return {
      currentGoals: [userProfile.careerGoals.shortTerm, userProfile.careerGoals.longTerm],
      nextActions,
      skillProgress,
      recommendations
    };
  }
}

// Base class for all career agents
abstract class CareerAgent {
  abstract generateResponse(query: string, userProfile: UserProfile, history: CoachingSession[]): Promise<string>;
  abstract generateRecommendations(query: string, userProfile: UserProfile): Promise<Recommendation[]>;
  abstract generateFollowUpActions(query: string, userProfile: UserProfile): FollowUpAction[];

  protected generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected createRecommendation(
    type: Recommendation['type'],
    title: string,
    description: string,
    priority: Recommendation['priority'],
    timeframe: string,
    resources: Resource[] = [],
    estimatedImpact: number = 70
  ): Recommendation {
    return {
      id: this.generateId(),
      type,
      title,
      description,
      priority,
      timeframe,
      resources,
      estimatedImpact
    };
  }
}

// Career Planner Agent
class CareerPlannerAgent extends CareerAgent {
  async generateResponse(query: string, userProfile: UserProfile, history: CoachingSession[]): Promise<string> {
    const { currentRole, experience, careerGoals } = userProfile;

    if (query.toLowerCase().includes('career path')) {
      return `Based on your current role as ${currentRole} with ${experience} years of experience, here's your personalized career path:

**Short-term (1-2 years):**
- Focus on developing ${this.getNextSkills(userProfile).slice(0, 2).join(' and ')}
- Aim for ${this.getNextRole(currentRole)} position
- Build a portfolio showcasing your ${userProfile.skills.slice(0, 3).join(', ')} skills

**Long-term (3-5 years):**
- Target: ${careerGoals.longTerm}
- Leadership development and team management skills
- Industry expertise and thought leadership

**Key Milestones:**
1. Complete 2-3 significant projects in your current role
2. Obtain relevant certifications
3. Build a strong professional network
4. Develop mentoring relationships

Would you like me to create a detailed action plan for any of these areas?`;
    }

    return `Let me help you plan your career journey. Based on your profile, I see great potential for growth in your field. What specific aspect of career planning would you like to focus on?`;
  }

  async generateRecommendations(query: string, userProfile: UserProfile): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Skill development recommendation
    recommendations.push(this.createRecommendation(
      'skill',
      'Develop Next-Level Skills',
      `Focus on ${this.getNextSkills(userProfile).slice(0, 2).join(' and ')} to advance your career`,
      'high',
      '3-6 months',
      [
        {
          title: 'Advanced Course on Coursera',
          url: 'https://coursera.org',
          type: 'course',
          provider: 'Coursera',
          cost: 'paid',
          duration: '4-6 weeks',
          rating: 4.5
        }
      ],
      85
    ));

    // Networking recommendation
    recommendations.push(this.createRecommendation(
      'networking',
      'Expand Professional Network',
      'Connect with 5 professionals in your target role each month',
      'medium',
      '1-3 months',
      [],
      70
    ));

    return recommendations;
  }

  generateFollowUpActions(query: string, userProfile: UserProfile): FollowUpAction[] {
    return [
      {
        action: 'Update LinkedIn profile with career goals',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
        completed: false,
        reminder: true
      },
      {
        action: 'Research 3 companies in target industry',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
        completed: false,
        reminder: true
      }
    ];
  }

  private getNextSkills(userProfile: UserProfile): string[] {
    // Simplified logic - in real implementation, use ML/AI
    const skillGaps = ['leadership', 'project management', 'data analysis', 'cloud computing'];
    return skillGaps.filter(skill => !userProfile.skills.includes(skill));
  }

  private getNextRole(currentRole: string): string {
    const roleProgression: Record<string, string> = {
      'software engineer': 'senior software engineer',
      'senior software engineer': 'tech lead',
      'data analyst': 'senior data analyst',
      'product manager': 'senior product manager'
    };
    return roleProgression[currentRole.toLowerCase()] || 'senior ' + currentRole;
  }
}

// Skill Advisor Agent
class SkillAdvisorAgent extends CareerAgent {
  async generateResponse(query: string, userProfile: UserProfile): Promise<string> {
    const skillGaps = this.identifySkillGaps(userProfile);
    
    return `Based on your career goals and current skill set, here's my analysis:

**Your Strengths:**
${userProfile.skills.slice(0, 3).map(skill => `• ${skill}`).join('\n')}

**Recommended Skills to Develop:**
${skillGaps.slice(0, 3).map((skill, index) => `${index + 1}. **${skill.name}** - ${skill.reason}`).join('\n')}

**Learning Path:**
1. Start with ${skillGaps[0]?.name} (highest impact)
2. Dedicate 5-10 hours per week to learning
3. Apply skills in real projects
4. Get certified when possible

Would you like specific course recommendations for any of these skills?`;
  }

  async generateRecommendations(query: string, userProfile: UserProfile): Promise<Recommendation[]> {
    const skillGaps = this.identifySkillGaps(userProfile);
    
    return skillGaps.slice(0, 2).map(skill => 
      this.createRecommendation(
        'skill',
        `Learn ${skill.name}`,
        skill.reason,
        'high',
        '2-4 months',
        this.getSkillResources(skill.name),
        skill.impact
      )
    );
  }

  generateFollowUpActions(query: string, userProfile: UserProfile): FollowUpAction[] {
    return [
      {
        action: 'Enroll in recommended course',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        completed: false,
        reminder: true
      },
      {
        action: 'Practice new skill in side project',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        completed: false,
        reminder: true
      }
    ];
  }

  private identifySkillGaps(userProfile: UserProfile): Array<{name: string; reason: string; impact: number}> {
    // Simplified skill gap analysis
    return [
      { name: 'Machine Learning', reason: 'High demand in your target role', impact: 90 },
      { name: 'Cloud Computing', reason: 'Essential for modern development', impact: 85 },
      { name: 'Leadership', reason: 'Required for career advancement', impact: 80 }
    ];
  }

  private getSkillResources(skillName: string): Resource[] {
    const resourceMap: Record<string, Resource[]> = {
      'Machine Learning': [
        {
          title: 'Machine Learning Course by Andrew Ng',
          url: 'https://coursera.org/learn/machine-learning',
          type: 'course',
          provider: 'Coursera',
          cost: 'freemium',
          duration: '11 weeks',
          rating: 4.9
        }
      ],
      'Cloud Computing': [
        {
          title: 'AWS Cloud Practitioner',
          url: 'https://aws.amazon.com/certification/',
          type: 'course',
          provider: 'AWS',
          cost: 'free',
          duration: '4-6 weeks',
          rating: 4.7
        }
      ]
    };
    
    return resourceMap[skillName] || [];
  }
}

// Interview Coach Agent
class InterviewCoachAgent extends CareerAgent {
  async generateResponse(query: string, userProfile: UserProfile): Promise<string> {
    return `Let me help you ace your interviews! Here's a personalized preparation plan:

**For ${userProfile.currentRole} interviews:**

**Technical Preparation:**
• Review core concepts in ${userProfile.skills.slice(0, 3).join(', ')}
• Practice coding problems (if applicable)
• Prepare system design scenarios

**Behavioral Questions:**
• Use STAR method (Situation, Task, Action, Result)
• Prepare 5-7 stories showcasing your achievements
• Practice common questions like "Tell me about yourself"

**Company Research:**
• Study the company's mission, values, and recent news
• Understand their products/services
• Research the interviewer on LinkedIn

**Questions to Ask:**
• "What does success look like in this role?"
• "What are the biggest challenges facing the team?"
• "How do you support professional development?"

Would you like me to conduct a mock interview or help you prepare specific answers?`;
  }

  async generateRecommendations(query: string, userProfile: UserProfile): Promise<Recommendation[]> {
    return [
      this.createRecommendation(
        'course',
        'Mock Interview Practice',
        'Practice with AI-powered mock interviews',
        'high',
        '1-2 weeks',
        [],
        80
      )
    ];
  }

  generateFollowUpActions(query: string, userProfile: UserProfile): FollowUpAction[] {
    return [
      {
        action: 'Complete 3 mock interviews',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        completed: false,
        reminder: true
      }
    ];
  }
}

// Resume Expert Agent
class ResumeExpertAgent extends CareerAgent {
  async generateResponse(query: string, userProfile: UserProfile): Promise<string> {
    return `Let me help you create a standout resume:

**Key Improvements for Your Resume:**

**1. Professional Summary**
Write a 3-4 line summary highlighting:
• Your ${userProfile.experience} years of experience in ${userProfile.currentRole}
• Key skills: ${userProfile.skills.slice(0, 3).join(', ')}
• Career goal: ${userProfile.careerGoals.shortTerm}

**2. Experience Section**
• Use action verbs (achieved, developed, implemented)
• Quantify achievements with numbers and percentages
• Focus on impact, not just responsibilities

**3. Skills Section**
• Categorize: Technical Skills, Soft Skills, Tools
• Match keywords from job descriptions
• Include proficiency levels

**4. ATS Optimization**
• Use standard section headings
• Include relevant keywords
• Save as PDF and Word formats

Would you like me to review your current resume or help you write specific sections?`;
  }

  async generateRecommendations(query: string, userProfile: UserProfile): Promise<Recommendation[]> {
    return [
      this.createRecommendation(
        'course',
        'Resume Writing Workshop',
        'Learn to write ATS-optimized resumes',
        'medium',
        '1 week',
        [],
        75
      )
    ];
  }

  generateFollowUpActions(query: string, userProfile: UserProfile): FollowUpAction[] {
    return [
      {
        action: 'Update resume with quantified achievements',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        completed: false,
        reminder: true
      }
    ];
  }
}

// Salary Negotiator Agent
class SalaryNegotiatorAgent extends CareerAgent {
  async generateResponse(query: string, userProfile: UserProfile): Promise<string> {
    return `Here's your salary negotiation strategy:

**Research Phase:**
• Use Glassdoor, PayScale, and LinkedIn Salary for market data
• Factor in your ${userProfile.experience} years of experience
• Consider location and company size

**Negotiation Strategy:**
1. **Never give the first number** - Ask "What's the budgeted range?"
2. **Anchor high** - Start 15-20% above your target
3. **Negotiate the package** - Base salary, bonus, equity, benefits
4. **Show value** - Highlight your unique skills and achievements

**Key Phrases:**
• "Based on my research and experience..."
• "I'm looking for a package that reflects my value..."
• "Can we find a middle ground that works for both of us?"

**Beyond Salary:**
• Flexible working arrangements
• Professional development budget
• Additional vacation days
• Stock options or equity

Would you like help preparing for a specific negotiation scenario?`;
  }

  async generateRecommendations(query: string, userProfile: UserProfile): Promise<Recommendation[]> {
    return [
      this.createRecommendation(
        'course',
        'Salary Negotiation Masterclass',
        'Learn advanced negotiation techniques',
        'high',
        '2-3 days',
        [],
        85
      )
    ];
  }

  generateFollowUpActions(query: string, userProfile: UserProfile): FollowUpAction[] {
    return [
      {
        action: 'Research salary ranges for target roles',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        completed: false,
        reminder: true
      }
    ];
  }
}

// Networking Guide Agent
class NetworkingGuideAgent extends CareerAgent {
  async generateResponse(query: string, userProfile: UserProfile): Promise<string> {
    return `Let's build your professional network strategically:

**LinkedIn Optimization:**
• Professional headshot and compelling headline
• Summary highlighting your expertise in ${userProfile.skills.slice(0, 2).join(' and ')}
• Regular posts about industry insights
• Engage with others' content meaningfully

**Networking Strategy:**
1. **Quality over quantity** - Focus on meaningful connections
2. **Give before you receive** - Share knowledge and help others
3. **Follow up consistently** - Stay in touch with your network

**Where to Network:**
• Industry conferences and meetups
• Professional associations
• Alumni networks
• Online communities (Reddit, Discord, Slack groups)

**Conversation Starters:**
• "I noticed your work on [specific project]..."
• "What trends are you seeing in [industry]?"
• "I'd love to learn about your career journey..."

**Monthly Goals:**
• Connect with 10 new professionals
• Have 3 meaningful conversations
• Share 2 valuable pieces of content

Would you like help crafting connection messages or planning your networking strategy?`;
  }

  async generateRecommendations(query: string, userProfile: UserProfile): Promise<Recommendation[]> {
    return [
      this.createRecommendation(
        'networking',
        'Join Professional Communities',
        'Connect with peers in your industry',
        'medium',
        '1 month',
        [],
        70
      )
    ];
  }

  generateFollowUpActions(query: string, userProfile: UserProfile): FollowUpAction[] {
    return [
      {
        action: 'Send 5 LinkedIn connection requests',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        completed: false,
        reminder: true
      }
    ];
  }
}

// Industry Analyst Agent
class IndustryAnalystAgent extends CareerAgent {
  async generateResponse(query: string, userProfile: UserProfile): Promise<string> {
    const industries = userProfile.preferences.industries;
    
    return `Here's the current landscape for your target industries:

**Industry Trends:**
${industries.map(industry => `
**${industry}:**
• Growth rate: ${this.getGrowthRate(industry)}
• Key skills in demand: ${this.getInDemandSkills(industry).join(', ')}
• Salary trends: ${this.getSalaryTrend(industry)}
• Remote work adoption: ${this.getRemoteWorkTrend(industry)}
`).join('\n')}

**Opportunities:**
• Emerging roles in AI/ML and data science
• Increased demand for cloud expertise
• Growing need for cybersecurity professionals

**Challenges:**
• Automation affecting certain roles
• Need for continuous upskilling
• Competition from global talent pool

**Recommendations:**
1. Focus on skills that complement AI (creativity, strategy, leadership)
2. Develop expertise in emerging technologies
3. Build a strong personal brand in your niche

Would you like deeper analysis on any specific industry or trend?`;
  }

  async generateRecommendations(query: string, userProfile: UserProfile): Promise<Recommendation[]> {
    return [
      this.createRecommendation(
        'course',
        'Industry Trend Analysis',
        'Stay updated with industry developments',
        'low',
        'Ongoing',
        [],
        60
      )
    ];
  }

  generateFollowUpActions(query: string, userProfile: UserProfile): FollowUpAction[] {
    return [
      {
        action: 'Subscribe to industry newsletters',
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        completed: false,
        reminder: true
      }
    ];
  }

  private getGrowthRate(industry: string): string {
    const rates: Record<string, string> = {
      'technology': 'High (15-20% annually)',
      'healthcare': 'Stable (5-8% annually)',
      'finance': 'Moderate (8-12% annually)'
    };
    return rates[industry.toLowerCase()] || 'Moderate';
  }

  private getInDemandSkills(industry: string): string[] {
    const skills: Record<string, string[]> = {
      'technology': ['AI/ML', 'Cloud Computing', 'DevOps', 'Cybersecurity'],
      'healthcare': ['Data Analysis', 'Telemedicine', 'Compliance', 'Patient Care'],
      'finance': ['FinTech', 'Risk Management', 'Blockchain', 'Regulatory Knowledge']
    };
    return skills[industry.toLowerCase()] || ['Leadership', 'Communication', 'Problem Solving'];
  }

  private getSalaryTrend(industry: string): string {
    return 'Increasing 5-10% annually';
  }

  private getRemoteWorkTrend(industry: string): string {
    const trends: Record<string, string> = {
      'technology': 'High (80%+ remote-friendly)',
      'healthcare': 'Low (20% remote-friendly)',
      'finance': 'Medium (50% hybrid)'
    };
    return trends[industry.toLowerCase()] || 'Medium';
  }
}

export const multiAgentCareerCoachingSystem = new MultiAgentCareerCoachingSystem();
export default multiAgentCareerCoachingSystem;