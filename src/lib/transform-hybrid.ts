export interface HybridTransformResult {
  candidate: any;
  ranking: {
    overall: number;
    rule_score: number;
    ai_score: number;
    strengths: string[];
    missing_skills: string[];
    reason: string;
    components: Record<string, any>;
  };
}

export function transformHybridToFrontendFormat(hybridData: any): HybridTransformResult[] {
  // Stub: transform backend hybrid ranking response to frontend format
  if (!hybridData?.rankings) return [];
  return hybridData.rankings.map((r: any, i: number) => ({
    candidate: r.candidate || {},
    ranking: {
      overall: r.ranking?.overall || 0,
      rule_score: r.ranking?.rule_score || 0,
      ai_score: r.ranking?.ai_score || 0,
      strengths: r.ranking?.strengths || [],
      missing_skills: r.ranking?.missing_skills || [],
      reason: r.ranking?.reason || '',
      components: r.ranking?.components || {},
    },
  }));
}