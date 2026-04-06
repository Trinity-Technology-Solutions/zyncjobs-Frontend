const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface AIGenerateContentRequest {
  jobTitle: string;
  experience: string;
  name?: string;
}

export interface AIGenerateContentResponse {
  summary: string;
  bullets: string[];
  skills: string[];
}

export interface AIOptimizeJDRequest {
  resumeData: {
    summary: string;
    bullets: string[];
    skills: string[];
  };
  jobDescription: string;
}

export interface AIOptimizeJDResponse {
  summary: string;
  bullets: string[];
  skills: string[];
  keywords: string[];
  atsScore: number;
  improvements: string[];
}

export interface AISuggestBulletsRequest {
  text: string;
  jobTitle?: string;
}

export interface AISuggestBulletsResponse {
  suggestions: Array<{
    original: string;
    improved: string;
    reason: string;
  }>;
}

export interface ATSScoreRequest {
  resumeData: {
    personalInfo?: { name?: string; email?: string; phone?: string };
    summary?: string;
    skills?: string[];
    bullets?: string[];
    experience?: any[];
    education?: any[];
  };
}

export interface ATSScoreResponse {
  score: number;
  breakdown: Array<{ label: string; score: number; max: number }>;
  suggestions: string[];
}

class ResumeBuilderAPI {
  // (A) AI Resume Generator - generates summary, bullets, skills
  async generateContent(data: AIGenerateContentRequest): Promise<AIGenerateContentResponse> {
    const res = await fetch(`${API_BASE}/resume-builder/generate-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate content');
    }
    return res.json();
  }

  // (B) JD-Based Optimization - improves resume based on job description
  async optimizeWithJD(data: AIOptimizeJDRequest): Promise<AIOptimizeJDResponse> {
    const res = await fetch(`${API_BASE}/resume-builder/optimize-jd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to optimize resume');
    }
    return res.json();
  }

  // (C) Real-time Bullet Suggestions
  async suggestBullets(data: AISuggestBulletsRequest): Promise<AISuggestBulletsResponse> {
    const res = await fetch(`${API_BASE}/resume-builder/suggest-bullets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to get suggestions');
    }
    return res.json();
  }

  // ATS Score Calculator
  async calculateATSScore(data: ATSScoreRequest): Promise<ATSScoreResponse> {
    const res = await fetch(`${API_BASE}/resume-builder/ats-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to calculate ATS score');
    }
    return res.json();
  }
}

export const resumeBuilderAPI = new ResumeBuilderAPI();
