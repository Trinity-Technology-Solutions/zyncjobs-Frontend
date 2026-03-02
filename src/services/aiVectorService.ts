interface JobMatch {
  jobId: string;
  score: number;
  title: string;
  company: string;
  location: string;
}

interface CandidateMatch {
  userId: string;
  score: number;
  skills: string[];
}

interface SemanticMatchResult {
  matches: JobMatch[] | CandidateMatch[];
  analysis: string;
}

class AIVectorService {
  private baseUrl = '/api/ai';

  async semanticJobMatch(resumeData: any): Promise<SemanticMatchResult> {
    const response = await fetch(`${this.baseUrl}/semantic-job-match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({ resumeData })
    });

    if (!response.ok) {
      throw new Error('Failed to perform semantic job matching');
    }

    return response.json();
  }

  async semanticCandidateMatch(jobData: any): Promise<SemanticMatchResult> {
    const response = await fetch(`${this.baseUrl}/semantic-candidate-match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({ jobData })
    });

    if (!response.ok) {
      throw new Error('Failed to perform semantic candidate matching');
    }

    return response.json();
  }

  async indexResume(resumeData: any): Promise<void> {
    const response = await fetch(`${this.baseUrl}/index-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({ resumeData })
    });

    if (!response.ok) {
      throw new Error('Failed to index resume');
    }
  }

  async indexJob(jobId: string, jobData: any): Promise<void> {
    const response = await fetch(`${this.baseUrl}/index-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({ jobId, jobData })
    });

    if (!response.ok) {
      throw new Error('Failed to index job');
    }
  }

  async enhanceResumeWithAI(resumeData: any): Promise<string> {
    const response = await fetch(`${this.baseUrl}/enhance-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({ resumeData })
    });

    if (!response.ok) {
      throw new Error('Failed to enhance resume');
    }

    const result = await response.json();
    return result.enhancement;
  }

  async generateJobDescription(jobTitle: string, company: string, requirements?: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/generate-job-description`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({ jobTitle, company, requirements })
    });

    if (!response.ok) {
      throw new Error('Failed to generate job description');
    }

    const result = await response.json();
    return result.jobDescription;
  }

  async getCareerAdvice(query: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/career-advice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error('Failed to get career advice');
    }

    const result = await response.json();
    return result.advice;
  }
}

export default new AIVectorService();