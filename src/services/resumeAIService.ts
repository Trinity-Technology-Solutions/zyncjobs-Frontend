import { executeAI } from './aiChatService';

export interface ATSResult {
  score: number;
  rule_score: number;
  missing_keywords: string[];
  keyword_optimization: string[];
  matched_keywords: string[];
  suggestions: string[];
  reason: string;
  experience_relevance: number;
  formatting_score: number;
}

export const resumeAIService = {
  async atsScoreV2(resumeContent: string, jobDescription?: string): Promise<ATSResult> {
    const data = await executeAI(
      'ats score check',
      { resume: resumeContent, job_description: jobDescription || '' }
    );
    const r = (data as any).result;
    if (!r || typeof r.ats_score !== 'number') throw new Error('Invalid ATS response');
    return {
      score: r.ats_score,
      rule_score: r.keyword_match?.match_percentage ?? r.ats_score,
      missing_keywords: (r.keyword_match?.missing ?? []).filter((k: string) => k.length < 40),
      keyword_optimization: r.keyword_match?.matched ?? [],
      matched_keywords: r.keyword_match?.matched ?? [],
      suggestions: r.suggestions ?? [],
      reason: r.passes_ats ? 'Resume passes ATS check' : 'Resume needs improvement',
      experience_relevance: r.experience_relevance ?? 0,
      formatting_score: r.formatting_score ?? 0,
    };
  },
};