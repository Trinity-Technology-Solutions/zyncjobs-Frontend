const API_BASE = import.meta.env.VITE_API_URL || '/api';
import { getCached, setCached, cacheKey } from './aiCache';

export interface MatchScore {
  jobId: string;
  score: number;
  job?: any;
}

export interface MatchBreakdown {
  matchScore: number;
  breakdown: {
    textSimilarity: { score: number; weight: number; contribution: number };
    skillMatch: {
      score: number;
      weight: number;
      contribution: number;
      matched: string[];
      related: string[];
      missing: string[];
    };
    roleMatch: {
      score: number;
      weight: number;
      contribution: number;
      candidateRole: string;
      jobRole: string;
      seniorityMatch: string;
    };
    experienceMatch: { score: number; weight: number; contribution: number };
    locationMatch: { score: number; weight: number; contribution: number };
    educationMatch: { score: number; weight: number; contribution: number };
  };
  job?: any;
}

export interface CandidateMatch {
  userId: string;
  score: number;
  profile?: any;
}

class MatchAPI {
  // Get matched jobs for candidate
  async getMatchedJobs(userId: string, limit = 10): Promise<{ matches: MatchScore[]; total: number }> {
    const res = await fetch(`${API_BASE}/match/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, limit }),
    });
    if (!res.ok) throw new Error('Failed to get matched jobs');
    return res.json();
  }

  // Get job recommendations (smart feed)
  async getRecommendations(userId: string, limit = 10): Promise<{ jobs: any[]; total: number }> {
    // Use userId-only cache key so all callers share the same cached result regardless of limit
    const key = cacheKey('recommendations', userId);
    const cached = getCached<{ jobs: any[]; total: number }>(key);
    if (cached) {
      // Slice to requested limit from cached full result
      return { jobs: cached.jobs.slice(0, limit), total: cached.total };
    }
    // Always fetch with max limit so cache is reusable for smaller requests
    const fetchLimit = Math.max(limit, 20);
    const res = await fetch(`${API_BASE}/match/recommendations/${userId}?limit=${fetchLimit}`);
    if (!res.ok) {
      const msg = await res.text().catch(() => 'Failed to get recommendations');
      throw new Error(msg || 'Failed to get recommendations');
    }
    const data = await res.json();
    const result = { jobs: Array.isArray(data?.jobs) ? data.jobs : [], total: data?.total ?? 0 };
    if (result.jobs.length > 0) setCached(key, result, 2 * 60 * 1000);
    return { jobs: result.jobs.slice(0, limit), total: result.total };
  }

  // Get match explanation
  async getMatchExplanation(jobId: string, userId: string): Promise<MatchBreakdown> {
    const res = await fetch(`${API_BASE}/match/explain/${jobId}?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to get match explanation');
    return res.json();
  }

  // Get similar jobs
  async getSimilarJobs(jobId: string, limit = 5): Promise<{ jobs: any[]; total: number }> {
    const res = await fetch(`${API_BASE}/match/similar/${jobId}?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to get similar jobs');
    return res.json();
  }

  // Get top candidates for job (employer)
  async getTopCandidates(jobId: string, limit = 20): Promise<{ candidates: CandidateMatch[]; total: number }> {
    const res = await fetch(`${API_BASE}/match/top-candidates/${jobId}?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to get top candidates');
    return res.json();
  }

  // Index profile for matching
  async indexProfile(userId: string, profileData: any): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/match/index-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...profileData }),
    });
    if (!res.ok) throw new Error('Failed to index profile');
    return res.json();
  }
}

export const matchAPI = new MatchAPI();
