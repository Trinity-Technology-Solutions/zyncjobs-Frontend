/// <reference types="vite/client" />

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

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
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + 55 * 60 * 1000;
  return cachedToken!;
}

export async function executeAI(
  query: string,
  context?: Record<string, unknown>,
  userRole = 'candidate'
): Promise<Record<string, unknown>> {
  const token = await getToken();
  const res = await fetch(`${AI_BASE}/ai/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, context, user_role: userRole }),
  });
  if (!res.ok) throw new Error(`AI execute error: ${res.status}`);
  return res.json();
}

// Extract human-readable reply from any brain response shape
function extractReply(data: any): string {
  const r = data?.result;
  const intent = (data as any)?.intent || '';
  if (!r) return '';
  if (r.reply) return r.reply;
  if (r.advice) return r.advice;
  if (r.search_strategy) return r.search_strategy;
  if (r.job_description) return r.job_description;
  if (r.roadmap) return typeof r.roadmap === 'string' ? r.roadmap : `Roadmap generated! Visit the Career Roadmap page for full details.`;
  if (r.assessment) return r.assessment;
  if (r.career_path && Array.isArray(r.career_path)) {
    const steps = r.career_path.map((s: any, i: number) =>
      `**Step ${i + 1}: ${s.title || s.role || ''}** (${s.estimated_months ? s.estimated_months + ' months' : ''})
${s.description || ''}
Skills: ${Array.isArray(s.skills_to_learn) ? s.skills_to_learn.join(', ') : ''}`
    ).join('\n\n');
    return `Here's your career path (${r.career_path.length} steps):\n\n${steps}\n\n${r.advice ? '💡 ' + r.advice : ''}`.trim();
  }
  if (r.questions && Array.isArray(r.questions)) return `Generated ${r.questions.length} questions. Visit the Skill Assessment page to take the test.`;
  if (r.missing_skills) return `Skill gap: missing ${(r.missing_skills as string[]).slice(0, 4).join(', ')}. Visit Skill Gap Analysis for details.`;
  if (intent === 'RESUME_BUILDER' && r.summary) return `Resume outline:\n\nSummary: ${r.summary}\n\nKey Skills: ${[...(r.skills_formatted?.technical || []), ...(r.skills_formatted?.soft || [])].slice(0, 6).join(', ')}\n\nATS Keywords: ${(r.ats_keywords || []).slice(0, 5).join(', ')}\n\nVisit the Resume Builder page to build your full resume!`;
  if (intent === 'JD_GENERATOR' && r.title) return `Job Description for ${r.title}:\n\n${r.description || ''}\n\nRequirements: ${(r.requirements || []).slice(0, 4).join(', ')}`;
  if (typeof r === 'string') return r;
  return 'I processed your request! Visit the relevant page in ZyncJobs for full details.';
}

// Non-streaming — for JSON responses (Roadmap, Assessment, Skill suggestions)
export async function sendAIMessage(
  messages: ChatMessage[],
  systemPrompt: string,
  signal?: AbortSignal,
  maxTokens = 800
): Promise<string> {
  const userMsg = messages.find(m => m.role === 'user')?.content || '';
  const history = messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
  const isCareerCoach = systemPrompt.toLowerCase().includes('career coach') || systemPrompt.toLowerCase().includes('career advisor');
  const isRecruiter = systemPrompt.toLowerCase().includes('recruiter') || systemPrompt.toLowerCase().includes('hiring');
  const query = isRecruiter ? `recruiter: ${userMsg}` : isCareerCoach ? `career advice: ${userMsg}` : userMsg;
  try {
    const data = await executeAI(query, { systemPrompt, maxTokens, history });
    const reply = extractReply(data);
    if (reply) return reply;
    throw new Error('Empty response');
  } catch {
    throw new Error('AI agent unavailable');
  }
}

// Streaming — for chat (CareerCoach, Recruiter, ChatWidget)
export async function sendAIMessageStream(
  messages: ChatMessage[],
  systemPrompt: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
  userContext?: Record<string, unknown>
): Promise<void> {
  const userMsg = messages[messages.length - 1]?.content || '';
  const history = messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
  const isCareerCoach = systemPrompt.toLowerCase().includes('career') || systemPrompt.toLowerCase().includes('mentor');
  const isRecruiter = systemPrompt.toLowerCase().includes('recruiter') || systemPrompt.toLowerCase().includes('hiring');
  const query = isRecruiter ? `recruiter: ${userMsg}` : isCareerCoach ? `career advice: ${userMsg}` : userMsg;
  const context = { systemPrompt, history, ...(userContext || {}) };
  const data = await executeAI(query, context);
  const reply = extractReply(data);
  if (!reply) throw new Error('Empty AI response');
  // Simulate streaming word by word
  const words = reply.split(' ');
  for (let i = 0; i < words.length; i++) {
    if (signal?.aborted) break;
    onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
    await new Promise(r => setTimeout(r, 25));
  }
}

// Assessment questions — calls AI agent (Ollama via /recruitment-ai/ai/execute)
export async function generateAssessmentQuestions(skill: string): Promise<any[]> {
  const data = await executeAI(
    `generate assessment for ${skill}`,
    { skill, level: 'intermediate', count: 10 }
  );

  const questions: any[] = (data as any).result?.questions;
  if (!Array.isArray(questions) || questions.length === 0) throw new Error('No questions from AI agent');

  const valid = questions.filter((q: any) =>
    q.question &&
    Array.isArray(q.options) && q.options.length === 4 &&
    typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3
  );

  if (valid.length < 5) throw new Error('Too few valid questions from AI agent');

  return valid.slice(0, 10).map((q: any, i: number) => ({
    id: i + 1,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
  }));
}

// Career roadmap — calls AI agent with CAREER_ADVICE intent
export async function generateCareerRoadmap(
  currentRole: string,
  targetRole: string,
  experience: string
): Promise<any> {
  const data = await executeAI(
    `career roadmap from ${currentRole} to ${targetRole}`,
    { current_role: currentRole, target_role: targetRole, experience_years: experience }
  );

  const result = (data as any).result;
  if (!result) throw new Error('No result from AI agent');

  // AI agent returns career_path array — map to frontend Roadmap shape
  if (result.career_path && Array.isArray(result.career_path)) {
    return {
      currentRole,
      targetRole,
      totalTimeframe: result.timeline_months ? `${result.timeline_months} months` : '12-18 months',
      summary: result.advice || `Roadmap from ${currentRole} to ${targetRole}.`,
      steps: result.career_path.map((s: any, i: number) => ({
        step: s.step || i + 1,
        title: s.title || `Phase ${i + 1}`,
        timeframe: s.estimated_months ? `${s.estimated_months} months` : '',
        skills: Array.isArray(s.skills_to_learn) ? s.skills_to_learn : [],
        description: s.description || s.title || '',
        milestone: s.milestone || `Complete phase ${i + 1}`,
      })),
      finalTip: result.advice || 'Stay consistent and keep building.',
    };
  }

  // AI agent returns roadmap array (career_roadmap_brain shape)
  if (result.roadmap && Array.isArray(result.roadmap)) {
    return {
      currentRole,
      targetRole,
      totalTimeframe: result.total_duration_months ? `${result.total_duration_months} months` : '12-18 months',
      summary: result.advice || `Roadmap from ${currentRole} to ${targetRole}.`,
      steps: result.roadmap.map((s: any, i: number) => ({
        step: s.phase || i + 1,
        title: s.title || `Phase ${i + 1}`,
        timeframe: s.duration_months ? `${s.duration_months} months` : '',
        skills: Array.isArray(s.skills_to_learn) ? s.skills_to_learn : [],
        description: (s.goals || []).join('. ') || s.title || '',
        milestone: (s.milestones || [])[0] || `Complete phase ${i + 1}`,
      })),
      finalTip: result.advice || 'Stay consistent and keep building.',
    };
  }

  // If reply is conversational text (CHAT fallback), build a minimal roadmap from it
  if (result.reply || typeof result === 'string') {
    const text = result.reply || result;
    return {
      currentRole,
      targetRole,
      totalTimeframe: '12-18 months',
      summary: typeof text === 'string' ? text : `Roadmap from ${currentRole} to ${targetRole}.`,
      steps: [
        { step: 1, title: 'Build Core Skills', timeframe: '3-6 months', skills: [], description: `Focus on skills required for ${targetRole}.`, milestone: 'Complete foundational learning' },
        { step: 2, title: 'Build Projects', timeframe: '3-6 months', skills: [], description: 'Apply skills in real projects.', milestone: 'Complete 2-3 portfolio projects' },
        { step: 3, title: 'Apply & Interview', timeframe: '3-6 months', skills: [], description: `Apply for ${targetRole} roles on ZyncJobs.`, milestone: 'Land your target role' },
      ],
      finalTip: typeof text === 'string' ? text : 'Stay consistent and keep building.',
    };
  }

  throw new Error('Invalid roadmap response from AI agent');
}

// Generic AI call — CareerCoach, Recruiter backend fallback
export async function callAIWithFallback(
  messages: ChatMessage[],
  systemPrompt: string,
  signal?: AbortSignal
): Promise<string> {
  return sendAIMessage(messages, systemPrompt, signal, 600);
}

// Build rich user context from localStorage for Career Mentor
export function buildUserContext(): Record<string, unknown> {
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    const resumeStore = JSON.parse(localStorage.getItem('zyncjobs-resume-builder') || '{}');
    const resumeData = resumeStore?.state?.data || {};
    // Resume builder stores skills as {name, level} objects — extract name only
    const resumeSkills: string[] = (resumeData.skills || []).map((s: any) =>
      typeof s === 'string' ? s : (s?.name || '')
    ).filter(Boolean);
    const skills: string[] = [
      ...(u.skills || []),
      ...resumeSkills,
    ].filter((s, i, a) => s && a.indexOf(s) === i).slice(0, 15);
    return {
      user_name: u.name || u.fullName || '',
      current_role: u.jobTitle || u.currentRole || '',
      target_role: u.targetRole || u.careerGoal || '',
      skills,
      experience_years: u.experience || u.yearsOfExperience || '',
      ats_score: u.atsScore || null,
      applications_count: u.applicationsCount || null,
      missing_skills: u.missingSkills || [],
      location: u.location || '',
    };
  } catch {
    return {};
  }
}
