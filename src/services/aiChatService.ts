/// <reference types="vite/client" />

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const AI_BASE = '/recruitment-ai';

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
  return cachedToken;
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

// Non-streaming — for JSON responses (Roadmap, Assessment, Skill suggestions)
export async function sendAIMessage(
  messages: ChatMessage[],
  systemPrompt: string,
  signal?: AbortSignal,
  maxTokens = 800
): Promise<string> {
  const userMsg = messages.find(m => m.role === 'user')?.content || '';
  try {
    const data = await executeAI(userMsg, { systemPrompt, maxTokens });
    const reply = (data as any).result?.reply || (data as any).result?.job_description || JSON.stringify((data as any).result);
    if (reply) return reply;
    throw new Error('Empty response');
  } catch {
    // Fallback to old backend
    const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, systemPrompt, maxTokens }),
      signal,
    });
    if (!res.ok) throw new Error(`AI chat error: ${res.status}`);
    const data = await res.json();
    return data.content?.trim() || data.reply?.trim() || data.message?.trim() || '';
  }
}

// Streaming — for chat (CareerCoach, Recruiter, ChatWidget)
export async function sendAIMessageStream(
  messages: ChatMessage[],
  systemPrompt: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const userMsg = messages[messages.length - 1]?.content || '';
  // Detect career coach context from system prompt to route correctly
  const isCareerCoach = systemPrompt.toLowerCase().includes('career coach') || systemPrompt.toLowerCase().includes('career advisor');
  const isRecruiter = systemPrompt.toLowerCase().includes('recruiter') || systemPrompt.toLowerCase().includes('hiring');
  const query = isRecruiter
    ? `recruiter: ${userMsg}`
    : isCareerCoach
    ? `career advice: ${userMsg}`
    : userMsg;
  try {
    const data = await executeAI(query, { systemPrompt, stream: true });
    const reply = (data as any).result?.reply || (data as any).result?.advice || (data as any).result?.search_strategy || '';
    if (reply) {
      const words = reply.split(' ');
      for (let i = 0; i < words.length; i++) {
        if (signal?.aborted) break;
        onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      return;
    }
    throw new Error('Empty stream response');
  } catch {
    // Fallback to old backend streaming
    const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
    const res = await fetch(`${API_BASE}/ai/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, systemPrompt, maxTokens: 600 }),
      signal,
    });
    if (!res.ok) throw new Error(`AI stream error: ${res.status}`);
    if (!res.body) throw new Error('No response body');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
        try {
          const json = JSON.parse(line.slice(6));
          const token = json.choices?.[0]?.delta?.content || json.chunk;
          if (token) onChunk(token);
        } catch { /* skip malformed chunks */ }
      }
    }
  }
}

// Assessment questions
export async function generateAssessmentQuestions(skill: string): Promise<any[]> {
  try {
    const data = await executeAI(`Generate skill assessment for ${skill}`, { skill, level: 'intermediate', count: 10 });
    const questions = (data as any).result?.questions;
    if (questions) return questions.slice(0, 10).map((q: any, i: number) => ({
      id: i + 1,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer || 0,
    }));
  } catch { /* fallthrough */ }

  // Fallback
  const prompt = `Generate exactly 10 MCQ questions for "${skill}".
Return ONLY a JSON array, no markdown, no explanation:
[{"question":"...","options":["A","B","C","D"],"correctAnswer":0}]
correctAnswer is 0-3 index. Mix difficulty levels.`;
  const reply = await sendAIMessage(
    [{ role: 'user', content: prompt }],
    'You are a technical assessment expert. Return only a valid JSON array, nothing else.',
    undefined,
    1200
  );
  const match = reply.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Invalid AI response');
  const questions = JSON.parse(match[0]);
  return questions.slice(0, 10).map((q: any, i: number) => ({
    id: i + 1,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
  }));
}

// Career roadmap
export async function generateCareerRoadmap(
  currentRole: string,
  targetRole: string,
  experience: string
): Promise<any> {
  try {
    const data = await executeAI('Career roadmap', {
      current_role: currentRole,
      target_role: targetRole,
      experience_years: parseInt(experience) || 3,
      current_skills: ['Python', 'JavaScript'],
    });
    const result = (data as any).result;
    if (result?.career_path) return result;
  } catch { /* fallthrough */ }

  // Fallback
  const prompt = `Career roadmap from "${currentRole}" to "${targetRole}", experience: ${experience}.
Return ONLY valid JSON:
{"currentRole":"...","targetRole":"...","totalTimeframe":"...","summary":"...","steps":[{"step":1,"title":"...","timeframe":"...","skills":["s1","s2","s3","s4"],"description":"...","milestone":"..."}],"finalTip":"..."}
Exactly 4 steps. Skills must be specific tech skills.`;
  const reply = await sendAIMessage(
    [{ role: 'user', content: prompt }],
    'You are a career coach. Return only valid JSON, no markdown.',
    undefined,
    1200
  );
  const match = reply.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Invalid response');
  return JSON.parse(match[0]);
}

// Generic AI call — CareerCoach, Recruiter backend fallback
export async function callAIWithFallback(
  messages: ChatMessage[],
  systemPrompt: string,
  signal?: AbortSignal
): Promise<string> {
  return sendAIMessage(messages, systemPrompt, signal, 600);
}
