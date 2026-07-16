/**
 * ResumeAIClient — thin frontend client for the AI Gateway.
 *
 * POST /recruitment-ai/ai/execute
 * Request:  { query, session_id, user_role, context }
 * Response: { success, intent, result, error, metadata }
 *
 * The AI Gateway (FastAPI) handles intent classification, brain routing,
 * Ollama prompting, and result generation.
 */

const AI_BASE = import.meta.env.VITE_AI_API_URL || '/recruitment-ai';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await fetch(`${AI_BASE}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: 'ai_user', role: 'candidate' }),
  });
  if (!res.ok) throw new Error(`AI auth failed: ${res.status}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + 55 * 60 * 1000;
  return cachedToken!;
}

export interface ResumeAIExecuteRequest {
  section: string;
  action: string;
  content: string;
  experienceId?: string;
}

export interface ResumeAIExecuteResponse {
  success: boolean;
  intent: string | null;
  result: Record<string, any> | null;
  error: string | null;
  metadata: Record<string, any>;
}

function buildQuery(section: string, action: string, content: string): string {
  const sectionLabel = section.charAt(0).toUpperCase() + section.slice(1);
  if (section === 'summary' && action === 'generate') {
    return `Write a concise 2-3 sentence professional summary from the data provided. No placeholders like [X] or [Y]. No sections. Return ONLY the summary.`;
  }
  const actionMap: Record<string, string> = {
    improve: `improve this resume ${section} section`,
    professional: `rewrite this resume ${section} section in a professional tone`,
    ats: `optimize this resume ${section} section for ATS`,
    rewrite: `rewrite this resume ${section} section`,
    shorten: `shorten this resume ${section} section to 2-3 sentences`,
    friendly: `rewrite this resume ${section} section in a friendly conversational tone`,
    grammar: `fix grammar in this resume ${section} section`,
    generate: `generate content for resume ${section} section`,
    quantify: `quantify achievements in this resume ${section} section`,
    find_missing: `find missing skills for this resume`,
    optimize: `optimize this resume ${section} section`,
    score_advice: `analyze and score this resume for ATS compatibility`,
  };
  return actionMap[action] || `${action} this resume ${section} section`;
}

function extractResultText(result: Record<string, any> | null | undefined): string {
  if (!result) return '';
  if (typeof result === 'string') return result;
  if (result.reply) return result.reply;
  if (result.summary) return result.summary;
  if (result.result && typeof result.result === 'string') return result.result;
  if (result.suggestions) return result.suggestions.join('\n');
  if (result.ats_score !== undefined) return JSON.stringify(result);
  return Object.values(result).find(v => typeof v === 'string') || JSON.stringify(result);
}

function extractATSData(result: Record<string, any> | null | undefined): Record<string, any> | null {
  if (!result) return null;
  if (result.ats_score !== undefined) return result;
  return null;
}

function extractSuggestionData(result: Record<string, any> | null | undefined): string[] {
  if (!result) return [];
  if (Array.isArray(result.suggestions)) return result.suggestions;
  if (result.reply) return [result.reply];
  return [];
}

export async function executeResumeAI(
  request: ResumeAIExecuteRequest
): Promise<{ result: string; atsData?: Record<string, any> | null; suggestions?: string[] }> {
  const token = await getToken();

  const query = buildQuery(request.section, request.action, request.content);

  const res = await fetch(`${AI_BASE}/ai/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query,
      session_id: request.experienceId || undefined,
      user_role: 'candidate',
      context: {
        section: request.section,
        action: request.action,
        content: request.content,
        experienceId: request.experienceId,
      },
    }),
  });

  if (!res.ok) throw new Error(`Resume AI execute error: ${res.status}`);

  const data: ResumeAIExecuteResponse = await res.json();

  if (data.error) throw new Error(data.error);

  return {
    result: extractResultText(data.result),
    atsData: extractATSData(data.result),
    suggestions: extractSuggestionData(data.result),
  };
}
