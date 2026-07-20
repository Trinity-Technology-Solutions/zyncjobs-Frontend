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

function buildContext(): string {
  try {
    const raw = localStorage.getItem('zyncjobs-resume-builder');
    if (!raw) return '';
    const store = JSON.parse(raw);
    const d = store?.state?.data || store?.data || {};
    const parts: string[] = [];
    if (d.targetRole) parts.push(`Target Role: ${d.targetRole}`);
    if (d.personalInfo?.name) parts.push(`Name: ${d.personalInfo.name}`);
    if (d.personalInfo?.email) parts.push(`Email: ${d.personalInfo.email}`);
    if (d.personalInfo?.location) parts.push(`Location: ${d.personalInfo.location}`);
    if (d.goal) {
      const goalLabels: Record<string, string> = { 'first-job': 'First Job / Entry Level', 'internship': 'Internship', 'career-switch': 'Career Switch', 'experienced': 'Experienced Professional', 'executive': 'Executive / Senior Leadership' };
      parts.push(`Experience Level: ${goalLabels[d.goal] || d.goal}`);
    }
    if (d.skills?.length) parts.push(`Skills: ${d.skills.join(', ')}`);
    if (d.education?.length) parts.push(`Education: ${d.education.map((e: any) => `${e.degree} - ${e.institution}`).join(' | ')}`);
    if (d.experience?.length) parts.push(`Experience: ${d.experience.map((e: any) => `${e.title} at ${e.company}`).join(' | ')}`);
    if (d.summary) parts.push(`Current Summary: ${d.summary}`);
    return parts.join('\n');
  } catch { return ''; }
}

function buildQuery(section: string, action: string, content: string): string {
  const resumeContext = buildContext();
  const fullContent = resumeContext ? `${resumeContext}\n\nSection content:\n${content}` : content;
  const sectionLabel = section.charAt(0).toUpperCase() + section.slice(1);
  if (section === 'summary' && action === 'generate') {
    return `Write a concise 2-3 sentence professional summary based on this candidate's profile. No placeholders like [X] or [Y]. No sections. Return ONLY the summary.\n\nCandidate Profile:\n${resumeContext || content}`;
  }
  const actionMap: Record<string, string> = {
    improve: `improve this resume ${section} section based on the full candidate profile below`,
    professional: `rewrite this resume ${section} section in a professional tone based on the candidate profile`,
    ats: `optimize this resume ${section} section for ATS using the candidate profile context`,
    rewrite: `rewrite this resume ${section} section using the candidate profile`,
    shorten: `shorten this resume ${section} section to 2-3 sentences using the candidate profile`,
    friendly: `rewrite this resume ${section} section in a friendly conversational tone using the candidate profile`,
    grammar: `fix grammar in this resume ${section} section`,
    generate: `generate content for resume ${section} section based on this candidate's full profile`,
    quantify: `quantify achievements in this resume ${section} section`,
    find_missing: `find missing skills for this resume based on candidate target role and profile`,
    optimize: `optimize this resume ${section} section for the candidate's profile`,
    score_advice: `analyze and score this resume for ATS compatibility based on candidate profile`,
  };
  const prompt = actionMap[action] || `${action} this resume ${section} section`;
  return `${prompt}\n\nCandidate Profile:\n${resumeContext}\n\n${section} content:\n${content}`;
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

const AI_TIMEOUT = 15000;

export async function executeResumeAI(
  request: ResumeAIExecuteRequest
): Promise<{ result: string; atsData?: Record<string, any> | null; suggestions?: string[] }> {
  const token = await getToken();

  const query = buildQuery(request.section, request.action, request.content);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT);

  try {
    const res = await fetch(`${AI_BASE}/ai/execute`, {
      method: 'POST',
      signal: controller.signal,
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
  } finally {
    clearTimeout(timer);
  }
}
