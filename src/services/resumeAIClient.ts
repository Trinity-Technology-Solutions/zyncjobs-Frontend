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

async function getToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  try {
    const res = await fetch(`${AI_BASE}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'ai_user', role: 'candidate' }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + 55 * 60 * 1000;
    return cachedToken!;
  } catch {
    return null;
  }
}

export interface ResumeAIExecuteRequest {
  section: string;
  action: string;
  content: string;
  experienceId?: string;
  context?: Record<string, unknown>;
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
  if (section === 'skills' && action === 'analyze_gap') {
    return `Analyze the candidate's skill gaps for the exact target role using the resume evidence below. Return only a JSON object in this exact shape: {"missing_skills":[{"skill":"Docker"}]}. The missing_skills value must always be an array and may be empty. Include up to 8 concise skills only if each is genuinely relevant to this role and not already demonstrated in the candidate's listed skills, experience, or projects. Treat equivalent terms as the same skill (for example, REST and REST APIs). Do not infer skills solely from a job title. Never return generic terms, years of experience, duties, recommendations, explanations, or interview questions. Do not recommend skills unrelated to the role just to fill the list. If there are no reliable gaps, return {"missing_skills":[]}.\n\nCandidate evidence:\n${fullContent}`;
  }
  if (section === 'cover_letter' && action === 'generate') {
    return `Write a complete, ready-to-send cover letter for the candidate and job below. The candidate is applying for the named job; do not write instructions about generating a letter. Start with "Dear Hiring Team," and finish with "Sincerely," followed by the candidate's name. Use 3-4 short paragraphs and the requested tone. Mention the exact job title and company. Use only the candidate details supplied; do not invent company facts, achievements, experience length, or qualifications. If experience is limited, present the candidate's education, projects, and documented skills honestly. Return only the letter, with no heading, labels, analysis, or prompt text.\n\nCandidate and job details:\n${fullContent}`;
  }
  if (section === 'summary' && action === 'generate') {
    return `You are a professional resume writer. Write exactly 3 different professional summary options for the candidate profile below.

RULES:
- Each option must be 2-3 sentences
- Use the EXACT job role specified in the profile — do NOT substitute or invent a different role
- Tailor the emphasis to the selected role, but mention only tools, skills, responsibilities, employers, achievements, or years explicitly present in the candidate profile
- Never invent experience duration, seniority, employers, metrics, accomplishments, technologies, or qualifications
- If the profile does not show direct experience in the selected role, describe the candidate as targeting that role and connect only documented skills or transferable experience
- Avoid generic claims such as "proven track record" unless the profile supports them
- Start each with a strong action-oriented opening
- No placeholders like [X] or [Y], no labels, no markdown
- Separate each option with "---" on its own line
- Return ONLY the 3 options, nothing else

Candidate Profile:
${content}`;
  }
  if (section === 'resume' && action === 'optimize') {
    return `Optimize the candidate's resume for the TARGET JOB below. The job description describes the job they want; it is not evidence about their past experience.

ACCURACY RULES:
- Use the explicit Role/Job Title in the job description as the target role, if present. Do not silently replace it with another role.
- Candidate experience titles, employers, dates, responsibilities, achievements, and tools are factual. Preserve past job titles and employers; never turn a Frontend Developer or QA Engineer role into Backend Developer (or any other target title).
- Tailor the summary to the target job using documented transferable skills. Do not claim the candidate is an experienced [target role] unless their supplied experience supports that claim.
- Rewrite bullets only from facts in the corresponding supplied experience. Preserve responsibility and scope. Never invent technologies, duties, project work, metrics, or achievements.
- Return keywords only if they are already evidenced in the candidate's skills, experience, projects, education, or certifications. Never add unsupported JD requirements as candidate skills.
- If the JD asks for undocumented skills or experience, do not write them into the resume; mention them as gaps in improvements.
- Return ONLY valid JSON: {"target_role":"role from JD or empty string","optimized_summary":"...","keywords":["..."],"optimized_bullets":["..."],"improvements":["..."]}. Keep optimized_bullets in the same order and count as the first experience entry's original bullets. No markdown or extra text.

Candidate profile (source of truth for candidate facts):
${resumeContext || '(No additional profile context supplied)'}

Job description and resume evidence:
${content}`;
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
  if (Array.isArray(result)) return JSON.stringify(result);
  if (Array.isArray(result.missing_skills)) return JSON.stringify(result);
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

// Local Ollama can need over a minute for full-resume analysis, especially if
// the skill-gap brain has to retry an invalid JSON response once.
const AI_TIMEOUT = 180000;

export async function executeResumeAI(
  request: ResumeAIExecuteRequest
): Promise<{ result: string; atsData?: Record<string, any> | null; suggestions?: string[] }> {
  const token = await getToken();

  const query = buildQuery(request.section, request.action, request.content);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT);

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${AI_BASE}/ai/execute`, {
      method: 'POST',
      signal: controller.signal,
      headers,
      body: JSON.stringify({
        query,
        session_id: request.experienceId || undefined,
        user_role: 'candidate',
        context: {
          section: request.section,
          action: request.action,
          content: request.content,
          experienceId: request.experienceId,
          ...request.context,
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
