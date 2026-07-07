import { config } from '../config/env';
import { tokenStorage } from '../utils/tokenStorage';

const BASE = `${config.API_URL}/resume-ai`;

async function post<T>(path: string, body: any): Promise<T> {
  const token = tokenStorage.getAccess();
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface HybridATSResult {
  score: number;
  rule_score: number;
  ai_score: number;
  components: Record<string, number>;
  matching_keywords: string[];
  missing_keywords: string[];
  suggestions: string[];
  grammar_issues: Array<{ type: string; message: string; severity: string }>;
  keyword_optimization: string[];
  reason: string;
}

export interface IntelligenceResult {
  completeness: number;
  checks: Record<string, any>;
  missing_sections: string[];
  filled_sections: number;
  total_sections: number;
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  career_advice: string;
  recommended_certifications: string[];
  verdict: string;
}

export interface GrammarResult {
  issues?: Array<{ type: string; text: string; suggestion: string; severity: string }>;
  error_count?: number;
  readability_score?: number;
  overall_assessment?: string;
  fixed_text?: string;
  changes_made?: number;
  rewritten_text?: string;
  improvements?: string[];
}

export const resumeAIService = {
  atsScoreV2(resumeText: string, jobDescription = '') {
    return post<HybridATSResult>('/ats-score-v2', { resumeText, jobDescription });
  },

  intelligence(resumeJson: Record<string, any>) {
    return post<IntelligenceResult>('/intelligence', { resumeJson });
  },

  grammarCheck(text: string, mode: 'check' | 'fix' | 'rewrite' = 'check') {
    return post<GrammarResult>('/grammar', { text, mode });
  },
};
